import type { Character, Monster, StatusEffect } from './types.js';
import type { RNG } from './random.js';
import { ENCOUNTER, FOUNTAIN, BOOK, DEATH } from './config.js';
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
}

export function resolveChest(char: Character, rng: RNG): ChestResult {
  const roll = rng.float();

  if (roll < 0.35) {
    const gold = rng.int(10, 80) * char.dungeonLevel;
    char.gold += gold;
    return { messages: [`You find ${gold} gold coins!`], goldGained: gold };
  }

  if (roll < 0.50) {
    const heal = rng.int(8, 20) + char.level * 2;
    const actual = Math.min(heal, char.maxHp - char.hp);
    char.hp = Math.min(char.hp + heal, char.maxHp);
    if (actual <= 0) {
      return { messages: ['You find a healing potion, but you are already healthy.'], hpGained: 0 };
    }
    return { messages: [`A healing potion! You recover ${actual} hit points.`], hpGained: actual };
  }

  if (roll < 0.60) {
    const xp = rng.int(20, 60) * char.level;
    char.xp += xp;
    return { messages: [`A glowing crystal. You gain ${xp} experience.`], xpGained: xp };
  }

  if (roll < 0.65) {
    const stats = ['strength', 'constitution', 'intelligence', 'wisdom', 'dexterity', 'charisma', 'resistance'] as const;
    const stat = rng.pick([...stats]);
    (char[stat] as number) += 1;
    return {
      messages: [`A magical scroll crumbles to dust. Your ${stat} increases!`],
      statChanged: { stat, delta: 1 },
    };
  }

  if (roll < 0.78) {
    return { messages: ['The chest is empty. Disappointing.'] };
  }

  if (roll < 0.88) {
    // Trap inside
    const dmg = rng.int(8, 20);
    char.hp = Math.max(1, char.hp - dmg);
    return { messages: [`TRAP! A blade springs from the chest! You take ${dmg} damage.`] };
  }

  if (roll < 0.93) {
    const stat = 'constitution';
    (char[stat] as number) = Math.max(3, (char[stat] as number) - 1);
    return {
      messages: ['A noxious gas billows out! Your Constitution decreases.'],
      statChanged: { stat, delta: -1 },
    };
  }

  // Monster
  return {
    messages: ['Something shifts inside the chest...'],
    triggerMonster: true,
  };
}

// ─── Book ────────────────────────────────────────────────────────────────────

export interface BookResult {
  messages: string[];
  statChanged?: { stat: string; delta: number };
  xpGained?: number;
  triggerEvent?: boolean;
}

export function resolveBook(char: Character, rng: RNG): BookResult {
  const roll = rng.float();

  if (roll < BOOK.BENEFICIAL_CHANCE) {
    const inner = rng.float();

    if (inner < 0.35) {
      const stats = ['strength', 'constitution', 'intelligence', 'wisdom', 'dexterity', 'charisma', 'resistance'] as const;
      const stat = rng.pick([...stats]);
      (char[stat] as number) += 1;
      return {
        messages: [
          'The words burn themselves into your mind.',
          '',
          `Your ${stat} increases!`,
        ],
        statChanged: { stat, delta: 1 },
      };
    }

    if (inner < 0.65) {
      const xp = rng.int(50, 150) * char.level;
      char.xp += xp;
      return {
        messages: [
          'The book vibrates and then crumbles to dust.',
          '',
          `You gain ${xp} experience from the ancient knowledge.`,
        ],
        xpGained: xp,
      };
    }

    if (inner < 0.80) {
      const heal = Math.round(char.maxHp * 0.3);
      char.hp = Math.min(char.hp + heal, char.maxHp);
      return {
        messages: [
          'A warm light radiates from the pages.',
          '',
          `You feel restored. (+${heal} HP)`,
        ],
      };
    }

    return {
      messages: [
        'The book contains maps of this level.',
        '',
        'You study them carefully.',
      ],
    };
  }

  if (roll < BOOK.BENEFICIAL_CHANCE + BOOK.NEUTRAL_CHANCE) {
    return {
      messages: [
        'The text shifts and dissolves as you try to read it.',
        '',
        'The book crumbles to dust.',
      ],
    };
  }

  // Harmful (remaining ~20%)
  const inner = rng.float();

  if (inner < 0.40) {
    const stat = 'intelligence';
    (char[stat] as number) = Math.max(3, (char[stat] as number) - 1);
    return {
      messages: [
        'The words writhe like worms.',
        '',
        'A terrible headache seizes you. Your Intelligence decreases.',
      ],
      statChanged: { stat, delta: -1 },
    };
  }

  if (inner < 0.70) {
    const xp = Math.round(char.xp * 0.05);
    char.xp = Math.max(0, char.xp - xp);
    return {
      messages: [
        'Reading this book was a mistake.',
        '',
        `You lose ${xp} experience.`,
      ],
      xpGained: -xp,
    };
  }

  // Monster event
  return {
    messages: [
      'The final page depicts a terrible creature.',
      '',
      'Something steps out of the book.',
    ],
    triggerEvent: true,
  };
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

export function resolveAltar(char: Character, rng: RNG): AltarResult {
  const wisdomBonus = Math.floor(char.wisdom / 5);
  const roll = rng.float() - wisdomBonus * 0.02;

  if (roll < 0.30) {
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
  const chance = 0.25 + char.intelligence * 0.02 + char.dexterity * 0.015;
  if (rng.float() < chance) {
    return { messages: ['You carefully disarm the trap.'], resolved: true };
  }
  return { ...resolveTrapTriggered(char, variant, rng), messages: ['You fail to disarm it!', ...resolveTrapTriggered(char, variant, rng).messages] };
}
