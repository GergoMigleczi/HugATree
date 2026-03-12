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
import type { ObservationFormData, TreeDetailsFormData } from "../observations.types";
import { EMPTY_DETAILS } from "../observations.types";

/* ─── Tab definitions ──────────────────────────────────────────────────────── */

type TabId = "note" | "details" | "photos" | "wildlife" | "health";

const TABS: { id: TabId; label: string; icon: React.ComponentProps<typeof Ionicons>["name"] }[] = [
  { id: "note",     label: "Note",     icon: "document-text-outline" },
  { id: "details",  label: "Details",  icon: "resize-outline"        },
  { id: "photos",   label: "Photos",   icon: "camera-outline"        },
  { id: "wildlife", label: "Wildlife", icon: "leaf-outline"          },
  { id: "health",   label: "Health",   icon: "heart-outline"         },
];

const STUB_TABS: TabId[] = ["photos", "wildlife", "health"];

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
      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const isStub   = STUB_TABS.includes(tab.id);
          const isActive = activeTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              onPress={() => !isStub && setActiveTab(tab.id)}
              style={[styles.tab, isActive && styles.tabActive, isStub && styles.tabStub]}
            >
              <Ionicons
                name={tab.icon}
                size={14}
                color={isStub ? Brand.softGray : isActive ? Brand.primary : Brand.midGray}
              />
              <Text
                style={[
                  styles.tabLabel,
                  isActive && styles.tabLabelActive,
                  isStub  && styles.tabLabelStub,
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

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
        {STUB_TABS.includes(activeTab) && <StubTab />}
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

/* ─── StubTab ──────────────────────────────────────────────────────────────── */

function StubTab() {
  return (
    <View style={styles.stub}>
      <Ionicons name="construct-outline" size={28} color={Brand.softGray} />
      <Text style={styles.stubText}>Coming soon</Text>
      <Text style={styles.stubSub}>This tab requires a future database migration.</Text>
    </View>
  );
}

/* ─── Styles ───────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  container: { flex: 1 },

  tabBar: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Brand.pale,
    paddingHorizontal: 4,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: { borderBottomColor: Brand.primary },
  tabStub:   { opacity: 0.4 },
  tabLabel:      { fontSize: 11, fontWeight: "600", color: Brand.midGray },
  tabLabelActive:{ color: Brand.primary },
  tabLabelStub:  { color: Brand.softGray },

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

  stub: { alignItems: "center", paddingTop: 48, gap: 8 },
  stubText: { fontSize: 15, fontWeight: "700", color: Brand.softGray },
  stubSub:  { fontSize: 12, color: Brand.softGray, textAlign: "center", lineHeight: 18 },
});
