const mockAuthFetch = jest.fn();

jest.mock("@/src/api/authFetch", () => ({
  authFetch: (...args) => mockAuthFetch(...args),
}));

import {
  getSpeciesOptions,
  createTreeApi,
  getTreesInBboxApi,
  getLatestTreeDetailsApi,
  getTreeDetailsApi,
  approveEverything,
  approveTreeDetail,
  rejectEverything,
  rejectTreeDetail,
} from "../trees.api";

describe("trees.api", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── getSpeciesOptions ─────────────────────────────────────────────────────

  describe("getSpeciesOptions", () => {
    test("maps snake_case API fields to camelCase", async () => {
      mockAuthFetch.mockResolvedValueOnce({
        items: [
          { id: 1, common_name: "Oak", scientific_name: "Quercus robur", gbif_taxon_key: 2878688 },
        ],
      });
      const result = await getSpeciesOptions();
      expect(result).toEqual([
        { id: 1, commonName: "Oak", scientificName: "Quercus robur", gbifTaxonKey: 2878688 },
      ]);
    });

    test("omits undefined optional fields when null in API response", async () => {
      mockAuthFetch.mockResolvedValueOnce({
        items: [{ id: 2, common_name: "Birch", scientific_name: null, gbif_taxon_key: null }],
      });
      const [result] = await getSpeciesOptions();
      expect(result.scientificName).toBeUndefined();
      expect(result.gbifTaxonKey).toBeUndefined();
    });

    test("returns empty array when no species exist", async () => {
      mockAuthFetch.mockResolvedValueOnce({ items: [] });
      expect(await getSpeciesOptions()).toEqual([]);
    });
  });

  // ── createTreeApi ─────────────────────────────────────────────────────────

  describe("createTreeApi", () => {
    test("calls authFetch POST /trees with tree and observation in body", async () => {
      mockAuthFetch.mockResolvedValueOnce({ id: 1 });
      const input = {
        tree: { latitude: 52.1, longitude: -2.1 },
        observation: { title: "Oak" },
      } as any;
      await createTreeApi(input);
      expect(mockAuthFetch).toHaveBeenCalledWith("/trees", {
        method: "POST",
        body: { tree: input.tree, observation: { title: "Oak" } },
      });
    });

    test("includes details in observation body when provided", async () => {
      mockAuthFetch.mockResolvedValueOnce({ id: 1 });
      const input = {
        tree: { latitude: 52.1, longitude: -2.1 },
        observation: { title: "Oak" },
        details: { heightM: 12 },
      } as any;
      await createTreeApi(input);
      const body = mockAuthFetch.mock.calls[0][1].body;
      expect(body.observation.details).toEqual({ heightM: 12 });
    });

    test("omits details from observation body when not provided", async () => {
      mockAuthFetch.mockResolvedValueOnce({ id: 1 });
      const input = { tree: {}, observation: { title: "Oak" } } as any;
      await createTreeApi(input);
      const body = mockAuthFetch.mock.calls[0][1].body;
      expect(body.observation).not.toHaveProperty("details");
    });
  });

  // ── getTreesInBboxApi ─────────────────────────────────────────────────────

  describe("getTreesInBboxApi", () => {
    const BASE_PARAMS = { minLat: 51, minLng: -3, maxLat: 53, maxLng: -1 };
    const API_ITEM = { id: 1, lat: 52.1, lng: -2.1, speciesId: 10, speciesCommonName: "Oak" };

    test("transforms lat/lng to latitude/longitude", async () => {
      mockAuthFetch.mockResolvedValueOnce({ items: [API_ITEM], count: 1 });
      const { items } = await getTreesInBboxApi(BASE_PARAMS);
      expect(items[0]).toMatchObject({ latitude: 52.1, longitude: -2.1 });
    });

    test("calculates hasMore correctly when more items exist on server", async () => {
      mockAuthFetch.mockResolvedValueOnce({ items: [API_ITEM], count: 100 });
      const result = await getTreesInBboxApi({ ...BASE_PARAMS, limit: 1 });
      expect(result.hasMore).toBe(true);
    });

    test("hasMore is false when all items are returned", async () => {
      mockAuthFetch.mockResolvedValueOnce({ items: [API_ITEM], count: 1 });
      const result = await getTreesInBboxApi(BASE_PARAMS);
      expect(result.hasMore).toBe(false);
    });

    test("defaults limit to 5000 when not specified", async () => {
      mockAuthFetch.mockResolvedValueOnce({ items: [], count: 0 });
      const result = await getTreesInBboxApi(BASE_PARAMS);
      expect(result.limit).toBe(5000);
    });

    test("throws when limit is zero", async () => {
      await expect(getTreesInBboxApi({ ...BASE_PARAMS, limit: 0 })).rejects.toThrow(
        "limit must be a positive integer"
      );
    });

    test("throws when limit is negative", async () => {
      await expect(getTreesInBboxApi({ ...BASE_PARAMS, limit: -1 })).rejects.toThrow(
        "limit must be a positive integer"
      );
    });

    test("throws when limit is a non-integer", async () => {
      await expect(getTreesInBboxApi({ ...BASE_PARAMS, limit: 1.5 })).rejects.toThrow(
        "limit must be a positive integer"
      );
    });

    test("includes bbox coordinates in the querystring", async () => {
      mockAuthFetch.mockResolvedValueOnce({ items: [], count: 0 });
      await getTreesInBboxApi(BASE_PARAMS);
      const url: string = mockAuthFetch.mock.calls[0][0];
      expect(url).toContain("minLat=51");
      expect(url).toContain("maxLat=53");
    });
  });

  // ── getLatestTreeDetailsApi ───────────────────────────────────────────────

  describe("getLatestTreeDetailsApi", () => {
    test("returns null when the API returns an empty object", async () => {
      mockAuthFetch.mockResolvedValueOnce({});
      expect(await getLatestTreeDetailsApi(1)).toBeNull();
    });

    test("returns the detail object when it has an id", async () => {
      const detail = { id: 42, heightM: 10 };
      mockAuthFetch.mockResolvedValueOnce(detail);
      expect(await getLatestTreeDetailsApi(1)).toEqual(detail);
    });
  });

  // ── getTreeDetailsApi ─────────────────────────────────────────────────────

  describe("getTreeDetailsApi", () => {
    test("returns empty array when the API returns a non-array", async () => {
      mockAuthFetch.mockResolvedValueOnce({});
      expect(await getTreeDetailsApi(1, {})).toEqual([]);
    });

    test("maps null API fields to null in the result", async () => {
      mockAuthFetch.mockResolvedValueOnce([{ id: 1, heightM: null, approvalStatus: null }]);
      const [detail] = await getTreeDetailsApi(1, {});
      expect(detail.heightM).toBeNull();
      expect(detail.approvalStatus).toBe("pending");
    });

    test("preserves approvalStatus from API when present", async () => {
      mockAuthFetch.mockResolvedValueOnce([{ id: 1, approvalStatus: "approved" }]);
      const [detail] = await getTreeDetailsApi(1, {});
      expect(detail.approvalStatus).toBe("approved");
    });
  });

  // ── Approve / reject pass-throughs ────────────────────────────────────────

  test("approveEverything calls POST /trees/:id/approve-everything", async () => {
    mockAuthFetch.mockResolvedValueOnce(undefined);
    await approveEverything(5);
    expect(mockAuthFetch).toHaveBeenCalledWith("/trees/5/approve-everything", { method: "POST" });
  });

  test("approveTreeDetail calls POST /trees/:treeId/details/:detailId/approve", async () => {
    mockAuthFetch.mockResolvedValueOnce(undefined);
    await approveTreeDetail(5, 99);
    expect(mockAuthFetch).toHaveBeenCalledWith("/trees/5/details/99/approve", { method: "POST" });
  });

  test("rejectEverything calls POST /trees/:id/reject-everything", async () => {
    mockAuthFetch.mockResolvedValueOnce(undefined);
    await rejectEverything(5);
    expect(mockAuthFetch).toHaveBeenCalledWith("/trees/5/reject-everything", { method: "POST" });
  });

  test("rejectTreeDetail calls POST /trees/:treeId/details/:detailId/reject", async () => {
    mockAuthFetch.mockResolvedValueOnce(undefined);
    await rejectTreeDetail(5, 99);
    expect(mockAuthFetch).toHaveBeenCalledWith("/trees/5/details/99/reject", { method: "POST" });
  });
});
