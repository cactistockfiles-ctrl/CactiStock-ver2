import { NextResponse } from "next/server";
import { getDb } from "@/lib/firebase-server";
import { badRequest, requireAdmin, revalidatePublicContent } from "@/lib/api-helpers";

async function getOrder(orderId: string) {
  const db = getDb();
  const orderRef = db.collection("orders").doc(orderId);
  const orderDoc = await orderRef.get();
  if (!orderDoc.exists) return null;

  const orderData = orderDoc.data() as Record<string, unknown>;
  const items = Array.isArray(orderData.items)
    ? orderData.items
        .map((item) => ({
          id: String((item as Record<string, unknown>)?.id ?? "").trim(),
          name: String((item as Record<string, unknown>)?.name ?? "").trim(),
        }))
        .filter((item) => item.id)
    : [];

  return {
    id: orderId,
    paymentStatus: String(orderData.paymentStatus ?? ""),
    stripeSessionId: String(orderData.stripeSessionId ?? ""),
    items,
  };
}

async function getItemStatuses(itemIds: string[]) {
  const db = getDb();
  const statuses: Record<string, { status: string; isSold: boolean }> = {};
  const itemRefs = itemIds.map((id) => db.collection("cacti").doc(id));
  const snapshots = await Promise.all(itemRefs.map((ref) => ref.get()));

  snapshots.forEach((snap, index) => {
    const id = itemIds[index];
    if (!snap.exists) {
      statuses[id] = { status: "missing", isSold: false };
      return;
    }
    const data = snap.data() as Record<string, unknown>;
    statuses[id] = {
      status: String(data?.status ?? ""),
      isSold: Boolean(data?.isSold ?? false),
    };
  });

  return statuses;
}

async function fixPaidOrder(orderId: string) {
  const db = getDb();
  const orderRef = db.collection("orders").doc(orderId);
  const orderDoc = await orderRef.get();
  if (!orderDoc.exists) {
    return { fixed: 0, orderFound: false, message: "Order not found" };
  }

  const orderData = orderDoc.data() as Record<string, unknown>;
  const paymentStatus = String(orderData.paymentStatus ?? "");
  if (paymentStatus !== "paid") {
    return { fixed: 0, orderFound: true, message: "Order is not paid" };
  }

  const items = Array.isArray(orderData.items)
    ? orderData.items
        .map((item) => String((item as Record<string, unknown>)?.id ?? "").trim())
        .filter(Boolean)
    : [];

  if (items.length === 0) {
    return { fixed: 0, orderFound: true, message: "No item IDs found in order" };
  }

  const batch = db.batch();
  let fixCount = 0;

  for (const itemId of items) {
    const cactusRef = db.collection("cacti").doc(itemId);
    batch.update(cactusRef, {
      status: "sold",
      isSold: true,
      soldAt: new Date().toISOString(),
    });
    fixCount += 1;
  }

  await batch.commit();
  await revalidatePublicContent();

  return { fixed: fixCount, orderFound: true, message: "Order items updated to sold" };
}

export async function GET(req: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const url = new URL(req.url);
  const orderId = url.searchParams.get("orderId")?.trim();
  if (!orderId) {
    return badRequest("Missing orderId query parameter");
  }

  const order = await getOrder(orderId);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const itemStatuses = await getItemStatuses(order.items.map((item) => item.id));
  return NextResponse.json({ order, itemStatuses });
}

export async function POST(req: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const payload = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!payload) {
    return badRequest("Invalid JSON payload");
  }

  const orderId = String(payload.orderId ?? "").trim();
  if (!orderId) {
    return badRequest("Missing orderId in request body");
  }

  const result = await fixPaidOrder(orderId);
  if (!result.orderFound) {
    return NextResponse.json({ error: result.message }, { status: 404 });
  }

  return NextResponse.json(result);
}
