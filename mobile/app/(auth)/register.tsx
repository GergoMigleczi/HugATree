import { useState } from "react";
import { Alert, Button, Text, TextInput, useColorScheme, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, router } from "expo-router";

import { useAuth } from "@/src/features/auth/AuthProvider";

export default function RegisterScreen() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

const { register } = useAuth();

  async function handleRegister() {
    try {
      setSubmitting(true);
      await register(email, password, displayName);
      // no router.replace needed; auth layout redirects when logged in
    } catch (e: any) {
      Alert.alert("Register failed", e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <Text style={styles.title}>Register</Text>

      <View style={{ gap: 8 }}>
        <Text style={styles.text}>Display name</Text>
        <TextInput
          value={displayName}
          onChangeText={setDisplayName}
          style={styles.input}
          placeholder="Your name"
          placeholderTextColor={isDark ? "#888" : "#999"}
        />

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

      <Button title={submitting ? "Creating..." : "Create account"} onPress={handleRegister} disabled={submitting} />

      <Link href="/(auth)/login" style={styles.link}>
        Back to login
      </Link>
    </SafeAreaView>
  );
}