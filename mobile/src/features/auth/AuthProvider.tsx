import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
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
    console.warn("AuthProvider.register start", {
      email,
      displayName,
    });

    try {
      await registerApi({ email, password, displayName });
    } catch (error: unknown) {
      console.error("AuthProvider.register registerApi failed", error);
      Alert.alert(
        "Registration error",
        error instanceof Error ? error.message : "Unexpected registration error"
      );
      throw error;
    }

    // auto-login after registration
    const data = await loginApi({ email, password, deviceLabel: "expo" });
    console.warn("AuthProvider.register login response", data);

    if (typeof data.accessToken !== "string" || typeof data.refreshToken !== "string") {
      console.error("Invalid login response tokens", data);
      Alert.alert(
        "Registration login failed",
        `accessToken type: ${typeof data.accessToken}, refreshToken type: ${typeof data.refreshToken}`
      );
      throw new Error("Login response did not return valid auth tokens");
    }

    await saveTokens(data.accessToken, data.refreshToken);
    await refreshUser();
  }

  async function login(email: string, password: string) {
    const data = await loginApi({ email, password, deviceLabel: "expo" });
    console.log("login response", data);
    if (typeof data.accessToken !== "string" || typeof data.refreshToken !== "string") {
      console.error("Invalid login response tokens", data);
      Alert.alert(
        "Login failed",
        `accessToken type: ${typeof data.accessToken}, refreshToken type: ${typeof data.refreshToken}`
      );
      throw new Error("Login response did not return valid auth tokens");
    }
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