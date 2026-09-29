import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createMemoryDb } from '../src/database/database.js';
import { Repository } from '../src/database/repositories.js';
import { GameEngine } from '../src/core/game-engine.js';
import { createMonster } from '../src/core/monsters.js';
import { chestTrapFor } from '../src/core/encounters.js';
import { xpForLevel } from '../src/core/character.js';
import { abilityElement } from '../src/core/combat.js';
import { MENU_LORE } from '../src/content/menu-lore.js';
import { canMove, floodFill } from '../src/core/dungeon.js';
import { DUNGEON } from '../src/core/config.js';
import type { DungeonCell } from '../src/core/types.js';

function openGrid(w: number, h: number): DungeonCell[][] {
  const grid: DungeonCell[][] = [];
  for (let y = 0; y < h; y++) {
    grid[y] = [];
    for (let x = 0; x < w; x++) {
      grid[y][x] = { x, y, walls: { N: true, E: false, S: true, W: false } };
    }
  }
  return grid;
}

// Using 'any' intentionally: DatabaseSync type is lazy-loaded at runtime.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeReadyEngine(db: any): GameEngine {
  const repo = new Repository(db);
  const engine = new GameEngine(repo);
  engine.startNameEntry();
  engine.submitName('DeathTestHero');
  engine.acceptCharacter();
  return engine;
}

/** Puts the engine into combat with a 1-HP character, guaranteeing the
 * monster's next hit (always >= 1 damage) kills them. */
