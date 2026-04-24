import { NextRequest, NextResponse } from "next/server";
import { getCacti, saveCacti } from "@/lib/content-store";
import { badRequest, requireAdmin, revalidatePublicContent } from "@/lib/api-helpers";
import { CactusItem } from "@/types/content";
import { deleteImageFromR2 } from "@/lib/r2-server";

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
  
  // Revalidate public pages when cacti change
  await revalidatePublicContent();
  
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
  
  // Revalidate public pages when cacti change
  await revalidatePublicContent();
  
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
  const itemToDelete = rows.find((x) => x.id === id);
  
  if (!itemToDelete) {
    return badRequest("Cactus not found");
  }

  // Delete image files from R2
  const imageUrls = [
    itemToDelete.images.top,
    itemToDelete.images.side1,
    itemToDelete.images.side2,
    itemToDelete.images.side3,
  ].filter(Boolean); // Remove empty strings

  for (const url of imageUrls) {
    if (url.startsWith("http")) {
      await deleteImageFromR2(url);
    }
  }

  // Delete from Firestore
  const nextRows = rows.filter((x) => x.id !== id);
  await saveCacti(nextRows);
  
  // Revalidate public pages when cacti change
  await revalidatePublicContent();
  
  return NextResponse.json({ ok: true });
}
