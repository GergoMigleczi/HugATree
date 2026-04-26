// src/features/trees/usecases/rejectTreeDetailUseCase.ts
import { rejectTreeDetail } from "../trees.api";

/**
 * Use-case: reject a specific detail for a tree.
 * Keep it UI-agnostic; any throttling/caching should live in hooks.
 */
export async function rejectTreeDetailUseCase(treeId: number, treeDetailId: number): Promise<void> {
  return rejectTreeDetail(treeId, treeDetailId);
}