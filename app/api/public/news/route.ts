import { NextResponse } from "next/server";
import { getNews } from "@/lib/content-store";

export async function GET() {
  const items = await getNews();
  return NextResponse.json(items, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  });
}
