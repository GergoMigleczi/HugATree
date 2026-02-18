/**
 * HomeScreen — Main dashboard shown after login.
 *
 * What changed / what was added:
 *  • Replaced the raw plain-text header with a branded top bar that shows:
 *    - A circular green leaf badge (matches the auth screen hero)
 *    - A personalised greeting ("Good morning, Alex 👋") time-of-day aware
 *    - The user's email in a smaller subtitle row
 *    - A profile/logout button in the top-right corner (Ionicons person-circle)
 *  • Wrapped the header in a SafeAreaView so it respects the status-bar inset.
 *  • Grid tiles now each have a distinct accent colour and an Ionicons icon
 *    so users can scan and identify tiles at a glance — inspired by the
 *    colourful tile-dashboard reference images.
 *  • Tile layout (unchanged engine, new data):
 *    - Map tile: full-width 2-column × 2-row preview — the focal point
 *    - Statistics: forest-green, bar-chart icon
 *    - Reports:   amber, alert-circle icon
 *    - Add tree:  teal, add-circle icon (full width — primary CTA)
 *  • Added a lightweight stat strip between the header and the grid:
 *    three pill badges showing trees tracked, reports open, and rank.
 *  • Replaced the <Button title="Logout"> with a discreet icon button in
 *    the header to keep the dashboard uncluttered.
 *  • All colours are from the Brand palette; background adapts to dark mode.
 *  • Pin fetch logic is unchanged — it runs on mount and populates the map tile.
 */

