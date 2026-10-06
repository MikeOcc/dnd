// THE SEVEN LEVELS — the Trading Post on level 1. Its clerk: a wide, burly,
// bearded man, thinning on top, with a knowing half-smile. A close-up while
// you decide (Buy / Sell / Leave), and the shop itself while you browse, him
// behind the counter among his wares. Inline SVG like the lair art; ids are
// prefixed per picture ("tpc-", "tps-") since inline SVGs share the page's
// id namespace. Candle flames flicker via .shop-flame in styles.css.

'use strict';

/** The gradients the clerk is painted with, ids prefixed with p. */
function traderDefs(p) {
  return `
    <radialGradient id="${p}-skin" cx="35%" cy="40%" r="75%">
      <stop offset="0" stop-color="#d9a074"/>
      <stop offset="0.55" stop-color="#b47a50"/>
      <stop offset="1" stop-color="#6e4428"/>
    </radialGradient>
    <linearGradient id="${p}-beard" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3b2414"/>
      <stop offset="1" stop-color="#22140a"/>
    </linearGradient>
    <linearGradient id="${p}-tunic" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#6a5038"/>
      <stop offset="0.5" stop-color="#4a3624"/>
      <stop offset="1" stop-color="#2a1c12"/>
    </linearGradient>
    <linearGradient id="${p}-wood" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#5a3a20"/>
      <stop offset="0.15" stop-color="#3a2412"/>
      <stop offset="1" stop-color="#160c06"/>
    </linearGradient>
    <radialGradient id="${p}-candle" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#ffb648" stop-opacity="0.55"/>
      <stop offset="0.5" stop-color="#a0420c" stop-opacity="0.18"/>
      <stop offset="1" stop-color="#000" stop-opacity="0"/>
    </radialGradient>`;
}

