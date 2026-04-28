"use client";

import { ShoppingCart, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CactusItem } from "@/types/content";
import { useCart } from "@/context/CartContext";
import { useLocale } from "@/context/LocaleContext";
import { useCurrency } from "@/hooks/useCurrency";
import { useUser } from "@/context/UserContext";
import AuthModal from "@/components/AuthModal";
import { useState } from "react";

interface Props {
  cactus: CactusItem;
  onSelect: (cactus: CactusItem) => void;
}

const PLACEHOLDER_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' fill='%23e5e7eb'%3E%3Crect width='400' height='400'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='18' fill='%239ca3af'%3ENo Image%3C/text%3E%3C/svg%3E";

function imgSrc(url: string) {
  return url && url.startsWith("http") ? url : PLACEHOLDER_IMG;
}

const CactusCard = ({ cactus, onSelect }: Props) => {
  const { addToCart, items } = useCart();
  const { user } = useUser();
  const { t } = useLocale();
  const { formatted: priceFormatted } = useCurrency(cactus.price);
  const [addedToCart, setAddedToCart] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  const growTypeLabel =
    cactus.growType === "seed" ? t("common.seed") : t("common.graft");
  const isInCart =
    items.some((item) => item.cactus.id === cactus.id) || addedToCart;
  const isReserved =
    (cactus as CactusItem & { status?: string }).status === "reserved";

  return (
    <div
      className="group cursor-pointer overflow-hidden rounded-lg border bg-card shadow-sm transition-all hover:shadow-lg hover:-translate-y-1"
      onClick={() => onSelect(cactus)}
    >
      {/* Image grid: main left, 3 small stacked right */}
      <div className="flex h-64">
        <div className="w-2/3 overflow-hidden">
          <img
            src={imgSrc(cactus.images.top)}
            alt={cactus.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <div className="flex w-1/3 flex-col">
          {[cactus.images.side1, cactus.images.side2, cactus.images.side3].map(
            (img, i) => (
              <div
                key={i}
                className="h-1/3 overflow-hidden border-l border-b last:border-b-0"
              >
                <img
                  src={imgSrc(img)}
                  alt={`${cactus.name} ${t("common.angle")} ${i + 1}`}
                  className="h-full w-full object-cover"
                />
              </div>
            ),
          )}
        </div>
      </div>

      <div className="p-4 space-y-2">
        <span className="text-xs text-muted-foreground font-mono">
          {cactus.id}
        </span>
        <h1 className="font-display text-lg font-semibold leading-tight text-card-foreground">
          {cactus.family} {cactus.name}
        </h1>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline" className="text-xs">
            {growTypeLabel}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {cactus.sizeCm} cm
          </Badge>
          {isReserved && (
            <Badge variant="destructive" className="text-xs">
              {t("common.reserved")}
            </Badge>
          )}
        </div>
        <div className="flex items-center justify-between pt-2">
          <div className="flex flex-col">
            <span className="font-display text-xl font-bold text-primary">
              {priceFormatted}
            </span>
            {cactus.isSold && (
              <span className="text-xs font-bold text-destructive">
                SOLD OUT
              </span>
            )}
            {isReserved && (
              <span className="text-xs font-medium text-orange-600">
                {t("common.reserved")}
              </span>
            )}
          </div>
          <Button
            size="sm"
            className="gap-1.5"
            disabled={cactus.isSold || isReserved || isInCart}
            variant={isInCart ? "secondary" : "default"}
            onClick={(e) => {
              e.stopPropagation();
              if (!user) {
                setAuthOpen(true);
                return;
              }
              const wasAdded = addToCart(cactus);
              if (wasAdded) {
                setAddedToCart(true);
              }
            }}
          >
            {isInCart ? (
              <>
                <Check className="h-3.5 w-3.5" />
                {t("common.addedToCart") || "Already added to cart"}
              </>
            ) : (
              <>
                <ShoppingCart className="h-3.5 w-3.5" />
                {t("common.addToCart")}
              </>
            )}
          </Button>
          <AuthModal
            open={authOpen}
            onOpenChange={setAuthOpen}
            initialMode="login"
          />
        </div>
      </div>
    </div>
  );
};

export default CactusCard;
