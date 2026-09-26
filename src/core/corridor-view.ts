import type { DungeonCell, Direction } from './types.js';

// ─── Direction math ──────────────────────────────────────────────────────────
//
// Shares the same facing/left/right convention as field-of-view.ts's
// FORWARD/RIGHT tables: e.g. facing North, "right" is dungeon-East.

const FORWARD: Record<Direction, [number, number]> = {
  N: [0, -1],
  E: [1, 0],
  S: [0, 1],
  W: [-1, 0],
};

const LEFT_OF: Record<Direction, Direction> = { N: 'W', E: 'N', S: 'E', W: 'S' };
const RIGHT_OF: Record<Direction, Direction> = { N: 'E', E: 'S', S: 'W', W: 'N' };

// ─── Corridor scan ────────────────────────────────────────────────────────────
//
// Walks forward, cell by cell, from the player's position along their facing
// direction. For each visible depth it records whether that cell has a wall
// on its left/right side (relative to facing). It stops as soon as a wall
// blocks further forward movement (endCapped: true) or the view-distance
// limit is reached with the corridor still open (endCapped: false).

export interface CorridorStep {
  leftWall: boolean;
  rightWall: boolean;
}

export interface CorridorScan {
  steps: CorridorStep[];
  endCapped: boolean;
}

export function scanCorridor(
  grid: DungeonCell[][],
  playerX: number,
  playerY: number,
  facing: Direction,
  maxDepth: number,
): CorridorScan {
  const [fx, fy] = FORWARD[facing];
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

    steps.push({ leftWall: cell.walls[leftDir], rightWall: cell.walls[rightDir] });

    if (cell.walls[facing]) {
      endCapped = true;
      break;
    }

    cx += fx;
    cy += fy;
    if (!grid[cy]?.[cx]) {
      endCapped = true;
      break;
    }
  }

  return { steps, endCapped };
}

// ─── Perspective rendering ─────────────────────────────────────────────────
//
// Draws `steps.length` nested rectangles ("frames"), each one representing
// the corridor's ceiling/floor/walls at that depth. Frames shrink toward the
// center using a perspective-style decay so nearby sections are larger and
// distant ones progressively shrink toward the vanishing point. Consecutive
// frames are joined at their corners by diagonal lines. A side edge is only
// drawn when that depth's cell actually has a wall there — an open side is
// left blank, which is also the hook a later pass can use to draw doors,
// intersections, or side passages instead.

export interface CorridorViewOptions {
  width?: number;
  height?: number;
  maxDepth?: number;
}

export const CORRIDOR_VIEW_DEFAULTS = {
  WIDTH: 53,
  HEIGHT: 17,
  MAX_DEPTH: 5,
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
): string[] {
  const width = options.width ?? CORRIDOR_VIEW_DEFAULTS.WIDTH;
  const height = options.height ?? CORRIDOR_VIEW_DEFAULTS.HEIGHT;
  const maxDepth = options.maxDepth ?? CORRIDOR_VIEW_DEFAULTS.MAX_DEPTH;

  const scan = scanCorridor(grid, playerX, playerY, facing, maxDepth);
  const chars: string[][] = Array.from({ length: height }, () => Array(width).fill(' '));

  const n = Math.max(scan.steps.length, 1);
  const frames = computeFrames(width, height, n, CORRIDOR_VIEW_DEFAULTS.DECAY);

  for (let i = 0; i < frames.length; i++) {
    const f = frames[i];
    const step = scan.steps[i];

    // Ceiling / floor — always drawn; this game has no separate vertical data.
    for (let c = f.left; c <= f.right; c++) {
      chars[f.top][c] = '-';
      chars[f.bottom][c] = '-';
    }

    // Side walls — only where that depth's cell actually has one.
    if (!step || step.leftWall) {
      for (let r = f.top; r <= f.bottom; r++) chars[r][f.left] = '|';
    }
    if (!step || step.rightWall) {
      for (let r = f.top; r <= f.bottom; r++) chars[r][f.right] = '|';
    }

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

  const last = frames[frames.length - 1];
  if (scan.endCapped) {
    fillDeadEnd(chars, last);
  } else {
    // Corridor continues past the render distance — a hint of darkness ahead.
    chars[Math.floor(height / 2)][Math.floor(width / 2)] = '*';
  }

  return chars.map(row => row.join(''));
}
