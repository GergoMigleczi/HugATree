import type { TreeDetailHistoryInput } from "@/src/features/trees/trees.types";

/* =========================
   Form state (all strings — controlled inputs)
========================= */

export type TreeDetailsFormData = {
  probableAgeYears: string;
  ageBasis: string;
  heightM: string;
  heightMethod: string;
  trunkDiameterCm: string;
  diameterHeightCm: string;
  diameterMethod: string;
  canopyDiameterM: string;
  canopyDensity: string;
};

export type ObservationFormData = {
  title: string;
  noteText: string;
  observedAt: string;
  details: TreeDetailsFormData;
  photoUri: string | null; // local device URI before upload, null if none selected
};

export type WildlifeFormData = {
  wildlifeSpeciesId: string; // "123" or "" if not selected — string for controlled inputs
  lifeStage: string;
  count: string;
  evidenceType: string;
  behaviour: string;
};

export type HealthIssueFormData = {
  issueType: string;
  issueName: string;
  affectedPart: string;
  severity: string;
};

export type HealthFormData = {
  healthStatus: string;
  riskLevel: string;
  issues: HealthIssueFormData[];
};

/* =========================
   Empty form constants
========================= */

export const EMPTY_DETAILS: TreeDetailsFormData = {
  probableAgeYears: "",
  ageBasis: "",
  heightM: "",
  heightMethod: "",
  trunkDiameterCm: "",
  diameterHeightCm: "",
  diameterMethod: "",
  canopyDiameterM: "",
  canopyDensity: "",
};

export const EMPTY_OBSERVATION_FORM: ObservationFormData = {
  title: "",
  noteText: "",
  observedAt: "",
  details: EMPTY_DETAILS,
  photoUri: null,
};

export const EMPTY_WILDLIFE_FORM: WildlifeFormData = {
  wildlifeSpeciesId: "",
  lifeStage: "",
  count: "",
  evidenceType: "",
  behaviour: "",
};

export const EMPTY_HEALTH_ISSUE: HealthIssueFormData = {
  issueType: "",
  issueName: "",
  affectedPart: "",
  severity: "",
};

export const EMPTY_HEALTH_FORM: HealthFormData = {
  healthStatus: "",
  riskLevel: "",
  issues: [],
};

/* =========================
   API helpers
========================= */

/**
 * Normalises a date string from the API (space separator, bare UTC offset like +00)
 * to a valid ISO 8601 string that browsers and React Native parse correctly.
 * e.g. "2024-01-15 10:30:00+00" → "2024-01-15T10:30:00+00:00"
 */
export function normaliseApiDate(raw: string): string {
  return raw.replace(" ", "T").replace(/\+(\d{2})$/, "+$1:00");
}

/**
 * Converts string form fields to typed numbers ready for the API.
 * Returns undefined if no fields have been filled in.
 */
export function buildDetailsPayload(
  d: TreeDetailsFormData
): TreeDetailHistoryInput | undefined {
  const payload: TreeDetailHistoryInput = {};
  if (d.probableAgeYears) payload.probableAgeYears = parseInt(d.probableAgeYears, 10);
  if (d.ageBasis)          payload.ageBasis         = d.ageBasis;
  if (d.heightM)           payload.heightM           = parseFloat(d.heightM);
  if (d.heightMethod)      payload.heightMethod      = d.heightMethod;
  if (d.trunkDiameterCm)   payload.trunkDiameterCm   = parseFloat(d.trunkDiameterCm);
  if (d.diameterHeightCm)  payload.diameterHeightCm  = parseFloat(d.diameterHeightCm);
  if (d.diameterMethod)    payload.diameterMethod    = d.diameterMethod;
  if (d.canopyDiameterM)   payload.canopyDiameterM   = parseFloat(d.canopyDiameterM);
  if (d.canopyDensity)     payload.canopyDensity     = d.canopyDensity;
  return Object.keys(payload).length > 0 ? payload : undefined;
}

/* =========================
   API response shapes
========================= */

// A single observation as returned by GET /trees/:id/observations
export type ObservationItem = {
  id: number;
  title: string | null;
  noteText: string | null;
  observedAt: string | null;
  createdAt: string;
  authorName: string | null;
  photoKey: string | null; // storage key of the first attached photo, if any
};

// Response from POST /trees/:id/observations
export type CreateObservationResponseApi = {
  observationId: number;
};

// A single wildlife record as returned by GET /trees/:id/wildlife
// Includes the linked observation fields so ObservationCard can be reused
export type WildlifeItem = {
  id: number;
  wildlifeSpeciesId: number;
  wildlifeSpeciesName: string;
  lifeStage: string;
  count: number | null;
  evidenceType: string;
  behaviour: string | null;
  // linked observation fields
  observationId: number;
  title: string | null;
  noteText: string | null;
  observedAt: string | null;
  createdAt: string;
  authorName: string | null;
  photoKey: string | null;
};

// Response from POST /trees/:id/wildlife
export type CreateWildlifeResponseApi = {
  wildlifeId: number;
  observationId: number;
};

// A single health record as returned by GET /trees/:id/health
export type HealthItem = {
  id: number;
  healthStatus: string;
  riskLevel: string;
  issues: Array<{
    issueType: string;
    issueName: string;
    affectedPart: string;
    severity: string;
  }>;
  // linked observation fields
  observationId: number;
  title: string | null;
  noteText: string | null;
  observedAt: string | null;
  createdAt: string;
  authorName: string | null;
  photoKey: string | null;
};

// Response from POST /trees/:id/health
export type CreateHealthResponseApi = {
  healthId: number;
  observationId: number;
};
