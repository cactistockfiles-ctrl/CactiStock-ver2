"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Languages, Loader2 } from "lucide-react";
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
import { translateText } from "@/lib/translation";
import { t as tI18n, LOCALES } from "@/lib/i18n";
import type { Locale } from "@/types/content";
import {
  CACTUS_TAXONOMY,
  getFamilyNames,
  getSpeciesNames,
} from "@/data/cactus-taxonomy";

const emptyCactus: CactusItem = {
  id: "",
  name: "",
  nameTranslations: {},
  family: "",
  sizeCm: 0,
  price: 0,
  growType: "seed",
  description: "",
  descriptionTranslations: {},
  images: { top: "", side1: "", side2: "", side3: "" },
  isSold: false,
  createdAt: "",
};

const emptyBlog: BlogPost = {
  id: "",
  title: "",
  titleTranslations: {},
  excerpt: "",
  excerptTranslations: {},
  content: "",
  contentTranslations: {},
  coverImage: "",
  gallery: [],
  createdAt: "",
};

const emptyHero: HeroItem = {
  id: "",
  title: "",
  titleTranslations: {},
  subtitle: "",
  subtitleTranslations: {},
  buttonLabel: "",
  buttonLabelTranslations: {},
  buttonHref: "/catalogue",
  showPrimaryButton: true,
  secondaryButtonLabel: "",
  secondaryButtonLabelTranslations: {},
  secondaryButtonHref: "/about",
  showSecondaryButton: false,
  imageUrl: "",
  order: 1,
  active: true,
};

const pageLinks = [
  { label: "Home", value: "/" },
  { label: "Catalogue", value: "/catalogue" },
  { label: "About", value: "/about" },
  { label: "Blog", value: "/blog" },
  { label: "News", value: "/news" },
  { label: "Custom Link", value: "custom" },
];

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
  titleTranslations: {},
  content: "",
  contentTranslations: {},
  coverImage: "",
  gallery: [],
  createdAt: "",
};

const cactusFamilyOptions = getFamilyNames();

type CactusRequiredErrors = {
  id: boolean;
  family: boolean;
  name: boolean;
  growType: boolean;
  sizeCm: boolean;
  widthCm: boolean;
  lengthCm: boolean;
  heightCm: boolean;
  price: boolean;
};

const emptyCactusRequiredErrors: CactusRequiredErrors = {
  id: false,
  family: false,
  name: false,
  growType: false,
  sizeCm: false,
  widthCm: false,
  lengthCm: false,
  heightCm: false,
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
    <div className="relative min-w-0">
      <Input
        {...props}
        placeholder=" "
        className={cn(
          "peer h-11 pt-4 placeholder:text-transparent min-w-0",
          className,
        )}
      />
      <label
        className={cn(
          "pointer-events-none absolute left-2 md:left-3 top-1/2 -translate-y-1/2 bg-card px-1 text-xs md:text-sm text-muted-foreground transition-all",
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
    <div className="relative min-w-0">
      <Textarea
        {...props}
        placeholder=" "
        className={cn(
          "peer pt-6 placeholder:text-transparent min-w-0",
          className,
        )}
      />
      <label className="pointer-events-none absolute left-3 top-4 bg-card px-1 text-sm text-muted-foreground transition-all peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-xs peer-focus:text-foreground peer-[&:not(:placeholder-shown)]:top-0 peer-[&:not(:placeholder-shown)]:-translate-y-1/2 peer-[&:not(:placeholder-shown)]:text-xs peer-[&:not(:placeholder-shown)]:text-foreground">
        {label}
      </label>
    </div>
  );
}

async function convertToJpeg(file: File): Promise<File> {
  // If already a standard web format, check if it needs conversion
  const needsConversion =
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    file.type === "image/avif" ||
    file.type === "image/bmp" ||
    file.type === "image/tiff" ||
    !file.type.startsWith("image/");

  // For HEIC/HEIF/AVIF etc., convert via canvas
  // Also convert very large images to reduce size
  if (
    !needsConversion &&
    file.size <= 5 * 1024 * 1024 &&
    file.type === "image/jpeg"
  ) {
    return file; // Already JPEG and reasonable size
  }

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);

      // Cap dimensions to reduce file size (max 2000px on longest side)
      const MAX_DIM = 2000;
      let w = img.width;
      let h = img.height;
      if (w > MAX_DIM || h > MAX_DIM) {
        if (w > h) {
          h = Math.round((h * MAX_DIM) / w);
          w = MAX_DIM;
        } else {
          w = Math.round((w * MAX_DIM) / h);
          h = MAX_DIM;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file); // Fallback to original
            return;
          }
          const jpegFile = new File(
            [blob],
            file.name.replace(/\.[^.]+$/, ".jpg"),
            {
              type: "image/jpeg",
              lastModified: Date.now(),
            },
          );
          resolve(jpegFile);
        },
        "image/jpeg",
        0.9, // 90% quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file); // Fallback to original
    };
    img.src = url;
  });
}

