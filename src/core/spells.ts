// Wizard spells and the character level each one is learned at. The combat
// spell menu only ever lists what the character knows, lettered in unlock
// order, so the engine and every client derive keys from here.

import { SPELLS as SPELL_CONFIG } from './config.js';
import type { Choice } from './types.js';

export type SpellId = 'fireball' | 'heal' | 'poison' | 'acid' | 'frost' | 'lightning' | 'banish';

export interface SpellInfo {
  id: SpellId;
  name: string;
  level: number;
}

const NAMES: Record<SpellId, string> = {
  fireball: 'Fireball',
  heal: 'Heal',
  poison: 'Poison Spray',
  acid: 'Acid Spray',
  frost: 'Frost Bolt',
  lightning: 'Lightning',
  banish: 'Banish',
};

export const ALL_SPELLS: SpellInfo[] = (Object.keys(SPELL_CONFIG.UNLOCK_LEVEL) as SpellId[])
  .map(id => ({ id, name: NAMES[id], level: SPELL_CONFIG.UNLOCK_LEVEL[id] }))
  .sort((a, b) => a.level - b.level);

export function knownSpells(charLevel: number): SpellInfo[] {
  return ALL_SPELLS.filter(s => charLevel >= s.level);
}

/** Known spells lettered a, b, c... in unlock order, then Cancel. */
export function spellMenu(charLevel: number): Choice[] {
  const known = knownSpells(charLevel);
  const letter = (i: number) => String.fromCharCode(97 + i);
  return [
    ...known.map((s, i) => ({ key: letter(i), text: s.name })),
    { key: letter(known.length), text: 'Cancel' },
  ];
}

/** The spell a menu key selects for a character of this level, or null (cancel / unknown). */
export function spellForKey(charLevel: number, key: string): SpellId | null {
  const i = key.length === 1 ? key.charCodeAt(0) - 97 : -1;
  return knownSpells(charLevel)[i]?.id ?? null;
}

/** Spells gained by going from one level to a higher one (a multi-level jump can teach several). */
export function spellsLearnedBetween(fromLevel: number, toLevel: number): SpellInfo[] {
  return ALL_SPELLS.filter(s => s.level > fromLevel && s.level <= toLevel);
}
