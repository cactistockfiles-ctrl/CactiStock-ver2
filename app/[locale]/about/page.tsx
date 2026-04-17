import AboutPage from "@/components/site/AboutPage";
import type { Metadata } from "next";
import { isLocale } from "@/lib/i18n";
import { buildLocaleAlternates, canonicalFor } from "@/lib/seo";
import { Locale } from "@/types/content";

const localeTitle: Record<Locale, string> = {
  th: "เกี่ยวกับเรา",
  en: "About",
  zh: "关于我们",
  id: "Tentang Kami",
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
  const pathAfterLocale = "/about";

  return {
    title: localeTitle[locale],
    description:
      "Our collector-focused approach to rare cactus sourcing and care.",
    alternates: {
      canonical: canonicalFor(locale, pathAfterLocale),
      languages: buildLocaleAlternates(pathAfterLocale),
    },
  };
}

export default function AboutRoutePage() {
  return <AboutPage />;
}
