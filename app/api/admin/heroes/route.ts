import { NextRequest, NextResponse } from "next/server";
import { getHeroes, saveHeroes } from "@/lib/content-store";
import { badRequest, requireAdmin } from "@/lib/api-helpers";
import { HeroItem } from "@/types/content";

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  return NextResponse.json(await getHeroes());
}

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const payload = (await req.json()) as HeroItem;
  if (!payload.id || !payload.title || !payload.imageUrl) {
    return badRequest("Missing hero required fields");
  }

  const rows = await getHeroes();
  if (rows.some((x) => x.id === payload.id)) {
    return badRequest("Duplicated hero id");
  }

  rows.push(payload);
  await saveHeroes(rows);
  return NextResponse.json({ ok: true });
}

export async function PUT(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const payload = (await req.json()) as HeroItem;
  if (!payload.id) {
    return badRequest("Missing hero id");
  }

  const rows = await getHeroes();
  const idx = rows.findIndex((x) => x.id === payload.id);
  if (idx < 0) {
    return badRequest("Hero id not found");
  }

  rows[idx] = payload;
  await saveHeroes(rows);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return badRequest("Missing hero id");
  }

  const rows = await getHeroes();
  const nextRows = rows.filter((x) => x.id !== id);
  await saveHeroes(nextRows);
  return NextResponse.json({ ok: true });
}
