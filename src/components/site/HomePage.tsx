"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ChevronDown, Leaf, Shield, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import CactusCard from "@/components/CactusCard";
import CactusDetailModal from "@/components/CactusDetailModal";
import Loading from "@/components/Loading";
import { useLocale } from "@/context/LocaleContext";
import { BlogPost, CactusItem, HeroItem, NewsItem } from "@/types/content";

function toAssetUrl(value: string | { src: string }) {
  return typeof value === "string" ? value : value.src;
}

function toLocaleHref(href: unknown, locale: string, fallback: string) {
  if (typeof href !== "string" || !href.trim()) {
    return fallback;
  }

  if (/^https?:\/\//i.test(href)) {
    return href;
  }

  if (href.startsWith(`/${locale}/`) || href === `/${locale}`) {
    return href;
  }

  if (href.startsWith("/")) {
    return `/${locale}${href}`;
  }

  return href;
}

const fetcher = async (url: string) => {
  const res = await fetch(url, { cache: "no-store" });
  return res.json();
};

export default function HomePage() {
  const { locale, t } = useLocale();
  const [selectedCactus, setSelectedCactus] = useState<CactusItem | null>(null);
  const [heroIndex, setHeroIndex] = useState(0);
  const [textOpacity, setTextOpacity] = useState(1);

  const { data: cacti = [] } = useQuery<CactusItem[]>({
    queryKey: ["cacti"],
    queryFn: () => fetcher("/api/public/cacti"),
  });
  const { data: blogs = [] } = useQuery<BlogPost[]>({
    queryKey: ["blogs"],
    queryFn: () => fetcher("/api/public/blogs"),
  });
  const { data: heroes = [] } = useQuery<HeroItem[]>({
    queryKey: ["heroes"],
    queryFn: () => fetcher("/api/public/heroes"),
  });
  const { data: news = [] } = useQuery<NewsItem[]>({
    queryKey: ["news"],
    queryFn: () => fetcher("/api/public/news"),
  });

  const activeHeroes = useMemo(() => {
    const rows = heroes.filter((h) => h.active !== false);
    return rows;
  }, [heroes]);

  useEffect(() => {
    if (activeHeroes.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      // Fade out text first
      setTextOpacity(0);

      // Change hero after text fades out
      setTimeout(() => {
        setHeroIndex((prev) => (prev + 1) % activeHeroes.length);
        // Fade in text after hero image transition completes (1000ms)
        setTimeout(() => setTextOpacity(1), 1000);
      }, 500);
    }, 10000);

    return () => window.clearInterval(timer);
  }, [activeHeroes.length]);

  const currentHero = activeHeroes[heroIndex] || activeHeroes[0];
  const titleText = (
    currentHero?.titleTranslations?.[locale] ||
    currentHero?.title ||
    t("home.title")
  )
    .replace(/\\n/g, "\n")
    .replace(/\\ n/g, "\n");
  const subtitleText = (
    currentHero?.subtitleTranslations?.[locale] ||
    currentHero?.subtitle ||
    t("home.subtitle")
  )
    .replace(/\\n/g, "\n")
    .replace(/\\ n/g, "\n");
  const buttonLabelText =
    currentHero?.buttonLabelTranslations?.[locale] || currentHero?.buttonLabel;
  const secondaryButtonLabelText =
    currentHero?.secondaryButtonLabelTranslations?.[locale] ||
    currentHero?.secondaryButtonLabel;
  const showPrimaryButton =
    currentHero?.showPrimaryButton ??
    Boolean(currentHero?.buttonLabel || currentHero?.buttonHref);
  const showSecondaryButton = currentHero?.showSecondaryButton ?? false;
  const featured = cacti.slice(0, 3);

  // If no heroes, show loading
  if (activeHeroes.length === 0) {
    return <Loading />;
  }

  return (
    <div>
      <section className="relative h-screen overflow-hidden">
        <div className="absolute inset-0">
          {activeHeroes.map((hero, idx) => (
            <img
              key={hero.id}
              src={hero.imageUrl}
              alt={hero.title}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
                idx === heroIndex ? "opacity-100" : "opacity-0"
              }`}
              style={{ objectPosition: "60% center" }}
              suppressHydrationWarning
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-r from-cactus-900/30 to-cactus-900/10" />
        </div>
        <div className="container absolute top-[40%] left-0 right-0 mx-auto flex items-start px-4 md:items-start">
          <div
            className="w-full max-w-2xl space-y-4 text-center md:space-y-6 md:text-left transition-opacity duration-500"
            style={{ opacity: textOpacity }}
          >
            <h1 className="font-display text-3xl font-bold leading-tight text-cactus-50 sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl drop-shadow-lg break-words hyphens-auto">
              {titleText}
            </h1>
            <p className="text-base text-cactus-100 drop-shadow-md sm:text-lg md:text-xl break-words hyphens-auto">
              {subtitleText}
            </p>
            {(showPrimaryButton || showSecondaryButton) && (
              <div className="flex flex-col items-center gap-3 md:flex-row md:justify-start">
                {showPrimaryButton && (
                  <Button asChild size="lg" className="gap-2 shadow-lg">
                    <Link
                      href={toLocaleHref(
                        currentHero?.buttonHref || "/catalogue",
                        locale,
                        `/${locale}/catalogue`,
                      )}
                    >
                      {buttonLabelText || t("home.ctaCatalogue")}{" "}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
                {showSecondaryButton && (
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="border-cactus-200 hover:text-cactus-50 text-cactus-black hover:bg-cactus-50/10 shadow-lg"
                  >
                    <Link
                      href={toLocaleHref(
                        currentHero?.secondaryButtonHref || "/about",
                        locale,
                        `/${locale}/about`,
                      )}
                    >
                      {secondaryButtonLabelText || t("home.ctaAbout")}
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 top-24 z-10 flex justify-center px-4">
          <div className="pointer-events-auto flex items-center gap-2 rounded-full  px-4 py-2 backdrop-blur-sm">
            {activeHeroes.map((hero, idx) => (
              <button
                type="button"
                aria-label={`hero-${idx + 1}`}
                key={hero.id}
                onClick={() => setHeroIndex(idx)}
                className={`h-2 w-2 md:h-2.5 md:w-2.5 rounded-full transition-all ${
                  idx === heroIndex
                    ? "scale-110 bg-cactus-50"
                    : "bg-cactus-200/50 hover:bg-cactus-100/80"
                }`}
              />
            ))}
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-6 z-10 flex justify-center px-4">
          <button
            type="button"
            onClick={() =>
              window.scrollTo({ top: window.innerHeight, behavior: "smooth" })
            }
            className="pointer-events-auto flex animate-bounce items-center justify-center rounded-full bg-cactus-900/35 p-3 backdrop-blur-sm hover:bg-cactus-900/50 transition-colors"
            aria-label="Scroll down"
          >
            <ChevronDown className="h-6 w-6 text-cactus-50" />
          </button>
        </div>
      </section>

      <section className="bg-cactus-50 py-16">
        <div className="container mx-auto grid gap-8 px-4 md:grid-cols-3">
          {[
            {
              icon: Leaf,
              title: t("home.features.quality"),
              desc: t("home.features.qualityDesc"),
            },
            {
              icon: Truck,
              title: t("home.features.shipping"),
              desc: t("home.features.shippingDesc"),
            },
            {
              icon: Shield,
              title: t("home.features.guarantee"),
              desc: t("home.features.guaranteeDesc"),
            },
          ].map((f, i) => (
            <div
              key={i}
              className="flex items-start gap-4 rounded-lg bg-card p-6 shadow-sm"
            >
              <div className="rounded-full bg-primary/10 p-3">
                <f.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold">
                  {f.title}
                </h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-earth-50 py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex flex-col items-center text-center md:flex-row md:items-end md:justify-between md:text-left">
            <div>
              <h2 className="font-display text-3xl font-bold">
                {t("news.title")}
              </h2>
              <p className="text-muted-foreground">{t("news.subtitle")}</p>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {news.slice(0, 3).map((item) => (
              <Link
                key={item.id}
                href={`/${locale}/news/${item.id}`}
                className="group cursor-pointer overflow-hidden rounded-lg border bg-card shadow-sm transition-all hover:shadow-md hover:-translate-y-1"
              >
                <div className="h-48 overflow-hidden">
                  <img
                    src={item.coverImage}
                    alt={item.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <p className="text-xs text-muted-foreground">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                  <h3 className="mt-2 font-display text-lg font-semibold">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                    {item.content}
                  </p>
                  <span className="mt-3 inline-block text-sm font-medium text-primary">
                    {t("common.readMore")} →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex flex-col items-center text-center md:flex-row md:items-end md:justify-between md:text-left">
            <div>
              <h2 className="font-display text-3xl font-bold">
                {t("home.featured")}
              </h2>
              <p className="text-muted-foreground">{t("home.featuredSub")}</p>
            </div>
            <Button asChild variant="ghost" className="gap-1">
              <Link href={`/${locale}/catalogue`}>
                {t("common.viewAll")} <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {featured.map((c) => (
              <CactusCard key={c.id} cactus={c} onSelect={setSelectedCactus} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-earth-50 py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex flex-col items-center text-center md:flex-row md:items-end md:justify-between md:text-left">
            <div>
              <h2 className="font-display text-3xl font-bold">
                {t("home.latestBlog")}
              </h2>
              <p className="text-muted-foreground">{t("home.latestBlogSub")}</p>
            </div>
            <Button asChild variant="ghost" className="gap-1">
              <Link href={`/${locale}/blog`}>
                {t("common.viewAll")} <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {blogs.slice(0, 3).map((post) => (
              <div
                key={post.id}
                className="group cursor-pointer overflow-hidden rounded-lg border bg-card shadow-sm transition-all hover:shadow-md hover:-translate-y-1"
              >
                <div className="h-48 overflow-hidden">
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <p className="text-xs text-muted-foreground">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </p>
                  <h3 className="mt-2 font-display text-lg font-semibold">
                    {post.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                    {post.excerpt}
                  </p>
                  <Link
                    href={`/${locale}/blog/${post.id}`}
                    className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
                  >
                    {t("common.readMore")} -&gt;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CactusDetailModal
        cactus={selectedCactus}
        open={!!selectedCactus}
        onOpenChange={(open) => !open && setSelectedCactus(null)}
      />
    </div>
  );
}
