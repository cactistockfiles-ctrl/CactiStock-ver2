import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getNews } from "@/lib/content-store";
import { LOCALES, isLocale } from "@/lib/i18n";
import {
  buildLocaleAlternates,
  canonicalFor,
  openGraphLocale,
} from "@/lib/seo";
import { Locale } from "@/types/content";

interface Params {
  locale: string;
  id: string;
}

const localeDescription: Record<Locale, string> = {
  th: "ข่าวสารล่าสุดจาก Cacti Stock",
  en: "Latest updates from Cacti Stock.",
  zh: "Cacti Stock 最新新闻。",
  id: "Pembaruan terbaru dari Cacti Stock.",
};

export async function generateStaticParams() {
  const news = await getNews();
  return LOCALES.flatMap((locale) =>
    news.map((item) => ({ locale, id: item.id })),
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
  const news = await getNews();
  const item = news.find((x) => x.id === params.id);

  if (!item) {
    return {
      title: "News not found",
      robots: { index: false, follow: false },
    };
  }

  const pathAfterLocale = `/news/${item.id}`;
  const description = `${localeDescription[locale]} ${item.title}`;

  return {
    title: item.title,
    description,
    alternates: {
      canonical: canonicalFor(locale, pathAfterLocale),
      languages: buildLocaleAlternates(pathAfterLocale),
    },
    openGraph: {
      title: item.title,
      description,
      type: "article",
      locale: openGraphLocale(locale),
      url: canonicalFor(locale, pathAfterLocale),
      images: [
        {
          url: item.coverImage,
          alt: item.title,
        },
      ],
    },
  };
}

export default async function NewsDetailPage({ params }: { params: Params }) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  const news = await getNews();
  const item = news.find((x) => x.id === params.id);

  if (!item) {
    notFound();
  }

  return (
    <article className="container mx-auto max-w-4xl px-4 py-12">
      <div className="mb-4">
        <Link
          href={`/${params.locale}`}
          className="inline-flex items-center text-sm font-medium text-primary hover:underline"
        >
          Back to Home
        </Link>
      </div>

      <div className="aspect-square w-full overflow-hidden rounded-xl border bg-card">
        <img
          src={item.coverImage}
          alt={item.title}
          className="h-full w-full object-cover"
        />
      </div>

      <h1 className="mt-6 font-display text-4xl font-bold leading-tight">
        {item.title}
      </h1>

      <div className="prose prose-stone mt-6 max-w-none text-foreground/90">
        <p>{item.content}</p>
      </div>

      {item.gallery.length > 0 && (
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {item.gallery.slice(0, 8).map((img, idx) => (
            <div
              key={idx}
              className="overflow-hidden rounded-lg border bg-card"
            >
              <img
                src={img}
                alt={`${item.title} image ${idx + 1}`}
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
