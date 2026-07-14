"use client";

import { useState, useRef, type MouseEvent } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart } from "lucide-react";
import { CactusItem } from "@/types/content";
import { useCart } from "@/context/CartContext";
import { useLocale } from "@/context/LocaleContext";
import { useCurrency } from "@/hooks/useCurrency";
import { useUser } from "@/context/UserContext";
import AuthModal from "@/components/AuthModal";

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
  const { user } = useUser();
  const { t } = useLocale();
  const { formatted: priceFormatted } = useCurrency(cactus?.price || 0);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [authOpen, setAuthOpen] = useState(false);
  const [hoverActive, setHoverActive] = useState(false);
  const [hoverPoint, setHoverPoint] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [previewPos, setPreviewPos] = useState({ x: 0, y: 0 });
  const imageContainerRef = useRef<HTMLDivElement | null>(null);

  if (!cactus) return null;

  const isReserved =
    (cactus as CactusItem & { status?: string }).status === "reserved";

  const allImages = [
    cactus.images.top,
    cactus.images.side1,
    cactus.images.side2,
    cactus.images.side3,
  ];
  const displayImage = selectedImage || cactus.images.top;

  const handleImageMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = Math.min(
      100,
      Math.max(0, ((e.clientX - rect.left) / rect.width) * 100),
    );
    const yPct = Math.min(
      100,
      Math.max(0, ((e.clientY - rect.top) / rect.height) * 100),
    );
    const x = Math.min(
      rect.width - 240,
      Math.max(16, e.clientX - rect.left + 24),
    );
    const y = Math.min(
      rect.height - 240,
      Math.max(16, e.clientY - rect.top + 24),
    );
    setHoverPoint({ x: xPct, y: yPct });
    setPreviewPos({ x, y });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[min(100vw-2rem,95vw)] max-w-5xl max-h-[95vh] overflow-y-auto">
          <div className="grid gap-6 grid-cols-1 md:grid-cols-[1.5fr_1fr]">
            <div className="space-y-3">
              <div
                ref={imageContainerRef}
                className="relative aspect-square min-h-[320px] sm:min-h-[450px] overflow-hidden rounded-lg bg-muted"
                onMouseEnter={() => setHoverActive(true)}
                onMouseLeave={() => {
                  setHoverActive(false);
                  setHoverPoint(null);
                }}
                onMouseMove={handleImageMouseMove}
              >
                <img
                  src={imgSrc(displayImage)}
                  alt={cactus.name}
                  className="h-full w-full object-cover"
                />
                {hoverActive && hoverPoint && (
                  <div
                    className="pointer-events-none absolute z-30 hidden md:block h-56 w-56 overflow-hidden rounded-3xl border border-white/20 bg-white/10 shadow-2xl"
                    style={{ left: previewPos.x, top: previewPos.y }}
                  >
                    <div
                      className="h-full w-full bg-no-repeat bg-cover"
                      style={{
                        backgroundImage: `url(${imgSrc(displayImage)})`,
                        backgroundSize: "400% 400%",
                        backgroundPosition: `${hoverPoint.x}% ${hoverPoint.y}%`,
                      }}
                    />
                  </div>
                )}
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

            <div className="flex h-full flex-col justify-between space-y-4">
              <div className="space-y-4 rounded-3xl p-6">
                <div className="text-sm leading-none text-muted-foreground">
                  <span className="block text-2xl font-semibold text-foreground">
                    ID: {cactus.id}
                  </span>
                </div>
                <div>
                  <h2 className="font-display text-2xl font-semibold text-foreground ">
                    {cactus.name}
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{cactus.family}</Badge>
                  <Badge variant="outline">
                    {cactus.growType === "seed"
                      ? t("common.seed")
                      : t("common.graft")}
                  </Badge>
                  <Badge variant="outline">{`${cactus.sizeCm} cm`}</Badge>
                </div>
                <p className="text-sm leading-relaxed text-foreground/80">
                  {cactus.description}
                </p>
              </div>

              <div>
                <div className="flex justify-end pt-4">
                  <span className="font-display text-3xl font-bold text-primary text-right">
                    {priceFormatted}
                  </span>
                </div>

                <Button
                  disabled={cactus.isSold || isReserved}
                  onClick={() => {
                    if (!user) {
                      setAuthOpen(true);
                      return;
                    }
                    if (cactus.isSold || isReserved) return;
                    addToCart(cactus);
                    onOpenChange(false);
                  }}
                  className="mt-4 w-full justify-center gap-2"
                >
                  <ShoppingCart className="h-4 w-4" />
                  {cactus.isSold
                    ? t("catalogue.sold")
                    : isReserved
                      ? t("common.reserved")
                      : t("common.addToCartLong")}
                </Button>
                <AuthModal
                  open={authOpen}
                  onOpenChange={setAuthOpen}
                  initialMode="login"
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CactusDetailModal;
