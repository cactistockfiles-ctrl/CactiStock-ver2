import HomePage from "@/components/site/HomePage";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import { buildLocaleAlternates, canonicalFor } from "@/lib/seo";
import { Locale } from "@/types/content";

const localeTitle: Record<Locale, string> = {
  th: "หน้าหลัก",
  en: "Home",
  zh: "首页",
  id: "Beranda",
};

const localeDescription: Record<Locale, string> = {
  th: "คอลเลกชันกระบองเพชรหายาก พร้อมรายละเอียดครบถ้วน",
  en: "Rare cactus collection with full details and collector-grade quality.",
  zh: "稀有仙人掌收藏，附完整信息与高质量展示。",
  id: "Koleksi kaktus langka dengan detail lengkap.",
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
  return {
    title: localeTitle[locale],
    description: localeDescription[locale],
    alternates: {
      canonical: canonicalFor(locale, "/"),
      languages: buildLocaleAlternates("/"),
    },
  };
}

export default function LocaleHomePage() {
  return <HomePage />;
}
