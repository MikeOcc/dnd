// THE SEVEN LEVELS — the 3D dungeon views ("ASCII 3D" and "Painted").
//
// The server sends the map around the character (GameState.scene: walls,
// ceilings, wall materials, torches, carvings, landmarks). This file casts a
// ray per screen column through that map, the same way for both looks:
//
//   - ASCII 3D: the architecture is drawn in terminal glyphs (staggered
//     masonry, perspective floor seams, distance shading) and landmarks are
//     graphical sprites standing in it.
//   - Painted: the same geometry with shaded wall textures, flagstones and
//     torchlight.
//
// Landmarks are billboards anchored bottom-centre on their square's floor,
// scaled by distance and drawn column by column only where nothing nearer
// (a wall, the lintel over a doorway into a taller room, a nearer sprite)
// is in the way. The maths (rays, projection, occlusion) is pure and lives
// on View3D so the tests can check it without a browser.
//
// Sprite artwork comes from view-sprites.js (getSceneSprite); replacement
// PNGs go in src/web/sprites/ (see SPRITE_FILES there).

(function (root) {
  'use strict';

  const DIRS = ['N', 'E', 'S', 'W'];
  const BIT = { N: 1, E: 2, S: 4, W: 8 };
  const OPPOSITE = { N: 'S', S: 'N', E: 'W', W: 'E' };
  const FORWARD = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
  const MATERIALS = { s: 'stone', b: 'brick', w: 'wood', r: 'rough' };

  const FOV = (70 * Math.PI) / 180;
  const TAN_HALF = Math.tan(FOV / 2);
  const EYE = 0.5;                   // eye height; walls are 1 tall
  const CEILING_HEIGHTS = [1, 1.7, 2.5];
  const MAX_DIST = 9.5;              // the torch reaches no further
  const NEAR = 0.3;                  // closer than this, a sprite isn't drawn

  // ─── The world ──────────────────────────────────────────────────────────

  /** Indexes a scene for lookups. */
  function buildWorld(scene) {
    const cells = new Map();
    for (const [x, y, walls, ceiling, mats, torches, carvings] of scene.cells) {
      cells.set(`${x},${y}`, { x, y, walls, ceiling, mats, torches, carvings });
    }
    return { scene, cells, objects: scene.objects || [] };
  }

  const cellAt = (world, x, y) => world.cells.get(`${x},${y}`);

  /** Whether there's a wall on side `dir` of square (x,y). Squares outside
   * the scene (solid rock, or beyond its radius) count as walled. */
  function wallBetween(world, x, y, dir) {
    const c = cellAt(world, x, y);
    if (!c) return true;
    if (c.walls & BIT[dir]) return true;
    const [dx, dy] = FORWARD[dir];
    const n = cellAt(world, x + dx, y + dy);
    return !n || !!(n.walls & BIT[OPPOSITE[dir]]);
  }

  function ceilingOf(world, x, y) {
    const c = cellAt(world, x, y);
    return CEILING_HEIGHTS[c ? c.ceiling : 0] || 1;
  }

  /** What a wall is made of, and what's on it. */
  function wallInfo(world, x, y, dir) {
    const c = cellAt(world, x, y);
    const i = DIRS.indexOf(dir);
    if (c && c.walls & BIT[dir]) {
      return { material: MATERIALS[c.mats[i]] || 'stone', torch: !!(c.torches & BIT[dir]), carved: !!(c.carvings & BIT[dir]) };
    }
    // Walled only from the other side (or rock): ask the neighbour.
    const [dx, dy] = FORWARD[dir];
    const n = cellAt(world, x + dx, y + dy);
    const j = DIRS.indexOf(OPPOSITE[dir]);
    if (n && n.walls & BIT[OPPOSITE[dir]]) {
      return { material: MATERIALS[n.mats[j]] || 'stone', torch: !!(n.torches & BIT[OPPOSITE[dir]]), carved: !!(n.carvings & BIT[OPPOSITE[dir]]) };
    }
    return { material: 'rough', torch: false, carved: false };
  }

  // ─── The camera ─────────────────────────────────────────────────────────

  const FACING_ANGLE = { N: -Math.PI / 2, E: 0, S: Math.PI / 2, W: Math.PI };

  /** A camera anywhere, looking at `angle` (radians; 0 = east, map y runs
   * south). `right` is the unit vector to its right; distances are measured
   * along `dir` (perpendicular distance, so walls don't bow). Smooth
   * movement uses positions and angles between squares and facings. */
  function cameraAt(px, py, angle) {
    const dx = Math.cos(angle), dy = Math.sin(angle);
    return { x: px, y: py, dir: [dx, dy], right: [-dy, dx], cellX: Math.floor(px), cellY: Math.floor(py), angle };
  }

  /** The camera at the centre of square (x,y), looking the character's way. */
  function cameraFor(x, y, facing) {
    const cam = cameraAt(x + 0.5, y + 0.5, FACING_ANGLE[facing]);
    // Exact axis vectors (no floating-point dust) for the usual case.
    const [dx, dy] = FORWARD[facing];
    cam.dir = [dx, dy]; cam.right = [-dy, dx];
    return cam;
  }

  /** Pixels per world unit at distance 1, for a view `width` pixels wide. */
  const focalFor = (width) => width / 2 / TAN_HALF;

  // ─── Rays ───────────────────────────────────────────────────────────────

  /** Casts one ray from the camera at camX (-1 = left edge, 1 = right edge).
   * Returns the wall it hits (or null within MAX_DIST) and the doorway
   * crossings on the way, each with the ceilings either side, so lintels can
   * be drawn and things beyond a low opening clipped. */
  function castRay(world, cam, camX) {
    const rdx = cam.dir[0] + cam.right[0] * TAN_HALF * camX;
    const rdy = cam.dir[1] + cam.right[1] * TAN_HALF * camX;
    let mapX = cam.cellX, mapY = cam.cellY;
    const deltaX = rdx === 0 ? Infinity : Math.abs(1 / rdx);
    const deltaY = rdy === 0 ? Infinity : Math.abs(1 / rdy);
    const stepX = rdx < 0 ? -1 : 1, stepY = rdy < 0 ? -1 : 1;
    let sideX = rdx < 0 ? (cam.x - mapX) * deltaX : (mapX + 1 - cam.x) * deltaX;
    let sideY = rdy < 0 ? (cam.y - mapY) * deltaY : (mapY + 1 - cam.y) * deltaY;
    const crossings = [];
    for (let guard = 0; guard < 64; guard++) {
      let dir, dist;
      if (sideX < sideY) { dir = stepX > 0 ? 'E' : 'W'; dist = sideX; }
      else { dir = stepY > 0 ? 'S' : 'N'; dist = sideY; }
      if (dist > MAX_DIST) return { hit: null, crossings, rdx, rdy };
      if (wallBetween(world, mapX, mapY, dir)) {
        const along = dir === 'E' || dir === 'W' ? cam.y + dist * rdy : cam.x + dist * rdx;
        let u = along - Math.floor(along);
        if (dir === 'W' || dir === 'S') u = 1 - u;   // read every wall left to right
        return {
          hit: { dist, dir, cellX: mapX, cellY: mapY, u, height: ceilingOf(world, mapX, mapY), ...wallInfo(world, mapX, mapY, dir) },
          crossings, rdx, rdy,
        };
      }
      const from = ceilingOf(world, mapX, mapY);
      if (dir === 'E' || dir === 'W') { mapX += stepX; sideX += deltaX; } else { mapY += stepY; sideY += deltaY; }
      const to = ceilingOf(world, mapX, mapY);
      if (from !== to) crossings.push({ dist, from, to });
    }
    return { hit: null, crossings, rdx, rdy };
  }

  /** Screen y of a point `h` high at distance `d`. */
  const screenY = (horizon, f, h, d) => horizon - (f * (h - EYE)) / d;

  /** Everything per column: the wall (if any) and its span on screen, the
   * lintels above doorways into taller rooms, and `clips`: from each
   * distance on, nothing may be drawn above that screen y (the top of the
   * lowest opening passed through). */
  function castColumns(world, cam, columns, width, height) {
    const f = focalFor(width);
    const horizon = height / 2;
    const out = [];
    for (let c = 0; c < columns; c++) {
      const camX = (2 * (c + 0.5)) / columns - 1;
      const ray = castRay(world, cam, camX);
      const clips = [];
      const lintels = [];
      let clipY = -Infinity;
      let ceilingNow = ceilingOf(world, cam.cellX, cam.cellY);
      for (const k of ray.crossings) {
        const topNear = Math.max(clipY, screenY(horizon, f, k.from, k.dist));
        if (k.to < k.from) {
          // Into a lower space: the wall face above the opening (a lintel).
          const bottom = screenY(horizon, f, k.to, k.dist);
          if (bottom > topNear) lintels.push({ dist: k.dist, top: topNear, bottom });
        }
        clipY = Math.max(clipY, screenY(horizon, f, Math.min(k.from, k.to), k.dist));
        clips.push({ dist: k.dist, y: clipY });
        ceilingNow = k.to;
      }
      let wall = null;
      if (ray.hit) {
        const h = ray.hit;
        wall = { ...h, top: Math.max(clipY, screenY(horizon, f, h.height, h.dist)), bottom: screenY(horizon, f, 0, h.dist) };
      }
      out.push({ camX, rdx: ray.rdx, rdy: ray.rdy, wall, lintels, clips, depth: ray.hit ? ray.hit.dist : Infinity, ceilingNow });
    }
    return { columns: out, f, horizon };
  }

  /** The highest screen y something at distance `d` may reach in a column
   * (beyond a low opening, nothing shows above the opening's top). */
  function clipAt(column, d) {
    let y = -Infinity;
    for (const k of column.clips) if (k.dist < d) y = k.y;
    return y;
  }

  // ─── Sprites ────────────────────────────────────────────────────────────

  /** Where an object (on square ox,oy) appears: its distance along the view,
   * the screen x of its centre, and the screen y of its base on the floor. */
  function projectObject(cam, ox, oy, width, height, exact) {
    const rx = (exact ? ox : ox + 0.5) - cam.x, ry = (exact ? oy : oy + 0.5) - cam.y;
    const depth = rx * cam.dir[0] + ry * cam.dir[1];
    const lateral = rx * cam.right[0] + ry * cam.right[1];
    const f = focalFor(width);
    return { depth, lateral, screenX: width / 2 + (f * lateral) / depth, baseY: height / 2 + (f * EYE) / depth, scale: f / depth };
  }

  /** Which side of a south-facing landmark (a throne) the camera sees:
   * 'front', 'back', or its profile, 'faces-left' / 'faces-right' on screen. */
  function sideSeen(cam, o) {
    const vx = cam.x - (o.x + 0.5), vy = cam.y - (o.y + 0.5);
    if (Math.abs(vy) >= Math.abs(vx)) return vy >= 0 ? 'front' : 'back';
    return vx > 0 ? 'faces-left' : 'faces-right';   // from the east it faces your left
  }

  /** Visible objects, farthest first, with their on-screen boxes. `sizeOf`
   * gives each kind's size in world units ({ w, h }), given the side seen. */
  function placeObjects(world, cam, width, height, sizeOf) {
    const placed = [];
    for (const o of world.objects) {
      const p = o.at ? projectObject(cam, o.at[0], o.at[1], width, height, true) : projectObject(cam, o.x, o.y, width, height);
      if (p.depth < NEAR || p.depth > MAX_DIST) continue;
      const view = o.at ? 'front' : sideSeen(cam, o);
      const size = sizeOf(o, view);
      const w = size.w * p.scale, h = size.h * p.scale;
      const left = p.screenX - w / 2;
      if (left > width || left + w < 0) continue;
      placed.push({ obj: o, view, depth: p.depth, left, top: p.baseY - h, width: w, height: h, baseY: p.baseY, screenX: p.screenX, scale: p.scale });
    }
    return placed.sort((a, b) => b.depth - a.depth);
  }

  /** Runs of screen columns where a sprite is in front of the wall, as
   * [{ from, to, clipTop }] in column indices (inclusive), for a view cast
   * with `cast.columns.length` columns over `width` pixels. */
  function visibleRuns(cast, sprite, width) {
    const n = cast.columns.length;
    const colW = width / n;
    const first = Math.max(0, Math.floor(sprite.left / colW));
    const last = Math.min(n - 1, Math.floor((sprite.left + sprite.width) / colW));
    if (sprite.obj.noClip) return last >= first ? [{ from: first, to: last, clipTop: -Infinity }] : [];   // (the monster you're fighting)
    const runs = [];
    let run = null;
    for (let c = first; c <= last; c++) {
      const col = cast.columns[c];
      const open = col.depth > sprite.depth;
      if (open) {
        const clipTop = clipAt(col, sprite.depth);
        if (run && run.clipTop === clipTop) run.to = c;
        else { run = { from: c, to: c, clipTop }; runs.push(run); }
      } else run = null;
    }
    return runs;
  }

  // ─── Shared bits for drawing ─────────────────────────────────────────────

  /** 1 near, falling to 0 at the edge of the torchlight. */
  const light = (d) => Math.max(0, Math.min(1, 1.12 - d / 8));

  function lerpColor(a, b, t) {
    const pa = a.match(/\w\w/g).map(h => parseInt(h, 16)), pb = b.match(/\w\w/g).map(h => parseInt(h, 16));
    return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(',')})`;
  }

  const prefersReducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** Draws a sprite into `ctx` over its visible column runs only, dimmed by
   * distance, with a soft contact shadow at its base. */
  function drawSprite(ctx, cast, sprite, width, t, art) {
    const runs = visibleRuns(cast, sprite, width);
    if (!runs.length) return;
    const colW = width / cast.columns.length;
    ctx.save();
    ctx.beginPath();
    for (const r of runs) {
      const x0 = r.from * colW, x1 = (r.to + 1) * colW;
      const y0 = Math.max(r.clipTop, -1e4);
      ctx.rect(x0, y0, x1 - x0, ctx.canvas.height - y0);
    }
    ctx.clip();
    // Contact shadow
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.ellipse(sprite.screenX, sprite.baseY, sprite.width * 0.46, Math.max(1.5, sprite.width * 0.08), 0, 0, Math.PI * 2);
    ctx.fill();
    // Drawn on a canvas of its own first, so the darkening for distance (and
    // a hit's flash) touches only the figure, not the walls behind it.
    const dim = 1 - light(sprite.depth);
    const pad = Math.ceil(Math.max(8, sprite.height * 0.06));
    const ow = Math.ceil(sprite.width + pad * 2), oh = Math.ceil(sprite.height + pad * 2);
    if (ow > 0 && oh > 0 && ow * oh < 16e6) {
      const off = spriteScratch(ow, oh);
      const octx = off.getContext('2d');
      octx.clearRect(0, 0, ow, oh);
      octx.save();
      octx.translate(pad - sprite.left, pad - sprite.top);
      art.draw(octx, sprite.left, sprite.top, sprite.width, sprite.height, t, sprite);
      octx.restore();
      if (dim > 0.02) {
        octx.save();
        octx.globalCompositeOperation = 'source-atop';
        octx.fillStyle = `rgba(0,0,0,${Math.min(0.92, dim).toFixed(3)})`;
        octx.fillRect(0, 0, ow, oh);
        octx.restore();
      }
      ctx.drawImage(off, 0, 0, ow, oh, sprite.left - pad, sprite.top - pad, ow, oh);
    }
    ctx.restore();
  }

  /** A reusable offscreen canvas at least this big (for drawing one figure). */
  let scratch = null;
  function spriteScratch(w, h) {
    if (!scratch) scratch = document.createElement('canvas');
    if (scratch.width < w) scratch.width = w;
    if (scratch.height < h) scratch.height = h;
    return scratch;
  }

  // ─── ASCII 3D ───────────────────────────────────────────────────────────

  // The architecture is drawn in the classic view's white, fading to dark; the UI around it stays green.
  const GREEN_NEAR = 'eeeeee', GREEN_FAR = '1a1a1a';

  /** Which flat wall surface a hit lies on (a line of the grid, one side of it). */
  const planeOf = (w) => (w.dir === 'N' || w.dir === 'S' ? `y${w.cellY + (w.dir === 'S' ? 1 : 0)}` : `x${w.cellX + (w.dir === 'E' ? 1 : 0)}`) + w.dir;

  /** Masonry layout per material, in world units: course height, block
   * width, and whether joints run the full height (planks). */
  const MASONRY = {
    stone: { course: 0.34, block: 0.5 },
    brick: { course: 0.2, block: 0.34 },
    wood: { course: 1, block: 0.25, planks: true },
    rough: { course: 0.5, block: 0.7, rough: true },
  };

  /** Renders the ASCII 3D look onto a canvas: architecture drawn as glyph
   * lines (wall edges, mortar courses and joints that follow the
   * perspective, chosen by slope as \ / _ - |), floor seams, and sprites
   * standing among them. */
  function renderAscii(canvas, scene, opts) {
    const ctx = canvas.getContext('2d');
    const { cellW, cellH, font, t = 0, sprites } = opts;
    const width = canvas.width, height = canvas.height;
    const cols = Math.max(20, Math.floor(width / cellW)), rows = Math.max(10, Math.floor(height / cellH));
    const world = buildWorld(scene);
    if (opts.extraObjects) world.objects = [...world.objects, ...opts.extraObjects];
    const cam = opts.camera || cameraFor(scene.x, scene.y, scene.facing);
    const cast = castColumns(world, cam, cols, width, height);
    const { f, horizon } = cast;

    // The glyph grid, with a priority per cell so edges win over texture.
    const ch = Array.from({ length: rows }, () => new Array(cols).fill(' '));
    const col_ = Array.from({ length: rows }, () => new Array(cols).fill(null));
    const pri = Array.from({ length: rows }, () => new Array(cols).fill(0));
    const put = (r, c, g, color, p) => {
      if (r < 0 || r >= rows || c < 0 || c >= cols || p < pri[r][c]) return;
      ch[r][c] = g; col_[r][c] = color; pri[r][c] = p;
    };
    const wallColor = (w, boost = 1) => lerpColor(GREEN_FAR, GREEN_NEAR, Math.min(1, light(w.dist) * boost * (w.dir === 'N' || w.dir === 'S' ? 1 : 0.8)));

    /** Draws a line across column c given its screen y here and in the
     * neighbouring columns of the same surface, choosing the glyph by slope. */
    const lineAt = (c, y, yL, yR, color, p, minY = -Infinity, maxY = Infinity) => {
      if (y < minY || y > maxY) return;
      const slope = ((yR ?? y) - (yL ?? y)) / ((yR !== undefined && yL !== undefined ? 2 : 1) * cellH);
      const rowF = y / cellH, r = Math.floor(rowF), frac = rowF - r;
      if (Math.abs(slope) < 0.3) put(r, c, frac > 0.55 ? '_' : frac < 0.2 ? '¯' : '-', color, p);
      else if (Math.abs(slope) < 1.6) put(r, c, slope > 0 ? '\\' : '/', color, p);
      else {
        // Steep: a run of the slanted glyph down the rows this column spans.
        const span = Math.min(rows, Math.ceil(Math.abs(slope)));
        for (let k = 0; k < span; k++) {
          const rr = r + (slope > 0 ? k : -k) - (slope > 0 ? Math.floor(span / 2) : -Math.floor(span / 2));
          const yy = rr * cellH + cellH / 2;
          if (yy >= minY && yy <= maxY) put(rr, c, slope > 0 ? '\\' : '/', color, p);
        }
      }
    };

    // ── Floor seams (lowest priority) ──
    for (let c = 0; c < cols; c++) {
      const col = cast.columns[c];
      for (let r = Math.floor(horizon / cellH); r < rows; r++) {
        const y = (r + 0.5) * cellH;
        if (y <= horizon) continue;
        const d = (f * EYE) / (y - horizon);
        if (d > col.depth || d > MAX_DIST) continue;
        const fx = cam.x + col.rdx * d, fy = cam.y + col.rdy * d;
        const tol = Math.min(0.22, 0.04 + ((d * cellH) / f) * 0.7);
        if (Math.abs(fx - Math.round(fx)) < tol || Math.abs(fy - Math.round(fy)) < tol) {
          put(r, c, d < 2 ? ':' : '.', lerpColor('000000', 'a8a8a8', light(d) * 0.8), 1);
        }
      }
      // ── Ceiling seams under ordinary ceilings; tall vaults stay dark ──
      for (let r = 0; r < Math.floor(horizon / cellH); r++) {
        const y = (r + 0.5) * cellH;
        const d = (f * (1 - EYE)) / (horizon - y);
        if (d > col.depth || d > MAX_DIST || y < clipAt(col, d)) continue;
        if (col.lintels.some(l => l.dist < d && y >= l.top && y <= l.bottom)) continue;   // behind the wall over a doorway
        const fx = cam.x + col.rdx * d, fy = cam.y + col.rdy * d;
        const cell = cellAt(world, Math.floor(fx), Math.floor(fy));
        if (!cell || cell.ceiling > 0) continue;
        const tol = 0.03 + ((d * cellH) / f) * 0.35;
        if (Math.abs(fx - Math.round(fx)) < tol || Math.abs(fy - Math.round(fy)) < tol) {
          put(r, c, '-', lerpColor('000000', '4a4a4a', light(d) * 0.55), 1);
        }
      }
    }

    // ── Walls ──
    const same = (a, b) => a && b && planeOf(a) === planeOf(b);
    for (let c = 0; c < cols; c++) {
      const col = cast.columns[c], w = col.wall;
      // Lintels over doorways into lower spaces: a band of wall with edges.
      for (const l of col.lintels) {
        const color = lerpColor(GREEN_FAR, GREEN_NEAR, light(l.dist) * 0.9);
        lineAt(c, l.bottom, undefined, undefined, color, 6);
        lineAt(c, l.top + 1, undefined, undefined, color, 5);
      }
      if (!w) continue;
      const L = same(w, cast.columns[c - 1]?.wall) ? cast.columns[c - 1].wall : null;
      const R = same(w, cast.columns[c + 1]?.wall) ? cast.columns[c + 1].wall : null;
      const color = wallColor(w);
      const m = MASONRY[w.material] || MASONRY.stone;
      const yAt = (ww, h) => screenY(horizon, f, h, ww.dist);

      // Corners and wall ends: a full-height upright where this surface stops.
      const edge = [cast.columns[c - 1]?.wall, cast.columns[c + 1]?.wall].some(o => !o || (planeOf(o) !== planeOf(w) && w.dist <= o.dist));
      if (edge) {
        for (let r = Math.floor(w.top / cellH); r <= Math.floor((w.bottom - 1) / cellH); r++) put(r, c, '|', wallColor(w, 1.1), 9);
      }
      // Top and bottom edges of the wall.
      if (w.top > yAt(w, w.height) + 0.5) lineAt(c, w.top, L?.top, R?.top, color, 8);
      else lineAt(c, yAt(w, w.height), L && yAt(L, L.height), R && yAt(R, R.height), color, 8);
      lineAt(c, w.bottom - 1, L && L.bottom - 1, R && R.bottom - 1, color, 8);

      // Mortar courses, following the perspective.
      if (!m.planks && !m.rough) {
        for (let k = 1; k * m.course < w.height - 0.05; k++) {
          const h = k * m.course;
          lineAt(c, yAt(w, h), L && yAt(L, h), R && yAt(R, h), lerpColor(GREEN_FAR, GREEN_NEAR, light(w.dist) * 0.62), 4, w.top, w.bottom - cellH * 0.5);
        }
      }
      // Joints: where a block boundary falls between this column and the
      // next, an upright through that course (staggered every other course).
      if (R && !m.rough) {
        const courses = m.planks ? [[0, w.height]] : Array.from({ length: Math.ceil(w.height / m.course) }, (_, k) => [k * m.course, Math.min(w.height, (k + 1) * m.course)]);
        courses.forEach(([h0, h1], k) => {
          const off = m.planks ? 0 : (k % 2) * m.block / 2;
          if (Math.floor((w.u + off) / m.block) === Math.floor((R.u + off) / m.block) || Math.abs(R.u - w.u) > 0.5) return;
          const yTop = Math.max(w.top, yAt(w, h1)), yBot = Math.min(w.bottom - 1, yAt(w, h0));
          for (let r = Math.ceil(yTop / cellH + 0.3); r <= Math.floor(yBot / cellH - 0.3); r++) {
            put(r, c, '|', lerpColor(GREEN_FAR, GREEN_NEAR, light(w.dist) * 0.55), 3);
          }
        });
      }
      // Rough rock: a scatter of marks.
      if (m.rough) {
        for (let r = Math.ceil(w.top / cellH); r < Math.floor(w.bottom / cellH); r++) {
          const v = (w.height * (w.bottom - (r + 0.5) * cellH)) / (w.bottom - yAt(w, w.height));
          const hsh = Math.abs(Math.sin(Math.floor(w.u * 10) * 12.9898 + Math.floor(v * 8) * 78.233 + w.cellX * 3.1 + w.cellY) * 43758.5453) % 1;
          if (hsh < 0.1) put(r, c, hsh < 0.04 ? '%' : ':', lerpColor(GREEN_FAR, GREEN_NEAR, light(w.dist) * 0.55), 2);
        }
      }
      // A carving at eye level, and a torch with its warm glow.
      const vy = (h) => Math.floor(yAt(w, h) / cellH);
      // Only the one column nearest the wall's middle carries them, however close the wall.
      const mid = Math.abs(w.u - 0.5);
      const middle = mid < 0.25 && (!L || mid <= Math.abs(L.u - 0.5)) && (!R || mid < Math.abs(R.u - 0.5));
      if (w.carved && middle) put(vy(0.55), c, (w.cellX + w.cellY) % 2 ? '§' : '¤', wallColor(w, 1.2), 7);
      if (w.torch && middle) {
        put(vy(0.62), c, 'Y', lerpColor('3a1a00', 'c8873a', light(w.dist)), 10);
        put(vy(0.74), c, '*', lerpColor('3a1a00', 'ffc060', light(w.dist)), 10);
      }
    }

    // Paint the glyphs, then the sprites among them.
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    ctx.font = font;
    ctx.textBaseline = 'top';
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if (ch[r][c] === ' ') continue;
      ctx.fillStyle = col_[r][c];
      ctx.fillText(ch[r][c], c * cellW, r * cellH);
    }
    for (const s of placeObjects(world, cam, width, height, sprites.sizeOf)) {
      drawSprite(ctx, cast, s, width, t, sprites.art(s.obj));
    }
    return { cast, cam, world };
  }

  // ─── Painted ────────────────────────────────────────────────────────────

  const TEXTURES = {};
  function rand(seed) { let s = seed >>> 0; return () => ((s = Math.imul(s ^ (s >>> 15), 2246822519) ^ Math.imul(s ^ (s >>> 13), 3266489917)) >>> 0) / 4294967296; }

  const TEX = 256;   // wall texture size (pixels per square of wall)

  /** Wall textures, made once per material: big staggered stone blocks,
   * brick, planks with grain and nails, rough rock. Each block gets its own
   * shade, a bevel, deep mortar, and now and then a crack or moss. */
  function texture(material) {
    if (TEXTURES[material]) return TEXTURES[material];
    const c = document.createElement('canvas');
    c.width = c.height = TEX;
    const g = c.getContext('2d');
    const r = rand(material.length * 977 + 13);
    const rgb = (v) => `rgb(${v.map(x => Math.max(0, Math.min(255, Math.round(x)))).join(',')})`;
    const speckle = (x0, y0, w, h, base, amt, density = 0.35) => {
      for (let i = 0; i < w * h * density; i++) {
        const x = x0 + r() * w, y = y0 + r() * h, n = (r() - 0.5) * amt;
        g.fillStyle = rgb(base.map(v => v + n));
        g.fillRect(x, y, 1 + (r() < 0.2 ? 1 : 0), 1);
      }
    };
    const block = (x, y, w, h, base, mortar) => {
      g.fillStyle = rgb(base); g.fillRect(x, y, w, h);
      speckle(x, y, w, h, base, 26);
      g.fillStyle = 'rgba(255,255,255,0.10)'; g.fillRect(x, y, w, 3); g.fillRect(x, y, 3, h);          // bevel: lit top/left
      g.fillStyle = 'rgba(0,0,0,0.28)'; g.fillRect(x, y + h - 4, w, 4); g.fillRect(x + w - 4, y, 4, h); // shadowed bottom/right
      if (r() < 0.22) {                                                                                 // a crack
        g.strokeStyle = 'rgba(15,12,10,0.7)'; g.lineWidth = 1.2; g.beginPath();
        let cx = x + r() * w, cy = y + 4; g.moveTo(cx, cy);
        for (let k = 0; k < 5; k++) { cx += (r() - 0.5) * w * 0.25; cy += h / 6; g.lineTo(cx, cy); }
        g.stroke();
      }
      if (r() < 0.12) { g.fillStyle = 'rgba(60,90,40,0.35)'; for (let k = 0; k < 30; k++) g.fillRect(x + r() * w, y + h - 10 + r() * 8, 2, 2); }  // moss
      g.strokeStyle = mortar; g.lineWidth = 4; g.strokeRect(x, y, w, h);
    };
    if (material === 'stone' || material === 'brick') {
      const bw = material === 'stone' ? 128 : 64, bh = material === 'stone' ? 85 : 32;
      const base = material === 'stone' ? [96, 92, 84] : [112, 60, 44];
      const mortar = material === 'stone' ? 'rgb(28,25,22)' : 'rgb(70,66,60)';
      g.fillStyle = mortar; g.fillRect(0, 0, TEX, TEX);
      for (let y = 0, i = 0; y < TEX; y += bh, i++) {
        for (let x = -((i % 2) * bw) / 2; x < TEX; x += bw) {
          const v = (r() - 0.5) * 24, tint = material === 'brick' ? [(r() - 0.5) * 20, (r() - 0.5) * 8, 0] : [0, 0, (r() - 0.5) * 8];
          block(x, y, bw, Math.min(bh, TEX - y), base.map((b, k) => b + v + tint[k]), mortar);
          if (x + bw > TEX) block(x - TEX, y, bw, Math.min(bh, TEX - y), base.map(b => b + v), mortar);   // wrap seamlessly
        }
      }
    } else if (material === 'wood') {
      for (let x = 0; x < TEX; x += 64) {
        const base = [96 + (r() - 0.5) * 20, 66 + (r() - 0.5) * 12, 40];
        g.fillStyle = rgb(base); g.fillRect(x, 0, 64, TEX);
        for (let i = 0; i < 40; i++) {                                        // grain
          const gx = x + r() * 64, wob = 2 + r() * 3;
          g.strokeStyle = `rgba(40,24,10,${0.15 + r() * 0.3})`; g.lineWidth = 1; g.beginPath(); g.moveTo(gx, 0);
          for (let yy = 0; yy <= TEX; yy += 16) g.lineTo(gx + Math.sin(yy / 30 + i) * wob, yy);
          g.stroke();
        }
        if (r() < 0.7) { const kx = x + 12 + r() * 40, ky = r() * TEX; g.fillStyle = 'rgba(40,22,8,0.75)'; g.beginPath(); g.ellipse(kx, ky, 4, 8, 0, 0, Math.PI * 2); g.fill(); }  // a knot
        g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(x, 0, 3, TEX);             // the gap between planks
        g.fillStyle = 'rgba(255,240,210,0.07)'; g.fillRect(x + 3, 0, 3, TEX);
        g.fillStyle = 'rgb(40,38,36)';                                       // nails
        for (const ny of [20, TEX / 2 + 10, TEX - 24]) { g.fillRect(x + 12, ny, 4, 4); g.fillRect(x + 48, ny, 4, 4); }
      }
    } else {
      g.fillStyle = 'rgb(74,70,64)'; g.fillRect(0, 0, TEX, TEX);
      for (let i = 0; i < 26; i++) {                                         // irregular stones
        const cx = r() * TEX, cy = r() * TEX, rad = 18 + r() * 34, v = (r() - 0.5) * 30;
        g.fillStyle = rgb([80 + v, 76 + v, 68 + v]);
        g.beginPath();
        for (let k = 0; k < 7; k++) { const a = (k / 7) * Math.PI * 2, rr = rad * (0.7 + r() * 0.4); g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
        g.closePath(); g.fill();
        g.strokeStyle = 'rgba(20,18,15,0.6)'; g.lineWidth = 2; g.stroke();
      }
      speckle(0, 0, TEX, TEX, [76, 72, 66], 30, 0.25);
    }
    return (TEXTURES[material] = c);
  }

  /** Renders the Painted look: textured walls, flagstone floor, dark vaults. */
  function renderPainted(canvas, scene, opts) {
    const ctx = canvas.getContext('2d');
    const { t = 0, sprites } = opts;
    const width = canvas.width, height = canvas.height;
    const world = buildWorld(scene);
    if (opts.extraObjects) world.objects = [...world.objects, ...opts.extraObjects];
    const cam = opts.camera || cameraFor(scene.x, scene.y, scene.facing);
    const cols = width;                          // one ray per pixel column: full sharpness
    const cast = castColumns(world, cam, cols, width, height);
    const { f, horizon } = cast;
    const colW = width / cols;

    // Floor and ceiling, cast per pixel.
    const img = ctx.createImageData(cols, height);
    const data = img.data;
    for (let py = 0; py < img.height; py++) {
      const y = py + 0.5;
      for (let c = 0; c < cols; c++) {
        const col = cast.columns[c];
        let rgb = [0, 0, 0];
        if (y > horizon) {
          const d = (f * EYE) / (y - horizon);
          if (d < col.depth && d < MAX_DIST) {
            const fx = cam.x + col.rdx * d, fy = cam.y + col.rdy * d;
            // Flagstones half a square across, every other row staggered.
            const iy = Math.floor(fy * 2), vy = fy * 2 - iy;
            const sx = fx * 2 + (iy & 1) * 0.5, ix = Math.floor(sx), vx = sx - ix;
            const seamW = Math.min(0.06, 0.025 + d * 0.003);
            const seam = vx < seamW || vy < seamW;
            const l = light(d);
            const stone = (((ix * 73856093) ^ (iy * 19349663)) >>> 0) % 16;
            const grain = (((Math.floor(fx * 48) * 83492791) ^ (Math.floor(fy * 48) * 2654435761)) >>> 0) % 9 - 4;
            const bevel = !seam && (vx < seamW + 0.05 || vy < seamW + 0.05) ? 7 : !seam && (vx > 0.94 || vy > 0.94) ? -6 : 0;
            const base = seam ? 20 : 50 + stone + grain + bevel;
            rgb = [base * l * 0.97, base * l * 0.92, base * l * 0.84];
          }
        } else {
          const d = (f * (1 - EYE)) / (horizon - y);
          if (d < col.depth && d < MAX_DIST) {
            const fx = cam.x + col.rdx * d, fy = cam.y + col.rdy * d;
            const cell = cellAt(world, Math.floor(fx), Math.floor(fy));
            if (cell && cell.ceiling === 0) {
              const l = light(d) * 0.7;
              const beam = Math.abs(fx - Math.round(fx)) < 0.04 || Math.abs(fy - Math.round(fy)) < 0.04;
              const base = beam ? 22 : 40;
              rgb = [base * l, base * l * 0.94, base * l * 0.88];
            }
          }
        }
        const i = (py * cols + c) * 4;
        data[i] = rgb[0]; data[i + 1] = rgb[1]; data[i + 2] = rgb[2]; data[i + 3] = 255;
      }
    }
    const tmp = document.createElement('canvas');
    tmp.width = img.width; tmp.height = img.height;
    tmp.getContext('2d').putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(tmp, 0, 0, width, height);

    // Walls and lintels
    for (let c = 0; c < cols; c++) {
      const col = cast.columns[c];
      const x = c * colW;
      for (const l of col.lintels) {
        ctx.drawImage(texture('stone'), TEX / 2, 0, 1, TEX, x, l.top, colW + 0.5, l.bottom - l.top);
        ctx.fillStyle = `rgba(0,0,0,${(1 - light(l.dist) * 0.85).toFixed(3)})`;
        ctx.fillRect(x, l.top, colW + 0.5, l.bottom - l.top);
      }
      const w = col.wall;
      if (!w) continue;
      const fullTop = screenY(horizon, f, w.height, w.dist);
      const tx = Math.min(TEX - 1, Math.floor(w.u * TEX));
      const reps = w.height;                         // the texture repeats once per unit of height
      const srcTop = TEX * reps * ((w.top - fullTop) / (w.bottom - fullTop));
      // Draw the visible part, tiling the texture vertically.
      let y = w.top, sy = srcTop;
      const pxPerTex = (w.bottom - fullTop) / reps / TEX;
      while (y < w.bottom - 0.01) {
        const inTile = sy % TEX;
        const take = Math.min(TEX - inTile, (w.bottom - y) / pxPerTex);
        ctx.drawImage(texture(w.material), tx, inTile, 1, take, x, y, colW + 0.5, take * pxPerTex);
        y += take * pxPerTex; sy += take;
      }
      const side = w.dir === 'N' || w.dir === 'S' ? 0 : 0.18;
      ctx.fillStyle = `rgba(0,0,0,${Math.min(0.97, 1 - light(w.dist) + side).toFixed(3)})`;
      ctx.fillRect(x, w.top, colW + 0.5, w.bottom - w.top);
    }
    // Carvings: an etched rune at eye level, drawn once per wall at its middle.
    const carvedDone = new Set();
    for (let c = 0; c < cols; c++) {
      const w = cast.columns[c].wall;
      if (!w || !w.carved || Math.abs(w.u - 0.5) > 0.03) continue;
      const key = `${w.cellX},${w.cellY},${w.dir}`;
      if (carvedDone.has(key)) continue;
      carvedDone.add(key);
      const x = (c + 0.5) * colW, y = screenY(horizon, f, 0.55, w.dist), s = f / w.dist, a = light(w.dist);
      ctx.save();
      ctx.lineWidth = Math.max(1, s * 0.012);
      ctx.strokeStyle = `rgba(10,8,6,${(0.75 * a).toFixed(3)})`;          // the cut
      ctx.beginPath(); ctx.arc(x, y + s * 0.006, s * 0.075, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = `rgba(205,185,120,${(0.45 * a).toFixed(3)})`;     // a little old gilding
      ctx.beginPath(); ctx.arc(x, y, s * 0.075, 0, Math.PI * 2);
      ctx.moveTo(x, y - s * 0.05); ctx.lineTo(x + s * 0.045, y + s * 0.035); ctx.lineTo(x - s * 0.045, y + s * 0.035); ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }
    // Torches: a bracket, a flame, and a warm glow on the wall around it.
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const seen = new Set();
    for (let c = 0; c < cols; c++) {
      const w = cast.columns[c].wall;
      if (!w || !w.torch || Math.abs(w.u - 0.5) > 0.03) continue;
      const key = `${w.cellX},${w.cellY},${w.dir}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const x = (c + 0.5) * colW, y = screenY(horizon, f, 0.68, w.dist), s = f / w.dist;
      const flick = prefersReducedMotion() ? 1 : 0.9 + 0.1 * Math.sin(t * 9 + w.cellX);
      const glow = ctx.createRadialGradient(x, y, 0, x, y, s * 0.6);
      glow.addColorStop(0, `rgba(255,160,60,${(0.45 * light(w.dist) * flick).toFixed(3)})`);
      glow.addColorStop(1, 'rgba(255,120,30,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(x - s * 0.6, y - s * 0.6, s * 1.2, s * 1.2);
      ctx.fillStyle = `rgba(255,${200 + 40 * flick | 0},120,${light(w.dist).toFixed(3)})`;
      ctx.beginPath(); ctx.ellipse(x, y - s * 0.02, s * 0.025, s * 0.05 * flick, 0, 0, Math.PI * 2); ctx.fill();
      ctx.save(); ctx.globalCompositeOperation = 'source-over';            // the iron bracket
      ctx.fillStyle = `rgba(30,26,22,${light(w.dist).toFixed(3)})`;
      ctx.fillRect(x - s * 0.012, y + s * 0.03, s * 0.024, s * 0.09);
      ctx.fillRect(x - s * 0.03, y + s * 0.025, s * 0.06, s * 0.018);
      ctx.restore();
    }
    ctx.restore();
    for (const s of placeObjects(world, cam, width, height, sprites.sizeOf)) {
      drawSprite(ctx, cast, s, width, t, sprites.art(s.obj));
    }
    return { cast, cam, world };
  }

  const api = {
    buildWorld, wallBetween, cameraFor, cameraAt, FACING_ANGLE, castRay, castColumns, clipAt, projectObject, placeObjects, visibleRuns, focalFor, sideSeen,
    renderAscii, renderPainted, prefersReducedMotion,
    FOV, EYE, MAX_DIST, NEAR, CEILING_HEIGHTS,
  };
  root.View3D = api;
})(typeof window !== 'undefined' ? window : globalThis);
