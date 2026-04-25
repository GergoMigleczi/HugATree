import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockGetAdminUsersApi = jest.fn();
const mockSetUserActiveApi = jest.fn();
const mockBack = jest.fn();
const mockUseAuth = jest.fn();

jest.mock("@/src/features/admin/admin.api", () => ({
  getAdminUsersApi: (...args: any[]) => mockGetAdminUsersApi(...args),
  setUserActiveApi: (...args: any[]) => mockSetUserActiveApi(...args),
}));

jest.mock("@/src/features/auth/AuthProvider", () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack }),
}));

jest.mock("react-native-safe-area-context", () => {
  const { View } = require("react-native");
  return { SafeAreaView: View };
});

jest.spyOn(Alert, "alert");

// ── Subject under test ─────────────────────────────────────────────────────

import AdminScreen from "@/app/(admin)/users";

// ── Fixtures ───────────────────────────────────────────────────────────────

const ADMIN_USER = { id: 1, email: "admin@example.com", display_name: "Admin User", admin_flag: true };

const MOCK_USERS = [
  { id: 1, email: "admin@example.com", display_name: "Admin User", is_active: true,  admin_flag: true,  created_at: "", updated_at: "" },
  { id: 2, email: "user@example.com",  display_name: "Regular User", is_active: true,  admin_flag: false, created_at: "", updated_at: "" },
  { id: 3, email: "gone@example.com",  display_name: "Inactive User", is_active: false, admin_flag: false, created_at: "", updated_at: "" },
];

function makeAuth(overrides = {}) {
  return {
    user: ADMIN_USER,
    isAdmin: true,
    isLoggedIn: true,
    loading: false,
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
    refreshUser: jest.fn(),
    ...overrides,
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("<AdminScreen />", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue(makeAuth());
    mockGetAdminUsersApi.mockResolvedValue({ users: MOCK_USERS });
    mockSetUserActiveApi.mockResolvedValue(undefined);
  });

  // ── Access control ─────────────────────────────────────────────────────

  test("shows access denied message for non-admin users", () => {
    mockUseAuth.mockReturnValue(makeAuth({ isAdmin: false }));
    const { getByText } = render(<AdminScreen />);
    expect(getByText("Admin access required")).toBeTruthy();
  });

  test("does not fetch users when not an admin", () => {
    mockUseAuth.mockReturnValue(makeAuth({ isAdmin: false }));
    render(<AdminScreen />);
    expect(mockGetAdminUsersApi).not.toHaveBeenCalled();
  });

  // ── Rendering ──────────────────────────────────────────────────────────

  test("renders the Admin Dashboard heading", async () => {
    const { getByText } = render(<AdminScreen />);
    expect(getByText("Admin Dashboard")).toBeTruthy();
  });

  test("fetches and displays all users by email", async () => {
    const { getByText } = render(<AdminScreen />);
    await waitFor(() => {
      expect(getByText("admin@example.com")).toBeTruthy();
      expect(getByText("user@example.com")).toBeTruthy();
      expect(getByText("gone@example.com")).toBeTruthy();
    });
  });

  test("shows the Admin badge only on admin users", async () => {
    const { getAllByText } = render(<AdminScreen />);
    await waitFor(() => {
      expect(getAllByText("Admin")).toHaveLength(1);
    });
  });

  test("shows Active status for active users", async () => {
    const { getAllByText } = render(<AdminScreen />);
    await waitFor(() => {
      // 2 user status labels + 1 summary card label
      expect(getAllByText("Active")).toHaveLength(3);
    });
  });

  test("shows Deactivated status for inactive users", async () => {
    const { getByText } = render(<AdminScreen />);
    await waitFor(() => {
      expect(getByText("Deactivated")).toBeTruthy();
    });
  });

  // ── Summary counts ─────────────────────────────────────────────────────

  test("shows correct total, active, and deactivated counts", async () => {
    const { getByText } = render(<AdminScreen />);
    await waitFor(() => {
      expect(getByText("Total")).toBeTruthy();
      expect(getByText("Active")).toBeTruthy();
      expect(getByText("Deactivated")).toBeTruthy();
    });
  });

  // ── Toggle deactivation ────────────────────────────────────────────────

  test("shows a confirmation alert when toggling another user", async () => {
    const { getByTestId } = render(<AdminScreen />);
    await waitFor(() => getByTestId("toggle-2"));
    fireEvent(getByTestId("toggle-2"), "valueChange", false);
    expect(Alert.alert).toHaveBeenCalledWith(
      "Deactivate account",
      expect.stringContaining("user@example.com"),
      expect.any(Array)
    );
  });

  test("calls setUserActiveApi when the confirmation is accepted", async () => {
    (Alert.alert as jest.Mock).mockImplementationOnce((_title, _msg, buttons) => {
      const confirm = buttons.find((b: any) => b.style === "destructive");
      confirm?.onPress();
    });

    const { getByTestId } = render(<AdminScreen />);
    await waitFor(() => getByTestId("toggle-2"));
    fireEvent(getByTestId("toggle-2"), "valueChange", false);

    await waitFor(() => {
      expect(mockSetUserActiveApi).toHaveBeenCalledWith(2, false);
    });
  });

  test("does not call setUserActiveApi when the alert is cancelled", async () => {
    (Alert.alert as jest.Mock).mockImplementationOnce((_title, _msg, buttons) => {
      const cancel = buttons.find((b: any) => b.style === "cancel");
      cancel?.onPress?.();
    });

    const { getByTestId } = render(<AdminScreen />);
    await waitFor(() => getByTestId("toggle-2"));
    fireEvent(getByTestId("toggle-2"), "valueChange", false);

    expect(mockSetUserActiveApi).not.toHaveBeenCalled();
  });

  test("shows Not allowed alert when trying to toggle own account", async () => {
    const { getByTestId } = render(<AdminScreen />);
    await waitFor(() => getByTestId("toggle-1"));
    fireEvent(getByTestId("toggle-1"), "valueChange", false);
    expect(Alert.alert).toHaveBeenCalledWith("Not allowed", expect.any(String));
  });

  // ── Error handling ─────────────────────────────────────────────────────

  test("shows error message when the fetch fails", async () => {
    mockGetAdminUsersApi.mockRejectedValueOnce(new Error("Network error"));
    const { getByText } = render(<AdminScreen />);
    await waitFor(() => {
      expect(getByText("Network error")).toBeTruthy();
    });
  });

  test("retry button re-fetches users", async () => {
    mockGetAdminUsersApi
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce({ users: MOCK_USERS });

    const { getByText } = render(<AdminScreen />);
    await waitFor(() => getByText("Network error"));

    fireEvent.press(getByText("Retry"));
    await waitFor(() => {
      expect(mockGetAdminUsersApi).toHaveBeenCalledTimes(2);
    });
  });

  // ── Navigation ─────────────────────────────────────────────────────────

  test("back button calls router.back()", async () => {
    const { getByTestId } = render(<AdminScreen />);
    fireEvent.press(getByTestId("back-btn"));
    expect(mockBack).toHaveBeenCalled();
  });
});
