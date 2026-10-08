import { RNG } from './random.js';
import { COMBAT, LEVELING, GEMS, SPELLS, WARRIOR, SCARE, ORC_KING, MANTICORE, TITANOBOA, WENDIGO, GHOUL, DJINN, PHOENIX, BANSHEE, UNICORN, FROST_GIANT, GOLD_DRAGON, RINGS, GEAR, CHOIR, BORAK, NEWCOMER } from './config.js';
import type { Character, Monster, MonsterType, StatusEffect, HeldCondition, FxElement, RingId, ChoirMask, ChoirPower } from './types.js';
import { RINGS_INFO } from '../content/rings.js';
import { BESTIARY, type Script, type Kit } from './bestiary.js';
import { getEffectiveStats, addStatusEffect, applyLevelDrain, potionHealAmount, wardFights, healingFactor, slowFleshRot, bestWeapon, armorProtection } from './character.js';
import { isUndead, monsterAttackText } from './monsters.js';

export interface CombatRoundResult {
  messages: string[];
  playerDamage: number;
  monsterDamage: number;
  monsterHealed?: number;
  playerDied: boolean;
  monsterDied: boolean;
  playerTeleported?: boolean;
  ran?: boolean;
  banished?: boolean;   // Banish worked: the monster is gone (no XP, like the sapphire)
  monsterElement?: FxElement;  // what the monster hit the character with this round, if it acted
  deathCause?: string;         // when the monster killed the character: names the attack that did it
  killingBlow?: string[];      // ...and the monster's lines from that final turn
  runFailed?: boolean;
  monsterFled?: boolean;       // the monster left the fight (a Djinn vanishing, a Unicorn departing): no XP
  ballOfDooFired?: boolean;
  spared?: boolean;            // a newcomer's safety net turned a killing blow (left at 1 HP)
}

// Elemental resistance/vulnerability call-outs ("particularly vulnerable to
// fire!", "shrugs off most of the acid!") only need to be said once per
// monster type per playthrough — after that they're just noise, unless the
// player is in real danger and the reminder is tactically useful again.
// Recorded on the character (not in-memory) so it survives a page refresh.
function shouldWarnElemental(char: Character, key: string): boolean {
  const alreadyWarned = char.elementalWarnings.includes(key);
  if (!alreadyWarned) char.elementalWarnings.push(key);
  const lowHp = char.hp < char.maxHp * 0.25;
  return !alreadyWarned || lowHp;
}

// ─── Attack ──────────────────────────────────────────────────────────────────

/** Swings a warrior gets each round: one more every 10 levels, up to 5. Wizards swing once. */
export function attacksPerRound(char: Character): number {
  if (char.charClass !== 'warrior') return 1;
  return Math.min(WARRIOR.MAX_ATTACKS, 1 + Math.floor(char.level / WARRIOR.ATTACKS_EVERY_N_LEVELS));
}

/** One weapon swing: rolls to hit, then damage (warriors lean harder on
 * Strength, and hit harder while Battle Cry lasts). Returns damage dealt. */
function swing(char: Character, monster: Monster, rng: RNG, messages: string[], opts: { mult?: number; hitPenalty?: number; label?: string } = {}): number {
  const eff = getEffectiveStats(char);
  const naked = char.statusEffects.some(e => e.type === 'naked');
  const warrior = char.charClass === 'warrior';

  // A Pit Fiend's dread spoils your aim. Your weapon (and its magic) steadies it.
  const dread = monster.type === 'Pit Fiend' ? 4 : 0;
  const weapon = bestWeapon(char);
  const kind = weapon ? GEAR.WEAPONS[weapon.kind] : undefined;
  const plus = weapon?.bonus ?? 0;
  const hitRoll = rng.die(20) + char.level + plus * GEAR.HIT_PER_PLUS + (kind?.hit ?? 0)
    + Math.floor(eff.strength  / COMBAT.HIT_STR_DIVISOR)
    + Math.floor(eff.dexterity / COMBAT.HIT_DEX_DIVISOR)
    + (warrior ? WARRIOR.HIT_BONUS : 0)
    - (opts.hitPenalty ?? 0) - dread
    - (char.statusEffects.find(e => e.type === 'snuffed')?.value ?? 0)   // Lantern Moths: fighting half-blind
    - ((monster.darkTurns ?? 0) > 0 ? COMBAT.BARROW_DARK_HIT_PENALTY : 0);   // the Barrow-King's barrow-dark
  // A monster above the character's level defends only as well as one of
  // their own level, so no foe is out of reach of a blade.
  const defLevel = Math.min(monster.level, char.level);
  const monsterDef = Math.round((COMBAT.MONSTER_BASE_DEFENSE + defLevel + Math.floor(defLevel / 4)) * ((monster.witherTurns ?? 0) > 0 ? RINGS.WITHER_DEFENSE : 1));
  const label = opts.label ? ` (${opts.label})` : '';

  // A stunned Asmodeus can't defend himself: nearly every blow lands.
  const stunnedLord = monster.type === 'Asmodeus' && (monster.stunnedTurns ?? 0) > 0;
  // Frozen in time, it can't even flinch: every blow lands.
  const misses = (monster.frozenTurns ?? 0) > 0 ? false : stunnedLord ? rng.float() >= COMBAT.ASMODEUS_STUNNED_HIT_CHANCE : hitRoll < monsterDef;
  if (misses) {
    messages.push(`You swing at the ${monster.type} but miss!${label}`);
    return 0;
  }
  if (monster.burrowed) {
    messages.push(`Your blow strikes only broken stone: the ${monster.type} is under the floor.${label}`);
    return 0;
  }
  if (monster.type === 'Marilith' && rng.float() < 0.3) {
    messages.push(`The Marilith catches your blow on two crossed blades and turns it aside!${label}`);
    return 0;
  }
  const strDiv = warrior ? WARRIOR.STR_DAMAGE_DIVISOR : COMBAT.DAMAGE_STR_DIVISOR;
  const baseDamage = (char.level * COMBAT.DAMAGE_LEVEL_WEIGHT) + Math.floor(eff.strength / strDiv);
  const rand = COMBAT.DAMAGE_RAND_MIN + rng.float() * (COMBAT.DAMAGE_RAND_MAX - COMBAT.DAMAGE_RAND_MIN);
  const cry = (char.battleCryRounds ?? 0) > 0 ? WARRIOR.BATTLE_CRY_MULT : 1;
  // The Orc King's black plate turns aside part of every blow; stone and
  // unholy flesh shrug off half of it; rust on your blade costs you too.
  // Stone, werewolf hide and a Caput Mortuum's dust shrug off ordinary steel, but not an enchanted blade.
  // A Bone Vortex: blades pass through the gaps between the bones; a mace smashes them.
  const plate = monster.type === 'Bone Vortex' && weapon?.kind !== 'mace' ? 0.6
    : monster.type === 'Orc King' ? 1 - ORC_KING.ARMOR
    : (monster.type === 'Gargoyle' || monster.type === 'Werewolf' || monster.type === 'Caput Mortuum') && plus === 0 ? 0.5 : 1;
  // A Rakshasa is truly harmed only by a +3 weapon.
  const rakshasa = monster.type === 'Rakshasa' ? GEAR.RAKSHASA_BY_PLUS[Math.min(3, plus)] : 1;
  const magic = 1 + plus * GEAR.DAMAGE_PER_PLUS;
  // The weapon itself: a sword or axe hits harder than none; a mace crushes undead, golems and stone.
  const crushable = monster.definition.isUndead || /Golem|Gargoyle|Skeleton/.test(monster.type);
  const heft = kind ? (warrior && kind.warriorDamage ? kind.warriorDamage : kind.damage) * (kind.crushes && crushable ? kind.crushes : 1) : 1;
  const rust = char.statusEffects.find(e => e.type === 'corroded');
  const rustMult = rust ? 1 - rust.value / 100 : 1;
  const damage = Math.max(1, Math.round(baseDamage * rand * (opts.mult ?? 1) * cry * plate * rustMult * magic * heft * rakshasa * (naked ? COMBAT.NAKED_ATTACK_MULT : 1)));
  monster.hp -= damage;
  const aside = rakshasa < 1
    ? (plus === 0 ? ' Ordinary steel barely marks its hide: only a +3 weapon can truly wound a Rakshasa.' : ` Your +${plus} blade bites, but not deeply: only a +3 can truly wound a Rakshasa.`)
    : monster.type === 'Rakshasa' && plus >= 3 ? ' Your +3 blade cuts deep. It howls.'
    : plate >= 1 ? '' : monster.type === 'Orc King' ? ' His plate turns part of it aside.' : ' Your weapon barely bites.';
  messages.push(`You strike the ${monster.type} for ${damage} damage.${label}${aside}`);
  // The Death Worm's skin burns whatever touches it, and eats at the blade.
  if (monster.type === 'Mongolian Death Worm' && char.hp > 1 && rng.float() < 0.35) {
    const burn = Math.min(char.hp - 1, Math.max(1, Math.round(monster.level * 0.5)));
    char.hp -= burn;
    messages.push(`  Its slick red skin burns your hands like acid! (${burn} damage)`);
    if (rng.float() < 0.3 && !char.statusEffects.some(e => e.type === 'corroded')) {
      char.statusEffects.push({ type: 'corroded', value: 10, turns: 30 });
      messages.push('  Your weapon smokes and pits. (-10% weapon damage until you can clean it)');
    }
  }
  // Striking a Balor means reaching into its flames.
  if (monster.type === 'Balor' && char.hp > 1) {
    const burn = Math.min(char.hp - 1, Math.max(1, Math.round(monster.level * 0.6)));
    char.hp -= burn;
    messages.push(`  The Balor's flames lick up your arm! (${burn} damage)`);
  }
  return damage;
}

/** Several swings in a row (stopping if the monster falls), then the monster's reply. */
function swingRound(char: Character, monster: Monster, rng: RNG, messages: string[], swings: number, opts: { mult?: number } = {}): CombatRoundResult {
  let dealt = 0;
  for (let i = 0; i < swings && monster.hp > 0; i++) {
    dealt += swing(char, monster, rng, messages, {
      mult: opts.mult,
      hitPenalty: i * WARRIOR.EXTRA_SWING_HIT_PENALTY,
      label: swings > 1 ? `swing ${i + 1}` : undefined,
    });
  }
  return finishWarriorRound(char, monster, rng, messages, dealt);
}

/** Ends a round of the character's attacks: Battle Cry ticks down, then the monster acts. */
function finishWarriorRound(char: Character, monster: Monster, rng: RNG, messages: string[], dealt: number): CombatRoundResult {
  if ((char.battleCryRounds ?? 0) > 0) char.battleCryRounds!--;
  const monsterDied = monster.hp <= 0;
  if (monsterDied) messages.push(`The ${monster.type} collapses!`);
  const res = monsterAction(char, monster, rng, messages);
  return { ...res, monsterDied, playerDamage: dealt };
}

/** A young warrior's weapon training: plain Attack hits harder at first, fading by EARLY_ATTACK_FADE_LEVEL. */
export function earlyAttackMult(char: Character): number {
  if (char.charClass !== 'warrior') return 1;
  const fade = Math.max(0, 1 - (char.level - 1) / (WARRIOR.EARLY_ATTACK_FADE_LEVEL - 1));
  return 1 + WARRIOR.EARLY_ATTACK_BONUS * fade;
}

export function playerAttack(char: Character, monster: Monster, rng: RNG): CombatRoundResult {
  return swingRound(char, monster, rng, [], attacksPerRound(char), { mult: earlyAttackMult(char) });
}

// ─── Potion ──────────────────────────────────────────────────────────────────

/** Drinking a healing potion mid-fight: heals like one drunk while exploring,
 * but it takes the character's turn, so the monster acts. */
export function playerPotion(char: Character, monster: Monster, rng: RNG): CombatRoundResult {
  char.inventory.potions--;
  const healed = Math.min(potionHealAmount(char, rng), char.maxHp - char.hp);
  char.hp += healed;
  const messages = [
    `You gulp down a healing potion and recover ${healed} HP.`,
    `(${char.inventory.potions} potion${char.inventory.potions === 1 ? '' : 's'} left)`,
  ];
  const beaten = slowFleshRot(char, GHOUL.ROT_PUSHBACK_POTION);
  if (beaten) messages.push(beaten);
  const res = monsterAction(char, monster, rng, messages);
  return { ...res, playerDamage: 0, monsterDied: false };
}

// ─── Warrior skills ──────────────────────────────────────────────────────────

/** One heavy swing: much more damage, harder to land. */
export function playerPowerAttack(char: Character, monster: Monster, rng: RNG): CombatRoundResult {
  const messages = ['You wind up a Power Attack!'];
  const dealt = swing(char, monster, rng, messages, { mult: WARRIOR.POWER_ATTACK_MULT, hitPenalty: WARRIOR.POWER_ATTACK_HIT_PENALTY });
  return finishWarriorRound(char, monster, rng, messages, dealt);
}

/** A lighter blow that can stun the monster out of its next turn. */
export function playerShieldBash(char: Character, monster: Monster, rng: RNG): CombatRoundResult {
  const messages = ['You slam your shield into the ' + monster.type + '!'];
  const dealt = swing(char, monster, rng, messages, { mult: WARRIOR.SHIELD_BASH_MULT });
  if (dealt > 0 && monster.hp > 0 && rng.float() < WARRIOR.SHIELD_BASH_STUN_CHANCE) {
    monster.stunnedTurns = 1;
    messages.push(`The ${monster.type} reels, stunned!`);
  }
  return finishWarriorRound(char, monster, rng, messages, dealt);
}

/** A great sweeping blow that bites deepest into big monsters. */
export function playerCleave(char: Character, monster: Monster, rng: RNG): CombatRoundResult {
  const big = monster.definition.naturalTier >= WARRIOR.CLEAVE_BIG_TIER;
  const messages = [big ? `You Cleave into the ${monster.type}'s huge bulk!` : 'You Cleave!'];
  const dealt = swing(char, monster, rng, messages, { mult: big ? WARRIOR.CLEAVE_BIG_MULT : WARRIOR.CLEAVE_MULT });
  return finishWarriorRound(char, monster, rng, messages, dealt);
}

/** A roar that boosts damage for the next few rounds (this round's swing included). */
export function playerBattleCry(char: Character, monster: Monster, rng: RNG): CombatRoundResult {
  char.battleCryRounds = WARRIOR.BATTLE_CRY_ROUNDS + 1;  // this round's tick-down included
  const messages = [`You let out a Battle Cry! Your blows strike ${Math.round((WARRIOR.BATTLE_CRY_MULT - 1) * 100)}% harder for ${WARRIOR.BATTLE_CRY_ROUNDS} rounds.`];
  const dealt = swing(char, monster, rng, messages);
  return finishWarriorRound(char, monster, rng, messages, dealt);
}

/** A whirling flurry: extra swings this round, each a little lighter. */
export function playerWhirlwind(char: Character, monster: Monster, rng: RNG): CombatRoundResult {
  const messages = ['You spin into a Whirlwind of steel!'];
  const r = swingRound(char, monster, rng, messages, attacksPerRound(char) + WARRIOR.WHIRLWIND_EXTRA_SWINGS, { mult: WARRIOR.WHIRLWIND_MULT });
  return r;
}

// ─── Backfire ───────────────────────────────────────────────────────────────

/** A spell or gem turned on its caster: they take the damage, the monster
 * none, and it still gets its turn. */
function backfire(char: Character, monster: Monster, rng: RNG, damage: number, lead: string[]): CombatRoundResult {
  const messages = [...lead];
  char.hp = Math.max(0, char.hp - damage);
  messages.push(`You suffer ${damage} damage from your own magic!`);
  if (char.hp <= 0) {
    return { messages, playerDamage: 0, monsterDamage: damage, playerDied: true, monsterDied: false, deathCause: 'Killed by your own magic, turned back on you.', killingBlow: lead };
  }
  const res = monsterAction(char, monster, rng, messages);
  return { ...res, playerDamage: 0, monsterDamage: res.monsterDamage + damage, monsterDied: false };
}

/** Chance an offensive spell backfires: nothing at BACKFIRE_INT_BELOW
 * Intelligence or more, rising with each point short. */
export function spellBackfireChance(char: Character): number {
  const short = SPELLS.BACKFIRE_INT_BELOW - getEffectiveStats(char).intelligence;
  return short <= 0 ? 0 : Math.min(SPELLS.BACKFIRE_MAX, short * SPELLS.BACKFIRE_PER_POINT);
}

const SPELL_NAMES: Record<string, string> = { fireball: 'Fireball', poison: 'Poison Spray', acid: 'Acid Spray', frost: 'Frost Bolt', lightning: 'Lightning' };

/** An offensive spell the caster lost control of: about what it would have
 * dealt the monster, dealt to them instead. */
export function playerSpellBackfire(char: Character, monster: Monster, rng: RNG, spell: string): CombatRoundResult {
  const eff = getEffectiveStats(char);
  const base = Math.max(char.level * COMBAT.FIREBALL_LEVEL_MULT, COMBAT.FIREBALL_MIN_LEVEL_POWER) + Math.floor(eff.intelligence / COMBAT.FIREBALL_INT_DIVISOR);
  const power = char.charClass === 'warrior' ? WARRIOR.SPELL_POWER : 1;
  const damage = Math.max(1, Math.round(base * (0.8 + rng.float() * 0.6) * power));
  const name = SPELL_NAMES[spell] ?? 'the spell';
  return backfire(char, monster, rng, damage, [
    `You cast ${name}, but the words tangle on your tongue...`,
    `The spell BACKFIRES! (Intelligence ${eff.intelligence}: too little to hold it)`,
  ]);
}

