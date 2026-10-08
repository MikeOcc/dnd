// Great lairs built into a level as it loads, rather than when it was first
// generated, so saves made before a lair existed get it too. The same steps
// on every load give the same result, so nothing needs writing back.
//
// The Orc King's throne room (level 4): a high-ceilinged chamber far from
// the entrance, walled up to a single doorway, with a Manticore guarding the
// door, traps on the approach and one more inside.

import type { CellContent, DungeonCell, Direction } from './types.js';
import { canMove, floodFill } from './dungeon.js';
import { mapAreas, areaAtCell, type Area } from './regions.js';

const STEPS: [Direction, number, number][] = [['N', 0, -1], ['E', 1, 0], ['S', 0, 1], ['W', -1, 0]];
const OPPOSITE: Record<Direction, Direction> = { N: 'S', S: 'N', E: 'W', W: 'E' };

export const ORC_KING_LAIR = {
  KING_ID: 'unique-orc-king',
  GUARD_ID: 'fm-4-manticore',
  TRAP_IDS: ['trap-orc-lair-1', 'trap-orc-lair-2', 'trap-orc-lair-3'],
  MIN_ROOM_CELLS: 30,   // on level 4 any room this big has a high ceiling
} as const;

type Pt = { x: number; y: number };
const key = (p: Pt) => `${p.x},${p.y}`;

/** Walking distance from `from` to every square reachable from it. */
function distances(grid: DungeonCell[][], from: Pt): Map<string, { d: number; prev: string | null }> {
  const out = new Map<string, { d: number; prev: string | null }>([[key(from), { d: 0, prev: null }]]);
  const queue = [from];
  while (queue.length) {
    const p = queue.shift()!;
    const here = out.get(key(p))!;
    for (const [dir, dx, dy] of STEPS) {
      if (!canMove(grid, p.x, p.y, dir)) continue;
      const n = { x: p.x + dx, y: p.y + dy };
      if (out.has(key(n))) continue;
      out.set(key(n), { d: here.d + 1, prev: key(p) });
      queue.push(n);
    }
  }
  return out;
}

interface Opening { inside: Pt; outside: Pt; dir: Direction }

function openingsOf(grid: DungeonCell[][], areaIndex: Int32Array, width: number, idx: number): Opening[] {
  const out: Opening[] = [];
  for (let y = 0; y < grid.length; y++) for (let x = 0; x < width; x++) {
    if (areaIndex[y * width + x] !== idx) continue;
    for (const [dir, dx, dy] of STEPS) {
      if (!canMove(grid, x, y, dir)) continue;
      if (areaIndex[(y + dy) * width + x + dx] !== idx) out.push({ inside: { x, y }, outside: { x: x + dx, y: y + dy }, dir });
    }
  }
  return out;
}

function setWall(grid: DungeonCell[][], o: Opening, closed: boolean): void {
  grid[o.inside.y][o.inside.x].walls[o.dir] = closed;
  grid[o.outside.y][o.outside.x].walls[OPPOSITE[o.dir]] = closed;
}

/** Builds the Orc King's lair into level 4. Changes `grid` (walls up all but
 * one doorway) and adds the king, his Manticore and the traps to `contents`. */
