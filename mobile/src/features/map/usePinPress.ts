import { useRouter } from "expo-router";
import type { Pin, MapMode } from "./map.types";



export function usePinPress(mode: MapMode = "public") {
  const router = useRouter();

  return (pin: Pin) => {
    router.push({
      pathname: "/modal", // or `/tree/${pin.id}`
      params: {
        treeId: pin.id,
        mode: mode, // 👈 pass it through
      },
    });
  };
}