// ─── Fireball ────────────────────────────────────────────────────────────────

/** Fire (or holy light) sears these: no healing or rejoining for a few turns. */
function sear(monster: Monster, messages?: string[]): void {
  if (monster.type !== 'Penanggalan' && monster.type !== 'Lambton Worm') return;
  monster.searedTurns = 3;
  messages?.push(monster.type === 'Penanggalan' ? 'The trailing gut blackens and curls: it cannot draw on its body now.' : 'The flesh chars and blisters where it was cut. Those wounds will not rejoin.');
}

export function playerFireball(char: Character, monster: Monster, rng: RNG): CombatRoundResult {
  sear(monster);
  const eff = getEffectiveStats(char);

  const base = Math.max(char.level * COMBAT.FIREBALL_LEVEL_MULT, COMBAT.FIREBALL_MIN_LEVEL_POWER)
    + Math.floor(eff.intelligence / COMBAT.FIREBALL_INT_DIVISOR);
  const rand = COMBAT.FIREBALL_RAND_MIN + rng.float() * (COMBAT.FIREBALL_RAND_MAX - COMBAT.FIREBALL_RAND_MIN);
  const power = char.charClass === 'warrior' ? WARRIOR.SPELL_POWER : 1;
  let damage = Math.max(1, Math.round(base * rand * power * monster.definition.fireballResistance));

  const messages: string[] = [];

  if (monster.definition.fireballResistance <= 0.3) {
    if (shouldWarnElemental(char, `${monster.type}:fireball`)) {
      messages.push(`The ${monster.type} shrugs off most of the fire! (${Math.round((1 - monster.definition.fireballResistance) * 100)}% resistant)`);
    } else {
      messages.push('You cast Fireball!');
    }
  } else if (monster.definition.fireballResistance >= 1.8) {
    if (shouldWarnElemental(char, `${monster.type}:fireball`)) {
      messages.push(`Fireball! The ${monster.type} is particularly vulnerable to fire!`);
    } else {
      messages.push('You cast Fireball!');
    }
  } else {
    messages.push('You cast Fireball!');
  }

  monster.hp -= damage;
  messages.push(`The ${monster.type} takes ${damage} fire damage.`);
  if (monster.type === 'Wendigo' && monster.hp > 0) {
    monster.burnedTurns = WENDIGO.BURN_STOPS_REGEN_TURNS;
    messages.push('The Wendigo shrieks as the flames catch. Its wounds stop knitting.');
  }
  if ((monster.type === 'Troll' || monster.type === 'Hydra') && monster.hp > 0) {
    monster.burnedTurns = 2;
    messages.push(monster.type === 'Troll' ? 'The Troll screams as its flesh blackens. It will not heal that.' : 'The flames sear the Hydra\'s necks.');
  }

  const monsterDied = monster.hp <= 0;
  if (monsterDied) messages.push(`The ${monster.type} is incinerated!`);

  const res = monsterAction(char, monster, rng, messages);
  return {
    ...res,
    playerDamage: damage,
    monsterDied,
  };
}

// ─── Acid Spray ──────────────────────────────────────────────────────────────

export function playerAcid(char: Character, monster: Monster, rng: RNG): CombatRoundResult {
  const eff = getEffectiveStats(char);
  const acidResistance = monster.definition.acidResistance ?? 1.0;

  const base = char.level * COMBAT.ACID_LEVEL_MULT
    + Math.floor(eff.intelligence / COMBAT.ACID_INT_DIVISOR);
  const rand = COMBAT.ACID_RAND_MIN + rng.float() * (COMBAT.ACID_RAND_MAX - COMBAT.ACID_RAND_MIN);
  const damage = Math.max(1, Math.round(base * rand * acidResistance));

  const messages: string[] = [];

  if (acidResistance <= 0.3) {
    if (shouldWarnElemental(char, `${monster.type}:acid`)) {
      messages.push(`The ${monster.type} shrugs off most of the acid! (${Math.round((1 - acidResistance) * 100)}% resistant)`);
    } else {
      messages.push('You cast Acid Spray!');
    }
  } else if (acidResistance >= 1.8) {
    if (shouldWarnElemental(char, `${monster.type}:acid`)) {
      messages.push(`Acid Spray! The ${monster.type} is particularly vulnerable to acid!`);
    } else {
      messages.push('You cast Acid Spray!');
    }
  } else {
    messages.push('You cast Acid Spray!');
  }

  monster.hp -= damage;
  messages.push(`The ${monster.type} takes ${damage} acid damage.`);
  if (monster.type === 'Troll' && monster.hp > 0) {
    monster.burnedTurns = 2;
    messages.push('The acid eats into the Troll. It will not heal that.');
  }

  const monsterDied = monster.hp <= 0;
  if (monsterDied) messages.push(`The ${monster.type} dissolves!`);

  const res = monsterAction(char, monster, rng, messages);
  return {
    ...res,
    playerDamage: damage,
    monsterDied,
  };
}

// ─── Lightning ───────────────────────────────────────────────────────────────

export function playerLightning(char: Character, monster: Monster, rng: RNG): CombatRoundResult {
  const eff = getEffectiveStats(char);
  // Undead are vulnerable to lightning as a category; specific monsters
  // (Kobold, Slime Mold, Mold, Black Dragon, Red Dragon) are
  // tagged individually. Explicit tags always win over the undead default.
  const lightningResistance = monster.definition.lightningResistance
    ?? (isUndead(monster.type) ? 2.0 : 1.0);

  const base = char.level * COMBAT.LIGHTNING_LEVEL_MULT
    + Math.floor(eff.intelligence / COMBAT.LIGHTNING_INT_DIVISOR);
  const rand = COMBAT.LIGHTNING_RAND_MIN + rng.float() * (COMBAT.LIGHTNING_RAND_MAX - COMBAT.LIGHTNING_RAND_MIN);
  const damage = Math.max(1, Math.round(base * rand * lightningResistance));

  const messages: string[] = [];

  if (lightningResistance <= 0.3) {
    if (shouldWarnElemental(char, `${monster.type}:lightning`)) {
      messages.push(`The ${monster.type} shrugs off most of the lightning! (${Math.round((1 - lightningResistance) * 100)}% resistant)`);
    } else {
      messages.push('You cast Lightning!');
    }
  } else if (lightningResistance >= 1.8) {
    if (shouldWarnElemental(char, `${monster.type}:lightning`)) {
      messages.push(`Lightning! The ${monster.type} is particularly vulnerable to lightning!`);
    } else {
      messages.push('You cast Lightning!');
    }
  } else {
    messages.push('You cast Lightning!');
  }

  monster.hp -= damage;
  messages.push(`The ${monster.type} takes ${damage} lightning damage.`);
  if (monster.type === 'Iron Golem' && monster.hp > 0) {
    monster.stunnedTurns = Math.max(monster.stunnedTurns ?? 0, 1);
    messages.push('Lightning arcs through the iron. The Golem shudders and slows!');
  }

  const monsterDied = monster.hp <= 0;
  if (monsterDied) messages.push(`The ${monster.type} is charred by the bolt!`);

  const res = monsterAction(char, monster, rng, messages);
  return {
    ...res,
    playerDamage: damage,
    monsterDied,
  };
}

// ─── Frost Bolt ──────────────────────────────────────────────────────────────

export function playerFrost(char: Character, monster: Monster, rng: RNG): CombatRoundResult {
  const eff = getEffectiveStats(char);
  const coldResistance = monster.definition.coldResistance ?? 1.0;

  const base = char.level * COMBAT.FROST_LEVEL_MULT
    + Math.floor(eff.intelligence / COMBAT.FROST_INT_DIVISOR);
  const rand = COMBAT.FROST_RAND_MIN + rng.float() * (COMBAT.FROST_RAND_MAX - COMBAT.FROST_RAND_MIN);
  const damage = Math.max(1, Math.round(base * rand * coldResistance));

  const messages: string[] = [];

  if (coldResistance <= 0.3) {
    if (shouldWarnElemental(char, `${monster.type}:cold`)) {
      messages.push(`The ${monster.type} shrugs off most of the frost! (${Math.round((1 - coldResistance) * 100)}% resistant)`);
    } else {
      messages.push('You cast Frost Bolt!');
    }
  } else if (coldResistance >= 1.8) {
    if (shouldWarnElemental(char, `${monster.type}:cold`)) {
      messages.push(`Frost Bolt! The ${monster.type} is particularly vulnerable to cold!`);
    } else {
      messages.push('You cast Frost Bolt!');
    }
  } else {
    messages.push('You cast Frost Bolt!');
  }

  monster.hp -= damage;
  messages.push(`The ${monster.type} takes ${damage} cold damage.`);

  const monsterDied = monster.hp <= 0;
  if (monsterDied) messages.push(`The ${monster.type} freezes solid and shatters!`);

  const res = monsterAction(char, monster, rng, messages);
  return {
    ...res,
    playerDamage: damage,
    monsterDied,
  };
}

// ─── Opal (gem) ──────────────────────────────────────────────────────────────

export function playerOpal(char: Character, monster: Monster, rng: RNG): CombatRoundResult {
  const eff = getEffectiveStats(char);

  const base = char.level * GEMS.OPAL_LEVEL_MULT + Math.floor(eff.wisdom / GEMS.OPAL_WIS_DIVISOR);
  const rand = GEMS.OPAL_RAND_MIN + rng.float() * (GEMS.OPAL_RAND_MAX - GEMS.OPAL_RAND_MIN);
  const damage = Math.max(1, Math.round(base * rand));

  if (rng.float() < GEMS.OPAL_BACKFIRE_CHANCE) {
    return backfire(char, monster, rng, damage, [
      'The opal erupts in a blinding chiaroscuro of light and shadow...',
      'and it BACKFIRES! The blast turns inward, on you!',
    ]);
  }

  const messages: string[] = ['The opal erupts in a blinding chiaroscuro of light and shadow!'];
  monster.hp -= damage;
  messages.push(`The ${monster.type} takes ${damage} damage and reels in confusion.`);
  monster.confusedTurns = (monster.confusedTurns ?? 0) + GEMS.OPAL_CONFUSE_TURNS;

  const monsterDied = monster.hp <= 0;
  if (monsterDied) messages.push(`The ${monster.type} collapses!`);

  const res = monsterAction(char, monster, rng, messages);
  return {
    ...res,
    playerDamage: damage,
    monsterDied,
  };
}

/** A sapphire against Asmodeus: it can't banish him from his own Hells,
 * but the blast staggers him. Stunned for a few turns, then able only to
 * claw and lash for a couple more while his magic gathers itself again. */
export function playerSapphireOnAsmodeus(char: Character, monster: Monster, rng: RNG): CombatRoundResult {
  const messages = [
    'The sapphire pulses with cold blue light and the air around Asmodeus tears open...',
    'He laughs. "Banish me? From my own Hells?" The rift snaps shut on him like a jaw.',
  ];
  staggerAsmodeus(monster, COMBAT.ASMODEUS_SAPPHIRE_STUN_TURNS, COMBAT.ASMODEUS_SAPPHIRE_PHYSICAL_TURNS, messages);
  const res = monsterAction(char, monster, rng, messages);
  return { ...res, playerDamage: 0, monsterDied: false };
}

/** A failed banishment that still shakes him: stunned, then claws and tail only. */
function staggerAsmodeus(monster: Monster, stun: number, physical: number, messages: string[]): void {
  monster.stunnedTurns = Math.max(monster.stunnedTurns ?? 0, stun);
  monster.physicalOnlyTurns = Math.max(monster.physicalOnlyTurns ?? 0, physical);
  messages.push(`The banishment FAILS, but Asmodeus staggers on his throne, stunned! (${stun} turns, then no spells for ${physical} more)`);
}

// ─── Poison Spray ────────────────────────────────────────────────────────────

export function playerPoison(char: Character, monster: Monster, rng: RNG): CombatRoundResult {
  const eff = getEffectiveStats(char);
  const poisonResistance = monster.definition.poisonResistance ?? 1.0;

  const base = char.level * COMBAT.POISON_LEVEL_MULT
    + Math.floor(eff.intelligence / COMBAT.POISON_INT_DIVISOR);
  const rand = COMBAT.POISON_RAND_MIN + rng.float() * (COMBAT.POISON_RAND_MAX - COMBAT.POISON_RAND_MIN);
  const damage = Math.max(1, Math.round(base * rand * poisonResistance));

  const messages: string[] = [];

  if (poisonResistance <= 0.3) {
    if (shouldWarnElemental(char, `${monster.type}:poison`)) {
      messages.push(`The ${monster.type} shrugs off most of the poison! (${Math.round((1 - poisonResistance) * 100)}% resistant)`);
    } else {
      messages.push('You cast Poison Spray!');
    }
  } else if (poisonResistance >= 1.8) {
    if (shouldWarnElemental(char, `${monster.type}:poison`)) {
      messages.push(`Poison Spray! The ${monster.type} is particularly vulnerable to poison!`);
    } else {
      messages.push('You cast Poison Spray!');
    }
  } else {
    messages.push('You cast Poison Spray!');
  }

  monster.hp -= damage;
  messages.push(`The ${monster.type} takes ${damage} poison damage.`);

  const monsterDied = monster.hp <= 0;
  if (monsterDied) messages.push(`The ${monster.type} succumbs to the poison!`);

  const res = monsterAction(char, monster, rng, messages);
  return {
    ...res,
    playerDamage: damage,
    monsterDied,
  };
}

// ─── Heal ────────────────────────────────────────────────────────────────────

export function playerHeal(char: Character, monster: Monster, rng: RNG): CombatRoundResult {
  const eff = getEffectiveStats(char);
  const base = char.level * COMBAT.HEAL_LEVEL_WEIGHT + Math.floor(eff.wisdom / COMBAT.HEAL_WIS_DIVISOR);
  const rand = COMBAT.HEAL_RAND_MIN + rng.float() * (COMBAT.HEAL_RAND_MAX - COMBAT.HEAL_RAND_MIN);
  const power = char.charClass === 'warrior' ? WARRIOR.SPELL_POWER : 1;
  const healAmount = Math.max(1, Math.round(base * rand * power * healingFactor(char)));

  const messages: string[] = ['You cast Heal.'];
  if (healingFactor(char) < 1) messages.push('The rot in your flesh fights the magic.');
  const beaten = slowFleshRot(char, GHOUL.ROT_PUSHBACK_HEAL);
  if (beaten) messages.push(beaten);
  char.hp = Math.min(char.hp + healAmount, char.maxHp);
  messages.push(`You recover ${healAmount} hit points.`);

  const res = monsterAction(char, monster, rng, messages);
  return { ...res, playerDamage: 0, monsterDied: false };
}

// ─── Prayer ──────────────────────────────────────────────────────────────────

