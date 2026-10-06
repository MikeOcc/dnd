// The 3D views' camera, rays, projection and occlusion (src/web/view3d.js),
// checked on the development test scene: a corridor entering a 7×7
// high-ceilinged chamber, with a fountain, an altar, two pillars and an exit.
import { describe, it, expect, beforeAll } from 'vitest';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let V: any;
beforeAll(async () => {
  // @ts-expect-error: a plain browser script (it sets globalThis.View3D), so no type declarations
  await import('../src/web/view3d.js');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  V = (globalThis as any).View3D;
});

const N = 1, E = 2, S = 4, W = 8;
function testScene(x: number, y: number, facing: string) {
  const cells: [number, number, number, number, string, number, number][] = [];
  for (let cy = 3; cy <= 9; cy++) for (let cx = 2; cx <= 8; cx++) {
    let w = 0;
    if (cy === 3 && cx !== 5) w |= N;
    if (cy === 9 && cx !== 5) w |= S;
    if (cx === 2) w |= W;
    if (cx === 8) w |= E;
    cells.push([cx, cy, w, 1, 'ssss', 0, 0]);
  }
  for (let cy = 10; cy <= 13; cy++) cells.push([5, cy, E | W | (cy === 13 ? S : 0), 0, 'ssss', 0, 0]);
  for (let cy = 0; cy <= 2; cy++) cells.push([5, cy, E | W | (cy === 0 ? N : 0), 0, 'ssss', 0, 0]);
  return {
    x, y, facing, level: 3, radius: 9, cells,
    objects: [
      { x: 5, y: 6, kind: 'fountain' }, { x: 5, y: 4, kind: 'altar' },
      { x: 4, y: 7, kind: 'pillar' }, { x: 6, y: 5, kind: 'pillar' }, { x: 5, y: 11, kind: 'chest' },
    ],
  };
}
const SIZES: Record<string, { w: number; h: number }> = { fountain: { w: 0.95, h: 0.9 }, altar: { w: 0.95, h: 0.72 }, pillar: { w: 0.42, h: 1 }, chest: { w: 0.6, h: 0.42 } };
const sizeOf = (o: { kind: string }) => SIZES[o.kind];
const W_PX = 900, H_PX = 420, COLS = 300;

function view(x: number, y: number, facing: string) {
  const scene = testScene(x, y, facing);
  const world = V.buildWorld(scene);
  const cam = V.cameraFor(x, y, facing);
  const cast = V.castColumns(world, cam, COLS, W_PX, H_PX);
  const placed = V.placeObjects(world, cam, W_PX, H_PX, sizeOf);
  return { world, cam, cast, placed };
}

describe('3D view: walls from the real map', () => {
  it('in the corridor, the side wall is half a square away', () => {
    const { world, cam } = view(5, 12, 'E');
    const r = V.castRay(world, cam, 0);
    expect(r.hit.dir).toBe('E');
    expect(r.hit.dist).toBeCloseTo(0.5, 5);
  });

  it('from the entrance the chamber reads as a wide open space, not a corridor', () => {
    const { cast } = view(5, 10, 'N');
    const deep = cast.columns.filter((c: { depth: number }) => c.depth > 2).length;
    expect(deep / COLS).toBeGreaterThan(0.9);
    // Just left of centre (dead centre runs out through the far exit), the back wall, through the doorway.
    const back = cast.columns[Math.floor(COLS * 0.35)];
    expect(back.wall.dir).toBe('N');
    expect(back.depth).toBeCloseTo(7.5, 1);
    const sides = new Set(cast.columns.map((c: { wall: { dir: string } | null }) => c.wall?.dir));
    expect(sides.has('W') || sides.has('E')).toBe(true);   // the chamber's side walls show too
  });

  it("down a long low corridor, a tall room's back wall is clipped at the top of the doorway", () => {
    // A corridor (x=0, y=4..8, ordinary ceiling) into a short, vast room (x=-1..1, y=0..3).
    const cells: [number, number, number, number, string, number, number][] = [];
    for (let y = 0; y <= 3; y++) for (let x = -1; x <= 1; x++) {
      cells.push([x, y, (y === 0 ? N : 0) | (y === 3 && x !== 0 ? S : 0) | (x === -1 ? W : 0) | (x === 1 ? E : 0), 2, 'ssss', 0, 0]);
    }
    for (let y = 4; y <= 8; y++) cells.push([0, y, E | W | (y === 8 ? S : 0), 0, 'ssss', 0, 0]);
    const world = V.buildWorld({ x: 0, y: 8, facing: 'N', level: 1, radius: 9, cells, objects: [] });
    const cast = V.castColumns(world, V.cameraFor(0, 8, 'N'), COLS, W_PX, H_PX);
    const c = cast.columns[COLS / 2];
    expect(c.wall.dir).toBe('N');
    expect(c.wall.dist).toBeCloseTo(8.5, 5);
    const unclipped = cast.horizon - (cast.f * (V.CEILING_HEIGHTS[2] - V.EYE)) / c.wall.dist;
    const doorTop = cast.horizon - (cast.f * (1 - V.EYE)) / 4.5;
    expect(c.wall.top).toBeCloseTo(doorTop, 5);
    expect(c.wall.top).toBeGreaterThan(unclipped);
  });

  it('looking from the tall chamber into the low corridor, the wall over the doorway (a lintel) is drawn', () => {
    const { cast } = view(5, 6, 'S');
    expect(cast.columns[COLS / 2].lintels.length).toBe(1);
  });
});

