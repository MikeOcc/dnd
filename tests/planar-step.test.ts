// Planar Step: wizards of level 60+ (or anyone with a moonstone) step to any
// level they've visited, never in a fight. No choice in time: the spell picks.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createMemoryDb } from '../src/database/database.js';
import { Repository } from '../src/database/repositories.js';
import { GameEngine } from '../src/core/game-engine.js';
import { SPELLS } from '../src/core/config.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any;
beforeEach(() => { db = createMemoryDb(); });
afterEach(() => { db.close(); vi.useRealTimers(); });

function ready(cls: 'wizard' | 'warrior', level: number) {
  const engine = new GameEngine(new Repository(db));
  engine.startNameEntry(); engine.submitName('Elminster'); engine.acceptCharacter(cls);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const e = engine as any;
  e.dismissLevelIntro(); e.phase = 'playing';
  e.char.level = level; e.char.intelligence = 18;
  e.char.dungeonLevel = 5;
  for (const n of [1, 3, 5]) { e.char.introsSeen.push(n); e.dungeonState.visitedCells.add(`${n}:1,1`); }
  return { engine, e };
}

describe('Planar Step', () => {
  it('a level-60 wizard chooses from the levels they have walked, and arrives at its top', () => {
    const { engine, e } = ready('wizard', SPELLS.PLANAR_STEP_LEVEL);
    let s = engine.planarStep();
    expect(s.phase).toBe('interaction');
    expect(s.choices!.map(c => c.text)).toEqual(['Level 1', 'Level 3', 'Cancel']);
    s = engine.interactionChoice('b');
    expect(s.phase).toBe('playing');
    expect(e.char.dungeonLevel).toBe(3);
    const lvl = e.getLevel(3);
    expect([e.char.x, e.char.y]).toEqual([lvl.entrance.x, lvl.entrance.y]);
    expect(s.messages.join(' ')).toContain('top of Level 3');
  });

  it('a wizard below 60, or a warrior, can’t cast it without a moonstone', () => {
    for (const [cls, lvl] of [['wizard', SPELLS.PLANAR_STEP_LEVEL - 1], ['warrior', 99]] as const) {
      const { engine, e } = ready(cls, lvl);
      const s = engine.planarStep();
      expect(s.phase).toBe('playing');
      expect(e.char.dungeonLevel).toBe(5);
    }
  });

  it('never in a fight', () => {
    const { engine, e } = ready('wizard', 80);
    e.phase = 'combat';
    const s = engine.planarStep();
    expect(s.messages.join(' ')).toContain('Not in the middle of a fight');
    expect(e.interaction).toBeNull();
  });

  it('a moonstone lets anyone step once, and crumbles; cancelling keeps it', () => {
    const { engine, e } = ready('warrior', 40);
    e.char.inventory.gems.moonstone = 1;
    engine.planarStep();
    engine.interactionChoice('c');                       // Cancel
    expect(e.char.inventory.gems.moonstone).toBe(1);
    expect(e.char.dungeonLevel).toBe(5);
    engine.planarStep();
    const s = engine.interactionChoice('a');
    expect(e.char.dungeonLevel).toBe(1);
    expect(e.char.inventory.gems.moonstone).toBe(0);
    expect(s.messages.join(' ')).toContain('crumbles');
  });

  it('a wizard who knows the spell keeps their moonstone', () => {
    const { engine, e } = ready('wizard', 60);
    e.char.inventory.gems.moonstone = 2;
    engine.planarStep(); engine.interactionChoice('a');
    expect(e.char.inventory.gems.moonstone).toBe(2);
  });

  it('no choice in time: the spell picks a visited level, at a random spot', () => {
    const { engine, e } = ready('wizard', 70);
    const seen = new Set<number>();
    for (let i = 0; i < 30; i++) {
      e.char.dungeonLevel = 5; e.phase = 'playing';
      engine.planarStep();
      const s = engine.interactionChoice('timeout');
      expect(s.phase).toBe('playing');
      expect([1, 3]).toContain(e.char.dungeonLevel);
      expect(s.messages.join(' ')).toContain('the spell chooses for you');
      seen.add(e.char.dungeonLevel);
    }
    expect(seen.size).toBe(2);
  });

  it('a choice that comes too late counts as no choice', () => {
    vi.useFakeTimers();
    const { engine, e } = ready('wizard', 70);
    engine.planarStep();
    vi.advanceTimersByTime((SPELLS.PLANAR_STEP_SECONDS + 5) * 1000);
    const s = engine.interactionChoice('c');               // would have been Cancel
    expect(s.messages.join(' ')).toContain('the spell chooses for you');
    expect([1, 3]).toContain(e.char.dungeonLevel);
  });

  it('nowhere else visited: nothing happens', () => {
    const { engine, e } = ready('wizard', 70);
    e.dungeonState.visitedCells.clear();
    const s = engine.planarStep();
    expect(s.phase).toBe('playing');
    expect(s.messages.join(' ')).toContain('nowhere else');
  });
});
