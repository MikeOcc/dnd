// Trading: what's for sale, what you can sell, and the level 4 store's
// hours. The game engine runs the menus (see openShop / resolveShopChoice).
//
//   - The Trading Post, beside the entrance on level 1.
//   - The Outpost, beside the entrance on level 4: it keeps shifts, and now
//     and then a monster eats the proprietor.
//   - The Peddler, met by chance on the deep levels: a few fine things at
//     outrageous prices, gone once you walk away.

import type { Character, ShopItem, ShopState, GemType, Weapon, Armor, WeaponKind, ArmorKind } from './types.js';
import type { RNG } from './random.js';
import { SHOP, GEAR, GEMS } from './config.js';
import { canUseGear, gearName, bestWeapon, wornArmor } from './character.js';
import { spatialHash } from './corridor-view.js';

export const gearPrice = (g: Weapon | Armor) => Math.round(SHOP.GEAR_BASE[g.kind] * SHOP.PLUS_PRICE[Math.min(3, g.bonus)]);

/** A piece of gear of a random kind the character can use, at this plus. */
function gearFor(char: Character, rng: RNG, bonus: number): { type: 'weapon'; weapon: Weapon } | { type: 'armor'; armor: Armor } {
  const weapon = rng.float() < 0.5;
  const kinds = (weapon ? Object.keys(GEAR.WEAPONS) : Object.keys(GEAR.ARMOR)).filter(k => canUseGear(char, k));
  const kind = rng.pick(kinds);
  const base = rng.pick([...GEAR.NAMES[kind]]);
  const raw = bonus > 0 ? `${rng.pick([...GEAR.MAKERS[bonus]])} ${base}` : base;
  const name = raw[0].toUpperCase() + raw.slice(1);
  return weapon ? { type: 'weapon', weapon: { kind: kind as WeaponKind, bonus, name } } : { type: 'armor', armor: { kind: kind as ArmorKind, bonus, name } };
}

function gearItem(char: Character, rng: RNG, bonus: number, markup = 1): ShopItem {
  const goods = gearFor(char, rng, bonus);
  const g = goods.type === 'weapon' ? goods.weapon : goods.armor;
  return { label: gearName(g), price: Math.round(gearPrice(g) * markup), qty: 1, goods };
}

/** What's for sale this visit. */
export function buildStock(kind: ShopState['kind'], char: Character, rng: RNG): ShopItem[] {
  const gem = (g: GemType, markup = 1): ShopItem => ({ label: g[0].toUpperCase() + g.slice(1), price: Math.round(GEMS.VALUES[g] * SHOP.GEM_BUY_MULT * markup), qty: 1, goods: { type: 'gem', gem: g } });
  if (kind === 'peddler') {
    const m = SHOP.PEDDLER_MARKUP;
    return [
      gearItem(char, rng, rng.float() < 0.25 ? 3 : 2, m),
      gem('emerald', m),
      { label: 'Magic tome', price: Math.round(SHOP.TOME_PRICE * m), qty: 1, goods: { type: 'tome' } },
      { label: 'Healing potion', price: Math.round(SHOP.POTION_PRICE * m), qty: 3, goods: { type: 'potion' } },
    ];
  }
  const deep = kind === 'outpost';
  const stock: ShopItem[] = [
    { label: 'Healing potion', price: SHOP.POTION_PRICE, qty: deep ? 8 : 10, goods: { type: 'potion' } },
    { label: 'Magic tome', price: SHOP.TOME_PRICE, qty: 1, goods: { type: 'tome' } },
    gem('ruby'), gem(rng.pick(['sapphire', 'diamond'] as GemType[])),
  ];
  for (let i = 0; i < SHOP.POST_GEAR; i++) {
    const roll = rng.float();
    const bonus = deep ? (roll < 0.3 ? 0 : roll < 0.8 ? 1 : 2) : (roll < 0.6 ? 0 : 1);
    stock.push(gearItem(char, rng, bonus));
  }
  return stock;
}

