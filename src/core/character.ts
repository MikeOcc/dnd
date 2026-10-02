import { RNG } from './random.js';
import { LEVELING, CHARACTER, WARRIOR, GAMEPLAY, GHOUL } from './config.js';
import type { Character, CharacterRoll, DiceRoll, StatusEffect, StatusEffectType } from './types.js';

function roll3d6(rng: RNG): DiceRoll {
  const r = rng.roll(3, 6);
  return { d1: r.dice[0], d2: r.dice[1], d3: r.dice[2], total: r.total };
}

export function rollCharacter(rng: RNG): CharacterRoll {
  return {
    strength:     roll3d6(rng),
    constitution: roll3d6(rng),
    intelligence: roll3d6(rng),
    wisdom:       roll3d6(rng),
    dexterity:    roll3d6(rng),
    charisma:     roll3d6(rng),
    resistance:   roll3d6(rng),
    hpBonus:      rng.die(8),
  };
}

export function createCharacter(id: string, name: string, roll: CharacterRoll): Character {
  const constitution = roll.constitution.total;
  const maxHp = 10 + constitution + roll.hpBonus;

  return {
    id,
    name,
    charClass: 'wizard',
    level: 1,
    xp: 0,
    dungeonLevel: 1,
    x: 0,
    y: 0,
    facing: 'N',
    hp: maxHp,
    maxHp,
    gold: 0,
    strength:     roll.strength.total,
    constitution: roll.constitution.total,
    intelligence: roll.intelligence.total,
    wisdom:       roll.wisdom.total,
    dexterity:    roll.dexterity.total,
    charisma:     roll.charisma.total,
    resistance:   roll.resistance.total,
    deathCount: 0,
    stepsTaken: 0,
    monstersDefeated: 0,
    uniqueMonstersDefeated: 0,
    asmodeusDefeated: false,
    statusEffects: [],
    introsSeen: [],
    rerollsRemaining: CHARACTER.MAX_REROLLS,
    inventory: { potions: 0, books: 0, gems: { ruby: 0, sapphire: 0, diamond: 0, opal: 0, emerald: 0 } },
    elementalWarnings: [],
    createdAt: Date.now(),
    playTime: 0,
    lastSaved: Date.now(),
  };
}

export function xpForLevel(level: number): number {
  if (level <= 0) return 0;
  if (level >= LEVELING.XP_TABLE.length) {
    return LEVELING.XP_TABLE[LEVELING.XP_TABLE.length - 1];
  }
  return LEVELING.XP_TABLE[level];
}

export function checkLevelUp(char: Character, rng: RNG): { didLevel: boolean; newLevel: number; previousLevel: number; hpGain: number; statGained?: string } {
  const newLevel = calculateLevel(char.xp);
  const previousLevel = char.level;
  if (newLevel <= char.level) {
    return { didLevel: false, newLevel: char.level, previousLevel, hpGain: 0 };
  }

  const levels = newLevel - char.level;
  const hpGain = LEVELING.HP_PER_LEVEL_BASE + rng.die(LEVELING.HP_PER_LEVEL_RAND)
    + (char.charClass === 'warrior' ? WARRIOR.HP_BONUS_PER_LEVEL * levels : 0);
  char.level = newLevel;
  char.maxHp += hpGain;
  char.hp = Math.min(char.hp + hpGain, char.maxHp);

  let statGained: string | undefined;
  if (rng.float() < LEVELING.STAT_GAIN_CHANCE) {
    const stats: (keyof Character)[] = ['strength', 'constitution', 'intelligence', 'wisdom', 'dexterity', 'charisma', 'resistance'];
    const stat = rng.pick(stats);
    (char[stat] as number) += 1;
    statGained = stat as string;
  }

  return { didLevel: true, newLevel, previousLevel, hpGain, statGained };
}

export function calculateLevel(xp: number): number {
  let level = 1;
  for (let i = 2; i < LEVELING.XP_TABLE.length; i++) {
    if (xp >= LEVELING.XP_TABLE[i]) level = i;
    else break;
  }
  return Math.min(level, LEVELING.MAX_LEVEL);
}

/** Fights left on the character's emerald ward (0 = none). */
export function wardFights(char: Character): number {
  return char.statusEffects.find(e => e.type === 'warded')?.value ?? 0;
}

/** Called as a fight ends: the ward has one fewer fight left. */
export function wearDownWard(char: Character): void {
  const ward = char.statusEffects.find(e => e.type === 'warded');
  if (!ward) return;
  ward.value--;
  if (ward.value <= 0) removeStatusEffect(char, 'warded');
}

/** HP a healing potion restores (before capping at max HP): a base roll, a
 * Constitution bonus, and a share of max HP so potions keep pace with level. */
export function potionHealAmount(char: Character, rng: RNG): number {
  const amount = rng.int(GAMEPLAY.POTION_HEAL_MIN, GAMEPLAY.POTION_HEAL_MAX)
    + Math.floor(char.constitution / GAMEPLAY.POTION_HEAL_CON_DIVISOR)
    + Math.floor(char.maxHp * GAMEPLAY.POTION_HEAL_MAX_HP_PCT);
  return Math.max(1, Math.round(amount * healingFactor(char)));
}

