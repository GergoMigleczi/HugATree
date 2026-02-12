// src/api/authFetch.ts
import { apiRequest } from "./client";
import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from "../features/auth/tokens";
import type { RefreshResponse } from "../features/auth/auth.types";

let refreshPromise: Promise<boolean> | null = null;

async function refreshTokensOnce(): Promise<boolean> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return false;

  try {
    const data = await apiRequest<RefreshResponse>("/auth/refresh", {
      method: "POST",
      body: { refreshToken },
    });

    await saveTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    await clearTokens();
    return false;
  }
}

async function refreshTokens(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        return await refreshTokensOnce();
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

export async function authFetch<T>(
  path: string,
  options?: { method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"; body?: any }
): Promise<T> {
  const method = options?.method ?? "GET";

  const tryOnce = async () => {
    const accessToken = await getAccessToken();
    return apiRequest<T>(path, {
      method,
      body: options?.body,
      accessToken: accessToken ?? undefined,
    });
  };

  try {
    return await tryOnce();
  } catch (e: any) {
    // only refresh+retry on 401
    if (e?.status !== 401) throw e;

    const ok = await refreshTokens();
    if (!ok) throw new Error("Session expired. Please log in again.");

    return await tryOnce();
  }
}