import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RNG } from '../src/core/random.js';
import { rollCharacter, createCharacter } from '../src/core/character.js';
import { buildStock, cannotBuy, buy, sellables, outpostHours, gearPrice } from '../src/core/shop.js';
import { createMemoryDb } from '../src/database/database.js';
import { Repository } from '../src/database/repositories.js';
import { GameEngine } from '../src/core/game-engine.js';
import { SHOP, GEMS } from '../src/core/config.js';
import type { Character } from '../src/core/types.js';

function hero(cls: 'wizard' | 'warrior' = 'warrior', gold = 5000): Character {
  const c = createCharacter('char-shop-test', 'Hero', rollCharacter(new RNG(1)));
  c.charClass = cls; c.gold = gold; c.level = 20;
  return c;
}

describe('Buying and selling', () => {
  it('a potion costs its price; too little gold, sold out, or a full pack say so', () => {
    const c = hero('warrior', 100);
    const stock = buildStock('post', c, new RNG(2));
    const potion = stock.find(s => s.goods.type === 'potion')!;
    expect(cannotBuy(c, potion)).toBeNull();
    const before = c.inventory.potions;
    buy(c, potion);
    expect(c.gold).toBe(100 - SHOP.POTION_PRICE);
    expect(c.inventory.potions).toBe(before + 1);
    expect(cannotBuy(c, potion)).toContain("can't afford");
    potion.qty = 0;
    expect(cannotBuy(hero(), potion)).toContain('sold out');
    const rich = hero(); rich.inventory.gems.emerald = 3;
    expect(cannotBuy(rich, buildStock('peddler', rich, new RNG(3)).find(s => s.goods.type === 'gem')!)).toContain('no more emerald');
  });

  it('gems sell at their stated worth, gear at a share of its price', () => {
    const c = hero(); c.gold = 0; c.inventory.gems.diamond = 1;
    c.inventory.weapons = [{ kind: 'sword', bonus: 1, name: 'Runed longsword' }];
    const list = sellables(c);
    const diamond = list.find(s => s.label.startsWith('Diamond'))!;
    expect(diamond.price).toBe(GEMS.VALUES.diamond);
    const sword = list.find(s => s.label.startsWith('Runed'))!;
    expect(sword.price).toBe(Math.round(gearPrice({ kind: 'sword', bonus: 1, name: '' }) * SHOP.SELL_SHARE));
    sword.sell();
    expect(c.inventory.weapons).toEqual([]);
  });

  it('wizards are only offered daggers and leather; the Peddler offers +2 or better, at a markup', () => {
    const wiz = hero('wizard');
    for (let i = 0; i < 40; i++) {
      for (const s of buildStock('post', wiz, new RNG(i))) {
        if (s.goods.type === 'weapon') expect(s.goods.weapon.kind).toBe('dagger');
        if (s.goods.type === 'armor') expect(s.goods.armor.kind).toBe('leather');
      }
    }
    const ped = buildStock('peddler', hero(), new RNG(5));
    const gear = ped.find(s => s.goods.type === 'weapon' || s.goods.type === 'armor')!;
    const g = gear.goods.type === 'weapon' ? gear.goods.weapon : gear.goods.type === 'armor' ? gear.goods.armor : null;
    expect(g!.bonus).toBeGreaterThanOrEqual(2);
    expect(ped.find(s => s.goods.type === 'potion')!.price).toBe(Math.round(SHOP.POTION_PRICE * SHOP.PEDDLER_MARKUP));
  });
});

describe('The Outpost keeps shifts', () => {
  it('open, then shuttered between shifts; some shifts the proprietor is eaten; it always says when it opens next', () => {
    const c = hero();
    const period = SHOP.SHIFT_OPEN_SECONDS + SHOP.SHIFT_CLOSED_SECONDS;
    let eaten = 0, shifts = 400;
    for (let s = 0; s < shifts; s++) {
      const opening = outpostHours(c, s * period + 10);
      expect(['open', 'eaten']).toContain(opening.state);
      if (opening.state === 'eaten') { eaten++; expect(opening.minutesToOpen).toBeGreaterThan(0); }
      const between = outpostHours(c, s * period + SHOP.SHIFT_OPEN_SECONDS + 5);
      expect(between.state).toBe('between');
      expect(between.minutesToOpen).toBeLessThanOrEqual(Math.ceil((SHOP.SHIFT_CLOSED_SECONDS + period * 5) / 60));
    }
    expect(eaten / shifts).toBeGreaterThan(0.12); expect(eaten / shifts).toBeLessThan(0.28);
    // The same moment always gives the same answer.
    expect(outpostHours(c, 12345)).toEqual(outpostHours(c, 12345));
  });
});

