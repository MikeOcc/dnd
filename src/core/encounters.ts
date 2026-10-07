import type { Character, Monster, StatusEffect, GemType, ChestTrapType, Amulet, AmuletStat, Weapon, Armor, WeaponKind, ArmorKind } from './types.js';
import type { RNG } from './random.js';
import { ENCOUNTER, FOUNTAIN, MAGIC_BOOK, DEATH, TREASURE, GEMS, CHEST_TRAPS, TRAPS, FIRST_LEVEL, AMULETS, GEAR, HOARD } from './config.js';
import { addStatusEffect, xpForLevel, applyLevelDrain, amuletName, bestWeapon, wornArmor, gearName, armorProtection } from './character.js';

// ─── Encounter pacing ────────────────────────────────────────────────────────

export interface EncounterPace {
  movesSinceCombat: number;
  graceMoves: number;
  atLevelEntry: boolean;
  atDeathRespawn: boolean;
}

export function initialPace(rng: RNG): EncounterPace {
  return {
    movesSinceCombat: 0,
    graceMoves: rng.int(ENCOUNTER.GRACE_MOVES_MIN, ENCOUNTER.GRACE_MOVES_MAX),
    atLevelEntry: true,
    atDeathRespawn: false,
  };
}

export function shouldTriggerRandomEncounter(pace: EncounterPace, rng: RNG): boolean {
  if (pace.atLevelEntry) return false;
  if (pace.atDeathRespawn) return false;
  if (pace.movesSinceCombat < pace.graceMoves) return false;

  const stepsOver = pace.movesSinceCombat - pace.graceMoves;
  const chance = Math.min(
    ENCOUNTER.MAX_CHANCE,
    ENCOUNTER.BASE_CHANCE + stepsOver * ENCOUNTER.CHANCE_INCREMENT,
  );
  return rng.float() < chance;
}

export function resetPaceAfterCombat(pace: EncounterPace, rng: RNG): void {
  pace.movesSinceCombat = 0;
  pace.graceMoves = rng.int(ENCOUNTER.GRACE_MOVES_MIN, ENCOUNTER.GRACE_MOVES_MAX);
  pace.atLevelEntry = false;
  pace.atDeathRespawn = false;
}

export function incrementPace(pace: EncounterPace): void {
  pace.movesSinceCombat++;
  pace.atLevelEntry = false;
  pace.atDeathRespawn = false;
}

// ─── Death ───────────────────────────────────────────────────────────────────

export interface DeathResult {
  messages: string[];
  goldLost: number;
  xpLost: number;
}

/** The toll of dying: a share of gold and experience (never enough XP to lose
 * a level), full health, a clean slate of effects, and waking at the entrance. */
export function applyDeath(char: Character, entranceX: number, entranceY: number): DeathResult {
  const goldLost = Math.floor(char.gold * DEATH.GOLD_LOSS_FRACTION);
  char.gold = Math.max(0, char.gold - goldLost);
  const xpFloor = Math.min(char.xp, xpForLevel(char.level));
  const xpLost = Math.min(Math.floor(char.xp * DEATH.XP_LOSS_FRACTION), char.xp - xpFloor);
  char.xp -= xpLost;
  char.hp = char.maxHp;
  char.x = entranceX;
  char.y = entranceY;
  char.facing = 'N';
  char.deathCount++;
  char.statusEffects = [];

  return {
    messages: [
      'YOU HAVE DIED.',
      '',
      `You awaken at the entrance to Level ${char.dungeonLevel}.`,
      goldLost > 0
        ? `Some of your gold is missing. (Lost ${goldLost} gold)`
        : 'You clutch your remaining gold tightly.',
      xpLost > 0
        ? `Death has dulled your hard-won lessons. (Lost ${xpLost} experience)`
        : 'Your hard-won lessons stay with you.',
    ],
    goldLost,
    xpLost,
  };
}

/** Killed by Asmodeus: you wake at the entrance to level 7, a level poorer
 * (drained, not just experience) and 5% lighter in gold. */
export function applyAsmodeusDeath(char: Character, entranceX: number, entranceY: number): DeathResult {
  const goldLost = Math.floor(char.gold * DEATH.ASMODEUS_GOLD_LOSS_FRACTION);
  char.gold = Math.max(0, char.gold - goldLost);
  const before = char.level;
  const { newLevel } = applyLevelDrain(char);
  char.hp = char.maxHp;
  char.x = entranceX;
  char.y = entranceY;
  char.facing = 'N';
  char.deathCount++;
  char.statusEffects = [];
  return {
    messages: [
      'YOU HAVE DIED.',
      '',
      'Asmodeus is not done with you. He flings what is left of you up out of his hall, into the level above.',
      newLevel < before ? `Something was taken from you in the dark. YOU HAVE BEEN DRAINED. You are now Level ${newLevel}.` : 'You have nothing more he can take.',
      goldLost > 0 ? `Some of your gold is missing. (Lost ${goldLost} gold)` : 'You clutch your remaining gold tightly.',
    ],
    goldLost,
    xpLost: 0,
  };
}

// ─── Chest ───────────────────────────────────────────────────────────────────

export interface ChestResult {
  messages: string[];
  goldGained?: number;
  hpGained?: number;
  xpGained?: number;
  statChanged?: { stat: string; delta: number };
  triggerMonster?: boolean;
  gemGained?: GemType;
}

const GEM_TYPES: GemType[] = ['ruby', 'sapphire', 'diamond', 'opal'];
const GEM_NAMES: Record<GemType, string> = {
  ruby: 'ruby', sapphire: 'sapphire', diamond: 'diamond', opal: 'opal', emerald: 'emerald', moonstone: 'moonstone',
};

