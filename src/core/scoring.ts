import type { Character, ScoreResult } from './types.js';
import { SCORING } from './config.js';

export function calculateScore(char: Character, playTimeSeconds: number): ScoreResult {
  const base =
    char.xp            * SCORING.XP_MULT
    + char.gold          * SCORING.GOLD_MULT
    + char.monstersDefeated     * SCORING.MONSTER_MULT
    + char.uniqueMonstersDefeated * SCORING.UNIQUE_MULT
    + (char.asmodeusDefeated ? SCORING.ASMODEUS_BONUS : 0)
    - char.deathCount   * SCORING.DEATH_PENALTY;

  return {
    characterLevel: char.level,
    xp: char.xp,
    gold: char.gold,
    monstersDefeated: char.monstersDefeated,
    uniqueMonstersDefeated: char.uniqueMonstersDefeated,
    asmodeusDefeated: char.asmodeusDefeated,
    deathCount: char.deathCount,
    stepsTaken: char.stepsTaken,
    playTimeSeconds,
    finalScore: Math.max(0, base),
  };
}

export function formatScore(score: ScoreResult): string[] {
  const mins = Math.floor(score.playTimeSeconds / 60);
  const secs = score.playTimeSeconds % 60;
  const time = `${mins}m ${secs}s`;

  return [
    'FINAL RESULTS',
    '',
    `Character Level:          ${score.characterLevel}`,
    `Experience:               ${score.xp}`,
    `Gold Remaining:           ${score.gold}`,
    `Monsters Defeated:        ${score.monstersDefeated}`,
    `Unique Monsters Defeated: ${score.uniqueMonstersDefeated}`,
    `Deaths:                   ${score.deathCount}`,
    `Steps Taken:              ${score.stepsTaken}`,
    `Time Played:              ${time}`,
    `Final Score:              ${score.finalScore}`,
    '',
    score.asmodeusDefeated ? 'ASMODEUS DEFEATED' : '',
  ].filter(line => line !== undefined) as string[];
}
