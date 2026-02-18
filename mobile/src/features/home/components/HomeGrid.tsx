/**
 * HomeGrid — Absolute-positioned 2-column tile grid for the home screen.
 *
 * What changed / what was added:
 *  • Extended the `GridItem` "tile" variant to accept optional `icon` and
 *    `accent` props that are forwarded directly to HomeTile, enabling per-tile
 *    colours and Ionicons icons without changing the layout engine.
 *  • The grid layout algorithm (layoutTiles) is unchanged — tiles are still
 *    placed in a 2-column absolute grid with 12 px margins and gaps.
 *  • MapPreviewTile items are rendered the same as before.
 *  • No other behaviour was modified.
 */

import React, { useMemo } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import type { Pin } from "../../map/map.types";
import { HomeTile as HomeTileCard } from "./HomeTile";
import { MapPreviewTile } from "../../map/components/MapPreviewTile";
import { layoutTiles } from "../home.layout";

// ── Grid item types ────────────────────────────────────────────────────────

type GridItemBase = {
  id: string;
  rows: 1 | 2;
  cols: 1 | 2;
};

export type GridItem =
  | (GridItemBase & {
      type: "map";
      pins: Pin[];
      title?: string;
      subtitle?: string;
      onPress: () => void;
    })
  | (GridItemBase & {
      type: "tile";
      title: string;
      subtitle?: string;
      /**
       * Optional Ionicons icon name displayed inside the tile.
       * Falls back to no icon if omitted.
       */
      icon?: React.ComponentProps<typeof Ionicons>["name"];
      /**
       * Optional background accent colour for the tile.
       * Use Brand hex values or the TILE_ACCENTS map from HomeTile.
       * Falls back to Brand.primary (green) if omitted.
       */
      accent?: string;
      onPress: () => void;
    });

// ── Grid constants ─────────────────────────────────────────────────────────
// These match the values used in the layout engine (home.layout.ts) so that
// pixel sizes computed here align exactly with the placement algorithm.

const SCREEN_WIDTH = Dimensions.get("window").width;

const MARGIN     = 12;  // outer left/right padding
const GAP        = 12;  // gap between columns and between rows
const ROW_HEIGHT = 120; // height of a single grid row in dp
const GRID_COLS  = 2;   // always a 2-column layout

// Width of a single column (screen - margins - gaps) / columns
const COL_WIDTH = (SCREEN_WIDTH - MARGIN * 2 - GAP * (GRID_COLS - 1)) / GRID_COLS;

type Props = {
  items: GridItem[];
};

export function HomeGrid({ items }: Props) {
  // layoutTiles only needs id/rows/cols from each item; the rest is passed through.
  // Cast to `any` is safe here because PlacedTile spreads the original item.
  const { placed, rowCount } = useMemo(() => layoutTiles(items as any), [items]);

  // Total height = margins + rows + gaps between rows
  const containerHeight =
    MARGIN * 2 + rowCount * ROW_HEIGHT + Math.max(0, rowCount - 1) * GAP;

  return (
    <View style={[styles.container, { height: containerHeight }]}>
      {(placed as any[]).map((it) => {
        // Compute pixel dimensions from the grid spec
        const width  = it.cols === 2 ? COL_WIDTH * 2 + GAP : COL_WIDTH;
        const height = it.rows * ROW_HEIGHT + (it.rows - 1) * GAP;

        // Compute absolute position within the grid container
        const left = MARGIN + it.gridCol * (COL_WIDTH + GAP);
        const top  = MARGIN + it.gridRow * (ROW_HEIGHT + GAP);

        return (
          <View key={it.id} style={{ position: "absolute", left, top }}>
            {it.type === "map" ? (
              // Map tile — renders an interactive mini-map with pins
              <MapPreviewTile
                width={width}
                height={height}
                pins={it.pins}
                onPress={it.onPress}
              />
            ) : (
              // Regular tile — forwards icon and accent to HomeTile
              <HomeTileCard
                width={width}
                height={height}
                title={it.title}
                subtitle={it.subtitle}
                icon={it.icon}       // new: Ionicons name for the tile icon
                accent={it.accent}   // new: custom background accent colour
                onPress={it.onPress}
              />
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
});
