// All tuning constants live here for easy adjustment.

export const CHARACTER = {
  MAX_REROLLS: 20,
} as const;

export const GAMEPLAY = {
  REGEN_HP_EVERY_N_STEPS: 10,    // +1 HP per N steps walked (passive regen)
  LIGHT_RADIUS: 2,               // torchlight reveals squares this many steps away (through open passages) on the map
  // Resting (W) runs in real time, one tick a second, until a wandering
  // monster turns up, the player stops, or they're fully healed.
  REST_HEAL_PCT_PER_TICK: 0.015, // of max HP (at least 1) per tick
  WAIT_ENCOUNTER_GRACE: 3,       // rest ticks before wandering monster risk begins
  WAIT_ENCOUNTER_CHANCE: 0.04,   // chance per tick after grace period
  POTION_HEAL_MIN: 20,
  POTION_HEAL_MAX: 35,
  POTION_HEAL_CON_DIVISOR: 4,    // +floor(CON / 4) bonus HP per potion
  POTION_HEAL_MAX_HP_PCT: 0.30,  // +30% of max HP, so potions keep pace with high-level characters
} as const;

// Testing aids. Turn these off before the game goes out to players.
export const DEBUG = {
  SHOW_ASMODEUS_ON_MAP: true,   // level 7's map marks his lair with an A, explored or not
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
  CHESTS_MIN: 6,
  CHESTS_MAX: 10,
  BOOKS_MIN: 3,
  BOOKS_MAX: 5,
  ALTARS_MIN: 2,
  ALTARS_MAX: 4,
  FOUNTAINS_MIN: 3,
  FOUNTAINS_MAX: 5,
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
  // Fireball's level-based power never drops below this, so a new character
  // casts like a level-9 one and the first dungeon levels are survivable.
  // Higher levels outgrow it (it's a floor, so levelling up never weakens it).
  FIREBALL_MIN_LEVEL_POWER: 18,

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

  // Prayer vs powerful-but-not-undead monsters (Dragons, and
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
  // A heard prayer can banish high-level undead outright, if the character
  // is high enough in level and Wisdom. The d12 of the Banish spell still
  // decides it against the mighty (SPELLS.BANISH_FAIL_FACES_BY_TIER).
  PRAYER_BANISH_MIN_CHAR_LEVEL: 30,
  PRAYER_BANISH_MIN_WISDOM: 18,
  PRAYER_BANISH_MIN_MONSTER_LEVEL: 20,
  PRAYER_BANISH_BASE_CHANCE: 0.15,
  PRAYER_BANISH_PER_WISDOM: 0.02,     // per point of Wisdom over the minimum
  PRAYER_BANISH_PER_LEVEL: 0.005,     // per character level over the minimum
  PRAYER_BANISH_MAX_CHANCE: 0.45,

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

  // Elder vampires: any damaging hit may hypnotize; a hypnotized victim is
  // usually drained dead while helpless, otherwise snaps out as it bites.
  VAMPIRE_HYPNOSIS_MIN_LEVEL: 30,
  VAMPIRE_HYPNOSIS_CHANCE: 0.07,
  VAMPIRE_HYPNOSIS_KILL_CHANCE: 0.75,

  // Basilisk gaze / Gelatinous Cube engulf / Lich touch
  PARALYSIS_CHANCE: 0.4,
  PARALYSIS_ROUNDS: 2,          // combat rounds the character loses

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

  // Asmodeus's transformation (a Clarkson College DM original): on any of his
  // turns, this chance he turns the character into a pile of lizard excrement,
  // climbing as he's wounded (desperate). Evil magic: no saving throw, and
  // it kills however tough the character is. Only a ward already in place
  // (tome or altar) turns it aside.
  BALL_OF_DOO_CHANCE: 0.025,          // at full health
  BALL_OF_DOO_DESPERATE_CHANCE: 0.10, // as he nears death

  // Infernal Healing
  INFERNAL_HEAL_DIVISOR: 3,  // Asmodeus heals this fraction of the damage he deals

  // Infernal Regeneration: once a fight, when wounds bring Asmodeus below
  // this many HP (but not dead), he spends his turn restoring this fraction
  // of his maximum HP.
  ASMODEUS_REGEN_BELOW_HP: 150,
  ASMODEUS_REGEN_MIN: 0.25,
  ASMODEUS_REGEN_MAX: 0.50,

  // A sapphire can't banish Asmodeus from his own Hells, but it staggers him:
  // stunned this many turns, then only claws and tail for this many more.
  ASMODEUS_SAPPHIRE_STUN_TURNS: 3,
  ASMODEUS_SAPPHIRE_PHYSICAL_TURNS: 2,
  // The Banish spell does the same, a little weaker.
  ASMODEUS_BANISH_STUN_TURNS: 2,
  ASMODEUS_BANISH_PHYSICAL_TURNS: 1,
  // While he's stunned, a weapon blow lands this often, whatever the roll.
  ASMODEUS_STUNNED_HIT_CHANCE: 0.95,

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
  // Skeleton) is unaffected while tier-7/8 threats (dragons, Lich, the Hollow Choir)
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

  // A few ordinary monsters may break the hard cap, but only this deep:
  // the dragons, the Sanguinid (75 on level 6, 85 on 7), the Phoenix and the Frost Giant can
  // climb as high as their own maxLevel on dungeon levels 6 and 7, rolled
  // like any other level.
  EXTENDED_CAP_TYPES: ['Black Dragon', 'Green Dragon', 'Blue Dragon', 'White Dragon', 'Red Dragon', 'Gold Dragon', 'Sanguinid', 'Phoenix', 'Frost Giant', 'Pit Fiend', 'Balor', 'Marilith'] as string[],
  EXTENDED_CAP_MIN_DEPTH: 6,
  // ...optionally a lower ceiling than maxLevel on a given depth.
  EXTENDED_CAP_BY_DEPTH: {
    // Dragons reach 75 on level 6; on level 7, 95 (Green, Red), 100 (White),
    // or 120 (Black, Blue: their maxLevel).
    'Black Dragon': { 6: 75 }, 'Green Dragon': { 6: 75 }, 'Blue Dragon': { 6: 75 },
    'White Dragon': { 6: 75 }, 'Red Dragon': { 6: 75 }, 'Gold Dragon': { 6: 75 },
    Sanguinid: { 6: 75 },
    Phoenix: { 6: 62 },
    'Frost Giant': { 6: 75 },
  } as Record<string, Record<number, number>>,
  // ...and a few whose rolls can reach past the depth's usual top, so their
  // highest levels actually turn up.
  EXTENDED_RANGE_TOP: {
    'Black Dragon': { 7: 120 }, 'Blue Dragon': { 7: 120 },
  } as Record<string, Record<number, number>>,

  // Random-encounter monster TYPE eligibility by dungeon depth (index 0 =
  // dungeon level 1): a floor on naturalTier, on top of each monster's own
  // minDungeonLevel. Leveling up a Kobold's stats (via LEVEL_RANGE_BY_
  // DUNGEON_LEVEL above) still leaves it a Kobold — this keeps low-tier
  // fodder types from randomly turning up on the deep floors once tougher
  // types have unlocked, so "low level monster" means the type, not just
  // the stat block.
  MIN_NATURAL_TIER_BY_DUNGEON_LEVEL: [1, 1, 1, 3, 4, 4, 5],
  // ...except these, which turn up at any depth (orc war-bands roam
  // everywhere; deep down they're veterans, as high as the type's maxLevel).
  ANY_DEPTH_TYPES: ['Orc', 'Ghoul'] as string[],
  // ...and of those, these are rare from this depth down: picked, then kept
  // only this often (otherwise something else is picked instead).
  DEEP_RARE: { Ghoul: { fromDepth: 6, keep: 0.35 }, 'Hollow Choir': { fromDepth: 1, keep: 0.4 } } as Record<string, { fromDepth: number; keep: number }>,
} as const;

