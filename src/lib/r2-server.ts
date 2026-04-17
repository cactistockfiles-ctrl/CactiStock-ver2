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
};

function guessMime(fileName: string, fallback?: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  return MIME_MAP[ext] ?? fallback ?? "image/jpeg";
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
  const mime = contentType ?? guessMime(fileName);

  await r2.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: fileBuffer,
      ContentType: mime,
    }),
  );

  const url = `${publicUrl.replace(/\/$/, "")}/${key}`;

  return { url, key };
}