export function playerPray(char: Character, monster: Monster, rng: RNG): CombatRoundResult {
  const eff = getEffectiveStats(char);
  const undead = isUndead(monster.type);
  const isAsmodeus = monster.type === 'Asmodeus';
  // Light-vulnerable monsters (e.g. Sanguinid) take holy light like undead do,
  // even though they aren't undead themselves.
  const lightVulnerable = monster.definition.lightVulnerable === true;
  const divine = undead || isAsmodeus || lightVulnerable;
  // Powerful-but-not-undead foes (dragons, aberrations)
  // draw a fainter echo of prayer's power; ordinary creatures barely register.
  const powerful = !divine && monster.definition.naturalTier >= COMBAT.PRAYER_POWERFUL_NATURAL_TIER;

  const penalty = monster.prayerPenalty;
  monster.prayerPenalty = Math.min(1, monster.prayerPenalty + COMBAT.PRAYER_PENALTY_PER_USE);

  let baseChance = divine
    ? COMBAT.PRAYER_UNDEAD_BASE_CHANCE
    : powerful
      ? COMBAT.PRAYER_POWERFUL_BASE_CHANCE
      : COMBAT.PRAYER_NON_UNDEAD_BASE_CHANCE;
  if (isAsmodeus) baseChance *= COMBAT.PRAYER_ASMODEUS_MULT;

  // The more desperate the prayer, the more likely it's heard.
  const hpMissingFrac = 1 - char.hp / char.maxHp;
  baseChance += hpMissingFrac * COMBAT.PRAYER_LOW_HP_CHANCE_BONUS;

  // Heaven won't smite something far beneath you — except Wights, Spectres,
  // and Vampires, which are always susceptible to Prayer regardless of the
  // level gap (their own level range caps out well below a high-level
  // character's, so without this a leveled-up character could never reach
  // "worthy" against even the strongest one of these they'd ever meet).
  const alwaysWorthy = monster.type === 'Wight' || monster.type === 'Spectre' || monster.type === 'Vampire';
  const unworthy = !alwaysWorthy
    && monster.level < char.level * COMBAT.PRAYER_WEAK_MONSTER_LEVEL_RATIO;

  const chance = unworthy ? 0 : Math.max(0, baseChance - penalty);
  const messages: string[] = ['You pray.'];
  let monsterDied = false;
  let monsterDamage = 0;
  let playerSelfDamage = 0;

  if (unworthy) {
    if (rng.float() < COMBAT.PRAYER_BACKFIRE_CHANCE) {
      const base = (char.level + Math.floor(eff.wisdom / 2));
      playerSelfDamage = Math.max(1, Math.round(base * COMBAT.PRAYER_BACKFIRE_DAMAGE_MULT));
      char.hp = Math.max(0, char.hp - playerSelfDamage);
      messages.push('A disembodied voice thunders: "SAVE YOUR PRAYERS FOR A WORTHY FOE."');
      messages.push(`A wave of heavenly reproach washes over you. (-${playerSelfDamage} HP)`);
      if (char.hp <= 0) {
        return { messages, playerDamage: 0, monsterDamage: playerSelfDamage, playerDied: true, monsterDied: false };
      }
    } else {
      messages.push(`This foe is unworthy of divine wrath. No answer comes from above.`);
    }
  } else if (rng.float() < chance) {
    const banishChance = prayerBanishChance(char, monster, eff.wisdom);
    if (banishChance > 0 && rng.float() < banishChance) {
      messages.push('Your prayer rises like a trumpet, and the air splits with holy fire!');
      messages.push(`A gate of blinding light opens behind the ${monster.type}, dragging at it.`);
      const failFaces = banishFailFaces(monster);
      const roll = failFaces > 0 ? rng.die(12) : 12;
      if (failFaces > 0) messages.push(`The ${monster.type} fights the pull. (d12: ${roll}, fails on 1–${failFaces})`);
      if (roll > failFaces) {
        messages.push(`The ${monster.type} is torn from this world, shrieking, and the gate seals.`, 'You are free to move on.');
        return { messages, playerDamage: 0, monsterDamage: 0, playerDied: false, monsterDied: false, banished: true };
      }
      messages.push(`The ${monster.type} claws free as the gate closes, scorched by its light.`);
    }
    if (divine) {
      const base = (char.level + Math.floor(eff.wisdom / 2));
      const rand = COMBAT.PRAYER_UNDEAD_DAMAGE_MIN
        + rng.float() * (COMBAT.PRAYER_UNDEAD_DAMAGE_MAX - COMBAT.PRAYER_UNDEAD_DAMAGE_MIN);
      monsterDamage = Math.max(1, Math.round(base * rand * (isAsmodeus ? 0.5 : 1)));

      // Special: destroy a badly weakened undead
      if (undead && monster.hp < monster.maxHp * 0.2 && rng.float() < 0.5) {
        messages.push('A white light fills the corridor!');
        messages.push(`The ${monster.type} is destroyed by holy power!`);
        monster.hp = 0;
        monsterDied = true;
      } else {
        messages.push('A white light fills the corridor!');
        messages.push(`The ${monster.type} suffers ${monsterDamage} holy damage.`);
        monster.hp -= monsterDamage;
        monsterDied = monster.hp <= 0;
        if (monsterDied) messages.push(`The ${monster.type} is destroyed!`);

        // Chance to repel (non-asmodeus undead)
        if (undead && !isAsmodeus && rng.float() < 0.3) {
          messages.push(`The ${monster.type} recoils from the holy light!`);
        }
      }
    } else if (powerful) {
      const base = (char.level + Math.floor(eff.wisdom / 2));
      const rand = COMBAT.PRAYER_POWERFUL_DAMAGE_MIN
        + rng.float() * (COMBAT.PRAYER_POWERFUL_DAMAGE_MAX - COMBAT.PRAYER_POWERFUL_DAMAGE_MIN);
      monsterDamage = Math.max(1, Math.round(base * rand));

      messages.push('A faint light gathers, and strikes true.');
      messages.push(`The ${monster.type} suffers ${monsterDamage} holy damage.`);
      monster.hp -= monsterDamage;
      monsterDied = monster.hp <= 0;
      if (monsterDied) messages.push(`The ${monster.type} is destroyed!`);
    } else {
      // Non-undead, non-powerful prayer benefits
      const roll = rng.float();
      if (roll < 0.4) {
        const heal = Math.round(char.level * 0.5 + 3);
        char.hp = Math.min(char.hp + heal, char.maxHp);
        messages.push(`Your prayer is answered. You feel renewed (+${heal} HP).`);
      } else if (roll < 0.6) {
        addStatusEffect(char, { type: 'resistance-improved', value: 3, turns: 5 });
        messages.push('Your prayer strengthens your spirit. (+Resistance for 5 turns)');
      } else if (roll < 0.7 && monster.level < char.level + 3) {
        messages.push(`The ${monster.type} hesitates in fear!`);
        addStatusEffect(char, { type: 'resistance-improved', value: 2, turns: 3 });
      } else {
        messages.push('Your prayer fades. The dungeon is unmoved.');
      }
    }
  } else {
    if (penalty > 0.4) {
      messages.push('You have prayed too often. Your words ring hollow.');
    } else {
      messages.push('No answer comes from the darkness above.');
    }
  }

  const res = monsterAction(char, monster, rng, messages);
  return { ...res, playerDamage: monsterDamage, monsterDied: monsterDied || res.monsterDied };
}

/** Chance a heard prayer banishes this monster outright: only high-level
 * undead (never Asmodeus), and only for a character high enough in level and
 * Wisdom. 0 when it isn't possible. */
export function prayerBanishChance(char: Character, monster: Monster, wisdom: number): number {
  if (!monster.definition.isUndead || monster.type === 'Asmodeus') return 0;
  if (monster.level < COMBAT.PRAYER_BANISH_MIN_MONSTER_LEVEL) return 0;
  if (char.level < COMBAT.PRAYER_BANISH_MIN_CHAR_LEVEL || wisdom < COMBAT.PRAYER_BANISH_MIN_WISDOM) return 0;
  const chance = COMBAT.PRAYER_BANISH_BASE_CHANCE
    + (wisdom - COMBAT.PRAYER_BANISH_MIN_WISDOM) * COMBAT.PRAYER_BANISH_PER_WISDOM
    + (char.level - COMBAT.PRAYER_BANISH_MIN_CHAR_LEVEL) * COMBAT.PRAYER_BANISH_PER_LEVEL;
  return Math.min(COMBAT.PRAYER_BANISH_MAX_CHANCE, chance);
}

// ─── The Orc King ────────────────────────────────────────────────────────────

/** The Orc King's turn: a flurry of axe blows, a shield slam that can daze,
 * a heavy single blow, or one of Gruumsh's gifts: a war-chant that closes
 * his wounds (only when hurt), a curse that saps strength, or the Eye of
 * Gruumsh, a bolt of red fire. */
function orcKingAction(
  char: Character, monster: Monster, rng: RNG, messages: string[], naked: boolean,
  out: { acted?: boolean; ability?: string },
): MonsterActionResult {
  const K = ORC_KING;
  const hurt = monster.hp < monster.maxHp * K.WAR_CHANT_BELOW;
  const options: [string, number][] = [
    ['axe-flurry', K.FLURRY_WEIGHT],
    ['shield-slam', K.SHIELD_SLAM_WEIGHT],
    ['heavy-blow', K.BLOW_WEIGHT],
    ['curse-of-gruumsh', K.CURSE_WEIGHT],
    ['eye-of-gruumsh', K.EYE_WEIGHT],
    ...(hurt ? [['war-chant', K.WAR_CHANT_WEIGHT] as [string, number]] : []),
  ];
  let roll = rng.float() * options.reduce((a, [, w]) => a + w, 0);
  const ability = (options.find(([, w]) => (roll -= w) < 0) ?? options[0])[0];
  out.ability = ability;
  const hit = (mult: number) => Math.max(1, Math.round(calculateMonsterDamage(monster, char, rng, naked, undefined) * mult));
  const done = (dmg: number, extra: Partial<MonsterActionResult> = {}): MonsterActionResult =>
    ({ messages, monsterDamage: dmg, playerDied: char.hp <= 0, monsterDied: false, ...extra });

  switch (ability) {
    case 'axe-flurry': {
      const swings = rng.int(K.FLURRY_SWINGS_MIN, K.FLURRY_SWINGS_MAX);
      messages.push(`The Orc King's axe becomes a whirl of iron! (${swings} blows)`);
      let total = 0;
      for (let i = 0; i < swings && char.hp > 0; i++) {
        const dmg = hit(K.FLURRY_SWING_MULT);
        char.hp = Math.max(0, char.hp - dmg);
        total += dmg;
        messages.push(`  The axe bites for ${dmg} damage.`);
      }
      return done(total);
    }
    case 'shield-slam': {
      const dmg = hit(K.SHIELD_SLAM_MULT);
      char.hp = Math.max(0, char.hp - dmg);
      messages.push(`The Orc King smashes you with his spiked shield for ${dmg} damage!`);
      if (char.hp > 0 && rng.float() < K.SHIELD_SLAM_DAZE_CHANCE) {
        char.heldRounds = Math.max(char.heldRounds ?? 0, 1);
        char.heldBy = 'dazed';
        messages.push('Your ears ring and the world spins. You are dazed!');
      }
      return done(dmg);
    }
    case 'war-chant': {
      const heal = Math.min(monster.maxHp - monster.hp,
        Math.round(monster.maxHp * (K.WAR_CHANT_HEAL_MIN + rng.float() * (K.WAR_CHANT_HEAL_MAX - K.WAR_CHANT_HEAL_MIN))));
      monster.hp += heal;
      messages.push('The Orc King beats his axe on his shield and roars a war-chant to Gruumsh.',
        `Red light pours into his wounds. (The Orc King heals ${heal} HP)`);
      return done(0, { monsterHealed: heal });
    }
    case 'curse-of-gruumsh': {
      const dmg = hit(0.5);
      char.hp = Math.max(0, char.hp - dmg);
      addStatusEffect(char, { type: 'strength-reduced', value: K.CURSE_STRENGTH, turns: K.CURSE_TURNS });
      messages.push(`The Orc King spits a curse in the name of Gruumsh. Black fire crawls over you for ${dmg} damage,`,
        `and your arms turn to lead. (-${K.CURSE_STRENGTH} Strength)`);
      return done(dmg);
    }
    case 'eye-of-gruumsh': {
      const dmg = hit(K.EYE_MULT);
      char.hp = Math.max(0, char.hp - dmg);
      messages.push(`The Orc King raises his axe, and a great red eye opens in the air above him.`,
        `A bolt of searing fire lances out of it! You suffer ${dmg} damage.`);
      return done(dmg);
    }
    default: {
      const dmg = hit(1);
      char.hp = Math.max(0, char.hp - dmg);
      messages.push(`The Orc King brings his axe down with terrible force! You suffer ${dmg} damage.`);
      return done(dmg);
    }
  }
}

// ─── The Manticore ───────────────────────────────────────────────────────────

/** The Manticore's turn: a crushing bite, two claw strikes, a tail whip
 * that can land a critical blow, or the poison stinger, a nasty poison that
 * now and then sends the character into anaphylactic shock: death within
 * minutes of play, with no cure. */
function manticoreAction(
  char: Character, monster: Monster, rng: RNG, messages: string[], naked: boolean,
  out: { acted?: boolean; ability?: string },
): MonsterActionResult {
  const M = MANTICORE;
  const options: [string, number][] = [
    ['bite', M.BITE_WEIGHT], ['twin-claws', M.CLAWS_WEIGHT], ['tail-whip', M.TAIL_WEIGHT], ['poison-stinger', M.STING_WEIGHT],
  ];
  let roll = rng.float() * options.reduce((a, [, w]) => a + w, 0);
  const ability = (options.find(([, w]) => (roll -= w) < 0) ?? options[0])[0];
  out.ability = ability;
  const hit = (mult: number) => Math.max(1, Math.round(calculateMonsterDamage(monster, char, rng, naked, undefined) * mult));
  const hurt = (dmg: number) => { char.hp = Math.max(0, char.hp - dmg); return dmg; };
  const done = (dmg: number): MonsterActionResult => ({ messages, monsterDamage: dmg, playerDied: char.hp <= 0, monsterDied: false });

  switch (ability) {
    case 'bite': {
      const dmg = hurt(hit(M.BITE_MULT));
      messages.push(`The Manticore's jaws gape impossibly wide, and three rows of teeth close on you! You suffer ${dmg} damage.`);
      return done(dmg);
    }
    case 'twin-claws': {
      messages.push('The Manticore rears up and rakes at you with both forepaws!');
      let total = 0;
      for (let i = 0; i < 2 && char.hp > 0; i++) {
        const dmg = hurt(hit(M.CLAW_MULT));
        total += dmg;
        messages.push(`  Its claws tear into you for ${dmg} damage.`);
      }
      return done(total);
    }
    case 'tail-whip': {
      const crit = rng.float() < M.TAIL_CRIT_CHANCE;
      const dmg = hurt(hit(M.TAIL_MULT * (crit ? M.TAIL_CRIT_MULT : 1)));
      messages.push(crit
        ? `The spiked tail whips around and catches you full on. A CRITICAL HIT! You suffer ${dmg} damage.`
        : `The Manticore's spiked tail lashes you! You suffer ${dmg} damage.`);
      return done(dmg);
    }
    default: {
      const dmg = hurt(hit(M.STING_MULT));
      messages.push(`The Manticore's tail arcs over its back and drives its stinger into you! You suffer ${dmg} damage.`);
      if (char.hp <= 0) return done(dmg);
      addStatusEffect(char, { type: 'poison', value: M.POISON_DAMAGE, turns: M.POISON_TURNS });
      messages.push('Venom burns through your veins. You are badly poisoned!');
      if (!char.statusEffects.some(e => e.type === 'anaphylaxis') && rng.float() < M.ANAPHYLAXIS_CHANCE) {
        const seconds = rng.int(M.ANAPHYLAXIS_MIN_SECONDS, M.ANAPHYLAXIS_MAX_SECONDS);
        addStatusEffect(char, { type: 'anaphylaxis', value: char.playTime + seconds, turns: 9999 });
        messages.push('Your throat begins to swell shut. Your heart hammers. Something is very wrong.',
          `ANAPHYLACTIC SHOCK. You have perhaps ${Math.round(seconds / 60)} minutes to live.`);
      }
      return done(dmg);
    }
  }
}

// ─── Ghouls ──────────────────────────────────────────────────────────────────

/** A ghoul's hit may bring flesh rot: damage every step, worse from older
 * ghouls, and lasting longer from the ancient ones. Halves healing. */
function maybeFleshRot(char: Character, monster: Monster, rng: RNG, messages: string[], chance: number): void {
  if (rng.float() >= chance) return;
  const ancient = monster.level >= GHOUL.ANCIENT_LEVEL;
  const value = Math.max(2, Math.round(monster.level / GHOUL.ROT_LEVELS_PER_DAMAGE));
  const turns = ancient ? GHOUL.ANCIENT_ROT_STEPS : GHOUL.ROT_STEPS;
  const rot = char.statusEffects.find(e => e.type === 'flesh-rot');
  if (rot) {
    if (rot.doom !== undefined) return;
    rot.stage = (rot.stage ?? 0) + GHOUL.ROT_REINFECT_STAGES;
    rot.turns = Math.max(rot.turns, turns);
    rot.value = Math.max(rot.value, value);
    messages.push(`Fresh filth in the wound! The rot in your ${rot.part} surges forward.`);
    return;
  }
  const part = rng.pick([...GHOUL.ROT_PARTS]);
  char.statusEffects.push({ type: 'flesh-rot', value, turns, part, stage: 0 });
  messages.push(`The wound on your ${part} darkens and begins to stink. FLESH ROT!`,
    'It will spread with every step. Healing beats it back, but only half takes; an altar can burn it out.');
}

// ─── The Titanoboa ───────────────────────────────────────────────────────────

/** The Titanoboa's turn. With the character in its coils, it crushes: heavy
 * damage, and a small chance of crushing them to death outright (halved for
 * the very strong). Otherwise it bites, slams with its tail, or coils. */
function titanoboaAction(
  char: Character, monster: Monster, rng: RNG, messages: string[], naked: boolean,
  out: { acted?: boolean; ability?: string },
): MonsterActionResult {
  const T = TITANOBOA;
  const hit = (mult: number) => Math.max(1, Math.round(calculateMonsterDamage(monster, char, rng, naked, undefined) * mult));
  const hurt = (dmg: number) => { char.hp = Math.max(0, char.hp - dmg); return dmg; };
  const done = (dmg: number): MonsterActionResult => ({ messages, monsterDamage: dmg, playerDied: char.hp <= 0, monsterDied: false });

  if (char.heldBy === 'constricted' && (char.heldRounds ?? 0) > 0) {
    out.ability = 'crushing-coils';
    const deathChance = getEffectiveStats(char).strength >= T.STRONG_STRENGTH ? T.CRUSH_DEATH_STRONG : T.CRUSH_DEATH_CHANCE;
    if (rng.float() < deathChance) {
      out.ability = 'crushed';
      char.hp = 0;
      messages.push('The coils tighten all at once. There is a sound like green wood breaking.',
        'YOU HAVE BEEN CRUSHED TO DEATH.');
      return done(0);
    }
    const dmg = hurt(hit(T.CRUSH_MULT));
    messages.push(`The coils tighten. Your ribs creak and grind! You suffer ${dmg} damage.`);
    return done(dmg);
  }

  const options: [string, number][] = [['titan-bite', T.BITE_WEIGHT], ['tail-slam', T.SLAM_WEIGHT], ['crushing-coils', T.COIL_WEIGHT]];
  let roll = rng.float() * options.reduce((a, [, w]) => a + w, 0);
  const ability = (options.find(([, w]) => (roll -= w) < 0) ?? options[0])[0];
  out.ability = ability;
  switch (ability) {
    case 'titan-bite': {
      const dmg = hurt(hit(T.BITE_MULT));
      messages.push(`The Titanoboa strikes like a falling tree, its jaws closing on you! You suffer ${dmg} damage.`);
      return done(dmg);
    }
    case 'tail-slam': {
      const dmg = hurt(hit(T.SLAM_MULT));
      messages.push(`A coil as thick as a barrel sweeps out of the dark and slams you into the wall! You suffer ${dmg} damage.`);
      return done(dmg);
    }
    default: {
      const dmg = hurt(hit(T.COIL_MULT));
      messages.push(`The Titanoboa loops around you in a heartbeat. You are caught in its coils! You suffer ${dmg} damage.`);
      if (char.hp > 0) holdCharacter(char, rng.int(T.COIL_ROUNDS_MIN, T.COIL_ROUNDS_MAX), 'constricted');
      return done(dmg);
    }
  }
}