// A dragon's hoard: a chest that sometimes appears where a dragon falls
// (always for the great uniques), opened once. Amounts scale with the
// dragon's level; tough dragons may also guard one singular magic item.
export const HOARD = {
  CHANCE: 0.5,
  GOLD_MIN: 30, GOLD_MAX: 90,             // × the dragon's level
  STONES_MIN: 1, STONES_MAX: 4,           // gemstones, each worth...
  STONE_MIN: 15, STONE_MAX: 45,           // ...this × the dragon's level, in gold
  MAGIC_GEMS_MIN: 1, MAGIC_GEMS_MAX: 3,
  ITEM_FROM_LEVEL: 20,                    // dragons this tough may guard a singular item...
  ITEM_CHANCE: 0.5,                       // ...this often (the great uniques always do)
} as const;

// The Borak: a star ruby ring that fires a beam of searing light, once a
// fight. Damage: the monster's level × d6+4, times how well it stands up to
// light (undead burn; creatures of light, mirror-bright and void things
// shrug much of it off).
export const BORAK = {
  PER_LEVEL_MIN: 5, PER_LEVEL_MAX: 10,
  LIGHT: {
    'Vampire': 1.75, 'Nightwalker': 1.75, 'Spectre': 1.75, 'Wight': 1.75, 'Banshee': 1.75,
    'Aboleth': 1.3, 'Mold': 1.3, 'Slime Mold': 1.3, 'Cerebrovore': 1.2,
    'Phoenix': 0.5, 'Unicorn': 0.5, 'Gelatinous Cube': 0.5, 'Hollow Choir': 0.5, 'Djinn': 0.6,
    'Gold Dragon': 0.6, 'Iron Golem': 0.6, 'Pit Fiend': 0.8, 'Balor': 0.8, 'Marilith': 0.8, 'Erinyes': 0.8,
    'Asmodeus': 0.4,
  } as Record<string, number>,
  UNDEAD: 1.5,       // any other undead
} as const;

export const TREASURE = {
  // Chest gold: rng.int(GOLD_MIN, GOLD_MAX) * dungeonLevel, plus a modest
  // character-level bonus so treasure keeps pace with a leveled-up character
  // revisiting shallow floors.
  GOLD_MIN: 10,
  GOLD_MAX: 80,
  GOLD_CHAR_LEVEL_MULT: 2,
  // ...and a flat amount on top, the same at every depth: it roughly doubles
  // a shallow chest and adds a little to a deep one.
  GOLD_BONUS_MIN: 25,
  GOLD_BONUS_MAX: 75,

  // Rarer, richer gemstone find: scales more steeply with dungeon depth.
  GEM_MIN: 30,
  GEM_MAX: 120,
  GEM_CHAR_LEVEL_MULT: 3,

  // Monster gold drop chance/amount (amount already scales via monster.level,
  // which itself now scales with dungeon depth).
  MONSTER_DROP_CHANCE: 0.5,
  MONSTER_DROP_MIN: 1,
  MONSTER_DROP_MAX: 15,
  MONSTER_DROP_BONUS_MIN: 5,      // plus a flat amount (most felt early on)
  MONSTER_DROP_BONUS_MAX: 20,
} as const;