describe('Shops in the game', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let db: any;
  beforeEach(() => { db = createMemoryDb(); });
  afterEach(() => { db.close(); });

  function ready() {
    const engine = new GameEngine(new Repository(db));
    engine.startNameEntry(); engine.submitName('Trader'); engine.acceptCharacter();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e = engine as any;
    e.dismissLevelIntro();
    return { engine, e };
  }
  const shopOn = (e: any, level: number) => [...e.getLevel(level).contents.entries()].find(([, c]: [string, { type: string }]) => c.type === 'shop');

  it('the Trading Post stands beside the entrance on level 1, the Outpost on level 4, and nowhere else', () => {
    const { e } = ready();
    for (const lvl of [1, 2, 3, 4, 5, 6, 7]) {
      e.loadLevelIntoCache(lvl);
      const found = shopOn(e, lvl);
      if (lvl === 1 || lvl === 4) {
        expect(found).toBeDefined();
        const [x, y] = found![0].split(',').map(Number);
        const ent = e.getLevel(lvl).entrance;
        expect(Math.abs(x - ent.x) + Math.abs(y - ent.y)).toBe(1);
        expect(found![1].id).toBe(lvl === 1 ? 'trading-post' : 'outpost');
      } else expect(found).toBeUndefined();
    }
  });

  it('stepping up to the Trading Post opens it: buy a potion, sell a gem, and leave', () => {
    const { engine, e } = ready();
    e.char.gold = 500; e.char.inventory.gems.ruby = 1;
    const potions = e.char.inventory.potions;
    let s = e.handleCellContent({ type: 'shop', id: 'trading-post' }, 'x');
    expect(s.phase).toBe('interaction');
    expect(s.messages[0]).toContain('TRADING POST');
    s = engine.interactionChoice('a');                       // Buy
    const potionKey = s.choices!.find((c: { text: string }) => c.text.startsWith('Healing potion'))!.key;
    s = engine.interactionChoice(potionKey);
    expect(e.char.inventory.potions).toBe(potions + 1);
    expect(e.char.gold).toBe(500 - SHOP.POTION_PRICE);
    s = engine.interactionChoice(s.choices!.find((c: { text: string }) => c.text === 'Sell instead')!.key);
    s = engine.interactionChoice(s.choices!.find((c: { text: string }) => c.text.includes('Ruby'))!.key);
    expect(e.char.inventory.gems.ruby).toBe(0);
    expect(e.char.gold).toBe(500 - SHOP.POTION_PRICE + GEMS.VALUES.ruby);
    expect(s.choices!.at(-1)!.text).toBe('Done trading (Esc)');
    s = engine.interactionChoice(s.choices!.at(-1)!.key);    // Done trading
    expect(s.phase).toBe('playing');
  });

  it('the Peddler, too: Done trading (Esc) on every list, and Sell instead / Buy instead', () => {
    const { engine, e } = ready();
    let s = e.openShop('peddler');
    expect(s.choices!.at(-1)!.text).toBe('Done trading (Esc)');
    s = engine.interactionChoice('a');                       // Buy
    expect(s.choices!.map((c: { text: string }) => c.text).slice(-2)).toEqual(['Sell instead', 'Done trading (Esc)']);
    s = engine.interactionChoice(s.choices!.at(-2)!.key);    // Sell instead
    expect(s.choices!.map((c: { text: string }) => c.text).slice(-2)).toEqual(['Buy instead', 'Done trading (Esc)']);
    s = engine.interactionChoice(s.choices!.at(-1)!.key);    // Done trading
    expect(s.phase).toBe('playing');
    expect(s.messages.join(' ')).toContain('the peddler is gone');
  });

  it('the Outpost, when shut, says why and when it opens, and lets you walk on', () => {
    const { e } = ready();
    e.char.playTime = SHOP.SHIFT_OPEN_SECONDS + 10;            // between shifts
    e.sessionStart = Date.now();
    const s = e.handleCellContent({ type: 'shop', id: 'outpost' }, 'x');
    expect(s.phase).toBe('playing');
    expect(s.messages.join(' ')).toMatch(/CLOSED BETWEEN SHIFTS|PROPRIETOR EATEN/);
    expect(s.messages.join(' ')).toMatch(/opens again in about \d+ minute/);
  });

  it('the Peddler turns up only deep down, and is gone once you leave', () => {
    const { engine, e } = ready();
    e.rng.float = () => 0;                                   // every chance taken
    e.char.dungeonLevel = 2; e.loadLevelIntoCache(2);
    const s2 = e.openShop.call(e, 'peddler');
    expect(s2.messages[0]).toContain('PEDDLER');
    const left = engine.interactionChoice('c');
    expect(left.messages.join(' ')).toContain('the peddler is gone');
  });
});
