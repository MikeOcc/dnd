// THE SEVEN LEVELS — browser client

'use strict';

// ─── State ───────────────────────────────────────────────────────────────────

let currentState = { phase: 'title', messages: [] };
let characterId = null;
let spellMenuOpen = false;
let gemMenuOpen = false;
let ringMenuOpen = false;
let amuletMenuOpen = false;
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
const RESUMABLE_PHASES = ['playing', 'combat', 'interaction', 'level-intro', 'status', 'map', 'inventory', 'death', 'victory', 'resting', 'lair-warning', 'asmodeus-scene'];

// ─── API ─────────────────────────────────────────────────────────────────────

// The page this tab loaded, by the server's version stamp. If a newer one has
// been deployed since, reload: the server picks the game back up where it was.
let pageVersion = null;
function pageOutOfDate(res) {
  const v = res.headers.get('X-Page-Version');
  if (!v) return false;
  if (pageVersion === null) { pageVersion = v; return false; }
  if (v === pageVersion) return false;
  location.reload();
  return true;
}

// Requests go to the server one at a time, in the order they were made, so
// a burst of key presses on a slow connection can't arrive or be drawn out of
// order. Turning doesn't wait at all: the screen turns at once (from the
// views the server sent for every facing) and a 'face' request follows;
// turns still waiting to be sent merge into one.
const actionQueue = [];
let queueBusy = false;
let facesPending = 0;       // 'face' requests not yet answered
let localFacing = null;     // where the screen shows the character facing

function apiAction(action, payload) {
  return new Promise((resolve) => {
    const last = actionQueue[actionQueue.length - 1];
    if (action === 'face' && last?.action === 'face') { last.payload = payload; last.done.push(resolve); return; }
    if (action === 'face') facesPending++;
    actionQueue.push({ action, payload, done: [resolve] });
    pumpActions();
  });
}

async function pumpActions() {
  if (queueBusy) return;
  queueBusy = true;
  while (actionQueue.length) {
    const job = actionQueue.shift();
    try { await sendAction(job.action, job.payload); }
    catch (err) { console.error('API error:', err); }
    finally { if (job.action === 'face') facesPending = Math.max(0, facesPending - 1); }
    job.done.forEach(r => r());
  }
  queueBusy = false;
}

/** The state as it looks facing f (from its turnViews), or null if it can't say. */
function facingState(state, f) {
  const tv = state?.phase === 'playing' && state.character && state.turnViews?.[f];
  if (!tv) return null;
  const next = { ...state, character: { ...state.character, facing: f }, view: tv.view };
  if (tv.sighting) next.sighting = tv.sighting; else delete next.sighting;
  if (tv.waysOut) next.waysOut = tv.waysOut;
  if (state.scene) next.scene = { ...state.scene, facing: f };
  return next;
}

/** Turn left or right at once; the server hears about it right after. */
function turnNow(which) {
  const ORDER = ['N', 'E', 'S', 'W'];
  const s = currentState;
  const f = s.character && ORDER[(ORDER.indexOf(s.character.facing) + (which === 'right' ? 1 : 3)) % 4];
  const next = f && facingState(s, f);
  if (!next) { apiAction(which === 'right' ? 'turn-right' : 'turn-left'); return; }
  next.messages = [];          // as a turn on the server leaves it
  delete next.fx;              // (don't replay the last action's sounds)
  localFacing = f;
  lastAction = which === 'right' ? 'turn-right' : 'turn-left';
  lastActionWalked = false;
  applyState(next);
  apiAction('face', { facing: f });
}

