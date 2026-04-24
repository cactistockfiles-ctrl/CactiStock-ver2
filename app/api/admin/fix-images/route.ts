import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, badRequest } from "@/lib/api-helpers";
import { getCacti, saveCacti } from "@/lib/content-store";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

function getR2Client(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 credentials are missing");
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const cacti = await getCacti();
    const publicUrl = process.env.R2_PUBLIC_URL;
    const bucket = process.env.R2_BUCKET_NAME;

    if (!publicUrl || !bucket) {
      return badRequest("R2 configuration missing");
    }

    const r2 = getR2Client();
    const baseUrl = publicUrl.endsWith("/") ? publicUrl.slice(0, -1) : publicUrl;

    // Find all files in R2
    const r2Files: Record<string, string[]> = {};
    const prefix = "cactistock/cacti/";

    const response = await r2.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
      })
    );

    if (response.Contents) {
      for (const file of response.Contents) {
        if (!file.Key) continue;
        const fileName = file.Key.split("/").pop();
        if (!fileName) continue;

        // Extract timestamp and name from file
        const timestampMatch = fileName.match(/^(\d+)-(.+)$/);
        if (timestampMatch) {
          const [, timestamp, nameWithExt] = timestampMatch;
          const fileUrl = `${baseUrl}/${file.Key}`;
          
          // Store by timestamp for matching
          if (!r2Files[timestamp]) {
            r2Files[timestamp] = [];
          }
          r2Files[timestamp].push(fileUrl);
        }
      }
    }

    // Fix broken items by matching with R2 files
    let fixed = 0;
    const fixedItems: Array<{ id: string; name: string; images: { top: string; side1: string; side2: string; side3: string; }; matched?: number }> = [];

    for (const item of cacti) {
      // Check if item has broken images
      const hasBroken = 
        !item.images.top?.startsWith("http") ||
        !item.images.side1?.startsWith("http") ||
        !item.images.side2?.startsWith("http") ||
        !item.images.side3?.startsWith("http");

      if (!hasBroken) continue;

      // Find matching files for this item
      const itemFiles = Object.entries(r2Files)
        .flatMap(([_, urls]) => urls)
        .filter(url => url.includes(item.id) || url.includes(item.name.replace(/\s+/g, "-")))
        .sort();

      if (itemFiles.length >= 4) {
        // Found all 4 images
        item.images = {
          top: itemFiles[0],
          side1: itemFiles[1],
          side2: itemFiles[2],
          side3: itemFiles[3],
        };
        fixed++;
        fixedItems.push({
          id: item.id,
          name: item.name,
          images: item.images,
        });
      } else if (itemFiles.length > 0) {
        // Partial match - fill what we have
        const urls = itemFiles;
        item.images = {
          top: urls[0] || item.images.top,
          side1: urls[1] || item.images.side1,
          side2: urls[2] || item.images.side2,
          side3: urls[3] || item.images.side3,
        };
        fixed++;
        fixedItems.push({
          id: item.id,
          name: item.name,
          matched: itemFiles.length,
          images: item.images,
        });
      }
    }

    if (fixed > 0) {
      await saveCacti(cacti);
      return NextResponse.json({
        ok: true,
        fixed,
        items: fixedItems,
        message: `Successfully fixed ${fixed} items`,
      });
    } else {
      return NextResponse.json({
        ok: false,
        fixed: 0,
        message: "No broken items found or unable to match files",
      });
    }
  } catch (error) {
    console.error("Auto-repair error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Auto-repair failed" },
      { status: 500 }
    );
  }
}

