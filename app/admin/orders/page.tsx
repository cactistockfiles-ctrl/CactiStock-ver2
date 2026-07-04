"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefundDialog } from "@/components/admin/RefundDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface Order {
  id: string;
  createdAt: string;
  totalPrice: number;
  shippingCost: number;
  paymentStatus: string;
  refundStatus?: string;
  refundAmount?: number;
  refundReason?: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  contactLine?: string;
  note?: string;
  paymentProofUrl?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankBranch?: string;
  shippingCountry: string;
  shippingProvince?: string;
  shippingCity?: string;
  shippingDistrict?: string;
  shippingZipcode?: string;
  shippingMethod?: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    sizeCm?: number;
    widthCm?: number;
    lengthCm?: number;
    heightCm?: number;
    hasSpines?: boolean;
  }>;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailOrderId, setDetailOrderId] = useState<string | null>(null);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);

  const detailOrder = orders.find((o) => o.id === detailOrderId);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = orders.filter(
        (order) =>
          order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.contactEmail.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setFilteredOrders(filtered);
    } else {
      setFilteredOrders(orders);
    }
  }, [searchQuery, orders]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/orders");
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to fetch orders");
        return;
      }

      setOrders(data.orders || []);
      setFilteredOrders(data.orders || []);
    } catch (error) {
      console.error("Fetch orders error:", error);
      toast.error("Failed to fetch orders");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefundClick = (order: Order) => {
    setSelectedOrder(order);
    setRefundDialogOpen(true);
  };

  const handleRefundSuccess = () => {
    fetchOrders();
  };

  const getStatusBadge = (paymentStatus: string, refundStatus?: string) => {
    if (refundStatus === "full") {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          Fully Refunded
        </span>
      );
    }
    if (refundStatus === "partial") {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
          Partially Refunded
        </span>
      );
    }
    if (paymentStatus === "paid") {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          Paid
        </span>
      );
    }
    return (
      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
        {paymentStatus}
      </span>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Orders</h1>
        <Button onClick={fetchOrders} disabled={isLoading} variant="outline">
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by order ID, customer name, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-14"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchQuery
              ? "No orders found matching your search."
              : "No orders yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="border rounded-xl p-4 hover:shadow-sm transition-shadow bg-card"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-3 mb-2">
                    <h3 className="font-semibold text-sm truncate">
                      {order.id}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleString("th-TH")}
                    </p>
                  </div>
                  <p className="text-sm font-medium mb-3">
                    {order.contactName}
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-3">
                    <div>
                      <p className="text-muted-foreground">Total</p>
                      <p className="font-semibold">
                        ฿{order.totalPrice.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Shipping</p>
                      <p className="font-semibold">
                        ฿{order.shippingCost.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Country</p>
                      <p className="font-semibold">{order.shippingCountry}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Items</p>
                      <p className="font-semibold">
                        {order.items.length} item
                        {order.items.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  {getStatusBadge(order.paymentStatus, order.refundStatus)}
                  <Button
                    onClick={() => setDetailOrderId(order.id)}
                    variant="outline"
                    size="sm"
                    className="whitespace-nowrap"
                  >
                    View Detail
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {detailOrder && (
        <Dialog
          open={!!detailOrderId}
          onOpenChange={(open) => !open && setDetailOrderId(null)}
        >
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Order Details</DialogTitle>
              <DialogDescription>
                {detailOrder.id} • Created{" "}
                {new Date(detailOrder.createdAt).toLocaleString("th-TH")}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Customer Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">
                    Customer Name
                  </p>
                  <p className="font-medium">{detailOrder.contactName}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">
                    Email
                  </p>
                  <p className="font-medium text-sm break-all">
                    {detailOrder.contactEmail}
                  </p>
                </div>
                {detailOrder.contactPhone && (
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">
                      Phone
                    </p>
                    <p className="font-medium">{detailOrder.contactPhone}</p>
                  </div>
                )}
                {detailOrder.contactLine && (
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">
                      LINE
                    </p>
                    <p className="font-medium">{detailOrder.contactLine}</p>
                  </div>
                )}
              </div>

              {detailOrder.note && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">
                    Additional Notes
                  </p>
                  <p className="text-sm bg-muted/30 p-3 rounded">
                    {detailOrder.note}
                  </p>
                </div>
              )}

              {/* Payment proof for bank transfer */}
              {detailOrder.paymentProofUrl && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-2">
                    Payment Proof
                  </p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={detailOrder.paymentProofUrl}
                    alt={`proof-${detailOrder.id}`}
                    className="max-w-full rounded mb-3"
                  />
                  <div className="text-sm text-muted-foreground mb-4">
                    {detailOrder.bankAccountName && (
                      <div>Account name: {detailOrder.bankAccountName}</div>
                    )}
                    {detailOrder.bankAccountNumber && (
                      <div>Account number: {detailOrder.bankAccountNumber}</div>
                    )}
                    {detailOrder.bankBranch && (
                      <div>Branch: {detailOrder.bankBranch}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Shipping Information */}
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-2">
                  Shipping Address
                </p>
                <div className="text-sm space-y-1 bg-muted/20 p-3 rounded">
                  {[
                    detailOrder.shippingCity,
                    detailOrder.shippingDistrict,
                    detailOrder.shippingProvince,
                    detailOrder.shippingZipcode,
                    detailOrder.shippingCountry,
                  ]
                    .filter(Boolean)
                    .map((addr, idx) => (
                      <div key={idx}>{addr}</div>
                    ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {detailOrder.shippingMethod && (
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">
                      Shipping Method
                    </p>
                    <p className="font-medium">{detailOrder.shippingMethod}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">
                    Shipping Cost
                  </p>
                  <p className="font-medium">
                    ฿{detailOrder.shippingCost.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-2">
                  Items ({detailOrder.items.length})
                </p>
                <div className="space-y-2">
                  {detailOrder.items.map((item) => (
                    <div
                      key={item.id}
                      className="bg-muted/20 p-3 rounded text-sm"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <p className="font-semibold">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            ID: {item.id}
                          </p>
                        </div>
                        <p className="font-semibold">
                          ฿{item.price.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>Qty: {item.quantity}</span>
                        <span>
                          Subtotal: ฿
                          {(item.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-xl font-bold">
                      ฿{detailOrder.totalPrice.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Payment Status
                    </p>
                    <div className="mt-1">
                      {getStatusBadge(
                        detailOrder.paymentStatus,
                        detailOrder.refundStatus,
                      )}
                    </div>
                  </div>
                </div>

                {detailOrder.refundAmount && (
                  <div className="bg-amber-50 dark:bg-amber-950 p-3 rounded text-sm mb-4">
                    <p className="font-semibold text-amber-900 dark:text-amber-100">
                      Refunded: ฿{detailOrder.refundAmount.toLocaleString()}
                    </p>
                    {detailOrder.refundReason && (
                      <p className="text-xs text-amber-800 dark:text-amber-200 mt-1">
                        Reason: {detailOrder.refundReason}
                      </p>
                    )}
                  </div>
                )}

                {detailOrder.paymentStatus === "paid" && (
                  <Button
                    onClick={() => {
                      setSelectedOrder(detailOrder);
                      setRefundDialogOpen(true);
                      setDetailOrderId(null);
                    }}
                    className="w-full gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Process Refund
                  </Button>
                )}

                {detailOrder.paymentStatus === "pending_bank_transfer" && (
                  <div className="mt-3 flex gap-2">
                    <Button
                      onClick={async () => {
                        try {
                          const res = await fetch(
                            `/api/admin/orders/${detailOrder.id}/approve`,
                            { method: "POST" },
                          );
                          const data = await res.json();
                          if (!res.ok) {
                            toast.error(data.error || "Failed to approve");
                            return;
                          }
                          toast.success("Order approved");
                          setDetailOrderId(null);
                          fetchOrders();
                        } catch (err) {
                          console.error(err);
                          toast.error("Failed to approve");
                        }
                      }}
                      className="bg-green-600"
                    >
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={async () => {
                        const reason = prompt("Rejection reason (optional):");
                        try {
                          const res = await fetch(
                            `/api/admin/orders/${detailOrder.id}/reject`,
                            {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ reason }),
                            },
                          );
                          const data = await res.json();
                          if (!res.ok) {
                            toast.error(data.error || "Failed to reject");
                            return;
                          }
                          toast.success("Order rejected");
                          setDetailOrderId(null);
                          fetchOrders();
                        } catch (err) {
                          console.error(err);
                          toast.error("Failed to reject");
                        }
                      }}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {selectedOrder && (
        <RefundDialog
          open={refundDialogOpen}
          onOpenChange={setRefundDialogOpen}
          orderId={selectedOrder.id}
          orderTotal={selectedOrder.totalPrice}
          items={selectedOrder.items}
          onRefundSuccess={handleRefundSuccess}
        />
      )}
    </div>
  );
}
