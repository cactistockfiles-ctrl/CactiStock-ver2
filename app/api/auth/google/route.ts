import { NextRequest, NextResponse } from "next/server";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

export async function GET(req: NextRequest) {
  const redirect = req.nextUrl.searchParams.get("redirect") || "";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
  const callbackUrl = `${appUrl}/api/auth/callback/google`;
  const state = Buffer.from(
    JSON.stringify({ redirect: redirect || `${appUrl}/auth/google/success` }),
  ).toString("base64url");

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    redirect_uri: callbackUrl,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "select_account",
    state,
  });

  return NextResponse.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
}
