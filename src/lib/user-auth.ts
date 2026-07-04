import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { NextResponse } from "next/server";

const USER_COOKIE_NAME = "user_session";
const USER_JWT_SECRET_ENV = "USER_JWT_SECRET";
const USER_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getUserSecret() {
  const secret = process.env[USER_JWT_SECRET_ENV];
  if (!secret) {
    throw new Error(`${USER_JWT_SECRET_ENV} environment variable is required`);
  }
  return new TextEncoder().encode(secret);
}

export function getUserCookieName() {
  return USER_COOKIE_NAME;
}

export async function signUserToken(email: string) {
  return await new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getUserSecret());
}

export async function verifyUserToken(token: string) {
  const result = await jwtVerify(token, getUserSecret());
  return result.payload as { email?: string; iat?: number; exp?: number };
}

export function setUserSessionCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: USER_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: USER_SESSION_MAX_AGE_SECONDS,
  });
}

export function clearUserSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: USER_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
}
