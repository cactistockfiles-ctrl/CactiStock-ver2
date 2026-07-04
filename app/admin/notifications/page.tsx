"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/sonner";

export default function NotificationsPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchList();
  }, []);

  async function fetchList() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/bank-transfer-notifications", {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to fetch notifications");
        return;
      }
      setOrders(data.orders || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <Badge>{orders.length}</Badge>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : orders.length === 0 ? (
        <p className="text-muted-foreground">
          No pending bank transfer notifications.
        </p>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <Link
              key={o.id}
              href={`/admin/payment-approval?orderId=${encodeURIComponent(o.id)}`}
              className="block border rounded-xl p-3 bg-card flex items-center gap-4 hover:shadow-lg transition-shadow"
            >
              {o.paymentProofUrl ? (
                <img
                  src={o.paymentProofUrl}
                  alt={`proof-${o.id}`}
                  className="w-20 h-20 object-cover rounded"
                />
              ) : (
                <div className="w-20 h-20 bg-muted/30 rounded flex items-center justify-center text-xs">
                  No Image
                </div>
              )}
              <div className="flex-1">
                <div className="font-semibold text-sm">Order {o.id}</div>
                <div className="text-xs text-muted-foreground">
                  {o.contactName || o.contactEmail}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm">
                  ฿{Number(o.totalPrice || 0).toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(o.createdAt).toLocaleString("th-TH")}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
