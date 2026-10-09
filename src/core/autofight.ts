// Auto-fight: the game picks the character's action each round, and learns
// as it goes. For each class and kind of monster it keeps (shared by every
// player) how much harm each action has done; it picks what has worked best,
// tries what it hasn't tried enough, and now and then tries something else.
// Until it knows, it guesses from the monster's resistances.
//
// It never uses anything rare (gems, rings, Timelock, Banish) and never runs;
// it drinks potions (or heals) when hurt, and hands the fight back to the
// player on a great foe, or badly hurt with nothing left to heal.

import type { Character, Monster } from './types.js';
import type { RNG } from './random.js';
import type { SpellId } from './spells.js';
import { knownSpells } from './spells.js';
import { AUTO } from './config.js';

export interface LoreEntry { uses: number; damage: number }
/** action -> what it has done against this kind of monster, for this class */
export type Lore = Record<string, LoreEntry>;

export type AutoChoice =
  | { kind: 'stop'; why: string }
  | { kind: 'potion' }
  | { kind: 'struggle' }
  | { kind: 'attack' }
  | { kind: 'spell'; spell: SpellId; name: string };

/** Spells and skills auto-fight may use (offence only; nothing with a cooldown of an hour). */
const OFFENCE: SpellId[] = ['fireball', 'poison', 'acid', 'frost', 'lightning', 'power-attack', 'shield-bash', 'cleave', 'whirlwind'];

/** A first guess at how well an action does, before anything is learned (relative). */
export function prior(char: Character, monster: Monster, action: string): number {
  const d = monster.definition;
  const wizard = char.charClass === 'wizard';
  switch (action) {
    case 'attack': return wizard ? 0.45 : 1;
    case 'fireball': return 1.6 * (d.fireballResistance ?? 1);
    case 'acid': return 1.7 * (d.acidResistance ?? 1);
    case 'lightning': return 1.8 * (d.lightningResistance ?? (d.isUndead ? 2 : 1));
    case 'frost': return 1.7 * (d.coldResistance ?? 1);
    case 'poison': return 1.4 * (d.poisonResistance ?? (d.isUndead ? 0.2 : 1));
    case 'power-attack': return 1.9;
    case 'cleave': return d.naturalTier >= 6 ? 1.9 : 1.2;
    case 'shield-bash': return 0.8;
    case 'whirlwind': return 1.6;
    default: return 0.5;
  }
}

/** What to do this round. `powerReady`: a warrior's Power Attack is off cooldown. */
export function chooseAuto(char: Character, monster: Monster, lore: Lore, rng: RNG, opts: { held: boolean; powerReady: boolean }): AutoChoice {
  if (monster.definition.isUnique) return { kind: 'stop', why: 'A great foe: this fight is yours to play.' };
  if (opts.held) return { kind: 'struggle' };
  const hp = char.hp / char.maxHp;
  const known = knownSpells(char.level, char.charClass);
  if (hp <= AUTO.HEAL_AT) {
    const heal = known.find(s => s.id === 'heal');
    if (heal && char.charClass === 'wizard') return { kind: 'spell', spell: 'heal', name: heal.name };
    if (char.inventory.potions > 0) return { kind: 'potion' };
    if (hp <= AUTO.STOP_AT) return { kind: 'stop', why: 'Badly hurt, with nothing left to heal: over to you.' };
  }
  const options: { action: string; choice: AutoChoice }[] = [{ action: 'attack', choice: { kind: 'attack' } }];
  for (const s of known) {
    if (!OFFENCE.includes(s.id)) continue;
    if (s.id === 'power-attack' && !opts.powerReady) continue;
    options.push({ action: s.id, choice: { kind: 'spell', spell: s.id, name: s.name } });
  }
  // Now and then, something else, to keep learning.
  if (options.length > 1 && rng.float() < AUTO.EXPLORE) return options[rng.int(0, options.length - 1)].choice;
  // What hasn't been tried enough is tried (the likeliest first); then the best on record.
  const untried = options.filter(o => (lore[o.action]?.uses ?? 0) < AUTO.MIN_TRIES);
  if (untried.length) return untried.sort((a, b) => prior(char, monster, b.action) - prior(char, monster, a.action))[0].choice;
  const avg = (o: { action: string }) => lore[o.action].damage / lore[o.action].uses;
  return options.sort((a, b) => avg(b) - avg(a))[0].choice;
}

/** The name an action is kept under in the lore. */
export const loreAction = (c: AutoChoice): string | null => (c.kind === 'attack' ? 'attack' : c.kind === 'spell' && c.spell !== 'heal' ? c.spell : null);
