/* =========================
   Species
========================= */

// What UI uses
export type SpeciesOption = {
  id: number;
  commonName: string;
  scientificName?: string;
  gbifTaxonKey?: number;
};

// What backend returns
export type SpeciesApiItem = {
  id: number;
  common_name: string;
  scientific_name?: string | null;
  gbif_taxon_key?: number | null;
};


/* =========================
   Tree
========================= */

// Domain model (what app works with)
export type Tree = {
  id: number;
  latitude: number;
  longitude: number;

  speciesId: number;
  speciesCommonName: string;
  speciesScientificName?: string;

  createdAt: string; // ISO string
  createdByUserId: number;

  notes?: string;
};

// Backend shape (snake_case)
export type TreeApiItem = {
  id: number;
  latitude: number;
  longitude: number;

  species_id: number;
  species_common_name: string;
  species_scientific_name?: string | null;

  created_at: string;
  created_by_user_id: number;

  notes?: string | null;
};


/* =========================
   Create Tree
========================= */

// What UI sends to backend
export type CreateTreeInput = {
    tree: {
        locationLat: number;
        locationLng: number;
        speciesId: number;
        plantedAt?: string; // ISO string, optional
        plantedBy?: string; // optional
        addressText?: string; // optional
    }
    observation: CreateObservationInput;
};

export type CreateObservationInput = {
    title?: string;
    noteText?: string;
};

// What backend returns
export type CreateTreeResponseApi = {
  treeId: number;
  observationId: number;
};