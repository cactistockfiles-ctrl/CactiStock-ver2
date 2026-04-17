"use client";

import { usePathname, useRouter } from "next/navigation";
import { localeLabels, LOCALES } from "@/lib/i18n";
import { Locale } from "@/types/content";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function swapLocale(pathname: string, targetLocale: Locale) {
  const parts = pathname.split("/");
  if (parts.length < 2) {
    return `/${targetLocale}`;
  }

  parts[1] = targetLocale;
  return parts.join("/");
}

export default function LanguageSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const router = useRouter();
  const currentPath = pathname || `/${locale}`;

  const handleLanguageChange = (newLocale: string) => {
    const newPath = swapLocale(currentPath, newLocale as Locale);
    router.push(newPath);
  };

  return (
    <Select value={locale} onValueChange={handleLanguageChange}>
      <SelectTrigger className="relative w-[100px] justify-center pl-3 pr-8 [&>span]:absolute [&>span]:left-1/2 [&>span]:-translate-x-1/2 [&>span]:text-center [&>svg]:absolute [&>svg]:right-3 [&>svg]:left-auto">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {LOCALES.map((lang) => (
          <SelectItem key={lang} value={lang}>
            {localeLabels[lang]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
