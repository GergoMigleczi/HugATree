import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import Animated, { useAnimatedStyle, withTiming } from "react-native-reanimated";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";

import MapImpl from "../../src/features/map/platform/MapImpl";
import { getPins } from "../../src/features/map/map.api";
import type { Pin } from "../../src/features/map/map.types";
import { usePinPress } from "../../src/features/map/usePinPress";
import { useLiveLocation } from "../../src/features/location/hooks/useLiveLocation";
import BackToCurrentLocationButton from "../../src/features/map/components/BackToCurrentLocationButton";
import { Brand } from "@/constants/theme";

export default function MapRoute() {
  const router = useRouter();

  const [pins, setPins] = useState<Pin[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recenterToken, setRecenterToken] = useState(0);

  const onPinPress = usePinPress();

  const loc = useLiveLocation();
  const userLocation = loc.status === "success" ? loc.location : null;

  // Bottom sheet state
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["35%", "100%"], []);

  // 0 = closed, 1 = 35%, 2 = 100%
  const [sheetStage, setSheetStage] = useState<0 | 1 | 2>(0);

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
    return () => {
      cancelled = true;
    };
  }, []);

  // Animate the map container height based on the sheet stage.
  // Skeleton/simple version: closed => 100%, open at 35% => 65%, full => 0% (map hidden)
  const mapAnimatedStyle = useAnimatedStyle(() => {
    const heightPct = sheetStage === 0 ? 100 : sheetStage === 1 ? 65 : 0;
    return {
      height: withTiming(`${heightPct}%`, { duration: 220 }),
    };
  }, [sheetStage]);

  const openAddTree = () => {
    setSheetStage(1);
    // snap index 0 => "35%"
    sheetRef.current?.snapToIndex(0);
  };

  const goNext = () => {
    setSheetStage(2);
    // snap index 1 => "100%"
    sheetRef.current?.snapToIndex(1);
  };

  const closeSheet = () => {
    setSheetStage(0);
    sheetRef.current?.close(); // collapse/close
  };

  if (error) {
    return <View style={styles.center} />;
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Map in an animated container so we can “shrink” it */}
      <Animated.View style={[{ width: "100%" }, mapAnimatedStyle]}>
        <MapImpl
          pins={pins ?? []}
          userLocation={userLocation}
          onPinPress={onPinPress}
          recenterToken={recenterToken}
        />

        {!pins ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator />
          </View>
        ) : null}

        {/* Back to home */}
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

        {/* Buttons (bottom-right stack) */}
        <View style={styles.rightControls} pointerEvents="box-none">
          {userLocation ? (
            <BackToCurrentLocationButton onPress={() => setRecenterToken((n) => n + 1)} />
          ) : null}

          <Pressable
            onPress={openAddTree}
            style={({ pressed }) => [
              styles.addTreeBtn,
              { opacity: pressed ? 0.75 : 1 },
            ]}
            hitSlop={8}
          >
            <Ionicons name="add" size={18} color={Brand.charcoal} />
            <Text style={styles.addTreeText}>Add Tree</Text>
          </Pressable>
        </View>
      </Animated.View>

      {/* Bottom sheet lives outside the map container */}
      <BottomSheet
        ref={sheetRef}
        index={-1} // closed initially
        snapPoints={snapPoints}
        enablePanDownToClose={false}     // ✅ can’t swipe down to close
        enableHandlePanningGesture={false} // ✅ can’t drag by the handle
        enableContentPanningGesture={false} // ✅ can’t drag by panning content
        handleComponent={null}           // ✅ removes the grab handle UI
        onClose={() => setSheetStage(0)}
        handleIndicatorStyle={{ backgroundColor: "#999" }}
      >
        <BottomSheetView style={styles.sheetContent}>
          {sheetStage === 1 ? (
            <>
              <Text style={styles.sheetTitle}>Add a Tree</Text>

              {/* Skeleton placeholders */}
              <View style={styles.field}>
                <Text style={styles.label}>Tree species</Text>
                <View style={styles.fakeInput}>
                  <Text style={{ color: "#666" }}>[Dropdown goes here]</Text>
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Location</Text>
                <View style={styles.fakeInput}>
                  <Text style={{ color: "#666" }}>[Tap map to select lat/long]</Text>
                </View>
              </View>

              <View style={styles.row}>
                <Pressable onPress={closeSheet} style={styles.secondaryBtn}>
                  <Text style={styles.secondaryBtnText}>Cancel</Text>
                </Pressable>

                <Pressable onPress={goNext} style={styles.primaryBtn}>
                  <Text style={styles.primaryBtnText}>Next</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.sheetTitle}>Observation</Text>
              <Text style={{ color: "#666", marginBottom: 12 }}>
                (This will become your existing observation modal UI)
              </Text>

              <Pressable
                onPress={() => {
                  // Optional: go back to step 1
                  setSheetStage(1);
                  sheetRef.current?.snapToIndex(0);
                }}
                style={styles.secondaryBtn}
              >
                <Text style={styles.secondaryBtnText}>Back</Text>
              </Pressable>
            </>
          )}
        </BottomSheetView>
      </BottomSheet>
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

  rightControls: {
    position: "absolute",
    right: 12,
    bottom: 24,
    alignItems: "flex-end",
    gap: 12,
  },

  addTreeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Brand.white,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 999,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  addTreeText: {
    fontWeight: "700",
    fontSize: 14,
    color: Brand.charcoal,
  },

  sheetContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 14,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Brand.charcoal,
  },

  field: { gap: 6 },
  label: { fontSize: 12, fontWeight: "700", color: Brand.charcoal },
  fakeInput: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    justifyContent: "center",
    paddingHorizontal: 12,
    backgroundColor: "#fafafa",
  },

  row: { flexDirection: "row", gap: 10, justifyContent: "flex-end" },

  primaryBtn: {
    backgroundColor: Brand.charcoal,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
  },
  primaryBtnText: { color: "white", fontWeight: "800" },

  secondaryBtn: {
    backgroundColor: "#eee",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
  },
  secondaryBtnText: { color: Brand.charcoal, fontWeight: "800" },
});