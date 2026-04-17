import "server-only";

import { cache } from "react";
import { seedBlogs, seedCacti, seedHeroes, seedNews } from "@/data/seed";
import { BlogPost, CactusItem, HeroItem, NewsItem } from "@/types/content";
import { getDb } from "@/lib/firebase-server";

/* ------------------------------------------------------------------ */
/*  Firestore collections: cacti, blogs, heroes, news                 */
/*  Each item is stored as an individual document keyed by its `id`.  */
/* ------------------------------------------------------------------ */

const COLLECTIONS = {
  cacti: "cacti",
  blogs: "blogs",
  heroes: "heroes",
  news: "news",
} as const;

/* ---------- generic helpers ---------- */

async function readCollection<T extends { id: string }>(
  collection: string,
  fallback: T[],
): Promise<T[]> {
  try {
    const db = getDb();
    const snapshot = await db.collection(collection).get();
    if (snapshot.empty) {
      // Seed Firestore with default data on first access
      await writeCollection(collection, fallback);
      return fallback;
    }
    return snapshot.docs.map((doc) => doc.data() as T);
  } catch {
    return fallback;
  }
}

async function writeCollection<T extends { id: string }>(
  collection: string,
  items: T[],
): Promise<void> {
  const db = getDb();
  const colRef = db.collection(collection);

  // Delete existing documents
  const existing = await colRef.listDocuments();
  const batch = db.batch();
  for (const doc of existing) {
    batch.delete(doc);
  }

  // Write new documents
  for (const item of items) {
    batch.set(colRef.doc(item.id), JSON.parse(JSON.stringify(item)));
  }

  await batch.commit();
}

/* ---------- cacti ---------- */

export const getCacti = cache(async function getCacti(): Promise<CactusItem[]> {
  const rows = await readCollection<CactusItem>(COLLECTIONS.cacti, seedCacti);
  return rows.toSorted((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
});

export async function saveCacti(rows: CactusItem[]) {
  await writeCollection(COLLECTIONS.cacti, rows);
}

/* ---------- blogs ---------- */

export const getBlogs = cache(async function getBlogs(): Promise<BlogPost[]> {
  const rows = await readCollection<BlogPost>(COLLECTIONS.blogs, seedBlogs);
  return rows.toSorted((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
});

export async function saveBlogs(rows: BlogPost[]) {
  await writeCollection(COLLECTIONS.blogs, rows);
}

/* ---------- heroes ---------- */

export const getHeroes = cache(async function getHeroes(): Promise<HeroItem[]> {
  const rows = await readCollection<HeroItem>(COLLECTIONS.heroes, seedHeroes);
  return rows
    .map((row, index) => ({
      ...row,
      order: Number.isFinite(row.order) ? row.order : index + 1,
      active: row.active !== false,
      buttonLabel: row.buttonLabel ?? "",
      buttonHref: row.buttonHref ?? "/catalogue",
      showPrimaryButton:
        row.showPrimaryButton ?? Boolean(row.buttonLabel || row.buttonHref),
      secondaryButtonLabel: row.secondaryButtonLabel ?? "",
      secondaryButtonHref: row.secondaryButtonHref ?? "/about",
      showSecondaryButton:
        row.showSecondaryButton ??
        Boolean(row.secondaryButtonLabel || row.secondaryButtonHref),
    }))
    .toSorted((a, b) => a.order - b.order);
});

export async function saveHeroes(rows: HeroItem[]) {
  await writeCollection(COLLECTIONS.heroes, rows);
}

/* ---------- news ---------- */

export const getNews = cache(async function getNews(): Promise<NewsItem[]> {
  const rows = await readCollection<NewsItem>(COLLECTIONS.news, seedNews);
  return rows.toSorted((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
});

export async function saveNews(rows: NewsItem[]) {
  await writeCollection(COLLECTIONS.news, rows);
}