export function buildOrcKingLair(grid: DungeonCell[][], entrance: Pt, exit: Pt | null, contents: Map<string, CellContent>): void {
  if ([...contents.values()].some(c => c.id === ORC_KING_LAIR.KING_ID)) return;

  const map = mapAreas(grid);
  const width = grid[0].length;
  const reachableBefore = floodFill(grid, entrance.x, entrance.y).size;
  const fromEntrance = distances(grid, entrance);
  const touches = (a: Area, p: Pt | null) => !!p && areaAtCell(map, p.x, p.y) === a;

  // The best room: big enough for a high ceiling, without a ladder in it,
  // as far from the entrance as possible, and one that can be walled up to
  // a single doorway without cutting off any other part of the level.
  let best: { area: Area; keep: Opening; seal: Opening[]; score: number } | null = null;
  map.areas.forEach((area, idx) => {
    if (area.kind !== 'room' || area.cells < ORC_KING_LAIR.MIN_ROOM_CELLS) return;
    if (touches(area, entrance) || touches(area, exit)) return;
    const openings = openingsOf(grid, map.areaAt, width, idx);
    if (openings.length === 0) return;
    const near = Math.min(...openings.map(o => fromEntrance.get(key(o.outside))?.d ?? Infinity));
    if (!isFinite(near)) return;
    const score = near + area.cells / 10;
    if (best && score <= best.score) return;
    for (const keep of openings) {
      const seal = openings.filter(o => o !== keep);
      seal.forEach(o => setWall(grid, o, true));
      const ok = floodFill(grid, entrance.x, entrance.y).size === reachableBefore;
      seal.forEach(o => setWall(grid, o, false));
      if (ok) { best = { area, keep, seal, score }; break; }
    }
  });
  if (!best) return;
  const { area, keep, seal } = best as { area: Area; keep: Opening; seal: Opening[] };
  seal.forEach(o => setWall(grid, o, true));

  const free = (p: Pt) => !contents.has(key(p)) && !(p.x === entrance.x && p.y === entrance.y) && !(exit && p.x === exit.x && p.y === exit.y);

  // The throne: the room square farthest from the doorway.
  const fromDoor = distances(grid, keep.inside);
  let throne: Pt | null = null;
  let far = -1;
  for (const [k, { d }] of fromDoor) {
    const [x, y] = k.split(',').map(Number);
    if (areaAtCell(map, x, y) !== area || d <= far || !free({ x, y })) continue;
    throne = { x, y }; far = d;
  }
  if (!throne) return;
  contents.set(key(throne), { type: 'unique-monster', id: ORC_KING_LAIR.KING_ID, monsterId: 'Orc King' });

  // The Manticore stands in the doorway, on the passage side.
  const guard = keep.outside;
  contents.set(key(guard), { type: 'fixed-monster', id: ORC_KING_LAIR.GUARD_ID, monsterId: 'Manticore' });

  // Traps: two on the approach (walking back toward the entrance from the
  // guard), and one inside, halfway from the doorway to the throne.
  const pathFrom = (dist: Map<string, { d: number; prev: string | null }>, start: Pt): string[] => {
    const out: string[] = [];
    for (let k: string | null = key(start); k; k = dist.get(k)?.prev ?? null) out.push(k);
    return out;
  };
  const approach = pathFrom(fromEntrance, guard);          // guard → entrance
  const inside = pathFrom(fromDoor, throne).reverse();     // door → throne
  const spots: { k: string; variant: string }[] = [
    { k: approach[3], variant: 'falling-stone' },
    { k: approach[6], variant: 'alarm' },
    { k: inside[Math.floor(inside.length / 2)], variant: 'fire-blast' },
  ];
  spots.forEach(({ k, variant }, i) => {
    if (!k) return;
    const [x, y] = k.split(',').map(Number);
    if (!free({ x, y })) return;
    contents.set(k, { type: 'trap', id: ORC_KING_LAIR.TRAP_IDS[i], trapVariant: variant });
  });
}

/** Asmodeus holds court from the very middle of his chamber: on level 7, his
 * lair moves to the free square nearest the centre of the room it's in (or,
 * if it lies in a passage, of the nearest room by walking distance). */
export function centerAsmodeusLair(grid: DungeonCell[][], contents: Map<string, CellContent>): void {
  const entry = [...contents.entries()].find(([, c]) => c.type === 'unique-monster' && c.monsterId === 'Asmodeus');
  if (!entry) return;
  const [key0, lair] = entry;
  const [lx, ly] = key0.split(',').map(Number);
  const map = mapAreas(grid);
  let room = areaAtCell(map, lx, ly);
  if (room && room.kind !== 'room') {
    room = undefined;
    for (const k of distances(grid, { x: lx, y: ly }).keys()) {   // nearest first: the walk is breadth-first
      const [x, y] = k.split(',').map(Number);
      const a = areaAtCell(map, x, y);
      if (a?.kind === 'room') { room = a; break; }
    }
  }
  if (!room) return;
  const cx = (room.minX + room.maxX) / 2, cy = (room.minY + room.maxY) / 2;
  let best = key0;
  let bestD = Math.hypot(lx - cx, ly - cy);
  for (let y = room.minY; y <= room.maxY; y++) for (let x = room.minX; x <= room.maxX; x++) {
    const k = `${x},${y}`;
    if (areaAtCell(map, x, y) !== room || (contents.has(k) && k !== key0)) continue;
    const d = Math.hypot(x - cx, y - cy);
    if (d < bestD - 1e-9) { bestD = d; best = k; }
  }
  if (best === key0) return;
  contents.delete(key0);
  contents.set(best, lair);
}

// ─── The Barrow-King's barrow (level 5) ──────────────────────────────────────
// A room far from the entrance, walled up to a single doorway, the king's
// bier at its far end. Built as the level loads, like the Orc King's hall.

export const BARROW_LAIR = {
  KING_ID: 'unique-barrow-king',
  MIN_ROOM_CELLS: 12,
} as const;

