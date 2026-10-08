// A new character's first steps: gentler first fights, a starter kit, no
// level-1 ambush, a warrior's tip, and a chest near the level-1 entrance.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createMemoryDb } from '../src/database/database.js';
import { Repository } from '../src/database/repositories.js';
import { GameEngine } from '../src/core/game-engine.js';
import { createMonster, pickRandomMonsterType, getDefinition } from '../src/core/monsters.js';
import { generateLevel, deserializeLevel } from '../src/core/dungeon.js';
import { RNG } from '../src/core/random.js';
import { NEWCOMER } from '../src/core/config.js';
import type { CharacterClass } from '../src/core/types.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any;
beforeEach(() => { db = createMemoryDb(); });
afterEach(() => { db.close(); });

function newEngine(cls: CharacterClass = 'wizard') {
  const engine = new GameEngine(new Repository(db));
  engine.startNameEntry();
  engine.submitName('Newcomer');
  engine.acceptCharacter(cls);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return engine as any;
}

describe('a newcomer', () => {
  it('starts with potions and coin; a warrior with a blade', () => {
    const w = newEngine('wizard');
    expect(w.char.inventory.potions).toBe(NEWCOMER.STARTING_POTIONS);
    expect(w.char.gold).toBe(NEWCOMER.STARTING_GOLD);
    expect(w.char.inventory.weapons ?? []).toHaveLength(0);
    const f = newEngine('warrior');
    expect(f.char.inventory.weapons).toEqual([{ kind: 'sword', bonus: 0, name: 'Plain longsword' }]);
  });

  it('meets no Sanguinid on the first two levels', () => {
    const rng = new RNG(11);
    for (const depth of [1, 2]) for (let i = 0; i < 5000; i++) expect(pickRandomMonsterType(depth, rng)).not.toBe('Sanguinid');
    let seen = false;
    for (let i = 0; i < 5000 && !seen; i++) seen = pickRandomMonsterType(3, rng) === 'Sanguinid';
    expect(seen).toBe(true);
  });

  it('draws the first fights on level 1 from the gentler kinds, then any level-1 kind', () => {
    const e = newEngine();
    e.char.hp = e.char.maxHp = 1_000_000;
    const tiersSeen = (slain: number) => {
      const seen = new Set<number>();
      for (let i = 0; i < 300; i++) {
        e.char.monstersDefeated = slain;
        e.phase = 'playing'; e.combat = null;
        e.startRandomEncounter();
        seen.add(e.combat.monster.definition.naturalTier);
      }
      return Math.max(...seen);
    };
    NEWCOMER.FIRST_FIGHT_TIERS.forEach((tier, slain) => expect(tiersSeen(slain)).toBeLessThanOrEqual(tier));
    // After that, all of level 1 (whose toughest kinds are tier 3).
    expect(tiersSeen(NEWCOMER.FIRST_FIGHT_TIERS.length)).toBe(3);
  });

  it('is not held to the gentle kinds below level 1', () => {
    const e = newEngine();
    e.char.hp = e.char.maxHp = 1_000_000;
    e.char.dungeonLevel = 2;
    e.char.monstersDefeated = 0;
    const tiers = new Set<number>();
    for (let i = 0; i < 300; i++) { e.phase = 'playing'; e.combat = null; e.startRandomEncounter(); tiers.add(e.combat.monster.definition.naturalTier); }
    expect(Math.max(...tiers)).toBeGreaterThan(NEWCOMER.FIRST_FIGHT_TIERS[0]);
  });

  it('as a warrior, is pointed to Power Attack in the first fight only', () => {
    const e = newEngine('warrior');
    e.char.hp = e.char.maxHp = 1_000_000;
    const first = e.beginCombat(createMonster('Kobold', 1, 'k1'));
    expect(first.messages.join(' ')).toContain('Power Attack');
    e.phase = 'playing'; e.combat = null;
    const second = e.beginCombat(createMonster('Kobold', 1, 'k2'));
    expect(second.messages.join(' ')).not.toContain('TIP:');
    const w = newEngine('wizard');
    expect(w.beginCombat(createMonster('Kobold', 1, 'k3')).messages.join(' ')).not.toContain('TIP:');
  });

  it('finds a chest a short walk from the level-1 entrance', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const { grid, entrance, contents } = deserializeLevel(generateLevel(1, seed * 977));
      const dist = new Map<string, number>([[`${entrance.x},${entrance.y}`, 0]]);
      const queue = [entrance];
      const moves: ['N' | 'E' | 'S' | 'W', number, number][] = [['N', 0, -1], ['E', 1, 0], ['S', 0, 1], ['W', -1, 0]];
      while (queue.length) {
        const c = queue.shift()!;
        for (const [w, dx, dy] of moves) {
          const k = `${c.x + dx},${c.y + dy}`;
          if (grid[c.y][c.x].walls[w] || dist.has(k)) continue;
          dist.set(k, dist.get(`${c.x},${c.y}`)! + 1);
          queue.push({ x: c.x + dx, y: c.y + dy });
        }
      }
      const near = [...contents].some(([k, c]) => c.type === 'chest'
        && (dist.get(k) ?? 99) >= NEWCOMER.CHEST_NEAR_ENTRANCE_MIN && (dist.get(k) ?? 99) <= NEWCOMER.CHEST_NEAR_ENTRANCE_MAX);
      expect(near, `seed ${seed * 977}`).toBe(true);
    }
  });

  it('the gentle kinds really are gentle', () => {
    for (const t of ['Kobold', 'Goblin', 'Mold', 'Stirge Swarm'] as const) expect(getDefinition(t).naturalTier).toBe(1);
  });
});