// Trapped chests. Whether a chest is trapped (and with what) is fixed per
// character and chest, so leaving and coming back doesn't reroll it. Checking
// for traps leans on Wisdom; disarming leans on Dexterity.
// Wizard spells: the character level each is learned at. Lightning comes
// late because it doubles damage against every undead and
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
    'stilled-hour': 80,
  },
  // A caster without the wits for it can lose control of an offensive spell
  // (Fireball, Poison Spray, Acid, Frost, Lightning): it turns on them.
  // Below this Intelligence, each point short adds to the chance, up to the max.
  BACKFIRE_INT_BELOW: 12,
  BACKFIRE_PER_POINT: 0.05,
  BACKFIRE_MAX: 0.5,
  WARRIOR_UNLOCK_LEVEL: {
    'power-attack': 1,
    'shield-bash': 8,
    heal: 12,
    cleave: 16,
    fireball: 20,
    'battle-cry': 24,
    whirlwind: 35,
  },
  // Banish always works on ordinary monsters. Against very powerful ones it
  // rolls a d12 and fails on a 1..N: N by tier for tier 8+, and N for any
  // dragon or undead in the top 30% of its own level range. Asmodeus is
  // immune. One cast per hour of play time.
  BANISH_FAIL_FACES_BY_TIER: { 8: 3, 9: 5, 10: 7 } as Record<number, number>,
  BANISH_HIGH_LEVEL_FAIL_FACES: 3,
  BANISH_HIGH_LEVEL_FRACTION: 0.7,   // monster.level >= its maxLevel × this...
  BANISH_HIGH_LEVEL_MAX: 60,          // ...or this, whichever is lower (so deep dragons count)
  BANISH_COOLDOWN_SECONDS: 3600,
  // The Stilled Hour (wizards from level 80): time stops for the monster for
  // d5+3 turns. It can't act and every blow lands. From the 4th still turn
  // it can't breathe, and suffocates, harder each turn (a share of its full
  // health). Things that don't breathe don't suffocate; Asmodeus is held
  // half as long and never does. The price: you age (Strength and Dexterity
  // down for a long while), and it's once per hour of play.
  STILLED_HOUR: {
    TURNS_MIN: 4, TURNS_MAX: 8,
    BREATH_TURNS: 3,
    SUFFOCATE_STEP: 0.06,          // 6%, 12%, 18%... of full health
    COOLDOWN_SECONDS: 3600,
    AGE_STATS: 3, AGE_STEPS: 300,  // −3 STR and DEX for 300 steps
    ASMODEUS_RESIST_CHANCE: 0.33,  // he throws it off entirely; otherwise he's held half as long
  },
  // Planar Step: wizards from this level step to any level they've visited
  // (never in battle). Choose within the time, or the spell chooses: a
  // random visited level, at a random spot. A moonstone gives anyone one cast.
  PLANAR_STEP_LEVEL: 60,
  PLANAR_STEP_SECONDS: 20,
} as const;

// Warriors trade most spells for more swings and combat skills, and are
// tougher. Their skills unlock by level (SPELLS.WARRIOR_UNLOCK_LEVEL).
export const WARRIOR = {
  ATTACKS_EVERY_N_LEVELS: 10,      // 1 swing, 2 at level 10, 3 at 20...
  MAX_ATTACKS: 5,
  EXTRA_SWING_HIT_PENALTY: 2,      // each swing after the first is this much harder to land
  STR_DAMAGE_DIVISOR: 1.5,         // wizards use COMBAT.DAMAGE_STR_DIVISOR (2)
  HIT_BONUS: 5,                    // weapon mastery: added to every swing's to-hit roll
  HP_BONUS_START: 8,
  HP_BONUS_PER_LEVEL: 3,
  DAMAGE_TAKEN_MULT: 0.85,
  GEM_LEVEL: 35,                   // gems need no INT, but only from this level
  SPELL_POWER: 0.6,                // a warrior's Heal and Fireball, vs a wizard's

  POWER_ATTACK_MULT: 2.2,
  POWER_ATTACK_HIT_PENALTY: 4,
  SHIELD_BASH_MULT: 0.8,
  SHIELD_BASH_STUN_CHANCE: 0.4,
  CLEAVE_MULT: 1.3,
  CLEAVE_BIG_MULT: 2.0,            // against monsters of CLEAVE_BIG_TIER or higher
  CLEAVE_BIG_TIER: 6,
  BATTLE_CRY_ROUNDS: 3,
  BATTLE_CRY_MULT: 1.5,
  WHIRLWIND_EXTRA_SWINGS: 2,
  WHIRLWIND_MULT: 0.8,
} as const;

