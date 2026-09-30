// THE SEVEN LEVELS — browser client

'use strict';

// ─── State ───────────────────────────────────────────────────────────────────

let currentState = { phase: 'title', messages: [] };
let characterId = null;
let spellMenuOpen = false;
let gemMenuOpen = false;
const MAP_ZOOM_STEPS = [1, 1.4, 1.8, 2.4, 3];
let mapZoom = (() => {
  try { return Math.min(MAP_ZOOM_STEPS.length - 1, Math.max(0, +localStorage.getItem('sevenLevelsMapZoom') || 0)); }
  catch { return 0; }
})();
let awaitingAnyKey = false;   // for title / intro / death / victory

// The continue/delete character list and the delete-confirm screen are both
// rendered entirely client-side (no server round trip), so — unlike every
// other screen — there's no `state.choices` from the server for the keydown
// handler to match hotkeys against. These track what's currently showing so
// A/B/C... and Y/N work from the keyboard, not just by clicking.
let saveListChars = null;   // character summaries currently listed, or null
let saveListAction = null;  // 'continue' | 'delete', or null
let deletePendingChar = null; // character awaiting Y/N delete confirmation, or null

// ─── Resume across page refresh ────────────────────────────────────────────
// The server already persists character + dungeon state to disk on nearly
// every action; the only thing a refresh loses client-side is "which
// character was active." Stash that id in localStorage so a refresh can
// resume the same character instead of dropping back to the title screen.

const CHAR_ID_KEY = 'sevenLevelsCharacterId';
const RESUMABLE_PHASES = ['playing', 'combat', 'interaction', 'level-intro', 'status', 'map', 'inventory', 'death', 'victory', 'save-prompt', 'resting'];

// ─── API ─────────────────────────────────────────────────────────────────────

async function apiAction(action, payload) {
  const body = { characterId, action };
  if (payload) body.payload = payload;

  const res = await fetch('/api/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    console.error('API error:', err);
    return;
  }

  const data = await res.json();
  if (data.characterId) characterId = data.characterId;
  applyState(data.state);
}

async function loadCharacters() {
  const res = await fetch('/api/characters');
  const data = await res.json();
  return data.characters || [];
}

async function deleteCharacter(id) {
  await fetch(`/api/characters/${id}`, { method: 'DELETE' });
}

// ─── State → DOM ─────────────────────────────────────────────────────────────

