// Asmodeus's sanctum (level 7): a throne room with a single door, at the end
// of a long, twisting passage of black glass cut through the solid rock, with
// a few dead-end side passages to lose your way in. The passage opens through
// a crack in the wall of some room, far from the ladder down, so the walk
// from the ladder to the throne is a long one.
//
// Built as the level loads, like the other great lairs (lairs.ts), from the
// level's own seed: every save gets it, and the same one every time. Squares
// with walls on all four sides are solid rock, and a passage cut through rock
// only opens the walls along its own way, so it can run right beside a room
// without ever opening into it.

import type { CellContent, DungeonCell, Direction } from './types.js';
import { RNG } from './random.js';
import { mapAreas, areaAtCell } from './regions.js';
import { distances } from './lairs.js';

type Pt = { x: number; y: number };

export const SANCTUM = {
  SIZES: [7, 6, 5],    // the throne room is SIZE x SIZE: the largest that fits
  MIN_PASSAGE: 110,    // the passage is at least this many squares...
  MAX_PASSAGE: 170,    // ...and at most this many
  MIN_PASSAGE_FALLBACK: 60,   // a crowded level settles for this
  MAX_TREE: 1400,      // squares of rock explored while looking for a way through
  BRANCHES: 6,         // dead-end side passages
  BRANCH_DEPTH: 7,     // each at most this long
  SITES_TRIED: 6,
} as const;

export interface Sanctum {
  room: { x0: number; y0: number; x1: number; y1: number };
  door: Pt;            // the square outside the throne room's one door
  throne: Pt;          // where Asmodeus sits, against the far wall...
  facing: Direction;   // ...facing the door
  path: Pt[];          // the passage, from the crack (index 0) to the door
  branches: Pt[];      // the dead-end side passages
  mouth: Pt;           // the room square the crack opens from
}

const STEPS: [Direction, number, number][] = [['N', 0, -1], ['E', 1, 0], ['S', 0, 1], ['W', -1, 0]];
const k = (p: Pt) => `${p.x},${p.y}`;

function isRock(grid: DungeonCell[][], x: number, y: number): boolean {
  const w = grid[y]?.[x]?.walls;
  return !!w && w.N && w.E && w.S && w.W;
}

/** Open the wall between two side-by-side squares, on both sides. */
function open(grid: DungeonCell[][], a: Pt, b: Pt): void {
  const dx = b.x - a.x, dy = b.y - a.y;
  const A = grid[a.y][a.x].walls, B = grid[b.y][b.x].walls;
  if (dx === 1) { A.E = false; B.W = false; }
  else if (dx === -1) { A.W = false; B.E = false; }
  else if (dy === 1) { A.S = false; B.N = false; }
  else if (dy === -1) { A.N = false; B.S = false; }
}

/** Builds the sanctum and moves Asmodeus onto his throne. Returns null (and
 * leaves the level as it was) if he isn't on this level or there's no room. */