function findGem(char: Character, type: GemType): ChestResult {
  char.inventory.gems[type]++;
  return {
    messages: [
      `A single flawless ${GEM_NAMES[type]} glints among the debris! Worth ${GEMS.VALUES[type]} gold.`,
      `(${char.inventory.gems[type]} total)`,
    ],
    gemGained: type,
  };
}

/** A weapon or armour the character can use, at a plus suited to the
 * depth, added to their pack. Returns the lines describing it, or null if
 * their pack has no room for it. Used by chests and fallen monsters. */
export function rollGear(char: Character, rng: RNG, where: 'chest' | 'monster' | 'hoard', forceBonus?: number): string[] | null {
  const wizard = char.charClass !== 'warrior';
  const isWeapon = rng.float() < 0.55;
  const kinds = isWeapon
    ? (Object.keys(GEAR.WEAPONS) as WeaponKind[]).filter(k => !wizard || GEAR.WEAPONS[k].wizard)
    : (Object.keys(GEAR.ARMOR) as ArmorKind[]).filter(k => !wizard || GEAR.ARMOR[k].wizard);
  const carried = isWeapon ? char.inventory.weapons?.length ?? 0 : char.inventory.armor?.length ?? 0;
  if (carried >= (isWeapon ? GEAR.MAX_WEAPONS : GEAR.MAX_ARMOR)) return null;
  const odds = [...GEAR.PLUS_ODDS].reverse().find(([from]) => char.dungeonLevel >= from)![1];
  let pick = rng.float() * odds.reduce((a, b) => a + b, 0), bonus = 0;
  for (let i = 0; i < odds.length; i++) { if (pick < odds[i]) { bonus = i; break; } pick -= odds[i]; }
  if (forceBonus !== undefined) bonus = forceBonus;
  const kind = rng.pick(kinds as string[]);
  const base = rng.pick([...GEAR.NAMES[kind]]);
  const name = bonus > 0 ? `${rng.pick([...GEAR.MAKERS[bonus]])} ${base}` : base;
  const item = { kind, bonus, name: name[0].toUpperCase() + name.slice(1) };
  const lines = [where !== 'monster' ? `Inside lies ${bonus ? 'an enchanted' : 'a'} ${base}: the ${gearName(item as Weapon)}.` : `Among its remains you find ${bonus ? 'an enchanted' : 'a'} ${base}: the ${gearName(item as Weapon)}.`];
  if (isWeapon) {
    char.inventory.weapons = [...(char.inventory.weapons ?? []), item as Weapon];
    lines.push(bestWeapon(char) === item ? 'It is the best weapon you carry: you will fight with it now.' : 'You already carry a better weapon. You keep it anyway.');
    if (bonus === 3) lines.push('Its edge hums faintly. A blade like this could wound even a Rakshasa.');
  } else {
    char.inventory.armor = [...(char.inventory.armor ?? []), item as Armor];
    const worn = wornArmor(char);
    lines.push(worn.body === item || worn.shield === item
      ? `You put it on. (Your armour now turns aside ${Math.round(armorProtection(char) * 100)}% of a blow.)`
      : 'You already wear better. You keep it anyway.');
  }
  return lines;
}

