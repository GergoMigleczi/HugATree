import { useEffect, useState } from "react";
import * as Location from "expo-location";

export type LatLng = { latitude: number; longitude: number };

type State =
  | { status: "idle" | "loading"; location: null; error: null }
  | { status: "success"; location: LatLng; error: null }
  | { status: "error"; location: null; error: string };

export function useLiveLocation() {
  const [state, setState] = useState<State>({ status: "idle", location: null, error: null });

  useEffect(() => {
    let cancelled = false;
    let sub: Location.LocationSubscription | null = null;

    (async () => {
      try {
        setState({ status: "loading", location: null, error: null });

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") throw new Error("Location permission not granted");

        // Set an initial value quickly if available (helps “on open”)
        const lastKnown = await Location.getLastKnownPositionAsync();
        if (!cancelled && lastKnown?.coords) {
          setState({
            status: "success",
            location: { latitude: lastKnown.coords.latitude, longitude: lastKnown.coords.longitude },
            error: null,
          });
        }

        sub = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: 5, // metres
            timeInterval: 2000,  // ms (mainly Android)
          },
          (pos) => {
            if (cancelled) return;
            setState({
              status: "success",
              location: { latitude: pos.coords.latitude, longitude: pos.coords.longitude },
              error: null,
            });
          }
        );
      } catch (e: any) {
        if (cancelled) return;
        setState({ status: "error", location: null, error: e?.message ?? "Failed to watch location" });
      }
    })();

    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, []);

  return state;
}