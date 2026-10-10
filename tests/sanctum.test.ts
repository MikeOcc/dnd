// The seventh level: Asmodeus's throne room at the end of the Long Way, and
// the districts of Hell.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { generateLevel, deserializeLevel, floodFill } from '../src/core/dungeon.js';
import { distances } from '../src/core/lairs.js';
import { buildSanctum, SANCTUM } from '../src/core/sanctum.js';
import { mapAreas, areaAtCell } from '../src/core/regions.js';
import { assignDistricts } from '../src/core/hell-districts.js';
import { APPROACH_EVENTS } from '../src/content/district-text.js';
import { createMemoryDb } from '../src/database/database.js';
import { Repository } from '../src/database/repositories.js';
import { GameEngine } from '../src/core/game-engine.js';

describe('the Long Way and the throne room', () => {
  it('a throne room with one door, at the end of a long passage, cutting nothing else off', () => {
    for (let s = 1; s <= 15; s++) {
      const seed = s * 7919;
      const { grid, entrance, contents } = deserializeLevel(generateLevel(7, seed));
      const was = distances(grid, entrance).get([...contents.entries()].find(([, c]) => c.monsterId === 'Asmodeus')![0])!.d;
      const before = floodFill(grid, entrance.x, entrance.y);
      const sc = buildSanctum(grid, entrance, contents, seed)!;
      expect(sc).not.toBeNull();
      const after = floodFill(grid, entrance.x, entrance.y);
      expect([...before].every(c => after.has(c))).toBe(true);
      // Asmodeus is on the throne, inside a room with exactly one way in.
      expect(contents.get(`${sc.throne.x},${sc.throne.y}`)?.monsterId).toBe('Asmodeus');
      const room = areaAtCell(mapAreas(grid), sc.throne.x, sc.throne.y)!;
      expect(room.kind).toBe('room');
      expect(room.exits).toBe(1);
      // A longer walk than before, and a long one: by the Long Way, or (where the rooms are packed too close) to a walled-up far room.
      const walk = distances(grid, entrance).get(`${sc.throne.x},${sc.throne.y}`)!.d;
      expect(walk).toBeGreaterThan(was);
      expect(walk).toBeGreaterThanOrEqual(SANCTUM.GOOD_WALK);
    }
  });

  it('nothing runs alongside the passage: it touches the rest of the level only at the crack and the door', () => {
    // (The map draws no walls, so anything beside it would look joined to it.)
    for (let s = 1; s <= 15; s++) {
      const seed = s * 7919;
      const { grid, entrance, contents } = deserializeLevel(generateLevel(7, seed));
      const sc = buildSanctum(grid, entrance, contents, seed)!;
      if (!sc.path.length) continue;   // a walled-up room: no passage
      const way = new Set([...sc.path, ...sc.branches].map(p => `${p.x},${p.y}`));
      const rock = (x: number, y: number) => { const w = grid[y]?.[x]?.walls; return !w || (w.N && w.E && w.S && w.W); };
      const inThrone = (x: number, y: number) => x >= sc.room.x0 && x <= sc.room.x1 && y >= sc.room.y0 && y <= sc.room.y1;
      for (const p of [...sc.path, ...sc.branches]) {
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const x = p.x + dx, y = p.y + dy;
          if (rock(x, y) || way.has(`${x},${y}`)) continue;
          const ok = (x === sc.mouth.x && y === sc.mouth.y && p === sc.path[0]) || (p === sc.door && inThrone(x, y));
          expect(ok, `passage square ${p.x},${p.y} beside ${x},${y}`).toBe(true);
        }
      }
    }
  });

  it('is the same every time the level loads', () => {
    const a = deserializeLevel(generateLevel(7, 4242)), b = deserializeLevel(generateLevel(7, 4242));
    const sa = buildSanctum(a.grid, a.entrance, a.contents, 4242)!, sb = buildSanctum(b.grid, b.entrance, b.contents, 4242)!;
    expect(sb.throne).toEqual(sa.throne);
    expect(sb.path).toEqual(sa.path);
  });

  it('every room and corridor has a district: the Ash Plain at the ladder, the Long Way, the throne room', () => {
    const seed = 99991;
    const { grid, entrance, contents } = deserializeLevel(generateLevel(7, seed));
    const sc = buildSanctum(grid, entrance, contents, seed)!;
    const areas = mapAreas(grid);
    const d = assignDistricts(grid, areas, entrance, sc, seed);
    expect(d.length).toBe(areas.areas.length);
    const at = (p: { x: number; y: number }) => d[areas.areaAt[p.y * grid[0].length + p.x]];
    expect(at(entrance)).toBe('ash');
    if (sc.path.length) expect(at(sc.path[Math.floor(sc.path.length / 2)])).toBe('approach');
    expect(at(sc.throne)).toBe('throne');
    expect(at(sc.mouth)).toBe('court');
    for (const id of ['forges', 'frozen', 'pacts', 'cages']) expect(d).toContain(id);
  });
});

