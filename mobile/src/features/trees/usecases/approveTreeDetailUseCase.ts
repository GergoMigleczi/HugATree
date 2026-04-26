// src/features/trees/usecases/approveTreeDetailUseCase.ts
import { approveTreeDetail } from "../trees.api";

/**
 * Use-case: approve a specific detail for a tree.
 * Keep it UI-agnostic; any throttling/caching should live in hooks.
 */
export async function approveTreeDetailUseCase(treeId: number, treeDetailId: number): Promise<void> {
  return approveTreeDetail(treeId, treeDetailId);
}