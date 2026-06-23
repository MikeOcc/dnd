// THE SEVEN LEVELS — browser client

'use strict';

// ─── State ───────────────────────────────────────────────────────────────────

let currentState = { phase: 'title', messages: [] };
let characterId = null;
let spellMenuOpen = false;
let awaitingAnyKey = false;   // for title / intro / death / victory

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
  currentState = state;
  spellMenuOpen = false;

  const phase = state.phase;

  // Status bar
  const statusBar = document.getElementById('status-bar');
  const viewContainer = document.getElementById('view-container');
  const movementControls = document.getElementById('movement-controls');
  const nameInputArea = document.getElementById('name-input-area');

  const isPlaying = ['playing', 'combat', 'interaction', 'death'].includes(phase);

  statusBar.classList.toggle('hidden', !isPlaying || !state.character);
  viewContainer.classList.toggle('hidden', !isPlaying || !state.view);
  movementControls.classList.toggle('hidden', phase !== 'playing');
  nameInputArea.classList.toggle('hidden', phase !== 'name-entry');

  if (state.character) {
    updateStatusBar(state.character);
  }

  if (state.view) {
    document.getElementById('dungeon-view').textContent = state.view.join('\n');
  }

  // Messages
  const msgs = (state.messages || []).join('\n');
  const msgEl = document.getElementById('messages');
  msgEl.textContent = msgs;
  msgEl.scrollTop = msgEl.scrollHeight;

  // Choices
  renderChoices(state.choices || [], phase, state);

  // Help line
  updateHelpLine(phase);

  // Awaiting any key
  awaitingAnyKey = ['title', 'level-intro', 'death', 'victory'].includes(phase);

  // Name input focus
  if (phase === 'name-entry') {
    setTimeout(() => document.getElementById('name-input').focus(), 50);
  }
}

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

  if (phase === 'level-intro' || phase === 'death' || phase === 'victory') {
    const btn = makeChoiceBtn('Any key', 'Continue');
    btn.onclick = handleAnyKey;
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

  const area = document.getElementById('choices-area');
  area.innerHTML = '';

  const msgEl = document.getElementById('messages');
  msgEl.textContent = (action === 'continue' ? 'CONTINUE CHARACTER' : 'DELETE CHARACTER') + '\n\n' +
    chars.map((c, i) => {
      const letter = String.fromCharCode(65 + i);
      const vic = c.asmodeusDefeated ? ' [VICTOR]' : '';
      return `[${letter}]  ${c.name.padEnd(20)} Lv ${c.level}  Dungeon Lv ${c.dungeonLevel}  Monsters: ${c.monstersDefeated}${vic}`;
    }).join('\n');

  chars.forEach((char, i) => {
    const letter = String.fromCharCode(65 + i);
    const btn = makeChoiceBtn(letter, char.name + (char.asmodeusDefeated ? ' ★' : ''));
    btn.onclick = () => {
      if (action === 'continue') {
        apiAction('load', { characterId: char.id });
      } else {
        deleteCharacter(char.id).then(() => apiAction('main-menu'));
      }
    };
    area.appendChild(btn);
  });

  const cancelBtn = makeChoiceBtn('Q', 'Cancel');
  cancelBtn.onclick = () => apiAction('main-menu');
  area.appendChild(cancelBtn);
}

function updateHelpLine(phase) {
  const hint = document.getElementById('key-hint');
  switch (phase) {
    case 'title':
    case 'level-intro':
      hint.textContent = 'PRESS ANY KEY'; break;
    case 'playing':
      hint.textContent = 'Arrows: Move/Turn  |  U: Up  |  D: Down  |  Q: Quit'; break;
    case 'combat':
      hint.textContent = 'A: Attack  B: Spell  C: Pray  D: Run'; break;
    case 'interaction':
      hint.textContent = 'Choose an option above'; break;
    case 'name-entry':
      hint.textContent = 'Type your name and press Enter'; break;
    case 'char-roll':
      hint.textContent = 'A: Accept  B: Reroll (one reroll available)'; break;
    case 'death':
      hint.textContent = 'PRESS ANY KEY TO CONTINUE'; break;
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
  if (phase === 'death')       { apiAction('dismiss-death'); return; }
  if (phase === 'victory')     { apiAction('main-menu'); return; }
}

function handleChoiceKey(key, phase) {
  if (phase === 'char-roll') {
    if (key === 'a') apiAction('accept');
    if (key === 'b') apiAction('reroll');
    return;
  }

  if (phase === 'combat') {
    if (spellMenuOpen) {
      spellMenuOpen = false;
      apiAction('spell', { choice: key });
      return;
    }
    if (key === 'b') {
      // Show spell submenu
      spellMenuOpen = true;
      const area = document.getElementById('choices-area');
      area.innerHTML = '';
      const spells = [
        { key: 'a', text: 'Fireball' },
        { key: 'b', text: 'Heal' },
        { key: 'c', text: 'Cancel' },
      ];
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
    if (key === 'n') apiAction('new-character-start');
    if (key === 'c') showSaveList('continue');
    if (key === 'd') showSaveList('delete');
    return;
  }

  if (phase === 'char-roll') {
    if (key === 'a') apiAction('accept');
    if (key === 'b') apiAction('reroll');
    return;
  }

  if (phase === 'playing') {
    if (e.key === 'ArrowUp')    apiAction('move-forward');
    if (e.key === 'ArrowDown')  apiAction('move-backward');
    if (e.key === 'ArrowLeft')  apiAction('turn-left');
    if (e.key === 'ArrowRight') apiAction('turn-right');
    if (key === 'u') apiAction('climb-up');
    if (key === 'd') apiAction('climb-down');
    if (key === 'q') { characterId = null; apiAction('main-menu'); }
    return;
  }

  if (phase === 'combat') {
    if (spellMenuOpen) {
      if (['a','b','c'].includes(key)) {
        spellMenuOpen = false;
        apiAction('spell', { choice: key });
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
    if (['a','c','d'].includes(key)) apiAction('combat', { choice: key });
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

document.getElementById('btn-forward')   ?.addEventListener('click', () => apiAction('move-forward'));
document.getElementById('btn-backward')  ?.addEventListener('click', () => apiAction('move-backward'));
document.getElementById('btn-turn-left') ?.addEventListener('click', () => apiAction('turn-left'));
document.getElementById('btn-turn-right')?.addEventListener('click', () => apiAction('turn-right'));
document.getElementById('btn-climb-up')  ?.addEventListener('click', () => apiAction('climb-up'));
document.getElementById('btn-climb-down')?.addEventListener('click', () => apiAction('climb-down'));

// ─── Boot ─────────────────────────────────────────────────────────────────────

(async () => {
  // Show title screen immediately
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
