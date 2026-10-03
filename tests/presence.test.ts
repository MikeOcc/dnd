import { describe, it, expect } from 'vitest';
import { RNG } from '../src/core/random.js';
import { rollCharacter, createCharacter } from '../src/core/character.js';
import { rollPresence, asmodeusFury, FLAVOR, type PresenceContext } from '../src/core/presence.js';
import { PRESENCE } from '../src/core/config.js';

function hero(hp = 1000) {
  const c = createCharacter('h', 'Gandalf the Grey', rollCharacter(new RNG(1)));
  c.hp = c.maxHp = hp;
  c.wisdom = 3;   // easy to frighten
  c.x = 10; c.y = 10;
  return c;
}

/** An RNG whose float() replays the given values (then 0.99), for forcing a branch. */
function scripted(floats: number[], seed = 1): RNG {
  const rng = new RNG(seed);
  const queue = [...floats];
  rng.float = () => (queue.length ? queue.shift()! : 0.99);
  return rng;
}

const base = (over: Partial<PresenceContext>): PresenceContext =>
  ({ char: hero(), level: 1, lairs: [], asmodeusAlive: true, asmodeusLair: null, ...over });

describe('Asmodeus from afar', () => {
  it('his fury is nothing above level 4, weak on 4, and peaks at his lair', () => {
    expect(asmodeusFury(3, { x: 0, y: 0 }, null)).toBe(0);
    expect(asmodeusFury(4, { x: 0, y: 0 }, null)).toBeCloseTo(0.1);
    expect(asmodeusFury(6, { x: 0, y: 0 }, null)).toBeGreaterThan(asmodeusFury(5, { x: 0, y: 0 }, null));
    const lair = { x: 40, y: 40 };
    expect(asmodeusFury(7, lair, lair)).toBeCloseTo(1);
    expect(asmodeusFury(7, { x: 0, y: 0 }, lair)).toBeLessThan(asmodeusFury(7, { x: 38, y: 40 }, lair));
  });

  it('never strikes above level 4, and his voice uses the character’s name', () => {
    for (let i = 0; i < 300; i++) {
      const ctx = base({ level: 3 });
      const ev = rollPresence(ctx, scripted([0, 0]));   // would trigger anything allowed
      expect(ev?.fx).toBeUndefined();
      expect(ev!.messages.join(' ')).toContain('A voice rolls through the stone');
    }
    const ev = rollPresence(base({ level: 2 }), scripted([0]));
    expect(ev!.messages[1]).toMatch(/^"/);
  });

  it('a strike near his lair is debilitating but never fatal', () => {
    const lair = { x: 10, y: 10 };
    const ctx = base({ level: 7, asmodeusLair: lair });
    ctx.char.x = 14; ctx.char.y = 10;   // close, but just outside his door-side reach
    ctx.char.hp = 5;
    const ev = rollPresence(ctx, scripted([0]))!;
    expect(ev.fx).toBe('fire');
    expect(ctx.char.hp).toBe(1);
    expect(ctx.char.statusEffects.length).toBe(1);   // hellfire AND a curse
  });

  it('on level 4 a strike is a light scorch', () => {
    const ctx = base({ level: 4 });
    const ev = rollPresence(ctx, scripted([0, 0.1]))!;   // strike, then pick hellfire
    expect(ev.fx).toBe('fire');
    expect(1000 - ctx.char.hp).toBeLessThanOrEqual(1000 * (0.03 + 0.30 * 0.1) + 1);
  });

  it('is silent once he is defeated', () => {
    const ev = rollPresence(base({ level: 7, asmodeusAlive: false }), scripted([0, 0, 0.5]));
    expect(ev).toBeNull();
  });
});

describe('The Dracolich’s fear', () => {
  const near = (over: Partial<PresenceContext> = {}) =>
    base({ level: 6, asmodeusAlive: false, lairs: [{ type: 'Dracolich', x: 12, y: 10 }], ...over });

  it('can send the character fleeing, spin them around, or shake their hands', () => {
    // floats: [fear fires, resist fails]; rng.int picks the effect
    const seen = new Set<string>();
    for (let seed = 1; seed < 60 && seen.size < 3; seed++) {
      const ctx = near();
      const ev = rollPresence(ctx, scripted([0, 0.99], seed))!;
      if (ev.flee) seen.add('flee');
      else if (ev.turnTo) { seen.add('turn'); expect(ev.turnTo).not.toBe(ctx.char.facing); }
      else if (ctx.char.statusEffects.some(e => e.type === 'dexterity-reduced' && e.value === PRESENCE.FEAR_DEX_LOSS)) seen.add('dex');
    }
    expect(seen).toEqual(new Set(['flee', 'turn', 'dex']));
  });

  it('a steady mind can resist it', () => {
    const ctx = near();
    ctx.char.wisdom = 25;
    const ev = rollPresence(ctx, scripted([0, 0]))!;
    expect(ev.messages.join(' ')).toContain('hold your ground');
    expect(ev.flee).toBeFalsy();
  });
});

describe('Lair presences', () => {
  it('Tiamat is heard faintly from the level above, and the Tarrasque drops stones up close', () => {
    const faint = rollPresence(base({ level: 6, asmodeusAlive: false, lairs: [{ type: 'Tiamat', x: 11, y: 10 }] }), scripted([0]))!;
    expect(FLAVOR.Tiamat!.far).toContain(faint.messages[0]);

    const ctx = base({ level: 7, asmodeusAlive: false, lairs: [{ type: 'Tarrasque', x: 11, y: 10 }] });
    const ev = rollPresence(ctx, scripted([0, 0.5]))!;
    expect(ev.messages.join(' ')).toContain('Loose stones');
    expect(ctx.char.hp).toBeLessThan(1000);
  });
});

describe("At Asmodeus's door", () => {
  const ctxAt = (dx: number, dy: number, wis = 10, res = 10): PresenceContext => {
    const char = createCharacter('t', 'Hero', rollCharacter(new RNG(1)));
    char.hp = char.maxHp = 1000; char.wisdom = wis; char.resistance = res; char.statusEffects = [];
    char.x = 40 + dx; char.y = 30 + dy;
    return { char, level: 7, lairs: [], asmodeusAlive: true, asmodeusLair: { x: 40, y: 30 } };
  };
  const roll = (ctx: PresenceContext, n: number, seed: number) => {
    const rng = new RNG(seed);
    const out: string[] = [];
    for (let i = 0; i < n; i++) { ctx.char.hp = ctx.char.maxHp; const ev = rollPresence(ctx, rng); if (ev) out.push(ev.messages.join(' ')); }
    return out;
  };

  it('within 3 squares he taunts and lashes out, often', () => {
    const events = roll(ctxAt(3, -2), 200, 3);
    expect(events.length).toBeGreaterThan(80);
    expect(events.some(e => e.includes('A vast voice, very close'))).toBe(true);
    expect(events.some(e => e.includes('Saving roll'))).toBe(true);
  });

  it('farther away, his door-side voice falls silent', () => {
    expect(roll(ctxAt(4, 0), 200, 3).some(e => e.includes('very close'))).toBe(false);
  });

  it('his attack there is never fatal, and a good save halves it', () => {
    const rng = new RNG(9);
    for (let i = 0; i < 300; i++) {
      const ctx = ctxAt(1, 1, 40, 40);
      ctx.char.hp = 5;
      rollPresence(ctx, rng);
      expect(ctx.char.hp).toBeGreaterThanOrEqual(1);
    }
    const strong = roll(ctxAt(0, 2, 40, 40), 300, 5).filter(e => e.includes('Saving roll'));
    expect(strong.length).toBeGreaterThan(0);
    expect(strong.every(e => e.includes('only half catches you'))).toBe(true);
  });
});
