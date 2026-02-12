import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import type { Region } from "react-native-maps";

import MapImpl from "../../src/features/map/platform/MapImpl";
import { getPins } from "../../src/features/map/map.api";
import type { Pin } from "../../src/features/map/map.types";
import { usePinPress } from "../../src/features/map/usePinPress";
import { useLiveLocation } from "../../src/features/location/hooks/useLiveLocation";
import BackToCurrentLocationButton from "../../src/features/map/components/BackToCurrentLocationButton";


export default function MapRoute() {
  const [pins, setPins] = useState<Pin[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [recenterToken, setRecenterToken] = useState(0);

  const onPinPress = usePinPress();

  // live location state
  const loc = useLiveLocation();
  const userLocation = loc.status === "success" ? loc.location : null;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await getPins();
        if (!cancelled) setPins(data);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Failed to load pins");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <View style={styles.center}>
        {/* replace with your own error UI */}
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <MapImpl
        pins={pins ?? []}
        userLocation={userLocation}
        onPinPress={onPinPress}
        recenterToken={recenterToken}
      />

      {!pins ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator />
        </View>
      ) : null}

      {userLocation ? (
      <BackToCurrentLocationButton
        onPress={() => setRecenterToken((n) => n + 1)}
      />
    ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none",
  },
});