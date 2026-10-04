import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RNG } from '../src/core/random.js';
import { rollCharacter, createCharacter } from '../src/core/character.js';
import { createMonster } from '../src/core/monsters.js';
import { monsterFirstStrike, playerBackfireRing, playerChangeRing } from '../src/core/combat.js';
import { createMemoryDb } from '../src/database/database.js';
import { Repository } from '../src/database/repositories.js';
import { GameEngine } from '../src/core/game-engine.js';
import { RINGS } from '../src/core/config.js';
import { RING_CHESTS } from '../src/content/rings.js';
import type { Character, MonsterType, RingId } from '../src/core/types.js';

function hero(ring?: RingId): Character {
  const c = createCharacter('h', 'Hero', rollCharacter(new RNG(1)));
  c.level = 40; c.hp = c.maxHp = 1e6; c.statusEffects = [];
  c.inventory.rings = ['fire', 'cold', 'evil', 'undead', 'backfire'];
  c.inventory.activeRing = ring;
  return c;
}

/** Total damage taken over many monster turns, with and without a ring (same rolls). */
function damageOver(type: MonsterType, level: number, ring: RingId | undefined, turns = 300) {
  const c = hero(ring);
  const rng = new RNG(77);
  let taken = 0, glows = 0;
  for (let i = 0; i < turns; i++) {
    const m = createMonster(type, level, 'm' + i);
    c.hp = c.maxHp; c.heldRounds = 0; c.statusEffects = [];
    const r = monsterFirstStrike(c, m, rng);
    taken += c.maxHp - c.hp;
    if (r.messages.some(l => l.includes('turns aside'))) glows++;
  }
  return { taken, glows };
}

describe('Warding rings', () => {
  it('the ruby ring turns aside most fire damage', () => {
    const bare = damageOver('Red Dragon', 60, undefined);
    const ruby = damageOver('Red Dragon', 60, 'fire');
    expect(ruby.glows).toBeGreaterThan(0);
    expect(ruby.taken).toBeLessThan(bare.taken);
  });

  it('the aquamarine ring guards against cold, and does nothing against fire', () => {
    expect(damageOver('White Dragon', 60, 'cold').taken).toBeLessThan(damageOver('White Dragon', 60, undefined).taken);
    expect(damageOver('Red Dragon', 60, 'cold').glows).toBe(0);
  });

  it('the onyx ring blunts evil creatures, not others', () => {
    const fiend = damageOver('Pit Fiend', 70, 'evil');
    expect(fiend.taken).toBeLessThan(damageOver('Pit Fiend', 70, undefined).taken * 0.7);
    expect(damageOver('Troll', 30, 'evil').glows).toBe(0);
  });

  it('the rose quartz ring blunts undead and stops their level drain', () => {
    expect(damageOver('Skeleton', 20, 'undead').taken).toBeLessThan(damageOver('Skeleton', 20, undefined).taken * 0.7);
    const drained = (ring?: RingId) => {
      const c = hero(ring); const rng = new RNG(5); let drops = 0;
      for (let i = 0; i < 600; i++) {
        c.hp = c.maxHp; c.level = 40;
        const r = monsterFirstStrike(c, createMonster('Wight', 99, 'w' + i), rng);
        if (c.level < 40) drops++;
        if (ring) expect(r.messages.join(' ')).not.toContain('YOU HAVE BEEN DRAINED');
      }
      return drops;
    };
    expect(drained()).toBeGreaterThan(0);
    expect(drained('undead')).toBe(0);
  });

  it('only the ring in use wards: a fire ring worn but not in use does nothing', () => {
    expect(damageOver('Red Dragon', 60, 'cold').taken).toBe(damageOver('Red Dragon', 60, undefined).taken);
  });

  it('changing rings mid-fight costs the turn, and the new ring wards at once', () => {
    const c = hero('cold');
    const r = playerChangeRing(c, createMonster('Goblin', 3, 'g'), new RNG(3), 'fire');
    expect(c.inventory.activeRing).toBe('fire');
    expect(r.messages[0]).toContain('ruby ring');
    expect(r.playerDamage).toBe(0);
  });
});

