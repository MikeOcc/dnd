// THE SEVEN LEVELS — a picture for each level's first-arrival scene, each
// darker and more ominous than the one before. 400×240, like the lair art;
// ids prefixed "lv<n>-" since inline SVGs share the page's ids. Flames,
// smoke and sparkles move via styles.css (.shop-flame, .obj-smoke,
// .obj-sparkle), still for reduced motion.

'use strict';

const LEVEL_ART = {

  // 1 — The Upper Passages: worn stone steps going down into the dark, a
  // torch in a bracket, cold air stirring dust. Still almost safe.
  1: `
    <svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A worn stone stairway descending into darkness, a torch burning in a bracket on the wall">
    <defs>
      <radialGradient id="lv1-torch" cx="22%" cy="38%" r="45%"><stop offset="0" stop-color="#ffb050" stop-opacity="0.45"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
      <linearGradient id="lv1-stone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6a645a"/><stop offset="1" stop-color="#1e1c18"/></linearGradient>
      <linearGradient id="lv1-dark" x1="0" y1="0" x2="0" y2="1"><stop offset="0.3" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.95"/></linearGradient>
    </defs>
    <rect width="400" height="240" fill="#0c0b09"/>
    <!-- the walls of the stairwell, narrowing -->
    <path d="M 0 0 L 140 60 L 140 240 L 0 240 Z" fill="#1e1b16"/><path d="M 400 0 L 260 60 L 260 240 L 400 240 Z" fill="#181510"/>
    <g stroke="#2e2a22" stroke-width="1.5" fill="none"><path d="M 0 40 L 140 90 M 0 100 L 140 130 M 0 170 L 140 180 M 400 40 L 260 90 M 400 100 L 260 130 M 400 170 L 260 180"/></g>
    <!-- steps going down -->
    ${Array.from({ length: 9 }, (_, i) => { const y = 70 + i * 19, w = 120 - i * 4; return `<path d="M ${200 - w} ${y} L ${200 + w} ${y} L ${200 + w - 3} ${y + 14} L ${200 - w + 3} ${y + 14} Z" fill="url(#lv1-stone)" stroke="#0c0b09" stroke-width="1"/><path d="M ${200 - w} ${y} L ${200 + w} ${y}" stroke="#8a8274" stroke-width="1" opacity="${0.5 - i * 0.05}"/>`; }).join('')}
    <rect x="140" y="60" width="120" height="14" fill="#050403"/>
    <!-- the torch -->
    <rect width="400" height="240" fill="url(#lv1-torch)"/>
    <path d="M 82 96 L 96 96 L 92 110 L 86 110 Z" fill="#3a2a1a"/>
    <path class="shop-flame" d="M 89 70 C 98 82, 97 90, 89 96 C 81 90, 80 82, 89 70 Z" fill="#ffb040"/>
    <path class="shop-flame" d="M 89 80 C 93 86, 93 90, 89 94 C 85 90, 85 86, 89 80 Z" fill="#fff0a0"/>
    <!-- dust in the cold draught -->
    <g fill="#c8b898" opacity="0.4" class="obj-sparkle"><circle cx="180" cy="120" r="0.9"/><circle cx="214" cy="96" r="0.7"/><circle cx="226" cy="140" r="0.8"/><circle cx="170" cy="160" r="0.7"/></g>
    <rect width="400" height="240" fill="url(#lv1-dark)"/>
    </svg>`,

  // 2 — The Festering Warrens: a low, dripping tunnel furred with mould,
  // bones dragged along the floor, and pairs of small eyes in the dark.
  2: `
    <svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A low tunnel furred with mould and dripping, bones on the floor, small eyes glinting in the dark ahead">
    <defs>
      <radialGradient id="lv2-sick" cx="50%" cy="55%" r="60%"><stop offset="0" stop-color="#4a6a20" stop-opacity="0.3"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
      <radialGradient id="lv2-hole" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#0c1008"/></radialGradient>
    </defs>
    <rect width="400" height="240" fill="#080a06"/>
    <rect width="400" height="240" fill="url(#lv2-sick)"/>
    <!-- the tunnel's arch, receding -->
    ${[0, 1, 2, 3].map(i => { const s = 1 - i * 0.22; return `<ellipse cx="200" cy="${130 + i * 4}" rx="${190 * s}" ry="${130 * s}" fill="none" stroke="#1e2414" stroke-width="${10 * s}"/>`; }).join('')}
    <ellipse cx="200" cy="146" rx="52" ry="38" fill="url(#lv2-hole)"/>
    <!-- mould on the walls -->
    <g fill="#5a7a2a" opacity="0.5">${Array.from({ length: 26 }, (_, i) => `<circle cx="${(i * 53) % 400}" cy="${30 + (i * 37) % 120}" r="${3 + (i % 4) * 2}"/>`).join('')}</g>
    <g fill="#8aa040" opacity="0.4">${Array.from({ length: 12 }, (_, i) => `<circle cx="${(i * 71 + 20) % 400}" cy="${40 + (i * 29) % 100}" r="${2 + (i % 3)}"/>`).join('')}</g>
    <!-- drips -->
    <g stroke="#6a8a40" stroke-width="1.2" opacity="0.6"><path d="M 90 40 v 18 M 130 30 v 12 M 290 36 v 20 M 320 50 v 10"/></g>
    <g fill="#8aa040" opacity="0.7"><circle cx="90" cy="62" r="1.6"/><circle cx="290" cy="60" r="1.6"/></g>
    <!-- bones dragged along the floor -->
    <path d="M 0 200 C 100 190, 300 190, 400 200 L 400 240 L 0 240 Z" fill="#0e100a"/>
    <g fill="#c8bc98" stroke="#3a3020" stroke-width="0.6"><path d="M 110 206 l 30 -4 l 1 4 l -30 4 Z"/><path d="M 250 214 l 24 3 l -1 4 l -24 -3 Z"/><path d="M 170 220 C 168 212, 176 208, 182 210 C 186 212, 186 220, 182 224 Z"/></g>
    <path d="M 100 222 C 150 216, 200 214, 250 206" stroke="#2a1a10" stroke-width="2" fill="none" opacity="0.6"/>
    <!-- eyes in the dark -->
    <g fill="#e8d040" class="obj-sparkle"><circle cx="186" cy="146" r="1.6"/><circle cx="194" cy="146" r="1.6"/><circle cx="214" cy="152" r="1.3"/><circle cx="221" cy="152" r="1.3"/><circle cx="200" cy="134" r="1.1"/><circle cx="206" cy="134" r="1.1"/></g>
    </svg>`,

  // 3 — The Crypts of the Restless: rows of stone coffins with their lids
  // pushed aside from within, grave-mist on the floor, a hand on one edge.
  3: `
    <svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A crypt of stone coffins with their lids pushed aside from within, grave-mist on the floor, a skeletal hand gripping one edge">
    <defs>
      <radialGradient id="lv3-cold" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#3a4a6a" stop-opacity="0.35"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
      <linearGradient id="lv3-stone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a5c62"/><stop offset="1" stop-color="#1a1c20"/></linearGradient>
      <filter id="lv3-mist" x="-10%" y="-30%" width="120%" height="160%"><feGaussianBlur stdDeviation="5"/></filter>
    </defs>
    <rect width="400" height="240" fill="#06070a"/>
    <rect width="400" height="240" fill="url(#lv3-cold)"/>
    <!-- vaulted arches -->
    <g fill="none" stroke="#1e2026" stroke-width="8"><path d="M 20 140 C 20 40, 180 40, 180 140"/><path d="M 220 140 C 220 40, 380 40, 380 140"/></g>
    <!-- coffins, receding in rows, lids pushed aside -->
    ${[[60, 150, 1], [300, 150, 1], [120, 118, 0.7], [250, 118, 0.7], [170, 98, 0.5], [215, 98, 0.5]].map(([x, y, s], i) => `
      <g transform="translate(${x} ${y}) scale(${s})">
        <path d="M -40 0 L 40 0 L 34 40 L -34 40 Z" fill="url(#lv3-stone)" stroke="#0a0a0c" stroke-width="1.5"/>
        <path d="M -42 -4 L 38 -14 L 44 -6 L -36 4 Z" fill="#6a6c72" stroke="#0a0a0c" stroke-width="1.5" transform="rotate(${i % 2 ? 12 : -10} 0 0) translate(${i % 2 ? 16 : -16} -6)"/>
        <path d="M -36 0 L 36 0 L 32 6 L -32 6 Z" fill="#050506"/>
      </g>`).join('')}
    <!-- a skeletal hand on the edge of the nearest -->
    <g stroke="#d8d0b8" stroke-width="2.2" stroke-linecap="round" fill="none"><path d="M 300 150 l -6 -10 M 304 150 l -2 -12 M 308 150 l 2 -12 M 312 150 l 6 -9"/></g>
    <!-- grave-mist on the floor -->
    <g fill="#8a9ab0" opacity="0.18" filter="url(#lv3-mist)" class="obj-smoke"><ellipse cx="100" cy="210" rx="120" ry="22"/><ellipse cx="300" cy="216" rx="130" ry="20"/><ellipse cx="200" cy="196" rx="90" ry="14"/></g>
    </svg>`,

  // 4 — The Caverns of Teeth: a vast cavern whose stalactites and
  // stalagmites close like jaws, the walls gouged by claws, and far off a
  // shape too big to be anything you want to meet.
  4: `
    <svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A vast cavern whose stalactites and stalagmites close like jaws, claw-gouged walls, and far off a huge shape in the dark">
    <defs>
      <radialGradient id="lv4-depth" cx="50%" cy="55%" r="55%"><stop offset="0" stop-color="#2a1a10" stop-opacity="0.6"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
      <linearGradient id="lv4-tooth" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a4e40"/><stop offset="1" stop-color="#1a140e"/></linearGradient>
    </defs>
    <rect width="400" height="240" fill="#050403"/>
    <rect width="400" height="240" fill="url(#lv4-depth)"/>
    <!-- the far shape -->
    <path d="M 214 150 C 212 120, 222 104, 236 102 C 250 104, 258 120, 256 150 Z" fill="#0e0a08"/>
    <circle cx="230" cy="112" r="1.4" fill="#c03010"/><circle cx="242" cy="112" r="1.4" fill="#c03010"/>
    <!-- jaws of stone -->
    <g fill="url(#lv4-tooth)" stroke="#0a0806" stroke-width="1">
      ${Array.from({ length: 13 }, (_, i) => { const x = i * 32 + 4, h = 40 + ((i * 37) % 50); return `<path d="M ${x} 0 L ${x + 30} 0 L ${x + 16} ${h} Z"/>`; }).join('')}
      ${Array.from({ length: 12 }, (_, i) => { const x = i * 34 + 16, h = 34 + ((i * 41) % 46); return `<path d="M ${x} 240 L ${x + 30} 240 L ${x + 14} ${240 - h} Z"/>`; }).join('')}
    </g>
    <!-- claw gouges on the walls -->
    <g stroke="#8a7a60" stroke-width="1.6" opacity="0.5" fill="none"><path d="M 30 100 l 30 40 M 38 96 l 30 40 M 46 92 l 30 40 M 340 90 l -26 44 M 348 94 l -26 44 M 356 98 l -26 44"/></g>
    </svg>`,

  // 5 — The Dragon Depths: scales big as shields on a floor of ash and
  // bones, smoke rolling, and in the dark ahead one vast eye opening.
  5: `
    <svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Scales big as shields on a floor of ash and bones, smoke rolling, and in the dark one vast slit eye opening">
    <defs>
      <radialGradient id="lv5-heat" cx="50%" cy="45%" r="55%"><stop offset="0" stop-color="#6a2a08" stop-opacity="0.55"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
      <radialGradient id="lv5-eye" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff2a0"/><stop offset="0.4" stop-color="#e0a020"/><stop offset="1" stop-color="#6a3000"/></radialGradient>
      <filter id="lv5-haze" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="10"/></filter>
      <radialGradient id="lv5-glow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffb030" stop-opacity="0.35"/><stop offset="1" stop-color="#ffb030" stop-opacity="0"/></radialGradient>
    </defs>
    <rect width="400" height="240" fill="#060302"/>
    <rect width="400" height="240" fill="url(#lv5-heat)"/>
    <!-- the eye in the dark -->
    <circle cx="200" cy="96" r="70" fill="url(#lv5-glow)"/>
    <path d="M 140 96 C 170 70, 230 70, 260 96 C 230 122, 170 122, 140 96 Z" fill="url(#lv5-eye)"/>
    <path d="M 200 72 C 206 86, 206 106, 200 120 C 194 106, 194 86, 200 72 Z" fill="#050200"/>
    <path d="M 136 96 C 168 64, 232 64, 264 96 M 136 96 C 168 128, 232 128, 264 96" stroke="#1a0a04" stroke-width="4" fill="none"/>
    <!-- smoke -->
    <g fill="#3a3028" opacity="0.55" class="obj-smoke" filter="url(#lv5-haze)"><circle cx="70" cy="130" r="30"/><circle cx="330" cy="120" r="34"/><circle cx="110" cy="70" r="22"/><circle cx="300" cy="60" r="20"/></g>
    <!-- the floor: ash, bones, shed scales -->
    <path d="M 0 180 C 100 172, 300 172, 400 180 L 400 240 L 0 240 Z" fill="#141008"/>
    ${[[70, 200, '#8a1a10'], [150, 214, '#2a4a8a'], [260, 206, '#1e5a22'], [330, 218, '#8a1a10']].map(([x, y, c]) => `<path d="M ${x - 18} ${y} C ${x - 18} ${y - 18}, ${x + 18} ${y - 18}, ${x + 18} ${y} C ${x + 10} ${y + 6}, ${x - 10} ${y + 6}, ${x - 18} ${y} Z" fill="${c}" stroke="#000" stroke-width="1" opacity="0.85"/>`).join('')}
    <g fill="#c8bc98" stroke="#3a3020" stroke-width="0.6"><path d="M 190 222 l 30 -3 l 1 4 l -30 3 Z"/><path d="M 110 230 C 108 222, 116 218, 122 220 C 126 222, 126 230, 122 234 Z"/></g>
    </svg>`,

  // 6 — The Sunken Abyss: black water between drowned pillars, ripples
  // spreading from something below, a single tentacle breaking the surface,
  // and a pale glow far down where nothing should be.
  6: `
    <svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Black water between drowned pillars, a pale glow far below, and a single tentacle breaking the surface">
    <defs>
      <radialGradient id="lv6-below" cx="50%" cy="80%" r="45%"><stop offset="0" stop-color="#40a090" stop-opacity="0.45"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
      <linearGradient id="lv6-pillar" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2a3034"/><stop offset="0.5" stop-color="#3e464c"/><stop offset="1" stop-color="#14181a"/></linearGradient>
      <linearGradient id="lv6-water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#06100e"/><stop offset="1" stop-color="#010303"/></linearGradient>
    </defs>
    <rect width="400" height="240" fill="#020404"/>
    <!-- drowned pillars, broken -->
    ${[[40, 30, 26], [110, 50, 20], [290, 44, 22], [360, 26, 28], [190, 80, 14]].map(([x, top, w]) => `<path d="M ${x} ${top} L ${x + w} ${top + 6} L ${x + w} 150 L ${x} 150 Z" fill="url(#lv6-pillar)"/><path d="M ${x - 4} ${top} L ${x + w + 4} ${top + 6} L ${x + w + 2} ${top + 12} L ${x - 2} ${top + 6} Z" fill="#4a5258"/>`).join('')}
    <!-- the black water, and the glow below it -->
    <path d="M 0 140 L 400 140 L 400 240 L 0 240 Z" fill="url(#lv6-water)"/>
    <rect y="140" width="400" height="100" fill="url(#lv6-below)"/>
    <g fill="none" stroke="#3a6a62" stroke-width="1" opacity="0.6"><ellipse cx="250" cy="170" rx="30" ry="5"/><ellipse cx="250" cy="170" rx="56" ry="9"/><ellipse cx="250" cy="170" rx="86" ry="14"/></g>
    <!-- a tentacle breaking the surface -->
    <path d="M 240 170 C 236 140, 254 120, 248 92 C 244 74, 256 64, 266 70 C 258 74, 256 86, 262 102 C 268 126, 256 150, 262 170 Z" fill="#2a3a40" stroke="#0a1014" stroke-width="1"/>
    <g fill="#5a7a80">${Array.from({ length: 6 }, (_, i) => `<circle cx="${252 + (i % 2) * 4}" cy="${150 - i * 12}" r="2"/>`).join('')}</g>
    <path d="M 240 140 C 236 134, 244 130, 248 132" stroke="#8ab0b8" stroke-width="0.8" fill="none" opacity="0.6"/>
    </svg>`,

  // 7 — The Infernal Throne: a plain of black stone cut by rivers of fire,
  // horned shapes moving beyond the flames, and far off at the center, a
  // throne of black iron with something on it.
  7: `
    <svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A plain of black stone cut by rivers of fire, horned shapes beyond the flames, and far off a throne of black iron">
    <defs>
      <radialGradient id="lv7-sky" cx="50%" cy="45%" r="70%"><stop offset="0" stop-color="#5a0a04" stop-opacity="0.8"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
      <linearGradient id="lv7-lava" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff6010"/><stop offset="0.5" stop-color="#ffd040"/><stop offset="1" stop-color="#ff4008"/></linearGradient>
      <filter id="lv7-glow" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <rect width="400" height="240" fill="#050101"/>
    <rect width="400" height="240" fill="url(#lv7-sky)"/>
    <!-- the throne, far off, with something on it -->
    <path d="M 186 118 L 186 80 L 192 68 L 198 80 L 202 80 L 208 68 L 214 80 L 214 118 Z" fill="#0a0303" stroke="#5a1008" stroke-width="1"/>
    <path d="M 192 92 C 192 84, 208 84, 208 92 L 208 112 L 192 112 Z" fill="#000"/>
    <path d="M 194 88 C 190 80, 190 74, 194 72 M 206 88 C 210 80, 210 74, 206 72" stroke="#2a0a06" stroke-width="2" fill="none"/>
    <circle cx="197" cy="96" r="1.2" fill="#ffb030" filter="url(#lv7-glow)"/><circle cx="203" cy="96" r="1.2" fill="#ffb030" filter="url(#lv7-glow)"/>
    <!-- the plain, and rivers of fire across it -->
    <path d="M 0 122 L 400 122 L 400 240 L 0 240 Z" fill="#0c0606"/>
    <g fill="none" stroke="url(#lv7-lava)" filter="url(#lv7-glow)">
      <path d="M 0 150 C 80 140, 140 170, 200 156 C 260 142, 320 168, 400 152" stroke-width="5"/>
      <path d="M 0 200 C 100 190, 170 220, 250 204 C 320 190, 360 214, 400 206" stroke-width="7"/>
      <path d="M 120 130 C 150 134, 170 128, 196 124" stroke-width="2"/>
    </g>
    <!-- horned shapes beyond the flames -->
    <g fill="#000">
      <path d="M 60 146 L 62 120 L 58 112 L 64 118 L 68 112 L 66 120 L 70 146 Z"/>
      <path d="M 320 148 L 323 116 L 318 106 L 326 114 L 332 106 L 328 116 L 332 148 Z"/>
      <path d="M 140 134 L 142 118 L 139 112 L 144 116 L 148 112 L 145 118 L 147 134 Z"/>
    </g>
    <g fill="#ff9030" opacity="0.8" class="obj-sparkle"><circle cx="80" cy="120" r="1.2"/><circle cx="260" cy="110" r="1"/><circle cx="350" cy="130" r="1.3"/><circle cx="180" cy="140" r="0.9"/></g>
    </svg>`,
};

/** The picture for a level's first-arrival scene. */
function getLevelArt(level) {
  return LEVEL_ART[level] || null;
}