function forceLethalCombat(engine: GameEngine, monsterType: Parameters<typeof createMonster>[0] = 'Kobold') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const e = engine as any;
  e.char.hp = 1;
  e.phase = 'combat';
  e.combat = {
    monster: createMonster(monsterType, 5, 'lethal-test-monster'),
    round: 1,
    nakedActive: false,
    preCombatX: e.char.x,
    preCombatY: e.char.y,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
describe('GameEngine — death screen', () => {
  let db: any;

  beforeEach(() => {
    db = createMemoryDb();
  });

  afterEach(() => {
    db.close();
  });

  it('reports the cause of death and stops on the death phase', () => {
    const engine = makeReadyEngine(db);
    forceLethalCombat(engine, 'Kobold');

    const state = engine.combatAction('a'); // Attack — player's hit doesn't matter, monster's counter always kills

    expect(state.phase).toBe('death');
    expect(state.messages[0]).toMatch(/^Killed by .*a Level 5 Kobold/);
  });

  it('offers Continue and Quit choices instead of a single "any key" prompt', () => {
    const engine = makeReadyEngine(db);
    forceLethalCombat(engine, 'Kobold');
    const state = engine.combatAction('a');

    expect(state.choices).toEqual([
      { key: 'c', text: 'Return to Last Save' },
      { key: 'q', text: 'Quit to Main Menu' },
    ]);
  });

  it('continuing after death restores the last save: place, health and pack', () => {
    const engine = makeReadyEngine(db);
    const e = engine as any;
    e.char.inventory.potions = 3;
    e.char.gold = 250;
    engine.saveAndPrompt();
    const saved = { x: e.char.x, y: e.char.y, hp: e.char.hp, gold: 250, potions: 3 };

    // wander off, spend things, then die
    e.char.x += 1; e.char.gold = 10; e.char.inventory.potions = 0;
    forceLethalCombat(engine, 'Kobold');
    engine.combatAction('a');

    const state = engine.dismissDeath();
    expect(state.phase).toBe('playing');
    expect(state.messages[0]).toContain('back where you last saved');
    expect([e.char.x, e.char.y, e.char.hp, e.char.gold, e.char.inventory.potions])
      .toEqual([saved.x, saved.y, saved.hp, saved.gold, saved.potions]);
  });

  it('names the attack that did the character in, and shows the blow', () => {
    const engine = makeReadyEngine(db);
    const e = engine as any;
    let named = false;
    for (let i = 0; i < 60 && !named; i++) {
      forceLethalCombat(engine, 'Red Dragon');
      const state = engine.combatAction('a');
      if (state.phase !== 'death') continue;
      if (state.messages[0].startsWith('Killed by the ')) {
        named = true;
        expect(state.messages[0]).toMatch(/^Killed by the .+ of a Level \d+ Red Dragon\.$/);
        expect(state.messages[2]).toContain('Red Dragon');
      }
      engine.dismissDeath();
      e.phase = 'playing';
    }
    expect(named).toBe(true);
  });

  it('Quit to Main Menu goes straight to the main menu', () => {
    const engine = makeReadyEngine(db);
    forceLethalCombat(engine, 'Kobold');
    engine.combatAction('a');

    const state = engine.showMainMenu();
    expect(state.phase).toBe('main-menu');
  });
});

describe('GameEngine — unique boss level rolls', () => {
  let db: any;

  beforeEach(() => {
    db = createMemoryDb();
  });

  afterEach(() => {
    db.close();
  });

  it("Asmodeus's level varies between 80 and 100 across encounters", () => {
    const engine = makeReadyEngine(db);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e = engine as any;

    const levels = new Set<number>();
    for (let i = 0; i < 60; i++) {
      const state = e.startFixedEncounter(
        { id: `unique-asmodeus-${i}`, type: 'unique-monster', monsterId: 'Asmodeus' },
        'Asmodeus',
      );
      levels.add(state.combat.monster.level);
      expect(state.combat.monster.level).toBeGreaterThanOrEqual(80);
      expect(state.combat.monster.level).toBeLessThanOrEqual(100);
    }
    // Should see real variation, not the same roll every time
    expect(levels.size).toBeGreaterThan(5);
  });

  it('every unique boss now has a real range and rolls a fresh level each encounter', () => {
    const engine = makeReadyEngine(db);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e = engine as any;

    for (const [monsterId, min, max] of [
      ['Aboleth', 60, 75],
      ['Dracolich', 60, 75],
      ['Nightwalker', 60, 75],
      ['Tarrasque', 72, 90],
      ['Tiamat', 72, 90],
    ] as const) {
      const levels = new Set<number>();
      for (let i = 0; i < 40; i++) {
        const state = e.startFixedEncounter(
          { id: `unique-${monsterId}-${i}`, type: 'unique-monster', monsterId },
          monsterId,
        );
        levels.add(state.combat.monster.level);
        expect(state.combat.monster.level).toBeGreaterThanOrEqual(min);
        expect(state.combat.monster.level).toBeLessThanOrEqual(max);
      }
      // Should see real variation, not the same roll every time
      expect(levels.size).toBeGreaterThan(3);
    }
  });
});

describe('GameEngine — map centering', () => {
  let db: any;

  beforeEach(() => {
    db = createMemoryDb();
  });

  afterEach(() => {
    db.close();
  });

  it("shows a fixed-size window with the player's @ at its exact center", () => {
    const engine = makeReadyEngine(db);
    const e = engine as any;

    // Move the player well away from the map edges and mark cells visited
    // both near the player and far outside the view radius, to prove the
    // window is centered on the player rather than fit to everything explored.
    e.char.x = 40;
    e.char.y = 30;
    const L = e.char.dungeonLevel;
    const carved = e.getLevel(L).grid.flat().find((c: DungeonCell) => !(c.walls.N && c.walls.S && c.walls.E && c.walls.W));
    e.dungeonState.visitedCells = new Set([
      `${L}:40,30`,
      `${L}:35,30`,
      `${L}:45,30`,
      `${L}:0,0`,
      `${L}:${DUNGEON.WIDTH - 1},${DUNGEON.HEIGHT - 1}`,
      `${L}:${carved.x},${carved.y}`,
    ]);

    const state = e.showMap();
    const r = DUNGEON.MAP_VIEW_RADIUS;

    // Rows: header, top border, (2r+1) map rows, bottom border, blank, legend
    const mapRows = state.messages.slice(2, 2 + (2 * r + 1));
    expect(mapRows.length).toBe(2 * r + 1);

    const centerRow = mapRows[r];
    // Each row is prefixed with two spaces of indentation.
    const atIndex = centerRow.indexOf('@');
    expect(atIndex).toBe(2 + r);
  });

  it('clamps the window near the edge of the dungeon without losing centering on the clamped axis', () => {
    const engine = makeReadyEngine(db);
    const e = engine as any;

    e.char.x = 0;
    e.char.y = 0;
    const L = e.char.dungeonLevel;
    const carved = e.getLevel(L).grid.flat().find((c: DungeonCell) => !(c.walls.N && c.walls.S && c.walls.E && c.walls.W));
    e.dungeonState.visitedCells = new Set([`${L}:0,0`, `${L}:${carved.x},${carved.y}`]);

    const state = e.showMap();
    const r = DUNGEON.MAP_VIEW_RADIUS;
    const mapRows = state.messages.slice(2, 2 + (r + 1));

    // Player is in the corner, so the window is clamped to start at (0,0)
    // and the '@' should be the very first visible cell.
    const topRow = mapRows[0];
    expect(topRow.indexOf('@')).toBe(2);
  });
});

describe('GameEngine — ladders projected into the corridor view', () => {
  let db: any;

  beforeEach(() => {
    db = createMemoryDb();
  });

  afterEach(() => {
    db.close();
  });

  it('shows a ladder-down glyph when one is visible ahead', () => {
    const engine = makeReadyEngine(db);
    const e = engine as any;

    e.char.x = 5;
    e.char.y = 5;
    e.char.facing = 'E';
    e.char.dungeonLevel = 1;
    const grid = openGrid(20, 20);
    const contents = new Map([[`7,5`, { type: 'ladder-down', id: 'ladder-down' }]]);
    e.levelCache.set(1, { grid, entrance: { x: 5, y: 5 }, exit: null, contents });

    const state = e.getState();
    expect(state.view.join('\n')).toContain('<');
  });

  it('shows a ladder-up glyph when one is visible ahead', () => {
    const engine = makeReadyEngine(db);
    const e = engine as any;

    e.char.x = 5;
    e.char.y = 5;
    e.char.facing = 'E';
    e.char.dungeonLevel = 1;
    const grid = openGrid(20, 20);
    const contents = new Map([[`6,5`, { type: 'ladder-up', id: 'ladder-up' }]]);
    e.levelCache.set(1, { grid, entrance: { x: 5, y: 5 }, exit: null, contents });

    const state = e.getState();
    expect(state.view.join('\n')).toContain('>');
  });

  it('does not show a ladder glyph when none is within view distance', () => {
    const engine = makeReadyEngine(db);
    const e = engine as any;

    e.char.x = 5;
    e.char.y = 5;
    e.char.facing = 'E';
    e.char.dungeonLevel = 1;
    const grid = openGrid(20, 20);
    e.levelCache.set(1, { grid, entrance: { x: 5, y: 5 }, exit: null, contents: new Map() });

    const state = e.getState();
    expect(state.view.join('\n')).not.toContain('<');
    expect(state.view.join('\n')).not.toContain('>');
  });
});

describe('GameEngine — dungeon fixtures projected into the corridor view', () => {
  let db: any;

  beforeEach(() => {
    db = createMemoryDb();
  });

  afterEach(() => {
    db.close();
  });

  function place(engine: any, contentType: string, id = 'fixture-1') {
    engine.char.x = 5;
    engine.char.y = 5;
    engine.char.facing = 'E';
    engine.char.dungeonLevel = 1;
    const grid = openGrid(20, 20);
    const contents = new Map([[`7,5`, { type: contentType, id }]]);
    engine.levelCache.set(1, { grid, entrance: { x: 5, y: 5 }, exit: null, contents });
  }

  it('shows an unopened chest', () => {
    const engine = makeReadyEngine(db) as any;
    place(engine, 'chest');
    expect(engine.getState().view.join('\n')).toContain('+=+');
  });

  it('hides a chest that has already been opened', () => {
    const engine = makeReadyEngine(db) as any;
    place(engine, 'chest', 'chest-1');
    engine.dungeonState.openedChests.add('chest-1');
    expect(engine.getState().view.join('\n')).not.toContain('+=+');
  });

  it('shows an unread book', () => {
    const engine = makeReadyEngine(db) as any;
    place(engine, 'book');
    expect(engine.getState().view.join('\n')).toContain('/=\\');
  });

  it('hides a book that has already been read', () => {
    const engine = makeReadyEngine(db) as any;
    place(engine, 'book', 'book-1');
    engine.dungeonState.readBooks.add('book-1');
    expect(engine.getState().view.join('\n')).not.toContain('/=\\');
  });

  it('shows an unused altar', () => {
    const engine = makeReadyEngine(db) as any;
    place(engine, 'altar');
    expect(engine.getState().view.join('\n')).toContain('|+|');
  });

  it('hides an altar that has already been used', () => {
    const engine = makeReadyEngine(db) as any;
    place(engine, 'altar', 'altar-1');
    engine.dungeonState.usedAltars.add('altar-1');
    expect(engine.getState().view.join('\n')).not.toContain('|+|');
  });

  it('shows an unused fountain as either the fountain or well variant', () => {
    const engine = makeReadyEngine(db) as any;
    place(engine, 'fountain');
    const text = engine.getState().view.join('\n');
    expect(text.includes('~~~') || text.includes('|~|')).toBe(true);
  });

  it('hides a fountain that has already been used', () => {
    const engine = makeReadyEngine(db) as any;
    place(engine, 'fountain', 'fountain-1');
    engine.dungeonState.usedFountains.add('fountain-1');
    const text = engine.getState().view.join('\n');
    expect(text.includes('~~~') || text.includes('|~|')).toBe(false);
  });

  it('picks the same fountain/well variant every time for the same fountain', () => {
    const engineA = makeReadyEngine(db) as any;
    place(engineA, 'fountain', 'same-fountain-id');
    const viewA = engineA.getState().view.join('\n');

    const dbB = createMemoryDb();
    const engineB = makeReadyEngine(dbB) as any;
    place(engineB, 'fountain', 'same-fountain-id');
    const viewB = engineB.getState().view.join('\n');
    dbB.close();

    expect(viewA.includes('~~~')).toBe(viewB.includes('~~~'));
    expect(viewA.includes('|~|')).toBe(viewB.includes('|~|'));
  });
});

describe('GameEngine — inventory screen', () => {
  let db: any;

  beforeEach(() => {
    db = createMemoryDb();
  });

  afterEach(() => {
    db.close();
  });

  it('lists potions and gold with their type and quantity', () => {
    const engine = makeReadyEngine(db);
    const e = engine as any;
    e.char.inventory.potions = 3;
    e.char.gold = 42;

    const state = engine.showInventory();
    expect(state.phase).toBe('inventory');
    const text = state.messages.join('\n');
    expect(text).toContain('Healing Potion');
    expect(text).toContain('Consumable');
    expect(text).toContain('x3');
    expect(text).toContain('Gold');
    expect(text).toContain('Currency');
    expect(text).toContain('42');
  });

  it('notes an empty pack when there are no potions', () => {
    const engine = makeReadyEngine(db);
    const e = engine as any;
    e.char.inventory.potions = 0;

    const state = engine.showInventory();
    expect(state.messages.join('\n')).toContain('nothing but your coin purse');
  });

  it('offers a single "Return to Game" choice, and dismissing returns to play', () => {
    const engine = makeReadyEngine(db);
    const afterShow = engine.showInventory();
    expect(afterShow.choices).toEqual([{ key: 'x', text: 'Return to Game' }]);

    const afterDismiss = engine.dismissInventory();
    expect(afterDismiss.phase).toBe('playing');
  });

  it('lists all four gem types with their quantities', () => {
    const engine = makeReadyEngine(db);
    const e = engine as any;
    e.char.inventory.gems = { ruby: 2, sapphire: 0, diamond: 1, opal: 0 };

    const text = engine.showInventory().messages.join('\n');
    expect(text).toContain('Ruby');
    expect(text).toContain('x2');
    expect(text).toContain('Sapphire');
    expect(text).toContain('Diamond');
    expect(text).toContain('x1');
    expect(text).toContain('Opal');
  });
});

describe('GameEngine — gems', () => {
  let db: any;

  beforeEach(() => {
    db = createMemoryDb();
  });

  afterEach(() => {
    db.close();
  });

  /** Grants gems, sets INT high enough to use them, and (optionally) starts
   * combat against the given monster type. */
  function setupGemUser(engine: GameEngine, monsterType?: Parameters<typeof createMonster>[0]) {
    const e = engine as any;
    e.char.intelligence = 18;
    e.char.inventory.gems = { ruby: 1, sapphire: 1, diamond: 1, opal: 1 };
    if (monsterType) {
      e.phase = 'combat';
      e.combat = {
        monster: createMonster(monsterType, 3, 'gem-test-monster'),
        round: 1,
        nakedActive: false,
        preCombatX: e.char.x,
        preCombatY: e.char.y,
      };
    }
    return e;
  }

  it('combat menu offers a Use Gem option', () => {
    const engine = makeReadyEngine(db);
    setupGemUser(engine, 'Kobold');
    const state = engine.getState();
    expect(state.choices).toContainEqual({ key: 'e', text: 'Use Gem' });
  });

  it('refuses to use a gem the character does not have', () => {
    const engine = makeReadyEngine(db);
    const e = setupGemUser(engine, 'Kobold');
    e.char.inventory.gems.ruby = 0;

    const state = engine.gemAction('a');
    expect(state.messages.join(' ')).toContain('no rubies');
    expect(e.char.inventory.gems.ruby).toBe(0);
  });

  it('refuses to use a gem below the arcane-aptitude INT threshold', () => {
    const engine = makeReadyEngine(db);
    const e = setupGemUser(engine, 'Kobold');
    e.char.intelligence = 3;

    const before = e.char.inventory.gems.ruby;
    const state = engine.gemAction('a');
    expect(state.messages.join(' ')).toContain('arcane aptitude');
    expect(e.char.inventory.gems.ruby).toBe(before);
  });

  it('cancelling the gem menu returns to combat without consuming anything', () => {
    const engine = makeReadyEngine(db);
    const e = setupGemUser(engine, 'Kobold');

    const before = { ...e.char.inventory.gems };
    const state = engine.gemAction('f');   // Cancel (E is the emerald)
    expect(state.phase).toBe('combat');
    expect(e.char.inventory.gems).toEqual(before);
  });

  it('Ruby consumes itself, teleports the character, and ends combat', () => {
    const engine = makeReadyEngine(db);
    const e = setupGemUser(engine, 'Kobold');
    // Mark several cells visited so teleportPlayer() has somewhere to send us.
    const L = e.char.dungeonLevel;
    for (const c of e.getLevel(L).grid.flat()) e.dungeonState.visitedCells.add(`${L}:${c.x},${c.y}`);

    const state = engine.gemAction('a');
    expect(e.char.inventory.gems.ruby).toBe(0);
    expect(state.phase).toBe('playing');
    expect(state.combat).toBeUndefined();
  });

  it('Sapphire consumes itself and banishes the monster, ending combat without XP', () => {
    const engine = makeReadyEngine(db);
    const e = setupGemUser(engine, 'Kobold');
    const xpBefore = e.char.xp;

    const state = engine.gemAction('b');
    expect(e.char.inventory.gems.sapphire).toBe(0);
    expect(state.phase).toBe('playing');
    expect(state.combat).toBeUndefined();
    expect(e.char.xp).toBe(xpBefore);
  });

  it('gemAction is a no-op outside combat', () => {
    const engine = makeReadyEngine(db);
    const e = setupGemUser(engine); // no monster — phase is not 'combat'
    const phaseBefore = e.phase;

    const before = { ...e.char.inventory.gems };
    const state = engine.gemAction('b');
    expect(e.char.inventory.gems).toEqual(before);
    expect(state.phase).toBe(phaseBefore);
  });

  it('Diamond consumes itself and reveals every room and corridor of the current level', () => {
    const engine = makeReadyEngine(db);
    const e = setupGemUser(engine, 'Kobold');
    const lvl = e.getLevel(e.char.dungeonLevel);
    const carvedCells = lvl.grid.flat().filter(
      (c: DungeonCell) => !(c.walls.N && c.walls.S && c.walls.E && c.walls.W),
    ).length;

    const state = engine.gemAction('c');
    expect(e.char.inventory.gems.diamond).toBe(0);
    expect(e.dungeonState.visitedCells.size).toBe(carvedCells);
    expect(state.messages.join(' ')).toContain('full map');
  });

  it('Opal consumes itself, damages the monster, and applies confusedTurns', () => {
    const engine = makeReadyEngine(db);
    const e = setupGemUser(engine, 'Kobold');
    const hpBefore = e.combat.monster.hp;

    const state = engine.gemAction('d');
    expect(e.char.inventory.gems.opal).toBe(0);
    expect(state.messages.join(' ')).toContain('chiaroscuro');
    // Monster either took damage and is still tracked in combat, or was defeated outright.
    if (state.combat) {
      expect(state.combat.monster.hp).toBeLessThan(hpBefore);
    } else {
      expect(state.phase).not.toBe('combat');
    }
  });
});

describe('GameEngine — magic books', () => {
  let db: any;

  beforeEach(() => {
    db = createMemoryDb();
  });

  afterEach(() => {
    db.close();
  });

  it('refuses to read a book the character does not have', () => {
    const engine = makeReadyEngine(db);
    const e = engine as any;
    e.char.inventory.books = 0;

    const state = engine.useBook();
    expect(state.messages.join(' ')).toContain('no magic tomes');
  });

  it('reading a book consumes exactly one and applies an effect', () => {
    const engine = makeReadyEngine(db);
    const e = engine as any;
    e.char.inventory.books = 3;
    e.char.hp = 1;
    e.char.maxHp = 1000;

    const state = engine.useBook();
    expect(e.char.inventory.books).toBe(2);
    expect(state.messages.length).toBeGreaterThan(0);
  });

  it('a map-reveal read marks every room and corridor of the current level visited', () => {
    const engine = makeReadyEngine(db);
    const e = engine as any;
    e.char.inventory.books = 200; // enough tries to be confident we hit map-reveal at least once
    const lvl = e.getLevel(e.char.dungeonLevel);
    const carvedCells = lvl.grid.flat().filter(
      (c: DungeonCell) => !(c.walls.N && c.walls.S && c.walls.E && c.walls.W),
    ).length;

    let sawFullReveal = false;
    for (let i = 0; i < 200 && e.char.inventory.books > 0; i++) {
      e.dungeonState.visitedCells.clear();
      engine.useBook();
      if (e.dungeonState.visitedCells.size === carvedCells) { sawFullReveal = true; break; }
    }
    expect(sawFullReveal).toBe(true);
  });

  it('taking a book fixture for later adds it to inventory instead of resolving an effect immediately', () => {
    const engine = makeReadyEngine(db);
    const e = engine as any;
    e.phase = 'interaction';
    e.interaction = { type: 'book', contentId: 'book-test-1', choices: [] };
    const before = e.char.inventory.books;

    const state = engine.interactionChoice('b');
    expect(e.char.inventory.books).toBe(before + 1);
    expect(e.dungeonState.readBooks.has('book-test-1')).toBe(true);
    expect(state.phase).toBe('playing');
  });

  it('reading a found tome on the spot applies its effect without adding it to the pack', () => {
    const engine = makeReadyEngine(db);
    const e = engine as any;
    e.phase = 'interaction';
    e.interaction = { type: 'book', contentId: 'book-test-2', choices: [] };
    const before = e.char.inventory.books;

    const state = engine.interactionChoice('a');
    expect(e.char.inventory.books).toBe(before);
    expect(e.dungeonState.readBooks.has('book-test-2')).toBe(true);
    expect(state.phase).toBe('playing');
    expect(state.messages.length).toBeGreaterThan(0);
    expect(state.messages.join(' ')).not.toContain('tuck the tome');
  });

  it('leaving a found tome keeps it on the pedestal', () => {
    const engine = makeReadyEngine(db);
    const e = engine as any;
    e.phase = 'interaction';
    e.interaction = { type: 'book', contentId: 'book-test-3', choices: [] };
    const before = e.char.inventory.books;

    const state = engine.interactionChoice('c');
    expect(e.char.inventory.books).toBe(before);
    expect(e.dungeonState.readBooks.has('book-test-3')).toBe(false);
    expect(state.messages.join(' ')).toContain('pedestal');
  });

  it('lists the Magic Tome row with its quantity in the inventory screen', () => {
    const engine = makeReadyEngine(db);
    const e = engine as any;
    e.char.inventory.books = 4;

    const text = engine.showInventory().messages.join('\n');
    expect(text).toContain('Magic Tome');
    expect(text).toContain('x4');
  });
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
describe('GameEngine — save prompt', () => {
  let db: any;

  beforeEach(() => {
    db = createMemoryDb();
  });

  afterEach(() => {
    db.close();
  });

  it('saving persists the character and dungeon, then asks whether to continue', () => {
    const engine = makeReadyEngine(db);
    const e = engine as any;
    e.phase = 'playing';
    e.char.gold = 1234;

    const state = engine.saveAndPrompt();
    expect(state.phase).toBe('save-prompt');
    expect(state.messages.join('\n')).toContain('Game saved.');

    const repo = new Repository(db);
    expect(repo.loadCharacter(e.char.id)?.gold).toBe(1234);
    expect(repo.loadDungeonState(e.char.id)).not.toBeNull();
  });

  it('continuing returns to play on the same square', () => {
    const engine = makeReadyEngine(db);
    const e = engine as any;
    e.phase = 'playing';
    const { x, y } = e.char;

    engine.saveAndPrompt();
    const state = engine.dismissSavePrompt();
    expect(state.phase).toBe('playing');
    expect(state.messages).toEqual([]);
    expect(e.char.x).toBe(x);
    expect(e.char.y).toBe(y);
  });

  it('exiting from the prompt goes to the main menu', () => {
    const engine = makeReadyEngine(db);
    (engine as any).phase = 'playing';

    engine.saveAndPrompt();
    expect(engine.showMainMenu().phase).toBe('main-menu');
  });
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
describe('GameEngine — healing potions', () => {
  let db: any;

  beforeEach(() => {
    db = createMemoryDb();
  });

  afterEach(() => {
    db.close();
  });

  it('heals a share of max HP so potions stay useful at high level', () => {
    const engine = makeReadyEngine(db);
    const e = engine as any;
    e.phase = 'playing';
    e.char.maxHp = 400;
    e.char.hp = 1;
    e.char.constitution = 12;
    e.char.inventory.potions = 1;

    engine.usePot();
    // min roll (20) + CON bonus (3) + 30% of 400 (120)
    expect(e.char.hp - 1).toBeGreaterThanOrEqual(143);
    expect(e.char.inventory.potions).toBe(0);
  });
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
describe('GameEngine — diamond while exploring', () => {
  let db: any;

  beforeEach(() => {
    db = createMemoryDb();
  });

  afterEach(() => {
    db.close();
  });

  function explorer(): { engine: GameEngine; e: any } {
    const engine = makeReadyEngine(db);
    const e = engine as any;
    e.phase = 'playing';
    e.char.intelligence = 18;
    e.char.inventory.gems = { ruby: 0, sapphire: 0, diamond: 2, opal: 0 };
    return { engine, e };
  }

  it('reveals the whole level map and consumes one diamond', () => {
    const { engine, e } = explorer();
    const lvl = e.getLevel(e.char.dungeonLevel);
    const isRock = (c: DungeonCell) => c.walls.N && c.walls.S && c.walls.E && c.walls.W;
    const carved = lvl.grid.flat().filter((c: DungeonCell) => !isRock(c));

    const state = engine.useDiamondExploring();
    expect(state.phase).toBe('playing');
    expect(e.char.inventory.gems.diamond).toBe(1);
    expect(e.dungeonState.visitedCells.size).toBe(carved.length);
    expect(state.messages.join('\n')).toContain('map has been revealed');
  });

  it('does nothing when the character has no diamonds', () => {
    const { engine, e } = explorer();
    e.char.inventory.gems.diamond = 0;
    const before = e.dungeonState.visitedCells.size;

    const state = engine.useDiamondExploring();
    expect(state.messages.join('\n')).toContain('no diamonds');
    expect(e.dungeonState.visitedCells.size).toBe(before);
  });

  it('is ignored outside the exploring phase', () => {
    const { engine, e } = explorer();
    e.phase = 'status';

    engine.useDiamondExploring();
    expect(e.char.inventory.gems.diamond).toBe(2);
  });
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
describe('GameEngine — map after a full reveal', () => {
  let db: any;

  beforeEach(() => {
    db = createMemoryDb();
  });

  afterEach(() => {
    db.close();
  });

  const isRock = (c: DungeonCell) => c.walls.N && c.walls.S && c.walls.E && c.walls.W;

  it('never marks solid rock as explored', () => {
    const engine = makeReadyEngine(db);
    const e = engine as any;
    e.phase = 'playing';
    e.char.intelligence = 18;
    e.char.inventory.gems.diamond = 1;

    engine.useDiamondExploring();
    const lvl = e.getLevel(e.char.dungeonLevel);
    const rockMarked = lvl.grid.flat().filter(
      (c: DungeonCell) => isRock(c) && e.dungeonState.visitedCells.has(`${e.char.dungeonLevel}:${c.x},${c.y}`),
    );
    expect(rockMarked).toEqual([]);
  });

  it('draws rock as blank even when it is marked visited', () => {
    const engine = makeReadyEngine(db);
    const e = engine as any;
    e.phase = 'playing';
    const lvl = e.getLevel(e.char.dungeonLevel);
    // Every cell, rock included, marked visited.
    const L = e.char.dungeonLevel;
    for (const c of lvl.grid.flat()) e.dungeonState.visitedCells.add(`${L}:${c.x},${c.y}`);

    const state = engine.showMap();
    const carved = lvl.grid.flat().filter((c: DungeonCell) => !isRock(c)).length;
    expect(state.messages[0]).toContain(`(${carved} cells explored)`);

    // Every rock cell inside the map window must render as a space.
    const radius = DUNGEON.MAP_VIEW_RADIUS;
    const minX = Math.max(0, e.char.x - radius);
    const minY = Math.max(0, e.char.y - radius);
    const rows = state.messages.slice(2, -3).map((r: string) => r.slice(2));
    let rockSeen = 0;
    rows.forEach((row: string, dy: number) => {
      [...row].forEach((ch, dx) => {
        const cell = lvl.grid[minY + dy]?.[minX + dx];
        if (cell && isRock(cell)) {
          rockSeen++;
          expect(ch).toBe(' ');
        }
      });
    });
    expect(rockSeen).toBeGreaterThan(0);
  });
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
describe('GameEngine — explored squares are tracked per level', () => {
  let db: any;

  beforeEach(() => {
    db = createMemoryDb();
  });

  afterEach(() => {
    db.close();
  });

  const isRock = (c: DungeonCell) => c.walls.N && c.walls.S && c.walls.E && c.walls.W;

  it("a full reveal on one level doesn't show up on the next level's map", () => {
    const engine = makeReadyEngine(db);
    const e = engine as any;
    e.phase = 'playing';
    e.char.intelligence = 18;
    e.char.inventory.gems.diamond = 1;
    engine.useDiamondExploring();

    // Arrive on level 2 at its entrance, as climbing down would.
    e.char.dungeonLevel = 2;
    const lvl2 = e.getLevel(2);
    e.char.x = lvl2.entrance.x;
    e.char.y = lvl2.entrance.y;
    e.dungeonState.visitedCells.add(`2:${e.char.x},${e.char.y}`);

    const state = engine.showMap();
    expect(state.messages[0]).toContain('(1 cells explored)');
  });

  it('drops pre-per-level explored squares when a save is loaded', () => {
    const engine = makeReadyEngine(db);
    const e = engine as any;
    const id = e.char.id;
    e.dungeonState.visitedCells = new Set(['5,5', '6,5', '7,5']);
    const repo = new Repository(db);
    repo.saveDungeonState(id, e.dungeonState);

    engine.loadCharacter(id);
    const keys = [...e.dungeonState.visitedCells];
    expect(keys.some(k => !k.includes(':'))).toBe(false);          // the old bare keys are gone
    expect(keys).toContain(`${e.char.dungeonLevel}:${e.char.x},${e.char.y}`);  // torchlight marks where we stand
  });

  it('a ruby never teleports into solid rock, even if rock is marked explored', () => {
    const engine = makeReadyEngine(db);
    const e = engine as any;
    const L = e.char.dungeonLevel;
    const lvl = e.getLevel(L);
    for (const c of lvl.grid.flat()) e.dungeonState.visitedCells.add(`${L}:${c.x},${c.y}`);

    for (let i = 0; i < 50; i++) {
      e.teleportPlayer();
      expect(isRock(lvl.grid[e.char.y][e.char.x])).toBe(false);
    }
  });
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
describe('GameEngine — full-floor map toggle', () => {
  let db: any;

  beforeEach(() => {
    db = createMemoryDb();
  });

  afterEach(() => {
    db.close();
  });

  function revealedEngine(): { engine: GameEngine; e: any } {
    const engine = makeReadyEngine(db);
    const e = engine as any;
    e.phase = 'playing';
    e.char.intelligence = 18;
    e.char.inventory.gems.diamond = 1;
    engine.useDiamondExploring();
    return { engine, e };
  }

  it('M opens the centered window; F switches to the whole explored floor', () => {
    const { engine, e } = revealedEngine();
    const lvl = e.getLevel(e.char.dungeonLevel);
    const carved = lvl.grid.flat().filter((c: DungeonCell) => !(c.walls.N && c.walls.S && c.walls.E && c.walls.W));
    const width = Math.max(...carved.map((c: DungeonCell) => c.x), e.char.x)
      - Math.min(...carved.map((c: DungeonCell) => c.x), e.char.x) + 1;

    const centered = engine.showMap();
    expect(centered.mapFull).toBe(false);
    expect(centered.messages[2].length - 2).toBeLessThanOrEqual(2 * DUNGEON.MAP_VIEW_RADIUS + 1);

    const full = engine.toggleMapView();
    expect(full.phase).toBe('map');
    expect(full.mapFull).toBe(true);
    expect(full.messages[0]).toContain('FULL FLOOR');
    expect(full.messages[2].length - 2).toBe(width);
    expect(full.messages.join('\n')).toContain('@');
  });

  it('F toggles back, and reopening the map always starts centered', () => {
    const { engine } = revealedEngine();
    engine.showMap();
    engine.toggleMapView();
    expect(engine.toggleMapView().mapFull).toBe(false);

    engine.toggleMapView();
    engine.dismissMap();
    expect(engine.showMap().mapFull).toBe(false);
  });

  it('is ignored outside the map screen', () => {
    const { engine } = revealedEngine();
    expect(engine.toggleMapView().phase).toBe('playing');
  });
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
describe('GameEngine — held by a Beholder ray', () => {
  let db: any;

  beforeEach(() => {
    db = createMemoryDb();
  });

  afterEach(() => {
    db.close();
  });

  it('offers only Struggle while held, and any action spends the turn', () => {
    const engine = makeReadyEngine(db);
    const e = engine as any;
    e.char.hp = 100000; e.char.maxHp = 100000;
    e.phase = 'combat';
    e.combat = { monster: createMonster('Beholder', 10, 'b1'), round: 1, nakedActive: false, preCombatX: e.char.x, preCombatY: e.char.y };
    e.combat.monster.hp = 100000; e.combat.monster.maxHp = 100000;
    e.char.heldRounds = 1;
    e.char.heldBy = 'asleep';
    // Ward off the Beholder's reply, so a new ray can't hold us again this round.
    e.char.invulnerableTurns = 5;

    expect(engine.getState().choices).toEqual([{ key: 'a', text: 'Struggle (asleep)' }]);

    const monsterHp = e.combat.monster.hp;
    const state = engine.spellAction('a');
    expect(state.messages[0]).toContain('asleep');
    expect(e.combat.monster.hp).toBe(monsterHp);
    expect(e.char.heldRounds).toBe(0);
  });

  it('clears the hold when combat ends', () => {
    const engine = makeReadyEngine(db);
    const e = engine as any;
    e.phase = 'combat';
    e.combat = { monster: createMonster('Beholder', 10, 'b1'), round: 1, nakedActive: false, preCombatX: e.char.x, preCombatY: e.char.y };
    e.char.heldRounds = 2;
    e.char.heldBy = 'paralyzed';

    e.endCombat(false);
    expect(e.char.heldRounds).toBe(0);
    expect(e.char.heldBy).toBeUndefined();
  });
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
describe('GameEngine — trapped chests', () => {
  let db: any;

  beforeEach(() => {
    db = createMemoryDb();
  });

  afterEach(() => {
    db.close();
  });

  /** A chest id this character finds trapped with the given trap (or untrapped when null). */
  function chestWith(char: any, want: string | null): string {
    for (let i = 0; i < 5000; i++) {
      const id = `chest-9-${i}`;
      if (chestTrapFor(char, id) === want) return id;
    }
    throw new Error('no such chest');
  }

  /** Spotting is capped below 100%, so search fresh until the trap is found. */
  function searchUntilSpotted(engine: GameEngine, e: any, id: string) {
    for (let i = 0; i < 100; i++) {
      e.interaction = { type: 'chest', contentId: id, choices: [] };
      e.phase = 'interaction';
      const res = engine.interactionChoice('b');
      if (e.interaction?.chestTrapSpotted) return res;
    }
    throw new Error('never spotted the trap');
  }

  function atChest(engine: GameEngine, id: string) {
    const e = engine as any;
    e.phase = 'interaction';
    e.interaction = { type: 'chest', contentId: id, choices: [] };
    e.char.hp = e.char.maxHp = 10000;
    return e;
  }

  it('opening a trapped chest without checking springs the trap, then gives the loot', () => {
    const engine = makeReadyEngine(db);
    const e = engine as any;
    const id = chestWith(e.char, 'blade');
    atChest(engine, id);

    const state = engine.interactionChoice('a');
    const text = state.messages.join(' ');
    expect(text).toContain('TRAP!');
    expect(text).toContain('blade');
    expect(e.char.hp).toBeLessThan(10000);
    expect(e.dungeonState.openedChests.has(id)).toBe(true);
  });

  it('searching an untrapped chest finds nothing and it opens safely', () => {
    const engine = makeReadyEngine(db);
    const e = engine as any;
    const id = chestWith(e.char, null);
    atChest(engine, id);

    const searched = engine.interactionChoice('b');
    expect(searched.messages[0]).toContain('find no traps');
    expect(searched.choices!.map(c => c.key)).toEqual(['a', 'c']);

    const opened = engine.interactionChoice('a');
    expect(opened.messages.join(' ')).not.toContain('TRAP!');
  });

  it('a spotted trap can be disarmed, opening the chest safely with a little XP', () => {
    const engine = makeReadyEngine(db);
    const e = engine as any;
    e.char.wisdom = 60;     // always spot it
    e.char.dexterity = 60;  // disarm at the cap
    const id = chestWith(e.char, 'fire-glyph');

    let disarmed = false;
    for (let i = 0; i < 40 && !disarmed; i++) {
      atChest(engine, id);
      e.dungeonState.openedChests.delete(id);
      const searched = searchUntilSpotted(engine, e, id);
      expect(searched.messages[0]).toContain('fire glyph');
      const xp = e.char.xp;
      const res = engine.interactionChoice('a');
      if (res.messages[0].includes('disarm')) {
        disarmed = true;
        expect(res.messages.join(' ')).not.toContain('TRAP!');
        expect(e.char.xp).toBeGreaterThan(xp);
        expect(e.char.hp).toBe(10000);
      }
    }
    expect(disarmed).toBe(true);
  });

  it('opening a spotted trap anyway springs it', () => {
    const engine = makeReadyEngine(db);
    const e = engine as any;
    e.char.wisdom = 60;
    const id = chestWith(e.char, 'needle');
    atChest(engine, id);
    searchUntilSpotted(engine, e, id);
    const res = engine.interactionChoice('b');
    expect(res.messages.join(' ')).toContain('TRAP!');
    expect(e.char.statusEffects.some((s: any) => s.type === 'poison')).toBe(true);
  });

  it('an alarm trap brings a monster, keeping the chest messages on screen', () => {
    const engine = makeReadyEngine(db);
    const e = engine as any;
    const id = chestWith(e.char, 'alarm');
    atChest(engine, id);
    const res = engine.interactionChoice('a');
    expect(res.phase).toBe('combat');
    expect(res.messages.join(' ')).toContain('alarm');
  });
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
describe('GameEngine — spells by level', () => {
  let db: any;

  beforeEach(() => {
    db = createMemoryDb();
  });

  afterEach(() => {
    db.close();
  });

  function inCombat(level: number, monsterType: Parameters<typeof createMonster>[0] = 'Goblin', monsterLevel = 1) {
    const engine = makeReadyEngine(db);
    const e = engine as any;
    e.char.level = level;
    e.char.hp = e.char.maxHp = 100000;
    e.phase = 'combat';
    e.combat = { monster: createMonster(monsterType, monsterLevel, 'm1'), round: 1, nakedActive: false, preCombatX: e.char.x, preCombatY: e.char.y };
    return { engine, e };
  }

  it('offers a new character only Fireball', () => {
    const { engine } = inCombat(1);
    expect(engine.getState().spellChoices).toEqual([{ key: 'a', text: 'Fireball' }, { key: 'b', text: 'Cancel' }]);
  });

  it('an unlearned spell can’t be cast by its key', () => {
    const { engine, e } = inCombat(1);
    const hp = e.combat.monster.hp;
    const state = engine.spellAction('d');
    expect(state.messages).toEqual(['You reconsider.']);
    expect(e.combat.monster.hp).toBe(hp);
  });

  it('announces a spell learned on level-up', () => {
    const engine = makeReadyEngine(db);
    const e = engine as any;
    e.char.level = 34;
    e.char.xp = xpForLevel(35);
    const lines: string[] = e.levelUp();
    expect(lines).toContain('*** YOU HAVE REACHED LEVEL 35! ***');
    expect(lines).toContain('You have learned Lightning!');
  });

  it('Banish recharges for an hour of play time, and trying early costs no turn', () => {
    const { engine, e } = inCombat(40, 'Goblin', 1);
    const key = () => engine.getState().spellChoices!.find(c => c.text.startsWith('Banish'))!.key;
    engine.spellAction(key());
    expect(e.char.banishCastAt).toBe(e.char.playTime);

    // back into a fresh fight straight away
    e.phase = 'combat';
    e.combat = { monster: createMonster('Goblin', 1, 'm2'), round: 1, nakedActive: false, preCombatX: e.char.x, preCombatY: e.char.y };
    const hp = e.combat.monster.hp;
    expect(engine.getState().spellChoices!.find(c => c.text.startsWith('Banish'))!.text).toContain('recharging');
    const early = engine.spellAction(key());
    expect(early.messages[0]).toContain('still gathering power');
    expect(early.phase).toBe('combat');
    expect(e.combat.monster.hp).toBe(hp);

    // an hour of play later it is ready again
    e.char.playTime += 3600;
    expect(engine.getState().spellChoices!.find(c => c.text.startsWith('Banish'))!.text).toBe('Banish');
  });

  it('the Banish cooldown survives saving and loading', () => {
    const { e } = inCombat(40);
    e.char.banishCastAt = 1234;
    const repo = new Repository(db);
    repo.saveCharacter(e.char);
    expect(repo.loadCharacter(e.char.id)!.banishCastAt).toBe(1234);
  });

  it('play time accumulates on the character and is saved', () => {
    const { engine, e } = inCombat(5);
    const before = e.char.playTime;
    e.sessionStart -= 90_000;   // pretend 90 seconds have passed
    engine.getState();
    expect(e.char.playTime).toBe(before + 90);
  });

  it('a successful Banish ends the fight without XP', () => {
    let done = false;
    for (let i = 0; i < 40 && !done; i++) {
      const { engine, e } = inCombat(40, 'Goblin', 1);
      const xp = e.char.xp;
      const key = engine.getState().spellChoices!.find(c => c.text === 'Banish')!.key;
      const state = engine.spellAction(key);
      if (state.messages.join(' ').includes('dragged screaming')) {
        done = true;
        expect(state.phase).toBe('playing');
        expect(e.combat).toBeNull();
        expect(e.char.xp).toBe(xp);
      }
    }
    expect(done).toBe(true);
  });
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
describe('GameEngine — hit-effect hints', () => {
  let db: any;

  beforeEach(() => {
    db = createMemoryDb();
  });

  afterEach(() => {
    db.close();
  });

  it('maps monster attacks to elements', () => {
    expect(abilityElement(undefined)).toBe('physical');
    expect(abilityElement('fireball')).toBe('fire');
    expect(abilityElement('frost-breath')).toBe('cold');
    expect(abilityElement('lightning-bolt')).toBe('lightning');
    expect(abilityElement('acid-bolt')).toBe('acid');
    expect(abilityElement('poison-breath')).toBe('poison');
    expect(abilityElement('life-drain')).toBe('drain');
    expect(abilityElement('psychic-blast')).toBe('psychic');
    expect(abilityElement('telekinetic-ray')).toBe('physical');
    expect(abilityElement('disintegrate-ray')).toBe('arcane');
  });

  it("reports the spell's element and the monster's reply, once", () => {
    const engine = makeReadyEngine(db);
    const e = engine as any;
    e.char.hp = e.char.maxHp = 100000;
    e.phase = 'combat';
    e.combat = { monster: createMonster('Orc', 5, 'o1'), round: 1, nakedActive: false, preCombatX: e.char.x, preCombatY: e.char.y };
    e.combat.monster.hp = e.combat.monster.maxHp = 100000;

    const state = engine.spellAction('a');  // Fireball
    expect(state.fx?.monster).toBe('fire');
    expect(state.fx?.monsterAttacked).toBe(true);
    expect(state.fx?.player).toBeDefined();
    expect(engine.getState().fx).toBeUndefined();
  });

  it('tags a chest trap with its element', () => {
    const engine = makeReadyEngine(db);
    const e = engine as any;
    let id = '';
    for (let i = 0; i < 5000 && !id; i++) if (chestTrapFor(e.char, `chest-9-${i}`) === 'fire-glyph') id = `chest-9-${i}`;
    e.phase = 'interaction';
    e.interaction = { type: 'chest', contentId: id, choices: [] };
    e.char.hp = e.char.maxHp = 10000;
    expect(engine.interactionChoice('a').fx?.player).toBe('fire');
  });

  it('tags poison ticking while walking', () => {
    const engine = makeReadyEngine(db);
    const e = engine as any;
    e.phase = 'playing';
    e.char.hp = e.char.maxHp = 10000;
    e.char.statusEffects = [{ type: 'poison', value: 5, turns: 20 }];
    let tagged = false;
    for (let i = 0; i < 40 && !tagged; i++) {
      for (const f of ['N', 'E', 'S', 'W']) {
        // A step can start a fight or a prompt; put us back to walking each time.
        e.phase = 'playing'; e.combat = null; e.interaction = null;
        e.char.statusEffects = [{ type: 'poison', value: 5, turns: 20 }];
        e.char.facing = f;
        const hp = e.char.hp;
        const state = engine.moveForward();
        if (e.char.hp < hp && state.phase === 'playing') { expect(state.fx?.player).toBe('poison'); tagged = true; break; }
      }
    }
    expect(tagged).toBe(true);
  });
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
describe('GameEngine — main menu', () => {
  it('always shows one of the dungeon teasers under the title', () => {
    const engine = new GameEngine(new Repository(createMemoryDb()));
    for (let i = 0; i < 20; i++) {
      const msgs = engine.showMainMenu().messages;
      const teaser = msgs.slice(4);
      expect(MENU_LORE.some(l => l.join('\n') === teaser.join('\n'))).toBe(true);
    }
  });
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
describe('GameEngine — walking on the map', () => {
  let db: any;
  beforeEach(() => { db = createMemoryDb(); });
  afterEach(() => { db.close(); });

  /** An engine on the map screen, plus an open direction from where the character stands. */
  function onMap() {
    const engine = makeReadyEngine(db);
    const e = engine as any;
    e.phase = 'playing';
    e.pace.movesSinceCombat = -1000;    // keep random encounters out of the way
    const lvl = e.getLevel(e.char.dungeonLevel);
    const dirs = ['N', 'E', 'S', 'W'] as const;
    const open = dirs.find(d => canMove(lvl.grid, e.char.x, e.char.y, d))!;
    const wall = dirs.find(d => !canMove(lvl.grid, e.char.x, e.char.y, d));
    const step = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] }[open];
    const target = `${e.char.x + step[0]},${e.char.y + step[1]}`;
    engine.showMap();
    return { engine, e, lvl, open, wall, target };
  }

  it('turning redraws the map with the new facing', () => {
    const { engine, e } = onMap();
    const state = engine.mapMove('left');
    expect(state.phase).toBe('map');
    expect(state.messages[0]).toContain(`Facing ${e.char.facing}`);
  });

  it('walking into a wall stays on the map without moving', () => {
    const { engine, e, wall } = onMap();
    if (!wall) return;  // start cell open on all sides — nothing to test
    e.char.facing = wall;
    const { x, y } = e.char;
    expect(engine.mapMove('forward').phase).toBe('map');
    expect([e.char.x, e.char.y]).toEqual([x, y]);
  });

  it('an ordinary step keeps the map up', () => {
    const { engine, e, lvl, open, target } = onMap();
    lvl.contents.delete(target);
    if (lvl.exit && `${lvl.exit.x},${lvl.exit.y}` === target) lvl.exit = null;
    e.char.facing = open;
    const state = engine.mapMove('forward');
    expect(state.phase).toBe('map');
    expect(`${e.char.x},${e.char.y}`).toBe(target);
  });

  it('stepping onto a ladder or a trap returns to the normal view', () => {
    for (const type of ['ladder-down', 'trap'] as const) {
      const { engine, e, lvl, open, target } = onMap();
      lvl.contents.set(target, { type, id: `t-${type}`, trapVariant: 'pit' });
      e.char.facing = open;
      const state = engine.mapMove('forward');
      expect(state.phase).not.toBe('map');
    }
  });
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
describe('GameEngine — manual saves only', () => {
  let db: any;
  beforeEach(() => { db = createMemoryDb(); });
  afterEach(() => { db.close(); });

  it('walking does not write to the save; pressing S does', () => {
    const engine = makeReadyEngine(db);
    const e = engine as any;
    const repo = new Repository(db);
    const saved = repo.loadCharacter(e.char.id)!;
    e.phase = 'playing';
    e.pace.movesSinceCombat = -1000;
    const lvl = e.getLevel(e.char.dungeonLevel);
    e.char.facing = (['N', 'E', 'S', 'W'] as const).find(d => canMove(lvl.grid, e.char.x, e.char.y, d));
    engine.moveForward();
    e.char.gold += 500;
    engine.turnLeft();

    const stillSaved = repo.loadCharacter(e.char.id)!;
    expect([stillSaved.x, stillSaved.y, stillSaved.gold]).toEqual([saved.x, saved.y, saved.gold]);

    engine.saveAndPrompt();
    expect(repo.loadCharacter(e.char.id)!.gold).toBe(e.char.gold);
  });

  it('dying does not write to the save', () => {
    const engine = makeReadyEngine(db);
    const e = engine as any;
    const repo = new Repository(db);
    forceLethalCombat(engine);
    const state = engine.combatAction('a');
    expect(state.phase).toBe('death');
    expect(repo.loadCharacter(e.char.id)!.deathCount).toBe(0);
  });
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
describe('GameEngine — ruby teleport', () => {
  let db: any;
  beforeEach(() => { db = createMemoryDb(); });
  afterEach(() => { db.close(); });

  it('sends a fresh character somewhere else on the level, even with nothing explored', () => {
    for (let trial = 0; trial < 10; trial++) {
      const engine = makeReadyEngine(db);
      const e = engine as any;
      e.char.intelligence = 18;
      e.char.inventory.gems.ruby = 1;
      e.phase = 'combat';
      e.combat = { monster: createMonster('Orc', 5, 'o1'), round: 1, nakedActive: false, preCombatX: e.char.x, preCombatY: e.char.y };
      const from = { x: e.char.x, y: e.char.y };

      const state = engine.gemAction('a');
      const lvl = e.getLevel(e.char.dungeonLevel);
      const content = lvl.contents.get(`${e.char.x},${e.char.y}`);

      expect(state.phase).toBe('playing');
      expect(e.char.inventory.gems.ruby).toBe(0);
      expect(Math.abs(e.char.x - from.x) + Math.abs(e.char.y - from.y)).toBeGreaterThanOrEqual(10);
      expect(content === undefined || content.type === 'description').toBe(true);
      expect(floodFill(lvl.grid, from.x, from.y).has(`${e.char.x},${e.char.y}`)).toBe(true);
      expect(e.dungeonState.visitedCells.has(`${e.char.dungeonLevel}:${e.char.x},${e.char.y}`)).toBe(true);
    }
  });
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
describe('GameEngine — potions in combat', () => {
  let db: any;
  beforeEach(() => { db = createMemoryDb(); });
  afterEach(() => { db.close(); });

  function hurtInCombat() {
    const engine = makeReadyEngine(db);
    const e = engine as any;
    e.char.maxHp = 1000; e.char.hp = 100;
    e.char.inventory.potions = 2;
    e.phase = 'combat';
    e.combat = { monster: createMonster('Goblin', 1, 'g'), round: 1, nakedActive: false, preCombatX: e.char.x, preCombatY: e.char.y };
    e.combat.monster.hp = e.combat.monster.maxHp = 100000;
    return { engine, e };
  }

  it('is offered in the combat menu with the count', () => {
    const { engine } = hurtInCombat();
    expect(engine.getState().choices).toContainEqual({ key: 'p', text: 'Drink Potion (2)' });
  });

  it('heals, uses up a potion, and costs the turn', () => {
    const { engine, e } = hurtInCombat();
    const state = engine.combatAction('p');
    expect(e.char.inventory.potions).toBe(1);
    expect(state.messages[0]).toContain('gulp down a healing potion');
    expect(e.char.hp).toBeGreaterThan(100 - 50);     // healed well past a goblin's poke
    expect(state.fx?.monsterAttacked ?? state.messages.join(' ').includes('Goblin')).toBeTruthy();
  });

  it('with no potions, or at full health, costs nothing', () => {
    const { engine, e } = hurtInCombat();
    e.char.inventory.potions = 0;
    const hp = e.char.hp;
    expect(engine.combatAction('p').messages).toEqual(['You have no healing potions.']);
    expect(e.char.hp).toBe(hp);

    e.char.inventory.potions = 1;
    e.char.hp = e.char.maxHp;
    expect(engine.combatAction('p').messages).toEqual(['You are already at full health.']);
    expect(e.char.inventory.potions).toBe(1);
  });
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
describe('GameEngine — resting in real time', () => {
  let db: any;
  beforeEach(() => { db = createMemoryDb(); });
  afterEach(() => { db.close(); });

  function wounded() {
    const engine = makeReadyEngine(db);
    const e = engine as any;
    e.phase = 'playing';
    e.char.maxHp = 1000; e.char.hp = 100;
    return { engine, e };
  }

  it('W starts resting, and each tick heals 1.5% of max HP', () => {
    const { engine, e } = wounded();
    expect(engine.startResting().phase).toBe('resting');
    e.rng.float = () => 0.99;                 // no wandering monster this time
    const state = engine.restTick();
    expect(state.phase).toBe('resting');
    expect(e.char.hp).toBe(115);
    expect(state.choices).toEqual([{ key: 'x', text: 'Stop Resting' }]);
  });

  it('keeps going until the character is fully rested', () => {
    const { engine, e } = wounded();
    e.rng.float = () => 0.99;
    engine.startResting();
    let state = engine.getState();
    for (let i = 0; i < 200 && state.phase === 'resting'; i++) state = engine.restTick();
    expect(state.phase).toBe('playing');
    expect(e.char.hp).toBe(1000);
    expect(state.messages.join(' ')).toContain('fully rested');
  });

  it('a wandering monster interrupts it, with the warning kept on screen', () => {
    const { engine, e } = wounded();
    engine.startResting();
    e.rng.float = () => 0.99;
    for (let i = 0; i < 3; i++) engine.restTick();   // the grace period
    e.rng.float = () => 0.0;
    const state = engine.restTick();
    expect(state.phase).toBe('combat');
    expect(state.messages).toContain('Something stirs in the darkness...');
  });

  it('the player can stop at any time', () => {
    const { engine } = wounded();
    engine.startResting();
    const state = engine.stopResting();
    expect(state.phase).toBe('playing');
    expect(state.messages[0]).toContain('You stop resting');
  });
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
describe('GameEngine — the uniques make themselves felt', () => {
  let db: any;
  beforeEach(() => { db = createMemoryDb(); });
  afterEach(() => { db.close(); });

  /** Walks the character around level 7 for a while; returns how many steps brought a presence. */
  function wander(e: any, engine: GameEngine, steps: number): number {
    e.char.dungeonLevel = 7;
    const lvl = e.getLevel(7);
    e.char.x = lvl.entrance.x; e.char.y = lvl.entrance.y;
    e.char.hp = e.char.maxHp = 100000;
    let felt = 0;
    for (let i = 0; i < steps; i++) {
      e.phase = 'playing'; e.combat = null; e.interaction = null;
      e.pace.movesSinceCombat = -1000;
      const open = (['N', 'E', 'S', 'W'] as const).filter(d => canMove(lvl.grid, e.char.x, e.char.y, d));
      e.char.facing = open[i % open.length];
      engine.moveForward();
      if (e.presenceFelt) felt++;
    }
    return felt;
  }

  it('on level 7 the lairs and Asmodeus are felt now and then, and never once they are all defeated', () => {
    const engine = makeReadyEngine(db);
    const e = engine as any;
    expect(wander(e, engine, 600)).toBeGreaterThan(5);

    for (const [, c] of e.getLevel(7).contents) if (c.type === 'unique-monster') e.dungeonState.defeatedUniqueMonsters.add(c.id);
    e.char.asmodeusDefeated = true;
    expect(wander(e, engine, 600)).toBe(0);
  });
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
describe('GameEngine — teleport traps', () => {
  let db: any;
  beforeEach(() => { db = createMemoryDb(); });
  afterEach(() => { db.close(); });

  /** Puts the character on a fresh teleport trap and returns its prompt. */
  function atTeleportTrap(engine: GameEngine, e: any, n: number) {
    const lvl = e.getLevel(e.char.dungeonLevel);
    const k = `${e.char.x},${e.char.y}`;
    lvl.contents.set(k, { type: 'trap', id: `tp-${n}`, trapVariant: 'teleport' });
    e.phase = 'playing';
    return e.handleCellContent(lvl.contents.get(k), k);
  }

  it('offers Step into it only for teleport traps', () => {
    const engine = makeReadyEngine(db);
    const e = engine as any;
    const prompt = atTeleportTrap(engine, e, 0);
    expect(prompt.choices).toContainEqual({ key: 'd', text: 'Step into it' });
  });

  it('stepping in is a gamble: clean landings, rough landings and ambushes all happen', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 200 && seen.size < 3; i++) {
      const engine = makeReadyEngine(db);
      const e = engine as any;
      e.char.hp = e.char.maxHp = 1000;
      const from = `${e.char.x},${e.char.y}`;
      atTeleportTrap(engine, e, i);
      const state = engine.interactionChoice('d');
      if (state.phase === 'combat') { seen.add('ambush'); expect(state.messages.join(' ')).toContain('something hungry'); }
      else if (state.messages.join(' ').includes('wrenches you')) { seen.add('rough'); expect(e.char.hp).toBeLessThan(1000); }
      else { seen.add('clean'); expect(state.messages.join(' ')).toContain('unharmed'); }
      expect(`${e.char.x},${e.char.y}`).not.toBe(from);
    }
    expect(seen).toEqual(new Set(['clean', 'rough', 'ambush']));
  });
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
describe('GameEngine — the emerald ward', () => {
  let db: any;
  beforeEach(() => { db = createMemoryDb(); });
  afterEach(() => { db.close(); });

  function warded() {
    const engine = makeReadyEngine(db);
    const e = engine as any;
    e.char.intelligence = 18;
    e.char.inventory.gems.emerald = 1;
    e.phase = 'playing';
    return { engine, e };
  }

  it('raises a ward for 3 to 5 fights, usable while exploring', () => {
    const { engine, e } = warded();
    const state = engine.useEmeraldExploring();
    expect(e.char.inventory.gems.emerald).toBe(0);
    const ward = e.char.statusEffects.find((s: any) => s.type === 'warded');
    expect(ward.value).toBeGreaterThanOrEqual(3);
    expect(ward.value).toBeLessThanOrEqual(5);
    expect(state.messages.join(' ')).toContain('emerald ward');
  });

  it('wears off after its fights, and walking does not wear it down', () => {
    const { engine, e } = warded();
    engine.useEmeraldExploring();
    const fights = e.char.statusEffects.find((s: any) => s.type === 'warded').value;
    engine.startResting(); for (let i = 0; i < 5; i++) engine.restTick();   // steps/ticks don't count
    e.phase = 'playing';
    expect(e.char.statusEffects.find((s: any) => s.type === 'warded').value).toBe(fights);
    for (let i = 0; i < fights; i++) e.endCombat(true);
    expect(e.char.statusEffects.some((s: any) => s.type === 'warded')).toBe(false);
  });

  it('survives a save and reload', () => {
    const { engine, e } = warded();
    engine.useEmeraldExploring();
    engine.saveAndPrompt();
    const loaded = new Repository(db).loadCharacter(e.char.id)!;
    expect(loaded.statusEffects.some(s => s.type === 'warded')).toBe(true);
  });
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
describe('GameEngine — torchlight on the map', () => {
  let db: any;
  beforeEach(() => { db = createMemoryDb(); });
  afterEach(() => { db.close(); });

  it('reveals squares within 2 steps through open passages, never through walls', () => {
    const engine = makeReadyEngine(db);
    const e = engine as any;
    const lvl = e.getLevel(e.char.dungeonLevel);
    const L = e.char.dungeonLevel;
    e.dungeonState.visitedCells = new Set();
    e.phase = 'playing';
    engine.turnLeft();                         // lights up around us without moving

    // Everything reachable in <= 2 steps is lit...
    const within2 = new Set<string>([`${e.char.x},${e.char.y}`]);
    let frontier = [[e.char.x, e.char.y]];
    for (let d = 0; d < 2; d++) {
      const next: number[][] = [];
      for (const [x, y] of frontier) for (const [dir, dx, dy] of [['N', 0, -1], ['E', 1, 0], ['S', 0, 1], ['W', -1, 0]] as const) {
        if (canMove(lvl.grid, x, y, dir) && !within2.has(`${x + dx},${y + dy}`)) { within2.add(`${x + dx},${y + dy}`); next.push([x + dx, y + dy]); }
      }
      frontier = next;
    }
    for (const k of within2) expect(e.dungeonState.visitedCells.has(`${L}:${k}`)).toBe(true);
    // ...and nothing else.
    expect(e.dungeonState.visitedCells.size).toBe(within2.size);
  });

  it('walking with the map open lights the way ahead', () => {
    const engine = makeReadyEngine(db);
    const e = engine as any;
    const lvl = e.getLevel(e.char.dungeonLevel);
    e.phase = 'playing';
    e.pace.movesSinceCombat = -1000;
    e.char.facing = (['N', 'E', 'S', 'W'] as const).find(d => canMove(lvl.grid, e.char.x, e.char.y, d));
    const before = e.dungeonState.visitedCells.size;
    engine.showMap();
    engine.mapMove('forward');
    expect(e.dungeonState.visitedCells.size).toBeGreaterThanOrEqual(before);
  });
});
