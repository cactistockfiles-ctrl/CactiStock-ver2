"use client";

import { useState } from "react";
import { CreditCard, QrCode, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export interface XenditPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  amount: number;
  customerEmail: string;
  customerPhone?: string;
  onPaymentSuccess?: (invoiceUrl: string) => void;
  onPaymentError?: (error: string) => void;
}

export function XenditPaymentDialog({
  open,
  onOpenChange,
  orderId,
  amount,
  customerEmail,
  customerPhone,
  onPaymentSuccess,
  onPaymentError,
}: XenditPaymentDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<
    "prompt_pay" | "credit_card"
  >("prompt_pay");
  const [isLoading, setIsLoading] = useState(false);

  const handleInitiatePayment = async () => {
    if (!paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch("/api/checkout/xendit-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          paymentMethod,
          description: `CactiStock Order ${orderId}`,
          orderId,
          customerEmail,
          customerPhone,
          successRedirectUrl: `${window.location.origin}/checkout/confirmation?status=success`,
          failureRedirectUrl: `${window.location.origin}/checkout/confirmation?status=failed`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error || "Failed to create payment invoice";
        toast.error(errorMsg);
        onPaymentError?.(errorMsg);
        return;
      }

      // Redirect to Xendit invoice payment page
      window.open(data.invoiceUrl, "_blank");
      onPaymentSuccess?.(data.invoiceUrl);
      onOpenChange(false);
      toast.success("Payment page opened. Please complete the payment.");
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to process payment";
      console.error("Payment error:", error);
      toast.error(errorMsg);
      onPaymentError?.(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Select Payment Method</span>
            <button
              onClick={() => onOpenChange(false)}
              className="rounded-md p-1 hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-3">
            <RadioGroup
              value={paymentMethod}
              onValueChange={(value: any) => setPaymentMethod(value)}
            >
              {/* PromptPay Option */}
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="prompt_pay" id="prompt_pay" />
                <Label htmlFor="prompt_pay" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-muted hover:bg-muted/50">
                    <QrCode className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-semibold text-sm">PromptPay QR Code</p>
                      <p className="text-xs text-muted-foreground">
                        No fee • Instant transfer
                      </p>
                    </div>
                  </div>
                </Label>
              </div>

              {/* Credit Card Option */}
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="credit_card" id="credit_card" />
                <Label htmlFor="credit_card" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-muted hover:bg-muted/50">
                    <CreditCard className="h-5 w-5 text-amber-500" />
                    <div>
                      <p className="font-semibold text-sm">Credit/Debit Card</p>
                      <p className="text-xs text-muted-foreground">
                        Fee applies • Visa, Mastercard
                      </p>
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3 text-sm text-blue-900 dark:text-blue-100">
            <p className="font-semibold mb-2">Total Amount</p>
            <p className="text-lg font-bold">
              ฿
              {amount.toLocaleString("th-TH", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>

          <div className="space-y-2">
            <Button
              onClick={handleInitiatePayment}
              disabled={isLoading}
              className="w-full h-11 font-semibold"
              size="lg"
            >
              {isLoading ? "Processing..." : "Proceed to Payment"}
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full h-11"
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            You will be redirected to Xendit's secure payment page. Your payment
            information is encrypted and protected.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
