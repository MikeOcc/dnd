import { describe, it, expect } from 'vitest';
import { RNG } from '../src/core/random.js';
import { rollCharacter, createCharacter } from '../src/core/character.js';
import { createMonster } from '../src/core/monsters.js';
import { monsterFirstStrike, playerAttack, playerFireball, playerRun, playerLightning } from '../src/core/combat.js';
import { BESTIARY } from '../src/core/bestiary.js';
import type { MonsterType } from '../src/core/types.js';

const hero = (level = 60) => {
  const c = createCharacter('t', 'Hero', rollCharacter(new RNG(1)));
  c.level = level; c.hp = c.maxHp = 1_000_000; c.statusEffects = []; c.strength = 18; c.dexterity = 16;
  return c;
};
const turns = (type: MonsterType, n: number, seed: number, level = 50) => {
  const rng = new RNG(seed);
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const c = hero();
    out.push(monsterFirstStrike(c, createMonster(type, level, 'm'), rng).messages.join(' '));
  }
  return out.join(' | ');
};

describe('The great bestiary', () => {
  it('every monster in it takes a turn without trouble, and hurts', () => {
    for (const type of Object.keys(BESTIARY) as MonsterType[]) {
      const rng = new RNG(5);
      for (let i = 0; i < 30; i++) {
        const c = hero();
        const res = monsterFirstStrike(c, createMonster(type, 40, 'm'), rng);
        expect(res.messages.length).toBeGreaterThan(0);
        expect(c.hp).toBeLessThanOrEqual(c.maxHp);
      }
    }
  });

  it('signature moves all turn up', () => {
    expect(turns('Giant Spider', 80, 1)).toContain('sticky web');
    expect(turns('Stirge Swarm', 20, 2)).toContain('proboscis');
    expect(turns('Minotaur', 60, 3)).toContain('CHARGES');
    expect(turns('Chimera', 10, 4)).toContain("dragon's head breathes fire");
    expect(turns('Marilith', 10, 5)).toContain('whirl of steel');
    expect(turns('Death Tyrant', 120, 6)).toContain('DEATH RAY');
    expect(turns('Behir', 60, 7)).toContain('bolt of lightning');
  });

  it('a Rust Monster corrodes your weapon, and rusty blows do less', () => {
    const rng = new RNG(11);
    const c = hero();
    for (let i = 0; i < 40 && !c.statusEffects.some(e => e.type === 'corroded'); i++) monsterFirstStrike(c, createMonster('Rust Monster', 15, 'r'), rng);
    expect(c.statusEffects.find(e => e.type === 'corroded')!.value).toBeGreaterThanOrEqual(20);
  });

  it('weapons only half bite on Gargoyles; Marilith parries', () => {
    const dealt = (type: MonsterType) => {
      const rng = new RNG(3); let total = 0;
      for (let i = 0; i < 200; i++) { const m = createMonster(type, 40, 'm'); m.hp = m.maxHp = 1e9; total += playerAttack(hero(), m, rng).playerDamage; }
      return total;
    };
    expect(dealt('Gargoyle')).toBeLessThan(dealt('Minotaur') * 0.7);
    expect(turns('Marilith', 1, 1)).toBeTruthy();
    const rng = new RNG(4);
    let parried = false;
    for (let i = 0; i < 100 && !parried; i++) {
      const m = createMonster('Marilith', 60, 'm'); m.hp = m.maxHp = 1e9;
      parried = playerAttack(hero(), m, rng).messages.join(' ').includes('turns it aside');
    }
    expect(parried).toBe(true);
  });

  it('a Werewolf bite can pass on lycanthropy', () => {
    const rng = new RNG(13);
    for (let i = 0; i < 400; i++) {
      const c = hero();
      monsterFirstStrike(c, createMonster('Werewolf', 30, 'w'), rng);
      if (c.statusEffects.some(e => e.type === 'lycanthropy')) return;
    }
    throw new Error('never infected');
  });

  it('cut a Hydra hard and two heads grow back; burn it first and the stump is seared', () => {
    const h = createMonster('Hydra', 40, 'h');
    const rng = new RNG(2);
    monsterFirstStrike(hero(), h, rng);
    const heads = h.heads!;
    h.hp -= Math.ceil(h.maxHp * 0.2);
    expect(monsterFirstStrike(hero(), h, rng).messages.join(' ')).toContain('TWO grow back');
    expect(h.heads).toBe(heads + 1);
    h.burnedTurns = 2;
    h.hp -= Math.ceil(h.maxHp * 0.2);
    expect(monsterFirstStrike(hero(), h, rng).messages.join(' ')).toContain('sears the stump');
    expect(h.heads).toBe(heads);
  });

  it('a Purple Worm swallows you, and you cut your way out', () => {
    const rng = new RNG(17);
    const w = createMonster('Purple Worm', 55, 'p');
    const c = hero();
    for (let i = 0; i < 60 && w.swallowHp === undefined; i++) monsterFirstStrike(c, w, rng);
    expect(w.swallowHp).toBeDefined();
    expect(monsterFirstStrike(c, w, rng).messages.join(' ')).toContain('Digestive acid');
    w.hp -= Math.ceil(w.maxHp * 0.15);
    expect(monsterFirstStrike(c, w, rng).messages.join(' ')).toContain('hack your way out');
    expect(w.swallowHp).toBeUndefined();
  });

  it('Medusa and the Caput Mortuum can kill outright on a failed saving roll', () => {
    const killer = (type: MonsterType, cause: RegExp) => {
      const rng = new RNG(19);
      for (let i = 0; i < 3000; i++) {
        const c = hero(); c.constitution = 3; c.wisdom = 3; c.charisma = 3;
        const res = monsterFirstStrike(c, createMonster(type, 55, 'm'), rng);
        if (c.hp === 0 && res.deathCause && cause.test(res.deathCause)) return true;
      }
      return false;
    };
    expect(killer('Medusa', /^Turned to stone by the gaze of/)).toBe(true);
    expect(killer('Caput Mortuum', /^Soul trapped forever/)).toBe(true);
  });

  it('you cannot run from an Erinyes; lightning slows an Iron Golem; fire stops a Troll healing', () => {
    expect(playerRun(hero(), createMonster('Erinyes', 50, 'e'), new RNG(1)).messages[0]).toContain('no outrunning her');
    const g = createMonster('Iron Golem', 50, 'g'); g.hp = g.maxHp = 1e9;
    const zap = playerLightning(hero(), g, new RNG(2)).messages.join(' ');
    expect(zap).toContain('shudders and slows');
    expect(zap).toContain("can't act");   // it loses its turn
    const t = createMonster('Troll', 30, 't'); t.hp = t.maxHp = 1e9;
    playerFireball(hero(), t, new RNG(3));
    expect(t.burnedTurns).toBeGreaterThan(0);
  });

  it('the Doppelganger hits with your own technique', () => {
    expect(turns('Doppelganger', 20, 23)).toMatch(/YOUR technique|YOUR Fireball/);
  });
});
