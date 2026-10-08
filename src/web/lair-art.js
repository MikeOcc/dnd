// THE SEVEN LEVELS — art for the warning screen at the edge of a great lair,
// keyed by MonsterType. Inline SVG like the monster portraits; ids are
// prefixed ("asl-") since inline SVGs share the page's id namespace. The
// smoke and flames are animated in styles.css (.lair-smoke, .lair-flame).

'use strict';

const LAIR_ART = {

  // An empty throne of black iron, red-hot at the edges, on a dais of skulls,
  // between two braziers, wreathed in rising smoke. Asmodeus is not shown.
  Asmodeus: `
    <svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="An empty, smoking throne of black iron">
    <defs>
      <radialGradient id="asl-glow" cx="50%" cy="58%" r="55%">
        <stop offset="0" stop-color="#ff3a14" stop-opacity="0.55"/>
        <stop offset="0.45" stop-color="#8a0d05" stop-opacity="0.35"/>
        <stop offset="1" stop-color="#000" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="asl-iron" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#2a1210"/>
        <stop offset="0.6" stop-color="#140808"/>
        <stop offset="1" stop-color="#3a0c06"/>
      </linearGradient>
      <linearGradient id="asl-step" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#3b1610"/>
        <stop offset="1" stop-color="#120606"/>
      </linearGradient>
      <radialGradient id="asl-sigil" cx="50%" cy="50%" r="50%">
        <stop offset="0" stop-color="#ffd27a"/>
        <stop offset="0.5" stop-color="#ff4a12"/>
        <stop offset="1" stop-color="#7a0a00" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="asl-flame" cx="50%" cy="80%" r="60%">
        <stop offset="0" stop-color="#fff0a0"/>
        <stop offset="0.35" stop-color="#ffb02a"/>
        <stop offset="0.75" stop-color="#e2380c"/>
        <stop offset="1" stop-color="#7a0a00" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="asl-smoke" cx="50%" cy="50%" r="50%">
        <stop offset="0" stop-color="#7a3a30" stop-opacity="0.95"/>
        <stop offset="1" stop-color="#2a1210" stop-opacity="0"/>
      </radialGradient>
      <filter id="asl-hot" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="2.2" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <g id="asl-skull">
        <path d="M0 0 a7 7 0 0 1 14 0 v4 l-2 3 h-10 l-2 -3 z"/>
        <circle cx="4.5" cy="1" r="1.8" fill="#1a0604" stroke="none"/>
        <circle cx="9.5" cy="1" r="1.8" fill="#1a0604" stroke="none"/>
        <path d="M5 6 v2 M7 6 v2 M9 6 v2" stroke="#3a1a10"/>
      </g>
      <filter id="asl-blur"><feGaussianBlur stdDeviation="5"/></filter>
    </defs>

    <!-- infernal glow behind everything -->
    <rect x="0" y="0" width="400" height="240" fill="url(#asl-glow)"/>

    <!-- hanging chains -->
    <g stroke="#4a2a22" stroke-width="2" fill="none" opacity="0.8">
      <path d="M96 0 v70" stroke-dasharray="5 3"/>
      <path d="M304 0 v62" stroke-dasharray="5 3"/>
      <path d="M150 0 q8 30 0 46" stroke-dasharray="5 3"/>
      <path d="M252 0 q-8 26 0 40" stroke-dasharray="5 3"/>
    </g>
    <g fill="none" stroke="#6a3a30" stroke-width="2.5">
      <path d="M90 70 h12 l-6 10 z"/>
      <path d="M298 62 h12 l-6 10 z"/>
    </g>

    <!-- smoke rising behind the throne -->
    <g filter="url(#asl-blur)">
      <circle class="lair-smoke s1" cx="180" cy="70" r="26" fill="url(#asl-smoke)"/>
      <circle class="lair-smoke s2" cx="220" cy="64" r="30" fill="url(#asl-smoke)"/>
      <circle class="lair-smoke s3" cx="200" cy="80" r="24" fill="url(#asl-smoke)"/>
      <circle class="lair-smoke s4" cx="160" cy="88" r="20" fill="url(#asl-smoke)"/>
      <circle class="lair-smoke s5" cx="240" cy="86" r="22" fill="url(#asl-smoke)"/>
    </g>

    <!-- the dais: three steps -->
    <path d="M70 232 L330 232 L318 214 L82 214 Z" fill="url(#asl-step)" stroke="#a0240c" stroke-width="1.2"/>
    <path d="M94 214 L306 214 L296 198 L104 198 Z" fill="url(#asl-step)" stroke="#a0240c" stroke-width="1.2"/>
    <path d="M114 198 L286 198 L278 186 L122 186 Z" fill="url(#asl-step)" stroke="#c4300e" stroke-width="1.2"/>

    <!-- skulls set into the bottom step -->
    <g fill="#c9b9a4" stroke="#3a1a10" stroke-width="0.8">

      <use href="#asl-skull" x="96" y="221"/>
      <use href="#asl-skull" x="126" y="221"/>
      <use href="#asl-skull" x="156" y="221"/>
      <use href="#asl-skull" x="230" y="221"/>
      <use href="#asl-skull" x="260" y="221"/>
      <use href="#asl-skull" x="290" y="221"/>
      <use href="#asl-skull" x="193" y="221"/>
    </g>

    <!-- the throne: a tall spiked back, horned crest, clawed arms -->
    <g filter="url(#asl-hot)">
      <!-- back -->
      <path d="M160 186 L160 70 L170 54 L176 70 L184 40 L192 62 L200 22 L208 62 L216 40 L224 70 L230 54 L240 70 L240 186 Z"
            fill="url(#asl-iron)" stroke="#ff4a14" stroke-width="1.6" stroke-linejoin="round"/>
      <!-- horns sweeping out from the crest -->
      <path d="M170 60 C150 46 140 30 146 12 C152 30 162 40 176 50" fill="#1a0a08" stroke="#ff4a14" stroke-width="1.4"/>
      <path d="M230 60 C250 46 260 30 254 12 C248 30 238 40 224 50" fill="#1a0a08" stroke="#ff4a14" stroke-width="1.4"/>
      <!-- glowing sigil on the back: a burning ring with an inverted trident -->
      <circle cx="200" cy="104" r="20" fill="url(#asl-sigil)" opacity="0.85"/>
      <circle cx="200" cy="104" r="14" fill="none" stroke="#ffb04a" stroke-width="1.6"/>
      <path d="M200 92 v24 M192 112 q8 8 16 0 M192 112 v-6 M208 112 v-6" fill="none" stroke="#fff0b0" stroke-width="1.6" stroke-linecap="round"/>
      <!-- seat -->
      <path d="M148 150 L252 150 L258 170 L142 170 Z" fill="#1e0c0a" stroke="#ff4a14" stroke-width="1.6"/>
      <path d="M150 170 L250 170 L246 186 L154 186 Z" fill="#120606" stroke="#c4300e" stroke-width="1.2"/>
      <!-- arms, ending in claws -->
      <path d="M128 132 L160 132 L160 150 L134 150 Z" fill="#1e0c0a" stroke="#ff4a14" stroke-width="1.4"/>
      <path d="M240 132 L272 132 L266 150 L240 150 Z" fill="#1e0c0a" stroke="#ff4a14" stroke-width="1.4"/>
      <path d="M128 132 l-8 -6 M128 138 l-10 0 M130 144 l-8 6" stroke="#ff6a2a" stroke-width="2" stroke-linecap="round"/>
      <path d="M272 132 l8 -6 M272 138 l10 0 M270 144 l8 6" stroke="#ff6a2a" stroke-width="2" stroke-linecap="round"/>
      <!-- legs -->
      <path d="M150 170 L144 186 M250 170 L256 186" stroke="#ff4a14" stroke-width="2"/>
    </g>

    <!-- braziers on either side -->
    <g>
      <path d="M44 232 L70 232 L64 196 L50 196 Z" fill="#1a0a08" stroke="#a0240c" stroke-width="1.2"/>
      <path d="M34 196 L80 196 L72 184 L42 184 Z" fill="#2a1210" stroke="#ff4a14" stroke-width="1.2"/>
      <path class="lair-flame f1" d="M57 186 C40 170 46 150 57 132 C68 150 74 170 57 186 Z" fill="url(#asl-flame)"/>
      <path d="M330 232 L356 232 L350 196 L336 196 Z" fill="#1a0a08" stroke="#a0240c" stroke-width="1.2"/>
      <path d="M320 196 L366 196 L358 184 L328 184 Z" fill="#2a1210" stroke="#ff4a14" stroke-width="1.2"/>
      <path class="lair-flame f2" d="M343 186 C326 170 332 150 343 132 C354 150 360 170 343 186 Z" fill="url(#asl-flame)"/>
    </g>

    <!-- smoke curling up from the braziers, in front -->
    <g filter="url(#asl-blur)">
      <circle class="lair-smoke s6" cx="57" cy="122" r="14" fill="url(#asl-smoke)"/>
      <circle class="lair-smoke s7" cx="343" cy="122" r="14" fill="url(#asl-smoke)"/>
      <circle class="lair-smoke s8" cx="200" cy="150" r="34" fill="url(#asl-smoke)" opacity="0.6"/>
    </g>
    </svg>`,

  // An empty throne built of a hundred captured shields, in a towering hall
  // hung with red-eye banners, lit by torches, with war drums at the sides.
  // The Orc King is not shown.
  // The Lambton Worm's lair: bones and a heap of slimed gold, and a worm
  // coiled nine times around it, scarred where it was cut and grew back.
  'Lambton Worm': `
    <svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A cave floor strewn with bones and slimed gold, and coiled around it a vast scarred grey worm, one small eye open">
    <defs>
      <radialGradient id="lwl-glow" cx="50%" cy="70%" r="60%"><stop offset="0" stop-color="#6a5a20" stop-opacity="0.45"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
      <linearGradient id="lwl-hide" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a8a7a"/><stop offset="1" stop-color="#1e1e18"/></linearGradient>
      <radialGradient id="lwl-gold" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#f0d080"/><stop offset="1" stop-color="#6a4a10"/></radialGradient>
    </defs>
    <rect width="400" height="240" fill="#060605"/>
    <rect width="400" height="240" fill="url(#lwl-glow)"/>
    <path d="M 0 60 C 60 30, 120 50, 200 36 C 280 24, 340 50, 400 40 L 400 0 L 0 0 Z" fill="#0e0e0c"/>
    <ellipse cx="200" cy="184" rx="110" ry="22" fill="url(#lwl-gold)" opacity="0.9"/>
    <g fill="#d8ccaa" stroke="#3a3020" stroke-width="0.6">
      <path d="M 70 210 l 30 -6 l 2 4 l -30 6 Z"/><path d="M 300 212 l 30 4 l -1 4 l -30 -4 Z"/><path d="M 120 220 l 20 2 l 0 4 l -20 -2 Z"/>
      <path d="M 250 190 C 248 180, 258 174, 266 178 C 272 180, 272 190, 268 196 Z"/>
    </g>
    ${[0, 1, 2].map(i => `<ellipse cx="200" cy="${178 - i * 22}" rx="${140 - i * 22}" ry="${26 - i * 3}" fill="none" stroke="url(#lwl-hide)" stroke-width="${22 - i * 3}"/>`).join('')}
    <g stroke="#3a3a30" stroke-width="2.4" fill="none"><path d="M 96 170 q 4 -12 0 -24 M 300 170 q -4 -12 0 -24 M 150 130 q 3 -10 0 -18 M 250 130 q -3 -10 0 -18"/></g>
    <path d="M 236 112 C 250 90, 252 70, 240 52 L 222 54 C 230 70, 230 90, 220 112 Z" fill="url(#lwl-hide)" stroke="#0e0e0a" stroke-width="1"/>
    <ellipse cx="232" cy="48" rx="22" ry="14" fill="url(#lwl-hide)" stroke="#0e0e0a" stroke-width="1"/>
    <path d="M 216 44 C 222 50, 230 54, 240 56" stroke="#2a0606" stroke-width="3" fill="none"/>
    <circle cx="242" cy="42" r="2.4" fill="#e8c040"/><circle cx="242" cy="42" r="1" fill="#000"/>
    </svg>
  `,

  // The Barrow-King's barrow: a low dome of piled stones, grave-goods
  // glinting, a tall figure on a stone bier, frost creeping across the floor.
  'Barrow-King': `
    <svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A barrow: a low domed tomb of piled stone, grave-goods glinting, a crowned figure lying on a stone bier, frost on the floor">
    <defs>
      <radialGradient id="bkl-cold" cx="50%" cy="62%" r="60%"><stop offset="0" stop-color="#8ac8ff" stop-opacity="0.35"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
      <linearGradient id="bkl-stone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a5e62"/><stop offset="1" stop-color="#1a1c1e"/></linearGradient>
      <radialGradient id="bkl-gold" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#f0d080"/><stop offset="1" stop-color="#6a4a10"/></radialGradient>
    </defs>
    <rect width="400" height="240" fill="#050607"/>
    <rect width="400" height="240" fill="url(#bkl-cold)"/>
    <!-- the dome of piled stones -->
    <path d="M 30 200 C 40 70, 360 70, 370 200 Z" fill="#0c0e10"/>
    <g fill="url(#bkl-stone)" stroke="#08090a" stroke-width="1.5" opacity="0.85">
      ${Array.from({ length: 26 }, (_, i) => { const a = Math.PI * (0.08 + 0.84 * (i / 25)); const r = 158 + (i % 3) * 6; const x = 200 - Math.cos(a) * r; const y = 205 - Math.sin(a) * r * 0.82; return `<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="${14 + (i % 4) * 3}" ry="${9 + (i % 3) * 2}"/>`; }).join('')}
    </g>
    <!-- the standing stones at the mouth -->
    <path d="M 20 210 L 26 120 L 46 116 L 50 210 Z M 350 210 L 354 116 L 374 120 L 380 210 Z" fill="url(#bkl-stone)" stroke="#08090a" stroke-width="1.5"/>
    <path d="M 30 140 l 10 4 M 32 170 l 8 -3 M 360 150 l 10 -2" stroke="#2a2e32" stroke-width="1"/>
    <!-- grave-goods: cups, a shield, a heap of old gold -->
    <ellipse cx="110" cy="196" rx="34" ry="8" fill="url(#bkl-gold)" opacity="0.85"/>
    <path d="M 96 190 l 4 -10 l 8 0 l 4 10 Z M 120 192 l 3 -8 l 6 0 l 3 8 Z" fill="#a08030" stroke="#3a2a08" stroke-width="0.6"/>
    <circle cx="300" cy="186" r="16" fill="#3a3020" stroke="#7a6030" stroke-width="2"/><circle cx="300" cy="186" r="4" fill="#7a6030"/>
    <ellipse cx="292" cy="200" rx="24" ry="6" fill="url(#bkl-gold)" opacity="0.8"/>
    <g fill="#fff4c0"><circle cx="104" cy="192" r="1"/><circle cx="118" cy="195" r="0.8"/><circle cx="288" cy="198" r="0.9"/></g>
    <!-- the bier, and on it the king, crowned, the sword on his breast -->
    <path d="M 140 190 L 260 190 L 254 206 L 146 206 Z" fill="url(#bkl-stone)" stroke="#08090a" stroke-width="1.5"/>
    <path d="M 146 180 L 254 180 L 260 190 L 140 190 Z" fill="#4a4e52" stroke="#08090a" stroke-width="1"/>
    <path d="M 160 176 C 170 168, 230 168, 242 176 L 238 182 C 226 178, 174 178, 164 182 Z" fill="#2a2e34"/>
    <ellipse cx="156" cy="174" rx="9" ry="7" fill="#8a8e84"/>
    <path d="M 148 168 L 150 160 L 153 165 L 156 158 L 159 165 L 162 160 L 164 168 Z" fill="#8a5a2a"/>
    <path d="M 168 172 L 236 172" stroke="#9aa4ac" stroke-width="3"/><path d="M 172 168 L 172 176" stroke="#8a5a2a" stroke-width="3"/>
    <circle cx="153" cy="173" r="1.4" fill="#a0e0ff"/><circle cx="158" cy="173" r="1.4" fill="#a0e0ff"/>
    <!-- frost creeping toward you -->
    <g stroke="#d8f0ff" stroke-width="1" fill="none" opacity="0.6">
      <path d="M 200 206 l -8 14 l -6 4 M 200 206 l 10 16 l 8 2 M 170 208 l -14 12 M 230 208 l 16 12 M 192 220 l -4 8 M 212 222 l 4 8"/>
    </g>
    <ellipse cx="200" cy="222" rx="120" ry="14" fill="#c8e8ff" opacity="0.12"/>
    </svg>
  `,

  'Orc King': `
    <svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="An empty throne built of shields in a torchlit hall">
    <defs>
      <radialGradient id="okl-glow" cx="50%" cy="62%" r="60%">
        <stop offset="0" stop-color="#ff8a2a" stop-opacity="0.35"/>
        <stop offset="0.5" stop-color="#6a2a08" stop-opacity="0.25"/>
        <stop offset="1" stop-color="#000" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="okl-stone" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#1a1612"/>
        <stop offset="1" stop-color="#3a2e24"/>
      </linearGradient>
      <linearGradient id="okl-banner" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#5a0a06"/>
        <stop offset="1" stop-color="#2a0402"/>
      </linearGradient>
      <linearGradient id="okl-iron" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#a8acb4"/>
        <stop offset="0.5" stop-color="#4a4e56"/>
        <stop offset="1" stop-color="#16181c"/>
      </linearGradient>
      <radialGradient id="okl-flame" cx="50%" cy="80%" r="60%">
        <stop offset="0" stop-color="#fff0a0"/>
        <stop offset="0.35" stop-color="#ffb02a"/>
        <stop offset="0.75" stop-color="#e2380c"/>
        <stop offset="1" stop-color="#7a0a00" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="okl-smoke" cx="50%" cy="50%" r="50%">
        <stop offset="0" stop-color="#4a3a30" stop-opacity="0.8"/>
        <stop offset="1" stop-color="#1a1410" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="okl-eye" cx="50%" cy="50%" r="50%">
        <stop offset="0" stop-color="#ffcf6a"/>
        <stop offset="0.5" stop-color="#e0200a"/>
        <stop offset="1" stop-color="#5a0402"/>
      </radialGradient>
      <filter id="okl-blur"><feGaussianBlur stdDeviation="4"/></filter>
      <filter id="okl-hot" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="1.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <g id="okl-shield-round">
        <circle r="13" fill="url(#okl-iron)" stroke="#0c0d10" stroke-width="1"/>
        <circle r="4" fill="#2a2c32" stroke="#8a8e98" stroke-width="0.8"/>
      </g>
    </defs>

    <rect width="400" height="240" fill="#050403"/>
    <rect width="400" height="240" fill="url(#okl-glow)"/>

    <!-- pillars rising out of sight -->
    <g fill="url(#okl-stone)" stroke="#000" stroke-width="1">
      <rect x="18" y="0" width="34" height="240"/><rect x="348" y="0" width="34" height="240"/>
      <rect x="86" y="0" width="22" height="200" opacity="0.8"/><rect x="292" y="0" width="22" height="200" opacity="0.8"/>
    </g>
    <g stroke="#000" stroke-width="0.8" opacity="0.6">
      <path d="M 18 40 h 34 M 18 90 h 34 M 18 140 h 34 M 348 40 h 34 M 348 90 h 34 M 348 140 h 34"/>
    </g>

    <!-- red-eye banners hanging from the heights -->
    <g>
      <path d="M 120 0 L 160 0 L 160 92 L 140 82 L 120 92 Z" fill="url(#okl-banner)" stroke="#1a0202" stroke-width="1"/>
      <path d="M 240 0 L 280 0 L 280 92 L 260 82 L 240 92 Z" fill="url(#okl-banner)" stroke="#1a0202" stroke-width="1"/>
      <ellipse cx="140" cy="44" rx="11" ry="7" fill="url(#okl-eye)"/><ellipse cx="140" cy="44" rx="2" ry="5" fill="#140202"/>
      <ellipse cx="260" cy="44" rx="11" ry="7" fill="url(#okl-eye)"/><ellipse cx="260" cy="44" rx="2" ry="5" fill="#140202"/>
      <path d="M 124 70 l 4 6 M 156 70 l -4 6 M 244 70 l 4 6 M 276 70 l -4 6" stroke="#2a0402" stroke-width="1"/>
    </g>

    <!-- torches on the pillars, with smoke -->
    <g>
      <rect x="62" y="104" width="6" height="22" fill="#2a1a0a"/><path d="M 58 104 h 14 l -3 -6 h -8 z" fill="url(#okl-iron)"/>
      <path class="lair-flame f1" d="M 65 100 C 54 88 58 74 65 62 C 72 74 76 88 65 100 Z" fill="url(#okl-flame)"/>
      <rect x="332" y="104" width="6" height="22" fill="#2a1a0a"/><path d="M 328 104 h 14 l -3 -6 h -8 z" fill="url(#okl-iron)"/>
      <path class="lair-flame f2" d="M 335 100 C 324 88 328 74 335 62 C 342 74 346 88 335 100 Z" fill="url(#okl-flame)"/>
    </g>
    <g filter="url(#okl-blur)">
      <circle class="lair-smoke s6" cx="65" cy="52" r="12" fill="url(#okl-smoke)"/>
      <circle class="lair-smoke s7" cx="335" cy="52" r="12" fill="url(#okl-smoke)"/>
      <circle class="lair-smoke s2" cx="200" cy="70" r="30" fill="url(#okl-smoke)" opacity="0.5"/>
    </g>

    <!-- the dais -->
    <path d="M 96 236 L 304 236 L 294 220 L 106 220 Z" fill="#2a2218" stroke="#5a4630" stroke-width="1"/>
    <path d="M 116 220 L 284 220 L 276 206 L 124 206 Z" fill="#30271c" stroke="#6a5438" stroke-width="1"/>

    <!-- the throne of shields: round, kite and tower shields stacked into a high back -->
    <g filter="url(#okl-hot)">
      <path d="M 150 206 L 150 130 L 250 130 L 250 206 Z" fill="#14100c" stroke="#3a2e24" stroke-width="1"/>
      <use href="#okl-shield-round" x="162" y="120"/><use href="#okl-shield-round" x="188" y="112"/><use href="#okl-shield-round" x="214" y="112"/><use href="#okl-shield-round" x="240" y="120"/>
      <use href="#okl-shield-round" x="174" y="94"/><use href="#okl-shield-round" x="200" y="86"/><use href="#okl-shield-round" x="226" y="94"/>
      <use href="#okl-shield-round" x="187" y="66"/><use href="#okl-shield-round" x="213" y="66"/><use href="#okl-shield-round" x="200" y="44"/>
      <!-- painted kite shields among them -->
      <path d="M 150 140 l 12 -6 l 12 6 l -4 22 l -8 8 l -8 -8 z" fill="#2a3a6a" stroke="#0c0d10" stroke-width="1"/>
      <path d="M 226 140 l 12 -6 l 12 6 l -4 22 l -8 8 l -8 -8 z" fill="#6a5a1a" stroke="#0c0d10" stroke-width="1"/>
      <path d="M 156 148 h 12 M 162 140 v 22" stroke="#d8d0b0" stroke-width="1.5"/>
      <circle cx="238" cy="150" r="4" fill="none" stroke="#d8d0b0" stroke-width="1.2"/>
      <!-- a crown of spears above it -->
      <g stroke="#3a2a14" stroke-width="2"><path d="M 178 50 L 172 14 M 200 36 L 200 2 M 222 50 L 228 14"/></g>
      <g fill="url(#okl-iron)"><path d="M 172 14 l -3 -8 l 6 4 z"/><path d="M 200 2 l -3 -6 l 6 0 z" transform="translate(0 4)"/><path d="M 228 14 l 3 -8 l -6 4 z"/></g>
      <!-- seat and armrests of crossed shields -->
      <path d="M 158 176 L 242 176 L 248 192 L 152 192 Z" fill="#20180e" stroke="#7a5a2a" stroke-width="1.4"/>
      <path d="M 152 192 L 248 192 L 244 206 L 156 206 Z" fill="#140e08" stroke="#5a4020" stroke-width="1"/>
      <ellipse cx="146" cy="172" rx="14" ry="16" fill="url(#okl-iron)" stroke="#0c0d10" stroke-width="1"/>
      <ellipse cx="254" cy="172" rx="14" ry="16" fill="url(#okl-iron)" stroke="#0c0d10" stroke-width="1"/>
      <!-- the red eye of Vragathok painted on the central shield -->
      <circle cx="200" cy="86" r="13" fill="#3a0806"/>
      <ellipse cx="200" cy="86" rx="9" ry="6" fill="url(#okl-eye)"/><ellipse cx="200" cy="86" rx="1.6" ry="4.6" fill="#140202"/>
    </g>
    <!-- the great axe leaning against the throne -->
    <path d="M 262 206 L 284 120" stroke="#2a1a0a" stroke-width="4" stroke-linecap="round"/>
    <path d="M 280 128 C 296 116 306 132 300 148 C 292 142 284 140 276 142 Z" fill="url(#okl-iron)" stroke="#0c0d10" stroke-width="1"/>
    <path d="M 286 132 l 4 6 l -4 4" stroke="#ff3a14" stroke-width="1" fill="none" filter="url(#okl-hot)"/>

    <!-- war drums flanking the dais -->
    <g>
      <ellipse cx="70" cy="214" rx="22" ry="7" fill="#5a3a1a" stroke="#1a0e04" stroke-width="1"/>
      <path d="M 48 214 L 52 236 L 88 236 L 92 214" fill="#3a2410" stroke="#1a0e04" stroke-width="1"/>
      <path d="M 50 220 L 90 232 M 90 220 L 50 232" stroke="#c8b890" stroke-width="0.8" opacity="0.7"/>
      <ellipse cx="330" cy="214" rx="22" ry="7" fill="#5a3a1a" stroke="#1a0e04" stroke-width="1"/>
      <path d="M 308 214 L 312 236 L 348 236 L 352 214" fill="#3a2410" stroke="#1a0e04" stroke-width="1"/>
      <path d="M 310 220 L 350 232 M 350 220 L 310 232" stroke="#c8b890" stroke-width="0.8" opacity="0.7"/>
    </g>
    <!-- trophy skulls on spikes -->
    <g>
      <path d="M 118 236 V 182 M 282 236 V 182" stroke="#3a3e46" stroke-width="2"/>
      <g fill="#d8ccb0" stroke="#3a2a14" stroke-width="0.6">
        <path d="M 111 186 a 7 7 0 0 1 14 0 v 4 l -2 3 h -10 l -2 -3 z"/><path d="M 275 186 a 7 7 0 0 1 14 0 v 4 l -2 3 h -10 l -2 -3 z"/>
      </g>
      <g fill="#140602"><circle cx="115.5" cy="187" r="1.7"/><circle cx="120.5" cy="187" r="1.7"/><circle cx="279.5" cy="187" r="1.7"/><circle cx="284.5" cy="187" r="1.7"/></g>
    </g>
    </svg>`,
};

