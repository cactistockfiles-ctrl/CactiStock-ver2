import { NextResponse } from "next/server";
import { requireAdmin, badRequest } from "@/lib/api-helpers";
import { uploadImageToR2 } from "@/lib/r2-server";

export async function POST(req: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const folder = String(formData.get("folder") || "cactistock/uploads");

    if (!(file instanceof File)) {
      return badRequest("Missing file upload");
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return badRequest("File is too large (max 10MB). Maximum allowed: 10MB");
    }

    // Validate it's an image file
    if (!file.type.startsWith("image/")) {
      console.warn(`Invalid file type: ${file.type}, name: ${file.name}`);
      // Still try to process - we have MIME detection
    }

    // Get file extension
    let ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    
    // Handle Android images that might come without proper extension
    if (!ext || ext === file.name) {
      // Try to detect from MIME type
      const mimeToExt: Record<string, string> = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
        "image/gif": "gif",
        "image/heic": "heic",
        "image/heif": "heif",
        "image/avif": "avif",
        "image/svg+xml": "svg",
        "image/bmp": "bmp",
        "image/tiff": "tiff",
      };
      ext = mimeToExt[file.type] || "jpg";
      console.log(`Detected extension from MIME type: ${file.type} -> ${ext}`);
    }

    // Sanitize filename
    const nameWithoutExt = file.name
      .replace(/\.[^.]+$/, "") // Remove extension
      .replace(/[^a-zA-Z0-9-_]/g, "-") // Replace special chars with dashes
      .replace(/-+/g, "-") // Remove multiple dashes
      .slice(0, 50); // Limit length
    
    const fileName = nameWithoutExt 
      ? `${Date.now()}-${nameWithoutExt}.${ext}` 
      : `${Date.now()}.${ext}`;

    console.log(`Uploading file: ${fileName} to folder: ${folder}, size: ${file.size}, mime: ${file.type}`);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploaded = await uploadImageToR2(
      buffer, 
      folder, 
      fileName, 
      file.type || undefined
    );

    console.log(`Upload successful: ${uploaded.url}`);

    return NextResponse.json({
      ok: true,
      url: uploaded.url,
      key: uploaded.key,
      fileName: fileName,
      size: file.size,
      mimeType: file.type,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Upload error:", errorMessage, error);
    return NextResponse.json(
      {
        ok: false,
        error: errorMessage,
      },
      { status: 500 },
    );
  }
}
