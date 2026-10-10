// Which district of the seventh level each room and corridor belongs to
// (content/district-text.ts). Near the ladder down: the Ash Plain. Near the
// crack that opens on the Long Way: the Court of the Throne. The Long Way
// itself, and the throne room at its end. Everything else is shared out
// among the Forges, the Frozen Lake, the Hall of Pacts and the Cages by which
// way it lies from the middle of the level, turned by the level's seed so no
// two saves agree.

import type { DungeonCell } from './types.js';
import type { AreaMap } from './regions.js';
import type { Sanctum } from './sanctum.js';
import type { DistrictId } from '../content/district-text.js';
import { distances } from './lairs.js';

export const DISTRICT_REACH = {
  ASH: 18,     // squares' walk from the ladder down
  COURT: 16,   // squares' walk from the crack
} as const;

const OUTER: DistrictId[] = ['forges', 'frozen', 'pacts', 'cages'];

/** The district of every area (by its index in the area map). */
export function assignDistricts(grid: DungeonCell[][], areas: AreaMap, entrance: { x: number; y: number }, sanctum: Sanctum | null, seed: number): DistrictId[] {
  const H = grid.length, W = grid[0]?.length ?? 0;
  const fromLadder = distances(grid, entrance);
  const fromCrack = sanctum ? distances(grid, sanctum.mouth) : null;
  const way = new Set(sanctum ? [...sanctum.path, ...sanctum.branches].map(p => `${p.x},${p.y}`) : []);
  const near = areas.areas.map(() => ({ ladder: Infinity, crack: Infinity, way: false, throne: false, sx: 0, sy: 0, n: 0 }));
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = areas.areaAt[y * W + x];
    if (i < 0) continue;
    const a = near[i], key = `${x},${y}`;
    a.ladder = Math.min(a.ladder, fromLadder.get(key)?.d ?? Infinity);
    a.crack = Math.min(a.crack, fromCrack?.get(key)?.d ?? Infinity);
    if (way.has(key)) a.way = true;
    if (sanctum && x >= sanctum.room.x0 && x <= sanctum.room.x1 && y >= sanctum.room.y0 && y <= sanctum.room.y1) a.throne = true;
    a.sx += x; a.sy += y; a.n++;
  }
  const turn = ((seed >>> 0) % 360) * Math.PI / 180;
  return near.map(a => {
    if (a.throne) return 'throne';
    if (a.way) return 'approach';
    if (a.ladder <= DISTRICT_REACH.ASH) return 'ash';
    if (a.crack <= DISTRICT_REACH.COURT) return 'court';
    const angle = Math.atan2(a.sy / a.n - H / 2, a.sx / a.n - W / 2) + turn;
    const share = ((angle / (2 * Math.PI)) % 1 + 1) % 1;
    return OUTER[Math.floor(share * OUTER.length) % OUTER.length];
  });
}
