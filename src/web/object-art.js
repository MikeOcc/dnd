// THE SEVEN LEVELS — pictures for chests, altars and fountains: the thing
// itself while you decide what to do with it, then how it turned out (a
// chest open on its gold, or blown apart by its trap; an altar's blessing; a
// fountain's water, sweet or foul). 400×240 like the shop art; ids are
// prefixed per picture ("oa-<kind>-<moment>-") since inline SVGs share the
// page's ids. Flames, sparkles and smoke move via styles.css (.shop-flame,
// .obj-sparkle, .obj-smoke, .obj-burst), all still for reduced motion.

'use strict';

/** The dungeon around it: a dark stone room, a little light on the floor. */
function oaRoom(p, glow = '#3a2a1a') {
  return `
    <defs>
      <radialGradient id="${p}-floor" cx="50%" cy="80%" r="60%"><stop offset="0" stop-color="${glow}" stop-opacity="0.7"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
      <radialGradient id="${p}-vig" cx="50%" cy="55%" r="70%"><stop offset="0.5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.9"/></radialGradient>
      <linearGradient id="${p}-wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6a4426"/><stop offset="1" stop-color="#2a170a"/></linearGradient>
      <linearGradient id="${p}-iron" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6a6660"/><stop offset="1" stop-color="#222020"/></linearGradient>
      <linearGradient id="${p}-stone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a746a"/><stop offset="1" stop-color="#2a2622"/></linearGradient>
      <radialGradient id="${p}-torch" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ff9a30" stop-opacity="0.22"/><stop offset="1" stop-color="#ff9a30" stop-opacity="0"/></radialGradient>
      <radialGradient id="${p}-gold" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#fff2a8"/><stop offset="0.5" stop-color="#e0b040"/><stop offset="1" stop-color="#7a5010"/></radialGradient>
    </defs>
    <rect width="400" height="240" fill="#0a0806"/>
    <g opacity="0.5" stroke="#1a140e" stroke-width="2" fill="none">
      <path d="M 0 36 H 400 M 0 76 H 400 M 0 116 H 400 M 0 156 H 400"/>
      <path d="M 50 0 V 36 M 150 0 V 36 M 250 0 V 36 M 350 0 V 36 M 100 36 V 76 M 200 36 V 76 M 300 36 V 76 M 50 76 V 116 M 150 76 V 116 M 250 76 V 116 M 350 76 V 116 M 100 116 V 156 M 300 116 V 156"/>
    </g>
    <path d="M 0 176 L 400 176 L 400 240 L 0 240 Z" fill="#110d0a"/>
    <path d="M 0 176 H 400" stroke="#241c14" stroke-width="2"/>
    <path d="M 40 200 L 120 196 M 260 204 L 360 200 M 150 222 L 250 218" stroke="#1c1610" stroke-width="1.5"/>
    <rect width="400" height="240" fill="url(#${p}-floor)"/>`;
}
const oaVig = (p) => `<rect width="400" height="240" fill="url(#${p}-vig)"/>`;

/** A torch on the wall, flickering. */
const oaTorch = (p, x, y) => `
    <g transform="translate(${x} ${y})">
      <circle r="46" fill="url(#${p}-torch)"/>
      <path d="M -3 0 L 3 0 L 2 22 L -2 22 Z" fill="#3a2414"/>
      <path class="shop-flame" d="M 0 -18 C 7 -8, 6 -2, 0 2 C -6 -2, -7 -8, 0 -18 Z" fill="#ffb040"/>
      <path class="shop-flame" d="M 0 -10 C 3 -5, 3 -2, 0 0 C -3 -2, -3 -5, 0 -10 Z" fill="#fff0a0"/>
    </g>`;

