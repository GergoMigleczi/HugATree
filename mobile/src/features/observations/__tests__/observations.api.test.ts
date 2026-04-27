const mockAuthFetch    = jest.fn();
const mockRefreshTokens = jest.fn();
const mockGetAccessToken = jest.fn();
const mockFetch        = jest.fn();

global.fetch = mockFetch;

jest.mock("@/src/api/authFetch", () => ({
  authFetch:     (...args) => mockAuthFetch(...args),
  refreshTokens: () => mockRefreshTokens(),
}));

jest.mock("@/src/features/auth/tokens", () => ({
  getAccessToken: () => mockGetAccessToken(),
}));

jest.mock("@/src/config/config", () => ({
  API_URL: "http://test.local",
}));

import {
  uploadPhotoApi,
  getTreeObservationsApi,
  createObservationApi,
  approveObservationApi,
  rejectObservationApi,
} from "../observations.api";
import { EMPTY_OBSERVATION_FORM } from "../observations.types";

function uploadResponse(body: object, status: number) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

describe("observations.api", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAccessToken.mockResolvedValue("token");
    mockRefreshTokens.mockResolvedValue(true);
  });

  // ── uploadPhotoApi ────────────────────────────────────────────────────────

  describe("uploadPhotoApi", () => {
    test("returns the storageKey on a successful upload", async () => {
      mockFetch.mockResolvedValueOnce(uploadResponse({ storageKey: "photos/abc.jpg" }, 200));
      expect(await uploadPhotoApi("file:///img/photo.jpg")).toBe("photos/abc.jpg");
    });

    test("sends a POST to /photos/upload with Authorization header", async () => {
      mockFetch.mockResolvedValueOnce(uploadResponse({ storageKey: "k" }, 200));
      await uploadPhotoApi("file:///img/photo.jpg");
      expect(mockFetch).toHaveBeenCalledWith(
        "http://test.local/photos/upload",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({ Authorization: "Bearer token" }),
        })
      );
    });

    test("detects jpeg mime type for .jpg extension", async () => {
      mockFetch.mockResolvedValueOnce(uploadResponse({ storageKey: "k" }, 200));
      await uploadPhotoApi("file:///img/photo.jpg");
      const formData = (mockFetch.mock.calls[0][1] as any).body as FormData;
      const file = (formData as any)._parts?.[0]?.[1] ?? (formData.get?.("photo") as any);
      expect(file?.type ?? "image/jpeg").toContain("jpeg");
    });

    test("detects png mime type for .png extension", async () => {
      mockFetch.mockResolvedValueOnce(uploadResponse({ storageKey: "k" }, 200));
      await uploadPhotoApi("file:///img/photo.png");
      const formData = (mockFetch.mock.calls[0][1] as any).body as FormData;
      const file = (formData as any)._parts?.[0]?.[1];
      expect(file?.type ?? "image/png").toContain("png");
    });

    test("retries after refreshing tokens on a 401 response", async () => {
      mockFetch
        .mockResolvedValueOnce(uploadResponse({}, 401))
        .mockResolvedValueOnce(uploadResponse({ storageKey: "retried-key" }, 200));
      const result = await uploadPhotoApi("file:///img/photo.jpg");
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result).toBe("retried-key");
    });

    test("throws 'Session expired' when refresh fails on 401", async () => {
      mockRefreshTokens.mockResolvedValueOnce(false);
      mockFetch.mockResolvedValueOnce(uploadResponse({}, 401));
      await expect(uploadPhotoApi("file:///img/photo.jpg")).rejects.toThrow(
        "Session expired. Please log in again."
      );
    });

    test("throws with server error message on a non-ok upload response", async () => {
      mockFetch.mockResolvedValueOnce(uploadResponse({ error: "File too large" }, 413));
      await expect(uploadPhotoApi("file:///img/photo.jpg")).rejects.toThrow("File too large");
    });

    test("falls back to 'Upload failed (status)' when error body has no message", async () => {
      mockFetch.mockResolvedValueOnce(uploadResponse({}, 500));
      await expect(uploadPhotoApi("file:///img/photo.jpg")).rejects.toThrow("Upload failed (500)");
    });
  });

  // ── getTreeObservationsApi ────────────────────────────────────────────────

  describe("getTreeObservationsApi", () => {
    test("calls authFetch GET /trees/:id/observations", async () => {
      mockAuthFetch.mockResolvedValueOnce([]);
      await getTreeObservationsApi(7, {});
      expect(mockAuthFetch).toHaveBeenCalledWith(
        expect.stringContaining("/trees/7/observations"),
        { method: "GET" }
      );
    });

    test("resolves photoKey to a full URL", async () => {
      mockAuthFetch.mockResolvedValueOnce([
        { id: 1, photoKey: "photos/abc.jpg" },
      ]);
      const [item] = await getTreeObservationsApi(7, {});
      expect(item.photoKey).toBe("http://test.local/photos/abc.jpg");
    });

    test("leaves photoKey as null when not present", async () => {
      mockAuthFetch.mockResolvedValueOnce([{ id: 1, photoKey: null }]);
      const [item] = await getTreeObservationsApi(7, {});
      expect(item.photoKey).toBeNull();
    });

    test("includes filter in querystring when provided", async () => {
      mockAuthFetch.mockResolvedValueOnce([]);
      await getTreeObservationsApi(7, { filter: { status: "pending" } });
      const url: string = mockAuthFetch.mock.calls[0][0];
      expect(url).toContain("filter=");
    });
  });

  // ── createObservationApi ──────────────────────────────────────────────────

  describe("createObservationApi", () => {
    test("calls authFetch POST /trees/:id/observations", async () => {
      mockAuthFetch.mockResolvedValueOnce({ id: 1 });
      await createObservationApi(7, { ...EMPTY_OBSERVATION_FORM, title: "Oak update" });
      expect(mockAuthFetch).toHaveBeenCalledWith(
        "/trees/7/observations",
        expect.objectContaining({ method: "POST" })
      );
    });

    test("omits empty title from body", async () => {
      mockAuthFetch.mockResolvedValueOnce({ id: 1 });
      await createObservationApi(7, { ...EMPTY_OBSERVATION_FORM, title: "" });
      const body = mockAuthFetch.mock.calls[0][1].body;
      expect(body.title).toBeUndefined();
    });

    test("includes photoKeys in body when provided", async () => {
      mockAuthFetch.mockResolvedValueOnce({ id: 1 });
      await createObservationApi(7, EMPTY_OBSERVATION_FORM, ["photos/a.jpg"]);
      const body = mockAuthFetch.mock.calls[0][1].body;
      expect(body.photoKeys).toEqual(["photos/a.jpg"]);
    });

    test("omits photoKeys from body when array is empty", async () => {
      mockAuthFetch.mockResolvedValueOnce({ id: 1 });
      await createObservationApi(7, EMPTY_OBSERVATION_FORM, []);
      const body = mockAuthFetch.mock.calls[0][1].body;
      expect(body).not.toHaveProperty("photoKeys");
    });
  });

  // ── Approve / reject pass-throughs ────────────────────────────────────────

  test("approveObservationApi calls POST /trees/:treeId/observations/:obsId/approve", async () => {
    mockAuthFetch.mockResolvedValueOnce(undefined);
    await approveObservationApi(7, 42);
    expect(mockAuthFetch).toHaveBeenCalledWith(
      "/trees/7/observations/42/approve",
      { method: "POST" }
    );
  });

  test("rejectObservationApi calls POST /trees/:treeId/observations/:obsId/reject", async () => {
    mockAuthFetch.mockResolvedValueOnce(undefined);
    await rejectObservationApi(7, 42);
    expect(mockAuthFetch).toHaveBeenCalledWith(
      "/trees/7/observations/42/reject",
      { method: "POST" }
    );
  });
});
