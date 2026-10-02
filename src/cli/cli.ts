import { getDb, initDb } from '../database/database.js';
import { Repository } from '../database/repositories.js';
import { GameEngine } from '../core/game-engine.js';
import { renderState } from './terminal-renderer.js';
import { Keyboard, type KeyEvent } from './keyboard.js';
import { INTRO_SCREEN } from '../content/intro-text.js';
import type { GameState, CharacterSummary } from '../core/types.js';
import * as readline from 'readline';

// ─── Setup ───────────────────────────────────────────────────────────────────

const db = getDb();
initDb(db);
const repo = new Repository(db);
const engine = new GameEngine(repo);
const keyboard = new Keyboard();

let currentState: GameState = { phase: 'title', messages: [] };
let nameBuffer = '';
let awaitingNameInput = false;
let spellMenuOpen = false;
let gemMenuOpen = false;
let restTimer: ReturnType<typeof setTimeout> | null = null;
let saveListMode = false;
let deleteMode = false;
let saveSlots: CharacterSummary[] = [];
let deleteConfirmTarget: CharacterSummary | null = null;

function render(state: GameState): void {
  const prev = currentState;
  currentState = state;

  // Resting runs in real time: one tick a second until it ends.
  if (restTimer) { clearTimeout(restTimer); restTimer = null; }
  if (state.phase === 'resting') {
    restTimer = setTimeout(() => {
      restTimer = null;
      if (currentState.phase === 'resting') render(engine.restTick());
    }, 1000);
  }

  // Hurt? Flash the status line inverse red for a moment, then redraw it
  // normally. Big hits (a quarter of max HP or more) ring the terminal bell
  // if SEVEN_LEVELS_BELL=1.
  const pc = prev.character;
  const nc = state.character;
  const lost = pc && nc && pc.id === nc.id && state.phase !== 'death' && prev.phase !== 'death' ? pc.hp - nc.hp : 0;
  if (lost > 0) {
    if (process.env.SEVEN_LEVELS_BELL === '1' && lost >= nc!.maxHp * 0.25) process.stdout.write('\x07');
    process.stdout.write(renderState(state, { hurt: true }) + '\n');
    setTimeout(() => {
      if (currentState === state) process.stdout.write(renderState(state) + '\n');
    }, 220);
    return;
  }

  process.stdout.write(renderState(state));
  process.stdout.write('\n');
}

function exit(): void {
  keyboard.stop();
  process.stdout.write('\x1b[2J\x1b[H\x1b[0m');
  process.stdout.write('Goodbye.\n');
  process.exit(0);
}

// ─── Key handler ─────────────────────────────────────────────────────────────