/** A banded, iron-bound chest; open or shut, sitting on the floor. */
function oaChest(p, { open = false, trap = false } = {}) {
  const lid = open
    ? `<path d="M 140 112 L 260 112 L 272 66 C 240 52, 160 52, 128 66 Z" fill="url(#${p}-wood)" stroke="#1a0e06" stroke-width="2"/>
       <path d="M 134 70 C 164 58, 236 58, 266 70" stroke="url(#${p}-iron)" stroke-width="7" fill="none"/>
       <path d="M 138 92 L 262 92" stroke="url(#${p}-iron)" stroke-width="6"/>
       <path d="M 146 108 L 254 108 L 262 74 C 232 64, 168 64, 138 74 Z" fill="#1a0e06" opacity="0.7"/>`
    : `<path d="M 130 118 C 130 92, 150 80, 200 80 C 250 80, 270 92, 270 118 Z" fill="url(#${p}-wood)" stroke="#1a0e06" stroke-width="2"/>
       <path d="M 150 84 C 150 100, 150 110, 150 118 M 250 84 C 250 100, 250 110, 250 118" stroke="url(#${p}-iron)" stroke-width="7"/>
       <path d="M 132 104 C 160 98, 240 98, 268 104" stroke="#1a0e06" stroke-width="1.2" fill="none" opacity="0.6"/>`;
  return `
    <ellipse cx="200" cy="184" rx="96" ry="10" fill="#000" opacity="0.6"/>
    ${lid}
    <!-- the body -->
    <rect x="130" y="116" width="140" height="66" rx="3" fill="url(#${p}-wood)" stroke="#1a0e06" stroke-width="2"/>
    <path d="M 132 134 H 268 M 132 152 H 268 M 132 168 H 268" stroke="#2a170a" stroke-width="1.2" opacity="0.7"/>
    <rect x="144" y="116" width="10" height="66" fill="url(#${p}-iron)"/><rect x="246" y="116" width="10" height="66" fill="url(#${p}-iron)"/>
    <rect x="130" y="116" width="140" height="7" fill="url(#${p}-iron)"/><rect x="130" y="176" width="140" height="6" fill="url(#${p}-iron)"/>
    <g fill="#9a9488"><circle cx="149" cy="130" r="1.6"/><circle cx="149" cy="160" r="1.6"/><circle cx="251" cy="130" r="1.6"/><circle cx="251" cy="160" r="1.6"/></g>
    <!-- the lock plate -->
    <path d="M 188 116 L 212 116 L 212 140 L 200 148 L 188 140 Z" fill="url(#${p}-iron)" stroke="#111" stroke-width="1"/>
    <path d="M 198 124 L 202 124 L 202 132 L 200 136 L 198 132 Z" fill="#050505"/>
    ${trap ? `
    <!-- the trap you found: a needle in the lock, a wire to the hinge, a sigil scratched on the lid -->
    <path d="M 200 128 L 214 120" stroke="#e0e0f0" stroke-width="1.4"/><circle cx="214" cy="120" r="1.4" fill="#6aff6a" class="obj-sparkle"/>
    <path d="M 212 136 C 230 140, 248 132, 262 118" stroke="#c8c8d0" stroke-width="0.8" fill="none" stroke-dasharray="3 2"/>
    <path d="M 176 96 l 8 -8 l 8 8 l -8 8 Z M 184 88 v 16 M 176 96 h 16" stroke="#ff5030" stroke-width="1.2" fill="none" opacity="0.8" class="obj-sparkle"/>` : ''}`;
}

/** Heaped gold and gems spilling light out of an open chest. */
const oaTreasure = (p) => `
    <ellipse cx="200" cy="112" rx="64" ry="14" fill="url(#${p}-gold)"/>
    <g fill="url(#${p}-gold)" stroke="#7a5010" stroke-width="0.6">
      <circle cx="172" cy="108" r="6"/><circle cx="186" cy="104" r="6"/><circle cx="214" cy="104" r="6"/><circle cx="228" cy="108" r="6"/><circle cx="200" cy="100" r="6"/>
      <circle cx="160" cy="186" r="5"/><circle cx="170" cy="190" r="5"/><circle cx="246" cy="188" r="5"/>
    </g>
    <path d="M 192 96 l 6 -10 l 6 10 Z" fill="#d81a34"/><path d="M 210 100 l 5 -9 l 5 9 Z" fill="#2a5ad8"/><path d="M 178 100 l 4 -8 l 4 8 Z" fill="#30b060"/>
    <path d="M 150 110 C 170 60, 230 60, 250 110" fill="#ffd860" opacity="0.12"/>
    <g class="obj-sparkle" fill="#fff8d0"><path d="M 184 82 l 1.5 4 l 4 1.5 l -4 1.5 l -1.5 4 l -1.5 -4 l -4 -1.5 l 4 -1.5 Z"/><path d="M 222 76 l 1 3 l 3 1 l -3 1 l -1 3 l -1 -3 l -3 -1 l 3 -1 Z"/></g>`;

