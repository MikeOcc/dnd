import type { DungeonCell, Direction, WallEdges, DisplayGrid } from './types.js';

// ─── Coordinate mapping ──────────────────────────────────────────────────────
//
// The 5×5 display grid has the player at center (2,2).
// Display row 0 = 2 cells forward; row 4 = 2 cells behind.
// Display col 0 = 2 cells left;    col 4 = 2 cells right.
//
// "Forward" and "right" depend on the player's facing direction.
//
// The rendered character grid is 11×11:
//   - Even rows/cols are wall-edge slots.
//   - Odd rows/cols are cell-interior slots.
//   - Cell (dc, dr) in 0-indexed 5×5 → interior char at (2*dc+1, 2*dr+1).
//   - N wall segment of cell (dc,dr) → char at (2*dc+1, 2*dr).
//   - S wall segment → char at (2*dc+1, 2*dr+2).
//   - W wall segment → char at (2*dc,   2*dr+1).
//   - E wall segment → char at (2*dc+2, 2*dr+1).
//   - Corner at (2*dc, 2*dr).

export interface DisplayCoord {
  displayRow: number;  // 0..4
  displayCol: number;  // 0..4
}

export interface DungeonCoord {
  x: number;
  y: number;
}

// Forward and right vectors for each direction
const FORWARD: Record<Direction, [number, number]> = {
  N: [0, -1],
  E: [1,  0],
  S: [0,  1],
  W: [-1, 0],
};

const RIGHT: Record<Direction, [number, number]> = {
  N: [1,  0],
  E: [0,  1],
  S: [-1, 0],
  W: [0, -1],
};

// Map display (col, row) to dungeon coordinate offset from player
export function displayToDungeon(
  facing: Direction,
  displayRow: number,
  displayCol: number,
): { dx: number; dy: number } {
  const fwd = FORWARD[facing];
  const rgt = RIGHT[facing];
  const forwardOffset = 2 - displayRow;   // positive = forward
  const rightOffset   = displayCol - 2;   // positive = right

  return {
    dx: fwd[0] * forwardOffset + rgt[0] * rightOffset,
    dy: fwd[1] * forwardOffset + rgt[1] * rightOffset,
  };
}

// Map a dungeon wall direction to its display wall direction given the facing
export function dungeonDirToDisplayDir(facing: Direction, dungeonDir: Direction): Direction {
  // We need to rotate dungeonDir by the facing
  const map: Record<Direction, Record<Direction, Direction>> = {
    N: { N: 'N', E: 'E', S: 'S', W: 'W' },
    E: { N: 'W', E: 'N', S: 'E', W: 'S' },
    S: { N: 'S', E: 'W', S: 'N', W: 'E' },
    W: { N: 'E', E: 'S', S: 'W', W: 'N' },
  };
  return map[facing][dungeonDir];
}

// ─── Line-of-sight ──────────────────────────────────────────────────────────

// Returns true if there is a clear line of sight from (fromX,fromY) to (toX,toY).
// For cardinal directions: single straight path.
// For diagonals: tries X-first and Y-first corner paths; visible if either is clear.
function hasLOS(
  grid: DungeonCell[][],
  fromX: number, fromY: number,
  toX: number,   toY: number,
): boolean {
  if (fromX === toX && fromY === toY) return true;

  const dx = Math.sign(toX - fromX);
  const dy = Math.sign(toY - fromY);
  const stepsX = Math.abs(toX - fromX);
  const stepsY = Math.abs(toY - fromY);
  const xDir: Direction = dx > 0 ? 'E' : 'W';
  const yDir: Direction = dy > 0 ? 'S' : 'N';

  if (stepsX === 0 || stepsY === 0) {
    // Cardinal: single straight path
    let x = fromX, y = fromY;
    const steps = stepsX + stepsY;
    const dir = stepsX === 0 ? yDir : xDir;
    for (let i = 0; i < steps; i++) {
      const cell = grid[y]?.[x];
      if (!cell || cell.walls[dir]) return false;
      x += dx; y += dy;
    }
    return true;
  }

  // Diagonal: try X-first and Y-first Manhattan paths; visible if either is unblocked.
  // This correctly handles "seeing around corners" — one path blocked doesn't prevent
  // visibility if another path through the same corner is open.
  function tryPath(preferX: boolean): boolean {
    let x = fromX, y = fromY;
    let rx = stepsX, ry = stepsY;
    let goX = preferX;
    while (rx > 0 || ry > 0) {
      const cell = grid[y]?.[x];
      if (!cell) return false;
      const stepX = (goX && rx > 0) || ry === 0;
      if (stepX) {
        if (cell.walls[xDir]) return false;
        x += dx; rx--;
      } else {
        if (cell.walls[yDir]) return false;
        y += dy; ry--;
      }
      goX = !stepX;
    }
    return true;
  }

  return tryPath(true) || tryPath(false);
}

// ─── Visibility set ──────────────────────────────────────────────────────────

// Returns a Set of "dr,dc" display positions that are visible.
function computeVisibility(
  grid: DungeonCell[][],
  playerX: number,
  playerY: number,
  facing: Direction,
  h: number,
  w: number,
): Set<string> {
  const visible = new Set<string>();

  for (let dr = 0; dr < 5; dr++) {
    for (let dc = 0; dc < 5; dc++) {
      const { dx, dy } = displayToDungeon(facing, dr, dc);
      const tx = playerX + dx;
      const ty = playerY + dy;

      if (tx < 0 || ty < 0 || tx >= w || ty >= h) continue;

      if (hasLOS(grid, playerX, playerY, tx, ty)) {
        visible.add(`${dr},${dc}`);
      }
    }
  }

  return visible;
}

