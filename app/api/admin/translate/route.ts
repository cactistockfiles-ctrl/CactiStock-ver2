import { NextRequest, NextResponse } from "next/server";
import { translateToAllLanguages, SUPPORTED_LOCALES } from "@/lib/translation";

export async function POST(req: NextRequest) {
  try {
    const { text, sourceLang } = await req.json();

    if (!text || !sourceLang) {
      return NextResponse.json(
        { error: "Missing text or sourceLang" },
        { status: 400 },
      );
    }

    const translations = await translateToAllLanguages(
      text,
      sourceLang,
      [...SUPPORTED_LOCALES],
    );

    return NextResponse.json({ translations });
  } catch (error) {
    console.error("Translation API error:", error);
    return NextResponse.json(
      { error: "Translation failed" },
      { status: 500 },
    );
  }
}
