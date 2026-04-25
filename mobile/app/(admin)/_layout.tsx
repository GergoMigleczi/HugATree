/**/
import { Redirect, Stack, useNavigation } from "expo-router";
import { useEffect } from "react";

import { useAuth } from "@/src/features/auth/AuthProvider";
import { useLoading } from "@/src/ui/loading/LoadingProvider";

export default function TabsLayout() {
  const { isAdmin, isLoggedIn } = useAuth();
  const { show, hide } = useLoading();

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