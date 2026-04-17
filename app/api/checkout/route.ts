import { NextRequest, NextResponse } from "next/server";
import { getCacti, saveCacti } from "@/lib/content-store";

export async function POST(req: NextRequest) {
  const { itemIds } = await req.json();

  if (!Array.isArray(itemIds) || itemIds.length === 0) {
    return NextResponse.json({ error: "No selected items" }, { status: 400 });
  }

  const rows = await getCacti();
  const cactiMap = new Map(rows.map((item) => [item.id, item]));
  const locked = itemIds.map((id) => cactiMap.get(id)).filter(Boolean);

  if (locked.length !== itemIds.length) {
    return NextResponse.json({ error: "One or more items no longer exist" }, { status: 409 });
  }

  const sold = locked.find((item) => item?.isSold);
  if (sold) {
    return NextResponse.json({ error: `Item ${sold.id} has already been sold` }, { status: 409 });
  }

  const soldSet = new Set(itemIds);
  const nextRows = rows.map((item) => (soldSet.has(item.id) ? { ...item, isSold: true } : item));
  await saveCacti(nextRows);

  return NextResponse.json({ ok: true, message: "Checkout accepted. First successful checkout wins." });
}
