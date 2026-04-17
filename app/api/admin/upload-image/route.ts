import { NextResponse } from "next/server";
import { requireAdmin, badRequest } from "@/lib/api-helpers";
import { uploadImageToR2 } from "@/lib/r2-server";

export async function POST(req: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const formData = await req.formData();
  const file = formData.get("file");
  const folder = String(formData.get("folder") || "cactistock/uploads");

  if (!(file instanceof File)) {
    return badRequest("Missing file upload");
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const ext = file.name.split(".").pop() ?? "jpg";
  const nameWithoutExt = file.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9-_]/g, "-");
  const fileName = `${Date.now()}-${nameWithoutExt}.${ext}`;

  try {
    const uploaded = await uploadImageToR2(buffer, folder, fileName, file.type || undefined);

    return NextResponse.json({
      ok: true,
      url: uploaded.url,
      key: uploaded.key,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "R2 upload failed",
      },
      { status: 500 },
    );
  }
}
