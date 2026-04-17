"use client";

import { createContext, useContext, useMemo } from "react";
import { Locale } from "@/types/content";
import { t as tRaw } from "@/lib/i18n";

interface LocaleContextValue {
  locale: Locale;
  t: (path: string) => string;
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const value = useMemo(
    () => ({
      locale,
      t: (path: string) => tRaw(locale, path),
    }),
    [locale],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const value = useContext(LocaleContext);
  if (!value) {
    throw new Error("useLocale must be used in LocaleProvider");
  }

  return value;
}