// ─── The Wendigo ─────────────────────────────────────────────────────────────

/** The Wendigo's turn: first its wounds knit (unless fire has touched it in
 * the last couple of turns), then frostbitten claws that numb the hands, a
 * devouring bite that feeds it, or a howl of endless hunger that can freeze
 * the character in terror. */
function wendigoAction(
  char: Character, monster: Monster, rng: RNG, messages: string[], naked: boolean,
  out: { acted?: boolean; ability?: string },
): MonsterActionResult {
  const W = WENDIGO;
  let healed = 0;
  if ((monster.burnedTurns ?? 0) > 0) {
    monster.burnedTurns!--;
  } else if (monster.hp < monster.maxHp) {
    healed = Math.min(monster.maxHp - monster.hp, Math.round(monster.maxHp * W.REGEN));
    monster.hp += healed;
    messages.push(`The Wendigo's torn grey flesh knits back together. (+${healed} HP)`);
  }
  const hit = (mult: number) => Math.max(1, Math.round(calculateMonsterDamage(monster, char, rng, naked, undefined) * mult));
  const hurt = (dmg: number) => { char.hp = Math.max(0, char.hp - dmg); return dmg; };
  const done = (dmg: number): MonsterActionResult =>
    ({ messages, monsterDamage: dmg, playerDied: char.hp <= 0, monsterDied: false, monsterHealed: healed || undefined });

  const options: [string, number][] = [['frostbite-claws', W.CLAW_WEIGHT], ['devouring-bite', W.BITE_WEIGHT], ['hunger-howl', W.HOWL_WEIGHT]];
  let roll = rng.float() * options.reduce((a, [, w]) => a + w, 0);
  const ability = (options.find(([, w]) => (roll -= w) < 0) ?? options[0])[0];
  out.ability = ability;
  switch (ability) {
    case 'frostbite-claws': {
      const dmg = hurt(hit(W.CLAW_MULT));
      messages.push(`Claws like icicles rake across you, burning with cold! You suffer ${dmg} damage.`);
      if (char.hp > 0 && !char.statusEffects.some(e => e.type === 'dexterity-reduced')) {
        addStatusEffect(char, { type: 'dexterity-reduced', value: W.NUMB_DEX, turns: W.NUMB_TURNS });
        messages.push(`Frostbite numbs your hands. (-${W.NUMB_DEX} Dexterity)`);
      }
      return done(dmg);
    }
    case 'devouring-bite': {
      const dmg = hurt(hit(W.BITE_MULT));
      const feed = Math.min(monster.maxHp - monster.hp, Math.round(dmg * W.BITE_FEED));
      monster.hp += feed;
      healed += feed;
      messages.push(`The Wendigo's lipless mouth tears a mouthful from you, and it swallows! You suffer ${dmg} damage.`,
        ...(feed > 0 ? [`It grows stronger as it feeds. (+${feed} HP)`] : []));
      return done(dmg);
    }
    default: {
      const dmg = hurt(hit(W.HOWL_MULT));
      messages.push(`The Wendigo throws back its antlered head and howls its endless hunger! The cold cuts you for ${dmg} damage.`);
      if (char.hp > 0 && rng.float() < W.HOWL_FEAR_CHANCE) {
        holdCharacter(char, 1, 'feared');
        messages.push('Terror roots you to the spot.');
      }
      return done(dmg);
    }
  }
}

// ─── Archons and other great beasts ──────────────────────────────────────────

/** Picks an attack by weight. */
function pickWeighted(rng: RNG, options: [string, number][]): string {
  let roll = rng.float() * options.reduce((a, [, w]) => a + w, 0);
  return (options.find(([, w]) => (roll -= w) < 0) ?? options[0])[0];
}

/** Shared helpers for the hand-written monster turns below. */
function turnKit(char: Character, monster: Monster, rng: RNG, messages: string[], naked: boolean) {
  const hit = (mult: number) => Math.max(1, Math.round(calculateMonsterDamage(monster, char, rng, naked, undefined) * mult));
  const hurt = (dmg: number) => { char.hp = Math.max(0, char.hp - dmg); return dmg; };
  const done = (dmg: number, extra: Partial<MonsterActionResult> = {}): MonsterActionResult =>
    ({ messages, monsterDamage: dmg, playerDied: char.hp <= 0, monsterDied: false, ...extra });
  return { hit, hurt, done };
}

/** The Djinn: dust storm (blinds: -Dexterity), ruby ray, a crushing punch
 * that can stun, or a choke with its smoky tail (held, squeezed each turn).
 * Badly beaten, it may whirl away and be gone. */
function djinnAction(char: Character, monster: Monster, rng: RNG, messages: string[], naked: boolean, out: { ability?: string }): MonsterActionResult {
  const D = DJINN;
  const { hit, hurt, done } = turnKit(char, monster, rng, messages, naked);
  if (monster.hp < monster.maxHp * D.FLEE_BELOW && rng.float() < D.FLEE_CHANCE) {
    messages.push('The Djinn snarls, then dissolves into a whirl of sand that spins away down the corridor.',
      'It is gone. You will get nothing from it today.');
    return done(0, { monsterFled: true });
  }
  if (char.heldBy === 'choked' && (char.heldRounds ?? 0) > 0) {
    out.ability = 'wisp-choke';
    const dmg = hurt(hit(D.CHOKE_SQUEEZE_MULT));
    messages.push(`The smoky coil tightens around your throat. The world dims. You suffer ${dmg} damage.`);
    return done(dmg);
  }
  const ability = pickWeighted(rng, [['dust-storm', D.DUST_WEIGHT], ['ruby-ray', D.RUBY_WEIGHT], ['djinn-punch', D.PUNCH_WEIGHT], ['wisp-choke', D.CHOKE_WEIGHT]]);
  out.ability = ability;
  switch (ability) {
    case 'dust-storm': {
      const dmg = hurt(hit(D.DUST_MULT));
      messages.push(`The Djinn spins, and a howling storm of sand scours you! You suffer ${dmg} damage.`);
      if (char.hp > 0 && !char.statusEffects.some(e => e.type === 'dexterity-reduced')) {
        addStatusEffect(char, { type: 'dexterity-reduced', value: D.DUST_DEX, turns: D.DUST_TURNS });
        messages.push(`Grit fills your eyes. (-${D.DUST_DEX} Dexterity)`);
      }
      return done(dmg);
    }
    case 'ruby-ray': {
      const dmg = hurt(hit(D.RUBY_MULT));
      messages.push(`The ruby in the Djinn's brow blazes, and a beam of searing red light burns into you! You suffer ${dmg} damage.`);
      return done(dmg);
    }
    case 'djinn-punch': {
      const dmg = hurt(hit(D.PUNCH_MULT));
      messages.push(`A fist the size of an anvil slams into you! You suffer ${dmg} damage.`);
      if (char.hp > 0 && rng.float() < D.PUNCH_STUN_CHANCE) {
        holdCharacter(char, 1, 'dazed');
        messages.push('Your head rings. You are stunned!');
      }
      return done(dmg);
    }
    default: {
      const dmg = hurt(hit(D.CHOKE_MULT));
      messages.push(`The Djinn's smoky tail whips around your throat and squeezes! You suffer ${dmg} damage.`);
      if (char.hp > 0) holdCharacter(char, D.CHOKE_ROUNDS, 'choked');
      return done(dmg);
    }
  }
}

/** The Phoenix: a flurry of talon, beak and wing; a blinding flash burn; or a
 * screech that holds the character in terror for 3 turns while it attacks. */
function phoenixAction(char: Character, monster: Monster, rng: RNG, messages: string[], naked: boolean, out: { ability?: string }): MonsterActionResult {
  const P = PHOENIX;
  const { hit, hurt, done } = turnKit(char, monster, rng, messages, naked);
  const held = (char.heldRounds ?? 0) > 0;
  const ability = pickWeighted(rng, [
    ['talon-flurry', P.FLURRY_WEIGHT], ['phoenix-flare', P.FLARE_WEIGHT],
    ...(held ? [] : [['phoenix-screech', P.SCREECH_WEIGHT] as [string, number]]),
  ]);
  out.ability = ability;
  switch (ability) {
    case 'talon-flurry': {
      const blows = rng.int(P.FLURRY_MIN, P.FLURRY_MAX);
      const kinds = ['Burning talons rake you', 'Its beak strikes like a spear', 'A blazing wing batters you'];
      messages.push(`The Phoenix is a storm of fire and feathers! (${blows} blows)`);
      let total = 0;
      for (let i = 0; i < blows && char.hp > 0; i++) {
        const dmg = hurt(hit(P.FLURRY_MULT));
        total += dmg;
        messages.push(`  ${kinds[i % kinds.length]} for ${dmg} damage.`);
      }
      return done(total);
    }
    case 'phoenix-flare': {
      const dmg = hurt(hit(P.FLARE_MULT));
      messages.push(`The Phoenix flares white-hot! A wall of flame washes over you! You suffer ${dmg} damage.`);
      return done(dmg);
    }
    default: {
      const dmg = hurt(hit(P.SCREECH_MULT));
      messages.push(`The Phoenix throws back its head and SCREECHES. The sound goes through you like a blade. (${dmg} damage)`);
      if (char.hp > 0) {
        holdCharacter(char, P.SCREECH_TURNS, 'paralyzed');
        messages.push(`Terror locks every muscle. You cannot move for ${P.SCREECH_TURNS} turns!`);
      }
      return done(dmg);
    }
  }
}

/** The Banshee. It may first fade from sight (2 turns invisible, then a
 * 6-turn wait), then: a wail of death (a save against Constitution and
 * Wisdom, or it takes half your remaining life), a draining touch that feeds
 * it, a dread whisper that freezes you, or a spectral bolt. */
function bansheeAction(char: Character, monster: Monster, rng: RNG, messages: string[], naked: boolean, out: { ability?: string }): MonsterActionResult {
  const B = BANSHEE;
  const { hit, hurt, done } = turnKit(char, monster, rng, messages, naked);
  if ((monster.invisibleTurns ?? 0) > 0) {
    monster.invisibleTurns!--;
    if (monster.invisibleTurns === 0) messages.push('The Banshee shimmers back into view, glowing faintly.');
  } else if ((monster.invisCooldown ?? 0) > 0) {
    monster.invisCooldown!--;
  } else if (rng.float() < B.INVIS_CHANCE) {
    monster.invisibleTurns = B.INVIS_TURNS;
    monster.invisCooldown = B.INVIS_COOLDOWN;
    messages.push('The Banshee\'s glow gutters out, and she is gone. You can hear her, somewhere close.');
  }
  const ability = pickWeighted(rng, [['banshee-wail', B.WAIL_WEIGHT], ['chill-touch', B.TOUCH_WEIGHT], ['dread-whisper', B.WHISPER_WEIGHT], ['spectral-bolt', B.BOLT_WEIGHT]]);
  out.ability = ability;
  const unseen = (monster.invisibleTurns ?? 0) > 0 ? 'From nowhere, ' : '';
  switch (ability) {
    case 'banshee-wail': {
      const eff = getEffectiveStats(char);
      const save = Math.min(0.9, B.WAIL_SAVE_BASE + eff.constitution * B.WAIL_SAVE_PER_CON + eff.wisdom * B.WAIL_SAVE_PER_WIS);
      messages.push(`${unseen}The Banshee WAILS, a keening scream of every death there ever was.`);
      if (rng.float() < save) {
        const dmg = hurt(hit(B.WAIL_MULT));
        messages.push(`You clap your hands to your ears and hold on. You suffer ${dmg} damage.`);
        return done(dmg);
      }
      const dmg = hurt(Math.max(hit(B.WAIL_MULT), Math.round(char.hp * B.WAIL_FAIL_SHARE)));
      messages.push(`Your heart stutters and nearly stops. The wail tears the life from you! You suffer ${dmg} damage.`);
      return done(dmg);
    }
    case 'chill-touch': {
      const dmg = hurt(hit(B.TOUCH_MULT));
      const heal = Math.min(monster.maxHp - monster.hp, Math.round(dmg * B.TOUCH_HEAL));
      monster.hp += heal;
      messages.push(`${unseen}Icy fingers pass into your chest and squeeze your heart! You suffer ${dmg} damage.`,
        ...(heal > 0 ? [`The Banshee's glow brightens as she feeds. (+${heal} HP)`] : []));
      return done(dmg, { monsterHealed: heal || undefined });
    }
    case 'dread-whisper': {
      const dmg = hurt(hit(B.WHISPER_MULT));
      messages.push(`${unseen}A whisper at your ear names the day you will die. (${dmg} damage)`);
      if (char.hp > 0) { holdCharacter(char, 1, 'feared'); messages.push('Dread freezes you where you stand.'); }
      return done(dmg);
    }
    default: {
      const dmg = hurt(hit(B.BOLT_MULT));
      messages.push(`${unseen}A bolt of pale, ghostly fire strikes you! You suffer ${dmg} damage.`);
      return done(dmg);
    }
  }
}

/** The Unicorn: a goring horn (can draw blood), a flurry of hooves, or a
 * blast of radiance from its horn. */
function unicornAction(char: Character, monster: Monster, rng: RNG, messages: string[], naked: boolean, out: { ability?: string }): MonsterActionResult {
  const U = UNICORN;
  const { hit, hurt, done } = turnKit(char, monster, rng, messages, naked);
  const ability = pickWeighted(rng, [['horn-gore', U.GORE_WEIGHT], ['hoof-strike', U.HOOVES_WEIGHT], ['radiant-horn', U.RADIANT_WEIGHT]]);
  out.ability = ability;
  switch (ability) {
    case 'horn-gore': {
      const dmg = hurt(hit(U.GORE_MULT));
      messages.push(`The Unicorn lowers its head and charges. The horn drives into you! You suffer ${dmg} damage.`);
      if (char.hp > 0 && rng.float() < U.GORE_BLEED_CHANCE) {
        addStatusEffect(char, { type: 'bleeding', value: 4, turns: 5 });
        messages.push('The wound is deep. You are bleeding!');
      }
      return done(dmg);
    }
    case 'hoof-strike': {
      messages.push('The Unicorn rears up and its hooves come down on you!');
      let total = 0;
      for (let i = 0; i < 2 && char.hp > 0; i++) {
        const dmg = hurt(hit(U.HOOF_MULT));
        total += dmg;
        messages.push(`  A silver hoof strikes for ${dmg} damage.`);
      }
      return done(total);
    }
    default: {
      const dmg = hurt(hit(U.RADIANT_MULT));
      messages.push(`The Unicorn's horn blazes with white light, and the light burns! You suffer ${dmg} damage.`);
      return done(dmg);
    }
  }
}

/** Offer your hand to a Unicorn: a Charisma and Wisdom roll. If it judges you
 * worthy it heals you fully, cures everything (even the incurable), leaves
 * a blessing and departs. If not, it takes offense and charges. It won't
 * let you near once you've hurt it. */
export function petUnicorn(char: Character, monster: Monster, rng: RNG): CombatRoundResult {
  const U = UNICORN;
  const messages = ['You lower your weapon and slowly hold out your hand.'];
  if (monster.hp < monster.maxHp) {
    messages.push('The Unicorn\'s eyes flash. It will not forgive the blood you have drawn.');
    const res = monsterAction(char, monster, rng, messages);
    return { ...res, playerDamage: 0, monsterDied: false };
  }
  const eff = getEffectiveStats(char);
  const chance = Math.min(U.PET_MAX, U.PET_BASE + eff.charisma * U.PET_PER_CHA + eff.wisdom * U.PET_PER_WIS);
  if (rng.float() < chance) {
    char.hp = char.maxHp;
    char.statusEffects = char.statusEffects.filter(e => e.type === 'warded' || e.type === 'resistance-improved');
    char.heldRounds = 0; char.heldBy = undefined;
    const stats = ['strength', 'constitution', 'intelligence', 'wisdom', 'dexterity', 'charisma'] as const;
    const stat = rng.pick([...stats]);
    (char[stat] as number) += 1;
    messages.push(
      'The Unicorn steps forward and lays its muzzle in your palm. Its breath is warm.',
      'It touches its horn to your brow, and light pours through you.',
      'Every wound closes. Every poison, curse and rot burns away.',
      `You feel blessed. (Fully healed, all afflictions cured, +1 ${stat})`,
      '',
      'Then it turns, and is gone, and the corridor is darker without it.',
    );
    return { messages, playerDamage: 0, monsterDamage: 0, playerDied: false, monsterDied: false, monsterFled: true };
  }
  messages.push('The Unicorn snorts and stamps. It has judged you, and found you wanting.');
  const res = monsterAction(char, monster, rng, messages);
  return { ...res, playerDamage: 0, monsterDied: false };
}

/** The Frost Giant: an ice axe cleave, a hurled boulder of ice, a storm of
 * shards, a stomp that numbs, or Winter's Grasp, which freezes you solid.
 * Below 30% health it rages, and attacks twice a turn. */