async function sendAction(action, payload) {
  const body = { characterId, action };
  if (payload) body.payload = payload;

  const res = await fetch('/api/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (pageOutOfDate(res)) return;

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    console.error('API error:', err);
    return;
  }

  const data = await res.json();
  // null means the server let the character go (main menu, or it wasn't ours to play).
  if (data.characterId !== undefined) characterId = data.characterId;
  // A turn the server hasn't heard yet: keep showing the way the screen already faces.
  let state = data.state;
  if (action === 'face' && facesPending <= 1) localFacing = null;   // this was the last one: the server agrees now
  if (localFacing && (facesPending > (action === 'face' ? 1 : 0))) state = facingState(state, localFacing) || state;
  if (action === 'face') { if (state) applyState(state); return; }  // (already drawn: no sounds again)
  if (action === 'save' && /saved/i.test((state?.messages || []).join(' '))) { unsaved = false; lastSavedAt = Date.now(); flashSaved(); }
  else if (action === 'load' || action === 'restore' || action === 'main-menu' || action === 'accept') { unsaved = false; lastSavedAt = Date.now(); }
  else if (!NOT_PROGRESS.has(action) && ['playing', 'combat', 'interaction', 'resting', 'lair-warning'].includes(state?.phase)) unsaved = true;
  lastAction = action;
  lastActionWalked = action === 'move-forward' || action === 'move-backward'
    || (action === 'map-move' && (payload?.dir === 'forward' || payload?.dir === 'backward'));
  applyState(state);
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
  ringMenuOpen = false;
  amuletMenuOpen = false;
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

  const isPlaying = ['playing', 'combat', 'interaction', 'death', 'status', 'map', 'inventory', 'resting', 'lair-warning'].includes(phase);

  statusBar.classList.toggle('hidden', !isPlaying || !state.character);
  // The map screen gives the map the whole panel instead of the corridor view.
  viewContainer.classList.toggle('hidden', !isPlaying || !state.view || phase === 'map');
  movementControls.classList.toggle('hidden', !['playing', 'status', 'inventory'].includes(phase) && !(phase === 'map' && arrowsShown));
  movementControls.classList.toggle('map-walk', phase === 'map');
  nameInputArea.classList.toggle('hidden', phase !== 'name-entry');

  if (state.character) {
    updateStatusBar(state.character);
  }

  if (state.view) {
    document.getElementById('dungeon-view').textContent = state.view.join('\n');
  }

  // Asmodeus on his throne, seen from a few squares away
  const sightEl = document.getElementById('sighting');
  // (In the 3D views the throne is drawn in place, so this overlay is the classic view's.)
  const sight = phase === 'playing' && viewMode === 'classic' ? state.sighting : null;
  if (sight && getLairArt(sight.monster) && getMonsterSprite(sight.monster)) {
    const key = `${sight.monster}:${sight.distance}:${sight.view}:${sight.empty ? 'empty' : 'seated'}`;
    if (sightEl.dataset.key !== key) {
      sightEl.dataset.key = key;
      // From the front he sits glaring at you; from the side or behind you
      // see the throne from that side (the side view is mirrored as needed).
      // Once he's gone the throne stands empty. Mist and fire drift around it.
      const other = getSightArt(sight.monster, sight.view);
      const mist = `<div class="mist"><i></i><i></i><i></i><i></i><i></i><b></b></div>`;
      const cls = `seat${sight.view === 'faces-left' ? ' mirrored' : ''}${sight.empty ? ' empty' : ''}`;
      sightEl.innerHTML = other
        ? `<div class="${cls}">${other}${mist}</div>`
        : `<div class="${cls}">${getLairArt(sight.monster)}${sight.empty ? '' : `<div class="lord">${getMonsterSprite(sight.monster)}</div>`}${mist}</div>`;
    }
    // Smaller with distance; across the view by where he stands; faint out of the corner of the eye.
    const seat = sightEl.querySelector('.seat');
    seat.style.setProperty('--sight-w', `${Math.max(12, Math.round(80 / Math.pow(sight.distance, 0.95)))}%`);
    seat.style.setProperty('--sight-x', `${50 + sight.offset * 44}%`);
    seat.style.setProperty('--sight-o', sight.peripheral ? '0.45' : '1');
    sightEl.classList.remove('hidden');
  } else {
    sightEl.classList.add('hidden');
    sightEl.innerHTML = '';
    delete sightEl.dataset.key;
  }

  // Monster portrait, or at a great lair's edge, the lair itself
  const portraitEl = document.getElementById('monster-portrait');
  const monster = phase === 'combat' ? state.combat?.monster : null;
  const lairArt = phase === 'lair-warning' && state.lair ? getLairArt(state.lair.monster) : null;
  // At the Trading Post: its clerk close up while you decide, the shop while you browse.
  const shop = phase === 'interaction' && state.interaction?.type === 'shop' ? state.interaction.shop : null;
  const shopArt = shop?.kind === 'post' && typeof getShopArt === 'function' ? getShopArt(shop.mode) : null;
  // A chest, altar or fountain: the thing itself while you decide, then how it
  // turned out (until your next move). A fight that breaks out takes over.
  const inter = phase === 'interaction' ? state.interaction : null;
  const objMoment = inter?.type === 'chest' ? { kind: 'chest', moment: inter.chestTrapSpotted ? 'trapped' : 'closed' }
    : inter?.type === 'altar' || inter?.type === 'fountain' ? { kind: inter.type, moment: 'idle' }
    : phase !== 'combat' ? state.fx?.objectArt : null;
  const objArt = objMoment && !lairArt && !shopArt && typeof getObjectArt === 'function' ? getObjectArt(objMoment.kind, objMoment.moment) : null;
  const sceneArt = lairArt || shopArt || objArt;
  viewContainer.classList.toggle('lair-mode', !!lairArt);
  viewContainer.classList.toggle('shop-mode', !!(shopArt || objArt));
  portraitEl.classList.toggle('lair', !!sceneArt);
  if (!sceneArt) delete portraitEl.dataset.art;
  if (sceneArt) {
    const key = lairArt ? `lair:${state.lair.monster}` : shopArt ? `shop:${shop.mode === 'main' ? 'closeup' : 'shop'}` : `obj:${objMoment.kind}:${objMoment.moment}`;
    if (portraitEl.dataset.art !== key) { portraitEl.innerHTML = sceneArt; portraitEl.dataset.art = key; }
    delete portraitEl.dataset.monster;
    portraitEl.style.removeProperty('--sprite-scale');
    portraitEl.classList.remove('hidden');
  } else if (monster && monsterShownInScene(state)) {
    // The monster stands in the 3D scene itself (draw3D), not over it.
    portraitEl.classList.add('hidden');
    portraitEl.innerHTML = '';
  } else if (monster) {
    // (If its art is somehow missing, a dark silhouette with its name rather than nothing.)
    const sprite = (typeof getMonsterPortrait === 'function' ? getMonsterPortrait(monster) : getMonsterSprite(monster.type)) || `<svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${monster.type}"><ellipse cx="80" cy="96" rx="44" ry="52" fill="#120c0c" stroke="#3a1a1a" stroke-width="3"/><circle cx="66" cy="84" r="4" fill="#c33"/><circle cx="94" cy="84" r="4" fill="#c33"/><text x="80" y="156" text-anchor="middle" font-family="monospace" font-size="11" fill="#a99">${monster.type}</text></svg>`;
    // Only redraw for a new monster, so slow animations (the Choir's drift) carry on.
    // Only redraw for a new monster (or a new look as it's hurt), so slow animations carry on.
    if (portraitEl.dataset.monster !== monster.type || portraitEl._sprite !== sprite || !portraitEl.innerHTML) {
      portraitEl.innerHTML = sprite || '';
      portraitEl.dataset.monster = monster.type;
      portraitEl._sprite = sprite;
    }
    portraitEl.style.setProperty('--sprite-scale', getMonsterSpriteScale(monster.type));
    portraitEl.classList.toggle('hidden', !sprite);
    // The Hollow Choir: shattered masks are gone; a mask gathering a power brightens as the masks align.
    const choir = monster.type === 'Hollow Choir';
    const prepMask = { lament: 'grief', unmaking: 'blank', 'false-joy': 'delight' }[monster.choirPrep];
    portraitEl.classList.toggle('choir', choir);
    portraitEl.classList.toggle('choir-prep', choir && !!prepMask);
    for (const m of ['grief', 'rage', 'delight', 'dread', 'blank']) {
      portraitEl.classList.toggle(`broken-${m}`, choir && (monster.choirBroken || []).includes(m));
      portraitEl.classList.toggle(`prep-${m}`, choir && prepMask === m);
    }
    // An invisible Banshee is all but gone from sight; a burrowed Death Worm is under the floor.
    portraitEl.classList.toggle('vanished', (monster.invisibleTurns ?? 0) > 0);
    // The Stilled Hour: drained to a still, blue-grey photograph until time starts again.
    portraitEl.classList.toggle('time-stopped', (monster.frozenTurns ?? 0) > 0);
    portraitEl.classList.toggle('burrowed', !!monster.burrowed);
  } else {
    portraitEl.classList.add('hidden');
    portraitEl.innerHTML = '';
    portraitEl.dataset.monster = '';
  }

  playHitEffects(prev, state);
  playSounds(prev, state);
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
  mapLegend.textContent = legendAt >= 0 ? lines.slice(legendAt).map(l => l.trim()).join('\n') : '';
  const bodyLines = isMap ? lines.slice(1, legendAt >= 0 ? legendAt : undefined) : lines;
  while (isMap && bodyLines.length && bodyLines[bodyLines.length - 1] === '') bodyLines.pop();
  const msgEl = document.getElementById('messages');
  // While exploring or fighting, recent messages linger (dimmed) above the
  // newest for a few seconds, so nothing important vanishes the moment you
  // take another step; a step with nothing to say doesn't wipe them.
  const sameChar = prev?.character && state.character && prev.character.id === state.character.id;
  const logging = LOG_PHASES.includes(phase) && LOG_PHASES.includes(prev?.phase) && sameChar;
  updateMessageLog(bodyLines, logging);
  renderMessageLog(msgEl);
  msgEl.classList.toggle('map-view', phase === 'map');
  msgEl.classList.toggle('map-full', phase === 'map' && !!state.mapFull);
  msgEl.style.setProperty('--map-zoom', phase === 'map' ? MAP_ZOOM_STEPS[mapZoom] : 1);
  document.getElementById('message-area').classList.toggle('map-mode', phase === 'map');
  if (phase === 'map') centerMapOnPlayer();
  else scrollMessagesToEnd();
  updatePannable();

  // The 3D views, if chosen, draw over the classic one.
  draw3D(state);

  // Choices
  renderChoices(state.choices || [], phase, state);
  planarStepClock(state);
  updateViewStrip(state);
  updateViewButton();
  updateLadderButtons(state);
  if (phase !== 'playing' && moreOpen) setMore(false);
  // A first visit: the short how-to-play, once, when the dungeon first appears.
  if (phase === 'playing' && !helpOpen) {
    let seen = true;
    try { seen = localStorage.getItem(INTRO_KEY) === '1'; } catch { /* treat as seen */ }
    if (!seen) openHelp();
  }

  // Help line
  updateHelpLine(phase);

  // Awaiting any key
  awaitingAnyKey = ['title', 'level-intro'].includes(phase);
  showLordScene(state, prev);
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
  if (monsterShownInScene(currentState)) {
    // In the scene: the figure itself recoils (flashing the blow's colour) or lunges.
    monsterFx = { kind: cls === 'fx-lunge' ? 'lunge' : 'recoil', color: FX_COLOR[element] || '#ffffff', t0: performance.now() };
    draw3D(currentState);
    return;
  }
  const portrait = document.getElementById('monster-portrait');
  if (portrait.classList.contains('hidden')) return;
  portrait.style.setProperty('--fx', FX_COLOR[element] || '#ffffff');
  restartAnimation(portrait, cls);
}

// ─── Anaphylaxis countdown ───────────────────────────────────────────────────