/** A blast: a flash, fire, flying splinters and iron, smoke. */
const oaBoom = (p) => `
    <defs>
      <radialGradient id="${p}-blast" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fffbe0"/><stop offset="0.3" stop-color="#ffc040"/><stop offset="0.6" stop-color="#e0400c" stop-opacity="0.85"/><stop offset="1" stop-color="#600800" stop-opacity="0"/></radialGradient>
    </defs>
    <ellipse cx="200" cy="184" rx="110" ry="12" fill="#000" opacity="0.7"/>
    <!-- what's left of the chest: a charred, burst box -->
    <path d="M 136 182 L 140 140 L 156 150 L 170 128 L 186 146 L 204 124 L 220 146 L 236 130 L 248 150 L 262 138 L 266 182 Z" fill="#2a170a" stroke="#0a0604" stroke-width="2"/>
    <path d="M 140 160 H 264 M 150 140 V 182 M 250 144 V 182" stroke="#3a3632" stroke-width="5"/>
    <g class="obj-burst">
      <circle cx="200" cy="120" r="92" fill="url(#${p}-blast)"/>
      <path d="M 200 120 L 120 40 M 200 120 L 290 34 M 200 120 L 340 110 M 200 120 L 60 120 M 200 120 L 110 186 M 200 120 L 300 190 M 200 120 L 200 20" stroke="#fff0a0" stroke-width="2" opacity="0.6"/>
    </g>
    <!-- splinters and bands flying -->
    <g fill="#5a3a1e" stroke="#1a0e06" stroke-width="0.8">
      <path d="M 96 52 l 18 -6 l 3 4 l -18 6 Z" transform="rotate(-20 100 50)"/><path d="M 300 44 l 22 4 l -2 5 l -22 -4 Z"/>
      <path d="M 70 150 l 16 -10 l 3 4 l -16 10 Z"/><path d="M 320 160 l 18 8 l -2 4 l -18 -8 Z"/><path d="M 160 26 l 10 -14 l 4 2 l -10 14 Z"/>
    </g>
    <path d="M 250 70 C 270 60, 290 62, 306 72" stroke="#5a5650" stroke-width="5" fill="none"/>
    <g fill="#ffd040"><circle cx="122" cy="80" r="2"/><circle cx="286" cy="96" r="2.4"/><circle cx="150" cy="60" r="1.6"/><circle cx="262" cy="56" r="1.8"/><circle cx="96" cy="128" r="1.6"/><circle cx="320" cy="130" r="2"/></g>
    <!-- smoke rolling up -->
    <g class="obj-smoke" fill="#2a2420" opacity="0.7">
      <circle cx="170" cy="70" r="26"/><circle cx="214" cy="56" r="32"/><circle cx="250" cy="76" r="24"/><circle cx="196" cy="34" r="22"/>
    </g>`;

