"use client";

import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";

const Footer = () => {
  const { locale, t } = useLocale();

  return (
    <footer className="border-t bg-cactus-900 text-cactus-100">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <h3 className="font-display text-xl font-bold text-cactus-50">
              Cacti Stock
            </h3>
            <p className="mt-2 text-sm text-cactus-200">
              แหล่งรวมกระบองเพชรหายากคุณภาพสูง สำหรับนักสะสมตัวจริง
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-cactus-50">
              {t("footer.quickLinks")}
            </h4>
            <div className="mt-2 flex flex-col gap-1">
              <Link
                href={`/${locale}/catalogue`}
                className="text-sm text-cactus-200 hover:text-cactus-50 transition-colors"
              >
                {t("nav.catalogue")}
              </Link>
              <Link
                href={`/${locale}/about`}
                className="text-sm text-cactus-200 hover:text-cactus-50 transition-colors"
              >
                {t("nav.about")}
              </Link>
              <Link
                href={`/${locale}/blog`}
                className="text-sm text-cactus-200 hover:text-cactus-50 transition-colors"
              >
                {t("nav.blog")}
              </Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-cactus-50">
              {t("footer.contact")}
            </h4>
            <p className="mt-2 text-sm text-cactus-200">
              cactistockfiles@gmail.com
            </p>
          </div>
        </div>
        <div className="mt-8 border-t border-cactus-700 pt-4 text-center text-xs text-cactus-200">
          {t("footer.copyright")}
          <div className="mt-2">
            <Link
              href="/admin/login"
              className="text-[11px] text-cactus-300 hover:text-cactus-100 transition-colors"
            >
              {t("footer.adminLogin")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
