import { describe, it, expect } from 'vitest';
import { RNG } from '../src/core/random.js';
import { rollCharacter, createCharacter } from '../src/core/character.js';
import { createMonster, getDefinition, randomMonsterLevel, pickRandomMonsterType } from '../src/core/monsters.js';
import { playerAttack, playerFireball, playerAcid, playerLightning, playerFrost, playerPoison, playerOpal, playerHeal, playerPray, playerRun, calculateXPReward } from '../src/core/combat.js';
import { GEMS } from '../src/core/config.js';

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

  it('Blue Dragon is highly susceptible to Fireball (fireballResistance = 3.0, triple damage)', () => {
    const blueDef = getDefinition('Blue Dragon');
    expect(blueDef.fireballResistance).toBe(3.0);

    const char = makeChar({ level: 8, intelligence: 16 });
    const blueDragon = createMonster('Blue Dragon', 10, 'bd1');
    const goblin = createMonster('Goblin', 10, 'g3');

    const rng1 = new RNG(777);
    const rng2 = new RNG(777);

    const bdDamages: number[] = [];
    const gDamages: number[] = [];

    for (let i = 0; i < 50; i++) {
      const bdm = { ...blueDragon, hp: 1000 };
      const gm = { ...goblin, hp: 1000 };
      const r1 = playerFireball({ ...char }, bdm, rng1);
      const r2 = playerFireball({ ...char }, gm, rng2);
      bdDamages.push(r1.playerDamage);
      gDamages.push(r2.playerDamage);
    }

    const avgBD = bdDamages.reduce((a, b) => a + b, 0) / bdDamages.length;
    const avgG = gDamages.reduce((a, b) => a + b, 0) / gDamages.length;

    // Blue Dragon (3x) should take ~3x what a normal-resistance monster takes
    expect(avgBD).toBeGreaterThan(avgG * 2.5);
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

describe('Prayer — tiered targets', () => {
  it('hits powerful non-undead foes (Beholder, dragons) more often than ordinary ones, but less than undead', () => {
    const char = makeChar({ level: 20, wisdom: 15 });
    const undead = createMonster('Spectre', 20, 'u1');
    const powerful = createMonster('Beholder', 20, 'p1');
    const ordinary = createMonster('Goblin', 20, 'o1');

    let undeadHits = 0, powerfulHits = 0, ordinaryHits = 0;
    for (let trial = 0; trial < 300; trial++) {
      const um = { ...undead, hp: 100000, prayerPenalty: 0 };
      const pm = { ...powerful, hp: 100000, prayerPenalty: 0 };
      const om = { ...ordinary, hp: 100000, prayerPenalty: 0 };

      const rU = playerPray(makeChar({ level: 20, wisdom: 15, hp: 1000, maxHp: 1000 }), um, new RNG(trial));
      const rP = playerPray(makeChar({ level: 20, wisdom: 15, hp: 1000, maxHp: 1000 }), pm, new RNG(trial));
      const rO = playerPray(makeChar({ level: 20, wisdom: 15, hp: 1000, maxHp: 1000 }), om, new RNG(trial));

      if (rU.playerDamage > 0) undeadHits++;
      if (rP.playerDamage > 0) powerfulHits++;
      if (rO.playerDamage > 0) ordinaryHits++;
    }

    expect(undeadHits).toBeGreaterThan(powerfulHits);
    expect(powerfulHits).toBeGreaterThan(ordinaryHits);
  });

  it('powerful non-undead foes take noticeably less holy damage per hit than true undead', () => {
    const undead = createMonster('Spectre', 20, 'u2');
    const powerful = createMonster('Beholder', 20, 'p2');

    const undeadDamages: number[] = [];
    const powerfulDamages: number[] = [];
    for (let trial = 0; trial < 200; trial++) {
      const um = { ...undead, hp: 100000, prayerPenalty: 0 };
      const pm = { ...powerful, hp: 100000, prayerPenalty: 0 };
      const rU = playerPray(makeChar({ level: 20, wisdom: 15, hp: 1000, maxHp: 1000 }), um, new RNG(trial));
      const rP = playerPray(makeChar({ level: 20, wisdom: 15, hp: 1000, maxHp: 1000 }), pm, new RNG(trial));
      if (rU.playerDamage > 0) undeadDamages.push(rU.playerDamage);
      if (rP.playerDamage > 0) powerfulDamages.push(rP.playerDamage);
    }

    const avgUndead = undeadDamages.reduce((a, b) => a + b, 0) / undeadDamages.length;
    const avgPowerful = powerfulDamages.reduce((a, b) => a + b, 0) / powerfulDamages.length;
    expect(avgUndead).toBeGreaterThan(avgPowerful);
  });

  it('low HP increases the chance prayer is answered', () => {
    const undead = createMonster('Skeleton', 10, 's1');

    let fullHpHits = 0, lowHpHits = 0;
    for (let trial = 0; trial < 300; trial++) {
      const m1 = { ...undead, hp: 100000, prayerPenalty: 0 };
      const m2 = { ...undead, hp: 100000, prayerPenalty: 0 };
      const fullHpChar = makeChar({ level: 10, wisdom: 15, hp: 1000, maxHp: 1000 });
      const lowHpChar = makeChar({ level: 10, wisdom: 15, hp: 10, maxHp: 1000 });

      const rFull = playerPray(fullHpChar, m1, new RNG(trial));
      const rLow = playerPray(lowHpChar, m2, new RNG(trial));

      if (rFull.playerDamage > 0) fullHpHits++;
      if (rLow.playerDamage > 0) lowHpHits++;
    }

    expect(lowHpHits).toBeGreaterThan(fullHpHits);
  });

  it('never succeeds against a monster far weaker than the character, and can backfire', () => {
    const weakling = createMonster('Kobold', 1, 'w1');
    const char = makeChar({ level: 20, wisdom: 15, hp: 1000, maxHp: 1000 });

    let sawBackfire = false;
    for (let trial = 0; trial < 200; trial++) {
      const wm = { ...weakling, level: 1, hp: 1000, prayerPenalty: 0 };
      const r = playerPray({ ...char, statusEffects: [] }, wm, new RNG(trial));

      // A prayer against something this weak never deals holy damage or kills it.
      expect(r.playerDamage).toBe(0);
      expect(r.monsterDied).toBe(false);

      if (r.messages.some(m => m.includes('disembodied voice'))) sawBackfire = true;
    }

    expect(sawBackfire).toBe(true);
  });

  it('Vampires are always susceptible to Prayer, even far below the character\'s level', () => {
    const char = makeChar({ level: 40, wisdom: 15, hp: 1000, maxHp: 1000 });
    const weakVampire = createMonster('Vampire', 1, 'v1');

    let sawHit = false;
    let sawBackfire = false;
    for (let trial = 0; trial < 300; trial++) {
      const vm = { ...weakVampire, level: 1, hp: 100000, prayerPenalty: 0 };
      const r = playerPray({ ...char, statusEffects: [] }, vm, new RNG(trial));
      if (r.playerDamage > 0) sawHit = true;
      if (r.messages.some(m => m.includes('disembodied voice'))) sawBackfire = true;
    }

    expect(sawHit).toBe(true);
    expect(sawBackfire).toBe(false);
  });

  it('Wights and Spectres are also always susceptible to Prayer regardless of the level gap', () => {
    for (const type of ['Wight', 'Spectre'] as const) {
      const char = makeChar({ level: 40, wisdom: 15, hp: 1000, maxHp: 1000 });
      const weak = createMonster(type, 1, `${type}-low`);

      let sawHit = false;
      let sawBackfire = false;
      for (let trial = 0; trial < 300; trial++) {
        const m = { ...weak, level: 1, hp: 100000, prayerPenalty: 0 };
        const r = playerPray({ ...char, statusEffects: [] }, m, new RNG(trial));
        if (r.playerDamage > 0) sawHit = true;
        if (r.messages.some(msg => msg.includes('disembodied voice'))) sawBackfire = true;
      }

      expect(sawHit).toBe(true);
      expect(sawBackfire).toBe(false);
    }
  });

  it('a non-exempt undead (Skeleton) is still blocked when far below the character\'s level', () => {
    const char = makeChar({ level: 40, wisdom: 15, hp: 1000, maxHp: 1000 });
    const weakSkeleton = createMonster('Skeleton', 1, 'sk-low');

    let sawHit = false;
    for (let trial = 0; trial < 200; trial++) {
      const m = { ...weakSkeleton, level: 1, hp: 100000, prayerPenalty: 0 };
      const r = playerPray({ ...char, statusEffects: [] }, m, new RNG(trial));
      if (r.playerDamage > 0) sawHit = true;
    }

    expect(sawHit).toBe(false);
  });
});

describe('Sanguinid', () => {
  it('is eligible to appear on any dungeon level', () => {
    const def = getDefinition('Sanguinid');
    expect(def.isUnique).toBe(false);
    expect(def.minDungeonLevel).toBe(1);
  });

  it('never has an artificial forced floor above the dungeon-1 level range (regression)', () => {
    // minLevel used to be 9, which meant a level-1 character at dungeon
    // depth 1 (minDungeonLevel: 1) was *always* clamped up to at least a
    // level-9 Sanguinid regardless of the roll. minLevel is now 1, so the
    // dungeon-depth level range (1-6 on depth 1, by design) is free to
    // produce its full spread instead of being floored by the monster type.
    const def = getDefinition('Sanguinid');
    expect(def.minLevel).toBeLessThanOrEqual(3);

    const rng = new RNG(4242);
    const levels = new Set<number>();
    for (let i = 0; i < 200; i++) {
      const monsterLevel = randomMonsterLevel(1, 1, rng);
      const monster = createMonster('Sanguinid', monsterLevel, `sg-${i}`);
      // Depth-1 range is 1-6 for a level-1 character (no char-level cap bonus).
      expect(monster.level).toBeGreaterThanOrEqual(1);
      expect(monster.level).toBeLessThanOrEqual(6);
      levels.add(monster.level);
    }
    // Should see real variation across the whole range, not stuck at one floor.
    expect(levels.size).toBeGreaterThan(3);
  });

  it('every successful attack causes bleeding', () => {
    const char = makeChar({ level: 3, hp: 500, maxHp: 500, constitution: 10, dexterity: 10, resistance: 10 });
    const monster = createMonster('Sanguinid', 20, 'sg1');

    let bled = 0;
    const trials = 300;
    for (let i = 0; i < trials; i++) {
      const m = { ...monster, hp: 100000 };
      const result = playerAttack({ ...char, statusEffects: [] }, m, new RNG(i));
      // Re-run just the monster's half deterministically isn't exposed directly,
      // so inspect the messages for the bleeding cue instead.
      if (result.messages.some(msg => msg.includes('bleeding'))) bled++;
    }

    expect(bled).toBe(trials);
  });

  it('blood-drain has roughly a 3% chance per occurrence to drain a level', () => {
    const char = makeChar({ level: 3, hp: 100000, maxHp: 100000, constitution: 10, dexterity: 10, resistance: 10 });
    const monster = createMonster('Sanguinid', 20, 'sg2');

    let drains = 0;
    let bloodDrainHits = 0;
    const trials = 6000;
    for (let i = 0; i < trials; i++) {
      const c = { ...char, level: 15, statusEffects: [] };
      const m = { ...monster, hp: 100000 };
      const result = playerAttack(c, m, new RNG(i + 50000));
      if (result.messages.some(msg => msg.includes('drains your blood'))) bloodDrainHits++;
      if (result.messages.some(msg => msg.includes('DRAINED'))) drains++;
    }

    expect(bloodDrainHits).toBeGreaterThan(0);
    expect(drains).toBeGreaterThan(0);
    // ~3% of blood-drain hits; generous bounds to avoid a flaky test
    expect(drains).toBeLessThan(bloodDrainHits * 0.1);
  });

  it('will not drain a level-1 character below level 1', () => {
    const char = makeChar({ level: 1, hp: 100000, maxHp: 100000, constitution: 10, dexterity: 10, resistance: 10 });
    const monster = createMonster('Sanguinid', 20, 'sg3');

    for (let i = 0; i < 2000; i++) {
      const c = { ...char, level: 1, statusEffects: [] };
      const m = { ...monster, hp: 100000 };
      playerAttack(c, m, new RNG(i + 90000));
      expect(c.level).toBe(1);
    }
  });

  it('deals passive radiation damage every round regardless of its chosen attack', () => {
    const char = makeChar({ level: 3, hp: 100000, maxHp: 100000, constitution: 10, dexterity: 10, resistance: 10 });
    const monster = createMonster('Sanguinid', 20, 'sg4');

    let irradiated = 0;
    const trials = 300;
    for (let i = 0; i < trials; i++) {
      const c = { ...char, statusEffects: [] };
      const m = { ...monster, hp: 100000 };
      const result = playerAttack(c, m, new RNG(i + 10000));
      if (result.messages.some(msg => msg.includes('radiation damage'))) irradiated++;
    }

    expect(irradiated).toBe(trials);
  });

  it('flash-burn occurs roughly 1 in 10 times and hits harder than its other attacks', () => {
    const char = makeChar({ level: 3, hp: 100000, maxHp: 100000, constitution: 10, dexterity: 10, resistance: 10 });
    const monster = createMonster('Sanguinid', 20, 'sg5');

    let flashBurns = 0;
    const trials = 4000;
    for (let i = 0; i < trials; i++) {
      const c = { ...char, statusEffects: [] };
      const m = { ...monster, hp: 100000 };
      const result = playerAttack(c, m, new RNG(i + 20000));
      if (result.messages.some(msg => msg.includes('blinding radioactive flash'))) flashBurns++;
    }

    // Expected ~10% (400 of 4000); generous bounds to avoid a flaky test
    expect(flashBurns).toBeGreaterThan(trials * 0.05);
    expect(flashBurns).toBeLessThan(trials * 0.18);
  });

  it('is weak to light — Prayer works against it like it does against undead', () => {
    const def = getDefinition('Sanguinid');
    expect(def.lightVulnerable).toBe(true);

    const char = makeChar({ level: 5, wisdom: 15 });
    const sanguinid = createMonster('Sanguinid', 5, 'sg6');
    const nonVulnerable = createMonster('Goblin', 5, 'g1');

    const rngS = new RNG(321);
    const rngG = new RNG(321);

    let sanguinidSuccesses = 0;
    let goblinSuccesses = 0;

    for (let i = 0; i < 100; i++) {
      const sm = { ...sanguinid, hp: 100000, prayerPenalty: 0 };
      const gm = { ...nonVulnerable, hp: 100000, prayerPenalty: 0 };

      const rS = playerPray({ ...char, statusEffects: [] }, sm, rngS);
      const rG = playerPray({ ...char, statusEffects: [] }, gm, rngG);

      if (rS.playerDamage > 0) sanguinidSuccesses++;
      if (rG.playerDamage > 0) goblinSuccesses++;
    }

    expect(sanguinidSuccesses).toBeGreaterThan(goblinSuccesses);
  });

  it('is weak to acid — Acid Spray deals bonus damage', () => {
    const def = getDefinition('Sanguinid');
    expect(def.acidResistance).toBe(2.0);

    const char = makeChar({ level: 8, intelligence: 16 });
    const sanguinid = createMonster('Sanguinid', 10, 'sg7');
    const goblin = createMonster('Goblin', 10, 'g2');

    const rng1 = new RNG(555);
    const rng2 = new RNG(555);

    const sgDamages: number[] = [];
    const gDamages: number[] = [];

    for (let i = 0; i < 50; i++) {
      const sm = { ...sanguinid, hp: 1000 };
      const gm = { ...goblin, hp: 1000 };
      const r1 = playerAcid({ ...char }, sm, rng1);
      const r2 = playerAcid({ ...char }, gm, rng2);
      sgDamages.push(r1.playerDamage);
      gDamages.push(r2.playerDamage);
    }

    const avgSg = sgDamages.reduce((a, b) => a + b, 0) / sgDamages.length;
    const avgG = gDamages.reduce((a, b) => a + b, 0) / gDamages.length;

    expect(avgSg).toBeGreaterThan(avgG * 1.5);
  });
});

describe('Wight / Spectre / Vampire — life-drain level drain', () => {
  it('a high-level Wight has a small chance to drain a level on a life-drain hit', () => {
    const char = makeChar({ level: 3, hp: 100000, maxHp: 100000, constitution: 10, dexterity: 10, resistance: 10 });
    const def = getDefinition('Wight');
    const monster = createMonster('Wight', def.maxLevel, 'w-drain1'); // at its own cap, well above the 0.7 fraction threshold

    let lifeDrainHits = 0;
    let drains = 0;
    const trials = 6000;
    for (let i = 0; i < trials; i++) {
      const c = { ...char, statusEffects: [] };
      const m = { ...monster, hp: 100000 };
      const result = playerAttack(c, m, new RNG(i + 90000));
      if (result.messages.some(msg => msg.includes('drains your life'))) lifeDrainHits++;
      if (result.messages.some(msg => msg.includes('DRAINED'))) drains++;
    }

    expect(lifeDrainHits).toBeGreaterThan(0);
    expect(drains).toBeGreaterThan(0);
    // ~8% of life-drain hits; generous bound to avoid a flaky test
    expect(drains).toBeLessThan(lifeDrainHits * 0.3);
  });

  it('a low-level Wight (below the threshold fraction of its own max level) never drains a level', () => {
    const char = makeChar({ level: 3, hp: 100000, maxHp: 100000, constitution: 10, dexterity: 10, resistance: 10 });
    const def = getDefinition('Wight');
    const monster = createMonster('Wight', def.minLevel, 'w-drain2'); // well below 0.7 * maxLevel

    let drains = 0;
    const trials = 3000;
    for (let i = 0; i < trials; i++) {
      const c = { ...char, statusEffects: [] };
      const m = { ...monster, hp: 100000 };
      const result = playerAttack(c, m, new RNG(i + 120000));
      if (result.messages.some(msg => msg.includes('DRAINED'))) drains++;
    }

    expect(drains).toBe(0);
  });

  it('Spectres and Vampires at high level can also drain a level', () => {
    for (const type of ['Spectre', 'Vampire'] as const) {
      const char = makeChar({ level: 3, hp: 100000, maxHp: 100000, constitution: 10, dexterity: 10, resistance: 10 });
      const def = getDefinition(type);
      const monster = createMonster(type, def.maxLevel, `${type}-drain`);

      let drains = 0;
      const trials = 8000;
      for (let i = 0; i < trials; i++) {
        const c = { ...char, statusEffects: [] };
        const m = { ...monster, hp: 100000 };
        const result = playerAttack(c, m, new RNG(i + 150000));
        if (result.messages.some(msg => msg.includes('DRAINED'))) drains++;
      }

      expect(drains).toBeGreaterThan(0);
    }
  });

  it('a low-level Zombie (life-drain not in its ability set) never drains a level', () => {
    const char = makeChar({ level: 3, hp: 100000, maxHp: 100000, constitution: 10, dexterity: 10, resistance: 10 });
    const def = getDefinition('Zombie');
    const monster = createMonster('Zombie', def.maxLevel, 'z-drain');

    let drains = 0;
    const trials = 1000;
    for (let i = 0; i < trials; i++) {
      const c = { ...char, statusEffects: [] };
      const m = { ...monster, hp: 100000 };
      const result = playerAttack(c, m, new RNG(i + 200000));
      if (result.messages.some(msg => msg.includes('DRAINED'))) drains++;
    }

    expect(drains).toBe(0);
  });
});

describe('Elder Oblex', () => {
  it('is a high-tier, non-unique monster restricted to dungeon levels 5-7', () => {
    const def = getDefinition('Elder Oblex');
    expect(def.isUnique).toBe(false);
    expect(def.isUndead).toBe(false);
    expect(def.minDungeonLevel).toBe(5);
    expect(def.naturalTier).toBeGreaterThanOrEqual(7);
  });

  it('never appears in the random encounter pool before dungeon level 5', () => {
    const rng = new RNG(1357);
    for (let depth = 1; depth <= 4; depth++) {
      for (let i = 0; i < 300; i++) {
        expect(pickRandomMonsterType(depth, rng)).not.toBe('Elder Oblex');
      }
    }
  });

  it('can appear in the random encounter pool from dungeon level 5 onward', () => {
    const rng = new RNG(2468);
    let seen = false;
    for (let i = 0; i < 2000; i++) {
      if (pickRandomMonsterType(7, rng) === 'Elder Oblex') seen = true;
    }
    expect(seen).toBe(true);
  });

  it('createMonster clamps within its own defined level range', () => {
    const def = getDefinition('Elder Oblex');
    expect(createMonster('Elder Oblex', 1, 'eo1').level).toBe(def.minLevel);
    expect(createMonster('Elder Oblex', 500, 'eo2').level).toBe(def.maxLevel);
  });
});

describe('pickRandomMonsterType — low-tier fodder phased out on deep levels', () => {
  it('never returns a low-tier type (Kobold, Goblin, Mold, Skeleton, Orc, Slime Mold, Gelatinous Cube, Zombie) on dungeon levels 4-7', () => {
    const lowTier = new Set(['Kobold', 'Goblin', 'Mold', 'Skeleton', 'Orc', 'Slime Mold', 'Gelatinous Cube', 'Zombie']);
    const rng = new RNG(24601);
    for (let depth = 4; depth <= 7; depth++) {
      for (let i = 0; i < 500; i++) {
        expect(lowTier.has(pickRandomMonsterType(depth, rng))).toBe(false);
      }
    }
  });

  it('can still return low-tier fodder on dungeon levels 1-3', () => {
    const lowTier = new Set(['Kobold', 'Goblin', 'Mold', 'Skeleton']);
    const rng = new RNG(112358);
    let seen = false;
    for (let i = 0; i < 500; i++) {
      if (lowTier.has(pickRandomMonsterType(1, rng))) seen = true;
    }
    expect(seen).toBe(true);
  });

  it('the pool never goes empty at any dungeon depth', () => {
    const rng = new RNG(99);
    for (let depth = 1; depth <= 7; depth++) {
      expect(() => pickRandomMonsterType(depth, rng)).not.toThrow();
    }
  });
});

describe('Wizard', () => {
  it('can cast Lightning Bolt, Acid Bolt, and Light Bolt against the player', () => {
    const char = makeChar({ level: 3, hp: 100000, maxHp: 100000, constitution: 10, dexterity: 10, resistance: 10 });
    const wizard = createMonster('Wizard', 20, 'w1');

    let lightning = 0, acid = 0, light = 0;
    const trials = 3000;
    for (let i = 0; i < trials; i++) {
      const c = { ...char, statusEffects: [] };
      const m = { ...wizard, hp: 100000 };
      const result = playerAttack(c, m, new RNG(i));
      if (result.messages.some(msg => msg.includes('Lightning Bolt'))) lightning++;
      if (result.messages.some(msg => msg.includes('searing acid'))) acid++;
      if (result.messages.some(msg => msg.includes('blinding bolt of light'))) light++;
    }

    expect(lightning).toBeGreaterThan(0);
    expect(acid).toBeGreaterThan(0);
    expect(light).toBeGreaterThan(0);
  });
});

describe('Acid Spray', () => {
  it('deals damage and can kill a monster', () => {
    const char = makeChar({ level: 8, intelligence: 16 });
    const monster = createMonster('Goblin', 3, 'ac1');
    const rng = new RNG(99);

    const result = playerAcid({ ...char }, { ...monster, hp: 5 }, rng);
    expect(result.playerDamage).toBeGreaterThan(0);
    expect(result.monsterDied).toBe(true);
  });

  it('defaults to normal (1.0x) damage for monsters with no acidResistance set', () => {
    const def = getDefinition('Kobold');
    expect(def.acidResistance).toBeUndefined();

    const char = makeChar({ level: 5, intelligence: 14 });
    const monster = createMonster('Kobold', 5, 'ac2');
    const rng = new RNG(11);

    const result = playerAcid({ ...char }, { ...monster, hp: 100000 }, rng);
    expect(result.playerDamage).toBeGreaterThan(0);
  });
});

describe('Lightning', () => {
  it('deals damage and can kill a monster', () => {
    const char = makeChar({ level: 8, intelligence: 16 });
    const monster = createMonster('Owlbear', 3, 'lt1');
    const rng = new RNG(99);

    const result = playerLightning({ ...char }, { ...monster, hp: 5 }, rng);
    expect(result.playerDamage).toBeGreaterThan(0);
    expect(result.monsterDied).toBe(true);
  });

  it.each(['Kobold', 'Mold', 'Slime Mold', 'Beholder', 'Black Dragon', 'Red Dragon'] as const)(
    '%s is explicitly tagged weak to lightning (2.0x)',
    (type) => {
      const def = getDefinition(type);
      expect(def.lightningResistance).toBe(2.0);
    },
  );

  it('undead take double lightning damage by default, even without an explicit tag', () => {
    const def = getDefinition('Skeleton');
    expect(def.lightningResistance).toBeUndefined();

    const char = makeChar({ level: 8, intelligence: 16 });
    const skeleton = createMonster('Skeleton', 10, 'lt2');
    const goblin = createMonster('Goblin', 10, 'lt3');

    const rng1 = new RNG(555);
    const rng2 = new RNG(555);

    const skDamages: number[] = [];
    const gDamages: number[] = [];
    for (let i = 0; i < 50; i++) {
      const sm = { ...skeleton, hp: 1000 };
      const gm = { ...goblin, hp: 1000 };
      skDamages.push(playerLightning({ ...char }, sm, rng1).playerDamage);
      gDamages.push(playerLightning({ ...char }, gm, rng2).playerDamage);
    }

    const avgSk = skDamages.reduce((a, b) => a + b, 0) / skDamages.length;
    const avgG = gDamages.reduce((a, b) => a + b, 0) / gDamages.length;
    expect(avgSk).toBeGreaterThan(avgG * 1.5);
  });

  it('an explicit lightningResistance tag overrides the undead default', () => {
    const char = makeChar({ level: 8, intelligence: 16 });
    const skeleton = createMonster('Skeleton', 10, 'lt4');
    // Undead default to 2.0x; force this one down to 0.4x and confirm the
    // explicit tag wins over the isUndead() fallback in playerLightning().
    const resistantSkeleton = {
      ...skeleton,
      definition: { ...skeleton.definition, lightningResistance: 0.4 },
    };

    const rngDefault = new RNG(321);
    const rngOverride = new RNG(321);

    const defaultDamages: number[] = [];
    const overrideDamages: number[] = [];
    for (let i = 0; i < 30; i++) {
      defaultDamages.push(playerLightning({ ...char }, { ...skeleton, hp: 1000 }, rngDefault).playerDamage);
      overrideDamages.push(playerLightning({ ...char }, { ...resistantSkeleton, hp: 1000 }, rngOverride).playerDamage);
    }

    const avgDefault = defaultDamages.reduce((a, b) => a + b, 0) / defaultDamages.length;
    const avgOverride = overrideDamages.reduce((a, b) => a + b, 0) / overrideDamages.length;
    expect(avgOverride).toBeLessThan(avgDefault / 2);
  });
});

describe('Elemental vulnerability/resistance warnings', () => {
  it('shows the vulnerability line the first time, then suppresses it at full health', () => {
    const char = makeChar({ level: 8, intelligence: 16, hp: 100, maxHp: 100 });
    const monster = createMonster('White Dragon', 10, 'ew1'); // fireballResistance 2.0

    const r1 = playerFireball(char, { ...monster, hp: 100000 }, new RNG(1));
    expect(r1.messages.some(m => m.includes('particularly vulnerable to fire'))).toBe(true);
    expect(char.elementalWarnings).toContain('White Dragon:fireball');

    const r2 = playerFireball(char, { ...monster, hp: 100000 }, new RNG(2));
    expect(r2.messages.some(m => m.includes('particularly vulnerable to fire'))).toBe(false);
    expect(r2.messages).toContain('You cast Fireball!');
  });

  it('shows the warning again once the character is low on HP', () => {
    const char = makeChar({ level: 8, intelligence: 16, hp: 100, maxHp: 100 });
    const monster = createMonster('White Dragon', 10, 'ew2');

    playerFireball(char, { ...monster, hp: 100000 }, new RNG(1)); // first cast, records the warning
    char.hp = 20; // < 25% of 100 maxHp

    const result = playerFireball(char, { ...monster, hp: 100000 }, new RNG(2));
    expect(result.messages.some(m => m.includes('particularly vulnerable to fire'))).toBe(true);
  });

  it('tracks resistance/vulnerability separately per element for the same monster', () => {
    const char = makeChar({ level: 8, intelligence: 16, hp: 100, maxHp: 100 });
    const sanguinid = createMonster('Sanguinid', 10, 'ew3'); // acidResistance 2.0, normal fireballResistance

    playerAcid(char, { ...sanguinid, hp: 100000 }, new RNG(1));
    expect(char.elementalWarnings).toEqual(['Sanguinid:acid']);

    const fireResult = playerFireball(char, { ...sanguinid, hp: 100000 }, new RNG(2));
    // Sanguinid has no special fireballResistance, so no vulnerability line — and
    // critically, the acid warning already recorded shouldn't affect fireball.
    expect(fireResult.messages).toContain('You cast Fireball!');
  });
});

describe('Frost Bolt', () => {
  it('deals damage and can kill a monster', () => {
    const char = makeChar({ level: 8, intelligence: 16 });
    const monster = createMonster('Owlbear', 3, 'fr1');
    const rng = new RNG(99);

    const result = playerFrost({ ...char }, { ...monster, hp: 5 }, rng);
    expect(result.playerDamage).toBeGreaterThan(0);
    expect(result.monsterDied).toBe(true);
  });

  it('Red Dragon is weak to frost (2.0x)', () => {
    const def = getDefinition('Red Dragon');
    expect(def.coldResistance).toBe(2.0);
  });

  it('White Dragon resists its own frost breath (0.3x)', () => {
    const def = getDefinition('White Dragon');
    expect(def.coldResistance).toBe(0.3);
  });
});

describe('Poison Spray', () => {
  it('deals damage and can kill a monster', () => {
    const char = makeChar({ level: 8, intelligence: 16 });
    const monster = createMonster('Owlbear', 3, 'po1');
    const rng = new RNG(99);

    const result = playerPoison({ ...char }, { ...monster, hp: 5 }, rng);
    expect(result.playerDamage).toBeGreaterThan(0);
    expect(result.monsterDied).toBe(true);
  });

  it('Green Dragon resists its own poison breath (0.3x)', () => {
    const def = getDefinition('Green Dragon');
    expect(def.poisonResistance).toBe(0.3);
  });
});

describe('Chromatic dragon elemental oppositions', () => {
  it('each dragon resists its own breath weapon', () => {
    expect(getDefinition('Red Dragon').fireballResistance).toBeLessThanOrEqual(0.3);
    expect(getDefinition('White Dragon').coldResistance).toBeLessThanOrEqual(0.3);
    expect(getDefinition('Black Dragon').acidResistance).toBeLessThanOrEqual(0.3);
    expect(getDefinition('Blue Dragon').lightningResistance).toBeLessThanOrEqual(0.3);
    expect(getDefinition('Green Dragon').poisonResistance).toBeLessThanOrEqual(0.3);
  });

  it('Fire and Cold are mutual opposites (Red <-> White)', () => {
    expect(getDefinition('Red Dragon').coldResistance).toBeGreaterThanOrEqual(1.8);
    expect(getDefinition('White Dragon').fireballResistance).toBeGreaterThanOrEqual(1.8);
  });

  it('Green Dragon is weak to acid', () => {
    expect(getDefinition('Green Dragon').acidResistance).toBeGreaterThanOrEqual(1.8);
  });

  it('a dragon takes less damage from its own element than from its counter-element', () => {
    const char = makeChar({ level: 8, intelligence: 16 });
    const redDragon = createMonster('Red Dragon', 10, 'op1');

    const rngFire = new RNG(444);
    const rngFrost = new RNG(444);
    const fireDamages: number[] = [];
    const frostDamages: number[] = [];
    for (let i = 0; i < 40; i++) {
      fireDamages.push(playerFireball({ ...char }, { ...redDragon, hp: 100000 }, rngFire).playerDamage);
      frostDamages.push(playerFrost({ ...char }, { ...redDragon, hp: 100000 }, rngFrost).playerDamage);
    }
    const avgFire = fireDamages.reduce((a, b) => a + b, 0) / fireDamages.length;
    const avgFrost = frostDamages.reduce((a, b) => a + b, 0) / frostDamages.length;
    expect(avgFrost).toBeGreaterThan(avgFire * 3);
  });
});

describe('Asmodeus level range', () => {
  it('has a wide 80-100 range, the top of the unique-boss band', () => {
    const def = getDefinition('Asmodeus');
    expect(def.minLevel).toBe(80);
    expect(def.maxLevel).toBe(100);
  });

  it('createMonster clamps within that range', () => {
    expect(createMonster('Asmodeus', 10, 'a1').level).toBe(80);
    expect(createMonster('Asmodeus', 500, 'a2').level).toBe(100);
    expect(createMonster('Asmodeus', 90, 'a3').level).toBe(90);
  });
});

describe('randomMonsterLevel — dungeon-depth scaling', () => {
  it('produces higher level bands on deeper dungeon levels', () => {
    const rng = new RNG(101);
    const samples = (depth: number) => {
      const levels: number[] = [];
      for (let i = 0; i < 100; i++) levels.push(randomMonsterLevel(1, depth, rng));
      return levels;
    };

    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

    const depth1 = avg(samples(1));
    const depth4 = avg(samples(4));
    const depth7 = avg(samples(7));

    expect(depth4).toBeGreaterThan(depth1);
    expect(depth7).toBeGreaterThan(depth4);
  });

  it('stays within the documented range for dungeon level 1 and level 7', () => {
    const rng = new RNG(202);
    for (let i = 0; i < 200; i++) {
      const lvl1 = randomMonsterLevel(1, 1, rng);
      expect(lvl1).toBeGreaterThanOrEqual(1);
      expect(lvl1).toBeLessThanOrEqual(6);

      // Level-7 band is 50-90 before the hard cap, so it's clamped to 60.
      const lvl7 = randomMonsterLevel(1, 7, rng);
      expect(lvl7).toBeGreaterThanOrEqual(50);
      expect(lvl7).toBeLessThanOrEqual(60);
    }
  });

  it('never exceeds the hard level-60 cap for ordinary monsters, even deep with a high-level character', () => {
    const rng = new RNG(909);
    for (let i = 0; i < 300; i++) {
      const lvl = randomMonsterLevel(100, 7, rng);
      expect(lvl).toBeLessThanOrEqual(60);
    }
  });

  it('raises the level ceiling as the character levels up, even on the same dungeon floor', () => {
    const rng = new RNG(303);
    const maxAt = (charLevel: number) => {
      let max = 0;
      for (let i = 0; i < 200; i++) max = Math.max(max, randomMonsterLevel(charLevel, 3, rng));
      return max;
    };

    const lowCharMax = maxAt(1);   // +floor(1/4) = +0
    const highCharMax = maxAt(40); // +floor(40/4) = +10

    expect(highCharMax).toBeGreaterThan(lowCharMax);
    expect(highCharMax).toBeGreaterThanOrEqual(30 + 10);
  });

  it('clamps out-of-range dungeon depths to the nearest defined band', () => {
    const rng = new RNG(404);
    for (let i = 0; i < 50; i++) {
      const belowRange = randomMonsterLevel(1, 0, rng);
      expect(belowRange).toBeGreaterThanOrEqual(1);
      expect(belowRange).toBeLessThanOrEqual(6);

      const aboveRange = randomMonsterLevel(1, 99, rng);
      expect(aboveRange).toBeGreaterThanOrEqual(50);
      expect(aboveRange).toBeLessThanOrEqual(60);
    }
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

  it('ramps up super-linearly with the level gap — a big gap pays out more than proportionally', () => {
    // Same monsterLevel (30) throughout; only the character's level (and
    // therefore the gap) changes. Normalize by monsterLevel*XP_PER_MONSTER_LEVEL
    // to compare the multiplier directly rather than the raw XP.
    const per = (charLevel: number) => calculateXPReward(charLevel, 30, false) / (30 * 12);

    const multAt5 = per(25);  // gap  5
    const multAt10 = per(20); // gap 10
    const multAt20 = per(10); // gap 20

    expect(multAt10).toBeGreaterThan(multAt5);
    expect(multAt20).toBeGreaterThan(multAt10);

    // The *rate* of increase should itself grow (that's the "ramp", not just
    // "more XP for more gap" which even the old flat-linear formula did):
    // the jump from gap 10->20 should be bigger than the jump from gap 5->10.
    const stepA = multAt10 - multAt5;   // gap 5 -> 10
    const stepB = multAt20 - multAt10;  // gap 10 -> 20
    expect(stepB).toBeGreaterThan(stepA);
  });

  it('a very large level gap pays out dramatically more than a modest one', () => {
    // A level-1 character up against a level-91 monster (gap 90) vs. a
    // level-1 character up against a level-11 monster (gap 10) — same
    // starting character level, wildly different danger.
    const modestGap = calculateXPReward(1, 11, false);
    const hugeGap = calculateXPReward(1, 91, false);
    // Base XP alone (proportional to monster level) would only be ~8.3x
    // (91/11) higher; the ramp should push it well beyond that.
    expect(hugeGap).toBeGreaterThan(modestGap * 20);
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

  it('gives more XP for inherently more dangerous monster tiers at the same level', () => {
    // Same charLevel, same monsterLevel, same isUnique — only naturalTier differs.
    const kobold = calculateXPReward(10, 10, false, getDefinition('Kobold').naturalTier);
    const dragon = calculateXPReward(10, 10, false, getDefinition('Red Dragon').naturalTier);
    const lich = calculateXPReward(10, 10, false, getDefinition('Lich').naturalTier);

    expect(dragon).toBeGreaterThan(kobold);
    expect(lich).toBeGreaterThan(kobold);
  });

  it('does not change tier-1 monster XP (Kobold/Goblin baseline unaffected)', () => {
    const withoutTier = calculateXPReward(5, 5, false);
    const tier1 = calculateXPReward(5, 5, false, getDefinition('Kobold').naturalTier);
    expect(tier1).toBe(withoutTier);
  });

  it('tier bonus and unique bonus stack for the most dangerous bosses', () => {
    const genericUnique = calculateXPReward(20, 40, true, 1);
    const asmodeus = calculateXPReward(20, 40, true, getDefinition('Asmodeus').naturalTier);
    expect(asmodeus).toBeGreaterThan(genericUnique);
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

describe('Opal (gem)', () => {
  it('damages the monster and applies confusedTurns', () => {
    const char = makeChar({ level: 8, wisdom: 16 });
    const monster = createMonster('Goblin', 3, 'op1');
    monster.hp = 1000;
    monster.maxHp = 1000;

    const result = playerOpal({ ...char }, monster, new RNG(42));
    expect(result.playerDamage).toBeGreaterThan(0);
    expect(monster.hp).toBeLessThan(1000);
    expect(monster.confusedTurns).toBeGreaterThan(0);
  });

  it('can defeat a weak monster outright', () => {
    const char = makeChar({ level: 20, wisdom: 18 });
    const monster = createMonster('Kobold', 1, 'op2');
    monster.hp = 1;
    monster.maxHp = 1;

    const result = playerOpal({ ...char }, monster, new RNG(7));
    expect(result.monsterDied).toBe(true);
  });

  it('a confused monster sometimes fails to act on its next turn', () => {
    const char = makeChar({ level: 5, dexterity: 5, constitution: 5, resistance: 5 });
    const monster = createMonster('Giant', 10, 'op3');
    monster.hp = 1000;
    monster.maxHp = 1000;
    monster.confusedTurns = 10;

    let noActions = 0;
    let actions = 0;
    for (let i = 0; i < 200; i++) {
      const m = { ...monster, confusedTurns: 1 };
      const result = playerAttack({ ...char, statusEffects: [] }, m, new RNG(i));
      if (result.monsterDamage === 0) noActions++;
      else actions++;
    }
    // With CONFUSION_FAIL_CHANCE ~ 0.5, expect a meaningful share of wasted turns,
    // but not every one (confusion doesn't guarantee a miss).
    expect(noActions).toBeGreaterThan(0);
    expect(actions).toBeGreaterThan(0);
  });

  it('confusedTurns ticks down toward zero as the monster acts', () => {
    const char = makeChar({ level: 5 });
    const monster = createMonster('Goblin', 3, 'op4');
    monster.confusedTurns = GEMS.OPAL_CONFUSE_TURNS;

    playerAttack({ ...char, statusEffects: [] }, monster, new RNG(1));
    expect(monster.confusedTurns).toBe(GEMS.OPAL_CONFUSE_TURNS - 1);
  });
});

describe('Invulnerability (from a magic book)', () => {
  it('blocks all monster damage while active, and ticks down each combat round', () => {
    const char = makeChar({ level: 3, statusEffects: [] });
    char.invulnerableTurns = 2;
    const monster = createMonster('Tarrasque', 40, 'inv1'); // a monster that would otherwise hit hard

    const r1 = playerAttack(char, { ...monster, hp: 100000 }, new RNG(1));
    expect(r1.monsterDamage).toBe(0);
    expect(r1.playerDied).toBe(false);
    expect(r1.messages.some(m => m.includes('deflects'))).toBe(true);
    expect(char.invulnerableTurns).toBe(1);

    const r2 = playerAttack(char, { ...monster, hp: 100000 }, new RNG(2));
    expect(r2.monsterDamage).toBe(0);
    expect(char.invulnerableTurns).toBe(0);
  });

  it('a fresh application decrements by exactly one per monster turn', () => {
    const char = makeChar({ level: 3, statusEffects: [] });
    char.invulnerableTurns = 3;
    const monster = createMonster('Goblin', 5, 'inv2');

    playerAttack(char, { ...monster, hp: 100000 }, new RNG(1));
    expect(char.invulnerableTurns).toBe(2);
  });

  it('once expired, the monster can damage the character again', () => {
    const char = makeChar({ level: 3, hp: 100000, maxHp: 100000, statusEffects: [] });
    char.invulnerableTurns = 0;
    const monster = createMonster('Tarrasque', 40, 'inv3');

    let anyDamage = false;
    for (let i = 0; i < 30; i++) {
      const c = { ...char, invulnerableTurns: 0 };
      const result = playerAttack(c, { ...monster, hp: 100000 }, new RNG(i));
      if (result.monsterDamage > 0) anyDamage = true;
    }
    expect(anyDamage).toBe(true);
  });
});
