import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Trash2, ChevronUp, ChevronDown, Image as ImageIcon, 
  Type, Layout, List, Square, Columns, Copy, Check, 
  Palette, RefreshCw, FileText, FileDown, Upload,
  Save, FolderOpen, ArrowLeft
} from 'lucide-react';
import { NewsletterData, Section, SectionType, Contact, ListItem, GridItem } from '../types';
import { cn } from '../lib/utils';
import { ImageManager } from './ImageManager';

interface SidebarProps {
  data: NewsletterData;
  setData: React.Dispatch<React.SetStateAction<NewsletterData>>;
  name: string;
  setName: (name: string) => void;
  handleSave: () => void;
  isSaving?: boolean;
  handleReset: () => void;
  handleDownloadJSON: () => void;
  handleUploadJSON: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleExportPDF: () => void;
  handleCopyOutlook: () => void;
  outlookCopied: boolean;
  previewRef: React.RefObject<HTMLDivElement | null>;
  onOpenImageManager: (target: { type: 'header' | 'section' | 'list' | 'grid' | 'footer-left' | 'footer-right', sectionId?: string, itemId?: string }) => void;
  activeSectionId: string | null;
  setActiveSectionId: (id: string | null) => void;
}

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{children}</div>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input
    {...props}
    className={cn("w-full p-2 border border-gray-200 rounded-md text-base bg-white placeholder-gray-400 focus:ring-1 focus:ring-blue-900 focus:border-blue-900 outline-none transition-all", props.className)}
  />
);

const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
  <textarea
    {...props}
    className={cn("w-full p-2 border border-gray-200 rounded-md text-base bg-white placeholder-gray-400 focus:ring-1 focus:ring-blue-900 focus:border-blue-900 outline-none transition-all resize-none", props.className)}
  />
);

const ImageTip: React.FC<{ url?: string }> = ({ url }) => {
  const isBase64 = url && url.startsWith('data:image/');
  return !isBase64 ? <p className="text-xs text-gray-400 mt-1 italic">Tips: Last opp bilde for best resultat i Outlook. Bruk gjerne dobbel oppløsning (f.eks. 1200px bredde for toppbilder) for maksimal skarphet.</p> : null;
};

