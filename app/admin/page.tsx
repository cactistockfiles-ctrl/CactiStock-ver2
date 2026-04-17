"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BlogPost, CactusItem, HeroItem, NewsItem } from "@/types/content";
import { cn } from "@/lib/utils";

const emptyCactus: CactusItem = {
  id: "",
  name: "",
  family: "",
  sizeCm: 0,
  price: 0,
  growType: "seed",
  description: "",
  images: { top: "", side1: "", side2: "", side3: "" },
  isSold: false,
  createdAt: "",
};

const emptyBlog: BlogPost = {
  id: "",
  title: "",
  excerpt: "",
  content: "",
  coverImage: "",
  gallery: [],
  createdAt: "",
};

const emptyHero: HeroItem = {
  id: "",
  title: "",
  subtitle: "",
  buttonLabel: "",
  buttonHref: "/catalogue",
  showPrimaryButton: true,
  secondaryButtonLabel: "",
  secondaryButtonHref: "/about",
  showSecondaryButton: false,
  imageUrl: "",
  order: 1,
  active: true,
};

function normalizeHeroFormValue(row: HeroItem): HeroItem {
  return {
    ...row,
    buttonLabel: row.buttonLabel ?? "",
    buttonHref: row.buttonHref ?? "/catalogue",
    showPrimaryButton:
      row.showPrimaryButton ?? Boolean(row.buttonLabel || row.buttonHref),
    secondaryButtonLabel: row.secondaryButtonLabel ?? "",
    secondaryButtonHref: row.secondaryButtonHref ?? "/about",
    showSecondaryButton:
      row.showSecondaryButton ??
      Boolean(row.secondaryButtonLabel || row.secondaryButtonHref),
  };
}

const emptyNews: NewsItem = {
  id: "",
  title: "",
  content: "",
  coverImage: "",
  gallery: [],
  createdAt: "",
};

const cactusFamilyOptions = [
  "Gymnocalycium",
  "Astrophytum",
  "Mammillaria",
  "Echinocactus",
  "Opuntia",
  "Melocactus",
] as const;

type CactusRequiredErrors = {
  id: boolean;
  family: boolean;
  name: boolean;
  growType: boolean;
  sizeCm: boolean;
  price: boolean;
};

const emptyCactusRequiredErrors: CactusRequiredErrors = {
  id: false,
  family: false,
  name: false,
  growType: false,
  sizeCm: false,
  price: false,
};

function FieldLabel({
  text,
  invalid = false,
}: {
  text: string;
  invalid?: boolean;
}) {
  return (
    <p
      className={`text-right text-sm font-medium ${
        invalid ? "text-destructive" : "text-foreground"
      }`}
    >
      {text}
    </p>
  );
}

function FloatingInput({
  label,
  invalid = false,
  className,
  ...props
}: React.ComponentProps<typeof Input> & {
  label: string;
  invalid?: boolean;
}) {
  return (
    <div className="relative">
      <Input
        {...props}
        placeholder=" "
        className={cn("peer h-11 pt-4 placeholder:text-transparent", className)}
      />
      <label
        className={cn(
          "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 bg-card px-1 text-sm text-muted-foreground transition-all",
          "peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-xs peer-focus:text-foreground",
          "peer-[&:not(:placeholder-shown)]:top-0 peer-[&:not(:placeholder-shown)]:-translate-y-1/2 peer-[&:not(:placeholder-shown)]:text-xs peer-[&:not(:placeholder-shown)]:text-foreground",
          invalid &&
            "text-destructive peer-focus:text-destructive peer-[&:not(:placeholder-shown)]:text-destructive",
        )}
      >
        {label}
      </label>
    </div>
  );
}

function FloatingTextarea({
  label,
  className,
  ...props
}: React.ComponentProps<typeof Textarea> & {
  label: string;
}) {
  return (
    <div className="relative">
      <Textarea
        {...props}
        placeholder=" "
        className={cn("peer pt-6 placeholder:text-transparent", className)}
      />
      <label className="pointer-events-none absolute left-3 top-4 bg-card px-1 text-sm text-muted-foreground transition-all peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-xs peer-focus:text-foreground peer-[&:not(:placeholder-shown)]:top-0 peer-[&:not(:placeholder-shown)]:-translate-y-1/2 peer-[&:not(:placeholder-shown)]:text-xs peer-[&:not(:placeholder-shown)]:text-foreground">
        {label}
      </label>
    </div>
  );
}

