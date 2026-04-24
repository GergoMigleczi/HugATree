import { Alert } from "react-native";
import * as SecureStore from "expo-secure-store";

const ACCESS_KEY = "accessToken";
const REFRESH_KEY = "refreshToken";

export async function saveTokens(accessToken: string, refreshToken: string) {
  console.log("saveTokens called", {
    accessToken,
    accessTokenType: typeof accessToken,
    refreshToken,
    refreshTokenType: typeof refreshToken,
  });

  if (typeof accessToken !== "string" || typeof refreshToken !== "string") {
    const errorData = {
      accessToken,
      accessTokenType: typeof accessToken,
      refreshToken,
      refreshTokenType: typeof refreshToken,
    };
    console.error("Invalid token values for SecureStore", errorData);
    Alert.alert(
      "Invalid auth tokens",
      `accessToken type: ${typeof accessToken}, refreshToken type: ${typeof refreshToken}`
    );
    throw new Error("Invalid token values: accessToken and refreshToken must be strings");
  }

  await SecureStore.setItemAsync(ACCESS_KEY, accessToken);
  await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
}

export async function getAccessToken() {
  return SecureStore.getItemAsync(ACCESS_KEY);
}

export async function getRefreshToken() {
  return SecureStore.getItemAsync(REFRESH_KEY);
}

export async function clearTokens() {
  await SecureStore.deleteItemAsync(ACCESS_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}