import Constants from "expo-constants";

export const PUBLIC_WEBSITE_URL = process.env.EXPO_PUBLIC_PUBLIC_WEBSITE_URL!;

console.log("PUBLIC_WEBSITE_URL =", PUBLIC_WEBSITE_URL);
const extra = Constants.expoConfig?.extra ?? {};

export const API_URL: string =
  process.env.EXPO_PUBLIC_API_URL || extra.API_URL || "http://localhost:8000";

if (API_URL.includes("localhost")) {
  console.warn(
    "⚠️  API_URL is set to localhost. This works in the iOS simulator but NOT on physical devices or Android emulator.\n" +
    "For physical devices, set EXPO_PUBLIC_API_URL to your machine's IP (e.g., http://192.168.1.100:8000) or the Docker container host.\n" +
    "See docs/env.md for more info."
  );
}

console.log("[CONFIG] API_URL =", API_URL);
