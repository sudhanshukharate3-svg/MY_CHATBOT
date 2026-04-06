import React, { createContext, useContext, useMemo, useState } from "react";
import { apiJson, type AuthUser } from "../lib/api";

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  login(email: string, password: string): Promise<void>;
  signup(email: string, name: string, password: string): Promise<void>;
  logout(): void;
};

const Ctx = createContext<AuthState | null>(null);

const STORAGE_KEY = "mychat.auth.v1";

type Persisted = { user: AuthUser; accessToken: string; refreshToken: string };

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [persisted, setPersisted] = useState<Persisted | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Persisted) : null;
    } catch {
      return null;
    }
  });

  const value = useMemo<AuthState>(() => {
    async function login(email: string, password: string) {
      const data = await apiJson<Persisted>("/api/auth/login", { method: "POST", body: { email, password } });
      setPersisted(data);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
    async function signup(email: string, name: string, password: string) {
      const data = await apiJson<Persisted>("/api/auth/signup", {
        method: "POST",
        body: { email, name, password },
      });
      setPersisted(data);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
    function logout() {
      setPersisted(null);
      localStorage.removeItem(STORAGE_KEY);
    }
    return {
      user: persisted?.user ?? null,
      accessToken: persisted?.accessToken ?? null,
      login,
      signup,
      logout,
    };
  }, [persisted]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

