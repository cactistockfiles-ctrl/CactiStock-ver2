import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:7400";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Cacti stock",
    template: "Cacti stock | %s",
  },
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
  description:
    "Rare cactus collection marketplace with single-piece collector items.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://*.r2.dev" />
        <link rel="preconnect" href="https://*.r2.cloudflarestorage.com" />
      </head>
      <body>{children}</body>
    </html>
  );
}