async function uploadImage(file: File, folder: string) {
  const jpegFile = await convertToJpeg(file);
  const fd = new FormData();
  fd.append("file", jpegFile);
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

const adminTranslations = {
  th: {
    dashboard: "Admin Dashboard",
    logout: "Logout",
    hero: "Hero",
    catalogue: "Catalogue",
    blog: "Blog",
    news: "News",
    info: "ข้อมูลหน้าเกี่ยวกับเรา",
    updateStatus: "Update Status",
    addEditHero: "เพิ่ม / แก้ไข Hero",
    addEditCactus: "เพิ่ม / แก้ไข กระบองเพชร",
    addEditBlog: "เพิ่ม / แก้ไข Blog",
    addEditNews: "เพิ่ม / แก้ไข News",
    save: "บันทึก",
    edit: "แก้ไข",
    delete: "ลบ",
    heroList: "รายการ Hero",
    cactusList: "รายการกระบองเพชร",
    blogList: "รายการ Blog",
    newsList: "รายการ News",
    title: "ชื่อ",
    subtitle: "คำบรรยาย",
    buttonLabel: "ข้อความปุ่ม",
    buttonHref: "ลิงก์ปุ่ม",
    showPrimaryButton: "แสดงปุ่มหลัก",
    showSecondaryButton: "แสดงปุ่มรอง",
    secondaryButtonLabel: "ข้อความปุ่มรอง",
    secondaryButtonHref: "ลิงก์ปุ่มรอง",
    imageUrl: "URL รูปภาพ",
    uploadHeroImage: "อัพโหลดรูปภาพ Hero",
    uploadCoverImage: "อัพโหลดรูปภาพปก",
    galleryImages: "รูปภาพในแกลเลอรี่ (สูงสุด 8)",
    currentGalleryCount: "จำนวนรูปปัจจุบัน",
    uploadCactusImages: "อัพโหลดรูปภาพกระบองเพชร",
    topImage: "รูปด้านบน",
    side1Image: "รูปด้านข้าง 1",
    side2Image: "รูปด้านข้าง 2",
    side3Image: "รูปด้านข้าง 3",
    name: "ชื่อ",
    family: "วงศ์",
    sizeCm: "ขนาด (ซม.)",
    price: "ราคา",
    growType: "วิธีการปลูก",
    seed: "เมล็ด",
    graft: "กราฟ",
    description: "คำอธิบาย",
    excerpt: "บทสรุป",
    content: "เนื้อหา",
    searchById: "ค้นหาตาม ID",
    searchByCactusId: "ค้นหาตาม ID กระบองเพชร",
    all: "ทั้งหมด",
    available: "รอขาย",
    reserved: "ที่จองแล้ว",
    sold: "ที่ขายแล้ว",
    active: "ใช้งาน",
    uploadImage: "อัพโหลดรูปภาพ",
    savedSuccessfully: "บันทึกสำเร็จ",
    searchCatalogue: "ค้นหากระบองเพชร...",
    imageMinSize:
      "รูปภาพต้องมีขนาดอย่างน้อย 1920x1080px\nขนาดปัจจุบัน: {width}x{height}",
    minSize: "ขนาดขั้นต่ำ: 1920 x 1080px (16:9)",
  },
  en: {
    dashboard: "Admin Dashboard",
    logout: "Logout",
    hero: "Hero",
    catalogue: "Catalogue",
    blog: "Blog",
    news: "News",
    info: "About Page Info",
    updateStatus: "Update Status",
    addEditHero: "Add / Edit Hero",
    addEditCactus: "Add / Edit Cactus",
    addEditBlog: "Add / Edit Blog",
    addEditNews: "Add / Edit News",
    save: "Save",
    edit: "Edit",
    delete: "Delete",
    heroList: "Hero List",
    cactusList: "Cactus List",
    blogList: "Blog List",
    newsList: "News List",
    title: "Title",
    subtitle: "Subtitle",
    buttonLabel: "Button Label",
    buttonHref: "Button Href",
    showPrimaryButton: "Show Primary Button",
    showSecondaryButton: "Show Secondary Button",
    secondaryButtonLabel: "Secondary Button Label",
    secondaryButtonHref: "Secondary Button Href",
    imageUrl: "Image URL",
    uploadHeroImage: "Upload Hero Image",
    uploadCoverImage: "Upload Cover Image",
    galleryImages: "Gallery Images (max 8)",
    currentGalleryCount: "Current gallery count",
    uploadCactusImages: "Upload Cactus Images",
    topImage: "Top Image",
    side1Image: "Side 1 Image",
    side2Image: "Side 2 Image",
    side3Image: "Side 3 Image",
    name: "Name",
    family: "Family",
    sizeCm: "Size (cm)",
    price: "Price",
    growType: "Planting Method",
    seed: "Seed",
    graft: "Graft",
    description: "Description",
    excerpt: "Excerpt",
    content: "Content",
    searchById: "Search by ID",
    searchByCactusId: "Search by Cactus ID",
    all: "All",
    available: "Available",
    reserved: "Reserved",
    sold: "Sold",
    active: "Active",
    uploadImage: "Upload Image",
    savedSuccessfully: "Saved successfully",
    searchCatalogue: "Search catalogue...",
    imageMinSize:
      "Image must be at least 1920x1080px\nCurrent size: {width}x{height}",
    minSize: "Minimum size: 1920 x 1080px (16:9)",
  },
};

export default function AdminPage() {
  const router = useRouter();
  const [adminLang, setAdminLang] = useState<"th" | "en">("th");
  const [tab, setTab] = useState<
    "heroes" | "catalogue" | "blogs" | "news" | "sold" | "info"
  >("heroes");

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    kind: "cacti" | "blogs" | "heroes" | "news" | null;
    id: string | null;
    name: string;
  }>({ open: false, kind: null, id: null, name: "" });

  const t = adminTranslations[adminLang];

  const tabItems: Array<{ key: typeof tab; label: string }> = [
    { key: "heroes", label: t.hero },
    { key: "catalogue", label: t.catalogue },
    { key: "blogs", label: t.blog },
    { key: "news", label: t.news },
    { key: "info", label: t.info || "Info" },
    { key: "sold", label: t.updateStatus },
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

  const [statusView, setStatusView] = useState<
    "all" | "available" | "reserved" | "sold"
  >("all");

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
  const [primaryButtonLinkMode, setPrimaryButtonLinkMode] = useState<
    "predefined" | "custom"
  >("predefined");
  const [secondaryButtonLinkMode, setSecondaryButtonLinkMode] = useState<
    "predefined" | "custom"
  >("predefined");
  const [editPrimaryButtonLinkMode, setEditPrimaryButtonLinkMode] = useState<
    "predefined" | "custom"
  >("predefined");
  const [editSecondaryButtonLinkMode, setEditSecondaryButtonLinkMode] =
    useState<"predefined" | "custom">("predefined");
  const [aboutForm, setAboutForm] = useState({
    whoWeAre: "",
    whoWeAreDesc: "",
    ourMission: "",
    ourMissionDesc: "",
    step1Title: "",
    step1Desc: "",
    step2Title: "",
    step2Desc: "",
    step3Title: "",
    step3Desc: "",
    contactEmail: "cactistockfiles@gmail.com",
    contactLine: "cactistockfiles",
    showLine: true,
    additionalInfo: "",
    facebook: "",
    showFacebook: false,
    instagram: "",
    showInstagram: false,
    tiktok: "",
    showTiktok: false,
    youtube: "",
    showYoutube: false,
  });
  const [cactusRequiredErrors, setCactusRequiredErrors] =
    useState<CactusRequiredErrors>(emptyCactusRequiredErrors);

  const [searchId, setSearchId] = useState("");
  const [catalogueSearch, setCatalogueSearch] = useState("");
  const [imagePreviews, setImagePreviews] = useState<Record<string, string>>(
    {},
  );
  const [imageUploadStatus, setImageUploadStatus] = useState<
    Record<string, "idle" | "uploading" | "done" | "error">
  >({});
  const [busy, setBusy] = useState(false);

  const loadData = useCallback(async () => {
    const [cactiRes, blogsRes, heroesRes, newsRes, aboutRes] =
      await Promise.all([
        fetch("/api/admin/cacti"),
        fetch("/api/admin/blogs"),
        fetch("/api/admin/heroes"),
        fetch("/api/admin/news"),
        fetch("/api/admin/about"),
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

    if (aboutRes.ok) {
      const aboutData = await aboutRes.json();
      setAboutForm(aboutData);
    }
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
      available: filteredSoldRows.filter(
        (item) => statusLabel(item) === "available",
      ),
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

  async function translateText(text: string, sourceLang: string) {
    try {
      const response = await fetch("/api/admin/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, sourceLang }),
      });
      const data = await response.json();
      return data.translations;
    } catch (error) {
      console.error("Translation error:", error);
      return {};
    }
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
      widthCm: !cactusForm.widthCm || !Number.isFinite(cactusForm.widthCm) || cactusForm.widthCm <= 0,
      lengthCm: !cactusForm.lengthCm || !Number.isFinite(cactusForm.lengthCm) || cactusForm.lengthCm <= 0,
      heightCm: !cactusForm.heightCm || !Number.isFinite(cactusForm.heightCm) || cactusForm.heightCm <= 0,
      price: !Number.isFinite(cactusForm.price) || cactusForm.price <= 0,
    };

    setCactusRequiredErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }

    setBusy(true);
    try {
      // Translate name and description
      const nameTranslations = await translateText(cactusForm.name, adminLang);
      const descriptionTranslations = await translateText(
        cactusForm.description,
        adminLang,
      );

      const cactiIdSet = new Set(cacti.map((x) => x.id));
      const method = cactiIdSet.has(cactusForm.id) ? "PUT" : "POST";
      await fetch("/api/admin/cacti", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...cactusForm,
          nameTranslations,
          descriptionTranslations,
          createdAt: cactusForm.createdAt || new Date().toISOString(),
        }),
      });
      setCactusForm(emptyCactus);
      setImagePreviews({});
      setImageUploadStatus({});
      await loadData();
    } finally {
      setBusy(false);
    }
  }

  async function saveBlog(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      // Translate title, excerpt, and content
      const titleTranslations = await translateText(blogForm.title, adminLang);
      const excerptTranslations = await translateText(
        blogForm.excerpt,
        adminLang,
      );
      const contentTranslations = await translateText(
        blogForm.content,
        adminLang,
      );

      const blogIdSet = new Set(blogs.map((x) => x.id));
      const isEdit = blogForm.id && blogIdSet.has(blogForm.id);
      const method = isEdit ? "PUT" : "POST";
      const payload = {
        ...blogForm,
        titleTranslations,
        excerptTranslations,
        contentTranslations,
        id: isEdit ? blogForm.id : `blog-${Date.now()}`,
        createdAt: blogForm.createdAt || new Date().toISOString(),
      };
      await fetch("/api/admin/blogs", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
      // Translate title, subtitle, and button labels
      const titleTranslations = await translateText(heroForm.title, adminLang);
      const subtitleTranslations = await translateText(
        heroForm.subtitle,
        adminLang,
      );
      const buttonLabelTranslations = await translateText(
        heroForm.buttonLabel,
        adminLang,
      );
      const secondaryButtonLabelTranslations = await translateText(
        heroForm.secondaryButtonLabel,
        adminLang,
      );

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
        titleTranslations,
        subtitleTranslations,
        buttonLabelTranslations,
        secondaryButtonLabelTranslations,
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
    const normalized = normalizeHeroFormValue(row);
    setHeroEditForm(normalized);

    // Determine link modes based on current href values
    const isPrimaryCustom = !pageLinks.some(
      (p) => p.value === normalized.buttonHref && p.value !== "custom",
    );
    const isSecondaryCustom = !pageLinks.some(
      (p) => p.value === normalized.secondaryButtonHref && p.value !== "custom",
    );

    setEditPrimaryButtonLinkMode(isPrimaryCustom ? "custom" : "predefined");
    setEditSecondaryButtonLinkMode(isSecondaryCustom ? "custom" : "predefined");
    setHeroEditOpen(true);
  }

  function cancelHeroEdit() {
    setHeroEditOpen(false);
    setHeroEditForm(emptyHero);
    setEditPrimaryButtonLinkMode("predefined");
    setEditSecondaryButtonLinkMode("predefined");
  }

  async function saveHeroEdit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      // Translate title, subtitle, and button labels
      const titleTranslations = await translateText(
        heroEditForm.title,
        adminLang,
      );
      const subtitleTranslations = await translateText(
        heroEditForm.subtitle,
        adminLang,
      );
      const buttonLabelTranslations = await translateText(
        heroEditForm.buttonLabel,
        adminLang,
      );
      const secondaryButtonLabelTranslations = await translateText(
        heroEditForm.secondaryButtonLabel,
        adminLang,
      );

      const payload: HeroItem = {
        ...normalizeHeroFormValue(heroEditForm),
        titleTranslations,
        subtitleTranslations,
        buttonLabelTranslations,
        secondaryButtonLabelTranslations,
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
      // Translate title and content
      const titleTranslations = await translateText(newsForm.title, adminLang);
      const contentTranslations = await translateText(
        newsForm.content,
        adminLang,
      );

      const newsIdSet = new Set(news.map((x) => x.id));
      const isEdit = newsForm.id && newsIdSet.has(newsForm.id);
      const method = isEdit ? "PUT" : "POST";
      const payload = {
        ...newsForm,
        titleTranslations,
        contentTranslations,
        id: isEdit ? newsForm.id : `news-${Date.now()}`,
        createdAt: newsForm.createdAt || new Date().toISOString(),
      };
      await fetch("/api/admin/news", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setNewsForm(emptyNews);
      await loadData();
    } finally {
      setBusy(false);
    }
  }

  async function saveAbout(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      // Translate all text fields
      const whoWeAreTranslations = await translateText(
        aboutForm.whoWeAre,
        adminLang,
      );
      const whoWeAreDescTranslations = await translateText(
        aboutForm.whoWeAreDesc,
        adminLang,
      );
      const ourMissionTranslations = await translateText(
        aboutForm.ourMission,
        adminLang,
      );
      const ourMissionDescTranslations = await translateText(
        aboutForm.ourMissionDesc,
        adminLang,
      );
      const step1TitleTranslations = await translateText(
        aboutForm.step1Title,
        adminLang,
      );
      const step1DescTranslations = await translateText(
        aboutForm.step1Desc,
        adminLang,
      );
      const step2TitleTranslations = await translateText(
        aboutForm.step2Title,
        adminLang,
      );
      const step2DescTranslations = await translateText(
        aboutForm.step2Desc,
        adminLang,
      );
      const step3TitleTranslations = await translateText(
        aboutForm.step3Title,
        adminLang,
      );
      const step3DescTranslations = await translateText(
        aboutForm.step3Desc,
        adminLang,
      );
      const additionalInfoTranslations = await translateText(
        aboutForm.additionalInfo,
        adminLang,
      );

      const payload = {
        ...aboutForm,
        whoWeAreTranslations,
        whoWeAreDescTranslations,
        ourMissionTranslations,
        ourMissionDescTranslations,
        step1TitleTranslations,
        step1DescTranslations,
        step2TitleTranslations,
        step2DescTranslations,
        step3TitleTranslations,
        step3DescTranslations,
        additionalInfoTranslations,
      };

      await fetch("/api/admin/about", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      alert(t.savedSuccessfully);
    } finally {
      setBusy(false);
    }
  }

  function confirmDelete(
    kind: "cacti" | "blogs" | "heroes" | "news",
    id: string,
    name: string,
  ) {
    setDeleteDialog({ open: true, kind, id, name });
  }

  async function executeDelete() {
    if (!deleteDialog.kind || !deleteDialog.id) return;
    setBusy(true);
    try {
      await fetch(
        `/api/admin/${deleteDialog.kind}?id=${encodeURIComponent(deleteDialog.id)}`,
        {
          method: "DELETE",
        },
      );
      await loadData();
    } finally {
      setBusy(false);
      setDeleteDialog({ open: false, kind: null, id: null, name: "" });
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

  async function changeStatus(id: string, status: string) {
    await fetch("/api/admin/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    await loadData();
  }

  return (
    <main className="min-h-screen bg-muted/20 p-2 md:p-8">
      <div className="mx-auto max-w-full md:max-w-7xl rounded-xl border bg-card p-2 md:p-6 space-y-4 overflow-x-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-2xl font-bold">{t.dashboard}</h1>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Languages className="h-4 w-4 mr-2" />
                  {adminLang === "th" ? "TH" : "EN"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setAdminLang("th")}>
                  {adminLang === "th" ? "ไทย (TH)" : "Thai (TH)"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setAdminLang("en")}>
                  English (EN)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" onClick={logout}>
              {t.logout}
            </Button>
          </div>
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
              <h2 className="font-semibold">{t.addEditCactus}</h2>
              <div className="space-y-2">
                <FloatingInput
                  label="1. ID"
                  invalid={cactusRequiredErrors.id}
                  value={cactusForm.id}
                  onChange={(e) => {
                    setCactusRequiredErrors((prev) => ({ ...prev, id: false }));
                    setCactusForm({ ...cactusForm, id: e.target.value });
                  }}
                  required
                />
              </div>

              <div className="space-y-2">
                <label
                  className={`text-sm font-medium ${cactusRequiredErrors.family ? "text-destructive" : ""}`}
                >
                  2. family name
                </label>
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
                      name: "",
                    });
                  }}
                >
                  <option value="" disabled>
                    Select family
                  </option>
                  {cactusFamilyOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                  <option value="__other__">Other</option>
                </select>
                {familySelectValue === "__other__" && (
                  <FloatingInput
                    label="Other family"
                    invalid={cactusRequiredErrors.family}
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
                <label className="text-sm font-medium">3. {t.name}</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={cactusForm.name}
                  onChange={(e) => {
                    setCactusRequiredErrors((prev) => ({
                      ...prev,
                      name: false,
                    }));
                    setCactusForm({ ...cactusForm, name: e.target.value });
                  }}
                  disabled={!cactusForm.family}
                  required
                >
                  <option value="">Select species...</option>
                  {cactusForm.family &&
                    getSpeciesNames(cactusForm.family).map((species) => (
                      <option key={species} value={species}>
                        {species}
                      </option>
                    ))}
                </select>
                {!cactusForm.family && (
                  <p className="text-xs text-muted-foreground">
                    Please select a family first
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">4. {t.growType}</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                  <option value="seed">{t.seed}</option>
                  <option value="graft">{t.graft}</option>
                </select>
              </div>

              <div className="space-y-2">
                <FloatingInput
                  label={`5. ${t.sizeCm}`}
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
                {cactusRequiredErrors.widthCm && <span className="text-red-500">***</span>}
                <FloatingInput
                  label="6. width"
                  invalid={cactusRequiredErrors.widthCm}
                  type="number"
                  min={0}
                  value={cactusForm.widthCm ?? ""}
                  onChange={(e) => {
                    setCactusRequiredErrors((prev) => ({
                      ...prev,
                      widthCm: false,
                    }));
                    setCactusForm({
                      ...cactusForm,
                      widthCm: e.target.value ? Number(e.target.value) : undefined,
                    });
                  }}
                />
              </div>

              <div className="space-y-2">
                {cactusRequiredErrors.lengthCm && <span className="text-red-500">***</span>}
                <FloatingInput
                  label="7. length"
                  invalid={cactusRequiredErrors.lengthCm}
                  type="number"
                  min={0}
                  value={cactusForm.lengthCm ?? ""}
                  onChange={(e) => {
                    setCactusRequiredErrors((prev) => ({
                      ...prev,
                      lengthCm: false,
                    }));
                    setCactusForm({
                      ...cactusForm,
                      lengthCm: e.target.value ? Number(e.target.value) : undefined,
                    });
                  }}
                />
              </div>

              <div className="space-y-2">
                {cactusRequiredErrors.heightCm && <span className="text-red-500">***</span>}
                <FloatingInput
                  label="8. height"
                  invalid={cactusRequiredErrors.heightCm}
                  type="number"
                  min={0}
                  value={cactusForm.heightCm ?? ""}
                  onChange={(e) => {
                    setCactusRequiredErrors((prev) => ({
                      ...prev,
                      heightCm: false,
                    }));
                    setCactusForm({
                      ...cactusForm,
                      heightCm: e.target.value ? Number(e.target.value) : undefined,
                    });
                  }}
                />
              </div>

              <div className="space-y-2">
                <FloatingInput
                  label={`9. ${t.price}`}
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
                label={t.description}
                value={cactusForm.description}
                onChange={(e) =>
                  setCactusForm({ ...cactusForm, description: e.target.value })
                }
                required
              />

              <div className="space-y-3">
                <label className="text-sm font-medium">
                  {t.uploadCactusImages}
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(
                    [
                      ["top", t.topImage],
                      ["side1", t.side1Image],
                      ["side2", t.side2Image],
                      ["side3", t.side3Image],
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key} className="space-y-2">
                      <label className="text-xs text-muted-foreground">
                        {label}
                      </label>
                      <Input
                        type="file"
                        accept="image/*"
                        disabled={imageUploadStatus[key] === "uploading"}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;

                          setImageUploadStatus((prev) => ({
                            ...prev,
                            [key]: "uploading",
                          }));

                          try {
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
                            setImageUploadStatus((prev) => ({
                              ...prev,
                              [key]: "done",
                            }));
                          } catch (error) {
                            console.error(`Upload failed for ${key}:`, error);
                            setImageUploadStatus((prev) => ({
                              ...prev,
                              [key]: "error",
                            }));
                            alert(
                              `Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`,
                            );
                          }
                        }}
                      />
                      {(imagePreviews[key] || cactusForm.images[key]) && (
                        <img
                          src={imagePreviews[key] || cactusForm.images[key]}
                          alt={label}
                          className="w-full h-auto rounded-md border object-contain max-h-48"
                        />
                      )}
                      {imageUploadStatus[key] === "uploading" && (
                        <div className="text-xs text-muted-foreground">
                          Uploading...
                        </div>
                      )}
                      {imageUploadStatus[key] === "done" && (
                        <div className="text-xs text-green-600">✓ Uploaded</div>
                      )}
                      {imageUploadStatus[key] === "error" && (
                        <div className="text-xs text-destructive">
                          ✗ Upload failed - try again
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <Button disabled={busy} type="submit">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t.save}
              </Button>
            </form>

            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">{t.cactusList}</h2>
                <Input
                  type="text"
                  placeholder={t.searchCatalogue}
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
                              onClick={() => {
                                setCactusForm(row);
                                setImageUploadStatus({});
                              }}
                            >
                              {t.edit}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() =>
                                confirmDelete("cacti", row.id, row.name)
                              }
                            >
                              {t.delete}
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
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 overflow-x-hidden w-full">
            <form
              onSubmit={saveBlog}
              className="space-y-3 rounded-lg border p-4 w-full min-w-0 overflow-x-hidden"
            >
              <h2 className="font-semibold">{t.addEditBlog}</h2>
              <FloatingInput
                label={t.title}
                value={blogForm.title}
                onChange={(e) =>
                  setBlogForm({ ...blogForm, title: e.target.value })
                }
                required
                className="w-full max-w-full"
              />
              <FloatingTextarea
                label={t.excerpt}
                value={blogForm.excerpt}
                onChange={(e) =>
                  setBlogForm({ ...blogForm, excerpt: e.target.value })
                }
                required
                className="w-full max-w-full"
              />
              <FloatingTextarea
                label={t.content}
                value={blogForm.content}
                onChange={(e) =>
                  setBlogForm({ ...blogForm, content: e.target.value })
                }
                required
                className="w-full max-w-full"
              />

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t.uploadCoverImage}
                </label>
                <Input
                  type="file"
                  accept="image/*"
                  className="w-full max-w-full"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const url = await uploadImage(file, "cactistock/blogs");
                    setBlogForm((prev) => ({ ...prev, coverImage: url }));
                  }}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t.galleryImages}</label>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  className="w-full max-w-full"
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
                  {t.currentGalleryCount}: {blogForm.gallery.length}
                </p>
              </div>

              <Button
                disabled={busy}
                type="submit"
                className="w-full max-w-full"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t.save}
              </Button>
            </form>

            <div className="rounded-lg border p-4 space-y-2">
              <h2 className="font-semibold">{t.blogList}</h2>
              <div className="max-h-[540px] overflow-auto space-y-2">
                {blogs.map((row) => (
                  <div
                    key={row.id}
                    className="flex items-center justify-between gap-2 rounded border p-2 text-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {row.coverImage && (
                        <img
                          src={row.coverImage}
                          alt={row.title}
                          className="h-10 w-10 md:h-12 md:w-12 rounded-md object-cover flex-shrink-0"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium truncate text-xs md:text-sm">
                          {row.id} - {row.title}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          gallery {row.gallery.length} / 8
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 md:gap-2 flex-shrink-0">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs px-2 py-1 md:text-sm md:px-3 md:py-2"
                        onClick={() => setBlogForm(row)}
                      >
                        {t.edit}
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="text-xs px-2 py-1 md:text-sm md:px-3 md:py-2"
                        onClick={() =>
                          confirmDelete("blogs", row.id, row.title)
                        }
                      >
                        {t.delete}
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
              <h2 className="font-semibold">{t.addEditHero}</h2>
              <FloatingInput
                label={t.title}
                value={heroForm.title}
                onChange={(e) =>
                  setHeroForm({ ...heroForm, title: e.target.value })
                }
                required
              />
              <FloatingInput
                label={t.subtitle}
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
                {t.showPrimaryButton}
              </label>
              {heroForm.showPrimaryButton && (
                <>
                  <FloatingInput
                    label={t.buttonLabel}
                    value={heroForm.buttonLabel}
                    onChange={(e) =>
                      setHeroForm({ ...heroForm, buttonLabel: e.target.value })
                    }
                  />
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {t.buttonHref}
                    </label>
                    <select
                      value={
                        pageLinks.some((p) => p.value === heroForm.buttonHref)
                          ? heroForm.buttonHref
                          : "custom"
                      }
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "custom") {
                          setPrimaryButtonLinkMode("custom");
                          setHeroForm({ ...heroForm, buttonHref: "" });
                        } else {
                          setPrimaryButtonLinkMode("predefined");
                          setHeroForm({ ...heroForm, buttonHref: value });
                        }
                      }}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {pageLinks.map((page) => (
                        <option key={page.value} value={page.value}>
                          {page.label}
                        </option>
                      ))}
                    </select>
                    {primaryButtonLinkMode === "custom" && (
                      <Input
                        placeholder="https://example.com"
                        value={heroForm.buttonHref}
                        onChange={(e) =>
                          setHeroForm({
                            ...heroForm,
                            buttonHref: e.target.value,
                          })
                        }
                      />
                    )}
                  </div>
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
                {t.showSecondaryButton}
              </label>
              {heroForm.showSecondaryButton && (
                <>
                  <FloatingInput
                    label={t.secondaryButtonLabel}
                    value={heroForm.secondaryButtonLabel}
                    onChange={(e) =>
                      setHeroForm({
                        ...heroForm,
                        secondaryButtonLabel: e.target.value,
                      })
                    }
                  />
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {t.secondaryButtonHref}
                    </label>
                    <select
                      value={
                        pageLinks.some(
                          (p) => p.value === heroForm.secondaryButtonHref,
                        )
                          ? heroForm.secondaryButtonHref
                          : "custom"
                      }
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "custom") {
                          setSecondaryButtonLinkMode("custom");
                          setHeroForm({ ...heroForm, secondaryButtonHref: "" });
                        } else {
                          setSecondaryButtonLinkMode("predefined");
                          setHeroForm({
                            ...heroForm,
                            secondaryButtonHref: value,
                          });
                        }
                      }}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {pageLinks.map((page) => (
                        <option key={page.value} value={page.value}>
                          {page.label}
                        </option>
                      ))}
                    </select>
                    {secondaryButtonLinkMode === "custom" && (
                      <Input
                        placeholder="https://example.com"
                        value={heroForm.secondaryButtonHref}
                        onChange={(e) =>
                          setHeroForm({
                            ...heroForm,
                            secondaryButtonHref: e.target.value,
                          })
                        }
                      />
                    )}
                  </div>
                </>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t.uploadHeroImage}
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
                          t.imageMinSize
                            .replace("{width}", img.width.toString())
                            .replace("{height}", img.height.toString()),
                        );
                        return;
                      }
                      const url = await uploadImage(file, "cactistock/heroes");
                      setHeroForm((prev) => ({ ...prev, imageUrl: url }));
                    };
                    reader.readAsDataURL(file);
                  }}
                />
                <p className="text-xs text-muted-foreground">{t.minSize}</p>
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
                {t.active}
              </label>

              <Button disabled={busy} type="submit">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t.save}
              </Button>
            </form>

            <div className="rounded-lg border p-4 space-y-2">
              <h2 className="font-semibold">{t.heroList}</h2>
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
                        {row.active ? t.active : "inactive"}
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
                          {t.edit}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() =>
                            confirmDelete("heroes", row.id, row.title)
                          }
                        >
                          {t.delete}
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
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          primary button href
                        </label>
                        <select
                          value={
                            pageLinks.some(
                              (p) => p.value === heroEditForm.buttonHref,
                            )
                              ? heroEditForm.buttonHref
                              : "custom"
                          }
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === "custom") {
                              setEditPrimaryButtonLinkMode("custom");
                              setHeroEditForm({
                                ...heroEditForm,
                                buttonHref: "",
                              });
                            } else {
                              setEditPrimaryButtonLinkMode("predefined");
                              setHeroEditForm({
                                ...heroEditForm,
                                buttonHref: value,
                              });
                            }
                          }}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          {pageLinks.map((page) => (
                            <option key={page.value} value={page.value}>
                              {page.label}
                            </option>
                          ))}
                        </select>
                        {editPrimaryButtonLinkMode === "custom" && (
                          <Input
                            placeholder="https://example.com"
                            value={heroEditForm.buttonHref}
                            onChange={(e) =>
                              setHeroEditForm({
                                ...heroEditForm,
                                buttonHref: e.target.value,
                              })
                            }
                          />
                        )}
                      </div>
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
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          secondary button href
                        </label>
                        <select
                          value={
                            pageLinks.some(
                              (p) =>
                                p.value === heroEditForm.secondaryButtonHref,
                            )
                              ? heroEditForm.secondaryButtonHref
                              : "custom"
                          }
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === "custom") {
                              setEditSecondaryButtonLinkMode("custom");
                              setHeroEditForm({
                                ...heroEditForm,
                                secondaryButtonHref: "",
                              });
                            } else {
                              setEditSecondaryButtonLinkMode("predefined");
                              setHeroEditForm({
                                ...heroEditForm,
                                secondaryButtonHref: value,
                              });
                            }
                          }}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          {pageLinks.map((page) => (
                            <option key={page.value} value={page.value}>
                              {page.label}
                            </option>
                          ))}
                        </select>
                        {editSecondaryButtonLinkMode === "custom" && (
                          <Input
                            placeholder="https://example.com"
                            value={heroEditForm.secondaryButtonHref}
                            onChange={(e) =>
                              setHeroEditForm({
                                ...heroEditForm,
                                secondaryButtonHref: e.target.value,
                              })
                            }
                          />
                        )}
                      </div>
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
                              t.imageMinSize
                                .replace("{width}", img.width.toString())
                                .replace("{height}", img.height.toString()),
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
                      {busy ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Save"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {tab === "news" && (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 overflow-x-hidden w-full">
            <form
              onSubmit={saveNews}
              className="space-y-3 rounded-lg border p-4 w-full min-w-0 overflow-x-hidden"
            >
              <h2 className="font-semibold">{t.addEditNews}</h2>
              <FloatingInput
                label={t.title}
                value={newsForm.title}
                onChange={(e) =>
                  setNewsForm({ ...newsForm, title: e.target.value })
                }
                required
                className="w-full max-w-full"
              />
              <FloatingTextarea
                label={t.content}
                value={newsForm.content}
                onChange={(e) =>
                  setNewsForm({ ...newsForm, content: e.target.value })
                }
                required
                className="w-full max-w-full"
              />

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t.uploadCoverImage}
                </label>
                <Input
                  type="file"
                  accept="image/*"
                  className="w-full max-w-full"
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
                <label className="text-sm font-medium">{t.galleryImages}</label>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  className="w-full max-w-full"
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || []).slice(0, 8);
                    const urls = await Promise.all(
                      files.map((file) => uploadImage(file, "cactistock/news")),
                    );
                    setNewsForm((prev) => ({ ...prev, gallery: urls }));
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  {t.currentGalleryCount}: {newsForm.gallery.length}
                </p>
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

              <Button
                disabled={busy}
                type="submit"
                className="w-full max-w-full"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t.save}
              </Button>
            </form>

            <div className="rounded-lg border p-4 space-y-2">
              <h2 className="font-semibold">{t.newsList}</h2>
              <div className="max-h-[540px] overflow-auto space-y-2">
                {news.map((row) => (
                  <div
                    key={row.id}
                    className="flex items-center justify-between gap-2 rounded border p-2 text-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {row.coverImage && (
                        <img
                          src={row.coverImage}
                          alt={row.title}
                          className="h-10 w-10 md:h-12 md:w-12 rounded-md object-cover flex-shrink-0"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium truncate text-xs md:text-sm">
                          {row.id} - {row.title}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          gallery {row.gallery.length} / 8
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 md:gap-2 flex-shrink-0">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs px-2 py-1 md:text-sm md:px-3 md:py-2"
                        onClick={() => setNewsForm(row)}
                      >
                        {t.edit}
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="text-xs px-2 py-1 md:text-sm md:px-3 md:py-2"
                        onClick={() => confirmDelete("news", row.id, row.title)}
                      >
                        {t.delete}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "info" && (
          <div className="max-w-3xl mx-auto">
            <form
              onSubmit={saveAbout}
              className="space-y-4 rounded-lg border p-6"
            >
              <h2 className="font-semibold text-lg">
                {adminLang === "th"
                  ? "แก้ไขหน้าเกี่ยวกับเรา"
                  : "Edit About Page"}
              </h2>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {adminLang === "th"
                    ? "เราคือใคร (หัวข้อ)"
                    : "Who We Are (Title)"}
                </label>
                <Input
                  value={aboutForm.whoWeAre}
                  onChange={(e) =>
                    setAboutForm({ ...aboutForm, whoWeAre: e.target.value })
                  }
                  placeholder={
                    adminLang === "th" ? "เราคือใคร..." : "Who we are..."
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {adminLang === "th"
                    ? "เราคือใคร (รายละเอียด)"
                    : "Who We Are (Description)"}
                </label>
                <Textarea
                  value={aboutForm.whoWeAreDesc}
                  onChange={(e) =>
                    setAboutForm({ ...aboutForm, whoWeAreDesc: e.target.value })
                  }
                  placeholder={
                    adminLang === "th" ? "รายละเอียด..." : "Description..."
                  }
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {adminLang === "th"
                    ? "พันธกิจของเรา (หัวข้อ)"
                    : "Our Mission (Title)"}
                </label>
                <Input
                  value={aboutForm.ourMission}
                  onChange={(e) =>
                    setAboutForm({ ...aboutForm, ourMission: e.target.value })
                  }
                  placeholder={
                    adminLang === "th" ? "พันธกิจของเรา..." : "Our mission..."
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {adminLang === "th"
                    ? "พันธกิจของเรา (รายละเอียด)"
                    : "Our Mission (Description)"}
                </label>
                <Textarea
                  value={aboutForm.ourMissionDesc}
                  onChange={(e) =>
                    setAboutForm({
                      ...aboutForm,
                      ourMissionDesc: e.target.value,
                    })
                  }
                  placeholder={
                    adminLang === "th" ? "รายละเอียด..." : "Description..."
                  }
                  rows={4}
                />
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">
                  {adminLang === "th" ? "วิธีการสั่งซื้อ" : "How to Order"}
                </h3>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {adminLang === "th"
                        ? "ขั้นตอนที่ 1 (หัวข้อ)"
                        : "Step 1 (Title)"}
                    </label>
                    <Input
                      value={aboutForm.step1Title}
                      onChange={(e) =>
                        setAboutForm({
                          ...aboutForm,
                          step1Title: e.target.value,
                        })
                      }
                      placeholder={
                        adminLang === "th" ? "ขั้นตอนที่ 1..." : "Step 1..."
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {adminLang === "th"
                        ? "ขั้นตอนที่ 2 (หัวข้อ)"
                        : "Step 2 (Title)"}
                    </label>
                    <Input
                      value={aboutForm.step2Title}
                      onChange={(e) =>
                        setAboutForm({
                          ...aboutForm,
                          step2Title: e.target.value,
                        })
                      }
                      placeholder={
                        adminLang === "th" ? "ขั้นตอนที่ 2..." : "Step 2..."
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {adminLang === "th"
                        ? "ขั้นตอนที่ 3 (หัวข้อ)"
                        : "Step 3 (Title)"}
                    </label>
                    <Input
                      value={aboutForm.step3Title}
                      onChange={(e) =>
                        setAboutForm({
                          ...aboutForm,
                          step3Title: e.target.value,
                        })
                      }
                      placeholder={
                        adminLang === "th" ? "ขั้นตอนที่ 3..." : "Step 3..."
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {adminLang === "th"
                        ? "ขั้นตอนที่ 1 (รายละเอียด)"
                        : "Step 1 (Description)"}
                    </label>
                    <Textarea
                      value={aboutForm.step1Desc}
                      onChange={(e) =>
                        setAboutForm({
                          ...aboutForm,
                          step1Desc: e.target.value,
                        })
                      }
                      placeholder={
                        adminLang === "th" ? "รายละเอียด..." : "Description..."
                      }
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {adminLang === "th"
                        ? "ขั้นตอนที่ 2 (รายละเอียด)"
                        : "Step 2 (Description)"}
                    </label>
                    <Textarea
                      value={aboutForm.step2Desc}
                      onChange={(e) =>
                        setAboutForm({
                          ...aboutForm,
                          step2Desc: e.target.value,
                        })
                      }
                      placeholder={
                        adminLang === "th" ? "รายละเอียด..." : "Description..."
                      }
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {adminLang === "th"
                        ? "ขั้นตอนที่ 3 (รายละเอียด)"
                        : "Step 3 (Description)"}
                    </label>
                    <Textarea
                      value={aboutForm.step3Desc}
                      onChange={(e) =>
                        setAboutForm({
                          ...aboutForm,
                          step3Desc: e.target.value,
                        })
                      }
                      placeholder={
                        adminLang === "th" ? "รายละเอียด..." : "Description..."
                      }
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {adminLang === "th" ? "อีเมลติดต่อ" : "Contact Email"}
                </label>
                <Input
                  type="email"
                  value={aboutForm.contactEmail}
                  onChange={(e) =>
                    setAboutForm({ ...aboutForm, contactEmail: e.target.value })
                  }
                  placeholder="email@example.com"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={aboutForm.showLine}
                    onChange={(e) =>
                      setAboutForm({
                        ...aboutForm,
                        showLine: e.target.checked,
                      })
                    }
                    className="mt-1"
                  />
                  <div className="flex-1 space-y-2">
                    <label className="text-sm font-medium">LINE ID</label>
                    <Input
                      value={aboutForm.contactLine}
                      onChange={(e) =>
                        setAboutForm({
                          ...aboutForm,
                          contactLine: e.target.value,
                        })
                      }
                      placeholder="line_id"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {adminLang === "th" ? "ข้อมูลเพิ่มเติม" : "Additional Info"}
                </label>
                <Textarea
                  value={aboutForm.additionalInfo}
                  onChange={(e) =>
                    setAboutForm({
                      ...aboutForm,
                      additionalInfo: e.target.value,
                    })
                  }
                  placeholder={
                    adminLang === "th"
                      ? "ข้อมูลเพิ่มเติม..."
                      : "Additional info..."
                  }
                  rows={4}
                />
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">
                  {adminLang === "th" ? "โซเชียลมีเดีย" : "Social Media"}
                </h3>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={aboutForm.showFacebook}
                      onChange={(e) =>
                        setAboutForm({
                          ...aboutForm,
                          showFacebook: e.target.checked,
                        })
                      }
                      className="mt-1"
                    />
                    <div className="flex-1 space-y-2">
                      <label className="text-sm font-medium">Facebook</label>
                      <Input
                        value={aboutForm.facebook}
                        onChange={(e) =>
                          setAboutForm({
                            ...aboutForm,
                            facebook: e.target.value,
                          })
                        }
                        placeholder="https://facebook.com/..."
                      />
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={aboutForm.showInstagram}
                      onChange={(e) =>
                        setAboutForm({
                          ...aboutForm,
                          showInstagram: e.target.checked,
                        })
                      }
                      className="mt-1"
                    />
                    <div className="flex-1 space-y-2">
                      <label className="text-sm font-medium">Instagram</label>
                      <Input
                        value={aboutForm.instagram}
                        onChange={(e) =>
                          setAboutForm({
                            ...aboutForm,
                            instagram: e.target.value,
                          })
                        }
                        placeholder="https://instagram.com/..."
                      />
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={aboutForm.showTiktok}
                      onChange={(e) =>
                        setAboutForm({
                          ...aboutForm,
                          showTiktok: e.target.checked,
                        })
                      }
                      className="mt-1"
                    />
                    <div className="flex-1 space-y-2">
                      <label className="text-sm font-medium">TikTok</label>
                      <Input
                        value={aboutForm.tiktok}
                        onChange={(e) =>
                          setAboutForm({
                            ...aboutForm,
                            tiktok: e.target.value,
                          })
                        }
                        placeholder="https://tiktok.com/@..."
                      />
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={aboutForm.showYoutube}
                      onChange={(e) =>
                        setAboutForm({
                          ...aboutForm,
                          showYoutube: e.target.checked,
                        })
                      }
                      className="mt-1"
                    />
                    <div className="flex-1 space-y-2">
                      <label className="text-sm font-medium">YouTube</label>
                      <Input
                        value={aboutForm.youtube}
                        onChange={(e) =>
                          setAboutForm({
                            ...aboutForm,
                            youtube: e.target.value,
                          })
                        }
                        placeholder="https://youtube.com/@..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Button disabled={busy} type="submit">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t.save}
              </Button>
            </form>
          </div>
        )}

        {tab === "sold" && (
          <div className="space-y-4 rounded-lg border p-4">
            <h2 className="font-semibold">{t.updateStatus}</h2>
            <FloatingInput
              label={t.searchByCactusId}
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
            />

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={statusView === "all" ? "default" : "outline"}
                onClick={() => setStatusView("all")}
              >
                {t.all} ({statusRows.all.length})
              </Button>
              <Button
                type="button"
                variant={statusView === "available" ? "default" : "outline"}
                onClick={() => setStatusView("available")}
              >
                {t.available} ({statusRows.available.length})
              </Button>
              <Button
                type="button"
                variant={statusView === "reserved" ? "default" : "outline"}
                onClick={() => setStatusView("reserved")}
              >
                {t.reserved} ({statusRows.reserved.length})
              </Button>
              <Button
                type="button"
                variant={statusView === "sold" ? "default" : "outline"}
                onClick={() => setStatusView("sold")}
              >
                {t.sold} ({statusRows.sold.length})
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type="button" variant="outline" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => changeStatus(row.id, "available")}
                      >
                        {t.available}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => changeStatus(row.id, "reserved")}
                      >
                        {t.reserved}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => changeStatus(row.id, "sold")}
                      >
                        {t.sold}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          </div>
        )}

        <Dialog
          open={deleteDialog.open}
          onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {adminLang === "th" ? "ยืนยันการลบ" : "Confirm Delete"}
              </DialogTitle>
              <DialogDescription>
                {adminLang === "th"
                  ? `คุณต้องการลบ "${deleteDialog.name}" จริงหรือไม่?`
                  : `Are you sure you want to delete "${deleteDialog.name}"?`}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() =>
                  setDeleteDialog({
                    open: false,
                    kind: null,
                    id: null,
                    name: "",
                  })
                }
              >
                {adminLang === "th" ? "ยกเลิก" : "Cancel"}
              </Button>
              <Button
                variant="destructive"
                onClick={executeDelete}
                disabled={busy}
              >
                {adminLang === "th" ? "ลบ" : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}
