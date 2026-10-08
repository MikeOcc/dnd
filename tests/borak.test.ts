// The Borak: a star ruby ring's beam of light, once a fight; damage by the
// monster's level and how it takes light.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RNG } from '../src/core/random.js';
import { createMonster } from '../src/core/monsters.js';
import { playerBorak, lightFactor } from '../src/core/combat.js';
import { rollCharacter, createCharacter } from '../src/core/character.js';
import { createMemoryDb } from '../src/database/database.js';
import { Repository } from '../src/database/repositories.js';
import { GameEngine } from '../src/core/game-engine.js';

const hero = () => { const c = createCharacter('h', 'Balzor', rollCharacter(new RNG(1))); c.level = 100; c.hp = c.maxHp = 1e6; return c; };
const avg = (type: Parameters<typeof createMonster>[0], level: number) => {
  let t = 0;
  for (let i = 0; i < 300; i++) { const m = createMonster(type, level, 'm' + i); m.hp = m.maxHp = 1e7; t += playerBorak(hero(), m, new RNG(i)).playerDamage; }
  return t / 300;
};

describe('The Borak', () => {
  it('hits for the monster’s level × 5-10', () => {
    const a = avg('Troll', 40);
    expect(a).toBeGreaterThan(40 * 6.5); expect(a).toBeLessThan(40 * 8.5);
  });

  it('undead burn; creatures of light, mirrors and Asmodeus shrug much of it off', () => {
    expect(lightFactor(createMonster('Vampire', 30, 'v'))).toBeGreaterThan(1.5);
    expect(lightFactor(createMonster('Skeleton', 10, 's'))).toBe(1.5);
    expect(lightFactor(createMonster('Phoenix', 30, 'p'))).toBeLessThan(1);
    expect(lightFactor(createMonster('Asmodeus', 70, 'a'))).toBe(0.4);
    expect(avg('Vampire', 30)).toBeGreaterThan(avg('Troll', 30) * 1.6);
  });
});

describe('The Borak in a fight', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let db: any;
  beforeEach(() => { db = createMemoryDb(); });
  afterEach(() => { db.close(); });

  it('fires from the ring menu once a fight, then lies dark until the next', () => {
    const engine = new GameEngine(new Repository(db));
    engine.startNameEntry(); engine.submitName('Balzor'); engine.acceptCharacter('wizard');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e = engine as any;
    e.dismissLevelIntro(); e.char.hp = e.char.maxHp = 1e6;
    e.char.inventory.rings = ['borak']; e.char.inventory.readiedRing = 'borak';
    const m = createMonster('Giant', 30, 'g'); m.hp = m.maxHp = 1e6;   // (not a Troll: it would regenerate)
    e.combat = { monster: m, round: 1 }; e.phase = 'combat';
    const key = engine.getState().ringChoices!.find((c: { text: string }) => c.text.includes('Borak'))!.key;
    const s = engine.ringAction(key);
    expect(s.messages.join(' ')).toContain('beam of white-hot light');
    expect(m.hp).toBeLessThan(1e6);
    expect(engine.ringAction(key).messages.join(' ')).toContain('gone dark');
  });

  it('then needs 15 minutes of play before it burns again, even in a new fight', () => {
    const engine = new GameEngine(new Repository(db));
    engine.startNameEntry(); engine.submitName('Balzor'); engine.acceptCharacter('wizard');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e = engine as any;
    e.dismissLevelIntro(); e.char.hp = e.char.maxHp = 1e6;
    e.char.inventory.rings = ['borak']; e.char.inventory.readiedRing = 'borak';
    const fight = () => { const m = createMonster('Giant', 30, 'g' + Math.random()); m.hp = m.maxHp = 1e6; e.combat = { monster: m, round: 1 }; e.phase = 'combat'; return m; };
    fight();
    const key = engine.getState().ringChoices!.find((c: { text: string }) => c.text.includes('Borak'))!.key;
    engine.ringAction(key);
    const m2 = fight();
    const s = engine.ringAction(key);
    expect(s.messages.join(' ')).toContain('still dim');
    expect(m2.hp).toBe(1e6);
    expect(engine.getState().ringChoices!.find((c: { text: string }) => c.text.includes('Borak'))!.text).toMatch(/dim, 15 min/);
    e.char.borakAt -= 15 * 60;   // fifteen minutes of play later
    expect(engine.ringAction(key).messages.join(' ')).toContain('beam of white-hot light');
  });
});
