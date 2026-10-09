import { describe, it, expect } from 'vitest';
import { RNG } from '../src/core/random.js';
import { rollCharacter, createCharacter } from '../src/core/character.js';
import { createMonster } from '../src/core/monsters.js';
import { knownSpells, spellMenu, spellForKey, spellsLearnedBetween } from '../src/core/spells.js';
import { banishFailFaces, playerBanish } from '../src/core/combat.js';
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
  it('always works on ordinary monsters', () => {
    expect(banishFailFaces(createMonster('Goblin', 5, 'g'))).toBe(0);
    expect(banishFailFaces(createMonster('Hollow Choir', 25, 'b'))).toBe(0);
    const rng = new RNG(5);
    for (let i = 0; i < 50; i++) {
      expect(playerBanish(makeChar(40), createMonster('Orc', 10, 'o'), rng).banished).toBe(true);
    }
  });

  it('very powerful monsters resist on a d12, more so by tier', () => {
    expect(banishFailFaces(createMonster('Lich', 20, 'l'))).toBe(SPELLS.BANISH_FAIL_FACES_BY_TIER[8]);
    expect(banishFailFaces(createMonster('Bone Sovereign', 65, 'd'))).toBe(SPELLS.BANISH_FAIL_FACES_BY_TIER[9]);
    expect(banishFailFaces(createMonster('Big Fat Dragon', 85, 't'))).toBe(SPELLS.BANISH_FAIL_FACES_BY_TIER[10]);
  });

  it('high-level dragons and undead resist too, low-level ones do not', () => {
    expect(banishFailFaces(createMonster('Black Dragon', 100, 'k'))).toBe(SPELLS.BANISH_HIGH_LEVEL_FAIL_FACES);
    expect(banishFailFaces(createMonster('Black Dragon', 65, 'k'))).toBe(SPELLS.BANISH_HIGH_LEVEL_FAIL_FACES);
    expect(banishFailFaces(createMonster('Black Dragon', 10, 'k'))).toBe(0);
    expect(banishFailFaces(createMonster('Vampire', 40, 'v'))).toBe(SPELLS.BANISH_HIGH_LEVEL_FAIL_FACES);
    expect(banishFailFaces(createMonster('Vampire', 24, 'v'))).toBe(0);
    expect(banishFailFaces(createMonster('Skeleton', 10, 's'))).toBe(SPELLS.BANISH_HIGH_LEVEL_FAIL_FACES);
  });

  it('fails exactly on the low faces of the d12', () => {
    const rng = new RNG(11);
    let banished = 0, failed = 0;
    for (let i = 0; i < 600; i++) {
      const res = playerBanish(makeChar(80), createMonster('Big Fat Dragon', 85, 't'), rng);
      const roll = Number(res.messages.join(' ').match(/d12: (\d+)/)![1]);
      expect(res.banished ?? false).toBe(roll > SPELLS.BANISH_FAIL_FACES_BY_TIER[10]);
      if (res.banished) banished++; else failed++;
    }
    // 5 of 12 faces succeed against Big Fat Dragon
    expect(banished / 600).toBeGreaterThan(0.33);
    expect(banished / 600).toBeLessThan(0.5);
    expect(failed).toBeGreaterThan(0);
  });

  it('never works on Asmodeus', () => {
    const rng = new RNG(3);
    for (let i = 0; i < 50; i++) {
      expect(playerBanish(makeChar(100), createMonster('Asmodeus', 80, 'a'), rng).banished).toBeFalsy();
    }
  });
});
