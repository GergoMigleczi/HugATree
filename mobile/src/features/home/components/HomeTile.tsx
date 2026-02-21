/**
 * HomeTile — A single interactive card in the home-screen grid.
 *
 * Props:
 *  - icon:   optional Ionicons name; shown in a frosted circle badge
 *  - accent: background hex colour (defaults to Brand.primary green)
 *
 * Layout switches based on tile height:
 *  - Tall (rows ≥ 2): icon top-left, text bottom-left (column)
 *  - Short / square:  icon left, text right (row)
 */

import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Brand } from "@/constants/theme";

type Props = {
  title: string;
  subtitle?: string;
  width: number;
  height: number;
  /** Ionicons icon name shown inside the tile */
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  /** Background accent colour — defaults to Brand.primary */
  accent?: string;
  onPress: () => void;
};

export function HomeTile({
  title,
  subtitle,
  width,
  height,
  icon,
  accent = Brand.primary,
  onPress,
}: Props) {
  const isTall = height > 140;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        {
          width,
          height,
          backgroundColor: accent,
          opacity: pressed ? 0.82 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
      ]}
    >
      {isTall ? (
        /* Column layout: icon top-left, text bottom-left */
        <>
          {icon && (
            <View style={styles.iconWrapTall}>
              <View style={styles.iconBg}>
                <Ionicons name={icon} size={26} color={Brand.white} />
              </View>
            </View>
          )}
          <View style={styles.textBlockTall}>
            <Text style={styles.title} numberOfLines={2}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
          </View>
        </>
      ) : (
        /* Row layout: icon left, text right */
        <View style={styles.rowLayout}>
          {icon && (
            <View style={styles.iconBg}>
              <Ionicons name={icon} size={22} color={Brand.white} />
            </View>
          )}
          <View style={styles.textBlockRow}>
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
          </View>
        </View>
      )}
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  tile: {
    borderRadius: 16,
    padding: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 4,
  },

  /* Tall tile */
  iconWrapTall:  { position: "absolute", top: 14, left: 14 },
  textBlockTall: { position: "absolute", bottom: 14, left: 14, right: 14 },

  /* Short tile */
  rowLayout:    { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  textBlockRow: { flex: 1 },

  /* Shared icon badge */
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },

  /* Text */
  title: {
    color: Brand.white,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  subtitle: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 13,
    marginTop: 2,
  },
});
