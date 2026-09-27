import type { DungeonCell, Direction } from './types.js';

// ─── Direction helpers ────────────────────────────────────────────────────────
//
// Translate player position + facing direction into map coordinates and
// map-relative edges. Nothing here touches dungeon generation or game
// state — it only reads whatever DungeonCell grid and (x, y, facing) it's
// given, matching field-of-view.ts's FORWARD/RIGHT convention: e.g. facing
// North, "right" is dungeon-East.

const FORWARD: Record<Direction, [number, number]> = {
  N: [0, -1],
  E: [1, 0],
  S: [0, 1],
  W: [-1, 0],
};

const LEFT_OF: Record<Direction, Direction> = { N: 'W', E: 'N', S: 'E', W: 'S' };
const RIGHT_OF: Record<Direction, Direction> = { N: 'E', E: 'S', S: 'W', W: 'N' };

/** The map cell one step forward of (x,y) given a facing direction. */
export function stepForward(x: number, y: number, facing: Direction): { x: number; y: number } {
  const [dx, dy] = FORWARD[facing];
  return { x: x + dx, y: y + dy };
}

export interface WallState {
  left: boolean;
  right: boolean;
  front: boolean;
}

/** Resolves a cell's raw N/E/S/W walls into left/right/front relative to
 * facing. Exported independently of the edge-type pipeline below, since
 * plain wall/no-wall is often all a caller needs. */
export function getWallState(cell: DungeonCell, facing: Direction): WallState {
  return {
    left: cell.walls[LEFT_OF[facing]],
    right: cell.walls[RIGHT_OF[facing]],
    front: cell.walls[facing],
  };
}

// ─── Edge model ───────────────────────────────────────────────────────────────
//
// The dungeon's own data model (DungeonCell.walls) only distinguishes
// "wall" from "open" — there's no door or secret concept in it, and this
// module deliberately doesn't add one there (dungeon generation, movement,
// collision, and save/load are all out of scope for the renderer).
// Instead, an EdgeType is resolved per boundary at scan time: an optional
// EdgeInfoLookup can classify any boundary as a door or secret wall;
// anything it doesn't cover falls back to the existing wall boolean. With
// no lookup supplied (today's only real caller, game-engine.ts) every
// boundary resolves to exactly 'wall' or 'passage' — identical to the
// original wall-only behavior.

export type EdgeType =
  | 'wall'
  | 'passage'
  | 'door-closed'
  | 'door-open'
  | 'door-locked'
  | 'secret';

/** Looks up the semantic type of the boundary at (x,y) facing `dir`. Return
 * undefined (or omit the lookup entirely) to fall back to the plain wall
 * boolean — the honest default until a real door/secret data source exists.
 * When wired to one, integrate with the game's existing discovery/mapping
 * rules yourself: a 'secret' edge should only ever be resolved to something
 * else by the lookup once the game considers it discovered — this module
 * never reveals anything on its own. */
export type EdgeInfoLookup = (x: number, y: number, dir: Direction) => EdgeType | undefined;

/** A blocking edge stops both forward visibility (the scan) and looks
 * solid; a secret wall is deliberately included here — it must be
 * indistinguishable from 'wall' until whatever discovers it stops
 * reporting it as 'secret'. */
export function isBlockingEdge(edge: EdgeType): boolean {
  return edge === 'wall' || edge === 'secret' || edge === 'door-closed' || edge === 'door-locked';
}

function resolveEdge(
  cell: DungeonCell,
  dir: Direction,
  x: number,
  y: number,
  lookup: EdgeInfoLookup | undefined,
): EdgeType {
  const custom = lookup?.(x, y, dir);
  if (custom) return custom;
  return cell.walls[dir] ? 'wall' : 'passage';
}

// ─── Visibility scan ──────────────────────────────────────────────────────────
//
// Walks forward, cell by cell, from the player's position along their
// facing direction — "what can the player see, and how far." At each depth
// it resolves the left/right/front EdgeType and classifies what kind of
// geometry that depth represents (straight run, side passage, crossroads,
// dead end, turn, or T-junction — doors count as their open/blocking
// equivalent for this topology classification; the raw EdgeType on each
// step carries the door/secret detail). It stops as soon as a blocking edge
// (wall, secret, or a closed/locked door) ends forward sight (endCapped:
// true) or the view-distance limit is reached with the corridor still open
// (endCapped: false) — so it never looks past something it couldn't
// logically see through, and it never touches dungeon generation, only
// reads DungeonCell.walls plus whatever the caller's lookup reports.

export type StepKind =
  | 'straight'       // forward open, both sides blocked
  | 'left-passage'   // forward open, left side open
  | 'right-passage'  // forward open, right side open
  | 'crossroads'     // forward open, both sides open
  | 'dead-end'       // forward blocked, both sides blocked
  | 'turn-left'      // forward blocked, only left open
  | 'turn-right'     // forward blocked, only right open
  | 't-junction';    // forward blocked, both sides open

export interface CorridorStep {
  /** Dungeon coordinates of the cell this depth represents — lets a caller
   * correlate a visible depth back to real map content (ladders, items,
   * monsters) without this module needing to know anything about content. */
  x: number;
  y: number;
  left: EdgeType;
  right: EdgeType;
  front: EdgeType;
  kind: StepKind;
}

export interface CorridorScan {
  steps: CorridorStep[];
  endCapped: boolean;
}

function classifyStep(left: EdgeType, right: EdgeType, front: EdgeType): StepKind {
  const leftOpen = !isBlockingEdge(left);
  const rightOpen = !isBlockingEdge(right);

  if (!isBlockingEdge(front)) {
    if (!leftOpen && !rightOpen) return 'straight';
    if (leftOpen && !rightOpen) return 'left-passage';
    if (!leftOpen && rightOpen) return 'right-passage';
    return 'crossroads';
  }
  if (!leftOpen && !rightOpen) return 'dead-end';
  if (leftOpen && !rightOpen) return 'turn-left';
  if (!leftOpen && rightOpen) return 'turn-right';
  return 't-junction';
}

export function scanCorridor(
  grid: DungeonCell[][],
  playerX: number,
  playerY: number,
  facing: Direction,
  maxDepth: number,
  edgeLookup?: EdgeInfoLookup,
): CorridorScan {
  const leftDir = LEFT_OF[facing];
  const rightDir = RIGHT_OF[facing];

  const steps: CorridorStep[] = [];
  let cx = playerX;
  let cy = playerY;
  let endCapped = false;

  for (let depth = 0; depth < maxDepth; depth++) {
    const cell = grid[cy]?.[cx];
    if (!cell) {
      endCapped = true;
      break;
    }

    const left = resolveEdge(cell, leftDir, cx, cy, edgeLookup);
    const right = resolveEdge(cell, rightDir, cx, cy, edgeLookup);
    const front = resolveEdge(cell, facing, cx, cy, edgeLookup);

    steps.push({ x: cx, y: cy, left, right, front, kind: classifyStep(left, right, front) });

    if (isBlockingEdge(front)) {
      endCapped = true;
      break;
    }

    const next = stepForward(cx, cy, facing);
    if (!grid[next.y]?.[next.x]) {
      endCapped = true;
      break;
    }
    cx = next.x;
    cy = next.y;
  }

  return { steps, endCapped };
}
