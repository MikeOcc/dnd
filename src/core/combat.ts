import { RNG } from './random.js';
import { COMBAT, LEVELING } from './config.js';
import type { Character, Monster, StatusEffect } from './types.js';
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
  runFailed?: boolean;
  ballOfDooFired?: boolean;
  ballOfDooResisted?: boolean;
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
    messages.push(`The ${monster.type} shrugs off most of the fire! (${Math.round((1 - monster.definition.fireballResistance) * 100)}% resistant)`);
  } else if (monster.definition.fireballResistance >= 1.8) {
    messages.push(`Fireball! The ${monster.type} is particularly vulnerable to fire!`);
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
    messages.push(`The ${monster.type} shrugs off most of the acid! (${Math.round((1 - acidResistance) * 100)}% resistant)`);
  } else if (acidResistance >= 1.8) {
    messages.push(`Acid Spray! The ${monster.type} is particularly vulnerable to acid!`);
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
    messages.push(`The ${monster.type} shrugs off most of the lightning! (${Math.round((1 - lightningResistance) * 100)}% resistant)`);
  } else if (lightningResistance >= 1.8) {
    messages.push(`Lightning! The ${monster.type} is particularly vulnerable to lightning!`);
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

  const penalty = monster.prayerPenalty;
  monster.prayerPenalty = Math.min(1, monster.prayerPenalty + COMBAT.PRAYER_PENALTY_PER_USE);

  let baseChance = (undead || lightVulnerable)
    ? COMBAT.PRAYER_UNDEAD_BASE_CHANCE
    : COMBAT.PRAYER_NON_UNDEAD_BASE_CHANCE;
  if (isAsmodeus) baseChance *= COMBAT.PRAYER_ASMODEUS_MULT;

  const chance = Math.max(0, baseChance - penalty);
  const messages: string[] = ['You pray.'];
  let monsterDied = false;
  let monsterDamage = 0;

  if (rng.float() < chance) {
    if (undead || isAsmodeus || lightVulnerable) {
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
    } else {
      // Non-undead prayer benefits
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

function monsterAction(
  char: Character,
  monster: Monster,
  rng: RNG,
  messages: string[],
): { messages: string[]; monsterDamage: number; playerDied: boolean; monsterDied: boolean; playerTeleported?: boolean; ballOfDooFired?: boolean; ballOfDooResisted?: boolean; monsterHealed?: number } {
  if (monster.hp <= 0) {
    return { messages, monsterDamage: 0, playerDied: false, monsterDied: true };
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

  // Special Beholder logic
  if (monster.type === 'Beholder') {
    ability = pickBeholderAbility(rng);
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

  // Handle paralysis
  if (ability === 'gaze-paralyze' || ability === 'engulf-paralyze' || ability === 'paralysis-touch') {
    const dmg = calculateMonsterDamage(monster, char, rng, naked);
    char.hp = Math.max(0, char.hp - dmg);
    if (rng.float() < 0.4) {
      addStatusEffect(char, { type: 'paralyzed', value: 0, turns: 2 });
      messages.push(`The ${monster.type} paralyzes you!`);
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

function pickBeholderAbility(rng: RNG): string {
  const roll = rng.float();
  if (roll < 0.25) return 'magic-blast';
  if (roll < 0.40) return 'paralyze-ray';
  if (roll < 0.55) return 'fear-ray';
  if (roll < 0.65) return 'life-drain-ray';
  if (roll < 0.75) return 'weaken-ray';
  return 'spell-interrupt';
}

// ─── XP calculation ──────────────────────────────────────────────────────────

export function calculateXPReward(charLevel: number, monsterLevel: number, isUnique: boolean): number {
  const base = monsterLevel * LEVELING.XP_PER_MONSTER_LEVEL;
  const diff = monsterLevel - charLevel;
  let mult = 1.0;

  if (diff > 0) mult += diff * LEVELING.XP_LEVEL_DIFF_BONUS;
  if (diff < 0) mult = Math.max(LEVELING.XP_MIN_FRACTION, mult + diff * LEVELING.XP_LEVEL_DIFF_PENALTY);
  if (isUnique) mult *= LEVELING.UNIQUE_MONSTER_XP_MULT;

  return Math.max(1, Math.round(base * mult));
}
