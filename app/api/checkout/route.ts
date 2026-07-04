import { NextRequest, NextResponse } from "next/server";
import { getCacti, saveCacti } from "@/lib/content-store";
import { getDb } from "@/lib/firebase-server";
import { generateOrderId } from "@/lib/order-id";
import { reserveOrderSequence } from "@/lib/order-sequence";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { itemIds } = body;

  if (!Array.isArray(itemIds) || itemIds.length === 0) {
    return NextResponse.json({ error: "No selected items" }, { status: 400 });
  }

  const rows = await getCacti();
  const cactiMap = new Map(rows.map((item) => [item.id, item]));
  const locked = itemIds.map((id: string) => cactiMap.get(id)).filter(Boolean);

  if (locked.length !== itemIds.length) {
    return NextResponse.json({ error: "One or more items no longer exist" }, { status: 409 });
  }

  const sold = locked.find((item) => item?.isSold);
  if (sold) {
    return NextResponse.json({ error: `Item ${sold.id} has already been sold` }, { status: 409 });
  }

  let orderId = generateOrderId();
  try {
    const db = getDb();
    const sequence = await reserveOrderSequence(db);
    orderId = generateOrderId(sequence);
  } catch (error) {
    console.error("Failed to reserve order sequence:", error);
  }

  return NextResponse.json({ ok: true, orderId, message: "Order ID generated. Proceed to payment." });
}
