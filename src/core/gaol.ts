// The old gaol (level 5): a block of cells cut into the rock, a narrow aisle
// between two rows of them, each cell shut behind a door of iron bars. You
// can see through the bars (the views draw them; web/view3d.js) but not get
// in: the doors are locked. Old bones lie in the cells, and in some of them a
// chest no one has reached in a very long time.
//
// Built as the level loads, like the great lairs, from the level's own seed:
// every save gets it, the same one every time. Solid rock lies all round it
// (the map draws no walls, so nothing may run alongside it), and a short
// passage joins one end of the aisle to the rest of the level.

import type { CellContent, DungeonCell, Direction } from './types.js';
import { RNG } from './random.js';
import { distances } from './lairs.js';

type Pt = { x: number; y: number };

export const GAOL = {
  LEVEL: 5,
  CELLS_A_SIDE: 5,     // each 2 squares wide, 2 deep
  MAX_LINK: 8,         // squares of passage joining the aisle to the level
  CHESTS: 3,           // locked away in cells (for a lockpick, one day)
} as const;

export interface Gaol {
  aisle: Pt[];         // from the end that joins the level
  link: Pt[];          // the passage joining it
  cells: Pt[][];       // each cell's four squares
  bars: Set<string>;   // barred edges, as "x,y,D" from both sides
  bones: Pt[];         // where old bones lie
  chests: Pt[];
}

const k = (p: Pt) => `${p.x},${p.y}`;
const OPP: Record<Direction, Direction> = { N: 'S', S: 'N', E: 'W', W: 'E' };

function isRock(grid: DungeonCell[][], x: number, y: number): boolean {
  const w = grid[y]?.[x]?.walls;
  return !!w && w.N && w.E && w.S && w.W;
}

function open(grid: DungeonCell[][], a: Pt, b: Pt): void {
  const dx = b.x - a.x, dy = b.y - a.y;
  const A = grid[a.y][a.x].walls, B = grid[b.y][b.x].walls;
  if (dx === 1) { A.E = false; B.W = false; }
  else if (dx === -1) { A.W = false; B.E = false; }
  else if (dy === 1) { A.S = false; B.N = false; }
  else if (dy === -1) { A.N = false; B.S = false; }
}

/** Builds the gaol, if there's room for it (a crowded level gets a smaller
 * one); returns null (and changes nothing) if there's no room at all. */
export function buildGaol(grid: DungeonCell[][], entrance: Pt, contents: Map<string, CellContent>, seed: number): Gaol | null {
  for (let n = GAOL.CELLS_A_SIDE; n >= 3; n--) {
    const g = buildGaolOf(n, grid, entrance, contents, seed);
    if (g) return g;
  }
  return null;
}

function buildGaolOf(cellsASide: number, grid: DungeonCell[][], entrance: Pt, contents: Map<string, CellContent>, seed: number): Gaol | null {
  const H = grid.length, W = grid[0]?.length ?? 0;
  const L = cellsASide * 2;   // the aisle's length
  const fromEntrance = distances(grid, entrance);
  const rng = new RNG((seed ^ 0x6a01) >>> 0 || 1);

  // In local terms the aisle runs along u (0..L-1) at v = 0, cells at v = -2..-1 and 1..2;
  // `toXY` turns that into the grid for each of the four ways it can lie.
  type Plan = { toXY: (u: number, v: number) => Pt; end: number; out: number; link: Pt[]; join: Pt; score: number };
  let best: Plan | null = null;
  for (let y0 = 1; y0 < H - 1; y0++) for (let x0 = 1; x0 < W - 1; x0++) for (const horiz of [true, false]) {
    const toXY = horiz ? (u: number, v: number) => ({ x: x0 + u, y: y0 + v }) : (u: number, v: number) => ({ x: x0 + v, y: y0 + u });
    // The block, with a ring of rock round it.
    let ok = true;
    for (let u = -1; ok && u <= L; u++) for (let v = -3; v <= 3; v++) {
      const p = toXY(u, v);
      if (p.x < 1 || p.y < 1 || p.x >= W - 1 || p.y >= H - 1 || !isRock(grid, p.x, p.y)) { ok = false; break; }
    }
    if (!ok) continue;
    // A straight passage from one end of the aisle, rock on both sides, to the level.
    for (const end of [0, L - 1]) {
      const out = end === 0 ? -1 : 1;
      const link: Pt[] = [];
      for (let s = 1; s <= GAOL.MAX_LINK + 1; s++) {
        const p = toXY(end + out * s, 0);
        if (p.x < 1 || p.y < 1 || p.x >= W - 1 || p.y >= H - 1) break;
        if (!isRock(grid, p.x, p.y)) {
          const walk = fromEntrance.get(k(p))?.d;
          if (walk !== undefined && link.length >= 1) {
            const score = walk - link.length * 2 + rng.float();
            if (!best || score > best.score) best = { toXY, end, out, link: [...link], join: p, score };
          }
          break;
        }
        // Rock on both sides of the passage, past the block's own ring.
        const a = toXY(end + out * s, -1), b = toXY(end + out * s, 1);
        if (s > 1 && (!isRock(grid, a.x, a.y) || !isRock(grid, b.x, b.y))) break;
        link.push(p);
      }
    }
  }
  if (!best) return null;

  const { toXY, end, out, link, join } = best;
  const dirOf = (a: Pt, b: Pt): Direction => (b.x > a.x ? 'E' : b.x < a.x ? 'W' : b.y > a.y ? 'S' : 'N');
  // The aisle, from the joining end.
  const aisle: Pt[] = [];
  for (let i = 0; i < L; i++) aisle.push(toXY(end === 0 ? i : L - 1 - i, 0));
  for (let i = 0; i + 1 < aisle.length; i++) open(grid, aisle[i], aisle[i + 1]);
  // The passage to the level.
  const way = [aisle[0], ...link, join];
  for (let i = 0; i + 1 < way.length; i++) open(grid, way[i], way[i + 1]);
  void out;
  // The cells, and their barred doors (still walls: you can't walk through bars).
  const bars = new Set<string>();
  const cells: Pt[][] = [];
  for (let c = 0; c < cellsASide; c++) for (const side of [-1, 1]) {
    const sq = [toXY(c * 2, side), toXY(c * 2 + 1, side), toXY(c * 2, side * 2), toXY(c * 2 + 1, side * 2)];
    open(grid, sq[0], sq[1]); open(grid, sq[2], sq[3]); open(grid, sq[0], sq[2]); open(grid, sq[1], sq[3]);
    cells.push(sq);
    for (const door of [sq[0], sq[1]]) {
      const a = toXY(door === sq[0] ? c * 2 : c * 2 + 1, 0);
      const d = dirOf(door, a);
      bars.add(`${door.x},${door.y},${d}`);
      bars.add(`${a.x},${a.y},${OPP[d]}`);
    }
  }
  // What's in them: bones in most, a chest in a few (the far ones).
  const bones: Pt[] = [], chests: Pt[] = [];
  const order = cells.map((c, i) => ({ c, i, r: rng.float() })).sort((a, b) => a.r - b.r);
  order.forEach(({ c }, n) => {
    const back = c[2 + (n % 2)];   // a square at the back of the cell
    if (n < GAOL.CHESTS) chests.push(back);
    else if (n < cells.length - 2) bones.push(back);
  });
  chests.forEach((p, i) => contents.set(k(p), { type: 'chest', id: `gaol-chest-${i}` } as CellContent));
  return { aisle, link, cells, bars, bones, chests };
}