export function resolveChest(char: Character, rng: RNG): ChestResult {
  // The first level stocks extra potions for new adventurers.
  if (char.dungeonLevel === 1 && rng.float() < FIRST_LEVEL.CHEST_EXTRA_POTION_CHANCE) {
    const count = rng.int(1, 3);
    char.inventory.potions += count;
    return { messages: [
      `You find ${count === 1 ? 'a healing potion' : `${count} healing potions`}!`,
      `Added to your pack. (${char.inventory.potions} total)`,
    ]};
  }

  const roll = rng.float();
  const canHold = (t: GemType) => char.inventory.gems[t] < (GEMS.CARRY_CAP[t] ?? Infinity);

  // Opals are semi-common, unless the character already has all they can carry.
  if (roll < GEMS.OPAL_CHEST_CHANCE && canHold('opal')) return findGem(char, 'opal');

  // Now and then, a weapon or a piece of armour.
  const gearFrom = GEMS.OPAL_CHEST_CHANCE + AMULETS.CHEST_CHANCE;
  if (roll >= gearFrom && roll < gearFrom + GEAR.CHEST_CHANCE) {
    const found = rollGear(char, rng, 'chest');
    if (found) return { messages: found };
  }

  // Now and then, a magic amulet (unless the pack already holds plenty).
  if (roll >= GEMS.OPAL_CHEST_CHANCE && roll < GEMS.OPAL_CHEST_CHANCE + AMULETS.CHEST_CHANCE
      && (char.inventory.amulets?.length ?? 0) < AMULETS.MAX_CARRIED) {
    const stats: AmuletStat[] = ['strength', 'intelligence', 'dexterity', 'constitution', 'wisdom'];
    const amulet: Amulet = {
      stat: rng.pick(stats),
      bonus: rng.int(AMULETS.BONUS_MIN, AMULETS.BONUS_MAX),
      cursed: rng.float() < AMULETS.CURSE_CHANCE,
      look: rng.pick([...AMULETS.LOOKS]),
    };
    char.inventory.amulets = [...(char.inventory.amulets ?? []), amulet];
    return { messages: [
      `Coiled at the bottom of the chest lies a ${amuletName(amulet, false)}.`,
      'Its power is a mystery until you wear it. (A: Amulets)',
    ] };
  }

  if (roll < 0.352) {
    const gold = rng.int(TREASURE.GOLD_MIN, TREASURE.GOLD_MAX) * char.dungeonLevel
      + rng.int(0, char.level) * TREASURE.GOLD_CHAR_LEVEL_MULT
      + rng.int(TREASURE.GOLD_BONUS_MIN, TREASURE.GOLD_BONUS_MAX);
    char.gold += gold;
    return { messages: [`You find ${gold} gold coins!`], goldGained: gold };
  }

  if (roll < 0.440) {
    const value = rng.int(TREASURE.GEM_MIN, TREASURE.GEM_MAX) * char.dungeonLevel
      + rng.int(0, char.level) * TREASURE.GEM_CHAR_LEVEL_MULT;
    char.gold += value;
    return { messages: [`A pouch of glittering gemstones! Worth ${value} gold.`], goldGained: value };
  }

  if (roll < 0.637) {
    const count = rng.int(1, 4);
    char.inventory.potions += count;
    return { messages: [
      `You find ${count === 1 ? 'a healing potion' : `${count} healing potions`}!`,
      `Added to your pack. (${char.inventory.potions} total)`,
    ]};
  }

  if (roll < 0.725) {
    // Emeralds are rarer, and turn up more the deeper you go.
    // Opals and emeralds a character can't carry more of are never found.
    const emeraldShare = Math.min(0.4, GEMS.EMERALD_FIND_BASE + GEMS.EMERALD_FIND_PER_LEVEL * char.dungeonLevel);
    const pool = GEM_TYPES.filter(canHold).flatMap(t => Array<GemType>(t === 'opal' ? GEMS.OPAL_GEM_WEIGHT : 1).fill(t));
    const type: GemType = rng.float() < GEMS.MOONSTONE_FIND_SHARE ? 'moonstone'
      : canHold('emerald') && rng.float() < emeraldShare ? 'emerald' : rng.pick(pool);
    return findGem(char, type);
  }

  if (roll < 0.835) {
    const xp = rng.int(20, 60) * char.level;
    char.xp += xp;
    return { messages: [`A glowing crystal. You gain ${xp} experience.`], xpGained: xp };
  }

  if (roll < 0.879) {
    const stats = ['strength', 'constitution', 'intelligence', 'wisdom', 'dexterity', 'charisma', 'resistance'] as const;
    const stat = rng.pick([...stats]);
    (char[stat] as number) += 1;
    return {
      messages: [`A magical scroll crumbles to dust. Your ${stat} increases!`],
      statChanged: { stat, delta: 1 },
    };
  }

  if (roll < 0.923) {
    return { messages: ['The chest is empty. Disappointing.'] };
  }

  // Monster
  return {
    messages: ['Something shifts inside the chest...'],
    triggerMonster: true,
  };
}

// ─── Magic Book ──────────────────────────────────────────────────────────────
//
// Books are picked up when found (see the 'book' dungeon content / the
// 'take-book' interaction in game-engine.ts) and read later, on demand, via
// useBook() — a deliberate inventory action like potions or gems, not a
// gamble resolved on the spot. Every effect here is beneficial; there's no
// "harmful" roll the way the old discover-and-resolve version had, since
// the player is choosing when to read rather than stumbling into it.

export type BookEffect = 'attribute' | 'healing' | 'invulnerability' | 'map-reveal' | 'experience' | 'cleanse';

const BOOK_EFFECTS: BookEffect[] = ['attribute', 'healing', 'invulnerability', 'map-reveal', 'experience', 'cleanse'];

// Negative afflictions a cleanse removes. 'resistance-improved' is a buff,
// not an affliction, and is left alone; anaphylaxis has no cure; and flesh
// rot can be cleansed only until it has gone too far.
const NEGATIVE_STATUS_TYPES: StatusEffect['type'][] = [
  'poison', 'bleeding', 'naked', 'mummified', 'paralyzed', 'feared',
  'intelligence-reduced', 'dexterity-reduced', 'strength-reduced', 'flesh-rot',
  'corroded', 'fiend-venom', 'lycanthropy',
];
const cleansable = (e: StatusEffect) => NEGATIVE_STATUS_TYPES.includes(e.type) && e.doom === undefined;

/** A tome's effect, by weight: attribute boosts most often, and cleansing
 * only when there's something to cleanse. */
function pickBookEffect(char: Character, rng: RNG): BookEffect {
  const needsCleanse = char.statusEffects.some(cleansable);
  const options = BOOK_EFFECTS.filter(e => e !== 'cleanse' || needsCleanse);
  const weight = (e: BookEffect) => MAGIC_BOOK.EFFECT_WEIGHTS[e] ?? 1;
  let roll = rng.float() * options.reduce((a, e) => a + weight(e), 0);
  return options.find(e => (roll -= weight(e)) < 0) ?? options[0];
}

export interface ReadBookResult {
  messages: string[];
  effect: BookEffect;
  statChanged?: { stat: string; delta: number };
  hpGained?: number;
  xpGained?: number;
  invulnerableRounds?: number;
  mapRevealed?: boolean;
  statusesCleansed?: number;
}

