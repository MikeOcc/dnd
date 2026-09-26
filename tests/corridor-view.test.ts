import { describe, it, expect } from 'vitest';
import { scanCorridor, renderCorridorView, CORRIDOR_VIEW_DEFAULTS } from '../src/core/corridor-view.js';
import type { DungeonCell, Direction } from '../src/core/types.js';

// Helper: fully walled-off grid (every cell closed on all four sides).
function closedGrid(w: number, h: number): DungeonCell[][] {
  const grid: DungeonCell[][] = [];
  for (let y = 0; y < h; y++) {
    grid[y] = [];
    for (let x = 0; x < w; x++) {
      grid[y][x] = { x, y, walls: { N: true, E: true, S: true, W: true } };
    }
  }
  return grid;
}

// Helper: carve an open straight corridor of `len` cells starting at (x0,y0),
// running in dungeon direction `dir` (only cardinal, axis-aligned corridors
// needed for these tests).
function carve(grid: DungeonCell[][], x0: number, y0: number, len: number, dir: Direction): void {
  const step: Record<Direction, [number, number]> = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
  const opposite: Record<Direction, Direction> = { N: 'S', S: 'N', E: 'W', W: 'E' };
  const [dx, dy] = step[dir];
  let x = x0, y = y0;
  for (let i = 0; i < len - 1; i++) {
    const nx = x + dx, ny = y + dy;
    grid[y][x].walls[dir] = false;
    grid[ny][nx].walls[opposite[dir]] = false;
    x = nx; y = ny;
  }
}

describe('scanCorridor', () => {
  it('reports endCapped with a single step when a wall is immediately ahead', () => {
    const grid = closedGrid(10, 10);
    const scan = scanCorridor(grid, 5, 5, 'E', 5);
    expect(scan.steps).toHaveLength(1);
    expect(scan.endCapped).toBe(true);
  });

  it('reports endCapped after the correct number of open cells', () => {
    const grid = closedGrid(10, 10);
    carve(grid, 5, 5, 4, 'E'); // open for 3 steps forward, wall on the 4th cell
    const scan = scanCorridor(grid, 5, 5, 'E', 10);
    expect(scan.steps).toHaveLength(4);
    expect(scan.endCapped).toBe(true);
  });

  it('is not endCapped when the corridor is still open at the view-distance limit', () => {
    const grid = closedGrid(20, 20);
    carve(grid, 5, 5, 10, 'E'); // much longer than any reasonable maxDepth
    const scan = scanCorridor(grid, 5, 5, 'E', 5);
    expect(scan.steps).toHaveLength(5);
    expect(scan.endCapped).toBe(false);
  });

  it('correctly reports left/right wall state relative to facing, for all four facings', () => {
    // Facing E: left = dungeon N, right = dungeon S
    {
      const grid = closedGrid(10, 10);
      carve(grid, 5, 5, 3, 'E');
      grid[5][6].walls.N = false; // open left at depth 1
      const scan = scanCorridor(grid, 5, 5, 'E', 5);
      expect(scan.steps[0].leftWall).toBe(true);
      expect(scan.steps[0].rightWall).toBe(true);
      expect(scan.steps[1].leftWall).toBe(false);
      expect(scan.steps[1].rightWall).toBe(true);
    }
    // Facing N: left = dungeon W, right = dungeon E
    {
      const grid = closedGrid(10, 10);
      carve(grid, 5, 5, 3, 'N');
      grid[4][5].walls.W = false; // open left at depth 1
      const scan = scanCorridor(grid, 5, 5, 'N', 5);
      expect(scan.steps[1].leftWall).toBe(false);
      expect(scan.steps[1].rightWall).toBe(true);
    }
    // Facing S: left = dungeon E, right = dungeon W
    {
      const grid = closedGrid(10, 10);
      carve(grid, 5, 5, 3, 'S');
      grid[6][5].walls.E = false; // open left at depth 1
      const scan = scanCorridor(grid, 5, 5, 'S', 5);
      expect(scan.steps[1].leftWall).toBe(false);
      expect(scan.steps[1].rightWall).toBe(true);
    }
    // Facing W: left = dungeon S, right = dungeon N
    {
      const grid = closedGrid(10, 10);
      carve(grid, 5, 5, 3, 'W');
      grid[5][4].walls.S = false; // open left at depth 1
      const scan = scanCorridor(grid, 5, 5, 'W', 5);
      expect(scan.steps[1].leftWall).toBe(false);
      expect(scan.steps[1].rightWall).toBe(true);
    }
  });

  it('treats the edge of the map as capped even without an explicit wall flag', () => {
    const grid = closedGrid(3, 3);
    // Remove the boundary wall so the only thing stopping the scan is running off the grid.
    grid[1][2].walls.E = false;
    const scan = scanCorridor(grid, 1, 1, 'E', 5);
    expect(scan.endCapped).toBe(true);
  });
});