function applyState(state) {
  if (!state) return;
  const prev = currentState;
  currentState = state;
  spellMenuOpen = false;
  gemMenuOpen = false;
  saveListChars = null;
  saveListAction = null;
  deletePendingChar = null;

  const phase = state.phase;

  // Remember (or forget) which character to resume on refresh
  if (RESUMABLE_PHASES.includes(phase) && characterId) {
    localStorage.setItem(CHAR_ID_KEY, characterId);
  } else if (phase === 'main-menu' || phase === 'title') {
    localStorage.removeItem(CHAR_ID_KEY);
  }

  // Status bar
  const statusBar = document.getElementById('status-bar');
  const viewContainer = document.getElementById('view-container');
  const movementControls = document.getElementById('movement-controls');
  const nameInputArea = document.getElementById('name-input-area');

  const isPlaying = ['playing', 'combat', 'interaction', 'death', 'status', 'map', 'inventory', 'save-prompt', 'resting'].includes(phase);

  statusBar.classList.toggle('hidden', !isPlaying || !state.character);
  // The map screen gives the map the whole panel instead of the corridor view.
  viewContainer.classList.toggle('hidden', !isPlaying || !state.view || phase === 'map');
  movementControls.classList.toggle('hidden', !['playing', 'status', 'inventory', 'map'].includes(phase));
  movementControls.classList.toggle('map-walk', phase === 'map');  // just the arrows on the map screen
  nameInputArea.classList.toggle('hidden', phase !== 'name-entry');

  if (state.character) {
    updateStatusBar(state.character);
  }

  if (state.view) {
    document.getElementById('dungeon-view').textContent = state.view.join('\n');
  }

  // Monster portrait
  const portraitEl = document.getElementById('monster-portrait');
  const monster = phase === 'combat' ? state.combat?.monster : null;
  if (monster) {
    const sprite = getMonsterSprite(monster.type);
    portraitEl.innerHTML = sprite || '';
    portraitEl.style.setProperty('--sprite-scale', getMonsterSpriteScale(monster.type));
    portraitEl.classList.toggle('hidden', !sprite);
  } else {
    portraitEl.classList.add('hidden');
    portraitEl.innerHTML = '';
  }

  playHitEffects(prev, state);
  scheduleRestTick(phase);

  // Messages
  // The map screen keeps its title and legend fixed outside the scrolling area.
  const lines = state.messages || [];
  const isMap = phase === 'map';
  const legendAt = isMap ? lines.findIndex(l => l.trimStart().startsWith('@ You')) : -1;
  const mapHeader = document.getElementById('map-header');
  const mapLegend = document.getElementById('map-legend');
  mapHeader.classList.toggle('hidden', !isMap);
  mapLegend.classList.toggle('hidden', !isMap || legendAt < 0);
  mapHeader.textContent = isMap ? (lines[0] || '') : '';
  mapLegend.textContent = legendAt >= 0 ? lines[legendAt].trim() : '';
  const bodyLines = isMap ? lines.slice(1, legendAt >= 0 ? legendAt : undefined) : lines;
  while (isMap && bodyLines.length && bodyLines[bodyLines.length - 1] === '') bodyLines.pop();
  const msgs = bodyLines.join('\n');
  const msgEl = document.getElementById('messages');
  msgEl.textContent = msgs;
  msgEl.classList.toggle('map-view', phase === 'map');
  msgEl.classList.toggle('map-full', phase === 'map' && !!state.mapFull);
  msgEl.style.setProperty('--map-zoom', phase === 'map' ? MAP_ZOOM_STEPS[mapZoom] : 1);
  document.getElementById('message-area').classList.toggle('map-mode', phase === 'map');
  if (phase === 'map') centerMapOnPlayer();
  else msgEl.scrollTop = msgEl.scrollHeight;
  updatePannable();

  // Choices
  renderChoices(state.choices || [], phase, state);

  // Help line
  updateHelpLine(phase);

  // Awaiting any key
  awaitingAnyKey = ['title', 'level-intro', 'victory'].includes(phase);
  // status uses X key, death uses C/Q, not any-key

  // Name input focus
  if (phase === 'name-entry') {
    setTimeout(() => document.getElementById('name-input').focus(), 50);
  }
}

// ─── Hit effects ─────────────────────────────────────────────────────────────
//
// Amounts come from comparing HP before and after each action, so every
// source of harm or healing is covered (attacks, spells, traps, poison,
// potions). The engine's state.fx says what kind of hit it was, which picks
// the colour. Order within a round: the character acts first (the monster
// recoils), then the monster replies (it lunges, and the view flashes).

const FX_COLOR = {
  physical: '#ff2a2a', fire: '#ff7a1a', cold: '#7ad0ff', lightning: '#ffffff', acid: '#9aff30',
  poison: '#50d040', drain: '#9a4aff', psychic: '#ff50e0', holy: '#ffe890', arcane: '#c080ff',
};

function restartAnimation(el, cls) {
  el.classList.remove(cls);
  void el.offsetWidth;  // force a reflow so the animation plays again
  el.classList.add(cls);
}

function fxFlash(element, big) {
  const layer = document.getElementById('fx-layer');
  const flash = document.createElement('div');
  flash.className = 'fx-flash' + (element === 'lightning' ? ' fx-flicker' : '') + (big ? ' fx-big' : '');
  flash.style.setProperty('--fx', FX_COLOR[element] || FX_COLOR.physical);
  flash.addEventListener('animationend', () => flash.remove());
  layer.appendChild(flash);
}

function fxShake(ratio) {
  const view = document.getElementById('view-container');
  const px = Math.min(14, Math.max(2, ratio * 40));
  view.style.setProperty('--shake', `${px}px`);
  restartAnimation(view, 'fx-shake');
}

function fxNumber(text, kind, where, element, big) {
  const layer = document.getElementById('fx-layer');
  const num = document.createElement('div');
  num.className = `fx-num ${kind}` + (big ? ' big' : '');
  num.textContent = text;
  num.style.left = `${50 + (Math.random() * 16 - 8)}%`;
  num.style.top = where === 'monster' ? '28%' : '60%';
  num.style.setProperty('--fx', FX_COLOR[element] || '#000');
  num.addEventListener('animationend', () => num.remove());
  layer.appendChild(num);
}