export function readBook(char: Character, rng: RNG): ReadBookResult {
  const effect = pickBookEffect(char, rng);

  switch (effect) {
    case 'attribute': {
      const stats = ['strength', 'constitution', 'intelligence', 'wisdom', 'dexterity', 'charisma', 'resistance'] as const;
      const stat = rng.pick([...stats]);
      (char[stat] as number) += 1;
      return {
        effect,
        messages: ['The words burn themselves into your mind.', '', `Your ${stat} increases!`],
        statChanged: { stat, delta: 1 },
      };
    }

    case 'healing': {
      const heal = Math.round(char.maxHp * MAGIC_BOOK.HEAL_FRACTION);
      const actual = Math.min(heal, char.maxHp - char.hp);
      char.hp = Math.min(char.hp + heal, char.maxHp);
      return {
        effect,
        messages: ['A warm light radiates from the pages.', '', `You feel restored. (+${actual} HP)`],
        hpGained: actual,
      };
    }

    case 'invulnerability': {
      char.invulnerableTurns = (char.invulnerableTurns ?? 0) + MAGIC_BOOK.INVULNERABLE_ROUNDS;
      return {
        effect,
        messages: [
          'A shimmering ward wraps around you as you read the final line.',
          '',
          `You are invulnerable to harm for ${MAGIC_BOOK.INVULNERABLE_ROUNDS} rounds of combat.`,
        ],
        invulnerableRounds: MAGIC_BOOK.INVULNERABLE_ROUNDS,
      };
    }

    case 'map-reveal':
      // The actual reveal (marking every cell visited) needs the dungeon
      // grid, which this function doesn't have access to — the caller
      // (game-engine.ts's useBook) does that when it sees this flag.
      return {
        effect,
        messages: ['The tome contains detailed maps of this level.', '', 'The full map unfolds in your mind.'],
        mapRevealed: true,
      };

    case 'experience': {
      const xp = rng.int(MAGIC_BOOK.XP_MIN_PER_LEVEL, MAGIC_BOOK.XP_MAX_PER_LEVEL) * char.level;
      char.xp += xp;
      return {
        effect,
        messages: ['The tome vibrates and then crumbles to dust.', '', `You gain ${xp} experience from the ancient knowledge.`],
        xpGained: xp,
      };
    }

    case 'cleanse': {
      const before = char.statusEffects.length;
      char.statusEffects = char.statusEffects.filter(e => !cleansable(e));
      const removed = before - char.statusEffects.length;
      return {
        effect,
        messages: ['A cleansing light washes over you.', '', 'Your afflictions are lifted.'],
        statusesCleansed: removed,
      };
    }
  }
}

// ─── Altar ───────────────────────────────────────────────────────────────────

export interface AltarResult {
  messages: string[];
  hpGained?: number;
  statChanged?: { stat: string; delta: number };
  xpGained?: number;
  statusRemoved?: string;
  resImproved?: boolean;
}

// Rounds of combat a full-health altar blessing wards you for.
const ALTAR_WARD_ROUNDS = 2;

export function resolveAltar(char: Character, rng: RNG): AltarResult {
  // Holy fire burns out a ghoul's rot (if it hasn't gone too far) and a
  // werewolf's curse, before anything else.
  const lead: string[] = [];
  const rot = char.statusEffects.find(e => e.type === 'flesh-rot');
  if (rot && rot.doom === undefined) {
    char.statusEffects = char.statusEffects.filter(e => e !== rot);
    lead.push(`White fire races over your ${rot.part ?? 'wound'}, and the rot burns away to clean, pink flesh.`);
  }
  if (char.statusEffects.some(e => e.type === 'lycanthropy')) {
    char.statusEffects = char.statusEffects.filter(e => e.type !== 'lycanthropy');
    lead.push('The beast in your blood howls once, and is gone. The curse of the wolf is lifted.');
  }
  const rest = resolveAltarBlessing(char, rng);
  return lead.length ? { ...rest, messages: [...lead, '', ...rest.messages] } : rest;
}

function resolveAltarBlessing(char: Character, rng: RNG): AltarResult {
  const wisdomBonus = Math.floor(char.wisdom / 5);
  const roll = rng.float() - wisdomBonus * 0.02;
  const healBand = char.dungeonLevel === 1 ? FIRST_LEVEL.ALTAR_HEAL_CHANCE : 0.30;

  if (roll < healBand) {
    // Nothing to heal: the blessing becomes a ward against the next blows instead.
    if (char.hp >= char.maxHp) {
      char.invulnerableTurns = (char.invulnerableTurns ?? 0) + ALTAR_WARD_ROUNDS;
      return {
        messages: [
          'A pale light descends, but finds no wounds to mend.',
          '',
          `It settles over you as a holy ward. The next ${ALTAR_WARD_ROUNDS} blows against you in combat will be turned aside.`,
        ],
      };
    }
    const heal = Math.round(char.maxHp * 0.4) + rng.int(5, 20);
    const actual = Math.min(heal, char.maxHp - char.hp);
    char.hp = Math.min(char.hp + heal, char.maxHp);
    return {
      messages: ['A pale light descends.', '', `The altar heals you. (+${actual} HP)`],
      hpGained: actual,
    };
  }

  if (roll < 0.45) {
    const stats = ['strength', 'constitution', 'dexterity', 'wisdom', 'resistance'] as const;
    const stat = rng.pick([...stats]);
    (char[stat] as number) += 1;
    return {
      messages: ['The altar glows warmly.', '', `Your ${stat} is restored and improved.`],
      statChanged: { stat, delta: 1 },
    };
  }

  if (roll < 0.58) {
    const xp = rng.int(30, 100) * char.level;
    char.xp += xp;
    return {
      messages: ['A divine presence fills the chamber briefly.', '', `You gain ${xp} experience.`],
      xpGained: xp,
    };
  }

  if (roll < 0.68) {
    // Remove poison
    const hadPoison = char.statusEffects.some(e => e.type === 'poison');
    char.statusEffects = char.statusEffects.filter(e => e.type !== 'poison');
    return {
      messages: hadPoison
        ? ['The altar pulses. The poison leaves your blood.']
        : ['The altar hums. You feel well.'],
      statusRemoved: hadPoison ? 'poison' : undefined,
    };
  }

  if (roll < 0.78) {
    addStatusEffect(char, { type: 'resistance-improved', value: 4, turns: 10 });
    return {
      messages: ['The altar imbues you with resilience.', '', '+Resistance for 10 turns.'],
      resImproved: true,
    };
  }

  if (roll < 0.88) {
    return {
      messages: ['The altar is silent. Whatever power it held is gone.'],
    };
  }

  // Rare harmful
  const dmg = rng.int(10, 25);
  char.hp = Math.max(1, char.hp - dmg);
  return {
    messages: ['The altar was corrupted.', '', `It burns you for ${dmg} damage.`],
  };
}

