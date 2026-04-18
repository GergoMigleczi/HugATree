import { buildDetailsPayload, EMPTY_DETAILS } from "./observations.types";
import type { TreeDetailsFormData } from "./observations.types";

describe("buildDetailsPayload", () => {
  it("returns undefined when all fields are empty strings", () => {
    expect(buildDetailsPayload(EMPTY_DETAILS)).toBeUndefined();
  });

  it.each([
    ["probableAgeYears", "42", 42],
    ["heightM", "12.5", 12.5],
    ["trunkDiameterCm", "30.2", 30.2],
    ["diameterHeightCm", "1.3", 1.3],
    ["canopyDiameterM", "8.0", 8.0],
  ] as const)("parses %s to a number", (field, input, expected) => {
    const result = buildDetailsPayload({ ...EMPTY_DETAILS, [field]: input });

    expect(result).toBeDefined();
    expect(result![field as keyof typeof result]).toBe(expected);
  });

  it("passes through string fields unchanged", () => {
    const result = buildDetailsPayload({
      ...EMPTY_DETAILS,
      ageBasis: "ring count",
      heightMethod: "laser",
      diameterMethod: "tape",
      canopyDensity: "dense",
    });

    expect(result).toBeDefined();
    expect(result!.ageBasis).toBe("ring count");
    expect(result!.heightMethod).toBe("laser");
    expect(result!.diameterMethod).toBe("tape");
    expect(result!.canopyDensity).toBe("dense");
  });

  it("only includes fields that were filled in", () => {
    const result = buildDetailsPayload({ ...EMPTY_DETAILS, heightM: "5.0" });

    expect(result).toEqual({ heightM: 5.0 });
  });

  it("handles a fully filled form", () => {
    const full: TreeDetailsFormData = {
      probableAgeYears: "100",
      ageBasis: "estimate",
      heightM: "20.0",
      heightMethod: "clinometer",
      trunkDiameterCm: "50.5",
      diameterHeightCm: "1.3",
      diameterMethod: "tape",
      canopyDiameterM: "10.0",
      canopyDensity: "sparse",
    };

    expect(buildDetailsPayload(full)).toEqual({
      probableAgeYears: 100,
      ageBasis: "estimate",
      heightM: 20.0,
      heightMethod: "clinometer",
      trunkDiameterCm: 50.5,
      diameterHeightCm: 1.3,
      diameterMethod: "tape",
      canopyDiameterM: 10.0,
      canopyDensity: "sparse",
    });
  });
});
