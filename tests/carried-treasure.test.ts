// Treasure some monsters carry, found on (or in) the body.
import { describe, it, expect } from 'vitest';
import { RNG } from '../src/core/random.js';
import { rollCharacter, createCharacter } from '../src/core/character.js';
import { carriedTreasure, CARRIERS } from '../src/core/encounters.js';

const hero = () => { const c = createCharacter('h', 'Hero', rollCharacter(new RNG(1))); c.level = 20; c.gold = 0; return c; };

describe('Carried treasure', () => {
  it('each carrier pays out about as often as it should, in gold at least', () => {
    for (const [type, rule] of Object.entries(CARRIERS)) {
      let paid = 0;
      for (let i = 0; i < 400; i++) { const c = hero(); if (carriedTreasure(c, type, 10, new RNG(i))) { paid++; expect(c.gold, type).toBeGreaterThan(0); } }
      expect(paid / 400, type).toBeGreaterThan(rule.chance - 0.1);
      expect(paid / 400, type).toBeLessThanOrEqual(Math.min(1, rule.chance + 0.1));
    }
  });

  it('the Orc King always has his war chest, with enchanted gear', () => {
    const c = hero();
    const t = carriedTreasure(c, 'Orc King', 15, new RNG(3))!;
    expect(t.messages.join(' ')).toContain('war chest');
    expect([...(c.inventory.weapons ?? []), ...(c.inventory.armor ?? [])].some(g => g.bonus >= 1)).toBe(true);
  });

  it('a Lich leaves a tome; monsters not on the list carry nothing', () => {
    const c = hero(); const books = c.inventory.books ?? 0;
    let found = null; for (let i = 0; i < 20 && !found; i++) found = carriedTreasure(c, 'Lich', 30, new RNG(i));
    expect(c.inventory.books).toBe(books + 1);
    expect(carriedTreasure(hero(), 'Owlbear', 10, new RNG(1))).toBeNull();
  });
});
