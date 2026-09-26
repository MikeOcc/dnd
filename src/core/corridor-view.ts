import type { DungeonCell, Direction } from './types.js';

// ─── Direction helpers ────────────────────────────────────────────────────────
//
// Shares the same facing/left/right convention as field-of-view.ts's
// FORWARD/RIGHT tables: e.g. facing North, "right" is dungeon-East.
// These are the "convert player-relative directions into map coordinates"
// helpers requirement 11 asks for.

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

/** Resolves a cell's raw N/E/S/W walls into left/right/front relative to facing. */
export function getWallState(cell: DungeonCell, facing: Direction): WallState {
  return {
    left: cell.walls[LEFT_OF[facing]],
    right: cell.walls[RIGHT_OF[facing]],
    front: cell.walls[facing],
  };
}

// ─── Corridor scan ────────────────────────────────────────────────────────────
//
// Walks forward, cell by cell, from the player's position along their facing
// direction — "determining tiles visible ahead" (requirement 11). At each
// depth it records the left/right/front wall state, classifies what kind of
// geometry that depth represents (straight run, side passage, crossroads,
// dead end, turn, or T-junction), and whether an open side happens to have a
// door. It stops as soon as a wall blocks further forward movement
// (endCapped: true) or the view-distance limit is reached with the corridor
// still open (endCapped: false) — so it never looks past a wall it couldn't
// logically see through (requirement 7), and it never touches dungeon
// generation, only reads DungeonCell.walls (requirements 8/9).

export type StepKind =
  | 'straight'       // forward open, both sides walled
  | 'left-passage'   // forward open, left side open
  | 'right-passage'  // forward open, right side open
  | 'crossroads'     // forward open, both sides open
  | 'dead-end'       // forward blocked, both sides walled
  | 'turn-left'      // forward blocked, only left open
  | 'turn-right'     // forward blocked, only right open
  | 't-junction';    // forward blocked, both sides open

/**
 * Looks up whether the wall boundary at (x,y) facing `dir` has a door.
 * The dungeon data model has no door concept yet (walls are a plain N/E/S/W
 * boolean — a door doesn't change walkability, only how an *open* boundary
 * is drawn), so this is only ever consulted for sides that are already open.
 * Wire a real lookup here once door data exists; omitting it means "no doors",
 * which is also the honest default given today's data.
 */
export type DoorLookup = (x: number, y: number, dir: Direction) => boolean;

export interface CorridorStep {
  leftWall: boolean;
  rightWall: boolean;
  forwardWall: boolean;
  leftDoor: boolean;
  rightDoor: boolean;
  kind: StepKind;
}

export interface CorridorScan {
  steps: CorridorStep[];
  endCapped: boolean;
}

function classifyStep(wall: WallState): StepKind {
  if (!wall.front) {
    if (wall.left && wall.right) return 'straight';
    if (!wall.left && wall.right) return 'left-passage';
    if (wall.left && !wall.right) return 'right-passage';
    return 'crossroads';
  }
  if (wall.left && wall.right) return 'dead-end';
  if (!wall.left && wall.right) return 'turn-left';
  if (wall.left && !wall.right) return 'turn-right';
  return 't-junction';
}

