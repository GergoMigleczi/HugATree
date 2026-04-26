/* =========================
   Species
========================= */
export type SpeciesListResponseApi = {
  items: SpeciesApiItem[];
  count: number;
  limit: number;
  offset: number;
  hasMore: boolean;
};

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
export type GetTreesInBboxParams = {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
  limit?: number;
  filter?: any ;
};

export type getTreeDetailParams = {
  filter?: any;
};

export type TreePin = {
  id: number;
  latitude: number;
  longitude: number;
  speciesId?: number;
  speciesCommonName?: string;
};

export type TreesInBboxResponseApi = {
  items: Array<{
    id: number;
    speciesId: number | null;
    speciesCommonName: string | null;
    lat: number;
    lng: number;
  }>;
  count: number;
  limit: number;
};


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
        speciesId?: number;
        customSpeciesName?: string; // free-text when species is not in the list
        plantedAt?: string; // ISO string, optional
        plantedBy?: string; // optional
        addressText?: string; // optional
    }
    observation: CreateObservationInput;
    details?: TreeDetailHistoryInput;
};

export type CreateObservationInput = {
    title?: string;
    noteText?: string;
    observedAt?: string; // ISO timestamp
};

export type TreeDetailHistoryInput = {
    probableAgeYears?: number;
    ageBasis?: string;
    heightM?: number;
    heightMethod?: string;
    trunkDiameterCm?: number;
    diameterHeightCm?: number;
    diameterMethod?: string;
    canopyDiameterM?: number;
    canopyDensity?: string;
};

// What backend returns
export type CreateTreeResponseApi = {
  treeId: number;
  observationId: number;
};

/* =========================
   Tree Detail (latest measurements)
========================= */
export type TreeDetail = {
  id: number;
  observationId: number | null;
  probableAgeYears: number | null;
  ageBasis: string | null;
  heightM: number | null;
  heightMethod: string | null;
  trunkDiameterCm: number | null;
  diameterHeightCm: number | null;
  diameterMethod: string | null;
  canopyDiameterM: number | null;
  canopyDensity: string | null;
  recordedAt: string | null;
  recordedByName: string | null;

  estimatedCo2StoredKg: number | null;
  estimatedCo2SequesteredYearKg: number | null;
  estimatedWaterUseYearL: number | null;
  weatherPeriodStart: string | null;
  weatherPeriodEnd: string | null;
  weatherSource: string | null;
  calculationMethodVersion: string | null;
  calculatedAt: string | null;
  approvalStatus: string;
};