export function buildBarrowKingLair(grid: DungeonCell[][], entrance: Pt, exit: Pt | null, contents: Map<string, CellContent>): void {
  if ([...contents.values()].some(c => c.id === BARROW_LAIR.KING_ID)) return;
  const map = mapAreas(grid);
  const width = grid[0].length;
  const reachableBefore = floodFill(grid, entrance.x, entrance.y).size;
  const fromEntrance = distances(grid, entrance);
  const touches = (a: Area, p: Pt | null) => !!p && areaAtCell(map, p.x, p.y) === a;
  const hasLadder = (idx: number) => [...contents.entries()].some(([k, c]) => {
    if (c.type !== 'ladder-up' && c.type !== 'ladder-down') return false;
    const [x, y] = k.split(',').map(Number);
    return map.areaAt[y * width + x] === idx;
  });

  // The farthest room that can be walled up to one doorway without cutting off anything else.
  let best: { area: Area; keep: Opening; seal: Opening[]; score: number } | null = null;
  map.areas.forEach((area, idx) => {
    if (area.kind !== 'room' || area.cells < BARROW_LAIR.MIN_ROOM_CELLS) return;
    if (touches(area, entrance) || touches(area, exit) || hasLadder(idx)) return;
    const openings = openingsOf(grid, map.areaAt, width, idx);
    if (openings.length === 0) return;
    const near = Math.min(...openings.map(o => fromEntrance.get(key(o.outside))?.d ?? Infinity));
    if (!isFinite(near)) return;
    if (best && near <= best.score) return;
    for (const keep of openings) {
      const seal = openings.filter(o => o !== keep);
      seal.forEach(o => setWall(grid, o, true));
      const ok = floodFill(grid, entrance.x, entrance.y).size === reachableBefore;
      seal.forEach(o => setWall(grid, o, false));
      if (ok) { best = { area, keep, seal, score: near }; break; }
    }
  });
  if (!best) return;
  const { area, keep, seal } = best as { area: Area; keep: Opening; seal: Opening[] };
  seal.forEach(o => setWall(grid, o, true));

  const free = (p: Pt) => !contents.has(key(p)) && !(p.x === entrance.x && p.y === entrance.y) && !(exit && p.x === exit.x && p.y === exit.y);
  // The bier: the room square farthest from the doorway.
  const fromDoor = distances(grid, keep.inside);
  let bier: Pt | null = null, far = -1;
  for (const [k, { d }] of fromDoor) {
    const [x, y] = k.split(',').map(Number);
    if (areaAtCell(map, x, y) !== area || d <= far || !free({ x, y })) continue;
    bier = { x, y }; far = d;
  }
  if (bier) contents.set(key(bier), { type: 'unique-monster', id: BARROW_LAIR.KING_ID, monsterId: 'Barrow-King' });
}

// ─── The Rakshasa (level 7) ──────────────────────────────────────────────────
// Holding court in a room of its own, well along the way but far from the
// other great foes (and from Asmodeus).

export const RAKSHASA_ID = 'unique-rakshasa';

export function placeRakshasa(grid: DungeonCell[][], entrance: Pt, exit: Pt | null, contents: Map<string, CellContent>): void {
  if ([...contents.values()].some(c => c.id === RAKSHASA_ID)) return;
  const map = mapAreas(grid);
  const fromEntrance = distances(grid, entrance);
  const others: Pt[] = [];
  for (const [k, c] of contents) if (c.type === 'unique-monster') { const [x, y] = k.split(',').map(Number); others.push({ x, y }); }
  const maxD = Math.max(...[...fromEntrance.values()].map(v => v.d));
  const free = (p: Pt) => !contents.has(key(p)) && !(p.x === entrance.x && p.y === entrance.y) && !(exit && p.x === exit.x && p.y === exit.y);
  let best: Pt | null = null, bestScore = -1;
  for (const [k, { d }] of fromEntrance) {
    if (d < maxD * 0.3 || d > maxD * 0.85) continue;            // well along the way, not at the very end
    const [x, y] = k.split(',').map(Number);
    const area = areaAtCell(map, x, y);
    if (!area || area.kind !== 'room' || area.cells < 9 || !free({ x, y })) continue;
    const apart = others.length ? Math.min(...others.map(o => Math.abs(o.x - x) + Math.abs(o.y - y))) : 99;
    if (apart > bestScore) { best = { x, y }; bestScore = apart; }
  }
  if (best) contents.set(key(best), { type: 'unique-monster', id: RAKSHASA_ID, monsterId: 'Rakshasa' });
}

// ─── The Lambton Worm (level 6) ──────────────────────────────────────────────
// Coiled on its hoard in a room far from the entrance. Nothing is walled up.

export const LAMBTON_ID = 'unique-lambton-worm';

export function placeLambtonWorm(grid: DungeonCell[][], entrance: Pt, exit: Pt | null, contents: Map<string, CellContent>): void {
  if ([...contents.values()].some(c => c.id === LAMBTON_ID)) return;
  const map = mapAreas(grid);
  const fromEntrance = distances(grid, entrance);
  const free = (p: Pt) => !contents.has(key(p)) && !(p.x === entrance.x && p.y === entrance.y) && !(exit && p.x === exit.x && p.y === exit.y);
  let best: Pt | null = null, far = -1;
  for (const [k, { d }] of fromEntrance) {
    const [x, y] = k.split(',').map(Number);
    const area = areaAtCell(map, x, y);
    if (!area || area.kind !== 'room' || area.cells < 9 || d <= far || !free({ x, y })) continue;
    best = { x, y }; far = d;
  }
  if (best) contents.set(key(best), { type: 'unique-monster', id: LAMBTON_ID, monsterId: 'Lambton Worm' });
}