/** His head, shoulders and chest, in a 400×240 frame, centred at x = 200. */
function traderBody(p) {
  return `
    <g class="trader-body">
      <!-- broad shoulders and chest, a rough tunic open at the collar -->
      <path d="M 52 240 C 54 188, 92 158, 150 148 L 250 148 C 308 158, 346 188, 348 240 Z" fill="url(#${p}-tunic)"/>
      <path d="M 174 148 L 200 204 L 226 148 Z" fill="url(#${p}-skin)"/>
      <path d="M 190 172 q 4 -4 8 0 M 196 182 q 4 -4 8 0 M 202 170 q 4 -4 8 0" stroke="#3b2414" stroke-width="1.4" fill="none" opacity="0.8"/>
      <!-- leather apron and its straps -->
      <path d="M 148 150 L 136 190 M 252 150 L 264 190" stroke="#2a180c" stroke-width="7"/>
      <path d="M 118 190 C 150 182, 250 182, 282 190 L 292 240 L 108 240 Z" fill="#2e1c10" stroke="#170d06" stroke-width="2"/>
      <path d="M 150 200 L 250 200" stroke="#4a2e18" stroke-width="1.5" stroke-dasharray="4 4"/>
      <!-- a thick neck -->
      <path d="M 170 116 L 230 116 L 236 156 L 164 156 Z" fill="url(#${p}-skin)"/>
      <!-- ears -->
      <ellipse cx="154" cy="98" rx="8" ry="12" fill="#a46c46"/>
      <ellipse cx="246" cy="98" rx="8" ry="12" fill="#8a5636"/>
      <!-- head: thinning on top, a shine on the bare crown -->
      <ellipse cx="200" cy="90" rx="46" ry="52" fill="url(#${p}-skin)"/>
      <ellipse cx="186" cy="52" rx="17" ry="8" fill="#fff" opacity="0.16"/>
      <path d="M 172 54 C 186 46, 206 45, 224 52 M 178 50 C 192 43, 208 43, 220 47 M 184 47 C 194 42, 204 42, 212 44"
            stroke="#3b2414" stroke-width="1.3" fill="none" opacity="0.7"/>
      <!-- what hair is left, at the sides, going grey -->
      <path d="M 156 74 C 151 84, 152 94, 156 102 L 162 100 C 160 92, 160 84, 163 76 Z" fill="#3b2414"/>
      <path d="M 244 74 C 249 84, 248 94, 244 102 L 238 100 C 240 92, 240 84, 237 76 Z" fill="#3b2414"/>
      <path d="M 156 80 l 3 8 M 244 80 l -3 8" stroke="#8e8272" stroke-width="1.2"/>
      <!-- heavy brows, one cocked -->
      <path d="M 170 79 Q 183 70 194 78" stroke="#24140a" stroke-width="5.5" stroke-linecap="round" fill="none"/>
      <path d="M 206 74 Q 219 66 232 73" stroke="#24140a" stroke-width="5.5" stroke-linecap="round" fill="none"/>
      <!-- eyes: steady, the right one narrowed in a knowing look -->
      <g class="trader-eyes">
        <ellipse cx="183" cy="88" rx="5.5" ry="3.4" fill="#efe4d4"/>
        <circle cx="184" cy="88" r="2.6" fill="#3a2614"/><circle cx="185" cy="87" r="0.9" fill="#fff"/>
        <ellipse cx="218" cy="87" rx="5.5" ry="2.5" fill="#efe4d4"/>
        <circle cx="219" cy="87" r="2.3" fill="#3a2614"/><circle cx="220" cy="86.4" r="0.8" fill="#fff"/>
      </g>
      <path d="M 176 94 q 7 3 14 0 M 211 93 q 7 3 14 0" stroke="#8a5534" stroke-width="1" fill="none" opacity="0.7"/>
      <!-- a broad, once-broken nose -->
      <path d="M 199 84 C 197 96, 191 104, 194 110 C 198 115, 206 114, 209 109" stroke="#7e4a2c" stroke-width="2.2" fill="none"/>
      <path d="M 192 106 q -4 3 0 6 M 209 106 q 4 3 0 6" stroke="#6e4026" stroke-width="1.5" fill="none"/>
      <!-- a great full beard, streaked with grey, spilling onto his chest -->
      <path d="M 157 104 C 156 134, 166 162, 182 182 C 192 194, 208 194, 218 182 C 234 162, 244 134, 243 104
               C 238 114, 231 119, 224 120 C 214 128, 186 128, 176 120 C 169 119, 162 114, 157 104 Z" fill="url(#${p}-beard)"/>
      <path d="M 157 104 q -3 6 -1 12 M 243 104 q 3 6 1 12 M 176 190 l -3 6 M 200 194 l 0 7 M 224 190 l 3 6" stroke="#22140a" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <path d="M 170 130 C 174 150, 182 168, 192 182 M 186 136 C 188 156, 194 172, 200 188 M 214 134 C 214 154, 210 170, 206 184 M 230 128 C 226 148, 220 164, 212 178"
            stroke="#8e8272" stroke-width="1.2" fill="none" opacity="0.55"/>
      <path d="M 162 118 C 166 138, 174 156, 184 170 M 238 118 C 234 138, 226 156, 216 170" stroke="#140a04" stroke-width="2" fill="none" opacity="0.6"/>
      <!-- moustache, and under it a slow, sure half-smile -->
      <path d="M 176 118 C 184 109, 195 110, 200 115 C 205 110, 216 109, 224 118 C 216 123, 206 121, 200 120 C 194 121, 184 123, 176 118 Z" fill="#2a180a"/>
      <path d="M 186 125 Q 202 135 216 123" stroke="#4a160e" stroke-width="3" fill="#6a2416" stroke-linecap="round"/>
      <path d="M 192 127 Q 202 131 210 126" stroke="#e8dccb" stroke-width="1.6" fill="none"/>
    </g>`;
}

/** His forearms, sleeves rolled, resting on the counter (drawn over it). */
function traderArms(p) {
  return `
    <g class="trader-arms">
      <path d="M 62 206 C 74 186, 112 184, 146 198 L 176 210 C 182 214, 180 224, 172 226 L 104 228 C 80 228, 58 222, 62 206 Z" fill="url(#${p}-skin)"/>
      <path d="M 338 206 C 326 186, 288 184, 254 198 L 224 210 C 218 214, 220 224, 228 226 L 296 228 C 320 228, 342 222, 338 206 Z" fill="url(#${p}-skin)"/>
      <path d="M 70 196 C 82 186, 96 186, 106 192 L 98 214 C 86 214, 74 210, 70 196 Z" fill="#5a4430"/>
      <path d="M 330 196 C 318 186, 304 186, 294 192 L 302 214 C 314 214, 326 210, 330 196 Z" fill="#3a2a1c"/>
      <path d="M 118 204 l 6 -3 M 132 208 l 6 -3 M 146 210 l 6 -3 M 282 204 l -6 -3 M 268 208 l -6 -3 M 254 210 l -6 -3" stroke="#3b2414" stroke-width="1.2"/>
      <ellipse cx="174" cy="218" rx="13" ry="9" fill="#b47a50"/>
      <ellipse cx="226" cy="218" rx="13" ry="9" fill="#9a6440"/>
      <path d="M 166 214 l 10 0 M 166 219 l 11 0 M 234 214 l -10 0 M 234 219 l -11 0" stroke="#6e4428" stroke-width="1"/>
    </g>`;
}

