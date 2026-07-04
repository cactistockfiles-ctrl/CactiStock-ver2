import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/firebase-server";
import { setUserSessionCookie, signUserToken } from "@/lib/user-auth";
import { UserAccount, UserProfile } from "@/types/user";

const USERS_COLLECTION = "users";

function normalizeEmail(email?: string) {
  return String(email ?? "").trim().toLowerCase();
}

function userDocId(email: string) {
  return normalizeEmail(email);
}

async function getUserByEmail(email: string) {
  const db = getDb();
  const doc = await db.collection(USERS_COLLECTION).doc(userDocId(email)).get();
  return doc.exists ? (doc.data() as UserAccount) : null;
}

function profileFromAccount(account: UserAccount): UserProfile {
  const { passwordHash, oauthProvider, oauthId, ...profile } = account;
  return profile;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  try {
    const action = String(body?.action ?? "").trim();
    const email = normalizeEmail(body?.email);

    if (!email) {
      return NextResponse.json({ ok: false, error: "Email is required." }, { status: 400 });
    }

    const db = getDb();
    const userRef = db.collection(USERS_COLLECTION).doc(userDocId(email));
    const existingAccount = await getUserByEmail(email);

    if (action === "register") {
      const password = String(body?.password ?? "").trim();
      if (!password) {
        return NextResponse.json({ ok: false, error: "Password is required." }, { status: 400 });
      }
      if (existingAccount) {
        return NextResponse.json({ ok: false, error: "Account already exists." }, { status: 409 });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const profile: UserProfile = {
        email,
        displayName: String(body?.displayName ?? email),
      };
      const account: UserAccount = {
        ...profile,
        passwordHash,
      };

      await userRef.set(account);
      const authToken = await signUserToken(email);
      const response = NextResponse.json({ ok: true, user: profile });
      setUserSessionCookie(response, authToken);
      return response;
    }

    if (action === "login") {
      const password = String(body?.password ?? "").trim();
      if (!password) {
        return NextResponse.json({ ok: false, error: "Password is required." }, { status: 400 });
      }
      if (!existingAccount || !existingAccount.passwordHash) {
        return NextResponse.json(
          { ok: false, error: "No account found with this email." },
          { status: 401 },
        );
      }

      const match = await bcrypt.compare(password, existingAccount.passwordHash);
      if (!match) {
        return NextResponse.json({ ok: false, error: "Incorrect password." }, { status: 401 });
      }

      const authToken = await signUserToken(email);
      const response = NextResponse.json({ ok: true, user: profileFromAccount(existingAccount) });
      setUserSessionCookie(response, authToken);
      return response;
    }

    if (action === "oauth") {
      const provider = String(body?.provider ?? "").trim();
      const oauthId = String(body?.oauthId ?? "").trim();
      const displayName = String(body?.displayName ?? email);
      const avatarUrl = String(body?.avatarUrl ?? "");

      if (!provider || !oauthId) {
        return NextResponse.json(
          { ok: false, error: "OAuth provider and id are required." },
          { status: 400 },
        );
      }

      if (existingAccount) {
        if (existingAccount.oauthId && existingAccount.oauthId !== oauthId) {
          return NextResponse.json(
            { ok: false, error: "OAuth account mismatch." },
            { status: 401 },
          );
        }

        const updatedAccount: UserAccount = {
          ...existingAccount,
          displayName,
          avatarUrl,
          oauthProvider: provider,
          oauthId,
          passwordHash: existingAccount.passwordHash ?? "",
        };
        await userRef.set(updatedAccount, { merge: true });

        const authToken = await signUserToken(email);
        const response = NextResponse.json({ ok: true, user: profileFromAccount(updatedAccount) });
        setUserSessionCookie(response, authToken);
        return response;
      }

      const profile: UserProfile = {
        email,
        displayName,
        avatarUrl,
      };
      const account: UserAccount = {
        ...profile,
        oauthProvider: provider,
        oauthId,
        passwordHash: "",
      };

      await userRef.set(account);
      const authToken = await signUserToken(email);
      const response = NextResponse.json({ ok: true, user: profile });
      setUserSessionCookie(response, authToken);
      return response;
    }

    if (action === "change-password") {
      const currentPassword = String(body?.currentPassword ?? "").trim();
      const newPassword = String(body?.newPassword ?? "").trim();

      if (!currentPassword || !newPassword) {
        return NextResponse.json(
          { ok: false, error: "Current and new password are required." },
          { status: 400 },
        );
      }

      if (!existingAccount || !existingAccount.passwordHash) {
        return NextResponse.json(
          { ok: false, error: "This account uses OAuth login. Password change is not available." },
          { status: 400 },
        );
      }

      const match = await bcrypt.compare(currentPassword, existingAccount.passwordHash);
      if (!match) {
        return NextResponse.json(
          { ok: false, error: "Current password is incorrect." },
          { status: 401 },
        );
      }

      const newPasswordHash = await bcrypt.hash(newPassword, 10);
      await userRef.set({ passwordHash: newPasswordHash }, { merge: true });

      return NextResponse.json({ ok: true, user: profileFromAccount(existingAccount) });
    }

    return NextResponse.json({ ok: false, error: "Invalid account action." }, { status: 400 });
  } catch (err) {
    // Log full context for debugging (avoid logging secrets in production)
    console.error("[user/account] POST handler error", {
      error: err instanceof Error ? err.stack || err.message : err,
      body,
    });
    return NextResponse.json({ ok: false, error: "Internal server error." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = normalizeEmail(body?.email);
  const updates = body?.updates;

  if (!email) {
    return NextResponse.json({ ok: false, error: "Email is required." }, { status: 400 });
  }

  if (!updates || typeof updates !== "object") {
    return NextResponse.json({ ok: false, error: "Profile updates are required." }, { status: 400 });
  }

  const db = getDb();
  const userRef = db.collection(USERS_COLLECTION).doc(userDocId(email));
  const snapshot = await userRef.get();

  if (!snapshot.exists) {
    return NextResponse.json({ ok: false, error: "User not found." }, { status: 404 });
  }

  const cleanedUpdates: Partial<Omit<UserProfile, "email">> = {};
  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined || key === "email") continue;
    cleanedUpdates[key as keyof Omit<UserProfile, "email">] = value as any;
  }

  if (Object.keys(cleanedUpdates).length === 0) {
    return NextResponse.json({ ok: false, error: "No profile updates provided." }, { status: 400 });
  }

  await userRef.set({ ...cleanedUpdates, updatedAt: new Date().toISOString() }, { merge: true });
  const updatedAccountSnapshot = await userRef.get();
  const updatedAccount = updatedAccountSnapshot.data() as UserAccount;

  return NextResponse.json({ ok: true, user: profileFromAccount(updatedAccount) });
}