import React, { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "@/src/features/auth/AuthProvider";
import { Brand } from "@/constants/theme";
import { HomeGrid, type GridItem } from "../../src/features/home/components/HomeGrid";
import { TILE_ACCENTS } from "../../src/features/home/components/HomeTile";
import { getPins } from "../../src/features/map/map.api";
import type { Pin } from "../../src/features/map/map.types";

// ── Time-aware greeting ────────────────────────────────────────────────────
// Returns "Good morning", "Good afternoon", or "Good evening" based on the
// hour so the greeting feels fresh no matter when the user opens the app.
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  // ── Theme-aware colour aliases ───────────────────────────────────────────
  const bg       = isDark ? Brand.charcoal : Brand.offWhite;
  const cardBg   = isDark ? Brand.darkCard : Brand.white;
  const textCol  = isDark ? Brand.offWhite : Brand.charcoal;
  const subCol   = isDark ? Brand.softGray : Brand.midGray;
  const borderCl = isDark ? Brand.deep     : Brand.pale;

  // ── Pin state ────────────────────────────────────────────────────────────
  const [pins, setPins] = useState<Pin[]>([]);

  // Fetch pins on mount for the map preview tile.
  // Errors are swallowed so the map tile still renders (empty) if the API fails.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getPins();
        if (!cancelled) setPins(data);
      } catch {
        if (!cancelled) setPins([]);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Logout handler ───────────────────────────────────────────────────────
  async function handleLogout() {
    try {
      await logout();
      // AuthProvider sets isLoggedIn → false; Expo Router redirects to (auth)
    } catch (e: any) {
      Alert.alert("Logout failed", e.message);
    }
  }

  // ── Grid tile definitions ────────────────────────────────────────────────
  // Each tile can carry an `icon` (Ionicons name) and an `accent` (hex colour).
  // These flow through HomeGrid → HomeTile and are rendered inside the tile.
  const items: GridItem[] = [
    {
      // Map preview tile — full-width, two rows tall so it dominates the view
      type:    "map",
      id:      "map-preview",
      cols:    2,
      rows:    2,
      pins,
      onPress: () => router.push("/map"),
    },
    {
      // Statistics tile — forest green reinforces a "data / insights" feel
      type:     "tile",
      id:       "stats",
      title:    "Statistics",
      subtitle: "View overview",
      cols:     1,
      rows:     1,
      icon:     "bar-chart-outline",
      accent:   TILE_ACCENTS.forest,
      onPress:  () => router.push("/stats"),
    },
    {
      // Reports tile — amber signals "attention needed" (alerts, issues)
      type:     "tile",
      id:       "reports",
      title:    "Reports",
      subtitle: "Issues & checks",
      cols:     1,
      rows:     1,
      icon:     "alert-circle-outline",
      accent:   TILE_ACCENTS.amber,
      onPress:  () => router.push("/reports"),
    },
    {
      // Add tree tile — full-width primary CTA; teal is energetic and action-oriented
      type:     "tile",
      id:       "add-tree",
      title:    "Add Tree",
      subtitle: "Log a new record",
      cols:     2,
      rows:     1,
      icon:     "add-circle-outline",
      accent:   TILE_ACCENTS.teal,
      onPress:  () => router.push("/add-tree"),
    },
  ];

  // Personalised greeting uses the display name when available
  const firstName = user?.display_name?.split(" ")[0] ?? "there";

  return (
    // SafeAreaView: top inset handles the status bar / notch
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]} edges={["top"]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ────────────────────────────────────────────────────────
          * Left side: circular leaf badge + greeting + email subtitle.
          * Right side: profile icon that triggers logout (discreet but accessible).
          */}
        <View style={styles.header}>
          {/* Left: branding + greeting */}
          <View style={styles.headerLeft}>
            {/* Small circular badge mirrors the auth screen hero, keeping
                the design language consistent across the whole app */}
            <View style={[styles.headerBadge, { backgroundColor: Brand.primary }]}>
              <Ionicons name="leaf" size={20} color={Brand.white} />
            </View>

            <View style={styles.headerText}>
              <Text style={[styles.greeting, { color: textCol }]}>
                {getGreeting()}, {firstName} 👋
              </Text>
              {user?.email ? (
                <Text style={[styles.userEmail, { color: subCol }]} numberOfLines={1}>
                  {user.email}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Right: logout button (person-circle icon) */}
          <Pressable
            onPress={handleLogout}
            hitSlop={10}
            style={({ pressed }) => [
              styles.logoutBtn,
              { backgroundColor: cardBg, borderColor: borderCl, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Ionicons name="log-out-outline" size={20} color={subCol} />
          </Pressable>
        </View>

        {/* ── Stats strip ───────────────────────────────────────────────────
          * Three at-a-glance pill badges give the user a quick sense of their
          * impact without needing to open a stats screen.
          * Note: values are currently placeholder strings — wire to real data
          * once a stats API endpoint is available.
          */}
        <View style={styles.statsStrip}>
          {/* Trees tracked */}
          <View style={[styles.statPill, { backgroundColor: cardBg, borderColor: borderCl }]}>
            <Ionicons name="leaf" size={14} color={Brand.primary} />
            <Text style={[styles.statLabel, { color: textCol }]}>
              {pins.length} <Text style={{ color: subCol }}>trees</Text>
            </Text>
          </View>

          {/* Reports placeholder */}
          <View style={[styles.statPill, { backgroundColor: cardBg, borderColor: borderCl }]}>
            <Ionicons name="document-text-outline" size={14} color={Brand.amber} />
            <Text style={[styles.statLabel, { color: textCol }]}>
              0 <Text style={{ color: subCol }}>reports</Text>
            </Text>
          </View>

          {/* Community rank placeholder */}
          <View style={[styles.statPill, { backgroundColor: cardBg, borderColor: borderCl }]}>
            <Ionicons name="ribbon-outline" size={14} color={Brand.mid} />
            <Text style={[styles.statLabel, { color: textCol }]}>
              — <Text style={{ color: subCol }}>rank</Text>
            </Text>
          </View>
        </View>

        {/* ── Section label ─────────────────────────────────────────────────
          * A small section heading separates the stats strip from the tile grid.
          */}
        <Text style={[styles.sectionLabel, { color: subCol }]}>Quick actions</Text>

        {/* ── Tile grid ─────────────────────────────────────────────────────
          * HomeGrid places tiles using an absolute-positioned 2-column layout.
          * The grid itself has no background — the tile accents provide colour.
          */}
        <HomeGrid items={items} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1 },

  scroll: {
    paddingBottom: 32,
  },

  /* ── Header ── */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  // Small circular brand badge (same language as auth screen hero)
  headerBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    // Subtle shadow so it pops off light and dark backgrounds
    shadowColor: Brand.forest,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  headerText: { flex: 1 },
  greeting: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  userEmail: {
    fontSize: 12,
    marginTop: 1,
  },
  // Logout icon button — circular, subtle border, sits in the top-right
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  /* ── Stats strip ── */
  statsStrip: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
  },
  // Individual stat pill — icon + number + label in a row
  statPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "600",
  },

  /* ── Section label ── */
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    paddingHorizontal: 16,
    marginBottom: 2,
  },
});
