// All tuning constants live here for easy adjustment.

export const DUNGEON = {
  WIDTH: 80,
  HEIGHT: 60,
  LEVELS: 7,
  MIN_REACHABLE: 900,
  MAX_REACHABLE: 1400,
  BSP_MIN_ROOM: 5,
  BSP_MAX_DEPTH: 5,
  EXTRA_LOOPS: 8,
  BOSS_X: 40,  // Asmodeus target column on level 7
  BOSS_Y: 30,  // Asmodeus target row on level 7
} as const;

export const CONTENT_PER_LEVEL = {
  CHESTS_MIN: 4,
  CHESTS_MAX: 7,
  BOOKS_MIN: 2,
  BOOKS_MAX: 4,
  ALTARS_MIN: 1,
  ALTARS_MAX: 3,
  FOUNTAINS_MIN: 1,
  FOUNTAINS_MAX: 2,
  TRAPS_MIN: 5,
  TRAPS_MAX: 10,
  FIXED_MONSTERS_MIN: 2,
  FIXED_MONSTERS_MAX: 5,
  DESCRIPTIONS_MIN: 15,
  DESCRIPTIONS_MAX: 25,
} as const;

export const ENCOUNTER = {
  GRACE_MOVES_MIN: 8,
  GRACE_MOVES_MAX: 10,
  BASE_CHANCE: 0.03,          // 3% base chance per step after grace period
  CHANCE_INCREMENT: 0.015,    // rises 1.5% per additional step
  MAX_CHANCE: 0.35,           // caps at 35%
  GRACE_AFTER_LEVEL_ENTRY: 5,
  GRACE_AFTER_DEATH: 10,
} as const;

export const COMBAT = {
  // Attack: d20 + charLevel + STR/2 + DEX/3 vs monsterDefense
  MONSTER_BASE_DEFENSE: 10,    // before monster level added
  HIT_STR_DIVISOR: 2,
  HIT_DEX_DIVISOR: 3,

  // Damage (if hit): (charLevel + STR/2) * randomFactor
  DAMAGE_LEVEL_WEIGHT: 1.0,
  DAMAGE_STR_DIVISOR: 2,
  DAMAGE_RAND_MIN: 0.7,
  DAMAGE_RAND_MAX: 1.3,

  // Player defense: 10 + CON/2 + DEX/3 + RES/4 + charLevel
  PLAYER_BASE_DEFENSE: 10,
  DEF_CON_DIVISOR: 2,
  DEF_DEX_DIVISOR: 3,
  DEF_RES_DIVISOR: 4,

  // Fireball: (charLevel*2 + INT/2) * randomFactor
  FIREBALL_LEVEL_MULT: 2,
  FIREBALL_INT_DIVISOR: 2,
  FIREBALL_RAND_MIN: 0.8,
  FIREBALL_RAND_MAX: 1.5,

  // Heal: (charLevel + WIS/2) * randomFactor
  HEAL_LEVEL_WEIGHT: 1.0,
  HEAL_WIS_DIVISOR: 2,
  HEAL_RAND_MIN: 1.0,
  HEAL_RAND_MAX: 1.5,

  // Prayer effectiveness vs undead
  PRAYER_UNDEAD_DAMAGE_MIN: 0.6,
  PRAYER_UNDEAD_DAMAGE_MAX: 2.0,
  PRAYER_UNDEAD_BASE_CHANCE: 0.75,
  PRAYER_NON_UNDEAD_BASE_CHANCE: 0.30,
  PRAYER_PENALTY_PER_USE: 0.20,  // each prayer reduces chance by 20%
  PRAYER_ASMODEUS_MULT: 0.35,

  // Run
  RUN_BASE_CHANCE: 0.55,
  RUN_DEX_BONUS: 0.015,
  RUN_LEVEL_FACTOR: 0.05,       // per level difference (positive = player higher)

  // Naked status
  NAKED_ATTACK_MULT: 0.6,
  NAKED_DEFENSE_MULT: 0.6,

  // Mummification
  MUMMY_DAMAGE_PER_TURN: 3,
  MUMMY_DEX_REDUCTION: 3,

  // Ball of Doo save: RES + WIS vs DC
  BALL_OF_DOO_DC: 30,
  BALL_OF_DOO_MIN_CHANCE: 0.10,  // Asmodeus always has at least 10% chance to use it

  // Infernal Healing
  INFERNAL_HEAL_DIVISOR: 3,  // Asmodeus heals this fraction of the damage he deals

  // Monster speed effect on run chance
  SPEED_RUN_MODIFIER: 0.1,    // per speed point above 1.0
} as const;

export const LEVELING = {
  // XP thresholds for each character level (index = level)
  XP_TABLE: [0, 0, 100, 300, 700, 1500, 3000, 5500, 9000, 14000, 21000,
             30000, 42000, 57000, 75000, 97000, 125000, 159000, 200000, 249000, 307000],
  MAX_LEVEL: 20,

  // HP gain per level: const + CON_DIVISOR roll
  HP_PER_LEVEL_BASE: 4,
  HP_PER_LEVEL_RAND: 4,  // +1d4

  // Chance to gain +1 to a random stat on level up
  STAT_GAIN_CHANCE: 0.3,

  // XP reward: monsterLevel * XP_PER_MONSTER_LEVEL * levelDiffBonus
  XP_PER_MONSTER_LEVEL: 12,
  XP_LEVEL_DIFF_BONUS: 0.2,   // +20% per level monster is above player
  XP_LEVEL_DIFF_PENALTY: 0.1, // -10% per level monster is below player
  XP_MIN_FRACTION: 0.05,      // always at least 5% of base XP

  UNIQUE_MONSTER_XP_MULT: 4.0,
} as const;

export const MONSTER_SCALING = {
  // Random monster level: charLevel + dungeonDepth - 1 + rand(-SPREAD, SPREAD)
  DEPTH_BONUS: 1,
  SPREAD: 3,
} as const;

export const DEATH = {
  GOLD_LOSS_FRACTION: 0.15,
} as const;

export const SCORING = {
  XP_MULT: 1,
  GOLD_MULT: 2,
  MONSTER_MULT: 50,
  UNIQUE_MULT: 500,
  ASMODEUS_BONUS: 10000,
  DEATH_PENALTY: 200,
} as const;

export const FOV = {
  RADIUS: 2,  // 5x5 = 2 cells each direction from center
} as const;

export const FOUNTAIN = {
  HEAL_CHANCE: 0.50,
  NOTHING_CHANCE: 0.25,
  HARM_CHANCE: 0.20,
  RARE_CHANCE: 0.05,
} as const;

export const BOOK = {
  BENEFICIAL_CHANCE: 0.60,
  NEUTRAL_CHANCE: 0.20,
  // harmful = remaining 20%
} as const;
