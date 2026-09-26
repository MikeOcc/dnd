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

/** Draws one side edge of a frame per its EdgeType: solid wall/secret, a
 * bracket-filled door panel, or an open gap (plain passage or open door)
 * with a short perspective hint of the corridor beyond it. */
export function drawSideEdge(
  chars: string[][],
  f: Frame,
  col: number,
  edge: CorridorStep['left'],
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
  glyph: string;
}

/** Draws entity markers at the center of their frame. Called with an empty
 * list today (see corridor-view.ts), so it's a no-op in current gameplay —
 * wire real entity data through here once the game has any to show. */
export function drawEntities(chars: string[][], frames: Frame[], entities: EntityMarker[]): void {
  for (const entity of entities) {
    const f = frames[entity.depth];
    if (!f) continue;
    const row = Math.round((f.top + f.bottom) / 2);
    const col = Math.round((f.left + f.right) / 2);
    if (chars[row]?.[col] !== undefined) chars[row][col] = entity.glyph;
  }
}
