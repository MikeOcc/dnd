// Splits a level's open floor into areas, rooms and corridors, so the game can
// describe where you are the way Adventure and Zork did ("You are in a vast
// cavern..."). Nothing here is stored: areas are worked out from the walls
// whenever a level is loaded, so every existing save gets them too.
//
// A room square is part of some fully open 2x2 block; corridors are one
// square wide, so they never are. Rooms and corridors are each split into
// connected pieces, and each piece is one area.

import type { DungeonCell } from './types.js';
import { canMove } from './dungeon.js';

export type AreaKind = 'room' | 'corridor';

export interface Area {
  id: string;          // "x,y" of its first square in reading order: stable across loads
  kind: AreaKind;
  cells: number;
  minX: number; maxX: number; minY: number; maxY: number;
  exits: number;       // openings into other areas
  junctions: number;   // corridor squares where three or more ways meet
  straight: boolean;   // a corridor that never turns
}

export interface AreaMap {
  width: number;
  areaAt: Int32Array;  // index y*width+x → index into areas, or -1 for rock
  areas: Area[];
}

const STEPS = [['N', 0, -1], ['E', 1, 0], ['S', 0, 1], ['W', -1, 0]] as const;

function isRock(c: DungeonCell): boolean {
  return c.walls.N && c.walls.E && c.walls.S && c.walls.W;
}

export function mapAreas(grid: DungeonCell[][]): AreaMap {
  const h = grid.length, w = grid[0]?.length ?? 0;
  const room = new Uint8Array(w * h);
  // Mark the squares of every fully open 2x2 block as room.
  for (let y = 0; y + 1 < h; y++) for (let x = 0; x + 1 < w; x++) {
    const tl = grid[y][x], br = grid[y + 1][x + 1];
    if (!tl.walls.E && !tl.walls.S && !br.walls.N && !br.walls.W) {
      room[y * w + x] = room[y * w + x + 1] = room[(y + 1) * w + x] = room[(y + 1) * w + x + 1] = 1;
    }
  }

  const areaAt = new Int32Array(w * h).fill(-1);
  const areas: Area[] = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    if (areaAt[i] !== -1 || isRock(grid[y][x])) continue;
    const kind: AreaKind = room[i] ? 'room' : 'corridor';
    const idx = areas.length;
    const area: Area = { id: `${x},${y}`, kind, cells: 0, minX: x, maxX: x, minY: y, maxY: y, exits: 0, junctions: 0, straight: true };
    areas.push(area);
    const stack = [[x, y]];
    areaAt[i] = idx;
    while (stack.length) {
      const [cx, cy] = stack.pop()!;
      area.cells++;
      area.minX = Math.min(area.minX, cx); area.maxX = Math.max(area.maxX, cx);
      area.minY = Math.min(area.minY, cy); area.maxY = Math.max(area.maxY, cy);
      let ways = 0;
      for (const [dir, dx, dy] of STEPS) {
        if (!canMove(grid, cx, cy, dir)) continue;
        ways++;
        const nx = cx + dx, ny = cy + dy, j = ny * w + nx;
        if ((room[j] ? 'room' : 'corridor') !== kind) continue;
        if (areaAt[j] === -1) { areaAt[j] = idx; stack.push([nx, ny]); }
      }
      if (kind === 'corridor' && ways >= 3) area.junctions++;
    }
    area.straight = kind === 'corridor' && (area.minX === area.maxX || area.minY === area.maxY);
  }

  // Openings from each area into a different one.
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const a = areaAt[y * w + x];
    if (a === -1) continue;
    for (const [dir, dx, dy] of STEPS) {
      if (!canMove(grid, x, y, dir)) continue;
      const b = areaAt[(y + dy) * w + x + dx];
      if (b !== -1 && b !== a) areas[a].exits++;
    }
  }

  return { width: w, areaAt, areas };
}

export function areaAtCell(map: AreaMap, x: number, y: number): Area | undefined {
  const i = map.areaAt[y * map.width + x];
  return i >= 0 ? map.areas[i] : undefined;
}

export type Bearing = 'ahead' | 'left' | 'right' | 'behind';
const BEARING_ORDER: Bearing[] = ['ahead', 'left', 'right', 'behind'];

/** Where the ways out of the area you're in lie, relative to the way you
 * face: in a room, its openings into other areas (several may lie the same
 * way); in a corridor, the ways you can step from this square. */
export function waysOut(grid: DungeonCell[][], map: AreaMap, x: number, y: number, facing: 'N' | 'E' | 'S' | 'W'): Bearing[] {
  const here = map.areaAt[y * map.width + x];
  if (here < 0) return [];
  // Turn a world offset into the character's frame: forward, and to the right.
  const fwd = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] }[facing];
  const bearingOf = (dx: number, dy: number): Bearing => {
    const ahead = dx * fwd[0] + dy * fwd[1];
    const right = dx * -fwd[1] + dy * fwd[0];
    if (Math.abs(ahead) >= Math.abs(right)) return ahead >= 0 ? 'ahead' : 'behind';
    return right > 0 ? 'right' : 'left';
  };
  const found: Bearing[] = [];
  if (map.areas[here].kind === 'corridor') {
    for (const [dir, dx, dy] of STEPS) if (canMove(grid, x, y, dir)) found.push(bearingOf(dx, dy));
  } else {
    const a = map.areas[here];
    for (let cy = a.minY; cy <= a.maxY; cy++) for (let cx = a.minX; cx <= a.maxX; cx++) {
      if (map.areaAt[cy * map.width + cx] !== here) continue;
      for (const [dir, dx, dy] of STEPS) {
        if (!canMove(grid, cx, cy, dir)) continue;
        const b = map.areaAt[(cy + dy) * map.width + cx + dx];
        // Measured to the middle of the opening, so a doorway beside you reads as beside you.
        if (b !== -1 && b !== here) found.push(bearingOf(cx + dx / 2 - x, cy + dy / 2 - y));
      }
    }
  }
  return found.sort((p, q) => BEARING_ORDER.indexOf(p) - BEARING_ORDER.indexOf(q));
}

/** "ahead", "two ahead and one to your left", "to your left and behind you"... */
export function bearingsPhrase(bearings: Bearing[]): string {
  const say: Record<Bearing, string> = { ahead: 'ahead', left: 'to your left', right: 'to your right', behind: 'behind you' };
  const num = ['', 'one', 'two', 'three', 'four', 'five', 'six'];
  const counts = BEARING_ORDER.map(b => [b, bearings.filter(x => x === b).length] as const).filter(([, n]) => n > 0);
  const many = counts.some(([, n]) => n > 1);
  const parts = counts.map(([b, n]) => (many ? `${num[n] ?? n} ${say[b]}` : say[b]));
  return parts.length <= 1 ? (parts[0] ?? '') : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}
