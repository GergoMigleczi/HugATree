import { authFetch } from "@/src/api/authFetch";
import type { SpeciesOption, CreateTreeInput, CreateTreeResponseApi, TreePin, GetTreesInBboxParams, TreesInBboxResponseApi, SpeciesListResponseApi, TreeDetail } from "./trees.types";

export async function getSpeciesOptions(): Promise<SpeciesOption[]> {
  const res = await authFetch<SpeciesListResponseApi>("/trees/species", { method: "GET" });
  return res.items.map((s) => ({
    id: s.id,
    commonName: s.common_name,
    scientificName: s.scientific_name ?? undefined,
    gbifTaxonKey: s.gbif_taxon_key ?? undefined,
  }));
}

export async function createTreeApi(input: CreateTreeInput): Promise<CreateTreeResponseApi> {
  return authFetch<CreateTreeResponseApi>("/trees", {
    method: "POST",
    body: {
      tree: input.tree,
      observation: {
        ...input.observation,
        ...(input.details ? { details: input.details } : {}),
      },
    },
  });
}


export async function getTreesInBboxApi(params: GetTreesInBboxParams): Promise<{ items: TreePin[]; count: number, total: number, limit: number, hasMore: boolean }> {

  const limit = params.limit ?? 5000;
  if (!Number.isInteger(limit) || limit <= 0) throw new Error("limit must be a positive integer");

  const qs = new URLSearchParams({
    minLat: String(params.minLat),
    minLng: String(params.minLng),
    maxLat: String(params.maxLat),
    maxLng: String(params.maxLng),
    limit: String(limit),
    ...(params.filter ? { filter: JSON.stringify(params.filter) } : {}),
  }).toString();

  const res = await authFetch<TreesInBboxResponseApi>(`/trees?${qs}`, { method: "GET" });

  return {
    items: res.items.map((x) => ({
        id: x.id,
        latitude: x.lat,
        longitude: x.lng,
        speciesId: x.speciesId ?? undefined,
        speciesCommonName: x.speciesCommonName ?? undefined,
    })),
    count: res.items.length,
    total: res.count,
    limit,
    hasMore: res.count > res.items.length,
  };
}

export async function getTreeDetailsApi(treeId: number): Promise<TreeDetail | null> {
  const res = await authFetch<TreeDetail | Record<string, never>>(`/trees/${treeId}/details`, { method: "GET" });
  // API returns {} when no details exist
  if (!res || !("id" in res)) return null;
  return res as TreeDetail;
}

export async function approveEverything(treeId: number): Promise<void> {
  await authFetch<void>(`/trees/${treeId}/approve-everything`, {
    method: "POST",
  });
}

export async function rejectEverything(treeId: number): Promise<void> {
  await authFetch<void>(`/trees/${treeId}/reject-everything`, {
    method: "POST",
  });
}