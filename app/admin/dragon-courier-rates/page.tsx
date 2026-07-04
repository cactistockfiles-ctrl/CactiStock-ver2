"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/sonner";

export default function DragonCourierRatesAdmin() {
  const [jsonText, setJsonText] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[] | null>(null);
  const [savedInfo, setSavedInfo] = useState<{ updatedAt?: string; updatedBy?: string } | null>(null);

  useEffect(() => {
    // load current rates if present
    fetch("/api/admin/dragon-courier-rates")
      .then((r) => r.json())
      .then((d) => {
        if (d?.ok && d.data?.rates) {
          setJsonText(JSON.stringify(d.data.rates, null, 2));
          if (d.data.updatedAt) {
            setSavedInfo({ updatedAt: d.data.updatedAt, updatedBy: d.data.updatedBy });
          }
        }
      })
      .catch(() => {});
  }, []);

  async function handleValidate() {
    setLoading(true);
    setErrors(null);
    try {
      const res = await fetch("/api/admin/dragon-courier-rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "validate", json: jsonText }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors(data.errors || [data.error || "Validation failed"]);
        toast.error("Validation failed");
      } else {
        toast.success("JSON validated successfully");
      }
    } catch (err) {
      toast.error("Validation request failed");
    } finally {
      setLoading(false);
    }
  }

  async function handlePublish() {
    setLoading(true);
    setErrors(null);
    try {
      const res = await fetch("/api/admin/dragon-courier-rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish", json: jsonText, note }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors(data.errors || [data.error || "Publish failed"]);
        toast.error("Publish failed");
      } else {
        toast.success("Rates published successfully");
        if (data?.data?.updatedAt) {
          setSavedInfo({ updatedAt: data.data.updatedAt, updatedBy: data.data.updatedBy });
        }
      }
    } catch (err) {
      toast.error("Publish request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Dragon Courier Rates</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Paste the Dragon Courier rates JSON here. Top-level keys should be zones
        A..I, each mapping weight (kg) to price (THB).{" "}
        {`Example: {"A": {"0.5": 1458, "1.0": 1591}}`}
      </p>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          Note (optional)
        </label>
        <Input
          value={note}
          onChange={(e) => setNote((e.target as HTMLInputElement).value)}
        />
      </div>

      <div className="mb-4">
        <Textarea
          value={jsonText}
          onChange={(e) => setJsonText((e.target as HTMLTextAreaElement).value)}
          rows={20}
        />
      </div>

      {errors && (
        <div className="mb-4 text-sm text-destructive">
          <strong>Errors:</strong>
          <ul className="list-disc ml-6">
            {errors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-2">
        <Button onClick={handleValidate} disabled={loading} variant="secondary">
          Validate
        </Button>
        <div className="flex items-center gap-2">
          <Button onClick={handlePublish} disabled={loading}>
            Publish
          </Button>
          {savedInfo?.updatedAt && (
            <div className="flex items-center gap-2 text-sm text-success">
              <Check className="h-4 w-4" />
              <div>
                <div>Active</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(savedInfo.updatedAt).toLocaleString()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
