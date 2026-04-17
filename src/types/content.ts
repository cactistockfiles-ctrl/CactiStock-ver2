export type Locale = "th" | "en" | "zh" | "id";

export interface CactusItem {
  id: string;
  name: string;
  family: string;
  sizeCm: number;
  price: number;
  growType: "seed" | "graft";
  description: string;
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
  excerpt: string;
  content: string;
  coverImage: string;
  gallery: string[];
  createdAt: string;
}

export interface HeroItem {
  id: string;
  title: string;
  subtitle: string;
  buttonLabel: string;
  buttonHref: string;
  showPrimaryButton: boolean;
  secondaryButtonLabel: string;
  secondaryButtonHref: string;
  showSecondaryButton: boolean;
  imageUrl: string;
  order: number;
  active: boolean;
}

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  coverImage: string;
  gallery: string[];
  createdAt: string;
}
