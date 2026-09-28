import { RNG } from './random.js';
import { COMBAT, LEVELING, GEMS, SPELLS } from './config.js';
import type { Character, Monster, StatusEffect, BeholderRay, HeldCondition, FxElement } from './types.js';
import { getEffectiveStats, addStatusEffect, applyLevelDrain } from './character.js';
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
  runFailed?: boolean;
  ballOfDooFired?: boolean;
  ballOfDooResisted?: boolean;
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

export function playerAttack(char: Character, monster: Monster, rng: RNG): CombatRoundResult {
  const eff = getEffectiveStats(char);
  const naked = char.statusEffects.some(e => e.type === 'naked');

  const hitRoll = rng.die(20) + char.level
    + Math.floor(eff.strength  / COMBAT.HIT_STR_DIVISOR)
    + Math.floor(eff.dexterity / COMBAT.HIT_DEX_DIVISOR);

  const monsterDef = COMBAT.MONSTER_BASE_DEFENSE
    + monster.level
    + Math.floor(monster.level / 4);

  const messages: string[] = [];
  let monsterDamage = 0;

  if (hitRoll >= monsterDef) {
    const baseDamage =
      (char.level * COMBAT.DAMAGE_LEVEL_WEIGHT)
      + Math.floor(eff.strength / COMBAT.DAMAGE_STR_DIVISOR);

    const rand = COMBAT.DAMAGE_RAND_MIN + rng.float() * (COMBAT.DAMAGE_RAND_MAX - COMBAT.DAMAGE_RAND_MIN);
    monsterDamage = Math.max(1, Math.round(baseDamage * rand * (naked ? COMBAT.NAKED_ATTACK_MULT : 1)));
    monster.hp -= monsterDamage;
    messages.push(`You strike the ${monster.type} for ${monsterDamage} damage.`);
  } else {
    messages.push(`You swing at the ${monster.type} but miss!`);
  }

  const monsterDied = monster.hp <= 0;
  if (monsterDied) messages.push(`The ${monster.type} collapses!`);

  const res = monsterAction(char, monster, rng, messages);
  return {
    ...res,
    monsterDamage: res.monsterDamage,
    messages: res.messages,
    playerDied: res.playerDied,
    monsterDied,
    playerDamage: monsterDamage,
  };
}

// ─── Fireball ────────────────────────────────────────────────────────────────

