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
