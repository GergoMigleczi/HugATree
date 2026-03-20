import React, { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import type { Pin } from "../map.types";
import MapImpl from "../platform/MapImpl";
import { useLiveLocation } from "../../location/hooks/useLiveLocation";

import type { Bbox, MapRegion } from "../map.types";
import { usePinsInBbox } from "@/src/features/trees/hooks/usePinsInBox";

// same LatLng shape you use elsewhere
type LatLng = { latitude: number; longitude: number };

type Props = {
  width: number;
  height: number;
  onPress: () => void;
};

function distanceApproxMeters(a: LatLng, b: LatLng) {
  const dLat = (a.latitude - b.latitude) * 111_000;
  const dLng = (a.longitude - b.longitude) * 111_000 * Math.cos((a.latitude * Math.PI) / 180);
  return Math.sqrt(dLat * dLat + dLng * dLng);
}

export function MapPreviewTile({ width, height, onPress }: Props) {
  const loc = useLiveLocation();
  const userLocation = loc.status === "success" ? loc.location : null;

  const [viewport, setViewport] = useState<{ region: MapRegion; bbox: Bbox } | null>(null);
  const [searchViewport, setSearchViewport] = useState<{ region: MapRegion; bbox: Bbox } | null>(null);
  const didAutoSearch = useRef(false);

  // Capture viewport continuously
  const onViewportChange = (v: { region: MapRegion; bbox: Bbox }) => {
    setViewport(v);
  };

  // Auto-search once:
  // - if no userLocation -> use first viewport (fallback)
  // - if userLocation -> wait until map center ~ user
  useEffect(() => {
    if (didAutoSearch.current) return;
    if (!viewport) return;

    didAutoSearch.current = true;
    setSearchViewport(viewport);
  }, [viewport]);

  // Fetch pins only when searchViewport is set (i.e. auto-search fired)
  const pinsState = usePinsInBbox({
    viewport: searchViewport,
    enabled: true,
    limit: 5000,
  });

  // MapImpl expects Pin[] (your map Pin type) — if TreePin differs, map here.
  // If your TreePin already matches Pin, you can just do: const pins = pinsState.pins as Pin[]
  const pins: Pin[] = (pinsState.pins as any) ?? [];

  return (
    <Pressable onPress={onPress} style={[styles.wrap, { width, height }]}>
      <View style={styles.mapClip}>
        <MapImpl
          pins={pins}
          userLocation={userLocation}
          onPinPress={() => {}}
          mode="preview"
          onViewportChange={onViewportChange}
        />

        <View style={styles.overlay} />
      </View>

      <View style={styles.content}>{/* tile content */}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: 12, overflow: "hidden" },
  mapClip: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  content: {
    position: "absolute",
    left: 12,
    bottom: 12,
  },
});