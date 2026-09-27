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
    e.dungeonState.visitedCells = new Set([
      '40,30',
      '35,30',
      '45,30',
      '0,0',
      `${DUNGEON.WIDTH - 1},${DUNGEON.HEIGHT - 1}`,
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
    e.dungeonState.visitedCells = new Set(['0,0']);

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
