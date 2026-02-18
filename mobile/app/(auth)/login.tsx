/**
 * LoginScreen — Entry point for returning users.
 *
 * What changed / what was added:
 *  • Replaced the bare-bones form with a fully branded, card-based layout.
 *  • Added a hero section (circular logo + HugATree app name + tagline)
 *    so users instantly know which app they're in.
 *  • Wrapped the form in a visual "card" (rounded corners, shadow, border)
 *    to lift it off the background and create visual hierarchy.
 *  • Added Ionicons icons inside each input field (mail / lock) for clarity.
 *  • Added a show/hide password toggle (eye icon) — a common accessibility win.
 *  • Replaced the default <Button> with a styled <Pressable> that:
 *    - uses Brand.primary green as its background
 *    - dims to 75% opacity when pressed or while submitting
 *    - shows a loading label ("Signing in…") while awaiting the API
 *  • Added an "or" divider + outline "Create an account" button so users can
 *    jump to registration without hunting for a link.
 *  • Wrapped the whole screen in KeyboardAvoidingView + ScrollView so form
 *    fields are never hidden by the software keyboard on iOS or Android.
 *  • All colours are sourced from Brand tokens (constants/theme.ts) and
 *    switch automatically between light and dark mode.
 *
 * IMPORTANT: Remove the hardcoded default credentials (lines 24-25) before
 * shipping to production — they are test-only values for local development.
 */