function fxMonster(cls, element) {
  const portrait = document.getElementById('monster-portrait');
  if (portrait.classList.contains('hidden')) return;
  portrait.style.setProperty('--fx', FX_COLOR[element] || '#ffffff');
  restartAnimation(portrait, cls);
}

function playHitEffects(prev, state) {
  const view = document.getElementById('view-container');
  const nc = state.character;
  const inDungeon = ['playing', 'combat', 'interaction', 'resting'].includes(state.phase);
  view.classList.toggle('fx-lowhp', !!nc && inDungeon && nc.hp / nc.maxHp < 0.25);
  if (view.classList.contains('hidden') || !prev) return;

  const fx = state.fx || {};
  const pc = prev.character;

  // Death: the character's HP is already restored on the death screen, so
  // just land one heavy blow.
  if (state.phase === 'death' && prev.phase !== 'death') {
    fxFlash(fx.player || 'physical', true);
    fxShake(0.5);
    return;
  }

  const samePlayer = pc && nc && pc.id === nc.id && prev.phase !== 'death';
  const playerDelta = samePlayer ? nc.hp - pc.hp : 0;
  const pm = prev.combat?.monster;
  const nm = state.combat?.monster;
  const monsterDelta = pm && nm && pm.id === nm.id ? nm.hp - pm.hp : 0;

  let delay = 0;
  if (monsterDelta < 0) {
    fxMonster('fx-recoil', fx.monster || 'physical');
    fxNumber(`${monsterDelta}`, 'hit', 'monster', fx.monster, -monsterDelta >= pm.maxHp * 0.25);
    delay = 280;
  }
  if (fx.monsterAttacked && nm) {
    setTimeout(() => fxMonster('fx-lunge'), delay);
    delay += 160;
  }
  if (playerDelta < 0) {
    const ratio = -playerDelta / nc.maxHp;
    setTimeout(() => {
      fxFlash(fx.player || 'physical', ratio >= 0.25);
      fxShake(ratio);
      fxNumber(`${playerDelta}`, 'hurt', 'player', fx.player || 'physical', ratio >= 0.25);
    }, delay);
  } else if (playerDelta > 0) {
    fxNumber(`+${playerDelta}`, 'heal', 'player', 'holy');
  }
}

// ─── Resting ─────────────────────────────────────────────────────────────────
// W starts resting; while it lasts the page asks for one tick a second. It
// ends on its own (fully healed, or a wandering monster) or on any key.

let restTimer = null;

function scheduleRestTick(phase) {
  clearTimeout(restTimer);
  restTimer = null;
  if (phase !== 'resting') return;
  restTimer = setTimeout(() => {
    restTimer = null;
    if (currentState.phase === 'resting') apiAction('rest-tick');
  }, 1000);
}

// ─── Map zoom ────────────────────────────────────────────────────────────────
// The map screen scrolls in both directions (two-finger touchpad scrolling
// works natively); Z enlarges it, and it re-centres on the @ after drawing.

function zoomMap(step) {
  const next = Math.min(MAP_ZOOM_STEPS.length - 1, Math.max(0, mapZoom + step));
  if (next === mapZoom) return;
  mapZoom = next;
  try { localStorage.setItem('sevenLevelsMapZoom', String(mapZoom)); } catch { /* per-viewer nicety only */ }
  applyState(currentState);
}

function centerMapOnPlayer() {
  const area = document.getElementById('message-area');
  const msgEl = document.getElementById('messages');
  const lines = msgEl.textContent.split('\n');
  const row = lines.findIndex(l => l.includes('@'));
  if (row < 0) return;
  const col = lines[row].indexOf('@');
  // Measure one character cell in the map's current font.
  const probe = document.createElement('span');
  probe.textContent = 'M';
  msgEl.appendChild(probe);
  const cw = probe.getBoundingClientRect().width;
  const lh = probe.getBoundingClientRect().height;
  probe.remove();
  area.scrollLeft = Math.max(0, col * cw - area.clientWidth / 2);
  area.scrollTop = Math.max(0, row * lh - area.clientHeight / 2);
}

/** Shows the grab hand only when the map is bigger than its panel. */
function updatePannable() {
  const area = document.getElementById('message-area');
  const pannable = area.classList.contains('map-mode')
    && (area.scrollWidth > area.clientWidth + 1 || area.scrollHeight > area.clientHeight + 1);
  area.classList.toggle('pannable', pannable);
}
window.addEventListener('resize', updatePannable);

