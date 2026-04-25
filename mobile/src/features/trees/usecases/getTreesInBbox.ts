// src/features/trees/usecases/getTreesInBbox.ts
import { getTreesInBboxApi } from "../trees.api";
import type { GetTreesInBboxParams, TreePin } from "../trees.types";

/**
 * Use-case: fetch tree pins in a bbox.
 * Keep it UI-agnostic; any throttling/caching should live in hooks.
 */
export async function getTreesInBbox(params: GetTreesInBboxParams): Promise<{ items: TreePin[]; count: number}> {
  return getTreesInBboxApi(params);
}