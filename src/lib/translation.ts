const MYMEMORY_API_URL = "https://api.mymemory.translated.net/get";

interface TranslationResponse {
  responseData: {
    translatedText: string;
    matchedText: string;
  };
  responseStatus: number;
  responseDetails: string;
}

export async function translateText(
  text: string,
  sourceLang: string,
  targetLang: string,
): Promise<string> {
  if (!text || text.trim() === "") {
    return "";
  }

  if (sourceLang === targetLang) {
    return text;
  }

  try {
    const response = await fetch(
      `${MYMEMORY_API_URL}?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`,
    );

    if (!response.ok) {
      console.error("Translation API error:", response.statusText);
      return text; // Return original text if translation fails
    }

    const data: TranslationResponse = await response.json();

    if (data.responseStatus === 200) {
      return data.responseData.translatedText;
    } else {
      console.error("Translation failed:", data.responseDetails);
      return text; // Return original text if translation fails
    }
  } catch (error) {
    console.error("Translation error:", error);
    return text; // Return original text if translation fails
  }
}

export async function translateToAllLanguages(
  text: string,
  sourceLang: string,
  targetLangs: string[],
): Promise<Record<string, string>> {
  const translations: Record<string, string> = {
    [sourceLang]: text,
  };

  for (const targetLang of targetLangs) {
    if (targetLang !== sourceLang) {
      translations[targetLang] = await translateText(text, sourceLang, targetLang);
    }
  }

  return translations;
}

export const SUPPORTED_LOCALES = ["th", "en", "zh", "id"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
