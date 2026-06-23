import { describe, it, expect } from 'vitest';
import { RNG } from '../src/core/random.js';
import { rollCharacter, createCharacter } from '../src/core/character.js';
import { createMonster, getDefinition } from '../src/core/monsters.js';
import { playerAttack, playerFireball, playerHeal, playerPray, playerRun, calculateXPReward } from '../src/core/combat.js';

function makeChar(overrides: Partial<ReturnType<typeof createCharacter>> = {}) {
  const rng = new RNG(1234);
  const roll = rollCharacter(rng);
  const char = createCharacter('test', 'Hero', roll);
  char.level = 5;
  char.hp = char.maxHp;
  return { ...char, ...overrides };
}

describe('Combat formulas', () => {
  it('attack deals damage when hitting', () => {
    const char = makeChar({ strength: 15, dexterity: 14 });
    const monster = createMonster('Goblin', 3, 'm1');

    let totalDamage = 0;
    let hits = 0;
    const rng = new RNG(999);

    // Run 100 rounds to ensure some hits
    for (let i = 0; i < 100; i++) {
      const m = { ...monster, hp: 100, maxHp: 100 };
      const result = playerAttack({ ...char }, m, rng);
      if (result.playerDamage > 0) {
        totalDamage += result.playerDamage;
        hits++;
      }
    }
    expect(hits).toBeGreaterThan(0);
    expect(totalDamage).toBeGreaterThan(0);
  });

  it('fireball deals more damage to White Dragon (vulnerable)', () => {
    const char = makeChar({ level: 8, intelligence: 16 });
    const whiteDragon = createMonster('White Dragon', 10, 'wd1');
    const redDragon   = createMonster('Red Dragon',   10, 'rd1');

    const rng1 = new RNG(555);
    const rng2 = new RNG(555); // same seed for fair comparison

    const wdDamages: number[] = [];
    const rdDamages: number[] = [];

    for (let i = 0; i < 50; i++) {
      const wdm = { ...whiteDragon, hp: 1000 };
      const rdm = { ...redDragon, hp: 1000 };
      const r1 = playerFireball({ ...char }, wdm, rng1);
      const r2 = playerFireball({ ...char }, rdm, rng2);
      wdDamages.push(r1.playerDamage);
      rdDamages.push(r2.playerDamage);
    }

    const avgWD = wdDamages.reduce((a, b) => a + b, 0) / wdDamages.length;
    const avgRD = rdDamages.reduce((a, b) => a + b, 0) / rdDamages.length;

    // White Dragon (2x vulnerability) should take significantly more damage than Red Dragon (0.25x resistance)
    expect(avgWD).toBeGreaterThan(avgRD * 3);
  });

  it('Red Dragon resists Fireball (fireballResistance = 0.25)', () => {
    const redDef = getDefinition('Red Dragon');
    expect(redDef.fireballResistance).toBe(0.25);
  });

  it('White Dragon is vulnerable to Fireball (fireballResistance = 2.0)', () => {
    const whiteDef = getDefinition('White Dragon');
    expect(whiteDef.fireballResistance).toBe(2.0);
  });

  it('Heal restores HP but not beyond max', () => {
    const char = makeChar({ hp: 5, maxHp: 100, wisdom: 14 });
    const monster = createMonster('Goblin', 3, 'm2');
    const rng = new RNG(42);

    const result = playerHeal(char, { ...monster, hp: 1000 }, rng);
    expect(char.hp).toBeGreaterThan(5);
    expect(char.hp).toBeLessThanOrEqual(char.maxHp);
  });

  it('Prayer is more effective against undead', () => {
    const char = makeChar({ level: 5, wisdom: 15 });
    const undead = createMonster('Spectre', 5, 'u1');
    const nonUndead = createMonster('Goblin', 5, 'n1');

    const rngU = new RNG(888);
    const rngN = new RNG(888);

    let undeadSuccesses = 0;
    let nonUndeadSuccesses = 0;

    for (let i = 0; i < 100; i++) {
      const um = { ...undead, hp: 100, prayerPenalty: 0 };
      const nm = { ...nonUndead, hp: 100, prayerPenalty: 0 };

      const rU = playerPray({ ...char, statusEffects: [] }, um, rngU);
      const rN = playerPray({ ...char, statusEffects: [] }, nm, rngN);

      if (rU.playerDamage > 0) undeadSuccesses++;
      if (rN.playerDamage > 0 || rN.messages.some(m => m.includes('renewed') || m.includes('strengthens'))) nonUndeadSuccesses++;
    }

    // Prayer should succeed more often against undead
    expect(undeadSuccesses).toBeGreaterThan(nonUndeadSuccesses);
  });

  it('prayer penalty accumulates and reduces effectiveness', () => {
    const char = makeChar({ wisdom: 15 });
    const undead = createMonster('Skeleton', 3, 's1');
    const rng = new RNG(777);

    let firstPrayer = 0;
    let fifthPrayer = 0;

    for (let trial = 0; trial < 200; trial++) {
      const m1 = { ...undead, hp: 100, prayerPenalty: 0 };
      const r1 = playerPray({ ...char, statusEffects: [] }, m1, new RNG(trial));
      if (r1.playerDamage > 0) firstPrayer++;

      const m5 = { ...undead, hp: 100, prayerPenalty: 0.8 };
      const r5 = playerPray({ ...char, statusEffects: [] }, m5, new RNG(trial));
      if (r5.playerDamage > 0) fifthPrayer++;
    }

    // First prayer should succeed significantly more often than heavily penalized prayer
    expect(firstPrayer).toBeGreaterThan(fifthPrayer);
  });
});

