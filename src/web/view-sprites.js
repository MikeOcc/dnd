// THE SEVEN LEVELS — landmark sprites for the 3D views (view3d.js).
//
// Each landmark has a size in world units (a square is 1×1, walls are 1
// high) and artwork drawn into the box the renderer projects for it,
// anchored bottom-centre on its square's floor. The built-in artwork is
// transparent SVG; a few have a restrained animation layered on top (water,
// candle flames), which stops when the player prefers reduced motion.
//
// To replace a sprite with a painted PNG: put the file in src/web/sprites/
// (transparent background, the bottom edge where it meets the floor, the
// same proportions as its size below) and list it in SPRITE_FILES, e.g.
//   fountain: 'sprites/fountain.png'
// The animation overlay still plays on top unless you set `animate: false`.

(function (root) {
  'use strict';

  const SPRITE_FILES = {
    // fountain: 'sprites/fountain.png',
  };

  /** Size of each landmark in world units: { w, h }. */
  const SIZES = {
    fountain: { w: 0.95, h: 0.9 },
    well: { w: 0.8, h: 0.95 },
    altar: { w: 0.95, h: 0.72 },
    chest: { w: 0.6, h: 0.42 },
    book: { w: 0.42, h: 0.68 },
    'ladder-up': { w: 0.46, h: 1.0 },
    'ladder-down': { w: 0.72, h: 0.24 },
    throne: { w: 1.25, h: 1.6 },
    'throne-back': { w: 1.2, h: 1.6 },
    'throne-side': { w: 0.95, h: 1.6 },
    'throne-orc': { w: 1.15, h: 1.35 },
    pillar: { w: 0.42, h: 1.0 },
    shop: { w: 1.0, h: 1.0 },
  };

  // ─── Built-in artwork (viewBox matches each landmark's proportions) ─────

  const SVG = {
    fountain: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 190 180">
      <defs>
        <linearGradient id="st" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#9a958a"/><stop offset="1" stop-color="#5a564e"/></linearGradient>
        <linearGradient id="wa" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#7fc8c8"/><stop offset="1" stop-color="#2f6f78"/></linearGradient>
      </defs>
      <ellipse cx="95" cy="150" rx="88" ry="22" fill="url(#st)" stroke="#2b2924" stroke-width="2"/>
      <rect x="7" y="128" width="176" height="24" fill="url(#st)" stroke="#2b2924" stroke-width="2"/>
      <ellipse cx="95" cy="128" rx="88" ry="20" fill="#6f6a60" stroke="#2b2924" stroke-width="2"/>
      <ellipse cx="95" cy="129" rx="78" ry="15" fill="url(#wa)" opacity="0.9"/>
      <path d="M86 128 L88 74 L102 74 L104 128 Z" fill="url(#st)" stroke="#2b2924" stroke-width="2"/>
      <ellipse cx="95" cy="74" rx="40" ry="10" fill="#7a756a" stroke="#2b2924" stroke-width="2"/>
      <path d="M55 74 Q95 98 135 74" fill="url(#st)" stroke="#2b2924" stroke-width="2"/>
      <ellipse cx="95" cy="74" rx="33" ry="6" fill="url(#wa)" opacity="0.9"/>
      <path d="M91 74 L92 40 L98 40 L99 74 Z" fill="url(#st)" stroke="#2b2924" stroke-width="1.5"/>
      <circle cx="95" cy="36" r="7" fill="#8d887d" stroke="#2b2924" stroke-width="1.5"/>
      <g stroke="#2b2924" stroke-width="1" opacity="0.5"><path d="M20 138 v12 M45 140 v12 M70 141 v12 M120 141 v12 M145 140 v12 M170 138 v12"/></g>
    </svg>`,
    well: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 190">
      <defs><linearGradient id="st" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#928c80"/><stop offset="1" stop-color="#4f4b44"/></linearGradient></defs>
      <rect x="22" y="20" width="8" height="122" fill="#5a3f26" stroke="#24180c" stroke-width="2"/>
      <rect x="130" y="20" width="8" height="122" fill="#5a3f26" stroke="#24180c" stroke-width="2"/>
      <path d="M8 26 L80 4 L152 26 Z" fill="#6b4a2c" stroke="#24180c" stroke-width="2"/>
      <rect x="26" y="40" width="108" height="6" fill="#4a3320" stroke="#24180c" stroke-width="1.5"/>
      <line x1="80" y1="46" x2="80" y2="96" stroke="#c9b38a" stroke-width="2"/>
      <path d="M71 96 h18 l-3 16 h-12 Z" fill="#6b4a2c" stroke="#24180c" stroke-width="1.5"/>
      <ellipse cx="80" cy="168" rx="74" ry="20" fill="url(#st)" stroke="#2b2924" stroke-width="2"/>
      <rect x="6" y="128" width="148" height="40" fill="url(#st)" stroke="#2b2924" stroke-width="2"/>
      <ellipse cx="80" cy="128" rx="74" ry="18" fill="#6a655b" stroke="#2b2924" stroke-width="2"/>
      <ellipse cx="80" cy="129" rx="62" ry="12" fill="#0e1414"/>
      <g stroke="#2b2924" stroke-width="1.2" opacity="0.6"><path d="M6 148 H154 M30 128 v20 M64 132 v16 M98 132 v16 M130 128 v20 M46 148 v20 M80 150 v20 M114 148 v20"/></g>
    </svg>`,
    altar: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 190 144">
      <defs><linearGradient id="st" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#8f8a80"/><stop offset="1" stop-color="#4a463f"/></linearGradient></defs>
      <rect x="4" y="128" width="182" height="16" fill="#3e3a34" stroke="#22201c" stroke-width="2"/>
      <rect x="16" y="56" width="158" height="74" fill="url(#st)" stroke="#22201c" stroke-width="2"/>
      <rect x="8" y="44" width="174" height="14" fill="#7d786d" stroke="#22201c" stroke-width="2"/>
      <path d="M70 44 h50 v62 l-25 -10 l-25 10 Z" fill="#6b1d1d" stroke="#2a0b0b" stroke-width="1.5"/>
      <path d="M95 66 l9 14 h-18 Z" fill="none" stroke="#c9a54a" stroke-width="2"/>
      <circle cx="95" cy="78" r="13" fill="none" stroke="#c9a54a" stroke-width="1.5" opacity="0.8"/>
      <g stroke="#22201c" stroke-width="1" opacity="0.55"><path d="M16 86 H70 M120 86 H174 M40 56 v74 M150 56 v74"/></g>
      <rect x="26" y="18" width="9" height="26" fill="#e8dfc8" stroke="#6b604a" stroke-width="1"/>
      <rect x="155" y="18" width="9" height="26" fill="#e8dfc8" stroke="#6b604a" stroke-width="1"/>
      <line x1="30.5" y1="18" x2="30.5" y2="13" stroke="#222" stroke-width="1.2"/>
      <line x1="159.5" y1="18" x2="159.5" y2="13" stroke="#222" stroke-width="1.2"/>
    </svg>`,
    chest: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 105">
      <path d="M6 40 Q75 -6 144 40 Z" fill="#6b4524" stroke="#24150a" stroke-width="2"/>
      <rect x="6" y="40" width="138" height="62" fill="#7a4f2a" stroke="#24150a" stroke-width="2"/>
      <g fill="#5d5d63" stroke="#26262a" stroke-width="1.5">
        <rect x="24" y="40" width="10" height="62"/><rect x="116" y="40" width="10" height="62"/>
        <path d="M24 40 Q29 18 34 17 L34 40 Z"/><path d="M116 17 Q121 18 126 40 L116 40 Z"/>
      </g>
      <rect x="64" y="38" width="22" height="26" rx="3" fill="#b8963c" stroke="#4a3a12" stroke-width="1.5"/>
      <circle cx="75" cy="50" r="3.2" fill="#2a2008"/><rect x="73.8" y="51" width="2.4" height="7" fill="#2a2008"/>
      <g stroke="#3d2610" stroke-width="1" opacity="0.6"><path d="M6 62 H24 M34 62 H116 M126 62 H144 M6 82 H24 M34 82 H116 M126 82 H144"/></g>
    </svg>`,
    book: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 162">
      <path d="M44 60 L56 60 L60 150 L40 150 Z" fill="#5a3f26" stroke="#24180c" stroke-width="2"/>
      <rect x="24" y="148" width="52" height="12" fill="#4a3320" stroke="#24180c" stroke-width="2"/>
      <path d="M8 58 L92 58 L84 38 L16 38 Z" fill="#6b4a2c" stroke="#24180c" stroke-width="2"/>
      <path d="M18 40 Q34 30 50 38 Q66 30 82 40 L78 52 Q64 44 50 50 Q36 44 22 52 Z" fill="#e8dcc0" stroke="#7a6a48" stroke-width="1.2"/>
      <path d="M50 38 V50" stroke="#7a6a48" stroke-width="1.2"/>
      <g stroke="#8c7a55" stroke-width="0.8" opacity="0.8"><path d="M26 42 L44 40 M27 45 L44 43 M56 40 L74 42 M56 43 L73 45"/></g>
      <path d="M48 50 L48 64" stroke="#8a1c1c" stroke-width="2"/>
    </svg>`,
    'ladder-up': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 92 200">
      <rect x="10" y="0" width="9" height="200" fill="#6b4a2c" stroke="#24180c" stroke-width="2"/>
      <rect x="73" y="0" width="9" height="200" fill="#6b4a2c" stroke="#24180c" stroke-width="2"/>
      <g fill="#7a5532" stroke="#24180c" stroke-width="1.5">
        <rect x="19" y="18" width="54" height="7"/><rect x="19" y="52" width="54" height="7"/><rect x="19" y="86" width="54" height="7"/>
        <rect x="19" y="120" width="54" height="7"/><rect x="19" y="154" width="54" height="7"/><rect x="19" y="186" width="54" height="7"/>
      </g>
    </svg>`,
    'ladder-down': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 50">
      <ellipse cx="75" cy="34" rx="72" ry="15" fill="#3a3630" stroke="#1c1a17" stroke-width="2"/>
      <ellipse cx="75" cy="34" rx="60" ry="11" fill="#030303"/>
      <rect x="52" y="4" width="7" height="34" fill="#6b4a2c" stroke="#24180c" stroke-width="1.5"/>
      <rect x="91" y="4" width="7" height="34" fill="#6b4a2c" stroke="#24180c" stroke-width="1.5"/>
      <rect x="59" y="12" width="32" height="5" fill="#7a5532" stroke="#24180c" stroke-width="1"/>
      <rect x="59" y="26" width="32" height="5" fill="#7a5532" stroke="#24180c" stroke-width="1"/>
    </svg>`,
    throne: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 320">
      <defs><radialGradient id="gl" cx="0.5" cy="0.55" r="0.6"><stop offset="0" stop-color="#ff3a10" stop-opacity="0.35"/><stop offset="1" stop-color="#ff3a10" stop-opacity="0"/></radialGradient></defs>
      <ellipse cx="125" cy="170" rx="125" ry="150" fill="url(#gl)"/>
      <path d="M20 312 H230 V292 H20 Z" fill="#1d1a1a" stroke="#000" stroke-width="2"/>
      <g fill="#e8e0d0" stroke="#3a3530" stroke-width="1.5"><circle cx="45" cy="302" r="8"/><circle cx="85" cy="302" r="8"/><circle cx="125" cy="302" r="8"/><circle cx="165" cy="302" r="8"/><circle cx="205" cy="302" r="8"/></g>
      <path d="M58 292 V150 Q58 60 90 34 L104 70 L125 18 L146 70 L160 34 Q192 60 192 150 V292 Z" fill="#171414" stroke="#000" stroke-width="3"/>
      <path d="M90 34 Q70 10 52 6 Q76 24 78 52 Z M160 34 Q180 10 198 6 Q174 24 172 52 Z" fill="#2a2222" stroke="#000" stroke-width="2"/>
      <path d="M84 120 Q125 96 166 120 V230 H84 Z" fill="#3d0b08" stroke="#000" stroke-width="2"/>
      <rect x="40" y="200" width="44" height="22" fill="#221d1d" stroke="#000" stroke-width="2"/>
      <rect x="166" y="200" width="44" height="22" fill="#221d1d" stroke="#000" stroke-width="2"/>
      <path d="M40 222 l-8 14 M50 222 l-4 14 M60 222 l0 14 M210 222 l8 14 M200 222 l4 14 M190 222 l0 14" stroke="#3a3030" stroke-width="3"/>
      <rect x="78" y="228" width="94" height="20" fill="#262020" stroke="#000" stroke-width="2"/>
      <circle cx="125" cy="88" r="9" fill="#a8140a"/>
    </svg>`,
    'throne-back': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 320">
      <defs><radialGradient id="gl" cx="0.5" cy="0.6" r="0.6"><stop offset="0" stop-color="#ff3a10" stop-opacity="0.25"/><stop offset="1" stop-color="#ff3a10" stop-opacity="0"/></radialGradient></defs>
      <ellipse cx="120" cy="180" rx="120" ry="140" fill="url(#gl)"/>
      <path d="M16 312 H224 V292 H16 Z" fill="#1d1a1a" stroke="#000" stroke-width="2"/>
      <path d="M52 292 V150 Q52 60 86 34 L100 70 L120 18 L140 70 L154 34 Q188 60 188 150 V292 Z" fill="#141111" stroke="#000" stroke-width="3"/>
      <path d="M86 34 Q66 10 48 6 Q72 24 74 52 Z M154 34 Q174 10 192 6 Q168 24 166 52 Z" fill="#241e1e" stroke="#000" stroke-width="2"/>
      <g stroke="#2e2626" stroke-width="3" fill="none"><path d="M72 110 V280 M120 80 V280 M168 110 V280"/><path d="M60 170 H180 M60 230 H180"/></g>
      <g fill="#3a3030"><circle cx="72" cy="170" r="5"/><circle cx="120" cy="170" r="5"/><circle cx="168" cy="170" r="5"/><circle cx="72" cy="230" r="5"/><circle cx="120" cy="230" r="5"/><circle cx="168" cy="230" r="5"/></g>
    </svg>`,
    'throne-side': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 190 320">
      <defs><radialGradient id="gl" cx="0.5" cy="0.6" r="0.6"><stop offset="0" stop-color="#ff3a10" stop-opacity="0.28"/><stop offset="1" stop-color="#ff3a10" stop-opacity="0"/></radialGradient></defs>
      <ellipse cx="95" cy="180" rx="95" ry="140" fill="url(#gl)"/>
      <path d="M8 312 H182 V292 H8 Z" fill="#1d1a1a" stroke="#000" stroke-width="2"/>
      <path d="M20 292 V40 Q24 18 34 8 L44 30 L52 292 Z" fill="#171414" stroke="#000" stroke-width="3"/>
      <path d="M34 8 Q20 -2 6 2 Q24 12 26 30 Z" fill="#2a2222" stroke="#000" stroke-width="2"/>
      <path d="M52 236 H172 V256 H52 Z" fill="#262020" stroke="#000" stroke-width="2"/>
      <path d="M44 188 H160 Q172 188 172 198 V206 H44 Z" fill="#221d1d" stroke="#000" stroke-width="2"/>
      <path d="M160 206 l10 16 M150 206 l4 16" stroke="#3a3030" stroke-width="3"/>
      <path d="M52 256 V292 M164 256 V292" stroke="#1d1818" stroke-width="10"/>
      <path d="M44 120 Q60 112 70 130 V236 H52 Z" fill="#3d0b08" stroke="#000" stroke-width="2"/>
    </svg>`,
    'throne-orc': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 230 270">
      <path d="M14 262 H216 V242 H14 Z" fill="#3a3027" stroke="#1a140e" stroke-width="2"/>
      <path d="M54 242 V96 L78 60 L115 40 L152 60 L176 96 V242 Z" fill="#4e3a26" stroke="#1a140e" stroke-width="3"/>
      <g stroke="#1a140e" stroke-width="2">
        <circle cx="70" cy="110" r="26" fill="#6d5a3a"/><circle cx="160" cy="110" r="26" fill="#5f6a3a"/>
        <circle cx="115" cy="78" r="28" fill="#7a3a2a"/><circle cx="70" cy="110" r="6" fill="#b0a070"/><circle cx="160" cy="110" r="6" fill="#b0a070"/><circle cx="115" cy="78" r="7" fill="#b0a070"/>
      </g>
      <rect x="80" y="150" width="70" height="70" fill="#3a2a1c" stroke="#1a140e" stroke-width="2"/>
      <rect x="36" y="176" width="44" height="20" fill="#5a4a32" stroke="#1a140e" stroke-width="2"/>
      <rect x="150" y="176" width="44" height="20" fill="#5a4a32" stroke="#1a140e" stroke-width="2"/>
      <rect x="74" y="218" width="82" height="24" fill="#4a3a28" stroke="#1a140e" stroke-width="2"/>
    </svg>`,
    shop: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <rect x="18" y="40" width="7" height="160" fill="#4a3320" stroke="#1d130a" stroke-width="2"/>
      <rect x="175" y="40" width="7" height="160" fill="#4a3320" stroke="#1d130a" stroke-width="2"/>
      <path d="M6 44 L194 44 L182 18 L18 18 Z" fill="#6b1f1f" stroke="#2a0b0b" stroke-width="2"/>
      <g fill="#c9b38a" opacity="0.85"><path d="M38 18 L32 44 H50 L54 18 Z"/><path d="M78 18 L74 44 H92 L94 18 Z"/><path d="M118 18 L116 44 H134 L134 18 Z"/><path d="M158 18 L158 44 H176 L172 18 Z"/></g>
      <path d="M6 44 Q28 56 50 44 Q72 56 94 44 Q116 56 138 44 Q160 56 194 44" fill="#6b1f1f" stroke="#2a0b0b" stroke-width="1.5"/>
      <line x1="100" y1="44" x2="100" y2="64" stroke="#2a2a2a" stroke-width="2"/>
      <rect x="92" y="64" width="16" height="20" rx="3" fill="#ffcf6a" stroke="#4a3a12" stroke-width="2" opacity="0.95"/>
      <rect x="10" y="120" width="180" height="80" fill="#6b4a2c" stroke="#24180c" stroke-width="2"/>
      <rect x="6" y="110" width="188" height="14" fill="#7a5532" stroke="#24180c" stroke-width="2"/>
      <g stroke="#3d2610" stroke-width="1" opacity="0.6"><path d="M10 150 H190 M10 176 H190 M55 124 V200 M100 124 V200 M145 124 V200"/></g>
      <g stroke="#24180c" stroke-width="1.5"><rect x="28" y="88" width="22" height="22" fill="#8a2a2a"/><rect x="56" y="94" width="18" height="16" fill="#2a5a8a"/><path d="M126 110 L132 80 L140 80 L146 110 Z" fill="#9a8a5a"/><path d="M152 110 L156 86 L168 86 L172 110 Z" fill="#7a6a3a"/></g>
      <ellipse cx="100" cy="104" rx="14" ry="6" fill="#d8b040" stroke="#5a4210" stroke-width="1.5"/>
      <text x="100" y="140" text-anchor="middle" font-family="Georgia, serif" font-size="16" fill="#e8d8a8">TRADE</text>
    </svg>`,
    pillar: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 84 200">
      <defs><linearGradient id="pl" x1="0" x2="1"><stop offset="0" stop-color="#4c4842"/><stop offset="0.45" stop-color="#9c978c"/><stop offset="1" stop-color="#3a3732"/></linearGradient></defs>
      <rect x="2" y="182" width="80" height="18" fill="#5f5b53" stroke="#26241f" stroke-width="2"/>
      <rect x="10" y="172" width="64" height="12" fill="#6e695f" stroke="#26241f" stroke-width="2"/>
      <rect x="16" y="18" width="52" height="156" fill="url(#pl)" stroke="#26241f" stroke-width="2"/>
      <g stroke="#26241f" stroke-width="1" opacity="0.45"><path d="M28 20 V172 M42 20 V172 M56 20 V172"/></g>
      <rect x="8" y="8" width="68" height="12" fill="#6e695f" stroke="#26241f" stroke-width="2"/>
      <rect x="2" y="0" width="80" height="9" fill="#5f5b53" stroke="#26241f" stroke-width="2"/>
    </svg>`,
  };

  // ─── Loading ────────────────────────────────────────────────────────────

  const images = {};
  let onReady = () => {};

  function load(kind) {
    if (images[kind]) return images[kind];
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => onReady();
    const builtIn = () => { img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(SVG[kind] || SVG.chest); };
    if (SPRITE_FILES[kind]) { img.onerror = builtIn; img.src = SPRITE_FILES[kind]; } else builtIn();
    return (images[kind] = img);
  }

  /** Which artwork a landmark uses, given the side seen (Asmodeus's throne
   * has a back and a profile; it faces south, like the classic view's). */
  const kindOf = (obj, view = 'front') => {
    if (obj.kind !== 'throne') return obj.kind;
    if (obj.variant === 'Orc King') return 'throne-orc';
    return view === 'back' ? 'throne-back' : view === 'faces-left' || view === 'faces-right' ? 'throne-side' : 'throne';
  };

  // ─── Animation overlays (restrained; none when motion is reduced) ───────

  const still = () => root.View3D && root.View3D.prefersReducedMotion();

  const ANIMATE = {
    fountain(ctx, x, y, w, h, t) {
      // A thin falling stream from the top bowl and a slow shimmer on the pool.
      ctx.strokeStyle = 'rgba(170,230,235,0.55)';
      ctx.lineWidth = Math.max(1, w * 0.012);
      for (let i = -1; i <= 1; i += 2) {
        ctx.beginPath();
        ctx.moveTo(x + w * (0.5 + i * 0.17), y + h * 0.42);
        ctx.quadraticCurveTo(x + w * (0.5 + i * 0.3), y + h * 0.5, x + w * (0.5 + i * 0.33), y + h * 0.7);
        ctx.stroke();
      }
      const phase = (t * 0.6) % 1;
      ctx.strokeStyle = `rgba(200,245,245,${(0.35 * (1 - phase)).toFixed(3)})`;
      ctx.beginPath();
      ctx.ellipse(x + w * 0.5, y + h * 0.717, w * (0.15 + 0.25 * phase), h * (0.03 + 0.04 * phase), 0, 0, Math.PI * 2);
      ctx.stroke();
    },
    well(ctx, x, y, w, h, t) {
      const phase = (t * 0.35) % 1;
      ctx.strokeStyle = `rgba(150,200,200,${(0.3 * (1 - phase)).toFixed(3)})`;
      ctx.lineWidth = Math.max(1, w * 0.01);
      ctx.beginPath();
      ctx.ellipse(x + w * 0.5, y + h * 0.68, w * 0.36 * phase, h * 0.06 * phase, 0, 0, Math.PI * 2);
      ctx.stroke();
    },
    altar(ctx, x, y, w, h, t) {
      for (const [cx, k] of [[0.161, 0], [0.839, 1.7]]) {
        const flick = 0.85 + 0.15 * Math.sin(t * 7 + k) * Math.sin(t * 3.1 + k);
        const fx = x + w * cx, fy = y + h * 0.08;
        const g = ctx.createRadialGradient(fx, fy, 0, fx, fy, w * 0.09);
        g.addColorStop(0, `rgba(255,190,90,${(0.5 * flick).toFixed(3)})`);
        g.addColorStop(1, 'rgba(255,140,40,0)');
        ctx.fillStyle = g;
        ctx.fillRect(fx - w * 0.09, fy - w * 0.09, w * 0.18, w * 0.18);
        ctx.fillStyle = 'rgba(255,214,140,0.95)';
        ctx.beginPath();
        ctx.ellipse(fx, fy, w * 0.012, h * 0.045 * flick, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    throne(ctx, x, y, w, h, t) {
      const glow = 0.25 + 0.08 * Math.sin(t * 1.3);
      const g = ctx.createRadialGradient(x + w / 2, y + h * 0.98, 0, x + w / 2, y + h * 0.98, w * 0.6);
      g.addColorStop(0, `rgba(255,70,20,${glow.toFixed(3)})`);
      g.addColorStop(1, 'rgba(255,40,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - w * 0.1, y + h * 0.6, w * 1.2, h * 0.45);
    },
  };

  // ─── Monsters standing in the scene (the portrait art, as a figure) ─────

  const monsterImages = {};
  /** A monster's portrait as an image; `hide` lists parts to leave out
   * (the Hollow Choir's shattered masks, by name). */
  function monsterImage(type, hide = [], monster = null) {
    let svg = monster && typeof getMonsterPortrait === 'function' ? getMonsterPortrait(monster, false)
      : typeof getMonsterSprite === 'function' ? getMonsterSprite(type) : '';
    const look = svg ? svg.length : 0;   // (a monster whose look changes as it's hurt gets a new image)
    const key = `${type}|${hide.join(',')}|${typeof monsterArtStyle === 'string' ? monsterArtStyle : ''}|${look}`;
    if (monsterImages[key]) return monsterImages[key];
    if (svg && hide.length && typeof DOMParser === 'function') {
      const doc = new DOMParser().parseFromString(svg.includes('xmlns=') ? svg : svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"'), 'image/svg+xml');
      for (const part of hide) doc.querySelectorAll(`.m-${part}`).forEach(el => el.remove());
      svg = new XMLSerializer().serializeToString(doc.documentElement);
    }
    const img = new Image();
    img.onload = () => onReady();
    if (svg) img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.includes('xmlns=') ? svg : svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"'));
    return (monsterImages[key] = img);
  }

  /** A monster figure: breathes slowly (unless motion is reduced), flashes
   * the colour of a blow when struck, and all but vanishes when invisible. */
  function monsterArt(obj) {
    return {
      draw(ctx, x, y, w, h, t) {
        const img = monsterImage(obj.type, obj.hide, obj.monster);
        if (!img.complete || !img.naturalWidth) return;
        const breathe = still() ? 0 : Math.sin(t * 2.1 + (obj.type.length % 5)) * 0.018;
        const hh = h * (1 + breathe), ww = w * (1 - breathe * 0.5);
        ctx.save();
        if (obj.alpha !== undefined) ctx.globalAlpha = obj.alpha;
        ctx.drawImage(img, x + (w - ww) / 2, y + (h - hh), ww, hh);
        ctx.restore();
        if (obj.flash) {
          ctx.save();
          ctx.globalCompositeOperation = 'source-atop';
          ctx.globalAlpha = obj.flash.alpha;
          ctx.fillStyle = obj.flash.color;
          ctx.fillRect(x - 4, y + (h - hh) - 4, w + 8, hh + 8);
          ctx.restore();
        }
      },
    };
  }

  /** The artwork for one landmark: draws it into the box (x, y, w, h). */
  function art(obj) {
    if (obj.kind === 'monster') return monsterArt(obj);
    const anim = ANIMATE[obj.kind];
    return {
      draw(ctx, x, y, w, h, t, sprite) {
        const view = sprite?.view;
        const img = load(kindOf(obj, view));
        if (img.complete && img.naturalWidth) {
          if (view === 'faces-left' && obj.kind === 'throne') {   // the profile art faces right; mirror it
            ctx.save(); ctx.translate(x + w, y); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0, w, h); ctx.restore();
          } else ctx.drawImage(img, x, y, w, h);
        }
        if (anim && !still()) anim(ctx, x, y, w, h, t);
        else if (anim && obj.kind === 'altar') anim(ctx, x, y, w, h, 0);   // candles still burn, unmoving
      },
    };
  }

  const sizeOf = (obj, view) => (obj.kind === 'monster' ? obj.size : SIZES[kindOf(obj, view)] || { w: 0.6, h: 0.6 });

  /** Whether anything in a scene is animated (so the view needs redrawing over time). */
  const animates = (objects) => objects.some(o => ANIMATE[o.kind] || o.kind === 'monster') && !still();

  // Start loading everything now, so the first view isn't missing anything.
  Object.keys(SVG).forEach(load);

  root.SceneSprites = { sizeOf, art, animates, onReady: (fn) => { onReady = fn; }, SIZES, SPRITE_FILES };
})(typeof window !== 'undefined' ? window : globalThis);
