"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, ZoomIn } from "lucide-react";
import { CactusItem } from "@/types/content";
import { useCart } from "@/context/CartContext";
import { useLocale } from "@/context/LocaleContext";
import { useCurrency } from "@/hooks/useCurrency";
import ImageZoomModal from "./ImageZoomModal";

const PLACEHOLDER_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' fill='%23e5e7eb'%3E%3Crect width='400' height='400'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='18' fill='%239ca3af'%3ENo Image%3C/text%3E%3C/svg%3E";

function imgSrc(url: string) {
  return url && url.startsWith("http") ? url : PLACEHOLDER_IMG;
}

interface Props {
  cactus: CactusItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CactusDetailModal = ({ cactus, open, onOpenChange }: Props) => {
  const { addToCart } = useCart();
  const { t } = useLocale();
  const { formatted: priceFormatted } = useCurrency(cactus?.price || 0);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>("");

  if (!cactus) return null;

  const allImages = [
    cactus.images.top,
    cactus.images.side1,
    cactus.images.side2,
    cactus.images.side3,
  ];
  const displayImage = selectedImage || cactus.images.top;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">
              {cactus.name}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <div
                className="relative aspect-square overflow-hidden rounded-lg bg-muted cursor-pointer group"
                onClick={() => setZoomImage(displayImage)}
              >
                <img
                  src={imgSrc(displayImage)}
                  alt={cactus.name}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-foreground/0 group-hover:bg-foreground/20 transition-colors">
                  <ZoomIn className="h-8 w-8 text-background opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(img)}
                    className={`aspect-square overflow-hidden rounded-md border-2 transition-colors ${
                      displayImage === img
                        ? "border-primary"
                        : "border-transparent hover:border-primary/50"
                    }`}
                  >
                    <img
                      src={imgSrc(img)}
                      alt={`${cactus.name} ${t("common.angle")} ${i + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Badge variant="secondary">{cactus.family}</Badge>
                  <Badge variant="outline">
                    {cactus.growType === "seed"
                      ? t("common.seed")
                      : t("common.graft")}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("common.sizeCm")}: {cactus.sizeCm} cm
                </p>
              </div>

              <p className="text-sm leading-relaxed text-foreground/80">
                {cactus.description}
              </p>

              <div className="flex items-center justify-between pt-4 border-t">
                <span className="font-display text-3xl font-bold text-primary">
                  {priceFormatted}
                </span>
                <Button
                  disabled={cactus.isSold}
                  onClick={() => {
                    addToCart(cactus);
                    onOpenChange(false);
                  }}
                  className="gap-2"
                >
                  <ShoppingCart className="h-4 w-4" />
                  {cactus.isSold
                    ? t("catalogue.sold")
                    : t("common.addToCartLong")}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ImageZoomModal
        src={imgSrc(zoomImage || "")}
        alt={cactus.name}
        open={!!zoomImage}
        onOpenChange={(open) => !open && setZoomImage(null)}
      />
    </>
  );
};

export default CactusDetailModal;
