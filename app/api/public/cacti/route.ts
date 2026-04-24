import { NextResponse } from "next/server";
import { getCacti } from "@/lib/content-store";

export async function GET() {
  const items = await getCacti();

  // Filter out items sold > 24 hours
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const filteredItems = items.filter((item) => {
    if (!item.isSold) return true;
    if (!item.soldAt) return true;
    const soldDate = new Date(item.soldAt);
    return soldDate > twentyFourHoursAgo;
  });

  return NextResponse.json(filteredItems, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  });
}
