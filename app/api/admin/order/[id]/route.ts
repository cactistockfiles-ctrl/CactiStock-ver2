import { NextResponse } from "next/server";
import { getDb } from "@/lib/firebase-server";
import { requireAdmin } from "@/lib/api-helpers";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = params;
  try {
    const db = getDb();
    const doc = await db.collection("orders").doc(id).get();
    if (!doc.exists) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json({ order: { id: doc.id, ...doc.data() } });
  } catch (err) {
    console.error("Failed to fetch order:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
