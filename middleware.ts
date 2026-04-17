import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { isLocale, LOCALES } from "@/lib/i18n";

const PUBLIC_FILE = /\.(.*)$/;

function getSecret() {
  const secret = process.env.ADMIN_JWT_SECRET || "change_me_please";
  return new TextEncoder().encode(secret);
}

async function isAdmin(req: NextRequest) {
  const token = req.cookies.get("admin_session")?.value;
  if (!token) {
    return false;
  }

  try {
    await jwtVerify(token, getSecret());
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/_next") || pathname.startsWith("/api") || PUBLIC_FILE.test(pathname)) {
    return NextResponse.next();
  }

  const parts = pathname.split("/").filter(Boolean);
  const maybeLocale = parts[0];

  if (maybeLocale && isLocale(maybeLocale) && parts[1] === "admin") {
    const adminPath = `/${parts.slice(1).join("/")}`;
    return NextResponse.redirect(new URL(adminPath || "/admin", req.url));
  }

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!(await isAdmin(req))) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }

    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  if (maybeLocale && isLocale(maybeLocale)) {
    return NextResponse.next();
  }

  if (pathname === "/") {
    return NextResponse.next();
  }

  const locale = req.cookies.get("locale")?.value;
  const targetLocale = locale && isLocale(locale) ? locale : LOCALES[0];
  return NextResponse.redirect(new URL(`/${targetLocale}${pathname}`, req.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
