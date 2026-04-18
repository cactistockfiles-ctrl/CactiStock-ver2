import HomePage from "@/components/site/HomePage";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
  return {
    title: t(locale, "nav.home"),
    description: t(locale, "footer.description"),
    alternates: {
      canonical: canonicalFor(locale, "/"),
      languages: buildLocaleAlternates("/"),
    },
  };
}

export default function LocaleHomePage() {
  return <HomePage />;
}
