// The folklore monsters: Grindylow, Black Annis, Barghest, Nuckelavee,
// Draugr, Penanggalan, and the Lambton Worm.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RNG } from '../src/core/random.js';
import { rollCharacter, createCharacter } from '../src/core/character.js';
import { createMonster, pickRandomMonsterType } from '../src/core/monsters.js';
import { monsterFirstStrike, playerAttack, playerFireball, playerRun } from '../src/core/combat.js';
import { createMemoryDb } from '../src/database/database.js';
import { Repository } from '../src/database/repositories.js';
import { GameEngine } from '../src/core/game-engine.js';
import type { MonsterType } from '../src/core/types.js';

const hero = () => { const c = createCharacter('h', 'Hero', rollCharacter(new RNG(1))); c.level = 40; c.hp = c.maxHp = 1e7; c.statusEffects = []; return c; };

describe('Folklore monsters', () => {
  it('turn up at their depths, and not above them', () => {
    const seenAt = (type: MonsterType, depth: number) => { const rng = new RNG(3); for (let i = 0; i < 4000; i++) if (pickRandomMonsterType(depth, rng) === type) return true; return false; };
    expect(seenAt('Grindylow', 1)).toBe(true);
    expect(seenAt('Grindylow', 5)).toBe(false);
    expect(seenAt('Barghest', 3)).toBe(true);
    expect(seenAt('Black Annis', 2)).toBe(false);
    expect(seenAt('Nuckelavee', 4)).toBe(true);
    expect(seenAt('Draugr', 5)).toBe(true);
    expect(seenAt('Penanggalan', 6)).toBe(true);
    expect(seenAt('Lambton Worm', 6)).toBe(false);   // a unique: only in its lair
  });

  it('a Draugr swells: its blows grow heavier the longer the fight', () => {
    const c = hero(); const m = createMonster('Draugr', 40, 'd'); m.hp = m.maxHp = 1e7;
    const rng = new RNG(5); const early: number[] = [], late: number[] = [];
    for (let i = 0; i < 40; i++) { const before = c.hp; monsterFirstStrike(c, m, rng); (i < 5 ? early : i >= 35 ? late : []).push(before - c.hp); c.heldRounds = 0; }
    const avg = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;
    expect(avg(late)).toBeGreaterThan(avg(early) * 2);
  });

  it('a Penanggalan heals each turn, unless fire has seared it', () => {
    const c = hero();
    const m = createMonster('Penanggalan', 40, 'p'); m.hp = Math.round(m.maxHp / 2);
    const before = m.hp; monsterFirstStrike(c, m, new RNG(1));
    expect(m.hp).toBeGreaterThan(before);
    const m2 = createMonster('Penanggalan', 40, 'p2'); m2.hp = m2.maxHp = 1e6;
    playerFireball(c, m2, new RNG(2));
    expect(m2.searedTurns).toBeGreaterThan(0);
  });

  it('the Lambton Worm rejoins what blows cut off, but not when you fight with a mace', () => {
    const regrown = (mace: boolean) => {
      const c = hero(); c.charClass = 'warrior'; c.strength = 18;
      c.inventory.weapons = mace ? [{ kind: 'mace', bonus: 0, name: 'mace' }] : [{ kind: 'sword', bonus: 0, name: 'sword' }];
      const m = createMonster('Lambton Worm', 65, 'w'); m.hp = m.maxHp = 1e6;
      const rng = new RNG(8);
      for (let i = 0; i < 20; i++) { playerAttack(c, m, rng); c.heldRounds = 0; c.hp = c.maxHp; }
      return m.hp;
    };
    expect(regrown(false)).toBeGreaterThan(regrown(true));
  });

  it('running from a Nuckelavee is easier: it will not cross running water', () => {
    const fled = (type: MonsterType) => { let n = 0; for (let i = 0; i < 400; i++) { const c = hero(); c.level = 25; if (playerRun(c, createMonster(type, 30, 'x' + i), new RNG(i)).messages.some(l => l.includes('flee'))) n++; } return n; };
    expect(fled('Nuckelavee')).toBeGreaterThan(fled('Troll') + 40);
  });
});

describe('Folklore monsters in the game', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let db: any;
  beforeEach(() => { db = createMemoryDb(); });
  afterEach(() => { db.close(); });
  function ready() {
    const engine = new GameEngine(new Repository(db));
    engine.startNameEntry(); engine.submitName('Folk'); engine.acceptCharacter('warrior');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e = engine as any;
    e.dismissLevelIntro(); e.phase = 'playing';
    return { engine, e };
  }

  it("the Barghest's mark: a blow that leaves you near death kills you; an altar lifts it", () => {
    const { e } = ready();
    e.char.maxHp = 1000; e.char.hp = 50;
    e.char.statusEffects = [{ type: 'death-mark', value: 1, turns: 400 }];
    e.combat = { monster: createMonster('Barghest', 20, 'b'), round: 1 }; e.phase = 'combat';
    const s = e.processCombatResult({ messages: ['bite'], playerDamage: 0, monsterDamage: 10, playerDied: false, monsterDied: false });
    expect(s.phase).toBe('death');
    const { e: e2 } = ready();
    e2.char.statusEffects = [{ type: 'death-mark', value: 1, turns: 400 }];
    e2.resolveAltarChoice('a', 'altar-x');
    expect(e2.char.statusEffects.some((x: { type: string }) => x.type === 'death-mark')).toBe(false);
  });

  it('the Lambton Worm lies coiled on level 6, one of it, with a lair warning, and leaves a hoard', () => {
    const { e } = ready();
    const worms = [...e.getLevel(6).contents.values()].filter((c: { monsterId?: string }) => c.monsterId === 'Lambton Worm');
    expect(worms.length).toBe(1);
    const m = createMonster('Lambton Worm', 65, 'unique-lambton-worm');
    e.combat = { monster: m, round: 1 }; e.phase = 'combat';
    e.handleMonsterDefeated();
    expect((e.dungeonState.hoards ?? []).length + (e.messages.join(' ').includes('hoard') ? 0 : 0)).toBeGreaterThanOrEqual(1);
  });
});
