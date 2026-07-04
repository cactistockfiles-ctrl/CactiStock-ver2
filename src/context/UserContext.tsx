"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { UserProfile } from "@/types/user";

interface AuthResult {
  ok: boolean;
  error?: string;
}

interface UserContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  loading: boolean;
  register: (input: {
    email: string;
    password: string;
    displayName?: string;
  }) => Promise<AuthResult>;
  login: (email: string, password: string) => Promise<AuthResult>;
  loginWithOAuth: (input: {
    email: string;
    displayName?: string;
    avatarUrl?: string;
    provider: string;
    oauthId: string;
  }) => Promise<AuthResult>;
  logout: () => Promise<void>;
  updateProfile: (
    updates: Partial<Omit<UserProfile, "email">>,
  ) => Promise<AuthResult>;
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<AuthResult>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSession() {
      try {
        const response = await fetch("/api/user/session", {
          cache: "no-store",
        });
        if (!response.ok) {
          return;
        }

        const result = await response.json();
        if (result?.ok && result.user) {
          setUser(result.user as UserProfile);
        }
      } catch (error) {
        console.error("Failed to load user session", error);
      } finally {
        setLoading(false);
      }
    }

    loadSession();
  }, []);

  const register = async ({
    email,
    password,
    displayName,
  }: {
    email: string;
    password: string;
    displayName?: string;
  }): Promise<AuthResult> => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      return { ok: false, error: "Please provide email and password." };
    }

    const response = await fetch("/api/user/account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "register",
        email: normalizedEmail,
        password,
        displayName: displayName?.trim(),
      }),
    });

    let result: any = null;
    try {
      result = await response.json();
    } catch (e) {
      result = null;
    }

    if (!response.ok || !result?.ok) {
      return {
        ok: false,
        error: result?.error || response.statusText || "Registration failed.",
      };
    }

    setUser(result.user as UserProfile);
    return { ok: true };
  };

  const login = async (
    email: string,
    password: string,
  ): Promise<AuthResult> => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      return { ok: false, error: "Please provide email and password." };
    }

    const response = await fetch("/api/user/account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "login",
        email: normalizedEmail,
        password,
      }),
    });

    let result: any = null;
    try {
      result = await response.json();
    } catch (e) {
      result = null;
    }

    if (!response.ok || !result?.ok) {
      return {
        ok: false,
        error: result?.error || response.statusText || "Login failed.",
      };
    }

    setUser(result.user as UserProfile);
    return { ok: true };
  };

  const loginWithOAuth = async ({
    email,
    displayName,
    avatarUrl,
    provider,
    oauthId,
  }: {
    email: string;
    displayName?: string;
    avatarUrl?: string;
    provider: string;
    oauthId: string;
  }): Promise<AuthResult> => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !oauthId) {
      return { ok: false, error: "Missing auth information." };
    }

    const response = await fetch("/api/user/account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "oauth",
        email: normalizedEmail,
        displayName: displayName?.trim(),
        avatarUrl,
        provider,
        oauthId,
      }),
    });

    let result: any = null;
    try {
      result = await response.json();
    } catch (e) {
      result = null;
    }

    if (!response.ok || !result?.ok) {
      return {
        ok: false,
        error: result?.error || response.statusText || "OAuth login failed.",
      };
    }

    setUser(result.user as UserProfile);
    return { ok: true };
  };

  const logout = async () => {
    try {
      await fetch("/api/user/session", { method: "DELETE" });
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      setUser(null);
    }
  };

  const updateProfile = async (
    updates: Partial<Omit<UserProfile, "email">>,
  ): Promise<AuthResult> => {
    if (!user) {
      return { ok: false, error: "Not authenticated." };
    }

    const response = await fetch("/api/user/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: user.email,
        updates,
      }),
    });

    let result: any = null;
    try {
      result = await response.json();
    } catch (e) {
      result = null;
    }

    if (!response.ok || !result?.ok) {
      return {
        ok: false,
        error: result?.error || response.statusText || "Update failed.",
      };
    }

    setUser(result.user as UserProfile);
    return { ok: true };
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string,
  ): Promise<AuthResult> => {
    if (!user) {
      return { ok: false, error: "Not authenticated." };
    }

    const response = await fetch("/api/user/account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "change-password",
        email: user.email,
        currentPassword,
        newPassword,
      }),
    });

    let result: any = null;
    try {
      result = await response.json();
    } catch (e) {
      result = null;
    }

    if (!response.ok || !result?.ok) {
      return {
        ok: false,
        error:
          result?.error || response.statusText || "Password change failed.",
      };
    }

    return { ok: true };
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      loading,
      register,
      login,
      loginWithOAuth,
      logout,
      updateProfile,
      changePassword,
    }),
    [user, loading],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within UserProvider");
  }
  return context;
}
