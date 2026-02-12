import { useRouter } from "expo-router";
import type { Pin } from "./map.types";

export function usePinPress() {
  const router = useRouter();

  return (pin: Pin) => {
    // shared behaviour (same on both platforms)
    router.push({
      pathname: "/modal", // or `/tree/${pin.id}` etc.
      params: { treeId: pin.id }, // keep params small
    });
  };
}