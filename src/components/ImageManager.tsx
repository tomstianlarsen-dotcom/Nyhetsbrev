import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Upload, Trash2, Check, Loader2, Image as ImageIcon,
  Search, Grid, List as ListIcon
} from 'lucide-react';
import { 
  collection, addDoc, query, getDocs, deleteDoc, 
  doc, serverTimestamp, orderBy, onSnapshot 
} from 'firebase/firestore';
import { db, ensureAuth, auth } from '../lib/firebase';
import { toProxyImageUrl } from '../lib/imageUrls';
import { compressImageForUpload, fetchWithTimeout } from '../lib/compressImage';
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
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadAbortRef = useRef<AbortController | null>(null);

  const resetUploadState = () => {
    setUploading(false);
    setProgress(0);
    setUploadStatus(null);
    uploadAbortRef.current = null;
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const cancelUpload = () => {
    uploadAbortRef.current?.abort();
    resetUploadState();
    setError(null);
  };

  const handleClose = () => {
    cancelUpload();
    setConfirmDeleteId(null);
    onClose();
  };

  useEffect(() => {
    if (isOpen) return;
    cancelUpload();
  }, [isOpen]);

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

    const abortController = new AbortController();
    uploadAbortRef.current = abortController;

    setUploading(true);
    setProgress(10);
    setUploadStatus('Forbereder…');
    setError(null);

    try {
      const { contentBase64, contentType, compressedSize } = await compressImageForUpload(
        file,
        (msg) => setUploadStatus(msg),
        abortController.signal
      );

      if (abortController.signal.aborted) return;

      setProgress(45);
      setUploadStatus('Laster opp til server…');

      const basePath = import.meta.env.VITE_GITHUB_IMAGES_PATH || 'public/bilder';
      const filename = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;

      const response = await fetchWithTimeout('/api/github/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename,
          contentBase64,
          contentType,
          basePath,
        }),
        signal: abortController.signal,
        timeoutMs: 90_000,
      });

      if (abortController.signal.aborted) return;

      if (!response.ok) {
        let msg = response.statusText;
        try {
          const errorData = await response.json();
          msg = errorData.error || errorData.message || msg;
        } catch {}
        if (response.status === 401 || msg.includes('Bad credentials')) {
          throw new Error('Feil med GitHub-nøkkel (Bad credentials). Oppdater `VITE_GITHUB_TOKEN` i Vercel og redeploy.');
        }
        if (response.status === 413) {
          throw new Error('Bildet er for stort for opplasting. Prøv et mindre bilde.');
        }
        throw new Error(`GitHub upload feilet (${response.status}): ${msg}`);
      }

      const { url: githubUrl, githubPath } = await response.json();

      setProgress(85);
      setUploadStatus('Lagrer i biblioteket…');

      await addDoc(collection(db, 'images'), {
        url: githubUrl,
        githubPath: githubPath || undefined,
        name: file.name,
        size: compressedSize,
        type: contentType,
        uploadedAt: serverTimestamp(),
        userId: auth.currentUser?.uid || 'anonymous',
      });

      setProgress(100);
      setUploadStatus('Ferdig!');
      setTimeout(resetUploadState, 400);
    } catch (err) {
      if (abortController.signal.aborted) {
        resetUploadState();
        return;
      }
      console.error('Upload error:', err);
      const message =
        err instanceof Error && err.name === 'AbortError'
          ? 'Opplastingen tok for lang tid. Prøv igjen med et mindre bilde.'
          : err instanceof Error
            ? err.message
            : 'Kunne ikke behandle bildet. Prøv et mindre bilde.';
      setError(message);
      resetUploadState();
    }
  };

  const handleDelete = async (image: ImageAsset) => {
    await ensureAuth();
    setError(null);

    try {
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
        onClick={handleClose}
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
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600">
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

            {uploading ? (
              <button
                type="button"
                onClick={cancelUpload}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-xl text-sm font-medium hover:bg-gray-300 transition-all"
              >
                Avbryt opplasting
              </button>
            ) : (
              <label className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-xl text-sm font-medium hover:bg-blue-800 transition-all cursor-pointer shadow-lg shadow-blue-900/20">
                <Upload size={16} />
                Last opp bilde
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleUpload}
                />
              </label>
            )}
          </div>
        </div>

        {uploading && (
          <div className="px-6 py-2 bg-blue-50 border-b border-blue-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Loader2 className="animate-spin text-blue-600 flex-shrink-0" size={16} />
              <p className="text-xs text-blue-800 truncate">{uploadStatus || 'Laster opp…'}</p>
            </div>
            <button
              type="button"
              onClick={cancelUpload}
              className="text-xs font-medium text-blue-700 hover:text-blue-900 flex-shrink-0"
            >
              Avbryt
            </button>
          </div>
        )}

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
                    src={toProxyImageUrl(img.url)} 
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
                    <img src={toProxyImageUrl(img.url)} alt={img.name} className="w-full h-full object-cover" />
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
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Avbryt
          </button>
        </div>
      </motion.div>
    </div>
  );
};
