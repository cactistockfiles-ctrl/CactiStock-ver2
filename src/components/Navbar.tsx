"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ShoppingCart, Menu, X } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useLocale } from "@/context/LocaleContext";
import { useUser } from "@/context/UserContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useState } from "react";
import logo from "@/assets/logo.png";

const Navbar = () => {
  const { totalItems } = useCart();
  const pathname = usePathname();
  const { locale, t } = useLocale();
  const { user, isAuthenticated, logout } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const links = [
    { to: `/${locale}`, label: t("nav.home") },
    { to: `/${locale}/catalogue`, label: t("nav.catalogue") },
    { to: `/${locale}/about`, label: t("nav.about") },
    { to: `/${locale}/blog`, label: t("nav.blog") },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-card/100 backdrop-blur-md">
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

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <Link
              key={link.to}
              href={link.to}
              className={`text-sm transition-colors hover:text-primary ${
                pathname === link.to
                  ? "font-bold text-primary"
                  : "font-medium text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <Link
            href={`/${locale}/cart`}
            className="relative flex items-center justify-center rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 w-10 h-10 md:px-4 md:py-2 md:w-auto md:h-auto md:gap-2"
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden md:inline">{t("nav.cart")}</span>
            {totalItems > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                {totalItems}
              </span>
            )}
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                href={`/${locale}/profile`}
                className="hidden md:inline rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
              >
                {user?.displayName || user?.email}
              </Link>
              <button
                type="button"
                className="hidden md:inline rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
                onClick={logout}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href={`/${locale}/login`}
                className="hidden md:inline rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
              >
                Login
              </Link>
              <Link
                href={`/${locale}/register`}
                className="hidden md:inline rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Register
              </Link>
            </>
          )}

          <div className="hidden md:flex">
            <LanguageSwitcher locale={locale} />
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg hover:bg-muted transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-card p-4">
          <div className="flex flex-col gap-4">
            {links.map((link) => (
              <Link
                key={link.to}
                href={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`text-sm transition-colors hover:text-primary ${
                  pathname === link.to
                    ? "font-bold text-primary"
                    : "font-medium text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex flex-col gap-3 pt-4 border-t">
              {isAuthenticated ? (
                <>
                  <Link
                    href={`/${locale}/profile`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-sm font-medium text-muted-foreground hover:text-primary"
                  >
                    {user?.displayName || user?.email}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="text-left text-sm font-medium text-muted-foreground hover:text-primary"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href={`/${locale}/login`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-sm font-medium text-muted-foreground hover:text-primary"
                  >
                    Login
                  </Link>
                  <Link
                    href={`/${locale}/register`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-sm font-medium text-muted-foreground hover:text-primary"
                  >
                    Register
                  </Link>
                </>
              )}
              <div className="flex items-center gap-2">
                <LanguageSwitcher locale={locale} />
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
