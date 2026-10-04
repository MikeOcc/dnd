import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RNG } from '../src/core/random.js';
import { rollCharacter, createCharacter, getEffectiveStats, wearCursedAmulet } from '../src/core/character.js';
import { resolveChest } from '../src/core/encounters.js';
import { createMemoryDb } from '../src/database/database.js';
import { Repository } from '../src/database/repositories.js';
import { GameEngine } from '../src/core/game-engine.js';
import { AMULETS } from '../src/core/config.js';
import type { Amulet } from '../src/core/types.js';

const amulet = (over: Partial<Amulet> = {}): Amulet => ({ stat: 'wisdom', bonus: 2, cursed: false, look: 'jade', ...over });

describe('Amulets: what they do', () => {
  it('a worn amulet raises its attribute; a cursed one lowers it; one carried does nothing', () => {
    const c = createCharacter('h', 'Hero', rollCharacter(new RNG(1)));
    const wis = c.wisdom;
    c.inventory.amulets = [amulet()];
    expect(getEffectiveStats(c).wisdom).toBe(wis);
    c.inventory.amulets[0].worn = true;
    expect(getEffectiveStats(c).wisdom).toBe(wis + 2);
    c.inventory.amulets[0].cursed = true;
    expect(getEffectiveStats(c).wisdom).toBe(Math.max(1, wis - 2));
    expect(c.wisdom).toBe(wis);   // the base attribute is untouched
  });

  it('chests hold them now and then, a quarter of them cursed, and never more than the pack can take', () => {
    const rng = new RNG(31);
    let found = 0, cursed = 0;
    const n = 20000;
    for (let i = 0; i < n; i++) {
      const c = createCharacter('h', 'Hero', rollCharacter(new RNG(2))); c.dungeonLevel = 3;
      resolveChest(c, rng);
      const a = c.inventory.amulets?.[0];
      if (a) {
        found++; if (a.cursed) cursed++;
        expect(a.bonus).toBeGreaterThanOrEqual(1); expect(a.bonus).toBeLessThanOrEqual(3);
        expect(a.known).toBeFalsy(); expect(a.worn).toBeFalsy();
      }
    }
    expect(found / n).toBeGreaterThan(0.03); expect(found / n).toBeLessThan(0.05);
    expect(cursed / found).toBeGreaterThan(0.18); expect(cursed / found).toBeLessThan(0.32);

    const full = createCharacter('h', 'Hero', rollCharacter(new RNG(3)));
    full.inventory.amulets = Array.from({ length: AMULETS.MAX_CARRIED }, () => amulet());
    for (let i = 0; i < 3000; i++) resolveChest(full, rng);
    expect(full.inventory.amulets.length).toBe(AMULETS.MAX_CARRIED);
  });
});

describe('Amulets in play', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let db: any;
  beforeEach(() => { db = createMemoryDb(); });
  afterEach(() => { db.close(); });

  function ready(amulets: Amulet[]) {
    const engine = new GameEngine(new Repository(db));
    engine.startNameEntry(); engine.submitName('AmuletHero'); engine.acceptCharacter();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e = engine as any;
    e.dismissLevelIntro();
    e.phase = 'playing';
    e.char.inventory.amulets = amulets;
    return { engine, e };
  }

  it('putting one on reveals it; putting on another takes the first off: one at a time', () => {
    const { engine, e } = ready([amulet({ stat: 'strength', bonus: 3 }), amulet({ stat: 'wisdom', bonus: 1, look: 'bone' })]);
    expect(engine.getState().amuletChoices?.[0].text).toContain('(unknown)');
    const s = engine.amuletAction('a');
    expect(s.messages.join(' ')).toContain('+3 Strength');
    expect(e.char.inventory.amulets[0]).toMatchObject({ worn: true, known: true });
    engine.amuletAction('b');
    expect(e.char.inventory.amulets.filter((a: Amulet) => a.worn).length).toBe(1);
    expect(e.char.inventory.amulets[1].worn).toBe(true);
    engine.amuletAction('b');   // take it off
    expect(e.char.inventory.amulets.some((a: Amulet) => a.worn)).toBe(false);
  });

  it("a cursed amulet won't come off, nor make way for another", () => {
    const { engine, e } = ready([amulet({ cursed: true }), amulet({ stat: 'dexterity' })]);
    expect(engine.amuletAction('a').messages.join(' ')).toContain('CURSED');
    expect(engine.amuletAction('a').messages.join(' ')).toContain("won't come off");
    engine.amuletAction('b');
    expect(e.char.inventory.amulets[0].worn).toBe(true);
    expect(e.char.inventory.amulets[1].worn).toBeFalsy();
  });

  for (const [how, act] of [
    ['a fountain', (e: any) => { e.interaction = { type: 'fountain', contentId: 'f1', choices: [] }; e.phase = 'interaction'; return e.resolveFountainChoice('a', 'f1'); }],
    ['an altar', (e: any) => { e.interaction = { type: 'altar', contentId: 'a1', choices: [] }; e.phase = 'interaction'; return e.resolveAltarChoice('a', 'a1'); }],
    ['an emerald', (e: any) => { e.char.inventory.gems.emerald = 1; e.char.intelligence = 18; return e.useEmeraldExploring(); }],
  ] as const) {
    it(`${how} breaks the curse, and the amulet crumbles`, () => {
      const { engine, e } = ready([amulet({ cursed: true })]);
      engine.amuletAction('a');
      const s = act(e);
      expect(s.messages.join(' ')).toContain('curse is broken');
      expect(e.char.inventory.amulets.length).toBe(0);
    });
  }

  it('an emerald spent on a curse gives no ward', () => {
    const { engine, e } = ready([amulet({ cursed: true })]);
    engine.amuletAction('a');
    e.char.inventory.gems.emerald = 1; e.char.intelligence = 18;
    e.useEmeraldExploring();
    expect(e.char.statusEffects.some((s: { type: string }) => s.type === 'warded')).toBe(false);
    expect(e.char.inventory.gems.emerald).toBe(0);
  });
});