// Unique monsters felt before they're met (presence.ts). Chances are per step.
export const PRESENCE = {
  // At his very door (within this many squares, in any direction, on level 7)
  // Asmodeus taunts and lashes out far more often. His attacks there allow a
  // saving roll (d20 + Wisdom and Resistance bonuses) for half damage, no curse.
  ASMODEUS_DOOR_RADIUS: 3,
  ASMODEUS_SIGHT_RANGE: 3,                // straight down a passage, at least this far
  ASMODEUS_THRONE_VIEW: 25,               // his throne can be seen from up to this far, with a clear line of sight
  ASMODEUS_DOOR_TAUNT_CHANCE: 0.45,
  ASMODEUS_DOOR_ATTACK_CHANCE: 0.25,
  ASMODEUS_DOOR_SAVE_DC: 16,
  ASMODEUS_DOOR_DAMAGE: 0.18,             // share of max HP on a failed save (never fatal)
  ASMODEUS_DOOR_CURSE_CHANCE: 0.5,        // on a failed save
  ASMODEUS_VOICE_CHANCE: 1 / 150,         // any level
  ASMODEUS_ATTACK_MIN_LEVEL: 4,
  ASMODEUS_ATTACK_CHANCE: 1 / 600,        // levels 4-6
  ASMODEUS_ATTACK_CHANCE_DEEPEST: 1 / 300, // level 7
  ASMODEUS_PROXIMITY_RANGE: 60,           // on level 7, fury peaks at his lair and fades over this many squares
  ASMODEUS_DEBILITATE_FURY: 0.85,         // at or above this, hellfire and a curse land together
  LAIR_FLAVOR_CHANCE: 0.03,               // on a level with a living unique
  DRACOLICH_FEAR_CHANCE: 0.006,           // x2 within MID, x3 within NEAR of its lair
  FEAR_RESIST_BASE: 0.1,
  FEAR_RESIST_PER_WIS: 0.02,
  FEAR_RESIST_MAX: 0.6,
  FEAR_DEX_LOSS: 8,
  FEAR_DEX_TURNS: 30,
  NEAR: 12,                               // squares walked from a lair
  MID: 30,
} as const;

// All traps (corridor and chest) get harder to disarm deeper down. A
// teleport trap's jump is a gamble: an ambush, a rough landing, or clean.
// The first dungeon level looks after new adventurers: chests there often
// hold potions, and altars there mostly heal.
export const FIRST_LEVEL = {
  CHEST_EXTRA_POTION_CHANCE: 0.25,
  ALTAR_HEAL_CHANCE: 0.55,     // share of altar blessings that heal (0.30 elsewhere)
} as const;

// Ghouls: common on levels 2-5, rare deeper, where the ancient ones can be
// very powerful. Their hits can bring flesh rot, a disease that eats a few
// HP every step and halves all healing until it burns itself out.
export const GHOUL = {
  ROT_CHANCE_CLAW: 0.15,
  ROT_CHANCE_BITE: 0.25,
  ROT_LEVELS_PER_DAMAGE: 8,     // damage per step = ghoul level / this (at least 2)
  ROT_STEPS: 40,
  ANCIENT_LEVEL: 40,            // at or above, an ancient ghoul: its own intro, and a longer rot
  ANCIENT_ROT_STEPS: 70,
  ROT_HEAL_FACTOR: 0.5,
  // It eats one body part, a stage further each step or combat round. Too far
  // into that part, and death follows two turns later (a warning between).
  ROT_PARTS: ['left arm', 'right arm', 'left leg', 'right leg', 'head'],
  ROT_FATAL_LIMB: 45,
  ROT_FATAL_HEAD: 30,
  ROT_REINFECT_STAGES: 10,      // another ghoul hit while rotting
  ROT_PUSHBACK_POTION: 6,       // a potion beats it back this many stages
  ROT_PUSHBACK_HEAL: 8,         // ...and the Heal spell this many
  ROT_DOOM_TURNS: 2,
} as const;

// The Titanoboa (level 7): a snake longer than a corridor. It bites, slams
// with its tail, or coils around you; once coiled, every turn it crushes,
// with a small chance of killing outright. Strength helps you wriggle free.
export const TITANOBOA = {
  BITE_WEIGHT: 30, BITE_MULT: 1.3,
  SLAM_WEIGHT: 25, SLAM_MULT: 1.0,
  COIL_WEIGHT: 45, COIL_MULT: 0.6, COIL_ROUNDS_MIN: 2, COIL_ROUNDS_MAX: 3,
  CRUSH_MULT: 1.1,
  CRUSH_DEATH_CHANCE: 0.05,     // per crushing turn
  CRUSH_DEATH_STRONG: 0.025,    // ...halved with Strength at least STRONG_STRENGTH
  STRONG_STRENGTH: 20,
  BREAK_FREE_PER_STRENGTH: 0.015, BREAK_FREE_MAX: 0.5,   // chance per held round to wriggle free
} as const;

// The Wendigo (level 7): a gaunt spirit of hunger and winter. It knits its
// wounds every turn unless fire has touched it lately.
export const WENDIGO = {
  REGEN: 0.06,                  // of max HP, each of its turns
  BURN_STOPS_REGEN_TURNS: 2,    // after a Fireball
  CLAW_WEIGHT: 40, CLAW_MULT: 1.0, NUMB_DEX: 3, NUMB_TURNS: 12,
  BITE_WEIGHT: 35, BITE_MULT: 1.3, BITE_FEED: 0.5,   // heals this share of the bite
  HOWL_WEIGHT: 25, HOWL_MULT: 0.5, HOWL_FEAR_CHANCE: 0.5,
} as const;