// ─── Wall rendering ──────────────────────────────────────────────────────────

function makeCharGrid(): string[][] {
  return Array.from({ length: 11 }, () => Array(11).fill(' '));
}

function renderWalls(
  chars: string[][],
  grid: DungeonCell[][],
  playerX: number,
  playerY: number,
  facing: Direction,
  visible: Set<string>,
  h: number,
  w: number,
): void {
  for (let dr = 0; dr < 5; dr++) {
    for (let dc = 0; dc < 5; dc++) {
      if (!visible.has(`${dr},${dc}`)) continue;

      const { dx, dy } = displayToDungeon(facing, dr, dc);
      const cx = playerX + dx;
      const cy = playerY + dy;
      if (cx < 0 || cy < 0 || cx >= w || cy >= h) continue;

      const cell = grid[cy][cx];
      const charRow = dr * 2 + 1;
      const charCol = dc * 2 + 1;

      // North wall (in dungeon space) → which display edge?
      // For each cardinal dungeon direction, transform to display direction
      for (const dungeonDir of (['N', 'E', 'S', 'W'] as Direction[])) {
        if (!cell.walls[dungeonDir]) continue;

        const displayDir = dungeonDirToDisplayDir(facing, dungeonDir);

        if (displayDir === 'N' && dr > 0) {
          chars[charRow - 1][charCol] = '-';
          // corners
          chars[charRow - 1][charCol - 1] = '+';
          chars[charRow - 1][charCol + 1] = '+';
        }
        if (displayDir === 'S' && dr < 4) {
          chars[charRow + 1][charCol] = '-';
          chars[charRow + 1][charCol - 1] = '+';
          chars[charRow + 1][charCol + 1] = '+';
        }
        if (displayDir === 'W' && dc > 0) {
          chars[charRow][charCol - 1] = '|';
          chars[charRow - 1][charCol - 1] = '+';
          chars[charRow + 1][charCol - 1] = '+';
        }
        if (displayDir === 'E' && dc < 4) {
          chars[charRow][charCol + 1] = '|';
          chars[charRow - 1][charCol + 1] = '+';
          chars[charRow + 1][charCol + 1] = '+';
        }

        // Boundary walls (edge of the 5×5 view)
        if (displayDir === 'N' && dr === 0) {
          chars[0][charCol] = '-';
          chars[0][charCol - 1] = '+';
          chars[0][charCol + 1] = '+';
        }
        if (displayDir === 'S' && dr === 4) {
          chars[10][charCol] = '-';
          chars[10][charCol - 1] = '+';
          chars[10][charCol + 1] = '+';
        }
        if (displayDir === 'W' && dc === 0) {
          chars[charRow][0] = '|';
          chars[charRow - 1][0] = '+';
          chars[charRow + 1][0] = '+';
        }
        if (displayDir === 'E' && dc === 4) {
          chars[charRow][10] = '|';
          chars[charRow - 1][10] = '+';
          chars[charRow + 1][10] = '+';
        }
      }
    }
  }
}

// ─── Post-process: remove wall chars not adjacent to any visible cell ─────────

function clipWallsToVisible(chars: string[][], visible: Set<string>): void {
  const visInt = new Set<string>();
  for (const key of visible) {
    const [dr, dc] = key.split(',').map(Number);
    visInt.add(`${dr * 2 + 1},${dc * 2 + 1}`);
  }

  for (let r = 0; r < 11; r++) {
    for (let c = 0; c < 11; c++) {
      const ch = chars[r][c];
      if (ch === ' ' || ch === '^') continue;

      // Identify the interior (odd,odd) positions adjacent to this wall slot
      let neighbors: [number, number][];
      if (r % 2 === 0 && c % 2 === 1) {
        neighbors = [[r - 1, c], [r + 1, c]];          // horizontal wall
      } else if (r % 2 === 1 && c % 2 === 0) {
        neighbors = [[r, c - 1], [r, c + 1]];           // vertical wall
      } else if (r % 2 === 0 && c % 2 === 0) {
        neighbors = [[r-1,c-1],[r-1,c+1],[r+1,c-1],[r+1,c+1]]; // corner
      } else {
        continue; // interior slot — not a wall char
      }

      const hasVis = neighbors.some(
        ([ar, ac]) => ar >= 0 && ar < 11 && ac >= 0 && ac < 11 && visInt.has(`${ar},${ac}`)
      );
      if (!hasVis) chars[r][c] = ' ';
    }
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

export interface FOVResult {
  grid: DisplayGrid;
  visibleCells: Set<string>;  // "dr,dc" keys
}

export function computeFOV(
  dungeonGrid: DungeonCell[][],
  playerX: number,
  playerY: number,
  facing: Direction,
  specialSymbol?: { dr: number; dc: number; symbol: string },
): FOVResult {
  const h = dungeonGrid.length;
  const w = dungeonGrid[0].length;

  const visible = computeVisibility(dungeonGrid, playerX, playerY, facing, h, w);
  const chars = makeCharGrid();

  renderWalls(chars, dungeonGrid, playerX, playerY, facing, visible, h, w);
  clipWallsToVisible(chars, visible);

  // Player symbol always at center
  chars[5][5] = '^';

  // Optional special symbol (ladder, boss, etc.)
  if (specialSymbol && visible.has(`${specialSymbol.dr},${specialSymbol.dc}`)) {
    chars[specialSymbol.dr * 2 + 1][specialSymbol.dc * 2 + 1] = specialSymbol.symbol;
  }

  const displayGrid: DisplayGrid = chars.map(row => row.join(''));

  return { grid: displayGrid, visibleCells: visible };
}

export function formatFOV(fov: FOVResult): string {
  return fov.grid.join('\n');
}
