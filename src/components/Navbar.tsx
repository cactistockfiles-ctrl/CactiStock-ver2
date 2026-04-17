"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useLocale } from "@/context/LocaleContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import logo from "@/assets/logo.png";

const Navbar = () => {
  const { totalItems } = useCart();
  const pathname = usePathname();
  const { locale, t } = useLocale();

  const links = [
    { to: `/${locale}`, label: t("nav.home") },
    { to: `/${locale}/catalogue`, label: t("nav.catalogue") },
    { to: `/${locale}/about`, label: t("nav.about") },
    { to: `/${locale}/blog`, label: t("nav.blog") },
  ];

  return (
    <nav className="absolute top-0 left-0 right-0 z-50 border-b bg-card/100 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href={`/${locale}`} className="flex items-center gap-2">
          <Image
            src={logo}
            alt="Cacti Stock"
            width={40}
            height={40}
            className="h-10 w-10"
            priority
          />
          <span className="font-display text-xl font-bold text-primary">
            Cacti Stock
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <Link
              key={link.to}
              href={link.to}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === link.to ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <Link
            href={`/${locale}/cart`}
            className="relative flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">{t("nav.cart")}</span>
            {totalItems > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                {totalItems}
              </span>
            )}
          </Link>
          <LanguageSwitcher locale={locale} />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
