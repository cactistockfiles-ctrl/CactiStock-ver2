import { NextResponse } from "next/server";
import { getDb } from "@/lib/firebase-server";
import { requireAdmin } from "@/lib/api-helpers";

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const db = getDb();
  const snapshot = await db
    .collection("orders")
    .orderBy("createdAt", "desc")
    .get();

  const orders = snapshot.docs
    .map((doc) => ({
      id: doc.id,
      ...(doc.data() as Record<string, unknown>),
    }))
    .filter((order: Record<string, unknown>) => 
      String(order.paymentStatus ?? "") === "paid" ||
      String(order.paymentStatus ?? "") === "partially_refunded" ||
      String(order.paymentStatus ?? "") === "refunded"
    );

  return NextResponse.json({ orders });
}