/** A candle on the counter, with its glow. */
function candle(p, x, y, s = 1) {
  return `
    <g transform="translate(${x} ${y}) scale(${s})">
      <circle cx="0" cy="-34" r="70" fill="url(#${p}-candle)"/>
      <rect x="-6" y="-26" width="12" height="26" fill="#e8dcb8"/>
      <path d="M -6 -26 q 3 4 6 0 q 3 5 6 0" fill="#d8caa0"/>
      <path class="shop-flame" d="M 0 -42 C 5 -34, 5 -30, 0 -27 C -5 -30, -5 -34, 0 -42 Z" fill="#ffc456"/>
      <path d="M 0 -27 l 0 -3" stroke="#2a1a0a" stroke-width="1"/>
      <ellipse cx="0" cy="0" rx="12" ry="3" fill="#2a1a0a"/>
    </g>`;
}

/** The dark stone room behind him: beams, shelves of jars and bottles. */
function shopRoom(p) {
  const jars = [[34, 52, '#5a2a2a'], [52, 50, '#2a4a3a'], [70, 54, '#3a3020'], [318, 50, '#2a3a5a'], [338, 54, '#4a2a40'], [358, 52, '#3a4a2a'],
                [30, 104, '#3a3020'], [50, 100, '#5a3a1a'], [72, 104, '#2a2a4a'], [322, 102, '#5a2a2a'], [344, 104, '#3a3a2a'], [364, 100, '#2a4a4a']];
  return `
    <rect width="400" height="240" fill="#0d0907"/>
    <g opacity="0.55" stroke="#1c140e" stroke-width="2" fill="none">
      <path d="M 0 40 H 400 M 0 84 H 400 M 0 128 H 400 M 0 172 H 400"/>
      <path d="M 40 0 V 40 M 120 0 V 40 M 200 0 V 40 M 280 0 V 40 M 360 0 V 40 M 80 40 V 84 M 160 40 V 84 M 240 40 V 84 M 320 40 V 84
               M 40 84 V 128 M 120 84 V 128 M 280 84 V 128 M 360 84 V 128 M 80 128 V 172 M 320 128 V 172"/>
    </g>
    <rect x="96" y="0" width="12" height="240" fill="#1e140c"/><rect x="292" y="0" width="12" height="240" fill="#1e140c"/>
    <rect x="0" y="18" width="400" height="10" fill="#22160c"/>
    <rect x="16" y="64" width="80" height="5" fill="#2e1e10"/><rect x="304" y="64" width="80" height="5" fill="#2e1e10"/>
    <rect x="16" y="116" width="80" height="5" fill="#2e1e10"/><rect x="304" y="116" width="80" height="5" fill="#2e1e10"/>
    ${jars.map(([x, y, c], i) => i % 3 === 1
      ? `<path d="M ${x - 5} ${y + 12} v -8 q 0 -4 3 -5 v -5 h 4 v 5 q 3 1 3 5 v 8 Z" fill="${c}" opacity="0.85"/>`
      : `<rect x="${x - 7}" y="${y}" width="14" height="12" rx="2" fill="${c}" opacity="0.85"/><rect x="${x - 6}" y="${y - 3}" width="12" height="3" fill="#2a1a0c"/>`).join('')}
    <path d="M 120 0 q 6 18 0 30 M 132 0 q -5 14 2 26 M 268 0 q 5 16 -1 28" stroke="#3a3020" stroke-width="3" fill="none"/>
    <ellipse cx="120" cy="34" rx="6" ry="9" fill="#4a3a1a"/><ellipse cx="134" cy="30" rx="5" ry="8" fill="#5a4020"/><ellipse cx="267" cy="32" rx="6" ry="9" fill="#3a2a14"/>`;
}

/** The counter top and front. */
function counter(p, top) {
  return `
    <rect x="0" y="${top}" width="400" height="${240 - top}" fill="url(#${p}-wood)"/>
    <rect x="0" y="${top}" width="400" height="4" fill="#6a4628"/>
    <path d="M 0 ${top + 18} H 400 M 0 ${top + 34} H 400" stroke="#120804" stroke-width="1" opacity="0.6"/>`;
}

