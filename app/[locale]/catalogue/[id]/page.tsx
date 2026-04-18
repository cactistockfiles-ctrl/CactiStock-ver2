import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCacti } from "@/lib/content-store";
import { LOCALES, isLocale, t } from "@/lib/i18n";
import {
  buildLocaleAlternates,
  canonicalFor,
  openGraphLocale,
  toAbsoluteUrl,
} from "@/lib/seo";
import { Locale } from "@/types/content";

interface Params {
  locale: string;
  id: string;
}

export async function generateStaticParams() {
  const cacti = await getCacti();
  return LOCALES.flatMap((locale) =>
    cacti.map((item) => ({ locale, id: item.id })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  if (!isLocale(params.locale)) {
    return {};
  }

  const locale = params.locale as Locale;
  const cacti = await getCacti();
  const cactus = cacti.find((x) => x.id === params.id);

  if (!cactus) {
    return {
      title: "Item not found",
      robots: { index: false, follow: false },
    };
  }

  const pathAfterLocale = `/catalogue/${cactus.id}`;
  const title = `${cactus.name} (${cactus.family})`;
  const description = `${t(locale, "catalogue.subtitle")} ${cactus.description}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalFor(locale, pathAfterLocale),
      languages: buildLocaleAlternates(pathAfterLocale),
    },
    openGraph: {
      title,
      description,
      type: "website",
      locale: openGraphLocale(locale),
      url: canonicalFor(locale, pathAfterLocale),
      images: [
        {
          url: cactus.images.top,
          alt: cactus.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [cactus.images.top],
    },
  };
}

export default async function CactusDetailPage({ params }: { params: Params }) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  const locale = params.locale as Locale;
  const cacti = await getCacti();
  const cactus = cacti.find((x) => x.id === params.id);

  if (!cactus) {
    notFound();
  }

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: cactus.nameTranslations?.[params.locale] || cactus.name,
    description:
      cactus.descriptionTranslations?.[params.locale] || cactus.description,
    image: [
      cactus.images.top,
      cactus.images.side1,
      cactus.images.side2,
      cactus.images.side3,
    ],
    sku: cactus.id,
    brand: { "@type": "Brand", name: "Cacti Stock" },
    offers: {
      "@type": "Offer",
      priceCurrency: "THB",
      price: cactus.price,
      availability: cactus.isSold
        ? "https://schema.org/SoldOut"
        : "https://schema.org/InStock",
      url: toAbsoluteUrl(`/${params.locale}/catalogue/${cactus.id}`),
    },
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="overflow-hidden rounded-lg border bg-card">
            <img
              src={cactus.images.top}
              alt={cactus.name}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              cactus.images.side1,
              cactus.images.side2,
              cactus.images.side3,
            ].map((src, idx) => (
              <div
                key={idx}
                className="overflow-hidden rounded-lg border bg-card"
              >
                <img
                  src={src}
                  alt={`${cactus.name} side ${idx + 1}`}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <h1 className="font-display text-4xl font-bold leading-tight">
              {cactus.nameTranslations?.[params.locale] || cactus.name}
            </h1>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{cactus.family}</Badge>
              <Badge variant="outline">
                {cactus.growType === "seed"
                  ? t(locale, "common.seed")
                  : t(locale, "common.graft")}
              </Badge>
              <Badge variant="outline">{cactus.sizeCm} cm</Badge>
            </div>
          </div>

          <p className="leading-relaxed text-foreground/80">
            {cactus.descriptionTranslations?.[params.locale] ||
              cactus.description}
          </p>

          <div className="flex items-center gap-4 border-t pt-5">
            <div className="font-display text-3xl font-bold text-primary">
              ฿{cactus.price.toLocaleString()}
            </div>
            {cactus.isSold && (
              <span className="text-sm font-semibold text-destructive">
                {t(locale, "catalogue.sold")}
              </span>
            )}
          </div>

          <Button asChild className="mt-2">
            <a href={`/${params.locale}/catalogue`}>
              {t(locale, "nav.catalogue")}
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
