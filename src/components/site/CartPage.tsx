"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Send, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SearchableCombobox } from "@/components/ui/searchable-combobox";
import { useCart } from "@/context/CartContext";
import { useLocale } from "@/context/LocaleContext";
import { formatPrice } from "@/lib/currency";
import { useUser } from "@/context/UserContext";
import { UserAddress } from "@/types/user";
import { CactusItem } from "@/types/content";
import {
  calculateVolumetricWeight,
  getCountryZone,
  getShippingCostByZone,
} from "@/lib/dragon-courier";
import {
  findOptimalBox,
  CactusPlant,
  PackingDetail,
  PackingSettings,
} from "@/lib/packing-algorithm";
import { generateOrderId } from "@/lib/order-id";
import {
  THAILAND_COUNTRY,
  getCountries,
  getProvinces,
  getCities,
  getDistricts,
  getZipcodes,
} from "@/data/geographical-data";

const SHIPPING_METHODS = [
  { value: "dragonCourier", label: "Dragon Courier" },
  { value: "thaiPost", label: "ไปรษณีย์ไทย (+฿60)" },
];

const PAYMENT_METHODS = [
  { value: "promptPay", label: "PromptPay" },
  { value: "creditCard", label: "Credit / Debit Card" },
  { value: "bankTransfer", label: "ผ่านบัญชีธนาคาร" },
];

const BANK_ACCOUNT = {
  id: "scb",
  bankName: "ธนาคารไทยพาณิชย์ (SCB)",
  accountName: "Thitaree Weerawitporn",
  accountNumber: "125-4-70521-1",
  branch: "Samutprakarn",
  bankCode: "BKKBTHBK",
  holderAddress:
    "51/8 Moo 3 Soi Suksawat 70 Bang Khru Sub District, Phra Pradaeng District, Samutprakarn 10130 Thailand",
  phone: "+66 926949249",
};

const DOCUMENT_SERVICE_FEE = 500;

type CartItem = {
  cactus: CactusItem;
  quantity: number;
};

function convertCartItemsToPackingPlants(items: CartItem[]): CactusPlant[] {
  return items.flatMap((item) =>
    Array.from({ length: item.quantity }, () => ({
      id: item.cactus.id,
      name: item.cactus.name,
      sizeCm: item.cactus.sizeCm,
      widthCm: item.cactus.widthCm,
      lengthCm: item.cactus.lengthCm,
      heightCm: item.cactus.heightCm,
      hasSpines: item.cactus.hasSpines,
      quantity: 1,
    })),
  );
}

function calculateDragonCourierCost(
  items: CartItem[],
  country: string,
  settings?: PackingSettings,
): number | null {
  const zone = getCountryZone(country.trim());
  if (!zone) {
    return null;
  }

  const packingItems = convertCartItemsToPackingPlants(items);

  let packingResults: PackingDetail[] = [];
  try {
    const packing = findOptimalBox(packingItems, true, settings);
    packingResults = Array.isArray(packing) ? packing : [packing];
  } catch {
    return null;
  }

  let shippingCost = 0;
  for (const packing of packingResults) {
    const box = packing.shippingBox;
    const boxVolumetricWeight = calculateVolumetricWeight(
      box.widthCm,
      box.lengthCm,
      box.heightCm,
    );
    const rate = getShippingCostByZone(zone, boxVolumetricWeight);
    if (rate === null) {
      return null;
    }
    shippingCost += rate;
  }

  return shippingCost;
}

function calculateShippingCost(
  items: CartItem[],
  method: "dragonCourier" | "thaiPost",
  country: string,
  settings?: PackingSettings,
): number | null {
  const isInternational =
    country.trim() !== "" && country.trim() !== THAILAND_COUNTRY;
  const documentFee =
    method === "dragonCourier" && isInternational ? DOCUMENT_SERVICE_FEE : 0;

  if (method === "thaiPost") {
    return 60 + documentFee;
  }

  const dragonCost = calculateDragonCourierCost(items, country, settings);
  return dragonCost === null ? null : dragonCost + documentFee;
}

