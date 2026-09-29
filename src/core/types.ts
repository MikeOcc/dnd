export type Direction = 'N' | 'E' | 'S' | 'W';

export interface WallEdges {
  N: boolean;
  E: boolean;
  S: boolean;
  W: boolean;
}

export interface DungeonCell {
  x: number;
  y: number;
  walls: WallEdges;
}

export type CellContentType =
  | 'ladder-up'
  | 'ladder-down'
  | 'chest'
  | 'book'
  | 'altar'
  | 'fountain'
  | 'trap'
  | 'fixed-monster'
  | 'unique-monster'
  | 'description'
  | 'entrance';

export interface CellContent {
  type: CellContentType;
  id: string;
  monsterId?: string;   // for fixed/unique monsters
  descriptionId?: string;
  trapVariant?: string;
}

export interface SerializedDungeon {
  levelNumber: number;
  width: number;
  height: number;
  cells: { x: number; y: number; walls: WallEdges }[][];
  entrance: { x: number; y: number };
  exit: { x: number; y: number } | null;
  contents: { key: string; value: CellContent }[];
  seed: number;
}

export interface DiceRoll {
  d1: number;
  d2: number;
  d3: number;
  total: number;
}

export interface CharacterRoll {
  strength: DiceRoll;
  constitution: DiceRoll;
  intelligence: DiceRoll;
  wisdom: DiceRoll;
  dexterity: DiceRoll;
  charisma: DiceRoll;
  resistance: DiceRoll;
  hpBonus: number;
}

export type StatusEffectType =
  | 'poison'
  | 'bleeding'
  | 'naked'
  | 'mummified'
  | 'paralyzed'
  | 'feared'
  | 'intelligence-reduced'
  | 'dexterity-reduced'
  | 'strength-reduced'
  | 'resistance-improved';

export interface StatusEffect {
  type: StatusEffectType;
  value: number;
  turns: number;
}

export type GemType = 'ruby' | 'sapphire' | 'diamond' | 'opal';

export interface Inventory {
  potions: number;
  books: number;
  gems: Record<GemType, number>;
}

export interface Character {
  id: string;
  name: string;
  level: number;
  xp: number;
  dungeonLevel: number;
  x: number;
  y: number;
  facing: Direction;
  hp: number;
  maxHp: number;
  gold: number;
  strength: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  dexterity: number;
  charisma: number;
  resistance: number;
  deathCount: number;
  stepsTaken: number;
  monstersDefeated: number;
  uniqueMonstersDefeated: number;
  asmodeusDefeated: boolean;
  statusEffects: StatusEffect[];
  invulnerableTurns?: number; // from reading a magic book — blocks the monster's next N combat rounds entirely
  heldRounds?: number;        // combat rounds the character loses (paralyzed, asleep, cowering...) — in-memory, cleared when combat ends
  heldBy?: HeldCondition;     // why the character is held, for the lost-turn message
  banishCastAt?: number;      // play-time second of the last Banish (one per hour of play)
  charClass: CharacterClass;
  battleCryRounds?: number;   // warrior: rounds of Battle Cry's damage boost left (in-memory, cleared after combat)
  introsSeen: number[];
  rerollsRemaining: number;
  elementalWarnings: string[]; // "{MonsterType}:{fireball|acid|lightning}" already called out this playthrough
  inventory: Inventory;
  createdAt: number;
  playTime: number;
  lastSaved: number;
}

export type MonsterType =
  | 'Kobold'
  | 'Goblin'
  | 'Orc'
  | 'Giant'
  | 'Owlbear'
  | 'Displacer Beast'
  | 'Basilisk'
  | 'Mold'
  | 'Slime Mold'
  | 'Gelatinous Cube'
  | 'Mimic'
  | 'Skeleton'
  | 'Zombie'
  | 'Wight'
  | 'Spectre'
  | 'Vampire'
  | 'Death Knight'
  | 'Lich'
  | 'Wizard'
  | 'Beholder'
  | 'Mind Flayer'
  | 'Elder Oblex'
  | 'Sanguinid'
  | 'Black Dragon'
  | 'Green Dragon'
  | 'Blue Dragon'
  | 'White Dragon'
  | 'Red Dragon'
  | 'Aboleth'
  | 'Dracolich'
  | 'Nightwalker'
  | 'Tarrasque'
  | 'Tiamat'
  | 'Asmodeus';

export interface MonsterDefinition {
  type: MonsterType;
  isUndead: boolean;
  isUnique: boolean;
  minLevel: number;
  maxLevel: number;
  naturalTier: number;
  baseHpPerLevel: number;
  baseAttackPerLevel: number;
  baseDefensePerLevel: number;
  fireballResistance: number;
  acidResistance?: number;      // damage multiplier for Acid Spray; defaults to 1.0
  lightningResistance?: number; // damage multiplier for Lightning; undead default to 2.0, others 1.0
  coldResistance?: number;      // damage multiplier for Frost Bolt; defaults to 1.0
  poisonResistance?: number;    // damage multiplier for Poison Spray; defaults to 1.0
  lightVulnerable?: boolean;  // treated like undead for Prayer's holy-light damage
  minDungeonLevel: number;
  speed: number;
  encounterIntro: string[];
  specialAbilities: string[];
}

