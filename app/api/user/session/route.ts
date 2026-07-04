import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/lib/firebase-server";
import { verifyUserToken, getUserCookieName, clearUserSessionCookie } from "@/lib/user-auth";
import { UserProfile, UserAccount } from "@/types/user";

const USERS_COLLECTION = "users";

function userDocId(email: string) {
  return String(email ?? "").trim().toLowerCase();
}

async function getUserByEmail(email: string) {
  const db = getDb();
  const doc = await db.collection(USERS_COLLECTION).doc(userDocId(email)).get();
  return doc.exists ? (doc.data() as UserAccount) : null;
}

export async function GET() {
  const token = cookies().get(getUserCookieName())?.value;
  if (!token) {
    return NextResponse.json({ ok: false, error: "Not authenticated." }, { status: 401 });
  }

  let payload;
  try {
    payload = await verifyUserToken(token);
  } catch (error) {
    return NextResponse.json({ ok: false, error: "Invalid session." }, { status: 401 });
  }

  const email = payload?.email?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ ok: false, error: "Invalid session payload." }, { status: 401 });
  }

  const account = await getUserByEmail(email);
  if (!account) {
    return NextResponse.json({ ok: false, error: "User not found." }, { status: 404 });
  }

  const { passwordHash, ...profile } = account;
  return NextResponse.json({ ok: true, user: profile as UserProfile });
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  clearUserSessionCookie(response);
  return response;
}
