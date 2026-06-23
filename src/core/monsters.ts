import type { Monster, MonsterDefinition, MonsterType } from './types.js';
import type { RNG } from './random.js';
import { MONSTER_SCALING } from './config.js';

const DEFINITIONS: Record<MonsterType, MonsterDefinition> = {
  'Kobold': {
    type: 'Kobold', isUndead: false, isUnique: false,
    minLevel: 1, maxLevel: 6, naturalTier: 1, minDungeonLevel: 1, speed: 1.2,
    baseHpPerLevel: 4, baseAttackPerLevel: 1.5, baseDefensePerLevel: 0.8,
    fireballResistance: 1.0,
    encounterIntro: ['A scaly little creature leaps from the shadows.', '', 'You have encountered a Level {LVL} Kobold!'],
    specialAbilities: [],
  },
  'Goblin': {
    type: 'Goblin', isUndead: false, isUnique: false,
    minLevel: 1, maxLevel: 8, naturalTier: 1, minDungeonLevel: 1, speed: 1.1,
    baseHpPerLevel: 5, baseAttackPerLevel: 1.8, baseDefensePerLevel: 1.0,
    fireballResistance: 1.0,
    encounterIntro: ['A goblin grins at you with yellow teeth.', '', 'You have encountered a Level {LVL} Goblin!'],
    specialAbilities: [],
  },
  'Orc': {
    type: 'Orc', isUndead: false, isUnique: false,
    minLevel: 2, maxLevel: 12, naturalTier: 2, minDungeonLevel: 1, speed: 1.0,
    baseHpPerLevel: 7, baseAttackPerLevel: 2.5, baseDefensePerLevel: 1.5,
    fireballResistance: 1.0,
    encounterIntro: ['A hulking orc bellows and raises its weapon.', '', 'You have encountered a Level {LVL} Orc!'],
    specialAbilities: [],
  },
  'Giant': {
    type: 'Giant', isUndead: false, isUnique: false,
    minLevel: 5, maxLevel: 20, naturalTier: 4, minDungeonLevel: 2, speed: 0.9,
    baseHpPerLevel: 12, baseAttackPerLevel: 4.0, baseDefensePerLevel: 2.0,
    fireballResistance: 1.0,
    encounterIntro: ['The ground shakes as an enormous shape lumbers forward.', '', 'You have encountered a Level {LVL} Giant!'],
    specialAbilities: [],
  },
  'Owlbear': {
    type: 'Owlbear', isUndead: false, isUnique: false,
    minLevel: 3, maxLevel: 15, naturalTier: 3, minDungeonLevel: 1, speed: 1.0,
    baseHpPerLevel: 9, baseAttackPerLevel: 3.0, baseDefensePerLevel: 1.8,
    fireballResistance: 1.0,
    encounterIntro: ['Something between a bear and an owl blocks the corridor.', '', 'You have encountered a Level {LVL} Owlbear!'],
    specialAbilities: [],
  },
  'Displacer Beast': {
    type: 'Displacer Beast', isUndead: false, isUnique: false,
    minLevel: 4, maxLevel: 16, naturalTier: 3, minDungeonLevel: 2, speed: 1.3,
    baseHpPerLevel: 8, baseAttackPerLevel: 3.5, baseDefensePerLevel: 2.5,
    fireballResistance: 1.0,
    encounterIntro: ['You reach for the beast but strike only air. It is not where you see it.', '', 'You have encountered a Level {LVL} Displacer Beast!'],
    specialAbilities: ['displacement'],
  },
  'Basilisk': {
    type: 'Basilisk', isUndead: false, isUnique: false,
    minLevel: 6, maxLevel: 20, naturalTier: 4, minDungeonLevel: 3, speed: 0.7,
    baseHpPerLevel: 10, baseAttackPerLevel: 3.0, baseDefensePerLevel: 2.0,
    fireballResistance: 1.0,
    encounterIntro: ['You avert your gaze. Something heavy moves in the darkness.', '', 'You have encountered a Level {LVL} Basilisk!'],
    specialAbilities: ['gaze-paralyze'],
  },
  'Mold': {
    type: 'Mold', isUndead: false, isUnique: false,
    minLevel: 1, maxLevel: 10, naturalTier: 1, minDungeonLevel: 1, speed: 0.3,
    baseHpPerLevel: 6, baseAttackPerLevel: 2.0, baseDefensePerLevel: 0.5,
    fireballResistance: 1.0,
    encounterIntro: ['A pulsating mass of mold oozes toward you.', '', 'You have encountered a Level {LVL} Mold!'],
    specialAbilities: ['spore-poison'],
  },
  'Slime Mold': {
    type: 'Slime Mold', isUndead: false, isUnique: false,
    minLevel: 2, maxLevel: 12, naturalTier: 2, minDungeonLevel: 1, speed: 0.4,
    baseHpPerLevel: 8, baseAttackPerLevel: 2.5, baseDefensePerLevel: 1.0,
    fireballResistance: 1.0,
    encounterIntro: ['A glistening slime mold absorbs the light around it.', '', 'You have encountered a Level {LVL} Slime Mold!'],
    specialAbilities: ['acid-touch'],
  },
  'Gelatinous Cube': {
    type: 'Gelatinous Cube', isUndead: false, isUnique: false,
    minLevel: 3, maxLevel: 14, naturalTier: 2, minDungeonLevel: 1, speed: 0.5,
    baseHpPerLevel: 10, baseAttackPerLevel: 3.0, baseDefensePerLevel: 1.5,
    fireballResistance: 1.0,
    encounterIntro: ['The corridor ahead shimmers. You realize too late it is not empty.', '', 'You have encountered a Level {LVL} Gelatinous Cube!'],
    specialAbilities: ['engulf-paralyze'],
  },
  'Mimic': {
    type: 'Mimic', isUndead: false, isUnique: false,
    minLevel: 5, maxLevel: 18, naturalTier: 3, minDungeonLevel: 2, speed: 0.8,
    baseHpPerLevel: 11, baseAttackPerLevel: 4.0, baseDefensePerLevel: 2.0,
    fireballResistance: 1.0,
    encounterIntro: ['The chest beside the wall unfolds with a horrible sound.', '', 'You have encountered a Level {LVL} Mimic!'],
    specialAbilities: ['adhesive'],
  },
  'Skeleton': {
    type: 'Skeleton', isUndead: true, isUnique: false,
    minLevel: 1, maxLevel: 10, naturalTier: 1, minDungeonLevel: 2, speed: 0.9,
    baseHpPerLevel: 5, baseAttackPerLevel: 2.0, baseDefensePerLevel: 1.0,
    fireballResistance: 1.0,
    encounterIntro: ['Bones clatter in the darkness.', '', 'You have encountered a Level {LVL} Skeleton!'],
    specialAbilities: [],
  },
  'Zombie': {
    type: 'Zombie', isUndead: true, isUnique: false,
    minLevel: 2, maxLevel: 12, naturalTier: 2, minDungeonLevel: 2, speed: 0.6,
    baseHpPerLevel: 8, baseAttackPerLevel: 2.5, baseDefensePerLevel: 1.2,
    fireballResistance: 1.0,
    encounterIntro: ['A shambling shape drags itself toward you.', '', 'You have encountered a Level {LVL} Zombie!'],
    specialAbilities: [],
  },
  'Wight': {
    type: 'Wight', isUndead: true, isUnique: false,
    minLevel: 5, maxLevel: 18, naturalTier: 4, minDungeonLevel: 3, speed: 1.0,
    baseHpPerLevel: 9, baseAttackPerLevel: 4.0, baseDefensePerLevel: 2.5,
    fireballResistance: 1.0,
    encounterIntro: ['A grey shape with hollow eyes drifts through the stone wall.', '', 'You have encountered a Level {LVL} Wight!'],
    specialAbilities: ['life-drain'],
  },
  'Spectre': {
    type: 'Spectre', isUndead: true, isUnique: false,
    minLevel: 6, maxLevel: 20, naturalTier: 5, minDungeonLevel: 3, speed: 1.2,
    baseHpPerLevel: 7, baseAttackPerLevel: 4.5, baseDefensePerLevel: 2.0,
    fireballResistance: 1.0,
    encounterIntro: ['A vast shape emerges from the darkness.', '', 'You have encountered a Level {LVL} Spectre!'],
    specialAbilities: ['life-drain', 'terror'],
  },
  'Vampire': {
    type: 'Vampire', isUndead: true, isUnique: false,
    minLevel: 8, maxLevel: 25, naturalTier: 6, minDungeonLevel: 4, speed: 1.1,
    baseHpPerLevel: 10, baseAttackPerLevel: 5.0, baseDefensePerLevel: 3.0,
    fireballResistance: 1.0,
    encounterIntro: ['A pale figure steps from the shadow, its eyes red as garnets.', '', 'You have encountered a Level {LVL} Vampire!'],
    specialAbilities: ['life-drain', 'charm'],
  },
  'Death Knight': {
    type: 'Death Knight', isUndead: true, isUnique: false,
    minLevel: 10, maxLevel: 30, naturalTier: 7, minDungeonLevel: 4, speed: 1.0,
    baseHpPerLevel: 13, baseAttackPerLevel: 6.0, baseDefensePerLevel: 4.0,
    fireballResistance: 0.75,
    encounterIntro: ['Blackened armor scrapes the stone as the figure turns to face you.', '', 'You have encountered a Level {LVL} Death Knight!'],
    specialAbilities: ['hellfire', 'terror'],
  },
  'Lich': {
    type: 'Lich', isUndead: true, isUnique: false,
    minLevel: 12, maxLevel: 35, naturalTier: 8, minDungeonLevel: 5, speed: 0.9,
    baseHpPerLevel: 11, baseAttackPerLevel: 6.5, baseDefensePerLevel: 3.5,
    fireballResistance: 0.8,
    encounterIntro: ['A skeletal figure in tattered robes raises one bony hand.', '', 'You have encountered a Level {LVL} Lich!', 'Its eyes glow with cold blue fire.'],
    specialAbilities: ['fireball', 'life-drain', 'paralysis-touch'],
  },
  'Wizard': {
    type: 'Wizard', isUndead: false, isUnique: false,
    minLevel: 8, maxLevel: 30, naturalTier: 6, minDungeonLevel: 3, speed: 1.0,
    baseHpPerLevel: 7, baseAttackPerLevel: 5.5, baseDefensePerLevel: 2.0,
    fireballResistance: 0.9,
    encounterIntro: [
      'A gaunt Wizard steps from the shadows.',
      '',
      'His silver beard reaches nearly to the floor.',
      'Other rumors about his dimensions remain unconfirmed.',
      '',
      'You have encountered a Level {LVL} Wizard!',
    ],
    specialAbilities: ['fireball', 'lightning-bolt', 'teleport', 'make-naked'],
  },
  'Beholder': {
    type: 'Beholder', isUndead: false, isUnique: false,
    minLevel: 10, maxLevel: 30, naturalTier: 7, minDungeonLevel: 4, speed: 1.0,
    baseHpPerLevel: 12, baseAttackPerLevel: 6.0, baseDefensePerLevel: 3.5,
    fireballResistance: 0.9,
    encounterIntro: ['A great floating sphere covered in eyes rotates slowly toward you.', '', 'You have encountered a Level {LVL} Beholder!'],
    specialAbilities: ['magic-blast', 'paralyze-ray', 'fear-ray', 'life-drain-ray', 'weaken-ray', 'spell-interrupt'],
  },
  'Mind Flayer': {
    type: 'Mind Flayer', isUndead: false, isUnique: false,
    minLevel: 10, maxLevel: 30, naturalTier: 7, minDungeonLevel: 4, speed: 1.0,
    baseHpPerLevel: 10, baseAttackPerLevel: 5.5, baseDefensePerLevel: 3.0,
    fireballResistance: 1.0,
    encounterIntro: ['Tentacles writhe from a pale, bloated face. Its thoughts press against yours.', '', 'You have encountered a Level {LVL} Mind Flayer!'],
    specialAbilities: ['psychic-blast', 'intelligence-drain', 'fear', 'spell-disrupt'],
  },
  'Black Dragon': {
    type: 'Black Dragon', isUndead: false, isUnique: false,
    minLevel: 8, maxLevel: 50, naturalTier: 7, minDungeonLevel: 3, speed: 1.0,
    baseHpPerLevel: 14, baseAttackPerLevel: 7.0, baseDefensePerLevel: 4.0,
    fireballResistance: 1.0,
    encounterIntro: ['Acid hisses as it strikes the stone floor.', '', 'You have encountered a Level {LVL} Black Dragon!'],
    specialAbilities: ['acid-breath'],
  },
  'Green Dragon': {
    type: 'Green Dragon', isUndead: false, isUnique: false,
    minLevel: 8, maxLevel: 50, naturalTier: 7, minDungeonLevel: 3, speed: 1.0,
    baseHpPerLevel: 14, baseAttackPerLevel: 6.5, baseDefensePerLevel: 4.0,
    fireballResistance: 1.0,
    encounterIntro: ['Venomous mist curls from enormous jaws.', '', 'You have encountered a Level {LVL} Green Dragon!'],
    specialAbilities: ['poison-breath'],
  },
  'Blue Dragon': {
    type: 'Blue Dragon', isUndead: false, isUnique: false,
    minLevel: 8, maxLevel: 50, naturalTier: 7, minDungeonLevel: 3, speed: 1.0,
    baseHpPerLevel: 14, baseAttackPerLevel: 7.5, baseDefensePerLevel: 4.0,
    fireballResistance: 1.0,
    encounterIntro: ['Thunder rolls through the stone corridor.', '', 'You have encountered a Level {LVL} Blue Dragon!'],
    specialAbilities: ['lightning-breath'],
  },
  'White Dragon': {
    type: 'White Dragon', isUndead: false, isUnique: false,
    minLevel: 8, maxLevel: 50, naturalTier: 7, minDungeonLevel: 3, speed: 0.9,
    baseHpPerLevel: 13, baseAttackPerLevel: 6.5, baseDefensePerLevel: 3.8,
    fireballResistance: 2.0,  // vulnerable to fireball
    encounterIntro: ['Frost rimes the walls as a pale shape descends.', '', 'You have encountered a Level {LVL} White Dragon!'],
    specialAbilities: ['frost-breath'],
  },
  'Red Dragon': {
    type: 'Red Dragon', isUndead: false, isUnique: false,
    minLevel: 10, maxLevel: 50, naturalTier: 8, minDungeonLevel: 4, speed: 1.0,
    baseHpPerLevel: 16, baseAttackPerLevel: 8.0, baseDefensePerLevel: 4.5,
    fireballResistance: 0.25,  // strongly resistant to fireball
    encounterIntro: ['Heat floods the corridor. Flame flickers in the distance.', '', 'You have encountered a Level {LVL} Red Dragon!'],
    specialAbilities: ['fire-breath'],
  },
  'Aboleth': {
    type: 'Aboleth', isUndead: false, isUnique: true,
    minLevel: 30, maxLevel: 30, naturalTier: 9, minDungeonLevel: 6, speed: 0.8,
    baseHpPerLevel: 20, baseAttackPerLevel: 9.0, baseDefensePerLevel: 5.0,
    fireballResistance: 1.0,
    encounterIntro: [
      'Black water parts.',
      '',
      'An ancient shape the size of a house rises to the surface.',
      'Its thoughts enter your mind without invitation.',
      '',
      'THE ABOLETH REGARDS YOU WITH CONTEMPT.',
    ],
    specialAbilities: ['psychic-attack', 'slime-disease', 'mind-control', 'high-hp'],
  },
  'Dracolich': {
    type: 'Dracolich', isUndead: true, isUnique: true,
    minLevel: 35, maxLevel: 35, naturalTier: 9, minDungeonLevel: 6, speed: 0.9,
    baseHpPerLevel: 18, baseAttackPerLevel: 9.5, baseDefensePerLevel: 5.5,
    fireballResistance: 0.9,
    encounterIntro: [
      'A vast shape stirs among the bones.',
      '',
      'Dragon bones knit together and rise.',
      'Cold blue light fills empty eye sockets.',
      '',
      'THE DRACOLICH OPENS ITS JAWS.',
    ],
    specialAbilities: ['dragon-breath', 'necromantic-magic', 'life-drain', 'strong-defense'],
  },
  'Nightwalker': {
    type: 'Nightwalker', isUndead: true, isUnique: true,
    minLevel: 35, maxLevel: 35, naturalTier: 9, minDungeonLevel: 7, speed: 1.1,
    baseHpPerLevel: 16, baseAttackPerLevel: 10.0, baseDefensePerLevel: 5.0,
    fireballResistance: 1.0,
    encounterIntro: [
      'The torches gutter and die.',
      '',
      'Something tall and absolute walks out of the darkness.',
      '',
      'THE NIGHTWALKER DOES NOT SLOW.',
    ],
    specialAbilities: ['darkness', 'terror', 'life-drain', 'heavy-blow'],
  },
  'Tarrasque': {
    type: 'Tarrasque', isUndead: false, isUnique: true,
    minLevel: 40, maxLevel: 40, naturalTier: 10, minDungeonLevel: 7, speed: 1.0,
    baseHpPerLevel: 25, baseAttackPerLevel: 12.0, baseDefensePerLevel: 7.0,
    fireballResistance: 0.5,
    encounterIntro: [
      'THE DUNGEON SHAKES.',
      '',
      'Something that should not fit inside a dungeon',
      'does so anyway.',
      '',
      'THE TARRASQUE HAS FOUND YOU.',
    ],
    specialAbilities: ['enormous-hp', 'massive-attack', 'spell-resistance', 'hard-to-run'],
  },
  'Tiamat': {
    type: 'Tiamat', isUndead: false, isUnique: true,
    minLevel: 45, maxLevel: 45, naturalTier: 10, minDungeonLevel: 7, speed: 1.0,
    baseHpPerLevel: 22, baseAttackPerLevel: 11.0, baseDefensePerLevel: 6.5,
    fireballResistance: 0.5,  // has white dragon head so vulnerable in one sense, but multi-headed
    encounterIntro: [
      'Five shadows fall across you at once.',
      '',
      'Five pairs of eyes open in the darkness.',
      '',
      'TIAMAT, QUEEN OF EVIL DRAGONS, RISES.',
    ],
    specialAbilities: ['acid-breath', 'poison-breath', 'lightning-breath', 'frost-breath', 'fire-breath'],
  },
  'Asmodeus': {
    type: 'Asmodeus', isUndead: false, isUnique: true,
    minLevel: 50, maxLevel: 50, naturalTier: 10, minDungeonLevel: 7, speed: 1.0,
    baseHpPerLevel: 30, baseAttackPerLevel: 14.0, baseDefensePerLevel: 8.0,
    fireballResistance: 0.25,
    encounterIntro: [
      'You enter a vast circular chamber.',
      '',
      'A throne of iron stands at its center.',
      '',
      'The figure seated upon it rises.',
      '',
      'The dungeon shakes.',
      '',
      'ASMODEUS, LORD OF THE SEVENTH LEVEL,',
      'HAS BEEN WAITING FOR YOU.',
    ],
    specialAbilities: ['fireball', 'lightning-bolt', 'mummification', 'life-drain', 'terror', 'infernal-healing', 'ball-of-doo'],
  },
};