function frostGiantAction(char: Character, monster: Monster, rng: RNG, messages: string[], naked: boolean, out: { ability?: string }): MonsterActionResult {
  const F = FROST_GIANT;
  const { hit, hurt, done } = turnKit(char, monster, rng, messages, naked);
  const raging = monster.hp < monster.maxHp * F.RAGE_BELOW;
  if (raging) messages.push('The Frost Giant roars in fury, ice cracking from its beard!');
  let total = 0;
  for (let n = 0; n < (raging ? 2 : 1) && char.hp > 0; n++) {
    const frozen = char.heldBy === 'frozen' && (char.heldRounds ?? 0) > 0;
    const ability = pickWeighted(rng, [
      ['ice-axe', F.AXE_WEIGHT], ['ice-boulder', F.BOULDER_WEIGHT], ['shard-storm', F.SHARDS_WEIGHT], ['frost-stomp', F.STOMP_WEIGHT],
      ...(frozen ? [] : [['winters-grasp', F.GRASP_WEIGHT] as [string, number]]),
    ]);
    out.ability = ability;
    switch (ability) {
      case 'ice-axe': {
        const dmg = hurt(hit(F.AXE_MULT));
        total += dmg;
        messages.push(`The great axe of ice cleaves into you! You suffer ${dmg} damage.`);
        break;
      }
      case 'ice-boulder': {
        const dmg = hurt(hit(F.BOULDER_MULT));
        total += dmg;
        messages.push(`The giant tears a boulder of ice from the wall and hurls it! You suffer ${dmg} damage.`);
        break;
      }
      case 'shard-storm': {
        messages.push('The giant sweeps its hand, and a storm of razor-sharp ice shards fills the air!');
        for (let i = 0; i < F.SHARDS && char.hp > 0; i++) {
          const dmg = hurt(hit(F.SHARD_MULT));
          total += dmg;
          messages.push(`  A shard slices you for ${dmg} damage.`);
        }
        break;
      }
      case 'frost-stomp': {
        const dmg = hurt(hit(F.STOMP_MULT));
        total += dmg;
        messages.push(`The giant stamps, and the floor erupts in frost! You suffer ${dmg} damage.`);
        if (char.hp > 0 && !char.statusEffects.some(e => e.type === 'dexterity-reduced')) {
          addStatusEffect(char, { type: 'dexterity-reduced', value: F.STOMP_DEX, turns: F.STOMP_TURNS });
          messages.push(`Your feet and fingers go numb. (-${F.STOMP_DEX} Dexterity)`);
        }
        break;
      }
      default: {
        const dmg = hurt(hit(F.GRASP_MULT));
        total += dmg;
        messages.push(`The giant seizes you in a fist of living winter. Ice races over your body! You suffer ${dmg} damage.`);
        if (char.hp > 0) {
          holdCharacter(char, F.GRASP_ROUNDS, 'frozen');
          messages.push('You are frozen solid!');
        }
      }
    }
  }
  return done(total);
}

/** The Gold Dragon: wallops you with a sack of gold (some coins come loose),
 * claws and bites, breathes choking gold dust (a small chance of
 * asphyxiation: no roll, you're dead), or casts a gilding spell: a saving
 * roll (d20 + Constitution and Resistance bonuses) or you're a gold statue;
 * make it, and you're half-gilded, frozen for a while. */
function goldDragonAction(char: Character, monster: Monster, rng: RNG, messages: string[], naked: boolean, out: { ability?: string }): MonsterActionResult {
  const G = GOLD_DRAGON;
  const { hit, hurt, done } = turnKit(char, monster, rng, messages, naked);
  const held = (char.heldRounds ?? 0) > 0;
  const ability = pickWeighted(rng, [
    ['gold-wallop', G.WALLOP_WEIGHT], ['gold-claws', G.CLAW_WEIGHT], ['gold-dust-breath', G.DUST_WEIGHT],
    ...(held ? [] : [['gilding', G.GILD_WEIGHT] as [string, number]]),
  ]);
  out.ability = ability;
  switch (ability) {
    case 'gold-wallop': {
      const dmg = hurt(hit(G.WALLOP_MULT));
      messages.push(`The Gold Dragon swings its great sack of treasure and WALLOPS you! You suffer ${dmg} damage.`);
      if (char.hp > 0) {
        const coins = rng.int(G.WALLOP_COINS_MIN, G.WALLOP_COINS_MAX);
        char.gold += coins;
        messages.push(`Coins burst from the sack and rain down around you. (You snatch up ${coins} gold.)`);
      }
      return done(dmg);
    }
    case 'gold-claws': {
      const dmg = hurt(hit(G.CLAW_MULT));
      messages.push(`Golden claws and gleaming teeth tear into you! You suffer ${dmg} damage.`);
      return done(dmg);
    }
    case 'gold-dust-breath': {
      messages.push('The Gold Dragon breathes out a glittering, blinding cloud of gold dust!');
      if (rng.float() < G.ASPHYXIATION_CHANCE) {
        out.ability = 'asphyxiated';
        char.hp = 0;
        messages.push('The dust fills your mouth, your nose, your lungs. You cannot breathe. You cannot breathe.',
          'YOU HAVE ASPHYXIATED.');
        return done(0);
      }
      const dmg = hurt(hit(G.DUST_MULT));
      messages.push(`You cough and choke on the burning dust! You suffer ${dmg} damage.`);
      return done(dmg);
    }
    default: {
      const eff = getEffectiveStats(char);
      const bonus = Math.floor((eff.constitution - 10) / 2) + Math.floor((eff.resistance - 10) / 2);
      const d = rng.die(20);
      messages.push('The Gold Dragon\'s eyes blaze, and it speaks a word of power. Gold spreads across your skin...',
        `(Saving roll: d20 ${d} ${bonus >= 0 ? '+' : '-'} ${Math.abs(bonus)} = ${d + bonus}, needed ${G.GILD_DC})`);
      if (d + bonus < G.GILD_DC) {
        out.ability = 'gilded';
        char.hp = 0;
        messages.push('...and keeps spreading, over your face, into your eyes. You are a statue of solid gold.',
          'It will look lovely in the hoard.');
        return done(0);
      }
      const dmg = hurt(hit(G.GILD_MULT));
      messages.push(`You fight it back, but your arms and legs are gilded and stiff! You suffer ${dmg} damage.`);
      if (char.hp > 0) holdCharacter(char, G.GILD_ROUNDS, 'gilded');
      return done(dmg);
    }
  }
}

// ─── The great bestiary ──────────────────────────────────────────────────────

/** Plays one turn from a monster's move table (bestiary.ts). */
function runBestiaryTurn(
  script: Script, char: Character, monster: Monster, rng: RNG, messages: string[], naked: boolean,
  out: { acted?: boolean; ability?: string },
): MonsterActionResult {
  const hpBefore = char.hp;
  let healed = 0;
  const hit = (mult: number) => Math.max(1, Math.round(calculateMonsterDamage(monster, char, rng, naked, undefined) * mult));
  const kit: Kit = {
    char, monster, rng,
    say: (...lines) => { messages.push(...lines); },
    hit,
    strike: (mult, text) => {
      const dmg = hit(mult);
      char.hp = Math.max(0, char.hp - dmg);
      messages.push(text(dmg));
      return dmg;
    },
    strikes: (n, mult, text) => {
      let total = 0;
      for (let i = 0; i < n && char.hp > 0; i++) {
        const dmg = hit(mult);
        char.hp = Math.max(0, char.hp - dmg);
        total += dmg;
        messages.push(text(dmg, i));
      }
      return total;
    },
    hold: (rounds, why) => holdCharacter(char, rounds, why),
    status: effect => addStatusEffect(char, effect),
    heal: amount => {
      const h = Math.max(0, Math.min(monster.maxHp - monster.hp, amount));
      monster.hp += h;
      healed += h;
      return h;
    },
    save: (dc, stats) => {
      const eff = getEffectiveStats(char);
      const bonus = stats.reduce((a, st) => a + Math.floor(((eff[st] as number) - 10) / 2), 0);
      const d = rng.die(20);
      return { ok: d + bonus >= dc, text: `d20 ${d} ${bonus >= 0 ? '+' : '-'} ${Math.abs(bonus)} = ${d + bonus}, needed ${dc}` };
    },
    kill: (cause, ...lines) => { char.hp = 0; out.ability = cause; messages.push(...lines); },
    mirror: mult => {
      const eff = getEffectiveStats(char);
      const strDiv = char.charClass === 'warrior' ? WARRIOR.STR_DAMAGE_DIVISOR : COMBAT.DAMAGE_STR_DIVISOR;
      const base = char.level * COMBAT.DAMAGE_LEVEL_WEIGHT + Math.floor(eff.strength / strDiv);
      const rand = COMBAT.DAMAGE_RAND_MIN + rng.float() * (COMBAT.DAMAGE_RAND_MAX - COMBAT.DAMAGE_RAND_MIN);
      return Math.round(base * rand * mult);
    },
    alive: () => char.hp > 0,
    held: () => (char.heldRounds ?? 0) > 0,
  };

  const ended = script.before?.(kit) ?? false;
  if (!ended && char.hp > 0 && monster.hp > 0) {
    const options = script.moves.filter(m => !m.when || m.when(kit));
    const pool = options.length ? options : script.moves;
    const total = pool.reduce((a, m) => a + m.weight, 0);
    let roll = rng.float() * total;
    const move = pool.find(m => (roll -= m.weight) < 0) ?? pool[pool.length - 1];
    out.ability = move.id;
    move.run(kit);
  }
  const dealt = Math.max(0, hpBefore - char.hp);
  return {
    messages, monsterDamage: dealt, playerDied: char.hp <= 0, monsterDied: monster.hp <= 0,
    monsterHealed: healed || undefined,
  };
}

// ─── Scare ───────────────────────────────────────────────────────────────────

/** Things with no mind to frighten. */
const FEARLESS: MonsterType[] = ['Mold', 'Slime Mold', 'Gelatinous Cube', 'Skeleton', 'Zombie'];

/** Chance to frighten a monster off: better against weaker foes and with
 * Charisma, worse against fearsome ones and after failed attempts. 0 for the
 * mindless and the unique lords. */
export function scareChance(char: Character, monster: Monster): number {
  if (FEARLESS.includes(monster.type) || monster.definition.isUnique) return 0;
  const eff = getEffectiveStats(char);
  let chance = SCARE.BASE_CHANCE
    + (char.level - monster.level) * SCARE.PER_LEVEL
    + (eff.charisma - 10) * SCARE.PER_CHARISMA
    - monster.definition.naturalTier * SCARE.PER_TIER
    - (monster.scareAttempts ?? 0) * SCARE.REPEAT_PENALTY;
  if (monster.level < char.level * 0.5) chance += SCARE.OUTCLASSED_BONUS;
  return Math.max(SCARE.MIN_CHANCE, Math.min(SCARE.MAX_CHANCE, chance));
}

/** Rears up, roars and brandishes: the monster may bolt. If not, it acts. */
export function playerScare(char: Character, monster: Monster, rng: RNG): CombatRoundResult & { scared?: boolean } {
  const messages = ['You draw yourself up, roar, and come at it with murder in your eyes!'];
  if (monster.definition.isUnique) {
    messages.push(`The ${monster.type} laughs at you.`);
  } else if (FEARLESS.includes(monster.type)) {
    messages.push(`The ${monster.type} has no mind to frighten.`);
  } else if (rng.float() < scareChance(char, monster)) {
    messages.push(`The ${monster.type} falters... then turns tail and bolts into the darkness!`, 'You are free to move on.');
    return { messages, playerDamage: 0, monsterDamage: 0, playerDied: false, monsterDied: false, scared: true };
  } else {
    monster.scareAttempts = (monster.scareAttempts ?? 0) + 1;
    messages.push(`The ${monster.type} is not impressed.`);
  }
  const res = monsterAction(char, monster, rng, messages);
  return { ...res, playerDamage: 0, monsterDied: false };
}

// ─── First strike ────────────────────────────────────────────────────────────

/** The monster acts before the character can: a lair's master dragging an
 * intruder in, or meeting a failed charge. */
export function monsterFirstStrike(char: Character, monster: Monster, rng: RNG, messages: string[] = []): CombatRoundResult {
  const res = monsterAction(char, monster, rng, messages);
  return { ...res, playerDamage: 0 };
}

// ─── Banish ──────────────────────────────────────────────────────────────────

/** How many faces of a d12 make Banish fail against this monster (0 = it
 * always works). Very powerful monsters resist by tier; any high-level
 * dragon or undead resists too. Asmodeus is at home in the Hells. */
export function banishFailFaces(monster: Monster): number {
  if (monster.type === 'Asmodeus') return 12;
  const byTier = SPELLS.BANISH_FAIL_FACES_BY_TIER[monster.definition.naturalTier] ?? 0;
  const dragonOrUndead = monster.type.includes('Dragon') || monster.definition.isUndead;
  const highLevel = monster.level >= Math.min(monster.definition.maxLevel * SPELLS.BANISH_HIGH_LEVEL_FRACTION, SPELLS.BANISH_HIGH_LEVEL_MAX);
  const byKind = dragonOrUndead && highLevel ? SPELLS.BANISH_HIGH_LEVEL_FAIL_FACES : 0;
  return Math.max(byTier, byKind);
}

export function playerBanish(char: Character, monster: Monster, rng: RNG): CombatRoundResult {
  const messages = ['You cast Banish, and a rift to the outer dark tears open behind the ' + monster.type + '!'];
  const failFaces = banishFailFaces(monster);
  let banished: boolean;
  if (monster.type === 'Asmodeus') {
    messages.push('Asmodeus laughs. "Banish me? From my own Hells?" But the rift lashes at him as it gutters out.');
    staggerAsmodeus(monster, COMBAT.ASMODEUS_BANISH_STUN_TURNS, COMBAT.ASMODEUS_BANISH_PHYSICAL_TURNS, messages);
    banished = false;
  } else if (failFaces === 0) {
    banished = true;
  } else {
    const roll = rng.die(12);
    banished = roll > failFaces;
    messages.push(`The ${monster.type} fights the pull. (d12: ${roll}, fails on 1–${failFaces})`);
  }
  if (banished) {
    messages.push(`The ${monster.type} is dragged screaming into the rift, and it snaps shut.`, 'You are free to move on.');
    return { messages, playerDamage: 0, monsterDamage: 0, playerDied: false, monsterDied: false, banished: true };
  }
  if (monster.type !== 'Asmodeus') messages.push(`The ${monster.type} tears itself free. The rift collapses.`);
  const res = monsterAction(char, monster, rng, messages);
  return { ...res, playerDamage: 0, monsterDied: false };
}

// ─── Run ─────────────────────────────────────────────────────────────────────

export function playerRun(char: Character, monster: Monster, rng: RNG): CombatRoundResult {
  if (monster.type === 'Erinyes') {
    const messages = ['You turn to run, but the Fury is above you, ahead of you, everywhere. There is no outrunning her.'];
    const res = monsterAction(char, monster, rng, messages);
    return { ...res, playerDamage: 0, monsterDied: false, runFailed: true };
  }
  const eff = getEffectiveStats(char);
  const levelDiff = char.level - monster.level;
  const mummified = char.statusEffects.some(e => e.type === 'mummified');

  let chance = COMBAT.RUN_BASE_CHANCE
    + eff.dexterity * COMBAT.RUN_DEX_BONUS
    + levelDiff * COMBAT.RUN_LEVEL_FACTOR
    - (monster.definition.speed - 1.0) * COMBAT.SPEED_RUN_MODIFIER;
  if (mummified) chance -= 0.2;
  if (monster.type === 'Tarrasque') chance -= 0.3;
  if (monster.type === 'Nuckelavee') chance += 0.3;   // it will not cross running water
  chance = Math.max(0.05, Math.min(0.90, chance));

  const messages: string[] = [];

  if (rng.float() < chance) {
    messages.push(monster.type === 'Nuckelavee' ? 'You turn and flee, splashing across a running stream. It stops dead at the water\u2019s edge and SCREAMS.' : 'You turn and flee!');
    return {
      messages,
      playerDamage: 0,
      monsterDamage: 0,
      playerDied: false,
      monsterDied: false,
      ran: true,
    };
  } else {
    messages.push('The monster blocks your escape!');
    const res = monsterAction(char, monster, rng, messages);
    return { ...res, playerDamage: 0, monsterDied: false, runFailed: true };
  }
}

// ─── Monster action ──────────────────────────────────────────────────────────

/** What kind of harm a monster ability does — drives the colour of the
 * client's hit effects. Order matters: the first match wins. */
export function abilityElement(ability: string | undefined): FxElement {
  if (!ability) return 'physical';
  if (ability === 'telekinetic-ray') return 'physical';
  if (ability === 'eye-of-gruumsh') return 'fire';
  if (ability === 'curse-of-gruumsh') return 'drain';
  if (ability === 'ruby-ray' || ability === 'phoenix-flare' || ability === 'hellfire' || ability === 'chimera-heads' || ability === 'mirror-spell') return 'fire';
  if (ability === 'balor-sword') return 'lightning';
  if (ability === 'poison-gas' || ability === 'spider-bite' || ability === 'tail-stinger' || ability === 'fiend-bite') return 'poison';
  if (ability === 'stirge-drain' || ability === 'life-leech' || ability === 'soul-howl' || ability === 'dead-head-curse' || ability === 'rakshasa-curse') return 'drain';
  if (ability === 'harpy-song' || ability === 'rakshasa-illusion' || ability === 'tyrant-rays' || ability === 'stone-gaze') return 'arcane';
  if (ability === 'chill-touch' || ability === 'banshee-wail') return 'drain';
  if (ability === 'radiant-horn') return 'holy';
  if (ability === 'worm-spit') return 'acid';
  if (ability === 'worm-lightning') return 'lightning';
  if (ability === 'lament' || ability === 'mask-whisper' || ability === 'choir-prepare') return 'psychic';
  if (ability === 'unmaking') return 'arcane';
  if (ability === 'false-joy') return 'drain';
  if (ability === 'winters-grasp' || ability === 'shard-storm') return 'cold';
  if (/disintegrate|petrify|paralyze-ray|slow-ray|magic|teleport|naked|light-bolt/.test(ability)) return 'arcane';
  if (/fire|flame|burn|infernal/.test(ability)) return 'fire';
  if (/frost|cold|ice/.test(ability)) return 'cold';
  if (/lightning|thunder/.test(ability)) return 'lightning';
  if (/acid|slime|engulf/.test(ability)) return 'acid';
  if (/poison|spore|venom|radiation/.test(ability)) return 'poison';
  if (/drain|enervation|death|life|blood|mummif/.test(ability)) return 'drain';
  if (/psychic|mind|memory|fear|terror|charm|sleep|intelligence|disrupt|darkness|gaze/.test(ability)) return 'psychic';
  return 'physical';
}

