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
  | 'shop'           // the Trading Post on level 1
  | 'entrance';

export interface CellContent {
  type: CellContentType;
  id: string;
  monsterId?: string;   // for fixed/unique monsters
  descriptionId?: string;
  trapVariant?: string;
  treasure?: string;    // a Zork treasure chest: which treasure (content/treasures.ts), or a ring chest: which ring (content/rings.ts)
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
  | 'resistance-improved'
  | 'warded'    // emerald ward: value = fights left (doesn't tick with steps)
  | 'anaphylaxis'  // a Manticore's sting: value = the play-time second the character dies (doesn't tick with steps)
  | 'flesh-rot'    // a ghoul's disease: value = damage per step; healing works at half strength while it lasts
  | 'corroded'     // a Rust Monster's touch: value = % less weapon damage, until it wears off
  | 'lycanthropy'  // a Werewolf's bite: now and then the beast takes over (doesn't tick with steps)
  | 'fiend-venom'; // a Pit Fiend's bite: healing works at half strength while it lasts

export interface StatusEffect {
  type: StatusEffectType;
  value: number;
  turns: number;
  part?: string;    // flesh rot: the body part it is eating
  stage?: number;   // flesh rot: how far it has spread through that part
  doom?: number;    // flesh rot: turns left to live once it has gone too far
}

export type GemType = 'ruby' | 'sapphire' | 'diamond' | 'opal' | 'emerald' | 'moonstone';

export interface Inventory {
  potions: number;
  books: number;
  gems: Record<GemType, number>;
  treasures?: string[];   // Zork treasures found (content/treasures.ts)
  rings?: RingId[];       // magic rings worn (content/rings.ts); one of each, except star sapphires, counted below
  starRings?: number;     // star sapphire rings carried
  starCharges?: number;   // uses left on the star sapphire ring in use (fresh ones hold RINGS.STAR_CHARGES)
  activeRing?: RingId;    // the one ring in use: many can be worn, only one is used at a time
  amulets?: Amulet[];     // magic amulets carried; at most one worn
  weapons?: Weapon[];      // weapons carried; the best for your class is the one you fight with
  armor?: Armor[];         // armour and shields carried; the best of each is worn
}

/** Weapons and armour, +0 to +3. Wizards can use only daggers and leather. */
export type WeaponKind = 'dagger' | 'sword' | 'axe' | 'mace';
export type ArmorKind = 'leather' | 'chain' | 'plate' | 'shield';
/** `equipped`: chosen by hand (otherwise the best is used automatically). */
export interface Weapon { kind: WeaponKind; bonus: number; name: string; equipped?: boolean }
export interface Armor { kind: ArmorKind; bonus: number; name: string; equipped?: boolean }

export type AmuletStat = 'strength' | 'intelligence' | 'dexterity' | 'constitution' | 'wisdom';

/** A magic amulet: raises one attribute by 1-3 while worn, or, if cursed,
 * lowers it by as much and won't come off until a fountain, an altar or an
 * emerald breaks the curse. Its strength and curse are unknown until worn. */
export interface Amulet {
  stat: AmuletStat;
  bonus: number;      // 1-3
  cursed: boolean;
  look: string;       // 'jade', 'bone'... (flavour)
  known?: boolean;    // worn at least once: its bonus and curse are known
  worn?: boolean;
}

/** The magic rings. fire, cold, evil and undead ward while in use; backfire
 * turns a monster's next attack back on it; escape (star sapphire) teleports
 * you out of a fight. */
export type RingId = 'fire' | 'cold' | 'evil' | 'undead' | 'backfire' | 'escape';

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
  asmodeusVictories?: number;  // times this character has beaten him: each time he comes back stronger
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
  | 'Orc King'
  | 'Giant'
  | 'Owlbear'
  | 'Manticore'
  | 'Giant Spider'
  | 'Stirge Swarm'
  | 'Rust Monster'
  | 'Bugbear'
  | 'Troll'
  | 'Minotaur'
  | 'Werewolf'
  | 'Gargoyle'
  | 'Harpy'
  | 'Hydra'
  | 'Medusa'
  | 'Doppelganger'
  | 'Purple Worm'
  | 'Iron Golem'
  | 'Behir'
  | 'Rakshasa'
  | 'Death Tyrant'
  | 'Demilich'
  | 'Chimera'
  | 'Pit Fiend'
  | 'Balor'
  | 'Marilith'
  | 'Erinyes'
  | 'Djinn'
  | 'Phoenix'
  | 'Banshee'
  | 'Unicorn'
  | 'Frost Giant'
  | 'Ghoul'
  | 'Titanoboa'
  | 'Wendigo'
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
  | 'Hollow Choir'
  | 'Giant Leech'
  | 'Giant Shrew'
  | 'Mongolian Death Worm'
  | 'Cerebrovore'
  | 'Elder Oblex'
  | 'Sanguinid'
  | 'Black Dragon'
  | 'Green Dragon'
  | 'Blue Dragon'
  | 'White Dragon'
  | 'Red Dragon'
  | 'Gold Dragon'
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
  choirPrep?: ChoirPower;      // Hollow Choir: the power a mask is gathering (it lands on the Choir's next turn)
  choirBroken?: ChoirMask[];   // Hollow Choir: the masks shattered so far
  stunnedTurns?: number;  // warrior's Shield Bash: the monster skips this many turns
  backfirePrimed?: boolean;  // green diamond ring: its next attack that touches the character backfires
  backfireUsed?: boolean;    // green diamond ring: already used this fight
  physicalOnlyTurns?: number;  // Asmodeus after a sapphire: his next turns are claws and tail only, no spells
  burnedTurns?: number;
  burrowed?: boolean;      // Mongolian Death Worm: under the floor (blades can't reach it); it erupts on its next turn
  invisibleTurns?: number;  // Banshee: turns it stays invisible (can't be attacked)
  invisCooldown?: number;   // Banshee: turns until it can vanish again
  reborn?: boolean;         // Phoenix, Troll: has risen again this fight
  heads?: number;           // Hydra: heads left (or grown)
  lastHp?: number;          // Hydra: HP at its last turn, to spot a severed head
  swallowHp?: number;       // Purple Worm: HP when it swallowed the character (cut out by wounding it from inside)     // Wendigo: turns its regeneration stays stopped after fire
  scareAttempts?: number;   // failed attempts to scare it off this fight: each makes the next harder
  regenerated?: boolean;     // Asmodeus has used his Infernal Regeneration this fight
  caughtOffGuard?: boolean;  // a successful charge into its lair: it can't answer the first blow
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
  cast?: 'attack' | 'heal';  // the character cast an offensive or a healing spell (for sounds)
  monsterDied?: boolean;     // the monster was slain this action
  cues?: string[];           // other sounds this action: 'gulp', 'gem-ruby'.., 'victory-1'..'victory-5', 'scare'
  /** How a chest, altar or fountain just turned out, for its picture. */
  objectArt?: { kind: 'chest'; moment: 'open' | 'boom' } | { kind: 'altar'; moment: 'blessed' } | { kind: 'fountain'; moment: 'refreshed' | 'tainted' };
}

