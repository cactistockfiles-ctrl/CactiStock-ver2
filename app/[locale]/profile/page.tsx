"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLocale } from "@/context/LocaleContext";
import { useUser } from "@/context/UserContext";

export default function ProfilePage() {
  const { locale } = useLocale();
  const router = useRouter();
  const { user, isAuthenticated, updateProfile } = useUser();
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/${locale}/login`);
      return;
    }

    if (user) {
      setDisplayName(user.displayName || "");
      setPhone(user.phone || "");
      setAddress(user.address || "");
      setAvatarUrl(user.avatarUrl);
    }
  }, [isAuthenticated, locale, router, user]);

  const handleAvatarChange = (file?: File) => {
    if (!file) {
      setAvatarUrl(undefined);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAvatarUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setBusy(true);

    const result = await updateProfile({
      displayName: displayName.trim() || undefined,
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      avatarUrl: avatarUrl || undefined,
    });

    setBusy(false);
    if (!result.ok) {
      setError(result.error || "Unable to save profile.");
      return;
    }

    setSuccess("Profile updated successfully.");
  };

  return (
    <div className="container mx-auto py-16 px-4">
      <div className="mx-auto max-w-3xl rounded-3xl border bg-card p-8 shadow-lg">
        <h1 className="text-3xl font-semibold">Your Profile</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Update your profile and avatar information here.
        </p>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Display name</label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input value={user?.email ?? ""} disabled />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Phone</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Address</label>
            <Textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Profile photo</label>
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 overflow-hidden rounded-full border bg-muted">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    No image
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  handleAvatarChange(file);
                }}
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-foreground">{success}</p>}

          <Button type="submit" disabled={busy}>
            Save Profile
          </Button>
        </form>
      </div>
    </div>
  );
}
