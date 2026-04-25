import type { UserRole } from "@/src/features/auth/auth.types";

export type AdminUser = {
  id: number;
  email: string;
  display_name: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
};

export type GetAdminUsersResponse = {
  users: AdminUser[];
};
