import { describe, it, expect } from 'vitest';
import { RNG } from '../src/core/random.js';
import {
  rollCharacter, createCharacter, checkLevelUp, xpForLevel, calculateLevel, formatRoll,
} from '../src/core/character.js';

describe('Character creation', () => {
  it('rolls 3d6 for each stat (total 3-18)', () => {
    const rng = new RNG(1);
    const roll = rollCharacter(rng);

    for (const key of ['strength','constitution','intelligence','wisdom','dexterity','charisma','resistance'] as const) {
      const r = roll[key];
      expect(r.d1).toBeGreaterThanOrEqual(1);
      expect(r.d1).toBeLessThanOrEqual(6);
      expect(r.d2).toBeGreaterThanOrEqual(1);
      expect(r.d2).toBeLessThanOrEqual(6);
      expect(r.d3).toBeGreaterThanOrEqual(1);
      expect(r.d3).toBeLessThanOrEqual(6);
      expect(r.total).toBe(r.d1 + r.d2 + r.d3);
      expect(r.total).toBeGreaterThanOrEqual(3);
      expect(r.total).toBeLessThanOrEqual(18);
    }
  });

  it('hpBonus is 1-8', () => {
    const rng = new RNG(2);
    const roll = rollCharacter(rng);
    expect(roll.hpBonus).toBeGreaterThanOrEqual(1);
    expect(roll.hpBonus).toBeLessThanOrEqual(8);
  });

  it('creates character with correct starting HP (10 + CON + 1d8)', () => {
    const rng = new RNG(3);
    const roll = rollCharacter(rng);
    const char = createCharacter('test-1', 'Hero', roll);

    const expectedMaxHp = 10 + roll.constitution.total + roll.hpBonus;
    expect(char.maxHp).toBe(expectedMaxHp);
    expect(char.hp).toBe(char.maxHp);
  });

  it('rerollsRemaining starts at 20', () => {
    const rng = new RNG(4);
    const roll = rollCharacter(rng);
    const char = createCharacter('test-2', 'Hero', roll);
    expect(char.rerollsRemaining).toBe(20);
  });

  it('formatRoll returns string array with stat lines', () => {
    const rng = new RNG(5);
    const roll = rollCharacter(rng);
    const lines = formatRoll(roll);
    expect(lines.some(l => l.includes('Strength'))).toBe(true);
    expect(lines.some(l => l.includes('Constitution'))).toBe(true);
    expect(lines.some(l => l.includes('Resistance'))).toBe(true);
  });
});

describe('Character leveling', () => {
  it('xpForLevel returns increasing values', () => {
    for (let i = 2; i <= 10; i++) {
      expect(xpForLevel(i)).toBeGreaterThan(xpForLevel(i - 1));
    }
  });

  it('calculateLevel correctly maps XP to level', () => {
    expect(calculateLevel(0)).toBe(1);
    expect(calculateLevel(50)).toBe(1);
    expect(calculateLevel(100)).toBe(2);
    expect(calculateLevel(299)).toBe(2);
    expect(calculateLevel(300)).toBe(3);
  });

  it('checkLevelUp returns didLevel=true when XP crosses threshold', () => {
    const rng = new RNG(6);
    const roll = rollCharacter(rng);
    const char = createCharacter('test-3', 'Hero', roll);
    char.level = 1;
    char.xp = 100; // enough for level 2

    const result = checkLevelUp(char, rng);
    expect(result.didLevel).toBe(true);
    expect(result.newLevel).toBe(2);
    expect(char.level).toBe(2);
    expect(char.maxHp).toBeGreaterThan(10 + roll.constitution.total + roll.hpBonus);
  });

  it('checkLevelUp returns didLevel=false when XP is not enough', () => {
    const rng = new RNG(7);
    const roll = rollCharacter(rng);
    const char = createCharacter('test-4', 'Hero', roll);
    char.level = 1;
    char.xp = 50;

    const result = checkLevelUp(char, rng);
    expect(result.didLevel).toBe(false);
    expect(char.level).toBe(1);
  });
});
