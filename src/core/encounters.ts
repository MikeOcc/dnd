import type { Character, Monster, StatusEffect, GemType, ChestTrapType } from './types.js';
import type { RNG } from './random.js';
import { ENCOUNTER, FOUNTAIN, MAGIC_BOOK, DEATH, TREASURE, GEMS, CHEST_TRAPS, TRAPS, FIRST_LEVEL } from './config.js';
import { addStatusEffect } from './character.js';

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
}

export function applyDeath(char: Character, entranceX: number, entranceY: number): DeathResult {
  const goldLost = Math.floor(char.gold * DEATH.GOLD_LOSS_FRACTION);
  char.gold = Math.max(0, char.gold - goldLost);
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
    ],
    goldLost,
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
  ruby: 'ruby', sapphire: 'sapphire', diamond: 'diamond', opal: 'opal',
};

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

  if (roll < 0.352) {
    const gold = rng.int(TREASURE.GOLD_MIN, TREASURE.GOLD_MAX) * char.dungeonLevel
      + rng.int(0, char.level) * TREASURE.GOLD_CHAR_LEVEL_MULT;
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
    const type = rng.pick(GEM_TYPES);
    char.inventory.gems[type]++;
    return {
      messages: [
        `A single flawless ${GEM_NAMES[type]} glints among the debris! Worth ${GEMS.VALUES[type]} gold.`,
        `(${char.inventory.gems[type]} total)`,
      ],
      gemGained: type,
    };
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
// not an affliction, and is left alone.
const NEGATIVE_STATUS_TYPES: StatusEffect['type'][] = [
  'poison', 'bleeding', 'naked', 'mummified', 'paralyzed', 'feared',
  'intelligence-reduced', 'dexterity-reduced', 'strength-reduced',
];

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
  const effect = rng.pick(BOOK_EFFECTS);

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
      char.statusEffects = char.statusEffects.filter(e => !NEGATIVE_STATUS_TYPES.includes(e.type));
      const removed = before - char.statusEffects.length;
      return {
        effect,
        messages: removed > 0
          ? ['A cleansing light washes over you.', '', 'Your afflictions are lifted.']
          : ['A cleansing light washes over you.', '', 'You feel no different — you had nothing to cleanse.'],
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
