import { describe, it, expect } from 'vitest';
import { RNG } from '../src/core/random.js';
import { rollCharacter, createCharacter } from '../src/core/character.js';
import { createMonster, pickRandomMonsterType } from '../src/core/monsters.js';
import { monsterFirstStrike, playerAttack } from '../src/core/combat.js';
import type { Character } from '../src/core/types.js';

function hero(): Character {
  const c = createCharacter('h', 'Hero', rollCharacter(new RNG(1)));
  c.level = 40; c.hp = c.maxHp = 1e6; c.statusEffects = []; c.strength = 16; c.dexterity = 10;
  return c;
}
const worm = (level = 30) => { const m = createMonster('Mongolian Death Worm', level, 'w'); m.hp = m.maxHp = 1e6; return m; };

/** Runs the worm's turns until one of them used `id` (by its message). */
function untilMove(c: Character, m: ReturnType<typeof worm>, text: string, seed = 1) {
  for (let i = 0; i < 300; i++) {
    const r = monsterFirstStrike(c, m, new RNG(seed + i));
    if (r.messages.join(' ').includes(text)) return r;
  }
  throw new Error(`never saw "${text}"`);
}

describe('The Mongolian Death Worm', () => {
  it('turns up only on levels 5-7', () => {
    const rng = new RNG(4); const levels = new Set<number>();
    for (let d = 1; d <= 7; d++) for (let i = 0; i < 8000; i++) if (pickRandomMonsterType(d, rng) === 'Mongolian Death Worm') levels.add(d);
    expect([...levels].sort()).toEqual([5, 6, 7]);
  });

  it('burrows: blades only strike stone, then it erupts beneath you on its next turn', () => {
    const c = hero(); const m = worm();
    untilMove(c, m, 'dives into the floor');
    expect(m.burrowed).toBe(true);
    const hp = m.hp;
    const swing = playerAttack(c, m, new RNG(7));    // the player's blow, and the worm's reply: the eruption
    expect(swing.messages.join(' ')).toContain('strikes only broken stone');
    expect(m.hp).toBe(hp);
    expect(swing.messages.join(' ')).toContain('The floor bursts open beneath you!');
    expect(m.burrowed).toBe(false);
  });

  it('its lightning goes through metal armour', () => {
    const shock = (armor: Character['inventory']['armor']) => {
      let total = 0;
      for (let i = 0; i < 200; i++) {
        const c = hero(); c.inventory.armor = armor;
        const r = untilMove(c, worm(), 'arc leaps', i * 50);
        total += r.monsterDamage;
      }
      return total;
    };
    const plain = shock([]), plate = shock([{ kind: 'plate', bonus: 0, name: 'Plate' }]);
    expect(plate).toBeGreaterThan(plain * 1.05);   // plate turns aside 20%, but carries the shock (x1.5, magic: armour only half as good)
  });

  it('its acid spittle can corrode your weapon, and its skin burns the hand that strikes it', () => {
    let corroded = false, burned = false;
    for (let i = 0; i < 300 && !(corroded && burned); i++) {
      const c = hero();
      const r = untilMove(c, worm(), 'yellow acid', i * 40);
      if (c.statusEffects.some(e => e.type === 'corroded')) corroded = true;
      const hit = playerAttack(hero(), worm(), new RNG(1000 + i));
      if (hit.messages.join(' ').includes('burns your hands')) burned = true;
      void r;
    }
    expect(corroded).toBe(true);
    expect(burned).toBe(true);
  });
});
