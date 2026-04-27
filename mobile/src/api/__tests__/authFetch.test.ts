const mockApiRequest      = jest.fn();
const mockGetAccessToken  = jest.fn();
const mockGetRefreshToken = jest.fn();
const mockSaveTokens      = jest.fn();
const mockClearTokens     = jest.fn();

jest.mock("@/src/api/client", () => ({
  apiRequest: (...args) => mockApiRequest(...args),
}));

jest.mock("@/src/features/auth/tokens", () => ({
  getAccessToken:  () => mockGetAccessToken(),
  getRefreshToken: () => mockGetRefreshToken(),
  saveTokens:      (...args) => mockSaveTokens(...args),
  clearTokens:     () => mockClearTokens(),
}));

import { refreshTokens, authFetch } from "../authFetch";

describe("refreshTokens", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSaveTokens.mockResolvedValue(undefined);
    mockClearTokens.mockResolvedValue(undefined);
  });

  test("returns false when there is no stored refresh token", async () => {
    mockGetRefreshToken.mockResolvedValue(null);
    expect(await refreshTokens()).toBe(false);
  });

  test("returns true and saves new tokens on a successful refresh", async () => {
    mockGetRefreshToken.mockResolvedValue("old-refresh");
    mockApiRequest.mockResolvedValueOnce({ accessToken: "new-access", refreshToken: "new-refresh" });
    expect(await refreshTokens()).toBe(true);
    expect(mockSaveTokens).toHaveBeenCalledWith("new-access", "new-refresh");
  });

  test("returns false and clears tokens when the refresh request fails", async () => {
    mockGetRefreshToken.mockResolvedValue("old-refresh");
    mockApiRequest.mockRejectedValueOnce(new Error("Expired"));
    expect(await refreshTokens()).toBe(false);
    expect(mockClearTokens).toHaveBeenCalled();
  });

  test("deduplicates concurrent calls — apiRequest is only called once", async () => {
    mockGetRefreshToken.mockResolvedValue("old-refresh");
    let resolve!: (v: any) => void;
    const deferred = new Promise((res) => { resolve = res; });
    mockApiRequest.mockReturnValueOnce(deferred);

    const [a, b] = await Promise.all([
      refreshTokens(),
      refreshTokens(),
      resolve({ accessToken: "a", refreshToken: "r" }),
    ]);

    expect(mockApiRequest).toHaveBeenCalledTimes(1);
    expect(a).toBe(true);
    expect(b).toBe(true);
  });
});

describe("authFetch", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSaveTokens.mockResolvedValue(undefined);
    mockClearTokens.mockResolvedValue(undefined);
  });

  test("attaches the stored access token to the request", async () => {
    mockGetAccessToken.mockResolvedValue("my-token");
    mockApiRequest.mockResolvedValueOnce({ data: "ok" });
    await authFetch("/some/path");
    expect(mockApiRequest).toHaveBeenCalledWith("/some/path", expect.objectContaining({
      accessToken: "my-token",
    }));
  });

  test("returns the response data on success", async () => {
    mockGetAccessToken.mockResolvedValue("my-token");
    mockApiRequest.mockResolvedValueOnce({ result: 42 });
    expect(await authFetch("/data")).toEqual({ result: 42 });
  });

  test("re-throws non-401 errors without attempting a refresh", async () => {
    mockGetAccessToken.mockResolvedValue("my-token");
    const err = Object.assign(new Error("Server error"), { status: 500 });
    mockApiRequest.mockRejectedValueOnce(err);
    await expect(authFetch("/data")).rejects.toThrow("Server error");
    expect(mockGetRefreshToken).not.toHaveBeenCalled();
  });

  test("retries the original request after a successful token refresh on 401", async () => {
    mockGetAccessToken.mockResolvedValue("old-token");
    mockGetRefreshToken.mockResolvedValue("old-refresh");
    mockSaveTokens.mockResolvedValue(undefined);

    const unauthorized = Object.assign(new Error("Unauthorized"), { status: 401 });
    mockApiRequest
      .mockRejectedValueOnce(unauthorized)                                      // first attempt → 401
      .mockResolvedValueOnce({ accessToken: "new", refreshToken: "new-r" })    // token refresh call
      .mockResolvedValueOnce({ data: "retried" });                              // retry

    expect(await authFetch("/protected")).toEqual({ data: "retried" });
  });

  test("throws 'Session expired' on 401 when token refresh fails", async () => {
    mockGetAccessToken.mockResolvedValue("old-token");
    mockGetRefreshToken.mockResolvedValue(null);

    const unauthorized = Object.assign(new Error("Unauthorized"), { status: 401 });
    mockApiRequest.mockRejectedValueOnce(unauthorized);

    await expect(authFetch("/protected")).rejects.toThrow("Session expired. Please log in again.");
  });
});
