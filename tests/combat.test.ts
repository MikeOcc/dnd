import { describe, it, expect } from 'vitest';
import { RNG } from '../src/core/random.js';
import { rollCharacter, createCharacter } from '../src/core/character.js';
import { createMonster, getDefinition, randomMonsterLevel } from '../src/core/monsters.js';
import { playerAttack, playerFireball, playerAcid, playerLightning, playerFrost, playerPoison, playerHeal, playerPray, playerRun, calculateXPReward } from '../src/core/combat.js';

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

describe('Sanguinid', () => {
  it('is eligible to appear on any dungeon level', () => {
    const def = getDefinition('Sanguinid');
    expect(def.isUnique).toBe(false);
    expect(def.minDungeonLevel).toBe(1);
  });

  it('does not force a level-1 character into an unwinnable fight (regression)', () => {
    // minLevel used to be 9, which meant a level-1 character at dungeon
    // depth 1 (minDungeonLevel: 1) could still be clamped into facing a
    // level-9 Sanguinid and die to a single unavoidable round.
    const def = getDefinition('Sanguinid');
    expect(def.minLevel).toBeLessThanOrEqual(3);

    const rng = new RNG(4242);
    for (let i = 0; i < 200; i++) {
      const monsterLevel = randomMonsterLevel(1, 1, rng);
      const monster = createMonster('Sanguinid', monsterLevel, `sg-${i}`);
      expect(monster.level).toBeLessThanOrEqual(6);
    }
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
  it('has a wide 40-100 range instead of a single fixed level', () => {
    const def = getDefinition('Asmodeus');
    expect(def.minLevel).toBe(40);
    expect(def.maxLevel).toBe(100);
  });

  it('createMonster clamps within that range', () => {
    expect(createMonster('Asmodeus', 10, 'a1').level).toBe(40);
    expect(createMonster('Asmodeus', 500, 'a2').level).toBe(100);
    expect(createMonster('Asmodeus', 75, 'a3').level).toBe(75);
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
