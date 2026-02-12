import React, { useEffect, useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Region } from "react-native-maps";
import type { Pin } from "../map.types";
import MapImpl from "../platform/MapImpl";
import { useLiveLocation } from "../../location/hooks/useLiveLocation";


type Props = {
  width: number;
  height: number;
  pins: Pin[];
  onPress: () => void;
};

export function MapPreviewTile({ width, height, pins, onPress }: Props) {
  const loc = useLiveLocation();
  const userLocation = loc.status === "success" ? loc.location : null;

  const renderKey = useMemo(() => {
    if (!pins?.length) return "preview-0";
    const first = pins[0]?.id ?? "x";
    const last = pins[pins.length - 1]?.id ?? "y";
    return `preview-${pins.length}-${first}-${last}`;
  }, [pins]);

  return (
    <Pressable onPress={onPress} style={[styles.wrap, { width, height }]}>
      <View style={styles.mapClip}>
        <MapImpl
          pins={pins}
          userLocation={userLocation}
          onPinPress={() => {}}
          renderKey={renderKey} 
        />

        {/* optional overlay tint so text/icons are readable */}
        <View style={styles.overlay} />
      </View>

      {/* put your usual tile content here (title, subtitle, etc.) */}
      <View style={styles.content}>
        {/* e.g. <Text>Map</Text> */}
      </View>
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