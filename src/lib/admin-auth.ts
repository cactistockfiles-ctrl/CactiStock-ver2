import "server-only";

import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "admin_session";

function getSecret() {
  const secret = process.env.ADMIN_JWT_SECRET || "change_me_please";
  return new TextEncoder().encode(secret);
}

export async function validateAdminCredential(username: string, password: string) {
  const expectedUser = process.env.ADMIN_USERNAME || "admin";
  const expectedHash = process.env.ADMIN_PASSWORD_HASH;
  const expectedPass = process.env.ADMIN_PASSWORD;

  if (username !== expectedUser) {
    return false;
  }

  if (expectedHash) {
    return await bcrypt.compare(password, expectedHash);
  }

  return password === (expectedPass || "admin1234");
}

export async function signAdminToken() {
  return await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(getSecret());
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
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

export const adminCookieName = COOKIE_NAME;
