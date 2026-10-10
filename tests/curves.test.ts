// Curved spaces: rounded bends and corners, and round rooms, on levels 4 and 7.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { generateLevel, deserializeLevel, floodFill } from '../src/core/dungeon.js';
import { roundRooms, curvedCorner, curvedArea, CURVED_LEVELS } from '../src/core/curves.js';
import { mapAreas } from '../src/core/regions.js';
import { createMemoryDb } from '../src/database/database.js';
import { Repository } from '../src/database/repositories.js';
import { GameEngine } from '../src/core/game-engine.js';

const rock = (c: { walls: { N: boolean; E: boolean; S: boolean; W: boolean } }) => c.walls.N && c.walls.E && c.walls.S && c.walls.W;

describe('curved spaces', () => {
  it('a square walled on two neighbouring sides is a curve, on the curved levels only', () => {
    const cell = { x: 0, y: 0, walls: { N: true, E: true, S: false, W: false } };
    expect(curvedCorner(4, cell)).toBe('NE');
    expect(curvedCorner(7, { ...cell, walls: { N: false, E: false, S: true, W: true } })).toBe('SW');
    expect(curvedCorner(1, cell)).toBeNull();
    expect(curvedCorner(4, { ...cell, walls: { N: true, E: false, S: true, W: false } })).toBeNull();   // a straight passage
    expect(CURVED_LEVELS).toEqual([4, 7]);
  });

  it('elsewhere, some rooms and passages curve, but not most', () => {
    let curved = 0, all = 0;
    for (const level of [1, 2, 3, 5, 6]) for (let s = 1; s <= 6; s++) {
      const { grid } = deserializeLevel(generateLevel(level, s * 7919));
      for (const a of mapAreas(grid).areas) { all++; if (curvedArea(level, a)) curved++; }
    }
    expect(curved / all).toBeGreaterThan(0.12);
    expect(curved / all).toBeLessThan(0.4);
  });

  it('rounds rooms without losing anything: every square still reachable, nothing lying anywhere filled in', () => {
    for (const level of [4, 7]) for (let s = 1; s <= 10; s++) {
      const { grid, entrance, exit, contents } = deserializeLevel(generateLevel(level, s * 104729));
      const before = floodFill(grid, entrance.x, entrance.y);
      const rooms = mapAreas(grid).areas.filter(a => a.kind === 'room').length;
      roundRooms(grid, contents, [entrance, exit], level);
      const after = floodFill(grid, entrance.x, entrance.y);
      // Squares only ever become rock; whatever is still open is still reachable.
      let open = 0;
      for (const row of grid) for (const c of row) if (!rock(c)) { open++; expect(before.has(`${c.x},${c.y}`) || !after.has(`${c.x},${c.y}`)).toBe(true); }
      expect(after.size).toBe(open);
      for (const k of contents.keys()) { const [x, y] = k.split(',').map(Number); expect(rock(grid[y][x])).toBe(false); }
      expect(mapAreas(grid).areas.filter(a => a.kind === 'room').length).toBe(rooms);
      expect(before.size).toBeGreaterThan(after.size);   // something was rounded
    }
  });
});

describe('curved spaces in the game', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let db: any;
  beforeEach(() => { db = createMemoryDb(); });
  afterEach(() => { db.close(); });

  it('the painted view is told which squares curve, and the map draws them', () => {
    const e = new GameEngine(new Repository(db)) as any;
    e.startNameEntry(); e.submitName('Curves'); e.acceptCharacter(); e.dismissLevelIntro();
    e.char.dungeonLevel = 4; e.loadLevelIntoCache(4); e.phase = 'playing';
    const lvl = e.getLevel(4);
    let found = false;
    for (const row of lvl.grid) for (const c of row) {
      if (found || !curvedCorner(4, c)) continue;
      e.char.x = c.x; e.char.y = c.y;
      const cell = e.getState().scene.cells.find((s: number[]) => s[0] === c.x && s[1] === c.y);
      expect(cell[7]).toBeGreaterThan(0);
      found = true;
    }
    expect(found).toBe(true);
    e.dungeonState.revealedLevels.add(4); e.mapShowWhole = true; e.mapFull = true;
    expect(e.renderMap().messages.join('\n')).toMatch(/[╭╮╰╯]/);
  });

  it('a character saved inside what is now rock steps out onto the floor', () => {
    const e = new GameEngine(new Repository(db)) as any;
    e.startNameEntry(); e.submitName('Stuck'); e.acceptCharacter(); e.dismissLevelIntro();
    const grid = e.getLevel(1).grid;
    const r = grid.flat().find((c: { x: number; y: number; walls: { N: boolean; E: boolean; S: boolean; W: boolean } }) => rock(c) && c.x > 2 && c.y > 2 && c.x < 77 && c.y < 57);
    e.char.x = r.x; e.char.y = r.y;
    e.getState();
    expect(rock(grid[e.char.y][e.char.x])).toBe(false);
  });
});

describe('the drawn map', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let db: any;
  beforeEach(() => { db = createMemoryDb(); });
  afterEach(() => { db.close(); });

  it('is sent each shown square\'s walls exactly as the level has them, so it always matches', () => {
    const e = new GameEngine(new Repository(db)) as any;
    e.startNameEntry(); e.submitName('Mapper'); e.acceptCharacter(); e.dismissLevelIntro();
    for (const level of [1, 4, 5, 7]) {
      e.char.dungeonLevel = level; e.loadLevelIntoCache(level); e.phase = 'playing';
      e.dungeonState.revealedLevels.add(level); e.mapShowWhole = true; e.mapFull = true;
      const lvl = e.getLevel(level);
      const d = e.renderMap().mapData;
      let checked = 0;
      d.walls.forEach((row: string, y: number) => [...row].forEach((h: string, x: number) => {
        if (h === ' ') return;
        const c = lvl.grid[d.y0 + y][d.x0 + x];
        expect(parseInt(h, 16)).toBe((c.walls.N ? 1 : 0) | (c.walls.E ? 2 : 0) | (c.walls.S ? 4 : 0) | (c.walls.W ? 8 : 0));
        checked++;
      }));
      expect(checked).toBeGreaterThan(300);
      if (level === 5 && lvl.gaol) expect(d.bars.join('').replace(/[ 0]/g, '').length).toBeGreaterThan(0);   // (a rare level has no room for the gaol)
    }
  });
});
