import { describe, it, expect } from 'vitest';
import { RNG } from '../src/core/random.js';
import { rollCharacter, createCharacter } from '../src/core/character.js';
import { createMonster } from '../src/core/monsters.js';
import { knownSpells, spellMenu, spellForKey, spellsLearnedBetween } from '../src/core/spells.js';
import { banishChance, playerBanish } from '../src/core/combat.js';
import { SPELLS } from '../src/core/config.js';

function makeChar(level: number) {
  const char = createCharacter('t', 'Hero', rollCharacter(new RNG(1)));
  char.level = level;
  char.hp = char.maxHp = 100000;
  return char;
}

describe('Spell unlocks', () => {
  it('starts with Fireball alone and has every spell by level 40', () => {
    expect(knownSpells(1).map(s => s.name)).toEqual(['Fireball']);
    expect(knownSpells(5).map(s => s.name)).toEqual(['Fireball', 'Heal']);
    expect(knownSpells(34).map(s => s.name)).not.toContain('Lightning');
    expect(knownSpells(35).map(s => s.name)).toContain('Lightning');
    expect(knownSpells(39).map(s => s.name)).not.toContain('Banish');
    expect(knownSpells(40).map(s => s.name)).toEqual(
      ['Fireball', 'Heal', 'Poison Spray', 'Acid Spray', 'Frost Bolt', 'Lightning', 'Banish']);
  });

  it('letters only the known spells, then Cancel', () => {
    expect(spellMenu(1)).toEqual([{ key: 'a', text: 'Fireball' }, { key: 'b', text: 'Cancel' }]);
    expect(spellMenu(10).map(c => c.text)).toEqual(['Fireball', 'Heal', 'Poison Spray', 'Cancel']);
  });

  it('maps keys through the character’s own menu, and never to an unlearned spell', () => {
    expect(spellForKey(10, 'c')).toBe('poison');
    expect(spellForKey(1, 'b')).toBeNull();      // Cancel at level 1
    expect(spellForKey(1, 'f')).toBeNull();      // Lightning's old key does nothing now
    expect(spellForKey(40, 'g')).toBe('banish');
  });

  it('reports every spell learned across a multi-level jump', () => {
    expect(spellsLearnedBetween(4, 16).map(s => s.name)).toEqual(['Heal', 'Poison Spray', 'Acid Spray']);
    expect(spellsLearnedBetween(35, 39)).toEqual([]);
  });
});

describe('Banish', () => {
  it('fails more often against tougher monsters', () => {
    const wizard = makeChar(40);
    const goblin = banishChance(wizard, createMonster('Goblin', 5, 'g'));
    const beholder = banishChance(wizard, createMonster('Beholder', 25, 'b'));
    const oblex = banishChance(wizard, createMonster('Elder Oblex', 50, 'o'));
    const tiamat = banishChance(wizard, createMonster('Tiamat', 85, 't'));
    expect(goblin).toBe(SPELLS.BANISH_MAX);
    expect(beholder).toBeLessThan(goblin);
    expect(oblex).toBeLessThan(beholder);
    expect(tiamat).toBe(SPELLS.BANISH_MIN);
  });

  it('unique bosses resist it more than an ordinary monster of the same tier and level', () => {
    const wizard = makeChar(80);
    const tarrasque = createMonster('Tarrasque', 80, 't');
    const ordinary = { ...tarrasque, definition: { ...tarrasque.definition, isUnique: false } };
    expect(banishChance(wizard, tarrasque)).toBeCloseTo(banishChance(wizard, ordinary) * SPELLS.BANISH_UNIQUE_MULT, 5);
  });

  it('never works on Asmodeus', () => {
    const rng = new RNG(3);
    const wizard = makeChar(100);
    for (let i = 0; i < 50; i++) {
      const res = playerBanish(wizard, createMonster('Asmodeus', 80, 'a'), rng);
      expect(res.banished).toBeFalsy();
      wizard.hp = 100000;
    }
  });

  it('either removes the monster or costs the turn', () => {
    const rng = new RNG(11);
    let banished = 0, failed = 0;
    for (let i = 0; i < 300; i++) {
      const wizard = makeChar(40);
      const m = createMonster('Beholder', 25, 'b');
      const res = playerBanish(wizard, m, rng);
      if (res.banished) banished++;
      else { failed++; expect(res.messages.join(' ')).toContain('tears itself free'); }
    }
    expect(banished).toBeGreaterThan(0);
    expect(failed).toBeGreaterThan(0);
  });
});