let shockDeadline = null;   // when the character dies of a Manticore's sting (local clock), or null
function updateShockDisplay() {
  const el = document.getElementById('shock-display');
  if (!el) return;
  const inGame = ['playing', 'combat', 'interaction', 'resting', 'map', 'lair-warning', 'status', 'inventory'].includes(currentState.phase);
  if (shockDeadline === null || !inGame) { el.classList.add('hidden'); return; }
  const left = Math.max(0, Math.round((shockDeadline - Date.now()) / 1000));
  el.textContent = `SHOCK ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
  el.classList.remove('hidden');
  // Time's up: ask the server for the state, which brings the death with it.
  if (left === 0 && Date.now() - shockPolledAt > 3000) {
    shockPolledAt = Date.now();
    if (characterId) apiAction('resume', { characterId });
  }
}
let shockPolledAt = 0;
setInterval(updateShockDisplay, 1000);

/** Keeps the newest messages in view: the message box (not the text inside
 * it) is what scrolls. Done again after layout, so long rounds land at the end. */
function scrollMessagesToEnd() {
  const area = document.getElementById('message-area');
  area.scrollTop = area.scrollHeight;
  requestAnimationFrame(() => { area.scrollTop = area.scrollHeight; });
}

// ─── Settings ────────────────────────────────────────────────────────────────
// Per-browser options. Arrows and sound keep their own keys (V, N) and
// storage; this screen just gathers them, plus the saving-roll details.

const ROLLS_KEY = 'sevenLevels.showRolls';
let showRolls = (() => { try { return localStorage.getItem(ROLLS_KEY) !== '0'; } catch { return true; } })();
let settingsOpen = false;

// ─── The dungeon view: Classic (the server's ASCII corridor), or the 3D
// views drawn here from the scene the server sends (view3d.js).
const VIEW_KEY = 'sevenLevels.viewMode';
const VIEW_MODES = ['classic', 'ascii3d', 'painted'];
const VIEW_NAMES = { classic: 'CLASSIC', ascii3d: 'ASCII 3D', painted: 'PAINTED' };
let viewMode = (() => {
  try { const v = localStorage.getItem(VIEW_KEY); return VIEW_MODES.includes(v) ? v : 'classic'; } catch { return 'classic'; }
})();
let view3dTimer = null;

function cycleViewMode() {
  viewMode = VIEW_MODES[(VIEW_MODES.indexOf(viewMode) + 1) % VIEW_MODES.length];
  try { localStorage.setItem(VIEW_KEY, viewMode); } catch { /* per-viewer nicety only */ }
  updateViewButton();
  applyState(currentState);
}

/** Stairs Up / Down light up only with a ladder in reach (on it or beside it). */
function updateLadderButtons(state) {
  const reach = state.phase === 'playing' ? (state.ladders || { up: false, down: false }) : { up: false, down: false };
  for (const [id, on, word] of [['btn-climb-up', reach.up, 'up'], ['btn-climb-down', reach.down, 'down']]) {
    const b = document.getElementById(id);
    if (!b) continue;
    b.setAttribute('aria-disabled', String(!on));   // (not disabled: its tip still shows on hover)
    b.classList.toggle('reachable', on);
    b.dataset.tip = on ? `Climb the ladder ${word}. (${word === 'up' ? 'U' : 'D'})` : `No ladder ${word} within reach. Stand on a ladder, or beside one, to climb it.`;
  }
}

/** The View button names the view you're in. */
function updateViewButton() {
  const el = document.getElementById('view-name');
  if (el) el.textContent = { classic: 'Classic', ascii3d: 'ASCII 3D', painted: 'Painted 3D' }[viewMode] || viewMode;
}

// ─── More, Help, the strip under the view ────────────────────────────────────

let moreOpen = false;
function setMore(open) {
  moreOpen = open;
  document.getElementById('more-actions').classList.toggle('hidden', !open);
  document.getElementById('btn-more').setAttribute('aria-expanded', String(open));
}

const INTRO_KEY = 'sevenLevels.introSeen';
let helpOpen = false;
/** How to play: the essential keys, how saving works, and the full list. */
async function openHelp() {
  helpOpen = true;
  setMore(false);
  await accountReady.catch(() => {});   // (the saving note depends on whether you're signed in)
  if (!helpOpen) return;
  const guest = !account.user && !account.owner;
  const row = (keys, what) => `<div class="help-row"><span class="help-keys">${keys}</span><span>${what}</span></div>`;
  document.getElementById('help-body').innerHTML = `
    ${row('<b>↑</b> / <b>↓</b>', 'Step forward / step back')}
    ${row('<b>←</b> / <b>→</b>', 'Turn left / right, on the spot')}
    ${row('<b>M</b>', 'Map of everywhere you\u2019ve been')}
    ${row('<b>U</b> / <b>D</b>', 'Climb the stairs up / down, when you\u2019re on them')}
    ${row('<b>P</b>', 'Drink a healing potion')}
    ${row('<b>S</b>', 'Save your game')}
    ${row('<b>L</b>', 'Switch the view: Classic, ASCII 3D or Painted 3D')}
    ${row('<b>X</b>', 'More: magic, gems, rings, gear, sound, settings')}
    ${row('<b>H</b>', 'This help, any time')}
    <p class="help-note">Under the view, <b>Ways out</b> shows which way you can leave the room you're in.</p>
    <p class="help-note"><b>Saving.</b> The game keeps your place while you play, even if you close the tab and come back later.
      But anything since your last save is lost if you quit to the menu, stay away for 3 hours, or the game is updated, so press <b>S</b> now and then.
      ${guest ? 'You\u2019re playing as a guest: your characters belong to this browser. Sign up from the main menu to keep them on any device.' : 'Your characters are kept with your account, on any device.'}</p>
    <details><summary>All the keys</summary><p class="help-all">Arrows: move &amp; turn · U/D: stairs · W: rest · P: potion · B: tome · G: diamond · E: emerald · Y: Planar Step · J: rings · A: amulets · K: gear · L: view · M: map · T: status · I: inventory · S: save · R: restore last save · N: sound · V: on-screen arrows · O: settings · X: more · H: help · Q: quit</p>
      <p class="help-all">In a fight, the choices are listed under the messages (attack, spells, run and so on).</p></details>
    <div class="help-done"></div>`;
  const done = makeChoiceBtn('Enter', 'Got it');
  done.onclick = closeHelp;
  document.querySelector('#help-body .help-done').appendChild(done);
  document.getElementById('help-panel').classList.remove('hidden');
}
function closeHelp() {
  helpOpen = false;
  document.getElementById('help-panel').classList.add('hidden');
  try { localStorage.setItem(INTRO_KEY, '1'); } catch { /* shown again next time: harmless */ }
}

/** The strip under the view: which way the ways out lie. */
function updateViewStrip(state) {
  const strip = document.getElementById('view-strip');
  const show = state.phase === 'playing' && !!state.character;
  strip.classList.toggle('hidden', !show);
  if (!show) return;
  const ways = state.waysOut || [];
  const ARROW = { ahead: '↑ ahead', left: '← left', right: '→ right', behind: '↓ behind' };
  const el = document.getElementById('ways-out');
  el.textContent = ways.length ? `Ways out: ${ways.map(w => ARROW[w]).join('  ')}` : 'Ways out: none you can see';
  el.title = 'Which way you can leave the room you\u2019re in (in a corridor: which way you can step), from where you stand and face.';
  // Long unsaved? Say so where the essential keys are, until the next save.
  const hint = document.getElementById('move-hint');
  if (hint.classList.contains('saved-flash')) return;
  const mins = Math.floor((Date.now() - lastSavedAt) / 60000);
  const nudge = unsaved && mins >= SAVE_NUDGE_MINUTES;
  hint.classList.toggle('save-nudge', nudge);
  hint.innerHTML = nudge
    ? `You haven\u2019t saved for ${mins} minutes: press <b>S</b> to keep your progress`
    : '↑ forward · ↓ back · ← → turn · <b>M</b> map · <b>S</b> save · <b>H</b> help';
}

// Unsaved progress: warn before quitting to the menu without saving.
let unsaved = false, quitArmedUntil = 0;
// A gentle reminder under the view after a long while without saving (no autosave).
const SAVE_NUDGE_MINUTES = 10;
let lastSavedAt = Date.now();
const NOT_PROGRESS = new Set(['save', 'restore', 'load', 'main-menu', 'show-map', 'show-status', 'show-inventory', 'dismiss-status', 'dismiss-inventory', 'dismiss-intro', 'open-gear']);
function quitToMenu() {
  if (unsaved && Date.now() > quitArmedUntil) {
    quitArmedUntil = Date.now() + 6000;
    updateMessageLog(['You have unsaved progress.', 'Press S to save first, or Q again to leave without saving.'], true);
    renderMessageLog(document.getElementById('messages'));
    return;
  }
  quitArmedUntil = 0;
  characterId = null;
  apiAction('main-menu');
}

/** A moment's "Saved" by the Save button and under the view. */
function flashSaved() {
  const hint = document.getElementById('move-hint');
  const btn = document.getElementById('btn-save');
  hint.classList.add('saved-flash'); btn.classList.add('saved-flash');
  hint.classList.remove('save-nudge');
  hint.textContent = '✓ Game saved';
  setTimeout(() => { hint.classList.remove('saved-flash'); btn.classList.remove('saved-flash'); updateViewStrip(currentState); }, 2200);
}

// How monsters appear in the 3D views: the portrait overlay, or standing in the scene.
const MONSTER_KEY = 'sevenLevels.monsterDisplay';
let monsterInScene = (() => { try { return localStorage.getItem(MONSTER_KEY) === 'scene'; } catch { return false; } })();
// Smooth movement in the 3D views: steps glide and turns swivel.
const SMOOTH_KEY = 'sevenLevels.smoothMove';
let smoothMove = (() => { try { return localStorage.getItem(SMOOTH_KEY) !== '0'; } catch { return true; } })();
const STEP_MS = 190, TURN_MS = 170;

/** Whether the monster is drawn standing in the 3D scene right now. */
const monsterShownInScene = (state) => monsterInScene && viewMode !== 'classic' && state?.phase === 'combat' && !!state.combat?.monster;

let shownPose = null;      // the camera pose on screen: { x, y, angle, level, id }
let poseAnim = null;       // { from, to, t0, dur } while gliding or swivelling
let monsterFx = null;      // { kind: 'recoil' | 'lunge', color, t0 } for the in-scene monster

function poseNow(now) {
  if (!poseAnim) return shownPose;
  const p = Math.min(1, (now - poseAnim.t0) / poseAnim.dur);
  const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;   // ease in-out
  const { from, to } = poseAnim;
  const turn = ((to.angle - from.angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;   // the short way round
  return { ...to, x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e, angle: from.angle + turn * e, done: p >= 1 };
}

/** Where the camera should be for this state, gliding there if it moved a step or turned. */
function cameraFor3D(state, now) {
  const s = state.scene;
  const target = { x: s.x + 0.5, y: s.y + 0.5, angle: View3D.FACING_ANGLE[s.facing], level: s.level, id: state.character?.id };
  const cur = poseNow(now);
  const same = (a, b) => a && Math.abs(a.x - b.x) < 1e-6 && Math.abs(a.y - b.y) < 1e-6 && Math.abs(((a.angle - b.angle) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)) < 1e-6;
  const goal = poseAnim ? poseAnim.to : shownPose;
  if (!same(goal, target)) {
    const jump = !cur || cur.level !== target.level || cur.id !== target.id || Math.hypot(cur.x - target.x, cur.y - target.y) > 1.5;
    if (jump || !smoothMove || View3D.prefersReducedMotion()) { shownPose = target; poseAnim = null; }
    else {
      const moved = Math.hypot(cur.x - target.x, cur.y - target.y) > 0.01;
      poseAnim = { from: { ...cur }, to: target, t0: now, dur: moved ? STEP_MS : TURN_MS };
    }
  }
  const pose = poseNow(now) || target;
  if (poseAnim && pose.done) { shownPose = poseAnim.to; poseAnim = null; }
  return View3D.cameraAt(pose.x, pose.y, pose.angle);
}

/** The monster standing a step ahead in the scene, recoiling or lunging with the blows. */
function monsterObject(state, cam, now) {
  const m = state.combat.monster;
  const h = Math.min(2.6, 0.85 * (typeof getMonsterSpriteScale === 'function' ? getMonsterSpriteScale(m.type) : 1));
  // A steady distance, feet on the floor in view, drawn over any wall close
  // behind it. A towering one (Asmodeus, a Balor) stands farther back, so all
  // of it fits in view, head and horns included.
  let depth = Math.max(1.6, h * 2.1);
  let flash;
  if (monsterFx) {
    const p = (now - monsterFx.t0) / (monsterFx.kind === 'lunge' ? 320 : 300);
    if (p >= 1) monsterFx = null;
    else if (monsterFx.kind === 'lunge') depth = Math.max(0.45, depth - 0.45 * Math.sin(Math.PI * p));
    else { depth += 0.3 * Math.sin(Math.PI * p); flash = { color: monsterFx.color, alpha: 0.6 * (1 - p) }; }
  }
  return {
    kind: 'monster', type: m.type, size: { w: h, h }, noClip: true, hide: m.choirBroken || [], monster: m,
    at: [cam.x + cam.dir[0] * depth, cam.y + cam.dir[1] * depth],
    alpha: (m.invisibleTurns ?? 0) > 0 ? 0.08 : m.burrowed ? 0.45 : undefined, flash,
  };
}

/** Draws the 3D view over the classic one (or puts the classic one back). */
function draw3D(state) {
  const canvas = document.getElementById('view3d');
  const pre = document.getElementById('dungeon-view');
  const container = document.getElementById('view-container');
  const on = viewMode !== 'classic' && !!state?.scene && !!state.view && !container.classList.contains('hidden')
    && typeof View3D !== 'undefined';
  canvas.classList.toggle('hidden', !on);
  pre.classList.toggle('under-3d', on);
  if (!on) { clearTimeout(view3dTimer); view3dTimer = null; shownPose = null; poseAnim = null; return; }

  // Cover the classic view's box exactly, so everything around stays put.
  canvas.style.left = `${pre.offsetLeft}px`;
  canvas.style.top = `${pre.offsetTop}px`;
  canvas.style.width = `${pre.offsetWidth}px`;
  canvas.style.height = `${pre.offsetHeight}px`;
  const crisp = Math.min(2, window.devicePixelRatio || 1);   // full sharpness on high-density screens
  const w = Math.max(100, Math.round((pre.offsetWidth - 2) * crisp)), h = Math.max(60, Math.round((pre.offsetHeight - 2) * crisp));
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;

  const now = performance.now();
  const t = now / 1000;
  const camera = cameraFor3D(state, now);
  const extraObjects = monsterShownInScene(state) ? [monsterObject(state, camera, now)] : [];
  const opts = { sprites: SceneSprites, t, camera, extraObjects };
  if (viewMode === 'painted') {
    View3D.renderPainted(canvas, state.scene, opts);
  } else {
    const ctx = canvas.getContext('2d');
    const px = Math.round(13 * crisp);
    const font = `${px}px ${getComputedStyle(pre).fontFamily}`;
    ctx.font = font;
    View3D.renderAscii(canvas, state.scene, { ...opts, font, cellW: ctx.measureText('M').width, cellH: Math.round(px * 1.15) });
  }

  // Keep going: every frame while gliding or a blow lands, gently otherwise
  // (water, flames, breathing), and not at all when motion is reduced.
  clearTimeout(view3dTimer);
  const again = () => { if (currentState === state) draw3D(state); };
  if (poseAnim || monsterFx) { view3dTimer = setTimeout(again, 16); return; }   // ~60 frames a second
  const lively = !View3D.prefersReducedMotion() && (viewMode === 'painted' || SceneSprites.animates([...state.scene.objects, ...extraObjects]));
  if (lively) view3dTimer = setTimeout(again, 110);
}
if (typeof SceneSprites !== 'undefined') SceneSprites.onReady(() => draw3D(currentState));
window.addEventListener('resize', () => draw3D(currentState));

const SETTINGS = [
  { key: 'd', label: 'Dungeon view (L)', get: () => viewMode !== 'classic', value: () => VIEW_NAMES[viewMode], toggle: () => cycleViewMode() },
  { key: 'e', label: 'Monsters (3D views)', get: () => monsterInScene, value: () => (monsterInScene ? 'IN SCENE' : 'PORTRAIT'), toggle: () => {
      monsterInScene = !monsterInScene;
      try { localStorage.setItem(MONSTER_KEY, monsterInScene ? 'scene' : 'portrait'); } catch { /* per-viewer nicety only */ }
      applyState(currentState);
    } },
  { key: 'f', label: 'Smooth movement (3D views)', get: () => smoothMove, toggle: () => {
      smoothMove = !smoothMove;
      try { localStorage.setItem(SMOOTH_KEY, smoothMove ? '1' : '0'); } catch { /* per-viewer nicety only */ }
    } },
  { key: 'g', label: 'Monster art', get: () => monsterArtStyle === 'horror', value: () => (monsterArtStyle === 'horror' ? 'HORROR' : 'CLASSIC'), toggle: () => {
      setMonsterArtStyle(monsterArtStyle === 'horror' ? 'classic' : 'horror');
      const portrait = document.getElementById('monster-portrait');
      delete portrait.dataset.monster;   // redraw the one on screen in the new style
      delete portrait.dataset.art;
      document.getElementById('sighting').removeAttribute('data-key');
      applyState(currentState);
    } },
  { key: 'a', label: 'On-screen arrows',  get: () => arrowsShown,   toggle: () => toggleArrows() },
  { key: 'b', label: 'Show saving rolls', get: () => showRolls,     toggle: () => {
      showRolls = !showRolls;
      try { localStorage.setItem(ROLLS_KEY, showRolls ? '1' : '0'); } catch { /* storage blocked */ }
      renderMessageLog(document.getElementById('messages'));
    } },
  { key: 'c', label: 'Sound effects',     get: () => !SFX.muted,    toggle: () => toggleSound() },
];

function renderSettings() {
  const rows = document.getElementById('settings-rows');
  rows.innerHTML = '';
  for (const s of SETTINGS) {
    const btn = makeChoiceBtn(s.key.toUpperCase(), s.label);
    const val = document.createElement('span');
    val.className = s.get() ? 'val-on' : 'val-off';
    val.textContent = s.value ? s.value() : s.get() ? 'ON' : 'OFF';
    btn.appendChild(val);
    btn.onclick = () => { s.toggle(); renderSettings(); };
    rows.appendChild(btn);
  }
}

function openSettings() {
  settingsOpen = true;
  renderSettings();
  document.getElementById('settings-panel').classList.remove('hidden');
}

function closeSettings() {
  settingsOpen = false;
  document.getElementById('settings-panel').classList.add('hidden');
}

// Clicking (or tapping) anywhere off the settings panel closes it. Each
// setting is already saved when it's toggled. The click goes no further, so
// it can't also press a game button underneath.
document.addEventListener('click', (e) => {
  if (!settingsOpen || document.getElementById('settings-panel').contains(e.target)) return;
  e.preventDefault();
  e.stopPropagation();
  closeSettings();
}, true);

// ─── Message log ─────────────────────────────────────────────────────────────

const LOG_PHASES = ['playing', 'combat'];
const LOG_LINGER_MS = 5000;   // how long earlier messages stay up after something new arrives
const LOG_MAX_BLOCKS = 4;
let messageLog = [];          // [{ lines, at }], oldest first; the last is the current one

function updateMessageLog(lines, keepRecent) {
  const now = Date.now();
  const block = { lines: [...lines], at: now };
  if (!keepRecent) { messageLog = [block]; return; }
  if (lines.every(l => l === '')) return;   // nothing new to say: leave what's there
  const last = messageLog[messageLog.length - 1];
  if (last && last.lines.join('\n') === block.lines.join('\n')) { last.at = now; return; }
  messageLog = messageLog.filter(b => now - b.at < LOG_LINGER_MS);
  messageLog.push(block);
  messageLog = messageLog.slice(-LOG_MAX_BLOCKS);
}

function renderMessageLog(el) {
  el.innerHTML = '';
  messageLog.forEach((block, i) => {
    const span = document.createElement('span');
    span.className = i === messageLog.length - 1 ? 'msg-current' : 'msg-earlier';
    span.textContent = block.lines.map(displayLine).filter(l => l !== null).join('\n');
    el.appendChild(span);
  });
}

/** With saving rolls hidden, drop "(Saving roll: ...)" lines and strip the
 * "(d20: ...)" details out of sentences; the outcome text stays. */
function displayLine(line) {
  if (showRolls) return line;
  if (/^\s*\(Saving roll:[^)]*\)\s*$/.test(line)) return null;
  return line.replace(/\s*\((?:Saving roll:|d20:?\s)[^)]*\)/g, '');
}

// ─── Sound ───────────────────────────────────────────────────────────────────

let lastActionWalked = false;  // the action just sent was a step forward or back
let lastAction = '';           // the action just sent

/** Footsteps for a one-square move; a thud for walking into a wall; in a
 * fight, spells as they're cast, a monster's crushing blow (a quarter of
 * your health or more, or the killing blow), and a monster's death. */
function playSounds(prev, state) {
  const walked = lastActionWalked;
  const action = lastAction;
  lastActionWalked = false;
  lastAction = '';
  const pc = prev?.character, nc = state.character;
  const fx = state.fx || {};

  if (fx.cast === 'heal') SFX.heal();
  else if (fx.cast === 'attack') SFX.spell(fx.monster);
  const after = fx.cast ? 450 : 150;
  if (fx.monsterDied) setTimeout(() => SFX.monsterDeath(), after);
  const sameChar = pc && nc && pc.id === nc.id;

  // Cues from the engine: potions, gems, war-cries, and victory fanfares
  // (which wait for the monster's death to finish).
  for (const cue of fx.cues || []) {
    if (cue === 'gulp') SFX.gulp();
    else if (cue === 'scare') SFX.scare();
    else if (cue.startsWith('gem-')) SFX.gem(cue.slice(4));
    else if (cue.startsWith('victory-')) setTimeout(() => SFX.victory(Number(cue.slice(8))), after + 1100);
  }

  // Picking things up from a chest, tome, altar or the like: more gold or
  // more in the pack after an interaction.
  if (sameChar && action === 'interact') {
    const gems = (c) => Object.values(c.inventory?.gems || {}).reduce((a, n) => a + n, 0);
    const gained = nc.gold > pc.gold
      || (nc.inventory?.potions ?? 0) > (pc.inventory?.potions ?? 0)
      || (nc.inventory?.books ?? 0) > (pc.inventory?.books ?? 0)
      || gems(nc) > gems(pc);
    if (gained) SFX.snatch();
  }

  const killed = state.phase === 'death' && prev?.phase !== 'death';
  const crushing = sameChar && fx.monsterAttacked && state.phase !== 'death' && (pc.hp - nc.hp) >= nc.maxHp * 0.25;
  if (killed || crushing) setTimeout(() => SFX.crit(), after + 150);

  if (!walked || !pc || !nc || pc.id !== nc.id || pc.dungeonLevel !== nc.dungeonLevel) return;
  const dist = Math.abs(nc.x - pc.x) + Math.abs(nc.y - pc.y);
  if (dist === 1) SFX.step(nc.dungeonLevel);
  else if (dist === 0 && ['playing', 'map'].includes(state.phase)) SFX.bump();
}

function toggleSound() {
  SFX.setMuted(!SFX.muted);
  updateSoundButton();
}

function updateSoundButton() {
  const btn = document.getElementById('btn-sound');
  if (btn) btn.innerHTML = `Sound ${SFX.muted ? 'Off' : 'On'} <span class="key">[N]</span>`;
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

// The compass in the status bar: a dial whose needle swings to the way the
// character faces, always turning the short way round.
const FACING_ANGLE = { N: 0, E: 90, S: 180, W: 270 };
const FACING_NAME = { N: 'North', E: 'East', S: 'South', W: 'West' };
let compassAngle = null;

function compassSvg() {
  const ticks = Array.from({ length: 8 }, (_, i) => {
    const a = (i * 45 * Math.PI) / 180, major = i % 2 === 0;
    const r1 = major ? 13 : 14.5, r2 = 16.5;
    return `<line x1="${(18 + r1 * Math.sin(a)).toFixed(2)}" y1="${(18 - r1 * Math.cos(a)).toFixed(2)}" x2="${(18 + r2 * Math.sin(a)).toFixed(2)}" y2="${(18 - r2 * Math.cos(a)).toFixed(2)}" class="${major ? 'major' : 'minor'}"/>`;
  }).join('');
  return `<svg viewBox="0 0 36 36" aria-hidden="true">
    <circle cx="18" cy="18" r="17" class="bezel"/>${ticks}
    <text x="18" y="9.3" class="north">N</text>
    <g class="needle"><polygon points="18,4.5 21.2,18 14.8,18" class="tip"/><polygon points="18,31.5 21.2,18 14.8,18" class="tail"/></g>
    <circle cx="18" cy="18" r="1.8" class="hub"/>
  </svg>`;
}

function updateCompass(facing) {
  const el = document.getElementById('compass-display');
  if (!el.firstElementChild) el.innerHTML = compassSvg();
  const target = FACING_ANGLE[facing] ?? 0;
  if (compassAngle === null) compassAngle = target;
  else compassAngle += ((target - compassAngle) % 360 + 540) % 360 - 180;   // the short way round
  el.querySelector('.needle').style.transform = `rotate(${compassAngle}deg)`;
  el.title = `Facing ${FACING_NAME[facing] ?? ''}`;
  el.setAttribute('aria-label', el.title);
}

function updateStatusBar(char) {
  document.getElementById('char-name').textContent = char.name;
  document.getElementById('dungeon-level').textContent = `Level ${char.dungeonLevel}`;
  document.getElementById('char-level').textContent = `Char Lv ${char.level}`;

  const hpEl = document.getElementById('hp-display');
  hpEl.textContent = `HP: ${char.hp}/${char.maxHp}`;
  const hpRatio = char.hp / char.maxHp;
  hpEl.className = hpRatio < 0.25 ? 'crit' : hpRatio < 0.5 ? 'warn' : '';

  // A ghoul's flesh rot: which part, and how far it has spread toward fatal.
  const rot = (char.statusEffects || []).find(e => e.type === 'flesh-rot');
  const rotEl = document.getElementById('rot-display');
  if (rot) {
    const limit = rot.part === 'head' ? 30 : 45;   // GHOUL.ROT_FATAL_HEAD / ROT_FATAL_LIMB in config.ts
    rotEl.textContent = rot.doom !== undefined ? `ROT ${rot.part.toUpperCase()}: DYING` : `Rot ${rot.part} ${rot.stage ?? 0}/${limit}`;
    rotEl.className = rot.doom !== undefined ? 'doomed' : '';
  } else {
    rotEl.className = 'hidden';
  }

  // A Manticore's anaphylaxis: count down the time left, between actions too.
  const shock = (char.statusEffects || []).find(e => e.type === 'anaphylaxis');
  shockDeadline = shock ? Date.now() + (shock.value - char.playTime) * 1000 : null;
  updateShockDisplay();

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

  updateCompass(char.facing);
}

// Planar Step: a countdown under the level list. When it runs out, the
// spell chooses (a random level you've visited, at a random spot).
let planarTimer = null, planarSeen = null;
function planarStepClock(state) {
  const t = state.phase === 'interaction' && state.interaction?.type === 'teleport' ? state.interaction.teleport : null;
  if (!t) { clearInterval(planarTimer); planarTimer = null; planarSeen = null; return; }
  if (planarSeen?.startedAt !== t.startedAt) planarSeen = { startedAt: t.startedAt, until: Date.now() + PLANAR_STEP_SECONDS * 1000 };
  const area = document.getElementById('choices-area');
  const clock = document.createElement('div');
  clock.className = 'planar-clock';
  area.appendChild(clock);
  const tick = () => {
    const left = Math.max(0, Math.ceil((planarSeen.until - Date.now()) / 1000));
    clock.textContent = `The spell chooses in ${left}s`;
    if (left === 0) { clearInterval(planarTimer); planarTimer = null; apiAction('interact', { choice: 'timeout' }); }
  };
  clearInterval(planarTimer);
  planarTimer = setInterval(tick, 250);
  tick();
}
const PLANAR_STEP_SECONDS = 20;

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

  if (phase === 'asmodeus-scene') {
    // Asmodeus's ending stays on screen until the player continues.
    const btn = makeChoiceBtn('C', 'Continue');
    btn.onclick = () => apiAction('continue-scene');
    area.appendChild(btn);
    return;
  }

  if (phase === 'victory') {
    // The victory screen stays until the player chooses: play on, or leave.
    const on = makeChoiceBtn('C', 'Continue Playing (Level 1)');
    on.onclick = () => apiAction('continue-after-victory');
    area.appendChild(on);
    const btn = makeChoiceBtn('M', 'Return to Main Menu');
    btn.onclick = () => apiAction('main-menu');
    area.appendChild(btn);
    return;
  }

  if (phase === 'level-intro') {
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
    if (state.mapRevealed) {
      const reveal = makeChoiceBtn('X', state.mapShowWhole ? 'Explored Only' : 'Whole Level');
      reveal.onclick = () => apiAction('toggle-map-reveal');
      area.appendChild(reveal);
    }
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

// ─── Accounts ────────────────────────────────────────────────────────────────
// The account panel: log in, sign up, recover a forgotten password, your
// account (change password, log out, delete), and the admin's player list.

let account = { user: null, owner: false, guest: true };
let accountReady = Promise.resolve();   // settles once the page knows who's playing
let accountOpen = false;

async function refreshAccount() {
  try { account = await (await fetch('/api/auth/me')).json(); } catch { /* offline: keep what we had */ }
  if (currentState.phase === 'main-menu') renderChoices(currentState.choices || [], 'main-menu', currentState);
  return account;
}

async function authPost(path, body) {
  const r = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) });
  let data = {};
  try { data = await r.json(); } catch { /* none */ }
  return { ok: r.ok, ...data };
}

const esc = (t) => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function accountMessage(text, ok = false) {
  const el = document.getElementById('account-msg');
  el.textContent = text || '';
  el.classList.toggle('ok', ok);
}

/** Builds a form: fields [{ name, label, type }], buttons [{ text, run }], extra links. */
function accountForm(fields, buttons, links = []) {
  const body = document.getElementById('account-body');
  body.innerHTML = '';
  const inputs = {};
  for (const f of fields) {
    const label = document.createElement('label'); label.textContent = f.label; label.htmlFor = `acct-${f.name}`;
    const input = document.createElement('input');
    input.id = `acct-${f.name}`; input.type = f.type || 'text'; input.autocomplete = f.autocomplete || 'off';
    input.spellcheck = false; input.maxLength = 200;
    inputs[f.name] = input;
    body.append(label, input);
  }
  const values = () => Object.fromEntries(Object.entries(inputs).map(([k, i]) => [k, i.value]));
  const row = document.createElement('div'); row.className = 'row';
  buttons.forEach((b, i) => {
    const btn = makeChoiceBtn(b.key || String(i + 1), b.text);
    btn.onclick = () => b.run(values());
    row.appendChild(btn);
  });
  body.appendChild(row);
  if (links.length) {
    const lr = document.createElement('div'); lr.className = 'row';
    for (const l of links) { const a = document.createElement('button'); a.className = 'link'; a.textContent = l.text; a.onclick = l.run; lr.appendChild(a); }
    body.appendChild(lr);
  }
  // Enter submits with the first button.
  Object.values(inputs).forEach(i => i.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); buttons[0].run(values()); } }));
  const first = Object.values(inputs)[0];
  if (first) setTimeout(() => first.focus(), 30);
}

function openAccount(view) {
  accountOpen = true;
  document.getElementById('account-panel').classList.remove('hidden');
  accountMessage('');
  showAccountView(view || (account.user ? 'account' : 'login'));
}
function closeAccount() {
  accountOpen = false;
  document.getElementById('account-panel').classList.add('hidden');
  if (currentState.phase === 'main-menu') renderChoices(currentState.choices || [], 'main-menu', currentState);
}

// Cloudflare's "are you human" check on the sign-up form, when the server has it on.
let turnstileToken = '', turnstileWidget = null;
async function addHumanCheck() {
  let key = '';
  try { key = (await (await fetch('/api/auth/config')).json()).turnstileSiteKey || ''; } catch { /* no check */ }
  if (!key) return;
  const body = document.getElementById('account-body');
  const box = document.createElement('div');
  box.id = 'human-check';
  body.insertBefore(box, body.querySelector('.row'));
  if (!window.turnstile) {
    await new Promise((resolve) => {
      const s = document.createElement('script');
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      s.onload = resolve; s.onerror = resolve;
      document.head.appendChild(s);
    });
  }
  if (!window.turnstile || !document.getElementById('human-check')) return;
  turnstileToken = '';
  turnstileWidget = window.turnstile.render('#human-check', {
    sitekey: key, theme: 'dark',
    callback: (t) => { turnstileToken = t; },
    'expired-callback': () => { turnstileToken = ''; },
  });
}

function showRecoveryCode(code, lead) {
  const body = document.getElementById('account-body');
  body.innerHTML = `<p>${esc(lead)}</p><p>Your <b>recovery code</b>. Write it down or take a screenshot: it's the only way to reset a forgotten password yourself, and it won't be shown again.</p><div class="code">${esc(code)}</div>`;
  const row = document.createElement('div'); row.className = 'row';
  const done = makeChoiceBtn('Enter', "I've saved it");
  done.onclick = () => { closeAccount(); apiAction('main-menu'); };
  row.appendChild(done); body.appendChild(row);
}

async function afterSignIn(r) {
  await refreshAccount();
  if (r.mustChange) { showAccountView('must-change'); return; }
  closeAccount();
  apiAction('main-menu');
}

function showAccountView(view) {
  const t = document.getElementById('account-title');
  if (view === 'login') {
    t.textContent = '══ LOG IN ══';
    accountForm(
      [{ name: 'username', label: 'Username', autocomplete: 'username' }, { name: 'password', label: 'Password', type: 'password', autocomplete: 'current-password' }],
      [{ text: 'Log in', run: async (v) => {
        const r = await authPost('/api/auth/login', v);
        if (!r.ok) return accountMessage(r.error || 'Could not log in.');
        await afterSignIn(r);
      } }],
      [{ text: 'Forgot your password?', run: () => showAccountView('recover') }, { text: 'New here? Sign up', run: () => showAccountView('signup') }],
    );
  } else if (view === 'signup') {
    t.textContent = '══ SIGN UP ══';
    accountForm(
      [{ name: 'username', label: 'Username (3-20 letters, numbers, - or _)', autocomplete: 'username' },
       { name: 'password', label: 'Password (at least 8 characters)', type: 'password', autocomplete: 'new-password' },
       { name: 'again', label: 'Password again', type: 'password', autocomplete: 'new-password' }],
      [{ text: 'Create account', run: async (v) => {
        if (v.password !== v.again) return accountMessage("The two passwords don't match.");
        const r = await authPost('/api/auth/signup', { username: v.username, password: v.password, turnstileToken });
        if (!r.ok) {
          if (turnstileWidget !== null && window.turnstile) { window.turnstile.reset(turnstileWidget); turnstileToken = ''; }
          return accountMessage(r.error || 'Could not sign up.');
        }
        await refreshAccount();
        accountMessage(`Welcome, ${r.username}!${r.role === 'admin' ? ' (You are the admin.)' : ''}`, true);
        showRecoveryCode(r.recoveryCode, r.claimed ? `Your ${r.claimed} character${r.claimed === 1 ? '' : 's'} from this browser now belong${r.claimed === 1 ? 's' : ''} to your account.` : 'Your account is ready.');
      } }],
      [{ text: 'Already have an account? Log in', run: () => showAccountView('login') }],
    );
    addHumanCheck();
  } else if (view === 'recover') {
    t.textContent = '══ FORGOT YOUR PASSWORD ══';
    accountForm(
      [{ name: 'username', label: 'Username', autocomplete: 'username' }, { name: 'recoveryCode', label: 'Recovery code (from when you signed up)' },
       { name: 'newPassword', label: 'New password', type: 'password', autocomplete: 'new-password' }],
      [{ text: 'Set new password', run: async (v) => {
        const r = await authPost('/api/auth/recover', v);
        if (!r.ok) return accountMessage(r.error || 'Could not reset it.');
        await refreshAccount();
        accountMessage('Your password is changed, and you are logged in.', true);
        showRecoveryCode(r.recoveryCode, 'Your old recovery code no longer works. Here is your new one.');
      } }],
      [{ text: 'Lost your recovery code too? Message the game’s owner: they can reset it for you.', run: () => {} }, { text: 'Back to log in', run: () => showAccountView('login') }],
    );
  } else if (view === 'must-change') {
    t.textContent = '══ CHOOSE A NEW PASSWORD ══';
    accountMessage('You signed in with a temporary password. Choose your own now.');
    accountForm(
      [{ name: 'currentPassword', label: 'The temporary password', type: 'password' }, { name: 'newPassword', label: 'New password', type: 'password', autocomplete: 'new-password' }],
      [{ text: 'Save', run: async (v) => {
        const r = await authPost('/api/auth/change-password', v);
        if (!r.ok) return accountMessage(r.error || 'Could not change it.');
        await refreshAccount(); closeAccount(); apiAction('main-menu');
      } }],
    );
  } else if (view === 'delete') {
    t.textContent = '══ DELETE ACCOUNT ══';
    accountMessage('This deletes your account and all its characters, for good.');
    accountForm(
      [{ name: 'password', label: 'Your password, to confirm', type: 'password' }],
      [{ text: 'Delete forever', run: async (v) => {
        const r = await authPost('/api/auth/delete-account', v);
        if (!r.ok) return accountMessage(r.error || 'Could not delete it.');
        characterId = null; await refreshAccount(); closeAccount(); apiAction('main-menu');
      } }],
      [{ text: 'Never mind', run: () => showAccountView('account') }],
    );
  } else {
    t.textContent = '══ YOUR ACCOUNT ══';
    const u = account.user;
    if (!u) return showAccountView('login');
    accountMessage(`Signed in as ${u.username}${u.role === 'admin' ? ' (admin)' : ''}.`, true);
    accountForm(
      [{ name: 'currentPassword', label: 'Current password', type: 'password', autocomplete: 'current-password' }, { name: 'newPassword', label: 'New password', type: 'password', autocomplete: 'new-password' }],
      [{ text: 'Change password', run: async (v) => {
        const r = await authPost('/api/auth/change-password', v);
        accountMessage(r.ok ? 'Password changed. Other devices have been logged out.' : (r.error || 'Could not change it.'), r.ok);
      } },
       { text: 'Log out', run: async () => { await authPost('/api/auth/logout'); characterId = null; await refreshAccount(); closeAccount(); apiAction('main-menu'); } }],
      [{ text: 'Delete my account…', run: () => showAccountView('delete') }],
    );
    if (u.role === 'admin') showAdmin();
  }
}

/** The admin's player list, under their account page. */
async function showAdmin() {
  const r = await (await fetch('/api/admin/users')).json().catch(() => ({}));
  if (!r.users) return;
  const body = document.getElementById('account-body');
  const h = document.createElement('h3'); h.textContent = `PLAYERS (${r.users.length})`;
  const table = document.createElement('table');
  table.innerHTML = '<tr><th>Player</th><th>Chars</th><th>Joined</th><th></th></tr>';
  for (const p of r.users) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${esc(p.username)}${p.role === 'admin' ? ' ★' : ''}${p.disabled ? ' (disabled)' : ''}</td><td>${p.characters}</td><td>${new Date(p.createdAt).toLocaleDateString()}</td><td></td>`;
    if (p.role !== 'admin') {
      const reset = document.createElement('button'); reset.className = 'link'; reset.textContent = 'Reset password';
      reset.onclick = async () => {
        const x = await authPost('/api/admin/reset-password', { userId: p.id });
        accountMessage(x.ok ? `Temporary password for ${x.username}: ${x.temporaryPassword}\nSend it to them privately. They'll choose a new one when they log in.` : (x.error || 'Could not reset.'), x.ok);
      };
      const dis = document.createElement('button'); dis.className = 'link'; dis.textContent = p.disabled ? 'Enable' : 'Disable';
      dis.onclick = async () => { await authPost('/api/admin/disable', { userId: p.id, disabled: !p.disabled }); showAccountView('account'); };
      tr.lastChild.append(reset, ' ', dis);
    }
    table.appendChild(tr);
  }
  body.append(h, table);
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

  // Accounts
  if (account.user) {
    const acct = makeChoiceBtn('A', `ACCOUNT (${account.user.username})`);
    acct.onclick = () => openAccount('account');
    area.appendChild(acct);
  } else {
    const login = makeChoiceBtn('L', 'LOG IN');
    login.onclick = () => openAccount('login');
    const signup = makeChoiceBtn('U', 'SIGN UP');
    signup.onclick = () => openAccount('signup');
    area.append(login, signup);
  }
}

