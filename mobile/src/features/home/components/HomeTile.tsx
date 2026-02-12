import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";

type Props = {
  title: string;
  subtitle?: string;
  width: number;
  height: number;
  onPress: () => void;
};

export function HomeTile({ title, subtitle, width, height, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.tile, { width, height }]}
    >
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#1f2937",
    justifyContent: "center",
  },
  title: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  subtitle: {
    marginTop: 4,
    color: "#9ca3af",
    fontSize: 13,
  },
});