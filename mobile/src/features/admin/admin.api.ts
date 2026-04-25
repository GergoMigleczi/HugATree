import { authFetch } from "@/src/api/authFetch";
import type { AdminUser, GetAdminUsersResponse } from "./admin.types";

export async function getAdminUsersApi(): Promise<AdminUser[]> {
  const res = await authFetch<GetAdminUsersResponse>("/admin/users", { method: "GET" });
  return res.users;
}

export async function deactivateUserApi(userId: number): Promise<void> {
  await authFetch<{ ok: true }>(`/admin/users/${userId}`, { method: "DELETE" });
}
