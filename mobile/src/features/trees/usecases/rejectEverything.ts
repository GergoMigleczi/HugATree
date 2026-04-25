// src/features/trees/usecases/rejectEverything.ts
import { rejectEverything } from "../trees.api";

/**
 * Use-case: reject everything for a tree.
 * Keep it UI-agnostic; any throttling/caching should live in hooks.
 */
export async function rejectEverythingUseCase(treeId: number): Promise<void> {
  return rejectEverything(treeId);
}