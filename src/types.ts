export type SectionType = 'text' | 'image-text' | 'full-image' | 'list' | 'grid';

export interface ListItem {
  id: string;
  name: string;
  bio: string;
  image: string;
  imageId?: string;
  imageName?: string;
  imageAlt?: string;
  imageCredit?: string;
  linkUrl?: string;
  linkText?: string;
}

export interface GridItem {
  id: string;
  title: string;
  content: string;
  image: string;
  imageId?: string;
  imageName?: string;
  imageAlt?: string;
  imageCredit?: string;
  linkUrl?: string;
  linkText?: string;
}

export interface Section {
  id: string;
  type: SectionType;
  title: string;
  content?: string;
  image?: string;
  imageId?: string;
  imageName?: string;
  imageAlt?: string;
  imageCredit?: string;
  imagePosition?: 'left' | 'right';
  backgroundColor?: 'white' | 'blue';
  linkUrl?: string;
  linkText?: string;
  items?: ListItem[];
  gridItems?: GridItem[];
}

export interface Contact {
  id: string;
  name: string;
  role: string;
  email: string;
}

export interface NewsletterData {
  heroImage: string;
  heroImageId?: string;
  heroImageName?: string;
  heroImageAlt?: string;
  heroImageCredit?: string;
  footerLogoLeft: string;
  footerLogoLeftId?: string;
  footerLogoLeftName?: string;
  footerLogoLeftAlt?: string;
  footerLogoRight: string;
  footerLogoRightId?: string;
  footerLogoRightName?: string;
  footerLogoRightAlt?: string;
  footerLogoFull?: string;
  footerLogoFullId?: string;
  footerLogoFullName?: string;
  footerLogoFullAlt?: string;
  footerWebsiteLabel: string;
  footerWebsite: string;
  footerWebsiteTitle: string;
  footerWebsiteUrl: string;
  footerContactTitle: string;
  footerContacts: Contact[];
  sections: Section[];
  byline?: string;
}
