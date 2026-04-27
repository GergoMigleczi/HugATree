import { registerApi, loginApi, refreshApi, logoutApi, getMeApi } from "../auth.api";

const mockApiRequest = jest.fn();
const mockAuthFetch  = jest.fn();

jest.mock("@/src/api/client", () => ({
  apiRequest: (...args) => mockApiRequest(...args),
}));

jest.mock("@/src/api/authFetch", () => ({
  authFetch: (...args) => mockAuthFetch(...args),
}));

describe("auth.api", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("registerApi", () => {
    test("posts to /auth/register with correct body", async () => {
      mockApiRequest.mockResolvedValueOnce({ user: null });
      await registerApi({ email: "a@b.com", password: "pass", displayName: "Alice", adminFlag: false });
      expect(mockApiRequest).toHaveBeenCalledWith("/auth/register", {
        method: "POST",
        body: { email: "a@b.com", password: "pass", display_name: "Alice", admin_flag: false },
      });
    });

    test("returns the response from apiRequest", async () => {
      const response = { user: { id: 1, email: "a@b.com", display_name: "Alice", admin_flag: false } };
      mockApiRequest.mockResolvedValueOnce(response);
      const result = await registerApi({ email: "a@b.com", password: "pass", displayName: "Alice", adminFlag: false });
      expect(result).toEqual(response);
    });

    test("propagates errors from apiRequest", async () => {
      mockApiRequest.mockRejectedValueOnce(new Error("Email already in use"));
      await expect(
        registerApi({ email: "a@b.com", password: "pass", displayName: "Alice", adminFlag: false })
      ).rejects.toThrow("Email already in use");
    });
  });

  describe("loginApi", () => {
    test("posts to /auth/login with correct body", async () => {
      mockApiRequest.mockResolvedValueOnce({ accessToken: "a", refreshToken: "r", user: {} });
      await loginApi({ email: "a@b.com", password: "pass", deviceLabel: "expo" });
      expect(mockApiRequest).toHaveBeenCalledWith("/auth/login", {
        method: "POST",
        body: { email: "a@b.com", password: "pass", device_label: "expo" },
      });
    });

    test("returns the access token, refresh token and user from the response", async () => {
      const response = { accessToken: "acc", refreshToken: "ref", user: { id: 1, email: "a@b.com", display_name: null, admin_flag: false } };
      mockApiRequest.mockResolvedValueOnce(response);
      const result = await loginApi({ email: "a@b.com", password: "pass", deviceLabel: "expo" });
      expect(result).toEqual(response);
    });

    test("propagates errors from apiRequest", async () => {
      mockApiRequest.mockRejectedValueOnce(new Error("Invalid credentials"));
      await expect(
        loginApi({ email: "a@b.com", password: "wrong", deviceLabel: "expo" })
      ).rejects.toThrow("Invalid credentials");
    });
  });

  describe("refreshApi", () => {
    test("posts to /auth/refresh with the refresh token", async () => {
      mockApiRequest.mockResolvedValueOnce({ accessToken: "a", refreshToken: "r" });
      await refreshApi({ refreshToken: "refresh123" });
      expect(mockApiRequest).toHaveBeenCalledWith("/auth/refresh", {
        method: "POST",
        body: { refreshToken: "refresh123" },
      });
    });
  });

  describe("logoutApi", () => {
    test("posts to /auth/logout with the refresh token", async () => {
      mockApiRequest.mockResolvedValueOnce({ ok: true });
      await logoutApi({ refreshToken: "refresh123" });
      expect(mockApiRequest).toHaveBeenCalledWith("/auth/logout", {
        method: "POST",
        body: { refreshToken: "refresh123" },
      });
    });

    test("swallows errors silently and resolves to undefined", async () => {
      mockApiRequest.mockRejectedValueOnce(new Error("Network error"));
      await expect(logoutApi({ refreshToken: "refresh123" })).resolves.toBeUndefined();
    });
  });

  describe("getMeApi", () => {
    test("calls authFetch GET /me", async () => {
      mockAuthFetch.mockResolvedValueOnce({ user: { id: 1, email: "a@b.com" } });
      await getMeApi();
      expect(mockAuthFetch).toHaveBeenCalledWith("/me");
    });

    test("propagates errors from authFetch", async () => {
      mockAuthFetch.mockRejectedValueOnce(new Error("Session expired"));
      await expect(getMeApi()).rejects.toThrow("Session expired");
    });
  });
});
