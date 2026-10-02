import { describe, it, expect } from 'vitest';
import { generateLevel, deserializeLevel, floodFill } from '../src/core/dungeon.js';
import { buildOrcKingLair, ORC_KING_LAIR } from '../src/core/lairs.js';
import { mapAreas, areaAtCell } from '../src/core/regions.js';
import { ceilingHeight } from '../src/content/area-text.js';
import { getDefinition, pickRandomMonsterType, createMonster, randomMonsterLevel } from '../src/core/monsters.js';
import { RNG } from '../src/core/random.js';

describe("The Orc King's lair", () => {
  for (const seed of [11, 222, 3333, 44444, 555555]) {
    it(`is a high-ceilinged throne room with one way in, guarded and trapped (seed ${seed})`, () => {
      const { grid, entrance, exit, contents } = deserializeLevel(generateLevel(4, seed));
      const reachable = floodFill(grid, entrance.x, entrance.y).size;
      buildOrcKingLair(grid, entrance, exit, contents);

      const at = (id: string) => [...contents.entries()].find(([, c]) => c.id === id)?.[0];
      const king = at(ORC_KING_LAIR.KING_ID)!;
      expect(king).toBeDefined();
      const [kx, ky] = king.split(',').map(Number);
      const room = areaAtCell(mapAreas(grid), kx, ky)!;
      expect(room.kind).toBe('room');
      expect(room.exits).toBe(1);
      expect(ceilingHeight(4, room)).toBeGreaterThan(0);
      expect(contents.get(at(ORC_KING_LAIR.GUARD_ID)!)!.monsterId).toBe('Manticore');
      expect([...contents.values()].filter(c => c.id.startsWith('trap-orc-lair')).length).toBeGreaterThanOrEqual(2);
      // Walling up the room cut nothing else off.
      expect(floodFill(grid, entrance.x, entrance.y).size).toBe(reachable);
    });
  }

  it('builds the same lair every time the level loads', () => {
    const build = () => {
      const { grid, entrance, exit, contents } = deserializeLevel(generateLevel(4, 9876));
      buildOrcKingLair(grid, entrance, exit, contents);
      return [...contents.entries()].filter(([, c]) => /orc|manticore/.test(c.id)).map(([k, c]) => `${k}:${c.id}`).sort();
    };
    expect(build()).toEqual(build());
  });
});

describe('Orcs, the Orc King and the Manticore', () => {
  it('orcs can reach level 30, and roam every depth', () => {
    expect(getDefinition('Orc').maxLevel).toBe(30);
    const rng = new RNG(5);
    const seen = new Set<string>();
    for (let i = 0; i < 3000; i++) seen.add(pickRandomMonsterType(7, rng));
    expect(seen.has('Orc')).toBe(true);
  });

  it('the Orc King is unique and tough, the Manticore an ordinary deep monster', () => {
    const king = getDefinition('Orc King');
    expect(king.isUnique).toBe(true);
    expect([king.minLevel, king.maxLevel]).toEqual([80, 90]);
    expect(getDefinition('Manticore').isUnique).toBe(false);
    expect(getDefinition('Manticore').minDungeonLevel).toBe(6);  // roams 6-7; level 4 has only the Orc King's guard
  });
});

describe('Sanguinid levels', () => {
  it('roll variably, staying under the usual cap up top and reaching as high as 85 on levels 6-7', () => {
    const rng = new RNG(9);
    const roll = (depth: number) => createMonster('Sanguinid', randomMonsterLevel(60, depth, rng, 'Sanguinid'), 's').level;
    const shallow = Array.from({ length: 3000 }, () => roll(3));
    const deep = Array.from({ length: 3000 }, () => roll(7));
    expect(Math.max(...shallow)).toBeLessThanOrEqual(60);
    expect(Math.max(...deep)).toBe(85);
    expect(new Set(deep).size).toBeGreaterThan(10);
  });
});
