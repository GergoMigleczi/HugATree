/**/
import { Redirect, Stack, useNavigation } from "expo-router";
import { useEffect } from "react";

import { useAuth } from "@/src/features/auth/AuthProvider";

export default function AdminLayout() {
  const { isAdmin, isLoggedIn } = useAuth();

  const navigation = useNavigation();

  useEffect(() => {
  navigation.setOptions({
      headerShown: false,
  });
  }, [navigation]);

  if (!isLoggedIn) return <Redirect href="/(auth)/login" />;
  if (!isAdmin) return <Redirect href="/(tabs)/home" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}