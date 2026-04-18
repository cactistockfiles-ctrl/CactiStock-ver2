import { NextRequest, NextResponse } from "next/server";
import { getNews, saveNews } from "@/lib/content-store";
import { badRequest, requireAdmin, revalidatePublicContent } from "@/lib/api-helpers";
import { NewsItem } from "@/types/content";

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  return NextResponse.json(await getNews());
}

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const payload = (await req.json()) as NewsItem;
  if (!payload.id || !payload.title) {
    return badRequest("Missing news id or title");
  }

  if ((payload.gallery ?? []).length > 8) {
    return badRequest("News gallery supports maximum 8 images");
  }

  const rows = await getNews();
  if (rows.some((x) => x.id === payload.id)) {
    return badRequest("Duplicated news id");
  }

  rows.push({ ...payload, createdAt: payload.createdAt || new Date().toISOString() });
  await saveNews(rows);
  
  // Revalidate public pages when news change
  await revalidatePublicContent();
  
  return NextResponse.json({ ok: true });
}

export async function PUT(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const payload = (await req.json()) as NewsItem;
  if (!payload.id) {
    return badRequest("Missing news id");
  }

  if ((payload.gallery ?? []).length > 8) {
    return badRequest("News gallery supports maximum 8 images");
  }

  const rows = await getNews();
  const idx = rows.findIndex((x) => x.id === payload.id);
  if (idx < 0) {
    return badRequest("News id not found");
  }

  rows[idx] = { ...payload, createdAt: rows[idx].createdAt };
  await saveNews(rows);
  
  // Revalidate public pages when news change
  await revalidatePublicContent();
  
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return badRequest("Missing news id");
  }

  const rows = await getNews();
  const nextRows = rows.filter((x) => x.id !== id);
  await saveNews(nextRows);
  
  // Revalidate public pages when news change
  await revalidatePublicContent();
  
  return NextResponse.json({ ok: true });
}