/** How well healing takes: halved while a ghoul's flesh rot lasts. */
export function healingFactor(char: Character): number {
  return char.statusEffects.some(e => e.type === 'flesh-rot') ? GHOUL.ROT_HEAL_FACTOR : 1;
}

/** Drains one character level (minimum level 1). Returns the HP lost, or 0 if already at level 1. */
export function applyLevelDrain(char: Character): { newLevel: number; hpLost: number } {
  if (char.level <= 1) {
    return { newLevel: char.level, hpLost: 0 };
  }

  const newLevel = char.level - 1;
  const hpLost = Math.min(char.maxHp - 1, LEVELING.HP_PER_LEVEL_BASE + Math.ceil(LEVELING.HP_PER_LEVEL_RAND / 2));

  char.level = newLevel;
  char.maxHp = Math.max(1, char.maxHp - hpLost);
  char.hp = Math.min(char.hp, char.maxHp);
  char.xp = Math.min(char.xp, xpForLevel(newLevel));

  return { newLevel, hpLost };
}

export function addStatusEffect(char: Character, effect: StatusEffect): void {
  // Remove existing same type
  char.statusEffects = char.statusEffects.filter(e => e.type !== effect.type);
  char.statusEffects.push(effect);
}

export function removeStatusEffect(char: Character, type: StatusEffectType): void {
  char.statusEffects = char.statusEffects.filter(e => e.type !== type);
}

export function getEffectiveStats(char: Character): Character {
  const c = { ...char };
  for (const eff of char.statusEffects) {
    if (eff.type === 'intelligence-reduced') c.intelligence = Math.max(1, c.intelligence - eff.value);
    if (eff.type === 'dexterity-reduced')    c.dexterity    = Math.max(1, c.dexterity    - eff.value);
    if (eff.type === 'strength-reduced')     c.strength     = Math.max(1, c.strength     - eff.value);
    if (eff.type === 'resistance-improved')  c.resistance   = c.resistance + eff.value;
  }
  return c;
}

export function tickStatusEffects(char: Character): { messages: string[]; damageTaken: number } {
  const messages: string[] = [];
  let damageTaken = 0;

  const remaining: StatusEffect[] = [];
  for (const eff of char.statusEffects) {
    // An emerald ward counts down by fights, not steps.
    if (eff.type === 'warded' || eff.type === 'anaphylaxis') { remaining.push(eff); continue; }
    if (eff.type === 'poison') {
      char.hp = Math.max(1, char.hp - eff.value);
      damageTaken += eff.value;
      messages.push(`Poison burns through you! You suffer ${eff.value} damage.`);
    }
    if (eff.type === 'mummified') {
      char.hp = Math.max(1, char.hp - eff.value);
      damageTaken += eff.value;
      messages.push(`Mummification withers you for ${eff.value} damage.`);
    }
    if (eff.type === 'bleeding') {
      char.hp = Math.max(1, char.hp - eff.value);
      damageTaken += eff.value;
      messages.push(`You are bleeding! You suffer ${eff.value} damage.`);
    }
    if (eff.type === 'flesh-rot') {
      char.hp = Math.max(1, char.hp - eff.value);
      damageTaken += eff.value;
      messages.push(`Your rotting flesh blackens and sloughs away. You suffer ${eff.value} damage.`);
    }
    const newTurns = eff.turns - 1;
    if (newTurns > 0) remaining.push({ ...eff, turns: newTurns });
    else {
      if (eff.type === 'naked')     messages.push('You quickly re-dress yourself.');
      if (eff.type === 'feared')    messages.push('Your fear subsides.');
      if (eff.type === 'paralyzed') messages.push('You can move again.');
      if (eff.type === 'mummified') messages.push('The mummification crumbles away.');
      if (eff.type === 'bleeding')  messages.push('The bleeding finally stops.');
      if (eff.type === 'flesh-rot') messages.push('The rot burns itself out at last. Your flesh begins to heal.');
      if (eff.type === 'intelligence-reduced') messages.push('Your mind clears.');
      if (eff.type === 'dexterity-reduced')    messages.push('Your coordination returns.');
      if (eff.type === 'strength-reduced')     messages.push('Your strength returns.');
    }
  }
  char.statusEffects = remaining;
  return { messages, damageTaken };
}

export function hasEffect(char: Character, type: StatusEffectType): boolean {
  return char.statusEffects.some(e => e.type === type);
}

export function formatRoll(roll: CharacterRoll): string[] {
  const fmt = (label: string, d: { d1: number; d2: number; d3: number; total: number }) =>
    `${label.padEnd(16)} ${d.d1} + ${d.d2} + ${d.d3} = ${d.total}`;

  return [
    'ROLLING CHARACTER...',
    '',
    fmt('Strength:',     roll.strength),
    fmt('Constitution:', roll.constitution),
    fmt('Intelligence:', roll.intelligence),
    fmt('Wisdom:',       roll.wisdom),
    fmt('Dexterity:',    roll.dexterity),
    fmt('Charisma:',     roll.charisma),
    fmt('Resistance:',   roll.resistance),
    '',
    `HP: 10 + ${roll.constitution.total} + ${roll.hpBonus} (1d8) = ${10 + roll.constitution.total + roll.hpBonus}`,
  ];
}