type MonsterActionResult = { messages: string[]; monsterDamage: number; playerDied: boolean; monsterDied: boolean; playerTeleported?: boolean; ballOfDooFired?: boolean; monsterHealed?: number; monsterElement?: FxElement; deathCause?: string; killingBlow?: string[]; monsterFled?: boolean; spared?: boolean };

/** The monster's turn. Also reports the element of whatever it did
 * (monsterElement), or nothing if it didn't get to act; and if it killed
 * the character, which attack did it and the lines describing it. */
/** A newcomer's safety net: in their first few fights on level 1, a blow that
 * would kill them from above half their health leaves them at 1 HP instead.
 * (Only characters made since it began: they carry an early-game record.) */
export function safetyNetHolds(char: Character, hpBefore: number): boolean {
  return !!char.firstSteps && char.dungeonLevel === 1 && char.monstersDefeated < NEWCOMER.SAFETY_NET_FIGHTS
    && hpBefore > char.maxHp * NEWCOMER.SAFETY_NET_ABOVE;
}

function monsterAction(char: Character, monster: Monster, rng: RNG, messages: string[]): MonsterActionResult {
  const hpBefore = char.hp;
  const res = monsterActionUnnetted(char, monster, rng, messages);
  if (!(res.playerDied || char.hp <= 0) || !safetyNetHolds(char, hpBefore)) return res;
  char.hp = 1;
  messages.push('', 'The blow should have killed you. Somehow you are still standing, barely. (1 HP)');
  return { ...res, playerDied: false, deathCause: undefined, killingBlow: undefined, spared: true };
}

function monsterActionUnnetted(char: Character, monster: Monster, rng: RNG, messages: string[]): MonsterActionResult {
  const start = messages.length;
  const guarding = (char.inventory.wornRings?.length ?? 0) > 0 || monster.backfirePrimed;
  const before = guarding ? snapshotChar(char) : null;
  const out: { acted?: boolean; ability?: string } = {};
  const inner = monsterActionInner(char, monster, rng, messages, out);
  if ((monster.witherTurns ?? 0) > 0) {
    monster.witherTurns!--;
    if (monster.witherTurns === 0) messages.push(`The ${monster.type} straightens as the withering passes.`);
  }
  if (!out.acted) return inner;
  let res = vampireHypnosis(char, monster, rng, messages, { ...inner, monsterElement: abilityElement(out.ability) });
  if (before) res = applyRing(char, monster, before, out.ability, res, messages, start);
  if (!res.playerDied) return res;

  const blow = messages.slice(start);
  const hypnotized = blow.some(l => l.includes('drinks you dry'));
  while (blow.length && blow[0] === '') blow.shift();
  return { ...res, deathCause: killedBy(monster, hypnotized ? 'hypnosis' : out.ability), killingBlow: blow };
}

// ─── Rings ───────────────────────────────────────────────────────────────────

function snapshotChar(char: Character): Character {
  return JSON.parse(JSON.stringify(char)) as Character;
}

/** Puts the character back exactly as they were. */
function restoreChar(char: Character, snap: Character): void {
  for (const k of Object.keys(char)) if (!(k in snap)) delete (char as unknown as Record<string, unknown>)[k];
  Object.assign(char, snap);
}

/** Attacks that kill outright, rather than by damage: a ward can't soften them. */
const INSTANT_KILLS = new Set(['ball-of-doo', 'crushed', 'gilded', 'asphyxiated', 'stone-gaze', 'soul-trapped',
  'tyrant-death-ray', 'petrify-ray', 'death-ray', 'disintegrate-ray', 'hypnosis']);

export function isEvil(monster: Monster): boolean {
  return RINGS.EVIL_MONSTERS.includes(monster.type);
}

/** Rings, after the monster has acted. A primed green diamond undoes the
 * whole attack and turns part of it back on the monster. Otherwise every
 * protective ring worn guards against its own kind of harm, together: each
 * turns aside its share of the damage (ruby fire, aquamarine cold, onyx
 * evil, rose quartz the undead, jade poison), and the onyx stops evil's fear
 * and charms, the rose quartz the undead's level drain, the jade poison
 * taking hold. */
function applyRing(char: Character, monster: Monster, before: Character, ability: string | undefined, res: MonsterActionResult, messages: string[], from: number): MonsterActionResult {
  if (monster.backfirePrimed && char.inventory.readiedRing === 'backfire') {
    const touched = res.playerDied || res.playerTeleported || JSON.stringify(char) !== JSON.stringify(before);
    if (touched) {
      const dealt = Math.max(res.monsterDamage, before.hp - char.hp, 0);
      restoreChar(char, before);
      monster.backfirePrimed = false;
      const back = Math.round(dealt * RINGS.BACKFIRE_FRACTION);
      monster.hp -= back;
      messages.push('', `Your green diamond ring blazes! The ${monster.type}'s attack turns back on it. You are untouched${back > 0 ? `, and it takes ${back} damage` : ''}!`);
      if (monster.hp <= 0) messages.push(`The ${monster.type} collapses!`);
      return { ...res, monsterDamage: 0, playerDied: false, playerTeleported: false, ballOfDooFired: false, monsterDied: monster.hp <= 0 };
    }
  }

  const worn = char.inventory.wornRings ?? [];
  const poisoned = res.monsterElement === 'poison'
    || char.statusEffects.some(e => (e.type === 'poison' || e.type === 'fiend-venom') && !before.statusEffects.some(b => b.type === e.type));
  const wards: { ring: RingId; share: number }[] = [];
  if (worn.includes('fire') && res.monsterElement === 'fire') wards.push({ ring: 'fire', share: RINGS.FIRE_WARD });
  if (worn.includes('cold') && res.monsterElement === 'cold') wards.push({ ring: 'cold', share: RINGS.COLD_WARD });
  if (worn.includes('evil') && isEvil(monster)) wards.push({ ring: 'evil', share: RINGS.EVIL_WARD });
  if (worn.includes('undead') && monster.definition.isUndead) wards.push({ ring: 'undead', share: RINGS.UNDEAD_WARD });
  if (worn.includes('poison') && poisoned) wards.push({ ring: 'poison', share: RINGS.POISON_WARD });
  if (!wards.length) return res;

  if (worn.includes('undead') && monster.definition.isUndead && char.level < before.level) {
    char.level = before.level; char.maxHp = before.maxHp; char.xp = before.xp;
    // Take back the "you have been drained" line: it didn't happen.
    for (let i = messages.length - 1; i >= from; i--) if (/YOU HAVE BEEN DRAINED|drains your very essence/.test(messages[i])) messages.splice(i, 1);
    messages.push('A deathly chill reaches for your life, but your rose quartz ring flares and drives it back! (Level drain blocked)');
  }
  if (worn.includes('evil') && isEvil(monster) && (char.heldRounds ?? 0) > (before.heldRounds ?? 0) && (char.heldBy === 'feared' || char.heldBy === 'charmed')) {
    char.heldRounds = before.heldRounds; char.heldBy = before.heldBy;
    messages.push(`Your onyx ring's eye opens, and the ${monster.type}'s hold on your mind breaks!`);
  }
  if (worn.includes('poison') && poisoned) {
    const fresh = char.statusEffects.filter(e => (e.type === 'poison' || e.type === 'fiend-venom') && !before.statusEffects.some(b => b.type === e.type));
    if (fresh.length) {
      char.statusEffects = char.statusEffects.filter(e => !fresh.includes(e));
      messages.push('Your jade ring turns cold, and the poison cannot take hold.');
    }
  }

  const taken = before.hp - char.hp;
  const instant = res.playerDied && (INSTANT_KILLS.has(ability ?? '') || res.monsterDamage === before.hp);
  if (taken <= 0 || instant) return res;
  // Several rings together: each turns aside its share of what the others let through.
  const share = Math.min(0.9, 1 - wards.reduce((left, w) => left * (1 - w.share), 1));
  const saved = Math.round(taken * share);
  if (saved <= 0) return res;
  char.hp = Math.min(char.maxHp, char.hp + saved);
  const names = wards.map(w => RINGS_INFO[w.ring].name);
  const said = names.length === 1 ? `Your ${names[0]} glows` : `Your ${names.slice(0, -1).join(', ')} and ${names[names.length - 1]} glow`;
  messages.push(`${said} and turn${names.length === 1 ? 's' : ''} aside ${saved} of the damage.`);
  return { ...res, monsterDamage: Math.max(0, res.monsterDamage - saved), playerDied: char.hp <= 0 };
}

/** Readies another power ring, mid-fight: it costs the turn. */
export function playerReadyRing(char: Character, monster: Monster, rng: RNG, ring: RingId): CombatRoundResult {
  char.inventory.readiedRing = ring;
  const info = RINGS_INFO[ring];
  const messages = [`You turn the ${info.name} to the front, and it wakes. (${info.power})`];
  const res = monsterAction(char, monster, rng, messages);
  return { ...res, playerDamage: 0, monsterDied: monster.hp <= 0 };
}

/** The green diamond ring: the monster's next attack backfires. Once a fight. */
export function playerBackfireRing(char: Character, monster: Monster, rng: RNG): CombatRoundResult {
  monster.backfirePrimed = true;
  monster.backfireUsed = true;
  const messages = ['You twist the green diamond ring. A thousand tiny mirrors wake, and wait...'];
  const res = monsterAction(char, monster, rng, messages);
  return { ...res, playerDamage: 0, monsterDied: monster.hp <= 0 };
}

const ATTACK_NAMES: Record<string, string> = {
  'great-strength': 'crushing blow',
  'infernal-healing': 'infernal drain',
  'life-drain': 'life-draining touch',
  'engulf-paralyze': 'engulfing mass',
  'gaze-paralyze': 'paralyzing gaze',
  'paralysis-touch': 'paralyzing touch',
  'ghoul-claws': 'paralyzing claws',
  'filthy-bite': 'festering bite',
  'spore-poison': 'poison spores',
  'slime-disease': 'diseased slime',
  'fear-ray': 'fear ray',
  'slow-ray': 'slowing ray',
  'enervation-ray': 'enervation ray',
  'telekinetic-ray': 'telekinetic ray',
  'charm-ray': 'charm ray',
  'sleep-ray': 'sleep ray',
  'crushing-coils': 'crushing coils',
  'dust-storm': 'dust storm', 'ruby-ray': 'ruby ray', 'djinn-punch': 'fist', 'wisp-choke': 'choking tail',
  'talon-flurry': 'talons', 'phoenix-flare': 'flash burn', 'phoenix-screech': 'screech',
  'banshee-wail': 'wail', 'chill-touch': 'chilling touch', 'dread-whisper': 'whisper', 'spectral-bolt': 'spectral bolt',
  'horn-gore': 'horn', 'hoof-strike': 'hooves', 'radiant-horn': 'radiant horn',
  'gold-wallop': 'sack of gold', 'gold-claws': 'claws', 'gold-dust-breath': 'gold-dust breath', 'gilding': 'gilding spell',
  'ice-axe': 'ice axe', 'ice-boulder': 'hurled boulder', 'shard-storm': 'ice shards', 'frost-stomp': 'stomp', 'winters-grasp': "winter's grasp",
  'titan-bite': 'bite',
  'worm-spit': 'acid', 'worm-lightning': 'lightning', 'worm-burrow': 'eruption', 'worm-lash': 'spined tail',
  'leech-drain': 'drinking mouth', 'leech-latch': 'clamping mouth', 'leech-slam': 'slick weight', 'shrew-bite': 'teeth', 'shrew-frenzy': 'teeth', 'shrew-shriek': 'pack',
  'lament': 'Lament', 'false-joy': 'False Joy', 'rage-strike': 'raging mask', 'mask-whisper': 'whispering mask',
  'tail-slam': 'tail',
  'frostbite-claws': 'frostbitten claws',
  'devouring-bite': 'devouring bite',
  'hunger-howl': 'howl',
  'bite': 'bite',
  'twin-claws': 'claws',
  'tail-whip': 'tail',
  'poison-stinger': 'poison stinger',
  'axe-flurry': 'whirling axe',
  'shield-slam': 'spiked shield',
  'heavy-blow': 'axe',
  'curse-of-gruumsh': 'curse of Gruumsh',
  'eye-of-gruumsh': 'Eye of Gruumsh',
};

/** The death screen's cause line, naming the attack that did the character in. */
export function killedBy(monster: Monster, ability: string | undefined): string {
  const who = `a Level ${monster.level} ${monster.type}`;
  switch (ability) {
    case undefined:
    case '':                 return `Killed by ${who}.`;
    case 'radiation':        return `Killed by the radioactive flesh of ${who}.`;
    case 'hypnosis':         return `Hypnotized and drained dry by ${who}.`;
    case 'ball-of-doo':      return 'Turned into a pile of lizard excrement by Asmodeus.';
    case 'crushed':          return `Crushed to death in the coils of ${who}.`;
    case 'gilded':           return `Turned to solid gold by ${who}.`;
    case 'asphyxiated':      return `Choked to death on the gold-dust breath of ${who}.`;
    case 'stone-gaze':       return `Turned to stone by the gaze of ${who}.`;
    case 'soul-trapped':     return `Soul trapped forever in a gem by ${who}.`;
    case 'tyrant-death-ray': return `Slain by the death ray of ${who}.`;
    case 'petrify-ray':      return `Turned to stone by ${who}.`;
    case 'death-ray':        return `Slain by the death ray of ${who}.`;
    case 'disintegrate-ray': return `Disintegrated by ${who}.`;
    case 'paralyze-ray':     return `Killed by ${who} while paralyzed.`;
    default:                 return `Killed by the ${ATTACK_NAMES[ability] ?? ability.replace(/-/g, ' ')} of ${who}.`;
  }
}

/** An elder vampire's damaging hit may hypnotize: usually fatal, otherwise
 * the victim snaps out of it as the fangs go in. */
function vampireHypnosis(char: Character, monster: Monster, rng: RNG, messages: string[], res: MonsterActionResult): MonsterActionResult {
  if (monster.type !== 'Vampire' || monster.level < COMBAT.VAMPIRE_HYPNOSIS_MIN_LEVEL) return res;
  if (res.monsterDamage <= 0 || res.playerDied || char.hp <= 0) return res;
  if (rng.float() >= COMBAT.VAMPIRE_HYPNOSIS_CHANCE) return res;

  messages.push('', "The Vampire's eyes catch yours, and the world falls away. YOU ARE HYPNOTIZED.");
  if (rng.float() < COMBAT.VAMPIRE_HYPNOSIS_KILL_CHANCE) {
    const drained = char.hp;
    char.hp = 0;
    messages.push('You stand helpless, smiling, as it drinks you dry.');
    return { ...res, monsterDamage: res.monsterDamage + drained, playerDied: true, monsterElement: 'drain' };
  }
  const naked = char.statusEffects.some(e => e.type === 'naked');
  const bite = calculateMonsterDamage(monster, char, rng, naked);
  char.hp = Math.max(0, char.hp - bite);
  messages.push(`You snap out of it as its fangs sink into your throat! You suffer ${bite} damage.`);
  return { ...res, monsterDamage: res.monsterDamage + bite, playerDied: char.hp <= 0, monsterElement: 'drain' };
}

