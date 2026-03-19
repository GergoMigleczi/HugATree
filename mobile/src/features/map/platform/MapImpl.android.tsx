import React, { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { GOOGLE_MAP_STYLE } from "../googleMapStyle";
import type { Bbox, MapRegion } from "../map.types";
import type { TreePin } from "../../trees/trees.types";
import type { LatLng } from "../../location/hooks/useLiveLocation";
import { regionToBbox } from "../map.functions";
import { FALLBACK_REGION, USER_FOCUS_DELTA } from "../mapDefaults";


function regionToBounds(r: Region): [number, number, number, number] {
  const west = r.longitude - r.longitudeDelta / 2;
  const east = r.longitude + r.longitudeDelta / 2;
  const south = r.latitude - r.latitudeDelta / 2;
  const north = r.latitude + r.latitudeDelta / 2;
  return [west, south, east, north];
}

function regionToZoom(r: Region): number {
  const d = r.longitudeDelta;
  if (!Number.isFinite(d) || d <= 0) return 18;
  const zoom = Math.round(Math.log2(360 / d));
  return Math.max(1, Math.min(20, zoom));
}

const EPS = 1e-6;
const nearlyEqual = (a: number, b: number) => Math.abs(a - b) < EPS;
const sameRegion = (a: Region, b: Region) =>
  nearlyEqual(a.latitude, b.latitude) &&
  nearlyEqual(a.longitude, b.longitude) &&
  nearlyEqual(a.latitudeDelta, b.latitudeDelta) &&
  nearlyEqual(a.longitudeDelta, b.longitudeDelta);

type Props = {
  pins: TreePin[];
  initialRegion: Region;
  userLocation?: LatLng | null;
  onPinPress: (pin: TreePin) => void;
  renderKey?: string | number;
  recenterToken?: number;
  mode?: "full" | "preview";
  pickLocationEnabled?: boolean;
  onMapPress?: (coord: LatLng) => void;
  draftMarker?: LatLng | null;
  onViewportChange?: (args: { region: MapRegion; bbox: Bbox }) => void;
};

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
}: Props) {
  const mapRef = useRef<MapView | null>(null);
  const [region, setRegion] = useState<Region>(FALLBACK_REGION);

  // follow behaviour lives here
  const [followUser, setFollowUser] = useState(true);
  const hasInitiallyCentered = useRef(false);
  const prevRecenterToken = useRef(recenterToken);

  const Supercluster = require("supercluster").default;
  const ClusterMarker = require("../components/ClusterMarker").default;

  const clusterIndex = useMemo(() => {
    const sc = new Supercluster({ radius: 60, maxZoom: 20, minZoom: 1 });

    const points = pins.map((p) => ({
      type: "Feature",
      properties: { id: p.id },
      geometry: { type: "Point", coordinates: [p.longitude, p.latitude] },
    }));

    sc.load(points);
    return sc;
  }, [pins]);

  const clusters = useMemo(() => {
    const bounds = regionToBounds(region);
    const zoom = regionToZoom(region);
    return clusterIndex.getClusters(bounds, zoom);
  }, [clusterIndex, region]);

  const pinById = useMemo(() => {
    const m = new Map<string, TreePin>();
    for (const p of pins) m.set(String(p.id), p);
    return m;
  }, [pins]);

  const emitViewport = (r: MapRegion) => {
      onViewportChange?.({ region: r, bbox: regionToBbox(r) });
    };

  // 1) On first location fix, centre once (helps on open)
  useEffect(() => {
    if (!userLocation || hasInitiallyCentered.current) return;

    mapRef.current?.animateToRegion(
      {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        ...USER_FOCUS_DELTA,
      },
      450
    );

    emitViewport({
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      ...USER_FOCUS_DELTA,
    });

    hasInitiallyCentered.current = true;

  }, [userLocation]);

  // 2) If recenterToken changes, turn follow back on and recenter
  useEffect(() => {
    if (prevRecenterToken.current === recenterToken) return;
    prevRecenterToken.current = recenterToken;

    setFollowUser(true);

    if (!userLocation) return;
    mapRef.current?.animateToRegion(
      {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: USER_FOCUS_DELTA.latitudeDelta,
        longitudeDelta: USER_FOCUS_DELTA.longitudeDelta,
      },
      450
    );
  }, [recenterToken, userLocation]);

  // 3) While following, keep camera on the user as they move
  useEffect(() => {
    if (!followUser || !userLocation) return;

    mapRef.current?.animateToRegion(
      {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: USER_FOCUS_DELTA.latitudeDelta,
        longitudeDelta: USER_FOCUS_DELTA.longitudeDelta,
      },
      450
    );
  }, [followUser, userLocation]);

  return (
    <MapView
      ref={mapRef}
      key={renderKey}
      style={StyleSheet.absoluteFill}
      customMapStyle={GOOGLE_MAP_STYLE}
      initialRegion={FALLBACK_REGION}
      mapPadding={{ top: 24, right: 24, bottom: 24, left: 24 }}
      // drag disables follow
      showsUserLocation={true}
      showsMyLocationButton={false}
      onPanDrag={() => {
        if (followUser) setFollowUser(false);
      }}
      showsPointsOfInterest={false}
      showsBuildings={false}
      onPress={(e) => {
        if (!pickLocationEnabled) return;
        const coord = e.nativeEvent.coordinate as LatLng;
        onMapPress?.(coord);
      }}
      onRegionChangeComplete={(r) => {
        setRegion((prev) => (sameRegion(prev, r) ? prev : r));

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
      {draftMarker ? (
        <Marker
          key="draft"
          coordinate={draftMarker}
          // optional: different pin appearance if you have a custom marker
        />
      ) : null}
      
      {clusters.map((c: any) => {
        const [longitude, latitude] = c.geometry.coordinates as [number, number];
        const isCluster = Boolean(c.properties.cluster);

        if (isCluster) {
          const clusterId = c.properties.cluster_id as number;
          const count = c.properties.point_count as number;

          return (
            <ClusterMarker
              key={`cluster-${clusterId}`}
              coordinate={{ latitude, longitude }}
              count={count}
              onPress={() => {
                const expansionZoom = Math.min(clusterIndex.getClusterExpansionZoom(clusterId), 20);
                const nextLongitudeDelta = 360 / Math.pow(2, expansionZoom);
                const aspect = region.longitudeDelta > 0 ? region.latitudeDelta / region.longitudeDelta : 1;

                mapRef.current?.animateToRegion(
                  {
                    latitude,
                    longitude,
                    longitudeDelta: nextLongitudeDelta,
                    latitudeDelta: nextLongitudeDelta * aspect,
                  },
                  250
                );
              }}
            />
          );
        }

        const id = String(c.properties.id);
        const pin = pinById.get(id);
        if (!pin) return null;

        return (
          <Marker
            key={String(pin.id)}
            identifier={`pin-${pin.id}`}
            coordinate={{ latitude: pin.latitude, longitude: pin.longitude }}
            onPress={() => onPinPress(pin)}
          ></Marker>
        );
      })}
    </MapView>
  );
}