/** A stone altar, candles at its corners, a carved sun on its face. */
function oaAltar(p, blessed = false) {
  return `
    <ellipse cx="200" cy="184" rx="110" ry="10" fill="#000" opacity="0.6"/>
    ${blessed ? `
    <defs><linearGradient id="${p}-beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6c0" stop-opacity="0.75"/><stop offset="1" stop-color="#ffd860" stop-opacity="0.08"/></linearGradient>
      <radialGradient id="${p}-halo" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff8d8" stop-opacity="0.8"/><stop offset="1" stop-color="#ffd860" stop-opacity="0"/></radialGradient></defs>
    <path d="M 160 0 L 240 0 L 290 180 L 110 180 Z" fill="url(#${p}-beam)"/>
    <circle cx="200" cy="108" r="80" fill="url(#${p}-halo)"/>` : ''}
    <!-- steps and the block -->
    <rect x="110" y="168" width="180" height="14" fill="url(#${p}-stone)" stroke="#141210"/>
    <rect x="126" y="156" width="148" height="14" fill="url(#${p}-stone)" stroke="#141210"/>
    <rect x="140" y="104" width="120" height="54" fill="url(#${p}-stone)" stroke="#141210" stroke-width="1.5"/>
    <rect x="132" y="96" width="136" height="10" fill="#8a8478" stroke="#141210"/>
    <path d="M 150 112 L 158 150 M 242 112 L 236 148 M 196 142 L 204 156" stroke="#1a1814" stroke-width="1" opacity="0.7"/>
    <!-- the carved sun -->
    <circle cx="200" cy="130" r="10" fill="none" stroke="${blessed ? '#ffe070' : '#2a2620'}" stroke-width="2"/>
    <path d="M 200 114 V 118 M 200 142 V 146 M 184 130 H 188 M 212 130 H 216 M 189 119 l 3 3 M 208 138 l 3 3 M 211 119 l -3 3 M 192 138 l -3 3" stroke="${blessed ? '#ffe070' : '#2a2620'}" stroke-width="2"/>
    <!-- a cloth, a chalice, candles -->
    <path d="M 176 96 L 224 96 L 220 120 L 180 120 Z" fill="#5a0a10" opacity="0.9"/>
    <path d="M 194 96 L 194 86 C 188 84, 188 76, 192 74 L 208 74 C 212 76, 212 84, 206 86 L 206 96 Z" fill="url(#${p}-gold)"/>
    ${[142, 258].map(x => `
    <rect x="${x - 4}" y="74" width="8" height="22" fill="#e8dcb8"/>
    <path class="shop-flame" d="M ${x} 62 C ${x + 5} 70, ${x + 5} 73, ${x} 75 C ${x - 5} 73, ${x - 5} 70, ${x} 62 Z" fill="#ffc456"/>
    <circle cx="${x}" cy="70" r="16" fill="#ff9a30" opacity="0.12"/>`).join('')}
    ${blessed ? `<g class="obj-sparkle" fill="#fff8d0">
      <path d="M 170 60 l 1.5 4 l 4 1.5 l -4 1.5 l -1.5 4 l -1.5 -4 l -4 -1.5 l 4 -1.5 Z"/><path d="M 236 50 l 1.5 4 l 4 1.5 l -4 1.5 l -1.5 4 l -1.5 -4 l -4 -1.5 l 4 -1.5 Z"/>
      <path d="M 204 36 l 1 3 l 3 1 l -3 1 l -1 3 l -1 -3 l -3 -1 l 3 -1 Z"/><path d="M 150 40 l 1 3 l 3 1 l -3 1 l -1 3 l -1 -3 l -3 -1 l 3 -1 Z"/></g>` : ''}`;
}

