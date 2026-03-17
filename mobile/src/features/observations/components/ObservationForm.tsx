import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Brand } from "@/constants/theme";
import type {
  ObservationFormData,
  TreeDetailsFormData,
  WildlifeFormData,
  HealthFormData,
} from "../observations.types";
import { EMPTY_DETAILS, EMPTY_HEALTH_ISSUE } from "../observations.types";
import TabBar, { type TabDef } from "@/src/ui/TabBar";
import EmptyState from "@/src/ui/EmptyState";
import ChipSelect from "@/src/ui/ChipSelect";
import SpeciesSelect from "@/src/features/trees/components/SpeciesSelect";
import { useWildlifeSpeciesOptions } from "../hooks/useWildlifeSpeciesOptions";

/* ─── Tab definitions ──────────────────────────────────────────────────────── */

type TabId = "note" | "details" | "photos" | "wildlife" | "health";

const TABS: TabDef<TabId>[] = [
  { id: "note",     label: "Note",     icon: "document-text-outline"          },
  { id: "details",  label: "Details",  icon: "resize-outline"                 },
  { id: "photos",   label: "Photos",   icon: "camera-outline",   stub: true   },
  { id: "wildlife", label: "Wildlife", icon: "leaf-outline"                   },
  { id: "health",   label: "Health",   icon: "heart-outline"                  },
];

/* ─── Props ────────────────────────────────────────────────────────────────── */

type Props = {
  value: ObservationFormData;
  onChange: (next: ObservationFormData) => void;
  wildlifeValue: WildlifeFormData;
  onWildlifeChange: (next: WildlifeFormData) => void;
  healthValue: HealthFormData;
  onHealthChange: (next: HealthFormData) => void;
  /** Shows an amber notice that this is the first (initial) observation */
  isNewTree?: boolean;
  /** Which sub-tab to open first */
  initialTab?: TabId;
};

/* ─── Component ────────────────────────────────────────────────────────────── */

