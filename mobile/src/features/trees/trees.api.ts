import { authFetch } from "@/src/api/authFetch";
import type { SpeciesOption } from "./trees.types";

type SpeciesApiItem = {
  id: number;
  common_name: string;
  scientific_name?: string | null;
  gbif_taxon_key?: number | null;
};

export async function getSpeciesOptions(): Promise<SpeciesOption[]> {
  const items = await authFetch<SpeciesApiItem[]>("/trees/species", { method: "GET" });

  return items.map((s) => ({
    id: s.id,
    commonName: s.common_name,
    scientificName: s.scientific_name ?? undefined,
    gbifTaxonKey: s.gbif_taxon_key ?? undefined,
  }));
}