// Click (or press the touchpad) and drag to pan the map. Movement is tracked
// on the whole window, so the drag keeps going if the cursor leaves the panel.
(() => {
  const area = document.getElementById('message-area');
  let drag = null;
  area.addEventListener('pointerdown', e => {
    if (!area.classList.contains('pannable') || e.button !== 0) return;
    drag = { x: e.clientX, y: e.clientY, left: area.scrollLeft, top: area.scrollTop, id: e.pointerId };
    try { area.setPointerCapture(e.pointerId); } catch { /* not all pointers can be captured */ }
    area.classList.add('dragging');
    e.preventDefault();
  });
  window.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    area.scrollLeft = drag.left - (e.clientX - drag.x);
    area.scrollTop = drag.top - (e.clientY - drag.y);
  });
  const end = e => {
    if (!drag || e.pointerId !== drag.id) return;
    drag = null;
    area.classList.remove('dragging');
  };
  window.addEventListener('pointerup', end);
  window.addEventListener('pointercancel', end);
})();

const COMPASS = { N: '▲ N', E: '▶ E', S: '▼ S', W: '◀ W' };

function updateStatusBar(char) {
  document.getElementById('char-name').textContent = char.name;
  document.getElementById('dungeon-level').textContent = `Level ${char.dungeonLevel}`;
  document.getElementById('char-level').textContent = `Char Lv ${char.level}`;

  const hpEl = document.getElementById('hp-display');
  hpEl.textContent = `HP: ${char.hp}/${char.maxHp}`;
  const hpRatio = char.hp / char.maxHp;
  hpEl.className = hpRatio < 0.25 ? 'crit' : hpRatio < 0.5 ? 'warn' : '';

  document.getElementById('xp-display').textContent = `XP: ${char.xp}`;
  document.getElementById('gold-display').textContent = `Gold: ${char.gold}`;

  const potions = char.inventory?.potions ?? 0;
  const potEl = document.getElementById('potions-display');
  potEl.textContent = `Pot: ${potions}`;
  potEl.className = potions > 0 ? 'has-potions' : '';

  const gems = { ruby: 0, sapphire: 0, diamond: 0, opal: 0, emerald: 0, ...(char.inventory?.gems ?? {}) };
  const gemEl = document.getElementById('gems-display');
  const ward = (char.statusEffects || []).find(e => e.type === 'warded');
  gemEl.textContent = `Gems: R${gems.ruby} S${gems.sapphire} D${gems.diamond} O${gems.opal} E${gems.emerald}`
    + (ward ? `  Ward:${ward.value}` : '');
  const hasGems = gems.ruby || gems.sapphire || gems.diamond || gems.opal || gems.emerald;
  gemEl.className = hasGems ? 'has-potions' : '';

  document.getElementById('compass-display').textContent = COMPASS[char.facing] ?? '';
}

function renderChoices(choices, phase, state) {
  const area = document.getElementById('choices-area');
  area.innerHTML = '';

  if (phase === 'main-menu') {
    renderMainMenuChoices(area, state);
    return;
  }

  if (phase === 'title') {
    const btn = makeChoiceBtn('Any key', 'Begin');
    btn.onclick = () => apiAction('main-menu');
    area.appendChild(btn);
    return;
  }

  if (phase === 'level-intro' || phase === 'victory') {
    const btn = makeChoiceBtn('Any key', 'Continue');
    btn.onclick = handleAnyKey;
    area.appendChild(btn);
    return;
  }

  if (phase === 'status') {
    const btn = makeChoiceBtn('X', 'Return to Game');
    btn.onclick = () => apiAction('dismiss-status');
    area.appendChild(btn);
    return;
  }

  if (phase === 'inventory') {
    const btn = makeChoiceBtn('X', 'Return to Game');
    btn.onclick = () => apiAction('dismiss-inventory');
    area.appendChild(btn);
    return;
  }

  if (phase === 'map') {
    const toggle = makeChoiceBtn('F', state.mapFull ? 'Centered View' : 'Full Floor');
    toggle.onclick = () => apiAction('toggle-map-view');
    area.appendChild(toggle);
    const zin = makeChoiceBtn('+', `Zoom In (${mapZoom + 1}/${MAP_ZOOM_STEPS.length})`);
    zin.onclick = () => zoomMap(1);
    zin.disabled = mapZoom === MAP_ZOOM_STEPS.length - 1;
    area.appendChild(zin);
    const zout = makeChoiceBtn('−', 'Zoom Out');
    zout.onclick = () => zoomMap(-1);
    zout.disabled = mapZoom === 0;
    area.appendChild(zout);
    const btn = makeChoiceBtn('M', 'Close Map');
    btn.onclick = () => apiAction('dismiss-map');
    area.appendChild(btn);
    return;
  }

  if (phase === 'name-entry') {
    const btn = makeChoiceBtn('Enter', 'Submit Name');
    btn.onclick = () => submitName();
    area.appendChild(btn);
    return;
  }

  for (const choice of choices) {
    const btn = makeChoiceBtn(choice.key.toUpperCase(), choice.text);
    btn.onclick = () => handleChoiceKey(choice.key, phase);
    area.appendChild(btn);
  }
}