function handleKey(key: KeyEvent): void {
  if (key.type === 'ctrl' && (key.char === 'c' || key.char === 'd')) {
    exit();
    return;
  }

  const phase = currentState.phase;

  // Resting: any key stops
  if (phase === 'resting') {
    render(engine.stopResting());
    return;
  }

  // Title screen
  if (phase === 'title') {
    render(engine.showMainMenu());
    return;
  }

  // Main menu
  if (phase === 'main-menu') {
    if (deleteConfirmTarget) {
      handleDeleteConfirmKey(key);
      return;
    }

    if (saveListMode) {
      handleSaveListKey(key);
      return;
    }

    if (key.type === 'char') {
      if (key.char === 'n') {
        saveListMode = false;
        render(engine.startNameEntry());
        awaitingNameInput = true;
        return;
      }
      if (key.char === 'c') {
        saveSlots = engine.listSaves();
        if (saveSlots.length === 0) {
          renderWithMessage('No saved characters found.');
          return;
        }
        saveListMode = true;
        renderSaveList('continue');
        return;
      }
      if (key.char === 'd') {
        saveSlots = engine.listSaves();
        if (saveSlots.length === 0) {
          renderWithMessage('No saved characters found.');
          return;
        }
        saveListMode = true;
        deleteMode = true;
        renderSaveList('delete');
        return;
      }
    }
    return;
  }

  // Name entry
  if (phase === 'name-entry' && awaitingNameInput) {
    if (key.type === 'char') {
      nameBuffer += key.char;
      showNamePrompt();
      return;
    }
    if (key.type === 'backspace') {
      nameBuffer = nameBuffer.slice(0, -1);
      showNamePrompt();
      return;
    }
    if (key.type === 'enter') {
      if (nameBuffer.trim().length === 0) return;
      awaitingNameInput = false;
      const state = engine.submitName(nameBuffer.trim());
      nameBuffer = '';
      render(state);
      return;
    }
    return;
  }

  // Character roll
  if (phase === 'char-roll') {
    if (key.type === 'char') {
      if (key.char === 'a') {
        render(engine.acceptCharacter('wizard'));
        return;
      }
      if (key.char === 'b') {
        render(engine.acceptCharacter('warrior'));
        return;
      }
      if (key.char === 'c') {
        render(engine.rerollCharacter());
        return;
      }
    }
    return;
  }

  // Level intro
  if (phase === 'level-intro') {
    render(engine.dismissLevelIntro());
    return;
  }

  // A great lair's warning — Turn Back, Step Forward or Charge
  if (phase === 'lair-warning') {
    if (key.type === 'char' && ['a', 'b', 'c', 'd'].includes(key.char)) render(engine.lairChoice(key.char));
    return;
  }

  // Death screen — Revive, Restore or Quit
  if (phase === 'death') {
    if (key.type === 'char') {
      if (key.char === 'a') render(engine.reviveAfterDeath());
      if (key.char === 'c') render(engine.dismissDeath());
      if (key.char === 'q') render(engine.showMainMenu());
    }
    return;
  }

  // Victory
  if (phase === 'victory') {
    render(engine.showMainMenu());
    return;
  }

  // Status screen
  if (phase === 'status') {
    render(engine.dismissStatus());
    return;
  }

  // Inventory screen
  if (phase === 'inventory') {
    render(engine.dismissInventory());
    return;
  }

  // Map screen
  if (phase === 'map') {
    if (key.type === 'arrow') {
      const moves = { up: 'forward', down: 'backward', left: 'left', right: 'right' } as const;
      render(engine.mapMove(moves[key.dir as keyof typeof moves]));
    } else if (key.type === 'char' && key.char === 'f') render(engine.toggleMapView());
    else if (key.type === 'char' && key.char === 'x') render(engine.toggleMapReveal());
    else render(engine.dismissMap());
    return;
  }

  // Interaction menu
  if (phase === 'interaction') {
    if (key.type === 'char') {
      render(engine.interactionChoice(key.char));
    }
    return;
  }

  // Combat
  if (phase === 'combat') {
    if (spellMenuOpen) {
      if (key.type === 'char') {
        spellMenuOpen = false;
        render(engine.spellAction(key.char));
      }
      return;
    }

    if (gemMenuOpen) {
      if (key.type === 'char') {
        gemMenuOpen = false;
        render(engine.gemAction(key.char));
      }
      return;
    }

    if (key.type === 'char') {
      if (key.char === 'b') {
        // Show spell submenu
        spellMenuOpen = true;
        const state = engine.getState();
        state.choices = state.spellChoices ?? [];  // only spells this character has learned
        state.messages = ['Choose a spell:'];
        render(state);
        return;
      }
      if (key.char === 'e') {
        // Show gem submenu
        gemMenuOpen = true;
        const state = engine.getState();
        state.choices = [
          { key: 'a', text: 'Ruby — Teleport Away' },
          { key: 'b', text: 'Sapphire — Banish Monster' },
          { key: 'c', text: 'Diamond — Reveal Map' },
          { key: 'd', text: 'Opal — Chiaroscuro Blast' },
          { key: 'e', text: 'Emerald — Warding' },
          { key: 'f', text: 'Cancel' },
        ];
        state.messages = ['Choose a gem:'];
        render(state);
        return;
      }
      render(engine.combatAction(key.char));
      return;
    }
    return;
  }

  // Playing
  if (phase === 'playing') {
    if (key.type === 'arrow') {
      if (key.dir === 'up')    render(engine.moveForward());
      if (key.dir === 'down')  render(engine.moveBackward());
      if (key.dir === 'left')  render(engine.turnLeft());
      if (key.dir === 'right') render(engine.turnRight());
      return;
    }
    if (key.type === 'char') {
      if (key.char === 'u') render(engine.climbUp());
      if (key.char === 'd') render(engine.climbDown());
      if (key.char === 'p') render(engine.usePot());
      if (key.char === 'b') render(engine.useBook());
      if (key.char === 'g') render(engine.useDiamondExploring());
      if (key.char === 'e') render(engine.useEmeraldExploring());
      if (key.char === 'w') render(engine.startResting());
      if (key.char === 'm') render(engine.showMap());
      if (key.char === 't') render(engine.showStatus());
      if (key.char === 'i') render(engine.showInventory());
      if (key.char === 'r') render(engine.restoreFromSave());
      if (key.char === 's') render(engine.saveGame());
      if (key.char === 'q') exit();
      return;
    }
    return;
  }
}

