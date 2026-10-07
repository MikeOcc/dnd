// Instant turning: each update while exploring carries the view for every
// facing, and 'face' turns the character outright.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createMemoryDb } from '../src/database/database.js';
import { Repository } from '../src/database/repositories.js';
import { GameEngine } from '../src/core/game-engine.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any;
beforeEach(() => { db = createMemoryDb(); });
afterEach(() => { db.close(); });

function ready() {
  const engine = new GameEngine(new Repository(db));
  engine.startNameEntry(); engine.submitName('Turner'); engine.acceptCharacter('wizard');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const e = engine as any;
  e.dismissLevelIntro(); e.phase = 'playing';
  return { engine, e };
}

describe('Turning without waiting', () => {
  it('every update while exploring has the view for each facing, matching what turning would show', () => {
    const { engine } = ready();
    const s = engine.getState();
    expect(Object.keys(s.turnViews!).sort()).toEqual(['E', 'N', 'S', 'W']);
    expect(s.turnViews![s.character!.facing]!.view).toEqual(s.view);
    const right = s.turnViews![{ N: 'E', E: 'S', S: 'W', W: 'N' }[s.character!.facing] as 'N']!.view;
    expect(engine.turnRight().view).toEqual(right);
  });

  it('a request for the views changes nothing', () => {
    const { engine, e } = ready();
    const before = e.char.facing;
    engine.getState(); engine.getState();
    expect(e.char.facing).toBe(before);
  });

  it("'face' turns the character outright, only while exploring, and only to a real direction", () => {
    const { engine, e } = ready();
    expect(engine.face('S').character!.facing).toBe('S');
    expect(engine.face('up').character!.facing).toBe('S');
    e.phase = 'combat';
    engine.face('N');
    expect(e.char.facing).toBe('S');
  });

  it('no turn views outside exploring', () => {
    const { engine, e } = ready();
    e.phase = 'status';
    expect(engine.getState().turnViews).toBeUndefined();
  });
});

describe('Levelling up', () => {
  it('heals you fully', async () => {
    const { checkLevelUp } = await import('../src/core/character.js');
    const { RNG } = await import('../src/core/random.js');
    const { e } = ready();
    e.char.hp = 1; e.char.xp = 1e9;
    const r = checkLevelUp(e.char, new RNG(1));
    expect(r.didLevel).toBe(true);
    expect(e.char.hp).toBe(e.char.maxHp);
  });
});

describe('Pictures for chests, altars and fountains', () => {
  it('says how each turned out', () => {
    const { engine, e } = ready();
    e.char.hp = e.char.maxHp = 1e6;
    expect(e.openChest('c-plain', null, []).fx?.objectArt).toEqual({ kind: 'chest', moment: 'open' });
    e.phase = 'playing';
    expect(e.openChest('c-trapped', 'blade', []).fx?.objectArt).toEqual({ kind: 'chest', moment: 'boom' });
    e.phase = 'playing';
    expect(e.resolveAltarChoice('a', 'alt-1').fx?.objectArt).toEqual({ kind: 'altar', moment: 'blessed' });
    const moments = new Set<string>();
    e.char.dungeonLevel = 4;   // (deeper than the Grindylows that lurk in shallow fountains)
    for (let i = 0; i < 300; i++) { e.phase = 'playing'; moments.add(e.resolveFountainChoice('a', `f-${i}`).fx?.objectArt?.moment); }
    expect([...moments].sort()).toEqual(['refreshed', 'tainted']);
    void engine;
  });

  it('leaving it alone shows no outcome', () => {
    const { e } = ready();
    expect(e.resolveAltarChoice('b', 'alt-2').fx?.objectArt).toBeUndefined();
  });
});
