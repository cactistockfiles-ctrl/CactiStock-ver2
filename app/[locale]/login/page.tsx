"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/context/LocaleContext";
import { useUser } from "@/context/UserContext";

export default function LoginPage() {
  const { locale } = useLocale();
  const router = useRouter();
  const { isAuthenticated, login } = useUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.push(`/${locale}`);
    }
  }, [isAuthenticated, locale, router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setBusy(true);

    const result = await login(email, password);
    setBusy(false);

    if (!result.ok) {
      setError(result.error || "Unable to login.");
      return;
    }

    router.push(`/${locale}/profile`);
  };

  return (
    <div className="container mx-auto py-16 px-4">
      <div className="mx-auto max-w-xl rounded-3xl border bg-card p-8 shadow-lg">
        <h1 className="text-3xl font-semibold">Login</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Login to save your cart and access your profile.
        </p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <Input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={busy}>
            Login
          </Button>
        </form>

        <div className="mt-6 space-y-3">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => {
              const redirect = encodeURIComponent(
                `${window.location.origin}/${locale}/auth/google/success`,
              );
              window.location.href = `/api/auth/google?redirect=${redirect}`;
            }}
          >
            <span className="inline-flex items-center justify-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-white">
                <svg
                  viewBox="0 0 533.5 544.3"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path
                    fill="#4285F4"
                    d="M533.5 278.4c0-18.4-1.7-36.1-5-53.3H272v100.8h146.9c-6.3 34.1-25 62.9-53.3 82.2v68.3h86.2c50.4-46.5 79.7-114.8 79.7-197.9z"
                  />
                  <path
                    fill="#34A853"
                    d="M272 544.3c72.6 0 133.5-24.1 178-65.5l-86.2-68.3c-24 16.2-54.8 25.8-91.8 25.8-70.6 0-130.4-47.6-151.9-111.4H33.5v69.9C77.5 475.8 169.4 544.3 272 544.3z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M120.1 323.9c-10.9-32.4-10.9-67.3 0-99.7V154.3H33.5c-33.7 67.1-33.7 146.4 0 213.5l86.6-44z"
                  />
                  <path
                    fill="#EA4335"
                    d="M272 109.7c39.6 0 75.3 13.6 103.3 40.1l77.4-77.4C403.9 24.9 344.1 0 272 0 169.4 0 77.5 68.5 33.5 154.3l86.6 69.9C141.6 157.3 201.4 109.7 272 109.7z"
                  />
                </svg>
              </span>
              Continue with Google
            </span>
          </Button>
        </div>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href={`/${locale}/register`}
            className="font-medium text-primary underline"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