/** The ring menu (R in a fight, J while exploring), from the engine's ringChoices. */
function openRingMenu() {
  const rings = currentState.ringChoices || [];
  if (rings.length === 0) {
    document.getElementById('messages').textContent = 'You wear no magic rings.';
    return;
  }
  ringMenuOpen = true;
  const area = document.getElementById('choices-area');
  area.innerHTML = '';
  for (const ring of rings) {
    const btn = makeChoiceBtn(ring.key.toUpperCase(), ring.text);
    btn.onclick = () => {
      ringMenuOpen = false;
      apiAction('ring', { choice: ring.key });
    };
    area.appendChild(btn);
  }
  document.getElementById('messages').textContent = 'Choose a ring:';
}

/** The amulet menu (A while exploring), from the engine's amuletChoices. */
function openAmuletMenu() {
  const amulets = currentState.amuletChoices || [];
  if (amulets.length === 0) {
    document.getElementById('messages').textContent = 'You carry no amulets.';
    return;
  }
  amuletMenuOpen = true;
  const area = document.getElementById('choices-area');
  area.innerHTML = '';
  for (const a of amulets) {
    const btn = makeChoiceBtn(a.key.toUpperCase(), a.text);
    btn.onclick = () => {
      amuletMenuOpen = false;
      apiAction('amulet', { choice: a.key });
    };
    area.appendChild(btn);
  }
  document.getElementById('messages').textContent = 'Choose an amulet (one can be worn at a time):';
}

