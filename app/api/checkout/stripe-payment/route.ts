import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/checkout/stripe-payment
 * Creates a Stripe Checkout Session for PromptPay or card payments and returns the session URL.
 * Expected body:
 * { amount, currency, paymentMethod, description, orderId, customerEmail, successRedirectUrl, failureRedirectUrl }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, currency = "thb", paymentMethod = "card", description, orderId, customerEmail, successRedirectUrl, failureRedirectUrl } = body as {
      amount?: number;
      currency?: string;
      paymentMethod?: string;
      description?: string;
      orderId?: string;
      customerEmail?: string;
      successRedirectUrl?: string;
      failureRedirectUrl?: string;
    };

    if (!amount || !orderId || !customerEmail || !successRedirectUrl || !failureRedirectUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (![
      "card",
      "promptpay",
    ].includes(paymentMethod)) {
      return NextResponse.json({ error: "Invalid paymentMethod. Must be 'card' or 'promptpay'" }, { status: 400 });
    }

    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecret) {
      console.error("STRIPE_SECRET_KEY not configured");
      return NextResponse.json({ error: "Payment service not configured" }, { status: 500 });
    }

    const unitAmount = Math.round(Number(amount) * 100); // convert to smallest currency unit

    const params = new URLSearchParams();
    params.append("payment_method_types[]", paymentMethod);
    params.append("mode", "payment");
    params.append("success_url", successRedirectUrl);
    params.append("cancel_url", failureRedirectUrl);
    params.append("line_items[0][price_data][currency]", currency);
    params.append("line_items[0][price_data][product_data][name]", description || `Order ${orderId}`);
    params.append("line_items[0][price_data][unit_amount]", String(unitAmount));
    params.append("line_items[0][quantity]", "1");
    params.append("customer_email", customerEmail);
    // Attach the order id so we can map the Checkout Session back to our order in webhooks
    if (orderId) params.append("client_reference_id", orderId);

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecret}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("Stripe error:", err);
      return NextResponse.json({ error: err.message || "Unable to create Stripe session" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json({ ok: true, sessionUrl: data.url, sessionId: data.id }, { status: 201 });
  } catch (err) {
    console.error("Stripe session error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
