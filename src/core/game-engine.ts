import { RNG } from './random.js';
import type {
  Character, Monster, GameState, GamePhase, CombatState, InteractionState,
  Direction, SerializedDungeon, DungeonCell, CellContent, DungeonState,
  CharacterRoll, CharacterSummary, ScoreResult, Choice, StatusEffect, GemType,
  Fx, FxElement, ChestTrapType, CharacterClass, MonsterType, FirstSteps, Death,
} from './types.js';
import { rollCharacter, createCharacter, checkLevelUp, tickStatusEffects, formatRoll, addStatusEffect, xpForLevel, potionHealAmount, wardFights, wearDownWard, getEffectiveStats, advanceFleshRot, slowFleshRot, wornAmulet, amuletName, amuletDelta, breakAmuletCurse, wearCursedAmulet, bestWeapon, wornArmor, armorProtection, gearName, canUseGear, weaponPower, armorShare } from './character.js';
import { generateLevel, deserializeLevel, canMove, floodFill } from './dungeon.js';
import { renderCorridorView, scanCorridor, CORRIDOR_VIEW_DEFAULTS, CONTENT_PATTERNS, spatialHash, edgeMaterial, edgeCarved, edgeTorch } from './corridor-view.js';
import type { EntityMarker } from './corridor-view.js';
import type { SpellId } from './spells.js';
import type { RingId, SceneData, SceneObject, Amulet, AmuletStat, Weapon, Armor } from './types.js';
import { playerAttack, playerFireball, playerAcid, playerLightning, playerFrost, playerPoison, playerOpal, playerHeal, playerPray, playerRun, playerHeld, playerBanish, playerSapphireOnAsmodeus, playerReadyRing, playerBackfireRing, playerSpellBackfire, spellBackfireChance, calculateXPReward, playerPowerAttack, playerShieldBash, playerCleave, playerBattleCry, playerWhirlwind, attacksPerRound, playerPotion, monsterFirstStrike, playerScare, petUnicorn, playerStilledHour, playerBorak, playerWitherRing } from './combat.js';
import { spellMenu, spellForKey, spellsLearnedBetween, isMagic, knownSpells } from './spells.js';
import { initialPace, incrementPace, shouldTriggerRandomEncounter, resetPaceAfterCombat, EncounterPace, applyDeath, applyAsmodeusDeath, resolveChest, readBook, resolveAltar, resolveFountain, chestTrapFor, chestTrapName, chestTrapDetectChance, chestTrapDisarmChance, springChestTrap, resolveTrapTriggered, resolveTrapAvoid, resolveTrapDisarm, rollGear, HOARD_PREFIX, dragonHoardLoot, carriedTreasure } from './encounters.js';
import { createMonster, asmodeusReturnBonus, isHiddenMonster, hiddenStandIn, currentMonsterType, pickRandomMonsterType, randomMonsterLevel, getDefinition, ANCIENT_GHOUL_INTRO } from './monsters.js';
import { calculateScore, formatScore } from './scoring.js';
import { LONG_WAY } from './config.js';
import { DEBUG, CHARACTER, GAMEPLAY, DUNGEON, TREASURE, GEMS, CHEST_TRAPS, SPELLS, WARRIOR, TRAPS, LAIR, FLEE, GHOUL, PHOENIX, UNICORN, PRESENCE, RINGS, DEATH, GEAR, SHOP, HOARD, AMULETS, NEWCOMER, TOLL, HUSH, BANE, ABOLETH, BORAK, ECHOES, MONSTER_SCALING } from './config.js';
import { LAIRS } from '../content/lair-text.js';
import { buildOrcKingLair, centerAsmodeusLair, buildBarrowKingLair, placeLambtonWorm, placeRakshasa } from './lairs.js';
import { placeTreasures, placeShop, TREASURE_CHEST_PREFIX, RING_CHEST_PREFIX } from './treasures.js';
import { buildStock, cannotBuy, buy, sellables, outpostHours } from './shop.js';
import { treasureById } from '../content/treasures.js';
import { RINGS_INFO, RING_ORDER, ringChestById, POWER_RINGS, isProtectionRing } from '../content/rings.js';
import { getLevelIntro } from '../content/level-text.js';
import { MENU_LORE } from '../content/menu-lore.js';
import { rollPresence, type Lair } from './presence.js';
import { nameIsDecent } from './names.js';
import { chooseAuto, loreAction, type Lore } from './autofight.js';
import { buildSanctum, type Sanctum } from './sanctum.js';
import { roundRooms, curvedCorner, CORNER_CODE, CORNER_GLYPH } from './curves.js';
import { buildGaol, GAOL, type Gaol } from './gaol.js';
import { assignDistricts } from './hell-districts.js';
import { DISTRICTS, APPROACH_EVENTS, type DistrictId } from '../content/district-text.js';
import { getDescription, getDescriptionShort } from '../content/descriptions.js';
import { describeArea, ceilingHeight } from '../content/area-text.js';
import { mapAreas, areaAtCell, type AreaMap, waysOut, bearingsPhrase } from './regions.js';
import type { Repository } from '../database/repositories.js';

// ─── In-memory session state ─────────────────────────────────────────────────

/** Undug rock: generation starts every cell fully walled and only carves
 * rooms and corridors, so a cell with no open side isn't part of the level. */
function isSolidRock(cell: DungeonCell): boolean {
  const { N, S, E, W } = cell.walls;
  return N && S && E && W;
}

/** visitedCells keys carry the dungeon level: the same (x, y) is a different
 * square on every level. */
/** What you deal with from the square in front of it, rather than by stepping on it. */
const APPROACHABLE = new Set<string>(['chest', 'altar', 'fountain', 'book', 'shop']);
/** How long ago, in plain words: "earlier today", "yesterday", "3 days ago". */
function agoText(at: number): string {
  const days = Math.floor((Date.now() - at) / 86400000);
  return days <= 0 ? 'earlier today' : days === 1 ? 'yesterday' : `${days} days ago`;
}

/** What you notice near the Aboleth's lair, close and very close. */
const ABOLETH_SENSE_LINES = [
  'The stink of evil is here.',
  'The air turns thick and wet. You taste salt, and rot, and something older than both.',
  'Something huge and patient is watching you through the stone.',
  'Slime drips from the ceiling onto your neck, warm as breath.',
  'Far off in the dark, something vast turns over in black water, and is still.',
];
const ABOLETH_NEAR_LINES = [
  'The stink of evil is overpowering. It is very close now.',
  'Water stirs in the dark just ahead. Three green eyes open, one above another.',
  '"I see you," says a voice inside your skull, "and I remember you, though we have never met."',
  'The floor is slick with slime, and the slime is moving toward you.',
];

/** The Toll-Keeper's id: marked settled once paid or beaten. */
const TOLL_KEEPER_ID = 'toll-keeper';

function visitedKey(level: number, x: number, y: number): string {
  return `${level}:${x},${y}`;
}

/** Saves from before per-level tracking stored bare "x,y" keys, which can't
 * be attributed to a level (and a full-map reveal on one level leaked onto
 * the others). Drop them rather than guess. */
function dropLegacyVisitedKeys(ds: DungeonState): void {
  for (const k of ds.visitedCells) {
    if (!k.includes(':')) ds.visitedCells.delete(k);
  }
}

// A teleport lands at least this far (in squares walked) from where you stood, when the level allows.
const TELEPORT_MIN_DISTANCE = 10;

/** What each trap hits with, for the hit effects. */
function trapElement(variant: string): FxElement {
  if (variant === 'fire-blast') return 'fire';
  if (variant === 'acid-spray') return 'acid';
  if (variant === 'poison-needle') return 'poison';
  if (variant === 'attribute-rune') return 'arcane';
  return 'physical';
}

const CHEST_TRAP_ELEMENT: Record<ChestTrapType, FxElement> = {
  needle: 'poison', blade: 'physical', gas: 'poison', 'fire-glyph': 'fire', alarm: 'physical',
};

const GEM_PLURAL: Record<GemType, string> = {
  ruby: 'rubies', sapphire: 'sapphires', diamond: 'diamonds', opal: 'opals', emerald: 'emeralds', moonstone: 'moonstones', pearl: 'pearls',
};

/** Stepping into the old gaol's aisle (gaol.ts) for the first time. */
const GAOL_LINES = [
  'You are in a narrow aisle between two rows of cells: an old gaol, cut into the rock.',
  'Each cell is shut behind a door of iron bars, red with rust and locked fast.',
  'Through the bars your light finds old bones, chains still fixed to the walls, and here and there a chest no one has reached in a very long time.',
  'If only you could pick a lock.',
];

interface LevelCache {
  grid: DungeonCell[][];
  entrance: { x: number; y: number };
  exit: { x: number; y: number } | null;
  contents: Map<string, CellContent>;
  areas?: AreaMap;   // rooms and corridors, worked out on first use
  seed?: number;                 // the level's own seed
  sanctum?: Sanctum | null;      // level 7: Asmodeus's throne room and the Long Way to it
  gaol?: Gaol | null;            // level 5: the old gaol, its cells behind iron bars
  straight?: Set<string>;        // squares never drawn curved (the gaol's)
  districts?: DistrictId[];      // level 7: each area's district, worked out on first use
}

export class GameEngine {
  private repo: Repository;
  private char: Character | null = null;
  private dungeonState: DungeonState | null = null;
  private levelCache: Map<number, LevelCache> = new Map();
  private combat: CombatState | null = null;
  private interaction: InteractionState | null = null;
  private phase: GamePhase = 'title';
  private messages: string[] = [];
  private mapFull = false;
  private mapShowWhole = true;   // on a revealed level: the whole level, or only what's been explored
  private fx: Fx = {};   // hit-effect hints gathered during the current action
  private lastArea: string | null = null;
  private dyingOfShock = false;
  private shockWarnedAt = -Infinity;  // play time of the last anaphylaxis warning while walking  // guards checkAnaphylaxis against re-entry through handleDeath's getState
  private stepFrom: { x: number; y: number } | null = null;  // where the last step started
  private lair: { content: CellContent; monster: MonsterType; from: { x: number; y: number } } | null = null;  // lair-warning: whose, and the way back
  /** Testing aids (DEBUG) show only for the house owner, not guests online. */
  debugAids = true;
  /** Where a revive puts the character: this level's entrance, or (killed by
   * Asmodeus) a random spot on Level 6. */
  private reviveOnLevel6 = false;
  /** asmodeus-scene: which ending is showing, and the screen it leads to. */
  private lordScene: { scene: 'banished' | 'triumph'; then: 'victory' | 'death'; messages: string[] } | null = null;
  private mapAreaLines: string[] = [];     // map mode: the description of the area just walked into, shown under the legend  // "level:areaId" the character was last described in
  private presenceFelt = false;   // a unique monster made itself felt on this step
  private pendingRoll: CharacterRoll | null = null;
  private pendingName: string | null = null;
  private pace: EncounterPace;
  private rng: RNG;
  private sessionStart: number = Date.now();
  private warriorTipShown = false;   // the Power Attack tip, once a session

  /** Adds to a new character's early-game record and writes it at once (not
   * on save: a player who quits without saving still counts). Kept until they
   * reach NEWCOMER.TRACK_TO_LEVEL; `always` records past it (the level reached). */
  private noteFirstSteps(change: (fs: FirstSteps) => void, always = false): void {
    const c = this.char;
    const fs = c?.firstSteps;
    if (!c || !fs || (!always && c.level > NEWCOMER.TRACK_TO_LEVEL)) return;
    this.bankPlayTime();
    change(fs);
    fs.levelReached = Math.max(fs.levelReached, c.level);
    fs.playSecs = c.playTime;
    fs.lastAt = Date.now();
    try { this.repo.recordFirstSteps(c.id, fs); } catch { /* a record, never worth failing a move over */ }
  }
  private restTicks: number = 0;

  constructor(repo: Repository) {
    this.repo = repo;
    this.rng = new RNG(RNG.globalSeed());
    this.pace = initialPace(this.rng);
  }

  // ─── Session bootstrap ───────────────────────────────────────────────────

  getState(): GameState {
    this.bankPlayTime();
    this.checkAnaphylaxis();
    this.standOnFloor();
    const state: GameState = {
      phase: this.phase,
      messages: [...this.messages],
    };

    if (this.char) {
      state.character = { ...this.char };

      const lvl = this.getLevel(this.char.dungeonLevel);
      if (lvl) {
        state.view = this.renderView();
        state.scene = this.buildScene(lvl);
        const district = this.districtHere();
        if (district) state.district = district;
      }
    }

    if (this.combat) state.combat = { ...this.combat };
    if (this.interaction) state.interaction = { ...this.interaction };
    if (this.pendingRoll) state.currentRoll = this.pendingRoll;
    if (this.phase === 'map') {
      state.mapFull = this.mapFull;
      state.mapRevealed = this.levelRevealed();
      state.mapShowWhole = state.mapRevealed && this.mapShowWhole;
    }
    if (this.phase === 'combat' && this.char) state.spellChoices = this.spellChoices();
    if ((this.phase === 'combat' || this.phase === 'playing') && this.ringMenuRings().length > 0) state.ringChoices = this.ringChoices();
    if (this.phase === 'playing' && (this.char?.inventory.amulets?.length ?? 0) > 0) state.amuletChoices = this.amuletChoices();
    if (this.phase === 'lair-warning' && this.lair) state.lair = { monster: this.lair.monster };
    if (this.phase === 'asmodeus-scene' && this.lordScene) state.lordScene = this.lordScene.scene;
    if (this.phase === 'level-intro' && this.char) state.introLevel = this.char.dungeonLevel;
    if (this.phase === 'playing') {
      const seen = this.sightAsmodeus();
      if (seen) state.sighting = seen;
      // Which ladders are close enough to climb (the Up and Down buttons light up).
      state.ladders = { up: this.char!.dungeonLevel > 1 && this.ladderInReach('ladder-up'), down: this.char!.dungeonLevel < 7 && this.ladderInReach('ladder-down') };
      // Which way the ways out lie, for the indicator by the compass.
      const lvlNow = this.getLevel(this.char!.dungeonLevel);
      if (lvlNow) { lvlNow.areas ??= mapAreas(lvlNow.grid); state.waysOut = [...new Set(waysOut(lvlNow.grid, lvlNow.areas, this.char!.x, this.char!.y, this.char!.facing))]; }
      // Every facing's view, so turning needs no wait for the server.
      if (this.char && state.view) {
        const facing = this.char.facing;
        state.turnViews = {};
        for (const f of ['N', 'E', 'S', 'W'] as Direction[]) {
          this.char.facing = f;
          const sight = this.sightAsmodeus();
          const lvlF = this.getLevel(this.char.dungeonLevel);
          const ways = lvlF?.areas ? [...new Set(waysOut(lvlF.grid, lvlF.areas, this.char.x, this.char.y, f))] : undefined;
          state.turnViews[f] = { view: f === facing ? state.view : this.renderView(), ...(sight ? { sighting: sight } : {}), ...(ways ? { waysOut: ways } : {}) };
        }
        this.char.facing = facing;
      }
    }
    // Hit-effect hints belong to the action that just happened, so hand them
    // out once and start fresh for the next one.
    if (this.fx.player || this.fx.monster || this.fx.monsterAttacked || this.fx.cast || this.fx.monsterDied || this.fx.cues || this.fx.objectArt) state.fx = this.fx;
    this.fx = {};

    state.choices = this.buildChoices();
    return state;
  }

  // First-person pseudo-3D corridor view (see corridor-view.ts). Ladders,
  // chests, books, altars, and fountains visible ahead are projected in via
  // the entity-marker seam; monsters are a planned follow-up (they already
  // get their own dedicated portrait during combat).
  private renderView(): string[] {
    if (!this.char) return [];
    const lvl = this.getLevel(this.char.dungeonLevel);
    if (!lvl) return [];

    const entities = this.findVisibleEntities(lvl);
    const level = this.char.dungeonLevel;
    const areas = (lvl.areas ??= mapAreas(lvl.grid));
    const ceiling = (x: number, y: number) => {
      const area = areaAtCell(areas, x, y);
      return area ? ceilingHeight(level, area) : 0;
    };
    return renderCorridorView(lvl.grid, this.char.x, this.char.y, this.char.facing, { level, ceiling }, undefined, entities);
  }

  /** The map within SCENE_RADIUS squares of the character, for the 3D views
   * the browser draws (see SceneData). Landmarks are listed the same way the
   * corridor view shows them: used fountains and altars, opened chests and
   * read books are gone. */
  private buildScene(lvl: LevelCache): SceneData | undefined {
    if (!this.char || !this.dungeonState) return undefined;
    const R = 9;
    const { x: px, y: py } = this.char;
    const level = this.char.dungeonLevel;
    const ds = this.dungeonState;
    const areas = (lvl.areas ??= mapAreas(lvl.grid));
    const dirs: Direction[] = ['N', 'E', 'S', 'W'];
    const mat: Record<string, string> = { stone: 's', brick: 'b', wood: 'w', rough: 'r' };
    const cells: SceneData['cells'] = [];
    const objects: SceneObject[] = [];
    for (let y = py - R; y <= py + R; y++) {
      const row = lvl.grid[y];
      if (!row) continue;
      for (let x = px - R; x <= px + R; x++) {
        const cell = row[x];
        if (!cell || isSolidRock(cell)) continue;
        let walls = 0, torches = 0, carvings = 0, mats = '', bars = 0;
        dirs.forEach((d, i) => {
          if (lvl.gaol?.bars.has(`${x},${y},${d}`)) bars |= 1 << i;
          if (cell.walls[d]) {
            walls |= 1 << i;
            mats += mat[edgeMaterial(level, x, y, d)] ?? 's';
            if (edgeTorch(x, y, d)) torches |= 1 << i;
            if (edgeCarved(level, x, y, d)) carvings |= 1 << i;
          } else mats += '-';
        });
        const area = areaAtCell(areas, x, y);
        const corner = lvl.straight?.has(`${x},${y}`) ? null : curvedCorner(level, cell, area);
        cells.push([x, y, walls, area ? ceilingHeight(level, area) : 0, mats, torches, carvings, corner ? CORNER_CODE[corner] : 0, bars]);
        if (lvl.gaol?.bones.some(b => b.x === x && b.y === y)) objects.push({ x, y, kind: 'bones' });

        const c = lvl.contents.get(`${x},${y}`);
        if (!c) continue;
        if (c.type === 'fountain' && !ds.usedFountains.has(c.id)) objects.push({ x, y, kind: spatialHash(x, y, 29) % 2 === 0 ? 'well' : 'fountain' });
        else if (c.type === 'altar' && !ds.usedAltars.has(c.id)) objects.push({ x, y, kind: 'altar' });
        else if (c.type === 'chest' && !ds.openedChests.has(c.id)) objects.push({ x, y, kind: 'chest' });
        else if (c.type === 'book' && !ds.readBooks.has(c.id)) objects.push({ x, y, kind: 'book' });
        else if (c.type === 'ladder-up' || c.type === 'ladder-down') objects.push({ x, y, kind: c.type });
        else if (c.type === 'unique-monster' && (c.monsterId === 'Asmodeus' || c.monsterId === 'Orc King')) objects.push({ x, y, kind: 'throne', variant: c.monsterId });
        // The other great foes can be seen from afar, waiting in their rooms (until beaten).
        else if (c.type === 'unique-monster' && c.monsterId && !ds.defeatedUniqueMonsters.has(c.id)) {
          const t = currentMonsterType(c.monsterId);
          // It watches the way in: faces the level's entrance, along the longer axis.
          const ex = lvl.entrance.x - x, ey = lvl.entrance.y - y;
          const facing: Direction = Math.abs(ex) >= Math.abs(ey) ? (ex >= 0 ? 'E' : 'W') : (ey >= 0 ? 'S' : 'N');
          objects.push({ x, y, kind: 'monster', type: isHiddenMonster(t) ? hiddenStandIn(t) : t, facing });
        }
        else if (c.type === 'shop') objects.push({ x, y, kind: 'shop' });
        else if (c.type === 'bloodstain') objects.push({ x, y, kind: 'bloodstain' });
      }
    }
    return { x: px, y: py, facing: this.char.facing, level, radius: R, cells, objects };
  }

  /** Scans the same visible depth the corridor renderer will draw and marks
   * any dungeon fixture along it — the renderer itself never looks at
   * CellContent, so this is done here and handed in as plain entity
   * markers. Already-opened/read/used fixtures are skipped, same as the
   * old map view's rule for them. */
  private findVisibleEntities(lvl: LevelCache): EntityMarker[] {
    if (!this.char || !this.dungeonState) return [];
    const ds = this.dungeonState;
    const scan = scanCorridor(
      lvl.grid, this.char.x, this.char.y, this.char.facing, CORRIDOR_VIEW_DEFAULTS.MAX_DEPTH,
    );

    const entities: EntityMarker[] = [];
    scan.steps.forEach((step, depth) => {
      const content = lvl.contents.get(`${step.x},${step.y}`);
      if (!content) return;

      switch (content.type) {
        case 'ladder-down':
          entities.push({ depth, pattern: [...CONTENT_PATTERNS.ladderDown] });
          break;
        case 'ladder-up':
          entities.push({ depth, pattern: [...CONTENT_PATTERNS.ladderUp] });
          break;
        case 'chest':
          if (!ds.openedChests.has(content.id)) entities.push({ depth, pattern: [...CONTENT_PATTERNS.chest] });
          break;
        case 'book':
          if (!ds.readBooks.has(content.id)) entities.push({ depth, pattern: [...CONTENT_PATTERNS.book] });
          break;
        case 'altar':
          if (!ds.usedAltars.has(content.id)) entities.push({ depth, pattern: [...CONTENT_PATTERNS.altar] });
          break;
        case 'shop':
          entities.push({ depth, pattern: [...CONTENT_PATTERNS.shop] });
          break;
        case 'fountain':
          if (!ds.usedFountains.has(content.id)) {
            // Purely cosmetic variety between fountains — same fixture
            // always looks the same, different fountains may not.
            const isWell = spatialHash(step.x, step.y, 29) % 2 === 0;
            entities.push({ depth, pattern: [...(isWell ? CONTENT_PATTERNS.well : CONTENT_PATTERNS.fountain)] });
          }
          break;
      }
    });
    return entities;
  }

  private buildChoices(): Choice[] {
    if (this.phase === 'main-menu') {
      return [
        { key: 'n', text: 'NEW CHARACTER' },
        { key: 'c', text: 'CONTINUE CHARACTER' },
        { key: 'd', text: 'DELETE CHARACTER' },
      ];
    }
    if (this.phase === 'char-roll') {
      const rem = this.char?.rerollsRemaining ?? 0;
      return [
        { key: 'a', text: `Accept as Wizard (${this.char?.maxHp ?? 0} HP)` },
        { key: 'b', text: `Accept as Warrior (${(this.char?.maxHp ?? 0) + WARRIOR.HP_BONUS_START} HP)` },
        ...(rem > 0 ? [{ key: 'c', text: `Reroll Character (${rem} reroll${rem === 1 ? '' : 's'} remaining)` }] : []),
      ];
    }
    if (this.phase === 'status') {
      return [{ key: 'x', text: 'Return to Game' }];
    }
    if (this.phase === 'inventory') {
      return [{ key: 'x', text: 'Return to Game' }];
    }
    if (this.phase === 'death') {
      return [
        { key: 'a', text: this.reviveOnLevel6 ? `Revive Somewhere on Level ${DEATH.ASMODEUS_REVIVE_LEVEL}` : 'Revive at the Entrance' },
        { key: 'c', text: 'Restore Last Save' },
        { key: 'q', text: 'Quit to Main Menu' },
      ];
    }
    if (this.phase === 'resting') {
      return [{ key: 'x', text: 'Stop Resting' }];
    }
    if (this.phase === 'victory') {
      return [{ key: 'c', text: 'Continue Playing (Level 1)' }, { key: 'm', text: 'Return to Main Menu' }];
    }
    if (this.phase === 'asmodeus-scene') {
      return [{ key: 'c', text: 'Continue' }];
    }
    if (this.phase === 'lair-warning') {
      return [
        { key: 'a', text: 'Turn Back' },
        { key: 'b', text: 'Step Forward' },
        { key: 'c', text: 'Charge and Attack' },
        { key: 'd', text: 'Sneak In' },
      ];
    }
    if (this.phase === 'combat' && this.combat && (this.char?.heldRounds ?? 0) > 0) {
      return [{ key: 'a', text: `Struggle (${this.char!.heldBy ?? 'held'})` }];
    }
    if (this.phase === 'combat' && this.combat) {
      return [
        { key: 'a', text: 'Attack' },
        { key: 'b', text: this.char?.charClass === 'warrior' ? 'Combat Skill' : 'Cast Spell' },
        { key: 'c', text: 'Pray' },
        { key: 'd', text: 'Run' },
        { key: 'f', text: 'Scare' },
        { key: 'e', text: 'Use Gem' },
        { key: 'p', text: `Drink Potion (${this.char?.inventory.potions ?? 0})` },
        ...(this.ringsOwned().some(r => POWER_RINGS.includes(r)) ? [{ key: 'r', text: 'Use Ring' }] : []),
        ...(this.combat.monster.type === 'Unicorn' ? [{ key: 'h', text: 'Offer Your Hand' }] : []),
        ...(this.repeatSpellKey() ? [{ key: 'z', text: `${knownSpells(this.char!.level, 'wizard').find(s => s.id === this.lastSpell)?.name} again` }] : []),
        ...(!this.combat.monster.definition.isUnique ? [{ key: 'g', text: 'Auto-fight' }] : []),
      ];
    }
    if (this.interaction) {
      return this.interaction.choices;
    }
    return [];
  }

  // ─── Main menu ───────────────────────────────────────────────────────────

  showMainMenu(): GameState {
    this.phase = 'main-menu';
    this.messages = ['========================================',
                     '          THE SEVEN LEVELS',
                     '========================================',
                     '',
                     ...this.rng.pick(MENU_LORE)];
    return this.getState();
  }

  listSaves(): CharacterSummary[] {
    return this.repo.listCharacters();
  }

  deleteCharacter(id: string): void {
    this.repo.deleteCharacter(id);
  }

