// src/features/trees/usecases/approveEverything.ts
import { approveEverything } from "../trees.api";

/**
 * Use-case: approve everything for a tree.
 * Keep it UI-agnostic; any throttling/caching should live in hooks.
 */
export async function approveEverythingUseCase(treeId: number): Promise<void> {
  return approveEverything(treeId);
}