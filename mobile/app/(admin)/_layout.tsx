import { Redirect, Stack } from "expo-router";
import { useAuth } from "@/src/features/auth/AuthProvider";

export default function AdminLayout() {
  const { loading, isLoggedIn, user } = useAuth();

  if (loading) return null;
  if (!isLoggedIn) return <Redirect href="/(auth)/login" />;
  if (user?.role !== "admin") return <Redirect href="/(tabs)" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
