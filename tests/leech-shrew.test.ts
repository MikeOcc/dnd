import { describe, it, expect } from 'vitest';
import { RNG } from '../src/core/random.js';
import { rollCharacter, createCharacter } from '../src/core/character.js';
import { createMonster, pickRandomMonsterType } from '../src/core/monsters.js';
import { monsterFirstStrike, playerHeld, killedBy } from '../src/core/combat.js';
import type { Character } from '../src/core/types.js';

function hero(): Character {
  const c = createCharacter('h', 'Hero', rollCharacter(new RNG(1)));
  c.level = 3; c.hp = c.maxHp = 5000; c.statusEffects = []; c.strength = 18;
  return c;
}

describe('Giant Leeches and Giant Shrews', () => {
  it('turn up on levels 1-4, and not deeper', () => {
    const rng = new RNG(8);
    for (const type of ['Giant Leech', 'Giant Shrew']) {
      const levels = new Set<number>();
      for (let d = 1; d <= 7; d++) for (let i = 0; i < 6000; i++) if (pickRandomMonsterType(d, rng) === type) levels.add(d);
      expect([...levels].sort()).toEqual([1, 2, 3, 4]);
    }
  });

  it('a leech fastens on, then drinks (healing itself), and strength can tear it off', () => {
    const c = hero(); const m = createMonster('Giant Leech', 4, 'l');
    let latched = false;
    for (let i = 0; i < 40 && !latched; i++) { monsterFirstStrike(c, m, new RNG(i)); latched = c.heldBy === 'latched'; }
    expect(latched).toBe(true);
    expect(c.statusEffects.some(e => e.type === 'bleeding')).toBe(true);
    m.hp = 1;
    const drink = monsterFirstStrike(c, m, new RNG(99));
    expect(drink.messages.join(' ')).toContain('drinks deep');
    expect(m.hp).toBeGreaterThan(1);
    // Struggling: sooner or later the strong tear it off.
    let freed = false;
    for (let i = 0; i < 30 && !freed; i++) {
      c.heldBy = 'latched'; c.heldRounds = 2;
      const r = playerHeld(c, m, new RNG(500 + i));
      freed = r.messages[0].includes('wrench the leech off');
    }
    expect(freed).toBe(true);
  });

  it('a shrew bites, sometimes in a frenzy of several bites', () => {
    const rng = new RNG(3); let frenzy = false, bites = 0;
    for (let i = 0; i < 200; i++) {
      const r = monsterFirstStrike(hero(), createMonster('Giant Shrew', 3, 's'), rng);
      if (r.messages.join(' ').includes('blur of teeth')) { frenzy = true; expect(r.messages.filter(l => l.includes('It bites')).length).toBeGreaterThanOrEqual(1); }
      if (r.monsterDamage > 0) bites++;
    }
    expect(frenzy).toBe(true);
    expect(bites).toBeGreaterThan(150);
  });

  it('dying to them reads properly', () => {
    expect(killedBy(createMonster('Giant Leech', 2, 'l'), 'leech-drain')).toBe('Killed by the drinking mouth of a Level 2 Giant Leech.');
    expect(killedBy(createMonster('Giant Shrew', 2, 's'), 'shrew-frenzy')).toBe('Killed by the teeth of a Level 2 Giant Shrew.');
  });
});
