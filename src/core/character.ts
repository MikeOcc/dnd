import { RNG } from './random.js';
import { LEVELING, CHARACTER, WARRIOR, GAMEPLAY, GHOUL, AMULETS, GEAR } from './config.js';
import type { Amulet, Weapon, Armor, Character, CharacterRoll, DiceRoll, StatusEffect, StatusEffectType } from './types.js';

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
    inventory: { potions: 0, books: 0, gems: { ruby: 0, sapphire: 0, diamond: 0, opal: 0, emerald: 0, moonstone: 0 } },
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
  char.hp = char.maxHp;   // a new level heals you fully: the reward

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
  return char.statusEffects.some(e => e.type === 'flesh-rot' || e.type === 'fiend-venom') ? GHOUL.ROT_HEAL_FACTOR : 1;
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
  const amulet = wornAmulet(char);
  if (amulet) c[amulet.stat] = Math.max(1, c[amulet.stat] + amuletDelta(amulet));
  const { body } = wornArmor(char);                      // heavy armour slows you
  if (body && GEAR.ARMOR[body.kind].dex) c.dexterity = Math.max(1, c.dexterity - GEAR.ARMOR[body.kind].dex);
  return c;
}

/** Whether this character can use a weapon or armour of this kind. */
export function canUseGear(char: Character, kind: string): boolean {
  if (char.charClass === 'warrior') return true;
  return !!(GEAR.WEAPONS[kind]?.wizard || GEAR.ARMOR[kind]?.wizard);
}

/** How hard a weapon hits for this character (relative to none). */
export function weaponPower(char: Character, w: Weapon): number {
  const k = GEAR.WEAPONS[w.kind];
  const dmg = char.charClass === 'warrior' && k.warriorDamage ? k.warriorDamage : k.damage;
  return dmg * (1 + w.bonus * GEAR.DAMAGE_PER_PLUS) + (k.hit + w.bonus * GEAR.HIT_PER_PLUS) * 0.015;
}

/** The weapon you fight with: the one you chose, or else the best you can use. */
export function bestWeapon(char: Character): Weapon | undefined {
  const usable = (char.inventory?.weapons ?? []).filter(w => canUseGear(char, w.kind));
  return usable.find(w => w.equipped)
    ?? usable.reduce<Weapon | undefined>((b, w) => (!b || weaponPower(char, w) > weaponPower(char, b) ? w : b), undefined);
}

const armorCut = (a: Armor) => GEAR.ARMOR[a.kind].cut + a.bonus * (a.kind === 'shield' ? GEAR.SHIELD_PER_PLUS : GEAR.ARMOR_PER_PLUS);

/** Share of a blow a piece of armour turns aside on its own. */
export const armorShare = (a: Armor) => armorCut(a);

/** The armour and shield you wear: the best of each you can use. */
export function wornArmor(char: Character): { body?: Armor; shield?: Armor } {
  const usable = (char.inventory?.armor ?? []).filter(a => canUseGear(char, a.kind));
  // The piece you chose for each place, or else the best.
  const best = (list: Armor[]) => list.find(a => a.equipped) ?? list.reduce<Armor | undefined>((b, a) => (!b || armorCut(a) > armorCut(b) ? a : b), undefined);
  return { body: best(usable.filter(a => a.kind !== 'shield')), shield: best(usable.filter(a => a.kind === 'shield')) };
}

/** Share of a monster's blow your armour turns aside (before magic halves it). */
export function armorProtection(char: Character): number {
  const { body, shield } = wornArmor(char);
  return Math.min(GEAR.MAX_CUT, (body ? armorCut(body) : 0) + (shield ? armorCut(shield) : 0));
}

/** "Moonsilver longsword +2" (plain gear has no plus). */
export const gearName = (g: Weapon | Armor) => `${g.name}${g.bonus > 0 ? ` +${g.bonus}` : ''}`;

/** The amulet worn, if any. */
export function wornAmulet(char: Character): Amulet | undefined {
  return char.inventory?.amulets?.find(a => a.worn);
}

/** What an amulet does to its attribute: up, or down if cursed. */
export function amuletDelta(a: Amulet): number {
  return a.cursed ? -a.bonus : a.bonus;
}

/** "jade amulet of Wisdom", with "(+2)" or "(-2, cursed)" once it's known. */
export function amuletName(a: Amulet, withBonus = true): string {
  const stat = a.stat[0].toUpperCase() + a.stat.slice(1);
  const base = `${a.look} amulet of ${stat}`;
  if (!withBonus) return base;
  return base + (a.known ? ` (${a.cursed ? `-${a.bonus}, cursed` : `+${a.bonus}`})` : ' (unknown)');
}

/** A fountain, an altar or an emerald breaks a worn amulet's curse: it
 * crumbles away. Returns the lines saying so, or [] if nothing was cursed. */
