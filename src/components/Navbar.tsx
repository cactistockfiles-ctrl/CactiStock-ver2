"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ShoppingCart, Menu, X } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useLocale } from "@/context/LocaleContext";
import { useUser } from "@/context/UserContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { localeLabels, LOCALES } from "@/lib/i18n";
import logo from "@/assets/logo.png";

const Navbar = () => {
  const { totalItems } = useCart();
  const pathname = usePathname();
  const router = useRouter();
  const { locale, t } = useLocale();
  const { user, isAuthenticated, logout } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const changeLocale = (targetLocale: (typeof LOCALES)[number]) => {
    const parts = pathname?.split("/") || [];
    if (parts.length < 2) {
      router.push(`/${targetLocale}`);
      return;
    }

    parts[1] = targetLocale;
    router.push(parts.join("/"));
  };

  const profileInitials = user?.displayName
    ? user.displayName
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : user?.email?.charAt(0).toUpperCase() || "";

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
            width={128}
            height={128}
            className="h-62 w-62"
            priority
          />
          {/* <span className="font-display text-xl font-bold text-primary">
            Cacti Stock
          </span> */}
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
          {isAuthenticated ? (
            <Link
              href={`/${locale}/cart`}
              className="relative flex h-12 w-12 items-center justify-center rounded-full text-cactus-700 transition duration-200 ease-in-out hover:bg-cactus-100 hover:text-cactus-900"
              aria-label={t("nav.cart")}
            >
              <ShoppingCart className="h-6 w-6" />
              {totalItems > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-cactus-700 text-[10px] font-bold leading-none text-center text-white shadow-sm ring-2 ring-white">
                  {totalItems}
                </span>
              )}
            </Link>
          ) : null}

          {isAuthenticated ? (
            <div className="hidden md:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-input bg-background text-sm font-medium text-muted-foreground transition-colors hover:bg-muted focus:outline-none"
                    aria-label="Open profile menu"
                  >
                    <Avatar className="h-10 w-10">
                      {user?.avatarUrl ? (
                        <AvatarImage
                          src={user.avatarUrl}
                          alt={user.displayName || user.email || "User avatar"}
                        />
                      ) : null}
                      <AvatarFallback>{profileInitials}</AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  sideOffset={8}
                  className="w-64"
                >
                  <div className="px-4 py-3">
                    <p className="text-sm font-semibold text-foreground">
                      {user?.displayName || user?.email}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={`/${locale}/profile`} className="w-full">
                      {t("nav.profile")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-white data-[state=open]:text-white">
                      Language
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-56">
                      {LOCALES.map((lang) => (
                        <DropdownMenuItem
                          key={lang}
                          onSelect={() => changeLocale(lang)}
                          className={
                            lang === locale
                              ? "font-semibold text-foreground"
                              : "text-muted-foreground"
                          }
                        >
                          {localeLabels[lang]}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => {
                      logout();
                    }}
                  >
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <>
              <Link
                href={`/${locale}/login`}
                className="hidden md:inline rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
              >
                Login
              </Link>
              <div className="hidden md:flex">
                <LanguageSwitcher locale={locale} />
              </div>
            </>
          )}

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
      <div
        className={`md:hidden absolute right-0 top-full z-40 w-[80vw] overflow-hidden border-t bg-card shadow-lg transition-all duration-300 ease-in-out ${
          mobileMenuOpen
            ? "max-h-[1000px] opacity-100"
            : "max-h-0 opacity-0 pointer-events-none"
        }`}
      >
        <div
          className={`flex flex-col gap-4 ${mobileMenuOpen ? "p-4" : "p-0"}`}
        >
          {isAuthenticated && (
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                router.push(`/${locale}/profile`);
              }}
              className="flex items-center gap-3 text-left"
            >
              <Avatar className="h-12 w-12">
                {user?.avatarUrl ? (
                  <AvatarImage
                    src={user.avatarUrl}
                    alt={user.displayName || user.email || "User avatar"}
                  />
                ) : null}
                <AvatarFallback>{profileInitials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {user?.displayName || user?.email}
                </p>
              </div>
            </button>
          )}
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
              <LanguageSwitcher
                locale={locale}
                disableBorder
                triggerClassName="w-auto px-0 py-0 text-sm text-muted-foreground hover:text-primary"
              />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
