import { MetadataRoute } from "next";
import { getBlogs, getCacti, getNews } from "@/lib/content-store";
import { LOCALES } from "@/lib/i18n";
import { SITE_URL } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [cacti, blogs, news] = await Promise.all([
    getCacti(),
    getBlogs(),
    getNews(),
  ]);

  const base = SITE_URL;
  const paths = ["", "/catalogue", "/about", "/blog", "/cart"];

  const items: MetadataRoute.Sitemap = [];

  for (const locale of LOCALES) {
    for (const path of paths) {
      items.push({
        url: `${base}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: path === "" ? 1 : 0.8,
      });
    }

    for (const item of cacti) {
      items.push({
        url: `${base}/${locale}/catalogue/${item.id}`,
        lastModified: new Date(item.createdAt),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }

    for (const post of blogs) {
      items.push({
        url: `${base}/${locale}/blog/${post.id}`,
        lastModified: new Date(post.createdAt),
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }

    for (const item of news) {
      items.push({
        url: `${base}/${locale}/news/${item.id}`,
        lastModified: new Date(item.createdAt),
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }
  }

  return items;
}
