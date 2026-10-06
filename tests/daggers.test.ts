import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RNG } from '../src/core/random.js';
import { rollCharacter, createCharacter, bestDagger } from '../src/core/character.js';
import { resolveChest } from '../src/core/encounters.js';
import { createMonster } from '../src/core/monsters.js';
import { playerAttack } from '../src/core/combat.js';
import { createMemoryDb } from '../src/database/database.js';
import { Repository } from '../src/database/repositories.js';
import { DAGGERS } from '../src/core/config.js';
import type { Character } from '../src/core/types.js';

function hero(plus = 0): Character {
  const c = createCharacter('h', 'Hero', rollCharacter(new RNG(1)));
  c.level = 30; c.strength = 14; c.dexterity = 14; c.hp = c.maxHp = 1e7; c.statusEffects = [];
  c.inventory.daggers = plus ? [{ bonus: plus, name: 'Test dagger' }] : [];
  return c;
}

/** Average damage of hits over many attacks on a type. */
function avgHit(type: Parameters<typeof createMonster>[0], plus: number, level = 20) {
  const rng = new RNG(99); let total = 0, hits = 0;
  for (let i = 0; i < 1500; i++) {
    const m = createMonster(type, level, 'm' + i); m.hp = m.maxHp = 1e7;
    const before = m.hp;
    playerAttack(hero(plus), m, rng);
    if (m.hp < before) { total += before - m.hp; hits++; }
  }
  return { avg: total / Math.max(1, hits), hitRate: hits / 1500 };
}

describe('Magic daggers', () => {
  it('turn up in chests now and then, better ones deeper down', () => {
    const count = (level: number) => {
      const rng = new RNG(5); const by = [0, 0, 0, 0]; let n = 0;
      for (let i = 0; i < 30000; i++) {
        const c = createCharacter('h', 'Hero', rollCharacter(new RNG(2))); c.dungeonLevel = level;
        resolveChest(c, rng);
        for (const d of c.inventory.daggers ?? []) { by[d.bonus]++; n++; }
      }
      return { rate: n / 30000, plus3: by[3] / Math.max(1, n) };
    };
    const shallow = count(1), deep = count(6);
    expect(shallow.rate).toBeGreaterThan(0.025); expect(shallow.rate).toBeLessThan(0.055);
    expect(deep.plus3).toBeGreaterThan(shallow.plus3);
  });

  it('you fight with the best one you carry, and a full pack holds no more', () => {
    const c = hero();
    c.inventory.daggers = [{ bonus: 1, name: 'a' }, { bonus: 3, name: 'b' }, { bonus: 2, name: 'c' }];
    expect(bestDagger(c)!.name).toBe('b');
    c.inventory.daggers = Array.from({ length: DAGGERS.MAX_CARRIED }, () => ({ bonus: 1, name: 'x' }));
    const rng = new RNG(7);
    for (let i = 0; i < 4000; i++) resolveChest(c, rng);
    expect(c.inventory.daggers.length).toBe(DAGGERS.MAX_CARRIED);
  });

  it('each plus helps you hit and hurts more', () => {
    const none = avgHit('Giant', 0), three = avgHit('Giant', 3);
    expect(three.avg).toBeGreaterThan(none.avg * 1.3);
    expect(three.hitRate).toBeGreaterThanOrEqual(none.hitRate);
  });

  it('a Rakshasa takes a quarter from ordinary steel, and the full blow only from a +3', () => {
    const ratio = (plus: number) => avgHit('Rakshasa', plus).avg / avgHit('Giant', plus).avg;
    expect(ratio(0)).toBeCloseTo(0.25, 1);
    expect(ratio(1)).toBeCloseTo(0.5, 1);
    expect(ratio(3)).toBeCloseTo(1, 1);
  });

  it('an enchanted blade bites werewolf hide and stone in full', () => {
    expect(avgHit('Werewolf', 1, 8).avg).toBeGreaterThan(avgHit('Werewolf', 0, 8).avg * 1.8);
  });
});

describe('Magic daggers, saved', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let db: any;
  beforeEach(() => { db = createMemoryDb(); });
  afterEach(() => { db.close(); });
  it('survive a save and load', () => {
    const repo = new Repository(db);
    const c = hero(2); c.id = 'char-dagger'; c.lastSaved = Date.now(); c.createdAt = Date.now();
    repo.saveCharacter(c);
    expect(repo.loadCharacter('char-dagger')!.inventory.daggers).toEqual([{ bonus: 2, name: 'Test dagger' }]);
  });
});
