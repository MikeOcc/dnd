// Timelock (once The Stilled Hour): wizards of level 80+ stop time for a monster, 3-6
// turns. It can't act and every blow lands. The caster ages; once an hour.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RNG } from '../src/core/random.js';
import { rollCharacter, createCharacter, getEffectiveStats } from '../src/core/character.js';
import { createMonster } from '../src/core/monsters.js';
import { playerStilledHour, playerAttack } from '../src/core/combat.js';
import { knownSpells } from '../src/core/spells.js';
import { createMemoryDb } from '../src/database/database.js';
import { Repository } from '../src/database/repositories.js';
import { GameEngine } from '../src/core/game-engine.js';

function wizard(level = 85) {
  const c = createCharacter('w', 'Elminster', rollCharacter(new RNG(1)));
  c.charClass = 'wizard'; c.level = level; c.intelligence = 20; c.hp = c.maxHp = 1e6; c.statusEffects = [];
  return c;
}

describe('Timelock', () => {
  it('only wizards of level 80 and above know it', () => {
    expect(knownSpells(79, 'wizard').some(s => s.id === 'stilled-hour')).toBe(false);
    expect(knownSpells(80, 'wizard').some(s => s.id === 'stilled-hour')).toBe(true);
    expect(knownSpells(100, 'warrior').some(s => s.id === 'stilled-hour')).toBe(false);
  });

  it('freezes the monster 3 to 6 turns, and it does not answer the casting', () => {
    const seen = new Set<number>();
    for (let i = 0; i < 200; i++) {
      const m = createMonster('Troll', 30, 't' + i);
      const r = playerStilledHour(wizard(), m, new RNG(i));
      expect(r.playerDamage).toBe(0);
      seen.add(m.frozenTurns!);
    }
    expect([...seen].sort()).toEqual([3, 4, 5, 6]);
  });

  it('while frozen it cannot act and every blow lands; it takes no other harm; then time starts again', () => {
    const c = wizard();
    const m = createMonster('Minotaur', 30, 'm'); m.hp = m.maxHp = 100000;
    const rng = new RNG(7);
    playerStilledHour(c, m, rng);
    m.frozenTurns = 6;
    for (let t = 1; t <= 6; t++) {
      const before = c.hp;
      const hpBefore = m.hp;
      const r = playerAttack(c, m, rng);
      expect(m.hp, `turn ${t}: the blow lands`).toBeLessThan(hpBefore);
      expect(c.hp).toBe(before);                // it never answers
      expect(r.messages.join(' ')).not.toContain('cannot breathe');
    }
    expect(m.frozenTurns).toBe(0);
  });

  it('the caster ages: Strength and Dexterity fall for a long while', () => {
    const c = wizard();
    const before = getEffectiveStats(c);
    playerStilledHour(c, createMonster('Troll', 30, 't'), new RNG(1));
    const after = getEffectiveStats(c);
    expect(after.strength).toBe(before.strength - 3);
    expect(after.dexterity).toBe(before.dexterity - 3);
  });

  it('Asmodeus throws it off about a third of the time, and is held only half as long otherwise', () => {
    let resisted = 0; const held: number[] = [];
    for (let i = 0; i < 300; i++) {
      const m = createMonster('Asmodeus', 60, 'a' + i);
      playerStilledHour(wizard(), m, new RNG(i));
      if (!m.frozenTurns) resisted++; else held.push(m.frozenTurns);
    }
    expect(resisted).toBeGreaterThan(70); expect(resisted).toBeLessThan(130);
    expect(Math.max(...held)).toBeLessThanOrEqual(3);
  });
});

describe('Timelock in a fight', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let db: any;
  beforeEach(() => { db = createMemoryDb(); });
  afterEach(() => { db.close(); });

  it('it holds a monster still in a real fight, and it is once per hour of play', () => {
    const engine = new GameEngine(new Repository(db));
    engine.startNameEntry(); engine.submitName('Chronos'); engine.acceptCharacter('wizard');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e = engine as any;
    e.dismissLevelIntro();
    e.char.level = 90; e.char.hp = e.char.maxHp = 1e6; e.char.intelligence = 22;
    const m = createMonster('Owlbear', 15, 'owlbear'); m.hp = 30; m.maxHp = 100;   // (a Troll would get back up)
    e.combat = { monster: m, round: 1 }; e.phase = 'combat';
    const key = engine.getState().spellChoices!.find((c: { text: string }) => c.text.includes('Timelock'))!.key;
    engine.spellAction(key);
    expect(m.frozenTurns).toBeGreaterThan(0);
    // Wait it out drinking potions: it never answers, and takes no harm, until time starts again.
    const hp = m.hp, held = m.frozenTurns!;
    e.char.inventory.potions = 20;
    for (let i = 0; i < held; i++) { e.char.hp = 10; engine.combatAction('p'); expect(e.char.hp).toBeGreaterThanOrEqual(10); }
    expect(m.hp).toBe(hp);
    expect(m.frozenTurns).toBe(0);
    // A second casting so soon is refused.
    e.combat = { monster: createMonster('Troll', 20, 't2'), round: 1 }; e.phase = 'combat';
    expect(engine.spellAction(key).messages.join(' ')).toContain('will not be locked again so soon');
  });
});

describe('Z: the same spell again', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let db: any;
  beforeEach(() => { db = createMemoryDb(); });
  afterEach(() => { db.close(); });

  it('a wizard can repeat the last spell with Z, even in the next fight; nothing to repeat at first', () => {
    const engine = new GameEngine(new Repository(db));
    engine.startNameEntry(); engine.submitName('Pyro'); engine.acceptCharacter('wizard');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e = engine as any;
    e.dismissLevelIntro(); e.char.level = 30; e.char.hp = e.char.maxHp = 1e6; e.char.intelligence = 18;
    const fight = () => { const m = createMonster('Giant', 10, 'g' + Math.random()); m.hp = m.maxHp = 1e6; e.combat = { monster: m, round: 1 }; e.phase = 'combat'; return m; };
    fight();
    expect(engine.combatAction('z').messages.join(' ')).toContain('no spell to repeat');
    const fireball = engine.getState().spellChoices!.find((c: { text: string }) => c.text === 'Fireball')!.key;
    engine.spellAction(fireball);
    expect(engine.getState().choices!.some((c: { key: string; text: string }) => c.key === 'z' && c.text === 'Fireball again')).toBe(true);
    const m2 = fight();
    const s = engine.combatAction('z');
    expect(s.messages.join(' ')).toMatch(/Fireball|fire/i);
    expect(m2.hp).toBeLessThan(1e6);
  });
});
