import { regionToBbox } from "./map.functions";

describe("regionToBbox", () => {
  it("returns the correct bbox for a normal region", () => {
    const result = regionToBbox({
      latitude: 10,
      longitude: 20,
      latitudeDelta: 4,
      longitudeDelta: 6,
    });

    expect(result).toEqual({
      minLat: 8,
      maxLat: 12,
      minLng: 17,
      maxLng: 23,
    });
  });

  it("clamps minLat to -90 when region extends past the south pole", () => {
    const result = regionToBbox({
      latitude: -88,
      longitude: 0,
      latitudeDelta: 10,
      longitudeDelta: 2,
    });

    expect(result.minLat).toBe(-90);
  });

  it("clamps maxLat to 90 when region extends past the north pole", () => {
    const result = regionToBbox({
      latitude: 88,
      longitude: 0,
      latitudeDelta: 10,
      longitudeDelta: 2,
    });

    expect(result.maxLat).toBe(90);
  });

  it("clamps minLng to -180 when region extends past the west antimeridian", () => {
    const result = regionToBbox({
      latitude: 0,
      longitude: -178,
      latitudeDelta: 2,
      longitudeDelta: 10,
    });

    expect(result.minLng).toBe(-180);
  });

  it("clamps maxLng to 180 when region extends past the east antimeridian", () => {
    const result = regionToBbox({
      latitude: 0,
      longitude: 178,
      latitudeDelta: 2,
      longitudeDelta: 10,
    });

    expect(result.maxLng).toBe(180);
  });
});
