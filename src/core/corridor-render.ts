import type { Frame } from './corridor-geometry.js';
import type { CorridorStep, EdgeType } from './corridor-scan.js';
import type { Direction } from './types.js';

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
  wallTop = f.top,  // a high ceiling: the wall runs up past the frame's top
): void {
  if (edge === 'wall' || edge === 'secret') {
    for (let r = Math.max(0, wallTop); r <= f.bottom; r++) chars[r][col] = '|';
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
    // Under a tall ceiling there's no lintel for the top lip to hang from.
    if (wallTop >= f.top) chars[f.top + 1][col] = edge === 'door-open' ? bracket : '|';
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

// ─── Wall materials and carvings ───────────────────────────────────────────
//
// Each physical wall (the edge between two squares) is built of one material
// (stone, brick, wooden planks or rough rock) in proportions that suit the
// level, and now and then bears a carved symbol or a patterned band. The
// choice hashes the edge itself, never which way the player is looking or
// whether the wall is secret, so a wall looks the same from every angle and
// secret walls stay indistinguishable. With no level given (tests, tools),
// every wall is plain stone with no carvings, as before.

export type WallMaterial = 'stone' | 'brick' | 'wood' | 'rough';

/** What the renderer needs to style walls: the dungeon level, and which way
 * the player faces (to turn left/right into compass sides). */
export interface WallStyle {
  level?: number;
  facing?: Direction;
}

/** Ceiling heights along the view, one per depth: 0 a normal ceiling,
 * 1 high (the walls run up out of the frame), 2 lost in darkness (the walls
 * fade away overhead). `clip` is the highest row each depth can show — a
 * low ceiling nearer the viewer hides anything above its opening. */
export interface CeilingInfo {
  heights: number[];
  clip: number[];
}

/** Works out each depth's clip row from the heights and the frames. */
export function ceilingClips(frames: Frame[], heights: number[]): number[] {
  const clip: number[] = [];
  let lowest = 0;  // the top row of the farthest low ceiling so far
  for (let i = 0; i < frames.length; i++) {
    clip.push(lowest);
    if (!(heights[i] > 0)) lowest = Math.max(lowest, frames[i].top + 1);
  }
  return clip;
}

/** How high a wall's texture and edges reach under a tall ceiling: all the
 * way up when high, a few rows past the frame when lost in darkness. */
function wallReach(frameTop: number, height: number, clip: number): number {
  if (height <= 0) return frameTop;
  return height === 1 ? clip : Math.max(clip, frameTop - 3);
}

const MATERIAL_WEIGHTS: Record<number, [WallMaterial, number][]> = {
  1: [['stone', 5], ['brick', 3], ['wood', 3]],
  2: [['stone', 4], ['rough', 3], ['wood', 3]],
  3: [['brick', 4], ['stone', 4], ['wood', 1]],
  4: [['rough', 7], ['stone', 3]],
  5: [['rough', 4], ['stone', 4], ['brick', 2]],
  6: [['stone', 5], ['rough', 5]],
  7: [['brick', 5], ['stone', 5]],
};

/** Small ASCII carvings, themed per level. Every line of a glyph has the same width. */
const SYMBOLS: Record<number, string[][]> = {
  1: [['\\ /', ' X ', '/ \\'], ['[+]'], ['\\|/', '-o-', '/|\\']],
  2: [['\\o/'], ['||||'], ['<o>']],
  3: [['.-.', '0 0', '\\=/'], [' o ', '-+-', ' | '], ['<o>']],
  4: [['\\ \\ \\'], ['@'], ['/\\/\\']],
  5: [['\\ \\ \\'], ['<(O)>'], ['/\\/\\']],
  6: [['<o>'], ['~@~'], ['(@)']],
  7: [[')  (', '\\__/'], ['/\\', '\\/'], ['^ ^', ')(']],
};
const BANDS: Record<number, string> = { 1: '=-', 2: '~', 3: '+-', 4: '~', 5: '^', 6: '~', 7: '<>' };

const LEFT_OF: Record<Direction, Direction> = { N: 'W', E: 'N', S: 'E', W: 'S' };
const RIGHT_OF: Record<Direction, Direction> = { N: 'E', E: 'S', S: 'W', W: 'N' };

/** One hash per physical wall: the east side of (x,y) is the west side of (x+1,y). */
function edgeHash(x: number, y: number, dir: Direction, salt: number): number {
  if (dir === 'W') return spatialHash(x - 1, y, salt);
  if (dir === 'N') return spatialHash(x, y - 1, salt + 500);
  if (dir === 'S') return spatialHash(x, y, salt + 500);
  return spatialHash(x, y, salt);
}

function wallDir(style: WallStyle, side: 'left' | 'right' | 'front'): Direction {
  const f = style.facing ?? 'N';
  return side === 'left' ? LEFT_OF[f] : side === 'right' ? RIGHT_OF[f] : f;
}

export function wallMaterial(style: WallStyle, x: number, y: number, side: 'left' | 'right' | 'front'): WallMaterial {
  const weights = style.level ? MATERIAL_WEIGHTS[style.level] : undefined;
  if (!weights) return 'stone';
  const total = weights.reduce((a, [, w]) => a + w, 0);
  let roll = edgeHash(x, y, wallDir(style, side), 101) % total;
  for (const [m, w] of weights) { if (roll < w) return m; roll -= w; }
  return 'stone';
}

/** A wall's material by absolute direction (the same choice the corridor view makes). */
export function edgeMaterial(level: number, x: number, y: number, dir: Direction): WallMaterial {
  return wallMaterial({ level, facing: dir }, x, y, 'front');
}

/** Whether a wall bears a carving (the same choice the corridor view makes). */
export function edgeCarved(level: number, x: number, y: number, dir: Direction): boolean {
  return wallCarving({ level, facing: dir }, x, y, 'front') !== null;
}

/** Whether a wall carries a torch: about one wall in six, fixed per physical wall. */
export function edgeTorch(x: number, y: number, dir: Direction): boolean {
  return edgeHash(x, y, dir, 11) % TORCH_CHANCE_DENOM === 0;
}

type Carving = { kind: 'symbol'; glyph: string[] } | { kind: 'band'; pattern: string } | null;

/** About one wall in nine bears a carving: mostly symbols, sometimes a band. */
export function wallCarving(style: WallStyle, x: number, y: number, side: 'left' | 'right' | 'front'): Carving {
  if (!style.level || !SYMBOLS[style.level]) return null;
  const h = edgeHash(x, y, wallDir(style, side), 211);
  if (h % 9 !== 0) return null;
  const pick = (h >>> 8) % 4;
  if (pick === 3) return { kind: 'band', pattern: BANDS[style.level] };
  const set = SYMBOLS[style.level];
  return { kind: 'symbol', glyph: set[pick % set.length] };
}

function materialChar(material: WallMaterial, depth: number, hash: number, r: number, c: number, anchorCol: number): string | null {
  const roll = hash % 10;
  switch (material) {
    case 'brick': {
      // Courses of brick, joints staggered row to row.
      const joint = ((c - anchorCol + (r % 2) * 2) % 4 + 4) % 4 === 0;
      if (depth >= 4) return roll < 4 ? (joint ? '|' : '=') : null;
      return joint ? '|' : '=';
    }
    case 'wood': {
      // Plank seams every few columns, with a little grain between.
      const seamEvery = depth <= 2 ? 3 : 2;
      if (((c - anchorCol) % seamEvery + seamEvery) % seamEvery === 0) return '|';
      return roll < (depth <= 2 ? 2 : 1) ? (roll === 0 ? ':' : "'") : null;
    }
    case 'rough': {
      if ((hash % 1000) / 1000 >= wallPanelDensity(depth) + 0.1) return null;
      return [',', '.', '`', "'", '%', ':', '.', ','][roll % 8];
    }
    default:
      if ((hash % 1000) / 1000 >= wallPanelDensity(depth)) return null;
      return wallTextureChar(depth, hash);
  }
}

/** Draws a carving centered in the given box, if it fits. */
function drawCarving(chars: string[][], carving: Carving, top: number, bottom: number, left: number, right: number): void {
  if (!carving) return;
  if (carving.kind === 'band') {
    const r = Math.round(top + (bottom - top) * 0.4);
    if (r <= top || r >= bottom) return;
    for (let c = left; c <= right; c++) {
      if (chars[r]?.[c] === undefined) continue;
      chars[r][c] = carving.pattern[(c - left) % carving.pattern.length];
    }
    return;
  }
  const g = carving.glyph;
  const gw = g[0].length, gh = g.length;
  if (right - left + 1 < gw + 2 || bottom - top - 1 < gh + 1) return;
  const r0 = Math.round((top + bottom) / 2 - gh / 2);
  const c0 = Math.round((left + right) / 2 - gw / 2);
  // Clear a margin around it so it reads against the wall's texture.
  for (let r = r0 - 1; r <= r0 + gh; r++) for (let c = c0 - 1; c <= c0 + gw; c++) {
    if (r > top && r < bottom && c >= left && c <= right) chars[r][c] = ' ';
  }
  for (let i = 0; i < gh; i++) {
    for (let j = 0; j < gw; j++) {
      const r = r0 + i, c = c0 + j;
      if (r > top && r < bottom && c >= left && c <= right) chars[r][c] = g[i][j];
    }
  }
}

// ─── Solid wall-surface texture ─────────────────────────────────────────────
//
// The diagonals drawn between consecutive frames are perspective edges, not
// surfaces — on their own they read as a wireframe. Where a side edge is
// actually solid (wall/secret, never a passage or a door — doors stay
// exactly as drawSideEdge already renders them, so they remain visually
// distinct), the quadrilateral between the two frames' matching corners is
// the real wall surface, and gets filled with a sparse masonry texture
// instead of staying empty. Density and character weight both fall off with
// depth, so near walls read coarse and solid while far ones fade to a few
// light marks — open corridors and passages are never touched, since this
// is only called when the edge is blocking.

function wallTextureChar(depth: number, hash: number): string {
  const roll = hash % 10;
  if (depth <= 1) return roll < 3 ? '#' : roll < 6 ? '=' : roll < 8 ? ':' : '.';
  if (depth <= 3) return roll < 3 ? '=' : roll < 6 ? '-' : roll < 8 ? ':' : '.';
  return roll < 5 ? '.' : ':';
}

function wallPanelDensity(depth: number): number {
  return Math.max(0.1, 0.55 - depth * 0.09);
}

/** Fills the wall surface between two consecutive frames on one side, only
 * where that edge is actually solid. Leaves the frames' own border columns
 * (already drawn by drawSideEdge) untouched, and never overwrites a
 * non-blank cell — so the diagonal perspective lines still show through the
 * texture around them. */
function fillWallPanel(
  chars: string[][],
  near: Frame,
  far: Frame,
  side: 'left' | 'right',
  depth: number,
  x: number,
  y: number,
  style: WallStyle = {},
  height = 0,
  clip = 0,
): void {
  const nearCol = side === 'left' ? near.left : near.right;
  const farCol = side === 'left' ? far.left : far.right;
  const colLo = Math.min(nearCol, farCol) + 1;
  const colHi = Math.max(nearCol, farCol) - 1;
  if (colLo > colHi) return;

  const salt = side === 'left' ? 41 : 43;
  const material = wallMaterial(style, x, y, side);

  for (let c = colLo; c <= colHi; c++) {
    const t = (c - nearCol) / (farCol - nearCol);
    const top = Math.round(near.top + (far.top - near.top) * t);
    const bottom = Math.round(near.bottom + (far.bottom - near.bottom) * t);

    // Under a tall ceiling the wall carries on above the frame, thinning out
    // as it climbs into the dark.
    const from = height > 0 ? wallReach(top, height, clip) : top + 1;
    for (let r = Math.max(0, from); r < bottom; r++) {
      if (chars[r]?.[c] !== ' ') continue;
      const hash = spatialHash(x, y, salt + r * 977 + c * 31);
      if (r <= top && (hash >>> 4) % 100 < (height === 1 ? 35 : 50 + (top - r) * 15)) continue;
      const ch = materialChar(material, depth, hash, r, c, nearCol);
      if (ch) chars[r][c] = ch;
    }
  }

  // A carving sits within the far frame's height, which is inside the panel at every column.
  if (depth <= 3) {
    const inset = Math.max(1, Math.round((colHi - colLo) * 0.15));
    drawCarving(chars, wallCarving(style, x, y, side), far.top, far.bottom, colLo + inset, colHi - inset);
  }
}

/** Very sparse texture across the floor or ceiling strip between two
 * consecutive frames, bounded left/right by that row's interpolated wall
 * position so it never spills into an open side passage. Ceiling is kept
 * lighter than floor per the "don't clutter the view" requirement. */
function fillHorizontalPanel(
  chars: string[][],
  near: Frame,
  far: Frame,
  surface: 'floor' | 'ceiling',
  x: number,
  y: number,
): void {
  const nearRow = surface === 'floor' ? near.bottom : near.top;
  const farRow = surface === 'floor' ? far.bottom : far.top;
  const rowLo = Math.min(nearRow, farRow) + 1;
  const rowHi = Math.max(nearRow, farRow) - 1;
  if (rowLo > rowHi) return;

  const density = surface === 'floor' ? 0.1 : 0.05;
  const salt = surface === 'floor' ? 47 : 53;
  const ch = surface === 'floor' ? '-' : '.';

  for (let r = rowLo; r <= rowHi; r++) {
    const t = (r - nearRow) / (farRow - nearRow);
    const left = Math.round(near.left + (far.left - near.left) * t);
    const right = Math.round(near.right + (far.right - near.right) * t);

    for (let c = left + 1; c < right; c++) {
      if (chars[r]?.[c] !== ' ') continue;
      const hash = spatialHash(x, y, salt + r * 977 + c * 31);
      if ((hash % 1000) / 1000 < density) {
        chars[r][c] = ch;
      }
    }
  }
}

/** Draws a single perspective depth-level: ceiling/floor, both side edges,
 * corners, and the diagonal joins back to the previous (nearer) frame. Solid
 * side walls additionally get a filled masonry texture (see fillWallPanel),
 * and the floor/ceiling strip gets a light scattering of texture — open
 * passages and doors are left exactly as drawSideEdge renders them. */
export function drawFrame(
  chars: string[][],
  frames: Frame[],
  i: number,
  step: CorridorStep | undefined,
  style: WallStyle = {},
  ceiling?: CeilingInfo,
): void {
  const f = frames[i];
  const height = ceiling?.heights[i] ?? 0;
  const prevHeight = i > 0 ? (ceiling?.heights[i - 1] ?? 0) : 0;
  const clip = ceiling?.clip[i] ?? 0;
  const high = height > 0;

  for (let c = f.left; c <= f.right; c++) {
    if (!high) chars[f.top][c] = '-';
    chars[f.bottom][c] = '-';
  }

  const x = step?.x ?? 0;
  const y = step?.y ?? 0;
  // Below f.top whenever the ceiling is tall, even for the nearest frame (whose top is row 0).
  const wallTop = high ? Math.min(wallReach(f.top, height, clip), f.top - 1) : f.top;
  drawSideEdge(chars, f, f.left, step?.left ?? 'wall', 'left', step?.x, step?.y, wallTop);
  drawSideEdge(chars, f, f.right, step?.right ?? 'wall', 'right', step?.x, step?.y, wallTop);

  if (!high) {
    chars[f.top][f.left] = '+';
    chars[f.top][f.right] = '+';
  }
  chars[f.bottom][f.left] = '+';
  chars[f.bottom][f.right] = '+';

  if (i > 0) {
    const prev = frames[i - 1];
    // The ceiling's edges only where both depths have an ordinary ceiling.
    if (!high && prevHeight === 0) {
      drawDiagonal(chars, prev.top, prev.left, f.top, f.left, '\\');
      drawDiagonal(chars, prev.top, prev.right, f.top, f.right, '/');
    }
    drawDiagonal(chars, prev.bottom, prev.left, f.bottom, f.left, '/');
    drawDiagonal(chars, prev.bottom, prev.right, f.bottom, f.right, '\\');

    const leftEdge: EdgeType = step?.left ?? 'wall';
    const rightEdge: EdgeType = step?.right ?? 'wall';
    if (leftEdge === 'wall' || leftEdge === 'secret') fillWallPanel(chars, prev, f, 'left', i, x, y, style, height, clip);
    if (rightEdge === 'wall' || rightEdge === 'secret') fillWallPanel(chars, prev, f, 'right', i, x, y, style, height, clip);
    fillHorizontalPanel(chars, prev, f, 'floor', x, y);
    if (!high && prevHeight === 0) fillHorizontalPanel(chars, prev, f, 'ceiling', x, y);

    // Leaving a tall chamber by a low passage: the chamber's end wall rises
    // above the passage mouth.
    if (!high && prevHeight > 0) {
      const reach = wallReach(f.top, prevHeight, ceiling?.clip[i - 1] ?? 0);
      for (let r = Math.max(0, reach); r < f.top; r++) {
        for (let c = prev.left + 1; c < prev.right; c++) {
          if (chars[r][c] !== ' ') continue;
          const hash = spatialHash(x, y, 71 + r * 977 + c * 31);
          const keep = prevHeight === 1 ? 30 : Math.max(0, 30 - (f.top - r) * 8);
          if (hash % 100 < keep) chars[r][c] = (hash >>> 7) % 3 === 0 ? ':' : '.';
        }
      }
    }
  }
}

/** A dead-end wall gets the densest texture in the view — a running-bond
 * brick course (each row's joints offset from the one above, like real
 * masonry) so it unmistakably reads as solid rather than just another
 * distant panel. */
export function fillWallTexture(chars: string[][], f: Frame, style: WallStyle = {}, x = 0, y = 0, height = 0, clip = 0): void {
  const material = wallMaterial(style, x, y, 'front');
  const BRICK_WIDTH = 4;
  // Under a tall ceiling the end wall carries on above the frame, thinning
  // out as it climbs into the dark.
  for (let r = Math.max(0, wallReach(f.top, height, clip)); r < f.top; r++) {
    for (let c = f.left + 1; c < f.right; c++) {
      const hash = spatialHash(x, y, 73 + r * 977 + c * 31);
      const keep = height === 1 ? 45 : Math.max(0, 40 - (f.top - r) * 12);
      chars[r][c] = hash % 100 < keep ? ['.', ':', '=', '.'][(hash >>> 7) % 4] : ' ';
    }
  }
  for (let r = height > 0 ? f.top : f.top + 1; r < f.bottom; r++) {
    const rowOffset = ((r - f.top) % 2) * (BRICK_WIDTH / 2);
    for (let c = f.left + 1; c < f.right; c++) {
      if (material === 'wood') {
        // Upright planks, with the odd knot.
        const hash = spatialHash(x, y, 61 + r * 977 + c * 31);
        chars[r][c] = (c - f.left) % 4 === 0 ? '|' : hash % 23 === 0 ? 'o' : hash % 7 === 0 ? ':' : ' ';
      } else if (material === 'rough') {
        const hash = spatialHash(x, y, 67 + r * 977 + c * 31);
        chars[r][c] = hash % 3 === 0 ? ' ' : ['%', ',', '.', '`', ':', "'"][hash % 6];
      } else {
        const withinBrick = ((c - f.left + rowOffset) % BRICK_WIDTH + BRICK_WIDTH) % BRICK_WIDTH;
        chars[r][c] = withinBrick === 0 ? '|' : '=';
      }
    }
  }
  const carving = wallCarving(style, x, y, 'front');
  drawCarving(chars, carving, f.top, f.bottom, f.left + 1, f.right - 1);
}

/** A door directly ahead: an inset rectangular panel set into the far wall,
 * surrounded by the ordinary wall texture. */
export function fillDoorAhead(chars: string[][], f: Frame): void {
  fillWallTexture(chars, f);  // the wall around a door is always plain masonry

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
