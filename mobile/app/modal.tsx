import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Brand } from "@/constants/theme";
import { getTreeObservationsApi, uploadPhotoApi } from "@/src/features/observations/observations.api";
import { getTreeWildlifeApi, createWildlifeApi } from "@/src/features/observations/observations.wildlife.api";
import { getTreeHealthApi, createHealthApi } from "@/src/features/observations/observations.health.api";
import { createObservation } from "@/src/features/observations/usecases/createObservation";
import ObservationCard from "@/src/features/observations/components/ObservationCard";
import ObservationForm from "@/src/features/observations/components/ObservationForm";
import {
  EMPTY_OBSERVATION_FORM,
  EMPTY_WILDLIFE_FORM,
  EMPTY_HEALTH_FORM,
  type ObservationFormData,
  type ObservationItem,
  type WildlifeFormData,
  type WildlifeItem,
  type HealthFormData,
  type HealthItem,
} from "@/src/features/observations/observations.types";
import { useLoading } from "@/src/ui/loading/LoadingProvider";
import { getTreeDetailsApi } from "@/src/features/trees/trees.api";
import type { TreeDetail } from "@/src/features/trees/trees.types";
import TabBar, { type TabDef } from "@/src/ui/TabBar";
import EmptyState from "@/src/ui/EmptyState";
import PhotoViewer from "@/src/ui/PhotoViewer";
import TreeQrCode from "@/src/features/trees/components/TreeQrCode";

/* ─── Tab definitions ──────────────────────────────────────────────────────── */

type TabId = "overview" | "details" | "history" | "wildlife" | "health";

const TABS: TabDef<TabId>[] = [
  { id: "overview",  label: "Overview",  icon: "list-outline"     },
  { id: "details",   label: "Details",   icon: "resize-outline"   },
  { id: "history",   label: "History",   icon: "calendar-outline" },
  { id: "wildlife",  label: "Wildlife",  icon: "leaf-outline"     },
  { id: "health",    label: "Health",    icon: "heart-outline"    },
];

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

/** Converts a WildlifeItem to the ObservationItem shape ObservationCard expects */
function wildlifeToCard(w: WildlifeItem): ObservationItem {
  return {
    id:         w.observationId,
    title:      w.title ?? `${w.wildlifeSpeciesName} — ${w.lifeStage}`,
    noteText:   w.noteText,
    observedAt: w.observedAt,
    createdAt:  w.createdAt,
    authorName: w.authorName,
    photoKey:   w.photoKey,
  };
}

/** Converts a HealthItem to the ObservationItem shape ObservationCard expects */
function healthToCard(h: HealthItem): ObservationItem {
  return {
    id:         h.observationId,
    title:      h.title ?? `${h.healthStatus} — ${h.riskLevel} risk`,
    noteText:   h.noteText,
    observedAt: h.observedAt,
    createdAt:  h.createdAt,
    authorName: h.authorName,
    photoKey:   h.photoKey,
  };
}

/* ─── Screen ───────────────────────────────────────────────────────────────── */