async function uploadImage(file: File, folder: string) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("folder", folder);

  const res = await fetch("/api/admin/upload-image", {
    method: "POST",
    body: fd,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error || "Upload failed");
  }

  const data = await res.json();
  return data.url as string;
}

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<
    "heroes" | "catalogue" | "blogs" | "news" | "sold"
  >("heroes");

  const tabItems: Array<{ key: typeof tab; label: string }> = [
    { key: "heroes", label: "Hero" },
    { key: "catalogue", label: "Catalogue" },
    { key: "blogs", label: "Blog" },
    { key: "news", label: "News" },
    { key: "sold", label: "Update Status" },
  ];

  const statusLabel = (item: CactusItem) => {
    if ((item as CactusItem & { status?: string }).status === "reserved") {
      return "reserved";
    }

    if (item.isSold) {
      return "sold";
    }

    return "available";
  };

  const [statusView, setStatusView] = useState<"all" | "reserved" | "sold">(
    "all",
  );

  const [cacti, setCacti] = useState<CactusItem[]>([]);
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [heroes, setHeroes] = useState<HeroItem[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);

  const [cactusForm, setCactusForm] = useState<CactusItem>(emptyCactus);
  const [blogForm, setBlogForm] = useState<BlogPost>(emptyBlog);
  const [heroForm, setHeroForm] = useState<HeroItem>(emptyHero);
  const [heroEditForm, setHeroEditForm] = useState<HeroItem>(emptyHero);
  const [heroEditOpen, setHeroEditOpen] = useState(false);
  const [newsForm, setNewsForm] = useState<NewsItem>(emptyNews);
  const [cactusRequiredErrors, setCactusRequiredErrors] =
    useState<CactusRequiredErrors>(emptyCactusRequiredErrors);

  const [searchId, setSearchId] = useState("");
  const [catalogueSearch, setCatalogueSearch] = useState("");
  const [imagePreviews, setImagePreviews] = useState<Record<string, string>>(
    {},
  );
  const [busy, setBusy] = useState(false);

  const loadData = useCallback(async () => {
    const [cactiRes, blogsRes, heroesRes, newsRes] = await Promise.all([
      fetch("/api/admin/cacti"),
      fetch("/api/admin/blogs"),
      fetch("/api/admin/heroes"),
      fetch("/api/admin/news"),
    ]);

    if (
      [cactiRes, blogsRes, heroesRes, newsRes].some((x) => x.status === 401)
    ) {
      router.push("/admin/login");
      return;
    }

    setCacti(await cactiRes.json());
    setBlogs(await blogsRes.json());
    setHeroes((await heroesRes.json()).map(normalizeHeroFormValue));
    setNews(await newsRes.json());
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredSoldRows = useMemo(() => {
    if (!searchId) return cacti;
    return cacti.filter((x) => x.id.includes(searchId.trim()));
  }, [cacti, searchId]);

  const statusRows = useMemo(() => {
    return {
      all: filteredSoldRows,
      reserved: filteredSoldRows.filter(
        (item) => statusLabel(item) === "reserved",
      ),
      sold: filteredSoldRows.filter((item) => statusLabel(item) === "sold"),
    };
  }, [filteredSoldRows]);

  const cactusNameSuggestions = useMemo(() => {
    return Array.from(
      new Set(cacti.map((row) => row.name.trim()).filter(Boolean)),
    ).sort();
  }, [cacti]);

  const familySelectValue = useMemo(() => {
    if (!cactusForm.family) {
      return "";
    }
    return cactusFamilyOptions.includes(
      cactusForm.family as (typeof cactusFamilyOptions)[number],
    )
      ? cactusForm.family
      : "__other__";
  }, [cactusForm.family]);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  async function saveCactus(e: FormEvent) {
    e.preventDefault();

    const nextErrors: CactusRequiredErrors = {
      id: !cactusForm.id.trim(),
      family: !cactusForm.family.trim(),
      name: !cactusForm.name.trim(),
      growType: !(
        cactusForm.growType === "seed" || cactusForm.growType === "graft"
      ),
      sizeCm: !Number.isFinite(cactusForm.sizeCm) || cactusForm.sizeCm <= 0,
      price: !Number.isFinite(cactusForm.price) || cactusForm.price <= 0,
    };

    setCactusRequiredErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }

    setBusy(true);
    try {
      const cactiIdSet = new Set(cacti.map((x) => x.id));
      const method = cactiIdSet.has(cactusForm.id) ? "PUT" : "POST";
      await fetch("/api/admin/cacti", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...cactusForm,
          createdAt: cactusForm.createdAt || new Date().toISOString(),
        }),
      });
      setCactusRequiredErrors(emptyCactusRequiredErrors);
      setCactusForm(emptyCactus);
      setImagePreviews({});
      await loadData();
    } finally {
      setBusy(false);
    }
  }

  async function saveBlog(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const blogIdSet = new Set(blogs.map((x) => x.id));
      const method = blogIdSet.has(blogForm.id) ? "PUT" : "POST";
      await fetch("/api/admin/blogs", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...blogForm,
          createdAt: blogForm.createdAt || new Date().toISOString(),
        }),
      });
      setBlogForm(emptyBlog);
      await loadData();
    } finally {
      setBusy(false);
    }
  }

  async function saveHero(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const isEdit = !!heroForm.id && heroes.some((x) => x.id === heroForm.id);
      const method = isEdit ? "PUT" : "POST";
      const nextOrder =
        heroes.length > 0
          ? Math.max(...heroes.map((item) => item.order)) + 1
          : 1;
      const payload: HeroItem = {
        ...normalizeHeroFormValue(heroForm),
        id: heroForm.id || `hero-${Date.now()}`,
        order: isEdit ? heroForm.order : nextOrder,
        buttonLabel: heroForm.showPrimaryButton ? heroForm.buttonLabel : "",
        buttonHref: heroForm.showPrimaryButton ? heroForm.buttonHref : "",
        secondaryButtonLabel: heroForm.showSecondaryButton
          ? heroForm.secondaryButtonLabel
          : "",
        secondaryButtonHref: heroForm.showSecondaryButton
          ? heroForm.secondaryButtonHref
          : "",
      };

      await fetch("/api/admin/heroes", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setHeroForm(emptyHero);
      await loadData();
    } finally {
      setBusy(false);
    }
  }

  function openHeroEdit(row: HeroItem) {
    setHeroEditForm(normalizeHeroFormValue(row));
    setHeroEditOpen(true);
  }

  function cancelHeroEdit() {
    setHeroEditOpen(false);
    setHeroEditForm(emptyHero);
  }

  async function saveHeroEdit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const payload: HeroItem = {
        ...normalizeHeroFormValue(heroEditForm),
        buttonLabel: heroEditForm.showPrimaryButton
          ? heroEditForm.buttonLabel
          : "",
        buttonHref: heroEditForm.showPrimaryButton
          ? heroEditForm.buttonHref
          : "",
        secondaryButtonLabel: heroEditForm.showSecondaryButton
          ? heroEditForm.secondaryButtonLabel
          : "",
        secondaryButtonHref: heroEditForm.showSecondaryButton
          ? heroEditForm.secondaryButtonHref
          : "",
      };

      await fetch("/api/admin/heroes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      await loadData();
      cancelHeroEdit();
    } finally {
      setBusy(false);
    }
  }

  async function saveNews(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const newsIdSet = new Set(news.map((x) => x.id));
      const method = newsIdSet.has(newsForm.id) ? "PUT" : "POST";
      await fetch("/api/admin/news", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newsForm,
          createdAt: newsForm.createdAt || new Date().toISOString(),
        }),
      });
      setNewsForm(emptyNews);
      await loadData();
    } finally {
      setBusy(false);
    }
  }

  async function removeItem(
    kind: "cacti" | "blogs" | "heroes" | "news",
    id: string,
  ) {
    await fetch(`/api/admin/${kind}?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    await loadData();
  }

  async function toggleSold(id: string, isSold: boolean) {
    await fetch("/api/admin/sold", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isSold }),
    });
    await loadData();
  }

  return (
    <main className="min-h-screen bg-muted/20 p-4 md:p-8">
      <div className="mx-auto max-w-7xl rounded-xl border bg-card p-4 md:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-2xl font-bold">Admin Dashboard</h1>
          <Button variant="outline" onClick={logout}>
            Logout
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {tabItems.map(({ key, label }) => (
            <Button
              key={key}
              type="button"
              variant={tab === key ? "default" : "outline"}
              onClick={() => setTab(key)}
            >
              {label}
            </Button>
          ))}
        </div>

        {tab === "catalogue" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <form
              onSubmit={saveCactus}
              className="space-y-3 rounded-lg border p-4"
            >
              <h2 className="font-semibold">Add / Edit Catalogue</h2>
              <div className="space-y-2">
                <FloatingInput
                  label="1. id"
                  invalid={cactusRequiredErrors.id}
                  value={cactusForm.id}
                  onChange={(e) => {
                    setCactusRequiredErrors((prev) => ({ ...prev, id: false }));
                    setCactusForm({ ...cactusForm, id: e.target.value });
                  }}
                />
              </div>

              <div className="space-y-2">
                <FieldLabel
                  text="2. family name"
                  invalid={cactusRequiredErrors.family}
                />
                <select
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={familySelectValue}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCactusRequiredErrors((prev) => ({
                      ...prev,
                      family: false,
                    }));
                    if (value === "__other__") {
                      const nextFamily = cactusFamilyOptions.includes(
                        cactusForm.family as (typeof cactusFamilyOptions)[number],
                      )
                        ? ""
                        : cactusForm.family;
                      setCactusForm({ ...cactusForm, family: nextFamily });
                      return;
                    }

                    setCactusForm({
                      ...cactusForm,
                      family: value,
                    });
                  }}
                >
                  <option value="" disabled>
                    Select family
                  </option>
                  {cactusFamilyOptions.map((family) => (
                    <option key={family} value={family}>
                      {family}
                    </option>
                  ))}
                  <option value="__other__">อื่นๆ (ใส่เอง)</option>
                </select>
                {familySelectValue === "__other__" && (
                  <FloatingInput
                    label="วงศ์ (อื่นๆ)"
                    value={cactusForm.family}
                    onChange={(e) => {
                      setCactusRequiredErrors((prev) => ({
                        ...prev,
                        family: false,
                      }));
                      setCactusForm({ ...cactusForm, family: e.target.value });
                    }}
                  />
                )}
              </div>

              <div className="space-y-2">
                <FloatingInput
                  label="3. name"
                  invalid={cactusRequiredErrors.name}
                  list="cactus-name-suggestions"
                  value={cactusForm.name}
                  onChange={(e) => {
                    setCactusRequiredErrors((prev) => ({
                      ...prev,
                      name: false,
                    }));
                    setCactusForm({ ...cactusForm, name: e.target.value });
                  }}
                />
                <datalist id="cactus-name-suggestions">
                  {cactusNameSuggestions.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>

              <div className="space-y-2">
                <FieldLabel
                  text="4. รูปแบบการปลูก"
                  invalid={cactusRequiredErrors.growType}
                />
                <select
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={cactusForm.growType}
                  onChange={(e) => {
                    setCactusRequiredErrors((prev) => ({
                      ...prev,
                      growType: false,
                    }));
                    setCactusForm({
                      ...cactusForm,
                      growType: e.target.value as "seed" | "graft",
                    });
                  }}
                >
                  <option value="seed">ไม้เมล็ด</option>
                  <option value="graft">ไม้กราฟ</option>
                </select>
              </div>

              <div className="space-y-2">
                <FloatingInput
                  label="5. ขนาด"
                  invalid={cactusRequiredErrors.sizeCm}
                  type="number"
                  min={0}
                  value={cactusForm.sizeCm || ""}
                  onChange={(e) => {
                    setCactusRequiredErrors((prev) => ({
                      ...prev,
                      sizeCm: false,
                    }));
                    setCactusForm({
                      ...cactusForm,
                      sizeCm: Number(e.target.value),
                    });
                  }}
                />
              </div>

              <div className="space-y-2">
                <FloatingInput
                  label="6. ราคา"
                  invalid={cactusRequiredErrors.price}
                  type="number"
                  min={0}
                  value={cactusForm.price || ""}
                  onChange={(e) => {
                    setCactusRequiredErrors((prev) => ({
                      ...prev,
                      price: false,
                    }));
                    setCactusForm({
                      ...cactusForm,
                      price: Number(e.target.value),
                    });
                  }}
                />
              </div>

              <FloatingTextarea
                label="รายละเอียด"
                value={cactusForm.description}
                onChange={(e) =>
                  setCactusForm({ ...cactusForm, description: e.target.value })
                }
                required
              />

              <div className="space-y-3">
                <label className="text-sm font-medium">Upload images</label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(
                    [
                      ["top", "รูปมุมบน"],
                      ["side1", "รูปด้านข้าง 1"],
                      ["side2", "รูปด้านข้าง 2"],
                      ["side3", "รูปด้านข้าง 3"],
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key} className="space-y-2">
                      <label className="text-xs text-muted-foreground">
                        {label}
                      </label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;

                          // Create preview
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            setImagePreviews((prev) => ({
                              ...prev,
                              [key]: event.target?.result as string,
                            }));
                          };
                          reader.readAsDataURL(file);

                          // Upload image
                          const url = await uploadImage(
                            file,
                            "cactistock/cacti",
                          );
                          setCactusForm((prev) => ({
                            ...prev,
                            images: { ...prev.images, [key]: url },
                          }));
                        }}
                      />
                      {(imagePreviews[key] || cactusForm.images[key]) && (
                        <img
                          src={imagePreviews[key] || cactusForm.images[key]}
                          alt={label}
                          className="w-full h-auto rounded-md border object-contain max-h-48"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <Button disabled={busy} type="submit">
                Save cactus
              </Button>
            </form>

            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Catalogue list</h2>
                <Input
                  type="text"
                  placeholder="Search catalogue..."
                  value={catalogueSearch}
                  onChange={(e) => setCatalogueSearch(e.target.value)}
                  className="max-w-xs"
                />
              </div>
              <div className="max-h-[540px] overflow-auto grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {cacti
                  .filter(
                    (row) =>
                      row.name
                        .toLowerCase()
                        .includes(catalogueSearch.toLowerCase()) ||
                      row.family
                        .toLowerCase()
                        .includes(catalogueSearch.toLowerCase()) ||
                      row.id
                        .toLowerCase()
                        .includes(catalogueSearch.toLowerCase()),
                  )
                  .map((row) => (
                    <div
                      key={row.id}
                      className="relative overflow-hidden rounded-lg border bg-card"
                    >
                      <div className="relative h-40">
                        <img
                          src={row.images.top}
                          alt={row.name}
                          className="h-full w-full object-cover"
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              aria-label="Catalogue menu"
                              className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-md bg-background/90 border hover:bg-accent"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setCactusForm(row)}
                            >
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => removeItem("cacti", row.id)}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="p-3">
                        <span className="text-xs text-muted-foreground font-mono block mb-1">
                          {row.id}
                        </span>
                        <p className="font-medium text-sm">{row.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {row.family} · {row.sizeCm} cm
                        </p>
                        <p className="text-sm font-semibold text-primary">
                          ฿{row.price.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {tab === "blogs" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <form
              onSubmit={saveBlog}
              className="space-y-3 rounded-lg border p-4"
            >
              <h2 className="font-semibold">Add / Edit Blog</h2>
              <FloatingInput
                label="id"
                value={blogForm.id}
                onChange={(e) =>
                  setBlogForm({ ...blogForm, id: e.target.value })
                }
                required
              />
              <FloatingInput
                label="title"
                value={blogForm.title}
                onChange={(e) =>
                  setBlogForm({ ...blogForm, title: e.target.value })
                }
                required
              />
              <FloatingInput
                label="cover image url"
                value={blogForm.coverImage}
                onChange={(e) =>
                  setBlogForm({ ...blogForm, coverImage: e.target.value })
                }
                required
              />
              <FloatingTextarea
                label="excerpt"
                value={blogForm.excerpt}
                onChange={(e) =>
                  setBlogForm({ ...blogForm, excerpt: e.target.value })
                }
                required
              />
              <FloatingTextarea
                label="content"
                value={blogForm.content}
                onChange={(e) =>
                  setBlogForm({ ...blogForm, content: e.target.value })
                }
                required
              />

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Upload cover image
                </label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const url = await uploadImage(file, "cactistock/blogs");
                    setBlogForm((prev) => ({ ...prev, coverImage: url }));
                  }}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Gallery images (max 8)
                </label>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || []).slice(0, 8);
                    const urls = await Promise.all(
                      files.map((file) =>
                        uploadImage(file, "cactistock/blogs"),
                      ),
                    );
                    setBlogForm((prev) => ({ ...prev, gallery: urls }));
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Current gallery count: {blogForm.gallery.length}
                </p>
              </div>

              <Button disabled={busy} type="submit">
                Save blog
              </Button>
            </form>

            <div className="rounded-lg border p-4 space-y-2">
              <h2 className="font-semibold">Blog list</h2>
              <div className="max-h-[540px] overflow-auto space-y-2">
                {blogs.map((row) => (
                  <div
                    key={row.id}
                    className="flex items-center justify-between gap-2 rounded border p-2 text-sm"
                  >
                    <div>
                      <p className="font-medium">
                        {row.id} - {row.title}
                      </p>
                      <p className="text-muted-foreground">
                        gallery {row.gallery.length} / 8
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setBlogForm(row)}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => removeItem("blogs", row.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "heroes" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <form
              onSubmit={saveHero}
              className="space-y-3 rounded-lg border p-4"
            >
              <h2 className="font-semibold">Add / Edit Hero</h2>
              <FloatingInput
                label="title"
                value={heroForm.title}
                onChange={(e) =>
                  setHeroForm({ ...heroForm, title: e.target.value })
                }
                required
              />
              <FloatingInput
                label="subtitle"
                value={heroForm.subtitle}
                onChange={(e) =>
                  setHeroForm({ ...heroForm, subtitle: e.target.value })
                }
                required
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={heroForm.showPrimaryButton}
                  onChange={(e) =>
                    setHeroForm({
                      ...heroForm,
                      showPrimaryButton: e.target.checked,
                    })
                  }
                />
                show primary button
              </label>
              {heroForm.showPrimaryButton && (
                <>
                  <FloatingInput
                    label="primary button label"
                    value={heroForm.buttonLabel}
                    onChange={(e) =>
                      setHeroForm({ ...heroForm, buttonLabel: e.target.value })
                    }
                  />
                  <FloatingInput
                    label="primary button href"
                    value={heroForm.buttonHref}
                    onChange={(e) =>
                      setHeroForm({ ...heroForm, buttonHref: e.target.value })
                    }
                  />
                </>
              )}

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={heroForm.showSecondaryButton}
                  onChange={(e) =>
                    setHeroForm({
                      ...heroForm,
                      showSecondaryButton: e.target.checked,
                    })
                  }
                />
                show secondary button
              </label>
              {heroForm.showSecondaryButton && (
                <>
                  <FloatingInput
                    label="secondary button label"
                    value={heroForm.secondaryButtonLabel}
                    onChange={(e) =>
                      setHeroForm({
                        ...heroForm,
                        secondaryButtonLabel: e.target.value,
                      })
                    }
                  />
                  <FloatingInput
                    label="secondary button href"
                    value={heroForm.secondaryButtonHref}
                    onChange={(e) =>
                      setHeroForm({
                        ...heroForm,
                        secondaryButtonHref: e.target.value,
                      })
                    }
                  />
                </>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Upload hero image</label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    // Validate image dimensions
                    const img = new Image();
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      img.src = event.target?.result as string;
                    };
                    img.onload = async () => {
                      if (img.width < 1920 || img.height < 1080) {
                        alert(
                          `รูปภาพต้องมีขนาดอย่างน้อย 1920x1080px\nขนาดปัจจุบัน: ${img.width}x${img.height}`,
                        );
                        return;
                      }
                      const url = await uploadImage(file, "cactistock/heroes");
                      setHeroForm((prev) => ({ ...prev, imageUrl: url }));
                    };
                    reader.readAsDataURL(file);
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  ขนาดขั้นต่ำ: 1920 x 1080px (16:9)
                </p>
                {heroForm.imageUrl && (
                  <div className="aspect-video w-full rounded-md border overflow-hidden">
                    <img
                      src={heroForm.imageUrl}
                      alt="hero preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={heroForm.active}
                  onChange={(e) =>
                    setHeroForm({ ...heroForm, active: e.target.checked })
                  }
                />
                active
              </label>

              <Button disabled={busy} type="submit">
                Save hero
              </Button>
            </form>

            <div className="rounded-lg border p-4 space-y-2">
              <h2 className="font-semibold">Hero list</h2>
              <div className="max-h-[540px] overflow-auto grid gap-3 sm:grid-cols-2">
                {heroes.map((row) => (
                  <div
                    key={row.id}
                    className="relative overflow-hidden rounded-lg border bg-card text-sm"
                  >
                    <img
                      src={row.imageUrl}
                      alt={row.title}
                      className="h-36 w-full object-cover"
                    />
                    <div className="p-3 pr-10">
                      <p className="font-medium line-clamp-1">{row.title}</p>
                      <p className="text-muted-foreground line-clamp-1">
                        {row.subtitle}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {row.active ? "active" : "inactive"}
                      </p>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          aria-label="Hero menu"
                          className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-md bg-background/90 border hover:bg-accent"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            openHeroEdit(row);
                          }}
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => removeItem("heroes", row.id)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            </div>

            <Dialog
              open={heroEditOpen}
              onOpenChange={(open) => {
                if (!open) {
                  cancelHeroEdit();
                  return;
                }
                setHeroEditOpen(true);
              }}
            >
              <DialogContent className="max-h-[90vh] overflow-auto sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Edit Hero</DialogTitle>
                  <DialogDescription>
                    Edit hero details, then save to update this card.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={saveHeroEdit} className="space-y-3">
                  <FloatingInput
                    label="title"
                    value={heroEditForm.title}
                    onChange={(e) =>
                      setHeroEditForm({
                        ...heroEditForm,
                        title: e.target.value,
                      })
                    }
                    required
                  />
                  <FloatingInput
                    label="subtitle"
                    value={heroEditForm.subtitle}
                    onChange={(e) =>
                      setHeroEditForm({
                        ...heroEditForm,
                        subtitle: e.target.value,
                      })
                    }
                    required
                  />

                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={heroEditForm.showPrimaryButton}
                      onChange={(e) =>
                        setHeroEditForm({
                          ...heroEditForm,
                          showPrimaryButton: e.target.checked,
                        })
                      }
                    />
                    show primary button
                  </label>
                  {heroEditForm.showPrimaryButton && (
                    <>
                      <FloatingInput
                        label="primary button label"
                        value={heroEditForm.buttonLabel}
                        onChange={(e) =>
                          setHeroEditForm({
                            ...heroEditForm,
                            buttonLabel: e.target.value,
                          })
                        }
                      />
                      <FloatingInput
                        label="primary button href"
                        value={heroEditForm.buttonHref}
                        onChange={(e) =>
                          setHeroEditForm({
                            ...heroEditForm,
                            buttonHref: e.target.value,
                          })
                        }
                      />
                    </>
                  )}

                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={heroEditForm.showSecondaryButton}
                      onChange={(e) =>
                        setHeroEditForm({
                          ...heroEditForm,
                          showSecondaryButton: e.target.checked,
                        })
                      }
                    />
                    show secondary button
                  </label>
                  {heroEditForm.showSecondaryButton && (
                    <>
                      <FloatingInput
                        label="secondary button label"
                        value={heroEditForm.secondaryButtonLabel}
                        onChange={(e) =>
                          setHeroEditForm({
                            ...heroEditForm,
                            secondaryButtonLabel: e.target.value,
                          })
                        }
                      />
                      <FloatingInput
                        label="secondary button href"
                        value={heroEditForm.secondaryButtonHref}
                        onChange={(e) =>
                          setHeroEditForm({
                            ...heroEditForm,
                            secondaryButtonHref: e.target.value,
                          })
                        }
                      />
                    </>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Upload hero image
                    </label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        // Validate image dimensions
                        const img = new Image();
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          img.src = event.target?.result as string;
                        };
                        img.onload = async () => {
                          if (img.width < 1920 || img.height < 1080) {
                            alert(
                              `รูปภาพต้องมีขนาดอย่างน้อย 1920x1080px\nขนาดปัจจุบัน: ${img.width}x${img.height}`,
                            );
                            return;
                          }
                          const url = await uploadImage(
                            file,
                            "cactistock/heroes",
                          );
                          setHeroEditForm((prev) => ({
                            ...prev,
                            imageUrl: url,
                          }));
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      ขนาดขั้นต่ำ: 1920 x 1080px (16:9)
                    </p>
                    {heroEditForm.imageUrl && (
                      <div className="aspect-video w-full rounded-md border overflow-hidden">
                        <img
                          src={heroEditForm.imageUrl}
                          alt="hero preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>

                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={heroEditForm.active}
                      onChange={(e) =>
                        setHeroEditForm({
                          ...heroEditForm,
                          active: e.target.checked,
                        })
                      }
                    />
                    active
                  </label>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={cancelHeroEdit}
                    >
                      Cancel
                    </Button>
                    <Button disabled={busy} type="submit">
                      Save
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {tab === "news" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <form
              onSubmit={saveNews}
              className="space-y-3 rounded-lg border p-4"
            >
              <h2 className="font-semibold">Add / Edit News</h2>
              <FloatingInput
                label="id"
                value={newsForm.id}
                onChange={(e) =>
                  setNewsForm({ ...newsForm, id: e.target.value })
                }
                required
              />
              <FloatingInput
                label="title"
                value={newsForm.title}
                onChange={(e) =>
                  setNewsForm({ ...newsForm, title: e.target.value })
                }
                required
              />
              <FloatingTextarea
                label="content"
                value={newsForm.content}
                onChange={(e) =>
                  setNewsForm({ ...newsForm, content: e.target.value })
                }
                required
              />

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Upload cover image
                </label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const url = await uploadImage(file, "cactistock/news");
                    setNewsForm((prev) => ({ ...prev, coverImage: url }));
                  }}
                />
                {newsForm.coverImage && (
                  <img
                    src={newsForm.coverImage}
                    alt="news cover"
                    className="mt-2 aspect-square w-32 rounded-md border object-cover"
                  />
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Gallery images (max 8)
                </label>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || []).slice(0, 8);
                    const urls = await Promise.all(
                      files.map((file) => uploadImage(file, "cactistock/news")),
                    );
                    setNewsForm((prev) => ({ ...prev, gallery: urls }));
                  }}
                />
                <div className="grid grid-cols-4 gap-2">
                  {newsForm.gallery.map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt={`news gallery ${idx + 1}`}
                      className="aspect-square w-full rounded-md border object-cover"
                    />
                  ))}
                </div>
              </div>

              <Button disabled={busy} type="submit">
                Save news
              </Button>
            </form>

            <div className="rounded-lg border p-4 space-y-2">
              <h2 className="font-semibold">News list</h2>
              <div className="max-h-[540px] overflow-auto space-y-2">
                {news.map((row) => (
                  <div
                    key={row.id}
                    className="flex items-center justify-between gap-2 rounded border p-2 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {row.id} - {row.title}
                      </p>
                      <p className="text-muted-foreground">
                        gallery {row.gallery.length} / 8
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setNewsForm(row)}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => removeItem("news", row.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "sold" && (
          <div className="space-y-4 rounded-lg border p-4">
            <h2 className="font-semibold">Update Status</h2>
            <FloatingInput
              label="Search by cactus id"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
            />

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={statusView === "all" ? "default" : "outline"}
                onClick={() => setStatusView("all")}
              >
                ต้นไม้ทั้งหมด ({statusRows.all.length})
              </Button>
              <Button
                type="button"
                variant={statusView === "reserved" ? "default" : "outline"}
                onClick={() => setStatusView("reserved")}
              >
                ที่จองแล้ว ({statusRows.reserved.length})
              </Button>
              <Button
                type="button"
                variant={statusView === "sold" ? "default" : "outline"}
                onClick={() => setStatusView("sold")}
              >
                ที่ขายแล้ว ({statusRows.sold.length})
              </Button>
            </div>

            <div className="space-y-2 max-h-[520px] overflow-auto">
              {statusRows[statusView].map((row) => (
                <div
                  key={row.id}
                  className="flex items-center justify-between rounded border p-2 text-sm"
                >
                  <div>
                    <p className="font-medium">
                      {row.id} - {row.name}
                    </p>
                    <p className="text-muted-foreground">
                      status: {statusLabel(row)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant={row.isSold ? "outline" : "default"}
                    onClick={() => toggleSold(row.id, !row.isSold)}
                  >
                    {row.isSold ? "Set available" : "Set sold"}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