// ─── Fountain ────────────────────────────────────────────────────────────────

export interface FountainResult {
  messages: string[];
  hpRestored?: boolean;
  statChanged?: { stat: string; delta: number };
  xpGained?: number;
  statusAdded?: string;
  damageDealt?: number;
}

export function resolveFountain(char: Character, rng: RNG): FountainResult {
  const roll = rng.float();

  if (roll < FOUNTAIN.HEAL_CHANCE) {
    const restored = char.maxHp - char.hp;
    char.hp = char.maxHp;
    return {
      messages: [
        'The water tastes cool and pure.',
        '',
        'You feel completely refreshed.',
        `(HP fully restored: +${restored})`,
      ],
      hpRestored: true,
    };
  }

  if (roll < FOUNTAIN.HEAL_CHANCE + FOUNTAIN.NOTHING_CHANCE) {
    return {
      messages: ['The water is tasteless. Nothing happens.'],
    };
  }

  if (roll < FOUNTAIN.HEAL_CHANCE + FOUNTAIN.NOTHING_CHANCE + FOUNTAIN.HARM_CHANCE) {
    const inner = rng.float();
    if (inner < 0.35) {
      const dmg = rng.int(8, 25);
      char.hp = Math.max(1, char.hp - dmg);
      return {
        messages: [`The water burns! You suffer ${dmg} damage.`],
        damageDealt: dmg,
        statusAdded: undefined,
      };
    }
    if (inner < 0.65) {
      addStatusEffect(char, { type: 'poison', value: 3, turns: 5 });
      return {
        messages: ['The water tastes foul. You have been poisoned!'],
        statusAdded: 'poison',
      };
    }
    const stats = ['strength', 'constitution', 'dexterity'] as const;
    const stat = rng.pick([...stats]);
    (char[stat] as number) = Math.max(3, (char[stat] as number) - 1);
    return {
      messages: [`The water saps your vitality. Your ${stat} decreases.`],
      statChanged: { stat, delta: -1 },
    };
  }

  // Rare beneficial (5%)
  const inner = rng.float();
  if (inner < 0.25) {
    const stats = ['strength', 'constitution', 'intelligence', 'wisdom', 'dexterity', 'charisma', 'resistance'] as const;
    const stat = rng.pick([...stats]);
    (char[stat] as number) += 1;
    return {
      messages: [
        'The water shimmers with light.',
        '',
        `Your ${stat} permanently increases!`,
      ],
      statChanged: { stat, delta: 1 },
    };
  }

  if (inner < 0.50) {
    const xp = rng.int(100, 300) * char.level;
    char.xp += xp;
    return {
      messages: ['A vision floods your mind. You gain ${xp} experience.'],
      xpGained: xp,
    };
  }

  if (inner < 0.65) {
    // Remove all negative statuses
    const had = char.statusEffects.filter(e => ['poison', 'mummified', 'feared', 'paralyzed'].includes(e.type)).length;
    char.statusEffects = char.statusEffects.filter(e =>
      !['poison', 'mummified', 'feared', 'paralyzed'].includes(e.type)
    );
    return {
      messages: had > 0
        ? ['The water burns away every affliction. You are cleansed.']
        : ['The water is pure. You feel well.'],
    };
  }

  // Extremely rare: raise several attributes
  const stats = ['strength', 'constitution', 'intelligence', 'wisdom', 'dexterity', 'resistance'] as const;
  const count = rng.int(2, 4);
  const chosen = rng.shuffle([...stats]).slice(0, count);
  const msgs = ['The fountain blazes with golden light!', ''];
  for (const s of chosen) {
    (char[s] as number) += 1;
    msgs.push(`${s} +1`);
  }
  msgs.push('', 'Multiple attributes increase!');
  return { messages: msgs };
}

// ─── Chest traps ─────────────────────────────────────────────────────────────

const CHEST_TRAP_TYPES: ChestTrapType[] = ['needle', 'blade', 'gas', 'fire-glyph', 'alarm'];

const CHEST_TRAP_NAMES: Record<ChestTrapType, string> = {
  'needle':     'poisoned needle',
  'blade':      'spring-loaded blade',
  'gas':        'poison gas vial',
  'fire-glyph': 'fire glyph',
  'alarm':      'alarm mechanism',
};

export function chestTrapName(trap: ChestTrapType): string {
  return CHEST_TRAP_NAMES[trap];
}

/** FNV-1a — a stable hash so a chest's trap never rerolls between visits. */
function stableHash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

