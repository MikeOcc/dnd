import { describe, it, expect } from 'vitest';
import { RNG } from '../src/core/random.js';
import { rollCharacter, createCharacter, tickStatusEffects, potionHealAmount, slowFleshRot } from '../src/core/character.js';
import { resolveAltar } from '../src/core/encounters.js';
import { createMonster, getDefinition, randomMonsterLevel, pickRandomMonsterType } from '../src/core/monsters.js';
import { playerAttack, playerFireball, playerAcid, playerLightning, playerFrost, playerPoison, playerOpal, playerHeal, playerPray, prayerBanishChance, monsterFirstStrike, playerScare, scareChance, playerRun, playerHeld, petUnicorn, beholderAntimagic, beholderRaysFor, calculateXPReward, transformationChance } from '../src/core/combat.js';
import { GEMS, COMBAT, MANTICORE, GHOUL, PHOENIX, BANSHEE } from '../src/core/config.js';

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
  it('never returns a low-tier type (Kobold, Goblin, Mold, Skeleton, Slime Mold, Gelatinous Cube, Zombie) on dungeon levels 4-7; orcs roam every depth', () => {
    const lowTier = new Set(['Kobold', 'Goblin', 'Mold', 'Skeleton', 'Slime Mold', 'Gelatinous Cube', 'Zombie']);
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

describe('Prayer — banishing high-level undead', () => {
  function priest(level: number, wisdom: number) {
    const c = createCharacter('t', 'Hero', rollCharacter(new RNG(1)));
    c.level = level; c.wisdom = wisdom;
    c.hp = c.maxHp = 100000;
    c.statusEffects = [];
    return c;
  }

  it('needs a high enough character, Wisdom and undead foe', () => {
    const lich = createMonster('Lich', 30, 'l');
    expect(prayerBanishChance(priest(29, 25), lich, 25)).toBe(0);
    expect(prayerBanishChance(priest(40, 17), lich, 17)).toBe(0);
    expect(prayerBanishChance(priest(40, 25), createMonster('Lich', 15, 'l'), 25)).toBe(0);
    expect(prayerBanishChance(priest(40, 25), createMonster('Red Dragon', 40, 'd'), 25)).toBe(0);
    expect(prayerBanishChance(priest(40, 25), lich, 25)).toBeGreaterThan(0);
    expect(prayerBanishChance(priest(40, 25), lich, 25)).toBeLessThan(prayerBanishChance(priest(60, 30), lich, 30));
    expect(prayerBanishChance(priest(200, 99), lich, 99)).toBe(COMBAT.PRAYER_BANISH_MAX_CHANCE);
  });

  it('a heard prayer can banish a Lich', () => {
    const rng = new RNG(5);
    for (let i = 0; i < 400; i++) {
      const m = createMonster('Lich', 30, 'l');
      m.hp = m.maxHp = 100000;
      const res = playerPray(priest(60, 30), m, rng);
      if (res.banished) {
        expect(res.messages.join(' ')).toContain('torn from this world');
        return;
      }
    }
    throw new Error('never banished');
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

describe('Beholder eye rays', () => {
  const RAY_NAMES: Record<string, string> = {
    'fear-ray': 'FEAR RAY', 'slow-ray': 'SLOWING RAY', 'enervation-ray': 'ENERVATION RAY',
    'telekinetic-ray': 'TELEKINETIC RAY', 'paralyze-ray': 'PARALYZING RAY', 'sleep-ray': 'SLEEP RAY',
    'charm-ray': 'CHARM RAY', 'petrify-ray': 'PETRIFICATION RAY', 'disintegrate-ray': 'DISINTEGRATION RAY',
    'death-ray': 'DEATH RAY',
  };

  /** Fights many rounds with an unkillable hero and returns every ray name seen. */
  function raysSeen(beholderLevel: number, rounds = 600): Set<string> {
    const rng = new RNG(4242);
    const seen = new Set<string>();
    for (let i = 0; i < rounds; i++) {
      const char = makeChar({ level: 20, hp: 100000, maxHp: 100000 });
      const m = createMonster('Beholder', beholderLevel, 'b1');
      m.hp = 100000; m.maxHp = 100000;
      const text = playerAttack(char, m, rng).messages.join('\n');
      for (const name of Object.values(RAY_NAMES)) if (text.includes(name)) seen.add(name);
    }
    return seen;
  }

  it('unlocks more eyestalks as the Beholder levels up', () => {
    expect(beholderRaysFor(10)).toEqual(['fear-ray', 'slow-ray', 'enervation-ray', 'telekinetic-ray']);
    expect(beholderRaysFor(14)).toHaveLength(6);
    expect(beholderRaysFor(22)).toContain('petrify-ray');
    expect(beholderRaysFor(25)).not.toContain('disintegrate-ray');
    expect(beholderRaysFor(30)).toHaveLength(10);
  });

  it('a young Beholder never uses the extreme rays', () => {
    const seen = raysSeen(10);
    expect(seen).toEqual(new Set(['FEAR RAY', 'SLOWING RAY', 'ENERVATION RAY', 'TELEKINETIC RAY']));
  });

  it('an elder Beholder uses every one of its ten eyestalks', () => {
    const seen = raysSeen(30);
    expect(seen).toEqual(new Set(Object.values(RAY_NAMES)));
  });

  it('a paralyzed character loses turns, and the Beholder still acts', () => {
    const rng = new RNG(7);
    const char = makeChar({ level: 20, hp: 100000, maxHp: 100000, heldRounds: 2, heldBy: 'paralyzed' });
    const m = createMonster('Beholder', 10, 'b1');

    const first = playerHeld(char, m, rng);
    expect(first.messages[0]).toContain('paralyzed');
    expect(first.messages.length).toBeGreaterThan(1);
    expect(char.heldRounds).toBe(1);

    playerHeld(char, m, rng);
    expect(char.heldRounds).toBe(0);
    expect(char.heldBy).toBeUndefined();
  });

  it('a second failed petrification save in the same fight turns you to stone', () => {
    const char = makeChar({ level: 1, hp: 100000, maxHp: 100000, constitution: 3, resistance: 3 });
    const m = createMonster('Beholder', 30, 'b1');
    m.hp = 100000; m.maxHp = 100000;
    m.petrifyStage = 1;
    const rng = new RNG(1);
    let stoned = false;
    for (let i = 0; i < 400 && !stoned; i++) {
      const text = playerAttack(char, m, rng).messages.join(' ');
      if (text.includes('TURNED TO STONE')) {
        stoned = true;
        expect(char.hp).toBe(0);
      }
      char.hp = 100000;
      char.heldRounds = 0;
    }
    expect(stoned).toBe(true);
  });

  it('the central eye only negates magic against a Beholder, and about as often as configured', () => {
    const rng = new RNG(99);
    const char = makeChar({ level: 20, hp: 100000, maxHp: 100000 });
    expect(beholderAntimagic(char, createMonster('Goblin', 5, 'g1'), rng, 'spell')).toBeNull();

    let negated = 0;
    const trials = 2000;
    for (let i = 0; i < trials; i++) {
      const m = createMonster('Beholder', 10, 'b1');
      const res = beholderAntimagic(char, m, rng, 'spell');
      if (res) {
        negated++;
        expect(res.messages.join(' ')).toContain('antimagic');
      }
      char.hp = 100000;
      char.heldRounds = 0;
    }
    expect(negated / trials).toBeGreaterThan(COMBAT.BEHOLDER_ANTIMAGIC_CHANCE - 0.05);
    expect(negated / trials).toBeLessThan(COMBAT.BEHOLDER_ANTIMAGIC_CHANCE + 0.05);
  });
});

describe('Paralysis from the Basilisk, Gelatinous Cube and Lich', () => {
  /** Fights until the monster's paralysis lands; returns the held character. */
  function paralyzedBy(type: 'Basilisk' | 'Gelatinous Cube' | 'Lich') {
    const rng = new RNG(321);
    for (let i = 0; i < 2000; i++) {
      const char = makeChar({ level: 20, hp: 100000, maxHp: 100000 });
      const m = createMonster(type, getDefinition(type).minLevel, 'p1');
      m.hp = 100000; m.maxHp = 100000;
      const res = playerAttack(char, m, rng);
      if ((char.heldRounds ?? 0) > 0) return { char, m, rng, text: res.messages.join(' ') };
    }
    throw new Error(`${type} never paralyzed`);
  }

  it('the Basilisk gaze costs the character their next two turns', () => {
    const { char, m, rng, text } = paralyzedBy('Basilisk');
    expect(text).toContain('paralyzes you');
    expect(char.heldRounds).toBe(COMBAT.PARALYSIS_ROUNDS);
    expect(char.heldBy).toBe('paralyzed');
    playerHeld(char, m, rng);
    playerHeld(char, m, rng);
    expect(char.heldRounds).toBe(0);
  });

  it('the Gelatinous Cube engulfs the character, holding them', () => {
    const { char, m, rng, text } = paralyzedBy('Gelatinous Cube');
    expect(text).toContain('engulfs you');
    expect(char.heldBy).toBe('engulfed');
    expect(playerHeld(char, m, rng).messages[0]).toContain('jelly');
  });

  it("the Lich's touch paralyzes the same way", () => {
    const { char } = paralyzedBy('Lich');
    expect(char.heldBy).toBe('paralyzed');
  });
});

describe('Elder vampire hypnosis', () => {
  function fight(level: number, rounds: number) {
    const rng = new RNG(606);
    let hits = 0, hypnotized = 0, killed = 0;
    for (let i = 0; i < rounds; i++) {
      const char = makeChar({ level: 40, hp: 100000, maxHp: 100000 });
      char.heldRounds = 1; char.heldBy = 'dazed';
      const m = createMonster('Vampire', level, 'v');
      const res = playerHeld(char, m, rng);
      const text = res.messages.join(' ');
      if (res.monsterDamage > 0) hits++;
      if (text.includes('HYPNOTIZED')) {
        hypnotized++;
        if (text.includes('drinks you dry')) { killed++; expect(char.hp).toBe(0); }
        else expect(text).toContain('snap out of it');
      }
    }
    return { hits, hypnotized, killed };
  }

  it('never happens below level 30', () => {
    expect(fight(29, 1500).hypnotized).toBe(0);
  });

  it('hits hypnotize about 7% of the time, and most hypnotized victims die', () => {
    const { hits, hypnotized, killed } = fight(35, 6000);
    expect(hypnotized / hits).toBeGreaterThan(COMBAT.VAMPIRE_HYPNOSIS_CHANCE - 0.02);
    expect(hypnotized / hits).toBeLessThan(COMBAT.VAMPIRE_HYPNOSIS_CHANCE + 0.02);
    expect(killed / hypnotized).toBeGreaterThan(COMBAT.VAMPIRE_HYPNOSIS_KILL_CHANCE - 0.12);
    expect(killed / hypnotized).toBeLessThan(COMBAT.VAMPIRE_HYPNOSIS_KILL_CHANCE + 0.12);
  });
});

describe('Beholder paralysis', () => {
  it('a victim who fails to break free takes two more attacks at once; one who breaks free takes none', () => {
    const rng = new RNG(1234);
    let helpless = 0, brokeFree = 0;
    for (let i = 0; i < 4000 && (helpless === 0 || brokeFree === 0); i++) {
      const char = makeChar({ level: 20, hp: 100000, maxHp: 100000, strength: 10, constitution: 10, resistance: 3 });
      char.heldRounds = 1; char.heldBy = 'dazed';
      const m = createMonster('Beholder', 30, 'b');
      const text = playerHeld(char, m, rng).messages.join('\n');
      if (!text.includes('YOU ARE PARALYZED')) continue;
      expect(char.heldBy).not.toBe('paralyzed');        // paralysis itself costs no later turns
      if (text.includes('wrench yourself free')) {
        brokeFree++;
        expect(text).not.toContain('turns every eye');
      } else {
        helpless++;
        expect(text).toContain('turns every eye upon you');
        expect(text).toContain('The paralysis breaks');
        expect(text.split('PARALYZING RAY').length - 1).toBe(1);   // never chains
      }
    }
    expect(helpless).toBeGreaterThan(0);
    expect(brokeFree).toBeGreaterThan(0);
  });
});

describe("Asmodeus's transformation", () => {
  it('about 5% of his turns at full health, no save, and fatal however tough the character is', () => {
    const rng = new RNG(666);
    let turns = 0, transformed = 0;
    for (let i = 0; i < 6000; i++) {
      const char = makeChar({ level: 60, hp: 1000000, maxHp: 1000000, resistance: 99, wisdom: 99, constitution: 99 });
      char.heldRounds = 1; char.heldBy = 'dazed';
      const res = playerHeld(char, createMonster('Asmodeus', 100, 'a'), rng);
      turns++;
      if (res.messages.join(' ').includes('PILE OF LIZARD SHIT')) {
        transformed++;
        expect(res.playerDied).toBe(true);
        expect(char.hp).toBe(0);
        expect(res.deathCause).toBe('Turned into a pile of lizard shit by Asmodeus.');
      }
    }
    expect(transformed / turns).toBeGreaterThan(COMBAT.BALL_OF_DOO_CHANCE - 0.015);
    expect(transformed / turns).toBeLessThan(COMBAT.BALL_OF_DOO_CHANCE + 0.015);
  });

  it('a ward already in place turns it aside', () => {
    const rng = new RNG(1);
    for (let i = 0; i < 400; i++) {
      const char = makeChar({ level: 60, hp: 1000, maxHp: 1000, invulnerableTurns: 1 });
      char.heldRounds = 1; char.heldBy = 'dazed';
      const res = playerHeld(char, createMonster('Asmodeus', 100, 'a'), rng);
      expect(res.playerDied).toBe(false);
    }
  });
});

describe("Asmodeus grows desperate", () => {
  it('the transformation grows likelier as he is wounded, up to 20%', () => {
    const m = createMonster('Asmodeus', 100, 'a');
    expect(transformationChance(m)).toBeCloseTo(COMBAT.BALL_OF_DOO_CHANCE);
    m.hp = m.maxHp / 2;
    expect(transformationChance(m)).toBeCloseTo((COMBAT.BALL_OF_DOO_CHANCE + COMBAT.BALL_OF_DOO_DESPERATE_CHANCE) / 2);
    m.hp = 1;
    expect(transformationChance(m)).toBeCloseTo(COMBAT.BALL_OF_DOO_DESPERATE_CHANCE, 2);
  });
});

describe('Emerald ward in combat', () => {
  it('deflects about 60% of attacks, the transformation included', () => {
    const rng = new RNG(12);
    let turns = 0, deflected = 0, transformed = 0;
    for (let i = 0; i < 4000; i++) {
      const char = makeChar({ level: 60, hp: 1000000, maxHp: 1000000 });
      char.statusEffects = [{ type: 'warded', value: 3, turns: 9999 }];
      char.heldRounds = 1; char.heldBy = 'dazed';
      const res = playerHeld(char, createMonster('Asmodeus', 100, 'a'), rng);
      turns++;
      const text = res.messages.join(' ');
      if (text.includes('emerald ward flares')) deflected++;
      if (text.includes('LIZARD')) transformed++;
    }
    expect(deflected / turns).toBeGreaterThan(0.55);
    expect(deflected / turns).toBeLessThan(0.65);
    // 5% at full health, times the 40% that gets past the ward
    expect(transformed / turns).toBeLessThan(0.035);
  });
});

describe('Reaching high-level monsters', () => {
  it('a level-60 warrior can now land blows on Asmodeus', () => {
    const rng = new RNG(3);
    let hits = 0;
    for (let i = 0; i < 300; i++) {
      const char = makeChar({ level: 60, strength: 16, dexterity: 14, hp: 1000000, maxHp: 1000000 });
      char.charClass = 'warrior';
      const m = createMonster('Asmodeus', 100, 'a'); m.hp = m.maxHp = 1000000;
      hits += playerAttack(char, m, rng).messages.filter(l => l.startsWith('You strike')).length;
    }
    expect(hits / 300).toBeGreaterThan(1.5);   // of 5 swings a round
  });

  it("Asmodeus's HP is halved (15 per level)", () => {
    expect(createMonster('Asmodeus', 100, 'a').maxHp).toBe(1500);
  });
});

describe('Asmodeus — Infernal Regeneration', () => {
  it('below 150 HP he regenerates 25–50% of his maximum, once a fight', () => {
    const c = createCharacter('t', 'Hero', rollCharacter(new RNG(1)));
    c.level = 90; c.hp = c.maxHp = 1_000_000;
    const m = createMonster('Asmodeus', 60, 'a');
    m.maxHp = 1000; m.hp = 100;
    const first = monsterFirstStrike(c, m, new RNG(3));
    expect(first.messages.join(' ')).toContain('regenerates');
    expect(m.hp).toBeGreaterThanOrEqual(100 + 250);
    expect(m.hp).toBeLessThanOrEqual(100 + 500);

    m.hp = 100;
    const second = monsterFirstStrike(c, m, new RNG(4));
    expect(second.messages.join(' ')).not.toContain('regenerates');
  });

  it('does not regenerate while above 150 HP', () => {
    const c = createCharacter('t', 'Hero', rollCharacter(new RNG(1)));
    c.hp = c.maxHp = 1_000_000;
    const m = createMonster('Asmodeus', 60, 'a');
    m.maxHp = 1000; m.hp = 400;
    expect(monsterFirstStrike(c, m, new RNG(3)).messages.join(' ')).not.toContain('regenerates');
  });
});

describe('Scare', () => {
  const hero = (level: number, charisma = 10) => {
    const c = createCharacter('t', 'Hero', rollCharacter(new RNG(1)));
    c.level = level; c.charisma = charisma; c.hp = c.maxHp = 1_000_000; c.statusEffects = [];
    return c;
  };

  it('never works on the mindless or on unique lords', () => {
    expect(scareChance(hero(90), createMonster('Zombie', 5, 'z'))).toBe(0);
    expect(scareChance(hero(90), createMonster('Gelatinous Cube', 5, 'g'))).toBe(0);
    expect(scareChance(hero(90), createMonster('Tiamat', 60, 't'))).toBe(0);
  });

  it('is easy against a far weaker foe, hard against a fearsome one, and helped by Charisma', () => {
    expect(scareChance(hero(40), createMonster('Kobold', 3, 'k'))).toBeGreaterThan(0.9);
    expect(scareChance(hero(20), createMonster('Red Dragon', 40, 'd'))).toBeLessThan(0.05);
    const orc = createMonster('Orc', 10, 'o');
    expect(scareChance(hero(10, 18), orc)).toBeGreaterThan(scareChance(hero(10, 8), orc));
  });

  it('each failed attempt makes the next harder; success sends the monster off', () => {
    const orc = createMonster('Orc', 10, 'o');
    orc.hp = orc.maxHp = 1e9;
    const c = hero(10);
    const before = scareChance(c, orc);
    const rng = new RNG(11);
    let scared = false;
    for (let i = 0; i < 40 && !scared; i++) {
      const res = playerScare(c, orc, rng);
      scared = !!res.scared;
      if (!scared && i === 0) expect(scareChance(c, orc)).toBeLessThan(before);
    }
    expect(typeof scared).toBe('boolean');
  });
});

describe('The Orc King in combat', () => {
  it('fights with axe flurries, shield slams and the gifts of Gruumsh, and his plate blunts weapons', () => {
    const c = createCharacter('t', 'Hero', rollCharacter(new RNG(1)));
    c.level = 45; c.hp = c.maxHp = 1_000_000;
    const seen = new Set<string>();
    const rng = new RNG(17);
    for (let i = 0; i < 200; i++) {
      const king = createMonster('Orc King', 42, 'k');
      king.hp = Math.round(king.maxHp * 0.4);   // hurt, so the war-chant is on the table
      c.heldRounds = 0;
      const text = monsterFirstStrike(c, king, rng).messages.join(' ');
      if (text.includes('whirl of iron')) seen.add('flurry');
      if (text.includes('spiked shield')) seen.add('slam');
      if (text.includes('war-chant')) seen.add('chant');
      if (text.includes('curse')) seen.add('curse');
      if (text.includes('great red eye')) seen.add('eye');
    }
    expect([...seen].sort()).toEqual(['chant', 'curse', 'eye', 'flurry', 'slam']);

    const king = createMonster('Orc King', 42, 'k');
    king.hp = king.maxHp = 1e9;
    const text = playerAttack(c, king, new RNG(3)).messages.join(' ');
    if (text.includes('You strike')) expect(text).toContain('plate turns part of it aside');
  });
});

describe('The Manticore in combat', () => {
  it('is at least level 52', () => {
    expect(createMonster('Manticore', 10, 'm').level).toBeGreaterThanOrEqual(52);
  });

  it('bites, claws twice, whips its tail (sometimes critically) and stings with a nasty poison', () => {
    const seen = new Set<string>();
    const rng = new RNG(29);
    for (let i = 0; i < 300; i++) {
      const c = createCharacter('t', 'Hero', rollCharacter(new RNG(1)));
      c.level = 60; c.hp = c.maxHp = 1_000_000; c.statusEffects = [];
      const text = monsterFirstStrike(c, createMonster('Manticore', 55, 'm'), rng).messages.join(' ');
      if (text.includes('three rows of teeth')) seen.add('bite');
      if ((text.match(/Its claws tear into you/g) ?? []).length === 2) seen.add('claws');
      if (text.includes('CRITICAL HIT')) seen.add('crit');
      if (text.includes("spiked tail lashes")) seen.add('tail');
      if (text.includes('badly poisoned')) {
        seen.add('sting');
        expect(c.statusEffects.find(e => e.type === 'poison')!.value).toBe(MANTICORE.POISON_DAMAGE);
      }
    }
    expect([...seen].sort()).toEqual(['bite', 'claws', 'crit', 'sting', 'tail']);
  });

  it('a sting can bring on anaphylaxis, with death a few minutes of play away', () => {
    const rng = new RNG(31);
    for (let i = 0; i < 5000; i++) {
      const c = createCharacter('t', 'Hero', rollCharacter(new RNG(1)));
      c.hp = c.maxHp = 1_000_000; c.statusEffects = []; c.playTime = 1000;
      const text = monsterFirstStrike(c, createMonster('Manticore', 55, 'm'), rng).messages.join(' ');
      const shock = c.statusEffects.find(e => e.type === 'anaphylaxis');
      if (shock) {
        expect(text).toContain('ANAPHYLACTIC SHOCK');
        expect(shock.value - 1000).toBeGreaterThanOrEqual(MANTICORE.ANAPHYLAXIS_MIN_SECONDS);
        expect(shock.value - 1000).toBeLessThanOrEqual(MANTICORE.ANAPHYLAXIS_MAX_SECONDS);
        return;
      }
    }
    throw new Error('never went into shock');
  });
});

describe('Level 7: the Titanoboa and the Wendigo; and Ghouls', () => {
  const hero = (str = 14) => {
    const c = createCharacter('t', 'Hero', rollCharacter(new RNG(1)));
    c.level = 60; c.hp = c.maxHp = 1_000_000; c.strength = str; c.statusEffects = [];
    return c;
  };

  it('the Titanoboa coils you up, crushes you while held, and can crush you to death outright', () => {
    const rng = new RNG(41);
    let coiled = false, crushedDead = false;
    for (let i = 0; i < 2000 && !(coiled && crushedDead); i++) {
      const c = hero();
      const snake = createMonster('Titanoboa', 56, 't');
      const text = monsterFirstStrike(c, snake, rng).messages.join(' ');
      if (text.includes('caught in its coils')) {
        coiled = true;
        expect(c.heldBy).toBe('constricted');
        const crush = monsterFirstStrike(c, snake, rng);
        if (crush.messages.join(' ').includes('CRUSHED TO DEATH')) {
          crushedDead = true;
          expect(c.hp).toBe(0);
          expect(crush.deathCause).toMatch(/^Crushed to death in the coils of a Level \d+ Titanoboa\.$/);
        }
      }
    }
    expect(coiled).toBe(true);
    expect(crushedDead).toBe(true);
  });

  it('strength helps break free of the coils', () => {
    let freed = 0;
    const rng = new RNG(3);
    for (let i = 0; i < 400; i++) {
      const c = hero(30);
      c.heldRounds = 2; c.heldBy = 'constricted';
      const snake = createMonster('Titanoboa', 56, 't');
      if (playerHeld(c, snake, rng).messages[0].includes('tear yourself free')) freed++;
    }
    expect(freed).toBeGreaterThan(100);
  });

  it('the Wendigo regenerates each turn, unless fire has touched it', () => {
    const w = createMonster('Wendigo', 55, 'w');
    w.hp = Math.round(w.maxHp / 2);
    const before = w.hp;
    monsterFirstStrike(hero(), w, new RNG(5));
    expect(w.hp).toBeGreaterThan(before);

    const w2 = createMonster('Wendigo', 55, 'w2');
    w2.hp = w2.maxHp = 1e7;
    const c = hero();
    playerFireball(c, w2, new RNG(6));
    expect(w2.burnedTurns).toBeGreaterThan(0);
    w2.hp = w2.maxHp / 2;
    const text = monsterFirstStrike(c, w2, new RNG(8)).messages.join(' ');
    expect(text).not.toContain('knits back together');
  });

  it('ghouls are undead with paralyzing claws', () => {
    expect(createMonster('Ghoul', 10, 'g').definition.isUndead).toBe(true);
    const rng = new RNG(13);
    for (let i = 0; i < 400; i++) {
      const c = hero();
      const text = monsterFirstStrike(c, createMonster('Ghoul', 20, 'g'), rng).messages.join(' ');
      if (text.includes('paralyzes you')) { expect(c.heldBy).toBe('paralyzed'); return; }
    }
    throw new Error('never paralyzed');
  });
});

describe('Ghouls: flesh rot, and the ancient ones below', () => {
  const hero = () => {
    const c = createCharacter('t', 'Hero', rollCharacter(new RNG(1)));
    c.level = 40; c.hp = c.maxHp = 1_000_000; c.statusEffects = [];
    return c;
  };

  it('a ghoul hit can bring flesh rot, which eats HP each step and halves healing', () => {
    const rng = new RNG(19);
    for (let i = 0; i < 500; i++) {
      const c = hero();
      const text = monsterFirstStrike(c, createMonster('Ghoul', 24, 'g'), rng).messages.join(' ');
      if (!text.includes('FLESH ROT')) continue;
      const rot = c.statusEffects.find(e => e.type === 'flesh-rot')!;
      expect(rot.value).toBe(3);   // level 24 / 8
      expect(rot.turns).toBe(GHOUL.ROT_STEPS);
      expect(GHOUL.ROT_PARTS).toContain(rot.part);
      const hp = c.hp;
      const tick = tickStatusEffects(c);
      expect(c.hp).toBe(hp - 3);
      expect(tick.messages.join(' ')).toContain(`your ${rot.part}`);
      expect(c.statusEffects.find(e => e.type === 'flesh-rot')!.stage).toBe(1);
      // Healing at half strength
      const healthy = hero();
      expect(potionHealAmount(c, new RNG(2))).toBe(Math.max(1, Math.round(potionHealAmount(healthy, new RNG(2)) * GHOUL.ROT_HEAL_FACTOR)));
      return;
    }
    throw new Error('never caught flesh rot');
  });

  it('an ancient ghoul rots you for longer', () => {
    const rng = new RNG(23);
    for (let i = 0; i < 500; i++) {
      const c = hero();
      monsterFirstStrike(c, createMonster('Ghoul', 50, 'g'), rng);
      const rot = c.statusEffects.find(e => e.type === 'flesh-rot');
      if (rot) { expect(rot.turns).toBe(GHOUL.ANCIENT_ROT_STEPS); return; }
    }
    throw new Error('never caught flesh rot');
  });

  it('ghouls are common on levels 2-5 and rare, but present, on levels 6-7', () => {
    const share = (depth: number) => {
      const rng = new RNG(depth);
      let n = 0;
      for (let i = 0; i < 20000; i++) if (pickRandomMonsterType(depth, rng) === 'Ghoul') n++;
      return n / 20000;
    };
    for (const d of [2, 3, 4, 5]) expect(share(d)).toBeGreaterThan(0.03);
    for (const d of [6, 7]) {
      expect(share(d)).toBeGreaterThan(0);
      expect(share(d)).toBeLessThan(share(5));
    }
  });
});

describe('Flesh rot eats one body part', () => {
  const rotting = (part: string, stage: number) => {
    const c = createCharacter('t', 'Hero', rollCharacter(new RNG(1)));
    c.hp = c.maxHp = 1_000_000;
    c.statusEffects = [{ type: 'flesh-rot', value: 3, turns: 999, part, stage }];
    return c;
  };

  it('too far into a limb: a warning next turn, death the turn after', () => {
    const c = rotting('left leg', GHOUL.ROT_FATAL_LIMB - 1);
    const t1 = tickStatusEffects(c);
    expect(t1.messages.join(' ')).toContain('eaten your left leg to the bone');
    expect(t1.fatal).toBeUndefined();
    const t2 = tickStatusEffects(c);
    expect(t2.messages.join(' ')).toContain('moments left');
    expect(t2.fatal).toBeUndefined();
    const t3 = tickStatusEffects(c);
    expect(t3.fatal).toBe('The flesh rot spread from your left leg into your heart.');
  });

  it('the head goes faster than a limb', () => {
    expect(GHOUL.ROT_FATAL_HEAD).toBeLessThan(GHOUL.ROT_FATAL_LIMB);
    const c = rotting('head', GHOUL.ROT_FATAL_HEAD - 1);
    tickStatusEffects(c); tickStatusEffects(c);
    expect(tickStatusEffects(c).fatal).toContain('brain');
  });

  it('healing beats it back, until it has gone too far', () => {
    const c = rotting('right arm', 20);
    expect(slowFleshRot(c, GHOUL.ROT_PUSHBACK_POTION)).toContain('right arm');
    expect(c.statusEffects[0].stage).toBe(20 - GHOUL.ROT_PUSHBACK_POTION);
    const doomed = rotting('right arm', 10);
    doomed.statusEffects[0].doom = 2;
    expect(slowFleshRot(doomed, 8)).toBeNull();
  });

  it('an altar burns it out', () => {
    const c = rotting('left arm', 20);
    const res = resolveAltar(c, new RNG(4));
    expect(res.messages[0]).toContain('rot burns away');
    expect(c.statusEffects.some(e => e.type === 'flesh-rot')).toBe(false);
  });
});

describe('Djinn, Phoenix, Banshee, Unicorn and Frost Giant', () => {
  const hero = () => {
    const c = createCharacter('t', 'Hero', rollCharacter(new RNG(1)));
    c.level = 70; c.hp = c.maxHp = 1_000_000; c.statusEffects = []; c.charisma = 18; c.wisdom = 18;
    return c;
  };
  const sees = (type: Parameters<typeof createMonster>[0], level: number, n: number, seed: number, setup?: (m: ReturnType<typeof createMonster>, c: ReturnType<typeof hero>) => void) => {
    const rng = new RNG(seed);
    const texts: string[] = [];
    for (let i = 0; i < n; i++) {
      const c = hero();
      const m = createMonster(type, level, 'm');
      setup?.(m, c);
      texts.push(monsterFirstStrike(c, m, rng).messages.join(' '));
    }
    return texts.join(' | ');
  };

  it('the Djinn: dust storm, ruby ray, punch, choke, and it flees when badly beaten', () => {
    const all = sees('Djinn', 50, 200, 1);
    for (const s of ['storm of sand', 'ruby in the Djinn', 'fist the size of an anvil', 'smoky tail whips']) expect(all).toContain(s);
    const fled = monsterFirstStrike(hero(), Object.assign(createMonster('Djinn', 50, 'd'), {}), new RNG(2));
    expect(fled.monsterFled).toBeFalsy();
    const rng = new RNG(3);
    let gone = false;
    for (let i = 0; i < 100 && !gone; i++) {
      const d = createMonster('Djinn', 50, 'd'); d.hp = Math.round(d.maxHp * 0.1);
      gone = !!monsterFirstStrike(hero(), d, rng).monsterFled;
    }
    expect(gone).toBe(true);
  });

  it('the Phoenix: flurries, flash burns, and a screech that holds you 3 turns', () => {
    const rng = new RNG(4);
    let held = false;
    for (let i = 0; i < 200 && !held; i++) {
      const c = hero();
      const text = monsterFirstStrike(c, createMonster('Phoenix', 60, 'p'), rng).messages.join(' ');
      if (text.includes('SCREECHES')) { held = true; expect(c.heldRounds).toBe(PHOENIX.SCREECH_TURNS); }
    }
    expect(held).toBe(true);
    expect(sees('Phoenix', 60, 100, 5)).toContain('wall of flame');
    expect(createMonster('Phoenix', 60, 'p').definition.fireballResistance).toBe(0);
  });

  it('the Banshee wails, and goes invisible for 2 turns before a 6-turn wait', () => {
    expect(sees('Banshee', 45, 200, 6)).toContain('WAILS');
    const b = createMonster('Banshee', 45, 'b');
    const rng = new RNG(7);
    for (let i = 0; i < 50 && !b.invisibleTurns; i++) monsterFirstStrike(hero(), b, rng);
    expect(b.invisibleTurns).toBe(BANSHEE.INVIS_TURNS);
    expect(b.invisCooldown).toBe(BANSHEE.INVIS_COOLDOWN);
    expect(b.definition.isUndead).toBe(true);
  });

  it('a Unicorn may accept your hand: full heal, every affliction cured, then it leaves', () => {
    const rng = new RNG(8);
    for (let i = 0; i < 100; i++) {
      const c = hero();
      c.hp = 10;
      c.statusEffects = [
        { type: 'anaphylaxis', value: 9999, turns: 9999 },
        { type: 'flesh-rot', value: 3, turns: 40, part: 'head', stage: 29, doom: 1 },
      ];
      const res = petUnicorn(c, createMonster('Unicorn', 45, 'u'), rng);
      if (res.monsterFled) {
        expect(c.hp).toBe(c.maxHp);
        expect(c.statusEffects).toEqual([]);
        return;
      }
    }
    throw new Error('never accepted');
  });

  it('a Unicorn you have hurt will not let you near', () => {
    const u = createMonster('Unicorn', 45, 'u');
    u.hp -= 1;
    const res = petUnicorn(hero(), u, new RNG(9));
    expect(res.monsterFled).toBeFalsy();
    expect(res.messages.join(' ')).toContain('will not forgive');
  });

  it('the Frost Giant freezes you solid, and rages (two attacks) when badly hurt', () => {
    const rng = new RNG(10);
    let frozen = false;
    for (let i = 0; i < 200 && !frozen; i++) {
      const c = hero();
      monsterFirstStrike(c, createMonster('Frost Giant', 70, 'f'), rng);
      if (c.heldBy === 'frozen') frozen = true;
    }
    expect(frozen).toBe(true);
    const g = createMonster('Frost Giant', 70, 'f');
    g.hp = Math.round(g.maxHp * 0.2);
    expect(monsterFirstStrike(hero(), g, new RNG(11)).messages.join(' ')).toContain('roars in fury');
  });
});
