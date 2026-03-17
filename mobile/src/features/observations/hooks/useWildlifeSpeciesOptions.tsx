import { useEffect, useRef, useState } from "react";
import type { SpeciesOption } from "@/src/features/trees/trees.types";
import { getWildlifeSpeciesApi } from "../observations.wildlife.api";
import { useLoading } from "@/src/ui/loading/LoadingProvider";

type State =
  | { status: "idle" | "loading"; data: null; error: null }
  | { status: "success"; data: SpeciesOption[]; error: null }
  | { status: "error"; data: null; error: string };

/**
 * Mirrors useSpeciesOptions — fetches wildlife species when enabled.
 * Results are cached in-memory for the app session.
 */
export function useWildlifeSpeciesOptions(enabled: boolean) {
  const [state, setState] = useState<State>({
    status: "idle",
    data: null,
    error: null,
  });

  const { withLoading } = useLoading();
  const cacheRef = useRef<SpeciesOption[] | null>(null);

  useEffect(() => {
    if (!enabled) return;

    if (cacheRef.current) {
      setState({ status: "success", data: cacheRef.current, error: null });
      return;
    }

    let cancelled = false;
    setState({ status: "loading", data: null, error: null });

    (async () => {
      try {
        const items = await withLoading(
          () => getWildlifeSpeciesApi(),
          { message: "Loading wildlife species…", blocking: true, background: "transparent" }
        );
        if (cancelled) return;
        cacheRef.current = items;
        setState({ status: "success", data: items, error: null });
      } catch (e: any) {
        if (cancelled) return;
        setState({
          status: "error",
          data: null,
          error: e?.message ?? "Failed to load wildlife species",
        });
      }
    })();

    return () => { cancelled = true; };
  }, [enabled, withLoading]);

  return state;
}
