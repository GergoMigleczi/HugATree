import { authFetch, refreshTokens } from "@/src/api/authFetch";
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
function mimeTypeFromUri(uri: string): string {
  const ext = uri.split(".").pop()?.toLowerCase();
  if (ext === "png")  return "image/png";
  if (ext === "webp") return "image/webp";
  return "image/jpeg";
}

async function doUpload(localUri: string, mimeType: string): Promise<Response> {
  const accessToken = await getAccessToken();
  const formData = new FormData();
  formData.append("photo", {
    uri: localUri,
    type: mimeType,
    name: `photo.${mimeType.split("/")[1]}`,
  } as any);
  return fetch(`${API_URL}/photos/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData,
  });
}

export async function uploadPhotoApi(localUri: string): Promise<string> {
  const mimeType = mimeTypeFromUri(localUri);
  let res = await doUpload(localUri, mimeType);

  if (res.status === 401) {
    const refreshed = await refreshTokens();
    if (!refreshed) throw new Error("Session expired. Please log in again.");
    res = await doUpload(localUri, mimeType);
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? `Upload failed (${res.status})`);
  return data.storageKey as string;
}

/**
 * GET /trees/:treeId/observations
 * Returns observations sorted: initial (first-ever) first, then by observed_at ASC.
 * photoKey is resolved to a full URL so ObservationCard can pass it directly to <Image>.
 */
export async function getTreeObservationsApi(treeId: number, params: Record<string, unknown>): Promise<ObservationItem[]> {
  
  const qs = new URLSearchParams({
    ...(params.filter ? { filter: JSON.stringify(params.filter) } : {}),
  }).toString();

  const items = await authFetch<ObservationItem[]>(`/trees/${treeId}/observations?${qs}`, { method: "GET" });
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
  form: ObservationFormData,
  photoKeys: string[] = [],
): Promise<CreateObservationResponseApi> {
  const details = buildDetailsPayload(form.details);

  return authFetch<CreateObservationResponseApi>(`/trees/${treeId}/observations`, {
    method: "POST",
    body: {
      title:      form.title      || undefined,
      noteText:   form.noteText   || undefined,
      observedAt: form.observedAt || undefined,
      ...(details ? { details } : {}),
      ...(photoKeys.length > 0 ? { photoKeys } : {}),
    },
  });
}

export async function approveObservationApi(treeId: number, observationId: number): Promise<void> {
  await authFetch<void>(`/trees/${treeId}/observations/${observationId}/approve`, {
    method: "POST",
  });
}

export async function rejectObservationApi(treeId: number, observationId: number): Promise<void> {
  await authFetch<void>(`/trees/${treeId}/observations/${observationId}/reject`, {
    method: "POST",
  });
}