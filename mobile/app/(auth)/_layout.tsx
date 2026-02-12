import { Redirect, Stack } from "expo-router";
import { useAuth } from "@/src/features/auth/AuthProvider";

export default function AuthLayout() {
  const { loading, isLoggedIn } = useAuth();
  if (loading) return null;
  if (isLoggedIn) return <Redirect href="/(tabs)" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}