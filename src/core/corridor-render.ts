import type { Frame } from './corridor-geometry.js';
import type { CorridorStep } from './corridor-scan.js';

// ─── ASCII painting ─────────────────────────────────────────────────────────
//
// Turns a Frame layout (corridor-geometry.ts) plus the scanned edge data
// (corridor-scan.ts) into characters on a canvas. This is the only module
// that knows what any of it actually looks like — swap the glyphs here
// without touching scanning or geometry.
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

export function drawDiagonal(
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

// A cheap, deterministic spatial hash — same (x, y) always produces the
// same result, so decorative choices (which walls get a torch, which
// fountains look like wells) are stable across renders instead of
// flickering, without needing to store anything.
export function spatialHash(x: number, y: number, salt: number): number {
  let h = (x * 374761393 + y * 668265263 + salt * 2246822519) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return h;
}

// Roughly 1 in 6 solid wall segments gets a torch — sparse ("here and
// there"), not a torch on every wall.
const TORCH_CHANCE_DENOM = 6;

/** Wall-mounted torches are purely decorative and placed the same way
 * whether the edge is an ordinary wall or a secret one (the decision only
 * depends on (x, y), never on the edge type), so a secret wall's odds of
 * showing a torch are statistically identical to an ordinary wall's —
 * required to keep it indistinguishable until discovered. */
function maybeDrawTorch(chars: string[][], f: Frame, col: number, x: number, y: number, side: 'left' | 'right'): void {
  if (f.bottom - f.top < 4) return; // frame too small to place one cleanly
  const salt = side === 'left' ? 11 : 17;
  if (spatialHash(x, y, salt) % TORCH_CHANCE_DENOM !== 0) return;
  const row = f.top + Math.round((f.bottom - f.top) * 0.35);
  if (row > f.top && row < f.bottom) chars[row][col] = '^';
}

/** Draws one side edge of a frame per its EdgeType: solid wall/secret, a
 * bracket-filled door panel, or an open gap (plain passage or open door)
 * with a short perspective hint of the corridor beyond it. */
export function drawSideEdge(
  chars: string[][],
  f: Frame,
  col: number,
  edge: CorridorStep['left'],
  side: 'left' | 'right',
  x = 0,
  y = 0,
): void {
  if (edge === 'wall' || edge === 'secret') {
    for (let r = f.top; r <= f.bottom; r++) chars[r][col] = '|';
    maybeDrawTorch(chars, f, col, x, y, side);
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
  // receding away from this opening.
  const midRow = Math.round((f.top + f.bottom) / 2);
  const outward = side === 'left' ? -1 : 1;
  for (let step = 2; step <= 3; step++) {
    const c = col + outward * step;
    if (chars[midRow]?.[c] === ' ') chars[midRow][c] = '-';
  }
}

/** Draws a single perspective depth-level: ceiling/floor, both side edges,
 * corners, and the diagonal joins back to the previous (nearer) frame. */
export function drawFrame(
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

  drawSideEdge(chars, f, f.left, step?.left ?? 'wall', 'left', step?.x, step?.y);
  drawSideEdge(chars, f, f.right, step?.right ?? 'wall', 'right', step?.x, step?.y);

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

export function fillWallTexture(chars: string[][], f: Frame): void {
  for (let r = f.top + 1; r < f.bottom; r++) {
    for (let c = f.left + 1; c < f.right; c++) {
      chars[r][c] = (r + c) % 2 === 0 ? '=' : '-';
    }
  }
}

/** A door directly ahead: an inset rectangular panel set into the far wall,
 * surrounded by the ordinary wall texture. */
export function fillDoorAhead(chars: string[][], f: Frame): void {
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

// ─── Entity rendering (reserved) ─────────────────────────────────────────────
//
// Monsters, treasure, and stairs are not projected into the first-person
// view yet — nothing currently supplies entity data to the renderer, and
// no dungeon-level display describes any such symbols today, so drawing
// them here would be inventing new visual behavior, not preserving it.
// This is the seam for that future pass: a small, explicit marker per
// visible depth, kept entirely separate from wall/door drawing above so
// entities can be added, restyled, or removed without touching geometry
// or edge rendering at all.

export interface EntityMarker {
  /** Index into the scanned steps/frames array this entity appears at. */
  depth: number;
  /** A small ASCII pattern, one string per row, centered on the frame at
   * that depth. A space is transparent — it leaves whatever's already
   * drawn there (floor, wall texture) showing through, so a pattern
   * doesn't need to be a solid rectangle to read as an object sitting in
   * the scene. */
  pattern: string[];
}

/** Draws entity markers centered in their frame. Called with an empty list
 * by default (see corridor-view.ts) — wire real entity data through here
 * once the game has some to show (see game-engine.ts's findVisibleEntities
 * for the current ladder/chest/book/altar/fountain wiring). */
export function drawEntities(chars: string[][], frames: Frame[], entities: EntityMarker[]): void {
  for (const entity of entities) {
    const f = frames[entity.depth];
    if (!f) continue;

    const centerRow = Math.round((f.top + f.bottom) / 2);
    const centerCol = Math.round((f.left + f.right) / 2);
    const rowOffset = Math.floor(entity.pattern.length / 2);

    entity.pattern.forEach((rowStr, i) => {
      const r = centerRow - rowOffset + i;
      const colOffset = Math.floor(rowStr.length / 2);
      for (let j = 0; j < rowStr.length; j++) {
        const ch = rowStr[j];
        if (ch === ' ') continue;
        const c = centerCol - colOffset + j;
        if (chars[r]?.[c] !== undefined) chars[r][c] = ch;
      }
    });
  }
}

// ─── Decorative content glyphs ───────────────────────────────────────────────
//
// Small ASCII motifs for the dungeon fixtures the game already has content
// types for. Each is 1-3 short rows built only from the renderer's existing
// character set (+ - | / \ = [ ] ~ ^ *), designed to read as a distinct
// silhouette at a glance rather than a label. Fountain has two variants
// (picked deterministically per-fountain by the caller, via spatialHash on
// the content id) purely for visual variety between fountains in the same
// dungeon.

export const CONTENT_PATTERNS = {
  ladderUp: ['>'],
  ladderDown: ['<'],
  chest: ['+=+', '[=]'],
  book: ['/=\\', ' | '],
  altar: ['+-+', '|+|', '+-+'],
  fountain: ['~~~', '[=]'],
  well: ['+-+', '|~|', '+-+'],
} as const;