export function getDefinition(type: MonsterType): MonsterDefinition {
  return DEFINITIONS[type];
}

export function allDefinitions(): MonsterDefinition[] {
  return Object.values(DEFINITIONS);
}

export function createMonster(type: MonsterType, level: number, id: string): Monster {
  const def = DEFINITIONS[type];
  const clampedLevel = Math.max(def.minLevel, Math.min(def.maxLevel, level));
  const hp = Math.round(def.baseHpPerLevel * clampedLevel);

  return {
    id,
    type,
    level: clampedLevel,
    hp,
    maxHp: hp,
    definition: def,
    prayerPenalty: 0,
  };
}

export function randomMonsterLevel(
  characterLevel: number,
  dungeonDepth: number,
  rng: RNG,
): number {
  const base = characterLevel + (dungeonDepth - 1) * MONSTER_SCALING.DEPTH_BONUS;
  const spread = rng.int(-MONSTER_SCALING.SPREAD, MONSTER_SCALING.SPREAD);
  return Math.max(1, base + spread);
}

export function pickRandomMonsterType(dungeonDepth: number, rng: RNG): MonsterType {
  const pool = (Object.values(DEFINITIONS) as MonsterDefinition[]).filter(
    d => !d.isUnique && d.minDungeonLevel <= dungeonDepth,
  );
  return rng.pick(pool).type;
}