function getLairArt(monsterType) {
  return LAIR_ART[monsterType] || null;
}

// Asmodeus on his throne seen from the side (drawn facing right; the client
// mirrors it for the other side) and from behind. The front view is the lair
// art with his portrait seated on it.
const SIGHT_ART = {
  Asmodeus: {
    side: `
    <svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Asmodeus on his throne, seen from the side">
    <defs>
      <radialGradient id="ass-glow" cx="50%" cy="65%" r="55%"><stop offset="0" stop-color="#ff3a14" stop-opacity="0.5"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
      <linearGradient id="ass-iron" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0c0606"/><stop offset="0.6" stop-color="#2a1210"/><stop offset="1" stop-color="#140808"/></linearGradient>
      <radialGradient id="ass-skin" cx="40%" cy="30%" r="80%"><stop offset="0" stop-color="#ff6a4a"/><stop offset="0.45" stop-color="#c0200e"/><stop offset="1" stop-color="#3a0202"/></radialGradient>
      <linearGradient id="ass-horn" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#0a0404"/><stop offset="1" stop-color="#c8b4a8"/></linearGradient>
      <linearGradient id="ass-robe" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a0412"/><stop offset="1" stop-color="#050104"/></linearGradient>
      <linearGradient id="ass-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2a8"/><stop offset="1" stop-color="#6e4c0a"/></linearGradient>
      <linearGradient id="ass-wing" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a0610"/><stop offset="1" stop-color="#050001"/></linearGradient>
      <filter id="ass-hot" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="ass-blur"><feGaussianBlur stdDeviation="5"/></filter>
    </defs>
    <rect width="400" height="240" fill="url(#ass-glow)"/>
    <!-- smoke -->
    <g filter="url(#ass-blur)" fill="#5a2a24" opacity="0.6"><circle class="lair-smoke s1" cx="150" cy="60" r="24"/><circle class="lair-smoke s3" cx="190" cy="50" r="20"/></g>
    <!-- the dais, in profile -->
    <path d="M 70 232 L 330 232 L 320 214 L 80 214 Z" fill="#2a1410" stroke="#a0240c" stroke-width="1.2"/>
    <path d="M 100 214 L 300 214 L 292 198 L 108 198 Z" fill="#30160f" stroke="#c4300e" stroke-width="1.2"/>
    <g fill="#c9b9a4"><circle cx="100" cy="224" r="5"/><circle cx="140" cy="224" r="5"/><circle cx="180" cy="224" r="5"/><circle cx="220" cy="224" r="5"/><circle cx="260" cy="224" r="5"/><circle cx="300" cy="224" r="5"/></g>
    <!-- the throne's high back seen edge-on, spiked, red-hot along its rim -->
    <g filter="url(#ass-hot)">
      <path d="M 150 198 L 150 46 L 158 30 L 164 46 L 170 20 L 176 46 L 176 198 Z" fill="url(#ass-iron)" stroke="#ff4a14" stroke-width="1.6"/>
      <path d="M 170 150 L 250 150 L 254 168 L 166 168 Z" fill="#1e0c0a" stroke="#ff4a14" stroke-width="1.6"/>
      <path d="M 176 168 L 248 168 L 244 198 L 180 198 Z" fill="#120606" stroke="#c4300e" stroke-width="1.2"/>
      <path d="M 200 126 L 250 126 L 254 140 L 200 140 Z" fill="#1e0c0a" stroke="#ff4a14" stroke-width="1.4"/>
      <path d="M 254 128 l 10 -6 M 254 134 l 12 0 M 254 140 l 10 6" stroke="#ff6a2a" stroke-width="2" stroke-linecap="round"/>
    </g>
    <g class="lord-figure">
    <!-- a folded wing, rising behind him -->
    <path d="M 186 70 C 170 40 150 20 128 12 C 136 30 138 50 134 70 C 146 74 160 84 170 100 Z" fill="url(#ass-wing)" stroke="#000" stroke-width="1"/>
    <!-- Asmodeus, seated, in profile, facing right -->
    <path d="M 182 74 C 176 96 178 120 186 150 L 236 150 C 236 130 228 104 214 80 C 204 70 190 68 182 74 Z" fill="url(#ass-robe)" stroke="#000" stroke-width="1.2"/>
    <path d="M 196 82 C 206 90 212 104 212 120" stroke="url(#ass-skin)" stroke-width="12" stroke-linecap="round" fill="none"/>
    <path d="M 186 150 L 246 150 L 252 168 L 196 168 Z" fill="url(#ass-robe)" stroke="#000" stroke-width="1"/>
    <path d="M 240 168 L 246 196 L 262 198" stroke="url(#ass-skin)" stroke-width="10" stroke-linecap="round" fill="none"/>
    <!-- the arm resting on the throne's arm, the ruby rod upright -->
    <path d="M 206 96 C 220 110 232 122 246 126" stroke="url(#ass-skin)" stroke-width="10" stroke-linecap="round" fill="none"/>
    <path d="M 252 126 L 262 44" stroke="url(#ass-gold)" stroke-width="4" stroke-linecap="round"/>
    <path d="M 262 34 L 268 44 L 262 54 L 256 44 Z" fill="#ff1a3a" stroke="url(#ass-gold)" stroke-width="1.2" filter="url(#ass-hot)"/>
    <!-- head in profile: a long jaw, hooked nose, goatee, a great curling horn -->
    <path d="M 192 52 C 190 38 200 30 212 32 C 222 34 228 44 226 52 L 232 58 L 224 62 C 222 70 214 76 204 74 C 196 72 192 64 192 52 Z" fill="url(#ass-skin)" stroke="#1a0000" stroke-width="1.2"/>
    <path d="M 212 70 L 210 84 L 218 72 Z" fill="#0a0202"/>
    <path d="M 214 46 L 222 47" stroke="#1a0000" stroke-width="2.4" stroke-linecap="round"/>
    <ellipse cx="217" cy="50" rx="3" ry="1.6" fill="#ffd040" filter="url(#ass-hot)"/>
    <path d="M 222 64 L 226 64 M 223 62 l 1 3" stroke="#f4ecd8" stroke-width="1"/>
    <path d="M 198 38 C 186 22 168 22 164 36 C 162 48 172 54 180 48 C 174 44 176 34 184 34 C 192 34 196 40 200 44 Z" fill="url(#ass-horn)" stroke="#000" stroke-width="1"/>
    <path d="M 196 42 L 186 36 L 196 50 Z" fill="url(#ass-skin)" stroke="#1a0000" stroke-width="0.8"/>
    <g fill="url(#ass-gold)"><path d="M 204 32 L 206 22 L 209 31 Z"/><path d="M 211 31 L 214 20 L 216 32 Z"/></g>
    <!-- the tail, hanging from the seat and curling across the dais -->
    <path d="M 186 168 C 176 190 150 200 128 196 C 110 192 104 178 116 172" fill="none" stroke="#1a0000" stroke-width="8" stroke-linecap="round"/>
    <path d="M 186 168 C 176 190 150 200 128 196 C 110 192 104 178 116 172" fill="none" stroke="#c0200e" stroke-width="5" stroke-linecap="round"/>
    <path d="M 112 166 L 126 168 L 118 178 Z" fill="#c0200e" stroke="#1a0000" stroke-width="1"/>
    </g>
    <!-- braziers -->
    <path d="M 44 232 L 70 232 L 64 196 L 50 196 Z" fill="#1a0a08" stroke="#a0240c" stroke-width="1.2"/>
    <path class="lair-flame f1" d="M 57 194 C 40 178 46 158 57 140 C 68 158 74 178 57 194 Z" fill="#ff8a1a"/>
    <path d="M 330 232 L 356 232 L 350 196 L 336 196 Z" fill="#1a0a08" stroke="#a0240c" stroke-width="1.2"/>
    <path class="lair-flame f2" d="M 343 194 C 326 178 332 158 343 140 C 354 158 360 178 343 194 Z" fill="#ff8a1a"/>
    </svg>`,
    back: `
    <svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="The back of Asmodeus's throne">
    <defs>
      <radialGradient id="asb-glow" cx="50%" cy="60%" r="55%"><stop offset="0" stop-color="#ff3a14" stop-opacity="0.45"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
      <linearGradient id="asb-iron" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1210"/><stop offset="1" stop-color="#0c0404"/></linearGradient>
      <linearGradient id="asb-horn" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#0a0404"/><stop offset="1" stop-color="#c8b4a8"/></linearGradient>
      <linearGradient id="asb-wing" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a0610"/><stop offset="1" stop-color="#050001"/></linearGradient>
      <filter id="asb-hot" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="asb-blur"><feGaussianBlur stdDeviation="5"/></filter>
    </defs>
    <rect width="400" height="240" fill="url(#asb-glow)"/>
    <g filter="url(#asb-blur)" fill="#5a2a24" opacity="0.6"><circle class="lair-smoke s2" cx="200" cy="40" r="26"/><circle class="lair-smoke s4" cx="170" cy="56" r="18"/></g>
    <g class="lord-figure">
    <!-- his wings, spread wide behind the throne -->
    <path d="M 168 70 C 140 40 100 22 60 20 C 72 34 68 48 60 58 C 80 58 86 70 76 84 C 100 80 112 92 104 108 C 124 98 140 104 150 118 Z" fill="url(#asb-wing)" stroke="#000" stroke-width="1"/>
    <path d="M 232 70 C 260 40 300 22 340 20 C 328 34 332 48 340 58 C 320 58 314 70 324 84 C 300 80 288 92 296 108 C 276 98 260 104 250 118 Z" fill="url(#asb-wing)" stroke="#000" stroke-width="1"/>
    <!-- the tips of his horns, curling above the throne's crest -->
    <path d="M 186 40 C 170 26 150 24 142 34 C 136 44 144 54 154 50 C 150 44 154 36 162 36 C 172 36 178 42 182 48 Z" fill="url(#asb-horn)" stroke="#000" stroke-width="1"/>
    <path d="M 214 40 C 230 26 250 24 258 34 C 264 44 256 54 246 50 C 250 44 246 36 238 36 C 228 36 222 42 218 48 Z" fill="url(#asb-horn)" stroke="#000" stroke-width="1"/>
    </g>
    <!-- the dais -->
    <path d="M 70 232 L 330 232 L 318 214 L 82 214 Z" fill="#2a1410" stroke="#a0240c" stroke-width="1.2"/>
    <path d="M 94 214 L 306 214 L 296 198 L 104 198 Z" fill="#30160f" stroke="#c4300e" stroke-width="1.2"/>
    <!-- the throne's back: a wall of black iron, spiked, rivets glowing -->
    <g filter="url(#asb-hot)">
      <path d="M 150 198 L 150 66 L 162 50 L 170 66 L 182 36 L 192 60 L 200 22 L 208 60 L 218 36 L 230 66 L 238 50 L 250 66 L 250 198 Z" fill="url(#asb-iron)" stroke="#ff4a14" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M 160 80 L 240 80 M 160 120 L 240 120 M 160 160 L 240 160 M 200 70 L 200 196" stroke="#3a1a14" stroke-width="2"/>
      <g fill="#ff6a2a"><circle cx="164" cy="84" r="2"/><circle cx="236" cy="84" r="2"/><circle cx="164" cy="156" r="2"/><circle cx="236" cy="156" r="2"/></g>
      <!-- an inverted sigil burned into the back -->
      <circle cx="200" cy="120" r="22" fill="none" stroke="#ff4a14" stroke-width="1.6" opacity="0.8"/>
      <path d="M 200 98 L 213 138 L 179 113 L 221 113 L 187 138 Z" fill="none" stroke="#ff4a14" stroke-width="1.2" opacity="0.8"/>
    </g>
    <g class="lord-figure">
    <!-- his tail, hanging out from under the seat and across the dais -->
    <path d="M 238 196 C 260 204 286 200 300 186 C 312 174 304 160 292 166" fill="none" stroke="#1a0000" stroke-width="8" stroke-linecap="round"/>
    <path d="M 238 196 C 260 204 286 200 300 186 C 312 174 304 160 292 166" fill="none" stroke="#c0200e" stroke-width="5" stroke-linecap="round"/>
    <path d="M 286 160 L 298 156 L 296 170 Z" fill="#c0200e" stroke="#1a0000" stroke-width="1"/>
    </g>
    <!-- braziers -->
    <path d="M 44 232 L 70 232 L 64 196 L 50 196 Z" fill="#1a0a08" stroke="#a0240c" stroke-width="1.2"/>
    <path class="lair-flame f1" d="M 57 194 C 40 178 46 158 57 140 C 68 158 74 178 57 194 Z" fill="#ff8a1a"/>
    <path d="M 330 232 L 356 232 L 350 196 L 336 196 Z" fill="#1a0a08" stroke="#a0240c" stroke-width="1.2"/>
    <path class="lair-flame f2" d="M 343 194 C 326 178 332 158 343 140 C 354 158 360 178 343 194 Z" fill="#ff8a1a"/>
    </svg>`,
  },
};

function getSightArt(monsterType, view) {
  const art = SIGHT_ART[monsterType];
  if (!art) return null;
  if (view === 'back') return art.back || null;
  if (view === 'faces-left' || view === 'faces-right') return art.side || null;
  return null;
}
