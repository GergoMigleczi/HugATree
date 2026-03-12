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
};

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
};

/* =========================
   API helpers
========================= */

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
   API response shape
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
