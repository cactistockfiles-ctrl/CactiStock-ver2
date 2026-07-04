"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { toast } from "sonner";

interface GoogleAuthSuccessProps {
  locale?: string;
}

export default function GoogleAuthSuccess({ locale }: GoogleAuthSuccessProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginWithOAuth } = useUser();

  useEffect(() => {
    const email = searchParams.get("email");
    const displayName = searchParams.get("displayName") || undefined;
    const avatarUrl = searchParams.get("avatarUrl") || undefined;
    const provider = searchParams.get("provider") as "google" | null;
    const oauthId = searchParams.get("oauthId") || undefined;
    const destination = locale ? `/${locale}` : "/";

    async function finishAuth() {
      if (!email || provider !== "google" || !oauthId) {
        toast.error("OAuth sign-in failed.");
        router.push(destination);
        return;
      }

      const result = await loginWithOAuth({
        email,
        displayName,
        avatarUrl,
        provider,
        oauthId,
      });

      if (!result.ok) {
        toast.error(result.error || "Unable to sign in.");
      } else {
        toast.success("Signed in with Google.");
      }

      router.push(destination);
    }

    finishAuth();
  }, [locale, loginWithOAuth, router, searchParams]);

  return (
    <div className="container mx-auto py-16 px-4">
      <div className="mx-auto max-w-xl rounded-3xl border bg-card p-8 text-center shadow-lg">
        <h1 className="text-3xl font-semibold">Signing in...</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Please wait while we complete your login.
        </p>
      </div>
    </div>
  );
}
