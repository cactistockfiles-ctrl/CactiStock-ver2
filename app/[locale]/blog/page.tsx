import BlogPage from "@/components/site/BlogPage";
import type { Metadata } from "next";
import { isLocale } from "@/lib/i18n";
import { buildLocaleAlternates, canonicalFor } from "@/lib/seo";
import { Locale } from "@/types/content";

const localeTitle: Record<Locale, string> = {
  th: "บล็อก",
  en: "Blog",
  zh: "博客",
  id: "Blog",
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
  const pathAfterLocale = "/blog";

  return {
    title: localeTitle[locale],
    description: "Cactus guides, propagation notes, and collector stories.",
    alternates: {
      canonical: canonicalFor(locale, pathAfterLocale),
      languages: buildLocaleAlternates(pathAfterLocale),
    },
  };
}

export default function BlogRoutePage() {
  return <BlogPage />;
}
