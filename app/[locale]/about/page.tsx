import AboutPage from "@/components/site/AboutPage";
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
  const pathAfterLocale = "/about";

  return {
    title: t(locale, "about.title"),
    description: t(locale, "about.whoWeAreDesc"),
    alternates: {
      canonical: canonicalFor(locale, pathAfterLocale),
      languages: buildLocaleAlternates(pathAfterLocale),
    },
  };
}

export default function AboutRoutePage() {
  return <AboutPage />;
}
