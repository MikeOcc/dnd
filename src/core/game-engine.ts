import { RNG } from './random.js';
import type {
  Character, Monster, GameState, GamePhase, CombatState, InteractionState,
  Direction, SerializedDungeon, DungeonCell, CellContent, DungeonState,
  CharacterRoll, CharacterSummary, ScoreResult, Choice, StatusEffect, GemType,
} from './types.js';
import { rollCharacter, createCharacter, checkLevelUp, tickStatusEffects, formatRoll, addStatusEffect, xpForLevel } from './character.js';
import { generateLevel, deserializeLevel, canMove, floodFill } from './dungeon.js';
import { renderCorridorView, scanCorridor, CORRIDOR_VIEW_DEFAULTS, CONTENT_PATTERNS, spatialHash } from './corridor-view.js';
import type { EntityMarker } from './corridor-view.js';
import { playerAttack, playerFireball, playerAcid, playerLightning, playerFrost, playerPoison, playerOpal, playerHeal, playerPray, playerRun, playerHeld, beholderAntimagic, calculateXPReward } from './combat.js';
import {
  initialPace, incrementPace, shouldTriggerRandomEncounter, resetPaceAfterCombat, EncounterPace,
  applyDeath, resolveChest, readBook, resolveAltar, resolveFountain,
  resolveTrapTriggered, resolveTrapAvoid, resolveTrapDisarm,
} from './encounters.js';
import { createMonster, pickRandomMonsterType, randomMonsterLevel, getDefinition } from './monsters.js';
import { calculateScore, formatScore } from './scoring.js';
import { CHARACTER, GAMEPLAY, DUNGEON, TREASURE, GEMS } from './config.js';
import { getLevelIntro } from '../content/level-text.js';
import { getDescription, getDescriptionShort } from '../content/descriptions.js';
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

const GEM_PLURAL: Record<GemType, string> = {
  ruby: 'rubies', sapphire: 'sapphires', diamond: 'diamonds', opal: 'opals',
};

interface LevelCache {
  grid: DungeonCell[][];
  entrance: { x: number; y: number };
  exit: { x: number; y: number } | null;
  contents: Map<string, CellContent>;
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
  private pendingRoll: CharacterRoll | null = null;
  private pendingName: string | null = null;
  private pace: EncounterPace;
  private rng: RNG;
  private sessionStart: number = Date.now();
  private restTicks: number = 0;

  constructor(repo: Repository) {
    this.repo = repo;
    this.rng = new RNG(RNG.globalSeed());
    this.pace = initialPace(this.rng);
  }

  // ─── Session bootstrap ───────────────────────────────────────────────────

