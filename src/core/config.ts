// All tuning constants live here for easy adjustment.

export const CHARACTER = {
  MAX_REROLLS: 20,
} as const;

export const GAMEPLAY = {
  REGEN_HP_EVERY_N_STEPS: 10,    // +1 HP per N steps walked (passive regen)
  REGEN_HP_EVERY_N_WAITS: 3,     // +1 HP per N wait actions (resting in place)
  WAIT_ENCOUNTER_GRACE: 3,       // rest ticks before wandering monster risk begins
  WAIT_ENCOUNTER_CHANCE: 0.04,   // chance per tick after grace period
  POTION_HEAL_MIN: 20,
  POTION_HEAL_MAX: 35,
  POTION_HEAL_CON_DIVISOR: 4,    // +floor(CON / 4) bonus HP per potion
  POTION_HEAL_MAX_HP_PCT: 0.30,  // +30% of max HP, so potions keep pace with high-level characters
} as const;

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
  MAP_VIEW_RADIUS: 12,  // the M command shows a (2*R+1)-square window centered on the player
} as const;

export const CONTENT_PER_LEVEL = {
  CHESTS_MIN: 4,
  CHESTS_MAX: 7,
  BOOKS_MIN: 2,
  BOOKS_MAX: 4,
  ALTARS_MIN: 1,
  ALTARS_MAX: 3,
  FOUNTAINS_MIN: 2,
  FOUNTAINS_MAX: 4,
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

  // Acid Spray: (charLevel*2 + INT/2) * randomFactor
  ACID_LEVEL_MULT: 2,
  ACID_INT_DIVISOR: 2,
  ACID_RAND_MIN: 0.8,
  ACID_RAND_MAX: 1.4,

  // Lightning: (charLevel*2 + INT/2) * randomFactor
  LIGHTNING_LEVEL_MULT: 2,
  LIGHTNING_INT_DIVISOR: 2,
  LIGHTNING_RAND_MIN: 0.8,
  LIGHTNING_RAND_MAX: 1.4,

  // Frost Bolt: (charLevel*2 + INT/2) * randomFactor
  FROST_LEVEL_MULT: 2,
  FROST_INT_DIVISOR: 2,
  FROST_RAND_MIN: 0.8,
  FROST_RAND_MAX: 1.4,

  // Poison Spray: (charLevel*2 + INT/2) * randomFactor
  POISON_LEVEL_MULT: 2,
  POISON_INT_DIVISOR: 2,
  POISON_RAND_MIN: 0.8,
  POISON_RAND_MAX: 1.4,

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

  // Prayer vs powerful-but-not-undead monsters (Beholders, Dragons, and
  // other naturalTier>=7 non-undead) — a fainter echo of the undead effect.
  PRAYER_POWERFUL_NATURAL_TIER: 7,
  PRAYER_POWERFUL_BASE_CHANCE: 0.40,
  PRAYER_POWERFUL_DAMAGE_MIN: 0.3,
  PRAYER_POWERFUL_DAMAGE_MAX: 0.9,

  // The more desperate the prayer, the more likely it's heard.
  PRAYER_LOW_HP_CHANCE_BONUS: 0.25,  // added at 0 HP, scaled by missing-HP fraction

  // Heaven won't smite something far beneath you — and may rebuke the attempt.
  // Wights, Spectres, and Vampires are exempt from this "beneath you" check
  // (see combat.ts) — like Asmodeus and the undead in general, they're
  // always worth a prayer, and their own level range caps out well below a
  // high-level character's, so without the exemption a leveled-up
  // character could never reach "worthy" against even the strongest Wight
  // they'd ever meet.
  PRAYER_WEAK_MONSTER_LEVEL_RATIO: 0.5,  // monster.level < char.level * this => unworthy
  PRAYER_BACKFIRE_CHANCE: 0.15,
  PRAYER_BACKFIRE_DAMAGE_MULT: 0.4,

  // Level drain: a small chance on a life-drain hit from a Wight, Spectre,
  // or Vampire that's rolled high enough (relative to its own natural
  // range) to be a real threat — mirrors Sanguinid's blood-drain, but
  // rarer, since these three hinge their whole identity on the "classic
  // level-draining undead" trope.
  LEVEL_DRAIN_CHANCE: 0.08,
  LEVEL_DRAIN_MIN_LEVEL_FRACTION: 0.7,  // monster.level must be >= maxLevel * this

  // Beholder eye rays. Each eyestalk has its own ray; a Beholder only uses
  // the rays its level has unlocked, so the extreme ones (petrification,
  // disintegration, death) belong to the elder specimens. Weights are
  // relative within whatever is unlocked. Saves: d20 + (average of the
  // save's attributes) / 3 + level/5 against BEHOLDER_RAY_DC_BASE +
  // beholder level / 3.
  BEHOLDER_RAYS: [
    { ray: 'fear-ray',         eye: 'violet',     minLevel: 10, weight: 3 },
    { ray: 'slow-ray',         eye: 'blue',       minLevel: 10, weight: 3 },
    { ray: 'enervation-ray',   eye: 'green',      minLevel: 10, weight: 3 },
    { ray: 'telekinetic-ray',  eye: 'orange',     minLevel: 10, weight: 3 },
    { ray: 'paralyze-ray',     eye: 'yellow',     minLevel: 14, weight: 2 },
    { ray: 'sleep-ray',        eye: 'cyan',       minLevel: 14, weight: 2 },
    { ray: 'charm-ray',        eye: 'pink',       minLevel: 18, weight: 2 },
    { ray: 'petrify-ray',      eye: 'lime-green', minLevel: 22, weight: 1 },
    { ray: 'disintegrate-ray', eye: 'red',        minLevel: 26, weight: 1 },
    { ray: 'death-ray',        eye: 'white',      minLevel: 29, weight: 1 },
  ],
  BEHOLDER_BITE_CHANCE: 0.2,

  // Basilisk gaze / Gelatinous Cube engulf / Lich touch
  PARALYSIS_CHANCE: 0.4,
  PARALYSIS_ROUNDS: 2,          // combat rounds the character loses        // chance a round is a plain bite instead of a ray
  BEHOLDER_RAY_DC_BASE: 10,
  BEHOLDER_ANTIMAGIC_CHANCE: 0.25,  // central eye: chance a spell or gem used against it fizzles
  BEHOLDER_SLOW_DEX_REDUCTION: 4,
  BEHOLDER_PETRIFY_DEX_REDUCTION: 6,

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

  // Sanguinid: bleeding DOT applied by any successful hit, plus a rare
  // level-drain on its blood-drain attack specifically
  SANGUINID_BLEED_DAMAGE: 3,
  SANGUINID_BLEED_TURNS: 4,
  SANGUINID_LEVEL_DRAIN_CHANCE: 0.03,
  SANGUINID_FLASH_BURN_CHANCE: 0.10,   // its "secondary attack," on top of great-strength/blood-drain
  SANGUINID_FLASH_BURN_MULT: 1.5,      // flash-burn hits harder than its other two attacks
  SANGUINID_RADIATION_PER_LEVEL: 0.4,  // passive damage every round, independent of its chosen attack
} as const;

