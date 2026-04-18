import BlogPage from "@/components/site/BlogPage";
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
  const pathAfterLocale = "/blog";

  return {
    title: t(locale, "nav.blog"),
    description: t(locale, "blog.subtitle"),
    alternates: {
      canonical: canonicalFor(locale, pathAfterLocale),
      languages: buildLocaleAlternates(pathAfterLocale),
    },
  };
}

export default function BlogRoutePage() {
  return <BlogPage />;
}
