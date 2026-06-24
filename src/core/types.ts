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
  introsSeen: number[];
  rerollsRemaining: number;
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
}

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
  | 'status';

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
}

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
}

export interface CharacterSummary {
  id: string;
  name: string;
  level: number;
  dungeonLevel: number;
  monstersDefeated: number;
  asmodeusDefeated: boolean;
  xp: number;
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