describe('3D view: landmarks anchored to the map', () => {
  it('straight ahead sits in the middle; one square to the side sits off-centre that way', () => {
    const cam = V.cameraFor(5, 10, 'N');
    expect(V.projectObject(cam, 5, 6, W_PX, H_PX).screenX).toBeCloseTo(W_PX / 2, 5);
    expect(V.projectObject(cam, 6, 6, W_PX, H_PX).screenX).toBeGreaterThan(W_PX / 2);
    expect(V.projectObject(cam, 4, 6, W_PX, H_PX).screenX).toBeLessThan(W_PX / 2);
    // Turned to face east, the same fountain is now off to the left.
    expect(V.projectObject(V.cameraFor(5, 10, 'E'), 5, 6, W_PX, H_PX).lateral).toBeLessThan(0);
  });

  it('a step closer, it is larger and its base lower on the screen (it stands on the floor)', () => {
    const far = V.projectObject(V.cameraFor(5, 10, 'N'), 5, 6, W_PX, H_PX);
    const near = V.projectObject(V.cameraFor(5, 9, 'N'), 5, 6, W_PX, H_PX);
    expect(near.scale).toBeGreaterThan(far.scale);
    expect(near.baseY).toBeGreaterThan(far.baseY);
  });

  it('nearer landmarks are drawn after (over) farther ones', () => {
    const { placed } = view(3, 9, 'N');
    const depths = placed.map((p: { depth: number }) => p.depth);
    expect([...depths].sort((a, b) => b - a)).toEqual(depths);
    const at = (kind: string, x: number) => placed.findIndex((p: { obj: { kind: string; x: number } }) => p.obj.kind === kind && p.obj.x === x);
    expect(at('pillar', 4)).toBeGreaterThan(at('fountain', 5));   // the pillar in front covers the fountain
  });

  it('the pillar and the fountain overlap on screen from (3,9), so the pillar hides part of it', () => {
    const { placed } = view(3, 9, 'N');
    const f = placed.find((p: { obj: { kind: string } }) => p.obj.kind === 'fountain');
    const p = placed.find((q: { obj: { kind: string; x: number } }) => q.obj.kind === 'pillar' && q.obj.x === 4);
    expect(p.left).toBeLessThan(f.left + f.width);
    expect(p.left + p.width).toBeGreaterThan(f.left);
  });

  it('walls hide what is behind them: from down the corridor, the doorway edge cuts off part of a pillar', () => {
    const { cast, placed } = view(5, 13, 'N');
    const p = placed.find((q: { obj: { kind: string; x: number } }) => q.obj.kind === 'pillar' && q.obj.x === 4);
    const runs = V.visibleRuns(cast, p, W_PX);
    const colW = W_PX / COLS;
    const spanCols = Math.floor((p.left + p.width) / colW) - Math.floor(p.left / colW) + 1;
    const visible = runs.reduce((n: number, r: { from: number; to: number }) => n + r.to - r.from + 1, 0);
    expect(visible).toBeGreaterThan(0);
    expect(visible).toBeLessThan(spanCols);
  });

  it('nothing behind the camera or too close is drawn', () => {
    const { placed } = view(5, 10, 'S');
    expect(placed.every((p: { depth: number }) => p.depth >= V.NEAR)).toBe(true);
    expect(placed.some((p: { obj: { kind: string } }) => p.obj.kind === 'fountain')).toBe(false);
  });
});

describe('3D view: a south-facing throne is seen from the right side', () => {
  it('front from the south, back from the north, profile from east and west', () => {
    const o = { x: 7, y: 7 };
    expect(V.sideSeen(V.cameraFor(7, 9, 'N'), o)).toBe('front');
    expect(V.sideSeen(V.cameraFor(7, 4, 'S'), o)).toBe('back');
    expect(V.sideSeen(V.cameraFor(4, 7, 'E'), o)).toBe('faces-right');
    expect(V.sideSeen(V.cameraFor(8, 7, 'W'), o)).toBe('faces-left');
  });
});

describe('3D view: smooth movement and the monster in the scene', () => {
  it('a camera between squares and facings sees the same walls as the square camera at the ends', () => {
    const scene = testScene(5, 12, 'N');
    const world = V.buildWorld(scene);
    const exact = V.castRay(world, V.cameraFor(5, 12, 'E'), 0).hit;
    const free = V.castRay(world, V.cameraAt(5.5, 12.5, V.FACING_ANGLE.E), 0).hit;
    expect(free.dir).toBe(exact.dir);
    expect(free.dist).toBeCloseTo(exact.dist, 6);
    // Halfway through a turn, it looks diagonally: further to the wall than straight across.
    const mid = V.castRay(world, V.cameraAt(5.5, 12.5, (V.FACING_ANGLE.N + V.FACING_ANGLE.E) / 2), 0).hit;
    expect(mid.dist).toBeGreaterThan(exact.dist);
    // Halfway through a step north, the camera is half a square further on.
    const half = V.castRay(world, V.cameraAt(5.5, 12, V.FACING_ANGLE.E), 0).hit;
    expect(half.dist).toBeCloseTo(0.5, 6);
  });

  it('the monster you are fighting stands at an exact spot and is drawn even with a wall close behind', () => {
    const scene = testScene(5, 12, 'E');           // facing the corridor wall, half a square away
    const world = V.buildWorld(scene);
    const cam = V.cameraFor(5, 12, 'E');
    world.objects = [{ kind: 'monster', at: [cam.x + 1.6, cam.y], noClip: true }];
    const cast = V.castColumns(world, cam, COLS, W_PX, H_PX);
    const [m] = V.placeObjects(world, cam, W_PX, H_PX, () => ({ w: 1, h: 1 }));
    expect(m.depth).toBeCloseTo(1.6, 6);
    expect(m.screenX).toBeCloseTo(W_PX / 2, 6);
    const runs = V.visibleRuns(cast, m, W_PX);
    expect(runs).toHaveLength(1);                   // the whole figure, though the wall is nearer
  });
});
