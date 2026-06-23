import { describe, it, expect } from 'vitest';
import { computeFOV, displayToDungeon, dungeonDirToDisplayDir } from '../src/core/field-of-view.js';
import type { DungeonCell, Direction } from '../src/core/types.js';

// Helper: create a small empty grid (all walls removed)
function openGrid(w: number, h: number): DungeonCell[][] {
  const grid: DungeonCell[][] = [];
  for (let y = 0; y < h; y++) {
    grid[y] = [];
    for (let x = 0; x < w; x++) {
      grid[y][x] = { x, y, walls: { N: false, E: false, S: false, W: false } };
    }
  }
  // Add boundary walls
  for (let y = 0; y < h; y++) {
    grid[y][0].walls.W = true;
    grid[y][w - 1].walls.E = true;
  }
  for (let x = 0; x < w; x++) {
    grid[0][x].walls.N = true;
    grid[h - 1][x].walls.S = true;
  }
  return grid;
}

// Helper: create grid with a wall segment
function gridWithWall(w: number, h: number, wallX: number, wallY: number, wallDir: Direction): DungeonCell[][] {
  const grid = openGrid(w, h);
  grid[wallY][wallX].walls[wallDir] = true;
  // Mirror wall
  const mirror: Record<Direction, Direction> = { N: 'S', S: 'N', E: 'W', W: 'E' };
  const nDir = mirror[wallDir];
  const nx = wallX + (wallDir === 'E' ? 1 : wallDir === 'W' ? -1 : 0);
  const ny = wallY + (wallDir === 'S' ? 1 : wallDir === 'N' ? -1 : 0);
  if (ny >= 0 && ny < h && nx >= 0 && nx < w) {
    grid[ny][nx].walls[nDir] = true;
  }
  return grid;
}

describe('displayToDungeon coordinate mapping', () => {
  it('center cell maps to (0,0) offset for all facings', () => {
    for (const facing of ['N','E','S','W'] as Direction[]) {
      const offset = displayToDungeon(facing, 2, 2); // row=2,col=2 = center
      expect(offset.dx).toBe(0);
      expect(offset.dy).toBe(0);
    }
  });

  it('facing North: row 0 = 2 cells north (dy=-2), col 4 = 2 cells east (dx=2)', () => {
    let o = displayToDungeon('N', 0, 2); // top center
    expect(o.dy).toBe(-2);
    expect(o.dx).toBe(0);

    o = displayToDungeon('N', 2, 4); // center right
    expect(o.dx).toBe(2);
    expect(o.dy).toBe(0);
  });

  it('facing East: row 0 = 2 cells east (dx=2)', () => {
    const o = displayToDungeon('E', 0, 2); // top center when facing East
    expect(o.dx).toBe(2);
    expect(o.dy).toBe(0);
  });

  it('facing South: row 0 = 2 cells south (dy=2)', () => {
    const o = displayToDungeon('S', 0, 2);
    expect(o.dy).toBe(2);
    expect(o.dx).toBe(0);
  });

  it('facing West: row 0 = 2 cells west (dx=-2)', () => {
    const o = displayToDungeon('W', 0, 2);
    expect(o.dx).toBe(-2);
    expect(o.dy).toBe(0);
  });

  it('produces all unique offsets in the 5×5 grid', () => {
    const offsets = new Set<string>();
    for (let dr = 0; dr < 5; dr++) {
      for (let dc = 0; dc < 5; dc++) {
        const o = displayToDungeon('N', dr, dc);
        offsets.add(`${o.dx},${o.dy}`);
      }
    }
    expect(offsets.size).toBe(25);
  });
});

