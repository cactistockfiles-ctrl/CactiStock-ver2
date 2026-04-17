"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocale } from "@/context/LocaleContext";
import { BlogPost } from "@/types/content";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  return res.json();
};

export default function BlogPage() {
  const { t, locale } = useLocale();
  const { data: rows = [] } = useQuery<BlogPost[]>({
    queryKey: ["blogs"],
    queryFn: () => fetcher("/api/public/blogs"),
  });

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold">{t("nav.blog")}</h1>
        <p className="text-muted-foreground">
          ความรู้และเคล็ดลับเกี่ยวกับกระบองเพชร
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {rows.map((post) => (
          <Link
            key={post.id}
            href={`/${locale}/blog/${post.id}`}
            className="cursor-pointer rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1"
          >
            <p className="text-xs text-muted-foreground">
              {new Date(post.createdAt).toLocaleDateString()}
            </p>
            <h2 className="mt-2 font-display text-xl font-semibold">
              {post.title}
            </h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              {post.excerpt}
            </p>
            <span className="mt-4 inline-block text-sm font-medium text-primary">
              {t("common.readMore")} →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
