import { authFetch } from "@/src/api/authFetch";
import type { SpeciesOption, SpeciesApiItem, CreateTreeInput, CreateTreeResponseApi, Tree} from "./trees.types";

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