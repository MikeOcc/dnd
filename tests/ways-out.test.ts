// "Ways out": which way the openings of the room you're in lie, from where
// you stand and the way you face; and how that's said.
import { describe, it, expect } from 'vitest';
import { mapAreas, waysOut, bearingsPhrase } from '../src/core/regions.js';
import type { DungeonCell } from '../src/core/types.js';

/** A 5×5 grid of rock, with a 3×3 room (x,y 1..3) and a doorway north of it
 * at (2,1) into a corridor square (2,0). */
function roomWithNorthDoor(): DungeonCell[][] {
  const g: DungeonCell[][] = Array.from({ length: 5 }, (_, y) => Array.from({ length: 5 }, (_, x) => ({ x, y, walls: { N: true, E: true, S: true, W: true } })));
  const open = (x: number, y: number, d: 'N' | 'E' | 'S' | 'W') => {
    const [dx, dy, back] = { N: [0, -1, 'S'], E: [1, 0, 'W'], S: [0, 1, 'N'], W: [-1, 0, 'E'] }[d] as [number, number, 'N' | 'E' | 'S' | 'W'];
    g[y][x].walls[d] = false; g[y + dy][x + dx].walls[back] = false;
  };
  for (let y = 1; y <= 3; y++) for (let x = 1; x <= 3; x++) { if (x < 3) open(x, y, 'E'); if (y < 3) open(x, y, 'S'); }
  open(2, 1, 'N');
  return g;
}

describe('Ways out', () => {
  const g = roomWithNorthDoor();
  const map = mapAreas(g);

  it("in the room's middle, the door lies ahead facing north, behind facing south, and to the side facing east or west", () => {
    expect(waysOut(g, map, 2, 2, 'N')).toEqual(['ahead']);
    expect(waysOut(g, map, 2, 2, 'S')).toEqual(['behind']);
    expect(waysOut(g, map, 2, 2, 'E')).toEqual(['left']);
    expect(waysOut(g, map, 2, 2, 'W')).toEqual(['right']);
  });

  it('from the corridor square, the ways you can step', () => {
    expect(waysOut(g, map, 2, 0, 'N')).toEqual(['behind']);
  });

  it('said plainly', () => {
    expect(bearingsPhrase(['ahead'])).toBe('ahead');
    expect(bearingsPhrase(['left', 'behind'])).toBe('to your left and behind you');
    expect(bearingsPhrase(['ahead', 'ahead', 'right'])).toBe('two ahead and one to your right');
  });
});
