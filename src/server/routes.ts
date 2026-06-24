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
  //   combat                 — payload: { choice: 'a'|'b'|'c'|'d' }
  //   spell                  — payload: { choice: 'a'|'b'|'c' }
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
          state = engine.acceptCharacter();
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
        case 'restore':
          state = engine.restoreFromSave();
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
