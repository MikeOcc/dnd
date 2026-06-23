import { describe, it, expect } from 'vitest';
import { RNG } from '../src/core/random.js';
import { rollCharacter, createCharacter } from '../src/core/character.js';
import { calculateScore, formatScore } from '../src/core/scoring.js';
import { SCORING } from '../src/core/config.js';

function makeChar() {
  const rng = new RNG(42);
  const roll = rollCharacter(rng);
  return createCharacter('score-test', 'Scorer', roll);
}

describe('Score calculation', () => {
  it('includes XP in score', () => {
    const char = makeChar();
    char.xp = 10000;
    char.gold = 0;

    const score = calculateScore(char, 0);
    expect(score.xp).toBe(10000);
    expect(score.finalScore).toBeGreaterThanOrEqual(10000 * SCORING.XP_MULT);
  });

  it('includes gold in score', () => {
    const char = makeChar();
    char.gold = 500;

    const score1 = calculateScore(char, 0);

    char.gold = 1000;
    const score2 = calculateScore(char, 0);

    expect(score2.finalScore).toBeGreaterThan(score1.finalScore);
  });

  it('adds large Asmodeus bonus when defeated', () => {
    const char = makeChar();
    char.xp = 0; char.gold = 0; char.monstersDefeated = 0;
    char.uniqueMonstersDefeated = 0; char.deathCount = 0;

    const scoreNoAsmodeus = calculateScore({ ...char, asmodeusDefeated: false }, 0);
    const scoreWithAsmodeus = calculateScore({ ...char, asmodeusDefeated: true }, 0);

    expect(scoreWithAsmodeus.finalScore - scoreNoAsmodeus.finalScore).toBe(SCORING.ASMODEUS_BONUS);
  });

  it('penalizes deaths', () => {
    const char = makeChar();
    // Give enough XP/gold so a base score exists above the death-penalty floor
    const richChar = { ...char, xp: 5000, gold: 500, monstersDefeated: 10 };
    const scoreFewDeaths  = calculateScore({ ...richChar, deathCount: 0  }, 0);
    const scoreManyDeaths = calculateScore({ ...richChar, deathCount: 20 }, 0);

    expect(scoreFewDeaths.finalScore).toBeGreaterThan(scoreManyDeaths.finalScore);
  });

  it('unique monsters add to score', () => {
    const char = makeChar();
    const base = calculateScore({ ...char, uniqueMonstersDefeated: 0 }, 0);
    const withUnique = calculateScore({ ...char, uniqueMonstersDefeated: 3 }, 0);

    expect(withUnique.finalScore).toBeGreaterThan(base.finalScore);
  });

  it('score is never negative (floors at 0)', () => {
    const char = makeChar();
    char.xp = 0; char.gold = 0; char.monstersDefeated = 0;
    char.uniqueMonstersDefeated = 0; char.asmodeusDefeated = false;
    char.deathCount = 1000; // massive death penalty

    const score = calculateScore(char, 0);
    expect(score.finalScore).toBeGreaterThanOrEqual(0);
  });
});

describe('Score formatting', () => {
  it('produces the required result fields', () => {
    const char = makeChar();
    char.asmodeusDefeated = true;
    const score = calculateScore(char, 3661);
    const lines = formatScore(score);

    expect(lines.some(l => l.includes('Character Level'))).toBe(true);
    expect(lines.some(l => l.includes('Experience'))).toBe(true);
    expect(lines.some(l => l.includes('Gold'))).toBe(true);
    expect(lines.some(l => l.includes('Monsters Defeated'))).toBe(true);
    expect(lines.some(l => l.includes('Deaths'))).toBe(true);
    expect(lines.some(l => l.includes('Steps'))).toBe(true);
    expect(lines.some(l => l.includes('Score'))).toBe(true);
    expect(lines.some(l => l.includes('ASMODEUS DEFEATED'))).toBe(true);
  });

  it('formats play time as minutes and seconds', () => {
    const char = makeChar();
    const score = calculateScore(char, 3661); // 61 min 1 sec
    const lines = formatScore(score);
    expect(lines.some(l => l.includes('m') && l.includes('s'))).toBe(true);
  });
});
