import { describe, it, expect } from 'vitest';
import { generateLevel, deserializeLevel, canMove } from '../src/core/dungeon.js';
import { mapAreas, areaAtCell } from '../src/core/regions.js';
import { describeArea, roomName } from '../src/content/area-text.js';

const isRock = (c: { walls: { N: boolean; E: boolean; S: boolean; W: boolean } }) => c.walls.N && c.walls.E && c.walls.S && c.walls.W;

describe('Rooms and corridors', () => {
  for (const levelNum of [1, 4, 7]) {
    it(`splits every open square of level ${levelNum} into rooms and corridors`, () => {
      const { grid } = deserializeLevel(generateLevel(levelNum, 1234 + levelNum));
      const map = mapAreas(grid);
      const rooms = map.areas.filter(a => a.kind === 'room');
      expect(rooms.length).toBeGreaterThan(5);
      expect(map.areas.some(a => a.kind === 'corridor')).toBe(true);
      for (let y = 0; y < grid.length; y++) for (let x = 0; x < grid[0].length; x++) {
        expect(areaAtCell(map, x, y) === undefined).toBe(isRock(grid[y][x]));
      }
      // Rooms are at least the generator's minimum size, and every room has a way out.
      for (const r of rooms) {
        expect(r.cells).toBeGreaterThanOrEqual(25);
        expect(r.exits).toBeGreaterThan(0);
      }
    });
  }

  it('corridor squares are one wide: a corridor never holds an open 2x2 block', () => {
    const { grid } = deserializeLevel(generateLevel(3, 99));
    const map = mapAreas(grid);
    for (let y = 0; y + 1 < grid.length; y++) for (let x = 0; x + 1 < grid[0].length; x++) {
      const open = canMove(grid, x, y, 'E') && canMove(grid, x, y, 'S') && canMove(grid, x + 1, y + 1, 'N') && canMove(grid, x + 1, y + 1, 'W');
      if (open) expect(areaAtCell(map, x, y)!.kind).toBe('room');
    }
  });
});

describe('Area descriptions', () => {
  const room = (w: number, h: number, exits = 2) =>
    ({ id: '1,1', kind: 'room' as const, cells: w * h, minX: 0, maxX: w - 1, minY: 0, maxY: h - 1, exits, junctions: 0, straight: false });

  it('describes a room by size, shape and exits, in the level\'s own words', () => {
    const lines = describeArea(3, room(12, 12, 3), true);
    expect(lines[0]).toBe('You are in a great ossuary.');
    expect(lines).toContain('There are three ways out.');
    expect(describeArea(6, room(20, 4), true)[0]).toBe('You are in a long flooded channel.');
    expect(describeArea(6, room(20, 4), true)[1]).toContain('east to west');
    expect(roomName(1, room(20, 20))).toBe('a vast pillared undercroft');
  });

  it('gives a short reminder on a return visit', () => {
    expect(describeArea(4, room(5, 5), false)).toEqual(['You are back in the narrow grotto.']);
  });

  it('only mentions corridors worth a word, and only the first time', () => {
    const corridor = (cells: number, straight: boolean) =>
      ({ id: '2,2', kind: 'corridor' as const, cells, minX: 0, maxX: straight ? 0 : 3, minY: 0, maxY: cells - 1, exits: 2, junctions: 0, straight });
    expect(describeArea(1, corridor(3, true), true)).toEqual([]);
    expect(describeArea(1, corridor(20, true), true)[0]).toBe('A very long stone passage runs north to south, farther than your light can follow.');
    expect(describeArea(1, corridor(8, false), true)[0]).toBe('A winding stone passage twists away into the dark.');
    expect(describeArea(1, corridor(20, true), false)).toEqual([]);
  });
});