function monsterActionInner(
  char: Character,
  monster: Monster,
  rng: RNG,
  messages: string[],
  out: { acted?: boolean; ability?: string },
): MonsterActionResult {
  if (monster.hp <= 0) {
    return { messages, monsterDamage: 0, playerDied: false, monsterDied: true };
  }
  // The Hollow Choir's masks shatter as it weakens (before it acts, or fails to).
  if (monster.type === 'Hollow Choir') shatterChoirMasks(monster, messages);

  if ((monster.confusedTurns ?? 0) > 0) {
    monster.confusedTurns!--;
    if (rng.float() < GEMS.CONFUSION_FAIL_CHANCE) {
      messages.push(`The ${monster.type} reels in confusion and fails to act!`);
      return { messages, monsterDamage: 0, playerDied: false, monsterDied: false };
    }
  }
  if (monster.caughtOffGuard) {
    monster.caughtOffGuard = false;
    messages.push(`Caught off guard, the ${monster.type} cannot answer your blow!`);
    return { messages, monsterDamage: 0, playerDied: false, monsterDied: false };
  }
  if ((monster.frozenTurns ?? 0) > 0) return stilledTurn(monster, messages);
  if ((monster.stunnedTurns ?? 0) > 0) {
    monster.stunnedTurns!--;
    messages.push(`The ${monster.type} is still stunned and can't act!`);
    return { messages, monsterDamage: 0, playerDied: false, monsterDied: false };
  }
  out.acted = true;

  if ((char.invulnerableTurns ?? 0) > 0) {
    char.invulnerableTurns!--;
    messages.push(`Your protective ward deflects the ${monster.type}'s attack harmlessly.`);
    return { messages, monsterDamage: 0, playerDied: false, monsterDied: false };
  }

  // An emerald ward turns most attacks aside, but not all.
  if (wardFights(char) > 0 && rng.float() < GEMS.EMERALD_DEFLECT_CHANCE) {
    messages.push(`Your emerald ward flares green and turns the ${monster.type}'s attack aside!`);
    return { messages, monsterDamage: 0, playerDied: false, monsterDied: false };
  }

  const naked = char.statusEffects.some(e => e.type === 'naked');
  const eff = getEffectiveStats(char);

  if (monster.type === 'Hollow Choir') return hollowChoirAction(char, monster, rng, messages, naked, out);
  if (monster.type === 'Orc King') return orcKingAction(char, monster, rng, messages, naked, out);
  if (monster.type === 'Manticore') return manticoreAction(char, monster, rng, messages, naked, out);
  if (monster.type === 'Titanoboa') return titanoboaAction(char, monster, rng, messages, naked, out);
  if (monster.type === 'Wendigo') return wendigoAction(char, monster, rng, messages, naked, out);
  if (monster.type === 'Djinn') return djinnAction(char, monster, rng, messages, naked, out);
  if (monster.type === 'Phoenix') return phoenixAction(char, monster, rng, messages, naked, out);
  if (monster.type === 'Banshee') return bansheeAction(char, monster, rng, messages, naked, out);
  if (monster.type === 'Unicorn') return unicornAction(char, monster, rng, messages, naked, out);
  if (monster.type === 'Frost Giant') return frostGiantAction(char, monster, rng, messages, naked, out);
  if (monster.type === 'Gold Dragon') return goldDragonAction(char, monster, rng, messages, naked, out);
  const script = BESTIARY[monster.type];
  if (script) return runBestiaryTurn(script, char, monster, rng, messages, naked, out);

  // Choose ability to use
  const abilities = monster.definition.specialAbilities;
  let ability: string | undefined;
  let playerTeleported = false;
  let ballOfDooFired = false;
  let monsterHealed = 0;

  if (abilities.length > 0 && rng.float() < 0.5) {
    ability = rng.pick(abilities);
  }

  // Special Asmodeus logic
  if (monster.type === 'Asmodeus' && (monster.physicalOnlyTurns ?? 0) > 0) {
    // Still shaken by a sapphire: no spells, just claws and tail.
    monster.physicalOnlyTurns!--;
    messages.push('His magic still scattered by the sapphire, Asmodeus lashes out with claw and tail!');
    ability = '';
  } else if (monster.type === 'Asmodeus') {
    // Badly wounded, he spends his turn knitting himself back together, once a fight.
    if (!monster.regenerated && monster.hp > 0 && monster.hp < COMBAT.ASMODEUS_REGEN_BELOW_HP) {
      monster.regenerated = true;
      const frac = COMBAT.ASMODEUS_REGEN_MIN + rng.float() * (COMBAT.ASMODEUS_REGEN_MAX - COMBAT.ASMODEUS_REGEN_MIN);
      const heal = Math.min(monster.maxHp - monster.hp, Math.round(monster.maxHp * frac));
      monster.hp += heal;
      messages.push(
        'Asmodeus snarls a word that was old before the world, and hellfire pours into his wounds.',
        `His torn flesh knits closed before your eyes! (Asmodeus regenerates ${heal} HP)`,
      );
      return { messages, monsterDamage: 0, playerDied: false, monsterDied: false, monsterHealed: heal };
    }
    ability = pickAsmodeusAbility(monster, char, rng);
  }

  // Special Wizard logic
  if (monster.type === 'Wizard') {
    ability = pickWizardAbility(rng);
  }


  // Special Sanguinid logic — passively radioactive every round, on top of
  // whichever of its three named attacks it uses this round
  if (monster.type === 'Sanguinid') {
    const radDamage = Math.max(
      1,
      Math.round(monster.level * COMBAT.SANGUINID_RADIATION_PER_LEVEL) - Math.floor(eff.resistance / COMBAT.DEF_RES_DIVISOR),
    );
    char.hp = Math.max(0, char.hp - radDamage);
    messages.push(`The Sanguinid's radioactive flesh sears you even as it approaches. You suffer ${radDamage} radiation damage.`);
    if (char.hp <= 0) {
      out.ability = 'radiation';
      return { messages, monsterDamage: radDamage, playerDied: true, monsterDied: false };
    }
    ability = pickSanguinidAbility(rng);
  }

  // Handle make-naked
  if (ability === 'make-naked') {
    if (rng.float() < 0.02) {
      messages.push('The Wizard cackles and casts an embarrassing spell.');
      messages.push('');
      messages.push('YOU ARE COMPLETELY NAKED.');
      messages.push('');
      messages.push('The Wizard appears smugly overdressed.');
      addStatusEffect(char, { type: 'naked', value: 0, turns: 999 });
      // Still does physical attack too
      ability = undefined;
    } else {
      ability = rng.pick(['fireball', 'lightning-bolt']);
    }
  }
  out.ability = ability;

  // Handle teleport (Wizard)
  if (ability === 'teleport') {
    messages.push('The Wizard gestures and the dungeon disappears.');
    messages.push('');
    messages.push('YOU HAVE BEEN TELEPORTED.');
    playerTeleported = true;
    // Actual teleport destination chosen by game-engine
    return { messages, monsterDamage: 0, playerDied: false, monsterDied: false, playerTeleported };
  }

  // Handle the transformation: no saving throw, no matter how tough
  if (ability === 'ball-of-doo') {
    ballOfDooFired = true;
    const drained = char.hp;
    messages.push('Asmodeus raises one clawed hand and smiles.');
    messages.push('');
    messages.push('There is a loud POP and a puff of sulphurous smoke.');
    messages.push('');
    messages.push('YOU HAVE BEEN TURNED INTO A PILE OF LIZARD EXCREMENT.');
    messages.push('');
    messages.push('You are dead.');
    char.hp = 0;
    return { messages, monsterDamage: drained, playerDied: true, monsterDied: false, ballOfDooFired };
  }

  // Handle infernal healing
  if (ability === 'infernal-healing') {
    const base = calculateMonsterDamage(monster, char, rng, naked, 'infernal-healing');
    const heal = Math.round(base / 3);
    monster.hp = Math.min(monster.maxHp, monster.hp + heal);
    monsterHealed = heal;
    char.hp = Math.max(0, char.hp - base);
    messages.push(monsterAttackText(monster.type, base, 'infernal-healing'));
    messages.push(`Asmodeus heals ${heal} hit points from your life force!`);
    const playerDied = char.hp <= 0;
    return { messages, monsterDamage: base, playerDied, monsterDied: false, monsterHealed };
  }

  // Handle mummification (Asmodeus)
  if (ability === 'mummification') {
    const base = calculateMonsterDamage(monster, char, rng, naked, 'mummification');
    char.hp = Math.max(0, char.hp - base);
    addStatusEffect(char, { type: 'mummified', value: COMBAT.MUMMY_DAMAGE_PER_TURN, turns: 4 });
    addStatusEffect(char, { type: 'dexterity-reduced', value: COMBAT.MUMMY_DEX_REDUCTION, turns: 4 });
    messages.push(monsterAttackText(monster.type, base, 'mummification'));
    const playerDied = char.hp <= 0;
    return { messages, monsterDamage: base, playerDied, monsterDied: false };
  }

  // Handle intelligence drain (Cerebrovore)
  if (ability === 'intelligence-drain') {
    const dmg = calculateMonsterDamage(monster, char, rng, naked, 'psychic-blast');
    char.hp = Math.max(0, char.hp - dmg);
    addStatusEffect(char, { type: 'intelligence-reduced', value: 2, turns: 5 });
    messages.push(`The ${monster.type} invades your mind! You suffer ${dmg} psychic damage.`);
    messages.push('Your Intelligence is temporarily reduced!');
    const playerDied = char.hp <= 0;
    return { messages, monsterDamage: dmg, playerDied, monsterDied: false };
  }

  // Handle paralysis (Basilisk gaze, Gelatinous Cube engulf, Lich touch):
  // a paralyzed character loses their next rounds.
  if (ability === 'gaze-paralyze' || ability === 'engulf-paralyze' || ability === 'paralysis-touch' || ability === 'ghoul-claws') {
    const dmg = calculateMonsterDamage(monster, char, rng, naked);
    char.hp = Math.max(0, char.hp - dmg);
    if (ability === 'ghoul-claws') {
      messages.push(`The ${monster.type}'s filthy claws rake you, and a creeping numbness spreads from the wound.`);
      if (char.hp > dmg) maybeFleshRot(char, monster, rng, messages, GHOUL.ROT_CHANCE_CLAW);
    }
    if (rng.float() < COMBAT.PARALYSIS_CHANCE) {
      addStatusEffect(char, { type: 'paralyzed', value: 0, turns: 2 });
      const engulfed = ability === 'engulf-paralyze';
      holdCharacter(char, COMBAT.PARALYSIS_ROUNDS, engulfed ? 'engulfed' : 'paralyzed');
      messages.push(engulfed
        ? `The ${monster.type} engulfs you! You are trapped inside it, unable to move.`
        : `The ${monster.type} paralyzes you! You cannot move.`);
    }
    messages.push(`You suffer ${dmg} damage.`);
    const playerDied = char.hp <= 0;
    return { messages, monsterDamage: dmg, playerDied, monsterDied: false };
  }

  // Handle Sanguinid's great-strength attack — every successful hit draws blood
  if (ability === 'great-strength') {
    const dmg = calculateMonsterDamage(monster, char, rng, naked, ability);
    char.hp = Math.max(0, char.hp - dmg);
    messages.push(monsterAttackText(monster.type, dmg, ability));
    addStatusEffect(char, { type: 'bleeding', value: COMBAT.SANGUINID_BLEED_DAMAGE, turns: COMBAT.SANGUINID_BLEED_TURNS });
    messages.push('The wound is deep. You are bleeding!');
    const playerDied = char.hp <= 0;
    return { messages, monsterDamage: dmg, playerDied, monsterDied: false };
  }

  // Handle life-drain from a Wight, Spectre, or Vampire that's rolled high
  // enough (relative to its own natural range) to be a real threat — a
  // small chance of an actual level drain, mirroring Sanguinid's
  // blood-drain below. Lesser undead (Skeletons, Zombies) and other
  // life-drain-flavored attacks just deal damage, via the fallback at the
  // bottom of this function.
  if (
    ability === 'life-drain' &&
    (monster.type === 'Wight' || monster.type === 'Spectre' || monster.type === 'Vampire') &&
    monster.level >= monster.definition.maxLevel * COMBAT.LEVEL_DRAIN_MIN_LEVEL_FRACTION
  ) {
    const dmg = calculateMonsterDamage(monster, char, rng, naked, ability);
    char.hp = Math.max(0, char.hp - dmg);
    messages.push(monsterAttackText(monster.type, dmg, ability));

    if (char.hp > 0 && rng.float() < COMBAT.LEVEL_DRAIN_CHANCE) {
      if (char.level > 1) {
        const { newLevel } = applyLevelDrain(char);
        messages.push(`A deathly chill saps your vitality! YOU HAVE BEEN DRAINED. You are now Level ${newLevel}.`);
      } else {
        messages.push(`The ${monster.type} tries to drain your essence, but you have nothing left to give.`);
      }
    }

    const playerDied = char.hp <= 0;
    return { messages, monsterDamage: dmg, playerDied, monsterDied: false };
  }

  // Handle Sanguinid's blood-drain attack — bleeding plus a rare level drain
  if (ability === 'blood-drain') {
    const dmg = calculateMonsterDamage(monster, char, rng, naked, ability);
    char.hp = Math.max(0, char.hp - dmg);
    messages.push(monsterAttackText(monster.type, dmg, ability));
    addStatusEffect(char, { type: 'bleeding', value: COMBAT.SANGUINID_BLEED_DAMAGE, turns: COMBAT.SANGUINID_BLEED_TURNS });
    messages.push('The wound is deep. You are bleeding!');

    if (char.hp > 0 && rng.float() < COMBAT.SANGUINID_LEVEL_DRAIN_CHANCE) {
      if (char.level > 1) {
        const { newLevel } = applyLevelDrain(char);
        messages.push('A cold weakness spreads through you as the Sanguinid drains your very essence!');
        messages.push(`YOU HAVE BEEN DRAINED. You are now Level ${newLevel}.`);
      } else {
        messages.push('The Sanguinid tries to drain your essence, but you have nothing left to give.');
      }
    }

    const playerDied = char.hp <= 0;
    return { messages, monsterDamage: dmg, playerDied, monsterDied: false };
  }

  // Handle Sanguinid's flash-burn attack — its rarer, harder-hitting secondary attack
  if (ability === 'flash-burn') {
    const dmg = Math.round(calculateMonsterDamage(monster, char, rng, naked, ability) * COMBAT.SANGUINID_FLASH_BURN_MULT);
    char.hp = Math.max(0, char.hp - dmg);
    messages.push(monsterAttackText(monster.type, dmg, ability));
    addStatusEffect(char, { type: 'bleeding', value: COMBAT.SANGUINID_BLEED_DAMAGE, turns: COMBAT.SANGUINID_BLEED_TURNS });
    messages.push('The wound is deep. You are bleeding!');
    const playerDied = char.hp <= 0;
    return { messages, monsterDamage: dmg, playerDied, monsterDied: false };
  }

  // Handle terror/fear
  if (ability === 'terror' || ability === 'fear' || ability === 'fear-ray' || ability === 'darkness') {
    const dmg = calculateMonsterDamage(monster, char, rng, naked, ability);
    char.hp = Math.max(0, char.hp - dmg);
    if (rng.float() < 0.35) {
      addStatusEffect(char, { type: 'feared', value: 0, turns: 2 });
    }
    messages.push(monsterAttackText(monster.type, dmg, ability));
    const playerDied = char.hp <= 0;
    return { messages, monsterDamage: dmg, playerDied, monsterDied: false };
  }

  // Standard or special damaging ability
  const dmg = calculateMonsterDamage(monster, char, rng, naked, ability);
  char.hp = Math.max(0, char.hp - dmg);
  messages.push(monsterAttackText(monster.type, dmg, ability));

  // Poison on poison-breath/spore etc
  if (ability === 'filthy-bite' && char.hp > 0) maybeFleshRot(char, monster, rng, messages, GHOUL.ROT_CHANCE_BITE);
  if ((ability === 'poison-breath' || ability === 'spore-poison' || ability === 'slime-disease' || ability === 'filthy-bite') && rng.float() < 0.3) {
    addStatusEffect(char, { type: 'poison', value: 4, turns: 6 });
    messages.push('You have been poisoned!');
  }

  const playerDied = char.hp <= 0;
  return { messages, monsterDamage: dmg, playerDied, monsterDied: false, monsterHealed };
}

function calculateMonsterDamage(
  monster: Monster,
  char: Character,
  rng: RNG,
  naked: boolean,
  ability?: string,
): number {
  const eff = getEffectiveStats(char);
  const base = monster.level * monster.definition.baseAttackPerLevel;
  const rand = 0.7 + rng.float() * 0.6;

  const defense = COMBAT.PLAYER_BASE_DEFENSE
    + Math.floor(eff.constitution / COMBAT.DEF_CON_DIVISOR)
    + Math.floor(eff.dexterity   / COMBAT.DEF_DEX_DIVISOR)
    + Math.floor(eff.resistance  / COMBAT.DEF_RES_DIVISOR)
    + char.level;

  const defenseMultiplier = Math.max(0.2, 1 - defense / 80) * (naked ? (1 / COMBAT.NAKED_DEFENSE_MULT) : 1);
  const toughness = char.charClass === 'warrior' ? WARRIOR.DAMAGE_TAKEN_MULT : 1;
  // Armour turns aside part of a blow; against magic and breath, half as much. (Not when stripped bare.)
  const physical = !ability || abilityElement(ability) === 'physical';
  const armor = naked ? 1 : 1 - armorProtection(char) * (physical ? 1 : GEAR.MAGIC_SHARE);
  const withered = (monster.witherTurns ?? 0) > 0 ? RINGS.WITHER_DAMAGE : 1;   // the bloodstone ring
  return Math.max(1, Math.round(base * rand * defenseMultiplier * toughness * armor * withered));
}

/** Chance Asmodeus turns the character into a pile of lizard excrement this turn:
 * climbs as he's wounded. */
export function transformationChance(monster: Monster): number {
  const wounded = 1 - Math.max(0, monster.hp) / monster.maxHp;
  return COMBAT.BALL_OF_DOO_CHANCE + (COMBAT.BALL_OF_DOO_DESPERATE_CHANCE - COMBAT.BALL_OF_DOO_CHANCE) * wounded;
}

function pickAsmodeusAbility(monster: Monster, char: Character, rng: RNG): string {
  if (rng.float() < transformationChance(monster)) return 'ball-of-doo';

  const roll = rng.float();
  if (roll < 0.15) return 'fireball';
  if (roll < 0.28) return 'lightning-bolt';
  if (roll < 0.38) return 'mummification';
  if (roll < 0.50) return 'life-drain';
  if (roll < 0.60) return 'terror';
  if (roll < 0.72) return 'infernal-healing';
  return '';
}

