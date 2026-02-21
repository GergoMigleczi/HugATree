/**
 * TabsLayout — Route group wrapper for all authenticated screens.
 *
 * Auth guard:
 *  - Returns null while AuthProvider is restoring session from secure storage,
 *    preventing a flash of unauthenticated UI on startup.
 *  - Redirects unauthenticated users to /(auth)/login. On successful login,
 *    AuthProvider sets isLoggedIn → true and Expo Router navigates here
 *    automatically — no manual navigation required in the auth screens.
 *
 * Navigation:
 *  - <Tabs screenOptions={{ headerShown: false }}> renders the Expo Router
 *    tab navigator without a header bar. Each screen manages its own header
 *    and safe-area insets via SafeAreaView.
 *  - The tab bar is visible at the bottom by default. Individual tab screens
 *    can hide it (e.g. the map screen) by setting tabBarStyle: { display: 'none' }
 *    in their screen options if a fullscreen experience is needed.
 *
 * Adding a new tab:
 *  1. Create a new file in app/(tabs)/ (e.g. profile.tsx).
 *  2. Expo Router picks it up automatically — no registration needed here.
 *  3. Customise the tab icon/label via <Stack.Screen options> inside the file,
 *     or add a <Tabs.Screen> block below with the desired options.
 */

import { Redirect, Stack, Tabs } from "expo-router";
import { useEffect } from "react";
import { useAuth } from "@/src/features/auth/AuthProvider";
import { useLoading } from "@/src/ui/loading/LoadingProvider";

export default function TabsLayout() {
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

  // Not authenticated — redirect to login
  if (!isLoggedIn) return <Redirect href="/(auth)/login" />;

  // Authenticated — render tab navigator without a shared header
  return <Tabs screenOptions={{ headerShown: false }} />;
}
