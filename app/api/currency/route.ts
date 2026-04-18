import { NextRequest, NextResponse } from "next/server";

const FRANKFURTER_API_URL = "https://api.frankfurter.app";

interface ExchangeRateResponse {
  amount: number;
  base: string;
  date: string;
  rates: Record<string, number>;
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const from = searchParams.get("from") || "THB";

  try {
    const response = await fetch(
      `${FRANKFURTER_API_URL}/latest?from=${from}`,
      {
        headers: {
          "User-Agent": "CactiStock/1.0",
        },
      },
    );

    if (!response.ok) {
      console.error("Exchange rate API error:", response.statusText);
      return NextResponse.json({ rates: {} }, { status: response.status });
    }

    const data: ExchangeRateResponse = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Exchange rate fetch error:", error);
    return NextResponse.json({ rates: {} }, { status: 500 });
  }
}
