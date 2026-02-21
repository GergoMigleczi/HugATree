/**
 * RegisterScreen — New-user sign-up flow.
 *
 * Uses the HugATree logo image (assets/images/logo.png) in the hero section.
 * Place the logo PNG at mobile/assets/images/logo.png if not already there.
 *
 * Design:
 *  - Hero: logo image + tagline (same language as login for consistency)
 *  - Card: display name, email, password (with show/hide + hint), create button
 *  - Secondary: "Sign in instead" outline button
 *  - Full dark/light mode via Brand tokens
 *  - KeyboardAvoidingView + ScrollView for keyboard handling
 */

import { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "@/src/features/auth/AuthProvider";
import { Brand } from "@/constants/theme";
import { useLoading } from "@/src/ui/loading/LoadingProvider";

// Shared logo asset with login screen
const LOGO = require("@/assets/images/logo.png");

export default function RegisterScreen() {
  const { register } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting]   = useState(false);

  // Theme-aware colour aliases
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const bg        = isDark ? Brand.charcoal : Brand.offWhite;
  const cardBg    = isDark ? Brand.darkCard : Brand.white;
  const textColor = isDark ? Brand.offWhite : Brand.charcoal;
  const subColor  = isDark ? Brand.softGray : Brand.midGray;
  const borderCol = isDark ? Brand.deep     : Brand.pale;
  const inputBg   = isDark ? Brand.charcoal : Brand.white;

  const { withLoading } = useLoading();
    
  async function handleRegister() {
    if (!displayName.trim() || !email.trim() || !password) {
      Alert.alert("Missing fields", "Please fill in all fields.");
      return;
    }
    try {
      setSubmitting(true);

      await withLoading(
        () => register(email.trim(), password, displayName.trim()),
        {
          message: "Creating account...",
          blocking: true,
          background: "transparent",
        }
      );
      // AuthProvider sets isLoggedIn → Expo Router redirects to (tabs)
    } catch (e: any) {
      Alert.alert("Registration failed", e.message ?? "Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.kav}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Hero: logo + tagline ── */}
          <View style={styles.heroSection}>
            <Image source={LOGO} style={styles.logoImage} resizeMode="contain" />
            <Text style={[styles.tagline, { color: subColor }]}>
              Join the community protecting our trees
            </Text>
          </View>

          {/* ── Form card ── */}
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: borderCol }]}>
            <Text style={[styles.cardTitle, { color: textColor }]}>Create account</Text>
            <Text style={[styles.cardSub, { color: subColor }]}>
              It only takes a moment
            </Text>

            {/* Display name */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: subColor }]}>Display name</Text>
              <View style={[styles.inputRow, { backgroundColor: inputBg, borderColor: borderCol }]}>
                <Ionicons name="person-outline" size={18} color={subColor} style={styles.inputIcon} />
                <TextInput
                  value={displayName}
                  onChangeText={setDisplayName}
                  style={[styles.input, { color: textColor }]}
                  placeholder="Your name"
                  placeholderTextColor={subColor}
                  returnKeyType="next"
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: subColor }]}>Email</Text>
              <View style={[styles.inputRow, { backgroundColor: inputBg, borderColor: borderCol }]}>
                <Ionicons name="mail-outline" size={18} color={subColor} style={styles.inputIcon} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={[styles.input, { color: textColor }]}
                  placeholder="you@example.com"
                  placeholderTextColor={subColor}
                  returnKeyType="next"
                />
              </View>
            </View>

            {/* Password with show/hide toggle and hint */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: subColor }]}>Password</Text>
              <View style={[styles.inputRow, { backgroundColor: inputBg, borderColor: borderCol }]}>
                <Ionicons name="lock-closed-outline" size={18} color={subColor} style={styles.inputIcon} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  style={[styles.input, { color: textColor }]}
                  placeholder="At least 8 characters"
                  placeholderTextColor={subColor}
                  returnKeyType="done"
                  onSubmitEditing={handleRegister}
                />
                <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8} style={styles.eyeBtn}>
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={18}
                    color={subColor}
                  />
                </Pressable>
              </View>
              {/* Proactive hint — shows before user starts typing */}
              <View style={styles.hintRow}>
                <Ionicons name="information-circle-outline" size={13} color={subColor} />
                <Text style={[styles.hint, { color: subColor }]}>Must be at least 8 characters</Text>
              </View>
            </View>

            {/* Primary create button */}
            <Pressable
              onPress={handleRegister}
              disabled={submitting}
              style={({ pressed }) => [
                styles.submitBtn,
                { backgroundColor: Brand.primary, opacity: pressed || submitting ? 0.75 : 1 },
              ]}
            >
              {submitting ? (
                <Text style={styles.submitText}>Creating account…</Text>
              ) : (
                <View style={styles.submitInner}>
                  <Ionicons name="checkmark-circle-outline" size={18} color={Brand.white} />
                  <Text style={styles.submitText}>Create account</Text>
                </View>
              )}
            </Pressable>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={[styles.divider, { backgroundColor: borderCol }]} />
              <Text style={[styles.dividerText, { color: subColor }]}>already have an account?</Text>
              <View style={[styles.divider, { backgroundColor: borderCol }]} />
            </View>

            {/* Secondary: back to login */}
            <Link href="/(auth)/login" asChild>
              <Pressable
                style={({ pressed }) => [
                  styles.outlineBtn,
                  { borderColor: Brand.primary, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Text style={[styles.outlineBtnText, { color: Brand.primary }]}>
                  Sign in instead
                </Text>
              </Pressable>
            </Link>
          </View>

          <Text style={[styles.footer, { color: subColor }]}>Every tree counts 🌳</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  kav:  { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
    justifyContent: "center",
  },

  /* Hero */
  heroSection: { alignItems: "center", marginBottom: 24 },
  logoImage: {
    width: 160,
    height: 160,
    marginBottom: 8,
  },
  tagline: { fontSize: 14, textAlign: "center" },

  /* Card */
  card: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    gap: 16,
  },
  cardTitle: { fontSize: 22, fontWeight: "700" },
  cardSub:   { fontSize: 14, marginTop: -8 },

  /* Fields */
  fieldGroup: { gap: 6 },
  label:      { fontSize: 13, fontWeight: "600" },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 52,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 15, height: "100%" },
  eyeBtn: { padding: 4 },
  hintRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  hint: { fontSize: 12 },

  /* Buttons */
  submitBtn: {
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  submitInner: { flexDirection: "row", alignItems: "center", gap: 8 },
  submitText:  { color: Brand.white, fontSize: 16, fontWeight: "700" },

  dividerRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  divider:     { flex: 1, height: 1 },
  dividerText: { fontSize: 11 },

  outlineBtn: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  outlineBtnText: { fontSize: 15, fontWeight: "600" },

  /* Footer */
  footer: { textAlign: "center", marginTop: 24, fontSize: 13 },
});
