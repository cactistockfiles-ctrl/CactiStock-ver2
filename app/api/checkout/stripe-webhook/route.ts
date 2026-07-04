import { NextResponse } from "next/server";
import crypto from "crypto";
import { getDb } from "@/lib/firebase-server";
import { revalidatePublicContent } from "@/lib/api-helpers";

// POST /api/checkout/stripe-webhook
export async function POST(req: Request) {
  try {
    // Read raw body as text for signature verification
    const payload = await req.text();
    const sigHeader = req.headers.get("stripe-signature") || "";
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET not configured");
      return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
    }

    // Parse Stripe signature header: t=timestamp,v1=signature
    const parts = sigHeader.split(",").map((p) => p.trim());
    const timestampPart = parts.find((p) => p.startsWith("t="));
    const v1Parts = parts.filter((p) => p.startsWith("v1=")).map((p) => p.slice(3));

    if (!timestampPart || v1Parts.length === 0) {
      console.error("Missing stripe-signature header parts");
      return NextResponse.json({ error: "Invalid signature header" }, { status: 400 });
    }

    const timestamp = Number(timestampPart.slice(2));
    if (!Number.isFinite(timestamp)) {
      return NextResponse.json({ error: "Invalid timestamp" }, { status: 400 });
    }

    const signedPayload = `${timestamp}.${payload}`;
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(signedPayload)
      .digest("hex");

    // Timing-safe compare against any v1 signatures
    const valid = v1Parts.some((sig) => {
      try {
        const a = Buffer.from(sig, "hex");
        const b = Buffer.from(expectedSignature, "hex");
        if (a.length !== b.length) return false;
        return crypto.timingSafeEqual(a, b);
      } catch (e) {
        return false;
      }
    });

    // Enforce a tolerance of 5 minutes
    const tolerance = 5 * 60;
    if (
      !valid ||
      Math.abs(Math.floor(Date.now() / 1000) - timestamp) > tolerance
    ) {
      console.error("Invalid or expired webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Parse event JSON
    const event = JSON.parse(payload) as any;

    // Handle checkout.session.completed
    if (event.type === "checkout.session.completed") {
      const session = event.data?.object;
      const sessionId = session?.id;
      // Prefer client_reference_id, fall back to metadata.orderId
      const orderId =
        session?.client_reference_id || session?.metadata?.orderId;

      if (!orderId) {
        console.error("No orderId found on session", sessionId);
        return NextResponse.json({ error: "No orderId on session" }, { status: 400 });
      }

      console.log(`[Stripe Webhook] Processing session ${sessionId} for order ${orderId}`);

      const db = getDb();

      const orderRef = db.collection("orders").doc(orderId);
      const orderDoc = await orderRef.get();
      if (!orderDoc.exists) {
        console.error("Order not found for webhook", orderId);
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      const orderData = orderDoc.data() as { items?: Array<{ id?: string }> };
      const orderedItemIds = Array.isArray(orderData?.items)
        ? orderData.items.map((item) => String(item?.id)).filter(Boolean)
        : [];

      const update: Record<string, any> = {
        paymentStatus: "paid",
        paidAt: new Date().toISOString(),
        stripeSessionId: sessionId,
        updatedAt: new Date().toISOString(),
      };

      if (typeof session?.amount_total === "number") {
        update.paidAmount = session.amount_total / 100;
      }

      // If payment_intent is present on the session, store it and try to fetch fee details
      if (session?.payment_intent) {
        try {
          update.paymentIntentId = session.payment_intent;
          // Fetch payment_intent with expanded charge->balance_transaction to read fee
          const stripeRes = await fetch(
            `https://api.stripe.com/v1/payment_intents/${session.payment_intent}?expand[]=charges.data.balance_transaction`,
            {
              method: "GET",
              headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
            }
          );
          if (stripeRes.ok) {
            const pi = await stripeRes.json();
            const charges = pi.charges?.data || [];
            let totalFee = 0;
            for (const c of charges) {
              const bt = c.balance_transaction;
              if (bt && typeof bt.fee === "number") {
                totalFee += bt.fee;
                // store the balance transaction id too if available
                update.stripeBalanceTransactionId = bt.id;
              }
            }
            if (totalFee > 0) {
              update.stripeFee = totalFee / 100; // convert cents to major currency
            }
          } else {
            console.warn("Failed to fetch payment_intent for fee estimation", await stripeRes.text());
          }
        } catch (e) {
          console.warn("Error fetching payment_intent details:", e);
        }
      }

      try {
        const batch = db.batch();
        batch.update(orderRef, update);

        console.log(
          `[Stripe Webhook] Marking ${orderedItemIds.length} items as sold for order ${orderId}`
        );
        for (const itemId of orderedItemIds) {
          const cactusRef = db.collection("cacti").doc(itemId);
          batch.update(cactusRef, {
            status: "sold",
            isSold: true,
            soldAt: new Date().toISOString(),
          });
        }

        await batch.commit();
        console.log(
          `[Stripe Webhook] Successfully processed payment for order ${orderId}`
        );

        // Revalidate public content to reflect sold items
        await revalidatePublicContent();
      } catch (err) {
        console.error("Failed to update order or item status from webhook:", err);
        return NextResponse.json(
          { error: "Failed to update order" },
          { status: 500 }
        );
      }

      // Optional: notify via Telegram / LINE
      await sendPaymentNotification(orderId, "Payment received via Stripe");
    }

    // Handle charge.refunded event
    if (event.type === "charge.refunded") {
      const charge = event.data?.object;
      const paymentIntentId = charge?.payment_intent;

      if (!paymentIntentId) {
        console.error("No payment_intent found on charge.refunded event");
        return NextResponse.json({ error: "No payment_intent found" }, { status: 400 });
      }

      // Find order by payment intent (or fallback to stripeSessionId for compatibility)
      const db = getDb();
      const ordersRef = db.collection("orders");
      let snapshot = await ordersRef.where("paymentIntentId", "==", paymentIntentId).get();
      if (snapshot.empty) {
        snapshot = await ordersRef.where("stripeSessionId", "==", paymentIntentId).get();
      }

      if (snapshot.empty) {
        console.error("No order found for payment_intent:", paymentIntentId);
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      const orderDoc = snapshot.docs[0];
      const orderId = orderDoc.id;

      console.log(`[Stripe Webhook] Processing refund for order ${orderId}`);

      // Update order refund status
      await orderDoc.ref.update({
        refundStatus: "completed",
        updatedAt: new Date().toISOString(),
      });

      // Optional: notify via Telegram / LINE
      await sendPaymentNotification(orderId, "Refund processed via Stripe");
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function sendPaymentNotification(orderId: string, message: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) return;

  const notificationMessage = `💳 Payment Notification\n\nOrder ID: ${orderId}\n${message}`;

  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: notificationMessage }),
  }).catch((e) => console.error("Telegram notify failed:", e));
}
