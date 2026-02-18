/**
 * HomeTile — A single interactive card in the home-screen grid.
 *
 * What changed / what was added:
 *  • Replaced the hardcoded dark-grey background (#1f2937) with tile-specific
 *    colours derived from the HugATree Brand palette so each tile has its own
 *    identity while remaining visually cohesive.
 *  • Added an optional `icon` prop (Ionicons name string) so callers can show
 *    a relevant icon in the top-left corner of every tile.
 *  • Added an optional `accent` prop to override the default background colour —
 *    the tile renders in that accent colour, and the icon + text use white so
 *    they remain legible regardless of the colour chosen.
 *  • Text hierarchy: title (16 bold) + optional subtitle (13, semi-transparent)
 *    now sit at the bottom-left of the tile, freeing space for an icon above.
 *  • Press state: tile dims to 80% opacity when pressed and scales down
 *    slightly (scaleX/Y 0.97) for tactile feedback without extra libraries.
 *  • Layout switches between two modes:
 *    - tall tiles (rows ≥ 2): icon top-left, text bottom-left (column layout)
 *    - short/square tiles:    icon left, text right (row layout, space-between)
 */

import React from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Brand } from "@/constants/theme";

// ── Tile colour palette ────────────────────────────────────────────────────
// Each tile type gets a distinct accent colour so the home grid feels
// colourful and engaging (inspired by the reference tile-dashboard designs).
// Callers can override via the `accent` prop if they want a custom colour.
export const TILE_ACCENTS = {
  green:  Brand.primary,    // default — trees, nature actions
  teal:   Brand.mid,        // map, location features
  forest: Brand.deep,       // statistics, data
  amber:  Brand.amber,      // alerts, reports
  dark:   Brand.charcoal,   // settings, profile
} as const;

export type TileAccentKey = keyof typeof TILE_ACCENTS;

type Props = {
  title: string;
  subtitle?: string;
  width: number;
  height: number;
  /** Ionicons icon name — shown in the top-left (tall tile) or left (short tile) */
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  /** Background colour — use TILE_ACCENTS[key] or any Brand hex */
  accent?: string;
  onPress: () => void;
};

export function HomeTile({
  title,
  subtitle,
  width,
  height,
  icon,
  accent = TILE_ACCENTS.green,  // defaults to brand-primary green
  onPress,
}: Props) {
  // A tall tile (height > ~140) uses a column layout so the icon sits at the
  // top and the text block anchors to the bottom — similar to app icon cards.
  // A short / 1-row tile uses a row layout for compactness.
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
          // Scale + opacity press feedback — no extra Animated library needed
          opacity: pressed ? 0.82 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
      ]}
    >
      {isTall ? (
        /* ── Tall tile: column layout ──────────────────────────────────── */
        <>
          {/* Icon anchored to top-left */}
          {icon && (
            <View style={styles.iconWrapTall}>
              {/* Frosted circle behind the icon for contrast */}
              <View style={styles.iconBg}>
                <Ionicons name={icon} size={26} color={Brand.white} />
              </View>
            </View>
          )}

          {/* Text block anchored to bottom-left */}
          <View style={styles.textBlockTall}>
            <Text style={styles.title} numberOfLines={2}>{title}</Text>
            {subtitle ? (
              <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
            ) : null}
          </View>
        </>
      ) : (
        /* ── Short tile: row layout ─────────────────────────────────────── */
        <View style={styles.rowLayout}>
          {icon && (
            <View style={styles.iconBg}>
              <Ionicons name={icon} size={22} color={Brand.white} />
            </View>
          )}
          <View style={styles.textBlockRow}>
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
            {subtitle ? (
              <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
            ) : null}
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
    // Drop-shadow gives tiles depth and lifts them off the background
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 4,
  },

  /* ── Tall tile (column) ── */
  // Icon area in the top-left corner
  iconWrapTall: {
    position: "absolute",
    top: 14,
    left: 14,
  },
  // Text anchored to the bottom of the tile
  textBlockTall: {
    position: "absolute",
    bottom: 14,
    left: 14,
    right: 14,
  },

  /* ── Short tile (row) ── */
  rowLayout: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  textBlockRow: {
    flex: 1,
  },

  /* ── Icon badge ── */
  // Semi-transparent white circle behind every icon
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },

  /* ── Text ── */
  title: {
    color: Brand.white,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  subtitle: {
    color: "rgba(255,255,255,0.72)",  // white at 72% opacity for visual hierarchy
    fontSize: 13,
    marginTop: 2,
  },
});
