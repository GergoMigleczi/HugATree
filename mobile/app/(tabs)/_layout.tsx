import { Redirect, Tabs } from "expo-router";
import { useAuth } from "@/src/features/auth/AuthProvider";

export default function TabsLayout() {
  const { loading, isLoggedIn } = useAuth();
  if (loading) return null;
  if (!isLoggedIn) return <Redirect href="/(auth)/login" />;
  return <Tabs screenOptions={{ headerShown: false }} />;
}