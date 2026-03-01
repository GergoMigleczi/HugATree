import type { Bbox , MapRegion} from "./map.types";

export function regionToBbox(r: MapRegion): Bbox {
  const halfLat = r.latitudeDelta / 2;
  const halfLng = r.longitudeDelta / 2;

  // NOTE: this doesn't handle dateline wrap; MVP is fine.
  const minLat = Math.max(-90, r.latitude - halfLat);
  const maxLat = Math.min(90, r.latitude + halfLat);
  const minLng = Math.max(-180, r.longitude - halfLng);
  const maxLng = Math.min(180, r.longitude + halfLng);

  return { minLat, minLng, maxLat, maxLng };
}