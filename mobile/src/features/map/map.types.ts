export type Pin = {
  id: string;
  latitude: number;
  longitude: number;
};

export type LatLng = { latitude: number; longitude: number };

export type Bbox = {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
};

export type MapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};