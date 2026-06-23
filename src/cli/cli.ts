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
let saveListMode = false;
let deleteMode = false;
let saveSlots: CharacterSummary[] = [];

function render(state: GameState): void {
  currentState = state;
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

  // Title screen
  if (phase === 'title') {
    render(engine.showMainMenu());
    return;
  }

  // Main menu
  if (phase === 'main-menu') {
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
    if (key.type === 'char' || (key.type === 'char' && key.char === ' ')) {
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
        render(engine.acceptCharacter());
        return;
      }
      if (key.char === 'b') {
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

  // Death screen
  if (phase === 'death') {
    render(engine.dismissDeath());
    return;
  }

  // Victory
  if (phase === 'victory') {
    render(engine.showMainMenu());
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

    if (key.type === 'char') {
      if (key.char === 'b') {
        // Show spell submenu
        spellMenuOpen = true;
        const state = engine.getState();
        state.choices = [
          { key: 'a', text: 'Fireball' },
          { key: 'b', text: 'Heal' },
          { key: 'c', text: 'Cancel' },
        ];
        state.messages = ['Choose a spell:'];
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
        engine.deleteCharacter(chosen.id);
        deleteMode = false;
        saveListMode = false;
        saveSlots = [];
        render(engine.showMainMenu());
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
      `\x1b[32m  [${letter.toUpperCase()}]  ${slot.name.padEnd(20)} Lv ${String(slot.level).padEnd(3)} ` +
      `Dungeon Lv ${slot.dungeonLevel}  Monsters: ${slot.monstersDefeated}${vic}\x1b[0m`
    );
  });

  lines.push('');
  lines.push('\x1b[2m  [Q] Cancel\x1b[0m');

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