/** The trap on this chest for this character, or null if it isn't trapped. */
export function chestTrapFor(char: Character, chestId: string): ChestTrapType | null {
  if (chestId.startsWith(HOARD_PREFIX)) return null;   // a dragon's hoard isn't trapped: the dragon was the trap
  const h = stableHash(`${char.id}:${chestId}`);
  if ((h % 10000) / 10000 >= CHEST_TRAPS.CHANCE) return null;
  return CHEST_TRAP_TYPES[Math.floor(h / 10000) % CHEST_TRAP_TYPES.length];
}

export function chestTrapDetectChance(char: Character): number {
  return Math.min(CHEST_TRAPS.MAX_CHANCE, CHEST_TRAPS.DETECT_BASE + char.wisdom * CHEST_TRAPS.DETECT_PER_WIS);
}

export function chestTrapDisarmChance(char: Character): number {
  const chance = CHEST_TRAPS.DISARM_BASE + char.dexterity * CHEST_TRAPS.DISARM_PER_DEX - disarmDepthPenalty(char);
  return Math.max(TRAPS.DISARM_MIN, Math.min(CHEST_TRAPS.MAX_CHANCE, chance));
}

/** Traps are nastier deeper down: a few percent harder to disarm per level. */
function disarmDepthPenalty(char: Character): number {
  return Math.max(0, char.dungeonLevel - 1) * TRAPS.DISARM_DEPTH_PENALTY;
}

/** Chance to disarm a corridor trap: Intelligence and Dexterity, less with depth. */
export function trapDisarmChance(char: Character): number {
  const chance = 0.25 + char.intelligence * 0.02 + char.dexterity * 0.015 - disarmDepthPenalty(char);
  return Math.max(TRAPS.DISARM_MIN, chance);
}

/** Springs a chest trap. Like other traps it can't kill outright (HP floors at 1). */
export function springChestTrap(char: Character, trap: ChestTrapType, rng: RNG): { messages: string[]; triggerMonster?: boolean } {
  const scale = 1 + (char.dungeonLevel - 1) * CHEST_TRAPS.DEPTH_DAMAGE_SCALE;
  const hurt = (min: number, max: number) => {
    const dmg = Math.round(rng.int(min, max) * scale);
    char.hp = Math.max(1, char.hp - dmg);
    return dmg;
  };
  switch (trap) {
    case 'needle': {
      const dmg = hurt(3, 8);
      addStatusEffect(char, { type: 'poison', value: 3 + char.dungeonLevel, turns: 6 });
      return { messages: [`A poisoned needle jabs your hand for ${dmg} damage!`, 'You have been poisoned.'] };
    }
    case 'blade': {
      const dmg = hurt(8, 20);
      return { messages: [`A spring-loaded blade slashes out of the lock for ${dmg} damage!`] };
    }
    case 'gas': {
      const dmg = hurt(4, 10);
      addStatusEffect(char, { type: 'poison', value: 2 + char.dungeonLevel, turns: 8 });
      return { messages: [`A vial shatters and green gas billows out! You choke for ${dmg} damage.`, 'You have been poisoned.'] };
    }
    case 'fire-glyph': {
      const dmg = hurt(12, 28);
      return { messages: [`A glyph on the lid flares and fire engulfs you for ${dmg} damage!`] };
    }
    case 'alarm':
      return { messages: ['A shrieking alarm goes off inside the chest!', 'Something comes running.'], triggerMonster: true };
  }
}

// ─── Trap ────────────────────────────────────────────────────────────────────

export interface TrapResult {
  messages: string[];
  needsChoice?: boolean;
  resolved: boolean;
  damageDealt?: number;
  statusAdded?: string;
  teleported?: boolean;
  triggerMonster?: boolean;
  statChanged?: { stat: string; delta: number };
}

export function resolveTrapTriggered(char: Character, variant: string, rng: RNG): TrapResult {
  switch (variant) {
    case 'pit': {
      const dmg = rng.int(6, 18);
      char.hp = Math.max(1, char.hp - dmg);
      return { messages: [`You fall into a hidden pit! You take ${dmg} damage.`], resolved: true, damageDealt: dmg };
    }
    case 'poison-needle': {
      const dmg = rng.int(2, 6);
      char.hp = Math.max(1, char.hp - dmg);
      addStatusEffect(char, { type: 'poison', value: 3, turns: 6 });
      return { messages: ['A needle stings your hand!', 'You have been poisoned.'], resolved: true, damageDealt: dmg, statusAdded: 'poison' };
    }
    case 'falling-stone': {
      const dmg = rng.int(10, 25);
      char.hp = Math.max(1, char.hp - dmg);
      return { messages: [`A stone falls from the ceiling! You take ${dmg} damage.`], resolved: true, damageDealt: dmg };
    }
    case 'fire-blast': {
      const dmg = rng.int(12, 30);
      char.hp = Math.max(1, char.hp - dmg);
      return { messages: [`A fire blast erupts from the wall! You take ${dmg} damage.`], resolved: true, damageDealt: dmg };
    }
    case 'acid-spray': {
      const dmg = rng.int(10, 22);
      char.hp = Math.max(1, char.hp - dmg);
      return { messages: [`Acid sprays from a hidden nozzle! You take ${dmg} damage.`], resolved: true, damageDealt: dmg };
    }
    case 'teleport': {
      return { messages: ['The floor glows beneath you.', '', 'YOU HAVE BEEN TELEPORTED.'], resolved: true, teleported: true };
    }
    case 'alarm': {
      return { messages: ['A shrieking alarm sounds!', 'Something comes running.'], resolved: true, triggerMonster: true };
    }
    case 'attribute-rune': {
      const stats = ['strength', 'dexterity', 'constitution'] as const;
      const stat = rng.pick([...stats]);
      (char[stat] as number) = Math.max(3, (char[stat] as number) - 1);
      return {
        messages: [`A rune flares! Your ${stat} is drained!`],
        resolved: true,
        statChanged: { stat, delta: -1 },
      };
    }
    default:
      return { messages: ['A trap springs but misfires.'], resolved: true };
  }
}

