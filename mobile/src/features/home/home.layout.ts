import type { HomeTile } from "./home.types";

export type PlacedTile = HomeTile & {
  gridRow: number; // 0-based
  gridCol: 0 | 1;  // 0-based
};

function canPlace(occ: boolean[][], r: number, c: number, rows: number, cols: number) {
  for (let rr = r; rr < r + rows; rr++) {
    for (let cc = c; cc < c + cols; cc++) {
      if (cc > 1) return false;                 // only 2 columns
      if (occ[rr]?.[cc]) return false;          // already occupied
    }
  }
  return true;
}

function mark(occ: boolean[][], r: number, c: number, rows: number, cols: number) {
  for (let rr = r; rr < r + rows; rr++) {
    if (!occ[rr]) occ[rr] = [false, false];
    for (let cc = c; cc < c + cols; cc++) {
      occ[rr][cc] = true;
    }
  }
}

export function layoutTiles(tiles: HomeTile[]): { placed: PlacedTile[]; rowCount: number } {
  const occ: boolean[][] = []; // occ[row][col]
  const placed: PlacedTile[] = [];

  for (const t of tiles) {
    // find first spot it fits
    let r = 0;
    while (true) {
      if (!occ[r]) occ[r] = [false, false];

      // if tile spans 2 cols, it can only start at col 0
      const colStarts: (0 | 1)[] = t.cols === 2 ? [0] : [0, 1];

      let didPlace = false;
      for (const c of colStarts) {
        if (canPlace(occ, r, c, t.rows, t.cols)) {
          mark(occ, r, c, t.rows, t.cols);
          placed.push({ ...t, gridRow: r, gridCol: c });
          didPlace = true;
          break;
        }
      }

      if (didPlace) break;
      r++;
    }
  }

  // compute total rows used
  const rowCount = occ.length;
  return { placed, rowCount };
}