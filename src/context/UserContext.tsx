"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import bcrypt from "bcryptjs";
import { UserAccount, UserProfile } from "@/types/user";

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
  logout: () => void;
  updateProfile: (
    updates: Partial<Omit<UserProfile, "email">>,
  ) => Promise<AuthResult>;
}

const USER_STORAGE_KEY = "cactistock_current_user";
const USER_STORE_KEY = "cactistock_user_store";

const UserContext = createContext<UserContextType | undefined>(undefined);

function loadUserStore(): Record<string, UserAccount> {
  if (typeof window === "undefined") return {};
  const saved = window.localStorage.getItem(USER_STORE_KEY);
  return saved ? JSON.parse(saved) : {};
}

function saveUserStore(store: Record<string, UserAccount>) {
  window.localStorage.setItem(USER_STORE_KEY, JSON.stringify(store));
}

function loadCurrentUser(): UserProfile | null {
  if (typeof window === "undefined") return null;
  const saved = window.localStorage.getItem(USER_STORAGE_KEY);
  return saved ? JSON.parse(saved) : null;
}

function saveCurrentUser(user: UserProfile) {
  window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

function clearCurrentUser() {
  window.localStorage.removeItem(USER_STORAGE_KEY);
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const current = loadCurrentUser();
    setUser(current);
    setLoading(false);
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

    const users = loadUserStore();
    if (users[normalizedEmail]) {
      return { ok: false, error: "Account already exists." };
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const profile: UserProfile = {
      email: normalizedEmail,
      displayName: displayName?.trim() || normalizedEmail,
    };

    users[normalizedEmail] = {
      ...profile,
      passwordHash,
    };
    saveUserStore(users);
    saveCurrentUser(profile);
    setUser(profile);

    return { ok: true };
  };

  const login = async (
    email: string,
    password: string,
  ): Promise<AuthResult> => {
    const normalizedEmail = email.trim().toLowerCase();
    const users = loadUserStore();
    const account = users[normalizedEmail];

    if (!account) {
      return { ok: false, error: "No account found with this email." };
    }

    const match = await bcrypt.compare(password, account.passwordHash);
    if (!match) {
      return { ok: false, error: "Incorrect password." };
    }

    const { passwordHash, ...profile } = account;
    saveCurrentUser(profile);
    setUser(profile);
    return { ok: true };
  };

  const logout = () => {
    setUser(null);
    clearCurrentUser();
  };

  const updateProfile = async (
    updates: Partial<Omit<UserProfile, "email">>,
  ): Promise<AuthResult> => {
    if (!user) {
      return { ok: false, error: "Not authenticated." };
    }

    const users = loadUserStore();
    const account = users[user.email];
    if (!account) {
      return { ok: false, error: "User record not found." };
    }

    const updatedAccount: UserAccount = {
      ...account,
      ...updates,
    };

    users[user.email] = updatedAccount;
    saveUserStore(users);

    const { passwordHash, ...profile } = updatedAccount;
    saveCurrentUser(profile);
    setUser(profile);

    return { ok: true };
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      loading,
      register,
      login,
      logout,
      updateProfile,
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