export default function ObservationForm({
  value,
  onChange,
  wildlifeValue,
  onWildlifeChange,
  healthValue,
  onHealthChange,
  isNewTree,
  initialTab,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabId>(initialTab ?? "note");

  // Wildlife species — loaded lazily when the wildlife tab is first opened
  const wildlifeSpecies = useWildlifeSpeciesOptions(activeTab === "wildlife");

  function setField<K extends keyof ObservationFormData>(
    key: K,
    val: ObservationFormData[K]
  ) {
    onChange({ ...value, [key]: val });
  }

  function setDetailField<K extends keyof TreeDetailsFormData>(
    key: K,
    val: string
  ) {
    onChange({ ...value, details: { ...value.details, [key]: val } });
  }

  function setWildlifeField<K extends keyof WildlifeFormData>(
    key: K,
    val: string
  ) {
    onWildlifeChange({ ...wildlifeValue, [key]: val });
  }

  function updateHealthIssue(idx: number, patch: Partial<typeof EMPTY_HEALTH_ISSUE>) {
    const next = [...healthValue.issues];
    next[idx] = { ...next[idx], ...patch };
    onHealthChange({ ...healthValue, issues: next });
  }

  function removeHealthIssue(idx: number) {
    const next = [...healthValue.issues];
    next.splice(idx, 1);
    onHealthChange({ ...healthValue, issues: next });
  }

  return (
    <View style={styles.container}>
      {/* Tab bar */}
      <TabBar tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Note tab ── */}
        {activeTab === "note" && (
          <>
            {isNewTree && (
              <View style={styles.notice}>
                <Ionicons name="information-circle-outline" size={14} color={Brand.amber} />
                <Text style={styles.noticeText}>
                  This is the initial observation — it will always appear first.
                </Text>
              </View>
            )}

            <Field label="Title (optional)">
              <TextInput
                style={styles.input}
                placeholder="e.g. Healthy oak near the path"
                placeholderTextColor={Brand.softGray}
                value={value.title}
                onChangeText={(t) => setField("title", t)}
              />
            </Field>

            <Field label="Note (optional)">
              <TextInput
                style={[styles.input, styles.multiline]}
                placeholder="Describe what you observed..."
                placeholderTextColor={Brand.softGray}
                value={value.noteText}
                onChangeText={(t) => setField("noteText", t)}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </Field>

            <Field label="Observed on (optional)">
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Brand.softGray}
                value={value.observedAt}
                onChangeText={(t) => setField("observedAt", t)}
              />
            </Field>
          </>
        )}

        {/* ── Details tab ── */}
        {activeTab === "details" && (
          <>
            <Field label="Estimated age (years)">
              <TextInput
                style={styles.input}
                placeholder="e.g. 40"
                placeholderTextColor={Brand.softGray}
                keyboardType="numeric"
                value={value.details.probableAgeYears}
                onChangeText={(t) => setDetailField("probableAgeYears", t)}
              />
            </Field>

            <Field label="Age basis">
              <ChipSelect
                options={["visual_estimate", "tree_ring", "records", "other"]}
                value={value.details.ageBasis}
                onChange={(v) => setDetailField("ageBasis", v)}
              />
            </Field>

            <Field label="Height (m)">
              <TextInput
                style={styles.input}
                placeholder="e.g. 12.5"
                placeholderTextColor={Brand.softGray}
                keyboardType="numeric"
                value={value.details.heightM}
                onChangeText={(t) => setDetailField("heightM", t)}
              />
            </Field>

            <Field label="Height method">
              <ChipSelect
                options={["laser", "clinometer", "tape", "visual", "other"]}
                value={value.details.heightMethod}
                onChange={(v) => setDetailField("heightMethod", v)}
              />
            </Field>

            <Field label="Trunk diameter (cm)">
              <TextInput
                style={styles.input}
                placeholder="e.g. 45"
                placeholderTextColor={Brand.softGray}
                keyboardType="numeric"
                value={value.details.trunkDiameterCm}
                onChangeText={(t) => setDetailField("trunkDiameterCm", t)}
              />
            </Field>

            <Field label="Measurement height (cm)">
              <TextInput
                style={styles.input}
                placeholder="e.g. 130"
                placeholderTextColor={Brand.softGray}
                keyboardType="numeric"
                value={value.details.diameterHeightCm}
                onChangeText={(t) => setDetailField("diameterHeightCm", t)}
              />
            </Field>

            <Field label="Diameter method">
              <ChipSelect
                options={["tape", "caliper", "optical", "other"]}
                value={value.details.diameterMethod}
                onChange={(v) => setDetailField("diameterMethod", v)}
              />
            </Field>

            <Field label="Canopy diameter (m)">
              <TextInput
                style={styles.input}
                placeholder="e.g. 8"
                placeholderTextColor={Brand.softGray}
                keyboardType="numeric"
                value={value.details.canopyDiameterM}
                onChangeText={(t) => setDetailField("canopyDiameterM", t)}
              />
            </Field>

            <Field label="Canopy density">
              <ChipSelect
                options={["open", "partial", "full"]}
                value={value.details.canopyDensity}
                onChange={(v) => setDetailField("canopyDensity", v)}
              />
            </Field>
          </>
        )}

        {/* ── Wildlife tab ── */}
        {activeTab === "wildlife" && (
          <>
            <SpeciesSelect
              label="Wildlife species"
              valueId={wildlifeValue.wildlifeSpeciesId || null}
              options={wildlifeSpecies.status === "success" ? wildlifeSpecies.data : []}
              loading={wildlifeSpecies.status === "loading"}
              error={wildlifeSpecies.status === "error" ? wildlifeSpecies.error : null}
              onChange={(id) => setWildlifeField("wildlifeSpeciesId", String(id))}
            />

            <Field label="Life stage">
              <ChipSelect
                options={["adult", "juvenile", "chick", "egg", "unknown"]}
                value={wildlifeValue.lifeStage}
                onChange={(v) => setWildlifeField("lifeStage", v)}
              />
            </Field>

            <Field label="Evidence type">
              <ChipSelect
                options={["sighting", "tracks", "scat", "nest", "call", "other"]}
                value={wildlifeValue.evidenceType}
                onChange={(v) => setWildlifeField("evidenceType", v)}
              />
            </Field>

            <Field label="Count (optional)">
              <TextInput
                style={styles.input}
                placeholder="e.g. 3"
                placeholderTextColor={Brand.softGray}
                keyboardType="numeric"
                value={wildlifeValue.count}
                onChangeText={(t) => setWildlifeField("count", t)}
              />
            </Field>

            <Field label="Behaviour (optional)">
              <TextInput
                style={[styles.input, styles.multiline]}
                placeholder="Describe what you observed..."
                placeholderTextColor={Brand.softGray}
                value={wildlifeValue.behaviour}
                onChangeText={(t) => setWildlifeField("behaviour", t)}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </Field>
          </>
        )}

        {/* ── Health tab ── */}
        {activeTab === "health" && (
          <>
            <Field label="Health status">
              <ChipSelect
                options={["healthy", "stressed", "declining", "dead"]}
                value={healthValue.healthStatus}
                onChange={(v) => onHealthChange({ ...healthValue, healthStatus: v })}
              />
            </Field>

            <Field label="Risk level">
              <ChipSelect
                options={["low", "medium", "high", "critical"]}
                value={healthValue.riskLevel}
                onChange={(v) => onHealthChange({ ...healthValue, riskLevel: v })}
              />
            </Field>

            {/* Dynamic issues list */}
            {healthValue.issues.map((issue, idx) => (
              <View key={idx} style={styles.issueCard}>
                <View style={styles.issueHeader}>
                  <Text style={styles.issueTitle}>Issue {idx + 1}</Text>
                  <Pressable onPress={() => removeHealthIssue(idx)} hitSlop={8}>
                    <Ionicons name="close-circle-outline" size={18} color={Brand.midGray} />
                  </Pressable>
                </View>

                <Field label="Issue type">
                  <ChipSelect
                    options={["fungal", "pest", "physical", "disease", "other"]}
                    value={issue.issueType}
                    onChange={(v) => updateHealthIssue(idx, { issueType: v })}
                  />
                </Field>

                <Field label="Issue name (optional)">
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Bracket fungus"
                    placeholderTextColor={Brand.softGray}
                    value={issue.issueName}
                    onChangeText={(t) => updateHealthIssue(idx, { issueName: t })}
                  />
                </Field>

                <Field label="Affected part">
                  <ChipSelect
                    options={["roots", "trunk", "bark", "branches", "canopy", "leaves"]}
                    value={issue.affectedPart}
                    onChange={(v) => updateHealthIssue(idx, { affectedPart: v })}
                  />
                </Field>

                <Field label="Severity">
                  <ChipSelect
                    options={["minor", "moderate", "severe", "critical"]}
                    value={issue.severity}
                    onChange={(v) => updateHealthIssue(idx, { severity: v })}
                  />
                </Field>
              </View>
            ))}

            <Pressable
              onPress={() =>
                onHealthChange({ ...healthValue, issues: [...healthValue.issues, EMPTY_HEALTH_ISSUE] })
              }
              style={styles.addIssueBtn}
            >
              <Ionicons name="add-circle-outline" size={16} color={Brand.primary} />
              <Text style={styles.addIssueBtnText}>Add issue</Text>
            </Pressable>
          </>
        )}

        {/* ── Stub tab (photos only) ── */}
        {TABS.find((t) => t.id === activeTab)?.stub && (
          <EmptyState
            icon="construct-outline"
            title="Coming soon"
            subtitle="Photo upload will be available in a future update."
          />
        )}
      </ScrollView>
    </View>
  );
}

/* ─── Field wrapper ────────────────────────────────────────────────────────── */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

/* ─── Styles ───────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  container: { flex: 1 },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 14, paddingBottom: 32 },

  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    backgroundColor: "#FFF8E7",
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: Brand.amberLight,
  },
  noticeText: { flex: 1, fontSize: 12, color: Brand.amber, lineHeight: 17 },

  field:      { gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: "700", color: Brand.charcoal },

  input: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    paddingHorizontal: 12,
    backgroundColor: "#fafafa",
    fontSize: 14,
    color: Brand.charcoal,
  },
  multiline: {
    height: 100,
    paddingTop: 10,
  },

  issueCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Brand.pale,
    padding: 12,
    gap: 12,
    backgroundColor: Brand.offWhite,
  },
  issueHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  issueTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: Brand.midGray,
  },

  addIssueBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Brand.pale,
    backgroundColor: Brand.offWhite,
    alignSelf: "flex-start",
  },
  addIssueBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: Brand.primary,
  },
});
