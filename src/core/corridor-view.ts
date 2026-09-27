import type { DungeonCell, Direction } from './types.js';
import { scanCorridor } from './corridor-scan.js';
import type { EdgeInfoLookup } from './corridor-scan.js';
import { computeFrames } from './corridor-geometry.js';
import { drawFrame, fillWallTexture, fillDoorAhead, drawEntities, CONTENT_PATTERNS, spatialHash } from './corridor-render.js';
import type { EntityMarker } from './corridor-render.js';
export type { EntityMarker } from './corridor-render.js';
export { CONTENT_PATTERNS, spatialHash } from './corridor-render.js';

// ─── Public API ───────────────────────────────────────────────────────────────
//
// This file is the only entry point the rest of the game imports from
// (game-engine.ts calls renderCorridorView with a dungeon grid, player
// position, and facing direction, and gets back a fixed-size ASCII grid).
// Everything it needs is composed from three independent modules, each
// owning one concern:
//
//   corridor-scan.ts      — dungeon/map data in, player-relative visibility
//                            out (what can be seen, how far, what kind of
//                            geometry each depth is).
//   corridor-geometry.ts  — pure perspective math (where each depth's
//                            frame sits on screen), no ASCII involved.
//   corridor-render.ts    — paints the scan + geometry into characters,
//                            including the reserved entity-marker seam.
//
// That separation is what makes this file itself so small: it has nothing
// left to do but wire the three together, which is also what keeps future
// visual changes contained to corridor-render.ts (or corridor-geometry.ts
// for layout changes) without risking the scan logic, and keeps dungeon
// generation, movement, collision, combat, and save/load completely
// untouched by any of it.

// Re-exported so existing imports (game-engine.ts, tests) keep working
// unchanged — this refactor doesn't move where callers get these from.
export type {
  EdgeType, EdgeInfoLookup, StepKind, CorridorStep, CorridorScan, WallState,
} from './corridor-scan.js';
export { scanCorridor, isBlockingEdge, getWallState, stepForward } from './corridor-scan.js';

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

export function renderCorridorView(
  grid: DungeonCell[][],
  playerX: number,
  playerY: number,
  facing: Direction,
  options: CorridorViewOptions = {},
  edgeLookup?: EdgeInfoLookup,
  entities: EntityMarker[] = [],
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

  drawEntities(chars, frames, entities);

  return chars.map(row => row.join(''));
}
