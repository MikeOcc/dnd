import { RNG } from './random.js';
import type {
  Character, Monster, GameState, GamePhase, CombatState, InteractionState,
  Direction, SerializedDungeon, DungeonCell, CellContent, DungeonState,
  CharacterRoll, CharacterSummary, ScoreResult, Choice, StatusEffect,
} from './types.js';
import { rollCharacter, createCharacter, checkLevelUp, tickStatusEffects, formatRoll, addStatusEffect, xpForLevel } from './character.js';
import { generateLevel, deserializeLevel, canMove, floodFill } from './dungeon.js';
import { computeFOV } from './field-of-view.js';
import { playerAttack, playerFireball, playerHeal, playerPray, playerRun, calculateXPReward } from './combat.js';
import {
  initialPace, incrementPace, shouldTriggerRandomEncounter, resetPaceAfterCombat, EncounterPace,
  applyDeath, resolveChest, resolveBook, resolveAltar, resolveFountain,
  resolveTrapTriggered, resolveTrapAvoid, resolveTrapDisarm,
} from './encounters.js';
import { createMonster, pickRandomMonsterType, randomMonsterLevel, getDefinition } from './monsters.js';
import { calculateScore, formatScore } from './scoring.js';
import { CHARACTER } from './config.js';
import { getLevelIntro } from '../content/level-text.js';
import { getDescription, getDescriptionShort } from '../content/descriptions.js';
import type { Repository } from '../database/repositories.js';

// ─── In-memory session state ─────────────────────────────────────────────────

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
  private pendingRoll: CharacterRoll | null = null;
  private pendingName: string | null = null;
  private pace: EncounterPace;
  private rng: RNG;
  private sessionStart: number = Date.now();

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
        // Find special symbol in view (ladder, unique boss)
        const content = lvl.contents.get(`${this.char.x},${this.char.y}`);
        state.view = this.renderView(content);
      }
    }

    if (this.combat) state.combat = { ...this.combat };
    if (this.interaction) state.interaction = { ...this.interaction };
    if (this.pendingRoll) state.currentRoll = this.pendingRoll;

    state.choices = this.buildChoices();
    return state;
  }

  private renderView(currentContent?: CellContent): string[] {
    if (!this.char) return [];
    const lvl = this.getLevel(this.char.dungeonLevel);
    if (!lvl) return [];

    let special: { dr: number; dc: number; symbol: string } | undefined;
    if (currentContent?.type === 'ladder-up' || currentContent?.type === 'ladder-down') {
      special = { dr: 2, dc: 2, symbol: currentContent.type === 'ladder-up' ? '>' : '<' };
    }

    const fov = computeFOV(lvl.grid, this.char.x, this.char.y, this.char.facing, special);
    return fov.grid;
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
    if (this.phase === 'combat' && this.combat) {
      return [
        { key: 'a', text: 'Attack' },
        { key: 'b', text: 'Cast Spell' },
        { key: 'c', text: 'Pray' },
        { key: 'd', text: 'Run' },
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
      `HP: ${c.hp} / ${c.maxHp}   Gold: ${c.gold}`,
      ``,
      `STR ${String(c.strength).padStart(2)}   CON ${String(c.constitution).padStart(2)}   INT ${String(c.intelligence).padStart(2)}`,
      `WIS ${String(c.wisdom).padStart(2)}   DEX ${String(c.dexterity).padStart(2)}   CHA ${String(c.charisma).padStart(2)}`,
      `RES ${String(c.resistance).padStart(2)}`,
      ``,
      `Deaths: ${c.deathCount}   Steps: ${c.stepsTaken}   Monsters: ${c.monstersDefeated}`,
      ...(c.asmodeusDefeated ? [`*** ASMODEUS DEFEATED ***`] : []),
      ...(c.statusEffects.length > 0
        ? [``, `Active effects:`, ...c.statusEffects.map(e => `  ${e.type} (${e.turns} turns)`)]
        : []),
    ];
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

    // Tick status effects
    const { messages: statusMsgs, damageTaken } = tickStatusEffects(this.char);
    this.messages = statusMsgs;

    if (this.char.hp <= 0) {
      return this.handleDeath();
    }

    incrementPace(this.pace);
    this.dungeonState!.visitedCells.add(`${this.char.x},${this.char.y}`);

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
          choices: [{ key: 'a', text: 'Read the book' }, { key: 'b', text: 'Leave it alone' }],
        };
        this.phase = 'interaction';
        this.messages = [
          'You find an ancient book resting on a stone pedestal.',
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
            return this.handleDeath();
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

    this.dungeonState!.visitedCells.add(`${this.char.x},${this.char.y}`);

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
    const lvl = content.type === 'unique-monster'
      ? def.minLevel
      : Math.max(def.minLevel, Math.min(def.maxLevel,
          this.char.level + (this.char.dungeonLevel - 1) + this.rng.int(-2, 2)));

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

    switch (action) {
      case 'a': return this.combatAttack();
      case 'b': return this.showSpellMenu();
      case 'c': return this.combatPray();
      case 'd': return this.combatRun();
      default:  return this.getState();
    }
  }

  spellAction(spell: string): GameState {
    if (!this.char || !this.combat || this.phase !== 'combat') return this.getState();
    if (spell === 'a') return this.combatFireball();
    if (spell === 'b') return this.combatHeal();
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
      { key: 'c', text: 'Cancel' },
    ];
    spellState.phase = 'combat'; // stay in combat phase but with spell choices
    return spellState;
  }

  private combatAttack(): GameState {
    const result = playerAttack(this.char!, this.combat!.monster, this.rng);
    return this.processCombatResult(result);
  }

  private combatFireball(): GameState {
    const result = playerFireball(this.char!, this.combat!.monster, this.rng);
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
    const result = playerRun(this.char!, this.combat!.monster, this.rng);
    this.messages = result.messages;

    if (result.playerDied) return this.handleDeath();

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
      return this.handleDeath();
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
    const xpGained = calculateXPReward(this.char.level, monster.level, def.isUnique);

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

    // Gold from monster
    const goldDrop = this.rng.float() < 0.4
      ? this.rng.int(1, 15) * monster.level
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

  private handleDeath(): GameState {
    if (!this.char) return this.getState();

    const lvl = this.getLevel(this.char.dungeonLevel);
    const entrance = lvl?.entrance ?? { x: 0, y: 0 };

    const result = applyDeath(this.char, entrance.x, entrance.y);
    this.messages = result.messages;

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
    // Remove naked status after combat ends
    if (this.char) {
      this.char.statusEffects = this.char.statusEffects.filter(e => e.type !== 'naked');
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

    if (key !== 'a') {
      return this.closeInteraction('You leave the book on its pedestal.');
    }

    this.dungeonState.readBooks.add(id);
    const result = resolveBook(this.char, this.rng);
    this.messages = result.messages;

    if (result.triggerEvent) {
      this.closeInteraction();
      this.repo.saveCharacter(this.char);
      this.repo.saveDungeonState(this.char.id, this.dungeonState);
      return this.startRandomEncounter();
    }

    if (result.xpGained) {
      checkLevelUp(this.char, this.rng);
    }

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
      return this.handleDeath();
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
    const visited = [...ds.visitedCells]
      .map(k => { const [x, y] = k.split(',').map(Number); return { x, y }; })
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