// The Djinn: floats on a wisp of smoke; dust storms, a ruby ray, crushing
// punches, and a choking tail. Badly beaten, it may teleport away.
export const DJINN = {
  DUST_WEIGHT: 25, DUST_MULT: 0.8, DUST_DEX: 4, DUST_TURNS: 10,
  RUBY_WEIGHT: 25, RUBY_MULT: 1.4,
  PUNCH_WEIGHT: 30, PUNCH_MULT: 1.3, PUNCH_STUN_CHANCE: 0.3,
  CHOKE_WEIGHT: 20, CHOKE_MULT: 0.6, CHOKE_ROUNDS: 2, CHOKE_SQUEEZE_MULT: 0.9,
  FLEE_BELOW: 0.2, FLEE_CHANCE: 0.35,
} as const;

// The Phoenix: several blows a turn, a flash burn, and a screech that holds
// you in terror for 3 turns while it keeps attacking. Rises once from its ashes.
export const PHOENIX = {
  FLURRY_WEIGHT: 50, FLURRY_MIN: 2, FLURRY_MAX: 3, FLURRY_MULT: 0.6,
  FLARE_WEIGHT: 30, FLARE_MULT: 1.9,
  SCREECH_WEIGHT: 20, SCREECH_MULT: 0.3, SCREECH_TURNS: 3,
  REBIRTH_HP: 0.4,
} as const;

// The Banshee: a wail of death, a draining touch, a dread whisper and a
// spectral bolt. It can turn invisible for 2 turns (can't be attacked, but
// still acts), then must wait 6 more before it can again.
export const BANSHEE = {
  WAIL_WEIGHT: 20, WAIL_MULT: 1.2, WAIL_SAVE_BASE: 0.45, WAIL_SAVE_PER_CON: 0.01, WAIL_SAVE_PER_WIS: 0.01, WAIL_FAIL_SHARE: 0.5,
  TOUCH_WEIGHT: 40, TOUCH_MULT: 1.0, TOUCH_HEAL: 0.5,
  WHISPER_WEIGHT: 20, WHISPER_MULT: 0.4,
  BOLT_WEIGHT: 20, BOLT_MULT: 1.3,
  INVIS_CHANCE: 0.35, INVIS_TURNS: 2, INVIS_COOLDOWN: 6,
} as const;

// The Unicorn: gore, hooves and a radiant horn. Offer your hand (a Charisma
// and Wisdom roll) and it may bless and cure you instead. Slaying one curses you.
export const UNICORN = {
  GORE_WEIGHT: 40, GORE_MULT: 1.5, GORE_BLEED_CHANCE: 0.4,
  HOOVES_WEIGHT: 35, HOOF_MULT: 0.7,
  RADIANT_WEIGHT: 25, RADIANT_MULT: 1.3,
  PET_BASE: 0.15, PET_PER_CHA: 0.02, PET_PER_WIS: 0.015, PET_MAX: 0.85,
  CURSE_STATS: 3, CURSE_STEPS: 150,
} as const;

// The Frost Giant: one of the toughest things in the dungeon. Ice in every
// blow; it can freeze you solid; badly hurt, it rages and strikes twice a turn.
export const FROST_GIANT = {
  AXE_WEIGHT: 30, AXE_MULT: 1.4,
  BOULDER_WEIGHT: 20, BOULDER_MULT: 1.7,
  SHARDS_WEIGHT: 20, SHARDS: 3, SHARD_MULT: 0.6,
  STOMP_WEIGHT: 15, STOMP_MULT: 1.0, STOMP_DEX: 4, STOMP_TURNS: 12,
  GRASP_WEIGHT: 15, GRASP_MULT: 0.8, GRASP_ROUNDS: 2,
  RAGE_BELOW: 0.3,
} as const;

// The Gold Dragon: a wallop with a sack of gold, claws and bite, a breath of
// choking gold dust (a small chance of asphyxiation, no saving roll), and a
// gilding spell (a saving roll, or you're a solid gold statue).
export const GOLD_DRAGON = {
  WALLOP_WEIGHT: 35, WALLOP_MULT: 1.9, WALLOP_COINS_MIN: 5, WALLOP_COINS_MAX: 40,
  CLAW_WEIGHT: 25, CLAW_MULT: 1.1,
  DUST_WEIGHT: 25, DUST_MULT: 1.5, ASPHYXIATION_CHANCE: 0.03,
  GILD_WEIGHT: 15, GILD_DC: 15, GILD_MULT: 1.2, GILD_ROUNDS: 2,
} as const;

// The Manticore's fighting (combat.ts, manticoreAction). Each turn it picks
// one attack by weight.
export const MANTICORE = {
  BITE_WEIGHT: 25, BITE_MULT: 1.7,
  CLAWS_WEIGHT: 30, CLAW_MULT: 0.7,                 // two strikes
  TAIL_WEIGHT: 25, TAIL_MULT: 1.0, TAIL_CRIT_CHANCE: 0.2, TAIL_CRIT_MULT: 2.5,
  STING_WEIGHT: 20, STING_MULT: 0.6,
  POISON_DAMAGE: 6, POISON_TURNS: 10,               // a nastier poison than most
  ANAPHYLAXIS_CHANCE: 0.05,
  ANAPHYLAXIS_MIN_SECONDS: 180,                     // death comes within five minutes of play
  ANAPHYLAXIS_MAX_SECONDS: 300,
} as const;