export interface Monster {
  id: string;
  type: MonsterType;
  level: number;
  hp: number;
  maxHp: number;
  definition: MonsterDefinition;
  prayerPenalty: number;
  confusedTurns?: number; // Opal's chiaroscuro blast: a chance to lose its turn each round until this ticks to 0
  petrifyStage?: number;  // Beholder: set once its petrification ray lands; a second failed save that fight is fatal
  stunnedTurns?: number;  // warrior's Shield Bash: the monster skips this many turns
}

export type CharacterClass = 'wizard' | 'warrior';

/** Kinds of harm, for the client's hit effects (flash colour, tint). */
export type FxElement = 'physical' | 'fire' | 'cold' | 'lightning' | 'acid' | 'poison' | 'drain' | 'psychic' | 'holy' | 'arcane';

/** Per-action hints for the client's hit effects. Amounts come from the
 * client comparing HP before and after; these say what kind of hit it was. */
export interface Fx {
  player?: FxElement;        // what hurt the character this action
  monster?: FxElement;       // what the character hit the monster with
  monsterAttacked?: boolean; // the monster took a swing (portrait lunges)
}

export type HeldCondition = 'feared' | 'dazed' | 'paralyzed' | 'asleep' | 'charmed' | 'petrifying' | 'engulfed';

/** The Beholder's eye rays, one per eyestalk. */
export type BeholderRay =
  | 'fear-ray' | 'slow-ray' | 'enervation-ray' | 'telekinetic-ray' | 'paralyze-ray'
  | 'sleep-ray' | 'charm-ray' | 'petrify-ray' | 'disintegrate-ray' | 'death-ray';

export type GamePhase =
  | 'title'
  | 'main-menu'
  | 'name-entry'
  | 'char-roll'
  | 'char-accept'
  | 'playing'
  | 'combat'
  | 'interaction'
  | 'level-intro'
  | 'death'
  | 'victory'
  | 'status'
  | 'map'
  | 'inventory'
  | 'save-prompt'
  | 'resting';

export interface Choice {
  key: string;
  text: string;
}

export interface CombatState {
  monster: Monster;
  round: number;
  nakedActive: boolean;
  preCombatX: number;
  preCombatY: number;
}

export type InteractionType =
  | 'chest'
  | 'book'
  | 'altar'
  | 'fountain'
  | 'trap'
  | 'trap-choice';

export interface InteractionState {
  type: InteractionType;
  contentId: string;
  choices: Choice[];
  chestSearched?: boolean;     // chest: already checked for traps (no second look)
  chestTrapSpotted?: boolean;  // chest: the search found its trap, so disarming is on offer
}

export type ChestTrapType = 'needle' | 'blade' | 'gas' | 'fire-glyph' | 'alarm';

export type DisplayGrid = string[];

export interface GameState {
  phase: GamePhase;
  character?: Character;
  currentRoll?: CharacterRoll;
  view?: DisplayGrid;
  messages: string[];
  choices?: Choice[];
  combat?: CombatState;
  interaction?: InteractionState;
  levelIntroText?: string[];
  finalScore?: ScoreResult;
  saveSlots?: CharacterSummary[];
  mapFull?: boolean;           // map phase only: showing the whole floor rather than the centered window
  spellChoices?: Choice[];     // combat only: the spell menu (known spells, lettered in unlock order, then Cancel)
  fx?: Fx;                     // hit-effect hints for this action only
}

export interface CharacterSummary {
  id: string;
  name: string;
  level: number;
  dungeonLevel: number;
  monstersDefeated: number;
  asmodeusDefeated: boolean;
  xp: number;
  charClass: CharacterClass;
}

export interface ScoreResult {
  characterLevel: number;
  xp: number;
  gold: number;
  monstersDefeated: number;
  uniqueMonstersDefeated: number;
  asmodeusDefeated: boolean;
  deathCount: number;
  stepsTaken: number;
  playTimeSeconds: number;
  finalScore: number;
}

export interface DungeonState {
  visitedCells: Set<string>;
  openedChests: Set<string>;
  readBooks: Set<string>;
  usedFountains: Set<string>;
  usedAltars: Set<string>;
  triggeredTraps: Set<string>;
  disarmedTraps: Set<string>;
  defeatedFixedMonsters: Set<string>;
  defeatedUniqueMonsters: Set<string>;
  visitedDescriptions: Set<string>;
}
