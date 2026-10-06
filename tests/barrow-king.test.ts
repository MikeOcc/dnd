// The Barrow-King: a unique undead king in his barrow on level 5.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createMemoryDb } from '../src/database/database.js';
import { Repository } from '../src/database/repositories.js';
import { GameEngine } from '../src/core/game-engine.js';
import { createMonster } from '../src/core/monsters.js';
import { playerAttack, lightFactor } from '../src/core/combat.js';
import { RNG } from '../src/core/random.js';
import { rollCharacter, createCharacter } from '../src/core/character.js';
import { LAIRS } from '../src/content/lair-text.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any;
beforeEach(() => { db = createMemoryDb(); });
afterEach(() => { db.close(); });

function ready() {
  const engine = new GameEngine(new Repository(db));
  engine.startNameEntry(); engine.submitName('Delver'); engine.acceptCharacter('warrior');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const e = engine as any;
  e.dismissLevelIntro(); e.phase = 'playing';
  e.char.hp = e.char.maxHp = 1e7; e.char.level = 60;
  return { engine, e };
}

describe('The Barrow-King', () => {
  it('lies in his barrow on level 5, one of him, with a lair warning', () => {
    const { e } = ready();
    const kings = [...e.getLevel(5).contents.values()].filter((c: { monsterId?: string }) => c.monsterId === 'Barrow-King');
    expect(kings.length).toBe(1);
    expect(LAIRS['Barrow-King']?.warning.join(' ')).toContain('barrow');
  });

  it('calls up a barrow-wight that fights beside him, and casts the barrow-dark', () => {
    const c = createCharacter('h', 'Hero', rollCharacter(new RNG(1))); c.level = 60; c.hp = c.maxHp = 1e7; c.strength = 18; c.dexterity = 18;
    let wight = false, dark = false;
    for (let i = 0; i < 60 && !(wight && dark); i++) {
      const m = createMonster('Barrow-King', 60, 'bk'); m.hp = m.maxHp = 1e7;
      const r = playerAttack(c, m, new RNG(i));
      if (m.wight) wight = true;
      if ((m.darkTurns ?? 0) > 0) dark = true;
      void r;
    }
    expect(wight).toBe(true); expect(dark).toBe(true);
  });

  it('in the barrow-dark your blows land less often', () => {
    const c = createCharacter('h', 'Hero', rollCharacter(new RNG(1))); c.level = 30; c.hp = c.maxHp = 1e7;
    const hits = (dark: boolean) => {
      let n = 0;
      for (let i = 0; i < 400; i++) { const m = createMonster('Barrow-King', 60, 'b' + i); m.hp = m.maxHp = 1e7; if (dark) m.darkTurns = 9; playerAttack(c, m, new RNG(i)); if (m.hp < 1e7) n++; }
      return n;
    };
    expect(hits(true)).toBeLessThan(hits(false) * 0.9);
  });

  it('light burns him (he is undead)', () => {
    expect(lightFactor(createMonster('Barrow-King', 60, 'b'))).toBe(1.5);
  });

  it('falls, and leaves his grave goods: gold, and his blade or his crown', () => {
    const { engine, e } = ready();
    const m = createMonster('Barrow-King', 60, 'unique-barrow-king'); m.wight = true;
    e.combat = { monster: m, round: 1 }; e.phase = 'combat';
    e.handleMonsterDefeated();
    expect(e.messages.join(' ')).toContain('grave goods');
    expect(e.messages.join(' ')).toContain('crumbles');
    e.combat = null; e.phase = 'playing';
    const h = e.dungeonState.hoards[0];
    // Face the chest and open it.
    for (const d of ['N', 'E', 'S', 'W']) { e.char.facing = d; const [dx, dy] = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] }[d]!; if (e.char.x + dx === h.x && e.char.y + dy === h.y) break; }
    const gold = e.char.gold;
    engine.moveForward();
    const s = engine.interactionChoice('a');
    expect(e.char.gold).toBeGreaterThan(gold);
    expect(s.messages.join(' ')).toMatch(/crown|wrapped in rotted silk/);
  });
});