describe('renderCorridorView', () => {
  it('every row is exactly the configured width, and there are exactly `height` rows', () => {
    const grid = closedGrid(10, 10);
    carve(grid, 5, 5, 4, 'E');
    const view = renderCorridorView(grid, 5, 5, 'E');
    expect(view).toHaveLength(CORRIDOR_VIEW_DEFAULTS.HEIGHT);
    for (const row of view) {
      expect(row.length).toBe(CORRIDOR_VIEW_DEFAULTS.WIDTH);
    }
  });

  it('only uses the approved character set', () => {
    const grid = closedGrid(20, 20);
    carve(grid, 5, 5, 10, 'E');
    grid[5][7].walls.N = false; // an open side, for a bit more variety
    const view = renderCorridorView(grid, 5, 5, 'E');
    const allowed = new Set([' ', '+', '-', '|', '/', '\\', '^', '*', '=']);
    for (const row of view) {
      for (const ch of row) {
        expect(allowed.has(ch)).toBe(true);
      }
    }
  });

  it('fills the innermost frame with a wall texture when the corridor dead-ends', () => {
    const grid = closedGrid(10, 10);
    carve(grid, 5, 5, 3, 'E'); // dead-ends after 2 open steps
    const view = renderCorridorView(grid, 5, 5, 'E').join('\n');
    expect(view).toContain('=');
  });

  it('shows a vanishing-point marker when the corridor is still open at max view distance', () => {
    const grid = closedGrid(20, 20);
    carve(grid, 5, 5, 10, 'E');
    const view = renderCorridorView(grid, 5, 5, 'E').join('\n');
    expect(view).toContain('*');
  });

  it('renders differently when a side wall opens up partway down the corridor', () => {
    const gridClosed = closedGrid(10, 10);
    carve(gridClosed, 5, 5, 4, 'E');
    const closedView = renderCorridorView(gridClosed, 5, 5, 'E').join('\n');

    const gridOpen = closedGrid(10, 10);
    carve(gridOpen, 5, 5, 4, 'E');
    gridOpen[5][6].walls.N = false; // open the left side at depth 1
    const openView = renderCorridorView(gridOpen, 5, 5, 'E').join('\n');

    expect(openView).not.toBe(closedView);
  });

  it('respects custom width/height/maxDepth options', () => {
    const grid = closedGrid(15, 15);
    carve(grid, 5, 5, 6, 'E');
    const view = renderCorridorView(grid, 5, 5, 'E', { width: 31, height: 11, maxDepth: 3 });
    expect(view).toHaveLength(11);
    for (const row of view) expect(row.length).toBe(31);
  });

  it('fills the whole view with wall texture when a wall is immediately ahead', () => {
    const grid = closedGrid(10, 10);
    const view = renderCorridorView(grid, 5, 5, 'E').join('\n');
    expect(view).toContain('=');
    // No vanishing-point marker when it's a dead end, not an open corridor.
    expect(view).not.toContain('*');
  });
});
