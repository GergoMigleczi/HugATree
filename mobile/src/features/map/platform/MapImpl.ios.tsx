import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import ClusteredMapViewIOS from "react-native-map-clustering";
import { Marker } from "react-native-maps";
import type { Pin } from "../map.types";
import type { LatLng } from "../../location/hooks/useLiveLocation";
import { FALLBACK_REGION, USER_FOCUS_DELTA } from "../mapDefaults";

type Props = {
  pins: Pin[];
  userLocation?: LatLng | null;
  onPinPress: (pin: Pin) => void;
  recenterToken?: number;
  renderKey?: string | number;
  mode?: "full" | "preview";
  pickLocationEnabled?: boolean;
  onMapPress?: (coord: LatLng) => void;
  draftMarker?: LatLng | null;
};

export default function MapImpl({ pins,
  userLocation,
  onPinPress,
  recenterToken = 0,
  renderKey = 0,
  mode = "full",
  pickLocationEnabled = false,
  onMapPress,
  draftMarker,
}: Props) {
  const mapRef = useRef<any>(null);

  const [followUser, setFollowUser] = useState(true);
  const hasInitiallyCentered = useRef(false);
  const prevRecenterToken = useRef(recenterToken);

  useEffect(() => {
    if (!userLocation || hasInitiallyCentered.current) return;

    mapRef.current?.animateToRegion(
      {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: FALLBACK_REGION.latitudeDelta,
        longitudeDelta: FALLBACK_REGION.longitudeDelta,
      },
      450
    );

    hasInitiallyCentered.current = true;
  }, [userLocation]);

  useEffect(() => {
    if (prevRecenterToken.current === recenterToken) return;
    prevRecenterToken.current = recenterToken;

    setFollowUser(true);
    if (!userLocation) return;

    mapRef.current?.animateToRegion(
      { latitude: userLocation.latitude, longitude: userLocation.longitude, ...USER_FOCUS_DELTA },
      450
    );
  }, [recenterToken, userLocation]);

  useEffect(() => {
    if (!followUser || !userLocation) return;

    mapRef.current?.animateToRegion(
      { latitude: userLocation.latitude, longitude: userLocation.longitude, ...USER_FOCUS_DELTA },
      450
    );
  }, [followUser, userLocation]);

  return (
    <View style={styles.container}>
      <ClusteredMapViewIOS
        ref={mapRef}
        key={renderKey}
        style={StyleSheet.absoluteFill}
        initialRegion={FALLBACK_REGION}
        radius={45}
        minPoints={2}
        maxZoom={20}
        showsPointsOfInterest={false}
        showsBuildings={false}
        showsUserLocation={true}
        // drag disables follow
        onPanDrag={() => followUser && setFollowUser(false)}
        onPress={(e) => {
                if (!pickLocationEnabled) return;
                const coord = e.nativeEvent.coordinate as LatLng;
                onMapPress?.(coord);
              }}
      >
        {/* Draft marker (user-picked location) */}
        {draftMarker ? (
          <Marker
            key="draft"
            coordinate={draftMarker}
            // optional: different pin appearance if you have a custom marker
          />
        ) : null}
        {pins.map((p) => (
          <Marker
            key={p.id}
            coordinate={{ latitude: p.latitude, longitude: p.longitude }}
            onPress={() => onPinPress(p)}
          />
        ))}
      </ClusteredMapViewIOS>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});