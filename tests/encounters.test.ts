import { describe, it, expect } from 'vitest';
import { RNG } from '../src/core/random.js';
import { rollCharacter, createCharacter } from '../src/core/character.js';
import {
  initialPace, incrementPace, shouldTriggerRandomEncounter, resetPaceAfterCombat,
  resolveFountain, applyDeath,
} from '../src/core/encounters.js';
import { ENCOUNTER, FOUNTAIN, DEATH } from '../src/core/config.js';

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

  it('keeps experience on death', () => {
    const char = makeChar();
    char.hp = 0;
    char.xp = 5000;
    char.gold = 0;

    applyDeath(char, 0, 0);
    expect(char.xp).toBe(5000);
  });

  it('includes death text in result', () => {
    const char = makeChar();
    char.hp = 0;
    char.gold = 0;

    const result = applyDeath(char, 0, 0);
    expect(result.messages.some(m => m.includes('DIED') || m.includes('died'))).toBe(true);
  });
});
