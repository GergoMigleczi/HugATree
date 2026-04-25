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
import * as Location from "expo-location";

import { useAuth } from "@/src/features/auth/AuthProvider";
import { Brand } from "@/constants/theme";
import { HomeGrid, type GridItem } from "../../src/features/home/components/HomeGrid";
import { useLiveLocation } from "@/src/features/location/hooks/useLiveLocation";
import { navigate } from "expo-router/build/global-state/routing";

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
  const { user, logout, isAdmin } = useAuth();
  const router = useRouter();

  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const bg       = isDark ? Brand.charcoal : Brand.offWhite;
  const cardBg   = isDark ? Brand.darkCard : Brand.white;
  const textCol  = isDark ? Brand.offWhite : Brand.charcoal;
  const subCol   = isDark ? Brand.softGray : Brand.midGray;
  const borderCl = isDark ? Brand.deep     : Brand.pale;

  // ── Location label ──
  // Tracks the user's live GPS position via the shared useLiveLocation hook.
  const locationState = useLiveLocation();
  const [cityName, setCityName] = useState<string | null>(null);

  useEffect(() => {
    // Only attempt reverse-geocoding once we have a valid fix.
    if (locationState.status !== "success") return;

    let cancelled = false;
    (async () => {
      try {
        const [place] = await Location.reverseGeocodeAsync(locationState.location);
        if (cancelled) return;
        // Prefer the most specific available name: city > district > subregion > region.
        const name =
          place.city ?? place.district ?? place.subregion ?? place.region ?? null;
        setCityName(name);
      } catch {
        if (!cancelled) setCityName(null);
      }
    })();

    return () => { cancelled = true; };
  }, [locationState.location]);

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
      onPress: () => router.push({
        pathname: "/map",
        params: { startAddingTree: "true",
                  actionId: Date.now().toString()
        },
      }),
    },
    ...(isAdmin ? [{
      type:     "tile" as const,
      id:       "admin",
      title:    "Admin",
      subtitle: "Manage users",
      cols:     2,
      rows:     1,
      icon:     "shield-checkmark-outline" as const,
      accent:   Brand.forest,
      onPress:  () => router.push("/admin"),
    }] : []),
  ];

  if (user?.admin_flag) {
    items.push({
      type: "tile",
      id: "admin",
      title: "Admin Panel",
      subtitle: "Manage users & data",
      cols: 2,
      rows: 1,
      icon: "shield-checkmark-outline",
      accent: ACCENTS.forest,
      onPress: () => router.push("/(admin)"),
    });
}

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

        {/* ── Location banner ──
            Shows "Find trees in [City]" once the device position is resolved,
            "Locating you…" while permission / GPS is pending, or a neutral
            fallback when location is unavailable (denied / error). */}
        <View style={styles.locationBanner}>
          <Ionicons name="location-outline" size={16} color={Brand.primary} />
          <Text style={[styles.locationText, { color: textCol }]}>
            {cityName
              ? `Find trees in ${cityName}`
              : locationState.status === "loading" || locationState.status === "idle"
              ? "Locating you…"
              : "Find trees near you"}
          </Text>
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

  /* Location banner — replaces the stats-pill strip */
  locationBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
  },
  locationText: { fontSize: 14, fontWeight: "600" },

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
