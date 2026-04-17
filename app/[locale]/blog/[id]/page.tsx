import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBlogs } from "@/lib/content-store";
import { LOCALES, isLocale } from "@/lib/i18n";
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

const localeDescription: Record<Locale, string> = {
  th: "บทความเกี่ยวกับการเลี้ยงและสะสมแคคตัส",
  en: "Cactus care and collecting insights.",
  zh: "关于仙人掌养护与收藏的文章。",
  id: "Artikel tentang perawatan dan koleksi kaktus.",
};

export async function generateStaticParams() {
  const blogs = await getBlogs();
  return LOCALES.flatMap((locale) =>
    blogs.map((post) => ({ locale, id: post.id })),
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
  const posts = await getBlogs();
  const post = posts.find((x) => x.id === params.id);

  if (!post) {
    return {
      title: "Article not found",
      robots: { index: false, follow: false },
    };
  }

  const pathAfterLocale = `/blog/${post.id}`;
  const title = post.title;
  const description = `${localeDescription[locale]} ${post.excerpt}`;

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
      type: "article",
      locale: openGraphLocale(locale),
      url: canonicalFor(locale, pathAfterLocale),
      publishedTime: post.createdAt,
      images: [
        {
          url: post.coverImage,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [post.coverImage],
    },
  };
}

export default async function BlogDetailPage({ params }: { params: Params }) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  const posts = await getBlogs();
  const post = posts.find((x) => x.id === params.id);

  if (!post) {
    notFound();
  }

  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: [post.coverImage, ...post.gallery],
    datePublished: post.createdAt,
    dateModified: post.createdAt,
    author: {
      "@type": "Organization",
      name: "Cacti Stock",
    },
    publisher: {
      "@type": "Organization",
      name: "Cacti Stock",
    },
    mainEntityOfPage: toAbsoluteUrl(`/${params.locale}/blog/${post.id}`),
  };

  return (
    <article className="container mx-auto max-w-4xl px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <p className="text-sm text-muted-foreground">
        {new Date(post.createdAt).toLocaleDateString()}
      </p>
      <h1 className="mt-2 font-display text-4xl font-bold leading-tight">
        {post.title}
      </h1>
      <p className="mt-3 text-lg text-muted-foreground">{post.excerpt}</p>

      <div className="mt-8 overflow-hidden rounded-lg border bg-card">
        <img
          src={post.coverImage}
          alt={post.title}
          className="h-full w-full object-cover"
        />
      </div>

      <div className="prose prose-stone mt-8 max-w-none text-foreground/90">
        <p>{post.content}</p>
      </div>

      {post.gallery.length > 0 && (
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {post.gallery.slice(0, 8).map((img, idx) => (
            <div
              key={idx}
              className="overflow-hidden rounded-lg border bg-card"
            >
              <img
                src={img}
                alt={`${post.title} image ${idx + 1}`}
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