export function playerFireball(char: Character, monster: Monster, rng: RNG): CombatRoundResult {
  const eff = getEffectiveStats(char);

  const base = char.level * COMBAT.FIREBALL_LEVEL_MULT
    + Math.floor(eff.intelligence / COMBAT.FIREBALL_INT_DIVISOR);
  const rand = COMBAT.FIREBALL_RAND_MIN + rng.float() * (COMBAT.FIREBALL_RAND_MAX - COMBAT.FIREBALL_RAND_MIN);
  let damage = Math.max(1, Math.round(base * rand * monster.definition.fireballResistance));

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
  // (Kobold, Slime Mold, Mold, Black Dragon, Red Dragon, Beholder) are
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
  const healAmount = Math.max(1, Math.round(base * rand));

  const messages: string[] = ['You cast Heal.'];
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
  // Powerful-but-not-undead foes (high-tier beholders, dragons, aberrations)
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

// ─── Banish ──────────────────────────────────────────────────────────────────

/** How many faces of a d12 make Banish fail against this monster (0 = it
 * always works). Very powerful monsters resist by tier; any high-level
 * dragon or undead resists too. Asmodeus is at home in the Hells. */
export function banishFailFaces(monster: Monster): number {
  if (monster.type === 'Asmodeus') return 12;
  const byTier = SPELLS.BANISH_FAIL_FACES_BY_TIER[monster.definition.naturalTier] ?? 0;
  const dragonOrUndead = monster.type.includes('Dragon') || monster.definition.isUndead;
  const highLevel = monster.level >= monster.definition.maxLevel * SPELLS.BANISH_HIGH_LEVEL_FRACTION;
  const byKind = dragonOrUndead && highLevel ? SPELLS.BANISH_HIGH_LEVEL_FAIL_FACES : 0;
  return Math.max(byTier, byKind);
}

export function playerBanish(char: Character, monster: Monster, rng: RNG): CombatRoundResult {
  const messages = ['You cast Banish, and a rift to the outer dark tears open behind the ' + monster.type + '!'];
  const failFaces = banishFailFaces(monster);
  let banished: boolean;
  if (monster.type === 'Asmodeus') {
    messages.push('Asmodeus laughs. "Banish me? From my own Hells?" The rift gutters out.');
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
  const eff = getEffectiveStats(char);
  const levelDiff = char.level - monster.level;
  const mummified = char.statusEffects.some(e => e.type === 'mummified');

  let chance = COMBAT.RUN_BASE_CHANCE
    + eff.dexterity * COMBAT.RUN_DEX_BONUS
    + levelDiff * COMBAT.RUN_LEVEL_FACTOR
    - (monster.definition.speed - 1.0) * COMBAT.SPEED_RUN_MODIFIER;
  if (mummified) chance -= 0.2;
  if (monster.type === 'Tarrasque') chance -= 0.3;
  chance = Math.max(0.05, Math.min(0.90, chance));

  const messages: string[] = [];

  if (rng.float() < chance) {
    messages.push('You turn and flee!');
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

type MonsterActionResult = { messages: string[]; monsterDamage: number; playerDied: boolean; monsterDied: boolean; playerTeleported?: boolean; ballOfDooFired?: boolean; ballOfDooResisted?: boolean; monsterHealed?: number; monsterElement?: FxElement };

/** The monster's turn. Also reports the element of whatever it did
 * (monsterElement), or nothing if it didn't get to act. */
function monsterAction(char: Character, monster: Monster, rng: RNG, messages: string[]): MonsterActionResult {
  const out: { acted?: boolean; ability?: string } = {};
  const res = monsterActionInner(char, monster, rng, messages, out);
  return out.acted ? { ...res, monsterElement: abilityElement(out.ability) } : res;
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

  if ((monster.confusedTurns ?? 0) > 0) {
    monster.confusedTurns!--;
    if (rng.float() < GEMS.CONFUSION_FAIL_CHANCE) {
      messages.push(`The ${monster.type} reels in confusion and fails to act!`);
      return { messages, monsterDamage: 0, playerDied: false, monsterDied: false };
    }
  }
  out.acted = true;

  if ((char.invulnerableTurns ?? 0) > 0) {
    char.invulnerableTurns!--;
    messages.push(`Your protective ward deflects the ${monster.type}'s attack harmlessly.`);
    return { messages, monsterDamage: 0, playerDied: false, monsterDied: false };
  }

  const naked = char.statusEffects.some(e => e.type === 'naked');
  const eff = getEffectiveStats(char);

  // Choose ability to use
  const abilities = monster.definition.specialAbilities;
  let ability: string | undefined;
  let playerTeleported = false;
  let ballOfDooFired = false;
  let ballOfDooResisted = false;
  let monsterHealed = 0;

  if (abilities.length > 0 && rng.float() < 0.5) {
    ability = rng.pick(abilities);
  }

  // Special Asmodeus logic
  if (monster.type === 'Asmodeus') {
    ability = pickAsmodeusAbility(monster, char, rng);
  }

  // Special Wizard logic
  if (monster.type === 'Wizard') {
    ability = pickWizardAbility(rng);
  }

  // Special Beholder logic: a bite, or one eyestalk's ray
  if (monster.type === 'Beholder') {
    ability = pickBeholderAbility(monster, rng);
    out.ability = ability;
    if (ability) return resolveBeholderRay(ability as BeholderRay, char, monster, rng, messages, naked);
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

  // Handle Ball of Doo
  if (ability === 'ball-of-doo') {
    ballOfDooFired = true;
    const saveRoll = rng.die(20) + Math.floor(eff.resistance / 2) + Math.floor(eff.wisdom / 3);
    const dc = COMBAT.BALL_OF_DOO_DC;
    if (saveRoll < dc) {
      messages.push('Asmodeus raises one clawed hand.');
      messages.push('');
      messages.push('There is a loud POP and a puff of smoke.');
      messages.push('');
      messages.push('YOU HAVE BEEN TURNED INTO A BALL OF DOO.');
      messages.push('');
      messages.push('You are dead.');
      char.hp = 0;
      return { messages, monsterDamage: char.maxHp, playerDied: true, monsterDied: false, ballOfDooFired };
    } else {
      ballOfDooResisted = true;
      messages.push('Asmodeus attempts to transform you.');
      messages.push('');
      messages.push('You resist the foul magic.');
      return { messages, monsterDamage: 0, playerDied: false, monsterDied: false, ballOfDooFired, ballOfDooResisted };
    }
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

  // Handle intelligence drain (Mind Flayer)
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
  if (ability === 'gaze-paralyze' || ability === 'engulf-paralyze' || ability === 'paralysis-touch') {
    const dmg = calculateMonsterDamage(monster, char, rng, naked);
    char.hp = Math.max(0, char.hp - dmg);
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
  if ((ability === 'poison-breath' || ability === 'spore-poison' || ability === 'slime-disease') && rng.float() < 0.3) {
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
  return Math.max(1, Math.round(base * rand * defenseMultiplier));
}

function pickAsmodeusAbility(monster: Monster, char: Character, rng: RNG): string {
  const hpRatio = monster.hp / monster.maxHp;

  // Ball of Doo: more likely when injured
  const bodChance = COMBAT.BALL_OF_DOO_MIN_CHANCE + (1 - hpRatio) * 0.2;
  if (rng.float() < bodChance) return 'ball-of-doo';

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

// ─── Beholder ────────────────────────────────────────────────────────────────

/** The rays a Beholder of this level has unlocked. */
export function beholderRaysFor(level: number): BeholderRay[] {
  return COMBAT.BEHOLDER_RAYS.filter(r => level >= r.minLevel).map(r => r.ray as BeholderRay);
}

/** '' is a plain bite; otherwise a weighted pick among the unlocked rays. */
function pickBeholderAbility(monster: Monster, rng: RNG): string {
  if (rng.float() < COMBAT.BEHOLDER_BITE_CHANCE) return '';
  const unlocked = COMBAT.BEHOLDER_RAYS.filter(r => monster.level >= r.minLevel);
  if (unlocked.length === 0) return '';
  const total = unlocked.reduce((sum, r) => sum + r.weight, 0);
  let roll = rng.float() * total;
  for (const r of unlocked) {
    roll -= r.weight;
    if (roll < 0) return r.ray;
  }
  return unlocked[unlocked.length - 1].ray;
}

function rayEye(ray: BeholderRay): string {
  return COMBAT.BEHOLDER_RAYS.find(r => r.ray === ray)?.eye ?? 'glaring';
}

/** d20 + a third of the listed attributes' average + level/5, against the
 * Beholder's DC. Averaging keeps a multi-attribute save from becoming
 * automatic for a well-rounded character. */
function beholderSave(char: Character, monster: Monster, rng: RNG, stats: ('constitution' | 'resistance' | 'wisdom' | 'dexterity' | 'strength' | 'charisma')[]): boolean {
  const eff = getEffectiveStats(char);
  const avg = stats.reduce((sum, st) => sum + eff[st], 0) / stats.length;
  const bonus = Math.floor(avg / 3);
  const roll = rng.die(20) + bonus + Math.floor(char.level / 5);
  return roll >= COMBAT.BEHOLDER_RAY_DC_BASE + Math.floor(monster.level / 3);
}

function holdCharacter(char: Character, rounds: number, why: HeldCondition): void {
  char.heldRounds = Math.max(char.heldRounds ?? 0, rounds);
  char.heldBy = why;
}

function resolveBeholderRay(
  ray: BeholderRay,
  char: Character,
  monster: Monster,
  rng: RNG,
  messages: string[],
  naked: boolean,
): { messages: string[]; monsterDamage: number; playerDied: boolean; monsterDied: boolean } {
  const hit = (mult: number) => {
    const dmg = Math.max(1, Math.round(calculateMonsterDamage(monster, char, rng, naked) * mult));
    char.hp = Math.max(0, char.hp - dmg);
    return dmg;
  };
  const done = (dmg: number) => ({ messages, monsterDamage: dmg, playerDied: char.hp <= 0, monsterDied: false });

  messages.push(`The Beholder's ${rayEye(ray)} eyestalk swivels toward you and fires!`);

  switch (ray) {
    case 'fear-ray': {
      const dmg = hit(0.5);
      messages.push(`FEAR RAY. Dread claws at your mind for ${dmg} damage.`);
      if (beholderSave(char, monster, rng, ['wisdom'])) {
        messages.push('You steel your nerves against the terror.');
      } else {
        addStatusEffect(char, { type: 'feared', value: 0, turns: 2 });
        holdCharacter(char, 1, 'feared');
        messages.push('Terror floods you. You cower, unable to act!');
      }
      return done(dmg);
    }
    case 'slow-ray': {
      const dmg = hit(0.5);
      messages.push(`SLOWING RAY. It strikes for ${dmg} damage.`);
      if (beholderSave(char, monster, rng, ['dexterity'])) {
        messages.push('You shake off the sluggishness.');
      } else {
        addStatusEffect(char, { type: 'dexterity-reduced', value: COMBAT.BEHOLDER_SLOW_DEX_REDUCTION, turns: 6 });
        messages.push('Your limbs turn heavy and slow. Your Dexterity is reduced!');
      }
      return done(dmg);
    }
    case 'enervation-ray': {
      const dmg = hit(1.3);
      messages.push(`ENERVATION RAY. Withering energy rots your flesh for ${dmg} damage.`);
      return done(dmg);
    }
    case 'telekinetic-ray': {
      const dmg = hit(1.0);
      messages.push(`TELEKINETIC RAY. You are hurled into the wall for ${dmg} damage.`);
      if (char.hp > 0 && !beholderSave(char, monster, rng, ['strength'])) {
        holdCharacter(char, 1, 'dazed');
        messages.push('You slump to the floor, dazed!');
      }
      return done(dmg);
    }
    case 'paralyze-ray': {
      messages.push('PARALYZING RAY.');
      if (beholderSave(char, monster, rng, ['constitution', 'resistance'])) {
        messages.push('Your muscles lock for an instant, then you tear free.');
      } else {
        addStatusEffect(char, { type: 'paralyzed', value: 0, turns: 2 });
        holdCharacter(char, 2, 'paralyzed');
        messages.push('Every muscle locks rigid. YOU ARE PARALYZED!');
      }
      return done(0);
    }
    case 'sleep-ray': {
      messages.push('SLEEP RAY.');
      if (beholderSave(char, monster, rng, ['wisdom'])) {
        messages.push('Your eyelids droop, but you force them open.');
      } else {
        holdCharacter(char, 2, 'asleep');
        messages.push('A heavy drowsiness drags you down. You fall asleep!');
      }
      return done(0);
    }
    case 'charm-ray': {
      messages.push('CHARM RAY.');
      if (beholderSave(char, monster, rng, ['wisdom', 'charisma'])) {
        messages.push('A honeyed voice fills your head. You shut it out.');
        return done(0);
      }
      const eff = getEffectiveStats(char);
      const own = (char.level * COMBAT.DAMAGE_LEVEL_WEIGHT) + Math.floor(eff.strength / COMBAT.DAMAGE_STR_DIVISOR);
      const rand = COMBAT.DAMAGE_RAND_MIN + rng.float() * (COMBAT.DAMAGE_RAND_MAX - COMBAT.DAMAGE_RAND_MIN);
      const dmg = Math.max(1, Math.round(own * rand * 0.5));
      char.hp = Math.max(0, char.hp - dmg);
      holdCharacter(char, 1, 'charmed');
      messages.push(`The Beholder is your dearest friend. You turn your weapon on yourself for ${dmg} damage!`);
      return done(dmg);
    }
    case 'petrify-ray': {
      messages.push('PETRIFICATION RAY.');
      if (beholderSave(char, monster, rng, ['constitution', 'resistance'])) {
        messages.push('Your skin stiffens to grey, then softens again.');
        return done(0);
      }
      if ((monster.petrifyStage ?? 0) >= 1) {
        char.hp = 0;
        messages.push('The stone creeps over your chest, your throat, your eyes.');
        messages.push('YOU HAVE BEEN TURNED TO STONE.');
        return done(0);
      }
      monster.petrifyStage = 1;
      addStatusEffect(char, { type: 'dexterity-reduced', value: COMBAT.BEHOLDER_PETRIFY_DEX_REDUCTION, turns: 8 });
      holdCharacter(char, 1, 'petrifying');
      messages.push('Your legs turn to grey stone! Another hit like that will finish the job.');
      return done(0);
    }
    case 'disintegrate-ray': {
      const saved = beholderSave(char, monster, rng, ['dexterity']);
      const dmg = hit(saved ? 1.5 : 3.0);
      messages.push(saved
        ? `DISINTEGRATION RAY. You twist aside and it only grazes you for ${dmg} damage.`
        : `DISINTEGRATION RAY. It strikes you full on for ${dmg} damage!`);
      if (char.hp <= 0) messages.push('Your body crumbles into fine grey dust.');
      return done(dmg);
    }
    case 'death-ray': {
      messages.push('DEATH RAY.');
      if (beholderSave(char, monster, rng, ['constitution', 'resistance', 'wisdom'])) {
        const dmg = hit(1.5);
        messages.push(`Your heart stutters but keeps beating. You suffer ${dmg} damage.`);
        return done(dmg);
      }
      char.hp = 0;
      messages.push('The white eye opens wide. YOUR HEART STOPS.');
      return done(0);
    }
  }
}

const HELD_TEXT: Record<HeldCondition, string> = {
  feared:     'You cower in terror and cannot act!',
  dazed:      'You are still dazed and cannot act!',
  paralyzed:  'You are paralyzed and cannot move!',
  asleep:     'You are fast asleep!',
  charmed:    'You gaze adoringly at the Beholder and do nothing.',
  engulfed:   'You struggle inside the quivering jelly but cannot break free!',
  petrifying: 'Your stone legs will not obey you!',
};

/** A round the character loses to being held: they do nothing and the
 * monster acts. */
export function playerHeld(char: Character, monster: Monster, rng: RNG): CombatRoundResult {
  const messages = [HELD_TEXT[char.heldBy ?? 'paralyzed']];
  char.heldRounds = Math.max(0, (char.heldRounds ?? 1) - 1);
  if (char.heldRounds === 0) char.heldBy = undefined;
  const res = monsterAction(char, monster, rng, messages);
  return { ...res, playerDamage: 0, monsterDied: false };
}

/** The Beholder's central eye: a chance to cancel a spell or gem outright,
 * spending the character's turn. Returns null when the magic gets through. */
export function beholderAntimagic(char: Character, monster: Monster, rng: RNG, what: 'spell' | 'gem'): CombatRoundResult | null {
  if (monster.type !== 'Beholder' || rng.float() >= COMBAT.BEHOLDER_ANTIMAGIC_CHANCE) return null;
  const messages = [
    'The Beholder turns its great central eye upon you.',
    what === 'spell'
      ? 'Your spell unravels in its antimagic gaze!'
      : 'Your gem goes dark in its antimagic gaze, then slowly rekindles.',
  ];
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