// The Orc King's fighting (combat.ts, orcKingAction). Each turn he picks
// one of these by weight; the war-chant only when he's hurt.
export const ORC_KING = {
  FLURRY_WEIGHT: 35, FLURRY_SWINGS_MIN: 2, FLURRY_SWINGS_MAX: 3, FLURRY_SWING_MULT: 0.65,
  SHIELD_SLAM_WEIGHT: 15, SHIELD_SLAM_MULT: 0.8, SHIELD_SLAM_DAZE_CHANCE: 0.5,
  WAR_CHANT_WEIGHT: 12, WAR_CHANT_BELOW: 0.6, WAR_CHANT_HEAL_MIN: 0.10, WAR_CHANT_HEAL_MAX: 0.18,
  CURSE_WEIGHT: 10, CURSE_STRENGTH: 4, CURSE_TURNS: 20,
  EYE_WEIGHT: 10, EYE_MULT: 1.3,   // the Eye of Gruumsh: a bolt of searing red fire
  BLOW_WEIGHT: 30,                 // a plain, heavy axe blow
  ARMOR: 0.30,                     // his black plate turns aside this share of every hit's damage
} as const;

// Scare: frighten a monster off instead of fighting or fleeing. No XP, no
// price. Mindless things can't be scared, and great lords only laugh.
export const SCARE = {
  BASE_CHANCE: 0.30,
  PER_LEVEL: 0.03,          // per level the character has over the monster (or under, negative)
  PER_CHARISMA: 0.02,       // per point of Charisma over 10
  PER_TIER: 0.04,           // minus this per point of the monster's natural tier
  OUTCLASSED_BONUS: 0.30,   // the monster is under half the character's level
  REPEAT_PENALTY: 0.15,     // each failed attempt this fight makes the next harder
  MIN_CHANCE: 0.02,
  MAX_CHANCE: 0.95,
} as const;

// A successful run: the character bolts along real passages, farther the
// scarier the monster, and pays for it. A trap on the way goes off.
export const FLEE = {
  MIN_STEPS: 3,
  RANDOM_EXTRA: 3,           // plus 0..this
  PER_TIER: 1,               // plus the monster's natural tier (1 kobold .. 10 Asmodeus)
  LEVELS_ABOVE_PER_STEP: 5,  // plus 1 per this many levels the monster has over the character
  MAX_STEPS: 25,
  AWAY_WEIGHT: 3,            // a step that gets farther from the monster is this much likelier
  GOLD_DROP_MIN: 0.05,       // share of gold that spills from the pack
  GOLD_DROP_MAX: 0.12,
  POTION_BREAK_CHANCE: 0.25,
  WINDED_DEX: 3,             // Dexterity lost while catching your breath...
  WINDED_STEPS: 20,          // ...for this many steps
} as const;

// Stepping into a great lair (content/lair-text.ts) stops you at its edge.
// Turning back or charging in is a d20 roll plus a Dexterity bonus.
export const LAIR = {
  TURN_BACK_DC: 14,   // fail, and you're dragged in and struck first
  CHARGE_DC: 12,      // make it, and your first blow goes unanswered; fail, and you're struck first
  SNEAK_DC: 16,       // make it, and your first blow lands from the shadows, unanswered and doubled; fail, and you're struck first
  ASMODEUS_DISMISS_CHANCE: 0.15,  // on stepping into his lair: he can't be bothered, and flings you elsewhere on the level
  DEX_BONUS_MAX: 5,   // bonus = (Dexterity - 10) / 2, rounded down, capped here
} as const;

