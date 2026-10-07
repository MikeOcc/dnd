// The Pilgrim's Pearl, and fountains washing out flesh rot.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createMemoryDb } from '../src/database/database.js';
import { Repository } from '../src/database/repositories.js';
import { GameEngine } from '../src/core/game-engine.js';
import { createMonster } from '../src/core/monsters.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any;
beforeEach(() => { db = createMemoryDb(); });
afterEach(() => { db.close(); });

function ready(level = 4) {
  const repo = new Repository(db);
  const engine = new GameEngine(repo);
  engine.startNameEntry(); engine.submitName('Pilgrim'); engine.acceptCharacter('warrior');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const e = engine as any;
  e.dismissLevelIntro(); e.phase = 'playing';
  e.char.level = 3;   // (too low for gem magic: the Pearl works anyway)
  e.char.dungeonLevel = level; e.loadLevelIntoCache(level);
  const lvl = e.getLevel(level); e.char.x = lvl.entrance.x; e.char.y = lvl.entrance.y;
  e.char.inventory.gems.pearl = 2;
  e.pace.movesSinceCombat = -1e9;
  return { repo, engine, e };
}

const rot = (stage = 10) => ({ type: 'flesh-rot', value: 3, turns: 40, part: 'right leg', stage });

describe("The Pilgrim's Pearl", () => {
  it('sets you before the nearest unused fountain or altar, and it opens', () => {
    const { engine, e } = ready();
    const s = engine.usePearlExploring();
    expect(e.char.inventory.gems.pearl).toBe(1);
    expect(['fountain', 'altar']).toContain(s.interaction?.type);
  });

  it('works mid-fight, ending it', () => {
    const { engine, e } = ready();
    e.combat = { monster: createMonster('Troll', 10, 't'), round: 1 }; e.phase = 'combat';
    const s = engine.gemAction('f');
    expect(e.combat).toBeNull();
    expect(['fountain', 'altar']).toContain(s.interaction?.type);
  });

  it('with none left on the level, a fountain wells up, and it stays after a save and reload', () => {
    const { repo, engine, e } = ready();
    const lvl = e.getLevel(4);
    for (const c of lvl.contents.values()) { if (c.type === 'fountain') e.dungeonState.usedFountains.add(c.id); if (c.type === 'altar') e.dungeonState.usedAltars.add(c.id); }
    const s = engine.usePearlExploring();
    expect(s.messages.join(' ')).toContain('the Pearl makes some');
    expect(s.interaction?.type).toBe('fountain');
    const made = e.dungeonState.hoards.find((h: { kind?: string }) => h.kind === 'fountain');
    engine.saveGame();
    const again = new GameEngine(repo); again.loadCharacter(e.char.id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((again as any).getLevel(4).contents.get(`${made.x},${made.y}`)?.type).toBe('fountain');
  });
});

describe('Fountains and flesh rot', () => {
  it("a fountain washes out the rot, if it hasn't gone too far", () => {
    const { e } = ready();
    e.char.statusEffects = [rot()];
    e.resolveFountainChoice('a', 'f-1');
    expect(e.char.statusEffects.some((x: { type: string }) => x.type === 'flesh-rot')).toBe(false);
    e.char.statusEffects = [{ ...rot(45), doom: 1 }];
    e.resolveFountainChoice('a', 'f-2');
    expect(e.char.statusEffects.some((x: { type: string }) => x.type === 'flesh-rot')).toBe(true);
  });
});
