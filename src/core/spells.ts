// Spells and combat skills, and the character level each is learned at, per
// class. The combat menu (B) only ever lists what the character knows,
// lettered in unlock order, so the engine and every client derive keys from
// here. Wizards cast spells; warriors use combat skills plus a weaker Heal
// and Fireball.

import { SPELLS as SPELL_CONFIG } from './config.js';
import type { Choice, CharacterClass } from './types.js';

export type SpellId =
  | 'fireball' | 'heal' | 'poison' | 'acid' | 'frost' | 'lightning' | 'banish'
  | 'power-attack' | 'shield-bash' | 'cleave' | 'battle-cry' | 'whirlwind';

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
  'power-attack': 'Power Attack',
  'shield-bash': 'Shield Bash',
  cleave: 'Cleave',
  'battle-cry': 'Battle Cry',
  whirlwind: 'Whirlwind',
};

/** Skills that are feats of arms rather than magic. */
const NOT_MAGIC: SpellId[] = ['power-attack', 'shield-bash', 'cleave', 'battle-cry', 'whirlwind'];

export function isMagic(id: SpellId): boolean {
  return !NOT_MAGIC.includes(id);
}

function listFor(unlock: Partial<Record<SpellId, number>>): SpellInfo[] {
  return (Object.entries(unlock) as [SpellId, number][])
    .map(([id, level]) => ({ id, name: NAMES[id], level }))
    .sort((a, b) => a.level - b.level);
}

const BY_CLASS: Record<CharacterClass, SpellInfo[]> = {
  wizard: listFor(SPELL_CONFIG.UNLOCK_LEVEL),
  warrior: listFor(SPELL_CONFIG.WARRIOR_UNLOCK_LEVEL),
};

export function allSpells(cls: CharacterClass = 'wizard'): SpellInfo[] {
  return BY_CLASS[cls];
}

export function knownSpells(charLevel: number, cls: CharacterClass = 'wizard'): SpellInfo[] {
  return BY_CLASS[cls].filter(s => charLevel >= s.level);
}

/** Known spells/skills lettered a, b, c... in unlock order, then Cancel. */
export function spellMenu(charLevel: number, cls: CharacterClass = 'wizard'): Choice[] {
  const known = knownSpells(charLevel, cls);
  const letter = (i: number) => String.fromCharCode(97 + i);
  return [
    ...known.map((s, i) => ({ key: letter(i), text: s.name })),
    { key: letter(known.length), text: 'Cancel' },
  ];
}

/** The spell/skill a menu key selects for this character, or null (cancel / unknown). */
export function spellForKey(charLevel: number, key: string, cls: CharacterClass = 'wizard'): SpellId | null {
  const i = key.length === 1 ? key.charCodeAt(0) - 97 : -1;
  return knownSpells(charLevel, cls)[i]?.id ?? null;
}

/** Spells/skills gained going from one level to a higher one (a multi-level jump can teach several). */
export function spellsLearnedBetween(fromLevel: number, toLevel: number, cls: CharacterClass = 'wizard'): SpellInfo[] {
  return BY_CLASS[cls].filter(s => s.level > fromLevel && s.level <= toLevel);
}