/** Asmodeus's endings, shown before the victory or death screen. Banished:
 * he shrinks to a spark and the rift swallows him. Triumph: he rises over
 * the fallen hero, laughing, as hellfire closes in. Each plays once, then
 * holds on its last frame until the player continues. */
function showLordScene(state, prev) {
  const el = document.getElementById('banish-scene');
  const scene = state.phase === 'asmodeus-scene' ? state.lordScene : null;
  if (!scene) {
    el.classList.add('hidden');
    el.innerHTML = '';
    el.dataset.scene = '';
    return;
  }
  if (el.dataset.scene === scene && el.innerHTML) return;
  el.dataset.scene = scene;
  el.className = `scene-${scene}`;
  const lord = getMonsterSprite('Asmodeus') || '';
  if (scene === 'banished') {
    const sparks = Array.from({ length: 18 }, (_, i) =>
      `<i style="--a:${i * 20}deg;--d:${(i % 6) * 0.35}s;--r:${90 + (i * 37) % 80}px"></i>`).join('');
    el.innerHTML = `
      <div class="rift"></div>
      <div class="rift-ring"></div>
      <div class="embers">${sparks}</div>
      <div class="shrinking-lord">${lord}</div>
      <div class="banish-flash"></div>
      <div class="banish-title">BANISHED</div>
      <div class="banish-sub">to the Nine Hells... for now</div>`;
    if (typeof SFX !== 'undefined' && SFX.banish) SFX.banish();
  } else {
    const flames = Array.from({ length: 14 }, (_, i) =>
      `<i style="--x:${(i * 7.3) % 100}%;--d:${(i % 5) * 0.27}s;--h:${55 + (i * 23) % 40}%"></i>`).join('');
    el.innerHTML = `
      <div class="hell-glow"></div>
      <div class="rising-lord"><div class="laugh">${lord}</div></div>
      <div class="hellfire">${flames}</div>
      <div class="triumph-title">YOU HAVE FALLEN</div>
      <div class="triumph-sub">"Kneel, little mortal. You always would have."</div>`;
    if (typeof SFX !== 'undefined' && SFX.triumph) SFX.triumph();
  }
  el.classList.remove('hidden');
}

