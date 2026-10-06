import { describe, it, expect } from 'vitest';
import { RNG } from '../src/core/random.js';
import { rollCharacter, createCharacter, xpForLevel } from '../src/core/character.js';
import {
  initialPace, incrementPace, shouldTriggerRandomEncounter, resetPaceAfterCombat,
  resolveFountain, resolveChest, applyDeath, readBook,
  chestTrapFor, chestTrapDisarmChance, chestTrapDetectChance, springChestTrap, resolveTrapDisarm, resolveAltar, trapDisarmChance,
} from '../src/core/encounters.js';
import { ENCOUNTER, FOUNTAIN, DEATH, CONTENT_PER_LEVEL, GAMEPLAY, MAGIC_BOOK, CHEST_TRAPS, MONSTER_SCALING, TRAPS, GEMS } from '../src/core/config.js';
import { playerFireball } from '../src/core/combat.js';
import { createMonster } from '../src/core/monsters.js';
import { randomMonsterLevel } from '../src/core/monsters.js';

function makeChar() {
  const rng = new RNG(1);
  const roll = rollCharacter(rng);
  const char = createCharacter('test', 'Hero', roll);
  char.hp = char.maxHp;
  return char;
}

describe('Encounter pacing', () => {
  it('no encounter during grace period', () => {
    const rng = new RNG(42);
    const pace = initialPace(rng);
    pace.atLevelEntry = false;

    for (let i = 0; i < ENCOUNTER.GRACE_MOVES_MIN - 1; i++) {
      incrementPace(pace);
      const triggered = shouldTriggerRandomEncounter(pace, new RNG(i));
      expect(triggered).toBe(false);
    }
  });

  it('no encounter immediately at level entry', () => {
    const rng = new RNG(1);
    const pace = initialPace(rng);
    pace.atLevelEntry = true;

    for (let i = 0; i < 20; i++) {
      expect(shouldTriggerRandomEncounter(pace, new RNG(i))).toBe(false);
    }
  });

  it('no encounter immediately after death respawn', () => {
    const rng = new RNG(2);
    const pace = initialPace(rng);
    pace.atLevelEntry = false;
    pace.atDeathRespawn = true;

    for (let i = 0; i < 20; i++) {
      expect(shouldTriggerRandomEncounter(pace, new RNG(i))).toBe(false);
    }
  });

  it('encounter chance rises after grace period', () => {
    const rng = new RNG(99);
    const pace = initialPace(rng);
    pace.atLevelEntry = false;
    pace.graceMoves = ENCOUNTER.GRACE_MOVES_MIN;

    // Move through grace period
    for (let i = 0; i < pace.graceMoves; i++) incrementPace(pace);

    // Verify encounter is possible (but not guaranteed) after grace period
    let triggered = 0;
    for (let i = 0; i < 200; i++) {
      const testPace = { ...pace, movesSinceCombat: pace.graceMoves + 20 };
      if (shouldTriggerRandomEncounter(testPace, new RNG(i * 7))) triggered++;
    }
    expect(triggered).toBeGreaterThan(0);
  });

  it('resetPaceAfterCombat resets movesSinceCombat to 0', () => {
    const rng = new RNG(3);
    const pace = initialPace(rng);
    pace.movesSinceCombat = 50;

    resetPaceAfterCombat(pace, rng);
    expect(pace.movesSinceCombat).toBe(0);
  });

  it('grace period is in configured range', () => {
    const rng = new RNG(4);
    for (let i = 0; i < 50; i++) {
      const pace = initialPace(new RNG(i));
      expect(pace.graceMoves).toBeGreaterThanOrEqual(ENCOUNTER.GRACE_MOVES_MIN);
      expect(pace.graceMoves).toBeLessThanOrEqual(ENCOUNTER.GRACE_MOVES_MAX);
    }
  });
});