import { useState } from "react";
import {
  Alert,
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

export default function LoginScreen() {
  const { login } = useAuth();

  // TODO: Remove these default values before shipping to production.
  // They exist only to speed up manual testing during development.
  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("Secret123!");
  const [showPassword, setShowPassword] = useState(false);  // controls eye-toggle
  const [submitting, setSubmitting] = useState(false);       // disables button while API call is in-flight

  // ── Theme-aware colour aliases ──────────────────────────────────────────────
  // Compute once per render from useColorScheme so that every element flips
  // automatically when the user switches between light/dark mode.
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const bg        = isDark ? Brand.charcoal  : Brand.offWhite;  // screen background
  const cardBg    = isDark ? Brand.darkCard  : Brand.white;     // form card surface
  const textColor = isDark ? Brand.offWhite  : Brand.charcoal;  // primary text
  const subColor  = isDark ? Brand.softGray  : Brand.midGray;   // secondary / placeholder text
  const borderCol = isDark ? Brand.deep      : Brand.pale;      // input & card border
  const inputBg   = isDark ? Brand.charcoal  : Brand.white;     // text-input background

  // ── Submit handler ──────────────────────────────────────────────────────────
  async function handleLogin() {
    // Guard: both fields must be filled before hitting the API
    if (!email.trim() || !password) {
      Alert.alert("Missing fields", "Please enter your email and password.");
      return;
    }
    try {
      setSubmitting(true);
      await login(email.trim(), password);
      // On success, AuthProvider updates isLoggedIn → Expo Router redirects
      // automatically to the (tabs) group; no manual navigation needed here.
    } catch (e: any) {
      Alert.alert("Login failed", e.message ?? "Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    // SafeAreaView: respects notches, status bars, and home-indicator insets
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]}>
      {/*
       * KeyboardAvoidingView: pushes the form up when the software keyboard
       * appears. 'padding' mode works best on iOS; 'height' on Android.
       */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.kav}
      >
        {/*
         * ScrollView: allows the page to scroll if the device is very small
         * or the keyboard is still partially covering content.
         * keyboardShouldPersistTaps="handled" ensures tapping outside the
         * keyboard (e.g. on the submit button) dismisses it correctly.
         */}
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Hero section ────────────────────────────────────────────────
            * A circular green badge with a leaf icon, the app name, and a
            * short tagline give the login screen personality and reinforce
            * the brand before users even interact with the form.
            */}
          <View style={styles.heroSection}>
            {/* Circular logo badge — uses Brand.primary (main green) */}
            <View style={[styles.logoCircle, { backgroundColor: Brand.primary }]}>
              <Ionicons name="leaf" size={44} color={Brand.white} />
            </View>
            <Text style={[styles.appName, { color: Brand.primary }]}>HugATree</Text>
            <Text style={[styles.tagline, { color: subColor }]}>
              Track, protect &amp; celebrate trees
            </Text>
          </View>

          {/* ── Form card ───────────────────────────────────────────────────
            * Floats above the background with a subtle shadow and rounded
            * corners. The `gap: 16` keeps field spacing consistent without
            * individual marginBottom values on every child.
            */}
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: borderCol }]}>
            <Text style={[styles.cardTitle, { color: textColor }]}>Welcome back</Text>
            <Text style={[styles.cardSub, { color: subColor }]}>
              Sign in to your account
            </Text>

            {/* ── Email field ──────────────────────────────────────────────
              * The icon + input live inside a shared inputRow container so
              * they align perfectly and share the same border.
              */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: subColor }]}>Email</Text>
              <View
                style={[
                  styles.inputRow,
                  { backgroundColor: inputBg, borderColor: borderCol },
                ]}
              >
                {/* Leading icon helps users identify the field at a glance */}
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color={subColor}
                  style={styles.inputIcon}
                />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"       // email addresses are lowercase
                  keyboardType="email-address" // brings up @ keyboard on mobile
                  style={[styles.input, { color: textColor }]}
                  placeholder="you@example.com"
                  placeholderTextColor={subColor}
                  returnKeyType="next"         // "Next" key moves to password
                />
              </View>
            </View>

            {/* ── Password field ───────────────────────────────────────────
              * secureTextEntry is toggled by the eye button on the right,
              * letting users verify what they typed without being locked out.
              */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: subColor }]}>Password</Text>
              <View
                style={[
                  styles.inputRow,
                  { backgroundColor: inputBg, borderColor: borderCol },
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={subColor}
                  style={styles.inputIcon}
                />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}  // hide/show based on toggle
                  style={[styles.input, { color: textColor }]}
                  placeholder="At least 8 characters"
                  placeholderTextColor={subColor}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}    // "Done" key submits the form
                />
                {/* Eye toggle button — hitSlop expands the tap target */}
                <Pressable
                  onPress={() => setShowPassword((v) => !v)}
                  hitSlop={8}
                  style={styles.eyeBtn}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={18}
                    color={subColor}
                  />
                </Pressable>
              </View>
            </View>

            {/* ── Submit button ────────────────────────────────────────────
              * Uses a callback style prop so the pressed state is handled
              * inline without extra state. Disabled while submitting to
              * prevent double-submissions.
              */}
            <Pressable
              onPress={handleLogin}
              disabled={submitting}
              style={({ pressed }) => [
                styles.submitBtn,
                { backgroundColor: Brand.primary, opacity: pressed || submitting ? 0.75 : 1 },
              ]}
            >
              {/* Swap label ↔ spinner while the API call is pending */}
              {submitting ? (
                <Text style={styles.submitText}>Signing in…</Text>
              ) : (
                <View style={styles.submitInner}>
                  <Ionicons name="log-in-outline" size={18} color={Brand.white} />
                  <Text style={styles.submitText}>Sign in</Text>
                </View>
              )}
            </Pressable>

            {/* ── "or" divider ─────────────────────────────────────────────
              * A visual separator between the primary action and the
              * secondary registration CTA.
              */}
            <View style={styles.dividerRow}>
              <View style={[styles.divider, { backgroundColor: borderCol }]} />
              <Text style={[styles.dividerText, { color: subColor }]}>or</Text>
              <View style={[styles.divider, { backgroundColor: borderCol }]} />
            </View>

            {/* ── Register link ────────────────────────────────────────────
              * Outline style (border, transparent fill) keeps this secondary
              * action visually distinct from the primary green button.
              */}
            <Link href="/(auth)/register" asChild>
              <Pressable
                style={({ pressed }) => [
                  styles.outlineBtn,
                  {
                    borderColor: Brand.primary,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Text style={[styles.outlineBtnText, { color: Brand.primary }]}>
                  Create an account
                </Text>
              </Pressable>
            </Link>
          </View>

          {/* ── Footer tagline ───────────────────────────────────────────── */}
          <Text style={[styles.footer, { color: subColor }]}>
            Every tree counts 🌳
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1 },
  kav:  { flex: 1 },

  // Centers content vertically on tall screens; allows scrolling on small ones
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
    justifyContent: "center",
  },

  /* ── Hero ── */
  heroSection: {
    alignItems: "center",
    marginBottom: 28,
  },
  // Green circle behind the leaf icon — doubles as an app icon stand-in
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    // Subtle drop-shadow reinforces the circular "badge" appearance
    shadowColor: Brand.forest,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  appName: {
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 14,
    textAlign: "center",
  },

  /* ── Card ── */
  card: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    // Soft shadow creates depth — lighter on dark backgrounds (elevation handles Android)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    gap: 16, // consistent spacing between all direct children (field groups, buttons)
  },
  cardTitle: { fontSize: 22, fontWeight: "700" },
  cardSub:   { fontSize: 14, marginTop: -8 },  // negative margin pulls it closer to the title

  /* ── Input fields ── */
  fieldGroup: { gap: 6 },     // label + input row spacing
  label:      { fontSize: 13, fontWeight: "600" },

  // Horizontal row that wraps the leading icon, text input, and optional trailing button
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 52,               // tall enough for easy tapping on all device sizes
  },
  inputIcon: { marginRight: 8 },   // gap between icon and text cursor
  input: {
    flex: 1,                  // takes all remaining width in the row
    fontSize: 15,
    height: "100%",
  },
  eyeBtn: { padding: 4 },     // small padding to keep icon touch target comfortable

  /* ── Buttons ── */
  submitBtn: {
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  // Row inside the submit button: icon + label side-by-side
  submitInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  submitText: {
    color: Brand.white,
    fontSize: 16,
    fontWeight: "700",
  },

  // "or" divider between primary and secondary actions
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  divider:     { flex: 1, height: 1 },  // expands to fill available space
  dividerText: { fontSize: 12 },

  // Outline/ghost button for the secondary "Create an account" CTA
  outlineBtn: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  outlineBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },

  /* ── Footer ── */
  footer: {
    textAlign: "center",
    marginTop: 24,
    fontSize: 13,
  },
});
