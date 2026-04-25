import { authFetch } from "../../api/authFetch";

export type AdminUser = {
  id: number;
  email: string;
  display_name: string | null;
  is_active: boolean;
  admin_flag: boolean;
  created_at: string;
  updated_at: string;
};

export async function getAdminUsersApi(): Promise<{ users: AdminUser[] }> {
  return authFetch<{ users: AdminUser[] }>("/admin/users");
}

export async function setUserActiveApi(userId: number, active: boolean): Promise<void> {
  await authFetch<{ ok: true }>(`/admin/users/${userId}/active`, {
    method: "PATCH",
    body: { active },
  });
}
