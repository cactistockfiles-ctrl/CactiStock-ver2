export type ConsentCategory = "necessary" | "analytics" | "marketing";

const CONSENT_KEY = "cactistock_cookie_consent";

export function readConsentFromStorage(): Record<ConsentCategory, boolean> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Record<ConsentCategory, boolean>;
  } catch (e) {
    console.error("readConsentFromStorage error", e);
    return null;
  }
}

export function saveConsentToStorage(consent: Record<ConsentCategory, boolean>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
  } catch (e) {
    console.error("saveConsentToStorage error", e);
  }
}

export function clearConsent() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(CONSENT_KEY);
  } catch (e) {
    console.error("clearConsent error", e);
  }
}

export function defaultConsent(): Record<ConsentCategory, boolean> {
  return {
    necessary: true,
    analytics: false,
    marketing: false,
  };
}
