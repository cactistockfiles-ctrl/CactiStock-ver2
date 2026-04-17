import { Locale } from "@/types/content";
import { LOCALES } from "@/lib/i18n";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:7400";

export function toAbsoluteUrl(path: string) {
  return new URL(path, SITE_URL).toString();
}

export function buildLocaleAlternates(pathAfterLocale: string) {
  const normalized = pathAfterLocale.startsWith("/") ? pathAfterLocale : `/${pathAfterLocale}`;

  const languages: Record<string, string> = {};
  for (const locale of LOCALES) {
    languages[locale] = toAbsoluteUrl(`/${locale}${normalized}`);
  }
  languages["x-default"] = toAbsoluteUrl(`/th${normalized}`);

  return languages;
}

export function canonicalFor(locale: Locale, pathAfterLocale: string) {
  const normalized = pathAfterLocale.startsWith("/") ? pathAfterLocale : `/${pathAfterLocale}`;
  return toAbsoluteUrl(`/${locale}${normalized}`);
}

export function openGraphLocale(locale: Locale) {
  const map: Record<Locale, string> = {
    th: "th_TH",
    en: "en_US",
    zh: "zh_CN",
    id: "id_ID",
  };

  return map[locale];
}
