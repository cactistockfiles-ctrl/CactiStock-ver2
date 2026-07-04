import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { getDb } from "@/lib/firebase-server";
import { revalidatePublicContent } from "@/lib/api-helpers";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function sendLineNotifyNotification(message: string) {
  const token = process.env.LINE_NOTIFY_TOKEN;
  if (!token) {
    return;
  }

  const body = new URLSearchParams({ message }).toString();
  const res = await fetch("https://notify-api.line.me/api/notify", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Bearer ${token}`,
    },
    body,
  });

  if (!res.ok) {
    throw new Error("LINE Notify failed");
  }
}

async function sendTelegramNotification(message: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    return;
  }

  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: message }),
  });

  if (!res.ok) {
    throw new Error("Telegram notification failed");
  }
}

function isValidEmail(value: string) {
  return EMAIL_REGEX.test(value);
}

/**
 * POST /api/checkout/save-order
 * Saves a new order to Firebase with pending payment status
 * 
 * Expected body:
 * {
 *   orderId: string,
 *   totalPrice: number,
 *   shippingCost: number,
 *   contactName: string,
 *   contactEmail: string,
 *   contactPhone?: string,
 *   contactLine?: string,
 *   shippingCountry: string,
 *   shippingProvince: string,
 *   shippingCity: string,
 *   shippingDistrict: string,
 *   shippingZipcode: string,
 *   shippingAddress: string,
 *   shippingMethod: string,
 *   paymentMethod: string,
 *   note?: string,
 *   items: Array<{
 *     id: string,
 *     name: string,
 *     quantity: number,
 *     price: number
 *   }>
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      orderId: incomingOrderId,
      id,
      totalPrice,
      shippingCost,
      contactName,
      contactEmail,
      contactPhone,
      contactLine,
      shippingCountry,
      shippingProvince,
      shippingCity,
      shippingDistrict,
      shippingZipcode,
      shippingAddress,
      shippingMethod,
      paymentMethod,
      paymentStatus,
      stripeSessionId,
      paymentProofUrl,
      bankAccountId,
      bankAccountName,
      bankAccountNumber,
      bankBranch,
      note,
      items,
    } = body;
    const orderId = incomingOrderId || id;

    // Validate required fields
    if (!orderId || !contactEmail || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: "Missing required fields: orderId, contactEmail, items" },
        { status: 400 },
      );
    }

    if (paymentMethod === "bankTransfer" && !paymentProofUrl) {
      return NextResponse.json(
        { error: "Bank transfer proof is required." },
        { status: 400 },
      );
    }

    let stripeSession: any = null;
    let stripePaymentIntentId: string | undefined;
    let paidAmount: number | undefined;

    if (paymentStatus === "paid") {
      if (!stripeSessionId) {
        return NextResponse.json(
          { error: "Stripe session ID is required for paid orders." },
          { status: 400 },
        );
      }

      const stripeSecret = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecret) {
        console.error("STRIPE_SECRET_KEY not configured");
        return NextResponse.json(
          { error: "Payment service not configured" },
          { status: 500 },
        );
      }

      const stripeRes = await fetch(
        `https://api.stripe.com/v1/checkout/sessions/${stripeSessionId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${stripeSecret}`,
          },
        },
      );

      if (!stripeRes.ok) {
        const stripeError = await stripeRes.json().catch(() => ({}));
        console.error("Stripe session verification failed:", stripeError);
        return NextResponse.json(
          {
            error:
              stripeError.error?.message ||
              "Stripe session verification failed.",
          },
          { status: 400 },
        );
      }

      stripeSession = await stripeRes.json();
      if (stripeSession.payment_status !== "paid") {
        return NextResponse.json(
          { error: "Stripe session is not paid." },
          { status: 400 },
        );
      }

      const sessionOrderId =
        stripeSession.client_reference_id || stripeSession.metadata?.orderId;
      if (sessionOrderId !== orderId) {
        return NextResponse.json(
          { error: "Stripe session order ID mismatch." },
          { status: 400 },
        );
      }

      if (typeof stripeSession.amount_total === "number") {
        paidAmount = stripeSession.amount_total / 100;
      }
      stripePaymentIntentId = stripeSession.payment_intent;
    }

    const db = getDb();
    const orderRef = db.collection("orders").doc(orderId);

    // Check if order already exists
    const existingOrder = await orderRef.get();
    if (existingOrder.exists) {
      const existingData = existingOrder.data();
      if (
        paymentStatus === "paid" &&
        existingData?.paymentStatus === "paid"
      ) {
        return NextResponse.json(
          {
            success: true,
            orderId,
            message: "Order already exists and is already marked as paid.",
          },
          { status: 200 },
        );
      }

      return NextResponse.json(
        { error: "Order already exists" },
        { status: 409 }
      );
    }

    const orderData: Record<string, any> = {
      id: orderId,
      totalPrice,
      shippingCost,
      contactName: contactName || "",
      contactEmail,
      contactPhone: contactPhone || "",
      contactLine: contactLine || "",
      shippingCountry,
      shippingProvince,
      shippingCity,
      shippingDistrict,
      shippingZipcode,
      shippingAddress,
      shippingMethod,
      paymentMethod,
      paymentProofUrl: paymentProofUrl || "",
      bankAccountId: bankAccountId || "",
      bankAccountName: bankAccountName || "",
      bankAccountNumber: bankAccountNumber || "",
      bankBranch: bankBranch || "",
      note: note || "",
      items: items.map((item: any) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      paymentStatus:
        paymentStatus === "paid"
          ? "paid"
          : paymentMethod === "bankTransfer"
            ? "pending_bank_transfer"
            : "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (paymentStatus === "paid") {
      orderData.paidAt = new Date().toISOString();
      orderData.stripeSessionId = stripeSessionId || "";
      if (stripePaymentIntentId) {
        orderData.paymentIntentId = stripePaymentIntentId;
      }
      if (typeof paidAmount === "number") {
        orderData.paidAmount = paidAmount;
      }

      const batch = db.batch();
      batch.set(orderRef, orderData);

      const orderedItemIds = items
        .map((item: any) => String(item?.id))
        .filter(Boolean);

      for (const itemId of orderedItemIds) {
        const cactusRef = db.collection("cacti").doc(itemId);
        batch.update(cactusRef, {
          status: "sold",
          isSold: true,
          soldAt: new Date().toISOString(),
        });
      }

      await batch.commit();
    } else {
      await orderRef.set(orderData);
    }

    if (paymentMethod === "bankTransfer") {
      const smtpHost = process.env.SMTP_HOST;
      const smtpPort = Number(process.env.SMTP_PORT || "587");
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;
      const smtpFrom = process.env.SMTP_FROM || smtpUser;

      const hasSmtpConfig = Boolean(smtpHost && smtpUser && smtpPass && smtpFrom);
      const transporter = hasSmtpConfig
        ? nodemailer.createTransport({
            host: smtpHost!,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: {
              user: smtpUser!,
              pass: smtpPass!,
            },
          })
        : null;

      const bankInfo = [
        bankAccountName ? `ชื่อบัญชี: ${bankAccountName}` : null,
        bankAccountNumber ? `เลขบัญชี: ${bankAccountNumber}` : null,
        bankBranch ? `สาขา: ${bankBranch}` : null,
      ]
        .filter(Boolean)
        .join("\n");

      const itemList = items
        .map(
          (item: any, index: number) =>
            `${index + 1}. ${item.name} x${item.quantity} = ฿${(
              item.price * item.quantity
            ).toLocaleString()}`,
        )
        .join("\n");

      const message = [
        "มีคำสั่งซื้อใหม่ผ่านการโอนเงินเข้าบัญชีธนาคาร",
        `Order ID: ${orderId}`,
        "",
        `ชื่อ: ${contactName || "-"}`,
        `อีเมล: ${contactEmail}`,
        contactPhone ? `โทร: ${contactPhone}` : "",
        contactLine ? `LINE: ${contactLine}` : "",
        "",
        "ข้อมูลบัญชีที่โอน:",
        bankInfo,
        "",
        "รายการสินค้า:",
        itemList,
        "",
        `ยอดรวม: ฿${Number(totalPrice || 0).toLocaleString()}`,
        `ค่าส่ง: ฿${Number(shippingCost || 0).toLocaleString()}`,
        `ที่อยู่จัดส่ง: ${shippingAddress || "-"} ${shippingDistrict || ""} ${shippingCity || ""} ${shippingProvince || ""} ${shippingCountry || ""} ${shippingZipcode || ""}`,
        note ? `หมายเหตุ: ${note}` : "",
        "",
        paymentProofUrl ? `หลักฐานการโอน: ${paymentProofUrl}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      try {
        if (transporter) {
          await transporter.sendMail({
            from: smtpFrom,
            to: "cactistockfiles@gmail.com",
            replyTo: contactEmail,
            subject: `Bank transfer order received: ${orderId}`,
            text: message,
          });
        } else {
          console.warn(
            "SMTP is not configured for bank transfer email notifications. Order will still be saved.",
          );
        }

        const notificationErrors: string[] = [];
        await Promise.all([
          sendTelegramNotification(message).catch(() => {
            notificationErrors.push("Telegram");
          }),
          sendLineNotifyNotification(message).catch(() => {
            notificationErrors.push("LINE Notify");
          }),
        ]);

        if (notificationErrors.length > 0) {
          console.warn(
            `Bank transfer notification partially failed: ${notificationErrors.join(", ")}`,
          );
        }
      } catch (error) {
        console.error("Bank transfer notification failed:", error);
        // Do not block order creation if notification delivery fails.
      }
    }

    // Revalidate public content to ensure order counts are fresh
    await revalidatePublicContent();

    return NextResponse.json(
      {
        success: true,
        orderId,
        message: "Order saved successfully. Proceed to payment.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error saving order:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
