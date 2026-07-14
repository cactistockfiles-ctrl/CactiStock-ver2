"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/sonner";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() || "/admin";
  const [open, setOpen] = useState(false);

  const items = [
    {
      key: "notifications",
      label: "Notification",
      href: "/admin/notifications",
    },
    { key: "heroes", label: "Hero", href: "/admin/heroes" },
    { key: "catalogue", label: "Catalogue", href: "/admin/catalogue" },
    { key: "blogs", label: "Blog", href: "/admin/blogs" },
    { key: "news", label: "News", href: "/admin/news" },
    { key: "orders", label: "Orders", href: "/admin/orders" },
    {
      key: "dragonRates",
      label: "Dragon Rates",
      href: "/admin/dragon-courier-rates",
    },
    { key: "info", label: "About", href: "/admin/info" },
    { key: "sold", label: "Update Status", href: "/admin/sold" },
    {
      key: "paymentApproval",
      label: "Payment Approval",
      href: "/admin/payment-approval",
    },
    {
      key: "packingSettings",
      label: "Packing Settings",
      href: "/admin/packing-settings",
    },
  ];

  const [pendingCount, setPendingCount] = useState(0);
  const knownIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let first = true;
    let cancelled = false;

    async function fetchNotifications() {
      try {
        const res = await fetch("/api/admin/bank-transfer-notifications", {
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        const orders = data.orders || [];
        const ids = new Set<string>(orders.map((o: any) => o.id));

        setPendingCount(data.count || ids.size);

        if (first) {
          // initialize known IDs without toasting
          knownIdsRef.current = ids;
          first = false;
          return;
        }

        // detect new ids
        for (const o of orders) {
          if (!knownIdsRef.current.has(o.id)) {
            knownIdsRef.current.add(o.id);
            const time = o.createdAt
              ? new Date(o.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "";
            toast(
              `กรุณาตรวจสอบการชำระเงิน ${time} จาก ${o.contactName || o.contactEmail || "ลูกค้า"}`,
            );
          }
        }
      } catch (err) {
        // ignore polling errors
        console.warn("Notification poll failed", err);
      }
    }

    fetchNotifications();
    const id = setInterval(() => {
      if (!cancelled) fetchNotifications();
    }, 10000);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="md:flex">
        {/* Sidebar for md+ */}
        <aside className="hidden md:flex md:flex-col w-64 border-r p-6 bg-card/50 sticky top-0 h-screen">
          <div className="mb-6">
            <h2 className="text-2xl font-display font-bold">Admin</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Manage site content
            </p>
          </div>
          <nav className="flex-1 space-y-1">
            {items.map((it) => (
              <Link
                key={it.key}
                href={it.href}
                className={`block px-3 py-2 rounded-md transition-colors ${pathname.startsWith(it.href) ? "bg-cactus-100 text-cactus-900 font-semibold" : "text-muted-foreground hover:bg-cactus-50"}`}
              >
                <div className="flex items-center justify-between">
                  <span>{it.label}</span>
                  {it.key === "notifications" && pendingCount > 0 && (
                    <Badge variant="default">{pendingCount}</Badge>
                  )}
                </div>
              </Link>
            ))}
          </nav>
          <div className="mt-6 text-xs text-muted-foreground">
            Logged in as Admin
          </div>
        </aside>

        <div className="flex-1">
          {/* Top bar for small screens */}
          <div className="md:hidden flex items-center justify-between p-3 border-b bg-background/90 backdrop-blur-sm">
            <div>
              <h2 className="text-lg font-semibold">Admin</h2>
              <p className="text-sm text-muted-foreground">
                Use the menu to switch sections
              </p>
            </div>
            <button
              onClick={() => setOpen((s) => !s)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border bg-card text-foreground transition hover:border-primary/50 hover:bg-primary/5"
            >
              <Menu />
            </button>
          </div>

          {open && (
            <div className="md:hidden p-3 border-b bg-card shadow-sm">
              <nav className="flex flex-wrap gap-2">
                {items.map((it) => (
                  <Link
                    key={it.key}
                    href={it.href}
                    className={`px-3 py-2 rounded-2xl whitespace-nowrap transition ${pathname.startsWith(it.href) ? "bg-cactus-100 text-cactus-900 font-semibold" : "bg-muted/30 text-muted-foreground hover:bg-cactus-50"}`}
                    onClick={() => setOpen(false)}
                  >
                    <div className="flex items-center gap-2">
                      <span>{it.label}</span>
                      {it.key === "notifications" && pendingCount > 0 && (
                        <Badge variant="default">{pendingCount}</Badge>
                      )}
                    </div>
                  </Link>
                ))}
              </nav>
            </div>
          )}

          <main className="p-4">
            <div className="mx-auto max-w-full md:max-w-7xl rounded-3xl bg-background/80 p-0 shadow-none">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