export type HeldCondition = 'feared' | 'dazed' | 'paralyzed' | 'asleep' | 'charmed' | 'petrifying' | 'engulfed' | 'constricted' | 'choked' | 'frozen' | 'gilded' | 'webbed' | 'latched';

/** The Hollow Choir's five masks, and the three powers they hold. */
export type ChoirMask = 'grief' | 'rage' | 'delight' | 'dread' | 'blank';
export type ChoirPower = 'lament' | 'unmaking' | 'false-joy';

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
  | 'resting'
  | 'lair-warning'
  | 'asmodeus-scene';   // Asmodeus banished, or triumphant: shown before the victory or death screen

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
  | 'trap-choice'
  | 'shop'
  | 'gear'
  | 'teleport';     // Planar Step: choose a level to go to

export interface InteractionState {
  type: InteractionType;
  contentId: string;
  choices: Choice[];
  chestSearched?: boolean;     // chest: already checked for traps (no second look)
  chestTrapSpotted?: boolean;  // chest: the search found its trap, so disarming is on offer
  shop?: ShopState;            // shop: who's trading, which list is showing, what's for sale
  gear?: { mode: 'list' | 'item'; index?: number };
  teleport?: { startedAt: number; source: 'spell' | 'moonstone'; levels: number[] };   // Planar Step   // gear: the list, or one item's options
}

