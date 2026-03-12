import React, { useEffect, useState } from "react";
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

/* ─── Tab definitions ──────────────────────────────────────────────────────── */

type TabId = "overview" | "details" | "history" | "wildlife" | "health";

const TABS: { id: TabId; label: string; icon: React.ComponentProps<typeof Ionicons>["name"] }[] = [
  { id: "overview",  label: "Overview",  icon: "list-outline"          },
  { id: "details",   label: "Details",   icon: "resize-outline"        },
  { id: "history",   label: "History",   icon: "calendar-outline"      },
  { id: "wildlife",  label: "Wildlife",  icon: "leaf-outline"          },
  { id: "health",    label: "Health",    icon: "heart-outline"         },
];

const STUB_TABS: TabId[] = ["wildlife", "health"];

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

  const isStubTab = STUB_TABS.includes(tab);

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

          {mode === "view" && !isStubTab ? (
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
        <View style={styles.tabBar}>
          {TABS.map((t) => {
            const isStub   = STUB_TABS.includes(t.id);
            const isActive = tab === t.id;
            return (
              <Pressable
                key={t.id}
                onPress={() => setTab(t.id)}
                style={[styles.tabItem, isActive && styles.tabItemActive, isStub && styles.tabStub]}
              >
                <Ionicons
                  name={t.icon}
                  size={13}
                  color={isActive ? Brand.primary : Brand.softGray}
                />
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* View mode — observation list */}
      {mode === "view" && (
        <>
          {isStubTab ? (
            <View style={styles.stubWrap}>
              <Ionicons name="construct-outline" size={32} color={Brand.softGray} />
              <Text style={styles.stubTitle}>Coming soon</Text>
              <Text style={styles.stubSub}>
                This tab requires a future database migration.
              </Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.listContent}>
              {loadError && (
                <Text style={styles.errorText}>{loadError}</Text>
              )}

              {!loadError && observations === null && (
                <ActivityIndicator style={styles.spinner} color={Brand.primary} />
              )}

              {!loadError && observations !== null && observations.length === 0 && (
                <View style={styles.emptyWrap}>
                  <Ionicons name="leaf-outline" size={32} color={Brand.softGray} />
                  <Text style={styles.emptyText}>No observations yet.</Text>
                  <Text style={styles.emptySub}>Tap "Add note" to be the first.</Text>
                </View>
              )}

              {(observations ?? []).map((obs, idx) => (
                <ObservationCard key={obs.id} item={obs} isInitial={idx === 0} />
              ))}
            </ScrollView>
          )}
        </>
      )}

      {/* Add mode — reusable ObservationForm */}
      {mode === "add" && (
        <>
          <ObservationForm value={formData} onChange={setFormData} />

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

  tabBar: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Brand.pale,
    paddingHorizontal: 4,
  },
  tabItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabItemActive: { borderBottomColor: Brand.primary },
  tabStub:       { opacity: 0.4 },
  tabLabel:      { fontSize: 11, fontWeight: "700", color: Brand.softGray },
  tabLabelActive:{ color: Brand.primary },

  listContent: { padding: 16, gap: 10, paddingBottom: 32 },
  spinner:     { marginTop: 40 },

  errorText: {
    color: "#ef4444", fontSize: 13, textAlign: "center", marginTop: 40, lineHeight: 20,
  },
  emptyWrap: { alignItems: "center", paddingTop: 48, gap: 8 },
  emptyText: { fontSize: 15, fontWeight: "700", color: Brand.softGray },
  emptySub:  { fontSize: 12, color: Brand.softGray },

  stubWrap:  { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  stubTitle: { fontSize: 15, fontWeight: "700", color: Brand.softGray },
  stubSub:   { fontSize: 12, color: Brand.softGray, textAlign: "center", lineHeight: 18 },

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
