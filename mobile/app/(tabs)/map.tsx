import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import Animated, { useAnimatedStyle, withTiming } from "react-native-reanimated";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";

import MapImpl from "../../src/features/map/platform/MapImpl";
import type {Bbox, MapRegion, MapLayer} from "../../src/features/map/map.types";
import { usePinPress } from "../../src/features/map/usePinPress";
import { useLiveLocation } from "../../src/features/location/hooks/useLiveLocation";
import BackToCurrentLocationButton from "../../src/features/map/components/BackToCurrentLocationButton";
import { Brand } from "@/constants/theme";

import SpeciesSelect from "@/src/features/trees/components/SpeciesSelect";
import { useSpeciesOptions } from "@/src/features/trees/hooks/useSpeciesOptions";
import { useLoading } from "@/src/ui/loading/LoadingProvider";
import { createTree } from "@/src/features/trees/usecases/createTree";
import { usePinsInBbox } from "@/src/features/trees/hooks/usePinsInBox";
import ObservationForm from "@/src/features/observations/components/ObservationForm";
import {
  EMPTY_OBSERVATION_FORM,
  EMPTY_WILDLIFE_FORM,
  EMPTY_HEALTH_FORM,
  buildDetailsPayload,
  type ObservationFormData,
  type WildlifeFormData,
  type HealthFormData,
} from "@/src/features/observations/observations.types";
import { uploadPhotoApi } from "@/src/features/observations/observations.api";
import { useMapRefreshStore } from '@/src/features/map/map.store';
import { validateTreeForm } from '@/src/features/map/validateTreeForm';

