import { useQuery } from "@tanstack/react-query";
import { useLocale } from "@/context/LocaleContext";
import { LOCALE_CURRENCIES, convertCurrency, formatCurrency } from "@/lib/currency";

export function useCurrency(amount: number) {
  const { locale } = useLocale();
  const toCurrency = LOCALE_CURRENCIES[locale] || "THB";

  const { data: convertedAmount, isLoading } = useQuery({
    queryKey: ["currency", amount, toCurrency],
    queryFn: () => convertCurrency(amount, "THB", toCurrency),
    staleTime: 60 * 60 * 1000, // 1 hour
  });

  const formatted = formatCurrency(
    convertedAmount || amount,
    toCurrency,
    locale,
  );

  return {
    convertedAmount: convertedAmount || amount,
    formatted,
    isLoading,
    currency: toCurrency,
  };
}
