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
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Brand } from "@/constants/theme";
import { getTreeObservationsApi } from "@/src/features/observations/observations.api";
import { createObservation } from "@/src/features/observations/usecases/createObservation";
import ObservationCard from "@/src/features/observations/components/ObservationCard";
import ObservationForm from "@/src/features/observations/components/ObservationForm";
import {
  EMPTY_OBSERVATION_FORM,
  type ObservationFormData,
  type ObservationItem,
} from "@/src/features/observations/observations.types";
import { useLoading } from "@/src/ui/loading/LoadingProvider";
import { getTreeDetailsApi } from "@/src/features/trees/trees.api";
import type { TreeDetail } from "@/src/features/trees/trees.types";
import TabBar, { type TabDef } from "@/src/ui/TabBar";
import EmptyState from "@/src/ui/EmptyState";

/* ─── Tab definitions ──────────────────────────────────────────────────────── */

type TabId = "overview" | "details" | "history" | "wildlife" | "health";

const TABS: TabDef<TabId>[] = [
  { id: "overview",  label: "Overview",  icon: "list-outline"     },
  { id: "details",   label: "Details",   icon: "resize-outline"   },
  { id: "history",   label: "History",   icon: "calendar-outline" },
  { id: "wildlife",  label: "Wildlife",  icon: "leaf-outline",  stub: true },
  { id: "health",    label: "Health",    icon: "heart-outline", stub: true },
];

/* ─── Screen ───────────────────────────────────────────────────────────────── */

export default function TreeModalScreen() {
  const { treeId } = useLocalSearchParams<{ treeId: string }>();
  const router = useRouter();
  const { withLoading } = useLoading();

  const numericTreeId = treeId ? parseInt(treeId, 10) : null;

  const [tab,          setTab]         = useState<TabId>("overview");
  const [mode,         setMode]        = useState<"view" | "add">("view");
  const [observations, setObservations] = useState<ObservationItem[] | null>(null);
  const [loadError,    setLoadError]   = useState<string | null>(null);
  const [formData,     setFormData]    = useState<ObservationFormData>(EMPTY_OBSERVATION_FORM);
  const [details,      setDetails]     = useState<TreeDetail | null | "loading" | "error">(null);
  const detailsFetched = useRef(false);

  /* ── Load observations ─────────────────────────────────────────────────── */
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

  /* ── Save new observation ──────────────────────────────────────────────── */
  async function handleSave() {
    if (!numericTreeId) return;
    try {
      await withLoading(
        () => createObservation(numericTreeId, formData),
        { message: "Saving...", blocking: true, background: "transparent" }
      );
      const items = await getTreeObservationsApi(numericTreeId);
      setObservations(items);
      if (tab === "details") {
        detailsFetched.current = false;
        getTreeDetailsApi(numericTreeId)
          .then((d) => setDetails(d))
          .catch(() => setDetails("error"));
      }
      setFormData(EMPTY_OBSERVATION_FORM);
      setMode("view");
    } catch (e: any) {
      Alert.alert("Failed to save", e?.message ?? "Please try again.");
    }
  }

  function cancelAdd() {
    setFormData(EMPTY_OBSERVATION_FORM);
    setMode("view");
  }

  /* ── Load details (lazy, once) ─────────────────────────────────────────── */
  useEffect(() => {
    if (tab !== "details" || !numericTreeId || detailsFetched.current) return;
    detailsFetched.current = true;
    setDetails("loading");
    getTreeDetailsApi(numericTreeId)
      .then((d) => setDetails(d))
      .catch(() => setDetails("error"));
  }, [tab, numericTreeId]);

  const isStubTab = TABS.find((t) => t.id === tab)?.stub === true;

  /* ── Render ────────────────────────────────────────────────────────────── */
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

          {mode === "view" && !isStubTab && tab === "details" ? (
            <Pressable onPress={() => setMode("add")} style={styles.addBtn} hitSlop={8}>
              <Ionicons name="pencil-outline" size={14} color={Brand.white} />
              <Text style={styles.addBtnText}>Update</Text>
            </Pressable>
          ) : mode === "view" && !isStubTab ? (
            <Pressable onPress={() => setMode("add")} style={styles.addBtn} hitSlop={8}>
              <Ionicons name="add" size={16} color={Brand.white} />
              <Text style={styles.addBtnText}>Add note</Text>
            </Pressable>
          ) : mode === "add" ? (
            <Pressable onPress={cancelAdd} style={styles.cancelBtn} hitSlop={8}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
          ) : null}
        </View>
      </SafeAreaView>

      {/* Tab bar — hidden while in add mode */}
      {mode === "view" && (
        <TabBar tabs={TABS} activeTab={tab} onChange={setTab} />
      )}

      {/* View mode */}
      {mode === "view" && (
        <>
          {/* Stub tabs */}
          {isStubTab && (
            <View style={styles.stubWrap}>
              <EmptyState
                icon="construct-outline"
                title="Coming soon"
                subtitle="This tab requires a future database migration."
              />
            </View>
          )}

          {/* Details tab */}
          {!isStubTab && tab === "details" && (
            <ScrollView contentContainerStyle={styles.listContent}>
              {details === "loading" && (
                <ActivityIndicator style={styles.spinner} color={Brand.primary} />
              )}
              {details === "error" && (
                <Text style={styles.errorText}>Could not load details.</Text>
              )}
              {(details === null || details === "loading" || details === "error") ? null : (
                <View style={styles.detailsCard}>
                  <DetailRow label="Height" value={details.heightM != null ? `${details.heightM} m` : null} sub={details.heightMethod} />
                  <DetailRow label="Trunk diameter" value={details.trunkDiameterCm != null ? `${details.trunkDiameterCm} cm` : null} sub={[details.diameterHeightCm != null ? `@ ${details.diameterHeightCm} cm` : null, details.diameterMethod].filter(Boolean).join(" · ")} />
                  <DetailRow label="Canopy diameter" value={details.canopyDiameterM != null ? `${details.canopyDiameterM} m` : null} sub={details.canopyDensity} />
                  <DetailRow label="Est. age" value={details.probableAgeYears != null ? `${details.probableAgeYears} yrs` : null} sub={details.ageBasis} />
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
          {!isStubTab && tab !== "details" && (
            <ScrollView contentContainerStyle={styles.listContent}>
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
                <ObservationCard key={obs.id} item={obs} isInitial={tab === "overview" && idx === 0} />
              ))}
            </ScrollView>
          )}
        </>
      )}

      {/* Add mode — reusable ObservationForm */}
      {mode === "add" && (
        <>
          <ObservationForm value={formData} onChange={setFormData} initialTab={tab === "details" ? "details" : "note"} />

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

  addBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: Brand.primary,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
  },
  addBtnText:    { fontSize: 12, fontWeight: "700", color: Brand.white },
  cancelBtn:     { paddingHorizontal: 12, paddingVertical: 8 },
  cancelBtnText: { fontSize: 13, fontWeight: "600", color: Brand.midGray },

  stubWrap: { flex: 1 },

  listContent: { padding: 16, gap: 10, paddingBottom: 32 },
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
