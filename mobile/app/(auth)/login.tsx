import { useState } from "react";
import { Alert, Button, Text, TextInput, useColorScheme, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";

import { useAuth } from "@/src/features/auth/AuthProvider";

export default function LoginScreen() {
  const { login } = useAuth();

  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("Secret123!");
  const [submitting, setSubmitting] = useState(false);

  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const styles = {
    screen: { flex: 1, padding: 16, gap: 12, backgroundColor: isDark ? "#000" : "#fff" },
    title: { fontSize: 22, fontWeight: "600" as const, color: isDark ? "#fff" : "#000" },
    text: { color: isDark ? "#fff" : "#000" },
    input: {
      borderWidth: 1,
      borderColor: isDark ? "#666" : "#ccc",
      padding: 10,
      borderRadius: 8,
      color: isDark ? "#fff" : "#000",
      backgroundColor: isDark ? "#111" : "#fff",
    },
    link: { color: isDark ? "#9cf" : "#06f" },
  };

  async function handleLogin() {
    try {
      setSubmitting(true);
      await login(email, password);
      // No manual navigation needed. Layouts will redirect to (tabs).
    } catch (e: any) {
      Alert.alert("Login failed", e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <Text style={styles.title}>Login</Text>

      <View style={{ gap: 8 }}>
        <Text style={styles.text}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
          placeholder="you@example.com"
          placeholderTextColor={isDark ? "#888" : "#999"}
        />

        <Text style={styles.text}>Password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
          placeholder="At least 8 characters"
          placeholderTextColor={isDark ? "#888" : "#999"}
        />
      </View>

      <Button title={submitting ? "Logging in..." : "Login"} onPress={handleLogin} disabled={submitting} />

      <Link href="/(auth)/register" style={styles.link}>
        Create an account
      </Link>
    </SafeAreaView>
  );
}