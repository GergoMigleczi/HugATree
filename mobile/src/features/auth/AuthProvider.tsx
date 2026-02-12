import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authLogout } from "./auth.session";
import { saveTokens } from "./tokens";
import { getMeApi, registerApi, loginApi } from "./auth.api";
import type { AuthContextValue, User } from "./auth.types";

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  async function refreshUser() {
    try {
      const me = await getMeApi();
      setUser({
        id: me.user.id,
        email: me.user.email,
        display_name: me.user.display_name,
      });
    } catch {
      setUser(null);
    }
  }

  async function register(email: string, password: string, displayName: string) {
    await registerApi({ email, password, displayName });

    // auto-login after registration
    const data = await loginApi({ email, password, deviceLabel: "expo" });
    await saveTokens(data.accessToken, data.refreshToken);
    await refreshUser();
  }

  async function login(email: string, password: string) {
    const data = await loginApi({ email, password, deviceLabel: "expo" });
    await saveTokens(data.accessToken, data.refreshToken);
    await refreshUser();
  }

  async function logout() {
    await authLogout();
    setUser(null);
  }

  useEffect(() => {
    (async () => {
      await refreshUser();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(
    () => ({
      loading,
      user,
      isLoggedIn: !!user,
      refreshUser,
      register,
      login,
      logout,
    }),
    [loading, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}