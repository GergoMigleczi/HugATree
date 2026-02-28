// src/features/trees/usecases/createTree.ts
import { createTreeApi } from "../trees.api";
import type { CreateTreeInput, CreateTreeResponseApi } from "../trees.types";

/**
 * Domain-ish usecase: keep React out.
 * Minimal validation; let backend be source of truth.
 */
export async function createTree(input: CreateTreeInput): Promise<CreateTreeResponseApi> {
  if (!input) throw new Error("Missing tree data");
  return createTreeApi(input);
}
