/**
 * TabsLayout — Route group wrapper for authenticated screens.
 *
 * What changed / what was added:
 *  • Removed the default Expo <Tabs> component that rendered a native bottom
 *    tab bar with "index" and "map" labels — it was auto-generated from the
 *    file structure and didn't match the custom navigation design.
 *  • Replaced with a plain <Stack> navigator (headerShown: false) so screens
 *    in the (tabs) group are still routable via Expo Router but no tab bar
 *    or header chrome is injected by the framework.
 *  • Auth guard is preserved: if the user is not logged in they are
 *    redirected to /(auth)/login before any (tabs) screen renders.
 *  • Loading state returns null to prevent a flash of unauthenticated UI
 *    while the AuthProvider checks secure storage on startup.
 *
 * Navigation from the home screen is handled via router.push() calls inside
 * HomeScreen — the tile grid is the primary navigation surface.
 * A custom bottom nav bar can be added later by creating a shared layout
 * component and rendering it inside each screen (or by re-introducing <Tabs>
 * with a custom tabBar prop once the design is finalised).
 */

import { Redirect, Stack } from "expo-router";
import { useAuth } from "@/src/features/auth/AuthProvider";

export default function TabsLayout() {
  const { loading, isLoggedIn } = useAuth();

  // Show nothing while auth state is being restored from secure storage
  if (loading) return null;

  // Not authenticated — kick to login; Expo Router handles the redirect
  if (!isLoggedIn) return <Redirect href="/(auth)/login" />;

  // Authenticated — render a headerless stack so each (tabs) screen fills
  // the full viewport with its own SafeAreaView and custom header.
  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}
