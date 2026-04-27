import React, { useState, useEffect } from 'react';
import { 
  X, Upload, Trash2, Check, Loader2, Image as ImageIcon,
  Search, Grid, List as ListIcon
} from 'lucide-react';
import { 
  ref, uploadBytesResumable, getDownloadURL, deleteObject 
} from 'firebase/storage';
import { 
  collection, addDoc, query, getDocs, deleteDoc, 
  doc, serverTimestamp, orderBy, onSnapshot 
} from 'firebase/firestore';
import { storage, db, ensureAuth, auth } from '../lib/firebase';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface ImageAsset {
  id: string;
  url: string;
  name: string;
  uploadedAt: any;
  size: number;
  type: string;
  storagePath?: string;
  githubPath?: string;
}

interface ImageManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (id: string, url: string, name: string) => void;
}

export const ImageManager: React.FC<ImageManagerProps> = ({ isOpen, onClose, onSelect }) => {
  const [images, setImages] = useState<ImageAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    
    ensureAuth();

    const q = query(
      collection(db, 'images'),
      orderBy('uploadedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const imgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ImageAsset[];
      setImages(imgs);
      setLoading(false);
      setError(null);
    }, (err) => {
      console.error("Error fetching images:", err);
      setError("Kunne ikke hente bilder fra databasen.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isOpen]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await ensureAuth();

    setUploading(true);
    setProgress(20);

    try {
      // Step 1: Resize on client to stay under GitHub and bandwidth limits
      setError(null);
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            // Max dimensions for newsletter
            const MAX_WIDTH = 1200; // Increased a bit for better quality on high-res displays
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);

            const isPng = file.type === 'image/png';
            const dataUrl = isPng 
              ? canvas.toDataURL('image/png') 
              : canvas.toDataURL('image/jpeg', 0.85); 
            resolve(dataUrl);
          };
          img.onerror = reject;
          img.src = event.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      setProgress(40);

      // Step 2: Upload to GitHub
      const token = import.meta.env.VITE_GITHUB_TOKEN;
      const owner = import.meta.env.VITE_GITHUB_OWNER;
      const repo = import.meta.env.VITE_GITHUB_REPO;
      const basePath = import.meta.env.VITE_GITHUB_IMAGES_PATH || 'public/bilder';
      const customDomain = import.meta.env.VITE_GITHUB_PAGES_DOMAIN;

      if (!token || !owner || !repo) {
        throw new Error('GitHub-konfigurasjon mangler (Token, Owner eller Repo)');
      }

      const filename = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
      const path = `${basePath}/${filename}`.replace(/\/+/g, '/');
      
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: `Add newsletter image: ${filename}`,
            content: base64.split(',')[1], // strip data URL prefix
          }),
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`GitHub upload failed: ${errorData.message || response.statusText}`);
      }

      // Use GitHub Pages URL instead of raw.githubusercontent.com
      // Pattern: https://<owner>.github.io/<repo>/<path>
      // Or use custom domain if provided
      const githubUrl = customDomain 
        ? `${customDomain.replace(/\/$/, '')}/${path}`
        : `https://${owner}.github.io/${repo}/${path}`;
      
      setProgress(80);

      // Step 3: Save metadata to Firestore
      await addDoc(collection(db, 'images'), {
        url: githubUrl, 
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: serverTimestamp(),
        userId: auth.currentUser?.uid || 'anonymous',
        githubPath: path // Save path for potential deletion
      });

      setProgress(100);
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
      }, 500);
    } catch (err) {
      console.error("Upload error:", err);
      setError("Kunne ikke behandle bildet. Prøv et mindre bilde.");
      setUploading(false);
    }
  };

  const handleDelete = async (image: ImageAsset) => {
    await ensureAuth();
    setError(null);

    try {
      // If it's stored on GitHub, we SHOULD try to delete it, but it's complex because we need the SHA
      // For now, we mainly focus on removing it from Firestore so it doesn't show up in the app.
      // If we really want to delete from GitHub, we first need to GET the file to get the SHA.
      
      const token = import.meta.env.VITE_GITHUB_TOKEN;
      const owner = import.meta.env.VITE_GITHUB_OWNER;
      const repo = import.meta.env.VITE_GITHUB_REPO;

      if (image.githubPath && token && owner && repo) {
        try {
          // 1. Get the file to get its SHA
          const getRes = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/contents/${image.githubPath}`,
            {
              headers: { 'Authorization': `Bearer ${token}` }
            }
          );
          
          if (getRes.ok) {
            const fileData = await getRes.json();
            const sha = fileData.sha;
            
            // 2. Delete the file
            await fetch(
              `https://api.github.com/repos/${owner}/${repo}/contents/${image.githubPath}`,
              {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  message: `Delete newsletter image: ${image.name}`,
                  sha: sha
                }),
              }
            );
          }
        } catch (githubErr) {
          console.error("Error deleting from GitHub:", githubErr);
          // We continue to delete from Firestore even if GitHub deletion fails
        }
      }

      await deleteDoc(doc(db, 'images', image.id));
      setConfirmDeleteId(null);
    } catch (err) {
      console.error("Delete error:", err);
      setError("Kunne ikke slette bildet.");
    }
  };

  const filteredImages = images.filter(img => 
    img.name.toLowerCase().includes(search.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <ImageIcon size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Bildebibliotek</h2>
              <p className="text-xs text-gray-500">Last opp og administrer dine bilder</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text"
              placeholder="Søk i bilder..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex bg-white border border-gray-200 rounded-lg p-1 mr-2">
              <button 
                onClick={() => setViewMode('grid')}
                className={cn("p-1.5 rounded-md transition-all", viewMode === 'grid' ? "bg-blue-50 text-blue-600" : "text-gray-400 hover:text-gray-600")}
              >
                <Grid size={16} />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={cn("p-1.5 rounded-md transition-all", viewMode === 'list' ? "bg-blue-50 text-blue-600" : "text-gray-400 hover:text-gray-600")}
              >
                <ListIcon size={16} />
              </button>
            </div>

            <label className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-xl text-sm font-medium hover:bg-blue-800 transition-all cursor-pointer shadow-lg shadow-blue-900/20">
              <Upload size={16} />
              Last opp bilde
              <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
            </label>
          </div>
        </div>

        {uploading && (
          <div className="h-1 bg-gray-100 w-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-blue-600"
            />
          </div>
        )}

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 animate-in slide-in-from-top-2">
            <X size={16} className="flex-shrink-0" />
            <p className="text-xs font-medium">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto p-1 hover:bg-red-100 rounded-md transition-colors">
              <X size={14} />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center text-gray-400 gap-3">
              <Loader2 className="animate-spin" size={32} />
              <p className="text-sm">Henter bilder...</p>
            </div>
          ) : filteredImages.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-gray-400 gap-4 border-2 border-dashed border-gray-100 rounded-2xl">
              <div className="p-4 bg-gray-50 rounded-full">
                <ImageIcon size={48} className="text-gray-200" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-900">Ingen bilder funnet</p>
                <p className="text-xs">Last opp ditt første bilde for å komme i gang</p>
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredImages.map((img) => (
                <motion.div 
                  layout
                  key={img.id}
                  className="group relative aspect-square bg-gray-50 rounded-xl overflow-hidden border border-gray-100 hover:border-blue-500 transition-all cursor-pointer"
                  onClick={() => onSelect(img.id, img.url, img.name)}
                >
                  <img 
                    src={img.url} 
                    alt={img.name} 
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {confirmDeleteId === img.id ? (
                      <div className="flex flex-col gap-2 p-2 bg-white rounded-xl shadow-xl animate-in fade-in zoom-in duration-200">
                        <p className="text-[10px] font-bold text-gray-900 text-center">Slette?</p>
                        <div className="flex gap-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(img); }}
                            className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            title="Bekreft sletting"
                          >
                            <Check size={14} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                            className="p-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                            title="Avbryt"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button 
                          onClick={(e) => { e.stopPropagation(); onSelect(img.id, img.url, img.name); }}
                          className="p-2 bg-white text-blue-600 rounded-lg hover:scale-110 transition-transform"
                        >
                          <Check size={18} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(img.id); }}
                          className="p-2 bg-white text-red-600 rounded-lg hover:scale-110 transition-transform"
                        >
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                    <p className="text-[10px] text-white truncate font-medium">{img.name}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredImages.map((img) => (
                <div 
                  key={img.id}
                  className="flex items-center gap-4 p-3 bg-white border border-gray-100 rounded-xl hover:border-blue-500 hover:bg-blue-50/30 transition-all group cursor-pointer"
                  onClick={() => onSelect(img.id, img.url, img.name)}
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-50">
                    <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{img.name}</p>
                    <p className="text-xs text-gray-500">{(img.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {confirmDeleteId === img.id ? (
                      <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-red-100 shadow-sm animate-in slide-in-from-right-2 duration-200">
                        <span className="text-[10px] font-bold text-red-600 px-1">Slette?</span>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDelete(img); }}
                          className="p-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                        >
                          <Check size={14} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                          className="p-1.5 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <button 
                          onClick={(e) => { e.stopPropagation(); onSelect(img.id, img.url, img.name); }}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          <Check size={18} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(img.id); }}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <p className="text-xs text-gray-500">{filteredImages.length} bilder i biblioteket</p>
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Avbryt
          </button>
        </div>
      </motion.div>
    </div>
  );
};