function renderMainMenuChoices(area, state) {
  const newBtn = makeChoiceBtn('N', 'NEW CHARACTER');
  newBtn.onclick = () => apiAction('new-character-start');
  area.appendChild(newBtn);

  const contBtn = makeChoiceBtn('C', 'CONTINUE CHARACTER');
  contBtn.onclick = () => showSaveList('continue');
  area.appendChild(contBtn);

  const delBtn = makeChoiceBtn('D', 'DELETE CHARACTER');
  delBtn.onclick = () => showSaveList('delete');
  area.appendChild(delBtn);
}

function makeChoiceBtn(key, text) {
  const btn = document.createElement('button');
  btn.className = 'choice-btn';
  btn.innerHTML = `<span class="key">[${key}]</span> ${text}`;
  return btn;
}

async function showSaveList(action) {
  const chars = await loadCharacters();
  if (!chars.length) {
    const msgEl = document.getElementById('messages');
    msgEl.textContent = 'No saved characters found.';
    return;
  }

  deletePendingChar = null;
  saveListChars = chars;
  saveListAction = action;

  const area = document.getElementById('choices-area');
  area.innerHTML = '';

  const msgEl = document.getElementById('messages');
  msgEl.textContent = (action === 'continue' ? 'CONTINUE CHARACTER' : 'DELETE CHARACTER') + '\n\n' +
    chars.map((c, i) => {
      const letter = String.fromCharCode(65 + i);
      const vic = c.asmodeusDefeated ? ' [VICTOR]' : '';
      const cls = c.charClass === 'warrior' ? 'Warrior' : 'Wizard ';
      return `[${letter}]  ${c.name.padEnd(20)} ${cls} Lv ${c.level}  Dungeon Lv ${c.dungeonLevel}  Monsters: ${c.monstersDefeated}${vic}`;
    }).join('\n');

  chars.forEach((char, i) => {
    const letter = String.fromCharCode(65 + i);
    const btn = makeChoiceBtn(letter, char.name + (char.asmodeusDefeated ? ' ★' : ''));
    btn.onclick = () => selectSaveListChar(i);
    area.appendChild(btn);
  });

  const cancelBtn = makeChoiceBtn('Q', 'Cancel');
  cancelBtn.onclick = () => cancelSaveList();
  area.appendChild(cancelBtn);
}

function selectSaveListChar(index) {
  const char = saveListChars && saveListChars[index];
  if (!char) return;
  if (saveListAction === 'continue') {
    apiAction('load', { characterId: char.id });
  } else {
    confirmDelete(char);
  }
}

function cancelSaveList() {
  saveListChars = null;
  saveListAction = null;
  apiAction('main-menu');
}

function confirmDelete(char) {
  deletePendingChar = char;

  const area = document.getElementById('choices-area');
  area.innerHTML = '';

  const msgEl = document.getElementById('messages');
  msgEl.textContent = `DELETE CHARACTER\n\nPermanently delete "${char.name}" (Lv ${char.level}, Dungeon Lv ${char.dungeonLevel})?\nThis cannot be undone.`;

  const yesBtn = makeChoiceBtn('Y', 'Yes, delete forever');
  yesBtn.onclick = () => confirmDeleteYes();
  area.appendChild(yesBtn);

  const noBtn = makeChoiceBtn('N', 'No, cancel');
  noBtn.onclick = () => confirmDeleteNo();
  area.appendChild(noBtn);
}

function confirmDeleteYes() {
  if (!deletePendingChar) return;
  const char = deletePendingChar;
  deletePendingChar = null;
  deleteCharacter(char.id).then(() => apiAction('main-menu'));
}

