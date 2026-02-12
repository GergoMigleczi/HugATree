import type { Region } from "react-native-maps";

export const FALLBACK_REGION: Region = {
  latitude: 51.88242,
  longitude: -2.04006,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

// controls how close “go to my location” zooms
export const USER_FOCUS_DELTA = {
  latitudeDelta: 0.004,
  longitudeDelta: 0.004,
};