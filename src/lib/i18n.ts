import { Locale } from "@/types/content";

export const LOCALES: Locale[] = ["th", "en", "zh", "id"];

export const localeLabels: Record<Locale, string> = {
  th: "ไทย",
  en: "English",
  zh: "中文",
  id: "Bahasa",
};

export function isLocale(value: string): value is Locale {
  return LOCALES.includes(value as Locale);
}

type MessageTree = {
  [key: string]: string | MessageTree;
};

const messages: Record<Locale, MessageTree> = {
  th: {
    nav: {
      home: "หน้าหลัก",
      catalogue: "แคตตาล็อก",
      about: "เกี่ยวกับเรา",
      blog: "บล็อก",
      cart: "ตะกร้า",
    },
    home: {
      title: "คอลเลกชัน\\nกระบองเพชรหายาก",
      subtitle: "แหล่งรวมกระบองเพชรคุณภาพสูงจากทั่วโลก สำหรับนักสะสมและผู้รักต้นไม้ตัวจริง",
      ctaCatalogue: "ดูแคตตาล็อก",
      ctaAbout: "เกี่ยวกับเรา",
      featured: "กระบองเพชรยอดนิยม",
      featuredSub: "สายพันธุ์เด่นที่คัดเลือกมาเพื่อคุณ",
      latestBlog: "บทความล่าสุด",
      latestBlogSub: "ความรู้เกี่ยวกับกระบองเพชร",
      features: {
        quality: "คุณภาพสูง",
        shipping: "จัดส่งปลอดภัย",
        guarantee: "รับประกันคุณภาพ",
      },
    },
    catalogue: {
      title: "แคตตาล็อก",
      subtitle: "รวมกระบองเพชรทุกสายพันธุ์ที่พร้อมจำหน่าย",
      newest: "มาใหม่ล่าสุด",
      oldest: "เก่าที่สุด",
      allFamilies: "ทุกวงศ์",
      sold: "ขายแล้ว",
    },
    footer: {
      quickLinks: "ลิงก์ด่วน",
      contact: "ติดต่อเรา",
      copyright: "© 2026 Cacti Stock. All rights reserved.",
      adminLogin: "login for admin",
    },
    common: {
      all: "ทั้งหมด",
      readMore: "อ่านเพิ่มเติม",
      addToCart: "เพิ่ม",
      addToCartLong: "เพิ่มลงตะกร้า",
      viewAll: "ดูทั้งหมด",
      sizeCm: "ขนาด",
      orderInfo: "ข้อมูลการสั่งซื้อ",
    },
  },
  en: {
    nav: {
      home: "Home",
      catalogue: "Catalogue",
      about: "About",
      blog: "Blog",
      cart: "Cart",
    },
    home: {
      title: "Rare\\nCactus Collection",
      subtitle: "Premium cacti from around the world for serious collectors.",
      ctaCatalogue: "Browse Catalogue",
      ctaAbout: "About Us",
      featured: "Featured Cacti",
      featuredSub: "Curated rare picks for your collection",
      latestBlog: "Latest Articles",
      latestBlogSub: "Guides and stories from our greenhouse",
      features: {
        quality: "Premium Quality",
        shipping: "Safe Delivery",
        guarantee: "Health Guarantee",
      },
    },
    catalogue: {
      title: "Catalogue",
      subtitle: "Every cactus currently available",
      newest: "Newest",
      oldest: "Oldest",
      allFamilies: "All Families",
      sold: "Sold",
    },
    footer: {
      quickLinks: "Quick Links",
      contact: "Contact",
      copyright: "© 2026 Cacti Stock. All rights reserved.",
      adminLogin: "login for admin",
    },
    common: {
      all: "All",
      readMore: "Read more",
      addToCart: "Add",
      addToCartLong: "Add to cart",
      viewAll: "View all",
      sizeCm: "Size",
      orderInfo: "Order Information",
    },
  },
  zh: {
    nav: {
      home: "首页",
      catalogue: "目录",
      about: "关于我们",
      blog: "博客",
      cart: "购物车",
    },
    home: {
      title: "稀有\\n仙人掌收藏",
      subtitle: "为收藏家精选来自世界各地的高品质仙人掌。",
      ctaCatalogue: "查看目录",
      ctaAbout: "关于我们",
      featured: "精选仙人掌",
      featuredSub: "为你挑选的稀有品种",
      latestBlog: "最新文章",
      latestBlogSub: "仙人掌养护与知识",
      features: {
        quality: "高品质",
        shipping: "安全配送",
        guarantee: "品质保障",
      },
    },
    catalogue: {
      title: "目录",
      subtitle: "所有可售仙人掌",
      newest: "最新",
      oldest: "最早",
      allFamilies: "全部属名",
      sold: "已售",
    },
    footer: {
      quickLinks: "快捷链接",
      contact: "联系我们",
      copyright: "© 2026 Cacti Stock. All rights reserved.",
      adminLogin: "login for admin",
    },
    common: {
      all: "全部",
      readMore: "阅读更多",
      addToCart: "加入",
      addToCartLong: "加入购物车",
      viewAll: "查看全部",
      sizeCm: "尺寸",
      orderInfo: "订单信息",
    },
  },
  id: {
    nav: {
      home: "Beranda",
      catalogue: "Katalog",
      about: "Tentang",
      blog: "Blog",
      cart: "Keranjang",
    },
    home: {
      title: "Koleksi\\nKaktus Langka",
      subtitle: "Kaktus premium dari seluruh dunia untuk kolektor sejati.",
      ctaCatalogue: "Lihat Katalog",
      ctaAbout: "Tentang Kami",
      featured: "Kaktus Unggulan",
      featuredSub: "Pilihan kurasi terbaik untuk koleksi Anda",
      latestBlog: "Artikel Terbaru",
      latestBlogSub: "Panduan dan wawasan seputar kaktus",
      features: {
        quality: "Kualitas Tinggi",
        shipping: "Pengiriman Aman",
        guarantee: "Garansi Kualitas",
      },
    },
    catalogue: {
      title: "Katalog",
      subtitle: "Semua kaktus yang tersedia saat ini",
      newest: "Terbaru",
      oldest: "Terlama",
      allFamilies: "Semua Famili",
      sold: "Terjual",
    },
    footer: {
      quickLinks: "Tautan Cepat",
      contact: "Kontak",
      copyright: "© 2026 Cacti Stock. All rights reserved.",
      adminLogin: "login for admin",
    },
    common: {
      all: "Semua",
      readMore: "Baca selengkapnya",
      addToCart: "Tambah",
      addToCartLong: "Tambah ke keranjang",
      viewAll: "Lihat semua",
      sizeCm: "Ukuran",
      orderInfo: "Informasi Pesanan",
    },
  },
};

export function t(locale: Locale, path: string): string {
  const keys = path.split(".");
  let cursor: string | MessageTree = messages[locale] ?? messages.th;

  for (const key of keys) {
    if (typeof cursor !== "object" || !(key in cursor)) {
      return path;
    }
    cursor = cursor[key] as string | MessageTree;
  }

  return typeof cursor === "string" ? cursor : path;
}
