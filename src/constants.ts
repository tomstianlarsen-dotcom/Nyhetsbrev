import { NewsletterData } from './types';

export const COLORS = {
  darkBlue: '#02225E',
  lightBlue: '#C5E9F4',
  text: '#303030', // Updated from #292C32 as per user request
  background: '#F8F0DD',
};

export type TypographyScale = {
  body: string;
  bodyLineHeight: string;
  small: string;
  smallLineHeight: string;
  heading: string;
  headingLineHeight: string;
  headingLg: string;
  headingLgLineHeight: string;
  caption: string;
  captionLineHeight: string;
  captionSm: string;
  captionSmLineHeight: string;
  meta: string;
  footerLineHeight: string;
};

export const TYPOGRAPHY: { desktop: TypographyScale; mobile: TypographyScale } = {
  desktop: {
    body: '16px',
    bodyLineHeight: '24px',
    small: '14px',
    smallLineHeight: '20px',
    heading: '20px',
    headingLineHeight: '26px',
    headingLg: '28px',
    headingLgLineHeight: '36px',
    caption: '10px',
    captionLineHeight: '12px',
    captionSm: '8px',
    captionSmLineHeight: '10px',
    meta: '13px',
    footerLineHeight: '22px',
  },
  mobile: {
    body: '18px',
    bodyLineHeight: '27px',
    small: '16px',
    smallLineHeight: '24px',
    heading: '22px',
    headingLineHeight: '29px',
    headingLg: '30px',
    headingLgLineHeight: '38px',
    caption: '11px',
    captionLineHeight: '13px',
    captionSm: '9px',
    captionSmLineHeight: '11px',
    meta: '14px',
    footerLineHeight: '25px',
  },
};

/** Map desktop inline sizes to mobile/email sizes when copying HTML for e-post. */
export function applyEmailTypography(root: HTMLElement): void {
  const d = TYPOGRAPHY.desktop;
  const m = TYPOGRAPHY.mobile;

  const fontSizeMap: Record<string, string> = {
    [d.captionSm]: m.captionSm,
    [d.caption]: m.caption,
    [d.meta]: m.meta,
    [d.small]: m.small,
    [d.body]: m.body,
    [d.heading]: m.heading,
    [d.headingLg]: m.headingLg,
  };

  const lineHeightMap: Record<string, string> = {
    [d.captionSmLineHeight]: m.captionSmLineHeight,
    [d.captionLineHeight]: m.captionLineHeight,
    [d.smallLineHeight]: m.smallLineHeight,
    [d.bodyLineHeight]: m.bodyLineHeight,
    [d.headingLineHeight]: m.headingLineHeight,
    [d.headingLgLineHeight]: m.headingLgLineHeight,
    [d.footerLineHeight]: m.footerLineHeight,
  };

  root.querySelectorAll<HTMLElement>('[style]').forEach((el) => {
    const fs = el.style.fontSize;
    const lh = el.style.lineHeight;
    if (fs && fontSizeMap[fs]) el.style.fontSize = fontSizeMap[fs];
    if (lh && lineHeightMap[lh]) el.style.lineHeight = lineHeightMap[lh];
  });
}

export const PLACEHOLDER_IMAGE = `data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22600%22%20height%3D%22400%22%20viewBox%3D%220%200%20600%20400%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23eee%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20font-family%3D%22Arial%2C%20sans-serif%22%20font-size%3D%2224%22%20fill%3D%22%23aaa%22%20text-anchor%3D%22middle%22%20dy%3D%22.3em%22%3E%20%3C%2Ftext%3E%3C%2Fsvg%3E`;

export const DEFAULT_DATA: NewsletterData = {
  heroImage: '',
  heroImageId: '',
  heroImageName: 'Header.png',
  heroImageAlt: 'Prosjekt header',
  heroImageCredit: '',
  footerLogoLeft: '',
  footerLogoLeftAlt: 'Logo 1',
  footerLogoRight: '',
  footerLogoRightAlt: 'Logo 2',
  footerLogoFull: '',
  footerLogoFullId: '',
  footerLogoFullName: 'Footer logos.png',
  footerLogoFullAlt: 'Oslo kommune og Oslo Universitetssykehus',
  footerWebsiteLabel: 'Prosjekt',
  footerWebsite: 'Sammen om rask og riktig psykisk helsehjelp til barn og unge',
  footerWebsiteTitle: 'Kompetansebroen.no',
  footerWebsiteUrl: 'https://kompetansebroen.no',
  footerContactTitle: 'Har du spørsmål til oss?',
  footerContacts: [
    { id: 'fc1', name: 'Kjersti Sirevåg', role: 'prosjektleder', email: 'kjersti.sirevag@hel.oslo.kommune.no' },
    { id: 'fc2', name: 'Ingrid Grov Mannsverk', role: 'prosjektmedarbeider', email: 'ingrid.grov.mannsverk@hel.oslo.kommune.no' },
    { id: 'fc3', name: 'Atle Moe', role: 'prosjektmedarbeider', email: 'atle.moe@hel.oslo.kommune.no' },
  ],
  sections: [
    { 
      id: '1', 
      type: 'text', 
      title: 'Overskrift', 
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.', 
      backgroundColor: 'white' 
    },
    { 
      id: '2', 
      type: 'image-text', 
      title: 'Overskrift', 
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.', 
      image: 'https://picsum.photos/seed/newsletter/400/300', 
      imageAlt: 'Beskrivende tekst',
      imageCredit: '',
      imagePosition: 'left', 
      backgroundColor: 'white' 
    },
  ],
  byline: '',
};