export default function TreeModalScreen() {
  const { treeId } = useLocalSearchParams<{ treeId: string }>();
  const router = useRouter();
  const { withLoading } = useLoading();

  const numericTreeId = treeId ? parseInt(treeId, 10) : null;

  /* ── Tab + mode ─────────────────────────────────────────────────────────── */
  const [tab,  setTab]  = useState<TabId>("overview");
  const [mode, setMode] = useState<"view" | "add">("view");

  /* ── Observations ───────────────────────────────────────────────────────── */
  const [observations, setObservations] = useState<ObservationItem[] | null>(null);
  const [loadError,    setLoadError]    = useState<string | null>(null);

  /* ── Details ────────────────────────────────────────────────────────────── */
  const [details,      setDetails]      = useState<TreeDetail | null | "loading" | "error">(null);
  const detailsFetched = useRef(false);

  /* ── Wildlife ───────────────────────────────────────────────────────────── */
  const [wildlife,      setWildlife]      = useState<WildlifeItem[] | null>(null);
  const [wildlifeError, setWildlifeError] = useState<string | null>(null);
  const wildlifeFetched = useRef(false);

  /* ── Health ─────────────────────────────────────────────────────────────── */
  const [health,      setHealth]      = useState<HealthItem[] | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const healthFetched = useRef(false);

  /* ── Form data ──────────────────────────────────────────────────────────── */
  const [formData,     setFormData]     = useState<ObservationFormData>(EMPTY_OBSERVATION_FORM);
  const [wildlifeForm, setWildlifeForm] = useState<WildlifeFormData>(EMPTY_WILDLIFE_FORM);
  const [healthForm,   setHealthForm]   = useState<HealthFormData>(EMPTY_HEALTH_FORM);

  /* ── QR code modal ───────────────────────────────────────────────────────── */
  const [qrVisible, setQrVisible] = useState(false);

  /* ── Full-screen photo viewer ────────────────────────────────────────────── */
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);

  /* ── Load observations on mount ─────────────────────────────────────────── */
  useEffect(() => {
    if (!numericTreeId) return;
    let cancelled = false;

    (async () => {
      try {
        const items = await getTreeObservationsApi(numericTreeId);
        if (!cancelled) setObservations(items);
      } catch (e: any) {
        if (!cancelled) setLoadError(e?.message ?? "Could not load observations");
      }
    })();

    return () => { cancelled = true; };
  }, [numericTreeId]);

  /* ── Load details (lazy, once) ──────────────────────────────────────────── */
  useEffect(() => {
    if (tab !== "details" || !numericTreeId || detailsFetched.current) return;
    detailsFetched.current = true;
    setDetails("loading");
    getTreeDetailsApi(numericTreeId)
      .then((d) => setDetails(d))
      .catch(() => setDetails("error"));
  }, [tab, numericTreeId]);

  /* ── Load wildlife (lazy, once) ─────────────────────────────────────────── */
  useEffect(() => {
    if (tab !== "wildlife" || !numericTreeId || wildlifeFetched.current) return;
    wildlifeFetched.current = true;
    getTreeWildlifeApi(numericTreeId)
      .then((items) => setWildlife(items))
      .catch((e) => setWildlifeError(e?.message ?? "Could not load wildlife records"));
  }, [tab, numericTreeId]);

  /* ── Load health (lazy, once) ───────────────────────────────────────────── */
  useEffect(() => {
    if (tab !== "health" || !numericTreeId || healthFetched.current) return;
    healthFetched.current = true;
    getTreeHealthApi(numericTreeId)
      .then((items) => setHealth(items))
      .catch((e) => setHealthError(e?.message ?? "Could not load health records"));
  }, [tab, numericTreeId]);

  /* ── Save ───────────────────────────────────────────────────────────────── */
  async function handleSave() {
    if (!numericTreeId) return;

    // Validate required fields
    if (tab !== "wildlife" && tab !== "health") {
      if (!formData.title.trim()) {
        Alert.alert("Missing required fields", "Title is required — go to the Note tab.");
        return;
      }
    }
    if (tab === "details" && !formData.details.canopyDiameterM) {
      Alert.alert("Missing required fields", "Canopy diameter (m) is required — go to the Details tab.");
      return;
    }

    try {
      // Upload photo first if one was selected — same pattern as map.tsx
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

      if (tab === "wildlife") {
        await withLoading(
          () => createWildlifeApi(numericTreeId, formData, wildlifeForm, photoKeys),
          { message: "Saving...", blocking: true, background: "transparent" }
        );
        // Refresh both wildlife list and observations (observation is created too)
        const [newWildlife, newObs] = await Promise.all([
          getTreeWildlifeApi(numericTreeId),
          getTreeObservationsApi(numericTreeId),
        ]);
        setWildlife(newWildlife);
        setObservations(newObs);

      } else if (tab === "health") {
        await withLoading(
          () => createHealthApi(numericTreeId, formData, healthForm, photoKeys),
          { message: "Saving...", blocking: true, background: "transparent" }
        );
        const [newHealth, newObs] = await Promise.all([
          getTreeHealthApi(numericTreeId),
          getTreeObservationsApi(numericTreeId),
        ]);
        setHealth(newHealth);
        setObservations(newObs);

      } else {
        await withLoading(
          () => createObservation(numericTreeId, formData, photoKeys),
          { message: "Saving...", blocking: true, background: "transparent" }
        );
        const items = await getTreeObservationsApi(numericTreeId);
        setObservations(items);
        // Refresh details if the form had measurements
        if (tab === "details") {
          detailsFetched.current = false;
          getTreeDetailsApi(numericTreeId)
            .then((d) => setDetails(d))
            .catch(() => setDetails("error"));
        }
      }

      setFormData(EMPTY_OBSERVATION_FORM);
      setWildlifeForm(EMPTY_WILDLIFE_FORM);
      setHealthForm(EMPTY_HEALTH_FORM);
      setMode("view");
    } catch (e: any) {
      Alert.alert("Failed to save", e?.message ?? "Please try again.");
    }
  }

  function cancelAdd() {
    setFormData(EMPTY_OBSERVATION_FORM);
    setWildlifeForm(EMPTY_WILDLIFE_FORM);
    setHealthForm(EMPTY_HEALTH_FORM);
    setMode("view");
  }

  /* ── Header button label ────────────────────────────────────────────────── */
  function renderHeaderAction() {
    if (mode === "add") {
      return (
        <Pressable onPress={cancelAdd} style={styles.cancelBtn} hitSlop={8}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </Pressable>
      );
    }
    if (tab === "details") {
      return (
        <Pressable onPress={() => setMode("add")} style={styles.addBtn} hitSlop={8}>
          <Ionicons name="pencil-outline" size={14} color={Brand.white} />
          <Text style={styles.addBtnText}>Update</Text>
        </Pressable>
      );
    }
    if (tab === "wildlife") {
      return (
        <Pressable onPress={() => setMode("add")} style={styles.addBtn} hitSlop={8}>
          <Ionicons name="add" size={16} color={Brand.white} />
          <Text style={styles.addBtnText}>Add wildlife</Text>
        </Pressable>
      );
    }
    if (tab === "health") {
      return (
        <Pressable onPress={() => setMode("add")} style={styles.addBtn} hitSlop={8}>
          <Ionicons name="add" size={16} color={Brand.white} />
          <Text style={styles.addBtnText}>Add health</Text>
        </Pressable>
      );
    }
    return (
      <Pressable onPress={() => setMode("add")} style={styles.addBtn} hitSlop={8}>
        <Ionicons name="add" size={16} color={Brand.white} />
        <Text style={styles.addBtnText}>Add note</Text>
      </Pressable>
    );
  }

  /* ── Which tab to open ObservationForm on ───────────────────────────────── */
  function formInitialTab(): "note" | "details" | "wildlife" | "health" {
    if (tab === "details")  return "details";
    if (tab === "wildlife") return "wildlife";
    if (tab === "health")   return "health";
    return "note";
  }

  /* ── Open QR code modal ──────────────────────────────────────────────────── */
  function openQr() {
    setQrVisible(true);
  }

  /* ── Close QR code modal ─────────────────────────────────────────────────── */
  function closeQr() {
    setQrVisible(false);
  }

  /* ── Derived ────────────────────────────────────────────────────────────── */
  const heroPhotoUri = observations?.find((o) => o.photoKey)?.photoKey ?? null;

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <View style={styles.container}>

      {/* Header */}
      <SafeAreaView edges={["top"]} style={styles.headerSafe}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.closeBtn} hitSlop={8}>
            <Ionicons name="close" size={20} color={Brand.charcoal} />
          </Pressable>

          <View style={styles.headerText}>
            <Text style={styles.treeTitle}>Tree #{treeId}</Text>
            <Text style={styles.treeMeta}>
              {observations === null && !loadError
                ? "Loading..."
                : `${observations?.length ?? 0} observation${observations?.length === 1 ? "" : "s"}`}
            </Text>
          </View>
          
          <Pressable onPress={() => openQr()} style={styles.qrBtn}>
            <Text>QR</Text>
          </Pressable>
          {renderHeaderAction()}
        </View>
      </SafeAreaView>

      {/* Tab bar — hidden while in add mode */}
      {mode === "view" && (
        <TabBar tabs={TABS} activeTab={tab} onChange={setTab} />
      )}

      {/* ── View mode ────────────────────────────────────────────────────── */}
      {mode === "view" && (
        <>
          {/* Details tab */}
          {tab === "details" && (
            <ScrollView contentContainerStyle={styles.listContent}>
              {details === "loading" && (
                <ActivityIndicator style={styles.spinner} color={Brand.primary} />
              )}
              {details === "error" && (
                <Text style={styles.errorText}>Could not load details.</Text>
              )}
              {details !== null && details !== "loading" && details !== "error" && (
                <View style={styles.detailsCard}>
                  <DetailRow label="Height"          value={details.heightM != null ? `${details.heightM} m` : null}          sub={details.heightMethod} />
                  <DetailRow label="Trunk diameter"  value={details.trunkDiameterCm != null ? `${details.trunkDiameterCm} cm` : null} sub={[details.diameterHeightCm != null ? `@ ${details.diameterHeightCm} cm` : null, details.diameterMethod].filter(Boolean).join(" · ")} />
                  <DetailRow label="Canopy diameter" value={details.canopyDiameterM != null ? `${details.canopyDiameterM} m` : null}  sub={details.canopyDensity} />
                  <DetailRow label="Est. age"        value={details.probableAgeYears != null ? `${details.probableAgeYears} yrs` : null} sub={details.ageBasis} />
                  <DetailRow label="Est. CO2 Sequestered" value={details.estimatedCo2SequesteredYearKg != null ? `${details.estimatedCo2SequesteredYearKg} kg` : null} sub="Estimated Co2 Sequestered / Year" />
                  <DetailRow label="Est. Water Use" value={details.estimatedWaterUseYearL != null ? `${details.estimatedWaterUseYearL} L` : null} sub="Estimated Water Use / Year" />
                  {(details.recordedByName || details.recordedAt) && (
                    <View style={styles.detailsFooter}>
                      {details.recordedByName && (
                        <View style={styles.detailsFooterItem}>
                          <Ionicons name="person-outline" size={11} color={Brand.softGray} />
                          <Text style={styles.detailsFooterText}>{details.recordedByName}</Text>
                        </View>
                      )}
                      {details.recordedAt && (
                        <View style={styles.detailsFooterItem}>
                          <Ionicons name="calendar-outline" size={11} color={Brand.softGray} />
                          <Text style={styles.detailsFooterText}>
                            {new Date(details.recordedAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              )}
              {details === null && (
                <EmptyState
                  icon="resize-outline"
                  title="No measurements yet."
                  subtitle="Measurements are recorded with observations."
                />
              )}
            </ScrollView>
          )}

          {/* Overview + History tabs — observation list */}
          {(tab === "overview" || tab === "history") && (
            <ScrollView contentContainerStyle={styles.listContent}>
              {/* Hero photo — first observation photo, overview tab only */}
              {tab === "overview" && heroPhotoUri && (
                <Pressable onPress={() => setViewingPhoto(heroPhotoUri)} style={styles.heroWrap}>
                  <Image source={{ uri: heroPhotoUri }} style={styles.heroImage} contentFit="cover" />
                  <View style={styles.heroOverlay}>
                    <Ionicons name="expand-outline" size={18} color="#fff" />
                  </View>
                </Pressable>
              )}

              {loadError && (
                <Text style={styles.errorText}>{loadError}</Text>
              )}
              {!loadError && observations === null && (
                <ActivityIndicator style={styles.spinner} color={Brand.primary} />
              )}
              {!loadError && observations !== null && observations.length === 0 && (
                <EmptyState
                  icon="leaf-outline"
                  title="No observations yet."
                  subtitle={'Tap "Add note" to be the first.'}
                />
              )}
              {(observations ?? []).map((obs, idx) => (
                <ObservationCard
                  key={obs.id}
                  item={obs}
                  isInitial={tab === "overview" && idx === 0}
                  onPhotoPress={setViewingPhoto}
                />
              ))}
            </ScrollView>
          )}

          {/* Wildlife tab */}
          {tab === "wildlife" && (
            <ScrollView contentContainerStyle={styles.listContent}>
              {wildlifeError && (
                <Text style={styles.errorText}>{wildlifeError}</Text>
              )}
              {!wildlifeError && wildlife === null && (
                <ActivityIndicator style={styles.spinner} color={Brand.primary} />
              )}
              {!wildlifeError && wildlife !== null && wildlife.length === 0 && (
                <EmptyState
                  icon="leaf-outline"
                  title="No wildlife records yet."
                  subtitle={'Tap "Add wildlife" to be the first.'}
                />
              )}
              {(wildlife ?? []).map((w) => (
                <ObservationCard key={w.id} item={wildlifeToCard(w)} isInitial={false} onPhotoPress={setViewingPhoto} />
              ))}
            </ScrollView>
          )}

          {/* Health tab */}
          {tab === "health" && (
            <ScrollView contentContainerStyle={styles.listContent}>
              {healthError && (
                <Text style={styles.errorText}>{healthError}</Text>
              )}
              {!healthError && health === null && (
                <ActivityIndicator style={styles.spinner} color={Brand.primary} />
              )}
              {!healthError && health !== null && health.length === 0 && (
                <EmptyState
                  icon="heart-outline"
                  title="No health records yet."
                  subtitle={'Tap "Add health" to be the first.'}
                />
              )}
              {(health ?? []).map((h) => (
                <ObservationCard key={h.id} item={healthToCard(h)} isInitial={false} onPhotoPress={setViewingPhoto} />
              ))}
            </ScrollView>
          )}
        </>
      )}

      {/* ── Add mode ─────────────────────────────────────────────────────── */}
      {mode === "add" && (
        <>
          <ObservationForm
            value={formData}
            onChange={setFormData}
            wildlifeValue={wildlifeForm}
            onWildlifeChange={setWildlifeForm}
            healthValue={healthForm}
            onHealthChange={setHealthForm}
            initialTab={formInitialTab()}
          />

          <View style={styles.formFooter}>
            <Pressable onPress={cancelAdd} style={styles.secondaryBtn}>
              <Text style={styles.secondaryBtnText}>Cancel</Text>
            </Pressable>
            <Pressable onPress={handleSave} style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>Save observation</Text>
            </Pressable>
          </View>
        </>
      )}

      <TreeQrCode
        visible={qrVisible}
        treeId={numericTreeId}
        onClose={closeQr}
      />

      <PhotoViewer
        uri={viewingPhoto}
        onClose={() => setViewingPhoto(null)}
      />
    </View>
  );
}

/* ─── Detail row helper ────────────────────────────────────────────────────── */

function DetailRow({ label, value, sub }: { label: string; value: string | null; sub?: string | null }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <View style={styles.detailRight}>
        <Text style={[styles.detailValue, !value && styles.detailValueEmpty]}>
          {value ?? "—"}
        </Text>
        {sub ? <Text style={styles.detailSub}>{sub}</Text> : null}
      </View>
    </View>
  );
}

/* ─── Styles ───────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.white },

  headerSafe: {
    backgroundColor: Brand.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Brand.pale,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  closeBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: Brand.offWhite,
    alignItems: "center", justifyContent: "center",
  },
  headerText:  { flex: 1 },
  treeTitle:   { fontSize: 15, fontWeight: "800", color: Brand.charcoal },
  treeMeta:    { fontSize: 11, color: Brand.midGray, marginTop: 1 },

  qrBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: Brand.amberLight,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
  },

  addBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: Brand.primary,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
  },
  addBtnText:    { fontSize: 12, fontWeight: "700", color: Brand.white },
  cancelBtn:     { paddingHorizontal: 12, paddingVertical: 8 },
  cancelBtnText: { fontSize: 13, fontWeight: "600", color: Brand.midGray },

  listContent: { padding: 16, gap: 10, paddingBottom: 48 },

  heroWrap: {
    borderRadius: 12,
    overflow: "hidden",
  },
  heroImage: {
    width: "100%",
    height: 200,
  },
  heroOverlay: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 6,
    padding: 4,
  },
  spinner:     { marginTop: 40 },

  errorText: {
    color: "#ef4444", fontSize: 13, textAlign: "center", marginTop: 40, lineHeight: 20,
  },

  detailsCard: {
    backgroundColor: Brand.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Brand.pale,
    overflow: "hidden",
    marginTop: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Brand.pale,
  },
  detailLabel: {
    fontSize: 13,
    color: Brand.midGray,
    fontWeight: "500",
    flex: 1,
  },
  detailRight: {
    alignItems: "flex-end",
    flex: 1,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "700",
    color: Brand.charcoal,
    textAlign: "right",
  },
  detailValueEmpty: {
    color: Brand.softGray,
    fontWeight: "400",
  },
  detailSub: {
    fontSize: 11,
    color: Brand.softGray,
    marginTop: 2,
    textAlign: "right",
  },
  detailsFooter: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  detailsFooterItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailsFooterText: {
    fontSize: 11,
    color: Brand.softGray,
  },

  formFooter: {
    flexDirection: "row",
    gap: 10,
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Brand.pale,
    backgroundColor: Brand.white,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: Brand.primary,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryBtnText:   { color: Brand.white, fontWeight: "800", fontSize: 14 },
  secondaryBtn:     { backgroundColor: Brand.offWhite, paddingHorizontal: 16, paddingVertical: 13, borderRadius: 12, alignItems: "center" },
  secondaryBtnText: { color: Brand.charcoal, fontWeight: "700", fontSize: 14 },
});