describe('Dropping amulets, and cursed ones that snap', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let db: any;
  beforeEach(() => { db = createMemoryDb(); });
  afterEach(() => { db.close(); });

  function ready(amulets: Amulet[]) {
    const engine = new GameEngine(new Repository(db));
    engine.startNameEntry(); engine.submitName('AmuletHero'); engine.acceptCharacter();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e = engine as any;
    e.dismissLevelIntro(); e.phase = 'playing';
    e.char.inventory.amulets = amulets;
    return { engine, e };
  }

  it('an ordinary amulet can be dropped, worn or not', () => {
    const { engine, e } = ready([amulet({ worn: true, known: true }), amulet({ stat: 'dexterity' })]);
    expect(engine.getState().amuletChoices?.some(c => c.key === '2' && c.text.startsWith('Drop'))).toBe(true);
    engine.amuletAction('1');
    expect(e.char.inventory.amulets.length).toBe(1);
    engine.amuletAction('1');
    expect(e.char.inventory.amulets.length).toBe(0);
  });

  it("a cursed amulet can't be dropped, worn or carried, and trying gives it away", () => {
    const { engine, e } = ready([amulet({ cursed: true }), amulet({ cursed: true, worn: true, known: true })]);
    const s = engine.amuletAction('1');
    expect(s.messages.join(' ')).toContain('CURSED');
    expect(e.char.inventory.amulets[0].known).toBe(true);
    engine.amuletAction('2');
    expect(e.char.inventory.amulets.length).toBe(2);
  });

  it('a fountain cleanses every cursed amulet carried, worn or not', () => {
    const { e } = ready([amulet({ cursed: true }), amulet({ stat: 'dexterity' })]);
    e.interaction = { type: 'fountain', contentId: 'f1', choices: [] }; e.phase = 'interaction';
    const s = e.resolveFountainChoice('a', 'f1');
    expect(s.messages.join(' ')).toContain('crumble');
    expect(e.char.inventory.amulets).toEqual([amulet({ stat: 'dexterity' })]);
  });

  it('a worn cursed amulet snaps about 1% of turns; other amulets never do', () => {
    const rng = new RNG(5);
    let snaps = 0; const n = 20000;
    for (let i = 0; i < n; i++) {
      const c = createCharacter('h', 'Hero', rollCharacter(new RNG(1)));
      c.inventory.amulets = [amulet({ cursed: true, worn: true })];
      if (wearCursedAmulet(c, rng).length) { snaps++; expect(c.inventory.amulets.length).toBe(0); }
    }
    expect(snaps / n).toBeGreaterThan(0.007); expect(snaps / n).toBeLessThan(0.013);
    const c = createCharacter('h', 'Hero', rollCharacter(new RNG(1)));
    c.inventory.amulets = [amulet({ worn: true }), amulet({ cursed: true })];
    for (let i = 0; i < 2000; i++) expect(wearCursedAmulet(c, rng)).toEqual([]);
  });

  it('walking with a cursed amulet on, it eventually snaps', () => {
    const { engine, e } = ready([amulet({ cursed: true, worn: true, known: true })]);
    e.rng.float = () => 0.001;   // the snap, for certain
    e.encounterCheck = () => null;
    for (let i = 0; i < 4 && e.char.inventory.amulets.length; i++) { engine.turnLeft(); engine.moveForward(); e.phase = 'playing'; e.combat = null; }
    expect(e.char.inventory.amulets.length).toBe(0);
  });
});
