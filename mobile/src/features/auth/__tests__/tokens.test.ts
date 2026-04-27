import { saveTokens, getAccessToken, getRefreshToken, clearTokens } from "../tokens";

const mockSetItem    = jest.fn();
const mockGetItem    = jest.fn();
const mockDeleteItem = jest.fn();

jest.mock("expo-secure-store", () => ({
  setItemAsync:    (...args) => mockSetItem(...args),
  getItemAsync:    (...args) => mockGetItem(...args),
  deleteItemAsync: (...args) => mockDeleteItem(...args),
}));

describe("tokens", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSetItem.mockResolvedValue(undefined);
    mockDeleteItem.mockResolvedValue(undefined);
  });

  describe("saveTokens", () => {
    test("stores both tokens — exactly two SecureStore writes", async () => {
      await saveTokens("access123", "refresh456");
      expect(mockSetItem).toHaveBeenCalledTimes(2);
      expect(mockSetItem).toHaveBeenCalledWith("accessToken", "access123");
      expect(mockSetItem).toHaveBeenCalledWith("refreshToken", "refresh456");
    });
  });

  describe("getAccessToken", () => {
    test("retrieves the value stored under the access key", async () => {
      mockGetItem.mockResolvedValue("access123");
      const result = await getAccessToken();
      expect(mockGetItem).toHaveBeenCalledWith("accessToken");
      expect(result).toBe("access123");
    });

    test("returns null when no access token is stored", async () => {
      mockGetItem.mockResolvedValue(null);
      expect(await getAccessToken()).toBeNull();
    });
  });

  describe("getRefreshToken", () => {
    test("retrieves the value stored under the refresh key", async () => {
      mockGetItem.mockResolvedValue("refresh456");
      const result = await getRefreshToken();
      expect(mockGetItem).toHaveBeenCalledWith("refreshToken");
      expect(result).toBe("refresh456");
    });

    test("returns null when no refresh token is stored", async () => {
      mockGetItem.mockResolvedValue(null);
      expect(await getRefreshToken()).toBeNull();
    });
  });

  describe("clearTokens", () => {
    test("deletes both keys — exactly two SecureStore deletes", async () => {
      await clearTokens();
      expect(mockDeleteItem).toHaveBeenCalledTimes(2);
      expect(mockDeleteItem).toHaveBeenCalledWith("accessToken");
      expect(mockDeleteItem).toHaveBeenCalledWith("refreshToken");
    });
  });
});
