import React, { useEffect, useMemo, useRef, useState } from "react";
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

function isFiniteNumber(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

function isValidLatLng(x: any): x is LatLng {
  return (
    x != null &&
    isFiniteNumber(x.latitude) &&
    isFiniteNumber(x.longitude) &&
    x.latitude >= -90 &&
    x.latitude <= 90 &&
    x.longitude >= -180 &&
    x.longitude <= 180
  );
}

export default function MapImpl({
  pins,
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

  // Only use userLocation if it's valid.
  const safeUserLocation = isValidLatLng(userLocation) ? userLocation : null;

  // Filter pins to only those with valid coordinates.
  const safePins = useMemo(() => {
    return (pins ?? []).filter((p) =>
      isValidLatLng({ latitude: (p as any).latitude, longitude: (p as any).longitude })
    );
  }, [pins]);

  // Only render draft marker if valid.
  const canRenderDraft = isValidLatLng(draftMarker);

  useEffect(() => {
    if (!safeUserLocation || hasInitiallyCentered.current) return;

    mapRef.current?.animateToRegion(
      {
        latitude: safeUserLocation.latitude,
        longitude: safeUserLocation.longitude,
        latitudeDelta: FALLBACK_REGION.latitudeDelta,
        longitudeDelta: FALLBACK_REGION.longitudeDelta,
      },
      450
    );

    hasInitiallyCentered.current = true;
  }, [safeUserLocation]);

  useEffect(() => {
    if (prevRecenterToken.current === recenterToken) return;
    prevRecenterToken.current = recenterToken;

    setFollowUser(true);
    if (!safeUserLocation) return;

    mapRef.current?.animateToRegion(
      {
        latitude: safeUserLocation.latitude,
        longitude: safeUserLocation.longitude,
        ...USER_FOCUS_DELTA,
      },
      450
    );
  }, [recenterToken, safeUserLocation]);

  useEffect(() => {
    if (!followUser || !safeUserLocation) return;

    mapRef.current?.animateToRegion(
      {
        latitude: safeUserLocation.latitude,
        longitude: safeUserLocation.longitude,
        ...USER_FOCUS_DELTA,
      },
      450
    );
  }, [followUser, safeUserLocation]);

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
        onPanDrag={() => followUser && setFollowUser(false)}
        onPress={(e) => {
          if (!pickLocationEnabled) return;

          const coord = e?.nativeEvent?.coordinate;
          if (!isValidLatLng(coord)) {
            // Avoid passing invalid coords up (prevents native crashes downstream)
            // console.log("Invalid map press coordinate:", coord);
            return;
          }

          onMapPress?.({ latitude: coord.latitude, longitude: coord.longitude });
        }}
      >
        {/* Draft marker (user-picked location) */}
        {canRenderDraft ? (
          <Marker
            key="draft"
            identifier="draft-location"
            coordinate={{ latitude: draftMarker!.latitude, longitude: draftMarker!.longitude }}
          />
        ) : null}

        {safePins.map((p) => (
          <Marker
            key={String(p.id)}
            identifier={`pin-${p.id}`}
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