describe('The green diamond ring', () => {
  it("turns even Asmodeus's lizard curse back on him: you're untouched, he takes half", () => {
    const c = hero(); c.hp = c.maxHp = 2000;
    const m = createMonster('Asmodeus', 90, 'a'); m.hp = m.maxHp = 1e6;
    const rng = new RNG(1); rng.float = () => 0;   // the curse, for certain
    const r = playerBackfireRing(c, m, rng);
    expect(r.playerDied).toBe(false);
    expect(c.hp).toBe(2000);
    expect(m.hp).toBe(1e6 - 2000 * RINGS.BACKFIRE_FRACTION);
    expect(r.messages.join(' ')).toContain('turns back on it');
    expect(m.backfirePrimed).toBe(false);
    expect(m.backfireUsed).toBe(true);
  });

  it('waits through a stunned turn for an attack that lands', () => {
    const c = hero(); const m = createMonster('Troll', 30, 't'); m.hp = m.maxHp = 1e6;
    m.stunnedTurns = 1;
    playerBackfireRing(c, m, new RNG(2));
    expect(m.backfirePrimed).toBe(true);
    const hpBefore = c.hp;
    for (let i = 0; i < 20 && m.backfirePrimed; i++) monsterFirstStrike(c, m, new RNG(10 + i));
    expect(m.backfirePrimed).toBe(false);
    expect(c.hp).toBe(hpBefore);
    expect(m.hp).toBeLessThan(1e6);
  });
});

describe('Rings in the game', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let db: any;
  beforeEach(() => { db = createMemoryDb(); });
  afterEach(() => { db.close(); });

  function ready() {
    const engine = new GameEngine(new Repository(db));
    engine.startNameEntry(); engine.submitName('RingHero'); engine.acceptCharacter();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e = engine as any;
    e.dismissLevelIntro();
    return { engine, e };
  }

  it('each ring lies in its own chest on its level, and opening it puts the ring on', () => {
    const { engine, e } = ready();
    for (const lvl of [2, 3, 4, 5, 6, 7]) {
      e.loadLevelIntoCache(lvl);
      const contents = e.getLevel(lvl).contents;
      for (const rc of RING_CHESTS.filter(r => r.level === lvl)) {
        expect([...contents.values()].some((c: { id: string }) => c.id === 'ring-' + rc.id)).toBe(true);
      }
    }
    e.char.inventory.rings = []; e.char.inventory.activeRing = undefined;
    e.interaction = { type: 'chest', contentId: 'ring-fire', choices: [] };
    e.phase = 'interaction';
    const state = e.openChest('ring-fire', null, []);
    expect(e.char.inventory.rings).toEqual(['fire']);
    expect(e.char.inventory.activeRing).toBe('fire');
    expect(state.messages.join(' ')).toContain('ruby ring');
    expect(engine.getState().ringChoices?.[0].text).toContain('[IN USE]');
  });

  it('while exploring, choosing a ring is free; Cancel leaves them be', () => {
    const { engine, e } = ready();
    e.char.inventory.rings = ['fire', 'cold'];
    e.char.inventory.activeRing = 'fire';
    engine.ringAction('b');
    expect(e.char.inventory.activeRing).toBe('cold');
    engine.ringAction('c');   // Cancel
    expect(e.char.inventory.activeRing).toBe('cold');
  });

  it('the star sapphire teleports out of a fight; after 3 uses the ring crumbles and the next takes over', () => {
    const { engine, e } = ready();
    e.char.inventory.starRings = 2;
    e.char.inventory.starCharges = 1;
    e.beginCombat(createMonster('Troll', 10, 't'));
    e.phase = 'combat';
    const key = engine.getState().ringChoices!.find(c => c.text.startsWith('Star sapphire'))!.key;
    const state = engine.ringAction(key);
    expect(state.phase).not.toBe('combat');
    expect(e.char.inventory.starRings).toBe(1);
    expect(e.char.inventory.starCharges).toBe(RINGS.STAR_CHARGES);
    expect(state.messages.join(' ')).toContain('crumbles');
  });

  it('the green diamond works once a fight', () => {
    const { engine, e } = ready();
    e.char.inventory.rings = ['backfire'];
    e.char.hp = e.char.maxHp = 1e6;
    const m = createMonster('Troll', 10, 't'); m.hp = m.maxHp = 1e6;
    e.beginCombat(m); e.phase = 'combat';
    engine.ringAction('a');
    expect(m.backfireUsed).toBe(true);
    m.backfirePrimed = false;
    if (e.phase === 'combat') {
      const s = engine.ringAction('a');
      expect(s.messages.join(' ')).toContain('spent for this fight');
    }
  });
});
