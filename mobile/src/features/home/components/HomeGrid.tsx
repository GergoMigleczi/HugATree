import React, { useMemo } from "react";
import { Dimensions, StyleSheet, View } from "react-native";

import type { Pin } from "../../map/map.types";
import { HomeTile as HomeTileCard } from "./HomeTile";
import { MapPreviewTile } from "../../map/components/MapPreviewTile";
import { layoutTiles } from "../home.layout";

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
      onPress: () => void;
    });

const SCREEN_WIDTH = Dimensions.get("window").width;

const MARGIN = 12;
const GAP = 12;
const ROW_HEIGHT = 120;
const GRID_COLS = 2;

const COL_WIDTH = (SCREEN_WIDTH - MARGIN * 2 - GAP * (GRID_COLS - 1)) / GRID_COLS;

type Props = {
  items: GridItem[];
};

export function HomeGrid({ items }: Props) {
  // layoutTiles only needs id/rows/cols (and keeps extra fields)
  const { placed, rowCount } = useMemo(() => layoutTiles(items as any), [items]);

  const containerHeight =
    MARGIN * 2 + rowCount * ROW_HEIGHT + Math.max(0, rowCount - 1) * GAP;

  return (
    <View style={[styles.container, { height: containerHeight }]}>
      {(placed as any[]).map((it) => {
        const width = it.cols === 2 ? COL_WIDTH * 2 + GAP : COL_WIDTH;
        const height = it.rows * ROW_HEIGHT + (it.rows - 1) * GAP;

        const left = MARGIN + it.gridCol * (COL_WIDTH + GAP);
        const top = MARGIN + it.gridRow * (ROW_HEIGHT + GAP);

        return (
          <View key={it.id} style={{ position: "absolute", left, top }}>
            {it.type === "map" ? (
              <MapPreviewTile
                width={width}
                height={height}
                pins={it.pins}
                onPress={it.onPress}
                // If your MapPreviewTile supports these, pass them through:
                // title={it.title}
                // subtitle={it.subtitle}
              />
            ) : (
              <HomeTileCard
                width={width}
                height={height}
                title={it.title}
                subtitle={it.subtitle}
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