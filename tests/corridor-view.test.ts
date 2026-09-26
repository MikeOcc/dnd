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

  it('never reveals cells beyond a blocking wall (requirement 7)', () => {
    const grid = closedGrid(10, 10);
    carve(grid, 5, 5, 3, 'E'); // open for 2 steps, wall on the 3rd cell
    // Poke an obviously-detectable marker into a cell well past the wall.
    grid[5][9].walls.N = false;
    const scan = scanCorridor(grid, 5, 5, 'E', 10);
    // Only the 3 reachable-and-visible cells were scanned; the scan simply
    // never reaches (9,5), so its state can't leak into the result.
    expect(scan.steps).toHaveLength(3);
  });

  describe('step classification (StepKind)', () => {
    it('classifies a plain straight run', () => {
      const grid = closedGrid(10, 10);
      carve(grid, 5, 5, 3, 'E');
      const scan = scanCorridor(grid, 5, 5, 'E', 5);
      expect(scan.steps[0].kind).toBe('straight');
    });

    it('classifies a left/right passage while the corridor continues', () => {
      const gridL = closedGrid(10, 10);
      carve(gridL, 5, 5, 4, 'E');
      gridL[5][6].walls.N = false; // open left at depth 1
      expect(scanCorridor(gridL, 5, 5, 'E', 5).steps[1].kind).toBe('left-passage');

      const gridR = closedGrid(10, 10);
      carve(gridR, 5, 5, 4, 'E');
      gridR[5][6].walls.S = false; // open right at depth 1
      expect(scanCorridor(gridR, 5, 5, 'E', 5).steps[1].kind).toBe('right-passage');
    });

    it('classifies a crossroads when both sides are open and forward continues', () => {
      const grid = closedGrid(10, 10);
      carve(grid, 5, 5, 4, 'E');
      grid[5][6].walls.N = false;
      grid[5][6].walls.S = false;
      expect(scanCorridor(grid, 5, 5, 'E', 5).steps[1].kind).toBe('crossroads');
    });

    it('classifies a dead end when forward is blocked and both sides are walled', () => {
      const grid = closedGrid(10, 10);
      carve(grid, 5, 5, 3, 'E');
      const scan = scanCorridor(grid, 5, 5, 'E', 5);
      expect(scan.steps[scan.steps.length - 1].kind).toBe('dead-end');
    });

    it('classifies a turn when forward is blocked and exactly one side is open', () => {
      const gridL = closedGrid(10, 10);
      carve(gridL, 5, 5, 3, 'E');
      gridL[5][7].walls.N = false; // open left at the final (capped) cell
      const scanL = scanCorridor(gridL, 5, 5, 'E', 5);
      expect(scanL.steps[scanL.steps.length - 1].kind).toBe('turn-left');

      const gridR = closedGrid(10, 10);
      carve(gridR, 5, 5, 3, 'E');
      gridR[5][7].walls.S = false; // open right at the final (capped) cell
      const scanR = scanCorridor(gridR, 5, 5, 'E', 5);
      expect(scanR.steps[scanR.steps.length - 1].kind).toBe('turn-right');
    });

    it('classifies a T-junction when forward is blocked and both sides are open', () => {
      const grid = closedGrid(10, 10);
      carve(grid, 5, 5, 3, 'E');
      grid[5][7].walls.N = false;
      grid[5][7].walls.S = false;
      const scan = scanCorridor(grid, 5, 5, 'E', 5);
      expect(scan.steps[scan.steps.length - 1].kind).toBe('t-junction');
    });
  });

  describe('door hook', () => {
    it('marks a door only where a side is actually open and the lookup says so', () => {
      const grid = closedGrid(10, 10);
      carve(grid, 5, 5, 4, 'E');
      grid[5][6].walls.N = false; // open left at depth 1

      const scan = scanCorridor(grid, 5, 5, 'E', 5, (x, y, dir) => x === 6 && y === 5 && dir === 'N');
      expect(scan.steps[1].leftDoor).toBe(true);
      expect(scan.steps[1].rightDoor).toBe(false);
    });

    it('never reports a door on a side that has a wall, even if the lookup says yes', () => {
      const grid = closedGrid(10, 10);
      carve(grid, 5, 5, 4, 'E'); // left/right stay walled at every depth
      const scan = scanCorridor(grid, 5, 5, 'E', 5, () => true);
      for (const step of scan.steps) {
        expect(step.leftDoor).toBe(false);
        expect(step.rightDoor).toBe(false);
      }
    });
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
    const allowed = new Set([' ', '+', '-', '|', '/', '\\', '^', '*', '=', '[', ']']);
    for (const row of view) {
      for (const ch of row) {
        expect(allowed.has(ch)).toBe(true);
      }
    }
  });

  it('renders a T-junction with gaps on both sides of the dead-end wall texture', () => {
    const grid = closedGrid(10, 10);
    carve(grid, 5, 5, 3, 'E');
    grid[5][7].walls.N = false;
    grid[5][7].walls.S = false;
    const view = renderCorridorView(grid, 5, 5, 'E');

    // A plain dead end (both sides walled) for comparison.
    const gridDead = closedGrid(10, 10);
    carve(gridDead, 5, 5, 3, 'E');
    const deadView = renderCorridorView(gridDead, 5, 5, 'E');

    expect(view.join('\n')).not.toBe(deadView.join('\n'));
    expect(view.join('\n')).toContain('='); // still a wall dead ahead
  });

  it('renders a single turn differently from a T-junction', () => {
    const gridTurn = closedGrid(10, 10);
    carve(gridTurn, 5, 5, 3, 'E');
    gridTurn[5][7].walls.N = false; // only left open
    const turnView = renderCorridorView(gridTurn, 5, 5, 'E').join('\n');

    const gridT = closedGrid(10, 10);
    carve(gridT, 5, 5, 3, 'E');
    gridT[5][7].walls.N = false;
    gridT[5][7].walls.S = false; // both sides open
    const tView = renderCorridorView(gridT, 5, 5, 'E').join('\n');

    expect(turnView).not.toBe(tView);
  });

  it('draws a door glyph on an open side when the door lookup marks one', () => {
    const grid = closedGrid(10, 10);
    carve(grid, 5, 5, 4, 'E');
    grid[5][6].walls.N = false; // open left at depth 1

    const withoutDoor = renderCorridorView(grid, 5, 5, 'E').join('\n');
    const withDoor = renderCorridorView(
      grid, 5, 5, 'E', {},
      (x, y, dir) => x === 6 && y === 5 && dir === 'N',
    ).join('\n');

    expect(withDoor).toContain('[');
    expect(withDoor).not.toBe(withoutDoor);
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