  showStatus(): GameState {
    if (!this.char) return this.getState();
    const c = this.char;
    const xpForNext = this.xpToNextLevel(c);
    this.phase = 'status';
    this.messages = [
      `══ CHARACTER STATUS ══════════════════════`,
      `${c.name.padEnd(20)} Level ${c.level} ${c.charClass === 'warrior' ? 'Warrior' : 'Wizard'}`
        + (c.charClass === 'warrior' ? `   (${attacksPerRound(c)} attack${attacksPerRound(c) === 1 ? '' : 's'} per round)` : ''),
      `Dungeon Level ${c.dungeonLevel}   XP: ${c.xp}${xpForNext !== null ? ` / ${xpForNext}` : ' (MAX)'}`,
      `HP: ${c.hp} / ${c.maxHp}   Gold: ${c.gold}   Potions: ${c.inventory.potions}   Tomes: ${c.inventory.books}`,
      `Gems: Ruby ${c.inventory.gems.ruby}   Sapphire ${c.inventory.gems.sapphire}   Diamond ${c.inventory.gems.diamond}   Opal ${c.inventory.gems.opal}   Emerald ${c.inventory.gems.emerald}${c.inventory.gems.moonstone ? `   Moonstone ${c.inventory.gems.moonstone}` : ''}${c.inventory.gems.pearl ? `   Pearl ${c.inventory.gems.pearl}` : ''}`,
      ...(wardFights(c) > 0 ? [`Emerald ward: ${wardFights(c)} fight${wardFights(c) === 1 ? '' : 's'} left`] : []),
      ...(bestWeapon(c) ? [`Weapon: ${gearName(bestWeapon(c)!)}`] : []),
      ...(wornArmor(c).body || wornArmor(c).shield ? [`Armour: ${[wornArmor(c).body, wornArmor(c).shield].filter(Boolean).map(a => gearName(a!)).join(' and ')} (turns aside ${Math.round(armorProtection(c) * 100)}% of a blow)`] : []),
      ...(wornAmulet(c) ? [`Amulet worn: ${amuletName(wornAmulet(c)!)}`] : []),
      ...((c.inventory.wornRings ?? []).length ? [`Rings worn: ${c.inventory.wornRings!.map(r => RINGS_INFO[r].name).join(', ')}`] : []),
      ...(c.inventory.readiedRing ? [`Ring readied: ${c.inventory.readiedRing === 'borak' ? 'The Borak' : RINGS_INFO[c.inventory.readiedRing].name} (${RINGS_INFO[c.inventory.readiedRing].power})`] : []),
      ``,
      `STR ${String(c.strength).padStart(2)}   CON ${String(c.constitution).padStart(2)}   INT ${String(c.intelligence).padStart(2)}`,
      `WIS ${String(c.wisdom).padStart(2)}   DEX ${String(c.dexterity).padStart(2)}   CHA ${String(c.charisma).padStart(2)}`,
      `RES ${String(c.resistance).padStart(2)}`,
      ``,
      `Deaths: ${c.deathCount}   Steps: ${c.stepsTaken}   Monsters: ${c.monstersDefeated}`,
      ...(c.asmodeusDefeated ? [`*** ASMODEUS DEFEATED ***`] : []),
      ...(c.invulnerableTurns ? [`Warded: invulnerable for ${c.invulnerableTurns} more combat round${c.invulnerableTurns === 1 ? '' : 's'}`] : []),
      ...(c.statusEffects.length > 0
        ? [``, `Active effects:`, ...c.statusEffects.map(e => `  ${e.type} (${e.turns} turns)`)]
        : []),
    ];
    return this.getState();
  }

  showInventory(): GameState {
    if (!this.char) return this.getState();
    const c = this.char;
    this.phase = 'inventory';

    type Row = { name: string; type: string; qty: string };
    const inv = c.inventory;
    const weapon = bestWeapon(c);
    const armour = wornArmor(c);
    const ringName = (r: RingId) => r === 'borak' ? 'The Borak' : RINGS_INFO[r].name[0].toUpperCase() + RINGS_INFO[r].name.slice(1);
    const ringQty = (r: RingId) => r === 'escape' ? `x${inv.starRings} (${inv.starCharges} use${inv.starCharges === 1 ? '' : 's'} left)` : 'x1';
    const weaponType = (w: Weapon) => `Weapon: ${w.kind}${w.bonus ? `, +${w.bonus} to hit and damage` : ''}${canUseGear(c, w.kind) ? '' : ' (warriors only)'}`;
    const armourType = (a: Armor) => `Armour: ${a.kind}${a.bonus ? ` +${a.bonus}` : ''}${canUseGear(c, a.kind) ? '' : ' (warriors only)'}`;
    const amuletType = (a: Amulet) => a.known ? `Amulet: ${amuletDelta(a) > 0 ? '+' : ''}${amuletDelta(a)} ${a.stat}${a.cursed ? ', CURSED' : ''}` : 'Amulet: unknown';
    const owned = this.ringsOwned();

    // ► Worn and in use: what is actually working for you right now.
    const using: Row[] = [
      ...(weapon ? [{ name: `${gearName(weapon)}`, type: `WIELDED  ${weaponType(weapon)}`, qty: 'x1' }] : []),
      ...[armour.body, armour.shield].filter(Boolean).map(a => ({ name: gearName(a!), type: `WORN     ${armourType(a!)}`, qty: 'x1' })),
      ...(inv.amulets ?? []).filter(a => a.worn).map(a => ({ name: amuletName(a, false), type: `WORN     ${amuletType(a)}`, qty: 'x1' })),
      ...owned.filter(r => isProtectionRing(r) && inv.wornRings?.includes(r)).map(r => ({ name: ringName(r), type: `WORN     Ring: ${RINGS_INFO[r].power}`, qty: ringQty(r) })),
      ...owned.filter(r => !isProtectionRing(r) && inv.readiedRing === r).map(r => ({ name: ringName(r), type: `READIED  Ring: ${RINGS_INFO[r].power}`, qty: ringQty(r) })),
    ];
    // Carried, not in use.
    const carried: Row[] = [
      ...(inv.weapons ?? []).filter(w => w !== weapon).map(w => ({ name: gearName(w), type: weaponType(w), qty: 'x1' })),
      ...(inv.armor ?? []).filter(a => a !== armour.body && a !== armour.shield).map(a => ({ name: gearName(a), type: armourType(a), qty: 'x1' })),
      ...(inv.amulets ?? []).filter(a => !a.worn).map(a => ({ name: amuletName(a, false), type: amuletType(a), qty: 'x1' })),
      ...owned.filter(r => isProtectionRing(r) ? !inv.wornRings?.includes(r) : inv.readiedRing !== r).map(r => ({ name: ringName(r), type: `Ring: ${RINGS_INFO[r].power}`, qty: ringQty(r) })),
      ...(inv.treasures ?? []).map(id => ({ name: treasureById(id)?.name ?? id, type: 'Treasure of Zork', qty: 'x1' })),
    ];
    const supplies: Row[] = [
      { name: 'Healing Potion', type: 'Consumable', qty: `x${inv.potions}` },
      { name: 'Gold', type: 'Currency', qty: `${c.gold}` },
      { name: 'Magic Tome', type: 'Consumable — Arcane Tome', qty: `x${inv.books}` },
      { name: 'Ruby', type: 'Gem — Teleport Away', qty: `x${inv.gems.ruby}` },
      { name: 'Sapphire', type: 'Gem — Banish Monster', qty: `x${inv.gems.sapphire}` },
      { name: 'Diamond', type: 'Gem — Reveal Map', qty: `x${inv.gems.diamond}` },
      { name: 'Opal', type: 'Gem — Chiaroscuro Blast', qty: `x${inv.gems.opal}` },
      { name: 'Emerald', type: 'Gem — Warding (a few fights)', qty: `x${inv.gems.emerald}` },
      ...(inv.gems.moonstone ? [{ name: 'Moonstone', type: 'Gem — Planar Step, once (Y)', qty: `x${inv.gems.moonstone}` }] : []),
      ...(inv.gems.pearl ? [{ name: 'Pilgrim\u2019s Pearl', type: 'Gem — To the nearest fountain or altar (F)', qty: `x${inv.gems.pearl}` }] : []),
    ];
    const all = [...using, ...carried, ...supplies];
    const nameW = Math.max(...all.map(r => r.name.length), 'ITEM'.length) + 4;
    const typeW = Math.max(...all.map(r => r.type.length), 'TYPE'.length) + 2;
    const line = (r: Row, mark: string) => `${(mark + r.name).padEnd(nameW)}${r.type.padEnd(typeW)}${r.qty}`;

    this.messages = [
      `══ INVENTORY ═════════════════════════════`,
      ``,
      `── WORN & IN USE ──`,
      ...(using.length ? using.map(r => line(r, '► ')) : ['  (nothing: you fight bare-handed, unarmoured, no rings or amulet)']),
      ...(carried.length ? [``, `── CARRIED, NOT IN USE ──  (K: gear, J: rings, A: amulets)`, ...carried.map(r => line(r, '  '))] : []),
      ``,
      `── SUPPLIES ──`,
      ...supplies.map(r => line(r, '  ')),
      ...(inv.potions === 0 && inv.books === 0 && Object.values(inv.gems).every(n => n === 0)
        ? [``, `Your pack holds nothing but your coin purse.`] : []),
    ];
    return this.getState();
  }

  dismissInventory(): GameState {
    if (!this.char) return this.getState();
    this.phase = 'playing';
    this.messages = [];
    return this.getState();
  }

  /** M always opens the centered window; F on the map screen toggles to the
   * whole explored floor and back. */
  showMap(): GameState {
    this.mapFull = false;
    this.mapAreaLines = [];
    return this.renderMap();
  }

  toggleMapView(): GameState {
    if (this.phase !== 'map') return this.getState();
    this.mapFull = !this.mapFull;
    return this.renderMap();
  }

  /** X on the map of a revealed level: the whole level, or only the squares
   * actually explored. */
  toggleMapReveal(): GameState {
    if (this.phase !== 'map' || !this.levelRevealed()) return this.getState();
    this.mapShowWhole = !this.mapShowWhole;
    return this.renderMap();
  }

  private levelRevealed(): boolean {
    return !!this.char && !!this.dungeonState?.revealedLevels.has(this.char.dungeonLevel);
  }

  private renderMap(): GameState {
    if (!this.char || !this.dungeonState) return this.getState();

    const lvl = this.getLevel(this.char.dungeonLevel);
    if (!lvl) return this.getState();

    const level = this.char.dungeonLevel;
    const ds = this.dungeonState;
    const grid = lvl.grid;
    const explored_ = (x: number, y: number) => ds.visitedCells.has(visitedKey(level, x, y));
    const whole = this.levelRevealed() && this.mapShowWhole;
    // What the map shows: the explored squares, or the whole revealed level.
    const isVisited = (x: number, y: number) => whole || explored_(x, y);

    let explored = 0;
    let exMinX = this.char.x, exMaxX = this.char.x, exMinY = this.char.y, exMaxY = this.char.y;
    for (const row of grid) {
      for (const cell of row) {
        if (isSolidRock(cell) || !isVisited(cell.x, cell.y)) continue;
        if (explored_(cell.x, cell.y)) explored++;
        exMinX = Math.min(exMinX, cell.x); exMaxX = Math.max(exMaxX, cell.x);
        exMinY = Math.min(exMinY, cell.y); exMaxY = Math.max(exMaxY, cell.y);
      }
    }

    if (explored === 0 && !whole) {
      this.phase = 'map';
      this.messages = [`══ MAP — Level ${this.char.dungeonLevel}${this.levelRevealed() ? ' — EXPLORED ONLY' : ''} — Facing ${this.char.facing} ══`, '', '  No area explored yet.'];
      return this.getState();
    }

    // Testing: on level 7, mark Asmodeus's lair (and keep it in the full view).
    let asmodeusAt: { x: number; y: number } | null = null;
    if (DEBUG.SHOW_ASMODEUS_ON_MAP && this.debugAids && level === 7) {
      for (const [k, c] of lvl.contents) {
        if (c.type !== 'unique-monster' || c.monsterId !== 'Asmodeus' || ds.defeatedUniqueMonsters.has(c.id)) continue;
        const [ax, ay] = k.split(',').map(Number);
        asmodeusAt = { x: ax, y: ay };
        exMinX = Math.min(exMinX, ax); exMaxX = Math.max(exMaxX, ax);
        exMinY = Math.min(exMinY, ay); exMaxY = Math.max(exMaxY, ay);
      }
    }

    // Centered: a fixed-size window around the player, so the map orients on
    // where you are. Full: cropped to everything explored on this floor.
    const radius = DUNGEON.MAP_VIEW_RADIUS;
    const minX = this.mapFull ? exMinX : Math.max(0, this.char.x - radius);
    const maxX = this.mapFull ? exMaxX : Math.min(DUNGEON.WIDTH - 1, this.char.x + radius);
    const minY = this.mapFull ? exMinY : Math.max(0, this.char.y - radius);
    const maxY = this.mapFull ? exMaxY : Math.min(DUNGEON.HEIGHT - 1, this.char.y + radius);

    const rows: string[] = [];
    for (let cy = minY; cy <= maxY; cy++) {
      let row = '';
      for (let cx = minX; cx <= maxX; cx++) {
        const k = `${cx},${cy}`;

        if (cx === this.char!.x && cy === this.char!.y) { row += '@'; continue; }
        if (asmodeusAt && cx === asmodeusAt.x && cy === asmodeusAt.y) { row += 'A'; continue; }

        if (!isVisited(cx, cy)) { row += ' '; continue; }

        // Guards saves where an earlier full-map reveal marked rock visited.
        const cell = grid[cy]?.[cx];
        if (cell && isSolidRock(cell)) { row += ' '; continue; }

        // Content symbols take priority
        const content = lvl.contents.get(k);
        if (content) {
          if (content.type === 'ladder-down')                                        { row += '<'; continue; }
          if (content.type === 'ladder-up')                                          { row += '>'; continue; }
          if (content.type === 'chest'    && !ds.openedChests.has(content.id))      { row += '$'; continue; }
          if (content.type === 'altar'    && !ds.usedAltars.has(content.id))        { row += '+'; continue; }
          if (content.type === 'book'     && !ds.readBooks.has(content.id))         { row += '?'; continue; }
          if (content.type === 'fountain' && !ds.usedFountains.has(content.id))     { row += '~'; continue; }
        }

        // Floor character from wall data
        if (!cell) { row += '.'; continue; }
        const { N, S, E, W } = cell.walls;
        const openCount = [!N, !S, !E, !W].filter(Boolean).length;
        const curve = lvl.straight?.has(k) ? null : curvedCorner(level, cell, areaAtCell(lvl.areas ??= mapAreas(lvl.grid), cx, cy));
        if (lvl.gaol?.aisle.some(p => p.x === cx && p.y === cy)) row += '=';   // the gaol's aisle, between barred cells
        else if (curve)          row += CORNER_GLYPH[curve];   // a curved bend or corner
        else if (openCount >= 3) row += '.';   // room interior / junction
        else if (!N && !S)       row += '|';   // N-S corridor
        else if (!E && !W)       row += '-';   // E-W corridor
        else                     row += '.';   // corner
      }
      rows.push(row);
    }

    const w = maxX - minX + 1;
    this.phase = 'map';
    this.messages = [
      `══ MAP — Dungeon Level ${this.char.dungeonLevel} (${explored} cells explored)${this.mapFull ? ' — FULL FLOOR' : ''}${this.levelRevealed() ? (whole ? ' — WHOLE LEVEL' : ' — EXPLORED ONLY') : ''} — Facing ${this.char.facing} ══`,
      `  ${'─'.repeat(w)}`,
      ...rows.map(r => `  ${r}`),
      `  ${'─'.repeat(w)}`,
      '',
      `  @ You  . Room  |- Corridor  < Down  > Up  $ Chest  + Altar${lvl.gaol ? '  = Barred cells' : ''}${asmodeusAt ? '  A Asmodeus' : ''}`,
      ...(this.mapAreaLines.length ? ['', ...this.mapAreaLines] : []),
    ];
    return this.getState();
  }

  /** Walk or turn while the map is open. The map stays up and redraws, unless
   * the step leads somewhere that needs the normal view: an encounter or
   * any prompt, a ladder or grate, the level's entrance or exit, or a trap. */
  mapMove(action: 'forward' | 'backward' | 'left' | 'right'): GameState {
    if (!this.char || this.phase !== 'map') return this.getState();
    this.phase = 'playing';
    this.presenceFelt = false;
    this.mapAreaLines = [];
    const before = { x: this.char.x, y: this.char.y };
    const state =
      action === 'forward'  ? this.moveForward() :
      action === 'backward' ? this.moveBackward() :
      action === 'left'     ? this.turnLeft() :
                              this.turnRight();
    if (this.phase !== 'playing') return state;

    if (this.presenceFelt) return state;
    const moved = this.char.x !== before.x || this.char.y !== before.y;
    if (moved) {
      const lvl = this.getLevel(this.char.dungeonLevel);
      const content = lvl?.contents.get(`${this.char.x},${this.char.y}`);
      const at = (p: { x: number; y: number } | null | undefined) => !!p && p.x === this.char!.x && p.y === this.char!.y;
      const leaveMap =
        content?.type === 'ladder-up' || content?.type === 'ladder-down' || content?.type === 'trap' ||
        at(lvl?.entrance) || at(lvl?.exit);
      if (leaveMap) return state;
    }
    return this.renderMap();
  }

  dismissMap(): GameState {
    if (!this.char) return this.getState();
    this.phase = 'playing';
    this.messages = [];
    return this.getState();
  }

  dismissStatus(): GameState {
    if (!this.char) return this.getState();
    this.phase = 'playing';
    this.messages = [];
    return this.getState();
  }

  restoreFromSave(): GameState {
    if (!this.char) return this.getState();
    return this.loadCharacter(this.char.id);
  }

  /** S: write the character and dungeon to the save, say so, and carry on.
   * (Leaving the game is Q.) */
  saveGame(): GameState {
    if (!this.char) return this.getState();
    this.repo.saveCharacter(this.char);
    if (this.dungeonState) this.repo.saveDungeonState(this.char.id, this.dungeonState);
    this.messages = ['Game saved.'];
    return this.getState();
  }

  usePot(): GameState {
    if (!this.char) return this.getState();
    if (this.char.inventory.potions <= 0) {
      this.messages = ['You have no healing potions.'];
      return this.getState();
    }
    if (this.char.hp >= this.char.maxHp) {
      this.messages = ['You are already at full health.'];
      return this.getState();
    }
    this.char.inventory.potions--;
    this.cue('gulp');
    this.noteFirstSteps(fs => { fs.potions++; });
    const actual = Math.min(potionHealAmount(this.char, this.rng), this.char.maxHp - this.char.hp);
    this.char.hp += actual;
    const beaten = slowFleshRot(this.char, GHOUL.ROT_PUSHBACK_POTION);
    this.messages = [
      `You drink the healing potion and recover ${actual} HP.`,
      `(${this.char.inventory.potions} potions remaining)`,
      ...(beaten ? [beaten] : []),
    ];
    return this.getState();
  }

  /** Reads a tome's random boon and applies it — shared by reading one from
   * the pack (useBook) and reading one on the spot where it's found. */
  private applyTomeReading(): void {
    if (!this.char) return;
    const result = readBook(this.char, this.rng);
    this.messages = result.messages;
    if (result.mapRevealed) this.revealFullMap();
    this.messages.push(...this.levelUp());
  }

  useBook(): GameState {
    if (!this.char) return this.getState();
    if (this.char.inventory.books <= 0) {
      this.messages = ['You have no magic tomes to read.'];
      return this.getState();
    }

    this.char.inventory.books--;
    this.applyTomeReading();

    return this.getState();
  }

  /** W: settle down to rest. The client then calls restTick() once a second
   * until a wandering monster turns up, the character is fully healed, or
   * the player stops (stopResting). */
  startResting(): GameState {
    if (!this.char || this.phase !== 'playing') return this.getState();
    if (this.char.hp >= this.char.maxHp && !this.char.statusEffects.length) {
      this.messages = ['You are already fully rested.'];
      return this.getState();
    }
    this.restTicks = 0;
    this.phase = 'resting';
    this.messages = ['You settle down against the wall to rest.', '(Press any key to stop.)'];
    return this.getState();
  }

  /** One second of rest: effects tick, wounds heal, and something may come. */
  restTick(): GameState {
    if (!this.char || this.phase !== 'resting') return this.getState();
    this.restTicks++;

    const { messages: statusMsgs, fatal } = tickStatusEffects(this.char);
    if (fatal) return this.handleDeath(fatal);
    const heal = Math.min(
      this.char.maxHp - this.char.hp,
      Math.max(1, Math.round(this.char.maxHp * GAMEPLAY.REST_HEAL_PCT_PER_TICK)),
    );
    this.char.hp += heal;

    if (this.char.hp <= 0) {
      return this.handleDeath('Your wounds proved fatal as you rested.');
    }

    if (this.restTicks > GAMEPLAY.WAIT_ENCOUNTER_GRACE && this.rng.float() < GAMEPLAY.WAIT_ENCOUNTER_CHANCE) {
      this.phase = 'playing';
      const lead = [...statusMsgs, 'Something stirs in the darkness...', ''];
      this.startRandomEncounter();
      this.messages = [...lead, ...this.messages];   // keep the warning above the monster's entrance
      return this.getState();
    }

    if (this.char.hp >= this.char.maxHp && !this.char.statusEffects.length) {
      this.phase = 'playing';
      this.messages = [...statusMsgs, 'You rise, fully rested.'];
      return this.getState();
    }

    this.messages = [...statusMsgs, `Resting... HP ${this.char.hp}/${this.char.maxHp}`, '(Press any key to stop.)'];
    return this.getState();
  }

  stopResting(): GameState {
    if (!this.char || this.phase !== 'resting') return this.getState();
    this.phase = 'playing';
    this.messages = [`You stop resting. HP ${this.char.hp}/${this.char.maxHp}`];
    return this.getState();
  }

  // ─── Character creation ──────────────────────────────────────────────────

  startNameEntry(): GameState {
    this.phase = 'name-entry';
    this.messages = ['Enter your character name:'];
    return this.getState();
  }

  submitName(name: string): GameState {
    // eslint-disable-next-line no-control-regex
    this.pendingName = name.replace(/[\u0000-\u001f\u007f<>]/g, '').trim().slice(0, 24) || 'Unknown';
    return this.doRoll(0);
  }

  private doRoll(rerollsUsed: number): GameState {
    this.phase = 'char-roll';
    const roll = rollCharacter(this.rng);
    this.pendingRoll = roll;

    const tmpChar = createCharacter('tmp', this.pendingName ?? 'Unknown', roll);
    tmpChar.rerollsRemaining = CHARACTER.MAX_REROLLS - rerollsUsed;
    this.char = tmpChar;

    this.messages = formatRoll(roll);
    return this.getState();
  }

  rerollCharacter(): GameState {
    if (!this.char || this.char.rerollsRemaining <= 0) {
      this.messages = ['No rerolls remaining.'];
      return this.getState();
    }
    const used = CHARACTER.MAX_REROLLS - this.char.rerollsRemaining + 1;
    return this.doRoll(used);
  }

  acceptCharacter(charClass: CharacterClass = 'wizard'): GameState {
    if (!this.char || !this.pendingRoll || !this.pendingName) {
      return this.getState();
    }
    const id = `char-${Date.now()}-${this.rng.int(1000, 9999)}`;
    this.char.id = id;
    this.char.charClass = charClass;
    if (charClass === 'warrior') {
      this.char.maxHp += WARRIOR.HP_BONUS_START;
      this.char.hp = this.char.maxHp;
      // A warrior goes down with a blade, not bare hands.
      this.char.inventory.weapons = [{ kind: 'sword', bonus: 0, name: 'Plain longsword' }];
    }
    // Everyone goes down with a little to start: potions, and coin for the Trading Post.
    this.char.inventory.potions = NEWCOMER.STARTING_POTIONS;
    this.char.gold = NEWCOMER.STARTING_GOLD;
    this.sessionStart = Date.now();  // play time starts now, not while rolling stats
    this.char.playTime = 0;

    // Character must exist in DB before dungeon levels (foreign key constraint)
    this.repo.saveCharacter(this.char);
    this.char.firstSteps = { fights: 0, wins: 0, deaths: 0, deathsBeforeLevel2: 0, potions: 0, runs: 0, escapes: 0, spared: 0, levelReached: 1, playSecs: 0, lastAt: Date.now() };
    this.repo.recordFirstSteps(this.char.id, this.char.firstSteps);

    // Generate all 7 dungeon levels
    for (let lvl = 1; lvl <= 7; lvl++) {
      const seed = this.rng.int(1, 0x7fffffff);
      const serialized = generateLevel(lvl, seed);
      this.repo.saveLevel(id, lvl, serialized);

      // Cache level 1
      if (lvl === 1) {
        const { grid, entrance, exit, contents } = deserializeLevel(serialized);
        placeTreasures(1, grid, entrance, exit, contents);
        placeShop(1, grid, entrance, exit, contents);
        this.levelCache.set(1, { grid, entrance, exit, contents });
        this.char.x = entrance.x;
        this.char.y = entrance.y;
      }
    }

    // Initialize dungeon state
    this.dungeonState = this.emptyDungeonState();
    this.repo.saveDungeonState(this.char.id, this.dungeonState);

    this.pace = initialPace(this.rng);
    this.phase = 'level-intro';
    this.messages = this.levelIntroWithJourney(1);
    this.char.introsSeen = [1];

    this.repo.saveCharacter(this.char);

    return this.getState();
  }

  // ─── Load character ──────────────────────────────────────────────────────

  loadCharacter(id: string): GameState {
    const char = this.repo.loadCharacter(id);
    if (!char) {
      this.messages = ['Character not found.'];
      return this.getState();
    }
    this.char = char;
    this.dungeonState = this.repo.loadDungeonState(id);
    if (!this.dungeonState) this.dungeonState = this.emptyDungeonState();
    dropLegacyVisitedKeys(this.dungeonState);
    for (const n of this.levelCache.keys()) this.placeHoards(n);   // (a Restore: back to the saved hoards)
    this.lair = null;
    this.lightAround();

    this.loadLevelIntoCache(char.dungeonLevel);

    this.rng = new RNG(RNG.globalSeed());
    this.pace = initialPace(this.rng);
    this.pace.atLevelEntry = true;

    this.sessionStart = Date.now();
    this.phase = 'playing';
    this.lastArea = null;
    this.messages = [`Welcome back, ${char.name}.`, `You are on Dungeon Level ${char.dungeonLevel}.`, '', ...this.enterArea()];
    return this.getState();
  }

  // ─── Movement ────────────────────────────────────────────────────────────

  moveForward(): GameState {
    // Already standing in front of a chest, a shop...? Stepping toward it
    // opens it (unless you've just left it alone, when you walk over it).
    if (this.phase === 'playing') {
      const ahead = this.approachAhead();
      if (ahead) return ahead;
    }
    return this.tryMove(this.char?.facing ?? 'N', 'forward');
  }