/** Why a purchase can't go ahead, or null if it can. */
export function cannotBuy(char: Character, item: ShopItem): string | null {
  if (item.qty <= 0) return 'That is sold out.';
  if (char.gold < item.price) return `You can't afford that. (${item.price} gold; you have ${char.gold})`;
  const g = item.goods;
  if (g.type === 'gem' && char.inventory.gems[g.gem] >= (GEMS.CARRY_CAP[g.gem] ?? Infinity)) return `You can carry no more ${g.gem}s.`;
  if (g.type === 'weapon' && (char.inventory.weapons?.length ?? 0) >= GEAR.MAX_WEAPONS) return 'You have no room for another weapon. Sell one first.';
  if (g.type === 'armor' && (char.inventory.armor?.length ?? 0) >= GEAR.MAX_ARMOR) return 'You have no room for more armour. Sell some first.';
  return null;
}

/** Buys one (call cannotBuy first). Returns the line saying what happened. */
export function buy(char: Character, item: ShopItem): string {
  char.gold -= item.price;
  item.qty--;
  const g = item.goods;
  if (g.type === 'potion') char.inventory.potions++;
  else if (g.type === 'tome') char.inventory.books++;
  else if (g.type === 'gem') char.inventory.gems[g.gem]++;
  else if (g.type === 'weapon') char.inventory.weapons = [...(char.inventory.weapons ?? []), { ...g.weapon }];
  else char.inventory.armor = [...(char.inventory.armor ?? []), { ...g.armor }];
  return `You buy the ${item.label} for ${item.price} gold. (${char.gold} gold left)`;
}

export interface Sellable { label: string; price: number; sell: () => void }

/** What the character can sell: gems at their worth, weapons and armour at a share of their price. */
export function sellables(char: Character): Sellable[] {
  const out: Sellable[] = [];
  for (const g of Object.keys(char.inventory.gems) as GemType[]) {
    if (char.inventory.gems[g] > 0) out.push({ label: `${g[0].toUpperCase() + g.slice(1)} (you have ${char.inventory.gems[g]})`, price: GEMS.VALUES[g], sell: () => { char.inventory.gems[g]--; } });
  }
  const using = bestWeapon(char), worn = wornArmor(char);
  for (const w of char.inventory.weapons ?? []) {
    out.push({ label: `${gearName(w)}${w === using ? ' (wielded)' : ''}`, price: Math.round(gearPrice(w) * SHOP.SELL_SHARE), sell: () => { char.inventory.weapons = char.inventory.weapons!.filter(x => x !== w); } });
  }
  for (const a of char.inventory.armor ?? []) {
    out.push({ label: `${gearName(a)}${a === worn.body || a === worn.shield ? ' (worn)' : ''}`, price: Math.round(gearPrice(a) * SHOP.SELL_SHARE), sell: () => { char.inventory.armor = char.inventory.armor!.filter(x => x !== a); } });
  }
  return out;
}

/** The level 4 Outpost's hours at this much play time: open, shuttered
 * between shifts, or wrecked (the proprietor eaten), and the minutes until
 * the next shift opens. Each shift's fate is fixed per character. */
export function outpostHours(char: Character, playSeconds: number): { state: 'open' | 'between' | 'eaten'; minutesToOpen: number } {
  const period = SHOP.SHIFT_OPEN_SECONDS + SHOP.SHIFT_CLOSED_SECONDS;
  const shift = Math.floor(playSeconds / period);
  const into = playSeconds - shift * period;
  const idHash = [...char.id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  const eaten = (n: number) => spatialHash(idHash % 100000, n, 404) % 1000 < SHOP.EATEN_CHANCE * 1000;
  // The next shift that will actually open.
  let next = shift + 1;
  while (eaten(next)) next++;
  const minutesToOpen = Math.max(1, Math.ceil((next * period - playSeconds) / 60));
  if (into >= SHOP.SHIFT_OPEN_SECONDS) return { state: 'between', minutesToOpen };
  if (eaten(shift)) return { state: 'eaten', minutesToOpen };
  return { state: 'open', minutesToOpen: 0 };
}