export const LEVELING = {
  // XP thresholds for each character level (index = level). Levels 1-20
  // follow the original curve; 21-60 continue it with a decaying growth
  // ratio (approaching ~1.10x per level) so the climb keeps steepening
  // without exploding into absurd numbers by the level-60 cap.
  XP_TABLE: [
    0, 0, 100, 300, 700, 1500, 3000, 5500, 9000, 14000, 21000,
    30000, 42000, 57000, 75000, 97000, 125000, 159000, 200000, 249000, 307000,
    375400, 455800, 550000, 660000, 788100, 936900, 1109300, 1308500, 1538100, 1802200,
    2105300, 2452400, 2849100, 3301700, 3817100, 4403000, 5068000, 5821600, 6674400, 7638100,
    8725600, 9951300, 11331100, 12882600, 14625300, 16580700, 18772600, 21227300, 23973900, 27044500,
    30474500, 34303100, 38573500, 43333400, 48635400, 54537600, 61104000, 68405300, 76519400, 85532200,
  ],
  MAX_LEVEL: 60,

  // HP gain per level: const + CON_DIVISOR roll
  HP_PER_LEVEL_BASE: 4,
  HP_PER_LEVEL_RAND: 4,  // +1d4

  // Chance to gain +1 to a random stat on level up
  STAT_GAIN_CHANCE: 0.3,

  // XP reward: monsterLevel * XP_PER_MONSTER_LEVEL * levelDiffBonus * tierBonus
  XP_PER_MONSTER_LEVEL: 12,
  // Bonus for a monster above the player's level ramps up rather than
  // scaling flat with the gap: +20% per level plus +2% per level *squared*,
  // so a 20-level gap pays out far more than 20x a 1-level gap does, and a
  // 40+ level gap (taking on something built for a much higher character)
  // is a genuine jackpot rather than a marginal bump. The quadratic term
  // was doubled (from 0.01) after 0.01 still felt thin against high-level
  // monsters specifically — it's the term that matters most at big gaps,
  // so this leaves ordinary same-level kills untouched while roughly
  // doubling payout for a 30+ level gap.
  XP_LEVEL_DIFF_BONUS_LINEAR: 0.2,
  XP_LEVEL_DIFF_BONUS_QUADRATIC: 0.02,
  XP_LEVEL_DIFF_PENALTY: 0.1, // -10% per level monster is below player
  XP_MIN_FRACTION: 0.05,      // always at least 5% of base XP

  // A monster's naturalTier (1-10) reflects its inherent danger independent
  // of the numeric level it happens to roll — a dragon or lich is a bigger
  // threat than a kobold of the "same" level. Each tier above 1 adds this
  // fraction to the XP multiplier, so tier-1 trash (Kobold, Goblin, Mold,
  // Skeleton) is unaffected while tier-7/8 threats (dragons, Lich, Beholder)
  // and tier-9/10 uniques pay out proportionally more. Raised from 0.15 for
  // the same reason as the quadratic term above — the toughest monster
  // types specifically needed a bigger payout.
  XP_TIER_BONUS_PER_TIER: 0.25,

  UNIQUE_MONSTER_XP_MULT: 6.0,
} as const;

