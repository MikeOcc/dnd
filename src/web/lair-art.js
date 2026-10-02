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
      <!-- the red eye of Gruumsh painted on the central shield -->
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