function pickWizardAbility(rng: RNG): string {
  const roll = rng.float();
  if (roll < 0.20) return 'fireball';
  if (roll < 0.40) return 'lightning-bolt';
  if (roll < 0.55) return 'acid-bolt';
  if (roll < 0.70) return 'light-bolt';
  if (roll < 0.80) return 'teleport';
  if (roll < 0.82) return 'make-naked';
  return '';
}

function pickSanguinidAbility(rng: RNG): string {
  // flash-burn is the rare "secondary attack" (1 in 10); the rest splits
  // between great-strength (primary) and blood-drain (with its level-drain
  // chance) in roughly the original 60/40 ratio.
  const roll = rng.float();
  if (roll < COMBAT.SANGUINID_FLASH_BURN_CHANCE) return 'flash-burn';
  if (roll < COMBAT.SANGUINID_FLASH_BURN_CHANCE + 0.54) return 'great-strength';
  return 'blood-drain';
}

// ─── The Hollow Choir ─────────────────────────────────────────────────────────

const CHOIR_BREAK_TEXT: Record<string, string> = {
  dread: 'The dread mask cracks across its brow and drops away into the dark. One voice falls silent.',
  delight: 'The smiling mask splits from ear to ear and falls, still grinning. Its hunger goes with it.',
  grief: 'The grieving mask shatters. Its cry dies before it is born.',
};
const CHOIR_CUE: Record<ChoirPower, string> = {
  lament: 'The grieving mask opens its mouth. A pale light gathers inside.',
  unmaking: 'The expressionless mask turns slowly toward you. Its empty eyes settle on yours.',
  'false-joy': 'The smiling mask leans toward you, its grin widening. It is hungry.',
};

/** Masks break as the Choir weakens; a power still being gathered by a
 * broken mask is lost. Exported for the tests. */
export function shatterChoirMasks(monster: Monster, messages: string[]): void {
  const broken = monster.choirBroken ?? [];
  for (const [mask, share] of CHOIR.BREAKS) {
    if (broken.includes(mask as ChoirMask) || monster.hp > monster.maxHp * share) continue;
    broken.push(mask as ChoirMask);
    messages.push(CHOIR_BREAK_TEXT[mask]);
    if (monster.choirPrep && CHOIR.POWER_MASK[monster.choirPrep] === mask) {
      monster.choirPrep = undefined;
      messages.push('The light it was gathering gutters out.');
    }
    messages.push('The remaining masks crowd closer. Their murmuring grows louder.');
  }
  monster.choirBroken = broken;
}

/** d20 + (the attributes' average)/3 + level/5 against the Choir. */
function choirSave(char: Character, monster: Monster, rng: RNG, stats: ('wisdom' | 'resistance')[]): { ok: boolean; line: string } {
  const eff = getEffectiveStats(char);
  const bonus = Math.floor(stats.reduce((a, s) => a + eff[s], 0) / stats.length / 3) + Math.floor(char.level / 5);
  const die = rng.die(20), dc = CHOIR.SAVE_DC_BASE + Math.floor(monster.level / 3);
  return { ok: die + bonus >= dc, line: `(Saving roll: ${die} + ${bonus} vs ${dc})` };
}

/** The Hollow Choir's turn. A power prepared last turn lands now; otherwise
 * it may begin preparing one (a clear cue, no harm this turn), or a lesser
 * mask strikes. It never holds the character, so there is no losing turns. */
function hollowChoirAction(char: Character, monster: Monster, rng: RNG, messages: string[], naked: boolean, out: { ability?: string }): MonsterActionResult {
  const broken = monster.choirBroken ?? [];
  const alive = (m: ChoirMask) => !broken.includes(m);
  const fury = 1 + broken.length * CHOIR.FURY_PER_BROKEN;
  const blow = (mult = 1) => Math.max(1, Math.round(calculateMonsterDamage(monster, char, rng, naked) * fury * mult));
  const hurt = (dmg: number) => { char.hp = Math.max(0, char.hp - dmg); return char.hp <= 0; };

  // A power prepared last turn lands now.
  const prep = monster.choirPrep;
  if (prep) {
    monster.choirPrep = undefined;
    out.ability = prep;
    if (prep === 'lament') {
      const save = choirSave(char, monster, rng, ['wisdom']);
      const dmg = blow(CHOIR.LAMENT_MULT * (save.ok ? 0.5 : 1));
      messages.push('The Lament pours out of the grieving mask: the sound of every loss at once.',
        save.ok ? `You steel your heart against it. You suffer ${dmg} damage. ${save.line}` : `It fills you. You suffer ${dmg} damage. ${save.line}`);
      return { messages, monsterDamage: dmg, playerDied: hurt(dmg), monsterDied: false };
    }
    if (prep === 'unmaking') {
      const save = choirSave(char, monster, rng, ['wisdom', 'resistance']);
      if (save.ok) {
        messages.push(`The expressionless mask stares through you, but you hold yourself together. ${save.line}`);
      } else {
        addStatusEffect(char, { type: 'dexterity-reduced', value: CHOIR.UNMAKE_DEX, turns: CHOIR.UNMAKE_TURNS });
        messages.push(`The expressionless mask stares through you, and something in you comes undone. ${save.line}`,
          `Your guard falters. (-${CHOIR.UNMAKE_DEX} Dexterity for ${CHOIR.UNMAKE_TURNS} turns)`);
      }
      return { messages, monsterDamage: 0, playerDied: false, monsterDied: false };
    }
    const dmg = blow(CHOIR.JOY_MULT);
    const heal = Math.min(monster.maxHp - monster.hp, Math.round(dmg * CHOIR.JOY_HEAL_SHARE));
    monster.hp += heal;
    messages.push(`The smiling mask drinks from you. You suffer ${dmg} damage, and the Choir recovers ${heal}.`);
    return { messages, monsterDamage: dmg, playerDied: hurt(dmg), monsterDied: false, monsterHealed: heal };
  }

  // Perhaps begin preparing a power: the masks align, and the cue says which.
  const ready: ChoirPower[] = [];
  if (alive('grief')) ready.push('lament');
  if (alive('blank') && !char.statusEffects.some(e => e.type === 'dexterity-reduced')) ready.push('unmaking');
  if (alive('delight') && monster.hp < monster.maxHp * 0.95) ready.push('false-joy');
  if (ready.length && rng.float() < CHOIR.PREPARE_CHANCE + broken.length * CHOIR.PREPARE_PER_BROKEN) {
    const power = rng.pick(ready);
    monster.choirPrep = power;
    out.ability = 'choir-prepare';
    messages.push('The masks drift into line.', CHOIR_CUE[power]);
    return { messages, monsterDamage: 0, playerDied: false, monsterDied: false };
  }

  // Otherwise a lesser mask strikes: the raging mask, or the dread mask's whisper.
  if (alive('dread') && rng.float() < 0.3) {
    const dmg = blow(0.8);
    out.ability = 'mask-whisper';
    messages.push(`The dread mask drifts close and whispers your death to you. You suffer ${dmg} damage.`);
    return { messages, monsterDamage: dmg, playerDied: hurt(dmg), monsterDied: false };
  }
  const dmg = blow();
  out.ability = 'rage-strike';
  messages.push(`The raging mask hurtles at you and strikes. You suffer ${dmg} damage.`);
  return { messages, monsterDamage: dmg, playerDied: hurt(dmg), monsterDied: false };
}

/** Holds the character for some rounds (paralysis, fear, coils...). */
function holdCharacter(char: Character, rounds: number, why: HeldCondition): void {
  char.heldRounds = Math.max(char.heldRounds ?? 0, rounds);
  char.heldBy = why;
}

const HELD_TEXT: Record<HeldCondition, string> = {
  feared:     'You cower in terror and cannot act!',
  dazed:      'You are still dazed and cannot act!',
  paralyzed:  'You are paralyzed and cannot move!',
  asleep:     'You are fast asleep!',
  charmed:    'You stand entranced, gazing adoringly at your foe, and do nothing.',
  webbed:     'You strain against what binds you, but cannot break free!',
  engulfed:   'You struggle inside the quivering jelly but cannot break free!',
  constricted: 'You strain against the coils, but they only tighten!',
  choked:     'You claw at the smoky coil around your throat, but cannot break its grip!',
  frozen:     'You are frozen solid in a shell of ice and cannot move!',
  gilded:     'Your gilded limbs are heavy as ingots and will not move!',
  petrifying: 'Your stone legs will not obey you!',
  latched:    'You tear at the slick body fastened to you, but it will not let go!',
};

/** A round the character loses to being held: they do nothing and the
 * monster acts. */
export function playerHeld(char: Character, monster: Monster, rng: RNG): CombatRoundResult {
  // Coils can be fought: Strength gives a chance to wriggle free at once.
  if (char.heldBy === 'constricted' || char.heldBy === 'choked' || char.heldBy === 'webbed' || char.heldBy === 'latched') {
    const chance = Math.min(TITANOBOA.BREAK_FREE_MAX, getEffectiveStats(char).strength * TITANOBOA.BREAK_FREE_PER_STRENGTH);
    if (rng.float() < chance) {
      const freed = {
        latched: 'You get your fingers under its rim and wrench the leech off you!',
        webbed: 'With a desperate heave you tear through the web and pull yourself free!',
      }[char.heldBy as string] ?? 'With a desperate heave you force the coils apart and tear yourself free!';
      char.heldRounds = 0;
      char.heldBy = undefined;
      const messages = [freed];
      const res = monsterAction(char, monster, rng, messages);
      return { ...res, playerDamage: 0, monsterDied: false };
    }
  }
  const messages = [HELD_TEXT[char.heldBy ?? 'paralyzed']];
  char.heldRounds = Math.max(0, (char.heldRounds ?? 1) - 1);
  if (char.heldRounds === 0) char.heldBy = undefined;
  const res = monsterAction(char, monster, rng, messages);
  return { ...res, playerDamage: 0, monsterDied: false };
}

// ─── XP calculation ──────────────────────────────────────────────────────────

export function calculateXPReward(
  charLevel: number,
  monsterLevel: number,
  isUnique: boolean,
  naturalTier: number = 1,
): number {
  const base = monsterLevel * LEVELING.XP_PER_MONSTER_LEVEL;
  const diff = monsterLevel - charLevel;
  let mult = 1.0;

  if (diff > 0) {
    // Ramps up rather than scaling flat with the gap — see config.ts.
    mult += diff * LEVELING.XP_LEVEL_DIFF_BONUS_LINEAR
      + diff * diff * LEVELING.XP_LEVEL_DIFF_BONUS_QUADRATIC;
  }
  if (diff < 0) mult = Math.max(LEVELING.XP_MIN_FRACTION, mult + diff * LEVELING.XP_LEVEL_DIFF_PENALTY);

  // Inherent danger of the monster's kind, independent of the level it rolled.
  mult *= 1 + (naturalTier - 1) * LEVELING.XP_TIER_BONUS_PER_TIER;

  if (isUnique) mult *= LEVELING.UNIQUE_MONSTER_XP_MULT;

  return Math.max(1, Math.round(base * mult));
}

// ─── The Stilled Hour ────────────────────────────────────────────────────────

/** Things with no breath to lose: they don't suffocate in stopped time. */
const NO_BREATH = ['Mold', 'Slime Mold', 'Gelatinous Cube', 'Elder Oblex', 'Iron Golem', 'Gargoyle', 'Banshee', 'Spectre',
  'Nightwalker', 'Hollow Choir', 'Djinn', 'Asmodeus', 'Doppelganger'];
export function breathes(monster: Monster): boolean {
  return !monster.definition.isUndead && !NO_BREATH.includes(monster.type);
}

/** Cast: time stops for the monster, d5+3 turns (Asmodeus, half). It doesn't answer this turn. */
export function playerStilledHour(char: Character, monster: Monster, rng: RNG): CombatRoundResult {
  const S = SPELLS.STILLED_HOUR;
  const rolled = rng.int(S.TURNS_MIN, S.TURNS_MAX);
  const messages = ['You speak the words of The Stilled Hour, and the world\u2019s clock stops for everything but you.'];
  // Asmodeus is older than the clocks: he may throw it off, and holds still half as long if not.
  if (monster.type === 'Asmodeus' && rng.float() < S.ASMODEUS_RESIST_CHANCE) {
    messages.push('Everything stops but him. Asmodeus smiles, and with one slow word starts the clock again. "Time? In MY Hells?"');
    addStatusEffect(char, { type: 'strength-reduced', value: S.AGE_STATS, turns: S.AGE_STEPS });
    addStatusEffect(char, { type: 'dexterity-reduced', value: S.AGE_STATS, turns: S.AGE_STEPS });
    messages.push(`It cost you all the same: grey threads your hair. (\u2212${S.AGE_STATS} Strength and Dexterity for a long while)`);
    const res = monsterAction(char, monster, rng, messages);
    return { ...res, playerDamage: 0, monsterDied: false };
  }
  const turns = monster.type === 'Asmodeus' ? Math.max(2, Math.floor(rolled / 2)) : rolled;
  monster.frozenTurns = turns;
  monster.frozenElapsed = 0;
  messages.push(`The ${monster.type} hangs motionless, caught between one heartbeat and the next. (d5+3: ${rolled} turns${turns !== rolled ? `; he fights it, and is held only ${turns}` : ''})`);
  if (!breathes(monster)) messages.push(`(It has no breath to lose: the stillness will not choke it.)`);
  // The price: time takes it out of you.
  addStatusEffect(char, { type: 'strength-reduced', value: S.AGE_STATS, turns: S.AGE_STEPS });
  addStatusEffect(char, { type: 'dexterity-reduced', value: S.AGE_STATS, turns: S.AGE_STEPS });
  messages.push(`Time takes its toll: grey threads your hair, and your joints ache like an old man\u2019s. (\u2212${S.AGE_STATS} Strength and Dexterity for a long while)`);
  return { messages, playerDamage: 0, monsterDamage: 0, playerDied: false, monsterDied: false };
}

/** A frozen monster's turn: nothing, and after a while, no breath either. */
function stilledTurn(monster: Monster, messages: string[]): MonsterActionResult {
  const S = SPELLS.STILLED_HOUR;
  monster.frozenTurns!--;
  monster.frozenElapsed = (monster.frozenElapsed ?? 0) + 1;
  const n = monster.frozenElapsed;
  if (breathes(monster) && n > S.BREATH_TURNS) {
    const dmg = Math.max(1, Math.round(monster.maxHp * S.SUFFOCATE_STEP * (n - S.BREATH_TURNS)));
    monster.hp = Math.max(0, monster.hp - dmg);
    messages.push(`Frozen mid-breath, the ${monster.type} cannot breathe. Its eyes bulge; its colour darkens. (${dmg} damage)`);
  } else {
    messages.push(`The ${monster.type} is still as a painting. Not a hair of it moves.`);
  }
  if (monster.frozenTurns === 0 && monster.hp > 0) {
    messages.push(`Time lurches back into motion. The ${monster.type} gasps and staggers.`);
  }
  return { messages, monsterDamage: 0, playerDied: false, monsterDied: monster.hp <= 0 };
}

// ─── The Borak ───────────────────────────────────────────────────────────────

/** How the monster takes a beam of light: >1 it burns, <1 it shrugs some off. */
export function lightFactor(monster: Monster): number {
  return BORAK.LIGHT[monster.type] ?? (monster.definition.isUndead ? BORAK.UNDEAD : 1);
}

/** The Borak fires: the monster's level × d6+4, by how it takes light. Once a fight. */
export function playerBorak(char: Character, monster: Monster, rng: RNG): CombatRoundResult {
  monster.borakUsed = true;
  sear(monster);
  const roll = rng.int(BORAK.PER_LEVEL_MIN, BORAK.PER_LEVEL_MAX);
  const f = lightFactor(monster);
  const dmg = Math.max(1, Math.round(monster.level * roll * f));
  monster.hp = Math.max(0, monster.hp - dmg);
  const messages = [
    'You raise your hand. The star in The Borak blazes, and a beam of white-hot light lances out!',
    f >= 1.5 ? `The ${monster.type} SHRIEKS as the light burns into it: it was never meant to bear the light! (${dmg} damage)`
      : f > 1 ? `The beam sears deep into the ${monster.type}. (${dmg} damage)`
      : f < 0.75 ? `The beam strikes the ${monster.type}, but much of the light glances away or passes through. (${dmg} damage)`
      : f < 1 ? `The ${monster.type} withstands some of the light. (${dmg} damage)`
      : `The beam burns a smoking line across the ${monster.type}! (${dmg} damage)`,
  ];
  if (monster.hp <= 0) return { messages: [...messages, `The ${monster.type} collapses, smoking.`], playerDamage: dmg, monsterDamage: 0, playerDied: false, monsterDied: true };
  const res = monsterAction(char, monster, rng, messages);
  return { ...res, playerDamage: dmg, monsterDied: monster.hp <= 0 };
}

/** The bloodstone ring: the monster withers for a few turns, its blows
 * softer and its guard weaker. Once a fight. */
export function playerWitherRing(char: Character, monster: Monster, rng: RNG): CombatRoundResult {
  monster.witherUsed = true;
  monster.witherTurns = rng.int(RINGS.WITHER_TURNS_MIN, RINGS.WITHER_TURNS_MAX) + 1;   // (+1: it starts wearing off on its own turn)
  const messages = [`You close your fist on the bloodstone ring. Red threads run through its green, and the ${monster.type} WITHERS:`,
    `its strength drains out of it, its guard sags. (${monster.witherTurns - 1} turns: its blows ${Math.round((1 - RINGS.WITHER_DAMAGE) * 100)}% softer, and it's easier to hit)`];
  const res = monsterAction(char, monster, rng, messages);
  return { ...res, playerDamage: 0, monsterDied: monster.hp <= 0 };
}
