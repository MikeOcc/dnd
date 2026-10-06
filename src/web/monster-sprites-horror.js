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
  'Asmodeus': `
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Asmodeus: a towering, gaunt devil of wet red flesh split by glowing fissures, horned, winged, grinning with too many teeth">
    <defs>
      ${wetSkinFilter('ha-hide')}
      ${horrorSkinFilter('ha-wing', { freq: '0.05 0.2', scale: 2, seed: 4, k: 1.2 })}
      ${horrorVignette('ha-vig', '50%', '45%', 0.45)}
      <radialGradient id="ha-fire" cx="50%" cy="85%" r="70%">
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
    <rect width="200" height="200" fill="url(#ha-fire)"/>
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
    </svg>
  `,

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

};
