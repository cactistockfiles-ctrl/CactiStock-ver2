"use client";

import { usePathname, useRouter } from "next/navigation";
import { localeLabels, LOCALES } from "@/lib/i18n";
import { Locale } from "@/types/content";
import { cn } from "@/lib/utils";
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

export default function LanguageSwitcher({
  locale,
  triggerClassName,
  disableBorder,
}: {
  locale: Locale;
  triggerClassName?: string;
  disableBorder?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const currentPath = pathname || `/${locale}`;

  const handleLanguageChange = (newLocale: string) => {
    const newPath = swapLocale(currentPath, newLocale as Locale);
    router.push(newPath);
  };

  const triggerBase = disableBorder
    ? "relative w-[100px] justify-center pl-3 pr-8 rounded-md bg-transparent px-0 py-0 text-left text-sm focus:outline-none focus:ring-0 !border-0 !shadow-none !ring-0 hover:text-white"
    : "relative w-[100px] justify-center pl-3 pr-8 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:text-white";

  return (
    <Select value={locale} onValueChange={handleLanguageChange}>
      <SelectTrigger
        className={cn(
          triggerBase,
          !disableBorder &&
            "[&>span]:absolute [&>span]:left-1/2 [&>span]:-translate-x-1/2 [&>span]:text-center [&>svg]:absolute [&>svg]:right-3 [&>svg]:left-auto !border-0 !shadow-none !ring-0",
          triggerClassName,
        )}
      >
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
