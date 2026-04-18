import { NextRequest, NextResponse } from "next/server";
import { convertCurrency, LOCALE_CURRENCIES } from "@/lib/currency";

export async function POST(req: NextRequest) {
  try {
    const { amount, fromLocale, toLocale } = await req.json();

    if (!amount || !fromLocale || !toLocale) {
      return NextResponse.json(
        { error: "Missing amount, fromLocale, or toLocale" },
        { status: 400 },
      );
    }

    const fromCurrency = LOCALE_CURRENCIES[fromLocale] || "THB";
    const toCurrency = LOCALE_CURRENCIES[toLocale] || "THB";

    const convertedAmount = await convertCurrency(
      amount,
      fromCurrency,
      toCurrency,
    );

    return NextResponse.json({
      convertedAmount,
      fromCurrency,
      toCurrency,
    });
  } catch (error) {
    console.error("Currency conversion API error:", error);
    return NextResponse.json(
      { error: "Currency conversion failed" },
      { status: 500 },
    );
  }
}
