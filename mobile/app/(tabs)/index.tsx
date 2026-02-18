/**
 * HomeScreen — Main dashboard shown after login.
 *
 * Header uses the HugATree logo image (assets/images/logo.png) alongside a
 * time-aware greeting and a discreet logout button.
 *
 * Layout:
 *  - Branded header: logo thumbnail + greeting + email + logout icon
 *  - Stats strip: trees tracked, open reports, rank (placeholder)
 *  - "Quick actions" section label
 *  - HomeGrid: map (2×2) | Statistics | Reports | Add Tree (2×1)
 */

import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
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
import { getPins } from "../../src/features/map/map.api";
import type { Pin } from "../../src/features/map/map.types";

// HugATree logo — place PNG at mobile/assets/images/logo.png
const LOGO = require("@/assets/images/logo.png");

// Tile accent colours (inline so we don't need to import HomeTile)
const ACCENTS = {
  forest: Brand.deep,
  amber:  Brand.amber,
  teal:   Brand.mid,
} as const;

// Time-of-day greeting
function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const bg       = isDark ? Brand.charcoal : Brand.offWhite;
  const cardBg   = isDark ? Brand.darkCard : Brand.white;
  const textCol  = isDark ? Brand.offWhite : Brand.charcoal;
  const subCol   = isDark ? Brand.softGray : Brand.midGray;
  const borderCl = isDark ? Brand.deep     : Brand.pale;

  const [pins, setPins] = useState<Pin[]>([]);

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

  async function handleLogout() {
    try {
      await logout();
    } catch (e: any) {
      Alert.alert("Logout failed", e.message);
    }
  }

  const firstName = user?.display_name?.split(" ")[0] ?? "there";

  const items: GridItem[] = [
    {
      type:    "map",
      id:      "map-preview",
      cols:    2,
      rows:    2,
      pins,
      onPress: () => router.push("/map"),
    },
    {
      type:     "tile",
      id:       "stats",
      title:    "Statistics",
      subtitle: "View overview",
      cols:     1,
      rows:     1,
      icon:     "bar-chart-outline",
      accent:   ACCENTS.forest,
      onPress:  () => router.push("/stats"),
    },
    {
      type:     "tile",
      id:       "reports",
      title:    "Reports",
      subtitle: "Issues & checks",
      cols:     1,
      rows:     1,
      icon:     "alert-circle-outline",
      accent:   ACCENTS.amber,
      onPress:  () => router.push("/reports"),
    },
    {
      type:     "tile",
      id:       "add-tree",
      title:    "Add Tree",
      subtitle: "Log a new record",
      cols:     2,
      rows:     1,
      icon:     "add-circle-outline",
      accent:   ACCENTS.teal,
      onPress:  () => router.push("/add-tree"),
    },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]} edges={["top"]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {/* Logo thumbnail — small version of the HugATree logo */}
            <Image source={LOGO} style={styles.headerLogo} resizeMode="contain" />
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

          {/* Logout icon button */}
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

        {/* ── Stats strip ── */}
        <View style={styles.statsStrip}>
          <View style={[styles.statPill, { backgroundColor: cardBg, borderColor: borderCl }]}>
            <Ionicons name="leaf" size={14} color={Brand.primary} />
            <Text style={[styles.statLabel, { color: textCol }]}>
              {pins.length} <Text style={{ color: subCol }}>trees</Text>
            </Text>
          </View>
          <View style={[styles.statPill, { backgroundColor: cardBg, borderColor: borderCl }]}>
            <Ionicons name="document-text-outline" size={14} color={Brand.amber} />
            <Text style={[styles.statLabel, { color: textCol }]}>
              0 <Text style={{ color: subCol }}>reports</Text>
            </Text>
          </View>
          <View style={[styles.statPill, { backgroundColor: cardBg, borderColor: borderCl }]}>
            <Ionicons name="ribbon-outline" size={14} color={Brand.mid} />
            <Text style={[styles.statLabel, { color: textCol }]}>
              — <Text style={{ color: subCol }}>rank</Text>
            </Text>
          </View>
        </View>

        {/* ── Section label ── */}
        <Text style={[styles.sectionLabel, { color: subCol }]}>Quick actions</Text>

        {/* ── Tile grid ── */}
        <HomeGrid items={items} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { paddingBottom: 32 },

  /* Header */
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
  // Small logo in the header — 44×44 matches the logout button height
  headerLogo: {
    width: 44,
    height: 44,
  },
  headerText: { flex: 1 },
  greeting: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  userEmail: { fontSize: 12, marginTop: 1 },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Stats strip */
  statsStrip: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
  },
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
  statLabel: { fontSize: 12, fontWeight: "600" },

  /* Section label */
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    paddingHorizontal: 16,
    marginBottom: 2,
  },
});
