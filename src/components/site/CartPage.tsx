"use client";

import Link from "next/link";
import { useState } from "react";
import { Minus, Plus, Send, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/context/CartContext";
import { useLocale } from "@/context/LocaleContext";

export default function CartPage() {
  const { locale } = useLocale();
  const { items, removeFromCart, updateQuantity, clearCart, totalPrice } =
    useCart();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [line, setLine] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitOrder = async () => {
    if (!email.trim()) {
      toast.error("กรุณากรอกอีเมลสำหรับติดต่อกลับ");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/contact-seller", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactName: name.trim(),
          contactEmail: email.trim(),
          contactPhone: phone.trim(),
          contactLine: line.trim(),
          note: note.trim(),
          totalPrice,
          items: items.map((item) => ({
            id: item.cactus.id,
            name: item.cactus.name,
            family: item.cactus.family,
            growType: item.cactus.growType,
            sizeCm: item.cactus.sizeCm,
            price: item.cactus.price,
            quantity: item.quantity,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "ส่งข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
        return;
      }

      toast.success(
        `ผู้ขาย จะติดต่อกลับไปที่ Email: ${email.trim()} เพื่อทำการคอรเฟิร์มว่าต้นไม้ทุกต้นที่คุณเลือก อยู่ในสภาพสมบูรณ์ พร้อมส่งอย่างเร็วที่สุด`,
        { duration: 8000 },
      );
      clearCart();
      setName("");
      setEmail("");
      setPhone("");
      setLine("");
      setNote("");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 py-12 text-center">
        <ShoppingCart className="mb-4 h-16 w-16 text-muted-foreground/40" />
        <h1 className="font-display text-2xl font-bold">ตะกร้าว่างเปล่า</h1>
        <p className="mt-2 text-muted-foreground">
          ยังไม่มีสินค้าในตะกร้า เริ่มเลือกกระบองเพชรกันเลย!
        </p>
        <Button asChild className="mt-6">
          <Link href={`/${locale}/catalogue`}>ไปที่แคตตาล็อก</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="mb-8 font-display text-4xl font-bold">ตะกร้าสินค้า</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.cactus.id}
              className="flex gap-4 rounded-lg border bg-card p-4"
            >
              <img
                src={item.cactus.images.top}
                alt={item.cactus.name}
                className="h-24 w-24 rounded-md object-cover"
              />
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <h3 className="font-display font-semibold">
                    {item.cactus.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {item.cactus.growType === "seed" ? "ไม้เมล็ด" : "ไม้กราฟ"} ·{" "}
                    {item.cactus.sizeCm} cm
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        updateQuantity(item.cactus.id, item.quantity - 1)
                      }
                      className="rounded-md border p-1 hover:bg-muted"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-8 text-center text-sm font-medium">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(item.cactus.id, item.quantity + 1)
                      }
                      className="rounded-md border p-1 hover:bg-muted"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <span className="font-display font-bold text-primary">
                    ฿{item.cactus.price.toLocaleString()}
                  </span>
                  <button
                    onClick={() => removeFromCart(item.cactus.id)}
                    className="text-destructive hover:text-destructive/80"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-lg border bg-card p-6 space-y-4 h-fit lg:sticky lg:top-24">
          <h2 className="font-display text-xl font-bold">ข้อมูลการสั่งซื้อ</h2>
          <p className="text-sm text-muted-foreground">
            กรอกช่องทางติดต่อของคุณก่อนส่งรายการให้ผู้ขายตรวจสอบ
          </p>

          <div className="space-y-3">
            <Input
              placeholder="ชื่อ-นามสกุล"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              placeholder="อีเมล *"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              placeholder="เบอร์โทรศัพท์"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <Input
              placeholder="LINE ID (ถ้ามี)"
              value={line}
              onChange={(e) => setLine(e.target.value)}
            />
            <Textarea
              placeholder="หมายเหตุเพิ่มเติม"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between text-lg font-bold">
              <span>รวมทั้งสิ้น</span>
              <span className="text-primary font-display">
                ฿{totalPrice.toLocaleString()}
              </span>
            </div>
          </div>

          <Button
            onClick={handleSubmitOrder}
            className="h-14 w-full gap-2 text-base font-bold"
            size="lg"
            disabled={isSubmitting}
          >
            <Send className="h-4 w-4" />
            {isSubmitting
              ? "กำลังส่งข้อมูล..."
              : "ส่งสินทั้งหมดเพื่อตรวจสอบกับผู้ขาย"}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            ข้อมูลรายการจะถูกส่งไปยัง cactistockfiles@gmail.com
            <br />
            ผู้ขายจะติดต่อกลับที่อีเมลของคุณเพื่อยืนยันความสมบูรณ์ก่อนจัดส่ง
          </p>
        </div>
      </div>
    </div>
  );
}
