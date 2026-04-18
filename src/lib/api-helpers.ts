import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export async function requireAdmin() {
  const ok = await isAdminAuthenticated();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

/**
 * Revalidate all user-facing pages when content changes
 * This clears Next.js cache for dynamic pages
 */
export async function revalidatePublicContent() {
  try {
    // Revalidate home page and all locale variants
    await revalidatePath("/", "layout");
    // Revalidate catalogue, blog, news, about pages
    await revalidatePath("/[locale]/catalogue", "page");
    await revalidatePath("/[locale]/blog", "page");
    await revalidatePath("/[locale]/news", "page");
    await revalidatePath("/[locale]/about", "page");
  } catch (error) {
    console.error("Failed to revalidate cache:", error);
  }
}
