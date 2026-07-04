import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebase-server";
import { revalidatePublicContent } from "@/lib/api-helpers";

/**
 * POST /api/admin/refund
 * Creates a refund for an order via Stripe
 * 
 * Expected body:
 * {
 *   orderId: string,
 *   refundAmount: number (optional, defaults to full amount),
 *   refundReason: string,
 *   refundedItemIds: string[] (optional, items to mark as available again)
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, refundAmount, refundReason, refundedItemIds } = body as {
      orderId?: string;
      refundAmount?: number;
      refundReason?: string;
      refundedItemIds?: string[];
    };

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    if (!refundReason) {
      return NextResponse.json({ error: "refundReason is required" }, { status: 400 });
    }

    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecret) {
      console.error("STRIPE_SECRET_KEY not configured");
      return NextResponse.json({ error: "Payment service not configured" }, { status: 500 });
    }

    const db = getDb();
    const orderRef = db.collection("orders").doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const orderData = orderDoc.data() as {
      stripeSessionId?: string;
      paidAmount?: number;
      paymentStatus?: string;
      items?: Array<{ id?: string; price?: number; quantity?: number }>;
    };

    if (!orderData || !orderData.stripeSessionId) {
      return NextResponse.json({ error: "No Stripe session found for this order" }, { status: 400 });
    }

    if (orderData.paymentStatus !== "paid") {
      return NextResponse.json({ error: "Order is not in paid status" }, { status: 400 });
    }

    // Get the payment intent ID from the session
    const sessionRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${orderData.stripeSessionId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${stripeSecret}`,
      },
    });

    if (!sessionRes.ok) {
      const error = await sessionRes.json().catch(() => ({}));
      console.error("Stripe session fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch Stripe session" }, { status: 500 });
    }

    const session = await sessionRes.json();
    const paymentIntentId = session.payment_intent;

    if (!paymentIntentId) {
      return NextResponse.json({ error: "No payment intent found in session" }, { status: 400 });
    }

    // Calculate refund amount (default to full amount if not specified)
    const totalPaid = orderData.paidAmount || 0;
    const amountToRefund = refundAmount !== undefined ? refundAmount : totalPaid;

    if (amountToRefund <= 0) {
      return NextResponse.json({ error: "Refund amount must be greater than 0" }, { status: 400 });
    }

    if (amountToRefund > totalPaid) {
      return NextResponse.json({ error: "Refund amount cannot exceed total paid amount" }, { status: 400 });
    }

    // Create refund via Stripe API
    const bodyParams = new URLSearchParams();
    bodyParams.append("payment_intent", paymentIntentId);
    bodyParams.append("amount", String(Math.round(amountToRefund * 100)));
    bodyParams.append("reason", "requested_by_customer");
    bodyParams.append("metadata[orderId]", orderId);
    bodyParams.append("metadata[refundReason]", refundReason);

    const refundRes = await fetch("https://api.stripe.com/v1/refunds", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecret}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: bodyParams,
    });

    if (!refundRes.ok) {
      const error = await refundRes.json().catch(() => ({}));
      console.error("Stripe refund error:", error);
      return NextResponse.json({ error: error.message || "Failed to create refund" }, { status: 500 });
    }

    const refund = await refundRes.json();

    // Update order in database
    const isFullRefund = Math.abs(amountToRefund - totalPaid) < 0.01;
    const updateData: Record<string, string | number | boolean | null> = {
      refundStatus: isFullRefund ? "full" : "partial",
      refundAmount: amountToRefund,
      refundReason,
      refundedAt: new Date().toISOString(),
      stripeRefundId: refund.id,
      updatedAt: new Date().toISOString(),
    };

    if (!isFullRefund) {
      updateData.paymentStatus = "partially_refunded";
    } else {
      updateData.paymentStatus = "refunded";
    }

    await orderRef.update(updateData);

    // Mark refunded items as available again
    if (refundedItemIds && refundedItemIds.length > 0) {
      const batch = db.batch();
      for (const itemId of refundedItemIds) {
        const cactusRef = db.collection("cacti").doc(itemId);
        batch.update(cactusRef, {
          status: "available",
          isSold: false,
          soldAt: null,
          updatedAt: new Date().toISOString(),
        });
      }
      await batch.commit();
    }

    // Revalidate public content if items were marked as available
    if (refundedItemIds && refundedItemIds.length > 0) {
      await revalidatePublicContent();
    }

    return NextResponse.json({
      success: true,
      refundId: refund.id,
      refundAmount: amountToRefund,
      isFullRefund,
      message: isFullRefund 
        ? "Full refund processed successfully" 
        : `Partial refund of ฿${amountToRefund.toLocaleString()} processed successfully`,
    }, { status: 200 });

  } catch (error) {
    console.error("Refund API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