function confirmDeleteNo() {
  deletePendingChar = null;
  showSaveList('delete');
}

function updateHelpLine(phase) {
  const hint = document.getElementById('key-hint');
  switch (phase) {
    case 'title':
    case 'level-intro':
      hint.textContent = 'PRESS ANY KEY'; break;
    case 'playing':
      hint.textContent = 'Arrows: Move/Turn  |  U/D: Stairs  |  W: Rest  |  P: Potion  |  B: Tome  |  G: Diamond  |  E: Emerald  |  M: Map  |  T: Status  |  I: Inventory  |  R: Restore  |  S: Save  |  Q: Quit'; break;
    case 'map':
      hint.textContent = 'Arrows: Walk  |  F: Full Floor / Centered  |  + / −: Zoom  |  Drag or scroll to pan  |  M or Esc: Close Map'; break;
    case 'status':
      hint.textContent = 'X: Return to Game'; break;
    case 'inventory':
      hint.textContent = 'X: Return to Game'; break;
    case 'combat':
      hint.textContent = 'A: Attack  B: Spell/Skill  C: Pray  D: Run  E: Gem  P: Potion'; break;
    case 'interaction':
      hint.textContent = 'Choose an option above'; break;
    case 'name-entry':
      hint.textContent = 'Type your name and press Enter'; break;
    case 'char-roll':
      hint.textContent = 'A: Wizard  B: Warrior  C: Reroll'; break;
    case 'death':
      hint.textContent = 'A: Revive  C: Restore Last Save  Q: Main Menu'; break;
    case 'save-prompt':
      hint.textContent = 'C: Continue Playing  X: Exit to Main Menu'; break;
    case 'resting':
      hint.textContent = 'Resting... press any key to stop'; break;
    case 'victory':
      hint.textContent = 'PRESS ANY KEY TO CONTINUE'; break;
    default:
      hint.textContent = '';
  }
}

// ─── Input handling ───────────────────────────────────────────────────────────

function handleAnyKey() {
  const phase = currentState.phase;
  if (phase === 'title')       { apiAction('main-menu'); return; }
  if (phase === 'level-intro') { apiAction('dismiss-intro'); return; }
  if (phase === 'victory')     { apiAction('main-menu'); return; }
}

function handleChoiceKey(key, phase) {
  if (phase === 'resting') {
    clearTimeout(restTimer);
    apiAction('stop-resting');
    return;
  }
  if (phase === 'char-roll') {
    if (key === 'a') apiAction('accept', { charClass: 'wizard' });
    if (key === 'b') apiAction('accept', { charClass: 'warrior' });
    if (key === 'c') apiAction('reroll');
    return;
  }

  if (phase === 'death') {
    if (key === 'a') apiAction('revive');
    if (key === 'c') apiAction('dismiss-death');
    if (key === 'q') apiAction('main-menu');
    return;
  }

  if (phase === 'save-prompt') {
    if (key === 'c') apiAction('dismiss-save-prompt');
    if (key === 'x') apiAction('main-menu');
    return;
  }

  if (phase === 'combat') {
    if (spellMenuOpen) {
      spellMenuOpen = false;
      apiAction('spell', { choice: key });
      return;
    }
    if (gemMenuOpen) {
      gemMenuOpen = false;
      apiAction('gem', { choice: key });
      return;
    }
    if (key === 'b') {
      // Show spell submenu
      spellMenuOpen = true;
      const area = document.getElementById('choices-area');
      area.innerHTML = '';
      // Only the spells this character has learned, as the engine letters them.
      const spells = currentState.spellChoices || [];
      for (const spell of spells) {
        const btn = makeChoiceBtn(spell.key.toUpperCase(), spell.text);
        btn.onclick = () => {
          spellMenuOpen = false;
          apiAction('spell', { choice: spell.key });
        };
        area.appendChild(btn);
      }
      document.getElementById('messages').textContent = 'Choose a spell:';
      return;
    }
    if (key === 'e') {
      // Show gem submenu
      gemMenuOpen = true;
      const area = document.getElementById('choices-area');
      area.innerHTML = '';
      const gems = [
        { key: 'a', text: 'Ruby — Teleport Away' },
        { key: 'b', text: 'Sapphire — Banish Monster' },
        { key: 'c', text: 'Diamond — Reveal Map' },
        { key: 'd', text: 'Opal — Chiaroscuro Blast' },
        { key: 'e', text: 'Emerald — Warding' },
        { key: 'f', text: 'Cancel' },
      ];
      for (const gem of gems) {
        const btn = makeChoiceBtn(gem.key.toUpperCase(), gem.text);
        btn.onclick = () => {
          gemMenuOpen = false;
          apiAction('gem', { choice: gem.key });
        };
        area.appendChild(btn);
      }
      document.getElementById('messages').textContent = 'Choose a gem:';
      return;
    }
    apiAction('combat', { choice: key });
    return;
  }

  if (phase === 'interaction') {
    apiAction('interact', { choice: key });
    return;
  }
}

