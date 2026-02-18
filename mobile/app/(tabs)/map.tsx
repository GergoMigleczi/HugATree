/**
 * MapRoute — Full-screen interactive map with tree pins.
 *
 * Navigation added:
 *  - A floating "← Home" pill button in the top-left lets users return to
 *    the home dashboard without needing a system back gesture or tab bar.
 *    router.back() pops the screen and preserves home scroll position.
 *  - SafeAreaView wraps the button so it clears the status bar / notch.
 *  - The button uses the same shadow/pill style as BackToCurrentLocationButton
 *    so both controls share a consistent visual language.
 */

import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import MapImpl from "../../src/features/map/platform/MapImpl";
import { getPins } from "../../src/features/map/map.api";
import type { Pin } from "../../src/features/map/map.types";
import { usePinPress } from "../../src/features/map/usePinPress";
import { useLiveLocation } from "../../src/features/location/hooks/useLiveLocation";
import BackToCurrentLocationButton from "../../src/features/map/components/BackToCurrentLocationButton";
import { Brand } from "@/constants/theme";

export default function MapRoute() {
  const router = useRouter();

  const [pins, setPins]                   = useState<Pin[] | null>(null);
  const [error, setError]                 = useState<string | null>(null);
  const [recenterToken, setRecenterToken] = useState(0);

  const onPinPress = usePinPress();

  const loc = useLiveLocation();
  const userLocation = loc.status === "success" ? loc.location : null;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getPins();
        if (!cancelled) setPins(data);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Failed to load pins");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (error) {
    return (
      <View style={styles.center}>
        {/* replace with your own error UI */}
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <MapImpl
        pins={pins ?? []}
        userLocation={userLocation}
        onPinPress={onPinPress}
        recenterToken={recenterToken}
      />

      {/* Loading spinner — shown until the first pin fetch completes */}
      {!pins ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator />
        </View>
      ) : null}

      {/* ── Back to home button ───────────────────────────────────────────
        * Floats over the map in the top-left corner.
        * SafeAreaView with edges={["top"]} pushes it below the notch/status bar.
        * pointerEvents="box-none" lets map touches pass through the safe area
        * container while still capturing taps on the button itself.
        */}
      <SafeAreaView style={styles.backWrap} edges={["top"]} pointerEvents="box-none">
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.75 : 1 }]}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={16} color={Brand.charcoal} />
          <Text style={styles.backText}>Home</Text>
        </Pressable>
      </SafeAreaView>

      {/* "My location" recenter button — bottom-right (existing) */}
      {userLocation ? (
        <BackToCurrentLocationButton
          onPress={() => setRecenterToken((n) => n + 1)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none",
  },

  center: { flex: 1 },

  /* ── Back-to-home floating pill ── */
  backWrap: {
    position: "absolute",
    top: 0,
    left: 12,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Brand.white,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    // Matches the shadow of BackToCurrentLocationButton for visual consistency
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  backText: {
    fontWeight: "600",
    fontSize: 14,
    color: Brand.charcoal,
  },
});
