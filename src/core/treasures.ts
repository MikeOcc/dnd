// Places the Zork treasure chests (content/treasures.ts) as a level loads,
// so saves made before they existed get them too. Each goes in the most
// out-of-the-way room on its level: the one with the fewest ways in,
// farthest from the entrance. The same steps on every load give the same
// result, so nothing is written back.

import type { CellContent, DungeonCell, Direction } from './types.js';
import { canMove } from './dungeon.js';
import { mapAreas, areaAtCell } from './regions.js';
import { TREASURES } from '../content/treasures.js';

export const TREASURE_CHEST_PREFIX = 'treasure-';

export function placeTreasures(
  levelNum: number, grid: DungeonCell[][], entrance: { x: number; y: number }, exit: { x: number; y: number } | null,
  contents: Map<string, CellContent>,
): void {
  const here = TREASURES.filter(t => t.level === levelNum);
  if (here.length === 0) return;
  const map = mapAreas(grid);

  // Walking distance from the entrance.
  const dist = new Map<string, number>([[`${entrance.x},${entrance.y}`, 0]]);
  const queue = [entrance];
  const steps: [Direction, number, number][] = [['N', 0, -1], ['E', 1, 0], ['S', 0, 1], ['W', -1, 0]];
  while (queue.length) {
    const p = queue.shift()!;
    const d = dist.get(`${p.x},${p.y}`)!;
    for (const [dir, dx, dy] of steps) {
      if (!canMove(grid, p.x, p.y, dir)) continue;
      const k = `${p.x + dx},${p.y + dy}`;
      if (dist.has(k)) continue;
      dist.set(k, d + 1);
      queue.push({ x: p.x + dx, y: p.y + dy });
    }
  }

  const used = new Set<string>();
  for (const t of here) {
    const id = TREASURE_CHEST_PREFIX + t.id;
    if ([...contents.values()].some(c => c.id === id)) continue;
    let best: string | null = null;
    let bestScore = -Infinity;
    for (const [k, d] of dist) {
      if (contents.has(k) || used.has(k)) continue;
      const [x, y] = k.split(',').map(Number);
      if ((x === entrance.x && y === entrance.y) || (exit && x === exit.x && y === exit.y)) continue;
      const area = areaAtCell(map, x, y);
      if (area?.kind !== 'room') continue;
      // Fewest ways in first, then farthest away.
      const score = d - area.exits * 40;
      if (score > bestScore) { bestScore = score; best = k; }
    }
    if (!best) continue;
    used.add(best);
    contents.set(best, { type: 'chest', id, treasure: t.id });
  }
}
