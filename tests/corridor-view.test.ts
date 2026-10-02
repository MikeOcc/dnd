import { describe, it, expect } from 'vitest';
import {
  scanCorridor, renderCorridorView, CORRIDOR_VIEW_DEFAULTS, isBlockingEdge,
  CONTENT_PATTERNS,
  type EdgeInfoLookup, type EdgeType,
} from '../src/core/corridor-view.js';
import type { DungeonCell, Direction } from '../src/core/types.js';
import { wallMaterial, wallCarving } from '../src/core/corridor-render.js';

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

/** Builds an EdgeInfoLookup from a plain map of "x,y,dir" -> EdgeType. */
function lookupFrom(entries: Record<string, EdgeType>): EdgeInfoLookup {
  return (x, y, dir) => entries[`${x},${y},${dir}`];
}

describe('isBlockingEdge', () => {
  it('treats wall, secret, door-closed, and door-locked as blocking', () => {
    expect(isBlockingEdge('wall')).toBe(true);
    expect(isBlockingEdge('secret')).toBe(true);
    expect(isBlockingEdge('door-closed')).toBe(true);
    expect(isBlockingEdge('door-locked')).toBe(true);
  });

  it('treats passage and door-open as non-blocking', () => {
    expect(isBlockingEdge('passage')).toBe(false);
    expect(isBlockingEdge('door-open')).toBe(false);
  });
});

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

  it('with no lookup, every boundary resolves to plain wall/passage (backward-compatible default)', () => {
    const grid = closedGrid(10, 10);
    carve(grid, 5, 5, 3, 'E');
    grid[5][6].walls.N = false; // open left at depth 1
    const scan = scanCorridor(grid, 5, 5, 'E', 5);
    expect(scan.steps[0].left).toBe('wall');
    expect(scan.steps[0].right).toBe('wall');
    expect(scan.steps[0].front).toBe('passage');
    expect(scan.steps[1].left).toBe('passage');
    expect(scan.steps[1].right).toBe('wall');
  });

  it('reports the dungeon (x,y) coordinates of each visible depth', () => {
    const grid = closedGrid(10, 10);
    carve(grid, 5, 5, 4, 'E');
    const scan = scanCorridor(grid, 5, 5, 'E', 10);
    expect(scan.steps[0]).toMatchObject({ x: 5, y: 5 });
    expect(scan.steps[1]).toMatchObject({ x: 6, y: 5 });
    expect(scan.steps[2]).toMatchObject({ x: 7, y: 5 });
  });

  it('correctly reports left/right edges relative to facing, for all four facings', () => {
    // Facing E: left = dungeon N, right = dungeon S
    {
      const grid = closedGrid(10, 10);
      carve(grid, 5, 5, 3, 'E');
      grid[5][6].walls.N = false; // open left at depth 1
      const scan = scanCorridor(grid, 5, 5, 'E', 5);
      expect(scan.steps[1].left).toBe('passage');
      expect(scan.steps[1].right).toBe('wall');
    }
    // Facing N: left = dungeon W, right = dungeon E
    {
      const grid = closedGrid(10, 10);
      carve(grid, 5, 5, 3, 'N');
      grid[4][5].walls.W = false; // open left at depth 1
      const scan = scanCorridor(grid, 5, 5, 'N', 5);
      expect(scan.steps[1].left).toBe('passage');
      expect(scan.steps[1].right).toBe('wall');
    }
    // Facing S: left = dungeon E, right = dungeon W
    {
      const grid = closedGrid(10, 10);
      carve(grid, 5, 5, 3, 'S');
      grid[6][5].walls.E = false; // open left at depth 1
      const scan = scanCorridor(grid, 5, 5, 'S', 5);
      expect(scan.steps[1].left).toBe('passage');
      expect(scan.steps[1].right).toBe('wall');
    }
    // Facing W: left = dungeon S, right = dungeon N
    {
      const grid = closedGrid(10, 10);
      carve(grid, 5, 5, 3, 'W');
      grid[5][4].walls.S = false; // open left at depth 1
      const scan = scanCorridor(grid, 5, 5, 'W', 5);
      expect(scan.steps[1].left).toBe('passage');
      expect(scan.steps[1].right).toBe('wall');
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

  it('a closed door directly ahead stops the scan, same as a wall would', () => {
    const grid = closedGrid(10, 10);
    carve(grid, 5, 5, 4, 'E'); // open for 3 steps
    const lookup = lookupFrom({ '8,5,E': 'door-closed' });
    const scan = scanCorridor(grid, 5, 5, 'E', 10, lookup);
    expect(scan.endCapped).toBe(true);
    expect(scan.steps[scan.steps.length - 1].front).toBe('door-closed');
  });

  it('an open door directly ahead does not stop the scan', () => {
    const grid = closedGrid(15, 15);
    carve(grid, 5, 5, 6, 'E'); // open for 5 steps
    const lookup = lookupFrom({ '8,5,E': 'door-open' });
    const scan = scanCorridor(grid, 5, 5, 'E', 4, lookup);
    // maxDepth (4) is reached before the door stops anything.
    expect(scan.endCapped).toBe(false);
    expect(scan.steps).toHaveLength(4);
  });

  it('a secret wall blocks the scan exactly like a plain wall', () => {
    const gridSecret = closedGrid(10, 10);
    carve(gridSecret, 5, 5, 4, 'E');
    const secretLookup = lookupFrom({ '8,5,E': 'secret' });
    const secretScan = scanCorridor(gridSecret, 5, 5, 'E', 10, secretLookup);

    const gridWall = closedGrid(10, 10);
    carve(gridWall, 5, 5, 4, 'E');
    const wallScan = scanCorridor(gridWall, 5, 5, 'E', 10);

    expect(secretScan.endCapped).toBe(true);
    expect(secretScan.steps).toHaveLength(wallScan.steps.length);
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

    it('classifies a crossroads (four-way intersection) when both sides are open and forward continues', () => {
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

    it('a closed door counts as blocking for topology purposes (turn-left, not left-passage)', () => {
      const grid = closedGrid(10, 10);
      carve(grid, 5, 5, 3, 'E');
      grid[5][7].walls.N = false; // left open at final cell
      grid[5][7].walls.S = false; // right also open at final cell, but...
      const lookup = lookupFrom({ '7,5,S': 'door-closed' }); // ...it's a closed door
      const scan = scanCorridor(grid, 5, 5, 'E', 5, lookup);
      const lastStep = scan.steps[scan.steps.length - 1];
      expect(lastStep.right).toBe('door-closed');
      expect(lastStep.kind).toBe('turn-left'); // right (door) counts as blocked, left (open) does not
    });
  });

  describe('EdgeInfoLookup overrides', () => {
    it('marks a door only where the lookup says so, and only affects that boundary', () => {
      const grid = closedGrid(10, 10);
      carve(grid, 5, 5, 4, 'E');
      grid[5][6].walls.N = false; // open left at depth 1
      const lookup = lookupFrom({ '6,5,N': 'door-open' });

      const scan = scanCorridor(grid, 5, 5, 'E', 5, lookup);
      expect(scan.steps[1].left).toBe('door-open');
      expect(scan.steps[1].right).toBe('wall');
    });

    it('an undefined lookup result falls back to the plain wall boolean', () => {
      const grid = closedGrid(10, 10);
      carve(grid, 5, 5, 4, 'E');
      const scan = scanCorridor(grid, 5, 5, 'E', 5, () => undefined);
      for (const step of scan.steps) {
        expect(['wall', 'passage']).toContain(step.left);
        expect(['wall', 'passage']).toContain(step.right);
        expect(['wall', 'passage']).toContain(step.front);
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
    const allowed = new Set([' ', '+', '-', '|', '/', '\\', '^', '*', '=', '[', ']', '~', '#', ':', '.']);
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

  it('fills a closed side door edge-to-edge with a bracket panel', () => {
    const grid = closedGrid(10, 10);
    carve(grid, 5, 5, 4, 'E');
    grid[5][6].walls.N = false; // open left at depth 1
    const lookup = lookupFrom({ '6,5,N': 'door-closed' });

    const withDoor = renderCorridorView(grid, 5, 5, 'E', {}, lookup).join('\n');
    const withoutDoor = renderCorridorView(grid, 5, 5, 'E').join('\n');

    expect(withDoor).toContain('[');
    expect(withDoor).not.toBe(withoutDoor);
  });

  it('renders a closed side door differently from a plain open passage on the same side', () => {
    const gridPassage = closedGrid(10, 10);
    carve(gridPassage, 5, 5, 4, 'E');
    gridPassage[5][6].walls.N = false;
    const passageView = renderCorridorView(gridPassage, 5, 5, 'E').join('\n');

    const gridDoor = closedGrid(10, 10);
    carve(gridDoor, 5, 5, 4, 'E');
    gridDoor[5][6].walls.N = false;
    const doorLookup = lookupFrom({ '6,5,N': 'door-closed' });
    const doorView = renderCorridorView(gridDoor, 5, 5, 'E', {}, doorLookup).join('\n');

    expect(doorView).not.toBe(passageView);
  });

  it('renders a door directly ahead as an inset panel, distinct from a plain dead-end wall', () => {
    const grid = closedGrid(10, 10);
    carve(grid, 5, 5, 4, 'E'); // open for 3 steps
    const lookup = lookupFrom({ '8,5,E': 'door-closed' });
    const doorAheadView = renderCorridorView(grid, 5, 5, 'E', {}, lookup).join('\n');

    const gridWall = closedGrid(10, 10);
    carve(gridWall, 5, 5, 4, 'E');
    const wallAheadView = renderCorridorView(gridWall, 5, 5, 'E').join('\n');

    expect(doorAheadView).not.toBe(wallAheadView);
    // The inset panel's corners/edges use the same primitives as everywhere else.
    expect(doorAheadView).toContain('+');
    expect(doorAheadView).toContain('|');
  });

  it('a secret wall renders byte-for-byte identical to a plain wall', () => {
    const gridWall = closedGrid(10, 10);
    carve(gridWall, 5, 5, 4, 'E');
    const wallView = renderCorridorView(gridWall, 5, 5, 'E').join('\n');

    const gridSecret = closedGrid(10, 10);
    carve(gridSecret, 5, 5, 4, 'E');
    const secretLookup = lookupFrom({ '8,5,E': 'secret' });
    const secretView = renderCorridorView(gridSecret, 5, 5, 'E', {}, secretLookup).join('\n');

    expect(secretView).toBe(wallView);
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

  it('the entity-marker seam is a no-op by default (architecture only, not new gameplay)', () => {
    const grid = closedGrid(10, 10);
    carve(grid, 5, 5, 4, 'E');
    const withDefaultArgs = renderCorridorView(grid, 5, 5, 'E').join('\n');
    const withExplicitEmptyList = renderCorridorView(grid, 5, 5, 'E', {}, undefined, []).join('\n');
    expect(withExplicitEmptyList).toBe(withDefaultArgs);
  });

  it('draws an entity marker glyph at the requested depth when one is supplied', () => {
    const grid = closedGrid(10, 10);
    carve(grid, 5, 5, 4, 'E');
    const withoutEntity = renderCorridorView(grid, 5, 5, 'E').join('\n');
    const withEntity = renderCorridorView(grid, 5, 5, 'E', {}, undefined, [{ depth: 0, pattern: ['@'] }]).join('\n');
    expect(withEntity).not.toBe(withoutEntity);
    expect(withEntity).toContain('@');
  });

  it('draws a multi-row entity pattern, treating spaces as transparent', () => {
    const grid = closedGrid(10, 10);
    carve(grid, 5, 5, 4, 'E');
    const view = renderCorridorView(grid, 5, 5, 'E', {}, undefined, [
      { depth: 0, pattern: [...CONTENT_PATTERNS.altar] },
    ]);
    const text = view.join('\n');
    // The altar's own glyphs appear...
    expect(text).toContain('+-+');
    expect(text).toContain('|+|');
    // ...and a space in the pattern didn't blank out the corridor
    // underneath it — the frame's own floor/ceiling '-' should still be
    // present somewhere nearby (i.e. the whole view isn't just the pattern).
    expect(view.some(row => row.includes('-'))).toBe(true);
  });

  it('every named content pattern only uses the approved character set', () => {
    const allowed = new Set(['+', '-', '|', '/', '\\', '~', '=', '[', ']', '<', '>', ' ']);
    for (const pattern of Object.values(CONTENT_PATTERNS)) {
      for (const row of pattern) {
        for (const ch of row) expect(allowed.has(ch)).toBe(true);
      }
    }
  });

  it('renders the same view every time for the same position (torches are deterministic, not random)', () => {
    const grid = closedGrid(30, 30);
    carve(grid, 5, 5, 10, 'E');
    const view1 = renderCorridorView(grid, 5, 5, 'E').join('\n');
    const view2 = renderCorridorView(grid, 5, 5, 'E').join('\n');
    expect(view1).toBe(view2);
  });

  it('places torches sparsely — some solid walls get one, most do not', () => {
    // Sample many different corridor positions (all straight, fully
    // walled corridors so every side segment is a torch candidate) and
    // count how many end up with a '^' somewhere in the view.
    let withTorch = 0;
    const samples = 60;
    for (let i = 0; i < samples; i++) {
      const x = 2 + i;
      const y = 2 + (i % 7);
      const grid = closedGrid(samples + 10, 10);
      carve(grid, x, y, 5, 'E');
      const view = renderCorridorView(grid, x, y, 'E').join('\n');
      if (view.includes('^')) withTorch++;
    }
    // Sparse means "some, not none, and not most": comfortably between 0
    // and the full sample count.
    expect(withTorch).toBeGreaterThan(0);
    expect(withTorch).toBeLessThan(samples);
  });

  it('a secret wall renders identically to a plain wall, including torch placement, at every position', () => {
    // Torch placement only depends on (x, y), not edge type — so forcing
    // every side boundary along the scan to resolve as 'secret' instead of
    // the plain wall default must produce byte-identical output at every
    // position, sampling enough (x,y) pairs to exercise both the "torch
    // here" and "no torch here" branches of the hash.
    const secretSides = (_x: number, _y: number, dir: string) =>
      (dir === 'N' || dir === 'S') ? ('secret' as const) : undefined;

    for (let x = 2; x < 12; x++) {
      for (let y = 2; y < 12; y++) {
        const gridWall = closedGrid(20, 20);
        carve(gridWall, x, y, 4, 'E');
        const wallView = renderCorridorView(gridWall, x, y, 'E').join('\n');

        const gridSecret = closedGrid(20, 20);
        carve(gridSecret, x, y, 4, 'E');
        const secretView = renderCorridorView(gridSecret, x, y, 'E', {}, secretSides).join('\n');

        expect(secretView).toBe(wallView);
      }
    }
  });
});

// ─── Required test cases A-L ────────────────────────────────────────────────
// One test per scenario named in the spec, asserting on the resolved
// EdgeType/StepKind data (the ground truth the renderer draws from) so each
// case is verified independently of the exact ASCII art.

describe('Required test cases', () => {
  it('A. straight corridor, no branches', () => {
    const grid = closedGrid(10, 10);
    carve(grid, 5, 5, 4, 'E');
    const scan = scanCorridor(grid, 5, 5, 'E', 10);
    expect(scan.steps[0].kind).toBe('straight');
    expect(scan.steps[1].kind).toBe('straight');
    expect(scan.steps[scan.steps.length - 1].kind).toBe('dead-end');
  });

  it('B. corridor with right passage one square ahead', () => {
    const grid = closedGrid(10, 10);
    carve(grid, 5, 5, 4, 'E');
    grid[5][5].walls.S = false; // right side of the player's own cell (depth 0)
    const scan = scanCorridor(grid, 5, 5, 'E', 10);
    expect(scan.steps[0].right).toBe('passage');
    expect(scan.steps[0].kind).toBe('right-passage');
  });

  it('C. corridor with left passage two squares ahead', () => {
    const grid = closedGrid(10, 10);
    carve(grid, 5, 5, 4, 'E');
    grid[5][7].walls.N = false; // left side, depth 2
    const scan = scanCorridor(grid, 5, 5, 'E', 10);
    expect(scan.steps[2].left).toBe('passage');
    expect(scan.steps[2].kind).toBe('left-passage');
  });

  it('D. right-side closed door one square ahead', () => {
    const grid = closedGrid(10, 10);
    carve(grid, 5, 5, 4, 'E');
    grid[6][5].walls.S = false; // right side open at depth 1
    const lookup = lookupFrom({ '6,5,S': 'door-closed' });
    const scan = scanCorridor(grid, 5, 5, 'E', 10, lookup);
    expect(scan.steps[1].right).toBe('door-closed');
  });

  it('E. left-side closed door two squares ahead', () => {
    const grid = closedGrid(10, 10);
    carve(grid, 5, 5, 4, 'E');
    grid[7][5].walls.N = false; // left side open at depth 2
    const lookup = lookupFrom({ '7,5,N': 'door-closed' });
    const scan = scanCorridor(grid, 5, 5, 'E', 10, lookup);
    expect(scan.steps[2].left).toBe('door-closed');
  });

  it('F. closed door directly ahead', () => {
    const grid = closedGrid(10, 10);
    carve(grid, 5, 5, 5, 'E');
    const lookup = lookupFrom({ '8,5,E': 'door-closed' });
    const scan = scanCorridor(grid, 5, 5, 'E', 10, lookup);
    expect(scan.endCapped).toBe(true);
    expect(scan.steps[scan.steps.length - 1].front).toBe('door-closed');

    const view = renderCorridorView(grid, 5, 5, 'E', {}, lookup).join('\n');
    const plainWallGrid = closedGrid(10, 10);
    carve(plainWallGrid, 5, 5, 5, 'E');
    const plainWallView = renderCorridorView(plainWallGrid, 5, 5, 'E').join('\n');
    expect(view).not.toBe(plainWallView);
  });

  it('G. open doorway directly ahead', () => {
    const grid = closedGrid(15, 15);
    carve(grid, 5, 5, 6, 'E');
    const lookup = lookupFrom({ '8,5,E': 'door-open' });
    const scan = scanCorridor(grid, 5, 5, 'E', 4, lookup);
    // The open door doesn't block sight, so the scan runs to maxDepth, not
    // stopping at the door the way it would for a wall or closed door.
    expect(scan.endCapped).toBe(false);
    expect(scan.steps.some(s => s.front === 'door-open')).toBe(true);
  });

  it('H. T intersection', () => {
    const grid = closedGrid(10, 10);
    carve(grid, 5, 5, 3, 'E');
    grid[5][7].walls.N = false;
    grid[5][7].walls.S = false;
    const scan = scanCorridor(grid, 5, 5, 'E', 5);
    expect(scan.steps[scan.steps.length - 1].kind).toBe('t-junction');
  });

  it('I. four-way intersection', () => {
    const grid = closedGrid(10, 10);
    carve(grid, 5, 5, 5, 'E');
    grid[5][7].walls.N = false;
    grid[5][7].walls.S = false;
    const scan = scanCorridor(grid, 5, 5, 'E', 5);
    // Forward still open at that depth, both sides open -> crossroads, not
    // a T (which requires forward to be blocked).
    expect(scan.steps[2].kind).toBe('crossroads');
  });

  it('J. side passages at multiple depths', () => {
    const grid = closedGrid(10, 10);
    carve(grid, 5, 5, 5, 'E');
    grid[5][5].walls.S = false; // right passage at depth 0
    grid[5][7].walls.N = false; // left passage at depth 2
    const scan = scanCorridor(grid, 5, 5, 'E', 10);
    expect(scan.steps[0].right).toBe('passage');
    expect(scan.steps[0].kind).toBe('right-passage');
    expect(scan.steps[2].left).toBe('passage');
    expect(scan.steps[2].kind).toBe('left-passage');
  });

  it('K. side door plus passage visible at different depths', () => {
    const grid = closedGrid(10, 10);
    carve(grid, 5, 5, 5, 'E');
    grid[5][5].walls.S = false; // right side open at depth 0 -> door
    grid[5][7].walls.N = false; // left side open at depth 2 -> plain passage
    const lookup = lookupFrom({ '5,5,S': 'door-closed' });
    const scan = scanCorridor(grid, 5, 5, 'E', 10, lookup);
    expect(scan.steps[0].right).toBe('door-closed');
    expect(scan.steps[2].left).toBe('passage');

    const view = renderCorridorView(grid, 5, 5, 'E', {}, lookup).join('\n');
    expect(view).toContain(']'); // the door bracket on the right side
  });

  it('L. secret door remains visually identical to wall until discovered', () => {
    const grid = closedGrid(10, 10);
    carve(grid, 5, 5, 4, 'E');
    // Undiscovered: the lookup reports 'secret'.
    const hiddenLookup = lookupFrom({ '8,5,E': 'secret' });
    const hiddenView = renderCorridorView(grid, 5, 5, 'E', {}, hiddenLookup).join('\n');

    const plainWallGrid = closedGrid(10, 10);
    carve(plainWallGrid, 5, 5, 4, 'E');
    const plainWallView = renderCorridorView(plainWallGrid, 5, 5, 'E').join('\n');

    expect(hiddenView).toBe(plainWallView); // indistinguishable while hidden

    // Once "discovered" (the game's own discovery rules would flip what the
    // lookup reports, not this module), it renders differently.
    const discoveredLookup = lookupFrom({ '8,5,E': 'door-closed' });
    const discoveredView = renderCorridorView(grid, 5, 5, 'E', {}, discoveredLookup).join('\n');
    expect(discoveredView).not.toBe(hiddenView);
  });
});

describe('Wall materials and carvings', () => {
  it('a wall is the same material and carving seen from either side', () => {
    for (let level = 1; level <= 7; level++) {
      for (let x = 1; x < 30; x++) for (let y = 1; y < 30; y++) {
        // The north wall of (x,y), seen facing east (on the left) and facing west from (x,y-1) (on the left).
        const a = { level, facing: 'E' as const }, b = { level, facing: 'W' as const };
        expect(wallMaterial(a, x, y, 'left')).toBe(wallMaterial(b, x, y - 1, 'left'));
        expect(wallCarving(a, x, y, 'left')).toEqual(wallCarving(b, x, y - 1, 'left'));
      }
    }
  });

  it('every level mixes materials, and some walls bear carvings', () => {
    for (let level = 1; level <= 7; level++) {
      const mats = new Set<string>();
      let carved = 0;
      for (let x = 0; x < 40; x++) for (let y = 0; y < 40; y++) {
        mats.add(wallMaterial({ level, facing: 'N' }, x, y, 'left'));
        if (wallCarving({ level, facing: 'N' }, x, y, 'left')) carved++;
      }
      expect(mats.size).toBeGreaterThan(1);
      expect(carved / 1600).toBeGreaterThan(0.06);
      expect(carved / 1600).toBeLessThan(0.18);
    }
  });

  it('without a level, walls stay plain stone with no carvings', () => {
    expect(wallMaterial({}, 3, 4, 'left')).toBe('stone');
    expect(wallCarving({}, 3, 4, 'front')).toBeNull();
  });

  it('styled views keep their size and use plain printable characters', () => {
    const grid = closedGrid(40, 40);
    carve(grid, 5, 5, 20, 'E');
    for (let level = 1; level <= 7; level++) {
      for (let x = 5; x < 20; x++) {
        const view = renderCorridorView(grid, x, 5, 'E', { level });
        expect(view).toHaveLength(CORRIDOR_VIEW_DEFAULTS.HEIGHT);
        for (const row of view) {
          expect(row.length).toBe(CORRIDOR_VIEW_DEFAULTS.WIDTH);
          expect(/^[\x20-\x7e]*$/.test(row)).toBe(true);
        }
      }
    }
  });
});
