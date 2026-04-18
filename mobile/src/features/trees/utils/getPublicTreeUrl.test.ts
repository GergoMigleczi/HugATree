jest.mock("../../../config/config", () => ({
  PUBLIC_WEBSITE_URL: "https://example.com/tree",
  API_URL: "https://api.example.com",
}));

import { getPublicTreeUrl } from "./getPublicTreeUrl";

describe("getPublicTreeUrl", () => {
  it("returns a string containing ?id=<treeId>", () => {
    const url = getPublicTreeUrl(42);

    expect(url).toContain("?id=42");
  });

});
