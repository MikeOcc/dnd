import { describe, it, expect } from 'vitest';
import { generateLevel, floodFill, canMove } from '../src/core/dungeon.js';
import { DUNGEON } from '../src/core/config.js';

describe('Dungeon generation', () => {
  it('generates a level with correct dimensions', () => {
    const lvl = generateLevel(1, 12345);
    expect(lvl.width).toBe(DUNGEON.WIDTH);
    expect(lvl.height).toBe(DUNGEON.HEIGHT);
    expect(lvl.cells).toHaveLength(DUNGEON.HEIGHT);
    expect(lvl.cells[0]).toHaveLength(DUNGEON.WIDTH);
  });

  it('has an entrance cell', () => {
    const lvl = generateLevel(1, 22222);
    expect(lvl.entrance).toBeDefined();
    expect(lvl.entrance.x).toBeGreaterThanOrEqual(0);
    expect(lvl.entrance.y).toBeGreaterThanOrEqual(0);
  });

  it('has an exit cell (except level 7)', () => {
    const lvl6 = generateLevel(6, 33333);
    expect(lvl6.exit).not.toBeNull();

    const lvl7 = generateLevel(7, 44444);
    // Level 7 may have no exit (no ladder down)
    // entrance should still be set
    expect(lvl7.entrance).toBeDefined();
  });

  it('produces enough reachable cells', () => {
    const lvl = generateLevel(1, 99999);
    const reachable = floodFill(lvl.cells, lvl.entrance.x, lvl.entrance.y);
    expect(reachable.size).toBeGreaterThanOrEqual(DUNGEON.MIN_REACHABLE);
  });

  it('is deterministic with the same seed', () => {
    const l1 = generateLevel(2, 54321);
    const l2 = generateLevel(2, 54321);
    expect(l1.entrance).toEqual(l2.entrance);
    expect(l1.cells[10][10].walls).toEqual(l2.cells[10][10].walls);
  });

  it('is different with different seeds', () => {
    const l1 = generateLevel(1, 1);
    const l2 = generateLevel(1, 2);
    // At least some cells should differ
    let differ = false;
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        if (JSON.stringify(l1.cells[y][x].walls) !== JSON.stringify(l2.cells[y][x].walls)) {
          differ = true;
        }
      }
    }
    expect(differ).toBe(true);
  });

  it('wall symmetry: if cell A has east wall blocked, cell B (east) has west wall blocked', () => {
    const lvl = generateLevel(3, 77777);
    const grid = lvl.cells;

    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length - 1; x++) {
        const cellA = grid[y][x];
        const cellB = grid[y][x + 1];
        expect(cellA.walls.E).toBe(cellB.walls.W);
      }
    }

    for (let y = 0; y < grid.length - 1; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        const cellA = grid[y][x];
        const cellB = grid[y + 1][x];
        expect(cellA.walls.S).toBe(cellB.walls.N);
      }
    }
  });

  it('canMove returns false when wall is present', () => {
    const lvl = generateLevel(1, 55555);
    const grid = lvl.cells;
    // Find a cell with a north wall and verify canMove returns false
    let foundWalledCell = false;
    for (let y = 1; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        if (grid[y][x].walls.N) {
          expect(canMove(grid, x, y, 'N')).toBe(false);
          foundWalledCell = true;
          break;
        }
      }
      if (foundWalledCell) break;
    }
    expect(foundWalledCell).toBe(true);
  });

  it('canMove returns true when passage is open', () => {
    const lvl = generateLevel(1, 66666);
    const grid = lvl.cells;
    // Find a cell with an open passage
    let foundOpen = false;
    for (let y = 1; y < grid.length - 1; y++) {
      for (let x = 1; x < grid[y].length - 1; x++) {
        if (!grid[y][x].walls.N) {
          expect(canMove(grid, x, y, 'N')).toBe(true);
          foundOpen = true;
          break;
        }
      }
      if (foundOpen) break;
    }
    expect(foundOpen).toBe(true);
  });

  it('contents include a ladder-down on levels 1-6', () => {
    const lvl = generateLevel(2, 11111);
    const contents = new Map(lvl.contents.map(c => [c.key, c.value]));
    const hasLadder = [...contents.values()].some(v => v.type === 'ladder-down');
    expect(hasLadder).toBe(true);
  });
});
