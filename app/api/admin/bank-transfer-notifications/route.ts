import { NextResponse } from "next/server";
import { getDb } from "@/lib/firebase-server";
import { requireAdmin } from "@/lib/api-helpers";

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const db = getDb();
    const snapshot = await db
      .collection("orders")
      .where("paymentStatus", "==", "pending_bank_transfer")
      .limit(50)
      .get();

    const orders = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...(doc.data() as Record<string, any>),
      }))
      .sort((a: any, b: any) => {
        // Sort by createdAt descending (newest first)
        const aTime = a.createdAt?.toMillis?.() ?? 0;
        const bTime = b.createdAt?.toMillis?.() ?? 0;
        return bTime - aTime;
      });

    return NextResponse.json({ count: orders.length, orders });
  } catch (err) {
    console.error("Failed to fetch bank transfer notifications:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
