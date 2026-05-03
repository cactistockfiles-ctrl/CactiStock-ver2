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
import { useCurrency } from "@/hooks/useCurrency";
import { useUser } from "@/context/UserContext";

export default function CartPage() {
  const { locale, t } = useLocale();
  const { items, removeFromCart, updateQuantity, clearCart, totalPrice } =
    useCart();
  const { formatted: totalPriceFormatted } = useCurrency(totalPrice);
  const { isAuthenticated } = useUser();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [line, setLine] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitOrder = async () => {
    if (!email.trim()) {
      toast.error(t("cart.emailRequired"));
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
        toast.error(data.error || t("cart.submitError"));
        return;
      }

      const successMsg = t("cart.submitSuccess").replace(
        "{email}",
        email.trim(),
      );
      toast.success(successMsg, { duration: 8000 });
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
      <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 py-12 pt-20 text-center">
        <ShoppingCart className="mb-4 h-16 w-16 text-muted-foreground/40" />
        <h1 className="font-display text-2xl font-bold">{t("cart.empty")}</h1>
        <p className="mt-2 text-muted-foreground">{t("cart.emptyDesc")}</p>
        <Button asChild className="mt-6">
          <Link href={`/${locale}/catalogue`}>{t("cart.goToCatalogue")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 pt-20 text-center md:text-left">
      <h1 className="mb-8 font-display text-4xl font-bold">
        {t("cart.title")}
      </h1>

      {!isAuthenticated && (
        <div className="mb-6 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-left text-sm text-destructive">
          You must login or register before placing an order. Add items to the
          cart first, then continue to checkout after signing in.
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const CartItemPrice = () => {
              const { formatted } = useCurrency(item.cactus.price);
              return (
                <span className="font-display font-bold text-primary">
                  {formatted}
                </span>
              );
            };
            return (
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
                      {item.cactus.growType === "seed"
                        ? t("common.seed")
                        : t("common.graft")}{" "}
                      · {item.cactus.sizeCm} cm
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
                    <CartItemPrice />
                    <button
                      onClick={() => removeFromCart(item.cactus.id)}
                      className="text-destructive hover:text-destructive/80"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-lg border bg-card p-6 space-y-4 h-fit lg:sticky lg:top-24">
          <h2 className="font-display text-xl font-bold">
            {t("cart.orderInfo")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("cart.orderInfoDesc")}
          </p>

          <div className="space-y-3">
            <Input
              placeholder={t("cart.namePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              placeholder={t("cart.emailPlaceholder")}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              placeholder={t("cart.phonePlaceholder")}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <Input
              placeholder={t("cart.linePlaceholder")}
              value={line}
              onChange={(e) => setLine(e.target.value)}
            />
            <Textarea
              placeholder={t("cart.notePlaceholder")}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between text-lg font-bold">
              <span>{t("cart.total")}</span>
              <span className="text-primary font-display">
                {totalPriceFormatted}
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
            {isSubmitting ? t("cart.submitting") : t("cart.submit")}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            {t("cart.submitDesc")}
            <br />
            {t("cart.confirmDesc")}
          </p>
        </div>
      </div>
    </div>
  );
}