function handleSaveListKey(key: KeyEvent): void {
  if (key.type === 'char') {
    const idx = key.char.charCodeAt(0) - 'a'.charCodeAt(0);
    if (idx >= 0 && idx < saveSlots.length) {
      const chosen = saveSlots[idx];
      if (deleteMode) {
        deleteConfirmTarget = chosen;
        renderDeleteConfirm(chosen);
        return;
      }
      saveListMode = false;
      render(engine.loadCharacter(chosen.id));
      return;
    }
    if (key.char === 'q' || key.char === '\x1b') {
      saveListMode = false;
      deleteMode = false;
      render(engine.showMainMenu());
    }
  }
}

function handleDeleteConfirmKey(key: KeyEvent): void {
  if (key.type !== 'char') return;
  if (key.char === 'y') {
    engine.deleteCharacter(deleteConfirmTarget!.id);
    deleteConfirmTarget = null;
    deleteMode = false;
    saveListMode = false;
    saveSlots = [];
    render(engine.showMainMenu());
    return;
  }
  if (key.char === 'n' || key.char === 'q' || key.char === '\x1b') {
    deleteConfirmTarget = null;
    renderSaveList('delete');
  }
}

function renderSaveList(action: 'continue' | 'delete'): void {
  const lines = [
    `\x1b[2J\x1b[H`,
    `\x1b[92m  ${action === 'continue' ? 'CONTINUE CHARACTER' : 'DELETE CHARACTER'}\x1b[0m`,
    '',
  ];

  saveSlots.forEach((slot, i) => {
    const letter = String.fromCharCode('a'.charCodeAt(0) + i);
    const vic = slot.asmodeusDefeated ? ' [VICTOR]' : '';
    lines.push(
      `\x1b[32m  [${letter.toUpperCase()}]  ${slot.name.padEnd(20)} ${slot.charClass === 'warrior' ? 'Warrior' : 'Wizard '} Lv ${String(slot.level).padEnd(3)} ` +
      `Dungeon Lv ${slot.dungeonLevel}  Monsters: ${slot.monstersDefeated}${vic}\x1b[0m`
    );
  });

  lines.push('');
  lines.push('\x1b[2m  [Q] Cancel\x1b[0m');

  process.stdout.write(lines.join('\n') + '\n');
}

function renderDeleteConfirm(target: CharacterSummary): void {
  const lines = [
    `\x1b[2J\x1b[H`,
    `\x1b[31m  DELETE CHARACTER\x1b[0m`,
    '',
    `\x1b[32m  Permanently delete "${target.name}" (Level ${target.level}, Dungeon Lv ${target.dungeonLevel})?\x1b[0m`,
    `\x1b[2m  This cannot be undone.\x1b[0m`,
    '',
    '\x1b[31m  [Y]  Yes, delete forever\x1b[0m',
    '\x1b[32m  [N]  No, cancel\x1b[0m',
  ];
  process.stdout.write(lines.join('\n') + '\n');
}

function showNamePrompt(): void {
  const lines = [
    '\x1b[2J\x1b[H',
    '',
    '\x1b[92mEnter your character name:\x1b[0m',
    '',
    `\x1b[32m> ${nameBuffer}_\x1b[0m`,
  ];
  process.stdout.write(lines.join('\n') + '\n');
}

function renderWithMessage(msg: string): void {
  const state = engine.showMainMenu();
  state.messages = [...state.messages, '', msg];
  render(state);
}

// ─── Entry point ─────────────────────────────────────────────────────────────

function main(): void {
  // Show title
  process.stdout.write('\x1b[2J\x1b[H');
  process.stdout.write('\x1b[32m' + INTRO_SCREEN + '\x1b[0m\n');

  keyboard.start();
  keyboard.on('key', (key: KeyEvent) => {
    try {
      handleKey(key);
    } catch (err) {
      keyboard.stop();
      console.error('\nFatal error:', err);
      process.exit(1);
    }
  });

  // Handle process signals
  process.on('SIGINT', exit);
  process.on('SIGTERM', exit);
}

main();
