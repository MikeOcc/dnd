import type { Express, Request, Response } from 'express';
import type { DatabaseSync } from 'node:sqlite';
import { Repository } from '../database/repositories.js';
import { GameEngine } from '../core/game-engine.js';
import { ACCESS, visitorOf, canUse, canDelete, allowRequest, ownerSignIn, ownerSignOut, useAccounts, type Visitor } from './access.js';
import { Accounts } from '../database/accounts.js';
import { setupAuthRoutes, sameSiteOnly } from './auth.js';

// One engine per character being played (keyed by characterId), held by the
// visitor playing it. A character being made is keyed 'pending:<visitor>'.
interface Session { engine: GameEngine; holder: string; lastSeen: number }
const sessions = new Map<string, Session>();

function freshEngine(repo: Repository): GameEngine {
  return new GameEngine(repo);
}

/** Someone else is at this character, and recently. */
function heldByAnother(key: string, v: Visitor): boolean {
  const s = sessions.get(key);
  if (!s || s.holder === v.id || v.owner) return false;
  return Date.now() - s.lastSeen < ACCESS.LOCK_MINUTES * 60_000;
}

function hold(key: string, engine: GameEngine, v: Visitor): void {
  engine.debugAids = v.owner;   // testing aids are the owner's alone
  sessions.set(key, { engine, holder: v.id, lastSeen: Date.now() });
}

/** Drops games idle for hours (and, if there are too many, the stalest). */
function sweepSessions(): void {
  const now = Date.now();
  for (const [k, s] of sessions) if (now - s.lastSeen > ACCESS.SESSION_IDLE_HOURS * 3_600_000) sessions.delete(k);
  if (sessions.size > ACCESS.MAX_SESSIONS) {
    const oldest = [...sessions.entries()].sort((a, b) => a[1].lastSeen - b[1].lastSeen);
    for (const [k] of oldest.slice(0, sessions.size - ACCESS.MAX_SESSIONS)) sessions.delete(k);
  }
}
setInterval(sweepSessions, 10 * 60_000).unref();

/** The main menu with a message, for a request that can't go ahead. */
function refused(repo: Repository, ...lines: string[]) {
  const state = freshEngine(repo).showMainMenu();
  state.messages = [...lines, '', ...state.messages];
  return { state, characterId: null };
}

