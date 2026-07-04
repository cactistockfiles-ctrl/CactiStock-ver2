"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  ChevronRight,
  ShieldCheck,
  ShoppingBag,
  Truck,
  RotateCcw,
} from "lucide-react";
import { useLocale } from "@/context/LocaleContext";
import { useUser } from "@/context/UserContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableCombobox } from "@/components/ui/searchable-combobox";
import {
  THAILAND_COUNTRY,
  getCountries,
  getProvinces,
  getCities,
  getDistricts,
  getZipcodes,
} from "@/data/geographical-data";
import { UserAddress } from "@/types/user";

interface ProfileOrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface ProfileOrder {
  id: string;
  createdAt: string;
  totalPrice?: number;
  paymentStatus?: string;
  items?: ProfileOrderItem[];
}

type ProfileSection =
  | "account"
  | "addresses"
  | "orders"
  | "security"
  | "policy"
  | "help"
  | "feedback";

const PROFILE_SECTIONS: ProfileSection[] = [
  "account",
  "addresses",
  "orders",
  "security",
  "policy",
  "help",
  "feedback",
];

export default function ProfilePage() {
  const { locale } = useLocale();
  const {
    user,
    isAuthenticated,
    loading,
    updateProfile,
    logout,
    changePassword,
  } = useUser();
  const [activeSection, setActiveSection] = useState<ProfileSection>("account");
  const [policyTab, setPolicyTab] = useState<
    "privacy" | "orders" | "shipping" | "returns"
  >("privacy");
  const pathname = usePathname();
  const router = useRouter();

  // Account edit modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editField, setEditField] = useState<string>("");
  const [editValue, setEditValue] = useState("");
  const [editSecondValue, setEditSecondValue] = useState("");

  // Password change modal states
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordErrorMsg, setPasswordErrorMsg] = useState("");
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState("");

  // Address book state
  const [addressList, setAddressList] = useState<UserAddress[]>([]);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [addressEditingId, setAddressEditingId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState<UserAddress>({
    id: "",
    label: "",
    recipient: "",
    phone: "",
    country: "",
    province: "",
    city: "",
    district: "",
    zipcode: "",
    addressLine: "",
    isDefault: false,
  });

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  // Orders state
  const [ordersList, setOrdersList] = useState<ProfileOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  const [selectedOrderDetail, setSelectedOrderDetail] =
    useState<ProfileOrder | null>(null);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);

  useEffect(() => {
    // Wait until the user session has been loaded before redirecting.
    if (!loading && !isAuthenticated) {
      window.location.assign(`/${locale}/login`);
    }
  }, [isAuthenticated, locale, loading]);

  // Handle tab query parameter
  const navigateToSection = (section: ProfileSection) => {
    router.push(`/${locale}/profile/${section}`);
  };

  useEffect(() => {
    if (!pathname) return;
    const pathParts = pathname.split("/").filter(Boolean);
    const section = pathParts[2] as ProfileSection | undefined;

    if (section && PROFILE_SECTIONS.includes(section)) {
      setActiveSection(section);
      return;
    }

    if (pathname === `/${locale}/profile`) {
      setActiveSection("account");
      router.replace(`/${locale}/profile/account`);
      return;
    }

    setActiveSection("account");
  }, [locale, pathname, router]);

  useEffect(() => {
    if (user?.addresses) {
      setAddressList(user.addresses);
    } else {
      setAddressList([]);
    }
  }, [user]);

  const fetchOrdersForUser = useCallback(async () => {
    if (!user?.email) return;
    setOrdersLoading(true);
    setOrdersError("");
    try {
      const res = await fetch(`/api/user/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email.toLowerCase() }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setOrdersList([]);
        setOrdersError(
          data?.error || "ไม่สามารถโหลดประวัติการสั่งซื้อได้ในขณะนี้",
        );
      } else if (!Array.isArray(data)) {
        setOrdersList([]);
        setOrdersError(
          data?.error || "ไม่สามารถโหลดประวัติการสั่งซื้อได้ในขณะนี้",
        );
      } else {
        setOrdersList(data);
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      setOrdersList([]);
      setOrdersError("ไม่สามารถโหลดประวัติการสั่งซื้อได้ในขณะนี้");
    } finally {
      setOrdersLoading(false);
    }
  }, [user?.email]);

  // Fetch orders when entering orders section
  useEffect(() => {
    if (activeSection === "orders" && user?.email) {
      fetchOrdersForUser();
    }
  }, [activeSection, fetchOrdersForUser, user?.email]);

  if (!user) return null;

  const countries = getCountries();
  const isThailandAddress =
    addressForm.country && addressForm.country === THAILAND_COUNTRY;
  const provinces = getProvinces(addressForm.country || "");
  const cities = getCities(
    addressForm.country || "",
    addressForm.province || "",
  );
  const subdistricts = getDistricts(
    addressForm.country || "",
    addressForm.province || "",
    addressForm.city || "",
  );
  const zipcodes = getZipcodes(
    addressForm.country || "",
    addressForm.province || "",
    addressForm.city || "",
    addressForm.district || "",
  );

  const handleLogout = () => {
    logout();
    window.location.assign(`/${locale}`);
  };

  const handleEditClick = (field: string, value: string) => {
    setEditField(field);
    if (field === "displayName") {
      setEditValue(user?.displayName || "");
      setEditSecondValue("");
    } else {
      setEditValue(value || "");
      setEditSecondValue("");
    }
    setErrorMsg("");
    setSuccessMsg("");
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (editField === "displayName") {
      if (!editValue.trim()) {
        setErrorMsg("Please fill in your name");
        return;
      }
    } else if (!editValue.trim()) {
      setErrorMsg("Please fill in all required fields");
      return;
    }

    try {
      const updates: Record<string, string> = {};

      if (editField === "displayName") {
        updates.displayName = editValue.trim();
      } else if (editField === "phone") {
        updates.phone = editValue.trim();
      } else if (editField === "taxId") {
        updates.taxId = editValue.trim();
      }

      const result = await updateProfile(updates);

      if (!result.ok) {
        setErrorMsg(result.error || "Failed to update");
        return;
      }

      setSuccessMsg("Updated successfully");
      setTimeout(() => setEditModalOpen(false), 1000);
    } catch (error) {
      setErrorMsg("An error occurred");
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword.trim()) {
      setPasswordErrorMsg("Please enter current password");
      return;
    }

    if (!newPassword.trim()) {
      setPasswordErrorMsg("Please enter new password");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordErrorMsg("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordErrorMsg("New password must be at least 6 characters");
      return;
    }

    try {
      const result = await changePassword(currentPassword, newPassword);

      if (!result.ok) {
        setPasswordErrorMsg(result.error || "Failed to change password");
        return;
      }

      setPasswordSuccessMsg("Password changed successfully");
      setTimeout(() => {
        setPasswordModalOpen(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setPasswordErrorMsg("");
        setPasswordSuccessMsg("");
      }, 1000);
    } catch (error) {
      setPasswordErrorMsg("An error occurred");
    }
  };

  const openAddressModal = (address?: UserAddress) => {
    setAddressEditingId(address?.id || null);
    setAddressForm(
      address
        ? { ...address }
        : {
            id: crypto.randomUUID?.() || String(Date.now()),
            label: "",
            recipient: "",
            phone: "",
            country: "",
            province: "",
            city: "",
            district: "",
            zipcode: "",
            addressLine: "",
            isDefault: addressList.length === 0,
          },
    );
    setErrorMsg("");
    setSuccessMsg("");
    setAddressModalOpen(true);
  };

  const handleAddressChange = (
    field: keyof UserAddress,
    value: string | boolean,
  ) => {
    setAddressForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const saveAddress = async () => {
    if (
      !addressForm.label ||
      !addressForm.label.trim() ||
      !addressForm.recipient.trim() ||
      !addressForm.addressLine.trim()
    ) {
      setErrorMsg("กรุณากรอกข้อมูลชื่อผู้รับ ที่อยู่ และป้ายชื่อ");
      return;
    }

    const nextAddresses = addressEditingId
      ? addressList.map((address) =>
          address.id === addressEditingId ? { ...addressForm } : address,
        )
      : [...addressList, { ...addressForm }];

    const normalizedAddresses = nextAddresses.map((address, index) => ({
      ...address,
      isDefault:
        addressForm.isDefault || nextAddresses.length === 1
          ? address.id === addressForm.id
          : address.isDefault,
    }));

    const finalAddresses =
      normalizedAddresses.some((address) => address.isDefault) ||
      normalizedAddresses.length === 0
        ? normalizedAddresses
        : normalizedAddresses.map((address, index) => ({
            ...address,
            isDefault: index === 0,
          }));

    const result = await updateProfile({ addresses: finalAddresses });
    if (!result.ok) {
      setErrorMsg(result.error || "Failed to save address");
      return;
    }

    setAddressList(finalAddresses);
    setSuccessMsg("บันทึกที่อยู่เรียบร้อยแล้ว");
    setTimeout(() => setAddressModalOpen(false), 500);
  };

  const deleteAddress = async (id: string) => {
    const nextAddresses = addressList.filter((address) => address.id !== id);
    const normalizedAddresses = nextAddresses.some(
      (address) => address.isDefault,
    )
      ? nextAddresses
      : nextAddresses.map((address, index) => ({
          ...address,
          isDefault: index === 0,
        }));

    const result = await updateProfile({ addresses: normalizedAddresses });
    if (!result.ok) {
      setErrorMsg(result.error || "Failed to remove address");
      return;
    }

    setAddressList(normalizedAddresses);
    setSuccessMsg("ลบที่อยู่เรียบร้อยแล้ว");
  };

  return (
    <div className="container mx-auto py-4 px-4 pt-20">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4 lg:grid-cols-5">
        {/* Sidebar Menu */}
        <div className="space-y-1 md:col-span-1">
          <div className="mb-6 p-4 rounded-lg bg-muted">
            <p className="font-semibold text-sm text-muted-foreground">
              {user.displayName || user.email}
            </p>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => navigateToSection("account")}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeSection === "account"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
            >
              ข้อมูลเกี่ยวกับบัญชี
            </button>
            <button
              onClick={() => navigateToSection("addresses")}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeSection === "addresses"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
            >
              สมุดที่อยู่
            </button>
            <button
              onClick={() => navigateToSection("orders")}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeSection === "orders"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
            >
              ประวัติการสั่งซื้อ
            </button>
            <button
              onClick={() => navigateToSection("security")}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeSection === "security"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
            >
              ความปลอดภัยบัญชี
            </button>
            <button
              onClick={() => navigateToSection("policy")}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeSection === "policy"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
            >
              นโยบาย
            </button>
            <button
              onClick={() => navigateToSection("help")}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeSection === "help"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
            >
              ช่วยเหลือ
            </button>
            <button
              onClick={() => navigateToSection("feedback")}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeSection === "feedback"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
            >
              ให้ข้อเสนอแนะ
            </button>

            <div className="border-t pt-2 mt-4">
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                ออกจากระบบ
              </button>
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div className="md:col-span-3 lg:col-span-4">
          {activeSection === "account" && (
            <div className="rounded-lg border bg-card p-6 space-y-6">
              <h1 className="text-2xl font-semibold">ข้อมูลเกี่ยวกับบัญชี</h1>

              {/* Full Name */}
              <div
                onClick={() =>
                  handleEditClick("displayName", user?.displayName || "")
                }
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted cursor-pointer transition-colors"
              >
                <div>
                  <p className="text-sm text-muted-foreground">ชื่อ - สกุล</p>
                  <p className="font-medium">{user?.displayName || "-"}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>

              {/* Phone */}
              <div
                onClick={() => handleEditClick("phone", user?.phone || "")}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted cursor-pointer transition-colors"
              >
                <div>
                  <p className="text-sm text-muted-foreground">เบอร์โทรศัพท์</p>
                  <p className="font-medium">
                    {user?.phone || "ยังไม่ตั้งค่า"}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>

              {/* Email */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">อีเมล</p>
                  <p className="font-medium">{user?.email}</p>
                </div>
                <span className="text-xs text-muted-foreground">
                  ไม่สามารถเปลี่ยนแปลงได้
                </span>
              </div>
            </div>
          )}

          {activeSection === "addresses" && (
            <div className="rounded-lg border bg-card p-6 space-y-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-2xl font-semibold">สมุดที่อยู่</h1>
                  <p className="text-sm text-muted-foreground">
                    จัดการที่อยู่จัดส่งของคุณ สามารถเพิ่ม แก้ไข
                    หรือเลือกรายการเริ่มต้นได้
                  </p>
                </div>
                <Button onClick={() => openAddressModal()}>
                  เพิ่มที่อยู่ใหม่
                </Button>
              </div>

              {addressList.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-muted p-6 text-center text-sm text-muted-foreground">
                  ยังไม่มีที่อยู่ในสมุดที่อยู่ของคุณ
                </div>
              ) : (
                <div className="space-y-4">
                  {addressList.map((address) => (
                    <div
                      key={address.id}
                      className="rounded-3xl border bg-muted p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold">
                              {address.label}
                            </p>
                            {address.isDefault ? (
                              <span className="rounded-full bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
                                เริ่มต้น
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-2 text-sm text-foreground">
                            {address.recipient}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {address.phone || "ไม่มีเบอร์โทรศัพท์"}
                          </p>
                          <p className="mt-2 text-sm leading-relaxed text-foreground">
                            {address.addressLine}
                            {address.district ? `, ${address.district}` : ""}
                            {address.city ? `, ${address.city}` : ""}
                            {address.province ? `, ${address.province}` : ""}
                            {address.zipcode ? ` ${address.zipcode}` : ""}
                            {address.country ? `, ${address.country}` : ""}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2 text-right">
                          <button
                            type="button"
                            className="text-sm font-medium text-primary hover:underline"
                            onClick={() => openAddressModal(address)}
                          >
                            แก้ไข
                          </button>
                          <button
                            type="button"
                            className="text-sm font-medium text-destructive hover:underline"
                            onClick={() => deleteAddress(address.id)}
                          >
                            ลบ
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSection === "orders" && (
            <div className="rounded-lg border bg-card p-6">
              <h1 className="text-2xl font-semibold mb-6">
                ประวัติการสั่งซื้อ
              </h1>

              {ordersLoading ? (
                <p className="text-sm text-muted-foreground">
                  กำลังโหลดรายการคำสั่งซื้อ...
                </p>
              ) : ordersError ? (
                <div className="rounded-3xl border border-red-300 bg-red-50 p-6 text-center text-sm text-destructive">
                  {ordersError}
                </div>
              ) : ordersList.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-muted p-6 text-center text-sm text-muted-foreground">
                  ยังไม่มีคำสั่งซื้อ
                </div>
              ) : (
                <div className="space-y-3">
                  {ordersList.map((order) => (
                    <div
                      key={order.id}
                      className="p-4 rounded-lg border hover:bg-muted cursor-pointer"
                      onClick={() => {
                        setSelectedOrderDetail(order);
                        setOrderDialogOpen(true);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{order.id}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {order.paymentStatus ?? "รอการชำระเงิน"}
                          </p>
                          <p className="text-sm">
                            ฿{Number(order.totalPrice ?? 0).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>รายละเอียดคำสั่งซื้อ</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    {selectedOrderDetail ? (
                      <>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Order ID
                          </p>
                          <p className="font-medium">
                            {selectedOrderDetail.id}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            วันที่
                          </p>
                          <p>
                            {new Date(
                              selectedOrderDetail.createdAt,
                            ).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            สถานะการชำระเงิน
                          </p>
                          <p className="font-medium">
                            {selectedOrderDetail.paymentStatus ??
                              "รอการชำระเงิน"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            รายการสินค้า
                          </p>
                          <div className="space-y-2">
                            {(selectedOrderDetail.items || []).map(
                              (it: ProfileOrderItem, idx: number) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between"
                                >
                                  <div>
                                    <p className="font-medium">{it.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                      x{it.quantity}
                                    </p>
                                  </div>
                                  <div>
                                    ฿{Number(it.price ?? 0).toLocaleString()}
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No details
                      </p>
                    )}
                  </div>
                  <DialogFooter>
                    <Button onClick={() => setOrderDialogOpen(false)}>
                      ปิด
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {activeSection === "security" && (
            <div className="rounded-lg border bg-card p-6 space-y-6">
              <h1 className="text-2xl font-semibold">ความปลอดภัยบัญชี</h1>

              {user?.oauthProvider ? (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
                  <div className="space-y-2">
                    <p className="font-medium text-blue-900">
                      ใช้การเข้าสู่ระบบ {user.oauthProvider}
                    </p>
                    <p className="text-sm text-blue-800">
                      บัญชีของคุณมีการป้องกันโดย {user.oauthProvider}
                      เพื่อความปลอดภัยของบัญชีของคุณ
                      การเปลี่ยนรหัสผ่านไม่ได้เป็นส่วนหนึ่งของการตั้งค่านี้
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-lg border bg-muted p-4">
                    <p className="text-sm font-medium mb-2">เปลี่ยนรหัสผ่าน</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      อัปเดตรหัสผ่านของคุณเป็นประจำเพื่อรักษาความปลอดภัย
                    </p>
                    <Button
                      onClick={() => {
                        setPasswordModalOpen(true);
                        setPasswordErrorMsg("");
                        setPasswordSuccessMsg("");
                      }}
                    >
                      เปลี่ยนรหัสผ่าน
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeSection === "policy" && (
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <div className="mb-6 rounded-xl border border-primary/20 bg-primary/10 p-5">
                <h1 className="text-2xl font-semibold text-foreground">
                  นโยบายของ Cacti Stock
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  นโยบายนี้เป็นกรอบเกณฑ์ในการให้บริการของ Cacti Stock
                  เพื่อสร้างความโปร่งใสและความมั่นใจให้แก่ลูกค้าทุกท่าน
                  ในเรื่องการเก็บข้อมูล การสั่งซื้อ การชำระเงิน การจัดส่ง
                  และการดูแลสินค้าหลังการรับสินค้า
                </p>
              </div>

              <div className="mb-6 flex flex-wrap gap-2">
                {[
                  {
                    key: "privacy",
                    label: "ความเป็นส่วนตัว",
                    icon: ShieldCheck,
                  },
                  { key: "orders", label: "การสั่งซื้อ", icon: ShoppingBag },
                  { key: "shipping", label: "การจัดส่ง", icon: Truck },
                  {
                    key: "returns",
                    label: "คืน/เปลี่ยนสินค้า",
                    icon: RotateCcw,
                  },
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setPolicyTab(tab.key as typeof policyTab)}
                      className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
                        policyTab === tab.key
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "border-primary/20 bg-background text-primary hover:border-primary/30 hover:bg-primary/10"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="rounded-2xl border border-primary/20 bg-background p-5 shadow-sm">
                {policyTab === "privacy" && (
                  <div className="space-y-4 text-sm text-muted-foreground">
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">
                        ความเป็นส่วนตัวและการใช้ข้อมูล
                      </h2>
                      <p className="mt-2">
                        Cacti Stock ให้ความสำคัญกับความเป็นส่วนตัวของลูกค้า
                        และจะใช้ข้อมูลส่วนบุคคลของท่านเพื่อวัตถุประสงค์ที่จำเป็น
                        ในการยืนยันคำสั่งซื้อ จัดส่งสินค้า
                        และดูแลบริการหลังการขาย
                      </p>
                    </div>
                    <ul className="space-y-2 pl-5 list-disc">
                      <li>
                        ชื่อ-นามสกุล อีเมล หมายเลขโทรศัพท์ ที่อยู่สำหรับจัดส่ง
                        และข้อมูลที่จำเป็นในการติดต่อ
                      </li>
                      <li>
                        ข้อมูลการสั่งซื้อ การชำระเงิน การยืนยันคำสั่งซื้อ
                        และประวัติการติดต่อกับร้าน
                      </li>
                      <li>
                        ข้อมูลที่จำเป็นเพื่อปฏิบัติตามกฎหมาย
                        รักษาความปลอดภัยของบัญชี
                        และอำนวยความสะดวกในการให้บริการอย่างมีประสิทธิภาพ
                      </li>
                    </ul>
                    <p>
                      ข้อมูลของลูกค้าจะถูกเก็บรักษาไว้เป็นความลับและจะไม่เปิดเผยต่อบุคคลที่สาม
                      โดยไม่ได้รับความยินยอมจากลูกค้าฝ่ายเดียว
                      เว้นแต่กรณีที่กฎหมายกำหนด
                      หรือจำเป็นเพื่อให้บริการตามคำสั่งซื้ออย่างครบถ้วน
                    </p>
                  </div>
                )}

                {policyTab === "orders" && (
                  <div className="space-y-4 text-sm text-muted-foreground">
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">
                        เงื่อนไขการสั่งซื้อและการชำระเงิน
                      </h2>
                      <p className="mt-2">
                        ลูกค้าต้องตรวจสอบความถูกต้องของสินค้า จำนวน ราคา
                        และข้อมูลการจัดส่งอย่างละเอียดก่อนยืนยันคำสั่งซื้อ
                      </p>
                    </div>
                    <ul className="space-y-2 pl-5 list-disc">
                      <li>
                        คำสั่งซื้อจะถือว่าถูกต้องและมีผลบังคับใช้เมื่อลูกค้ากดยืนยันคำสั่งซื้อ
                        และชำระเงินเรียบร้อยแล้ว
                      </li>
                      <li>
                        ร้านจะดำเนินการยืนยันคำสั่งซื้อผ่านช่องทางที่กำหนดไว้ในระบบ
                        และติดต่อกลับหากมีข้อมูลที่ต้องตรวจสอบเพิ่มเติม
                      </li>
                      <li>
                        หากลูกค้ามีข้อสงสัยหรือพบปัญหาเกี่ยวกับคำสั่งซื้อ
                        ควรติดต่อร้านโดยเร็วที่สุดเพื่อให้สามารถแก้ไขได้ทันท่วงที
                      </li>
                    </ul>
                    <p>
                      Cacti Stock ขอสงวนสิทธิ์ในการปฏิเสธ ยกเลิก
                      หรือระงับคำสั่งซื้อ หากตรวจพบข้อมูลไม่ครบถ้วน
                      ข้อมูลไม่ถูกต้อง หรือมีเหตุผลด้านความปลอดภัย
                      ของการให้บริการ
                    </p>
                  </div>
                )}

                {policyTab === "shipping" && (
                  <div className="space-y-4 text-sm text-muted-foreground">
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">
                        การจัดส่งและการรับสินค้า
                      </h2>
                      <p className="mt-2">
                        ร้านจะพยายามจัดส่งสินค้าให้ตรงตามช่วงเวลาที่แจ้งไว้
                        และอัปเดตสถานะคำสั่งซื้อให้ลูกค้าทราบอย่างต่อเนื่อง
                        เพื่อให้ลูกค้ามั่นใจในกระบวนการจัดส่ง
                      </p>
                    </div>
                    <ul className="space-y-2 pl-5 list-disc">
                      <li>
                        ลูกค้าต้องตรวจสอบที่อยู่จัดส่ง จำนวนสินค้า
                        และรายละเอียดคำสั่งซื้อ
                        ให้ถูกต้องครบถ้วนก่อนยืนยันการสั่งซื้อ
                      </li>
                      <li>
                        ค่าจัดส่งและระยะเวลาการจัดส่งอาจแตกต่างกันตามพื้นที่
                        ประเภทสินค้า และเงื่อนไขการขนส่งที่ร้านกำหนด
                      </li>
                      <li>
                        สินค้าบางประเภทเป็นพืชสดและอาจมีความแตกต่างเล็กน้อยตามธรรมชาติ
                        หลังจากการขนส่งหรือการเก็บรักษา
                      </li>
                    </ul>
                    <p>
                      หากสินค้าถึงปลายทางแล้วมีความเสียหาย ไม่ครบถ้วน
                      หรือไม่ตรงกับคำสั่งซื้อ
                      ลูกค้าควรแจ้งร้านโดยทันทีเพื่อให้ทางร้านดำเนินการตรวจสอบและแก้ไขต่อไป
                    </p>
                  </div>
                )}

                {policyTab === "returns" && (
                  <div className="space-y-4 text-sm text-muted-foreground">
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">
                        นโยบายคืนสินค้าและเปลี่ยนสินค้า
                      </h2>
                      <p className="mt-2">
                        หากสินค้าได้รับความเสียหาย ไม่ตรงกับคำสั่งซื้อ
                        หรือมีปัญหาที่ชัดเจนจากการตรวจสอบของร้าน Cacti Stock
                        จะพิจารณาช่วยเหลือและแก้ไขตามเงื่อนไขที่กำหนดไว้
                      </p>
                    </div>
                    <ul className="space-y-2 pl-5 list-disc">
                      <li>
                        ลูกค้าควรแจ้งปัญหาภายในระยะเวลาที่กำหนดหลังจากได้รับสินค้า
                        เพื่อให้ทางร้านสามารถตรวจสอบและพิจารณาต่อได้อย่างรวดเร็ว
                      </li>
                      <li>
                        ภาพประกอบ หลักฐานการรับสินค้า
                        หรือข้อมูลเพิ่มเติมที่เกี่ยวข้อง
                        จะช่วยให้การพิจารณาเป็นไปอย่างชัดเจนและเป็นธรรมมากขึ้น
                      </li>
                      <li>
                        ร้านจะพิจารณาทางเลือกในการแก้ไขตามความเหมาะสม เช่น
                        การเปลี่ยนสินค้า คืนเงิน หรือจัดเตรียมคำแนะนำเพิ่มเติม
                      </li>
                    </ul>
                    <p>
                      นโยบายนี้อาจมีการปรับเปลี่ยนตามสถานการณ์และเงื่อนไขการให้บริการจริง
                      โดยร้านจะแจ้งรายละเอียดให้ลูกค้าทราบอย่างชัดเจนหากมีการเปลี่ยนแปลงเกิดขึ้น
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4 text-sm text-primary">
                <p className="font-medium">ต้องการสอบถามข้อมูลเพิ่มเติม?</p>
                <p className="mt-1">
                  ติดต่อเราได้ที่อีเมล cactistockfiles@gmail.com หรือ LINE:
                  cactistockfiles
                </p>
              </div>
            </div>
          )}

          {activeSection === "help" && (
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <div className="mb-6 rounded-xl border border-primary/20 bg-primary/10 p-5">
                <h1 className="text-2xl font-semibold text-foreground">
                  ช่วยเหลือและคำถามที่พบบ่อย
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  หากคุณมีคำถามเกี่ยวกับการสั่งซื้อ การจัดส่ง สินค้า
                  หรือการดูแลกระบองเพชรหลังการรับสินค้า
                  เราได้จัดเตรียมข้อมูลที่เป็นประโยชน์ไว้ให้คุณด้านล่างนี้
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-primary/20 bg-background p-5">
                  <h2 className="text-lg font-semibold text-foreground">
                    คำถามที่พบบ่อย
                  </h2>
                  <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                    <div>
                      <p className="font-medium text-foreground">
                        1. วิธีการสั่งซื้อสินค้า?
                      </p>
                      <p className="mt-1">
                        ลูกค้าสามารถเลือกสินค้าในหน้าร้าน
                        แล้วดำเนินการชำระเงินผ่านช่องทางที่ระบุไว้ในระบบ
                        เมื่อชำระเงินเรียบร้อยแล้วร้านจะยืนยันคำสั่งซื้อและจัดส่งให้ต่อไป
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        2. ค่าจัดส่งและระยะเวลาส่งเป็นอย่างไร?
                      </p>
                      <p className="mt-1">
                        ระยะเวลาจัดส่งและค่าจัดส่งอาจแตกต่างกันตามพื้นที่และประเภทสินค้า
                        โดยร้านจะแจ้งรายละเอียดให้ทราบก่อนหรือหลังจากยืนยันคำสั่งซื้อ
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        3. สามารถคืนหรือเปลี่ยนสินค้าได้หรือไม่?
                      </p>
                      <p className="mt-1">
                        หากสินค้าได้รับความเสียหาย ไม่ตรงกับคำสั่งซื้อ
                        หรือมีปัญหาที่ชัดเจน
                        ร้านจะพิจารณาช่วยเหลือตามเงื่อนไขที่กำหนดไว้
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        4. สินค้าบางชนิดเป็นพืชสด จะมีปัญหาอะไรบ้าง?
                      </p>
                      <p className="mt-1">
                        สินค้าบางประเภทเป็นพืชสดและอาจมีความแตกต่างเล็กน้อยตามธรรมชาติหลังการขนส่ง
                        หากมีปัญหากรุณาแจ้งร้านโดยเร็วที่สุด
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-primary/20 bg-background p-5">
                  <h2 className="text-lg font-semibold text-foreground">
                    ช่องทางติดต่อเรา
                  </h2>
                  <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                    <div>
                      <p className="font-medium text-foreground">อีเมล</p>
                      <p className="mt-1">cactistockfiles@gmail.com</p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">LINE</p>
                      <p className="mt-1">cactistockfiles</p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        เวลาติดต่อที่แนะนำ
                      </p>
                      <p className="mt-1">
                        คุณสามารถติดต่อเราได้ทุกวัน เพื่อสอบถามข้อมูลคำสั่งซื้อ
                        การจัดส่ง หรือการดูแลสินค้า
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-primary/20 bg-background p-5">
                <h2 className="text-lg font-semibold text-foreground">
                  วิธีการรับความช่วยเหลือจากเรา
                </h2>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl border border-primary/10 bg-primary/5 p-4">
                    <p className="font-medium text-foreground">1. ระบุปัญหา</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      บอกรายละเอียดว่าคุณต้องการช่วยเหลือเรื่องอะไร เช่น
                      คำสั่งซื้อ การจัดส่ง หรือสินค้าที่ได้รับ
                    </p>
                  </div>
                  <div className="rounded-xl border border-primary/10 bg-primary/5 p-4">
                    <p className="font-medium text-foreground">2. ส่งหลักฐาน</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      หากเป็นกรณีสินค้าเสียหายหรือไม่ตรงคำสั่งซื้อ
                      กรุณาส่งภาพประกอบหรือข้อมูลเพิ่มเติมเพื่อช่วยให้เราตรวจสอบได้เร็วขึ้น
                    </p>
                  </div>
                  <div className="rounded-xl border border-primary/10 bg-primary/5 p-4">
                    <p className="font-medium text-foreground">
                      3. รอคำตอบจากทีมงาน
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      ทีมงานจะพิจารณาและติดต่อกลับโดยเร็วที่สุด
                      เพื่อให้คำแนะนำหรือแก้ไขตามความเหมาะสม
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4 text-sm text-primary">
                <p className="font-medium">คำแนะนำเพิ่มเติม</p>
                <p className="mt-1">
                  ก่อนติดต่อเรา กรุณารวบรวมข้อมูลคำสั่งซื้อและภาพประกอบของสินค้า
                  เพื่อให้การช่วยเหลือเป็นไปอย่างรวดเร็วและมีประสิทธิภาพมากขึ้น
                </p>
              </div>
            </div>
          )}

          {activeSection === "feedback" && (
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <div className="mb-6 rounded-xl border border-primary/20 bg-primary/10 p-5">
                <h1 className="text-2xl font-semibold text-foreground">
                  ให้ข้อเสนอแนะและความคิดเห็น
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  เราให้ความสำคัญกับความคิดเห็นของลูกค้าทุกท่าน
                  เพื่อพัฒนาประสบการณ์การซื้อขายและคุณภาพการให้บริการของ Cacti
                  Stock ให้ดียิ่งขึ้นในอนาคต
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-2xl border border-primary/20 bg-background p-5">
                  <h2 className="text-lg font-semibold text-foreground">
                    เราต้องการฟังคุณ
                  </h2>
                  <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                    <p>
                      หากคุณมีข้อเสนอแนะเกี่ยวกับเว็บไซต์สินค้า การสั่งซื้อ
                      การจัดส่ง หรือบริการของเรา
                      เราขอเชิญคุณแบ่งปันความคิดเห็นของคุณกับเรา
                    </p>
                    <p>
                      ข้อเสนอแนะของคุณจะช่วยให้เราเข้าใจความต้องการของลูกค้า
                      และพัฒนาเว็บไซต์และบริการให้ดียิ่งขึ้นต่อไป
                    </p>
                    <p>
                      ไม่ว่าคุณจะมีคำแนะนำสำหรับการใช้งานเว็บไซต์
                      หรือมีข้อกังวลเกี่ยวกับประสบการณ์การซื้อสินค้า
                      เรายินดีรับฟังทุกความคิดเห็น
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-primary/20 bg-background p-5">
                  <h2 className="text-lg font-semibold text-foreground">
                    ข้อมูลที่ควรระบุเมื่อส่งความคิดเห็น
                  </h2>
                  <ul className="mt-4 space-y-2 pl-5 text-sm text-muted-foreground list-disc">
                    <li>หัวข้อหรือประเด็นที่ต้องการสะท้อน</li>
                    <li>รายละเอียดของปัญหา หรือข้อเสนอแนะที่ต้องการ</li>
                    <li>ข้อมูลคำสั่งซื้อหากเกี่ยวข้องกับการซื้อสินค้า</li>
                    <li>ช่องทางติดต่อกลับที่คุณต้องการให้เราติดต่อ</li>
                  </ul>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-primary/20 bg-background p-5">
                <h2 className="text-lg font-semibold text-foreground">
                  ช่องทางส่งข้อเสนอแนะ
                </h2>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-primary/10 bg-primary/5 p-4">
                    <p className="font-medium text-foreground">อีเมล</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      cactistockfiles@gmail.com
                    </p>
                  </div>
                  <div className="rounded-xl border border-primary/10 bg-primary/5 p-4">
                    <p className="font-medium text-foreground">LINE</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      cactistockfiles
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  หากข้อเสนอแนะของคุณเกี่ยวข้องกับคำสั่งซื้อหรือการรับสินค้า
                  กรุณาระบุคำสั่งซื้อและรายละเอียดให้ครบถ้วนเพื่อให้เราดำเนินการตรวจสอบได้เร็วขึ้น
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editField === "displayName" && "แก้ไขชื่อ - สกุล"}
              {editField === "phone" && "แก้ไขเบอร์โทรศัพท์"}
              {editField === "taxId" && "แก้ไขเลขประจำตัวผู้เสียภาษี"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {editField === "displayName" ? (
              <div className="space-y-2">
                <Label>ชื่อ - สกุล</Label>
                <Input
                  placeholder="ชื่อ - สกุล"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                />
              </div>
            ) : editField === "phone" ? (
              <div className="space-y-2">
                <Label>เบอร์โทรศัพท์</Label>
                <Input
                  placeholder="เบอร์โทรศัพท์"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                />
              </div>
            ) : editField === "taxId" ? (
              <div className="space-y-2">
                <Label>เลขประจำตัวผู้เสียภาษี</Label>
                <Input
                  placeholder="เลขประจำตัวผู้เสียภาษี"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                />
              </div>
            ) : null}

            {errorMsg && <p className="text-sm text-destructive">{errorMsg}</p>}
            {successMsg && (
              <p className="text-sm text-green-600">{successMsg}</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleSaveEdit}>บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addressModalOpen} onOpenChange={setAddressModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {addressEditingId ? "แก้ไขที่อยู่" : "เพิ่มที่อยู่ใหม่"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>ป้ายชื่อที่อยู่</Label>
                <Input
                  placeholder="บ้าน / ที่ทำงาน / อื่นๆ"
                  value={addressForm.label}
                  onChange={(e) => handleAddressChange("label", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>ชื่อผู้รับ</Label>
                <Input
                  placeholder="ชื่อผู้รับ"
                  value={addressForm.recipient}
                  onChange={(e) =>
                    handleAddressChange("recipient", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>เบอร์โทรศัพท์</Label>
                <Input
                  placeholder="เบอร์โทรศัพท์"
                  value={addressForm.phone}
                  onChange={(e) => handleAddressChange("phone", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>ประเทศ</Label>
                <SearchableCombobox
                  options={countries}
                  value={addressForm.country || ""}
                  onValueChange={(value) => {
                    handleAddressChange("country", value);
                    handleAddressChange("province", "");
                    handleAddressChange("city", "");
                    handleAddressChange("district", "");
                    handleAddressChange("zipcode", "");
                  }}
                  placeholder="เลือกประเทศ"
                  searchPlaceholder="ค้นหาประเทศ..."
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>ที่อยู่</Label>
                <Input
                  placeholder="บ้านเลขที่, ซอย, ถนน"
                  value={addressForm.addressLine}
                  onChange={(e) =>
                    handleAddressChange("addressLine", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>จังหวัด</Label>
                {isThailandAddress ? (
                  <SearchableCombobox
                    options={provinces}
                    value={addressForm.province || ""}
                    onValueChange={(value) => {
                      handleAddressChange("province", value);
                      handleAddressChange("city", "");
                      handleAddressChange("district", "");
                      handleAddressChange("zipcode", "");
                    }}
                    placeholder="เลือกจังหวัด"
                    searchPlaceholder="ค้นหาจังหวัด..."
                  />
                ) : (
                  <Input
                    placeholder="ระบุจังหวัด/รัฐ"
                    value={addressForm.province || ""}
                    onChange={(e) =>
                      handleAddressChange("province", e.target.value)
                    }
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label>อำเภอ / เขต</Label>
                {isThailandAddress ? (
                  <SearchableCombobox
                    options={cities}
                    value={addressForm.city || ""}
                    onValueChange={(value) => {
                      handleAddressChange("city", value);
                      handleAddressChange("district", "");
                      handleAddressChange("zipcode", "");
                    }}
                    placeholder="เลือกอำเภอ / เขต"
                    searchPlaceholder="ค้นหาอำเภอ / เขต..."
                  />
                ) : (
                  <Input
                    placeholder="ระบุอำเภอ/เขต"
                    value={addressForm.city || ""}
                    onChange={(e) =>
                      handleAddressChange("city", e.target.value)
                    }
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label>ตำบล / แขวง</Label>
                {isThailandAddress ? (
                  <SearchableCombobox
                    options={subdistricts}
                    value={addressForm.district || ""}
                    onValueChange={(value) => {
                      handleAddressChange("district", value);
                      handleAddressChange("zipcode", "");
                    }}
                    placeholder="เลือกตำบล / แขวง"
                    searchPlaceholder="ค้นหาตำบล / แขวง..."
                    disabled={!addressForm.city || subdistricts.length === 0}
                  />
                ) : (
                  <Input
                    placeholder="ระบุตำบล/แขวง"
                    value={addressForm.district || ""}
                    onChange={(e) =>
                      handleAddressChange("district", e.target.value)
                    }
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label>รหัสไปรษณีย์</Label>
                {isThailandAddress ? (
                  <SearchableCombobox
                    options={zipcodes}
                    value={addressForm.zipcode || ""}
                    onValueChange={(value) =>
                      handleAddressChange("zipcode", value)
                    }
                    placeholder="เลือกหรือพิมพ์รหัสไปรษณีย์"
                    searchPlaceholder="ค้นหารหัสไปรษณีย์..."
                  />
                ) : (
                  <Input
                    placeholder="ระบุรหัสไปรษณีย์"
                    value={addressForm.zipcode || ""}
                    onChange={(e) =>
                      handleAddressChange("zipcode", e.target.value)
                    }
                  />
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="defaultAddress"
                  type="checkbox"
                  className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                  checked={Boolean(addressForm.isDefault)}
                  onChange={(e) =>
                    handleAddressChange("isDefault", e.target.checked)
                  }
                />
                <label htmlFor="defaultAddress" className="text-sm">
                  ตั้งเป็นที่อยู่เริ่มต้น
                </label>
              </div>
            </div>

            {errorMsg && <p className="text-sm text-destructive">{errorMsg}</p>}
            {successMsg && (
              <p className="text-sm text-green-600">{successMsg}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddressModalOpen(false)}
            >
              ยกเลิก
            </Button>
            <Button onClick={saveAddress}>บันทึกที่อยู่</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Change Modal */}
      <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>เปลี่ยนรหัสผ่าน</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>รหัสผ่านปัจจุบัน</Label>
              <Input
                type="password"
                placeholder="รหัสผ่านปัจจุบัน"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>รหัสผ่านใหม่</Label>
              <Input
                type="password"
                placeholder="รหัสผ่านใหม่"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>ยืนยันรหัสผ่านใหม่</Label>
              <Input
                type="password"
                placeholder="ยืนยันรหัสผ่านใหม่"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            {passwordErrorMsg && (
              <p className="text-sm text-destructive">{passwordErrorMsg}</p>
            )}
            {passwordSuccessMsg && (
              <p className="text-sm text-green-600">{passwordSuccessMsg}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPasswordModalOpen(false)}
            >
              ยกเลิก
            </Button>
            <Button onClick={handleChangePassword}>เปลี่ยนรหัสผ่าน</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
