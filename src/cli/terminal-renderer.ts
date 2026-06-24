import type { GameState, Character } from '../core/types.js';

const CLEAR = '\x1b[2J\x1b[H';
const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const BRIGHT_GREEN = '\x1b[92m';
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';

function g(s: string): string { return GREEN + s + RESET; }
function bg(s: string): string { return BRIGHT_GREEN + s + RESET; }
function dim(s: string): string { return DIM + s + RESET; }
function bold(s: string): string { return BOLD + s + RESET; }
function red(s: string): string { return RED + s + RESET; }
function yellow(s: string): string { return YELLOW + s + RESET; }
function cyan(s: string): string { return CYAN + s + RESET; }

export function renderState(state: GameState): string {
  const lines: string[] = [];

  switch (state.phase) {
    case 'title':
      lines.push(...renderTitle());
      break;

    case 'main-menu':
      lines.push(...renderMainMenu(state));
      break;

    case 'name-entry':
      lines.push(...renderNameEntry(state));
      break;

    case 'char-roll':
    case 'char-accept':
      lines.push(...renderCharRoll(state));
      break;

    case 'playing':
    case 'combat':
    case 'interaction':
      lines.push(...renderGame(state));
      break;

    case 'status':
      lines.push(...renderStatus(state));
      break;

    case 'level-intro':
      lines.push(...renderLevelIntro(state));
      break;

    case 'death':
      lines.push(...renderDeath(state));
      break;

    case 'victory':
      lines.push(...renderVictory(state));
      break;

    default:
      lines.push(...renderGame(state));
  }

  return CLEAR + lines.join('\n');
}

function renderTitle(): string[] {
  return [
    '',
    bg('========================================'),
    bg('          THE SEVEN LEVELS'),
    bg('========================================'),
    '',
    g('Beneath the ruined fortress lies a dungeon'),
    g('older than the kingdoms of men.'),
    '',
    g('Seven levels descend into darkness.'),
    '',
    g('At the center of the lowest level waits'),
    g('Asmodeus.'),
    '',
    g('No adventurer has ever returned.'),
    '',
    '',
    dim('PRESS ANY KEY TO BEGIN'),
  ];
}

function renderMainMenu(state: GameState): string[] {
  const lines = [
    '',
    bg('========================================'),
    bg('          THE SEVEN LEVELS'),
    bg('========================================'),
    '',
  ];

  for (const msg of state.messages.slice(3)) {
    lines.push(g(msg));
  }
  lines.push('');

  for (const choice of state.choices ?? []) {
    lines.push(bold(g(`  [${choice.key.toUpperCase()}]  ${choice.text}`)));
  }

  return lines;
}

function renderNameEntry(state: GameState): string[] {
  return [
    '',
    ...state.messages.map(m => g(m)),
    '',
    bold(g('> ')),
  ];
}

function renderCharRoll(state: GameState): string[] {
  const lines = ['', ...state.messages.map(m => bg(m)), ''];
  for (const choice of state.choices ?? []) {
    lines.push(bold(g(`  [${choice.key.toUpperCase()}]  ${choice.text}`)));
  }
  return lines;
}

function renderGame(state: GameState): string[] {
  const lines: string[] = [''];

  // Top bar
  if (state.character) {
    lines.push(...renderStatusBar(state.character, state.phase));
  }
  lines.push('');

  // 5x5 view
  if (state.view) {
    lines.push(dim('  ╔═══════════╗'));
    for (const row of state.view) {
      lines.push(dim('  ║') + g(row) + dim('║'));
    }
    lines.push(dim('  ╚═══════════╝'));
  }
  lines.push('');

  // Messages
  for (const msg of state.messages) {
    if (msg === '') {
      lines.push('');
    } else {
      lines.push(g('  ' + msg));
    }
  }

  if (state.messages.length > 0) lines.push('');

  // Choices
  if (state.choices && state.choices.length > 0) {
    for (const choice of state.choices) {
      lines.push(bold(g(`  [${choice.key.toUpperCase()}]  ${choice.text}`)));
    }
    lines.push('');
  }

  // Phase-specific hints
  if (state.phase === 'playing') {
    lines.push(dim('  Arrows: Move/Turn  |  U/D: Stairs  |  T: Status  |  R: Restore  |  S: Save & Menu  |  Q: Quit'));
  }

  return lines;
}

function renderStatusBar(char: Character, phase: string): string[] {
  const hpColor = char.hp < char.maxHp * 0.25 ? red : char.hp < char.maxHp * 0.5 ? yellow : g;
  const loc = `Level ${char.dungeonLevel}`;
  const charLvl = `Char Lv ${char.level}`;
  const hp = hpColor(`HP: ${char.hp}/${char.maxHp}`);
  const xpLine = `XP: ${char.xp}`;
  const goldLine = `Gold: ${char.gold}`;

  return [
    bold(bg('  ' + char.name.padEnd(20))) + g(loc.padEnd(12)) + g(charLvl),
    `  ${hp.padEnd(30)}${g(xpLine.padEnd(16))}${g(goldLine)}`,
    g('  ' + '─'.repeat(60)),
  ];
}

function renderLevelIntro(state: GameState): string[] {
  const lines = [''];
  for (const msg of state.messages) {
    if (msg === 'PRESS ANY KEY') {
      lines.push('');
      lines.push(dim('PRESS ANY KEY'));
    } else {
      lines.push(g(msg));
    }
  }
  return lines;
}

function renderDeath(state: GameState): string[] {
  return [
    '',
    red('  * * * * * * * * * * * * * * * * * * * *'),
    red('                YOU HAVE DIED.'),
    red('  * * * * * * * * * * * * * * * * * * * *'),
    '',
    ...state.messages.slice(1).map(m => g('  ' + m)),
    '',
    dim('  PRESS ANY KEY TO CONTINUE'),
  ];
}

function renderVictory(state: GameState): string[] {
  return [
    '',
    bg('  ████████████████████████████████████████'),
    bg('         THE SEVEN LEVELS CONQUERED'),
    bg('  ████████████████████████████████████████'),
    '',
    ...state.messages.map(m => g('  ' + m)),
    '',
    dim('  PRESS ANY KEY TO CONTINUE'),
  ];
}

function renderStatus(state: GameState): string[] {
  const lines: string[] = [''];
  for (const msg of state.messages) {
    lines.push(msg.startsWith('═') ? bg('  ' + msg) : g('  ' + msg));
  }
  lines.push('');
  lines.push(dim('  PRESS ANY KEY TO RETURN TO GAME'));
  return lines;
}
