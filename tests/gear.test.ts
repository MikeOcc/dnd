import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RNG } from '../src/core/random.js';
import { rollCharacter, createCharacter, bestWeapon, wornArmor, armorProtection, getEffectiveStats } from '../src/core/character.js';
import { resolveChest, rollGear } from '../src/core/encounters.js';
import { createMonster } from '../src/core/monsters.js';
import { playerAttack, monsterFirstStrike } from '../src/core/combat.js';
import { createMemoryDb } from '../src/database/database.js';
import { Repository } from '../src/database/repositories.js';
import { GameEngine } from '../src/core/game-engine.js';
import { GEAR } from '../src/core/config.js';
import type { Character, Weapon, Armor } from '../src/core/types.js';

function hero(cls: 'wizard' | 'warrior' = 'warrior', weapons: Weapon[] = [], armor: Armor[] = []): Character {
  const c = createCharacter('h', 'Hero', rollCharacter(new RNG(1)));
  c.charClass = cls; c.level = 30; c.strength = 14; c.dexterity = 14; c.hp = c.maxHp = 1e7; c.statusEffects = [];
  c.inventory.weapons = weapons; c.inventory.armor = armor;
  return c;
}
const w = (kind: Weapon['kind'], bonus = 0): Weapon => ({ kind, bonus, name: kind });
const a = (kind: Armor['kind'], bonus = 0): Armor => ({ kind, bonus, name: kind });

/** Average damage of hits on a (non-regenerating) monster. */
function avgHit(c: Character, type: Parameters<typeof createMonster>[0] = 'Giant', level = 20) {
  const rng = new RNG(99); let total = 0, hits = 0;
  for (let i = 0; i < 1500; i++) {
    const m = createMonster(type, level, 'm' + i); m.hp = m.maxHp = 1e7;
    playerAttack({ ...c, hp: 1e7 }, m, rng);
    if (m.hp < 1e7) { total += 1e7 - m.hp; hits++; }
  }
  return total / Math.max(1, hits);
}
/** Average damage a monster's plain blows deal. */
function avgTaken(c: Character, type: Parameters<typeof createMonster>[0] = 'Giant') {
  const rng = new RNG(5); let total = 0;
  for (let i = 0; i < 1500; i++) { const cc = { ...c, hp: 1e7, statusEffects: [] }; monsterFirstStrike(cc, createMonster(type, 20, 'g' + i), rng); total += 1e7 - cc.hp; }
  return total / 1500;
}

describe('Weapons', () => {
  it('you fight with the best weapon you can use; wizards only with daggers', () => {
    const war = hero('warrior', [w('dagger', 1), w('sword', 2), w('axe', 0)]);
    expect(bestWeapon(war)!.kind).toBe('sword');
    const wiz = hero('wizard', [w('sword', 3), w('dagger', 1)]);
    expect(bestWeapon(wiz)!.kind).toBe('dagger');
  });

  it('a sword or axe hits harder than fighting without one, and each plus adds more', () => {
    const none = avgHit(hero()), sword = avgHit(hero('warrior', [w('sword')])), sword3 = avgHit(hero('warrior', [w('sword', 3)]));
    expect(sword).toBeGreaterThan(none);
    expect(sword3).toBeGreaterThan(sword * 1.3);
  });

  it('a mace crushes the undead', () => {
    const vsSkel = avgHit(hero('warrior', [w('mace')]), 'Skeleton', 10) / avgHit(hero('warrior', [w('sword')]), 'Skeleton', 10);
    const vsGiant = avgHit(hero('warrior', [w('mace')])) / avgHit(hero('warrior', [w('sword')]));
    expect(vsSkel).toBeGreaterThan(vsGiant * 1.15);
  });

  it('a Rakshasa takes a quarter from ordinary steel, and the full blow only from a +3', () => {
    const ratio = (plus: number) => avgHit(hero('wizard', plus ? [w('dagger', plus)] : []), 'Rakshasa') / avgHit(hero('wizard', plus ? [w('dagger', plus)] : []));
    expect(ratio(0)).toBeCloseTo(0.25, 1);
    expect(ratio(1)).toBeCloseTo(0.5, 1);
    expect(ratio(3)).toBeCloseTo(1, 1);
  });
});

