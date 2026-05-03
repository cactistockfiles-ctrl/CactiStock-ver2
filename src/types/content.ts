export type Locale = "th" | "en" | "zh" | "id";

export interface Translations {
  th?: string;
  en?: string;
  zh?: string;
  id?: string;
}

export interface CactusItem {
  id: string;
  name: string;
  nameTranslations: Translations;
  family: string;
  sizeCm: number;
  widthCm?: number;
  lengthCm?: number;
  heightCm?: number;
  price: number;
  growType: "seed" | "graft";
  description: string;
  descriptionTranslations: Translations;
  images: {
    top: string;
    side1: string;
    side2: string;
    side3: string;
  };
  isSold: boolean;
  createdAt: string;
  soldAt?: string;
}

export interface BlogPost {
  id: string;
  title: string;
  titleTranslations: Translations;
  excerpt: string;
  excerptTranslations: Translations;
  content: string;
  contentTranslations: Translations;
  coverImage: string;
  gallery: string[];
  createdAt: string;
}

export interface HeroItem {
  id: string;
  title: string;
  titleTranslations: Translations;
  subtitle: string;
  subtitleTranslations: Translations;
  buttonLabel: string;
  buttonLabelTranslations: Translations;
  buttonHref: string;
  showPrimaryButton: boolean;
  secondaryButtonLabel: string;
  secondaryButtonLabelTranslations: Translations;
  secondaryButtonHref: string;
  showSecondaryButton: boolean;
  imageUrl: string;
  order: number;
  active: boolean;
}

export interface NewsItem {
  id: string;
  title: string;
  titleTranslations: Translations;
  content: string;
  contentTranslations: Translations;
  coverImage: string;
  gallery: string[];
  createdAt: string;
}
