import "server-only";

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
      // Check if collection has been initialized before
      const initDoc = await db.collection("_init").doc(collection).get();
      if (initDoc.exists) {
        // Collection was initialized but is now empty (all items deleted)
        return [];
      }
      // First-time initialization - seed with default data
      await db.collection("_init").doc(collection).set({ initialized: true });
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

export async function getCacti(): Promise<CactusItem[]> {
  const rows = await readCollection<CactusItem>(COLLECTIONS.cacti, seedCacti);
  return rows
    .map((row) => ({
      ...row,
      images: {
        top: row.images?.top ?? "",
        side1: row.images?.side1 ?? "",
        side2: row.images?.side2 ?? "",
        side3: row.images?.side3 ?? "",
      },
    }))
    .toSorted((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export async function saveCacti(rows: CactusItem[]) {
  await writeCollection(COLLECTIONS.cacti, rows);
}

/* ---------- blogs ---------- */

export async function getBlogs(): Promise<BlogPost[]> {
  const rows = await readCollection<BlogPost>(COLLECTIONS.blogs, seedBlogs);
  return rows.toSorted((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export async function saveBlogs(rows: BlogPost[]) {
  await writeCollection(COLLECTIONS.blogs, rows);
}

/* ---------- heroes ---------- */

export async function getHeroes(): Promise<HeroItem[]> {
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
}

export async function saveHeroes(rows: HeroItem[]) {
  await writeCollection(COLLECTIONS.heroes, rows);
}

/* ---------- news ---------- */

export async function getNews(): Promise<NewsItem[]> {
  const rows = await readCollection<NewsItem>(COLLECTIONS.news, seedNews);
  return rows.toSorted((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export async function saveNews(rows: NewsItem[]) {
  await writeCollection(COLLECTIONS.news, rows);
}

/* ---------- dragon courier rates ---------- */

const DRAGON_COLLECTION = "dragonCourierRates";
const DRAGON_HISTORY = "dragonCourierRatesHistory";

/**
 * Retrieve the current published rates document (id: "current").
 */
export async function getDragonCourierRates(): Promise<null | { id: string; rates: Record<string, Record<string, number>>; updatedAt: string; updatedBy?: string; note?: string } > {
  try {
    const db = getDb();
    const doc = await db.collection(DRAGON_COLLECTION).doc("current").get();
    if (!doc.exists) return null;
    return doc.data() as { id: string; rates: Record<string, Record<string, number>>; updatedAt: string; updatedBy?: string; note?: string };
  } catch (err) {
    console.error("getDragonCourierRates error:", err);
    return null;
  }
}

/**
 * Save/publish new rates and append a history record.
 */
export async function saveDragonCourierRates(payload: { rates: Record<string, Record<string, number>>; updatedBy?: string; note?: string }) {
  const db = getDb();
  const now = new Date().toISOString();

  const record = {
    id: "current",
    rates: payload.rates,
    updatedAt: now,
    updatedBy: payload.updatedBy || "admin",
    note: payload.note || "",
  };

  await db.collection(DRAGON_COLLECTION).doc("current").set(record);

  // append history
  const historyItem = {
    id: `published-${Date.now()}`,
    rates: payload.rates,
    publishedAt: now,
    publishedBy: payload.updatedBy || "admin",
    note: payload.note || "",
  };
  await db.collection(DRAGON_HISTORY).doc(historyItem.id).set(historyItem);
}

/**
 * Basic JSON validation for the rates shape.
 */
export function validateDragonCourierRatesJson(obj: unknown): { ok: boolean; errors?: string[] } {
  const zones = ["A","B","C","D","E","F","G","H","I"];
  const errors: string[] = [];

  if (typeof obj !== "object" || obj === null) {
    return { ok: false, errors: ["Root must be an object"] };
  }

  for (const z of zones) {
    const zoneVal = obj[z];
    if (zoneVal === undefined) continue; // allow missing zones
    if (typeof zoneVal !== "object" || zoneVal === null) {
      errors.push(`Zone ${z} must be an object of weight:price`);
      continue;
    }
    for (const [wK, price] of Object.entries(zoneVal)) {
      const w = Number(wK);
      if (!Number.isFinite(w) || w <= 0) {
        errors.push(`Zone ${z} weight key '${wK}' is not a valid positive number`);
      }
      if (!Number.isFinite(Number(price)) || Number(price) < 0) {
        errors.push(`Zone ${z} weight ${wK} has invalid price '${price}'`);
      }
    }
  }

  return { ok: errors.length === 0, errors: errors.length ? errors : undefined };
}
