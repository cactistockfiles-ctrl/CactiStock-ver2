import CataloguePage from "@/components/site/CataloguePage";
import type { Metadata } from "next";
import { isLocale, t } from "@/lib/i18n";
import { buildLocaleAlternates, canonicalFor } from "@/lib/seo";
import { Locale } from "@/types/content";

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
    title: t(locale, "catalogue.title"),
    description: t(locale, "catalogue.subtitle"),
    alternates: {
      canonical: canonicalFor(locale, pathAfterLocale),
      languages: buildLocaleAlternates(pathAfterLocale),
    },
  };
}

export default function CatalogueRoutePage() {
  return <CataloguePage />;
}