function makeChoiceBtn(key, text) {
  const btn = document.createElement('button');
  btn.className = 'choice-btn';
  // As text, never HTML: labels can carry names players typed.
  const k = document.createElement('span');
  k.className = 'key';
  k.textContent = `[${key}]`;
  btn.replaceChildren(k, document.createTextNode(` ${text}`));
  return btn;
}

const SHARED_TIP = 'A shared character: free for anyone to play and mess around with. One player at a time; your progress stays with the character for the next person.';

async function showSaveList(action) {
  // Shared characters can't be deleted except by the owner, so they're left off that list.
  const chars = (await loadCharacters()).filter(c => action !== 'delete' || !c.shared || account.owner);
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
      return `[${letter}]  ${c.name.padEnd(20)} ${cls} Lv ${c.level}  Dungeon Lv ${c.dungeonLevel}  Monsters: ${c.monstersDefeated}${vic}${c.shared ? '  [SHARED: free to play]' : ''}`;
    }).join('\n');

  chars.forEach((char, i) => {
    const letter = String.fromCharCode(65 + i);
    const btn = makeChoiceBtn(letter, char.name + (char.asmodeusDefeated ? ' ★' : ''));
    btn.onclick = () => selectSaveListChar(i);
    if (char.shared) {
      const tag = document.createElement('span');
      tag.className = 'shared-tag';
      tag.textContent = 'SHARED';
      btn.appendChild(tag);
      btn.dataset.tip = SHARED_TIP;
      btn.setAttribute('aria-label', `${char.name}. ${SHARED_TIP}`);
    }
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
      hint.textContent = 'Arrows: move & turn  |  M: Map  |  S: Save  |  L: View  |  X: More  |  H: Help (all the keys)  |  Q: Quit'; break;
    case 'map':
      hint.textContent = 'Arrows: Walk  |  F: Full Floor / Centered  |  X: Whole Level / Explored (after a reveal)  |  + / −: Zoom  |  Drag or scroll to pan  |  N: Sound  |  M or Esc: Close Map'; break;
    case 'status':
      hint.textContent = 'X: Return to Game'; break;
    case 'inventory':
      hint.textContent = 'X: Return to Game'; break;
    case 'combat':
      hint.textContent = 'A: Attack  B: Spell/Skill  C: Pray  D: Run  F: Scare  E: Gem  P: Potion'; break;
    case 'interaction':
      hint.textContent = 'Choose an option above'; break;
    case 'name-entry':
      hint.textContent = 'Type your name and press Enter'; break;
    case 'char-roll':
      hint.textContent = 'A: Wizard  B: Warrior  C: Reroll'; break;
    case 'lair-warning':
      hint.textContent = 'A: Turn Back  B: Step Forward  C: Charge and Attack  D: Sneak In'; break;
    case 'death':
      hint.textContent = 'A: Revive  C: Restore Last Save  Q: Main Menu'; break;
    case 'resting':
      hint.textContent = 'Resting... press any key to stop'; break;
    case 'victory':
      hint.textContent = 'C: Continue Playing  |  M: Return to Main Menu'; break;
    case 'asmodeus-scene':
      hint.textContent = 'C: Continue'; break;
    default:
      hint.textContent = '';
  }
}

