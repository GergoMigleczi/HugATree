import { authLogout } from "../auth.session";

const mockGetRefreshToken = jest.fn();
const mockClearTokens    = jest.fn();
const mockLogoutApi      = jest.fn();

jest.mock("../tokens", () => ({
  getRefreshToken: () => mockGetRefreshToken(),
  clearTokens:     () => mockClearTokens(),
}));

jest.mock("../auth.api", () => ({
  logoutApi: (...args: any[]) => mockLogoutApi(...args),
}));

describe("authLogout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockClearTokens.mockResolvedValue(undefined);
    mockLogoutApi.mockResolvedValue(undefined);
  });

  test("calls logoutApi with the stored refresh token", async () => {
    mockGetRefreshToken.mockResolvedValue("refresh123");
    await authLogout();
    expect(mockLogoutApi).toHaveBeenCalledWith({ refreshToken: "refresh123" });
  });

  test("always clears tokens when a refresh token is present", async () => {
    mockGetRefreshToken.mockResolvedValue("refresh123");
    await authLogout();
    expect(mockClearTokens).toHaveBeenCalled();
  });

  test("skips logoutApi when there is no refresh token", async () => {
    mockGetRefreshToken.mockResolvedValue(null);
    await authLogout();
    expect(mockLogoutApi).not.toHaveBeenCalled();
  });

  test("still clears tokens when there is no refresh token", async () => {
    mockGetRefreshToken.mockResolvedValue(null);
    await authLogout();
    expect(mockClearTokens).toHaveBeenCalled();
  });
});
