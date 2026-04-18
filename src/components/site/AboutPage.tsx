"use client";

import { useLocale } from "@/context/LocaleContext";
import { useEffect, useState } from "react";

interface AboutData {
  whoWeAre: string;
  whoWeAreDesc: string;
  ourMission: string;
  ourMissionDesc: string;
  step1Title: string;
  step1Desc: string;
  step2Title: string;
  step2Desc: string;
  step3Title: string;
  step3Desc: string;
  contactEmail: string;
  contactLine: string;
  showLine: boolean;
  additionalInfo: string;
  whoWeAreTranslations?: Record<string, string>;
  whoWeAreDescTranslations?: Record<string, string>;
  ourMissionTranslations?: Record<string, string>;
  ourMissionDescTranslations?: Record<string, string>;
  step1TitleTranslations?: Record<string, string>;
  step1DescTranslations?: Record<string, string>;
  step2TitleTranslations?: Record<string, string>;
  step2DescTranslations?: Record<string, string>;
  step3TitleTranslations?: Record<string, string>;
  step3DescTranslations?: Record<string, string>;
  additionalInfoTranslations?: Record<string, string>;
  facebook: string;
  showFacebook: boolean;
  instagram: string;
  showInstagram: boolean;
  tiktok: string;
  showTiktok: boolean;
  youtube: string;
  showYoutube: boolean;
}

function toAssetUrl(value: string | { src: string }) {
  return typeof value === "string" ? value : value.src;
}

