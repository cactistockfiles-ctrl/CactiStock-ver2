"use client";

import { useEffect } from "react";
import { readConsentFromStorage } from "@/lib/cookie-consent";

function injectGtag(id: string) {
  if (!id) return;
  if ((window as any).gtagLoaded) return;

  const script1 = document.createElement("script");
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  document.head.appendChild(script1);

  const script2 = document.createElement("script");
  script2.innerHTML = `window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${id}');`;
  document.head.appendChild(script2);

  (window as any).gtagLoaded = true;
}

export default function AnalyticsGate() {
  useEffect(() => {
    try {
      const consent = readConsentFromStorage();
      const allow = consent?.analytics;
      const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
      if (allow && gaId) {
        injectGtag(gaId);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  return null;
}
