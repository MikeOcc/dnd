// Auto-fight: the game picks each round's action and learns what works.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RNG } from '../src/core/random.js';
import { rollCharacter, createCharacter } from '../src/core/character.js';
import { createMonster } from '../src/core/monsters.js';
import { chooseAuto, prior } from '../src/core/autofight.js';
import { createMemoryDb } from '../src/database/database.js';
import { Repository } from '../src/database/repositories.js';
import { GameEngine } from '../src/core/game-engine.js';
import { AUTO } from '../src/core/config.js';

const wizard = (level = 40) => { const c = createCharacter('w', 'W', rollCharacter(new RNG(1))); c.level = level; c.hp = c.maxHp = 500; c.inventory.potions = 3; return c; };
const ctx = { held: false, powerReady: true };

describe('choosing', () => {
  it('hands a great foe back to the player', () => {
    const r = chooseAuto(wizard(), createMonster('Big Fat Dragon', 90, 't'), {}, new RNG(1), ctx);
    expect(r.kind).toBe('stop');
  });

  it('heals when hurt, then drinks, then hands back with nothing left', () => {
    const w = wizard(40); w.hp = Math.floor(w.maxHp * 0.35);
    expect(chooseAuto(w, createMonster('Orc', 20, 'o'), {}, new RNG(1), ctx)).toMatchObject({ kind: 'spell', spell: 'heal' });
    const low = wizard(3); low.hp = Math.floor(low.maxHp * 0.35);
    expect(chooseAuto(low, createMonster('Orc', 5, 'o'), {}, new RNG(1), ctx).kind).toBe('potion');
    low.inventory.potions = 0; low.hp = Math.floor(low.maxHp * 0.2);
    expect(chooseAuto(low, createMonster('Orc', 5, 'o'), {}, new RNG(1), ctx).kind).toBe('stop');
  });

  it('first tries what should work (lightning on the undead), then trusts what has worked', () => {
    const w = wizard(40);
    const ghoul = createMonster('Ghoul', 30, 'g');
    expect(prior(w, ghoul, 'lightning')).toBeGreaterThan(prior(w, ghoul, 'fireball'));
    const picks = new Map<string, number>();
    const rng = new RNG(3);
    for (let i = 0; i < 200; i++) { const r = chooseAuto(w, ghoul, {}, rng, ctx); const k = r.kind === 'spell' ? r.spell : r.kind; picks.set(k, (picks.get(k) ?? 0) + 1); }
    expect([...picks].sort((a, b) => b[1] - a[1])[0][0]).toBe('lightning');
    // Learned: acid has done far more than anything else here.
    const lore = { attack: { uses: 5, damage: 50 }, fireball: { uses: 5, damage: 300 }, poison: { uses: 5, damage: 100 }, acid: { uses: 5, damage: 2000 }, frost: { uses: 5, damage: 400 }, lightning: { uses: 5, damage: 500 } };
    let acid = 0;
    for (let i = 0; i < 200; i++) { const r = chooseAuto(w, ghoul, lore, rng, ctx); if (r.kind === 'spell' && r.spell === 'acid') acid++; }
    expect(acid).toBeGreaterThan(200 * (1 - AUTO.EXPLORE) * 0.9);
  });

  it('a warrior waits out the Power Attack cooldown', () => {
    const f = wizard(10); f.charClass = 'warrior';
    for (let i = 0; i < 50; i++) {
      const r = chooseAuto(f, createMonster('Orc', 10, 'o'), {}, new RNG(i), { held: false, powerReady: false });
      expect(r.kind === 'spell' && r.spell === 'power-attack').toBe(false);
    }
  });
});

describe('in the game', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let db: any;
  beforeEach(() => { db = createMemoryDb(); });
  afterEach(() => { db.close(); });

  it('fights a fight to the end, round by round, and remembers what each action did', () => {
    const repo = new Repository(db);
    const e = new GameEngine(repo) as any;
    e.startNameEntry(); e.submitName('Auto'); e.acceptCharacter('wizard'); e.dismissLevelIntro();
    e.char.level = 30; e.char.intelligence = 18; e.char.hp = e.char.maxHp = 1e6;
    e.phase = 'playing'; e.combat = null;
    e.beginCombat(createMonster('Orc', 20, 'o'));
    let rounds = 0;
    while (e.phase === 'combat' && rounds < 80) { const s = e.autoFight(); expect(s.messages[0]).toMatch(/^\[AUTO\]/); rounds++; }
    expect(e.phase).not.toBe('combat');
    const lore = repo.fightLore('wizard', 'Orc');
    expect(Object.values(lore).reduce((t: number, l) => t + (l as { uses: number }).uses, 0)).toBeGreaterThan(0);
  });

  it('offers itself in an ordinary fight, but not against a great foe', () => {
    const e = new GameEngine(new Repository(db)) as any;
    e.startNameEntry(); e.submitName('Auto'); e.acceptCharacter(); e.dismissLevelIntro();
    e.char.hp = e.char.maxHp = 1e6;
    e.phase = 'playing'; e.combat = null;
    const s = e.beginCombat(createMonster('Kobold', 1, 'k'));
    expect(s.choices.some((c: { key: string; text: string }) => c.key === 'g' && c.text === 'Auto-fight')).toBe(true);
    e.phase = 'playing'; e.combat = null;
    const u = e.beginCombat(createMonster('Big Fat Dragon', 90, 't'));
    expect(u.choices.some((c: { key: string }) => c.key === 'g')).toBe(false);
    expect(e.autoFight().autoFight.stopped).toMatch(/great foe/);
  });
});