export function buildSanctum(grid: DungeonCell[][], entrance: Pt, contents: Map<string, CellContent>, seed: number): Sanctum | null {
  const entry = [...contents.entries()].find(([, c]) => c.type === 'unique-monster' && c.monsterId === 'Asmodeus');
  if (!entry) return null;
  const H = grid.length, W = grid[0]?.length ?? 0;
  const fromEntrance = distances(grid, entrance);
  const map = mapAreas(grid);
  const inRoom = (p: Pt) => areaAtCell(map, p.x, p.y)?.kind === 'room';

  type Site = { x0: number; y0: number; far: number };
  type Try = { site: Site; S: number; side: number; parent: Map<string, string | null>; mouthCell: Pt; mouth: Pt; score: number };
  let best = null as Try | null;
  for (const S of SANCTUM.SIZES) {
  // Sites: SxS blocks of solid rock with a ring of rock around them, farthest from the ladder first.
  const sites: Site[] = [];
  for (let y0 = 2; y0 + S + 1 < H - 1; y0++) for (let x0 = 2; x0 + S + 1 < W - 1; x0++) {
    let ok = true;
    for (let y = y0 - 1; ok && y <= y0 + S; y++) for (let x = x0 - 1; x <= x0 + S; x++) if (!isRock(grid, x, y)) { ok = false; break; }
    if (ok) sites.push({ x0, y0, far: Math.hypot(x0 + S / 2 - entrance.x, y0 + S / 2 - entrance.y) });
  }
  sites.sort((a, b) => b.far - a.far || a.y0 - b.y0 || a.x0 - b.x0);
  // Keep sites well apart from one another, so the ones tried are different places.
  const chosen: Site[] = [];
  for (const s of sites) {
    if (chosen.every(c => Math.abs(c.x0 - s.x0) + Math.abs(c.y0 - s.y0) > S * 2)) chosen.push(s);
    if (chosen.length >= SANCTUM.SITES_TRIED) break;
  }

  for (const minLen of [SANCTUM.MIN_PASSAGE, SANCTUM.MIN_PASSAGE_FALLBACK]) {
    for (const site of chosen) {
      const inside = (x: number, y: number) => x >= site.x0 - 1 && x <= site.x0 + S && y >= site.y0 - 1 && y <= site.y0 + S;
      for (let side = 0; side < 4; side++) {
        const rng = new RNG((seed ^ (site.x0 * 7919 + site.y0 * 104729 + side * 15485863)) >>> 0 || 1);
        const mid = Math.floor(S / 2);
        // The square outside the door, in the ring around the room.
        const door = [
          { x: site.x0 + mid, y: site.y0 - 1 }, { x: site.x0 + S, y: site.y0 + mid },
          { x: site.x0 + mid, y: site.y0 + S }, { x: site.x0 - 1, y: site.y0 + mid },
        ][side];
        const out = [[0, -1], [1, 0], [0, 1], [-1, 0]][side];
        const start = { x: door.x + out[0], y: door.y + out[1] };   // the passage begins just beyond it
        if (!isRock(grid, start.x, start.y) || inside(start.x, start.y)) continue;
        // A winding walk through the rock (depth first, liking to keep going a little).
        const parent = new Map<string, string | null>([[k(start), null]]);
        const depth = new Map<string, number>([[k(start), 0]]);
        const stack: { p: Pt; dir: number }[] = [{ p: start, dir: side }];
        let mouthBest: { cell: Pt; room: Pt; score: number } | null = null;
        while (stack.length && parent.size < SANCTUM.MAX_TREE) {
          const top = stack[stack.length - 1];
          const d = depth.get(k(top.p))!;
          const order = [0, 1, 2, 3].sort(() => rng.float() - 0.5);
          if (rng.float() < 0.45) order.unshift(top.dir);          // runs of two or three before turning
          let moved = false;
          for (const di of order) {
            const [, dx, dy] = STEPS[di];
            const n = { x: top.p.x + dx, y: top.p.y + dy };
            if (n.x < 1 || n.y < 1 || n.x >= W - 1 || n.y >= H - 1 || parent.has(k(n)) || inside(n.x, n.y) || !isRock(grid, n.x, n.y)) continue;
            if (d + 1 > SANCTUM.MAX_PASSAGE) continue;
            parent.set(k(n), k(top.p)); depth.set(k(n), d + 1);
            stack.push({ p: n, dir: di });
            moved = true;
            // Could the crack open here, into a room the ladder reaches?
            if (d + 1 >= minLen) for (const [, ex, ey] of STEPS) {
              const r = { x: n.x + ex, y: n.y + ey };
              const walk = fromEntrance.get(k(r))?.d;
              if (walk === undefined || !inRoom(r)) continue;
              const score = d + 1 + walk;
              if (!mouthBest || score > mouthBest.score) mouthBest = { cell: n, room: r, score };
            }
            break;
          }
          if (!moved) stack.pop();
        }
        if (mouthBest && (!best || mouthBest.score > best.score)) {
          best = { site, S, side, parent, mouthCell: mouthBest.cell, mouth: mouthBest.room, score: mouthBest.score };
        }
      }
    }
    if (best) break;
  }
  if (best) break;
  }
  if (!best) return null;

  // The throne room.
  const { site, side, parent, S } = best;
  const x0 = site.x0, y0 = site.y0, x1 = x0 + S - 1, y1 = y0 + S - 1, mid = Math.floor(S / 2);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    if (x < x1) open(grid, { x, y }, { x: x + 1, y });
    if (y < y1) open(grid, { x, y }, { x, y: y + 1 });
  }
  const inner = [{ x: x0 + mid, y: y0 }, { x: x1, y: y0 + mid }, { x: x0 + mid, y: y1 }, { x: x0, y: y0 + mid }][side];
  const door = [{ x: x0 + mid, y: y0 - 1 }, { x: x1 + 1, y: y0 + mid }, { x: x0 + mid, y: y1 + 1 }, { x: x0 - 1, y: y0 + mid }][side];
  const throne = [{ x: x0 + mid, y: y1 }, { x: x0, y: y0 + mid }, { x: x0 + mid, y: y0 }, { x: x1, y: y0 + mid }][side];   // the far wall

  // The passage: from the crack back to the door.
  const path: Pt[] = [];
  for (let c: string | null = k(best.mouthCell); c; c = parent.get(c) ?? null) {
    const [x, y] = c.split(',').map(Number);
    path.push({ x, y });
  }
  path.push(door);
  for (let i = 0; i + 1 < path.length; i++) open(grid, path[i], path[i + 1]);
  open(grid, door, inner);
  open(grid, best.mouth, path[0]);

  // Dead-end side passages: short stretches of the walk that went elsewhere.
  const onPath = new Set(path.map(k));
  const children = new Map<string, string[]>();
  for (const [c, p] of parent) if (p) children.set(p, [...(children.get(p) ?? []), c]);
  const branches: Pt[] = [];
  const rng = new RNG((seed ^ 0x5a17) >>> 0 || 1);
  const roots = path.filter((p, i) => i > 4 && i < path.length - 4 && (children.get(k(p)) ?? []).some(c => !onPath.has(c)));
  for (let b = 0; b < SANCTUM.BRANCHES && roots.length; b++) {
    const root = roots.splice(Math.floor(((b + rng.float()) / SANCTUM.BRANCHES) * roots.length) % roots.length, 1)[0];
    let at = k(root);
    for (let step = 0; step < SANCTUM.BRANCH_DEPTH; step++) {
      const next = (children.get(at) ?? []).find(c => !onPath.has(c));
      if (!next) break;
      const [ax, ay] = at.split(',').map(Number), [nx, ny] = next.split(',').map(Number);
      open(grid, { x: ax, y: ay }, { x: nx, y: ny });
      onPath.add(next);
      branches.push({ x: nx, y: ny });
      at = next;
    }
  }

  // Asmodeus, on his throne.
  contents.delete(entry[0]);
  contents.set(k(throne), entry[1]);
  const facing = (['N', 'E', 'S', 'W'] as Direction[])[side];
  return { room: { x0, y0, x1, y1 }, door, throne, facing, path, branches, mouth: best.mouth };
}
