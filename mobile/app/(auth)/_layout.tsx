import { Redirect, Stack } from "expo-router";
import { useEffect } from "react";
import { useAuth } from "@/src/features/auth/AuthProvider";
import { useLoading } from "@/src/ui/loading/LoadingProvider";

export default function AuthLayout() {
  const { loading, isLoggedIn } = useAuth();
  const { show, hide } = useLoading();

  useEffect(() => {
    if (loading) {
      show({ message: "Loading...",
        blocking: true,
        background: "solid" });
    } else {
      hide();
    }

    // ensure overlay is not left on if layout unmounts
    return () => hide();
  }, [loading, show, hide]);

  // While auth is resolving, render something cheap (Stack is fine),
  // overlay will block interaction anyway.
  if (loading) return <Stack screenOptions={{ headerShown: false }} />;

  if (isLoggedIn) return <Redirect href="/(tabs)" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}