export default function CartPage() {
  const router = useRouter();
  const { locale, t } = useLocale();
  const { items, removeFromCart, updateQuantity, clearCart, totalPrice } =
    useCart();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const shippingMethodDefault = "dragonCourier";
  const paymentMethodDefault = "promptPay";
  const totalPriceFormatted = formatPrice(totalPrice, locale);
  const { isAuthenticated, user } = useUser();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [line, setLine] = useState("");
  const [shippingCountry, setShippingCountry] = useState("");
  const [shippingProvince, setShippingProvince] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingDistrict, setShippingDistrict] = useState("");
  const [shippingZipcode, setShippingZipcode] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingMethod, setShippingMethod] = useState(shippingMethodDefault);
  const [paymentMethod, setPaymentMethod] = useState(paymentMethodDefault);
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState("");
  const [paymentProofUrl, setPaymentProofUrl] = useState("");
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [packingSettings, setPackingSettings] =
    useState<PackingSettings | null>(null);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );

  const savedAddresses: UserAddress[] = Array.isArray(user?.addresses)
    ? user!.addresses
    : [];

  const defaultAddress =
    savedAddresses.find((address) => address.isDefault) ||
    savedAddresses[0] ||
    null;

  const applySavedAddress = (address: UserAddress | null) => {
    if (!address) {
      setSelectedAddressId(null);
      return;
    }

    setSelectedAddressId(address.id);
    setShippingCountry(address.country || "");
    setShippingProvince(address.province || "");
    setShippingCity(address.city || "");
    setShippingZipcode(address.zipcode || "");
    setShippingDistrict(address.district || "");
    setShippingAddress(address.addressLine || "");
    setPhone((prev) => prev || address.phone || "");
    setName((prev) => prev || address.recipient || "");
  };

  const handleSavedAddressChange = (addressId: string) => {
    const address = savedAddresses.find((item) => item.id === addressId);
    if (address) {
      applySavedAddress(address);
    }
  };

  const isThaiShippingCountry = shippingCountry.trim() === THAILAND_COUNTRY;
  const isInternationalShipping =
    shippingCountry.trim() !== "" &&
    shippingCountry.trim() !== THAILAND_COUNTRY;
  const documentServiceFee =
    shippingMethod === "dragonCourier" && isInternationalShipping
      ? DOCUMENT_SERVICE_FEE
      : 0;

  const baseShippingCost =
    shippingMethod === "dragonCourier"
      ? calculateDragonCourierCost(
          items as CartItem[],
          shippingCountry,
          packingSettings ?? undefined,
        )
      : 60;

  const currentShippingCost =
    baseShippingCost === null ? null : baseShippingCost + documentServiceFee;
  const currentShippingCostAmount = currentShippingCost ?? 0;
  const baseShippingCostFormatted =
    baseShippingCost === null ? "N/A" : formatPrice(baseShippingCost, locale);
  const currentShippingCostFormatted =
    currentShippingCost === null
      ? "N/A"
      : formatPrice(currentShippingCost, locale);

  const destinationZone =
    shippingMethod === "dragonCourier" && shippingCountry.trim()
      ? getCountryZone(shippingCountry.trim())
      : null;

  const canUseDragonCourier = Boolean(
    shippingCountry.trim() &&
    getCountryZone(shippingCountry.trim()) &&
    calculateDragonCourierCost(
      items as CartItem[],
      shippingCountry,
      packingSettings ?? undefined,
    ) !== null,
  );

  const dragonCourierUnavailable =
    shippingCountry.trim() &&
    shippingMethod === "dragonCourier" &&
    currentShippingCost === null;

  const grandTotal = totalPrice + currentShippingCostAmount;
  const grandTotalFormattedValue = formatPrice(grandTotal, locale);

  useEffect(() => {
    // Load packing settings (non-blocking). If not present, algorithm uses defaults.
    (async () => {
      try {
        const res = await fetch("/api/admin/packing-settings");
        const data = await res.json().catch(() => ({}));
        setPackingSettings(data?.data ?? null);
      } catch (err) {
        // ignore
      }
    })();

    if (
      isAuthenticated &&
      defaultAddress &&
      !shippingCountry &&
      !shippingProvince &&
      !shippingCity &&
      !shippingZipcode &&
      !shippingAddress
    ) {
      setSelectedAddressId(defaultAddress.id);
      setShippingCountry(defaultAddress.country || "");
      setShippingProvince(defaultAddress.province || "");
      setShippingCity(defaultAddress.city || "");
      setShippingZipcode(defaultAddress.zipcode || "");
      setShippingAddress(defaultAddress.addressLine || "");
      setPhone((prev) => prev || defaultAddress.phone || "");
      setName((prev) => prev || defaultAddress.recipient || "");
    }
  }, [
    defaultAddress,
    isAuthenticated,
    shippingAddress,
    shippingCity,
    shippingCountry,
    shippingProvince,
    shippingZipcode,
  ]);

  useEffect(() => {
    if (
      shippingCountry.trim() &&
      !canUseDragonCourier &&
      shippingMethod === "dragonCourier"
    ) {
      setShippingMethod("thaiPost");
    }
  }, [shippingCountry, canUseDragonCourier, shippingMethod]);

  useEffect(() => {
    if (paymentMethod !== "bankTransfer" && paymentProofPreview) {
      URL.revokeObjectURL(paymentProofPreview);
      setPaymentProofPreview("");
    }
    if (paymentMethod !== "bankTransfer") {
      setPaymentProofFile(null);
      setPaymentProofUrl("");
    }
  }, [paymentMethod, paymentProofPreview]);

  const selectedBankAccount = BANK_ACCOUNT;

  const handlePaymentProofChange = (file: File | null) => {
    if (!file) {
      setPaymentProofFile(null);
      setPaymentProofPreview("");
      setPaymentProofUrl("");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file for payment proof.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Payment proof file must be 10MB or smaller.");
      return;
    }

    if (paymentProofPreview) {
      URL.revokeObjectURL(paymentProofPreview);
    }
    setPaymentProofFile(file);
    setPaymentProofUrl("");
    setPaymentProofPreview(URL.createObjectURL(file));
  };

  useEffect(() => {
    return () => {
      if (paymentProofPreview) {
        URL.revokeObjectURL(paymentProofPreview);
      }
    };
  }, [paymentProofPreview]);

  // Derive options from geographical data
  const countries = getCountries();
  const provinces = shippingCountry ? getProvinces(shippingCountry) : [];
  const cities =
    shippingCountry && shippingProvince
      ? getCities(shippingCountry, shippingProvince)
      : [];
  const districts =
    shippingCountry && shippingProvince && shippingCity
      ? getDistricts(shippingCountry, shippingProvince, shippingCity)
      : [];
  const zipcodes =
    shippingCountry && shippingProvince && shippingCity
      ? getZipcodes(
          shippingCountry,
          shippingProvince,
          shippingCity,
          shippingDistrict,
        )
      : [];

  // Reset dependent fields when parent changes
  const handleCountryChange = (country: string) => {
    setShippingCountry(country);
    setShippingProvince("");
    setShippingCity("");
    setShippingZipcode("");
    setShippingDistrict("");
    setSelectedAddressId(null);
  };

  const handleProvinceChange = (province: string) => {
    setShippingProvince(province);
    setShippingCity("");
    setShippingZipcode("");
    setShippingDistrict("");
  };

  const handleCityChange = (city: string) => {
    setShippingCity(city);
    setShippingZipcode("");
    setShippingDistrict("");
  };

  const handleDistrictChange = (district: string) => {
    setShippingDistrict(district);
    setShippingZipcode("");
  };

  useEffect(() => {
    if (isAuthenticated && user?.email && !email) {
      setEmail(user.email);
    }
  }, [isAuthenticated, user, email]);

  const uploadPaymentProof = async () => {
    if (paymentProofUrl) {
      return paymentProofUrl;
    }

    if (!paymentProofFile) {
      throw new Error("Please upload payment proof for bank transfer.");
    }

    setIsUploadingProof(true);
    try {
      const formData = new FormData();
      formData.append("file", paymentProofFile);
      formData.append("folder", "cactistock/payment-proofs");

      const uploadRes = await fetch("/api/checkout/upload-proof", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json().catch(() => ({}));
      if (!uploadRes.ok || !uploadData.url) {
        throw new Error(
          uploadData.error ||
            "Failed to upload payment proof. Please try again.",
        );
      }

      setPaymentProofUrl(uploadData.url);
      return uploadData.url;
    } finally {
      setIsUploadingProof(false);
    }
  };

  const handleSubmitOrder = async () => {
    if (!isAuthenticated) {
      toast.error("Please login before placing an order.");
      router.push(`/${locale}/login`);
      return;
    }

    if (!email.trim()) {
      toast.error(t("cart.emailRequired"));
      return;
    }

    if (!shippingCountry.trim()) {
      toast.error("Please enter a destination country.");
      return;
    }

    if (!shippingAddress.trim()) {
      toast.error("Please enter a shipping address.");
      return;
    }

    if (!paymentMethod) {
      toast.error("Please select a payment method.");
      return;
    }

    if (dragonCourierUnavailable) {
      toast.error(
        "Dragon Courier cannot calculate a shipping price for this order. Please choose Thai Post.",
      );
      return;
    }

    if (
      paymentMethod === "bankTransfer" &&
      !paymentProofFile &&
      !paymentProofUrl
    ) {
      toast.error(
        "Please upload proof of bank transfer before confirming the order.",
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemIds: items.map((item) => item.cactus.id),
          contactName: name.trim(),
          contactEmail: email.trim(),
          contactPhone: phone.trim(),
          contactLine: line.trim(),
          shippingCountry: shippingCountry.trim(),
          shippingProvince: shippingProvince.trim(),
          shippingCity: shippingCity.trim(),
          shippingDistrict: shippingDistrict.trim(),
          shippingZipcode: shippingZipcode.trim(),
          shippingAddress: shippingAddress.trim(),
          shippingMethod,
          paymentMethod,
          shippingCost: currentShippingCostAmount,
          note: note.trim(),
          totalPrice: grandTotal,
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

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || t("cart.submitError"));
        return;
      }

      const orderId = data.orderId || generateOrderId();

      let bankTransferProofUrl = paymentProofUrl;
      if (paymentMethod === "bankTransfer") {
        bankTransferProofUrl = await uploadPaymentProof();
      }

      const orderPayload = {
        id: orderId,
        orderId,
        createdAt: new Date().toISOString(),
        totalPrice: grandTotal,
        shippingCost: currentShippingCostAmount,
        itemCount,
        items: items.map((item) => ({
          id: item.cactus.id,
          name: item.cactus.name,
          price: item.cactus.price,
          quantity: item.quantity,
        })),
        contactName: name.trim(),
        contactEmail: email.trim(),
        contactPhone: phone.trim(),
        contactLine: line.trim(),
        shippingCountry: shippingCountry.trim(),
        shippingProvince: shippingProvince.trim(),
        shippingCity: shippingCity.trim(),
        shippingDistrict: shippingDistrict.trim(),
        shippingZipcode: shippingZipcode.trim(),
        shippingAddress: shippingAddress.trim(),
        shippingMethod,
        paymentMethod,
        paymentProofUrl: bankTransferProofUrl,
        bankAccountId: selectedBankAccount?.id,
        bankAccountName: selectedBankAccount?.bankName,
        bankAccountNumber: selectedBankAccount?.accountNumber,
        bankBranch: selectedBankAccount?.branch,
        note: note.trim(),
      };

      try {
        window.localStorage.setItem(
          "cactistock_last_order",
          JSON.stringify(orderPayload),
        );
      } catch (error) {
        console.warn("Failed to save order preview locally:", error);
      }

      if (paymentMethod === "bankTransfer") {
        const saveOrderRes = await fetch("/api/checkout/save-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderPayload),
        });

        const saveOrderData = await saveOrderRes.json().catch(() => ({}));
        if (!saveOrderRes.ok) {
          toast.error(
            saveOrderData.error || "Failed to save order. Please try again.",
          );
          return;
        }

        toast.success(
          `Order created. Please complete payment with the selected method.`,
          {
            duration: 8000,
          },
        );

        clearCart();
        setName("");
        setEmail(user?.email || "");
        setPhone("");
        setLine("");
        setShippingAddress("");
        setNote("");
        router.push(`/${locale}/checkout/confirmation`);
        return;
      }

      const stripePaymentMethod =
        paymentMethod === "promptPay"
          ? "promptpay"
          : paymentMethod === "creditCard"
            ? "card"
            : null;

      if (stripePaymentMethod) {
        const paymentRes = await fetch("/api/checkout/stripe-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: grandTotal,
            currency: "thb",
            paymentMethod: stripePaymentMethod,
            description: `CactiStock Order ${orderId}`,
            orderId,
            customerEmail: email.trim(),
            customerPhone: phone.trim(),
            successRedirectUrl: `${window.location.origin}/${locale}/checkout/confirmation?status=success&session_id={CHECKOUT_SESSION_ID}&orderId=${orderId}`,
            failureRedirectUrl: `${window.location.origin}/${locale}/checkout/confirmation?status=failed&orderId=${orderId}`,
          }),
        });

        const paymentData = await paymentRes.json().catch(() => ({}));
        if (!paymentRes.ok) {
          toast.error(
            paymentData.error || "Unable to begin payment. Please try again.",
          );
          return;
        }

        window.location.href = paymentData.sessionUrl;
        return;
      }

      toast.error("Selected payment method is not supported.");
      return;

      clearCart();
      setName("");
      setEmail(user?.email || "");
      setPhone("");
      setLine("");
      setShippingAddress("");
      setNote("");
      router.push(`/${locale}/checkout/confirmation`);
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
      <div className="mb-8 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-display text-4xl font-bold">
              {t("cart.title")}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {itemCount} selected cacti · {items.length} item types
            </p>
          </div>
          {!isAuthenticated && (
            <div className="mb-6 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-left text-sm text-destructive">
              You must login or register before placing an order. Add items to
              the cart first, then continue to checkout after signing in.
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const CartItemPrice = () => {
              const formatted = formatPrice(item.cactus.price, locale);
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

          <div className="space-y-4 rounded-xl border border-muted p-4 text-sm text-muted-foreground">
            <div className="grid gap-3 md:grid-cols-2">
              {savedAddresses.length > 0 ? (
                <div className="md:col-span-2">
                  <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                    Saved addresses
                  </p>
                  <Select
                    value={selectedAddressId ?? ""}
                    onValueChange={handleSavedAddressChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a saved address..." />
                    </SelectTrigger>
                    <SelectContent>
                      {savedAddresses.map((address) => (
                        <SelectItem key={address.id} value={address.id}>
                          {address.label ||
                            address.recipient ||
                            address.addressLine}
                          {address.isDefault ? " (default)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              <div>
                <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                  Country
                </p>
                <SearchableCombobox
                  options={countries}
                  value={shippingCountry}
                  onValueChange={handleCountryChange}
                  placeholder="Select country..."
                  searchPlaceholder="Search countries..."
                />
              </div>

              <div>
                <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                  Province / State
                </p>
                {isThaiShippingCountry ? (
                  <SearchableCombobox
                    options={provinces}
                    value={shippingProvince}
                    onValueChange={handleProvinceChange}
                    placeholder="Select province/state..."
                    searchPlaceholder="Search provinces..."
                    disabled={!shippingCountry}
                  />
                ) : (
                  <Input
                    placeholder="Enter province/state"
                    value={shippingProvince}
                    onChange={(e) => setShippingProvince(e.target.value)}
                  />
                )}
              </div>

              <div>
                <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                  City / District
                </p>
                {isThaiShippingCountry ? (
                  <SearchableCombobox
                    options={cities}
                    value={shippingCity}
                    onValueChange={handleCityChange}
                    placeholder="Select city/district..."
                    searchPlaceholder="Search cities..."
                    disabled={!shippingProvince}
                  />
                ) : (
                  <Input
                    placeholder="Enter city/district"
                    value={shippingCity}
                    onChange={(e) => setShippingCity(e.target.value)}
                  />
                )}
              </div>

              <div>
                <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                  District / Sub-district
                </p>
                {isThaiShippingCountry ? (
                  <SearchableCombobox
                    options={districts}
                    value={shippingDistrict}
                    onValueChange={handleDistrictChange}
                    placeholder="Select district/sub-district..."
                    searchPlaceholder="Search districts..."
                    disabled={!shippingCity || districts.length === 0}
                  />
                ) : (
                  <Input
                    placeholder="Enter district/sub-district"
                    value={shippingDistrict}
                    onChange={(e) => setShippingDistrict(e.target.value)}
                  />
                )}
              </div>

              <div>
                <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                  Zipcode
                </p>
                {isThaiShippingCountry ? (
                  <SearchableCombobox
                    options={zipcodes}
                    value={shippingZipcode}
                    onValueChange={setShippingZipcode}
                    placeholder="Select zipcode..."
                    searchPlaceholder="Search zipcodes..."
                    disabled={!shippingDistrict || zipcodes.length === 0}
                  />
                ) : (
                  <Input
                    placeholder="Enter zipcode/postal code"
                    value={shippingZipcode}
                    onChange={(e) => setShippingZipcode(e.target.value)}
                  />
                )}
              </div>
            </div>

            <div>
              <p className="mb-2 font-semibold">Shipping address</p>
              <Textarea
                placeholder="Enter your shipping address"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <div>
              <p className="mb-2 font-semibold">Shipping method</p>
              <Select
                value={shippingMethod}
                onValueChange={(value) => setShippingMethod(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose shipping method" />
                </SelectTrigger>
                <SelectContent>
                  {SHIPPING_METHODS.map((method) => (
                    <SelectItem
                      key={method.value}
                      value={method.value}
                      disabled={
                        method.value === "dragonCourier" &&
                        shippingCountry.trim() !== "" &&
                        !canUseDragonCourier
                      }
                    >
                      {method.label}
                      {method.value === "dragonCourier" &&
                      shippingCountry.trim() &&
                      !canUseDragonCourier
                        ? " (not available for selected country or weight)"
                        : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {shippingCountry.trim() &&
              shippingMethod === "dragonCourier" &&
              !canUseDragonCourier ? (
                <div className="mt-3 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
                  Dragon Courier is not available for the selected country or
                  the current package weight. The shipping method has been
                  switched to Thai Post.
                </div>
              ) : null}
              {dragonCourierUnavailable ? (
                <div className="mt-3 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
                  Dragon Courier cannot calculate a shipping price for this
                  order. Please choose Thai Post or reduce the package size.
                </div>
              ) : null}
            </div>

            <div>
              <p className="mb-2 font-semibold">Payment method</p>
              <Select
                value={paymentMethod}
                onValueChange={(value) => setPaymentMethod(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose payment method" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {paymentMethod === "bankTransfer" ? (
              <div className="space-y-3 rounded-2xl border border-primary/30 bg-primary/5 p-4 text-left text-sm text-foreground">
                <p className="font-semibold text-base text-primary">
                  โอนเงินผ่านบัญชีธนาคาร
                </p>
                <p className="text-sm text-muted-foreground">
                  กรุณาโอนเงินไปยังบัญชีธนาคารด้านล่างแล้วอัปโหลดสลิปหลักฐานการโอน
                  เพื่อให้เจ้าหน้าที่ตรวจสอบรายการได้เร็วขึ้น
                </p>

                <div className="space-y-3 rounded-xl bg-background p-3 text-sm text-foreground">
                  <p className="font-semibold">
                    {selectedBankAccount.bankName}
                  </p>
                  <p>ชื่อบัญชี: {selectedBankAccount.accountName}</p>
                  <p>เลขบัญชี: {selectedBankAccount.accountNumber}</p>
                  <p>สาขา: {selectedBankAccount.branch}</p>
                  <p>Bank code: {selectedBankAccount.bankCode}</p>
                  <p>Address: {selectedBankAccount.holderAddress}</p>
                  <p>Tel: {selectedBankAccount.phone}</p>
                </div>

                <div>
                  <p className="mb-2 font-semibold">Upload transfer proof</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      handlePaymentProofChange(event.target.files?.[0] ?? null)
                    }
                    className="block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-semibold file:text-background"
                  />
                  {paymentProofPreview ? (
                    <div className="mt-3 flex flex-col gap-3">
                      <img
                        src={paymentProofPreview}
                        alt="Payment proof preview"
                        className="max-h-52 w-full rounded-xl object-cover"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handlePaymentProofChange(null)}
                      >
                        Remove proof
                      </Button>
                    </div>
                  ) : null}
                  {isUploadingProof ? (
                    <p className="text-xs text-muted-foreground mt-2">
                      Uploading proof, please wait...
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="rounded-xl bg-muted/50 p-3 text-sm text-muted-foreground">
              <p className="font-semibold">Payment guidance</p>
              <p className="mt-1">
                After submitting your order, seller will contact you to confirm
                the selected items and payment details for the chosen method.
              </p>
            </div>
          </div>

          <div className="rounded-xl border-t border-muted/50 p-4 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Item total</span>
              <span>{totalPriceFormatted}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>{baseShippingCostFormatted}</span>
            </div>
            {shippingMethod === "dragonCourier" &&
            isInternationalShipping &&
            baseShippingCost !== null ? (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Fee</span>
                <span>{formatPrice(documentServiceFee, locale)}</span>
              </div>
            ) : null}
            {dragonCourierUnavailable ? (
              <div className="mt-1 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
                Dragon Courier shipping cost could not be calculated for this
                order.
              </div>
            ) : null}
            {shippingMethod === "dragonCourier" && shippingCountry.trim() ? (
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Destination zone</span>
                <span>
                  {destinationZone ? `Zone ${destinationZone}` : "Unknown"}
                </span>
              </div>
            ) : null}
            <div className="mt-3 flex justify-between text-lg font-bold">
              <span>{t("cart.total")}</span>
              <span>{grandTotalFormattedValue}</span>
            </div>
          </div>

          <Button
            onClick={handleSubmitOrder}
            className="h-14 w-full gap-2 text-base font-bold"
            size="lg"
            disabled={!isAuthenticated || isSubmitting}
          >
            <Send className="h-4 w-4" />
            {isSubmitting
              ? t("cart.submitting")
              : paymentMethod === "bankTransfer"
                ? "ยืนยันและแจ้งชำระเงิน"
                : isAuthenticated
                  ? t("cart.submit")
                  : t("cart.loginButton") || "Login to place order"}
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
