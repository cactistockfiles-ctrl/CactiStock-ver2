const CURRENCY_API_URL = "/api/currency";

interface ExchangeRateResponse {
  amount: number;
  base: string;
  date: string;
  rates: Record<string, number>;
}

// Currency codes for each locale
export const LOCALE_CURRENCIES: Record<string, string> = {
  th: "THB",
  en: "USD",
  zh: "CNY",
  id: "IDR",
};

// Cache exchange rates for 1 hour
let cachedRates: Record<string, number> | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export async function getExchangeRates(baseCurrency: string = "THB"): Promise<Record<string, number>> {
  const now = Date.now();

  // Return cached rates if still valid
  if (cachedRates && now - cacheTimestamp < CACHE_DURATION) {
    return cachedRates;
  }

  try {
    const response = await fetch(
      `${CURRENCY_API_URL}?from=${baseCurrency}`,
    );

    if (!response.ok) {
      console.error("Exchange rate API error:", response.statusText);
      return {};
    }

    const data: ExchangeRateResponse = await response.json();

    // Cache the rates
    cachedRates = data.rates;
    cacheTimestamp = now;

    return data.rates;
  } catch (error) {
    console.error("Exchange rate fetch error:", error);
    return {};
  }
}

export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
): Promise<number> {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  const rates = await getExchangeRates(fromCurrency);
  const rate = rates[toCurrency];

  if (!rate) {
    console.error(`No exchange rate found for ${toCurrency}`);
    return amount;
  }

  return amount * rate;
}

export function formatCurrency(amount: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
  }).format(amount);
}