export function resolveTrapAvoid(char: Character, variant: string, rng: RNG): TrapResult {
  const dex = char.dexterity;
  const chance = 0.3 + dex * 0.025;
  if (rng.float() < chance) {
    return { messages: ['You dodge the trap!'], resolved: true };
  }
  return resolveTrapTriggered(char, variant, rng);
}

export function resolveTrapDisarm(char: Character, variant: string, rng: RNG): TrapResult {
  if (rng.float() < trapDisarmChance(char)) {
    return { messages: ['You carefully disarm the trap.'], resolved: true };
  }
  const sprung = resolveTrapTriggered(char, variant, rng);
  return { ...sprung, messages: ['You fail to disarm it!', ...sprung.messages] };
}

// ─── A dragon's hoard ────────────────────────────────────────────────────────

export const HOARD_PREFIX = 'hoard-';
const STONE_NAMES = ['rubies', 'pearls', 'garnets', 'topazes', 'star sapphires', 'black opals', 'emeralds the size of eggs', 'moonstones', 'amethysts'];

/** Gold, gemstones worth gold, and magic gems from a dragon's hoard. (A
 * singular magic item, for the toughest, is handed out by the engine.) */
export function dragonHoardLoot(char: Character, monster: string, monsterLevel: number, rng: RNG): { messages: string[]; goldGained: number } {
  const L = Math.max(1, monsterLevel);
  const messages = [`The ${monster}\u2019s hoard spills out: coins, cups, crowns, the wealth of everyone it ever ate.`, ''];
  const gold = rng.int(HOARD.GOLD_MIN, HOARD.GOLD_MAX) * L;
  messages.push(`${gold} gold coins.`);
  const stones = rng.int(HOARD.STONES_MIN, HOARD.STONES_MAX);
  let worth = 0;
  for (let i = 0; i < stones; i++) worth += rng.int(HOARD.STONE_MIN, HOARD.STONE_MAX) * L;
  messages.push(`${stones === 1 ? 'A gemstone' : `${stones} gemstones`}: ${rng.pick(STONE_NAMES)}${stones > 1 ? ' and more' : ''}, worth ${worth} gold.`);
  char.gold += gold + worth;
  // Magic gems, as many as can be carried.
  const kinds: GemType[] = ['ruby', 'sapphire', 'diamond', 'opal', 'emerald', 'moonstone'];
  const got: string[] = [];
  const n = rng.int(HOARD.MAGIC_GEMS_MIN, HOARD.MAGIC_GEMS_MAX);
  for (let i = 0; i < n; i++) {
    const g = rng.pick(kinds.filter(k => char.inventory.gems[k] < (GEMS.CARRY_CAP[k] ?? Infinity)));
    if (!g) break;
    char.inventory.gems[g]++;
    got.push(g);
  }
  if (got.length) messages.push(`And magic gems: ${got.map(g => `a${/^[aeiou]/.test(g) ? 'n' : ''} ${g}`).join(', ')}.`);
  return { messages, goldGained: gold + worth };
}

// ─── Treasure some monsters carry ────────────────────────────────────────────
// Found on (or in) the body when they fall, in keeping with the creature:
// things floating in a Gelatinous Cube, undigested finds in a worm's gut,
// an Orc King's war chest, a giant's sack, a vampire's grave gold...

export interface CarriedTreasure {
  messages: string[];
  ring?: boolean;      // a ring on a finger bone (the engine puts it on)
  amulet?: boolean;    // an amulet (the engine adds it)
}

interface CarryRule {
  chance: number;
  find: (char: Character, L: number, rng: RNG, out: CarriedTreasure) => void;
}

const coins = (char: Character, n: number, out: CarriedTreasure, what: string) => { char.gold += n; out.messages.push(`${what} (${n} gold)`); };
const stones = (char: Character, L: number, rng: RNG, out: CarriedTreasure, min: number, max: number, what: string) => {
  const n = rng.int(min, max); let worth = 0;
  for (let i = 0; i < n; i++) worth += rng.int(10, 30) * L;
  char.gold += worth;
  out.messages.push(`${what}: ${n === 1 ? 'a gemstone' : `${n} gemstones`}, worth ${worth} gold.`);
};
const magicGem = (char: Character, rng: RNG, out: CarriedTreasure, kinds: GemType[] = ['ruby', 'sapphire', 'diamond', 'opal', 'emerald', 'moonstone']) => {
  const g = rng.pick(kinds.filter(k => char.inventory.gems[k] < (GEMS.CARRY_CAP[k] ?? Infinity)));
  if (!g) return;
  char.inventory.gems[g]++;
  out.messages.push(`A magic gem: a${/^[aeiou]/.test(g) ? 'n' : ''} ${g}.`);
};
const gear = (char: Character, rng: RNG, out: CarriedTreasure, bonus?: number) => { const g = rollGear(char, rng, 'monster', bonus); if (g) out.messages.push(...g); };

const SWALLOWER: CarryRule = { chance: 0.4, find: (c, L, rng, out) => {
  out.messages.push('Its gut splits open on things it swallowed and never digested:');
  stones(c, L, rng, out, 1, 3, 'Gemstones, slick with bile');
  coins(c, rng.int(10, 25) * L, out, 'A dead man\u2019s purse.');
  if (rng.float() < 0.25) magicGem(c, rng, out);
  if (rng.float() < 0.15) out.ring = true;
} };