export const MONSTER_SCALING = {
  // Monster level range by dungeon depth (index 0 = dungeon level 1), before
  // the character-level cap bonus below is added to the max. Deeper levels
  // widen the band — both the floor and the ceiling climb with depth.
  LEVEL_RANGE_BY_DUNGEON_LEVEL: [
    { min: 1,  max: 6 },   // level 1 — gentle enough for a fresh level-1 character to survive
    { min: 10, max: 22 },  // level 2
    { min: 18, max: 30 },  // level 3
    { min: 26, max: 45 },  // level 4
    { min: 34, max: 60 },  // level 5
    { min: 42, max: 75 },  // level 6
    { min: 50, max: 90 },  // level 7
  ],
  // A stronger character pushes what they run into even on the same floor:
  // the level ceiling always gets + floor(characterLevel / this) added on top.
  CHAR_LEVEL_CAP_DIVISOR: 4,

  // Ordinary (non-unique) monsters never exceed this regardless of depth or
  // character-level bonus. Unique bosses are exempt — they roll within their
  // own per-boss range instead, which starts where this cap ends (60) and
  // climbs to 100 for Asmodeus.
  HARD_LEVEL_CAP: 60,

  // Random-encounter monster TYPE eligibility by dungeon depth (index 0 =
  // dungeon level 1): a floor on naturalTier, on top of each monster's own
  // minDungeonLevel. Leveling up a Kobold's stats (via LEVEL_RANGE_BY_
  // DUNGEON_LEVEL above) still leaves it a Kobold — this keeps low-tier
  // fodder types from randomly turning up on the deep floors once tougher
  // types have unlocked, so "low level monster" means the type, not just
  // the stat block.
  MIN_NATURAL_TIER_BY_DUNGEON_LEVEL: [1, 1, 1, 3, 4, 4, 5],
} as const;

