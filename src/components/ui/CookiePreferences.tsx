"use client";

import React, { useEffect, useState } from "react";
import { readConsentFromStorage, defaultConsent } from "@/lib/cookie-consent";
import { Button } from "@/components/ui/button";

export default function CookiePreferences({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (next: Record<string, boolean>) => void;
}) {
  const [prefs, setPrefs] = useState<Record<string, boolean>>(defaultConsent());

  useEffect(() => {
    const stored = readConsentFromStorage();
    if (stored) setPrefs(stored as Record<string, boolean>);
  }, []);

  function toggle(key: string) {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  }

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="rounded-3xl border bg-card p-6 z-70 w-full max-w-lg shadow-lg">
        <h3 className="text-lg font-display font-medium mb-4 text-card-foreground">
          Cookie Preferences
        </h3>
        <div className="space-y-4 text-sm text-muted-foreground">
          <div>
            <strong>Necessary</strong>
            <div className="text-sm text-muted-foreground">
              Required for auth and core functionality.
            </div>
            <div className="mt-1">Always enabled</div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <strong>Analytics</strong>
              <div className="text-sm text-muted-foreground">
                Helps us understand usage (pageviews).
              </div>
            </div>
            <label className="inline-flex relative items-center cursor-pointer">
              <input
                type="checkbox"
                checked={!!prefs.analytics}
                onChange={() => toggle("analytics")}
                className="sr-only peer"
              />
              <div
                className={`w-11 h-6 rounded-full bg-muted peer-checked:bg-primary transition-colors`}
              />
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <strong>Marketing</strong>
              <div className="text-sm text-muted-foreground">
                Personalized ads and promotions.
              </div>
            </div>
            <label className="inline-flex relative items-center cursor-pointer">
              <input
                type="checkbox"
                checked={!!prefs.marketing}
                onChange={() => toggle("marketing")}
                className="sr-only peer"
              />
              <div
                className={`w-11 h-6 rounded-full bg-muted peer-checked:bg-primary transition-colors`}
              />
            </label>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="default" size="sm" onClick={() => onSave(prefs)}>
            Save preferences
          </Button>
        </div>
      </div>
    </div>
  );
}
