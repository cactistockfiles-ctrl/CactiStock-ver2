import type { Metadata } from "next";
import "./globals.css";
import { siteUrl } from "@/lib/config";
import Loading from "@/components/Loading";
import { Suspense } from "react";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Cacti Stock - ร้านขายกระบองเพชรหายากคุณภาพสูง",
    template: "Cacti Stock | %s",
  },
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
  description:
    "Cacti Stock - ร้านขายกระบองเพชรหายากคุณภาพสูง รวบรวมสายพันธุ์แท้จากทั่วโลก ต้นไม้ทุกต้นผ่านการคัดเลือกและดูแลอย่างพิถีพิถัน พร้อมคำปรึกษาการดูแลฟรี",
  keywords:
    "กระบองเพชร, กระบองหายาก, ขายกระบองเพชร, ต้นกระบอง, cactus, สุกัด, ไม้กราฟ, ไม้เมล็ด, กระบองเพชรสะสมบูรณ์",
  openGraph: {
    type: "website",
    locale: "th_TH",
    url: siteUrl,
    title: "Cacti Stock - ร้านขายกระบองเพชรหายากคุณภาพสูง",
    description:
      "Cacti Stock - ร้านขายกระบองเพชรหายากคุณภาพสูง รวบรวมสายพันธุ์แท้จากทั่วโลก ต้นไม้ทุกต้นผ่านการคัดเลือกและดูแลอย่างพิถีพิถัน พร้อมคำปรึกษาการดูแลฟรี",
    siteName: "Cacti Stock",
    images: [
      {
        url: "/icon.png",
        width: 512,
        height: 512,
        alt: "Cacti Stock Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cacti Stock - ร้านขายกระบองเพชรหายากคุณภาพสูง",
    description:
      "Cacti Stock - ร้านขายกระบองเพชรหายากคุณภาพสูง รวบรวมสายพันธุ์แท้จากทั่วโลก ต้นไม้ทุกต้นผ่านการคัดเลือกและดูแลอย่างพิถีพิถัน พร้อมคำปรึกษาการดูแลฟรี",
    images: ["/icon.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Cacti Stock",
    description: "ร้านขายกระบองเพชรหายากคุณภาพสูง รวบรวมสายพันธุ์แท้จากทั่วโลก",
    url: siteUrl,
    email: "cactistockfiles@gmail.com",
    priceRange: "฿฿฿",
    image: `${siteUrl}/icon.png`,
  };

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://*.r2.dev" />
        <link rel="preconnect" href="https://*.r2.cloudflarestorage.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <Suspense fallback={<Loading />}>{children}</Suspense>
      </body>
    </html>
  );
}
