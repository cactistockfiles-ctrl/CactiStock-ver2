import { NextResponse } from "next/server";
import { uploadImageToR2 } from "@/lib/r2-server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const folder = String(formData.get("folder") || "cactistock/payment-proofs");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Missing file upload" },
        { status: 400 },
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File is too large (max 10MB)" },
        { status: 400 },
      );
    }

    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9-_\.]/g, "-")}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploaded = await uploadImageToR2(
      buffer,
      folder,
      fileName,
      file.type || undefined,
    );

    return NextResponse.json({ ok: true, url: uploaded.url, key: uploaded.key });
  } catch (error) {
    console.error("Upload proof error:", error);
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to upload payment proof.",
      },
      { status: 500 },
    );
  }
}
