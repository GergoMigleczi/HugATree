// src/features/auth/auth.api.ts
import { apiRequest } from "../../api/client";
import { authFetch } from "../../api/authFetch";
import type { LoginResponse, MeResponse, RefreshResponse, RegisterResponse } from "./auth.types";

export async function registerApi(params: {
  email: string;
  password: string;
  displayName: string;
}) {
  return apiRequest<RegisterResponse>("/auth/register", {
    method: "POST",
    body: {
      email: params.email,
      password: params.password,
      display_name: params.displayName,
    },
  });
}

export async function loginApi(params: { email: string; password: string; deviceLabel: string }) {
  return apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body: {
      email: params.email,
      password: params.password,
      device_label: params.deviceLabel,
    },
  });
}

export async function refreshApi(params: { refreshToken: string }) {
  return apiRequest<RefreshResponse>("/auth/refresh", {
    method: "POST",
    body: { refreshToken: params.refreshToken },
  });
}

// best-effort: returns void, ignores failure
export async function logoutApi(params: { refreshToken: string }): Promise<void> {
  try {
    await apiRequest<{ ok: true }>("/auth/logout", {
      method: "POST",
      body: { refreshToken: params.refreshToken },
    });
  } catch {
    // ignore
  }
}

export async function getMeApi() {
  return authFetch<MeResponse>("/me");
}