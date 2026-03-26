import { authFetch } from "@/src/api/authFetch";
import type { SpeciesOption } from "@/src/features/trees/trees.types";
import type {
  ObservationFormData,
  WildlifeFormData,
  WildlifeItem,
  CreateWildlifeResponseApi,
} from "./observations.types";

type WildlifeSpeciesApiItem = {
  id: number;
  common_name: string;
  scientific_name?: string | null;
  taxon_key?: number | null;
};

type WildlifeSpeciesListResponseApi = {
  items: WildlifeSpeciesApiItem[];
};

/**
 * GET /trees/wildlife-species
 * Returns the list of wildlife species for the dropdown.
 * Reuses SpeciesOption shape so SpeciesSelect can be reused directly.
 */
export async function getWildlifeSpeciesApi(): Promise<SpeciesOption[]> {
  const res = await authFetch<WildlifeSpeciesListResponseApi>("/trees/wildlife-species", { method: "GET" });
  return res.items.map((s) => ({
    id: s.id,
    commonName: s.common_name,
    scientificName: s.scientific_name ?? undefined,
    gbifTaxonKey: s.taxon_key ?? undefined,
  }));
}

/**
 * GET /trees/:treeId/wildlife
 * Returns wildlife records sorted: most recent first.
 */
export async function getTreeWildlifeApi(treeId: number): Promise<WildlifeItem[]> {
  return authFetch<WildlifeItem[]>(`/trees/${treeId}/wildlife`, { method: "GET" });
}

/**
 * POST /trees/:treeId/wildlife
 * Creates an observations row and a tree_wildlife_history row in one call.
 */
export async function createWildlifeApi(
  treeId: number,
  observation: ObservationFormData,
  wildlife: WildlifeFormData,
  photoKeys: string[] = [],
): Promise<CreateWildlifeResponseApi> {
  return authFetch<CreateWildlifeResponseApi>(`/trees/${treeId}/wildlife`, {
    method: "POST",
    body: {
      observation: {
        title:      observation.title      || undefined,
        noteText:   observation.noteText   || undefined,
        observedAt: observation.observedAt || undefined,
        ...(photoKeys.length > 0 ? { photoKeys } : {}),
      },
      wildlifeSpeciesId: wildlife.wildlifeSpeciesId
        ? parseInt(wildlife.wildlifeSpeciesId, 10)
        : undefined,
      lifeStage:    wildlife.lifeStage    || undefined,
      count:        wildlife.count ? parseInt(wildlife.count, 10) : undefined,
      evidenceType: wildlife.evidenceType || undefined,
      behaviour:    wildlife.behaviour    || undefined,
    },
  });
}
