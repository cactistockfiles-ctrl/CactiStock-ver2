import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { getDb } from "@/lib/firebase-server";
import { requireAdmin, revalidatePublicContent } from "@/lib/api-helpers";

export async function POST(req: Request, { params }: { params: { orderId: string } }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { orderId } = params;
  try {
    const body = await req.json().catch(() => ({}));
    const { reason } = body || {};

    const db = getDb();
    const orderRef = db.collection("orders").doc(orderId);
    const doc = await orderRef.get();
    if (!doc.exists) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    await orderRef.update({
      paymentStatus: "bank_transfer_rejected",
      rejectionReason: reason || "",
      rejectedAt: new Date().toISOString(),
      rejectedBy: "admin",
      updatedAt: new Date().toISOString(),
    });

    // Notify customer (best-effort)
    try {
      const order = doc.data() as any;
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

        const text = `Your payment for order ${orderId} could not be verified.${reason ? ` Reason: ${reason}` : ""} Please re-upload the payment proof.`;
        await transporter.sendMail({
          from: smtpFrom,
          to: order.contactEmail,
          subject: `Payment rejected: ${orderId}`,
          text,
        });
      }
    } catch (err) {
      console.warn("Failed to send rejection email:", err);
    }

    await revalidatePublicContent();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to reject order:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
