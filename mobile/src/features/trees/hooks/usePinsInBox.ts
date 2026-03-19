import { useEffect, useMemo, useState } from "react";
import type { Bbox, MapRegion } from "@/src/features/map/map.types";
import { getTreesInBbox } from "@/src/features/trees/usecases/getTreesInBbox";
import type { TreePin } from "@/src/features/trees/trees.types";
import { useLoading } from "@/src/ui/loading/LoadingProvider";

type State =
  | { status: "idle"; pins: TreePin[]; error: null }
  | { status: "loading"; pins: TreePin[]; error: null }
  | { status: "success"; pins: TreePin[]; error: null }
  | { status: "error"; pins: TreePin[]; error: string };

export function usePinsInBbox(args: {
  viewport: { bbox: Bbox; region: MapRegion } | null;
  enabled: boolean;
  limit?: number;
}) {
  const { viewport, enabled, limit = 5000 } = args;

  const [state, setState] = useState<State>({ status: "idle", pins: [], error: null });

  const { withLoading } = useLoading();

  useEffect(() => {
    if (!enabled) return;
    if (!viewport) return;

    let cancelled = false;
    setState((s) => ({ status: "loading", pins: s.pins, error: null }));

    (async () => {
      try {
        const res = await withLoading(
                  () =>  getTreesInBbox({
                            ...viewport.bbox,
                            limit,
                          }),
                  { message: "Loading trees…", blocking: true, background: "transparent" }
                );
        if (cancelled) return;
        setState({ status: "success", pins: res.items, error: null });
      } catch (e: any) {
        if (cancelled) return;
        setState((s) => ({
          status: "error",
          pins: s.pins,
          error: e?.message ?? "Failed to load pins",
        }));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, viewport, limit]);

  return state;
}