"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/context/LocaleContext";
import { useUser } from "@/context/UserContext";

export default function RegisterPage() {
  const { locale } = useLocale();
  const router = useRouter();
  const { isAuthenticated, register } = useUser();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setBusy(false);
      return;
    }

    const result = await register({ email, password, displayName });
    setBusy(false);

    if (!result.ok) {
      setError(result.error || "Unable to register.");
      return;
    }

    router.push(`/${locale}/profile`);
  };

  return (
    <div className="container mx-auto py-16 px-4">
      <div className="mx-auto max-w-xl rounded-3xl border bg-card p-8 shadow-lg">
        <h1 className="text-3xl font-semibold">Register</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Create an account to save your cart and manage your profile.
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
            <label className="text-sm font-medium">Display name</label>
            <Input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
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
          <div className="space-y-2">
            <label className="text-sm font-medium">Confirm password</label>
            <Input
              required
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={busy}>
            Register
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href={`/${locale}/login`}
            className="font-medium text-primary underline"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
