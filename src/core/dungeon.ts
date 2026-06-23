import { RNG } from './random.js';
import { DUNGEON, CONTENT_PER_LEVEL } from './config.js';
import type { SerializedDungeon, DungeonCell, WallEdges, CellContent, MonsterType } from './types.js';
import {
  LEVEL_FIXED_MONSTERS, LEVEL_UNIQUE_MONSTERS, trapVariants, descriptionIds,
} from './dungeon-data.js';

// ─── Internal BSP types ─────────────────────────────────────────────────────

interface Room {
  x: number; y: number;
  w: number; h: number;
}

interface BSPNode {
  x: number; y: number;
  w: number; h: number;
  left?: BSPNode;
  right?: BSPNode;
  room?: Room;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function emptyGrid(width: number, height: number): DungeonCell[][] {
  const grid: DungeonCell[][] = [];
  for (let y = 0; y < height; y++) {
    grid[y] = [];
    for (let x = 0; x < width; x++) {
      grid[y][x] = { x, y, walls: { N: true, E: true, S: true, W: true } };
    }
  }
  return grid;
}

function carveH(grid: DungeonCell[][], x: number, y: number): void {
  // Remove wall between (x,y) and (x+1,y)
  if (x < 0 || x + 1 >= grid[0].length || y < 0 || y >= grid.length) return;
  grid[y][x].walls.E = false;
  grid[y][x + 1].walls.W = false;
}

function carveV(grid: DungeonCell[][], x: number, y: number): void {
  // Remove wall between (x,y) and (x,y+1)
  if (x < 0 || x >= grid[0].length || y < 0 || y + 1 >= grid.length) return;
  grid[y][x].walls.S = false;
  grid[y + 1][x].walls.N = false;
}

function carveRoom(grid: DungeonCell[][], room: Room): void {
  for (let y = room.y; y < room.y + room.h; y++) {
    for (let x = room.x; x < room.x + room.w; x++) {
      if (x + 1 < room.x + room.w) carveH(grid, x, y);
      if (y + 1 < room.y + room.h) carveV(grid, x, y);
    }
  }
}

function roomCenter(room: Room): { x: number; y: number } {
  return {
    x: Math.floor(room.x + room.w / 2),
    y: Math.floor(room.y + room.h / 2),
  };
}

// L-shaped corridor between two points
function carveCorridor(grid: DungeonCell[][], from: { x: number; y: number }, to: { x: number; y: number }, rng: RNG): void {
  const bendH = rng.bool();
  if (bendH) {
    // Move horizontally first, then vertically
    const dx = to.x > from.x ? 1 : -1;
    for (let x = from.x; x !== to.x; x += dx) {
      carveH(grid, dx > 0 ? x : x - 1, from.y);
    }
    const dy = to.y > from.y ? 1 : -1;
    for (let y = from.y; y !== to.y; y += dy) {
      carveV(grid, to.x, dy > 0 ? y : y - 1);
    }
  } else {
    // Move vertically first, then horizontally
    const dy = to.y > from.y ? 1 : -1;
    for (let y = from.y; y !== to.y; y += dy) {
      carveV(grid, from.x, dy > 0 ? y : y - 1);
    }
    const dx = to.x > from.x ? 1 : -1;
    for (let x = from.x; x !== to.x; x += dx) {
      carveH(grid, dx > 0 ? x : x - 1, to.y);
    }
  }
}

// ─── BSP ────────────────────────────────────────────────────────────────────

function buildBSP(rng: RNG, x: number, y: number, w: number, h: number, depth: number): BSPNode {
  const node: BSPNode = { x, y, w, h };
  const minSize = DUNGEON.BSP_MIN_ROOM;

  if (depth >= DUNGEON.BSP_MAX_DEPTH || (w < minSize * 2 + 3 && h < minSize * 2 + 3)) {
    // Leaf: create room
    const rw = rng.int(minSize, Math.max(minSize, w - 2));
    const rh = rng.int(minSize, Math.max(minSize, h - 2));
    const rx = x + 1 + rng.int(0, Math.max(0, w - rw - 2));
    const ry = y + 1 + rng.int(0, Math.max(0, h - rh - 2));
    node.room = { x: rx, y: ry, w: rw, h: rh };
    return node;
  }

  const canSplitH = h >= minSize * 2 + 3;
  const canSplitV = w >= minSize * 2 + 3;
  const splitV = canSplitV && (!canSplitH || rng.bool());

  if (splitV) {
    const splitX = x + rng.int(minSize + 1, w - minSize - 1);
    node.left  = buildBSP(rng, x, y, splitX - x, h, depth + 1);
    node.right = buildBSP(rng, splitX, y, w - (splitX - x), h, depth + 1);
  } else {
    const splitY = y + rng.int(minSize + 1, h - minSize - 1);
    node.left  = buildBSP(rng, x, y, w, splitY - y, depth + 1);
    node.right = buildBSP(rng, x, splitY, w, h - (splitY - y), depth + 1);
  }

  return node;
}

function collectRooms(node: BSPNode): Room[] {
  if (node.room) return [node.room];
  const rooms: Room[] = [];
  if (node.left)  rooms.push(...collectRooms(node.left));
  if (node.right) rooms.push(...collectRooms(node.right));
  return rooms;
}

function connectBSP(node: BSPNode, grid: DungeonCell[][], rng: RNG): void {
  if (!node.left || !node.right) return;
  connectBSP(node.left, grid, rng);
  connectBSP(node.right, grid, rng);

  const leftRooms  = collectRooms(node.left);
  const rightRooms = collectRooms(node.right);
  const from = roomCenter(rng.pick(leftRooms));
  const to   = roomCenter(rng.pick(rightRooms));
  carveCorridor(grid, from, to, rng);
}

// ─── Flood fill for reachability ────────────────────────────────────────────

export function floodFill(grid: DungeonCell[][], startX: number, startY: number): Set<string> {
  const visited = new Set<string>();
  const queue: [number, number][] = [[startX, startY]];
  const h = grid.length;
  const w = grid[0].length;

  while (queue.length) {
    const [x, y] = queue.shift()!;
    const key = `${x},${y}`;
    if (visited.has(key)) continue;
    visited.add(key);

    const cell = grid[y][x];
    if (!cell.walls.N && y > 0)     queue.push([x, y - 1]);
    if (!cell.walls.S && y < h - 1) queue.push([x, y + 1]);
    if (!cell.walls.W && x > 0)     queue.push([x - 1, y]);
    if (!cell.walls.E && x < w - 1) queue.push([x + 1, y]);
  }

  return visited;
}

function isReachable(grid: DungeonCell[][], startX: number, startY: number, tx: number, ty: number): boolean {
  return floodFill(grid, startX, startY).has(`${tx},${ty}`);
}

// ─── Content placement ───────────────────────────────────────────────────────

type ContentMap = Map<string, CellContent>;

function key(x: number, y: number): string { return `${x},${y}`; }

function placeSingle(
  contents: ContentMap, rooms: Room[], rng: RNG,
  type: CellContent['type'], id: string,
  exclude: Set<string>,
  monsterId?: string, descriptionId?: string, trapVariant?: string,
): { x: number; y: number } | null {
  const cells: { x: number; y: number }[] = [];
  for (const room of rooms) {
    for (let cy = room.y; cy < room.y + room.h; cy++) {
      for (let cx = room.x; cx < room.x + room.w; cx++) {
        const k = key(cx, cy);
        if (!contents.has(k) && !exclude.has(k)) {
          cells.push({ x: cx, y: cy });
        }
      }
    }
  }
  if (cells.length === 0) return null;
  const pos = rng.pick(cells);
  const content: CellContent = { type, id };
  if (monsterId)    content.monsterId = monsterId;
  if (descriptionId) content.descriptionId = descriptionId;
  if (trapVariant)  content.trapVariant = trapVariant;
  contents.set(key(pos.x, pos.y), content);
  return pos;
}

function placeContent(
  grid: DungeonCell[][],
  rooms: Room[],
  levelNum: number,
  entrance: { x: number; y: number },
  exit: { x: number; y: number } | null,
  rng: RNG,
): ContentMap {
  const contents: ContentMap = new Map();
  const exclude = new Set<string>();

  // Entrance
  contents.set(key(entrance.x, entrance.y), { type: 'entrance', id: 'entrance' });
  exclude.add(key(entrance.x, entrance.y));

  // Ladder up (except level 1)
  if (levelNum > 1) {
    contents.set(key(entrance.x, entrance.y), { type: 'ladder-up', id: 'ladder-up' });
  }

  // Ladder down (except level 7)
  if (exit && levelNum < 7) {
    contents.set(key(exit.x, exit.y), { type: 'ladder-down', id: 'ladder-down' });
    exclude.add(key(exit.x, exit.y));
  }

  // Fixed monsters for this level
  const fixedMonsters = LEVEL_FIXED_MONSTERS[levelNum] ?? [];
  for (const fm of fixedMonsters) {
    placeSingle(contents, rooms, rng, 'fixed-monster', fm.id, exclude, fm.type);
  }

  // Unique monsters for this level
  const uniqueMonsters = LEVEL_UNIQUE_MONSTERS[levelNum] ?? [];
  for (const um of uniqueMonsters) {
    if (levelNum === 7 && um.type === 'Asmodeus') {
      // Asmodeus goes near center
      const bx = DUNGEON.BOSS_X;
      const by = DUNGEON.BOSS_Y;
      // Find closest reachable cell to center
      let best: { x: number; y: number } | null = null;
      let bestDist = Infinity;
      const reachable = floodFill(grid, entrance.x, entrance.y);
      for (const k of reachable) {
        if (contents.has(k) || exclude.has(k)) continue;
        const [cx, cy] = k.split(',').map(Number);
        const dist = Math.abs(cx - bx) + Math.abs(cy - by);
        if (dist < bestDist) { bestDist = dist; best = { x: cx, y: cy }; }
      }
      if (best) {
        contents.set(key(best.x, best.y), { type: 'unique-monster', id: um.id, monsterId: um.type });
        exclude.add(key(best.x, best.y));
      }
    } else {
      placeSingle(contents, rooms, rng, 'unique-monster', um.id, exclude, um.type);
    }
  }

  const count = (min: number, max: number) => rng.int(min, max);

  // Chests
  const chestCount = count(CONTENT_PER_LEVEL.CHESTS_MIN, CONTENT_PER_LEVEL.CHESTS_MAX);
  for (let i = 0; i < chestCount; i++) {
    placeSingle(contents, rooms, rng, 'chest', `chest-${levelNum}-${i}`, exclude);
  }

  // Books
  const bookCount = count(CONTENT_PER_LEVEL.BOOKS_MIN, CONTENT_PER_LEVEL.BOOKS_MAX);
  for (let i = 0; i < bookCount; i++) {
    placeSingle(contents, rooms, rng, 'book', `book-${levelNum}-${i}`, exclude);
  }

  // Altars
  const altarCount = count(CONTENT_PER_LEVEL.ALTARS_MIN, CONTENT_PER_LEVEL.ALTARS_MAX);
  for (let i = 0; i < altarCount; i++) {
    placeSingle(contents, rooms, rng, 'altar', `altar-${levelNum}-${i}`, exclude);
  }

  // Fountains
  const fountainCount = count(CONTENT_PER_LEVEL.FOUNTAINS_MIN, CONTENT_PER_LEVEL.FOUNTAINS_MAX);
  for (let i = 0; i < fountainCount; i++) {
    placeSingle(contents, rooms, rng, 'fountain', `fountain-${levelNum}-${i}`, exclude);
  }

  // Traps (placed anywhere in reachable cells, not just rooms)
  const trapCount = count(CONTENT_PER_LEVEL.TRAPS_MIN, CONTENT_PER_LEVEL.TRAPS_MAX);
  const reachable = [...floodFill(grid, entrance.x, entrance.y)].filter(k => !contents.has(k) && !exclude.has(k));
  rng.shuffle(reachable);
  for (let i = 0; i < Math.min(trapCount, reachable.length); i++) {
    const k = reachable[i];
    const [tx, ty] = k.split(',').map(Number);
    const variant = rng.pick(trapVariants);
    contents.set(k, { type: 'trap', id: `trap-${levelNum}-${i}`, trapVariant: variant });
  }

  // Descriptions — use up to DESCRIPTIONS_MAX cells
  const descCount = count(CONTENT_PER_LEVEL.DESCRIPTIONS_MIN, CONTENT_PER_LEVEL.DESCRIPTIONS_MAX);
  const reachable2 = [...floodFill(grid, entrance.x, entrance.y)].filter(k => !contents.has(k) && !exclude.has(k));
  rng.shuffle(reachable2);
  const levelDescs = descriptionIds[levelNum] ?? descriptionIds[1];
  for (let i = 0; i < Math.min(descCount, reachable2.length); i++) {
    const k = reachable2[i];
    const [dx, dy] = k.split(',').map(Number);
    const descId = rng.pick(levelDescs);
    contents.set(k, { type: 'description', id: `desc-${levelNum}-${dx}-${dy}`, descriptionId: descId });
  }

  return contents;
}

// ─── Main generator ──────────────────────────────────────────────────────────

export function generateLevel(levelNum: number, seed: number): SerializedDungeon {
  const rng = new RNG(seed);
  const width = DUNGEON.WIDTH;
  const height = DUNGEON.HEIGHT;

  const grid = emptyGrid(width, height);
  const bspRoot = buildBSP(rng, 1, 1, width - 2, height - 2, 0);
  const rooms = collectRooms(bspRoot);

  // Carve all rooms
  for (const room of rooms) {
    carveRoom(grid, room);
  }

  // Connect rooms via BSP tree
  connectBSP(bspRoot, grid, rng);

  // Add extra loop corridors
  for (let i = 0; i < DUNGEON.EXTRA_LOOPS; i++) {
    const r1 = rng.pick(rooms);
    const r2 = rng.pick(rooms);
    if (r1 !== r2) {
      carveCorridor(grid, roomCenter(r1), roomCenter(r2), rng);
    }
  }

  // Entrance = first room center, exit = last room center
  const sortedRooms = [...rooms].sort((a, b) => {
    const da = Math.abs(a.x) + Math.abs(a.y);
    const db = Math.abs(b.x) + Math.abs(b.y);
    return da - db;
  });

  const entrance = roomCenter(sortedRooms[0]);
  const exit = levelNum < 7 ? roomCenter(sortedRooms[sortedRooms.length - 1]) : null;

  // Verify reachability
  const reachableSet = floodFill(grid, entrance.x, entrance.y);
  const reachableCount = reachableSet.size;

  // If we didn't hit minimum, add more corridors
  if (reachableCount < DUNGEON.MIN_REACHABLE) {
    for (let i = 0; i < 20; i++) {
      const r1 = rng.pick(rooms);
      const r2 = rng.pick(rooms);
      carveCorridor(grid, roomCenter(r1), roomCenter(r2), rng);
    }
  }

  const contents = placeContent(grid, rooms, levelNum, entrance, exit, rng);

  // Serialize
  const serialized: SerializedDungeon = {
    levelNumber: levelNum,
    width,
    height,
    cells: grid,
    entrance,
    exit,
    contents: [...contents.entries()].map(([k, v]) => ({ key: k, value: v })),
    seed,
  };

  return serialized;
}

export function deserializeLevel(data: SerializedDungeon): {
  grid: DungeonCell[][];
  entrance: { x: number; y: number };
  exit: { x: number; y: number } | null;
  contents: Map<string, CellContent>;
} {
  return {
    grid: data.cells,
    entrance: data.entrance,
    exit: data.exit,
    contents: new Map(data.contents.map(e => [e.key, e.value])),
  };
}

export function getCell(grid: DungeonCell[][], x: number, y: number): DungeonCell | null {
  if (y < 0 || y >= grid.length || x < 0 || x >= grid[0].length) return null;
  return grid[y][x];
}

export function canMove(grid: DungeonCell[][], fromX: number, fromY: number, dir: import('./types.js').Direction): boolean {
  const cell = getCell(grid, fromX, fromY);
  if (!cell) return false;
  if (dir === 'N') return !cell.walls.N;
  if (dir === 'S') return !cell.walls.S;
  if (dir === 'E') return !cell.walls.E;
  if (dir === 'W') return !cell.walls.W;
  return false;
}
