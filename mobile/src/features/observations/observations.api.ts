import { authFetch } from "@/src/api/authFetch";
import { getAccessToken } from "@/src/features/auth/tokens";
import { API_URL } from "@/src/config/config";
import type { ObservationFormData, ObservationItem, CreateObservationResponseApi } from "./observations.types";
import { buildDetailsPayload } from "./observations.types";

/**
 * POST /photos/upload
 * Uploads a single photo and returns its storage key.
 * Uses fetch directly (not apiRequest) because multipart/form-data
 * must not have Content-Type set manually — the browser sets it with the boundary.
 */
export async function uploadPhotoApi(localUri: string): Promise<string> {
  const accessToken = await getAccessToken();

  const formData = new FormData();
  formData.append("photo", {
    uri: localUri,
    type: "image/jpeg",
    name: "photo.jpg",
  } as any);

  const res = await fetch(`${API_URL}/photos/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error ?? `Upload failed (${res.status})`);
  }

  return data.storageKey as string;
}

/**
 * GET /trees/:treeId/observations
 * Returns observations sorted: initial (first-ever) first, then by observed_at ASC.
 * photoKey is resolved to a full URL so ObservationCard can pass it directly to <Image>.
 */
export async function getTreeObservationsApi(treeId: number): Promise<ObservationItem[]> {
  const items = await authFetch<ObservationItem[]>(`/trees/${treeId}/observations`, { method: "GET" });
  return items.map((item) => ({
    ...item,
    photoKey: item.photoKey ? `${API_URL}/photos/${item.photoKey.split("/").pop()}` : null,
  }));
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
