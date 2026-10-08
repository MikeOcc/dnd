// The admin's summary of how new characters' first stretch goes: deaths
// before level 2, the first win, potions, running, the safety net, and how
// many stopped coming back. Built from each character's FirstSteps record.

import type { FirstSteps } from './types.js';

export interface FirstStepsRow { charClass: string; createdAt: number; fs: FirstSteps }

export interface FirstStepsSummary {
  characters: number;
  wizards: number;
  warriors: number;
  wonAFight: number;            // share (0..1) of characters
  diedBeforeLevel2: number;     // share of characters who died at least once at level 1
  reachedLevel2: number;
  reachedLevel3: number;
  heardAsmodeus: number;
  stoppedEarly: number;         // idle a day or more without reaching level 3
  medianMinutesToFirstWin: number | null;
  medianMinutesToLevel2: number | null;
  perCharacter: { fights: number; deaths: number; potions: number; runs: number; escapes: number; spared: number };
}

/** A character this idle, still below level 3, counts as having stopped early. */
export const STOPPED_AFTER_MS = 24 * 60 * 60 * 1000;

function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function summarizeFirstSteps(rows: FirstStepsRow[], now = Date.now()): FirstStepsSummary {
  const n = rows.length;
  const share = (pred: (r: FirstStepsRow) => boolean) => (n ? rows.filter(pred).length / n : 0);
  const avg = (f: (fs: FirstSteps) => number) => (n ? rows.reduce((t, r) => t + f(r.fs), 0) / n : 0);
  const minutes = (xs: (number | undefined)[]) => {
    const m = median(xs.filter((x): x is number => x !== undefined));
    return m === null ? null : Math.round((m / 60) * 10) / 10;
  };
  return {
    characters: n,
    wizards: rows.filter(r => r.charClass === 'wizard').length,
    warriors: rows.filter(r => r.charClass === 'warrior').length,
    wonAFight: share(r => r.fs.wins > 0),
    diedBeforeLevel2: share(r => r.fs.deathsBeforeLevel2 > 0),
    reachedLevel2: share(r => r.fs.levelReached >= 2),
    reachedLevel3: share(r => r.fs.levelReached >= 3),
    heardAsmodeus: share(r => !!r.fs.voiceHeard),
    stoppedEarly: share(r => r.fs.levelReached < 3 && now - r.fs.lastAt >= STOPPED_AFTER_MS),
    medianMinutesToFirstWin: minutes(rows.map(r => r.fs.firstWinAt)),
    medianMinutesToLevel2: minutes(rows.map(r => r.fs.level2At)),
    perCharacter: {
      fights: avg(fs => fs.fights), deaths: avg(fs => fs.deaths), potions: avg(fs => fs.potions),
      runs: avg(fs => fs.runs), escapes: avg(fs => fs.escapes), spared: avg(fs => fs.spared),
    },
  };
}
