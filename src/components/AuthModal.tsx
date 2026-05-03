"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useUser } from "@/context/UserContext";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMode?: "login" | "register";
}

export default function AuthModal({
  open,
  onOpenChange,
  initialMode = "login",
}: AuthModalProps) {
  const { login, register } = useUser();
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setDisplayName("");
    setError("");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setBusy(true);

    if (mode === "register") {
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        setBusy(false);
        return;
      }
      const result = await register({
        email,
        password,
        displayName,
      });
      setBusy(false);
      if (!result.ok) {
        setError(result.error || "Register failed.");
        return;
      }
      toast.success("Registered and logged in successfully.");
      onOpenChange(false);
      resetForm();
      return;
    }

    const result = await login(email, password);
    setBusy(false);
    if (!result.ok) {
      setError(result.error || "Login failed.");
      return;
    }

    toast.success("Logged in successfully.");
    onOpenChange(false);
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "login" ? "Login" : "Register"}</DialogTitle>
          <DialogDescription>
            {mode === "login"
              ? "Login to continue adding items to your cart."
              : "Create an account to save your cart and profile."}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {mode === "register" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Display name</label>
              <Input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <Input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {mode === "register" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Confirm password</label>
              <Input
                required
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="submit" className="w-full" disabled={busy}>
              {mode === "login" ? "Login" : "Register"}
            </Button>
          </DialogFooter>
        </form>

        <div className="pt-4 text-center text-sm text-muted-foreground">
          {mode === "login" ? (
            <>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                className="font-medium text-primary hover:underline"
                onClick={() => {
                  setMode("register");
                  setError("");
                }}
              >
                Register
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                className="font-medium text-primary hover:underline"
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
              >
                Login
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