  moveBackward(): GameState {
    const opposite: Record<Direction, Direction> = { N: 'S', S: 'N', E: 'W', W: 'E' };
    return this.tryMove(opposite[this.char?.facing ?? 'N'], 'backward');
  }

  /** Face a direction outright: the browser turns at once and tells the
   * server where the character now faces. */
  face(dir: string): GameState {
    if (!this.char || this.phase !== 'playing' || !['N', 'E', 'S', 'W'].includes(dir)) return this.getState();
    this.char.facing = dir as Direction;
    this.lightAround();
    this.messages = [];
    return this.approachAhead() ?? this.getState();
  }

  turnLeft(): GameState {
    if (!this.char || this.phase !== 'playing') return this.getState();
    const map: Record<Direction, Direction> = { N: 'W', W: 'S', S: 'E', E: 'N' };
    this.char.facing = map[this.char.facing];
    this.lightAround();
    this.messages = [];
    return this.approachAhead() ?? this.getState();
  }

  turnRight(): GameState {
    if (!this.char || this.phase !== 'playing') return this.getState();
    const map: Record<Direction, Direction> = { N: 'E', E: 'S', S: 'W', W: 'N' };
    this.char.facing = map[this.char.facing];
    this.lightAround();
    this.messages = [];
    return this.approachAhead() ?? this.getState();
  }

  /** Torchlight: marks explored every square within LIGHT_RADIUS steps of
   * the character through open passages (down corridors and into rooms,
   * never through walls), so the map fills in around them as they go. */
  private lightAround(): void {
    if (!this.char || !this.dungeonState) return;
    const lvl = this.getLevel(this.char.dungeonLevel);
    if (!lvl) return;
    const level = this.char.dungeonLevel;
    const seen = new Set<string>([`${this.char.x},${this.char.y}`]);
    let frontier = [{ x: this.char.x, y: this.char.y }];
    this.dungeonState.visitedCells.add(visitedKey(level, this.char.x, this.char.y));
    const steps: [Direction, number, number][] = [['N', 0, -1], ['E', 1, 0], ['S', 0, 1], ['W', -1, 0]];
    const radius = this.char.statusEffects.some(e => e.type === 'snuffed') ? 0 : GAMEPLAY.LIGHT_RADIUS;   // no torch, no light
    for (let d = 0; d < radius; d++) {
      const next: { x: number; y: number }[] = [];
      for (const p of frontier) {
        for (const [dir, dx, dy] of steps) {
          if (!canMove(lvl.grid, p.x, p.y, dir) && !lvl.gaol?.bars.has(`${p.x},${p.y},${dir}`)) continue;   // light passes bars
          const q = { x: p.x + dx, y: p.y + dy };
          const k = `${q.x},${q.y}`;
          if (seen.has(k)) continue;
          seen.add(k);
          this.dungeonState.visitedCells.add(visitedKey(level, q.x, q.y));
          next.push(q);
        }
      }
      frontier = next;
    }
  }

  private tryMove(dir: Direction, _label: string): GameState {
    if (!this.char || this.phase !== 'playing') return this.getState();

    const lvl = this.getLevel(this.char.dungeonLevel);
    if (!lvl) return this.getState();

    if (!canMove(lvl.grid, this.char.x, this.char.y, dir)) {
      this.messages = [lvl.gaol?.bars.has(`${this.char.x},${this.char.y},${dir}`)
        ? 'Iron bars block the way. The cell door is locked fast, and the lock is old and heavy.'
        : 'A stone wall blocks your path.'];
      return this.getState();
    }

    // Move
    this.stepFrom = { x: this.char.x, y: this.char.y };
    const dx = dir === 'E' ? 1 : dir === 'W' ? -1 : 0;
    const dy = dir === 'S' ? 1 : dir === 'N' ? -1 : 0;
    this.char.x += dx;
    this.char.y += dy;
    this.char.stepsTaken++;
    this.restTicks = 0;

    // Tick status effects
    const dot = this.char.statusEffects.find(e => e.type === 'poison' || e.type === 'mummified' || e.type === 'bleeding' || e.type === 'flesh-rot');
    const { messages: statusMsgs, damageTaken, fatal } = tickStatusEffects(this.char);
    this.messages = [...statusMsgs, ...wearCursedAmulet(this.char, this.rng)];
    if (fatal) return this.handleDeath(fatal);
    if (damageTaken > 0) this.fx.player = dot?.type === 'poison' ? 'poison' : dot?.type === 'mummified' || dot?.type === 'flesh-rot' ? 'drain' : 'physical';

    // Passive HP regeneration
    if (this.char.stepsTaken % GAMEPLAY.REGEN_HP_EVERY_N_STEPS === 0 && this.char.hp < this.char.maxHp) {
      this.char.hp++;
      this.messages = [...this.messages, 'Your wounds slowly knit. (+1 HP)'];
    }

    if (this.char.hp <= 0) {
      return this.handleDeath('Your wounds proved fatal as you walked.');
    }

    incrementPace(this.pace);
    this.lightAround();
    // Lycanthropy: now and then the beast takes over for a while.
    if (this.char.statusEffects.some(e => e.type === 'lycanthropy') && this.rng.float() < 1 / 70) {
      addStatusEffect(this.char, { type: 'intelligence-reduced', value: 5, turns: 25 });
      const heal = Math.min(this.char.maxHp - this.char.hp, Math.round(this.char.maxHp * 0.1));
      this.char.hp += heal;
      this.messages = [...this.messages, 'Your bones crack and fur ripples over your skin. The beast takes over!',
        `You lope through the dark on all fours, snarling. (-5 Intelligence for a while${heal > 0 ? `, +${heal} HP` : ''})`];
    }
    const shock = this.char.statusEffects.find(e => e.type === 'anaphylaxis');
    if (shock && this.char.playTime - this.shockWarnedAt >= 30) {
      this.shockWarnedAt = this.char.playTime;
      const left = Math.max(0, shock.value - this.char.playTime);
      this.messages = [...this.messages, left > 60
        ? `Your throat is swelling shut. Every breath is a fight. (About ${Math.round(left / 60)} minutes left.)`
        : 'Your lips are blue and the world is going grey. Seconds now.'];
    }
    const areaLines = this.enterArea();
    if (areaLines.length) this.messages = [...this.messages, ...(this.messages.length ? [''] : []), ...areaLines];
    const longWay = this.alongTheLongWay();
    if (longWay.length) {
      this.messages = [...this.messages, ...(this.messages.length ? [''] : []), ...longWay];
      return this.getState();   // nothing else happens on the same step
    }

    // Check cell content. Something you already dealt with from the next
    // square (a chest you left shut, say) lets you walk over it.
    const cellKey = `${this.char.x},${this.char.y}`;
    const content = lvl.contents.get(cellKey);
    const passingOver = !!content && APPROACHABLE.has(content.type) && this.approached?.key === cellKey;
    if (this.approached && cellKey !== this.approached.key && cellKey !== this.approached.from) this.approached = null;

    const contentState = passingOver ? null : this.handleCellContent(content, cellKey);
    if (contentState) {
      return contentState;
    }
    // A chest, altar, fountain, book or shop right ahead: it opens now, before you step onto it.
    const ahead = this.approachAhead();
    if (ahead) return ahead;

    // Check random encounter
    if (shouldTriggerRandomEncounter(this.pace, this.rng)) {
      return this.startRandomEncounter();
    }

    // Deep down, now and then, a wandering Peddler.
    if (this.char.dungeonLevel >= SHOP.PEDDLER_FROM_LEVEL && !content && this.rng.float() < SHOP.PEDDLER_CHANCE) {
      return this.openShop('peddler');
    }

    const swoop = this.nearTheAboleth();
    if (swoop) return swoop;
    this.feelPresences();
    return this.getState();
  }

  /** Echoes of other players: up to a few bloodstains on this level where
   * their characters fell lately (decent names only), each on a quiet square
   * of a room, the same squares every time this level is loaded. */
  private placeBloodstains(levelNum: number, grid: DungeonCell[][], entrance: { x: number; y: number }, contents: Map<string, CellContent>): void {
    if (!this.char) return;
    let deaths: Death[] = [];
    try { deaths = this.repo.recentDeaths(levelNum, this.char.id, Date.now() - ECHOES.RECENT_DAYS * 86400000, ECHOES.STAINS_PER_LEVEL * 3); } catch { return; }
    deaths = deaths.filter(d => nameIsDecent(d.name)).slice(0, ECHOES.STAINS_PER_LEVEL);
    if (!deaths.length) return;
    const reach = floodFill(grid, entrance.x, entrance.y);
    const quiet = [...reach].filter(k => !contents.has(k)).sort();
    for (const d of deaths) {
      if (!quiet.length) break;
      const i = (d.id * 2654435761 + this.char.id.length * 97) % quiet.length;
      const k = quiet.splice(Math.abs(i), 1)[0];
      contents.set(k, { type: 'bloodstain', id: `blood-${d.id}`, echo: d });
    }
  }

  /** The shade of a character who fell on this level lately, if there is one. */
  private shadeEncounter(): GameState | null {
    const c = this.char;
    if (!c) return null;
    let deaths: Death[] = [];
    try { deaths = this.repo.recentDeaths(c.dungeonLevel, c.id, Date.now() - ECHOES.RECENT_DAYS * 86400000, 10).filter(d => nameIsDecent(d.name)); } catch { return null; }
    if (!deaths.length) return null;
    const d = deaths[this.rng.int(0, deaths.length - 1)];
    // About their level, but no stranger to this depth.
    const range = MONSTER_SCALING.LEVEL_RANGE_BY_DUNGEON_LEVEL[Math.min(6, c.dungeonLevel - 1)];
    const lvl = Math.max(range.min, Math.min(d.charLevel, range.max + Math.floor(c.level / MONSTER_SCALING.CHAR_LEVEL_CAP_DIVISOR))) + this.worldBoost();
    const monster = createMonster('Shade', lvl, `shade-${d.id}-${Date.now()}`, true);
    monster.echoOf = d;
    return this.beginCombat(monster);
  }

  // ─── Auto-fight ──────────────────────────────────────────────────────────
  // The game picks this round's action (core/autofight.ts) and learns from
  // what it did. One round per call: the browser calls again while the player
  // lets it run, so it is no more traffic than clicking.

  autoFight(): GameState {
    const c = this.char, cb = this.combat;
    if (!c || !cb || this.phase !== 'combat') return this.getState();
    const m = cb.monster;
    let lore: Lore = {};
    try { lore = this.repo.fightLore(c.charClass, m.type); } catch { /* learning is a nicety */ }
    const choice = chooseAuto(c, m, lore, this.rng, { held: this.isHeld(), powerReady: this.powerAttackWait() === 0 });
    if (choice.kind === 'stop') {
      this.messages = [`AUTO-FIGHT STOPS. ${choice.why}`];
      const s = this.getState();
      s.autoFight = { stopped: choice.why };
      return s;
    }
    const before = m.hp;
    let label: string, s: GameState;
    if (choice.kind === 'potion') { label = 'Potion'; s = this.combatAction('p'); }
    else if (choice.kind === 'struggle' || choice.kind === 'attack') { label = choice.kind === 'struggle' ? 'Struggle' : 'Attack'; s = this.combatAction('a'); }
    else {
      const i = knownSpells(c.level, c.charClass).findIndex(sp => sp.id === choice.spell);
      label = choice.name;
      s = this.spellAction(String.fromCharCode(97 + i));
    }
    // What it did: the monster's health before, against after (all of it, if it fell).
    const action = loreAction(choice);
    if (action) {
      const after = this.combat?.monster === m ? Math.max(0, m.hp) : 0;
      try { this.repo.learnFight(c.charClass, m.type, action, before - after); } catch { /* learning is a nicety */ }
    }
    s.messages = [`[AUTO] ${label}  (any key or tap to take over)`, ...s.messages];
    this.messages = s.messages;
    s.autoFight = { action: label };
    return s;
  }

  /** Walking near the Aboleth's lair: you smell it, you hear it, and now and
   * then it comes for you on its wings and strikes before you can act. */
  private nearTheAboleth(): GameState | null {
    const c = this.char, ds = this.dungeonState;
    if (!c || !ds || c.dungeonLevel !== 6) return null;
    const lvl = this.getLevel(6);
    if (!lvl) return null;
    let lair: { content: CellContent; x: number; y: number } | null = null;
    for (const [k, v] of lvl.contents) {
      if (v.type !== 'unique-monster' || !v.monsterId || currentMonsterType(v.monsterId) !== 'Aboleth' || ds.defeatedUniqueMonsters.has(v.id)) continue;
      const [x, y] = k.split(',').map(Number);
      lair = { content: v, x, y };
    }
    if (!lair) return null;
    const d = Math.abs(lair.x - c.x) + Math.abs(lair.y - c.y);
    if (d === 0 || d > ABOLETH.SENSE_RADIUS) return null;
    if (this.rng.float() < ABOLETH.POUNCE_CHANCE) {
      this.cue('aboleth');
      this.startFixedEncounter(lair.content, 'Aboleth');
      return this.lairFirstStrike([
        'The black water heaves, and bursts apart in a wall of green-lit spray.',
        'Before you can raise a hand, the Aboleth surges out of it and is upon you!', '']);
    }
    if (d <= ABOLETH.SOUND_RADIUS && this.rng.float() < ABOLETH.SOUND_CHANCE) this.cue('aboleth');
    if (this.rng.float() < ABOLETH.STINK_CHANCE) {
      const lines = d <= ABOLETH.SOUND_RADIUS ? ABOLETH_NEAR_LINES : ABOLETH_SENSE_LINES;
      this.messages = [...this.messages, ...(this.messages.length ? [''] : []), this.rng.pick(lines)];
      this.presenceFelt = true;
    }
    return null;
  }

  /** A quiet step may bring word of the uniques: Asmodeus's voice or fury,
   * the Bone Sovereign's fear, or the others' sounds from their lairs. */
  /** A new character hears Asmodeus once early on level 1: somewhere between
   * NEWCOMER.FIRST_VOICE_FROM_STEP and _BY_STEP (evenly, and certainly by the last). */
  private firstVoiceDue(): boolean {
    const c = this.char;
    if (!c?.firstSteps || c.firstSteps.voiceHeard || c.dungeonLevel !== 1) return false;
    const { FIRST_VOICE_FROM_STEP: from, FIRST_VOICE_BY_STEP: by } = NEWCOMER;
    if (c.stepsTaken < from) return false;
    return c.stepsTaken >= by || this.rng.float() < 1 / (by - c.stepsTaken + 1);
  }

  private feelPresences(): void {
    this.presenceFelt = false;
    if (!this.char || !this.dungeonState) return;
    const ds = this.dungeonState;
    const alive = (id: string) => !ds.defeatedUniqueMonsters.has(id);

    const lairsOn = (levelNum: number): Lair[] => {
      const lvl = this.getLevel(levelNum);
      if (!lvl) return [];
      const out: Lair[] = [];
      for (const [k, c] of lvl.contents) {
        if (c.type !== 'unique-monster' || !c.monsterId || !alive(c.id)) continue;
        const [x, y] = k.split(',').map(Number);
        out.push({ type: currentMonsterType(c.monsterId), x, y });   // (old saves may use an old name)
      }
      return out;
    };

    const level = this.char.dungeonLevel;
    const here = lairsOn(level).filter(l => l.type !== 'Asmodeus');
    // Big Fat Dragon is heard through the floor from the level above.
    const tiamatBelow = level === 6 ? lairsOn(7).filter(l => l.type === 'Big Fat Dragon') : [];
    const deepest = lairsOn(7);
    const asmodeus = deepest.find(l => l.type === 'Asmodeus');
    const asmodeusAlive = !!asmodeus;   // banished or not, he always comes back

    const ev = rollPresence({
      char: this.char,
      level,
      lairs: [...here, ...tiamatBelow],
      asmodeusAlive,
      asmodeusLair: level === 7 && asmodeus ? { x: asmodeus.x, y: asmodeus.y } : null,
      voiceDue: this.firstVoiceDue(),
    }, this.rng);
    if (!ev) return;
    if (ev.voice) this.noteFirstSteps(fs => { fs.voiceHeard = true; }, true);

    this.presenceFelt = true;
    this.messages = [...this.messages, ...(this.messages.length ? [''] : []), ...ev.messages];
    if (ev.fx) this.fx.player = ev.fx;
    if (ev.turnTo) this.char.facing = ev.turnTo;
    if (ev.flee) this.teleportPlayer();
  }

  /** Things you deal with from the square in front of them, not by stepping
   * on: when one is right ahead (no wall between), it opens as you come up
   * to it or turn to face it. Once you've left it alone, it stays quiet
   * while you stand there and lets you walk over it. (Traps aren't among
   * them: you find those by stepping on them.) */
  private approached: { key: string; from: string } | null = null;

