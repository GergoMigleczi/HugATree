export const GOOGLE_MAP_STYLE = [
  // Hide ALL POIs (businesses, landmarks, etc.)
  { featureType: "poi", stylers: [{ visibility: "off" }] },

  // Hide transit layers
  { featureType: "transit", stylers: [{ visibility: "off" }] },

  // Hide POI label icons specifically (extra safety)
  { featureType: "poi", elementType: "labels.icon", stylers: [{ visibility: "off" }] },

  // Hide “3D building”/poi geometry (this is the closest equivalent)
  { featureType: "poi", elementType: "geometry", stylers: [{ visibility: "off" }] },

  // Optional: hide road icons (often look like POIs)
  { featureType: "road", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
] as const;