export const TRAPS = {
  DISARM_DEPTH_PENALTY: 0.04,   // per dungeon level below the first
  DISARM_MIN: 0.05,
  TELEPORT_AMBUSH_CHANCE: 0.25,
  TELEPORT_ROUGH_CHANCE: 0.15,
  TELEPORT_ROUGH_DAMAGE_MIN: 0.03,   // of max HP
  TELEPORT_ROUGH_DAMAGE_MAX: 0.08,
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

// The Hollow Choir (an original creature): five funerary masks around a void.
// Its three powers are foreshadowed a turn ahead (a mask prepares, then the
// power lands on its next turn), giving one chance to respond. Masks shatter
// as it weakens, each taking its power with it; the rest grow fiercer.
export const CHOIR = {
  // Which mask breaks, at what share of the Choir's health left (in order).
  BREAKS: [['dread', 0.8], ['delight', 0.55], ['grief', 0.3]] as [string, number][],
  POWER_MASK: { lament: 'grief', unmaking: 'blank', 'false-joy': 'delight' } as Record<string, string>,
  PREPARE_CHANCE: 0.4,          // chance a turn is spent preparing a power...
  PREPARE_PER_BROKEN: 0.06,     // ...rising as masks break
  FURY_PER_BROKEN: 0.12,        // the rest strike harder, per broken mask
  LAMENT_MULT: 1.8,             // the Lament: a heavy blow (a Wisdom save halves it)
  SAVE_DC_BASE: 10,             // d20 + attribute/3 + level/5 against this + Choir level/3
  UNMAKE_DEX: 5,                // Unmaking: Dexterity (and so defence) lost...
  UNMAKE_TURNS: 4,              // ...for this many turns
  JOY_MULT: 0.9,                // False Joy: drains this much of a blow...
  JOY_HEAL_SHARE: 0.8,          // ...and the Choir regains this share of it
} as const;

// Trading: the Trading Post beside the entrance on level 1 (stock changes
// each visit), and a rare wandering Peddler on the deep levels, gone once
// you walk away. Gems sell at their stated worth; gear at a share of its price.
export const SHOP = {
  POTION_PRICE: 60,
  TOME_PRICE: 450,
  GEM_BUY_MULT: 2,                     // buying a gem costs twice its worth
  GEAR_BASE: { dagger: 80, sword: 220, axe: 280, mace: 200, leather: 140, chain: 340, plate: 700, shield: 160 } as Record<string, number>,
  PLUS_PRICE: [1, 3, 8, 20],           // price multiplier for +0 / +1 / +2 / +3
  SELL_SHARE: 0.4,                     // gear sells for this share of its price
  POST_GEAR: 3,                        // weapons/armour on offer at the Trading Post
  PEDDLER_FROM_LEVEL: 5,
  PEDDLER_CHANCE: 0.004,               // per step, on those levels
  PEDDLER_MARKUP: 2.5,
  // The level 4 store keeps shifts (in seconds of play): open a while, then
  // shuttered until the next; and now and then a monster eats the proprietor,
  // so that shift never opens at all.
  OUTPOST_LEVEL: 4,
  SHIFT_OPEN_SECONDS: 720,
  SHIFT_CLOSED_SECONDS: 300,
  EATEN_CHANCE: 0.2,
} as const;

// Weapons and armour, +0 to +3, found in chests and on fallen monsters.
// You automatically fight with the best weapon for your class, and wear the
// best armour and shield. Wizards: daggers and leather only.
export const GEAR = {
  CHEST_CHANCE: 0.05,          // a chest holds a weapon or armour this often
  DROP_CHANCE: 0.06,           // a fallen monster leaves one this often...
  DROP_CHANCE_TOUGH: 0.12,     // ...or this often if it's a tough one (tier 6+)
  MAX_WEAPONS: 6,
  MAX_ARMOR: 6,
  // Odds of +0 / +1 / +2 / +3 by dungeon level (deeper, better).
  PLUS_ODDS: [[1, [50, 35, 12, 3]], [3, [35, 35, 22, 8]], [5, [22, 33, 30, 15]]] as [number, number[]][],
  HIT_PER_PLUS: 2,             // added to the attack roll per plus
  DAMAGE_PER_PLUS: 0.15,       // extra damage per plus
  // Rakshasas: share of a blow that lands, by the weapon's plus. Only a +3 strikes fully.
  RAKSHASA_BY_PLUS: [0.25, 0.5, 0.75, 1],
  // Weapon kinds: damage (against fighting without one), to-hit, who can use them.
  WEAPONS: {
    dagger: { damage: 1.0, warriorDamage: 0.85, hit: 1, wizard: true },
    sword:  { damage: 1.12, hit: 0 },
    axe:    { damage: 1.25, hit: -2 },
    mace:   { damage: 1.06, hit: 0, crushes: 1.35 },   // crushes undead, golems and stone
  } as Record<string, { damage: number; warriorDamage?: number; hit: number; wizard?: boolean; crushes?: number }>,
  // Armour: share of a monster's blow turned aside (half of that against magic and breath), and Dexterity lost.
  ARMOR: {
    leather: { cut: 0.07, dex: 0, wizard: true },
    chain:   { cut: 0.13, dex: 1 },
    plate:   { cut: 0.2, dex: 2 },
    shield:  { cut: 0.05, dex: 0 },
  } as Record<string, { cut: number; dex: number; wizard?: boolean }>,
  ARMOR_PER_PLUS: 0.03,
  SHIELD_PER_PLUS: 0.02,
  MAX_CUT: 0.45,
  MAGIC_SHARE: 0.5,            // against spells and breath, armour does half as much
  NAMES: {
    dagger: ['dagger', 'dirk', 'stiletto', 'kris'],
    sword: ['longsword', 'broadsword', 'bastard sword', 'sabre'],
    axe: ['battleaxe', 'greataxe', 'bearded axe'],
    mace: ['flanged mace', 'morningstar', 'warhammer'],
    leather: ['leather armour', 'studded leather', 'hide armour'],
    chain: ['chain mail', 'ring mail', 'scale mail'],
    plate: ['plate armour', 'half-plate', 'banded mail'],
    shield: ['round shield', 'kite shield', 'tower shield'],
  } as Record<string, string[]>,
  MAKERS: { 1: ['runed', 'silvered', 'keen'], 2: ['moonsilver', 'dwarf-forged', 'starsteel'], 3: ['saint-blessed', 'elder-forged', 'wardbreaking'] } as Record<number, string[]>,
} as const;

// Magic amulets: one worn at a time, +1 to +3 to one attribute, or as much
// off it if cursed (and then it won't come off until a fountain, an altar or
// an emerald breaks the curse; the amulet crumbles as it does).
export const AMULETS = {
  CHEST_CHANCE: 0.04,     // a chest holds one this often
  CURSE_CHANCE: 0.25,
  BONUS_MIN: 1,
  BONUS_MAX: 3,
  MAX_CARRIED: 5,         // with this many, chests hold no more
  CURSED_BREAK_CHANCE: 0.01,   // per turn worn (a step, or a round of a fight), a cursed amulet may snap
  LOOKS: ['jade', 'bone', 'silver', 'obsidian', 'amber', 'moonstone', 'bronze', 'ivory', 'garnet', 'jet'],
} as const;

// Magic rings (content/rings.ts). Many can be worn, only one used at a time.
// A warding ring works while it's the one in use; changing rings mid-fight
// costs the turn (free while exploring).
export const RINGS = {
  FIRE_WARD: 0.75,      // ruby: this much of any fire damage is turned aside
  COLD_WARD: 0.75,      // aquamarine: likewise for cold
  EVIL_WARD: 0.5,       // onyx: this much of the damage evil creatures deal, and their fear and charms fail
  UNDEAD_WARD: 0.5,     // rose quartz: this much of the damage undead deal, and their level drain fails
  BACKFIRE_FRACTION: 0.5,   // green diamond: the monster takes this share of what its backfired attack would have done
  STAR_CHARGES: 3,      // star sapphire: teleports per ring before it crumbles
  // Who counts as evil, for the onyx ring.
  EVIL_MONSTERS: [
    'Asmodeus', 'Tiamat', 'Pit Fiend', 'Balor', 'Marilith', 'Erinyes', 'Rakshasa',
    'Black Dragon', 'Green Dragon', 'Blue Dragon', 'White Dragon', 'Red Dragon', 'Dracolich',
    'Hollow Choir', 'Death Tyrant', 'Cerebrovore', 'Aboleth', 'Elder Oblex', 'Nightwalker',
    'Lich', 'Caput Mortuum', 'Vampire', 'Death Knight', 'Wizard', 'Medusa', 'Doppelganger',
    'Orc King', 'Wendigo', 'Banshee',
  ] as string[],
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
    emerald: 300,
    moonstone: 500,
  },

  // Emerald: a ward that lasts a few fights and deflects most, not all,
  // attacks, Asmodeus's transformation included. Rarer than other gems.
  EMERALD_DEFLECT_CHANCE: 0.6,
  EMERALD_FIGHTS_MIN: 3,
  EMERALD_FIGHTS_MAX: 5,
  EMERALD_MAX_FIGHTS: 10,             // wards stack up to this
  EMERALD_FIND_BASE: 0.08,            // share of gem finds that are emeralds, plus...
  EMERALD_FIND_PER_LEVEL: 0.04,       // ...this per dungeon level
  MOONSTONE_FIND_SHARE: 0.06,         // share of gem finds that are moonstones (Planar Step, once)

  // The game has no character-class system yet, so "only magicians and
  // wizards" is stood in with an INT threshold instead — about the top
  // quarter of 3d6 rolls clear it. A single knob to retune, or swap for a
  // real class check later.
  MAGIC_INT_THRESHOLD: 13,

  // Opal: (charLevel*2 + WIS/2) * randomFactor, same shape as the spells,
  // but wildly uneven: anywhere from a fizzle to 6× its old best (1.6).
  // (Was 0.5-12.8; toned down by a quarter.)
  OPAL_LEVEL_MULT: 2,
  OPAL_WIS_DIVISOR: 2,
  OPAL_RAND_MIN: 0.375,
  OPAL_RAND_MAX: 9.6,

  // A character never carries more than this many of these gems. While
  // they have the most they can carry, chests mysteriously never hold more.
  CARRY_CAP: { opal: 3, emerald: 3 } as Partial<Record<'ruby' | 'sapphire' | 'diamond' | 'opal' | 'emerald' | 'moonstone', number>>,
  // Opals are semi-common: a chest holds one this often, on top of the
  // general gem find (where they're also weighted up).
  OPAL_CHEST_CHANCE: 0.05,
  OPAL_GEM_WEIGHT: 2,     // vs 1 each for ruby, sapphire, diamond

  OPAL_CONFUSE_TURNS: 2,
  OPAL_BACKFIRE_CHANCE: 0.02,   // the blast turns on the one who loosed it
  CONFUSION_FAIL_CHANCE: 0.5, // per confused turn, chance the monster's action is wasted
} as const;

