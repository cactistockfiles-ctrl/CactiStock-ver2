import { NextResponse } from "next/server";
import { getDb } from "@/lib/firebase-server";
import { CactusItem } from "@/types/content";

export async function GET() {
  const db = getDb();
  const snapshot = await db.collection("cacti").get();
  const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as CactusItem[];

  // Filter out items sold > 24 hours
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const filteredItems = items.filter((item) => {
    if (!item.isSold) return true;
    if (!item.soldAt) return true;
    const soldDate = new Date(item.soldAt);
    return soldDate > twentyFourHoursAgo;
  });

  return NextResponse.json(filteredItems);
}
