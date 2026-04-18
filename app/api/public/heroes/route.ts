import { NextResponse } from "next/server";
import { getHeroes } from "@/lib/content-store";

export async function GET() {
  const items = await getHeroes();
  return NextResponse.json(items.filter((hero) => hero.active !== false), {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  });
}