describe('Armour', () => {
  it('turns aside part of every blow: plate more than chain more than leather, a shield on top', () => {
    const none = avgTaken(hero());
    const leather = avgTaken(hero('warrior', [], [a('leather')]));
    const plate = avgTaken(hero('warrior', [], [a('plate')]));
    const plateShield = avgTaken(hero('warrior', [], [a('plate', 2), a('shield', 1)]));
    expect(leather).toBeLessThan(none);
    expect(plate).toBeLessThan(leather);
    expect(plateShield).toBeLessThan(plate);
    expect(armorProtection(hero('warrior', [], [a('plate', 3), a('shield', 3), a('chain', 3)]))).toBeLessThanOrEqual(GEAR.MAX_CUT);
  });

  it('heavy armour costs Dexterity; wizards wear only leather and no shield', () => {
    const c = hero('warrior', [], [a('plate')]);
    expect(getEffectiveStats(c).dexterity).toBe(c.dexterity - GEAR.ARMOR.plate.dex);
    const wiz = hero('wizard', [], [a('plate', 3), a('shield', 2), a('leather', 1)]);
    expect(wornArmor(wiz)).toEqual({ body: a('leather', 1), shield: undefined });
  });

  it('protects only half as well against magic and breath', () => {
    const drop = (type: Parameters<typeof createMonster>[0]) => 1 - avgTaken(hero('warrior', [], [a('plate', 3)]), type) / avgTaken(hero(), type);
    expect(drop('Giant')).toBeGreaterThan(drop('Red Dragon'));
  });
});

describe('Finding gear', () => {
  it('chests hold weapons and armour now and then, only of kinds you can use, better ones deeper', () => {
    const tally = (cls: 'wizard' | 'warrior', level: number) => {
      const rng = new RNG(3); let n = 0, plus3 = 0; const kinds = new Set<string>();
      for (let i = 0; i < 20000; i++) {
        const c = hero(cls); c.dungeonLevel = level;
        resolveChest(c, rng);
        for (const g of [...(c.inventory.weapons ?? []), ...(c.inventory.armor ?? [])]) { n++; kinds.add(g.kind); if (g.bonus === 3) plus3++; }
      }
      return { rate: n / 20000, kinds, plus3: plus3 / Math.max(1, n) };
    };
    const war1 = tally('warrior', 1), war6 = tally('warrior', 6), wiz = tally('wizard', 4);
    expect(war1.rate).toBeGreaterThan(0.035); expect(war1.rate).toBeLessThan(0.065);
    expect(war6.plus3).toBeGreaterThan(war1.plus3);
    expect([...wiz.kinds].sort()).toEqual(['dagger', 'leather']);
    expect(war1.kinds.has('plate') && war1.kinds.has('axe')).toBe(true);
  });

  it('a full pack takes no more', () => {
    const c = hero('warrior', Array.from({ length: GEAR.MAX_WEAPONS }, () => w('sword')), Array.from({ length: GEAR.MAX_ARMOR }, () => a('chain')));
    const rng = new RNG(4);
    for (let i = 0; i < 200; i++) expect(rollGear(c, rng, 'monster')).toBeNull();
  });
});

describe('Gear, saved', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let db: any;
  beforeEach(() => { db = createMemoryDb(); });
  afterEach(() => { db.close(); });

  it('survives a save and load, and an old save’s magic daggers become weapons', () => {
    const repo = new Repository(db);
    const c = hero('warrior', [w('sword', 2)], [a('plate', 1)]); c.id = 'char-gear'; c.createdAt = c.lastSaved = Date.now();
    (c.inventory as unknown as { daggers: unknown[] }).daggers = [{ bonus: 3, name: 'Dawnfang' }];
    repo.saveCharacter(c);
    const back = repo.loadCharacter('char-gear')!;
    expect(back.inventory.armor).toEqual([a('plate', 1)]);
    expect(back.inventory.weapons).toEqual([w('sword', 2), { kind: 'dagger', bonus: 3, name: 'Dawnfang' }]);
    expect((back.inventory as unknown as { daggers?: unknown }).daggers).toBeUndefined();
  });
});

