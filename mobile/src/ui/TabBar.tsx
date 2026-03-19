import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Brand } from "@/constants/theme";

export type TabDef<T extends string = string> = {
  id: T;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  stub?: boolean;
};

type Props<T extends string> = {
  tabs: readonly TabDef<T>[];
  activeTab: T;
  onChange: (id: T) => void;
};

export default function TabBar<T extends string>({ tabs, activeTab, onChange }: Props<T>) {
  return (
    <View style={styles.bar}>
      {tabs.map((t) => {
        const isActive = activeTab === t.id;
        return (
          <Pressable
            key={t.id}
            onPress={() => onChange(t.id)}
            style={[styles.item, isActive && styles.itemActive, t.stub && styles.itemStub]}
          >
            <Ionicons
              name={t.icon}
              size={13}
              color={isActive ? Brand.primary : Brand.softGray}
            />
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Brand.pale,
    paddingHorizontal: 4,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  itemActive: { borderBottomColor: Brand.primary },
  itemStub:   { opacity: 0.4 },
  label:      { fontSize: 11, fontWeight: "700", color: Brand.softGray },
  labelActive:{ color: Brand.primary },
});
