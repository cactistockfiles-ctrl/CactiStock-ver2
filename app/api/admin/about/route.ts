import { NextRequest, NextResponse } from "next/server";
import { writeFile, readFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "about.json");

export async function GET() {
  try {
    if (!existsSync(DATA_FILE)) {
      // Return default about content with i18n translations
      const defaultContent = {
        whoWeAre: "เราคือใคร",
        whoWeAreDesc: "เราเป็นทีมงานที่หลงใหในกระบองเพชรและต้นไม้สายพันธุ์หายาก ด้วยประสบการณ์กว่า 10 ปี เราพร้อมนำความรู้และความหลงใหใจมาบริการคุณ",
        ourMission: "พันธกิจของเรา",
        ourMissionDesc: "พันธกิจของเราคือการส่งเสริมและอนุรักษ์กระบองเพชรสายพันธุ์หายาก พร้อมนำเสนอต้นไม้คุณภาพสูงให้กับนักสะสมและผู้รักต้นไม้ทั่วโลก",
        step1Title: "เลือกกระบองเพชร",
        step1Desc: "เลือกกระบองเพชรที่คุณชอบจากแคตตาล็อกของเรา",
        step2Title: "ติดต่อเรา",
        step2Desc: "ติดต่อเราผ่าน LINE หรืออีเมลเพื่อสั่งซื้อ",
        step3Title: "รับกระบองเพชร",
        step3Desc: "รับกระบองเพชรของคุณที่จัดส่งด้วยบรรจุภัณฑ์พิเศษ",
        contactEmail: "cactistockfiles@gmail.com",
        contactLine: "cactistockfiles",
        additionalInfo: "",
        whoWeAreTranslations: {
          en: "Who We Are",
          zh: "我们是谁",
          id: "Siapa Kami",
        },
        whoWeAreDescTranslations: {
          en: "We are a team passionate about cacti and rare plant species. With over 10 years of experience, we are ready to serve you with knowledge and dedication.",
          zh: "我们是一个对仙人掌和稀有植物物种充满热情的团队。拥有超过10年的经验，我们准备用知识和奉献精神为您服务。",
          id: "Kami adalah tim yang bersemangat tentang kaktus dan spesies tanaman langka. Dengan pengalaman lebih dari 10 tahun, kami siap melayani Anda dengan pengetahuan dan dedikasi.",
        },
        ourMissionTranslations: {
          en: "Our Mission",
          zh: "我们的使命",
          id: "Misi Kami",
        },
        ourMissionDescTranslations: {
          en: "Our mission is to promote and preserve rare cactus species, while offering high-quality plants to collectors and plant lovers worldwide.",
          zh: "我们的使命是推广和保护稀有仙人掌物种，同时为全世界的收藏家和植物爱好者提供高质量的植物。",
          id: "Misi kami adalah untuk mempromosikan dan melestarikan spesies kaktus langka, sambil menawarkan tanaman berkualitas tinggi kepada kolektor dan pecinta tanaman di seluruh dunia.",
        },
        step1TitleTranslations: {
          en: "Select Cactus",
          zh: "选择仙人掌",
          id: "Pilih Kaktus",
        },
        step1DescTranslations: {
          en: "Choose your favorite cactus from our catalogue",
          zh: "从我们的目录中选择您最喜欢的仙人掌",
          id: "Pilih kaktus favorit Anda dari katalog kami",
        },
        step2TitleTranslations: {
          en: "Contact Us",
          zh: "联系我们",
          id: "Hubungi Kami",
        },
        step2DescTranslations: {
          en: "Contact us via LINE or email to place your order",
          zh: "通过 LINE 或电子邮件联系我们以订购",
          id: "Hubungi kami melalui LINE atau email untuk memesan",
        },
        step3TitleTranslations: {
          en: "Receive Cactus",
          zh: "接收仙人掌",
          id: "Terima Kaktus",
        },
        step3DescTranslations: {
          en: "Receive your cactus delivered with special packaging",
          zh: "接收用特殊包装运送的仙人掌",
          id: "Terima kaktus Anda yang dikirim dengan pengemasan khusus",
        },
        additionalInfoTranslations: {},
        showLine: true,
        facebook: "",
        showFacebook: false,
        instagram: "",
        showInstagram: false,
        tiktok: "",
        showTiktok: false,
        youtube: "",
        showYoutube: false,
      };
      return NextResponse.json(defaultContent);
    }

    const content = await readFile(DATA_FILE, "utf-8");
    return NextResponse.json(JSON.parse(content));
  } catch (error) {
    console.error("Error reading about data:", error);
    return NextResponse.json({ error: "Failed to read about data" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();

    // Ensure data directory exists
    const dataDir = path.dirname(DATA_FILE);
    if (!existsSync(dataDir)) {
      await mkdir(dataDir, { recursive: true });
    }

    await writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving about data:", error);
    return NextResponse.json({ error: "Failed to save about data" }, { status: 500 });
  }
}
