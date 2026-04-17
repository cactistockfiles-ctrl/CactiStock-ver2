import { NextRequest, NextResponse } from "next/server";
import { getBlogs, saveBlogs } from "@/lib/content-store";
import { badRequest, requireAdmin } from "@/lib/api-helpers";
import { BlogPost } from "@/types/content";

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  return NextResponse.json(await getBlogs());
}

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const payload = (await req.json()) as BlogPost;
  if (!payload.id || !payload.title) {
    return badRequest("Missing blog id or title");
  }

  if ((payload.gallery ?? []).length > 8) {
    return badRequest("Blog gallery supports maximum 8 images");
  }

  const rows = await getBlogs();
  if (rows.some((x) => x.id === payload.id)) {
    return badRequest("Duplicated blog id");
  }

  rows.push({ ...payload, createdAt: payload.createdAt || new Date().toISOString() });
  await saveBlogs(rows);
  return NextResponse.json({ ok: true });
}

export async function PUT(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const payload = (await req.json()) as BlogPost;
  if (!payload.id) {
    return badRequest("Missing blog id");
  }

  if ((payload.gallery ?? []).length > 8) {
    return badRequest("Blog gallery supports maximum 8 images");
  }

  const rows = await getBlogs();
  const idx = rows.findIndex((x) => x.id === payload.id);
  if (idx < 0) {
    return badRequest("Blog id not found");
  }

  rows[idx] = { ...payload, createdAt: rows[idx].createdAt };
  await saveBlogs(rows);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return badRequest("Missing blog id");
  }

  const rows = await getBlogs();
  const nextRows = rows.filter((x) => x.id !== id);
  await saveBlogs(nextRows);
  return NextResponse.json({ ok: true });
}
