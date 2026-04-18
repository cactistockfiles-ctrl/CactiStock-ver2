import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AppProviders from "@/components/providers/AppProviders";
import { LocaleProvider } from "@/context/LocaleContext";
import { isLocale } from "@/lib/i18n";
import { siteUrl } from "@/lib/config";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  return {
    alternates: {
      canonical: `${siteUrl}/${params.locale}`,
    },
  };
}

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  return (
    <AppProviders>
      <LocaleProvider locale={params.locale}>
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </LocaleProvider>
    </AppProviders>
  );
}