export function scanCorridor(
  grid: DungeonCell[][],
  playerX: number,
  playerY: number,
  facing: Direction,
  maxDepth: number,
  doorLookup?: DoorLookup,
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

    const wall = getWallState(cell, facing);
    steps.push({
      leftWall: wall.left,
      rightWall: wall.right,
      forwardWall: wall.front,
      leftDoor: !wall.left && (doorLookup?.(cx, cy, leftDir) ?? false),
      rightDoor: !wall.right && (doorLookup?.(cx, cy, rightDir) ?? false),
      kind: classifyStep(wall),
    });

    if (wall.front) {
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

// ─── Perspective rendering ─────────────────────────────────────────────────
//
// Draws `steps.length` nested rectangles ("frames"), each one representing
// the corridor's ceiling/floor/walls at that depth. Frames shrink toward the
// center using a perspective-style decay so nearby sections are larger
// (requirement 1) and distant ones progressively shrink toward the vanishing
// point (requirement 2). Consecutive frames are joined at their corners by
// diagonal lines. A side wall is only drawn solid where that depth's cell
// actually has one; an open side interrupts it with a gap (requirement 3),
// which reads distinctly from a solid dead-end wall (requirement 5) and,
// because nearer frames are largest, an opening right beside the player is
// the most visually prominent thing on screen (requirement 6). A capped
// frame whose sides are also open renders as a wall directly ahead *plus*
// gaps on whichever sides are open, so a T-junction reads differently from a
// plain dead end or a single turn (requirement 4) without any special-cased
// drawing per StepKind — it falls straight out of the wall/gap primitives.

export interface CorridorViewOptions {
  width?: number;
  height?: number;
  maxDepth?: number;
}

export const CORRIDOR_VIEW_DEFAULTS = {
  WIDTH: 53,
  HEIGHT: 17,
  MAX_DEPTH: 5, // "approximately 4 to 6 visible depth levels"
  // Perspective decay: scale(i) = 1 / (1 + DECAY * i)
  DECAY: 0.45,
} as const;

interface Frame {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

function computeFrames(width: number, height: number, count: number, decay: number): Frame[] {
  const cx = Math.floor(width / 2);
  const cy = Math.floor(height / 2);
  const maxHalfW = cx;
  const maxHalfH = cy;

  const frames: Frame[] = [];
  let prevHalfW = maxHalfW + 1;
  let prevHalfH = maxHalfH + 1;

  for (let i = 0; i < count; i++) {
    const scale = 1 / (1 + decay * i);
    let halfW = Math.round(maxHalfW * scale);
    let halfH = Math.round(maxHalfH * scale);
    // Force strict monotonic shrink so every frame is visually distinct,
    // and never collapse to nothing.
    halfW = Math.max(1, Math.min(halfW, prevHalfW - 1));
    halfH = Math.max(1, Math.min(halfH, prevHalfH - 1));
    frames.push({ top: cy - halfH, bottom: cy + halfH, left: cx - halfW, right: cx + halfW });
    prevHalfW = halfW;
    prevHalfH = halfH;
  }

  return frames;
}

function drawDiagonal(
  chars: string[][],
  r0: number, c0: number,
  r1: number, c1: number,
  ch: string,
): void {
  const steps = Math.max(Math.abs(r1 - r0), Math.abs(c1 - c0), 1);
  for (let s = 1; s < steps; s++) {
    const t = s / steps;
    const r = Math.round(r0 + (r1 - r0) * t);
    const c = Math.round(c0 + (c1 - c0) * t);
    if (chars[r]?.[c] === ' ') chars[r][c] = ch;
  }
}

/** Draws one side edge of a frame: solid if walled, a short lipped gap if
 * open (optionally marked with a door glyph) — the per-depth-level drawing
 * helper requirement 11 asks for, applied to a single side. */
function drawSideEdge(
  chars: string[][],
  f: Frame,
  col: number,
  hasWall: boolean,
  hasDoor: boolean,
  doorGlyph: string,
): void {
  if (hasWall) {
    for (let r = f.top; r <= f.bottom; r++) chars[r][col] = '|';
    return;
  }
  // Open side: leave a gap, but keep short corner lips so the frame still
  // reads as a rectangle with a doorway cut into it rather than a missing
  // edge. Tiny distant frames without room for lips are left fully open.
  if (f.bottom - f.top >= 4) {
    chars[f.top + 1][col] = '|';
    chars[f.bottom - 1][col] = '|';
  }
  if (hasDoor) {
    const midRow = Math.round((f.top + f.bottom) / 2);
    chars[midRow][col] = doorGlyph;
  }
}

/** Draws a single perspective depth-level: ceiling/floor, both side edges
 * (walled, open, or doored), corners, and the diagonal joins back to the
 * previous (nearer) frame. This is the "rendering each perspective depth
 * level" helper requirement 11 asks for. */
function drawFrame(
  chars: string[][],
  frames: Frame[],
  i: number,
  step: CorridorStep | undefined,
): void {
  const f = frames[i];

  for (let c = f.left; c <= f.right; c++) {
    chars[f.top][c] = '-';
    chars[f.bottom][c] = '-';
  }

  drawSideEdge(chars, f, f.left, !step || step.leftWall, step?.leftDoor ?? false, '[');
  drawSideEdge(chars, f, f.right, !step || step.rightWall, step?.rightDoor ?? false, ']');

  chars[f.top][f.left] = '+';
  chars[f.top][f.right] = '+';
  chars[f.bottom][f.left] = '+';
  chars[f.bottom][f.right] = '+';

  if (i > 0) {
    const prev = frames[i - 1];
    drawDiagonal(chars, prev.top, prev.left, f.top, f.left, '\\');
    drawDiagonal(chars, prev.top, prev.right, f.top, f.right, '/');
    drawDiagonal(chars, prev.bottom, prev.left, f.bottom, f.left, '/');
    drawDiagonal(chars, prev.bottom, prev.right, f.bottom, f.right, '\\');
  }
}

function fillDeadEnd(chars: string[][], f: Frame): void {
  for (let r = f.top + 1; r < f.bottom; r++) {
    for (let c = f.left + 1; c < f.right; c++) {
      chars[r][c] = (r + c) % 2 === 0 ? '=' : '-';
    }
  }
}

export function renderCorridorView(
  grid: DungeonCell[][],
  playerX: number,
  playerY: number,
  facing: Direction,
  options: CorridorViewOptions = {},
  doorLookup?: DoorLookup,
): string[] {
  const width = options.width ?? CORRIDOR_VIEW_DEFAULTS.WIDTH;
  const height = options.height ?? CORRIDOR_VIEW_DEFAULTS.HEIGHT;
  const maxDepth = options.maxDepth ?? CORRIDOR_VIEW_DEFAULTS.MAX_DEPTH;

  const scan = scanCorridor(grid, playerX, playerY, facing, maxDepth, doorLookup);
  const chars: string[][] = Array.from({ length: height }, () => Array(width).fill(' '));

  const n = Math.max(scan.steps.length, 1);
  const frames = computeFrames(width, height, n, CORRIDOR_VIEW_DEFAULTS.DECAY);

  for (let i = 0; i < frames.length; i++) {
    drawFrame(chars, frames, i, scan.steps[i]);
  }

  const last = frames[frames.length - 1];
  if (scan.endCapped) {
    // A wall directly ahead. If the final step also has open sides, the
    // gaps drawn by drawFrame() already read as a turn/T-junction; this
    // just adds the "wall right in front of you" texture on top.
    fillDeadEnd(chars, last);
  } else {
    // Corridor continues past the render distance — a hint of darkness ahead.
    chars[Math.floor(height / 2)][Math.floor(width / 2)] = '*';
  }

  return chars.map(row => row.join(''));
}
