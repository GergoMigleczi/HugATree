import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Brand } from "@/constants/theme";

type Props = {
  options: string[];
  value: string;
  onChange: (v: string) => void;
};

export default function ChipSelect({ options, value, onChange }: Props) {
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

const styles = StyleSheet.create({
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#fafafa",
  },
  chipSelected:     { backgroundColor: Brand.primary, borderColor: Brand.primary },
  chipText:         { fontSize: 12, color: Brand.midGray },
  chipTextSelected: { color: Brand.white, fontWeight: "700" },
});
