import CartPage from "@/components/site/CartPage";
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
  const pathAfterLocale = "/cart";

  return {
    title: t(locale, "cart.title"),
    description: t(locale, "cart.emptyDesc"),
    alternates: {
      canonical: canonicalFor(locale, pathAfterLocale),
      languages: buildLocaleAlternates(pathAfterLocale),
    },
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default function CartRoutePage() {
  return <CartPage />;
}
