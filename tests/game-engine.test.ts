import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createMemoryDb } from '../src/database/database.js';
import { Repository } from '../src/database/repositories.js';
import { GameEngine } from '../src/core/game-engine.js';
import { createMonster } from '../src/core/monsters.js';
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
    expect(state.messages[0]).toContain('Killed by a Level 5 Kobold');
  });

  it('offers Continue and Quit choices instead of a single "any key" prompt', () => {
    const engine = makeReadyEngine(db);
    forceLethalCombat(engine, 'Kobold');
    const state = engine.combatAction('a');

    expect(state.choices).toEqual([
      { key: 'c', text: 'Continue' },
      { key: 'q', text: 'Quit to Main Menu' },
    ]);
  });

  it('Continue resumes play with full HP at the level entrance', () => {
    const engine = makeReadyEngine(db);
    forceLethalCombat(engine, 'Kobold');
    engine.combatAction('a');

    const state = engine.dismissDeath();
    expect(state.phase).toBe('playing');
    expect(state.character!.hp).toBe(state.character!.maxHp);
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

    const state = engine.gemAction('e');
    expect(state.phase).toBe('combat');
    expect(e.char.inventory.gems).toEqual({ ruby: 1, sapphire: 1, diamond: 1, opal: 1 });
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
    expect(keys).toEqual([`${e.char.dungeonLevel}:${e.char.x},${e.char.y}`]);
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
