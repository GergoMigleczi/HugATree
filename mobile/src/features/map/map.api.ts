import type { Pin } from "./map.types";

// Replace with your real API call
export async function getPins(): Promise<Pin[]> {
  // Example stub:
  // const res = await fetch("https://your-api/pins");
  // if (!res.ok) throw new Error("Failed to fetch pins");
  // return (await res.json()) as Pin[];

  const center = { latitude: 52.124239, longitude: -2.078557};
  return generatePins(50, center);
}

function generatePins(count: number, center: { latitude: number; longitude: number }) {
  const pins: Pin[] = [];
  const step = 0.002;
  const gridSize = Math.ceil(Math.sqrt(count));
  let i = 0;

  for (let r = 0; r < gridSize && i < count; r++) {
    for (let c = 0; c < gridSize && i < count; c++) {
      pins.push({
        id: String(i + 1),
        latitude: center.latitude + (r - gridSize / 2) * step,
        longitude: center.longitude + (c - gridSize / 2) * step,
      });
      i++;
    }
  }
  return pins;
}