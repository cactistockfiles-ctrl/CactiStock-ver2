import { NextRequest, NextResponse } from "next/server";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const defaultRedirect = `${appUrl}/auth/google/success`;
  let redirect = defaultRedirect;

  if (state) {
    try {
      const decodedState = Buffer.from(state, "base64url").toString("utf8");
      const stateObj = JSON.parse(decodedState);
      if (stateObj?.redirect) {
        redirect = stateObj.redirect;
      }
    } catch (_) {
      redirect = defaultRedirect;
    }
  }

  if (redirect && !redirect.startsWith("http")) {
    redirect = `${appUrl}${redirect.startsWith("/") ? "" : "/"}${redirect}`;
  }

  if (!code) {
    return NextResponse.redirect(redirect);
  }

  const tokenResponse = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      redirect_uri: `${appUrl}/api/auth/callback/google`,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenResponse.ok) {
    return NextResponse.redirect(`${redirect}?error=token`);
  }

  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;
  if (!accessToken) {
    return NextResponse.redirect(`${redirect}?error=token`);
  }

  const userResponse = await fetch(USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!userResponse.ok) {
    return NextResponse.redirect(`${redirect}?error=userinfo`);
  }

  const userInfo = await userResponse.json();
  const params = new URLSearchParams({
    email: userInfo.email || "",
    displayName: userInfo.name || userInfo.email || "",
    avatarUrl: userInfo.picture || "",
    provider: "google",
    oauthId: userInfo.sub || "",
  });

  return NextResponse.redirect(`${redirect}?${params.toString()}`);
}
