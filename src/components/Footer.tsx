"use client";

import Link from "next/link";
import { Instagram, Facebook, Youtube, MessageCircle } from "lucide-react";
import { useLocale } from "@/context/LocaleContext";
import { useState, useEffect } from "react";

interface AboutData {
  facebook?: string;
  showFacebook?: boolean;
  instagram?: string;
  showInstagram?: boolean;
  tiktok?: string;
  showTiktok?: boolean;
  youtube?: string;
  showYoutube?: boolean;
  contactLine?: string;
  showLine?: boolean;
  contactEmail?: string;
}

const Footer = () => {
  const { locale, t } = useLocale();
  const [aboutData, setAboutData] = useState<AboutData | null>(null);

  useEffect(() => {
    async function fetchAboutData() {
      try {
        const res = await fetch("/api/about");
        if (res.ok) {
          const data = await res.json();
          setAboutData(data);
        }
      } catch (error) {
        console.error("Error fetching about data:", error);
      }
    }
    fetchAboutData();
  }, []);

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
              <li>
                Email: {aboutData?.contactEmail || "cactistockfiles@gmail.com"}
              </li>
              {aboutData?.showLine && aboutData.contactLine && (
                <li>LINE: {aboutData.contactLine}</li>
              )}
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-display text-lg font-semibold">Follow Us</h4>
            <div className="flex gap-4">
              {aboutData?.showInstagram && aboutData.instagram && (
                <a
                  href={aboutData.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cactus-200 hover:text-cactus-50 transition-colors"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {aboutData?.showFacebook && aboutData.facebook && (
                <a
                  href={aboutData.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cactus-200 hover:text-cactus-50 transition-colors"
                >
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              {aboutData?.showYoutube && aboutData.youtube && (
                <a
                  href={aboutData.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cactus-200 hover:text-cactus-50 transition-colors"
                >
                  <Youtube className="h-5 w-5" />
                </a>
              )}
              {aboutData?.showTiktok && aboutData.tiktok && (
                <a
                  href={aboutData.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cactus-200 hover:text-cactus-50 transition-colors"
                >
                  <MessageCircle className="h-5 w-5" />
                </a>
              )}
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
