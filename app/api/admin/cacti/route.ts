import { NextRequest, NextResponse } from "next/server";
import { getCacti, saveCacti } from "@/lib/content-store";
import { badRequest, requireAdmin } from "@/lib/api-helpers";
import { CactusItem } from "@/types/content";

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  return NextResponse.json(await getCacti());
}

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const payload = (await req.json()) as CactusItem;
  if (!payload.id || !payload.name) {
    return badRequest("Missing cactus id or name");
  }

  const rows = await getCacti();
  if (rows.some((x) => x.id === payload.id)) {
    return badRequest("Duplicated cactus id");
  }

  rows.push({ ...payload, createdAt: payload.createdAt || new Date().toISOString() });
  await saveCacti(rows);
  return NextResponse.json({ ok: true });
}

export async function PUT(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const payload = (await req.json()) as CactusItem;
  if (!payload.id) {
    return badRequest("Missing cactus id");
  }

  const rows = await getCacti();
  const idx = rows.findIndex((x) => x.id === payload.id);
  if (idx < 0) {
    return badRequest("Cactus id not found");
  }

  rows[idx] = { ...payload, createdAt: rows[idx].createdAt };
  await saveCacti(rows);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return badRequest("Missing cactus id");
  }

  const rows = await getCacti();
  const nextRows = rows.filter((x) => x.id !== id);
  await saveCacti(nextRows);
  return NextResponse.json({ ok: true });
}