  getState(): GameState {
    const state: GameState = {
      phase: this.phase,
      messages: [...this.messages],
    };

    if (this.char) {
      state.character = { ...this.char };

      const lvl = this.getLevel(this.char.dungeonLevel);
      if (lvl) {
        state.view = this.renderView();
      }
    }

    if (this.combat) state.combat = { ...this.combat };
    if (this.interaction) state.interaction = { ...this.interaction };
    if (this.pendingRoll) state.currentRoll = this.pendingRoll;
    if (this.phase === 'map') state.mapFull = this.mapFull;

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
    return renderCorridorView(lvl.grid, this.char.x, this.char.y, this.char.facing, {}, undefined, entities);
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
        { key: 'a', text: 'Accept Character' },
        ...(rem > 0 ? [{ key: 'b', text: `Reroll Character (${rem} reroll${rem === 1 ? '' : 's'} remaining)` }] : []),
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
        { key: 'c', text: 'Continue' },
        { key: 'q', text: 'Quit to Main Menu' },
      ];
    }
    if (this.phase === 'save-prompt') {
      return [
        { key: 'c', text: 'Continue Playing' },
        { key: 'x', text: 'Exit to Main Menu' },
      ];
    }
    if (this.phase === 'combat' && this.combat && (this.char?.heldRounds ?? 0) > 0) {
      return [{ key: 'a', text: `Struggle (${this.char!.heldBy ?? 'held'})` }];
    }
    if (this.phase === 'combat' && this.combat) {
      return [
        { key: 'a', text: 'Attack' },
        { key: 'b', text: 'Cast Spell' },
        { key: 'c', text: 'Pray' },
        { key: 'd', text: 'Run' },
        { key: 'e', text: 'Use Gem' },
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
                     '========================================'];
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
      `${c.name.padEnd(20)} Level ${c.level}`,
      `Dungeon Level ${c.dungeonLevel}   XP: ${c.xp}${xpForNext !== null ? ` / ${xpForNext}` : ' (MAX)'}`,
      `HP: ${c.hp} / ${c.maxHp}   Gold: ${c.gold}   Potions: ${c.inventory.potions}   Tomes: ${c.inventory.books}`,
      `Gems: Ruby ${c.inventory.gems.ruby}   Sapphire ${c.inventory.gems.sapphire}   Diamond ${c.inventory.gems.diamond}   Opal ${c.inventory.gems.opal}`,
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

    const rows: { name: string; type: string; qty: string }[] = [
      { name: 'Healing Potion', type: 'Consumable', qty: `x${c.inventory.potions}` },
      { name: 'Gold', type: 'Currency', qty: `${c.gold}` },
      { name: 'Magic Tome', type: 'Consumable — Arcane Tome', qty: `x${c.inventory.books}` },
      { name: 'Ruby', type: 'Gem — Teleport Away', qty: `x${c.inventory.gems.ruby}` },
      { name: 'Sapphire', type: 'Gem — Banish Monster', qty: `x${c.inventory.gems.sapphire}` },
      { name: 'Diamond', type: 'Gem — Reveal Map', qty: `x${c.inventory.gems.diamond}` },
      { name: 'Opal', type: 'Gem — Chiaroscuro Blast', qty: `x${c.inventory.gems.opal}` },
    ];
    const nameW = Math.max(...rows.map(r => r.name.length), 'ITEM'.length) + 2;
    const typeW = Math.max(...rows.map(r => r.type.length), 'TYPE'.length) + 2;

    const noGems = Object.values(c.inventory.gems).every(n => n === 0);
    this.messages = [
      `══ INVENTORY ═════════════════════════════`,
      `${'ITEM'.padEnd(nameW)}${'TYPE'.padEnd(typeW)}QTY`,
      `${'-'.repeat(nameW - 1)} ${'-'.repeat(typeW - 1)} ---`,
      ...rows.map(r => `${r.name.padEnd(nameW)}${r.type.padEnd(typeW)}${r.qty}`),
      ...(c.inventory.potions === 0 && c.inventory.books === 0 && noGems
        ? [``, `Your pack holds nothing but your coin purse.`]
        : []),
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
    return this.renderMap();
  }

  toggleMapView(): GameState {
    if (this.phase !== 'map') return this.getState();
    this.mapFull = !this.mapFull;
    return this.renderMap();
  }

  private renderMap(): GameState {
    if (!this.char || !this.dungeonState) return this.getState();

    const lvl = this.getLevel(this.char.dungeonLevel);
    if (!lvl) return this.getState();

    const level = this.char.dungeonLevel;
    const ds = this.dungeonState;
    const grid = lvl.grid;
    const isVisited = (x: number, y: number) => ds.visitedCells.has(visitedKey(level, x, y));

    let explored = 0;
    let exMinX = this.char.x, exMaxX = this.char.x, exMinY = this.char.y, exMaxY = this.char.y;
    for (const row of grid) {
      for (const cell of row) {
        if (isSolidRock(cell) || !isVisited(cell.x, cell.y)) continue;
        explored++;
        exMinX = Math.min(exMinX, cell.x); exMaxX = Math.max(exMaxX, cell.x);
        exMinY = Math.min(exMinY, cell.y); exMaxY = Math.max(exMaxY, cell.y);
      }
    }

    if (explored === 0) {
      this.phase = 'map';
      this.messages = [`══ MAP — Level ${this.char.dungeonLevel} ══`, '', '  No area explored yet.'];
      return this.getState();
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
        if (openCount >= 3)      row += '.';   // room interior / junction
        else if (!N && !S)       row += '|';   // N-S corridor
        else if (!E && !W)       row += '-';   // E-W corridor
        else                     row += '.';   // corner
      }
      rows.push(row);
    }

    const w = maxX - minX + 1;
    this.phase = 'map';
    this.messages = [
      `══ MAP — Dungeon Level ${this.char.dungeonLevel} (${explored} cells explored)${this.mapFull ? ' — FULL FLOOR' : ''} ══`,
      `  ${'─'.repeat(w)}`,
      ...rows.map(r => `  ${r}`),
      `  ${'─'.repeat(w)}`,
      '',
      `  @ You  . Room  |- Corridor  < Down  > Up  $ Chest  + Altar`,
    ];
    return this.getState();
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

  saveAndPrompt(): GameState {
    if (!this.char) return this.getState();
    this.repo.saveCharacter(this.char);
    if (this.dungeonState) this.repo.saveDungeonState(this.char.id, this.dungeonState);
    this.phase = 'save-prompt';
    this.messages = ['Game saved.', '', 'Continue playing, or exit to the main menu?'];
    return this.getState();
  }

  dismissSavePrompt(): GameState {
    if (!this.char) return this.getState();
    this.phase = 'playing';
    this.messages = [];
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
    const heal = this.rng.int(GAMEPLAY.POTION_HEAL_MIN, GAMEPLAY.POTION_HEAL_MAX)
      + Math.floor(this.char.constitution / GAMEPLAY.POTION_HEAL_CON_DIVISOR)
      + Math.floor(this.char.maxHp * GAMEPLAY.POTION_HEAL_MAX_HP_PCT);
    const actual = Math.min(heal, this.char.maxHp - this.char.hp);
    this.char.hp += actual;
    this.messages = [
      `You drink the healing potion and recover ${actual} HP.`,
      `(${this.char.inventory.potions} potions remaining)`,
    ];
    this.repo.saveCharacter(this.char);
    return this.getState();
  }

  /** Reads a tome's random boon and applies it — shared by reading one from
   * the pack (useBook) and reading one on the spot where it's found. */
  private applyTomeReading(): void {
    if (!this.char) return;
    const result = readBook(this.char, this.rng);
    this.messages = result.messages;
    if (result.mapRevealed) this.revealFullMap();
    if (result.xpGained) checkLevelUp(this.char, this.rng);
  }

  useBook(): GameState {
    if (!this.char) return this.getState();
    if (this.char.inventory.books <= 0) {
      this.messages = ['You have no magic tomes to read.'];
      return this.getState();
    }

    this.char.inventory.books--;
    this.applyTomeReading();

    this.repo.saveCharacter(this.char);
    if (this.dungeonState) this.repo.saveDungeonState(this.char.id, this.dungeonState);
    return this.getState();
  }

  wait(): GameState {
    if (!this.char || this.phase !== 'playing') return this.getState();

    this.restTicks++;
    this.messages = [];

    // Tick status effects
    const { messages: statusMsgs } = tickStatusEffects(this.char);
    this.messages = statusMsgs;

    // Passive regen while resting (faster than walking)
    if (this.restTicks % GAMEPLAY.REGEN_HP_EVERY_N_WAITS === 0 && this.char.hp < this.char.maxHp) {
      this.char.hp++;
      this.messages = [...this.messages, 'You rest. Your wounds slowly heal. (+1 HP)'];
    } else if (this.char.hp >= this.char.maxHp) {
      this.messages = [...this.messages, 'You rest. You are fully healed.'];
    } else {
      this.messages = [...this.messages, 'You wait in the darkness.'];
    }

    if (this.char.hp <= 0) {
      return this.handleDeath('Your wounds proved fatal as you rested.');
    }

    // Wandering monster risk after grace period
    if (this.restTicks > GAMEPLAY.WAIT_ENCOUNTER_GRACE && this.rng.float() < GAMEPLAY.WAIT_ENCOUNTER_CHANCE) {
      this.messages = [...this.messages, 'Something stirs in the darkness...'];
      this.repo.saveCharacter(this.char);
      return this.startRandomEncounter();
    }

    this.repo.saveCharacter(this.char);
    return this.getState();
  }

  // ─── Character creation ──────────────────────────────────────────────────

  startNameEntry(): GameState {
    this.phase = 'name-entry';
    this.messages = ['Enter your character name:'];
    return this.getState();
  }

  submitName(name: string): GameState {
    this.pendingName = name.trim().slice(0, 24) || 'Unknown';
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

  acceptCharacter(): GameState {
    if (!this.char || !this.pendingRoll || !this.pendingName) {
      return this.getState();
    }
    const id = `char-${Date.now()}-${this.rng.int(1000, 9999)}`;
    this.char.id = id;

    // Character must exist in DB before dungeon levels (foreign key constraint)
    this.repo.saveCharacter(this.char);

    // Generate all 7 dungeon levels
    for (let lvl = 1; lvl <= 7; lvl++) {
      const seed = this.rng.int(1, 0x7fffffff);
      const serialized = generateLevel(lvl, seed);
      this.repo.saveLevel(id, lvl, serialized);

      // Cache level 1
      if (lvl === 1) {
        const { grid, entrance, exit, contents } = deserializeLevel(serialized);
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
    this.messages = getLevelIntro(1);
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
    this.dungeonState.visitedCells.add(visitedKey(char.dungeonLevel, char.x, char.y));

    this.loadLevelIntoCache(char.dungeonLevel);

    this.rng = new RNG(RNG.globalSeed());
    this.pace = initialPace(this.rng);
    this.pace.atLevelEntry = true;

    this.sessionStart = Date.now();
    this.phase = 'playing';
    this.messages = [`Welcome back, ${char.name}.`, `You are on Dungeon Level ${char.dungeonLevel}.`];
    return this.getState();
  }

  // ─── Movement ────────────────────────────────────────────────────────────

  moveForward(): GameState {
    return this.tryMove(this.char?.facing ?? 'N', 'forward');
  }

  moveBackward(): GameState {
    const opposite: Record<Direction, Direction> = { N: 'S', S: 'N', E: 'W', W: 'E' };
    return this.tryMove(opposite[this.char?.facing ?? 'N'], 'backward');
  }

  turnLeft(): GameState {
    if (!this.char || this.phase !== 'playing') return this.getState();
    const map: Record<Direction, Direction> = { N: 'W', W: 'S', S: 'E', E: 'N' };
    this.char.facing = map[this.char.facing];
    this.messages = [];
    this.repo.saveCharacter(this.char);
    return this.getState();
  }

  turnRight(): GameState {
    if (!this.char || this.phase !== 'playing') return this.getState();
    const map: Record<Direction, Direction> = { N: 'E', E: 'S', S: 'W', W: 'N' };
    this.char.facing = map[this.char.facing];
    this.messages = [];
    this.repo.saveCharacter(this.char);
    return this.getState();
  }

  private tryMove(dir: Direction, _label: string): GameState {
    if (!this.char || this.phase !== 'playing') return this.getState();

    const lvl = this.getLevel(this.char.dungeonLevel);
    if (!lvl) return this.getState();

    if (!canMove(lvl.grid, this.char.x, this.char.y, dir)) {
      this.messages = ['A stone wall blocks your path.'];
      return this.getState();
    }

    // Move
    const dx = dir === 'E' ? 1 : dir === 'W' ? -1 : 0;
    const dy = dir === 'S' ? 1 : dir === 'N' ? -1 : 0;
    this.char.x += dx;
    this.char.y += dy;
    this.char.stepsTaken++;
    this.restTicks = 0;

    // Tick status effects
    const { messages: statusMsgs, damageTaken } = tickStatusEffects(this.char);
    this.messages = statusMsgs;

    // Passive HP regeneration
    if (this.char.stepsTaken % GAMEPLAY.REGEN_HP_EVERY_N_STEPS === 0 && this.char.hp < this.char.maxHp) {
      this.char.hp++;
      this.messages = [...this.messages, 'Your wounds slowly knit. (+1 HP)'];
    }

    if (this.char.hp <= 0) {
      return this.handleDeath('Your wounds proved fatal as you walked.');
    }

    incrementPace(this.pace);
    this.dungeonState!.visitedCells.add(visitedKey(this.char.dungeonLevel, this.char.x, this.char.y));

    // Check cell content
    const cellKey = `${this.char.x},${this.char.y}`;
    const content = lvl.contents.get(cellKey);

    const contentState = this.handleCellContent(content, cellKey);
    if (contentState) {
      this.repo.saveCharacter(this.char);
      this.repo.saveDungeonState(this.char.id, this.dungeonState!);
      return contentState;
    }

    // Check random encounter
    if (shouldTriggerRandomEncounter(this.pace, this.rng)) {
      this.repo.saveCharacter(this.char);
      return this.startRandomEncounter();
    }

    this.repo.saveCharacter(this.char);
    this.repo.saveDungeonState(this.char.id, this.dungeonState!);
    return this.getState();
  }

  private handleCellContent(content: CellContent | undefined, cellKey: string): GameState | null {
    if (!content || !this.char || !this.dungeonState) return null;

    const ds = this.dungeonState;
    const lvl = this.getLevel(this.char.dungeonLevel)!;

    switch (content.type) {
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
          choices: [{ key: 'a', text: 'Open it' }, { key: 'b', text: 'Leave it' }],
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
          ds.triggeredTraps.add(content.id);
          this.messages = [...this.messages, '', ...result.messages];

          if (result.teleported) {
            this.teleportPlayer();
          }
          if (result.triggerMonster) {
            this.repo.saveCharacter(this.char);
            return this.startRandomEncounter();
          }
          if (this.char.hp <= 0) {
            return this.handleDeath(this.trapDeathCause(variant));
          }
          this.repo.saveCharacter(this.char);
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
        const monsterId = content.monsterId ?? 'Asmodeus';
        if (ds.defeatedUniqueMonsters.has(content.id)) return null;
        return this.startFixedEncounter(content, monsterId as Parameters<typeof getDefinition>[0]);
      }

      default:
        return null;
    }
  }

  // ─── Level transitions ───────────────────────────────────────────────────

  climbUp(): GameState {
    if (!this.char || this.phase !== 'playing') return this.getState();
    const lvl = this.getLevel(this.char.dungeonLevel);
    if (!lvl) return this.getState();

    const content = lvl.contents.get(`${this.char.x},${this.char.y}`);
    if (content?.type !== 'ladder-up' || this.char.dungeonLevel <= 1) {
      this.messages = ['There is no ladder leading up here.'];
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

    const content = lvl.contents.get(`${this.char.x},${this.char.y}`);
    if (content?.type !== 'ladder-down' || this.char.dungeonLevel >= 7) {
      this.messages = ['There is no ladder leading down here.'];
      return this.getState();
    }

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

    this.dungeonState!.visitedCells.add(visitedKey(this.char.dungeonLevel, this.char.x, this.char.y));

    this.repo.saveCharacter(this.char);
    this.repo.saveDungeonState(this.char.id, this.dungeonState!);

    if (!this.char.introsSeen.includes(lvlNum)) {
      this.char.introsSeen.push(lvlNum);
      this.repo.saveCharacter(this.char);
      this.phase = 'level-intro';
      this.messages = getLevelIntro(lvlNum);
      return this.getState();
    }

    this.phase = 'playing';
    this.messages = [`Level ${lvlNum}.`];
    return this.getState();
  }

  dismissLevelIntro(): GameState {
    if (!this.char) return this.getState();
    this.phase = 'playing';
    this.messages = [];
    return this.getState();
  }

  // ─── Combat ──────────────────────────────────────────────────────────────

  private startFixedEncounter(content: CellContent, monsterType: import('./types.js').MonsterType): GameState {
    if (!this.char) return this.getState();
    const def = getDefinition(monsterType);
    // Unique bosses roll a level in their own [minLevel, maxLevel] range each
    // encounter. For every boss except Asmodeus that range is a single fixed
    // value (min === max), so this is a no-op for them — Asmodeus is the only
    // one with real spread (40-100). Ordinary fixed monsters use the same
    // dungeon-depth/character-level scaled range as random encounters.
    const lvl = content.type === 'unique-monster'
      ? this.rng.int(def.minLevel, def.maxLevel)
      : randomMonsterLevel(this.char.level, this.char.dungeonLevel, this.rng);

    const monster = createMonster(monsterType, lvl, content.id);
    return this.beginCombat(monster);
  }

  private startRandomEncounter(): GameState {
    if (!this.char) return this.getState();

    const type = pickRandomMonsterType(this.char.dungeonLevel, this.rng);
    const def = getDefinition(type);
    const lvl = randomMonsterLevel(this.char.level, this.char.dungeonLevel, this.rng);
    const clampedLvl = Math.max(def.minLevel, Math.min(def.maxLevel, Math.max(1, lvl)));

    const monsterId = `rand-${Date.now()}-${this.rng.int(100, 999)}`;
    const monster = createMonster(type, clampedLvl, monsterId);
    return this.beginCombat(monster);
  }

  private beginCombat(monster: Monster): GameState {
    if (!this.char) return this.getState();

    this.combat = {
      monster,
      round: 1,
      nakedActive: false,
      preCombatX: this.char.x,
      preCombatY: this.char.y,
    };
    this.phase = 'combat';

    // Intro text
    const intro = monster.definition.encounterIntro.map(line =>
      line.replace('{LVL}', String(monster.level))
    );
    this.messages = intro;
    return this.getState();
  }

  combatAction(action: string): GameState {
    if (!this.char || !this.combat || this.phase !== 'combat') return this.getState();
    if (this.isHeld()) return this.combatHeld();

    switch (action) {
      case 'a': return this.combatAttack();
      case 'b': return this.showSpellMenu();
      case 'c': return this.combatPray();
      case 'd': return this.combatRun();
      case 'e': return this.showGemMenu();
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
    const types: Record<string, GemType> = { a: 'ruby', b: 'sapphire', c: 'diamond', d: 'opal' };
    const type = types[key];
    if (type && this.isHeld()) return this.combatHeld();
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
      { key: 'e', text: 'Cancel' },
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
    if (this.char.intelligence < GEMS.MAGIC_INT_THRESHOLD) {
      this.messages = [
        `The ${type} sits inert in your palm.`,
        `You lack the arcane aptitude to attune to it. (Requires INT ${GEMS.MAGIC_INT_THRESHOLD}+)`,
      ];
      return this.getState();
    }

    if (this.combat) {
      const negated = beholderAntimagic(this.char, this.combat.monster, this.rng, 'gem');
      if (negated) return this.processCombatResult(negated);
    }

    switch (type) {
      case 'ruby':     return this.useRuby();
      case 'sapphire': return this.useSapphire();
      case 'diamond':  return this.useDiamond();
      case 'opal':     return this.useOpal();
    }
  }

  private useRuby(): GameState {
    this.char!.inventory.gems.ruby--;
    this.messages = ['The ruby flares crimson — the corridor dissolves around you!'];
    this.teleportPlayer();
    this.endCombat(false);
    this.messages.push('You find yourself somewhere else in the dungeon.');
    this.repo.saveCharacter(this.char!);
    this.repo.saveDungeonState(this.char!.id, this.dungeonState!);
    return this.getState();
  }

  private useSapphire(): GameState {
    this.char!.inventory.gems.sapphire--;
    const monster = this.combat!.monster;
    this.messages = [
      `The sapphire pulses with cold blue light — the ${monster.type} vanishes without a trace!`,
      'You are free to move on.',
    ];
    this.endCombat(false);
    this.repo.saveCharacter(this.char!);
    return this.getState();
  }

  /** Marks every cell of the current level visited. Returns false (and does
   * nothing) if there's no character/level to reveal for. */
  private revealFullMap(): boolean {
    if (!this.char || !this.dungeonState) return false;
    const lvl = this.getLevel(this.char.dungeonLevel);
    if (!lvl) return false;

    for (const row of lvl.grid) {
      for (const cell of row) {
        if (isSolidRock(cell)) continue;
        this.dungeonState.visitedCells.add(visitedKey(this.char.dungeonLevel, cell.x, cell.y));
      }
    }
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
    this.repo.saveCharacter(this.char);
    this.repo.saveDungeonState(this.char.id, this.dungeonState);
    return this.getState();
  }

  private useOpal(): GameState {
    this.char!.inventory.gems.opal--;
    const result = playerOpal(this.char!, this.combat!.monster, this.rng);
    return this.processCombatResult(result);
  }

  spellAction(spell: string): GameState {
    if (!this.char || !this.combat || this.phase !== 'combat') return this.getState();
    if (['a', 'b', 'c', 'd', 'e', 'f'].includes(spell)) {
      if (this.isHeld()) return this.combatHeld();
      const negated = beholderAntimagic(this.char, this.combat.monster, this.rng, 'spell');
      if (negated) return this.processCombatResult(negated);
    }
    if (spell === 'a') return this.combatFireball();
    if (spell === 'b') return this.combatHeal();
    if (spell === 'c') return this.combatAcid();
    if (spell === 'd') return this.combatLightning();
    if (spell === 'e') return this.combatFrost();
    if (spell === 'f') return this.combatPoison();
    // Cancel — back to combat
    this.phase = 'combat';
    this.messages = ['You reconsider.'];
    return this.getState();
  }

  private showSpellMenu(): GameState {
    this.messages = ['Choose a spell:'];
    const spellState = this.getState();
    spellState.choices = [
      { key: 'a', text: 'Fireball' },
      { key: 'b', text: 'Heal' },
      { key: 'c', text: 'Acid Spray' },
      { key: 'd', text: 'Lightning' },
      { key: 'e', text: 'Frost Bolt' },
      { key: 'f', text: 'Poison Spray' },
      { key: 'g', text: 'Cancel' },
    ];
    spellState.phase = 'combat'; // stay in combat phase but with spell choices
    return spellState;
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
    const result = playerAttack(this.char!, this.combat!.monster, this.rng);
    return this.processCombatResult(result);
  }

  private combatFireball(): GameState {
    const result = playerFireball(this.char!, this.combat!.monster, this.rng);
    return this.processCombatResult(result);
  }

  private combatAcid(): GameState {
    const result = playerAcid(this.char!, this.combat!.monster, this.rng);
    return this.processCombatResult(result);
  }

  private combatLightning(): GameState {
    const result = playerLightning(this.char!, this.combat!.monster, this.rng);
    return this.processCombatResult(result);
  }

  private combatFrost(): GameState {
    const result = playerFrost(this.char!, this.combat!.monster, this.rng);
    return this.processCombatResult(result);
  }

  private combatPoison(): GameState {
    const result = playerPoison(this.char!, this.combat!.monster, this.rng);
    return this.processCombatResult(result);
  }

  private combatHeal(): GameState {
    const result = playerHeal(this.char!, this.combat!.monster, this.rng);
    return this.processCombatResult(result);
  }

  private combatPray(): GameState {
    const result = playerPray(this.char!, this.combat!.monster, this.rng);
    return this.processCombatResult(result);
  }

  private combatRun(): GameState {
    const monster = this.combat!.monster;
    const result = playerRun(this.char!, monster, this.rng);
    this.messages = result.messages;

    if (result.playerDied) {
      return this.handleDeath(`Killed by a Level ${monster.level} ${monster.type} as you tried to flee.`);
    }

    if (result.ran) {
      // Return to pre-combat position
      this.char!.x = this.combat!.preCombatX;
      this.char!.y = this.combat!.preCombatY;
      this.endCombat(false);
      this.repo.saveCharacter(this.char!);
      return this.getState();
    }

    this.repo.saveCharacter(this.char!);
    return this.getState();
  }

  private processCombatResult(result: import('./combat.js').CombatRoundResult): GameState {
    if (!this.char || !this.combat) return this.getState();

    this.messages = result.messages;
    this.combat.round++;

    if (result.playerTeleported) {
      this.teleportPlayer();
      this.endCombat(false);
      this.messages.push('', 'You recognize this corridor.');
      this.repo.saveCharacter(this.char);
      return this.getState();
    }

    if (result.playerDied) {
      const monster = this.combat!.monster;
      return this.handleDeath(`Killed by a Level ${monster.level} ${monster.type}.`);
    }

    if (result.monsterDied) {
      return this.handleMonsterDefeated();
    }

    this.repo.saveCharacter(this.char);
    return this.getState();
  }

  private handleMonsterDefeated(): GameState {
    if (!this.char || !this.combat || !this.dungeonState) return this.getState();

    const monster = this.combat.monster;
    const def = monster.definition;
    const xpGained = calculateXPReward(this.char.level, monster.level, def.isUnique, def.naturalTier);

    this.char.xp += xpGained;
    this.char.monstersDefeated++;

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
      : 0;
    if (goldDrop > 0) {
      this.char.gold += goldDrop;
      this.messages.push(`You find ${goldDrop} gold.`);
    }

    this.messages.push('', `You gain ${xpGained} experience.`);

    // Level up
    const levelResult = checkLevelUp(this.char, this.rng);
    if (levelResult.didLevel) {
      this.messages.push('', `*** YOU HAVE REACHED LEVEL ${levelResult.newLevel}! ***`);
      this.messages.push(`Maximum HP increased by ${levelResult.hpGain}.`);
      if (levelResult.statGained) {
        this.messages.push(`Your ${levelResult.statGained} increases!`);
      }
    }

    // Clear naked status
    this.char.statusEffects = this.char.statusEffects.filter(e => e.type !== 'naked');

    // Victory?
    if (monster.type === 'Asmodeus') {
      this.char.asmodeusDefeated = true;
      return this.handleVictory();
    }

    this.endCombat(true);
    this.repo.saveCharacter(this.char);
    this.repo.saveDungeonState(this.char.id, this.dungeonState);
    return this.getState();
  }

  private handleDeath(cause: string): GameState {
    if (!this.char) return this.getState();

    const lvl = this.getLevel(this.char.dungeonLevel);
    const entrance = lvl?.entrance ?? { x: 0, y: 0 };

    const result = applyDeath(this.char, entrance.x, entrance.y);
    // result.messages leads with 'YOU HAVE DIED.' — renderers already show
    // that as a banner, so skip it (and the blank line after it) here.
    this.messages = [cause, '', ...result.messages.slice(2)];

    this.endCombat(false);
    this.phase = 'death';
    this.pace.atDeathRespawn = true;
    this.pace.movesSinceCombat = 0;

    this.repo.saveCharacter(this.char);
    this.repo.saveDungeonState(this.char.id, this.dungeonState!);
    return this.getState();
  }

  dismissDeath(): GameState {
    this.phase = 'playing';
    this.messages = [];
    return this.getState();
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

    const playSeconds = Math.round((Date.now() - this.sessionStart) / 1000) + this.char.playTime;
    this.char.playTime = playSeconds;

    this.repo.saveCharacter(this.char);

    const score = calculateScore(this.char, playSeconds);
    const scoreLines = formatScore(score);

    this.phase = 'victory';
    this.messages = [
      'Asmodeus gives one final howl and collapses',
      'into a heap of smoking ash.',
      '',
      'ASMODEUS MET A BITTER END.',
      '',
      'The Seven Levels have been conquered.',
      '',
      ...scoreLines,
    ];

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
      default:
        return this.closeInteraction();
    }
  }

  private resolveChestChoice(key: string, id: string): GameState {
    if (!this.char || !this.dungeonState) return this.getState();

    if (key !== 'a') {
      return this.closeInteraction('You leave the chest alone.');
    }

    this.dungeonState.openedChests.add(id);
    const result = resolveChest(this.char, this.rng);
    this.messages = result.messages;

    if (result.triggerMonster) {
      this.closeInteraction();
      this.repo.saveCharacter(this.char);
      this.repo.saveDungeonState(this.char.id, this.dungeonState);
      return this.startRandomEncounter();
    }

    if (result.xpGained) {
      const lvlResult = checkLevelUp(this.char, this.rng);
      if (lvlResult.didLevel) {
        this.messages.push(`*** LEVEL UP! You are now level ${lvlResult.newLevel}! ***`);
      }
    }

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
    this.messages = result.messages;

    if (result.xpGained) checkLevelUp(this.char, this.rng);

    return this.closeInteractionWithSave();
  }

  private resolveFountainChoice(key: string, id: string): GameState {
    if (!this.char || !this.dungeonState) return this.getState();

    if (key !== 'a') {
      return this.closeInteraction('You leave the fountain untouched.');
    }

    this.dungeonState.usedFountains.add(id);
    const result = resolveFountain(this.char, this.rng);
    this.messages = result.messages;

    if (result.xpGained) checkLevelUp(this.char, this.rng);

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
    if (key === 'a') {
      result = resolveTrapAvoid(this.char, variant, this.rng);
    } else {
      result = resolveTrapDisarm(this.char, variant, this.rng);
      if (result.resolved && !result.damageDealt && !result.statusAdded) {
        this.dungeonState.disarmedTraps.add(id);
      }
    }

    if (result.resolved) this.dungeonState.triggeredTraps.add(id);

    this.messages = result.messages;

    if (result.teleported) {
      this.teleportPlayer();
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

  private closeInteractionWithSave(): GameState {
    this.interaction = null;
    this.phase = 'playing';
    this.repo.saveCharacter(this.char!);
    this.repo.saveDungeonState(this.char!.id, this.dungeonState!);
    return this.getState();
  }

  // ─── Teleport ────────────────────────────────────────────────────────────

  private teleportPlayer(): void {
    if (!this.char || !this.dungeonState) return;
    const lvl = this.getLevel(this.char.dungeonLevel);
    if (!lvl) return;

    const ds = this.dungeonState;
    const level = this.char.dungeonLevel;
    const visited = lvl.grid.flat()
      .filter(cell => !isSolidRock(cell) && ds.visitedCells.has(visitedKey(level, cell.x, cell.y)))
      .map(cell => ({ x: cell.x, y: cell.y }))
      .filter(pos => {
        if (pos.x === this.char!.x && pos.y === this.char!.y) return false;
        const content = lvl.contents.get(`${pos.x},${pos.y}`);
        if (!content) return true;
        if (content.type === 'unique-monster' || content.type === 'fixed-monster') {
          const id = content.id;
          if (content.type === 'fixed-monster' && ds.defeatedFixedMonsters.has(id)) return true;
          if (content.type === 'unique-monster' && ds.defeatedUniqueMonsters.has(id)) return true;
          return false;
        }
        return true;
      });

    if (visited.length === 0) return;

    const dest = this.rng.pick(visited);
    this.char.x = dest.x;
    this.char.y = dest.y;
    this.char.facing = this.rng.pick(['N', 'E', 'S', 'W'] as Direction[]);
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
    this.levelCache.set(levelNum, { grid, entrance, exit, contents });
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
