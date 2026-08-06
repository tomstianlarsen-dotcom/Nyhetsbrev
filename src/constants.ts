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
    heading: '22px',
    headingLineHeight: '29px',
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
    heading: '24px',
    headingLineHeight: '32px',
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

function parsePx(value: string): number | null {
  const match = /^(\d+(?:\.\d+)?)px$/.exec(value.trim());
  return match ? Number(match[1]) : null;
}

const EMAIL_TYPOGRAPHY_SCALE = [
  { desktop: '8px', mobile: '9px', desktopLh: '10px', mobileLh: '11px' },
  { desktop: '10px', mobile: '11px', desktopLh: '12px', mobileLh: '13px' },
  { desktop: '13px', mobile: '14px', desktopLh: '22px', mobileLh: '25px' },
  { desktop: '14px', mobile: '16px', desktopLh: '20px', mobileLh: '24px' },
  { desktop: '16px', mobile: '18px', desktopLh: '24px', mobileLh: '27px' },
  { desktop: '22px', mobile: '24px', desktopLh: '29px', mobileLh: '32px' },
  { desktop: '28px', mobile: '30px', desktopLh: '36px', mobileLh: '38px' },
] as const;

/** Force mobile/email typography inline (Gmail ignores most @media in <style>). */
export function applyEmailTypography(root: HTMLElement): void {
  const m = TYPOGRAPHY.mobile;
  const mobileFontSizes = new Set(EMAIL_TYPOGRAPHY_SCALE.map((s) => s.mobile));

  const fontSizeMap: Record<string, string> = {};
  const lineHeightMap: Record<string, string> = {};
  for (const scale of EMAIL_TYPOGRAPHY_SCALE) {
    fontSizeMap[scale.desktop] = scale.mobile;
    lineHeightMap[scale.desktopLh] = scale.mobileLh;
  }

  root.querySelectorAll<HTMLElement>('[style]').forEach((el) => {
    const fs = el.style.fontSize;
    const lh = el.style.lineHeight;

    if (fs && !mobileFontSizes.has(fs)) {
      if (fontSizeMap[fs]) {
        el.style.fontSize = fontSizeMap[fs];
      } else {
        const px = parsePx(fs);
        if (px !== null) {
          for (const scale of EMAIL_TYPOGRAPHY_SCALE) {
            const desktopPx = parsePx(scale.desktop);
            if (desktopPx !== null && px <= desktopPx) {
              el.style.fontSize = scale.mobile;
              break;
            }
          }
        }
      }
    }

    if (lh && !Object.values(lineHeightMap).includes(lh)) {
      if (lineHeightMap[lh]) {
        el.style.lineHeight = lineHeightMap[lh];
      }
    }
  });

  // Links inside body copy often lack explicit font-size; inheritance is unreliable in email clients.
  root.querySelectorAll<HTMLElement>('p a, div[style*="color: rgb(48, 48, 48)"] a, div[style*="#303030"] a').forEach((el) => {
    if (!el.style.fontSize) {
      el.style.fontSize = m.body;
      el.style.lineHeight = m.bodyLineHeight;
    }
  });

  root.querySelectorAll<HTMLElement>('p, div').forEach((el) => {
    const color = el.style.color;
    const isBodyText =
      color === '#303030' ||
      color === 'rgb(48, 48, 48)' ||
      color === COLORS.text;
    if (isBodyText && el.style.fontSize && mobileFontSizes.has(el.style.fontSize)) {
      el.classList.add('nl-body');
    }
  });
}

/** Mobile layout rules — shared by online preview (index.css) and email copy (Editor). */
export const NEWSLETTER_MOBILE_LAYOUT_CSS = `
  .nl-hero,
  .nl-full-bleed {
    padding-left: 0 !important;
    padding-right: 0 !important;
  }
  .nl-hero {
    padding-top: 0 !important;
    padding-bottom: 0 !important;
  }
  .nl-content-pad {
    padding: 20px 15px !important;
  }
  .nl-byline {
    padding: 16px 15px 4px !important;
  }
  .nl-footer-pad {
    padding: 32px 15px 0 !important;
  }
  .nl-footer-pad-bottom {
    padding: 0 15px 32px !important;
  }
  .nl-stack td {
    display: block !important;
    width: 100% !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
  }
  .nl-stack td[width="20"],
  .nl-stack td[width="15"] {
    display: none !important;
    height: 0 !important;
    font-size: 0 !important;
    line-height: 0 !important;
    padding: 0 !important;
  }
  .nl-stack .nl-stack-col {
    padding-left: 0 !important;
    padding-right: 0 !important;
  }
  .nl-stack .nl-stack-image {
    padding-bottom: 16px !important;
  }
  .nl-link-pad {
    padding: 12px 15px !important;
  }
`;

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
