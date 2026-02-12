export type User = {
  id: number;
  email: string;
  display_name: string | null;
};

export type MeResponse = {
  user: User & { created_at: string; updated_at: string };
};

export type RegisterResponse = {
  user: User | null ;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: User;
};

export type LogoutResponse =
  | { ok: true }
  | { error: string };

export type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
};

export type AuthContextValue = {
  loading: boolean;
  user: User | null;
  isLoggedIn: boolean;
  refreshUser: () => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};