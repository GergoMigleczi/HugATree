import { createObservationApi } from "../observations.api";
import type { ObservationFormData, CreateObservationResponseApi } from "../observations.types";

/**
 * Adds a new observation to an existing tree.
 * Used by the tree detail modal when the user taps "Add note".
 */
export async function createObservation(
  treeId: number,
  form: ObservationFormData
): Promise<CreateObservationResponseApi> {
  return createObservationApi(treeId, form);
}
