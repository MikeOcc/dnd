// ─── Perspective geometry ─────────────────────────────────────────────────
//
// Pure numeric layout: given a canvas size and how many depth levels are
// visible, compute where each depth's nested rectangle ("frame") sits on
// screen. No ASCII characters, no dungeon data, no game state — just the
// rows/columns each frame occupies, so this stays reusable if the drawing
// style in corridor-render.ts ever changes.

export interface Frame {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/** Computes `count` nested frames centered in a `width`x`height` canvas.
 * Frame 0 is the full-size outer frame (nearest); each successive frame
 * shrinks toward the center using a perspective-style decay
 * (scale(i) = 1 / (1 + decay * i)) so nearby sections are larger and
 * distant ones progressively shrink toward the vanishing point. Shrink is
 * forced strictly monotonic so every frame stays visually distinct and
 * never collapses to nothing. */
export function computeFrames(width: number, height: number, count: number, decay: number): Frame[] {
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
    halfW = Math.max(1, Math.min(halfW, prevHalfW - 1));
    halfH = Math.max(1, Math.min(halfH, prevHalfH - 1));
    frames.push({ top: cy - halfH, bottom: cy + halfH, left: cx - halfW, right: cx + halfW });
    prevHalfW = halfW;
    prevHalfH = halfH;
  }

  return frames;
}
