/**
 * RegisterScreen — New-user sign-up flow.
 *
 * What changed / what was added:
 *  • Replaced the original bare form with a fully branded, card-based layout
 *    that mirrors the login screen's structure for visual consistency.
 *  • Added a hero section (circular logo badge + HugATree name + tagline)
 *    so new users feel welcomed from the very first interaction.
 *  • Three form fields — Display Name, Email, Password — each with a leading
 *    Ionicons icon (person / mail / lock) for instant recognition.
 *  • Password field includes:
 *    - Show/hide toggle (eye icon) so users can verify what they typed.
 *    - A hint row below the field ("Must be at least 8 characters") with an
 *      information icon — helps users meet the requirement on the first try.
 *  • Primary CTA ("Create account") uses Brand.primary green with a
 *    checkmark icon, and dims while the registration API call is in-flight.
 *  • "already have an account?" divider + "Sign in instead" outline button
 *    let existing users jump back to login without hitting the back button.
 *  • KeyboardAvoidingView + ScrollView prevent the keyboard from obscuring
 *    any field on small devices.
 *  • All colours use Brand tokens from constants/theme.ts and adapt
 *    automatically to light/dark mode via useColorScheme().
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

export default function RegisterScreen() {
  const { register } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [showPassword, setShowPassword] = useState(false);  // eye-toggle for password visibility
  const [submitting, setSubmitting]   = useState(false);    // disables the button during the API call

  // ── Theme-aware colour aliases ──────────────────────────────────────────────
  // All colour decisions live here — the JSX only references these aliases so
  // switching themes requires no changes to the markup itself.
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const bg        = isDark ? Brand.charcoal : Brand.offWhite;  // screen background
  const cardBg    = isDark ? Brand.darkCard : Brand.white;     // form card surface
  const textColor = isDark ? Brand.offWhite : Brand.charcoal;  // primary text colour
  const subColor  = isDark ? Brand.softGray : Brand.midGray;   // labels, placeholders, hints
  const borderCol = isDark ? Brand.deep     : Brand.pale;      // card border + input borders
  const inputBg   = isDark ? Brand.charcoal : Brand.white;     // text-input background

  // ── Submit handler ──────────────────────────────────────────────────────────
  async function handleRegister() {
    // Guard: all three fields must be filled before hitting the API
    if (!displayName.trim() || !email.trim() || !password) {
      Alert.alert("Missing fields", "Please fill in all fields.");
      return;
    }
    try {
      setSubmitting(true);
      await register(email.trim(), password, displayName.trim());
      // On success, AuthProvider sets isLoggedIn → Expo Router redirects to (tabs)
    } catch (e: any) {
      Alert.alert("Registration failed", e.message ?? "Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    // SafeAreaView: keeps content away from notches, status bars, home indicator
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]}>
      {/*
       * KeyboardAvoidingView: shifts the card up when the keyboard appears.
       * 'padding' is the correct mode on iOS; 'height' works better on Android.
       */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.kav}
      >
        {/*
         * ScrollView: allows the screen to scroll on smaller devices where
         * three fields + buttons might not all fit in the visible area.
         */}
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Hero section ─────────────────────────────────────────────────
            * Uses Brand.mid (a slightly lighter green than the login screen's
            * Brand.primary) to subtly differentiate the two auth screens while
            * keeping the same visual language.
            */}
          <View style={styles.heroSection}>
            {/* Circular badge — Brand.mid gives a slightly fresher feel vs login */}
            <View style={[styles.logoCircle, { backgroundColor: Brand.mid }]}>
              <Ionicons name="leaf" size={44} color={Brand.white} />
            </View>
            <Text style={[styles.appName, { color: Brand.primary }]}>HugATree</Text>
            <Text style={[styles.tagline, { color: subColor }]}>
              Join the community protecting our trees
            </Text>
          </View>

          {/* ── Form card ────────────────────────────────────────────────────
            * Same card pattern as the login screen — rounded corners, shadow,
            * brand border. gap: 16 spaces the field groups uniformly.
            */}
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: borderCol }]}>
            <Text style={[styles.cardTitle, { color: textColor }]}>Create account</Text>
            <Text style={[styles.cardSub, { color: subColor }]}>
              It only takes a moment
            </Text>

            {/* ── Display name field ───────────────────────────────────────
              * Collected at registration so the app can personalise greetings
              * (e.g. "Welcome, Alex 👋") without needing a separate profile step.
              */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: subColor }]}>Display name</Text>
              <View style={[styles.inputRow, { backgroundColor: inputBg, borderColor: borderCol }]}>
                {/* person-outline icon signals this is the user's name */}
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

            {/* ── Email field ──────────────────────────────────────────────── */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: subColor }]}>Email</Text>
              <View style={[styles.inputRow, { backgroundColor: inputBg, borderColor: borderCol }]}>
                <Ionicons name="mail-outline" size={18} color={subColor} style={styles.inputIcon} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"        // email addresses are lowercase
                  keyboardType="email-address"  // shows @ key on mobile keyboard
                  style={[styles.input, { color: textColor }]}
                  placeholder="you@example.com"
                  placeholderTextColor={subColor}
                  returnKeyType="next"
                />
              </View>
            </View>

            {/* ── Password field ───────────────────────────────────────────
              * Includes both a show/hide toggle and a hint row below so users
              * know the minimum length requirement before hitting submit.
              */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: subColor }]}>Password</Text>
              <View style={[styles.inputRow, { backgroundColor: inputBg, borderColor: borderCol }]}>
                <Ionicons name="lock-closed-outline" size={18} color={subColor} style={styles.inputIcon} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}   // toggled by the eye button
                  style={[styles.input, { color: textColor }]}
                  placeholder="At least 8 characters"
                  placeholderTextColor={subColor}
                  returnKeyType="done"
                  onSubmitEditing={handleRegister}  // "Done" key submits the form
                />
                {/* Show/hide toggle — hitSlop makes it easier to tap precisely */}
                <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8} style={styles.eyeBtn}>
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={18}
                    color={subColor}
                  />
                </Pressable>
              </View>

              {/* Password hint — shown persistently so users see the rule
                  before they even start typing (proactive, not reactive UX) */}
              <View style={styles.hintRow}>
                <Ionicons name="information-circle-outline" size={13} color={subColor} />
                <Text style={[styles.hint, { color: subColor }]}>
                  Must be at least 8 characters
                </Text>
              </View>
            </View>

            {/* ── Submit button ────────────────────────────────────────────
              * checkmark-circle-outline icon reinforces the "create / confirm"
              * action, making it clear this is a creative (not destructive) step.
              */}
            <Pressable
              onPress={handleRegister}
              disabled={submitting}
              style={({ pressed }) => [
                styles.submitBtn,
                { backgroundColor: Brand.primary, opacity: pressed || submitting ? 0.75 : 1 },
              ]}
            >
              {/* Loading label during API call; icon + label otherwise */}
              {submitting ? (
                <Text style={styles.submitText}>Creating account…</Text>
              ) : (
                <View style={styles.submitInner}>
                  <Ionicons name="checkmark-circle-outline" size={18} color={Brand.white} />
                  <Text style={styles.submitText}>Create account</Text>
                </View>
              )}
            </Pressable>

            {/* ── Divider + back-to-login ──────────────────────────────────
              * Mirrors the login screen's "or" divider pattern so existing
              * users who landed here by mistake can navigate back easily.
              */}
            <View style={styles.dividerRow}>
              <View style={[styles.divider, { backgroundColor: borderCol }]} />
              <Text style={[styles.dividerText, { color: subColor }]}>already have an account?</Text>
              <View style={[styles.divider, { backgroundColor: borderCol }]} />
            </View>

            {/* Outline "Sign in instead" button — secondary action, visually
                subordinate to the primary green CTA above */}
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

  // flexGrow: 1 + justifyContent: "center" vertically centres the content
  // on taller screens while still allowing scrolling when needed
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
    justifyContent: "center",
  },

  /* ── Hero ── */
  heroSection: { alignItems: "center", marginBottom: 28 },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    // Drop-shadow gives the badge a floating, dimensional appearance
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
  tagline: { fontSize: 14, textAlign: "center" },

  /* ── Card ── */
  card: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    gap: 16,  // uniform vertical spacing between field groups, buttons, and dividers
  },
  cardTitle: { fontSize: 22, fontWeight: "700" },
  cardSub:   { fontSize: 14, marginTop: -8 },  // pulled up to sit close to the title

  /* ── Fields ── */
  fieldGroup: { gap: 6 },     // label → input row gap
  label:      { fontSize: 13, fontWeight: "600" },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 52,               // 52 dp is a comfortable minimum tap target height
  },
  inputIcon: { marginRight: 8 },
  input: {
    flex: 1,
    fontSize: 15,
    height: "100%",
  },
  eyeBtn: { padding: 4 },

  // Hint row sits below the password input — small, unobtrusive, informative
  hintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  hint: { fontSize: 12 },

  /* ── Buttons ── */
  submitBtn: {
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
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

  // "already have an account?" divider row
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  divider:     { flex: 1, height: 1 },
  dividerText: { fontSize: 11 },

  // Ghost / outline button for the secondary "Sign in instead" CTA
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
