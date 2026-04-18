import { BlogPost, CactusItem, HeroItem, NewsItem } from "@/types/content";

const now = "2026-03-19T00:00:00.000Z";

export const seedCacti: CactusItem[] = [
  {
    id: "1",
    name: "Astrophytum asterias",
    nameTranslations: {},
    family: "Astrophytum",
    sizeCm: 5,
    price: 1500,
    growType: "seed",
    description: "Rare flat cactus with distinct ribs and speckled body.",
    descriptionTranslations: {},
    images: { top: "", side1: "", side2: "", side3: "" },
    isSold: false,
    createdAt: now,
  },
  {
    id: "2",
    name: "Gymnocalycium mihanovichii",
    nameTranslations: {},
    family: "Gymnocalycium",
    sizeCm: 4,
    price: 850,
    growType: "graft",
    description: "Compact and colorful species commonly used in grafting.",
    descriptionTranslations: {},
    images: { top: "", side1: "", side2: "", side3: "" },
    isSold: false,
    createdAt: now,
  },
  {
    id: "3",
    name: "Lophophora williamsii",
    nameTranslations: {},
    family: "Lophophora",
    sizeCm: 6,
    price: 3500,
    growType: "seed",
    description: "Spineless, slow-growing, and highly prized by collectors.",
    descriptionTranslations: {},
    images: { top: "", side1: "", side2: "", side3: "" },
    isSold: false,
    createdAt: now,
  },
  {
    id: "4",
    name: "Ariocarpus retusus",
    nameTranslations: {},
    family: "Ariocarpus",
    sizeCm: 8,
    price: 5200,
    growType: "seed",
    description: "Distinct triangular tubercles with exceptionally slow growth.",
    descriptionTranslations: {},
    images: { top: "", side1: "", side2: "", side3: "" },
    isSold: false,
    createdAt: now,
  },
];

export const seedBlogs: BlogPost[] = [
  {
    id: "1",
    title: "Beginner cactus care guide",
    titleTranslations: {},
    excerpt: "The essentials of watering, light, and substrate selection.",
    excerptTranslations: {},
    content: "Cacti prefer bright light and dry cycles. Water only when the mix is fully dry.",
    contentTranslations: {},
    coverImage: "",
    gallery: [],
    createdAt: now,
  },
  {
    id: "2",
    title: "Complete grafting workflow",
    titleTranslations: {},
    excerpt: "How to graft cactus safely and improve survival rates.",
    excerptTranslations: {},
    content: "Grafting works best with clean cuts and proper alignment of vascular rings.",
    contentTranslations: {},
    coverImage: "",
    gallery: [],
    createdAt: now,
  },
];

export const seedHeroes: HeroItem[] = [
  {
    id: "hero-1",
    title: "Rare Cactus Collection",
    titleTranslations: {},
    subtitle: "Premium plants selected one by one for serious collectors.",
    subtitleTranslations: {},
    buttonLabel: "Browse Catalogue",
    buttonLabelTranslations: {},
    buttonHref: "/catalogue",
    showPrimaryButton: true,
    secondaryButtonLabel: "About Us",
    secondaryButtonLabelTranslations: {},
    secondaryButtonHref: "/about",
    showSecondaryButton: false,
    imageUrl: "",
    order: 1,
    active: true,
  },
];

export const seedNews: NewsItem[] = [
  {
    id: "news-1",
    title: "Spring Greenhouse Update",
    titleTranslations: {},
    content:
      "Our spring collection is now available. We added rare lines and improved packaging flow for safer delivery.",
    contentTranslations: {},
    coverImage: "",
    gallery: [],
    createdAt: now,
  },
];