describe('the seventh level in the game', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let db: any;
  beforeEach(() => { db = createMemoryDb(); });
  afterEach(() => { db.close(); });

  function onLevel7() {
    const e = new GameEngine(new Repository(db)) as any;
    e.startNameEntry(); e.submitName('Walker'); e.acceptCharacter(); e.dismissLevelIntro();
    e.char.hp = e.char.maxHp = 1000;
    // A level with a Long Way (some packed levels wall up a far room instead).
    e.repo.saveLevel(e.char.id, 7, generateLevel(7, 5 * 7919));
    e.char.dungeonLevel = 7; e.loadLevelIntoCache(7); e.phase = 'playing';
    const lvl = e.getLevel(7);
    return { e, lvl, sc: lvl.sanctum };
  }

  it('the things along the Long Way happen once each, as you come to them', () => {
    const { e, sc } = onLevel7();
    const potions = e.char.inventory.potions;
    const seen: string[] = [];
    for (const p of sc.path) { e.char.x = p.x; e.char.y = p.y; seen.push(...e.alongTheLongWay()); }
    for (const ev of APPROACH_EVENTS) expect(seen).toContain(ev.lines[0]);
    expect(e.char.inventory.potions).toBe(potions + 1);
    expect(e.char.hp).toBeGreaterThan(0);
    // Walking it again: nothing.
    for (const p of sc.path) { e.char.x = p.x; e.char.y = p.y; expect(e.alongTheLongWay()).toEqual([]); }
  });

  it('the fire along it never kills', () => {
    const { e, sc } = onLevel7();
    e.char.hp = 1; e.char.dexterity = 3;
    const fire = APPROACH_EVENTS.find(x => x.id === 'fire')!;
    const p = sc.path[Math.floor(fire.at * sc.path.length)];
    e.char.x = p.x; e.char.y = p.y;
    e.alongTheLongWay();
    expect(e.char.hp).toBe(1);
  });

  it('no teleport lands on the Long Way or in the throne room', () => {
    const { e, lvl, sc } = onLevel7();
    for (let i = 0; i < 300; i++) {
      e.char.x = lvl.entrance.x; e.char.y = lvl.entrance.y;
      e.teleportPlayer();
      expect(e.onTheLongWay(lvl, { x: e.char.x, y: e.char.y })).toBe(false);
    }
    void sc;
  });

  it('says where you have come, the first time into each district', () => {
    const { e, lvl } = onLevel7();
    e.char.x = lvl.entrance.x; e.char.y = lvl.entrance.y; e.lastArea = null;
    const first = e.enterArea().join(' ');
    expect(first).toContain('the Ash Plain');
    expect(first).toMatch(/You are in .*ash/);
    e.lastArea = null;
    expect(e.enterArea().join(' ')).not.toContain('This is the Ash Plain');
    expect(e.getState().district).toBe('ash');
  });

  it('"NOT. NOW." sends you back to the start of the Long Way', () => {
    const { e, sc } = onLevel7();
    e.dismissedByAsmodeus();
    expect({ x: e.char.x, y: e.char.y }).toEqual(sc.mouth);
  });
});
