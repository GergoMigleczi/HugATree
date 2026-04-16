// SCRUM-41 — Register screen tests.
// Covers rendering, validation (all three fields), happy path, API errors, password toggle, and snapshot.

import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockRegister = jest.fn();
const mockWithLoading = jest.fn((fn: () => Promise<unknown>) => fn());

jest.mock("@/src/features/auth/AuthProvider", () => ({
  useAuth: () => ({
    register: mockRegister,
    user: null,
    isLoggedIn: false,
    loading: false,
    login: jest.fn(),
    logout: jest.fn(),
    refreshUser: jest.fn(),
  }),
}));

jest.mock("@/src/ui/loading/LoadingProvider", () => ({
  useLoading: () => ({
    withLoading: mockWithLoading,
  }),
}));

jest.mock("expo-router", () => ({
  Link: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("react-native-safe-area-context", () => {
  const { View } = require("react-native");
  return { SafeAreaView: View };
});

jest.spyOn(Alert, "alert");

// ── Subject under test ─────────────────────────────────────────────────────

import RegisterScreen from "@/app/(auth)/register";

// ── Helpers ────────────────────────────────────────────────────────────────

const NAME_PLACEHOLDER     = "Your name";
const EMAIL_PLACEHOLDER    = "you@example.com";
const PASSWORD_PLACEHOLDER = "At least 8 characters";

function fillAndSubmit(
  utils: ReturnType<typeof render>,
  name: string,
  email: string,
  password: string
) {
  fireEvent.changeText(utils.getByPlaceholderText(NAME_PLACEHOLDER), name);
  fireEvent.changeText(utils.getByPlaceholderText(EMAIL_PLACEHOLDER), email);
  fireEvent.changeText(utils.getByPlaceholderText(PASSWORD_PLACEHOLDER), password);
  fireEvent.press(utils.getByTestId("submit-register"));
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("<RegisterScreen />", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Rendering ─────────────────────────────────────────────────────────

  test("renders the Create account heading and button", () => {
    const { getAllByText } = render(<RegisterScreen />);
    // Both the card heading and the submit button use this text
    expect(getAllByText("Create account")).toHaveLength(2);
  });

  test("renders the tagline", () => {
    const { getByText } = render(<RegisterScreen />);
    getByText("Join the community protecting our trees");
  });

  test("renders all three input fields", () => {
    const { getByPlaceholderText } = render(<RegisterScreen />);
    getByPlaceholderText(NAME_PLACEHOLDER);
    getByPlaceholderText(EMAIL_PLACEHOLDER);
    getByPlaceholderText(PASSWORD_PLACEHOLDER);
  });

  test("renders the Sign in instead link", () => {
    const { getByText } = render(<RegisterScreen />);
    getByText("Sign in instead");
  });

  test("matches snapshot", () => {
    const tree = render(<RegisterScreen />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  // ── Validation ────────────────────────────────────────────────────────

  test("shows Missing fields alert when display name is empty", () => {
    const utils = render(<RegisterScreen />);
    fireEvent.changeText(utils.getByPlaceholderText(EMAIL_PLACEHOLDER), "user@example.com");
    fireEvent.changeText(utils.getByPlaceholderText(PASSWORD_PLACEHOLDER), "password123");
    fireEvent.press(utils.getByTestId("submit-register"));
    expect(Alert.alert).toHaveBeenCalledWith("Missing fields", "Please fill in all fields.");
  });

  test("shows Missing fields alert when email is empty", () => {
    const utils = render(<RegisterScreen />);
    fireEvent.changeText(utils.getByPlaceholderText(NAME_PLACEHOLDER), "Alice");
    fireEvent.changeText(utils.getByPlaceholderText(PASSWORD_PLACEHOLDER), "password123");
    fireEvent.press(utils.getByTestId("submit-register"));
    expect(Alert.alert).toHaveBeenCalledWith("Missing fields", "Please fill in all fields.");
  });

  test("shows Missing fields alert when password is empty", () => {
    const utils = render(<RegisterScreen />);
    fireEvent.changeText(utils.getByPlaceholderText(NAME_PLACEHOLDER), "Alice");
    fireEvent.changeText(utils.getByPlaceholderText(EMAIL_PLACEHOLDER), "user@example.com");
    fireEvent.press(utils.getByTestId("submit-register"));
    expect(Alert.alert).toHaveBeenCalledWith("Missing fields", "Please fill in all fields.");
  });

  test("treats whitespace-only display name as empty", () => {
    const utils = render(<RegisterScreen />);
    fireEvent.changeText(utils.getByPlaceholderText(NAME_PLACEHOLDER), "   ");
    fireEvent.changeText(utils.getByPlaceholderText(EMAIL_PLACEHOLDER), "user@example.com");
    fireEvent.changeText(utils.getByPlaceholderText(PASSWORD_PLACEHOLDER), "password123");
    fireEvent.press(utils.getByTestId("submit-register"));
    expect(Alert.alert).toHaveBeenCalledWith("Missing fields", "Please fill in all fields.");
  });

  test("treats whitespace-only email as empty", () => {
    const utils = render(<RegisterScreen />);
    fireEvent.changeText(utils.getByPlaceholderText(NAME_PLACEHOLDER), "Alice");
    fireEvent.changeText(utils.getByPlaceholderText(EMAIL_PLACEHOLDER), "   ");
    fireEvent.changeText(utils.getByPlaceholderText(PASSWORD_PLACEHOLDER), "password123");
    fireEvent.press(utils.getByTestId("submit-register"));
    expect(Alert.alert).toHaveBeenCalledWith("Missing fields", "Please fill in all fields.");
  });

  // ── Happy path ────────────────────────────────────────────────────────

  test("calls register() with trimmed name, trimmed email, and raw password", async () => {
    mockRegister.mockResolvedValueOnce(undefined);
    const utils = render(<RegisterScreen />);
    fillAndSubmit(utils, "  Alice  ", "  user@example.com  ", "password123");
    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith("user@example.com", "password123", "Alice");
    });
  });

  test("does not show an alert on successful registration", async () => {
    mockRegister.mockResolvedValueOnce(undefined);
    const utils = render(<RegisterScreen />);
    fillAndSubmit(utils, "Alice", "user@example.com", "password123");
    await waitFor(() => expect(mockRegister).toHaveBeenCalled());
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  // ── Error handling ────────────────────────────────────────────────────

  test("shows Registration failed alert when the API returns an error", async () => {
    mockRegister.mockRejectedValueOnce(new Error("Email already in use"));
    const utils = render(<RegisterScreen />);
    fillAndSubmit(utils, "Alice", "taken@example.com", "password123");
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith("Registration failed", "Email already in use");
    });
  });

  // ── Password visibility ───────────────────────────────────────────────

  test("password field hides characters by default", () => {
    const { getByPlaceholderText } = render(<RegisterScreen />);
    const input = getByPlaceholderText(PASSWORD_PLACEHOLDER);
    expect(input.props.secureTextEntry).toBe(true);
  });

  test("pressing the eye icon reveals the password", () => {
    const { getByPlaceholderText, getByTestId } = render(<RegisterScreen />);
    const input = getByPlaceholderText(PASSWORD_PLACEHOLDER);
    expect(input.props.secureTextEntry).toBe(true);
    fireEvent.press(getByTestId("toggle-password"));
    expect(input.props.secureTextEntry).toBe(false);
  });

  test("pressing the eye icon a second time hides the password again", () => {
    const { getByPlaceholderText, getByTestId } = render(<RegisterScreen />);
    const input = getByPlaceholderText(PASSWORD_PLACEHOLDER);
    fireEvent.press(getByTestId("toggle-password"));
    fireEvent.press(getByTestId("toggle-password"));
    expect(input.props.secureTextEntry).toBe(true);
  });
});
