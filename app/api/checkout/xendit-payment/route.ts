import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/checkout/xendit-payment
 * Creates a Xendit invoice for payment
 *
 * Expected body:
 * {
 *   amount: number,
 *   paymentMethod: "prompt_pay" | "credit_card",
 *   description: string,
 *   orderId: string,
 *   customerEmail: string,
 *   customerPhone?: string,
 *   successRedirectUrl?: string,
 *   failureRedirectUrl?: string
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      amount,
      paymentMethod,
      description,
      orderId,
      customerEmail,
      customerPhone,
      successRedirectUrl,
      failureRedirectUrl,
    } = body;

    // Validate required fields
    if (!amount || !paymentMethod || !orderId || !customerEmail) {
      return NextResponse.json(
        {
          error: "Missing required fields: amount, paymentMethod, orderId, customerEmail",
        },
        { status: 400 }
      );
    }

    // Validate payment method
    if (!["prompt_pay", "credit_card"].includes(paymentMethod)) {
      return NextResponse.json(
        {
          error: "Invalid paymentMethod. Must be 'prompt_pay' or 'credit_card'",
        },
        { status: 400 }
      );
    }

    const xenditApiKey = process.env.XENDIT_API_KEY;
    if (!xenditApiKey) {
      console.error("XENDIT_API_KEY is not configured");
      return NextResponse.json(
        {
          error: "Payment service is not configured",
        },
        { status: 500 }
      );
    }

    // Prepare Xendit invoice request
    const invoicePayload = {
      external_id: `order_${orderId}_${Date.now()}`,
      amount: Math.round(amount), // Xendit expects integer amount
      description,
      invoice_duration: 3600, // 1 hour expiry
      customer: {
        given_names: customerEmail.split("@")[0],
        email: customerEmail,
        ...(customerPhone && { mobile_number: customerPhone }),
      },
      items: [
        {
          name: description,
          quantity: 1,
          price: Math.round(amount),
        },
      ],
      success_redirect_url: successRedirectUrl,
      failure_redirect_url: failureRedirectUrl,
    };

    // Call Xendit API
    const response = await fetch("https://api.xendit.co/v2/invoices", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${Buffer.from(`${xenditApiKey}:`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(invoicePayload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Xendit API error:", errorData);
      return NextResponse.json(
        {
          error: errorData.message || "Failed to create payment invoice",
        },
        { status: response.status }
      );
    }

    const invoice = await response.json();

    return NextResponse.json(
      {
        success: true,
        invoiceId: invoice.id,
        invoiceUrl: invoice.invoice_url,
        externalId: invoice.external_id,
        amount: invoice.amount,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating Xendit invoice:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
