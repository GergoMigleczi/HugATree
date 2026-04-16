// SCRUM-41 — Login screen tests.
// Covers rendering, validation, happy path, API errors, password toggle, and snapshot.

import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";

// Mocks 

const mockLogin = jest.fn();
const mockWithLoading = jest.fn((fn: () => Promise<unknown>) => fn());

jest.mock("@/src/features/auth/AuthProvider", () => ({
  useAuth: () => ({
    login: mockLogin,
    user: null,
    isLoggedIn: false,
    loading: false,
    logout: jest.fn(),
    register: jest.fn(),
    refreshUser: jest.fn(),
  }),
}));

jest.mock("@/src/ui/loading/LoadingProvider", () => ({
  useLoading: () => ({
    withLoading: mockWithLoading,
  }),
}));

// expo-router Link — render children as-is so "Create an account" text is reachable
jest.mock("expo-router", () => ({
  Link: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// SafeAreaView — replace with a plain View so no native module is required
jest.mock("react-native-safe-area-context", () => {
  const { View } = require("react-native");
  return { SafeAreaView: View };
});

// Alert — spy on the native Alert so we can assert without native UI
jest.spyOn(Alert, "alert");

// Subject under test (imported AFTER mocks)

import LoginScreen from "@/app/(auth)/login";

// Helpers

const EMAIL_PLACEHOLDER = "you@example.com";
const PASSWORD_PLACEHOLDER = "At least 8 characters";

function fillAndSubmit(
  utils: ReturnType<typeof render>,
  email: string,
  password: string
) {
  fireEvent.changeText(utils.getByPlaceholderText(EMAIL_PLACEHOLDER), email);
  fireEvent.changeText(
    utils.getByPlaceholderText(PASSWORD_PLACEHOLDER),
    password
  );
  fireEvent.press(utils.getByText("Sign in"));
}

// Tests 

describe("<LoginScreen />", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Rendering 

  test("[AC-1] renders the Welcome back heading", () => {
    const { getByText } = render(<LoginScreen />);
    getByText("Welcome back");
  });

  test("[AC-1] renders the tagline", () => {
    const { getByText } = render(<LoginScreen />);
    getByText("Track, protect & celebrate trees");
  });

  test("[AC-2] renders email and password input fields", () => {
    const { getByPlaceholderText } = render(<LoginScreen />);
    getByPlaceholderText(EMAIL_PLACEHOLDER);
    getByPlaceholderText(PASSWORD_PLACEHOLDER);
  });

  test("[AC-11] renders the Create an account button", () => {
    const { getByText } = render(<LoginScreen />);
    getByText("Create an account");
  });

  test("[AC-12] matches snapshot", () => {
    const tree = render(<LoginScreen />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  // Validation 

  test("[AC-5] shows Missing fields alert when email is empty", () => {
    const { getByText } = render(<LoginScreen />);
    fireEvent.press(getByText("Sign in"));
    expect(Alert.alert).toHaveBeenCalledWith(
      "Missing fields",
      "Please enter your email and password."
    );
  });

  test("[AC-6] shows Missing fields alert when password is empty", () => {
    const utils = render(<LoginScreen />);
    fireEvent.changeText(
      utils.getByPlaceholderText(EMAIL_PLACEHOLDER),
      "user@example.com"
    );
    fireEvent.press(utils.getByText("Sign in"));
    expect(Alert.alert).toHaveBeenCalledWith(
      "Missing fields",
      "Please enter your email and password."
    );
  });

  test("[AC-8] treats whitespace-only email as empty", () => {
    const utils = render(<LoginScreen />);
    fireEvent.changeText(
      utils.getByPlaceholderText(EMAIL_PLACEHOLDER),
      "   "
    );
    fireEvent.changeText(
      utils.getByPlaceholderText(PASSWORD_PLACEHOLDER),
      "password123"
    );
    fireEvent.press(utils.getByText("Sign in"));
    expect(Alert.alert).toHaveBeenCalledWith(
      "Missing fields",
      "Please enter your email and password."
    );
  });

  // Happy path

  test("[AC-3] calls login() with trimmed email and raw password", async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    const utils = render(<LoginScreen />);
    fillAndSubmit(utils, "  user@example.com  ", "password123");
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("user@example.com", "password123");
    });
  });

  test("[AC-4] does not show an alert on successful login", async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    const utils = render(<LoginScreen />);
    fillAndSubmit(utils, "user@example.com", "password123");
    await waitFor(() => expect(mockLogin).toHaveBeenCalled());
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  // Error handling

  test("[AC-7] shows Login failed alert when the API returns an error", async () => {
    mockLogin.mockRejectedValueOnce(new Error("Invalid credentials"));
    const utils = render(<LoginScreen />);
    fillAndSubmit(utils, "user@example.com", "wrongpassword");
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Login failed",
        "Invalid credentials"
      );
    });
  });

  // Password visibility

  test("[AC-9] password field hides characters by default", () => {
    const { getByPlaceholderText } = render(<LoginScreen />);
    const input = getByPlaceholderText(PASSWORD_PLACEHOLDER);
    expect(input.props.secureTextEntry).toBe(true);
  });

  test("[AC-10] pressing the eye icon reveals the password", () => {
    const { getByPlaceholderText, getByTestId } = render(<LoginScreen />);
    const input = getByPlaceholderText(PASSWORD_PLACEHOLDER);
    expect(input.props.secureTextEntry).toBe(true);
    fireEvent.press(getByTestId("toggle-password"));
    expect(input.props.secureTextEntry).toBe(false);
  });

  test("[AC-10] pressing the eye icon a second time hides the password again", () => {
    const { getByPlaceholderText, getByTestId } = render(<LoginScreen />);
    const input = getByPlaceholderText(PASSWORD_PLACEHOLDER);
    fireEvent.press(getByTestId("toggle-password"));
    fireEvent.press(getByTestId("toggle-password"));
    expect(input.props.secureTextEntry).toBe(true);
  });
});
