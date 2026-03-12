import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Brand } from "@/constants/theme";
import type { ObservationFormData, TreeDetailsFormData } from "../observations.types";
import { EMPTY_DETAILS } from "../observations.types";
import TabBar, { type TabDef } from "@/src/ui/TabBar";
import EmptyState from "@/src/ui/EmptyState";

/* ─── Tab definitions ──────────────────────────────────────────────────────── */

type TabId = "note" | "details" | "photos" | "wildlife" | "health";

const TABS: TabDef<TabId>[] = [
  { id: "note",     label: "Note",     icon: "document-text-outline"              },
  { id: "details",  label: "Details",  icon: "resize-outline"                     },
  { id: "photos",   label: "Photos",   icon: "camera-outline",  stub: true },
  { id: "wildlife", label: "Wildlife", icon: "leaf-outline",    stub: true },
  { id: "health",   label: "Health",   icon: "heart-outline",   stub: true },
];

/* ─── Props ────────────────────────────────────────────────────────────────── */

type Props = {
  value: ObservationFormData;
  onChange: (next: ObservationFormData) => void;
  /** Shows an amber notice that this is the first (initial) observation */
  isNewTree?: boolean;
  /** Which sub-tab to open first */
  initialTab?: TabId;
};

/* ─── Component ────────────────────────────────────────────────────────────── */

export default function ObservationForm({ value, onChange, isNewTree, initialTab }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>(initialTab ?? "note");

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

        {/* ── Stub tabs ── */}
        {TABS.find((t) => t.id === activeTab)?.stub && (
          <EmptyState
            icon="construct-outline"
            title="Coming soon"
            subtitle="This tab requires a future database migration."
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

/* ─── ChipSelect ───────────────────────────────────────────────────────────── */

function ChipSelect({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.chips}>
      {options.map((opt) => {
        const selected = value === opt;
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(selected ? "" : opt)}
            style={[styles.chip, selected && styles.chipSelected]}
          >
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
              {opt.replace(/_/g, " ")}
            </Text>
          </Pressable>
        );
      })}
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

  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#fafafa",
  },
  chipSelected: { backgroundColor: Brand.primary, borderColor: Brand.primary },
  chipText:         { fontSize: 12, color: Brand.midGray },
  chipTextSelected: { color: Brand.white, fontWeight: "700" },
});
