import { NewsletterData } from './types';

export const COLORS = {
  darkBlue: '#02225E',
  lightBlue: '#C5E9F4',
  text: '#303030', // Updated from #292C32 as per user request
  background: '#F8F0DD',
};

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
