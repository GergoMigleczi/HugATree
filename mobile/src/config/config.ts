import Constants from "expo-constants";

const extra = Constants.expoConfig?.extra ?? {};

export const API_URL: string =
  extra.API_URL ?? "http://localhost:8000";

console.log("API_URL =", API_URL);