/** A shop visit: the Trading Post (level 1) or the wandering Peddler (deep levels). */
export interface ShopState {
  kind: 'post' | 'outpost' | 'peddler';   // level 1, level 4 (keeps shifts), the wandering Peddler
  mode: 'main' | 'buy' | 'sell';
  stock: ShopItem[];
}

export interface ShopItem {
  label: string;
  price: number;
  qty: number;
  goods: { type: 'potion' } | { type: 'tome' } | { type: 'gem'; gem: GemType } | { type: 'weapon'; weapon: Weapon } | { type: 'armor'; armor: Armor };
}

export type ChestTrapType = 'needle' | 'blade' | 'gas' | 'fire-glyph' | 'alarm';

export type DisplayGrid = string[];

/** The map around the character, for the 3D views drawn in the browser
 * (src/web/view3d.js). Only what the renderer needs: no monsters, traps or
 * secrets. Cells are [x, y, walls, ceiling, materials, torches, carvings]:
 * walls is a bitmask (N=1, E=2, S=4, W=8); ceiling 0 normal, 1 high, 2 vast;
 * materials is four letters for the N, E, S, W walls (s stone, b brick,
 * w wood, r rough, - none); torches and carvings are bitmasks like walls. */
export interface SceneData {
  x: number;
  y: number;
  facing: Direction;
  level: number;
  radius: number;
  cells: [number, number, number, number, string, number, number][];
  objects: SceneObject[];
}

export interface SceneObject {
  x: number;
  y: number;
  kind: 'fountain' | 'well' | 'altar' | 'chest' | 'book' | 'ladder-up' | 'ladder-down' | 'throne' | 'shop';
  variant?: string;   // throne: whose ('Asmodeus', 'Orc King')
}

export interface GameState {
  phase: GamePhase;
  character?: Character;
  currentRoll?: CharacterRoll;
  view?: DisplayGrid;
  scene?: SceneData;           // the surrounding map, for the browser's 3D views
  messages: string[];
  choices?: Choice[];
  combat?: CombatState;
  interaction?: InteractionState;
  levelIntroText?: string[];
  finalScore?: ScoreResult;
  saveSlots?: CharacterSummary[];
  mapFull?: boolean;           // map phase only: showing the whole floor rather than the centered window
  mapRevealed?: boolean;       // map phase only: this level has been revealed, so the whole-level/explored toggle applies
  mapShowWhole?: boolean;      // map phase only: showing the whole revealed level, not just the explored squares
  spellChoices?: Choice[];     // combat only: the spell menu (known spells, lettered in unlock order, then Cancel)
  ringChoices?: Choice[];      // playing/combat, when any ring is worn: the ring menu (rings lettered in order, then Cancel)
  amuletChoices?: Choice[];    // playing, when any amulet is carried: the amulet menu (lettered in order, then Cancel)
  fx?: Fx;                     // hit-effect hints for this action only
  lair?: { monster: MonsterType };  // lair-warning only: whose lair, for the client's art
  lordScene?: 'banished' | 'triumph';  // asmodeus-scene only: which ending to play
  /** A great lord seen from afar (playing only): how far, which side of his
   * throne you see, where across the view he is (-1 left edge .. 1 right
   * edge), and whether only out of the corner of your eye. */
  sighting?: { monster: MonsterType; distance: number; view: 'front' | 'back' | 'faces-left' | 'faces-right'; offset: number; peripheral: boolean; empty?: boolean };
  /** While exploring: the corridor view (and any sighting) for each way the
   * character could face, so the browser can turn at once, without waiting
   * for the server. */
  turnViews?: Partial<Record<Direction, { view: string[]; sighting?: GameState['sighting']; waysOut?: ('ahead' | 'left' | 'right' | 'behind')[] }>>;
  /** While exploring: which way the ways out of this room (or this corridor square) lie, relative to facing. */
  waysOut?: ('ahead' | 'left' | 'right' | 'behind')[];
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
  shared?: boolean;        // anyone may play it (no owner)
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
  revealedLevels: Set<number>;   // levels whose whole map a diamond or tome has shown (kept apart from explored squares)
}
