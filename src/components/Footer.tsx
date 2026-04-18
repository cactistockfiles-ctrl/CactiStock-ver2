"use client";

import Link from "next/link";
import { Instagram, Facebook, Twitter } from "lucide-react";
import { useLocale } from "@/context/LocaleContext";

const Footer = () => {
  const { locale, t } = useLocale();

  return (
    <footer className="bg-cactus-900 text-cactus-50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <h3 className="font-display text-2xl font-bold">Cacti Stock</h3>
            <p className="mt-2 text-sm text-cactus-200">
              {t("footer.description")}
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-display text-lg font-semibold">
              {t("footer.quickLinks")}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href={`/${locale}/catalogue`}
                  className="text-cactus-200 hover:text-cactus-50 transition-colors"
                >
                  {t("nav.catalogue")}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/about`}
                  className="text-cactus-200 hover:text-cactus-50 transition-colors"
                >
                  {t("nav.about")}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/blog`}
                  className="text-cactus-200 hover:text-cactus-50 transition-colors"
                >
                  {t("nav.blog")}
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-display text-lg font-semibold">
              {t("footer.contact")}
            </h4>
            <ul className="space-y-2 text-sm text-cactus-200">
              <li>Email: cactistockfiles@gmail.com</li>
              <li>LINE: cactistockfiles</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-display text-lg font-semibold">Follow Us</h4>
            <div className="flex gap-4">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cactus-200 hover:text-cactus-50 transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cactus-200 hover:text-cactus-50 transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cactus-200 hover:text-cactus-50 transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-cactus-800 pt-8 text-center text-sm text-cactus-300">
          <p>{t("footer.copyright")}</p>
          <p className="mt-2">
            <Link
              href="/admin/login"
              className="text-cactus-400 hover:text-cactus-50 transition-colors"
            >
              {t("footer.adminLogin")}
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