export default function AboutPage() {
  const { t, locale } = useLocale();
  const [aboutData, setAboutData] = useState<AboutData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAboutData() {
      try {
        const res = await fetch("/api/about");
        if (res.ok) {
          const data = await res.json();
          setAboutData(data);
        }
      } catch (error) {
        console.error("Error loading about data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadAboutData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  const whoWeAre =
    aboutData?.whoWeAreTranslations?.[locale] ||
    aboutData?.whoWeAre ||
    t("about.whoWeAre");
  const whoWeAreDesc =
    aboutData?.whoWeAreDescTranslations?.[locale] ||
    aboutData?.whoWeAreDesc ||
    t("about.whoWeAreDesc");
  const ourMission =
    aboutData?.ourMissionTranslations?.[locale] ||
    aboutData?.ourMission ||
    t("about.ourMission");
  const ourMissionDesc =
    aboutData?.ourMissionDescTranslations?.[locale] ||
    aboutData?.ourMissionDesc ||
    t("about.ourMissionDesc");
  const step1Title =
    aboutData?.step1TitleTranslations?.[locale] ||
    aboutData?.step1Title ||
    t("about.step1Title");
  const step1Desc =
    aboutData?.step1DescTranslations?.[locale] ||
    aboutData?.step1Desc ||
    t("about.step1Desc");
  const step2Title =
    aboutData?.step2TitleTranslations?.[locale] ||
    aboutData?.step2Title ||
    t("about.step2Title");
  const step2Desc =
    aboutData?.step2DescTranslations?.[locale] ||
    aboutData?.step2Desc ||
    t("about.step2Desc");
  const step3Title =
    aboutData?.step3TitleTranslations?.[locale] ||
    aboutData?.step3Title ||
    t("about.step3Title");
  const step3Desc =
    aboutData?.step3DescTranslations?.[locale] ||
    aboutData?.step3Desc ||
    t("about.step3Desc");
  const contactEmail = aboutData?.contactEmail || "cactistockfiles@gmail.com";
  const contactLine = aboutData?.contactLine || "cactistockfiles";
  const showLine = aboutData?.showLine !== false;
  const additionalInfo =
    aboutData?.additionalInfoTranslations?.[locale] ||
    aboutData?.additionalInfo;
  const facebook = aboutData?.facebook || "";
  const showFacebook = aboutData?.showFacebook || false;
  const instagram = aboutData?.instagram || "";
  const showInstagram = aboutData?.showInstagram || false;
  const tiktok = aboutData?.tiktok || "";
  const showTiktok = aboutData?.showTiktok || false;
  const youtube = aboutData?.youtube || "";
  const showYoutube = aboutData?.showYoutube || false;

  return (
    <div>
      <section className="relative h-64 overflow-hidden pt-16 bg-cactus-900">
        <div className="absolute inset-0 bg-cactus-900/70 flex items-center justify-center">
          <h1 className="font-display text-4xl font-bold text-cactus-50">
            {t("about.title")}
          </h1>
        </div>
      </section>

      <div className="container mx-auto max-w-3xl px-4 py-16 space-y-8 text-center md:text-left">
        <div className="space-y-4">
          <h2 className="font-display text-2xl font-bold">{whoWeAre}</h2>
          <p className="text-foreground/80 leading-relaxed whitespace-pre-line">
            {whoWeAreDesc}
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="font-display text-2xl font-bold">{ourMission}</h2>
          <p className="text-foreground/80 leading-relaxed whitespace-pre-line">
            {ourMissionDesc}
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="font-display text-2xl font-bold">
            {t("about.howToOrder")}
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                step: "1",
                title: step1Title,
                desc: step1Desc,
              },
              {
                step: "2",
                title: step2Title,
                desc: step2Desc,
              },
              {
                step: "3",
                title: step3Title,
                desc: step3Desc,
              },
            ].map((s) => (
              <div
                key={s.step}
                className="rounded-lg border bg-card p-6 text-center"
              >
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  {s.step}
                </div>
                <h3 className="font-display font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground whitespace-pre-line">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg bg-cactus-50 p-6 text-center">
          <h3 className="font-display text-lg font-semibold">
            {t("about.contactUs")}
          </h3>
          <p className="mt-1 text-muted-foreground">
            {t("about.email")}: {contactEmail}
          </p>
          {showLine && (
            <p className="mt-1 text-muted-foreground">LINE: {contactLine}</p>
          )}

          {(showFacebook && facebook) ||
          (showInstagram && instagram) ||
          (showTiktok && tiktok) ||
          (showYoutube && youtube) ? (
            <div className="mt-4 flex justify-center gap-4">
              {showFacebook && facebook && (
                <a
                  href={facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
              )}
              {showInstagram && instagram && (
                <a
                  href={instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
              )}
              {showTiktok && tiktok && (
                <a
                  href={tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-2.8-3.65-2.35-5.92.44-2.37 2.15-4.35 4.42-4.87 1.63-.36 3.34-.15 4.88.54.03-.93.06-1.86.09-2.79-2.25.97-4.78.71-6.58-1.03-1.35-1.22-1.94-3.02-1.69-4.87.23-1.76 1.32-3.32 3.02-3.91 1.34-.48 2.81-.42 4.12.14.03-.9.06-1.8.09-2.7-2.67-1.1-5.7-.91-7.93.56-2.36 1.51-3.97 4.24-3.87 7.06.1 2.8 1.95 5.31 4.52 6.16 2.58.86 5.5.32 7.5-1.3 1.79-1.45 2.67-3.68 2.35-5.92-.29-2.05-1.69-3.83-3.6-4.47-1.94-.65-4.15-.46-5.93.52-.02.94-.05 1.87-.07 2.81 1.49-.56 3.11-.72 4.65-.13 1.56.6 2.53 2.15 2.39 3.82-.13 1.62-1.46 2.96-3.07 3.11-1.57.15-3.16-.34-4.3-1.45-1.12-1.09-1.46-2.71-1.32-4.25.13-1.5 1.12-2.81 2.55-3.3 1.41-.48 2.98-.27 4.22.49.02-.94.05-1.88.07-2.82-2.15-1.1-4.72-.89-6.56.55-2.39 1.48-4.02 4.18-3.9 6.95.12 2.74 1.94 5.19 4.45 6.02 2.53.84 5.37.32 7.32-1.26 1.74-1.57 2.58-3.88 2.25-6.12-.31-2.16-1.63-4.03-3.56-4.69z" />
                  </svg>
                </a>
              )}
              {showYoutube && youtube && (
                <a
                  href={youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>
              )}
            </div>
          ) : null}
        </div>

        {additionalInfo && (
          <div className="rounded-lg border bg-card p-6">
            <h3 className="font-display text-lg font-semibold mb-4">
              {t("about.contactUs")}
            </h3>
            <p className="text-foreground/80 leading-relaxed whitespace-pre-line">
              {additionalInfo}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
