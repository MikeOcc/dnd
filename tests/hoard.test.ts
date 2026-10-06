// A dragon's hoard: a chest left where it fell, opened once.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createMemoryDb } from '../src/database/database.js';
import { Repository } from '../src/database/repositories.js';
import { GameEngine } from '../src/core/game-engine.js';
import { createMonster } from '../src/core/monsters.js';
import { canMove } from '../src/core/dungeon.js';
import { RNG } from '../src/core/random.js';
import type { Direction, MonsterType } from '../src/core/types.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any;
beforeEach(() => { db = createMemoryDb(); });
afterEach(() => { db.close(); });

function ready() {
  const repo = new Repository(db);
  const engine = new GameEngine(repo);
  engine.startNameEntry(); engine.submitName('Slayer'); engine.acceptCharacter('warrior');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const e = engine as any;
  e.dismissLevelIntro(); e.phase = 'playing';
  e.char.hp = e.char.maxHp = 1e6;
  e.pace.movesSinceCombat = -1e9;
  // Face an open way with nothing there, so the hoard can land in front.
  const lvl = e.getLevel(1);
  for (const d of ['N', 'E', 'S', 'W'] as Direction[]) {
    const [dx, dy] = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] }[d];
    if (canMove(lvl.grid, e.char.x, e.char.y, d) && !lvl.contents.has(`${e.char.x + dx},${e.char.y + dy}`)) { e.char.facing = d; break; }
  }
  return { repo, engine, e };
}

/** Kills a dragon of this level in front of you until it leaves a hoard. */
function slayUntilHoard(e: any, type: MonsterType = 'Red Dragon', level = 12) {   // eslint-disable-line @typescript-eslint/no-explicit-any
  for (let i = 0; i < 40; i++) {
    e.combat = { monster: createMonster(type, level, `dragon-${i}`), round: 1 };
    e.phase = 'combat';
    e.rng = new RNG(1000 + i);
    e.handleMonsterDefeated();
    e.combat = null; e.phase = 'playing';
    if ((e.dungeonState.hoards ?? []).length) return e.dungeonState.hoards[0];
  }
  return null;
}

describe('Dragon hoards', () => {
  it('a slain dragon sometimes leaves its hoard just ahead; stepping toward it opens it, once', () => {
    const { engine, e } = ready();
    const h = slayUntilHoard(e)!;
    expect(h).toBeTruthy();
    expect(e.messages.join(' ')).toContain('Its hoard');
    const gold = e.char.gold;
    let s = engine.moveForward();
    expect(s.interaction?.type).toBe('chest');
    s = engine.interactionChoice('a');
    expect(s.messages.join(' ')).toContain('hoard spills out');
    expect(e.char.gold).toBeGreaterThan(gold + 12 * 30);
    expect(e.dungeonState.hoards).toEqual([]);
    expect(e.getLevel(1).contents.has(`${h.x},${h.y}`)).toBe(true);   // the empty chest stays
    expect(e.dungeonState.openedChests.has(h.id)).toBe(true);
  });

  it('about half the time, and never trapped', () => {
    const { e } = ready();
    let left = 0;
    for (let i = 0; i < 200; i++) {
      e.dungeonState.hoards = []; e.getLevel(1).contents.forEach((c: { id: string }, k: string) => { if (c.id.startsWith('hoard-')) e.getLevel(1).contents.delete(k); });
      e.combat = { monster: createMonster('Blue Dragon', 10, 'd' + i), round: 1 }; e.phase = 'combat'; e.rng = new RNG(i);
      e.handleMonsterDefeated(); e.combat = null; e.phase = 'playing';
      left += (e.dungeonState.hoards ?? []).length;
    }
    expect(left).toBeGreaterThan(70); expect(left).toBeLessThan(130);
  });

  it('kept across a save and a reload', () => {
    const { repo, engine, e } = ready();
    const h = slayUntilHoard(e)!;
    engine.saveGame();
    const again = new GameEngine(repo);
    again.loadCharacter(e.char.id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((again as any).getLevel(1).contents.get(`${h.x},${h.y}`)?.id).toBe(h.id);
  });

  it('a Restore takes back a hoard you never saved', () => {
    const { engine, e } = ready();
    engine.saveGame();
    const h = slayUntilHoard(e)!;
    engine.restoreFromSave();
    expect(e.getLevel(1).contents.has(`${h.x},${h.y}`)).toBe(false);
  });

  it('a tough dragon may guard a singular magic item', () => {
    let items = 0;
    for (let i = 0; i < 30; i++) {
      const { engine, e } = ready();
      const h = slayUntilHoard(e, 'Red Dragon', 30);
      if (!h) continue;
      engine.moveForward();
      const msg = engine.interactionChoice('a').messages.join(' ');
      if (/ring|amulet|enchanted/i.test(msg)) items++;
      db.close(); db = createMemoryDb();
    }
    expect(items).toBeGreaterThan(5);
  });
});
