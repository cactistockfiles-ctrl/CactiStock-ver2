"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/sonner";
import ImageZoomModal from "@/components/ImageZoomModal";

export default function PaymentApprovalPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [zoomOpen, setZoomOpen] = useState(false);
  useEffect(() => {
    fetchList();
  }, []);

  useEffect(() => {
    const queryId = searchParams?.get("orderId");
    if (queryId) {
      setSelectedOrderId(queryId);
    }
  }, [searchParams]);

  const selectedOrder = useMemo(
    () => orders.find((o) => o.id === selectedOrderId) || null,
    [orders, selectedOrderId],
  );

  async function fetchList() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/bank-transfer-notifications", {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to fetch list");
        return;
      }
      setOrders(data.orders || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch list");
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id: string) {
    try {
      const res = await fetch(`/api/admin/orders/${id}/approve`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to approve");
        return;
      }
      toast.success("Order approved");
      setOrders((prev) => prev.filter((o) => o.id !== id));
      if (selectedOrderId === id) {
        closeDialog();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to approve");
    }
  }

  async function handleReject(id: string) {
    const reason = prompt("Rejection reason (optional):");
    try {
      const res = await fetch(`/api/admin/orders/${id}/reject`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to reject");
        return;
      }
      toast.success("Order rejected");
      setOrders((prev) => prev.filter((o) => o.id !== id));
      if (selectedOrderId === id) {
        closeDialog();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to reject");
    }
  }

  function openDialog(id: string) {
    setSelectedOrderId(id);
    router.replace(`/admin/payment-approval?orderId=${encodeURIComponent(id)}`);
  }

  function closeDialog() {
    setSelectedOrderId(null);
    router.replace("/admin/payment-approval");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Payment Approval</h1>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : orders.length === 0 ? (
        <p className="text-muted-foreground">
          No pending bank transfer orders.
        </p>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <div
              key={o.id}
              className="border rounded-xl p-4 bg-card flex gap-4 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => openDialog(o.id)}
            >
              <div className="w-48">
                {o.paymentProofUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={o.paymentProofUrl}
                    alt={`proof-${o.id}`}
                    className="w-full h-40 object-cover rounded"
                  />
                ) : (
                  <div className="w-full h-40 bg-muted/30 rounded flex items-center justify-center">
                    No image
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-semibold">Order {o.id}</div>
                    <div className="text-xs text-muted-foreground">
                      {o.contactName || o.contactEmail}
                    </div>
                  </div>
                  <div className="text-sm">
                    ฿{Number(o.totalPrice || 0).toLocaleString()}
                  </div>
                </div>

                <div className="mb-3 text-sm text-muted-foreground">
                  Bank: {o.bankAccountName || "-"}{" "}
                  {o.bankAccountNumber ? `• ${o.bankAccountNumber}` : ""}
                </div>

                <div className="text-xs text-muted-foreground">
                  Click to view details
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={Boolean(selectedOrder)}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Order {selectedOrder?.id}</DialogTitle>
            <DialogDescription>
              Review bank transfer payment proof and approve or reject this
              order.
            </DialogDescription>
          </DialogHeader>
          {selectedOrder ? (
            <div className="space-y-4 mt-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="text-sm font-semibold">Customer</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedOrder.contactName ||
                      selectedOrder.contactEmail ||
                      "Unknown"}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-semibold">Amount</div>
                  <div className="text-sm text-muted-foreground">
                    ฿{Number(selectedOrder.totalPrice || 0).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="text-sm font-semibold">Bank</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedOrder.bankAccountName || "-"}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-semibold">Account</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedOrder.bankAccountNumber || "-"}
                  </div>
                </div>
              </div>

              {selectedOrder.paymentProofUrl ? (
                <div>
                  <div className="text-sm font-semibold mb-2">
                    Payment proof
                  </div>
                  <button
                    type="button"
                    onClick={() => setZoomOpen(true)}
                    className="group w-full overflow-hidden rounded border border-border bg-card p-0 text-left transition-shadow hover:shadow-lg"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedOrder.paymentProofUrl}
                      alt={`proof-${selectedOrder.id}`}
                      className="w-full h-64 object-contain rounded transition duration-200 group-hover:scale-[1.01]"
                    />
                  </button>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Click image to zoom.
                  </p>
                </div>
              ) : (
                <div className="w-full h-64 bg-muted/30 rounded flex items-center justify-center">
                  No proof image available
                </div>
              )}

              <ImageZoomModal
                src={selectedOrder.paymentProofUrl || ""}
                alt={`proof-${selectedOrder.id}`}
                open={zoomOpen}
                onOpenChange={setZoomOpen}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="text-sm font-semibold">Contact</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedOrder.contactName ||
                      selectedOrder.contactEmail ||
                      "-"}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-semibold">Submitted</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedOrder.createdAt
                      ? new Date(selectedOrder.createdAt).toLocaleString(
                          "th-TH",
                        )
                      : "-"}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">Loading order details…</p>
          )}

          <DialogFooter className="mt-6 gap-2">
            <Button
              onClick={() => selectedOrder && handleReject(selectedOrder.id)}
              variant="destructive"
            >
              Reject
            </Button>
            <Button
              onClick={() => selectedOrder && handleApprove(selectedOrder.id)}
              className="bg-green-600"
            >
              Approve
            </Button>
            <DialogClose asChild>
              <Button variant="secondary" onClick={closeDialog}>
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
