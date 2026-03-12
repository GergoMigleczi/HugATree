import { authFetch } from "@/src/api/authFetch";
import type { ObservationFormData, ObservationItem, CreateObservationResponseApi } from "./observations.types";
import { buildDetailsPayload } from "./observations.types";

/**
 * GET /trees/:treeId/observations
 * Returns observations sorted: initial (first-ever) first, then by observed_at ASC.
 */
export async function getTreeObservationsApi(treeId: number): Promise<ObservationItem[]> {
  return authFetch<ObservationItem[]>(`/trees/${treeId}/observations`, { method: "GET" });
}

/**
 * POST /trees/:treeId/observations
 * Adds a new observation to an existing tree.
 */
export async function createObservationApi(
  treeId: number,
  form: ObservationFormData
): Promise<CreateObservationResponseApi> {
  const details = buildDetailsPayload(form.details);

  return authFetch<CreateObservationResponseApi>(`/trees/${treeId}/observations`, {
    method: "POST",
    body: {
      title:      form.title      || undefined,
      noteText:   form.noteText   || undefined,
      observedAt: form.observedAt || undefined,
      ...(details ? { details } : {}),
    },
  });
}
