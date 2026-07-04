"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { useLocale } from "@/context/LocaleContext";

type LastOrder = {
  id: string;
  createdAt: string;
  totalPrice: number;
  shippingCost: number;
  itemCount: number;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  contactLine?: string;
  note?: string;
  shippingCountry: string;
  shippingProvince: string;
  shippingCity: string;
  shippingDistrict: string;
  shippingZipcode: string;
  shippingAddress: string;
  shippingMethod: string;
  paymentMethod: string;
  paymentProofUrl?: string;
  bankAccountId?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankBranch?: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
};

export default function CheckoutConfirmationPage() {
  const { locale } = useLocale();
  const [order, setOrder] = useState<LastOrder | null>(null);
  const [orderSaved, setOrderSaved] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [finalizeError, setFinalizeError] = useState("");
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
  const paymentStatus = searchParams.get("status");
  const sessionId = searchParams.get("session_id");
  const orderIdParam = searchParams.get("orderId");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("cactistock_last_order");
      if (!raw) return;
      const parsed = JSON.parse(raw) as LastOrder;
      if (parsed?.id && parsed?.createdAt) {
        setOrder(parsed);
      }
    } catch {
      setOrder(null);
    }
  }, []);

  useEffect(() => {
    const finalizeOrder = async () => {
      if (!order || !orderIdParam || !sessionId || order.id !== orderIdParam) {
        setFinalizeError(
          "Unable to complete the order confirmation. Please return to the cart and try again.",
        );
        return;
      }

      if (orderSaved || isFinalizing) {
        return;
      }

      setIsFinalizing(true);
      setFinalizeError("");

      try {
        const res = await fetch("/api/checkout/save-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: order.id,
            ...order,
            paymentStatus: "paid",
            stripeSessionId: sessionId,
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setFinalizeError(
            data.error || "Unable to save paid order. Please contact support.",
          );
          return;
        }

        setOrderSaved(true);
        clearCart();
      } catch (error) {
        console.error("Finalize order error:", error);
        setFinalizeError("Unable to save paid order. Please contact support.");
      } finally {
        setIsFinalizing(false);
      }
    };

    if (paymentStatus === "success" && sessionId) {
      finalizeOrder();
    }
  }, [
    clearCart,
    isFinalizing,
    order,
    orderIdParam,
    orderSaved,
    paymentStatus,
    sessionId,
  ]);

  const isPaymentFailed = paymentStatus === "failed";
  const isBankTransferOrder = order?.paymentMethod === "bankTransfer";

  return (
    <div className="container mx-auto py-4 px-4 pt-20">
      <div className="mx-auto max-w-4xl space-y-6 rounded-3xl border bg-card p-8 shadow-lg">
        {isPaymentFailed ? (
          <>
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-destructive">
                Payment cancelled
              </p>
              <h1 className="text-3xl font-semibold">
                Payment was not completed
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                You cancelled the payment process. No Stripe payment was
                completed and no paid order has been recorded.
              </p>
            </div>

            {order ? (
              <div className="space-y-6">
                <div className="rounded-3xl border p-6 bg-destructive/5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Order ID</p>
                      <p className="font-medium">{order.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Created</p>
                      <p className="font-medium">
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Customer</p>
                      <p className="font-medium">
                        {order.contactName || order.contactEmail}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="font-medium">
                        ฿{order.totalPrice.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Link href={`/${locale}`}>
                    <Button className="w-full">Continue shopping</Button>
                  </Link>
                  <Link href={`/${locale}/checkout`}>
                    <Button variant="outline" className="w-full">
                      Return to checkout
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  No recent order was found.
                </p>
                <div className="mt-4 flex justify-center">
                  <Link href={`/${locale}`}>
                    <Button>Go to shop</Button>
                  </Link>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                Order confirmed
              </p>
              <h1 className="text-3xl font-semibold">
                Thank you for your order
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                {isBankTransferOrder
                  ? "Your order has been created. Please wait for the seller to verify your bank transfer payment. We will notify you once payment is confirmed."
                  : "Your payment was completed successfully. We are finalizing your order and will notify you once it is saved."}
              </p>
            </div>

            {finalizeError ? (
              <div className="rounded-3xl border border-destructive p-6 bg-destructive/10">
                <p className="text-sm font-semibold text-destructive">
                  There was an issue finalizing your order
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {finalizeError}
                </p>
              </div>
            ) : isFinalizing ? (
              <div className="rounded-3xl border p-6 bg-primary/5">
                <p className="text-sm font-semibold text-primary">
                  Finalizing your paid order...
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Please wait while we save your order and update inventory.
                </p>
              </div>
            ) : orderSaved ? (
              <div className="rounded-3xl border p-6 bg-success/5">
                <p className="text-sm font-semibold text-success">
                  Your paid order has been saved.
                </p>
              </div>
            ) : null}

            {order ? (
              <div className="space-y-6">
                <div className="rounded-3xl border p-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Order ID</p>
                      <p className="font-medium">{order.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Placed</p>
                      <p className="font-medium">
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Customer</p>
                      <p className="font-medium">
                        {order.contactName || order.contactEmail}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="font-medium">
                        ฿{order.totalPrice.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border p-6">
                  <h2 className="mb-4 text-lg font-semibold">Order details</h2>
                  <div className="space-y-3">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="grid gap-3 rounded-2xl border p-4 sm:grid-cols-12"
                      >
                        <div className="sm:col-span-6 font-semibold">
                          {item.name}
                        </div>
                        <div className="sm:col-span-2 text-sm text-muted-foreground">
                          Qty {item.quantity}
                        </div>
                        <div className="sm:col-span-4 text-right font-medium">
                          ฿{(item.price * item.quantity).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Link href={`/${locale}`}>
                    <Button className="w-full">Continue shopping</Button>
                  </Link>
                  <Link href={`/${locale}/profile/orders`}>
                    <Button variant="outline" className="w-full">
                      View profile order history
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  No recent order was found.
                </p>
                <div className="mt-4 flex justify-center">
                  <Link href={`/${locale}`}>
                    <Button>Go to shop</Button>
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
