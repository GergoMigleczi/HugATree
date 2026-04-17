import React, { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View , Text} from "react-native";
import ClusteredMapViewIOS from "react-native-map-clustering";
import { Callout, Marker } from "react-native-maps";
import type { Bbox, MapRegion, MapLayer } from "../map.types";
import type { TreePin } from "../../trees/trees.types";   
import type { LatLng } from "../../location/hooks/useLiveLocation";
import { regionToBbox } from "../map.functions";
import { FALLBACK_REGION, USER_FOCUS_DELTA } from "../mapDefaults";

type Props = {
  pins: TreePin[];
  userLocation?: LatLng | null;
  onPinPress: (pin: TreePin) => void;
  recenterToken?: number;
  renderKey?: string | number;
  mode?: "full" | "preview";
  pickLocationEnabled?: boolean;
  onMapPress?: (coord: LatLng) => void;
  draftMarker?: LatLng | null;
  onViewportChange?: (args: { region: MapRegion; bbox: Bbox }) => void;
  mapLayer: MapLayer;
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
  onViewportChange,
  mapLayer,
}: Props) {
  const mapRef = useRef<any>(null);

  const [mapReady, setMapReady] = useState(false);
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

  const emitViewport = (r: MapRegion) => {
    onViewportChange?.({ region: r, bbox: regionToBbox(r) });
  };

  useEffect(() => {
    if (!safeUserLocation || hasInitiallyCentered.current) return;

    mapRef.current?.animateToRegion(
      {
        latitude: safeUserLocation.latitude,
        longitude: safeUserLocation.longitude,
        ...USER_FOCUS_DELTA,
      },
      450
    );
    
    emitViewport({
      latitude: safeUserLocation.latitude,
      longitude: safeUserLocation.longitude,
      ...USER_FOCUS_DELTA,
    });

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
        mapType={mapLayer}
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
        onMapReady={() => setMapReady(true)}
        onRegionChangeComplete={(r: any) => {
          const region: MapRegion = {
            latitude: r.latitude,
            longitude: r.longitude,
            latitudeDelta: r.latitudeDelta,
            longitudeDelta: r.longitudeDelta,
          };
          const bbox = regionToBbox(region);
          onViewportChange?.({ region, bbox });
        }}
      >
        {/* Draft marker (user-picked location) */}
        {mapReady && canRenderDraft ? (
          <Marker
            key="draft"
            identifier="draft-location"
            coordinate={{ latitude: draftMarker!.latitude, longitude: draftMarker!.longitude }}
          />
        ) : null}

        {mapReady && safePins.map((p) => (
          <Marker
            key={String(p.id)}
            identifier={`pin-${p.id}`}
            coordinate={{ latitude: p.latitude, longitude: p.longitude }}
          >
            <Callout tooltip={false}
              onPress={() => onPinPress(p)}>
              <View style={{ padding: 4 }}>
                <Text style={{ fontWeight: "600" }}>
                  {p.speciesCommonName ?? "Unknown species"}
                </Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </ClusteredMapViewIOS>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});