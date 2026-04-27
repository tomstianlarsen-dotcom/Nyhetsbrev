import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Info, AlertCircle, ArrowLeft } from 'lucide-react';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { NewsletterData, Section, ListItem, GridItem } from './types';
import { DEFAULT_DATA, COLORS } from './constants';
import { Sidebar } from './components/Sidebar';
import { Preview } from './components/Preview';
import { ImageManager } from './components/ImageManager';
import { cn } from './lib/utils';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db, ensureAuth, auth } from './lib/firebase';

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export const Editor: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<NewsletterData>(DEFAULT_DATA);
  const [name, setName] = useState('Nytt nyhetsbrev');
  const [loading, setLoading] = useState(id !== 'new');
  const [isSaving, setIsSaving] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [outlookCopied, setOutlookCopied] = useState(false);
  const [isImageManagerOpen, setIsImageManagerOpen] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [activeImageTarget, setActiveImageTarget] = useState<{
    type: 'header' | 'section' | 'list' | 'grid' | 'footer-left' | 'footer-right' | 'footer-full';
    sectionId?: string;
    itemId?: string;
  } | null>(null);
  const [libraryPlaceholderUrl, setLibraryPlaceholderUrl] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch global assets (Header and Placeholder)
    const fetchGlobalAssets = async () => {
      try {
        const imagesRef = collection(db, 'images');
        
        // Fetch Placeholder
        const pq = query(imagesRef, where('name', '==', 'placeholder.jpeg'), limit(1));
        const pSnap = await getDocs(pq);
        if (!pSnap.empty) {
          setLibraryPlaceholderUrl(pSnap.docs[0].data().url);
        }

        // Fetch Header and Footer for new newsletters
        if (id === 'new') {
          const hq = query(imagesRef, where('name', '==', 'Header.png'), limit(1));
          const hSnap = await getDocs(hq);
          if (!hSnap.empty) {
            const imgData = hSnap.docs[0].data();
            setData(prev => ({ 
              ...prev, 
              heroImage: imgData.url, 
              heroImageId: hSnap.docs[0].id,
              heroImageName: 'Header.png'
            }));
          }

          const fq = query(imagesRef, where('name', '==', 'Footer logos.png'), limit(1));
          const fSnap = await getDocs(fq);
          if (!fSnap.empty) {
            const imgData = fSnap.docs[0].data();
            setData(prev => ({ 
              ...prev, 
              footerLogoFull: imgData.url, 
              footerLogoFullId: fSnap.docs[0].id,
              footerLogoFullName: 'Footer logos.png'
            }));
          }
        }
      } catch (e: any) {
        if (e.message?.includes('client is offline')) {
          notify('Du er offline eller tilkoblingen er blokkert. Sjekk internett.', 'error');
        }
        console.error('Error fetching global assets:', e);
      }
    };

    if (id && id !== 'new') {
      const loadData = async () => {
        try {
          const docSnap = await getDoc(doc(db, 'newsletters', id));
          if (docSnap.exists()) {
            const docData = docSnap.data();
            let newsletterData = docData.data as NewsletterData;
            
            // Resolve image IDs if Base64 is missing
            const resolveImages = async (data: NewsletterData) => {
              const newData = { ...data };
              
              const fetchImage = async (imageId: string | undefined) => {
                if (!imageId) return null;
                try {
                  const imgSnap = await getDoc(doc(db, 'images', imageId));
                  return imgSnap.exists() ? imgSnap.data().url : null;
                } catch (err: any) {
                  if (err.message?.includes('client is offline')) return null;
                  throw err;
                }
              };

              if (newData.heroImageId && !newData.heroImage) {
                newData.heroImage = await fetchImage(newData.heroImageId) || '';
              }
              if (newData.footerLogoLeftId && !newData.footerLogoLeft) {
                newData.footerLogoLeft = await fetchImage(newData.footerLogoLeftId) || '';
              }
              if (newData.footerLogoRightId && !newData.footerLogoRight) {
                newData.footerLogoRight = await fetchImage(newData.footerLogoRightId) || '';
              }
              if (newData.footerLogoFullId && !newData.footerLogoFull) {
                newData.footerLogoFull = await fetchImage(newData.footerLogoFullId) || '';
              }

              newData.sections = await Promise.all(newData.sections.map(async s => {
                const newSec = { ...s };
                if (newSec.imageId && !newSec.image) {
                  newSec.image = await fetchImage(newSec.imageId) || '';
                }
                if (newSec.items) {
                  newSec.items = await Promise.all(newSec.items.map(async i => {
                    if (i.imageId && !i.image) {
                      return { ...i, image: await fetchImage(i.imageId) || '' };
                    }
                    return i;
                  }));
                }
                if (newSec.gridItems) {
                  newSec.gridItems = await Promise.all(newSec.gridItems.map(async i => {
                    if (i.imageId && !i.image) {
                      return { ...i, image: await fetchImage(i.imageId) || '' };
                    }
                    return i;
                  }));
                }
                return newSec;
              }));

              return newData;
            };

            newsletterData = await resolveImages(newsletterData);
            setData(newsletterData);
            setName(docData.name || 'Uten navn');
          } else {
            notify('Fant ikke nyhetsbrevet', 'error');
            navigate('/');
          }
        } catch (e: any) {
          console.error(e);
          if (e.message?.includes('client is offline')) {
            notify('Kunne ikke koble til databasen. Sjekk internett.', 'error');
          } else {
            notify('Kunne ikke laste data', 'error');
          }
        } finally {
          setLoading(false);
        }
      };
      loadData();
    } else {
      setData(DEFAULT_DATA);
      setLoading(false);
    }

    fetchGlobalAssets();
    ensureAuth();
  }, [id]);

  const notify = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 3000);
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const newsletterId = id === 'new' ? Math.random().toString(36).slice(2) : id;
      const docRef = doc(db, 'newsletters', newsletterId!);

      // Create a lean version of the data for storage (strip Base64 if imageId exists)
      const leanData = JSON.parse(JSON.stringify(data)) as NewsletterData;
      
      if (leanData.heroImageId) leanData.heroImage = '';
      if (leanData.footerLogoLeftId) leanData.footerLogoLeft = '';
      if (leanData.footerLogoRightId) leanData.footerLogoRight = '';
      if (leanData.footerLogoFullId) leanData.footerLogoFull = '';
      
      leanData.sections = leanData.sections.map(s => {
        if (s.imageId) s.image = '';
        if (s.items) {
          s.items = s.items.map(i => i.imageId ? { ...i, image: '' } : i);
        }
        if (s.gridItems) {
          s.gridItems = s.gridItems.map(i => i.imageId ? { ...i, image: '' } : i);
        }
        return s;
      });
      
      await setDoc(docRef, {
        id: newsletterId,
        name: name,
        userId: auth.currentUser?.uid || 'anonymous',
        data: leanData,
        updatedAt: serverTimestamp()
      }, { merge: true });

      notify('Lagret i skyen!', 'success');
      setIsSaving(false);
      
      if (id === 'new') {
        navigate(`/editor/${newsletterId}`);
      }
    } catch (e) {
      console.error(e);
      notify('Kunne ikke lagre', 'error');
      setIsSaving(false);
      throw e; // Re-throw so callers know it failed
    }
  };

  const handleReset = () => {
    setData(DEFAULT_DATA);
    notify('Nullstilt til standardoppsett!', 'info');
  };

  const handleDownloadJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nyhetsbrev-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUploadJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (parsed && Array.isArray(parsed.sections)) {
          setData(parsed);
          notify('Lastet opp!', 'success');
        } else {
          notify('Ugyldig fil', 'error');
        }
      } catch {
        notify('Kunne ikke lese filen', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportPDF = async () => {
    if (!previewRef.current) return;
    
    try {
      const element = previewRef.current;
      const editables = element.querySelectorAll('[contenteditable]');
      editables.forEach(el => (el as HTMLElement).contentEditable = 'false');
      
      // Create a clean clone for export to avoid visual glitches and remove unwanted elements
      const clone = element.cloneNode(true) as HTMLElement;
      
      // Remove symbols of editability or browser-only links
      clone.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));
      
      // Remove "View online" link which is irrelevant in PDF
      const onlineLinkRow = clone.querySelector('a[href*="/view/"]')?.closest('tr');
      if (onlineLinkRow) {
        onlineLinkRow.remove();
      }

      // Prepare clone styles for measurement
      const pdfWidthPx = 800; // Target PDF width
      const windowWidth = 800; // Match window width to PDF width to force desktop layout within the frame

      clone.style.boxShadow = 'none';
      clone.style.maxWidth = `${pdfWidthPx}px`;
      clone.style.width = `${pdfWidthPx}px`;
      clone.style.margin = '0';
      clone.style.padding = '0 20px'; // 20px padding on both sides
      clone.style.boxSizing = 'border-box';
      clone.style.position = 'fixed';
      clone.style.left = '0';
      clone.style.top = '0';
      clone.style.zIndex = '-1000';
      clone.style.backgroundColor = COLORS.background;
      clone.style.display = 'block';
      clone.style.textAlign = 'left';
      document.body.appendChild(clone);

      // Recursively force all elements to fill the 800px width and remove constraints
      const forceFullWidth = (el: HTMLElement) => {
        const style = window.getComputedStyle(el);
        
        // If it looks like it has a 600px constraint (width or maxWidth), break it
        if (
          el.tagName === 'TABLE' || 
          el.style.width === '600px' || 
          el.getAttribute('width') === '600' ||
          style.maxWidth === '600px' ||
          el.classList.contains('max-w-[600px]')
        ) {
          el.style.width = '100%';
          el.style.maxWidth = '100%';
          el.style.minWidth = '100%';
          if (el.tagName === 'TABLE') {
            el.setAttribute('width', '100%');
          }
        }
        
        // Ensure no inherited max-widths block the expansion
        if (style.maxWidth !== 'none' && style.maxWidth !== '100%') {
          el.style.maxWidth = '100%';
        }
        
        // Also ensure images don't get restricted
        if (el.tagName === 'IMG') {
          el.style.maxWidth = '100%';
        }

        Array.from(el.children).forEach(child => forceFullWidth(child as HTMLElement));
      };
      
      forceFullWidth(clone);

      // Force a reflow
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      clone.offsetHeight;

      // Calculate the exact height of the content
      const heightPx = clone.scrollHeight;
      
      // Convert pixels to inches (96 dpi) for jsPDF
      const heightIn = (heightPx + 2) / 96;
      const widthIn = pdfWidthPx / 96;

      const opt = {
        margin: 0,
        filename: `nyhetsbrev-${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true,
          logging: false,
          backgroundColor: COLORS.background,
          width: pdfWidthPx,
          height: heightPx,
          windowWidth: windowWidth,
          x: 0,
          y: 0,
          scrollX: 0,
          scrollY: 0
        },
        jsPDF: { 
          unit: 'in', 
          format: [widthIn, heightIn], 
          orientation: 'portrait' as const 
        }
      };
      
      const exporter = typeof html2pdf === 'function' ? html2pdf : (html2pdf as any).default;
      if (!exporter) throw new Error('PDF-biblioteket ble ikke lastet inn riktig.');

      await new Promise(resolve => setTimeout(resolve, 300));
      await exporter().set(opt).from(clone).toPdf().get('pdf').save();
      
      // Cleanup
      document.body.removeChild(clone);
      editables.forEach(el => (el as HTMLElement).contentEditable = 'true');
      
      notify('PDF generert!', 'success');
    } catch (e) {
      console.error(e);
      notify('PDF-eksport feilet', 'error');
    }
  };

  const handleCopyOutlook = async () => {
    if (!previewRef.current) return;
    
    // Auto-save before copying to ensure data is consistent
    try {
      await handleSave();
    } catch (e) {
      console.error('Auto-save before copy failed:', e);
    }

    try {
      // Create a clone to clean up
      const clone = previewRef.current.cloneNode(true) as HTMLElement;
      
      // Remove all elements that shouldn't be in the final email
      const editableElements = clone.querySelectorAll('[contenteditable]');
      editableElements.forEach(el => {
        el.removeAttribute('contenteditable');
        el.removeAttribute('suppresscontenteditablewarning');
        // @ts-ignore
        el.style.outline = 'none';
        // @ts-ignore
        el.style.userSelect = 'text';
      });

      // Clean up images for Outlook
      clone.querySelectorAll('img').forEach(img => {
        img.removeAttribute('onclick');
        img.removeAttribute('onclick'); // redundancy for safety
        img.removeAttribute('referrerpolicy');
        img.style.cursor = 'default';
        img.style.border = '0';
        img.style.outline = 'none';
        img.style.textDecoration = 'none';
        // Force width for Outlook
        const widthAttr = img.getAttribute('width');
        if (widthAttr) {
          img.style.width = widthAttr + 'px';
        }
      });

      // Clean up interactive elements
      clone.querySelectorAll('.section-actions, .item-actions, button').forEach(el => el.remove());

      // Helper to normalize colors for bgcolor attribute
      const normalizeColor = (color: string) => {
        if (!color) return null;
        if (color.startsWith('#')) return color;
        if (color.startsWith('rgb')) {
          const match = color.match(/\d+/g);
          if (match && match.length >= 3) {
            const r = parseInt(match[0]);
            const g = parseInt(match[1]);
            const b = parseInt(match[2]);
            // If it's pure white, convert to our almost-white
            if (r === 255 && g === 255 && b === 255) return '#feffff';
            return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
          }
        }
        return color;
      };

      // Ensure all tables and cells in the clone have proper email-friendly attributes
      clone.querySelectorAll('table, td').forEach(el => {
        const element = el as HTMLElement;
        const bg = normalizeColor(element.style.backgroundColor);
        
        if (bg) {
          element.setAttribute('bgcolor', bg);
        } else if (element.tagName === 'TD' && !element.getAttribute('bgcolor')) {
          const parentTable = element.closest('table');
          if (parentTable) {
            const parentBg = normalizeColor(parentTable.style.backgroundColor) || parentTable.getAttribute('bgcolor');
            if (parentBg === '#ffffff' || parentBg === '#feffff') {
              element.setAttribute('bgcolor', parentBg);
            }
          }
        }
        
        if (el.tagName === 'TABLE') {
          const table = el as HTMLTableElement;
          table.setAttribute('role', 'presentation');
          table.setAttribute('cellpadding', '0');
          table.setAttribute('cellspacing', '0');
          table.setAttribute('border', '0');
          table.style.borderCollapse = 'collapse';
          // @ts-ignore
          table.style.msoTableLspace = '0pt';
          // @ts-ignore
          table.style.msoTableRspace = '0pt';
          
          // Force 600px width ONLY for the top-level main container tables
          // Nested tables should remain 100% or their specific widths
          if (table.style.maxWidth === '600px') {
             table.setAttribute('width', '600');
             table.style.width = '600px';
          }

          // Ensure background colors are applied as attributes for legacy clients
          const tableBg = normalizeColor(table.style.backgroundColor);
          if (tableBg) {
            table.setAttribute('bgcolor', tableBg);
          }
        }
      });

      const html = clone.innerHTML;

      const fragment = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <style>
    /* Prevent Windows 10 Mail from resizing images */
    img { -ms-interpolation-mode: bicubic; }
    /* Force mobile apps to show text at regular size */
    body { width: 100% !important; -webkit-text-size-adjust: 100% !important; -ms-text-size-adjust: 100% !important; margin: 0; padding: 0; }
    /* Ensure links aren't automatically changed to blue */
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
    
    @media only screen and (max-width: 600px) {
      .full-width { width: 100% !important; height: auto !important; }
      .mobile-padding { padding: 10px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${COLORS.background};">
<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="${COLORS.background}" style="background-color: ${COLORS.background}; width: 100%;">
  <tr>
    <td align="center" style="padding: 20px 0; background-color: ${COLORS.background};" bgcolor="${COLORS.background}">
      <!--[if mso]>
      <table role="presentation" width="600" border="0" cellspacing="0" cellpadding="0" align="center" bgcolor="${COLORS.background}" style="width:600px; background-color: ${COLORS.background};">
        <tr>
          <td align="center" style="padding: 0; background-color: ${COLORS.background};" bgcolor="${COLORS.background}">
      <![endif]-->
      <div style="max-width: 600px; margin: 0 auto; text-align: left; background-color: ${COLORS.background}; font-family: Arial, Helvetica, sans-serif;">
        <!--StartFragment-->
        ${html}
        <!--EndFragment-->
      </div>
      <!--[if mso]>
          </td>
        </tr>
      </table>
      <![endif]-->
    </td>
  </tr>
</table>
</body>
</html>`;
      const blob = new Blob([fragment], { type: 'text/html' });
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': blob,
          'text/plain': new Blob([fragment], { type: 'text/plain' })
        })
      ]);
      setOutlookCopied(true);
      setTimeout(() => setOutlookCopied(false), 2000);
      notify('Kopiert til utklippstavlen!', 'success');
    } catch (e) {
      console.error('Kopiering feilet:', e);
      notify('Kunne ikke kopiere. Prøv en annen nettleser.', 'error');
    }
  };

  const openImageManager = (target: { type: 'header' | 'section' | 'list' | 'grid' | 'footer-left' | 'footer-right' | 'footer-full', sectionId?: string, itemId?: string }) => {
    setActiveImageTarget(target);
    setIsImageManagerOpen(true);
  };

  const handleImageSelect = (id: string, url: string, name: string) => {
    if (!activeImageTarget) return;
    const { type, sectionId, itemId } = activeImageTarget;

    if (type === 'header') {
      setData(prev => ({ ...prev, heroImage: url, heroImageId: id, heroImageName: name }));
    } else if (type === 'footer-left') {
      setData(prev => ({ ...prev, footerLogoLeft: url, footerLogoLeftId: id, footerLogoLeftName: name }));
    } else if (type === 'footer-right') {
      setData(prev => ({ ...prev, footerLogoRight: url, footerLogoRightId: id, footerLogoRightName: name }));
    } else if (type === 'footer-full') {
      setData(prev => ({ ...prev, footerLogoFull: url, footerLogoFullId: id, footerLogoFullName: name }));
    } else if (type === 'section' && sectionId) {
      updateSection(sectionId, { image: url, imageId: id, imageName: name });
    } else if (type === 'list' && sectionId && itemId) {
      updateListItem(sectionId, itemId, { image: url, imageId: id, imageName: name });
    } else if (type === 'grid' && sectionId && itemId) {
      updateGridItem(sectionId, itemId, { image: url, imageId: id, imageName: name });
    }

    setIsImageManagerOpen(false);
    setActiveImageTarget(null);
  };

  const updateSection = (id: string, updates: Partial<Section>) => {
    setData(prev => ({
      ...prev,
      sections: prev.sections.map(s => s.id === id ? { ...s, ...updates } : s)
    }));
  };

  const updateListItem = (sectionId: string, itemId: string, updates: Partial<ListItem>) => {
    setData(prev => ({
      ...prev,
      sections: prev.sections.map(s => s.id === sectionId ? {
        ...s,
        items: (s.items || []).map(i => i.id === itemId ? { ...i, ...updates } : i)
      } : s)
    }));
  };

  const updateGridItem = (sectionId: string, itemId: string, updates: Partial<GridItem>) => {
    setData(prev => ({
      ...prev,
      sections: prev.sections.map(s => s.id === sectionId ? {
        ...s,
        gridItems: (s.gridItems || []).map(i => i.id === itemId ? { ...i, ...updates } : i)
      } : s)
    }));
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden font-sans">
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

      <Sidebar 
        data={data} 
        setData={setData}
        name={name}
        setName={setName}
        handleSave={handleSave}
        isSaving={isSaving}
        handleReset={handleReset}
        handleDownloadJSON={handleDownloadJSON}
        handleUploadJSON={handleUploadJSON}
        handleExportPDF={handleExportPDF}
        handleCopyOutlook={handleCopyOutlook}
        outlookCopied={outlookCopied}
        previewRef={previewRef}
        onOpenImageManager={openImageManager}
        activeSectionId={activeSectionId}
        setActiveSectionId={setActiveSectionId}
      />

      <main className="flex-1 overflow-y-auto p-12 pt-24 flex flex-col items-center" style={{ backgroundColor: COLORS.background }}>
        <Preview 
          data={data} 
          previewRef={previewRef} 
          onlineUrl={(() => {
            if (id === 'new') return '#';
            const origin = window.location.origin;
            // Automatically switch from dev to pre to ensure recipients don't get auth wall
            const publicOrigin = origin.replace('-dev-', '-pre-');
            return `${publicOrigin}/view/${id}?view=browser`;
          })()}
          onUpdateSection={updateSection}
          onUpdateListItem={updateListItem}
          onUpdateGridItem={updateGridItem}
          onUpdateData={(updates) => setData(prev => ({ ...prev, ...updates }))}
          onOpenImageManager={openImageManager}
          libraryPlaceholderUrl={libraryPlaceholderUrl || undefined}
          activeSectionId={activeSectionId}
          setActiveSectionId={setActiveSectionId}
        />
      </main>

      <ImageManager 
        isOpen={isImageManagerOpen}
        onClose={() => setIsImageManagerOpen(false)}
        onSelect={handleImageSelect}
      />
    </div>
  );
}
