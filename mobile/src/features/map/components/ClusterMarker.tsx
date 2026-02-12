import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Marker } from "react-native-maps";

export default function ClusterMarker({
  coordinate,
  count,
  onPress,
}: {
  coordinate: { latitude: number; longitude: number };
  count: number;
  onPress?: () => void;
}) {
  const [tracks, setTracks] = useState(true);

  // Turn tracking on briefly (so the view is captured), then off (prevents blinking)
  useEffect(() => {
    setTracks(true);
    const t = setTimeout(() => setTracks(false), 250);
    return () => clearTimeout(t);
  }, [count]);

  return (
    <Marker
      coordinate={coordinate}
      onPress={onPress}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={tracks}
    >
      <View style={styles.clusterBubble}>
        <Text style={styles.clusterText}>{String(count)}</Text>
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  clusterBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "green",
    alignItems: "center",
    justifyContent: "center",
  },
  clusterText: { color: "white", fontWeight: "700", fontSize: 14 },
});