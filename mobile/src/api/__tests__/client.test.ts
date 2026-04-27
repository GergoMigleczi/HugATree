const mockFetch = jest.fn();
global.fetch = mockFetch;

jest.mock("@/src/config/config", () => ({
  API_URL: "http://test.local",
}));

import { apiRequest } from "../client";

// Helpers to build minimal Response-like objects
function makeResponse(body: string, status: number, ok: boolean): Response {
  return {
    ok,
    status,
    text: () => Promise.resolve(body),
  } as unknown as Response;
}

function ok(body: object, status = 200) {
  return makeResponse(JSON.stringify(body), status, true);
}

function fail(body: object, status: number) {
  return makeResponse(JSON.stringify(body), status, false);
}

describe("apiRequest", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Happy path ────────────────────────────────────────────────────────────

  test("returns parsed JSON on a successful response", async () => {
    mockFetch.mockResolvedValueOnce(ok({ id: 1, name: "Oak" }));
    const result = await apiRequest("/trees/1");
    expect(result).toEqual({ id: 1, name: "Oak" });
  });

  test("defaults to GET method", async () => {
    mockFetch.mockResolvedValueOnce(ok({}));
    await apiRequest("/trees");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ method: "GET" })
    );
  });

  test("constructs the full URL from API_URL and path", async () => {
    mockFetch.mockResolvedValueOnce(ok({}));
    await apiRequest("/auth/login");
    expect(mockFetch).toHaveBeenCalledWith(
      "http://test.local/auth/login",
      expect.any(Object)
    );
  });

  test("always sets Content-Type: application/json", async () => {
    mockFetch.mockResolvedValueOnce(ok({}));
    await apiRequest("/trees");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
      })
    );
  });

  // ── Auth header ───────────────────────────────────────────────────────────

  test("adds Authorization header when accessToken is provided", async () => {
    mockFetch.mockResolvedValueOnce(ok({}));
    await apiRequest("/me", { accessToken: "my-token" });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer my-token" }),
      })
    );
  });

  test("omits Authorization header when no accessToken is given", async () => {
    mockFetch.mockResolvedValueOnce(ok({}));
    await apiRequest("/trees");
    const headers = (mockFetch.mock.calls[0][1] as any).headers;
    expect(headers).not.toHaveProperty("Authorization");
  });

  // ── Request body ──────────────────────────────────────────────────────────

  test("serialises the body to JSON when provided", async () => {
    mockFetch.mockResolvedValueOnce(ok({}));
    await apiRequest("/trees", { method: "POST", body: { name: "Oak", heightM: 12 } });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ body: JSON.stringify({ name: "Oak", heightM: 12 }) })
    );
  });

  test("sends undefined body when no body is given", async () => {
    mockFetch.mockResolvedValueOnce(ok({}));
    await apiRequest("/trees");
    const callBody = (mockFetch.mock.calls[0][1] as any).body;
    expect(callBody).toBeUndefined();
  });

  // ── HTTP methods ──────────────────────────────────────────────────────────

  test.each(["POST", "PUT", "PATCH", "DELETE"] as const)(
    "forwards %s method to fetch",
    async (method) => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await apiRequest("/trees/1", { method });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method })
      );
    }
  );

  // ── Error responses ───────────────────────────────────────────────────────

  test("throws with the server error message on a non-ok response", async () => {
    mockFetch.mockResolvedValueOnce(fail({ error: "Not found" }, 404));
    await expect(apiRequest("/trees/999")).rejects.toThrow("Not found");
  });

  test("attaches the HTTP status code to the thrown error", async () => {
    mockFetch.mockResolvedValueOnce(fail({ error: "Forbidden" }, 403));
    const err: any = await apiRequest("/admin").catch((e) => e);
    expect(err.status).toBe(403);
  });

  test("attaches the parsed response body to the thrown error", async () => {
    const body = { error: "Validation failed", field: "email" };
    mockFetch.mockResolvedValueOnce(fail(body, 422));
    const err: any = await apiRequest("/auth/register").catch((e) => e);
    expect(err.data).toEqual(body);
  });

  test("falls back to 'Request failed (status)' when error body has no message", async () => {
    mockFetch.mockResolvedValueOnce(fail({}, 500));
    await expect(apiRequest("/trees")).rejects.toThrow("Request failed (500)");
  });

  // ── Network failure ───────────────────────────────────────────────────────

  test("throws a descriptive network error when fetch itself fails", async () => {
    mockFetch.mockRejectedValueOnce(new Error("fetch failed"));
    await expect(apiRequest("/trees")).rejects.toThrow(
      "Network error calling http://test.local/trees."
    );
  });

  // ── Malformed responses ───────────────────────────────────────────────────

  test("returns an empty object when the response body is empty", async () => {
    mockFetch.mockResolvedValueOnce(makeResponse("", 200, true));
    const result = await apiRequest("/trees");
    expect(result).toEqual({});
  });

  test("returns an empty object when the response body is invalid JSON", async () => {
    mockFetch.mockResolvedValueOnce(makeResponse("not json", 200, true));
    const result = await apiRequest("/trees");
    expect(result).toEqual({});
  });
});