/** A stone fountain: a carved spout-head over a round basin. */
function oaFountain(p, mood = 'idle') {
  const water = mood === 'tainted' ? '#2a4a10' : mood === 'refreshed' ? '#5ab8ff' : '#2a5a8a';
  const light = mood === 'tainted' ? '#8aff40' : '#a8e0ff';
  return `
    <defs>
      <linearGradient id="${p}-water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${light}" stop-opacity="0.85"/><stop offset="1" stop-color="${water}"/></linearGradient>
      <radialGradient id="${p}-aura" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="${light}" stop-opacity="${mood === 'idle' ? 0.12 : 0.45}"/><stop offset="1" stop-color="${light}" stop-opacity="0"/></radialGradient>
    </defs>
    <ellipse cx="200" cy="186" rx="110" ry="10" fill="#000" opacity="0.6"/>
    <circle cx="200" cy="130" r="${mood === 'idle' ? 70 : 100}" fill="url(#${p}-aura)"/>
    <!-- the back wall's carved head, water pouring from its mouth -->
    <rect x="176" y="34" width="48" height="96" fill="url(#${p}-stone)" stroke="#141210"/>
    <ellipse cx="200" cy="60" rx="16" ry="18" fill="#6a6458" stroke="#141210"/>
    <path d="M 192 56 l 4 0 M 204 56 l 4 0 M 196 66 Q 200 70 204 66" stroke="#1a1814" stroke-width="2" fill="none"/>
    <ellipse cx="200" cy="72" rx="4" ry="3" fill="#0a0a0a"/>
    <path d="M 198 74 C 196 100, 198 120, 196 146 L 204 146 C 202 120, 204 100, 202 74 Z" fill="url(#${p}-water)" opacity="0.85"/>
    <!-- the basin -->
    <path d="M 120 146 C 120 176, 280 176, 280 146 Z" fill="url(#${p}-stone)" stroke="#141210" stroke-width="1.5"/>
    <ellipse cx="200" cy="146" rx="80" ry="12" fill="#8a8478" stroke="#141210"/>
    <ellipse cx="200" cy="147" rx="72" ry="8" fill="url(#${p}-water)"/>
    <path d="M 168 146 q 8 -3 16 0 M 212 148 q 8 -3 16 0 M 190 150 q 6 -2 12 0" stroke="#fff" stroke-width="0.8" fill="none" opacity="0.4" class="obj-sparkle"/>
    <rect x="186" y="170" width="28" height="12" fill="url(#${p}-stone)" stroke="#141210"/>
    ${mood === 'refreshed' ? `<g class="obj-sparkle" fill="#e8f6ff">
      <path d="M 160 120 l 1.5 4 l 4 1.5 l -4 1.5 l -1.5 4 l -1.5 -4 l -4 -1.5 l 4 -1.5 Z"/><path d="M 240 112 l 1.5 4 l 4 1.5 l -4 1.5 l -1.5 4 l -1.5 -4 l -4 -1.5 l 4 -1.5 Z"/>
      <path d="M 220 96 l 1 3 l 3 1 l -3 1 l -1 3 l -1 -3 l -3 -1 l 3 -1 Z"/><path d="M 178 100 l 1 3 l 3 1 l -3 1 l -1 3 l -1 -3 l -3 -1 l 3 -1 Z"/></g>` : ''}
    ${mood === 'tainted' ? `
    <!-- bubbles breaking on scummed water, and a sickly reek rising -->
    <g fill="none" stroke="#a8ff60" stroke-width="1"><circle cx="176" cy="146" r="3"/><circle cx="214" cy="148" r="4"/><circle cx="234" cy="145" r="2"/><circle cx="192" cy="149" r="2.4"/></g>
    <g class="obj-smoke" fill="#5a8a2a" opacity="0.35"><circle cx="180" cy="118" r="18"/><circle cx="214" cy="104" r="22"/><circle cx="240" cy="122" r="14"/><circle cx="196" cy="86" r="16"/></g>
    <path d="M 186 158 C 184 164, 188 168, 186 174 M 220 160 C 222 166, 218 170, 220 176" stroke="#3a6a10" stroke-width="2" fill="none"/>` : ''}`;
}

/** The picture for a chest, altar or fountain at this moment. */
function getObjectArt(kind, moment) {
  const p = `oa-${kind}-${moment}`;
  const body = {
    chest: () => moment === 'boom' ? oaBoom(p)
      : moment === 'open' ? oaChest(p, { open: true }) + oaTreasure(p)
      : oaChest(p, { trap: moment === 'trapped' }),
    altar: () => oaAltar(p, moment === 'blessed'),
    fountain: () => oaFountain(p, moment),
  }[kind];
  if (!body) return null;
  const glow = kind === 'chest' && moment === 'boom' ? '#6a1a04' : kind === 'chest' && moment === 'open' ? '#5a4010'
    : kind === 'altar' && moment === 'blessed' ? '#5a4a1a' : kind === 'fountain' && moment === 'tainted' ? '#1a3a0a' : kind === 'fountain' ? '#102a3a' : '#3a2a1a';
  const label = {
    'chest-closed': 'A heavy chest, banded with iron and locked', 'chest-trapped': 'The chest, its trap laid bare: a needle in the lock, a wire, a sigil on the lid',
    'chest-open': 'The chest thrown open on heaped gold and gems', 'chest-boom': 'The chest blown apart in a blast of fire, splinters and smoke',
    'altar-idle': 'A stone altar between two candles, a chalice upon it', 'altar-blessed': 'Light pours down onto the altar',
    'fountain-idle': 'A stone fountain, water falling from a carved head into its basin', 'fountain-refreshed': 'The fountain’s water glitters, clear and bright',
    'fountain-tainted': 'The fountain’s water turns foul and green, bubbling and reeking',
  }[`${kind}-${moment}`] || kind;
  return `<svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${label}">
    ${oaRoom(p, glow)}${oaTorch(p, 70, 70)}${oaTorch(p, 330, 70)}${body()}${oaVig(p)}
  </svg>`;
}
