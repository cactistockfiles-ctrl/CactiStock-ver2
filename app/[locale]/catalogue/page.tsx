import CataloguePage from "@/components/site/CataloguePage";
import type { Metadata } from "next";
import { isLocale } from "@/lib/i18n";
import { buildLocaleAlternates, canonicalFor } from "@/lib/seo";
import { Locale } from "@/types/content";

const localeTitle: Record<Locale, string> = {
  th: "แคตตาล็อก",
  en: "Catalogue",
  zh: "目录",
  id: "Katalog",
};

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  if (!isLocale(params.locale)) {
    return {};
  }

  const locale = params.locale as Locale;
  const pathAfterLocale = "/catalogue";

  return {
    title: localeTitle[locale],
    description: "Rare cactus listing sorted by newest/oldest and family.",
    alternates: {
      canonical: canonicalFor(locale, pathAfterLocale),
      languages: buildLocaleAlternates(pathAfterLocale),
    },
  };
}

export default function CatalogueRoutePage() {
  return <CataloguePage />;
}
