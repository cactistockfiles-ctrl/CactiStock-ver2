import { NextResponse } from "next/server";
import { requireAdmin, badRequest, revalidatePublicContent } from "@/lib/api-helpers";
import { getDragonCourierRates, saveDragonCourierRates, validateDragonCourierRatesJson } from "@/lib/content-store";
import type { DragonCourierRates } from "@/types/content";

export async function GET() {
  try {
    const doc = await getDragonCourierRates();
    return NextResponse.json({ ok: true, data: doc });
  } catch (err) {
    console.error("GET dragon-courier-rates error:", err);
    return NextResponse.json({ ok: false, error: "Failed to load rates" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  // body: { action: 'validate' | 'publish', json: string, note?: string }
  try {
    const body = await req.json();
    const { action, json, note } = body || {};

    if (!action || !json) return badRequest("Missing action or json payload");

    let parsed: unknown;
    try {
      parsed = typeof json === "string" ? JSON.parse(json) : json;
    } catch (err) {
      console.error("Invalid JSON payload:", err);
      return badRequest("Invalid JSON payload");
    }

    // Validate shape
    const validation = validateDragonCourierRatesJson(parsed);
    if (!validation.ok) {
      return NextResponse.json({ ok: false, errors: validation.errors }, { status: 400 });
    }

    if (action === "validate") {
      return NextResponse.json({ ok: true, validated: true });
    }

    if (action === "publish") {
      const unauthorized = await requireAdmin();
      if (unauthorized) return unauthorized;

      await saveDragonCourierRates({ rates: parsed as unknown as Record<string, Record<string, number>>, updatedBy: "admin", note: note || "" });
      // Revalidate public pages that may use rates
      try {
        await revalidatePublicContent();
      } catch (err) {
        console.error("Revalidate error:", err);
      }

      // Return the saved current document so the UI can show updatedAt
      const saved = await getDragonCourierRates();
      return NextResponse.json({ ok: true, data: saved });
    }

    return badRequest("Unknown action");
  } catch (err) {
    console.error("POST dragon-courier-rates error:", err);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
