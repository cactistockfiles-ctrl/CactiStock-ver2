import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { getDb } from "@/lib/firebase-server";
import { requireAdmin, revalidatePublicContent } from "@/lib/api-helpers";

export async function POST(req: Request, { params }: { params: { orderId: string } }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { orderId } = params;
  try {
    const db = getDb();
    const orderRef = db.collection("orders").doc(orderId);
    const doc = await orderRef.get();
    if (!doc.exists) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = doc.data() as any;

    // Update order status and mark cacti as sold
    const batch = db.batch();
    batch.update(orderRef, {
      paymentStatus: "paid",
      paidAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
      approvedBy: "admin",
      updatedAt: new Date().toISOString(),
    });

    const itemIds = (order.items || []).map((i: any) => String(i.id)).filter(Boolean);
    for (const id of itemIds) {
      const cactusRef = db.collection("cacti").doc(id);
      batch.update(cactusRef, {
        status: "sold",
        isSold: true,
        soldAt: new Date().toISOString(),
      });
    }

    await batch.commit();

    // Send confirmation email to customer (best-effort)
    try {
      const smtpHost = process.env.SMTP_HOST;
      const smtpPort = Number(process.env.SMTP_PORT || "587");
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;
      const smtpFrom = process.env.SMTP_FROM || smtpUser;

      if (smtpHost && smtpUser && smtpPass && smtpFrom && order.contactEmail) {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: { user: smtpUser, pass: smtpPass },
        });

        const text = `Your payment for order ${orderId} has been verified and the order is marked as paid. Thank you!`;
        await transporter.sendMail({
          from: smtpFrom,
          to: order.contactEmail,
          subject: `Payment confirmed: ${orderId}`,
          text,
        });
      }
    } catch (err) {
      console.warn("Failed to send approval email:", err);
    }

    await revalidatePublicContent();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to approve order:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
