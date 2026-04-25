import { getAdminUsersApi, setUserActiveApi } from "../admin.api";

const mockAuthFetch = jest.fn();

jest.mock("@/src/api/authFetch", () => ({
  authFetch: (...args: any[]) => mockAuthFetch(...args),
}));

describe("admin.api", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAdminUsersApi", () => {
    test("calls authFetch GET /admin/users", async () => {
      mockAuthFetch.mockResolvedValueOnce({ users: [] });
      await getAdminUsersApi();
      expect(mockAuthFetch).toHaveBeenCalledWith("/admin/users");
    });

    test("returns the users array from the response", async () => {
      const users = [
        { id: 1, email: "a@example.com", display_name: "A", is_active: true, admin_flag: true, created_at: "", updated_at: "" },
      ];
      mockAuthFetch.mockResolvedValueOnce({ users });
      const result = await getAdminUsersApi();
      expect(result).toEqual({ users });
    });

    test("propagates errors from authFetch", async () => {
      mockAuthFetch.mockRejectedValueOnce(new Error("Forbidden"));
      await expect(getAdminUsersApi()).rejects.toThrow("Forbidden");
    });
  });

  describe("setUserActiveApi", () => {
    test("calls authFetch PATCH /admin/users/{id}/active with correct body", async () => {
      mockAuthFetch.mockResolvedValueOnce({ ok: true });
      await setUserActiveApi(5, false);
      expect(mockAuthFetch).toHaveBeenCalledWith("/admin/users/5/active", {
        method: "PATCH",
        body: { active: false },
      });
    });

    test("sends active: true when reactivating", async () => {
      mockAuthFetch.mockResolvedValueOnce({ ok: true });
      await setUserActiveApi(3, true);
      expect(mockAuthFetch).toHaveBeenCalledWith("/admin/users/3/active", {
        method: "PATCH",
        body: { active: true },
      });
    });

    test("propagates errors from authFetch", async () => {
      mockAuthFetch.mockRejectedValueOnce(new Error("Not found"));
      await expect(setUserActiveApi(99, false)).rejects.toThrow("Not found");
    });
  });
});
