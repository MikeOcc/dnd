// THE SEVEN LEVELS — the Horror monster art: darker, more detailed, far less
// cartoonish versions of the portraits, chosen in Settings (Monster art).
// Monsters without a horror version here keep their classic portrait.
// Same frames as the classic art (160×160; Asmodeus 200×200) so they sit in
// the same places; the Hollow Choir keeps its mask classes (choir-mask,
// m-grief…, .glow) so its masks still drift, align and shatter. Ids are
// prefixed ("hg-", "hm-", "hh-", "ha-"): inline SVGs share the page's ids.
// Backgrounds stay transparent (only glows that fade out), so a monster can
// also stand in the 3D scene without a box around it.
// Skin texture comes from SVG filters (fractal noise lit as a bumpy surface,
// multiplied into the paint).

'use strict';

/** A filter that roughens and shades a surface: pores, welts, cracks. */
function horrorSkinFilter(id, { freq = '0.09 0.13', scale = 2.4, seed = 3, azimuth = 235, elevation = 46, k = 1.2 } = {}) {
  // Paint × (a little + the lit texture): the texture shades, it doesn't swamp.
  const f = String(freq).split(' ').map(x => (parseFloat(x) * 2.6).toFixed(3)).join(' ');
  return `
    <filter id="${id}" filterUnits="userSpaceOnUse" x="-20" y="-20" width="240" height="240" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="${f}" numOctaves="3" seed="${seed}" result="n"/>
      <feDiffuseLighting in="n" surfaceScale="${(scale * 0.55).toFixed(2)}" lighting-color="#fff" result="l"><feDistantLight azimuth="${azimuth}" elevation="${elevation + 14}"/></feDiffuseLighting>
      <feComposite in="l" in2="SourceGraphic" operator="arithmetic" k1="${(k * 0.42).toFixed(2)}" k2="0" k3="0.62" k4="0" result="lit"/>
      <feComposite in="lit" in2="SourceGraphic" operator="in"/>
    </filter>`;
}

/** Overlapping scales, each shaded dark at its root and rimmed pale, as a
 * pattern to lay over a body (w = scale width in user units). */
function scalePattern(id, w = 4, dark = '#0a1206', rim = '#b8c890') {
  const h = w * 0.75;
  const scale = (x, y) => `<path d="M ${x - w / 2} ${y} Q ${x - w / 2} ${y + h} ${x} ${y + h * 1.15} Q ${x + w / 2} ${y + h} ${x + w / 2} ${y} Z" fill="url(#${id}-g)" stroke="${dark}" stroke-width="${(w / 14).toFixed(2)}"/>
    <path d="M ${x - w / 2.6} ${y + h * 0.55} Q ${x} ${y + h * 1.05} ${x + w / 2.6} ${y + h * 0.55}" stroke="${rim}" stroke-width="${(w / 18).toFixed(2)}" fill="none" opacity="0.55"/>`;
  return `
    <linearGradient id="${id}-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0.55"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
    <pattern id="${id}" patternUnits="userSpaceOnUse" width="${w}" height="${(h * 1.2).toFixed(2)}">
      ${scale(w / 2, -h * 0.6)}${scale(0, 0)}${scale(w, 0)}${scale(w / 2, h * 0.6)}
    </pattern>`;
}

/** Wet skin: the textured shading, plus a glossy shine where light catches
 * the moisture on every bump. */
function wetSkinFilter(id, { freq = '0.055 0.075', seed = 13, azimuth = 225, elevation = 50, shine = 0.8 } = {}) {
  return `
    <filter id="${id}" filterUnits="userSpaceOnUse" x="-20" y="-20" width="240" height="240" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="2" seed="${seed}" result="n"/>
      <feDiffuseLighting in="n" surfaceScale="3" lighting-color="#fff" result="d"><feDistantLight azimuth="${azimuth}" elevation="${elevation}"/></feDiffuseLighting>
      <feComposite in="d" in2="SourceGraphic" operator="arithmetic" k1="0.5" k2="0" k3="0.6" k4="0" result="lit"/>
      <feSpecularLighting in="n" surfaceScale="4" specularConstant="${shine}" specularExponent="18" lighting-color="#ffd8d0" result="s"><feDistantLight azimuth="${azimuth}" elevation="${elevation}"/></feSpecularLighting>
      <feComposite in="s" in2="SourceGraphic" operator="in" result="s2"/>
      <feComposite in="lit" in2="s2" operator="arithmetic" k1="0" k2="1" k3="0.75" k4="0" result="wet"/>
      <feComposite in="wet" in2="SourceGraphic" operator="in"/>
    </filter>`;
}

/** A vignette that sinks the edges into darkness. */
const horrorVignette = (id, cx = '50%', cy = '50%', inner = 0.4) => `
    <radialGradient id="${id}" cx="${cx}" cy="${cy}" r="70%">
      <stop offset="${inner}" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.92"/>
    </radialGradient>`;

/** A row of needle teeth along a jaw line, from (x0,y) to (x1,y), pointing up or down. */
function needleTeeth(x0, x1, y, n, len, dir, fill = '#d8cfa8', jitter = 0.35) {
  let s = '';
  const w = (x1 - x0) / n;
  for (let i = 0; i < n; i++) {
    const x = x0 + i * w;
    const l = len * (0.65 + ((i * 37) % 10) / 10 * jitter * 2);
    s += `<path d="M ${x.toFixed(1)} ${y} L ${(x + w / 2).toFixed(1)} ${(y + dir * l).toFixed(1)} L ${(x + w).toFixed(1)} ${y} Z" fill="${fill}" stroke="#3a3020" stroke-width="0.3"/>`;
  }
  return s;
}

/** A horror dragon (160×160), rearing and roaring to the right, in a
 * colour scheme (pal) with its breath: 'fire', 'acid', 'lightning', 'gas',
 * 'frost' or 'gold'. Ids prefixed with p. */
function horrorDragon(p, pal, breath, label) {
  const breathArt = {
    fire: `
      <defs><radialGradient id="${p}-fire" cx="15%" cy="50%" r="90%"><stop offset="0" stop-color="#fffbe0"/><stop offset="0.25" stop-color="#ffd040"/><stop offset="0.55" stop-color="#ff5a10"/><stop offset="1" stop-color="#8a1000" stop-opacity="0"/></radialGradient></defs>
      <path class="shop-flame" d="M 130 46 C 140 36, 152 30, 166 24 L 166 92 C 152 80, 140 66, 130 54 Z" fill="url(#${p}-fire)"/>
      <path d="M 130 48 C 142 44, 152 42, 166 40 L 166 64 C 152 60, 142 56, 130 52 Z" fill="#fff6c0" opacity="0.7"/>
      <g fill="#ffb030"><circle cx="150" cy="96" r="1.2"/><circle cx="142" cy="88" r="1"/><circle cx="158" cy="18" r="1.2"/><circle cx="146" cy="26" r="0.9"/></g>
      <g fill="#2a1a10" opacity="0.5"><circle cx="156" cy="14" r="6"/><circle cx="148" cy="8" r="5"/></g>`,
    acid: `
      <path d="M 130 52 C 140 58, 146 76, 148 100 C 150 120, 150 136, 152 150" stroke="#b8ff30" stroke-width="5" fill="none" opacity="0.9"/>
      <path d="M 130 52 C 140 58, 146 76, 148 100 C 150 120, 150 136, 152 150" stroke="#f0ffb0" stroke-width="1.5" fill="none"/>
      <g fill="#b8ff30"><ellipse cx="136" cy="62" rx="1.4" ry="2.6"/><ellipse cx="142" cy="78" rx="1.2" ry="2.4"/><ellipse cx="124" cy="60" rx="1.2" ry="2.6"/></g>
      <ellipse cx="148" cy="152" rx="14" ry="3.5" fill="#6aa010" opacity="0.8"/>
      <!-- a skull dissolving in the pool -->
      <path d="M 136 150 C 134 142, 140 138, 146 140 C 150 142, 150 148, 148 152 Z" fill="#c8c0a0"/><circle cx="140" cy="145" r="1.6" fill="#1a1a10"/><circle cx="145" cy="145" r="1.6" fill="#1a1a10"/>
      <g class="obj-smoke" fill="#9ac040" opacity="0.4"><circle cx="146" cy="138" r="7"/><circle cx="154" cy="130" r="6"/><circle cx="140" cy="128" r="5"/></g>
      <path d="M 116 56 q 1 6 -1 10 M 122 58 q 1 4 0 8" stroke="#b8ff30" stroke-width="1.4" fill="none"/>`,
    lightning: `
      <defs><filter id="${p}-zap" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
      <g filter="url(#${p}-zap)" stroke="#e8f4ff" fill="none" stroke-linejoin="bevel">
        <path d="M 130 48 L 142 42 L 138 56 L 152 50 L 148 66 L 162 62 L 158 80" stroke-width="2.2"/>
        <path d="M 142 42 L 156 30 L 152 22 L 164 14" stroke-width="1.3"/>
        <path d="M 148 66 L 140 82 L 150 92 L 144 108" stroke-width="1.2"/>
      </g>
      <circle cx="132" cy="48" r="10" fill="#a0d0ff" opacity="0.35"/>`,
    gas: `
      <g class="obj-smoke" fill="#6ab030" opacity="0.5">
        <circle cx="140" cy="44" r="10"/><circle cx="152" cy="36" r="12"/><circle cx="150" cy="58" r="13"/><circle cx="160" cy="76" r="12"/><circle cx="140" cy="70" r="9"/><circle cx="160" cy="18" r="9"/>
      </g>
      <g fill="none" stroke="#1a3a08" stroke-width="1" opacity="0.7">
        <path d="M 146 52 q 4 -6 8 0 q -4 7 -8 0 M 148 51 l 1 0 M 152 51 l 1 0 M 149 56 l 3 0"/>
        <path d="M 154 30 q 3 -5 7 0 q -3 6 -7 0 M 156 29 l 1 0 M 159 29 l 1 0"/>
      </g>
      <path d="M 120 58 q 2 6 0 10" stroke="#8ad040" stroke-width="1.4" fill="none"/>`,
    frost: `
      <defs><linearGradient id="${p}-frost" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff"/><stop offset="0.5" stop-color="#a8dcff" stop-opacity="0.8"/><stop offset="1" stop-color="#5aa0ff" stop-opacity="0"/></linearGradient></defs>
      <path d="M 130 46 C 142 34, 154 28, 166 22 L 166 90 C 154 80, 142 66, 130 54 Z" fill="url(#${p}-frost)" opacity="0.85"/>
      <g fill="#e8f6ff" stroke="#8ac0ff" stroke-width="0.4">
        <path d="M 146 40 l 6 -2 l -4 4 Z"/><path d="M 154 58 l 7 1 l -5 3 Z"/><path d="M 148 74 l 6 3 l -6 0 Z"/><path d="M 158 34 l 5 -3 l -2 5 Z"/>
      </g>
      <g class="obj-sparkle" stroke="#fff" stroke-width="0.6"><path d="M 156 48 l 0 6 M 153 51 l 6 0 M 154 49 l 4 4 M 158 49 l -4 4"/><path d="M 144 66 l 0 4 M 142 68 l 4 0"/></g>
      <path d="M 114 58 l 1 6 l 1 -6 M 120 60 l 1 5 l 1 -5 M 126 58 l 0.8 4 l 0.8 -4" fill="#e8f6ff" stroke="#8ac0ff" stroke-width="0.3"/>`,
    gold: `
      <g fill="#ffd860" class="obj-sparkle">
        ${Array.from({ length: 34 }, (_, i) => { const t = i / 34; const x = 132 + t * 32 + Math.sin(i * 2.3) * 6 * t; const y = 50 + Math.cos(i * 1.7) * 26 * t; return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(0.6 + (i % 3) * 0.4).toFixed(1)}"/>`; }).join('')}
      </g>
      <path d="M 130 46 C 142 36, 154 30, 166 26 L 166 84 C 154 74, 142 62, 130 54 Z" fill="#ffd860" opacity="0.18"/>
      <!-- the sack of gold it swings, splitting, coins spilling -->
      <path d="M 112 108 C 104 108, 100 120, 106 128 C 112 134, 126 132, 128 124 C 130 114, 122 106, 116 106 Z" fill="#6a4a20"/>
      <path d="M 112 106 l 2 -6 l 4 6" stroke="#3a2a10" stroke-width="1.4" fill="none"/>
      <g fill="#ffd860" stroke="#7a5010" stroke-width="0.4"><circle cx="122" cy="134" r="2.4"/><circle cx="127" cy="138" r="2.4"/><circle cx="118" cy="140" r="2.2"/></g>`,
  }[breath];
  return `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${label}">
    <defs>
      ${wetSkinFilter(`${p}-hide`, { freq: '0.16 0.2', seed: pal.seed || 7, shine: 0.32 })}
      <linearGradient id="${p}-fadeg" gradientUnits="userSpaceOnUse" x1="132" y1="0" x2="160" y2="0"><stop offset="0.55" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>
      <mask id="${p}-fade" maskUnits="userSpaceOnUse" x="0" y="0" width="160" height="160"><rect width="160" height="160" fill="url(#${p}-fadeg)"/></mask>
      ${horrorSkinFilter(`${p}-wing`, { freq: '0.04 0.18', scale: 1.6, seed: 4 })}
      ${scalePattern(`${p}-sc`, 3.4, pal.dark, pal.rim)}
      ${scalePattern(`${p}-fs`, 1.9, pal.dark, pal.rim)}
      <linearGradient id="${p}-body" x1="0" y1="0" x2="0.6" y2="1"><stop offset="0" stop-color="${pal.hi}"/><stop offset="0.5" stop-color="${pal.mid}"/><stop offset="1" stop-color="${pal.dark}"/></linearGradient>
      <linearGradient id="${p}-belly" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${pal.belly}"/><stop offset="1" stop-color="${pal.bellyDark}"/></linearGradient>
      <linearGradient id="${p}-memb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${pal.wing}"/><stop offset="1" stop-color="${pal.dark}"/></linearGradient>
      <linearGradient id="${p}-horn" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${pal.horn}"/><stop offset="1" stop-color="#0a0806"/></linearGradient>
      <radialGradient id="${p}-eye" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff"/><stop offset="0.4" stop-color="${pal.eye}"/><stop offset="1" stop-color="${pal.eye}" stop-opacity="0"/></radialGradient>
      <radialGradient id="${p}-maw" cx="30%" cy="50%" r="80%"><stop offset="0" stop-color="${breath === 'fire' ? '#ff8a20' : breath === 'acid' || breath === 'gas' ? '#6a8a10' : breath === 'frost' || breath === 'lightning' ? '#6ab0ff' : breath === 'gold' ? '#ffd040' : '#3a0606'}"/><stop offset="0.5" stop-color="#3a0606"/><stop offset="1" stop-color="#0a0202"/></radialGradient>
    </defs>
    <!-- the far wing, torn, behind the neck -->
    <g filter="url(#${p}-wing)">
      <path d="M 92 58 C 100 30, 118 12, 140 4 C 134 16, 134 26, 138 34 C 130 32, 124 36, 122 44 C 116 42, 108 46, 104 56 Z" fill="url(#${p}-memb)"/>
    </g>
    <path d="M 92 58 C 100 30, 118 12, 140 4 M 112 26 L 138 34 M 106 40 L 122 44" stroke="${pal.bone}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <!-- the near wing, vast and ragged, bones showing through holes in the membrane -->
    <g filter="url(#${p}-wing)">
      <path d="M 64 70 C 52 42, 30 18, 4 8 C 10 22, 10 34, 6 46 C 14 44, 20 48, 22 58 C 28 54, 36 56, 38 66 C 44 62, 52 64, 56 74 Z" fill="url(#${p}-memb)"/>
    </g>
    <g stroke="${pal.dark}" fill="#000" opacity="0.85"><path d="M 20 30 l 6 2 l -2 5 Z" stroke-width="0.5"/><path d="M 34 48 l 5 3 l -4 3 Z" stroke-width="0.5"/></g>
    <path d="M 22 24 C 30 30, 38 40, 46 52 M 14 38 C 26 42, 36 50, 44 60" stroke="${pal.vein}" stroke-width="0.6" fill="none" opacity="0.7"/>
    <path d="M 64 70 C 52 42, 30 18, 4 8 M 40 38 L 6 46 M 48 50 L 22 58 M 56 60 L 38 66" stroke="${pal.bone}" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M 4 8 l -3 -4 M 6 46 l -4 1 M 22 58 l -3 3" stroke="#0a0806" stroke-width="1.6" stroke-linecap="round"/>
    <!-- the tail, curling along the floor, spined -->
    <path d="M 52 128 C 34 136, 18 140, 10 130 C 4 122, 12 116, 18 122" stroke="url(#${p}-body)" stroke-width="10" fill="none" stroke-linecap="round" filter="url(#${p}-hide)"/>
    <path d="M 52 128 C 34 136, 18 140, 10 130 C 4 122, 12 116, 18 122" stroke="url(#${p}-sc)" stroke-width="10" fill="none" stroke-linecap="round" opacity="0.6"/>
    <path d="M 44 128 l -2 -6 l 4 4 M 34 132 l -2 -6 l 4 4 M 24 134 l -3 -5 l 5 3" fill="${pal.horn}" stroke="#0a0806" stroke-width="0.6"/>
    <!-- bones on the floor beneath it -->
    <path d="M 70 150 l 20 -2 M 98 152 l 14 2" stroke="#c8bca0" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M 84 146 C 82 140, 88 136, 94 138 C 98 140, 98 146, 96 150 Z" fill="#d8ccb0"/><circle cx="88" cy="143" r="1.6" fill="#1a1410"/><circle cx="93" cy="143" r="1.6" fill="#1a1410"/>
    <!-- the body: a heavy, hunched trunk, ribs pressing through the scales -->
    <path d="M 46 104 C 44 84, 56 68, 76 64 C 94 62, 104 74, 104 92 C 104 112, 92 128, 72 130 C 56 130, 48 120, 46 104 Z" fill="url(#${p}-body)" filter="url(#${p}-hide)"/>
    <path d="M 46 104 C 44 84, 56 68, 76 64 C 94 62, 104 74, 104 92 C 104 112, 92 128, 72 130 C 56 130, 48 120, 46 104 Z" fill="url(#${p}-sc)" opacity="0.65"/>
    <path d="M 56 84 Q 62 80 68 86 M 54 92 Q 61 88 67 94 M 54 100 Q 61 96 66 102 M 56 108 Q 62 104 66 110" stroke="${pal.dark}" stroke-width="1.6" fill="none" opacity="0.8"/>
    <path d="M 56 83 Q 62 79 68 85 M 54 91 Q 61 87 67 93" stroke="${pal.rim}" stroke-width="0.6" fill="none" opacity="0.5"/>
    <!-- belly plates, cracked and scarred -->
    <path d="M 90 70 C 100 78, 104 94, 98 110 C 94 118, 88 124, 82 127 C 88 112, 92 92, 86 72 Z" fill="url(#${p}-belly)" filter="url(#${p}-hide)"/>
    <path d="M 88 78 L 99 80 M 90 86 L 101 88 M 91 94 L 101 96 M 90 102 L 100 104 M 88 110 L 97 112 M 86 118 L 92 120" stroke="${pal.bellyDark}" stroke-width="1.2" opacity="0.9"/>
    <path d="M 94 92 l 3 6 l -2 4 M 92 108 l -3 4" stroke="#3a0a06" stroke-width="0.8" fill="none"/>
    <!-- the haunch and hind foot, clawed into the stone -->
    <path d="M 48 112 C 40 120, 40 134, 48 142 L 66 148 C 70 140, 68 128, 64 118 Z" fill="url(#${p}-body)" filter="url(#${p}-hide)"/>
    <path d="M 48 112 C 40 120, 40 134, 48 142 L 66 148 C 70 140, 68 128, 64 118 Z" fill="url(#${p}-sc)" opacity="0.6"/>
    <path d="M 48 144 l -6 6 M 54 146 l -3 8 M 60 147 l 0 8 M 66 147 l 4 7" stroke="#0a0806" stroke-width="2.2" stroke-linecap="round"/>
    <!-- the foreleg, reaching, hooked talons spread -->
    <path d="M 92 100 C 102 104, 110 110, 116 120 L 110 124 C 104 116, 96 112, 88 110 Z" fill="url(#${p}-body)" filter="url(#${p}-hide)"/>
    <path d="M 92 100 C 102 104, 110 110, 116 120 L 110 124 C 104 116, 96 112, 88 110 Z" fill="url(#${p}-sc)" opacity="0.6"/>
    <g stroke="#0a0806" stroke-width="2" stroke-linecap="round" fill="none"><path d="M 114 122 C 120 124, 124 128, 124 134"/><path d="M 112 124 C 116 130, 116 134, 114 140"/><path d="M 116 120 C 122 118, 126 120, 128 124"/></g>
    <g stroke="#e8e0c8" stroke-width="0.9" stroke-linecap="round"><path d="M 124 134 l 0 3"/><path d="M 114 140 l -1 3"/><path d="M 128 124 l 2 2"/></g>
    <!-- the neck, an S of corded muscle, spined along the crest -->
    <path d="M 82 70 C 80 54, 90 44, 104 40 L 114 48 C 102 52, 96 60, 98 74 Z" fill="url(#${p}-body)" filter="url(#${p}-hide)"/>
    <path d="M 82 70 C 80 54, 90 44, 104 40 L 114 48 C 102 52, 96 60, 98 74 Z" fill="url(#${p}-fs)" opacity="0.6"/>
    <path d="M 90 66 C 92 58, 98 52, 106 48" stroke="url(#${p}-belly)" stroke-width="5" fill="none" opacity="0.85"/>
    <path d="M 84 62 l -5 -3 l 5 -1 M 86 54 l -5 -4 l 6 0 M 92 46 l -3 -5 l 5 2" fill="${pal.horn}" stroke="#0a0806" stroke-width="0.5"/>
    <!-- the head: a long reptile skull, jaws gaping, brow heavy with spines -->
    <path d="M 100 32 C 104 22, 116 20, 126 26 L 136 34 L 130 40 L 112 44 C 104 44, 98 40, 100 32 Z" fill="url(#${p}-body)" filter="url(#${p}-hide)"/>
    <path d="M 100 32 C 104 22, 116 20, 126 26 L 136 34 L 130 40 L 112 44 C 104 44, 98 40, 100 32 Z" fill="url(#${p}-fs)" opacity="0.55"/>
    <path d="M 104 46 C 110 52, 122 58, 134 60 L 132 54 C 122 52, 114 48, 108 44 Z" fill="url(#${p}-body)" filter="url(#${p}-hide)"/>
    <!-- the maw, glowing from within, gums raw -->
    <path d="M 112 44 L 136 36 C 138 46, 136 54, 132 56 C 124 54, 116 50, 110 46 Z" fill="url(#${p}-maw)"/>
    <path d="M 113 43.6 L 136 35.6" stroke="#7a1a1a" stroke-width="1.6"/>
    <path d="M 111 46 C 118 50, 126 54, 132 55.4" stroke="#6a1414" stroke-width="1.4" fill="none"/>
    <g fill="#ece2c4" stroke="#4a3a20" stroke-width="0.25">
      <path d="M 115 43 l 1.4 4 l 1.2 -4.4 Z"/><path d="M 119 41.8 l 1.6 5 l 1.2 -5.4 Z"/><path d="M 123 40.4 l 1.4 4.4 l 1.2 -4.8 Z"/><path d="M 127 39 l 1.6 5.2 l 1.2 -5.6 Z"/><path d="M 131 37.6 l 1.2 4 l 1.1 -4.4 Z"/>
      <path d="M 114 47.4 l 1.6 -4 l 1 4.6 Z"/><path d="M 118 49.4 l 1.6 -4.6 l 1 5 Z"/><path d="M 122.4 51.4 l 1.4 -4.2 l 1 4.6 Z"/><path d="M 126.6 53 l 1.6 -4.6 l 1 4.8 Z"/><path d="M 130.4 54.4 l 1 -3.6 l 1 3.8 Z"/>
    </g>
    <path d="M 118 46 C 119 48, 118 50, 119 52 M 126 44 C 127 47, 125 50, 127 53" stroke="#e8e8e0" stroke-width="0.4" fill="none" opacity="0.7"/>
    <path d="M 116 50 C 122 50, 126 48, 132 46" stroke="#a83a40" stroke-width="2" fill="none" stroke-linecap="round"/>
    <!-- nostrils, smoking; a scar across the snout -->
    <ellipse cx="133" cy="31" rx="1.6" ry="1" fill="#050302"/>
    <path d="M 112 26 L 120 34" stroke="${pal.rim}" stroke-width="0.8" opacity="0.6"/>
    <path d="M 134 30 q 3 -4 1 -8 q -2 -3 1 -6" stroke="#6a6058" stroke-width="1.4" fill="none" opacity="0.5"/>
    <!-- the brow, and a slit eye burning under it -->
    <path d="M 108 26 C 112 22, 118 22, 122 26" stroke="${pal.dark}" stroke-width="2.4" fill="none"/>
    <circle cx="116" cy="30" r="5.5" fill="url(#${p}-eye)"/>
    <ellipse cx="116" cy="30" rx="3" ry="2.2" fill="${pal.eye}"/>
    <path d="M 116 28 L 116 32" stroke="#000" stroke-width="1"/><circle cx="115" cy="29" r="0.5" fill="#fff"/>
    <!-- horns: swept back, ridged, and a crest of spines down the skull -->
    <path d="M 104 26 C 96 16, 86 12, 76 14 C 86 18, 92 22, 98 30 Z" fill="url(#${p}-horn)"/>
    <path d="M 108 24 C 104 12, 96 4, 86 2 C 94 8, 98 14, 102 26 Z" fill="url(#${p}-horn)"/>
    <path d="M 90 16 l 1 3 M 86 15 l 1 3 M 98 10 l 2 2 M 94 7 l 2 2" stroke="#0a0806" stroke-width="0.6"/>
    <path d="M 112 22 l -1 -5 l 3 4 M 118 22 l 0 -5 l 2 5 M 104 30 l -5 0 l 4 2" fill="${pal.horn}" stroke="#0a0806" stroke-width="0.4"/>
    <g mask="url(#${p}-fade)">${breathArt}</g>
    </svg>`;
}

const DRAGON_PALETTES = {
  red:   { hi: '#e0502e', mid: '#8a1a10', dark: '#2a0604', belly: '#e0a868', bellyDark: '#8a5420', rim: '#ffb090', wing: '#7a1a10', bone: '#3a1a10', vein: '#ff6040', horn: '#5a4a3a', eye: '#ffd040', seed: 7 },
  black: { hi: '#5a5a4a', mid: '#262620', dark: '#070705', belly: '#7a7a5a', bellyDark: '#3a3a28', rim: '#c8d090', wing: '#22221a', bone: '#4a4a3a', vein: '#9ac040', horn: '#3a3a30', eye: '#b8ff40', seed: 9 },
  blue:  { hi: '#5a8ae8', mid: '#1a3a90', dark: '#050a26', belly: '#b0c8f0', bellyDark: '#5a78b8', rim: '#c8e0ff', wing: '#1a3480', bone: '#1a2a5a', vein: '#80c0ff', horn: '#d8dce8', eye: '#f0f8ff', seed: 5 },
  green: { hi: '#6ab048', mid: '#1e5418', dark: '#041604', belly: '#c8d080', bellyDark: '#7a8430', rim: '#d0f0a0', wing: '#1e4a14', bone: '#2a3a14', vein: '#a0e040', horn: '#6a5a3a', eye: '#ffe040', seed: 3 },
  white: { hi: '#ffffff', mid: '#a8b8d8', dark: '#2a3448', belly: '#ffffff', bellyDark: '#9aaac8', rim: '#ffffff', wing: '#c8d4ec', bone: '#6a7a98', vein: '#7ab0ff', horn: '#e8eef8', eye: '#60c8ff', seed: 11 },
  gold:  { hi: '#ffe070', mid: '#b47818', dark: '#3a2004', belly: '#fff2b8', bellyDark: '#b8902a', rim: '#fff6c8', wing: '#a87018', bone: '#5a3a08', vein: '#ffe080', horn: '#7a5a30', eye: '#ff4020', seed: 13 },
};

/** Asmodeus as he's hurt: 0 whole (the full towering figure), 1 wounded,
 * 2 badly hurt. Close (for the portrait), the view moves in on him as he's
 * hurt; in the 3D scene he stays whole-figure, wounds and all. */
function horrorAsmodeus(stage = 0, close = false) {
  const view = !close || stage === 0 ? '0 0 200 200' : stage === 1 ? '28 0 144 144' : '48 4 104 104';
  const wounds = stage === 0 ? '' : `
    <!-- wounds: gashes glowing with the fire inside him, burning ichor running -->
    <g stroke="#ffb040" stroke-width="1.4" fill="none" filter="url(#ha-glow)" stroke-linecap="round">
      <path d="M 74 80 L 92 98"/><path d="M 116 74 L 104 92"/><path d="M 94 22 L 104 36"/>
      ${stage === 2 ? '<path d="M 70 98 L 98 112"/><path d="M 124 88 L 108 108"/><path d="M 86 30 L 90 44"/><path d="M 110 28 L 112 46"/><path d="M 46 100 L 40 116"/><path d="M 148 96 L 154 112"/>' : ''}
    </g>
    <g fill="#ff6a10" opacity="0.9">
      <path d="M 92 98 q 1 6 -1 10 q 2 0 2 -4 Z"/><path d="M 104 92 q 1 6 0 12 q 2 -1 2 -5 Z"/><path d="M 104 36 q 1 4 0 7 q 1.6 -1 1 -4 Z"/>
      ${stage === 2 ? '<path d="M 98 112 q 1 6 -1 12 q 2 0 2 -5 Z"/><path d="M 108 108 q 1 5 0 10 q 2 -1 1.6 -5 Z"/><path d="M 90 44 q 0.6 4 0 7 q 1.4 -1 1 -4 Z"/>' : ''}
    </g>
    <!-- rage: the eyes burn hotter -->
    <circle cx="92" cy="30" r="${stage === 2 ? 9 : 6}" fill="url(#ha-eye)" opacity="${stage === 2 ? 0.75 : 0.5}"/>
    <circle cx="108" cy="30" r="${stage === 2 ? 9 : 6}" fill="url(#ha-eye)" opacity="${stage === 2 ? 0.75 : 0.5}"/>
    ${stage === 2 ? '<g class="obj-smoke" fill="#2a2420" opacity="0.45"><circle cx="80" cy="60" r="8"/><circle cx="120" cy="56" r="9"/><circle cx="100" cy="46" r="7"/></g>' : ''}`;
  return `
    <svg viewBox="${view}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Asmodeus: a towering, gaunt devil of wet red flesh split by glowing fissures, horned, winged, grinning with too many teeth">
    <defs>
      ${wetSkinFilter('ha-hide')}
      ${horrorSkinFilter('ha-wing', { freq: '0.05 0.2', scale: 2, seed: 4, k: 1.2 })}
      ${horrorVignette('ha-vig', '50%', '45%', 0.45)}
      <radialGradient id="ha-fire" cx="50%" cy="50%" r="50%">
        <stop offset="0" stop-color="#ff6a14" stop-opacity="0.8"/><stop offset="0.35" stop-color="#8a1404" stop-opacity="0.6"/><stop offset="1" stop-color="#000" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="ha-slag" x1="0" y1="0" x2="0.4" y2="1">
        <stop offset="0" stop-color="#c4202a"/><stop offset="0.5" stop-color="#7a0a12"/><stop offset="1" stop-color="#2a0206"/>
      </linearGradient>
      <radialGradient id="ha-face" cx="42%" cy="30%" r="80%">
        <stop offset="0" stop-color="#d8303a"/><stop offset="0.5" stop-color="#8a0e18"/><stop offset="1" stop-color="#2a0206"/>
      </radialGradient>
      ${scalePattern('ha-scales', 3.6, '#1a0002', '#ff9090')}
      ${scalePattern('ha-fine', 2, '#1a0002', '#ff9090')}
      <linearGradient id="ha-leg" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#3a0206"/><stop offset="0.35" stop-color="#c41c26"/><stop offset="0.6" stop-color="#8a0a14"/><stop offset="1" stop-color="#2a0204"/>
      </linearGradient>
      <radialGradient id="ha-form" cx="42%" cy="35%" r="62%"><stop offset="0.35" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#1a0002" stop-opacity="0.85"/></radialGradient>
      <linearGradient id="ha-horn" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#4a4038"/><stop offset="0.5" stop-color="#1a1410"/><stop offset="1" stop-color="#050302"/>
      </linearGradient>
      <linearGradient id="ha-membrane" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#3a0e0a"/><stop offset="1" stop-color="#120404"/>
      </linearGradient>
      <radialGradient id="ha-eye" cx="50%" cy="50%" r="50%">
        <stop offset="0" stop-color="#fffbe0"/><stop offset="0.35" stop-color="#ffd040"/><stop offset="0.7" stop-color="#ff5a10"/><stop offset="1" stop-color="#5a0a00" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="ha-gold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#e8c060"/><stop offset="1" stop-color="#6a4810"/>
      </linearGradient>
      <filter id="ha-glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <ellipse cx="100" cy="148" rx="98" ry="50" fill="url(#ha-fire)"/>
    <!-- faces of the damned, half-seen in the fire behind him -->
    <g fill="none" stroke="#ff7a2a" stroke-width="0.9" opacity="0.28">
      <path d="M 22 150 q 6 -10 12 0 q -6 10 -12 0 M 25 148 l 1 0 M 30 148 l 1 0 M 26 154 q 2 3 4 0"/>
      <path d="M 166 156 q 6 -10 12 0 q -6 10 -12 0 M 169 154 l 1 0 M 174 154 l 1 0 M 170 160 q 2 4 4 0"/>
      <path d="M 40 176 q 5 -8 10 0 q -5 8 -10 0 M 43 175 l 1 0 M 47 175 l 1 0 M 44 180 q 1.5 3 3 0"/>
      <path d="M 148 178 q 5 -8 10 0 q -5 8 -10 0 M 151 177 l 1 0 M 155 177 l 1 0 M 152 182 q 1.5 3 3 0"/>
    </g>
    <!-- chains, with hooks -->
    <g stroke="#3a302a" stroke-width="1.6" fill="none">
      <path d="M 14 0 V 60" stroke-dasharray="4 2"/><path d="M 186 0 V 52" stroke-dasharray="4 2"/>
      <path d="M 14 60 q 0 8 -5 8 q -4 0 -4 -4" stroke-width="2"/><path d="M 186 52 q 0 8 5 8 q 4 0 4 -4" stroke-width="2"/>
    </g>
    <path d="M 8 66 q -2 4 1 6 M 192 58 q 2 4 -1 6" stroke="#6a0a0a" stroke-width="1.2" fill="none"/>
    <!-- the wings: torn membrane stretched over bare bone -->
    <g filter="url(#ha-wing)">
      <path d="M 76 66 C 56 40, 30 22, 6 18 C 14 30, 16 44, 12 58 C 20 56, 26 60, 28 70 C 34 66, 42 68, 44 78 C 52 74, 60 76, 66 84 Z" fill="url(#ha-membrane)"/>
      <path d="M 124 66 C 144 40, 170 22, 194 18 C 186 30, 184 44, 188 58 C 180 56, 174 60, 172 70 C 166 66, 158 68, 156 78 C 148 74, 140 76, 134 84 Z" fill="url(#ha-membrane)"/>
    </g>
    <g stroke="#7a6a5a" stroke-width="2" fill="none" stroke-linecap="round">
      <path d="M 76 66 C 56 40, 30 22, 6 18"/><path d="M 56 46 L 12 58"/><path d="M 62 54 L 28 70"/><path d="M 68 62 L 44 78"/>
      <path d="M 124 66 C 144 40, 170 22, 194 18"/><path d="M 144 46 L 188 58"/><path d="M 138 54 L 172 70"/><path d="M 132 62 L 156 78"/>
    </g>
    <path d="M 30 44 l 6 6 l -4 4 M 40 60 l 3 5 M 170 44 l -6 6 l 4 4 M 160 60 l -3 5" stroke="#050101" stroke-width="2.4" fill="none"/>
    <!-- the robe: black, blood-dark at the hem, falling into the fire -->
    <path d="M 62 112 C 56 140, 50 170, 42 200 L 158 200 C 150 170, 144 140, 138 112 Z" fill="#0a0303"/>
    <path d="M 62 112 C 56 140, 50 170, 42 200 L 58 200 C 64 170, 70 140, 74 114 Z M 138 112 C 144 140, 150 170, 158 200 L 142 200 C 136 170, 130 140, 126 114 Z" fill="#2a0606"/>
    <path d="M 46 196 L 154 196" stroke="url(#ha-gold)" stroke-width="3"/>
    <!-- legs: thick, meaty and muscular, red and scaled, on bare clawed feet -->
    <g id="ha-legs">
      <!-- left leg: thigh, the knee, a bulging calf, the ankle -->
      <path d="M 70 118 C 62 132, 64 146, 72 156 C 66 166, 68 178, 74 188 L 89 188 C 93 178, 95 168, 92 158 C 99 146, 100 132, 99 120 Z" fill="url(#ha-leg)" filter="url(#ha-hide)"/>
      <!-- right leg -->
      <path d="M 130 118 C 138 132, 136 146, 128 156 C 134 166, 132 178, 126 188 L 111 188 C 107 178, 105 168, 108 158 C 101 146, 100 132, 101 120 Z" fill="url(#ha-leg)" filter="url(#ha-hide)"/>
      <path d="M 70 118 C 62 132, 64 146, 72 156 C 66 166, 68 178, 74 188 L 89 188 C 93 178, 95 168, 92 158 C 99 146, 100 132, 99 120 Z" fill="url(#ha-scales)" opacity="0.55"/>
      <path d="M 130 118 C 138 132, 136 146, 128 156 C 134 166, 132 178, 126 188 L 111 188 C 107 178, 105 168, 108 158 C 101 146, 100 132, 101 120 Z" fill="url(#ha-scales)" opacity="0.55"/>
      <!-- the muscle: quadriceps, kneecaps, calves -->
      <path d="M 78 124 C 76 134, 78 144, 82 150 M 90 124 C 92 134, 90 144, 86 152 M 122 124 C 124 134, 122 144, 118 150 M 110 124 C 108 134, 110 144, 114 152" stroke="#2a0204" stroke-width="1.4" fill="none" opacity="0.8"/>
      <path d="M 79 125 C 77 134, 79 142, 82 148 M 121 125 C 123 134, 121 142, 118 148" stroke="#ff9a9a" stroke-width="0.7" fill="none" opacity="0.45"/>
      <ellipse cx="83" cy="157" rx="5" ry="4" fill="#d8303a" opacity="0.55"/><ellipse cx="117" cy="157" rx="5" ry="4" fill="#d8303a" opacity="0.55"/>
      <path d="M 78 162 C 74 170, 76 178, 80 184 M 122 162 C 126 170, 124 178, 120 184" stroke="#ff9a9a" stroke-width="0.8" fill="none" opacity="0.4"/>
      <path d="M 86 164 C 88 172, 86 180, 86 186 M 114 164 C 112 172, 114 180, 114 186" stroke="#2a0204" stroke-width="1.2" fill="none" opacity="0.8"/>
      <g stroke="#ff7a24" stroke-width="0.6" fill="none" filter="url(#ha-glow)" opacity="0.7"><path d="M 80 132 L 84 138 L 82 144"/><path d="M 120 168 L 117 174 L 119 178"/></g>
      <!-- bare feet: broad, knuckled toes, black claws -->
      <path d="M 74 186 C 68 188, 62 192, 60 196 L 92 196 C 92 192, 90 188, 88 186 Z" fill="url(#ha-leg)" filter="url(#ha-hide)"/>
      <path d="M 126 186 C 132 188, 138 192, 140 196 L 108 196 C 108 192, 110 188, 112 186 Z" fill="url(#ha-leg)" filter="url(#ha-hide)"/>
      <path d="M 66 192 l 0 4 M 72 191 l 0 5 M 78 191 l 0 5 M 84 191 l 0 5 M 134 192 l 0 4 M 128 191 l 0 5 M 122 191 l 0 5 M 116 191 l 0 5" stroke="#2a0204" stroke-width="1"/>
      <g fill="#0a0303" stroke="#4a3a30" stroke-width="0.3">
        <path d="M 60 195 l -4 2 l 5 1 Z M 66 195 l -3 3 l 5 0 Z M 72 195 l -2 3 l 5 0 Z M 78 195 l -1 3 l 4 0 Z M 85 195 l 0 3 l 4 -1 Z"/>
        <path d="M 140 195 l 4 2 l -5 1 Z M 134 195 l 3 3 l -5 0 Z M 128 195 l 2 3 l -5 0 Z M 122 195 l 1 3 l -4 0 Z M 115 195 l 0 3 l -4 -1 Z"/>
      </g>
      <path d="M 62 193 Q 76 189 90 192 M 138 193 Q 124 189 110 192" stroke="#ff9a9a" stroke-width="0.6" fill="none" opacity="0.4"/>
    </g>
    <!-- a loincloth, blood-dark, under a belt of gold studded with rubies -->
    <path d="M 70 114 L 130 114 L 124 140 L 100 150 L 76 140 Z" fill="#160304"/>
    <path d="M 90 120 L 100 148 L 110 120" stroke="#3a0608" stroke-width="1" fill="none"/>
    <path d="M 66 112 Q 100 120 134 112 L 134 118 Q 100 126 66 118 Z" fill="url(#ha-gold)"/>
    <circle cx="100" cy="120" r="2.6" fill="#c0102a" filter="url(#ha-glow)"/><circle cx="82" cy="118" r="1.4" fill="#a00a20"/><circle cx="118" cy="118" r="1.4" fill="#a00a20"/>
    <!-- a starved chest of cracked slag, lit from within -->
    <path d="M 68 70 C 62 86, 62 104, 66 116 C 76 122, 124 122, 134 116 C 138 104, 138 86, 132 70 C 120 62, 80 62, 68 70 Z" fill="url(#ha-slag)" filter="url(#ha-hide)"/>
    <path d="M 68 70 C 62 86, 62 104, 66 116 C 76 122, 124 122, 134 116 C 138 104, 138 86, 132 70 C 120 62, 80 62, 68 70 Z" fill="url(#ha-scales)" opacity="0.5"/>
    <path d="M 68 70 C 62 86, 62 104, 66 116 C 76 122, 124 122, 134 116 C 138 104, 138 86, 132 70 C 120 62, 80 62, 68 70 Z" fill="url(#ha-form)"/>
    <!-- the shape of him: a starved chest, collarbones, ribs, a pit of a belly -->
    <path d="M 74 74 Q 86 70 98 76 M 102 76 Q 114 70 126 74" stroke="#ff9a9a" stroke-width="0.9" fill="none" opacity="0.35"/>
    <path d="M 70 100 Q 84 96 96 102 M 104 102 Q 116 96 130 100 M 72 108 Q 84 104 96 110 M 104 110 Q 116 104 128 108" stroke="#2a0204" stroke-width="1.6" fill="none" opacity="0.8"/>
    <path d="M 71 98 Q 84 94 96 100 M 104 100 Q 116 94 129 98" stroke="#ff8a8a" stroke-width="0.6" fill="none" opacity="0.35"/>
    <ellipse cx="100" cy="112" rx="12" ry="5" fill="#2a0204" opacity="0.6"/>
    <g stroke="#ff6a1a" stroke-width="1" fill="none" filter="url(#ha-glow)" opacity="0.9">
      <path d="M 80 74 L 86 86 L 82 98 L 88 112"/><path d="M 118 76 L 112 88 L 116 100 L 110 114"/>
      <path d="M 92 80 L 100 84 L 108 80"/><path d="M 96 96 L 100 104 L 104 96"/>
    </g>
    <g stroke="#140605" stroke-width="1.4" fill="none" opacity="0.9">
      <path d="M 72 84 Q 84 80 96 86"/><path d="M 104 86 Q 116 80 128 84"/><path d="M 72 94 Q 84 90 96 96"/><path d="M 104 96 Q 116 90 128 94"/>
    </g>
    <!-- the ruby at his throat -->
    <path d="M 94 70 L 106 70 L 100 80 Z" fill="url(#ha-gold)"/>
    <circle cx="100" cy="75" r="3.6" fill="#c0102a" filter="url(#ha-glow)"/><circle cx="99" cy="74" r="1" fill="#ffb0b8"/>
    <!-- shoulder plates of black iron -->
    <path d="M 54 70 C 58 60, 72 58, 80 64 L 74 76 C 66 74, 58 76, 54 70 Z" fill="#141010" stroke="#3a302a"/>
    <path d="M 146 70 C 142 60, 128 58, 120 64 L 126 76 C 134 74, 142 76, 146 70 Z" fill="#141010" stroke="#3a302a"/>
    <path d="M 58 64 l -4 -8 l 8 4 M 142 64 l 4 -8 l -8 4" fill="#2a2420"/>
    <!-- one arm reaching for you, talons out -->
    <path d="M 58 76 C 46 88, 38 104, 34 122 L 42 124 C 46 108, 54 96, 66 86 Z" fill="url(#ha-slag)" filter="url(#ha-hide)"/>
    <path d="M 58 76 C 46 88, 38 104, 34 122 L 42 124 C 46 108, 54 96, 66 86 Z" fill="url(#ha-scales)" opacity="0.5"/>
    <path d="M 58 76 C 46 88, 38 104, 34 122 L 42 124 C 46 108, 54 96, 66 86 Z" fill="url(#ha-form)"/>
    <path d="M 34 120 C 28 124, 26 130, 30 134 C 36 136, 42 132, 42 124 Z" fill="#22100c"/>
    <g stroke="#0a0505" stroke-width="2" stroke-linecap="round" fill="none">
      <path d="M 30 132 C 26 138, 22 142, 18 146"/><path d="M 33 134 C 32 140, 30 146, 28 152"/><path d="M 37 134 C 38 140, 38 146, 38 152"/><path d="M 28 126 C 22 126, 18 128, 14 132"/>
    </g>
    <g stroke="#d8d0b0" stroke-width="1" stroke-linecap="round"><path d="M 18 146 l -3 3"/><path d="M 28 152 l -1 4"/><path d="M 38 152 l 0 4"/><path d="M 14 132 l -4 1"/></g>
    <path d="M 40 106 L 44 112 L 38 116" stroke="#ff6a1a" stroke-width="0.8" fill="none" opacity="0.8"/>
    <!-- the other holds the ruby rod -->
    <path d="M 142 76 C 152 88, 158 102, 160 118 L 152 120 C 150 106, 144 94, 134 86 Z" fill="url(#ha-slag)" filter="url(#ha-hide)"/>
    <path d="M 142 76 C 152 88, 158 102, 160 118 L 152 120 C 150 106, 144 94, 134 86 Z" fill="url(#ha-scales)" opacity="0.5"/>
    <path d="M 142 76 C 152 88, 158 102, 160 118 L 152 120 C 150 106, 144 94, 134 86 Z" fill="url(#ha-form)"/>
    <path d="M 164 40 L 154 170" stroke="url(#ha-gold)" stroke-width="3"/>
    <circle cx="165" cy="36" r="6" fill="#a00a20" filter="url(#ha-glow)"/><path d="M 160 36 l 5 -8 l 5 8 l -5 8 Z" fill="#d81a34" opacity="0.8"/>
    <path d="M 150 116 C 154 112, 162 114, 162 120 C 160 126, 152 126, 150 122 Z" fill="#22100c"/>
    <!-- the neck, corded -->
    <path d="M 90 52 L 110 52 L 112 68 L 88 68 Z" fill="url(#ha-face)" filter="url(#ha-hide)"/>
    <path d="M 90 52 L 110 52 L 112 68 L 88 68 Z" fill="url(#ha-scales)" opacity="0.5"/>
    <path d="M 94 66 L 96 54 M 106 66 L 104 54" stroke="#0a0403" stroke-width="1.4"/>
    <!-- the horns: great ridged ram's horns, and a crown of lesser spikes -->
    <path d="M 84 22 C 70 8, 48 8, 44 24 C 42 36, 54 44, 62 38 C 56 36, 52 30, 56 24 C 60 18, 72 18, 80 28 Z" fill="url(#ha-horn)"/>
    <path d="M 116 22 C 130 8, 152 8, 156 24 C 158 36, 146 44, 138 38 C 144 36, 148 30, 144 24 C 140 18, 128 18, 120 28 Z" fill="url(#ha-horn)"/>
    <g stroke="#5a5048" stroke-width="0.8" fill="none" opacity="0.7">
      <path d="M 76 16 l -2 5 M 68 12 l -1 5 M 60 12 l 0 5 M 52 16 l 2 4 M 47 24 l 4 2"/>
      <path d="M 124 16 l 2 5 M 132 12 l 1 5 M 140 12 l 0 5 M 148 16 l -2 4 M 153 24 l -4 2"/>
    </g>
    <path d="M 88 18 L 86 6 L 92 16 M 96 14 L 96 2 L 100 13 M 104 14 L 106 3 L 108 16 M 112 18 L 116 7 L 114 19" fill="#1a1410" stroke="#3a302a" stroke-width="0.6"/>
    <!-- the face: long as a skull, skin drawn tight over it, pointed ears -->
    <path d="M 80 30 L 70 22 L 80 36 Z M 120 30 L 130 22 L 120 36 Z" fill="#2e120c"/>
    <path d="M 82 24 C 82 14, 90 10, 100 10 C 110 10, 118 14, 118 24 C 118 38, 114 50, 108 58 C 104 62, 96 62, 92 58 C 86 50, 82 38, 82 24 Z" fill="url(#ha-face)" filter="url(#ha-hide)"/>
    <path d="M 82 24 C 82 14, 90 10, 100 10 C 110 10, 118 14, 118 24 C 118 38, 114 50, 108 58 C 104 62, 96 62, 92 58 C 86 50, 82 38, 82 24 Z" fill="url(#ha-fine)" opacity="0.5"/>
    <path d="M 82 24 C 82 14, 90 10, 100 10 C 110 10, 118 14, 118 24 C 118 38, 114 50, 108 58 C 104 62, 96 62, 92 58 C 86 50, 82 38, 82 24 Z" fill="url(#ha-form)"/>
    <path d="M 86 34 Q 88 44 92 50 M 114 34 Q 112 44 108 50" stroke="#0a0403" stroke-width="1.4" fill="none"/>
    <path d="M 90 14 Q 100 10 110 14" stroke="#ff6a1a" stroke-width="0.6" fill="none" opacity="0.5"/>
    <!-- the face split by glowing fissures; cheeks sunk to the bone -->
    <g stroke="#ff7a24" stroke-width="0.6" fill="none" filter="url(#ha-glow)" opacity="0.85">
      <path d="M 88 18 L 91 22 L 89 26"/><path d="M 112 18 L 109 23 L 111 26"/><path d="M 96 12 L 98 16 L 97 19"/>
      <path d="M 86 38 L 88 42 L 87 46"/><path d="M 114 38 L 112 42 L 113 46"/><path d="M 102 52 L 101 56"/>
    </g>
    <path d="M 85 36 C 88 40, 90 44, 92 46 L 89 46 C 86 42, 85 40, 85 36 Z M 115 36 C 112 40, 110 44, 108 46 L 111 46 C 114 42, 115 40, 115 36 Z" fill="#050101" opacity="0.8"/>
    <path d="M 86 34 Q 90 33 94 36 M 114 34 Q 110 33 106 36" stroke="#8a3a2a" stroke-width="0.7" fill="none" opacity="0.7"/>
    <path d="M 95 22 L 97 26 M 105 22 L 103 26 M 98 19 L 100 24 L 102 19" stroke="#050101" stroke-width="0.8" fill="none"/>
    <path d="M 84 30 l -3 -1 M 84 32 l -3 1 M 116 30 l 3 -1 M 116 32 l 3 1" stroke="#050101" stroke-width="0.6"/>
    <!-- brow ridge, and eyes like holes into a furnace -->
    <path d="M 84 26 Q 92 20 99 27 M 101 27 Q 108 20 116 26" stroke="#050101" stroke-width="3" fill="none" stroke-linecap="round"/>
    <ellipse cx="92" cy="30" rx="5.5" ry="3.8" fill="#000"/><ellipse cx="108" cy="30" rx="5.5" ry="3.8" fill="#000"/>
    <ellipse cx="92" cy="30" rx="4.2" ry="2.6" fill="url(#ha-eye)" filter="url(#ha-glow)"/><ellipse cx="108" cy="30" rx="4.2" ry="2.6" fill="url(#ha-eye)" filter="url(#ha-glow)"/>
    <path d="M 92 28 L 92 32 M 108 28 L 108 32" stroke="#3a0a00" stroke-width="0.7"/>
    <path d="M 86.6 28.6 Q 92 26 97.4 28.6 M 102.6 28.6 Q 108 26 113.4 28.6" stroke="#050101" stroke-width="1.2" fill="none"/>
    <path d="M 87.4 32 Q 92 34 96.6 32 M 103.4 32 Q 108 34 112.6 32" stroke="#2a0805" stroke-width="0.8" fill="none"/>
    <!-- no nose to speak of: a split ridge, two slits -->
    <path d="M 100 32 L 98 40 L 100 41 L 102 40 Z" fill="#1a0806"/>
    <path d="M 98 40 l -1 1 M 102 40 l 1 1" stroke="#000" stroke-width="1"/>
    <!-- the lipless grin, ear to ear, of far too many teeth -->
    <path d="M 86 44 Q 100 56 114 44 Q 100 50 86 44 Z" fill="#100202"/>
    <g>${needleTeeth(87, 113, 44.6, 16, 3.2, 1, '#e8dcc0', 0.3)}</g>
    <g>${needleTeeth(90, 110, 50.2, 12, 2.6, -1, '#d0c4a0', 0.3)}</g>
    <path d="M 86 44 Q 100 56 114 44" stroke="#3a0a06" stroke-width="0.8" fill="none"/>
    <path d="M 86 44 Q 84 42 83 39 M 114 44 Q 116 42 117 39" stroke="#0a0302" stroke-width="1" fill="none"/>
    <path d="M 88 46.5 Q 100 54 112 46.5" stroke="#5a1408" stroke-width="0.5" fill="none" opacity="0.7"/>
    <!-- a pointed black beard of matted hair -->
    <path d="M 94 56 C 96 64, 98 72, 100 80 C 102 72, 104 64, 106 56 C 102 60, 98 60, 94 56 Z" fill="#050202"/>
    <!-- smoke from the horns -->
    <g fill="#2a2420" opacity="0.4"><circle cx="46" cy="10" r="5"/><circle cx="42" cy="2" r="4"/><circle cx="154" cy="10" r="5"/><circle cx="158" cy="2" r="4"/></g>
    ${wounds}
    </svg>`;
}

const HORROR_SPRITES = {

  // ─── Ghoul ───────────────────────────────────────────────────────────────
  // A starved corpse-thing crouched over its meal, lunging at you: skin like
  // wet grey paper over every rib, a jaw unhinged far too wide on rows of
  // yellow needles strung with spit, milk-white eyes with pinprick pupils, a
  // rotted hole for a nose, and fingers too long by a joint, black-nailed.
  'Ghoul': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Ghoul: a starved, grey corpse-thing with an unhinged jaw of needle teeth, lunging">
    <defs>
      ${horrorSkinFilter('hg-skin', { freq: '0.11 0.16', scale: 2.8, seed: 11 })}
      ${horrorVignette('hg-vig', '50%', '45%', 0.35)}
      <radialGradient id="hg-flesh" cx="45%" cy="30%" r="75%">
        <stop offset="0" stop-color="#a7ad9c"/><stop offset="0.45" stop-color="#6d7466"/><stop offset="1" stop-color="#262a24"/>
      </radialGradient>
      <linearGradient id="hg-limb" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#8a9080"/><stop offset="1" stop-color="#2a2e28"/>
      </linearGradient>
      <radialGradient id="hg-maw" cx="50%" cy="40%" r="60%">
        <stop offset="0" stop-color="#2a0606"/><stop offset="0.7" stop-color="#120202"/><stop offset="1" stop-color="#050000"/>
      </radialGradient>
      <radialGradient id="hg-eye" cx="45%" cy="40%" r="60%">
        <stop offset="0" stop-color="#f2f0e2"/><stop offset="0.7" stop-color="#bdbfae"/><stop offset="1" stop-color="#6a6c5c"/>
      </radialGradient>
      <radialGradient id="hg-under" cx="50%" cy="100%" r="80%">
        <stop offset="0" stop-color="#3a4a3a" stop-opacity="0.5"/><stop offset="1" stop-color="#000" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="160" height="160" fill="url(#hg-under)"/>
    <!-- the floor, and what's left of its meal: a gnawed arm, a dark pool -->
    <ellipse cx="80" cy="150" rx="70" ry="9" fill="#0a0806"/>
    <ellipse cx="96" cy="150" rx="30" ry="5" fill="#2a0404" opacity="0.9"/>
    <ellipse cx="92" cy="149" rx="14" ry="2" fill="#5a0a0a" opacity="0.6"/>
    <path d="M 70 148 C 80 145, 100 144, 116 146 L 118 150 C 100 151, 82 152, 70 152 Z" fill="#8a7a64" filter="url(#hg-skin)"/>
    <path d="M 112 144 l 6 -3 l 2 2 l 4 -2 l 1 3 l 4 -1 l -1 4 l -14 3 Z" fill="#7a6a54"/>
    <path d="M 70 148 c -4 0 -6 4 -2 5 c 3 1 5 -2 2 -5 Z" fill="#c8bca0"/>
    <path d="M 84 146 q 6 3 14 0" stroke="#5a0808" stroke-width="2" fill="none"/>
    <!-- haunches: it squats, knees up, feet splayed and clawed -->
    <path d="M 46 150 C 36 132, 40 112, 56 106 C 64 116, 62 136, 58 150 Z" fill="url(#hg-limb)" filter="url(#hg-skin)"/>
    <path d="M 114 150 C 124 132, 120 112, 104 106 C 96 116, 98 136, 102 150 Z" fill="url(#hg-limb)" filter="url(#hg-skin)"/>
    <path d="M 40 150 l -6 3 M 46 151 l -3 5 M 52 151 l 0 5 M 108 151 l 0 5 M 114 151 l 3 5 M 120 150 l 6 3" stroke="#111" stroke-width="1.6" stroke-linecap="round"/>
    <!-- the starved trunk, every rib and knuckle of spine pushed through -->
    <path d="M 58 112 C 52 92, 54 70, 64 58 C 72 50, 88 50, 96 58 C 106 70, 108 92, 102 112 C 94 118, 66 118, 58 112 Z" fill="url(#hg-flesh)" filter="url(#hg-skin)"/>
    <path d="M 64 106 C 70 100, 90 100, 96 106 C 92 112, 68 112, 64 106 Z" fill="#1a1d18" opacity="0.5"/>
    <g fill="none" stroke="#1a1d18" stroke-width="1.6" opacity="0.85" stroke-linecap="round">
      <path d="M 60 74 Q 70 70 78 74"/><path d="M 82 74 Q 90 70 100 74"/>
      <path d="M 58 81 Q 69 76 78 81"/><path d="M 82 81 Q 91 76 102 81"/>
      <path d="M 57 88 Q 68 83 78 88"/><path d="M 82 88 Q 92 83 103 88"/>
      <path d="M 57 95 Q 68 90 78 95"/><path d="M 82 95 Q 92 90 103 95"/>
      <path d="M 58 102 Q 68 98 77 102"/><path d="M 83 102 Q 92 98 102 102"/>
    </g>
    <g fill="none" stroke="#c4c8b4" stroke-width="0.7" opacity="0.45">
      <path d="M 61 72 Q 70 68 77 72"/><path d="M 83 72 Q 90 68 99 72"/><path d="M 59 79 Q 69 74 77 79"/><path d="M 83 79 Q 91 74 101 79"/>
      <path d="M 58 86 Q 68 81 77 86"/><path d="M 83 86 Q 92 81 102 86"/><path d="M 58 93 Q 68 88 77 93"/><path d="M 83 93 Q 92 88 102 93"/>
    </g>
    <path d="M 80 66 L 80 112" stroke="#1a1d18" stroke-width="2" opacity="0.6"/>
    <path d="M 66 108 Q 80 114 94 108" stroke="#1a1d18" stroke-width="1.2" fill="none" opacity="0.7"/>
    <!-- blood down its chest from the feeding -->
    <path d="M 74 66 C 72 76, 76 84, 73 96 C 72 100, 75 102, 76 98 C 78 88, 80 78, 80 68 Z" fill="#4a0606" opacity="0.85"/>
    <path d="M 86 66 C 88 72, 86 80, 88 86 C 89 89, 86 90, 86 87 C 84 80, 84 72, 84 67 Z" fill="#3a0404" opacity="0.8"/>
    <!-- arms: too long by a joint, one reaching for you, one braced on the meal -->
    <path d="M 58 64 C 44 66, 30 72, 22 84 C 18 90, 14 98, 10 106 L 16 108 C 20 100, 26 92, 32 86 C 40 78, 50 74, 60 74 Z" fill="url(#hg-limb)" filter="url(#hg-skin)"/>
    <circle cx="30" cy="82" r="3.2" fill="#5a6052"/>
    <g stroke="#2a2e26" stroke-width="2.2" stroke-linecap="round" fill="none">
      <path d="M 12 106 C 8 112, 6 118, 4 126"/><path d="M 14 107 C 12 115, 12 122, 12 130"/>
      <path d="M 16 107 C 18 114, 20 120, 22 127"/><path d="M 11 104 C 6 106, 2 108, -1 112"/>
    </g>
    <g stroke="#0a0a08" stroke-width="2.6" stroke-linecap="round"><path d="M 4 126 l -1 4"/><path d="M 12 130 l 0 4"/><path d="M 22 127 l 1 4"/><path d="M -1 112 l -3 2"/></g>
    <path d="M 102 64 C 114 70, 120 82, 118 96 C 117 108, 114 126, 110 142 L 104 142 C 106 126, 108 110, 108 98 C 108 86, 104 76, 98 72 Z" fill="url(#hg-limb)" filter="url(#hg-skin)"/>
    <g stroke="#2a2e26" stroke-width="2.2" stroke-linecap="round" fill="none"><path d="M 104 142 l -4 6"/><path d="M 107 143 l -1 7"/><path d="M 110 142 l 2 7"/></g>
    <!-- the neck, stretched forward, cords standing out -->
    <path d="M 68 60 C 68 52, 70 46, 74 42 L 88 42 C 92 46, 94 52, 94 60 Z" fill="url(#hg-flesh)" filter="url(#hg-skin)"/>
    <path d="M 74 58 L 76 44 M 88 58 L 86 44" stroke="#1a1d18" stroke-width="1.4" opacity="0.7"/>
    <!-- the head: a skull with skin shrunk onto it, hairless, ears torn to points -->
    <path d="M 56 26 L 46 14 L 60 22 Z" fill="#5a6052"/><path d="M 104 26 L 116 12 L 101 22 Z" fill="#4a5044"/>
    <path d="M 58 30 C 56 14, 66 4, 80 4 C 94 4, 104 14, 102 30 C 102 36, 98 40, 96 42 L 64 42 C 62 40, 58 36, 58 30 Z" fill="url(#hg-flesh)" filter="url(#hg-skin)"/>
    <path d="M 64 12 q 6 -4 10 0 M 84 9 q 6 -2 10 3" stroke="#30352c" stroke-width="0.9" fill="none"/>
    <!-- veins crawling over the bare scalp, and the skull's ridges under the skin -->
    <path d="M 66 8 C 70 12, 68 16, 72 18 M 70 10 l 4 -2 M 92 6 C 88 10, 92 14, 88 18 M 90 10 l -4 -1 M 78 5 C 80 9, 78 12, 80 16" stroke="#3a4a5a" stroke-width="0.6" fill="none" opacity="0.8"/>
    <path d="M 60 30 C 62 34, 64 36, 66 38 M 100 30 C 98 34, 96 36, 94 38" stroke="#1a1d18" stroke-width="1.6" fill="none" opacity="0.7"/>
    <path d="M 62 31 C 64 28, 66 29, 66 32 M 98 31 C 96 28, 94 29, 94 32" stroke="#c4c8b4" stroke-width="0.6" fill="none" opacity="0.5"/>
    <!-- deep sockets, and in them milk-white eyes with pinprick pupils -->
    <ellipse cx="70" cy="24" rx="7.5" ry="5.5" fill="#0b0c0a" opacity="0.85"/><ellipse cx="90" cy="24" rx="7.5" ry="5.5" fill="#0b0c0a" opacity="0.85"/>
    <ellipse cx="70.5" cy="25" rx="3.4" ry="2.4" fill="url(#hg-eye)"/><ellipse cx="89.5" cy="25" rx="3.4" ry="2.4" fill="url(#hg-eye)"/>
    <circle cx="71" cy="24.5" r="0.9" fill="#111"/><circle cx="89" cy="24.5" r="0.9" fill="#111"/>
    <path d="M 67.5 24.5 q 3 -0.6 6 0.4 M 86.5 25 q 3 -1 6 -0.4" stroke="#7a2a2a" stroke-width="0.35" fill="none" opacity="0.8"/>
    <!-- lids: a heavy upper lid, a red, sagging lower one -->
    <path d="M 66.5 23.4 Q 70.5 21.2 74 23.6" stroke="#262a22" stroke-width="1.1" fill="none"/><path d="M 86 23.6 Q 89.5 21.2 93.5 23.4" stroke="#262a22" stroke-width="1.1" fill="none"/>
    <path d="M 67 26.4 Q 70.5 28.2 74 26.4" stroke="#6a2a2a" stroke-width="0.8" fill="none"/><path d="M 86 26.4 Q 89.5 28.2 93 26.4" stroke="#6a2a2a" stroke-width="0.8" fill="none"/>
    <circle cx="71" cy="25" r="1.5" fill="none" stroke="#9a9a88" stroke-width="0.4"/><circle cx="89" cy="25" r="1.5" fill="none" stroke="#9a9a88" stroke-width="0.4"/>
    <circle cx="70.2" cy="24.2" r="0.45" fill="#fff"/><circle cx="88.2" cy="24.2" r="0.45" fill="#fff"/>
    <!-- a brow knotted with hunger, and creases fanning from the eyes -->
    <path d="M 61 18 Q 70 14 78 20 M 82 20 Q 90 14 99 18" stroke="#1a1d18" stroke-width="2.2" fill="none"/>
    <path d="M 76 15 L 78 19 M 84 15 L 82 19 M 78 12 L 80 17 L 82 12" stroke="#262a22" stroke-width="0.8" fill="none"/>
    <path d="M 62 24 l -3 -1 M 62 26 l -3 1 M 98 24 l 3 -1 M 98 26 l 3 1" stroke="#30352c" stroke-width="0.6"/>
    <!-- no nose: two rotted slits -->
    <path d="M 77 30 l 1.5 5 l 1.5 -4 Z M 83 30 l -1.5 5 l -1.5 -4 Z" fill="#050505"/>
    <!-- the jaw, unhinged and hanging open far too wide -->
    <path d="M 62 38 C 62 52, 68 66, 80 70 C 92 66, 98 52, 98 38 C 92 36, 68 36, 62 38 Z" fill="url(#hg-maw)"/>
    <path d="M 62 38 C 58 50, 62 62, 70 70 L 72 66 C 66 58, 64 48, 66 40 Z M 98 38 C 102 50, 98 62, 90 70 L 88 66 C 94 58, 96 48, 94 40 Z" fill="url(#hg-flesh)" filter="url(#hg-skin)"/>
    <path d="M 70 70 Q 80 76 90 70 L 88 66 Q 80 72 72 66 Z" fill="#5a6052"/>
    <!-- gums, swollen and black-red, the teeth set in them crooked -->
    <path d="M 64 38 C 70 42, 90 42, 96 38 L 96 40.5 C 90 44, 70 44, 64 40.5 Z" fill="#4a1414"/>
    <path d="M 70 66 C 74 64, 86 64, 90 66 L 90 64 C 86 62, 74 62, 70 64 Z" fill="#3a1010"/>
    <path d="M 72 52 Q 80 56 88 52 Q 80 60 72 52 Z" fill="#3a0a0a" opacity="0.8"/>
    <path d="M 74 54 Q 80 57 86 54" stroke="#6a1a1a" stroke-width="0.5" fill="none"/>
    <g>${needleTeeth(64, 96, 38, 13, 7, 1, '#cfc49a')}</g>
    <g>${needleTeeth(68, 92, 67, 10, 6, -1, '#b8ad84')}</g>
    <path d="M 66 46 l 3 8 M 94 46 l -3 8" stroke="#c8be98" stroke-width="1.2"/>
    <!-- spit stringing between the jaws, and blood on its lips -->
    <path d="M 70 44 C 71 52, 70 58, 72 64 M 86 44 C 85 50, 87 56, 85 63 M 78 44 C 79 50, 77 56, 79 62" stroke="#cfd8d0" stroke-width="0.5" fill="none" opacity="0.7"/>
    <path d="M 62 38 C 64 42, 66 46, 64 52 M 98 38 C 97 44, 99 48, 97 54" stroke="#6a0a0a" stroke-width="1.8" fill="none" opacity="0.9"/>
    <path d="M 74 70 q 1 6 -1 10 M 84 71 q 0 4 1 7" stroke="#5a0808" stroke-width="1.4" fill="none"/>
    <!-- cold light from below, and the dark closing in -->
    </svg>
  `,

  // ─── Medusa ──────────────────────────────────────────────────────────────
  // A gaunt queen of the deep places, drawing a bow of yellowed bone strung
  // with sinew. Her skin is cracking into scale from the neck down; her hair
  // is a nest of living vipers, fanged and hissing; her eyes are lamps of
  // sick gold with slit pupils. Behind her, a man turned to stone mid-scream,
  // an arm thrown up too late.
  'Medusa': `
    <svg viewBox="-5 -10 170 170" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Medusa: a gaunt, scaled woman with a nest of fanged vipers for hair, drawing a bone bow; behind her a man turned to stone mid-scream">
    <defs>
      ${horrorSkinFilter('hm-skin', { freq: '0.12 0.15', scale: 2, seed: 5 })}
      ${horrorSkinFilter('hm-stone', { freq: '0.18', scale: 3.2, seed: 9, k: 1.3 })}
      ${horrorSkinFilter('hm-scale', { freq: '0.35 0.3', scale: 2.2, seed: 2, k: 1.25 })}
      ${horrorVignette('hm-vig', '45%', '45%', 0.4)}
      ${scalePattern('hm-scales', 4.2, '#081004', '#c8d898')}
      ${scalePattern('hm-fine', 2.2, '#081004', '#c8d898')}
      <radialGradient id="hm-flesh" cx="40%" cy="30%" r="80%">
        <stop offset="0" stop-color="#a4b098"/><stop offset="0.5" stop-color="#5e6c58"/><stop offset="1" stop-color="#1c241a"/>
      </radialGradient>
      <linearGradient id="hm-coil" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#4a5a3a"/><stop offset="0.6" stop-color="#26301e"/><stop offset="1" stop-color="#0c100a"/>
      </linearGradient>
      <linearGradient id="hm-viper" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#5a6a3a"/><stop offset="1" stop-color="#1a2210"/>
      </linearGradient>
      <radialGradient id="hm-eye" cx="50%" cy="50%" r="50%">
        <stop offset="0" stop-color="#fff2a0"/><stop offset="0.5" stop-color="#d0a020"/><stop offset="1" stop-color="#5a3a00"/>
      </radialGradient>
      <radialGradient id="hm-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0" stop-color="#ffd84a" stop-opacity="0.35"/><stop offset="1" stop-color="#ffd84a" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="hm-bone" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#cbbf9a"/><stop offset="1" stop-color="#6a5e40"/>
      </linearGradient>
      <g id="hm-snake">
        <path d="M 0 0 C 2 -6, 6 -10, 6 -16 C 6 -20, 3 -22, 4 -26" stroke="url(#hm-viper)" stroke-width="3.4" fill="none" stroke-linecap="round"/>
        <path d="M 0 0 C 2 -6, 6 -10, 6 -16 C 6 -20, 3 -22, 4 -26" stroke="url(#hm-fine)" stroke-width="3.4" fill="none" stroke-linecap="round"/>
        <path d="M 0.8 -1 C 2.6 -6.6, 6.6 -10.4, 6.6 -16 C 6.6 -20, 3.6 -22, 4.6 -26" stroke="#c8c890" stroke-width="0.7" fill="none" opacity="0.4" stroke-dasharray="1 0.6"/>
        <path d="M 1.5 -27 C 4 -31, 9 -31, 10 -27 C 10 -24, 6 -23, 4 -24 Z" fill="#3a4a24" stroke="#0a0e06" stroke-width="0.5"/>
        <path d="M 9 -27 L 13 -28 L 9.5 -25.5 Z" fill="#2a0606"/>
        <path d="M 10 -27.5 l 1 2 M 11.6 -27.6 l 0.6 1.7" stroke="#e8e0c0" stroke-width="0.5"/>
        <circle cx="6.4" cy="-28.4" r="0.8" fill="#ffd040"/>
        <path d="M 13 -27.5 l 2.5 -0.6 m -2.5 0.6 l 2.4 1" stroke="#9a1a1a" stroke-width="0.4"/>
      </g>
    </defs>
    <!-- the victim behind her: a man in stone, mid-scream, arm thrown up too late -->
    <g filter="url(#hm-stone)">
      <path d="M 126 150 L 124 112 C 122 100, 126 92, 134 90 C 142 92, 146 100, 144 112 L 142 150 Z" fill="#6e6c66"/>
      <path d="M 128 96 C 126 84, 132 78, 138 80 C 144 84, 144 94, 140 98 Z" fill="#7a7872"/>
      <path d="M 138 92 C 146 84, 150 74, 150 66 L 145 66 C 144 74, 140 82, 134 88 Z" fill="#6a6862"/>
      <path d="M 124 104 C 118 112, 116 120, 118 128 L 122 128 C 122 120, 124 114, 128 108 Z" fill="#666460"/>
    </g>
    <ellipse cx="134" cy="88" rx="2.4" ry="3.4" fill="#1a1a18"/><path d="M 131 84 l 2 1 M 136 84 l -2 1" stroke="#2a2a28" stroke-width="0.8"/>
    <path d="M 128 100 L 132 120 L 130 136 M 140 104 L 138 118" stroke="#2a2a28" stroke-width="0.6" fill="none"/>
    <!-- her coils: a serpent's body, scaled and heavy, from the waist down -->
    <path d="M 60 112 C 52 128, 56 142, 74 148 C 96 154, 120 150, 118 138 C 116 128, 98 130, 92 136 C 88 140, 96 144, 104 142" stroke="url(#hm-coil)" stroke-width="20" fill="none" stroke-linecap="round" filter="url(#hm-scale)"/>
    <path d="M 60 112 C 52 128, 56 142, 74 148 C 96 154, 120 150, 118 138 C 116 128, 98 130, 92 136 C 88 140, 96 144, 104 142" stroke="url(#hm-scales)" stroke-width="20" fill="none" stroke-linecap="round" opacity="0.9"/>
    <path d="M 60 120 C 56 134, 62 142, 76 146 C 94 150, 112 148, 114 140" stroke="#b8b070" stroke-width="5" fill="none" opacity="0.28" stroke-dasharray="3 1.4"/>
    <path d="M 62 118 C 58 130, 62 140, 76 144 C 94 148, 112 146, 112 140" stroke="#d8d8a0" stroke-width="0.8" fill="none" opacity="0.35"/>
    <!-- her gaunt body: skin breaking into scale below the collarbones -->
    <path d="M 60 112 C 56 96, 58 80, 66 70 C 72 64, 88 64, 94 70 C 102 80, 104 96, 98 112 Z" fill="url(#hm-flesh)" filter="url(#hm-skin)"/>
    <path d="M 64 92 C 70 96, 90 96, 96 92 C 98 102, 96 108, 98 112 L 60 112 C 62 106, 62 100, 64 92 Z" fill="#2e3a24" filter="url(#hm-scale)" opacity="0.9"/>
    <path d="M 64 92 C 70 96, 90 96, 96 92 C 98 102, 96 108, 98 112 L 60 112 C 62 106, 62 100, 64 92 Z" fill="url(#hm-fine)"/>
    <path d="M 66 90 C 70 92, 72 88, 76 92 C 78 89, 82 93, 86 90 C 88 93, 92 89, 94 91" stroke="#2e3a24" stroke-width="1.4" fill="none"/>
    <path d="M 70 86 l 1.5 1.2 M 76 87 l 1.2 1.4 M 86 87 l -1.2 1.4 M 90 86 l -1.5 1.2" stroke="#2e3a24" stroke-width="1.2"/>
    <path d="M 66 84 Q 72 80 78 84 M 82 84 Q 88 80 94 84 M 67 88 Q 73 85 78 88 M 82 88 Q 88 85 93 88" stroke="#1a2016" stroke-width="1" fill="none" opacity="0.8"/>
    <path d="M 68 74 Q 80 78 92 74" stroke="#1a2016" stroke-width="1.2" fill="none"/>
    <!-- the bone bow, drawn: string at her chest, arrow nocked, aimed left at you -->
    <path d="M 30 50 C 18 66, 18 92, 30 108" stroke="url(#hm-bone)" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M 30 50 l -2 -3 M 30 108 l -2 3" stroke="#cbbf9a" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M 24 62 l -2 1 M 22 72 l -2 0 M 22 86 l -2 0 M 24 96 l -2 -1" stroke="#4a3e28" stroke-width="1"/>
    <path d="M 30 50 L 72 80 L 30 108" stroke="#b8a888" stroke-width="0.7" fill="none"/>
    <path d="M 72 80 L 14 80" stroke="#3a3020" stroke-width="1.4"/>
    <path d="M 14 80 l 7 -3 l 0 6 Z" fill="#8a8a90"/>
    <path d="M 66 80 l 6 -3 M 66 80 l 6 3 M 62 80 l 5 -3 M 62 80 l 5 3" stroke="#2a2a2a" stroke-width="1"/>
    <!-- her arms: the bow arm straight and corded, the other drawing to her chest -->
    <path d="M 66 72 C 54 74, 42 76, 30 78 L 30 84 C 42 82, 54 80, 66 80 Z" fill="url(#hm-flesh)" filter="url(#hm-skin)"/>
    <path d="M 28 76 C 24 76, 22 82, 26 86 C 30 86, 32 82, 30 77 Z" fill="#5e6c58"/>
    <path d="M 26 77 l -3 -1 M 25 80 l -4 0 M 25 83 l -3 1" stroke="#0e100c" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M 92 72 C 98 78, 92 84, 80 82 L 72 82 L 72 76 L 82 76 C 88 76, 88 72, 92 72 Z" fill="url(#hm-flesh)" filter="url(#hm-skin)"/>
    <path d="M 72 76 C 68 76, 68 84, 72 84 Z" fill="#5e6c58"/>
    <!-- the neck and the head: gaunt, hollow-cheeked, lips drawn back -->
    <path d="M 74 58 L 86 58 L 88 68 L 72 68 Z" fill="url(#hm-flesh)" filter="url(#hm-skin)"/>
    <path d="M 66 38 C 66 26, 72 20, 80 20 C 88 20, 94 26, 94 38 C 94 48, 88 58, 80 60 C 72 58, 66 48, 66 38 Z" fill="url(#hm-flesh)" filter="url(#hm-skin)"/>
    <path d="M 69 44 Q 72 50 75 52 M 91 44 Q 88 50 85 52" stroke="#1a2016" stroke-width="1.2" fill="none" opacity="0.8"/>
    <!-- scale creeping across her temples and jaw; high, sharp cheekbones -->
    <path d="M 66 32 C 66 38, 67 44, 69 48 C 66 46, 64 40, 66 32 Z M 94 32 C 94 38, 93 44, 91 48 C 94 46, 96 40, 94 32 Z" fill="url(#hm-fine)"/>
    <path d="M 66 30 C 66 38, 68 46, 71 50 L 68 50 C 65 46, 64 38, 66 30 Z M 94 30 C 94 38, 92 46, 89 50 L 92 50 C 95 46, 96 38, 94 30 Z" fill="#2e3a24" opacity="0.6"/>
    <path d="M 70 42 Q 74 40 77 43 M 90 42 Q 86 40 83 43" stroke="#c8d4b8" stroke-width="0.7" fill="none" opacity="0.55"/>
    <path d="M 75 24 q 5 -2 10 0 M 76 27 q 4 -1.5 8 0" stroke="#2a3424" stroke-width="0.6" fill="none" opacity="0.8"/>
    <!-- eyes: sick gold lamps with slit pupils, glowing -->
    <circle cx="73" cy="37" r="7" fill="url(#hm-glow)"/><circle cx="87" cy="37" r="7" fill="url(#hm-glow)"/>
    <path d="M 68 37 Q 73 33 78 37 Q 73 40 68 37 Z" fill="url(#hm-eye)"/>
    <path d="M 82 37 Q 87 33 92 37 Q 87 40 82 37 Z" fill="url(#hm-eye)"/>
    <path d="M 73 34.6 L 73 39.4 M 87 34.6 L 87 39.4" stroke="#000" stroke-width="1.1"/>
    <path d="M 69 36 l 2 0.6 M 77 36 l -2 0.6 M 83 36 l 2 0.6 M 91 36 l -2 0.6" stroke="#8a5a00" stroke-width="0.35"/>
    <circle cx="72" cy="35.6" r="0.5" fill="#fff"/><circle cx="86" cy="35.6" r="0.5" fill="#fff"/>
    <path d="M 68 37 Q 73 34.2 78 37 M 82 37 Q 87 34.2 92 37" stroke="#141a10" stroke-width="0.9" fill="none"/>
    <path d="M 68.4 38 Q 73 40.6 77.6 38 M 82.4 38 Q 87 40.6 91.6 38" stroke="#3a4a2a" stroke-width="0.7" fill="none"/>
    <path d="M 67 33 Q 73 30 78 34 M 82 34 Q 87 30 93 33" stroke="#141a10" stroke-width="1.6" fill="none"/>
    <path d="M 79 40 L 78 46 L 81 46" stroke="#2a3424" stroke-width="0.8" fill="none"/>
    <path d="M 72.5 50.5 Q 80 47 87.5 50.5 Q 80 49.4 72.5 50.5 Z" fill="#3a1a1a"/>
    <path d="M 73 51 Q 80 48 87 51 Q 80 55 73 51 Z" fill="#1a0404"/>
    <path d="M 74 52.6 Q 80 56 86 52.6" stroke="#4a2020" stroke-width="0.9" fill="none"/>
    <path d="M 79 53 L 79.4 56 L 80 53.4 L 80.6 56 L 81 53" stroke="#9a1a1a" stroke-width="0.4" fill="none"/>
    <path d="M 74 51 l 1 2 l 1 -2 l 1 2 l 1 -2 l 1 2 l 1 -2 l 1 2 l 1 -2 l 1 2 l 1 -2 l 1 2 l 1 -2" stroke="#c8c0a0" stroke-width="0.5" fill="none"/>
    <!-- her hair: a nest of vipers, rearing every way, fangs out -->
    <g filter="url(#hm-scale)">
      <use href="#hm-snake" transform="translate(68 26) rotate(-60)"/>
      <use href="#hm-snake" transform="translate(70 22) rotate(-30)"/>
      <use href="#hm-snake" transform="translate(76 20) rotate(-8)"/>
      <use href="#hm-snake" transform="translate(84 20) rotate(14) scale(-1 1)"/>
      <use href="#hm-snake" transform="translate(90 22) rotate(36) scale(-1 1)"/>
      <use href="#hm-snake" transform="translate(93 27) rotate(64) scale(-1 1)"/>
      <use href="#hm-snake" transform="translate(66 32) rotate(-92) scale(0.9)"/>
      <use href="#hm-snake" transform="translate(95 33) rotate(96) scale(-0.9 0.9)"/>
      <use href="#hm-snake" transform="translate(80 20) rotate(2) scale(0.8)"/>
    </g>
    <path d="M 66 36 C 62 44, 64 52, 60 58 M 94 36 C 98 44, 96 52, 100 58" stroke="url(#hm-viper)" stroke-width="3" fill="none" stroke-linecap="round"/>
    </svg>
  `,

  // ─── The Hollow Choir ────────────────────────────────────────────────────
  // Five masks of flayed, stitched skin hung around a hole in the world, each
  // pinned by threads of sinew. Behind the eyeholes, real eyes — wet,
  // bloodshot, never blinking — and in the hollow at the centre, faces
  // pressing outward as if through a membrane. (Masks keep their classes, so
  // they drift, ease into line before a power, and are gone once shattered.)
  'Hollow Choir': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="The Hollow Choir: five masks of stitched, flayed skin around a void, real eyes staring from their eyeholes">
    <defs>
      ${horrorSkinFilter('hh-skin', { freq: '0.16 0.2', scale: 2.6, seed: 21, k: 1.25 })}
      ${horrorVignette('hh-vig', '50%', '52%', 0.3)}
      <radialGradient id="hh-void" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stop-color="#000"/><stop offset="0.55" stop-color="#0a0408"/><stop offset="0.85" stop-color="#1a0a10" stop-opacity="0.6"/><stop offset="1" stop-color="#000" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="hh-hide" cx="40%" cy="35%" r="80%">
        <stop offset="0" stop-color="#d8bfa8"/><stop offset="0.5" stop-color="#a0806a"/><stop offset="1" stop-color="#4a3428"/>
      </radialGradient>
      <radialGradient id="hh-eye" cx="45%" cy="45%" r="55%">
        <stop offset="0" stop-color="#f4eee4"/><stop offset="0.75" stop-color="#d8c0b0"/><stop offset="1" stop-color="#8a3a3a"/>
      </radialGradient>
      <!-- one mask: a face of stretched hide, stitched along a seam, holes for eyes and mouth -->
      <g id="hh-face">
        <path d="M0 -22 C13 -22 17 -11 16.5 0 C16 12 9.5 22 0 23 C-9.5 22 -16 12 -16.5 0 C-17 -11 -13 -22 0 -22 Z" fill="url(#hh-hide)" stroke="#2a1a14" stroke-width="1"/>
        <path d="M0 -22 C-2 -12 2 -4 0 6 C-2 14 1 19 0 23" stroke="#4a2a20" stroke-width="0.8" fill="none"/>
        <path d="M-2 -18 l4 1 M-2 -12 l4 1 M-2 -6 l4 1 M-2 0 l4 1 M-2 6 l4 1 M-2 12 l4 1 M-2 18 l4 1" stroke="#1a0e0a" stroke-width="0.7"/>
        <path d="M-15 -4 C-12 -8 -8 -9 -5 -8 M15 -4 C12 -8 8 -9 5 -8" stroke="#5a3a2c" stroke-width="0.6" fill="none"/>
        <path d="M-16 4 l-4 -6 M16 4 l4 -6 M-10 -20 l-3 -6 M10 -20 l3 -6" stroke="#6a2a20" stroke-width="0.8"/>
      </g>
    </defs>
    <!-- the hollow, and faces pressing out through it as through skin -->
    <circle cx="80" cy="84" r="50" fill="url(#hh-void)"/>
    <g opacity="0.3" fill="none" stroke="#5a3a44" stroke-width="0.8">
      <path d="M 70 76 q 4 -6 8 0 M 82 76 q 4 -6 8 0 M 74 90 q 6 6 12 0"/>
      <path d="M 64 96 q 3 -4 6 0 M 72 102 q 4 3 8 0"/>
      <path d="M 88 66 q 3 -3 6 0 M 92 74 q 3 2 6 0"/>
    </g>
    <path d="M 74 92 Q 80 98 86 92 Q 80 104 74 92 Z" fill="#1a0a10" opacity="0.6"/>
    <!-- threads of sinew holding each mask to the hollow -->
    <g fill="none" stroke="#5a1a1a" stroke-width="1.6" stroke-linecap="round" opacity="0.85">
      <path d="M72 78 Q58 62 46 46"/><path d="M90 76 Q104 62 116 52"/><path d="M70 92 Q52 100 38 106"/>
      <path d="M92 94 Q108 104 122 112"/><path d="M80 98 Q82 114 82 130"/>
    </g>
    <g fill="none" stroke="#c87070" stroke-width="0.5" opacity="0.4">
      <path d="M73 77 Q59 61 47 45"/><path d="M91 75 Q105 61 117 51"/><path d="M81 99 Q83 115 83 129"/>
    </g>
    <g class="choir-mask m-grief"><g transform="translate(44 42) rotate(-16)"><g filter="url(#hh-skin)"><use href="#hh-face"/></g>
      <path d="M-11 -7 L-3 -10 M11 -7 L3 -10" stroke="#2a140e" stroke-width="1.6" stroke-linecap="round"/>
      <ellipse cx="-6" cy="-3" rx="3.6" ry="2.8" fill="url(#hh-eye)"/><ellipse cx="6" cy="-3" rx="3.6" ry="2.8" fill="url(#hh-eye)"/>
      <circle cx="-6" cy="-2.5" r="1.4" fill="#1a1410"/><circle cx="6" cy="-2.5" r="1.4" fill="#1a1410"/>
      <circle class="glow" cx="-5.6" cy="-3" r="0.6" fill="#fff" opacity="0.32"/><circle class="glow" cx="6.4" cy="-3" r="0.6" fill="#fff" opacity="0.32"/>
      <path d="M-6 0 C-7 4 -6 8 -7 14 M6 0 C7 5 6 9 7 13" stroke="#6a0a0a" stroke-width="1" fill="none"/>
      <path d="M-5 12 Q0 5 5 12 Q0 10 -5 12 Z" fill="#100404"/>
    </g></g>
    <g class="choir-mask m-rage"><g transform="translate(118 48) rotate(14)"><g filter="url(#hh-skin)"><use href="#hh-face"/></g>
      <path d="M-11 -10 L-3 -5 M11 -10 L3 -5" stroke="#2a140e" stroke-width="2" stroke-linecap="round"/>
      <ellipse cx="-6" cy="-2" rx="3.6" ry="2.4" fill="url(#hh-eye)"/><ellipse cx="6" cy="-2" rx="3.6" ry="2.4" fill="url(#hh-eye)"/>
      <circle cx="-6" cy="-2" r="1.2" fill="#3a0606"/><circle cx="6" cy="-2" r="1.2" fill="#3a0606"/>
      <circle class="glow" cx="-5.6" cy="-2.4" r="0.6" fill="#fff" opacity="0.32"/><circle class="glow" cx="6.4" cy="-2.4" r="0.6" fill="#fff" opacity="0.32"/>
      <path d="M-8 7 L8 7 L6 14 L-6 14 Z" fill="#100404"/>
      <path d="M-7 7 l1.4 3 l1.4 -3 l1.4 3 l1.4 -3 l1.4 3 l1.4 -3 l1.4 3 l1.4 -3 l1.4 3 l1.4 -3" stroke="#cfc4a0" stroke-width="0.6" fill="none"/>
      <path d="M-7 14 l1.4 -3 l1.4 3 l1.4 -3 l1.4 3 l1.4 -3 l1.4 3 l1.4 -3 l1.4 3" stroke="#b8ac88" stroke-width="0.6" fill="none"/>
    </g></g>
    <g class="choir-mask m-delight"><g transform="translate(36 108) rotate(-10)"><g filter="url(#hh-skin)"><use href="#hh-face"/></g>
      <path d="M-10 -7 Q-6 -11 -2 -7 M2 -7 Q6 -11 10 -7" stroke="#2a140e" stroke-width="1.4" fill="none"/>
      <path d="M-9 -2 Q-6 -5 -3 -2 Q-6 0 -9 -2 Z M3 -2 Q6 -5 9 -2 Q6 0 3 -2 Z" fill="url(#hh-eye)"/>
      <circle cx="-6" cy="-2.2" r="1" fill="#1a1410"/><circle cx="6" cy="-2.2" r="1" fill="#1a1410"/>
      <circle class="glow" cx="-5.7" cy="-2.6" r="0.5" fill="#fff" opacity="0.32"/><circle class="glow" cx="6.3" cy="-2.6" r="0.5" fill="#fff" opacity="0.32"/>
      <path d="M-12 4 Q0 20 12 4 Q0 12 -12 4 Z" fill="#100404"/>
      <path d="M-11 5 Q0 13 11 5" stroke="#d8ccaa" stroke-width="1.2" fill="none"/>
      <path d="M-12 4 l-3 -2 M12 4 l3 -2 M-12 4 l-2 6 M12 4 l2 6" stroke="#6a0a0a" stroke-width="0.9"/>
    </g></g>
    <g class="choir-mask m-dread"><g transform="translate(124 112) rotate(18)"><g filter="url(#hh-skin)"><use href="#hh-face"/></g>
      <path d="M-10 -10 Q-6 -13 -2 -10 M2 -10 Q6 -13 10 -10" stroke="#2a140e" stroke-width="1.4" fill="none"/>
      <circle cx="-6" cy="-3" r="4" fill="url(#hh-eye)"/><circle cx="6" cy="-3" r="4" fill="url(#hh-eye)"/>
      <circle cx="-6" cy="-3" r="0.8" fill="#000"/><circle cx="6" cy="-3" r="0.8" fill="#000"/>
      <circle class="glow" cx="-5" cy="-4" r="0.6" fill="#fff" opacity="0.32"/><circle class="glow" cx="7" cy="-4" r="0.6" fill="#fff" opacity="0.32"/>
      <ellipse cx="0" cy="11" rx="4" ry="6" fill="#100404"/>
      <path d="M-3 7 Q0 9 3 7" stroke="#3a1010" stroke-width="0.6" fill="none"/>
    </g></g>
    <g class="choir-mask m-blank"><g transform="translate(82 136) rotate(4) scale(0.9)"><g filter="url(#hh-skin)"><use href="#hh-face"/></g>
      <path d="M-9 -3 L-3 -3 M3 -3 L9 -3" stroke="#3a2018" stroke-width="1.2"/>
      <path d="M-9 -3 l1 1 l1 -1 l1 1 l1 -1 l1 1 l1 -1 M3 -3 l1 1 l1 -1 l1 1 l1 -1 l1 1 l1 -1" stroke="#1a0e0a" stroke-width="0.6" fill="none"/>
      <circle class="glow" cx="-6" cy="-3" r="0.7" fill="#fff" opacity="0.32"/><circle class="glow" cx="6" cy="-3" r="0.7" fill="#fff" opacity="0.32"/>
      <path d="M-6 10 L6 10" stroke="#3a2018" stroke-width="1.2"/>
      <path d="M-6 10 l1.2 1.2 l1.2 -1.2 l1.2 1.2 l1.2 -1.2 l1.2 1.2 l1.2 -1.2 l1.2 1.2 l1.2 -1.2 l1.2 1.2 l1.2 -1.2" stroke="#1a0e0a" stroke-width="0.6" fill="none"/>
      <path d="M-5 -1 q -1 3 0 5 M5 -1 q 1 3 0 5" stroke="#6a0a0a" stroke-width="0.8" fill="none"/>
    </g></g>
    </svg>
  `,

  // ─── Asmodeus ────────────────────────────────────────────────────────────
  // The Lord of the Nine, as a mortal mind can bear to see him: a towering,
  // starved devil of raw, wet red flesh split by glowing fissures. A
  // skull-long face with the skin drawn tight, a lipless grin of too many
  // teeth, eyes like holes into a furnace. Great ridged horns; wings of torn
  // membrane over bare bone; chains with hooks; the ruby rod in one hand,
  // the other reaching for you; thick, scaled red legs on bare clawed feet. Behind him, faces in the flames.
  'Asmodeus': horrorAsmodeus(0),

  // ─── The dragons ─────────────────────────────────────────────────────────
  // Rearing and roaring over the bones of the last party: wet, scaled hide,
  // ribs straining under it, cracked belly plates, wings torn to the bone,
  // a maw of raw gums and hooked teeth lit by what's coming up its throat.
  'Red Dragon':   horrorDragon('hdr', DRAGON_PALETTES.red,   'fire',      'Red Dragon: a scarred, wet-scaled red dragon rearing over bones, fire pouring from its maw'),
  'Black Dragon': horrorDragon('hdk', DRAGON_PALETTES.black, 'acid',      'Black Dragon: a black dragon spewing acid onto a dissolving skull'),
  'Blue Dragon':  horrorDragon('hdb', DRAGON_PALETTES.blue,  'lightning', 'Blue Dragon: a blue dragon with lightning crackling from its jaws'),
  'Green Dragon': horrorDragon('hdg', DRAGON_PALETTES.green, 'gas',       'Green Dragon: a green dragon breathing a cloud of poison with faces in it'),
  'White Dragon': horrorDragon('hdw', DRAGON_PALETTES.white, 'frost',     'White Dragon: a white dragon breathing a blast of frost and ice'),
  'Gold Dragon':  horrorDragon('hdo', DRAGON_PALETTES.gold,  'gold',      'Gold Dragon: a gold dragon breathing glittering gold dust, a split sack of coins in its claw'),


  // ─── Vampire ─────────────────────────────────────────────────────────────
  // Not the handsome count: the old thing underneath. A bald, veined skull
  // with bat's ears; red eyes sunk in bruised sockets; rat's incisors and
  // fangs over a chin wet with blood; a hunched black coat; long spidery
  // fingers with black nails reaching for your throat. Bats behind.
  'Vampire': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Vampire: a bald, rat-toothed, bat-eared ancient vampire with blood on his chin, long-nailed fingers reaching">
    <defs>
      ${horrorSkinFilter('hv-skin', { freq: '0.14 0.18', scale: 2, seed: 17 })}
      <radialGradient id="hv-flesh" cx="45%" cy="30%" r="75%"><stop offset="0" stop-color="#dcdcd0"/><stop offset="0.5" stop-color="#9a9e98"/><stop offset="1" stop-color="#3a3e40"/></radialGradient>
      <radialGradient id="hv-eye" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffd0c0"/><stop offset="0.4" stop-color="#e01010"/><stop offset="1" stop-color="#400000" stop-opacity="0"/></radialGradient>
      <radialGradient id="hv-moon" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#c8d8e8" stop-opacity="0.35"/><stop offset="1" stop-color="#c8d8e8" stop-opacity="0"/></radialGradient>
      <linearGradient id="hv-coat" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1a1a20"/><stop offset="0.5" stop-color="#0a0a0e"/><stop offset="1" stop-color="#020204"/></linearGradient>
    </defs>
    <circle cx="80" cy="56" r="52" fill="url(#hv-moon)"/>
    <!-- bats -->
    <g fill="#0a0a0c">
      <path d="M 22 26 q 4 -4 8 0 q 2 -2 4 0 q 4 -4 8 0 q -4 2 -8 4 l -2 2 l -2 -2 q -4 -2 -8 -4 Z"/>
      <path d="M 122 18 q 3 -3 6 0 q 1.5 -1.5 3 0 q 3 -3 6 0 q -3 1.5 -6 3 l -1.5 1.5 l -1.5 -1.5 q -3 -1.5 -6 -3 Z"/>
      <path d="M 134 44 q 2 -2 4 0 q 1 -1 2 0 q 2 -2 4 0 q -2 1 -4 2 l -1 1 l -1 -1 q -2 -1 -4 -2 Z"/>
    </g>
    <!-- the coat: hunched shoulders, a high stiff collar -->
    <path d="M 26 160 C 28 128, 40 104, 58 96 L 102 96 C 120 104, 132 128, 134 160 Z" fill="url(#hv-coat)"/>
    <path d="M 52 98 L 40 66 L 62 88 Z M 108 98 L 120 66 L 98 88 Z" fill="#14141a" stroke="#2a2a34" stroke-width="0.8"/>
    <path d="M 70 98 L 80 130 L 90 98" fill="#2a0408"/>
    <path d="M 74 100 C 76 108, 78 114, 80 118" stroke="#6a0a0a" stroke-width="1.4" fill="none"/>
    <!-- the neck, stringy -->
    <path d="M 70 80 L 90 80 L 92 98 L 68 98 Z" fill="url(#hv-flesh)" filter="url(#hv-skin)"/>
    <path d="M 74 96 L 76 82 M 86 96 L 84 82" stroke="#3a3e40" stroke-width="1.2"/>
    <!-- bat ears -->
    <path d="M 56 46 C 44 36, 40 22, 42 12 C 50 22, 56 32, 60 40 Z" fill="url(#hv-flesh)" filter="url(#hv-skin)"/>
    <path d="M 104 46 C 116 36, 120 22, 118 12 C 110 22, 104 32, 100 40 Z" fill="url(#hv-flesh)" filter="url(#hv-skin)"/>
    <path d="M 54 40 C 48 32, 46 24, 46 18 M 106 40 C 112 32, 114 24, 114 18" stroke="#5a3a40" stroke-width="1" fill="none"/>
    <!-- the head: a long bald skull, the skin shrunk to it -->
    <path d="M 58 40 C 56 20, 66 8, 80 8 C 94 8, 104 20, 102 40 C 102 56, 96 72, 88 82 C 84 86, 76 86, 72 82 C 64 72, 58 56, 58 40 Z" fill="url(#hv-flesh)" filter="url(#hv-skin)"/>
    <path d="M 66 14 C 70 20, 68 26, 72 30 M 92 12 C 88 18, 92 24, 88 30 M 80 9 C 82 15, 79 20, 81 26" stroke="#5a6a8a" stroke-width="0.7" fill="none" opacity="0.8"/>
    <path d="M 62 52 C 64 60, 68 66, 72 70 M 98 52 C 96 60, 92 66, 88 70" stroke="#3a3e40" stroke-width="1.6" fill="none" opacity="0.8"/>
    <!-- brow, and red eyes deep in bruised sockets -->
    <path d="M 62 36 Q 70 30 78 37 M 82 37 Q 90 30 98 36" stroke="#2a2e30" stroke-width="2.4" fill="none"/>
    <ellipse cx="70" cy="40" rx="7" ry="5" fill="#3a2a34"/><ellipse cx="90" cy="40" rx="7" ry="5" fill="#3a2a34"/>
    <circle cx="70" cy="40" r="5" fill="url(#hv-eye)"/><circle cx="90" cy="40" r="5" fill="url(#hv-eye)"/>
    <circle cx="70" cy="40" r="1.1" fill="#200000"/><circle cx="90" cy="40" r="1.1" fill="#200000"/>
    <circle cx="69.2" cy="39.2" r="0.5" fill="#fff"/><circle cx="89.2" cy="39.2" r="0.5" fill="#fff"/>
    <path d="M 64 44 Q 70 47 76 44 M 84 44 Q 90 47 96 44" stroke="#5a3a44" stroke-width="0.8" fill="none"/>
    <!-- a hooked nose -->
    <path d="M 80 40 C 78 48, 74 54, 77 58 C 79 60, 82 60, 84 57" stroke="#4a4e50" stroke-width="1.6" fill="none"/>
    <!-- the mouth: thin lips peeled back from rat's incisors and long fangs, blood running -->
    <path d="M 70 64 Q 80 60 90 64 Q 80 72 70 64 Z" fill="#1a0404"/>
    <path d="M 70 64 Q 80 61 90 64" stroke="#6a3a40" stroke-width="1.2" fill="none"/>
    <path d="M 77 63 L 77 70 L 79.6 70 L 79.6 63 Z M 80.4 63 L 80.4 70 L 83 70 L 83 63 Z" fill="#e8e0c8" stroke="#6a5a40" stroke-width="0.3"/>
    <path d="M 72 64 L 73.4 72 L 74.8 64.4 Z M 88 64 L 86.6 72 L 85.2 64.4 Z" fill="#f0e8d0" stroke="#6a5a40" stroke-width="0.3"/>
    <path d="M 73.4 72 C 73 76, 74 80, 72 86 M 86.6 72 C 87 78, 86 82, 88 90 M 80 70 C 80 74, 81 78, 80 82" stroke="#8a0606" stroke-width="1.6" fill="none"/>
    <path d="M 72 76 q 1 2 0 4 M 88 80 q 1 2 0 5" stroke="#b01010" stroke-width="1" fill="none"/>
    <!-- hands: long, spidery fingers with black nails, one reaching close -->
    <g filter="url(#hv-skin)">
      <path d="M 30 120 C 34 112, 40 108, 46 108 L 50 116 C 44 118, 38 122, 34 128 Z" fill="url(#hv-flesh)"/>
      <path d="M 114 120 C 120 110, 126 106, 132 106 L 134 114 C 128 116, 122 122, 118 128 Z" fill="url(#hv-flesh)"/>
    </g>
    <g stroke="#9a9e98" stroke-width="2.4" stroke-linecap="round" fill="none">
      <path d="M 36 112 C 30 100, 26 90, 24 80"/><path d="M 40 110 C 36 96, 34 84, 34 72"/><path d="M 44 108 C 44 96, 44 84, 46 74"/><path d="M 48 110 C 52 100, 54 92, 58 86"/><path d="M 32 120 C 26 118, 20 114, 16 110"/>
      <path d="M 120 110 C 124 98, 128 88, 132 80"/><path d="M 124 108 C 130 96, 134 86, 138 78"/><path d="M 128 106 C 134 96, 140 90, 146 86"/><path d="M 116 114 C 116 102, 118 94, 120 88"/>
    </g>
    <g stroke="#5a5e60" stroke-width="0.6" fill="none"><path d="M 28 94 l 2 -1 M 35 88 l 2 -1 M 44 88 l 2 0 M 128 90 l 2 1 M 135 88 l 2 1"/></g>
    <g stroke="#0a0a0a" stroke-width="2" stroke-linecap="round">
      <path d="M 24 80 l -1 -6"/><path d="M 34 72 l 0 -6"/><path d="M 46 74 l 1 -6"/><path d="M 58 86 l 3 -5"/><path d="M 16 110 l -5 -3"/>
      <path d="M 132 80 l 2 -6"/><path d="M 138 78 l 3 -5"/><path d="M 146 86 l 5 -3"/><path d="M 120 88 l 1 -6"/>
    </g>
    </svg>
  `,

  // ─── Giant Leech ─────────────────────────────────────────────────────────
  // After the swamp things of Attack of the Giant Leeches: a man-sized,
  // rubbery, glistening body in folds of wrinkled hide, rearing up out of
  // black water, rows of suckers down its front, a round mouth ringed with
  // teeth around three jaws. A drowned man's hand breaks the surface.
  'Giant Leech': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Giant Leech: a huge, wrinkled, glistening leech rearing from black swamp water, rows of suckers on its front, a round mouth of teeth">
    <defs>
      ${wetSkinFilter('hl-hide', { freq: '0.035 0.16', seed: 23, shine: 0.6, elevation: 45 })}
      <linearGradient id="hl-body" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1a1608"/><stop offset="0.4" stop-color="#5a5026"/><stop offset="0.7" stop-color="#3a3416"/><stop offset="1" stop-color="#0e0c04"/></linearGradient>
      <radialGradient id="hl-mouth" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#000"/><stop offset="0.5" stop-color="#2a0404"/><stop offset="0.8" stop-color="#6a1a1a"/><stop offset="1" stop-color="#8a5a4a"/></radialGradient>
      <radialGradient id="hl-sucker" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#1a1408"/><stop offset="0.6" stop-color="#4a3a20"/><stop offset="1" stop-color="#8a7a4a"/></radialGradient>
      <linearGradient id="hl-water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a2018"/><stop offset="1" stop-color="#020302"/></linearGradient>
      <g id="hl-suck"><ellipse rx="4" ry="2.8" fill="url(#hl-sucker)" stroke="#0a0804" stroke-width="0.5"/><ellipse rx="1.6" ry="1" fill="#0a0604"/><path d="M -3 -1.2 Q 0 -2.4 3 -1.2" stroke="#c8b888" stroke-width="0.4" fill="none" opacity="0.6"/></g>
    </defs>
    <!-- reeds and mist over the swamp -->
    <g stroke="#1e2a14" stroke-width="1.6" stroke-linecap="round"><path d="M 10 132 C 12 110, 10 96, 14 80"/><path d="M 18 132 C 18 116, 22 104, 20 92"/><path d="M 146 132 C 144 112, 148 100, 144 86"/><path d="M 152 134 C 152 120, 156 108, 154 98"/></g>
    <path d="M 14 80 l -2 -8 l 4 6 Z M 144 86 l 2 -8 l -4 6 Z" fill="#3a2a14"/>
    <!-- the body: a great rubbery column, folded and ridged, rearing up -->
    <path d="M 46 140 C 40 110, 42 80, 52 56 C 60 36, 72 24, 86 24 C 100 26, 110 40, 114 60 C 120 86, 118 116, 112 140 Z" fill="url(#hl-body)" filter="url(#hl-hide)"/>
    <g stroke="#0e0c04" stroke-width="1.6" fill="none" opacity="0.85">
      <path d="M 50 120 C 66 126, 96 126, 114 118"/><path d="M 48 104 C 66 110, 98 110, 116 102"/><path d="M 48 88 C 66 94, 98 94, 116 86"/>
      <path d="M 52 72 C 68 78, 98 78, 114 70"/><path d="M 58 56 C 72 62, 96 62, 110 54"/><path d="M 66 42 C 76 46, 94 46, 104 40"/>
    </g>
    <g stroke="#a8a070" stroke-width="0.7" fill="none" opacity="0.4">
      <path d="M 50 118 C 66 124, 96 124, 114 116"/><path d="M 48 102 C 66 108, 98 108, 116 100"/><path d="M 48 86 C 66 92, 98 92, 116 84"/><path d="M 52 70 C 68 76, 98 76, 114 68"/>
    </g>
    <!-- wrinkles everywhere between the folds -->
    <path d="M 56 96 q 4 -3 8 0 M 70 98 q 4 -2 8 1 M 92 98 q 4 -3 8 0 M 60 112 q 3 -2 7 0 M 98 112 q 4 -2 7 1 M 64 80 q 4 -3 8 0 M 96 80 q 3 -2 7 0" stroke="#0e0c04" stroke-width="0.8" fill="none" opacity="0.7"/>
    <!-- rows of suckers down its front -->
    <g>
      <use href="#hl-suck" x="70" y="66"/><use href="#hl-suck" x="82" y="68"/><use href="#hl-suck" x="94" y="66"/>
      <use href="#hl-suck" x="64" y="82"/><use href="#hl-suck" x="76" y="84"/><use href="#hl-suck" x="88" y="84"/><use href="#hl-suck" x="100" y="82"/>
      <use href="#hl-suck" x="62" y="98"/><use href="#hl-suck" x="74" y="100"/><use href="#hl-suck" x="88" y="100"/><use href="#hl-suck" x="102" y="98"/>
      <use href="#hl-suck" x="66" y="114"/><use href="#hl-suck" x="80" y="116"/><use href="#hl-suck" x="94" y="114"/>
    </g>
    <!-- the head end, swollen, and the round mouth: rings of teeth around three jaws -->
    <ellipse cx="84" cy="36" rx="20" ry="14" fill="url(#hl-body)" filter="url(#hl-hide)"/>
    <ellipse cx="86" cy="36" rx="13" ry="10" fill="url(#hl-mouth)"/>
    <g fill="#d8ccaa" stroke="#4a3a20" stroke-width="0.2">
      ${Array.from({ length: 18 }, (_, i) => { const a = (i / 18) * Math.PI * 2; const x = 86 + Math.cos(a) * 11.4, y = 36 + Math.sin(a) * 8.6; const ix = 86 + Math.cos(a) * 8.6, iy = 36 + Math.sin(a) * 6.4; const px = -Math.sin(a) * 1, py = Math.cos(a) * 0.8; return `<path d="M ${(x + px).toFixed(1)} ${(y + py).toFixed(1)} L ${ix.toFixed(1)} ${iy.toFixed(1)} L ${(x - px).toFixed(1)} ${(y - py).toFixed(1)} Z"/>`; }).join('')}
    </g>
    <!-- three jaws, each a fleshy ridge edged with tiny teeth, meeting at the throat -->
    <g stroke="#3a0606" stroke-width="2.6" stroke-linecap="round"><path d="M 86 36 L 86 28.6"/><path d="M 86 36 L 79.6 40"/><path d="M 86 36 L 92.4 40"/></g>
    <g stroke="#c8b898" stroke-width="0.5" stroke-dasharray="0.6 0.8" stroke-linecap="round"><path d="M 85 35 L 85 29"/><path d="M 87 35 L 87 29"/><path d="M 85 37 L 80 40"/><path d="M 87 37 L 92 40"/></g>
    <ellipse cx="86" cy="36" rx="2.4" ry="1.8" fill="#000"/>
    <path d="M 74 46 C 74 52, 72 56, 74 62 M 98 46 C 99 50, 97 54, 99 58" stroke="#6a0a0a" stroke-width="1.6" fill="none"/>
    <path d="M 70 30 C 74 24, 82 22, 88 22" stroke="#d8d0a0" stroke-width="1" fill="none" opacity="0.5"/>
    <!-- black swamp water it's rising from; a drowned man's hand -->
    <path d="M 0 132 C 30 128, 50 136, 80 132 C 110 128, 130 136, 160 132 L 160 160 L 0 160 Z" fill="url(#hl-water)"/>
    <path d="M 40 136 q 10 -3 20 0 M 96 136 q 10 -3 20 0 M 20 146 q 8 -2 16 0 M 120 148 q 8 -2 16 0" stroke="#4a5a40" stroke-width="0.8" fill="none" opacity="0.6"/>
    <ellipse cx="80" cy="138" rx="40" ry="4" fill="none" stroke="#3a4a30" stroke-width="0.8" opacity="0.7"/>
    <g transform="translate(130 140)">
      <path d="M -3 6 L -2 -6 C -2 -9, 2 -9, 2 -6 L 3 6 Z" fill="#8a9488"/>
      <path d="M -2 -6 l -1.6 -6 M 0 -7 l 0 -7 M 2 -6 l 1.4 -6 M 2.6 -3 l 3 -3" stroke="#8a9488" stroke-width="1.4" stroke-linecap="round"/>
      <path d="M -2 -1 l 4 0" stroke="#3a4a40" stroke-width="0.4"/>
    </g>
    </svg>
  `,


  // ─── Skeleton ────────────────────────────────────────────────────────────
  // Yellowed, cracked bone held together by nothing at all: a skull with a
  // hole stove in its crown, the jaw hanging askew, pinpricks of cold light
  // in the sockets; broken ribs, rags of rotted leather and rusted mail, a
  // notched and rusted sword raised.
  'Skeleton': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Skeleton: yellowed, cracked bones in rusted mail rags, a stove-in skull with cold points of light for eyes, a rusted sword raised">
    <defs>
      ${horrorSkinFilter('hs-bone', { freq: '0.2 0.26', scale: 2.2, seed: 31, k: 1.2 })}
      <linearGradient id="hs-b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e6dcbc"/><stop offset="0.6" stop-color="#a89a72"/><stop offset="1" stop-color="#4a4230"/></linearGradient>
      <radialGradient id="hs-eye" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#e8f8ff"/><stop offset="0.35" stop-color="#60b0ff"/><stop offset="1" stop-color="#1040a0" stop-opacity="0"/></radialGradient>
      <linearGradient id="hs-rust" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a5a3a"/><stop offset="1" stop-color="#3a1c0c"/></linearGradient>
    </defs>
    <ellipse cx="80" cy="154" rx="40" ry="4" fill="#000" opacity="0.6"/>
    <g filter="url(#hs-bone)" fill="url(#hs-b)" stroke="#2a2418" stroke-width="0.6">
      <!-- legs -->
      <path d="M 68 112 L 64 132 L 62 150 L 67 150 L 70 132 L 73 114 Z"/><path d="M 88 112 L 92 132 L 96 150 L 91 150 L 87 132 L 84 114 Z"/>
      <circle cx="66" cy="131" r="3"/><circle cx="91" cy="131" r="3"/>
      <path d="M 56 150 L 70 150 L 70 153 L 56 153 Z M 88 150 L 102 150 L 102 153 L 88 153 Z"/>
      <!-- pelvis and spine -->
      <path d="M 64 104 C 66 98, 94 98, 96 104 C 96 112, 88 116, 80 116 C 72 116, 64 112, 64 104 Z"/>
      <path d="M 78 60 L 82 60 L 82 100 L 78 100 Z"/>
      <!-- ribs, some snapped -->
      <path d="M 79 64 C 66 64, 60 70, 62 76 L 65 76 C 64 71, 70 68, 79 68 Z M 81 64 C 94 64, 100 70, 98 76 L 95 76 C 96 71, 90 68, 81 68 Z"/>
      <path d="M 79 72 C 64 72, 58 80, 61 86 L 64 86 C 62 81, 68 76, 79 76 Z M 81 72 C 92 72, 98 76, 99 80 L 96 80 C 95 77, 90 76, 81 76 Z"/>
      <path d="M 79 80 C 66 80, 61 88, 64 93 L 67 92 C 65 88, 70 84, 79 84 Z M 81 80 C 94 80, 99 88, 96 93 L 93 92 C 95 88, 90 84, 81 84 Z"/>
      <path d="M 79 88 C 70 88, 66 93, 68 97 L 71 96 C 70 93, 73 91, 79 92 Z"/>
      <!-- shoulders and arms: one raised with the sword, one reaching -->
      <path d="M 62 60 L 98 60 L 98 64 L 62 64 Z"/>
      <path d="M 98 62 L 112 48 L 116 30 L 120 31 L 116 50 L 101 66 Z"/>
      <path d="M 62 62 L 50 78 L 42 92 L 46 94 L 54 80 L 65 66 Z"/>
      <path d="M 42 92 l -6 4 M 43 94 l -4 7 M 45 95 l -1 8 M 47 94 l 2 7" stroke-width="1.8" fill="none" stroke="#c8bc94"/>
      <!-- the skull -->
      <path d="M 66 34 C 64 18, 72 10, 80 10 C 90 10, 98 18, 96 34 C 96 40, 92 44, 90 48 L 72 48 C 68 44, 66 40, 66 34 Z"/>
    </g>
    <!-- the jaw, hanging askew -->
    <path d="M 72 48 C 72 54, 76 58, 82 58 C 88 57, 92 52, 91 47 L 88 49 C 86 53, 80 54, 76 50 Z" fill="url(#hs-b)" stroke="#2a2418" stroke-width="0.6" transform="rotate(8 80 48)"/>
    <g fill="#e8dfc0" stroke="#3a3020" stroke-width="0.3"><path d="M 73 46 h 3 v 3 h -3 Z M 77 46 h 3 v 3.4 h -3 Z M 81 46 h 3 v 3 h -3 Z M 85 46 h 3 v 3 h -3 Z"/></g>
    <!-- sockets, a cold point of light in each; the nose a black hole; the crown stove in -->
    <path d="M 68 28 C 68 22, 76 22, 77 28 C 77 34, 69 34, 68 28 Z M 84 28 C 85 22, 93 22, 93 28 C 92 34, 84 34, 84 28 Z" fill="#050403"/>
    <circle cx="72.6" cy="29" r="3.4" fill="url(#hs-eye)"/><circle cx="88.6" cy="29" r="3.4" fill="url(#hs-eye)"/>
    <path d="M 80 34 L 77 41 L 83 41 Z" fill="#050403"/>
    <path d="M 74 13 L 79 11 L 82 16 L 78 20 L 75 18 Z" fill="#100c08"/>
    <path d="M 82 16 L 88 22 L 86 26 M 74 18 L 70 24" stroke="#2a2418" stroke-width="0.7" fill="none"/>
    <!-- rags of rotted leather and rusted mail -->
    <path d="M 62 98 L 98 98 L 100 112 L 92 108 L 88 118 L 82 110 L 76 120 L 72 108 L 64 114 Z" fill="url(#hs-rust)" opacity="0.85"/>
    <g fill="none" stroke="#5a3a20" stroke-width="0.6" opacity="0.8"><path d="M 66 100 q 2 3 4 0 q 2 3 4 0 q 2 3 4 0 q 2 3 4 0 q 2 3 4 0 q 2 3 4 0 q 2 3 4 0 q 2 3 4 0"/></g>
    <path d="M 60 60 L 66 68 L 60 74 Z M 100 60 L 94 68 L 100 72 Z" fill="#3a2a1a" opacity="0.8"/>
    <!-- the sword: rusted, notched -->
    <path d="M 116 30 L 124 -2 L 128 -1 L 121 31 Z" fill="url(#hs-rust)" stroke="#2a1408" stroke-width="0.5"/>
    <path d="M 124 6 l 2 1 M 122 14 l 2 1 M 125 2 l -1 2" stroke="#0a0604" stroke-width="1"/>
    <path d="M 110 30 L 126 34" stroke="#4a3a2a" stroke-width="3" stroke-linecap="round"/>
    </svg>
  `,

  // ─── Zombie ──────────────────────────────────────────────────────────────
  // Bloated, grey-green and splitting: the cheek torn open to the teeth,
  // one eye milky, the other socket empty and weeping, the jaw slack; a
  // shredded shirt over a belly gone purple, ribs showing where the skin has
  // gone; arms out, fingers missing; flies.
  'Zombie': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Zombie: a bloated, grey-green corpse with its cheek torn to the teeth, one milky eye, arms reaching">
    <defs>
      ${wetSkinFilter('hz-skin', { freq: '0.3 0.36', seed: 41, shine: 0.18 })}
      <radialGradient id="hz-flesh" cx="45%" cy="30%" r="80%"><stop offset="0" stop-color="#a4ae8a"/><stop offset="0.5" stop-color="#6a7454"/><stop offset="1" stop-color="#2a3020"/></radialGradient>
      <radialGradient id="hz-bruise" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#5a3a5a" stop-opacity="0.8"/><stop offset="1" stop-color="#5a3a5a" stop-opacity="0"/></radialGradient>
    </defs>
    <ellipse cx="80" cy="154" rx="42" ry="4" fill="#000" opacity="0.6"/>
    <!-- legs, dragging -->
    <path d="M 66 120 L 62 152 L 72 152 L 76 122 Z M 84 120 L 92 150 L 100 150 L 92 120 Z" fill="#2a2620"/>
    <!-- the body: bloated, the shirt in ribbons -->
    <path d="M 56 72 C 50 90, 52 110, 60 124 L 100 124 C 108 110, 110 90, 104 72 C 96 64, 64 64, 56 72 Z" fill="url(#hz-flesh)" filter="url(#hz-skin)"/>
    <ellipse cx="82" cy="106" rx="16" ry="12" fill="url(#hz-bruise)"/>
    <path d="M 60 84 Q 70 80 76 86 M 60 92 Q 70 88 76 94 M 60 100 Q 68 96 74 102" stroke="#1a1e14" stroke-width="1.4" fill="none"/>
    <path d="M 58 80 L 66 78 L 76 90 L 70 104 L 60 100 Z" fill="#2a1414" opacity="0.6"/>
    <path d="M 56 72 C 64 66, 96 66, 104 72 L 106 92 L 98 86 L 96 104 L 90 94 L 86 112 L 80 98 L 74 116 L 72 98 L 64 106 L 66 90 Z" fill="#6a6450" opacity="0.92"/>
    <path d="M 70 70 l 4 30 M 90 70 l -2 34 M 100 80 l -4 20" stroke="#3a3628" stroke-width="0.8" opacity="0.8"/>
    <!-- arms out, reaching, fingers missing -->
    <path d="M 58 76 C 44 80, 32 84, 20 84 L 20 92 C 34 92, 46 90, 58 86 Z" fill="url(#hz-flesh)" filter="url(#hz-skin)"/>
    <path d="M 102 76 C 116 78, 128 78, 140 74 L 142 82 C 128 86, 116 88, 102 86 Z" fill="url(#hz-flesh)" filter="url(#hz-skin)"/>
    <g stroke="#6a7454" stroke-width="2.6" stroke-linecap="round"><path d="M 20 86 l -8 -2 M 20 89 l -9 1 M 20 91 l -5 4"/><path d="M 141 76 l 8 -3 M 142 79 l 7 1"/></g>
    <path d="M 12 84 l -2 -0.4 M 11 90 l -2 0.2" stroke="#3a1414" stroke-width="2"/>
    <path d="M 30 86 C 32 88, 30 90, 32 92" stroke="#3a1414" stroke-width="1.6" fill="none"/>
    <!-- the neck and head, lolling -->
    <path d="M 72 56 L 88 56 L 90 70 L 70 70 Z" fill="url(#hz-flesh)" filter="url(#hz-skin)"/>
    <path d="M 62 32 C 60 16, 70 8, 80 8 C 92 8, 100 16, 98 32 C 98 46, 92 58, 82 60 C 70 60, 62 48, 62 32 Z" fill="url(#hz-flesh)" filter="url(#hz-skin)" transform="rotate(-8 80 34)"/>
    <g transform="rotate(-8 80 34)">
      <path d="M 66 12 q 4 4 2 10 M 72 8 q 2 6 -1 10 M 90 10 q -2 6 2 10" stroke="#2a2a20" stroke-width="1" fill="none" opacity="0.7"/>
      <!-- one eye milky, the other socket empty and weeping -->
      <ellipse cx="72" cy="30" rx="5" ry="4" fill="#1a1a14"/>
      <ellipse cx="72" cy="30" rx="3.6" ry="2.8" fill="#d8dcc8"/><circle cx="72.4" cy="30.4" r="1.2" fill="#a8aca0"/>
      <ellipse cx="89" cy="30" rx="5" ry="4.2" fill="#050504"/>
      <path d="M 88 34 C 88 38, 90 40, 89 46" stroke="#3a2020" stroke-width="1.4" fill="none"/>
      <path d="M 80 32 L 78 40 L 82 40 Z" fill="#1a1a14"/>
      <!-- the cheek torn open to the teeth, the jaw slack -->
      <path d="M 70 44 C 74 42, 88 42, 92 44 C 92 52, 86 56, 80 56 C 74 56, 70 52, 70 44 Z" fill="#1a0606"/>
      <path d="M 86 42 C 92 40, 96 44, 96 50 C 92 52, 88 50, 86 46 Z" fill="#5a1414"/>
      <g fill="#c8bc94"><path d="M 72 44 h 2.4 v 3 h -2.4 Z M 75.4 44 h 2.4 v 3.4 h -2.4 Z M 78.8 44 h 2.4 v 2.6 h -2.4 Z M 87 44 l 1.4 4 l 1.4 -4 Z M 90 45 l 1 3 l 1.2 -3 Z"/></g>
      <path d="M 74 54 h 2.4 v -3 h -2.4 Z M 80 55 h 2.4 v -3 h -2.4 Z" fill="#a89c74"/>
    </g>
    <!-- flies -->
    <g fill="#0a0a0a"><circle cx="104" cy="22" r="1"/><circle cx="110" cy="30" r="0.9"/><circle cx="58" cy="18" r="1"/><circle cx="96" cy="100" r="0.9"/><circle cx="50" cy="60" r="0.8"/></g>
    <g stroke="#3a3a3a" stroke-width="0.4" fill="none"><path d="M 102 21 l -1.5 -1 M 106 21 l 1.5 -1 M 108 29 l -1.4 -1 M 112 29 l 1.4 -1"/></g>
    </svg>
  `,

  // ─── Werewolf ────────────────────────────────────────────────────────────
  // Half-turned under the moon: a wolf's skull pushing through a man's face,
  // matted fur in ragged tufts, yellow eyes, the muzzle wrinkled back off
  // long wet fangs; a hunched, muscled body in the rags of its clothes,
  // hands become hooked claws.
  'Werewolf': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Werewolf: a snarling wolf-headed, hunched, matted beast with yellow eyes and long wet fangs, under the moon">
    <defs>
      ${horrorSkinFilter('hw-fur', { freq: '0.35 0.08', scale: 2.4, seed: 51, k: 1.25 })}
      <radialGradient id="hw-moon" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#f0f0e0"/><stop offset="0.6" stop-color="#c8c8b0"/><stop offset="1" stop-color="#c8c8b0" stop-opacity="0"/></radialGradient>
      <linearGradient id="hw-pelt" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="#7a6a54"/><stop offset="0.5" stop-color="#4a3c2c"/><stop offset="1" stop-color="#1a140c"/></linearGradient>
      <radialGradient id="hw-eye" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff8c0"/><stop offset="0.4" stop-color="#ffc020"/><stop offset="1" stop-color="#804000" stop-opacity="0"/></radialGradient>
    </defs>
    <circle cx="124" cy="30" r="24" fill="url(#hw-moon)" opacity="0.7"/>
    <ellipse cx="80" cy="154" rx="44" ry="4" fill="#000" opacity="0.6"/>
    <!-- haunches and legs, bent like a dog's -->
    <path d="M 58 112 C 50 124, 52 140, 60 152 L 70 152 C 66 140, 68 128, 72 118 Z M 102 112 C 110 124, 108 140, 100 152 L 90 152 C 94 140, 92 128, 88 118 Z" fill="url(#hw-pelt)" filter="url(#hw-fur)"/>
    <path d="M 56 152 l -4 3 M 60 152 l -1 4 M 64 152 l 1 4 M 104 152 l 4 3 M 100 152 l 1 4 M 96 152 l -1 4" stroke="#0a0806" stroke-width="1.8" stroke-linecap="round"/>
    <!-- the torn trousers -->
    <path d="M 58 108 L 102 108 L 104 124 L 96 120 L 92 130 L 84 120 L 76 132 L 70 120 L 62 126 Z" fill="#2a2a34"/>
    <!-- a hunched, heaving body, the shirt split across the back -->
    <path d="M 50 70 C 44 86, 48 102, 58 112 L 102 112 C 112 102, 116 86, 110 70 C 100 58, 60 58, 50 70 Z" fill="url(#hw-pelt)" filter="url(#hw-fur)"/>
    <path d="M 66 80 C 70 76, 78 76, 80 82 C 82 76, 90 76, 94 80 M 70 92 Q 80 88 90 92 M 72 100 Q 80 97 88 100" stroke="#140e08" stroke-width="1.4" fill="none" opacity="0.8"/>
    <path d="M 50 70 L 44 76 L 52 78 L 46 86 L 54 86 M 110 70 L 116 76 L 108 78 L 114 86 L 106 86" fill="none" stroke="#7a6a54" stroke-width="1.6"/>
    <path d="M 52 64 L 64 70 L 58 86 Z" fill="#3a4a5a" opacity="0.7"/>
    <!-- arms: long, corded, ending in hooked claws -->
    <path d="M 54 70 C 42 82, 34 98, 30 116 L 38 118 C 42 102, 50 88, 60 78 Z M 106 70 C 118 82, 126 98, 130 116 L 122 118 C 118 102, 110 88, 100 78 Z" fill="url(#hw-pelt)" filter="url(#hw-fur)"/>
    <g stroke="#0a0806" stroke-width="2.2" stroke-linecap="round" fill="none">
      <path d="M 30 116 C 26 122, 24 126, 22 132"/><path d="M 33 118 C 31 124, 31 128, 30 134"/><path d="M 37 118 C 37 124, 38 128, 38 134"/>
      <path d="M 130 116 C 134 122, 136 126, 138 132"/><path d="M 127 118 C 129 124, 129 128, 130 134"/><path d="M 123 118 C 123 124, 122 128, 122 134"/>
    </g>
    <g stroke="#e8e0c8" stroke-width="1" stroke-linecap="round"><path d="M 22 132 l -1 3"/><path d="M 30 134 l 0 3"/><path d="M 38 134 l 0 3"/><path d="M 138 132 l 1 3"/><path d="M 130 134 l 0 3"/><path d="M 122 134 l 0 3"/></g>
    <!-- the head: a wolf's skull pushing out through a man's face -->
    <path d="M 58 34 L 50 12 L 66 26 Z M 102 34 L 110 12 L 94 26 Z" fill="#3a2c1e" stroke="#1a140c" stroke-width="0.6"/>
    <path d="M 56 12 L 62 24 M 104 12 L 98 24" stroke="#8a6a5a" stroke-width="1.2"/>
    <path d="M 58 36 C 56 22, 68 16, 80 16 C 92 16, 104 22, 102 36 C 102 46, 96 52, 92 56 L 68 56 C 64 52, 58 46, 58 36 Z" fill="url(#hw-pelt)" filter="url(#hw-fur)"/>
    <!-- the muzzle, thrust forward, wrinkled back off the fangs -->
    <path d="M 68 44 C 68 54, 72 66, 80 70 C 88 66, 92 54, 92 44 Z" fill="#5a4a38" filter="url(#hw-fur)"/>
    <path d="M 70 48 Q 74 46 76 50 M 84 50 Q 86 46 90 48 M 72 54 Q 76 52 78 55 M 82 55 Q 84 52 88 54" stroke="#140e08" stroke-width="0.9" fill="none"/>
    <path d="M 75 44 C 76 40, 84 40, 85 44 C 84 47, 76 47, 75 44 Z" fill="#0a0806"/>
    <path d="M 77 43.4 q 1 -1 2 0 M 81 43.4 q 1 -1 2 0" stroke="#3a3028" stroke-width="0.5" fill="none"/>
    <path d="M 70 58 Q 80 72 90 58 Q 80 66 70 58 Z" fill="#2a0606"/>
    <path d="M 70 58 L 72 66 L 73.4 58.6 Z M 90 58 L 88 66 L 86.6 58.6 Z M 75 60 l 1 3 l 1 -2.6 Z M 83 60.4 l 1 2.6 l 1 -3 Z" fill="#f0e8d0" stroke="#5a4a30" stroke-width="0.3"/>
    <path d="M 71 66 C 71 70, 72 72, 71 76 M 89 66 C 89 70, 88 74, 89 78" stroke="#d8e0e0" stroke-width="0.5" fill="none" opacity="0.8"/>
    <path d="M 72 64 Q 80 68 88 64" stroke="#7a1a2a" stroke-width="1.4" fill="none"/>
    <!-- yellow eyes under a heavy brow -->
    <path d="M 64 32 Q 72 26 78 34 M 82 34 Q 88 26 96 32" stroke="#140e08" stroke-width="2.6" fill="none"/>
    <circle cx="71" cy="36" r="4.6" fill="url(#hw-eye)"/><circle cx="89" cy="36" r="4.6" fill="url(#hw-eye)"/>
    <ellipse cx="71" cy="36" rx="0.9" ry="2" fill="#000"/><ellipse cx="89" cy="36" rx="0.9" ry="2" fill="#000"/>
    <!-- fur in ragged tufts -->
    <g fill="#5a4a38" stroke="#1a140c" stroke-width="0.4">
      <path d="M 58 40 l -6 2 l 5 2 l -5 4 l 6 0 Z M 102 40 l 6 2 l -5 2 l 5 4 l -6 0 Z"/>
      <path d="M 66 18 l 2 -6 l 3 5 l 3 -6 l 2 6 l 3 -5 l 2 6 Z"/>
    </g>
    </svg>
  `,

  // ─── Troll ───────────────────────────────────────────────────────────────
  // A tall, stooped, rubbery thing: green-grey warted hide, a long hooked
  // nose, tusks, a few strands of black hair, arms hanging past its knees
  // to clawed hands. A fresh wound closes on its chest as you watch,
  // steaming, the new flesh pink.
  'Troll': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Troll: a tall, stooped, warty green-grey troll with tusks and a hooked nose, a wound closing and steaming on its chest">
    <defs>
      ${wetSkinFilter('ht-hide', { freq: '0.32 0.38', seed: 61, shine: 0.18 })}
      <linearGradient id="ht-skin" x1="0" y1="0" x2="0.5" y2="1"><stop offset="0" stop-color="#8aa078"/><stop offset="0.5" stop-color="#4a6044"/><stop offset="1" stop-color="#1a2618"/></linearGradient>
      <radialGradient id="ht-eye" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffe0a0"/><stop offset="0.5" stop-color="#c06010"/><stop offset="1" stop-color="#401000" stop-opacity="0"/></radialGradient>
    </defs>
    <ellipse cx="80" cy="155" rx="44" ry="4" fill="#000" opacity="0.6"/>
    <!-- long, knobbed legs -->
    <path d="M 64 112 C 60 128, 60 140, 62 152 L 72 152 C 72 138, 74 126, 76 114 Z M 88 112 C 92 128, 94 140, 94 152 L 104 152 C 104 138, 100 124, 98 112 Z" fill="url(#ht-skin)" filter="url(#ht-hide)"/>
    <path d="M 56 152 l 18 0 M 92 152 l 18 0" stroke="#1a2618" stroke-width="4" stroke-linecap="round"/>
    <path d="M 58 98 L 102 98 L 104 116 L 96 112 L 90 120 L 82 112 L 74 122 L 68 112 L 60 116 Z" fill="#3a2c1c"/>
    <!-- the stooped, rubbery trunk -->
    <path d="M 56 60 C 48 76, 52 92, 58 100 L 102 100 C 108 92, 112 76, 104 60 C 94 50, 66 50, 56 60 Z" fill="url(#ht-skin)" filter="url(#ht-hide)"/>
    <g fill="#5a7050" stroke="#1a2618" stroke-width="0.4"><circle cx="64" cy="70" r="2"/><circle cx="96" cy="74" r="2.4"/><circle cx="70" cy="88" r="1.6"/><circle cx="92" cy="90" r="1.8"/><circle cx="80" cy="64" r="1.4"/></g>
    <path d="M 70 76 Q 80 72 90 76 M 72 84 Q 80 81 88 84" stroke="#1a2618" stroke-width="1" fill="none" opacity="0.7"/>
    <!-- a fresh wound closing as you watch: pink new flesh, steam -->
    <path d="M 74 78 L 88 92" stroke="#6a1010" stroke-width="4" stroke-linecap="round"/>
    <path d="M 74 78 L 88 92" stroke="#e88a9a" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M 76 80 l -2 2 M 80 84 l -2 2 M 84 88 l -2 2 M 78 80 l 2 -2 M 82 84 l 2 -2 M 86 88 l 2 -2" stroke="#3a1414" stroke-width="0.7"/>
    <g class="obj-smoke" fill="#c8d0c8" opacity="0.3"><circle cx="82" cy="74" r="5"/><circle cx="88" cy="68" r="4"/><circle cx="78" cy="66" r="3.5"/></g>
    <!-- arms hanging past the knees, to clawed hands -->
    <path d="M 58 62 C 46 74, 40 96, 38 124 L 46 126 C 48 100, 54 80, 64 70 Z M 102 62 C 114 74, 120 96, 122 124 L 114 126 C 112 100, 106 80, 96 70 Z" fill="url(#ht-skin)" filter="url(#ht-hide)"/>
    <path d="M 38 124 C 34 128, 34 134, 38 136 L 48 134 C 48 130, 48 126, 46 124 Z M 122 124 C 126 128, 126 134, 122 136 L 112 134 C 112 130, 112 126, 114 124 Z" fill="#4a6044"/>
    <g stroke="#0a0c08" stroke-width="2" stroke-linecap="round"><path d="M 37 135 l -2 5"/><path d="M 41 136 l -1 6"/><path d="M 45 135 l 1 6"/><path d="M 123 135 l 2 5"/><path d="M 119 136 l 1 6"/><path d="M 115 135 l -1 6"/></g>
    <!-- the head, thrust forward on the stoop -->
    <path d="M 64 36 C 62 20, 70 12, 80 12 C 90 12, 98 20, 96 36 C 96 46, 90 54, 80 56 C 70 54, 64 46, 64 36 Z" fill="url(#ht-skin)" filter="url(#ht-hide)"/>
    <path d="M 64 32 L 54 26 L 64 38 Z M 96 32 L 106 26 L 96 38 Z" fill="#4a6044" stroke="#1a2618" stroke-width="0.4"/>
    <path d="M 70 14 C 66 22, 62 30, 60 42 M 78 12 C 76 20, 72 30, 70 38 M 88 13 C 92 20, 96 30, 98 40" stroke="#0a0a0a" stroke-width="0.8" fill="none"/>
    <path d="M 66 30 Q 72 26 78 31 M 82 31 Q 88 26 94 30" stroke="#1a2618" stroke-width="2.2" fill="none"/>
    <circle cx="72" cy="33" r="3.4" fill="url(#ht-eye)"/><circle cx="88" cy="33" r="3.4" fill="url(#ht-eye)"/>
    <circle cx="72" cy="33" r="0.9" fill="#000"/><circle cx="88" cy="33" r="0.9" fill="#000"/>
    <!-- a long hooked nose, warted -->
    <path d="M 78 32 C 78 40, 84 46, 86 52 C 84 54, 80 52, 78 48 C 76 44, 76 38, 78 32 Z" fill="#5a7050" stroke="#1a2618" stroke-width="0.6"/>
    <circle cx="81" cy="44" r="1.2" fill="#4a6044" stroke="#1a2618" stroke-width="0.3"/>
    <!-- a wide mouth, and tusks -->
    <path d="M 68 48 Q 80 56 92 48 Q 80 52 68 48 Z" fill="#1a0806"/>
    <path d="M 70 49 L 68 40 L 73 48.6 Z M 90 49 L 92 40 L 87 48.6 Z" fill="#e0d8b8" stroke="#5a5030" stroke-width="0.4"/>
    </svg>
  `,

  // ─── Banshee ─────────────────────────────────────────────────────────────
  // A drowned-pale woman of mist: white hair streaming upward as if under
  // water, black hollows for eyes, the mouth stretched open far past what a
  // jaw can do, screaming; a gown in rags that frays into fog; bone-thin
  // hands clawing at the air.
  'Banshee': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Banshee: a pale, misty woman with streaming white hair, black hollow eyes and a mouth stretched impossibly wide, screaming">
    <defs>
      <filter id="hb-mist" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.6"/></filter>
      <filter id="hb-soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="0.5"/></filter>
      <radialGradient id="hb-glow" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#c8e0f0" stop-opacity="0.45"/><stop offset="1" stop-color="#c8e0f0" stop-opacity="0"/></radialGradient>
      <linearGradient id="hb-gown" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d8e4ec" stop-opacity="0.85"/><stop offset="0.7" stop-color="#8aa0b0" stop-opacity="0.4"/><stop offset="1" stop-color="#5a7080" stop-opacity="0"/></linearGradient>
      <radialGradient id="hb-face" cx="45%" cy="35%" r="70%"><stop offset="0" stop-color="#f0f4f6"/><stop offset="0.6" stop-color="#b0c0c8"/><stop offset="1" stop-color="#5a6a74"/></radialGradient>
    </defs>
    <circle cx="80" cy="66" r="62" fill="url(#hb-glow)"/>
    <!-- hair streaming upward, as if under water -->
    <g stroke="#e8f0f4" stroke-width="2" fill="none" opacity="0.7" filter="url(#hb-soft)" stroke-linecap="round">
      <path d="M 66 30 C 56 18, 50 6, 40 0"/><path d="M 70 24 C 64 12, 62 4, 58 -4"/><path d="M 76 20 C 74 10, 76 2, 72 -6"/>
      <path d="M 84 20 C 86 10, 84 2, 88 -6"/><path d="M 90 24 C 96 12, 98 4, 102 -4"/><path d="M 94 30 C 104 18, 110 6, 120 0"/>
      <path d="M 64 40 C 50 34, 40 26, 28 22"/><path d="M 96 40 C 110 34, 120 26, 132 22"/>
    </g>
    <!-- the gown, in rags, fraying into fog -->
    <path d="M 60 70 C 52 96, 44 124, 32 156 L 128 156 C 116 124, 108 96, 100 70 C 92 64, 68 64, 60 70 Z" fill="url(#hb-gown)" filter="url(#hb-soft)"/>
    <path d="M 40 140 L 48 156 M 56 132 L 60 156 M 72 128 L 70 156 M 88 128 L 92 156 M 104 132 L 104 156 M 118 140 L 114 156" stroke="#0a1014" stroke-width="2" opacity="0.5"/>
    <g fill="#c8d8e0" opacity="0.25" filter="url(#hb-mist)"><ellipse cx="50" cy="150" rx="22" ry="8"/><ellipse cx="110" cy="152" rx="24" ry="8"/><ellipse cx="80" cy="156" rx="30" ry="6"/></g>
    <!-- arms: bone-thin, clawing at the air -->
    <g stroke="#c8d4dc" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.85">
      <path d="M 62 74 C 50 72, 40 66, 30 56"/><path d="M 98 74 C 110 72, 120 66, 130 56"/>
    </g>
    <g stroke="#dce6ec" stroke-width="1.4" fill="none" stroke-linecap="round" opacity="0.9">
      <path d="M 30 56 C 26 50, 24 46, 22 40 M 30 56 C 24 52, 20 50, 16 48 M 30 56 C 28 48, 28 44, 30 38 M 30 56 C 24 56, 20 58, 16 60"/>
      <path d="M 130 56 C 134 50, 136 46, 138 40 M 130 56 C 136 52, 140 50, 144 48 M 130 56 C 132 48, 132 44, 130 38 M 130 56 C 136 56, 140 58, 144 60"/>
    </g>
    <!-- the neck, and the head thrown back a little -->
    <path d="M 74 58 L 86 58 L 88 70 L 72 70 Z" fill="url(#hb-face)" opacity="0.9"/>
    <path d="M 66 36 C 64 22, 70 14, 80 14 C 90 14, 96 22, 94 36 C 94 48, 90 60, 80 64 C 70 60, 66 48, 66 36 Z" fill="url(#hb-face)" opacity="0.95"/>
    <path d="M 68 44 Q 70 52 74 56 M 92 44 Q 90 52 86 56" stroke="#5a6a74" stroke-width="1" fill="none"/>
    <!-- black hollows for eyes, running -->
    <path d="M 68 30 C 68 26, 76 26, 77 31 C 77 36, 69 36, 68 30 Z M 83 31 C 84 26, 92 26, 92 30 C 91 36, 83 36, 83 31 Z" fill="#05080a"/>
    <path d="M 71 35 C 70 40, 72 44, 70 50 M 89 35 C 90 40, 88 46, 90 52" stroke="#1a2228" stroke-width="1.2" fill="none"/>
    <!-- the mouth, stretched far past what a jaw can do, screaming -->
    <path d="M 74 42 C 72 50, 72 60, 76 70 C 78 74, 82 74, 84 70 C 88 60, 88 50, 86 42 C 82 40, 78 40, 74 42 Z" fill="#020304"/>
    <path d="M 74 42 C 72 50, 72 60, 76 70 C 78 74, 82 74, 84 70 C 88 60, 88 50, 86 42" stroke="#8a9aa4" stroke-width="0.8" fill="none"/>
    <!-- the scream, made visible -->
    <g fill="none" stroke="#c8e0f0" stroke-width="1" opacity="0.4">
      <path d="M 66 86 Q 80 92 94 86"/><path d="M 58 94 Q 80 104 102 94"/><path d="M 50 104 Q 80 118 110 104"/>
    </g>
    </svg>
  `,

  // ─── Lich ────────────────────────────────────────────────────────────────
  // A dead king who would not stop: skin like old parchment shrunk onto the
  // skull, gone at the cheek and jaw; green fire in the sockets; a rusted
  // crown; robes once royal, now rotted to rags; a staff topped with a
  // skull and a gem, and runes burning in the air.
  'Lich': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Lich: a desiccated, crowned undead sorcerer in rotted royal robes, green fire in its eye sockets, a skull-topped staff, runes burning around it">
    <defs>
      ${horrorSkinFilter('hlx-skin', { freq: '0.2 0.24', scale: 2.6, seed: 71, k: 1.25 })}
      <radialGradient id="hlx-glow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#b0ffb0"/><stop offset="0.35" stop-color="#40e060"/><stop offset="1" stop-color="#004010" stop-opacity="0"/></radialGradient>
      <linearGradient id="hlx-robe" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a1a4a"/><stop offset="1" stop-color="#0a0410"/></linearGradient>
      <radialGradient id="hlx-face" cx="45%" cy="35%" r="70%"><stop offset="0" stop-color="#c8b890"/><stop offset="0.6" stop-color="#8a7854"/><stop offset="1" stop-color="#3a3020"/></radialGradient>
      <linearGradient id="hlx-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c8a040"/><stop offset="1" stop-color="#4a3410"/></linearGradient>
      <filter id="hlx-g" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <!-- runes burning in the air -->
    <g fill="none" stroke="#60ff80" stroke-width="1" filter="url(#hlx-g)" opacity="0.75">
      <path d="M 20 40 l 6 -6 l 0 10 l 6 -4"/><path d="M 134 50 l 0 -10 l 6 5 l -6 5"/><path d="M 26 92 l 8 0 l -4 -7 Z"/><path d="M 128 96 l 4 -8 l 4 8 M 130 92 l 4 0"/>
    </g>
    <!-- the robes: once royal, rotted to rags -->
    <path d="M 56 66 C 46 96, 42 126, 36 156 L 124 156 C 118 126, 114 96, 104 66 C 94 58, 66 58, 56 66 Z" fill="url(#hlx-robe)" filter="url(#hlx-skin)"/>
    <path d="M 40 146 L 46 156 M 54 138 L 56 156 M 70 140 L 68 156 M 90 140 L 92 156 M 106 138 L 104 156 M 120 146 L 116 156" stroke="#000" stroke-width="2.4" opacity="0.6"/>
    <path d="M 74 66 L 80 120 L 86 66" fill="none" stroke="url(#hlx-gold)" stroke-width="2"/>
    <path d="M 56 66 C 64 74, 96 74, 104 66 L 100 62 C 92 68, 68 68, 60 62 Z" fill="url(#hlx-gold)"/>
    <!-- the phylactery's glow at its breast -->
    <circle cx="80" cy="84" r="9" fill="url(#hlx-glow)" opacity="0.8"/><path d="M 76 80 L 84 80 L 82 90 L 78 90 Z" fill="#203020" stroke="url(#hlx-gold)" stroke-width="0.8"/>
    <!-- hands: bone and parchment; one on the staff, one raised in a spell -->
    <path d="M 56 72 C 46 76, 40 84, 36 94 L 42 96 C 46 88, 52 82, 60 78 Z" fill="url(#hlx-robe)"/>
    <g stroke="url(#hlx-face)" stroke-width="1.6" fill="none" stroke-linecap="round"><path d="M 38 94 C 34 98, 32 102, 30 106 M 39 95 C 37 100, 37 104, 36 108 M 41 95 C 42 100, 42 104, 42 108"/></g>
    <path d="M 104 72 C 114 66, 120 58, 124 48 L 130 50 C 126 62, 118 72, 108 80 Z" fill="url(#hlx-robe)"/>
    <g stroke="url(#hlx-face)" stroke-width="1.6" fill="none" stroke-linecap="round"><path d="M 126 48 C 124 42, 124 38, 126 32 M 128 48 C 128 42, 130 38, 132 34 M 130 49 C 134 46, 136 42, 138 38"/></g>
    <circle cx="130" cy="34" r="8" fill="url(#hlx-glow)" opacity="0.8"/>
    <!-- the staff: black wood, a skull and a gem at its head -->
    <path d="M 30 106 L 22 30" stroke="#1a140c" stroke-width="3"/>
    <path d="M 16 24 C 14 14, 30 14, 28 24 C 28 28, 24 30, 22 30 C 20 30, 16 28, 16 24 Z" fill="url(#hlx-face)" filter="url(#hlx-skin)"/>
    <circle cx="19" cy="22" r="1.6" fill="#40e060"/><circle cx="25" cy="22" r="1.6" fill="#40e060"/>
    <path d="M 22 8 l -4 6 l 4 6 l 4 -6 Z" fill="#30c050" filter="url(#hlx-g)"/>
    <!-- the head: parchment skin shrunk onto the skull, gone at the cheek and jaw -->
    <path d="M 66 34 C 64 20, 72 12, 80 12 C 88 12, 96 20, 94 34 C 94 46, 88 56, 80 60 C 72 56, 66 46, 66 34 Z" fill="url(#hlx-face)" filter="url(#hlx-skin)"/>
    <path d="M 84 40 C 90 40, 94 44, 92 50 C 90 54, 86 54, 84 50 Z" fill="#e0d4b0" stroke="#3a3020" stroke-width="0.4"/>
    <path d="M 85 46 l 1.4 3 M 88 46 l 1 3" stroke="#3a3020" stroke-width="0.5"/>
    <path d="M 68 40 Q 70 48 74 52" stroke="#3a3020" stroke-width="1.2" fill="none"/>
    <!-- sockets with green fire -->
    <path d="M 68 28 C 68 24, 76 24, 77 29 C 76 34, 69 34, 68 28 Z M 83 29 C 84 24, 92 24, 92 28 C 91 34, 84 34, 83 29 Z" fill="#050403"/>
    <circle cx="72.4" cy="29" r="4" fill="url(#hlx-glow)"/><circle cx="87.6" cy="29" r="4" fill="url(#hlx-glow)"/>
    <path d="M 80 32 L 78 39 L 82 39 Z" fill="#100c08"/>
    <path d="M 72 48 Q 80 52 86 48" stroke="#100c08" stroke-width="1.4" fill="none"/>
    <path d="M 73 48.4 l 1 2 l 1 -1.8 l 1 2 l 1 -1.8 l 1 2 l 1 -1.8 l 1 2 l 1 -1.8 l 1 2 l 1 -1.8" stroke="#d8ccaa" stroke-width="0.5" fill="none"/>
    <path d="M 70 18 L 74 22 M 88 16 L 86 22" stroke="#3a3020" stroke-width="0.6"/>
    <!-- a rusted crown -->
    <path d="M 66 20 L 68 8 L 73 16 L 76 4 L 80 14 L 84 4 L 87 16 L 92 8 L 94 20 C 86 16, 74 16, 66 20 Z" fill="url(#hlx-gold)" stroke="#2a1c08" stroke-width="0.5"/>
    <circle cx="80" cy="15" r="1.6" fill="#30c050"/>
    <path d="M 70 18 l 2 -2 M 88 18 l -2 -2" stroke="#6a3a1a" stroke-width="1" opacity="0.8"/>
    </svg>
  `,


  // ─── The Barrow-King ─────────────────────────────────────────────────────
  // A thousand years under the mound: grey skin shrunk to the skull and split
  // over the cheekbones, the rusted crown grown into the brow, two cold stars
  // for eyes, grave-mail rotted through to the ribs, the ancient sword held
  // point-down, and frost creeping out from him across the stones.
  'Barrow-King': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Barrow-King: a tall, desiccated dead king in rotted grave-mail, a rusted crown grown into his brow, cold stars for eyes, an ancient sword held point-down, frost creeping from him">
    <defs>
      ${horrorSkinFilter('hbk-skin', { freq: '0.22 0.28', scale: 2.6, seed: 81, k: 1.25 })}
      ${horrorSkinFilter('hbk-mail', { freq: '0.6 0.6', scale: 2, seed: 82, k: 1.3 })}
      <radialGradient id="hbk-face" cx="45%" cy="35%" r="70%"><stop offset="0" stop-color="#b8bcb0"/><stop offset="0.6" stop-color="#7a7e74"/><stop offset="1" stop-color="#2a2e2a"/></radialGradient>
      <linearGradient id="hbk-steel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7a828a"/><stop offset="1" stop-color="#22262c"/></linearGradient>
      <linearGradient id="hbk-cloak" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1e2a24"/><stop offset="1" stop-color="#060a08"/></linearGradient>
      <linearGradient id="hbk-rust" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a5a2a"/><stop offset="1" stop-color="#3a1a08"/></linearGradient>
      <radialGradient id="hbk-eye" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffffff"/><stop offset="0.3" stop-color="#a0e0ff"/><stop offset="1" stop-color="#2060c0" stop-opacity="0"/></radialGradient>
      <radialGradient id="hbk-frost" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#d8f0ff" stop-opacity="0.55"/><stop offset="1" stop-color="#d8f0ff" stop-opacity="0"/></radialGradient>
    </defs>
    <ellipse cx="80" cy="150" rx="72" ry="10" fill="url(#hbk-frost)"/>
    <g stroke="#e8f8ff" stroke-width="0.7" fill="none" opacity="0.7">
      <path d="M 30 150 l -6 -3 l -2 -5 M 26 147 l -5 1 M 130 150 l 6 -3 l 2 -5 M 134 147 l 5 1 M 60 156 l -4 3 M 100 156 l 4 3"/>
    </g>
    <!-- the cloak in rags -->
    <path d="M 46 58 C 38 90, 34 124, 30 152 L 42 146 L 48 154 L 58 146 L 66 154 L 80 148 L 94 154 L 102 146 L 112 154 L 118 146 L 130 152 C 126 124, 122 90, 114 58 Z" fill="url(#hbk-cloak)" filter="url(#hbk-skin)"/>
    <!-- grave-mail, rotted through over the ribs -->
    <path d="M 56 58 L 104 58 L 108 112 L 52 112 Z" fill="url(#hbk-steel)" filter="url(#hbk-mail)"/>
    <path d="M 70 74 C 74 70, 86 70, 90 74 C 92 84, 88 94, 80 96 C 72 94, 68 84, 70 74 Z" fill="#0a0c0a"/>
    <g fill="none" stroke="url(#hbk-face)" stroke-width="2" stroke-linecap="round" filter="url(#hbk-skin)">
      <path d="M 72 78 Q 80 75 88 78"/><path d="M 71 84 Q 80 81 89 84"/><path d="M 72 90 Q 80 87 88 90"/>
    </g>
    <path d="M 80 74 L 80 96" stroke="#5a5e56" stroke-width="1.6"/>
    <path d="M 52 112 L 108 112 L 106 142 L 54 142 Z" fill="#1a1c20" filter="url(#hbk-mail)"/>
    <!-- arms of bone and leather-skin, both hands on the sword's pommel -->
    <path d="M 56 60 C 44 74, 44 92, 56 104 L 64 98 C 58 88, 58 76, 64 66 Z" fill="url(#hbk-steel)" filter="url(#hbk-mail)"/>
    <path d="M 104 60 C 116 74, 116 92, 104 104 L 96 98 C 102 88, 102 76, 96 66 Z" fill="url(#hbk-steel)" filter="url(#hbk-mail)"/>
    <path d="M 66 98 C 70 94, 78 94, 80 98 C 82 94, 90 94, 94 98 L 92 106 L 68 106 Z" fill="url(#hbk-face)" filter="url(#hbk-skin)"/>
    <g stroke="#1a1c18" stroke-width="0.7"><path d="M 70 100 l 0 5 M 74 99 l 0 6 M 86 99 l 0 6 M 90 100 l 0 5"/></g>
    <!-- the ancient sword, notched, point down into the frost -->
    <path d="M 77 106 L 83 106 L 82.4 150 L 80 156 L 77.6 150 Z" fill="url(#hbk-steel)" stroke="#1a1e24" stroke-width="0.5"/>
    <path d="M 83 118 l -1.6 1.6 l 1.6 1 M 77 132 l 1.6 1.4 l -1.6 1" stroke="#0a0c10" stroke-width="0.8" fill="none"/>
    <path d="M 64 102 L 96 102 L 96 107 L 64 107 Z" fill="url(#hbk-rust)"/>
    <path d="M 79.6 108 L 79.6 148" stroke="#c8d8e8" stroke-width="0.4" opacity="0.6"/>
    <!-- the head: skin shrunk to the skull, split over the cheekbones -->
    <path d="M 64 32 C 62 18, 70 10, 80 10 C 90 10, 98 18, 96 32 C 96 46, 90 56, 80 58 C 70 56, 64 46, 64 32 Z" fill="url(#hbk-face)" filter="url(#hbk-skin)"/>
    <path d="M 66 38 C 70 40, 72 44, 70 48 M 94 38 C 90 40, 88 44, 90 48" stroke="#0a0c0a" stroke-width="1.6" fill="none"/>
    <path d="M 67 40 C 70 42, 70 45, 69 47" stroke="#e0dcc8" stroke-width="0.8" fill="none"/>
    <path d="M 70 46 Q 74 52 78 54 M 90 46 Q 86 52 82 54" stroke="#2a2e2a" stroke-width="1" fill="none"/>
    <!-- deep sockets, two cold stars -->
    <path d="M 67 30 C 67 25, 76 25, 77 31 C 76 36, 68 36, 67 30 Z M 83 31 C 84 25, 93 25, 93 30 C 92 36, 84 36, 83 31 Z" fill="#05070a"/>
    <circle cx="72" cy="31" r="4" fill="url(#hbk-eye)"/><circle cx="88" cy="31" r="4" fill="url(#hbk-eye)"/>
    <path d="M 72 28.4 L 72 33.6 M 69.4 31 L 74.6 31 M 88 28.4 L 88 33.6 M 85.4 31 L 90.6 31" stroke="#ffffff" stroke-width="0.4"/>
    <path d="M 80 34 L 77.6 42 L 82.4 42 Z" fill="#0a0c0a"/>
    <!-- lips gone: the teeth, long in the gums -->
    <path d="M 71 48 Q 80 53 89 48 Q 80 51 71 48 Z" fill="#100c0a"/>
    <path d="M 72 48.2 l 0.8 3.4 l 0.8 -3.2 l 0.8 3.6 l 0.8 -3.4 l 0.8 3.6 l 0.8 -3.4 l 0.8 3.6 l 0.8 -3.4 l 0.8 3.6 l 0.8 -3.4 l 0.8 3.4 l 0.8 -3.2 l 0.8 3.4 l 0.8 -3.2 l 0.8 3 l 0.8 -3 l 0.8 2.8 l 0.8 -2.6 l 0.8 2.6" stroke="#cfc6a6" stroke-width="0.6" fill="none"/>
    <!-- the crown, rusted, grown into the brow -->
    <path d="M 62 20 L 64 6 L 70 14 L 74 2 L 80 12 L 86 2 L 90 14 L 96 6 L 98 20 C 90 16, 70 16, 62 20 Z" fill="url(#hbk-rust)" stroke="#2a1408" stroke-width="0.6" filter="url(#hbk-skin)"/>
    <path d="M 64 20 C 66 23, 66 25, 64 27 M 96 20 C 94 23, 94 25, 96 27 M 76 19 C 76 22, 77 24, 76 26" stroke="#3a1a10" stroke-width="1.2" fill="none"/>
    <circle cx="80" cy="15" r="1.8" fill="#a0e0ff"/>
    <!-- cold breath -->
    <g fill="none" stroke="#d8f0ff" stroke-width="1" opacity="0.45"><path d="M 74 56 q -6 6 -2 12 q 4 6 -2 12"/><path d="M 86 56 q 6 6 2 12 q -4 6 2 12"/></g>
    </svg>
  `,


  // ─── Goblin ──────────────────────────────────────────────────────────────
  // Not a comic imp: a starved, hairless little killer, all ears and teeth,
  // grey-green skin pocked and scabbed, yellow eyes too big for its head, a
  // rusted cleaver and a string of finger bones round its neck.
  'Goblin': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Goblin: a starved, scabbed grey-green creature with huge ears, yellow eyes and a mouth of needle teeth, a rusted cleaver raised, finger bones round its neck">
    <defs>
      ${horrorSkinFilter('hgb-skin', { freq: '0.24 0.3', scale: 2.4, seed: 91, k: 1.25 })}
      <radialGradient id="hgb-flesh" cx="45%" cy="30%" r="80%"><stop offset="0" stop-color="#9aa878"/><stop offset="0.55" stop-color="#5a6a40"/><stop offset="1" stop-color="#1e2614"/></radialGradient>
      <radialGradient id="hgb-eye" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff8c0"/><stop offset="0.5" stop-color="#e0b020"/><stop offset="1" stop-color="#5a3a00"/></radialGradient>
      <linearGradient id="hgb-rust" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9a6a3a"/><stop offset="1" stop-color="#3a1a08"/></linearGradient>
    </defs>
    <ellipse cx="80" cy="154" rx="30" ry="4" fill="#000" opacity="0.6"/>
    <!-- crouched legs, knobbed knees, long toes -->
    <path d="M 64 118 C 56 128, 56 142, 62 152 L 70 152 C 68 142, 70 132, 74 124 Z M 96 118 C 104 128, 104 142, 98 152 L 90 152 C 92 142, 90 132, 86 124 Z" fill="url(#hgb-flesh)" filter="url(#hgb-skin)"/>
    <path d="M 58 152 l -6 2 M 62 152 l -2 4 M 102 152 l 6 2 M 98 152 l 2 4" stroke="#1a1a10" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M 62 112 L 98 112 L 96 126 L 88 122 L 80 128 L 72 122 L 64 126 Z" fill="#3a2a18"/>
    <!-- a pot-bellied, rib-thin body -->
    <path d="M 64 80 C 58 92, 58 106, 64 114 L 96 114 C 102 106, 102 92, 96 80 C 90 74, 70 74, 64 80 Z" fill="url(#hgb-flesh)" filter="url(#hgb-skin)"/>
    <path d="M 68 88 Q 74 85 78 89 M 82 89 Q 86 85 92 88 M 68 94 Q 74 91 78 95 M 82 95 Q 86 91 92 94" stroke="#1a2010" stroke-width="1" fill="none" opacity="0.8"/>
    <g fill="#4a1a10" opacity="0.8"><circle cx="72" cy="104" r="1.6"/><circle cx="90" cy="100" r="1.2"/><circle cx="84" cy="108" r="1"/></g>
    <!-- a string of finger bones -->
    <path d="M 66 80 Q 80 92 94 80" stroke="#3a2a18" stroke-width="0.8" fill="none"/>
    <g fill="#d8ccaa" stroke="#4a3a20" stroke-width="0.3"><rect x="68" y="82" width="2" height="5" rx="1"/><rect x="73" y="85" width="2" height="5" rx="1"/><rect x="79" y="86" width="2" height="5" rx="1"/><rect x="85" y="85" width="2" height="5" rx="1"/><rect x="90" y="82" width="2" height="5" rx="1"/></g>
    <!-- arms: one with the cleaver raised, one clawing -->
    <path d="M 94 82 C 104 76, 110 66, 112 54 L 118 56 C 116 70, 108 82, 98 90 Z" fill="url(#hgb-flesh)" filter="url(#hgb-skin)"/>
    <path d="M 108 52 L 132 30 L 140 40 L 118 60 Z" fill="url(#hgb-rust)" stroke="#2a1208" stroke-width="0.6"/>
    <path d="M 132 30 l 2 2 M 136 34 l 2 2" stroke="#5a0a0a" stroke-width="1.2"/>
    <path d="M 66 84 C 56 90, 48 100, 44 110 L 50 112 C 54 104, 60 96, 68 92 Z" fill="url(#hgb-flesh)" filter="url(#hgb-skin)"/>
    <path d="M 44 110 l -4 5 M 46 112 l -2 6 M 49 112 l 0 6" stroke="#0a0a06" stroke-width="1.6" stroke-linecap="round"/>
    <!-- the head: bald, all ears -->
    <path d="M 62 44 L 30 30 L 40 46 L 34 50 L 60 54 Z" fill="url(#hgb-flesh)" filter="url(#hgb-skin)"/>
    <path d="M 98 44 L 130 30 L 120 46 L 126 50 L 100 54 Z" fill="url(#hgb-flesh)" filter="url(#hgb-skin)"/>
    <path d="M 58 46 L 38 36 M 102 46 L 122 36" stroke="#6a2a2a" stroke-width="1" opacity="0.7"/>
    <path d="M 36 32 l 4 -2 l 0 4 Z" fill="#000"/>
    <path d="M 62 46 C 60 30, 70 22, 80 22 C 90 22, 100 30, 98 46 C 98 58, 90 68, 80 70 C 70 68, 62 58, 62 46 Z" fill="url(#hgb-flesh)" filter="url(#hgb-skin)"/>
    <path d="M 66 40 Q 72 34 78 40 M 82 40 Q 88 34 94 40" stroke="#141a0c" stroke-width="2.2" fill="none"/>
    <ellipse cx="72" cy="44" rx="5.4" ry="4.6" fill="url(#hgb-eye)"/><ellipse cx="88" cy="44" rx="5.4" ry="4.6" fill="url(#hgb-eye)"/>
    <ellipse cx="72" cy="44" rx="1" ry="3" fill="#000"/><ellipse cx="88" cy="44" rx="1" ry="3" fill="#000"/>
    <circle cx="70.6" cy="42.6" r="0.7" fill="#fff"/><circle cx="86.6" cy="42.6" r="0.7" fill="#fff"/>
    <path d="M 78 48 L 76 54 L 79 54 Z M 82 48 L 84 54 L 81 54 Z" fill="#141a0c"/>
    <path d="M 68 58 Q 80 66 92 58 Q 80 62 68 58 Z" fill="#1a0404"/>
    <g>${needleTeeth(69, 91, 58.6, 14, 3.6, 1, '#e0d6b0', 0.3)}</g>
    <path d="M 70 60 q 0 4 -1 6" stroke="#cfd8d0" stroke-width="0.4" fill="none" opacity="0.7"/>
    </svg>
  `,

  // ─── Orc ─────────────────────────────────────────────────────────────────
  // A slab of muscle in scavenged iron and leather: grey-green hide seamed
  // with old scars and ritual cuts, a jutting jaw of broken tusks, a nose
  // flattened in a hundred fights, red eyes, a notched cleaver of a sword.
  'Orc': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Orc: a scarred, tusked brute in scavenged iron, red-eyed, a notched heavy blade in hand">
    <defs>
      ${wetSkinFilter('hor-hide', { freq: '0.22 0.28', seed: 92, shine: 0.25 })}
      ${horrorSkinFilter('hor-iron', { freq: '0.5 0.5', scale: 2, seed: 93, k: 1.3 })}
      <linearGradient id="hor-skin" x1="0" y1="0" x2="0.5" y2="1"><stop offset="0" stop-color="#7a8a5a"/><stop offset="0.5" stop-color="#46542e"/><stop offset="1" stop-color="#1a2210"/></linearGradient>
      <linearGradient id="hor-plate" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6a6660"/><stop offset="1" stop-color="#1e1c1a"/></linearGradient>
      <radialGradient id="hor-eye" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffd0b0"/><stop offset="0.5" stop-color="#d02010"/><stop offset="1" stop-color="#400000" stop-opacity="0"/></radialGradient>
    </defs>
    <ellipse cx="80" cy="154" rx="44" ry="4" fill="#000" opacity="0.6"/>
    <path d="M 60 116 L 56 152 L 70 152 L 74 120 Z M 88 120 L 92 152 L 106 152 L 102 116 Z" fill="#2a2420"/>
    <path d="M 52 152 h 20 M 90 152 h 20" stroke="#1a1410" stroke-width="5" stroke-linecap="round"/>
    <!-- a slab of a body under scavenged plates -->
    <path d="M 48 64 C 42 84, 46 104, 56 118 L 104 118 C 114 104, 118 84, 112 64 C 100 54, 60 54, 48 64 Z" fill="url(#hor-skin)" filter="url(#hor-hide)"/>
    <path d="M 58 70 L 102 70 L 104 100 L 56 100 Z" fill="url(#hor-plate)" filter="url(#hor-iron)"/>
    <g fill="#8a8680"><circle cx="62" cy="74" r="1.4"/><circle cx="98" cy="74" r="1.4"/><circle cx="62" cy="96" r="1.4"/><circle cx="98" cy="96" r="1.4"/></g>
    <path d="M 62 82 L 72 78 M 88 84 L 98 80" stroke="#2a2220" stroke-width="1.6"/>
    <path d="M 56 100 L 104 100 L 106 118 L 54 118 Z" fill="#3a2a1a"/>
    <path d="M 60 104 L 58 118 M 72 102 L 72 118 M 88 102 L 88 118 M 100 104 L 102 118" stroke="#1a120a" stroke-width="1.2"/>
    <!-- scars and ritual cuts on the bare shoulders -->
    <path d="M 50 66 L 56 74 M 54 64 L 60 72 M 106 64 L 112 74" stroke="#2a0a0a" stroke-width="1.4"/>
    <!-- arms like thighs: one on a blade, one in a fist -->
    <path d="M 50 66 C 38 78, 34 94, 36 108 L 46 108 C 46 96, 50 84, 58 76 Z M 110 66 C 122 78, 126 94, 124 108 L 114 108 C 114 96, 110 84, 102 76 Z" fill="url(#hor-skin)" filter="url(#hor-hide)"/>
    <path d="M 36 106 C 32 110, 34 118, 40 118 C 46 118, 48 112, 46 106 Z" fill="#46542e"/>
    <path d="M 118 108 C 116 112, 118 118, 124 118 C 130 118, 130 110, 126 106 Z" fill="#46542e"/>
    <path d="M 122 112 L 146 48 L 154 50 L 132 116 Z" fill="url(#hor-plate)" stroke="#0a0a0a" stroke-width="0.6"/>
    <path d="M 146 48 l 4 -6 l 4 8 Z" fill="#6a6660"/>
    <path d="M 140 62 l 3 2 l -2 2 M 134 82 l 3 1.6 l -2 2" stroke="#0a0a0a" stroke-width="1" fill="none"/>
    <path d="M 118 116 L 130 112" stroke="#3a2210" stroke-width="5" stroke-linecap="round"/>
    <!-- the head: heavy brow, flattened nose, a jaw of broken tusks -->
    <path d="M 62 40 C 60 24, 70 16, 80 16 C 90 16, 100 24, 98 40 C 98 52, 94 60, 80 62 C 66 60, 62 52, 62 40 Z" fill="url(#hor-skin)" filter="url(#hor-hide)"/>
    <path d="M 60 34 L 54 30 L 62 40 Z M 100 34 L 106 30 L 98 40 Z" fill="#46542e"/>
    <path d="M 66 22 C 70 18, 76 16, 80 16 L 80 24 Z" fill="#0a0a0a" opacity="0.7"/>
    <path d="M 64 32 Q 72 26 79 34 M 81 34 Q 88 26 96 32" stroke="#141a0c" stroke-width="3" fill="none"/>
    <circle cx="72" cy="36" r="3.6" fill="url(#hor-eye)"/><circle cx="88" cy="36" r="3.6" fill="url(#hor-eye)"/>
    <circle cx="72" cy="36" r="0.9" fill="#000"/><circle cx="88" cy="36" r="0.9" fill="#000"/>
    <path d="M 76 38 C 74 44, 76 46, 80 46 C 84 46, 86 44, 84 38" fill="#3a4426" stroke="#141a0c" stroke-width="0.8"/>
    <path d="M 78 44 l 0 1 M 82 44 l 0 1" stroke="#000" stroke-width="1"/>
    <path d="M 66 50 Q 80 60 94 50 Q 80 54 66 50 Z" fill="#140606"/>
    <path d="M 68 51 L 66 40 L 72 50 Z M 92 51 L 94 42 L 89 50.4 Z" fill="#e0d6b0" stroke="#5a5030" stroke-width="0.4"/>
    <path d="M 66 40 l 2 1" stroke="#5a5030" stroke-width="0.6"/>
    <path d="M 84 22 L 90 30 M 70 26 L 74 32" stroke="#2a0a0a" stroke-width="1.2"/>
    </svg>
  `,

  // ─── Giant Spider ────────────────────────────────────────────────────────
  // Big as a pony, black and bristling, dropped from its web onto you: eight
  // hooked legs, a cluster of wet black eyes catching the light, fangs
  // dripping venom, a swollen abdomen marked with a red hourglass.
  'Giant Spider': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Giant Spider: a huge, bristling black spider with a cluster of glistening eyes, dripping fangs and a red hourglass, hanging from its web">
    <defs>
      ${wetSkinFilter('hsp-chitin', { freq: '0.3 0.3', seed: 94, shine: 0.6 })}
      <radialGradient id="hsp-body" cx="40%" cy="30%" r="80%"><stop offset="0" stop-color="#3a3434"/><stop offset="0.6" stop-color="#141010"/><stop offset="1" stop-color="#050404"/></radialGradient>
      <radialGradient id="hsp-eye" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#8a9aa8"/><stop offset="0.3" stop-color="#101418"/><stop offset="1" stop-color="#000"/></radialGradient>
    </defs>
    <!-- the web it dropped from -->
    <g stroke="#c8ccd0" stroke-width="0.5" fill="none" opacity="0.35">
      <path d="M 80 0 L 80 50"/><path d="M 20 0 L 80 40 L 140 0"/><path d="M 0 30 L 80 40 L 160 30"/>
      <path d="M 50 12 Q 80 24 110 12 M 36 22 Q 80 36 124 22"/>
    </g>
    <path d="M 80 0 L 80 54" stroke="#e0e4e8" stroke-width="1" opacity="0.6"/>
    <!-- eight hooked legs, bristling -->
    <g stroke="#0e0a0a" stroke-width="4.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="M 66 86 L 40 64 L 14 82"/><path d="M 64 92 L 34 84 L 8 108"/><path d="M 64 98 L 36 110 L 18 140"/><path d="M 68 104 L 50 128 L 44 156"/>
      <path d="M 94 86 L 120 64 L 146 82"/><path d="M 96 92 L 126 84 L 152 108"/><path d="M 96 98 L 124 110 L 142 140"/><path d="M 92 104 L 110 128 L 116 156"/>
    </g>
    <g stroke="#3a3434" stroke-width="0.8" opacity="0.8">
      <path d="M 40 64 l -3 -4 M 30 70 l -3 -3 M 34 84 l -2 -4 M 22 92 l -3 -2 M 120 64 l 3 -4 M 130 70 l 3 -3 M 126 84 l 2 -4 M 138 92 l 3 -2"/>
    </g>
    <!-- the swollen abdomen and its hourglass -->
    <ellipse cx="80" cy="120" rx="30" ry="26" fill="url(#hsp-body)" filter="url(#hsp-chitin)"/>
    <path d="M 74 108 L 86 108 L 80 118 L 86 128 L 74 128 L 80 118 Z" fill="#a00a0a"/>
    <g stroke="#2a2424" stroke-width="0.8" fill="none" opacity="0.8"><path d="M 54 116 l -4 -2 M 56 128 l -4 1 M 106 116 l 4 -2 M 104 128 l 4 1 M 66 142 l -2 3 M 94 142 l 2 3"/></g>
    <!-- the head and its eight eyes -->
    <ellipse cx="80" cy="84" rx="20" ry="18" fill="url(#hsp-body)" filter="url(#hsp-chitin)"/>
    <circle cx="73" cy="78" r="4.4" fill="url(#hsp-eye)"/><circle cx="87" cy="78" r="4.4" fill="url(#hsp-eye)"/>
    <circle cx="66" cy="76" r="2.6" fill="url(#hsp-eye)"/><circle cx="94" cy="76" r="2.6" fill="url(#hsp-eye)"/>
    <circle cx="76" cy="71" r="2" fill="url(#hsp-eye)"/><circle cx="84" cy="71" r="2" fill="url(#hsp-eye)"/>
    <circle cx="70" cy="70" r="1.4" fill="url(#hsp-eye)"/><circle cx="90" cy="70" r="1.4" fill="url(#hsp-eye)"/>
    <g fill="#fff" opacity="0.8"><circle cx="72" cy="77" r="0.9"/><circle cx="86" cy="77" r="0.9"/><circle cx="65.4" cy="75.4" r="0.5"/><circle cx="93.4" cy="75.4" r="0.5"/></g>
    <!-- fangs, dripping -->
    <path d="M 74 92 C 72 98, 72 102, 76 106 C 76 102, 78 98, 78 94 Z M 86 92 C 88 98, 88 102, 84 106 C 84 102, 82 98, 82 94 Z" fill="#1a1414" stroke="#3a3030" stroke-width="0.5"/>
    <path d="M 76 106 q 0 4 1 6 M 84 106 q 0 3 -1 6" stroke="#b8e060" stroke-width="1" fill="none"/>
    <circle cx="77" cy="113" r="1" fill="#b8e060"/><circle cx="83" cy="113" r="0.9" fill="#b8e060"/>
    <path d="M 70 90 q -4 2 -6 6 M 90 90 q 4 2 6 6" stroke="#0e0a0a" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    </svg>
  `,

  // ─── Minotaur ────────────────────────────────────────────────────────────
  // The thing at the heart of the maze: a bull's skull-heavy head on a man's
  // body grown monstrous, matted hide steaming, horns scarred and one broken,
  // a ring through its nose, eyes red with rage, a double axe crusted dark.
  'Minotaur': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Minotaur: a huge bull-headed man, steaming, horns scarred, a ring through its nose, red-eyed, gripping a double axe">
    <defs>
      ${horrorSkinFilter('hmn-fur', { freq: '0.4 0.1', scale: 2.4, seed: 95, k: 1.25 })}
      ${wetSkinFilter('hmn-hide', { freq: '0.2 0.26', seed: 96, shine: 0.3 })}
      <linearGradient id="hmn-pelt" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="#6a4a32"/><stop offset="0.5" stop-color="#3a2618"/><stop offset="1" stop-color="#140a06"/></linearGradient>
      <linearGradient id="hmn-horn" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d8ccaa"/><stop offset="1" stop-color="#4a3a20"/></linearGradient>
      <radialGradient id="hmn-eye" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffb0a0"/><stop offset="0.5" stop-color="#c01010"/><stop offset="1" stop-color="#400000" stop-opacity="0"/></radialGradient>
      <linearGradient id="hmn-steel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8a8e94"/><stop offset="1" stop-color="#2a2c30"/></linearGradient>
    </defs>
    <ellipse cx="80" cy="154" rx="46" ry="4" fill="#000" opacity="0.6"/>
    <!-- legs ending in hooves -->
    <path d="M 60 112 C 56 126, 56 140, 60 150 L 72 150 C 72 140, 74 126, 76 116 Z M 86 116 C 88 126, 90 140, 88 150 L 100 150 C 104 140, 104 126, 100 112 Z" fill="url(#hmn-pelt)" filter="url(#hmn-fur)"/>
    <path d="M 58 148 h 16 v 6 h -16 Z M 86 148 h 16 v 6 h -16 Z" fill="#1a1410"/><path d="M 66 148 v 6 M 94 148 v 6" stroke="#000" stroke-width="1"/>
    <path d="M 58 104 L 102 104 L 104 120 L 56 120 Z" fill="#3a2a1a"/>
    <!-- a man's body grown monstrous -->
    <path d="M 44 58 C 36 80, 42 100, 56 108 L 104 108 C 118 100, 124 80, 116 58 C 102 48, 58 48, 44 58 Z" fill="url(#hmn-pelt)" filter="url(#hmn-hide)"/>
    <path d="M 62 68 C 68 64, 78 64, 80 72 C 82 64, 92 64, 98 68 M 66 84 Q 80 80 94 84 M 68 94 Q 80 90 92 94" stroke="#140a06" stroke-width="1.6" fill="none" opacity="0.8"/>
    <path d="M 58 76 L 66 86 M 96 72 L 102 80" stroke="#5a0a0a" stroke-width="1.6"/>
    <g class="obj-smoke" fill="#c8c0b8" opacity="0.18"><circle cx="52" cy="54" r="8"/><circle cx="108" cy="52" r="9"/><circle cx="80" cy="44" r="7"/></g>
    <!-- arms gripping the double axe across the body -->
    <path d="M 46 60 C 34 72, 30 88, 34 100 L 44 98 C 42 88, 46 76, 54 68 Z M 114 60 C 126 72, 130 88, 126 100 L 116 98 C 118 88, 114 76, 106 68 Z" fill="url(#hmn-pelt)" filter="url(#hmn-hide)"/>
    <path d="M 30 104 L 132 70" stroke="#2a1a0c" stroke-width="5" stroke-linecap="round"/>
    <path d="M 126 50 C 146 52, 154 70, 150 90 C 142 82, 134 76, 126 74 Z M 126 74 C 134 72, 142 66, 150 56 C 140 50, 132 48, 126 50 Z" fill="url(#hmn-steel)" stroke="#0a0a0a" stroke-width="0.6"/>
    <path d="M 120 62 C 108 56, 104 44, 106 34 C 116 40, 122 48, 126 58 Z M 132 84 C 140 94, 142 106, 136 114 C 130 104, 128 94, 128 84 Z" fill="url(#hmn-steel)" stroke="#0a0a0a" stroke-width="0.6"/>
    <path d="M 146 62 l 3 4 M 148 76 l 2 3" stroke="#3a0606" stroke-width="2"/>
    <circle cx="34" cy="100" r="5" fill="#3a2618"/><circle cx="118" cy="76" r="5" fill="#3a2618"/>
    <!-- the bull's head -->
    <path d="M 64 22 C 50 18, 36 22, 26 14 C 32 26, 46 32, 62 32 Z" fill="url(#hmn-horn)" stroke="#2a1e10" stroke-width="0.6"/>
    <path d="M 96 22 C 106 20, 114 22, 118 26 L 114 28 C 110 26, 104 28, 98 30 Z" fill="url(#hmn-horn)" stroke="#2a1e10" stroke-width="0.6"/>
    <path d="M 118 26 l 2 -3 l 1 4 l -3 1 Z" fill="#8a7a5a"/>
    <path d="M 40 22 l 2 3 M 48 24 l 1 3 M 32 18 l 2 3" stroke="#4a3a20" stroke-width="0.8"/>
    <path d="M 60 30 C 58 18, 68 12, 80 12 C 92 12, 102 18, 100 30 C 100 40, 96 48, 94 56 C 90 66, 70 66, 66 56 C 64 48, 60 40, 60 30 Z" fill="url(#hmn-pelt)" filter="url(#hmn-fur)"/>
    <path d="M 62 34 Q 70 28 77 36 M 83 36 Q 90 28 98 34" stroke="#0a0604" stroke-width="2.8" fill="none"/>
    <circle cx="70" cy="38" r="3.8" fill="url(#hmn-eye)"/><circle cx="90" cy="38" r="3.8" fill="url(#hmn-eye)"/>
    <circle cx="70" cy="38" r="0.9" fill="#000"/><circle cx="90" cy="38" r="0.9" fill="#000"/>
    <!-- the muzzle, wet, a ring through the nose, breath steaming -->
    <path d="M 68 48 C 66 56, 70 64, 80 64 C 90 64, 94 56, 92 48 C 86 44, 74 44, 68 48 Z" fill="#4a3022" filter="url(#hmn-hide)"/>
    <ellipse cx="74" cy="54" rx="2.6" ry="3.4" fill="#0a0604"/><ellipse cx="86" cy="54" rx="2.6" ry="3.4" fill="#0a0604"/>
    <path d="M 74 58 C 74 66, 86 66, 86 58" stroke="#c8a040" stroke-width="2" fill="none"/>
    <path d="M 72 62 q -6 4 -10 2 M 88 62 q 6 4 10 2" stroke="#d8d0c8" stroke-width="1" fill="none" opacity="0.5"/>
    </svg>
  `,

  // ─── Owlbear ─────────────────────────────────────────────────────────────
  // A wrong animal: a bear's hulking body, matted with feathers and fur
  // together, an owl's great flat face with a hooked beak that can snap bone,
  // round black eyes ringed in white that never blink; claws like sickles.
  'Owlbear': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Owlbear: a hulking bear-bodied beast matted with feathers, an owl's flat face with huge unblinking eyes and a bone-snapping beak, sickle claws raised">
    <defs>
      ${horrorSkinFilter('how-fur', { freq: '0.45 0.12', scale: 2.4, seed: 97, k: 1.25 })}
      <linearGradient id="how-pelt" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="#7a5e40"/><stop offset="0.5" stop-color="#4a3420"/><stop offset="1" stop-color="#1a1008"/></linearGradient>
      <radialGradient id="how-face" cx="50%" cy="45%" r="60%"><stop offset="0" stop-color="#d8c8a8"/><stop offset="0.6" stop-color="#8a7050"/><stop offset="1" stop-color="#3a2a18"/></radialGradient>
      <radialGradient id="how-eye" cx="45%" cy="40%" r="60%"><stop offset="0" stop-color="#3a3020"/><stop offset="0.3" stop-color="#050403"/><stop offset="1" stop-color="#000"/></radialGradient>
      <linearGradient id="how-beak" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c8b890"/><stop offset="1" stop-color="#3a3020"/></linearGradient>
    </defs>
    <ellipse cx="80" cy="154" rx="52" ry="5" fill="#000" opacity="0.6"/>
    <!-- the hulking body, reared up -->
    <path d="M 36 74 C 26 100, 32 132, 50 150 L 110 150 C 128 132, 134 100, 124 74 C 110 56, 50 56, 36 74 Z" fill="url(#how-pelt)" filter="url(#how-fur)"/>
    <g fill="#5a4430" stroke="#1a1008" stroke-width="0.4" opacity="0.9">
      ${Array.from({ length: 22 }, (_, i) => { const x = 48 + (i % 6) * 13 + (i % 2) * 5; const y = 80 + Math.floor(i / 6) * 14; return `<path d="M ${x} ${y} q 4 6 0 12 q -4 -6 0 -12 Z"/>`; }).join('')}
    </g>
    <path d="M 70 96 Q 80 120 90 96" stroke="#d8c8a8" stroke-width="10" fill="none" opacity="0.25"/>
    <!-- arms raised, sickle claws -->
    <path d="M 40 78 C 26 72, 18 58, 18 44 L 28 42 C 30 54, 38 64, 50 70 Z M 120 78 C 134 72, 142 58, 142 44 L 132 42 C 130 54, 122 64, 110 70 Z" fill="url(#how-pelt)" filter="url(#how-fur)"/>
    <g stroke="#e8e0c8" stroke-width="2.2" fill="none" stroke-linecap="round">
      <path d="M 18 44 C 12 38, 10 32, 12 26"/><path d="M 22 42 C 18 34, 18 28, 20 22"/><path d="M 27 42 C 26 34, 28 28, 30 24"/>
      <path d="M 142 44 C 148 38, 150 32, 148 26"/><path d="M 138 42 C 142 34, 142 28, 140 22"/><path d="M 133 42 C 134 34, 132 28, 130 24"/>
    </g>
    <g stroke="#3a3020" stroke-width="0.6" fill="none"><path d="M 13 30 l 2 0 M 140 30 l 2 0"/></g>
    <!-- the owl's face: a great flat disc of feathers -->
    <path d="M 54 30 L 46 12 L 62 24 Z M 106 30 L 114 12 L 98 24 Z" fill="#4a3420" stroke="#1a1008" stroke-width="0.6"/>
    <ellipse cx="80" cy="46" rx="34" ry="30" fill="url(#how-pelt)" filter="url(#how-fur)"/>
    <path d="M 80 20 C 64 20, 50 32, 50 46 C 50 60, 64 72, 80 72 C 96 72, 110 60, 110 46 C 110 32, 96 20, 80 20 Z" fill="url(#how-face)" filter="url(#how-fur)"/>
    <g stroke="#6a5038" stroke-width="0.6" fill="none" opacity="0.8">
      ${Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * Math.PI * 2; return `<path d="M ${(68 + Math.cos(a) * 6).toFixed(1)} ${(42 + Math.sin(a) * 6).toFixed(1)} L ${(68 + Math.cos(a) * 16).toFixed(1)} ${(42 + Math.sin(a) * 15).toFixed(1)} M ${(92 + Math.cos(a) * 6).toFixed(1)} ${(42 + Math.sin(a) * 6).toFixed(1)} L ${(92 + Math.cos(a) * 16).toFixed(1)} ${(42 + Math.sin(a) * 15).toFixed(1)}"/>`; }).join('')}
    </g>
    <!-- round black eyes, ringed in white, that never blink -->
    <circle cx="68" cy="43" r="7.5" fill="#8a2a1a"/><circle cx="92" cy="43" r="7.5" fill="#8a2a1a"/>
    <circle cx="68" cy="43" r="6" fill="#d8a020"/><circle cx="92" cy="43" r="6" fill="#d8a020"/>
    <circle cx="68" cy="43" r="3.4" fill="url(#how-eye)"/><circle cx="92" cy="43" r="3.4" fill="url(#how-eye)"/>
    <circle cx="67" cy="41.8" r="0.8" fill="#fff"/><circle cx="91" cy="41.8" r="0.8" fill="#fff"/>
    <!-- heavy feathered brows, slanted down in a glare -->
    <path d="M 54 30 L 78 40 L 76 34 Z M 106 30 L 82 40 L 84 34 Z" fill="#2a1a0c"/>
    <path d="M 56 31 L 76 38 M 104 31 L 84 38" stroke="#6a5038" stroke-width="0.6"/>
    <!-- the beak, hooked and open, blood on it -->
    <path d="M 73 50 C 73 45, 87 45, 87 50 C 87 55, 84 59, 80 62 C 76 59, 73 55, 73 50 Z" fill="url(#how-beak)" stroke="#2a2010" stroke-width="0.6"/>
    <path d="M 75 60 C 77 64, 83 64, 85 60 C 84 66, 82 70, 80 71 C 78 70, 76 66, 75 60 Z" fill="url(#how-beak)" stroke="#2a2010" stroke-width="0.6"/>
    <path d="M 76 58 C 78 62, 82 62, 84 58 L 84 61 C 82 64, 78 64, 76 61 Z" fill="#3a0606"/>
    <path d="M 78 60 q 2 2 4 0" stroke="#a03040" stroke-width="1" fill="none"/>
    <path d="M 80 71 q 1 4 0 7 M 84 64 q 2 3 1 6" stroke="#6a0a0a" stroke-width="1.4" fill="none"/>
    </svg>
  `,


  // ─── Mimic ───────────────────────────────────────────────────────────────
  // The chest you were about to open: its lid peels back into a mouth lined
  // with wooden teeth and real ones, a long grey tongue lolls out, the iron
  // bands split to show wet pink flesh, and an eye opens in the lock-plate.
  'Mimic': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Mimic: a chest whose lid gapes into a toothed mouth, a long grey tongue lolling out, wet flesh showing through split bands, an eye in the lock">
    <defs>
      ${wetSkinFilter('hmi-flesh', { freq: '0.2 0.24', seed: 101, shine: 0.6 })}
      ${horrorSkinFilter('hmi-wood', { freq: '0.04 0.5', scale: 2, seed: 102, k: 1.25 })}
      <linearGradient id="hmi-oak" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a5232"/><stop offset="1" stop-color="#2a170a"/></linearGradient>
      <linearGradient id="hmi-iron" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6a6660"/><stop offset="1" stop-color="#22201e"/></linearGradient>
      <radialGradient id="hmi-gum" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#d87a8a"/><stop offset="0.6" stop-color="#8a2a3a"/><stop offset="1" stop-color="#2a0408"/></radialGradient>
      <radialGradient id="hmi-eye" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#f8f0c0"/><stop offset="0.6" stop-color="#c0a030"/><stop offset="1" stop-color="#4a3a10"/></radialGradient>
    </defs>
    <ellipse cx="80" cy="152" rx="56" ry="6" fill="#000" opacity="0.6"/>
    <!-- the box -->
    <path d="M 26 96 L 134 96 L 130 148 L 30 148 Z" fill="url(#hmi-oak)" filter="url(#hmi-wood)"/>
    <path d="M 26 96 L 134 96 L 133 104 L 27 104 Z M 30 140 L 130 140 L 130 148 L 30 148 Z" fill="url(#hmi-iron)"/>
    <path d="M 44 96 L 44 148 M 116 96 L 116 148" stroke="url(#hmi-iron)" stroke-width="8"/>
    <!-- bands split open on flesh -->
    <path d="M 40 116 C 42 112, 48 112, 48 118 C 48 124, 42 126, 40 120 Z M 112 122 C 114 118, 120 118, 120 124 C 120 130, 114 132, 112 126 Z" fill="url(#hmi-gum)" filter="url(#hmi-flesh)"/>
    <!-- the lock-plate eye -->
    <path d="M 70 104 L 90 104 L 90 128 L 80 134 L 70 128 Z" fill="url(#hmi-iron)" stroke="#111" stroke-width="0.8"/>
    <ellipse cx="80" cy="116" rx="7" ry="5" fill="url(#hmi-eye)"/><ellipse cx="80" cy="116" rx="1.4" ry="4" fill="#000"/>
    <path d="M 73 113 Q 80 109 87 113 M 73 119 Q 80 122 87 119" stroke="#2a1a10" stroke-width="1" fill="none"/>
    <!-- the lid, peeled back into a jaw -->
    <path d="M 22 92 C 20 54, 46 30, 80 28 C 114 30, 140 54, 138 92 Z" fill="url(#hmi-oak)" filter="url(#hmi-wood)"/>
    <path d="M 28 88 C 28 60, 50 40, 80 38 C 110 40, 132 60, 132 88 Z" fill="url(#hmi-gum)" filter="url(#hmi-flesh)"/>
    <path d="M 40 38 C 38 60, 38 76, 40 90 M 120 38 C 122 60, 122 76, 120 90" stroke="url(#hmi-iron)" stroke-width="7" fill="none"/>
    <!-- teeth: wooden splinters and real ones, top and bottom -->
    <g fill="#e0d4b0" stroke="#4a3a20" stroke-width="0.4">
      ${Array.from({ length: 14 }, (_, i) => { const x = 32 + i * 7; const t = (i % 3 === 0) ? 10 : 7; return `<path d="M ${x} 90 L ${x + 3.5} ${90 - t} L ${x + 7} 90 Z"/>`; }).join('')}
      ${Array.from({ length: 13 }, (_, i) => { const x = 34 + i * 7; const t = (i % 2 === 0) ? 9 : 6; return `<path d="M ${x} 96 L ${x + 3.5} ${96 + t} L ${x + 7} 96 Z"/>`; }).join('')}
    </g>
    <!-- the tongue, lolling out over the edge -->
    <path d="M 72 92 C 70 108, 60 124, 50 138 C 56 140, 62 136, 66 128 C 74 116, 82 104, 86 92 Z" fill="#8a7a84" filter="url(#hmi-flesh)"/>
    <path d="M 78 94 C 72 110, 64 122, 56 134" stroke="#5a4a54" stroke-width="1" fill="none"/>
    <path d="M 50 138 q -2 4 -1 8 M 58 134 q 0 4 1 7" stroke="#cfd8d0" stroke-width="0.6" fill="none" opacity="0.7"/>
    <!-- gold coins it used as bait, spilled -->
    <g fill="#d8b040" stroke="#6a4a10" stroke-width="0.4"><circle cx="100" cy="150" r="3"/><circle cx="106" cy="152" r="3"/><circle cx="96" cy="153" r="2.6"/></g>
    </svg>
  `,

  // ─── Gelatinous Cube ─────────────────────────────────────────────────────
  // A wall of clear, quivering jelly filling the corridor, and inside it,
  // half-dissolved, the things it has swallowed: a skeleton still reaching
  // out, a sword, a helmet, coins, bubbles of gas; the edges blur and fizz.
  'Gelatinous Cube': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Gelatinous Cube: a clear, quivering block of jelly with a half-dissolved skeleton, a sword, a helmet and coins suspended inside">
    <defs>
      <linearGradient id="hgc-jelly" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b8f0d8" stop-opacity="0.55"/><stop offset="0.5" stop-color="#60c0a0" stop-opacity="0.35"/><stop offset="1" stop-color="#205a48" stop-opacity="0.55"/></linearGradient>
      <linearGradient id="hgc-face" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e0fff0" stop-opacity="0.5"/><stop offset="1" stop-color="#60c0a0" stop-opacity="0.1"/></linearGradient>
      <filter id="hgc-blur" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="0.7"/></filter>
    </defs>
    <ellipse cx="80" cy="154" rx="60" ry="5" fill="#0a2a20" opacity="0.6"/>
    <!-- what it swallowed, behind the jelly -->
    <g filter="url(#hgc-blur)" opacity="0.85">
      <!-- a skeleton, still reaching out -->
      <circle cx="66" cy="68" r="10" fill="#d8ccaa"/><circle cx="62" cy="66" r="2.6" fill="#2a3a30"/><circle cx="70" cy="66" r="2.6" fill="#2a3a30"/>
      <path d="M 62 74 h 8" stroke="#2a3a30" stroke-width="1.4"/>
      <path d="M 66 78 L 66 112 M 56 86 L 76 86 M 57 92 L 75 92 M 58 98 L 74 98" stroke="#d8ccaa" stroke-width="3"/>
      <path d="M 66 82 L 92 70 L 104 62" stroke="#d8ccaa" stroke-width="3" fill="none"/>
      <path d="M 104 62 l 4 -4 M 104 62 l 5 -1 M 104 62 l 3 2" stroke="#d8ccaa" stroke-width="1.6"/>
      <path d="M 66 112 L 58 136 M 66 112 L 76 134" stroke="#d8ccaa" stroke-width="3"/>
      <!-- a sword, a helmet, coins -->
      <path d="M 96 120 L 128 92" stroke="#9aa4ac" stroke-width="3"/><path d="M 100 112 L 106 120" stroke="#5a4a2a" stroke-width="3"/>
      <path d="M 104 136 C 104 126, 120 126, 120 136 Z" fill="#7a7468"/>
      <g fill="#d8b040"><circle cx="40" cy="126" r="3"/><circle cx="48" cy="132" r="2.6"/><circle cx="44" cy="118" r="2.4"/><circle cx="118" cy="56" r="2.4"/></g>
    </g>
    <!-- the cube itself: clear, quivering, its faces catching the light -->
    <path d="M 20 30 L 140 30 L 146 148 L 14 148 Z" fill="url(#hgc-jelly)" stroke="#a8f0d0" stroke-width="1" stroke-opacity="0.5"/>
    <path d="M 20 30 L 140 30 L 128 20 L 32 20 Z" fill="url(#hgc-face)"/>
    <path d="M 140 30 L 128 20 L 132 136 L 146 148 Z" fill="#60c0a0" opacity="0.2"/>
    <path d="M 28 40 C 50 36, 70 44, 94 38 M 24 70 C 30 90, 26 110, 30 132" stroke="#e8fff4" stroke-width="1" fill="none" opacity="0.5"/>
    <!-- bubbles rising, and the edges fizzing on the floor -->
    <g fill="none" stroke="#e8fff4" stroke-width="0.7" opacity="0.6" class="obj-sparkle">
      <circle cx="86" cy="96" r="2"/><circle cx="90" cy="80" r="1.4"/><circle cx="84" cy="62" r="1"/><circle cx="34" cy="100" r="1.6"/><circle cx="120" cy="110" r="1.8"/>
    </g>
    <path d="M 14 148 q 4 -3 8 0 q 4 -3 8 0 q 4 -3 8 0 M 120 148 q 4 -3 8 0 q 4 -3 8 0 q 4 -3 8 0" stroke="#a8f0d0" stroke-width="0.8" fill="none" opacity="0.6"/>
    </svg>
  `,

  // ─── Wight ───────────────────────────────────────────────────────────────
  // A barrow-dead warrior: leathery black-blue skin drawn tight over bone,
  // hair still long and white, eyes two pits with a cold point of light,
  // long nails like horn, reaching for your life; a torn burial shroud.
  'Wight': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Wight: a gaunt corpse with leathery blue-black skin and long white hair, cold points of light in its eye pits, long horn nails reaching, in a torn shroud">
    <defs>
      ${horrorSkinFilter('hwt-skin', { freq: '0.24 0.3', scale: 2.6, seed: 103, k: 1.25 })}
      <radialGradient id="hwt-flesh" cx="45%" cy="30%" r="80%"><stop offset="0" stop-color="#6a7488"/><stop offset="0.55" stop-color="#3a4254"/><stop offset="1" stop-color="#121620"/></radialGradient>
      <linearGradient id="hwt-shroud" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a8a494"/><stop offset="1" stop-color="#3a382e" stop-opacity="0.4"/></linearGradient>
      <radialGradient id="hwt-eye" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffffff"/><stop offset="0.3" stop-color="#9ad0ff"/><stop offset="1" stop-color="#204080" stop-opacity="0"/></radialGradient>
    </defs>
    <!-- the shroud, torn -->
    <path d="M 52 64 C 44 92, 40 122, 36 154 L 48 148 L 54 156 L 64 148 L 72 156 L 82 148 L 92 156 L 100 148 L 108 156 L 114 148 L 124 154 C 120 122, 116 92, 108 64 Z" fill="url(#hwt-shroud)" filter="url(#hwt-skin)" opacity="0.9"/>
    <path d="M 60 80 L 58 140 M 80 80 L 80 146 M 100 80 L 102 140" stroke="#2a2820" stroke-width="0.8" opacity="0.5"/>
    <!-- the chest, ribs pushing through leather skin -->
    <path d="M 62 60 L 98 60 L 100 92 L 60 92 Z" fill="url(#hwt-flesh)" filter="url(#hwt-skin)"/>
    <path d="M 64 68 Q 72 64 78 70 M 82 70 Q 88 64 96 68 M 64 76 Q 72 72 78 78 M 82 78 Q 88 72 96 76 M 66 84 Q 72 80 78 86 M 82 86 Q 88 80 94 84" stroke="#0a0c14" stroke-width="1.2" fill="none"/>
    <!-- arms reaching for you, nails like horn -->
    <path d="M 62 62 C 48 66, 36 74, 26 84 L 30 90 C 40 82, 52 76, 64 72 Z M 98 62 C 112 66, 124 74, 134 84 L 130 90 C 120 82, 108 76, 96 72 Z" fill="url(#hwt-flesh)" filter="url(#hwt-skin)"/>
    <g stroke="#3a4254" stroke-width="2" fill="none" stroke-linecap="round">
      <path d="M 26 86 C 20 84, 16 80, 12 76"/><path d="M 27 88 C 21 88, 15 88, 10 88"/><path d="M 28 90 C 22 94, 18 96, 14 100"/>
      <path d="M 134 86 C 140 84, 144 80, 148 76"/><path d="M 133 88 C 139 88, 145 88, 150 88"/><path d="M 132 90 C 138 94, 142 96, 146 100"/>
    </g>
    <g stroke="#c8b890" stroke-width="1.6" stroke-linecap="round"><path d="M 12 76 l -4 -3"/><path d="M 10 88 l -5 0"/><path d="M 14 100 l -4 3"/><path d="M 148 76 l 4 -3"/><path d="M 150 88 l 5 0"/><path d="M 146 100 l 4 3"/></g>
    <!-- long white hair, still, around a shrunken face -->
    <path d="M 62 24 C 52 40, 50 66, 46 92 L 54 90 C 56 70, 58 50, 64 36 Z M 98 24 C 108 40, 110 66, 114 92 L 106 90 C 104 70, 102 50, 96 36 Z" fill="#d8d8d0" opacity="0.8"/>
    <path d="M 56 50 L 52 86 M 104 50 L 108 86" stroke="#8a8a84" stroke-width="0.6"/>
    <path d="M 66 34 C 64 20, 72 12, 80 12 C 88 12, 96 20, 94 34 C 94 46, 88 56, 80 58 C 72 56, 66 46, 66 34 Z" fill="url(#hwt-flesh)" filter="url(#hwt-skin)"/>
    <path d="M 66 22 C 70 14, 90 14, 94 22" fill="#d8d8d0" opacity="0.8"/>
    <path d="M 68 28 C 68 24, 76 24, 77 30 C 76 35, 69 35, 68 28 Z M 83 30 C 84 24, 92 24, 92 28 C 91 35, 84 35, 83 30 Z" fill="#020306"/>
    <circle cx="72.6" cy="30" r="3.4" fill="url(#hwt-eye)"/><circle cx="87.4" cy="30" r="3.4" fill="url(#hwt-eye)"/>
    <path d="M 80 34 L 77.6 41 L 82.4 41 Z" fill="#0a0c14"/>
    <path d="M 72 48 Q 80 52 88 48 Q 80 55 72 48 Z" fill="#020306"/>
    <path d="M 73 48.6 l 1 3 l 1 -2.6 l 1 3 l 1 -2.6 l 1 3 l 1 -2.6 l 1 3 l 1 -2.6 l 1 3 l 1 -2.6 l 1 3 l 1 -2.6 l 1 2.6" stroke="#b8b098" stroke-width="0.5" fill="none"/>
    <path d="M 68 40 Q 70 46 73 50 M 92 40 Q 90 46 87 50" stroke="#0a0c14" stroke-width="1.2" fill="none"/>
    </svg>
  `,

  // ─── Spectre ─────────────────────────────────────────────────────────────
  // The ghost of someone who died badly: a shape of cold grey light,
  // translucent, the wall showing through it, a face stretched long in a
  // silent howl, hands of smoke; it flickers as if it isn't quite here.
  'Spectre': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Spectre: a translucent figure of cold grey light, its face stretched in a silent howl, hands of smoke reaching">
    <defs>
      <filter id="hspc-mist" x="-30%" y="-30%" width="160%" height="160%"><feTurbulence type="fractalNoise" baseFrequency="0.05 0.12" numOctaves="3" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="9"/><feGaussianBlur stdDeviation="0.8"/></filter>
      <radialGradient id="hspc-body" cx="50%" cy="30%" r="70%"><stop offset="0" stop-color="#e8f0f4" stop-opacity="0.85"/><stop offset="0.6" stop-color="#8a9aa8" stop-opacity="0.45"/><stop offset="1" stop-color="#3a4a58" stop-opacity="0"/></radialGradient>
      <radialGradient id="hspc-face" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#f4f8fa"/><stop offset="1" stop-color="#8a9aa8"/></radialGradient>
    </defs>
    <!-- the shape: cold light, fraying into mist below -->
    <g filter="url(#hspc-mist)" class="obj-sparkle">
      <path d="M 56 54 C 44 80, 40 110, 30 152 L 130 152 C 120 110, 116 80, 104 54 C 96 44, 64 44, 56 54 Z" fill="url(#hspc-body)"/>
      <!-- hands of smoke reaching -->
      <path d="M 58 62 C 44 70, 30 72, 16 66 C 26 74, 40 78, 56 74 Z M 102 62 C 116 70, 130 72, 144 66 C 134 74, 120 78, 104 74 Z" fill="#c8d4dc" opacity="0.7"/>
      <path d="M 16 66 l -6 -6 M 16 66 l -8 -1 M 16 66 l -6 4 M 144 66 l 6 -6 M 144 66 l 8 -1 M 144 66 l 6 4" stroke="#e8f0f4" stroke-width="1.6" opacity="0.7"/>
    </g>
    <!-- the face, stretched long in a silent howl -->
    <path d="M 66 28 C 64 14, 72 8, 80 8 C 88 8, 96 14, 94 28 C 94 46, 90 64, 80 70 C 70 64, 66 46, 66 28 Z" fill="url(#hspc-face)" opacity="0.85"/>
    <path d="M 69 24 C 69 19, 77 19, 77 25 C 77 31, 69 31, 69 24 Z M 83 25 C 83 19, 91 19, 91 24 C 91 31, 83 31, 83 25 Z" fill="#06090c"/>
    <path d="M 72 29 C 71 34, 72 38, 70 44 M 88 29 C 89 34, 88 38, 90 44" stroke="#5a6a74" stroke-width="1" fill="none"/>
    <path d="M 75 38 C 72 48, 72 58, 76 66 C 78 69, 82 69, 84 66 C 88 58, 88 48, 85 38 C 82 36, 78 36, 75 38 Z" fill="#030406"/>
    <path d="M 75 38 C 72 48, 72 58, 76 66 M 85 38 C 88 48, 88 58, 84 66" stroke="#b8c8d0" stroke-width="0.6" fill="none"/>
    </svg>
  `,

  // ─── Caput Mortuum ───────────────────────────────────────────────────────
  // The dead head: a sorcerer's skull, all that's left, yellowed and cracked,
  // gems pressed into its sockets and set in its teeth, floating above a
  // heap of its own dust; the gems burn with souls it has already taken.
  'Caput Mortuum': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Caput Mortuum: a cracked, yellowed sorcerer's skull with burning gems in its sockets and teeth, floating above a heap of dust, faces of trapped souls in the gems">
    <defs>
      ${horrorSkinFilter('hcm-bone', { freq: '0.2 0.26', scale: 2.4, seed: 104, k: 1.25 })}
      <radialGradient id="hcm-skull" cx="42%" cy="30%" r="75%"><stop offset="0" stop-color="#e8dcb8"/><stop offset="0.55" stop-color="#a89060"/><stop offset="1" stop-color="#3a2e18"/></radialGradient>
      <radialGradient id="hcm-gem" cx="40%" cy="35%" r="60%"><stop offset="0" stop-color="#e0ffe0"/><stop offset="0.35" stop-color="#40e060"/><stop offset="1" stop-color="#0a4010"/></radialGradient>
      <radialGradient id="hcm-red" cx="40%" cy="35%" r="60%"><stop offset="0" stop-color="#ffd0d0"/><stop offset="0.35" stop-color="#e02040"/><stop offset="1" stop-color="#400008"/></radialGradient>
      <radialGradient id="hcm-glow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#60ff80" stop-opacity="0.35"/><stop offset="1" stop-color="#60ff80" stop-opacity="0"/></radialGradient>
      <filter id="hcm-g" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <circle cx="80" cy="66" r="62" fill="url(#hcm-glow)"/>
    <!-- the heap of its own dust -->
    <path d="M 40 150 C 50 136, 66 130, 80 130 C 94 130, 110 136, 120 150 Z" fill="#6a5e48"/>
    <path d="M 52 146 l 6 -4 M 70 140 l 4 -2 M 96 142 l 6 2" stroke="#3a3020" stroke-width="1"/>
    <path d="M 62 150 l 2 -6 l 3 0 l 2 6 Z" fill="#c8bca0"/>
    <!-- motes rising from it to the skull -->
    <g fill="#a8c8a0" opacity="0.6" class="obj-sparkle"><circle cx="72" cy="120" r="1"/><circle cx="86" cy="112" r="0.8"/><circle cx="78" cy="104" r="1.1"/><circle cx="90" cy="124" r="0.7"/></g>
    <!-- the skull, floating, cracked, yellowed -->
    <path d="M 44 60 C 40 30, 58 14, 80 14 C 102 14, 120 30, 116 60 C 114 74, 106 82, 102 88 L 58 88 C 54 82, 46 74, 44 60 Z" fill="url(#hcm-skull)" filter="url(#hcm-bone)"/>
    <path d="M 62 18 L 66 30 L 60 40 M 98 20 L 94 32 L 100 42 M 80 14 L 82 24" stroke="#3a2e18" stroke-width="1.2" fill="none"/>
    <path d="M 50 62 C 52 70, 56 76, 60 80 M 110 62 C 108 70, 104 76, 100 80" stroke="#3a2e18" stroke-width="1.6" fill="none"/>
    <!-- the jaw -->
    <path d="M 58 88 C 58 98, 66 104, 80 104 C 94 104, 102 98, 102 88 Z" fill="url(#hcm-skull)" filter="url(#hcm-bone)"/>
    <!-- gem eyes, burning, faces of trapped souls inside -->
    <path d="M 52 52 C 52 42, 66 40, 72 48 C 74 58, 66 66, 58 64 C 54 62, 52 58, 52 52 Z M 108 52 C 108 42, 94 40, 88 48 C 86 58, 94 66, 102 64 C 106 62, 108 58, 108 52 Z" fill="#050403"/>
    <ellipse cx="62" cy="54" rx="7" ry="7.5" fill="url(#hcm-gem)" filter="url(#hcm-g)"/><ellipse cx="98" cy="54" rx="7" ry="7.5" fill="url(#hcm-gem)" filter="url(#hcm-g)"/>
    <g fill="none" stroke="#0a3010" stroke-width="0.6" opacity="0.8">
      <path d="M 59 52 l 1 0 M 64 52 l 1 0 M 60 57 q 2 2 4 0"/><path d="M 95 52 l 1 0 M 100 52 l 1 0 M 96 57 q 2 2 4 0"/>
    </g>
    <path d="M 80 62 L 74 74 L 86 74 Z" fill="#050403"/>
    <!-- teeth, some of them gems -->
    <g stroke="#3a2e18" stroke-width="0.5">
      <rect x="62" y="84" width="5" height="8" fill="#e0d4b0"/><rect x="68" y="85" width="5" height="9" fill="url(#hcm-red)" filter="url(#hcm-g)"/><rect x="74" y="85" width="5" height="9" fill="#e0d4b0"/>
      <rect x="80" y="85" width="5" height="9" fill="#e0d4b0"/><rect x="86" y="85" width="5" height="9" fill="url(#hcm-gem)" filter="url(#hcm-g)"/><rect x="92" y="84" width="5" height="8" fill="#e0d4b0"/>
      <rect x="64" y="94" width="5" height="6" fill="#c8bc98"/><rect x="72" y="95" width="5" height="6" fill="#c8bc98"/><rect x="80" y="95" width="5" height="6" fill="url(#hcm-red)"/><rect x="88" y="94" width="5" height="6" fill="#c8bc98"/>
    </g>
    </svg>
  `,


  // ─── Wendigo ─────────────────────────────────────────────────────────────
  // Starvation given a body: impossibly tall and thin, skin grey and split
  // over every bone, a deer's skull for a face with antlers like dead
  // branches, lips eaten away, a mouth that never stops chewing; frost.
  'Wendigo': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Wendigo: an impossibly tall, starved grey creature with a deer skull face and dead-branch antlers, lips eaten away, frost at its feet">
    <defs>
      ${horrorSkinFilter('hwd-skin', { freq: '0.2 0.3', scale: 2.6, seed: 111, k: 1.25 })}
      <linearGradient id="hwd-flesh" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="#9a9a90"/><stop offset="0.5" stop-color="#5a5a52"/><stop offset="1" stop-color="#1a1a16"/></linearGradient>
      <radialGradient id="hwd-skull" cx="45%" cy="35%" r="70%"><stop offset="0" stop-color="#ece4cc"/><stop offset="1" stop-color="#8a7e60"/></radialGradient>
      <radialGradient id="hwd-eye" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff"/><stop offset="0.3" stop-color="#a8e0ff"/><stop offset="1" stop-color="#2050a0" stop-opacity="0"/></radialGradient>
    </defs>
    <ellipse cx="80" cy="154" rx="48" ry="6" fill="#d8eeff" opacity="0.25"/>
    <!-- antlers like dead branches -->
    <g stroke="#3a3228" stroke-width="2.2" fill="none" stroke-linecap="round">
      <path d="M 70 26 C 60 14, 56 4, 50 -2 M 62 14 L 50 12 M 58 8 L 52 0 M 66 20 L 56 22"/>
      <path d="M 90 26 C 100 14, 104 4, 110 -2 M 98 14 L 110 12 M 102 8 L 108 0 M 94 20 L 104 22"/>
    </g>
    <!-- legs, long as stilts -->
    <path d="M 70 104 L 64 152 L 70 152 L 76 106 Z M 86 106 L 92 152 L 98 152 L 92 104 Z" fill="url(#hwd-flesh)" filter="url(#hwd-skin)"/>
    <path d="M 62 152 l -6 2 M 66 152 l -2 4 M 96 152 l 6 2 M 92 152 l 2 4" stroke="#1a1a16" stroke-width="1.6" stroke-linecap="round"/>
    <!-- a trunk of nothing but ribs and spine -->
    <path d="M 66 50 C 62 70, 62 90, 68 106 L 92 106 C 98 90, 98 70, 94 50 Z" fill="url(#hwd-flesh)" filter="url(#hwd-skin)"/>
    <g stroke="#0e0e0a" stroke-width="1.4" fill="none"><path d="M 68 58 Q 74 55 79 59 M 81 59 Q 86 55 92 58 M 67 66 Q 74 62 79 67 M 81 67 Q 86 62 93 66 M 67 74 Q 74 70 79 75 M 81 75 Q 86 70 93 74 M 68 82 Q 74 78 79 83 M 81 83 Q 86 78 92 82"/></g>
    <path d="M 70 92 Q 80 100 90 92" stroke="#0e0e0a" stroke-width="2" fill="none"/>
    <path d="M 74 100 C 74 94, 86 94, 86 100" fill="#2a0606" opacity="0.7"/>
    <!-- arms down past the knees, claw-fingered -->
    <path d="M 66 52 C 54 70, 50 100, 48 128 L 54 128 C 56 100, 60 74, 70 58 Z M 94 52 C 106 70, 110 100, 112 128 L 106 128 C 104 100, 100 74, 90 58 Z" fill="url(#hwd-flesh)" filter="url(#hwd-skin)"/>
    <g stroke="#2a2a24" stroke-width="1.8" fill="none" stroke-linecap="round"><path d="M 48 128 l -4 10 M 50 128 l -1 12 M 53 128 l 2 11 M 112 128 l 4 10 M 110 128 l 1 12 M 107 128 l -2 11"/></g>
    <!-- a deer's skull for a face -->
    <path d="M 68 28 C 66 20, 72 14, 80 14 C 88 14, 94 20, 92 28 C 92 36, 88 42, 86 52 L 74 52 C 72 42, 68 36, 68 28 Z" fill="url(#hwd-skull)" filter="url(#hwd-skin)"/>
    <path d="M 70 26 C 70 22, 76 22, 76 27 C 76 31, 70 31, 70 26 Z M 84 27 C 84 22, 90 22, 90 26 C 90 31, 84 31, 84 27 Z" fill="#050607"/>
    <circle cx="73" cy="27" r="2.4" fill="url(#hwd-eye)"/><circle cx="87" cy="27" r="2.4" fill="url(#hwd-eye)"/>
    <path d="M 78 36 L 80 42 L 82 36" stroke="#4a4030" stroke-width="1" fill="none"/>
    <!-- lips eaten away: the jaw, teeth, frozen blood -->
    <path d="M 74 46 L 86 46 L 85 54 L 75 54 Z" fill="#100604"/>
    <path d="M 75 46 l 1 3 l 1 -3 l 1 3 l 1 -3 l 1 3 l 1 -3 l 1 3 l 1 -3 l 1 3 l 1 -3 l 1 3 M 75 54 l 1 -3 l 1 3 l 1 -3 l 1 3 l 1 -3 l 1 3 l 1 -3 l 1 3 l 1 -3 l 1 3" stroke="#e0d8c0" stroke-width="0.6" fill="none"/>
    <path d="M 76 54 q 0 4 -1 8 M 84 54 q 1 3 0 6" stroke="#5a0a10" stroke-width="1.4" fill="none"/>
    <g fill="#e8f6ff" opacity="0.6"><circle cx="40" cy="40" r="1"/><circle cx="124" cy="60" r="1.2"/><circle cx="30" cy="90" r="0.8"/><circle cx="134" cy="110" r="1"/></g>
    </svg>
  `,

  // ─── Manticore ───────────────────────────────────────────────────────────
  // A lion's body, a man's face with three rows of shark's teeth, bat wings,
  // and a scorpion tail bristling with iron spikes it can fling.
  'Manticore': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Manticore: a lion-bodied beast with a man's face and three rows of shark teeth, bat wings, and a spiked scorpion tail">
    <defs>
      ${horrorSkinFilter('hmc-fur', { freq: '0.4 0.12', scale: 2.2, seed: 112, k: 1.25 })}
      <linearGradient id="hmc-pelt" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="#b07a40"/><stop offset="0.5" stop-color="#6a421c"/><stop offset="1" stop-color="#241408"/></linearGradient>
      <radialGradient id="hmc-face" cx="45%" cy="35%" r="70%"><stop offset="0" stop-color="#d8a080"/><stop offset="1" stop-color="#6a3a28"/></radialGradient>
      <linearGradient id="hmc-wing" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2418"/><stop offset="1" stop-color="#120a06"/></linearGradient>
    </defs>
    <ellipse cx="80" cy="152" rx="62" ry="5" fill="#000" opacity="0.6"/>
    <!-- bat wings -->
    <path d="M 64 70 C 50 44, 28 30, 6 28 C 14 40, 14 52, 10 62 C 20 58, 28 62, 30 72 C 38 66, 48 68, 52 78 Z" fill="url(#hmc-wing)"/>
    <path d="M 96 70 C 110 44, 132 30, 154 28 C 146 40, 146 52, 150 62 C 140 58, 132 62, 130 72 C 122 66, 112 68, 108 78 Z" fill="url(#hmc-wing)"/>
    <path d="M 64 70 C 50 44, 28 30, 6 28 M 44 50 L 10 62 M 54 62 L 30 72 M 96 70 C 110 44, 132 30, 154 28 M 116 50 L 150 62 M 106 62 L 130 72" stroke="#5a3a26" stroke-width="1.6" fill="none"/>
    <!-- the scorpion tail arched over, spiked -->
    <path d="M 118 110 C 140 102, 150 80, 144 58 C 140 44, 128 40, 120 48" stroke="url(#hmc-pelt)" stroke-width="7" fill="none" stroke-linecap="round" filter="url(#hmc-fur)"/>
    <g fill="#3a3a40" stroke="#0a0a0a" stroke-width="0.5">
      <path d="M 120 48 l -10 -6 l 4 8 Z M 124 44 l -4 -10 l 7 6 Z M 129 43 l 2 -10 l 2 9 Z M 140 54 l 9 -4 l -5 8 Z M 145 66 l 9 2 l -8 4 Z"/>
    </g>
    <!-- the lion body, crouched to spring -->
    <path d="M 34 106 C 30 90, 44 78, 66 78 L 110 80 C 128 84, 134 98, 128 112 C 120 124, 46 126, 34 106 Z" fill="url(#hmc-pelt)" filter="url(#hmc-fur)"/>
    <path d="M 40 112 L 34 150 L 46 150 L 52 118 Z M 112 116 L 116 150 L 128 150 L 124 112 Z" fill="url(#hmc-pelt)" filter="url(#hmc-fur)"/>
    <g stroke="#e8e0c8" stroke-width="1.4" stroke-linecap="round"><path d="M 34 150 l -3 3 M 38 150 l -1 4 M 42 150 l 1 4 M 116 150 l -2 4 M 120 150 l 0 4 M 124 150 l 2 4"/></g>
    <!-- the mane around a man's face -->
    <circle cx="48" cy="70" r="26" fill="#4a2a10" filter="url(#hmc-fur)"/>
    <path d="M 36 66 C 34 52, 42 46, 50 46 C 58 46, 64 52, 62 66 C 62 76, 56 84, 50 86 C 42 84, 36 76, 36 66 Z" fill="url(#hmc-face)" filter="url(#hmc-fur)"/>
    <path d="M 40 60 Q 45 56 48 61 M 52 61 Q 55 56 60 60" stroke="#2a1008" stroke-width="2" fill="none"/>
    <ellipse cx="44" cy="63" rx="3" ry="2" fill="#f0e8c0"/><ellipse cx="56" cy="63" rx="3" ry="2" fill="#f0e8c0"/>
    <circle cx="44" cy="63" r="1.2" fill="#000"/><circle cx="56" cy="63" r="1.2" fill="#000"/>
    <!-- three rows of shark's teeth in a mouth too wide for the face -->
    <path d="M 38 72 Q 50 90 62 72 Q 50 78 38 72 Z" fill="#1a0404"/>
    <g>${needleTeeth(39, 61, 72.6, 11, 3.2, 1, '#f0e8d0', 0.2)}</g>
    <g>${needleTeeth(41, 59, 76, 9, 2.6, 1, '#d8ccaa', 0.2)}</g>
    <g>${needleTeeth(43, 57, 79, 7, 2.2, 1, '#c0b490', 0.2)}</g>
    </svg>
  `,

  // ─── Hydra ───────────────────────────────────────────────────────────────
  // A swamp-reeking serpent body with many heads on long scaled necks, each
  // gaping; two freshly cut stumps already budding new heads.
  'Hydra': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Hydra: a scaled swamp beast with many gaping serpent heads, two cut stumps budding new ones">
    <defs>
      ${wetSkinFilter('hhy-hide', { freq: '0.18 0.22', seed: 113, shine: 0.45 })}
      ${scalePattern('hhy-sc', 3, '#041008', '#a8d898')}
      <linearGradient id="hhy-body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a7a4a"/><stop offset="0.6" stop-color="#1e3a22"/><stop offset="1" stop-color="#06120a"/></linearGradient>
      <g id="hhy-head">
        <path d="M 0 0 C 6 -6, 16 -6, 20 0 L 26 4 L 20 8 C 14 12, 4 10, 0 6 Z" fill="url(#hhy-body)" stroke="#041008" stroke-width="0.6"/>
        <path d="M 8 6 L 24 4 L 22 12 C 16 14, 10 12, 8 8 Z" fill="#3a0606"/>
        <path d="M 10 6 l 2 2 l 2 -2 l 2 2 l 2 -2 l 2 2 l 2 -2 M 10 10 l 2 -2 l 2 2 l 2 -2 l 2 2" stroke="#e8e0c0" stroke-width="0.6" fill="none"/>
        <circle cx="12" cy="1" r="1.6" fill="#e8c020"/><path d="M 12 0 L 12 2" stroke="#000" stroke-width="0.6"/>
      </g>
    </defs>
    <!-- black water -->
    <path d="M 0 132 C 30 126, 60 136, 90 130 C 120 126, 140 134, 160 130 L 160 160 L 0 160 Z" fill="#04100c"/>
    <!-- necks and heads, each its own way -->
    ${[[56, 100, 22, 30, -0.6], [68, 96, 46, 14, -0.2], [92, 96, 104, 12, 0.2], [104, 100, 132, 28, 0.6], [80, 94, 80, 22, 0]].map(([x0, y0, x1, y1]) => `
      <path d="M ${x0} ${y0} C ${x0} ${(y0 + y1) / 2}, ${x1} ${(y0 + y1) / 2 + 10}, ${x1} ${y1}" stroke="url(#hhy-body)" stroke-width="8" fill="none" stroke-linecap="round" filter="url(#hhy-hide)"/>
      <path d="M ${x0} ${y0} C ${x0} ${(y0 + y1) / 2}, ${x1} ${(y0 + y1) / 2 + 10}, ${x1} ${y1}" stroke="url(#hhy-sc)" stroke-width="8" fill="none" stroke-linecap="round" opacity="0.6"/>`).join('')}
    <use href="#hhy-head" transform="translate(12 22) rotate(-30)"/>
    <use href="#hhy-head" transform="translate(40 6) rotate(-10)"/>
    <use href="#hhy-head" transform="translate(98 2) rotate(10) scale(-1 1) translate(-26 0)"/>
    <use href="#hhy-head" transform="translate(124 18) rotate(30) scale(-1 1) translate(-26 0)"/>
    <use href="#hhy-head" transform="translate(70 14)"/>
    <!-- cut stumps, budding -->
    <path d="M 60 98 C 54 84, 46 78, 38 76" stroke="url(#hhy-body)" stroke-width="7" fill="none" stroke-linecap="round"/>
    <ellipse cx="38" cy="76" rx="4.4" ry="3.6" fill="#8a1a1a"/><circle cx="36" cy="74" r="2" fill="#7aa86a"/><circle cx="40" cy="73" r="1.6" fill="#7aa86a"/>
    <path d="M 100 98 C 108 86, 116 82, 124 82" stroke="url(#hhy-body)" stroke-width="7" fill="none" stroke-linecap="round"/>
    <ellipse cx="124" cy="82" rx="4.4" ry="3.6" fill="#8a1a1a"/><circle cx="126" cy="80" r="2" fill="#7aa86a"/>
    <!-- the squat body, half in the water -->
    <ellipse cx="80" cy="120" rx="44" ry="24" fill="url(#hhy-body)" filter="url(#hhy-hide)"/>
    <ellipse cx="80" cy="120" rx="44" ry="24" fill="url(#hhy-sc)" opacity="0.6"/>
    <path d="M 0 136 C 30 130, 60 140, 90 134 C 120 130, 140 138, 160 134 L 160 160 L 0 160 Z" fill="#04100c" opacity="0.85"/>
    </svg>
  `,

  // ─── Basilisk ────────────────────────────────────────────────────────────
  // A long, low, eight-legged lizard, warty and grey-green, a crest of
  // bone; its eyes the only bright thing in the dark. A man turned to stone
  // behind it, mid-step, looking straight at you.
  'Basilisk': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Basilisk: a long eight-legged warty lizard with a bone crest and blazing eyes, a man turned to stone behind it">
    <defs>
      ${wetSkinFilter('hbs-hide', { freq: '0.24 0.3', seed: 114, shine: 0.3 })}
      ${horrorSkinFilter('hbs-stone', { freq: '0.2', scale: 3, seed: 115, k: 1.3 })}
      <linearGradient id="hbs-body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a8a5a"/><stop offset="0.6" stop-color="#3a4628"/><stop offset="1" stop-color="#121808"/></linearGradient>
      <radialGradient id="hbs-eye" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffffd0"/><stop offset="0.35" stop-color="#ffd020"/><stop offset="1" stop-color="#806000" stop-opacity="0"/></radialGradient>
    </defs>
    <!-- the stone man behind, mid-step -->
    <g filter="url(#hbs-stone)" fill="#6e6c66">
      <path d="M 120 40 C 118 30, 124 24, 130 26 C 136 28, 136 38, 132 42 Z"/>
      <path d="M 120 44 L 140 44 L 142 90 L 118 90 Z"/>
      <path d="M 118 46 L 106 74 L 112 76 L 122 54 Z"/>
      <path d="M 122 90 L 116 128 L 124 128 L 130 92 Z M 132 90 L 140 126 L 146 124 L 138 90 Z"/>
    </g>
    <path d="M 126 32 l 2 0 M 131 32 l 2 0 M 127 37 q 2 2 4 0" stroke="#2a2a28" stroke-width="0.8" fill="none"/>
    <!-- eight legs, splayed -->
    <g stroke="url(#hbs-body)" stroke-width="5" stroke-linecap="round" fill="none">
      <path d="M 30 112 L 18 128 L 10 128"/><path d="M 50 116 L 44 134 L 36 136"/><path d="M 70 118 L 68 138 L 60 140"/><path d="M 90 118 L 92 138 L 84 142"/>
    </g>
    <!-- the long, low body, crested -->
    <path d="M 4 100 C 20 88, 60 88, 100 96 C 120 100, 124 112, 110 118 C 80 126, 30 124, 10 114 Z" fill="url(#hbs-body)" filter="url(#hbs-hide)"/>
    <g fill="#c8bc98" stroke="#3a3020" stroke-width="0.5"><path d="M 30 92 l 4 -10 l 4 10 Z M 44 90 l 4 -12 l 4 12 Z M 58 90 l 4 -12 l 4 12 Z M 72 92 l 4 -10 l 4 10 Z M 86 94 l 3 -8 l 3 8 Z"/></g>
    <g fill="#5a6a40" stroke="#121808" stroke-width="0.4"><circle cx="40" cy="104" r="2"/><circle cx="62" cy="108" r="2.4"/><circle cx="84" cy="106" r="1.8"/><circle cx="24" cy="106" r="1.6"/></g>
    <!-- the head, low, turned to you; the eyes -->
    <path d="M 4 100 C -4 98, -6 108, 2 112 L 14 112 Z" fill="url(#hbs-body)"/>
    <path d="M 110 96 C 124 88, 140 92, 148 102 C 140 112, 124 116, 110 112 Z" fill="url(#hbs-body)" filter="url(#hbs-hide)"/>
    <path d="M 118 108 L 150 104 L 146 110 C 136 114, 124 114, 116 112 Z" fill="#200606"/>
    <path d="M 120 108 l 2 3 l 2 -3 l 2 3 l 2 -3 l 2 3 l 2 -3 l 2 3 l 2 -3 l 2 3 l 2 -3 l 2 3" stroke="#e0d8b8" stroke-width="0.6" fill="none"/>
    <circle cx="130" cy="99" r="9" fill="url(#hbs-eye)" opacity="0.7"/>
    <circle cx="130" cy="99" r="3.4" fill="#ffe040"/><ellipse cx="130" cy="99" rx="0.9" ry="3" fill="#000"/>
    <path d="M 120 96 L 140 92" stroke="#121808" stroke-width="1.6"/>
    </svg>
  `,

  // ─── Harpy ───────────────────────────────────────────────────────────────
  // A starved hag's torso and screaming face on a vulture's body: filthy
  // matted feathers, long yellow talons hooked to tear, hair in greasy ropes.
  'Harpy': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Harpy: a screaming hag's face and starved torso on a vulture's filthy feathered body, long yellow talons outstretched">
    <defs>
      ${horrorSkinFilter('hhp-skin', { freq: '0.22 0.28', scale: 2.4, seed: 116, k: 1.25 })}
      ${horrorSkinFilter('hhp-feather', { freq: '0.08 0.5', scale: 2, seed: 117, k: 1.2 })}
      <radialGradient id="hhp-flesh" cx="45%" cy="30%" r="80%"><stop offset="0" stop-color="#b8a088"/><stop offset="0.6" stop-color="#6a5440"/><stop offset="1" stop-color="#241a10"/></radialGradient>
      <linearGradient id="hhp-wing" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3228"/><stop offset="1" stop-color="#0e0a06"/></linearGradient>
    </defs>
    <!-- wings spread, ragged -->
    <path d="M 64 64 C 44 50, 22 46, 2 52 L 10 60 L 2 66 L 14 70 L 6 78 L 20 80 L 14 88 C 34 86, 50 80, 62 74 Z" fill="url(#hhp-wing)" filter="url(#hhp-feather)"/>
    <path d="M 96 64 C 116 50, 138 46, 158 52 L 150 60 L 158 66 L 146 70 L 154 78 L 140 80 L 146 88 C 126 86, 110 80, 98 74 Z" fill="url(#hhp-wing)" filter="url(#hhp-feather)"/>
    <!-- vulture body, filthy -->
    <path d="M 60 80 C 54 100, 58 118, 70 126 L 90 126 C 102 118, 106 100, 100 80 Z" fill="url(#hhp-wing)" filter="url(#hhp-feather)"/>
    <path d="M 64 96 l 4 8 M 74 100 l 2 10 M 88 100 l -2 10 M 96 96 l -4 8" stroke="#4a4234" stroke-width="1" opacity="0.7"/>
    <!-- talons outstretched -->
    <path d="M 70 124 L 62 140 M 90 124 L 98 140" stroke="#c8a040" stroke-width="3"/>
    <g stroke="#e0c050" stroke-width="2" fill="none" stroke-linecap="round"><path d="M 62 140 C 56 144, 52 146, 48 152 M 62 140 C 60 146, 60 150, 58 156 M 62 140 C 66 146, 68 150, 68 156 M 98 140 C 104 144, 108 146, 112 152 M 98 140 C 100 146, 100 150, 102 156 M 98 140 C 94 146, 92 150, 92 156"/></g>
    <g stroke="#1a1408" stroke-width="2" stroke-linecap="round"><path d="M 48 152 l -2 2 M 58 156 l 0 2 M 68 156 l 0 2 M 112 152 l 2 2 M 102 156 l 0 2 M 92 156 l 0 2"/></g>
    <!-- a starved hag's torso -->
    <path d="M 66 52 C 62 62, 62 74, 66 82 L 94 82 C 98 74, 98 62, 94 52 Z" fill="url(#hhp-flesh)" filter="url(#hhp-skin)"/>
    <path d="M 68 62 Q 74 58 78 62 M 82 62 Q 86 58 92 62 M 68 70 Q 74 66 78 70 M 82 70 Q 86 66 92 70" stroke="#241a10" stroke-width="1" fill="none"/>
    <!-- greasy rope hair -->
    <path d="M 64 22 C 56 34, 54 48, 56 60 M 68 18 C 62 30, 62 44, 60 56 M 92 18 C 98 30, 98 44, 100 56 M 96 22 C 104 34, 106 48, 104 60" stroke="#2a2418" stroke-width="3" fill="none" stroke-linecap="round"/>
    <!-- the face, screaming -->
    <path d="M 66 32 C 64 18, 72 12, 80 12 C 88 12, 96 18, 94 32 C 94 44, 88 52, 80 54 C 72 52, 66 44, 66 32 Z" fill="url(#hhp-flesh)" filter="url(#hhp-skin)"/>
    <path d="M 68 26 Q 72 22 77 27 M 83 27 Q 88 22 92 26" stroke="#1a1008" stroke-width="2" fill="none"/>
    <circle cx="73" cy="29" r="2.6" fill="#f0e090"/><circle cx="87" cy="29" r="2.6" fill="#f0e090"/>
    <circle cx="73" cy="29" r="1" fill="#000"/><circle cx="87" cy="29" r="1" fill="#000"/>
    <path d="M 80 32 L 76 40 L 80 40" stroke="#4a3020" stroke-width="1" fill="none"/>
    <path d="M 72 42 C 72 52, 88 52, 88 42 C 84 40, 76 40, 72 42 Z" fill="#100404"/>
    <path d="M 74 43 l 1 2 M 77 42.4 l 0.6 2 M 83 42.4 l -0.6 2 M 86 43 l -1 2" stroke="#c8b888" stroke-width="0.8"/>
    </svg>
  `,


  // ─── Gargoyle ────────────────────────────────────────────────────────────
  // Weathered stone come alive, crouched as if still on its cathedral ledge:
  // pitted and lichened, cracked through, horns and a beak-like snarl, wings
  // of stone, and in its eyes a dull red ember.
  'Gargoyle': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Gargoyle: a crouched, pitted and lichened stone beast, cracked, horned and snarling, red embers for eyes">
    <defs>
      ${horrorSkinFilter('hgy-stone', { freq: '0.22 0.26', scale: 3.2, seed: 118, k: 1.35 })}
      <linearGradient id="hgy-rock" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="#8a8a84"/><stop offset="0.5" stop-color="#55554f"/><stop offset="1" stop-color="#1c1c1a"/></linearGradient>
      <radialGradient id="hgy-eye" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffb070"/><stop offset="0.4" stop-color="#c02010"/><stop offset="1" stop-color="#400000" stop-opacity="0"/></radialGradient>
    </defs>
    <!-- the ledge it crouches on -->
    <path d="M 10 136 L 150 136 L 146 152 L 14 152 Z" fill="url(#hgy-rock)" filter="url(#hgy-stone)"/>
    <!-- stone wings, half spread -->
    <path d="M 60 64 C 44 40, 26 30, 8 30 C 16 42, 18 54, 14 66 C 24 62, 32 66, 36 76 C 44 70, 52 72, 56 82 Z M 100 64 C 116 40, 134 30, 152 30 C 144 42, 142 54, 146 66 C 136 62, 128 66, 124 76 C 116 70, 108 72, 104 82 Z" fill="url(#hgy-rock)" filter="url(#hgy-stone)"/>
    <!-- the crouched body -->
    <path d="M 54 70 C 46 92, 48 116, 58 136 L 102 136 C 112 116, 114 92, 106 70 C 96 60, 64 60, 54 70 Z" fill="url(#hgy-rock)" filter="url(#hgy-stone)"/>
    <path d="M 46 110 C 40 120, 40 130, 46 136 L 60 136 L 58 112 Z M 114 110 C 120 120, 120 130, 114 136 L 100 136 L 102 112 Z" fill="url(#hgy-rock)" filter="url(#hgy-stone)"/>
    <g stroke="#1c1c1a" stroke-width="2.4" stroke-linecap="round"><path d="M 46 136 l -4 4 M 52 136 l -2 5 M 108 136 l 2 5 M 114 136 l 4 4"/></g>
    <!-- cracks and lichen -->
    <path d="M 70 72 L 76 90 L 72 104 L 80 124 M 96 80 L 90 96 L 94 110" stroke="#0e0e0c" stroke-width="1.2" fill="none"/>
    <g fill="#6a7a3a" opacity="0.55"><circle cx="62" cy="96" r="4"/><circle cx="98" cy="118" r="3"/><circle cx="30" cy="44" r="3"/><circle cx="132" cy="50" r="2.6"/></g>
    <!-- the head: horns, a beak-like snarl -->
    <path d="M 64 34 L 54 14 L 70 28 Z M 96 34 L 106 14 L 90 28 Z" fill="url(#hgy-rock)" filter="url(#hgy-stone)"/>
    <path d="M 62 42 C 60 28, 70 22, 80 22 C 90 22, 100 28, 98 42 C 98 54, 92 62, 80 66 C 68 62, 62 54, 62 42 Z" fill="url(#hgy-rock)" filter="url(#hgy-stone)"/>
    <path d="M 66 38 Q 72 32 78 40 M 82 40 Q 88 32 94 38" stroke="#0e0e0c" stroke-width="2.6" fill="none"/>
    <circle cx="72" cy="42" r="4.6" fill="url(#hgy-eye)"/><circle cx="88" cy="42" r="4.6" fill="url(#hgy-eye)"/>
    <path d="M 72 54 C 74 50, 86 50, 88 54 L 84 64 L 80 60 L 76 64 Z" fill="#0e0e0c"/>
    <path d="M 74 55 l 2 4 l 2 -4 l 2 4 l 2 -4 l 2 4" stroke="#8a8a84" stroke-width="1" fill="none"/>
    </svg>
  `,

  // ─── Undead Knight ────────────────────────────────────────────────────────
  // A fallen paladin, rotted inside his blackened plate: the helm's visor
  // shows only a skull and two hellfire points; the armour is fused to the
  // corpse, cracked, leaking green light; a great sword dripping cold fire.
  'Undead Knight': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Undead Knight: a skeletal knight in blackened, cracked plate leaking green light, hellfire eyes behind the visor, a greatsword dripping cold fire">
    <defs>
      ${horrorSkinFilter('hdk-plate', { freq: '0.3 0.3', scale: 2.4, seed: 119, k: 1.3 })}
      <linearGradient id="hdk-steel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4a4c52"/><stop offset="0.5" stop-color="#1e2024"/><stop offset="1" stop-color="#08090a"/></linearGradient>
      <radialGradient id="hdk-fire" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#e0ffe0"/><stop offset="0.35" stop-color="#40e060"/><stop offset="1" stop-color="#004010" stop-opacity="0"/></radialGradient>
      <filter id="hdk-g" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <linearGradient id="hdk-cape" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a0a0e"/><stop offset="1" stop-color="#0a0204"/></linearGradient>
    </defs>
    <!-- a torn red cape -->
    <path d="M 50 50 C 40 90, 34 126, 30 156 L 44 148 L 52 156 L 62 148 L 72 156 L 82 148 L 92 156 L 102 148 L 110 156 L 118 148 L 130 156 C 126 126, 120 90, 110 50 Z" fill="url(#hdk-cape)"/>
    <!-- plate, blackened, fused to the corpse -->
    <path d="M 58 52 L 102 52 L 106 106 L 54 106 Z" fill="url(#hdk-steel)" filter="url(#hdk-plate)"/>
    <path d="M 54 106 L 106 106 L 104 150 L 92 150 L 86 116 L 74 116 L 68 150 L 56 150 Z" fill="url(#hdk-steel)" filter="url(#hdk-plate)"/>
    <path d="M 46 52 C 44 44, 52 40, 60 44 L 60 60 Z M 114 52 C 116 44, 108 40, 100 44 L 100 60 Z" fill="url(#hdk-steel)" stroke="#000" stroke-width="0.6"/>
    <!-- cracks leaking green light -->
    <g stroke="#60ff80" stroke-width="1" fill="none" filter="url(#hdk-g)" opacity="0.9">
      <path d="M 70 60 L 76 74 L 72 86"/><path d="M 92 66 L 86 80 L 90 94"/><path d="M 62 120 L 66 134"/>
    </g>
    <path d="M 80 56 L 80 104" stroke="#000" stroke-width="1.2"/>
    <!-- the greatsword, point down before him, dripping cold fire -->
    <path d="M 77 104 L 83 104 L 82 156 L 80 160 L 78 156 Z" fill="#6a7078" stroke="#1a1c20" stroke-width="0.5"/>
    <path d="M 66 100 L 94 100 L 94 105 L 66 105 Z" fill="#1a1c20" stroke="#4a4c52" stroke-width="0.5"/>
    <path d="M 78 88 L 82 88 L 82 100 L 78 100 Z" fill="#2a1a10"/><circle cx="80" cy="86" r="3" fill="#1e2024" stroke="#40e060" stroke-width="0.8"/>
    <g fill="#40e060" opacity="0.8" filter="url(#hdk-g)"><path d="M 79 120 q 1 4 0 6 q -1 -2 0 -6 Z"/><path d="M 81 136 q 1 4 0 6 q -1 -2 0 -6 Z"/><path d="M 80 150 q 1 4 0 6 q -1 -2 0 -6 Z"/></g>
    <path d="M 66 100 C 60 96, 56 90, 56 84 M 94 100 C 100 96, 104 90, 104 84" stroke="url(#hdk-steel)" stroke-width="7" fill="none"/>
    <!-- the helm: horned, its visor showing a skull and two hellfire points -->
    <path d="M 64 22 L 54 6 L 66 18 Z M 96 22 L 106 6 L 94 18 Z" fill="#1e2024"/>
    <path d="M 64 40 C 62 22, 70 14, 80 14 C 90 14, 98 22, 96 40 L 94 50 L 66 50 Z" fill="url(#hdk-steel)" filter="url(#hdk-plate)"/>
    <path d="M 68 30 L 92 30 L 90 38 L 70 38 Z" fill="#050405"/>
    <path d="M 70 31 C 72 29, 78 30, 79 33 M 81 33 C 82 30, 88 29, 90 31" stroke="#8a8478" stroke-width="0.8" fill="none"/>
    <circle cx="74" cy="34" r="2.6" fill="url(#hdk-fire)" filter="url(#hdk-g)"/><circle cx="86" cy="34" r="2.6" fill="url(#hdk-fire)" filter="url(#hdk-g)"/>
    <path d="M 72 42 L 88 42 M 74 46 L 86 46" stroke="#050405" stroke-width="1.4"/>
    <path d="M 80 14 L 80 30" stroke="#4a4c52" stroke-width="1.6"/>
    </svg>
  `,

  // ─── Pit Fiend ───────────────────────────────────────────────────────────
  // A general of the Hells: huge, scaled in crimson and black, great bat
  // wings wrapped half around it, a crown of horns, a fanged maw dripping
  // venom, a burning mace, and fire under its hooves.
  'Pit Fiend': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Pit Fiend: a huge crimson-scaled fiend wrapped in bat wings, crowned with horns, a venom-dripping fanged maw, a burning mace, fire beneath it">
    <defs>
      ${wetSkinFilter('hpf-hide', { freq: '0.16 0.2', seed: 120, shine: 0.45 })}
      ${scalePattern('hpf-sc', 3, '#200002', '#ff8a80')}
      <linearGradient id="hpf-body" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="#b01820"/><stop offset="0.6" stop-color="#5a060a"/><stop offset="1" stop-color="#1a0002"/></linearGradient>
      <linearGradient id="hpf-wing" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a0406"/><stop offset="1" stop-color="#080102"/></linearGradient>
      <radialGradient id="hpf-fire" cx="50%" cy="90%" r="60%"><stop offset="0" stop-color="#ff8020" stop-opacity="0.8"/><stop offset="1" stop-color="#600800" stop-opacity="0"/></radialGradient>
      <radialGradient id="hpf-eye" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fffbe0"/><stop offset="0.4" stop-color="#ffb020"/><stop offset="1" stop-color="#802000" stop-opacity="0"/></radialGradient>
    </defs>
    <ellipse cx="80" cy="150" rx="74" ry="16" fill="url(#hpf-fire)"/>
    <!-- wings wrapped half around it -->
    <path d="M 52 50 C 30 40, 10 50, 4 80 C 10 110, 24 136, 40 150 L 56 120 Z M 108 50 C 130 40, 150 50, 156 80 C 150 110, 136 136, 120 150 L 104 120 Z" fill="url(#hpf-wing)"/>
    <path d="M 52 50 L 4 80 M 52 60 L 14 112 M 108 50 L 156 80 M 108 60 L 146 112" stroke="#5a1418" stroke-width="1.6" fill="none"/>
    <!-- the body -->
    <path d="M 52 54 C 44 80, 46 110, 58 136 L 102 136 C 114 110, 116 80, 108 54 C 96 44, 64 44, 52 54 Z" fill="url(#hpf-body)" filter="url(#hpf-hide)"/>
    <path d="M 52 54 C 44 80, 46 110, 58 136 L 102 136 C 114 110, 116 80, 108 54 C 96 44, 64 44, 52 54 Z" fill="url(#hpf-sc)" opacity="0.55"/>
    <path d="M 66 64 Q 80 58 94 64 M 64 76 Q 80 70 96 76 M 66 88 Q 80 82 94 88" stroke="#1a0002" stroke-width="1.6" fill="none"/>
    <!-- the burning mace -->
    <path d="M 112 80 L 136 50" stroke="#2a1a10" stroke-width="4"/>
    <circle cx="138" cy="46" r="9" fill="#1a1416" stroke="#000" stroke-width="0.6"/>
    <path d="M 138 34 l 0 6 M 150 46 l -6 0 M 126 46 l 6 0 M 146 38 l -4 4 M 130 38 l 4 4" stroke="#3a3436" stroke-width="2.4"/>
    <path class="shop-flame" d="M 132 40 C 134 26, 142 24, 146 32 C 148 26, 152 34, 148 42 Z" fill="#ff8020" opacity="0.85"/>
    <!-- hooves in the fire -->
    <path d="M 60 134 L 56 152 L 70 152 L 72 136 Z M 88 136 L 90 152 L 104 152 L 100 134 Z" fill="#1a0002"/>
    <!-- the head: crowned with horns, a fanged maw -->
    <path d="M 64 30 C 54 18, 50 8, 52 0 C 60 8, 66 18, 70 28 Z M 96 30 C 106 18, 110 8, 108 0 C 100 8, 94 18, 90 28 Z" fill="#1a1416"/>
    <path d="M 72 24 l -2 -10 l 5 8 Z M 88 24 l 2 -10 l -5 8 Z M 80 22 l 0 -10 l 3 10 Z" fill="#2a2426"/>
    <path d="M 64 38 C 62 26, 70 20, 80 20 C 90 20, 98 26, 96 38 C 96 50, 90 58, 80 60 C 70 58, 64 50, 64 38 Z" fill="url(#hpf-body)" filter="url(#hpf-hide)"/>
    <path d="M 66 34 Q 72 28 79 36 M 81 36 Q 88 28 94 34" stroke="#0a0001" stroke-width="2.6" fill="none"/>
    <ellipse cx="72" cy="38" rx="4" ry="2.6" fill="url(#hpf-eye)"/><ellipse cx="88" cy="38" rx="4" ry="2.6" fill="url(#hpf-eye)"/>
    <path d="M 70 48 Q 80 58 90 48 Q 80 52 70 48 Z" fill="#100002"/>
    <g>${needleTeeth(71, 89, 48.4, 9, 3.4, 1, '#f0e4c8', 0.3)}</g>
    <path d="M 74 52 q 0 4 -1 8 M 86 52 q 1 3 0 7" stroke="#a8e040" stroke-width="1.2" fill="none"/>
    </svg>
  `,

  // ─── Nuckelavee ──────────────────────────────────────────────────────────
  // Orkney's horror: a horse and rider grown into one, with no skin at all:
  // raw red muscle, yellow veins of black blood, the rider's arms trailing
  // to the ground, the horse's single burning eye and gaping mouth.
  'Nuckelavee': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Nuckelavee: a skinless horse and rider grown into one, raw red muscle threaded with yellow veins, long arms trailing to the ground, a single burning eye">
    <defs>
      ${wetSkinFilter('hnk-meat', { freq: '0.08 0.3', seed: 121, shine: 0.7 })}
      <linearGradient id="hnk-muscle" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="#d0504a"/><stop offset="0.5" stop-color="#7a1418"/><stop offset="1" stop-color="#2a0406"/></linearGradient>
      <filter id="hnk-g" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <ellipse cx="80" cy="152" rx="66" ry="5" fill="#000" opacity="0.6"/>
    <g fill="#6a8a30" opacity="0.25"><circle cx="14" cy="60" r="10"/><circle cx="8" cy="72" r="8"/></g>
    <path d="M 36 100 L 30 150 L 42 150 L 46 104 Z M 52 104 L 50 150 L 62 150 L 62 104 Z M 104 104 L 106 150 L 118 150 L 114 104 Z M 120 100 L 126 150 L 138 150 L 130 98 Z" fill="url(#hnk-muscle)" filter="url(#hnk-meat)"/>
    <path d="M 26 80 C 24 98, 40 112, 60 112 L 118 112 C 136 110, 142 96, 136 80 C 120 64, 42 64, 26 80 Z" fill="url(#hnk-muscle)" filter="url(#hnk-meat)"/>
    <!-- muscle bands and yellow veins of black blood -->
    <g stroke="#3a0406" stroke-width="1.4" fill="none" opacity="0.8"><path d="M 36 82 C 50 76, 64 80, 80 76 M 34 92 C 52 86, 72 92, 100 86 M 44 102 C 64 96, 92 104, 128 96"/></g>
    <g stroke="#e8c840" stroke-width="1" fill="none" filter="url(#hnk-g)" opacity="0.85"><path d="M 40 86 C 60 82, 80 92, 112 86 M 50 98 C 70 94, 96 102, 126 94 M 30 120 L 34 146 M 116 120 L 120 146"/></g>
    <g stroke="#000" stroke-width="0.6" fill="none"><path d="M 40 86 C 60 82, 80 92, 112 86"/></g>
    <!-- the horse's head, one burning eye, a great mouth -->
    <path d="M 28 82 C 16 68, 10 52, 16 38 C 26 34, 34 46, 40 60 Z" fill="url(#hnk-muscle)" filter="url(#hnk-meat)"/>
    <circle cx="20" cy="48" r="4" fill="#ff4010" filter="url(#hnk-g)"/>
    <path d="M 12 42 C 6 50, 8 60, 14 62 L 20 56 Z" fill="#100204"/>
    <path d="M 10 46 l 3 2 M 9 52 l 3 1 M 10 58 l 3 0" stroke="#e8dcb8" stroke-width="1"/>
    <!-- the rider grown from its back, arms trailing to the ground -->
    <path d="M 84 74 C 80 56, 82 40, 90 30 C 98 40, 100 56, 96 74 Z" fill="url(#hnk-muscle)" filter="url(#hnk-meat)"/>
    <path d="M 86 44 C 72 66, 64 100, 58 146 L 64 146 C 70 104, 78 72, 90 52 Z M 94 44 C 108 66, 116 100, 122 146 L 116 146 C 110 104, 102 72, 90 52 Z" fill="url(#hnk-muscle)" filter="url(#hnk-meat)"/>
    <path d="M 58 146 l -4 4 M 62 146 l -1 5 M 118 146 l 2 5 M 122 146 l 4 4" stroke="#2a0406" stroke-width="1.6" stroke-linecap="round"/>
    <!-- the rider's head, huge, lolling, mouth wide -->
    <path d="M 78 30 C 72 14, 80 4, 92 4 C 104 4, 110 16, 104 30 C 100 38, 94 42, 90 42 C 86 42, 80 38, 78 30 Z" fill="url(#hnk-muscle)" filter="url(#hnk-meat)"/>
    <ellipse cx="86" cy="18" rx="3" ry="2.2" fill="#f0e8c0"/><ellipse cx="98" cy="18" rx="3" ry="2.2" fill="#f0e8c0"/>
    <circle cx="86" cy="18" r="1" fill="#000"/><circle cx="98" cy="18" r="1" fill="#000"/>
    <path d="M 84 28 Q 92 38 100 28 Q 92 32 84 28 Z" fill="#100204"/>
    </svg>
  `,

  // ─── Penanggalan ─────────────────────────────────────────────────────────
  // A beautiful woman's head, flying free, hair floating like it's under
  // water; below it hang her heart, lungs and a long glistening coil of gut,
  // dripping; her mouth red to the chin.
  'Penanggalan': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Penanggalan: a woman's head flying free, hair floating, her heart, lungs and a long dripping coil of gut hanging below, her mouth red with blood">
    <defs>
      ${horrorSkinFilter('hpn-skin', { freq: '0.18 0.22', scale: 1.6, seed: 122, k: 1.15 })}
      ${wetSkinFilter('hpn-gut', { freq: '0.2 0.26', seed: 123, shine: 0.8 })}
      <radialGradient id="hpn-face" cx="45%" cy="35%" r="70%"><stop offset="0" stop-color="#f0dcd0"/><stop offset="0.6" stop-color="#b89080"/><stop offset="1" stop-color="#5a4038"/></radialGradient>
      <radialGradient id="hpn-organ" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#f08a90"/><stop offset="0.6" stop-color="#9a1a2a"/><stop offset="1" stop-color="#3a0408"/></radialGradient>
      <radialGradient id="hpn-glow" cx="50%" cy="35%" r="55%"><stop offset="0" stop-color="#ffd8d0" stop-opacity="0.25"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
    </defs>
    <circle cx="80" cy="50" r="62" fill="url(#hpn-glow)"/>
    <!-- hair floating out, as if under water -->
    <g stroke="#0a0606" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.95">
      <path d="M 64 28 C 50 16, 34 14, 20 22 C 30 22, 40 26, 48 36"/><path d="M 66 22 C 58 8, 46 2, 34 2"/><path d="M 74 18 C 72 6, 66 -2, 58 -4"/>
      <path d="M 96 28 C 110 16, 126 14, 140 22 C 130 22, 120 26, 112 36"/><path d="M 94 22 C 102 8, 114 2, 126 2"/><path d="M 86 18 C 88 6, 94 -2, 102 -4"/>
      <path d="M 62 38 C 48 42, 38 52, 32 64"/><path d="M 98 38 C 112 42, 122 52, 128 64"/>
    </g>
    <!-- the face: beautiful, pale, wide eyes, the mouth red to the chin -->
    <path d="M 64 36 C 62 20, 70 12, 80 12 C 90 12, 98 20, 96 36 C 96 50, 90 60, 80 62 C 70 60, 64 50, 64 36 Z" fill="url(#hpn-face)" filter="url(#hpn-skin)"/>
    <path d="M 64 22 C 70 14, 90 14, 96 22 C 90 18, 70 18, 64 22 Z" fill="#0a0606"/>
    <path d="M 68 32 Q 73 28 78 32 M 82 32 Q 87 28 92 32" stroke="#2a1410" stroke-width="1.4" fill="none"/>
    <ellipse cx="73" cy="35" rx="4.4" ry="3" fill="#fff"/><ellipse cx="87" cy="35" rx="4.4" ry="3" fill="#fff"/>
    <circle cx="73" cy="35" r="2" fill="#1a0404"/><circle cx="87" cy="35" r="2" fill="#1a0404"/>
    <circle cx="72.2" cy="34.2" r="0.6" fill="#fff"/><circle cx="86.2" cy="34.2" r="0.6" fill="#fff"/>
    <path d="M 80 38 L 78 45 L 82 45" stroke="#8a6050" stroke-width="0.8" fill="none"/>
    <path d="M 73 50 Q 80 47 87 50 Q 80 56 73 50 Z" fill="#7a0a14"/>
    <path d="M 75 52 C 74 56, 75 60, 74 62 M 80 54 C 80 58, 81 60, 80 62 M 85 52 C 86 56, 85 58, 86 62" stroke="#a00a18" stroke-width="1.6" fill="none"/>
    <!-- hanging below: heart, lungs, the long coil of gut, dripping -->
    <ellipse cx="71" cy="74" rx="7" ry="10" fill="url(#hpn-organ)" filter="url(#hpn-gut)"/><ellipse cx="89" cy="74" rx="7" ry="10" fill="url(#hpn-organ)" filter="url(#hpn-gut)"/>
    <path d="M 80 70 C 73 72, 73 84, 80 88 C 87 84, 87 72, 80 70 Z" fill="#b01020" filter="url(#hpn-gut)"/>
    <path d="M 74 64 L 76 70 M 86 64 L 84 70" stroke="#6a0a10" stroke-width="2"/>
    <path d="M 80 88 C 68 98, 94 106, 78 116 C 62 126, 96 132, 80 144 C 72 150, 84 154, 80 160" stroke="url(#hpn-organ)" stroke-width="6" fill="none" stroke-linecap="round" filter="url(#hpn-gut)"/>
    <path d="M 80 88 C 68 98, 94 106, 78 116 C 62 126, 96 132, 80 144" stroke="#ffb0b8" stroke-width="0.8" fill="none" opacity="0.5"/>
    <g fill="#a00a18"><circle cx="74" cy="124" r="1.6"/><circle cx="88" cy="140" r="1.3"/><circle cx="70" cy="100" r="1.3"/><circle cx="92" cy="110" r="1"/></g>
    </svg>
  `,

  // ─── Tiamat ──────────────────────────────────────────────────────────────
  // The Queen of Dragons: five heads on five long necks, one of each
  // chromatic colour, rising from one vast scaled body, every maw open.
  'Tiamat': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Tiamat: five dragon heads, red, blue, green, white and black, on long scaled necks rising from one vast body, every maw open">
    <defs>
      ${wetSkinFilter('hti-hide', { freq: '0.14 0.18', seed: 130, shine: 0.5 })}
      ${scalePattern('hti-sc', 3, '#08060a', '#d8c8e0')}
      <linearGradient id="hti-body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2a40"/><stop offset="1" stop-color="#0a060c"/></linearGradient>
      <linearGradient id="hti-r" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="#e0402a"/><stop offset="1" stop-color="#4a0606"/></linearGradient>
      <linearGradient id="hti-b" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="#4a8ae0"/><stop offset="1" stop-color="#081a40"/></linearGradient>
      <linearGradient id="hti-g" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="#4ab04a"/><stop offset="1" stop-color="#062a08"/></linearGradient>
      <linearGradient id="hti-w" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="#f0f4f8"/><stop offset="1" stop-color="#6a7a88"/></linearGradient>
      <linearGradient id="hti-k" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="#3a3a3a"/><stop offset="1" stop-color="#050505"/></linearGradient>
      <radialGradient id="hti-eye" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fffbe0"/><stop offset="0.45" stop-color="#ffc030"/><stop offset="1" stop-color="#802000" stop-opacity="0"/></radialGradient>
      <radialGradient id="hti-aura" cx="50%" cy="70%" r="60%"><stop offset="0" stop-color="#6a2a80" stop-opacity="0.35"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
    </defs>
    <ellipse cx="80" cy="110" rx="80" ry="56" fill="url(#hti-aura)"/>
    <!-- the necks, each from the shoulders of the one body -->
    <g stroke-linecap="round" fill="none" filter="url(#hti-hide)">
      <path d="M 50 112 C 32 96, 22 72, 27 46" stroke="url(#hti-k)" stroke-width="11"/>
      <path d="M 62 104 C 52 80, 44 54, 48 26" stroke="url(#hti-g)" stroke-width="11"/>
      <path d="M 80 100 C 80 74, 80 44, 80 16" stroke="url(#hti-r)" stroke-width="12"/>
      <path d="M 98 104 C 108 80, 116 54, 112 26" stroke="url(#hti-b)" stroke-width="11"/>
      <path d="M 110 112 C 128 96, 138 72, 133 46" stroke="url(#hti-w)" stroke-width="11"/>
    </g>
    <!-- the body -->
    <path d="M 22 160 C 24 128, 46 104, 80 100 C 114 104, 136 128, 138 160 Z" fill="url(#hti-body)" filter="url(#hti-hide)"/>
    <path d="M 22 160 C 24 128, 46 104, 80 100 C 114 104, 136 128, 138 160 Z" fill="url(#hti-sc)" opacity="0.5"/>
    <path d="M 70 112 Q 80 106 90 112 M 64 124 Q 80 116 96 124 M 60 138 Q 80 130 100 138" stroke="#d8c8e0" stroke-width="0.8" fill="none" opacity="0.35"/>
    <!-- five heads, every maw open -->
    ${[['k', 27, 42, -1], ['g', 50, 24, -1], ['r', 80, 14, 0], ['b', 110, 24, 1], ['w', 133, 42, 1]].map(([c, x, y, dir]) => `
      <g transform="translate(${x} ${y + 4}) scale(${dir < 0 ? -1.55 : 1.55} 1.55)">
        <path d="M -8 4 C -10 -6, -2 -12, 6 -10 C 12 -8, 16 -4, 18 0 L 8 2 L 18 6 C 14 10, 6 12, -2 12 C -6 10, -8 8, -8 4 Z" fill="url(#hti-${c})" filter="url(#hti-hide)"/>
        <path d="M -4 -8 L -10 -16 L -2 -10 M 2 -10 L 0 -18 L 6 -10" stroke="#1a1418" stroke-width="1.6" fill="#1a1418"/>
        <path d="M 8 2 L 18 0 L 18 6 Z" fill="#100204"/>
        <path d="M 9 1.4 l 1.2 1.8 l 1 -1.9 l 1.2 1.8 l 1 -1.9 l 1.2 1.7 l 1 -1.8 M 9 5.6 l 1.2 -1.6 l 1 1.7 l 1.2 -1.6 l 1 1.7 l 1.2 -1.5" stroke="#f0e4c8" stroke-width="0.7" fill="none"/>
        <ellipse cx="2" cy="-3" rx="2.4" ry="1.5" fill="url(#hti-eye)"/>
      </g>`).join('')}
    <!-- each breath's first breath -->
    <g opacity="0.7">
      <path d="M 92 12 C 100 8, 108 12, 112 6" stroke="#ff8020" stroke-width="2" fill="none"/>
      <path d="M 130 22 l 4 -3 l -2 4 l 5 -3" stroke="#a0d0ff" stroke-width="1.2" fill="none"/>
      <circle cx="30" cy="20" r="4" fill="#80c060" opacity="0.4"/>
      <path d="M 156 36 l 3 -2 M 156 42 l 3 0" stroke="#e8f8ff" stroke-width="1"/>
    </g>
    </svg>
  `,

  // ─── Tarrasque ───────────────────────────────────────────────────────────
  // The world-ender, head on: a mountain of armoured hide, a reflective
  // carapace spiked like a fortress, two horns, a jaw that could take a house.
  'Tarrasque': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Tarrasque: a colossal armoured beast head-on, spiked carapace behind, two great horns, tiny burning eyes, a gaping jaw of teeth">
    <defs>
      ${horrorSkinFilter('htq-hide', { freq: '0.12 0.16', scale: 3, seed: 131, k: 1.3 })}
      ${scalePattern('htq-sc', 5, '#0e0a06', '#a89870')}
      <linearGradient id="htq-shell" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6a6250"/><stop offset="0.5" stop-color="#3a3428"/><stop offset="1" stop-color="#14100a"/></linearGradient>
      <linearGradient id="htq-skin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a6038"/><stop offset="1" stop-color="#2a1a0a"/></linearGradient>
      <radialGradient id="htq-eye" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff0a0"/><stop offset="0.4" stop-color="#ff7010"/><stop offset="1" stop-color="#600800" stop-opacity="0"/></radialGradient>
      <radialGradient id="htq-maw" cx="50%" cy="30%" r="70%"><stop offset="0" stop-color="#6a0a0a"/><stop offset="1" stop-color="#0a0000"/></radialGradient>
    </defs>
    <!-- the carapace behind, spiked -->
    <path d="M 2 96 C 10 50, 44 26, 80 24 C 116 26, 150 50, 158 96 Z" fill="url(#htq-shell)" filter="url(#htq-hide)"/>
    <g fill="#2a2418" stroke="#8a8068" stroke-width="0.6">
      <path d="M 14 70 L 4 52 L 22 62 Z"/><path d="M 28 50 L 22 28 L 38 44 Z"/><path d="M 48 36 L 46 12 L 58 32 Z"/><path d="M 70 28 L 72 4 L 80 26 Z"/>
      <path d="M 146 70 L 156 52 L 138 62 Z"/><path d="M 132 50 L 138 28 L 122 44 Z"/><path d="M 112 36 L 114 12 L 102 32 Z"/><path d="M 90 28 L 88 4 L 80 26 Z"/>
    </g>
    <path d="M 24 74 C 40 56, 120 56, 136 74" stroke="#c8c0a8" stroke-width="1.2" fill="none" opacity="0.35"/>
    <!-- shoulders and forelegs like towers -->
    <path d="M 14 160 L 20 104 C 26 92, 44 90, 50 104 L 52 160 Z M 108 160 L 110 104 C 116 90, 134 92, 140 104 L 146 160 Z" fill="url(#htq-skin)" filter="url(#htq-hide)"/>
    <path d="M 14 160 L 20 104 C 26 92, 44 90, 50 104 L 52 160 Z M 108 160 L 110 104 C 116 90, 134 92, 140 104 L 146 160 Z" fill="url(#htq-sc)" opacity="0.6"/>
    <path d="M 16 156 l -4 4 M 26 156 l -2 4 M 40 156 l 0 4 M 120 156 l 0 4 M 134 156 l 2 4 M 144 156 l 4 4" stroke="#e8dcc0" stroke-width="2.2"/>
    <!-- the head: horned, armoured brow, tiny eyes -->
    <path d="M 46 70 C 26 56, 18 40, 22 26 C 32 38, 42 52, 54 60 Z M 114 70 C 134 56, 142 40, 138 26 C 128 38, 118 52, 106 60 Z" fill="#e0d4b0" stroke="#4a4030" stroke-width="0.8"/>
    <path d="M 42 72 C 40 54, 58 44, 80 44 C 102 44, 120 54, 118 72 L 116 98 C 106 112, 54 112, 44 98 Z" fill="url(#htq-skin)" filter="url(#htq-hide)"/>
    <path d="M 46 64 Q 80 50 114 64 L 110 72 Q 80 60 50 72 Z" fill="#1a140c"/>
    <ellipse cx="62" cy="72" rx="3.4" ry="2.4" fill="url(#htq-eye)"/><ellipse cx="98" cy="72" rx="3.4" ry="2.4" fill="url(#htq-eye)"/>
    <!-- the jaw, open -->
    <path d="M 50 92 C 58 140, 102 140, 110 92 C 100 100, 60 100, 50 92 Z" fill="url(#htq-maw)"/>
    <g>${needleTeeth(54, 106, 94, 13, 7, 1, '#ece0c0', 0.25)}</g>
    <path d="M 58 124 l 2 -8 l 3 8 M 70 130 l 2 -9 l 3 9 M 86 130 l 2 -9 l 3 9 M 98 124 l 2 -8 l 3 8" fill="#ece0c0" stroke="#ece0c0" stroke-width="0.6"/>
    <path d="M 64 112 q 0 8 -2 14 M 96 112 q 1 7 0 12" stroke="#c0c8a0" stroke-width="1" fill="none" opacity="0.6"/>
    </svg>
  `,

  // ─── Bone Sovereign ───────────────────────────────────────────────────────────
  // A dead dragon that will not stay dead: bare skull and ribs, rags of wing
  // membrane, green soul-fire in the sockets and in the cage of its chest.
  'Bone Sovereign': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Bone Sovereign: a skeletal dragon, horned skull with green fire in its sockets, rib cage glowing, tattered wing membranes">
    <defs>
      ${horrorSkinFilter('hdl-bone', { freq: '0.2 0.26', scale: 1.8, seed: 132, k: 1.2 })}
      <linearGradient id="hdl-b" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="#e8dcc0"/><stop offset="0.6" stop-color="#9a8a68"/><stop offset="1" stop-color="#3a3020"/></linearGradient>
      <radialGradient id="hdl-soul" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#e0ffd0"/><stop offset="0.35" stop-color="#40ff60"/><stop offset="1" stop-color="#004010" stop-opacity="0"/></radialGradient>
      <linearGradient id="hdl-mem" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3428" stop-opacity="0.85"/><stop offset="1" stop-color="#14100a" stop-opacity="0.5"/></linearGradient>
      <filter id="hdl-gl" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <!-- wings: bare finger-bones, rags of membrane -->
    <path d="M 60 70 L 10 20 L 4 70 L 20 64 L 16 96 L 32 82 L 34 108 Z" fill="url(#hdl-mem)"/>
    <path d="M 100 70 L 150 20 L 156 70 L 140 64 L 144 96 L 128 82 L 126 108 Z" fill="url(#hdl-mem)"/>
    <path d="M 22 50 l 6 6 M 12 78 l 6 -2 M 138 50 l -6 6 M 148 78 l -6 -2" stroke="#000" stroke-width="3" opacity="0.6"/>
    <path d="M 60 70 L 10 20 M 60 72 L 4 70 M 58 76 L 16 96 M 58 80 L 34 108 M 100 70 L 150 20 M 100 72 L 156 70 M 102 76 L 144 96 M 102 80 L 126 108" stroke="url(#hdl-b)" stroke-width="2.6" stroke-linecap="round" filter="url(#hdl-bone)"/>
    <!-- the spine and rib cage, soul-fire within -->
    <ellipse cx="80" cy="100" rx="20" ry="22" fill="url(#hdl-soul)" opacity="0.8" filter="url(#hdl-gl)"/>
    <path d="M 80 60 C 78 90, 82 120, 80 150 C 84 156, 92 158, 100 154" stroke="url(#hdl-b)" stroke-width="4" fill="none" filter="url(#hdl-bone)"/>
    <g stroke="url(#hdl-b)" stroke-width="3" fill="none" stroke-linecap="round" filter="url(#hdl-bone)">
      <path d="M 80 80 C 62 82, 56 96, 62 112"/><path d="M 80 88 C 60 92, 56 108, 64 122"/><path d="M 80 96 C 62 102, 60 116, 68 128"/>
      <path d="M 80 80 C 98 82, 104 96, 98 112"/><path d="M 80 88 C 100 92, 104 108, 96 122"/><path d="M 80 96 C 98 102, 100 116, 92 128"/>
    </g>
    <!-- forelimbs, claws in the dirt -->
    <path d="M 64 112 L 50 140 L 40 150 M 50 140 l 2 10 M 50 140 l 8 8 M 96 112 L 110 140 L 120 150 M 110 140 l -2 10 M 110 140 l -8 8" stroke="url(#hdl-b)" stroke-width="3" stroke-linecap="round" fill="none" filter="url(#hdl-bone)"/>
    <!-- the neck and horned skull -->
    <path d="M 80 62 C 76 50, 78 40, 80 34" stroke="url(#hdl-b)" stroke-width="5" fill="none" filter="url(#hdl-bone)"/>
    <path d="M 66 26 C 58 14, 54 6, 56 0 C 62 8, 66 14, 72 22 Z M 94 26 C 102 14, 106 6, 104 0 C 98 8, 94 14, 88 22 Z" fill="#c8bca0" stroke="#3a3020" stroke-width="0.6"/>
    <path d="M 64 32 C 62 20, 70 14, 80 14 C 90 14, 98 20, 96 32 L 92 50 C 86 56, 74 56, 68 50 Z" fill="url(#hdl-b)" filter="url(#hdl-bone)"/>
    <ellipse cx="72" cy="30" rx="5" ry="4" fill="#000"/><ellipse cx="88" cy="30" rx="5" ry="4" fill="#000"/>
    <ellipse cx="72" cy="30" rx="3.4" ry="2.6" fill="url(#hdl-soul)" filter="url(#hdl-gl)"/><ellipse cx="88" cy="30" rx="3.4" ry="2.6" fill="url(#hdl-soul)" filter="url(#hdl-gl)"/>
    <path d="M 76 40 l 2 4 l 2 -4 M 80 40 l 2 4 l 2 -4" fill="#000"/>
    <path d="M 68 50 L 70 60 L 90 60 L 92 50" fill="#1a1408"/>
    <g>${needleTeeth(69, 91, 50.5, 8, 4, 1, '#e8dcc0', 0.2)}</g>
    <g>${needleTeeth(70, 90, 59.5, 7, 3.4, -1, '#e8dcc0', 0.2)}</g>
    <path d="M 74 60 C 72 68, 76 72, 74 80" stroke="#60ff80" stroke-width="1.6" fill="none" opacity="0.6" filter="url(#hdl-gl)"/>
    </svg>
  `,

  // ─── Aboleth ─────────────────────────────────────────────────────────────
  // An ancient thing of the drowned dark: a vast swollen eel-fish body crusted
  // with barnacles and old scars, three slit-pupilled eyes stacked down its
  // brow, a maw of needle teeth strung with mucus, tentacles reaching for you.
  // (The game shows its painting, monster-art.js; this is the stand-in.)
  'Aboleth': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Aboleth: a vast slimy horror, a swollen eel-fish body crusted with barnacles, three slit eyes stacked down its brow, a maw of needle teeth strung with mucus, tentacles reaching for you">
    <defs>
      ${wetSkinFilter('hab-skin', { freq: '0.12 0.18', seed: 133, shine: 0.35 })}
      ${horrorSkinFilter('hab-mem', { freq: '0.05 0.22', scale: 1.6, seed: 134, k: 1.15 })}
      <linearGradient id="hab-body" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="#5a7a7c"/><stop offset="0.5" stop-color="#22383e"/><stop offset="1" stop-color="#070e12"/></linearGradient>
      <linearGradient id="hab-belly" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a49c7c"/><stop offset="1" stop-color="#3e3a2a"/></linearGradient>
      <linearGradient id="hab-wing" x1="1" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#1a1c22" stop-opacity="0.97"/><stop offset="0.7" stop-color="#2a1e28" stop-opacity="0.92"/><stop offset="1" stop-color="#3a2030" stop-opacity="0.85"/></linearGradient>
      <radialGradient id="hab-eye" cx="45%" cy="40%" r="60%"><stop offset="0" stop-color="#fff0c0"/><stop offset="0.25" stop-color="#ff4020"/><stop offset="0.7" stop-color="#8a0408"/><stop offset="1" stop-color="#200000"/></radialGradient>
      <radialGradient id="hab-mucus" cx="50%" cy="60%" r="55%"><stop offset="0" stop-color="#7a9a90" stop-opacity="0.35"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
      <radialGradient id="hab-maw" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#0a0000"/><stop offset="0.7" stop-color="#4a0610"/><stop offset="1" stop-color="#9a3040"/></radialGradient>
      <filter id="hab-gl" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="1.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <ellipse cx="80" cy="100" rx="80" ry="60" fill="url(#hab-mucus)"/>

    <!-- the tail, curling away behind -->
    <path d="M 116 116 C 142 112, 158 132, 150 154 C 144 140, 132 132, 116 134 Z" fill="url(#hab-body)" filter="url(#hab-skin)"/>
    <path d="M 150 154 l 8 6 l -14 0 Z" fill="#14222a"/>
    <!-- the swollen body -->
    <path d="M 34 112 C 30 82, 52 62, 82 60 C 110 60, 130 78, 128 106 C 126 130, 100 142, 74 140 C 50 138, 36 128, 34 112 Z" fill="url(#hab-body)" filter="url(#hab-skin)"/>
    <path d="M 46 124 C 64 138, 102 138, 120 116 C 104 128, 64 130, 46 124 Z" fill="url(#hab-belly)" opacity="0.75"/>
    <!-- old scars, barnacles, slime sheen -->
    <path d="M 98 74 L 112 92 M 102 72 L 116 88 M 58 118 L 72 112" stroke="#0a1418" stroke-width="1.4" opacity="0.8"/>
    <g fill="#b8b4a0" stroke="#3a3628" stroke-width="0.4">${Array.from({ length: 16 }, (_, i) => `<circle cx="${(96 + (i * 37) % 26).toFixed(0)}" cy="${(96 + (i * 23) % 24).toFixed(0)}" r="${(1 + (i % 3) * 0.6).toFixed(1)}"/>`).join('')}</g>
    <path d="M 52 86 C 64 70, 88 64, 112 70" stroke="#d0eae4" stroke-width="1.4" fill="none" opacity="0.35"/>
    <!-- the dorsal crest -->
    <path d="M 62 64 L 66 46 L 72 62 L 80 40 L 86 60 L 96 44 L 98 64" fill="#2a3a42" stroke="#0a1418" stroke-width="0.8" filter="url(#hab-mem)"/>
    <!-- three red eyes, stacked down the brow, slit-pupilled and glowing -->
    <g filter="url(#hab-gl)">
      <ellipse cx="56" cy="70" rx="6.4" ry="4.6" fill="url(#hab-eye)"/><ellipse cx="51" cy="85" rx="7" ry="5" fill="url(#hab-eye)"/><ellipse cx="49" cy="100" rx="6.4" ry="4.6" fill="url(#hab-eye)"/>
    </g>
    <path d="M 56 66 l 0 8 M 51 80.5 l 0 9 M 49 96 l 0 8" stroke="#000" stroke-width="1.8"/>
    <path d="M 48 64 Q 56 60 64 66 M 42 79 Q 51 74 60 81 M 40 94 Q 49 90 58 96" stroke="#0a1418" stroke-width="1.6" fill="none"/>
    <!-- the maw: needle teeth, strings of mucus between the jaws -->
    <path d="M 28 106 C 36 122, 58 126, 70 116 C 62 112, 40 110, 28 106 Z" fill="url(#hab-maw)"/>
    <g>${needleTeeth(31, 68, 108.2, 14, 3.4, 1, '#ece4cc', 0.35)}</g>
    <g>${needleTeeth(36, 66, 119.4, 10, 3, -1, '#ece4cc', 0.35)}</g>
    <path d="M 40 110 c 1 5 0 8 1 12 M 52 112 c -1 4 0 7 -1 10 M 62 113 c 1 3 0 5 0 7" stroke="#c8dcd0" stroke-width="0.9" fill="none" opacity="0.7"/>
    <path d="M 34 118 c 0 8 2 14 0 22 M 46 124 c 1 6 0 10 1 16" stroke="#a8c0b4" stroke-width="1.4" fill="none" opacity="0.6"/>
    <!-- tentacles reaching for you -->
    <g fill="none" stroke-linecap="round" filter="url(#hab-skin)">
      <path d="M 52 128 C 40 142, 24 150, 6 156" stroke="#1a2c32" stroke-width="7"/>
      <path d="M 70 136 C 66 148, 62 154, 56 160" stroke="#1a2c32" stroke-width="6"/>
      <path d="M 92 136 C 98 148, 104 154, 112 160" stroke="#1a2c32" stroke-width="6"/>
      <path d="M 38 116 C 22 120, 12 132, 4 142" stroke="#1a2c32" stroke-width="5"/>
    </g>
    <g stroke="#9ab4aa" stroke-width="0.8" fill="none" opacity="0.45"><path d="M 52 128 C 40 142, 24 150, 6 156 M 38 116 C 22 120, 12 132, 4 142"/></g>
    <g fill="#c8dcd0" opacity="0.6"><circle cx="6" cy="156" r="1.6"/><circle cx="56" cy="160" r="1.4"/><circle cx="112" cy="160" r="1.4"/><circle cx="20" cy="130" r="1"/></g>
    </svg>
  `,

  // ─── Balor ───────────────────────────────────────────────────────────────
  // A demon lord wrapped in flame: black hide split by fire, vast bat wings,
  // a whip of many tails in one hand, a burning sword in the other.
  'Balor': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Balor: a black-hided demon lord wreathed in flame, vast bat wings, horned head with burning eyes, a flaming whip and a burning sword">
    <defs>
      ${horrorSkinFilter('hbl-hide', { freq: '0.16 0.2', scale: 2.6, seed: 134, k: 1.3 })}
      <linearGradient id="hbl-body" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="#3a1a14"/><stop offset="0.6" stop-color="#140806"/><stop offset="1" stop-color="#050202"/></linearGradient>
      <linearGradient id="hbl-wing" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a0c08"/><stop offset="1" stop-color="#0a0202"/></linearGradient>
      <radialGradient id="hbl-fire" cx="50%" cy="70%" r="65%"><stop offset="0" stop-color="#ffb040" stop-opacity="0.85"/><stop offset="0.5" stop-color="#e04010" stop-opacity="0.5"/><stop offset="1" stop-color="#400000" stop-opacity="0"/></radialGradient>
      <radialGradient id="hbl-eye" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff8d0"/><stop offset="0.4" stop-color="#ffa020"/><stop offset="1" stop-color="#800" stop-opacity="0"/></radialGradient>
      <linearGradient id="hbl-blade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffd080"/><stop offset="1" stop-color="#ff5010"/></linearGradient>
    </defs>
    <ellipse cx="80" cy="100" rx="80" ry="66" fill="url(#hbl-fire)"/>
    <!-- vast wings -->
    <path d="M 56 50 C 30 26, 6 24, 0 40 C 8 46, 4 60, 10 66 C 16 62, 20 72, 28 74 C 30 66, 40 70, 46 76 Z M 104 50 C 130 26, 154 24, 160 40 C 152 46, 156 60, 150 66 C 144 62, 140 72, 132 74 C 130 66, 120 70, 114 76 Z" fill="url(#hbl-wing)"/>
    <path d="M 56 50 L 0 40 M 54 56 L 10 66 M 52 62 L 28 74 M 104 50 L 160 40 M 106 56 L 150 66 M 108 62 L 132 74" stroke="#4a1810" stroke-width="1.4"/>
    <!-- the body, split by fire -->
    <path d="M 54 54 C 46 80, 48 112, 58 140 L 102 140 C 112 112, 114 80, 106 54 C 94 44, 66 44, 54 54 Z" fill="url(#hbl-body)" filter="url(#hbl-hide)"/>
    <g stroke="#ff7020" stroke-width="1.2" fill="none" opacity="0.85"><path d="M 66 60 L 72 78 L 66 96 M 94 62 L 88 80 L 94 100 M 80 104 L 76 120 L 82 136"/></g>
    <!-- the whip of many tails, burning -->
    <path d="M 52 84 C 36 92, 26 100, 20 108" stroke="#140806" stroke-width="5" stroke-linecap="round"/>
    <g fill="none" stroke-linecap="round"><path d="M 20 108 C 10 120, 16 134, 6 148" stroke="#ff8020" stroke-width="2"/><path d="M 20 108 C 22 124, 14 138, 20 154" stroke="#ffb040" stroke-width="1.6"/><path d="M 20 108 C 30 120, 26 138, 34 150" stroke="#e04010" stroke-width="1.8"/></g>
    <!-- the burning sword -->
    <path d="M 108 86 L 118 80" stroke="#140806" stroke-width="6" stroke-linecap="round"/>
    <path d="M 116 82 L 156 20 L 152 18 L 112 78 Z" fill="url(#hbl-blade)"/>
    <path class="shop-flame" d="M 126 64 C 128 50, 136 48, 140 56 C 142 46, 150 46, 150 36 C 156 46, 152 58, 140 70 Z" fill="#ffa030" opacity="0.7"/>
    <!-- legs in the flame -->
    <path d="M 62 138 L 58 158 L 74 158 L 74 140 Z M 86 140 L 86 158 L 102 158 L 98 138 Z" fill="#0a0303"/>
    <!-- the head: great curved horns, burning eyes -->
    <path d="M 64 32 C 50 26, 42 12, 46 0 C 52 12, 60 20, 70 24 Z M 96 32 C 110 26, 118 12, 114 0 C 108 12, 100 20, 90 24 Z" fill="#1a1010" stroke="#4a2a20" stroke-width="0.6"/>
    <path d="M 64 40 C 62 26, 70 18, 80 18 C 90 18, 98 26, 96 40 C 96 52, 90 60, 80 62 C 70 60, 64 52, 64 40 Z" fill="url(#hbl-body)" filter="url(#hbl-hide)"/>
    <path d="M 66 36 Q 72 30 79 38 M 81 38 Q 88 30 94 36" stroke="#000" stroke-width="2.4" fill="none"/>
    <ellipse cx="72" cy="40" rx="4.4" ry="2.8" fill="url(#hbl-eye)"/><ellipse cx="88" cy="40" rx="4.4" ry="2.8" fill="url(#hbl-eye)"/>
    <path d="M 70 50 Q 80 60 90 50 Q 80 54 70 50 Z" fill="#ff6010" opacity="0.8"/>
    <g>${needleTeeth(71, 89, 50.4, 9, 3.4, 1, '#f0e4c8', 0.3)}</g>
    </svg>
  `,

  // ─── Orc King ────────────────────────────────────────────────────────────
  // Vragathok's chosen: a scarred mountain of an orc in black plate, an iron
  // crown of spikes, one eye put out for his god, tusks, a great axe.
  'Orc King': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Orc King: a scarred huge orc in black plate, an iron crown of spikes, one eye put out, great tusks, a notched great axe">
    <defs>
      ${horrorSkinFilter('hok-skin', { freq: '0.14 0.18', scale: 2.4, seed: 135, k: 1.25 })}
      <linearGradient id="hok-face" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="#7a8a50"/><stop offset="0.6" stop-color="#3e4a26"/><stop offset="1" stop-color="#1a200e"/></linearGradient>
      <linearGradient id="hok-plate" x1="0" y1="0" x2="0.6" y2="1"><stop offset="0" stop-color="#4a4a52"/><stop offset="0.4" stop-color="#1a1a20"/><stop offset="1" stop-color="#050506"/></linearGradient>
      <linearGradient id="hok-steel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9a9aa0"/><stop offset="1" stop-color="#3a3a40"/></linearGradient>
      <radialGradient id="hok-eye" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff0b0"/><stop offset="0.4" stop-color="#e04010"/><stop offset="1" stop-color="#400" stop-opacity="0"/></radialGradient>
    </defs>
    <!-- the great axe behind his shoulder -->
    <path d="M 120 158 L 136 14" stroke="#2a1a0e" stroke-width="5" stroke-linecap="round"/>
    <path d="M 132 30 C 150 22, 160 40, 158 62 C 150 54, 142 52, 130 54 Z M 136 30 C 120 18, 108 26, 104 42 C 114 40, 122 42, 132 50 Z" fill="url(#hok-steel)" stroke="#1a1a1e" stroke-width="0.8"/>
    <path d="M 152 44 l 4 2 l -4 3 M 108 34 l -3 3 l 4 1" fill="#0a0a0a"/>
    <path d="M 150 58 c 1 4 0 7 -1 10" stroke="#7a0a0a" stroke-width="1.4" fill="none"/>
    <!-- shoulders and black plate -->
    <path d="M 8 160 C 10 116, 34 92, 80 90 C 126 92, 150 116, 152 160 Z" fill="url(#hok-plate)"/>
    <path d="M 14 124 C 20 100, 40 92, 58 98 L 54 116 C 38 112, 24 116, 14 124 Z M 146 124 C 140 100, 120 92, 102 98 L 106 116 C 122 112, 136 116, 146 124 Z" fill="#2a2a32" stroke="#6a6a72" stroke-width="0.8"/>
    <path d="M 20 108 l -6 -10 l 10 6 Z M 34 98 l -4 -12 l 8 10 Z M 140 108 l 6 -10 l -10 6 Z M 126 98 l 4 -12 l -8 10 Z" fill="#3a3a42"/>
    <path d="M 70 112 L 80 150 L 90 112" stroke="#7a1a1a" stroke-width="3" fill="none" opacity="0.7"/>
    <!-- the head -->
    <path d="M 52 60 C 48 36, 62 22, 80 22 C 98 22, 112 36, 108 60 C 108 80, 96 96, 80 98 C 64 96, 52 80, 52 60 Z" fill="url(#hok-face)" filter="url(#hok-skin)"/>
    <!-- iron crown of spikes -->
    <path d="M 54 34 L 106 34 L 104 40 L 56 40 Z" fill="#2a2a30" stroke="#6a6a70" stroke-width="0.6"/>
    <path d="M 56 34 L 54 16 L 62 34 Z M 66 34 L 66 10 L 72 34 Z M 77 34 L 80 4 L 83 34 Z M 88 34 L 94 10 L 94 34 Z M 98 34 L 106 16 L 104 34 Z" fill="#3a3a42" stroke="#0a0a0a" stroke-width="0.5"/>
    <!-- the brow; one eye, the other put out (a scar across a sunken lid) -->
    <path d="M 58 50 Q 68 44 78 52 M 82 52 Q 92 44 102 50" stroke="#141a08" stroke-width="3" fill="none"/>
    <ellipse cx="91" cy="56" rx="4.4" ry="3" fill="url(#hok-eye)"/>
    <path d="M 62 56 Q 69 60 76 56" stroke="#1a1008" stroke-width="1.6" fill="none"/>
    <path d="M 62 44 L 76 70" stroke="#6a2a20" stroke-width="2" opacity="0.85"/>
    <path d="M 63 46 l 3 -1 M 66 52 l 3 -1 M 70 58 l 3 -1 M 73 64 l 3 -1" stroke="#c8b090" stroke-width="0.8"/>
    <!-- nose, snarl, tusks -->
    <path d="M 76 62 L 74 72 L 80 74 L 86 72 L 84 62" fill="#2a3416"/>
    <path d="M 66 82 Q 80 90 94 82 Q 80 86 66 82 Z" fill="#100804"/>
    <path d="M 68 84 C 64 76, 64 70, 66 64 C 70 70, 72 76, 72 84 Z M 92 84 C 96 76, 96 70, 94 64 C 90 70, 88 76, 88 84 Z" fill="#ece0bc" stroke="#6a5a40" stroke-width="0.6"/>
    <path d="M 74 86 l 1.4 -3 l 1.4 3 l 1.4 -3 l 1.4 3 l 1.4 -3 l 1.4 3 l 1.4 -3 l 1.4 3" stroke="#d8cca8" stroke-width="0.8" fill="none"/>
    </svg>
  `,

  // ─── Lambton Worm ────────────────────────────────────────────────────────
  // The Wear's great worm: a limbless pale serpent coiled thrice round a
  // hill, the head of a lamprey-dragon, nine holes each side of its mouth.
  'Lambton Worm': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Lambton Worm: a vast limbless pale worm coiled three times round a hill, a lamprey-like dragon head with a ring of teeth and nine holes each side of its mouth">
    <defs>
      ${wetSkinFilter('hlw-skin', { freq: '0.1 0.24', seed: 136, shine: 0.3 })}
      <linearGradient id="hlw-body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d8ccb0"/><stop offset="0.5" stop-color="#8a7a5a"/><stop offset="1" stop-color="#3a3020"/></linearGradient>
      <linearGradient id="hlw-hill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a3018"/><stop offset="1" stop-color="#0a0c06"/></linearGradient>
      <radialGradient id="hlw-maw" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#2a0004"/><stop offset="0.7" stop-color="#7a1018"/><stop offset="1" stop-color="#c06070"/></radialGradient>
    </defs>
    <!-- the hill it coils round -->
    <path d="M 4 160 C 20 120, 50 96, 80 96 C 110 96, 140 120, 156 160 Z" fill="url(#hlw-hill)"/>
    <!-- three coils -->
    <g fill="none" stroke-linecap="round" filter="url(#hlw-skin)">
      <path d="M 14 152 C 40 160, 120 160, 146 150" stroke="url(#hlw-body)" stroke-width="15"/>
      <path d="M 26 130 C 50 140, 110 140, 134 128" stroke="url(#hlw-body)" stroke-width="13"/>
      <path d="M 40 110 C 60 120, 100 120, 120 108 C 132 100, 128 84, 116 76" stroke="url(#hlw-body)" stroke-width="12"/>
    </g>
    <g stroke="#3a3020" stroke-width="0.8" fill="none" opacity="0.6">
      <path d="M 30 148 l 0 8 M 46 150 l 0 9 M 62 151 l 0 9 M 78 151 l 0 9 M 94 151 l 0 9 M 110 150 l 0 8 M 126 148 l 0 8"/>
      <path d="M 40 128 l 0 8 M 56 130 l 0 8 M 72 131 l 0 8 M 88 131 l 0 8 M 104 130 l 0 8 M 120 128 l 0 7"/>
    </g>
    <!-- the neck rising, and the head -->
    <path d="M 116 76 C 104 66, 100 50, 92 38" stroke="url(#hlw-body)" stroke-width="13" fill="none" stroke-linecap="round" filter="url(#hlw-skin)"/>
    <path d="M 60 30 C 58 16, 72 8, 88 10 C 104 12, 112 26, 106 40 C 98 52, 78 54, 66 46 C 62 42, 60 36, 60 30 Z" fill="url(#hlw-body)" filter="url(#hlw-skin)"/>
    <!-- the round lamprey mouth, ringed with teeth -->
    <ellipse cx="66" cy="34" rx="11" ry="12" fill="url(#hlw-maw)"/>
    <g fill="#f0e8d0">
      ${Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * Math.PI * 2, x = 66 + Math.cos(a) * 9.6, y = 34 + Math.sin(a) * 10.4, ix = 66 + Math.cos(a) * 6.4, iy = 34 + Math.sin(a) * 7; return `<path d="M ${(x + Math.sin(a) * 1.4).toFixed(1)} ${(y - Math.cos(a) * 1.4).toFixed(1)} L ${ix.toFixed(1)} ${iy.toFixed(1)} L ${(x - Math.sin(a) * 1.4).toFixed(1)} ${(y + Math.cos(a) * 1.4).toFixed(1)} Z"/>`; }).join('')}
    </g>
    <!-- nine holes each side of its mouth -->
    <g fill="#1a0e08">
      ${Array.from({ length: 9 }, (_, i) => `<circle cx="${(80 + i * 2.6).toFixed(1)}" cy="${(22 + Math.sin(i * 0.6) * 1.6).toFixed(1)}" r="1.1"/><circle cx="${(80 + i * 2.6).toFixed(1)}" cy="${(46 - Math.sin(i * 0.6) * 1.6).toFixed(1)}" r="1.1"/>`).join('')}
    </g>
    <ellipse cx="96" cy="30" rx="3" ry="2" fill="#f0f0d0"/><circle cx="96" cy="30" r="1.2" fill="#000"/>
    <path d="M 60 44 c 0 6 2 10 0 16 M 66 46 c 1 5 0 9 1 13" stroke="#d0c8b0" stroke-width="1.2" fill="none" opacity="0.6"/>
    </svg>
  `,

  // ─── Grindylow ───────────────────────────────────────────────────────────
  // It hauls itself out of the pool: thin and green, arms far too long,
  // fingers like wet roots, huge glassy eyes, a wide mouth of needle teeth.
  'Grindylow': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Grindylow: a thin green water-demon hauling itself out of a pool, arms far too long with root-like fingers, huge glassy eyes, a wide mouth of needle teeth">
    <defs>
      ${wetSkinFilter('hgr-skin', { freq: '0.16 0.22', seed: 137, shine: 0.35 })}
      <linearGradient id="hgr-body" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="#6a9a5a"/><stop offset="0.6" stop-color="#2a4a28"/><stop offset="1" stop-color="#0a1a0c"/></linearGradient>
      <radialGradient id="hgr-eye" cx="40%" cy="35%" r="65%"><stop offset="0" stop-color="#f8fff0"/><stop offset="0.35" stop-color="#c8e8a0"/><stop offset="1" stop-color="#3a5a20"/></radialGradient>
      <linearGradient id="hgr-pool" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a3a40"/><stop offset="1" stop-color="#040c10"/></linearGradient>
    </defs>
    <!-- the pool -->
    <ellipse cx="80" cy="140" rx="78" ry="20" fill="url(#hgr-pool)"/>
    <path d="M 30 136 Q 50 132 70 136 M 90 140 Q 110 136 130 140 M 46 146 Q 70 142 96 146" stroke="#6a9aa0" stroke-width="0.8" fill="none" opacity="0.5"/>
    <!-- long arms, root fingers clawing at the edge -->
    <g fill="none" stroke-linecap="round" filter="url(#hgr-skin)">
      <path d="M 62 80 C 44 86, 28 100, 18 128" stroke="url(#hgr-body)" stroke-width="5"/>
      <path d="M 98 80 C 116 86, 132 100, 142 128" stroke="url(#hgr-body)" stroke-width="5"/>
    </g>
    <g stroke="#2a4a28" stroke-width="1.8" fill="none" stroke-linecap="round">
      <path d="M 18 128 C 12 132, 8 136, 4 136 M 18 128 C 14 136, 12 140, 8 146 M 18 128 C 18 136, 18 142, 16 150 M 18 128 C 22 134, 24 140, 26 146"/>
      <path d="M 142 128 C 148 132, 152 136, 156 136 M 142 128 C 146 136, 148 140, 152 146 M 142 128 C 142 136, 142 142, 144 150 M 142 128 C 138 134, 136 140, 134 146"/>
    </g>
    <!-- the thin body rising from the water -->
    <path d="M 62 136 C 58 110, 60 88, 66 76 C 74 70, 86 70, 94 76 C 100 88, 102 110, 98 136 Z" fill="url(#hgr-body)" filter="url(#hgr-skin)"/>
    <path d="M 70 86 Q 80 82 90 86 M 68 96 Q 80 92 92 96 M 68 106 Q 80 102 92 106" stroke="#0a1a0c" stroke-width="1.2" fill="none" opacity="0.7"/>
    <!-- the head: wide and flat, huge eyes, the mouth ear to ear -->
    <path d="M 50 56 C 48 38, 62 28, 80 28 C 98 28, 112 38, 110 56 C 108 70, 96 78, 80 78 C 64 78, 52 70, 50 56 Z" fill="url(#hgr-body)" filter="url(#hgr-skin)"/>
    <ellipse cx="66" cy="48" rx="9" ry="8" fill="url(#hgr-eye)"/><ellipse cx="94" cy="48" rx="9" ry="8" fill="url(#hgr-eye)"/>
    <ellipse cx="67" cy="49" rx="2" ry="5.4" fill="#000"/><ellipse cx="93" cy="49" rx="2" ry="5.4" fill="#000"/>
    <circle cx="63" cy="45" r="1.6" fill="#fff"/><circle cx="91" cy="45" r="1.6" fill="#fff"/>
    <path d="M 54 62 C 64 72, 96 72, 106 62 C 96 66, 64 66, 54 62 Z" fill="#0a0604"/>
    <g>${needleTeeth(57, 103, 63.4, 18, 3.4, 1, '#e8e4c8', 0.35)}</g>
    <g>${needleTeeth(60, 100, 68.2, 14, 2.8, -1, '#e8e4c8', 0.35)}</g>
    <!-- weed and water streaming off it -->
    <path d="M 56 40 C 50 50, 54 60, 48 70 M 104 40 C 110 52, 106 60, 112 70" stroke="#3a6a30" stroke-width="2" fill="none" opacity="0.8"/>
    <g fill="#a0d0d8" opacity="0.7"><circle cx="58" cy="80" r="1.2"/><circle cx="102" cy="84" r="1"/><circle cx="74" cy="118" r="1.2"/><circle cx="90" cy="124" r="1"/></g>
    </svg>
  `,

  // ─── Black Annis ─────────────────────────────────────────────────────────
  // The hag of the Dane Hills: blue-faced, lean as a gallows, iron claws,
  // a single long tooth, wild grey hair, a cloak of flayed skins.
  'Black Annis': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Black Annis: a gaunt blue-faced hag with wild grey hair, a single long tooth, long iron claws, wearing a cloak of flayed skins">
    <defs>
      ${horrorSkinFilter('hba-skin', { freq: '0.2 0.26', scale: 2.2, seed: 138, k: 1.3 })}
      <radialGradient id="hba-face" cx="45%" cy="35%" r="70%"><stop offset="0" stop-color="#6a88b0"/><stop offset="0.6" stop-color="#2a3a5a"/><stop offset="1" stop-color="#0a1020"/></radialGradient>
      <linearGradient id="hba-cloak" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a6a50"/><stop offset="1" stop-color="#2a1a10"/></linearGradient>
      <linearGradient id="hba-iron" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8a8a90"/><stop offset="1" stop-color="#2a2a30"/></linearGradient>
      <radialGradient id="hba-eye" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fffff0"/><stop offset="0.4" stop-color="#f0e060"/><stop offset="1" stop-color="#404000" stop-opacity="0"/></radialGradient>
    </defs>
    <!-- the cloak of skins, stitched -->
    <path d="M 30 160 C 34 120, 46 84, 62 70 L 98 70 C 114 84, 126 120, 130 160 Z" fill="url(#hba-cloak)" filter="url(#hba-skin)"/>
    <!-- the skins it is sewn from: patches of paler and darker hide -->
    <g filter="url(#hba-skin)" opacity="0.7" stroke="#1a0e08" stroke-width="0.8" stroke-dasharray="2 1.6">
      <path d="M 50 92 L 62 88 L 76 94 L 72 104 L 78 112 L 60 114 L 48 106 Z" fill="#8a6a54"/>
      <path d="M 84 90 L 100 88 L 110 98 L 104 110 L 90 112 L 86 102 Z" fill="#6a4a38"/>
      <path d="M 40 126 L 54 120 L 68 126 L 66 140 L 50 146 L 40 138 Z" fill="#7a5a44"/>
      <path d="M 92 124 L 110 120 L 120 132 L 114 146 L 98 144 L 92 134 Z" fill="#9a7a62"/>
      <path d="M 68 138 L 82 134 L 92 142 L 86 154 L 72 154 Z" fill="#5a3a2a"/>
    </g>
    <g stroke="#1a0e08" stroke-width="1" fill="none" opacity="0.8">
      <path d="M 50 110 C 62 104, 70 112, 80 106 C 92 112, 100 104, 112 110"/><path d="M 42 136 C 58 130, 70 138, 82 132 C 96 138, 108 130, 120 136"/>
      <path d="M 56 110 l 0 4 M 64 108 l 0 4 M 72 110 l 0 4 M 88 110 l 0 4 M 96 108 l 0 4 M 104 110 l 0 4"/>
    </g>
    <path d="M 46 120 c -3 6 -2 10 -5 14 l 6 -2 Z M 114 120 c 3 6 2 10 5 14 l -6 -2 Z" fill="#c8a080" opacity="0.6"/>
    <!-- gaunt arms reaching, long iron claws -->
    <path d="M 58 84 C 42 90, 30 100, 22 110 M 102 84 C 118 90, 130 100, 138 110" stroke="#2a3a5a" stroke-width="5" fill="none" stroke-linecap="round" filter="url(#hba-skin)"/>
    <g fill="url(#hba-iron)" stroke="#0a0a0c" stroke-width="0.5">
      <path d="M 22 110 L 4 116 L 20 113 Z"/><path d="M 22 110 L 6 128 L 22 115 Z"/><path d="M 22 110 L 14 136 L 25 116 Z"/><path d="M 22 110 L 26 138 L 28 115 Z"/>
      <path d="M 138 110 L 156 116 L 140 113 Z"/><path d="M 138 110 L 154 128 L 138 115 Z"/><path d="M 138 110 L 146 136 L 135 116 Z"/><path d="M 138 110 L 134 138 L 132 115 Z"/>
    </g>
    <!-- wild grey hair -->
    <path d="M 60 30 C 40 24, 28 44, 30 70 C 34 86, 40 96, 46 104 C 42 86, 44 64, 56 52 Z M 100 30 C 120 24, 132 44, 130 70 C 126 86, 120 96, 114 104 C 118 86, 116 64, 104 52 Z M 62 26 C 62 8, 98 8, 98 26 C 90 16, 70 16, 62 26 Z" fill="#5a5a58" filter="url(#hba-skin)"/>
    <g stroke="#b0b0aa" stroke-width="0.9" fill="none" opacity="0.75" stroke-linecap="round">
      ${Array.from({ length: 22 }, (_, i) => { const L = i < 11, k = i % 11, x0 = L ? 60 - k : 100 + k, y0 = 24 + k * 2; return `<path d="M ${x0} ${y0} C ${L ? x0 - 14 - k : x0 + 14 + k} ${y0 + 10}, ${L ? x0 - 18 + (k % 3) * 6 : x0 + 18 - (k % 3) * 6} ${y0 + 34}, ${L ? 34 + k * 1.4 : 126 - k * 1.4} ${y0 + 52 + (k % 4) * 6}"/>`; }).join('')}
      <path d="M 66 22 C 60 10, 50 6, 40 10 M 94 22 C 100 10, 110 6, 120 10 M 74 18 C 72 8, 66 2, 58 0 M 86 18 C 88 8, 94 2, 102 0"/>
    </g>
    <!-- the blue face, gaunt, one long tooth -->
    <path d="M 62 40 C 60 24, 68 18, 80 18 C 92 18, 100 24, 98 40 C 98 56, 90 70, 80 72 C 70 70, 62 56, 62 40 Z" fill="url(#hba-face)" filter="url(#hba-skin)"/>
    <path d="M 64 36 Q 71 30 78 38 M 82 38 Q 89 30 96 36" stroke="#0a1020" stroke-width="2" fill="none"/>
    <ellipse cx="72" cy="40" rx="3.6" ry="2.6" fill="url(#hba-eye)"/><ellipse cx="88" cy="40" rx="3.6" ry="2.6" fill="url(#hba-eye)"/>
    <circle cx="72" cy="40" r="1" fill="#000"/><circle cx="88" cy="40" r="1" fill="#000"/>
    <path d="M 66 50 Q 70 54 74 50 M 86 50 Q 90 54 94 50" stroke="#0a1020" stroke-width="1" fill="none"/>
    <path d="M 78 44 L 76 52 L 80 54" stroke="#1a2a40" stroke-width="1" fill="none"/>
    <path d="M 70 60 Q 80 66 90 60 Q 80 63 70 60 Z" fill="#0a0408"/>
    <path d="M 82 61 L 83 74 L 85 61 Z" fill="#e8d8a8" stroke="#6a5a30" stroke-width="0.4"/>
    <path d="M 74 62 c -1 4 0 6 -1 9" stroke="#7a1018" stroke-width="1.2" fill="none"/>
    </svg>
  `,

  // ─── Barghest ────────────────────────────────────────────────────────────
  // The black dog of the North: a hound as big as a calf, shaggy and
  // dripping, eyes like burning saucers, a broken chain dragging at its neck.
  'Barghest': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Barghest: a huge shaggy black dog, eyes like burning saucers, slavering jaws, a broken chain dragging from its neck">
    <defs>
      ${horrorSkinFilter('hbq-fur', { freq: '0.3 0.08', scale: 2.4, seed: 139, k: 1.3 })}
      <linearGradient id="hbq-body" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="#2a2a2c"/><stop offset="0.6" stop-color="#0e0e10"/><stop offset="1" stop-color="#020203"/></linearGradient>
      <radialGradient id="hbq-eye" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fffbe0"/><stop offset="0.3" stop-color="#ffb020"/><stop offset="0.7" stop-color="#e04010"/><stop offset="1" stop-color="#600" stop-opacity="0"/></radialGradient>
      <radialGradient id="hbq-mist" cx="50%" cy="80%" r="60%"><stop offset="0" stop-color="#4a5050" stop-opacity="0.35"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
      <linearGradient id="hbq-iron" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7a7068"/><stop offset="1" stop-color="#2a2420"/></linearGradient>
    </defs>
    <ellipse cx="80" cy="140" rx="80" ry="26" fill="url(#hbq-mist)"/>
    <!-- the body, shaggy, low and coiled to spring -->
    <path d="M 20 150 C 16 120, 30 96, 56 90 C 80 86, 110 90, 130 100 C 146 110, 150 130, 144 150 Z" fill="url(#hbq-body)" filter="url(#hbq-fur)"/>
    <g stroke="#3a3a3e" stroke-width="1" fill="none" opacity="0.7">
      <path d="M 36 100 l -4 8 M 46 96 l -3 9 M 58 94 l -2 9 M 120 100 l 3 8 M 132 108 l 4 7 M 28 116 l -5 6"/>
    </g>
    <path d="M 30 150 L 26 160 L 40 160 L 42 150 Z M 120 150 L 122 160 L 136 160 L 134 150 Z" fill="#050505"/>
    <path d="M 26 158 l -2 2 M 30 158 l 0 2 M 34 158 l 2 2 M 124 158 l -1 2 M 128 158 l 0 2 M 132 158 l 2 2" stroke="#c8c0a8" stroke-width="1.4"/>
    <!-- a broken chain dragging from its neck -->
    <g fill="none" stroke="url(#hbq-iron)" stroke-width="2.6">
      <ellipse cx="96" cy="96" rx="5" ry="3"/><ellipse cx="104" cy="104" rx="3" ry="5"/><ellipse cx="110" cy="114" rx="5" ry="3"/><ellipse cx="116" cy="124" rx="3" ry="5"/><ellipse cx="120" cy="136" rx="5" ry="3"/>
    </g>
    <path d="M 124 138 l 4 -1 l -2 3" stroke="#7a7068" stroke-width="1.6" fill="none"/>
    <!-- the head, low and huge, the eyes like saucers -->
    <!-- the head, low and huge: a broad skull, a long muzzle thrust at you -->
    <path d="M 36 30 C 26 34, 22 50, 28 62 C 34 56, 40 46, 44 38 Z M 116 30 C 126 34, 130 50, 124 62 C 118 56, 112 46, 108 38 Z" fill="#0a0a0c" filter="url(#hbq-fur)"/>
    <path d="M 38 52 C 36 32, 54 22, 76 22 C 98 22, 116 32, 114 52 C 112 62, 106 66, 100 68 L 52 68 C 46 66, 40 62, 38 52 Z" fill="url(#hbq-body)" filter="url(#hbq-fur)"/>
    <path d="M 52 60 C 50 76, 56 96, 76 102 C 96 96, 102 76, 100 60 Z" fill="url(#hbq-body)" filter="url(#hbq-fur)"/>
    <circle cx="58" cy="48" r="9" fill="url(#hbq-eye)"/><circle cx="94" cy="48" r="9" fill="url(#hbq-eye)"/>
    <circle cx="58" cy="48" r="2.6" fill="#2a0000"/><circle cx="94" cy="48" r="2.6" fill="#2a0000"/>
    <path d="M 48 40 Q 58 36 66 42 M 86 42 Q 94 36 104 40" stroke="#000" stroke-width="2.4" fill="none"/>
    <!-- the muzzle: wet nose, lips drawn back, jaws slavering -->
    <path d="M 68 70 C 68 64, 84 64, 84 70 C 84 76, 68 76, 68 70 Z" fill="#050505"/>
    <path d="M 70 68 l 2 0 M 80 68 l 2 0" stroke="#5a5a5a" stroke-width="0.8"/>
    <path d="M 56 84 C 64 104, 88 104, 96 84 C 88 90, 64 90, 56 84 Z" fill="#2a0408"/>
    <g>${needleTeeth(58, 94, 85.6, 11, 4.2, 1, '#ece4cc', 0.3)}</g>
    <g>${needleTeeth(62, 90, 97, 8, 3.8, -1, '#ece4cc', 0.3)}</g>
    <path d="M 64 96 c 0 6 1 10 0 16 M 76 100 c 1 6 0 9 1 14 M 88 96 c 0 5 1 8 0 12" stroke="#d0d8d0" stroke-width="1.2" fill="none" opacity="0.6"/>
    </svg>
  `,

  // ─── Lantern Moths ───────────────────────────────────────────────────────
  // Hundreds of ash-pale moths smothering a torch: furred bodies, dusty
  // wings with eye-spots, and in the cloud, here and there, a real eye.
  'Lantern Moths': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Lantern Moths: a choking cloud of ash-pale furred moths smothering a dying torch, their wings marked with staring eye-spots">
    <defs>
      ${horrorSkinFilter('hlm-dust', { freq: '0.4 0.5', scale: 1.4, seed: 140, k: 1.1 })}
      <radialGradient id="hlm-glow" cx="50%" cy="55%" r="50%"><stop offset="0" stop-color="#ffb860" stop-opacity="0.55"/><stop offset="1" stop-color="#401000" stop-opacity="0"/></radialGradient>
      <linearGradient id="hlm-wing" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d8d0c0"/><stop offset="0.6" stop-color="#8a8070"/><stop offset="1" stop-color="#3a342a"/></linearGradient>
    </defs>
    <circle cx="80" cy="84" r="54" fill="url(#hlm-glow)"/>
    <path d="M 76 160 L 78 100 L 84 100 L 86 160 Z" fill="#2a1a0a"/>
    <path d="M 81 98 C 78 94, 79 90, 82 86 C 83 90, 85 94, 81 98 Z" fill="#ff8020" opacity="0.6"/>
    <g filter="url(#hlm-dust)">
      ${Array.from({ length: 26 }, (_, i) => {
        const a = i * 2.39996, r = 8 + Math.sqrt(i) * 13, x = 80 + Math.cos(a) * r, y = 82 + Math.sin(a) * r * 0.85;
        const rot = (a * 57.3) % 360, sc = 1.05 - i * 0.022;
        return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(0)}) scale(${sc.toFixed(2)})">
          <path d="M 0 0 C -9 -13, -24 -12, -21 -1 C -19 7, -8 6, 0 2 Z M 0 0 C 9 -13, 24 -12, 21 -1 C 19 7, 8 6, 0 2 Z" fill="url(#hlm-wing)" stroke="#2a241a" stroke-width="0.5"/>
          <circle cx="-12" cy="-4" r="3" fill="#2a241a"/><circle cx="12" cy="-4" r="3" fill="#2a241a"/>
          <circle cx="-12" cy="-4" r="1.3" fill="#c8b890"/><circle cx="12" cy="-4" r="1.3" fill="#c8b890"/>
          <ellipse cx="0" cy="2" rx="2.4" ry="6" fill="#6a5e4a"/>
        </g>`;
      }).join('')}
    </g>
    <!-- in the cloud, here and there, a real eye -->
    <g><ellipse cx="58" cy="60" rx="3" ry="2" fill="#f0e8c0"/><circle cx="58" cy="60" r="1.1" fill="#000"/><ellipse cx="108" cy="104" rx="2.6" ry="1.8" fill="#f0e8c0"/><circle cx="108" cy="104" r="1" fill="#000"/></g>
    <g fill="#d8d0c0" opacity="0.5">${Array.from({ length: 40 }, (_, i) => `<circle cx="${(20 + (i * 37) % 120).toFixed(0)}" cy="${(20 + (i * 53) % 120).toFixed(0)}" r="0.7"/>`).join('')}</g>
    </svg>
  `,

  // ─── Toll-Keeper ─────────────────────────────────────────────────────────
  // Tall and grey under its hood, a face like a dry riverbed, a ledger
  // whose pages are written in blood, a string of severed fingers at its belt.
  'Toll-Keeper': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Toll-Keeper: a tall hooded grey figure on a stair, a cracked grey face with pale pinpoint eyes, a ledger written in blood, a string of severed fingers at its belt">
    <defs>
      ${horrorSkinFilter('htk-skin', { freq: '0.24 0.3', scale: 2.4, seed: 141, k: 1.3 })}
      ${horrorSkinFilter('htk-cloth', { freq: '0.05 0.4', scale: 1.6, seed: 142, k: 1.1 })}
      <linearGradient id="htk-robe" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="#3a3430"/><stop offset="1" stop-color="#0a0806"/></linearGradient>
      <radialGradient id="htk-face" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#9a948a"/><stop offset="1" stop-color="#3a3630"/></radialGradient>
      <linearGradient id="htk-stair" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a443c"/><stop offset="1" stop-color="#14120e"/></linearGradient>
    </defs>
    <path d="M 0 150 L 160 150 L 160 160 L 0 160 Z M 10 136 L 150 136 L 150 150 L 10 150 Z" fill="url(#htk-stair)" filter="url(#htk-skin)"/>
    <path d="M 124 140 L 136 10" stroke="#1a120a" stroke-width="3.6" stroke-linecap="round"/>
    <path d="M 133 16 L 139 16 L 138 6 L 134 6 Z" fill="#4a4a50"/>
    <path d="M 48 136 C 42 100, 50 64, 62 46 L 98 46 C 110 64, 118 100, 112 136 Z" fill="url(#htk-robe)" filter="url(#htk-cloth)"/>
    <!-- the string of fingers at its belt -->
    <path d="M 58 90 Q 80 98 102 90" stroke="#2a2018" stroke-width="1.2" fill="none"/>
    <g fill="#c8b8a0" stroke="#5a4a3a" stroke-width="0.5">${[62, 68, 74, 80, 86, 92, 98].map((x, i) => `<path d="M ${x} ${92 + Math.sin(i) * 1.6} l -1.6 9 q 1.6 2 3.2 0 Z"/>`).join('')}</g>
    <g fill="#7a0a10">${[62, 74, 86, 98].map(x => `<circle cx="${x + 0.2}" cy="102" r="0.9"/>`).join('')}</g>
    <!-- the ledger, written in blood -->
    <path d="M 54 106 L 80 110 L 106 106 L 106 122 L 80 126 L 54 122 Z" fill="#d8cca8" stroke="#3a2a18" stroke-width="1"/>
    <path d="M 80 110 L 80 126" stroke="#3a2a18" stroke-width="1"/>
    <path d="M 58 111 L 76 113 M 58 115 L 74 117 M 58 119 L 76 121 M 84 113 L 102 111 M 84 117 L 100 115 M 84 121 L 98 119" stroke="#8a0a14" stroke-width="0.8"/>
    <path d="M 100 84 C 106 94, 102 104, 94 110" stroke="#8a847a" stroke-width="3" fill="none" stroke-linecap="round" filter="url(#htk-skin)"/>
    <!-- the hood; within it a cracked grey face, pinpoint eyes -->
    <path d="M 54 52 C 50 26, 64 8, 80 6 C 96 8, 110 26, 106 52 C 96 60, 64 60, 54 52 Z" fill="url(#htk-robe)" filter="url(#htk-cloth)"/>
    <path d="M 66 30 C 66 22, 72 18, 80 18 C 88 18, 94 22, 94 30 C 94 44, 88 54, 80 56 C 72 54, 66 44, 66 30 Z" fill="url(#htk-face)" filter="url(#htk-skin)"/>
    <path d="M 66 22 C 70 16, 90 16, 94 22 L 94 28 C 88 22, 72 22, 66 28 Z" fill="#000" opacity="0.7"/>
    <path d="M 70 34 L 76 34 M 84 34 L 90 34" stroke="#1a1814" stroke-width="2.4"/>
    <circle cx="73" cy="34" r="1" fill="#f0ead0"/><circle cx="87" cy="34" r="1" fill="#f0ead0"/>
    <path d="M 74 46 Q 80 48 86 46" stroke="#1a1814" stroke-width="1.2" fill="none"/>
    <path d="M 70 24 L 74 36 L 72 44 M 88 26 L 86 40 L 90 50" stroke="#1a1814" stroke-width="0.6" fill="none"/>
    </svg>
  `,

  // ─── The Hush ────────────────────────────────────────────────────────────
  // Silence with a shape: a tall grey shroud with a stitched-shut mouth, the
  // air around it gone flat and dead, the floor dust lying perfectly still.
  'Hush': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Hush: a tall grey shroud-like shape with no eyes and a mouth stitched shut, a long finger raised to it, the air around it dead and still">
    <defs>
      ${horrorSkinFilter('hhu-cloth', { freq: '0.04 0.3', scale: 1.8, seed: 143, k: 1.15 })}
      <radialGradient id="hhu-dead" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#8a9aa8" stop-opacity="0.3"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
      <linearGradient id="hhu-shroud" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b8c0c8"/><stop offset="0.6" stop-color="#5a646e"/><stop offset="1" stop-color="#1a1e22" stop-opacity="0.2"/></linearGradient>
      <radialGradient id="hhu-face" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#d8dce0"/><stop offset="1" stop-color="#6a7076"/></radialGradient>
    </defs>
    <circle cx="80" cy="76" r="76" fill="url(#hhu-dead)"/>
    <path d="M 52 40 C 50 20, 64 8, 80 8 C 96 8, 110 20, 108 40 C 116 74, 124 116, 116 156 C 106 146, 100 158, 90 148 C 84 158, 76 158, 70 148 C 60 158, 54 146, 44 156 C 36 116, 44 74, 52 40 Z" fill="url(#hhu-shroud)" filter="url(#hhu-cloth)"/>
    <path d="M 62 60 C 66 90, 64 120, 60 150 M 98 60 C 94 90, 96 120, 100 150 M 80 64 L 80 150" stroke="#2a3036" stroke-width="1" fill="none" opacity="0.5"/>
    <!-- the face: no eyes, the mouth stitched shut -->
    <path d="M 64 34 C 62 20, 70 14, 80 14 C 90 14, 98 20, 96 34 C 96 46, 90 54, 80 56 C 70 54, 64 46, 64 34 Z" fill="url(#hhu-face)" filter="url(#hhu-cloth)"/>
    <ellipse cx="72" cy="32" rx="5" ry="3" fill="#3a4046" opacity="0.6"/><ellipse cx="88" cy="32" rx="5" ry="3" fill="#3a4046" opacity="0.6"/>
    <path d="M 70 46 Q 80 49 90 46" stroke="#2a1a1a" stroke-width="1.6" fill="none"/>
    <path d="M 72 43 L 73 49 M 76 44 L 76.6 50 M 80 44.6 L 80 50.6 M 84 44 L 83.4 50 M 88 43 L 87 49" stroke="#1a0a0a" stroke-width="0.8"/>
    <path d="M 70 47 c 0 3 1 5 0 8" stroke="#6a1a1a" stroke-width="0.8" fill="none" opacity="0.7"/>
    <!-- a grey hand raised, one long finger upright across the stitched mouth -->
    <path d="M 100 100 C 98 86, 94 76, 88 68" stroke="#b8bcc0" stroke-width="5" fill="none" stroke-linecap="round" filter="url(#hhu-cloth)"/>
    <ellipse cx="84" cy="64" rx="7" ry="6" fill="#b8bcc0" filter="url(#hhu-cloth)"/>
    <path d="M 82 60 L 81 34" stroke="#c8ccd0" stroke-width="3.6" stroke-linecap="round"/>
    <path d="M 79.6 36 L 82.4 36" stroke="#6a7076" stroke-width="1"/>
    <!-- dust hanging perfectly still in the air -->
    <g fill="#c8d0d8" opacity="0.5">${Array.from({ length: 30 }, (_, i) => `<circle cx="${(10 + (i * 41) % 140).toFixed(0)}" cy="${(10 + (i * 67) % 140).toFixed(0)}" r="0.8"/>`).join('')}</g>
    </svg>
  `,

  // ─── Cartographer's Bane ─────────────────────────────────────────────────
  // Hairless, eyeless, thin as a hatstand; its skin is covered in faded,
  // half-erased maps; its fingers are black with ink, and it is licking one.
  "Cartographer's Bane": `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Cartographer's Bane: a tall eyeless hairless thing whose pale skin is tattooed with half-erased maps, its long fingers black with ink, torn maps drifting around it">
    <defs>
      ${horrorSkinFilter('hcb-skin', { freq: '0.2 0.26', scale: 2, seed: 144, k: 1.25 })}
      <linearGradient id="hcb-body" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="#e0d8cc"/><stop offset="0.6" stop-color="#9a9084"/><stop offset="1" stop-color="#3a342c"/></linearGradient>
      <linearGradient id="hcb-paper" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d8c8a0"/><stop offset="1" stop-color="#6a5a3a"/></linearGradient>
    </defs>
    ${[[20, 36, -18], [136, 26, 22], [14, 98, 12], [142, 92, -14], [32, 134, 28], [128, 138, -22], [56, 18, 8]].map(([x, y, r]) => `
      <g transform="translate(${x} ${y}) rotate(${r})">
        <path d="M -11 -8 L 9 -10 L 12 7 L 3 5 L -1 9 L -10 8 Z" fill="url(#hcb-paper)" stroke="#3a2a18" stroke-width="0.5"/>
        <path d="M -7 -4 C -2 -7, 2 0, 7 -4 M -6 3 L 6 1 M -2 -8 L 0 6" stroke="#4a2a14" stroke-width="0.5" fill="none" opacity="0.8"/>
      </g>`).join('')}
    <ellipse cx="80" cy="154" rx="26" ry="4" fill="#000" opacity="0.6"/>
    <path d="M 72 46 C 68 82, 68 118, 62 152 L 72 152 L 80 106 L 88 152 L 98 152 C 92 118, 92 82, 88 46 Z" fill="url(#hcb-body)" filter="url(#hcb-skin)"/>
    <!-- maps inked on its skin, half erased -->
    <g stroke="#3a2a1a" stroke-width="0.7" fill="none" opacity="0.55">
      <path d="M 74 60 L 86 60 L 86 72 L 78 72 L 78 80 L 84 80"/><path d="M 72 90 C 76 86, 82 92, 88 88"/><path d="M 76 100 L 76 112 L 84 112"/>
      <circle cx="80" cy="66" r="1.4"/><path d="M 70 128 L 74 128 M 86 128 L 90 128"/>
    </g>
    <!-- arms too long; ink-black fingers, one at its mouth -->
    <path d="M 74 52 C 58 62, 42 80, 32 100" stroke="url(#hcb-body)" stroke-width="5" fill="none" stroke-linecap="round" filter="url(#hcb-skin)"/>
    <path d="M 38 90 L 32 100 M 32 100 L 20 104 M 32 100 L 22 112 M 32 100 L 30 116 M 32 100 L 40 112" stroke="#060606" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M 86 52 C 104 58, 108 46, 96 40" stroke="url(#hcb-body)" stroke-width="5" fill="none" stroke-linecap="round" filter="url(#hcb-skin)"/>
    <path d="M 96 40 L 88 40 M 96 40 L 90 36" stroke="#060606" stroke-width="2.2" stroke-linecap="round"/>
    <!-- the head: blank where the eyes should be, a wide wet mouth -->
    <path d="M 64 28 C 62 12, 70 4, 80 4 C 90 4, 98 12, 96 28 C 96 38, 90 46, 80 46 C 70 46, 64 38, 64 28 Z" fill="url(#hcb-body)" filter="url(#hcb-skin)"/>
    <path d="M 68 24 Q 74 22 78 24 M 82 24 Q 86 22 92 24" stroke="#7a7268" stroke-width="1.6" fill="none"/>
    <path d="M 72 36 Q 80 44 88 36 Q 80 40 72 36 Z" fill="#1a0a0a"/>
    <path d="M 86 38 c 2 1 3 4 2 6" stroke="#0a0a0a" stroke-width="1.4" fill="none"/>
    </svg>
  `,

  // ─── Kobold ──────────────────────────────────────────────────────────────
  // Small, but nothing cute about it: a scabbed, scaly little dog-lizard
  // with a rat's teeth, a bone-tipped spear, and too many of its friends behind.
  'Kobold': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Kobold: a scabbed, scaly little dog-lizard with needle teeth and yellow eyes, crouched over a bone-tipped spear, more eyes glinting in the dark behind">
    <defs>
      ${horrorSkinFilter('hkb-hide', { freq: '0.22 0.28', scale: 2.2, seed: 150, k: 1.25 })}
      ${scalePattern('hkb-sc', 2.4, '#140a04', '#c89060')}
      <linearGradient id="hkb-body" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="#8a5a34"/><stop offset="0.6" stop-color="#4a2a14"/><stop offset="1" stop-color="#1a0c04"/></linearGradient>
      <radialGradient id="hkb-eye" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff8c0"/><stop offset="0.4" stop-color="#e0b020"/><stop offset="1" stop-color="#604000" stop-opacity="0"/></radialGradient>
    </defs>
    <!-- more of them in the dark behind -->
    <g opacity="0.7"><ellipse cx="22" cy="60" rx="2" ry="1.3" fill="url(#hkb-eye)"/><ellipse cx="30" cy="61" rx="2" ry="1.3" fill="url(#hkb-eye)"/>
      <ellipse cx="132" cy="50" rx="2" ry="1.3" fill="url(#hkb-eye)"/><ellipse cx="140" cy="51" rx="2" ry="1.3" fill="url(#hkb-eye)"/>
      <ellipse cx="146" cy="84" rx="1.6" ry="1" fill="url(#hkb-eye)"/><ellipse cx="152" cy="85" rx="1.6" ry="1" fill="url(#hkb-eye)"/></g>
    <ellipse cx="80" cy="152" rx="36" ry="4" fill="#000" opacity="0.6"/>
    <!-- the spear: a shaft with a sharpened bone lashed on -->
    <path d="M 36 150 L 118 30" stroke="#4a3018" stroke-width="3" stroke-linecap="round"/>
    <path d="M 114 34 L 128 12 L 120 36 Z" fill="#e0d4b0" stroke="#6a5a40" stroke-width="0.6"/>
    <path d="M 112 38 l 6 2 M 110 41 l 6 2" stroke="#2a1a0a" stroke-width="1.4"/>
    <!-- tail -->
    <path d="M 60 130 C 40 140, 26 136, 18 146" stroke="url(#hkb-body)" stroke-width="7" fill="none" stroke-linecap="round" filter="url(#hkb-hide)"/>
    <!-- crouched body, ribs showing -->
    <path d="M 56 140 C 50 116, 56 90, 70 80 C 82 76, 96 80, 104 92 C 110 110, 106 130, 100 140 Z" fill="url(#hkb-body)" filter="url(#hkb-hide)"/>
    <path d="M 56 140 C 50 116, 56 90, 70 80 C 82 76, 96 80, 104 92 C 110 110, 106 130, 100 140 Z" fill="url(#hkb-sc)" opacity="0.5"/>
    <path d="M 70 98 Q 80 94 92 98 M 68 106 Q 80 102 94 106 M 70 114 Q 80 110 92 114" stroke="#1a0c04" stroke-width="1.2" fill="none"/>
    <path d="M 74 120 l -3 4 M 88 118 l 3 5" stroke="#7a1a10" stroke-width="2" opacity="0.7"/>
    <!-- claws on the spear, feet splayed -->
    <path d="M 98 100 C 104 90, 108 76, 106 66" stroke="url(#hkb-body)" stroke-width="5" fill="none" stroke-linecap="round" filter="url(#hkb-hide)"/>
    <path d="M 104 64 l 6 -4 M 106 66 l 7 0 M 106 68 l 6 3" stroke="#e8dcc0" stroke-width="1.4"/>
    <path d="M 58 140 l -6 6 M 62 140 l -2 8 M 96 140 l 2 8 M 100 140 l 6 6" stroke="#e8dcc0" stroke-width="1.6" stroke-linecap="round"/>
    <!-- the head: a dog-lizard's snout, yellow eyes, needle teeth -->
    <!-- a dog-lizard's head thrust forward: a long scaly snout, small horns -->
    <path d="M 66 82 C 58 76, 58 62, 68 54 C 78 48, 92 50, 98 58 L 124 62 C 130 64, 130 72, 124 74 L 98 80 C 90 86, 76 88, 66 82 Z" fill="url(#hkb-body)" filter="url(#hkb-hide)"/>
    <path d="M 66 82 C 58 76, 58 62, 68 54 C 78 48, 92 50, 98 58 L 124 62 C 130 64, 130 72, 124 74 L 98 80 C 90 86, 76 88, 66 82 Z" fill="url(#hkb-sc)" opacity="0.45"/>
    <path d="M 70 54 C 66 46, 62 42, 56 40 C 62 46, 64 50, 66 56 Z M 82 50 C 82 42, 80 36, 76 32 C 80 40, 80 46, 78 52 Z" fill="#d8c8a0"/>
    <ellipse cx="88" cy="60" rx="4" ry="3" fill="url(#hkb-eye)"/>
    <path d="M 88 58 l 0 4" stroke="#000" stroke-width="1.4"/>
    <path d="M 82 56 Q 88 53 94 57" stroke="#1a0c04" stroke-width="1.6" fill="none"/>
    <circle cx="124" cy="66" r="1" fill="#000"/>
    <path d="M 96 72 L 126 70 C 124 78, 106 84, 96 80 Z" fill="#100604"/>
    <g>${needleTeeth(98, 124, 71.6, 10, 3, 1, '#ece4c4', 0.35)}</g>
    <path d="M 104 80 c 0 3 1 5 0 7" stroke="#c8d0b0" stroke-width="0.8" fill="none" opacity="0.6"/>
    </svg>
  `,

  // ─── Mold ────────────────────────────────────────────────────────────────
  // A colony that has eaten someone: furred grey-green growth over a
  // collapsed body, a hand still showing, spore stalks nodding, the air thick.
  'Mold': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Mold: a furred grey-green mould colony grown over a collapsed body, one hand still showing, spore stalks nodding in a cloud of spores">
    <defs>
      ${horrorSkinFilter('hmo-fur', { freq: '0.5 0.6', scale: 2.4, seed: 151, k: 1.3 })}
      <radialGradient id="hmo-body" cx="45%" cy="35%" r="70%"><stop offset="0" stop-color="#9aa878"/><stop offset="0.6" stop-color="#4a5a30"/><stop offset="1" stop-color="#141a08"/></radialGradient>
      <radialGradient id="hmo-cloud" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#c8d0a0" stop-opacity="0.4"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
    </defs>
    <ellipse cx="80" cy="60" rx="76" ry="50" fill="url(#hmo-cloud)"/>
    <ellipse cx="80" cy="146" rx="76" ry="12" fill="#141a08" opacity="0.8"/>
    <!-- the shape under it was a person, lying curled -->
    <path d="M 20 146 C 18 120, 36 102, 60 100 C 76 92, 98 90, 116 100 C 138 106, 146 126, 142 146 Z" fill="url(#hmo-body)" filter="url(#hmo-fur)"/>
    <path d="M 60 102 C 56 92, 62 82, 72 82 C 82 82, 86 92, 82 100 Z" fill="url(#hmo-body)" filter="url(#hmo-fur)"/>
    <!-- a hand still showing, fingers grey -->
    <path d="M 126 128 L 140 122 M 128 132 l 14 -2 M 128 136 l 13 2 M 126 140 l 10 4" stroke="#8a8478" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M 118 134 C 122 128, 128 126, 132 130" stroke="#6a6458" stroke-width="5" fill="none" stroke-linecap="round"/>
    <!-- the ribs pushing up under the growth -->
    <path d="M 70 112 Q 80 106 92 112 M 68 120 Q 80 114 94 120" stroke="#2a3014" stroke-width="2" fill="none" opacity="0.7"/>
    <!-- spore stalks nodding, heavy heads -->
    <g stroke="#a0a880" stroke-width="1.2" fill="none">
      <path d="M 40 112 C 38 96, 44 84, 40 72"/><path d="M 56 98 C 58 80, 52 66, 56 52"/><path d="M 92 92 C 96 76, 90 62, 96 48"/><path d="M 112 102 C 118 86, 112 76, 118 64"/><path d="M 76 84 C 74 72, 80 62, 76 50"/>
    </g>
    <g fill="#d8dcb8"><circle cx="40" cy="70" r="4"/><circle cx="56" cy="50" r="5"/><circle cx="96" cy="46" r="4.6"/><circle cx="118" cy="62" r="4"/><circle cx="76" cy="48" r="3.6"/></g>
    <g fill="#e8ecd0" opacity="0.6">${Array.from({ length: 36 }, (_, i) => `<circle cx="${(16 + (i * 43) % 130).toFixed(0)}" cy="${(14 + (i * 29) % 80).toFixed(0)}" r="${(0.6 + (i % 3) * 0.4).toFixed(1)}"/>`).join('')}</g>
    </svg>
  `,

  // ─── Slime Mold ──────────────────────────────────────────────────────────
  // A glistening sack of yellow-green slime dragging itself forward, a skull
  // and a rusted helm half-dissolved inside it, acid smoking on the floor.
  'Slime Mold': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Slime Mold: a glistening translucent sack of yellow-green slime with a skull, bones and a rusted helm half-dissolved inside, acid smoking on the floor">
    <defs>
      ${wetSkinFilter('hsm-slime', { freq: '0.08 0.12', seed: 152, shine: 0.5 })}
      <radialGradient id="hsm-body" cx="45%" cy="35%" r="70%"><stop offset="0" stop-color="#e8f080" stop-opacity="0.5"/><stop offset="0.6" stop-color="#8aa030" stop-opacity="0.45"/><stop offset="1" stop-color="#2a3808" stop-opacity="0.8"/></radialGradient>
      <radialGradient id="hsm-pool" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#a0c040" stop-opacity="0.5"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
    </defs>
    <ellipse cx="80" cy="146" rx="78" ry="14" fill="url(#hsm-pool)"/>
    <!-- the things inside it, half eaten -->
    <g opacity="0.85">
      <path d="M 60 104 C 58 92, 66 86, 74 86 C 82 86, 88 92, 86 104 L 82 112 L 64 112 Z" fill="#d8ccaa"/>
      <ellipse cx="68" cy="98" rx="3.6" ry="3" fill="#2a2010"/><ellipse cx="80" cy="98" rx="3.6" ry="3" fill="#2a2010"/>
      <path d="M 66 112 l 2 4 l 2 -4 l 2 4 l 2 -4 l 2 4 l 2 -4 l 2 4" stroke="#d8ccaa" stroke-width="1.2" fill="none"/>
      <path d="M 96 92 C 100 80, 116 80, 118 92 L 116 98 L 98 98 Z" fill="#7a4a20" stroke="#3a2008" stroke-width="0.8"/>
      <path d="M 40 120 L 72 128 M 92 124 L 120 116" stroke="#c8bc98" stroke-width="3" stroke-linecap="round"/>
    </g>
    <!-- the sack of slime, dragging itself forward -->
    <path d="M 14 146 C 10 116, 24 84, 50 70 C 66 60, 98 58, 114 70 C 140 86, 152 118, 146 146 C 120 150, 40 150, 14 146 Z" fill="url(#hsm-body)" filter="url(#hsm-slime)"/>
    <path d="M 40 80 C 56 70, 84 66, 104 72" stroke="#f8ffc0" stroke-width="2" fill="none" opacity="0.6"/>
    <path d="M 30 100 C 36 92, 44 88, 50 88" stroke="#f8ffc0" stroke-width="1.4" fill="none" opacity="0.5"/>
    <!-- dripping, and acid smoking where it touches -->
    <path d="M 30 146 c 0 4 1 7 0 10 M 62 148 c 1 4 0 6 1 9 M 118 148 c 0 4 1 6 0 9" stroke="#c0d850" stroke-width="2" fill="none"/>
    <g stroke="#d0d8c0" stroke-width="1" fill="none" opacity="0.4"><path d="M 20 144 C 16 136, 24 130, 18 122"/><path d="M 140 144 C 146 136, 138 130, 144 122"/></g>
    </svg>
  `,

  // ─── Stirge Swarm ────────────────────────────────────────────────────────
  // Leathery bat-mosquitoes the size of cats, proboscises like awls, bodies
  // swollen and red with what they've drunk; one close, the rest coming.
  'Stirge Swarm': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Stirge Swarm: leathery bat-winged mosquito things the size of cats, awl-like proboscises, bodies swollen red with blood, one close and many more coming">
    <defs>
      ${horrorSkinFilter('hst-hide', { freq: '0.2 0.26', scale: 2, seed: 153, k: 1.25 })}
      <linearGradient id="hst-wing" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a3a2a"/><stop offset="1" stop-color="#1a0c06"/></linearGradient>
      <radialGradient id="hst-belly" cx="40%" cy="40%" r="60%"><stop offset="0" stop-color="#e05050"/><stop offset="0.6" stop-color="#8a1018"/><stop offset="1" stop-color="#2a0406"/></radialGradient>
    </defs>
    <!-- the swarm coming behind -->
    <g fill="#1a0c06" opacity="0.75">
      ${[[24, 30, 0.35], [130, 24, 0.4], [44, 128, 0.3], [140, 120, 0.35], [16, 84, 0.28], [148, 70, 0.3], [100, 16, 0.25]].map(([x, y, s]) => `<path transform="translate(${x} ${y}) scale(${s})" d="M 0 0 C -20 -30, -50 -20, -60 0 C -40 -6, -20 4, 0 6 C 20 4, 40 -6, 60 0 C 50 -20, 20 -30, 0 0 Z"/>`).join('')}
    </g>
    <!-- the near one: wings spread, belly swollen -->
    <path d="M 80 74 C 58 40, 20 44, 4 70 C 24 66, 40 78, 56 84 Z M 80 74 C 102 40, 140 44, 156 70 C 136 66, 120 78, 104 84 Z" fill="url(#hst-wing)" filter="url(#hst-hide)"/>
    <path d="M 80 74 L 4 70 M 78 78 L 24 80 M 80 74 L 156 70 M 82 78 L 136 80" stroke="#2a140a" stroke-width="1.2"/>
    <ellipse cx="80" cy="96" rx="20" ry="26" fill="url(#hst-belly)" filter="url(#hst-hide)"/>
    <path d="M 66 86 Q 80 82 94 86 M 64 96 Q 80 92 96 96 M 66 106 Q 80 102 94 106" stroke="#4a0408" stroke-width="1" fill="none" opacity="0.7"/>
    <!-- legs, hooked, reaching -->
    <path d="M 66 110 L 52 130 L 46 128 M 72 116 L 66 140 M 94 110 L 108 130 L 114 128 M 88 116 L 94 140" stroke="#2a140a" stroke-width="2" fill="none" stroke-linecap="round"/>
    <!-- the head: a bulb of eyes, the proboscis like an awl -->
    <circle cx="80" cy="68" r="10" fill="#3a1a10" filter="url(#hst-hide)"/>
    <g fill="#8a1018"><circle cx="74" cy="64" r="2.4"/><circle cx="86" cy="64" r="2.4"/><circle cx="78" cy="70" r="1.8"/><circle cx="82" cy="70" r="1.8"/></g>
    <g fill="#ffb0a0" opacity="0.7"><circle cx="73.4" cy="63.4" r="0.7"/><circle cx="85.4" cy="63.4" r="0.7"/></g>
    <path d="M 80 76 L 80 128" stroke="#1a0c06" stroke-width="2.2"/>
    <path d="M 80 128 L 79 136 L 81 136 Z" fill="#1a0c06"/>
    <path d="M 80 136 c 0 4 1 6 0 10" stroke="#a0101a" stroke-width="1.6" fill="none"/>
    <circle cx="80" cy="150" r="1.6" fill="#a0101a"/>
    </svg>
  `,

  // ─── Giant Shrew ─────────────────────────────────────────────────────────
  // Starved and fast: a dog-sized shrew, all ribs and wire fur, a long
  // twitching snout, red-tinged teeth, tiny black eyes that never stop moving.
  'Giant Shrew': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Giant Shrew: a starved dog-sized shrew, ribs showing through wiry fur, a long twitching snout pulled back from red-stained teeth, tiny black eyes">
    <defs>
      ${horrorSkinFilter('hgs-fur', { freq: '0.6 0.12', scale: 2.4, seed: 154, k: 1.3 })}
      <linearGradient id="hgs-body" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="#7a6a58"/><stop offset="0.6" stop-color="#3a3026"/><stop offset="1" stop-color="#14100c"/></linearGradient>
      <linearGradient id="hgs-snout" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5a4a3e"/><stop offset="1" stop-color="#c89a8a"/></linearGradient>
    </defs>
    <ellipse cx="80" cy="150" rx="66" ry="5" fill="#000" opacity="0.6"/>
    <!-- the naked tail -->
    <path d="M 24 128 C 12 132, 6 142, 2 156" stroke="#b08a7a" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M 18 130 l 2 3 M 12 136 l 2 3 M 8 142 l 2 3" stroke="#6a4a3a" stroke-width="0.8"/>
    <!-- the starved body, ribs through the fur -->
    <path d="M 22 132 C 18 108, 34 88, 62 84 C 86 80, 108 86, 118 100 C 124 114, 120 132, 112 140 L 30 142 Z" fill="url(#hgs-body)" filter="url(#hgs-fur)"/>
    <path d="M 52 96 Q 56 112 52 128 M 62 94 Q 66 112 62 130 M 72 94 Q 76 112 72 130 M 82 94 Q 86 112 82 130" stroke="#14100c" stroke-width="1.6" fill="none" opacity="0.8"/>
    <path d="M 34 96 l -4 -8 M 44 90 l -2 -9 M 56 86 l 0 -8 M 68 84 l 2 -8" stroke="#8a7a68" stroke-width="1.2"/>
    <!-- legs, long-clawed -->
    <path d="M 36 138 L 32 150 M 46 140 L 44 150 M 100 138 L 104 150 M 110 136 L 116 148" stroke="#3a3026" stroke-width="4" stroke-linecap="round"/>
    <path d="M 30 150 l -4 2 M 32 150 l -1 4 M 102 150 l 1 4 M 104 150 l 4 2 M 114 148 l 4 2 M 116 148 l 2 4" stroke="#e8dcc8" stroke-width="1.2"/>
    <!-- the head: long snout pulled back from the teeth, tiny eyes -->
    <path d="M 104 92 C 110 80, 124 74, 136 76 C 148 78, 156 84, 158 92 C 150 98, 140 104, 124 106 C 114 106, 106 100, 104 92 Z" fill="url(#hgs-body)" filter="url(#hgs-fur)"/>
    <path d="M 136 80 C 146 82, 154 86, 158 92" stroke="url(#hgs-snout)" stroke-width="5" fill="none" stroke-linecap="round"/>
    <circle cx="158" cy="92" r="2.6" fill="#3a1a14"/>
    <path d="M 156 88 l 4 -6 M 156 90 l 4 -2 M 156 94 l 4 2" stroke="#d8ccb8" stroke-width="0.5"/>
    <circle cx="126" cy="84" r="2" fill="#000"/><circle cx="125.4" cy="83.4" r="0.6" fill="#fff"/>
    <path d="M 118 74 C 116 66, 122 64, 124 70 Z" fill="#5a4a3e"/>
    <path d="M 132 98 C 140 100, 150 98, 156 94 C 148 104, 136 106, 126 104 Z" fill="#2a0406"/>
    <g>${needleTeeth(134, 154, 97.4, 8, 3.2, 1, '#e8c8b0', 0.3)}</g>
    <path d="M 140 100 c 0 3 1 5 0 7" stroke="#8a1018" stroke-width="1" fill="none"/>
    </svg>
  `,

  // ─── Bugbear ─────────────────────────────────────────────────────────────
  // A hulking, matted goblin-giant stepping out of the shadows: a bear's
  // ears, a dog's muzzle, yellow eyes, a nail-studded morningstar raised.
  'Bugbear': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Bugbear: a hulking matted furred brute stepping from the shadows, bear's ears, a long muzzle of teeth, yellow eyes, a spiked morningstar raised overhead">
    <defs>
      ${horrorSkinFilter('hbb-fur', { freq: '0.5 0.14', scale: 2.6, seed: 155, k: 1.3 })}
      <linearGradient id="hbb-body" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="#6a4a28"/><stop offset="0.6" stop-color="#3a2410"/><stop offset="1" stop-color="#120a04"/></linearGradient>
      <radialGradient id="hbb-eye" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff8c0"/><stop offset="0.4" stop-color="#e8b020"/><stop offset="1" stop-color="#604000" stop-opacity="0"/></radialGradient>
      <linearGradient id="hbb-shadow" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity="0.85"/><stop offset="0.45" stop-color="#000" stop-opacity="0"/></linearGradient>
    </defs>
    <!-- the morningstar, raised -->
    <path d="M 112 70 L 136 22" stroke="#3a2410" stroke-width="5" stroke-linecap="round"/>
    <circle cx="138" cy="16" r="11" fill="#2a2420" stroke="#0a0806" stroke-width="0.8"/>
    <g fill="#8a8078">${Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * Math.PI * 2; return `<path d="M ${(138 + Math.cos(a) * 9).toFixed(1)} ${(16 + Math.sin(a) * 9).toFixed(1)} L ${(138 + Math.cos(a) * 17).toFixed(1)} ${(16 + Math.sin(a) * 17).toFixed(1)} L ${(138 + Math.cos(a + 0.3) * 9).toFixed(1)} ${(16 + Math.sin(a + 0.3) * 9).toFixed(1)} Z"/>`; }).join('')}</g>
    <path d="M 132 26 c 0 4 1 6 0 9" stroke="#7a0a10" stroke-width="1.4" fill="none"/>
    <!-- the hulking body -->
    <path d="M 30 160 C 28 120, 40 84, 66 74 L 100 74 C 122 84, 132 120, 130 160 Z" fill="url(#hbb-body)" filter="url(#hbb-fur)"/>
    <path d="M 44 100 L 118 140 M 40 112 L 116 152" stroke="#1a0c04" stroke-width="5" opacity="0.8"/>
    <circle cx="80" cy="120" r="4" fill="#6a6a70"/>
    <path d="M 106 80 C 116 74, 118 66, 114 60" stroke="url(#hbb-body)" stroke-width="12" fill="none" stroke-linecap="round" filter="url(#hbb-fur)"/>
    <path d="M 44 92 C 30 104, 24 120, 26 136" stroke="url(#hbb-body)" stroke-width="12" fill="none" stroke-linecap="round" filter="url(#hbb-fur)"/>
    <path d="M 20 138 l -4 6 M 24 140 l -2 7 M 30 140 l 0 7 M 34 138 l 3 6" stroke="#e8dcc0" stroke-width="2" stroke-linecap="round"/>
    <!-- the head: bear's ears, a long toothy muzzle, yellow eyes -->
    <path d="M 56 34 C 48 24, 50 14, 58 12 C 64 18, 66 26, 64 32 Z M 104 34 C 112 24, 110 14, 102 12 C 96 18, 94 26, 96 32 Z" fill="url(#hbb-body)" filter="url(#hbb-fur)"/>
    <path d="M 54 46 C 52 28, 66 20, 80 20 C 94 20, 108 28, 106 46 C 104 62, 96 76, 80 78 C 64 76, 56 62, 54 46 Z" fill="url(#hbb-body)" filter="url(#hbb-fur)"/>
    <path d="M 62 42 Q 70 36 77 44 M 83 44 Q 90 36 98 42" stroke="#0a0602" stroke-width="2.6" fill="none"/>
    <ellipse cx="70" cy="46" rx="4" ry="2.8" fill="url(#hbb-eye)"/><ellipse cx="90" cy="46" rx="4" ry="2.8" fill="url(#hbb-eye)"/>
    <path d="M 70 56 C 70 52, 90 52, 90 56 C 90 60, 70 60, 70 56 Z" fill="#1a0c04"/>
    <path d="M 64 64 Q 80 76 96 64 Q 80 70 64 64 Z" fill="#100604"/>
    <g>${needleTeeth(66, 94, 64.6, 10, 4, 1, '#ece0c0', 0.3)}</g>
    <path d="M 68 64 L 66 72 L 70 66 Z M 92 64 L 94 72 L 90 66 Z" fill="#ece0c0"/>
    <!-- stepping out of the shadows -->
    <rect x="0" y="0" width="160" height="160" fill="url(#hbb-shadow)"/>
    </svg>
  `,

  // ─── Draugr ──────────────────────────────────────────────────────────────
  // The barrow-dead of the North: swollen blue-black (hel-blár) and
  // corpse-pale, burst grave-clothes, a rusted sword, eyes like frost.
  'Draugr': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Draugr: a swollen blue-black corpse bursting its rotted grave-clothes, beard and hair still on it, frost-white eyes, a rusted sword in a log-thick arm">
    <defs>
      ${horrorSkinFilter('hdg2-skin', { freq: '0.16 0.2', scale: 2.4, seed: 156, k: 1.3 })}
      ${horrorSkinFilter('hdg2-cloth', { freq: '0.06 0.4', scale: 1.6, seed: 157, k: 1.1 })}
      <radialGradient id="hdg2-flesh" cx="45%" cy="35%" r="70%"><stop offset="0" stop-color="#4e5a68"/><stop offset="0.6" stop-color="#1e2632"/><stop offset="1" stop-color="#06080e"/></radialGradient>
      <linearGradient id="hdg2-rags" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a5040"/><stop offset="1" stop-color="#1a160e"/></linearGradient>
      <radialGradient id="hdg2-eye" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffffff"/><stop offset="0.5" stop-color="#c0e0ff"/><stop offset="1" stop-color="#4080c0" stop-opacity="0"/></radialGradient>
      <linearGradient id="hdg2-rust" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8a5a30"/><stop offset="1" stop-color="#3a2010"/></linearGradient>
    </defs>
    <ellipse cx="80" cy="154" rx="56" ry="5" fill="#000" opacity="0.6"/>
    <!-- the rusted sword -->
    <path d="M 128 150 L 140 40 L 146 40 L 136 150 Z" fill="url(#hdg2-rust)"/>
    <path d="M 126 150 L 140 150" stroke="#2a1a0a" stroke-width="4"/>
    <path d="M 142 60 l 3 2 M 140 84 l 3 1 M 138 108 l 3 2" stroke="#1a0c04" stroke-width="1.6"/>
    <!-- the swollen body bursting its grave-clothes -->
    <path d="M 30 156 C 24 118, 36 82, 64 72 L 98 72 C 124 82, 136 118, 130 156 Z" fill="url(#hdg2-flesh)" filter="url(#hdg2-skin)"/>
    <path d="M 30 156 C 28 132, 34 110, 46 100 L 60 120 L 52 156 Z M 130 156 C 132 132, 126 110, 114 100 L 100 120 L 108 156 Z M 60 74 L 70 100 L 80 86 L 90 100 L 100 74 Z" fill="url(#hdg2-rags)" filter="url(#hdg2-cloth)"/>
    <path d="M 64 110 C 72 104, 88 104, 96 110 M 62 122 C 74 116, 86 116, 98 122" stroke="#0a0e18" stroke-width="1.6" fill="none" opacity="0.7"/>
    <g fill="#8a9ab0" opacity="0.5"><circle cx="70" cy="132" r="3"/><circle cx="92" cy="128" r="2.4"/><circle cx="82" cy="140" r="2"/></g>
    <!-- log-thick arms -->
    <path d="M 108 84 C 124 94, 132 110, 136 124" stroke="url(#hdg2-flesh)" stroke-width="14" fill="none" stroke-linecap="round" filter="url(#hdg2-skin)"/>
    <path d="M 52 84 C 36 96, 28 116, 26 134" stroke="url(#hdg2-flesh)" stroke-width="14" fill="none" stroke-linecap="round" filter="url(#hdg2-skin)"/>
    <path d="M 20 136 l -4 6 M 24 138 l -2 7 M 30 138 l 0 7" stroke="#c8ccd0" stroke-width="2" stroke-linecap="round"/>
    <!-- the head: bloated, frost-eyed, beard and hair still on it -->
    <g stroke="#2a2418" stroke-width="2.2" fill="none" stroke-linecap="round" opacity="0.95">
      <path d="M 58 28 C 52 44, 50 60, 52 80"/><path d="M 56 34 C 48 50, 46 66, 48 84"/><path d="M 60 24 C 54 38, 54 52, 56 66"/>
      <path d="M 102 28 C 108 44, 110 60, 108 80"/><path d="M 104 34 C 112 50, 114 66, 112 84"/><path d="M 100 24 C 106 38, 106 52, 104 66"/>
    </g>
    <path d="M 56 44 C 54 24, 66 14, 80 14 C 94 14, 106 24, 104 44 C 104 58, 96 68, 80 70 C 64 68, 56 58, 56 44 Z" fill="url(#hdg2-flesh)" filter="url(#hdg2-skin)"/>
    <path d="M 58 26 C 64 14, 96 14, 102 26 C 94 20, 66 20, 58 26 Z" fill="#2a2418"/>
    <ellipse cx="70" cy="42" rx="5" ry="3.6" fill="url(#hdg2-eye)"/><ellipse cx="90" cy="42" rx="5" ry="3.6" fill="url(#hdg2-eye)"/>
    <path d="M 64 36 Q 70 33 76 37 M 84 37 Q 90 33 96 36" stroke="#0a0e18" stroke-width="2" fill="none"/>
    <path d="M 62 56 C 64 74, 72 86, 80 92 C 88 86, 96 74, 98 56 C 92 62, 68 62, 62 56 Z" fill="#3a3020" filter="url(#hdg2-cloth)"/>
    <path d="M 70 54 C 72 48, 88 48, 90 54 C 90 62, 84 66, 80 66 C 76 66, 70 62, 70 54 Z" fill="#06080c"/>
    <g>${needleTeeth(72, 88, 51.6, 6, 2.6, 1, '#b8b098', 0.4)}</g>
    </svg>
  `,

  // ─── Fetch ───────────────────────────────────────────────────────────────
  // Your double, met before you die: your cloak, your light, your face, but
  // the skin is cracking like an old mirror and behind the cracks is black.
  'Fetch': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Fetch: your exact double holding up a pale light, your own face but with flat painted eyes, its skin cracking like an old mirror with blackness behind">
    <defs>
      ${horrorSkinFilter('hft-skin', { freq: '0.18 0.22', scale: 1.4, seed: 158, k: 1.1 })}
      ${horrorSkinFilter('hft-cloth', { freq: '0.05 0.36', scale: 1.6, seed: 159, k: 1.1 })}
      <linearGradient id="hft-cloak" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a3440"/><stop offset="1" stop-color="#06080a"/></linearGradient>
      <radialGradient id="hft-face" cx="45%" cy="35%" r="70%"><stop offset="0" stop-color="#e4dcd2"/><stop offset="0.7" stop-color="#9a9088"/><stop offset="1" stop-color="#4a4440"/></radialGradient>
      <radialGradient id="hft-light" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#e8f4ff" stop-opacity="0.85"/><stop offset="1" stop-color="#6a8ab0" stop-opacity="0"/></radialGradient>
    </defs>
    <ellipse cx="80" cy="152" rx="40" ry="5" fill="#000" opacity="0.6"/>
    <path d="M 52 54 C 44 84, 40 118, 38 152 L 122 152 C 120 118, 116 84, 108 54 C 98 46, 62 46, 52 54 Z" fill="url(#hft-cloak)" filter="url(#hft-cloth)"/>
    <path d="M 106 64 C 118 70, 124 80, 126 90 L 120 92 C 116 82, 110 76, 102 72 Z" fill="url(#hft-cloak)"/>
    <circle cx="124" cy="96" r="20" fill="url(#hft-light)"/>
    <path d="M 120 92 L 128 92 L 127 102 L 121 102 Z" fill="#c8d8e8" stroke="#3a4a5a" stroke-width="0.6"/>
    <!-- your face, the eyes flat as paint, cracking like a mirror -->
    <path d="M 64 34 C 62 18, 70 10, 80 10 C 90 10, 98 18, 96 34 C 96 46, 90 56, 80 58 C 70 56, 64 46, 64 34 Z" fill="url(#hft-face)" filter="url(#hft-skin)"/>
    <path d="M 64 22 C 68 12, 92 12, 96 22 C 90 16, 70 16, 64 22 Z" fill="#2a1e14"/>
    <ellipse cx="72" cy="32" rx="4.6" ry="2.8" fill="#8a929a"/><ellipse cx="88" cy="32" rx="4.6" ry="2.8" fill="#8a929a"/>
    <ellipse cx="72" cy="32" rx="1.6" ry="1.6" fill="#5a626a"/><ellipse cx="88" cy="32" rx="1.6" ry="1.6" fill="#5a626a"/>
    <path d="M 80 34 L 78 42 L 82 42" stroke="#5a5450" stroke-width="1" fill="none"/>
    <path d="M 72 48 Q 80 53 88 48" stroke="#5a3a34" stroke-width="1.4" fill="none"/>
    <!-- the cracks, with black behind them; a shard already fallen -->
    <path d="M 66 20 L 74 30 L 70 40 L 78 50 M 74 30 L 84 26 L 94 34 M 84 26 L 88 14 M 70 40 L 64 44" stroke="#000" stroke-width="1.6" fill="none"/>
    <path d="M 66 20 L 74 30 L 70 40 L 78 50 M 74 30 L 84 26 L 94 34 M 84 26 L 88 14" stroke="#ffffff" stroke-width="0.4" fill="none" opacity="0.7"/>
    <path d="M 84 26 L 94 34 L 90 40 L 82 34 Z" fill="#000"/>
    <path d="M 100 130 l 6 -3 l 2 5 l -5 3 Z" fill="url(#hft-face)" opacity="0.9"/>
    </svg>
  `,

  // ─── Bone Vortex ─────────────────────────────────────────────────────────
  // A whirl of real bones, yellowed and gnawed, spiralling into a great
  // skull built of skulls at its heart; dust and splinters on the wind.
  'Bone Vortex': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Bone Vortex: a storm of yellowed gnawed bones spiralling inward to a great skull built of many skulls, dust and splinters on the wind">
    <defs>
      ${horrorSkinFilter('hbv-bone', { freq: '0.24 0.3', scale: 1.8, seed: 160, k: 1.25 })}
      <radialGradient id="hbv-heart" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#1a1408"/><stop offset="0.6" stop-color="#0a0804" stop-opacity="0.8"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
      <radialGradient id="hbv-skull" cx="40%" cy="35%" r="65%"><stop offset="0" stop-color="#ece0c0"/><stop offset="0.7" stop-color="#9a8a64"/><stop offset="1" stop-color="#4a3e28"/></radialGradient>
    </defs>
    <circle cx="80" cy="80" r="78" fill="url(#hbv-heart)"/>
    <g filter="url(#hbv-bone)" stroke-linecap="round" fill="none">
      ${Array.from({ length: 44 }, (_, i) => {
        const a = i * 0.58, r = 16 + i * 1.45, x = 80 + Math.cos(a) * r, y = 82 + Math.sin(a) * r * 0.8;
        const len = 5 + (i % 5) * 2.2, ang = a + Math.PI / 2 + 0.3;
        const dx = Math.cos(ang) * len, dy = Math.sin(ang) * len * 0.8;
        return `<path d="M ${(x - dx).toFixed(1)} ${(y - dy).toFixed(1)} L ${(x + dx).toFixed(1)} ${(y + dy).toFixed(1)}" stroke="${i % 3 ? '#c8b890' : '#a89870'}" stroke-width="${(2.4 + (i % 3)).toFixed(1)}"/><circle cx="${(x + dx).toFixed(1)}" cy="${(y + dy).toFixed(1)}" r="${(1.6 + (i % 3) * 0.5).toFixed(1)}" fill="#c8b890" stroke="none"/>`;
      }).join('')}
    </g>
    <!-- skulls caught in the whirl -->
    ${[[30, 50, 0.5, -20], [128, 44, 0.45, 25], [136, 116, 0.5, 15], [26, 118, 0.42, -30]].map(([x, y, s, r]) => `
      <g transform="translate(${x} ${y}) rotate(${r}) scale(${s})" filter="url(#hbv-bone)">
        <path d="M -14 0 C -14 -14, 14 -14, 14 0 L 10 10 L -10 10 Z" fill="url(#hbv-skull)"/>
        <circle cx="-5" cy="0" r="3.4" fill="#0a0804"/><circle cx="5" cy="0" r="3.4" fill="#0a0804"/>
      </g>`).join('')}
    <!-- the great skull at the heart, built of skulls -->
    <g filter="url(#hbv-bone)">
      <path d="M 54 82 C 52 58, 64 46, 80 46 C 96 46, 108 58, 106 82 L 98 100 L 62 100 Z" fill="url(#hbv-skull)"/>
      <path d="M 62 100 L 66 112 L 94 112 L 98 100 Z" fill="#a89870"/>
    </g>
    <g fill="#0a0804"><ellipse cx="70" cy="78" rx="7" ry="8"/><ellipse cx="90" cy="78" rx="7" ry="8"/><path d="M 80 86 L 76 96 L 84 96 Z"/></g>
    <g stroke="#6a5a3e" stroke-width="0.8" fill="none" opacity="0.8">
      <path d="M 64 56 Q 72 62 70 70 M 96 56 Q 88 62 90 70 M 80 48 L 80 64"/>
      <circle cx="62" cy="62" r="4"/><circle cx="98" cy="62" r="4"/><circle cx="80" cy="56" r="3.4"/>
    </g>
    <path d="M 68 100 l 2 10 M 74 100 l 1 10 M 80 100 l 0 10 M 86 100 l -1 10 M 92 100 l -2 10" stroke="#3a2e18" stroke-width="1"/>
    <g fill="#c8b890" opacity="0.5">${Array.from({ length: 30 }, (_, i) => `<circle cx="${(10 + (i * 47) % 140).toFixed(0)}" cy="${(10 + (i * 61) % 140).toFixed(0)}" r="0.8"/>`).join('')}</g>
    </svg>
  `,

  // ─── Sanguinid ───────────────────────────────────────────────────────────
  // A bloated, translucent leech-thing heaving up from black water, veins of
  // swallowed blood glowing through it, a ring of fangs, tentacles writhing.
  'Sanguinid': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Sanguinid: a bloated translucent leech-like horror heaving up from black water, veins of swallowed blood glowing through its skin, a ring of fangs, tentacles writhing">
    <defs>
      ${wetSkinFilter('hsg-skin', { freq: '0.1 0.16', seed: 161, shine: 0.45 })}
      <radialGradient id="hsg-body" cx="45%" cy="35%" r="70%"><stop offset="0" stop-color="#c8a0a0" stop-opacity="0.95"/><stop offset="0.5" stop-color="#7a2a34"/><stop offset="1" stop-color="#1a0408"/></radialGradient>
      <radialGradient id="hsg-maw" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#0a0000"/><stop offset="0.7" stop-color="#5a0008"/><stop offset="1" stop-color="#c04050"/></radialGradient>
      <linearGradient id="hsg-water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#101418"/><stop offset="1" stop-color="#020304"/></linearGradient>
      <filter id="hsg-gl" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <ellipse cx="80" cy="140" rx="80" ry="20" fill="url(#hsg-water)"/>
    <path d="M 20 136 Q 50 130 80 136 Q 110 130 140 136" stroke="#5a6a70" stroke-width="0.8" fill="none" opacity="0.6"/>
    <!-- tentacles writhing out of the water -->
    <g fill="none" stroke-linecap="round" filter="url(#hsg-skin)">
      <path d="M 40 132 C 24 120, 14 100, 20 80 C 24 70, 30 72, 28 80" stroke="#6a1a24" stroke-width="7"/>
      <path d="M 120 132 C 136 120, 146 100, 140 80 C 136 70, 130 72, 132 80" stroke="#6a1a24" stroke-width="7"/>
      <path d="M 56 138 C 44 146, 30 150, 14 148" stroke="#5a1420" stroke-width="5"/>
      <path d="M 104 138 C 116 146, 130 150, 146 148" stroke="#5a1420" stroke-width="5"/>
    </g>
    <!-- the bloated body heaving up -->
    <path d="M 36 136 C 30 100, 44 56, 80 44 C 116 56, 130 100, 124 136 Z" fill="url(#hsg-body)" filter="url(#hsg-skin)"/>
    <!-- veins of swallowed blood glowing through the skin -->
    <g stroke="#ff3040" stroke-width="1.2" fill="none" opacity="0.75" filter="url(#hsg-gl)">
      <path d="M 60 130 C 56 110, 64 90, 62 70"/><path d="M 80 132 C 82 110, 76 90, 80 64"/><path d="M 100 130 C 104 110, 96 90, 98 70"/>
      <path d="M 62 100 C 70 96, 74 100, 80 96 M 80 110 C 88 106, 92 110, 100 106"/>
    </g>
    <!-- the round maw at its crown, ringed with fangs -->
    <ellipse cx="80" cy="64" rx="18" ry="14" fill="url(#hsg-maw)"/>
    <g fill="#f0e4d0">
      ${Array.from({ length: 14 }, (_, i) => { const a = (i / 14) * Math.PI * 2, x = 80 + Math.cos(a) * 16, y = 64 + Math.sin(a) * 12.4, ix = 80 + Math.cos(a) * 9, iy = 64 + Math.sin(a) * 7; return `<path d="M ${(x + Math.sin(a) * 1.8).toFixed(1)} ${(y - Math.cos(a) * 1.8).toFixed(1)} L ${ix.toFixed(1)} ${iy.toFixed(1)} L ${(x - Math.sin(a) * 1.8).toFixed(1)} ${(y + Math.cos(a) * 1.8).toFixed(1)} Z"/>`; }).join('')}
    </g>
    <path d="M 66 76 c -1 6 0 10 -2 14 M 92 76 c 1 5 0 9 2 12" stroke="#a01020" stroke-width="1.6" fill="none"/>
    <g fill="#ffd0d0" opacity="0.5"><circle cx="58" cy="84" r="1.4"/><circle cx="104" cy="90" r="1.2"/></g>
    </svg>
  `,

  // ─── Titanoboa ───────────────────────────────────────────────────────────
  // Coils as thick as a barrel, scale over scale, filling the passage; a head
  // the size of a horse rearing over you, tongue tasting the air.
  'Titanoboa': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Titanoboa: a colossal snake, coils as thick as barrels filling the passage, its huge head rearing with the tongue out, cold slit eyes">
    <defs>
      ${horrorSkinFilter('hto-hide', { freq: '0.18 0.22', scale: 2.2, seed: 170, k: 1.25 })}
      ${scalePattern('hto-sc', 3.4, '#0c1006', '#9aa060')}
      <linearGradient id="hto-body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6a6a34"/><stop offset="0.5" stop-color="#3a3a18"/><stop offset="1" stop-color="#121206"/></linearGradient>
      <linearGradient id="hto-belly" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c8b880"/><stop offset="1" stop-color="#6a5a30"/></linearGradient>
      <radialGradient id="hto-eye" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff2a0"/><stop offset="0.5" stop-color="#c8a020"/><stop offset="1" stop-color="#3a2a00"/></radialGradient>
    </defs>
    <ellipse cx="80" cy="152" rx="76" ry="6" fill="#000" opacity="0.6"/>
    <!-- the coils, stacked and sliding -->
    <g filter="url(#hto-hide)">
      <path d="M 2 150 C 20 120, 60 116, 80 132 C 100 148, 140 146, 158 124 L 158 150 Z" fill="url(#hto-body)"/>
      <path d="M 4 124 C 30 100, 70 100, 92 114 C 114 128, 140 118, 156 100" stroke="url(#hto-body)" stroke-width="22" fill="none" stroke-linecap="round"/>
      <path d="M 10 96 C 34 80, 66 84, 84 96" stroke="url(#hto-body)" stroke-width="20" fill="none" stroke-linecap="round"/>
    </g>
    <path d="M 2 150 C 20 120, 60 116, 80 132 C 100 148, 140 146, 158 124 L 158 150 Z" fill="url(#hto-sc)" opacity="0.55"/>
    <path d="M 4 124 C 30 100, 70 100, 92 114 C 114 128, 140 118, 156 100" stroke="url(#hto-sc)" stroke-width="22" fill="none" opacity="0.5"/>
    <path d="M 14 132 C 36 114, 64 114, 86 126" stroke="url(#hto-belly)" stroke-width="5" fill="none" opacity="0.6"/>
    <g fill="#1a1a08" opacity="0.6">${[[30, 112], [52, 106], [74, 110], [104, 128], [128, 124], [40, 92], [62, 88]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="6" ry="3.4"/>`).join('')}</g>
    <!-- the neck rising, and the head -->
    <path d="M 84 96 C 100 84, 108 66, 104 46" stroke="url(#hto-body)" stroke-width="18" fill="none" stroke-linecap="round" filter="url(#hto-hide)"/>
    <path d="M 84 96 C 100 84, 108 66, 104 46" stroke="url(#hto-belly)" stroke-width="6" fill="none" opacity="0.6"/>
    <path d="M 88 46 C 84 28, 96 14, 114 14 C 132 14, 146 26, 144 40 C 142 52, 128 58, 112 58 C 98 58, 90 54, 88 46 Z" fill="url(#hto-body)" filter="url(#hto-hide)"/>
    <path d="M 88 46 C 84 28, 96 14, 114 14 C 132 14, 146 26, 144 40 C 142 52, 128 58, 112 58 C 98 58, 90 54, 88 46 Z" fill="url(#hto-sc)" opacity="0.45"/>
    <ellipse cx="104" cy="30" rx="4.6" ry="3.4" fill="url(#hto-eye)"/><ellipse cx="128" cy="30" rx="4.6" ry="3.4" fill="url(#hto-eye)"/>
    <path d="M 104 27 l 0 6 M 128 27 l 0 6" stroke="#000" stroke-width="1.6"/>
    <path d="M 98 26 Q 104 22 110 26 M 122 26 Q 128 22 134 26" stroke="#0c0c04" stroke-width="1.6" fill="none"/>
    <circle cx="110" cy="44" r="1" fill="#000"/><circle cx="120" cy="44" r="1" fill="#000"/>
    <path d="M 100 52 Q 115 58 130 52" stroke="#0c0c04" stroke-width="1.4" fill="none"/>
    <path d="M 115 56 L 115 70 L 110 78 M 115 70 L 120 78" stroke="#8a1018" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    </svg>
  `,

  // ─── Djinn ───────────────────────────────────────────────────────────────
  // A towering blue spirit of storm and sand, bound in gold, a ruby blazing
  // in its brow, its lower body a howling twist of smoke.
  'Djinn': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Djinn: a towering blue-skinned spirit bound in gold, a blazing ruby in its brow, its lower body a howling tail of smoke and stinging sand">
    <defs>
      ${horrorSkinFilter('hdj-skin', { freq: '0.16 0.2', scale: 1.8, seed: 171, k: 1.2 })}
      <linearGradient id="hdj-body" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="#4a7ac0"/><stop offset="0.6" stop-color="#1a3a70"/><stop offset="1" stop-color="#081430"/></linearGradient>
      <linearGradient id="hdj-smoke" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a6a9a" stop-opacity="0.9"/><stop offset="1" stop-color="#c8a870" stop-opacity="0"/></linearGradient>
      <linearGradient id="hdj-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe08a"/><stop offset="1" stop-color="#8a5a10"/></linearGradient>
      <radialGradient id="hdj-ruby" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff0f0"/><stop offset="0.35" stop-color="#ff2030"/><stop offset="1" stop-color="#600008" stop-opacity="0"/></radialGradient>
      <radialGradient id="hdj-eye" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffffff"/><stop offset="0.5" stop-color="#a0e0ff"/><stop offset="1" stop-color="#2060a0" stop-opacity="0"/></radialGradient>
    </defs>
    <!-- the smoke tail and the sand it carries -->
    <path d="M 60 96 C 50 120, 76 134, 64 160 L 100 160 C 92 140, 110 124, 100 96 Z" fill="url(#hdj-smoke)"/>
    <path d="M 64 110 C 84 118, 70 132, 88 140 M 96 104 C 80 116, 98 128, 82 150" stroke="#c8d8f0" stroke-width="1.2" fill="none" opacity="0.4"/>
    <g fill="#d8c090" opacity="0.6">${Array.from({ length: 40 }, (_, i) => { const h = (n) => Math.abs(Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1; return `<circle cx="${(20 + h(1) * 120).toFixed(0)}" cy="${(90 + h(2) * 70).toFixed(0)}" r="${(0.5 + h(3)).toFixed(1)}"/>`; }).join('')}</g>
    <!-- the torso, arms crossed and bound in gold -->
    <path d="M 46 58 C 42 80, 52 98, 62 104 L 98 104 C 108 98, 118 80, 114 58 C 104 48, 56 48, 46 58 Z" fill="url(#hdj-body)" filter="url(#hdj-skin)"/>
    <path d="M 40 62 C 26 74, 30 92, 52 92 L 108 92 C 130 92, 134 74, 120 62" stroke="url(#hdj-body)" stroke-width="12" fill="none" stroke-linecap="round" filter="url(#hdj-skin)"/>
    <path d="M 32 78 l 0 10 M 128 78 l 0 10" stroke="url(#hdj-gold)" stroke-width="6"/>
    <path d="M 56 98 L 104 98" stroke="url(#hdj-gold)" stroke-width="4"/>
    <path d="M 62 66 Q 80 72 98 66 M 64 78 Q 80 84 96 78" stroke="#081430" stroke-width="1.2" fill="none" opacity="0.6"/>
    <!-- the head: topknot, ruby, glaring white eyes, a cruel smile -->
    <path d="M 64 32 C 62 16, 70 8, 80 8 C 90 8, 98 16, 96 32 C 96 44, 90 52, 80 54 C 70 52, 64 44, 64 32 Z" fill="url(#hdj-body)" filter="url(#hdj-skin)"/>
    <path d="M 80 8 C 76 0, 84 -2, 86 4 C 90 0, 92 6, 86 10 Z" fill="#0a0a14"/>
    <circle cx="80" cy="19" r="4.4" fill="url(#hdj-ruby)"/>
    <path d="M 66 28 Q 72 24 78 30 M 82 30 Q 88 24 94 28" stroke="#000" stroke-width="2" fill="none"/>
    <ellipse cx="72" cy="31" rx="4" ry="2.4" fill="url(#hdj-eye)"/><ellipse cx="88" cy="31" rx="4" ry="2.4" fill="url(#hdj-eye)"/>
    <path d="M 70 44 Q 80 50 90 44 Q 80 46 70 44 Z" fill="#000"/>
    <path d="M 70 44 L 72 47 L 74 44 L 76 47 L 78 44 L 80 47 L 82 44 L 84 47 L 86 44 L 88 47 L 90 44" stroke="#f0f0f0" stroke-width="0.6" fill="none"/>
    <path d="M 58 8 C 52 12, 50 20, 54 26 M 102 8 C 108 12, 110 20, 106 26" stroke="url(#hdj-gold)" stroke-width="2.4" fill="none"/>
    </svg>
  `,

  // ─── Phoenix ─────────────────────────────────────────────────────────────
  // A great bird of living fire, wings from wall to wall, every feather a
  // tongue of flame, eyes like two small suns; ash and embers falling.
  'Phoenix': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Phoenix: a great bird of living fire, wings spread wall to wall, every feather a tongue of flame, eyes like two small suns, embers falling">
    <defs>
      <radialGradient id="hph-core" cx="50%" cy="45%" r="55%"><stop offset="0" stop-color="#fffbe0"/><stop offset="0.35" stop-color="#ffc040"/><stop offset="0.75" stop-color="#e04010"/><stop offset="1" stop-color="#400400" stop-opacity="0"/></radialGradient>
      <linearGradient id="hph-feather" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#8a1004"/><stop offset="0.5" stop-color="#ff6010"/><stop offset="1" stop-color="#ffe080"/></linearGradient>
      <radialGradient id="hph-eye" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffffff"/><stop offset="0.5" stop-color="#fff0a0"/><stop offset="1" stop-color="#ff8000" stop-opacity="0"/></radialGradient>
      <filter id="hph-gl" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <circle cx="80" cy="80" r="78" fill="url(#hph-core)" opacity="0.5"/>
    <!-- the wings: feathers of flame, fanned wall to wall -->
    <g filter="url(#hph-gl)">
      ${Array.from({ length: 9 }, (_, i) => { const a = -0.1 - i * 0.16, len = 70 - i * 3; const x = 64 + Math.cos(Math.PI - a) * len, y = 70 - Math.sin(Math.PI - a) * len * 0.9; return `<path d="M 66 74 Q ${(66 + x) / 2 - 6} ${(74 + y) / 2 - 10}, ${x.toFixed(1)} ${y.toFixed(1)} Q ${(66 + x) / 2 + 4} ${(74 + y) / 2 + 2}, 66 80 Z" fill="url(#hph-feather)" opacity="${(0.95 - i * 0.05).toFixed(2)}"/>`; }).join('')}
      ${Array.from({ length: 9 }, (_, i) => { const a = -0.1 - i * 0.16, len = 70 - i * 3; const x = 96 + Math.cos(a) * len, y = 70 + Math.sin(a) * len * 0.9; return `<path d="M 94 74 Q ${(94 + x) / 2 + 6} ${(74 + y) / 2 - 10}, ${x.toFixed(1)} ${y.toFixed(1)} Q ${(94 + x) / 2 - 4} ${(74 + y) / 2 + 2}, 94 80 Z" fill="url(#hph-feather)" opacity="${(0.95 - i * 0.05).toFixed(2)}"/>`; }).join('')}
    </g>
    <!-- the body, white-hot at the heart, and the tail of fire -->
    <path d="M 70 70 C 64 90, 70 110, 80 118 C 90 110, 96 90, 90 70 C 86 62, 74 62, 70 70 Z" fill="url(#hph-core)" filter="url(#hph-gl)"/>
    <path d="M 74 116 C 66 132, 58 144, 50 158 M 80 118 C 80 136, 78 148, 80 160 M 86 116 C 94 132, 102 144, 110 158" stroke="url(#hph-feather)" stroke-width="4" fill="none" stroke-linecap="round" filter="url(#hph-gl)"/>
    <!-- the head: a crest of flame, a hooked beak, eyes like suns -->
    <path d="M 72 52 C 70 40, 76 32, 80 32 C 84 32, 90 40, 88 52 C 86 60, 74 60, 72 52 Z" fill="#ff8020" filter="url(#hph-gl)"/>
    <path d="M 76 34 C 72 20, 78 10, 84 6 C 82 16, 88 22, 84 34 Z M 82 32 C 88 22, 96 20, 100 16 C 96 26, 92 30, 86 36 Z" fill="url(#hph-feather)" filter="url(#hph-gl)"/>
    <path d="M 78 52 L 80 62 L 82 52 Z" fill="#3a1004"/>
    <circle cx="76" cy="44" r="3" fill="url(#hph-eye)" filter="url(#hph-gl)"/><circle cx="84" cy="44" r="3" fill="url(#hph-eye)" filter="url(#hph-gl)"/>
    <g fill="#ffb040">${Array.from({ length: 24 }, (_, i) => `<circle cx="${(16 + (i * 41) % 128).toFixed(0)}" cy="${(100 + (i * 29) % 58).toFixed(0)}" r="${(0.7 + (i % 3) * 0.4).toFixed(1)}" opacity="0.7"/>`).join('')}</g>
    </svg>
  `,

  // ─── Unicorn ─────────────────────────────────────────────────────────────
  // Not a gentle thing: a war-horse of cold white, a spiral horn like a drawn
  // blade, eyes that have weighed you and not yet decided.
  'Unicorn': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Unicorn: a tall cold-white war-horse with a silver mane, a long spiral horn shining like a drawn blade, dark judging eyes, silver light around it">
    <defs>
      ${horrorSkinFilter('hun-coat', { freq: '0.3 0.12', scale: 1.4, seed: 172, k: 1.1 })}
      <radialGradient id="hun-light" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#e8f0ff" stop-opacity="0.45"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
      <linearGradient id="hun-coatg" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="0.6" stop-color="#c8ccd8"/><stop offset="1" stop-color="#6a7080"/></linearGradient>
      <linearGradient id="hun-horn" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#c8c0a0"/><stop offset="1" stop-color="#ffffff"/></linearGradient>
    </defs>
    <circle cx="80" cy="70" r="76" fill="url(#hun-light)"/>
    <ellipse cx="80" cy="154" rx="50" ry="5" fill="#000" opacity="0.5"/>
    <!-- the body, three-quarter, a war-horse's bulk -->
    <path d="M 40 96 C 40 78, 58 68, 80 70 L 118 74 C 134 78, 138 96, 128 108 C 118 116, 60 118, 48 112 Z" fill="url(#hun-coatg)" filter="url(#hun-coat)"/>
    <path d="M 52 110 L 48 152 L 58 152 L 60 112 Z M 70 114 L 70 152 L 80 152 L 78 114 Z M 112 112 L 114 152 L 124 152 L 120 110 Z M 124 106 L 132 150 L 140 148 L 130 104 Z" fill="url(#hun-coatg)" filter="url(#hun-coat)"/>
    <path d="M 46 150 l 14 0 l 0 4 l -14 0 Z M 68 150 l 14 0 l 0 4 l -14 0 Z M 112 150 l 14 0 l 0 4 l -14 0 Z" fill="#8a8a90"/>
    <path d="M 132 80 C 146 84, 150 100, 144 116 C 142 104, 138 94, 130 90 Z" fill="#e8ecf4" opacity="0.9"/>
    <!-- the neck and head, lowered, regarding you -->
    <path d="M 46 90 C 38 70, 40 48, 48 36 L 66 40 C 64 56, 66 72, 72 80 Z" fill="url(#hun-coatg)" filter="url(#hun-coat)"/>
    <path d="M 40 40 C 34 36, 28 40, 26 50 C 24 62, 30 70, 38 72 C 46 74, 54 66, 56 54 C 58 44, 50 36, 40 40 Z" fill="url(#hun-coatg)" filter="url(#hun-coat)"/>
    <path d="M 48 36 C 56 30, 66 34, 70 46 C 72 60, 70 74, 74 84" stroke="#e8ecf4" stroke-width="5" fill="none" opacity="0.9"/>
    <path d="M 52 34 C 60 28, 68 36, 72 50 M 56 34 C 66 32, 72 44, 74 60" stroke="#c8d0e0" stroke-width="2" fill="none"/>
    <!-- the horn, like a drawn blade -->
    <path d="M 38 40 L 20 2 L 44 38 Z" fill="url(#hun-horn)"/>
    <path d="M 40 36 L 37 30 M 36 30 L 33 24 M 33 22 L 30 16 M 30 14 L 27 9" stroke="#8a8270" stroke-width="1.2"/>
    <ellipse cx="44" cy="48" rx="3" ry="2.4" fill="#0a0a14"/><circle cx="43" cy="47" r="0.8" fill="#c8d8ff"/>
    <path d="M 40 44 Q 44 42 48 45" stroke="#6a7080" stroke-width="1" fill="none"/>
    <ellipse cx="30" cy="64" rx="2" ry="1.4" fill="#4a4a54"/>
    </svg>
  `,

  // ─── Frost Giant ─────────────────────────────────────────────────────────
  // Blue-white skin, a beard of icicles, black iron armour rimed with frost,
  // an axe of ice; your breath freezes as it ducks into view.
  'Frost Giant': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Frost Giant: a huge blue-white giant with a beard of icicles, black iron armour rimed with frost, pale cruel eyes, an axe of ice">
    <defs>
      ${horrorSkinFilter('hfg-skin', { freq: '0.16 0.2', scale: 2.2, seed: 173, k: 1.25 })}
      <radialGradient id="hfg-face" cx="45%" cy="35%" r="70%"><stop offset="0" stop-color="#d8e8f4"/><stop offset="0.6" stop-color="#7a98b0"/><stop offset="1" stop-color="#2a3a4a"/></radialGradient>
      <linearGradient id="hfg-iron" x1="0" y1="0" x2="0.5" y2="1"><stop offset="0" stop-color="#4a525a"/><stop offset="1" stop-color="#0a0c10"/></linearGradient>
      <linearGradient id="hfg-ice" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity="0.95"/><stop offset="1" stop-color="#6ab0e0" stop-opacity="0.8"/></linearGradient>
      <radialGradient id="hfg-eye" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffffff"/><stop offset="0.5" stop-color="#a0e0ff"/><stop offset="1" stop-color="#2080c0" stop-opacity="0"/></radialGradient>
    </defs>
    <!-- the ice axe -->
    <path d="M 132 158 L 140 30" stroke="#2a3038" stroke-width="5" stroke-linecap="round"/>
    <path d="M 136 34 C 154 24, 160 44, 156 64 C 150 56, 144 52, 134 52 Z M 140 34 C 124 22, 114 34, 112 50 C 120 46, 128 46, 136 50 Z" fill="url(#hfg-ice)" stroke="#a8d8f8" stroke-width="0.6"/>
    <!-- black iron armour rimed with frost -->
    <path d="M 10 160 C 12 118, 36 94, 80 92 C 124 94, 148 118, 150 160 Z" fill="url(#hfg-iron)"/>
    <path d="M 20 124 C 30 104, 52 96, 66 100 L 62 118 C 46 116, 30 120, 20 124 Z M 140 124 C 130 104, 108 96, 94 100 L 98 118 C 114 116, 130 120, 140 124 Z" fill="#3a4048" stroke="#a8c8e0" stroke-width="0.8"/>
    <g stroke="#d8eaf8" stroke-width="1" opacity="0.7"><path d="M 24 128 l 6 -4 M 32 120 l 4 -6 M 128 128 l -6 -4 M 120 120 l -4 -6 M 60 140 l 8 0 M 92 140 l 8 0"/></g>
    <!-- the head: blue-white, icicle beard, cold eyes -->
    <path d="M 54 50 C 50 28, 62 16, 80 16 C 98 16, 110 28, 106 50 C 106 66, 96 80, 80 82 C 64 80, 54 66, 54 50 Z" fill="url(#hfg-face)" filter="url(#hfg-skin)"/>
    <path d="M 54 32 C 60 14, 100 14, 106 32 C 96 22, 64 22, 54 32 Z" fill="#c8d8e8"/>
    <path d="M 60 40 L 77 46 M 83 46 L 100 40" stroke="#1a2a3a" stroke-width="3" fill="none" stroke-linecap="round"/>
    <ellipse cx="70" cy="48" rx="4.2" ry="2.6" fill="url(#hfg-eye)"/><ellipse cx="90" cy="48" rx="4.2" ry="2.6" fill="url(#hfg-eye)"/>
    <path d="M 78 52 L 76 62 L 82 62" stroke="#3a5060" stroke-width="1" fill="none"/>
    <!-- the beard of icicles -->
    <g fill="url(#hfg-ice)" stroke="#a8d8f8" stroke-width="0.4">
      ${Array.from({ length: 11 }, (_, i) => { const x = 60 + i * 4, len = 18 + ((i * 7) % 5) * 6; return `<path d="M ${x} 66 L ${x + 4} 66 L ${x + 2} ${66 + len} Z"/>`; }).join('')}
    </g>
    <path d="M 66 72 Q 80 66 94 72" stroke="#1a2a3a" stroke-width="1.8" fill="none"/>
    <g fill="#e8f4ff" opacity="0.7">${Array.from({ length: 34 }, (_, i) => { const h = (n) => Math.abs(Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1; return `<circle cx="${(6 + h(1) * 148).toFixed(0)}" cy="${(4 + h(2) * 110).toFixed(0)}" r="${(0.5 + h(3) * 1.1).toFixed(1)}"/>`; }).join('')}</g>
    </svg>
  `,

  // ─── Rust Monster ────────────────────────────────────────────────────────
  // A scuttling armoured insect the size of a hound, feathery antennae
  // quivering at the smell of your iron, rust flaking where it has fed.
  'Rust Monster': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Rust Monster: a hound-sized armoured insect with a plated rust-red shell, long feathery antennae reaching for your iron, rust flaking from a half-eaten sword">
    <defs>
      ${horrorSkinFilter('hrm-shell', { freq: '0.2 0.26', scale: 2.4, seed: 174, k: 1.3 })}
      <linearGradient id="hrm-body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b0582a"/><stop offset="0.6" stop-color="#6a2a10"/><stop offset="1" stop-color="#200a04"/></linearGradient>
      <linearGradient id="hrm-under" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a7050"/><stop offset="1" stop-color="#3a2a18"/></linearGradient>
    </defs>
    <ellipse cx="80" cy="150" rx="66" ry="6" fill="#000" opacity="0.6"/>
    <!-- a half-eaten sword, rusting to flakes -->
    <path d="M 14 148 L 54 128" stroke="#8a4a20" stroke-width="5" stroke-linecap="round"/>
    <path d="M 54 128 L 62 124" stroke="#4a3018" stroke-width="7"/>
    <g fill="#a0501c" opacity="0.8"><circle cx="22" cy="142" r="1.6"/><circle cx="30" cy="140" r="1.2"/><circle cx="18" cy="150" r="1.4"/><circle cx="40" cy="134" r="1"/></g>
    <!-- legs -->
    <g stroke="#3a1a08" stroke-width="3" fill="none" stroke-linecap="round">
      <path d="M 56 118 L 40 136 L 34 150"/><path d="M 70 122 L 62 140 L 60 152"/><path d="M 104 122 L 112 140 L 114 152"/><path d="M 118 118 L 132 136 L 138 150"/>
    </g>
    <!-- the plated body -->
    <path d="M 40 112 C 36 88, 56 72, 86 72 C 116 72, 136 88, 132 112 C 128 126, 48 126, 40 112 Z" fill="url(#hrm-body)" filter="url(#hrm-shell)"/>
    <path d="M 56 80 Q 86 70 118 82 M 50 92 Q 86 82 124 94 M 46 104 Q 86 94 128 106" stroke="#2a0e04" stroke-width="1.6" fill="none"/>
    <path d="M 46 116 C 60 124, 112 124, 126 116 C 112 120, 60 120, 46 116 Z" fill="url(#hrm-under)"/>
    <!-- the tail, ending in a paddle -->
    <path d="M 130 104 C 146 100, 154 88, 150 74" stroke="url(#hrm-body)" stroke-width="7" fill="none" stroke-linecap="round" filter="url(#hrm-shell)"/>
    <path d="M 150 74 C 158 70, 158 62, 150 60 C 144 64, 144 70, 150 74 Z" fill="#6a2a10"/>
    <!-- the head, low, and the feathery antennae reaching for you -->
    <path d="M 34 100 C 26 92, 28 80, 40 78 C 50 78, 54 88, 52 98 C 48 104, 40 104, 34 100 Z" fill="url(#hrm-body)" filter="url(#hrm-shell)"/>
    <g fill="#0a0402"><circle cx="38" cy="86" r="1.8"/><circle cx="42" cy="84" r="1.4"/><circle cx="46" cy="86" r="1.8"/><circle cx="40" cy="89" r="1.2"/><circle cx="45" cy="89" r="1.2"/></g>
    <g fill="#ffb070" opacity="0.8"><circle cx="37.6" cy="85.6" r="0.5"/><circle cx="45.6" cy="85.6" r="0.5"/></g>
    <path d="M 38 80 C 30 60, 20 46, 8 40 M 46 80 C 50 58, 46 40, 38 28" stroke="#5a2a10" stroke-width="2" fill="none"/>
    ${[[8, 40, 30, 60], [38, 28, 46, 54]].map(([x1, y1, x2, y2]) => Array.from({ length: 10 }, (_, i) => { const t = i / 10, x = x1 + (x2 - x1) * t, y = y1 + (y2 - y1) * t; return `<path d="M ${x.toFixed(1)} ${y.toFixed(1)} l -5 -2 M ${x.toFixed(1)} ${y.toFixed(1)} l 5 -3" stroke="#a0582a" stroke-width="0.8"/>`; }).join('')).join('')}
    <path d="M 36 96 C 32 100, 32 106, 38 108 L 40 104 Z M 48 96 C 52 100, 52 106, 46 108 L 44 104 Z" fill="#2a0e04" stroke="#0a0402" stroke-width="0.6"/>
    <path d="M 40 100 L 44 100 L 42 106 Z" fill="#0a0402"/>
    </svg>
  `,

  // ─── Doppelganger ────────────────────────────────────────────────────────
  // Halfway through becoming you: one side your face and clothes, the other
  // grey, hairless and long-fingered, the true face showing through.
  'Doppelganger': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Doppelganger: a figure caught halfway through becoming you, one side your face, the other grey, hairless and blank-eyed with long fingers, your own weapon in its hand">
    <defs>
      ${horrorSkinFilter('hdp-skin', { freq: '0.2 0.26', scale: 1.6, seed: 175, k: 1.15 })}
      <radialGradient id="hdp-you" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#e8c8b0"/><stop offset="1" stop-color="#8a6a58"/></radialGradient>
      <radialGradient id="hdp-it" cx="60%" cy="35%" r="70%"><stop offset="0" stop-color="#b8bcc0"/><stop offset="1" stop-color="#4a5054"/></radialGradient>
      <linearGradient id="hdp-cloak" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3a4a"/><stop offset="1" stop-color="#0a0a10"/></linearGradient>
      <clipPath id="hdp-left"><rect x="0" y="0" width="80" height="160"/></clipPath>
      <clipPath id="hdp-right"><rect x="80" y="0" width="80" height="160"/></clipPath>
    </defs>
    <ellipse cx="80" cy="154" rx="40" ry="5" fill="#000" opacity="0.6"/>
    <!-- your cloak on one side; grey skin on the other -->
    <path d="M 50 60 C 42 90, 40 120, 38 152 L 122 152 C 120 120, 118 90, 110 60 C 100 52, 60 52, 50 60 Z" fill="url(#hdp-cloak)" clip-path="url(#hdp-left)"/>
    <path d="M 50 60 C 42 90, 40 120, 38 152 L 122 152 C 120 120, 118 90, 110 60 C 100 52, 60 52, 50 60 Z" fill="url(#hdp-it)" filter="url(#hdp-skin)" clip-path="url(#hdp-right)"/>
    <path d="M 82 64 C 90 90, 96 120, 100 150 M 94 70 C 100 92, 106 110, 110 130" stroke="#2a2e32" stroke-width="1" fill="none" opacity="0.7"/>
    <!-- your weapon, in its long grey fingers -->
    <path d="M 112 80 C 124 90, 130 102, 132 114" stroke="url(#hdp-it)" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M 130 112 l 6 10 M 132 114 l 2 12 M 134 112 l 8 8" stroke="#8a9094" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M 128 118 L 148 60" stroke="#c8ccd4" stroke-width="3"/>
    <path d="M 124 120 L 134 116" stroke="#4a3018" stroke-width="4"/>
    <!-- the face, half yours, half its own -->
    <g clip-path="url(#hdp-left)">
      <path d="M 64 34 C 62 18, 70 10, 80 10 C 90 10, 98 18, 96 34 C 96 46, 90 56, 80 58 C 70 56, 64 46, 64 34 Z" fill="url(#hdp-you)" filter="url(#hdp-skin)"/>
      <path d="M 64 22 C 68 12, 92 12, 96 22 C 90 16, 70 16, 64 22 Z" fill="#3a2a1a"/>
      <ellipse cx="72" cy="32" rx="4" ry="2.6" fill="#fff"/><circle cx="72" cy="32" r="1.8" fill="#3a5a7a"/>
      <path d="M 73 48 Q 77 50 80 49" stroke="#7a4a40" stroke-width="1.4" fill="none"/>
    </g>
    <g clip-path="url(#hdp-right)">
      <path d="M 64 34 C 62 18, 70 8, 80 8 C 92 8, 100 18, 98 36 C 98 50, 90 60, 80 62 C 70 56, 64 46, 64 34 Z" fill="url(#hdp-it)" filter="url(#hdp-skin)"/>
      <ellipse cx="88" cy="32" rx="5" ry="3.4" fill="#e8ecf0"/><circle cx="88" cy="32" r="0.8" fill="#000"/>
      <path d="M 80 49 Q 88 54 94 46" stroke="#1a1e22" stroke-width="1.4" fill="none"/>
    </g>
    <path d="M 80 8 L 80 62" stroke="#000" stroke-width="0.8" opacity="0.6" stroke-dasharray="2 2"/>
    </svg>
  `,

  // ─── Purple Worm ─────────────────────────────────────────────────────────
  // A wall of purple flesh bursting up through the rock, all mouth, ringed
  // with teeth row behind row, wide enough to swallow a horse whole.
  'Purple Worm': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Purple Worm: a vast purple worm bursting up through shattered rock, all mouth, ringed with rows of teeth, wide enough to swallow a horse">
    <defs>
      ${wetSkinFilter('hpw-skin', { freq: '0.08 0.22', seed: 176, shine: 0.4 })}
      <linearGradient id="hpw-body" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2a0a30"/><stop offset="0.5" stop-color="#7a2a8a"/><stop offset="1" stop-color="#2a0a30"/></linearGradient>
      <radialGradient id="hpw-maw" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#000"/><stop offset="0.5" stop-color="#3a0010"/><stop offset="0.85" stop-color="#8a2040"/><stop offset="1" stop-color="#c06070"/></radialGradient>
    </defs>
    <!-- shattered rock around it -->
    <g fill="#2a2622" stroke="#0a0806" stroke-width="0.8">
      <path d="M 0 132 L 22 122 L 30 138 L 12 160 L 0 160 Z"/><path d="M 160 128 L 136 120 L 128 140 L 146 160 L 160 160 Z"/>
      <path d="M 40 150 L 54 140 L 62 160 L 36 160 Z"/><path d="M 120 148 L 104 140 L 98 160 L 126 160 Z"/>
    </g>
    <!-- the body, rising, segmented -->
    <path d="M 30 160 C 26 110, 32 70, 46 46 L 114 46 C 128 70, 134 110, 130 160 Z" fill="url(#hpw-body)" filter="url(#hpw-skin)"/>
    <g stroke="#1a0420" stroke-width="2" fill="none" opacity="0.7"><path d="M 34 140 Q 80 150 126 140"/><path d="M 34 118 Q 80 128 126 118"/><path d="M 38 96 Q 80 106 122 96"/><path d="M 42 74 Q 80 84 118 74"/></g>
    <!-- the mouth, the whole front of it, ring behind ring of teeth -->
    <ellipse cx="80" cy="44" rx="40" ry="30" fill="url(#hpw-maw)"/>
    ${[[40, 30, 7], [30, 22, 6], [20, 14, 5]].map(([rx, ry, tl]) => `<g fill="#f0e4d0">${Array.from({ length: 18 }, (_, i) => { const a = (i / 18) * Math.PI * 2, x = 80 + Math.cos(a) * rx, y = 44 + Math.sin(a) * ry, ix = 80 + Math.cos(a) * (rx - tl), iy = 44 + Math.sin(a) * (ry - tl * 0.75); return `<path d="M ${(x + Math.sin(a) * 1.8).toFixed(1)} ${(y - Math.cos(a) * 1.8).toFixed(1)} L ${ix.toFixed(1)} ${iy.toFixed(1)} L ${(x - Math.sin(a) * 1.8).toFixed(1)} ${(y + Math.cos(a) * 1.8).toFixed(1)} Z"/>`; }).join('')}</g>`).join('')}
    <path d="M 56 70 c 0 6 1 10 0 16 M 104 70 c 1 5 0 9 1 14" stroke="#c8a0c0" stroke-width="1.2" fill="none" opacity="0.5"/>
    <g fill="#5a4a40">${Array.from({ length: 14 }, (_, i) => `<circle cx="${(30 + (i * 37) % 100).toFixed(0)}" cy="${(6 + (i * 13) % 20).toFixed(0)}" r="${(1 + (i % 3)).toFixed(0)}"/>`).join('')}</g>
    </svg>
  `,

  // ─── Iron Golem ──────────────────────────────────────────────────────────
  // A giant of black iron ducking through the arch, green fire behind its
  // visor, steam hissing from every joint, rivets and old dents.
  'Iron Golem': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Iron Golem: a giant of riveted black iron, green fire burning behind its visor, steam hissing from its joints, massive fists">
    <defs>
      ${horrorSkinFilter('hig-metal', { freq: '0.12 0.14', scale: 1.8, seed: 177, k: 1.2 })}
      <linearGradient id="hig-iron" x1="0" y1="0" x2="0.5" y2="1"><stop offset="0" stop-color="#5a5e66"/><stop offset="0.5" stop-color="#2a2c30"/><stop offset="1" stop-color="#08090a"/></linearGradient>
      <radialGradient id="hig-fire" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#e0ffd0"/><stop offset="0.4" stop-color="#40ff60"/><stop offset="1" stop-color="#004010" stop-opacity="0"/></radialGradient>
      <filter id="hig-gl" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="1.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <ellipse cx="80" cy="154" rx="56" ry="5" fill="#000" opacity="0.6"/>
    <!-- legs like pillars -->
    <path d="M 54 116 L 50 152 L 72 152 L 72 116 Z M 88 116 L 88 152 L 110 152 L 106 116 Z" fill="url(#hig-iron)" filter="url(#hig-metal)"/>
    <!-- the torso: plates, rivets, the green fire in the chest grille -->
    <path d="M 40 50 C 36 76, 44 104, 54 120 L 106 120 C 116 104, 124 76, 120 50 C 108 40, 52 40, 40 50 Z" fill="url(#hig-iron)" filter="url(#hig-metal)"/>
    <path d="M 66 70 L 94 70 L 94 92 L 66 92 Z" fill="#050605"/>
    <rect x="66" y="70" width="28" height="22" fill="url(#hig-fire)" opacity="0.7" filter="url(#hig-gl)"/>
    <path d="M 66 76 L 94 76 M 66 82 L 94 82 M 66 88 L 94 88" stroke="#1a1c1e" stroke-width="2"/>
    <g fill="#8a8e96">${[[46, 56], [114, 56], [50, 100], [110, 100], [60, 50], [100, 50], [80, 106], [62, 112], [98, 112]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6"/>`).join('')}</g>
    <path d="M 44 66 Q 52 72 48 82" stroke="#0a0a0c" stroke-width="1.4" fill="none"/>
    <!-- arms and fists -->
    <path d="M 40 54 C 26 66, 20 86, 22 108 L 36 108 C 36 90, 40 76, 48 66 Z M 120 54 C 134 66, 140 86, 138 108 L 124 108 C 124 90, 120 76, 112 66 Z" fill="url(#hig-iron)" filter="url(#hig-metal)"/>
    <path d="M 16 106 L 42 106 L 42 126 L 16 126 Z M 118 106 L 144 106 L 144 126 L 118 126 Z" fill="#2a2c30" stroke="#0a0a0c" stroke-width="1"/>
    <path d="M 16 113 L 42 113 M 16 119 L 42 119 M 118 113 L 144 113 M 118 119 L 144 119" stroke="#0a0a0c" stroke-width="0.8"/>
    <!-- steam from the joints -->
    <g fill="#d8dcdc" opacity="0.35">${[[36, 54], [124, 54], [52, 118], [108, 118]].map(([x, y]) => `<circle cx="${x}" cy="${y - 6}" r="5"/><circle cx="${x + 3}" cy="${y - 13}" r="4"/><circle cx="${x - 2}" cy="${y - 19}" r="3"/>`).join('')}</g>
    <!-- the helm, the visor slit, green fire behind -->
    <path d="M 60 40 C 58 22, 66 12, 80 12 C 94 12, 102 22, 100 40 L 96 48 L 64 48 Z" fill="url(#hig-iron)" filter="url(#hig-metal)"/>
    <path d="M 66 28 L 94 28 L 92 34 L 68 34 Z" fill="#050605"/>
    <path d="M 68 30 L 92 30" stroke="url(#hig-fire)" stroke-width="3.4" filter="url(#hig-gl)"/>
    <path d="M 80 12 L 80 26" stroke="#1a1c1e" stroke-width="2"/>
    </svg>
  `,

  // ─── Beithir ─────────────────────────────────────────────────────────────
  // The lightning-serpent of the Highlands: a horned blue serpent the length
  // of a wagon train on a dozen clawed legs, lightning crawling over its coils.
  'Beithir': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Beithir: a huge horned blue serpent on a dozen clawed legs, lightning crawling over its coils and crackling from its open jaws">
    <defs>
      ${horrorSkinFilter('hbe-hide', { freq: '0.18 0.22', scale: 2.2, seed: 180, k: 1.25 })}
      ${scalePattern('hbe-sc', 3, '#040a18', '#8ab8f0')}
      <linearGradient id="hbe-body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a6ab0"/><stop offset="0.6" stop-color="#14305a"/><stop offset="1" stop-color="#040a18"/></linearGradient>
      <radialGradient id="hbe-eye" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffffff"/><stop offset="0.45" stop-color="#a0e0ff"/><stop offset="1" stop-color="#2060c0" stop-opacity="0"/></radialGradient>
      <filter id="hbe-gl" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="1.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <ellipse cx="80" cy="152" rx="76" ry="6" fill="#000" opacity="0.6"/>
    <!-- the long body, snaking back, legs all along it -->
    <path d="M 150 140 C 120 150, 96 120, 70 128 C 50 134, 40 120, 44 100" stroke="url(#hbe-body)" stroke-width="22" fill="none" stroke-linecap="round" filter="url(#hbe-hide)"/>
    <path d="M 150 140 C 120 150, 96 120, 70 128 C 50 134, 40 120, 44 100" stroke="url(#hbe-sc)" stroke-width="22" fill="none" opacity="0.5"/>
    <g stroke="#0a1a30" stroke-width="2.4" stroke-linecap="round" fill="none">
      ${[[136, 148], [120, 146], [104, 136], [88, 128], [72, 136], [58, 130]].map(([x, y]) => `<path d="M ${x} ${y} l -4 8 l -3 2 M ${x} ${y} l 4 8 l 3 2"/>`).join('')}
    </g>
    <!-- the neck rising, head lunging -->
    <path d="M 44 100 C 46 76, 60 60, 76 50" stroke="url(#hbe-body)" stroke-width="18" fill="none" stroke-linecap="round" filter="url(#hbe-hide)"/>
    <path d="M 70 54 C 64 38, 76 24, 94 24 C 112 24, 126 34, 128 46 C 128 54, 118 60, 104 62 L 120 58 C 116 70, 96 74, 82 68 C 74 66, 70 60, 70 54 Z" fill="url(#hbe-body)" filter="url(#hbe-hide)"/>
    <path d="M 82 28 C 78 14, 84 4, 92 0 C 90 10, 92 18, 90 28 Z M 96 26 C 98 12, 108 6, 116 4 C 110 12, 106 20, 102 30 Z" fill="#c8d0e0" stroke="#3a4a6a" stroke-width="0.6"/>
    <ellipse cx="96" cy="40" rx="4" ry="2.8" fill="url(#hbe-eye)" filter="url(#hbe-gl)"/>
    <path d="M 90 36 L 102 38" stroke="#000" stroke-width="2"/>
    <path d="M 104 62 L 128 50 L 120 58 Z" fill="#0a0410"/>
    <g>${needleTeeth(104, 124, 58.6, 6, 3, 1, '#e8ecf8', 0.3)}</g>
    <!-- lightning crawling over it and from its jaws -->
    <g stroke="#e0f4ff" stroke-width="1.4" fill="none" filter="url(#hbe-gl)">
      <path d="M 124 54 L 136 50 L 132 58 L 146 54 L 140 64 L 158 60"/>
      <path d="M 56 118 L 64 110 L 62 120 L 74 112"/><path d="M 108 132 L 116 124 L 116 134 L 126 128"/><path d="M 50 92 L 58 86 L 56 96"/>
    </g>
    </svg>
  `,

  // ─── Chimera ─────────────────────────────────────────────────────────────
  // A lion's body, three heads on three necks (lion, goat and dragon), bat
  // wings spread; roaring, bleating and hissing all at once.
  'Chimera': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Chimera: a lion-bodied beast with three heads, a roaring lion, a mad-eyed goat and a hissing dragon, bat wings spread, a serpent for a tail">
    <defs>
      ${horrorSkinFilter('hch-fur', { freq: '0.4 0.14', scale: 2.2, seed: 181, k: 1.25 })}
      <linearGradient id="hch-lion" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="#c8903a"/><stop offset="0.6" stop-color="#6a4410"/><stop offset="1" stop-color="#201004"/></linearGradient>
      <linearGradient id="hch-wing" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a1a14"/><stop offset="1" stop-color="#140604"/></linearGradient>
      <linearGradient id="hch-goat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a8070"/><stop offset="1" stop-color="#3a3428"/></linearGradient>
      <linearGradient id="hch-drag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a2a1a"/><stop offset="1" stop-color="#2a0804"/></linearGradient>
      <radialGradient id="hch-eye" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff8c0"/><stop offset="0.5" stop-color="#e0a020"/><stop offset="1" stop-color="#600" stop-opacity="0"/></radialGradient>
    </defs>
    <ellipse cx="80" cy="152" rx="66" ry="5" fill="#000" opacity="0.6"/>
    <path d="M 70 70 C 50 40, 22 30, 2 36 C 12 46, 8 56, 16 62 C 28 60, 34 72, 30 82 Z M 96 70 C 116 40, 144 30, 158 36 C 148 46, 152 56, 144 62 C 132 60, 126 72, 130 82 Z" fill="url(#hch-wing)"/>
    <!-- lion body, serpent tail -->
    <path d="M 34 120 C 30 96, 50 80, 80 80 C 110 80, 132 96, 130 120 L 118 126 L 46 126 Z" fill="url(#hch-lion)" filter="url(#hch-fur)"/>
    <path d="M 40 122 L 36 150 L 50 150 L 52 124 Z M 64 126 L 62 150 L 74 150 L 74 126 Z M 100 126 L 102 150 L 114 150 L 112 124 Z M 118 120 L 128 148 L 140 146 L 126 116 Z" fill="url(#hch-lion)" filter="url(#hch-fur)"/>
    <path d="M 128 110 C 146 110, 152 128, 146 140 C 156 140, 160 132, 158 124" stroke="#3a5a20" stroke-width="5" fill="none" stroke-linecap="round"/>
    <!-- three heads -->
    <!-- the dragon's, left -->
    <path d="M 52 84 C 40 72, 30 66, 20 66" stroke="url(#hch-drag)" stroke-width="9" fill="none" stroke-linecap="round"/>
    <path d="M 26 58 C 14 56, 4 62, 4 70 L 18 72 L 6 76 C 12 82, 24 80, 30 74 C 34 68, 32 60, 26 58 Z" fill="url(#hch-drag)" filter="url(#hch-fur)"/>
    <circle cx="22" cy="64" r="1.8" fill="url(#hch-eye)"/>
    <path d="M 4 72 C -2 72, -2 74, 0 76" stroke="#ff7020" stroke-width="2" fill="none"/>
    <!-- the lion's, centre, roaring -->
    <path d="M 60 66 C 50 50, 58 30, 80 28 C 102 30, 110 50, 100 66 C 100 80, 92 90, 80 90 C 68 90, 60 80, 60 66 Z" fill="#6a3a10" filter="url(#hch-fur)"/>
    <path d="M 66 54 C 64 42, 72 36, 80 36 C 88 36, 96 42, 94 54 C 94 66, 88 74, 80 76 C 72 74, 66 66, 66 54 Z" fill="url(#hch-lion)" filter="url(#hch-fur)"/>
    <path d="M 68 50 Q 73 46 78 52 M 82 52 Q 87 46 92 50" stroke="#1a0c04" stroke-width="2" fill="none"/>
    <ellipse cx="73" cy="53" rx="2.6" ry="1.8" fill="url(#hch-eye)"/><ellipse cx="87" cy="53" rx="2.6" ry="1.8" fill="url(#hch-eye)"/>
    <path d="M 72 64 Q 80 76 88 64 Q 80 68 72 64 Z" fill="#2a0404"/>
    <path d="M 73 64 L 74 69 L 76 64 M 84 64 L 86 69 L 87 64" fill="#f0e8d0"/>
    <!-- the goat's, right, mad-eyed -->
    <path d="M 108 82 C 118 70, 126 60, 134 56" stroke="url(#hch-goat)" stroke-width="8" fill="none" stroke-linecap="round"/>
    <path d="M 130 50 C 140 46, 152 50, 154 60 C 154 68, 146 72, 138 70 C 132 68, 128 60, 130 50 Z" fill="url(#hch-goat)" filter="url(#hch-fur)"/>
    <path d="M 134 50 C 128 38, 134 30, 142 32 C 138 38, 138 44, 140 48 M 144 50 C 146 38, 154 34, 158 40 C 152 42, 150 46, 148 50" stroke="#2a241c" stroke-width="2.4" fill="none"/>
    <ellipse cx="146" cy="56" rx="2.6" ry="2" fill="#e8d870"/><path d="M 144.4 56 L 147.6 56" stroke="#000" stroke-width="1.2"/>
    <path d="M 146 70 c 0 5 1 8 0 12" stroke="#8a8070" stroke-width="2" fill="none"/>
    </svg>
  `,

  // ─── Marilith ────────────────────────────────────────────────────────────
  // A demon general: a woman's torso rising from a great serpent's tail,
  // six arms, a sword in every one, all of them already moving.
  'Marilith': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Marilith: a demon with a woman's torso rising from a great green serpent's coils, six arms with a sword in every hand, cold golden eyes">
    <defs>
      ${horrorSkinFilter('hma-skin', { freq: '0.16 0.2', scale: 1.8, seed: 182, k: 1.2 })}
      ${scalePattern('hma-sc', 3, '#041006', '#8ac080')}
      <linearGradient id="hma-tail" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a6a3a"/><stop offset="1" stop-color="#0a1a0a"/></linearGradient>
      <radialGradient id="hma-body" cx="45%" cy="35%" r="70%"><stop offset="0" stop-color="#7aa070"/><stop offset="0.6" stop-color="#3a5a34"/><stop offset="1" stop-color="#142014"/></radialGradient>
      <linearGradient id="hma-steel" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#5a5e66"/><stop offset="1" stop-color="#e8ecf4"/></linearGradient>
      <radialGradient id="hma-eye" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fffbe0"/><stop offset="0.5" stop-color="#e0b020"/><stop offset="1" stop-color="#604000" stop-opacity="0"/></radialGradient>
    </defs>
    <!-- the coils -->
    <path d="M 20 150 C 30 124, 70 120, 80 132 C 92 146, 130 146, 146 124 C 154 112, 146 100, 132 104" stroke="url(#hma-tail)" stroke-width="20" fill="none" stroke-linecap="round" filter="url(#hma-skin)"/>
    <path d="M 20 150 C 30 124, 70 120, 80 132 C 92 146, 130 146, 146 124" stroke="url(#hma-sc)" stroke-width="20" fill="none" opacity="0.5"/>
    <path d="M 66 118 C 62 104, 66 92, 72 84 L 88 84 C 94 92, 98 104, 94 118 C 88 128, 72 128, 66 118 Z" fill="url(#hma-tail)" filter="url(#hma-skin)"/>
    <!-- the torso -->
    <path d="M 66 86 C 62 70, 64 56, 70 48 L 90 48 C 96 56, 98 70, 94 86 Z" fill="url(#hma-body)" filter="url(#hma-skin)"/>
    <path d="M 70 62 C 74 66, 78 66, 80 62 C 82 66, 86 66, 90 62" stroke="#142014" stroke-width="1" fill="none"/>
    <!-- six arms, six swords -->
    ${[[-1, 52, 20, 30, -0.5], [-1, 62, 14, 60, 0.2], [-1, 74, 22, 92, 0.8], [1, 52, 140, 30, 0.5], [1, 62, 146, 60, -0.2], [1, 74, 138, 92, -0.8]].map(([s, y, hx, hy, tilt]) => {
      const sx = s < 0 ? 68 : 92;
      const bx = hx + Math.cos(-Math.PI / 2 + tilt) * 34 * (s < 0 ? -0.6 : 0.6), by = hy + Math.sin(-Math.PI / 2 + tilt) * 34;
      return `<path d="M ${sx} ${y} Q ${(sx + hx) / 2} ${y - 6}, ${hx} ${hy}" stroke="url(#hma-body)" stroke-width="4.4" fill="none" stroke-linecap="round"/>
        <path d="M ${hx} ${hy} L ${bx.toFixed(1)} ${by.toFixed(1)}" stroke="url(#hma-steel)" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M ${hx - 4} ${hy + 2} L ${hx + 4} ${hy - 2}" stroke="#8a6a20" stroke-width="2.4"/>`;
    }).join('')}
    <!-- the head: crowned, cold golden eyes, serpent hair -->
    <path d="M 70 32 C 68 18, 74 10, 80 10 C 86 10, 92 18, 90 32 C 90 42, 86 48, 80 50 C 74 48, 70 42, 70 32 Z" fill="url(#hma-body)" filter="url(#hma-skin)"/>
    <path d="M 70 20 C 62 10, 66 2, 72 4 M 76 12 C 74 2, 80 -2, 84 2 M 88 16 C 94 8, 100 10, 98 18" stroke="#2a4a24" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <path d="M 70 14 L 74 6 L 78 12 L 80 4 L 82 12 L 86 6 L 90 14" fill="#c8a040" stroke="#5a4010" stroke-width="0.6"/>
    <ellipse cx="75" cy="30" rx="2.8" ry="1.8" fill="url(#hma-eye)"/><ellipse cx="85" cy="30" rx="2.8" ry="1.8" fill="url(#hma-eye)"/>
    <path d="M 75 29 l 0 2 M 85 29 l 0 2" stroke="#000" stroke-width="1"/>
    <path d="M 76 41 Q 80 43 84 41" stroke="#0a1a08" stroke-width="1.2" fill="none"/>
    </svg>
  `,

  // ─── Erinyes ─────────────────────────────────────────────────────────────
  // A Fury of the Hells: black-feathered wings, a beautiful terrible face
  // weeping blood, a burning longbow drawn and aimed at you.
  'Erinyes': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Erinyes: a Fury of the Hells with great black-feathered wings, a beautiful terrible face weeping blood, a burning longbow drawn and aimed at you">
    <defs>
      ${horrorSkinFilter('hfu-skin', { freq: '0.2 0.26', scale: 1.4, seed: 183, k: 1.1 })}
      <radialGradient id="hfu-face" cx="45%" cy="35%" r="70%"><stop offset="0" stop-color="#e8d4cc"/><stop offset="0.7" stop-color="#9a7a74"/><stop offset="1" stop-color="#3a2a28"/></radialGradient>
      <linearGradient id="hfu-wing" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a1418"/><stop offset="1" stop-color="#040304"/></linearGradient>
      <linearGradient id="hfu-armor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a1a1e"/><stop offset="1" stop-color="#0a0406"/></linearGradient>
      <filter id="hfu-gl" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="1.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <!-- black-feathered wings -->
    ${[-1, 1].map(s => `<g transform="${s > 0 ? 'translate(160 0) scale(-1 1)' : ''}">${Array.from({ length: 7 }, (_, i) => `<path d="M 66 60 Q ${46 - i * 4} ${30 + i * 6}, ${8 + i * 3} ${18 + i * 16} Q ${40 - i * 2} ${44 + i * 6}, 68 ${70 + i * 2} Z" fill="url(#hfu-wing)" stroke="#2a2228" stroke-width="0.5"/>`).join('')}</g>`).join('')}
    <!-- the body, in dark scale armour -->
    <path d="M 62 60 C 58 86, 60 116, 66 156 L 94 156 C 100 116, 102 86, 98 60 C 90 52, 70 52, 62 60 Z" fill="url(#hfu-armor)" filter="url(#hfu-skin)"/>
    <g stroke="#5a2a30" stroke-width="0.8" fill="none" opacity="0.8">${Array.from({ length: 8 }, (_, i) => `<path d="M ${64 + (i % 2) * 2} ${70 + i * 10} Q 80 ${74 + i * 10} ${96 - (i % 2) * 2} ${70 + i * 10}"/>`).join('')}</g>
    <!-- the burning longbow, drawn at you -->
    <path d="M 30 50 C 46 70, 46 110, 30 130" stroke="#3a1a10" stroke-width="3.4" fill="none"/>
    <path d="M 30 50 C 46 70, 46 110, 30 130" stroke="#ff6a20" stroke-width="1.4" fill="none" filter="url(#hfu-gl)" opacity="0.9"/>
    <path d="M 30 50 L 60 90 L 30 130" stroke="#d8c8a0" stroke-width="0.8" fill="none"/>
    <path d="M 60 90 L 18 90" stroke="#2a1a10" stroke-width="2"/>
    <path d="M 18 90 L 24 86 L 24 94 Z" fill="#ff8030" filter="url(#hfu-gl)"/>
    <path d="M 60 90 C 66 86, 70 80, 70 72" stroke="url(#hfu-face)" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M 40 92 C 34 92, 34 88, 40 88" stroke="url(#hfu-face)" stroke-width="4" fill="none" stroke-linecap="round"/>
    <!-- the face: beautiful, terrible, weeping blood -->
    <path d="M 70 38 C 68 24, 74 16, 80 16 C 86 16, 92 24, 90 38 C 90 48, 86 56, 80 58 C 74 56, 70 48, 70 38 Z" fill="url(#hfu-face)" filter="url(#hfu-skin)"/>
    <path d="M 68 30 C 64 18, 72 8, 82 8 C 92 8, 98 18, 94 30 C 92 22, 70 22, 68 30 Z" fill="#0a0606"/>
    <path d="M 68 30 C 62 44, 62 58, 66 70 M 94 30 C 98 44, 98 58, 94 70" stroke="#0a0606" stroke-width="3" fill="none"/>
    <path d="M 72 34 L 78 36 M 82 36 L 88 34" stroke="#2a1414" stroke-width="1.6"/>
    <ellipse cx="75" cy="38" rx="2.4" ry="1.6" fill="#ffb060" filter="url(#hfu-gl)"/><ellipse cx="85" cy="38" rx="2.4" ry="1.6" fill="#ffb060" filter="url(#hfu-gl)"/>
    <path d="M 75 40 c 0 4 1 8 0 12 M 85 40 c 0 5 -1 8 0 11" stroke="#8a0a14" stroke-width="1.2" fill="none"/>
    <path d="M 76 49 Q 80 51 84 49" stroke="#5a1a1e" stroke-width="1.4" fill="none"/>
    </svg>
  `,

  // ─── Giant ───────────────────────────────────────────────────────────────
  // A hill giant ducking under the arch: lumpen, filthy, a club of a whole
  // tree, small mean eyes in a vast slack face, a sack that moves.
  'Giant': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Giant: a lumpen, filthy hill giant stooping under the arch, small mean eyes in a vast slack face, a club made of a whole tree, a sack over his shoulder that moves">
    <defs>
      ${horrorSkinFilter('hgi-skin', { freq: '0.12 0.16', scale: 2.4, seed: 184, k: 1.3 })}
      <radialGradient id="hgi-face" cx="45%" cy="35%" r="70%"><stop offset="0" stop-color="#c89a78"/><stop offset="0.6" stop-color="#8a5a40"/><stop offset="1" stop-color="#3a2014"/></radialGradient>
      <linearGradient id="hgi-hide" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6a5a3a"/><stop offset="1" stop-color="#1a140a"/></linearGradient>
      <linearGradient id="hgi-wood" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3a2a14"/><stop offset="0.5" stop-color="#6a5030"/><stop offset="1" stop-color="#2a1a0a"/></linearGradient>
    </defs>
    <!-- the arch he stoops under -->
    <path d="M 0 0 L 160 0 L 160 14 C 120 6, 40 6, 0 14 Z" fill="#2a2622" stroke="#0a0806" stroke-width="1"/>
    <!-- the club, a whole young tree -->
    <path d="M 120 160 L 150 40" stroke="url(#hgi-wood)" stroke-width="10" stroke-linecap="round"/>
    <path d="M 146 46 C 150 34, 158 30, 160 22 M 148 56 C 156 52, 160 46, 160 40" stroke="#3a2a14" stroke-width="3" fill="none"/>
    <!-- the body: vast, slumped, in stinking hides -->
    <path d="M 6 160 C 8 112, 34 84, 80 82 C 126 84, 150 112, 152 160 Z" fill="url(#hgi-face)" filter="url(#hgi-skin)"/>
    <path d="M 20 160 C 26 128, 48 112, 80 112 C 112 112, 134 128, 140 160 Z" fill="url(#hgi-hide)" filter="url(#hgi-skin)"/>
    <path d="M 40 128 L 46 160 M 80 112 L 80 160 M 120 128 L 114 160" stroke="#0a0804" stroke-width="1.4" opacity="0.7"/>
    <!-- the sack over his shoulder; something in it moves -->
    <path d="M 14 96 C 0 100, -2 128, 14 136 C 30 140, 40 124, 36 106 C 32 96, 22 92, 14 96 Z" fill="#6a5a3a" filter="url(#hgi-skin)"/>
    <path d="M 20 112 C 22 108, 28 108, 28 114" stroke="#2a2014" stroke-width="1.6" fill="none"/>
    <path d="M 18 132 l -4 6 M 24 134 l -2 7" stroke="#c8a088" stroke-width="2" stroke-linecap="round"/>
    <path d="M 30 98 C 40 92, 48 90, 54 92" stroke="#3a2a14" stroke-width="3" fill="none"/>
    <!-- the head: vast and slack, tiny mean eyes -->
    <path d="M 44 54 C 40 26, 58 14, 80 14 C 102 14, 120 26, 116 54 C 116 76, 102 92, 80 94 C 58 92, 44 76, 44 54 Z" fill="url(#hgi-face)" filter="url(#hgi-skin)"/>
    <path d="M 50 30 C 60 18, 100 18, 110 30 C 100 26, 60 26, 50 30 Z" fill="#3a2a1a"/>
    <path d="M 58 46 L 74 50 M 86 50 L 102 46" stroke="#2a140a" stroke-width="3.4" stroke-linecap="round"/>
    <circle cx="68" cy="54" r="2" fill="#000"/><circle cx="92" cy="54" r="2" fill="#000"/>
    <circle cx="67.4" cy="53.4" r="0.6" fill="#ffe0a0"/><circle cx="91.4" cy="53.4" r="0.6" fill="#ffe0a0"/>
    <path d="M 76 56 C 72 66, 74 70, 80 70 C 86 70, 88 66, 84 56" fill="#a06a50" stroke="#3a2014" stroke-width="0.8"/>
    <path d="M 62 80 Q 80 86 98 80 Q 80 90 62 80 Z" fill="#1a0804"/>
    <path d="M 68 82 l 2 3 M 78 84 l 1 3 M 88 83 l 1 3" stroke="#d8c8a0" stroke-width="1.6"/>
    <path d="M 64 84 c -1 5 0 8 -1 12" stroke="#c8d0c0" stroke-width="1" fill="none" opacity="0.6"/>
    </svg>
  `,

  // ─── Wizard ──────────────────────────────────────────────────────────────
  // A gaunt old wizard stepping from the shadows: a silver beard to the
  // floor, hollow eyes lit from inside, a staff topped with a skull, and
  // green fire already gathering in his free hand.
  'Wizard': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Wizard: a gaunt old wizard in a tattered robe, a silver beard reaching nearly to the floor, hollow eyes lit from inside, a skull-topped staff, green fire gathering in his hand">
    <defs>
      ${horrorSkinFilter('hwz-cloth', { freq: '0.05 0.36', scale: 1.6, seed: 185, k: 1.1 })}
      <linearGradient id="hwz-robe" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2440"/><stop offset="1" stop-color="#08060e"/></linearGradient>
      <radialGradient id="hwz-face" cx="45%" cy="35%" r="70%"><stop offset="0" stop-color="#d8c4b4"/><stop offset="0.7" stop-color="#8a7464"/><stop offset="1" stop-color="#3a2e26"/></radialGradient>
      <linearGradient id="hwz-beard" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8ecf0"/><stop offset="1" stop-color="#8a9098"/></linearGradient>
      <radialGradient id="hwz-fire" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#e8ffd8"/><stop offset="0.4" stop-color="#50ff70"/><stop offset="1" stop-color="#004010" stop-opacity="0"/></radialGradient>
    </defs>
    <ellipse cx="80" cy="154" rx="40" ry="5" fill="#000" opacity="0.6"/>
    <!-- the staff, a skull at its head -->
    <path d="M 120 156 L 126 30" stroke="#2a1e14" stroke-width="3.4" stroke-linecap="round"/>
    <path d="M 118 26 C 118 16, 134 16, 134 26 L 132 34 L 120 34 Z" fill="#d8ccaa"/>
    <circle cx="123" cy="26" r="2" fill="#0a0806"/><circle cx="129" cy="26" r="2" fill="#0a0806"/>
    <path d="M 122 33 l 1 2 l 1 -2 l 1 2 l 1 -2 l 1 2 l 1 -2 l 1 2" stroke="#0a0806" stroke-width="0.6" fill="none"/>
    <!-- the robe, tattered at the hem -->
    <path d="M 54 56 C 46 90, 42 124, 40 152 L 46 148 L 52 154 L 60 148 L 68 154 L 76 148 L 84 154 L 92 148 L 100 154 L 108 148 L 116 152 C 116 124, 112 90, 106 56 C 96 48, 64 48, 54 56 Z" fill="url(#hwz-robe)" filter="url(#hwz-cloth)"/>
    <!-- the beard, nearly to the floor -->
    <path d="M 68 52 C 64 80, 70 110, 76 146 L 84 146 C 90 110, 96 80, 92 52 Z" fill="url(#hwz-beard)" filter="url(#hwz-cloth)"/>
    <path d="M 74 60 C 72 90, 76 118, 78 140 M 80 58 L 80 144 M 86 60 C 88 90, 84 118, 82 140" stroke="#9aa0a8" stroke-width="0.8" fill="none"/>
    <!-- the free hand, green fire gathering in it -->
    <path d="M 56 62 C 44 70, 36 80, 32 90" stroke="url(#hwz-robe)" stroke-width="9" fill="none" stroke-linecap="round"/>
    <path d="M 32 90 l -4 6 M 32 90 l -1 8 M 32 90 l 3 7" stroke="#b8a494" stroke-width="1.8" stroke-linecap="round"/>
    <circle cx="28" cy="84" r="12" fill="url(#hwz-fire)"/>
    <path d="M 24 84 C 26 78, 30 76, 32 80 C 34 76, 38 80, 34 86" stroke="#d0ffd0" stroke-width="0.8" fill="none" opacity="0.8"/>
    <!-- the head: gaunt, the hood, hollow eyes lit from within -->
    <path d="M 56 50 C 52 24, 64 6, 80 4 C 96 6, 108 24, 104 50 C 96 56, 64 56, 56 50 Z" fill="url(#hwz-robe)" filter="url(#hwz-cloth)"/>
    <path d="M 68 36 C 66 22, 72 16, 80 16 C 88 16, 94 22, 92 36 C 92 46, 88 54, 80 56 C 72 54, 68 46, 68 36 Z" fill="url(#hwz-face)" filter="url(#hwz-cloth)"/>
    <ellipse cx="74" cy="34" rx="3.4" ry="2.6" fill="#0a0806"/><ellipse cx="86" cy="34" rx="3.4" ry="2.6" fill="#0a0806"/>
    <circle cx="74" cy="34" r="1.2" fill="#80ff90"/><circle cx="86" cy="34" r="1.2" fill="#80ff90"/>
    <path d="M 70 30 L 77 32 M 83 32 L 90 30" stroke="#d8dce0" stroke-width="1.6"/>
    <path d="M 80 36 L 78 44 L 82 44" stroke="#5a4a3e" stroke-width="0.8" fill="none"/>
    </svg>
  `,

  // ─── Mongolian Death Worm ────────────────────────────────────────────────
  // The olgoi-khorkhoi: a blood-red worm as thick as a horse heaving out of
  // the stone, blotched and spined, with no face at all; the air crackles.
  'Mongolian Death Worm': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Mongolian Death Worm: a blood-red, blotched worm as thick as a horse heaving up out of cracked stone, spined, with no face at all, acid dripping, the air crackling">
    <defs>
      ${wetSkinFilter('hmd-skin', { freq: '0.1 0.18', seed: 186, shine: 0.4 })}
      <linearGradient id="hmd-body" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#400406"/><stop offset="0.5" stop-color="#b01a1a"/><stop offset="1" stop-color="#400406"/></linearGradient>
      <radialGradient id="hmd-hole" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#3a0404"/></radialGradient>
      <filter id="hmd-gl" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="1.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <!-- the cracked stone it bursts from -->
    <path d="M 0 136 L 30 128 L 50 140 L 80 132 L 110 140 L 130 128 L 160 136 L 160 160 L 0 160 Z" fill="#3a3028"/>
    <path d="M 30 128 L 44 150 M 130 128 L 118 152 M 80 132 L 82 160" stroke="#120e0a" stroke-width="1.4"/>
    <!-- the worm: no eyes, no face, just the end of it -->
    <path d="M 52 140 C 48 100, 56 60, 70 30 C 74 20, 90 20, 94 30 C 106 60, 112 100, 108 140 Z" fill="url(#hmd-body)" filter="url(#hmd-skin)"/>
    <g stroke="#2a0204" stroke-width="1.6" fill="none" opacity="0.7">${[44, 60, 76, 92, 108, 124].map(y => `<path d="M ${56 + (140 - y) * 0.05} ${y} Q 80 ${y + 6} ${104 - (140 - y) * 0.05} ${y}"/>`).join('')}</g>
    <g fill="#5a1a10" opacity="0.8"><ellipse cx="66" cy="70" rx="5" ry="3"/><ellipse cx="94" cy="96" rx="6" ry="3.4"/><ellipse cx="70" cy="114" rx="4" ry="2.4"/><ellipse cx="90" cy="54" rx="3.4" ry="2"/></g>
    <!-- spines -->
    <g fill="#e8d8b0">${[[64, 38, -1], [96, 38, 1], [58, 56, -1], [102, 58, 1], [56, 80, -1], [106, 82, 1]].map(([x, y, s]) => `<path d="M ${x} ${y} l ${s * 10} -6 l ${-s * 4} 8 Z"/>`).join('')}</g>
    <!-- the blind end: a puckered opening dripping acid -->
    <ellipse cx="82" cy="28" rx="8" ry="5" fill="url(#hmd-hole)"/>
    <path d="M 74 28 l -3 -1 M 90 28 l 3 -1 M 82 23 l 0 -3 M 77 25 l -2 -2 M 87 25 l 2 -2" stroke="#2a0204" stroke-width="1.2"/>
    <path d="M 78 32 c 0 5 1 9 0 14 M 86 32 c 1 4 0 8 1 12" stroke="#d8e040" stroke-width="1.4" fill="none" filter="url(#hmd-gl)"/>
    <!-- the air crackling around it -->
    <g stroke="#ffe8a0" stroke-width="1" fill="none" filter="url(#hmd-gl)" opacity="0.85">
      <path d="M 42 40 L 48 46 L 44 50 L 52 56"/><path d="M 118 46 L 112 52 L 118 56 L 110 62"/><path d="M 60 12 L 66 18 L 62 22"/>
    </g>
    </svg>
  `,

  // ─── Cerebrovore ─────────────────────────────────────────────────────────
  // A hunched robed figure with a swollen bare skull, the brain beneath
  // pulsing and veined, a round mouth of tiny teeth; its thoughts press on yours.
  'Cerebrovore': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Cerebrovore: a hunched robed figure with a swollen bare skull, the brain beneath pulsing and veined, milky eyes, a round mouth of tiny teeth, long thin fingers reaching">
    <defs>
      ${wetSkinFilter('hcv-skin', { freq: '0.14 0.2', seed: 187, shine: 0.45 })}
      <radialGradient id="hcv-head" cx="45%" cy="30%" r="70%"><stop offset="0" stop-color="#e8c8c8"/><stop offset="0.5" stop-color="#b07a84"/><stop offset="1" stop-color="#4a2a34"/></radialGradient>
      <linearGradient id="hcv-robe" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1a30"/><stop offset="1" stop-color="#08040c"/></linearGradient>
      <radialGradient id="hcv-mouth" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#000"/><stop offset="0.7" stop-color="#3a0a14"/><stop offset="1" stop-color="#8a3a4a"/></radialGradient>
      <radialGradient id="hcv-aura" cx="50%" cy="30%" r="50%"><stop offset="0" stop-color="#c080ff" stop-opacity="0.3"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
    </defs>
    <circle cx="80" cy="44" r="60" fill="url(#hcv-aura)"/>
    <ellipse cx="80" cy="154" rx="40" ry="5" fill="#000" opacity="0.6"/>
    <!-- the robe, hunched -->
    <path d="M 50 74 C 40 100, 38 128, 36 154 L 124 154 C 122 128, 120 100, 110 74 C 98 64, 62 64, 50 74 Z" fill="url(#hcv-robe)"/>
    <path d="M 56 84 C 42 92, 32 104, 26 118" stroke="url(#hcv-robe)" stroke-width="9" fill="none" stroke-linecap="round"/>
    <path d="M 104 84 C 118 92, 128 104, 134 118" stroke="url(#hcv-robe)" stroke-width="9" fill="none" stroke-linecap="round"/>
    <path d="M 26 118 l -6 10 M 26 118 l -2 13 M 26 118 l 2 12 M 134 118 l 6 10 M 134 118 l 2 13 M 134 118 l -2 12" stroke="#c8a0a8" stroke-width="1.6" stroke-linecap="round"/>
    <!-- the swollen skull, the brain showing through, veined -->
    <path d="M 48 50 C 42 22, 60 4, 80 4 C 100 4, 118 22, 112 50 C 110 60, 104 66, 96 70 L 64 70 C 56 66, 50 60, 48 50 Z" fill="url(#hcv-head)" filter="url(#hcv-skin)"/>
    <g stroke="#7a3a4a" stroke-width="1.2" fill="none" opacity="0.8">
      <path d="M 58 20 C 64 26, 60 32, 66 36 C 72 40, 68 46, 74 48"/><path d="M 80 8 C 82 16, 78 22, 82 28 C 86 34, 82 40, 86 44"/>
      <path d="M 102 20 C 96 26, 100 32, 94 36 C 88 40, 92 46, 86 48"/><path d="M 52 40 C 58 38, 62 42, 66 40"/><path d="M 108 40 C 102 38, 98 42, 94 40"/>
    </g>
    <g stroke="#3a1a8a" stroke-width="0.8" fill="none" opacity="0.6"><path d="M 64 14 C 70 22, 66 28, 70 34"/><path d="M 96 14 C 90 22, 94 28, 90 34"/></g>
    <!-- milky eyes, the round mouth of tiny teeth -->
    <ellipse cx="70" cy="52" rx="4.6" ry="3.2" fill="#e8e4f0"/><ellipse cx="90" cy="52" rx="4.6" ry="3.2" fill="#e8e4f0"/>
    <circle cx="70" cy="52" r="1.6" fill="#8a8aa0" opacity="0.7"/><circle cx="90" cy="52" r="1.6" fill="#8a8aa0" opacity="0.7"/>
    <circle cx="80" cy="64" r="6" fill="url(#hcv-mouth)"/>
    <g fill="#f0e8e0">${Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2, x = 80 + Math.cos(a) * 5.2, y = 64 + Math.sin(a) * 5.2, ix = 80 + Math.cos(a) * 3, iy = 64 + Math.sin(a) * 3; return `<path d="M ${(x + Math.sin(a) * 0.9).toFixed(1)} ${(y - Math.cos(a) * 0.9).toFixed(1)} L ${ix.toFixed(1)} ${iy.toFixed(1)} L ${(x - Math.sin(a) * 0.9).toFixed(1)} ${(y + Math.cos(a) * 0.9).toFixed(1)} Z"/>`; }).join('')}</g>
    </svg>
  `,

  // ─── Shade ───────────────────────────────────────────────────────────────
  // The ghost of another adventurer who died on this level: torn, grey and
  // half-transparent, its mouth open on its last scream, its death-wound
  // still bleeding light, its sword trailing mist.
  'Shade': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Shade: the half-transparent ghost of a fallen adventurer, torn and grey, its mouth open on its last scream, its death-wound still bleeding light, a misty sword in its hand">
    <defs>
      ${horrorSkinFilter('hsh-cloth', { freq: '0.05 0.3', scale: 1.6, seed: 190, k: 1.1 })}
      <linearGradient id="hsh-body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d8e0ec" stop-opacity="0.85"/><stop offset="0.6" stop-color="#6a7a8c" stop-opacity="0.55"/><stop offset="1" stop-color="#1a2430" stop-opacity="0"/></linearGradient>
      <radialGradient id="hsh-glow" cx="50%" cy="40%" r="55%"><stop offset="0" stop-color="#a8c8f0" stop-opacity="0.3"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
      <radialGradient id="hsh-face" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#eef2f8" stop-opacity="0.9"/><stop offset="1" stop-color="#6a7a8c" stop-opacity="0.6"/></radialGradient>
      <filter id="hsh-gl" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <circle cx="80" cy="70" r="76" fill="url(#hsh-glow)"/>
    <!-- the torn body, fading away below -->
    <path d="M 54 56 C 46 90, 44 120, 40 160 L 56 150 L 64 160 L 74 150 L 84 160 L 94 150 L 104 160 L 112 150 L 120 160 C 116 120, 114 90, 106 56 C 96 48, 64 48, 54 56 Z" fill="url(#hsh-body)" filter="url(#hsh-cloth)"/>
    <path d="M 62 70 C 66 100, 64 130, 58 150 M 98 70 C 94 100, 96 130, 102 150" stroke="#2a3644" stroke-width="1" fill="none" opacity="0.5"/>
    <!-- the death wound, still bleeding light -->
    <path d="M 66 78 L 94 104 M 70 76 L 98 102" stroke="#e0f0ff" stroke-width="2.4" filter="url(#hsh-gl)" opacity="0.9"/>
    <path d="M 66 78 L 94 104" stroke="#8a1018" stroke-width="1" opacity="0.7"/>
    <!-- arms; a misty sword -->
    <path d="M 104 62 C 118 72, 124 86, 126 100" stroke="url(#hsh-body)" stroke-width="7" fill="none" stroke-linecap="round"/>
    <path d="M 124 102 L 148 40" stroke="#e8f0f8" stroke-width="3" opacity="0.8" filter="url(#hsh-gl)"/>
    <path d="M 56 62 C 42 72, 36 88, 32 104" stroke="url(#hsh-body)" stroke-width="7" fill="none" stroke-linecap="round"/>
    <path d="M 32 104 l -4 8 M 32 104 l 0 10 M 32 104 l 4 8" stroke="#c8d4e0" stroke-width="1.6" opacity="0.7"/>
    <!-- the face: eyes black pits, the mouth open on its last scream -->
    <path d="M 62 34 C 60 16, 70 8, 80 8 C 90 8, 100 16, 98 34 C 98 48, 90 58, 80 60 C 70 58, 62 48, 62 34 Z" fill="url(#hsh-face)" filter="url(#hsh-cloth)"/>
    <path d="M 62 26 C 58 14, 66 4, 80 4 C 94 4, 102 14, 98 26 C 94 16, 66 16, 62 26 Z" fill="#8a96a4" opacity="0.7"/>
    <ellipse cx="71" cy="32" rx="5" ry="6" fill="#0a0e14"/><ellipse cx="89" cy="32" rx="5" ry="6" fill="#0a0e14"/>
    <circle cx="71" cy="33" r="1.2" fill="#c8e0ff" filter="url(#hsh-gl)"/><circle cx="89" cy="33" r="1.2" fill="#c8e0ff" filter="url(#hsh-gl)"/>
    <ellipse cx="80" cy="49" rx="6" ry="8" fill="#0a0e14"/>
    <path d="M 66 44 c -2 6 -1 12 -3 18 M 94 44 c 2 6 1 12 3 18" stroke="#c8d4e0" stroke-width="1" fill="none" opacity="0.5"/>
    </svg>
  `,

};
