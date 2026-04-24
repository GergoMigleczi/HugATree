jest.mock("../../../config/config", () => ({
  PUBLIC_WEBSITE_URL: "https://example.com/tree",
  API_URL: "https://api.example.com",
}));

import { getPublicTreeUrl } from "./getPublicTreeUrl";

describe("getPublicTreeUrl", () => {
  it("returns the full URL with the tree ID as a query parameter", () => {
    expect(getPublicTreeUrl(42)).toBe("https://example.com/tree?id=42");
  });

  it("uses the correct base URL from config", () => {
    expect(getPublicTreeUrl(1)).toMatch(/^https:\/\/example\.com\/tree/);
  });

  it("encodes different tree IDs correctly", () => {
    expect(getPublicTreeUrl(999)).toBe("https://example.com/tree?id=999");
    expect(getPublicTreeUrl(0)).toBe("https://example.com/tree?id=0");
  });
});