export const Sidebar: React.FC<SidebarProps> = ({
  data, setData, name, setName, handleSave, isSaving, handleReset, handleDownloadJSON, 
  handleUploadJSON, handleExportPDF, handleCopyOutlook, outlookCopied, previewRef, onOpenImageManager,
  activeSectionId, setActiveSectionId
}) => {
  const navigate = useNavigate();
  const [saveMenuOpen, setSaveMenuOpen] = useState(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const appVersion =
    typeof __APP_VERSION__ === 'string' && __APP_VERSION__.trim() ? __APP_VERSION__ : '';

  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    if (activeSectionId && sectionRefs.current[activeSectionId]) {
      sectionRefs.current[activeSectionId]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activeSectionId]);

  const saveMenuRef = useRef<HTMLDivElement>(null);
  const addMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (saveMenuRef.current && !saveMenuRef.current.contains(e.target as Node)) setSaveMenuOpen(false);
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) setAddMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const [confirmDeleteSectionId, setConfirmDeleteSectionId] = useState<string | null>(null);

  const setField = (field: keyof NewsletterData, value: any) => setData(prev => ({ ...prev, [field]: value }));
  
  const updateSection = (id: string, updates: Partial<Section>) => {
    setData(prev => ({ ...prev, sections: prev.sections.map(s => s.id === id ? { ...s, ...updates } : s) }));
  };

  const addSection = (type: SectionType) => {
    const id = Math.random().toString(36).slice(2);
    const base: Section = { 
      id, 
      type, 
      title: type === 'full-image' ? '' : 'Overskrift', 
      content: type === 'full-image' || type === 'list' ? '' : 'Lorem ipsum dolor sit amet.', 
      backgroundColor: 'white' 
    };
    
    let extras: Partial<Section> = {};
    if (type === 'image-text') {
      extras = { image: `https://picsum.photos/seed/${id}/400/300`, imagePosition: 'left' };
    } else if (type === 'full-image') {
      extras = { image: `https://picsum.photos/seed/${id}/600/300` };
    } else if (type === 'list') {
      extras = { items: [{ id: 'i' + Date.now(), name: 'Navn', bio: 'Lorem ipsum.', image: `https://picsum.photos/seed/${id}/100/100` }] };
    } else if (type === 'grid') {
      extras = { gridItems: [
        { id: 'g1' + Date.now(), title: 'Overskrift', content: 'Lorem ipsum.', image: `https://picsum.photos/seed/g1${id}/400/300`, linkText: 'Les mer', linkUrl: '#' },
        { id: 'g2' + Date.now(), title: 'Overskrift', content: 'Lorem ipsum.', image: `https://picsum.photos/seed/g2${id}/400/300`, linkText: 'Les mer', linkUrl: '#' },
      ]};
    }

    setData(prev => ({ ...prev, sections: [...prev.sections, { ...base, ...extras }] }));
    setActiveSectionId(id);
  };

  const removeSection = (id: string) => setData(prev => ({ ...prev, sections: prev.sections.filter(s => s.id !== id) }));

  const moveSection = (index: number, dir: 'up' | 'down') => {
    const arr = [...data.sections];
    const to = dir === 'up' ? index - 1 : index + 1;
    if (to < 0 || to >= arr.length) return;
    [arr[index], arr[to]] = [arr[to], arr[index]];
    setData(prev => ({ ...prev, sections: arr }));
  };

  const toggleSection = (id: string) => {
    setActiveSectionId(activeSectionId === id ? null : id);
  };

  const addListItem = (sectionId: string) => {
    const id = 'i' + Date.now();
    setData(prev => ({ ...prev, sections: prev.sections.map(s => s.id === sectionId ? { ...s, items: [...(s.items || []), { id, name: 'Navn', bio: 'Lorem ipsum.', image: `https://picsum.photos/seed/${id}/100/100` }] } : s) }));
  };

  const updateListItem = (sectionId: string, itemId: string, updates: Partial<ListItem>) => {
    setData(prev => ({ ...prev, sections: prev.sections.map(s => s.id === sectionId ? { ...s, items: (s.items || []).map(i => i.id === itemId ? { ...i, ...updates } : i) } : s) }));
  };

  const removeListItem = (sectionId: string, itemId: string) => {
    setData(prev => ({ ...prev, sections: prev.sections.map(s => s.id === sectionId ? { ...s, items: (s.items || []).filter(i => i.id !== itemId) } : s) }));
  };

  const addGridItem = (sectionId: string) => {
    const id = 'g' + Date.now();
    setData(prev => ({ ...prev, sections: prev.sections.map(s => s.id === sectionId ? { ...s, gridItems: [...(s.gridItems || []), { id, title: 'Overskrift', content: 'Lorem ipsum.', image: `https://picsum.photos/seed/${id}/400/300`, linkText: 'Les mer', linkUrl: '#' }] } : s) }));
  };

  const updateGridItem = (sectionId: string, itemId: string, updates: Partial<GridItem>) => {
    setData(prev => ({ ...prev, sections: prev.sections.map(s => s.id === sectionId ? { ...s, gridItems: (s.gridItems || []).map(i => i.id === itemId ? { ...i, ...updates } : i) } : s) }));
  };

  const removeGridItem = (sectionId: string, itemId: string) => {
    setData(prev => ({ ...prev, sections: prev.sections.map(s => s.id === sectionId ? { ...s, gridItems: (s.gridItems || []).filter(i => i.id !== itemId) } : s) }));
  };

  const addContact = () => setData(prev => ({ ...prev, footerContacts: [...prev.footerContacts, { id: 'fc' + Date.now(), name: 'Navn', role: 'Rolle', email: 'epost@oslo.no' }] }));
  const updateContact = (id: string, updates: Partial<Contact>) => setData(prev => ({ ...prev, footerContacts: prev.footerContacts.map(c => c.id === id ? { ...c, ...updates } : c) }));
  const removeContact = (id: string) => setData(prev => ({ ...prev, footerContacts: prev.footerContacts.filter(c => c.id !== id) }));

  return (
    <div className="w-[380px] bg-white border-r border-gray-200 flex flex-col h-screen overflow-hidden flex-shrink-0">
      {/* Toolbar */}
      <div className="p-4 border-b border-gray-200 bg-gray-50/50 space-y-4">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate('/')}
            className="text-xs font-bold text-blue-900 hover:text-blue-800 transition-colors"
          >
            Tilbake
          </button>
          <button 
            onClick={handleReset}
            className="text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-1 transition-colors"
          >
            <RefreshCw size={12} className="opacity-70" />
            Nullstill
          </button>
        </div>

        <div>
          <Label>Tittel</Label>
          <Input 
            value={name || ''} 
            onChange={e => setName(e.target.value)} 
            placeholder="Nyhetsbrev tittel"
            className="bg-white"
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className={cn(
              "px-4 py-2 rounded-lg text-base font-medium border transition-all",
              isSaving 
                ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed" 
                : "bg-white text-blue-900 border-blue-900 hover:bg-blue-50"
            )}
          >
            {isSaving ? 'Lagrer...' : 'Lagre'}
          </button>

          <div className="flex gap-2">
            <button 
              onClick={handleExportPDF}
              className="px-4 py-2 bg-white border border-blue-900 rounded-lg text-base font-medium text-blue-900 hover:bg-blue-50 transition-colors"
            >
              PDF
            </button>

            <button 
              onClick={handleCopyOutlook}
              className={cn(
                "px-4 py-2 rounded-lg text-base font-bold transition-all border",
                outlookCopied 
                  ? "bg-green-600 text-white border-green-600" 
                  : "bg-blue-900 text-white border-blue-900 hover:bg-blue-800 shadow-md shadow-blue-900/20"
              )}
            >
              {outlookCopied ? 'Kopiert!' : 'Outlook'}
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
        {/* Header section */}
        <div ref={el => sectionRefs.current['header'] = el} className="border-b border-gray-100 pb-6">
          <div 
            className="flex justify-between items-center mb-3 cursor-pointer group/header"
            onClick={() => toggleSection('header')}
          >
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest group-hover/header:text-blue-900 transition-colors">Header</span>
            <div className="p-1 hover:bg-gray-100 rounded-md text-gray-400 transition-colors">
              {activeSectionId === 'header' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </div>
          {activeSectionId === 'header' && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-1">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <Label>Header bilde</Label>
                  <button 
                    onClick={() => onOpenImageManager({ type: 'header' })}
                    className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                    title="Velg bilde fra bibliotek"
                  >
                    <ImageIcon size={16} />
                  </button>
                </div>
                <div className="flex items-center gap-2 p-2 border border-gray-200 rounded-md bg-gray-50 text-base text-gray-600">
                  <ImageIcon size={14} className="text-gray-400" />
                  <span className="truncate flex-1">{data.heroImageName || (data.heroImage ? 'Bilde valgt' : 'Ingen bilde valgt')}</span>
                </div>
                <div className="mt-2 space-y-2">
                  <div><Label>Byline</Label><Input value={data.byline || ''} onChange={e => setField('byline', e.target.value)} placeholder="Tittel/Undertittel" /></div>
                  <div><Label>Alt-tekst</Label><Input value={data.heroImageAlt || ''} onChange={e => setField('heroImageAlt', e.target.value)} placeholder="Beskriv bildet for skjermlesere" /></div>
                  <div><Label>Fotokreditt</Label><Input value={data.heroImageCredit || ''} onChange={e => setField('heroImageCredit', e.target.value)} placeholder="Fotografens navn" /></div>
                </div>
                <ImageTip url={data.heroImage} />
              </div>
            </div>
          )}
        </div>

        {/* Sections */}
        <div className="space-y-4">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Innholdsseksjoner</span>
          {data.sections.map((section, index) => {
            const isExpanded = activeSectionId === section.id;
            const TypeIcon = section.type === 'text' ? Type : section.type === 'image-text' ? Layout : section.type === 'list' ? List : section.type === 'full-image' ? Square : Columns;

            return (
              <div 
                key={section.id} 
                ref={el => sectionRefs.current[section.id] = el}
                className={cn(
                  "border rounded-xl bg-white shadow-sm overflow-hidden transition-all hover:shadow-md",
                  isExpanded ? "border-blue-900 ring-1 ring-blue-900/10" : "border-gray-200"
                )}
              >
                <div 
                  className="flex items-center gap-2 p-2 bg-gray-50/50 cursor-pointer group/sec"
                  onClick={() => toggleSection(section.id)}
                >
                  <div className="p-1 hover:bg-gray-200 rounded-md text-gray-400 transition-colors">
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>
                  <TypeIcon size={14} className="text-gray-400" />
                  <input
                    value={section.title || ''}
                    onClick={(e) => e.stopPropagation()}
                    onFocus={() => {
                      if (!isExpanded) setActiveSectionId(section.id);
                    }}
                    onChange={e => updateSection(section.id, { title: e.target.value })}
                    placeholder={section.type === 'full-image' ? 'Bildebeskrivelse' : 'Seksjonstittel'}
                    className="flex-1 text-base font-medium text-blue-900 bg-transparent border-none focus:ring-0 outline-none px-1 py-0.5 min-w-0"
                  />
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      {confirmDeleteSectionId === section.id ? (
                        <div className="flex items-center bg-red-50 rounded-md overflow-hidden">
                          <button 
                            onClick={() => {
                              removeSection(section.id);
                              setConfirmDeleteSectionId(null);
                            }}
                            className="px-2 py-1 text-[10px] font-bold text-red-600 hover:bg-red-100 transition-colors"
                          >
                            Slett
                          </button>
                          <button 
                            onClick={() => setConfirmDeleteSectionId(null)}
                            className="px-2 py-1 text-[10px] font-bold text-gray-400 hover:bg-gray-100 transition-colors"
                          >
                            X
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => updateSection(section.id, { backgroundColor: section.backgroundColor === 'blue' ? 'white' : 'blue' })}
                            title="Bytt bakgrunnsfarge"
                            className={cn("p-1.5 rounded-md transition-colors", section.backgroundColor === 'blue' ? "text-blue-600 bg-blue-50" : "text-gray-300 hover:bg-gray-200")}
                          >
                            <Palette size={14} />
                          </button>
                          <button onClick={() => moveSection(index, 'up')} disabled={index === 0} className="p-1.5 hover:bg-gray-200 rounded-md disabled:opacity-20 text-gray-400 transition-colors">
                            <ChevronUp size={14} />
                          </button>
                          <button onClick={() => moveSection(index, 'down')} disabled={index === data.sections.length - 1} className="p-1.5 hover:bg-gray-200 rounded-md disabled:opacity-20 text-gray-400 transition-colors">
                            <ChevronDown size={14} />
                          </button>
                          <button onClick={() => setConfirmDeleteSectionId(section.id)} className="p-1.5 hover:bg-red-50 rounded-md text-red-400 hover:text-red-600 transition-colors" title="Slett seksjon">
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                </div>

                {isExpanded && (
                  <div className="p-4 space-y-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-1">
                    {section.type !== 'list' && section.type !== 'grid' && section.type !== 'full-image' && (
                      <div>
                        <Label>Innholdstekst</Label>
                        <Textarea value={section.content || ''} onChange={e => updateSection(section.id, { content: e.target.value })} placeholder="Innholdstekst" rows={4} />
                      </div>
                    )}

                    {section.type !== 'list' && section.type !== 'grid' && (
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label>Lenketekst</Label><Input value={section.linkText || ''} onChange={e => updateSection(section.id, { linkText: e.target.value })} placeholder="Les mer" /></div>
                        <div><Label>Lenke URL</Label><Input value={section.linkUrl || ''} onChange={e => updateSection(section.id, { linkUrl: e.target.value })} placeholder="https://..." /></div>
                      </div>
                    )}

                    {section.type === 'image-text' && (
                      <div className="space-y-4">
                        <div>
                          <Label>Bildeplassering</Label>
                          <div className="flex gap-2">
                            {(['left', 'right'] as const).map(pos => (
                              <button 
                                key={pos} 
                                onClick={() => updateSection(section.id, { imagePosition: pos })}
                                className={cn(
                                  "flex-1 py-2 rounded-lg border text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all",
                                  section.imagePosition === pos ? "bg-blue-900 text-white border-blue-900" : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                                )}>
                                {pos === 'left' ? 'Venstre' : 'Høyre'}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <Label>Bilde</Label>
                            <button 
                              onClick={() => onOpenImageManager({ type: 'section', sectionId: section.id })}
                              className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                              title="Velg bilde fra bibliotek"
                            >
                              <ImageIcon size={16} />
                            </button>
                          </div>
                          <div className="flex items-center gap-2 p-2 border border-gray-200 rounded-md bg-gray-50 text-base text-gray-600">
                            <ImageIcon size={14} className="text-gray-400" />
                            <span className="truncate flex-1">{section.imageName || (section.image ? 'Bilde valgt' : 'Ingen bilde valgt')}</span>
                          </div>
                          <div className="mt-2 space-y-2">
                            <div><Label>Alt-tekst</Label><Input value={section.imageAlt || ''} onChange={e => updateSection(section.id, { imageAlt: e.target.value })} placeholder="Beskriv bildet" /></div>
                            <div><Label>Fotokreditt</Label><Input value={section.imageCredit || ''} onChange={e => updateSection(section.id, { imageCredit: e.target.value })} placeholder="Fotografens navn" /></div>
                          </div>
                          <ImageTip url={section.image} />
                        </div>
                      </div>
                    )}

                    {section.type === 'full-image' && (
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <Label>Bilde</Label>
                          <button 
                            onClick={() => onOpenImageManager({ type: 'section', sectionId: section.id })}
                            className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                            title="Velg bilde fra bibliotek"
                          >
                            <ImageIcon size={16} />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 p-2 border border-gray-200 rounded-md bg-gray-50 text-base text-gray-600">
                          <ImageIcon size={14} className="text-gray-400" />
                          <span className="truncate flex-1">{section.imageName || (section.image ? 'Bilde valgt' : 'Ingen bilde valgt')}</span>
                        </div>
                        <div className="mt-2 space-y-2">
                          <div><Label>Alt-tekst</Label><Input value={section.imageAlt || ''} onChange={e => updateSection(section.id, { imageAlt: e.target.value })} placeholder="Beskriv bildet" /></div>
                          <div><Label>Fotokreditt</Label><Input value={section.imageCredit || ''} onChange={e => updateSection(section.id, { imageCredit: e.target.value })} placeholder="Fotografens navn" /></div>
                        </div>
                        <ImageTip url={section.image} />
                      </div>
                    )}

                    {section.type === 'grid' && (
                      <div className="space-y-4">
                        {(section.gridItems || []).map(item => (
                          <div key={item.id} className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-3 relative group">
                            <button onClick={() => removeGridItem(section.id, item.id)} className="absolute top-3 right-3 p-1 text-gray-300 hover:text-red-500 transition-colors">
                              <Trash2 size={14} />
                            </button>
                            <div><Label>Overskrift</Label><Input value={item.title || ''} onChange={e => updateGridItem(section.id, item.id, { title: e.target.value })} /></div>
                            <div><Label>Innhold</Label><Textarea value={item.content || ''} onChange={e => updateGridItem(section.id, item.id, { content: e.target.value })} rows={2} /></div>
                            <div className="grid grid-cols-2 gap-2">
                              <div><Label>Lenketekst</Label><Input value={item.linkText || ''} onChange={e => updateGridItem(section.id, item.id, { linkText: e.target.value })} /></div>
                              <div><Label>Lenke URL</Label><Input value={item.linkUrl || ''} onChange={e => updateGridItem(section.id, item.id, { linkUrl: e.target.value })} /></div>
                            </div>
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <Label>Bilde</Label>
                                <button 
                                  onClick={() => onOpenImageManager({ type: 'grid', sectionId: section.id, itemId: item.id })}
                                  className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                                  title="Velg bilde fra bibliotek"
                                >
                                  <ImageIcon size={16} />
                                </button>
                              </div>
                              <div className="flex items-center gap-2 p-2 border border-gray-200 rounded-md bg-gray-50 text-base text-gray-600">
                                <ImageIcon size={14} className="text-gray-400" />
                                <span className="truncate flex-1">{item.imageName || (item.image ? 'Bilde valgt' : 'Ingen bilde valgt')}</span>
                              </div>
                              <div className="mt-2 space-y-2">
                                <div><Label>Alt-tekst</Label><Input value={item.imageAlt || ''} onChange={e => updateGridItem(section.id, item.id, { imageAlt: e.target.value })} placeholder="Beskriv bildet" /></div>
                                <div><Label>Fotokreditt</Label><Input value={item.imageCredit || ''} onChange={e => updateGridItem(section.id, item.id, { imageCredit: e.target.value })} placeholder="Fotografens navn" /></div>
                              </div>
                              <ImageTip url={item.image} />
                            </div>
                          </div>
                        ))}
                        <button onClick={() => addGridItem(section.id)} className="w-full py-2 border-2 border-dashed border-gray-200 text-gray-400 rounded-xl text-xs font-medium flex items-center justify-center gap-2 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all">
                          <Plus size={14} /> Legg til rute
                        </button>
                      </div>
                    )}

                    {section.type === 'list' && (
                      <div className="space-y-4">
                        {(section.items || []).map(item => (
                          <div key={item.id} className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-3 relative group">
                            <button onClick={() => removeListItem(section.id, item.id)} className="absolute top-3 right-3 p-1 text-gray-300 hover:text-red-500 transition-colors">
                              <Trash2 size={14} />
                            </button>
                            <div><Label>Navn/Overskrift</Label><Input value={item.name || ''} onChange={e => updateListItem(section.id, item.id, { name: e.target.value })} /></div>
                            <div><Label>Innhold</Label><Textarea value={item.bio || ''} onChange={e => updateListItem(section.id, item.id, { bio: e.target.value })} rows={2} /></div>
                            <div className="grid grid-cols-2 gap-2">
                              <div><Label>Lenketekst</Label><Input value={item.linkText || ''} onChange={e => updateListItem(section.id, item.id, { linkText: e.target.value })} /></div>
                              <div><Label>Lenke URL</Label><Input value={item.linkUrl || ''} onChange={e => updateListItem(section.id, item.id, { linkUrl: e.target.value })} /></div>
                            </div>
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <Label>Bilde</Label>
                                <button 
                                  onClick={() => onOpenImageManager({ type: 'list', sectionId: section.id, itemId: item.id })}
                                  className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                                  title="Velg bilde fra bibliotek"
                                >
                                  <ImageIcon size={16} />
                                </button>
                              </div>
                              <div className="flex items-center gap-2 p-2 border border-gray-200 rounded-md bg-gray-50 text-base text-gray-600">
                                <ImageIcon size={14} className="text-gray-400" />
                                <span className="truncate flex-1">{item.imageName || (item.image ? 'Bilde valgt' : 'Ingen bilde valgt')}</span>
                              </div>
                              <div className="mt-2 space-y-2">
                                <div><Label>Alt-tekst</Label><Input value={item.imageAlt || ''} onChange={e => updateListItem(section.id, item.id, { imageAlt: e.target.value })} placeholder="Beskriv bildet" /></div>
                                <div><Label>Fotokreditt</Label><Input value={item.imageCredit || ''} onChange={e => updateListItem(section.id, item.id, { imageCredit: e.target.value })} placeholder="Fotografens navn" /></div>
                              </div>
                              <ImageTip url={item.image} />
                            </div>
                          </div>
                        ))}
                        <button onClick={() => addListItem(section.id)} className="w-full py-2 border-2 border-dashed border-gray-200 text-gray-400 rounded-xl text-xs font-medium flex items-center justify-center gap-2 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all">
                          <Plus size={14} /> Legg til element
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer section */}
        <div ref={el => sectionRefs.current['footer'] = el} className="border-t border-gray-100 pt-6">
          <div 
            className="flex justify-between items-center mb-3 cursor-pointer group/footer"
            onClick={() => toggleSection('footer')}
          >
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest group-hover/footer:text-blue-900 transition-colors">Footer</span>
            <div className="p-1 hover:bg-gray-100 rounded-md text-gray-400 transition-colors">
              {activeSectionId === 'footer' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </div>
          {activeSectionId === 'footer' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-1">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <Label>Footer logo</Label>
                  <button 
                    onClick={() => onOpenImageManager({ type: 'footer-full' as any })}
                    className="p-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                  >
                    <ImageIcon size={14} />
                  </button>
                </div>
                <div className="flex items-center gap-2 p-1.5 border border-gray-200 rounded-md bg-gray-50 text-xs text-gray-600">
                  <ImageIcon size={12} className="text-gray-400" />
                  <span className="truncate flex-1">{data.footerLogoFullName || (data.footerLogoFull ? 'Bilde valgt' : 'Ingen logo valgt')}</span>
                </div>
                <div className="mt-1">
                  <Label>Alt-tekst</Label>
                  <Input className="text-xs p-1" value={data.footerLogoFullAlt || ''} onChange={e => setField('footerLogoFullAlt', e.target.value)} placeholder="Alt" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Prosjekt-label</Label><Input value={data.footerWebsiteLabel || ''} onChange={e => setField('footerWebsiteLabel', e.target.value)} /></div>
                <div><Label>Prosjektnavn</Label><Input value={data.footerWebsite || ''} onChange={e => setField('footerWebsite', e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Nettside tekst</Label><Input value={data.footerWebsiteTitle || ''} onChange={e => setField('footerWebsiteTitle', e.target.value)} /></div>
                <div><Label>Nettside URL</Label><Input value={data.footerWebsiteUrl || ''} onChange={e => setField('footerWebsiteUrl', e.target.value)} /></div>
              </div>
              <div><Label>Kontakt tittel</Label><Input value={data.footerContactTitle || ''} onChange={e => setField('footerContactTitle', e.target.value)} /></div>
              <div className="space-y-3">
                {data.footerContacts.map(c => (
                  <div key={c.id} className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-3 relative group">
                    <button onClick={() => removeContact(c.id)} className="absolute top-3 right-3 p-1 text-gray-300 hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                    <div><Label>Navn</Label><Input value={c.name || ''} onChange={e => updateContact(c.id, { name: e.target.value })} /></div>
                    <div><Label>Rolle</Label><Input value={c.role || ''} onChange={e => updateContact(c.id, { role: e.target.value })} /></div>
                    <div><Label>E-post</Label><Input value={c.email || ''} onChange={e => updateContact(c.id, { email: e.target.value })} /></div>
                  </div>
                ))}
                <button onClick={addContact} className="w-full py-2 border-2 border-dashed border-gray-200 text-gray-400 rounded-xl text-xs font-medium flex items-center justify-center gap-2 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all">
                  <Plus size={14} /> Legg til kontakt
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Add section menu */}
        <div ref={addMenuRef} className="relative border-t border-gray-100 pt-6">
          <button 
            onClick={() => setAddMenuOpen(!addMenuOpen)}
            className="w-full p-4 bg-blue-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-between hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/20"
          >
            <span className="flex items-center gap-3">
              <Plus size={18} /> Legg til ny seksjon
            </span>
            <ChevronDown size={16} className={cn("transition-transform", addMenuOpen && "rotate-180")} />
          </button>
          {appVersion ? (
            <div className="mt-2 text-[10px] text-gray-400 text-center tracking-wide">
              {appVersion}
            </div>
          ) : null}
          {addMenuOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-xl shadow-2xl z-[100] overflow-hidden animate-in fade-in slide-in-from-bottom-2">
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Velg seksjonstype</div>
              {[
                { type: 'text' as SectionType, icon: Type, label: 'Tekst' },
                { type: 'image-text' as SectionType, icon: Layout, label: 'Bilde + Tekst' },
                { type: 'list' as SectionType, icon: List, label: 'Liste' },
                { type: 'full-image' as SectionType, icon: Square, label: 'Fullbredde bilde' },
                { type: 'grid' as SectionType, icon: Columns, label: 'Rutenett (2 kol)' },
              ].map((item, i) => (
                <button 
                  key={item.type} 
                  onClick={() => { addSection(item.type); setAddMenuOpen(false); }}
                  className="w-full px-4 py-3 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 last:border-0"
                >
                  <item.icon size={16} className="text-gray-400" />
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="h-10" />
      </div>
    </div>
  );
};