  private approachAhead(): GameState | null {
    if (!this.char || this.phase !== 'playing') return null;
    const lvl = this.getLevel(this.char.dungeonLevel);
    if (!lvl || !canMove(lvl.grid, this.char.x, this.char.y, this.char.facing)) return null;
    const [dx, dy] = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] }[this.char.facing];
    const key = `${this.char.x + dx},${this.char.y + dy}`;
    const content = lvl.contents.get(key);
    if (!content || !APPROACHABLE.has(content.type)) return null;
    const here = `${this.char.x},${this.char.y}`;
    if (this.approached?.key === key && this.approached.from === here) return null;
    const before = this.messages;
    const state = this.handleCellContent(content, key);
    if (!state) return null;
    this.approached = { key, from: here };
    // Keep what the step itself said (the room you came into, say) above it.
    if (before.length && before !== this.messages) {
      this.messages = [...before, '', ...this.messages];
      state.messages = [...this.messages];
    }
    return state;
  }

  private handleCellContent(content: CellContent | undefined, cellKey: string): GameState | null {
    if (!content || !this.char || !this.dungeonState) return null;

    const ds = this.dungeonState;
    const lvl = this.getLevel(this.char.dungeonLevel)!;

    switch (content.type) {
      case 'shop': {
        if (content.id !== 'outpost') return this.openShop('post');
        // The Outpost keeps shifts, and sometimes a monster eats the proprietor.
        this.bankPlayTime();
        const hours = outpostHours(this.char, this.char.playTime);
        if (hours.state === 'open') return this.openShop('outpost');
        const when = `(It opens again in about ${hours.minutesToOpen} minute${hours.minutesToOpen === 1 ? '' : 's'} of play.)`;
        this.messages = hours.state === 'eaten'
          ? ['You come to the Outpost: a stall of rough planks with its shutters smashed in.',
             'Claw marks score the counter, and there is a great deal of blood.',
             'A note is pinned to what is left of the shutter: PROPRIETOR EATEN. NEW SHIFT STARTS SOON.', when]
          : ['You come to the Outpost: a stall of rough planks. The shutters are down.',
             'A sign hangs from the latch: CLOSED BETWEEN SHIFTS. RING TWICE AND RUN.', when];
        return this.getState();
      }
      case 'bloodstain': {
        const d = content.echo;
        if (!d) return null;
        const first = !ds.visitedDescriptions.has(content.id);
        ds.visitedDescriptions.add(content.id);
        this.messages = [...this.messages, '', ...(first
          ? ['A dark stain on the stones, old blood ground into the cracks.',
             `Here fell ${d.name}, a level ${d.charLevel} ${d.charClass}, ${agoText(d.diedAt)}.`,
             `(${d.cause})`]
          : [`The stain where ${d.name} fell.`])];
        return null;   // walk on
      }

      case 'description': {
        const descId = content.descriptionId ?? content.id;
        const isFirst = !ds.visitedDescriptions.has(content.id);
        ds.visitedDescriptions.add(content.id);

        const text = isFirst
          ? getDescription(descId)
          : getDescriptionShort(descId);

        if (text) {
          this.messages = [...this.messages, '', ...text];
        }
        return null; // Continue movement, don't block
      }

      case 'ladder-up':
      case 'ladder-down': {
        const isUp = content.type === 'ladder-up';
        this.messages = [
          ...this.messages,
          isUp
            ? `You stand before a ladder leading UP (to Level ${this.char.dungeonLevel - 1}).`
            : `You stand before a ladder leading DOWN (to Level ${this.char.dungeonLevel + 1}).`,
          isUp ? 'Press U to climb up.' : 'Press D to climb down.',
        ];
        return null;
      }

      case 'chest': {
        if (ds.openedChests.has(content.id)) return null;
        this.interaction = {
          type: 'chest',
          contentId: content.id,
          choices: [
            { key: 'a', text: 'Open it' },
            { key: 'b', text: 'Check it for traps' },
            { key: 'c', text: 'Leave it' },
          ],
        };
        this.phase = 'interaction';
        this.messages = ['You discover an iron-bound chest.', ...this.messages];
        return this.getState();
      }

      case 'book': {
        if (ds.readBooks.has(content.id)) return null;
        this.interaction = {
          type: 'book',
          contentId: content.id,
          choices: [
            { key: 'a', text: 'Read it now' },
            { key: 'b', text: 'Take it for later' },
            { key: 'c', text: 'Leave it alone' },
          ],
        };
        this.phase = 'interaction';
        this.messages = [
          'You find an ancient magic tome resting on a stone pedestal.',
          'Its cover is marked with a silver eye.',
          ...this.messages,
        ];
        return this.getState();
      }

      case 'altar': {
        if (ds.usedAltars.has(content.id)) return null;
        this.interaction = {
          type: 'altar',
          contentId: content.id,
          choices: [{ key: 'a', text: 'Pray at the altar' }, { key: 'b', text: 'Leave' }],
        };
        this.phase = 'interaction';
        this.messages = ['You stand before an altar of white marble.', ...this.messages];
        return this.getState();
      }

      case 'fountain': {
        if (ds.usedFountains.has(content.id)) return null;
        this.interaction = {
          type: 'fountain',
          contentId: content.id,
          choices: [{ key: 'a', text: 'Drink' }, { key: 'b', text: 'Leave' }],
        };
        this.phase = 'interaction';
        this.messages = [
          'You discover a stone fountain filled with shimmering water.',
          ...this.messages,
        ];
        return this.getState();
      }

      case 'trap': {
        if (ds.triggeredTraps.has(content.id) || ds.disarmedTraps.has(content.id)) return null;
        const variant = content.trapVariant ?? 'pit';

        // Some traps trigger immediately
        if (['pit', 'falling-stone', 'fire-blast', 'acid-spray'].includes(variant)) {
          const result = resolveTrapTriggered(this.char, variant, this.rng);
          this.fx.player = trapElement(variant);
          ds.triggeredTraps.add(content.id);
          this.messages = [...this.messages, '', ...result.messages];

          if (result.teleported) {
            this.teleportPlayer();
          }
          if (result.triggerMonster) {
            return this.startRandomEncounter();
          }
          if (this.char.hp <= 0) {
            return this.handleDeath(this.trapDeathCause(variant));
          }
          return null;
        }

        // Traps with choice
        this.interaction = {
          type: 'trap-choice',
          contentId: content.id,
          choices: [
            { key: 'a', text: 'Attempt to avoid it' },
            { key: 'b', text: 'Attempt to disarm it' },
            { key: 'c', text: 'Turn back' },
            ...(variant === 'teleport' ? [{ key: 'd', text: 'Step into it' }] : []),
          ],
        };
        this.phase = 'interaction';
        this.messages = [
          `You notice a ${variant.replace('-', ' ')} trap!`,
          ...this.messages,
        ];
        return this.getState();
      }

      case 'fixed-monster': {
        const monsterId = content.monsterId ?? 'Goblin';
        if (ds.defeatedFixedMonsters.has(content.id)) return null;
        return this.startFixedEncounter(content, monsterId as Parameters<typeof getDefinition>[0]);
      }

      case 'unique-monster': {
        const monsterId = (content.monsterId ?? 'Asmodeus') as MonsterType;
        if (ds.defeatedUniqueMonsters.has(content.id)) return null;
        if (monsterId === 'Asmodeus' && this.rng.float() < LAIR.ASMODEUS_DISMISS_CHANCE) return this.dismissedByAsmodeus();
        if (LAIRS[monsterId]) return this.startLairWarning(content, monsterId);
        return this.startFixedEncounter(content, monsterId);
      }

      default:
        return null;
    }
  }

  // ─── Level transitions ───────────────────────────────────────────────────

  /** A ladder of this kind on your square, or on one beside it with no wall
   * between: close enough to climb. */
  private ladderInReach(kind: 'ladder-up' | 'ladder-down'): boolean {
    if (!this.char) return false;
    const lvl = this.getLevel(this.char.dungeonLevel);
    if (!lvl) return false;
    const { x, y } = this.char;
    if (lvl.contents.get(`${x},${y}`)?.type === kind) return true;
    const STEP: [Direction, number, number][] = [['N', 0, -1], ['E', 1, 0], ['S', 0, 1], ['W', -1, 0]];
    return STEP.some(([d, dx, dy]) => canMove(lvl.grid, x, y, d) && lvl.contents.get(`${x + dx},${y + dy}`)?.type === kind);
  }

  climbUp(): GameState {
    if (!this.char || this.phase !== 'playing') return this.getState();
    const lvl = this.getLevel(this.char.dungeonLevel);
    if (!lvl) return this.getState();

    if (!this.ladderInReach('ladder-up') || this.char.dungeonLevel <= 1) {
      this.messages = ['There is no ladder leading up within reach.'];
      return this.getState();
    }

    this.char.dungeonLevel--;
    this.loadLevelIntoCache(this.char.dungeonLevel);
    const newLvl = this.getLevel(this.char.dungeonLevel)!;
    // Place at exit of upper level
    if (newLvl.exit) {
      this.char.x = newLvl.exit.x;
      this.char.y = newLvl.exit.y;
    }

    return this.enterLevel();
  }

  climbDown(): GameState {
    if (!this.char || this.phase !== 'playing') return this.getState();
    const lvl = this.getLevel(this.char.dungeonLevel);
    if (!lvl) return this.getState();

    if (!this.ladderInReach('ladder-down') || this.char.dungeonLevel >= 7) {
      this.messages = ['There is no ladder leading down within reach.'];
      return this.getState();
    }
    if (this.isChampion() && this.char.dungeonLevel < 6) {
      const s = this.offerDeepDescent(['The stairs go down further than they should. They remember you. How deep?']);
      if (this.interaction) this.interaction.contentId = 'descend-ladder';
      return s;
    }
    if (this.char.dungeonLevel === 2 && !this.tollSettled()) return this.offerToll();

    this.char.dungeonLevel++;
    this.loadLevelIntoCache(this.char.dungeonLevel);
    const newLvl = this.getLevel(this.char.dungeonLevel)!;
    this.char.x = newLvl.entrance.x;
    this.char.y = newLvl.entrance.y;

    return this.enterLevel();
  }

  private enterLevel(): GameState {
    if (!this.char) return this.getState();
    const lvlNum = this.char.dungeonLevel;

    this.pace.atLevelEntry = true;
    this.pace.movesSinceCombat = 0;

    this.lightAround();
    this.lastArea = null;


    if (!this.char.introsSeen.includes(lvlNum)) {
      this.char.introsSeen.push(lvlNum);
      this.phase = 'level-intro';
      this.messages = this.levelIntroWithJourney(lvlNum);
      return this.getState();
    }

    this.phase = 'playing';
    this.messages = [`Level ${lvlNum}.`, '', ...this.enterArea()];
    return this.getState();
  }

  /** A level's first-arrival scene: its own words, then the journey so far,
   * and a rumour of what waits on this level. (The client draws its picture.) */
  private levelIntroWithJourney(levelNum: number): string[] {
    const c = this.char!;
    const ds = this.dungeonState;
    const lines = getLevelIntro(levelNum).filter(l => l !== 'PRESS ANY KEY');
    while (lines.length && lines[lines.length - 1] === '') lines.pop();
    if (levelNum === 1 && c.monstersDefeated === 0 && c.stepsTaken === 0) return [...lines, '', 'PRESS ANY KEY'];
    const mins = Math.floor(c.playTime / 60);
    const time = mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`;
    const alive = (id: string) => !ds?.defeatedUniqueMonsters.has(id) && !ds?.defeatedFixedMonsters.has(id);
    const RUMOURS: Record<number, [string, string][]> = {
      2: [['', 'They say the goblins here have learned to set traps.'], [TOLL_KEEPER_ID, 'Something keeps a toll on the stair down. Bring gold, or bring a spare finger.']],
      3: [['', 'Some of the dead here walk. Some of them remember who they were.']],
      4: [['unique-orc-king', 'War drums. The Orc King holds a hall of shields somewhere on this level.']],
      5: [['unique-barrow-king', 'Somewhere on this level is a barrow. Something in it has been waiting a thousand years.']],
      6: [['unique-lambton-worm', 'A worm that cannot be cut lies coiled on its hoard down here.'], ['unique-dracolich', 'A dragon that died and did not stop.'], ['unique-aboleth', 'Something ancient in the black water.']],
      7: [['unique-rakshasa', 'A tiger in a scholar\u2019s silks holds court here. Spells slide off it; only the finest blades bite.'], ['unique-asmodeus', 'At the end of a long and narrow way, on a throne of black iron, Asmodeus waits for you.']],
    };
    const rumours = (RUMOURS[levelNum] ?? []).filter(([id]) => !id || alive(id)).map(([, t]) => t);
    return [
      ...lines,
      '',
      '── YOUR JOURNEY SO FAR ──',
      `Depth: Level ${levelNum} of 7${levelNum === 7 ? ', the last' : ''}`,
      `${c.name}: Level ${c.level} ${c.charClass === 'warrior' ? 'Warrior' : 'Wizard'}, ${c.hp}/${c.maxHp} HP`,
      `Monsters slain: ${c.monstersDefeated}${c.uniqueMonstersDefeated ? `   Great foes felled: ${c.uniqueMonstersDefeated}` : ''}`,
      `Time below: ${time}   Gold: ${c.gold}${c.deathCount ? `   Deaths: ${c.deathCount}` : ''}`,
      ...(rumours.length ? ['', ...rumours.map(r => `Rumour: ${r}`)] : []),
      '',
      'PRESS ANY KEY',
    ];
  }

  dismissLevelIntro(): GameState {
    if (!this.char) return this.getState();
    this.phase = 'playing';
    this.messages = this.enterArea();
    return this.getState();
  }

  /** Lines describing the room or corridor the character has just stepped
   * into, if it's a different one from before (see content/area-text.ts). */
  private enterArea(): string[] {
    if (!this.char || !this.dungeonState) return [];
    const lvl = this.getLevel(this.char.dungeonLevel);
    if (!lvl) return [];
    lvl.areas ??= mapAreas(lvl.grid);
    const area = areaAtCell(lvl.areas, this.char.x, this.char.y);
    if (!area) return [];
    const key = `${this.char.dungeonLevel}:${area.id}`;
    if (key === this.lastArea) return [];
    this.lastArea = key;
    const seenKey = `area:${key}`;
    const first = !this.dungeonState.visitedDescriptions.has(seenKey);
    this.dungeonState.visitedDescriptions.add(seenKey);
    if (lvl.gaol && lvl.gaol.aisle.some(p => p.x === this.char!.x && p.y === this.char!.y)) {
      this.mapAreaLines = first ? GAOL_LINES : ['You are back in the old gaol.'];
      return this.mapAreaLines;
    }
    const district = this.districtHere();
    const lines = describeArea(this.char.dungeonLevel, area, first, district ? DISTRICTS[district] : undefined);
    if (district) {
      // The first time into each district of the seventh level, say where you've come.
      const dk = `district:${district}`;
      if (!this.dungeonState.visitedDescriptions.has(dk)) {
        this.dungeonState.visitedDescriptions.add(dk);
        lines.unshift(...DISTRICTS[district].arrival, '');
      }
      // The room the crack opens from.
      const m = lvl.sanctum?.mouth;
      if (first && m && areaAtCell(lvl.areas, m.x, m.y) === area) lines.splice(lines.length - 1, 0, 'In one wall, a narrow crack opens on a passage of black glass, leading down into the dark.');
    }
    // Say which way the ways out lie: "There are three ways out: two ahead and one behind you."
    const last = lines.length - 1;
    if (area.kind === 'room' && last >= 0 && /way(s)? out\.$/.test(lines[last]) && area.exits > 0) {
      const ways = waysOut(lvl.grid, lvl.areas, this.char.x, this.char.y, this.char.facing);
      if (ways.length) lines[last] = lines[last].replace(/\.$/, `: ${bearingsPhrase(ways)}.`);
    }
    this.mapAreaLines = lines;
    return lines;
  }

  /** The district of the seventh level the character is in, or null elsewhere. */
  private districtHere(): DistrictId | null {
    if (!this.char || this.char.dungeonLevel !== 7) return null;
    const lvl = this.getLevel(7);
    if (!lvl) return null;
    lvl.areas ??= mapAreas(lvl.grid);
    lvl.districts ??= assignDistricts(lvl.grid, lvl.areas, lvl.entrance, lvl.sanctum ?? null, lvl.seed ?? 0);
    const i = lvl.areas.areaAt[this.char.y * (lvl.grid[0]?.length ?? 0) + this.char.x];
    return i >= 0 ? lvl.districts[i] ?? null : null;
  }

  /** What happens along the Long Way to the throne, each thing once, as you
   * reach its place in the passage (content/district-text.ts). */
  private alongTheLongWay(): string[] {
    if (!this.char || !this.dungeonState || this.char.dungeonLevel !== 7) return [];
    const sc = this.getLevel(7)?.sanctum;
    if (!sc) return [];
    const i = sc.path.findIndex(p => p.x === this.char!.x && p.y === this.char!.y);
    if (i < 0) return [];
    const ev = APPROACH_EVENTS.find(e => Math.floor(e.at * sc.path.length) === i);
    if (!ev) return [];
    const seenKey = `longway:${ev.id}`;
    if (this.dungeonState.visitedDescriptions.has(seenKey)) return [];
    this.dungeonState.visitedDescriptions.add(seenKey);
    const lines = [...ev.lines];
    if (ev.id === 'fire') {
      const roll = this.rng.int(1, 20) + this.lairDexBonus();
      if (roll >= LONG_WAY.FIRE_DC) lines.push(`You throw yourself flat, and the fire roars over you. (Dexterity: rolled ${roll}, needed ${LONG_WAY.FIRE_DC})`);
      else {
        const dmg = Math.min(this.char.hp - 1, Math.max(1, Math.round(this.char.maxHp * LONG_WAY.FIRE_SHARE)));
        this.char.hp -= dmg;
        this.fx.player = 'fire';
        lines.push(`It catches you! You burn for ${dmg} damage. (Dexterity: rolled ${roll}, needed ${LONG_WAY.FIRE_DC})`);
      }
    }
    if (ev.id === 'mercy') {
      this.char.inventory.potions++;
      lines.push('You take the vial. It is a healing potion. (+1 potion)');
    }
    return lines;
  }

  // ─── Great lairs ──────────────────────────────────────────────────────────

  /** Stepping into a great lair stops at its edge: turn back, step forward,
   * or charge (see LAIR in config.ts and content/lair-text.ts). */
  private startLairWarning(content: CellContent, monster: MonsterType): GameState {
    if (!this.char) return this.getState();
    const lvl = this.getLevel(this.char.dungeonLevel);
    const from = this.stepFrom ?? lvl?.entrance ?? { x: this.char.x, y: this.char.y };
    this.lair = { content, monster, from };
    this.phase = 'lair-warning';
    const b = this.lairDexBonus();
    const bonus = b === 0 ? '' : ` ${b > 0 ? '+' : '−'} ${Math.abs(b)}`;
    this.messages = [
      ...(LAIRS[monster]?.warning ?? []),
      '',
      `[A] Turn back: d20${bonus}, need ${LAIR.TURN_BACK_DC}. Fail, and you're dragged in and struck first.`,
      '[B] Step forward: face what waits on even terms.',
      `[C] Charge: d20${bonus}, need ${LAIR.CHARGE_DC}. Your first blow goes unanswered, or it strikes first.`,
      `[D] Sneak in: d20${bonus}, need ${LAIR.SNEAK_DC}. Strike from the shadows for double damage, unanswered, or it strikes first.`,
    ];
    return this.getState();
  }

  /** Asmodeus can't be bothered: he flings the intruder elsewhere on the level. */
  private dismissedByAsmodeus(): GameState {
    const crack = this.getLevel(7)?.sanctum?.mouth;
    if (crack && this.char) {
      this.char.x = crack.x; this.char.y = crack.y;
      this.lightAround();
      this.lastArea = null;
      this.presenceFelt = true;
      this.fx.player = 'arcane';
      this.messages = [
        'The smoke parts. On the throne, something vast stirs, and sighs.',
        'A bored voice like grinding stone: "NOT. NOW."',
        '',
        'The world folds around you, and you are standing at the crack where the Long Way begins.',
        'You will have to walk it again.',
      ];
      return this.getState();
    }
    this.teleportPlayer();
    this.presenceFelt = true;  // in map mode, show this rather than redrawing the map
    this.fx.player = 'arcane';
    this.messages = [
      'The smoke parts. On the throne, something vast stirs, and sighs.',
      'A bored voice like grinding stone: "NOT. NOW."',
      '',
      'The world folds around you, and you are somewhere else entirely.',
      'You will have to find your way back to him.',
    ];
    return this.getState();
  }

  private lairDexBonus(): number {
    if (!this.char) return 0;
    const dex = getEffectiveStats(this.char).dexterity;
    return Math.min(LAIR.DEX_BONUS_MAX, Math.floor((dex - 10) / 2));
  }

  lairChoice(key: string): GameState {
    if (!this.char || this.phase !== 'lair-warning' || !this.lair) return this.getState();
    const { content, monster, from } = this.lair;
    const text = LAIRS[monster]!;
    const bonus = this.lairDexBonus();
    const roll = (dc: number) => {
      const d = this.rng.die(20);
      const sign = bonus === 0 ? '' : ` ${bonus > 0 ? '+' : '−'} ${Math.abs(bonus)}`;
      return { ok: d + bonus >= dc, text: `(d20: ${d}${sign} = ${d + bonus}, needed ${dc})` };
    };

    if (key === 'a') {
      const r = roll(LAIR.TURN_BACK_DC);
      this.lair = null;
      if (r.ok) {
        this.char.x = from.x;
        this.char.y = from.y;
        this.phase = 'playing';
        this.lightAround();
        this.lastArea = null;
        this.messages = [`${text.backAway} ${r.text}`, '', text.afterBackAway, '', ...this.enterArea()];
        return this.getState();
      }
      this.startFixedEncounter(content, monster);
      return this.lairFirstStrike([`You turn to flee... ${r.text}`, text.dragged, '']);
    }

    if (key === 'b') {
      this.lair = null;
      this.startFixedEncounter(content, monster);
      this.messages = [text.stepIn, '', ...this.messages];
      return this.getState();
    }

    if (key === 'c') {
      const r = roll(LAIR.CHARGE_DC);
      this.lair = null;
      this.startFixedEncounter(content, monster);
      if (!r.ok) return this.lairFirstStrike([`${text.chargeFail} ${r.text}`, '']);
      const intro = this.messages;
      this.combat!.monster.caughtOffGuard = true;
      const state = this.combatAttack();
      this.messages = [`${text.charge} ${r.text}`, '', ...intro, '', ...this.messages];
      state.messages = [...this.messages];
      return state;
    }

    if (key === 'd') {
      const r = roll(LAIR.SNEAK_DC);
      this.lair = null;
      this.startFixedEncounter(content, monster);
      if (!r.ok) return this.lairFirstStrike([`${text.sneakFail} ${r.text}`, '']);
      const intro = this.messages;
      const m = this.combat!.monster;
      m.caughtOffGuard = true;
      const hpBefore = m.hp;
      let state = this.combatAttack();
      const lead = [`${text.sneak} ${r.text}`, '', ...intro, ''];
      // The blow from the shadows lands twice as hard.
      const dealt = hpBefore - m.hp;
      if ((this.phase as GamePhase) === 'combat' && this.combat && dealt > 0 && m.hp > 0) {
        m.hp -= dealt;
        const extra = [`Your blow from the shadows strikes deep! (+${dealt} damage)`];
        if (m.hp <= 0) {
          const body = this.messages;
          state = this.handleMonsterDefeated();
          this.messages = [...lead, ...body, ...extra, '', ...this.messages];
        } else {
          this.messages = [...lead, ...this.messages, ...extra];
        }
      } else {
        this.messages = [...lead, ...this.messages];
      }
      state.messages = [...this.messages];
      if (this.combat) state.combat = { ...this.combat };
      return state;
    }

    return this.getState();
  }

  /** Combat has begun (with its intro in messages) and the lair's master
   * acts before the character can. */
  private lairFirstStrike(lead: string[]): GameState {
    const intro = this.messages;
    const res = monsterFirstStrike(this.char!, this.combat!.monster, this.rng);
    res.messages = [...lead, ...intro, '', ...res.messages];
    return this.processCombatResult(res);
  }

  // ─── Combat ──────────────────────────────────────────────────────────────

  private startFixedEncounter(content: CellContent, monsterType: import('./types.js').MonsterType): GameState {
    if (!this.char) return this.getState();
    monsterType = currentMonsterType(monsterType);                         // an old saved name (e.g. Mind Flayer)
    if (isHiddenMonster(monsterType)) monsterType = hiddenStandIn(monsterType);   // kept out of the hosted game
    const def = getDefinition(monsterType);
    // Unique bosses roll a level in their own [minLevel, maxLevel] range each
    // encounter. Most bosses have a single fixed level (min === max); Asmodeus
    // (80-100) and the Orc King (80-90) have a real spread. Ordinary fixed
    // monsters use the same dungeon-depth/character-level scaled range as
    // random encounters.
    // Asmodeus comes back 10-20 levels stronger each time this character beats him.
    const returned = monsterType === 'Asmodeus' ? asmodeusReturnBonus(this.char.id, this.char.asmodeusVictories ?? 0) : 0;
    // Every other monster is stronger for each time this character has banished him.
    const boost = monsterType === 'Asmodeus' ? 0 : this.worldBoost();
    const lvl = (content.type === 'unique-monster'
      ? this.rng.int(def.minLevel, def.maxLevel) + returned
      : Math.min(def.maxLevel, randomMonsterLevel(this.char.level, this.char.dungeonLevel, this.rng, monsterType))) + boost;

    const monster = createMonster(monsterType, lvl, content.id, returned + boost > 0);
    return this.beginCombat(monster);
  }

  private startRandomEncounter(): GameState {
    if (!this.char) return this.getState();

    // A newcomer's first fights on level 1 come from the gentler kinds.
    const won = this.char.monstersDefeated;
    const maxTier = this.char.dungeonLevel === 1 && won < NEWCOMER.FIRST_FIGHT_TIERS.length ? NEWCOMER.FIRST_FIGHT_TIERS[won] : Infinity;
    // Now and then, where another player's character fell, their shade instead.
    if (maxTier === Infinity && this.rng.float() < ECHOES.SHADE_CHANCE) {
      const shade = this.shadeEncounter();
      if (shade) return shade;
    }
    const type = pickRandomMonsterType(this.char.dungeonLevel, this.rng, maxTier);
    const def = getDefinition(type);
    const lvl = randomMonsterLevel(this.char.level, this.char.dungeonLevel, this.rng, type);
    const clampedLvl = Math.max(def.minLevel, Math.min(def.maxLevel, Math.max(1, lvl)));
    const boost = this.worldBoost();

    const monsterId = `rand-${Date.now()}-${this.rng.int(100, 999)}`;
    const monster = createMonster(type, clampedLvl + boost, monsterId, boost > 0);
    // Your Fetch is you: your level, and most of your health.
    if (type === 'Fetch') {
      monster.level = this.char.level;
      monster.hp = monster.maxHp = Math.max(10, Math.round(this.char.maxHp * 0.75));
      monster.lastHp = monster.hp;
    }
    return this.beginCombat(monster);
  }

  /** Levels added to every monster (but Asmodeus, who has his own) for each
   * time this character has banished Asmodeus. */
  private worldBoost(): number {
    return (this.char?.asmodeusVictories ?? 0) * DEATH.WORLD_BOOST_PER_VICTORY;
  }

  private beginCombat(monster: Monster): GameState {
    if (!this.char) return this.getState();
    this.noteFirstSteps(fs => { fs.fights++; });

    this.combat = {
      monster,
      round: 1,
      nakedActive: false,
      preCombatX: this.char.x,
      preCombatY: this.char.y,
    };
    this.phase = 'combat';

    // Intro text (an ancient ghoul has its own)
    const introLines = monster.type === 'Ghoul' && monster.level >= GHOUL.ANCIENT_LEVEL ? ANCIENT_GHOUL_INTRO : monster.definition.encounterIntro;
    const intro = introLines.map(line =>
      line.replace('{LVL}', String(monster.level)).replace('{NAME}', monster.echoOf ? `${monster.echoOf.name}, a level ${monster.echoOf.charLevel} ${monster.echoOf.charClass} who died here ${agoText(monster.echoOf.diedAt)}` : 'someone')
    );
    this.messages = intro;
    // A warrior's first fight: point them at the blow that matters.
    if (this.char.charClass === 'warrior' && this.char.monstersDefeated === 0 && !this.warriorTipShown) {
      this.warriorTipShown = true;
      this.messages.push('', 'TIP: Power Attack (B, Combat Skill) hits more than twice as hard as a plain Attack, then needs ' + WARRIOR.POWER_ATTACK_COOLDOWN + ' rounds to recover. Attack in between.');
    }
    // In the dark (Lantern Moths took your torch), or deaf (the Hush), you never see or hear it coming.
    const blind = this.char.statusEffects.some(e => e.type === 'snuffed');
    const deaf = this.char.statusEffects.some(e => e.type === 'deafened');
    if ((blind || deaf) && !monster.definition.isUnique && monster.type !== 'Lantern Moths' && monster.type !== 'Hush') {
      return this.lairFirstStrike([blind ? 'In the dark, you never see it coming!' : 'You never heard it coming!', '']);
    }
    if (monster.type === 'Hush') {
      this.char.statusEffects = this.char.statusEffects.filter(e => e.type !== 'deafened');
      addStatusEffect(this.char, { type: 'deafened', value: 0, turns: HUSH.DEAF_STEPS });
    }
    // Black Annis may drop on you from the dark above (not on a character on their first level).
    if (monster.type === 'Black Annis' && this.char.level > 1 && this.rng.float() < 0.35) {
      return this.lairFirstStrike(['Something drops from the dark above you, claws first: she was waiting overhead!', '']);
    }
    // A Bugbear may have been waiting in ambush (not for a character on their first level).
    if (monster.type === 'Bugbear' && this.char.level > 1 && this.rng.float() < 0.4) {
      return this.lairFirstStrike(['The Bugbear springs out of the shadows before you can react!', '']);
    }
    return this.getState();
  }

  combatAction(action: string): GameState {
    if (!this.char || !this.combat || this.phase !== 'combat') return this.getState();
    if (this.isHeld()) return this.combatHeld();
    if (['a', 'c', 'f'].includes(action) && this.targetInvisible()) return this.strikeAtNothing();

    switch (action) {
      case 'h':
        if (this.combat.monster.type !== 'Unicorn') return this.getState();
        return this.processCombatResult(petUnicorn(this.char, this.combat.monster, this.rng));
      case 'a': return this.combatAttack();
      case 'b': return this.showSpellMenu();
      case 'c': return this.combatPray();
      case 'd': return this.combatRun();
      case 'f': return this.combatScare();
      case 'e': return this.showGemMenu();
      case 'p': return this.combatPotion();
      case 'auto': return this.autoFight();
      case 'z': {
        // A wizard's last spell, cast again.
        const k = this.repeatSpellKey();
        if (!k) { this.messages = ['You have no spell to repeat yet. (B: cast a spell; then Z casts it again)']; return this.getState(); }
        return this.spellAction(k);
      }
      default:  return this.getState();
    }
  }

  /** Diamonds are the one gem that makes sense outside a fight — reveal the
   * level's map while exploring. */
  useDiamondExploring(): GameState {
    if (!this.char || this.phase !== 'playing') return this.getState();
    return this.useGem('diamond');
  }

  gemAction(key: string): GameState {
    if (!this.char || !this.combat || this.phase !== 'combat') return this.getState();
    const types: Record<string, GemType> = { a: 'ruby', b: 'sapphire', c: 'diamond', d: 'opal', e: 'emerald', f: 'pearl' };
    const type = types[key];
    if (type && this.isHeld()) return this.combatHeld();
    if ((type === 'opal' || type === 'sapphire') && this.targetInvisible()) return this.strikeAtNothing();
    if ((type === 'opal' || type === 'sapphire') && this.combat.monster.type === 'Rakshasa') return this.spellWashesOff();
    if (!type) {
      this.phase = 'combat';
      this.messages = ['You reconsider.'];
      return this.getState();
    }
    return this.useGem(type);
  }

  private showGemMenu(): GameState {
    this.messages = ['Choose a gem:'];
    const state = this.getState();
    state.choices = [
      { key: 'a', text: 'Ruby — Teleport Away' },
      { key: 'b', text: 'Sapphire — Banish Monster' },
      { key: 'c', text: 'Diamond — Reveal Map' },
      { key: 'd', text: 'Opal — Chiaroscuro Blast' },
      { key: 'e', text: 'Emerald — Warding' },
      { key: 'f', text: 'Pilgrim\u2019s Pearl — To the nearest fountain or altar' },
      { key: 'g', text: 'Cancel' },
    ];
    state.phase = 'combat';
    return state;
  }

  private useGem(type: GemType): GameState {
    if (!this.char) return this.getState();

    if (this.char.inventory.gems[type] <= 0) {
      this.messages = [`You have no ${GEM_PLURAL[type]}.`];
      return this.getState();
    }
    // The Pilgrim's Pearl answers anyone in need: no gift for magic required.
    if (type === 'pearl') { this.cue('gem-ruby'); return this.usePearl(); }
    if (this.char.charClass === 'warrior' && this.char.level < WARRIOR.GEM_LEVEL) {
      this.messages = [
        `The ${type} sits inert in your calloused palm.`,
        `A warrior learns to wield gem magic at Level ${WARRIOR.GEM_LEVEL}.`,
      ];
      return this.getState();
    }
    if (this.char.charClass !== 'warrior' && this.char.intelligence < GEMS.MAGIC_INT_THRESHOLD) {
      this.messages = [
        `The ${type} sits inert in your palm.`,
        `You lack the arcane aptitude to attune to it. (Requires INT ${GEMS.MAGIC_INT_THRESHOLD}+)`,
      ];
      return this.getState();
    }


    this.cue(`gem-${type}`);
    switch (type) {
      case 'ruby':     return this.useRuby();
      case 'sapphire': return this.useSapphire();
      case 'diamond':  return this.useDiamond();
      case 'opal':     return this.useOpal();
      case 'emerald':  return this.useEmerald();
      case 'moonstone': return this.planarStep();
    }
  }

  /** An emerald's ward: lasts a few fights, deflects most attacks. Stacks
   * up to a limit. Costs no turn in combat. */
  private useEmerald(): GameState {
    if (!this.char) return this.getState();
    this.char.inventory.gems.emerald--;
    // A cursed amulet takes all the emerald's power: the curse breaks, no ward.
    const uncursed = breakAmuletCurse(this.char, 'The emerald flares green, and its light closes on the curse at your throat.');
    if (uncursed.length) {
      this.messages = [...uncursed, '(The emerald spent itself on the curse: no ward this time.)'];
      return this.getState();
    }
    const added = this.rng.int(GEMS.EMERALD_FIGHTS_MIN, GEMS.EMERALD_FIGHTS_MAX);
    const fights = Math.min(GEMS.EMERALD_MAX_FIGHTS, wardFights(this.char) + added);
    addStatusEffect(this.char, { type: 'warded', value: fights, turns: 9999 });
    this.messages = [
      'The emerald dissolves into a shimmering green light that wraps around you.',
      `An emerald ward protects you for the next ${fights} fight${fights === 1 ? '' : 's'}.`,
      '(It turns most blows aside, but not all.)',
    ];
    return this.getState();
  }

  /** F while exploring (or from the gem menu in a fight): the Pilgrim's Pearl. */
  usePearlExploring(): GameState {
    if (!this.char || this.phase !== 'playing') return this.getState();
    return this.useGem('pearl');
  }

  /** The Pilgrim's Pearl: for the desperate. It carries you to the nearest
   * unused fountain or altar on this level (out of a fight, if you're in one)
   * and sets you before it. If none is left on the level, a fountain wells up
   * in another room, and it takes you there. */
  private usePearl(): GameState {
    const c = this.char!;
    const lvl = this.getLevel(c.dungeonLevel);
    if (!lvl || !this.dungeonState) return this.getState();
    const ds = this.dungeonState;
    c.inventory.gems.pearl--;
    const STEP: [Direction, number, number][] = [['N', 0, -1], ['E', 1, 0], ['S', 0, 1], ['W', -1, 0]];
    const BACK: Record<Direction, Direction> = { N: 'S', S: 'N', E: 'W', W: 'E' };
    const unused = (k: string) => {
      const ct = lvl.contents.get(k);
      return !!ct && ((ct.type === 'fountain' && !ds.usedFountains.has(ct.id)) || (ct.type === 'altar' && !ds.usedAltars.has(ct.id)));
    };
    // Walking distance from here to every square you could reach.
    const dist = new Map<string, number>([[`${c.x},${c.y}`, 0]]);
    const queue: [number, number][] = [[c.x, c.y]];
    while (queue.length) {
      const [x, y] = queue.shift()!;
      for (const [d, dx, dy] of STEP) {
        const k = `${x + dx},${y + dy}`;
        if (!dist.has(k) && canMove(lvl.grid, x, y, d)) { dist.set(k, dist.get(`${x},${y}`)! + 1); queue.push([x + dx, y + dy]); }
      }
    }
    // A square beside it, on an open side, with nothing else on it.
    const standBeside = (k: string): { x: number; y: number; facing: Direction } | null => {
      const [tx, ty] = k.split(',').map(Number);
      for (const [d, dx, dy] of STEP) {
        const sx = tx + dx, sy = ty + dy;
        if (!canMove(lvl.grid, tx, ty, d) || lvl.contents.has(`${sx},${sy}`)) continue;
        return { x: sx, y: sy, facing: BACK[d] };
      }
      return null;
    };
    let target = [...dist.keys()].filter(unused).sort((a, b) => dist.get(a)! - dist.get(b)!).find(k => standBeside(k));
    const lines = ['You close your hand on the Pilgrim\u2019s Pearl. It glows like a lamp in fog, and pulls you along a road that isn\u2019t there...'];
    if (!target) {
      // None left here: a fountain wells up in another room.
      const here = lvl.areas ? areaAtCell(lvl.areas, c.x, c.y) : undefined;
      lvl.areas ??= mapAreas(lvl.grid);
      const spots = [...dist.keys()].filter(k => {
        if (lvl.contents.has(k)) return false;
        const [x, y] = k.split(',').map(Number);
        const area = areaAtCell(lvl.areas!, x, y);
        return area?.kind === 'room' && area !== here && !!standBeside(k);
      });
      const pool = spots.length ? spots : [...dist.keys()].filter(k => !lvl.contents.has(k) && k !== `${c.x},${c.y}` && standBeside(k));
      const k = pool.length ? this.rng.pick(pool) : null;
      if (k) {
        const [fx, fy] = k.split(',').map(Number);
        const id = `pearl-fountain-${c.dungeonLevel}-${fx}-${fy}`;
        ds.hoards = [...(ds.hoards ?? []), { id, level: c.dungeonLevel, x: fx, y: fy, monster: 'pearl', monsterLevel: 0, kind: 'fountain' }];
        lvl.contents.set(k, { type: 'fountain', id });
        target = k;
        lines.push('There is no blessed water left on this level, so the Pearl makes some: a spring breaks out of the stones ahead.');
      }
    }
    if (this.combat) this.endCombat(false);
    if (!target) {
      this.messages = [...lines, 'But the road leads nowhere. The Pearl crumbles, its light spent.'];
      return this.getState();
    }
    const spot = standBeside(target)!;
    c.x = spot.x; c.y = spot.y; c.facing = spot.facing;
    this.lightAround();
    this.lastArea = null;
    this.approached = null;
    const kind = lvl.contents.get(target)!.type;
    this.messages = [...lines, `...and sets you down before ${kind === 'altar' ? 'an altar' : 'a fountain'}. The Pearl dissolves into the air.`];
    const opened = this.approachAhead();
    if (opened) { opened.messages = [...lines, `...and sets you down before ${kind === 'altar' ? 'an altar' : 'a fountain'}.`, '', ...opened.messages]; this.messages = opened.messages; return opened; }
    return this.getState();
  }

  /** E while exploring: raise an emerald ward before the next fight. */
  useEmeraldExploring(): GameState {
    if (!this.char || this.phase !== 'playing') return this.getState();
    return this.useGem('emerald');
  }

  private useRuby(): GameState {
    this.char!.inventory.gems.ruby--;
    this.messages = ['The ruby flares crimson — the corridor dissolves around you!'];
    this.teleportPlayer();
    this.endCombat(false);
    this.messages.push('You find yourself somewhere else in the dungeon.');
    return this.getState();
  }

  private useSapphire(): GameState {
    this.char!.inventory.gems.sapphire--;
    const monster = this.combat!.monster;
    if (monster.type === 'Asmodeus') return this.processCombatResult(playerSapphireOnAsmodeus(this.char!, monster, this.rng));
    this.messages = [
      `The sapphire pulses with cold blue light — the ${monster.type} vanishes without a trace!`,
      'You are free to move on.',
    ];
    this.endCombat(false);
    return this.getState();
  }

  /** Reveals the whole current level on the map, kept apart from the squares
   * actually explored, so the map can show either. Returns false (and does
   * nothing) if there's no character/level to reveal for. */
  private revealFullMap(): boolean {
    if (!this.char || !this.dungeonState) return false;
    if (!this.getLevel(this.char.dungeonLevel)) return false;
    this.dungeonState.revealedLevels.add(this.char.dungeonLevel);
    this.mapShowWhole = true;
    return true;
  }

  private useDiamond(): GameState {
    if (!this.char || !this.dungeonState) return this.getState();

    this.char.inventory.gems.diamond--;
    this.revealFullMap();
    this.messages = [
      'The diamond blazes with inner light — the entire level unfolds in your mind!',
      'The full map has been revealed.',
    ];
    return this.getState();
  }

  private useOpal(): GameState {
    this.fx.monster = 'holy';
    this.char!.inventory.gems.opal--;
    const result = playerOpal(this.char!, this.combat!.monster, this.rng);
    return this.processCombatResult(result);
  }

  // ─── Planar Step ───────────────────────────────────────────────────────

  /** Levels this character has set foot on (from the squares they've seen). */
  private visitedLevels(): number[] {
    const levels = new Set<number>([this.char!.dungeonLevel]);
    for (const k of this.dungeonState?.visitedCells ?? []) levels.add(Number(k.split(':')[0]));
    return [...levels].filter(n => n >= 1 && n <= 7).sort((a, b) => a - b);
  }

  /** Y while exploring: Planar Step. A wizard of level 60+ casts it; anyone
   * else (or a wizard below 60) can use a moonstone, which crumbles. Never in
   * battle. Choose a level you've visited, or after the time runs out the
   * spell chooses for you. */
  planarStep(): GameState {
    const c = this.char;
    if (!c || this.phase !== 'playing') {
      if (c && this.phase === 'combat') this.messages = ['Planar Step needs calm and focus. Not in the middle of a fight!'];
      return this.getState();
    }
    const knows = c.charClass === 'wizard' && c.level >= SPELLS.PLANAR_STEP_LEVEL;
    if (!knows && c.inventory.gems.moonstone <= 0) {
      this.messages = c.charClass === 'wizard'
        ? [`Planar Step is a spell wizards learn at level ${SPELLS.PLANAR_STEP_LEVEL}. A moonstone would let you cast it once.`]
        : ['You need a moonstone to step between the levels.'];
      return this.getState();
    }
    if (!knows) {
      // A moonstone takes the same aptitude as any gem.
      if (c.charClass === 'warrior' && c.level < WARRIOR.GEM_LEVEL) { this.messages = [`The moonstone sits cold in your hand. A warrior learns to wield gem magic at Level ${WARRIOR.GEM_LEVEL}.`]; return this.getState(); }
      if (c.charClass !== 'warrior' && c.intelligence < GEMS.MAGIC_INT_THRESHOLD) { this.messages = [`The moonstone sits cold in your hand. (Requires INT ${GEMS.MAGIC_INT_THRESHOLD}+)`]; return this.getState(); }
    }
    const levels = this.visitedLevels().filter(n => n !== c.dungeonLevel);
    if (levels.length === 0) {
      this.messages = ['The world thins around you, then settles. There is nowhere else you know to go.'];
      return this.getState();
    }
    const source = knows ? 'spell' : 'moonstone';
    this.interaction = {
      type: 'teleport', contentId: source,
      choices: [...levels.map((n, i) => ({ key: String.fromCharCode(97 + i), text: `Level ${n}` })), { key: String.fromCharCode(97 + levels.length), text: 'Cancel' }],
      teleport: { startedAt: Date.now(), source, levels },
    };
    this.phase = 'interaction';
    this.messages = [
      source === 'spell' ? 'You speak the words of Planar Step. The walls grow thin as smoke.' : 'You hold the moonstone up. Its pale light swells, and the walls grow thin as smoke.',
      `Where to? Choose a level you have walked. (${SPELLS.PLANAR_STEP_SECONDS} seconds, or the spell will choose for you.)`,
    ];
    this.cue('gem-ruby');
    return this.getState();
  }

  private resolvePlanarStep(key: string): GameState {
    const c = this.char;
    const t = this.interaction?.teleport;
    if (!c || !t) return this.closeInteraction();
    const late = key === 'timeout' || Date.now() - t.startedAt > (SPELLS.PLANAR_STEP_SECONDS + 2) * 1000;
    const pick = late ? undefined : t.levels[key.charCodeAt(0) - 97];
    if (!late && pick === undefined) {
      return this.closeInteraction(t.source === 'spell' ? 'You let the spell go. The walls thicken again.' : 'You lower the moonstone. Its light fades, but it is still whole.');
    }
    if (t.source === 'moonstone') c.inventory.gems.moonstone--;
    const level = pick ?? this.rng.pick(t.levels);
    this.interaction = null;
    this.pace.atLevelEntry = true;      // as if arriving by the stairs
    this.pace.movesSinceCombat = 0;
    c.dungeonLevel = level;
    this.loadLevelIntoCache(level);
    const lvl = this.getLevel(level)!;
    c.x = lvl.entrance.x; c.y = lvl.entrance.y;
    if (late) this.teleportPlayer();   // the spell chose: somewhere on the level
    this.lightAround();
    this.lastArea = null;
    this.phase = 'playing';
    this.messages = [
      late ? 'You hesitate, and the spell chooses for you. The world folds...' : 'You step through. The world folds...',
      late ? `...and you are somewhere on Level ${level}.` : `...and you stand at the top of Level ${level}.`,
      ...(t.source === 'moonstone' ? ['The moonstone crumbles to silver dust in your hand.'] : []),
      '',
      ...this.enterArea(),
    ];
    return this.getState();
  }

  // ─── Gear ──────────────────────────────────────────────────────────────

  /** Every weapon and piece of armour carried, weapons first. */
  private gearList(): { kind: 'weapon' | 'armor'; item: import('./types.js').Weapon | import('./types.js').Armor }[] {
    const inv = this.char!.inventory;
    return [
      ...(inv.weapons ?? []).map(item => ({ kind: 'weapon' as const, item })),
      ...(inv.armor ?? []).map(item => ({ kind: 'armor' as const, item })),
    ];
  }

  /** K while exploring: choose your weapon and armour by hand, or drop gear. */
  openGear(): GameState {
    if (!this.char || this.phase !== 'playing') return this.getState();
    if (this.gearList().length === 0) {
      this.messages = ['You carry no weapons or armour. (Chests, fallen monsters and shops have them.)'];
      return this.getState();
    }
    this.interaction = { type: 'gear', contentId: 'gear', choices: [], gear: { mode: 'list' } };
    this.phase = 'interaction';
    return this.showGear();
  }

  private showGear(lead: string[] = []): GameState {
    const g = this.interaction?.gear;
    const c = this.char;
    if (!c || !g) return this.getState();
    const list = this.gearList();
    const letter = (i: number) => String.fromCharCode(97 + i);
    const weapon = bestWeapon(c), worn = wornArmor(c);
    const describe = (e: (typeof list)[number]) => {
      const it = e.item;
      const usable = canUseGear(c, it.kind);
      const using = it === weapon || it === worn.body || it === worn.shield;
      const what = e.kind === 'weapon'
        ? `${it.kind}, hits ${Math.round(weaponPower(c, it as import('./types.js').Weapon) * 100)}%`
        : `${it.kind}, turns aside ${Math.round(armorShare(it as import('./types.js').Armor) * 100)}%`;
      return `${gearName(it)} (${what})${using ? (e.kind === 'weapon' ? ' [WIELDED]' : ' [WORN]') : ''}${usable ? '' : ' (warriors only)'}${it.equipped ? ' (your choice)' : ''}`;
    };
    if (g.mode === 'item' && g.index !== undefined && list[g.index]) {
      const e = list[g.index];
      const usable = canUseGear(c, e.item.kind);
      this.messages = ['══ GEAR ══', ...lead, '', describe(e)];
      this.interaction!.choices = [
        ...(usable ? [{ key: 'a', text: e.kind === 'weapon' ? 'Fight with this' : 'Wear this' }] : []),
        { key: 'b', text: 'Drop it' },
        { key: 'c', text: 'Back' },
      ];
      return this.getState();
    }
    g.mode = 'list';
    const chosen = list.some(e => e.item.equipped);
    this.messages = ['══ GEAR ══', ...lead, '',
      `Fighting with: ${weapon ? gearName(weapon) : 'nothing in hand'}`,
      `Wearing: ${[worn.body, worn.shield].filter(Boolean).map(a => gearName(a!)).join(' and ') || 'no armour'} (turns aside ${Math.round(armorProtection(c) * 100)}% of a blow)`,
      chosen ? '(Chosen by hand. "Automatic" lets the game pick the best again.)' : '(The game picks your best automatically. Choose an item to pick by hand.)',
      '', ...list.map((e, i) => `  ${letter(i)}) ${describe(e)}`)];
    this.interaction!.choices = [
      ...list.map((e, i) => ({ key: letter(i), text: gearName(e.item) })),
      { key: letter(list.length), text: 'Automatic (the best)' },
      { key: letter(list.length + 1), text: 'Done' },
    ];
    return this.getState();
  }

  private resolveGearChoice(key: string): GameState {
    const g = this.interaction?.gear;
    const c = this.char;
    if (!c || !g) return this.closeInteraction();
    const list = this.gearList();
    const i = key.charCodeAt(0) - 97;
    if (g.mode === 'list') {
      if (i >= 0 && i < list.length) { g.mode = 'item'; g.index = i; return this.showGear(); }
      if (i === list.length) {
        for (const e of list) delete e.item.equipped;
        return this.showGear(['You let instinct choose: the best you carry.']);
      }
      return this.closeInteraction('You settle your gear.');
    }
    const e = list[g.index ?? -1];
    g.mode = 'list';
    if (!e) return this.showGear();
    if (key === 'a' && canUseGear(c, e.item.kind)) {
      // One weapon in hand; one suit of armour, and one shield.
      const sameSlot = (o: (typeof list)[number]) => o.kind === e.kind && (e.kind === 'weapon' || (o.item.kind === 'shield') === (e.item.kind === 'shield'));
      for (const o of list) if (sameSlot(o)) delete o.item.equipped;
      e.item.equipped = true;
      return this.showGear([e.kind === 'weapon' ? `You take up the ${gearName(e.item)}.` : `You put on the ${gearName(e.item)}.`]);
    }
    if (key === 'b') {
      if (e.kind === 'weapon') c.inventory.weapons = c.inventory.weapons!.filter(w => w !== e.item);
      else c.inventory.armor = c.inventory.armor!.filter(a => a !== e.item);
      if (this.gearList().length === 0) return this.closeInteraction(`You leave the ${gearName(e.item)} behind. You carry no gear now.`);
      return this.showGear([`You leave the ${gearName(e.item)} behind.`]);
    }
    return this.showGear();
  }

  // ─── Shops ─────────────────────────────────────────────────────────────

  private static readonly SHOP_NAMES = { post: 'THE TRADING POST', outpost: 'THE OUTPOST', peddler: 'A CLOAKED PEDDLER' } as const;

  /** Opens a shop: the Trading Post, the Outpost, or the wandering Peddler. */
  private openShop(kind: 'post' | 'outpost' | 'peddler'): GameState {
    if (!this.char) return this.getState();
    this.interaction = { type: 'shop', contentId: kind, choices: [], shop: { kind, mode: 'main', stock: buildStock(kind, this.char, this.rng) } };
    this.phase = 'interaction';
    const greeting = {
      post: ['A trader has set up beside the way down: a stall hung with lanterns,', 'crates of potions, and racks of weapons and armour.', '"Buying and selling, friend. Mind the drop."'],
      outpost: ['Behind a counter of rough planks, a nervous trader looks up.', 'An axe leans within easy reach. "Quick now. Things come up the stairs."'],
      peddler: ['A cloaked figure steps out of the dark, pack creaking.', '"Rare things, for rare prices," it whispers. "Choose quickly."'],
    }[kind];
    return this.showShop(greeting);
  }

  /** Puts up the shop's current list (main menu, buying, or selling). */
  private showShop(lead: string[] = []): GameState {
    const shop = this.interaction?.shop;
    if (!this.char || !shop) return this.getState();
    const letter = (i: number) => String.fromCharCode(97 + i);
    const head = [`══ ${GameEngine.SHOP_NAMES[shop.kind]} ══`, ...lead, '', `Your gold: ${this.char.gold}`];
    if (shop.mode === 'buy') {
      const items = shop.stock;
      this.messages = [...head, '', 'FOR SALE:', ...items.map((it, i) => `  ${letter(i)}) ${it.label}: ${it.price} gold${it.qty > 1 ? ` (${it.qty} left)` : it.qty === 0 ? ' (sold out)' : ''}`)];
      this.interaction!.choices = [...items.map((it, i) => ({ key: letter(i), text: `${it.label} (${it.price}g)` })),
        { key: letter(items.length), text: 'Sell instead' }, { key: letter(items.length + 1), text: 'Done trading' }];
    } else if (shop.mode === 'sell') {
      const list = sellables(this.char).slice(0, 20);
      this.messages = [...head, '', list.length ? 'WILL BUY:' : 'You have nothing they want.', ...list.map((it, i) => `  ${letter(i)}) ${it.label}: ${it.price} gold`)];
      this.interaction!.choices = [...list.map((it, i) => ({ key: letter(i), text: `Sell ${it.label} (${it.price}g)` })),
        { key: letter(list.length), text: 'Buy instead' }, { key: letter(list.length + 1), text: 'Done trading' }];
    } else {
      this.messages = head;
      this.interaction!.choices = [{ key: 'a', text: 'Buy' }, { key: 'b', text: 'Sell' }, { key: 'c', text: 'Done trading (Esc)' }];
    }
    return this.getState();
  }

  private resolveShopChoice(key: string): GameState {
    const shop = this.interaction?.shop;
    if (!this.char || !shop) return this.closeInteraction();
    const i = key.charCodeAt(0) - 97;
    const done = () => this.closeInteraction(shop.kind === 'peddler'
      ? 'You turn to go. When you glance back, the peddler is gone.'
      : 'You leave the stall behind.');
    // Esc: up one level (a list back to the counter; the counter, out of the shop).
    if (key === 'esc') {
      if (shop.mode === 'main') return done();
      shop.mode = 'main';
      return this.showShop();
    }
    if (shop.mode === 'main') {
      if (key === 'a') { shop.mode = 'buy'; return this.showShop(); }
      if (key === 'b') { shop.mode = 'sell'; return this.showShop(); }
      return done();
    }
    if (shop.mode === 'buy') {
      const item = shop.stock[i];
      if (i === shop.stock.length) { shop.mode = 'sell'; return this.showShop(); }
      if (!item) return done();
      const no = cannotBuy(this.char, item);
      if (no) return this.showShop([no]);
      this.cue('gem-diamond');
      return this.showShop([buy(this.char, item)]);
    }
    const list = sellables(this.char).slice(0, 20);
    const it = list[i];
    if (i === list.length) { shop.mode = 'buy'; return this.showShop(); }
    if (!it) return done();
    it.sell();
    this.char.gold += it.price;
    return this.showShop([`You sell the ${it.label.replace(/ \(.*\)$/, '')} for ${it.price} gold.`]);
  }

  // ─── Amulets ───────────────────────────────────────────────────────────

  /** The amulet menu: each amulet carried (take off the one worn, put on
   * another), lettered in order, then Cancel. */
  private amuletChoices(): Choice[] {
    const amulets = this.char!.inventory.amulets ?? [];
    const choices = amulets.map((a, i) => ({
      key: String.fromCharCode(97 + i),
      text: a.worn ? `Take off: ${amuletName(a)} [WORN]` : `Put on: ${amuletName(a)}`,
    }));
    amulets.forEach((a, i) => choices.push({ key: String(i + 1), text: `Drop: ${amuletName(a)}` }));
    choices.push({ key: String.fromCharCode(97 + amulets.length), text: 'Cancel' });
    return choices;
  }

  /** Drops an amulet, unless it's cursed: a cursed one won't leave you
   * (and trying shows it for what it is) until the curse is broken or it snaps. */
  private dropAmulet(a: import('./types.js').Amulet): GameState {
    const inv = this.char!.inventory;
    if (a.cursed) {
      a.known = true;
      this.messages = [
        `You try to drop the ${amuletName(a, false)}, but it clings to ${a.worn ? 'your neck' : 'your fingers'}. It is CURSED!`,
        '(A fountain, an altar, or an emerald can break the curse; worn, it may also snap on its own.)',
      ];
      return this.getState();
    }
    inv.amulets = inv.amulets!.filter(x => x !== a);
    this.messages = [`You drop the ${amuletName(a, false)}${a.worn ? ' from your neck' : ''}. It clatters away into the dark.`];
    return this.getState();
  }

  /** A choice from the amulet menu (while exploring). One is worn at a time:
   * putting one on takes off the other, unless that one is cursed. */
  amuletAction(key: string): GameState {
    if (!this.char || this.phase !== 'playing') return this.getState();
    const amulets = this.char.inventory.amulets ?? [];
    if (/^[1-9]$/.test(key) && amulets[Number(key) - 1]) return this.dropAmulet(amulets[Number(key) - 1]);
    const chosen = amulets[key.charCodeAt(0) - 97];
    if (!chosen) {
      this.messages = ['You leave your amulets as they are.'];
      return this.getState();
    }
    const worn = wornAmulet(this.char);
    const stuck = [
      `The ${amuletName(worn ?? chosen, false)} won't come off! It clings to your neck like a cold hand.`,
      '(A fountain, an altar, or an emerald can break the curse.)',
    ];
    if (chosen.worn) {
      if (chosen.cursed) { this.messages = stuck; return this.getState(); }
      chosen.worn = false;
      this.messages = [`You take off the ${amuletName(chosen, false)}.`];
      return this.getState();
    }
    if (worn?.cursed) { this.messages = stuck; return this.getState(); }

    const lines: string[] = [];
    if (worn) { worn.worn = false; lines.push(`You take off the ${amuletName(worn, false)}.`); }
    chosen.worn = true;
    chosen.known = true;
    const stat = chosen.stat[0].toUpperCase() + chosen.stat.slice(1);
    const feel: Record<string, [string, string]> = {
      strength: ['stronger', 'weaker'], intelligence: ['sharper', 'duller'], dexterity: ['quicker', 'clumsier'],
      constitution: ['hardier', 'frailer'], wisdom: ['wiser', 'more foolish'],
    };
    lines.push(`You fasten the ${amuletName(chosen, false)} around your neck.`);
    if (chosen.cursed) {
      lines.push(
        `It tightens like a cold hand. You feel ${feel[chosen.stat][1]}. CURSED! (${amuletDelta(chosen)} ${stat})`,
        'It will not come off. A fountain, an altar, or an emerald can break the curse.',
      );
    } else {
      lines.push(`It warms against your skin. You feel ${feel[chosen.stat][0]}. (+${chosen.bonus} ${stat})`);
      this.cue('gem-emerald');
    }
    this.messages = lines;
    return this.getState();
  }

  // ─── Rings ─────────────────────────────────────────────────────────────

  /** The rings owned, in menu order. */
  private ringsOwned(): RingId[] {
    const inv = this.char?.inventory;
    if (!inv) return [];
    return RING_ORDER.filter(r => r === 'escape' ? (inv.starRings ?? 0) > 0 : !!inv.rings?.includes(r));
  }

  /** The ring menu's rings: in a fight only power rings (protective ones work
   * by themselves); exploring, all of them. */
  private ringMenuRings(): RingId[] {
    const inCombat = this.phase === 'combat' && !!this.combat;
    return this.ringsOwned().filter(r => !inCombat || POWER_RINGS.includes(r));
  }

  /** The ring menu: each ring, lettered in order, then Cancel. */
  private ringChoices(): Choice[] {
    const inv = this.char!.inventory;
    const inCombat = this.phase === 'combat' && !!this.combat;
    const list = this.ringMenuRings();
    const choices = list.map((r, i) => {
      const info = RINGS_INFO[r];
      let text = r === 'borak' ? `The Borak (star ruby): ${info.power}` : `${info.name[0].toUpperCase()}${info.name.slice(1)}: ${info.power}`;
      if (r === 'escape') {
        const spare = (inv.starRings ?? 0) - 1;
        text += ` (${inv.starCharges} use${inv.starCharges === 1 ? '' : 's'} left${spare > 0 ? `, +${spare} spare ring${spare === 1 ? '' : 's'}` : ''})`;
      }
      if (isProtectionRing(r)) {
        text += inv.wornRings?.includes(r) ? ' [WORN]' : ' (carried: put it on)';
      } else {
        const m = this.combat?.monster;
        const spent = (r === 'backfire' && m?.backfireUsed) || (r === 'borak' && m?.borakUsed) || (r === 'wither' && m?.witherUsed);
        const dim = r === 'borak' ? this.borakReadyIn() : 0;
        text += inv.readiedRing === r ? (inCombat ? (spent ? ' [READIED, spent this fight]' : dim > 0 ? ` [READIED: dim, ${Math.ceil(dim / 60)} min]` : ' [READIED: use it]') : ' [READIED]')
          : (inCombat ? ' (ready it: costs your turn)' : ' (ready it)');
        if (dim > 0 && !inCombat) text += ` (recharging: ${Math.ceil(dim / 60)} min)`;
      }
      return { key: String.fromCharCode(97 + i), text };
    });
    choices.push({ key: String.fromCharCode(97 + list.length), text: 'Cancel' });
    return choices;
  }

  /** A choice from the ring menu. Exploring: put a protective ring on or take
   * it off (up to RINGS.MAX_WORN worn), or ready a power ring. In a fight:
   * use the readied power ring, or ready another (that costs your turn). */
  ringAction(key: string): GameState {
    if (!this.char) return this.getState();
    const inCombat = this.phase === 'combat' && !!this.combat;
    if (!inCombat && this.phase !== 'playing') return this.getState();
    const ring = this.ringMenuRings()[key.charCodeAt(0) - 97];
    if (!ring) {
      this.messages = ['You leave your rings as they are.'];
      return this.getState();
    }
    const inv = this.char.inventory;
    const info = RINGS_INFO[ring];

    if (inCombat) {
      if (this.isHeld()) return this.combatHeld();
      if (inv.readiedRing !== ring) return this.processCombatResult(playerReadyRing(this.char, this.combat!.monster, this.rng, ring));
      const m = this.combat!.monster;
      if (ring === 'escape') return this.useStarSapphire();
      if (ring === 'borak') {
        if (m.borakUsed) { this.messages = ['The Borak\u2019s star has gone dark. It will burn again in your next fight.']; return this.getState(); }
        const wait = this.borakReadyIn();
        if (wait > 0) {
          const mins = Math.ceil(wait / 60);
          this.messages = [`The star in The Borak is still dim, gathering its light. (Ready in ${mins} minute${mins === 1 ? '' : 's'} of play.)`];
          return this.getState();
        }
        this.char.borakAt = this.char.playTime;
        this.fx.monster = 'holy';
        return this.processCombatResult(playerBorak(this.char, m, this.rng));
      }
      if (ring === 'backfire') {
        if (m.backfireUsed) { this.messages = ['The green diamond is dark and cold. Its mirrors are spent for this fight.']; return this.getState(); }
        return this.processCombatResult(playerBackfireRing(this.char, m, this.rng));
      }
      if (ring === 'wither') {
        if (m.witherUsed) { this.messages = ['The bloodstone is dull and cold. It has drunk its fill for this fight.']; return this.getState(); }
        this.fx.monster = 'drain';
        return this.processCombatResult(playerWitherRing(this.char, m, this.rng));
      }
      return this.getState();
    }

    if (isProtectionRing(ring)) {
      const worn = inv.wornRings ?? [];
      if (worn.includes(ring)) {
        inv.wornRings = worn.filter(r => r !== ring);
        this.messages = [`You take off the ${info.name} and put it away. (It no longer guards you.)`];
      } else if (worn.length >= RINGS.MAX_WORN) {
        this.messages = [`You already wear ${RINGS.MAX_WORN} rings: there's no finger left for the ${info.name}. Take one off first.`];
      } else {
        inv.wornRings = [...worn, ring];
        this.messages = [`You slip the ${info.name} onto your finger. It will guard you while you wear it. (${info.power})`];
      }
      return this.getState();
    }
    if (inv.readiedRing === ring) {
      this.messages = [`The ${info.name} is already the ring you have ready.`];
      return this.getState();
    }
    inv.readiedRing = ring;
    this.messages = [`You turn the ${info.name} to the front, ready for your next fight. (${info.power}; R in battle)`];
    return this.getState();
  }

  /** The star sapphire: away from the fight, like a ruby. Each ring holds a
   * few uses, then crumbles, and the next one (if any) takes its place. */
  private useStarSapphire(): GameState {
    const inv = this.char!.inventory;
    inv.starCharges = Math.max(0, (inv.starCharges ?? RINGS.STAR_CHARGES) - 1);
    this.cue('gem-ruby');
    this.messages = ['You turn the star sapphire ring. Its six-rayed star blazes, and the fight falls away behind you!'];
    this.teleportPlayer();
    this.endCombat(false);
    this.messages.push('You find yourself somewhere else in the dungeon.');
    if (inv.starCharges > 0) {
      this.messages.push(`(${inv.starCharges} use${inv.starCharges === 1 ? '' : 's'} left on this star sapphire.)`);
    } else {
      inv.starRings = Math.max(0, (inv.starRings ?? 1) - 1);
      if (inv.starRings > 0) {
        inv.starCharges = RINGS.STAR_CHARGES;
        this.messages.push('The star sapphire cracks and crumbles to blue dust. You turn the next one to the front.');
      } else {
        this.messages.push('The star sapphire cracks and crumbles to blue dust. It was your last.');
        inv.readiedRing = this.ringsOwned().find(r => POWER_RINGS.includes(r));
      }
    }
    return this.getState();
  }

  /** Keys come from spellMenu(): the character's known spells, lettered in
   * unlock order. Anything else (Cancel, or an unlearned spell) backs out. */
  /** A wizard's last spell, for Z: the menu key it has now (if still known). */
  private lastSpell: SpellId | null = null;
  private repeatSpellKey(): string | null {
    if (!this.char || this.char.charClass !== 'wizard' || !this.lastSpell) return null;
    const i = knownSpells(this.char.level, 'wizard').findIndex(s => s.id === this.lastSpell);
    return i >= 0 ? String.fromCharCode(97 + i) : null;
  }

  spellAction(key: string): GameState {
    if (!this.char || !this.combat || this.phase !== 'combat') return this.getState();
    const spell = spellForKey(this.char.level, key, this.char.charClass);
    if (spell && this.char.charClass === 'wizard') this.lastSpell = spell;
    if (!spell) {
      this.phase = 'combat';
      this.messages = ['You reconsider.'];
      return this.getState();
    }
    if (spell === 'banish' && this.banishReadyIn() > 0) {
      this.messages = [`Banish is still gathering power. It will be ready in ${this.banishReadyText()}.`];
      return this.getState();
    }
    if (spell === 'stilled-hour' && this.stilledReadyIn() > 0) {
      const m = Math.ceil(this.stilledReadyIn() / 60);
      this.messages = [`Time will not be locked again so soon. (Timelock is ready in ${m} minute${m === 1 ? '' : 's'} of play.)`];
      return this.getState();
    }
    if (this.isHeld()) return this.combatHeld();
    if (spell !== 'heal' && this.targetInvisible()) return this.strikeAtNothing();
    if (spell !== 'heal' && isMagic(spell) && this.combat.monster.type === 'Rakshasa') return this.spellWashesOff();
    if (isMagic(spell) && this.combat.monster.type === 'Hush') return this.silenced('spell');
    if (isMagic(spell)) {
      this.fx.cast = spell === 'heal' ? 'heal' : 'attack';
    }

    const warriorMove = (fn: typeof playerPowerAttack) => {
      this.fx.monster = 'physical';
      return this.processCombatResult(fn(this.char!, this.combat!.monster, this.rng));
    };
    // Too little Intelligence, and an offensive spell can turn on its caster.
    if (['fireball', 'poison', 'acid', 'frost', 'lightning'].includes(spell) && this.rng.float() < spellBackfireChance(this.char)) {
      this.fx.player = 'arcane';
      return this.processCombatResult(playerSpellBackfire(this.char, this.combat.monster, this.rng, spell));
    }
    switch (spell) {
      case 'power-attack': {
        const wait = this.powerAttackWait();
        if (wait > 0) {
          this.messages = [`You're still recovering from your last Power Attack. (Ready in ${wait} round${wait === 1 ? '' : 's'}: Attack, or another skill, meanwhile.)`];
          return this.getState();
        }
        this.combat.powerReadyRound = this.combat.round + 1 + WARRIOR.POWER_ATTACK_COOLDOWN;
        return warriorMove(playerPowerAttack);
      }
      case 'shield-bash':  return warriorMove(playerShieldBash);
      case 'cleave':       return warriorMove(playerCleave);
      case 'battle-cry':   return warriorMove(playerBattleCry);
      case 'whirlwind':    return warriorMove(playerWhirlwind);
      case 'fireball':  return this.combatFireball();
      case 'heal':      return this.combatHeal();
      case 'poison':    return this.combatPoison();
      case 'acid':      return this.combatAcid();
      case 'frost':     return this.combatFrost();
      case 'lightning': return this.combatLightning();
      case 'banish':
        this.fx.monster = 'arcane';
        this.char.banishCastAt = this.char.playTime;
        return this.processCombatResult(playerBanish(this.char, this.combat.monster, this.rng));
      case 'stilled-hour':
        this.fx.monster = 'arcane';
        this.char.stilledHourAt = this.char.playTime;
        return this.processCombatResult(playerStilledHour(this.char, this.combat.monster, this.rng));
    }
  }

  private showSpellMenu(): GameState {
    this.messages = [this.char?.charClass === 'warrior' ? 'Choose a skill:' : 'Choose a spell:'];
    const spellState = this.getState();
    spellState.choices = this.spellChoices();
    spellState.phase = 'combat'; // stay in combat phase but with spell choices
    return spellState;
  }

  /** Applies any level-ups the character's XP has earned and returns the
   * lines announcing them, including every spell learned along the way. */
  private levelUp(): string[] {
    if (!this.char) return [];
    const r = checkLevelUp(this.char, this.rng);
    if (!r.didLevel) return [];
    this.noteFirstSteps(fs => { if (r.newLevel >= 2) fs.level2At ??= this.char!.playTime; }, true);
    return [
      '',
      `*** YOU HAVE REACHED LEVEL ${r.newLevel}! ***`,
      `Maximum HP increased by ${r.hpGain}. You are fully healed! (${this.char.hp}/${this.char.maxHp})`,
      ...(r.statGained ? [`Your ${r.statGained} increases!`] : []),
      ...spellsLearnedBetween(r.previousLevel, r.newLevel, this.char.charClass).map(sp => `You have learned ${sp.name}!`),
      ...(this.char.charClass === 'warrior' && r.previousLevel < WARRIOR.GEM_LEVEL && r.newLevel >= WARRIOR.GEM_LEVEL
        ? ['You have learned to wield the magic of gems!'] : []),
      ...(this.char.charClass === 'warrior' && Math.floor(r.newLevel / WARRIOR.ATTACKS_EVERY_N_LEVELS) > Math.floor(r.previousLevel / WARRIOR.ATTACKS_EVERY_N_LEVELS)
        && r.newLevel <= WARRIOR.ATTACKS_EVERY_N_LEVELS * (WARRIOR.MAX_ATTACKS - 1)
        ? ['You can now strike an extra blow each round!'] : []),
    ];
  }

  /** Records what the monster did this round, for the hit effects. */
  /** A Manticore's sting gone wrong: once its time is up, the character dies,
   * wherever they are and whatever they're doing. */
  private checkAnaphylaxis(): void {
    if (this.dyingOfShock || !this.char) return;
    const shock = this.char.statusEffects.find(e => e.type === 'anaphylaxis');
    if (!shock || this.char.playTime < shock.value) return;
    if (!['playing', 'combat', 'interaction', 'resting', 'map', 'lair-warning', 'status', 'inventory'].includes(this.phase)) return;
    this.dyingOfShock = true;
    this.interaction = null;
    this.char.hp = 0;
    this.handleDeath('Died of anaphylactic shock from a Manticore\'s sting.',
      ['Your throat closes. The torchlight narrows to a point, and goes out.']);
    this.dyingOfShock = false;
  }

  /** A Banshee gone invisible can't be attacked, though she can still act. */
  private targetInvisible(): boolean {
    return (this.combat?.monster.invisibleTurns ?? 0) > 0;
  }

  /** The character's attack finds nothing to hit, and the unseen monster acts. */
  private strikeAtNothing(): GameState {
    const monster = this.combat!.monster;
    const res = monsterFirstStrike(this.char!, monster, this.rng,
      [`You strike at empty air. The ${monster.type} is invisible, and cannot be attacked!`, '']);
    return this.processCombatResult(res);
  }

  /** The Hush: no word makes a sound inside it, so no spell or prayer works; it gets its turn. */
  private silenced(what: 'spell' | 'prayer'): GameState {
    const res = monsterFirstStrike(this.char!, this.combat!.monster, this.rng, [
      what === 'spell' ? 'You speak the words of the spell. No sound comes out, and nothing happens.' : 'You pray aloud, and not a sound leaves your lips. No one hears.',
      '(No spell or prayer can be heard inside the Hush. Fight it hand to hand, or with gems.)', '']);
    return this.processCombatResult(res);
  }

  /** A Rakshasa: magic slides off it like rain, and it gets its turn. */
  private spellWashesOff(): GameState {
    const res = monsterFirstStrike(this.char!, this.combat!.monster, this.rng,
      ['Your magic washes over the Rakshasa and slides off like rain. It laughs.', '(Spells cannot touch a Rakshasa. Fight it hand to hand.)', '']);
    return this.processCombatResult(res);
  }

  /** Asmodeus's throne, whenever it's in the character's field of view: a
   * clear line of sight (no wall crossed) to it, not behind them, faint at
   * the edge if it's only in the corner of their eye. It always looks empty;
   * he is met only by stepping onto it. Which side of it they see depends on
   * where they stand; it faces its room's door (south, if it has no throne room). */
  private sightAsmodeus(): GameState['sighting'] | null {
    if (!this.char || !this.dungeonState || this.char.dungeonLevel !== 7) return null;
    const lvl = this.getLevel(7);
    if (!lvl) return null;
    const lair = [...lvl.contents.entries()].find(([, c]) => c.type === 'unique-monster' && c.monsterId === 'Asmodeus');
    if (!lair) return null;
    const [lx, ly] = lair[0].split(',').map(Number);
    const { x: px, y: py, facing: f } = this.char;
    if (px === lx && py === ly) return null;

    // In view? A clear line of sight to the throne (no wall crossed), not too far.
    if (Math.hypot(lx - px, ly - py) > PRESENCE.ASMODEUS_THRONE_VIEW) return null;
    if (!this.clearSight(lvl.grid, px, py, lx, ly)) return null;

    // Where he is relative to the way the character faces.
    const fwd: Record<Direction, [number, number]> = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
    const [fx, fy] = fwd[f];
    const dx = lx - px, dy = ly - py;
    const ahead = dx * fx + dy * fy;          // squares in front
    const across = dx * -fy + dy * fx;        // squares to the right
    if (ahead < 0) return null;               // behind you
    const ratio = ahead > 0 ? across / ahead : Math.sign(across) * 99;
    const peripheral = Math.abs(ratio) > 1.2;
    if (Math.abs(ratio) > 6) return null;     // too far round to see at all
    const offset = Math.max(-1, Math.min(1, ratio / 1.2));

    // Which side of the throne faces the character.
    const throne: Direction = lvl.sanctum?.facing ?? 'S';
    const [tx, ty] = fwd[throne];
    const along = -dx * tx + -dy * ty;        // the character's position, in front of (+) or behind (-) the throne
    const side = -dx * -ty + -dy * tx;
    const rightOf: Record<Direction, Direction> = { N: 'E', E: 'S', S: 'W', W: 'N' };
    const view = Math.abs(along) >= Math.abs(side)
      ? (along >= 0 ? 'front' : 'back')
      : (throne === rightOf[f] ? 'faces-right' : throne === f ? 'back' : rightOf[throne] === f ? 'faces-left' : 'front');
    // The throne always looks empty, alive or dead: he is met only by stepping onto it.
    return { monster: 'Asmodeus', distance: Math.max(1, Math.round(Math.hypot(dx, dy))), view, offset, peripheral, empty: true };
  }

  /** Whether an unbroken line runs between two squares without crossing a
   * wall: walks the squares the line passes through (one axis at a time, so
   * it never slips diagonally between two walls) and checks each step. */
  private clearSight(grid: DungeonCell[][], x0: number, y0: number, x1: number, y1: number): boolean {
    const dx = x1 - x0, dy = y1 - y0;
    const sx = Math.sign(dx), sy = Math.sign(dy);
    const nx = Math.abs(dx), ny = Math.abs(dy);
    let x = x0, y = y0, ix = 0, iy = 0;
    while (ix < nx || iy < ny) {
      // Step whichever axis the line crosses next (through square centres).
      const tx = (ix + 0.5) / (nx || 1e-9), ty = (iy + 0.5) / (ny || 1e-9);
      if (ix < nx && (iy >= ny || tx < ty)) {
        if (!canMove(grid, x, y, sx > 0 ? 'E' : 'W')) return false;
        x += sx; ix++;
      } else if (iy < ny && (ix >= nx || ty < tx)) {
        if (!canMove(grid, x, y, sy > 0 ? 'S' : 'N')) return false;
        y += sy; iy++;
      } else {
        // Exactly through a corner: either way round must be open.
        const viaX = canMove(grid, x, y, sx > 0 ? 'E' : 'W') && canMove(grid, x + sx, y, sy > 0 ? 'S' : 'N');
        const viaY = canMove(grid, x, y, sy > 0 ? 'S' : 'N') && canMove(grid, x, y + sy, sx > 0 ? 'E' : 'W');
        if (!viaX && !viaY) return false;
        x += sx; y += sy; ix++; iy++;
      }
    }
    return true;
  }

  /** Queues a sound for the client to play after this action. */
  private cue(name: string): void {
    this.fx.cues = [...(this.fx.cues ?? []), name];
  }

  /** Try to frighten the monster off. It works better on weaker foes and
   * with Charisma; it never works on the mindless or the great lords. A
   * monster scared from its lair doesn't come back. */
  private combatScare(): GameState {
    const monster = this.combat!.monster;
    this.cue('scare');
    const result = playerScare(this.char!, monster, this.rng);
    if (!result.scared) return this.processCombatResult(result);
    const lvl = this.getLevel(this.char!.dungeonLevel);
    const lair = lvl && [...lvl.contents.values()].find(c => c.type === 'fixed-monster' && c.id === monster.id);
    if (lair) this.dungeonState!.defeatedFixedMonsters.add(lair.id);
    this.endCombat(false);
    this.messages = result.messages;
    return this.getState();
  }

  /** How grand a victory was, for its fanfare: 0 (none: the monster was far
   * beneath you) through 5 (a unique lord). */
  private victoryTier(monster: Monster): number {
    const char = this.char!;
    if (monster.definition.isUnique) return 5;
    const ratio = monster.level / Math.max(1, char.level);
    if (ratio < 0.5) return 0;
    if (ratio >= 1.3 || monster.definition.naturalTier >= 9) return 4;
    if (ratio >= 1.0) return 3;
    if (ratio >= 0.8) return 2;
    return 1;
  }

  private noteMonsterTurn(result: { monsterElement?: FxElement; messages?: string[] }): void {
    // Cartographer's Bane: each touch tears away part of the map of this level.
    const m = this.combat?.monster;
    if (m?.mapBites) {
      for (let i = 0; i < m.mapBites; i++) result.messages?.push(...this.tearMap());
      m.mapBites = 0;
    }
    if (!result.monsterElement) return;
    this.fx.player = result.monsterElement;
    this.fx.monsterAttacked = true;
  }

  /** Erases a share of this level's map: the explored squares nearest a
   * remembered spot away from you (and the diamond's whole-level view). */
  private tearMap(): string[] {
    const c = this.char!, ds = this.dungeonState!;
    const level = c.dungeonLevel;
    const prefix = `${level}:`;
    const known = [...ds.visitedCells].filter(k => k.startsWith(prefix)).map(k => {
      const [x, y] = k.slice(prefix.length).split(',').map(Number);
      return { k, x, y };
    });
    ds.revealedLevels.delete(level);
    const far = known.filter(p => Math.abs(p.x - c.x) + Math.abs(p.y - c.y) > BANE.SPARE_RADIUS);
    if (!far.length) return ['', 'Its fingers search your mind for something to take, and find almost nothing.'];
    const centre = far[this.rng.int(0, far.length - 1)];
    const take = Math.max(1, Math.round(known.length * BANE.MAP_SHARE));
    far.sort((a, b) => (Math.abs(a.x - centre.x) + Math.abs(a.y - centre.y)) - (Math.abs(b.x - centre.x) + Math.abs(b.y - centre.y)));
    for (const p of far.slice(0, take)) ds.visitedCells.delete(p.k);
    return ['', `Your memory of these halls tears away like wet paper. (Part of your map of Level ${level} is gone.)`];
  }

  /** Adds the time since the last action to the character's play time.
   * Called on every state read, so every save carries an up-to-date total. */
  private bankPlayTime(): void {
    const now = Date.now();
    if (this.char) {
      const secs = Math.floor((now - this.sessionStart) / 1000);
      this.char.playTime += secs;
      this.sessionStart += secs * 1000;
    } else {
      this.sessionStart = now;
    }
  }

  /** Seconds of play time until Banish can be cast again (0 = ready). */
  private banishReadyIn(): number {
    if (!this.char || this.char.banishCastAt === undefined) return 0;
    return Math.max(0, this.char.banishCastAt + SPELLS.BANISH_COOLDOWN_SECONDS - this.char.playTime);
  }

  /** Seconds of play until The Borak can fire again. */
  private borakReadyIn(): number {
    if (!this.char || this.char.borakAt === undefined) return 0;
    this.bankPlayTime();
    return Math.max(0, this.char.borakAt + BORAK.COOLDOWN_SECONDS - this.char.playTime);
  }

  /** Seconds of play until Timelock can be cast again. */
  private stilledReadyIn(): number {
    if (!this.char || this.char.stilledHourAt === undefined) return 0;
    return Math.max(0, this.char.stilledHourAt + SPELLS.STILLED_HOUR.COOLDOWN_SECONDS - this.char.playTime);
  }


  private banishReadyText(): string {
    const mins = Math.ceil(this.banishReadyIn() / 60);
    return `${mins} minute${mins === 1 ? '' : 's'}`;
  }

  /** Rounds before a warrior's Power Attack can be used again (0 = ready). */
  private powerAttackWait(): number {
    return Math.max(0, (this.combat?.powerReadyRound ?? 0) - (this.combat?.round ?? 0));
  }

  /** The spell menu, with Banish showing how long it has left to recharge. */
  private spellChoices(): Choice[] {
    const choices = spellMenu(this.char!.level, this.char!.charClass);
    const wait = this.powerAttackWait();
    const power = choices.find(c => c.text === 'Power Attack');
    if (power && wait > 0) power.text = `Power Attack (ready in ${wait} round${wait === 1 ? '' : 's'})`;
    if (this.banishReadyIn() > 0) {
      const banish = choices.find(c => c.text === 'Banish');
      if (banish) banish.text = `Banish (recharging: ${this.banishReadyText()})`;
    }
    return choices;
  }

  private isHeld(): boolean {
    return (this.char?.heldRounds ?? 0) > 0;
  }

  /** Whatever was chosen, a held character loses the round. */
  private combatHeld(): GameState {
    const result = playerHeld(this.char!, this.combat!.monster, this.rng);
    return this.processCombatResult(result);
  }

  private combatAttack(): GameState {
    this.fx.monster = 'physical';
    const result = playerAttack(this.char!, this.combat!.monster, this.rng);
    return this.processCombatResult(result);
  }

  private combatFireball(): GameState {
    this.fx.monster = 'fire';
    const result = playerFireball(this.char!, this.combat!.monster, this.rng);
    return this.processCombatResult(result);
  }

  private combatAcid(): GameState {
    this.fx.monster = 'acid';
    const result = playerAcid(this.char!, this.combat!.monster, this.rng);
    return this.processCombatResult(result);
  }

  private combatLightning(): GameState {
    this.fx.monster = 'lightning';
    const result = playerLightning(this.char!, this.combat!.monster, this.rng);
    return this.processCombatResult(result);
  }

  private combatFrost(): GameState {
    this.fx.monster = 'cold';
    const result = playerFrost(this.char!, this.combat!.monster, this.rng);
    return this.processCombatResult(result);
  }

  private combatPoison(): GameState {
    this.fx.monster = 'poison';
    const result = playerPoison(this.char!, this.combat!.monster, this.rng);
    return this.processCombatResult(result);
  }

  /** Drinks a potion mid-fight (costs the turn). No potion, or already at
   * full health: says so and costs nothing. */
  private combatPotion(): GameState {
    if (this.char!.inventory.potions <= 0) {
      this.messages = ['You have no healing potions.'];
      return this.getState();
    }
    if (this.char!.hp >= this.char!.maxHp) {
      this.messages = ['You are already at full health.'];
      return this.getState();
    }
    this.cue('gulp');
    this.noteFirstSteps(fs => { fs.potions++; });
    return this.processCombatResult(playerPotion(this.char!, this.combat!.monster, this.rng));
  }

  private combatHeal(): GameState {
    const result = playerHeal(this.char!, this.combat!.monster, this.rng);
    return this.processCombatResult(result);
  }

  private combatPray(): GameState {
    if (this.combat!.monster.type === 'Hush') return this.silenced('prayer');
    this.fx.monster = 'holy';
    const result = playerPray(this.char!, this.combat!.monster, this.rng);
    return this.processCombatResult(result);
  }

  private combatRun(): GameState {
    const monster = this.combat!.monster;
    const result = playerRun(this.char!, monster, this.rng);
    this.noteMonsterTurn(result);
    this.messages = result.messages;
    this.noteFirstSteps(fs => { fs.runs++; if (result.ran) fs.escapes++; if (result.spared) fs.spared++; });

    if (result.playerDied) {
      const cause = result.deathCause ?? `Killed by a Level ${monster.level} ${monster.type}.`;
      return this.handleDeath(cause.replace(/\.$/, ' as you tried to flee.'), result.killingBlow);
    }

    if (result.ran) return this.flee(monster);

    return this.getState();
  }

  /** A successful run: bolt along the passages, back the way you came first,
   * a few squares from a kobold and a long way from a dragon, then pay for
   * it in spilled gold, perhaps a smashed potion, and lost breath. Running
   * blind, any trap on the way goes off. */
  private flee(monster: Monster): GameState {
    const char = this.char!;
    const lvl = this.getLevel(char.dungeonLevel)!;
    const ds = this.dungeonState!;
    const back = { x: this.combat!.preCombatX, y: this.combat!.preCombatY };
    const start = { x: char.x, y: char.y };
    this.endCombat(false);

    const levelsAbove = Math.max(0, monster.level - char.level);
    const target = Math.min(FLEE.MAX_STEPS,
      FLEE.MIN_STEPS + this.rng.int(0, FLEE.RANDOM_EXTRA)
      + monster.definition.naturalTier * FLEE.PER_TIER
      + Math.floor(levelsAbove / FLEE.LEVELS_ABOVE_PER_STEP));

    // Never flee into a monster's lair.
    const blocked = (x: number, y: number) => {
      const c = lvl.contents.get(`${x},${y}`);
      if (c?.type === 'fixed-monster') return !ds.defeatedFixedMonsters.has(c.id);
      if (c?.type === 'unique-monster') return !ds.defeatedUniqueMonsters.has(c.id);
      return false;
    };
    const dirs: [Direction, number, number][] = [['N', 0, -1], ['E', 1, 0], ['S', 0, 1], ['W', -1, 0]];
    let prev: { x: number; y: number } | null = null;
    let ran = 0;
    let cornered = false;
    let trap: CellContent | undefined;
    while (ran < target) {
      const here = { x: char.x, y: char.y };
      const away = Math.abs(here.x - start.x) + Math.abs(here.y - start.y);
      const options = dirs
        .filter(([d]) => canMove(lvl.grid, here.x, here.y, d))
        .map(([d, dx, dy]) => ({ d, x: here.x + dx, y: here.y + dy }))
        .filter(n => !(prev && n.x === prev.x && n.y === prev.y) && !blocked(n.x, n.y));
      if (options.length === 0) { cornered = true; break; }
      const weight = (n: { x: number; y: number }) =>
        ran === 0 && n.x === back.x && n.y === back.y ? 6
        : Math.abs(n.x - start.x) + Math.abs(n.y - start.y) > away ? FLEE.AWAY_WEIGHT : 1;
      const total = options.reduce((a, n) => a + weight(n), 0);
      let roll = this.rng.float() * total;
      const next = options.find(n => (roll -= weight(n)) < 0) ?? options[options.length - 1];
      prev = here;
      char.x = next.x; char.y = next.y;
      char.facing = next.d;
      char.stepsTaken++;
      ran++;
      this.lightAround();
      const c = lvl.contents.get(`${next.x},${next.y}`);
      if (c?.type === 'trap' && !ds.triggeredTraps.has(c.id) && !ds.disarmedTraps.has(c.id)) { trap = c; break; }
    }

    const lines = [...this.messages, ''];
    lines.push(cornered
      ? `You run ${ran} square${ran === 1 ? '' : 's'} before a dead end stops you, gasping.`
      : `You run ${ran} squares through the dark before you dare to stop.`);

    // The price of running.
    const dropped = Math.floor(char.gold * (FLEE.GOLD_DROP_MIN + this.rng.float() * (FLEE.GOLD_DROP_MAX - FLEE.GOLD_DROP_MIN)));
    if (dropped > 0) {
      char.gold -= dropped;
      lines.push(`Coins spill from your pack as you run. (Lost ${dropped} gold)`);
    }
    if (char.inventory.potions > 0 && this.rng.float() < FLEE.POTION_BREAK_CHANCE) {
      char.inventory.potions--;
      lines.push('A potion smashes against the stone as you stumble. (Lost 1 potion)');
    }
    if (!char.statusEffects.some(e => e.type === 'dexterity-reduced')) {
      addStatusEffect(char, { type: 'dexterity-reduced', value: FLEE.WINDED_DEX, turns: FLEE.WINDED_STEPS });
      lines.push(`You are winded. (-${FLEE.WINDED_DEX} Dexterity while you catch your breath)`);
    }

    this.lastArea = null;
    const area = this.enterArea();
    if (area.length) lines.push('', ...area);
    this.pace.movesSinceCombat = 0;

    if (trap) {
      const variant = trap.trapVariant ?? 'pit';
      const result = resolveTrapTriggered(char, variant, this.rng);
      ds.triggeredTraps.add(trap.id);
      this.fx.player = trapElement(variant);
      lines.push('', 'In your panic you blunder straight into a trap!', ...result.messages);
      if (result.teleported) {
        this.teleportPlayer();
        lines.push('', 'You find yourself in another part of the dungeon.');
      }
      if (char.hp <= 0) return this.handleDeath(this.trapDeathCause(variant));
      if (result.triggerMonster) {
        this.startRandomEncounter();
        this.messages = [...lines, '', ...this.messages];
        return this.getState();
      }
    }

    this.messages = lines;
    return this.getState();
  }

  private processCombatResult(result: import('./combat.js').CombatRoundResult): GameState {
    if (!this.char || !this.combat) return this.getState();
    this.noteMonsterTurn(result);
    if (result.spared) this.noteFirstSteps(fs => { fs.spared++; });

    this.messages = [...result.messages, ...wearCursedAmulet(this.char, this.rng)];
    this.combat.round++;

    if (result.playerTeleported) {
      this.teleportPlayer();
      this.endCombat(false);
      this.messages.push('', 'You find yourself in another part of the dungeon.');
      return this.getState();
    }

    if (result.playerDied) {
      const monster = this.combat!.monster;
      return this.handleDeath(result.deathCause ?? `Killed by a Level ${monster.level} ${monster.type}.`, result.killingBlow, monster.type);
    }
    // The Barghest's mark: a blow that leaves you near death kills you instead.
    if (this.char.hp > 0 && this.char.hp < this.char.maxHp * 0.1 && this.char.statusEffects.some(e => e.type === 'death-mark') && result.monsterDamage > 0) {
      this.char.hp = 0;
      this.messages.push('', 'Far off, a black dog howls. The omen comes true.');
      return this.handleDeath('Marked for death by a Barghest, and the omen came true.');
    }

    // Flesh rot keeps eating through a fight, a stage each round.
    const rot = this.char.statusEffects.find(e => e.type === 'flesh-rot');
    if (rot && !result.monsterDied) {
      const r = advanceFleshRot(this.char, rot);
      this.messages.push(...r.messages);
      if (r.fatal) return this.handleDeath(r.fatal);
    }

    if (result.banished || result.monsterFled) {
      this.endCombat(false);
      return this.getState();
    }

    // A monster can die on its own turn (a Hydra losing its last head).
    const m = this.combat.monster;
    if (m.hp <= 0) result.monsterDied = true;

    // A Troll gets back up once, unless fire or acid has burned it.
    if (result.monsterDied && m.type === 'Troll' && !m.reborn && !((m.burnedTurns ?? 0) > 0)) {
      m.reborn = true;
      m.hp = Math.round(m.maxHp * 0.3);
      this.messages.push('', 'The Troll crashes to the floor... and its wounds knit, and it gets back up!',
        '(Fire or acid would have kept it down.)');
      return this.getState();
    }

    // A Phoenix rises once from its ashes.
    if (result.monsterDied && m.type === 'Phoenix' && !m.reborn) {
      m.reborn = true;
      m.hp = Math.round(m.maxHp * PHOENIX.REBIRTH_HP);
      this.messages.push('', 'The Phoenix falls in a shower of sparks and ash...',
        '...and the ashes stir, and blaze, and it RISES AGAIN, burning brighter than before!');
      return this.getState();
    }

    if (!result.monsterDied && this.combat.monster.hp <= 0) result = { ...result, monsterDied: true };
    if (result.monsterDied) {
      return this.handleMonsterDefeated();
    }

    return this.getState();
  }

  private handleMonsterDefeated(): GameState {
    if (!this.char || !this.combat || !this.dungeonState) return this.getState();
    this.fx.monsterDied = true;
    const tier = this.victoryTier(this.combat.monster);
    if (tier > 0) this.cue(`victory-${tier}`);

    const monster = this.combat.monster;
    const def = monster.definition;
    if (monster.type === 'Hollow Choir') {
      this.messages.push('', 'The masks fall and crumble. The darkness between them vanishes.', 'For the first time, the chamber is silent.');
    }
    // Now and then a fallen monster leaves a weapon or armour (tough ones more often).
    if (this.rng.float() < (def.naturalTier >= 6 ? GEAR.DROP_CHANCE_TOUGH : GEAR.DROP_CHANCE)) {
      const found = rollGear(this.char, this.rng, 'monster');
      if (found) this.messages.push('', ...found);
    }
    const xpGained = calculateXPReward(this.char.level, monster.level, def.isUnique, def.naturalTier);

    this.char.xp += xpGained;
    this.char.monstersDefeated++;
    this.noteFirstSteps(fs => { fs.wins++; fs.firstWinAt ??= this.char!.playTime; });
    if (monster.echoOf) {
      const gold = this.rng.int(ECHOES.SHADE_GOLD_MIN, ECHOES.SHADE_GOLD_MAX) * monster.level;
      this.char.gold += gold;
      this.messages.push('', `The shade of ${monster.echoOf.name} sighs, and thins, and is gone. Where it stood lies what it was carrying: ${gold} gold.`);
    }

    // Track fixed/unique defeats
    if (def.isUnique) {
      this.dungeonState.defeatedUniqueMonsters.add(monster.id);
      this.char.uniqueMonstersDefeated++;
    } else {
      // Check if this is a fixed monster (its ID starts with 'fm-')
      if (monster.id.startsWith('fm-')) {
        this.dungeonState.defeatedFixedMonsters.add(monster.id);
      }
    }

    // Gold from monster — already scales with dungeon depth via monster.level
    const goldDrop = this.rng.float() < TREASURE.MONSTER_DROP_CHANCE
      ? this.rng.int(TREASURE.MONSTER_DROP_MIN, TREASURE.MONSTER_DROP_MAX) * monster.level
        + this.rng.int(TREASURE.MONSTER_DROP_BONUS_MIN, TREASURE.MONSTER_DROP_BONUS_MAX)
      : 0;
    if (goldDrop > 0) {
      this.char.gold += goldDrop;
      this.messages.push(`You find ${goldDrop} gold.`);
    }

    this.messages.push('', `You gain ${xpGained} experience.`);

    // Some monsters carry treasure: found on (or in) the body.
    const carried = carriedTreasure(this.char, monster.type, monster.level, this.rng);
    if (carried) {
      this.messages.push('', ...carried.messages);
      if (carried.ring) {
        const rings = (['fire', 'cold', 'evil', 'undead', 'poison', 'wither', 'escape'] as RingId[]).filter(r => r === 'escape' || !this.char!.inventory.rings?.includes(r));
        this.messages.push('On a finger bone among it all, a ring:', ...this.giveRing(this.rng.pick(rings)));
      }
      if (carried.amulet && (this.char.inventory.amulets?.length ?? 0) < AMULETS.MAX_CARRIED) {
        const stats: AmuletStat[] = ['strength', 'intelligence', 'dexterity', 'constitution', 'wisdom'];
        const amulet: Amulet = { stat: this.rng.pick(stats), bonus: this.rng.int(AMULETS.BONUS_MIN, AMULETS.BONUS_MAX), cursed: this.rng.float() < AMULETS.CURSE_CHANCE, look: this.rng.pick([...AMULETS.LOOKS]) };
        this.char.inventory.amulets = [...(this.char.inventory.amulets ?? []), amulet];
        this.messages.push(`And a ${amuletName(amulet, false)}. Its power is a mystery until you wear it. (A: Amulets)`);
      }
    }

    // A dragon sometimes leaves its hoard (the great ones always do).
    if ((monster.type.includes('Dragon') || ['Big Fat Dragon', 'Bone Sovereign', 'Lambton Worm'].includes(monster.type))
        && (def.isUnique || this.rng.float() < HOARD.CHANCE)) {
      this.messages.push(...this.leaveHoard(monster));
    }
    // The Barrow-King: his wight crumbles, and his grave goods are yours.
    if (monster.type === 'Barrow-King') {
      if (monster.wight) this.messages.push('', 'The barrow-wight crumbles to grave-dust in mid-stride.');
      this.messages.push(...this.leaveHoard(monster, 'Beside the empty bier, his grave goods: a chest of old gold, untouched for a thousand years'));
    }

    this.messages.push(...this.levelUp());

    // Clear naked status
    this.char.statusEffects = this.char.statusEffects.filter(e => e.type !== 'naked');

    // A Balor's death throes: it explodes in flame. Dexterity halves the blast.
    if (monster.type === 'Balor') {
      const full = Math.round(this.char.maxHp * 0.35);
      const dodged = this.rng.float() < Math.min(0.6, getEffectiveStats(this.char).dexterity * 0.02);
      const blast = dodged ? Math.round(full / 2) : full;
      this.char.hp = Math.max(0, this.char.hp - blast);
      this.fx.player = 'fire';
      this.messages.push('', 'The Balor\'s body splits with light. It EXPLODES in a ball of demonic fire!',
        dodged ? `You throw yourself flat and take only part of the blast. (${blast} damage)` : `The blast engulfs you! (${blast} damage)`);
      if (this.char.hp <= 0) return this.handleDeath('Caught in the death throes of a Balor.');
    }

    // Slaying a unicorn is a terrible thing.
    if (monster.type === 'Unicorn') {
      for (const type of ['strength-reduced', 'dexterity-reduced', 'intelligence-reduced'] as const) {
        addStatusEffect(this.char, { type, value: UNICORN.CURSE_STATS, turns: UNICORN.CURSE_STEPS });
      }
      this.messages.push('', 'The Unicorn\'s light goes out. The silence afterward is terrible.',
        `A curse settles on you for what you have done. (-${UNICORN.CURSE_STATS} Strength, Dexterity and Intelligence for a long while)`);
    }

    // Victory?
    if (monster.type === 'Asmodeus') {
      this.char.asmodeusDefeated = true;
      this.char.asmodeusVictories = (this.char.asmodeusVictories ?? 0) + 1;
      // He can't be killed, only banished: his throne waits for him again.
      this.dungeonState.defeatedUniqueMonsters.delete(monster.id);
      return this.handleVictory();
    }

    this.endCombat(true);
    return this.getState();
  }

  /** Death screen: the cause, then (in combat) the blow that did it, then the
   * toll. Dying costs gold and experience and drops the character at this
   * level's entrance; from there they can revive, restore the last save
   * instead (undoing the toll), or quit. Nothing is written to the save. */
  private handleDeath(cause: string, killingBlow: string[] = [], killer?: MonsterType): GameState {
    if (!this.char) return this.getState();

    this.endCombat(false);
    this.noteFirstSteps(fs => { fs.deaths++; if (this.char!.level < 2) fs.deathsBeforeLevel2++; });
    // Remembered, for the echoes other players meet (a bloodstain, a shade).
    try {
      const c = this.char;
      this.repo.recordDeath({ characterId: c.id, name: c.name, charClass: c.charClass, charLevel: c.level, dungeonLevel: c.dungeonLevel, cause, diedAt: Date.now() });
    } catch { /* an echo is never worth failing a death over */ }
    const entrance = this.getLevel(this.char.dungeonLevel)?.entrance ?? { x: 0, y: 0 };
    // Asmodeus takes a level and a little gold, and leaves you at level 7's entrance.
    const toll = killer === 'Asmodeus'
      ? applyAsmodeusDeath(this.char, entrance.x, entrance.y)
      : applyDeath(this.char, entrance.x, entrance.y);

    // Renderers show 'YOU HAVE DIED.' as a banner.
    this.messages = [
      cause,
      '',
      ...(killingBlow.length ? [...killingBlow, ''] : []),
      ...toll.messages.slice(2),
      '',
      killer === 'Asmodeus'
        ? `Revive somewhere on Level ${DEATH.ASMODEUS_REVIVE_LEVEL}, or restore your last save: the place, health and pack you had then.`
        : 'Revive here, or restore your last save: the place, health and pack you had then.',
    ];

    this.phase = 'death';
    this.reviveOnLevel6 = killer === 'Asmodeus';
    this.pace.atDeathRespawn = true;
    this.pace.movesSinceCombat = 0;

    // Fallen to Asmodeus himself: his triumph plays before the death screen.
    if (killer === 'Asmodeus') {
      this.lordScene = { scene: 'triumph', then: 'death', messages: this.messages };
      this.phase = 'asmodeus-scene';
      this.messages = [
        'You fall to your knees on the dais of skulls.',
        'Asmodeus rises over you, vast, and his laughter shakes the Seventh Level.',
        '',
        '"KNEEL, LITTLE MORTAL. YOU ALWAYS WOULD HAVE."',
        '',
        'The hellfire closes over you.',
      ];
    }

    return this.getState();
  }

  /** After the victory screen: play on from the top of Level 1. */
  continueAfterVictory(): GameState {
    if (!this.char || this.phase !== 'victory') return this.getState();
    this.phase = 'playing';
    this.lightAround();
    this.lastArea = null;
    this.messages = [
      'You climb back into the light at the top of the First Level.',
      `Behind you, the Seven Levels stir. Everything down there is stronger now. (+${this.worldBoost()} levels)`,
      '',
      ...this.enterArea(),
    ];
    // A champion needn't walk it all again: the way down knows them.
    return this.offerDeepDescent([...this.messages, '', 'The way down remembers you. Go straight back down, as deep as you like?']);
  }

  /** Has beaten Asmodeus: any ladder down (and the restart) can take them deeper. */
  private isChampion(): boolean {
    return !!this.char && ((this.char.asmodeusVictories ?? 0) > 0 || this.char.asmodeusDefeated);
  }

  /** A champion's deep descent: choose any deeper level, arriving at its entrance. */
  // ─── The Toll-Keeper ─────────────────────────────────────────────────────
  // A hooded figure sits on the stairs down from level 2 with a ledger. Pay
  // in gold, or a finger (a point of Dexterity, for good), or fight it; once
  // settled (paid or beaten), your name is in the book and you pass freely.

  /** Paying and beating it both mark it settled (defeatedFixedMonsters / defeatedUniqueMonsters). */
  private tollSettled(): boolean {
    const ds = this.dungeonState;
    return !!ds && (ds.defeatedFixedMonsters.has(TOLL_KEEPER_ID) || ds.defeatedUniqueMonsters.has(TOLL_KEEPER_ID));
  }

  /** The toll: a quarter of the gold you carry, never less than 50. */
  private tollPrice(): number {
    return Math.max(TOLL.MIN_GOLD, Math.round(this.char!.gold * TOLL.SHARE));
  }

  private offerToll(): GameState {
    const c = this.char!;
    const price = this.tollPrice();
    this.interaction = {
      type: 'toll', contentId: TOLL_KEEPER_ID, toll: price,
      choices: [
        { key: 'a', text: c.gold >= price ? `Pay ${price} gold` : `Pay ${price} gold (you have ${c.gold})` },
        { key: 'b', text: 'Pay with a finger (-1 Dexterity, for good)' },
        { key: 'c', text: 'Fight the Toll-Keeper' },
        { key: 'd', text: 'Turn back' },
      ],
    };
    this.phase = 'interaction';
    this.messages = [
      'On the stair, where it turns into the dark, a hooded figure sits with a ledger open on its knees.',
      'It does not look up. A long grey finger taps the page.',
      '',
      `"Toll," it says. "${price} gold. Or a finger: I am not particular which."`,
    ];
    return this.getState();
  }

  private resolveToll(key: string): GameState {
    const c = this.char!;
    const price = this.interaction?.toll ?? this.tollPrice();
    const settle = (lines: string[]) => {
      this.dungeonState!.defeatedFixedMonsters.add(TOLL_KEEPER_ID);
      this.interaction = null;
      this.phase = 'playing';
      return this.descendTo(c.dungeonLevel + 1, [...lines, '']);
    };
    if (key === 'a') {
      if (c.gold < price) {
        this.messages = [`You turn out your purse: ${c.gold} gold. The Toll-Keeper does not even look at it.`, '"Toll," it says again.'];
        return this.getState();
      }
      c.gold -= price;
      return settle([`You count out ${price} gold. It writes your name in the ledger without looking up, and moves its knees aside.`, '"Pass," it says. "You are in the book now."']);
    }
    if (key === 'b') {
      c.dexterity = Math.max(3, c.dexterity - 1);
      return settle([
        'It takes your hand almost gently, lays your little finger on the ledger, and the knife is very quick.',
        'It writes your name in your own blood. (-1 Dexterity, for good)',
        '"Pass," it says. "You are in the book now."',
      ]);
    }
    if (key === 'c') {
      this.interaction = null;
      this.phase = 'playing';
      const def = getDefinition('Toll-Keeper');
      const monster = createMonster('Toll-Keeper', this.rng.int(def.minLevel, def.maxLevel) + this.worldBoost(), TOLL_KEEPER_ID, this.worldBoost() > 0);
      return this.beginCombat(monster);
    }
    return this.closeInteraction('You step back from the stair. The Toll-Keeper returns to its ledger.');
  }

  private offerDeepDescent(lead: string[]): GameState {
    const c = this.char!;
    const levels = Array.from({ length: 7 - c.dungeonLevel }, (_, i) => c.dungeonLevel + 1 + i);
    if (!levels.length) { this.messages = lead; return this.getState(); }
    this.interaction = {
      type: 'descend', contentId: 'descend',
      choices: [...levels.map((n, i) => ({ key: String.fromCharCode(97 + i), text: `Down to Level ${n}` })),
        { key: String.fromCharCode(97 + levels.length), text: c.dungeonLevel === 1 && lead.length > 2 ? 'Walk it from here' : 'Just one level' }],
      descend: levels,
    };
    this.phase = 'interaction';
    this.messages = lead;
    return this.getState();
  }

  private resolveDeepDescent(key: string): GameState {
    const c = this.char!;
    const levels = this.interaction?.descend ?? [];
    const pick = levels[key.charCodeAt(0) - 97];
    const fromLadder = this.interaction?.contentId === 'descend-ladder';
    this.interaction = null;
    this.phase = 'playing';
    if (pick === undefined) {
      if (!fromLadder) return this.closeInteraction('You set off on foot, as you did the first time.');
      return this.descendTo(c.dungeonLevel + 1);
    }
    return this.descendTo(pick, ['The stairs run on and on, down past the levels you know, and let you out far below.', '']);
  }

  /** Down to a level, at its entrance (as the stairs do). */
  private descendTo(level: number, lead: string[] = []): GameState {
    const c = this.char!;
    c.dungeonLevel = level;
    this.loadLevelIntoCache(level);
    const lvl = this.getLevel(level)!;
    c.x = lvl.entrance.x; c.y = lvl.entrance.y;
    const s = this.enterLevel();
    if (lead.length) { this.messages = [...lead, ...this.messages]; s.messages = [...this.messages]; }
    return s;
  }

  /** Leaves Asmodeus's scene for the screen it leads to: the victory
   * screen and its score, or the death screen. */
  continueLordScene(): GameState {
    if (this.phase !== 'asmodeus-scene' || !this.lordScene) return this.getState();
    const { then, messages } = this.lordScene;
    this.lordScene = null;
    this.phase = then;
    this.messages = messages;
    return this.getState();
  }

  /** After death: carry on from the entrance, poorer and wiser. */
  reviveAfterDeath(): GameState {
    if (!this.char || this.phase !== 'death') return this.getState();
    if (this.reviveOnLevel6) {
      // Flung out of Asmodeus's hall: somewhere on Level 6, at random.
      this.reviveOnLevel6 = false;
      this.char.dungeonLevel = DEATH.ASMODEUS_REVIVE_LEVEL;
      this.loadLevelIntoCache(DEATH.ASMODEUS_REVIVE_LEVEL);
      const lvl = this.getLevel(DEATH.ASMODEUS_REVIVE_LEVEL)!;
      this.char.x = lvl.entrance.x; this.char.y = lvl.entrance.y;
      if (!this.char.introsSeen.includes(DEATH.ASMODEUS_REVIVE_LEVEL)) this.char.introsSeen.push(DEATH.ASMODEUS_REVIVE_LEVEL);
      this.teleportPlayer();
      this.phase = 'playing';
      this.messages = [`You come to on cold stone, somewhere on Level ${DEATH.ASMODEUS_REVIVE_LEVEL}. Far below, something is laughing.`, '', ...this.enterArea()];
      return this.getState();
    }
    this.phase = 'playing';
    this.lightAround();
    this.lastArea = null;
    this.messages = [`You drag yourself up at the entrance to Level ${this.char.dungeonLevel}, alive again.`, '', ...this.enterArea()];
    return this.getState();
  }

  /** After death: reload the last save, undoing the toll. If there somehow
   * isn't one, revive at the entrance instead. */
  dismissDeath(): GameState {
    if (!this.char) return this.getState();
    const id = this.char.id;
    if (this.repo.loadCharacter(id)) {
      this.loadCharacter(id);
      this.messages = ['You wake with a gasp, back where you last saved, whole again.'];
      return this.getState();
    }
    return this.reviveAfterDeath();
  }

  private trapDeathCause(variant: string): string {
    const causes: Record<string, string> = {
      'pit': 'You fell into a pit trap and did not survive the drop.',
      'falling-stone': 'A falling stone trap crushed you.',
      'fire-blast': 'A fire-blast trap burned you to death.',
      'acid-spray': 'An acid-spray trap dissolved you.',
    };
    return causes[variant] ?? 'A trap killed you.';
  }

  private handleVictory(): GameState {
    if (!this.char) return this.getState();

    this.bankPlayTime();
    const playSeconds = this.char.playTime;

    // Playing on starts over from the top of Level 1, against a stronger dungeon.
    this.endCombat(true);
    this.char.dungeonLevel = 1;
    this.loadLevelIntoCache(1);
    const start = this.getLevel(1)!.entrance;
    this.char.x = start.x; this.char.y = start.y; this.char.facing = 'N';
    this.repo.saveCharacter(this.char);
    if (this.dungeonState) this.repo.saveDungeonState(this.char.id, this.dungeonState);

    const score = calculateScore(this.char, playSeconds);
    const scoreLines = formatScore(score);

    // No mortal can kill the Lord of the Nine Hells: beaten, he is banished.
    // His banishment plays first; the victory screen and score follow.
    this.phase = 'asmodeus-scene';
    this.messages = [
      'Your final blow lands, and Asmodeus does not fall.',
      'He SHRINKS: howling, smaller and smaller, a giant,',
      'a man, a cat, a spark of hellfire in the dark,',
      'and the rift he came from swallows him whole.',
      '',
      'ASMODEUS IS BANISHED TO THE NINE HELLS.',
    ];
    this.lordScene = { scene: 'banished', then: 'victory', messages: [
      'No mortal hand can kill Asmodeus. He will claw his way',
      'back out of the Nine Hells, stronger than before,',
      'and be waiting on his throne.',
      '',
      'The Seven Levels have been conquered.',
      '',
      ...scoreLines,
      '',
      `Play on, and you start again at the top of Level 1, where every monster is now`,
      `${this.worldBoost()} levels stronger than before.`,
    ] };

    // Attach score to state
    const state = this.getState();
    state.finalScore = score;
    return state;
  }

  private endCombat(won: boolean): void {
    // Remove naked status and any lost-turn hold after combat ends
    if (this.char) {
      this.char.statusEffects = this.char.statusEffects.filter(e => e.type !== 'naked');
      this.char.heldRounds = 0;
      this.char.heldBy = undefined;
      this.char.battleCryRounds = 0;
      wearDownWard(this.char);
    }
    resetPaceAfterCombat(this.pace, this.rng);
    this.combat = null;
    this.phase = 'playing';
  }

  // ─── Interactions ────────────────────────────────────────────────────────

  interactionChoice(key: string): GameState {
    if (!this.char || !this.interaction || !this.dungeonState) return this.getState();

    const { type, contentId } = this.interaction;

    switch (type) {
      case 'chest':
        return this.resolveChestChoice(key, contentId);
      case 'book':
        return this.resolveBookChoice(key, contentId);
      case 'altar':
        return this.resolveAltarChoice(key, contentId);
      case 'fountain':
        return this.resolveFountainChoice(key, contentId);
      case 'trap-choice':
        return this.resolveTrapChoice(key, contentId);
      case 'shop':
        return this.resolveShopChoice(key);
      case 'gear':
        return this.resolveGearChoice(key);
      case 'teleport':
        return this.resolvePlanarStep(key);
      case 'descend':
        return this.resolveDeepDescent(key);
      case 'toll':
        return this.resolveToll(key);
      default:
        return this.closeInteraction();
    }
  }

  // Chest flow: open / check for traps / leave. A search (Wisdom) can spot
  // the trap, and a spotted trap can be disarmed (Dexterity). Opening a
  // trapped chest any other way springs the trap before the loot.
  private resolveChestChoice(key: string, id: string): GameState {
    if (!this.char || !this.dungeonState || !this.interaction) return this.getState();
    const inter = this.interaction;
    const trap = chestTrapFor(this.char, id);

    if (inter.chestTrapSpotted && trap) {
      if (key === 'a') {
        if (this.rng.float() < chestTrapDisarmChance(this.char)) {
          const xp = CHEST_TRAPS.DISARM_XP_PER_LEVEL * this.char.dungeonLevel;
          this.char.xp += xp;
          return this.openChest(id, null, [`You carefully disarm the ${chestTrapName(trap)}. (+${xp} XP)`, '']);
        }
        return this.openChest(id, trap, ['Your hand slips!']);
      }
      if (key === 'b') return this.openChest(id, trap, []);
      return this.closeInteraction('You leave the chest alone.');
    }

    if (key === 'b') {
      if (inter.chestSearched) return this.getState();
      inter.chestSearched = true;
      if (trap && this.rng.float() < chestTrapDetectChance(this.char)) {
        inter.chestTrapSpotted = true;
        inter.choices = [
          { key: 'a', text: 'Try to disarm it' },
          { key: 'b', text: 'Open it anyway' },
          { key: 'c', text: 'Leave it' },
        ];
        this.messages = [`You spot a ${chestTrapName(trap)} rigged to the lock!`];
      } else {
        inter.choices = [
          { key: 'a', text: 'Open it' },
          { key: 'c', text: 'Leave it' },
        ];
        this.messages = ['You search the chest carefully and find no traps.'];
      }
      return this.getState();
    }

    if (key === 'a') return this.openChest(id, trap, []);
    return this.closeInteraction('You leave the chest alone.');
  }

  /** Opens a chest: springs its trap first (if any), then hands out the loot. */
  private openChest(id: string, trap: import('./types.js').ChestTrapType | null, lead: string[]): GameState {
    if (!this.char || !this.dungeonState) return this.getState();
    this.dungeonState.openedChests.add(id);

    const messages = [...lead];
    let alarm = false;
    this.fx.objectArt = { kind: 'chest', moment: trap ? 'boom' : 'open' };
    if (trap) {
      messages.push('TRAP!');
      const sprung = springChestTrap(this.char, trap, this.rng);
      this.fx.player = CHEST_TRAP_ELEMENT[trap];
      messages.push(...sprung.messages, '');
      alarm = !!sprung.triggerMonster;
    }

    // A dragon's hoard: gold, gemstones, magic gems, and for the toughest a singular item.
    const hoard = id.startsWith(HOARD_PREFIX) ? this.dungeonState.hoards?.find(h => h.id === id) : undefined;
    if (hoard && hoard.monster === 'Barrow-King') {
      messages.push(...this.graveGoods(hoard.monsterLevel));
      this.dungeonState.hoards = this.dungeonState.hoards!.filter(h => h.id !== id);
      this.cue('victory-4');
      this.messages = messages;
      return this.closeInteractionWithSave();
    }
    if (hoard) {
      const loot = dragonHoardLoot(this.char, currentMonsterType(hoard.monster), hoard.monsterLevel, this.rng);
      messages.push(...loot.messages);
      const unique = ['Big Fat Dragon', 'Bone Sovereign'].includes(currentMonsterType(hoard.monster));   // (an old hoard may say Dracolich)
      if (unique || (hoard.monsterLevel >= HOARD.ITEM_FROM_LEVEL && this.rng.float() < HOARD.ITEM_CHANCE)) messages.push(...this.hoardItem());
      this.dungeonState.hoards = this.dungeonState.hoards!.filter(h => h.id !== id);
      this.cue('victory-4');
      this.messages = messages;
      return this.closeInteractionWithSave();
    }

    // A ring chest holds its ring and nothing else.
    const ringChest = id.startsWith(RING_CHEST_PREFIX) ? ringChestById(id.slice(RING_CHEST_PREFIX.length)) : undefined;
    if (ringChest) {
      messages.push(...this.giveRing(ringChest.ring));
      this.cue('victory-3');
      this.messages = messages;
      if (alarm) { this.closeInteraction(); return this.startRandomEncounter(); }
      return this.closeInteractionWithSave();
    }

    // A Zork treasure chest holds its treasure and nothing else.
    const treasure = id.startsWith(TREASURE_CHEST_PREFIX) ? treasureById(id.slice(TREASURE_CHEST_PREFIX.length)) : undefined;
    if (treasure) {
      const owned = this.char.inventory.treasures ?? [];
      if (!owned.includes(treasure.id)) {
        this.char.inventory.treasures = [...owned, treasure.id];
        messages.push(...treasure.found, '', treasure.bless(this.char), '', `Your score just went up by ${treasure.points} points.`);
        this.cue('victory-3');
      } else {
        messages.push('The chest is empty.');
      }
      this.messages = messages;
      if (alarm) { this.closeInteraction(); return this.startRandomEncounter(); }
      return this.closeInteractionWithSave();
    }

    const result = resolveChest(this.char, this.rng);
    messages.push(...result.messages);

    messages.push(...this.levelUp());

    if (alarm || result.triggerMonster) {
      // Closing the prompt and starting the fight both read the state, which
      // would use up the trap's hit hint; keep it for the final state.
      const fx = this.fx;
      this.closeInteraction();
      this.startRandomEncounter();
      this.fx = { ...fx, ...this.fx };
      // beginCombat replaces the messages; keep what just happened at the chest.
      this.messages = [...messages, '', ...this.messages];
      return this.getState();
    }

    this.messages = messages;
    return this.closeInteractionWithSave();
  }

  private resolveBookChoice(key: string, id: string): GameState {
    if (!this.char || !this.dungeonState) return this.getState();

    if (key !== 'a' && key !== 'b') {
      return this.closeInteraction('You leave the tome on its pedestal.');
    }

    this.dungeonState.readBooks.add(id);

    if (key === 'a') {
      this.applyTomeReading();
      return this.closeInteractionWithSave();
    }

    this.char.inventory.books++;
    this.messages = [
      'You tuck the tome into your pack.',
      `(${this.char.inventory.books} total)`,
    ];
    return this.closeInteractionWithSave();
  }

  private resolveAltarChoice(key: string, id: string): GameState {
    if (!this.char || !this.dungeonState) return this.getState();

    if (key !== 'a') {
      return this.closeInteraction('You leave the altar undisturbed.');
    }

    this.dungeonState.usedAltars.add(id);
    const result = resolveAltar(this.char, this.rng);
    if (this.char.statusEffects.some(e => e.type === 'death-mark')) {
      this.char.statusEffects = this.char.statusEffects.filter(e => e.type !== 'death-mark');
      result.messages.unshift('Light pours over you, and the Barghest\u2019s mark burns away. You feel the omen let go.', '');
    }
    this.fx.objectArt = { kind: 'altar', moment: 'blessed' };
    const uncursed = breakAmuletCurse(this.char, 'Light pours from the altar and finds the curse at your throat.');
    this.messages = [...result.messages, ...(uncursed.length ? ['', ...uncursed] : []), ...this.levelUp()];

    return this.closeInteractionWithSave();
  }

  private resolveFountainChoice(key: string, id: string): GameState {
    if (!this.char || !this.dungeonState) return this.getState();

    if (key !== 'a') {
      return this.closeInteraction('You leave the fountain untouched.');
    }

    // On the shallow levels, a Grindylow may be waiting in the water (not for someone dying of rot).
    const rotting = this.char.statusEffects.some(e => e.type === 'flesh-rot');
    if (!rotting && this.char.dungeonLevel <= 3 && this.rng.float() < 0.12) {
      const lvl = Math.max(1, Math.min(10, this.char.level + this.rng.int(-1, 2)));
      this.interaction = null;
      const s = this.beginCombat(createMonster('Grindylow', lvl + this.worldBoost(), `grindy-${Date.now()}`, this.worldBoost() > 0));
      s.messages = ['As you bend to drink, the water bulges and long green arms burst out of it!', '', ...s.messages];
      this.messages = s.messages;
      return s;
    }
    this.dungeonState.usedFountains.add(id);
    // Clean water washes out a ghoul's rot, if it hasn't gone too far.
    const rot = this.char.statusEffects.find(e => e.type === 'flesh-rot' && e.doom === undefined);
    if (rot) this.char.statusEffects = this.char.statusEffects.filter(e => e !== rot);
    const result = resolveFountain(this.char, this.rng);
    if (rot) result.messages.unshift(`You plunge your ${rot.part ?? 'wound'} into the water. The rot hisses, blackens, and washes away. Clean flesh beneath.`, '');
    const tainted = !!(result.damageDealt || result.statusAdded || (result.statChanged && result.statChanged.delta < 0));
    this.fx.objectArt = { kind: 'fountain', moment: tainted ? 'tainted' : 'refreshed' };
    const uncursed = breakAmuletCurse(this.char, 'The water runs over the amulet at your throat and hisses like acid on iron.');
    this.messages = [...result.messages, ...(uncursed.length ? ['', ...uncursed] : []), ...this.levelUp()];

    return this.closeInteractionWithSave();
  }

  private resolveTrapChoice(key: string, id: string): GameState {
    if (!this.char || !this.dungeonState) return this.getState();

    const lvl = this.getLevel(this.char.dungeonLevel);
    const content = lvl?.contents.get(`${this.char.x},${this.char.y}`);
    const variant = content?.trapVariant ?? 'pit';

    if (key === 'c') {
      // Turn back — step back to previous cell (stay in place for simplicity)
      return this.closeInteraction('You back away carefully.');
    }

    let result;
    if (key === 'd' && variant === 'teleport') {
      result = {
        messages: ['You take a breath and step onto the glowing sigil.', '', 'YOU HAVE BEEN TELEPORTED.'],
        resolved: true,
        teleported: true,
      };
    } else if (key === 'a') {
      result = resolveTrapAvoid(this.char, variant, this.rng);
    } else {
      result = resolveTrapDisarm(this.char, variant, this.rng);
      if (result.resolved && !result.damageDealt && !result.statusAdded) {
        this.dungeonState.disarmedTraps.add(id);
      }
    }

    if (result.resolved) this.dungeonState.triggeredTraps.add(id);
    if (result.damageDealt || result.statusAdded) this.fx.player = trapElement(variant);

    this.messages = result.messages;

    if (result.teleported) {
      const ambush = this.teleportGamble();
      if (ambush) {
        const lead = [...this.messages, ''];
        this.closeInteraction();
        this.startRandomEncounter();
        this.messages = [...lead, ...this.messages];
        return this.getState();
      }
    }
    if (result.triggerMonster) {
      this.closeInteraction();
      return this.startRandomEncounter();
    }
    if (this.char.hp <= 0) {
      return this.handleDeath(this.trapDeathCause(variant));
    }

    return this.closeInteractionWithSave();
  }

  private closeInteraction(msg?: string): GameState {
    if (msg) this.messages = [msg];
    this.interaction = null;
    this.phase = 'playing';
    return this.getState();
  }

  /** Closes a finished interaction. (Nothing is written to disk here: the
   * game only saves when the player chooses to, with S.) */
  private closeInteractionWithSave(): GameState {
    this.interaction = null;
    this.phase = 'playing';
    return this.getState();
  }

  // ─── Teleport ────────────────────────────────────────────────────────────

  /** A teleport trap's jump: a random far spot, and then either an ambush
   * (returns true: the caller starts the fight), a rough landing, or clean. */
  private teleportGamble(): boolean {
    if (!this.char) return false;
    this.teleportPlayer();
    const roll = this.rng.float();
    if (roll < TRAPS.TELEPORT_AMBUSH_CHANCE) {
      this.messages.push('', 'You land right in front of something hungry!');
      return true;
    }
    if (roll < TRAPS.TELEPORT_AMBUSH_CHANCE + TRAPS.TELEPORT_ROUGH_CHANCE) {
      const pct = TRAPS.TELEPORT_ROUGH_DAMAGE_MIN + this.rng.float() * (TRAPS.TELEPORT_ROUGH_DAMAGE_MAX - TRAPS.TELEPORT_ROUGH_DAMAGE_MIN);
      const dealt = Math.min(Math.max(1, Math.round(this.char.maxHp * pct)), this.char.hp - 1);
      this.char.hp -= dealt;
      this.fx.player = 'arcane';
      this.messages.push('', `The jump wrenches you inside out. You land hard, dizzy and turned around, for ${dealt} damage.`);
      return false;
    }
    this.messages.push('', 'You land somewhere else on this level, unharmed.');
    return false;
  }

  /** Sends the character to a random spot elsewhere on the current level
   * (ruby, the Wizard's teleport, teleport traps): real floor they could have
   * walked to, clear of any feature or monster lair, and well away from where
   * they stood when there's room for that. Explored or not. */
  private teleportPlayer(): void {
    if (!this.char || !this.dungeonState) return;
    const lvl = this.getLevel(this.char.dungeonLevel);
    if (!lvl) return;

    const here = { x: this.char.x, y: this.char.y };
    const reachable = floodFill(lvl.grid, here.x, here.y);
    const candidates = [...reachable]
      .map(k => { const [x, y] = k.split(',').map(Number); return { x, y }; })
      .filter(p => !(p.x === here.x && p.y === here.y))
      .filter(p => !isSolidRock(lvl.grid[p.y][p.x]))
      .filter(p => !this.onTheLongWay(lvl, p))
      .filter(p => {
        const content = lvl.contents.get(`${p.x},${p.y}`);
        return !content || content.type === 'description';
      });
    if (candidates.length === 0) return;

    const far = candidates.filter(p => Math.abs(p.x - here.x) + Math.abs(p.y - here.y) >= TELEPORT_MIN_DISTANCE);
    const dest = this.rng.pick(far.length > 0 ? far : candidates);
    this.char.x = dest.x;
    this.char.y = dest.y;
    this.char.facing = this.rng.pick(['N', 'E', 'S', 'W'] as Direction[]);
    this.lightAround();
    this.lastArea = null;  // the next step describes wherever this is
  }

  /** A character found inside solid rock (saved on a square a later change to
   * the level filled in, such as a room rounded off) steps out onto the
   * nearest open floor. */
  private standOnFloor(): void {
    if (!this.char || !this.levelCache.has(this.char.dungeonLevel)) return;
    const grid = this.levelCache.get(this.char.dungeonLevel)!.grid;
    if (!isSolidRock(grid[this.char.y]?.[this.char.x] ?? { walls: { N: true, E: true, S: true, W: true } } as DungeonCell)) return;
    const seen = new Set([`${this.char.x},${this.char.y}`]);
    let ring = [{ x: this.char.x, y: this.char.y }];
    while (ring.length) {
      const next: { x: number; y: number }[] = [];
      for (const p of ring) for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
        const q = { x: p.x + dx, y: p.y + dy }, k = `${q.x},${q.y}`;
        const c = grid[q.y]?.[q.x];
        if (!c || seen.has(k)) continue;
        seen.add(k);
        if (!isSolidRock(c)) { this.char.x = q.x; this.char.y = q.y; this.lastArea = null; return; }
        next.push(q);
      }
      ring = next;
    }
  }

  /** On the Long Way to the throne, or in the throne room: no shortcut lands you there. */
  private onTheLongWay(lvl: LevelCache, p: { x: number; y: number }): boolean {
    const sc = lvl.sanctum;
    if (!sc) return false;
    if (p.x >= sc.room.x0 && p.x <= sc.room.x1 && p.y >= sc.room.y0 && p.y <= sc.room.y1) return true;
    return sc.path.some(q => q.x === p.x && q.y === p.y) || sc.branches.some(q => q.x === p.x && q.y === p.y);
  }

  // ─── Level cache ─────────────────────────────────────────────────────────

  private getLevel(levelNum: number): LevelCache | undefined {
    if (!this.levelCache.has(levelNum)) {
      this.loadLevelIntoCache(levelNum);
    }
    return this.levelCache.get(levelNum);
  }

  private loadLevelIntoCache(levelNum: number): void {
    if (!this.char) return;
    if (this.levelCache.has(levelNum)) return;

    const serialized = this.repo.loadLevel(this.char.id, levelNum);
    if (!serialized) return;

    const { grid, entrance, exit, contents } = deserializeLevel(serialized);
    // Level 7: Asmodeus on his throne at the end of the Long Way (or, where there's no room for it, in the middle).
    const seed = serialized.seed ?? (entrance.x * 7919 + entrance.y * 104729);
    const sanctum = levelNum === 7 ? buildSanctum(grid, entrance, contents, seed) : null;
    // Round rooms: all of them on the Caverns of Teeth and the Hells, some elsewhere (curves.ts).
    roundRooms(grid, contents, [entrance, exit, sanctum?.mouth ?? null, sanctum?.door ?? null], levelNum);
    if (levelNum === 4) buildOrcKingLair(grid, entrance, exit, contents);
    if (levelNum === 5) buildBarrowKingLair(grid, entrance, exit, contents);
    // Level 5: the old gaol, cut into the rock (gaol.ts).
    const gaol = levelNum === GAOL.LEVEL ? buildGaol(grid, entrance, contents, seed) : null;
    const straight = gaol ? new Set([...gaol.aisle, ...gaol.link, ...gaol.cells.flat()].map(p => `${p.x},${p.y}`)) : undefined;
    if (levelNum === 6) placeLambtonWorm(grid, entrance, exit, contents);
    if (levelNum === 7) { if (!sanctum) centerAsmodeusLair(grid, contents); placeRakshasa(grid, entrance, exit, contents); }
    placeTreasures(levelNum, grid, entrance, exit, contents);
    placeShop(levelNum, grid, entrance, exit, contents);
    this.placeBloodstains(levelNum, grid, entrance, contents);
    this.levelCache.set(levelNum, { grid, entrance, exit, contents, seed, sanctum, gaol, straight });
    this.placeHoards(levelNum);
  }

  /** Puts the level's unopened dragon hoards where their dragons fell, and
   * takes away any the saved game doesn't know of (after a Restore). */
  private placeHoards(levelNum: number): void {
    const lvl = this.levelCache.get(levelNum);
    if (!lvl || !this.dungeonState) return;
    for (const [k, c] of lvl.contents) if (c.id.startsWith(HOARD_PREFIX) || c.id.startsWith('pearl-fountain-')) lvl.contents.delete(k);
    for (const h of this.dungeonState.hoards ?? []) {
      if (h.level !== levelNum) continue;
      if (h.kind === 'fountain' ? this.dungeonState.usedFountains.has(h.id) : this.dungeonState.openedChests.has(h.id)) continue;
      const k = `${h.x},${h.y}`;
      if (!lvl.contents.has(k)) lvl.contents.set(k, { type: h.kind === 'fountain' ? 'fountain' : 'chest', id: h.id });
    }
  }

  /** A slain dragon sometimes leaves its hoard: a chest on an open square
   * beside you (in front if it can be), opened once. */
  private leaveHoard(monster: { type: string; level: number; definition: { isUnique?: boolean } }, what?: string): string[] {
    if (!this.char || !this.dungeonState) return [];
    const lvl = this.getLevel(this.char.dungeonLevel);
    if (!lvl) return [];
    const STEP: Record<Direction, [number, number]> = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
    const order: Direction[] = [this.char.facing, ...(['N', 'E', 'S', 'W'] as Direction[]).filter(d => d !== this.char!.facing)];
    const spot = order.map(d => ({ d, x: this.char!.x + STEP[d][0], y: this.char!.y + STEP[d][1] }))
      .find(p => canMove(lvl.grid, this.char!.x, this.char!.y, p.d) && !lvl.contents.has(`${p.x},${p.y}`));
    if (!spot) return [];
    const hoard = { id: `${HOARD_PREFIX}${this.char.dungeonLevel}-${spot.x}-${spot.y}-${Date.now().toString(36)}`, level: this.char.dungeonLevel, x: spot.x, y: spot.y, monster: monster.type, monsterLevel: monster.level };
    this.dungeonState.hoards = [...(this.dungeonState.hoards ?? []), hoard];
    lvl.contents.set(`${spot.x},${spot.y}`, { type: 'chest', id: hoard.id });
    const where = spot.d === this.char.facing ? 'just ahead of you' : `to your ${{ N: { E: 'left', W: 'right', S: 'back' }, E: { S: 'left', N: 'right', W: 'back' }, S: { W: 'left', E: 'right', N: 'back' }, W: { N: 'left', S: 'right', E: 'back' } }[this.char.facing][spot.d as 'N'] ?? 'side'}`;
    return ['', what ? `${what}, ${where}.` : `Behind where the ${monster.type} lay, half-buried in bones and coins: an iron-bound chest, ${where}. Its hoard.`];
  }

  /** The singular magic item in a tough dragon's hoard: a +3 weapon or armour,
   * a magic ring you don't have, or an uncursed amulet at full strength. */
  private hoardItem(): string[] {
    if (!this.char) return [];
    const inv = this.char.inventory;
    const rings = (['fire', 'cold', 'evil', 'undead', 'poison', 'wither', 'escape'] as RingId[]).filter(r => r === 'escape' || !inv.rings?.includes(r));
    const options = ['gear', ...(rings.length ? ['ring'] : []), ...((inv.amulets?.length ?? 0) < AMULETS.MAX_CARRIED ? ['amulet'] : [])];
    const pick = this.rng.pick(options);
    if (pick === 'ring') return ['', 'On a finger bone among the coins, a ring:', ...this.giveRing(this.rng.pick(rings))];
    if (pick === 'amulet') {
      const stats: AmuletStat[] = ['strength', 'intelligence', 'dexterity', 'constitution', 'wisdom'];
      const amulet: Amulet = { stat: this.rng.pick(stats), bonus: AMULETS.BONUS_MAX, cursed: false, look: this.rng.pick([...AMULETS.LOOKS]) };
      inv.amulets = [...(inv.amulets ?? []), amulet];
      return ['', `Draped over a crown lies a ${amuletName(amulet, false)}, heavy with old power. (A: Amulets)`];
    }
    const gear = rollGear(this.char, this.rng, 'hoard', 3);
    return gear ? ['', ...gear] : [];
  }

  /** The Barrow-King's grave goods: barrow gold, old jewellery, and one
   * singular thing: his ancient enchanted blade (a +3 weapon), or his crown,
   * which raises one of your attributes for good. */
  private graveGoods(level: number): string[] {
    const c = this.char!;
    const L = Math.max(1, level);
    const gold = this.rng.int(40, 90) * L;
    let jewels = 0;
    for (let i = 0; i < 3; i++) jewels += this.rng.int(15, 40) * L;
    c.gold += gold + jewels;
    const out = ['The lid groans open on a thousand years of dark.', '',
      `Barrow gold, dull and heavy: ${gold} gold.`, `Torcs, arm-rings and brooches of the old kings: worth ${jewels} gold.`];
    if (this.rng.float() < 0.5) {
      const blade = rollGear(c, this.rng, 'hoard', 3);
      if (blade) return [...out, '', 'Laid across the gold, wrapped in rotted silk:', ...blade];
    }
    const stats = ['strength', 'constitution', 'wisdom'] as const;
    const stat = this.rng.pick([...stats]);
    c[stat] += 2;
    const name = stat[0].toUpperCase() + stat.slice(1);
    return [...out, '', 'At the bottom, his crown: a plain band of black iron, colder than the grave.',
      `You set it on your brow. The cold goes into you, and stays, and makes you more than you were. (+2 ${name}, for good)`];
  }

  /** Puts a ring on: the star sapphire's charges, or one of the others (in use if none is). */
  private giveRing(ring: RingId): string[] {
    const inv = this.char!.inventory;
    const info = RINGS_INFO[ring];
    const out = [...info.found, ''];
    if (ring === 'escape') {
      inv.starRings = (inv.starRings ?? 0) + 1;
      if (!inv.starCharges) inv.starCharges = RINGS.STAR_CHARGES;
      out.push(`You take the star sapphire ring. (${info.power}: ${RINGS.STAR_CHARGES} uses, in a fight)`);
    } else {
      if (!inv.rings?.includes(ring)) inv.rings = [...(inv.rings ?? []), ring];
    }
    if (isProtectionRing(ring)) {
      const worn = inv.wornRings ?? [];
      if (worn.includes(ring)) out.push(`You already wear one like it. (${info.power})`);
      else if (worn.length < RINGS.MAX_WORN) { inv.wornRings = [...worn, ring]; out.push(`You slip the ${info.name} onto your finger. It guards you while you wear it. (${info.power})`); }
      else out.push(`You carry the ${info.name}: all ${RINGS.MAX_WORN} of your ring fingers are taken. (J: rings)`);
      out.push('(Protective rings all work at once while worn. J: rings.)');
    } else {
      if (ring !== 'escape') out.push(`You take the ${ring === 'borak' ? 'Borak' : info.name}. (${info.power})`);
      if (!inv.readiedRing) { inv.readiedRing = ring; out.push('It is the ring you have ready. (Only one power ring is ready at a time. R in a fight.)'); }
      else out.push('(Power rings are readied one at a time. J: ready it. R in a fight.)');
    }
    return out;
  }

  // ─── Utilities ───────────────────────────────────────────────────────────

  private emptyDungeonState(): DungeonState {
    return {
      visitedCells: new Set(),
      openedChests: new Set(),
      readBooks: new Set(),
      usedFountains: new Set(),
      usedAltars: new Set(),
      triggeredTraps: new Set(),
      disarmedTraps: new Set(),
      defeatedFixedMonsters: new Set(),
      defeatedUniqueMonsters: new Set(),
      visitedDescriptions: new Set(),
      revealedLevels: new Set(),
    };
  }

  getCharacter(): Character | null { return this.char; }
  getCombat(): CombatState | null { return this.combat; }
  getInteraction(): InteractionState | null { return this.interaction; }
  getPhase(): GamePhase { return this.phase; }

  private xpToNextLevel(char: Character): number | null {
    const next = xpForLevel(char.level + 1);
    if (next === xpForLevel(char.level)) return null; // max level
    return next;
  }
}