export function monsterAttackText(type: MonsterType, damage: number, ability?: string): string {
  const actions: Record<string, string> = {
    'acid-breath':      `The ${type} breathes acid! You suffer ${damage} damage.`,
    'poison-breath':    `The ${type} exhales venom! You suffer ${damage} damage.`,
    'lightning-breath': `The ${type} unleashes lightning! You suffer ${damage} damage.`,
    'frost-breath':     `The ${type} breathes frost! You suffer ${damage} damage.`,
    'fire-breath':      `The ${type} breathes fire! You suffer ${damage} damage.`,
    'life-drain':       `The ${type} drains your life! You suffer ${damage} damage.`,
    'psychic-blast':    `The ${type} assaults your mind! You suffer ${damage} psychic damage.`,
    'psychic-attack':   `The ${type} invades your thoughts! You suffer ${damage} damage.`,
    'fireball':         `The ${type} hurls a fireball! You suffer ${damage} damage.`,
    'lightning-bolt':   `The ${type} casts Lightning Bolt! You suffer ${damage} damage.`,
    'slime-disease':    `The ${type} coats you in slime! You suffer ${damage} damage.`,
    'magic-blast':      `The ${type} fires a magic ray! You suffer ${damage} damage.`,
    'hellfire':         `The ${type} calls down hellfire! You suffer ${damage} damage.`,
    'darkness':         `The ${type} unleashes darkness! You suffer ${damage} damage.`,
    'heavy-blow':       `The ${type} strikes you with tremendous force! You suffer ${damage} damage.`,
    'dragon-breath':    `The ${type} breathes necrotic fire! You suffer ${damage} damage.`,
    'necromantic-magic':`The ${type} casts necromantic magic! You suffer ${damage} damage.`,
    'massive-attack':   `The ${type} crushes you! You suffer ${damage} damage.`,
    'mummification':    `Asmodeus wraps you in necrotic bindings! You suffer ${damage} damage.`,
    'infernal-healing': `Asmodeus draws on your vitality to heal himself!`,
    'ball-of-doo':      '',
    'terror':           `The ${type} fills you with supernatural terror! You suffer ${damage} damage.`,
  };
  return actions[ability ?? ''] ?? `The ${type} strikes you for ${damage} damage.`;
}

export const UNDEAD_TYPES: MonsterType[] = [
  'Skeleton', 'Zombie', 'Wight', 'Spectre', 'Vampire', 'Death Knight', 'Lich', 'Dracolich', 'Nightwalker',
];

export function isUndead(type: MonsterType): boolean {
  return UNDEAD_TYPES.includes(type);
}

export const RANDOM_MONSTER_POOL: MonsterType[] = [
  'Kobold', 'Goblin', 'Orc', 'Giant', 'Owlbear', 'Displacer Beast', 'Basilisk',
  'Mold', 'Slime Mold', 'Gelatinous Cube', 'Mimic',
  'Skeleton', 'Zombie', 'Wight', 'Spectre', 'Vampire', 'Death Knight', 'Lich',
  'Wizard', 'Beholder', 'Mind Flayer',
  'Black Dragon', 'Green Dragon', 'Blue Dragon', 'White Dragon', 'Red Dragon',
];
