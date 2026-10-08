// The originals: Lantern Moths, the Toll-Keeper, the Hush, Cartographer's Bane.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createMemoryDb } from '../src/database/database.js';
import { Repository } from '../src/database/repositories.js';
import { GameEngine } from '../src/core/game-engine.js';
import { createMonster, pickRandomMonsterType } from '../src/core/monsters.js';
import { RNG } from '../src/core/random.js';
import { TOLL, HUSH } from '../src/core/config.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any;
beforeEach(() => { db = createMemoryDb(); });
afterEach(() => { db.close(); });

function engine() {
  const e = new GameEngine(new Repository(db));
  e.startNameEntry();
  e.submitName('Wanderer');
  e.acceptCharacter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const x = e as any;
  x.char.intelligence = Math.max(x.char.intelligence, 12);   // no spell backfires
  x.char.hp = x.char.maxHp = 1_000_000;
  x.dismissLevelIntro();
  return x;
}

const seenAt = (type: string, depth: number) => {
  const rng = new RNG(5);
  for (let i = 0; i < 6000; i++) if (pickRandomMonsterType(depth, rng) === type) return true;
  return false;
};

describe('where they turn up', () => {
  it('Lantern Moths in the shallows; the Toll-Keeper never at random; the Hush and the Bane benched for now', () => {
    expect(seenAt('Lantern Moths', 1)).toBe(true);
    expect(seenAt('Lantern Moths', 5)).toBe(false);
    for (let d = 1; d <= 7; d++) {
      expect(seenAt('Toll-Keeper', d)).toBe(false);
      expect(seenAt('Hush', d)).toBe(false);
      expect(seenAt("Cartographer's Bane", d)).toBe(false);
    }
  });
});

describe('Lantern Moths', () => {
  it('put out your torch: you lose to-hit, your light, and whatever comes next strikes first', () => {
    const e = engine();
    e.phase = 'playing'; e.combat = null;
    e.beginCombat(createMonster('Lantern Moths', 14, 'lm'));
    for (let i = 0; i < 60 && !e.char.statusEffects.some((s: { type: string }) => s.type === 'snuffed'); i++) {
      if (!e.combat) { e.phase = 'playing'; e.beginCombat(createMonster('Lantern Moths', 14, 'lm' + i)); }
      e.combat.monster.hp = e.combat.monster.maxHp;   // keep the swarm alive until it snuffs the torch
      e.combatAction('a');
    }
    expect(e.char.statusEffects.some((s: { type: string }) => s.type === 'snuffed')).toBe(true);
    // No light: only the square you stand on is lit.
    e.combat = null; e.phase = 'playing';
    e.dungeonState.visitedCells.clear();
    e.lightAround();
    expect(e.dungeonState.visitedCells.size).toBe(1);
    // The next thing that finds you in the dark strikes first.
    const s = e.beginCombat(createMonster('Goblin', 3, 'g'));
    expect(s.messages.join(' ')).toContain('In the dark, you never see it coming!');
  });
});

describe('the Toll-Keeper', () => {
  function atTheStair(gold: number) {
    const e = engine();
    e.char.dungeonLevel = 2;
    e.loadLevelIntoCache(2);
    const lvl = e.getLevel(2);
    e.char.x = lvl.exit.x; e.char.y = lvl.exit.y;
    e.char.gold = gold;
    e.phase = 'playing';
    return e;
  }

  it('stops you on the stair down from level 2 and names its price', () => {
    const e = atTheStair(1000);
    const s = e.climbDown();
    expect(s.phase).toBe('interaction');
    expect(e.interaction.type).toBe('toll');
    expect(e.interaction.toll).toBe(Math.round(1000 * TOLL.SHARE));
    expect(e.char.dungeonLevel).toBe(2);
  });

  it('takes gold, then lets you pass for good', () => {
    const e = atTheStair(1000);
    e.climbDown();
    e.interactionChoice('a');
    expect(e.char.gold).toBe(1000 - 250);
    expect(e.char.dungeonLevel).toBe(3);
    // Back up and down again: no second toll.
    e.char.dungeonLevel = 2;
    const lvl = e.getLevel(2);
    e.char.x = lvl.exit.x; e.char.y = lvl.exit.y; e.phase = 'playing';
    e.climbDown();
    expect(e.char.dungeonLevel).toBe(3);
  });

  it('turns away a purse too light, and takes a finger instead if you offer one', () => {
    const e = atTheStair(10);
    e.climbDown();
    e.interactionChoice('a');
    expect(e.char.dungeonLevel).toBe(2);
    expect(e.char.gold).toBe(10);
    const dex = e.char.dexterity;
    e.interactionChoice('b');
    expect(e.char.dexterity).toBe(Math.max(3, dex - 1));
    expect(e.char.dungeonLevel).toBe(3);
  });

  it('can be fought, or left', () => {
    const e = atTheStair(100);
    e.climbDown();
    const fight = e.interactionChoice('c');
    expect(fight.phase).toBe('combat');
    expect(e.combat.monster.type).toBe('Toll-Keeper');
    const f = atTheStair(100);
    f.climbDown();
    const back = f.interactionChoice('d');
    expect(back.phase).toBe('playing');
    expect(f.char.dungeonLevel).toBe(2);
  });
});

describe('the Hush', () => {
  it('swallows every spell and prayer, and leaves you deaf', () => {
    const e = engine();
    e.char.dungeonLevel = 4;
    e.phase = 'playing'; e.combat = null;
    e.beginCombat(createMonster('Hush', 30, 'h'));
    expect(e.char.statusEffects.find((s: { type: string }) => s.type === 'deafened')?.turns).toBe(HUSH.DEAF_STEPS);
    const hp = e.combat.monster.hp;
    const cast = e.spellAction('a');
    expect(cast.messages.join(' ')).toContain('No sound comes out');
    expect(e.combat.monster.hp).toBe(hp);
    e.char.heldRounds = 0; delete e.char.heldBy;   // (its stillness may have held you a round)
    const pray = e.combatAction('c');
    expect(pray.messages.join(' ')).toContain('not a sound leaves your lips');
    expect(e.combat.monster.hp).toBe(hp);
  });
});