const SHOP_ART = {
  // Close up across the counter: the clerk leans on it, sizing you up.
  closeup: `
    <svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" role="img"
         aria-label="The Trading Post's clerk: a wide, burly man with a full greying beard and thinning hair, leaning on the counter by candlelight with a knowing half-smile">
      <defs>${traderDefs('tpc')}
        <radialGradient id="tpc-dark" cx="50%" cy="45%" r="70%"><stop offset="0.45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.85"/></radialGradient>
      </defs>
      ${shopRoom('tpc')}
      ${traderBody('tpc')}
      ${counter('tpc', 212)}
      ${traderArms('tpc')}
      <g transform="translate(300 224)"><circle r="7" fill="#c9a23a"/><circle cx="10" cy="3" r="7" fill="#b08a2a"/><circle cx="4" cy="-4" r="7" fill="#d8b44a"/></g>
      ${candle('tpc', 44, 214)}
      <rect width="400" height="240" fill="url(#tpc-dark)"/>
    </svg>`,

  // The shop: him behind the counter, wares spread in front of you.
  shop: `
    <svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" role="img"
         aria-label="Inside the Trading Post: a candlelit counter spread with potions, gems, a blade and a ledger; the burly bearded clerk waits behind it">
      <defs>${traderDefs('tps')}
        <radialGradient id="tps-dark" cx="50%" cy="50%" r="70%"><stop offset="0.5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.85"/></radialGradient>
      </defs>
      ${shopRoom('tps')}
      <g transform="translate(76 46) scale(0.62)">${traderBody('tps')}</g>
      <rect x="120" y="40" width="160" height="140" fill="#000" opacity="0.18"/>
      ${counter('tps', 172)}
      <g transform="translate(76 46) scale(0.62)">${traderArms('tps')}</g>
      <!-- wares: potions, a pile of gems, a dagger, scales, a ledger and quill, coins -->
      <g transform="translate(40 172)">
        <path d="M 0 0 v -14 q 0 -6 5 -8 v -8 h 6 v 8 q 5 2 5 8 v 14 Z" fill="#8a1a1a"/><rect x="5" y="-34" width="6" height="4" fill="#5a3a1a"/>
        <path d="M 22 0 v -10 q 0 -5 4 -7 v -6 h 5 v 6 q 4 2 4 7 v 10 Z" fill="#7a1414"/>
        <path d="M 2 -12 h 4" stroke="#ffb0a0" stroke-width="1.5" opacity="0.6"/>
      </g>
      <g transform="translate(100 172)">
        <path d="M 0 0 l 6 -9 l 7 9 Z" fill="#c0283a"/><path d="M 10 0 l 6 -11 l 6 11 Z" fill="#2a50c8"/>
        <path d="M 20 0 l 5 -8 l 6 8 Z" fill="#30a060"/><path d="M 5 -4 l 6 -10 l 6 10 Z" fill="#d8e0f0"/>
        <path d="M 8 -11 l 2 2 M 22 -7 l 2 2" stroke="#fff" stroke-width="1"/>
      </g>
      <g transform="translate(262 200)">
        <path d="M 0 0 L 60 -6 L 62 -2 L 2 4 Z" fill="#9aa4b0"/><rect x="-14" y="-1" width="16" height="6" fill="#3a2414" transform="rotate(-6)"/>
      </g>
      <g transform="translate(330 172)">
        <path d="M 0 -40 v 40 M -20 -36 h 40" stroke="#a8862a" stroke-width="2"/>
        <path d="M -26 -24 q 6 8 12 0 Z M 14 -26 q 6 8 12 0 Z" fill="#a8862a"/>
        <path d="M -20 -36 l -6 12 M -20 -36 l 6 12 M 20 -36 l -6 10 M 20 -36 l 6 10" stroke="#a8862a" stroke-width="0.8"/>
      </g>
      <g transform="translate(176 190)">
        <rect x="0" y="0" width="54" height="30" fill="#5a3418" transform="skewX(-12)"/>
        <rect x="4" y="3" width="46" height="24" fill="#d8c8a0" transform="skewX(-12)"/>
        <path d="M 8 9 h 30 M 7 14 h 34 M 6 19 h 26" stroke="#6a5a40" stroke-width="1"/>
        <path d="M 46 4 L 66 -22" stroke="#e8e0d0" stroke-width="2"/><path d="M 60 -16 q 8 -12 6 -8" stroke="#f0eadc" stroke-width="3"/>
      </g>
      <g transform="translate(140 206)"><circle r="6" fill="#c9a23a"/><circle cx="9" cy="2" r="6" fill="#b08a2a"/><circle cx="3" cy="-4" r="6" fill="#d8b44a"/></g>
      ${candle('tps', 82, 176, 0.8)}
      ${candle('tps', 368, 176, 0.7)}
      <rect width="400" height="240" fill="url(#tps-dark)"/>
    </svg>`,
};

/** The Trading Post picture for its menu: the close-up while deciding, the shop while browsing. */
function getShopArt(mode) {
  return mode === 'main' ? SHOP_ART.closeup : SHOP_ART.shop;
}