export const CARRIERS: Record<string, CarryRule> = {
  'Gelatinous Cube': { chance: 0.6, find: (c, L, rng, out) => {
    out.messages.push('As it collapses, the things suspended in its quivering bulk spill out across the floor:');
    coins(c, rng.int(10, 30) * L, out, 'Coins, etched by its acid.');
    gear(c, rng, out);
    if (rng.float() < 0.5) magicGem(c, rng, out);
    if (rng.float() < 0.1) out.ring = true;
  } },
  'Mimic': { chance: 0.7, find: (c, L, rng, out) => {
    out.messages.push('Behind where it squatted, the real chest it was guarding: and inside, what it took from the last ones fooled.');
    coins(c, rng.int(20, 50) * L, out, 'Gold.');
    stones(c, L, rng, out, 1, 3, 'Jewels');
    if (rng.float() < 0.3) gear(c, rng, out);
  } },
  'Purple Worm': SWALLOWER, 'Mongolian Death Worm': SWALLOWER, 'Titanoboa': SWALLOWER, 'Giant Leech': SWALLOWER,
  'Orc King': { chance: 1, find: (c, L, rng, out) => {
    out.messages.push('His war chest stands by the throne of skulls: the plunder of a hundred raids.');
    coins(c, rng.int(40, 100) * L, out, 'Gold, by the fistful.');
    stones(c, L, rng, out, 2, 4, 'Looted jewels');
    gear(c, rng, out, rng.int(1, 2));
  } },
  'Giant': { chance: 0.5, find: (c, L, rng, out) => {
    out.messages.push(`The giant\u2019s sack: a whole cheese, a cow\u2019s thighbone, a bent iron pot, and under it all...`);
    coins(c, rng.int(15, 40) * L, out, 'Coins, tipped in like crumbs.');
    if (rng.float() < 0.2) { if (rng.float() < 0.5) gear(c, rng, out, rng.int(1, 2)); else magicGem(c, rng, out); }
  } },
  'Frost Giant': { chance: 0.5, find: (c, L, rng, out) => {
    out.messages.push('The frost giant\u2019s sack, crusted with ice: a frozen elk haunch, a horn of mead, and...');
    coins(c, rng.int(15, 40) * L, out, 'Coins, frozen together in a lump.');
    if (rng.float() < 0.2) { if (rng.float() < 0.5) gear(c, rng, out, rng.int(1, 2)); else magicGem(c, rng, out, ['sapphire', 'diamond', 'moonstone']); }
  } },
  'Vampire': { chance: 0.5, find: (c, L, rng, out) => {
    out.messages.push('In the coffin it slept in, under the grave-dirt: the gold of centuries, and a signet ring of a house long dead.');
    coins(c, rng.int(20, 50) * L, out, 'Grave gold.');
    stones(c, L, rng, out, 1, 1, 'The signet ring');
    if (rng.float() < 0.2) out.amulet = true;
  } },
  'Lich': { chance: 0.7, find: (c, L, rng, out) => {
    out.messages.push('Its treasury lies behind the bones: the wealth of a kingdom it ruled before it died, and its spellbooks.');
    stones(c, L, rng, out, 2, 5, 'Crown jewels');
    magicGem(c, rng, out); magicGem(c, rng, out);
    c.inventory.books = (c.inventory.books ?? 0) + 1;
    out.messages.push('A magic tome, bound in something that is not leather. (B: read it)');
  } },
  'Medusa': { chance: 0.5, find: (c, L, rng, out) => {
    out.messages.push('Around her lair, the jewellery of those she turned to stone: rings on stone fingers, chains on stone throats.');
    stones(c, L, rng, out, 2, 4, 'Jewellery');
  } },
  'Rakshasa': { chance: 0.6, find: (c, L, rng, out) => {
    out.messages.push('Among its silks, a bundle wrapped in brocade: jewels fit for a maharaja.');
    stones(c, L, rng, out, 2, 5, 'Jewels');
    if (rng.float() < 0.3) magicGem(c, rng, out, ['moonstone', 'opal']);
  } },
  'Black Annis': { chance: 0.5, find: (c, L, rng, out) => {
    out.messages.push('In her cave, behind the hanging skins: what her victims carried.');
    coins(c, rng.int(15, 35) * L, out, 'Purses, still knotted.');
    if (rng.float() < 0.3) gear(c, rng, out);
    if (rng.float() < 0.2) magicGem(c, rng, out);
  } },
  'Goblin': { chance: 0.3, find: (c, L, rng, out) => { coins(c, rng.int(3, 10) * L + 5, out, 'A greasy purse of stolen coins, and a tin whistle.'); } },
  'Kobold': { chance: 0.3, find: (c, L, rng, out) => { coins(c, rng.int(3, 10) * L + 5, out, 'A pouch of shiny things: copper coins, a brass button, a glass bead.'); } },
  'Bugbear': { chance: 0.3, find: (c, L, rng, out) => { coins(c, rng.int(4, 12) * L + 5, out, 'A sack of loot from its last ambush.'); if (rng.float() < 0.15) gear(c, rng, out); } },
};

/** What a fallen monster carried, if anything (the engine adds rings and amulets). */
export function carriedTreasure(char: Character, monsterType: string, level: number, rng: RNG): CarriedTreasure | null {
  const rule = CARRIERS[monsterType];
  if (!rule || rng.float() >= rule.chance) return null;
  const out: CarriedTreasure = { messages: [] };
  rule.find(char, Math.max(1, level), rng, out);
  return out;
}