describe('Choosing gear by hand', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let db: any;
  beforeEach(() => { db = createMemoryDb(); });
  afterEach(() => { db.close(); });

  function ready(cls: 'wizard' | 'warrior') {
    const engine = new GameEngine(new Repository(db));
    engine.startNameEntry(); engine.submitName('Kit'); engine.acceptCharacter(cls);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e = engine as any;
    e.dismissLevelIntro(); e.phase = 'playing';
    return { engine, e };
  }

  it('a chosen weapon and armour are used instead of the best; Automatic goes back to the best', () => {
    const { engine, e } = ready('warrior');
    e.char.inventory.weapons = [w('sword', 3), w('mace', 0)];
    e.char.inventory.armor = [a('plate', 2), a('leather', 0), a('shield', 0)];
    expect(bestWeapon(e.char)!.kind).toBe('sword');
    let s = engine.openGear();
    expect(s.phase).toBe('interaction');
    engine.interactionChoice('b');                         // the mace
    s = engine.interactionChoice('a');                     // fight with it
    expect(bestWeapon(e.char)!.kind).toBe('mace');
    expect(s.messages.join(' ')).toContain('You take up the mace');
    engine.interactionChoice('d');                         // the leather
    engine.interactionChoice('a');                         // wear it
    expect(wornArmor(e.char).body!.kind).toBe('leather');
    expect(wornArmor(e.char).shield!.kind).toBe('shield'); // the shield stays on
    engine.interactionChoice('f');                         // Automatic (5 items: a-e, then f)
    expect(bestWeapon(e.char)!.kind).toBe('sword');
    expect(wornArmor(e.char).body!.kind).toBe('plate');
    s = engine.interactionChoice('g');                     // Done
    expect(s.phase).toBe('playing');
  });

  it('gear can be dropped', () => {
    const { engine, e } = ready('warrior');
    e.char.inventory.weapons = [w('sword'), w('axe')];
    e.char.inventory.armor = [];
    engine.openGear();
    engine.interactionChoice('a');
    const s = engine.interactionChoice('b');               // drop the sword
    expect(e.char.inventory.weapons.map((x: Weapon) => x.kind)).toEqual(['axe']);
    expect(s.messages.join(' ')).toContain('You leave the sword behind');
  });

  it("a wizard can't take up what only warriors use, and the choice is saved", () => {
    const { engine, e } = ready('wizard');
    e.char.inventory.weapons = [w('sword', 3), w('dagger', 0), w('dagger', 1)];
    e.char.inventory.armor = [];
    engine.openGear();
    const s = engine.interactionChoice('a');               // the sword
    expect(s.choices!.map((c: { text: string }) => c.text)).not.toContain('Fight with this');
    engine.interactionChoice('a');                         // (no such option: back to the list)
    expect(bestWeapon(e.char)!.kind).toBe('dagger');
    engine.interactionChoice('b'); engine.interactionChoice('a');   // the +0 dagger: fight with it
    expect(bestWeapon(e.char)!.bonus).toBe(0);
    const repo = new Repository(db);
    repo.saveCharacter(e.char);
    expect(bestWeapon(repo.loadCharacter(e.char.id)!)!.bonus).toBe(0);
  });
});

describe('The inventory screen', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let db: any;
  beforeEach(() => { db = createMemoryDb(); });
  afterEach(() => { db.close(); });

  it('lists what is worn and in use first, marked, apart from what is only carried', () => {
    const engine = new GameEngine(new Repository(db));
    engine.startNameEntry(); engine.submitName('Kit'); engine.acceptCharacter('warrior');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e = engine as any;
    e.dismissLevelIntro(); e.phase = 'playing';
    e.char.inventory.weapons = [w('sword', 2), w('mace', 0)];
    e.char.inventory.armor = [a('chain', 1)];
    e.char.inventory.rings = ['fire', 'cold', 'wither']; e.char.inventory.wornRings = ['fire']; e.char.inventory.readiedRing = 'wither';
    const text = engine.showInventory().messages.join('\n');
    const [using, rest] = text.split('CARRIED, NOT IN USE');
    expect(using).toMatch(/► .*sword.*WIELDED/);
    expect(using).toMatch(/► .*chain.*WORN/);
    expect(using).toMatch(/► Ruby ring .*WORN/);
    expect(using).toMatch(/► Bloodstone ring .*READIED/);
    expect(rest).toContain('mace');
    expect(rest).toContain('Aquamarine ring');
    expect(rest).not.toContain('►');
  });
});
