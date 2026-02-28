import { authFetch } from "@/src/api/authFetch";
import type { SpeciesOption, SpeciesApiItem, CreateTreeInput, CreateTreeResponseApi, TreePin, GetTreesInBboxParams, TreesInBboxResponseApi} from "./trees.types";

export async function getSpeciesOptions(): Promise<SpeciesOption[]> {
  const items = await authFetch<SpeciesApiItem[]>("/trees/species", { method: "GET" });
  return items.map((s) => ({
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
        observation: input.observation,
    },
  });
}

export async function getTreesInBboxApi(params: GetTreesInBboxParams): Promise<{ items: TreePin[]; count: number }> {

  const limit = params.limit ?? 5000;
  if (!Number.isInteger(limit) || limit <= 0) throw new Error("limit must be a positive integer");

  const qs = new URLSearchParams({
    minLat: String(params.minLat),
    minLng: String(params.minLng),
    maxLat: String(params.maxLat),
    maxLng: String(params.maxLng),
    limit: String(limit),
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
    count: typeof res.count === "number" ? res.count : res.items.length,
  };
}