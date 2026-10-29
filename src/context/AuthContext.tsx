import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, SESSION_EXPIRED_EVENT, tokenStore } from "../lib/api";
import type { User } from "../types";

interface AuthContextValue {
  user: User | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: { name: string; email: string; password: string; phone?: string }) => Promise<User>;
  logout: () => void;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  // Restaura a sessão a partir do token salvo.
  useEffect(() => {
    if (!tokenStore.get()) {
      setReady(true);
      return;
    }
    api<{ user: User }>("/auth/me")
      .then(({ user }) => setUser(user))
      .catch(() => tokenStore.set(null))
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    const onExpired = () => {
      tokenStore.set(null);
      setUser(null);
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  const authenticate = async (path: string, body: unknown) => {
    const { token, user } = await api<{ token: string; user: User }>(path, { method: "POST", body });
    tokenStore.set(token);
    setUser(user);
    return user;
  };

  const value: AuthContextValue = {
    user,
    ready,
    login: (email, password) => authenticate("/auth/login", { email, password }),
    register: (data) => authenticate("/auth/register", data),
    logout: () => {
      tokenStore.set(null);
      setUser(null);
    },
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de AuthProvider");
  return ctx;
};
