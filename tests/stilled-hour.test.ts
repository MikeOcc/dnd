// The Stilled Hour: wizards of level 80+ stop time for a monster, d5+3
// turns. It can't act, every blow lands, and from the 4th still turn it
// suffocates (unless it doesn't breathe). The caster ages; once an hour.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RNG } from '../src/core/random.js';
import { rollCharacter, createCharacter, getEffectiveStats } from '../src/core/character.js';
import { createMonster } from '../src/core/monsters.js';
import { playerStilledHour, playerAttack, breathes } from '../src/core/combat.js';
import { knownSpells } from '../src/core/spells.js';
import { createMemoryDb } from '../src/database/database.js';
import { Repository } from '../src/database/repositories.js';
import { GameEngine } from '../src/core/game-engine.js';

function wizard(level = 85) {
  const c = createCharacter('w', 'Elminster', rollCharacter(new RNG(1)));
  c.charClass = 'wizard'; c.level = level; c.intelligence = 20; c.hp = c.maxHp = 1e6; c.statusEffects = [];
  return c;
}

describe('The Stilled Hour', () => {
  it('only wizards of level 80 and above know it', () => {
    expect(knownSpells(79, 'wizard').some(s => s.id === 'stilled-hour')).toBe(false);
    expect(knownSpells(80, 'wizard').some(s => s.id === 'stilled-hour')).toBe(true);
    expect(knownSpells(100, 'warrior').some(s => s.id === 'stilled-hour')).toBe(false);
  });

  it('freezes the monster 4 to 8 turns, and it does not answer the casting', () => {
    const seen = new Set<number>();
    for (let i = 0; i < 200; i++) {
      const m = createMonster('Troll', 30, 't' + i);
      const r = playerStilledHour(wizard(), m, new RNG(i));
      expect(r.playerDamage).toBe(0);
      seen.add(m.frozenTurns!);
    }
    expect([...seen].sort()).toEqual([4, 5, 6, 7, 8]);
  });

  it('while frozen it cannot act, every blow lands, and from the 4th turn it suffocates, worse each turn', () => {
    const c = wizard();
    const m = createMonster('Minotaur', 30, 'm'); m.hp = m.maxHp = 100000;
    const rng = new RNG(7);
    playerStilledHour(c, m, rng);
    m.frozenTurns = 8;
    const hpAt: number[] = [];
    for (let t = 1; t <= 6; t++) {
      const before = c.hp;
      const hpBefore = m.hp;
      const r = playerAttack(c, m, rng);
      expect(m.hp, `turn ${t}: the blow lands`).toBeLessThan(hpBefore);
      expect(c.hp).toBe(before);                // it never answers
      hpAt.push(r.messages.some(x => x.includes('cannot breathe')) ? 1 : 0);
    }
    expect(hpAt).toEqual([0, 0, 0, 1, 1, 1]);
  });

  it("things that don't breathe don't suffocate", () => {
    expect(breathes(createMonster('Skeleton', 5, 's'))).toBe(false);
    expect(breathes(createMonster('Iron Golem', 20, 'g'))).toBe(false);
    expect(breathes(createMonster('Red Dragon', 20, 'd'))).toBe(true);
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
    expect(Math.max(...held)).toBeLessThanOrEqual(4);
    expect(breathes(createMonster('Asmodeus', 60, 'a'))).toBe(false);
  });
});

describe('The Stilled Hour in a fight', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let db: any;
  beforeEach(() => { db = createMemoryDb(); });
  afterEach(() => { db.close(); });

  it('a monster that suffocates dies like any other; and it is once per hour of play', () => {
    const engine = new GameEngine(new Repository(db));
    engine.startNameEntry(); engine.submitName('Chronos'); engine.acceptCharacter('wizard');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e = engine as any;
    e.dismissLevelIntro();
    e.char.level = 90; e.char.hp = e.char.maxHp = 1e6; e.char.intelligence = 22;
    const m = createMonster('Troll', 20, 'troll'); m.hp = 30; m.maxHp = 100;
    e.combat = { monster: m, round: 1 }; e.phase = 'combat';
    const key = engine.getState().spellChoices!.find((c: { text: string }) => c.text.includes('Stilled'))!.key;
    engine.spellAction(key);
    expect(m.frozenTurns).toBeGreaterThan(0);
    m.frozenTurns = 8; m.hp = 15;   // the longest hold, against a weakened foe
    // Wait it out drinking potions (no blows): from the 4th still turn it suffocates, 6 then 12...
    e.char.inventory.potions = 20;
    for (let i = 0; i < 8 && e.phase === 'combat'; i++) { e.char.hp = 10; engine.combatAction('p'); }
    expect(e.phase).not.toBe('combat');
    expect(e.char.monstersDefeated).toBe(1);
    // A second casting so soon is refused.
    e.combat = { monster: createMonster('Troll', 20, 't2'), round: 1 }; e.phase = 'combat';
    expect(engine.spellAction(key).messages.join(' ')).toContain('will not be stilled again so soon');
  });
});