describe('XP rewards', () => {
  it('gives more XP for higher-level monsters', () => {
    const xpLow = calculateXPReward(5, 3, false);
    const xpHigh = calculateXPReward(5, 10, false);
    expect(xpHigh).toBeGreaterThan(xpLow);
  });

  it('gives bonus XP when monster is higher level than character', () => {
    const base = calculateXPReward(5, 5, false);
    const bonus = calculateXPReward(5, 8, false);
    expect(bonus).toBeGreaterThan(base);
  });

  it('gives reduced XP when monster is much lower level than character', () => {
    const base = calculateXPReward(10, 10, false);
    const reduced = calculateXPReward(10, 2, false);
    expect(reduced).toBeLessThan(base);
    expect(reduced).toBeGreaterThan(0);
  });

  it('unique monsters give significantly more XP', () => {
    const normal = calculateXPReward(5, 10, false);
    const unique = calculateXPReward(5, 10, true);
    expect(unique).toBeGreaterThan(normal * 2);
  });
});

describe('Running from combat', () => {
  it('player can run from weak monsters', () => {
    const char = makeChar({ level: 10, dexterity: 18 });
    const weakMonster = createMonster('Kobold', 1, 'k1');

    let escaped = 0;
    for (let i = 0; i < 100; i++) {
      const rng = new RNG(i);
      const m = { ...weakMonster };
      const result = playerRun({ ...char, statusEffects: [] }, m, rng);
      if (result.ran) escaped++;
    }
    expect(escaped).toBeGreaterThan(50); // should escape majority of the time
  });

  it('running against Tarrasque is harder', () => {
    const char = makeChar({ level: 5, dexterity: 10 });
    const tarrasque = createMonster('Tarrasque', 40, 't1');

    let escaped = 0;
    for (let i = 0; i < 100; i++) {
      const rng = new RNG(i);
      const m = { ...tarrasque };
      const result = playerRun({ ...char, statusEffects: [] }, m, rng);
      if (result.ran) escaped++;
    }
    expect(escaped).toBeLessThan(30); // Tarrasque is hard to escape
  });
});
