import type { DungeonCell, Direction } from './types.js';

// ─── Direction helpers ────────────────────────────────────────────────────────
//
// Shares the same facing/left/right convention as field-of-view.ts's
// FORWARD/RIGHT tables: e.g. facing North, "right" is dungeon-East.
// These are the "convert player-relative directions into map coordinates"
// helpers requirement 5 asks for.

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
 * facing — "translate map directions into player-relative directions"
 * (requirement 5). Still exported/used independently of the edge-type
 * pipeline below, since plain wall/no-wall is often all a caller needs. */
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
// module deliberately doesn't add one there (requirement 9: don't touch
// dungeon generation, movement, collision, or save/load). Instead, an
// EdgeType is resolved per boundary at render time: an optional
// EdgeInfoLookup can classify any boundary as a door or secret wall;
// anything it doesn't cover falls back to the existing wall boolean. With
// no lookup supplied (today's only real caller, game-engine.ts) every
// boundary resolves to exactly 'wall' or 'passage' — identical to the
// previous behavior.

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
 * rules yourself (requirement 7): a 'secret' edge should only ever be
 * resolved to something else by the lookup once the game considers it
 * discovered — this module never reveals anything on its own. */
export type EdgeInfoLookup = (x: number, y: number, dir: Direction) => EdgeType | undefined;

/** A blocking edge stops both movement-of-sight (the scan) and looks solid;
 * a secret wall is deliberately included here — it must be indistinguishable
 * from 'wall' until whatever discovers it stops reporting it as 'secret'. */
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

// ─── Corridor scan ────────────────────────────────────────────────────────────
//
// Walks forward, cell by cell, from the player's position along their facing
// direction — "determining tiles visible ahead" (requirement 5/11 from the
// earlier pass). At each depth it resolves the left/right/front EdgeType and
// classifies what kind of geometry that depth represents (straight run, side
// passage, crossroads, dead end, turn, or T-junction — doors count as their
// open/blocking equivalent for this topology classification; the raw
// EdgeType on each step carries the door/secret detail). It stops as soon as
// a blocking edge (wall, secret, or a closed/locked door) ends forward sight
// (endCapped: true) or the view-distance limit is reached with the corridor
// still open (endCapped: false) — so it never looks past something it
// couldn't logically see through (requirement 7), and it never touches
// dungeon generation, only reads DungeonCell.walls plus whatever the caller's
// lookup reports (requirements 8/9).

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

    steps.push({ left, right, front, kind: classifyStep(left, right, front) });

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

// ─── Perspective rendering ─────────────────────────────────────────────────
//
// Draws `steps.length` nested rectangles ("frames"), each one representing
// the corridor's ceiling/floor/walls at that depth. Frames shrink toward the
// center using a perspective-style decay so nearby sections are larger and
// distant ones progressively shrink toward the vanishing point. Consecutive
// frames are joined at their corners by diagonal lines.
//
// Visual language per EdgeType, applied identically at every depth:
//  - wall / secret:    solid side edge, or (if it's what ends the scan) the
//                       full dead-end wall texture. Indistinguishable from
//                       each other, by design.
//  - passage:          the wall is broken open — a gap with short corner
//                       lips so it still reads as a cut rectangle, plus a
//                       couple of short interior marks suggesting the mouth
//                       of another corridor receding away to the side.
//  - door-open:        same gap as a passage, but one lip is drawn as a
//                       bracket instead of a bar — the door leaf, swung open
//                       flat against the frame.
//  - door-closed/locked: the opening is filled edge-to-edge with a bracket —
//                       a panel woven into the wall geometry itself, not a
//                       floating label — and, if it's what ends the scan
//                       (a closed door blocks sight beyond it), the far wall
//                       gets an inset rectangular door frame instead of the
//                       plain dead-end texture.

export interface CorridorViewOptions {
  width?: number;
  height?: number;
  maxDepth?: number;
}

