import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { AuthProvider } from "@/src/features/auth/AuthProvider";
import { LoadingProvider } from "@/src/ui/loading/LoadingProvider";

export const unstable_settings = {
  anchor: "(auth)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <LoadingProvider>
          <Stack>
            {/* Auth group (login/register) */}
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />

            {/* Your existing tabs */}
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

            {/* Existing modal */}
            <Stack.Screen name="modal" options={{ presentation: "modal", title: "Modal" }} />
          </Stack>
        </LoadingProvider>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}