export function breakAmuletCurse(char: Character, how: string): string[] {
  const cursed = (char.inventory?.amulets ?? []).filter(x => x.cursed);
  if (cursed.length === 0) return [];
  const a = cursed.find(x => x.worn);
  const others = cursed.filter(x => x !== a);
  char.inventory.amulets = char.inventory.amulets!.filter(x => !x.cursed);
  const lines = a
    ? [`${how} The cursed ${amuletName(a, false)} cracks, smokes, and falls from your neck,`,
       `crumbling to black dust. The curse is broken. (${a.stat[0].toUpperCase() + a.stat.slice(1)} restored)`]
    : [];
  if (others.length) {
    lines.push(`${a ? '' : `${how} `}In your pack, ${others.length === 1 ? 'an amulet' : `${others.length} amulets`} smoke${others.length === 1 ? 's' : ''} and crumble${others.length === 1 ? 's' : ''} to dust: ${others.length === 1 ? 'it was' : 'they were'} cursed.`);
  }
  return lines;
}

/** Each turn a cursed amulet is worn, it may snap of its own accord and
 * fall away. Returns the lines saying so, or []. */
export function wearCursedAmulet(char: Character, rng: RNG): string[] {
  const a = wornAmulet(char);
  if (!a?.cursed || rng.float() >= AMULETS.CURSED_BREAK_CHANCE) return [];
  char.inventory.amulets = char.inventory.amulets!.filter(x => x !== a);
  return [`The cursed ${amuletName(a, false)} snaps! It slithers from your neck and crumbles to dust. Free at last.`];
}

export function tickStatusEffects(char: Character): { messages: string[]; damageTaken: number; fatal?: string } {
  const messages: string[] = [];
  let damageTaken = 0;
  let fatal: string | undefined;

  const remaining: StatusEffect[] = [];
  for (const eff of char.statusEffects) {
    // An emerald ward counts down by fights, not steps.
    if (eff.type === 'warded' || eff.type === 'anaphylaxis' || eff.type === 'lycanthropy') { remaining.push(eff); continue; }
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
      const r = advanceFleshRot(char, eff);
      messages.push(...r.messages);
      damageTaken += r.damage;
      if (r.fatal) fatal = r.fatal;
      // Once it has gone too far, it doesn't burn out: the countdown runs.
      if (eff.doom !== undefined) { remaining.push(eff); continue; }
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
      if (eff.type === 'corroded')  messages.push('You have finally scoured the rust from your weapon.');
      if (eff.type === 'fiend-venom') messages.push('The infernal venom has worked its way out of you.');
      if (eff.type === 'intelligence-reduced') messages.push('Your mind clears.');
      if (eff.type === 'dexterity-reduced')    messages.push('Your coordination returns.');
      if (eff.type === 'strength-reduced')     messages.push('Your strength returns.');
    }
  }
  char.statusEffects = remaining;
  return { messages, damageTaken, fatal };
}

// ─── Flesh rot ───────────────────────────────────────────────────────────────

function rotLimit(part: string | undefined): number {
  return part === 'head' ? GHOUL.ROT_FATAL_HEAD : GHOUL.ROT_FATAL_LIMB;
}

/** One turn of flesh rot (a step, a second of rest, or a combat round): it
 * eats a little HP and spreads a stage further through its body part. Too
 * far, and the countdown starts: a warning next turn, death the turn after.
 * Changes `eff` in place; returns what happened, and a death cause if it's
 * over. */
export function advanceFleshRot(char: Character, eff: StatusEffect): { messages: string[]; damage: number; fatal?: string } {
  const part = eff.part ?? 'left arm';
  if (eff.doom !== undefined) {
    eff.doom--;
    if (eff.doom <= 0) {
      return { messages: [], damage: 0, fatal: part === 'head'
        ? 'The flesh rot ate through your skull and into your brain.'
        : `The flesh rot spread from your ${part} into your heart.` };
    }
    return { messages: [part === 'head'
      ? 'Your thoughts are coming apart. You have moments left.'
      : `Black veins race from your ${part} toward your heart. You have moments left.`], damage: 0 };
  }
  char.hp = Math.max(1, char.hp - eff.value);
  eff.stage = (eff.stage ?? 0) + 1;
  const limit = rotLimit(part);
  if (eff.stage >= limit) {
    eff.doom = GHOUL.ROT_DOOM_TURNS;
    return { messages: [part === 'head'
      ? 'The rot has eaten through to the bone of your skull. It is in your blood now. Nothing can stop it.'
      : `The rot has eaten your ${part} to the bone. It is in your blood now. Nothing can stop it.`], damage: eff.value };
  }
  const frac = eff.stage / limit;
  const where = `your ${part}`;
  const msg = frac < 0.25 ? `The flesh of ${where} is grey and stinking. (-${eff.value} HP)`
    : frac < 0.5 ? `The rot spreads through ${where}, black and weeping. (-${eff.value} HP)`
    : frac < 0.75 ? `Flesh sloughs from ${where}. You can see bone. (-${eff.value} HP)`
    : `The rot in ${where} is spreading fast. It will kill you soon. (-${eff.value} HP)`;
  return { messages: [msg], damage: eff.value };
}

/** Healing beats flesh rot back a few stages, until it has gone too far. */
export function slowFleshRot(char: Character, stages: number): string | null {
  const rot = char.statusEffects.find(e => e.type === 'flesh-rot');
  if (!rot || rot.doom !== undefined || !rot.stage) return null;
  rot.stage = Math.max(0, rot.stage - stages);
  return `The healing beats back the rot in your ${rot.part ?? 'flesh'}.`;
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