export const CORRIDOR_VIEW_DEFAULTS = {
  WIDTH: 79,
  HEIGHT: 25,
  MAX_DEPTH: 6, // "approximately 4 to 6 visible depth levels"
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

/** Draws one side edge of a frame per its EdgeType — the per-depth-level
 * drawing helper (requirement 11 from the earlier pass), applied to a
 * single side: solid wall/secret, a bracket-filled door panel, or an open
 * gap (plain passage or open door) with a short perspective hint of the
 * corridor beyond it. */
function drawSideEdge(
  chars: string[][],
  f: Frame,
  col: number,
  edge: EdgeType,
  side: 'left' | 'right',
): void {
  if (edge === 'wall' || edge === 'secret') {
    for (let r = f.top; r <= f.bottom; r++) chars[r][col] = '|';
    return;
  }

  const bracket = side === 'left' ? '[' : ']';

  if (edge === 'door-closed' || edge === 'door-locked') {
    // The panel fills the whole opening edge-to-edge — a door woven into
    // the wall geometry, not a gap with a label dropped into it.
    for (let r = f.top; r <= f.bottom; r++) chars[r][col] = bracket;
    return;
  }

  // 'passage' or 'door-open': the wall is broken open. Short corner lips
  // keep it reading as a cut rectangle rather than a missing edge; tiny
  // distant frames without room for lips are left fully open.
  const hasRoom = f.bottom - f.top >= 4;
  if (hasRoom) {
    // An open door keeps one lip as a bracket — the leaf, swung back flat
    // against the frame — while a plain passage keeps both as bare bars.
    chars[f.top + 1][col] = edge === 'door-open' ? bracket : '|';
    chars[f.bottom - 1][col] = '|';
  }

  // A short interior hint suggesting the mouth of another corridor
  // receding away from this opening, per requirement 1 ("if possible, add
  // a few short perspective lines inside the opening").
  const midRow = Math.round((f.top + f.bottom) / 2);
  const outward = side === 'left' ? -1 : 1;
  for (let step = 2; step <= 3; step++) {
    const c = col + outward * step;
    if (chars[midRow]?.[c] === ' ') chars[midRow][c] = '-';
  }
}

/** Draws a single perspective depth-level: ceiling/floor, both side edges,
 * corners, and the diagonal joins back to the previous (nearer) frame. This
 * is the "rendering each perspective depth level" helper (requirement 11
 * from the earlier pass). */
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

  drawSideEdge(chars, f, f.left, step?.left ?? 'wall', 'left');
  drawSideEdge(chars, f, f.right, step?.right ?? 'wall', 'right');

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

function fillWallTexture(chars: string[][], f: Frame): void {
  for (let r = f.top + 1; r < f.bottom; r++) {
    for (let c = f.left + 1; c < f.right; c++) {
      chars[r][c] = (r + c) % 2 === 0 ? '=' : '-';
    }
  }
}

/** A door directly ahead: an inset rectangular panel set into the far wall,
 * surrounded by the ordinary wall texture — "a door directly ahead can look
 * like an inset rectangular door in the far wall" (requirement 2). */
function fillDoorAhead(chars: string[][], f: Frame): void {
  fillWallTexture(chars, f);

  const w = f.right - f.left;
  const h = f.bottom - f.top;
  const insetX = Math.max(1, Math.round(w * 0.22));
  const insetY = Math.max(1, Math.round(h * 0.18));

  const d = {
    top: f.top + insetY,
    bottom: f.bottom - insetY,
    left: f.left + insetX,
    right: f.right - insetX,
  };
  if (d.left >= d.right || d.top >= d.bottom) return; // frame too small to inset further

  for (let r = d.top; r <= d.bottom; r++) {
    for (let c = d.left; c <= d.right; c++) {
      chars[r][c] = ' ';
    }
  }
  for (let c = d.left; c <= d.right; c++) {
    chars[d.top][c] = '-';
    chars[d.bottom][c] = '-';
  }
  for (let r = d.top; r <= d.bottom; r++) {
    chars[r][d.left] = '|';
    chars[r][d.right] = '|';
  }
  chars[d.top][d.left] = '+';
  chars[d.top][d.right] = '+';
  chars[d.bottom][d.left] = '+';
  chars[d.bottom][d.right] = '+';

  // A center seam, as if two door panels meet in the middle.
  const midCol = Math.round((d.left + d.right) / 2);
  for (let r = d.top + 1; r < d.bottom; r++) {
    if (chars[r][midCol] === ' ') chars[r][midCol] = '|';
  }
}

export function renderCorridorView(
  grid: DungeonCell[][],
  playerX: number,
  playerY: number,
  facing: Direction,
  options: CorridorViewOptions = {},
  edgeLookup?: EdgeInfoLookup,
): string[] {
  const width = options.width ?? CORRIDOR_VIEW_DEFAULTS.WIDTH;
  const height = options.height ?? CORRIDOR_VIEW_DEFAULTS.HEIGHT;
  const maxDepth = options.maxDepth ?? CORRIDOR_VIEW_DEFAULTS.MAX_DEPTH;

  const scan = scanCorridor(grid, playerX, playerY, facing, maxDepth, edgeLookup);
  const chars: string[][] = Array.from({ length: height }, () => Array(width).fill(' '));

  const n = Math.max(scan.steps.length, 1);
  const frames = computeFrames(width, height, n, CORRIDOR_VIEW_DEFAULTS.DECAY);

  for (let i = 0; i < frames.length; i++) {
    drawFrame(chars, frames, i, scan.steps[i]);
  }

  const last = frames[frames.length - 1];
  const lastStep = scan.steps[scan.steps.length - 1];

  if (scan.endCapped) {
    if (lastStep && (lastStep.front === 'door-closed' || lastStep.front === 'door-locked')) {
      fillDoorAhead(chars, last);
    } else {
      // A plain wall, a secret wall (indistinguishable), or the map edge.
      fillWallTexture(chars, last);
    }
  } else {
    // Corridor continues past the render distance — a hint of darkness ahead.
    chars[Math.floor(height / 2)][Math.floor(width / 2)] = '*';
  }

  return chars.map(row => row.join(''));
}
