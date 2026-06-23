import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createMemoryDb } from '../src/database/database.js';
import { Repository } from '../src/database/repositories.js';
import { RNG } from '../src/core/random.js';
import { rollCharacter, createCharacter } from '../src/core/character.js';
import { generateLevel } from '../src/core/dungeon.js';
import type { DungeonState } from '../src/core/types.js';

function makeChar(id = 'char-1') {
  const rng = new RNG(1);
  const roll = rollCharacter(rng);
  return createCharacter(id, 'TestHero', roll);
}

describe('Repository — characters', () => {
  // Using 'any' intentionally: DatabaseSync type is lazy-loaded at runtime.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let db: any;
  let repo: Repository;

  beforeEach(() => {
    db = createMemoryDb();
    repo = new Repository(db);
  });

  afterEach(() => {
    db.close();
  });

  it('saves and loads a character', () => {
    const char = makeChar('c1');
    repo.saveCharacter(char);
    const loaded = repo.loadCharacter('c1');

    expect(loaded).not.toBeNull();
    expect(loaded!.id).toBe('c1');
    expect(loaded!.name).toBe('TestHero');
    expect(loaded!.hp).toBe(char.hp);
    expect(loaded!.maxHp).toBe(char.maxHp);
    expect(loaded!.strength).toBe(char.strength);
  });

  it('returns null for non-existent character', () => {
    const result = repo.loadCharacter('does-not-exist');
    expect(result).toBeNull();
  });

  it('updates character on second save', () => {
    const char = makeChar('c2');
    repo.saveCharacter(char);

    char.xp = 5000;
    char.level = 3;
    char.gold = 999;
    repo.saveCharacter(char);

    const loaded = repo.loadCharacter('c2');
    expect(loaded!.xp).toBe(5000);
    expect(loaded!.level).toBe(3);
    expect(loaded!.gold).toBe(999);
  });

  it('lists characters', () => {
    const c1 = makeChar('c3');
    const c2 = makeChar('c4');
    c2.name = 'AnotherHero';
    repo.saveCharacter(c1);
    repo.saveCharacter(c2);

    const list = repo.listCharacters();
    expect(list.length).toBeGreaterThanOrEqual(2);
    expect(list.some(c => c.id === 'c3')).toBe(true);
    expect(list.some(c => c.id === 'c4')).toBe(true);
  });

  it('deletes a character', () => {
    const char = makeChar('c5');
    repo.saveCharacter(char);
    repo.deleteCharacter('c5');
    const loaded = repo.loadCharacter('c5');
    expect(loaded).toBeNull();
  });

  it('preserves status effects across save/load', () => {
    const char = makeChar('c6');
    char.statusEffects = [
      { type: 'poison', value: 5, turns: 3 },
      { type: 'naked', value: 0, turns: 10 },
    ];
    repo.saveCharacter(char);
    const loaded = repo.loadCharacter('c6');
    expect(loaded!.statusEffects).toHaveLength(2);
    expect(loaded!.statusEffects[0].type).toBe('poison');
    expect(loaded!.statusEffects[1].type).toBe('naked');
  });

  it('preserves asmodeusDefeated flag', () => {
    const char = makeChar('c7');
    char.asmodeusDefeated = true;
    repo.saveCharacter(char);
    const loaded = repo.loadCharacter('c7');
    expect(loaded!.asmodeusDefeated).toBe(true);
  });

  it('preserves introsSeen array', () => {
    const char = makeChar('c8');
    char.introsSeen = [1, 2, 3];
    repo.saveCharacter(char);
    const loaded = repo.loadCharacter('c8');
    expect(loaded!.introsSeen).toEqual([1, 2, 3]);
  });
});

describe('Repository — dungeon levels', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let db: any;
  let repo: Repository;

  beforeEach(() => {
    db = createMemoryDb();
    repo = new Repository(db);
  });

  afterEach(() => { db.close(); });

  it('saves and loads a dungeon level', () => {
    const char = makeChar('char-x');
    repo.saveCharacter(char);
    const level = generateLevel(1, 99999);
    repo.saveLevel('char-x', 1, level);
    const loaded = repo.loadLevel('char-x', 1);

    expect(loaded).not.toBeNull();
    expect(loaded!.levelNumber).toBe(1);
    expect(loaded!.entrance).toEqual(level.entrance);
    expect(loaded!.cells[0]).toHaveLength(level.width);
  });

  it('returns null for non-existent level', () => {
    const result = repo.loadLevel('no-char', 3);
    expect(result).toBeNull();
  });
});

describe('Repository — dungeon state', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let db: any;
  let repo: Repository;

  beforeEach(() => {
    db = createMemoryDb();
    repo = new Repository(db);
    const char = makeChar('ds-char');
    repo.saveCharacter(char);
  });

  afterEach(() => { db.close(); });

  it('saves and loads dungeon state', () => {
    const state: DungeonState = {
      visitedCells:           new Set(['1,2', '3,4']),
      openedChests:           new Set(['chest-1-0']),
      readBooks:              new Set(['book-1-0']),
      usedFountains:          new Set(['fountain-2-0']),
      usedAltars:             new Set(['altar-3-0']),
      triggeredTraps:         new Set(['trap-1-0']),
      disarmedTraps:          new Set(['trap-1-1']),
      defeatedFixedMonsters:  new Set(['fm-1-1']),
      defeatedUniqueMonsters: new Set(['unique-aboleth']),
      visitedDescriptions:    new Set(['desc-1-5-5']),
    };

    repo.saveDungeonState('ds-char', state);
    const loaded = repo.loadDungeonState('ds-char');

    expect(loaded).not.toBeNull();
    expect([...loaded!.visitedCells]).toContain('1,2');
    expect([...loaded!.openedChests]).toContain('chest-1-0');
    expect([...loaded!.readBooks]).toContain('book-1-0');
    expect([...loaded!.usedFountains]).toContain('fountain-2-0');
    expect([...loaded!.usedAltars]).toContain('altar-3-0');
    expect([...loaded!.triggeredTraps]).toContain('trap-1-0');
    expect([...loaded!.disarmedTraps]).toContain('trap-1-1');
    expect([...loaded!.defeatedFixedMonsters]).toContain('fm-1-1');
    expect([...loaded!.defeatedUniqueMonsters]).toContain('unique-aboleth');
    expect([...loaded!.visitedDescriptions]).toContain('desc-1-5-5');
  });

  it('unique monsters remain dead after reload', () => {
    const state: DungeonState = {
      visitedCells: new Set(),
      openedChests: new Set(),
      readBooks: new Set(),
      usedFountains: new Set(),
      usedAltars: new Set(),
      triggeredTraps: new Set(),
      disarmedTraps: new Set(),
      defeatedFixedMonsters: new Set(),
      defeatedUniqueMonsters: new Set(['unique-asmodeus']),
      visitedDescriptions: new Set(),
    };

    repo.saveDungeonState('ds-char', state);
    const loaded = repo.loadDungeonState('ds-char');

    expect(loaded!.defeatedUniqueMonsters.has('unique-asmodeus')).toBe(true);
  });
});
