import { NextResponse } from "next/server";
import { getDb } from "@/lib/firebase-server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const email = String(body?.email ?? "").trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    const db = getDb();
    // Query orders for this email and sort in memory to avoid requiring a composite index.
    const snapshot = await db
      .collection("orders")
      .where("contactEmail", "==", email)
      .get();

    const orders = snapshot.docs
      .map((doc) => doc.data())
      .sort((a, b) => {
        const aTime = new Date(a.createdAt ?? 0).getTime();
        const bTime = new Date(b.createdAt ?? 0).getTime();
        return bTime - aTime;
      });
    return NextResponse.json(orders);
  } catch (err) {
    console.error("Failed to fetch user orders:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
