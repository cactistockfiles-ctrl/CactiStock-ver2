import CartPage from "@/components/site/CartPage";
import type { Metadata } from "next";
import { isLocale } from "@/lib/i18n";
import { buildLocaleAlternates, canonicalFor } from "@/lib/seo";
import { Locale } from "@/types/content";

const localeTitle: Record<Locale, string> = {
  th: "ตะกร้า",
  en: "Cart",
  zh: "购物车",
  id: "Keranjang",
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
  const pathAfterLocale = "/cart";

  return {
    title: localeTitle[locale],
    description: "Review selected one-of-a-kind cactus items before checkout.",
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