export function setupRoutes(app: Express, db: DatabaseSync): void {
  const repo = new Repository(db);

  // ─── Accounts (see auth.ts) ────────────────────────────────────────────────
  const accounts = new Accounts(db);
  useAccounts(accounts);
  app.use('/api', sameSiteOnly);
  setupAuthRoutes(app, accounts, {
    // Signing in carries a guest's game in progress over to the account.
    moveHolder: (from, to) => { for (const s of sessions.values()) if (s.holder === from) s.holder = to; },
  });

  // ─── The owner signing in (needed when hosted, where everyone is remote) ──
  app.get('/owner', ownerSignIn);
  app.get('/owner/sign-out', ownerSignOut);

  // ─── Character management ─────────────────────────────────────────────────

  app.get('/api/characters', (req: Request, res: Response) => {
    try {
      const v = visitorOf(req, res);
      const list = repo.listCharacters(owner => canUse(v, owner));
      res.json({ characters: list });
    } catch (err) {
      console.error(err); res.status(500).json({ error: 'Something went wrong on the server.' });
    }
  });

  app.delete('/api/characters/:id', (req: Request, res: Response) => {
    try {
      const v = visitorOf(req, res);
      if (!canDelete(v, repo.getOwner(req.params.id))) return res.status(403).json({ error: 'You can only delete characters you made.' });
      if (heldByAnother(req.params.id, v)) return res.status(409).json({ error: 'Someone is playing that character right now.' });
      repo.deleteCharacter(req.params.id);
      sessions.delete(req.params.id);
      res.json({ ok: true });
    } catch (err) {
      console.error(err); res.status(500).json({ error: 'Something went wrong on the server.' });
    }
  });

  // ─── Game actions ─────────────────────────────────────────────────────────
  //
  // All game actions are POST /api/action with body: { characterId?, action, payload? }
  // Response: { state }
  //
  // Actions:
  //   new-character-start    — start name entry
  //   submit-name            — payload: { name }
  //   reroll                 — reroll character
  //   accept                 — accept character (generates dungeon, saves)
  //   load                   — load existing character; payload: { characterId }
  //   move-forward
  //   move-backward
  //   turn-left
  //   turn-right
  //   climb-up
  //   climb-down
  //   combat                 — payload: { choice: 'a'|'b'|'c'|'d'|'e' }
  //   spell                  — payload: { choice: 'a'|'b'|'c' }
  //   gem                    — payload: { choice: 'a'|'b'|'c'|'d'|'e' }
  //   interact               — payload: { choice }
  //   dismiss-intro
  //   dismiss-death
  //   main-menu

  app.post('/api/action', (req: Request, res: Response) => {
    try {
      const { characterId, action, payload } = req.body as {
        characterId?: string;
        action: string;
        payload?: Record<string, string>;
      };

      const v = visitorOf(req, res);
      if (!allowRequest(v)) return res.status(429).json({ error: 'Slow down a little.' });
      let engine: GameEngine;

      // A page reload picks the live game back up, unsaved progress and all
      // (the game only writes to disk when the player saves). Falls back to
      // the last save if the server no longer has that game in memory.
      if ((action === 'resume' || action === 'load') && payload?.characterId) {
        const id = payload.characterId;
        if (!canUse(v, repo.getOwner(id))) return res.json(refused(repo, 'That character is not available.'));
        if (heldByAnother(id, v)) return res.json(refused(repo, 'Someone else is playing that character right now. Try another, or come back later.'));
        const live = sessions.get(id);
        if (action === 'resume' && live && live.engine.getCharacter()?.id === id) {
          hold(id, live.engine, v);
          return res.json({ state: live.engine.getState(), characterId: id });
        }
        engine = freshEngine(repo);
        hold(id, engine, v);
        const state = engine.loadCharacter(id);
        return res.json({ state, characterId: id });
      }

      const pendingKey = `pending:${v.id}`;
      if (action === 'new-character-start') {
        if (!v.owner && repo.countOwnedBy(v.id) >= ACCESS.MAX_CHARACTERS_PER_GUEST) {
          return res.json(refused(repo, `You already have ${ACCESS.MAX_CHARACTERS_PER_GUEST} characters. Delete one to make another.`));
        }
        engine = freshEngine(repo);
        hold(pendingKey, engine, v);
        const state = engine.startNameEntry();
        return res.json({ state, characterId: '__pending__' });
      }

      const key = !characterId || characterId === '__pending__' ? pendingKey : characterId;
      if (key !== pendingKey) {
        if (!canUse(v, repo.getOwner(key))) return res.json(refused(repo, 'That character is not available.'));
        if (heldByAnother(key, v)) return res.json(refused(repo, 'Someone else has picked up this character. Your game here has ended.'));
      }

      // The server lost this game (it restarted while the page stayed open):
      // pick the character back up from their last save rather than handing
      // the action to a blank engine, which would dump them at the title.
      if (key !== pendingKey && !sessions.has(key)) {
        const revived = freshEngine(repo);
        const state = revived.loadCharacter(key);
        if (revived.getCharacter()) {
          hold(key, revived, v);
          state.messages = [
            'The dungeon shimmers and settles. (The game server restarted, so you are back at your last save.)',
            '',
            ...state.messages,
          ];
          return res.json({ state, characterId: key });
        }
      }

      const session = sessions.get(key);
      if (!session) return res.json(refused(repo));
      session.lastSeen = Date.now();
      session.holder = v.id;
      session.engine.debugAids = v.owner;
      engine = session.engine;

      let state;
      switch (action) {
        case 'submit-name':
          state = engine.submitName(payload?.name ?? 'Unknown');
          break;
        case 'reroll':
          state = engine.rerollCharacter();
          break;
        case 'accept': {
          state = engine.acceptCharacter(payload?.charClass === 'warrior' ? 'warrior' : 'wizard');
          const char = engine.getCharacter();
          if (char) {
            // The owner's new characters are the owner's; a guest's are theirs alone.
            repo.setOwner(char.id, v.owner ? 'owner' : v.id);
            hold(char.id, engine, v);
            sessions.delete(pendingKey);
            return res.json({ state, characterId: char.id });
          }
          break;
        }
        case 'main-menu':
          // Back at the menu, the character is free for someone else.
          state = engine.showMainMenu();
          sessions.delete(key);
          return res.json({ state, characterId: null });
        case 'save':
          state = engine.saveGame();
          break;
        case 'move-forward':
          state = engine.moveForward();
          break;
        case 'move-backward':
          state = engine.moveBackward();
          break;
        case 'face':
          state = engine.face(String(payload?.facing ?? ''));
          break;
        case 'turn-left':
          state = engine.turnLeft();
          break;
        case 'turn-right':
          state = engine.turnRight();
          break;
        case 'climb-up':
          state = engine.climbUp();
          break;
        case 'climb-down':
          state = engine.climbDown();
          break;
        case 'combat':
          state = engine.combatAction(payload?.choice ?? '');
          break;
        case 'spell':
          state = engine.spellAction(payload?.choice ?? '');
          break;
        case 'gem':
          state = engine.gemAction(payload?.choice ?? '');
          break;
        case 'ring':
          state = engine.ringAction(payload?.choice ?? '');
          break;
        case 'amulet':
          state = engine.amuletAction(payload?.choice ?? '');
          break;
        case 'planar-step':
          state = engine.planarStep();
          break;
        case 'open-gear':
          state = engine.openGear();
          break;
        case 'continue-scene':
          state = engine.continueLordScene();
          break;
        case 'continue-after-victory':
          state = engine.continueAfterVictory();
          break;
        case 'interact':
          state = engine.interactionChoice(payload?.choice ?? '');
          break;
        case 'dismiss-intro':
          state = engine.dismissLevelIntro();
          break;
        case 'lair':
          state = engine.lairChoice(payload?.choice ?? '');
          break;
        case 'dismiss-death':
          state = engine.dismissDeath();
          break;
        case 'revive':
          state = engine.reviveAfterDeath();
          break;
        case 'show-status':
          state = engine.showStatus();
          break;
        case 'dismiss-status':
          state = engine.dismissStatus();
          break;
        case 'show-inventory':
          state = engine.showInventory();
          break;
        case 'dismiss-inventory':
          state = engine.dismissInventory();
          break;
        case 'restore':
          state = engine.restoreFromSave();
          break;
        case 'use-potion':
          state = engine.usePot();
          break;
        case 'use-book':
          state = engine.useBook();
          break;
        case 'use-diamond':
          state = engine.useDiamondExploring();
          break;
        case 'use-emerald':
          state = engine.useEmeraldExploring();
          break;
        case 'wait':
          state = engine.startResting();
          break;
        case 'rest-tick':
          state = engine.restTick();
          break;
        case 'stop-resting':
          state = engine.stopResting();
          break;
        case 'show-map':
          state = engine.showMap();
          break;
        case 'map-move': {
          const dir = payload?.dir;
          state = dir === 'forward' || dir === 'backward' || dir === 'left' || dir === 'right'
            ? engine.mapMove(dir)
            : engine.getState();
          break;
        }
        case 'toggle-map-view':
          state = engine.toggleMapView();
          break;
        case 'toggle-map-reveal':
          state = engine.toggleMapReveal();
          break;
        case 'dismiss-map':
          state = engine.dismissMap();
          break;
        default:
          return res.status(400).json({ error: `Unknown action: ${action}` });
      }

      if (!state) state = engine.getState();
      res.json({ state, characterId });
    } catch (err) {
      console.error(err);
      console.error(err); res.status(500).json({ error: 'Something went wrong on the server.' });
    }
  });

  // Initial state
  app.get('/api/state', (req: Request, res: Response) => {
    const { characterId } = req.query as { characterId?: string };
    const v = visitorOf(req, res);
    const s = characterId ? sessions.get(characterId) : undefined;
    if (!characterId || !s || s.holder !== v.id) {
      const engine = freshEngine(repo);
      const state = engine.showMainMenu();
      return res.json({ state });
    }
    res.json({ state: s.engine.getState(), characterId });
  });
}