function submitName() {
  const input = document.getElementById('name-input');
  const name = input.value.trim();
  if (!name) return;
  input.value = '';
  apiAction('submit-name', { name });
}

// ─── Keyboard events ──────────────────────────────────────────────────────────

document.addEventListener('keydown', (e) => {
  const phase = currentState.phase;

  // Resting: any key stops
  if (phase === 'resting') {
    e.preventDefault();
    clearTimeout(restTimer);
    apiAction('stop-resting');
    return;
  }

  // Prevent arrow keys from scrolling
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
    e.preventDefault();
  }

  // Name input — let the <input> element handle typing
  if (phase === 'name-entry') {
    if (e.key === 'Enter') submitName();
    return;
  }

  if (awaitingAnyKey) {
    handleAnyKey();
    return;
  }

  const key = e.key.toLowerCase();

  if (phase === 'main-menu') {
    if (deletePendingChar) {
      if (key === 'y') confirmDeleteYes();
      if (key === 'n' || key === 'q' || e.key === 'Escape') confirmDeleteNo();
      return;
    }
    if (saveListChars) {
      if (key === 'q' || e.key === 'Escape') { cancelSaveList(); return; }
      const idx = key.length === 1 ? key.charCodeAt(0) - 'a'.charCodeAt(0) : -1;
      if (idx >= 0 && idx < saveListChars.length) selectSaveListChar(idx);
      return;
    }
    if (key === 'n') apiAction('new-character-start');
    if (key === 'c') showSaveList('continue');
    if (key === 'd') showSaveList('delete');
    return;
  }

  if (phase === 'char-roll') {
    if (key === 'a') apiAction('accept', { charClass: 'wizard' });
    if (key === 'b') apiAction('accept', { charClass: 'warrior' });
    if (key === 'c') apiAction('reroll');
    return;
  }

  if (phase === 'playing') {
    if (e.key === 'ArrowUp')    apiAction('move-forward');
    if (e.key === 'ArrowDown')  apiAction('move-backward');
    if (e.key === 'ArrowLeft')  apiAction('turn-left');
    if (e.key === 'ArrowRight') apiAction('turn-right');
    if (key === 'u') apiAction('climb-up');
    if (key === 'd') apiAction('climb-down');
    if (key === 'p') apiAction('use-potion');
    if (key === 'b') apiAction('use-book');
    if (key === 'g') apiAction('use-diamond');
    if (key === 'e') apiAction('use-emerald');
    if (key === 'w') apiAction('wait');
    if (key === 'm') apiAction('show-map');
    if (key === 't') apiAction('show-status');
    if (key === 'i') apiAction('show-inventory');
    if (key === 'r') apiAction('restore');
    if (key === 's') apiAction('save');
    if (key === 'q') { characterId = null; apiAction('main-menu'); }
    return;
  }

  if (phase === 'save-prompt') {
    if (key === 'c') apiAction('dismiss-save-prompt');
    if (key === 'x') apiAction('main-menu');
    return;
  }

  if (phase === 'status') {
    if (key === 'x' || key === 't' || key === 'escape') apiAction('dismiss-status');
    return;
  }

  if (phase === 'inventory') {
    if (key === 'x' || key === 'i' || key === 'escape') apiAction('dismiss-inventory');
    return;
  }

  if (phase === 'map') {
    if (e.key === 'ArrowUp')    apiAction('map-move', { dir: 'forward' });
    if (e.key === 'ArrowDown')  apiAction('map-move', { dir: 'backward' });
    if (e.key === 'ArrowLeft')  apiAction('map-move', { dir: 'left' });
    if (e.key === 'ArrowRight') apiAction('map-move', { dir: 'right' });
    if (key === 'f') apiAction('toggle-map-view');
    if (key === '+' || key === '=') zoomMap(1);
    if (key === '-' || key === '_') zoomMap(-1);
    if (key === 'm' || key === 'escape') apiAction('dismiss-map');
    return;
  }

  if (phase === 'death') {
    if (key === 'a') apiAction('revive');
    if (key === 'c') apiAction('dismiss-death');
    if (key === 'q') apiAction('main-menu');
    return;
  }

  if (phase === 'combat') {
    if (spellMenuOpen) {
      if ((currentState.spellChoices || []).some(c => c.key === key)) {
        spellMenuOpen = false;
        apiAction('spell', { choice: key });
      }
      return;
    }
    if (gemMenuOpen) {
      if (['a','b','c','d','e','f'].includes(key)) {
        gemMenuOpen = false;
        apiAction('gem', { choice: key });
      }
      return;
    }
    if (key === 'b') {
      // Trigger spell submenu via button click
      const spellBtn = [...document.querySelectorAll('.choice-btn')]
        .find(b => b.querySelector('.key')?.textContent === '[B]');
      if (spellBtn) spellBtn.click();
      return;
    }
    if (key === 'e') {
      // Trigger gem submenu via button click
      const gemBtn = [...document.querySelectorAll('.choice-btn')]
        .find(b => b.querySelector('.key')?.textContent === '[E]');
      if (gemBtn) gemBtn.click();
      return;
    }
    if (['a','c','d','p'].includes(key)) apiAction('combat', { choice: key });
    return;
  }

  if (phase === 'interaction') {
    if (['a','b','c','d'].includes(key)) {
      apiAction('interact', { choice: key });
    }
    return;
  }
});

