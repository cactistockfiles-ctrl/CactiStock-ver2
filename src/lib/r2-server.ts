import "server-only";

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

let client: S3Client | null = null;

function getR2Client(): S3Client {
  if (client) return client;

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 credentials are missing");
  }

  client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });

  return client;
}

const MIME_MAP: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  avif: "image/avif",
  heic: "image/heic",
  heif: "image/heif",
  bmp: "image/bmp",
  tiff: "image/tiff",
};

function guessMime(fileName: string, fallback?: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  return MIME_MAP[ext] ?? fallback ?? "image/jpeg";
}

// Detect MIME type from file buffer magic bytes (more reliable)
function detectMimeFromBuffer(buffer: Buffer): string {
  if (buffer.length < 4) return "image/jpeg";

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return "image/png";
  }
  // WebP: 52 49 46 46 ... 57 45 42 50
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
    if (buffer.length >= 12 && buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
      return "image/webp";
    }
  }
  // GIF: 47 49 46
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
    return "image/gif";
  }
  // BMP: 42 4D
  if (buffer[0] === 0x42 && buffer[1] === 0x4d) {
    return "image/bmp";
  }

  return "image/jpeg";
}

export async function uploadImageToR2(
  fileBuffer: Buffer,
  folder: string,
  fileName: string,
  contentType?: string,
): Promise<{ url: string; key: string }> {
  const r2 = getR2Client();
  const bucket = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL;

  if (!bucket) {
    throw new Error("R2_BUCKET_NAME is missing");
  }
  if (!publicUrl) {
    throw new Error("R2_PUBLIC_URL is missing");
  }

  const key = `${folder}/${fileName}`;
  
  // Determine MIME type with fallback strategy:
  // 1. Use provided contentType if available
  // 2. Detect from file buffer magic bytes
  // 3. Guess from filename extension
  let mime = contentType;
  if (!mime || mime === "application/octet-stream") {
    mime = detectMimeFromBuffer(fileBuffer);
  }
  if (!mime || mime === "application/octet-stream") {
    mime = guessMime(fileName);
  }

  try {
    await r2.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: fileBuffer,
        ContentType: mime,
        CacheControl: "public, max-age=31536000", // Cache for 1 year since files are immutable
      }),
    );
  } catch (error) {
    throw new Error(
      `Failed to upload to R2: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }

  // Construct public URL ensuring it's properly formatted
  const baseUrl = publicUrl.endsWith("/") ? publicUrl.slice(0, -1) : publicUrl;
  const url = `${baseUrl}/${key}`;

  // Verify URL is valid
  if (!url.startsWith("http")) {
    throw new Error(`Invalid generated URL: ${url}`);
  }

  return { url, key };
}
