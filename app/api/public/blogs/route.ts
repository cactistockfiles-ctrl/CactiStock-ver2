import { NextResponse } from "next/server";
import { getBlogs } from "@/lib/content-store";

export async function GET() {
  const items = await getBlogs();
  return NextResponse.json(items);
}
