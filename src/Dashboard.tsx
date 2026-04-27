import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, FileText, Image as ImageIcon,
  Clock, ChevronRight, Trash2, Check, AlertCircle, Info, X
} from 'lucide-react';
import { 
  collection, query, orderBy, onSnapshot, deleteDoc, doc 
} from 'firebase/firestore';
import { db, ensureAuth } from './lib/firebase';
import { ImageManager } from './components/ImageManager';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [newsletters, setNewsletters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isImageManagerOpen, setIsImageManagerOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);

  const notify = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  useEffect(() => {
    ensureAuth();
    
    // Fetch all newsletters without server-side ordering to ensure we don't miss documents
    // that might be missing the updatedAt field.
    const q = query(collection(db, 'newsletters'));
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort in memory instead
        const sorted = fetched.sort((a: any, b: any) => {
          const timeA = a.updatedAt?.toMillis() || 0;
          const timeB = b.updatedAt?.toMillis() || 0;
          return timeB - timeA;
        });
        setNewsletters(sorted);
        setLoading(false);
      },
      (error: any) => {
        console.error("Dashboard query failed:", error);
        if (error.message?.includes('client is offline')) {
          notify("Kunne ikke koble til databasen. Sjekk at du er på nett.", 'error');
        }
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'newsletters', id));
      setConfirmDeleteId(null);
      notify('Nyhetsbrev slettet', 'success');
    } catch (error) {
      console.error("Delete failed:", error);
      notify('Kunne ikke slette nyhetsbrevet', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      {/* Notifications */}
      <div className="fixed bottom-6 left-6 z-[200] flex flex-col gap-2">
        <AnimatePresence>
          {notifications.map(n => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={cn(
                "px-4 py-3 rounded-xl text-white text-xs font-medium flex items-center gap-3 shadow-lg min-w-[240px]",
                n.type === 'success' ? "bg-green-600" : n.type === 'error' ? "bg-red-600" : "bg-blue-900"
              )}
            >
              {n.type === 'success' ? <Check size={16} /> : n.type === 'error' ? <AlertCircle size={16} /> : <Info size={16} />}
              {n.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-2xl font-bold text-[#1E3A8A]">Dine nyhetsbrev</h1>
          <button 
            onClick={() => navigate('/editor/new')}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#1E3A8A] text-white rounded font-medium text-base hover:bg-[#1C3373] transition-all shadow-md shadow-blue-900/10"
          >
            <Plus size={20} />
            Nytt nyhetsbrev
          </button>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E3A8A]"></div>
          </div>
        ) : newsletters.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-lg border border-gray-200">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText size={40} className="text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Ingen nyhetsbrev funnet</h3>
            <p className="text-base text-gray-400 mt-2">Start med å lage ditt første nyhetsbrev!</p>
            <button 
              onClick={() => navigate('/editor/new')}
              className="mt-8 inline-flex items-center gap-2 px-8 py-3 bg-[#1E3A8A] text-white rounded font-bold hover:bg-[#1C3373] transition-all shadow-lg shadow-blue-900/10"
            >
              <Plus size={20} />
              Lag nytt
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {newsletters.map((nl) => (
              <motion.div 
                layout
                key={nl.id}
                onClick={() => navigate(`/editor/${nl.id}`)}
                className="group bg-white rounded-md border border-gray-200 p-8 hover:border-[#1E3A8A] transition-all cursor-pointer flex items-center justify-between relative"
              >
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-xl font-bold text-gray-900">{nl.name || 'Uten navn'}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span>
                      Sist endret: {nl.updatedAt ? (
                        `${nl.updatedAt.toDate().toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' })} ${nl.updatedAt.toDate().toLocaleDateString('no-NO', { day: '2-digit', month: '2-digit', year: 'numeric' })}`
                      ) : 'Skriver...'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-6 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    className="flex items-center gap-1.5 text-[#1E3A8A] font-medium text-lg hover:underline"
                  >
                    Rediger
                    <ChevronRight size={20} />
                  </button>
                  
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    {confirmDeleteId === nl.id ? (
                      <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-red-100 shadow-sm animate-in slide-in-from-right-2 duration-200">
                        <span className="text-xs font-bold text-red-600 px-2">Slette?</span>
                        <button 
                          onClick={() => handleDelete(nl.id)}
                          className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-bold"
                        >
                          Slett
                        </button>
                        <button 
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-3 py-1 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
                        >
                          Nei
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setConfirmDeleteId(nl.id)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        title="Slett"
                      >
                        <Trash2 size={24} />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <ImageManager 
        isOpen={isImageManagerOpen}
        onClose={() => setIsImageManagerOpen(false)}
        onSelect={(url) => {
          setIsImageManagerOpen(false);
        }}
      />
    </div>
  );
};
