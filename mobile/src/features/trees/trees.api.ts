import { authFetch } from "@/src/api/authFetch";
import type { SpeciesOption, CreateTreeInput, CreateTreeResponseApi, TreePin, GetTreesInBboxParams, getTreeDetailParams, TreesInBboxResponseApi, SpeciesListResponseApi, TreeDetail, Tree } from "./trees.types";

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

export async function getLatestTreeDetailsApi(treeId: number): Promise<TreeDetail | null> {
  const res = await authFetch<TreeDetail | Record<string, never>>(`/trees/${treeId}/latest-details`, { method: "GET" });
  // API returns {} when no details exist
  if (!res || !("id" in res)) return null;
  return res as TreeDetail;
}

export async function getTreeDetailsApi(
  treeId: number,
  params: getTreeDetailParams
): Promise<TreeDetail[]> {
  const qs = new URLSearchParams({
    ...(params.filter ? { filter: JSON.stringify(params.filter) } : {}),
  }).toString();

  const res = await authFetch<TreeDetail[] | Record<string, never>>(
    `/trees/${treeId}/details?${qs}`,
    { method: "GET" }
  );

  if (!Array.isArray(res)) {
    return [];
  }

  return res.map((x) => ({
    id: x.id,
    observationId: x.observationId ?? null,
    probableAgeYears: x.probableAgeYears ?? null,
    ageBasis: x.ageBasis ?? null,
    heightM: x.heightM ?? null,
    heightMethod: x.heightMethod ?? null,
    trunkDiameterCm: x.trunkDiameterCm ?? null,
    diameterHeightCm: x.diameterHeightCm ?? null,
    diameterMethod: x.diameterMethod ?? null,
    canopyDiameterM: x.canopyDiameterM ?? null,
    canopyDensity: x.canopyDensity ?? null,
    recordedAt: x.recordedAt ?? null,
    recordedByName: x.recordedByName ?? null,

    estimatedCo2StoredKg: x.estimatedCo2StoredKg ?? null,
    estimatedCo2SequesteredYearKg: x.estimatedCo2SequesteredYearKg ?? null,
    estimatedWaterUseYearL: x.estimatedWaterUseYearL ?? null,

    weatherPeriodStart: x.weatherPeriodStart ?? null,
    weatherPeriodEnd: x.weatherPeriodEnd ?? null,
    weatherSource: x.weatherSource ?? null,
    calculationMethodVersion: x.calculationMethodVersion ?? null,
    calculatedAt: x.calculatedAt ?? null,
    approvalStatus: x.approvalStatus ?? "pending",
  }));
}

export async function approveEverything(treeId: number): Promise<void> {
  await authFetch<void>(`/trees/${treeId}/approve-everything`, {
    method: "POST",
  });
}

export async function approveTreeDetail(treeId: number, treeDetailId: number): Promise<void> {
  await authFetch<void>(`/trees/${treeId}/details/${treeDetailId}/approve`, {
    method: "POST",
  });
}


export async function rejectEverything(treeId: number): Promise<void> {
  await authFetch<void>(`/trees/${treeId}/reject-everything`, {
    method: "POST",
  });
}

export async function rejectTreeDetail(treeId: number, treeDetailId: number): Promise<void> {
  await authFetch<void>(`/trees/${treeId}/details/${treeDetailId}/reject`, {
    method: "POST",
  });
}