// ─── Input handling ───────────────────────────────────────────────────────────

function handleAnyKey() {
  const phase = currentState.phase;
  if (phase === 'title')       { apiAction('main-menu'); return; }
  if (phase === 'level-intro') { apiAction('dismiss-intro'); return; }
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

  if (phase === 'lair-warning') {
    if (['a', 'b', 'c', 'd'].includes(key)) apiAction('lair', { choice: key });
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
      spellMenuOpen = false;
      apiAction('spell', { choice: key });
      return;
    }
    if (gemMenuOpen) {
      gemMenuOpen = false;
      apiAction('gem', { choice: key });
      return;
    }
    if (ringMenuOpen) {
      ringMenuOpen = false;
      apiAction('ring', { choice: key });
      return;
    }
    if (key === 'r') { openRingMenu(); return; }
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

  // The help panel: Enter, Esc, H or Space puts it away.
  if (helpOpen) {
    if (['Enter', 'Escape', ' ', 'h', 'H', 'x', 'X'].includes(e.key)) { e.preventDefault(); closeHelp(); }
    return;
  }

  // The account panel takes the keyboard (its fields need typing).
  if (accountOpen) {
    if (e.key === 'Escape') { e.preventDefault(); closeAccount(); }
    return;
  }

  // The settings panel takes the keyboard while it's open.
  if (settingsOpen) {
    e.preventDefault();
    const k = e.key.toLowerCase();
    if (k === 'x' || k === 'o' || e.key === 'Escape') { closeSettings(); return; }
    const s = SETTINGS.find(x => x.key === k);
    if (s) { s.toggle(); renderSettings(); }
    return;
  }

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

  if (phase === 'victory') {
    if (key === 'c') apiAction('continue-after-victory');
    if (key === 'm') apiAction('main-menu');
    return;
  }
  if (phase === 'asmodeus-scene') {
    if (key === 'c') apiAction('continue-scene');
    return;
  }

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
    if (key === 'a' && account.user) openAccount('account');
    if (key === 'l' && !account.user) openAccount('login');
    if (key === 'u' && !account.user) openAccount('signup');
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
    if (ringMenuOpen) {
      // A ring's letter picks it; anything else puts the menu away.
      ringMenuOpen = false;
      apiAction('ring', { choice: (currentState.ringChoices || []).some(c => c.key === key) ? key : '-' });
      return;
    }
    if (amuletMenuOpen) {
      amuletMenuOpen = false;
      apiAction('amulet', { choice: (currentState.amuletChoices || []).some(c => c.key === key) ? key : '-' });
      return;
    }
    if (key === 'j') { openRingMenu(); return; }
    if (key === 'a') { openAmuletMenu(); return; }
    if (key === 'l') { cycleViewMode(); return; }
    if (key === 'k') { apiAction('open-gear'); return; }
    if (key === 'y') { apiAction('planar-step'); return; }
    if (key === 'x') { setMore(!moreOpen); return; }
    if (key === 'h' || e.key === '?') { openHelp(); return; }
    if (e.key === 'Escape' && moreOpen) { setMore(false); return; }
    if (e.key === 'ArrowUp')    apiAction('move-forward');
    if (e.key === 'ArrowDown')  apiAction('move-backward');
    if (e.key === 'ArrowLeft')  turnNow('left');
    if (e.key === 'ArrowRight') turnNow('right');
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
    if (key === 'n') toggleSound();
    if (key === 'v') toggleArrows();
    if (key === 'o') openSettings();
    if (key === 'q') quitToMenu();
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
    if (key === 'x' && currentState.mapRevealed) apiAction('toggle-map-reveal');
    if (key === 'o') openSettings();
    if (key === 'n') toggleSound();
    if (key === 'v') toggleArrows();
    if (key === '+' || key === '=') zoomMap(1);
    if (key === '-' || key === '_') zoomMap(-1);
    if (key === 'm' || key === 'escape') apiAction('dismiss-map');
    return;
  }

  if (phase === 'lair-warning') {
    if (['a', 'b', 'c', 'd'].includes(key)) apiAction('lair', { choice: key });
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
    if (ringMenuOpen) {
      if ((currentState.ringChoices || []).some(c => c.key === key)) {
        ringMenuOpen = false;
        apiAction('ring', { choice: key });
      }
      return;
    }
    if (key === 'r') { openRingMenu(); return; }
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
    if (['a','c','d','f','p','h'].includes(key)) apiAction('combat', { choice: key });
    return;
  }

  if (phase === 'interaction') {
    // Any letter on offer (a shop's lists can run long).
    if ((currentState.choices || []).some(c => c.key === key)) apiAction('interact', { choice: key });
    return;
  }
});

