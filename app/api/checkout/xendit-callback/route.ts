import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebase-server";
import { revalidatePublicContent } from "@/lib/api-helpers";

/**
 * POST /api/checkout/xendit-callback
 * Webhook handler for Xendit payment status updates
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Xendit sends verification token via header
    const xenditToken = req.headers.get("x-xendit-token");

    // Basic verification (should add proper signature verification in production)
    if (!xenditToken) {
      console.error("Missing Xendit verification token");
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const {
      id,
      external_id,
      status,
      paid_amount,
      paid_at,
      payment_method,
    } = body;

    console.log(
      `[Xendit Webhook] Processing invoice ${id} with status: ${status}, external_id: ${external_id}`
    );

    // Extract order ID from external_id (format: order_{orderId}_{timestamp})
    const orderId = external_id?.split("_")?.[1];

    if (!orderId) {
      console.error("Invalid external_id format:", external_id);
      return NextResponse.json(
        {
          error: "Invalid external_id format",
        },
        { status: 400 }
      );
    }

    // Update order status in database
    const db = getDb();
    const orderRef = db.collection("orders").doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      console.error("Order not found:", orderId);
      return NextResponse.json(
        {
          error: "Order not found",
        },
        { status: 404 }
      );
    }

    const orderData = orderDoc.data() as {
      items?: Array<{ id?: string }>;
      paymentStatus?: string;
    };
    const orderedItemIds = Array.isArray(orderData?.items)
      ? orderData.items.map((item) => String(item?.id)).filter(Boolean)
      : [];

    if (status === "PAID") {
      const batch = db.batch();
      
      // Update order with payment confirmation
      batch.update(orderRef, {
        paymentStatus: "paid",
        paidAt: new Date().toISOString(),
        xenditInvoiceId: id,
        xenditPaymentMethod: payment_method,
        paidAmount: paid_amount,
        updatedAt: new Date().toISOString(),
      });

      // Mark all ordered items as sold
      console.log(`[Xendit Webhook] Marking ${orderedItemIds.length} items as sold for order ${orderId}`);
      for (const itemId of orderedItemIds) {
        const cactusRef = db.collection("cacti").doc(itemId);
        batch.update(cactusRef, {
          status: "sold",
          isSold: true,
          soldAt: new Date().toISOString(),
        });
      }

      await batch.commit();
      console.log(`[Xendit Webhook] Successfully processed payment for order ${orderId}`);

      // Revalidate public content to reflect sold items
      await revalidatePublicContent();

      // Send notification (optional)
      await sendPaymentNotification(
        orderId,
        "Payment received successfully",
        paid_amount
      );
    } else if (status === "EXPIRED") {
      await orderRef.update({
        paymentStatus: "expired",
        expiredAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      console.log(`[Xendit Webhook] Order ${orderId} payment expired`);
    } else if (status === "PENDING") {
      await orderRef.update({
        paymentStatus: "pending",
        updatedAt: new Date().toISOString(),
      });
      console.log(`[Xendit Webhook] Order ${orderId} payment pending`);
    }

    return NextResponse.json(
      {
        success: true,
        message: `Invoice ${id} status updated to ${status}`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing Xendit callback:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

async function sendPaymentNotification(
  orderId: string,
  message: string,
  amount?: number
) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    return;
  }

  const amountStr = amount ? `\nAmount: ฿${amount.toLocaleString("th-TH")}` : "";
  const notificationMessage = `💳 Payment Notification\n\nOrder ID: ${orderId}\n${message}${amountStr}`;

  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: notificationMessage,
    }),
  }).catch((error) => {
    console.error("Failed to send Telegram notification:", error);
  });
}
