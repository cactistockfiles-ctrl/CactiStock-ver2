"use client";

import React, { useEffect, useState } from "react";
import {
  readConsentFromStorage,
  saveConsentToStorage,
  defaultConsent,
} from "@/lib/cookie-consent";
import CookiePreferences from "./CookiePreferences";
import { Button } from "@/components/ui/button";

export default function CookieBanner() {
  const [consent, setConsent] = useState<Record<string, boolean> | null>(null);
  const [showPreferences, setShowPreferences] = useState(false);

  useEffect(() => {
    const stored = readConsentFromStorage();
    if (stored) setConsent(stored);
  }, []);

  if (consent) return null;

  function acceptAll() {
    const next = { ...defaultConsent(), analytics: true, marketing: true };
    saveConsentToStorage(next);
    setConsent(next);
  }

  function declineNonEssential() {
    const next = { ...defaultConsent(), analytics: false, marketing: false };
    saveConsentToStorage(next);
    setConsent(next);
  }

  return (
    <>
      <div className="fixed bottom-4 left-4 right-4 z-50 rounded-3xl border bg-card p-4 shadow-lg flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="flex-1 text-sm text-muted-foreground">
          เราใช้คุกกี้เพื่อปรับปรุงเว็บไซต์และวิเคราะห์การใช้งาน —
          คุณสามารถยอมรับทั้งหมดหรือจัดการการตั้งค่าได้
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={declineNonEssential}>
            Decline
          </Button>
          <Button variant="default" size="sm" onClick={acceptAll}>
            Accept all
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreferences(true)}
          >
            Manage
          </Button>
        </div>
      </div>

      {showPreferences && (
        <CookiePreferences
          onClose={() => setShowPreferences(false)}
          onSave={(next) => {
            saveConsentToStorage(next);
            setConsent(next);
            setShowPreferences(false);
          }}
        />
      )}
    </>
  );
}
