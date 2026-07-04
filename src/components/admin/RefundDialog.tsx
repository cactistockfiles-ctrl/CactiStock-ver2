"use client";

import { useState, useEffect } from "react";
import { RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export interface RefundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  orderTotal: number;
  items: Array<{ id: string; name: string; price: number; quantity: number }>;
  onRefundSuccess?: () => void;
}

export function RefundDialog({
  open,
  onOpenChange,
  orderId,
  orderTotal,
  items,
  onRefundSuccess,
}: RefundDialogProps) {
  const [refundAmount, setRefundAmount] = useState<string>("");
  const [refundReason, setRefundReason] = useState("");
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [fullyRefund, setFullyRefund] = useState<boolean>(false);
  const [fullRefundConfirm, setFullRefundConfirm] = useState<string>("");
  const [estimatedFee, setEstimatedFee] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Try to fetch real stripe fee from backend order record when dialog opens or orderId changes
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/admin/order/${orderId}`);
        if (!res.ok) return;
        const json = await res.json();
        const fee = json?.order?.stripeFee;
        if (typeof fee === "number") {
          setEstimatedFee(fee);
        }
      } catch (e) {
        // ignore
      }
    };

    if (orderId) fetchOrder();
  }, [orderId]);

  const handleItemToggle = (itemId: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId],
    );
  };

  const calculateSelectedTotal = () => {
    return items
      .filter((item) => selectedItemIds.includes(item.id))
      .reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const handleRefundAmountChange = (value: string) => {
    setRefundAmount(value);
  };

  const handleFullyRefundToggle = (checked: boolean | "indeterminate") => {
    const isChecked = checked === true;
    setFullyRefund(isChecked);
    if (isChecked) {
      // select all items and set refund amount to order total (includes shipping)
      setSelectedItemIds(items.map((i) => i.id));
      setRefundAmount(orderTotal.toString());
      // if we don't already have a real stripe fee from the backend, set a simple estimate
      if (estimatedFee === null) {
        const percent = 0.029;
        const fixed = 11;
        const fee = Math.round((orderTotal * percent + fixed) * 100) / 100;
        setEstimatedFee(fee);
      }
    } else {
      setSelectedItemIds([]);
      setRefundAmount("");
      setEstimatedFee(null);
      setFullRefundConfirm("");
    }
  };

  const handleUseSelectedItems = () => {
    const selectedTotal = calculateSelectedTotal();
    setRefundAmount(selectedTotal.toString());
  };

  const handleSubmitRefund = async () => {
    if (!refundAmount || parseFloat(refundAmount) <= 0) {
      toast.error("Please enter a valid refund amount");
      return;
    }

    if (!refundReason.trim()) {
      toast.error("Please provide a refund reason");
      return;
    }

    if (fullyRefund) {
      if (fullRefundConfirm.trim() !== "REFUND") {
        toast.error("Please type REFUND to confirm full refund");
        return;
      }
    }

    const amount = parseFloat(refundAmount);
    if (amount > orderTotal) {
      toast.error("Refund amount cannot exceed order total");
      return;
    }

    try {
      setIsProcessing(true);

      const response = await fetch("/api/admin/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          refundAmount: amount,
          refundReason: refundReason.trim(),
          refundedItemIds:
            fullyRefund && items.length > 0
              ? items.map((i) => i.id)
              : selectedItemIds.length > 0
                ? selectedItemIds
                : undefined,
          fullyRefund: fullyRefund || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to process refund");
        return;
      }

      toast.success(data.message || "Refund processed successfully");
      onRefundSuccess?.();
      onOpenChange(false);

      // Reset form
      setRefundAmount("");
      setRefundReason("");
      setSelectedItemIds([]);
    } catch (error) {
      console.error("Refund error:", error);
      toast.error("Failed to process refund. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Process Refund</DialogTitle>
          <DialogDescription>
            Order ID: {orderId} • Total: ฿{orderTotal.toLocaleString()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Select Items to Refund */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">
              Select Items to Mark as Available Again
            </Label>
            <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`item-${item.id}`}
                    checked={selectedItemIds.includes(item.id)}
                    onCheckedChange={() => handleItemToggle(item.id)}
                    disabled={fullyRefund}
                  />
                  <Label
                    htmlFor={`item-${item.id}`}
                    className="flex-1 cursor-pointer text-sm"
                  >
                    {item.name} × {item.quantity} - ฿
                    {(item.price * item.quantity).toLocaleString()}
                  </Label>
                </div>
              ))}
            </div>
            {selectedItemIds.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleUseSelectedItems}
                className="mt-2"
                disabled={fullyRefund}
              >
                Use Selected Items Total: ฿
                {calculateSelectedTotal().toLocaleString()}
              </Button>
            )}
          </div>

          {/* Refund Amount */}
          <div>
            <Label htmlFor="refundAmount" className="text-sm font-semibold">
              Refund Amount (฿)
            </Label>
            <Input
              id="refundAmount"
              type="number"
              placeholder="Enter refund amount"
              value={refundAmount}
              onChange={(e) => handleRefundAmountChange(e.target.value)}
              min="0"
              max={orderTotal}
              step="0.01"
              disabled={fullyRefund}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Maximum refundable: ฿{orderTotal.toLocaleString()}
            </p>
          </div>

          {/* Fully refund option */}
          <div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="fully-refund"
                checked={fullyRefund}
                onCheckedChange={handleFullyRefundToggle}
              />
              <Label htmlFor="fully-refund" className="text-sm cursor-pointer">
                Fully refund (refund all items and shipping)
              </Label>
            </div>
            {fullyRefund && estimatedFee !== null && (
              <p className="text-xs text-muted-foreground mt-2">
                Estimated Stripe fee kept: ฿{estimatedFee.toLocaleString()}
              </p>
            )}
            {fullyRefund && (
              <div className="mt-2 text-sm">
                <p className="text-xs text-muted-foreground">
                  To proceed with a full refund, type{" "}
                  <span className="font-mono">REFUND</span> in the box below to
                  confirm.
                </p>
                <Input
                  placeholder="Type REFUND to confirm"
                  value={fullRefundConfirm}
                  onChange={(e) => setFullRefundConfirm(e.target.value)}
                  className="mt-2"
                />
              </div>
            )}
          </div>

          {/* Refund Reason */}

          {/* Refund Reason */}
          <div>
            <Label htmlFor="refundReason" className="text-sm font-semibold">
              Refund Reason
            </Label>
            <Textarea
              id="refundReason"
              placeholder="Explain why this refund is being processed..."
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          {/* Warning */}
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950 p-3 text-sm text-amber-900 dark:text-amber-100">
            <p className="font-semibold mb-1">⚠️ Important</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Refunds cannot be undone once processed</li>
              <li>
                Stripe will process the refund to the original payment method
              </li>
              <li>Selected items will be marked as available again</li>
              <li>
                Refund may take 5-10 business days to appear in customer's
                account
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmitRefund}
            disabled={isProcessing}
            className="gap-2"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Process Refund
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