describe("Cartographer's Bane", () => {
  it("tears away part of the level's map, never right around you", () => {
    const e = engine();
    e.char.dungeonLevel = 5;
    e.loadLevelIntoCache(5);
    e.char.x = 40; e.char.y = 30;
    for (let x = 0; x < 80; x++) for (let y = 0; y < 60; y++) e.dungeonState.visitedCells.add(`5:${x},${y}`);
    e.dungeonState.visitedCells.add('4:1,1');
    e.dungeonState.revealedLevels.add(5);
    e.phase = 'playing';
    e.beginCombat(createMonster("Cartographer's Bane", 40, 'cb'));
    e.combat.monster.mapBites = 1;
    const result = { messages: [] as string[] };
    e.noteMonsterTurn(result);
    const left = [...e.dungeonState.visitedCells].filter((k: string) => k.startsWith('5:')).length;
    expect(left).toBe(80 * 60 - Math.round(80 * 60 * 0.25));
    expect(e.dungeonState.visitedCells.has('5:40,30')).toBe(true);
    expect(e.dungeonState.visitedCells.has('4:1,1')).toBe(true);
    expect(e.dungeonState.revealedLevels.has(5)).toBe(false);
    expect(result.messages.join(' ')).toContain('Part of your map of Level 5 is gone');
    expect(e.combat.monster.mapBites).toBe(0);
  });
});

describe('great foes in their rooms', () => {
  it('stand in the 3D scene, facing the way in, until beaten', () => {
    const e = engine();
    e.char.dungeonLevel = 6;
    e.loadLevelIntoCache(6);
    const lvl = e.getLevel(6);
    const [k, c] = [...lvl.contents].find(([, v]: [string, { type: string; monsterId?: string }]) => v.type === 'unique-monster' && v.monsterId === 'Lambton Worm')!;
    const [x, y] = k.split(',').map(Number);
    e.char.x = x; e.char.y = y + 1;
    const seen = () => e.getState().scene.objects.find((o: { kind: string; type?: string }) => o.kind === 'monster' && o.type === 'Lambton Worm');
    const obj = seen();
    expect(obj).toBeDefined();
    expect(['N', 'E', 'S', 'W']).toContain(obj.facing);
    e.dungeonState.defeatedUniqueMonsters.add(c.id);
    expect(seen()).toBeUndefined();
  });
});

describe('near the Aboleth', () => {
  function nearIt(distance: number) {
    const e = engine();
    e.char.dungeonLevel = 6;
    e.loadLevelIntoCache(6);
    const lvl = e.getLevel(6);
    const [k] = [...lvl.contents].find(([, v]: [string, { type: string; monsterId?: string }]) => v.type === 'unique-monster' && v.monsterId === 'Aboleth')!;
    const [x, y] = k.split(',').map(Number);
    // Walk `distance` open steps out from its lair (or as far as the passages allow).
    let at = { x, y };
    const seen = new Set([`${x},${y}`]);
    const steps = [['N', 0, -1], ['E', 1, 0], ['S', 0, 1], ['W', -1, 0]] as const;
    for (let i = 0; i < distance; i++) {
      const next = steps.map(([d, dx, dy]) => ({ d, x: at.x + dx, y: at.y + dy }))
        .find(p => !lvl.grid[at.y][at.x].walls[p.d] && !seen.has(`${p.x},${p.y}`)
          && Math.abs(p.x - x) + Math.abs(p.y - y) > Math.abs(at.x - x) + Math.abs(at.y - y));
      if (!next) break;
      at = { x: next.x, y: next.y }; seen.add(`${at.x},${at.y}`);
    }
    if (distance >= 20) at = { x: lvl.entrance.x, y: lvl.entrance.y };
    e.char.x = at.x; e.char.y = at.y;
    e.phase = 'playing';
    return e;
  }

  it('you smell it, hear it close by, and now and then it swoops on you and strikes first', () => {
    let smelt = false, heard = false, swooped = false;
    const e = nearIt(2);
    const spot = { x: e.char.x, y: e.char.y };
    for (let i = 0; i < 1500 && !(smelt && heard && swooped); i++) {
      e.combat = null; e.phase = 'playing'; e.char.x = spot.x; e.char.y = spot.y;
      e.messages = []; e.fx = {};
      const s = e.nearTheAboleth() ?? e.getState();
      if (s.messages.join(' ').match(/stink of evil|Three red eyes|I see you|slime is moving|wet wings/i)) smelt = true;
      if ((s.fx?.cues || []).includes('aboleth')) heard = true;
      if (s.phase === 'combat') { swooped = true; expect(e.combat.monster.type).toBe('Aboleth'); expect(s.messages.join(' ')).toContain('drops out of the air'); }
    }
    expect(smelt && heard && swooped).toBe(true);
  });

  it('is quiet far from it, and once it is beaten', () => {
    const far = nearIt(20);
    for (let i = 0; i < 100; i++) expect(far.nearTheAboleth()).toBeNull();
    const done = nearIt(2);
    done.dungeonState.defeatedUniqueMonsters.add('unique-aboleth');
    for (let i = 0; i < 200; i++) { done.fx = {}; expect(done.nearTheAboleth()).toBeNull(); expect(done.getState().fx?.cues ?? []).not.toContain('aboleth'); }
  });
});
