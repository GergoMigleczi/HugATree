import React, { useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View, FlatList } from "react-native";
import type { SpeciesOption } from "../trees.types";
import { Brand } from "@/constants/theme";

type Props = {
  label?: string;
  valueId: string | null;
  options: SpeciesOption[];
  loading?: boolean;
  error?: string | null;
  onChange: (nextId: string) => void;
};

export default function SpeciesSelect({
  label = "Tree species",
  valueId,
  options,
  loading,
  error,
  onChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const selected = options.find((o) => o.id === valueId) ?? null;

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return options;
    return options.filter((o) => {
      return (
        o.commonName.toLowerCase().includes(s) ||
        (o.scientificName?.toLowerCase().includes(s) ?? false)
      );
    });
  }, [options, q]);

  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>

      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.input, { opacity: pressed ? 0.8 : 1 }]}
        disabled={!!loading}
      >
        <Text style={{ color: selected ? Brand.charcoal : "#666" }}>
          {loading ? "Loading species..." : selected ? selected.commonName : "Select species"}
        </Text>
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalWrap}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select species</Text>
            <Pressable onPress={() => setOpen(false)} style={styles.closeBtn}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>

          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search..."
            placeholderTextColor="#777"
            style={styles.search}
          />

          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.id)}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const active = item.id === valueId;
              return (
                <Pressable
                  onPress={() => {
                    onChange(item.id);
                    setOpen(false);
                  }}
                  style={({ pressed }) => [
                    styles.row,
                    active && styles.rowActive,
                    { opacity: pressed ? 0.8 : 1 },
                  ]}
                >
                  <Text style={styles.rowTitle}>{item.commonName}</Text>
                  {item.scientificName ? (
                    <Text style={styles.rowSub}>{item.scientificName}</Text>
                  ) : null}
                </Pressable>
              );
            }}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 12, fontWeight: "700", color: Brand.charcoal },

  input: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    justifyContent: "center",
    paddingHorizontal: 12,
    backgroundColor: "#fafafa",
  },

  error: { color: "#b00020", fontSize: 12 },

  modalWrap: { flex: 1, paddingTop: 58, paddingHorizontal: 16, gap: 12 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  modalTitle: { fontSize: 18, fontWeight: "800", color: Brand.charcoal },
  closeBtn: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "#eee", borderRadius: 10 },
  closeText: { fontWeight: "800", color: Brand.charcoal },

  search: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    paddingHorizontal: 12,
    color: Brand.charcoal,
    backgroundColor: "#fff",
  },

  row: { paddingVertical: 12, paddingHorizontal: 10, borderRadius: 10 },
  rowActive: { backgroundColor: "#f0f0f0" },
  rowTitle: { fontWeight: "800", color: Brand.charcoal },
  rowSub: { marginTop: 2, color: "#666" },
  sep: { height: 1, backgroundColor: "#eee" },
});