import React from 'react';
import { NewsletterData, Section } from '../types';
import { COLORS, PLACEHOLDER_IMAGE, TYPOGRAPHY } from '../constants';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { toProxyImageUrl } from '../lib/imageUrls';

interface PreviewProps {
  data: NewsletterData;
  previewRef: React.RefObject<HTMLDivElement | null>;
  onlineUrl?: string;
  onUpdateSection?: (id: string, updates: Partial<Section>) => void;
  onUpdateListItem?: (sectionId: string, itemId: string, updates: any) => void;
  onUpdateGridItem?: (sectionId: string, itemId: string, updates: any) => void;
  onOpenImageManager?: (target: { type: 'header' | 'section' | 'list' | 'grid' | 'footer-left' | 'footer-right' | 'footer-full', sectionId?: string, itemId?: string }) => void;
  onUpdateData?: (updates: Partial<NewsletterData>) => void;
  libraryPlaceholderUrl?: string;
  hideOnlineLink?: boolean;
  /** Editor: always desktop scale. Public view: responsive. */
  typographyMode?: 'auto' | 'desktop';
  activeSectionId: string | null;
  setActiveSectionId: (id: string | null) => void;
}

export const Preview: React.FC<PreviewProps> = ({ 
  data, 
  previewRef, 
  onlineUrl,
  onUpdateSection,
  onUpdateListItem,
  onUpdateGridItem,
  onOpenImageManager,
  onUpdateData,
  libraryPlaceholderUrl,
  hideOnlineLink,
  typographyMode = 'auto',
  activeSectionId,
  setActiveSectionId
}) => {
  const getImageSrc = (src?: string) => {
    const fallback = libraryPlaceholderUrl || PLACEHOLDER_IMAGE;
    if (!src || src === '' || src.includes('picsum.photos')) {
      // If broken, empty, picsum (old default) or internal storage link, use placeholder
      return fallback;
    }
    return toProxyImageUrl(src);
  };

  const ensureProtocol = (url: string | undefined) => {
    if (!url) return '';
    const trimmed = url.trim();
    if (trimmed.startsWith('mailto:')) return trimmed;
    if (trimmed.startsWith('tel:')) return trimmed;
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    
    // Handle emails without mailto:
    if (trimmed.includes('@') && !trimmed.includes('/')) return `mailto:${trimmed}`;
    
    // Default to https
    return `https://${trimmed.replace(/^www\./i, 'www.')}`;
  };

  const renderText = (text: string | undefined) => {
    if (!text) return null;
    
    // Regex for URLs and Emails
    const combinedRegex = /(https?:\/\/[^\s]+?(?=[.,;:]?(?:\s|$))|www\.[^\s]+?(?=[.,;:]?(?:\s|$))|[a-zA-Z0-9-]+\.(?:no|com|org|net)(?:\/[^\s]*?)?(?=[.,;:]?(?:\s|$))|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
    
    return text.split(/\r?\n/).map((line, i, arr) => {
      const parts = line.split(combinedRegex);
      
      return (
        <React.Fragment key={i}>
          {parts.map((part, j) => {
            if (!part) return null;

            // Handle URLs (http, https, www, or .no/.com)
            if (part.match(/^(https?:\/\/|www\.|[a-zA-Z0-9-]+\.(no|com|org|net))/i)) {
              const href = ensureProtocol(part);
              return (
                <a 
                  key={j} 
                  href={href}
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: COLORS.darkBlue, textDecoration: 'underline' }}
                >
                  {part}
                </a>
              );
            }

            // Handle Emails
            if (part.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) {
              return (
                <a 
                  key={j} 
                  href={`mailto:${part}`}
                  style={{ color: COLORS.darkBlue, textDecoration: 'underline' }}
                >
                  {part}
                </a>
              );
            }
            return part;
          })}
          {i < arr.length - 1 && <br />}
        </React.Fragment>
      );
    });
  };

  const handleBlur = (id: string, field: keyof Section, e: React.FocusEvent<HTMLElement>) => {
    if (onUpdateSection) {
      onUpdateSection(id, { [field]: e.currentTarget.innerText });
    }
  };

  const isBrowserView = new URLSearchParams(window.location.search).get('view') === 'browser';
  const showOnlineLink = onlineUrl && !isBrowserView && !hideOnlineLink;

  const isEditable = activeSectionId !== null || !!onUpdateSection;
  const isMobileViewport = useMediaQuery('(max-width: 640px)');
  const useMobileTypography = typographyMode === 'auto' && isMobileViewport;
  const t = useMobileTypography ? TYPOGRAPHY.mobile : TYPOGRAPHY.desktop;

  return (
    <div 
      ref={previewRef} 
      className="w-full max-w-[600px] bg-white newsletter-preview"
      style={{ fontFamily: 'Arial, sans-serif' }}
    >
      <table role="presentation" tabIndex={-1} cellPadding="0" cellSpacing="0" border={0} width="100%" style={{ borderCollapse: 'collapse', backgroundColor: COLORS.background, width: '100%', margin: 0, padding: 0 }}>
        <tbody>
          <tr>
            <td align="center" style={{ padding: '10px 0 0 0', backgroundColor: COLORS.background, fontFamily: 'Arial, sans-serif' }}>
              {/* Online Version Link */}
              {showOnlineLink && (
                <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border={0} style={{ width: '100%', maxWidth: '600px' }}>
                  <tbody>
                    <tr>
                      <td align="center" style={{ padding: '10px 20px', fontSize: t.meta, color: COLORS.darkBlue, fontFamily: 'Arial, sans-serif' }}>
                        Har du problemer med å lese e-posten? <a href={ensureProtocol(onlineUrl)} target="_blank" rel="noopener noreferrer" style={{ color: COLORS.darkBlue, textDecoration: 'underline' }}>Se den online her.</a>
                      </td>
                    </tr>
                   </tbody>
                </table>
              )}
            </td>
          </tr>
          <tr>
            <td align="center" style={{ padding: '20px 0 40px 0', backgroundColor: COLORS.background, fontFamily: 'Arial, sans-serif' }}>
              {/* Main Container Table */}
              <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border={0} style={{ borderCollapse: 'collapse', backgroundColor: '#feffff', width: '100%', maxWidth: '600px', margin: '0 auto' }}>
                <tbody>
                  {/* Hero */}
                  <tr onClick={() => setActiveSectionId('header')}>
                    <td align="center" style={{ padding: 0, lineHeight: 0, fontSize: 0, fontFamily: 'Arial, sans-serif' }}>
                      <img 
                        src={getImageSrc(data.heroImage)} 
                        alt={data.heroImageAlt || 'Header'} 
                        width="600" 
                        referrerPolicy="no-referrer"
                        onClick={() => onOpenImageManager?.({ type: 'header' })}
                        style={{ display: 'block', width: '100%', maxWidth: '600px', border: 0, height: 'auto', outline: 'none', textDecoration: 'none', cursor: 'pointer', msoInterpolationMode: 'bicubic' }} 
                      />
                      {data.heroImageCredit && (
                        <div style={{ padding: '4px 8px', fontSize: t.caption, color: '#999', textAlign: 'right', backgroundColor: '#fff', lineHeight: t.captionLineHeight, fontFamily: 'Arial, sans-serif' }}>
                          Foto: {data.heroImageCredit}
                        </div>
                      )}
                    </td>
                  </tr>

                  {/* Byline */}
                  {data.byline !== undefined && (
                    <tr onClick={() => setActiveSectionId('header')}>
                      <td style={{ padding: '20px 30px 5px 30px', backgroundColor: '#feffff', textAlign: 'left' }}>
                        <h3 
                          contentEditable={isEditable}
                          suppressContentEditableWarning
                          onFocus={() => setActiveSectionId('header')}
                          onBlur={(e) => onUpdateData?.({ byline: e.currentTarget.innerText })}
                          style={{ 
                            margin: 0,
                            padding: '0 0 2px 0',
                            color: COLORS.darkBlue, 
                            fontSize: t.body, 
                            fontWeight: 'bold', 
                            textTransform: 'uppercase', 
                            fontFamily: 'Arial, sans-serif', 
                            outline: 'none',
                            lineHeight: t.bodyLineHeight,
                            display: 'block'
                          }}
                        >
                          {data.byline}
                        </h3>
                      </td>
                    </tr>
                  )}

                  {/* Sections */}
                  {data.sections.map((section, index) => {
                    const secBg = section.backgroundColor === 'blue' ? COLORS.lightBlue : '#feffff';
                    const isFirst = index === 0;
                    const headingSize = isFirst ? t.headingLg : t.heading;
                    const headingWeight = isFirst ? 'bold' : 'normal';
                    const headingLineHeight = isFirst ? t.headingLgLineHeight : t.headingLineHeight;

                    return (
                      <React.Fragment key={section.id}>
                        {section.type === 'text' && (
                          <tr onClick={() => setActiveSectionId(section.id)}>
                            <td style={{ padding: '30px', backgroundColor: secBg, fontFamily: 'Arial, sans-serif' }}>
                              <h2 
                                contentEditable={isEditable}
                                suppressContentEditableWarning
                                onFocus={() => setActiveSectionId(section.id)}
                                onBlur={(e) => handleBlur(section.id, 'title', e)}
                                style={{ margin: '0 0 15px 0', color: COLORS.darkBlue, fontSize: headingSize, fontWeight: headingWeight, lineHeight: headingLineHeight, fontFamily: 'Arial, sans-serif', outline: 'none' }}
                              >
                                {section.title}
                              </h2>
                              <div 
                                contentEditable={isEditable}
                                suppressContentEditableWarning
                                onFocus={() => setActiveSectionId(section.id)}
                                onBlur={(e) => handleBlur(section.id, 'content', e)}
                                style={{ margin: 0, color: '#303030', fontSize: t.body, lineHeight: t.bodyLineHeight, fontFamily: 'Arial, sans-serif', outline: 'none' }}
                              >
                                {renderText(section.content)}
                              </div>
                              {section.linkUrl && (
                                <p style={{ margin: '15px 0 0 0' }}>
                                  <a 
                                    href={ensureProtocol(section.linkUrl)} 
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: COLORS.darkBlue, fontSize: t.body, textDecoration: 'underline', fontFamily: 'Arial, sans-serif' }}
                                  >
                                    {section.linkText || 'Les mer'}
                                  </a>
                                </p>
                              )}
                            </td>
                          </tr>
                        )}

                        {section.type === 'image-text' && (
                          <tr onClick={() => setActiveSectionId(section.id)}>
                            <td style={{ padding: '30px', backgroundColor: secBg, fontFamily: 'Arial, sans-serif' }} align="left">
                              <table role="presentation" className="nl-stack" border={0} cellPadding={0} cellSpacing={0} width="100%" style={{ borderCollapse: 'collapse', width: '100%' }}>
                                <tbody>
                                  <tr>
                                    {section.imagePosition === 'left' ? (
                                      <>
                                        {/* Image Column */}
                                        <td width="220" valign="top" style={{ width: '220px', paddingBottom: '20px' }}>
                                          {section.linkUrl ? (
                                            <a href={ensureProtocol(section.linkUrl)} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                                              <img 
                                                src={getImageSrc(section.image)} 
                                                alt={section.imageAlt || section.title} 
                                                width="220" 
                                                referrerPolicy="no-referrer"
                                                onClick={(e) => {
                                                  e.preventDefault();
                                                  e.stopPropagation();
                                                  setActiveSectionId(section.id);
                                                  onOpenImageManager?.({ type: 'section', sectionId: section.id });
                                                }}
                                                style={{ display: 'block', width: '220px', maxWidth: '100%', borderRadius: '4px', border: 0, height: 'auto', cursor: 'pointer', msoInterpolationMode: 'bicubic' }} 
                                              />
                                            </a>
                                          ) : (
                                            <img 
                                              src={getImageSrc(section.image)} 
                                              alt={section.imageAlt || section.title} 
                                              width="220" 
                                              referrerPolicy="no-referrer"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveSectionId(section.id);
                                                onOpenImageManager?.({ type: 'section', sectionId: section.id });
                                              }}
                                              style={{ display: 'block', width: '220px', maxWidth: '100%', borderRadius: '4px', border: 0, height: 'auto', cursor: 'pointer', msoInterpolationMode: 'bicubic' }} 
                                            />
                                          )}
                                          {section.imageCredit && (
                                            <div style={{ padding: '4px 0', fontSize: t.caption, color: '#999', textAlign: 'left', lineHeight: t.captionLineHeight, fontFamily: 'Arial, sans-serif' }}>
                                              Foto: {section.imageCredit}
                                            </div>
                                          )}
                                        </td>
                                        {/* Spacer */}
                                        <td width="20" style={{ width: '20px' }}>&nbsp;</td>
                                        {/* Text Column */}
                                          <td width="300" valign="top" style={{ width: '300px', textAlign: 'left', paddingRight: '20px', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                                            <h2 
                                              contentEditable={isEditable}
                                              suppressContentEditableWarning
                                              onFocus={() => setActiveSectionId(section.id)}
                                              onBlur={(e) => handleBlur(section.id, 'title', e)}
                                              style={{ margin: '0 0 10px 0', color: COLORS.darkBlue, fontSize: headingSize, fontWeight: headingWeight, lineHeight: headingLineHeight, fontFamily: 'Arial, sans-serif', outline: 'none' }}
                                            >
                                              {section.title}
                                            </h2>
                                            <div 
                                              contentEditable={isEditable}
                                              suppressContentEditableWarning
                                              onFocus={() => setActiveSectionId(section.id)}
                                              onBlur={(e) => handleBlur(section.id, 'content', e)}
                                              style={{ margin: 0, color: '#303030', fontSize: t.body, lineHeight: t.bodyLineHeight, fontFamily: 'Arial, sans-serif', outline: 'none' }}
                                            >
                                              {renderText(section.content)}
                                            </div>
                                            {section.linkUrl && (
                                              <p style={{ margin: '15px 0 0 0', fontFamily: 'Arial, sans-serif' }}>
                                                <a 
                                                  href={ensureProtocol(section.linkUrl)} 
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  style={{ color: COLORS.darkBlue, fontSize: t.body, textDecoration: 'underline', fontFamily: 'Arial, sans-serif' }}
                                                >
                                                  {section.linkText || 'Les mer'}
                                                </a>
                                              </p>
                                            )}
                                          </td>
                                      </>
                                    ) : (
                                      <>
                                        {/* Text Column */}
                                          <td width="300" valign="top" style={{ width: '300px', textAlign: 'left', paddingRight: '25px', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                                            <h2 
                                              contentEditable={isEditable}
                                              suppressContentEditableWarning
                                              onFocus={() => setActiveSectionId(section.id)}
                                              onBlur={(e) => handleBlur(section.id, 'title', e)}
                                              style={{ margin: '0 0 10px 0', color: COLORS.darkBlue, fontSize: headingSize, fontWeight: headingWeight, lineHeight: headingLineHeight, fontFamily: 'Arial, sans-serif', outline: 'none' }}
                                            >
                                              {section.title}
                                            </h2>
                                            <div 
                                              contentEditable={isEditable}
                                              suppressContentEditableWarning
                                              onFocus={() => setActiveSectionId(section.id)}
                                              onBlur={(e) => handleBlur(section.id, 'content', e)}
                                              style={{ margin: 0, color: '#303030', fontSize: t.body, lineHeight: t.bodyLineHeight, fontFamily: 'Arial, sans-serif', outline: 'none' }}
                                            >
                                              {renderText(section.content)}
                                            </div>
                                            {section.linkUrl && (
                                              <p style={{ margin: '15px 0 0 0', fontFamily: 'Arial, sans-serif' }}>
                                                <a 
                                                  href={ensureProtocol(section.linkUrl)} 
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  style={{ color: COLORS.darkBlue, fontSize: t.body, textDecoration: 'underline', fontFamily: 'Arial, sans-serif' }}
                                                >
                                                  {section.linkText || 'Les mer'}
                                                </a>
                                              </p>
                                            )}
                                          </td>
                                        {/* Spacer */}
                                        <td width="20" style={{ width: '20px' }}>&nbsp;</td>
                                        {/* Image Column */}
                                        <td width="220" valign="top" style={{ width: '220px', paddingBottom: '20px' }}>
                                          {section.linkUrl ? (
                                            <a href={ensureProtocol(section.linkUrl)} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                                              <img 
                                                src={getImageSrc(section.image)} 
                                                alt={section.imageAlt || section.title} 
                                                width="220" 
                                                referrerPolicy="no-referrer"
                                                onClick={(e) => {
                                                  e.preventDefault();
                                                  e.stopPropagation();
                                                  setActiveSectionId(section.id);
                                                  onOpenImageManager?.({ type: 'section', sectionId: section.id });
                                                }}
                                                style={{ display: 'block', width: '220px', maxWidth: '100%', borderRadius: '4px', border: 0, height: 'auto', cursor: 'pointer', msoInterpolationMode: 'bicubic' }} 
                                              />
                                            </a>
                                          ) : (
                                            <img 
                                              src={getImageSrc(section.image)} 
                                              alt={section.imageAlt || section.title} 
                                              width="220" 
                                              referrerPolicy="no-referrer"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveSectionId(section.id);
                                                onOpenImageManager?.({ type: 'section', sectionId: section.id });
                                              }}
                                              style={{ display: 'block', width: '220px', maxWidth: '100%', borderRadius: '4px', border: 0, height: 'auto', cursor: 'pointer', msoInterpolationMode: 'bicubic' }} 
                                            />
                                          )}
                                          {section.imageCredit && (
                                            <div style={{ padding: '4px 0', fontSize: t.caption, color: '#999', textAlign: 'right', lineHeight: t.captionLineHeight, fontFamily: 'Arial, sans-serif' }}>
                                              Foto: {section.imageCredit}
                                            </div>
                                          )}
                                        </td>
                                      </>
                                    )}
                                  </tr>
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        )}

                        {section.type === 'full-image' && (
                          <tr onClick={() => setActiveSectionId(section.id)}>
                            <td style={{ padding: 0, backgroundColor: secBg }}>
                              {section.linkUrl ? (
                                <a href={ensureProtocol(section.linkUrl)} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                                  <img 
                                    src={getImageSrc(section.image)} 
                                    alt={section.imageAlt || section.title || 'Bilde'} 
                                    width="600" 
                                    referrerPolicy="no-referrer"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setActiveSectionId(section.id);
                                      onOpenImageManager?.({ type: 'section', sectionId: section.id });
                                    }}
                                    style={{ display: 'block', width: '100%', maxWidth: '600px', border: 0, height: 'auto', cursor: 'pointer', msoInterpolationMode: 'bicubic' }} 
                                  />
                                </a>
                              ) : (
                                <img 
                                  src={getImageSrc(section.image)} 
                                  alt={section.imageAlt || section.title || 'Bilde'} 
                                  width="600" 
                                  referrerPolicy="no-referrer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveSectionId(section.id);
                                    onOpenImageManager?.({ type: 'section', sectionId: section.id });
                                  }}
                                  style={{ display: 'block', width: '100%', maxWidth: '600px', border: 0, height: 'auto', cursor: 'pointer', msoInterpolationMode: 'bicubic' }} 
                                />
                              )}
                              {section.imageCredit && (
                                <div style={{ padding: '4px 8px', fontSize: t.caption, color: '#999', textAlign: 'right', backgroundColor: '#fff', lineHeight: t.captionLineHeight }}>
                                  Foto: {section.imageCredit}
                                </div>
                              )}
                              {section.linkUrl && (
                                <div style={{ padding: '15px 30px' }}>
                                  <a 
                                    href={ensureProtocol(section.linkUrl)} 
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: COLORS.darkBlue, fontSize: t.body, textDecoration: 'underline', fontFamily: 'Arial, sans-serif' }}
                                  >
                                    {section.linkText || 'Les mer'}
                                  </a>
                                </div>
                              )}
                            </td>
                          </tr>
                        )}

                        {section.type === 'grid' && (() => {
                          const items = section.gridItems || [];
                          return (
                            <tr onClick={() => setActiveSectionId(section.id)}>
                              <td style={{ padding: '30px', backgroundColor: secBg, fontFamily: 'Arial, sans-serif' }} align="center">
                                <table role="presentation" border={0} cellPadding={0} cellSpacing={0} width="100%" style={{ borderCollapse: 'collapse' }}>
                                  <tbody>
                                    {/* Grid items in a simpler row-based structure for maximum stability */}
                                    {Array.from({ length: Math.ceil(items.length / 2) }).map((_, rowIndex) => (
                                      <tr key={rowIndex}>
                                        {[0, 1].map((colIndex) => {
                                          const item = items[rowIndex * 2 + colIndex];
                                          if (!item) return <td key={colIndex} width="260">&nbsp;</td>;
                                          return (
                                            <React.Fragment key={item.id}>
                                              <td width="260" valign="top" style={{ width: '260px', paddingBottom: '30px' }}>
                                                {item.linkUrl ? (
                                                  <a href={ensureProtocol(item.linkUrl)} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                                                    <img 
                                                      src={getImageSrc(item.image)} 
                                                      alt={item.imageAlt || item.title} 
                                                      width="260" 
                                                      referrerPolicy="no-referrer"
                                                      onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setActiveSectionId(section.id);
                                                        onOpenImageManager?.({ type: 'grid', sectionId: section.id, itemId: item.id });
                                                      }}
                                                      style={{ display: 'block', width: '260px', borderRadius: '4px', border: 0, marginBottom: '4px', height: 'auto', cursor: 'pointer' }} 
                                                    />
                                                  </a>
                                                ) : (
                                                  <img 
                                                    src={getImageSrc(item.image)} 
                                                    alt={item.imageAlt || item.title} 
                                                    width="260" 
                                                    referrerPolicy="no-referrer"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setActiveSectionId(section.id);
                                                      onOpenImageManager?.({ type: 'grid', sectionId: section.id, itemId: item.id });
                                                    }}
                                                    style={{ display: 'block', width: '260px', borderRadius: '4px', border: 0, marginBottom: '4px', height: 'auto', cursor: 'pointer' }} 
                                                  />
                                                )}
                                                {item.imageCredit && (
                                                  <div style={{ padding: '0 4px 8px 4px', fontSize: t.caption, color: '#999', textAlign: 'right', lineHeight: t.captionLineHeight, fontFamily: 'Arial, sans-serif' }}>
                                                    Foto: {item.imageCredit}
                                                  </div>
                                                )}
                                                <h3 
                                                  contentEditable={isEditable}
                                                  suppressContentEditableWarning
                                                  onFocus={() => setActiveSectionId(section.id)}
                                                  onBlur={(e) => onUpdateGridItem && onUpdateGridItem(section.id, item.id, { title: e.currentTarget.innerText })}
                                                  style={{ margin: '0 0 10px 0', color: COLORS.darkBlue, fontSize: t.heading, fontWeight: 'normal', lineHeight: t.headingLineHeight, fontFamily: 'Arial, sans-serif', outline: 'none' }}
                                                >
                                                  {item.title}
                                                </h3>
                                                <div 
                                                  contentEditable={isEditable}
                                                  suppressContentEditableWarning
                                                  onFocus={() => setActiveSectionId(section.id)}
                                                  onBlur={(e) => onUpdateGridItem && onUpdateGridItem(section.id, item.id, { content: e.currentTarget.innerText })}
                                                  style={{ margin: 0, color: '#303030', fontSize: t.body, lineHeight: t.bodyLineHeight, fontFamily: 'Arial, sans-serif', outline: 'none' }}
                                                >
                                                  {renderText(item.content)}
                                                </div>
                                                {item.linkUrl && (
                                                  <p style={{ margin: '10px 0 0 0', fontFamily: 'Arial, sans-serif' }}>
                                                    <a 
                                                      href={ensureProtocol(item.linkUrl)} 
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      style={{ color: COLORS.darkBlue, fontSize: t.body, textDecoration: 'underline', fontFamily: 'Arial, sans-serif' }}
                                                    >
                                                      {item.linkText || 'Les mer'}
                                                    </a>
                                                  </p>
                                                )}
                                              </td>
                                              {colIndex === 0 && <td width="20" style={{ width: '20px' }}>&nbsp;</td>}
                                            </React.Fragment>
                                          );
                                        })}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          );
                        })()}

                        {section.type === 'list' && (
                          <tr onClick={() => setActiveSectionId(section.id)}>
                            <td style={{ padding: '30px', backgroundColor: secBg, fontFamily: 'Arial, sans-serif' }}>
                              <h2 
                                contentEditable={isEditable}
                                suppressContentEditableWarning
                                onFocus={() => setActiveSectionId(section.id)}
                                onBlur={(e) => handleBlur(section.id, 'title', e)}
                                style={{ margin: '0 0 25px 0', color: COLORS.darkBlue, fontSize: isFirst ? headingSize : t.small, fontWeight: isFirst ? headingWeight : 'normal', lineHeight: isFirst ? headingLineHeight : t.smallLineHeight, fontFamily: 'Arial, sans-serif', outline: 'none' }}
                              >
                                {section.title}
                              </h2>
                              <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border={0} style={{ borderCollapse: 'collapse' }}>
                                <tbody>
                                  {(section.items || []).map((member) => (
                                    <tr key={member.id}>
                                      <td style={{ paddingBottom: '25px', fontFamily: 'Arial, sans-serif' }}>
                                        <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border={0} style={{ borderCollapse: 'collapse' }}>
                                          <tbody>
                                            <tr>
                                              <td width="80" valign="top" style={{ width: '80px', minWidth: '80px', maxWidth: '80px', fontFamily: 'Arial, sans-serif' }}>
                                                {member.linkUrl ? (
                                                  <a href={ensureProtocol(member.linkUrl)} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                                                    <img 
                                                      src={getImageSrc(member.image)} 
                                                      alt={member.imageAlt || member.name} 
                                                      width="80" 
                                                      height="80" 
                                                      referrerPolicy="no-referrer"
                                                      onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setActiveSectionId(section.id);
                                                        onOpenImageManager?.({ type: 'list', sectionId: section.id, itemId: member.id });
                                                      }}
                                                      style={{ display: 'block', width: '80px', height: '80px', minWidth: '80px', minHeight: '80px', maxWidth: '80px', maxHeight: '80px', borderRadius: '4px', border: 0, cursor: 'pointer', objectFit: 'cover' }} 
                                                    />
                                                  </a>
                                                ) : (
                                                  <img 
                                                    src={getImageSrc(member.image)} 
                                                    alt={member.imageAlt || member.name} 
                                                    width="80" 
                                                    height="80" 
                                                    referrerPolicy="no-referrer"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setActiveSectionId(section.id);
                                                      onOpenImageManager?.({ type: 'list', sectionId: section.id, itemId: member.id });
                                                    }}
                                                    style={{ display: 'block', width: '80px', height: '80px', minWidth: '80px', minHeight: '80px', maxWidth: '80px', maxHeight: '80px', borderRadius: '4px', border: 0, cursor: 'pointer', objectFit: 'cover' }} 
                                                  />
                                                )}
                                                {member.imageCredit && (
                                                  <div style={{ padding: '2px 0', fontSize: t.captionSm, color: '#999', textAlign: 'center', lineHeight: t.captionSmLineHeight, fontFamily: 'Arial, sans-serif' }}>
                                                    Foto: {member.imageCredit}
                                                  </div>
                                                )}
                                              </td>
                                              <td width="15" style={{ width: '15px', minWidth: '15px', maxWidth: '15px' }}>&nbsp;</td>
                                              <td valign="top" style={{ fontFamily: 'Arial, sans-serif' }}>
                                                <h3 
                                                  contentEditable={isEditable}
                                                  suppressContentEditableWarning
                                                  onFocus={() => setActiveSectionId(section.id)}
                                                  onBlur={(e) => onUpdateListItem && onUpdateListItem(section.id, member.id, { name: e.currentTarget.innerText })}
                                                  style={{ margin: '0 0 4px 0', color: COLORS.darkBlue, fontSize: t.heading, fontWeight: 'normal', lineHeight: t.headingLineHeight, fontFamily: 'Arial, sans-serif', outline: 'none' }}
                                                >
                                                  {member.name}
                                                </h3>
                                                <div 
                                                  contentEditable={isEditable}
                                                  suppressContentEditableWarning
                                                  onFocus={() => setActiveSectionId(section.id)}
                                                  onBlur={(e) => onUpdateListItem && onUpdateListItem(section.id, member.id, { bio: e.currentTarget.innerText })}
                                                  style={{ margin: 0, color: '#303030', fontSize: t.body, lineHeight: t.bodyLineHeight, fontFamily: 'Arial, sans-serif', outline: 'none' }}
                                                >
                                                  {renderText(member.bio)}
                                                </div>
                                                {member.linkUrl && (
                                                  <p style={{ margin: '6px 0 0 0', fontFamily: 'Arial, sans-serif' }}>
                                                    <a 
                                                      href={ensureProtocol(member.linkUrl)} 
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      style={{ color: COLORS.darkBlue, fontSize: t.body, textDecoration: 'underline', fontFamily: 'Arial, sans-serif' }}
                                                    >
                                                      {member.linkText || 'Les mer'}
                                                    </a>
                                                  </p>
                                                )}
                                              </td>
                                            </tr>
                                          </tbody>
                                        </table>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}


                  {/* Footer */}
                  <tr onClick={() => setActiveSectionId('footer')}>
                    <td style={{ padding: '40px 30px 0 30px', backgroundColor: COLORS.darkBlue, color: '#ffffff', fontFamily: 'Arial, sans-serif' }}>
                      <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border={0} style={{ borderCollapse: 'collapse' }}>
                        <tbody>
                          <tr>
                            <td width="50%" valign="top" style={{ fontFamily: 'Arial, sans-serif', paddingBottom: '20px' }}>
                              <p style={{ margin: '0 0 10px 0', fontSize: t.body, color: '#70E9FF', fontFamily: 'Arial, sans-serif', lineHeight: t.footerLineHeight, fontWeight: 'normal' }}>
                                {data.footerWebsiteLabel}
                              </p>
                              <p style={{ margin: '0 0 5px 0', fontSize: t.body, color: '#ffffff', fontFamily: 'Arial, sans-serif', lineHeight: t.footerLineHeight, fontWeight: 'normal' }}>
                                {data.footerWebsite}
                              </p>
                              {data.footerWebsiteUrl ? (
                                <a href={ensureProtocol(data.footerWebsiteUrl)} target="_blank" rel="noopener noreferrer" style={{ color: '#ffffff', textDecoration: 'underline', fontSize: t.body, fontFamily: 'Arial, sans-serif', fontWeight: 'normal' }}>
                                  {data.footerWebsiteTitle}
                                </a>
                              ) : (
                                <span style={{ color: '#ffffff', fontSize: t.body, fontFamily: 'Arial, sans-serif', fontWeight: 'normal' }}>
                                  {data.footerWebsiteTitle}
                                </span>
                              )}
                            </td>
                            <td width="50%" valign="top" style={{ paddingLeft: '20px', fontFamily: 'Arial, sans-serif', paddingBottom: '20px' }}>
                              <p style={{ margin: '0 0 10px 0', fontSize: t.body, color: '#70E9FF', fontFamily: 'Arial, sans-serif', lineHeight: t.footerLineHeight, fontWeight: 'normal' }}>
                                {data.footerContactTitle}
                              </p>
                              {(data.footerContacts || []).map((c) => (
                                <p key={c.id} style={{ margin: '0 0 12px 0', fontSize: t.body, lineHeight: t.footerLineHeight, color: '#ffffff', fontFamily: 'Arial, sans-serif', fontWeight: 'normal' }}>
                                  {c.name}, {c.role}<br />
                                  <a 
                                    href={`mailto:${c.email}`} 
                                    style={{ color: '#ffffff', textDecoration: 'underline', fontFamily: 'Arial, sans-serif', fontWeight: 'normal' }}
                                  >
                                    {c.email}
                                  </a>
                                </p>
                              ))}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                  <tr onClick={() => setActiveSectionId('footer')}>
                    <td style={{ backgroundColor: COLORS.darkBlue, padding: '0 30px 40px 30px' }}>
                      <div style={{ msoLineHeightRule: 'exactly', borderTop: '1px solid #354E7E', paddingTop: '25px' }}>
                        <img 
                          src={getImageSrc(data.footerLogoFull || data.footerLogoLeft)} 
                          alt={data.footerLogoFullAlt || 'Logo'} 
                          referrerPolicy="no-referrer"
                          width="540"
                          onClick={() => onOpenImageManager?.({ type: 'footer-full' })}
                          style={{ display: 'block', width: '100%', maxWidth: '540px', border: 0, height: 'auto', cursor: 'pointer', msoInterpolationMode: 'bicubic' }} 
                        />
                      </div>
                    </td>
                  </tr>
                  
                  {/* Subscription Links */}
                  <tr>
                    <td style={{ padding: '20px 30px', backgroundColor: COLORS.background, fontFamily: 'Arial, sans-serif' }}>
                      <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border={0} style={{ borderCollapse: 'collapse' }}>
                        <tbody>
                          <tr>
                            <td align="center" style={{ fontSize: t.body, color: COLORS.text, lineHeight: t.bodyLineHeight, fontFamily: 'Arial, sans-serif', fontWeight: 'normal' }}>
                              Likte du det du leste? <a href={`mailto:kjersti.sirevag@hel.oslo.kommune.no?subject=${encodeURIComponent('Påmelding nyhetsbrev')}`} style={{ color: COLORS.darkBlue, textDecoration: 'underline', fontWeight: 'normal' }}>Meld deg på</a> her for å få alle nyhetsbrevene.<br />
                              Ønsker du ikke lenger e-post? <a href={`mailto:kjersti.sirevag@hel.oslo.kommune.no?subject=${encodeURIComponent('Avmelding nyhetsbrev')}`} style={{ color: COLORS.darkBlue, textDecoration: 'underline', fontWeight: 'normal' }}>Meld deg av</a> her.
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
