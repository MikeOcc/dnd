// Curved spaces, on the levels that have them. The dungeon stays a grid of
// squares underneath (you still move square by square), but some walls are
// drawn as curves:
//
//  - A square walled on exactly two neighbouring sides (a passage's bend, a
//    room's corner) has those two walls drawn as one quarter-circle instead:
//    a circle of radius one square, centred on the square's opposite corner.
//    The painted view (web/view3d.js) draws the curve; the map draws ╭╮╰╯.
//  - Rooms are trimmed to the ellipse that fits inside them, so their edges
//    step round, and the curved corners make the steps a smooth curve.
//
// On the Caverns of Teeth and the Hells everything curves; elsewhere about a
// quarter of the rooms and passages do, chosen per level so a save always
// has the same ones. Both are worked out as the level loads, so every save
// gets them.

import type { Area } from './regions.js';

import type { CellContent, DungeonCell } from './types.js';
import { mapAreas } from './regions.js';
import { floodFill } from './dungeon.js';

/** The levels where every room and passage curves: the Caverns of Teeth and the Hells. */
export const CURVED_LEVELS = [4, 7];
/** Elsewhere, this share of rooms and passages curve. */
export const CURVED_SHARE = 0.25;

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Whether a room or passage curves. Keyed by its outline's middle, which
 * rounding a room leaves where it was. */
export function curvedArea(level: number, area: Area | undefined | null): boolean {
  if (CURVED_LEVELS.includes(level)) return true;
  if (!area) return false;
  return hash(`${level}:${area.minX + area.maxX},${area.minY + area.maxY}`) % 1000 < CURVED_SHARE * 1000;
}

export type Corner = 'NE' | 'SE' | 'SW' | 'NW';
/** How a curved square travels in the scene sent to the painted view: 0 for none. */
export const CORNER_CODE: Record<Corner, number> = { NE: 1, SE: 2, SW: 3, NW: 4 };
/** And on the map. */
export const CORNER_GLYPH: Record<Corner, string> = { NE: '╮', SE: '╯', SW: '╰', NW: '╭' };

const isRock = (c: DungeonCell | undefined) => !c || (c.walls.N && c.walls.E && c.walls.S && c.walls.W);

/** The corner of a square drawn as a curve, if it is one: walled on exactly
 * two neighbouring sides, in a room or passage that curves. */
export function curvedCorner(level: number, cell: DungeonCell | undefined, area?: Area | null): Corner | null {
  if (!cell || isRock(cell) || !curvedArea(level, area)) return null;
  const { N, E, S, W } = cell.walls;
  if (N && E && !S && !W) return 'NE';
  if (S && E && !N && !W) return 'SE';
  if (S && W && !N && !E) return 'SW';
  if (N && W && !S && !E) return 'NW';
  return null;
}

type Pt = { x: number; y: number };
const ROUND_MIN = 5;   // rooms at least this many squares each way are rounded

/** Trims each big enough room to the ellipse inside it: the squares outside
 * become solid rock. A room is left square if trimming it would take away a
 * doorway, anything lying in it, the ladder, or any way through the level. */
export function roundRooms(grid: DungeonCell[][], contents: Map<string, CellContent>, keep: (Pt | null)[], level: number): void {
  const H = grid.length, W = grid[0]?.length ?? 0;
  const map = mapAreas(grid);
  const kept = new Set(keep.filter((p): p is Pt => !!p).map(p => `${p.x},${p.y}`));
  const start = keep.find((p): p is Pt => !!p);
  map.areas.forEach((area, idx) => {
    if (area.kind !== 'room' || !curvedArea(level, area)) return;
    const w = area.maxX - area.minX + 1, h = area.maxY - area.minY + 1;
    if (w < ROUND_MIN || h < ROUND_MIN || area.cells !== w * h) return;   // rectangles only
    const cx = area.minX + w / 2, cy = area.minY + h / 2, rx = w / 2, ry = h / 2;
    const out: Pt[] = [];
    for (let y = area.minY; y <= area.maxY; y++) for (let x = area.minX; x <= area.maxX; x++) {
      const ex = (x + 0.5 - cx) / rx, ey = (y + 0.5 - cy) / ry;
      if (ex * ex + ey * ey <= 1.0) continue;
      const k = `${x},${y}`;
      if (contents.has(k) || kept.has(k)) return;            // something here: leave the room be
      // A doorway: an opening to a square that isn't this room.
      const c = grid[y][x];
      for (const [d, dx, dy] of [['N', 0, -1], ['E', 1, 0], ['S', 0, 1], ['W', -1, 0]] as const) {
        if (!c.walls[d] && map.areaAt[(y + dy) * W + (x + dx)] !== idx) return;
      }
      out.push({ x, y });
    }
    if (!out.length) return;
    const before = start ? floodFill(grid, start.x, start.y).size : 0;
    const saved = out.map(p => ({ p, walls: { ...grid[p.y][p.x].walls }, near: [[0, -1, 'S'], [1, 0, 'W'], [0, 1, 'N'], [-1, 0, 'E']].map(([dx, dy, side]) => ({ x: p.x + (dx as number), y: p.y + (dy as number), side: side as 'N' | 'E' | 'S' | 'W', was: grid[p.y + (dy as number)]?.[p.x + (dx as number)]?.walls[side as 'N' | 'E' | 'S' | 'W'] })) }));
    for (const { p } of saved) toRock(grid, p, H, W);
    // Nothing else may be cut off.
    if (start && floodFill(grid, start.x, start.y).size !== before - out.length) {
      for (const s of saved) {
        grid[s.p.y][s.p.x].walls = s.walls;
        for (const n of s.near) if (n.was !== undefined) grid[n.y][n.x].walls[n.side] = n.was;
      }
    }
  });
}

function toRock(grid: DungeonCell[][], p: Pt, H: number, W: number): void {
  const c = grid[p.y][p.x].walls;
  c.N = c.E = c.S = c.W = true;
  if (p.y > 0) grid[p.y - 1][p.x].walls.S = true;
  if (p.x < W - 1) grid[p.y][p.x + 1].walls.W = true;
  if (p.y < H - 1) grid[p.y + 1][p.x].walls.N = true;
  if (p.x > 0) grid[p.y][p.x - 1].walls.E = true;
}