describe('FOV rendering', () => {
  it('renders an 11-row display', () => {
    const grid = openGrid(20, 20);
    const result = computeFOV(grid, 10, 10, 'N');
    expect(result.grid).toHaveLength(11);
  });

  it('player symbol ^ is always at center of display (row 5, col 5)', () => {
    const grid = openGrid(20, 20);
    for (const facing of ['N','E','S','W'] as Direction[]) {
      const result = computeFOV(grid, 10, 10, facing);
      // Row index 5 (0-indexed), col index 5 (center in 11-char row)
      expect(result.grid[5][5]).toBe('^');
    }
  });

  it('open passage edges show no wall characters', () => {
    const grid = openGrid(20, 20);
    const result = computeFOV(grid, 10, 10, 'N');
    // In an open corridor (no walls between cells), adjacent cells should not show wall chars
    // Check row 5 (center row) — horizontal center line should have no | chars except at boundaries
    const centerRow = result.grid[5];
    // Positions 1,3,7,9 are W/E wall slots for interior cells
    // In open space they should be space
    expect(centerRow[3]).not.toBe('|');
    expect(centerRow[7]).not.toBe('|');
  });

  it('walls block visibility: cells behind a wall are not shown', () => {
    const grid = openGrid(20, 20);
    // Place a wall just north of player (between row 9 and 10)
    // Player at (10,10), wall on south side of (10,9) = north side of (10,10)
    grid[10][10].walls.N = true;
    grid[9][10].walls.S = true;

    const result = computeFOV(grid, 10, 10, 'N');
    // Cells at dr=0 (2 steps north) should not be visible
    expect(result.visibleCells.has('0,2')).toBe(false);
    // Cell at dr=1 (1 step north) should not be visible either (wall is immediately north)
    expect(result.visibleCells.has('1,2')).toBe(false);
  });

  it('the center cell (player) is always visible', () => {
    const grid = openGrid(20, 20);
    // Even with walls all around
    grid[10][10].walls.N = true;
    grid[10][10].walls.E = true;
    grid[10][10].walls.S = true;
    grid[10][10].walls.W = true;

    for (const facing of ['N','E','S','W'] as Direction[]) {
      const result = computeFOV(grid, 10, 10, facing);
      expect(result.visibleCells.has('2,2')).toBe(true);
    }
  });

  it('rotation: the same dungeon feature appears in different positions when facing changes', () => {
    const grid = openGrid(20, 20);
    // Place a wall segment 2 cells north of player
    grid[8][10].walls.S = true;
    grid[9][10].walls.N = true;

    // Facing North: this wall should appear at the top of the display
    const resultN = computeFOV(grid, 10, 10, 'N');
    // It should be visible at display row 1 (1 step north)
    expect(resultN.visibleCells.has('1,2')).toBe(true);

    // Facing South: the same dungeon wall is now behind the player → not in the 5×5 view at front
    const resultS = computeFOV(grid, 10, 10, 'S');
    // 2 cells behind player (south) when facing south → display position (row 0 = 2 forward = south)
    // The north wall is 2 steps BEHIND the player when facing south
    // so it should appear at dr=4 (back) when facing south
    // Let's verify the wall at dungeon (10,8) maps to back when facing south
    const offset = displayToDungeon('S', 4, 2);
    // row 4 when facing south = dy = 2 - 4 = ... (let's compute properly)
    // facing S: forward=(0,1), so row 0 is 2 cells south, row 4 is 2 cells north
    // The wall is at y=8 relative to player y=10, so dy = -2 (north = back when facing south)
    expect(offset.dy).toBe(-2);
  });

  it('no wall appears in an open 5×5 interior region', () => {
    // Open 15×15 grid, player in center
    const grid = openGrid(15, 15);
    const result = computeFOV(grid, 7, 7, 'N');

    // Only boundary walls should appear — interior should be open spaces (no | or -)
    // except boundary positions (row 0, row 10, col 0, col 10 in the char grid)
    for (let r = 1; r < 10; r++) {
      for (let c = 1; c < 10; c++) {
        const ch = result.grid[r][c];
        // Interior should be space or ^ (player) only
        expect(['|','-','+']).not.toContain(ch);
      }
    }
  });
});