export default function MapRoute() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { startAddingTree, actionId, mode } = useLocalSearchParams();
  const isApprovalMode = mode === "adminApproval";

  const [error, setError] = useState<string | null>(null);
  const [recenterToken, setRecenterToken] = useState(0);
  const [submitting, setSubmitting]   = useState(false);
  const [viewport, setViewport] = useState<{ region: MapRegion; bbox: Bbox } | null>(null);
  const [searchViewport, setSearchViewport] = useState<typeof viewport | null>(null);
  const didAutoSearch = useRef(false);
  const [showSearchHere, setShowSearchHere] = useState(false);
  const pinsState = usePinsInBbox({
    viewport: searchViewport,
    enabled: true,
    limit: 5000,
    mode: isApprovalMode ? "adminApproval" : "public",
  });

  const needsRefresh = useMapRefreshStore((s) => s.needsRefresh);
  const clearRefresh = useMapRefreshStore((s) => s.clearRefresh);

  const [mapLayer, setMapLayer] = useState<MapLayer>("standard");

  const pins = pinsState.pins;

  const onPinPress = usePinPress(isApprovalMode ? "adminApproval" : "public");

  const loc = useLiveLocation();
  const userLocation = loc.status === "success" ? loc.location : null;


  // Bottom sheet state
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["50%", "100%"], []);

  // 0 = closed, 1 = 50%, 2 = 100%
  const [sheetStage, setSheetStage] = useState<0 | 1 | 2>(0);
  const sheetIndex = sheetStage === 0 ? -1 : sheetStage === 1 ? 0 : 1;

  // Species input state
  const [speciesId, setSpeciesId] = useState<string | null>(null);
  // Free-text species for species not in the list
  const [customSpeciesName, setCustomSpeciesName] = useState("");
  const [showCustomSpecies, setShowCustomSpecies] = useState(false);

  // Tree-level optional fields (stage 1)
  const [plantedBy, setPlantedBy] = useState("");
  const [plantedAt, setPlantedAt] = useState("");
  const [plantedAtDate, setPlantedAtDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [addressText, setAddressText] = useState("");

  // Observation form state for Stage 2
  const [formData, setFormData] = useState<ObservationFormData>(EMPTY_OBSERVATION_FORM);
  const [wildlifeData, setWildlifeData] = useState<WildlifeFormData>(EMPTY_WILDLIFE_FORM);
  const [healthData, setHealthData] = useState<HealthFormData>(EMPTY_HEALTH_FORM);

  // Location input (picked by tapping on the map when sheet is at stage 1)
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

  useEffect(() => {
    if (startAddingTree === "true") {
      openAddTree(); // reset param so it doesn't trigger again on re-render
    }
  }, [startAddingTree, actionId]);

  // Stage 1 is complete when location is set AND either a species is selected or a custom name is entered
  const hasSpecies = !!speciesId || customSpeciesName.trim().length > 0;
  const canGoNext = hasSpecies && !!draftLocation;

  const goNext = () => setSheetStage(2);
  const closeSheet = () => {
    setSheetStage(0);
    setSpeciesId(null);
    setCustomSpeciesName("");
    setShowCustomSpecies(false);
    setDraftLocation(null);
    setPlantedBy("");
    setPlantedAt("");
    setPlantedAtDate(null);
    setShowDatePicker(false);
    setAddressText("");
    setFormData(EMPTY_OBSERVATION_FORM);
    setWildlifeData(EMPTY_WILDLIFE_FORM);
    setHealthData(EMPTY_HEALTH_FORM);
  };

  const { withLoading } = useLoading();

  // Validate mandatory stage-2 fields and return an error message, or null if OK
  function validateStage2(): string | null {
    return validateTreeForm(formData);
  }

  async function handleSaveTree() {
    const validationError = validateStage2();
    if (validationError) {
      Alert.alert("Missing required fields", validationError);
      return;
    }

    const details = buildDetailsPayload(formData.details);

    try {
      // Upload photo first if one was selected, then include the key in the payload
      let photoKeys: string[] = [];
      if (formData.photoUri) {
        try {
          const storageKey = await uploadPhotoApi(formData.photoUri);
          photoKeys = [storageKey];
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.error("Photo upload error:", msg);
          Alert.alert("Photo upload failed", msg || "Please try again or save without a photo.");
          return;
        }
      }

      await withLoading(
        () => createTree({
          tree: {
            locationLat: draftLocation!.latitude,
            locationLng: draftLocation!.longitude,
            ...(speciesId ? { speciesId: parseInt(speciesId) } : {}),
            ...(customSpeciesName.trim() ? { customSpeciesName: customSpeciesName.trim() } : {}),
            ...(plantedBy.trim() ? { plantedBy: plantedBy.trim() } : {}),
            ...(plantedAt.trim() ? { plantedAt: plantedAt.trim() } : {}),
            ...(addressText.trim() ? { addressText: addressText.trim() } : {}),
          },
          observation: {
            title:      formData.title      || undefined,
            noteText:   formData.noteText   || undefined,
            observedAt: formData.observedAt || undefined,
            ...(photoKeys.length > 0 ? { photoKeys } : {}),
          },
          ...(details ? { details } : {}),
        }),
        { message: "Saving...", blocking: true, background: "transparent" }
      );
      Alert.alert("Tree added", "Your tree has been added successfully.");
      closeSheet();
      // Refresh map pins to show the newly added tree
      setSearchViewport(viewport);
    } catch (e: any) {
      Alert.alert("Failed to save tree", e.message ?? "Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (!needsRefresh) return;
    if (!viewport) return;

    setSearchViewport(viewport);
    setShowSearchHere(false);

    clearRefresh();
  }, [needsRefresh, clearRefresh]);

  useEffect(() => {
    if (didAutoSearch.current) return;
    if (!viewport) return;

    // Case 1: No user location → search fallback region once
    if (!userLocation) {
      didAutoSearch.current = true;
      setSearchViewport(viewport);
      setShowSearchHere(false);
      return;
    }

    // Case 2: User location exists → wait until map is centered on user
    const mapCenter = {
      latitude: viewport.region.latitude,
      longitude: viewport.region.longitude,
    };

    const dLat = (userLocation.latitude - mapCenter.latitude) * 111_000;
    const dLng =
      (userLocation.longitude - mapCenter.longitude) *
      111_000 *
      Math.cos((userLocation.latitude * Math.PI) / 180);

    const distanceMeters = Math.sqrt(dLat * dLat + dLng * dLng);

    if (distanceMeters > 250) return;

    didAutoSearch.current = true;
    setSearchViewport(viewport);
    setShowSearchHere(false);
  }, [viewport, userLocation]);

  // Animate the map container height based on the sheet stage.
  // closed => 100%, stage 1 (50% sheet) => 50% map, stage 2 (100% sheet) => 0% (map hidden)
  const mapAnimatedStyle = useAnimatedStyle(() => {
    const heightPct = sheetStage === 0 ? 100 : sheetStage === 1 ? 50 : 0;
    const duration = sheetStage === 1 ? 320 : 50;
    return {
      height: withTiming(`${heightPct}%`, { duration: duration }),
    };
  }, [sheetStage]);

  if (error) {
    return <View style={styles.center} />;
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Map in an animated container so we can "shrink" it */}
      <Animated.View style={[{ width: "100%" }, mapAnimatedStyle]}>
        <MapImpl
          pins={pins ?? []}
          userLocation={userLocation}
          onPinPress={onPinPress}
          recenterToken={recenterToken}
          pickLocationEnabled={canPickLocation}
          onMapPress={onMapPickLocation}
          draftMarker={draftLocation}
          mapLayer={mapLayer}
          onViewportChange={(v) => {
            setViewport(v);
            setShowSearchHere(true);
          }}
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

        {showSearchHere && viewport ? (
          <View style={styles.searchWrap} pointerEvents="box-none">
            <Pressable
              onPress={() => {
                setSearchViewport(viewport);
                setShowSearchHere(false);
              }}
              style={styles.searchBtn}
            >
              <Text style={styles.searchText}>Search in this area</Text>
            </Pressable>
          </View>
        ) : null}

        {/* Buttons (bottom-right stack) */}
        <View style={styles.rightControls} pointerEvents="box-none">
          {userLocation ? (
            <BackToCurrentLocationButton onPress={() => setRecenterToken((n) => n + 1)} />
          ) : null}

          <Pressable
            onPress={() =>
              setMapLayer((prev) => (prev === "standard" ? "hybrid" : "standard"))
            }
            style={({ pressed }) => [
              styles.layerToggleBtn,
              { opacity: pressed ? 0.75 : 1 },
            ]}
            hitSlop={8}
          >
            <Ionicons
              name={mapLayer === "standard" ? "earth-outline" : "map-outline"}
              size={18}
              color={Brand.charcoal}
            />
            <Text style={styles.layerToggleText}>
              {mapLayer === "standard" ? "Street" : "Satellite"}
            </Text>
          </Pressable>

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
          index={sheetIndex}
          snapPoints={snapPoints}
          enableDynamicSizing={false}
          enablePanDownToClose={false}
          enableHandlePanningGesture={false}
          handleComponent={null}
          handleIndicatorStyle={{ backgroundColor: "#999" }}
        >
          {sheetStage === 1 && (
            <BottomSheetScrollView
              contentContainerStyle={[styles.sheetContent, { paddingTop: insets.top + 16 }]}
              keyboardShouldPersistTaps="handled"
            >
                <Text style={styles.sheetTitle}>Add a Tree</Text>

                {/* Species selection */}
                {!showCustomSpecies ? (
                  <View style={styles.field}>
                    <SpeciesSelect
                      valueId={speciesId}
                      onChange={(id) => {
                        setSpeciesId(id);
                        setCustomSpeciesName("");
                      }}
                      options={speciesState.status === "success" ? speciesState.data : []}
                      loading={speciesState.status === "loading"}
                      error={speciesState.status === "error" ? speciesState.error : null}
                      onNotListed={() => {
                        setShowCustomSpecies(true);
                        setSpeciesId(null);
                      }}
                    />
                  </View>
                ) : (
                  <View style={styles.field}>
                    <Text style={styles.label}>Tree species (custom)</Text>
                    <TextInput
                      style={styles.fakeInput}
                      placeholder="e.g. English Oak"
                      placeholderTextColor="#666"
                      value={customSpeciesName}
                      onChangeText={setCustomSpeciesName}
                      autoFocus
                    />
                    <Pressable
                      onPress={() => {
                        setShowCustomSpecies(false);
                        setCustomSpeciesName("");
                      }}
                      style={styles.notListedBtn}
                    >
                      <Text style={styles.notListedText}>← Back to species list</Text>
                    </Pressable>
                  </View>
                )}

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

                <Text style={styles.optionalSectionLabel}>Optional tree details</Text>

                <View style={styles.field}>
                  <Text style={styles.label}>Planted by</Text>
                  <TextInput
                    style={styles.textInput}
                    value={plantedBy}
                    onChangeText={setPlantedBy}
                    placeholder="e.g. City Council, Jane Smith"
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Date planted</Text>
                  <Pressable
                    style={styles.fakeInput}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text style={{ color: plantedAt ? Brand.charcoal : "#999", fontSize: 14 }}>
                      {plantedAt || "Select a date"}
                    </Text>
                  </Pressable>
                </View>

                <Modal
                  visible={showDatePicker}
                  transparent
                  animationType="slide"
                  onRequestClose={() => setShowDatePicker(false)}
                >
                  <Pressable style={styles.datePickerBackdrop} onPress={() => setShowDatePicker(false)} />
                  <View style={styles.datePickerSheet}>
                    <View style={styles.datePickerHeader}>
                      <Text style={styles.datePickerTitle}>Date planted</Text>
                      <Pressable onPress={() => setShowDatePicker(false)}>
                        <Text style={styles.datePickerDone}>Done</Text>
                      </Pressable>
                    </View>
                    <DateTimePicker
                      mode="date"
                      display="spinner"
                      value={plantedAtDate ?? new Date()}
                      maximumDate={new Date()}
                      onChange={(_event, date) => {
                        if (date) {
                          setPlantedAtDate(date);
                          setPlantedAt(date.toISOString().slice(0, 10));
                        }
                      }}
                      style={{ width: "100%" }}
                    />
                  </View>
                </Modal>

                <View style={styles.field}>
                  <Text style={styles.label}>Address</Text>
                  <TextInput
                    style={styles.textInput}
                    value={addressText}
                    onChangeText={setAddressText}
                    placeholder="e.g. 12 Oak Street"
                    placeholderTextColor="#999"
                  />
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
            </BottomSheetScrollView>
          )}

          {sheetStage === 2 && (
            <View style={styles.stage2Container}>
              <BottomSheetScrollView
                contentContainerStyle={styles.stage2ScrollContent}
                keyboardShouldPersistTaps="handled"
              >
                <View style={[styles.stage2Header, { paddingTop: (insets.top > 0 ? insets.top : 0) + 16 }]}>
                  <Text style={styles.sheetTitle}>Initial Observation</Text>
                  <Text style={styles.stage2Sub}>
                    Title, height, trunk diameter and canopy diameter are required (* fields).
                  </Text>
                </View>

                <ObservationForm
                  value={formData}
                  onChange={setFormData}
                  wildlifeValue={wildlifeData}
                  onWildlifeChange={setWildlifeData}
                  healthValue={healthData}
                  onHealthChange={setHealthData}
                  isNewTree
                  noScroll
                />
              </BottomSheetScrollView>

              <View style={styles.stage2Footer}>
                <Pressable onPress={() => setSheetStage(1)} style={styles.secondaryBtn}>
                  <Text style={styles.secondaryBtnText}>Back</Text>
                </Pressable>
                <Pressable
                  onPress={handleSaveTree}
                  disabled={submitting}
                  style={[styles.primaryBtn, { opacity: submitting ? 0.6 : 1 }]}
                >
                  <Text style={styles.primaryBtnText}>Save Tree</Text>
                </Pressable>
              </View>
            </View>
          )}
        </BottomSheet>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    position: "absolute",
    top: 60,
    alignSelf: "center",
  },
  searchBtn: {
    backgroundColor: Brand.white,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  searchText: {
    fontWeight: "800",
    color: Brand.charcoal,
  },

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
  optionalSectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: Brand.midGray,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 4,
  },
  textInput: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    paddingHorizontal: 12,
    backgroundColor: "#fafafa",
    color: Brand.charcoal,
    fontSize: 14,
  },
  fakeInput: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    justifyContent: "center",
    paddingHorizontal: 12,
    backgroundColor: "#fafafa",
    color: Brand.charcoal,
    fontSize: 14,
  },

  notListedBtn: { paddingVertical: 4 },

  datePickerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  datePickerSheet: {
    backgroundColor: Brand.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 32,
  },
  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Brand.pale,
  },
  datePickerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Brand.charcoal,
  },
  datePickerDone: {
    fontSize: 15,
    fontWeight: "700",
    color: Brand.primary,
  },
  notListedText: { fontSize: 12, color: Brand.primary, fontWeight: "600" },

  row: { flexDirection: "row", gap: 10, justifyContent: "flex-end" },

  stage2Container: { flex: 1 },
  stage2ScrollContent: { paddingBottom: 16 },
  stage2Header: { paddingHorizontal: 16, paddingBottom: 12 },
  stage2Sub: { fontSize: 12, color: Brand.midGray, marginTop: 2 },
  stage2Footer: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Brand.pale,
  },

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
  layerToggleBtn: {
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
  layerToggleText: {
    fontWeight: "700",
    fontSize: 14,
    color: Brand.charcoal,
  },
});