export const TREASURE = {
  // Chest gold: rng.int(GOLD_MIN, GOLD_MAX) * dungeonLevel, plus a modest
  // character-level bonus so treasure keeps pace with a leveled-up character
  // revisiting shallow floors.
  GOLD_MIN: 10,
  GOLD_MAX: 80,
  GOLD_CHAR_LEVEL_MULT: 2,

  // Rarer, richer gemstone find: scales more steeply with dungeon depth.
  GEM_MIN: 30,
  GEM_MAX: 120,
  GEM_CHAR_LEVEL_MULT: 3,

  // Monster gold drop chance/amount (amount already scales via monster.level,
  // which itself now scales with dungeon depth).
  MONSTER_DROP_CHANCE: 0.4,
  MONSTER_DROP_MIN: 1,
  MONSTER_DROP_MAX: 15,
} as const;

// Trapped chests. Whether a chest is trapped (and with what) is fixed per
// character and chest, so leaving and coming back doesn't reroll it. Checking
// for traps leans on Wisdom; disarming leans on Dexterity.
// Wizard spells: the character level each is learned at. Lightning comes
// late because it doubles damage against every undead, the Beholder and
// two dragon colours; Poison Spray comes early because nothing is weak to it.
export const SPELLS = {
  UNLOCK_LEVEL: {
    fireball: 1,
    heal: 5,
    poison: 10,
    acid: 16,
    frost: 24,
    lightning: 35,
    banish: 40,
  },
  // Banish always works on ordinary monsters. Against very powerful ones it
  // rolls a d12 and fails on a 1..N: N by tier for tier 8+, and N for any
  // dragon or undead in the top 30% of its own level range. Asmodeus is
  // immune. One cast per hour of play time.
  BANISH_FAIL_FACES_BY_TIER: { 8: 3, 9: 5, 10: 7 } as Record<number, number>,
  BANISH_HIGH_LEVEL_FAIL_FACES: 3,
  BANISH_HIGH_LEVEL_FRACTION: 0.7,   // monster.level >= its maxLevel × this
  BANISH_COOLDOWN_SECONDS: 3600,
} as const;

export const CHEST_TRAPS = {
  CHANCE: 0.22,
  DETECT_BASE: 0.35,
  DETECT_PER_WIS: 0.025,     // WIS 10 → 60%, WIS 18 → 80%
  DISARM_BASE: 0.2,
  DISARM_PER_DEX: 0.035,     // DEX 10 → 55%, DEX 18 → 83%
  MAX_CHANCE: 0.95,
  DISARM_XP_PER_LEVEL: 10,   // small reward for a clean disarm, times dungeon level
  DEPTH_DAMAGE_SCALE: 0.35,  // trap damage grows by this fraction per dungeon level below the first
} as const;

export const GEMS = {
  // Flavor "worth" shown when a gem is found — there's no shop to sell them
  // to, so this doesn't feed gold or score, just tells the player how rare
  // what they're holding is.
  VALUES: {
    ruby: 150,
    sapphire: 200,
    diamond: 350,
    opal: 250,
  },

  // The game has no character-class system yet, so "only magicians and
  // wizards" is stood in with an INT threshold instead — about the top
  // quarter of 3d6 rolls clear it. A single knob to retune, or swap for a
  // real class check later.
  MAGIC_INT_THRESHOLD: 13,

  // Opal: (charLevel*2 + WIS/2) * randomFactor, same shape as the spells.
  OPAL_LEVEL_MULT: 2,
  OPAL_WIS_DIVISOR: 2,
  OPAL_RAND_MIN: 0.9,
  OPAL_RAND_MAX: 1.6,

  OPAL_CONFUSE_TURNS: 2,
  CONFUSION_FAIL_CHANCE: 0.5, // per confused turn, chance the monster's action is wasted
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

// Books are found (picked up into inventory, see 'book' dungeon content)
// and read later, on demand — unlike the old find-and-resolve-immediately
// design, so every read is a deliberate, always-beneficial choice rather
// than a gamble.
export const MAGIC_BOOK = {
  HEAL_FRACTION: 0.4,           // heals this fraction of max HP
  INVULNERABLE_ROUNDS: 3,       // blocks that many of the monster's combat rounds entirely
  XP_MIN_PER_LEVEL: 40,
  XP_MAX_PER_LEVEL: 100,
} as const;
