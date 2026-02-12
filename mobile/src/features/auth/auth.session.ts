import { clearTokens, getRefreshToken } from "./tokens";
import { logoutApi } from "./auth.api";

export async function authLogout(): Promise<void> {
  const refreshToken = await getRefreshToken();
  if (refreshToken) await logoutApi({ refreshToken });
  await clearTokens();
}