export const DEATH = {
  GOLD_LOSS_FRACTION: 0.15,
  ASMODEUS_REVIVE_LEVEL: 6,
  // Each time a character banishes Asmodeus, every other monster they meet,
  // on every level, is this many levels higher (cumulative).
  WORLD_BOOST_PER_VICTORY: 20,            // revived after Asmodeus kills you: somewhere on this dungeon level
  ASMODEUS_GOLD_LOSS_FRACTION: 0.05,   // killed by Asmodeus: less gold, but a level drained instead of XP
  XP_LOSS_FRACTION: 0.10,   // of total XP, but never below the current level's threshold
} as const;

export const SCORING = {
  XP_MULT: 1,
  GOLD_MULT: 2,
  MONSTER_MULT: 50,
  UNIQUE_MULT: 500,
  ASMODEUS_BONUS: 10000,
  DEATH_PENALTY: 200,
  TREASURE_POINTS: 100,   // each Zork treasure found
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
  // How likely each effect is. Cleanse only comes up when the character has
  // something to cleanse; otherwise its share goes to the rest.
  EFFECT_WEIGHTS: {
    attribute: 40, experience: 15, healing: 15, invulnerability: 15, 'map-reveal': 15, cleanse: 20,
  } as Record<string, number>,
  HEAL_FRACTION: 0.4,           // heals this fraction of max HP
  INVULNERABLE_ROUNDS: 3,       // blocks that many of the monster's combat rounds entirely
  XP_MIN_PER_LEVEL: 40,
  XP_MAX_PER_LEVEL: 100,
} as const;
