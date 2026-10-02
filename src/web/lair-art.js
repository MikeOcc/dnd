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
};

function getLairArt(monsterType) {
  return LAIR_ART[monsterType] || null;
}