// ─── Button wiring ────────────────────────────────────────────────────────────

// The d-pad walks on the map screen too.
function move(action, mapDir) {
  if (currentState.phase === 'map') apiAction('map-move', { dir: mapDir });
  else apiAction(action);
}
document.getElementById('btn-forward')   ?.addEventListener('click', () => move('move-forward', 'forward'));
document.getElementById('btn-backward')  ?.addEventListener('click', () => move('move-backward', 'backward'));
document.getElementById('btn-turn-left') ?.addEventListener('click', () => move('turn-left', 'left'));
document.getElementById('btn-turn-right')?.addEventListener('click', () => move('turn-right', 'right'));
document.getElementById('btn-climb-up')  ?.addEventListener('click', () => apiAction('climb-up'));
document.getElementById('btn-climb-down')?.addEventListener('click', () => apiAction('climb-down'));
document.getElementById('btn-wait')      ?.addEventListener('click', () => apiAction('wait'));
document.getElementById('btn-map')       ?.addEventListener('click', () => apiAction('show-map'));
document.getElementById('btn-potion')    ?.addEventListener('click', () => apiAction('use-potion'));
document.getElementById('btn-book')      ?.addEventListener('click', () => apiAction('use-book'));
document.getElementById('btn-diamond')   ?.addEventListener('click', () => apiAction('use-diamond'));
document.getElementById('btn-emerald')   ?.addEventListener('click', () => apiAction('use-emerald'));
document.getElementById('btn-status')    ?.addEventListener('click', () => apiAction('show-status'));
document.getElementById('btn-inventory') ?.addEventListener('click', () => apiAction('show-inventory'));
document.getElementById('btn-restore')   ?.addEventListener('click', () => apiAction('restore'));
document.getElementById('btn-save')      ?.addEventListener('click', () => apiAction('save'));

// ─── Boot ─────────────────────────────────────────────────────────────────────

(async () => {
  const savedCharacterId = localStorage.getItem(CHAR_ID_KEY);
  if (savedCharacterId) {
    // Resume where we left off. If the character no longer exists,
    // loadCharacter() leaves us on the title phase and applyState()
    // clears the stale id, so this degrades gracefully either way.
    await apiAction('resume', { characterId: savedCharacterId });
    return;
  }

  // No character to resume — show the title screen.
  applyState({
    phase: 'title',
    messages: [
      '========================================',
      '          THE SEVEN LEVELS',
      '========================================',
      '',
      'Beneath the ruined fortress lies a dungeon',
      'older than the kingdoms of men.',
      '',
      'Seven levels descend into darkness.',
      '',
      'At the center of the lowest level waits',
      'Asmodeus.',
      '',
      'No adventurer has ever returned.',
    ],
  });
  awaitingAnyKey = true;
})();
