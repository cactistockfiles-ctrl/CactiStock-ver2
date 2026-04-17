"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import CactusCard from "@/components/CactusCard";
import CactusDetailModal from "@/components/CactusDetailModal";
import { useLocale } from "@/context/LocaleContext";
import { CactusItem } from "@/types/content";

type SortValue = "newest" | "oldest";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  return res.json();
};

export default function CataloguePage() {
  const { t, locale } = useLocale();
  const [selectedCactus, setSelectedCactus] = useState<CactusItem | null>(null);
  const [sort, setSort] = useState<SortValue>("newest");
  const [family, setFamily] = useState("all");

  const { data: rows = [] } = useQuery<CactusItem[]>({
    queryKey: ["cacti"],
    queryFn: () => fetcher("/api/public/cacti"),
  });

  const families = useMemo(() => {
    const set = new Set(rows.map((x) => x.family));
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [rows]);

  const filtered = useMemo(() => {
    const byFamily =
      family === "all" ? rows : rows.filter((c) => c.family === family);
    const sorted = byFamily.toSorted((a, b) =>
      sort === "newest"
        ? Date.parse(b.createdAt) - Date.parse(a.createdAt)
        : Date.parse(a.createdAt) - Date.parse(b.createdAt),
    );
    return sorted;
  }, [rows, family, sort]);

  return (
    <div className="container mx-auto px-4 py-12 pt-28">
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold">
          {t("catalogue.title")}
        </h1>
        <p className="text-muted-foreground">{t("catalogue.subtitle")}</p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setSort("newest")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            sort === "newest"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          {t("catalogue.newest")}
        </button>
        <button
          type="button"
          onClick={() => setSort("oldest")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            sort === "oldest"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          {t("catalogue.oldest")}
        </button>

        <select
          value={family}
          onChange={(e) => setFamily(e.target.value)}
          className="ml-1 rounded-full border bg-card px-4 py-1.5 text-sm text-foreground"
        >
          <option value="all">{t("catalogue.allFamilies")}</option>
          {families
            .filter((x) => x !== "all")
            .map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
        </select>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => (
          <CactusCard key={c.id} cactus={c} onSelect={setSelectedCactus} />
        ))}
      </div>

      <CactusDetailModal
        cactus={selectedCactus}
        open={!!selectedCactus}
        onOpenChange={(open) => !open && setSelectedCactus(null)}
      />
    </div>
  );
}
