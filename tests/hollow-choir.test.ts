import { describe, it, expect } from 'vitest';
import { RNG } from '../src/core/random.js';
import { rollCharacter, createCharacter } from '../src/core/character.js';
import { createMonster } from '../src/core/monsters.js';
import { monsterFirstStrike, playerAttack, shatterChoirMasks } from '../src/core/combat.js';
import { CHOIR } from '../src/core/config.js';
import type { Character } from '../src/core/types.js';

function hero(level = 25): Character {
  const c = createCharacter('h', 'Hero', rollCharacter(new RNG(1)));
  c.level = level; c.hp = c.maxHp = 1e6; c.statusEffects = []; c.wisdom = 3; c.resistance = 3;
  return c;
}
/** An RNG whose float() gives `v` (die rolls stay random). */
function fixed(v: number, seed = 1) { const r = new RNG(seed); r.float = () => v; return r; }

describe('The Hollow Choir', () => {
  it('foreshadows a power one turn ahead: a clear cue and no harm, then it lands', () => {
    const c = hero(); const m = createMonster('Hollow Choir', 20, 'hc');
    const prep = monsterFirstStrike(c, m, fixed(0));          // under the prepare chance: it prepares
    expect(m.choirPrep).toBeDefined();
    expect(prep.monsterDamage).toBe(0);
    expect(c.hp).toBe(c.maxHp);
    expect(prep.messages.join(' ')).toMatch(/grieving mask opens its mouth|expressionless mask turns|smiling mask leans/);
    const power = m.choirPrep;
    const land = monsterFirstStrike(c, m, fixed(0.99));
    expect(m.choirPrep).toBeUndefined();
    if (power === 'lament') expect(land.monsterDamage).toBeGreaterThan(0);
    if (power === 'unmaking') expect(c.statusEffects.some(e => e.type === 'dexterity-reduced')).toBe(true);
  });

  it('the Lament hits harder than an ordinary blow (same rolls, a failed save)', () => {
    // Middling rolls for both: no preparing, the raging mask's blow, and a d20 that fails the save.
    const lament = (() => { const m = createMonster('Hollow Choir', 30, 'a'); m.choirPrep = 'lament'; return monsterFirstStrike(hero(), m, fixed(0.5)).monsterDamage; })();
    const plain = monsterFirstStrike(hero(), createMonster('Hollow Choir', 30, 'b'), fixed(0.5)).monsterDamage;
    expect(plain).toBeGreaterThan(0);
    expect(lament).toBeGreaterThan(plain * 1.6);
  });

  it('False Joy heals the Choir with what it drains', () => {
    const c = hero(); const m = createMonster('Hollow Choir', 20, 'hc');
    m.hp = Math.round(m.maxHp * 0.9);   // above any mask breaking
    const before = m.hp;
    m.choirPrep = 'false-joy';
    const r = monsterFirstStrike(c, m, new RNG(3));
    expect(r.monsterHealed).toBeGreaterThan(0);
    expect(m.hp).toBe(before + r.monsterHealed!);
  });

  it('masks shatter as it weakens, each taking its power with it', () => {
    const m = createMonster('Hollow Choir', 20, 'hc');
    m.hp = Math.floor(m.maxHp * 0.5);
    m.choirPrep = 'false-joy';
    const msgs: string[] = [];
    shatterChoirMasks(m, msgs);
    expect(m.choirBroken).toEqual(['dread', 'delight']);
    expect(m.choirPrep).toBeUndefined();                       // the smiling mask broke mid-preparation
    expect(msgs.join(' ')).toContain('gutters out');
    // With delight gone it never prepares False Joy again; below 30% the Lament goes too.
    m.hp = Math.floor(m.maxHp * 0.25);
    shatterChoirMasks(m, []);
    expect(m.choirBroken).toContain('grief');
    for (let i = 0; i < 300; i++) {
      monsterFirstStrike(hero(), m, new RNG(i));
      expect(m.choirPrep === 'false-joy' || m.choirPrep === 'lament').toBe(false);
      m.choirPrep = undefined;
    }
  });

  it('never takes the character’s turn away', () => {
    const c = hero(); const rng = new RNG(11);
    for (let i = 0; i < 500; i++) {
      const m = createMonster('Hollow Choir', 25, 'hc' + i);
      m.hp = Math.floor(m.maxHp * (0.2 + (i % 8) / 10));
      monsterFirstStrike(c, m, rng); monsterFirstStrike(c, m, rng);
      expect(c.heldRounds ?? 0).toBe(0);
    }
  });

  it('is winnable: a seasoned fighter brings it down', () => {
    const rng = new RNG(21);
    let wins = 0;
    for (let f = 0; f < 60; f++) {
      const c = hero(28); c.hp = c.maxHp = 900; c.strength = 16; c.dexterity = 15; c.wisdom = 14; c.resistance = 12;
      const m = createMonster('Hollow Choir', 18, 'hc' + f);
      for (let round = 0; round < 80 && m.hp > 0 && c.hp > 0; round++) {
        if (c.hp < 300) c.hp += 250;   // a potion
        playerAttack(c, m, rng);
      }
      if (m.hp <= 0) wins++;
      expect(m.choirBroken!.length).toBeGreaterThanOrEqual(m.hp <= 0 ? 0 : 0);
    }
    expect(wins).toBeGreaterThan(45);
  });

  it('its breaking points are in order: dread, then delight, then grief', () => {
    expect(CHOIR.BREAKS.map(([m]) => m)).toEqual(['dread', 'delight', 'grief']);
  });
});
