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

import SpeciesSelect from "@/src/features/trees/components/SpeciesSelect";
import { useSpeciesOptions } from "@/src/features/trees/useSpeciesOptions";

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
  const sheetIndex = sheetStage === 0 ? -1 : sheetStage === 1 ? 0 : 1;

  // Species input state (in the real flow this would likely be part of a bigger "new observation" state object)
  const [speciesId, setSpeciesId] = useState<string | null>(null);

  // Loaction input (picked by tapping on the map when sheet is at stage 1)
  type LatLng = { latitude: number; longitude: number };
  const [draftLocation, setDraftLocation] = useState<LatLng | null>(null);
  const canPickLocation = sheetStage === 1;
  const onMapPickLocation = (coord: LatLng) => {
    if (!canPickLocation) return;
    setDraftLocation(coord);
  };

  // only fetch when sheet is open on step 1
  const speciesState = useSpeciesOptions(sheetStage === 1);

  const openAddTree = () => setSheetStage(1);
  const canGoNext = !!speciesId && !!draftLocation;
  const goNext = () => setSheetStage(2);
  const closeSheet = () => {
    setSheetStage(0);
    setSpeciesId(null);
    setDraftLocation(null);
  };

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
    const duration = sheetStage === 1 ? 320 : 50; // a bit slower when going to 35% for a nicer effect
    return {
      height: withTiming(`${heightPct}%`, { duration: duration }),
    };
  }, [sheetStage]);

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
          pickLocationEnabled={canPickLocation}
          onMapPress={onMapPickLocation}
          draftMarker={draftLocation}
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
      {sheetStage !== 0 ? (
        <BottomSheet
          ref={sheetRef}
          index={sheetIndex}                // ✅ controlled
          snapPoints={snapPoints}
          enableDynamicSizing={false}       // ✅ ensures snapPoints are respected (if supported)
          enablePanDownToClose={false}
          enableHandlePanningGesture={false}
          enableContentPanningGesture={false}
          handleComponent={null}
          handleIndicatorStyle={{ backgroundColor: "#999" }}
        >
          <BottomSheetView style={styles.sheetContent}>
            {sheetStage === 1 ? (
              <>
                <Text style={styles.sheetTitle}>Add a Tree</Text>

                <View style={styles.field}>
                  <SpeciesSelect
                    valueId={speciesId}
                    onChange={setSpeciesId}
                    options={speciesState.status === "success" ? speciesState.data : []}
                    loading={speciesState.status === "loading"}
                    error={speciesState.status === "error" ? speciesState.error : null}
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Location</Text>
                  <View style={styles.fakeInput}>
                    <Text style={{ color: draftLocation ? Brand.charcoal : "#666" }}>
                      {draftLocation
                        ? `${draftLocation.latitude.toFixed(6)}, ${draftLocation.longitude.toFixed(6)}`
                        : "Tap map to select a location"}
                    </Text>
                  </View>
                </View>

                <View style={styles.row}>
                  <Pressable onPress={closeSheet} style={styles.secondaryBtn}>
                    <Text style={styles.secondaryBtnText}>Cancel</Text>
                  </Pressable>

                  <Pressable onPress={goNext}
                    style={[styles.primaryBtn, { opacity: canGoNext ? 1 : 0.5 }]}
                    disabled={!canGoNext}
                  >
                    <Text style={styles.primaryBtnText}>Next</Text>
                  </Pressable>
                </View>
              </>
            ) : sheetStage === 2 ? (
              <>
                <Text style={styles.sheetTitle}>Observation</Text>
                <Text style={{ color: "#666", marginBottom: 12 }}>
                  (This will become your existing observation modal UI)
                </Text>

                <Pressable
                  onPress={() => setSheetStage(1)}
                  style={styles.secondaryBtn}
                >
                  <Text style={styles.secondaryBtnText}>Back</Text>
                </Pressable>

                <Pressable
                  onPress={() => setSheetStage(0)}
                  style={styles.primaryBtn}
                >
                  <Text style={styles.primaryBtnText}>Save</Text>
                </Pressable>
              </>
            ) : null}
          </BottomSheetView>
        </BottomSheet>
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