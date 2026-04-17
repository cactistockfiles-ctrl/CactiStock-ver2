import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { getDb } from "@/lib/firebase-server";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ContactSellerPayload = {
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactLine?: string;
  note?: string;
  totalPrice?: number;
  items?: Array<{
    id: string;
    name: string;
    family: string;
    growType: "seed" | "graft";
    sizeCm: number;
    price: number;
    quantity: number;
  }>;
};

function isValidEmail(value: string) {
  return EMAIL_REGEX.test(value);
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
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
    }),
  });

  if (!res.ok) {
    throw new Error("Telegram notification failed");
  }
}

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

export async function POST(req: Request) {
  const payload = (await req.json().catch(() => null)) as ContactSellerPayload | null;
  if (!payload) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const contactEmail = payload.contactEmail?.trim() ?? "";
  const items = payload.items ?? [];

  if (!contactEmail || !isValidEmail(contactEmail)) {
    return NextResponse.json(
      { error: "กรุณากรอกอีเมลที่ถูกต้อง" },
      { status: 400 },
    );
  }

  if (items.length === 0) {
    return NextResponse.json({ error: "ไม่มีสินค้าในรายการ" }, { status: 400 });
  }

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT || "587");
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || smtpUser;

  if (!smtpHost || !smtpUser || !smtpPass || !smtpFrom) {
    return NextResponse.json(
      { error: "ยังไม่ตั้งค่า SMTP ในไฟล์ .env" },
      { status: 500 },
    );
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  const total = Number(payload.totalPrice ?? 0);
  const listText = items
    .map(
      (item, index) =>
        `${index + 1}. ${item.name} (${item.growType === "seed" ? "ไม้เมล็ด" : "ไม้กราฟ"}, ${item.sizeCm}cm) x${item.quantity} = ฿${(item.price * item.quantity).toLocaleString()}`,
    )
    .join("\n");

  const text = [
    "มีลูกค้าส่งรายการสินค้าเพื่อตรวจสอบ",
    "",
    `อีเมลลูกค้า: ${contactEmail}`,
    payload.contactName ? `ชื่อ: ${payload.contactName}` : "",
    payload.contactPhone ? `โทร: ${payload.contactPhone}` : "",
    payload.contactLine ? `LINE: ${payload.contactLine}` : "",
    "",
    "รายการต้นไม้:",
    listText,
    "",
    `ราคารวม: ฿${total.toLocaleString()}`,
    payload.note ? `หมายเหตุ: ${payload.note}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    await transporter.sendMail({
      from: smtpFrom,
      to: "cactistockfiles@gmail.com",
      replyTo: contactEmail,
      subject: `ตรวจสอบรายการต้นไม้จากลูกค้า (${items.length} รายการ)`,
      text,
    });

    const notificationErrors: string[] = [];
    await Promise.all([
      sendTelegramNotification(text).catch(() => {
        notificationErrors.push("Telegram");
      }),
      sendLineNotifyNotification(text).catch(() => {
        notificationErrors.push("LINE Notify");
      }),
    ]);

    if (notificationErrors.length > 0) {
      return NextResponse.json(
        {
          error: `ส่งบางช่องทางไม่สำเร็จ: ${notificationErrors.join(", ")}`,
        },
        { status: 500 },
      );
    }

    // Update cactus status to 'reserved' in Firestore
    const db = getDb();
    const batch = db.batch();
    const cactiRef = db.collection("cacti");
    
    for (const item of items) {
      const docRef = cactiRef.doc(item.id);
      batch.update(docRef, { status: "reserved" });
    }
    
    await batch.commit();

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "ส่งอีเมลไม่สำเร็จ กรุณาตรวจสอบค่า SMTP" },
      { status: 500 },
    );
  }
}