// ─── Button wiring ────────────────────────────────────────────────────────────

// On-screen arrows: off by default with a keyboard, on for touch screens;
// V or the Arrows button toggles them, and the browser remembers.
const ARROWS_KEY = 'sevenLevels.arrows';
let arrowsShown = (() => {
  try {
    const saved = localStorage.getItem(ARROWS_KEY);
    if (saved !== null) return saved === '1';
  } catch { /* storage blocked */ }
  return window.matchMedia?.('(pointer: coarse)').matches ?? false;
})();
function applyArrows() {
  document.getElementById('dpad')?.classList.toggle('hidden', !arrowsShown);
  const btn = document.getElementById('btn-arrows');
  if (btn) btn.innerHTML = `Arrows ${arrowsShown ? 'On' : 'Off'} <span class="key">[V]</span>`;
}
function toggleArrows() {
  arrowsShown = !arrowsShown;
  try { localStorage.setItem(ARROWS_KEY, arrowsShown ? '1' : '0'); } catch { /* storage blocked */ }
  applyArrows();
  // On the map screen the panel holds only the arrows, so show or hide it with them.
  if (currentState.phase === 'map') document.getElementById('movement-controls').classList.toggle('hidden', !arrowsShown);
}
// The arrows walk on the map screen too.
function move(action, mapDir) {
  if (currentState.phase === 'map') apiAction('map-move', { dir: mapDir });
  else if (action === 'turn-left' || action === 'turn-right') turnNow(mapDir);
  else apiAction(action);
}
document.getElementById('btn-forward')   ?.addEventListener('click', () => move('move-forward', 'forward'));
document.getElementById('btn-backward')  ?.addEventListener('click', () => move('move-backward', 'backward'));
document.getElementById('btn-turn-left') ?.addEventListener('click', () => move('turn-left', 'left'));
document.getElementById('btn-turn-right')?.addEventListener('click', () => move('turn-right', 'right'));
document.getElementById('btn-arrows')    ?.addEventListener('click', toggleArrows);
document.getElementById('btn-settings')  ?.addEventListener('click', openSettings);
applyArrows();

document.getElementById('btn-climb-up')  ?.addEventListener('click', () => apiAction('climb-up'));
document.getElementById('btn-climb-down')?.addEventListener('click', () => apiAction('climb-down'));
document.getElementById('btn-wait')      ?.addEventListener('click', () => apiAction('wait'));
document.getElementById('btn-map')       ?.addEventListener('click', () => apiAction('show-map'));
document.getElementById('btn-potion')    ?.addEventListener('click', () => apiAction('use-potion'));
document.getElementById('btn-book')      ?.addEventListener('click', () => apiAction('use-book'));
document.getElementById('btn-diamond')   ?.addEventListener('click', () => apiAction('use-diamond'));
document.getElementById('btn-emerald')   ?.addEventListener('click', () => apiAction('use-emerald'));
document.getElementById('btn-planar')    ?.addEventListener('click', () => { if (currentState.phase === 'playing') apiAction('planar-step'); });
document.getElementById('btn-view')      ?.addEventListener('click', () => cycleViewMode());
document.getElementById('btn-more')      ?.addEventListener('click', () => setMore(!moreOpen));
document.getElementById('btn-help')      ?.addEventListener('click', () => openHelp());
document.getElementById('btn-quit')      ?.addEventListener('click', () => quitToMenu());
// Using something from More puts the panel away (switches like sound and arrows leave it open).
document.getElementById('more-actions')  ?.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (b && !['btn-sound', 'btn-arrows', 'btn-help', 'btn-quit'].includes(b.id)) setMore(false);
});
// Clicking off the help panel puts it away, like the settings.
document.addEventListener('click', (e) => {
  if (!helpOpen || document.getElementById('help-panel').contains(e.target) || e.target.closest('#btn-help')) return;
  e.preventDefault(); e.stopPropagation(); closeHelp();
}, true);
updateViewButton();
document.getElementById('btn-rings')     ?.addEventListener('click', () => { if (currentState.phase === 'playing') openRingMenu(); });
document.getElementById('btn-amulets')   ?.addEventListener('click', () => { if (currentState.phase === 'playing') openAmuletMenu(); });
document.getElementById('btn-gear')      ?.addEventListener('click', () => { if (currentState.phase === 'playing') apiAction('open-gear'); });
document.getElementById('btn-status')    ?.addEventListener('click', () => apiAction('show-status'));
document.getElementById('btn-inventory') ?.addEventListener('click', () => apiAction('show-inventory'));
document.getElementById('btn-restore')   ?.addEventListener('click', () => apiAction('restore'));
document.getElementById('btn-save')      ?.addEventListener('click', () => apiAction('save'));
document.getElementById('btn-sound')     ?.addEventListener('click', toggleSound);
updateSoundButton();

// ─── Boot ─────────────────────────────────────────────────────────────────────

(async () => {
  accountReady = refreshAccount();
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

// ─── Hover help for the control panel ────────────────────────────────────────
// Rest the pointer on a control for a second and a short note says what it
// does. Any click or key press, or moving away, puts it away.
(() => {
  const TIP_DELAY_MS = 1000;
  const tip = document.createElement('div');
  tip.id = 'tooltip';
  tip.setAttribute('role', 'tooltip');
  tip.hidden = true;
  document.body.appendChild(tip);
  let timer = null;
  let over = null;

  const hide = () => { clearTimeout(timer); timer = null; tip.hidden = true; };
  const show = (el) => {
    tip.textContent = el.dataset.tip;
    tip.hidden = false;
    const r = el.getBoundingClientRect();
    const t = tip.getBoundingClientRect();
    const margin = 8;
    let left = r.left + r.width / 2 - t.width / 2;
    left = Math.max(margin, Math.min(left, window.innerWidth - t.width - margin));
    let top = r.top - t.height - 8;                         // above the control...
    if (top < margin) top = r.bottom + 8;                    // ...or below, if there's no room
    tip.style.left = `${left}px`;
    tip.style.top = `${top}px`;
  };

  document.addEventListener('mouseover', (e) => {
    const el = e.target.closest?.('[data-tip]');
    if (el === over) return;
    over = el;
    hide();
    if (el) timer = setTimeout(() => show(el), TIP_DELAY_MS);
  });
  document.addEventListener('mousedown', hide);
  document.addEventListener('keydown', hide);
  window.addEventListener('scroll', hide, true);
  window.addEventListener('blur', hide);
})();
