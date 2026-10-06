// Chests, altars, fountains, books and shops open when they're right in
// front of you, not when you step on them. Traps still need stepping on.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createMemoryDb } from '../src/database/database.js';
import { Repository } from '../src/database/repositories.js';
import { GameEngine } from '../src/core/game-engine.js';
import { canMove } from '../src/core/dungeon.js';
import type { Direction } from '../src/core/types.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any;
beforeEach(() => { db = createMemoryDb(); });
afterEach(() => { db.close(); });

const STEP: Record<Direction, [number, number]> = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
const BACK: Record<Direction, Direction> = { N: 'S', S: 'N', E: 'W', W: 'E' };

function ready() {
  const engine = new GameEngine(new Repository(db));
  engine.startNameEntry(); engine.submitName('Walker'); engine.acceptCharacter('warrior');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const e = engine as any;
  e.dismissLevelIntro(); e.phase = 'playing';
  e.char.hp = e.char.maxHp = 1e6;
  e.pace.movesSinceCombat = -1e9;           // no wandering monsters during the test
  return { engine, e };
}

/** Some thing of this type on level 1, a square next to it (n) reached through
 * an opening, the way from n to it (toward), and a square behind n (m), if any. */
function placeNear(e: { getLevel: (n: number) => { grid: never; contents: Map<string, { type: string }> } }, type: string) {
  const lvl = e.getLevel(1);
  for (const [k, c] of lvl.contents) {
    if (c.type !== type) continue;
    const [x, y] = k.split(',').map(Number);
    for (const d of ['N', 'E', 'S', 'W'] as Direction[]) {
      if (!canMove(lvl.grid, x, y, d)) continue;
      const n = { x: x + STEP[d][0], y: y + STEP[d][1] };
      if (lvl.contents.get(`${n.x},${n.y}`)) continue;
      const m = canMove(lvl.grid, n.x, n.y, d) ? { x: n.x + STEP[d][0], y: n.y + STEP[d][1] } : null;
      return { at: { x, y }, n, m: m && !lvl.contents.get(`${m.x},${m.y}`) ? m : null, toward: BACK[d], away: d };
    }
  }
  return null;
}

describe('Approaching things', () => {
  it('turning to face a chest right ahead opens it; you stay where you are', () => {
    const { engine, e } = ready();
    const p = placeNear(e, 'chest')!;
    e.char.x = p.n.x; e.char.y = p.n.y; e.char.facing = p.away;
    engine.turnRight();
    const s = engine.turnRight();
    expect(s.phase).toBe('interaction');
    expect(s.interaction?.type).toBe('chest');
    expect([e.char.x, e.char.y]).toEqual([p.n.x, p.n.y]);
  });

  it('walking up to it opens it from the next square', () => {
    const { engine, e } = ready();
    const p = placeNear(e, 'chest')!;
    if (!p.m) return;   // (no room behind on this map)
    e.char.x = p.m.x; e.char.y = p.m.y; e.char.facing = p.toward;
    const s = engine.moveForward();
    expect(s.interaction?.type).toBe('chest');
    expect([e.char.x, e.char.y]).toEqual([p.n.x, p.n.y]);
  });

  it("left alone, it stays quiet while you stand there, and you can walk over it", () => {
    const { engine, e } = ready();
    const p = placeNear(e, 'chest')!;
    e.char.x = p.n.x; e.char.y = p.n.y; e.char.facing = p.away;
    engine.turnRight(); engine.turnRight();
    expect(engine.interactionChoice('c').phase).toBe('playing');      // leave it
    for (let i = 0; i < 4; i++) engine.turnRight();                // all the way round: away and back
    expect(e.phase).toBe('playing');
    const s = engine.moveForward();                                   // onto its square
    expect([e.char.x, e.char.y]).toEqual([p.at.x, p.at.y]);
    expect(s.interaction?.type).not.toBe('chest');
  });

  it('altars and fountains open from the next square too', () => {
    for (const type of ['altar', 'fountain']) {
      const { engine, e } = ready();
      const p = placeNear(e, type);
      if (!p) continue;
      e.char.x = p.n.x; e.char.y = p.n.y; e.char.facing = p.away;
      engine.turnRight();
      expect(engine.turnRight().interaction?.type, type).toBe(type);
    }
  });

  it("a trap right ahead does nothing until you step on it", () => {
    const { engine, e } = ready();
    const p = placeNear(e, 'trap');
    if (!p) return;
    e.char.x = p.n.x; e.char.y = p.n.y; e.char.facing = p.away;
    engine.turnRight();
    expect(engine.turnRight().phase).toBe('playing');
  });
});

describe('Already in front of it', () => {
  it('stepping toward a chest you are standing before opens it instead of stepping onto it', () => {
    const { engine, e } = ready();
    const p = placeNear(e, 'chest')!;
    e.char.x = p.n.x; e.char.y = p.n.y; e.char.facing = p.toward;   // placed there, nothing triggered yet
    const s = engine.moveForward();
    expect(s.interaction?.type).toBe('chest');
    expect([e.char.x, e.char.y]).toEqual([p.n.x, p.n.y]);
    engine.interactionChoice('c');                                    // leave it
    engine.moveForward();                                             // now you walk onto it
    expect([e.char.x, e.char.y]).toEqual([p.at.x, p.at.y]);
  });
});

describe('Ladders', () => {
  it('can be climbed from beside them, not only on them; the state says which are in reach', () => {
    const { engine, e } = ready();
    const p = placeNear(e, 'ladder-down')!;
    expect(p).toBeTruthy();
    e.char.x = p.n.x; e.char.y = p.n.y;
    expect(engine.getState().ladders).toEqual({ up: false, down: true });
    const s = engine.climbDown();
    expect(e.char.dungeonLevel).toBe(2);
    expect(s.phase).not.toBe('playing-blocked');
  });

  it('too far away: no climbing, and the buttons stay dark', () => {
    const { engine, e } = ready();
    const p = placeNear(e, 'ladder-down')!;
    if (!p.m) return;
    e.char.x = p.m.x; e.char.y = p.m.y;
    expect(engine.getState().ladders?.down).toBe(false);
    expect(engine.climbDown().messages.join(' ')).toContain('no ladder leading down within reach');
    expect(e.char.dungeonLevel).toBe(1);
  });
});