describe('Fountain healing', () => {
  it('heals at approximately 50% rate (statistical)', () => {
    const rng = new RNG(12345);
    let healed = 0;
    const trials = 10000;

    for (let i = 0; i < trials; i++) {
      const char = makeChar();
      char.hp = 1;
      const result = resolveFountain(char, rng);
      if (result.hpRestored) healed++;
    }

    const rate = healed / trials;
    // Allow ±5% from configured 50%
    expect(rate).toBeGreaterThan(FOUNTAIN.HEAL_CHANCE - 0.05);
    expect(rate).toBeLessThan(FOUNTAIN.HEAL_CHANCE + 0.05);
  });

  it('full heal restores HP to max', () => {
    const rng = new RNG(999999);
    let found = false;

    for (let i = 0; i < 1000; i++) {
      const char = makeChar();
      char.hp = 5;
      const beforeMax = char.maxHp;
      const result = resolveFountain(char, new RNG(i * 13));
      if (result.hpRestored) {
        expect(char.hp).toBe(beforeMax);
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });
});

describe('Chest loot', () => {
  it('grants potions at approximately 20% rate below the first level (statistical)', () => {
    const rng = new RNG(2468);
    let potionChests = 0;
    const trials = 10000;

    for (let i = 0; i < trials; i++) {
      const char = makeChar();
      char.dungeonLevel = 2;   // level 1 adds extra potions of its own
      const before = char.inventory.potions;
      resolveChest(char, rng);
      if (char.inventory.potions > before) potionChests++;
    }

    const rate = potionChests / trials;
    expect(rate).toBeGreaterThan(0.15);
    expect(rate).toBeLessThan(0.25);
  });

  it('can grant multiple potions in a single chest (1-4)', () => {
    const rng = new RNG(13579);
    const counts = new Set<number>();

    for (let i = 0; i < 2000; i++) {
      const char = makeChar();
      const before = char.inventory.potions;
      resolveChest(char, rng);
      const gained = char.inventory.potions - before;
      if (gained > 0) counts.add(gained);
    }

    expect(Math.max(...counts)).toBeGreaterThan(1);
    expect(Math.max(...counts)).toBeLessThanOrEqual(4);
    expect(Math.min(...counts)).toBeGreaterThanOrEqual(1);
  });

  it('can grant gemstones as a distinct, richer find alongside gold', () => {
    const rng = new RNG(9911);
    let sawGems = false;

    for (let i = 0; i < 2000; i++) {
      const char = makeChar();
      const result = resolveChest(char, rng);
      if (result.messages.some(m => m.includes('gemstones'))) sawGems = true;
    }

    expect(sawGems).toBe(true);
  });

  it('can grant a gem item, distinct from the gold-value gemstone pouch', () => {
    const rng = new RNG(31415);
    let sawGemItem = false;
    const seenTypes = new Set<string>();

    for (let i = 0; i < 5000; i++) {
      const char = makeChar();
      const before = { ...char.inventory.gems };
      const result = resolveChest(char, rng);
      if (result.gemGained) {
        sawGemItem = true;
        seenTypes.add(result.gemGained);
        expect(char.inventory.gems[result.gemGained]).toBe(before[result.gemGained] + 1);
      }
    }

    expect(sawGemItem).toBe(true);
    // All four gem types should show up over enough trials.
    expect(seenTypes).toEqual(new Set(['ruby', 'sapphire', 'diamond', 'opal', 'emerald']));
  });

  it('gold and gemstone value scale up with dungeon level', () => {
    const rng1 = new RNG(555);
    const rng2 = new RNG(555);

    const shallowGold: number[] = [];
    const deepGold: number[] = [];

    for (let i = 0; i < 500; i++) {
      const shallow = makeChar();
      shallow.dungeonLevel = 1;
      const r1 = resolveChest(shallow, rng1);
      if (r1.goldGained) shallowGold.push(r1.goldGained);

      const deep = makeChar();
      deep.dungeonLevel = 7;
      const r2 = resolveChest(deep, rng2);
      if (r2.goldGained) deepGold.push(r2.goldGained);
    }

    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
    expect(avg(deepGold)).toBeGreaterThan(avg(shallowGold) * 2);
  });
});

describe('Level generation tuning', () => {
  it('places more fountains per level than the old 1-2 range', () => {
    expect(CONTENT_PER_LEVEL.FOUNTAINS_MIN).toBeGreaterThanOrEqual(2);
    expect(CONTENT_PER_LEVEL.FOUNTAINS_MAX).toBeGreaterThan(2);
  });

});

describe('Death mechanics', () => {
  it('returns character to entrance', () => {
    const char = makeChar();
    char.x = 30;
    char.y = 40;
    char.hp = 0;
    char.gold = 100;

    const result = applyDeath(char, 5, 5);
    expect(char.x).toBe(5);
    expect(char.y).toBe(5);
  });

  it('restores HP to maximum', () => {
    const char = makeChar();
    char.hp = 0;
    char.gold = 100;

    applyDeath(char, 0, 0);
    expect(char.hp).toBe(char.maxHp);
  });

  it('removes exactly 15% of gold (rounded down)', () => {
    const char = makeChar();
    char.hp = 0;
    char.gold = 100;

    const result = applyDeath(char, 0, 0);
    const expected = Math.floor(100 * DEATH.GOLD_LOSS_FRACTION);
    expect(result.goldLost).toBe(expected);
    expect(char.gold).toBe(100 - expected);
  });

  it('increments death count', () => {
    const char = makeChar();
    char.hp = 0;
    char.gold = 0;
    const before = char.deathCount;

    applyDeath(char, 0, 0);
    expect(char.deathCount).toBe(before + 1);
  });

  it('clears all status effects on death', () => {
    const char = makeChar();
    char.hp = 0;
    char.statusEffects = [{ type: 'poison', value: 5, turns: 3 }];

    applyDeath(char, 0, 0);
    expect(char.statusEffects).toHaveLength(0);
  });

  it('costs a share of experience, but never a level', () => {
    const char = makeChar();
    char.level = 1;
    char.xp = 5000;
    char.gold = 0;
    const result = applyDeath(char, 0, 0);
    expect(result.xpLost).toBe(Math.floor(5000 * DEATH.XP_LOSS_FRACTION));
    expect(char.xp).toBe(5000 - result.xpLost);

    char.level = 5;
    char.xp = xpForLevel(5) + 3;
    expect(applyDeath(char, 0, 0).xpLost).toBeLessThanOrEqual(3);
    expect(char.xp).toBeGreaterThanOrEqual(xpForLevel(5));
  });

  it('includes death text in result', () => {
    const char = makeChar();
    char.hp = 0;
    char.gold = 0;

    const result = applyDeath(char, 0, 0);
    expect(result.messages.some(m => m.includes('DIED') || m.includes('died'))).toBe(true);
  });
});

describe('Magic books', () => {
  it('every effect shows up over enough reads by an afflicted character', () => {
    const rng = new RNG(2024);
    const effects = new Set<string>();
    for (let i = 0; i < 500; i++) {
      const char = makeChar();
      char.statusEffects = [{ type: 'poison', value: 3, turns: 5 }];
      effects.add(readBook(char, rng).effect);
    }
    expect(effects).toEqual(new Set(['attribute', 'healing', 'invulnerability', 'map-reveal', 'experience', 'cleanse']));
  });

  it('never wastes a tome on cleansing a healthy character, and boosts attributes most often', () => {
    const rng = new RNG(77);
    const counts: Record<string, number> = {};
    for (let i = 0; i < 2000; i++) {
      const char = makeChar();
      char.statusEffects = [{ type: 'resistance-improved', value: 2, turns: 5 }];
      const e = readBook(char, rng).effect;
      counts[e] = (counts[e] ?? 0) + 1;
    }
    expect(counts.cleanse).toBeUndefined();
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    expect(top).toBe('attribute');
    expect(counts.attribute / 2000).toBeGreaterThan(0.35);
  });

  it('attribute effect raises exactly one stat by 1', () => {
    const rng = new RNG(1);
    let found = false;
    for (let i = 0; i < 100; i++) {
      const char = makeChar();
      const before = { ...char };
      const result = readBook(char, rng);
      if (result.effect === 'attribute') {
        found = true;
        expect(result.statChanged).toBeDefined();
        const stat = result.statChanged!.stat as keyof typeof char;
        expect(char[stat]).toBe((before[stat] as number) + 1);
      }
    }
    expect(found).toBe(true);
  });

  it('healing restores HP but never past max', () => {
    const rng = new RNG(3);
    let found = false;
    for (let i = 0; i < 200; i++) {
      const char = makeChar();
      char.hp = Math.floor(char.maxHp * 0.3);
      const result = readBook(char, rng);
      if (result.effect === 'healing') {
        found = true;
        expect(char.hp).toBeGreaterThan(Math.floor(char.maxHp * 0.3));
        expect(char.hp).toBeLessThanOrEqual(char.maxHp);
      }
    }
    expect(found).toBe(true);
  });

  it('invulnerability sets invulnerableTurns to the configured duration', () => {
    const rng = new RNG(5);
    let found = false;
    for (let i = 0; i < 100; i++) {
      const char = makeChar();
      const result = readBook(char, rng);
      if (result.effect === 'invulnerability') {
        found = true;
        expect(char.invulnerableTurns).toBe(MAGIC_BOOK.INVULNERABLE_ROUNDS);
      }
    }
    expect(found).toBe(true);
  });

  it('map-reveal sets the flag but does not touch dungeon state directly (caller handles the reveal)', () => {
    const rng = new RNG(7);
    let found = false;
    for (let i = 0; i < 100; i++) {
      const char = makeChar();
      const result = readBook(char, rng);
      if (result.effect === 'map-reveal') {
        found = true;
        expect(result.mapRevealed).toBe(true);
      }
    }
    expect(found).toBe(true);
  });

  it('experience effect grants XP scaled by character level', () => {
    const rng = new RNG(11);
    let found = false;
    for (let i = 0; i < 100; i++) {
      const char = makeChar();
      char.level = 10;
      const before = char.xp;
      const result = readBook(char, rng);
      if (result.effect === 'experience') {
        found = true;
        expect(char.xp).toBeGreaterThan(before);
        expect(result.xpGained).toBeGreaterThan(0);
      }
    }
    expect(found).toBe(true);
  });

  it('cleanse removes negative status effects but keeps resistance-improved', () => {
    const rng = new RNG(13);
    let found = false;
    for (let i = 0; i < 200; i++) {
      const char = makeChar();
      char.statusEffects = [
        { type: 'poison', value: 3, turns: 5 },
        { type: 'paralyzed', value: 0, turns: 2 },
        { type: 'resistance-improved', value: 2, turns: 5 },
      ];
      const result = readBook(char, rng);
      if (result.effect === 'cleanse') {
        found = true;
        expect(char.statusEffects.some(e => e.type === 'poison')).toBe(false);
        expect(char.statusEffects.some(e => e.type === 'paralyzed')).toBe(false);
        expect(char.statusEffects.some(e => e.type === 'resistance-improved')).toBe(true);
        expect(result.statusesCleansed).toBe(2);
      }
    }
    expect(found).toBe(true);
  });
});

describe('Chest traps', () => {
  it('a chest is trapped (or not) the same way every time, and roughly as often as configured', () => {
    const char = makeChar();
    let trapped = 0;
    for (let i = 0; i < 4000; i++) {
      const trap = chestTrapFor(char, `chest-3-${i}`);
      expect(chestTrapFor(char, `chest-3-${i}`)).toBe(trap);
      if (trap) trapped++;
    }
    expect(trapped / 4000).toBeGreaterThan(CHEST_TRAPS.CHANCE - 0.03);
    expect(trapped / 4000).toBeLessThan(CHEST_TRAPS.CHANCE + 0.03);
  });

  it('different characters get different traps on the same chest', () => {
    const a = makeChar(); a.id = 'char-a';
    const b = makeChar(); b.id = 'char-b';
    let differ = 0;
    for (let i = 0; i < 200; i++) if (chestTrapFor(a, `chest-1-${i}`) !== chestTrapFor(b, `chest-1-${i}`)) differ++;
    expect(differ).toBeGreaterThan(0);
  });

  it('higher Dexterity disarms more reliably; Wisdom spots traps more often', () => {
    const clumsy = makeChar(); clumsy.dexterity = 8;
    const nimble = makeChar(); nimble.dexterity = 18;
    expect(chestTrapDisarmChance(nimble)).toBeGreaterThan(chestTrapDisarmChance(clumsy));
    nimble.dexterity = 40;
    expect(chestTrapDisarmChance(nimble)).toBe(CHEST_TRAPS.MAX_CHANCE);

    const dull = makeChar(); dull.wisdom = 6;
    const wise = makeChar(); wise.wisdom = 18;
    expect(chestTrapDetectChance(wise)).toBeGreaterThan(chestTrapDetectChance(dull));
  });

  it('chest traps hurt more deeper down but never kill outright', () => {
    const rng1 = new RNG(5); const rng2 = new RNG(5);
    const shallow = makeChar(); shallow.dungeonLevel = 1; shallow.hp = shallow.maxHp = 10000;
    const deep = makeChar(); deep.dungeonLevel = 7; deep.hp = deep.maxHp = 10000;
    springChestTrap(shallow, 'fire-glyph', rng1);
    springChestTrap(deep, 'fire-glyph', rng2);
    expect(10000 - deep.hp).toBeGreaterThan(10000 - shallow.hp);

    const frail = makeChar(); frail.hp = 2; frail.dungeonLevel = 7;
    springChestTrap(frail, 'blade', new RNG(9));
    expect(frail.hp).toBe(1);
  });

  it('the alarm trap summons a monster instead of hurting', () => {
    const char = makeChar();
    const hp = char.hp;
    const res = springChestTrap(char, 'alarm', new RNG(1));
    expect(res.triggerMonster).toBe(true);
    expect(char.hp).toBe(hp);
  });

  it('a failed corridor-trap disarm springs the trap once, not twice', () => {
    for (let seed = 1; seed < 200; seed++) {
      const char = makeChar();
      char.intelligence = 3; char.dexterity = 3;
      char.hp = char.maxHp = 1000;
      const res = resolveTrapDisarm(char, 'falling-stone', new RNG(seed));
      if (res.messages[0] === 'You fail to disarm it!') {
        const dmg = Number(res.messages.join(' ').match(/You take (\d+) damage/)![1]);
        expect(1000 - char.hp).toBe(dmg);
        return;
      }
    }
    throw new Error('never failed a disarm');
  });
});

describe('Altar blessing at full health', () => {
  it('wards instead of healing when there is nothing to heal', () => {
    let warded = 0;
    const rng = new RNG(77);
    for (let i = 0; i < 400; i++) {
      const char = makeChar();
      char.hp = char.maxHp;
      const res = resolveAltar(char, rng);
      expect(res.messages.join(' ')).not.toContain('The altar heals you');
      if ((char.invulnerableTurns ?? 0) > 0) {
        warded++;
        expect(res.messages.join(' ')).toContain('holy ward');
      }
    }
    expect(warded).toBeGreaterThan(0);
  });

  it('still heals a wounded character', () => {
    const rng = new RNG(77);
    let healed = false;
    for (let i = 0; i < 400 && !healed; i++) {
      const char = makeChar();
      char.hp = 1;
      if (resolveAltar(char, rng).messages.join(' ').includes('The altar heals you')) healed = true;
    }
    expect(healed).toBe(true);
  });
});

describe('Monster level rolls for the deep dragons', () => {
  const roll = (type: string | undefined, depth: number, charLevel: number, n = 3000) => {
    const rng = new RNG(99);
    const levels: number[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (let i = 0; i < n; i++) levels.push(randomMonsterLevel(charLevel, depth, rng, type as any));
    return levels;
  };

  it('dragons break the level-60 cap only on dungeon levels 6 and 7: 75 on 6, then 95-120 on 7', () => {
    const top7: Record<string, number> = { 'Black Dragon': 120, 'Blue Dragon': 120, 'Green Dragon': 95, 'Red Dragon': 95, 'White Dragon': 100 };
    for (const [type, top] of Object.entries(top7)) {
      expect(Math.max(...roll(type, 5, 60))).toBeLessThanOrEqual(MONSTER_SCALING.HARD_LEVEL_CAP);
      expect(Math.max(...roll(type, 6, 60))).toBe(75);
      const deepest = roll(type, 7, 60);
      expect(Math.max(...deepest)).toBeLessThanOrEqual(top);
      expect(Math.max(...deepest)).toBeGreaterThan(top - 6);
    }
  });

  it('ordinary monsters stay under the cap even on level 7', () => {
    expect(Math.max(...roll('Wizard', 7, 60))).toBeLessThanOrEqual(MONSTER_SCALING.HARD_LEVEL_CAP);
    expect(Math.max(...roll(undefined, 7, 60))).toBeLessThanOrEqual(MONSTER_SCALING.HARD_LEVEL_CAP);
  });

  it('rolls spread across the range rather than landing on round numbers', () => {
    const deep = roll('White Dragon', 7, 60);
    expect(new Set(deep).size).toBeGreaterThan(30);
  });
});

describe('Traps get harder to disarm deeper down', () => {
  it('corridor and chest traps both lose a few percent per level, never below the floor', () => {
    const shallow = makeChar(); shallow.dungeonLevel = 1;
    const deep = makeChar(); deep.dungeonLevel = 7;
    expect(trapDisarmChance(deep)).toBeCloseTo(trapDisarmChance(shallow) - 6 * TRAPS.DISARM_DEPTH_PENALTY);
    expect(chestTrapDisarmChance(deep)).toBeLessThan(chestTrapDisarmChance(shallow));
    const clumsy = makeChar(); clumsy.dungeonLevel = 7; clumsy.intelligence = 1; clumsy.dexterity = 1;
    expect(trapDisarmChance(clumsy)).toBe(TRAPS.DISARM_MIN);
  });
});

describe('The first level looks after new adventurers', () => {
  const potionRate = (dungeonLevel: number) => {
    const rng = new RNG(31);
    let hits = 0;
    for (let i = 0; i < 4000; i++) {
      const c = makeChar(); c.dungeonLevel = dungeonLevel;
      const before = c.inventory.potions;
      resolveChest(c, rng);
      if (c.inventory.potions > before) hits++;
    }
    return hits / 4000;
  };

  it('chests on level 1 give potions far more often', () => {
    expect(potionRate(1)).toBeGreaterThan(0.35);
    expect(potionRate(2)).toBeLessThan(0.25);
  });

  it('altars on level 1 mostly heal', () => {
    const healRate = (dungeonLevel: number) => {
      const rng = new RNG(8);
      let heals = 0;
      for (let i = 0; i < 4000; i++) {
        const c = makeChar(); c.dungeonLevel = dungeonLevel; c.wisdom = 3; c.hp = 1;
        if (resolveAltar(c, rng).messages.join(' ').includes('The altar heals you')) heals++;
      }
      return heals / 4000;
    };
    expect(healRate(1)).toBeGreaterThan(0.5);
    expect(healRate(3)).toBeLessThan(0.35);
  });

  it('a new character\u2019s Fireball hits like a level-9 one, and never weakens on levelling up', () => {
    const avg = (level: number) => {
      const rng = new RNG(4);
      let total = 0;
      for (let i = 0; i < 2000; i++) {
        const c = makeChar(); c.level = level; c.intelligence = 12;
        const m = createMonster('Orc', 5, 'o'); m.hp = m.maxHp = 100000;
        total += playerFireball(c, m, rng).playerDamage;
      }
      return total / 2000;
    };
    const byLevel = [1, 2, 4, 9, 10, 20].map(avg);
    for (let i = 1; i < byLevel.length; i++) expect(byLevel[i]).toBeGreaterThanOrEqual(byLevel[i - 1] - 0.5);
    expect(byLevel[0]).toBeGreaterThan(20);
  });
});

describe('Opals and emeralds: never more than 3', () => {
  it('opals are semi-common in chests (about 1 in 13)', () => {
    const rng = new RNG(99);
    let opals = 0; const n = 20000;
    for (let i = 0; i < n; i++) {
      const char = makeChar(); char.dungeonLevel = 4;
      resolveChest(char, rng);
      if (char.inventory.gems.opal > 0) opals++;
    }
    expect(opals / n).toBeGreaterThan(0.06);
    expect(opals / n).toBeLessThan(0.10);
  });

  it('once the character has 3, chests never hold another', () => {
    const rng = new RNG(7);
    for (let i = 0; i < 5000; i++) {
      const char = makeChar(); char.dungeonLevel = 7;
      char.inventory.gems.opal = 3; char.inventory.gems.emerald = 3;
      resolveChest(char, rng);
      expect(char.inventory.gems.opal).toBe(3);
      expect(char.inventory.gems.emerald).toBe(3);
    }
  });

  it('chests keep giving them up to the cap', () => {
    const rng = new RNG(8);
    const char = makeChar(); char.dungeonLevel = 7;
    for (let i = 0; i < 3000; i++) resolveChest(char, rng);
    expect(char.inventory.gems.opal).toBe(GEMS.CARRY_CAP.opal);
    expect(char.inventory.gems.emerald).toBe(GEMS.CARRY_CAP.emerald);
  });
});

describe('Beholders are kept out of the hosted game', () => {
  it('hosted (NODE_ENV=production), random encounters never pick a Beholder or Death Tyrant; locally they can', async () => {
    const { pickRandomMonsterType, isHiddenMonster } = await import('../src/core/monsters.js');
    const roll = () => {
      const rng = new RNG(4242); const seen = new Set<string>();
      for (let i = 0; i < 6000; i++) seen.add(pickRandomMonsterType(6 + (i % 2), rng));
      return seen;
    };
    const was = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = 'production';
      const hosted = roll();
      expect(hosted.has('Beholder')).toBe(false);
      expect(hosted.has('Death Tyrant')).toBe(false);
      expect(isHiddenMonster('Beholder')).toBe(true);
      process.env.NODE_ENV = 'development';
      const local = roll();
      expect(local.has('Beholder')).toBe(true);
      expect(isHiddenMonster('Beholder')).toBe(false);
    } finally { process.env.NODE_ENV = was; }
  });
});
