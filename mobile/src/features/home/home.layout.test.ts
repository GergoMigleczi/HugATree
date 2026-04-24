import { layoutTiles } from "./home.layout";
import type { HomeTile } from "./home.types";

const noop = () => {};

function tile(id: string, cols: 1 | 2, rows: 1 | 2): HomeTile {
  return { id, title: id, cols, rows, onPress: noop };
}

describe("layoutTiles", () => {
  it("returns empty placed array and 0 rows for no tiles", () => {
    const { placed, rowCount } = layoutTiles([]);
    expect(placed).toEqual([]);
    expect(rowCount).toBe(0);
  });

  it("places a single 1×1 tile at row 0, col 0", () => {
    const { placed } = layoutTiles([tile("a", 1, 1)]);
    expect(placed[0]).toMatchObject({ id: "a", gridRow: 0, gridCol: 0 });
  });

  it("places two 1×1 tiles side by side in the same row", () => {
    const { placed, rowCount } = layoutTiles([tile("a", 1, 1), tile("b", 1, 1)]);
    expect(placed[0]).toMatchObject({ id: "a", gridRow: 0, gridCol: 0 });
    expect(placed[1]).toMatchObject({ id: "b", gridRow: 0, gridCol: 1 });
    expect(rowCount).toBe(1);
  });

  it("wraps a third 1×1 tile to the next row", () => {
    const { placed } = layoutTiles([tile("a", 1, 1), tile("b", 1, 1), tile("c", 1, 1)]);
    expect(placed[2]).toMatchObject({ id: "c", gridRow: 1, gridCol: 0 });
  });

  it("places a full-width 2×1 tile at col 0 spanning both columns", () => {
    const { placed, rowCount } = layoutTiles([tile("wide", 2, 1)]);
    expect(placed[0]).toMatchObject({ id: "wide", gridRow: 0, gridCol: 0 });
    expect(rowCount).toBe(1);
  });

  it("pushes a 2-col tile to the next row when col 0 is occupied", () => {
    const { placed } = layoutTiles([tile("a", 1, 1), tile("wide", 2, 1)]);
    // "a" takes row 0 col 0; "wide" needs both cols so must go to row 1
    expect(placed[1]).toMatchObject({ id: "wide", gridRow: 1, gridCol: 0 });
  });

  it("places a tall 1×2 tile and blocks its column for the next row", () => {
    const { placed } = layoutTiles([tile("tall", 1, 2), tile("b", 1, 1), tile("c", 1, 1)]);
    // "tall" is at row 0 col 0 (spans rows 0-1)
    expect(placed[0]).toMatchObject({ id: "tall", gridRow: 0, gridCol: 0 });
    // "b" fits at row 0 col 1
    expect(placed[1]).toMatchObject({ id: "b", gridRow: 0, gridCol: 1 });
    // "c" cannot go at row 1 col 0 (blocked by tall), so goes row 1 col 1
    expect(placed[2]).toMatchObject({ id: "c", gridRow: 1, gridCol: 1 });
  });

  it("preserves all tile properties on placed tiles", () => {
    const t = tile("x", 1, 1);
    const { placed } = layoutTiles([t]);
    expect(placed[0]).toMatchObject({ id: "x", cols: 1, rows: 1 });
  });

  it("rowCount reflects the total grid rows used", () => {
    // 4 × 1×1 tiles → 2 rows
    const { rowCount } = layoutTiles([tile("a", 1, 1), tile("b", 1, 1), tile("c", 1, 1), tile("d", 1, 1)]);
    expect(rowCount).toBe(2);
  });
});
