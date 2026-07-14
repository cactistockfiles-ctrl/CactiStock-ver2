"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/context/LocaleContext";
import { LOCALE_CURRENCIES, convertCurrency, formatCurrency } from "@/lib/currency";

export function useCurrency(amount: number) {
  const { locale } = useLocale();
  const toCurrency = LOCALE_CURRENCIES[locale] || "THB";

  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    convertCurrency(amount, "THB", toCurrency)
      .then((v) => {
        if (mounted) setConvertedAmount(v);
      })
      .catch(() => {
        if (mounted) setConvertedAmount(amount);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [amount, toCurrency]);

  const finalAmount = convertedAmount ?? amount;

  const formatted = formatCurrency(finalAmount, toCurrency, locale);

  return {
    convertedAmount: finalAmount,
    formatted,
    isLoading,
    currency: toCurrency,
  };
}
