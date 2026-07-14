import { NextResponse } from "next/server";
import { requireAdmin, badRequest, revalidatePublicContent } from "@/lib/api-helpers";
import { getPackingSettings, savePackingSettings, validatePackingSettingsJson } from "@/lib/content-store";

export async function GET() {
  try {
    const doc = await getPackingSettings();
    return NextResponse.json({ ok: true, data: doc });
  } catch (err) {
    console.error("GET packing-settings error:", err);
    return NextResponse.json({ ok: false, error: "Failed to load packing settings" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, json, note } = body || {};

    if (!action || json === undefined) return badRequest("Missing action or json payload");

    let parsed: unknown;
    try {
      parsed = typeof json === "string" ? JSON.parse(json) : json;
    } catch (err) {
      console.error("Invalid JSON payload:", err);
      return badRequest("Invalid JSON payload");
    }

    const validation = validatePackingSettingsJson(parsed);
    if (!validation.ok) {
      return NextResponse.json({ ok: false, errors: validation.errors }, { status: 400 });
    }

    if (action === "validate") {
      return NextResponse.json({ ok: true, validated: true });
    }

    if (action === "publish") {
      const unauthorized = await requireAdmin();
      if (unauthorized) return unauthorized;

      await savePackingSettings({ ...(parsed as any), updatedBy: "admin", note: note || "" });

      try {
        await revalidatePublicContent();
      } catch (err) {
        console.error("Revalidate error:", err);
      }

      const saved = await getPackingSettings();
      return NextResponse.json({ ok: true, data: saved });
    }

    return badRequest("Unknown action");
  } catch (err) {
    console.error("POST packing-settings error:", err);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
