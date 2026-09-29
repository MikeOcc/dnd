import type { Express, Request, Response } from 'express';
import type { DatabaseSync } from 'node:sqlite';
import { Repository } from '../database/repositories.js';
import { GameEngine } from '../core/game-engine.js';

// One engine per character session (keyed by characterId)
const sessions = new Map<string, GameEngine>();

function getOrCreateEngine(repo: Repository, characterId?: string): GameEngine {
  const key = characterId ?? '__new__';
  if (!sessions.has(key)) {
    sessions.set(key, new GameEngine(repo));
  }
  return sessions.get(key)!;
}

function freshEngine(repo: Repository): GameEngine {
  const engine = new GameEngine(repo);
  return engine;
}

export function setupRoutes(app: Express, db: DatabaseSync): void {
  const repo = new Repository(db);

  // ─── Character management ─────────────────────────────────────────────────

  app.get('/api/characters', (_req: Request, res: Response) => {
    try {
      const list = repo.listCharacters();
      res.json({ characters: list });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.delete('/api/characters/:id', (req: Request, res: Response) => {
    try {
      repo.deleteCharacter(req.params.id);
      sessions.delete(req.params.id);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: String(err) });
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

      let engine: GameEngine;

      // A page reload picks the live game back up, unsaved progress and all
      // (the game only writes to disk when the player saves). Falls back to
      // the last save if the server no longer has that game in memory.
      if (action === 'resume' && payload?.characterId) {
        const live = sessions.get(payload.characterId);
        if (live && live.getCharacter()?.id === payload.characterId) {
          return res.json({ state: live.getState(), characterId: payload.characterId });
        }
        engine = freshEngine(repo);
        sessions.set(payload.characterId, engine);
        const state = engine.loadCharacter(payload.characterId);
        return res.json({ state, characterId: payload.characterId });
      }

      if (action === 'load' && payload?.characterId) {
        // Always create fresh engine for load
        engine = freshEngine(repo);
        sessions.set(payload.characterId, engine);
        const state = engine.loadCharacter(payload.characterId);
        return res.json({ state, characterId: payload.characterId });
      }

      if (action === 'new-character-start') {
        engine = freshEngine(repo);
        sessions.set('__pending__', engine);
        const state = engine.startNameEntry();
        return res.json({ state, characterId: '__pending__' });
      }

      // The server lost this game (it restarted while the page stayed open):
      // pick the character back up from their last save rather than handing
      // the action to a blank engine, which would dump them at the title.
      if (characterId && characterId !== '__pending__' && !sessions.has(characterId)) {
        const revived = freshEngine(repo);
        const state = revived.loadCharacter(characterId);
        if (revived.getCharacter()) {
          sessions.set(characterId, revived);
          state.messages = [
            'The dungeon shimmers and settles. (The game server restarted, so you are back at your last save.)',
            '',
            ...state.messages,
          ];
          return res.json({ state, characterId });
        }
      }

      engine = getOrCreateEngine(repo, characterId ?? '__pending__');

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
            sessions.set(char.id, engine);
            sessions.delete('__pending__');
            return res.json({ state, characterId: char.id });
          }
          break;
        }
        case 'main-menu':
          state = engine.showMainMenu();
          break;
        case 'save':
          state = engine.saveAndPrompt();
          break;
        case 'dismiss-save-prompt':
          state = engine.dismissSavePrompt();
          break;
        case 'move-forward':
          state = engine.moveForward();
          break;
        case 'move-backward':
          state = engine.moveBackward();
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
        case 'interact':
          state = engine.interactionChoice(payload?.choice ?? '');
          break;
        case 'dismiss-intro':
          state = engine.dismissLevelIntro();
          break;
        case 'dismiss-death':
          state = engine.dismissDeath();
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
      res.status(500).json({ error: String(err) });
    }
  });

  // Initial state
  app.get('/api/state', (req: Request, res: Response) => {
    const { characterId } = req.query as { characterId?: string };
    if (!characterId || !sessions.has(characterId)) {
      const engine = freshEngine(repo);
      const state = engine.showMainMenu();
      return res.json({ state });
    }
    const engine = sessions.get(characterId)!;
    res.json({ state: engine.getState(), characterId });
  });
}
