// The old gaol on level 5: cells behind iron bars, seen through but not entered.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { generateLevel, deserializeLevel, floodFill } from '../src/core/dungeon.js';
import { buildGaol, GAOL } from '../src/core/gaol.js';
import { createMemoryDb } from '../src/database/database.js';
import { Repository } from '../src/database/repositories.js';
import { GameEngine } from '../src/core/game-engine.js';

describe('the old gaol', () => {
  it('is cut into the rock of level 5, reached by its aisle, its cells shut behind bars', () => {
    for (let s = 1; s <= 12; s++) {
      const seed = s * 7919;
      const { grid, entrance, contents } = deserializeLevel(generateLevel(5, seed));
      const before = floodFill(grid, entrance.x, entrance.y);
      const g = buildGaol(grid, entrance, contents, seed)!;
      expect(g).not.toBeNull();
      const after = floodFill(grid, entrance.x, entrance.y);
      for (const c of before) expect(after.has(c)).toBe(true);           // nothing cut off
      for (const p of g.aisle) expect(after.has(`${p.x},${p.y}`)).toBe(true);   // the aisle is reachable...
      for (const cell of g.cells) for (const p of cell) expect(after.has(`${p.x},${p.y}`)).toBe(false);   // ...the cells are not
      expect(g.cells.length).toBe(GAOL.CELLS_A_SIDE * 2);
      // Every barred edge is barred from both sides, and is a wall to walk into.
      for (const b of g.bars) {
        const [x, y, d] = b.split(',');
        expect(grid[+y][+x].walls[d as 'N']).toBe(true);
      }
      expect(g.bars.size).toBe(GAOL.CELLS_A_SIDE * 2 * 2 * 2);
      // Chests locked away in cells.
      expect(g.chests.length).toBe(GAOL.CHESTS);
      for (const p of g.chests) expect(contents.get(`${p.x},${p.y}`)?.type).toBe('chest');
    }
  });
});

describe('the old gaol in the game', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let db: any;
  beforeEach(() => { db = createMemoryDb(); });
  afterEach(() => { db.close(); });

  function inTheGaol() {
    const e = new GameEngine(new Repository(db)) as any;
    e.startNameEntry(); e.submitName('Gaoler'); e.acceptCharacter(); e.dismissLevelIntro();
    e.char.dungeonLevel = 5; e.loadLevelIntoCache(5); e.phase = 'playing';
    const lvl = e.getLevel(5);
    return { e, lvl, g: lvl.gaol };
  }

  it('the bars stop you, with a word about the lock', () => {
    const { e, g } = inTheGaol();
    const [bx, by, d] = [...g.bars][0].split(',');
    e.char.x = +bx; e.char.y = +by;
    const s = e.tryMove(d, 'forward');
    expect(s.messages.join(' ')).toMatch(/Iron bars block the way/);
    expect({ x: e.char.x, y: e.char.y }).toEqual({ x: +bx, y: +by });
  });

  it('the views are told where the bars are; your light reaches into the cells', () => {
    const { e, g } = inTheGaol();
    const p = g.aisle[3];
    e.char.x = p.x; e.char.y = p.y;
    const s = e.getState();
    expect(s.scene.cells.find((c: number[]) => c[0] === p.x && c[1] === p.y)[8]).toBeGreaterThan(0);
    e.lightAround();
    const inside = g.cells.flat().filter((q: { x: number; y: number }) => e.dungeonState.visitedCells.has(`5:${q.x},${q.y}`));
    expect(inside.length).toBeGreaterThan(0);
  });

  it('the first time into the aisle, you are told what it is', () => {
    const { e, g } = inTheGaol();
    e.char.x = g.aisle[2].x; e.char.y = g.aisle[2].y; e.lastArea = null;
    expect(e.enterArea().join(' ')).toMatch(/old gaol/);
  });
});
