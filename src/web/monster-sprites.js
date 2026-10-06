// THE SEVEN LEVELS — inline SVG monster portraits, keyed by MonsterType.
// Each sprite is a self-contained 0..160 viewBox square with a transparent
// background — no border/panel of its own, so it blends into whatever's
// behind it (the corridor view during combat). Sizing is controlled by CSS
// on the container, not on the <svg> itself. Every sprite prefixes its own
// ids (e.g. "gi-skin"), since inline SVGs share the page's id namespace.

'use strict';

const MONSTER_SPRITES = {

  'Green Dragon': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Green Dragon">
    <defs>
    <radialGradient id="gnd-body" cx="40%" cy="30%" r="80%">
    <stop offset="0" stop-color="#7acc64"/><stop offset="0.45" stop-color="#2a7a30"/><stop offset="1" stop-color="#082a0c"/>
    </radialGradient>
    <linearGradient id="gnd-membrane" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#3e8e3e"/><stop offset="0.6" stop-color="#1e5a24"/><stop offset="1" stop-color="#08280c"/>
    </linearGradient>
    <linearGradient id="gnd-belly" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#a0a860"/><stop offset="0.5" stop-color="#e4e498"/><stop offset="1" stop-color="#a0a860"/>
    </linearGradient>
    <linearGradient id="gnd-horn" x1="1" y1="1" x2="0" y2="0">
    <stop offset="0" stop-color="#3a3020"/><stop offset="0.5" stop-color="#b0a070"/><stop offset="1" stop-color="#f0e8c0"/>
    </linearGradient>
    <radialGradient id="gnd-breath" cx="0%" cy="0%" r="120%">
    <stop offset="0" stop-color="#e0ffb0"/><stop offset="0.25" stop-color="#8aff40"/>
    <stop offset="0.6" stop-color="#4aa020"/><stop offset="1" stop-color="#1a5a0a" stop-opacity="0.2"/>
    </radialGradient>
    <pattern id="gnd-scales" width="5" height="4" patternUnits="userSpaceOnUse">
    <path d="M 0 4 Q 2.5 0.6 5 4" stroke="#041a06" stroke-width="0.55" fill="none" opacity="0.6"/>
    </pattern>
    <filter id="gnd-glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2.2"/></filter>
    <filter id="gnd-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1"/></filter>
    <path id="gnd-torso" d="M 64 76 C 54 92 54 116 64 128 C 76 139 96 137 104 124 C 112 108 108 86 98 72 Z"/>
    <path id="gnd-neck" d="M 78 80 C 76 62 88 48 104 40 L 114 50 C 102 56 95 68 95 82 Z"/>
    <path id="gnd-tail" d="M 60 118 C 38 124 20 138 26 150 C 32 158 50 154 46 146 C 42 151 33 149 34 143 C 38 133 52 131 66 131 Z"/>
    <path id="gnd-skull" d="M 102 40 C 106 30 120 27 130 32 L 148 38 C 152 40 152 44 148 45.5 L 128 47 C 120 48 110 50 104 53 Z"/>
    </defs>
    
    <ellipse cx="80" cy="152" rx="56" ry="5" fill="#000" opacity="0.55" filter="url(#gnd-soft)"/>
    
    <!-- far wing -->
    <path d="M 66 72 L 46 36 L 10 22 Q 22 38 4 54 Q 20 64 18 82 Q 38 80 60 94 Z" fill="url(#gnd-membrane)" stroke="#041a06" stroke-width="1.2"/>
    <g stroke="#041a06" stroke-linecap="round" fill="none">
    <path d="M 66 72 L 46 36" stroke-width="3.6"/><path d="M 46 36 L 10 22" stroke-width="2"/>
    <path d="M 46 36 L 4 54" stroke-width="1.8"/><path d="M 46 36 L 18 82" stroke-width="1.8"/>
    </g>
    <g stroke="#b8ff80" stroke-linecap="round" fill="none" stroke-width="0.7" opacity="0.55">
    <path d="M 65 70 L 46 35"/><path d="M 45 35 L 11 21.5"/>
    </g>
    <g stroke="#041a06" stroke-width="0.5" fill="none" opacity="0.5">
    <path d="M 40 40 Q 30 44 24 38"/><path d="M 36 50 Q 26 56 18 54"/><path d="M 40 58 Q 34 68 26 70"/>
    </g>
    <path d="M 46 36 L 43 27 L 48.5 34 Z" fill="url(#gnd-horn)"/>
    
    <!-- near wing -->
    <path d="M 94 70 L 112 22 L 146 4 Q 144 20 158 28 Q 146 40 152 54 Q 128 58 106 82 Z" fill="url(#gnd-membrane)" stroke="#041a06" stroke-width="1.2"/>
    <g stroke="#041a06" stroke-linecap="round" fill="none">
    <path d="M 94 70 L 112 22" stroke-width="3.6"/><path d="M 112 22 L 146 4" stroke-width="2"/>
    <path d="M 112 22 L 158 28" stroke-width="1.8"/><path d="M 112 22 L 152 54" stroke-width="1.8"/>
    </g>
    <g stroke="#b8ff80" stroke-linecap="round" fill="none" stroke-width="0.7" opacity="0.55">
    <path d="M 95 69 L 112.5 22"/><path d="M 113 21.5 L 145.5 4"/>
    </g>
    <path d="M 112 22 L 110 12 L 115 20 Z" fill="url(#gnd-horn)"/>
    
    <!-- tail -->
    <use href="#gnd-tail" fill="url(#gnd-body)" stroke="#041a06" stroke-width="1.4"/>
    <use href="#gnd-tail" fill="url(#gnd-scales)"/>
    <path d="M 34 143 L 22 138 L 26 146 L 18 150 L 30 150 Z" fill="#082a0c" stroke="#041a06" stroke-width="0.8"/>
    <g fill="#0e3a12">
    <path d="M 52 124 L 50 118 L 55 123 Z"/><path d="M 42 128 L 38 123 L 44 127 Z"/><path d="M 33 134 L 28 130 L 35 134 Z"/>
    </g>
    
    <!-- hind legs -->
    <path d="M 56 110 C 48 118 48 132 54 140 L 66 140 C 68 130 70 120 68 112 Z" fill="url(#gnd-body)" stroke="#041a06" stroke-width="1.3"/>
    <path d="M 104 110 C 112 118 112 132 108 140 L 94 140 C 92 130 92 120 94 112 Z" fill="url(#gnd-body)" stroke="#041a06" stroke-width="1.3"/>
    <g fill="url(#gnd-horn)" stroke="#2a1a0a" stroke-width="0.4">
    <path d="M 52 139 L 48 148 L 55 141 Z"/><path d="M 57 140 L 56 150 L 60 141 Z"/><path d="M 62 140 L 64 149 L 65 140 Z"/>
    <path d="M 96 140 L 95 149 L 99 141 Z"/><path d="M 101 140 L 102 150 L 104 141 Z"/><path d="M 106 139 L 110 148 L 108 140 Z"/>
    </g>
    
    <!-- torso and belly plates -->
    <use href="#gnd-torso" fill="url(#gnd-body)" stroke="#041a06" stroke-width="1.6"/>
    <use href="#gnd-torso" fill="url(#gnd-scales)"/>
    <path d="M 72 84 C 67 98 69 116 80 129 C 92 127 98 112 98 97 C 98 87 94 79 90 76 Z" fill="url(#gnd-belly)" stroke="#4a5020" stroke-width="0.8"/>
    <g stroke="#4a5020" stroke-width="0.8" fill="none" opacity="0.8">
    <path d="M 72 90 Q 83 93 95 86"/><path d="M 70 97 Q 83 101 97 93"/><path d="M 70 104 Q 83 108 98 100"/>
    <path d="M 71 111 Q 83 115 97 107"/><path d="M 73 118 Q 83 121 95 114"/><path d="M 76 124 Q 83 126 91 121"/>
    </g>
    <path d="M 74 86 C 71 100 72 114 80 126" stroke="#fff" stroke-width="1" fill="none" opacity="0.3"/>
    
    <!-- forelegs -->
    <path d="M 68 94 C 58 98 52 106 54 114 L 61 115 C 61 108 66 104 74 103 Z" fill="url(#gnd-body)" stroke="#041a06" stroke-width="1.2"/>
    <path d="M 100 94 C 110 98 116 106 114 114 L 107 115 C 107 108 102 104 95 103 Z" fill="url(#gnd-body)" stroke="#041a06" stroke-width="1.2"/>
    <g fill="url(#gnd-horn)" stroke="#2a1a0a" stroke-width="0.4">
    <path d="M 53 113 L 50 120 L 56 115 Z"/><path d="M 57 115 L 56 122 L 60 116 Z"/><path d="M 60.5 115 L 62 121 L 62.5 115 Z"/>
    <path d="M 115 113 L 118 120 L 112 115 Z"/><path d="M 111 115 L 112 122 L 108 116 Z"/><path d="M 107.5 115 L 106 121 L 105.5 115 Z"/>
    </g>
    
    <!-- neck -->
    <use href="#gnd-neck" fill="url(#gnd-body)" stroke="#041a06" stroke-width="1.5"/>
    <use href="#gnd-neck" fill="url(#gnd-scales)"/>
    <path d="M 95 81 C 95 68 101 58 112 52" stroke="url(#gnd-belly)" stroke-width="4" fill="none"/>
    <g stroke="#4a5020" stroke-width="0.6" fill="none">
    <path d="M 93.5 76 L 97.5 77"/><path d="M 94.5 69 L 98.5 71"/><path d="M 97 63 L 100.5 65.5"/><path d="M 101 57.5 L 104 60.5"/>
    </g>
    <g fill="#0e3a12" stroke="#041a06" stroke-width="0.5">
    <path d="M 82 58 L 76 52 L 85 55 Z"/><path d="M 88 50 L 83 42 L 91 47 Z"/><path d="M 95 45 L 92 36 L 98 42 Z"/>
    <path d="M 78 68 L 71 64 L 79 64 Z"/><path d="M 66 80 L 58 78 L 66 76 Z"/><path d="M 60 92 L 52 92 L 59 88 Z"/>
    </g>
    <path d="M 112 50 C 102 56 96 66 95 80" stroke="#b8ff80" stroke-width="1.2" fill="none" opacity="0.5"/>
    
    
    <path d="M 104 38 C 104 26 110 16 120 14 C 118 20 118 24 120 28 C 122 22 126 18 132 18 C 128 24 126 28 128 32 L 116 34 Z" fill="url(#gnd-membrane)" stroke="#041a06" stroke-width="0.7"/>
    <g stroke="#0a2a0e" stroke-width="0.6" fill="none" opacity="0.8"><path d="M 108 34 L 116 18"/><path d="M 116 32 L 124 20"/></g>
    <path d="M 106 36 C 100 30 94 28 88 28 C 94 30 99 34 102 39 Z" fill="url(#gnd-horn)" stroke="#2a1a0a" stroke-width="0.5"/>
    <g fill="url(#gnd-membrane)" stroke="#041a06" stroke-width="0.4">
    <path d="M 116 58 L 112 66 L 118 60 Z"/><path d="M 122 60 L 120 68 L 124 61 Z"/>
    </g>
    
    <!-- head -->
    <use href="#gnd-skull" fill="url(#gnd-body)" stroke="#041a06" stroke-width="1.5"/>
    <use href="#gnd-skull" fill="url(#gnd-scales)"/>
    <path d="M 108 50 L 147 45 L 145 57 L 110 55 Z" fill="#0a2a06"/>
    <path d="M 130 48 L 147 45 L 145 57 L 128 55 Z" fill="#a8ff60" opacity="0.6" filter="url(#gnd-soft)"/>
    <path d="M 105 54 C 114 54 124 54 130 54 L 146 58 C 148 60 146 62 143 61.5 L 126 61 C 118 62 110 60 104 57 Z" fill="#1e5a24" stroke="#041a06" stroke-width="1.3"/>
    <g fill="#f4ecd4" stroke="#8a7a5a" stroke-width="0.35">
    <path d="M 118 48.2 L 119.5 52.5 L 121 48 Z"/><path d="M 124 47.6 L 125.5 52.5 L 127 47.3 Z"/>
    <path d="M 130 47 L 131.5 51 L 133 46.8 Z"/><path d="M 136 46.5 L 137.5 51.5 L 139 46.3 Z"/>
    <path d="M 142 46 L 143.2 49.5 L 144.5 45.8 Z"/>
    <path d="M 116 54.5 L 117.5 50.5 L 119 54.5 Z"/><path d="M 122 54.5 L 123.5 50 L 125 54.5 Z"/>
    <path d="M 129 55 L 130.5 51 L 132 55.3 Z"/><path d="M 135 56 L 136.5 52 L 138 56.3 Z"/>
    <path d="M 141 57 L 142.2 53.5 L 143.4 57.3 Z"/>
    </g>
    <g fill="#0e3a12" stroke="#041a06" stroke-width="0.5">
    <path d="M 104 55 L 96 58 L 103 51 Z"/><path d="M 108 58.5 L 101 64 L 106 56 Z"/><path d="M 114 60 L 110 67 L 112 59 Z"/>
    </g>
    <path d="M 112 34 Q 122 29 132 34 L 128 36 Q 121 33 114 37 Z" fill="#0e3a12"/>
    <ellipse cx="122" cy="38.5" rx="4.6" ry="2.6" fill="#ffb020" filter="url(#gnd-glow)" opacity="0.85"/>
    <ellipse cx="122" cy="38.5" rx="3.4" ry="1.9" fill="#ffe070"/>
    <ellipse cx="122.3" cy="38.5" rx="0.7" ry="1.8" fill="#0a0202"/>
    <path d="M 144 39.5 Q 146 38.5 147.5 40" stroke="#041a06" stroke-width="1" fill="none"/>
    <g fill="#0e3a12"><path d="M 110 44 L 104 44 L 109 41 Z"/><path d="M 113 47 L 107 48.5 L 112 44.5 Z"/></g>
    
    
    <g filter="url(#gnd-glow)">
    <circle cx="148" cy="58" r="7" fill="#8aff40" opacity="0.45"/>
    <circle cx="152" cy="72" r="10" fill="#6ad030" opacity="0.4"/>
    <circle cx="146" cy="88" r="12" fill="#5ab828" opacity="0.38"/>
    <circle cx="152" cy="104" r="11" fill="#4aa020" opacity="0.35"/>
    <circle cx="136" cy="100" r="9" fill="#6ad030" opacity="0.3"/>
    <circle cx="148" cy="120" r="9" fill="#4aa020" opacity="0.28"/>
    </g>
    <g fill="#c8ff90" opacity="0.5">
    <circle cx="146" cy="70" r="4"/><circle cx="150" cy="86" r="5"/><circle cx="142" cy="100" r="4"/>
    </g>
    <g fill="none" stroke="#d8ffa0" stroke-width="0.8" opacity="0.6" stroke-linecap="round">
    <path d="M 140 66 Q 146 62 152 66"/><path d="M 138 84 Q 146 78 156 84"/><path d="M 140 104 Q 148 98 158 104"/>
    </g>
    <g fill="#1e3a10" opacity="0.6"><circle cx="146" cy="88" r="1.2"/><circle cx="151" cy="88" r="1.2"/><path d="M 147 92 Q 148.5 94 150 92"/></g>
    </svg>
  `,

  'Kobold': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Kobold">
    <defs>
    <radialGradient id="kb-skin" cx="40%" cy="30%" r="80%">
    <stop offset="0" stop-color="#d07a3a"/>
    <stop offset="0.5" stop-color="#9a4a1e"/>
    <stop offset="1" stop-color="#3e1a08"/>
    </radialGradient>
    <linearGradient id="kb-belly" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#a87a4a"/>
    <stop offset="0.5" stop-color="#e8c490"/>
    <stop offset="1" stop-color="#b08050"/>
    </linearGradient>
    <linearGradient id="kb-metal" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#f0f0f0"/>
    <stop offset="0.5" stop-color="#9aa0a8"/>
    <stop offset="1" stop-color="#4a4e56"/>
    </linearGradient>
    <linearGradient id="kb-bone" x1="0" y1="1" x2="0" y2="0">
    <stop offset="0" stop-color="#6a5a3a"/>
    <stop offset="1" stop-color="#f0e4c4"/>
    </linearGradient>
    <pattern id="kb-scales" width="4" height="3.4" patternUnits="userSpaceOnUse">
    <path d="M 0 3.4 Q 2 0.6 4 3.4" stroke="#2a0e04" stroke-width="0.45" fill="none" opacity="0.55"/>
    </pattern>
    <filter id="kb-glow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="1.4"/></filter>
    <filter id="kb-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1"/></filter>
    <path id="kb-torso" d="M 66 70 C 59 80 59 96 64 105 L 90 105 C 95 96 95 80 88 70 Z"/>
    <path id="kb-head" d="M 66 58 C 64 46 72 38 82 38 C 90 38 96 42 100 48 L 114 54 C 118 56 118 60 114 62 L 100 64 C 94 68 84 70 76 68 C 70 66 66 62 66 58 Z"/>
    </defs>
    
    <ellipse cx="80" cy="152" rx="34" ry="4" fill="#000" opacity="0.55" filter="url(#kb-soft)"/>
    
    <!-- tail -->
    <path d="M 66 102 C 50 110 36 124 30 142 C 28 149 23 151 21 146 C 26 131 40 114 62 98 Z" fill="url(#kb-skin)" stroke="#2a0e04" stroke-width="1.1"/>
    <path d="M 66 102 C 50 110 36 124 30 142 C 28 149 23 151 21 146 C 26 131 40 114 62 98 Z" fill="url(#kb-scales)"/>
    
    <!-- spear shaft (behind the body) -->
    <path d="M 44 122 L 134 26" stroke="#3a2410" stroke-width="3.4" stroke-linecap="round"/>
    <path d="M 44 122 L 134 26" stroke="#8a6238" stroke-width="2" stroke-linecap="round"/>
    <path d="M 45 120.5 L 133 26.5" stroke="#c8a070" stroke-width="0.6" opacity="0.6"/>
    
    <!-- digitigrade legs -->
    <path d="M 64 104 C 56 114 55 124 61 131 L 57 146 L 66 146 L 70 129 C 72 120 72 112 70 106 Z" fill="url(#kb-skin)" stroke="#2a0e04" stroke-width="1.1"/>
    <path d="M 90 104 C 98 114 99 124 93 131 L 99 146 L 90 146 L 84 129 C 82 120 82 112 84 106 Z" fill="url(#kb-skin)" stroke="#2a0e04" stroke-width="1.1"/>
    <g fill="url(#kb-bone)" stroke="#3a2a14" stroke-width="0.4">
    <path d="M 56 145 L 51 150 L 58 148 Z"/><path d="M 60 146 L 58 152 L 63 147 Z"/><path d="M 64 146 L 66 151 L 67 146 Z"/>
    <path d="M 92 146 L 90 151 L 94 147 Z"/><path d="M 96 146 L 97 152 L 99 147 Z"/><path d="M 99 145 L 104 150 L 101 146 Z"/>
    </g>
    
    <!-- ragged loincloth -->
    <path d="M 63 101 L 91 101 L 93 116 L 87 112 L 83 119 L 79 112 L 74 119 L 69 112 L 62 116 Z" fill="#5a4426" stroke="#2a1a0a" stroke-width="0.8"/>
    <path d="M 66 104 L 88 104" stroke="#8a6a3a" stroke-width="0.7" opacity="0.6"/>
    
    <!-- torso, belly plates, harness -->
    <use href="#kb-torso" fill="url(#kb-skin)" stroke="#2a0e04" stroke-width="1.2"/>
    <use href="#kb-torso" fill="url(#kb-scales)"/>
    <path d="M 71 76 C 68 86 69 96 72 102 L 84 102 C 86 94 86 84 84 76 Z" fill="url(#kb-belly)" stroke="#6a4020" stroke-width="0.6"/>
    <g stroke="#7a5028" stroke-width="0.6" fill="none"><path d="M 71 82 L 85 82"/><path d="M 70 88 L 86 88"/><path d="M 70 94 L 86 94"/><path d="M 71 99 L 85 99"/></g>
    <path d="M 65 74 L 91 99 L 89 103 L 63 78 Z" fill="#4a2a14" stroke="#1a0a04" stroke-width="0.5"/>
    <circle cx="77" cy="88" r="2.2" fill="#b89a50" stroke="#4a3a14" stroke-width="0.5"/>
    <g fill="#e0d0a0"><circle cx="70" cy="81" r="0.7"/><circle cx="84" cy="94" r="0.7"/></g>
    
    <!-- back arm gripping the shaft low -->
    <path d="M 66 72 C 58 78 53 88 54 99 L 61 99 C 61 90 63 82 70 78 Z" fill="url(#kb-skin)" stroke="#2a0e04" stroke-width="1"/>
    <ellipse cx="57" cy="100" rx="4.4" ry="3.6" fill="#9a4a1e" stroke="#2a0e04" stroke-width="0.8"/>
    
    <!-- front arm gripping high -->
    <path d="M 88 72 C 96 70 102 64 104 56 L 111 60 C 107 70 99 78 90 80 Z" fill="url(#kb-skin)" stroke="#2a0e04" stroke-width="1"/>
    <ellipse cx="108" cy="57" rx="4.6" ry="3.8" fill="#b0602a" stroke="#2a0e04" stroke-width="0.8"/>
    <g fill="url(#kb-bone)"><path d="M 111 55 L 115 53 L 112 57 Z"/><path d="M 111 59 L 115 59 L 111 61 Z"/></g>
    
    <!-- spearhead with binding and a tuft -->
    <path d="M 128 32 Q 131 21 142 15 Q 139 26 133 36 Z" fill="url(#kb-metal)" stroke="#2a2a30" stroke-width="0.7"/>
    <path d="M 130 31 L 139 18" stroke="#fff" stroke-width="0.5" opacity="0.6"/>
    <path d="M 125 36 L 130 31 M 126 38 L 131 33 M 127 40 L 132 35" stroke="#6a4020" stroke-width="1.1"/>
    <path d="M 126 38 Q 120 44 122 50 M 127 39 Q 124 46 127 51" stroke="#a02020" stroke-width="1" fill="none"/>
    
    <!-- head -->
    <path d="M 70 44 C 66 36 62 32 58 26 C 64 30 70 34 74 41 Z" fill="url(#kb-bone)" stroke="#3a2a14" stroke-width="0.5"/>
    <path d="M 77 40 C 75 32 73 26 72 19 C 77 25 80 32 81 39 Z" fill="url(#kb-bone)" stroke="#3a2a14" stroke-width="0.5"/>
    <use href="#kb-head" fill="url(#kb-skin)" stroke="#2a0e04" stroke-width="1.3"/>
    <use href="#kb-head" fill="url(#kb-scales)"/>
    <!-- crest spikes -->
    <g fill="#5a2a0e"><path d="M 68 50 L 62 50 L 67 46 Z"/><path d="M 67 56 L 61 58 L 66 53 Z"/><path d="M 68 62 L 63 65 L 68 60 Z"/></g>
    <!-- jaw, teeth, nostril -->
    <path d="M 100 61 L 114 60" stroke="#2a0e04" stroke-width="0.9"/>
    <g fill="#f4ecd4"><path d="M 103 61 L 104 63.5 L 105 61 Z"/><path d="M 107 60.7 L 108 63 L 109 60.6 Z"/><path d="M 111 60.4 L 112 62.5 L 113 60.3 Z"/></g>
    <ellipse cx="113" cy="55" rx="1.1" ry="0.7" fill="#1a0602"/>
    <!-- brow and glowing eye -->
    <path d="M 80 45 Q 88 41 95 46 L 92 47 Q 87 44 82 47 Z" fill="#3a1606"/>
    <ellipse cx="88" cy="49" rx="3.8" ry="2.6" fill="#ff5020" filter="url(#kb-glow)" opacity="0.8"/>
    <ellipse cx="88" cy="49" rx="2.8" ry="2" fill="#ffb030"/>
    <ellipse cx="88.3" cy="49" rx="0.6" ry="1.8" fill="#1a0202"/>
    <path d="M 72 44 Q 80 40 88 41" stroke="#f0a060" stroke-width="0.8" fill="none" opacity="0.5"/>
    </svg>
  `,

  'Goblin': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Goblin">
    <defs>
    <radialGradient id="gb-skin" cx="40%" cy="30%" r="80%">
    <stop offset="0" stop-color="#a8c860"/>
    <stop offset="0.5" stop-color="#6a8a30"/>
    <stop offset="1" stop-color="#26380c"/>
    </radialGradient>
    <linearGradient id="gb-leather" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#3a2410"/>
    <stop offset="0.45" stop-color="#7a5430"/>
    <stop offset="1" stop-color="#2e1c0a"/>
    </linearGradient>
    <linearGradient id="gb-blade" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#5a5e66"/>
    <stop offset="0.5" stop-color="#d8dce0"/>
    <stop offset="1" stop-color="#6a6e76"/>
    </linearGradient>
    <radialGradient id="gb-wood" cx="45%" cy="40%" r="60%">
    <stop offset="0" stop-color="#9a7040"/>
    <stop offset="1" stop-color="#4a3018"/>
    </radialGradient>
    <filter id="gb-glow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="1.3"/></filter>
    <filter id="gb-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1"/></filter>
    </defs>
    
    <ellipse cx="80" cy="152" rx="36" ry="4" fill="#000" opacity="0.55" filter="url(#gb-soft)"/>
    
    <!-- scimitar raised behind the head -->
    <path d="M 114 50 C 119 36 117 22 103 11 C 110 24 110 37 107 47 Z" fill="url(#gb-blade)" stroke="#2a2c30" stroke-width="0.8"/>
    <path d="M 112 45 C 115 34 113 24 106 15" stroke="#fff" stroke-width="0.5" fill="none" opacity="0.6"/>
    <g fill="#8a4a1a" opacity="0.8"><circle cx="112" cy="36" r="1"/><circle cx="109" cy="27" r="0.8"/><circle cx="113" cy="41" r="0.7"/></g>
    <path d="M 104 49 L 118 53" stroke="#6a5020" stroke-width="2.6" stroke-linecap="round"/>
    
    <!-- bowed legs, big bare feet -->
    <path d="M 64 110 C 57 122 57 134 60 145 L 70 145 C 70 134 72 122 75 112 Z" fill="url(#gb-skin)" stroke="#1a2606" stroke-width="1.1"/>
    <path d="M 92 110 C 99 122 100 134 98 145 L 88 145 C 88 134 86 122 83 112 Z" fill="url(#gb-skin)" stroke="#1a2606" stroke-width="1.1"/>
    <ellipse cx="62" cy="147" rx="9" ry="3.4" fill="#6a8a30" stroke="#1a2606" stroke-width="1"/>
    <ellipse cx="97" cy="147" rx="9" ry="3.4" fill="#6a8a30" stroke="#1a2606" stroke-width="1"/>
    <g fill="#2a2a1a"><circle cx="55" cy="147" r="0.8"/><circle cx="58" cy="148.5" r="0.8"/><circle cx="104" cy="147" r="0.8"/><circle cx="101" cy="148.5" r="0.8"/></g>
    
    <!-- leather jerkin with ragged hem, belt, studs -->
    <path d="M 60 76 C 54 92 55 108 59 118 L 64 114 L 68 120 L 73 115 L 78 121 L 83 115 L 88 121 L 92 115 L 97 118 C 101 108 102 92 96 76 Z" fill="url(#gb-leather)" stroke="#1a0e04" stroke-width="1.2"/>
    <path d="M 57 104 Q 78 108 99 104 L 99 109 Q 78 113 57 109 Z" fill="#2a1a0a" stroke="#0e0602" stroke-width="0.6"/>
    <rect x="75" y="104.5" width="6" height="5" fill="none" stroke="#b09050" stroke-width="1"/>
    <g fill="#c0a060"><circle cx="66" cy="84" r="0.9"/><circle cx="72" cy="82" r="0.9"/><circle cx="84" cy="82" r="0.9"/><circle cx="90" cy="84" r="0.9"/>
    <circle cx="66" cy="94" r="0.9"/><circle cx="90" cy="94" r="0.9"/></g>
    <path d="M 78 78 L 78 103" stroke="#1a0e04" stroke-width="0.9"/>
    <path d="M 64 80 Q 62 94 63 104" stroke="#a07a4a" stroke-width="0.7" fill="none" opacity="0.5"/>
    
    <!-- scimitar arm raised -->
    <path d="M 94 78 C 104 74 110 64 112 52 L 119 55 C 117 68 109 80 98 86 Z" fill="url(#gb-skin)" stroke="#1a2606" stroke-width="1"/>
    <ellipse cx="114" cy="51" rx="5" ry="4.2" fill="#7a9a3a" stroke="#1a2606" stroke-width="0.8"/>
    
    <!-- shield arm: crude round shield -->
    <path d="M 62 78 C 54 84 50 92 50 100 L 58 102 C 58 94 62 88 66 86 Z" fill="url(#gb-skin)" stroke="#1a2606" stroke-width="1"/>
    <circle cx="50" cy="104" r="16" fill="url(#gb-wood)" stroke="#4a4e56" stroke-width="2.4"/>
    <g stroke="#3a2410" stroke-width="0.7" opacity="0.8"><path d="M 40 92 L 40 116"/><path d="M 46 89 L 46 119"/><path d="M 52 88 L 52 120"/><path d="M 58 90 L 58 118"/></g>
    <circle cx="50" cy="104" r="4.5" fill="#8a8e96" stroke="#3a3e46" stroke-width="0.8"/>
    <circle cx="48.8" cy="102.8" r="1.4" fill="#fff" opacity="0.6"/>
    <path d="M 38 96 L 44 100 M 58 112 L 62 110" stroke="#1a0e04" stroke-width="0.8" opacity="0.7"/>
    
    <!-- head: long ears, hooked nose, toothy grin -->
    <path d="M 64 50 L 34 36 L 42 46 L 62 59 Z" fill="url(#gb-skin)" stroke="#1a2606" stroke-width="1"/>
    <path d="M 96 50 L 126 36 L 118 46 L 98 59 Z" fill="url(#gb-skin)" stroke="#1a2606" stroke-width="1"/>
    <path d="M 60 51 L 42 42 L 47 48 L 60 55 Z" fill="#a05a50" opacity="0.6"/>
    <path d="M 100 51 L 118 42 L 113 48 L 100 55 Z" fill="#a05a50" opacity="0.6"/>
    <path d="M 62 56 C 60 40 70 30 80 30 C 92 30 100 40 98 56 C 96 66 88 72 80 72 C 70 72 64 66 62 56 Z" fill="url(#gb-skin)" stroke="#1a2606" stroke-width="1.3"/>
    <!-- brow, angry yellow eyes -->
    <path d="M 66 45 L 78 48 L 77 50 L 66 48 Z" fill="#26380c"/>
    <path d="M 94 45 L 82 48 L 83 50 L 94 48 Z" fill="#26380c"/>
    <ellipse cx="72" cy="51" rx="3.6" ry="2.4" fill="#ffe040" filter="url(#gb-glow)" opacity="0.7"/>
    <ellipse cx="88" cy="51" rx="3.6" ry="2.4" fill="#ffe040" filter="url(#gb-glow)" opacity="0.7"/>
    <ellipse cx="72" cy="51" rx="2.8" ry="1.9" fill="#f8e060"/>
    <ellipse cx="88" cy="51" rx="2.8" ry="1.9" fill="#f8e060"/>
    <ellipse cx="72.5" cy="51" rx="0.6" ry="1.6" fill="#0a0a02"/>
    <ellipse cx="87.5" cy="51" rx="0.6" ry="1.6" fill="#0a0a02"/>
    <path d="M 80 50 Q 87 57 83 63 Q 78 63 77 59 Z" fill="#7a9a3a" stroke="#1a2606" stroke-width="0.8"/>
    <path d="M 67 62 Q 80 71 93 62 Q 80 67 67 62 Z" fill="#2a0a06" stroke="#1a2606" stroke-width="0.8"/>
    <g fill="#e8d890" stroke="#6a5a2a" stroke-width="0.3">
    <path d="M 70 63.4 L 71.3 66.5 L 72.6 64.2 Z"/><path d="M 75 64.8 L 76.2 67.5 L 77.4 65.3 Z"/>
    <path d="M 82.6 65.3 L 83.8 67.5 L 85 64.8 Z"/><path d="M 87.4 64.2 L 88.7 66.5 L 90 63.4 Z"/>
    </g>
    <g fill="#4a6a1a"><circle cx="68" cy="40" r="1.4"/><circle cx="92" cy="58" r="1.1"/><circle cx="74" cy="36" r="0.9"/></g>
    <ellipse cx="72" cy="38" rx="6" ry="3" transform="rotate(-20 72 38)" fill="#fff" opacity="0.14" filter="url(#gb-soft)"/>
    </svg>
  `,

  'Mold': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Mold">
    <defs>
    <radialGradient id="md-lump" cx="40%" cy="30%" r="75%">
    <stop offset="0" stop-color="#e0c060"/>
    <stop offset="0.5" stop-color="#9a7424"/>
    <stop offset="1" stop-color="#2e1e06"/>
    </radialGradient>
    <radialGradient id="md-lump2" cx="40%" cy="30%" r="75%">
    <stop offset="0" stop-color="#c8a848"/>
    <stop offset="0.6" stop-color="#7a5a18"/>
    <stop offset="1" stop-color="#241604"/>
    </radialGradient>
    <radialGradient id="md-cap" cx="45%" cy="35%" r="65%">
    <stop offset="0" stop-color="#f8e080"/>
    <stop offset="1" stop-color="#8a6010"/>
    </radialGradient>
    <radialGradient id="md-spores" cx="50%" cy="50%" r="50%">
    <stop offset="0" stop-color="#ffe870" stop-opacity="0.5"/>
    <stop offset="1" stop-color="#ffe870" stop-opacity="0"/>
    </radialGradient>
    <pattern id="md-pores" width="5" height="5" patternUnits="userSpaceOnUse">
    <circle cx="1.5" cy="1.5" r="0.7" fill="#2a1a04" opacity="0.55"/>
    <circle cx="4" cy="3.8" r="0.5" fill="#2a1a04" opacity="0.45"/>
    </pattern>
    <filter id="md-glow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="1.2"/></filter>
    <filter id="md-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.2"/></filter>
    </defs>
    
    <ellipse cx="80" cy="146" rx="66" ry="7" fill="#000" opacity="0.6" filter="url(#md-soft)"/>
    <!-- spore cloud hanging over the colony -->
    <ellipse cx="78" cy="56" rx="62" ry="40" fill="url(#md-spores)"/>
    
    <!-- creeping edge spreading over the floor -->
    <path d="M 12 146 C 14 136 26 132 36 136 C 48 130 62 134 80 132 C 98 130 112 134 124 132 C 136 132 148 136 150 146 Z" fill="#5a4210" stroke="#1a1004" stroke-width="1"/>
    <path d="M 12 146 C 14 136 26 132 36 136 C 48 130 62 134 80 132 C 98 130 112 134 124 132 C 136 132 148 136 150 146 Z" fill="url(#md-pores)"/>
    
    <!-- back lumps -->
    <g stroke="#1a1004" stroke-width="1.1">
    <path d="M 30 136 C 22 118 32 100 48 102 C 58 92 76 94 78 110 C 80 124 60 138 30 136 Z" fill="url(#md-lump2)"/>
    <path d="M 86 132 C 82 110 96 92 114 96 C 132 96 142 116 134 134 Z" fill="url(#md-lump2)"/>
    </g>
    <!-- tall fruiting stalks with spore caps -->
    <g fill="none" stroke-linecap="round">
    <path d="M 52 108 C 50 86 46 66 50 44" stroke="#4a3208" stroke-width="3.4"/>
    <path d="M 52 108 C 50 86 46 66 50 44" stroke="#b08a34" stroke-width="1.8"/>
    <path d="M 96 104 C 100 80 108 60 106 34" stroke="#4a3208" stroke-width="3.8"/>
    <path d="M 96 104 C 100 80 108 60 106 34" stroke="#b08a34" stroke-width="2"/>
    <path d="M 120 110 C 124 94 130 82 134 68" stroke="#4a3208" stroke-width="2.8"/>
    <path d="M 120 110 C 124 94 130 82 134 68" stroke="#b08a34" stroke-width="1.4"/>
    <path d="M 70 112 C 70 96 66 84 70 70" stroke="#4a3208" stroke-width="2.6"/>
    <path d="M 70 112 C 70 96 66 84 70 70" stroke="#b08a34" stroke-width="1.3"/>
    </g>
    <g stroke="#2a1a04" stroke-width="0.8">
    <ellipse cx="50" cy="42" rx="8" ry="6" fill="url(#md-cap)"/>
    <ellipse cx="106" cy="31" rx="9" ry="7" fill="url(#md-cap)"/>
    <ellipse cx="134" cy="66" rx="6" ry="4.6" fill="url(#md-cap)"/>
    <ellipse cx="70" cy="68" rx="5.4" ry="4.2" fill="url(#md-cap)"/>
    </g>
    <g fill="#2a1a04" opacity="0.6">
    <circle cx="47" cy="41" r="1"/><circle cx="52" cy="44" r="0.9"/><circle cx="103" cy="29" r="1.1"/><circle cx="109" cy="33" r="1"/>
    <circle cx="132" cy="66" r="0.8"/><circle cx="69" cy="67" r="0.8"/>
    </g>
    <!-- spores puffing out -->
    <g fill="#ffe870" filter="url(#md-glow)">
    <circle cx="44" cy="30" r="1.6"/><circle cx="56" cy="24" r="1.2"/><circle cx="100" cy="18" r="1.8"/><circle cx="114" cy="12" r="1.2"/>
    <circle cx="140" cy="52" r="1.3"/><circle cx="64" cy="54" r="1.1"/><circle cx="88" cy="40" r="1"/><circle cx="122" cy="40" r="1.1"/>
    </g>
    <g fill="#fff4b0">
    <circle cx="44" cy="30" r="0.6"/><circle cx="100" cy="18" r="0.7"/><circle cx="140" cy="52" r="0.5"/><circle cx="122" cy="40" r="0.5"/>
    <circle cx="30" cy="48" r="0.6"/><circle cx="76" cy="30" r="0.5"/><circle cx="126" cy="22" r="0.6"/>
    </g>
    
    <!-- main pulsating mass in front -->
    <path d="M 34 140 C 26 124 36 106 54 110 C 60 96 80 94 88 106 C 100 98 120 104 122 120 C 132 124 134 138 124 142 Z" fill="url(#md-lump)" stroke="#1a1004" stroke-width="1.4"/>
    <path d="M 34 140 C 26 124 36 106 54 110 C 60 96 80 94 88 106 C 100 98 120 104 122 120 C 132 124 134 138 124 142 Z" fill="url(#md-pores)"/>
    <g stroke="#2a1a04" stroke-width="1" fill="none" opacity="0.7">
    <path d="M 54 110 C 58 118 56 128 50 136"/><path d="M 88 106 C 84 116 88 128 92 138"/><path d="M 122 120 C 114 124 110 132 110 140"/>
    </g>
    <g fill="#fff0a0" opacity="0.35">
    <ellipse cx="50" cy="116" rx="6" ry="3" transform="rotate(-20 50 116)"/>
    <ellipse cx="78" cy="104" rx="6" ry="2.6"/>
    <ellipse cx="108" cy="110" rx="5" ry="2.4" transform="rotate(15 108 110)"/>
    </g>
    <!-- small mushrooms at the edge -->
    <g stroke="#2a1a04" stroke-width="0.6">
    <path d="M 22 144 L 23 138 L 25 138 L 26 144 Z" fill="#b08a34"/><ellipse cx="24" cy="137.5" rx="4" ry="2.2" fill="url(#md-cap)"/>
    <path d="M 140 144 L 141 139 L 143 139 L 144 144 Z" fill="#b08a34"/><ellipse cx="142" cy="138.5" rx="3.4" ry="1.9" fill="url(#md-cap)"/>
    </g>
    </svg>
  `,

  'Slime Mold': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Slime Mold">
    <defs>
    <radialGradient id="sm-goo" cx="40%" cy="30%" r="75%">
    <stop offset="0" stop-color="#d8ff70" stop-opacity="0.95"/>
    <stop offset="0.45" stop-color="#6ab81a" stop-opacity="0.9"/>
    <stop offset="1" stop-color="#1e4a04" stop-opacity="0.95"/>
    </radialGradient>
    <radialGradient id="sm-pool" cx="50%" cy="50%" r="50%">
    <stop offset="0" stop-color="#4a8a10" stop-opacity="0.8"/>
    <stop offset="1" stop-color="#1e3a04" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="sm-bone" cx="40%" cy="35%" r="70%">
    <stop offset="0" stop-color="#e8e0b0"/>
    <stop offset="1" stop-color="#7a8040"/>
    </radialGradient>
    <radialGradient id="sm-gold" cx="40%" cy="35%" r="60%">
    <stop offset="0" stop-color="#fff0a0"/>
    <stop offset="1" stop-color="#8a7010"/>
    </radialGradient>
    <filter id="sm-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4"/></filter>
    <filter id="sm-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1"/></filter>
    <clipPath id="sm-clip"><path d="M 26 136 C 16 112 24 80 50 66 C 64 50 96 48 112 64 C 138 76 146 110 134 136 Z"/></clipPath>
    </defs>
    
    <!-- sickly glow, and a pool of slime spreading underneath -->
    <ellipse cx="80" cy="98" rx="64" ry="52" fill="#9aff30" opacity="0.12" filter="url(#sm-glow)"/>
    <ellipse cx="80" cy="140" rx="70" ry="12" fill="url(#sm-pool)"/>
    
    <!-- the blob body, translucent -->
    <path d="M 26 136 C 16 112 24 80 50 66 C 64 50 96 48 112 64 C 138 76 146 110 134 136 Z" fill="url(#sm-goo)" stroke="#143204" stroke-width="1.4"/>
    
    <!-- things half-dissolved inside it -->
    <g clip-path="url(#sm-clip)" opacity="0.65">
    <g fill="url(#sm-bone)" stroke="#3a4010" stroke-width="0.6">
    <path d="M 50 104 C 48 96 60 92 64 100 C 66 106 62 110 58 110 L 54 112 C 52 110 50 108 50 104 Z"/>
    <path d="M 84 118 L 112 110 L 113 113 L 85 121 Z"/>
    <circle cx="84" cy="119.5" r="2.4"/><circle cx="112.5" cy="111.5" r="2.4"/>
    </g>
    <circle cx="54" cy="102" r="1.6" fill="#1e3a04"/><circle cx="60" cy="102" r="1.6" fill="#1e3a04"/>
    <g fill="url(#sm-gold)"><ellipse cx="96" cy="92" rx="3" ry="1.6" transform="rotate(20 96 92)"/><ellipse cx="72" cy="124" rx="2.8" ry="1.4"/></g>
    <!-- rising bubbles -->
    <g fill="none" stroke="#e8ffb0" stroke-width="0.7">
    <circle cx="70" cy="80" r="3"/><circle cx="104" cy="76" r="2.2"/><circle cx="118" cy="100" r="3.4"/>
    <circle cx="40" cy="116" r="2.4"/><circle cx="88" cy="68" r="1.6"/><circle cx="62" cy="130" r="2"/>
    </g>
    </g>
    
    <!-- glossy highlights and a darker rim -->
    <path d="M 44 78 C 54 62 76 56 94 58" stroke="#f4ffc8" stroke-width="3" fill="none" opacity="0.55" stroke-linecap="round"/>
    <ellipse cx="54" cy="80" rx="6" ry="3" transform="rotate(-35 54 80)" fill="#fff" opacity="0.7"/>
    <circle cx="64" cy="70" r="1.6" fill="#fff" opacity="0.8"/>
    <path d="M 132 110 C 136 122 132 132 128 136" stroke="#a8ff50" stroke-width="1.4" fill="none" opacity="0.5"/>
    
    <!-- pseudopods and drips -->
    <path d="M 30 120 C 20 118 12 110 10 100 C 9 94 14 94 15 99 C 17 106 22 110 32 110 Z" fill="url(#sm-goo)" stroke="#143204" stroke-width="1"/>
    <path d="M 130 96 C 140 90 148 80 148 70 C 148 64 143 64 143 70 C 143 78 138 84 128 88 Z" fill="url(#sm-goo)" stroke="#143204" stroke-width="1"/>
    <g fill="url(#sm-goo)" stroke="#143204" stroke-width="0.7">
    <path d="M 44 136 C 44 142 42 148 44 152 C 46 154 48 152 47 148 C 46 144 48 140 48 136 Z"/>
    <path d="M 104 136 C 104 140 103 146 105 149 C 107 151 109 149 108 146 C 107 142 108 139 108 136 Z"/>
    <path d="M 146 72 C 147 76 146 80 148 82 C 150 83 151 81 150 78 C 149 76 150 74 149 72 Z"/>
    </g>
    <g fill="#e8ffb0" opacity="0.8"><circle cx="45" cy="150" r="0.8"/><circle cx="106" cy="147" r="0.8"/></g>
    </svg>
  `,

  'Gelatinous Cube': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Gelatinous Cube">
    <defs>
    <linearGradient id="gc-front" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#a8ffe8" stop-opacity="0.38"/>
    <stop offset="0.6" stop-color="#4ac0a8" stop-opacity="0.3"/>
    <stop offset="1" stop-color="#1a6a5a" stop-opacity="0.45"/>
    </linearGradient>
    <linearGradient id="gc-side" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#2a8a78" stop-opacity="0.5"/>
    <stop offset="1" stop-color="#0e4a3e" stop-opacity="0.6"/>
    </linearGradient>
    <linearGradient id="gc-top" x1="0" y1="1" x2="0" y2="0">
    <stop offset="0" stop-color="#8af0d8" stop-opacity="0.45"/>
    <stop offset="1" stop-color="#d8fff4" stop-opacity="0.6"/>
    </linearGradient>
    <radialGradient id="gc-bone" cx="40%" cy="35%" r="70%">
    <stop offset="0" stop-color="#f0ead0"/>
    <stop offset="1" stop-color="#8a8468"/>
    </radialGradient>
    <linearGradient id="gc-steel" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#e0e4ea"/>
    <stop offset="1" stop-color="#4a4e56"/>
    </linearGradient>
    <radialGradient id="gc-gold" cx="40%" cy="35%" r="60%">
    <stop offset="0" stop-color="#fff0a0"/>
    <stop offset="1" stop-color="#a07810"/>
    </radialGradient>
    <filter id="gc-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.2"/></filter>
    <filter id="gc-blur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="0.6"/></filter>
    </defs>
    
    <ellipse cx="82" cy="150" rx="66" ry="6" fill="#000" opacity="0.55" filter="url(#gc-soft)"/>
    <!-- faint green tint glowing off the floor where it rests -->
    <ellipse cx="80" cy="146" rx="60" ry="6" fill="#60ffc0" opacity="0.15" filter="url(#gc-soft)"/>
    
    <!-- back faces (seen through the jelly) -->
    <path d="M 40 24 L 134 24 L 134 124 L 40 124 Z" fill="#0e4a3e" opacity="0.25"/>
    
    <!-- victims and treasure suspended inside, slightly blurred -->
    <g filter="url(#gc-blur)" opacity="0.85">
    <!-- a whole skeleton drifting upright -->
    <g fill="url(#gc-bone)" stroke="#4a4630" stroke-width="0.6">
    <path d="M 58 58 C 56 48 70 46 70 56 C 71 62 68 64 67 66 L 61 66 C 60 64 57 62 58 58 Z"/>
    <path d="M 63 67 L 65 67 L 65 94 L 63 94 Z"/>
    <path d="M 56 72 Q 64 70 72 72 M 56 77 Q 64 75 72 77 M 57 82 Q 64 80 71 82" stroke="#e8e0c0" stroke-width="1.6" fill="none"/>
    <path d="M 58 94 Q 64 90 70 94 L 69 98 Q 64 95 59 98 Z"/>
    <path d="M 60 98 L 56 122 L 58 122 L 62 98 Z M 68 98 L 72 122 L 70 122 L 66 98 Z"/>
    <path d="M 57 70 L 48 88 L 50 89 L 59 72 Z M 71 70 L 82 84 L 80 86 L 69 72 Z"/>
    </g>
    <g fill="#1a2a24"><circle cx="61.4" cy="56" r="1.7"/><circle cx="66.6" cy="56" r="1.7"/></g>
    <!-- a sword, point down -->
    <path d="M 100 44 L 104 44 L 104 96 L 102 102 L 100 96 Z" fill="url(#gc-steel)" stroke="#2a2c30" stroke-width="0.5"/>
    <path d="M 95 44 L 109 44 L 109 47 L 95 47 Z" fill="#8a6a2a"/>
    <path d="M 101 34 L 103 34 L 103 44 L 101 44 Z" fill="#5a3a1a"/>
    <circle cx="102" cy="33" r="2" fill="url(#gc-gold)"/>
    <!-- a helmet and coins -->
    <path d="M 108 108 C 108 98 124 98 124 108 L 124 112 L 108 112 Z" fill="url(#gc-steel)" stroke="#2a2c30" stroke-width="0.6"/>
    <path d="M 115 104 L 117 104 L 117 112 L 115 112 Z" fill="#2a2c30"/>
    <g fill="url(#gc-gold)" stroke="#6a4a04" stroke-width="0.3">
    <ellipse cx="84" cy="112" rx="3" ry="1.5" transform="rotate(25 84 112)"/><ellipse cx="90" cy="70" rx="2.6" ry="1.3" transform="rotate(-30 90 70)"/>
    <ellipse cx="78" cy="98" rx="2.6" ry="1.3"/><ellipse cx="116" cy="70" rx="2.4" ry="1.2" transform="rotate(40 116 70)"/>
    </g>
    <!-- air bubbles -->
    <g fill="none" stroke="#d8fff4" stroke-width="0.6" opacity="0.8">
    <circle cx="48" cy="40" r="2"/><circle cx="120" cy="50" r="1.6"/><circle cx="84" cy="36" r="1.2"/><circle cx="48" cy="108" r="1.8"/>
    </g>
    </g>
    
    <!-- visible faces of the cube -->
    <path d="M 24 40 L 118 40 L 118 144 L 24 144 Z" fill="url(#gc-front)" stroke="#b8fff0" stroke-width="1.2" stroke-opacity="0.7"/>
    <path d="M 118 40 L 142 22 L 142 124 L 118 144 Z" fill="url(#gc-side)" stroke="#b8fff0" stroke-width="1" stroke-opacity="0.55"/>
    <path d="M 24 40 L 48 22 L 142 22 L 118 40 Z" fill="url(#gc-top)" stroke="#e0fff8" stroke-width="1" stroke-opacity="0.8"/>
    <!-- refraction glints and a wobble in the surface -->
    <path d="M 30 50 L 30 90" stroke="#fff" stroke-width="2" opacity="0.35" stroke-linecap="round"/>
    <path d="M 34 46 L 60 46" stroke="#fff" stroke-width="1.4" opacity="0.4" stroke-linecap="round"/>
    <path d="M 52 26 L 96 26" stroke="#fff" stroke-width="1" opacity="0.5" stroke-linecap="round"/>
    <path d="M 124 44 L 136 34" stroke="#fff" stroke-width="1" opacity="0.35"/>
    <path d="M 24 144 Q 40 140 56 144 Q 74 148 90 144 Q 104 140 118 144" stroke="#8af0d8" stroke-width="1" fill="none" opacity="0.6"/>
    <!-- slime drips from the bottom edge -->
    <g fill="#6ad8c0" opacity="0.55">
    <path d="M 40 144 C 40 148 39 151 41 152 C 43 152 43 149 42 144 Z"/>
    <path d="M 92 144 C 92 147 91 150 93 151 C 95 151 95 148 94 144 Z"/>
    </g>
    </svg>
  `,

  'Skeleton': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Skeleton">
    <defs>
    <linearGradient id="sk-bone" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#f4eed8"/>
    <stop offset="0.6" stop-color="#c8bc98"/>
    <stop offset="1" stop-color="#6a5e44"/>
    </linearGradient>
    <radialGradient id="sk-skull" cx="40%" cy="30%" r="70%">
    <stop offset="0" stop-color="#fbf6e6"/>
    <stop offset="0.6" stop-color="#d0c4a0"/>
    <stop offset="1" stop-color="#6a5e44"/>
    </radialGradient>
    <linearGradient id="sk-rust" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#b8a898"/>
    <stop offset="0.5" stop-color="#7a6050"/>
    <stop offset="1" stop-color="#3a2418"/>
    </linearGradient>
    <radialGradient id="sk-wood" cx="45%" cy="40%" r="60%">
    <stop offset="0" stop-color="#7a5a34"/>
    <stop offset="1" stop-color="#2a1a0a"/>
    </radialGradient>
    <filter id="sk-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="1.4"/></filter>
    <filter id="sk-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1"/></filter>
    </defs>
    
    <ellipse cx="80" cy="153" rx="38" ry="4" fill="#000" opacity="0.55" filter="url(#sk-soft)"/>
    
    <!-- rusted sword, raised -->
    <path d="M 118 58 L 138 8 L 142 10 L 124 60 Z" fill="url(#sk-rust)" stroke="#1e140c" stroke-width="0.8"/>
    <path d="M 121 56 L 139 10" stroke="#e0d4c8" stroke-width="0.5" opacity="0.5"/>
    <g fill="#5a3418" opacity="0.8"><circle cx="130" cy="32" r="1.2"/><circle cx="126" cy="44" r="0.9"/><path d="M 136 18 L 139 17 L 137 21 Z"/></g>
    <path d="M 114 58 L 128 64 L 127 67 L 113 61 Z" fill="#5a4a30" stroke="#1e140c" stroke-width="0.6"/>
    <path d="M 118 62 L 115 70 L 118 71 L 121 63 Z" fill="#3a2a1a"/>
    
    <!-- legs: femur, knee, tibia, feet -->
    <g fill="url(#sk-bone)" stroke="#3a3020" stroke-width="0.7">
    <path d="M 70 104 L 64 124 L 67 125 L 73 105 Z"/>
    <path d="M 90 104 L 96 124 L 93 125 L 87 105 Z"/>
    <circle cx="65.5" cy="125" r="2.6"/><circle cx="94.5" cy="125" r="2.6"/>
    <path d="M 64 127 L 62 146 L 65 146 L 67 127 Z"/><path d="M 68 127 L 66.5 145 L 68 145 L 69.5 127 Z"/>
    <path d="M 96 127 L 98 146 L 95 146 L 93 127 Z"/><path d="M 92 127 L 93.5 145 L 92 145 L 90.5 127 Z"/>
    <path d="M 60 146 L 70 146 L 71 150 L 56 150 Z"/><path d="M 90 146 L 100 146 L 104 150 L 89 150 Z"/>
    </g>
    
    <!-- tattered loincloth over the pelvis -->
    <path d="M 66 96 L 94 96 L 96 112 L 90 108 L 86 116 L 81 108 L 76 116 L 72 108 L 64 112 Z" fill="#3a2a22" stroke="#140c08" stroke-width="0.7" opacity="0.9"/>
    <path d="M 68 99 L 92 99" stroke="#6a5040" stroke-width="0.6" opacity="0.6"/>
    <!-- pelvis wings peeking out -->
    <g fill="url(#sk-bone)" stroke="#3a3020" stroke-width="0.6">
    <path d="M 66 96 C 62 92 64 88 70 90 L 72 98 Z"/><path d="M 94 96 C 98 92 96 88 90 90 L 88 98 Z"/>
    </g>
    
    <!-- spine -->
    <g fill="url(#sk-bone)" stroke="#3a3020" stroke-width="0.5">
    <rect x="77.5" y="86" width="5" height="3.4" rx="1"/><rect x="77.5" y="90.5" width="5" height="3.4" rx="1"/>
    <rect x="77.5" y="81.5" width="5" height="3.4" rx="1"/>
    </g>
    <!-- ribcage -->
    <g fill="none" stroke="#3a3020" stroke-width="2.6" stroke-linecap="round">
    <path d="M 79 52 C 68 52 64 58 66 62"/><path d="M 81 52 C 92 52 96 58 94 62"/>
    <path d="M 79 58 C 66 58 62 64 64 69"/><path d="M 81 58 C 94 58 98 64 96 69"/>
    <path d="M 79 64 C 67 64 64 70 66 75"/><path d="M 81 64 C 93 64 96 70 94 75"/>
    <path d="M 79 70 C 69 70 67 75 69 79"/><path d="M 81 70 C 91 70 93 75 91 79"/>
    </g>
    <g fill="none" stroke="url(#sk-bone)" stroke-width="1.8" stroke-linecap="round">
    <path d="M 79 52 C 68 52 64 58 66 62"/><path d="M 81 52 C 92 52 96 58 94 62"/>
    <path d="M 79 58 C 66 58 62 64 64 69"/><path d="M 81 58 C 94 58 98 64 96 69"/>
    <path d="M 79 64 C 67 64 64 70 66 75"/><path d="M 81 64 C 93 64 96 70 94 75"/>
    <path d="M 79 70 C 69 70 67 75 69 79"/><path d="M 81 70 C 91 70 93 75 91 79"/>
    </g>
    <path d="M 78 48 L 82 48 L 82 80 L 78 80 Z" fill="url(#sk-bone)" stroke="#3a3020" stroke-width="0.6"/>
    <!-- collarbones and shoulders -->
    <path d="M 62 50 Q 80 46 98 50" stroke="#3a3020" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M 62 50 Q 80 46 98 50" stroke="#e8e0c8" stroke-width="2" fill="none" stroke-linecap="round"/>
    <circle cx="61" cy="51" r="3.2" fill="url(#sk-bone)" stroke="#3a3020" stroke-width="0.6"/>
    <circle cx="99" cy="51" r="3.2" fill="url(#sk-bone)" stroke="#3a3020" stroke-width="0.6"/>
    
    <!-- shield arm: a cracked, rotted buckler -->
    <g fill="url(#sk-bone)" stroke="#3a3020" stroke-width="0.6">
    <path d="M 59 53 L 50 72 L 53 73 L 62 54 Z"/><circle cx="51" cy="73.5" r="2.2"/>
    <path d="M 50 75 L 46 92 L 49 92 L 53 75 Z"/>
    </g>
    <circle cx="44" cy="92" r="15" fill="url(#sk-wood)" stroke="url(#sk-rust)" stroke-width="2.4"/>
    <path d="M 34 84 L 42 92 L 38 100 M 50 82 L 46 90" stroke="#140a04" stroke-width="1" fill="none"/>
    <circle cx="44" cy="92" r="3.6" fill="url(#sk-rust)" stroke="#1e140c" stroke-width="0.6"/>
    <path d="M 29 92 L 35 88 L 33 96 Z" fill="#000" opacity="0.8"/>
    
    <!-- sword arm raised -->
    <g fill="url(#sk-bone)" stroke="#3a3020" stroke-width="0.6">
    <path d="M 101 52 L 112 68 L 115 66 L 104 50 Z"/><circle cx="113.5" cy="68" r="2.2"/>
    <path d="M 113 66 L 118 56 L 121 58 L 116 68 Z"/>
    </g>
    <g fill="url(#sk-bone)" stroke="#3a3020" stroke-width="0.4">
    <path d="M 117 57 L 121 55 L 122 60 L 118 61 Z"/><path d="M 121 56 L 125 56 L 124 60 L 121 60 Z"/>
    </g>
    
    <!-- skull, with cold pinpoints of light in the sockets -->
    <path d="M 66 30 C 66 18 74 12 80 12 C 88 12 95 18 94 30 C 94 36 91 38 90 42 L 70 42 C 69 38 66 36 66 30 Z" fill="url(#sk-skull)" stroke="#3a3020" stroke-width="1"/>
    <path d="M 71 42 L 89 42 L 88 48 C 84 50 76 50 72 48 Z" fill="url(#sk-skull)" stroke="#3a3020" stroke-width="0.8"/>
    <g stroke="#3a3020" stroke-width="0.5"><path d="M 74 42.5 L 74 47"/><path d="M 77 42.5 L 77 48"/><path d="M 80 42.5 L 80 48.5"/><path d="M 83 42.5 L 83 48"/><path d="M 86 42.5 L 86 47"/></g>
    <path d="M 70 27 C 72 23 77 23 78 27 C 78 32 75 34 72 33 C 70 32 69 30 70 27 Z" fill="#0e0a06"/>
    <path d="M 82 27 C 83 23 88 23 90 27 C 91 30 90 32 88 33 C 85 34 82 32 82 27 Z" fill="#0e0a06"/>
    <circle cx="74" cy="29" r="2.2" fill="#80c8ff" filter="url(#sk-glow)"/>
    <circle cx="86" cy="29" r="2.2" fill="#80c8ff" filter="url(#sk-glow)"/>
    <circle cx="74" cy="29" r="0.9" fill="#fff"/><circle cx="86" cy="29" r="0.9" fill="#fff"/>
    <path d="M 80 33 L 78 38 L 82 38 Z" fill="#0e0a06"/>
    <path d="M 86 14 L 84 20 L 87 23" stroke="#5a4e34" stroke-width="0.6" fill="none"/>
    <ellipse cx="74" cy="18" rx="5" ry="2.4" transform="rotate(-20 74 18)" fill="#fff" opacity="0.4" filter="url(#sk-soft)"/>
    </svg>
  `,

  'Zombie': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Zombie">
    <defs>
    <radialGradient id="zb-skin" cx="40%" cy="30%" r="80%">
    <stop offset="0" stop-color="#a8b48a"/>
    <stop offset="0.5" stop-color="#6a7654"/>
    <stop offset="1" stop-color="#262c1a"/>
    </radialGradient>
    <linearGradient id="zb-cloth" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#1e1a16"/>
    <stop offset="0.5" stop-color="#4a4034"/>
    <stop offset="1" stop-color="#1a1612"/>
    </linearGradient>
    <linearGradient id="zb-bone" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#f0e8cc"/>
    <stop offset="1" stop-color="#8a7a58"/>
    </linearGradient>
    <radialGradient id="zb-wound" cx="50%" cy="50%" r="50%">
    <stop offset="0" stop-color="#2a0806"/>
    <stop offset="1" stop-color="#6a1a12"/>
    </radialGradient>
    <filter id="zb-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="1.2"/></filter>
    <filter id="zb-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1"/></filter>
    </defs>
    
    <ellipse cx="80" cy="153" rx="42" ry="4" fill="#000" opacity="0.55" filter="url(#zb-soft)"/>
    
    <!-- dragging legs, one foot twisted -->
    <path d="M 66 108 C 62 122 60 134 58 146 L 68 146 C 70 134 72 122 74 110 Z" fill="url(#zb-skin)" stroke="#141a0a" stroke-width="1"/>
    <path d="M 88 108 C 94 120 98 132 104 142 L 96 146 C 90 136 86 124 82 112 Z" fill="url(#zb-skin)" stroke="#141a0a" stroke-width="1"/>
    <path d="M 56 146 L 70 146 L 70 150 L 54 150 Z" fill="#4a5436" stroke="#141a0a" stroke-width="0.8"/>
    <path d="M 96 142 L 108 146 L 106 150 L 94 146 Z" fill="#4a5436" stroke="#141a0a" stroke-width="0.8"/>
    <!-- torn trousers -->
    <path d="M 62 100 L 98 100 L 96 122 L 90 118 L 86 126 L 82 118 L 78 128 L 74 118 L 68 124 L 64 118 Z" fill="url(#zb-cloth)" stroke="#0a0806" stroke-width="0.8"/>
    <ellipse cx="72" cy="112" rx="3" ry="2" fill="url(#zb-skin)"/>
    
    <!-- torso: rags hanging off an opened ribcage -->
    <path d="M 60 58 C 56 74 58 92 62 102 L 98 102 C 102 92 104 74 100 58 C 92 54 68 54 60 58 Z" fill="url(#zb-skin)" stroke="#141a0a" stroke-width="1.2"/>
    <path d="M 70 66 C 68 76 70 88 76 94 C 84 94 90 84 90 72 C 88 64 76 62 70 66 Z" fill="url(#zb-wound)" stroke="#2a0806" stroke-width="0.6"/>
    <g fill="none" stroke="url(#zb-bone)" stroke-width="1.8" stroke-linecap="round">
    <path d="M 72 70 Q 80 68 88 70"/><path d="M 71 76 Q 80 74 89 76"/><path d="M 72 82 Q 80 80 88 82"/>
    </g>
    <path d="M 58 58 L 66 56 L 64 80 L 60 92 L 56 74 Z" fill="url(#zb-cloth)" stroke="#0a0806" stroke-width="0.7"/>
    <path d="M 102 58 L 94 56 L 98 76 L 100 94 L 104 72 Z" fill="url(#zb-cloth)" stroke="#0a0806" stroke-width="0.7"/>
    <g fill="#5a6a3a" opacity="0.7"><circle cx="94" cy="88" r="2"/><circle cx="66" cy="94" r="1.6"/></g>
    <path d="M 86 92 L 90 98 L 88 104" stroke="#6a1a12" stroke-width="1.2" fill="none"/>
    
    <!-- arms reaching out toward you -->
    <path d="M 62 60 C 50 62 40 66 30 66 L 30 74 C 42 74 52 72 64 70 Z" fill="url(#zb-skin)" stroke="#141a0a" stroke-width="1"/>
    <path d="M 98 60 C 110 60 122 62 132 60 L 134 68 C 122 70 110 70 98 70 Z" fill="url(#zb-skin)" stroke="#141a0a" stroke-width="1"/>
    <path d="M 44 64 L 52 62 L 54 72 L 46 73 Z" fill="url(#zb-cloth)" opacity="0.9"/>
    <path d="M 114 60 L 110 70 L 118 70 Z" fill="url(#zb-wound)"/>
    <path d="M 112 64 L 122 63" stroke="url(#zb-bone)" stroke-width="1.6"/>
    <!-- grasping hands -->
    <g fill="url(#zb-skin)" stroke="#141a0a" stroke-width="0.7">
    <path d="M 30 64 C 24 62 20 64 18 66 L 12 64 L 18 68 L 10 70 L 18 71 L 12 76 L 20 74 L 18 79 L 26 74 C 30 76 32 74 32 72 Z"/>
    <path d="M 132 58 C 138 56 142 58 144 60 L 150 58 L 144 62 L 152 64 L 144 65 L 150 70 L 142 68 L 144 73 L 136 68 C 132 70 130 68 130 66 Z"/>
    </g>
    
    <!-- head lolling to one side -->
    <path d="M 66 38 C 64 24 72 16 82 16 C 92 16 98 24 96 38 C 96 48 90 56 81 57 C 72 56 67 48 66 38 Z" fill="url(#zb-skin)" stroke="#141a0a" stroke-width="1.2" transform="rotate(-10 81 36)"/>
    <!-- lank hair -->
    <g stroke="#1a1a12" stroke-width="1.2" fill="none" stroke-linecap="round">
    <path d="M 70 22 C 64 28 62 36 64 44"/><path d="M 76 18 C 70 24 68 30 68 36"/><path d="M 90 18 C 94 22 96 28 96 34"/>
    </g>
    <!-- one hollow socket, one clouded eye -->
    <ellipse cx="73" cy="36" rx="4" ry="3.2" fill="#0a0806"/>
    <ellipse cx="87" cy="34" rx="3.6" ry="2.8" fill="#2a2a1a"/>
    <circle cx="87" cy="34" r="2.2" fill="#d8e0b0" filter="url(#zb-glow)" opacity="0.8"/>
    <circle cx="87" cy="34" r="1.6" fill="#e8f0c8"/>
    <circle cx="87.4" cy="34.2" r="0.6" fill="#4a5030" opacity="0.6"/>
    <path d="M 79 40 L 77 45 L 81 45 Z" fill="#141a0a"/>
    <!-- slack jaw, broken teeth, exposed cheek -->
    <path d="M 70 48 Q 80 56 90 46 L 90 52 Q 80 60 71 54 Z" fill="#1a0806" stroke="#141a0a" stroke-width="0.8"/>
    <g fill="url(#zb-bone)"><path d="M 74 49 L 75 52 L 76 49.5 Z"/><path d="M 80 50 L 81 53 L 82 50 Z"/><path d="M 85 48.6 L 86 51 L 87 48.4 Z"/></g>
    <path d="M 90 40 C 94 42 95 46 92 50" fill="url(#zb-wound)" stroke="#2a0806" stroke-width="0.5"/>
    <path d="M 91 43 L 93 45 M 91 46 L 93 47" stroke="url(#zb-bone)" stroke-width="0.8"/>
    <!-- flies -->
    <g fill="#0a0a0a">
    <ellipse cx="104" cy="24" rx="1.2" ry="0.8"/><ellipse cx="112" cy="34" rx="1.2" ry="0.8"/><ellipse cx="58" cy="20" rx="1.2" ry="0.8"/>
    </g>
    <g fill="#c8d0e0" opacity="0.6">
    <ellipse cx="103.5" cy="23" rx="1" ry="0.5"/><ellipse cx="111.5" cy="33" rx="1" ry="0.5"/><ellipse cx="57.5" cy="19" rx="1" ry="0.5"/>
    </g>
    </svg>
  `,

  'Orc': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Orc">
    <defs>
    <radialGradient id="or-skin" cx="40%" cy="30%" r="80%">
    <stop offset="0" stop-color="#9aaa6a"/>
    <stop offset="0.5" stop-color="#5a6a36"/>
    <stop offset="1" stop-color="#1e2610"/>
    </radialGradient>
    <linearGradient id="or-iron" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#b8bcc4"/>
    <stop offset="0.5" stop-color="#5a5e66"/>
    <stop offset="1" stop-color="#1e2024"/>
    </linearGradient>
    <linearGradient id="or-leather" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#24160a"/>
    <stop offset="0.5" stop-color="#5a3a1e"/>
    <stop offset="1" stop-color="#1e1208"/>
    </linearGradient>
    <linearGradient id="or-tusk" x1="0" y1="1" x2="0" y2="0">
    <stop offset="0" stop-color="#8a7a5a"/>
    <stop offset="1" stop-color="#f4ecd4"/>
    </linearGradient>
    <pattern id="or-mail" width="3" height="3" patternUnits="userSpaceOnUse">
    <circle cx="1.5" cy="1.5" r="1.1" fill="none" stroke="#8a8e96" stroke-width="0.45" opacity="0.7"/>
    </pattern>
    <filter id="or-glow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="1.3"/></filter>
    <filter id="or-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1"/></filter>
    </defs>
    
    <ellipse cx="80" cy="153" rx="46" ry="4.5" fill="#000" opacity="0.55" filter="url(#or-soft)"/>
    
    <!-- greataxe: haft behind, head up top right -->
    <path d="M 92 140 L 128 16" stroke="#2a1a0a" stroke-width="4.4" stroke-linecap="round"/>
    <path d="M 92 140 L 128 16" stroke="#6a4a2a" stroke-width="2.8" stroke-linecap="round"/>
    <path d="M 124 22 C 140 12 154 26 150 44 C 142 38 132 36 122 38 Z" fill="url(#or-iron)" stroke="#121416" stroke-width="1"/>
    <path d="M 127 23 C 139 17 149 27 148 39" stroke="#e8ecf0" stroke-width="0.8" fill="none" opacity="0.6"/>
    <path d="M 123 24 L 112 20 L 121 32 Z" fill="url(#or-iron)" stroke="#121416" stroke-width="0.8"/>
    <path d="M 121 30 L 131 33 L 129 26 Z" fill="#3a3e46"/>
    <g fill="#6a3a1a" opacity="0.7"><circle cx="140" cy="30" r="1.2"/><circle cx="135" cy="36" r="0.9"/></g>
    
    <!-- legs: armored boots -->
    <path d="M 58 116 C 52 128 52 138 54 146 L 70 146 C 70 136 72 126 74 118 Z" fill="url(#or-leather)" stroke="#0e0804" stroke-width="1.2"/>
    <path d="M 102 116 C 108 128 108 138 106 146 L 90 146 C 90 136 88 126 86 118 Z" fill="url(#or-leather)" stroke="#0e0804" stroke-width="1.2"/>
    <path d="M 52 136 L 72 136 L 72 149 L 50 149 Z" fill="url(#or-iron)" stroke="#121416" stroke-width="1"/>
    <path d="M 88 136 L 108 136 L 110 149 L 88 149 Z" fill="url(#or-iron)" stroke="#121416" stroke-width="1"/>
    <path d="M 53 139 L 71 139 M 89 139 L 107 139" stroke="#e0e4e8" stroke-width="0.6" opacity="0.5"/>
    
    <!-- torso: mail shirt under a leather harness -->
    <path d="M 50 70 C 43 90 47 110 55 120 L 105 120 C 113 110 117 90 110 70 Z" fill="url(#or-skin)" stroke="#121808" stroke-width="1.4"/>
    <path d="M 54 84 C 50 98 52 112 57 120 L 103 120 C 108 112 110 98 106 84 Z" fill="#3a3e46"/>
    <path d="M 54 84 C 50 98 52 112 57 120 L 103 120 C 108 112 110 98 106 84 Z" fill="url(#or-mail)"/>
    <!-- chest muscle shading above the mail -->
    <path d="M 62 76 Q 70 82 78 78 M 82 78 Q 90 82 98 76" stroke="#1e2610" stroke-width="1" fill="none" opacity="0.7"/>
    <path d="M 54 78 L 104 112 L 100 118 L 50 84 Z" fill="url(#or-leather)" stroke="#0e0804" stroke-width="0.7"/>
    <path d="M 52 106 Q 80 112 108 106 L 108 114 Q 80 120 52 114 Z" fill="url(#or-leather)" stroke="#0e0804" stroke-width="0.8"/>
    <!-- skull buckle -->
    <circle cx="80" cy="111" r="4.6" fill="#e8dcc0" stroke="#4a3a24" stroke-width="0.7"/>
    <circle cx="78.4" cy="110.4" r="1.1" fill="#1a1208"/><circle cx="81.6" cy="110.4" r="1.1" fill="#1a1208"/>
    <path d="M 78 113.4 L 82 113.4" stroke="#1a1208" stroke-width="0.6"/>
    
    <!-- arms -->
    <path d="M 50 74 C 38 84 34 98 36 112 L 48 114 C 46 100 50 90 58 84 Z" fill="url(#or-skin)" stroke="#121808" stroke-width="1.2"/>
    <circle cx="42" cy="116" r="7" fill="#5a6a36" stroke="#121808" stroke-width="1.1"/>
    <path d="M 36 114 Q 42 118 48 114" stroke="#121808" stroke-width="0.8" fill="none"/>
    <path d="M 36 104 L 48 106 L 47 110 L 36 108 Z" fill="url(#or-leather)"/>
    <path d="M 110 74 C 118 84 118 96 114 104 L 104 100 C 106 92 104 84 102 80 Z" fill="url(#or-skin)" stroke="#121808" stroke-width="1.2"/>
    <circle cx="108" cy="104" r="7" fill="#5a6a36" stroke="#121808" stroke-width="1.1"/>
    <path d="M 102 100 L 114 98 L 115 102 L 103 104 Z" fill="url(#or-leather)"/>
    
    <!-- spiked pauldrons -->
    <path d="M 36 78 C 38 64 50 60 62 66 C 60 74 54 80 44 82 Z" fill="url(#or-iron)" stroke="#121416" stroke-width="1.1"/>
    <path d="M 124 78 C 122 64 110 60 98 66 C 100 74 106 80 116 82 Z" fill="url(#or-iron)" stroke="#121416" stroke-width="1.1"/>
    <g fill="url(#or-iron)" stroke="#121416" stroke-width="0.6">
    <path d="M 42 68 L 36 58 L 47 65 Z"/><path d="M 52 63 L 50 52 L 56 62 Z"/>
    <path d="M 118 68 L 124 58 L 113 65 Z"/><path d="M 108 63 L 110 52 L 104 62 Z"/>
    </g>
    <path d="M 40 72 Q 48 64 58 66" stroke="#e8ecf0" stroke-width="0.7" fill="none" opacity="0.5"/>
    <path d="M 120 72 Q 112 64 102 66" stroke="#e8ecf0" stroke-width="0.7" fill="none" opacity="0.5"/>
    
    <!-- head: heavy brow, tusks, topknot -->
    <path d="M 78 32 C 74 22 80 14 86 12 C 84 18 86 24 84 32 Z" fill="#141008" stroke="#000" stroke-width="0.5"/>
    <circle cx="81" cy="30" r="2" fill="#8a6a3a"/>
    <path d="M 63 48 L 56 42 L 62 52 Z" fill="url(#or-skin)" stroke="#121808" stroke-width="0.8"/>
    <path d="M 97 48 L 104 42 L 98 52 Z" fill="url(#or-skin)" stroke="#121808" stroke-width="0.8"/>
    <path d="M 64 52 C 62 38 70 30 80 30 C 90 30 98 38 96 52 C 96 62 90 71 80 71 C 70 71 64 62 64 52 Z" fill="url(#or-skin)" stroke="#121808" stroke-width="1.3"/>
    <path d="M 65 44 Q 80 38 95 44 L 94 49 Q 80 44 66 49 Z" fill="#26300f"/>
    <ellipse cx="73" cy="50" rx="3" ry="1.9" fill="#ff3020" filter="url(#or-glow)" opacity="0.7"/>
    <ellipse cx="87" cy="50" rx="3" ry="1.9" fill="#ff3020" filter="url(#or-glow)" opacity="0.7"/>
    <ellipse cx="73" cy="50" rx="2.1" ry="1.3" fill="#ff7040"/>
    <ellipse cx="87" cy="50" rx="2.1" ry="1.3" fill="#ff7040"/>
    <circle cx="73" cy="50" r="0.7" fill="#1a0202"/><circle cx="87" cy="50" r="0.7" fill="#1a0202"/>
    <path d="M 76 53 Q 80 58 84 53 L 83 58 Q 80 60 77 58 Z" fill="#4a5a26" stroke="#121808" stroke-width="0.6"/>
    <circle cx="78" cy="57" r="0.7" fill="#121808"/><circle cx="82" cy="57" r="0.7" fill="#121808"/>
    <path d="M 70 63 Q 80 67 90 63 Q 80 69 70 63 Z" fill="#1a0806"/>
    <path d="M 71 64 L 70 55 L 74 63 Z" fill="url(#or-tusk)" stroke="#5a4a2a" stroke-width="0.4"/>
    <path d="M 89 64 L 90 55 L 86 63 Z" fill="url(#or-tusk)" stroke="#5a4a2a" stroke-width="0.4"/>
    <path d="M 88 40 L 92 50 M 89.5 42 L 87.5 43 M 91 46 L 89 47" stroke="#2a3014" stroke-width="0.7"/>
    <ellipse cx="72" cy="38" rx="6" ry="3" transform="rotate(-18 72 38)" fill="#fff" opacity="0.13" filter="url(#or-soft)"/>
    </svg>
  `,

  'Titanoboa': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Titanoboa">
    <defs>
    <linearGradient id="tbo-body" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#7a8a3a"/>
    <stop offset="0.5" stop-color="#4a5a1e"/>
    <stop offset="1" stop-color="#1a2208"/>
    </linearGradient>
    <linearGradient id="tbo-belly" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#d8c890"/>
    <stop offset="1" stop-color="#8a7a40"/>
    </linearGradient>
    <radialGradient id="tbo-head" cx="45%" cy="35%" r="70%">
    <stop offset="0" stop-color="#8a9a44"/>
    <stop offset="0.6" stop-color="#4a5a1e"/>
    <stop offset="1" stop-color="#1a2208"/>
    </radialGradient>
    <pattern id="tbo-scales" width="7" height="5" patternUnits="userSpaceOnUse">
    <path d="M 0 5 Q 3.5 0 7 5" fill="none" stroke="#1a2208" stroke-width="0.7" opacity="0.55"/>
    </pattern>
    <pattern id="tbo-blotch" width="26" height="18" patternUnits="userSpaceOnUse">
    <ellipse cx="8" cy="7" rx="5" ry="3.5" fill="#141a06" opacity="0.7"/>
    <ellipse cx="20" cy="14" rx="4" ry="3" fill="#141a06" opacity="0.6"/>
    </pattern>
    <radialGradient id="tbo-mouth" cx="50%" cy="40%" r="60%">
    <stop offset="0" stop-color="#e86a6a"/>
    <stop offset="1" stop-color="#5a0a0a"/>
    </radialGradient>
    <filter id="tbo-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.2"/></filter>
    <filter id="tbo-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="1.2"/></filter>
    </defs>

    <ellipse cx="80" cy="152" rx="70" ry="6" fill="#000" opacity="0.7" filter="url(#tbo-soft)"/>

    <!-- back coil, disappearing into the dark -->
    <path d="M -6 96 C 20 70 60 66 92 76 C 124 86 148 78 168 60" fill="none" stroke="#0c1004" stroke-width="30" stroke-linecap="round"/>
    <path d="M -6 96 C 20 70 60 66 92 76 C 124 86 148 78 168 60" fill="none" stroke="url(#tbo-body)" stroke-width="26" stroke-linecap="round"/>
    <path d="M -6 96 C 20 70 60 66 92 76 C 124 86 148 78 168 60" fill="none" stroke="url(#tbo-blotch)" stroke-width="22"/>
    <path d="M -6 96 C 20 70 60 66 92 76 C 124 86 148 78 168 60" fill="none" stroke="url(#tbo-scales)" stroke-width="26"/>

    <!-- great front coils on the floor -->
    <path d="M -10 140 C 20 112 60 116 80 128 C 100 140 140 142 172 118" fill="none" stroke="#0c1004" stroke-width="38" stroke-linecap="round"/>
    <path d="M -10 140 C 20 112 60 116 80 128 C 100 140 140 142 172 118" fill="none" stroke="url(#tbo-body)" stroke-width="34" stroke-linecap="round"/>
    <path d="M -10 140 C 20 112 60 116 80 128 C 100 140 140 142 172 118" fill="none" stroke="url(#tbo-blotch)" stroke-width="28"/>
    <path d="M -10 140 C 20 112 60 116 80 128 C 100 140 140 142 172 118" fill="none" stroke="url(#tbo-scales)" stroke-width="34"/>
    <!-- belly scutes showing on the lower edge -->
    <path d="M -6 154 C 22 128 60 134 80 146 C 100 156 140 156 170 134" fill="none" stroke="url(#tbo-belly)" stroke-width="6" stroke-dasharray="5 2" opacity="0.8"/>

    <!-- the neck rising out of the coils -->
    <path d="M 78 128 C 70 104 70 82 82 64 C 90 52 96 44 92 34" fill="none" stroke="#0c1004" stroke-width="24" stroke-linecap="round"/>
    <path d="M 78 128 C 70 104 70 82 82 64 C 90 52 96 44 92 34" fill="none" stroke="url(#tbo-body)" stroke-width="20" stroke-linecap="round"/>
    <path d="M 78 128 C 70 104 70 82 82 64 C 90 52 96 44 92 34" fill="none" stroke="url(#tbo-scales)" stroke-width="20"/>
    <path d="M 84 126 C 78 104 78 84 88 66" fill="none" stroke="url(#tbo-belly)" stroke-width="5" stroke-dasharray="4 2" opacity="0.8"/>

    <!-- the head, jaws gaping, coming down at you -->
    <path d="M 62 34 C 60 18 76 8 94 10 C 112 12 122 24 118 38 C 116 46 106 52 94 52 C 78 52 64 46 62 34 Z" fill="url(#tbo-head)" stroke="#0c1004" stroke-width="1.3"/>
    <path d="M 62 34 C 60 18 76 8 94 10 C 112 12 122 24 118 38 C 116 46 106 52 94 52 C 78 52 64 46 62 34 Z" fill="url(#tbo-scales)"/>
    <!-- lower jaw dropped wide -->
    <path d="M 66 40 C 70 58 82 70 94 70 C 106 70 116 58 116 42 C 108 50 100 54 92 54 C 82 54 72 50 66 40 Z" fill="url(#tbo-head)" stroke="#0c1004" stroke-width="1.2"/>
    <path d="M 70 42 C 74 54 84 64 94 64 C 104 64 112 54 112 44 C 106 50 98 52 92 52 C 84 52 76 48 70 42 Z" fill="url(#tbo-mouth)"/>
    <!-- fangs -->
    <g fill="#f8f4e4" stroke="#6a5a3a" stroke-width="0.4">
      <path d="M 74 42 l 2 10 l 2 -9 z"/><path d="M 110 42 l -2 10 l -2 -9 z"/>
      <path d="M 82 46 l 1 5 l 1.5 -5 z"/><path d="M 102 46 l -1 5 l -1.5 -5 z"/>
      <path d="M 80 60 l 1.5 -5 l 1.5 5 z"/><path d="M 104 60 l -1.5 -5 l -1.5 5 z"/>
    </g>
    <!-- forked tongue -->
    <path d="M 92 60 C 92 70 90 78 86 84 M 92 60 C 93 70 96 78 100 82" stroke="#8a0a1a" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <!-- heavy brow and slit eyes -->
    <path d="M 70 26 Q 78 20 86 24 M 118 26 Q 110 20 102 24" stroke="#0c1004" stroke-width="2" fill="none"/>
    <ellipse cx="78" cy="28" rx="4.4" ry="3" fill="#ffd030" filter="url(#tbo-glow)" opacity="0.8"/>
    <ellipse cx="110" cy="28" rx="4.4" ry="3" fill="#ffd030" filter="url(#tbo-glow)" opacity="0.8"/>
    <ellipse cx="78" cy="28" rx="3.4" ry="2.4" fill="#ffd84a"/><ellipse cx="110" cy="28" rx="3.4" ry="2.4" fill="#ffd84a"/>
    <ellipse cx="78" cy="28" rx="0.7" ry="2.3" fill="#0a0a02"/><ellipse cx="110" cy="28" rx="0.7" ry="2.3" fill="#0a0a02"/>
    <!-- heat pits and nostrils -->
    <g fill="#0c1004"><circle cx="88" cy="16" r="1.4"/><circle cx="100" cy="16" r="1.4"/><circle cx="72" cy="36" r="1"/><circle cx="116" cy="36" r="1"/></g>
    <!-- a glint of wet scales -->
    <path d="M 74 18 Q 84 12 96 13" stroke="#e8f0c0" stroke-width="0.8" fill="none" opacity="0.4"/>
    <!-- bones of earlier prey among the coils -->
    <g fill="#d8ccb0" stroke="#4a3a24" stroke-width="0.5">
      <path d="M 118 150 a 6 6 0 0 1 12 0 v 3 l -2 2 h -8 l -2 -2 z"/>
      <path d="M 30 150 l 18 -3 l 1 2 l -18 3 z"/>
    </g>
    <g fill="#1a0e04"><circle cx="122" cy="151" r="1.3"/><circle cx="126" cy="151" r="1.3"/></g>
    </svg>
  `,

  'Wendigo': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Wendigo">
    <defs>
    <linearGradient id="wdg-skin" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#b8b4ac"/>
    <stop offset="0.5" stop-color="#7a766e"/>
    <stop offset="1" stop-color="#2e2c28"/>
    </linearGradient>
    <linearGradient id="wdg-bone" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#f0e8d4"/>
    <stop offset="0.6" stop-color="#c8bc9c"/>
    <stop offset="1" stop-color="#7a6e54"/>
    </linearGradient>
    <linearGradient id="wdg-antler" x1="0" y1="1" x2="0" y2="0">
    <stop offset="0" stop-color="#5a4a34"/>
    <stop offset="1" stop-color="#c8b898"/>
    </linearGradient>
    <radialGradient id="wdg-frost" cx="50%" cy="50%" r="50%">
    <stop offset="0" stop-color="#cfe8ff" stop-opacity="0.5"/>
    <stop offset="1" stop-color="#cfe8ff" stop-opacity="0"/>
    </radialGradient>
    <filter id="wdg-glow" x="-150%" y="-150%" width="400%" height="400%"><feGaussianBlur stdDeviation="1.8"/></filter>
    <filter id="wdg-mist" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="4"/></filter>
    <filter id="wdg-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1"/></filter>
    </defs>

    <ellipse cx="80" cy="154" rx="46" ry="4.5" fill="#000" opacity="0.6" filter="url(#wdg-soft)"/>
    <!-- freezing mist pooling around it -->
    <ellipse cx="80" cy="146" rx="70" ry="14" fill="url(#wdg-frost)" filter="url(#wdg-mist)"/>

    <!-- antlers: huge, branching, cracked -->
    <g fill="none" stroke="url(#wdg-antler)" stroke-linecap="round">
      <path d="M 72 30 C 62 18 50 12 38 4" stroke-width="3.4"/>
      <path d="M 58 18 C 52 10 52 2 54 -4" stroke-width="2.4"/>
      <path d="M 46 9 C 38 6 30 8 24 12" stroke-width="2.2"/>
      <path d="M 66 24 C 60 22 54 24 50 28" stroke-width="2"/>
      <path d="M 88 30 C 98 18 110 12 122 4" stroke-width="3.4"/>
      <path d="M 102 18 C 108 10 108 2 106 -4" stroke-width="2.4"/>
      <path d="M 114 9 C 122 6 130 8 136 12" stroke-width="2.2"/>
      <path d="M 94 24 C 100 22 106 24 110 28" stroke-width="2"/>
    </g>
    <g stroke="#2a2014" stroke-width="0.6" fill="none" opacity="0.7"><path d="M 48 12 l 3 2 M 112 12 l -3 2"/></g>

    <!-- impossibly long, thin arms hanging past the knees -->
    <path d="M 58 62 C 44 76 36 98 32 122 C 31 128 30 132 30 136" fill="none" stroke="#1e1c18" stroke-width="7" stroke-linecap="round"/>
    <path d="M 58 62 C 44 76 36 98 32 122 C 31 128 30 132 30 136" fill="none" stroke="url(#wdg-skin)" stroke-width="5" stroke-linecap="round"/>
    <path d="M 102 62 C 116 76 124 98 128 122 C 129 128 130 132 130 136" fill="none" stroke="#1e1c18" stroke-width="7" stroke-linecap="round"/>
    <path d="M 102 62 C 116 76 124 98 128 122 C 129 128 130 132 130 136" fill="none" stroke="url(#wdg-skin)" stroke-width="5" stroke-linecap="round"/>
    <!-- elbows like knots -->
    <circle cx="40" cy="96" r="3.4" fill="url(#wdg-skin)" stroke="#1e1c18" stroke-width="0.8"/>
    <circle cx="120" cy="96" r="3.4" fill="url(#wdg-skin)" stroke="#1e1c18" stroke-width="0.8"/>
    <!-- hands: long fingers ending in black claws, frost on the tips -->
    <g fill="none" stroke="url(#wdg-skin)" stroke-width="2" stroke-linecap="round">
      <path d="M 30 136 l -8 12 M 30 136 l -3 14 M 30 136 l 2 14 M 30 136 l 7 12"/>
      <path d="M 130 136 l 8 12 M 130 136 l 3 14 M 130 136 l -2 14 M 130 136 l -7 12"/>
    </g>
    <g fill="#0e0c0a">
      <path d="M 22 148 l -2 5 l 3 -3 z"/><path d="M 27 150 l -1 5 l 2 -4 z"/><path d="M 32 150 l 1 5 l 1 -5 z"/><path d="M 37 148 l 3 4 l -2 -4 z"/>
      <path d="M 138 148 l 2 5 l -3 -3 z"/><path d="M 133 150 l 1 5 l -2 -4 z"/><path d="M 128 150 l -1 5 l -1 -5 z"/><path d="M 123 148 l -3 4 l 2 -4 z"/>
    </g>

    <!-- legs: bone-thin, backward-kneed like a deer's -->
    <path d="M 73 112 C 66 124 72 132 64 146 L 60 152" fill="none" stroke="url(#wdg-skin)" stroke-width="4.4" stroke-linecap="round"/>
    <path d="M 87 112 C 94 124 88 132 96 146 L 100 152" fill="none" stroke="url(#wdg-skin)" stroke-width="4.4" stroke-linecap="round"/>
    <circle cx="69" cy="126" r="2.6" fill="url(#wdg-skin)" stroke="#1e1c18" stroke-width="0.6"/><circle cx="91" cy="126" r="2.6" fill="url(#wdg-skin)" stroke="#1e1c18" stroke-width="0.6"/>
    <g fill="#1e1c18"><path d="M 56 152 l 8 0 l -2 4 l -8 0 z"/><path d="M 96 152 l 8 0 l 2 4 l -8 0 z"/></g>

    <!-- emaciated torso: skin stretched over a ribcage, the belly sunken -->
    <path d="M 58 58 C 60 70 64 80 68 90 C 72 98 72 104 71 114 L 89 114 C 88 104 88 98 92 90 C 96 80 100 70 102 58 C 92 54 68 54 58 58 Z" fill="url(#wdg-skin)" stroke="#1e1c18" stroke-width="1.2"/>
    <g stroke="#1e1c18" stroke-width="1.3" fill="none" opacity="0.9">
      <path d="M 61 64 Q 70 70 80 66 Q 90 70 99 64"/><path d="M 63 71 Q 71 77 80 73 Q 89 77 97 71"/>
      <path d="M 65 78 Q 72 83 80 80 Q 88 83 95 78"/><path d="M 67 85 Q 73 89 80 86 Q 87 89 93 85"/>
      <path d="M 80 60 L 80 92"/>
    </g>
    <!-- a hollow, starved belly under the ribs -->
    <path d="M 71 94 Q 80 100 89 94 Q 87 106 80 108 Q 73 106 71 94 Z" fill="#2e2c28" opacity="0.6"/>
    <path d="M 74 112 Q 80 116 86 112" stroke="#1e1c18" stroke-width="1" fill="none" opacity="0.7"/>
    <!-- collarbones and hunched shoulders -->
    <path d="M 58 58 C 64 52 72 54 80 56 C 88 54 96 52 102 58" stroke="#e0dcd4" stroke-width="0.8" fill="none" opacity="0.6"/>

    <!-- the head: a bare deer skull, too long, with a mouth of human-like teeth -->
    <path d="M 66 34 C 66 24 72 20 80 20 C 88 20 94 24 94 34 C 94 44 90 52 86 62 L 74 62 C 70 52 66 44 66 34 Z" fill="url(#wdg-bone)" stroke="#3a3020" stroke-width="1.2"/>
    <path d="M 68 30 Q 74 26 80 28 Q 86 26 92 30" stroke="#5a4a34" stroke-width="0.7" fill="none"/>
    <!-- eye sockets, with cold pale light deep inside -->
    <path d="M 69 34 Q 73 30 77 34 Q 74 40 69 34 Z" fill="#0a0a10"/>
    <path d="M 83 34 Q 87 30 91 34 Q 86 40 83 34 Z" fill="#0a0a10"/>
    <circle cx="73" cy="35" r="2.4" fill="#9fd8ff" filter="url(#wdg-glow)"/>
    <circle cx="87" cy="35" r="2.4" fill="#9fd8ff" filter="url(#wdg-glow)"/>
    <circle cx="73" cy="35" r="1" fill="#f0faff"/><circle cx="87" cy="35" r="1" fill="#f0faff"/>
    <!-- nasal cavity -->
    <path d="M 78 42 L 80 48 L 82 42 Z" fill="#1a1610"/>
    <!-- lipless jaws with blood on the teeth -->
    <path d="M 73 52 L 87 52 L 85 61 L 75 61 Z" fill="#1a0806"/>
    <g fill="#e8e0c8" stroke="#5a4a34" stroke-width="0.3">
      <rect x="74" y="52" width="2" height="3"/><rect x="76.4" y="52" width="2" height="3.4"/><rect x="78.8" y="52" width="2" height="3.4"/><rect x="81.2" y="52" width="2" height="3.4"/><rect x="83.6" y="52" width="2" height="3"/>
      <rect x="75" y="58" width="2" height="3"/><rect x="77.4" y="57.6" width="2" height="3.4"/><rect x="79.8" y="57.6" width="2" height="3.4"/><rect x="82.2" y="58" width="2" height="3"/>
    </g>
    <path d="M 75 61 q 0 6 -1 10 M 85 61 q 1 4 0 8" stroke="#7a0806" stroke-width="1.2" fill="none"/>
    <path d="M 80 61 q 0 4 0 6" stroke="#7a0806" stroke-width="0.8" fill="none" opacity="0.8"/>
    <!-- cracks in the skull -->
    <path d="M 84 22 l -2 6 l 3 4 M 70 26 l 3 4" stroke="#5a4a34" stroke-width="0.6" fill="none"/>
    <!-- frost breath -->
    <ellipse cx="80" cy="70" rx="12" ry="5" fill="url(#wdg-frost)" filter="url(#wdg-mist)"/>
    </svg>
  `,

  'Ghoul': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Ghoul">
    <defs>
    <radialGradient id="gho-skin" cx="45%" cy="35%" r="75%">
    <stop offset="0" stop-color="#a8b098"/>
    <stop offset="0.55" stop-color="#6a7462"/>
    <stop offset="1" stop-color="#262c22"/>
    </radialGradient>
    <linearGradient id="gho-rag" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#4a3e30"/>
    <stop offset="1" stop-color="#1a140e"/>
    </linearGradient>
    <filter id="gho-glow" x="-150%" y="-150%" width="400%" height="400%"><feGaussianBlur stdDeviation="1.4"/></filter>
    <filter id="gho-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1"/></filter>
    </defs>

    <ellipse cx="80" cy="152" rx="52" ry="5" fill="#000" opacity="0.6" filter="url(#gho-soft)"/>

    <!-- the corpse it was eating -->
    <path d="M 26 150 C 40 140 60 142 74 148 L 70 154 L 28 154 Z" fill="#3a3028" stroke="#120e0a" stroke-width="1"/>
    <path d="M 30 148 l 14 -6 M 46 144 l 6 -8" stroke="#d8ccb0" stroke-width="2" stroke-linecap="round"/>
    <ellipse cx="50" cy="150" rx="10" ry="2.4" fill="#5a0806" opacity="0.8"/>

    <!-- hunched body, spine knuckled through the skin -->
    <path d="M 58 92 C 56 74 66 60 84 58 C 102 58 112 70 108 88 C 106 100 98 106 92 114 C 90 120 88 124 84 126 L 72 126 C 68 120 68 112 66 106 C 60 102 58 98 58 92 Z" fill="url(#gho-skin)" stroke="#161a12" stroke-width="1.3"/>
    <g fill="#c8ccbc" stroke="#262c22" stroke-width="0.6">
      <circle cx="74" cy="60" r="2.4"/><circle cx="82" cy="58" r="2.4"/><circle cx="90" cy="59" r="2.4"/><circle cx="98" cy="62" r="2.2"/><circle cx="105" cy="67" r="2"/>
    </g>
    <g stroke="#1a1e16" stroke-width="1.2" fill="none" opacity="0.9"><path d="M 64 76 q 10 5 20 3"/><path d="M 63 83 q 10 5 21 3"/><path d="M 64 90 q 10 5 20 3"/><path d="M 67 97 q 9 4 17 2"/></g>
    <path d="M 70 104 Q 80 110 90 104 Q 86 116 80 118 Q 74 116 70 104 Z" fill="#262c22" opacity="0.55"/>
    <!-- a rag of a burial shroud -->
    <path d="M 66 114 L 94 114 L 98 132 L 90 128 L 84 134 L 78 128 L 72 134 L 66 128 Z" fill="url(#gho-rag)" stroke="#0e0a06" stroke-width="0.8"/>

    <!-- crouched legs -->
    <path d="M 70 124 C 60 128 54 138 58 150 L 68 150 C 66 142 70 136 76 130 Z" fill="url(#gho-skin)" stroke="#161a12" stroke-width="1.1"/>
    <path d="M 90 124 C 102 128 108 138 104 150 L 94 150 C 96 142 92 136 86 130 Z" fill="url(#gho-skin)" stroke="#161a12" stroke-width="1.1"/>
    <circle cx="62" cy="134" r="3" fill="url(#gho-skin)" stroke="#161a12" stroke-width="0.6"/><circle cx="100" cy="134" r="3" fill="url(#gho-skin)" stroke="#161a12" stroke-width="0.6"/>
    <g fill="#1a1612"><path d="M 54 150 l -3 4 l 6 -2 z"/><path d="M 60 150 l -1 5 l 4 -4 z"/><path d="M 110 150 l 3 4 l -6 -2 z"/><path d="M 104 150 l 1 5 l -4 -4 z"/></g>

    <!-- long arms, one reaching for you with hooked claws, one clutching a bone -->
    <path d="M 58 76 C 40 84 30 96 22 108" fill="none" stroke="#161a12" stroke-width="7" stroke-linecap="round"/>
    <path d="M 58 76 C 40 84 30 96 22 108" fill="none" stroke="url(#gho-skin)" stroke-width="5" stroke-linecap="round"/>
    <g fill="none" stroke="#c8ccbc" stroke-width="1.6" stroke-linecap="round">
      <path d="M 22 108 l -10 2 M 22 108 l -9 7 M 22 108 l -5 10 M 22 108 l 1 10"/>
    </g>
    <g fill="#1a1612"><path d="M 12 110 l -4 -1 l 3 3 z"/><path d="M 13 115 l -3 2 l 4 0 z"/><path d="M 17 118 l -2 4 l 3 -2 z"/><path d="M 23 118 l 0 4 l 2 -3 z"/></g>
    <path d="M 108 74 C 122 82 130 96 132 110" fill="none" stroke="#161a12" stroke-width="7" stroke-linecap="round"/>
    <path d="M 108 74 C 122 82 130 96 132 110" fill="none" stroke="url(#gho-skin)" stroke-width="5" stroke-linecap="round"/>
    <path d="M 124 104 L 148 96" stroke="#d8ccb0" stroke-width="3.4" stroke-linecap="round"/>
    <circle cx="149" cy="95" r="3" fill="#d8ccb0"/><circle cx="123" cy="105" r="2.6" fill="#d8ccb0"/>
    <circle cx="132" cy="110" r="4" fill="url(#gho-skin)" stroke="#161a12" stroke-width="0.8"/>

    <!-- the head thrust forward: bald, pointed ears, a grin of needle teeth -->
    <path d="M 62 48 C 60 32 72 24 84 24 C 96 24 106 32 104 48 C 103 60 96 72 84 74 C 72 72 64 60 62 48 Z" fill="url(#gho-skin)" stroke="#161a12" stroke-width="1.3"/>
    <path d="M 66 52 q 3 6 6 9 M 102 52 q -3 6 -6 9" stroke="#262c22" stroke-width="1.1" fill="none" opacity="0.8"/>
    <path d="M 60 44 L 46 36 L 60 52 Z" fill="url(#gho-skin)" stroke="#161a12" stroke-width="0.9"/>
    <path d="M 106 44 L 120 36 L 106 52 Z" fill="url(#gho-skin)" stroke="#161a12" stroke-width="0.9"/>
    <path d="M 66 40 Q 74 36 80 42 M 100 40 Q 92 36 86 42" stroke="#161a12" stroke-width="1.6" fill="none"/>
    <!-- pale, hungry eyes -->
    <ellipse cx="74" cy="45" rx="4" ry="2.6" fill="#e8f080" filter="url(#gho-glow)" opacity="0.8"/>
    <ellipse cx="92" cy="45" rx="4" ry="2.6" fill="#e8f080" filter="url(#gho-glow)" opacity="0.8"/>
    <ellipse cx="74" cy="45" rx="2.6" ry="1.7" fill="#f8ffc0"/><ellipse cx="92" cy="45" rx="2.6" ry="1.7" fill="#f8ffc0"/>
    <circle cx="74" cy="45" r="0.8" fill="#121008"/><circle cx="92" cy="45" r="0.8" fill="#121008"/>
    <path d="M 82 48 L 80 54 L 84 54 Z" fill="#262c22"/>
    <!-- a wide, wet grin -->
    <path d="M 66 58 Q 83 72 100 58 Q 83 66 66 58 Z" fill="#2a0806" stroke="#120402" stroke-width="0.7"/>
    <path d="M 67 58.5 L 69 62 L 71 60 L 73 63.5 L 75 61 L 77 64.5 L 79 61.6 L 81 65 L 83 62 L 85 65 L 87 61.6 L 89 64.5 L 91 61 L 93 63.5 L 95 60 L 97 62 L 99 58.5" fill="none" stroke="#e8e4d0" stroke-width="0.9"/>
    <!-- a long tongue, and gore -->
    <path d="M 84 64 C 86 72 84 80 80 84" stroke="#8a3a3a" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <path d="M 70 62 q -1 6 -3 9 M 96 62 q 1 5 2 8" stroke="#6a0806" stroke-width="1" fill="none"/>
    </svg>
  `,

  'Djinn': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Djinn">
    <defs>
    <radialGradient id="djn-skin" cx="40%" cy="28%" r="80%"><stop offset="0" stop-color="#8fc0ff"/><stop offset="0.5" stop-color="#3366d6"/><stop offset="1" stop-color="#0e1f5c"/></radialGradient>
    <linearGradient id="djn-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2a8"/><stop offset="0.5" stop-color="#d9a52c"/><stop offset="1" stop-color="#6e4c0a"/></linearGradient>
    <linearGradient id="djn-tail" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a6ad8"/><stop offset="0.55" stop-color="#5d8be8"/><stop offset="1" stop-color="#a9c4f4" stop-opacity="0.15"/></linearGradient>
    <linearGradient id="djn-cloth" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4ecdc"/><stop offset="1" stop-color="#b8a684"/></linearGradient>
    <radialGradient id="djn-ruby" cx="40%" cy="35%" r="60%"><stop offset="0" stop-color="#ffd8d8"/><stop offset="0.4" stop-color="#ff1a3a"/><stop offset="1" stop-color="#5a0010"/></radialGradient>
    <radialGradient id="djn-aura" cx="50%" cy="45%" r="50%"><stop offset="0" stop-color="#6aa0ff" stop-opacity="0.35"/><stop offset="1" stop-color="#1a3aa0" stop-opacity="0"/></radialGradient>
    <filter id="djn-glow" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="2.2"/></filter>
    <filter id="djn-soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.4"/></filter>
    <filter id="djn-blur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6"/></filter>
    </defs>

    <ellipse cx="80" cy="76" rx="70" ry="76" fill="url(#djn-aura)" filter="url(#djn-blur)"/>

    <!-- the smoke tail: thick at the waist, spiraling down to a wisp -->
    <path d="M 56 100 C 50 116 60 126 76 128 C 94 130 102 138 92 146 C 84 152 74 150 72 156 C 66 150 70 142 80 140 C 90 138 86 132 74 132 C 52 130 42 116 50 100 Z" fill="url(#djn-tail)" stroke="#1a3a8a" stroke-width="1" filter="url(#djn-soft)"/>
    <path d="M 104 100 C 112 114 104 124 90 126" fill="none" stroke="url(#djn-tail)" stroke-width="14" stroke-linecap="round" filter="url(#djn-soft)"/>
    <g fill="none" stroke="#c8dcff" stroke-width="0.9" opacity="0.7">
      <path d="M 58 110 C 66 120 82 122 92 120"/><path d="M 70 134 C 80 134 88 138 86 142"/>
    </g>

    <!-- golden sash and belt at the waist -->
    <path d="M 52 94 Q 80 102 108 94 L 106 106 Q 80 114 54 106 Z" fill="url(#djn-gold)" stroke="#4a3006" stroke-width="0.9"/>
    <circle cx="80" cy="104" r="4" fill="url(#djn-ruby)" stroke="#d9a52c" stroke-width="1"/>

    <!-- a broad, V-shaped chest: huge shoulders, a narrow waist -->
    <path d="M 52 96 C 46 80 34 66 34 56 C 34 46 46 42 58 42 L 102 42 C 114 42 126 46 126 56 C 126 66 114 80 108 96 Z" fill="url(#djn-skin)" stroke="#081448" stroke-width="1.4"/>
    <g stroke="#0e1f5c" stroke-width="1.2" fill="none" opacity="0.75">
      <path d="M 60 52 Q 70 58 80 54 Q 90 58 100 52"/><path d="M 80 56 L 80 92"/>
      <path d="M 70 76 q 5 3 10 0 M 80 76 q 5 3 10 0"/><path d="M 70 86 q 5 3 10 0 M 80 86 q 5 3 10 0"/>
    </g>

    <!-- arms folded across the chest, gold bracers on the wrists -->
    <path d="M 40 54 C 34 64 38 74 52 74 L 104 70" fill="none" stroke="#081448" stroke-width="15" stroke-linecap="round"/>
    <path d="M 40 54 C 34 64 38 74 52 74 L 104 70" fill="none" stroke="url(#djn-skin)" stroke-width="12" stroke-linecap="round"/>
    <path d="M 120 54 C 126 64 122 74 108 76 L 56 72" fill="none" stroke="#081448" stroke-width="15" stroke-linecap="round"/>
    <path d="M 120 54 C 126 64 122 74 108 76 L 56 72" fill="none" stroke="url(#djn-skin)" stroke-width="12" stroke-linecap="round"/>
    <rect x="94" y="64" width="12" height="13" rx="2" fill="url(#djn-gold)" stroke="#4a3006" stroke-width="0.8"/>
    <rect x="54" y="66" width="12" height="13" rx="2" fill="url(#djn-gold)" stroke="#4a3006" stroke-width="0.8"/>
    <!-- gold armbands high on the arms -->
    <path d="M 34 54 q 6 -4 12 0" stroke="url(#djn-gold)" stroke-width="3" fill="none"/>
    <path d="M 114 54 q 6 -4 12 0" stroke="url(#djn-gold)" stroke-width="3" fill="none"/>

    <!-- head: a heavy brow, glowing eyes, pointed ears, a long forked beard -->
    <path d="M 66 30 C 64 18 72 12 80 12 C 88 12 96 18 94 30 C 93 38 88 44 80 44 C 72 44 67 38 66 30 Z" fill="url(#djn-skin)" stroke="#081448" stroke-width="1.2"/>
    <path d="M 66 28 L 56 20 L 64 34 Z" fill="url(#djn-skin)" stroke="#081448" stroke-width="0.9"/>
    <path d="M 94 28 L 104 20 L 96 34 Z" fill="url(#djn-skin)" stroke="#081448" stroke-width="0.9"/>
    <circle cx="61" cy="30" r="2" fill="none" stroke="url(#djn-gold)" stroke-width="1.2"/>
    <circle cx="99" cy="30" r="2" fill="none" stroke="url(#djn-gold)" stroke-width="1.2"/>
    <path d="M 69 24 L 77 28 M 91 24 L 83 28" stroke="#081448" stroke-width="2.2" stroke-linecap="round"/>
    <ellipse cx="73" cy="30" rx="3" ry="1.8" fill="#fff6b0" filter="url(#djn-glow)"/>
    <ellipse cx="87" cy="30" rx="3" ry="1.8" fill="#fff6b0" filter="url(#djn-glow)"/>
    <ellipse cx="73" cy="30" rx="1.8" ry="1.1" fill="#fffde8"/><ellipse cx="87" cy="30" rx="1.8" ry="1.1" fill="#fffde8"/>
    <path d="M 74 38 Q 80 35 86 38" stroke="#081448" stroke-width="1.3" fill="none"/>
    <path d="M 72 39 C 72 48 75 54 77 62 L 80 54 L 83 62 C 85 54 88 48 88 39 C 84 43 76 43 72 39 Z" fill="#0a0c1e" stroke="#000" stroke-width="0.5"/>
    <!-- a great wrapped turban, the ruby blazing at its front, a plume above -->
    <path d="M 60 20 C 58 4 70 -2 80 -2 C 90 -2 102 4 100 20 C 94 16 66 16 60 20 Z" fill="url(#djn-cloth)" stroke="#6a5a3a" stroke-width="1"/>
    <path d="M 62 16 C 72 8 88 8 98 16 M 61 12 C 72 4 88 4 99 12" stroke="#9a8a68" stroke-width="1" fill="none"/>
    <path d="M 80 -2 C 84 -10 92 -12 96 -8 C 90 -8 86 -4 82 0 Z" fill="#e8463a" stroke="#6a0a0a" stroke-width="0.6"/>
    <circle cx="80" cy="13" r="7" fill="#ff2a3a" filter="url(#djn-glow)" opacity="0.8"/>
    <circle cx="80" cy="13" r="4.6" fill="url(#djn-ruby)" stroke="url(#djn-gold)" stroke-width="1.4"/>
    <circle cx="78.6" cy="11.4" r="1.2" fill="#ffffff" opacity="0.8"/>
    </svg>
  `,

  'Phoenix': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Phoenix">
    <defs>
    <linearGradient id="phx-wing" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ffe680"/><stop offset="0.4" stop-color="#ff8a1a"/><stop offset="0.8" stop-color="#d42a0a"/><stop offset="1" stop-color="#6a0a02" stop-opacity="0.6"/></linearGradient>
    <radialGradient id="phx-body" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#fffbe0"/><stop offset="0.3" stop-color="#ffd040"/><stop offset="0.75" stop-color="#ff6a10"/><stop offset="1" stop-color="#a01a04"/></radialGradient>
    <radialGradient id="phx-halo" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffb040" stop-opacity="0.6"/><stop offset="1" stop-color="#ff4a10" stop-opacity="0"/></radialGradient>
    <filter id="phx-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="phx-blur"><feGaussianBlur stdDeviation="6"/></filter>
    </defs>
    <circle cx="80" cy="70" r="70" fill="url(#phx-halo)" filter="url(#phx-blur)"/>
    <g filter="url(#phx-glow)">
      <!-- great wings of flame, swept up and out -->
      <path d="M 72 70 C 56 50 30 30 2 24 C 14 32 16 40 8 46 C 22 46 26 52 18 60 C 32 58 38 64 30 72 C 44 70 52 76 48 86 Z" fill="url(#phx-wing)"/>
      <path d="M 88 70 C 104 50 130 30 158 24 C 146 32 144 40 152 46 C 138 46 134 52 142 60 C 128 58 122 64 130 72 C 116 70 108 76 112 86 Z" fill="url(#phx-wing)"/>
      <g fill="none" stroke="#fff0a0" stroke-width="0.8" opacity="0.7">
        <path d="M 66 68 C 50 50 30 36 10 30"/><path d="M 64 74 C 46 62 30 54 16 54"/>
        <path d="M 94 68 C 110 50 130 36 150 30"/><path d="M 96 74 C 114 62 130 54 144 54"/>
      </g>
      <!-- long tail plumes of fire -->
      <path d="M 74 100 C 64 120 50 136 40 156 C 56 142 68 128 78 112 Z" fill="url(#phx-wing)"/>
      <path d="M 80 102 C 80 124 78 140 80 160 C 86 140 86 124 84 104 Z" fill="url(#phx-wing)"/>
      <path d="M 86 100 C 96 120 110 136 120 156 C 104 142 92 128 82 112 Z" fill="url(#phx-wing)"/>
      <!-- body -->
      <path d="M 66 74 C 64 60 72 50 80 50 C 88 50 96 60 94 74 C 94 90 88 104 80 106 C 72 104 66 90 66 74 Z" fill="url(#phx-body)"/>
      <!-- head, crest and beak -->
      <path d="M 70 46 C 70 36 76 30 82 30 C 90 30 94 38 92 46 C 90 52 86 56 80 56 C 74 56 70 52 70 46 Z" fill="url(#phx-body)"/>
      <path d="M 78 32 C 72 20 74 10 80 2 C 80 12 84 18 86 22 C 88 14 94 10 98 8 C 94 16 92 24 86 32 Z" fill="url(#phx-wing)"/>
      <path d="M 88 42 L 102 46 L 88 50 Z" fill="#ffd040" stroke="#a04a04" stroke-width="0.8"/>
      <circle cx="84" cy="40" r="2.6" fill="#ffffff"/><circle cx="84" cy="40" r="1.3" fill="#ff2a00"/>
      <!-- talons, outstretched -->
      <g stroke="#ffd040" stroke-width="2" stroke-linecap="round" fill="none"><path d="M 74 104 l -6 10 M 74 104 l -1 12 M 74 104 l 4 11"/><path d="M 86 104 l 6 10 M 86 104 l 1 12 M 86 104 l -4 11"/></g>
    </g>
    <!-- drifting embers -->
    <g fill="#ffe680"><circle cx="30" cy="96" r="1.2"/><circle cx="130" cy="92" r="1.4"/><circle cx="20" cy="70" r="1"/><circle cx="142" cy="72" r="1"/><circle cx="56" cy="20" r="1"/><circle cx="110" cy="16" r="1.2"/></g>
    </svg>
  `,

  'Banshee': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Banshee">
    <defs>
    <radialGradient id="bsh-aura" cx="50%" cy="45%" r="55%"><stop offset="0" stop-color="#b8f0ff" stop-opacity="0.55"/><stop offset="1" stop-color="#3a8ab8" stop-opacity="0"/></radialGradient>
    <linearGradient id="bsh-gown" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8fbff" stop-opacity="0.95"/><stop offset="0.6" stop-color="#9adcf0" stop-opacity="0.6"/><stop offset="1" stop-color="#4a9ac8" stop-opacity="0"/></linearGradient>
    <radialGradient id="bsh-face" cx="45%" cy="35%" r="70%"><stop offset="0" stop-color="#ffffff"/><stop offset="0.7" stop-color="#c8ecf4"/><stop offset="1" stop-color="#7ab8cc"/></radialGradient>
    <linearGradient id="bsh-hair" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8f4f8"/><stop offset="1" stop-color="#8ac8dc" stop-opacity="0.2"/></linearGradient>
    <filter id="bsh-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="bsh-blur"><feGaussianBlur stdDeviation="5"/></filter>
    </defs>
    <ellipse cx="80" cy="76" rx="62" ry="74" fill="url(#bsh-aura)" filter="url(#bsh-blur)"/>
    <g filter="url(#bsh-glow)">
      <!-- hair streaming upward and out, as if underwater -->
      <path d="M 64 40 C 46 30 34 12 38 -2 C 46 12 52 20 66 30 Z" fill="url(#bsh-hair)"/>
      <path d="M 96 40 C 114 30 126 12 122 -2 C 114 12 108 20 94 30 Z" fill="url(#bsh-hair)"/>
      <path d="M 62 50 C 40 52 26 40 16 26 C 30 34 44 38 62 40 Z" fill="url(#bsh-hair)"/>
      <path d="M 98 50 C 120 52 134 40 144 26 C 130 34 116 38 98 40 Z" fill="url(#bsh-hair)"/>
      <!-- tattered gown dissolving into wisps -->
      <path d="M 62 60 C 52 84 46 110 38 150 L 52 140 L 58 156 L 68 138 L 80 158 L 92 138 L 102 156 L 108 140 L 122 150 C 114 110 108 84 98 60 Z" fill="url(#bsh-gown)"/>
      <!-- arms outstretched, fingers long -->
      <path d="M 66 62 C 50 70 34 80 18 84" fill="none" stroke="#c8ecf4" stroke-width="5" stroke-linecap="round" opacity="0.9"/>
      <path d="M 94 62 C 110 70 126 80 142 84" fill="none" stroke="#c8ecf4" stroke-width="5" stroke-linecap="round" opacity="0.9"/>
      <g stroke="#e8fbff" stroke-width="1.4" stroke-linecap="round"><path d="M 18 84 l -8 -2 M 18 84 l -8 3 M 18 84 l -6 7"/><path d="M 142 84 l 8 -2 M 142 84 l 8 3 M 142 84 l 6 7"/></g>
      <!-- the face, wailing: hollow eyes, mouth stretched impossibly -->
      <path d="M 66 40 C 64 26 72 20 80 20 C 88 20 96 26 94 40 C 94 54 88 66 80 68 C 72 66 66 54 66 40 Z" fill="url(#bsh-face)"/>
      <path d="M 64 36 C 64 24 70 18 80 18 C 90 18 96 24 96 36 C 90 28 70 28 64 36 Z" fill="#e8f4f8"/>
      <ellipse cx="73" cy="38" rx="3.4" ry="4.6" fill="#0a2a3a"/><ellipse cx="87" cy="38" rx="3.4" ry="4.6" fill="#0a2a3a"/>
      <circle cx="73" cy="39" r="1.2" fill="#b8f0ff"/><circle cx="87" cy="39" r="1.2" fill="#b8f0ff"/>
      <ellipse cx="80" cy="56" rx="5" ry="9" fill="#06141c"/>
      <path d="M 70 32 L 76 35 M 90 32 L 84 35" stroke="#5a8a9c" stroke-width="1" stroke-linecap="round"/>
    </g>
    <!-- sound rings of the wail -->
    <g fill="none" stroke="#b8f0ff" stroke-width="1" opacity="0.5"><path d="M 60 74 Q 80 86 100 74"/><path d="M 52 84 Q 80 102 108 84"/><path d="M 44 94 Q 80 118 116 94"/></g>
    </svg>
  `,

  'Unicorn': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Unicorn">
    <defs>
    <linearGradient id="uni-coat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="0.7" stop-color="#e4e8f4"/><stop offset="1" stop-color="#a8b0c8"/></linearGradient>
    <linearGradient id="uni-mane" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4f8ff"/><stop offset="0.5" stop-color="#c8d4f4"/><stop offset="1" stop-color="#e8d8ff"/></linearGradient>
    <linearGradient id="uni-horn" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#d8c890"/><stop offset="0.5" stop-color="#fff8e0"/><stop offset="1" stop-color="#ffffff"/></linearGradient>
    <radialGradient id="uni-glow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffffff" stop-opacity="0.9"/><stop offset="1" stop-color="#c8e0ff" stop-opacity="0"/></radialGradient>
    <filter id="uni-blur" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="3"/></filter>
    <filter id="uni-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1"/></filter>
    </defs>
    <ellipse cx="80" cy="154" rx="56" ry="4" fill="#000" opacity="0.5" filter="url(#uni-soft)"/>
    <!-- a halo of silver light around the horn -->
    <circle cx="40" cy="22" r="20" fill="url(#uni-glow)" filter="url(#uni-blur)"/>
    <!-- tail -->
    <path d="M 128 76 C 146 84 150 104 142 124 C 138 112 134 100 124 92 Z" fill="url(#uni-mane)" stroke="#9aa4c4" stroke-width="0.8"/>
    <!-- far legs -->
    <path d="M 108 102 L 112 146 L 120 146 L 118 102 Z" fill="#c8cee0" stroke="#7a84a4" stroke-width="0.8"/>
    <path d="M 66 104 L 60 146 L 68 146 L 74 104 Z" fill="#c8cee0" stroke="#7a84a4" stroke-width="0.8"/>
    <!-- body -->
    <path d="M 52 84 C 50 70 66 62 88 62 C 112 62 132 68 132 86 C 132 100 120 108 104 108 L 70 108 C 58 106 52 96 52 84 Z" fill="url(#uni-coat)" stroke="#7a84a4" stroke-width="1.2"/>
    <path d="M 70 96 Q 90 102 112 96" stroke="#c8cee0" stroke-width="1" fill="none"/>
    <!-- near legs, one foreleg raised, pawing -->
    <path d="M 118 104 L 124 148 L 132 148 L 128 104 Z" fill="url(#uni-coat)" stroke="#7a84a4" stroke-width="0.8"/>
    <path d="M 60 102 C 54 112 46 116 44 124 L 50 128 C 54 120 62 116 68 108 Z" fill="url(#uni-coat)" stroke="#7a84a4" stroke-width="0.8"/>
    <g fill="#d8c070" stroke="#6a5a20" stroke-width="0.6"><path d="M 124 146 h 9 v 4 h -9 z"/><path d="M 112 144 h 9 v 4 h -9 z"/><path d="M 60 144 h 9 v 4 h -9 z"/><path d="M 42 124 l 6 4 l -3 4 l -6 -4 z"/></g>
    <!-- feathered fetlocks -->
    <g fill="#f4f8ff" opacity="0.9"><path d="M 122 138 q 6 4 12 0 l -2 8 h -8 z"/></g>
    <!-- neck, head, lowered for the charge -->
    <path d="M 56 80 C 46 66 40 50 40 36 C 44 28 54 24 62 26 C 66 40 76 54 88 66 C 80 72 66 78 56 80 Z" fill="url(#uni-coat)" stroke="#7a84a4" stroke-width="1.1"/>
    <path d="M 50 70 C 46 58 46 46 48 38" stroke="#c8cee0" stroke-width="1" fill="none"/>
    <path d="M 46 32 C 40 26 30 30 24 38 C 20 44 22 50 28 52 C 34 52 40 48 46 46 C 54 44 60 38 62 30 Z" fill="url(#uni-coat)" stroke="#7a84a4" stroke-width="1.1"/>
    <circle cx="26" cy="46" r="1" fill="#7a84a4"/>
    <path d="M 40 36 Q 43 33 46 36" stroke="#2a2e44" stroke-width="1.2" fill="none"/>
    <ellipse cx="43" cy="37" rx="2.4" ry="1.6" fill="#6a8aff"/><circle cx="43" cy="37" r="0.8" fill="#0a0a1a"/>
    <path d="M 52 28 L 58 20 L 58 30 Z" fill="url(#uni-coat)" stroke="#7a84a4" stroke-width="0.8"/>
    <!-- the spiral horn -->
    <path d="M 46 28 L 30 4 L 50 26 Z" fill="url(#uni-horn)" stroke="#a89860" stroke-width="0.7"/>
    <path d="M 44 24 l 4 0 M 41 19 l 4 0 M 38 14 l 4 0 M 35 9 l 3 0" stroke="#a89860" stroke-width="0.8"/>
    <circle cx="30" cy="4" r="3" fill="#ffffff" filter="url(#uni-blur)"/>
    <!-- flowing mane -->
    <path d="M 60 22 C 70 34 78 48 92 62 C 86 52 86 46 82 40 C 90 48 96 52 102 54 C 92 42 84 32 76 26 C 82 28 86 30 90 30 C 80 22 70 18 60 22 Z" fill="url(#uni-mane)" stroke="#9aa4c4" stroke-width="0.7"/>
    </svg>
  `,

  'Frost Giant': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Frost Giant">
    <defs>
    <radialGradient id="frg-skin" cx="40%" cy="30%" r="80%"><stop offset="0" stop-color="#e4f2ff"/><stop offset="0.55" stop-color="#8ab0d8"/><stop offset="1" stop-color="#2a4a74"/></radialGradient>
    <linearGradient id="frg-iron" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5a6270"/><stop offset="0.5" stop-color="#22262e"/><stop offset="1" stop-color="#0a0c10"/></linearGradient>
    <linearGradient id="frg-ice" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="0.4" stop-color="#bfe8ff"/><stop offset="1" stop-color="#4a9ad8"/></linearGradient>
    <radialGradient id="frg-cold" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#cfefff" stop-opacity="0.5"/><stop offset="1" stop-color="#cfefff" stop-opacity="0"/></radialGradient>
    <filter id="frg-glow" x="-150%" y="-150%" width="400%" height="400%"><feGaussianBlur stdDeviation="1.8"/></filter>
    <filter id="frg-mist" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="4"/></filter>
    <filter id="frg-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1"/></filter>
    </defs>
    <ellipse cx="80" cy="154" rx="64" ry="5" fill="#000" opacity="0.6" filter="url(#frg-soft)"/>
    <ellipse cx="80" cy="146" rx="74" ry="12" fill="url(#frg-cold)" filter="url(#frg-mist)"/>
    <!-- the great axe of ice, raised -->
    <path d="M 120 150 L 138 26" stroke="#2a3a4a" stroke-width="5" stroke-linecap="round"/>
    <path d="M 120 150 L 138 26" stroke="#8ab0d8" stroke-width="3" stroke-linecap="round"/>
    <path d="M 132 30 C 150 14 166 30 160 54 C 150 46 140 44 128 46 Z" fill="url(#frg-ice)" stroke="#3a6a9a" stroke-width="1" opacity="0.95"/>
    <path d="M 136 30 C 124 18 112 24 112 40 C 118 36 126 36 132 38 Z" fill="url(#frg-ice)" stroke="#3a6a9a" stroke-width="1" opacity="0.95"/>
    <path d="M 140 28 L 154 44 M 144 30 L 156 36" stroke="#ffffff" stroke-width="0.8" opacity="0.8"/>
    <!-- legs in iron greaves -->
    <path d="M 54 118 L 48 150 L 70 150 L 72 120 Z" fill="url(#frg-iron)" stroke="#000" stroke-width="1.1"/>
    <path d="M 106 118 L 112 150 L 90 150 L 88 120 Z" fill="url(#frg-iron)" stroke="#000" stroke-width="1.1"/>
    <path d="M 48 136 h 22 M 90 136 h 22" stroke="#cfefff" stroke-width="1" opacity="0.6"/>
    <!-- vast torso: frost-rimed black iron over blue skin -->
    <path d="M 40 72 C 34 96 40 114 52 124 L 108 124 C 120 114 126 96 120 72 C 106 62 54 62 40 72 Z" fill="url(#frg-skin)" stroke="#1a2a44" stroke-width="1.4"/>
    <path d="M 48 80 C 46 98 50 112 56 122 L 104 122 C 110 112 114 98 112 80 C 100 76 60 76 48 80 Z" fill="url(#frg-iron)" stroke="#000" stroke-width="1"/>
    <g stroke="#cfefff" stroke-width="0.9" fill="none" opacity="0.75"><path d="M 54 84 l 6 4 l -2 6"/><path d="M 100 86 l -5 5 l 3 5"/><path d="M 70 100 l 6 3"/><path d="M 88 108 l 6 -3"/></g>
    <path d="M 46 116 Q 80 124 114 116 L 114 124 Q 80 132 46 124 Z" fill="#3a2a1a" stroke="#000" stroke-width="0.8"/>
    <!-- arms: one gripping the axe, one reaching with frost-blackened fingers -->
    <path d="M 116 74 C 128 84 130 98 124 112" fill="none" stroke="#1a2a44" stroke-width="15" stroke-linecap="round"/>
    <path d="M 116 74 C 128 84 130 98 124 112" fill="none" stroke="url(#frg-skin)" stroke-width="12" stroke-linecap="round"/>
    <circle cx="124" cy="114" r="8" fill="url(#frg-skin)" stroke="#1a2a44" stroke-width="1.1"/>
    <path d="M 44 74 C 30 82 20 96 14 112" fill="none" stroke="#1a2a44" stroke-width="15" stroke-linecap="round"/>
    <path d="M 44 74 C 30 82 20 96 14 112" fill="none" stroke="url(#frg-skin)" stroke-width="12" stroke-linecap="round"/>
    <g stroke="#3a5a84" stroke-width="3" stroke-linecap="round"><path d="M 14 112 l -6 8 M 14 112 l -2 10 M 14 112 l 3 10 M 14 112 l 8 6"/></g>
    <!-- frost-spiked pauldrons -->
    <path d="M 30 76 C 32 60 48 56 62 64 C 58 74 50 80 38 82 Z" fill="url(#frg-iron)" stroke="#000" stroke-width="1.1"/>
    <path d="M 130 76 C 128 60 112 56 98 64 C 102 74 110 80 122 82 Z" fill="url(#frg-iron)" stroke="#000" stroke-width="1.1"/>
    <g fill="url(#frg-ice)" stroke="#3a6a9a" stroke-width="0.5"><path d="M 36 66 L 26 50 L 42 62 Z"/><path d="M 48 60 L 44 44 L 54 58 Z"/><path d="M 124 66 L 134 50 L 118 62 Z"/><path d="M 112 60 L 116 44 L 106 58 Z"/></g>
    <!-- head: huge, brutal, with an icicle beard and a crown of ice -->
    <path d="M 62 46 C 60 30 68 22 80 22 C 92 22 100 30 98 46 C 98 56 92 64 80 64 C 68 64 62 56 62 46 Z" fill="url(#frg-skin)" stroke="#1a2a44" stroke-width="1.3"/>
    <g fill="url(#frg-ice)" stroke="#3a6a9a" stroke-width="0.5"><path d="M 64 30 L 62 14 L 70 26 Z"/><path d="M 72 24 L 72 8 L 78 22 Z"/><path d="M 82 22 L 86 6 L 88 22 Z"/><path d="M 92 26 L 98 12 L 96 30 Z"/></g>
    <path d="M 66 40 L 76 44 M 94 40 L 84 44" stroke="#0a1a2e" stroke-width="2.2" stroke-linecap="round"/>
    <ellipse cx="72" cy="46" rx="3.2" ry="2" fill="#bfe8ff" filter="url(#frg-glow)"/><ellipse cx="88" cy="46" rx="3.2" ry="2" fill="#bfe8ff" filter="url(#frg-glow)"/>
    <ellipse cx="72" cy="46" rx="1.8" ry="1.1" fill="#ffffff"/><ellipse cx="88" cy="46" rx="1.8" ry="1.1" fill="#ffffff"/>
    <path d="M 72 55 Q 80 52 88 55 L 86 58 Q 80 56 74 58 Z" fill="#0a1a2e"/>
    <g fill="url(#frg-ice)" stroke="#3a6a9a" stroke-width="0.4"><path d="M 68 58 L 66 76 L 72 60 Z"/><path d="M 74 60 L 74 82 L 78 60 Z"/><path d="M 80 60 L 81 86 L 84 60 Z"/><path d="M 86 60 L 88 80 L 90 59 Z"/><path d="M 92 58 L 95 74 L 95 57 Z"/></g>
    <!-- frozen breath -->
    <ellipse cx="80" cy="66" rx="14" ry="5" fill="url(#frg-cold)" filter="url(#frg-mist)"/>
    </svg>
  `,

  'Gold Dragon': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Gold Dragon">
    <defs>
    <radialGradient id="gdr-scale" cx="40%" cy="30%" r="80%"><stop offset="0" stop-color="#fff4b0"/><stop offset="0.45" stop-color="#e0a82a"/><stop offset="1" stop-color="#5a3a04"/></radialGradient>
    <linearGradient id="gdr-wing" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f0c040"/><stop offset="0.6" stop-color="#a0700e"/><stop offset="1" stop-color="#4a2e02"/></linearGradient>
    <linearGradient id="gdr-horn" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#6a4a10"/><stop offset="1" stop-color="#fff0c0"/></linearGradient>
    <linearGradient id="gdr-sack" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8a5a2a"/><stop offset="1" stop-color="#3a2410"/></linearGradient>
    <radialGradient id="gdr-coin" cx="40%" cy="35%" r="60%"><stop offset="0" stop-color="#fff8c0"/><stop offset="1" stop-color="#b07a10"/></radialGradient>
    <filter id="gdr-glow" x="-150%" y="-150%" width="400%" height="400%"><feGaussianBlur stdDeviation="1.6"/></filter>
    <filter id="gdr-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1"/></filter>
    </defs>
    <ellipse cx="80" cy="154" rx="66" ry="5" fill="#000" opacity="0.55" filter="url(#gdr-soft)"/>
    <!-- wings, spread -->
    <path d="M 64 62 C 46 36 22 24 2 22 C 10 34 6 44 2 52 C 14 50 20 58 14 66 C 26 64 32 72 26 80 C 40 76 50 80 52 90 Z" fill="url(#gdr-wing)" stroke="#3a2402" stroke-width="1.1"/>
    <path d="M 96 62 C 114 36 138 24 158 22 C 150 34 154 44 158 52 C 146 50 140 58 146 66 C 134 64 128 72 134 80 C 120 76 110 80 108 90 Z" fill="url(#gdr-wing)" stroke="#3a2402" stroke-width="1.1"/>
    <g stroke="#5a3a04" stroke-width="1" fill="none"><path d="M 64 62 L 2 22 M 62 66 L 2 52 M 60 72 L 14 66 M 58 78 L 26 80"/><path d="M 96 62 L 158 22 M 98 66 L 158 52 M 100 72 L 146 66 M 102 78 L 134 80"/></g>
    <!-- the hoard -->
    <path d="M 10 156 C 30 134 60 130 80 134 C 104 130 132 136 152 156 Z" fill="url(#gdr-coin)" stroke="#6a4a08" stroke-width="0.8"/>
    <g fill="url(#gdr-coin)" stroke="#6a4a08" stroke-width="0.5">
      <ellipse cx="30" cy="146" rx="4" ry="1.6"/><ellipse cx="46" cy="140" rx="4" ry="1.6"/><ellipse cx="118" cy="142" rx="4" ry="1.6"/><ellipse cx="134" cy="148" rx="4" ry="1.6"/><ellipse cx="70" cy="140" rx="4" ry="1.6"/><ellipse cx="96" cy="138" rx="4" ry="1.6"/>
    </g>
    <path d="M 24 150 l 6 -6 l 4 4 l -6 6 z" fill="#c03030" stroke="#5a0a0a" stroke-width="0.6"/>
    <path d="M 130 140 l 5 -2 l 3 5 l -5 2 z" fill="#3a8ad8" stroke="#0a2a5a" stroke-width="0.6"/>
    <!-- body and haunches -->
    <path d="M 52 110 C 46 88 58 70 80 68 C 102 70 114 88 108 110 C 104 126 94 134 80 134 C 66 134 56 126 52 110 Z" fill="url(#gdr-scale)" stroke="#3a2402" stroke-width="1.3"/>
    <g stroke="#8a5a0a" stroke-width="0.9" fill="none"><path d="M 66 86 Q 80 92 94 86"/><path d="M 64 98 Q 80 104 96 98"/><path d="M 64 110 Q 80 116 96 110"/><path d="M 68 122 Q 80 126 92 122"/></g>
    <!-- one claw clutching the great sack of gold, swung back to strike -->
    <path d="M 104 92 C 118 96 128 104 132 112" fill="none" stroke="#3a2402" stroke-width="11" stroke-linecap="round"/>
    <path d="M 104 92 C 118 96 128 104 132 112" fill="none" stroke="url(#gdr-scale)" stroke-width="8" stroke-linecap="round"/>
    <path d="M 126 100 C 120 92 124 82 134 80 C 148 78 156 90 152 104 C 148 116 132 118 126 108 Z" fill="url(#gdr-sack)" stroke="#1a0e04" stroke-width="1.1"/>
    <path d="M 128 86 q 8 -6 16 -2" stroke="#d4a02a" stroke-width="1.6" fill="none"/>
    <g fill="url(#gdr-coin)"><circle cx="136" cy="84" r="2.6"/><circle cx="142" cy="82" r="2.2"/><circle cx="148" cy="86" r="2"/></g>
    <!-- other forelimb planted, claws in the coins -->
    <path d="M 58 110 C 50 120 46 130 44 140" fill="none" stroke="#3a2402" stroke-width="10" stroke-linecap="round"/>
    <path d="M 58 110 C 50 120 46 130 44 140" fill="none" stroke="url(#gdr-scale)" stroke-width="7" stroke-linecap="round"/>
    <g fill="#fff4d0" stroke="#5a3a04" stroke-width="0.4"><path d="M 38 140 l -4 6 l 6 -3 z"/><path d="M 44 142 l -1 6 l 4 -5 z"/><path d="M 50 141 l 2 6 l 1 -6 z"/></g>
    <!-- neck and head, reared up -->
    <path d="M 70 72 C 66 58 68 46 74 38 L 88 38 C 94 46 96 58 90 72 Z" fill="url(#gdr-scale)" stroke="#3a2402" stroke-width="1.1"/>
    <path d="M 64 34 C 62 20 70 12 80 12 C 90 12 98 20 96 34 C 95 42 90 48 80 48 C 70 48 65 42 64 34 Z" fill="url(#gdr-scale)" stroke="#3a2402" stroke-width="1.2"/>
    <path d="M 70 40 C 72 48 76 54 80 54 C 84 54 88 48 90 40 C 86 44 74 44 70 40 Z" fill="url(#gdr-scale)" stroke="#3a2402" stroke-width="1"/>
    <g fill="#fff8e8"><path d="M 73 44 l 1 4 l 1 -4 z"/><path d="M 85 44 l 1 4 l 1 -4 z"/></g>
    <!-- swept horns and frills -->
    <path d="M 68 18 C 58 10 52 0 54 -6 C 60 2 66 8 74 14 Z" fill="url(#gdr-horn)" stroke="#5a3a04" stroke-width="0.7"/>
    <path d="M 92 18 C 102 10 108 0 106 -6 C 100 2 94 8 86 14 Z" fill="url(#gdr-horn)" stroke="#5a3a04" stroke-width="0.7"/>
    <path d="M 64 30 L 54 26 L 62 36 Z M 96 30 L 106 26 L 98 36 Z" fill="#c08a1a" stroke="#5a3a04" stroke-width="0.6"/>
    <!-- molten-coin eyes -->
    <ellipse cx="73" cy="28" rx="3.6" ry="2.4" fill="#fff0a0" filter="url(#gdr-glow)"/><ellipse cx="87" cy="28" rx="3.6" ry="2.4" fill="#fff0a0" filter="url(#gdr-glow)"/>
    <ellipse cx="73" cy="28" rx="2.6" ry="1.7" fill="#ffd040"/><ellipse cx="87" cy="28" rx="2.6" ry="1.7" fill="#ffd040"/>
    <ellipse cx="73" cy="28" rx="0.7" ry="1.6" fill="#3a1a02"/><ellipse cx="87" cy="28" rx="0.7" ry="1.6" fill="#3a1a02"/>
    <!-- glittering gold dust curling from the nostrils -->
    <g fill="#ffe680" opacity="0.8"><circle cx="76" cy="52" r="0.9"/><circle cx="74" cy="56" r="0.7"/><circle cx="84" cy="52" r="0.9"/><circle cx="86" cy="57" r="0.7"/><circle cx="80" cy="60" r="0.8"/></g>
    </svg>
  `,

  'Giant Spider': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Giant Spider">
    <defs>
    <radialGradient id="gsp-body" cx="40%" cy="30%" r="75%"><stop offset="0" stop-color="#5a4a40"/><stop offset="0.6" stop-color="#2a201a"/><stop offset="1" stop-color="#0a0806"/></radialGradient>
    <radialGradient id="gsp-abd" cx="45%" cy="35%" r="70%"><stop offset="0" stop-color="#4a3a30"/><stop offset="1" stop-color="#120c08"/></radialGradient>
    <filter id="gsp-glow" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="1.2"/></filter>
    <filter id="gsp-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1"/></filter>
    </defs>
    <!-- web strands behind -->
    <g stroke="#c8c8c0" stroke-width="0.5" opacity="0.35" fill="none">
      <path d="M 80 0 L 80 60 M 0 20 L 80 60 L 160 20 M 0 90 L 80 60 L 160 90"/><path d="M 40 30 Q 80 44 120 30 M 20 60 Q 80 76 140 60"/>
      <path d="M 80 0 v 40" stroke-width="1.2" opacity="0.9"/>
    </g>
    <ellipse cx="80" cy="150" rx="60" ry="5" fill="#000" opacity="0.6" filter="url(#gsp-soft)"/>
    <!-- eight long, jointed legs -->
    <g fill="none" stroke="#1a120c" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M 68 82 L 40 56 L 14 76 L 6 104"/><path d="M 66 90 L 34 82 L 16 108 L 14 138"/><path d="M 68 98 L 40 108 L 30 134 L 34 152"/><path d="M 72 104 L 56 124 L 54 146"/>
      <path d="M 92 82 L 120 56 L 146 76 L 154 104"/><path d="M 94 90 L 126 82 L 144 108 L 146 138"/><path d="M 92 98 L 120 108 L 130 134 L 126 152"/><path d="M 88 104 L 104 124 L 106 146"/>
    </g>
    <g fill="none" stroke="#5a4a3a" stroke-width="1.6" stroke-linecap="round" opacity="0.8">
      <path d="M 68 82 L 40 56 L 14 76"/><path d="M 92 82 L 120 56 L 146 76"/><path d="M 66 90 L 34 82"/><path d="M 94 90 L 126 82"/>
    </g>
    <!-- bristles -->
    <g stroke="#0a0806" stroke-width="0.8"><path d="M 40 56 l -3 -4 M 28 66 l -4 -2 M 120 56 l 3 -4 M 132 66 l 4 -2 M 34 82 l -2 -4 M 126 82 l 2 -4"/></g>
    <!-- abdomen with a red hourglass -->
    <ellipse cx="80" cy="112" rx="26" ry="30" fill="url(#gsp-abd)" stroke="#000" stroke-width="1.2"/>
    <path d="M 74 104 L 86 104 L 80 112 L 86 120 L 74 120 L 80 112 Z" fill="#c81a1a"/>
    <!-- head and thorax -->
    <ellipse cx="80" cy="80" rx="18" ry="16" fill="url(#gsp-body)" stroke="#000" stroke-width="1.2"/>
    <!-- a cluster of glittering eyes -->
    <g fill="#ff3a2a" filter="url(#gsp-glow)"><circle cx="74" cy="72" r="2.6"/><circle cx="86" cy="72" r="2.6"/><circle cx="69" cy="76" r="1.6"/><circle cx="91" cy="76" r="1.6"/><circle cx="77" cy="67" r="1.4"/><circle cx="83" cy="67" r="1.4"/></g>
    <g fill="#ffb0a0"><circle cx="74" cy="72" r="1.1"/><circle cx="86" cy="72" r="1.1"/></g>
    <!-- fangs, dripping -->
    <path d="M 74 88 C 72 94 74 98 77 99 C 76 95 77 92 78 89 Z" fill="#1a120c" stroke="#5a4a3a" stroke-width="0.6"/>
    <path d="M 86 88 C 88 94 86 98 83 99 C 84 95 83 92 82 89 Z" fill="#1a120c" stroke="#5a4a3a" stroke-width="0.6"/>
    <circle cx="77" cy="102" r="1.2" fill="#9adf3a"/><circle cx="83" cy="103" r="1" fill="#9adf3a"/>
    </svg>
  `,

  'Stirge Swarm': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Stirge Swarm">
    <defs>
    <radialGradient id="stg-body" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#8a5a4a"/><stop offset="1" stop-color="#2a1410"/></radialGradient>
    <linearGradient id="stg-wing" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a3a3a"/><stop offset="1" stop-color="#1a0c0c"/></linearGradient>
    <g id="stg-one">
      <path d="M 0 0 C -10 -10 -22 -8 -28 -2 C -20 -2 -14 2 -6 4 Z" fill="url(#stg-wing)" stroke="#0a0404" stroke-width="0.6"/>
      <path d="M 0 0 C 10 -10 22 -8 28 -2 C 20 -2 14 2 6 4 Z" fill="url(#stg-wing)" stroke="#0a0404" stroke-width="0.6"/>
      <ellipse cx="0" cy="3" rx="6" ry="7" fill="url(#stg-body)" stroke="#0a0404" stroke-width="0.6"/>
      <path d="M 0 9 L 0 22" stroke="#3a1a10" stroke-width="1.4" stroke-linecap="round"/>
      <circle cx="-2.4" cy="0" r="1.4" fill="#ffd040"/><circle cx="2.4" cy="0" r="1.4" fill="#ffd040"/>
      <path d="M -4 8 l -4 6 M 4 8 l 4 6" stroke="#2a1410" stroke-width="0.8"/>
    </g>
    </defs>
    <!-- the whole cloud of them, near and far -->
    <g opacity="0.5"><use href="#stg-one" transform="translate(30 30) scale(0.6)"/><use href="#stg-one" transform="translate(130 26) scale(0.55)"/><use href="#stg-one" transform="translate(80 18) scale(0.5)"/><use href="#stg-one" transform="translate(140 100) scale(0.55)"/><use href="#stg-one" transform="translate(20 100) scale(0.6)"/></g>
    <use href="#stg-one" transform="translate(48 60) scale(1.1) rotate(-12)"/>
    <use href="#stg-one" transform="translate(112 58) scale(1.1) rotate(14)"/>
    <use href="#stg-one" transform="translate(80 90) scale(1.6)"/>
    <use href="#stg-one" transform="translate(44 118) scale(1.0) rotate(8)"/>
    <use href="#stg-one" transform="translate(118 122) scale(1.0) rotate(-10)"/>
    <!-- blood drips from the near one's proboscis -->
    <circle cx="80" cy="128" r="1.6" fill="#a00a0a"/><circle cx="80" cy="134" r="1.1" fill="#a00a0a"/>
    </svg>
  `,

  'Rust Monster': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Rust Monster">
    <defs>
    <radialGradient id="rst-shell" cx="40%" cy="30%" r="80%"><stop offset="0" stop-color="#d88a4a"/><stop offset="0.55" stop-color="#9a4a1a"/><stop offset="1" stop-color="#3a1806"/></radialGradient>
    <linearGradient id="rst-belly" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c8a878"/><stop offset="1" stop-color="#6a4a2a"/></linearGradient>
    <filter id="rst-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1"/></filter>
    </defs>
    <ellipse cx="80" cy="150" rx="56" ry="5" fill="#000" opacity="0.6" filter="url(#rst-soft)"/>
    <!-- feathery antennae, reaching for your iron -->
    <g fill="none" stroke="#c87a3a" stroke-width="2" stroke-linecap="round">
      <path d="M 70 62 C 60 40 44 28 30 24"/><path d="M 90 62 C 100 40 116 28 130 24"/>
    </g>
    <g stroke="#e8a868" stroke-width="1" stroke-linecap="round">
      <path d="M 58 44 l -6 -4 M 52 38 l -6 -2 M 46 33 l -5 -1 M 40 29 l -5 0 M 60 48 l -4 -6 M 54 41 l -2 -6"/>
      <path d="M 102 44 l 6 -4 M 108 38 l 6 -2 M 114 33 l 5 -1 M 120 29 l 5 0 M 100 48 l 4 -6 M 106 41 l 2 -6"/>
    </g>
    <!-- six stubby legs -->
    <g stroke="#3a1806" stroke-width="5" stroke-linecap="round"><path d="M 50 110 L 34 136"/><path d="M 66 116 L 58 144"/><path d="M 94 116 L 102 144"/><path d="M 110 110 L 126 136"/></g>
    <!-- segmented, armored body -->
    <path d="M 36 104 C 30 80 50 62 80 62 C 110 62 130 80 124 104 C 120 120 100 124 80 124 C 60 124 40 120 36 104 Z" fill="url(#rst-shell)" stroke="#2a1004" stroke-width="1.4"/>
    <g stroke="#3a1806" stroke-width="1.2" fill="none"><path d="M 44 84 Q 80 76 116 84"/><path d="M 40 98 Q 80 90 120 98"/><path d="M 44 112 Q 80 106 116 112"/></g>
    <!-- a ridge of plates down the back -->
    <g fill="#b85a22" stroke="#2a1004" stroke-width="0.8"><path d="M 72 66 l 8 -8 l 8 8 z"/><path d="M 70 80 l 10 -8 l 10 8 z"/><path d="M 70 94 l 10 -8 l 10 8 z"/></g>
    <!-- rust flakes drifting off it -->
    <g fill="#c86a2a" opacity="0.8"><rect x="26" y="70" width="2" height="2"/><rect x="132" y="80" width="2" height="2"/><rect x="40" y="56" width="1.6" height="1.6"/><rect x="122" y="60" width="1.6" height="1.6"/></g>
    <!-- the head: little black eyes, a tail-like snout -->
    <path d="M 66 68 C 66 56 94 56 94 68 C 92 74 68 74 66 68 Z" fill="url(#rst-belly)" stroke="#2a1004" stroke-width="1"/>
    <circle cx="73" cy="64" r="2.4" fill="#0a0402"/><circle cx="87" cy="64" r="2.4" fill="#0a0402"/>
    <circle cx="72.4" cy="63.4" r="0.8" fill="#ffffff"/><circle cx="86.4" cy="63.4" r="0.8" fill="#ffffff"/>
    <!-- a rusted sword in its path, eaten through -->
    <g transform="rotate(-20 30 140)"><rect x="6" y="138" width="50" height="5" fill="#8a4a1a"/><rect x="2" y="134" width="6" height="13" fill="#5a3a1a"/><g fill="#000"><circle cx="24" cy="140" r="1.6"/><circle cx="36" cy="141" r="2"/><circle cx="46" cy="139" r="1.4"/></g></g>
    </svg>
  `,

  'Bugbear': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Bugbear">
    <defs>
    <radialGradient id="bgb-fur" cx="40%" cy="30%" r="80%"><stop offset="0" stop-color="#b8844a"/><stop offset="0.55" stop-color="#7a4e22"/><stop offset="1" stop-color="#2a1806"/></radialGradient>
    <radialGradient id="bgb-face" cx="45%" cy="35%" r="70%"><stop offset="0" stop-color="#d8a868"/><stop offset="1" stop-color="#7a4a1e"/></radialGradient>
    <linearGradient id="bgb-iron" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b8bcc4"/><stop offset="1" stop-color="#2a2c30"/></linearGradient>
    <filter id="bgb-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1"/></filter>
    </defs>
    <ellipse cx="80" cy="152" rx="50" ry="5" fill="#000" opacity="0.6" filter="url(#bgb-soft)"/>
    <!-- morningstar raised overhead -->
    <path d="M 110 76 L 132 26" stroke="#3a2410" stroke-width="5" stroke-linecap="round"/>
    <circle cx="134" cy="20" r="11" fill="url(#bgb-iron)" stroke="#0c0d10" stroke-width="1"/>
    <g fill="url(#bgb-iron)" stroke="#0c0d10" stroke-width="0.5"><path d="M 134 6 l -3 6 h 6 z"/><path d="M 148 20 l -6 -3 v 6 z"/><path d="M 120 20 l 6 -3 v 6 z"/><path d="M 144 10 l -6 2 l 3 4 z"/><path d="M 124 10 l 6 2 l -3 4 z"/><path d="M 144 30 l -6 -2 l 3 -4 z"/></g>
    <!-- legs -->
    <path d="M 60 118 L 54 148 L 70 148 L 74 120 Z" fill="url(#bgb-fur)" stroke="#1a0e04" stroke-width="1.1"/>
    <path d="M 100 118 L 106 148 L 90 148 L 86 120 Z" fill="url(#bgb-fur)" stroke="#1a0e04" stroke-width="1.1"/>
    <!-- hulking furred body, leather harness -->
    <path d="M 46 82 C 40 100 46 116 58 124 L 102 124 C 114 116 120 100 114 82 C 104 66 56 66 46 82 Z" fill="url(#bgb-fur)" stroke="#1a0e04" stroke-width="1.3"/>
    <path d="M 52 76 L 106 118 M 108 76 L 54 118" stroke="#3a2008" stroke-width="5" opacity="0.9"/>
    <circle cx="80" cy="97" r="4" fill="url(#bgb-iron)"/>
    <!-- arms: one up holding the morningstar, one reaching -->
    <path d="M 108 82 C 116 80 112 76 112 74" fill="none" stroke="url(#bgb-fur)" stroke-width="12" stroke-linecap="round"/>
    <path d="M 50 84 C 38 92 30 104 26 116" fill="none" stroke="#1a0e04" stroke-width="13" stroke-linecap="round"/>
    <path d="M 50 84 C 38 92 30 104 26 116" fill="none" stroke="url(#bgb-fur)" stroke-width="10" stroke-linecap="round"/>
    <g stroke="#f0e0c0" stroke-width="1.4" stroke-linecap="round"><path d="M 26 116 l -5 5 M 26 116 l -1 7 M 26 116 l 4 6"/></g>
    <!-- head: bear-like, with a goblin's ears and grin -->
    <path d="M 62 52 C 60 36 70 28 80 28 C 90 28 100 36 98 52 C 98 62 90 70 80 70 C 70 70 62 62 62 52 Z" fill="url(#bgb-fur)" stroke="#1a0e04" stroke-width="1.2"/>
    <path d="M 62 44 L 48 34 L 62 52 Z M 98 44 L 112 34 L 98 52 Z" fill="url(#bgb-fur)" stroke="#1a0e04" stroke-width="0.9"/>
    <path d="M 68 52 C 68 46 92 46 92 52 C 92 62 86 66 80 66 C 74 66 68 62 68 52 Z" fill="url(#bgb-face)"/>
    <path d="M 68 44 L 76 48 M 92 44 L 84 48" stroke="#1a0e04" stroke-width="1.8" stroke-linecap="round"/>
    <circle cx="73" cy="50" r="2" fill="#ffe060"/><circle cx="87" cy="50" r="2" fill="#ffe060"/>
    <circle cx="73" cy="50" r="0.8" fill="#000"/><circle cx="87" cy="50" r="0.8" fill="#000"/>
    <ellipse cx="80" cy="56" rx="3.4" ry="2.4" fill="#2a1406"/>
    <path d="M 72 62 Q 80 66 88 62" stroke="#1a0e04" stroke-width="1.2" fill="none"/>
    <path d="M 74 62 l 1 3 l 1 -3 M 84 62 l 1 3 l 1 -3" fill="#f4ecd8"/>
    </svg>
  `,

  'Troll': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Troll">
    <defs>
    <radialGradient id="trl-skin" cx="40%" cy="30%" r="80%"><stop offset="0" stop-color="#8aaa5a"/><stop offset="0.55" stop-color="#4a6a2a"/><stop offset="1" stop-color="#18240a"/></radialGradient>
    <filter id="trl-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1"/></filter>
    <filter id="trl-glow" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="1.2"/></filter>
    </defs>
    <ellipse cx="80" cy="153" rx="56" ry="5" fill="#000" opacity="0.6" filter="url(#trl-soft)"/>
    <!-- long thin legs, knobby knees -->
    <path d="M 64 112 C 58 126 62 136 56 150 L 68 150 C 72 138 70 126 74 114 Z" fill="url(#trl-skin)" stroke="#0e1606" stroke-width="1.1"/>
    <path d="M 96 112 C 102 126 98 136 104 150 L 92 150 C 88 138 90 126 86 114 Z" fill="url(#trl-skin)" stroke="#0e1606" stroke-width="1.1"/>
    <!-- hunched, rubbery torso -->
    <path d="M 52 66 C 46 84 52 104 62 116 L 98 116 C 108 104 114 84 108 66 C 96 58 64 58 52 66 Z" fill="url(#trl-skin)" stroke="#0e1606" stroke-width="1.3"/>
    <g fill="#2a3a14" opacity="0.6"><circle cx="66" cy="80" r="3"/><circle cx="92" cy="74" r="2.4"/><circle cx="84" cy="96" r="3.4"/><circle cx="70" cy="104" r="2"/></g>
    <!-- lumpy healed scars -->
    <path d="M 60 88 q 8 -2 14 4 M 90 86 q 6 4 12 0" stroke="#a8c878" stroke-width="1.4" fill="none" opacity="0.7"/>
    <!-- arms so long they drag on the floor, with hooked claws -->
    <path d="M 54 68 C 38 84 30 108 26 144" fill="none" stroke="#0e1606" stroke-width="12" stroke-linecap="round"/>
    <path d="M 54 68 C 38 84 30 108 26 144" fill="none" stroke="url(#trl-skin)" stroke-width="9" stroke-linecap="round"/>
    <path d="M 106 68 C 122 84 130 108 134 144" fill="none" stroke="#0e1606" stroke-width="12" stroke-linecap="round"/>
    <path d="M 106 68 C 122 84 130 108 134 144" fill="none" stroke="url(#trl-skin)" stroke-width="9" stroke-linecap="round"/>
    <g fill="#1a1a10"><path d="M 20 146 l -4 8 l 7 -5 z"/><path d="M 26 148 l -1 8 l 4 -7 z"/><path d="M 32 146 l 3 8 l 0 -8 z"/><path d="M 140 146 l 4 8 l -7 -5 z"/><path d="M 134 148 l 1 8 l -4 -7 z"/><path d="M 128 146 l -3 8 l 0 -8 z"/></g>
    <!-- head: long nose, warty, stringy black hair, mouth full of tusks -->
    <path d="M 64 46 C 62 30 70 22 80 22 C 90 22 98 30 96 46 C 96 58 90 66 80 68 C 70 66 64 58 64 46 Z" fill="url(#trl-skin)" stroke="#0e1606" stroke-width="1.2"/>
    <path d="M 64 36 C 56 40 52 54 50 66 M 96 36 C 104 40 108 54 110 66 M 70 26 C 64 30 60 40 58 52 M 90 26 C 96 30 100 40 102 52" stroke="#0a0a06" stroke-width="2" fill="none"/>
    <path d="M 78 44 C 74 54 76 60 80 62 C 84 60 86 54 82 44 Z" fill="#5a7a32" stroke="#0e1606" stroke-width="0.8"/>
    <ellipse cx="72" cy="42" rx="2.6" ry="1.8" fill="#ffcc40" filter="url(#trl-glow)"/><ellipse cx="88" cy="42" rx="2.6" ry="1.8" fill="#ffcc40" filter="url(#trl-glow)"/>
    <circle cx="72" cy="42" r="0.8" fill="#000"/><circle cx="88" cy="42" r="0.8" fill="#000"/>
    <path d="M 70 62 Q 80 70 90 62" stroke="#0a0a06" stroke-width="1.6" fill="none"/>
    <path d="M 72 63 L 71 56 L 75 63 Z M 88 63 L 89 56 L 85 63 Z" fill="#e8e0c0"/>
    <path d="M 76 64 v 3 M 80 65 v 3 M 84 64 v 3" stroke="#e8e0c0" stroke-width="1.2"/>
    <circle cx="68" cy="52" r="1.4" fill="#2a3a14"/><circle cx="92" cy="34" r="1.6" fill="#2a3a14"/>
    </svg>
  `,

  'Minotaur': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Minotaur">
    <defs>
    <radialGradient id="min-fur" cx="40%" cy="30%" r="80%"><stop offset="0" stop-color="#7a4a2a"/><stop offset="0.55" stop-color="#4a2a14"/><stop offset="1" stop-color="#180c04"/></radialGradient>
    <radialGradient id="min-skin" cx="40%" cy="30%" r="80%"><stop offset="0" stop-color="#c8865a"/><stop offset="0.6" stop-color="#8a5030"/><stop offset="1" stop-color="#3a1e0c"/></radialGradient>
    <linearGradient id="min-horn" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#8a7a5a"/><stop offset="1" stop-color="#f4ecd4"/></linearGradient>
    <linearGradient id="min-iron" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c8ccd4"/><stop offset="1" stop-color="#2a2c32"/></linearGradient>
    <filter id="min-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1"/></filter>
    <filter id="min-glow" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="1.4"/></filter>
    </defs>
    <ellipse cx="80" cy="153" rx="58" ry="5" fill="#000" opacity="0.6" filter="url(#min-soft)"/>
    <!-- great double axe -->
    <path d="M 120 150 L 136 30" stroke="#3a2410" stroke-width="4.4" stroke-linecap="round"/>
    <path d="M 132 36 C 150 26 160 44 152 62 C 144 54 136 52 128 54 Z" fill="url(#min-iron)" stroke="#0c0d10" stroke-width="1"/>
    <path d="M 136 36 C 120 24 108 36 110 54 C 116 48 124 46 132 48 Z" fill="url(#min-iron)" stroke="#0c0d10" stroke-width="1"/>
    <!-- hooves and legs -->
    <path d="M 58 114 C 54 128 56 138 52 148 L 68 148 C 70 138 70 126 74 116 Z" fill="url(#min-fur)" stroke="#0a0602" stroke-width="1.1"/>
    <path d="M 102 114 C 106 128 104 138 108 148 L 92 148 C 90 138 90 126 86 116 Z" fill="url(#min-fur)" stroke="#0a0602" stroke-width="1.1"/>
    <g fill="#1a1006"><path d="M 50 146 h 20 l -2 6 h -16 z"/><path d="M 90 146 h 20 l 2 6 h -16 z"/></g>
    <!-- massive, muscled man's torso -->
    <path d="M 40 70 C 34 92 42 110 56 118 L 104 118 C 118 110 126 92 120 70 C 106 60 54 60 40 70 Z" fill="url(#min-skin)" stroke="#2a1006" stroke-width="1.3"/>
    <g stroke="#3a1e0c" stroke-width="1.2" fill="none" opacity="0.75"><path d="M 60 76 Q 70 84 80 80 Q 90 84 100 76"/><path d="M 80 82 L 80 110"/><path d="M 68 96 q 6 3 12 0 M 80 96 q 6 3 12 0"/></g>
    <path d="M 52 112 L 108 112 L 110 122 L 50 122 Z" fill="#3a2410" stroke="#0a0602" stroke-width="0.8"/>
    <!-- arms -->
    <path d="M 118 74 C 128 84 128 98 122 110" fill="none" stroke="#2a1006" stroke-width="14" stroke-linecap="round"/>
    <path d="M 118 74 C 128 84 128 98 122 110" fill="none" stroke="url(#min-skin)" stroke-width="11" stroke-linecap="round"/>
    <path d="M 42 74 C 30 84 26 100 30 114" fill="none" stroke="#2a1006" stroke-width="14" stroke-linecap="round"/>
    <path d="M 42 74 C 30 84 26 100 30 114" fill="none" stroke="url(#min-skin)" stroke-width="11" stroke-linecap="round"/>
    <!-- bull's head, lowered to charge, horns forward -->
    <path d="M 60 48 C 56 32 66 22 80 22 C 94 22 104 32 100 48 C 98 60 92 70 80 72 C 68 70 62 60 60 48 Z" fill="url(#min-fur)" stroke="#0a0602" stroke-width="1.3"/>
    <path d="M 62 34 C 46 30 34 18 32 4 C 42 16 54 22 66 26 Z" fill="url(#min-horn)" stroke="#4a3a24" stroke-width="0.8"/>
    <path d="M 98 34 C 114 30 126 18 128 4 C 118 16 106 22 94 26 Z" fill="url(#min-horn)" stroke="#4a3a24" stroke-width="0.8"/>
    <path d="M 70 56 C 70 66 90 66 90 56 C 90 52 70 52 70 56 Z" fill="#5a3418" stroke="#0a0602" stroke-width="0.8"/>
    <ellipse cx="75" cy="60" rx="2" ry="1.4" fill="#0a0602"/><ellipse cx="85" cy="60" rx="2" ry="1.4" fill="#0a0602"/>
    <path d="M 76 64 A 4 4 0 0 0 84 64" stroke="url(#min-iron)" stroke-width="1.6" fill="none"/>
    <ellipse cx="70" cy="42" rx="3" ry="2" fill="#ff3a14" filter="url(#min-glow)"/><ellipse cx="90" cy="42" rx="3" ry="2" fill="#ff3a14" filter="url(#min-glow)"/>
    <circle cx="70" cy="42" r="1" fill="#ffd0a0"/><circle cx="90" cy="42" r="1" fill="#ffd0a0"/>
    <!-- steam snorted from the nostrils -->
    <g fill="#e8e8e8" opacity="0.45"><circle cx="64" cy="62" r="3"/><circle cx="58" cy="60" r="2.2"/><circle cx="96" cy="62" r="3"/><circle cx="102" cy="60" r="2.2"/></g>
    </svg>
  `,

  'Werewolf': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Werewolf">
    <defs>
    <radialGradient id="wwf-fur" cx="40%" cy="30%" r="80%"><stop offset="0" stop-color="#8a8278"/><stop offset="0.55" stop-color="#4a443c"/><stop offset="1" stop-color="#16130f"/></radialGradient>
    <radialGradient id="wwf-moon" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fffbe8"/><stop offset="0.7" stop-color="#e8e0c0"/><stop offset="1" stop-color="#e8e0c0" stop-opacity="0"/></radialGradient>
    <filter id="wwf-glow" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="1.4"/></filter>
    <filter id="wwf-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1"/></filter>
    </defs>
    <circle cx="124" cy="26" r="20" fill="url(#wwf-moon)" opacity="0.5"/>
    <ellipse cx="80" cy="153" rx="52" ry="5" fill="#000" opacity="0.6" filter="url(#wwf-soft)"/>
    <!-- digitigrade wolf legs -->
    <path d="M 62 112 C 54 122 62 132 54 140 L 50 150 L 64 150 L 68 140 C 74 132 70 122 74 114 Z" fill="url(#wwf-fur)" stroke="#0a0806" stroke-width="1.1"/>
    <path d="M 98 112 C 106 122 98 132 106 140 L 110 150 L 96 150 L 92 140 C 86 132 90 122 86 114 Z" fill="url(#wwf-fur)" stroke="#0a0806" stroke-width="1.1"/>
    <!-- hunched, shaggy torso, the shreds of a shirt -->
    <path d="M 46 70 C 40 90 48 108 60 116 L 100 116 C 112 108 120 90 114 70 C 102 58 58 58 46 70 Z" fill="url(#wwf-fur)" stroke="#0a0806" stroke-width="1.3"/>
    <g stroke="#2a2620" stroke-width="1.2" fill="none"><path d="M 54 74 l -4 6 M 62 70 l -2 7 M 98 70 l 2 7 M 106 74 l 4 6 M 70 90 l -3 6 M 90 90 l 3 6"/></g>
    <path d="M 60 104 L 66 116 L 70 108 L 76 116 L 80 106 L 86 116 L 90 108 L 96 116 L 100 104 Z" fill="#6a2a2a" opacity="0.85"/>
    <!-- arms, claws spread -->
    <path d="M 50 74 C 36 84 28 98 24 112" fill="none" stroke="#0a0806" stroke-width="13" stroke-linecap="round"/>
    <path d="M 50 74 C 36 84 28 98 24 112" fill="none" stroke="url(#wwf-fur)" stroke-width="10" stroke-linecap="round"/>
    <path d="M 110 74 C 124 84 132 98 136 112" fill="none" stroke="#0a0806" stroke-width="13" stroke-linecap="round"/>
    <path d="M 110 74 C 124 84 132 98 136 112" fill="none" stroke="url(#wwf-fur)" stroke-width="10" stroke-linecap="round"/>
    <g stroke="#f0e8d8" stroke-width="1.6" stroke-linecap="round"><path d="M 24 112 l -7 3 M 24 112 l -5 7 M 24 112 l -1 9 M 24 112 l 4 8"/><path d="M 136 112 l 7 3 M 136 112 l 5 7 M 136 112 l 1 9 M 136 112 l -4 8"/></g>
    <!-- wolf head: long snout, snarling -->
    <path d="M 62 44 C 60 30 68 22 80 22 C 92 22 100 30 98 44 C 98 52 94 58 90 62 L 70 62 C 66 58 62 52 62 44 Z" fill="url(#wwf-fur)" stroke="#0a0806" stroke-width="1.2"/>
    <path d="M 64 30 L 58 10 L 72 24 Z M 96 30 L 102 10 L 88 24 Z" fill="url(#wwf-fur)" stroke="#0a0806" stroke-width="0.9"/>
    <path d="M 70 46 C 70 58 74 72 80 74 C 86 72 90 58 90 46 Z" fill="#7a7268" stroke="#0a0806" stroke-width="1"/>
    <path d="M 76 50 L 80 66 L 84 50" stroke="#3a342c" stroke-width="1" fill="none" opacity="0.7"/>
    <ellipse cx="80" cy="72" rx="4" ry="2.6" fill="#0a0806"/>
    <path d="M 72 64 C 76 70 84 70 88 64 L 86 70 C 82 74 78 74 74 70 Z" fill="#5a0a0a"/>
    <g fill="#f4ecd8"><path d="M 73 64 l 1 4 l 1 -4 z"/><path d="M 85 64 l 1 4 l 1 -4 z"/><path d="M 76 66 l 1 3 l 1 -3 z"/><path d="M 82 66 l 1 3 l 1 -3 z"/></g>
    <path d="M 66 38 L 75 42 M 94 38 L 85 42" stroke="#0a0806" stroke-width="1.8" stroke-linecap="round"/>
    <ellipse cx="72" cy="44" rx="2.8" ry="1.8" fill="#ffd040" filter="url(#wwf-glow)"/><ellipse cx="88" cy="44" rx="2.8" ry="1.8" fill="#ffd040" filter="url(#wwf-glow)"/>
    <ellipse cx="72" cy="44" rx="0.7" ry="1.6" fill="#000"/><ellipse cx="88" cy="44" rx="0.7" ry="1.6" fill="#000"/>
    <path d="M 78 76 q 0 6 -1 10" stroke="#c8d8e0" stroke-width="0.8" fill="none" opacity="0.7"/>
    </svg>
  `,

  'Gargoyle': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Gargoyle">
    <defs>
    <radialGradient id="grg-stone" cx="40%" cy="30%" r="80%"><stop offset="0" stop-color="#a8a49c"/><stop offset="0.55" stop-color="#5e5a54"/><stop offset="1" stop-color="#1e1c1a"/></radialGradient>
    <linearGradient id="grg-wing" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a766e"/><stop offset="1" stop-color="#2a2826"/></linearGradient>
    <filter id="grg-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1"/></filter>
    <filter id="grg-glow" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="1.4"/></filter>
    </defs>
    <ellipse cx="80" cy="153" rx="56" ry="5" fill="#000" opacity="0.6" filter="url(#grg-soft)"/>
    <!-- stone wings, raised -->
    <path d="M 64 70 C 46 50 26 30 6 26 C 14 36 12 46 6 52 C 18 52 22 60 16 68 C 28 66 34 74 30 82 C 42 78 50 82 54 90 Z" fill="url(#grg-wing)" stroke="#121110" stroke-width="1.1"/>
    <path d="M 96 70 C 114 50 134 30 154 26 C 146 36 148 46 154 52 C 142 52 138 60 144 68 C 132 66 126 74 130 82 C 118 78 110 82 106 90 Z" fill="url(#grg-wing)" stroke="#121110" stroke-width="1.1"/>
    <!-- crouched on a broken plinth -->
    <path d="M 40 146 L 120 146 L 116 134 L 44 134 Z" fill="#3a3834" stroke="#121110" stroke-width="1"/>
    <path d="M 56 136 L 50 120 L 66 112 L 72 132 Z M 104 136 L 110 120 L 94 112 L 88 132 Z" fill="url(#grg-stone)" stroke="#121110" stroke-width="1.1"/>
    <path d="M 52 98 C 46 112 52 126 62 132 L 98 132 C 108 126 114 112 108 98 C 98 88 62 88 52 98 Z" fill="url(#grg-stone)" stroke="#121110" stroke-width="1.3"/>
    <path d="M 56 74 C 50 86 54 96 60 100 L 100 100 C 106 96 110 86 104 74 C 96 66 64 66 56 74 Z" fill="url(#grg-stone)" stroke="#121110" stroke-width="1.3"/>
    <!-- cracks in the stone -->
    <g stroke="#1a1816" stroke-width="0.9" fill="none"><path d="M 70 80 l 4 8 l -2 6"/><path d="M 94 106 l -6 6 l 2 6"/><path d="M 60 110 l 6 4"/></g>
    <!-- clawed hands on its knees -->
    <g fill="url(#grg-stone)" stroke="#121110" stroke-width="1"><ellipse cx="56" cy="116" rx="8" ry="6"/><ellipse cx="104" cy="116" rx="8" ry="6"/></g>
    <g stroke="#1a1816" stroke-width="1.6" stroke-linecap="round"><path d="M 50 120 l -3 6 M 55 122 l -1 6 M 60 121 l 1 6 M 110 120 l 3 6 M 105 122 l 1 6 M 100 121 l -1 6"/></g>
    <!-- grotesque head: horns, wide grin of granite teeth -->
    <path d="M 64 50 C 62 36 70 28 80 28 C 90 28 98 36 96 50 C 96 60 90 68 80 70 C 70 68 64 60 64 50 Z" fill="url(#grg-stone)" stroke="#121110" stroke-width="1.2"/>
    <path d="M 66 38 C 58 30 56 18 60 10 C 64 20 68 26 72 32 Z M 94 38 C 102 30 104 18 100 10 C 96 20 92 26 88 32 Z" fill="url(#grg-stone)" stroke="#121110" stroke-width="0.9"/>
    <path d="M 66 46 L 76 50 M 94 46 L 84 50" stroke="#121110" stroke-width="2.2" stroke-linecap="round"/>
    <ellipse cx="72" cy="52" rx="2.6" ry="1.6" fill="#ff6a1a" filter="url(#grg-glow)"/><ellipse cx="88" cy="52" rx="2.6" ry="1.6" fill="#ff6a1a" filter="url(#grg-glow)"/>
    <path d="M 68 60 Q 80 70 92 60 Q 80 64 68 60 Z" fill="#121110"/>
    <path d="M 69 60.5 L 71 64 L 73 61.5 L 75 65 L 77 62 L 79 65 L 81 62 L 83 65 L 85 62 L 87 65 L 89 61.5 L 91 60.5" fill="none" stroke="#c8c4bc" stroke-width="1"/>
    </svg>
  `,

  'Harpy': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Harpy">
    <defs>
    <linearGradient id="hrp-wing" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6a5a48"/><stop offset="1" stop-color="#1e1812"/></linearGradient>
    <radialGradient id="hrp-skin" cx="45%" cy="35%" r="70%"><stop offset="0" stop-color="#e8c8a8"/><stop offset="1" stop-color="#8a6a50"/></radialGradient>
    <filter id="hrp-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1"/></filter>
    </defs>
    <!-- musical notes of her song -->
    <g fill="#c8b8ff" opacity="0.6"><circle cx="30" cy="40" r="2.6"/><path d="M 32.4 40 V 30 l 6 2" stroke="#c8b8ff" stroke-width="1" fill="none"/><circle cx="130" cy="34" r="2.6"/><path d="M 132.4 34 V 24 l 6 2" stroke="#c8b8ff" stroke-width="1" fill="none"/></g>
    <!-- great ragged wings -->
    <path d="M 66 64 C 46 44 22 36 4 40 C 14 46 10 54 4 60 C 18 58 20 66 12 74 C 26 70 30 78 24 88 C 38 82 48 86 54 96 Z" fill="url(#hrp-wing)" stroke="#120e0a" stroke-width="1"/>
    <path d="M 94 64 C 114 44 138 36 156 40 C 146 46 150 54 156 60 C 142 58 140 66 148 74 C 134 70 130 78 136 88 C 122 82 112 86 106 96 Z" fill="url(#hrp-wing)" stroke="#120e0a" stroke-width="1"/>
    <g stroke="#3a3024" stroke-width="0.8" fill="none"><path d="M 60 66 L 10 48 M 58 74 L 14 70 M 56 82 L 28 86"/><path d="M 100 66 L 150 48 M 102 74 L 146 70 M 104 82 L 132 86"/></g>
    <!-- feathered bird body and scaled legs ending in talons -->
    <path d="M 62 84 C 58 100 64 116 80 120 C 96 116 102 100 98 84 Z" fill="url(#hrp-wing)" stroke="#120e0a" stroke-width="1.1"/>
    <path d="M 70 118 L 64 138 M 90 118 L 96 138" stroke="#c8a040" stroke-width="3"/>
    <g stroke="#2a1a0a" stroke-width="2" stroke-linecap="round"><path d="M 64 138 l -8 6 M 64 138 l -2 9 M 64 138 l 5 7"/><path d="M 96 138 l 8 6 M 96 138 l 2 9 M 96 138 l -5 7"/></g>
    <!-- a woman's torso and lovely, cruel face -->
    <path d="M 66 62 C 64 74 66 84 72 90 L 88 90 C 94 84 96 74 94 62 C 88 58 72 58 66 62 Z" fill="url(#hrp-skin)" stroke="#5a3a28" stroke-width="1"/>
    <path d="M 68 38 C 66 26 72 20 80 20 C 88 20 94 26 92 38 C 92 48 86 56 80 56 C 74 56 68 48 68 38 Z" fill="url(#hrp-skin)" stroke="#5a3a28" stroke-width="1"/>
    <!-- wild, matted hair -->
    <path d="M 66 34 C 60 24 66 12 80 12 C 94 12 100 24 94 34 C 100 42 100 54 96 64 C 94 52 92 44 90 38 C 86 30 74 30 70 38 C 68 44 66 52 64 64 C 60 54 60 42 66 34 Z" fill="#2a1a10"/>
    <path d="M 72 38 Q 75 36 78 38 M 82 38 Q 85 36 88 38" stroke="#2a1a10" stroke-width="1.2" fill="none"/>
    <ellipse cx="75" cy="40" rx="1.8" ry="1.2" fill="#3a8a3a"/><ellipse cx="85" cy="40" rx="1.8" ry="1.2" fill="#3a8a3a"/>
    <path d="M 76 49 Q 80 52 84 49 Q 80 50 76 49 Z" fill="#8a2a2a"/>
    <!-- her mouth open in song -->
    <ellipse cx="80" cy="49.5" rx="2.4" ry="1.6" fill="#3a0a0a"/>
    </svg>
  `,

  'Hydra': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Hydra">
    <defs>
    <linearGradient id="hyd-neck" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1a4a3a"/><stop offset="0.5" stop-color="#3a8a6a"/><stop offset="1" stop-color="#1a4a3a"/></linearGradient>
    <radialGradient id="hyd-body" cx="45%" cy="35%" r="70%"><stop offset="0" stop-color="#4a9a7a"/><stop offset="1" stop-color="#0a2a1e"/></radialGradient>
    <radialGradient id="hyd-head" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#5aaa8a"/><stop offset="1" stop-color="#1a4a3a"/></radialGradient>
    <g id="hyd-h">
      <path d="M -10 0 C -10 -10 10 -10 12 -2 L 20 2 L 12 6 C 8 10 -10 10 -10 0 Z" fill="url(#hyd-head)" stroke="#06140e" stroke-width="0.9"/>
      <path d="M 12 2 L 20 2" stroke="#06140e" stroke-width="0.8"/>
      <path d="M 13 3 l 1 3 l 1 -3 M 16 3 l 1 3 l 1 -3" fill="#f4f0e0"/>
      <circle cx="2" cy="-2" r="1.8" fill="#ffd040"/><ellipse cx="2" cy="-2" rx="0.5" ry="1.6" fill="#000"/>
      <path d="M -6 -6 L -10 -12 M -2 -7 L -4 -13" stroke="#1a4a3a" stroke-width="1.4" stroke-linecap="round"/>
    </g>
    <filter id="hyd-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1"/></filter>
    </defs>
    <ellipse cx="80" cy="152" rx="66" ry="6" fill="#0a2030" opacity="0.8" filter="url(#hyd-soft)"/>
    <!-- five serpent necks rising from one body -->
    <g fill="none" stroke-linecap="round">
      <path d="M 66 112 C 46 96 30 76 26 50" stroke="#06140e" stroke-width="14"/><path d="M 66 112 C 46 96 30 76 26 50" stroke="url(#hyd-neck)" stroke-width="11"/>
      <path d="M 72 108 C 62 86 54 60 56 30" stroke="#06140e" stroke-width="14"/><path d="M 72 108 C 62 86 54 60 56 30" stroke="url(#hyd-neck)" stroke-width="11"/>
      <path d="M 80 106 C 80 80 80 50 82 18" stroke="#06140e" stroke-width="14"/><path d="M 80 106 C 80 80 80 50 82 18" stroke="url(#hyd-neck)" stroke-width="11"/>
      <path d="M 88 108 C 98 86 106 60 104 30" stroke="#06140e" stroke-width="14"/><path d="M 88 108 C 98 86 106 60 104 30" stroke="url(#hyd-neck)" stroke-width="11"/>
      <path d="M 94 112 C 114 96 130 76 134 50" stroke="#06140e" stroke-width="14"/><path d="M 94 112 C 114 96 130 76 134 50" stroke="url(#hyd-neck)" stroke-width="11"/>
    </g>
    <use href="#hyd-h" transform="translate(26 48) rotate(-150) scale(1.1, -1.1)"/>
    <use href="#hyd-h" transform="translate(56 28) rotate(-120) scale(1.1, -1.1)"/>
    <use href="#hyd-h" transform="translate(82 16) rotate(-90) scale(1.2)"/>
    <use href="#hyd-h" transform="translate(104 28) rotate(-60) scale(1.1)"/>
    <use href="#hyd-h" transform="translate(134 48) rotate(-30) scale(1.1)"/>
    <!-- the squat, scaled body, half in dark water -->
    <ellipse cx="80" cy="124" rx="44" ry="24" fill="url(#hyd-body)" stroke="#06140e" stroke-width="1.3"/>
    <g stroke="#0a2a1e" stroke-width="1" fill="none" opacity="0.7"><path d="M 50 118 Q 80 110 110 118"/><path d="M 46 128 Q 80 120 114 128"/></g>
    <path d="M 16 138 Q 40 132 64 138 T 112 138 T 150 136 L 150 160 L 10 160 Z" fill="#0a2030" opacity="0.85"/>
    <path d="M 22 138 q 10 -3 20 0 M 90 140 q 10 -3 20 0" stroke="#4a8ab8" stroke-width="0.8" fill="none" opacity="0.6"/>
    </svg>
  `,

  'Medusa': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Medusa">
    <defs>
    <radialGradient id="med-skin" cx="45%" cy="35%" r="70%"><stop offset="0" stop-color="#b8d8a8"/><stop offset="0.6" stop-color="#6a9a5a"/><stop offset="1" stop-color="#2a4a22"/></radialGradient>
    <linearGradient id="med-tail" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a7a3a"/><stop offset="1" stop-color="#1a2e14"/></linearGradient>
    <linearGradient id="med-snake" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2a5a22"/><stop offset="0.5" stop-color="#6aaa4a"/><stop offset="1" stop-color="#2a5a22"/></linearGradient>
    <filter id="med-glow" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="2"/></filter>
    <filter id="med-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1"/></filter>
    </defs>
    <ellipse cx="80" cy="153" rx="56" ry="5" fill="#000" opacity="0.6" filter="url(#med-soft)"/>
    <!-- a victim behind her, turned to stone shielding its eyes, a moment too late -->
    <g opacity="0.6">
      <path d="M 138 104 L 150 104 L 152 134 L 136 134 Z" fill="#7a7a76" stroke="#3a3a38" stroke-width="0.8"/>
      <circle cx="144" cy="96" r="5.5" fill="#7a7a76" stroke="#3a3a38" stroke-width="0.8"/>
      <path d="M 138 106 L 140 96 M 150 106 L 148 96" stroke="#7a7a76" stroke-width="3.2" stroke-linecap="round"/>
      <path d="M 139 95 L 149 95" stroke="#5a5a56" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M 141 112 l 3 6 l -2 6 M 147 118 l 2 7" stroke="#3a3a38" stroke-width="0.6" fill="none"/>
    </g>
    <!-- serpent's tail coiling below -->
    <path d="M 70 104 C 58 120 60 140 80 146 C 104 152 128 146 132 132 C 120 140 100 140 92 132 C 84 124 92 114 90 104 Z" fill="url(#med-tail)" stroke="#0e1a0a" stroke-width="1.2"/>
    <g stroke="#0e1a0a" stroke-width="0.8" fill="none" opacity="0.6"><path d="M 66 124 q 10 4 20 0"/><path d="M 70 136 q 14 4 28 0"/><path d="M 100 142 q 10 2 20 -2"/></g>
    <!-- torso, bronze breastplate -->
    <path d="M 64 66 C 62 82 64 96 70 106 L 90 106 C 96 96 98 82 96 66 C 90 60 70 60 64 66 Z" fill="url(#med-skin)" stroke="#1e3418" stroke-width="1.1"/>
    <path d="M 66 70 Q 80 78 94 70 L 94 82 Q 80 90 66 82 Z" fill="#a87a2a" stroke="#4a3006" stroke-width="0.8"/>
    <!-- arms: drawing her bow. One holds it out; the other pulls the string back to her chest -->
    <path d="M 66 70 C 52 74 42 80 34 86" fill="none" stroke="url(#med-skin)" stroke-width="7" stroke-linecap="round"/>
    <path d="M 94 70 C 102 74 100 82 92 84" fill="none" stroke="url(#med-skin)" stroke-width="7" stroke-linecap="round"/>
    <path d="M 30 60 C 20 76 20 96 30 112" stroke="#5a3a1a" stroke-width="2.6" fill="none"/>
    <path d="M 30 60 L 90 84 L 30 112" stroke="#d8d0c0" stroke-width="0.6" fill="none"/>
    <path d="M 12 85 L 90 84" stroke="#c8b898" stroke-width="1.3"/>
    <path d="M 12 85 l 6 -3 l 0 6 Z" fill="#9a9a90"/>
    <path d="M 84 84 l 5 -3 M 84 84 l 5 3" stroke="#a83a2a" stroke-width="1.2"/>
    <!-- her face, and the eyes you must not meet -->
    <path d="M 68 40 C 66 28 72 22 80 22 C 88 22 94 28 92 40 C 92 50 86 58 80 58 C 74 58 68 50 68 40 Z" fill="url(#med-skin)" stroke="#1e3418" stroke-width="1.1"/>
    <ellipse cx="75" cy="40" rx="3.2" ry="2" fill="#d8ff6a" filter="url(#med-glow)"/><ellipse cx="85" cy="40" rx="3.2" ry="2" fill="#d8ff6a" filter="url(#med-glow)"/>
    <ellipse cx="75" cy="40" rx="2" ry="1.3" fill="#f4ffc8"/><ellipse cx="85" cy="40" rx="2" ry="1.3" fill="#f4ffc8"/>
    <ellipse cx="75" cy="40" rx="0.5" ry="1.2" fill="#000"/><ellipse cx="85" cy="40" rx="0.5" ry="1.2" fill="#000"/>
    <path d="M 76 50 Q 80 53 84 50" stroke="#3a1a1a" stroke-width="1.2" fill="none"/>
    <!-- a crown of living snakes -->
    <g fill="none" stroke="url(#med-snake)" stroke-width="3.4" stroke-linecap="round">
      <path d="M 70 28 C 60 20 56 10 62 4"/><path d="M 76 24 C 72 14 74 6 80 2"/><path d="M 84 24 C 88 14 86 6 80 2" opacity="0"/><path d="M 86 24 C 90 14 96 8 100 6"/>
      <path d="M 92 30 C 102 26 108 18 108 10"/><path d="M 68 34 C 56 34 50 28 48 20"/><path d="M 92 38 C 104 40 110 36 114 28"/><path d="M 68 42 C 58 46 54 54 54 60"/>
    </g>
    <g fill="#6aaa4a" stroke="#1e3418" stroke-width="0.6"><circle cx="62" cy="4" r="2.6"/><circle cx="80" cy="2" r="2.6"/><circle cx="100" cy="6" r="2.6"/><circle cx="108" cy="10" r="2.6"/><circle cx="48" cy="20" r="2.6"/><circle cx="114" cy="28" r="2.6"/><circle cx="54" cy="60" r="2.6"/></g>
    <g fill="#ff2a2a"><circle cx="61" cy="3.4" r="0.6"/><circle cx="79" cy="1.4" r="0.6"/><circle cx="101" cy="5.4" r="0.6"/><circle cx="109" cy="9.4" r="0.6"/><circle cx="47" cy="19.4" r="0.6"/><circle cx="115" cy="27.4" r="0.6"/></g>
    </svg>
  `,

  'Doppelganger': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Doppelganger">
    <defs>
    <linearGradient id="dpl-split" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#c8c4d8"/><stop offset="0.48" stop-color="#9a96b0"/><stop offset="0.52" stop-color="#4a6a3a"/><stop offset="1" stop-color="#2a4a1e"/></linearGradient>
    <radialGradient id="dpl-face" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#e8e4f4"/><stop offset="1" stop-color="#8a86a0"/></radialGradient>
    <radialGradient id="dpl-skin" cx="45%" cy="35%" r="70%"><stop offset="0" stop-color="#e8b88a"/><stop offset="1" stop-color="#8a5a3a"/></radialGradient>
    <linearGradient id="dpl-iron" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d8dce4"/><stop offset="1" stop-color="#3a3c42"/></linearGradient>
    <filter id="dpl-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1"/></filter>
    <clipPath id="dpl-left"><rect x="0" y="0" width="80" height="160"/></clipPath>
    <clipPath id="dpl-right"><rect x="80" y="0" width="80" height="160"/></clipPath>
    </defs>
    <ellipse cx="80" cy="153" rx="46" ry="5" fill="#000" opacity="0.6" filter="url(#dpl-soft)"/>
    <!-- a sword, raised in "your" hand -->
    <path d="M 112 78 L 134 22" stroke="url(#dpl-iron)" stroke-width="4" stroke-linecap="round"/>
    <path d="M 106 80 L 120 74" stroke="#a87a2a" stroke-width="3"/>
    <!-- the body: an adventurer's cloak and boots on one side, grey featureless flesh on the other -->
    <path d="M 56 70 C 50 92 54 112 60 124 L 64 150 L 76 150 L 80 126 L 84 150 L 96 150 L 100 124 C 106 112 110 92 104 70 C 96 62 64 62 56 70 Z" fill="url(#dpl-split)" stroke="#1a1a24" stroke-width="1.2"/>
    <path d="M 80 70 L 80 124" stroke="#1a1a24" stroke-width="0.8" stroke-dasharray="3 2"/>
    <path d="M 84 92 L 104 92 M 84 104 L 102 104" stroke="#1a2a10" stroke-width="1.4"/>
    <!-- arms -->
    <path d="M 58 74 C 48 86 44 100 44 112" fill="none" stroke="#9a96b0" stroke-width="8" stroke-linecap="round"/>
    <path d="M 102 74 C 108 76 110 78 112 78" fill="none" stroke="#3a5a2a" stroke-width="8" stroke-linecap="round"/>
    <!-- the face: half yours, half a blank, smooth nothing that is still forming -->
    <g clip-path="url(#dpl-left)">
      <path d="M 64 44 C 62 30 70 22 80 22 C 90 22 98 30 96 44 C 96 56 90 66 80 66 C 70 66 64 56 64 44 Z" fill="url(#dpl-face)" stroke="#4a4660" stroke-width="1.1"/>
      <ellipse cx="73" cy="44" rx="3.6" ry="2.2" fill="#ffffff"/><circle cx="73" cy="44" r="1.4" fill="#2a2440"/>
      <path d="M 70 56 Q 76 60 80 58" stroke="#4a4660" stroke-width="1.2" fill="none"/>
    </g>
    <g clip-path="url(#dpl-right)">
      <path d="M 64 44 C 62 30 70 22 80 22 C 90 22 98 30 96 44 C 96 56 90 66 80 66 C 70 66 64 56 64 44 Z" fill="url(#dpl-skin)" stroke="#3a2010" stroke-width="1.1"/>
      <path d="M 80 22 C 92 18 100 26 98 38 C 94 30 88 28 80 28 Z" fill="#5a3418"/>
      <ellipse cx="87" cy="44" rx="2.4" ry="1.6" fill="#ffffff"/><circle cx="87" cy="44" r="1.1" fill="#3a5a8a"/>
      <path d="M 84 40 L 90 39" stroke="#3a2010" stroke-width="1.2"/>
      <path d="M 80 58 Q 86 60 90 55" stroke="#3a2010" stroke-width="1.2" fill="none"/>
    </g>
    <path d="M 80 22 L 80 66" stroke="#1a1a24" stroke-width="0.6"/>
    <!-- ripples where the flesh is still shifting -->
    <g stroke="#e8e4f4" stroke-width="0.8" fill="none" opacity="0.6"><path d="M 60 40 q -4 4 0 8"/><path d="M 58 90 q -4 4 0 8"/><path d="M 62 112 q -4 4 0 8"/></g>
    </svg>
  `,

  'Purple Worm': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Purple Worm">
    <defs>
    <linearGradient id="pwm-flesh" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2a0a3a"/><stop offset="0.5" stop-color="#7a3a9a"/><stop offset="1" stop-color="#2a0a3a"/></linearGradient>
    <radialGradient id="pwm-maw" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#000"/><stop offset="0.55" stop-color="#3a0a1a"/><stop offset="0.85" stop-color="#8a2a4a"/><stop offset="1" stop-color="#5a1a6a"/></radialGradient>
    <filter id="pwm-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1"/></filter>
    </defs>
    <!-- the floor bursting apart -->
    <g fill="#3a3430" stroke="#121010" stroke-width="0.8"><path d="M 4 150 L 30 132 L 42 150 Z"/><path d="M 118 150 L 134 128 L 156 150 Z"/><path d="M 24 120 l 8 -6 l 4 8 z"/><path d="M 128 112 l 8 -4 l 2 8 z"/></g>
    <!-- the vast segmented body rising out of the rock -->
    <path d="M 40 160 C 36 120 40 80 50 50 L 110 50 C 120 80 124 120 120 160 Z" fill="url(#pwm-flesh)" stroke="#120418" stroke-width="1.4"/>
    <g stroke="#1a0624" stroke-width="2" fill="none" opacity="0.8"><path d="M 46 70 Q 80 78 114 70"/><path d="M 42 92 Q 80 100 118 92"/><path d="M 40 114 Q 80 122 120 114"/><path d="M 40 136 Q 80 144 120 136"/></g>
    <!-- the head: nothing but a mouth, ringed with teeth, gaping at you -->
    <ellipse cx="80" cy="46" rx="44" ry="36" fill="url(#pwm-flesh)" stroke="#120418" stroke-width="1.4"/>
    <ellipse cx="80" cy="46" rx="34" ry="27" fill="url(#pwm-maw)"/>
    <g fill="#f0e8d8" stroke="#5a4a3a" stroke-width="0.4">
      <path d="M 80 19 l -3 8 h 6 z"/><path d="M 96 22 l -5 7 l 6 2 z"/><path d="M 108 32 l -7 4 l 5 4 z"/><path d="M 113 46 l -8 0 l 3 5 z"/><path d="M 108 60 l -7 -4 l 2 6 z"/><path d="M 96 70 l -5 -7 l -1 7 z"/>
      <path d="M 80 73 l -3 -8 h 6 z"/><path d="M 64 70 l 5 -7 l 1 7 z"/><path d="M 52 60 l 7 -4 l -2 6 z"/><path d="M 47 46 l 8 0 l -3 5 z"/><path d="M 52 32 l 7 4 l -5 4 z"/><path d="M 64 22 l 5 7 l -6 2 z"/>
    </g>
    <!-- an inner ring of teeth, further down the throat -->
    <g fill="#c8c0b0" opacity="0.8"><path d="M 80 30 l -2 5 h 4 z"/><path d="M 94 40 l -5 2 l 4 3 z"/><path d="M 94 54 l -5 -2 l 1 4 z"/><path d="M 80 62 l -2 -5 h 4 z"/><path d="M 66 54 l 5 -2 l -1 4 z"/><path d="M 66 40 l 5 2 l -4 3 z"/></g>
    <!-- slime dripping from the lip -->
    <g fill="#9a6aba" opacity="0.7"><path d="M 56 74 q 1 8 -1 12 q -2 -4 -1 -12 z"/><path d="M 104 72 q 1 10 -1 14 q -2 -5 -1 -14 z"/></g>
    <!-- the tail stinger curling up behind -->
    <path d="M 128 160 C 150 140 156 110 144 96" fill="none" stroke="url(#pwm-flesh)" stroke-width="10" stroke-linecap="round"/>
    <path d="M 144 96 L 140 80 L 150 92 Z" fill="#d8d0c0" stroke="#3a2a1a" stroke-width="0.6"/>
    <circle cx="140" cy="80" r="1.6" fill="#9adf3a"/>
    </svg>
  `,

  'Iron Golem': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Iron Golem">
    <defs>
    <linearGradient id="igl-iron" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6a6e78"/><stop offset="0.5" stop-color="#2a2c32"/><stop offset="1" stop-color="#0a0b0e"/></linearGradient>
    <linearGradient id="igl-edge" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9a9ea8"/><stop offset="1" stop-color="#4a4e58"/></linearGradient>
    <radialGradient id="igl-fire" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#d8ffb0"/><stop offset="0.5" stop-color="#4adf3a"/><stop offset="1" stop-color="#0a5a0a" stop-opacity="0"/></radialGradient>
    <filter id="igl-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="2"/></filter>
    <filter id="igl-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1"/></filter>
    <filter id="igl-steam" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.5"/></filter>
    </defs>
    <ellipse cx="80" cy="154" rx="60" ry="5" fill="#000" opacity="0.7" filter="url(#igl-soft)"/>
    <!-- pillar legs -->
    <path d="M 54 116 L 50 150 L 72 150 L 72 116 Z M 106 116 L 110 150 L 88 150 L 88 116 Z" fill="url(#igl-iron)" stroke="#000" stroke-width="1.2"/>
    <path d="M 50 138 h 22 M 88 138 h 22" stroke="url(#igl-edge)" stroke-width="2"/>
    <!-- massive riveted torso -->
    <path d="M 38 62 L 122 62 L 116 120 L 44 120 Z" fill="url(#igl-iron)" stroke="#000" stroke-width="1.4"/>
    <path d="M 46 70 L 114 70 L 110 112 L 50 112 Z" fill="none" stroke="url(#igl-edge)" stroke-width="1.4"/>
    <g fill="#8a8e98"><circle cx="50" cy="74" r="1.6"/><circle cx="110" cy="74" r="1.6"/><circle cx="52" cy="108" r="1.6"/><circle cx="108" cy="108" r="1.6"/><circle cx="80" cy="74" r="1.6"/><circle cx="80" cy="108" r="1.6"/></g>
    <!-- green fire glowing through a grille in the chest -->
    <circle cx="80" cy="90" r="14" fill="url(#igl-fire)" filter="url(#igl-glow)"/>
    <g stroke="#0a0b0e" stroke-width="2.4"><path d="M 70 82 v 16 M 76 80 v 20 M 82 80 v 20 M 88 82 v 16"/></g>
    <!-- great arms ending in hammer-like fists -->
    <path d="M 38 66 C 26 76 22 92 22 108" fill="none" stroke="#000" stroke-width="17" stroke-linecap="round"/>
    <path d="M 38 66 C 26 76 22 92 22 108" fill="none" stroke="url(#igl-iron)" stroke-width="14" stroke-linecap="round"/>
    <path d="M 122 66 C 134 76 138 92 138 108" fill="none" stroke="#000" stroke-width="17" stroke-linecap="round"/>
    <path d="M 122 66 C 134 76 138 92 138 108" fill="none" stroke="url(#igl-iron)" stroke-width="14" stroke-linecap="round"/>
    <rect x="10" y="104" width="24" height="22" rx="4" fill="url(#igl-iron)" stroke="#000" stroke-width="1.2"/>
    <rect x="126" y="104" width="24" height="22" rx="4" fill="url(#igl-iron)" stroke="#000" stroke-width="1.2"/>
    <!-- shoulder plates -->
    <path d="M 28 58 L 56 54 L 54 72 L 26 74 Z M 132 58 L 104 54 L 106 72 L 134 74 Z" fill="url(#igl-iron)" stroke="#000" stroke-width="1.1"/>
    <!-- the helm: a bucket of iron with a visor slit full of green fire -->
    <path d="M 62 22 L 98 22 L 102 56 L 58 56 Z" fill="url(#igl-iron)" stroke="#000" stroke-width="1.3"/>
    <path d="M 62 22 L 98 22" stroke="url(#igl-edge)" stroke-width="2"/>
    <rect x="64" y="34" width="32" height="6" fill="#0a0b0e"/>
    <rect x="64" y="34" width="32" height="6" fill="url(#igl-fire)" filter="url(#igl-glow)"/>
    <path d="M 80 40 v 14" stroke="#0a0b0e" stroke-width="2"/>
    <!-- poison steam hissing from the joints -->
    <g fill="#8adf6a" opacity="0.35" filter="url(#igl-steam)"><circle cx="54" cy="56" r="6"/><circle cx="106" cy="56" r="6"/><circle cx="80" cy="14" r="7"/></g>
    </svg>
  `,

  'Behir': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Behir">
    <defs>
    <linearGradient id="bhr-scale" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a8ae8"/><stop offset="0.6" stop-color="#2a4aa8"/><stop offset="1" stop-color="#0a1a4a"/></linearGradient>
    <radialGradient id="bhr-head" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#7aa8ff"/><stop offset="1" stop-color="#1a2a6a"/></radialGradient>
    <filter id="bhr-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="bhr-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1"/></filter>
    </defs>
    <ellipse cx="80" cy="152" rx="70" ry="5" fill="#000" opacity="0.6" filter="url(#bhr-soft)"/>
    <!-- the long serpentine body, winding back and forth -->
    <path d="M 4 130 C 30 110 50 140 76 128 C 100 116 112 140 140 126 C 150 120 156 110 156 100" fill="none" stroke="#06103a" stroke-width="24" stroke-linecap="round"/>
    <path d="M 4 130 C 30 110 50 140 76 128 C 100 116 112 140 140 126 C 150 120 156 110 156 100" fill="none" stroke="url(#bhr-scale)" stroke-width="20" stroke-linecap="round"/>
    <path d="M 4 136 C 30 116 50 146 76 134 C 100 122 112 146 140 132" fill="none" stroke="#c8d8f8" stroke-width="3" stroke-dasharray="3 3" opacity="0.6"/>
    <!-- a dozen short legs -->
    <g stroke="#0a1a4a" stroke-width="4" stroke-linecap="round"><path d="M 20 126 l -2 18 M 36 124 l 0 20 M 56 132 l 0 18 M 92 124 l 2 20 M 110 132 l 0 18 M 128 128 l 2 18"/></g>
    <!-- neck rising, head reared back to breathe lightning -->
    <path d="M 76 128 C 70 100 64 74 72 52" fill="none" stroke="#06103a" stroke-width="20" stroke-linecap="round"/>
    <path d="M 76 128 C 70 100 64 74 72 52" fill="none" stroke="url(#bhr-scale)" stroke-width="16" stroke-linecap="round"/>
    <path d="M 56 46 C 54 30 66 22 80 24 C 96 26 104 36 102 48 L 112 56 L 96 60 C 88 66 64 64 56 46 Z" fill="url(#bhr-head)" stroke="#06103a" stroke-width="1.3"/>
    <!-- two great swept-back horns -->
    <path d="M 64 30 C 56 18 46 12 36 12 C 46 18 52 26 58 34 Z" fill="#e8e0c8" stroke="#3a3a2a" stroke-width="0.6"/>
    <path d="M 72 26 C 68 14 60 6 52 4 C 60 12 64 20 66 28 Z" fill="#e8e0c8" stroke="#3a3a2a" stroke-width="0.6"/>
    <ellipse cx="82" cy="38" rx="3" ry="2" fill="#ffffff" filter="url(#bhr-glow)"/><ellipse cx="82" cy="38" rx="1" ry="1.8" fill="#000"/>
    <path d="M 96 56 L 112 56 M 98 56 l 1 3 l 1 -3 M 104 56 l 1 3 l 1 -3" stroke="#f4f0e0" stroke-width="1"/>
    <!-- lightning crackling from its jaws and along its body -->
    <g fill="none" stroke="#e8f4ff" stroke-width="1.6" filter="url(#bhr-glow)">
      <path d="M 110 56 L 124 50 L 120 58 L 138 54 L 130 62 L 150 60"/>
      <path d="M 30 112 l 4 -6 l 2 6 l 4 -5" stroke-width="1"/><path d="M 118 116 l 4 -6 l 2 6 l 4 -5" stroke-width="1"/>
    </g>
    </svg>
  `,

  'Rakshasa': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Rakshasa">
    <defs>
    <radialGradient id="rak-fur" cx="45%" cy="35%" r="70%"><stop offset="0" stop-color="#f0a040"/><stop offset="0.6" stop-color="#b8661a"/><stop offset="1" stop-color="#4a2406"/></radialGradient>
    <linearGradient id="rak-silk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8a1a5a"/><stop offset="0.5" stop-color="#5a0a3a"/><stop offset="1" stop-color="#2a0418"/></linearGradient>
    <linearGradient id="rak-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff0a0"/><stop offset="1" stop-color="#8a5a0a"/></linearGradient>
    <filter id="rak-glow" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="1.6"/></filter>
    <filter id="rak-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1"/></filter>
    </defs>
    <ellipse cx="80" cy="153" rx="46" ry="5" fill="#000" opacity="0.6" filter="url(#rak-soft)"/>
    <!-- a shimmer of ghostly copies behind it: its illusions -->
    <g opacity="0.15"><path d="M 30 70 C 26 100 30 130 34 150 L 56 150 L 58 70 Z" fill="url(#rak-silk)"/><path d="M 130 70 C 134 100 130 130 126 150 L 104 150 L 102 70 Z" fill="url(#rak-silk)"/></g>
    <!-- long embroidered silk robes -->
    <path d="M 56 66 C 48 96 46 128 44 150 L 116 150 C 114 128 112 96 104 66 C 96 60 64 60 56 66 Z" fill="url(#rak-silk)" stroke="#1a0210" stroke-width="1.2"/>
    <path d="M 80 66 L 80 150" stroke="url(#rak-gold)" stroke-width="2"/>
    <g fill="none" stroke="url(#rak-gold)" stroke-width="1" opacity="0.8"><path d="M 50 130 q 30 8 60 0"/><path d="M 52 110 q 28 6 56 0"/><circle cx="80" cy="90" r="5"/></g>
    <!-- arms in wide sleeves, the hands turned the wrong way, claws out -->
    <path d="M 58 70 C 46 80 40 92 36 102 L 48 106 C 52 96 58 88 64 82 Z" fill="url(#rak-silk)" stroke="#1a0210" stroke-width="1"/>
    <path d="M 102 70 C 114 80 120 92 124 102 L 112 106 C 108 96 102 88 96 82 Z" fill="url(#rak-silk)" stroke="#1a0210" stroke-width="1"/>
    <path d="M 36 104 C 32 112 36 118 42 116 C 46 114 48 108 46 104 Z" fill="url(#rak-fur)"/>
    <path d="M 124 104 C 128 112 124 118 118 116 C 114 114 112 108 114 104 Z" fill="url(#rak-fur)"/>
    <g stroke="#f4ecd8" stroke-width="1.4" stroke-linecap="round"><path d="M 36 108 l -5 -4 M 37 112 l -6 0 M 40 116 l -4 4"/><path d="M 124 108 l 5 -4 M 123 112 l 6 0 M 120 116 l 4 4"/></g>
    <!-- a tiger's head, smiling -->
    <path d="M 60 40 C 58 24 68 16 80 16 C 92 16 102 24 100 40 C 100 52 92 62 80 62 C 68 62 60 52 60 40 Z" fill="url(#rak-fur)" stroke="#3a1a04" stroke-width="1.2"/>
    <path d="M 62 26 L 58 12 L 70 20 Z M 98 26 L 102 12 L 90 20 Z" fill="url(#rak-fur)" stroke="#3a1a04" stroke-width="0.9"/>
    <g stroke="#1a0a02" stroke-width="2" stroke-linecap="round" fill="none"><path d="M 80 18 v 8 M 72 20 l 2 6 M 88 20 l -2 6"/><path d="M 60 40 l 8 2 M 60 46 l 8 0 M 100 40 l -8 2 M 100 46 l -8 0"/></g>
    <path d="M 70 46 C 70 56 76 60 80 60 C 84 60 90 56 90 46 Z" fill="#f8f0e0"/>
    <ellipse cx="72" cy="36" rx="3" ry="2" fill="#a0ff4a" filter="url(#rak-glow)"/><ellipse cx="88" cy="36" rx="3" ry="2" fill="#a0ff4a" filter="url(#rak-glow)"/>
    <ellipse cx="72" cy="36" rx="0.6" ry="1.8" fill="#000"/><ellipse cx="88" cy="36" rx="0.6" ry="1.8" fill="#000"/>
    <path d="M 77 46 L 83 46 L 80 50 Z" fill="#3a1a1a"/>
    <path d="M 74 54 Q 80 58 86 54" stroke="#3a1a1a" stroke-width="1.2" fill="none"/>
    <path d="M 75 54 l 1 3 l 1 -3 M 83 54 l 1 3 l 1 -3" fill="#ffffff"/>
    <!-- a jeweled turban pin -->
    <circle cx="80" cy="14" r="3" fill="#3a8aff" stroke="url(#rak-gold)" stroke-width="1"/>
    </svg>
  `,

  'Death Tyrant': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Death Tyrant">
    <defs>
    <radialGradient id="dty-body" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#a8a49a"/><stop offset="0.55" stop-color="#5a5650"/><stop offset="1" stop-color="#1a1816"/></radialGradient>
    <radialGradient id="dty-eye" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#e8ffe0"/><stop offset="0.4" stop-color="#6aff8a"/><stop offset="1" stop-color="#0a3a1a"/></radialGradient>
    <filter id="dty-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="2.4"/></filter>
    <filter id="dty-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1"/></filter>
    <g id="dty-stalk-eye"><circle r="5" fill="#d8d4c8" stroke="#2a2826" stroke-width="0.8"/><circle r="2.4" fill="#5aff7a" filter="url(#dty-glow)"/><circle r="1.2" fill="#0a1a0a"/></g>
    </defs>
    <ellipse cx="80" cy="150" rx="40" ry="5" fill="#000" opacity="0.6" filter="url(#dty-soft)"/>
    <!-- withered eyestalks, some broken -->
    <g fill="none" stroke="#4a4640" stroke-width="3" stroke-linecap="round">
      <path d="M 54 50 C 44 34 30 30 22 34"/><path d="M 62 38 C 56 20 46 10 36 10"/><path d="M 74 32 C 72 16 70 6 64 2"/>
      <path d="M 86 32 C 88 16 92 6 98 4"/><path d="M 98 38 C 106 22 118 14 126 14"/><path d="M 106 50 C 118 38 132 36 140 42"/>
      <path d="M 50 64 C 36 60 26 64 18 72"/><path d="M 110 64 C 122 64 128 72 132 80"/>
    </g>
    <use href="#dty-stalk-eye" x="22" y="34"/><use href="#dty-stalk-eye" x="36" y="10"/><use href="#dty-stalk-eye" x="64" y="2"/><use href="#dty-stalk-eye" x="98" y="4"/>
    <use href="#dty-stalk-eye" x="126" y="14"/><use href="#dty-stalk-eye" x="140" y="42"/><use href="#dty-stalk-eye" x="18" y="72"/>
    <circle cx="132" cy="80" r="3" fill="#2a2826"/>
    <!-- the great rotting sphere of its body -->
    <circle cx="80" cy="84" r="48" fill="url(#dty-body)" stroke="#121110" stroke-width="1.4"/>
    <g fill="#3a3632" opacity="0.7"><path d="M 46 70 q 6 -4 10 2 q -4 4 -10 -2 z"/><path d="M 108 100 q 6 -2 8 4 q -6 2 -8 -4 z"/><path d="M 56 112 q 4 -4 8 0 q -4 4 -8 0 z"/></g>
    <g stroke="#2a2826" stroke-width="1" fill="none"><path d="M 44 92 l 6 2 M 112 76 l 6 -2 M 70 124 l 4 4"/></g>
    <!-- the great central eye, dead and terrible -->
    <ellipse cx="80" cy="74" rx="22" ry="16" fill="#e8e4d8" stroke="#2a2826" stroke-width="1.4"/>
    <circle cx="80" cy="74" r="12" fill="url(#dty-eye)" filter="url(#dty-glow)"/>
    <circle cx="80" cy="74" r="10" fill="url(#dty-eye)"/>
    <ellipse cx="80" cy="74" rx="2.6" ry="8" fill="#0a1a0a"/>
    <path d="M 58 66 Q 80 52 102 66" stroke="#2a2826" stroke-width="2" fill="none"/>
    <!-- a broad maw of jagged teeth -->
    <path d="M 52 104 Q 80 124 108 104 Q 80 114 52 104 Z" fill="#1a0806" stroke="#000" stroke-width="1"/>
    <path d="M 54 104.6 L 58 110 L 62 106.6 L 66 113 L 70 108 L 74 115 L 78 109 L 82 115 L 86 109 L 90 114 L 94 108 L 98 112 L 102 106.6 L 106 104.6" fill="none" stroke="#d8d0b8" stroke-width="1.3"/>
    </svg>
  `,

  'Demilich': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Demilich">
    <defs>
    <radialGradient id="dml-bone" cx="40%" cy="30%" r="80%"><stop offset="0" stop-color="#f4ecd8"/><stop offset="0.6" stop-color="#b8a888"/><stop offset="1" stop-color="#5a4a30"/></radialGradient>
    <radialGradient id="dml-gem" cx="40%" cy="35%" r="60%"><stop offset="0" stop-color="#ffffff"/><stop offset="0.35" stop-color="#b85aff"/><stop offset="1" stop-color="#3a0a6a"/></radialGradient>
    <radialGradient id="dml-aura" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#9a4aff" stop-opacity="0.35"/><stop offset="1" stop-color="#2a0a4a" stop-opacity="0"/></radialGradient>
    <filter id="dml-glow" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="2.6"/></filter>
    <filter id="dml-blur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6"/></filter>
    </defs>
    <circle cx="80" cy="70" r="64" fill="url(#dml-aura)" filter="url(#dml-blur)"/>
    <!-- the heap of dust it rose from -->
    <path d="M 30 156 C 50 138 110 138 130 156 Z" fill="#6a6050" opacity="0.8"/>
    <g fill="#d8ccb0" opacity="0.7"><path d="M 50 150 l 14 -3 l 1 2 l -14 3 z"/><path d="M 98 150 l 12 2 l -1 2 l -12 -2 z"/></g>
    <!-- wisps of soul-stuff drawn toward it -->
    <g fill="none" stroke="#c8a8ff" stroke-width="1" opacity="0.5"><path d="M 10 40 C 30 50 40 60 58 64"/><path d="M 150 30 C 130 44 118 56 102 62"/><path d="M 20 110 C 40 100 52 92 62 86"/></g>
    <!-- the floating skull -->
    <path d="M 46 66 C 42 36 60 18 80 18 C 100 18 118 36 114 66 C 112 82 104 90 100 96 L 60 96 C 56 90 48 82 46 66 Z" fill="url(#dml-bone)" stroke="#3a2e1a" stroke-width="1.4"/>
    <path d="M 60 96 L 62 112 C 70 118 90 118 98 112 L 100 96 Z" fill="url(#dml-bone)" stroke="#3a2e1a" stroke-width="1.2"/>
    <!-- great gem eyes, burning -->
    <path d="M 56 60 Q 66 50 76 60 Q 66 72 56 60 Z" fill="#120a18"/>
    <path d="M 84 60 Q 94 50 104 60 Q 94 72 84 60 Z" fill="#120a18"/>
    <circle cx="66" cy="61" r="6" fill="#b85aff" filter="url(#dml-glow)"/><circle cx="94" cy="61" r="6" fill="#b85aff" filter="url(#dml-glow)"/>
    <path d="M 66 55 L 71 61 L 66 67 L 61 61 Z" fill="url(#dml-gem)"/><path d="M 94 55 L 99 61 L 94 67 L 89 61 Z" fill="url(#dml-gem)"/>
    <!-- nasal cavity and gem-studded teeth -->
    <path d="M 77 72 L 80 82 L 83 72 Z" fill="#120a18"/>
    <rect x="62" y="98" width="36" height="9" fill="#120a18"/>
    <g fill="#f4ecd8" stroke="#3a2e1a" stroke-width="0.4"><rect x="63" y="98" width="4" height="5"/><rect x="68" y="98" width="4" height="5"/><rect x="73" y="98" width="4" height="5"/><rect x="83" y="98" width="4" height="5"/><rect x="88" y="98" width="4" height="5"/><rect x="93" y="98" width="4" height="5"/></g>
    <rect x="78" y="98" width="4" height="5" fill="#ff3a5a"/>
    <g fill="#3aff8a"><rect x="68" y="98" width="4" height="5" opacity="0.8"/><rect x="88" y="98" width="4" height="5" opacity="0.8"/></g>
    <!-- cracks -->
    <path d="M 82 20 l -3 12 l 5 8 M 50 50 l 8 6" stroke="#3a2e1a" stroke-width="1" fill="none"/>
    </svg>
  `,

  'Chimera': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Chimera">
    <defs>
    <radialGradient id="chm-lion" cx="40%" cy="30%" r="80%"><stop offset="0" stop-color="#e0b060"/><stop offset="0.55" stop-color="#a06a24"/><stop offset="1" stop-color="#3a2408"/></radialGradient>
    <radialGradient id="chm-mane" cx="50%" cy="50%" r="60%"><stop offset="0" stop-color="#8a4a14"/><stop offset="1" stop-color="#2a1404"/></radialGradient>
    <radialGradient id="chm-goat" cx="40%" cy="30%" r="80%"><stop offset="0" stop-color="#e8e0d0"/><stop offset="1" stop-color="#7a7060"/></radialGradient>
    <linearGradient id="chm-dragon" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d84a2a"/><stop offset="1" stop-color="#4a0a04"/></linearGradient>
    <linearGradient id="chm-wing" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a3a2a"/><stop offset="1" stop-color="#2a0a06"/></linearGradient>
    <radialGradient id="chm-fire" cx="20%" cy="50%" r="80%"><stop offset="0" stop-color="#fff0a0"/><stop offset="0.4" stop-color="#ff8a1a"/><stop offset="1" stop-color="#c81a04" stop-opacity="0"/></radialGradient>
    <filter id="chm-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1"/></filter>
    </defs>
    <ellipse cx="80" cy="153" rx="64" ry="5" fill="#000" opacity="0.6" filter="url(#chm-soft)"/>
    <!-- bat wings -->
    <path d="M 70 78 C 56 54 36 40 14 40 C 22 48 20 56 14 62 C 26 60 30 68 24 76 C 36 72 46 78 50 88 Z" fill="url(#chm-wing)" stroke="#1a0604" stroke-width="1"/>
    <path d="M 98 78 C 112 54 132 40 154 40 C 146 48 148 56 154 62 C 142 60 138 68 144 76 C 132 72 122 78 118 88 Z" fill="url(#chm-wing)" stroke="#1a0604" stroke-width="1"/>
    <!-- a lion's body and legs -->
    <path d="M 40 112 C 36 92 50 80 80 80 C 110 80 126 92 122 112 C 120 124 106 130 80 130 C 54 130 42 124 40 112 Z" fill="url(#chm-lion)" stroke="#2a1404" stroke-width="1.3"/>
    <g fill="url(#chm-lion)" stroke="#2a1404" stroke-width="1"><path d="M 50 120 L 44 148 L 58 148 L 62 122 Z"/><path d="M 108 120 L 114 148 L 100 148 L 98 122 Z"/></g>
    <g stroke="#f0e8d0" stroke-width="1.4" stroke-linecap="round"><path d="M 44 148 l -3 4 M 49 148 l -1 4 M 54 148 l 1 4 M 114 148 l 3 4 M 109 148 l 1 4 M 104 148 l -1 4"/></g>
    <!-- the tail: a serpent with its own head -->
    <path d="M 122 106 C 140 104 148 92 144 80" fill="none" stroke="#3a5a1a" stroke-width="5" stroke-linecap="round"/>
    <ellipse cx="143" cy="77" rx="5" ry="3.4" fill="#4a7a22" stroke="#1a2a0a" stroke-width="0.8"/><circle cx="144" cy="76" r="0.9" fill="#ff2a2a"/>
    <!-- the goat's head, rising from its back, curled horns -->
    <path d="M 94 84 C 96 72 100 62 108 58" fill="none" stroke="url(#chm-goat)" stroke-width="9" stroke-linecap="round"/>
    <path d="M 102 54 C 102 46 112 42 118 48 C 122 54 120 62 114 66 C 108 66 102 62 102 54 Z" fill="url(#chm-goat)" stroke="#3a3428" stroke-width="1"/>
    <path d="M 106 48 C 98 40 100 30 108 30 C 114 32 112 40 106 40" fill="none" stroke="#5a4a30" stroke-width="2.6" stroke-linecap="round"/>
    <ellipse cx="114" cy="54" rx="2" ry="1.2" fill="#ffd040"/><rect x="113.6" y="53.6" width="1.6" height="0.8" fill="#000"/>
    <path d="M 116 64 l 1 6 l 2 -5" stroke="#d8d0c0" stroke-width="1" fill="none"/>
    <!-- the dragon's head on a long neck, breathing fire -->
    <path d="M 64 86 C 54 70 42 60 30 58" fill="none" stroke="url(#chm-dragon)" stroke-width="9" stroke-linecap="round"/>
    <path d="M 34 56 C 28 48 16 48 10 54 L 2 58 L 12 62 C 18 66 30 64 34 56 Z" fill="url(#chm-dragon)" stroke="#2a0402" stroke-width="1"/>
    <path d="M 26 50 l 4 -8 l 0 8 M 32 52 l 6 -6 l -2 8" fill="#d8d0b8" stroke="#3a2a1a" stroke-width="0.5"/>
    <circle cx="22" cy="54" r="1.4" fill="#ffd040"/>
    <path d="M 2 58 C -2 60 -4 62 0 66" fill="url(#chm-fire)"/>
    <ellipse cx="2" cy="60" rx="10" ry="6" fill="url(#chm-fire)"/>
    <!-- and the lion's head itself, roaring -->
    <circle cx="74" cy="76" r="20" fill="url(#chm-mane)" stroke="#1a0a02" stroke-width="1"/>
    <path d="M 62 72 C 62 62 86 62 86 72 C 86 82 80 90 74 90 C 68 90 62 82 62 72 Z" fill="url(#chm-lion)" stroke="#2a1404" stroke-width="1"/>
    <path d="M 66 70 L 71 72 M 82 70 L 77 72" stroke="#1a0a02" stroke-width="1.4"/>
    <circle cx="69" cy="73" r="1.4" fill="#ffd040"/><circle cx="79" cy="73" r="1.4" fill="#ffd040"/>
    <path d="M 68 82 Q 74 90 80 82 Q 74 85 68 82 Z" fill="#5a0a0a"/>
    <path d="M 69 82 l 1 3 l 1 -3 M 77 82 l 1 3 l 1 -3" fill="#f4ecd8"/>
    </svg>
  `,

  'Pit Fiend': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Pit Fiend">
    <defs>
    <radialGradient id="ptf-skin" cx="40%" cy="30%" r="80%"><stop offset="0" stop-color="#e84a2a"/><stop offset="0.55" stop-color="#9a1a0a"/><stop offset="1" stop-color="#2a0402"/></radialGradient>
    <linearGradient id="ptf-wing" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a0a06"/><stop offset="1" stop-color="#140202"/></linearGradient>
    <linearGradient id="ptf-horn" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#2a2420"/><stop offset="1" stop-color="#c8b8a0"/></linearGradient>
    <radialGradient id="ptf-heat" cx="50%" cy="60%" r="60%"><stop offset="0" stop-color="#ff5a1a" stop-opacity="0.45"/><stop offset="1" stop-color="#5a0a00" stop-opacity="0"/></radialGradient>
    <filter id="ptf-glow" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="1.8"/></filter>
    <filter id="ptf-blur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6"/></filter>
    <filter id="ptf-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1"/></filter>
    </defs>
    <ellipse cx="80" cy="84" rx="76" ry="72" fill="url(#ptf-heat)" filter="url(#ptf-blur)"/>
    <ellipse cx="80" cy="153" rx="60" ry="5" fill="#000" opacity="0.6" filter="url(#ptf-soft)"/>
    <!-- vast wings, folded high like a cloak -->
    <path d="M 60 60 C 40 30 18 10 2 8 C 12 30 10 60 18 96 C 28 82 40 76 52 80 Z" fill="url(#ptf-wing)" stroke="#0a0000" stroke-width="1.1"/>
    <path d="M 100 60 C 120 30 142 10 158 8 C 148 30 150 60 142 96 C 132 82 120 76 108 80 Z" fill="url(#ptf-wing)" stroke="#0a0000" stroke-width="1.1"/>
    <g stroke="#2a0402" stroke-width="1" fill="none"><path d="M 58 62 L 6 14 M 56 70 L 12 54 M 54 78 L 18 94"/><path d="M 102 62 L 154 14 M 104 70 L 148 54 M 106 78 L 142 94"/></g>
    <!-- legs -->
    <path d="M 60 116 L 54 150 L 70 150 L 74 118 Z M 100 116 L 106 150 L 90 150 L 86 118 Z" fill="url(#ptf-skin)" stroke="#1a0202" stroke-width="1.1"/>
    <!-- scaled, armored torso -->
    <path d="M 46 70 C 40 92 46 110 58 120 L 102 120 C 114 110 120 92 114 70 C 104 60 56 60 46 70 Z" fill="url(#ptf-skin)" stroke="#1a0202" stroke-width="1.3"/>
    <g stroke="#3a0602" stroke-width="1.2" fill="none" opacity="0.8"><path d="M 60 78 Q 80 86 100 78"/><path d="M 58 92 Q 80 100 102 92"/><path d="M 60 106 Q 80 114 100 106"/></g>
    <!-- arms: a flanged mace in one fist -->
    <path d="M 112 74 C 124 84 128 96 124 108" fill="none" stroke="#1a0202" stroke-width="13" stroke-linecap="round"/>
    <path d="M 112 74 C 124 84 128 96 124 108" fill="none" stroke="url(#ptf-skin)" stroke-width="10" stroke-linecap="round"/>
    <path d="M 124 108 L 140 140" stroke="#2a2420" stroke-width="4"/>
    <path d="M 136 132 l 12 6 l -4 8 l -12 -4 z" fill="#3a3430" stroke="#000" stroke-width="0.8"/>
    <path d="M 48 74 C 36 84 30 98 30 110" fill="none" stroke="#1a0202" stroke-width="13" stroke-linecap="round"/>
    <path d="M 48 74 C 36 84 30 98 30 110" fill="none" stroke="url(#ptf-skin)" stroke-width="10" stroke-linecap="round"/>
    <g stroke="#e8e0c8" stroke-width="1.6" stroke-linecap="round"><path d="M 30 110 l -5 6 M 30 110 l -1 8 M 30 110 l 4 7"/></g>
    <!-- the head: a horned devil's face, fanged, eyes like coals -->
    <path d="M 64 46 C 62 32 70 24 80 24 C 90 24 98 32 96 46 C 96 56 90 64 80 66 C 70 64 64 56 64 46 Z" fill="url(#ptf-skin)" stroke="#1a0202" stroke-width="1.2"/>
    <path d="M 66 34 C 54 26 48 12 52 0 C 58 12 64 20 72 26 Z M 94 34 C 106 26 112 12 108 0 C 102 12 96 20 88 26 Z" fill="url(#ptf-horn)" stroke="#1a1410" stroke-width="0.8"/>
    <path d="M 66 42 L 76 46 M 94 42 L 84 46" stroke="#1a0202" stroke-width="2" stroke-linecap="round"/>
    <ellipse cx="72" cy="48" rx="3" ry="2" fill="#ffd040" filter="url(#ptf-glow)"/><ellipse cx="88" cy="48" rx="3" ry="2" fill="#ffd040" filter="url(#ptf-glow)"/>
    <ellipse cx="72" cy="48" rx="2" ry="1.3" fill="#fff8d0"/><ellipse cx="88" cy="48" rx="2" ry="1.3" fill="#fff8d0"/>
    <path d="M 70 58 Q 80 66 90 58 Q 80 61 70 58 Z" fill="#1a0202"/>
    <path d="M 72 58 l 1.4 6 l 1.4 -5 M 86 58 l -1.4 6 l -1.4 -5" fill="#f4ecd8"/>
    <!-- smoke curling off it -->
    <g fill="#3a2a28" opacity="0.4" filter="url(#ptf-soft)"><circle cx="56" cy="20" r="5"/><circle cx="104" cy="18" r="6"/></g>
    </svg>
  `,

  'Balor': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Balor">
    <defs>
    <radialGradient id="blr-skin" cx="40%" cy="30%" r="80%"><stop offset="0" stop-color="#5a1a0a"/><stop offset="0.6" stop-color="#2a0602"/><stop offset="1" stop-color="#0a0000"/></radialGradient>
    <radialGradient id="blr-flame" cx="50%" cy="80%" r="70%"><stop offset="0" stop-color="#fff0a0"/><stop offset="0.35" stop-color="#ffa02a"/><stop offset="0.75" stop-color="#e2380c"/><stop offset="1" stop-color="#7a0a00" stop-opacity="0"/></radialGradient>
    <linearGradient id="blr-wing" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a0a06"/><stop offset="1" stop-color="#000"/></linearGradient>
    <filter id="blr-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="blr-blur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="5"/></filter>
    </defs>
    <!-- a halo of fire all around it -->
    <path d="M 20 150 C 4 110 10 60 30 30 C 30 50 40 56 44 40 C 48 20 64 8 80 2 C 96 8 112 20 116 40 C 120 56 130 50 130 30 C 150 60 156 110 140 150 Z" fill="url(#blr-flame)" filter="url(#blr-blur)" opacity="0.85"/>
    <!-- huge black wings -->
    <path d="M 62 62 C 40 36 18 26 0 28 C 8 40 6 52 0 60 C 14 58 16 68 8 78 C 22 74 28 82 22 94 C 36 86 46 88 52 96 Z" fill="url(#blr-wing)" stroke="#000" stroke-width="1"/>
    <path d="M 98 62 C 120 36 142 26 160 28 C 152 40 154 52 160 60 C 146 58 144 68 152 78 C 138 74 132 82 138 94 C 124 86 114 88 108 96 Z" fill="url(#blr-wing)" stroke="#000" stroke-width="1"/>
    <!-- legs wreathed in flame -->
    <path d="M 60 116 L 52 152 L 70 152 L 74 118 Z M 100 116 L 108 152 L 90 152 L 86 118 Z" fill="url(#blr-skin)" stroke="#000" stroke-width="1.1"/>
    <!-- massive torso -->
    <path d="M 42 70 C 36 92 44 110 58 120 L 102 120 C 116 110 124 92 118 70 C 106 58 54 58 42 70 Z" fill="url(#blr-skin)" stroke="#000" stroke-width="1.3"/>
    <g stroke="#ff6a1a" stroke-width="1" fill="none" opacity="0.6"><path d="M 60 80 l 6 8 l -4 8"/><path d="M 96 82 l -5 9 l 4 7"/><path d="M 78 100 l 4 10"/></g>
    <!-- the whip of flame -->
    <path d="M 46 74 C 34 82 28 94 26 104" fill="none" stroke="url(#blr-skin)" stroke-width="11" stroke-linecap="round"/>
    <path d="M 26 104 C 12 110 4 124 10 136 C 18 148 34 146 40 154" fill="none" stroke="#ff8a1a" stroke-width="3" filter="url(#blr-glow)"/>
    <path d="M 26 104 C 12 110 4 124 10 136 C 18 148 34 146 40 154" fill="none" stroke="#fff0a0" stroke-width="1"/>
    <!-- the sword of lightning -->
    <path d="M 114 74 C 126 82 130 92 128 100" fill="none" stroke="url(#blr-skin)" stroke-width="11" stroke-linecap="round"/>
    <path d="M 128 100 L 146 18" stroke="#e8f4ff" stroke-width="4" filter="url(#blr-glow)"/>
    <path d="M 132 76 l 8 -6 l -4 -2 l 10 -10 M 138 46 l 8 -4 l -4 -2 l 6 -8" stroke="#bfe0ff" stroke-width="1.2" fill="none" filter="url(#blr-glow)"/>
    <path d="M 120 104 L 136 98" stroke="#3a3a3a" stroke-width="3"/>
    <!-- the head: a horned skull-like face of shadow, eyes of fire -->
    <path d="M 62 46 C 60 32 70 22 80 22 C 90 22 100 32 98 46 C 98 58 90 66 80 68 C 70 66 62 58 62 46 Z" fill="url(#blr-skin)" stroke="#000" stroke-width="1.2"/>
    <path d="M 64 32 C 50 26 42 12 44 0 C 52 12 60 20 70 24 Z M 96 32 C 110 26 118 12 116 0 C 108 12 100 20 90 24 Z" fill="#1a1410" stroke="#000" stroke-width="0.8"/>
    <ellipse cx="71" cy="46" rx="4" ry="2.4" fill="#ffd040" filter="url(#blr-glow)"/><ellipse cx="89" cy="46" rx="4" ry="2.4" fill="#ffd040" filter="url(#blr-glow)"/>
    <path d="M 70 58 Q 80 66 90 58 Q 80 62 70 58 Z" fill="#ff6a1a" filter="url(#blr-glow)"/>
    <path d="M 72 58 l 1.4 5 l 1.4 -4 M 86 58 l -1.4 5 l -1.4 -4 M 78 60 l 1 3 l 1 -3" fill="#e8e0c8"/>
    </svg>
  `,

  'Marilith': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Marilith">
    <defs>
    <radialGradient id="mrl-skin" cx="45%" cy="35%" r="70%"><stop offset="0" stop-color="#c88a6a"/><stop offset="0.6" stop-color="#8a4a3a"/><stop offset="1" stop-color="#3a1a14"/></radialGradient>
    <linearGradient id="mrl-tail" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1a3a2a"/><stop offset="0.5" stop-color="#3a7a5a"/><stop offset="1" stop-color="#1a3a2a"/></linearGradient>
    <linearGradient id="mrl-blade" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f0f4ff"/><stop offset="1" stop-color="#5a5e68"/></linearGradient>
    <filter id="mrl-glow" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="1.4"/></filter>
    <filter id="mrl-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1"/></filter>
    </defs>
    <ellipse cx="80" cy="153" rx="62" ry="5" fill="#000" opacity="0.6" filter="url(#mrl-soft)"/>
    <!-- the great serpent's tail, coiled -->
    <path d="M 70 96 C 54 112 46 132 62 146 C 82 160 120 156 136 140 C 148 126 140 110 124 112 C 110 114 112 132 100 136 C 88 140 80 128 88 112 Z" fill="url(#mrl-tail)" stroke="#0a1a12" stroke-width="1.3"/>
    <g stroke="#0a1a12" stroke-width="0.8" fill="none" opacity="0.6"><path d="M 60 120 q 10 4 20 0"/><path d="M 70 140 q 16 4 32 0"/><path d="M 112 140 q 10 -2 18 -8"/></g>
    <!-- six arms, six swords, fanned out -->
    <g fill="none" stroke="url(#mrl-skin)" stroke-width="6" stroke-linecap="round">
      <path d="M 66 64 C 52 54 40 44 30 30"/><path d="M 64 72 C 46 70 32 70 18 64"/><path d="M 66 82 C 50 88 36 96 24 106"/>
      <path d="M 94 64 C 108 54 120 44 130 30"/><path d="M 96 72 C 114 70 128 70 142 64"/><path d="M 94 82 C 110 88 124 96 136 106"/>
    </g>
    <g stroke="url(#mrl-blade)" stroke-width="2.6" stroke-linecap="round">
      <path d="M 30 30 L 14 4"/><path d="M 18 64 L -2 58"/><path d="M 24 106 L 6 124"/>
      <path d="M 130 30 L 146 4"/><path d="M 142 64 L 162 58"/><path d="M 136 106 L 154 124"/>
    </g>
    <g stroke="#a87a2a" stroke-width="2.4"><path d="M 26 32 l 8 -4 M 18 60 l 2 8 M 22 102 l 6 6 M 134 32 l -8 -4 M 142 60 l -2 8 M 138 102 l -6 6"/></g>
    <!-- a woman's torso, with bronze ornaments -->
    <path d="M 66 58 C 62 74 64 88 70 98 L 90 98 C 96 88 98 74 94 58 C 88 54 72 54 66 58 Z" fill="url(#mrl-skin)" stroke="#2a1008" stroke-width="1.1"/>
    <path d="M 66 64 Q 80 72 94 64 L 92 70 Q 80 78 68 70 Z" fill="#c8962a" stroke="#4a3006" stroke-width="0.7"/>
    <!-- her face, cold and beautiful, with a serpent's eyes -->
    <path d="M 70 36 C 68 24 74 18 80 18 C 86 18 92 24 90 36 C 90 46 86 52 80 52 C 74 52 70 46 70 36 Z" fill="url(#mrl-skin)" stroke="#2a1008" stroke-width="1"/>
    <path d="M 68 30 C 66 14 94 14 92 30 C 96 40 98 54 94 62 C 92 50 90 40 88 32 C 84 28 76 28 72 32 C 70 40 68 50 66 62 C 62 54 64 40 68 30 Z" fill="#0a0a10"/>
    <ellipse cx="76" cy="36" rx="2.4" ry="1.4" fill="#d8ff4a" filter="url(#mrl-glow)"/><ellipse cx="84" cy="36" rx="2.4" ry="1.4" fill="#d8ff4a" filter="url(#mrl-glow)"/>
    <ellipse cx="76" cy="36" rx="0.5" ry="1.3" fill="#000"/><ellipse cx="84" cy="36" rx="0.5" ry="1.3" fill="#000"/>
    <path d="M 77 45 Q 80 47 83 45" stroke="#5a1a1a" stroke-width="1.2" fill="none"/>
    <path d="M 72 18 L 80 10 L 88 18" stroke="#c8962a" stroke-width="2" fill="none"/>
    </svg>
  `,

  'Erinyes': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Erinyes">
    <defs>
    <linearGradient id="ery-wing" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2a34"/><stop offset="1" stop-color="#050508"/></linearGradient>
    <radialGradient id="ery-skin" cx="45%" cy="35%" r="70%"><stop offset="0" stop-color="#f0d8d0"/><stop offset="1" stop-color="#9a7a78"/></radialGradient>
    <linearGradient id="ery-armor" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4a4a58"/><stop offset="1" stop-color="#0e0e14"/></linearGradient>
    <radialGradient id="ery-flame" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff0a0"/><stop offset="0.5" stop-color="#ff6a1a"/><stop offset="1" stop-color="#7a0a00" stop-opacity="0"/></radialGradient>
    <filter id="ery-glow" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="1.6"/></filter>
    <filter id="ery-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1"/></filter>
    </defs>
    <ellipse cx="80" cy="153" rx="46" ry="5" fill="#000" opacity="0.6" filter="url(#ery-soft)"/>
    <!-- great black-feathered wings, spread -->
    <path d="M 66 62 C 48 40 26 24 4 20 C 10 30 6 38 2 44 C 14 44 16 52 8 60 C 22 58 24 68 16 78 C 30 74 36 82 32 92 C 46 84 54 88 58 96 Z" fill="url(#ery-wing)" stroke="#000" stroke-width="1"/>
    <path d="M 94 62 C 112 40 134 24 156 20 C 150 30 154 38 158 44 C 146 44 144 52 152 60 C 138 58 136 68 144 78 C 130 74 124 82 128 92 C 114 84 106 88 102 96 Z" fill="url(#ery-wing)" stroke="#000" stroke-width="1"/>
    <g stroke="#4a4a58" stroke-width="0.7" fill="none"><path d="M 60 66 L 10 30 M 58 74 L 12 58 M 56 84 L 22 82"/><path d="M 100 66 L 150 30 M 102 74 L 148 58 M 104 84 L 138 82"/></g>
    <!-- black armor, a long skirt of mail -->
    <path d="M 64 62 C 60 78 62 92 66 100 L 60 150 L 100 150 L 94 100 C 98 92 100 78 96 62 C 90 58 70 58 64 62 Z" fill="url(#ery-armor)" stroke="#000" stroke-width="1.2"/>
    <path d="M 66 100 L 94 100" stroke="#8a2a2a" stroke-width="2"/>
    <!-- the burning longbow, drawn -->
    <path d="M 122 40 C 136 60 136 92 122 112" stroke="#3a2a1a" stroke-width="3" fill="none"/>
    <path d="M 122 40 L 104 76 L 122 112" stroke="#d8d0c0" stroke-width="0.6" fill="none"/>
    <path d="M 104 76 L 140 76" stroke="#c8b898" stroke-width="1.4"/>
    <circle cx="142" cy="76" r="6" fill="url(#ery-flame)" filter="url(#ery-glow)"/>
    <path d="M 96 68 C 102 72 104 74 104 76" stroke="url(#ery-skin)" stroke-width="5" stroke-linecap="round" fill="none"/>
    <path d="M 96 70 C 110 72 118 74 128 76" stroke="url(#ery-skin)" stroke-width="5" stroke-linecap="round" fill="none"/>
    <!-- the coiled rope of entanglement at her hip -->
    <g fill="none" stroke="#c8a860" stroke-width="1.6"><circle cx="62" cy="96" r="6"/><circle cx="62" cy="96" r="3.6"/></g>
    <path d="M 64 66 C 54 76 48 86 46 96" stroke="url(#ery-skin)" stroke-width="5" stroke-linecap="round" fill="none"/>
    <!-- her face: beautiful, pitiless, with eyes like embers -->
    <path d="M 70 38 C 68 26 74 20 80 20 C 86 20 92 26 90 38 C 90 48 86 54 80 54 C 74 54 70 48 70 38 Z" fill="url(#ery-skin)" stroke="#3a2422" stroke-width="1"/>
    <path d="M 68 32 C 64 16 96 16 92 32 C 98 44 100 58 96 68 C 94 54 92 44 90 36 C 86 30 74 30 70 36 C 68 44 66 54 64 68 C 60 58 62 44 68 32 Z" fill="#0a0a0e"/>
    <ellipse cx="76" cy="38" rx="2.2" ry="1.3" fill="#ff5a1a" filter="url(#ery-glow)"/><ellipse cx="84" cy="38" rx="2.2" ry="1.3" fill="#ff5a1a" filter="url(#ery-glow)"/>
    <ellipse cx="76" cy="38" rx="1.3" ry="0.8" fill="#ffd0a0"/><ellipse cx="84" cy="38" rx="1.3" ry="0.8" fill="#ffd0a0"/>
    <path d="M 77 47 L 83 47" stroke="#5a1a1a" stroke-width="1.2"/>
    </svg>
  `,

  'Manticore': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Manticore">
    <defs>
    <radialGradient id="mtc-fur" cx="45%" cy="30%" r="80%">
    <stop offset="0" stop-color="#c88a40"/>
    <stop offset="0.45" stop-color="#8a5220"/>
    <stop offset="1" stop-color="#2a1406"/>
    </radialGradient>
    <radialGradient id="mtc-mane" cx="50%" cy="55%" r="65%">
    <stop offset="0" stop-color="#4a1a08"/>
    <stop offset="0.7" stop-color="#2a0c04"/>
    <stop offset="1" stop-color="#0e0402"/>
    </radialGradient>
    <linearGradient id="mtc-wing" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#4a2626"/>
    <stop offset="0.6" stop-color="#2a1212"/>
    <stop offset="1" stop-color="#120606"/>
    </linearGradient>
    <radialGradient id="mtc-face" cx="45%" cy="30%" r="75%">
    <stop offset="0" stop-color="#c89878"/>
    <stop offset="0.55" stop-color="#8a5a44"/>
    <stop offset="1" stop-color="#3a1e14"/>
    </radialGradient>
    <linearGradient id="mtc-spike" x1="0" y1="1" x2="0" y2="0">
    <stop offset="0" stop-color="#2a2c32"/>
    <stop offset="0.6" stop-color="#8a8e98"/>
    <stop offset="1" stop-color="#e8ecf0"/>
    </linearGradient>
    <linearGradient id="mtc-tooth" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#fffef4"/>
    <stop offset="1" stop-color="#c8bc98"/>
    </linearGradient>
    <radialGradient id="mtc-maw" cx="50%" cy="40%" r="60%">
    <stop offset="0" stop-color="#7a0c08"/>
    <stop offset="1" stop-color="#1a0202"/>
    </radialGradient>
    <pattern id="mtc-furlines" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(25)">
    <path d="M 0 3 L 4 3" stroke="#2a1406" stroke-width="0.6" opacity="0.5"/>
    </pattern>
    <filter id="mtc-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1"/></filter>
    <filter id="mtc-glow" x="-120%" y="-120%" width="340%" height="340%"><feGaussianBlur stdDeviation="1.6"/></filter>
    <filter id="mtc-shade" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.5"/></filter>
    </defs>

    <!-- shadow and a red underglow -->
    <ellipse cx="80" cy="153" rx="62" ry="5.5" fill="#000" opacity="0.7" filter="url(#mtc-soft)"/>
    <ellipse cx="80" cy="150" rx="40" ry="4" fill="#5a0606" opacity="0.35" filter="url(#mtc-shade)"/>

    <!-- tattered bat wings, raised and spread -->
    <path d="M 66 74 C 50 46 30 22 4 14 C 12 26 10 34 4 42 C 14 40 20 46 18 56 C 26 52 34 58 32 68 C 40 64 48 70 52 82 Z" fill="url(#mtc-wing)" stroke="#0a0404" stroke-width="1.2"/>
    <path d="M 94 74 C 110 46 130 22 156 14 C 148 26 150 34 156 42 C 146 40 140 46 142 56 C 134 52 126 58 128 68 C 120 64 112 70 108 82 Z" fill="url(#mtc-wing)" stroke="#0a0404" stroke-width="1.2"/>
    <!-- wing bones and veins -->
    <g stroke="#5a3030" stroke-width="1.2" fill="none" stroke-linecap="round">
      <path d="M 66 74 L 4 14"/><path d="M 62 72 L 4 42"/><path d="M 60 74 L 18 56"/><path d="M 58 76 L 32 68"/>
      <path d="M 94 74 L 156 14"/><path d="M 98 72 L 156 42"/><path d="M 100 74 L 142 56"/><path d="M 102 76 L 128 68"/>
    </g>
    <g stroke="#3a1818" stroke-width="0.5" fill="none" opacity="0.8">
      <path d="M 30 36 q 6 6 4 14"/><path d="M 20 30 q 4 8 0 14"/><path d="M 44 52 q 4 4 2 10"/>
      <path d="M 130 36 q -6 6 -4 14"/><path d="M 140 30 q -4 8 0 14"/><path d="M 116 52 q -4 4 -2 10"/>
    </g>
    <!-- tears in the wing membrane -->
    <path d="M 22 40 l 4 3 l -3 3 z M 138 40 l -4 3 l 3 3 z M 40 60 l 3 2 l -2 3 z" fill="#000" opacity="0.85"/>
    <g fill="#c8ccd4"><path d="M 4 14 l -3 -5 l 6 3 z"/><path d="M 156 14 l 3 -5 l -6 3 z"/></g>

    <!-- scorpion tail, raised high over the back, segmented, with a crown of iron spikes -->
    <path d="M 116 116 C 146 110 156 82 146 58 C 140 42 126 34 114 38" fill="none" stroke="#1a0c04" stroke-width="11" stroke-linecap="round"/>
    <path d="M 116 116 C 146 110 156 82 146 58 C 140 42 126 34 114 38" fill="none" stroke="url(#mtc-fur)" stroke-width="8" stroke-linecap="round"/>
    <g stroke="#2a1406" stroke-width="1" fill="none">
      <path d="M 138 108 q 4 -4 2 -8"/><path d="M 146 92 q 5 -2 4 -7"/><path d="M 149 74 q 4 0 2 -6"/><path d="M 144 56 q 3 2 4 -4"/><path d="M 132 42 q 2 3 6 0"/>
    </g>
    <g fill="url(#mtc-spike)" stroke="#0c0d10" stroke-width="0.6">
      <path d="M 114 38 L 98 20 L 110 40 Z"/><path d="M 114 38 L 106 14 L 114 36 Z"/><path d="M 114 38 L 118 12 L 117 37 Z"/>
      <path d="M 114 38 L 128 18 L 118 39 Z"/><path d="M 114 38 L 94 34 L 110 42 Z"/><path d="M 114 38 L 130 32 L 117 42 Z"/>
      <path d="M 150 68 L 162 60 L 152 72 Z"/><path d="M 150 84 L 162 82 L 150 88 Z"/><path d="M 144 100 L 156 104 L 142 104 Z"/>
      <path d="M 148 52 L 158 44 L 150 56 Z"/>
    </g>
    <!-- venom beading on the spikes -->
    <g fill="#9adf3a" filter="url(#mtc-glow)" opacity="0.8"><circle cx="99" cy="21" r="1.4"/><circle cx="118" cy="13" r="1.2"/><circle cx="161" cy="61" r="1.2"/></g>
    <g fill="#d4ff7a"><circle cx="99" cy="21" r="0.7"/><circle cx="118" cy="13" r="0.6"/><circle cx="161" cy="61" r="0.6"/></g>

    <!-- lion body, crouched low, coiled to spring -->
    <path d="M 36 112 C 30 92 44 80 64 80 L 106 82 C 124 84 132 98 126 116 C 122 126 110 130 96 128 L 56 128 C 44 126 38 120 36 112 Z" fill="url(#mtc-fur)" stroke="#1a0c04" stroke-width="1.4"/>
    <path d="M 36 112 C 30 92 44 80 64 80 L 106 82 C 124 84 132 98 126 116 C 122 126 110 130 96 128 L 56 128 C 44 126 38 120 36 112 Z" fill="url(#mtc-furlines)"/>
    <!-- ribs and muscle under the hide -->
    <g stroke="#3a1c08" stroke-width="1" fill="none" opacity="0.75">
      <path d="M 70 92 q 2 10 0 18"/><path d="M 78 92 q 2 10 0 18"/><path d="M 86 92 q 2 10 0 18"/><path d="M 94 93 q 2 10 0 17"/>
      <path d="M 110 96 q 8 6 8 16"/><path d="M 48 98 q -6 6 -4 14"/>
    </g>
    <!-- old scars -->
    <path d="M 100 100 l 12 8 M 103 98 l 12 8" stroke="#d8a888" stroke-width="0.8" opacity="0.6"/>

    <!-- forelegs braced, claws out and bloodied -->
    <path d="M 46 116 C 40 128 36 138 32 148 L 50 148 C 54 140 58 130 62 122 Z" fill="url(#mtc-fur)" stroke="#1a0c04" stroke-width="1.2"/>
    <path d="M 106 120 C 112 130 116 140 120 148 L 102 148 C 98 140 94 132 90 124 Z" fill="url(#mtc-fur)" stroke="#1a0c04" stroke-width="1.2"/>
    <g fill="#f4ecd4" stroke="#3a2a14" stroke-width="0.4">
      <path d="M 32 148 l -6 5 l 8 -2 z"/><path d="M 38 148 l -4 6 l 7 -3 z"/><path d="M 44 148 l -2 6 l 6 -4 z"/><path d="M 50 148 l 0 6 l 4 -5 z"/>
      <path d="M 102 148 l 0 6 l -4 -5 z"/><path d="M 108 148 l 2 6 l -6 -4 z"/><path d="M 114 148 l 4 6 l -7 -3 z"/><path d="M 120 148 l 6 5 l -8 -2 z"/>
    </g>
    <g fill="#8a0a06" opacity="0.85"><path d="M 26 153 l 4 -2 l 1 2 z"/><path d="M 34 154 l 3 -2 l 1 2 z"/><path d="M 126 153 l -4 -2 l -1 2 z"/></g>
    <g fill="#6a0404" opacity="0.6"><ellipse cx="30" cy="154" rx="4" ry="1"/><ellipse cx="124" cy="154" rx="3" ry="0.8"/></g>

    <!-- the great matted mane -->
    <path d="M 52 86 C 36 76 34 52 44 38 C 52 26 66 20 80 20 C 94 20 108 26 116 38 C 126 52 124 76 108 86 C 100 98 60 98 52 86 Z" fill="url(#mtc-mane)" stroke="#060200" stroke-width="1.3"/>
    <g stroke="#5a2410" stroke-width="1.1" fill="none" opacity="0.8" stroke-linecap="round">
      <path d="M 46 44 q -8 10 -4 22"/><path d="M 114 44 q 8 10 4 22"/><path d="M 56 30 q -6 8 -4 18"/><path d="M 104 30 q 6 8 4 18"/>
      <path d="M 42 62 q -6 8 0 18"/><path d="M 118 62 q 6 8 0 18"/><path d="M 68 24 q -2 6 0 12"/><path d="M 92 24 q 2 6 0 12"/>
      <path d="M 50 80 q -2 8 4 14"/><path d="M 110 80 q 2 8 -4 14"/>
    </g>
    <!-- spiky tufts at the mane's edge -->
    <g fill="#1a0804">
      <path d="M 40 50 l -8 -4 l 6 8 z"/><path d="M 120 50 l 8 -4 l -6 8 z"/><path d="M 38 70 l -8 2 l 8 4 z"/><path d="M 122 70 l 8 2 l -8 4 z"/>
      <path d="M 60 22 l -4 -8 l 8 6 z"/><path d="M 100 22 l 4 -8 l -8 6 z"/><path d="M 80 20 l 0 -8 l 4 8 z"/>
    </g>

    <!-- a gaunt human face, snarling -->
    <path d="M 62 50 C 60 36 70 30 80 30 C 90 30 100 36 98 50 C 98 64 92 76 80 77 C 68 76 62 64 62 50 Z" fill="url(#mtc-face)" stroke="#2a140a" stroke-width="1.2"/>
    <!-- hollow cheeks and a furrowed brow -->
    <path d="M 66 58 q 4 6 6 12 M 94 58 q -4 6 -6 12" stroke="#4a2414" stroke-width="1" fill="none" opacity="0.8"/>
    <path d="M 68 40 L 76 46 M 92 40 L 84 46 M 76 37 q 4 2 8 0" stroke="#2a1006" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <!-- deep-set eyes, burning red -->
    <ellipse cx="72" cy="48" rx="4.4" ry="2.6" fill="#140404"/>
    <ellipse cx="88" cy="48" rx="4.4" ry="2.6" fill="#140404"/>
    <ellipse cx="72" cy="48" rx="3.2" ry="1.9" fill="#ff2008" filter="url(#mtc-glow)"/>
    <ellipse cx="88" cy="48" rx="3.2" ry="1.9" fill="#ff2008" filter="url(#mtc-glow)"/>
    <ellipse cx="72" cy="48" rx="2.2" ry="1.3" fill="#ff8a3a"/>
    <ellipse cx="88" cy="48" rx="2.2" ry="1.3" fill="#ff8a3a"/>
    <ellipse cx="72" cy="48" rx="0.6" ry="1.3" fill="#140202"/><ellipse cx="88" cy="48" rx="0.6" ry="1.3" fill="#140202"/>
    <!-- a broken nose -->
    <path d="M 80 47 L 78 56 L 82 57" stroke="#4a2414" stroke-width="1" fill="none"/>
    <!-- the gaping maw: rows of shark teeth -->
    <path d="M 66 61 Q 80 58 94 61 Q 92 76 80 78 Q 68 76 66 61 Z" fill="url(#mtc-maw)" stroke="#1a0402" stroke-width="0.9"/>
    <g fill="url(#mtc-tooth)" stroke="#5a4a2a" stroke-width="0.3">
      <path d="M 67 61.5 l 1.5 5 l 1.5 -5 z"/><path d="M 70 61 l 1.5 5.5 l 1.5 -5.5 z"/><path d="M 73 60.6 l 1.5 6 l 1.5 -6 z"/><path d="M 76 60.4 l 1.5 6 l 1.5 -6 z"/>
      <path d="M 79 60.3 l 1.5 6 l 1.5 -6 z"/><path d="M 82 60.4 l 1.5 6 l 1.5 -6 z"/><path d="M 85 60.6 l 1.5 6 l 1.5 -6 z"/><path d="M 88 61 l 1.5 5.5 l 1.5 -5.5 z"/><path d="M 91 61.5 l 1.5 5 l 1.5 -5 z"/>
      <path d="M 70 76 l 1.5 -5 l 1.5 5 z"/><path d="M 73 77 l 1.5 -5.5 l 1.5 5.5 z"/><path d="M 76 77.6 l 1.5 -6 l 1.5 6 z"/><path d="M 79 77.8 l 1.5 -6 l 1.5 6 z"/>
      <path d="M 82 77.6 l 1.5 -6 l 1.5 6 z"/><path d="M 85 77 l 1.5 -5.5 l 1.5 5.5 z"/><path d="M 88 76 l 1.5 -5 l 1.5 5 z"/>
    </g>
    <!-- a second row, deeper in the throat -->
    <g fill="#d8ccaa" opacity="0.7">
      <path d="M 72 64 l 1 3 l 1 -3 z"/><path d="M 76 63.6 l 1 3 l 1 -3 z"/><path d="M 80 63.5 l 1 3 l 1 -3 z"/><path d="M 84 63.6 l 1 3 l 1 -3 z"/><path d="M 88 64 l 1 3 l 1 -3 z"/>
    </g>
    <!-- drool and blood -->
    <path d="M 70 76 q 0 6 -1 10" stroke="#c8d8e0" stroke-width="0.7" fill="none" opacity="0.7"/>
    <path d="M 89 76 q 1 5 0 8" stroke="#8a0a06" stroke-width="1" fill="none"/>
    <!-- a ragged beard framing the jaw -->
    <path d="M 62 62 C 62 78 72 90 80 92 C 88 90 98 78 98 62 C 96 74 90 80 80 80 C 70 80 64 74 62 62 Z" fill="#2a0e04" stroke="#0a0402" stroke-width="0.8"/>
    <path d="M 70 82 L 69 90 M 80 84 L 80 93 M 90 82 L 91 90" stroke="#4a1c08" stroke-width="0.8"/>
    <!-- a faint rim of firelight -->
    <path d="M 64 44 Q 66 34 76 31" stroke="#ffb070" stroke-width="0.7" fill="none" opacity="0.35"/>
    </svg>
  `,

  'Orc King': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Orc King">
    <defs>
    <radialGradient id="okg-skin" cx="40%" cy="30%" r="80%">
    <stop offset="0" stop-color="#8a9a5a"/>
    <stop offset="0.5" stop-color="#4a5a2c"/>
    <stop offset="1" stop-color="#18200c"/>
    </radialGradient>
    <linearGradient id="okg-plate" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#6a6e78"/>
    <stop offset="0.45" stop-color="#2a2c32"/>
    <stop offset="1" stop-color="#0c0d10"/>
    </linearGradient>
    <linearGradient id="okg-gold" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#fff0a0"/>
    <stop offset="0.5" stop-color="#d4a02a"/>
    <stop offset="1" stop-color="#6a4a0a"/>
    </linearGradient>
    <linearGradient id="okg-cape" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#7a1010"/>
    <stop offset="1" stop-color="#2a0404"/>
    </linearGradient>
    <linearGradient id="okg-tusk" x1="0" y1="1" x2="0" y2="0">
    <stop offset="0" stop-color="#8a7a5a"/>
    <stop offset="1" stop-color="#f4ecd4"/>
    </linearGradient>
    <linearGradient id="okg-iron" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#c8ccd4"/>
    <stop offset="0.5" stop-color="#5a5e66"/>
    <stop offset="1" stop-color="#1e2024"/>
    </linearGradient>
    <filter id="okg-glow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="1.4"/></filter>
    <filter id="okg-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1"/></filter>
    </defs>

    <ellipse cx="80" cy="154" rx="54" ry="5" fill="#000" opacity="0.6" filter="url(#okg-soft)"/>

    <!-- red cape behind -->
    <path d="M 46 66 C 30 96 28 128 34 150 L 126 150 C 132 128 130 96 114 66 Z" fill="url(#okg-cape)" stroke="#1a0202" stroke-width="1.2"/>
    <path d="M 44 120 L 40 150 M 60 110 L 58 150 M 100 110 L 102 150 M 116 120 L 120 150" stroke="#200202" stroke-width="1" opacity="0.6"/>

    <!-- great axe, runes glowing red -->
    <path d="M 98 146 L 134 14" stroke="#1a0e04" stroke-width="5" stroke-linecap="round"/>
    <path d="M 98 146 L 134 14" stroke="#5a3a1a" stroke-width="3.2" stroke-linecap="round"/>
    <path d="M 128 22 C 148 8 162 28 156 50 C 146 42 134 40 124 42 Z" fill="url(#okg-iron)" stroke="#0c0d10" stroke-width="1.1"/>
    <path d="M 130 22 C 116 14 104 22 106 38 C 112 32 120 32 126 34 Z" fill="url(#okg-iron)" stroke="#0c0d10" stroke-width="1.1"/>
    <g stroke="#ff3a14" stroke-width="1.1" fill="none" filter="url(#okg-glow)">
      <path d="M 140 26 l 4 6 l -4 4 M 146 34 l 4 2"/><path d="M 114 26 l -3 5 l 4 2"/>
    </g>
    <g stroke="#ffb070" stroke-width="0.6" fill="none">
      <path d="M 140 26 l 4 6 l -4 4 M 146 34 l 4 2"/><path d="M 114 26 l -3 5 l 4 2"/>
    </g>

    <!-- legs in plate -->
    <path d="M 56 118 C 50 130 50 140 52 148 L 72 148 C 72 138 74 128 76 120 Z" fill="url(#okg-plate)" stroke="#060608" stroke-width="1.2"/>
    <path d="M 104 118 C 110 130 110 140 108 148 L 88 148 C 88 138 86 128 84 120 Z" fill="url(#okg-plate)" stroke="#060608" stroke-width="1.2"/>
    <path d="M 54 132 L 74 132 M 86 132 L 106 132" stroke="#8a8e98" stroke-width="0.7" opacity="0.6"/>

    <!-- breastplate: black plate with gold trim and a red eye of Gruumsh -->
    <path d="M 46 70 C 40 92 44 112 54 122 L 106 122 C 116 112 120 92 114 70 Z" fill="url(#okg-plate)" stroke="#060608" stroke-width="1.5"/>
    <path d="M 80 72 L 80 120" stroke="#5a5e68" stroke-width="0.8" opacity="0.6"/>
    <path d="M 48 76 Q 80 88 112 76" stroke="url(#okg-gold)" stroke-width="2" fill="none"/>
    <path d="M 52 112 Q 80 120 108 112 L 108 118 Q 80 126 52 118 Z" fill="url(#okg-gold)" stroke="#3a2a04" stroke-width="0.6"/>
    <ellipse cx="80" cy="98" rx="9" ry="5.5" fill="#1a0404" stroke="url(#okg-gold)" stroke-width="1.2"/>
    <ellipse cx="80" cy="98" rx="4" ry="4" fill="#ff2a10" filter="url(#okg-glow)"/>
    <ellipse cx="80" cy="98" rx="2.6" ry="2.6" fill="#ff7a3a"/>
    <ellipse cx="80" cy="98" rx="0.9" ry="2.2" fill="#1a0202"/>
    <path d="M 58 80 Q 66 76 74 82" stroke="#9a9ea8" stroke-width="0.8" fill="none" opacity="0.5"/>

    <!-- arms: plated, one gripping the axe haft, one behind the shield -->
    <path d="M 112 74 C 122 86 122 98 118 108 L 106 104 C 108 94 106 86 104 80 Z" fill="url(#okg-plate)" stroke="#060608" stroke-width="1.2"/>
    <circle cx="112" cy="108" r="7.5" fill="#4a5a2c" stroke="#121808" stroke-width="1.1"/>
    <path d="M 48 74 C 36 84 32 98 34 110 L 46 112 C 44 100 48 90 56 84 Z" fill="url(#okg-plate)" stroke="#060608" stroke-width="1.2"/>

    <!-- spiked shield on the left arm -->
    <path d="M 16 92 C 16 80 26 74 38 74 C 50 74 60 80 60 92 C 60 112 46 126 38 130 C 30 126 16 112 16 92 Z" fill="url(#okg-plate)" stroke="#060608" stroke-width="1.4"/>
    <path d="M 20 92 C 20 82 28 78 38 78 C 48 78 56 82 56 92 C 56 110 44 122 38 125 C 32 122 20 110 20 92 Z" fill="none" stroke="url(#okg-gold)" stroke-width="1.4"/>
    <circle cx="38" cy="96" r="6" fill="url(#okg-iron)" stroke="#0c0d10" stroke-width="0.8"/>
    <path d="M 38 90 L 38 82 M 32 96 L 24 96 M 44 96 L 52 96 M 38 102 L 38 112" stroke="url(#okg-iron)" stroke-width="2" stroke-linecap="round"/>
    <g fill="#ffffff" opacity="0.15"><ellipse cx="28" cy="86" rx="5" ry="2.5" transform="rotate(-30 28 86)"/></g>

    <!-- great spiked pauldrons with gold edges -->
    <path d="M 32 78 C 34 60 50 54 64 62 C 62 72 54 80 42 84 Z" fill="url(#okg-plate)" stroke="#060608" stroke-width="1.2"/>
    <path d="M 128 78 C 126 60 110 54 96 62 C 98 72 106 80 118 84 Z" fill="url(#okg-plate)" stroke="#060608" stroke-width="1.2"/>
    <path d="M 34 76 C 38 64 50 58 62 64" stroke="url(#okg-gold)" stroke-width="1.3" fill="none"/>
    <path d="M 126 76 C 122 64 110 58 98 64" stroke="url(#okg-gold)" stroke-width="1.3" fill="none"/>
    <g fill="url(#okg-iron)" stroke="#0c0d10" stroke-width="0.6">
      <path d="M 38 66 L 28 52 L 44 62 Z"/><path d="M 50 59 L 46 44 L 56 57 Z"/>
      <path d="M 122 66 L 132 52 L 116 62 Z"/><path d="M 110 59 L 114 44 L 104 57 Z"/>
    </g>

    <!-- head: scarred, tusked, an iron crown with gold points -->
    <path d="M 64 52 C 62 38 70 30 80 30 C 90 30 98 38 96 52 C 96 63 90 72 80 72 C 70 72 64 63 64 52 Z" fill="url(#okg-skin)" stroke="#121808" stroke-width="1.3"/>
    <path d="M 63 48 L 55 41 L 62 53 Z" fill="url(#okg-skin)" stroke="#121808" stroke-width="0.8"/>
    <path d="M 97 48 L 105 41 L 98 53 Z" fill="url(#okg-skin)" stroke="#121808" stroke-width="0.8"/>
    <path d="M 65 45 Q 80 39 95 45 L 94 50 Q 80 45 66 50 Z" fill="#20280c"/>
    <ellipse cx="73" cy="51" rx="3.2" ry="2" fill="#ff3020" filter="url(#okg-glow)" opacity="0.8"/>
    <ellipse cx="87" cy="51" rx="3.2" ry="2" fill="#ff3020" filter="url(#okg-glow)" opacity="0.8"/>
    <ellipse cx="73" cy="51" rx="2.1" ry="1.3" fill="#ff8040"/>
    <ellipse cx="87" cy="51" rx="2.1" ry="1.3" fill="#ff8040"/>
    <circle cx="73" cy="51" r="0.7" fill="#1a0202"/><circle cx="87" cy="51" r="0.7" fill="#1a0202"/>
    <path d="M 84 41 L 90 58" stroke="#8a2a1a" stroke-width="1" opacity="0.8"/>
    <path d="M 76 54 Q 80 59 84 54 L 83 59 Q 80 61 77 59 Z" fill="#3a4a1e" stroke="#121808" stroke-width="0.6"/>
    <path d="M 70 64 Q 80 68 90 64 Q 80 70 70 64 Z" fill="#1a0806"/>
    <path d="M 71 65 L 69 54 L 74 64 Z" fill="url(#okg-tusk)" stroke="#5a4a2a" stroke-width="0.4"/>
    <path d="M 89 65 L 91 54 L 86 64 Z" fill="url(#okg-tusk)" stroke="#5a4a2a" stroke-width="0.4"/>
    <!-- crown -->
    <path d="M 64 38 L 66 22 L 71 32 L 75 18 L 80 30 L 85 18 L 89 32 L 94 22 L 96 38 Z" fill="url(#okg-iron)" stroke="#0c0d10" stroke-width="1"/>
    <path d="M 64 38 L 96 38 L 96 42 L 64 42 Z" fill="url(#okg-gold)" stroke="#3a2a04" stroke-width="0.7"/>
    <g fill="url(#okg-gold)" stroke="#3a2a04" stroke-width="0.5">
      <circle cx="66" cy="22" r="1.8"/><circle cx="75" cy="18" r="1.8"/><circle cx="85" cy="18" r="1.8"/><circle cx="94" cy="22" r="1.8"/>
    </g>
    <circle cx="80" cy="40" r="1.8" fill="#ff2a10" filter="url(#okg-glow)"/>
    <circle cx="80" cy="40" r="1.1" fill="#ff8a5a"/>
    </svg>
  `,

  'Owlbear': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Owlbear">
    <defs>
    <radialGradient id="ob-fur" cx="45%" cy="35%" r="75%">
    <stop offset="0" stop-color="#9a6a3e"/>
    <stop offset="0.5" stop-color="#5e3c1e"/>
    <stop offset="1" stop-color="#241408"/>
    </radialGradient>
    <radialGradient id="ob-head" cx="45%" cy="35%" r="70%">
    <stop offset="0" stop-color="#c8985a"/>
    <stop offset="0.6" stop-color="#8a6034"/>
    <stop offset="1" stop-color="#3a2410"/>
    </radialGradient>
    <radialGradient id="ob-disc" cx="50%" cy="45%" r="55%">
    <stop offset="0" stop-color="#f0d8a8"/>
    <stop offset="1" stop-color="#b08050"/>
    </radialGradient>
    <radialGradient id="ob-eye" cx="45%" cy="40%" r="60%">
    <stop offset="0" stop-color="#ffe070"/>
    <stop offset="0.6" stop-color="#ff8a10"/>
    <stop offset="1" stop-color="#8a3a04"/>
    </radialGradient>
    <linearGradient id="ob-beak" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#f0dca0"/>
    <stop offset="1" stop-color="#6a5020"/>
    </linearGradient>
    <linearGradient id="ob-claw" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#e8e0c8"/>
    <stop offset="1" stop-color="#3a3020"/>
    </linearGradient>
    <pattern id="ob-tufts" width="5" height="4" patternUnits="userSpaceOnUse">
    <path d="M 0.5 4 Q 1.5 1 3 0.5 M 2.5 4 Q 3.5 1.5 5 1" stroke="#1e1006" stroke-width="0.5" fill="none" opacity="0.55"/>
    </pattern>
    <pattern id="ob-feathers" width="5" height="4" patternUnits="userSpaceOnUse">
    <path d="M 0 0 Q 2.5 4 5 0" stroke="#5a3c1a" stroke-width="0.5" fill="none" opacity="0.6"/>
    </pattern>
    <filter id="ob-glow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="1.4"/></filter>
    <filter id="ob-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1"/></filter>
    <path id="ob-body" d="M 46 70 C 34 96 38 124 54 140 L 106 140 C 122 124 126 96 114 70 C 102 62 58 62 46 70 Z"/>
    <path id="ob-armL" d="M 50 76 C 38 70 28 60 22 46 L 32 42 C 38 54 48 62 60 68 Z"/>
    <path id="ob-armR" d="M 110 76 C 122 70 132 60 138 46 L 128 42 C 122 54 112 62 100 68 Z"/>
    </defs>
    
    <ellipse cx="80" cy="152" rx="46" ry="4.5" fill="#000" opacity="0.55" filter="url(#ob-soft)"/>
    
    <!-- raised forelimbs with hooked claws -->
    <use href="#ob-armL" fill="url(#ob-fur)" stroke="#1a0c04" stroke-width="1.2"/>
    <use href="#ob-armL" fill="url(#ob-tufts)"/>
    <use href="#ob-armR" fill="url(#ob-fur)" stroke="#1a0c04" stroke-width="1.2"/>
    <use href="#ob-armR" fill="url(#ob-tufts)"/>
    <ellipse cx="26" cy="43" rx="8" ry="6.5" fill="#5e3c1e" stroke="#1a0c04" stroke-width="1"/>
    <ellipse cx="134" cy="43" rx="8" ry="6.5" fill="#5e3c1e" stroke="#1a0c04" stroke-width="1"/>
    <g fill="url(#ob-claw)" stroke="#1e1a10" stroke-width="0.4">
    <path d="M 19 40 C 14 36 12 30 14 26 C 16 31 19 35 23 38 Z"/><path d="M 23 38 C 20 32 20 26 23 22 C 24 28 25 33 27 37 Z"/>
    <path d="M 28 37 C 27 31 29 26 32 23 C 31 28 31 33 32 38 Z"/>
    <path d="M 141 40 C 146 36 148 30 146 26 C 144 31 141 35 137 38 Z"/><path d="M 137 38 C 140 32 140 26 137 22 C 136 28 135 33 133 37 Z"/>
    <path d="M 132 37 C 133 31 131 26 128 23 C 129 28 129 33 128 38 Z"/>
    </g>
    
    <!-- stumpy hind legs -->
    <path d="M 54 128 C 48 136 48 144 52 150 L 72 150 C 72 142 70 134 68 128 Z" fill="url(#ob-fur)" stroke="#1a0c04" stroke-width="1.2"/>
    <path d="M 106 128 C 112 136 112 144 108 150 L 88 150 C 88 142 90 134 92 128 Z" fill="url(#ob-fur)" stroke="#1a0c04" stroke-width="1.2"/>
    <g fill="url(#ob-claw)">
    <path d="M 52 148 L 48 154 L 55 150 Z"/><path d="M 58 150 L 57 156 L 61 150 Z"/><path d="M 64 150 L 65 156 L 67 150 Z"/>
    <path d="M 108 148 L 112 154 L 105 150 Z"/><path d="M 102 150 L 103 156 L 99 150 Z"/><path d="M 96 150 L 95 156 L 93 150 Z"/>
    </g>
    
    <!-- shaggy body, feathered breast -->
    <use href="#ob-body" fill="url(#ob-fur)" stroke="#1a0c04" stroke-width="1.5"/>
    <use href="#ob-body" fill="url(#ob-tufts)"/>
    <path d="M 62 74 C 56 94 60 116 70 130 L 90 130 C 100 116 104 94 98 74 C 88 70 72 70 62 74 Z" fill="#b08858"/>
    <path d="M 62 74 C 56 94 60 116 70 130 L 90 130 C 100 116 104 94 98 74 C 88 70 72 70 62 74 Z" fill="url(#ob-feathers)"/>
    <g stroke="#e0c090" stroke-width="0.7" fill="none" opacity="0.5">
    <path d="M 66 84 Q 80 90 94 84"/><path d="M 64 96 Q 80 102 96 96"/><path d="M 66 108 Q 80 114 94 108"/>
    </g>
    <path d="M 50 80 Q 46 100 52 122" stroke="#b88a5a" stroke-width="1" fill="none" opacity="0.4"/>
    
    <!-- owl head: ear tufts, facial disc, huge eyes, hooked beak -->
    <path d="M 58 34 L 48 12 L 64 28 Z" fill="#5e3c1e" stroke="#1a0c04" stroke-width="0.8"/>
    <path d="M 102 34 L 112 12 L 96 28 Z" fill="#5e3c1e" stroke="#1a0c04" stroke-width="0.8"/>
    <path d="M 56 42 C 54 26 66 18 80 18 C 94 18 106 26 104 42 C 104 58 94 70 80 72 C 66 70 56 58 56 42 Z" fill="url(#ob-head)" stroke="#1a0c04" stroke-width="1.4"/>
    <path d="M 56 42 C 54 26 66 18 80 18 C 94 18 106 26 104 42 C 104 58 94 70 80 72 C 66 70 56 58 56 42 Z" fill="url(#ob-feathers)"/>
    <!-- facial disc: two lobes -->
    <path d="M 80 34 C 74 28 62 28 60 38 C 58 50 66 58 78 56 Z" fill="url(#ob-disc)" stroke="#6a4420" stroke-width="0.6"/>
    <path d="M 80 34 C 86 28 98 28 100 38 C 102 50 94 58 82 56 Z" fill="url(#ob-disc)" stroke="#6a4420" stroke-width="0.6"/>
    <path d="M 62 34 Q 70 30 78 36 M 98 34 Q 90 30 82 36" stroke="#3a2410" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <circle cx="70" cy="43" r="7" fill="#ff8a10" opacity="0.5" filter="url(#ob-glow)"/>
    <circle cx="90" cy="43" r="7" fill="#ff8a10" opacity="0.5" filter="url(#ob-glow)"/>
    <circle cx="70" cy="43" r="6" fill="url(#ob-eye)" stroke="#2a1404" stroke-width="0.9"/>
    <circle cx="90" cy="43" r="6" fill="url(#ob-eye)" stroke="#2a1404" stroke-width="0.9"/>
    <circle cx="70.5" cy="43.5" r="3" fill="#0a0402"/><circle cx="89.5" cy="43.5" r="3" fill="#0a0402"/>
    <circle cx="68.5" cy="41" r="1.4" fill="#fff" opacity="0.9"/><circle cx="88" cy="41" r="1.4" fill="#fff" opacity="0.9"/>
    <path d="M 75 50 C 77 46 83 46 85 50 C 85 56 82 62 80 66 C 78 62 75 56 75 50 Z" fill="url(#ob-beak)" stroke="#3a2a0a" stroke-width="0.8"/>
    <path d="M 77 52 Q 80 55 83 52" stroke="#3a2a0a" stroke-width="0.6" fill="none"/>
    <path d="M 78 49 Q 80 47.5 82 49" stroke="#fff" stroke-width="0.6" fill="none" opacity="0.6"/>
    <ellipse cx="70" cy="24" rx="7" ry="3" transform="rotate(-10 70 24)" fill="#fff" opacity="0.13" filter="url(#ob-soft)"/>
    </svg>
  `,

  'Displacer Beast': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Displacer Beast">
    <defs>
    <linearGradient id="db-hide" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#4a4a86"/>
    <stop offset="0.5" stop-color="#262650"/>
    <stop offset="1" stop-color="#0c0c20"/>
    </linearGradient>
    <linearGradient id="db-far" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#2a2a54"/>
    <stop offset="1" stop-color="#08081a"/>
    </linearGradient>
    <linearGradient id="db-bone" x1="0" y1="1" x2="0" y2="0">
    <stop offset="0" stop-color="#5a5060"/>
    <stop offset="1" stop-color="#e8e0f0"/>
    </linearGradient>
    <filter id="db-glow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="1.5"/></filter>
    <filter id="db-blur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.8"/></filter>
    <filter id="db-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1"/></filter>
    
    <g id="db-beast">
    <!-- far legs -->
    <g fill="url(#db-far)" stroke="#04040c" stroke-width="0.8">
    <path d="M 60 108 C 58 122 56 134 52 146 L 58 146 C 62 134 66 122 68 110 Z"/>
    <path d="M 88 110 C 88 124 86 136 84 146 L 90 146 C 92 136 94 124 96 112 Z"/>
    <path d="M 112 104 C 114 118 114 132 112 146 L 118 146 C 120 132 120 118 120 104 Z"/>
    </g>
    <!-- tail -->
    <path d="M 42 100 C 26 98 14 88 12 72 C 11 64 16 60 18 66 C 18 80 28 90 44 92 Z" fill="url(#db-hide)" stroke="#04040c" stroke-width="1"/>
    <!-- body -->
    <path d="M 40 96 C 42 80 64 76 84 78 C 100 78 112 74 122 80 C 130 88 128 104 120 110 C 106 116 70 116 52 112 C 44 110 38 104 40 96 Z" fill="url(#db-hide)" stroke="#04040c" stroke-width="1.3"/>
    <path d="M 50 88 C 66 82 96 82 118 82" stroke="#7a7ac8" stroke-width="1" fill="none" opacity="0.45"/>
    <g stroke="#0c0c20" stroke-width="0.8" fill="none" opacity="0.7">
    <path d="M 60 94 Q 66 100 64 108"/><path d="M 74 92 Q 80 98 78 108"/><path d="M 100 92 Q 104 100 102 108"/>
    </g>
    <!-- near legs -->
    <g fill="url(#db-hide)" stroke="#04040c" stroke-width="1">
    <path d="M 50 104 C 46 118 44 132 42 146 L 50 146 C 54 132 58 120 62 108 Z"/>
    <path d="M 80 108 C 78 122 76 134 74 146 L 82 146 C 84 134 88 122 90 110 Z"/>
    <path d="M 106 102 C 104 116 102 132 100 146 L 108 146 C 110 132 114 116 116 104 Z"/>
    </g>
    <g fill="#e8e0f0">
    <path d="M 41 146 L 40 149 L 43 146.5 Z"/><path d="M 47 146 L 47 149.5 L 49 146.5 Z"/>
    <path d="M 73 146 L 72 149 L 75 146.5 Z"/><path d="M 79 146 L 79 149.5 L 81 146.5 Z"/>
    <path d="M 99 146 L 98 149 L 101 146.5 Z"/><path d="M 105 146 L 105 149.5 L 107 146.5 Z"/>
    </g>
    <!-- tentacles from the shoulders, barbed pads -->
    <path d="M 98 82 C 92 56 102 34 126 30 C 132 29 136 31 138 34 C 130 34 108 40 104 80 Z" fill="url(#db-hide)" stroke="#04040c" stroke-width="1"/>
    <path d="M 92 82 C 80 58 76 34 92 16 C 96 12 100 12 102 14 C 90 26 88 52 98 80 Z" fill="url(#db-far)" stroke="#04040c" stroke-width="1"/>
    <ellipse cx="140" cy="36" rx="7" ry="4.5" transform="rotate(20 140 36)" fill="url(#db-hide)" stroke="#04040c" stroke-width="0.9"/>
    <ellipse cx="103" cy="12" rx="6" ry="4" transform="rotate(-30 103 12)" fill="url(#db-far)" stroke="#04040c" stroke-width="0.9"/>
    <g fill="url(#db-bone)" stroke="#2a2030" stroke-width="0.3">
    <path d="M 142 32 L 148 26 L 145 33 Z"/><path d="M 146 37 L 153 36 L 146 40 Z"/><path d="M 139 40 L 141 47 L 136 40 Z"/>
    <path d="M 104 8 L 106 1 L 107 8 Z"/><path d="M 108 12 L 114 10 L 108 15 Z"/><path d="M 99 10 L 94 5 L 100 7 Z"/>
    </g>
    <!-- head -->
    <path d="M 122 74 L 124 62 L 130 72 Z" fill="url(#db-hide)" stroke="#04040c" stroke-width="0.8"/>
    <path d="M 131 72 L 135 60 L 138 73 Z" fill="url(#db-hide)" stroke="#04040c" stroke-width="0.8"/>
    <path d="M 116 84 C 120 72 134 68 142 75 L 151 84 C 153 88 149 92 145 92 L 137 96 C 128 100 117 96 116 84 Z" fill="url(#db-hide)" stroke="#04040c" stroke-width="1.2"/>
    <path d="M 137 91 L 150 88" stroke="#04040c" stroke-width="0.9"/>
    <g fill="#f0e8f8"><path d="M 140 90.5 L 141 94 L 142.4 90.2 Z"/><path d="M 146 89.3 L 147 92.5 L 148.2 89 Z"/></g>
    <ellipse cx="136" cy="80" rx="3.6" ry="2" fill="#c060ff" filter="url(#db-glow)"/>
    <ellipse cx="136" cy="80" rx="2.6" ry="1.4" fill="#f0c8ff"/>
    <ellipse cx="136.3" cy="80" rx="0.5" ry="1.2" fill="#1a0028"/>
    <circle cx="150" cy="84" r="0.8" fill="#04040c"/>
    <path d="M 120 78 Q 128 72 138 74" stroke="#8a8ad8" stroke-width="0.7" fill="none" opacity="0.5"/>
    </g>
    </defs>
    
    <ellipse cx="84" cy="149" rx="50" ry="4" fill="#000" opacity="0.55" filter="url(#db-soft)"/>
    <!-- the displacement: an afterimage offset from where the beast really is -->
    <use href="#db-beast" transform="translate(-14 -3)" opacity="0.28" filter="url(#db-blur)"/>
    <use href="#db-beast" transform="translate(-7 -1.5)" opacity="0.18"/>
    <use href="#db-beast"/>
    </svg>
  `,

  'Mimic': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Mimic">
    <defs>
    <linearGradient id="mm-wood" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#3a2410"/>
    <stop offset="0.45" stop-color="#8a5a2e"/>
    <stop offset="1" stop-color="#3a2410"/>
    </linearGradient>
    <linearGradient id="mm-lid" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#9a6a38"/>
    <stop offset="1" stop-color="#4a2c12"/>
    </linearGradient>
    <linearGradient id="mm-iron" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#a8acb4"/>
    <stop offset="0.5" stop-color="#4a4e56"/>
    <stop offset="1" stop-color="#1e2024"/>
    </linearGradient>
    <radialGradient id="mm-maw" cx="50%" cy="40%" r="60%">
    <stop offset="0" stop-color="#7a1020"/>
    <stop offset="1" stop-color="#1a0206"/>
    </radialGradient>
    <linearGradient id="mm-tongue" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#e06070"/>
    <stop offset="1" stop-color="#8a1a2a"/>
    </linearGradient>
    <radialGradient id="mm-gold" cx="40%" cy="35%" r="60%">
    <stop offset="0" stop-color="#fff0a0"/>
    <stop offset="1" stop-color="#b08010"/>
    </radialGradient>
    <radialGradient id="mm-flesh" cx="40%" cy="35%" r="70%">
    <stop offset="0" stop-color="#c89a88"/>
    <stop offset="1" stop-color="#5a3a34"/>
    </radialGradient>
    <filter id="mm-glow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="1.3"/></filter>
    <filter id="mm-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1"/></filter>
    </defs>
    
    <ellipse cx="80" cy="150" rx="56" ry="4.5" fill="#000" opacity="0.55" filter="url(#mm-soft)"/>
    
    <!-- pseudopods reaching out from the sides -->
    <path d="M 36 112 C 22 110 12 100 10 88 C 9 82 14 80 16 85 C 18 96 26 102 38 102 Z" fill="url(#mm-flesh)" stroke="#2a1410" stroke-width="1"/>
    <path d="M 124 118 C 138 120 148 130 150 142 C 151 147 146 148 145 144 C 142 134 134 128 122 128 Z" fill="url(#mm-flesh)" stroke="#2a1410" stroke-width="1"/>
    <g fill="#e8d8c0"><path d="M 10 86 L 6 82 L 12 84 Z"/><path d="M 14 83 L 13 77 L 16 82 Z"/><path d="M 149 143 L 154 146 L 148 146 Z"/></g>
    
    <!-- chest body -->
    <path d="M 34 96 L 126 96 L 124 146 L 36 146 Z" fill="url(#mm-wood)" stroke="#1a0e04" stroke-width="1.4"/>
    <g stroke="#2a1808" stroke-width="0.7" fill="none" opacity="0.8">
    <path d="M 36 108 Q 60 106 80 109 Q 100 112 124 108"/><path d="M 36 122 Q 58 124 80 121 Q 102 118 124 122"/>
    <path d="M 36 136 Q 62 134 80 137 Q 104 139 124 136"/>
    </g>
    <g stroke="#b88a5a" stroke-width="0.5" fill="none" opacity="0.4"><path d="M 40 114 Q 70 112 100 115"/><path d="M 44 130 Q 70 128 110 131"/></g>
    <!-- iron bands and corners -->
    <path d="M 48 96 L 56 96 L 56 146 L 48 146 Z M 104 96 L 112 96 L 112 146 L 104 146 Z" fill="url(#mm-iron)" stroke="#121416" stroke-width="0.7"/>
    <g fill="#d8dce0"><circle cx="52" cy="102" r="0.9"/><circle cx="52" cy="140" r="0.9"/><circle cx="108" cy="102" r="0.9"/><circle cx="108" cy="140" r="0.9"/></g>
    <path d="M 34 140 L 42 140 L 42 146 L 34 146 Z M 118 140 L 126 140 L 126 146 L 118 146 Z" fill="url(#mm-iron)"/>
    <!-- stubby clawed feet -->
    <g fill="#2a1a0a" stroke="#0a0602" stroke-width="0.6">
    <path d="M 38 146 L 34 152 L 46 152 L 44 146 Z"/><path d="M 116 146 L 114 152 L 126 152 L 122 146 Z"/>
    </g>
    
    <!-- the open maw between body and lid -->
    <path d="M 34 96 C 36 82 50 70 80 68 C 110 70 124 82 126 96 Z" fill="url(#mm-maw)" stroke="#1a0206" stroke-width="1"/>
    <!-- lower teeth along the chest rim -->
    <g fill="#f4ecd4" stroke="#7a6a4a" stroke-width="0.35">
    <path d="M 38 96 L 41 86 L 44 96 Z"/><path d="M 46 96 L 49 84 L 52 96 Z"/><path d="M 54 96 L 57 83 L 60 96 Z"/>
    <path d="M 62 96 L 65 82 L 68 96 Z"/><path d="M 70 96 L 73 81 L 76 96 Z"/><path d="M 84 96 L 87 81 L 90 96 Z"/>
    <path d="M 92 96 L 95 82 L 98 96 Z"/><path d="M 100 96 L 103 83 L 106 96 Z"/><path d="M 108 96 L 111 84 L 114 96 Z"/>
    <path d="M 116 96 L 119 86 L 122 96 Z"/>
    </g>
    <!-- tongue lolling out over the front -->
    <path d="M 72 90 C 70 104 76 118 72 132 C 70 140 78 144 82 138 C 86 128 84 110 90 92 Z" fill="url(#mm-tongue)" stroke="#4a0a14" stroke-width="0.9"/>
    <path d="M 80 94 C 78 108 81 122 78 134" stroke="#5a0a1a" stroke-width="0.8" fill="none"/>
    <path d="M 75 96 C 74 106 77 114 75 122" stroke="#ffa0a8" stroke-width="0.7" fill="none" opacity="0.5"/>
    
    <!-- lid, thrown back like an upper jaw -->
    <path d="M 30 72 C 30 46 54 32 80 30 C 106 32 130 46 130 72 C 112 64 48 64 30 72 Z" fill="url(#mm-lid)" stroke="#1a0e04" stroke-width="1.4"/>
    <path d="M 30 72 C 48 64 112 64 130 72 L 128 78 C 110 70 50 70 32 78 Z" fill="url(#mm-iron)" stroke="#121416" stroke-width="0.7"/>
    <path d="M 50 38 L 56 36 L 58 70 L 50 72 Z M 104 36 L 110 38 L 110 72 L 102 70 Z" fill="url(#mm-iron)" stroke="#121416" stroke-width="0.6"/>
    <g stroke="#2a1808" stroke-width="0.6" fill="none" opacity="0.7"><path d="M 36 56 Q 80 44 124 56"/><path d="M 40 46 Q 80 36 120 46"/></g>
    <!-- upper fangs hanging from the lid -->
    <g fill="#f4ecd4" stroke="#7a6a4a" stroke-width="0.35">
    <path d="M 36 77 L 39 88 L 42 77 Z"/><path d="M 45 75 L 48 88 L 51 75 Z"/><path d="M 54 74 L 57 90 L 60 74 Z"/>
    <path d="M 63 73 L 66 88 L 69 73 Z"/><path d="M 91 73 L 94 88 L 97 73 Z"/><path d="M 100 74 L 103 90 L 106 74 Z"/>
    <path d="M 109 75 L 112 88 L 115 75 Z"/><path d="M 118 77 L 121 88 L 124 77 Z"/>
    </g>
    <!-- eyes opening in the lid's wood -->
    <path d="M 62 50 Q 68 44 74 50 Q 68 54 62 50 Z" fill="#1a0a02"/>
    <path d="M 86 50 Q 92 44 98 50 Q 92 54 86 50 Z" fill="#1a0a02"/>
    <ellipse cx="68" cy="50" rx="3.4" ry="2" fill="#ffb020" filter="url(#mm-glow)"/>
    <ellipse cx="92" cy="50" rx="3.4" ry="2" fill="#ffb020" filter="url(#mm-glow)"/>
    <ellipse cx="68" cy="50" rx="2.4" ry="1.5" fill="#ffe070"/><ellipse cx="92" cy="50" rx="2.4" ry="1.5" fill="#ffe070"/>
    <ellipse cx="68.3" cy="50" rx="0.5" ry="1.4" fill="#1a0a02"/><ellipse cx="92.3" cy="50" rx="0.5" ry="1.4" fill="#1a0a02"/>
    
    <!-- bait: gold spilling from the maw -->
    <g fill="url(#mm-gold)" stroke="#6a4a04" stroke-width="0.4">
    <ellipse cx="54" cy="150" rx="4" ry="1.6"/><ellipse cx="62" cy="152" rx="3.6" ry="1.4"/><ellipse cx="100" cy="151" rx="3.8" ry="1.5"/>
    <circle cx="95" cy="92" r="2.2"/><circle cx="64" cy="92" r="2"/>
    </g>
    <path d="M 44 42 Q 70 32 96 34" stroke="#d8a870" stroke-width="0.9" fill="none" opacity="0.4"/>
    </svg>
  `,

  'Giant': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Giant">
    <defs>
    <radialGradient id="gi-skin" cx="45%" cy="25%" r="85%">
    <stop offset="0" stop-color="#b09474"/>
    <stop offset="0.45" stop-color="#6e5640"/>
    <stop offset="1" stop-color="#1e140c"/>
    </radialGradient>
    <radialGradient id="gi-face" cx="45%" cy="35%" r="70%">
    <stop offset="0" stop-color="#b8987a"/>
    <stop offset="0.6" stop-color="#6a5240"/>
    <stop offset="1" stop-color="#2a1c12"/>
    </radialGradient>
    <linearGradient id="gi-hide" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#1e140a"/>
    <stop offset="0.5" stop-color="#4e3820"/>
    <stop offset="1" stop-color="#1a1008"/>
    </linearGradient>
    <linearGradient id="gi-club" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#2a1a0c"/>
    <stop offset="0.5" stop-color="#6a4a2a"/>
    <stop offset="1" stop-color="#241408"/>
    </linearGradient>
    <linearGradient id="gi-iron" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#9a9ea6"/>
    <stop offset="1" stop-color="#2a2c30"/>
    </linearGradient>
    <radialGradient id="gi-bone" cx="40%" cy="35%" r="70%">
    <stop offset="0" stop-color="#f0e6cc"/>
    <stop offset="1" stop-color="#8a7a5a"/>
    </radialGradient>
    <linearGradient id="gi-fang" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#e8dcb4"/>
    <stop offset="1" stop-color="#8a7440"/>
    </linearGradient>
    <!-- darkness pooling below, so it looms out of the corridor -->
    <radialGradient id="gi-shade" cx="50%" cy="50%" r="50%">
    <stop offset="0" stop-color="#000" stop-opacity="0.75"/>
    <stop offset="1" stop-color="#000" stop-opacity="0"/>
    </radialGradient>
    <filter id="gi-glow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="1.6"/></filter>
    <filter id="gi-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.2"/></filter>
    <linearGradient id="gi-fadegrad" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0.8" stop-color="#fff"/>
    <stop offset="1" stop-color="#000"/>
    </linearGradient>
    <mask id="gi-fade" maskUnits="userSpaceOnUse" x="0" y="0" width="160" height="160">
    <rect x="0" y="0" width="160" height="160" fill="url(#gi-fadegrad)"/>
    </mask>
    </defs>
    
    <g mask="url(#gi-fade)">
    
    <!-- spiked tree-trunk club, raised overhead behind the head -->
    <path d="M 152 74 L 44 2 L 37 12 L 145 84 Z" fill="url(#gi-club)" stroke="#120a04" stroke-width="1.2"/>
    <path d="M 50 -4 C 38 -8 24 4 28 16 C 32 24 44 22 52 14 C 58 8 58 -2 50 -4 Z" fill="url(#gi-club)" stroke="#120a04" stroke-width="1.2"/>
    <g fill="url(#gi-iron)" stroke="#121416" stroke-width="0.5">
    <path d="M 30 6 L 20 2 L 29 11 Z"/><path d="M 36 20 L 30 28 L 40 21 Z"/><path d="M 52 16 L 58 24 L 50 20 Z"/>
    <path d="M 46 -2 L 48 -8 L 52 0 Z"/><path d="M 58 6 L 66 4 L 58 10 Z"/><path d="M 62 26 L 58 34 L 66 28 Z"/>
    </g>
    <path d="M 146 76 L 46 8" stroke="#8a6a44" stroke-width="0.8" opacity="0.5"/>
    <g stroke="#140a04" stroke-width="0.8" fill="none" opacity="0.7"><path d="M 70 30 L 76 34"/><path d="M 92 48 L 98 52"/></g>
    
    <!-- massive shoulders and torso, cut off by the bottom edge -->
    <path d="M 4 160 C 2 120 6 88 26 74 C 44 64 62 62 80 62 C 98 62 116 64 134 74 C 154 88 158 120 156 160 Z" fill="url(#gi-skin)" stroke="#140c06" stroke-width="1.6"/>
    <!-- muscle definition -->
    <g stroke="#1e140c" stroke-width="1.2" fill="none" opacity="0.75" stroke-linecap="round">
    <path d="M 50 88 Q 64 100 80 94 Q 96 100 110 88"/>
    <path d="M 80 94 L 80 132"/>
    <path d="M 66 112 Q 72 116 78 114 M 94 112 Q 88 116 82 114"/>
    <path d="M 66 128 Q 72 132 78 130 M 94 128 Q 88 132 82 130"/>
    <path d="M 30 84 Q 38 96 36 112"/><path d="M 130 84 Q 122 96 124 112"/>
    </g>
    <g stroke="#d0b090" stroke-width="0.9" fill="none" opacity="0.35">
    <path d="M 52 86 Q 64 96 78 91"/><path d="M 28 80 Q 36 92 34 106"/>
    </g>
    <!-- scars -->
    <g stroke="#3a2418" stroke-width="1" fill="none">
    <path d="M 96 100 L 112 118"/><path d="M 98 104 L 101 101 M 103 109 L 106 106 M 108 114 L 111 111"/>
    <path d="M 40 118 L 52 108"/>
    </g>
    <!-- war paint streaks -->
    <g fill="#8a1a10" opacity="0.7">
    <path d="M 58 102 L 62 98 L 64 118 L 60 120 Z"/><path d="M 100 76 L 104 74 L 106 92 L 102 94 Z"/>
    </g>
    
    <!-- hide kilt and belt at the bottom edge -->
    <path d="M 26 148 Q 80 140 134 148 L 136 160 L 24 160 Z" fill="url(#gi-hide)" stroke="#0a0602" stroke-width="1"/>
    <path d="M 26 148 Q 80 140 134 148" stroke="#6a4a2a" stroke-width="3" fill="none"/>
    <circle cx="80" cy="146" r="5" fill="url(#gi-bone)" stroke="#3a2a14" stroke-width="0.6"/>
    <circle cx="78.2" cy="145.3" r="1.2" fill="#140a04"/><circle cx="81.8" cy="145.3" r="1.2" fill="#140a04"/>
    
    <!-- necklace of skulls -->
    <path d="M 50 74 Q 80 96 110 74" stroke="#4a3620" stroke-width="1.2" fill="none"/>
    <g>
    <g fill="url(#gi-bone)" stroke="#3a2a14" stroke-width="0.5">
    <path d="M 60 82 C 58 76 68 74 69 80 C 70 84 67 86 66 88 L 62 88 C 61 86 59 85 60 82 Z"/>
    <path d="M 75 88 C 73 81 86 81 85 88 C 85 92 82 94 82 96 L 78 96 C 77 94 75 92 75 88 Z"/>
    <path d="M 91 80 C 92 74 102 76 100 82 C 101 85 99 86 98 88 L 94 88 C 93 86 90 84 91 80 Z"/>
    </g>
    <g fill="#140a04">
    <circle cx="62.6" cy="81" r="1.1"/><circle cx="66.4" cy="81" r="1.1"/>
    <circle cx="78" cy="87.5" r="1.3"/><circle cx="82" cy="87.5" r="1.3"/>
    <circle cx="93.6" cy="81" r="1.1"/><circle cx="97.4" cy="81" r="1.1"/>
    </g>
    <g stroke="#140a04" stroke-width="0.4"><path d="M 62.5 86.5 L 65.5 86.5"/><path d="M 78 94 L 82 94"/><path d="M 94.5 86.5 L 97.5 86.5"/></g>
    </g>
    
    <!-- left arm hanging, a fist bigger than a man's head, dragging a chain -->
    <path d="M 26 76 C 12 90 6 112 8 132 L 26 134 C 24 116 28 100 38 90 Z" fill="url(#gi-skin)" stroke="#140c06" stroke-width="1.4"/>
    <path d="M 2 132 C 2 124 12 120 22 122 C 32 124 34 134 32 142 C 30 150 20 154 12 152 C 4 150 2 140 2 132 Z" fill="#6e5640" stroke="#140c06" stroke-width="1.3"/>
    <g stroke="#140c06" stroke-width="0.9" fill="none"><path d="M 6 134 Q 16 138 30 134"/><path d="M 8 142 Q 17 145 29 142"/></g>
    <g fill="none" stroke="url(#gi-iron)" stroke-width="2.2">
    <ellipse cx="22" cy="152" rx="3" ry="4.5"/><ellipse cx="26" cy="158" rx="4.5" ry="3"/><ellipse cx="32" cy="162" rx="3" ry="4.5"/>
    </g>
    
    <!-- right arm raised, gripping the club -->
    <path d="M 134 76 C 146 70 150 60 146 48 L 132 50 C 134 58 130 64 122 68 Z" fill="url(#gi-skin)" stroke="#140c06" stroke-width="1.4"/>
    <path d="M 124 66 C 122 56 130 48 140 48 C 148 50 150 60 146 68 C 142 76 130 78 124 66 Z" fill="#7a624a" stroke="#140c06" stroke-width="1.2"/>
    <g stroke="#140c06" stroke-width="0.8" fill="none"><path d="M 128 56 Q 136 60 146 56"/><path d="M 126 62 Q 136 66 146 62"/></g>
    
    <!-- head: heavy brow, burning eyes, broken underbite -->
    <path d="M 56 30 C 58 14 70 6 80 6 C 92 6 102 14 104 30 C 100 22 92 18 80 18 C 68 18 60 22 56 30 Z" fill="#1a120a"/>
    <g stroke="#1a120a" stroke-width="1.4" fill="none" stroke-linecap="round">
    <path d="M 58 30 Q 52 44 54 58"/><path d="M 102 30 Q 108 44 106 58"/><path d="M 60 26 Q 54 36 56 46"/>
    </g>
    <path d="M 57 38 L 50 34 L 52 46 L 58 48 Z" fill="url(#gi-face)" stroke="#140c06" stroke-width="0.8"/>
    <path d="M 103 38 L 110 34 L 108 46 L 102 48 Z" fill="url(#gi-face)" stroke="#140c06" stroke-width="0.8"/>
    <path d="M 108 38 L 111 36" stroke="#140c06" stroke-width="1.2"/>
    <path d="M 58 38 C 56 22 68 14 80 14 C 92 14 104 22 102 38 C 104 52 98 66 80 70 C 62 66 56 52 58 38 Z" fill="url(#gi-face)" stroke="#140c06" stroke-width="1.4"/>
    <!-- brow ridge casting the eyes into shadow -->
    <path d="M 60 34 Q 70 28 79 35 Q 70 34 61 39 Z" fill="#1e140c"/>
    <path d="M 100 34 Q 90 28 81 35 Q 90 34 99 39 Z" fill="#1e140c"/>
    <path d="M 61 36 Q 80 40 99 36 L 98 42 Q 80 44 62 42 Z" fill="#000" opacity="0.45"/>
    <ellipse cx="70" cy="40" rx="4.4" ry="2.4" fill="#ff2a10" filter="url(#gi-glow)"/>
    <ellipse cx="90" cy="40" rx="4.4" ry="2.4" fill="#ff2a10" filter="url(#gi-glow)"/>
    <ellipse cx="70" cy="40" rx="2.6" ry="1.4" fill="#ffb060"/>
    <ellipse cx="90" cy="40" rx="2.6" ry="1.4" fill="#ffb060"/>
    <circle cx="70" cy="40" r="0.7" fill="#2a0402"/><circle cx="90" cy="40" r="0.7" fill="#2a0402"/>
    <!-- scar through one eye, war paint -->
    <path d="M 86 28 L 94 50" stroke="#3a2418" stroke-width="1.1"/>
    <path d="M 62 44 L 76 46 L 76 49 L 63 47 Z" fill="#8a1a10" opacity="0.75"/>
    <!-- broad flattened nose -->
    <path d="M 77 42 C 75 50 72 53 74 56 C 77 57 83 57 86 56 C 88 53 85 50 83 42 Z" fill="#6a5240" stroke="#140c06" stroke-width="0.8"/>
    <circle cx="76.5" cy="54.5" r="1" fill="#140c06"/><circle cx="83.5" cy="54.5" r="1" fill="#140c06"/>
    <!-- snarl: dark maw, broken teeth, tusks jutting from the underbite -->
    <path d="M 66 60 Q 80 56 94 60 Q 92 68 80 68 Q 68 68 66 60 Z" fill="#1a0604" stroke="#140c06" stroke-width="0.9"/>
    <g fill="url(#gi-fang)" stroke="#5a4a20" stroke-width="0.35">
    <path d="M 70 59.4 L 72 63 L 74 58.6 Z"/><path d="M 76 58.2 L 77.5 61.5 L 79 58 Z"/><path d="M 84 58.4 L 85.6 62.4 L 87 58.8 Z"/>
    <path d="M 89 59.3 L 90.5 61.8 L 92 59.8 Z"/>
    </g>
    <path d="M 68 64 L 66 52 L 72 63 Z" fill="url(#gi-fang)" stroke="#5a4a20" stroke-width="0.5"/>
    <path d="M 92 64 L 94 50 L 88 63 Z" fill="url(#gi-fang)" stroke="#5a4a20" stroke-width="0.5"/>
    <g fill="url(#gi-fang)"><path d="M 75 67 L 76.5 63.5 L 78 67 Z"/><path d="M 82 67 L 83.5 64 L 85 67 Z"/></g>
    <ellipse cx="70" cy="22" rx="8" ry="3" transform="rotate(-12 70 22)" fill="#fff" opacity="0.1" filter="url(#gi-soft)"/>
    
    <ellipse cx="80" cy="170" rx="96" ry="54" fill="url(#gi-shade)"/>
    </g>
    </svg>
  `,

  'Basilisk': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Basilisk">
    <defs>
    <linearGradient id="bs-hide" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#9aa84a"/>
    <stop offset="0.5" stop-color="#5a6a22"/>
    <stop offset="1" stop-color="#1e260a"/>
    </linearGradient>
    <linearGradient id="bs-belly" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#d8d088"/>
    <stop offset="1" stop-color="#8a8040"/>
    </linearGradient>
    <linearGradient id="bs-spike" x1="0" y1="1" x2="0" y2="0">
    <stop offset="0" stop-color="#2a3010"/>
    <stop offset="1" stop-color="#b8b870"/>
    </linearGradient>
    <radialGradient id="bs-stone" cx="40%" cy="35%" r="70%">
    <stop offset="0" stop-color="#b8b4ac"/>
    <stop offset="1" stop-color="#4a4844"/>
    </radialGradient>
    <radialGradient id="bs-gaze" cx="0%" cy="50%" r="100%">
    <stop offset="0" stop-color="#d0ff80" stop-opacity="0.7"/>
    <stop offset="1" stop-color="#60ff40" stop-opacity="0"/>
    </radialGradient>
    <pattern id="bs-scales" width="4" height="3.4" patternUnits="userSpaceOnUse">
    <path d="M 0 3.4 Q 2 0.6 4 3.4" stroke="#141a04" stroke-width="0.5" fill="none" opacity="0.6"/>
    </pattern>
    <filter id="bs-glow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="1.6"/></filter>
    <filter id="bs-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1"/></filter>
    <path id="bs-body" d="M 30 116 C 36 100 60 94 84 96 C 104 97 118 92 128 86 L 136 100 C 124 112 104 120 84 122 C 60 124 40 126 30 116 Z"/>
    </defs>
    
    <ellipse cx="80" cy="146" rx="62" ry="5" fill="#000" opacity="0.55" filter="url(#bs-soft)"/>
    
    <!-- a petrified victim's hand, crumbling -->
    <g transform="translate(118 128)">
    <path d="M 0 16 L 2 4 L 5 0 L 7 5 L 9 -1 L 11 5 L 13 1 L 14 8 L 17 5 L 16 16 Z" fill="url(#bs-stone)" stroke="#2a2826" stroke-width="0.8"/>
    <path d="M 4 10 L 8 12 M 10 9 L 13 12" stroke="#2a2826" stroke-width="0.5"/>
    </g>
    <g fill="url(#bs-stone)" stroke="#2a2826" stroke-width="0.4"><circle cx="112" cy="144" r="2"/><circle cx="140" cy="145" r="1.6"/></g>
    
    <!-- tail -->
    <path d="M 34 112 C 20 114 10 124 8 138 C 7 144 12 144 13 139 C 16 128 26 122 38 122 Z" fill="url(#bs-hide)" stroke="#0e1204" stroke-width="1"/>
    <path d="M 34 112 C 20 114 10 124 8 138 C 7 144 12 144 13 139 C 16 128 26 122 38 122 Z" fill="url(#bs-scales)"/>
    
    <!-- far legs (four of its eight, in shadow) -->
    <g fill="#2a3410" stroke="#0e1204" stroke-width="0.8">
    <path d="M 44 116 L 38 132 L 46 132 L 50 118 Z"/><path d="M 64 118 L 60 134 L 68 134 L 70 120 Z"/>
    <path d="M 84 118 L 82 134 L 90 134 L 90 120 Z"/><path d="M 104 114 L 106 130 L 113 129 L 110 114 Z"/>
    </g>
    
    <!-- body with a spiny dorsal ridge -->
    <g fill="url(#bs-spike)" stroke="#141a04" stroke-width="0.5">
    <path d="M 40 104 L 42 88 L 48 102 Z"/><path d="M 52 100 L 56 82 L 60 99 Z"/><path d="M 64 97 L 69 78 L 72 97 Z"/>
    <path d="M 77 96 L 82 76 L 85 96 Z"/><path d="M 90 96 L 95 78 L 98 96 Z"/><path d="M 103 95 L 108 80 L 110 94 Z"/>
    <path d="M 114 92 L 119 80 L 120 90 Z"/>
    </g>
    <use href="#bs-body" fill="url(#bs-hide)" stroke="#0e1204" stroke-width="1.3"/>
    <use href="#bs-body" fill="url(#bs-scales)"/>
    <path d="M 40 118 C 60 122 100 120 128 104 L 134 106 C 120 118 100 124 80 124 C 60 125 44 124 40 118 Z" fill="url(#bs-belly)" opacity="0.9"/>
    <path d="M 40 104 C 60 98 100 98 124 90" stroke="#c8d078" stroke-width="0.9" fill="none" opacity="0.4"/>
    
    <!-- near legs, splayed and clawed -->
    <g fill="url(#bs-hide)" stroke="#0e1204" stroke-width="1">
    <path d="M 38 118 C 32 126 28 134 24 140 L 34 141 C 38 134 42 128 46 122 Z"/>
    <path d="M 60 120 C 56 128 54 136 52 142 L 62 142 C 64 136 66 128 68 122 Z"/>
    <path d="M 82 121 C 80 129 80 136 80 142 L 90 142 C 90 136 90 128 90 122 Z"/>
    <path d="M 108 116 C 110 124 114 132 118 138 L 126 134 C 122 128 118 120 116 114 Z"/>
    </g>
    <g fill="#d8d0a0">
    <path d="M 23 140 L 19 144 L 26 142 Z"/><path d="M 28 141 L 26 146 L 31 142 Z"/>
    <path d="M 51 142 L 48 146 L 54 143 Z"/><path d="M 57 142 L 56 147 L 60 143 Z"/>
    <path d="M 79 142 L 77 146 L 82 143 Z"/><path d="M 85 142 L 85 147 L 88 143 Z"/>
    <path d="M 118 137 L 118 142 L 121 137 Z"/><path d="M 123 135 L 126 139 L 126 134 Z"/>
    </g>
    
    <!-- head raised on a short neck, crowned with spines -->
    <path d="M 120 88 C 124 74 132 64 142 62 L 148 76 C 140 80 134 88 130 98 Z" fill="url(#bs-hide)" stroke="#0e1204" stroke-width="1.1"/>
    <path d="M 132 56 C 138 48 150 48 156 54 L 158 62 C 156 68 150 70 144 70 L 136 70 C 130 68 128 62 132 56 Z" fill="url(#bs-hide)" stroke="#0e1204" stroke-width="1.2"/>
    <path d="M 132 56 C 138 48 150 48 156 54 L 158 62 C 156 68 150 70 144 70 L 136 70 C 130 68 128 62 132 56 Z" fill="url(#bs-scales)"/>
    <g fill="url(#bs-spike)" stroke="#141a04" stroke-width="0.4">
    <path d="M 136 52 L 132 40 L 140 50 Z"/><path d="M 142 49 L 142 36 L 146 49 Z"/><path d="M 148 49 L 152 38 L 151 50 Z"/>
    <path d="M 132 58 L 124 52 L 132 54 Z"/>
    </g>
    <path d="M 144 66 L 158 64" stroke="#0e1204" stroke-width="0.8"/>
    <g fill="#f0ecd0"><path d="M 148 65.5 L 149 68 L 150 65.2 Z"/><path d="M 153 64.8 L 154 67 L 155 64.6 Z"/></g>
    <!-- the petrifying gaze -->
    <path d="M 150 56 L 160 44 L 160 72 Z" fill="url(#bs-gaze)"/>
    <ellipse cx="148" cy="57" rx="4.6" ry="3" fill="#a0ff50" filter="url(#bs-glow)"/>
    <ellipse cx="148" cy="57" rx="3.2" ry="2.2" fill="#e8ffb0"/>
    <ellipse cx="148.4" cy="57" rx="0.7" ry="1.9" fill="#0a1a02"/>
    <path d="M 142 53 Q 148 50 154 54 L 152 55 Q 148 53 144 55 Z" fill="#1e260a"/>
    </svg>
  `,

  'Wight': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Wight">
    <defs>
    <radialGradient id="wt-skin" cx="40%" cy="30%" r="80%">
    <stop offset="0" stop-color="#b8bcc4"/>
    <stop offset="0.5" stop-color="#6a707a"/>
    <stop offset="1" stop-color="#22262e"/>
    </radialGradient>
    <linearGradient id="wt-cloak" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#0e1014"/>
    <stop offset="0.5" stop-color="#2e323a"/>
    <stop offset="1" stop-color="#0a0c10"/>
    </linearGradient>
    <pattern id="wt-mail" width="3" height="3" patternUnits="userSpaceOnUse">
    <circle cx="1.5" cy="1.5" r="1.1" fill="none" stroke="#8a7a6a" stroke-width="0.45" opacity="0.7"/>
    </pattern>
    <linearGradient id="wt-rust" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#b8aca0"/>
    <stop offset="1" stop-color="#3a2e24"/>
    </linearGradient>
    <linearGradient id="wt-gold" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#d8c080"/>
    <stop offset="1" stop-color="#6a5020"/>
    </linearGradient>
    <radialGradient id="wt-mist" cx="50%" cy="50%" r="50%">
    <stop offset="0" stop-color="#a0b8d0" stop-opacity="0.35"/>
    <stop offset="1" stop-color="#6080a0" stop-opacity="0"/>
    </radialGradient>
    <filter id="wt-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="1.6"/></filter>
    <filter id="wt-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.2"/></filter>
    </defs>
    
    <!-- grave mist curling around its feet -->
    <ellipse cx="80" cy="146" rx="74" ry="16" fill="url(#wt-mist)"/>
    
    <!-- tattered cloak billowing behind -->
    <path d="M 54 50 C 40 80 30 114 22 152 L 34 146 L 40 154 L 50 146 L 58 154 L 66 146 L 80 150 L 94 146 L 102 154 L 110 146 L 120 154 L 126 146 L 138 152 C 130 114 120 80 106 50 Z" fill="url(#wt-cloak)" stroke="#040608" stroke-width="1.2"/>
    <g stroke="#40444c" stroke-width="0.7" fill="none" opacity="0.6"><path d="M 46 80 Q 40 110 34 142"/><path d="M 114 80 Q 120 110 126 142"/></g>
    
    <!-- gaunt body in rusted barrow mail -->
    <path d="M 62 56 C 58 76 60 100 64 118 L 96 118 C 100 100 102 76 98 56 Z" fill="#3a3430"/>
    <path d="M 62 56 C 58 76 60 100 64 118 L 96 118 C 100 100 102 76 98 56 Z" fill="url(#wt-mail)"/>
    <path d="M 62 104 Q 80 110 98 104 L 98 110 Q 80 116 62 110 Z" fill="#2a1e14" stroke="#0a0604" stroke-width="0.6"/>
    <circle cx="80" cy="108" r="3" fill="url(#wt-gold)"/>
    <!-- legs, withered -->
    <path d="M 66 118 L 64 146 L 72 146 L 76 118 Z M 84 118 L 88 146 L 96 146 L 94 118 Z" fill="url(#wt-skin)" stroke="#12141a" stroke-width="0.9"/>
    <path d="M 62 116 L 98 116 L 100 132 L 60 132 Z" fill="#2a2420" stroke="#0a0604" stroke-width="0.6"/>
    <path d="M 60 132 L 64 128 L 68 134 L 72 128 L 76 134 L 80 128 L 84 134 L 88 128 L 92 134 L 96 128 L 100 132 Z" fill="#2a2420"/>
    
    <!-- rusted ancient longsword in the off hand, point down -->
    <path d="M 40 70 L 44 70 L 45 132 L 42 138 L 39 132 Z" fill="url(#wt-rust)" stroke="#1a140e" stroke-width="0.6"/>
    <path d="M 34 68 L 50 68 L 50 71 L 34 71 Z" fill="url(#wt-gold)"/>
    <path d="M 41 58 L 43 58 L 43 68 L 41 68 Z" fill="#2a1a10"/>
    <circle cx="42" cy="57" r="2.2" fill="url(#wt-gold)"/>
    <path d="M 58 60 C 50 64 46 66 44 64 L 42 70 C 48 74 56 72 62 68 Z" fill="url(#wt-skin)" stroke="#12141a" stroke-width="0.8"/>
    
    <!-- clawed hand reaching out, frost glow at the fingertips -->
    <path d="M 98 60 C 110 62 118 58 124 52 L 128 58 C 120 66 110 70 98 70 Z" fill="url(#wt-skin)" stroke="#12141a" stroke-width="0.9"/>
    <path d="M 106 60 L 110 64 L 106 68" stroke="#12141a" stroke-width="0.6" fill="none"/>
    <circle cx="136" cy="46" r="10" fill="#80b8ff" opacity="0.25" filter="url(#wt-glow)"/>
    <g stroke="url(#wt-skin)" stroke-width="1.8" fill="none" stroke-linecap="round">
    <path d="M 126 54 Q 130 46 132 40"/><path d="M 128 56 Q 134 50 140 46"/><path d="M 128 58 Q 136 56 142 54"/><path d="M 124 52 Q 124 46 126 40"/>
    </g>
    <g fill="#1a1c22"><path d="M 131 40 L 133 36 L 133 41 Z"/><path d="M 139 46 L 143 44 L 140 47.5 Z"/><path d="M 141 54 L 145 54 L 141 55.5 Z"/><path d="M 125 40 L 126 36 L 127 40.5 Z"/></g>
    
    <!-- mantle and hood -->
    <path d="M 52 58 Q 60 46 80 46 Q 100 46 108 58 Q 96 64 80 64 Q 64 64 52 58 Z" fill="url(#wt-cloak)" stroke="#040608" stroke-width="1"/>
    <path d="M 62 44 C 60 26 70 16 80 16 C 90 16 100 26 98 44 C 94 54 88 58 80 58 C 72 58 66 54 62 44 Z" fill="url(#wt-cloak)" stroke="#040608" stroke-width="1"/>
    <!-- sunken grey face inside the hood -->
    <path d="M 68 38 C 68 28 74 24 80 24 C 86 24 92 28 92 38 C 92 46 87 54 80 54 C 73 54 68 46 68 38 Z" fill="url(#wt-skin)" stroke="#12141a" stroke-width="0.8"/>
    <path d="M 68 34 C 72 30 88 30 92 34 L 92 30 C 86 26 74 26 68 30 Z" fill="#000" opacity="0.5"/>
    <!-- a barrow-king's tarnished circlet -->
    <path d="M 68 30 Q 80 26 92 30 L 92 33 Q 80 29 68 33 Z" fill="url(#wt-gold)"/>
    <path d="M 79 27 L 80 24 L 81 27 Z" fill="url(#wt-gold)"/>
    <circle cx="80" cy="29.5" r="1" fill="#6ac0ff"/>
    <!-- hollow eyes burning cold -->
    <ellipse cx="74.5" cy="38" rx="3.4" ry="2.4" fill="#06080c"/>
    <ellipse cx="85.5" cy="38" rx="3.4" ry="2.4" fill="#06080c"/>
    <circle cx="74.5" cy="38" r="2" fill="#80c8ff" filter="url(#wt-glow)"/>
    <circle cx="85.5" cy="38" r="2" fill="#80c8ff" filter="url(#wt-glow)"/>
    <circle cx="74.5" cy="38" r="0.8" fill="#fff"/><circle cx="85.5" cy="38" r="0.8" fill="#fff"/>
    <path d="M 79 41 L 78 45 L 81 45 Z" fill="#12141a"/>
    <!-- shrunken lips over long teeth -->
    <path d="M 74 48 Q 80 51 86 48 L 85 50 Q 80 53 75 50 Z" fill="#12141a"/>
    <g stroke="#d8d0b8" stroke-width="0.6"><path d="M 77 48.8 L 77 50.8"/><path d="M 80 49.4 L 80 51.6"/><path d="M 83 48.8 L 83 50.8"/></g>
    <g stroke="#40444c" stroke-width="0.6" fill="none"><path d="M 70 44 Q 72 48 74 50"/><path d="M 90 44 Q 88 48 86 50"/></g>
    </svg>
  `,

  'Black Dragon': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Black Dragon">
    <defs>
    <radialGradient id="bkd-body" cx="40%" cy="30%" r="80%">
    <stop offset="0" stop-color="#5a6a58"/><stop offset="0.45" stop-color="#1e2620"/><stop offset="1" stop-color="#040605"/>
    </radialGradient>
    <linearGradient id="bkd-membrane" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#2e3a2c"/><stop offset="0.6" stop-color="#141a14"/><stop offset="1" stop-color="#040504"/>
    </linearGradient>
    <linearGradient id="bkd-belly" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#3a4030"/><stop offset="0.5" stop-color="#8a8a60"/><stop offset="1" stop-color="#3a4030"/>
    </linearGradient>
    <linearGradient id="bkd-horn" x1="1" y1="1" x2="0" y2="0">
    <stop offset="0" stop-color="#1e1e10"/><stop offset="0.5" stop-color="#8a8a60"/><stop offset="1" stop-color="#e0e0b8"/>
    </linearGradient>
    <radialGradient id="bkd-breath" cx="0%" cy="0%" r="120%">
    <stop offset="0" stop-color="#f0ffc0"/><stop offset="0.25" stop-color="#b8ff40"/>
    <stop offset="0.6" stop-color="#6ac020"/><stop offset="1" stop-color="#2a6a0a" stop-opacity="0.2"/>
    </radialGradient>
    <pattern id="bkd-scales" width="5" height="4" patternUnits="userSpaceOnUse">
    <path d="M 0 4 Q 2.5 0.6 5 4" stroke="#000000" stroke-width="0.55" fill="none" opacity="0.6"/>
    </pattern>
    <filter id="bkd-glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2.2"/></filter>
    <filter id="bkd-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1"/></filter>
    <path id="bkd-torso" d="M 64 76 C 54 92 54 116 64 128 C 76 139 96 137 104 124 C 112 108 108 86 98 72 Z"/>
    <path id="bkd-neck" d="M 78 80 C 76 62 88 48 104 40 L 114 50 C 102 56 95 68 95 82 Z"/>
    <path id="bkd-tail" d="M 60 118 C 38 124 20 138 26 150 C 32 158 50 154 46 146 C 42 151 33 149 34 143 C 38 133 52 131 66 131 Z"/>
    <path id="bkd-skull" d="M 102 40 C 106 30 120 27 130 32 L 148 38 C 152 40 152 44 148 45.5 L 128 47 C 120 48 110 50 104 53 Z"/>
    </defs>
    
    <ellipse cx="80" cy="152" rx="56" ry="5" fill="#000" opacity="0.55" filter="url(#bkd-soft)"/>
    
    <!-- far wing -->
    <path d="M 66 72 L 46 36 L 10 22 Q 22 38 4 54 Q 20 64 18 82 Q 38 80 60 94 Z" fill="url(#bkd-membrane)" stroke="#000000" stroke-width="1.2"/>
    <g stroke="#000000" stroke-linecap="round" fill="none">
    <path d="M 66 72 L 46 36" stroke-width="3.6"/><path d="M 46 36 L 10 22" stroke-width="2"/>
    <path d="M 46 36 L 4 54" stroke-width="1.8"/><path d="M 46 36 L 18 82" stroke-width="1.8"/>
    </g>
    <g stroke="#a8ff40" stroke-linecap="round" fill="none" stroke-width="0.7" opacity="0.55">
    <path d="M 65 70 L 46 35"/><path d="M 45 35 L 11 21.5"/>
    </g>
    <g stroke="#000000" stroke-width="0.5" fill="none" opacity="0.5">
    <path d="M 40 40 Q 30 44 24 38"/><path d="M 36 50 Q 26 56 18 54"/><path d="M 40 58 Q 34 68 26 70"/>
    </g>
    <path d="M 46 36 L 43 27 L 48.5 34 Z" fill="url(#bkd-horn)"/>
    
    <!-- near wing -->
    <path d="M 94 70 L 112 22 L 146 4 Q 144 20 158 28 Q 146 40 152 54 Q 128 58 106 82 Z" fill="url(#bkd-membrane)" stroke="#000000" stroke-width="1.2"/>
    <g stroke="#000000" stroke-linecap="round" fill="none">
    <path d="M 94 70 L 112 22" stroke-width="3.6"/><path d="M 112 22 L 146 4" stroke-width="2"/>
    <path d="M 112 22 L 158 28" stroke-width="1.8"/><path d="M 112 22 L 152 54" stroke-width="1.8"/>
    </g>
    <g stroke="#a8ff40" stroke-linecap="round" fill="none" stroke-width="0.7" opacity="0.55">
    <path d="M 95 69 L 112.5 22"/><path d="M 113 21.5 L 145.5 4"/>
    </g>
    <path d="M 112 22 L 110 12 L 115 20 Z" fill="url(#bkd-horn)"/>
    
    <!-- tail -->
    <use href="#bkd-tail" fill="url(#bkd-body)" stroke="#000000" stroke-width="1.4"/>
    <use href="#bkd-tail" fill="url(#bkd-scales)"/>
    <path d="M 34 143 L 22 138 L 26 146 L 18 150 L 30 150 Z" fill="#040605" stroke="#000000" stroke-width="0.8"/>
    <g fill="#0a0e0a">
    <path d="M 52 124 L 50 118 L 55 123 Z"/><path d="M 42 128 L 38 123 L 44 127 Z"/><path d="M 33 134 L 28 130 L 35 134 Z"/>
    </g>
    
    <!-- hind legs -->
    <path d="M 56 110 C 48 118 48 132 54 140 L 66 140 C 68 130 70 120 68 112 Z" fill="url(#bkd-body)" stroke="#000000" stroke-width="1.3"/>
    <path d="M 104 110 C 112 118 112 132 108 140 L 94 140 C 92 130 92 120 94 112 Z" fill="url(#bkd-body)" stroke="#000000" stroke-width="1.3"/>
    <g fill="url(#bkd-horn)" stroke="#2a1a0a" stroke-width="0.4">
    <path d="M 52 139 L 48 148 L 55 141 Z"/><path d="M 57 140 L 56 150 L 60 141 Z"/><path d="M 62 140 L 64 149 L 65 140 Z"/>
    <path d="M 96 140 L 95 149 L 99 141 Z"/><path d="M 101 140 L 102 150 L 104 141 Z"/><path d="M 106 139 L 110 148 L 108 140 Z"/>
    </g>
    
    <!-- torso and belly plates -->
    <use href="#bkd-torso" fill="url(#bkd-body)" stroke="#000000" stroke-width="1.6"/>
    <use href="#bkd-torso" fill="url(#bkd-scales)"/>
    <path d="M 72 84 C 67 98 69 116 80 129 C 92 127 98 112 98 97 C 98 87 94 79 90 76 Z" fill="url(#bkd-belly)" stroke="#1a1e12" stroke-width="0.8"/>
    <g stroke="#1a1e12" stroke-width="0.8" fill="none" opacity="0.8">
    <path d="M 72 90 Q 83 93 95 86"/><path d="M 70 97 Q 83 101 97 93"/><path d="M 70 104 Q 83 108 98 100"/>
    <path d="M 71 111 Q 83 115 97 107"/><path d="M 73 118 Q 83 121 95 114"/><path d="M 76 124 Q 83 126 91 121"/>
    </g>
    <path d="M 74 86 C 71 100 72 114 80 126" stroke="#fff" stroke-width="1" fill="none" opacity="0.3"/>
    
    <!-- forelegs -->
    <path d="M 68 94 C 58 98 52 106 54 114 L 61 115 C 61 108 66 104 74 103 Z" fill="url(#bkd-body)" stroke="#000000" stroke-width="1.2"/>
    <path d="M 100 94 C 110 98 116 106 114 114 L 107 115 C 107 108 102 104 95 103 Z" fill="url(#bkd-body)" stroke="#000000" stroke-width="1.2"/>
    <g fill="url(#bkd-horn)" stroke="#2a1a0a" stroke-width="0.4">
    <path d="M 53 113 L 50 120 L 56 115 Z"/><path d="M 57 115 L 56 122 L 60 116 Z"/><path d="M 60.5 115 L 62 121 L 62.5 115 Z"/>
    <path d="M 115 113 L 118 120 L 112 115 Z"/><path d="M 111 115 L 112 122 L 108 116 Z"/><path d="M 107.5 115 L 106 121 L 105.5 115 Z"/>
    </g>
    
    <!-- neck -->
    <use href="#bkd-neck" fill="url(#bkd-body)" stroke="#000000" stroke-width="1.5"/>
    <use href="#bkd-neck" fill="url(#bkd-scales)"/>
    <path d="M 95 81 C 95 68 101 58 112 52" stroke="url(#bkd-belly)" stroke-width="4" fill="none"/>
    <g stroke="#1a1e12" stroke-width="0.6" fill="none">
    <path d="M 93.5 76 L 97.5 77"/><path d="M 94.5 69 L 98.5 71"/><path d="M 97 63 L 100.5 65.5"/><path d="M 101 57.5 L 104 60.5"/>
    </g>
    <g fill="#0a0e0a" stroke="#000000" stroke-width="0.5">
    <path d="M 82 58 L 76 52 L 85 55 Z"/><path d="M 88 50 L 83 42 L 91 47 Z"/><path d="M 95 45 L 92 36 L 98 42 Z"/>
    <path d="M 78 68 L 71 64 L 79 64 Z"/><path d="M 66 80 L 58 78 L 66 76 Z"/><path d="M 60 92 L 52 92 L 59 88 Z"/>
    </g>
    <path d="M 112 50 C 102 56 96 66 95 80" stroke="#a8ff40" stroke-width="1.2" fill="none" opacity="0.5"/>
    
    
    <path d="M 106 37 C 98 24 106 12 120 14 C 128 15 132 20 132 26 C 128 20 120 18 114 22 C 110 26 110 32 111 36 Z" fill="url(#bkd-horn)" stroke="#1a1a0a" stroke-width="0.6"/>
    <path d="M 112 33 C 108 18 118 6 132 8 C 140 10 144 16 142 22 C 138 16 130 14 124 18 C 118 22 116 28 117 33 Z" fill="url(#bkd-horn)" stroke="#1a1a0a" stroke-width="0.6"/>
    <g stroke="#3a3a24" stroke-width="0.5" fill="none" opacity="0.7">
    <path d="M 110 22 L 113 24"/><path d="M 118 15 L 120 18"/><path d="M 128 11 L 129 14"/>
    </g>
    <!-- the flesh drawn tight around the eye and nostril, like a skull -->
    <ellipse cx="122" cy="38.5" rx="6.4" ry="4" fill="#000" opacity="0.7"/>
    <path d="M 140 41 Q 144 40 146 42 L 143 43 Z" fill="#000" opacity="0.8"/>
    
    <!-- head -->
    <use href="#bkd-skull" fill="url(#bkd-body)" stroke="#000000" stroke-width="1.5"/>
    <use href="#bkd-skull" fill="url(#bkd-scales)"/>
    <path d="M 108 50 L 147 45 L 145 57 L 110 55 Z" fill="#0a1a04"/>
    <path d="M 130 48 L 147 45 L 145 57 L 128 55 Z" fill="#9aff30" opacity="0.6" filter="url(#bkd-soft)"/>
    <path d="M 105 54 C 114 54 124 54 130 54 L 146 58 C 148 60 146 62 143 61.5 L 126 61 C 118 62 110 60 104 57 Z" fill="#1e2620" stroke="#000000" stroke-width="1.3"/>
    <g fill="#f4ecd4" stroke="#8a7a5a" stroke-width="0.35">
    <path d="M 118 48.2 L 119.5 52.5 L 121 48 Z"/><path d="M 124 47.6 L 125.5 52.5 L 127 47.3 Z"/>
    <path d="M 130 47 L 131.5 51 L 133 46.8 Z"/><path d="M 136 46.5 L 137.5 51.5 L 139 46.3 Z"/>
    <path d="M 142 46 L 143.2 49.5 L 144.5 45.8 Z"/>
    <path d="M 116 54.5 L 117.5 50.5 L 119 54.5 Z"/><path d="M 122 54.5 L 123.5 50 L 125 54.5 Z"/>
    <path d="M 129 55 L 130.5 51 L 132 55.3 Z"/><path d="M 135 56 L 136.5 52 L 138 56.3 Z"/>
    <path d="M 141 57 L 142.2 53.5 L 143.4 57.3 Z"/>
    </g>
    <g fill="#0a0e0a" stroke="#000000" stroke-width="0.5">
    <path d="M 104 55 L 96 58 L 103 51 Z"/><path d="M 108 58.5 L 101 64 L 106 56 Z"/><path d="M 114 60 L 110 67 L 112 59 Z"/>
    </g>
    <path d="M 112 34 Q 122 29 132 34 L 128 36 Q 121 33 114 37 Z" fill="#0a0e0a"/>
    <ellipse cx="122" cy="38.5" rx="4.6" ry="2.6" fill="#b0ff30" filter="url(#bkd-glow)" opacity="0.85"/>
    <ellipse cx="122" cy="38.5" rx="3.4" ry="1.9" fill="#e8ff90"/>
    <ellipse cx="122.3" cy="38.5" rx="0.7" ry="1.8" fill="#0a0202"/>
    <path d="M 144 39.5 Q 146 38.5 147.5 40" stroke="#000000" stroke-width="1" fill="none"/>
    <g fill="#0a0e0a"><path d="M 110 44 L 104 44 L 109 41 Z"/><path d="M 113 47 L 107 48.5 L 112 44.5 Z"/></g>
    
    
    <path d="M 145 54 C 154 66 158 90 152 120 C 150 130 148 138 146 144" stroke="#8aff20" stroke-width="7" fill="none" opacity="0.45" filter="url(#bkd-glow)" stroke-linecap="round"/>
    <path d="M 145 54 C 154 66 158 90 152 120 C 150 130 148 138 146 144" stroke="#b8ff40" stroke-width="3.6" fill="none" stroke-linecap="round"/>
    <path d="M 146 56 C 153 68 156 90 151 116" stroke="#f0ffc0" stroke-width="1.2" fill="none" opacity="0.8" stroke-linecap="round"/>
    <g fill="#b8ff40">
    <ellipse cx="140" cy="76" rx="1.2" ry="1.8"/><ellipse cx="158" cy="100" rx="1" ry="1.6"/><ellipse cx="143" cy="110" rx="1.1" ry="1.7"/>
    <ellipse cx="156" cy="130" rx="1" ry="1.5"/>
    </g>
    <ellipse cx="144" cy="148" rx="16" ry="4" fill="#8aff20" opacity="0.55" filter="url(#bkd-soft)"/>
    <ellipse cx="144" cy="148" rx="10" ry="2.4" fill="#d0ff70" opacity="0.8"/>
    <g fill="none" stroke="#e0ffa0" stroke-width="0.5"><circle cx="138" cy="146" r="1.2"/><circle cx="150" cy="147" r="1"/><circle cx="144" cy="145" r="0.8"/></g>
    <g stroke="#9aa890" stroke-width="0.9" fill="none" opacity="0.5" stroke-linecap="round">
    <path d="M 136 142 Q 132 136 136 130 Q 140 124 136 118"/><path d="M 152 142 Q 156 136 152 130"/>
    </g>
    <!-- acid drooling from the jaws -->
    <path d="M 120 60 C 120 66 119 70 121 72 C 123 72 123 68 122 61 Z" fill="#b8ff40"/>
    <path d="M 132 60 C 132 64 131 67 133 68 C 135 68 135 65 134 60 Z" fill="#b8ff40"/>
    </svg>
  `,

  'Blue Dragon': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Blue Dragon">
    <defs>
    <radialGradient id="bld-body" cx="40%" cy="30%" r="80%">
    <stop offset="0" stop-color="#7ab8f4"/><stop offset="0.45" stop-color="#2a5aa8"/><stop offset="1" stop-color="#081838"/>
    </radialGradient>
    <linearGradient id="bld-membrane" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#4a80c8"/><stop offset="0.6" stop-color="#1e3a78"/><stop offset="1" stop-color="#0a1838"/>
    </linearGradient>
    <linearGradient id="bld-belly" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#8aa0c0"/><stop offset="0.5" stop-color="#dce8f4"/><stop offset="1" stop-color="#8aa0c0"/>
    </linearGradient>
    <linearGradient id="bld-horn" x1="1" y1="1" x2="0" y2="0">
    <stop offset="0" stop-color="#1e1e24"/><stop offset="0.5" stop-color="#9aa0b0"/><stop offset="1" stop-color="#f4f4fa"/>
    </linearGradient>
    <radialGradient id="bld-breath" cx="0%" cy="0%" r="120%">
    <stop offset="0" stop-color="#ffffff"/><stop offset="0.25" stop-color="#c8f0ff"/>
    <stop offset="0.6" stop-color="#4aa0ff"/><stop offset="1" stop-color="#1a3aa0" stop-opacity="0.2"/>
    </radialGradient>
    <pattern id="bld-scales" width="5" height="4" patternUnits="userSpaceOnUse">
    <path d="M 0 4 Q 2.5 0.6 5 4" stroke="#04102a" stroke-width="0.55" fill="none" opacity="0.6"/>
    </pattern>
    <filter id="bld-glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2.2"/></filter>
    <filter id="bld-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1"/></filter>
    <path id="bld-torso" d="M 64 76 C 54 92 54 116 64 128 C 76 139 96 137 104 124 C 112 108 108 86 98 72 Z"/>
    <path id="bld-neck" d="M 78 80 C 76 62 88 48 104 40 L 114 50 C 102 56 95 68 95 82 Z"/>
    <path id="bld-tail" d="M 60 118 C 38 124 20 138 26 150 C 32 158 50 154 46 146 C 42 151 33 149 34 143 C 38 133 52 131 66 131 Z"/>
    <path id="bld-skull" d="M 102 40 C 106 30 120 27 130 32 L 148 38 C 152 40 152 44 148 45.5 L 128 47 C 120 48 110 50 104 53 Z"/>
    </defs>
    
    <ellipse cx="80" cy="152" rx="56" ry="5" fill="#000" opacity="0.55" filter="url(#bld-soft)"/>
    
    <!-- far wing -->
    <path d="M 66 72 L 46 36 L 10 22 Q 22 38 4 54 Q 20 64 18 82 Q 38 80 60 94 Z" fill="url(#bld-membrane)" stroke="#04102a" stroke-width="1.2"/>
    <g stroke="#04102a" stroke-linecap="round" fill="none">
    <path d="M 66 72 L 46 36" stroke-width="3.6"/><path d="M 46 36 L 10 22" stroke-width="2"/>
    <path d="M 46 36 L 4 54" stroke-width="1.8"/><path d="M 46 36 L 18 82" stroke-width="1.8"/>
    </g>
    <g stroke="#a8e0ff" stroke-linecap="round" fill="none" stroke-width="0.7" opacity="0.55">
    <path d="M 65 70 L 46 35"/><path d="M 45 35 L 11 21.5"/>
    </g>
    <g stroke="#04102a" stroke-width="0.5" fill="none" opacity="0.5">
    <path d="M 40 40 Q 30 44 24 38"/><path d="M 36 50 Q 26 56 18 54"/><path d="M 40 58 Q 34 68 26 70"/>
    </g>
    <path d="M 46 36 L 43 27 L 48.5 34 Z" fill="url(#bld-horn)"/>
    
    <!-- near wing -->
    <path d="M 94 70 L 112 22 L 146 4 Q 144 20 158 28 Q 146 40 152 54 Q 128 58 106 82 Z" fill="url(#bld-membrane)" stroke="#04102a" stroke-width="1.2"/>
    <g stroke="#04102a" stroke-linecap="round" fill="none">
    <path d="M 94 70 L 112 22" stroke-width="3.6"/><path d="M 112 22 L 146 4" stroke-width="2"/>
    <path d="M 112 22 L 158 28" stroke-width="1.8"/><path d="M 112 22 L 152 54" stroke-width="1.8"/>
    </g>
    <g stroke="#a8e0ff" stroke-linecap="round" fill="none" stroke-width="0.7" opacity="0.55">
    <path d="M 95 69 L 112.5 22"/><path d="M 113 21.5 L 145.5 4"/>
    </g>
    <path d="M 112 22 L 110 12 L 115 20 Z" fill="url(#bld-horn)"/>
    
    <!-- tail -->
    <use href="#bld-tail" fill="url(#bld-body)" stroke="#04102a" stroke-width="1.4"/>
    <use href="#bld-tail" fill="url(#bld-scales)"/>
    <path d="M 34 143 L 22 138 L 26 146 L 18 150 L 30 150 Z" fill="#081838" stroke="#04102a" stroke-width="0.8"/>
    <g fill="#0e1e48">
    <path d="M 52 124 L 50 118 L 55 123 Z"/><path d="M 42 128 L 38 123 L 44 127 Z"/><path d="M 33 134 L 28 130 L 35 134 Z"/>
    </g>
    
    <!-- hind legs -->
    <path d="M 56 110 C 48 118 48 132 54 140 L 66 140 C 68 130 70 120 68 112 Z" fill="url(#bld-body)" stroke="#04102a" stroke-width="1.3"/>
    <path d="M 104 110 C 112 118 112 132 108 140 L 94 140 C 92 130 92 120 94 112 Z" fill="url(#bld-body)" stroke="#04102a" stroke-width="1.3"/>
    <g fill="url(#bld-horn)" stroke="#2a1a0a" stroke-width="0.4">
    <path d="M 52 139 L 48 148 L 55 141 Z"/><path d="M 57 140 L 56 150 L 60 141 Z"/><path d="M 62 140 L 64 149 L 65 140 Z"/>
    <path d="M 96 140 L 95 149 L 99 141 Z"/><path d="M 101 140 L 102 150 L 104 141 Z"/><path d="M 106 139 L 110 148 L 108 140 Z"/>
    </g>
    
    <!-- torso and belly plates -->
    <use href="#bld-torso" fill="url(#bld-body)" stroke="#04102a" stroke-width="1.6"/>
    <use href="#bld-torso" fill="url(#bld-scales)"/>
    <path d="M 72 84 C 67 98 69 116 80 129 C 92 127 98 112 98 97 C 98 87 94 79 90 76 Z" fill="url(#bld-belly)" stroke="#3a5070" stroke-width="0.8"/>
    <g stroke="#3a5070" stroke-width="0.8" fill="none" opacity="0.8">
    <path d="M 72 90 Q 83 93 95 86"/><path d="M 70 97 Q 83 101 97 93"/><path d="M 70 104 Q 83 108 98 100"/>
    <path d="M 71 111 Q 83 115 97 107"/><path d="M 73 118 Q 83 121 95 114"/><path d="M 76 124 Q 83 126 91 121"/>
    </g>
    <path d="M 74 86 C 71 100 72 114 80 126" stroke="#fff" stroke-width="1" fill="none" opacity="0.3"/>
    
    <!-- forelegs -->
    <path d="M 68 94 C 58 98 52 106 54 114 L 61 115 C 61 108 66 104 74 103 Z" fill="url(#bld-body)" stroke="#04102a" stroke-width="1.2"/>
    <path d="M 100 94 C 110 98 116 106 114 114 L 107 115 C 107 108 102 104 95 103 Z" fill="url(#bld-body)" stroke="#04102a" stroke-width="1.2"/>
    <g fill="url(#bld-horn)" stroke="#2a1a0a" stroke-width="0.4">
    <path d="M 53 113 L 50 120 L 56 115 Z"/><path d="M 57 115 L 56 122 L 60 116 Z"/><path d="M 60.5 115 L 62 121 L 62.5 115 Z"/>
    <path d="M 115 113 L 118 120 L 112 115 Z"/><path d="M 111 115 L 112 122 L 108 116 Z"/><path d="M 107.5 115 L 106 121 L 105.5 115 Z"/>
    </g>
    
    <!-- neck -->
    <use href="#bld-neck" fill="url(#bld-body)" stroke="#04102a" stroke-width="1.5"/>
    <use href="#bld-neck" fill="url(#bld-scales)"/>
    <path d="M 95 81 C 95 68 101 58 112 52" stroke="url(#bld-belly)" stroke-width="4" fill="none"/>
    <g stroke="#3a5070" stroke-width="0.6" fill="none">
    <path d="M 93.5 76 L 97.5 77"/><path d="M 94.5 69 L 98.5 71"/><path d="M 97 63 L 100.5 65.5"/><path d="M 101 57.5 L 104 60.5"/>
    </g>
    <g fill="#0e1e48" stroke="#04102a" stroke-width="0.5">
    <path d="M 82 58 L 76 52 L 85 55 Z"/><path d="M 88 50 L 83 42 L 91 47 Z"/><path d="M 95 45 L 92 36 L 98 42 Z"/>
    <path d="M 78 68 L 71 64 L 79 64 Z"/><path d="M 66 80 L 58 78 L 66 76 Z"/><path d="M 60 92 L 52 92 L 59 88 Z"/>
    </g>
    <path d="M 112 50 C 102 56 96 66 95 80" stroke="#a8e0ff" stroke-width="1.2" fill="none" opacity="0.5"/>
    
    
    <path d="M 104 36 L 94 26 L 100 29 L 96 20 L 104 28 L 104 22 L 108 32 Z" fill="url(#bld-membrane)" stroke="#04102a" stroke-width="0.6"/>
    <path d="M 108 32 C 104 24 98 20 90 18 C 98 22 102 28 104 35 Z" fill="url(#bld-horn)" stroke="#1a1a24" stroke-width="0.5"/>
    <path d="M 136 34 C 138 24 144 14 152 6 C 152 16 148 26 145 36 Z" fill="url(#bld-horn)" stroke="#1a1a24" stroke-width="0.7"/>
    <g stroke="#5a6070" stroke-width="0.5" fill="none" opacity="0.7"><path d="M 140 28 L 144 29"/><path d="M 143 21 L 147 22"/><path d="M 147 14 L 150 15"/></g>
    
    <!-- head -->
    <use href="#bld-skull" fill="url(#bld-body)" stroke="#04102a" stroke-width="1.5"/>
    <use href="#bld-skull" fill="url(#bld-scales)"/>
    <path d="M 108 50 L 147 45 L 145 57 L 110 55 Z" fill="#0a1030"/>
    <path d="M 130 48 L 147 45 L 145 57 L 128 55 Z" fill="#c0e8ff" opacity="0.6" filter="url(#bld-soft)"/>
    <path d="M 105 54 C 114 54 124 54 130 54 L 146 58 C 148 60 146 62 143 61.5 L 126 61 C 118 62 110 60 104 57 Z" fill="#1e3a78" stroke="#04102a" stroke-width="1.3"/>
    <g fill="#f4ecd4" stroke="#8a7a5a" stroke-width="0.35">
    <path d="M 118 48.2 L 119.5 52.5 L 121 48 Z"/><path d="M 124 47.6 L 125.5 52.5 L 127 47.3 Z"/>
    <path d="M 130 47 L 131.5 51 L 133 46.8 Z"/><path d="M 136 46.5 L 137.5 51.5 L 139 46.3 Z"/>
    <path d="M 142 46 L 143.2 49.5 L 144.5 45.8 Z"/>
    <path d="M 116 54.5 L 117.5 50.5 L 119 54.5 Z"/><path d="M 122 54.5 L 123.5 50 L 125 54.5 Z"/>
    <path d="M 129 55 L 130.5 51 L 132 55.3 Z"/><path d="M 135 56 L 136.5 52 L 138 56.3 Z"/>
    <path d="M 141 57 L 142.2 53.5 L 143.4 57.3 Z"/>
    </g>
    <g fill="#0e1e48" stroke="#04102a" stroke-width="0.5">
    <path d="M 104 55 L 96 58 L 103 51 Z"/><path d="M 108 58.5 L 101 64 L 106 56 Z"/><path d="M 114 60 L 110 67 L 112 59 Z"/>
    </g>
    <path d="M 112 34 Q 122 29 132 34 L 128 36 Q 121 33 114 37 Z" fill="#0e1e48"/>
    <ellipse cx="122" cy="38.5" rx="4.6" ry="2.6" fill="#ffe040" filter="url(#bld-glow)" opacity="0.85"/>
    <ellipse cx="122" cy="38.5" rx="3.4" ry="1.9" fill="#fff4a0"/>
    <ellipse cx="122.3" cy="38.5" rx="0.7" ry="1.8" fill="#0a0202"/>
    <path d="M 144 39.5 Q 146 38.5 147.5 40" stroke="#04102a" stroke-width="1" fill="none"/>
    <g fill="#0e1e48"><path d="M 110 44 L 104 44 L 109 41 Z"/><path d="M 113 47 L 107 48.5 L 112 44.5 Z"/></g>
    
    
    <path d="M 146 52 L 152 64 L 147 67 L 156 82 L 150 85 L 158 102 L 153 105 L 160 122" stroke="#4aa0ff" stroke-width="7" fill="none" opacity="0.5" filter="url(#bld-glow)" stroke-linejoin="round"/>
    <path d="M 146 52 L 152 64 L 147 67 L 156 82 L 150 85 L 158 102 L 153 105 L 160 122" stroke="#a8e0ff" stroke-width="3" fill="none" stroke-linejoin="round"/>
    <path d="M 146 52 L 152 64 L 147 67 L 156 82 L 150 85 L 158 102 L 153 105 L 160 122" stroke="#ffffff" stroke-width="1.1" fill="none" stroke-linejoin="round"/>
    <path d="M 150 85 L 142 94 L 145 97 L 136 108" stroke="#a8e0ff" stroke-width="1.6" fill="none" stroke-linejoin="round"/>
    <path d="M 150 85 L 142 94 L 145 97 L 136 108" stroke="#fff" stroke-width="0.6" fill="none"/>
    <path d="M 147 67 L 140 72 L 142 75 L 136 80" stroke="#a8e0ff" stroke-width="1.2" fill="none"/>
    <circle cx="146" cy="52" r="5" fill="#c8f0ff" opacity="0.8" filter="url(#bld-glow)"/>
    <g stroke="#a8e0ff" stroke-width="0.6" fill="none" opacity="0.7">
    <path d="M 124 30 L 127 33 L 125 35"/><path d="M 100 64 L 104 66 L 102 69"/><path d="M 60 90 L 63 92 L 61 95"/>
    </g>
    </svg>
  `,

  'White Dragon': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="White Dragon">
    <defs>
    <radialGradient id="wtd-body" cx="40%" cy="30%" r="80%">
    <stop offset="0" stop-color="#ffffff"/><stop offset="0.45" stop-color="#c8dcec"/><stop offset="1" stop-color="#5a7a98"/>
    </radialGradient>
    <linearGradient id="wtd-membrane" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#e8f2fa"/><stop offset="0.6" stop-color="#a8c4dc"/><stop offset="1" stop-color="#5a7a98"/>
    </linearGradient>
    <linearGradient id="wtd-belly" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#b8d0e0"/><stop offset="0.5" stop-color="#f4faff"/><stop offset="1" stop-color="#b8d0e0"/>
    </linearGradient>
    <linearGradient id="wtd-horn" x1="1" y1="1" x2="0" y2="0">
    <stop offset="0" stop-color="#5a7080"/><stop offset="0.5" stop-color="#d0e0ec"/><stop offset="1" stop-color="#ffffff"/>
    </linearGradient>
    <radialGradient id="wtd-breath" cx="0%" cy="0%" r="120%">
    <stop offset="0" stop-color="#ffffff"/><stop offset="0.25" stop-color="#e0f6ff"/>
    <stop offset="0.6" stop-color="#9ad8ff"/><stop offset="1" stop-color="#4a90d0" stop-opacity="0.2"/>
    </radialGradient>
    <pattern id="wtd-scales" width="5" height="4" patternUnits="userSpaceOnUse">
    <path d="M 0 4 Q 2.5 0.6 5 4" stroke="#4a6a88" stroke-width="0.55" fill="none" opacity="0.6"/>
    </pattern>
    <filter id="wtd-glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2.2"/></filter>
    <filter id="wtd-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1"/></filter>
    <path id="wtd-torso" d="M 64 76 C 54 92 54 116 64 128 C 76 139 96 137 104 124 C 112 108 108 86 98 72 Z"/>
    <path id="wtd-neck" d="M 78 80 C 76 62 88 48 104 40 L 114 50 C 102 56 95 68 95 82 Z"/>
    <path id="wtd-tail" d="M 60 118 C 38 124 20 138 26 150 C 32 158 50 154 46 146 C 42 151 33 149 34 143 C 38 133 52 131 66 131 Z"/>
    <path id="wtd-skull" d="M 102 40 C 106 30 120 27 130 32 L 148 38 C 152 40 152 44 148 45.5 L 128 47 C 120 48 110 50 104 53 Z"/>
    </defs>
    
    <ellipse cx="80" cy="152" rx="56" ry="5" fill="#000" opacity="0.55" filter="url(#wtd-soft)"/>
    
    <!-- far wing -->
    <path d="M 66 72 L 46 36 L 10 22 Q 22 38 4 54 Q 20 64 18 82 Q 38 80 60 94 Z" fill="url(#wtd-membrane)" stroke="#2a4058" stroke-width="1.2"/>
    <g stroke="#4a6480" stroke-linecap="round" fill="none">
    <path d="M 66 72 L 46 36" stroke-width="3.6"/><path d="M 46 36 L 10 22" stroke-width="2"/>
    <path d="M 46 36 L 4 54" stroke-width="1.8"/><path d="M 46 36 L 18 82" stroke-width="1.8"/>
    </g>
    <g stroke="#c8f0ff" stroke-linecap="round" fill="none" stroke-width="0.7" opacity="0.55">
    <path d="M 65 70 L 46 35"/><path d="M 45 35 L 11 21.5"/>
    </g>
    <g stroke="#2a4058" stroke-width="0.5" fill="none" opacity="0.5">
    <path d="M 40 40 Q 30 44 24 38"/><path d="M 36 50 Q 26 56 18 54"/><path d="M 40 58 Q 34 68 26 70"/>
    </g>
    <path d="M 46 36 L 43 27 L 48.5 34 Z" fill="url(#wtd-horn)"/>
    
    <!-- near wing -->
    <path d="M 94 70 L 112 22 L 146 4 Q 144 20 158 28 Q 146 40 152 54 Q 128 58 106 82 Z" fill="url(#wtd-membrane)" stroke="#2a4058" stroke-width="1.2"/>
    <g stroke="#4a6480" stroke-linecap="round" fill="none">
    <path d="M 94 70 L 112 22" stroke-width="3.6"/><path d="M 112 22 L 146 4" stroke-width="2"/>
    <path d="M 112 22 L 158 28" stroke-width="1.8"/><path d="M 112 22 L 152 54" stroke-width="1.8"/>
    </g>
    <g stroke="#c8f0ff" stroke-linecap="round" fill="none" stroke-width="0.7" opacity="0.55">
    <path d="M 95 69 L 112.5 22"/><path d="M 113 21.5 L 145.5 4"/>
    </g>
    <path d="M 112 22 L 110 12 L 115 20 Z" fill="url(#wtd-horn)"/>
    
    <!-- tail -->
    <use href="#wtd-tail" fill="url(#wtd-body)" stroke="#2a4058" stroke-width="1.4"/>
    <use href="#wtd-tail" fill="url(#wtd-scales)"/>
    <path d="M 34 143 L 22 138 L 26 146 L 18 150 L 30 150 Z" fill="#5a7a98" stroke="#2a4058" stroke-width="0.8"/>
    <g fill="#8aa8c4">
    <path d="M 52 124 L 50 118 L 55 123 Z"/><path d="M 42 128 L 38 123 L 44 127 Z"/><path d="M 33 134 L 28 130 L 35 134 Z"/>
    </g>
    
    <!-- hind legs -->
    <path d="M 56 110 C 48 118 48 132 54 140 L 66 140 C 68 130 70 120 68 112 Z" fill="url(#wtd-body)" stroke="#2a4058" stroke-width="1.3"/>
    <path d="M 104 110 C 112 118 112 132 108 140 L 94 140 C 92 130 92 120 94 112 Z" fill="url(#wtd-body)" stroke="#2a4058" stroke-width="1.3"/>
    <g fill="url(#wtd-horn)" stroke="#2a1a0a" stroke-width="0.4">
    <path d="M 52 139 L 48 148 L 55 141 Z"/><path d="M 57 140 L 56 150 L 60 141 Z"/><path d="M 62 140 L 64 149 L 65 140 Z"/>
    <path d="M 96 140 L 95 149 L 99 141 Z"/><path d="M 101 140 L 102 150 L 104 141 Z"/><path d="M 106 139 L 110 148 L 108 140 Z"/>
    </g>
    
    <!-- torso and belly plates -->
    <use href="#wtd-torso" fill="url(#wtd-body)" stroke="#2a4058" stroke-width="1.6"/>
    <use href="#wtd-torso" fill="url(#wtd-scales)"/>
    <path d="M 72 84 C 67 98 69 116 80 129 C 92 127 98 112 98 97 C 98 87 94 79 90 76 Z" fill="url(#wtd-belly)" stroke="#6a8aa8" stroke-width="0.8"/>
    <g stroke="#6a8aa8" stroke-width="0.8" fill="none" opacity="0.8">
    <path d="M 72 90 Q 83 93 95 86"/><path d="M 70 97 Q 83 101 97 93"/><path d="M 70 104 Q 83 108 98 100"/>
    <path d="M 71 111 Q 83 115 97 107"/><path d="M 73 118 Q 83 121 95 114"/><path d="M 76 124 Q 83 126 91 121"/>
    </g>
    <path d="M 74 86 C 71 100 72 114 80 126" stroke="#fff" stroke-width="1" fill="none" opacity="0.3"/>
    
    <!-- forelegs -->
    <path d="M 68 94 C 58 98 52 106 54 114 L 61 115 C 61 108 66 104 74 103 Z" fill="url(#wtd-body)" stroke="#2a4058" stroke-width="1.2"/>
    <path d="M 100 94 C 110 98 116 106 114 114 L 107 115 C 107 108 102 104 95 103 Z" fill="url(#wtd-body)" stroke="#2a4058" stroke-width="1.2"/>
    <g fill="url(#wtd-horn)" stroke="#2a1a0a" stroke-width="0.4">
    <path d="M 53 113 L 50 120 L 56 115 Z"/><path d="M 57 115 L 56 122 L 60 116 Z"/><path d="M 60.5 115 L 62 121 L 62.5 115 Z"/>
    <path d="M 115 113 L 118 120 L 112 115 Z"/><path d="M 111 115 L 112 122 L 108 116 Z"/><path d="M 107.5 115 L 106 121 L 105.5 115 Z"/>
    </g>
    
    <!-- neck -->
    <use href="#wtd-neck" fill="url(#wtd-body)" stroke="#2a4058" stroke-width="1.5"/>
    <use href="#wtd-neck" fill="url(#wtd-scales)"/>
    <path d="M 95 81 C 95 68 101 58 112 52" stroke="url(#wtd-belly)" stroke-width="4" fill="none"/>
    <g stroke="#6a8aa8" stroke-width="0.6" fill="none">
    <path d="M 93.5 76 L 97.5 77"/><path d="M 94.5 69 L 98.5 71"/><path d="M 97 63 L 100.5 65.5"/><path d="M 101 57.5 L 104 60.5"/>
    </g>
    <g fill="#8aa8c4" stroke="#2a4058" stroke-width="0.5">
    <path d="M 82 58 L 76 52 L 85 55 Z"/><path d="M 88 50 L 83 42 L 91 47 Z"/><path d="M 95 45 L 92 36 L 98 42 Z"/>
    <path d="M 78 68 L 71 64 L 79 64 Z"/><path d="M 66 80 L 58 78 L 66 76 Z"/><path d="M 60 92 L 52 92 L 59 88 Z"/>
    </g>
    <path d="M 112 50 C 102 56 96 66 95 80" stroke="#c8f0ff" stroke-width="1.2" fill="none" opacity="0.5"/>
    
    
    <path d="M 106 40 L 92 30 L 100 32 L 92 20 L 104 29 L 102 14 L 110 28 L 112 16 L 114 32 Z" fill="url(#wtd-membrane)" stroke="#2a4058" stroke-width="0.7"/>
    <g stroke="#6a8aa8" stroke-width="0.5" fill="none" opacity="0.8"><path d="M 108 36 L 96 24"/><path d="M 110 34 L 104 18"/><path d="M 112 33 L 112 20"/></g>
    <g fill="url(#wtd-horn)" stroke="#4a6070" stroke-width="0.4">
    <path d="M 118 60 L 116 68 L 121 61 Z"/><path d="M 124 61 L 124 68 L 127 61 Z"/>
    </g>
    
    <!-- head -->
    <use href="#wtd-skull" fill="url(#wtd-body)" stroke="#2a4058" stroke-width="1.5"/>
    <use href="#wtd-skull" fill="url(#wtd-scales)"/>
    <path d="M 108 50 L 147 45 L 145 57 L 110 55 Z" fill="#1a2a40"/>
    <path d="M 130 48 L 147 45 L 145 57 L 128 55 Z" fill="#c8f4ff" opacity="0.6" filter="url(#wtd-soft)"/>
    <path d="M 105 54 C 114 54 124 54 130 54 L 146 58 C 148 60 146 62 143 61.5 L 126 61 C 118 62 110 60 104 57 Z" fill="#a8c4dc" stroke="#2a4058" stroke-width="1.3"/>
    <g fill="#f4ecd4" stroke="#8a7a5a" stroke-width="0.35">
    <path d="M 118 48.2 L 119.5 52.5 L 121 48 Z"/><path d="M 124 47.6 L 125.5 52.5 L 127 47.3 Z"/>
    <path d="M 130 47 L 131.5 51 L 133 46.8 Z"/><path d="M 136 46.5 L 137.5 51.5 L 139 46.3 Z"/>
    <path d="M 142 46 L 143.2 49.5 L 144.5 45.8 Z"/>
    <path d="M 116 54.5 L 117.5 50.5 L 119 54.5 Z"/><path d="M 122 54.5 L 123.5 50 L 125 54.5 Z"/>
    <path d="M 129 55 L 130.5 51 L 132 55.3 Z"/><path d="M 135 56 L 136.5 52 L 138 56.3 Z"/>
    <path d="M 141 57 L 142.2 53.5 L 143.4 57.3 Z"/>
    </g>
    <g fill="#8aa8c4" stroke="#2a4058" stroke-width="0.5">
    <path d="M 104 55 L 96 58 L 103 51 Z"/><path d="M 108 58.5 L 101 64 L 106 56 Z"/><path d="M 114 60 L 110 67 L 112 59 Z"/>
    </g>
    <path d="M 112 34 Q 122 29 132 34 L 128 36 Q 121 33 114 37 Z" fill="#8aa8c4"/>
    <ellipse cx="122" cy="38.5" rx="4.6" ry="2.6" fill="#40b0ff" filter="url(#wtd-glow)" opacity="0.85"/>
    <ellipse cx="122" cy="38.5" rx="3.4" ry="1.9" fill="#c0ecff"/>
    <ellipse cx="122.3" cy="38.5" rx="0.7" ry="1.8" fill="#0a0202"/>
    <path d="M 144 39.5 Q 146 38.5 147.5 40" stroke="#2a4058" stroke-width="1" fill="none"/>
    <g fill="#8aa8c4"><path d="M 110 44 L 104 44 L 109 41 Z"/><path d="M 113 47 L 107 48.5 L 112 44.5 Z"/></g>
    
    
    <path d="M 146 49 C 153 53 158 61 159 71 C 160 82 158 93 152 102 C 153 95 150 91 146 93 C 148 86 144 82 140 85 C 141 78 138 72 133 71 C 138 65 142 57 146 49 Z" fill="#80c8ff" opacity="0.5" filter="url(#wtd-glow)"/>
    <path d="M 146 50 C 152 54 156 61 157 70 C 158 80 156 89 151 97 C 151 91 149 88 146 90 C 147 84 144 80 141 83 C 141 77 139 73 135 72 C 139 66 143 58 146 50 Z" fill="url(#wtd-breath)" opacity="0.9"/>
    <g stroke="#ffffff" stroke-width="0.7" stroke-linecap="round">
    <path d="M 148 66 L 148 72 M 145 69 L 151 69 M 146 67 L 150 71 M 150 67 L 146 71"/>
    <path d="M 142 82 L 142 87 M 139.5 84.5 L 144.5 84.5 M 140.3 82.8 L 143.7 86.2 M 143.7 82.8 L 140.3 86.2"/>
    <path d="M 153 86 L 153 90 M 151 88 L 155 88"/>
    <path d="M 138 96 L 138 100 M 136 98 L 140 98"/>
    </g>
    <g fill="#ffffff"><circle cx="134" cy="88" r="0.8"/><circle cx="150" cy="104" r="0.9"/><circle cx="156" cy="100" r="0.7"/><circle cx="130" cy="78" r="0.6"/></g>
    <!-- frost riming the jaws -->
    <g fill="#e8f8ff"><path d="M 118 60 L 119 64 L 120 60 Z"/><path d="M 128 61 L 129 65 L 130 61 Z"/></g>
    </svg>
  `,

  'Red Dragon': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Red Dragon">
    <defs>
    <radialGradient id="rd-body" cx="40%" cy="30%" r="80%">
    <stop offset="0" stop-color="#e0503a"/><stop offset="0.45" stop-color="#a42418"/><stop offset="1" stop-color="#4a0806"/>
    </radialGradient>
    <linearGradient id="rd-membrane" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#8a1c14"/><stop offset="0.6" stop-color="#5a0e0a"/><stop offset="1" stop-color="#2a0404"/>
    </linearGradient>
    <linearGradient id="rd-belly" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#b8602a"/><stop offset="0.5" stop-color="#f0b060"/><stop offset="1" stop-color="#b8602a"/>
    </linearGradient>
    <linearGradient id="rd-horn" x1="1" y1="1" x2="0" y2="0">
    <stop offset="0" stop-color="#3a2a1a"/><stop offset="0.5" stop-color="#b8a07a"/><stop offset="1" stop-color="#f0e4c4"/>
    </linearGradient>
    <radialGradient id="rd-breath" cx="0%" cy="0%" r="120%">
    <stop offset="0" stop-color="#fff6c0"/><stop offset="0.25" stop-color="#ffd040"/>
    <stop offset="0.6" stop-color="#ff6a10"/><stop offset="1" stop-color="#c01a04" stop-opacity="0.2"/>
    </radialGradient>
    <pattern id="rd-scales" width="5" height="4" patternUnits="userSpaceOnUse">
    <path d="M 0 4 Q 2.5 0.6 5 4" stroke="#2a0404" stroke-width="0.55" fill="none" opacity="0.6"/>
    </pattern>
    <filter id="rd-glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2.2"/></filter>
    <filter id="rd-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1"/></filter>
    <path id="rd-torso" d="M 64 76 C 54 92 54 116 64 128 C 76 139 96 137 104 124 C 112 108 108 86 98 72 Z"/>
    <path id="rd-neck" d="M 78 80 C 76 62 88 48 104 40 L 114 50 C 102 56 95 68 95 82 Z"/>
    <path id="rd-tail" d="M 60 118 C 38 124 20 138 26 150 C 32 158 50 154 46 146 C 42 151 33 149 34 143 C 38 133 52 131 66 131 Z"/>
    <path id="rd-skull" d="M 102 40 C 106 30 120 27 130 32 L 148 38 C 152 40 152 44 148 45.5 L 128 47 C 120 48 110 50 104 53 Z"/>
    </defs>
    
    <ellipse cx="80" cy="152" rx="56" ry="5" fill="#000" opacity="0.55" filter="url(#rd-soft)"/>
    
    <!-- far wing -->
    <path d="M 66 72 L 46 36 L 10 22 Q 22 38 4 54 Q 20 64 18 82 Q 38 80 60 94 Z" fill="url(#rd-membrane)" stroke="#2a0404" stroke-width="1.2"/>
    <g stroke="#2a0404" stroke-linecap="round" fill="none">
    <path d="M 66 72 L 46 36" stroke-width="3.6"/><path d="M 46 36 L 10 22" stroke-width="2"/>
    <path d="M 46 36 L 4 54" stroke-width="1.8"/><path d="M 46 36 L 18 82" stroke-width="1.8"/>
    </g>
    <g stroke="#ffa040" stroke-linecap="round" fill="none" stroke-width="0.7" opacity="0.55">
    <path d="M 65 70 L 46 35"/><path d="M 45 35 L 11 21.5"/>
    </g>
    <g stroke="#2a0404" stroke-width="0.5" fill="none" opacity="0.5">
    <path d="M 40 40 Q 30 44 24 38"/><path d="M 36 50 Q 26 56 18 54"/><path d="M 40 58 Q 34 68 26 70"/>
    </g>
    <path d="M 46 36 L 43 27 L 48.5 34 Z" fill="url(#rd-horn)"/>
    
    <!-- near wing -->
    <path d="M 94 70 L 112 22 L 146 4 Q 144 20 158 28 Q 146 40 152 54 Q 128 58 106 82 Z" fill="url(#rd-membrane)" stroke="#2a0404" stroke-width="1.2"/>
    <g stroke="#2a0404" stroke-linecap="round" fill="none">
    <path d="M 94 70 L 112 22" stroke-width="3.6"/><path d="M 112 22 L 146 4" stroke-width="2"/>
    <path d="M 112 22 L 158 28" stroke-width="1.8"/><path d="M 112 22 L 152 54" stroke-width="1.8"/>
    </g>
    <g stroke="#ffa040" stroke-linecap="round" fill="none" stroke-width="0.7" opacity="0.55">
    <path d="M 95 69 L 112.5 22"/><path d="M 113 21.5 L 145.5 4"/>
    </g>
    <path d="M 112 22 L 110 12 L 115 20 Z" fill="url(#rd-horn)"/>
    
    <!-- tail -->
    <use href="#rd-tail" fill="url(#rd-body)" stroke="#2a0404" stroke-width="1.4"/>
    <use href="#rd-tail" fill="url(#rd-scales)"/>
    <path d="M 34 143 L 22 138 L 26 146 L 18 150 L 30 150 Z" fill="#4a0806" stroke="#2a0404" stroke-width="0.8"/>
    <g fill="#3a0606">
    <path d="M 52 124 L 50 118 L 55 123 Z"/><path d="M 42 128 L 38 123 L 44 127 Z"/><path d="M 33 134 L 28 130 L 35 134 Z"/>
    </g>
    
    <!-- hind legs -->
    <path d="M 56 110 C 48 118 48 132 54 140 L 66 140 C 68 130 70 120 68 112 Z" fill="url(#rd-body)" stroke="#2a0404" stroke-width="1.3"/>
    <path d="M 104 110 C 112 118 112 132 108 140 L 94 140 C 92 130 92 120 94 112 Z" fill="url(#rd-body)" stroke="#2a0404" stroke-width="1.3"/>
    <g fill="url(#rd-horn)" stroke="#2a1a0a" stroke-width="0.4">
    <path d="M 52 139 L 48 148 L 55 141 Z"/><path d="M 57 140 L 56 150 L 60 141 Z"/><path d="M 62 140 L 64 149 L 65 140 Z"/>
    <path d="M 96 140 L 95 149 L 99 141 Z"/><path d="M 101 140 L 102 150 L 104 141 Z"/><path d="M 106 139 L 110 148 L 108 140 Z"/>
    </g>
    
    <!-- torso and belly plates -->
    <use href="#rd-torso" fill="url(#rd-body)" stroke="#2a0404" stroke-width="1.6"/>
    <use href="#rd-torso" fill="url(#rd-scales)"/>
    <path d="M 72 84 C 67 98 69 116 80 129 C 92 127 98 112 98 97 C 98 87 94 79 90 76 Z" fill="url(#rd-belly)" stroke="#7a3410" stroke-width="0.8"/>
    <g stroke="#7a3410" stroke-width="0.8" fill="none" opacity="0.8">
    <path d="M 72 90 Q 83 93 95 86"/><path d="M 70 97 Q 83 101 97 93"/><path d="M 70 104 Q 83 108 98 100"/>
    <path d="M 71 111 Q 83 115 97 107"/><path d="M 73 118 Q 83 121 95 114"/><path d="M 76 124 Q 83 126 91 121"/>
    </g>
    <path d="M 74 86 C 71 100 72 114 80 126" stroke="#fff" stroke-width="1" fill="none" opacity="0.3"/>
    
    <!-- forelegs -->
    <path d="M 68 94 C 58 98 52 106 54 114 L 61 115 C 61 108 66 104 74 103 Z" fill="url(#rd-body)" stroke="#2a0404" stroke-width="1.2"/>
    <path d="M 100 94 C 110 98 116 106 114 114 L 107 115 C 107 108 102 104 95 103 Z" fill="url(#rd-body)" stroke="#2a0404" stroke-width="1.2"/>
    <g fill="url(#rd-horn)" stroke="#2a1a0a" stroke-width="0.4">
    <path d="M 53 113 L 50 120 L 56 115 Z"/><path d="M 57 115 L 56 122 L 60 116 Z"/><path d="M 60.5 115 L 62 121 L 62.5 115 Z"/>
    <path d="M 115 113 L 118 120 L 112 115 Z"/><path d="M 111 115 L 112 122 L 108 116 Z"/><path d="M 107.5 115 L 106 121 L 105.5 115 Z"/>
    </g>
    
    <!-- neck -->
    <use href="#rd-neck" fill="url(#rd-body)" stroke="#2a0404" stroke-width="1.5"/>
    <use href="#rd-neck" fill="url(#rd-scales)"/>
    <path d="M 95 81 C 95 68 101 58 112 52" stroke="url(#rd-belly)" stroke-width="4" fill="none"/>
    <g stroke="#7a3410" stroke-width="0.6" fill="none">
    <path d="M 93.5 76 L 97.5 77"/><path d="M 94.5 69 L 98.5 71"/><path d="M 97 63 L 100.5 65.5"/><path d="M 101 57.5 L 104 60.5"/>
    </g>
    <g fill="#3a0606" stroke="#2a0404" stroke-width="0.5">
    <path d="M 82 58 L 76 52 L 85 55 Z"/><path d="M 88 50 L 83 42 L 91 47 Z"/><path d="M 95 45 L 92 36 L 98 42 Z"/>
    <path d="M 78 68 L 71 64 L 79 64 Z"/><path d="M 66 80 L 58 78 L 66 76 Z"/><path d="M 60 92 L 52 92 L 59 88 Z"/>
    </g>
    <path d="M 112 50 C 102 56 96 66 95 80" stroke="#ffa040" stroke-width="1.2" fill="none" opacity="0.5"/>
    
    
    <path d="M 106 36 C 96 26 86 22 74 22 C 86 26 95 32 102 40 Z" fill="url(#rd-horn)" stroke="#2a1a0a" stroke-width="0.6"/>
    <path d="M 112 32 C 106 18 98 10 84 6 C 96 14 104 23 108 35 Z" fill="url(#rd-horn)" stroke="#2a1a0a" stroke-width="0.6"/>
    <g stroke="#5a4a30" stroke-width="0.5" fill="none" opacity="0.7">
    <path d="M 96 28 L 98 31"/><path d="M 90 25 L 91.5 28"/><path d="M 104 21 L 106.5 23"/><path d="M 98 15 L 100.5 17"/>
    </g>
    
    <!-- head -->
    <use href="#rd-skull" fill="url(#rd-body)" stroke="#2a0404" stroke-width="1.5"/>
    <use href="#rd-skull" fill="url(#rd-scales)"/>
    <path d="M 108 50 L 147 45 L 145 57 L 110 55 Z" fill="#3a0404"/>
    <path d="M 130 48 L 147 45 L 145 57 L 128 55 Z" fill="#ff7a20" opacity="0.6" filter="url(#rd-soft)"/>
    <path d="M 105 54 C 114 54 124 54 130 54 L 146 58 C 148 60 146 62 143 61.5 L 126 61 C 118 62 110 60 104 57 Z" fill="#8a1c14" stroke="#2a0404" stroke-width="1.3"/>
    <g fill="#f4ecd4" stroke="#8a7a5a" stroke-width="0.35">
    <path d="M 118 48.2 L 119.5 52.5 L 121 48 Z"/><path d="M 124 47.6 L 125.5 52.5 L 127 47.3 Z"/>
    <path d="M 130 47 L 131.5 51 L 133 46.8 Z"/><path d="M 136 46.5 L 137.5 51.5 L 139 46.3 Z"/>
    <path d="M 142 46 L 143.2 49.5 L 144.5 45.8 Z"/>
    <path d="M 116 54.5 L 117.5 50.5 L 119 54.5 Z"/><path d="M 122 54.5 L 123.5 50 L 125 54.5 Z"/>
    <path d="M 129 55 L 130.5 51 L 132 55.3 Z"/><path d="M 135 56 L 136.5 52 L 138 56.3 Z"/>
    <path d="M 141 57 L 142.2 53.5 L 143.4 57.3 Z"/>
    </g>
    <g fill="#3a0606" stroke="#2a0404" stroke-width="0.5">
    <path d="M 104 55 L 96 58 L 103 51 Z"/><path d="M 108 58.5 L 101 64 L 106 56 Z"/><path d="M 114 60 L 110 67 L 112 59 Z"/>
    </g>
    <path d="M 112 34 Q 122 29 132 34 L 128 36 Q 121 33 114 37 Z" fill="#3a0606"/>
    <ellipse cx="122" cy="38.5" rx="4.6" ry="2.6" fill="#ffc020" filter="url(#rd-glow)" opacity="0.85"/>
    <ellipse cx="122" cy="38.5" rx="3.4" ry="1.9" fill="#ffd84a"/>
    <ellipse cx="122.3" cy="38.5" rx="0.7" ry="1.8" fill="#0a0202"/>
    <path d="M 144 39.5 Q 146 38.5 147.5 40" stroke="#2a0404" stroke-width="1" fill="none"/>
    <g fill="#3a0606"><path d="M 110 44 L 104 44 L 109 41 Z"/><path d="M 113 47 L 107 48.5 L 112 44.5 Z"/></g>
    
    
    <path d="M 146 49 C 153 53 158 61 159 71 C 160 82 158 93 152 102 C 153 95 150 91 146 93 C 148 86 144 82 140 85 C 141 78 138 72 133 71 C 138 65 142 57 146 49 Z" fill="#ff3a0a" opacity="0.55" filter="url(#rd-glow)"/>
    <path d="M 146 50 C 152 54 156 61 157 70 C 158 80 156 89 151 97 C 151 91 149 88 146 90 C 147 84 144 80 141 83 C 141 77 139 73 135 72 C 139 66 143 58 146 50 Z" fill="url(#rd-breath)" opacity="0.92"/>
    <path d="M 146 52 C 151 56 154 62 154 69 C 152 67 149 69 149 72 C 147 69 144 70 143 72 C 143 65 144 58 146 52 Z" fill="#fff4b0" opacity="0.85" filter="url(#rd-soft)"/>
    <g fill="#ffd040">
    <circle cx="136" cy="84" r="0.9"/><circle cx="141" cy="96" r="0.8"/><circle cx="148" cy="104" r="0.9"/>
    <circle cx="131" cy="77" r="0.6"/><circle cx="155" cy="104" r="0.7"/>
    </g>
    </svg>
  `,

  'Spectre': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Spectre">
    <defs>
    <radialGradient id="sp-body" cx="50%" cy="25%" r="80%">
    <stop offset="0" stop-color="#e8f4ff" stop-opacity="0.85"/>
    <stop offset="0.4" stop-color="#8ab0d8" stop-opacity="0.6"/>
    <stop offset="1" stop-color="#1a2a4a" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="sp-shroud" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#b8d0f0" stop-opacity="0.7"/>
    <stop offset="0.6" stop-color="#4a6a9a" stop-opacity="0.45"/>
    <stop offset="1" stop-color="#1a2a4a" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="sp-aura" cx="50%" cy="45%" r="50%">
    <stop offset="0" stop-color="#9ac8ff" stop-opacity="0.35"/>
    <stop offset="1" stop-color="#2a4a8a" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="sp-hand" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#f0f8ff" stop-opacity="0.9"/>
    <stop offset="1" stop-color="#7a9ac8" stop-opacity="0.6"/>
    </linearGradient>
    <filter id="sp-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="1.8"/></filter>
    <filter id="sp-haze" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3"/></filter>
    <filter id="sp-wisp" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="0.8"/></filter>
    </defs>
    
    <!-- cold aura filling the corridor -->
    <ellipse cx="80" cy="78" rx="78" ry="76" fill="url(#sp-aura)"/>
    
    <!-- the vast shape: a hooded shroud trailing into wisps, no legs -->
    <path d="M 80 10 C 52 10 38 36 36 66 C 32 96 22 118 12 150 C 30 138 38 146 48 132 C 54 150 64 140 70 156 C 76 142 86 150 92 136 C 100 152 110 142 116 134 C 124 148 134 140 148 152 C 138 118 128 96 124 66 C 122 36 108 10 80 10 Z" fill="url(#sp-shroud)" filter="url(#sp-wisp)"/>
    <path d="M 80 10 C 52 10 38 36 36 66 C 32 96 22 118 12 150" stroke="#d8ecff" stroke-width="1" fill="none" opacity="0.5"/>
    <path d="M 80 10 C 108 10 122 36 124 66 C 128 96 138 118 148 152" stroke="#d8ecff" stroke-width="1" fill="none" opacity="0.5"/>
    <!-- flowing folds -->
    <g stroke="#e0f0ff" stroke-width="0.9" fill="none" opacity="0.35">
    <path d="M 56 60 C 52 90 44 116 36 140"/><path d="M 70 70 C 68 100 62 124 58 146"/>
    <path d="M 104 60 C 108 90 116 116 124 140"/><path d="M 90 70 C 92 100 98 124 102 146"/>
    </g>
    
    <!-- long arms reaching, claws spread -->
    <path d="M 44 64 C 34 58 22 56 12 58 L 12 64 C 22 64 32 68 42 76 Z" fill="url(#sp-shroud)" filter="url(#sp-wisp)"/>
    <path d="M 116 64 C 126 58 138 56 148 58 L 148 64 C 138 64 128 68 118 76 Z" fill="url(#sp-shroud)" filter="url(#sp-wisp)"/>
    <g stroke="url(#sp-hand)" stroke-width="1.5" fill="none" stroke-linecap="round">
    <path d="M 14 60 Q 8 54 4 48"/><path d="M 13 61 Q 6 58 2 56"/><path d="M 13 62 Q 6 64 2 66"/><path d="M 14 63 Q 10 68 8 72"/>
    <path d="M 146 60 Q 152 54 156 48"/><path d="M 147 61 Q 154 58 158 56"/><path d="M 147 62 Q 154 64 158 66"/><path d="M 146 63 Q 150 68 152 72"/>
    </g>
    
    <!-- hood opening and the face within: a skull glimpsed through the glow -->
    <path d="M 62 44 C 62 28 70 20 80 20 C 90 20 98 28 98 44 C 98 58 90 66 80 66 C 70 66 62 58 62 44 Z" fill="#0a1020" opacity="0.85"/>
    <path d="M 68 44 C 68 34 74 28 80 28 C 86 28 92 34 92 44 C 92 52 88 58 80 60 C 72 58 68 52 68 44 Z" fill="url(#sp-body)"/>
    <ellipse cx="74" cy="42" rx="4" ry="3.2" fill="#0a1020"/>
    <ellipse cx="86" cy="42" rx="4" ry="3.2" fill="#0a1020"/>
    <circle cx="74" cy="42" r="2.6" fill="#c8e8ff" filter="url(#sp-glow)"/>
    <circle cx="86" cy="42" r="2.6" fill="#c8e8ff" filter="url(#sp-glow)"/>
    <circle cx="74" cy="42" r="1.1" fill="#fff"/><circle cx="86" cy="42" r="1.1" fill="#fff"/>
    <path d="M 80 46 L 78.5 50 L 81.5 50 Z" fill="#0a1020" opacity="0.8"/>
    <!-- a mouth stretched in an endless wail -->
    <ellipse cx="80" cy="55" rx="3.4" ry="4.4" fill="#0a1020"/>
    <path d="M 76 52 Q 80 50 84 52" stroke="#e0f0ff" stroke-width="0.5" fill="none" opacity="0.6"/>
    
    <!-- haze over the top so it feels only half there -->
    <ellipse cx="80" cy="96" rx="40" ry="30" fill="#b8d8ff" opacity="0.08" filter="url(#sp-haze)"/>
    </svg>
  `,

  'Vampire': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Vampire">
    <defs>
    <linearGradient id="vp-cape" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#1a1420"/>
    <stop offset="1" stop-color="#060408"/>
    </linearGradient>
    <linearGradient id="vp-lining" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#c01830"/>
    <stop offset="1" stop-color="#4a0610"/>
    </linearGradient>
    <radialGradient id="vp-skin" cx="45%" cy="35%" r="70%">
    <stop offset="0" stop-color="#f4f0f4"/>
    <stop offset="0.6" stop-color="#c8c0cc"/>
    <stop offset="1" stop-color="#6a6070"/>
    </radialGradient>
    <linearGradient id="vp-suit" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#0a080c"/>
    <stop offset="0.5" stop-color="#2a2430"/>
    <stop offset="1" stop-color="#08060a"/>
    </linearGradient>
    <linearGradient id="vp-gold" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#ffe08a"/>
    <stop offset="1" stop-color="#8a6010"/>
    </linearGradient>
    <filter id="vp-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="1.3"/></filter>
    <filter id="vp-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1"/></filter>
    </defs>
    
    <ellipse cx="80" cy="154" rx="46" ry="4" fill="#000" opacity="0.55" filter="url(#vp-soft)"/>
    
    <!-- cape flung wide like wings: red lining toward us -->
    <path d="M 66 48 C 46 44 24 52 6 76 C 14 80 16 90 12 100 C 24 98 30 108 28 120 C 40 114 50 122 52 134 C 58 124 64 116 66 108 Z" fill="url(#vp-lining)" stroke="#1a0206" stroke-width="1.1"/>
    <path d="M 94 48 C 114 44 136 52 154 76 C 146 80 144 90 148 100 C 136 98 130 108 132 120 C 120 114 110 122 108 134 C 102 124 96 116 94 108 Z" fill="url(#vp-lining)" stroke="#1a0206" stroke-width="1.1"/>
    <g stroke="#6a0a18" stroke-width="0.8" fill="none" opacity="0.8">
    <path d="M 60 56 C 40 62 24 72 12 90"/><path d="M 62 70 C 46 80 36 92 30 116"/>
    <path d="M 100 56 C 120 62 136 72 148 90"/><path d="M 98 70 C 114 80 124 92 130 116"/>
    </g>
    <path d="M 66 48 C 46 44 24 52 6 76" stroke="#ff5060" stroke-width="0.8" fill="none" opacity="0.5"/>
    <path d="M 94 48 C 114 44 136 52 154 76" stroke="#ff5060" stroke-width="0.8" fill="none" opacity="0.5"/>
    
    <!-- tall figure in black, cape falling behind -->
    <path d="M 62 56 C 58 90 56 124 52 152 L 108 152 C 104 124 102 90 98 56 Z" fill="url(#vp-cape)" stroke="#000" stroke-width="1"/>
    <path d="M 66 58 C 64 90 64 120 62 152 L 98 152 C 96 120 96 90 94 58 Z" fill="url(#vp-suit)"/>
    <!-- white shirt front, cravat, red jewel -->
    <path d="M 74 56 L 86 56 L 84 86 L 80 90 L 76 86 Z" fill="#e8e4ec" stroke="#6a6070" stroke-width="0.5"/>
    <path d="M 76 58 L 84 58 L 82 66 L 80 68 L 78 66 Z" fill="#8a0a1a"/>
    <circle cx="80" cy="62" r="1.8" fill="#ff3040" filter="url(#vp-glow)"/>
    <circle cx="80" cy="62" r="1.2" fill="#ff8090"/>
    <path d="M 70 56 L 76 56 L 78 90 L 72 70 Z M 90 56 L 84 56 L 82 90 L 88 70 Z" fill="#1a1420"/>
    <path d="M 64 100 Q 80 104 96 100" stroke="#3a3440" stroke-width="0.8" fill="none"/>
    
    <!-- arms raised, holding the cape open; long clawed fingers -->
    <path d="M 64 58 C 54 54 44 48 36 42 L 40 36 C 48 42 58 48 68 52 Z" fill="url(#vp-cape)" stroke="#000" stroke-width="0.8"/>
    <path d="M 96 58 C 106 54 116 48 124 42 L 120 36 C 112 42 102 48 92 52 Z" fill="url(#vp-cape)" stroke="#000" stroke-width="0.8"/>
    <g stroke="url(#vp-skin)" stroke-width="1.6" fill="none" stroke-linecap="round">
    <path d="M 37 39 Q 32 32 30 26"/><path d="M 38 38 Q 34 30 35 23"/><path d="M 39 37 Q 38 30 40 24"/><path d="M 36 41 Q 30 40 26 36"/>
    <path d="M 123 39 Q 128 32 130 26"/><path d="M 122 38 Q 126 30 125 23"/><path d="M 121 37 Q 122 30 120 24"/><path d="M 124 41 Q 130 40 134 36"/>
    </g>
    <g fill="#1a0a12"><path d="M 29 26 L 30 22 L 31 26 Z"/><path d="M 34 23 L 35 19 L 36 23 Z"/><path d="M 129 26 L 130 22 L 131 26 Z"/><path d="M 124 23 L 125 19 L 126 23 Z"/></g>
    
    <!-- high standing collar -->
    <path d="M 62 56 L 52 24 L 66 34 L 70 50 Z" fill="url(#vp-lining)" stroke="#1a0206" stroke-width="0.8"/>
    <path d="M 98 56 L 108 24 L 94 34 L 90 50 Z" fill="url(#vp-lining)" stroke="#1a0206" stroke-width="0.8"/>
    <path d="M 62 56 L 52 24 L 50 26 L 60 58 Z M 98 56 L 108 24 L 110 26 L 100 58 Z" fill="url(#vp-cape)"/>
    
    <!-- face: gaunt, pale, widow's peak, burning red eyes, fangs -->
    <path d="M 68 38 C 68 24 74 18 80 18 C 86 18 92 24 92 38 C 92 48 87 56 80 57 C 73 56 68 48 68 38 Z" fill="url(#vp-skin)" stroke="#3a3040" stroke-width="0.9"/>
    <path d="M 67 36 C 66 22 74 14 80 14 C 86 14 94 22 93 36 C 90 30 86 26 80 32 C 74 26 70 30 67 36 Z" fill="#0a080c"/>
    <path d="M 70 28 Q 76 22 80 32 Q 84 22 90 28" stroke="#4a4050" stroke-width="0.6" fill="none"/>
    <path d="M 68 38 L 66 34 L 69 36 Z M 92 38 L 94 34 L 91 36 Z" fill="url(#vp-skin)"/>
    <path d="M 71 38 L 78 40 L 77 41.5 L 71 40 Z M 89 38 L 82 40 L 83 41.5 L 89 40 Z" fill="#2a2030"/>
    <ellipse cx="75" cy="42.5" rx="2.8" ry="1.7" fill="#ff1a30" filter="url(#vp-glow)"/>
    <ellipse cx="85" cy="42.5" rx="2.8" ry="1.7" fill="#ff1a30" filter="url(#vp-glow)"/>
    <ellipse cx="75" cy="42.5" rx="1.8" ry="1.1" fill="#ff7080"/><ellipse cx="85" cy="42.5" rx="1.8" ry="1.1" fill="#ff7080"/>
    <circle cx="75" cy="42.5" r="0.5" fill="#2a0006"/><circle cx="85" cy="42.5" r="0.5" fill="#2a0006"/>
    <path d="M 80 43 L 78.5 48 L 81.5 48 Z" fill="#a898a8" opacity="0.8"/>
    <path d="M 70 46 Q 72 50 74 51 M 90 46 Q 88 50 86 51" stroke="#8a7a8a" stroke-width="0.6" fill="none"/>
    <!-- snarl -->
    <path d="M 74 51 Q 80 55 86 51 Q 80 53 74 51 Z" fill="#4a0010" stroke="#2a0008" stroke-width="0.6"/>
    <path d="M 75.4 51.4 L 76.3 55.4 L 77.2 51.8 Z M 82.8 51.8 L 83.7 55.4 L 84.6 51.4 Z" fill="#fff"/>
    <path d="M 77 53 C 77 55 76.5 57 77 58" stroke="#c01020" stroke-width="0.6" fill="none"/>
    
    <!-- bats wheeling overhead -->
    <g fill="#0a0810" stroke="#2a2030" stroke-width="0.3">
    <path d="M 30 12 Q 34 8 36 12 Q 38 9 40 11 Q 42 8 46 12 Q 42 12 40 15 Q 38 13 36 15 Q 34 12 30 12 Z"/>
    <path d="M 116 8 Q 120 4 122 8 Q 124 5 126 7 Q 128 4 132 8 Q 128 8 126 11 Q 124 9 122 11 Q 120 8 116 8 Z"/>
    <path d="M 136 22 Q 139 19 140 22 Q 142 20 143 21 Q 145 19 148 22 Q 145 22 143 24 Q 142 23 140 24 Q 139 22 136 22 Z"/>
    </g>
    </svg>
  `,

  'Wizard': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Wizard">
    <defs>
    <linearGradient id="wz-robe" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#0e0e3a"/>
    <stop offset="0.4" stop-color="#2a2a8a"/>
    <stop offset="0.65" stop-color="#20207a"/>
    <stop offset="1" stop-color="#08082a"/>
    </linearGradient>
    <linearGradient id="wz-hat" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#101040"/>
    <stop offset="0.5" stop-color="#34349a"/>
    <stop offset="1" stop-color="#0c0c34"/>
    </linearGradient>
    <linearGradient id="wz-beard" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#ffffff"/>
    <stop offset="1" stop-color="#b8bcc8"/>
    </linearGradient>
    <linearGradient id="wz-staff" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#3a2410"/>
    <stop offset="0.5" stop-color="#8a6238"/>
    <stop offset="1" stop-color="#3a2410"/>
    </linearGradient>
    <linearGradient id="wz-gold" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#ffe08a"/>
    <stop offset="1" stop-color="#a07a20"/>
    </linearGradient>
    <radialGradient id="wz-orb" cx="40%" cy="35%" r="60%">
    <stop offset="0" stop-color="#ffffff"/>
    <stop offset="0.35" stop-color="#8ad0ff"/>
    <stop offset="1" stop-color="#1a4ab0"/>
    </radialGradient>
    <radialGradient id="wz-aura" cx="50%" cy="50%" r="50%">
    <stop offset="0" stop-color="#8ad0ff" stop-opacity="0.8"/>
    <stop offset="1" stop-color="#2a6aff" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="wz-skin" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#e8c8a8"/>
    <stop offset="1" stop-color="#8a6a50"/>
    </linearGradient>
    <filter id="wz-glow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="1.4"/></filter>
    <filter id="wz-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1"/></filter>
    </defs>
    
    <ellipse cx="80" cy="155" rx="42" ry="4.5" fill="#000" opacity="0.55" filter="url(#wz-soft)"/>
    
    <!-- staff with a glowing orb in a gnarled claw -->
    <circle cx="120" cy="22" r="18" fill="url(#wz-aura)"/>
    <path d="M 114 152 C 116 110 118 70 118 32" stroke="url(#wz-staff)" stroke-width="3.6" stroke-linecap="round" fill="none"/>
    <path d="M 115.3 150 C 117 110 118.8 70 118.8 34" stroke="#c8a070" stroke-width="0.6" fill="none" opacity="0.5"/>
    <circle cx="120" cy="22" r="7" fill="url(#wz-orb)"/>
    <circle cx="117.5" cy="19.5" r="2" fill="#fff" opacity="0.9"/>
    <path d="M 118 34 C 112 30 111 22 114 16 M 118 34 C 124 30 128 24 125 16 M 118 32 C 118 26 120 18 121 12" stroke="url(#wz-staff)" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <g stroke="#bfe6ff" stroke-width="0.7" fill="none" opacity="0.7" stroke-linecap="round">
    <path d="M 106 14 L 102 10"/><path d="M 134 14 L 138 10"/><path d="M 132 30 L 137 33"/><path d="M 108 30 L 103 33"/>
    </g>
    
    <!-- robe: flared, with folds and a star-embroidered hem -->
    <path d="M 62 70 C 54 100 44 128 36 152 L 124 152 C 116 128 106 100 98 70 Z" fill="url(#wz-robe)" stroke="#04041a" stroke-width="1.4"/>
    <g fill="none" stroke-linecap="round">
    <g stroke="#04041a" stroke-width="1.4" opacity="0.9"><path d="M 66 96 Q 60 124 52 150"/><path d="M 94 96 Q 100 124 108 150"/><path d="M 80 110 L 80 150"/></g>
    <g stroke="#5a5ad0" stroke-width="0.9" opacity="0.5"><path d="M 68 98 Q 62 124 55 150"/><path d="M 82 112 L 82 150"/></g>
    </g>
    <path d="M 37 146 L 123 146 L 124 152 L 36 152 Z" fill="url(#wz-gold)" opacity="0.9"/>
    <g fill="url(#wz-gold)">
    <path d="M 50 132 L 51 135 L 54 135 L 51.6 136.8 L 52.6 139.8 L 50 138 L 47.4 139.8 L 48.4 136.8 L 46 135 L 49 135 Z"/>
    <path d="M 108 128 L 109 131 L 112 131 L 109.6 132.8 L 110.6 135.8 L 108 134 L 105.4 135.8 L 106.4 132.8 L 104 131 L 107 131 Z"/>
    <path d="M 88 136 A 4 4 0 1 1 88 128 A 3 3 0 1 0 88 136 Z"/>
    </g>
    <g fill="#ffe08a" opacity="0.8"><circle cx="64" cy="120" r="0.9"/><circle cx="96" cy="114" r="0.9"/><circle cx="72" cy="140" r="0.8"/><circle cx="100" cy="140" r="0.8"/></g>
    
    <!-- left arm: sleeve, hand crackling with a spell -->
    <path d="M 62 72 C 52 82 44 92 38 100 L 50 108 C 54 98 60 90 68 84 Z" fill="url(#wz-robe)" stroke="#04041a" stroke-width="1.2"/>
    <path d="M 36 98 L 52 108 L 48 114 L 32 104 Z" fill="url(#wz-gold)" opacity="0.85"/>
    <ellipse cx="38" cy="110" rx="5" ry="4" fill="url(#wz-skin)" stroke="#4a3020" stroke-width="0.7"/>
    <g stroke="url(#wz-skin)" stroke-width="1.8" fill="none" stroke-linecap="round">
    <path d="M 35 112 Q 30 116 28 120"/><path d="M 38 113 Q 35 118 34 123"/><path d="M 41 113 Q 41 118 40 122"/>
    </g>
    <circle cx="32" cy="124" r="6" fill="#8ad0ff" opacity="0.45" filter="url(#wz-glow)"/>
    <path d="M 26 122 L 30 126 L 28 128 L 34 132 M 34 122 L 36 128 L 40 128" stroke="#e0f4ff" stroke-width="0.8" fill="none" stroke-linecap="round"/>
    
    <!-- right arm gripping the staff -->
    <path d="M 98 72 C 106 80 112 88 114 96 L 104 100 C 102 92 98 86 92 82 Z" fill="url(#wz-robe)" stroke="#04041a" stroke-width="1.2"/>
    <path d="M 102 96 L 118 92 L 120 98 L 104 102 Z" fill="url(#wz-gold)" opacity="0.85"/>
    <ellipse cx="117" cy="98" rx="4.5" ry="4" fill="url(#wz-skin)" stroke="#4a3020" stroke-width="0.7"/>
    
    <!-- beard, long and flowing -->
    <path d="M 68 58 C 64 76 68 100 80 120 C 92 100 96 76 92 58 C 88 64 72 64 68 58 Z" fill="url(#wz-beard)" stroke="#8a8e9a" stroke-width="0.8"/>
    <g stroke="#9a9eaa" stroke-width="0.6" fill="none" opacity="0.8">
    <path d="M 72 66 Q 72 86 78 108"/><path d="M 80 66 L 80 114"/><path d="M 88 66 Q 88 86 82 108"/>
    <path d="M 76 66 Q 74 84 78 100"/><path d="M 84 66 Q 86 84 82 100"/>
    </g>
    
    <!-- face in the hat's shadow -->
    <path d="M 68 48 C 68 40 74 36 80 36 C 86 36 92 40 92 48 C 92 56 87 62 80 62 C 73 62 68 56 68 48 Z" fill="url(#wz-skin)" stroke="#4a3020" stroke-width="1"/>
    <path d="M 68 48 C 68 40 74 36 80 36 C 86 36 92 40 92 48 L 92 50 C 86 46 74 46 68 50 Z" fill="#000" opacity="0.4"/>
    <path d="M 70 49 Q 75 46 79 50 M 81 50 Q 85 46 90 49" stroke="#e8ecf4" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <ellipse cx="75" cy="52" rx="2.8" ry="1.6" fill="#8ad0ff" filter="url(#wz-glow)" opacity="0.8"/>
    <ellipse cx="85" cy="52" rx="2.8" ry="1.6" fill="#8ad0ff" filter="url(#wz-glow)" opacity="0.8"/>
    <ellipse cx="75" cy="52" rx="1.8" ry="1" fill="#e8f6ff"/><ellipse cx="85" cy="52" rx="1.8" ry="1" fill="#e8f6ff"/>
    <path d="M 79 52 Q 78 57 80 58 Q 82 57 81 52" fill="#c8a080" stroke="#4a3020" stroke-width="0.5"/>
    <path d="M 70 58 Q 75 55 80 58 Q 85 55 90 58 Q 85 60 80 59 Q 75 60 70 58 Z" fill="#e8ecf4" stroke="#8a8e9a" stroke-width="0.5"/>
    
    <!-- pointed hat with a bent tip, brim, gold band -->
    <path d="M 66 40 C 70 26 74 14 82 4 C 86 2 92 4 96 10 C 90 8 86 10 86 16 C 88 24 92 32 94 40 Z" fill="url(#wz-hat)" stroke="#04041a" stroke-width="1.2"/>
    <path d="M 50 42 Q 80 32 110 42 Q 80 48 50 42 Z" fill="url(#wz-hat)" stroke="#04041a" stroke-width="1.2"/>
    <path d="M 67 38 Q 80 34 93 38 L 93 41 Q 80 37 67 41 Z" fill="url(#wz-gold)"/>
    <path d="M 80 38.5 L 81 40.5 L 79 40.5 Z" fill="#8ad0ff"/>
    <g fill="url(#wz-gold)">
    <path d="M 78 24 L 79 26.5 L 81.6 26.5 L 79.5 28 L 80.3 30.5 L 78 29 L 75.7 30.5 L 76.5 28 L 74.4 26.5 L 77 26.5 Z"/>
    <path d="M 84 16 A 2.6 2.6 0 1 1 84 11 A 2 2 0 1 0 84 16 Z"/>
    </g>
    <path d="M 70 36 C 74 24 78 14 83 7" stroke="#6a6ad8" stroke-width="0.8" fill="none" opacity="0.5"/>
    </svg>
  `,

  'Death Knight': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Death Knight">
    <defs>
    <linearGradient id="dk-plate" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#6a6e78"/>
    <stop offset="0.35" stop-color="#2a2c32"/>
    <stop offset="1" stop-color="#08080a"/>
    </linearGradient>
    <linearGradient id="dk-plate-h" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#0a0a0c"/>
    <stop offset="0.45" stop-color="#4a4c54"/>
    <stop offset="1" stop-color="#0a0a0c"/>
    </linearGradient>
    <linearGradient id="dk-cape" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#6a0a0a"/>
    <stop offset="1" stop-color="#1a0202"/>
    </linearGradient>
    <linearGradient id="dk-blade" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#2a2c30"/>
    <stop offset="0.5" stop-color="#8a8e96"/>
    <stop offset="1" stop-color="#1a1c20"/>
    </linearGradient>
    <linearGradient id="dk-fire" x1="0" y1="1" x2="0" y2="0">
    <stop offset="0" stop-color="#ffe070"/>
    <stop offset="0.4" stop-color="#ff7a10"/>
    <stop offset="1" stop-color="#a01004" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="dk-bone" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#e8dcc0"/>
    <stop offset="1" stop-color="#6a5a40"/>
    </linearGradient>
    <filter id="dk-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="1.6"/></filter>
    <filter id="dk-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.2"/></filter>
    </defs>
    
    <ellipse cx="80" cy="154" rx="52" ry="4.5" fill="#000" opacity="0.55" filter="url(#dk-soft)"/>
    
    <!-- flaming greatsword raised behind -->
    <path d="M 122 76 L 134 10 L 142 8 L 130 78 Z" fill="url(#dk-blade)" stroke="#060608" stroke-width="0.8"/>
    <path d="M 128 72 L 138 12" stroke="#c8ccd4" stroke-width="0.5" opacity="0.6"/>
    <!-- hellfire licking up the blade in separate tongues -->
    <g fill="#ff4a0a" opacity="0.5" filter="url(#dk-soft)">
    <path d="M 122 72 C 116 60 120 50 125 43 C 125 51 129 53 129 59 C 131 53 133 49 133 43 C 138 53 136 64 131 73 Z"/>
    <path d="M 127 49 C 123 38 127 28 131 22 C 131 30 134 32 134 38 C 136 32 138 28 138 22 C 141 32 139 42 135 50 Z"/>
    <path d="M 131 25 C 129 17 132 10 135 4 C 135 10 137 12 138 16 C 139 12 140 8 141 4 C 143 12 141 20 138 26 Z"/>
    </g>
    <g fill="url(#dk-fire)" opacity="0.9">
    <path d="M 123 72 C 118 61 121 52 125 46 C 125 53 128 55 129 60 C 130 55 132 51 132 46 C 136 55 135 64 130 72 Z"/>
    <path d="M 128 49 C 124 39 127 30 131 24 C 131 31 133 33 134 38 C 135 33 137 30 137 24 C 140 33 138 42 134 49 Z"/>
    <path d="M 132 25 C 130 18 132 12 135 6 C 135 11 137 13 138 17 C 139 13 140 10 140 6 C 142 13 140 20 137 25 Z"/>
    </g>
    <path d="M 116 78 L 138 82 L 137 86 L 115 82 Z" fill="url(#dk-plate)" stroke="#060608" stroke-width="0.6"/>
    <path d="M 124 82 L 122 94 L 126 95 L 128 83 Z" fill="#2a1a10"/>
    
    <!-- tattered crimson cape -->
    <path d="M 50 56 C 38 90 32 124 26 152 L 36 146 L 42 154 L 52 146 L 62 154 L 70 146 L 80 152 L 90 146 L 98 154 L 108 146 L 118 154 L 124 146 L 134 152 C 128 124 122 90 110 56 Z" fill="url(#dk-cape)" stroke="#0a0000" stroke-width="1"/>
    <g stroke="#a01818" stroke-width="0.7" fill="none" opacity="0.5"><path d="M 46 80 Q 40 110 34 142"/><path d="M 114 80 Q 120 110 126 142"/></g>
    
    <!-- legs: greaves and sabatons -->
    <path d="M 64 112 L 60 146 L 74 146 L 76 112 Z M 84 112 L 86 146 L 100 146 L 96 112 Z" fill="url(#dk-plate-h)" stroke="#060608" stroke-width="1"/>
    <path d="M 58 144 L 76 144 L 78 150 L 56 150 Z M 84 144 L 102 144 L 104 150 L 82 150 Z" fill="url(#dk-plate)" stroke="#060608" stroke-width="0.8"/>
    <g fill="url(#dk-plate)" stroke="#060608" stroke-width="0.6"><path d="M 62 124 L 74 124 L 72 132 L 64 132 Z"/><path d="M 86 124 L 98 124 L 96 132 L 88 132 Z"/></g>
    <!-- faulds -->
    <path d="M 58 100 L 102 100 L 104 116 L 56 116 Z" fill="url(#dk-plate-h)" stroke="#060608" stroke-width="0.8"/>
    <path d="M 57 107 L 103 107" stroke="#060608" stroke-width="0.8"/>
    
    <!-- breastplate with a skull boss, fire-lit edges -->
    <path d="M 56 56 C 52 74 54 90 58 102 L 102 102 C 106 90 108 74 104 56 C 94 50 66 50 56 56 Z" fill="url(#dk-plate)" stroke="#060608" stroke-width="1.2"/>
    <path d="M 80 54 L 80 100" stroke="#060608" stroke-width="0.8"/>
    <path d="M 60 62 Q 80 70 100 62" stroke="#8a8e96" stroke-width="0.7" fill="none" opacity="0.6"/>
    <path d="M 104 58 C 108 74 106 90 102 102" stroke="#ff7a20" stroke-width="1" fill="none" opacity="0.6"/>
    <path d="M 72 74 C 70 66 90 66 88 74 C 88 80 84 82 84 86 L 76 86 C 76 82 72 80 72 74 Z" fill="url(#dk-bone)" stroke="#2a2010" stroke-width="0.6"/>
    <circle cx="76.5" cy="74" r="2" fill="#140a04"/><circle cx="83.5" cy="74" r="2" fill="#140a04"/>
    <path d="M 80 77 L 79 80 L 81 80 Z" fill="#140a04"/>
    <g stroke="#2a2010" stroke-width="0.5"><path d="M 78 84 L 78 86"/><path d="M 80 84 L 80 86"/><path d="M 82 84 L 82 86"/></g>
    
    <!-- spiked pauldrons -->
    <path d="M 40 66 C 40 52 52 46 64 52 C 64 62 58 70 46 72 Z" fill="url(#dk-plate)" stroke="#060608" stroke-width="1"/>
    <path d="M 120 66 C 120 52 108 46 96 52 C 96 62 102 70 114 72 Z" fill="url(#dk-plate)" stroke="#060608" stroke-width="1"/>
    <g fill="url(#dk-plate)" stroke="#060608" stroke-width="0.6">
    <path d="M 44 56 L 34 44 L 49 52 Z"/><path d="M 54 50 L 50 36 L 58 49 Z"/>
    <path d="M 116 56 L 126 44 L 111 52 Z"/><path d="M 106 50 L 110 36 L 102 49 Z"/>
    </g>
    <!-- arms: gauntleted, one on the sword grip, one clenched -->
    <path d="M 44 70 C 38 84 36 98 38 110 L 48 110 C 48 98 50 86 56 76 Z" fill="url(#dk-plate-h)" stroke="#060608" stroke-width="1"/>
    <path d="M 36 108 L 50 108 L 50 120 L 36 120 Z" fill="url(#dk-plate)" stroke="#060608" stroke-width="0.8"/>
    <path d="M 116 70 C 120 78 122 84 122 88 L 114 90 C 112 84 110 80 106 76 Z" fill="url(#dk-plate-h)" stroke="#060608" stroke-width="1"/>
    <path d="M 114 84 L 128 82 L 130 92 L 116 94 Z" fill="url(#dk-plate)" stroke="#060608" stroke-width="0.8"/>
    
    <!-- horned great helm, fire burning in the visor slit -->
    <path d="M 64 30 C 56 22 50 12 52 2 C 56 12 62 18 70 24 Z" fill="url(#dk-bone)" stroke="#2a2010" stroke-width="0.6"/>
    <path d="M 96 30 C 104 22 110 12 108 2 C 104 12 98 18 90 24 Z" fill="url(#dk-bone)" stroke="#2a2010" stroke-width="0.6"/>
    <path d="M 64 48 C 62 30 70 20 80 20 C 90 20 98 30 96 48 C 96 54 90 58 80 58 C 70 58 64 54 64 48 Z" fill="url(#dk-plate)" stroke="#060608" stroke-width="1.2"/>
    <path d="M 80 20 L 80 58" stroke="#060608" stroke-width="0.8"/>
    <path d="M 66 28 Q 72 22 80 22" stroke="#8a8e96" stroke-width="0.8" fill="none" opacity="0.6"/>
    <path d="M 66 38 L 94 38 L 92 42 L 68 42 Z" fill="#000"/>
    <ellipse cx="73" cy="40" rx="4" ry="1.6" fill="#ff5010" filter="url(#dk-glow)"/>
    <ellipse cx="87" cy="40" rx="4" ry="1.6" fill="#ff5010" filter="url(#dk-glow)"/>
    <ellipse cx="73" cy="40" rx="2" ry="0.9" fill="#ffd060"/><ellipse cx="87" cy="40" rx="2" ry="0.9" fill="#ffd060"/>
    <g fill="#000"><circle cx="72" cy="48" r="0.8"/><circle cx="76" cy="50" r="0.8"/><circle cx="84" cy="50" r="0.8"/><circle cx="88" cy="48" r="0.8"/></g>
    <path d="M 70 58 L 90 58 L 92 62 L 68 62 Z" fill="url(#dk-plate)" stroke="#060608" stroke-width="0.6"/>
    <!-- embers drifting off the blade -->
    <g fill="#ffb040"><circle cx="112" cy="30" r="0.9"/><circle cx="150" cy="30" r="0.8"/><circle cx="118" cy="14" r="0.7"/><circle cx="146" cy="50" r="0.7"/></g>
    </svg>
  `,

  'Mongolian Death Worm': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Mongolian Death Worm">
    <defs>
    <linearGradient id="dw-body" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4a0606"/><stop offset="0.4" stop-color="#b3221a"/><stop offset="0.65" stop-color="#8a1410"/><stop offset="1" stop-color="#3a0404"/></linearGradient>
    <radialGradient id="dw-spark" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#e8f4ff"/><stop offset="1" stop-color="#6ab0ff" stop-opacity="0"/></radialGradient>
    </defs>
    <!-- broken floor where it came up -->
    <path d="M14 150 L40 138 L62 146 L90 136 L118 146 L146 140 L152 154 L10 156 Z" fill="#3a332b" stroke="#16120e" stroke-width="1.5"/>
    <g fill="#5a5044" stroke="#16120e" stroke-width="1"><path d="M28 140 l8 -6 l6 5 Z"/><path d="M112 140 l7 -7 l7 6 Z"/></g>
    <!-- the bloated body, rearing out of the stone -->
    <path d="M44 146 Q34 100 50 70 Q62 44 84 34 Q108 26 118 46 Q126 66 114 92 Q102 120 112 146 Z" fill="url(#dw-body)" stroke="#1a0202" stroke-width="2.5"/>
    <!-- blotches -->
    <g fill="#4a0606" opacity="0.7">
      <ellipse cx="62" cy="96" rx="7" ry="4" transform="rotate(-20 62 96)"/><ellipse cx="96" cy="74" rx="6" ry="3.5" transform="rotate(15 96 74)"/>
      <ellipse cx="78" cy="122" rx="8" ry="4"/><ellipse cx="102" cy="108" rx="5" ry="3"/><ellipse cx="70" cy="62" rx="5" ry="3" transform="rotate(-30 70 62)"/>
    </g>
    <path d="M58 80 Q54 110 60 140" stroke="#ff8a7a" stroke-width="2.5" fill="none" opacity="0.3" stroke-linecap="round"/>
    <!-- no face: a blunt, spined end -->
    <g fill="#d8c8a8" stroke="#3a2010" stroke-width="0.8">
      <path d="M84 34 l-6 -10 l9 6 Z"/><path d="M94 30 l0 -12 l6 11 Z"/><path d="M106 31 l6 -10 l-1 12 Z"/><path d="M116 40 l11 -5 l-7 10 Z"/><path d="M76 42 l-11 -4 l9 9 Z"/>
    </g>
    <ellipse cx="98" cy="38" rx="11" ry="6" transform="rotate(-15 98 38)" fill="#3a0404" opacity="0.8"/>
    <!-- yellow acid dripping -->
    <path d="M90 44 q-2 10 1 16" stroke="#d8c830" stroke-width="2.5" fill="none" opacity="0.85" stroke-linecap="round"/>
    <circle cx="91" cy="64" r="2.4" fill="#d8c830" opacity="0.85"/>
    <!-- crackling discharge -->
    <circle cx="124" cy="52" r="10" fill="url(#dw-spark)" opacity="0.7"/>
    <path d="M118 46 L128 40 L124 50 L134 46 L126 58" fill="none" stroke="#bfe0ff" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M44 84 L36 80 L40 88 L30 88" fill="none" stroke="#bfe0ff" stroke-width="1.2" opacity="0.8"/>
    </svg>
  `,
  'Giant Leech': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Giant Leech">
    <defs>
    <linearGradient id="gl-body" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1c1a10"/><stop offset="0.45" stop-color="#4a4424"/><stop offset="0.7" stop-color="#3a3519"/><stop offset="1" stop-color="#14120a"/></linearGradient>
    <radialGradient id="gl-mouth" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#2a0306"/><stop offset="0.7" stop-color="#6e1a1c"/><stop offset="1" stop-color="#3a2a14"/></radialGradient>
    </defs>
    <ellipse cx="82" cy="150" rx="46" ry="8" fill="#0b120c" opacity="0.6"/>
    <!-- the coiled tail on the ground -->
    <path d="M36 146 Q20 138 30 126 Q46 116 70 124 Q96 132 108 146 Z" fill="url(#gl-body)" stroke="#0a0905" stroke-width="2"/>
    <!-- the rearing body -->
    <path d="M58 146 Q48 104 56 74 Q62 44 80 30 Q100 18 112 34 Q118 52 108 80 Q98 110 106 146 Z" fill="url(#gl-body)" stroke="#0a0905" stroke-width="2.5"/>
    <g fill="none" stroke="#14120a" stroke-width="1.6" opacity="0.85">
      <path d="M56 132 Q80 126 104 132"/><path d="M53 116 Q80 110 102 116"/><path d="M53 100 Q80 94 104 100"/>
      <path d="M56 84 Q82 78 108 84"/><path d="M62 68 Q86 62 110 68"/><path d="M70 52 Q90 46 112 52"/>
    </g>
    <path d="M70 60 Q66 90 70 136" stroke="#9a9a68" stroke-width="2.5" fill="none" opacity="0.35" stroke-linecap="round"/>
    <!-- the mouth, ringed with teeth -->
    <ellipse cx="96" cy="32" rx="18" ry="13" transform="rotate(-18 96 32)" fill="url(#gl-mouth)" stroke="#0a0905" stroke-width="2"/>
    <ellipse cx="96" cy="32" rx="8" ry="5.5" transform="rotate(-18 96 32)" fill="#0a0102"/>
    <g fill="#e8e0c8" stroke="#3a2a14" stroke-width="0.6">
      <path d="M84 30 l3 -2 l0 4 Z"/><path d="M88 24 l3 1 l-3 3 Z"/><path d="M95 21 l3 2 l-4 2 Z"/><path d="M103 22 l2 3 l-4 0 Z"/>
      <path d="M108 28 l1 3 l-4 -1 Z"/><path d="M107 36 l-2 3 l-1 -4 Z"/><path d="M100 41 l-3 2 l0 -4 Z"/><path d="M92 40 l-3 1 l2 -3 Z"/>
    </g>
    <!-- slime -->
    <path d="M62 120 q-2 8 0 12" stroke="#7a8a50" stroke-width="2" fill="none" opacity="0.6"/>
    <path d="M104 96 q3 7 1 12" stroke="#7a8a50" stroke-width="2" fill="none" opacity="0.6"/>
    <circle cx="105" cy="110" r="1.8" fill="#7a8a50" opacity="0.6"/>
    </svg>
  `,
  'Giant Shrew': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Giant Shrew">
    <defs>
    <linearGradient id="gs-fur" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6e6458"/><stop offset="1" stop-color="#3a332b"/></linearGradient>
    </defs>
    <ellipse cx="80" cy="146" rx="58" ry="7" fill="#000" opacity="0.4"/>
    <!-- tail -->
    <path d="M30 108 Q8 104 6 86 Q6 76 12 72" fill="none" stroke="#5a4e44" stroke-width="5" stroke-linecap="round"/>
    <!-- body, hunched -->
    <path d="M24 112 Q20 76 52 66 Q82 58 104 72 Q118 82 116 104 Q112 128 80 132 Q40 134 24 112 Z" fill="url(#gs-fur)" stroke="#16120e" stroke-width="2"/>
    <!-- bristling fur along the back -->
    <g stroke="#2a241e" stroke-width="1.6" stroke-linecap="round">
      <path d="M36 74 l-3 -8 M46 68 l-2 -9 M56 64 l0 -9 M66 62 l2 -9 M76 62 l3 -8 M86 64 l4 -8 M96 68 l5 -7"/>
    </g>
    <!-- legs and claws -->
    <g fill="#3a332b" stroke="#16120e" stroke-width="1.5">
      <path d="M40 124 l-4 18 h10 l2 -16 Z"/><path d="M90 126 l2 16 h10 l-2 -18 Z"/>
    </g>
    <g stroke="#d8d0c0" stroke-width="1.2" stroke-linecap="round"><path d="M36 142 l-3 3 M40 142 l-1 4 M44 142 l1 4"/><path d="M94 142 l-1 4 M98 142 l1 4 M102 142 l3 3"/></g>
    <!-- head and long snout -->
    <path d="M100 70 Q124 60 140 78 Q152 90 156 96 Q146 100 132 100 Q114 102 104 96 Z" fill="url(#gs-fur)" stroke="#16120e" stroke-width="2"/>
    <ellipse cx="155" cy="96" rx="4" ry="3" fill="#2a1a1a"/>
    <path d="M126 64 Q130 54 138 60 Q136 66 130 68 Z" fill="#5a4e44" stroke="#16120e" stroke-width="1.2"/>
    <!-- small red eye -->
    <circle cx="128" cy="78" r="3.4" fill="#2a0404"/><circle cx="128" cy="78" r="1.6" fill="#ff3a2a"/>
    <!-- bared teeth -->
    <path d="M118 98 Q134 104 152 99" fill="none" stroke="#16120e" stroke-width="1.5"/>
    <g fill="#f0e8d8" stroke="#3a2a1a" stroke-width="0.6">
      <path d="M140 99 l2 7 l2 -6 Z"/><path d="M146 98 l1.5 6 l2 -5.5 Z"/><path d="M132 100 l1 4 l2 -4 Z"/><path d="M126 100 l1 3.5 l2 -3.5 Z"/>
    </g>
    <!-- whiskers -->
    <g stroke="#c8c0b0" stroke-width="0.7" opacity="0.7"><path d="M148 92 l12 -6 M148 94 l12 -2 M147 96 l12 2"/></g>
    </svg>
  `,
  'Hollow Choir': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="The Hollow Choir: five cracked stone masks around a void">
    <defs>
    <radialGradient id="hc-void" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#000" stop-opacity="1"/><stop offset="0.45" stop-color="#05040a" stop-opacity="0.92"/><stop offset="1" stop-color="#05040a" stop-opacity="0"/></radialGradient>
    <linearGradient id="hc-stone" x1="0" y1="0" x2="0.35" y2="1"><stop offset="0" stop-color="#9d9686"/><stop offset="0.5" stop-color="#6e685b"/><stop offset="1" stop-color="#36322b"/></linearGradient>
    <radialGradient id="hc-grime" cx="0.5" cy="0.6" r="0.6"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#14110d" stop-opacity="0.55"/></radialGradient>
    </defs>
    <!-- the hollow: a darkness light does not enter -->
    <circle cx="80" cy="84" r="46" fill="url(#hc-void)"/>
    <!-- wisps of darkness binding each mask to it -->
    <g fill="none" stroke="#0b0910" stroke-width="2.2" stroke-linecap="round" opacity="0.85">
      <path d="M72 78 Q58 62 46 46"/><path d="M90 76 Q104 62 114 52"/><path d="M70 92 Q52 100 40 104"/>
      <path d="M92 94 Q108 104 120 112"/><path d="M80 98 Q82 114 84 128"/>
    </g>
    <g fill="none" stroke="#2a2433" stroke-width="0.8" opacity="0.6">
      <path d="M74 80 Q62 66 50 50"/><path d="M88 78 Q100 66 110 56"/><path d="M80 100 Q80 116 83 126"/>
    </g>
    <g class="choir-mask m-grief">
      <g transform="translate(44 42) rotate(-16) scale(1.0)">
        <path d="M0 -21 C12 -21 16 -11 15.5 0 C15 12 9 21 0 22 C-9 21 -15 12 -15.5 0 C-16 -11 -12 -21 0 -21 Z" fill="url(#hc-stone)" stroke="#0e0c0a" stroke-width="1.3"/>
        <path d="M0 -21 C12 -21 16 -11 15.5 0 C15 12 9 21 0 22 C-9 21 -15 12 -15.5 0 C-16 -11 -12 -21 0 -21 Z" fill="url(#hc-grime)"/>
        <path d="M-12 -12 C-6 -18 6 -18 12 -12" fill="none" stroke="#d8d0bc" stroke-width="0.6" opacity="0.18"/>
        <path d="M-10 -7 L-3 -10 M10 -7 L3 -10" stroke="#2a2620" stroke-width="1.6" stroke-linecap="round"/>
        <ellipse cx="-6" cy="-3" rx="3.4" ry="2.6" fill="#080706"/><ellipse class="glow" cx="-6" cy="-3" rx="1.19" ry="0.91" fill="#d9e2cc" opacity="0.32"/><ellipse cx="6" cy="-3" rx="3.4" ry="2.6" fill="#080706"/><ellipse class="glow" cx="6" cy="-3" rx="1.19" ry="0.91" fill="#d9e2cc" opacity="0.32"/>
        <path d="M-5 11 Q0 4 5 11 Q0 9 -5 11 Z" fill="#080706" stroke="#2a2620" stroke-width="0.8"/>
        <path d="M-6 0 L-7 6 L-5 11 M3 -20 L1 -13 L4 -8" stroke="#0f0d0b" stroke-width="1.2" fill="none"/>
      </g>
    </g>
    <g class="choir-mask m-rage">
      <g transform="translate(118 48) rotate(14) scale(1.0)">
        <path d="M0 -21 C12 -21 16 -11 15.5 0 C15 12 9 21 0 22 C-9 21 -15 12 -15.5 0 C-16 -11 -12 -21 0 -21 Z" fill="url(#hc-stone)" stroke="#0e0c0a" stroke-width="1.3"/>
        <path d="M0 -21 C12 -21 16 -11 15.5 0 C15 12 9 21 0 22 C-9 21 -15 12 -15.5 0 C-16 -11 -12 -21 0 -21 Z" fill="url(#hc-grime)"/>
        <path d="M-12 -12 C-6 -18 6 -18 12 -12" fill="none" stroke="#d8d0bc" stroke-width="0.6" opacity="0.18"/>
        <path d="M-11 -10 L-2 -5 M11 -10 L2 -5" stroke="#2a2620" stroke-width="2" stroke-linecap="round"/>
        <ellipse cx="-6" cy="-2" rx="3.2" ry="1.9" fill="#080706"/><ellipse class="glow" cx="-6" cy="-2" rx="1.12" ry="0.66" fill="#d9e2cc" opacity="0.32"/><ellipse cx="6" cy="-2" rx="3.2" ry="1.9" fill="#080706"/><ellipse class="glow" cx="6" cy="-2" rx="1.12" ry="0.66" fill="#d9e2cc" opacity="0.32"/>
        <path d="M-7 8 L7 8 L5 14 L-5 14 Z" fill="#080706" stroke="#2a2620" stroke-width="0.8"/><path d="M-4 8 v2 M0 8 v2 M4 8 v2" stroke="#7d776c" stroke-width="0.9"/>
        <path d="M8 -18 L5 -9 L9 -2 L6 6 M-13 4 L-8 9" stroke="#0f0d0b" stroke-width="1.2" fill="none"/>
      </g>
    </g>
    <g class="choir-mask m-delight">
      <g transform="translate(36 108) rotate(-10) scale(1.0)">
        <path d="M0 -21 C12 -21 16 -11 15.5 0 C15 12 9 21 0 22 C-9 21 -15 12 -15.5 0 C-16 -11 -12 -21 0 -21 Z" fill="url(#hc-stone)" stroke="#0e0c0a" stroke-width="1.3"/>
        <path d="M0 -21 C12 -21 16 -11 15.5 0 C15 12 9 21 0 22 C-9 21 -15 12 -15.5 0 C-16 -11 -12 -21 0 -21 Z" fill="url(#hc-grime)"/>
        <path d="M-12 -12 C-6 -18 6 -18 12 -12" fill="none" stroke="#d8d0bc" stroke-width="0.6" opacity="0.18"/>
        <path d="M-10 -9 Q-6 -12 -2 -9 M2 -9 Q6 -12 10 -9" stroke="#2a2620" stroke-width="1.2" fill="none"/>
        <path d="M-10 -1 Q-6 -5 -2 -1 Q-6 -2.4 -10 -1 Z" fill="#080706"/><path d="M2 -1.5 Q6 -5.5 10 -1.5 Q6 -2.8 2 -1.5 Z" fill="#080706"/><ellipse class="glow" cx="-6" cy="-2.2" rx="1" ry="0.5" fill="#d9e2cc" opacity="0.32"/><ellipse class="glow" cx="6" cy="-2.6" rx="1" ry="0.5" fill="#d9e2cc" opacity="0.32"/>
        <path d="M-13 5 Q-2 15 12 7 Q-1 11 -13 5 Z" fill="#080706" stroke="#1a1712" stroke-width="0.7"/><path d="M-13 5 l-1.5 -2 M12 7 l1.5 -2.5" stroke="#1a1712" stroke-width="0.8"/>
        <path d="M0 -21 L-2 -12 L1 -6 M-14 2 L-10 5 L-11 10 M12 10 L8 14" stroke="#0f0d0b" stroke-width="1.2" fill="none"/>
      </g>
    </g>
    <g class="choir-mask m-dread">
      <g transform="translate(124 112) rotate(18) scale(1.0)">
        <path d="M0 -21 C12 -21 16 -11 15.5 0 C15 12 9 21 0 22 C-9 21 -15 12 -15.5 0 C-16 -11 -12 -21 0 -21 Z" fill="url(#hc-stone)" stroke="#0e0c0a" stroke-width="1.3"/>
        <path d="M0 -21 C12 -21 16 -11 15.5 0 C15 12 9 21 0 22 C-9 21 -15 12 -15.5 0 C-16 -11 -12 -21 0 -21 Z" fill="url(#hc-grime)"/>
        <path d="M-12 -12 C-6 -18 6 -18 12 -12" fill="none" stroke="#d8d0bc" stroke-width="0.6" opacity="0.18"/>
        <path d="M-10 -11 Q-6 -14 -2 -10 M2 -10 Q6 -14 10 -11" stroke="#2a2620" stroke-width="1.3" fill="none"/>
        <ellipse cx="-6" cy="-3" rx="3.8" ry="3.8" fill="#080706"/><ellipse class="glow" cx="-6" cy="-3" rx="1.33" ry="1.33" fill="#d9e2cc" opacity="0.32"/><ellipse cx="6" cy="-3" rx="3.8" ry="3.8" fill="#080706"/><ellipse class="glow" cx="6" cy="-3" rx="1.33" ry="1.33" fill="#d9e2cc" opacity="0.32"/>
        <ellipse cx="0" cy="11" rx="2.6" ry="3.6" fill="#080706" stroke="#2a2620" stroke-width="0.8"/>
        <path d="M-4 -20 L-6 -11 M10 0 L13 6 L11 12 M-12 8 L-7 14" stroke="#0f0d0b" stroke-width="1.2" fill="none"/>
      </g>
    </g>
    <g class="choir-mask m-blank">
      <g transform="translate(82 136) rotate(4) scale(0.9)">
        <path d="M0 -21 C12 -21 16 -11 15.5 0 C15 12 9 21 0 22 C-9 21 -15 12 -15.5 0 C-16 -11 -12 -21 0 -21 Z" fill="url(#hc-stone)" stroke="#0e0c0a" stroke-width="1.3"/>
        <path d="M0 -21 C12 -21 16 -11 15.5 0 C15 12 9 21 0 22 C-9 21 -15 12 -15.5 0 C-16 -11 -12 -21 0 -21 Z" fill="url(#hc-grime)"/>
        <path d="M-12 -12 C-6 -18 6 -18 12 -12" fill="none" stroke="#d8d0bc" stroke-width="0.6" opacity="0.18"/>
        
        <path d="M-10 -3 h7 M3 -3 h7" stroke="#080706" stroke-width="2.4" stroke-linecap="round"/><ellipse class="glow" cx="-6.5" cy="-3" rx="1.2" ry="0.6" fill="#d9e2cc" opacity="0.32"/><ellipse class="glow" cx="6.5" cy="-3" rx="1.2" ry="0.6" fill="#d9e2cc" opacity="0.32"/>
        <path d="M-5 10 h10" stroke="#080706" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M2 -21 L0 -12 L3 -4 L1 4" stroke="#0f0d0b" stroke-width="1.2" fill="none"/>
      </g>
    </g>
    </svg>
  `,

  'Cerebrovore': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Cerebrovore">
    <defs>
    <linearGradient id="cv-robe" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0d0718"/><stop offset="0.45" stop-color="#3a1d52"/><stop offset="1" stop-color="#0d0718"/></linearGradient>
    <radialGradient id="cv-brain" cx="0.45" cy="0.4" r="0.65"><stop offset="0" stop-color="#e9c2c8"/><stop offset="0.6" stop-color="#b98592"/><stop offset="1" stop-color="#6e4552"/></radialGradient>
    <radialGradient id="cv-skin" cx="0.5" cy="0.35" r="0.7"><stop offset="0" stop-color="#b9adc0"/><stop offset="1" stop-color="#5d5266"/></radialGradient>
    <radialGradient id="cv-psy" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#d9a8ff" stop-opacity="0.85"/><stop offset="1" stop-color="#7b2cff" stop-opacity="0"/></radialGradient>
    </defs>
    <!-- psychic halo -->
    <circle cx="80" cy="46" r="44" fill="none" stroke="#8a4dff" stroke-width="1.2" opacity="0.35"/>
    <circle cx="80" cy="46" r="52" fill="none" stroke="#8a4dff" stroke-width="0.8" opacity="0.2"/>
    <!-- hunched robed body -->
    <path d="M40 158 Q36 112 52 90 Q66 76 80 76 Q94 76 108 90 Q124 112 120 158 Z" fill="url(#cv-robe)" stroke="#05020a" stroke-width="2"/>
    <path d="M58 86 Q80 104 102 86 L98 100 Q80 112 62 100 Z" fill="#241034" stroke="#05020a" stroke-width="1.5"/>
    <path d="M80 100 V156" stroke="#1a0b28" stroke-width="2"/>
    <!-- gaunt neck -->
    <path d="M72 70 Q80 80 88 70 L90 84 Q80 90 70 84 Z" fill="url(#cv-skin)" stroke="#2a2030" stroke-width="1.2"/>
    <!-- face: small, under the swollen cranium -->
    <ellipse cx="80" cy="60" rx="17" ry="15" fill="url(#cv-skin)" stroke="#2a2030" stroke-width="1.5"/>
    <!-- the swollen, exposed brain -->
    <path d="M50 46 Q46 18 70 10 Q80 6 92 10 Q116 18 110 46 Q104 54 80 54 Q56 54 50 46 Z" fill="url(#cv-brain)" stroke="#4a2a34" stroke-width="2"/>
    <g fill="none" stroke="#7a4652" stroke-width="1.4" stroke-linecap="round">
      <path d="M58 40 Q62 30 70 34 Q74 24 82 28 Q90 22 96 30 Q104 30 104 40"/>
      <path d="M56 32 Q60 22 68 22 Q74 14 84 18"/>
      <path d="M88 16 Q98 16 102 24"/>
      <path d="M62 46 Q70 40 78 46 Q86 40 96 46"/>
      <path d="M80 10 Q78 28 80 52" stroke-width="1.8"/>
    </g>
    <g fill="none" stroke="#a83a52" stroke-width="0.9" opacity="0.8"><path d="M52 44 Q58 50 66 48"/><path d="M108 44 Q102 50 94 48"/><path d="M66 14 Q60 20 62 26"/></g>
    <!-- sunken, glowing eyes -->
    <ellipse cx="73" cy="57" rx="3.4" ry="2.2" fill="#160a1e"/><ellipse cx="87" cy="57" rx="3.4" ry="2.2" fill="#160a1e"/>
    <circle cx="73" cy="57" r="1.4" fill="#e6b8ff"/><circle cx="87" cy="57" r="1.4" fill="#e6b8ff"/>
    <!-- the lamprey mouth -->
    <circle cx="80" cy="68" r="6.5" fill="#2b0c16" stroke="#5a2a36" stroke-width="1.2"/>
    <circle cx="80" cy="68" r="3.8" fill="#12040a"/>
    <g stroke="#e8e0d0" stroke-width="1" stroke-linecap="round">
      <path d="M80 62.6 v1.6 M85.4 68 h-1.6 M80 73.4 v-1.6 M74.6 68 h1.6 M83.8 64.2 l-1.1 1.1 M83.8 71.8 l-1.1 -1.1 M76.2 71.8 l1.1 -1.1 M76.2 64.2 l1.1 1.1"/>
    </g>
    <!-- long clawed hands, raised, with psychic light -->
    <circle cx="34" cy="96" r="14" fill="url(#cv-psy)"/><circle cx="126" cy="96" r="14" fill="url(#cv-psy)"/>
    <path d="M52 104 Q42 100 36 98" stroke="#3a1d52" stroke-width="7" fill="none" stroke-linecap="round"/>
    <path d="M108 104 Q118 100 124 98" stroke="#3a1d52" stroke-width="7" fill="none" stroke-linecap="round"/>
    <g stroke="#9c8fa6" stroke-width="2.2" fill="none" stroke-linecap="round">
      <path d="M36 98 L26 86 M36 98 L24 94 M36 98 L26 102 M36 98 L30 108"/>
      <path d="M124 98 L134 86 M124 98 L136 94 M124 98 L134 102 M124 98 L130 108"/>
    </g>
    </svg>
  `,

  'Elder Oblex': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Elder Oblex">
    <defs>
    <radialGradient id="eo-goo" cx="42%" cy="28%" r="80%">
    <stop offset="0" stop-color="#fff4c0" stop-opacity="0.92"/>
    <stop offset="0.4" stop-color="#e8b440" stop-opacity="0.86"/>
    <stop offset="0.8" stop-color="#9a5a0a" stop-opacity="0.9"/>
    <stop offset="1" stop-color="#4a2604" stop-opacity="0.95"/>
    </radialGradient>
    <linearGradient id="eo-sulcus" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#fff2c0" stop-opacity="0.92"/>
    <stop offset="0.6" stop-color="#e8b44a" stop-opacity="0.86"/>
    <stop offset="1" stop-color="#b87818" stop-opacity="0.8"/>
    </linearGradient>
    <linearGradient id="eo-sulcus-far" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#f0d890" stop-opacity="0.8"/>
    <stop offset="1" stop-color="#a86a14" stop-opacity="0.75"/>
    </linearGradient>
    <radialGradient id="eo-pool" cx="50%" cy="50%" r="50%">
    <stop offset="0" stop-color="#d8a030" stop-opacity="0.75"/>
    <stop offset="1" stop-color="#6a3a04" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="eo-mote" cx="50%" cy="50%" r="50%">
    <stop offset="0" stop-color="#ffffff"/>
    <stop offset="0.4" stop-color="#fff0a0" stop-opacity="0.8"/>
    <stop offset="1" stop-color="#ffc040" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="eo-bone" cx="40%" cy="35%" r="70%">
    <stop offset="0" stop-color="#f4ecd0" stop-opacity="0.8"/>
    <stop offset="1" stop-color="#9a8050" stop-opacity="0.6"/>
    </radialGradient>
    <filter id="eo-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="1.4"/></filter>
    <filter id="eo-blur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="0.8"/></filter>
    <filter id="eo-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.4"/></filter>
    <clipPath id="eo-clip"><path d="M 10 148 C 6 130 12 110 26 100 C 30 88 44 82 56 88 C 62 80 72 78 80 82 C 90 78 100 80 106 88 C 118 82 132 88 136 100 C 150 108 156 128 150 148 Z"/></clipPath>
    <!-- a half-formed face drowned in the mass -->
    <g id="eo-drowned">
    <ellipse cx="0" cy="0" rx="8" ry="10" fill="#fff0c0" opacity="0.45"/>
    <path d="M -5 -3 Q -3 -5 -1 -3 Q -3 -1.5 -5 -3 Z M 1 -3 Q 3 -5 5 -3 Q 3 -1.5 1 -3 Z" fill="#5a3206"/>
    <ellipse cx="0" cy="5" rx="2.4" ry="3.2" fill="#5a3206" opacity="0.85"/>
    </g>
    </defs>
    
    <!-- slime puddle spreading across the floor -->
    <ellipse cx="80" cy="148" rx="78" ry="10" fill="url(#eo-pool)"/>
    <ellipse cx="80" cy="152" rx="70" ry="5" fill="#000" opacity="0.5" filter="url(#eo-soft)"/>
    
    <!-- stolen memories drifting up out of it -->
    <g>
    <circle cx="30" cy="30" r="5" fill="url(#eo-mote)"/><circle cx="130" cy="22" r="6" fill="url(#eo-mote)"/>
    <circle cx="146" cy="58" r="4" fill="url(#eo-mote)"/><circle cx="16" cy="62" r="3.6" fill="url(#eo-mote)"/>
    <circle cx="108" cy="10" r="3.4" fill="url(#eo-mote)"/><circle cx="54" cy="14" r="3" fill="url(#eo-mote)"/>
    </g>
    <g stroke="#7a4a0a" stroke-width="0.5" fill="none" opacity="0.7">
    <path d="M 28 30 Q 30 28 32 30"/><path d="M 127 22 L 129 19 L 131 22 L 133 20"/><path d="M 144 58 Q 146 56 148 58"/>
    </g>
    
    <!-- back tendrils -->
    <g fill="url(#eo-goo)" stroke="#3a2004" stroke-width="0.8">
    <path d="M 14 132 C 4 128 0 118 2 108 C 3 104 7 105 7 109 C 7 116 10 122 18 124 Z"/>
    <path d="M 146 124 C 154 118 158 108 156 98 C 155 94 151 95 152 99 C 153 106 150 112 142 116 Z"/>
    </g>
    
    <!-- LEFT SULCUS: a hooded wizard, leaning out and reaching -->
    <g stroke="#5a3606" stroke-width="0.9">
    <path d="M 22 106 C 18 94 20 82 28 74 L 40 76 C 44 86 44 96 40 106 Z" fill="url(#eo-sulcus-far)"/>
    <path d="M 27 84 C 18 80 12 70 12 60 L 16 58 C 18 68 23 74 31 78 Z" fill="url(#eo-sulcus-far)"/>
    <path d="M 26 76 C 22 64 30 52 40 58 C 44 64 44 72 40 78 Z" fill="url(#eo-sulcus-far)"/>
    </g>
    <path d="M 29 66 Q 35 62 40 67 L 38 74 Q 33 72 29 74 Z" fill="#6a3a08" opacity="0.8"/>
    <g fill="#fff8d0" filter="url(#eo-glow)"><circle cx="32" cy="68" r="1.2"/><circle cx="37" cy="68" r="1.2"/></g>
    <g fill="url(#eo-sulcus-far)" stroke="#5a3606" stroke-width="0.5">
    <path d="M 11 60 L 8 52 L 12 58 L 12 50 L 14 57 L 16 50 L 16 58 L 19 54 L 17 61 Z"/>
    </g>
    <path d="M 16 62 C 14 76 18 92 24 102" stroke="#e8b44a" stroke-width="1.2" fill="none" opacity="0.6"/>
    
    <!-- RIGHT SULCUS: a dwarf's head and shoulders just surfacing -->
    <g stroke="#5a3606" stroke-width="0.9">
    <path d="M 108 102 C 110 92 116 88 124 88 C 132 88 140 92 142 102 Z" fill="url(#eo-sulcus-far)"/>
    <path d="M 117 90 C 114 78 134 76 132 90 Z" fill="url(#eo-sulcus-far)"/>
    <path d="M 116 80 C 118 72 132 72 134 80 L 132 82 L 118 82 Z" fill="#c8902a" opacity="0.9"/>
    <path d="M 118 88 C 118 98 124 104 125 104 C 127 100 132 96 131 88 Z" fill="url(#eo-sulcus)"/>
    </g>
    <g stroke="#8a5810" stroke-width="0.5" fill="none" opacity="0.8"><path d="M 121 92 L 122 100"/><path d="M 125 92 L 125 102"/><path d="M 129 92 L 128 99"/></g>
    <g fill="#6a3a08"><ellipse cx="121.5" cy="85" rx="1.3" ry="0.9"/><ellipse cx="128.5" cy="85" rx="1.3" ry="0.9"/></g>
    
    <!-- the mass itself -->
    <path d="M 10 148 C 6 130 12 110 26 100 C 30 88 44 82 56 88 C 62 80 72 78 80 82 C 90 78 100 80 106 88 C 118 82 132 88 136 100 C 150 108 156 128 150 148 Z" fill="url(#eo-goo)" stroke="#3a2004" stroke-width="1.5"/>
    
    <!-- inside: folds of devoured thought, drowned faces, a dissolving skull -->
    <g clip-path="url(#eo-clip)">
    <g stroke="#8a5210" stroke-width="1.1" fill="none" opacity="0.55" stroke-linecap="round">
    <path d="M 30 118 C 36 110 44 112 44 120 C 44 126 52 128 56 122 C 60 116 68 118 68 126"/>
    <path d="M 82 132 C 86 124 94 124 96 130 C 98 136 106 136 108 130 C 110 124 118 124 120 132"/>
    <path d="M 52 106 C 58 100 66 102 66 108 C 66 112 72 114 76 110"/>
    <path d="M 100 108 C 104 102 112 102 114 108 C 116 114 124 114 128 110"/>
    <path d="M 24 136 C 30 130 36 132 38 138"/><path d="M 126 138 C 130 132 138 132 140 138"/>
    </g>
    <use href="#eo-drowned" transform="translate(44 128) rotate(-15)" filter="url(#eo-blur)"/>
    <use href="#eo-drowned" transform="translate(116 124) rotate(12) scale(0.9)" filter="url(#eo-blur)"/>
    <use href="#eo-drowned" transform="translate(84 116) scale(0.7)" opacity="0.7" filter="url(#eo-blur)"/>
    <g opacity="0.75" filter="url(#eo-blur)">
    <path d="M 96 136 C 94 128 106 126 108 134 C 109 138 106 140 105 142 L 99 142 C 98 140 96 139 96 136 Z" fill="url(#eo-bone)"/>
    <circle cx="99.5" cy="134" r="1.4" fill="#5a3206"/><circle cx="104.5" cy="134" r="1.4" fill="#5a3206"/>
    <path d="M 60 140 L 76 136 L 77 138 L 61 142 Z" fill="url(#eo-bone)"/>
    </g>
    <g fill="none" stroke="#fff4c8" stroke-width="0.6" opacity="0.7">
    <circle cx="36" cy="110" r="2"/><circle cx="130" cy="112" r="1.6"/><circle cx="70" cy="96" r="1.4"/><circle cx="96" cy="100" r="2.2"/>
    </g>
    </g>
    
    <!-- CENTRAL SULCUS: an adventurer rising from the mass, arms outstretched -->
    <!-- strands of slime still binding its arms to the body -->
    <g stroke="#e0a83a" fill="none" stroke-linecap="round" opacity="0.75">
    <path d="M 48 44 C 44 60 42 76 44 92" stroke-width="1.6"/>
    <path d="M 52 46 C 52 62 56 76 58 88" stroke-width="1"/>
    <path d="M 114 56 C 120 66 122 78 120 92" stroke-width="1.6"/>
    <path d="M 110 60 C 110 70 106 80 104 88" stroke-width="1"/>
    </g>
    <g stroke="#5a3606" stroke-width="1">
    <!-- torso -->
    <path d="M 65 90 C 63 74 65 60 70 53 L 90 53 C 95 60 97 74 95 90 Z" fill="url(#eo-sulcus)"/>
    <!-- arms -->
    <path d="M 70 57 C 60 58 52 52 46 42 L 51 38 C 56 46 62 50 71 51 Z" fill="url(#eo-sulcus)"/>
    <path d="M 90 57 C 100 61 108 59 114 52 L 117 57 C 111 65 101 67 92 64 Z" fill="url(#eo-sulcus)"/>
    <!-- head -->
    <path d="M 71 38 C 71 27 89 27 89 38 C 89 46 85 51 80 52 C 75 51 71 46 71 38 Z" fill="url(#eo-sulcus)"/>
    </g>
    <!-- the waist dissolves back into the mass rather than ending in an edge -->
    <path d="M 58 96 C 62 86 70 84 80 86 C 90 84 98 86 102 96 C 94 100 66 100 58 96 Z" fill="#e8b440" opacity="0.9" filter="url(#eo-soft)"/>
    <g stroke="#e0a83a" stroke-width="1.2" fill="none" opacity="0.7" stroke-linecap="round">
    <path d="M 66 86 C 65 90 66 93 64 96"/><path d="M 94 86 C 95 90 94 93 96 96"/><path d="M 80 87 C 81 90 79 93 80 96"/>
    </g>
    <!-- splayed, melting hands -->
    <g fill="url(#eo-sulcus)" stroke="#5a3606" stroke-width="0.6">
    <path d="M 46 42 L 40 36 L 45 38 L 42 31 L 47 36 L 47 29 L 50 36 L 53 31 L 52 39 Z"/>
    <path d="M 115 54 L 122 50 L 119 54 L 126 53 L 120 57 L 126 58 L 119 59 L 122 63 L 116 58 Z"/>
    </g>
    <!-- a face that isn't finished: one eye sliding, the mouth an open scream -->
    <path d="M 72 36 Q 80 30 88 36" stroke="#a86a14" stroke-width="1" fill="none" opacity="0.7"/>
    <path d="M 73.5 38.5 Q 76 36.5 78.5 38.5 Q 76 40 73.5 38.5 Z" fill="#4a2604"/>
    <path d="M 82 40 Q 84.5 38.5 87 40.5 Q 85 43 82 40 Z" fill="#4a2604"/>
    <path d="M 84.5 43 C 84.5 45 85 47 84 48" stroke="#4a2604" stroke-width="0.8" fill="none" opacity="0.7"/>
    <path d="M 79 41 L 78.5 44 L 81 44 Z" fill="#a86a14" opacity="0.8"/>
    <ellipse cx="79.5" cy="47.5" rx="2.4" ry="2.8" fill="#3a1c02"/>
    <g stroke="#8a5210" stroke-width="0.6" fill="none" opacity="0.8">
    <path d="M 72 33 Q 74 29 78 28"/><path d="M 88 33 Q 86 29 82 28"/>
    <path d="M 70 62 Q 80 66 90 62"/><path d="M 72 72 Q 80 75 88 72"/>
    </g>
    <!-- drips running off chin and arms -->
    <g fill="url(#eo-sulcus)" stroke="#5a3606" stroke-width="0.4">
    <path d="M 78 51 C 78 55 77 58 79 59 C 81 59 81 56 80 52 Z"/>
    <path d="M 60 54 C 60 58 59 61 61 62 C 63 62 63 59 62 55 Z"/>
    <path d="M 104 64 C 104 67 103 70 105 71 C 107 71 107 68 106 65 Z"/>
    </g>
    <!-- wet highlights -->
    <path d="M 74 30 Q 78 28 82 29" stroke="#fff" stroke-width="1" fill="none" opacity="0.7" stroke-linecap="round"/>
    <path d="M 68 58 C 67 66 67 74 68 82" stroke="#fff" stroke-width="1.2" fill="none" opacity="0.4" stroke-linecap="round"/>
    <path d="M 30 104 C 38 94 50 90 60 92" stroke="#fff8e0" stroke-width="2.2" fill="none" opacity="0.45" stroke-linecap="round"/>
    <ellipse cx="34" cy="108" rx="4.5" ry="2" transform="rotate(-35 34 108)" fill="#fff" opacity="0.6"/>
    <path d="M 146 118 C 148 128 146 138 142 144" stroke="#ffe090" stroke-width="1.2" fill="none" opacity="0.4"/>
    </svg>
  `,

  'Lich': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Lich">
    <defs>
    <linearGradient id="lc-robe" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#120618"/>
    <stop offset="0.45" stop-color="#3e1a4e"/>
    <stop offset="1" stop-color="#0c0410"/>
    </linearGradient>
    <radialGradient id="lc-skull" cx="40%" cy="30%" r="70%">
    <stop offset="0" stop-color="#f4ecd4"/>
    <stop offset="0.6" stop-color="#c0b088"/>
    <stop offset="1" stop-color="#5a4c30"/>
    </radialGradient>
    <linearGradient id="lc-bone" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#ece2c4"/>
    <stop offset="1" stop-color="#7a6a48"/>
    </linearGradient>
    <linearGradient id="lc-gold" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#ffe08a"/>
    <stop offset="1" stop-color="#7a5410"/>
    </linearGradient>
    <radialGradient id="lc-soulfire" cx="50%" cy="50%" r="50%">
    <stop offset="0" stop-color="#ffffff"/>
    <stop offset="0.3" stop-color="#8af0ff"/>
    <stop offset="1" stop-color="#1a60c0" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="lc-phyl" cx="40%" cy="35%" r="60%">
    <stop offset="0" stop-color="#d0ffb0"/>
    <stop offset="0.5" stop-color="#40c040"/>
    <stop offset="1" stop-color="#0a3a0a"/>
    </radialGradient>
    <filter id="lc-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="1.6"/></filter>
    <filter id="lc-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1"/></filter>
    </defs>
    
    <ellipse cx="80" cy="155" rx="44" ry="4" fill="#000" opacity="0.55" filter="url(#lc-soft)"/>
    
    <!-- a crackling orb of necrotic cold in the raised hand -->
    <circle cx="128" cy="30" r="20" fill="url(#lc-soulfire)" opacity="0.7"/>
    <g stroke="#c8f8ff" stroke-width="0.8" fill="none" opacity="0.8" stroke-linecap="round">
    <path d="M 116 22 L 121 26 L 118 30 L 124 33"/><path d="M 138 20 L 134 26 L 139 29"/><path d="M 132 42 L 128 38 L 126 44"/>
    </g>
    
    <!-- robe: ragged, embroidered with gold runes -->
    <path d="M 60 58 C 52 90 44 124 36 152 L 44 148 L 50 154 L 60 148 L 70 154 L 80 150 L 90 154 L 100 148 L 110 154 L 116 148 L 124 152 C 116 124 108 90 100 58 Z" fill="url(#lc-robe)" stroke="#050208" stroke-width="1.2"/>
    <path d="M 74 60 L 86 60 L 90 150 L 70 150 Z" fill="#1a0a22" stroke="url(#lc-gold)" stroke-width="0.9"/>
    <g stroke="url(#lc-gold)" stroke-width="0.8" fill="none">
    <path d="M 78 72 L 82 72 L 80 78 Z"/><path d="M 77 90 Q 80 86 83 90 Q 80 94 77 90"/><path d="M 78 108 L 82 112 M 82 108 L 78 112"/>
    <path d="M 77 126 L 83 126 M 80 123 L 80 129"/><path d="M 77 142 Q 80 138 83 142"/>
    </g>
    <g stroke="#050208" stroke-width="1.2" fill="none" opacity="0.8"><path d="M 64 90 Q 58 118 52 146"/><path d="M 96 90 Q 102 118 108 146"/></g>
    <g stroke="#6a3a8a" stroke-width="0.7" fill="none" opacity="0.5"><path d="M 66 92 Q 60 118 55 146"/></g>
    
    <!-- phylactery hanging at the chest -->
    <path d="M 70 60 Q 80 76 90 60" stroke="url(#lc-gold)" stroke-width="0.8" fill="none"/>
    <path d="M 80 68 L 85 74 L 80 82 L 75 74 Z" fill="url(#lc-phyl)" stroke="url(#lc-gold)" stroke-width="0.9"/>
    <circle cx="80" cy="74" r="4" fill="#80ff60" opacity="0.4" filter="url(#lc-glow)"/>
    
    <!-- mantle with a high, spined collar -->
    <path d="M 50 62 Q 58 50 80 50 Q 102 50 110 62 Q 96 70 80 70 Q 64 70 50 62 Z" fill="url(#lc-robe)" stroke="#050208" stroke-width="1"/>
    <path d="M 60 56 L 50 30 L 58 36 L 58 26 L 64 36 L 66 28 L 70 48 Z" fill="url(#lc-robe)" stroke="url(#lc-gold)" stroke-width="0.8"/>
    <path d="M 100 56 L 110 30 L 102 36 L 102 26 L 96 36 L 94 28 L 90 48 Z" fill="url(#lc-robe)" stroke="url(#lc-gold)" stroke-width="0.8"/>
    
    <!-- left arm: skeletal hand clutching a staff topped with a skull -->
    <path d="M 52 64 C 44 74 40 86 38 96 L 46 100 C 48 90 52 80 58 72 Z" fill="url(#lc-robe)" stroke="#050208" stroke-width="0.9"/>
    <path d="M 32 150 L 36 30" stroke="#2a1a10" stroke-width="3" stroke-linecap="round"/>
    <path d="M 32 150 L 36 30" stroke="#6a4a2a" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M 30 28 C 29 20 42 20 42 28 C 42 32 40 34 39 36 L 33 36 C 32 34 30 32 30 28 Z" fill="url(#lc-skull)" stroke="#3a3020" stroke-width="0.6"/>
    <circle cx="33.4" cy="28" r="1.4" fill="#0a1a2a"/><circle cx="38.6" cy="28" r="1.4" fill="#0a1a2a"/>
    <circle cx="33.4" cy="28" r="0.8" fill="#8af0ff" filter="url(#lc-glow)"/><circle cx="38.6" cy="28" r="0.8" fill="#8af0ff" filter="url(#lc-glow)"/>
    <g stroke="url(#lc-bone)" stroke-width="1.4" fill="none" stroke-linecap="round">
    <path d="M 40 96 Q 36 98 34 100"/><path d="M 41 98 Q 37 101 34 103"/><path d="M 42 100 Q 38 104 35 106"/><path d="M 43 96 Q 40 94 36 95"/>
    </g>
    
    <!-- right arm raised, bony fingers spread around the orb -->
    <path d="M 106 62 C 114 58 120 50 122 42 L 128 46 C 124 56 116 66 108 72 Z" fill="url(#lc-robe)" stroke="#050208" stroke-width="0.9"/>
    <g stroke="url(#lc-bone)" stroke-width="1.5" fill="none" stroke-linecap="round">
    <path d="M 123 42 Q 120 36 118 30"/><path d="M 125 41 Q 124 34 124 28"/><path d="M 127 42 Q 130 36 132 31"/><path d="M 128 44 Q 133 42 136 40"/><path d="M 122 44 Q 118 42 115 42"/>
    </g>
    <g fill="url(#lc-bone)"><circle cx="118.5" cy="36" r="0.7"/><circle cx="124" cy="35" r="0.7"/><circle cx="129.5" cy="36" r="0.7"/></g>
    
    <!-- skull with a tarnished crown, soulfire in the sockets -->
    <path d="M 66 34 C 66 22 72 16 80 16 C 88 16 94 22 94 34 C 94 40 91 42 90 46 L 70 46 C 69 42 66 40 66 34 Z" fill="url(#lc-skull)" stroke="#3a3020" stroke-width="1"/>
    <path d="M 71 46 L 89 46 L 88 52 C 84 54 76 54 72 52 Z" fill="url(#lc-skull)" stroke="#3a3020" stroke-width="0.8"/>
    <g stroke="#3a3020" stroke-width="0.5"><path d="M 74 46.5 L 74 51"/><path d="M 77 46.5 L 77 52"/><path d="M 80 46.5 L 80 52.5"/><path d="M 83 46.5 L 83 52"/><path d="M 86 46.5 L 86 51"/></g>
    <path d="M 70 31 C 72 27 77 27 78 31 C 78 36 75 38 72 37 C 70 36 69 34 70 31 Z" fill="#050a10"/>
    <path d="M 82 31 C 83 27 88 27 90 31 C 91 34 90 36 88 37 C 85 38 82 36 82 31 Z" fill="#050a10"/>
    <circle cx="74" cy="33" r="3" fill="#60d8ff" filter="url(#lc-glow)"/>
    <circle cx="86" cy="33" r="3" fill="#60d8ff" filter="url(#lc-glow)"/>
    <circle cx="74" cy="33" r="1.2" fill="#fff"/><circle cx="86" cy="33" r="1.2" fill="#fff"/>
    <path d="M 80 37 L 78 42 L 82 42 Z" fill="#050a10"/>
    <path d="M 88 18 L 86 24 L 89 27" stroke="#5a4c30" stroke-width="0.6" fill="none"/>
    <path d="M 66 22 L 68 10 L 72 18 L 76 6 L 80 16 L 84 6 L 88 18 L 92 10 L 94 22 Q 80 18 66 22 Z" fill="url(#lc-gold)" stroke="#4a3006" stroke-width="0.7"/>
    <circle cx="80" cy="15" r="1.6" fill="#40e040"/><circle cx="72" cy="17" r="1.1" fill="#c040ff"/><circle cx="88" cy="17" r="1.1" fill="#c040ff"/>
    <!-- faint cold glow trailing up from the eyes -->
    <path d="M 72 30 Q 70 24 72 18 M 88 30 Q 90 24 88 18" stroke="#8af0ff" stroke-width="0.8" fill="none" opacity="0.4" filter="url(#lc-soft)"/>
    </svg>
  `,

  'Aboleth': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Aboleth">
    <defs>
    <radialGradient id="ab-skin" cx="40%" cy="30%" r="80%">
    <stop offset="0" stop-color="#8ac8b8"/>
    <stop offset="0.45" stop-color="#3a7a70"/>
    <stop offset="1" stop-color="#0a2a28"/>
    </radialGradient>
    <linearGradient id="ab-belly" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#b8c8a0"/>
    <stop offset="1" stop-color="#5a6a48"/>
    </linearGradient>
    <linearGradient id="ab-tent" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#5a9a8a"/>
    <stop offset="1" stop-color="#1a4a44"/>
    </linearGradient>
    <linearGradient id="ab-water" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#1a3a44" stop-opacity="0.85"/>
    <stop offset="1" stop-color="#040c10" stop-opacity="0.95"/>
    </linearGradient>
    <radialGradient id="ab-eye" cx="45%" cy="40%" r="60%">
    <stop offset="0" stop-color="#ffd0e0"/>
    <stop offset="0.4" stop-color="#e03060"/>
    <stop offset="1" stop-color="#4a0418"/>
    </radialGradient>
    <radialGradient id="ab-mucus" cx="50%" cy="50%" r="50%">
    <stop offset="0" stop-color="#a0ffe0" stop-opacity="0.35"/>
    <stop offset="1" stop-color="#40c0a0" stop-opacity="0"/>
    </radialGradient>
    <filter id="ab-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="1.5"/></filter>
    <filter id="ab-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.2"/></filter>
    </defs>
    
    <!-- tail arching out of the water behind -->
    <path d="M 40 110 C 26 92 20 70 30 50 C 36 40 44 38 46 44 C 36 56 36 76 50 96 Z" fill="url(#ab-skin)" stroke="#041614" stroke-width="1.1"/>
    <path d="M 30 50 L 18 34 L 34 44 L 28 26 L 42 42 Z" fill="#2a5a54" stroke="#041614" stroke-width="0.8"/>
    <g stroke="#1a4a44" stroke-width="0.6" fill="none" opacity="0.8"><path d="M 22 36 L 32 46"/><path d="M 30 30 L 38 42"/></g>
    
    <!-- body, eel-like and swollen -->
    <path d="M 36 112 C 34 88 56 70 86 66 C 110 64 132 72 142 90 C 150 104 146 118 136 122 L 40 122 Z" fill="url(#ab-skin)" stroke="#041614" stroke-width="1.4"/>
    <!-- dorsal fin -->
    <path d="M 60 76 C 66 58 80 50 96 50 C 90 56 88 62 90 68 C 94 60 102 56 110 56 C 106 62 106 66 108 70 Z" fill="#2a5a54" stroke="#041614" stroke-width="0.9"/>
    <g stroke="#1a4a44" stroke-width="0.6" fill="none"><path d="M 68 72 L 80 56"/><path d="M 80 70 L 92 54"/><path d="M 94 68 L 104 58"/></g>
    <!-- mottling and slime sheen -->
    <g fill="#0e3430" opacity="0.6">
    <ellipse cx="62" cy="96" rx="4" ry="2.4"/><ellipse cx="78" cy="84" rx="3" ry="2"/><ellipse cx="100" cy="82" rx="3.4" ry="2"/>
    <ellipse cx="54" cy="108" rx="3" ry="1.8"/><ellipse cx="90" cy="100" rx="2.6" ry="1.6"/>
    </g>
    <path d="M 50 94 C 60 80 80 72 104 70" stroke="#d0fff0" stroke-width="1.6" fill="none" opacity="0.4" stroke-linecap="round"/>
    
    <!-- head, blunt and massive, facing us -->
    <path d="M 100 70 C 118 62 142 68 150 86 C 156 100 150 116 138 120 C 124 124 106 118 100 106 C 94 94 94 78 100 70 Z" fill="url(#ab-skin)" stroke="#041614" stroke-width="1.4"/>
    <!-- the three eyes, stacked up the front of the head -->
    <g>
    <ellipse cx="128" cy="76" rx="4.4" ry="3" fill="#0a1a18"/>
    <ellipse cx="130" cy="86" rx="5" ry="3.4" fill="#0a1a18"/>
    <ellipse cx="131" cy="97" rx="5.4" ry="3.8" fill="#0a1a18"/>
    <g filter="url(#ab-glow)" opacity="0.8">
    <circle cx="128" cy="76" r="3.4" fill="#ff3060"/><circle cx="130" cy="86" r="3.8" fill="#ff3060"/><circle cx="131" cy="97" r="4.2" fill="#ff3060"/>
    </g>
    <ellipse cx="128" cy="76" rx="3.2" ry="2.2" fill="url(#ab-eye)"/>
    <ellipse cx="130" cy="86" rx="3.6" ry="2.5" fill="url(#ab-eye)"/>
    <ellipse cx="131" cy="97" rx="4" ry="2.8" fill="url(#ab-eye)"/>
    <g fill="#140004"><ellipse cx="128" cy="76" rx="0.6" ry="1.9"/><ellipse cx="130" cy="86" rx="0.7" ry="2.2"/><ellipse cx="131" cy="97" rx="0.8" ry="2.5"/></g>
    <g fill="#fff" opacity="0.8"><circle cx="127" cy="75" r="0.7"/><circle cx="129" cy="85" r="0.8"/><circle cx="130" cy="96" r="0.9"/></g>
    </g>
    <!-- underslung mouth with ribbed lips -->
    <path d="M 106 108 C 116 118 136 120 148 110 C 144 116 132 122 120 120 C 112 118 108 114 106 108 Z" fill="#2a0a14" stroke="#041614" stroke-width="0.9"/>
    <path d="M 104 106 C 116 114 136 116 150 106" stroke="url(#ab-belly)" stroke-width="2.4" fill="none"/>
    <g stroke="#3a4a30" stroke-width="0.5"><path d="M 112 110 L 113 113"/><path d="M 120 112 L 120 115"/><path d="M 128 113 L 128 116"/><path d="M 136 112 L 136 115"/><path d="M 143 110 L 143 113"/></g>
    
    <!-- four tentacles, two reaching toward us -->
    <g stroke="#041614" stroke-width="1">
    <path d="M 108 104 C 96 116 84 120 70 118 C 60 117 54 110 58 104 C 62 110 72 112 84 108 C 92 106 98 102 104 98 Z" fill="url(#ab-tent)"/>
    <path d="M 116 112 C 108 130 96 142 78 146 C 70 148 66 144 70 140 C 82 138 94 130 104 116 Z" fill="url(#ab-tent)"/>
    <path d="M 138 116 C 144 132 150 142 158 146 C 160 150 154 152 150 148 C 142 142 136 132 132 118 Z" fill="url(#ab-tent)"/>
    <path d="M 146 100 C 154 92 158 80 156 66 C 156 60 150 60 150 66 C 152 78 148 88 142 94 Z" fill="url(#ab-tent)"/>
    </g>
    <g fill="#c8e8d8" opacity="0.5">
    <circle cx="90" cy="112" r="0.9"/><circle cx="76" cy="114" r="0.8"/><circle cx="64" cy="110" r="0.7"/>
    <circle cx="100" cy="130" r="0.9"/><circle cx="88" cy="138" r="0.8"/><circle cx="76" cy="143" r="0.7"/>
    <circle cx="146" cy="136" r="0.8"/><circle cx="153" cy="80" r="0.8"/>
    </g>
    
    <!-- mucus cloud and the black water it rises from -->
    <ellipse cx="96" cy="118" rx="64" ry="18" fill="url(#ab-mucus)"/>
    <path d="M 0 124 Q 20 120 40 124 Q 60 128 80 124 Q 100 120 120 124 Q 140 128 160 124 L 160 160 L 0 160 Z" fill="url(#ab-water)"/>
    <path d="M 0 124 Q 20 120 40 124 Q 60 128 80 124 Q 100 120 120 124 Q 140 128 160 124" stroke="#6ab8b0" stroke-width="0.9" fill="none" opacity="0.6"/>
    <g stroke="#4a9890" stroke-width="0.6" fill="none" opacity="0.5">
    <ellipse cx="96" cy="130" rx="40" ry="3"/><ellipse cx="96" cy="136" rx="54" ry="4"/><ellipse cx="40" cy="128" rx="12" ry="1.6"/>
    </g>
    <!-- reflections of the eyes in the water -->
    <g fill="#ff3060" opacity="0.25" filter="url(#ab-soft)"><ellipse cx="130" cy="140" rx="3" ry="1"/><ellipse cx="130" cy="146" rx="3.4" ry="1"/></g>
    </svg>
  `,

  'Dracolich': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Dracolich">
    <defs>
    <linearGradient id="dl-bone" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#f4ecd4"/>
    <stop offset="0.6" stop-color="#bcae88"/>
    <stop offset="1" stop-color="#5a4c32"/>
    </linearGradient>
    <radialGradient id="dl-skull" cx="40%" cy="30%" r="75%">
    <stop offset="0" stop-color="#faf4e0"/>
    <stop offset="0.6" stop-color="#c4b690"/>
    <stop offset="1" stop-color="#5a4c32"/>
    </radialGradient>
    <linearGradient id="dl-rag" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#3a3444" stop-opacity="0.9"/>
    <stop offset="1" stop-color="#14101a" stop-opacity="0.7"/>
    </linearGradient>
    <radialGradient id="dl-aura" cx="50%" cy="50%" r="50%">
    <stop offset="0" stop-color="#60ffb0" stop-opacity="0.22"/>
    <stop offset="1" stop-color="#20a060" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="dl-soul" cx="50%" cy="50%" r="50%">
    <stop offset="0" stop-color="#ffffff"/>
    <stop offset="0.4" stop-color="#80ffc0"/>
    <stop offset="1" stop-color="#10a060" stop-opacity="0"/>
    </radialGradient>
    <filter id="dl-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="1.8"/></filter>
    <filter id="dl-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1"/></filter>
    </defs>
    
    <ellipse cx="80" cy="80" rx="80" ry="78" fill="url(#dl-aura)"/>
    <ellipse cx="80" cy="152" rx="56" ry="5" fill="#000" opacity="0.55" filter="url(#dl-soft)"/>
    
    <!-- wings: bare finger-bones hung with rotted membrane -->
    <path d="M 66 72 L 46 36 L 10 22 L 14 30 L 4 54 L 12 58 L 18 82 L 30 80 L 60 94 Z" fill="url(#dl-rag)"/>
    <path d="M 20 40 L 30 48 L 24 52 Z M 12 64 L 22 68 L 16 72 Z M 40 72 L 50 76 L 44 80 Z" fill="#000"/>
    <path d="M 94 70 L 112 22 L 146 4 L 148 16 L 158 28 L 150 38 L 152 54 L 140 54 L 106 82 Z" fill="url(#dl-rag)"/>
    <path d="M 130 22 L 140 26 L 134 32 Z M 138 42 L 146 44 L 140 50 Z M 116 58 L 124 60 L 118 66 Z" fill="#000"/>
    <g stroke="url(#dl-bone)" stroke-linecap="round" fill="none">
    <path d="M 66 72 L 46 36" stroke-width="3.2"/><path d="M 46 36 L 10 22" stroke-width="1.8"/>
    <path d="M 46 36 L 4 54" stroke-width="1.6"/><path d="M 46 36 L 18 82" stroke-width="1.6"/>
    <path d="M 94 70 L 112 22" stroke-width="3.2"/><path d="M 112 22 L 146 4" stroke-width="1.8"/>
    <path d="M 112 22 L 158 28" stroke-width="1.6"/><path d="M 112 22 L 152 54" stroke-width="1.6"/>
    </g>
    <g fill="url(#dl-bone)"><circle cx="46" cy="36" r="2.6"/><circle cx="112" cy="22" r="2.6"/></g>
    
    <!-- tail: a chain of vertebrae -->
    <g fill="url(#dl-bone)" stroke="#3a3020" stroke-width="0.5">
    <circle cx="58" cy="122" r="4"/><circle cx="50" cy="126" r="3.6"/><circle cx="42" cy="130" r="3.3"/><circle cx="35" cy="135" r="3"/>
    <circle cx="30" cy="141" r="2.7"/><circle cx="29" cy="147" r="2.4"/><circle cx="33" cy="151" r="2.1"/><circle cx="39" cy="152" r="1.8"/>
    <path d="M 42 151 L 50 148 L 46 154 Z"/>
    </g>
    <g fill="url(#dl-bone)"><path d="M 50 122 L 49 116 L 53 121 Z"/><path d="M 42 126 L 39 121 L 44 125 Z"/><path d="M 34 131 L 30 127 L 36 131 Z"/></g>
    
    <!-- hind legs: bone -->
    <g stroke="#3a3020" stroke-width="0.6" fill="url(#dl-bone)">
    <path d="M 60 114 L 54 128 L 58 130 L 64 116 Z"/><path d="M 55 129 L 58 142 L 61 141 L 58 128 Z"/>
    <path d="M 100 114 L 106 128 L 102 130 L 96 116 Z"/><path d="M 105 129 L 102 142 L 99 141 L 102 128 Z"/>
    <circle cx="56" cy="129" r="2.4"/><circle cx="104" cy="129" r="2.4"/>
    </g>
    <g fill="url(#dl-bone)">
    <path d="M 56 141 L 51 148 L 58 143 Z"/><path d="M 59 142 L 58 150 L 61 143 Z"/><path d="M 61 141 L 64 148 L 62 141 Z"/>
    <path d="M 104 141 L 109 148 L 102 143 Z"/><path d="M 101 142 L 102 150 L 99 143 Z"/><path d="M 99 141 L 96 148 L 98 141 Z"/>
    </g>
    <!-- pelvis -->
    <path d="M 66 116 C 60 110 66 104 74 108 L 86 108 C 94 104 100 110 94 116 C 88 120 72 120 66 116 Z" fill="url(#dl-bone)" stroke="#3a3020" stroke-width="0.7"/>
    <circle cx="74" cy="113" r="2" fill="#140e08"/><circle cx="86" cy="113" r="2" fill="#140e08"/>
    
    <!-- ribcage around a glowing heart of soulfire -->
    <circle cx="82" cy="96" r="9" fill="url(#dl-soul)" opacity="0.8"/>
    <path d="M 80 72 L 82 108" stroke="url(#dl-bone)" stroke-width="3" stroke-linecap="round"/>
    <g fill="none" stroke="#3a3020" stroke-width="2.6" stroke-linecap="round">
    <path d="M 80 76 C 66 76 60 84 64 92"/><path d="M 81 76 C 96 76 102 84 98 92"/>
    <path d="M 80 84 C 64 84 60 94 64 100"/><path d="M 81 84 C 98 84 102 94 98 100"/>
    <path d="M 81 92 C 66 92 64 100 68 106"/><path d="M 81 92 C 96 92 98 100 94 106"/>
    <path d="M 81 100 C 70 100 70 106 72 110"/><path d="M 82 100 C 92 100 92 106 90 110"/>
    </g>
    <g fill="none" stroke="url(#dl-bone)" stroke-width="1.8" stroke-linecap="round">
    <path d="M 80 76 C 66 76 60 84 64 92"/><path d="M 81 76 C 96 76 102 84 98 92"/>
    <path d="M 80 84 C 64 84 60 94 64 100"/><path d="M 81 84 C 98 84 102 94 98 100"/>
    <path d="M 81 92 C 66 92 64 100 68 106"/><path d="M 81 92 C 96 92 98 100 94 106"/>
    <path d="M 81 100 C 70 100 70 106 72 110"/><path d="M 82 100 C 92 100 92 106 90 110"/>
    </g>
    
    <!-- forelegs, bone claws raised -->
    <g stroke="#3a3020" stroke-width="0.6" fill="url(#dl-bone)">
    <path d="M 66 90 L 56 104 L 59 106 L 69 92 Z"/><path d="M 94 90 L 104 104 L 101 106 L 91 92 Z"/>
    </g>
    <g fill="url(#dl-bone)">
    <path d="M 55 104 L 50 112 L 57 107 Z"/><path d="M 57 106 L 55 114 L 59 107 Z"/>
    <path d="M 105 104 L 110 112 L 103 107 Z"/><path d="M 103 106 L 105 114 L 101 107 Z"/>
    </g>
    
    <!-- neck vertebrae curving up to the skull -->
    <g fill="url(#dl-bone)" stroke="#3a3020" stroke-width="0.5">
    <circle cx="82" cy="72" r="3.6"/><circle cx="85" cy="65" r="3.4"/><circle cx="89" cy="58" r="3.2"/>
    <circle cx="94" cy="52" r="3"/><circle cx="100" cy="47" r="2.9"/><circle cx="106" cy="44" r="2.8"/>
    </g>
    <g fill="url(#dl-bone)"><path d="M 81 69 L 76 64 L 83 67 Z"/><path d="M 86 62 L 82 56 L 88 60 Z"/><path d="M 91 55 L 88 48 L 93 53 Z"/><path d="M 97 49 L 96 42 L 99 47 Z"/></g>
    
    <!-- horns -->
    <path d="M 106 36 C 96 26 86 22 74 22 C 86 26 95 32 102 40 Z" fill="url(#dl-bone)" stroke="#3a3020" stroke-width="0.6"/>
    <path d="M 112 32 C 106 18 98 10 84 6 C 96 14 104 23 108 35 Z" fill="url(#dl-bone)" stroke="#3a3020" stroke-width="0.6"/>
    <!-- skull: open jaws, empty sockets burning green -->
    <path d="M 102 40 C 106 30 120 27 130 32 L 148 38 C 152 40 152 44 148 45.5 L 128 47 C 120 48 110 50 104 53 Z" fill="url(#dl-skull)" stroke="#3a3020" stroke-width="1.2"/>
    <path d="M 106 54 C 114 54 124 54 130 54 L 146 58 C 148 60 146 62 143 61.5 L 126 61 C 118 62 110 60 104 57 Z" fill="url(#dl-skull)" stroke="#3a3020" stroke-width="1"/>
    <path d="M 108 50 L 147 45.5 L 145 57 L 110 55 Z" fill="#0a1a10"/>
    <g fill="#f4ecd4" stroke="#6a5a3a" stroke-width="0.3">
    <path d="M 118 48.2 L 119.5 52.5 L 121 48 Z"/><path d="M 124 47.6 L 125.5 52.5 L 127 47.3 Z"/><path d="M 130 47 L 131.5 51 L 133 46.8 Z"/>
    <path d="M 136 46.5 L 137.5 51.5 L 139 46.3 Z"/><path d="M 142 46 L 143.2 49.5 L 144.5 45.8 Z"/>
    <path d="M 116 54.5 L 117.5 50.5 L 119 54.5 Z"/><path d="M 122 54.5 L 123.5 50 L 125 54.5 Z"/><path d="M 129 55 L 130.5 51 L 132 55.3 Z"/>
    <path d="M 135 56 L 136.5 52 L 138 56.3 Z"/>
    </g>
    <ellipse cx="121" cy="38" rx="6" ry="4" fill="#0a1a10"/>
    <ellipse cx="121" cy="38" rx="4" ry="2.4" fill="#60ffa0" filter="url(#dl-glow)"/>
    <ellipse cx="121" cy="38" rx="1.8" ry="1.2" fill="#e0fff0"/>
    <path d="M 141 40 Q 144 39 146 41 L 143 42 Z" fill="#0a1a10"/>
    <path d="M 128 32 L 126 38 M 110 42 L 114 46" stroke="#5a4c32" stroke-width="0.6" fill="none"/>
    <!-- necrotic breath: a ghostly green-black plume -->
    <g filter="url(#dl-glow)">
    <path d="M 146 52 C 154 58 158 70 156 84 C 152 78 148 80 146 86 C 144 78 140 76 136 78 C 140 70 144 62 146 52 Z" fill="#40e090" opacity="0.5"/>
    </g>
    <path d="M 146 53 C 152 58 154 68 153 78 C 150 74 147 76 146 80 C 144 74 141 73 139 74 C 142 68 144 62 146 53 Z" fill="url(#dl-soul)" opacity="0.8"/>
    <g fill="#a0ffd0"><circle cx="150" cy="94" r="0.9"/><circle cx="140" cy="88" r="0.7"/><circle cx="156" cy="98" r="0.6"/></g>
    </svg>
  `,

  'Nightwalker': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Nightwalker">
    <defs>
    <radialGradient id="nw-void" cx="50%" cy="50%" r="50%">
    <stop offset="0" stop-color="#1a1224"/>
    <stop offset="0.6" stop-color="#0a0610" stop-opacity="0.95"/>
    <stop offset="1" stop-color="#000" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="nw-body" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#1e1628"/>
    <stop offset="1" stop-color="#040208"/>
    </linearGradient>
    <radialGradient id="nw-drain" cx="50%" cy="50%" r="50%">
    <stop offset="0" stop-color="#000" stop-opacity="0.9"/>
    <stop offset="1" stop-color="#000" stop-opacity="0"/>
    </radialGradient>
    <filter id="nw-glow" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="1.6"/></filter>
    <filter id="nw-haze" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.4"/></filter>
    <filter id="nw-wisp" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="0.9"/></filter>
    <linearGradient id="nw-fadegrad" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0.75" stop-color="#fff"/>
    <stop offset="1" stop-color="#000"/>
    </linearGradient>
    <mask id="nw-fade" maskUnits="userSpaceOnUse" x="0" y="0" width="160" height="160">
    <rect x="0" y="0" width="160" height="160" fill="url(#nw-fadegrad)"/>
    </mask>
    </defs>
    
    <g mask="url(#nw-fade)">
    
    <!-- it drinks the light around it -->
    <ellipse cx="80" cy="80" rx="80" ry="80" fill="url(#nw-void)"/>
    
    <!-- an enormous gaunt shape, stooping to fit the corridor, only its edges lit -->
    <path d="M 18 160 C 16 130 22 104 34 86 C 26 70 30 52 44 44 C 52 28 66 18 80 18 C 94 18 108 28 116 44 C 130 52 134 70 126 86 C 138 104 144 130 142 160 Z" fill="url(#nw-body)"/>
    <!-- long arms hanging nearly to the floor, claws spread -->
    <path d="M 40 60 C 22 76 12 104 10 138 L 18 140 C 22 110 30 86 46 72 Z" fill="url(#nw-body)"/>
    <path d="M 120 60 C 138 76 148 104 150 138 L 142 140 C 138 110 130 86 114 72 Z" fill="url(#nw-body)"/>
    <g stroke="#1e1628" stroke-width="2" fill="none" stroke-linecap="round">
    <path d="M 12 138 L 6 152"/><path d="M 14 139 L 12 155"/><path d="M 17 139 L 19 154"/>
    <path d="M 148 138 L 154 152"/><path d="M 146 139 L 148 155"/><path d="M 143 139 L 141 154"/>
    </g>
    <!-- faint violet rim light tracing the silhouette -->
    <g fill="none" stroke="#6a4a9a" stroke-linecap="round" filter="url(#nw-wisp)" opacity="0.8">
    <path d="M 44 44 C 52 28 66 18 80 18 C 94 18 108 28 116 44" stroke-width="1.4"/>
    <path d="M 40 60 C 22 76 12 104 10 138" stroke-width="1.1"/>
    <path d="M 120 60 C 138 76 148 104 150 138" stroke-width="1.1"/>
    <path d="M 34 86 C 26 70 30 52 44 44" stroke-width="0.9" opacity="0.6"/>
    <path d="M 126 86 C 134 70 130 52 116 44" stroke-width="0.9" opacity="0.6"/>
    </g>
    <g fill="none" stroke="#a080d8" stroke-width="0.6" opacity="0.5" stroke-linecap="round">
    <path d="M 6 152 L 12 138"/><path d="M 154 152 L 148 138"/>
    </g>
    <!-- darkness smoking off it -->
    <g fill="#1a1024" opacity="0.8" filter="url(#nw-haze)">
    <ellipse cx="40" cy="36" rx="10" ry="6"/><ellipse cx="122" cy="34" rx="12" ry="6"/><ellipse cx="80" cy="10" rx="16" ry="5"/>
    </g>
    <g fill="none" stroke="#2a1a3a" stroke-width="1.2" opacity="0.7" stroke-linecap="round" filter="url(#nw-wisp)">
    <path d="M 60 22 Q 54 12 60 4"/><path d="M 100 22 Q 106 12 100 2"/><path d="M 30 70 Q 18 64 20 52"/><path d="M 130 70 Q 142 64 140 52"/>
    </g>
    <!-- the head: a hollow of deeper black -->
    <ellipse cx="80" cy="44" rx="16" ry="18" fill="url(#nw-drain)"/>
    <!-- the eyes: two pinpricks of cold white fire -->
    <g filter="url(#nw-glow)">
    <ellipse cx="73" cy="44" rx="3" ry="1.6" fill="#e0e8ff"/>
    <ellipse cx="87" cy="44" rx="3" ry="1.6" fill="#e0e8ff"/>
    </g>
    <ellipse cx="73" cy="44" rx="1.6" ry="0.9" fill="#ffffff"/>
    <ellipse cx="87" cy="44" rx="1.6" ry="0.9" fill="#ffffff"/>
    <!-- a jagged mouth that opens only when it speaks -->
    <path d="M 72 54 L 75 56 L 78 54 L 81 57 L 84 54 L 88 55" stroke="#3a2a4a" stroke-width="0.8" fill="none" opacity="0.8"/>
    </g>
    </svg>
  `,

  'Tarrasque': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Tarrasque">
    <defs>
    <radialGradient id="tq-hide" cx="45%" cy="30%" r="80%">
    <stop offset="0" stop-color="#a8885a"/>
    <stop offset="0.5" stop-color="#5a4424"/>
    <stop offset="1" stop-color="#1a1006"/>
    </radialGradient>
    <radialGradient id="tq-shell" cx="45%" cy="30%" r="75%">
    <stop offset="0" stop-color="#8a8a5a"/>
    <stop offset="0.6" stop-color="#4a4a26"/>
    <stop offset="1" stop-color="#14140a"/>
    </radialGradient>
    <linearGradient id="tq-belly" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#8a7040"/>
    <stop offset="0.5" stop-color="#d8b878"/>
    <stop offset="1" stop-color="#8a7040"/>
    </linearGradient>
    <linearGradient id="tq-horn" x1="0" y1="1" x2="1" y2="0">
    <stop offset="0" stop-color="#3a2a14"/>
    <stop offset="0.5" stop-color="#c0a878"/>
    <stop offset="1" stop-color="#f4ecd0"/>
    </linearGradient>
    <radialGradient id="tq-maw" cx="50%" cy="30%" r="70%">
    <stop offset="0" stop-color="#8a1a14"/>
    <stop offset="1" stop-color="#1a0402"/>
    </radialGradient>
    <radialGradient id="tq-shade" cx="50%" cy="50%" r="50%">
    <stop offset="0" stop-color="#000" stop-opacity="0.7"/>
    <stop offset="1" stop-color="#000" stop-opacity="0"/>
    </radialGradient>
    <pattern id="tq-scales" width="5" height="4" patternUnits="userSpaceOnUse">
    <path d="M 0 4 Q 2.5 0.6 5 4" stroke="#140a02" stroke-width="0.55" fill="none" opacity="0.6"/>
    </pattern>
    <filter id="tq-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="1.4"/></filter>
    </defs>
    
    <!-- carapace: a dome of plates bristling with spikes, behind the head -->
    <path d="M 2 118 C 4 70 36 34 80 30 C 124 34 156 70 158 118 Z" fill="url(#tq-shell)" stroke="#0a0a04" stroke-width="1.4"/>
    <g fill="none" stroke="#14140a" stroke-width="1.1" opacity="0.9">
    <path d="M 22 70 L 40 60 L 58 66 L 60 86 L 42 94 L 24 86 Z"/>
    <path d="M 58 66 L 80 58 L 102 66 L 100 86 L 80 92 L 60 86 Z"/>
    <path d="M 102 66 L 120 60 L 138 70 L 136 86 L 118 94 L 100 86 Z"/>
    <path d="M 40 60 L 50 44 L 70 38 L 80 58"/><path d="M 120 60 L 110 44 L 90 38 L 80 58"/>
    </g>
    <g fill="none" stroke="#b8b888" stroke-width="0.6" opacity="0.35">
    <path d="M 26 72 L 40 64 L 54 69"/><path d="M 62 68 L 80 62 L 98 68"/><path d="M 106 68 L 120 63 L 134 72"/>
    </g>
    <g fill="url(#tq-horn)" stroke="#2a1a08" stroke-width="0.5">
    <path d="M 38 62 L 32 44 L 44 58 Z"/><path d="M 54 50 L 52 30 L 60 48 Z"/><path d="M 72 42 L 74 22 L 78 42 Z"/>
    <path d="M 88 42 L 90 22 L 94 42 Z"/><path d="M 106 50 L 108 30 L 112 48 Z"/><path d="M 122 62 L 128 44 L 118 58 Z"/>
    <path d="M 16 86 L 4 76 L 20 80 Z"/><path d="M 144 86 L 156 76 L 140 80 Z"/>
    </g>
    
    <!-- massive forelegs planted wide -->
    <path d="M 22 106 C 14 120 12 138 16 156 L 42 156 C 42 140 44 124 48 112 Z" fill="url(#tq-hide)" stroke="#0e0802" stroke-width="1.3"/>
    <path d="M 138 106 C 146 120 148 138 144 156 L 118 156 C 118 140 116 124 112 112 Z" fill="url(#tq-hide)" stroke="#0e0802" stroke-width="1.3"/>
    <path d="M 22 106 C 14 120 12 138 16 156 L 42 156 C 42 140 44 124 48 112 Z" fill="url(#tq-scales)"/>
    <path d="M 138 106 C 146 120 148 138 144 156 L 118 156 C 118 140 116 124 112 112 Z" fill="url(#tq-scales)"/>
    <g fill="url(#tq-horn)" stroke="#2a1a08" stroke-width="0.4">
    <path d="M 16 154 L 10 160 L 22 157 Z"/><path d="M 26 156 L 24 160 L 31 157 Z"/><path d="M 36 156 L 38 160 L 41 156 Z"/>
    <path d="M 144 154 L 150 160 L 138 157 Z"/><path d="M 134 156 L 136 160 L 129 157 Z"/><path d="M 124 156 L 122 160 L 119 156 Z"/>
    </g>
    
    <!-- chest -->
    <path d="M 40 100 C 38 120 50 140 80 144 C 110 140 122 120 120 100 Z" fill="url(#tq-hide)" stroke="#0e0802" stroke-width="1.3"/>
    <path d="M 56 110 C 56 124 66 136 80 138 C 94 136 104 124 104 110 Z" fill="url(#tq-belly)" stroke="#4a3818" stroke-width="0.7"/>
    <g stroke="#5a4420" stroke-width="0.8" fill="none" opacity="0.8">
    <path d="M 57 116 Q 80 121 103 116"/><path d="M 60 124 Q 80 129 100 124"/><path d="M 66 131 Q 80 135 94 131"/>
    </g>
    
    <!-- head: huge, low, jaws wide -->
    <path d="M 44 70 C 42 54 58 44 80 44 C 102 44 118 54 116 70 C 116 80 108 88 100 90 L 60 90 C 52 88 44 80 44 70 Z" fill="url(#tq-hide)" stroke="#0e0802" stroke-width="1.5"/>
    <path d="M 44 70 C 42 54 58 44 80 44 C 102 44 118 54 116 70 C 116 80 108 88 100 90 L 60 90 C 52 88 44 80 44 70 Z" fill="url(#tq-scales)"/>
    <!-- great horns sweeping forward from the brow -->
    <path d="M 56 56 C 44 46 36 32 38 14 C 44 26 52 36 64 46 Z" fill="url(#tq-horn)" stroke="#2a1a08" stroke-width="0.7"/>
    <path d="M 104 56 C 116 46 124 32 122 14 C 116 26 108 36 96 46 Z" fill="url(#tq-horn)" stroke="#2a1a08" stroke-width="0.7"/>
    <g stroke="#6a5a38" stroke-width="0.6" fill="none"><path d="M 44 30 L 48 32"/><path d="M 48 38 L 52 40"/><path d="M 116 30 L 112 32"/><path d="M 112 38 L 108 40"/></g>
    <!-- brow ridges and small furious eyes -->
    <path d="M 56 60 Q 66 54 74 62 L 72 64 Q 66 60 58 64 Z" fill="#1a1006"/>
    <path d="M 104 60 Q 94 54 86 62 L 88 64 Q 94 60 102 64 Z" fill="#1a1006"/>
    <ellipse cx="66" cy="65" rx="3.6" ry="2.2" fill="#ffa010" filter="url(#tq-glow)"/>
    <ellipse cx="94" cy="65" rx="3.6" ry="2.2" fill="#ffa010" filter="url(#tq-glow)"/>
    <ellipse cx="66" cy="65" rx="2.4" ry="1.4" fill="#ffe070"/><ellipse cx="94" cy="65" rx="2.4" ry="1.4" fill="#ffe070"/>
    <ellipse cx="66" cy="65" rx="0.5" ry="1.3" fill="#1a0602"/><ellipse cx="94" cy="65" rx="0.5" ry="1.3" fill="#1a0602"/>
    <g fill="#1a1006"><ellipse cx="76" cy="72" rx="1.4" ry="1"/><ellipse cx="84" cy="72" rx="1.4" ry="1"/></g>
    <!-- the maw: gaping, rows of teeth -->
    <path d="M 52 80 C 60 78 100 78 108 80 C 108 100 96 116 80 116 C 64 116 52 100 52 80 Z" fill="url(#tq-maw)" stroke="#0e0802" stroke-width="1.3"/>
    <path d="M 66 106 Q 80 112 94 106 Q 80 116 66 106 Z" fill="#b83a2a" opacity="0.8"/>
    <g fill="#f4ecd0" stroke="#7a6a44" stroke-width="0.35">
    <path d="M 55 80 L 58 90 L 61 80 Z"/><path d="M 62 79 L 65 92 L 68 79 Z"/><path d="M 69 79 L 72 88 L 75 79 Z"/>
    <path d="M 85 79 L 88 88 L 91 79 Z"/><path d="M 92 79 L 95 92 L 98 79 Z"/><path d="M 99 80 L 102 90 L 105 80 Z"/>
    <path d="M 76 79 L 78 86 L 80 79 Z"/><path d="M 80 79 L 82 86 L 84 79 Z"/>
    <path d="M 58 98 L 61 90 L 64 100 Z"/><path d="M 66 106 L 68 96 L 71 108 Z"/><path d="M 75 111 L 77 101 L 80 112 Z"/>
    <path d="M 80 112 L 83 101 L 85 111 Z"/><path d="M 89 108 L 92 96 L 94 106 Z"/><path d="M 96 100 L 99 90 L 102 98 Z"/>
    </g>
    <!-- drool -->
    <path d="M 70 114 C 70 120 69 124 71 126 C 73 126 73 122 72 115 Z" fill="#c8c0a0" opacity="0.7"/>
    <ellipse cx="66" cy="50" rx="10" ry="3.4" transform="rotate(-10 66 50)" fill="#fff" opacity="0.12" filter="url(#tq-glow)"/>
    
    <ellipse cx="80" cy="166" rx="92" ry="44" fill="url(#tq-shade)"/>
    </svg>
  `,

  'Tiamat': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Tiamat">
    <defs>
    <radialGradient id="tm-body" cx="45%" cy="30%" r="80%">
    <stop offset="0" stop-color="#6a4a7a"/>
    <stop offset="0.5" stop-color="#2e1a3a"/>
    <stop offset="1" stop-color="#0c0612"/>
    </radialGradient>
    <linearGradient id="tm-sheen" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#f0f4ff" stop-opacity="0.25"/>
    <stop offset="0.25" stop-color="#1e2a1a" stop-opacity="0.25"/>
    <stop offset="0.5" stop-color="#40c040" stop-opacity="0.25"/>
    <stop offset="0.75" stop-color="#3a70e0" stop-opacity="0.25"/>
    <stop offset="1" stop-color="#e03020" stop-opacity="0.25"/>
    </linearGradient>
    <linearGradient id="tm-membrane" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#4a2a5a"/>
    <stop offset="1" stop-color="#12081a"/>
    </linearGradient>
    <linearGradient id="tm-shade" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#fff" stop-opacity="0.25"/>
    <stop offset="0.5" stop-color="#000" stop-opacity="0"/>
    <stop offset="1" stop-color="#000" stop-opacity="0.45"/>
    </linearGradient>
    <linearGradient id="tm-horn" x1="1" y1="1" x2="0" y2="0">
    <stop offset="0" stop-color="#3a2a1a"/>
    <stop offset="0.5" stop-color="#b8a07a"/>
    <stop offset="1" stop-color="#f0e4c4"/>
    </linearGradient>
    <linearGradient id="tm-gold" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#ffe08a"/>
    <stop offset="1" stop-color="#8a6010"/>
    </linearGradient>
    <pattern id="tm-scales" width="5" height="4" patternUnits="userSpaceOnUse">
    <path d="M 0 4 Q 2.5 0.6 5 4" stroke="#000" stroke-width="0.5" fill="none" opacity="0.5"/>
    </pattern>
    <filter id="tm-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="1.6"/></filter>
    <filter id="tm-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.2"/></filter>
    
    <!-- one dragon head facing right, origin at the back of the skull;
    body parts use currentColor so each <use> sets its own colour -->
    <g id="tm-head">
    <path d="M 2 -8 C -8 -18 -18 -22 -30 -22 C -18 -18 -9 -12 -2 -4 Z" fill="url(#tm-horn)" stroke="#1a1208" stroke-width="0.6"/>
    <path d="M 6 -12 C 0 -26 -8 -34 -22 -38 C -10 -30 -2 -21 2 -9 Z" fill="url(#tm-horn)" stroke="#1a1208" stroke-width="0.6"/>
    <path d="M -2 -4 C 2 -14 16 -17 26 -12 L 44 -6 C 48 -4 48 0 44 1.5 L 24 3 C 16 4 6 6 0 9 Z" fill="currentColor" stroke="#0a0608" stroke-width="1.2"/>
    <path d="M -2 -4 C 2 -14 16 -17 26 -12 L 44 -6 C 48 -4 48 0 44 1.5 L 24 3 C 16 4 6 6 0 9 Z" fill="url(#tm-shade)"/>
    <path d="M -2 -4 C 2 -14 16 -17 26 -12 L 44 -6 C 48 -4 48 0 44 1.5 L 24 3 C 16 4 6 6 0 9 Z" fill="url(#tm-scales)"/>
    <path d="M 4 6 L 43 1.5 L 41 13 L 6 11 Z" fill="#1a0406"/>
    <path d="M 1 10 C 10 10 20 10 26 10 L 42 14 C 44 16 42 18 39 17.5 L 22 17 C 14 18 6 16 0 13 Z" fill="currentColor" stroke="#0a0608" stroke-width="1"/>
    <path d="M 1 10 C 10 10 20 10 26 10 L 42 14 C 44 16 42 18 39 17.5 L 22 17 C 14 18 6 16 0 13 Z" fill="#000" opacity="0.3"/>
    <g fill="#f4ecd4">
    <path d="M 14 4.2 L 15.5 8.5 L 17 4 Z"/><path d="M 22 3.4 L 23.5 8 L 25 3.2 Z"/><path d="M 30 2.8 L 31.5 7 L 33 2.6 Z"/><path d="M 38 2 L 39 5.5 L 40.4 1.8 Z"/>
    <path d="M 12 10.5 L 13.5 6.5 L 15 10.5 Z"/><path d="M 20 10.6 L 21.5 6.2 L 23 10.6 Z"/><path d="M 29 11.2 L 30.5 7.2 L 32 11.4 Z"/>
    </g>
    <path d="M 8 -10 Q 18 -15 28 -10 L 24 -8 Q 17 -11 10 -7 Z" fill="#0a0608" opacity="0.8"/>
    <ellipse cx="18" cy="-5.5" rx="4" ry="2.3" fill="#ffd040" filter="url(#tm-glow)"/>
    <ellipse cx="18" cy="-5.5" rx="3" ry="1.7" fill="#fff0a0"/>
    <ellipse cx="18.3" cy="-5.5" rx="0.6" ry="1.6" fill="#0a0202"/>
    <path d="M 40 -4.5 Q 42 -5.5 43.5 -4" stroke="#0a0608" stroke-width="0.9" fill="none"/>
    </g>
    </defs>
    
    <ellipse cx="80" cy="154" rx="60" ry="5" fill="#000" opacity="0.6" filter="url(#tm-soft)"/>
    
    <!-- vast wings behind everything -->
    <path d="M 66 104 L 40 70 L 4 72 Q 14 84 2 100 Q 18 106 12 122 Q 34 116 58 124 Z" fill="url(#tm-membrane)" stroke="#06020a" stroke-width="1.1"/>
    <path d="M 94 104 L 120 70 L 156 72 Q 146 84 158 100 Q 142 106 148 122 Q 126 116 102 124 Z" fill="url(#tm-membrane)" stroke="#06020a" stroke-width="1.1"/>
    <g stroke="#1a0e22" stroke-linecap="round" fill="none">
    <path d="M 66 104 L 40 70" stroke-width="3.2"/><path d="M 40 70 L 4 72" stroke-width="1.6"/><path d="M 40 70 L 2 100" stroke-width="1.5"/><path d="M 40 70 L 12 122" stroke-width="1.5"/>
    <path d="M 94 104 L 120 70" stroke-width="3.2"/><path d="M 120 70 L 156 72" stroke-width="1.6"/><path d="M 120 70 L 158 100" stroke-width="1.5"/><path d="M 120 70 L 148 122" stroke-width="1.5"/>
    </g>
    
    <!-- five serpentine necks fanning up from the shoulders; each takes its head's colour -->
    <g fill="none" stroke-linecap="round">
    <g stroke="#06020a" stroke-width="12.5">
    <path d="M 64 106 C 40 106 24 90 30 66"/>
    <path d="M 70 101 C 52 90 66 64 52 44"/>
    <path d="M 80 98 C 70 78 92 58 80 32"/>
    <path d="M 90 101 C 108 90 94 64 108 44"/>
    <path d="M 96 106 C 120 106 136 90 130 66"/>
    </g>
    <path d="M 64 106 C 40 106 24 90 30 66" stroke="#d8e4f0" stroke-width="9.5"/>
    <path d="M 70 101 C 52 90 66 64 52 44" stroke="#2a3226" stroke-width="9.5"/>
    <path d="M 80 98 C 70 78 92 58 80 32" stroke="#2e8a36" stroke-width="9.5"/>
    <path d="M 90 101 C 108 90 94 64 108 44" stroke="#2a5ab0" stroke-width="9.5"/>
    <path d="M 96 106 C 120 106 136 90 130 66" stroke="#b02a1c" stroke-width="9.5"/>
    <g stroke="url(#tm-scales)" stroke-width="9.5" opacity="0.8">
    <path d="M 64 106 C 40 106 24 90 30 66"/>
    <path d="M 70 101 C 52 90 66 64 52 44"/>
    <path d="M 80 98 C 70 78 92 58 80 32"/>
    <path d="M 90 101 C 108 90 94 64 108 44"/>
    <path d="M 96 106 C 120 106 136 90 130 66"/>
    </g>
    <g stroke="#fff" stroke-width="1.4" opacity="0.3" transform="translate(-1.6 -1.2)">
    <path d="M 64 106 C 40 106 24 90 30 66"/>
    <path d="M 70 101 C 52 90 66 64 52 44"/>
    <path d="M 80 98 C 70 78 92 58 80 32"/>
    <path d="M 90 101 C 108 90 94 64 108 44"/>
    <path d="M 96 106 C 120 106 136 90 130 66"/>
    </g>
    </g>
    
    <!-- the five heads: white, black, green, blue, red -->
    <use href="#tm-head" color="#e8f0f8" transform="translate(31 64) scale(-0.72 0.72) rotate(-35)"/>
    <use href="#tm-head" color="#2a3226" transform="translate(52 44) scale(-0.72 0.72) rotate(-45)"/>
    <use href="#tm-head" color="#2e8a36" transform="translate(80 34) scale(0.72) rotate(-80)"/>
    <use href="#tm-head" color="#2a5ab0" transform="translate(108 44) scale(0.72) rotate(-45)"/>
    <use href="#tm-head" color="#b02a1c" transform="translate(129 64) scale(0.72) rotate(-35)"/>
    
    <!-- a flicker of each breath -->
    <g filter="url(#tm-glow)" opacity="0.8">
    <circle cx="8" cy="38" r="4" fill="#c0ecff"/>
    <circle cx="152" cy="38" r="4" fill="#ff7a20"/>
    <circle cx="30" cy="14" r="3.4" fill="#b8ff40"/>
    <circle cx="130" cy="14" r="3.4" fill="#a8e0ff"/>
    <circle cx="86" cy="2" r="3" fill="#8aff40"/>
    </g>
    
    <!-- hind legs, tail and body -->
    <path d="M 96 132 C 118 136 136 142 146 152 C 150 156 144 158 140 154 C 132 146 116 142 98 142 Z" fill="url(#tm-body)" stroke="#06020a" stroke-width="1.1"/>
    <path d="M 56 118 C 48 126 48 140 54 148 L 68 148 C 70 138 72 128 70 120 Z" fill="url(#tm-body)" stroke="#06020a" stroke-width="1.2"/>
    <path d="M 104 118 C 112 126 112 140 106 148 L 92 148 C 90 138 88 128 90 120 Z" fill="url(#tm-body)" stroke="#06020a" stroke-width="1.2"/>
    <g fill="url(#tm-horn)">
    <path d="M 52 147 L 48 154 L 55 149 Z"/><path d="M 58 148 L 57 155 L 61 149 Z"/><path d="M 64 148 L 66 154 L 67 148 Z"/>
    <path d="M 108 147 L 112 154 L 105 149 Z"/><path d="M 102 148 L 103 155 L 99 149 Z"/><path d="M 96 148 L 94 154 L 93 148 Z"/>
    </g>
    <path d="M 58 102 C 50 116 54 134 66 142 C 76 148 88 148 96 142 C 108 134 110 116 102 102 C 94 96 66 96 58 102 Z" fill="url(#tm-body)" stroke="#06020a" stroke-width="1.5"/>
    <path d="M 58 102 C 50 116 54 134 66 142 C 76 148 88 148 96 142 C 108 134 110 116 102 102 C 94 96 66 96 58 102 Z" fill="url(#tm-sheen)" opacity="0.4"/>
    <path d="M 58 102 C 50 116 54 134 66 142 C 76 148 88 148 96 142 C 108 134 110 116 102 102 C 94 96 66 96 58 102 Z" fill="url(#tm-scales)"/>
    <!-- a queen's gold: a gem-set collar where the necks join -->
    <path d="M 62 104 Q 80 114 98 104 L 98 108 Q 80 118 62 108 Z" fill="url(#tm-gold)" stroke="#4a3006" stroke-width="0.6"/>
    <g><circle cx="68" cy="108" r="1.4" fill="#ffffff"/><circle cx="74" cy="110.5" r="1.4" fill="#2a3226"/><circle cx="80" cy="111.5" r="1.6" fill="#40c040"/>
    <circle cx="86" cy="110.5" r="1.4" fill="#3a70e0"/><circle cx="92" cy="108" r="1.4" fill="#e03020"/></g>
    <path d="M 64 112 C 60 124 64 136 72 142" stroke="#b890d0" stroke-width="1" fill="none" opacity="0.35"/>
    </svg>
  `,

  'Asmodeus': `
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Asmodeus">
    <defs>
    <radialGradient id="asm-skin" cx="42%" cy="28%" r="80%"><stop offset="0" stop-color="#ff6a4a"/><stop offset="0.4" stop-color="#c0200e"/><stop offset="0.8" stop-color="#5a0604"/><stop offset="1" stop-color="#1a0000"/></radialGradient>
    <linearGradient id="asm-tail" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5a0604"/><stop offset="0.5" stop-color="#d0281a"/><stop offset="1" stop-color="#5a0604"/></linearGradient>
    <linearGradient id="asm-robe" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#050104"/><stop offset="0.45" stop-color="#3a0618"/><stop offset="0.55" stop-color="#2a0412"/><stop offset="1" stop-color="#050104"/></linearGradient>
    <linearGradient id="asm-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2a8"/><stop offset="0.5" stop-color="#d9a52c"/><stop offset="1" stop-color="#5a3a06"/></linearGradient>
    <linearGradient id="asm-horn" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#0a0404"/><stop offset="0.55" stop-color="#3a2826"/><stop offset="1" stop-color="#c8b4a8"/></linearGradient>
    <linearGradient id="asm-wing" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a0610"/><stop offset="0.6" stop-color="#1a0206"/><stop offset="1" stop-color="#050001"/></linearGradient>
    <radialGradient id="asm-ruby" cx="38%" cy="32%" r="65%"><stop offset="0" stop-color="#ffe0e8"/><stop offset="0.35" stop-color="#ff1a3a"/><stop offset="1" stop-color="#3a0008"/></radialGradient>
    <radialGradient id="asm-hell" cx="50%" cy="90%" r="75%"><stop offset="0" stop-color="#ffb02a" stop-opacity="0.75"/><stop offset="0.35" stop-color="#e2380c" stop-opacity="0.45"/><stop offset="0.7" stop-color="#5a0400" stop-opacity="0.2"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
    <radialGradient id="asm-eye" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fffbe0"/><stop offset="0.45" stop-color="#ffd040"/><stop offset="1" stop-color="#ff4a00"/></radialGradient>
    <pattern id="asm-scales" width="6" height="5" patternUnits="userSpaceOnUse"><path d="M 0 5 Q 3 0 6 5" fill="none" stroke="#3a0202" stroke-width="0.5" opacity="0.55"/></pattern>
    <filter id="asm-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="asm-haze" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>
    <filter id="asm-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.2"/></filter>
    </defs>

    <!-- hellfire rising behind and beneath him -->
    <ellipse cx="100" cy="150" rx="92" ry="80" fill="url(#asm-hell)" filter="url(#asm-haze)"/>
    <g filter="url(#asm-haze)" opacity="0.8">
      <path class="lair-flame f1" d="M 20 200 C 10 170 26 150 30 130 C 40 150 50 170 44 200 Z" fill="#ff6a10"/>
      <path class="lair-flame f2" d="M 160 200 C 150 168 166 150 172 128 C 182 150 190 172 184 200 Z" fill="#ff6a10"/>
    </g>
    <!-- the burning sigil of the Nine Hells -->
    <g fill="none" stroke="#ff4a1a" stroke-width="1" opacity="0.4" filter="url(#asm-soft)">
      <circle cx="100" cy="74" r="58"/><circle cx="100" cy="74" r="51"/>
      <path d="M 100 16 L 134 120 L 46 56 L 154 56 L 66 120 Z"/>
    </g>
    <!-- hanging chains -->
    <g stroke="#3a2a26" stroke-width="2.2" stroke-dasharray="5 3" fill="none"><path d="M 14 0 v 70"/><path d="M 186 0 v 60"/></g>

    <!-- vast wings, torn and veined -->
    <path d="M 74 66 C 50 40 26 14 2 8 C 10 24 6 38 0 50 C 16 50 20 62 10 76 C 28 74 32 88 22 104 C 40 98 52 106 50 124 C 60 108 70 104 78 108 Z" fill="url(#asm-wing)" stroke="#000" stroke-width="1.2"/>
    <path d="M 126 66 C 150 40 174 14 198 8 C 190 24 194 38 200 50 C 184 50 180 62 190 76 C 172 74 168 88 178 104 C 160 98 148 106 150 124 C 140 108 130 104 122 108 Z" fill="url(#asm-wing)" stroke="#000" stroke-width="1.2"/>
    <g stroke="#2a0206" stroke-width="2" fill="none" stroke-linecap="round"><path d="M 74 66 L 4 10"/><path d="M 72 74 L 2 50"/><path d="M 72 82 L 12 76"/><path d="M 74 92 L 24 104"/><path d="M 126 66 L 196 10"/><path d="M 128 74 L 198 50"/><path d="M 128 82 L 188 76"/><path d="M 126 92 L 176 104"/></g>
    <g stroke="#ff4a1a" stroke-width="0.6" fill="none" opacity="0.45"><path d="M 40 40 q 6 10 2 22"/><path d="M 160 40 q -6 10 -2 22"/></g>
    <path d="M 30 60 l 6 4 l -4 4 z M 168 64 l -6 4 l 4 4 z" fill="#000"/>

    <!-- THE TAIL: long, red, curling out and around, ending in an arrowhead -->
    <path d="M 112 150 C 150 158 182 150 190 128 C 198 104 180 88 164 96 C 150 104 158 122 172 118" fill="none" stroke="#1a0000" stroke-width="10" stroke-linecap="round"/>
    <path d="M 112 150 C 150 158 182 150 190 128 C 198 104 180 88 164 96 C 150 104 158 122 172 118" fill="none" stroke="url(#asm-tail)" stroke-width="7" stroke-linecap="round"/>
    <path d="M 112 150 C 150 158 182 150 190 128 C 198 104 180 88 164 96" fill="none" stroke="#ff8a6a" stroke-width="1" opacity="0.45"/>
    <g stroke="#3a0202" stroke-width="1"><path d="M 132 155 v -5 M 148 156 v -6 M 164 153 v -6 M 178 146 l -4 -4 M 188 134 l -5 -2 M 190 118 l -5 0"/></g>
    <path d="M 168 112 L 186 114 L 176 126 L 174 118 Z" fill="url(#asm-skin)" stroke="#1a0000" stroke-width="1.2"/>
    <path d="M 168 112 L 186 114 L 176 126" fill="none" stroke="#ff8a6a" stroke-width="0.8" opacity="0.6"/>

    <!-- robes of black and blood-crimson, open over the chest, heavy gold hems -->
    <path d="M 72 76 C 64 116 58 156 52 200 L 148 200 C 142 156 136 116 128 76 Z" fill="url(#asm-robe)" stroke="#000" stroke-width="1.3"/>
    <path d="M 56 190 L 144 190" stroke="url(#asm-gold)" stroke-width="3"/>
    <g fill="none" stroke="url(#asm-gold)" stroke-width="1" opacity="0.75"><path d="M 64 170 q 36 10 72 0"/><path d="M 68 150 q 32 8 64 0"/><path d="M 100 112 L 100 188"/></g>
    <g fill="#d9a52c" opacity="0.8"><path d="M 96 160 l 4 -8 l 4 8 z"/><path d="M 96 180 l 4 -8 l 4 8 z"/></g>

    <!-- a broad, scaled, demonic chest between the robes -->
    <path d="M 78 74 C 72 96 76 112 84 122 L 116 122 C 124 112 128 96 122 74 C 112 68 88 68 78 74 Z" fill="url(#asm-skin)" stroke="#1a0000" stroke-width="1.2"/>
    <path d="M 78 74 C 72 96 76 112 84 122 L 116 122 C 124 112 128 96 122 74 C 112 68 88 68 78 74 Z" fill="url(#asm-scales)"/>
    <g stroke="#3a0202" stroke-width="1.3" fill="none" opacity="0.8"><path d="M 86 82 Q 100 90 114 82"/><path d="M 100 86 L 100 118"/><path d="M 88 100 q 6 3 12 0 M 100 100 q 6 3 12 0"/><path d="M 90 112 q 5 2 10 0 M 100 112 q 5 2 10 0"/></g>
    <!-- glowing veins of hellfire under the skin -->
    <g stroke="#ffb03a" stroke-width="0.7" fill="none" opacity="0.6" filter="url(#asm-soft)"><path d="M 84 90 l 6 6 l -2 8"/><path d="M 116 92 l -5 6 l 2 9"/></g>
    <!-- the ruby amulet of the Lord of the Nine -->
    <path d="M 84 74 Q 100 88 116 74" stroke="url(#asm-gold)" stroke-width="1.8" fill="none"/>
    <circle cx="100" cy="86" r="6" fill="#ff1a3a" filter="url(#asm-glow)"/>
    <path d="M 100 79 L 106 86 L 100 93 L 94 86 Z" fill="url(#asm-ruby)" stroke="url(#asm-gold)" stroke-width="1"/>

    <!-- great shoulder plates of black iron and gold -->
    <path d="M 60 70 C 62 56 76 52 90 58 C 88 70 80 78 66 82 Z" fill="#14080a" stroke="url(#asm-gold)" stroke-width="1.4"/>
    <path d="M 140 70 C 138 56 124 52 110 58 C 112 70 120 78 134 82 Z" fill="#14080a" stroke="url(#asm-gold)" stroke-width="1.4"/>
    <g fill="url(#asm-horn)" stroke="#000" stroke-width="0.6"><path d="M 66 60 L 56 44 L 72 56 Z"/><path d="M 134 60 L 144 44 L 128 56 Z"/></g>

    <!-- one arm holds the ruby rod; the other reaches, clawed, for you -->
    <path d="M 132 80 C 146 92 150 108 146 124" fill="none" stroke="#1a0000" stroke-width="15" stroke-linecap="round"/>
    <path d="M 132 80 C 146 92 150 108 146 124" fill="none" stroke="url(#asm-skin)" stroke-width="12" stroke-linecap="round"/>
    <path d="M 146 124 L 162 40" stroke="url(#asm-gold)" stroke-width="4" stroke-linecap="round"/>
    <path d="M 146 124 L 162 40" stroke="#5a3a06" stroke-width="1" opacity="0.6"/>
    <circle cx="163" cy="36" r="9" fill="#ff1a3a" filter="url(#asm-glow)" opacity="0.7"/>
    <path d="M 163 26 L 171 36 L 163 46 L 155 36 Z" fill="url(#asm-ruby)" stroke="url(#asm-gold)" stroke-width="1.4"/>
    <circle cx="146" cy="124" r="7" fill="url(#asm-skin)" stroke="#1a0000" stroke-width="1"/>
    <path d="M 68 80 C 52 92 42 108 36 124" fill="none" stroke="#1a0000" stroke-width="15" stroke-linecap="round"/>
    <path d="M 68 80 C 52 92 42 108 36 124" fill="none" stroke="url(#asm-skin)" stroke-width="12" stroke-linecap="round"/>
    <g fill="none" stroke="url(#asm-skin)" stroke-width="4.4" stroke-linecap="round"><path d="M 36 124 L 24 130"/><path d="M 36 124 L 26 138"/><path d="M 36 124 L 34 142"/><path d="M 36 124 L 44 140"/></g>
    <g fill="#120404" stroke="#000" stroke-width="0.5"><path d="M 24 130 l -6 1 l 5 2 z"/><path d="M 26 138 l -5 4 l 6 -1 z"/><path d="M 34 142 l -2 6 l 4 -5 z"/><path d="M 44 140 l 2 6 l 0 -6 z"/></g>
    <g fill="#ff6a1a" opacity="0.7" filter="url(#asm-soft)"><circle cx="22" cy="134" r="3"/><circle cx="30" cy="146" r="2"/></g>

    <!-- the head: a long, gaunt devil's face, cruel and amused -->
    <path d="M 82 44 C 80 26 90 16 100 16 C 110 16 120 26 118 44 C 118 56 112 66 104 70 L 100 72 L 96 70 C 88 66 82 56 82 44 Z" fill="url(#asm-skin)" stroke="#1a0000" stroke-width="1.3"/>
    <path d="M 84 40 C 80 46 82 54 86 60 M 116 40 C 120 46 118 54 114 60" stroke="#3a0202" stroke-width="1.2" fill="none"/>
    <!-- pointed ears -->
    <path d="M 82 38 L 70 30 L 80 46 Z M 118 38 L 130 30 L 120 46 Z" fill="url(#asm-skin)" stroke="#1a0000" stroke-width="0.9"/>
    <!-- a crown of great ram's horns, curling, plus a ring of lesser spikes -->
    <path d="M 86 24 C 72 8 50 6 40 18 C 32 30 40 44 52 42 C 46 34 48 24 58 22 C 70 20 78 28 84 34 Z" fill="url(#asm-horn)" stroke="#000" stroke-width="1"/>
    <path d="M 114 24 C 128 8 150 6 160 18 C 168 30 160 44 148 42 C 154 34 152 24 142 22 C 130 20 122 28 116 34 Z" fill="url(#asm-horn)" stroke="#000" stroke-width="1"/>
    <g stroke="#0a0404" stroke-width="0.8" fill="none" opacity="0.7"><path d="M 74 14 q -4 4 -2 8 M 64 12 q -4 6 0 10 M 54 14 q -4 6 0 10"/><path d="M 126 14 q 4 4 2 8 M 136 12 q 4 6 0 10 M 146 14 q 4 6 0 10"/></g>
    <g fill="url(#asm-gold)" stroke="#3a2402" stroke-width="0.5"><path d="M 90 18 L 92 6 L 96 16 Z"/><path d="M 97 16 L 100 2 L 103 16 Z"/><path d="M 104 16 L 108 6 L 110 18 Z"/></g>
    <!-- heavy brow, burning slit eyes -->
    <path d="M 86 36 L 97 41 M 114 36 L 103 41" stroke="#1a0000" stroke-width="2.6" stroke-linecap="round"/>
    <ellipse cx="92" cy="42" rx="4.4" ry="2.4" fill="#ffd040" filter="url(#asm-glow)"/>
    <ellipse cx="108" cy="42" rx="4.4" ry="2.4" fill="#ffd040" filter="url(#asm-glow)"/>
    <ellipse cx="92" cy="42" rx="3.4" ry="1.8" fill="url(#asm-eye)"/><ellipse cx="108" cy="42" rx="3.4" ry="1.8" fill="url(#asm-eye)"/>
    <ellipse cx="92" cy="42" rx="0.7" ry="1.7" fill="#1a0000"/><ellipse cx="108" cy="42" rx="0.7" ry="1.7" fill="#1a0000"/>
    <!-- a hooked nose and a wide, fanged smile -->
    <path d="M 100 44 L 97 52 L 100 54 L 103 52 Z" fill="#7a0a06" stroke="#1a0000" stroke-width="0.6"/>
    <path d="M 88 58 Q 100 68 112 58 Q 100 63 88 58 Z" fill="#1a0000"/>
    <path d="M 89 58.4 L 91 62 L 93 59.4 L 95 63.5 L 97 60 L 99 64 L 101 60 L 103 64 L 105 60 L 107 63.5 L 109 59.4 L 111 58.4" fill="none" stroke="#f4ecd8" stroke-width="1"/>
    <path d="M 90 58 l 1.6 7 l 1.6 -6 M 110 58 l -1.6 7 l -1.6 -6" fill="#f4ecd8"/>
    <!-- a pointed black goatee -->
    <path d="M 94 66 L 100 84 L 106 66 Q 100 70 94 66 Z" fill="#0a0202"/>
    <!-- smoke curling from the horns -->
    <g fill="#3a2a28" opacity="0.45" filter="url(#asm-haze)"><circle cx="44" cy="12" r="6"/><circle cx="156" cy="12" r="6"/><circle cx="100" cy="0" r="7"/></g>
    </svg>
  `,

  'Sanguinid': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Sanguinid">
    <defs>
    <radialGradient id="sg-skin" cx="42%" cy="30%" r="80%">
    <stop offset="0" stop-color="#9ad06a"/>
    <stop offset="0.5" stop-color="#4a7a2a"/>
    <stop offset="1" stop-color="#12260a"/>
    </radialGradient>
    <linearGradient id="sg-belly" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#c8d890"/>
    <stop offset="1" stop-color="#6a7a3a"/>
    </linearGradient>
    <radialGradient id="sg-eye" cx="45%" cy="40%" r="60%">
    <stop offset="0" stop-color="#ffffff"/>
    <stop offset="0.7" stop-color="#f0e8d0"/>
    <stop offset="1" stop-color="#a09070"/>
    </radialGradient>
    <radialGradient id="sg-rad" cx="50%" cy="50%" r="50%">
    <stop offset="0" stop-color="#a0ff40" stop-opacity="0.35"/>
    <stop offset="1" stop-color="#40c020" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="sg-lure" cx="50%" cy="50%" r="50%">
    <stop offset="0" stop-color="#ffffff"/>
    <stop offset="0.35" stop-color="#d0ff60"/>
    <stop offset="1" stop-color="#60c020" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="sg-maw" cx="50%" cy="35%" r="70%">
    <stop offset="0" stop-color="#8a0a14"/>
    <stop offset="1" stop-color="#1a0204"/>
    </radialGradient>
    <linearGradient id="sg-water" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#0a1410" stop-opacity="0.9"/>
    <stop offset="1" stop-color="#000" stop-opacity="1"/>
    </linearGradient>
    <pattern id="sg-diamond" width="6" height="6" patternUnits="userSpaceOnUse">
    <path d="M 3 0 L 6 3 L 3 6 L 0 3 Z" fill="none" stroke="#2a4a14" stroke-width="0.6" opacity="0.7"/>
    </pattern>
    <filter id="sg-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="1.6"/></filter>
    <filter id="sg-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.2"/></filter>
    </defs>
    
    <!-- radioactive glow bleeding into the dark -->
    <ellipse cx="80" cy="86" rx="76" ry="70" fill="url(#sg-rad)"/>
    
    <!-- antenna with a glowing lure -->
    <path d="M 80 30 C 78 20 84 12 82 4" stroke="#2a4a14" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <path d="M 80 30 C 78 20 84 12 82 4" stroke="#7aa84a" stroke-width="1.2" fill="none" stroke-linecap="round"/>
    <circle cx="82" cy="5" r="8" fill="url(#sg-lure)"/>
    <circle cx="82" cy="5" r="2.2" fill="#f0ffc0"/>
    
    <!-- writhing tentacles from its flanks -->
    <g stroke="#0e1e06" stroke-width="0.9">
    <path d="M 40 92 C 26 90 16 80 12 66 C 10 60 16 58 17 64 C 20 76 28 82 42 84 Z" fill="url(#sg-skin)"/>
    <path d="M 120 92 C 134 90 144 80 148 66 C 150 60 144 58 143 64 C 140 76 132 82 118 84 Z" fill="url(#sg-skin)"/>
    <path d="M 38 110 C 22 114 12 124 8 136 C 6 142 12 142 13 137 C 16 128 26 122 40 120 Z" fill="url(#sg-skin)"/>
    <path d="M 122 110 C 138 114 148 124 152 136 C 154 142 148 142 147 137 C 144 128 134 122 120 120 Z" fill="url(#sg-skin)"/>
    </g>
    <g fill="#d8f0a0" opacity="0.5">
    <circle cx="20" cy="72" r="0.8"/><circle cx="26" cy="79" r="0.8"/><circle cx="140" cy="72" r="0.8"/><circle cx="134" cy="79" r="0.8"/>
    <circle cx="14" cy="130" r="0.8"/><circle cx="22" cy="124" r="0.8"/><circle cx="146" cy="130" r="0.8"/><circle cx="138" cy="124" r="0.8"/>
    </g>
    
    <!-- bloated body, hauling itself out of black water -->
    <path d="M 34 130 C 26 100 36 60 80 54 C 124 60 134 100 126 130 Z" fill="url(#sg-skin)" stroke="#0e1e06" stroke-width="1.4"/>
    <path d="M 54 84 C 50 100 52 118 58 130 L 102 130 C 108 118 110 100 106 84 C 96 78 64 78 54 84 Z" fill="url(#sg-belly)"/>
    <path d="M 54 84 C 50 100 52 118 58 130 L 102 130 C 108 118 110 100 106 84 C 96 78 64 78 54 84 Z" fill="url(#sg-diamond)"/>
    <g fill="#2a4a14" opacity="0.6"><ellipse cx="44" cy="96" rx="3" ry="2"/><ellipse cx="116" cy="94" rx="3.2" ry="2"/><ellipse cx="46" cy="116" rx="2.4" ry="1.6"/><ellipse cx="114" cy="114" rx="2.6" ry="1.6"/></g>
    <path d="M 44 82 C 52 68 66 60 80 58" stroke="#e0ffb0" stroke-width="1.6" fill="none" opacity="0.4" stroke-linecap="round"/>
    
    <!-- clawed arms dragging it forward -->
    <path d="M 46 96 C 36 106 32 116 34 126 L 44 126 C 44 118 48 110 54 104 Z" fill="url(#sg-skin)" stroke="#0e1e06" stroke-width="1"/>
    <path d="M 114 96 C 124 106 128 116 126 126 L 116 126 C 116 118 112 110 106 104 Z" fill="url(#sg-skin)" stroke="#0e1e06" stroke-width="1"/>
    <g fill="#e8e4c8" stroke="#4a4630" stroke-width="0.3">
    <path d="M 33 125 L 28 132 L 36 127 Z"/><path d="M 37 126 L 35 134 L 40 127 Z"/><path d="M 41 126 L 42 133 L 44 126 Z"/>
    <path d="M 127 125 L 132 132 L 124 127 Z"/><path d="M 123 126 L 125 134 L 120 127 Z"/><path d="M 119 126 L 118 133 L 116 126 Z"/>
    </g>
    
    <!-- head: bulging eyes on top, a maw full of needle fangs -->
    <path d="M 56 50 C 54 36 66 28 80 28 C 94 28 106 36 104 50 C 104 60 96 68 80 70 C 64 68 56 60 56 50 Z" fill="url(#sg-skin)" stroke="#0e1e06" stroke-width="1.3"/>
    <circle cx="66" cy="38" r="9" fill="url(#sg-skin)" stroke="#0e1e06" stroke-width="1"/>
    <circle cx="94" cy="38" r="9" fill="url(#sg-skin)" stroke="#0e1e06" stroke-width="1"/>
    <circle cx="66" cy="38" r="6.4" fill="url(#sg-eye)"/>
    <circle cx="94" cy="38" r="6.4" fill="url(#sg-eye)"/>
    <circle cx="66" cy="38" r="6.4" fill="none" stroke="#c01020" stroke-width="1.2"/>
    <circle cx="94" cy="38" r="6.4" fill="none" stroke="#c01020" stroke-width="1.2"/>
    <circle cx="67" cy="39" r="3" fill="#8a0a14"/><circle cx="93" cy="39" r="3" fill="#8a0a14"/>
    <circle cx="67" cy="39" r="1.4" fill="#0a0202"/><circle cx="93" cy="39" r="1.4" fill="#0a0202"/>
    <circle cx="65" cy="36.5" r="1.2" fill="#fff"/><circle cx="92" cy="36.5" r="1.2" fill="#fff"/>
    <g stroke="#c01020" stroke-width="0.4" opacity="0.7"><path d="M 60.5 36 L 63 37"/><path d="M 61 41 L 63.5 40"/><path d="M 99.5 36 L 97 37"/><path d="M 99 41 L 96.5 40"/></g>
    <path d="M 60 52 C 64 50 96 50 100 52 C 100 62 92 68 80 68 C 68 68 60 62 60 52 Z" fill="url(#sg-maw)" stroke="#0e1e06" stroke-width="1"/>
    <g fill="#f4f0dc" stroke="#6a6448" stroke-width="0.25">
    <path d="M 62 52 L 63.5 57 L 65 52 Z"/><path d="M 66 51.4 L 67.5 57.5 L 69 51.3 Z"/><path d="M 70 51.2 L 71.5 56 L 73 51.1 Z"/>
    <path d="M 74 51 L 75.5 58 L 77 51 Z"/><path d="M 78 51 L 79.5 56 L 81 51 Z"/><path d="M 82 51 L 83.5 58 L 85 51 Z"/>
    <path d="M 86 51.1 L 87.5 56 L 89 51.2 Z"/><path d="M 90 51.3 L 91.5 57.5 L 93 51.4 Z"/><path d="M 94 52 L 95.5 57 L 97 52 Z"/>
    <path d="M 66 66 L 67.5 61 L 69 66.4 Z"/><path d="M 72 67.4 L 73.5 61 L 75 67.6 Z"/><path d="M 78 67.8 L 79.5 62 L 81 67.8 Z"/>
    <path d="M 85 67.6 L 86.5 61 L 88 67.4 Z"/><path d="M 91 66.4 L 92.5 61 L 94 66 Z"/>
    </g>
    <!-- fresh blood on the chin -->
    <path d="M 72 68 C 72 74 71 78 73 80 C 75 80 75 76 74 69 Z" fill="#a00a14"/>
    <path d="M 86 68 C 86 72 85 75 87 76 C 89 76 89 73 88 68 Z" fill="#a00a14"/>
    
    <!-- black water it's rising from -->
    <path d="M 0 128 Q 20 124 40 128 Q 60 132 80 128 Q 100 124 120 128 Q 140 132 160 128 L 160 160 L 0 160 Z" fill="url(#sg-water)"/>
    <path d="M 0 128 Q 20 124 40 128 Q 60 132 80 128 Q 100 124 120 128 Q 140 132 160 128" stroke="#6ab040" stroke-width="0.9" fill="none" opacity="0.5"/>
    <g stroke="#3a6a24" stroke-width="0.6" fill="none" opacity="0.5"><ellipse cx="80" cy="134" rx="44" ry="3"/><ellipse cx="80" cy="140" rx="58" ry="4"/></g>
    <g fill="#a0ff40" opacity="0.2" filter="url(#sg-soft)"><ellipse cx="66" cy="146" rx="4" ry="1"/><ellipse cx="94" cy="146" rx="4" ry="1"/></g>
    </svg>
  `,

};

// Monsters drawn larger than the standard portrait, as a multiple of it.
const MONSTER_SPRITE_SCALE = {
  'Mongolian Death Worm': 1.3,
  'Giant Leech': 1.1,
  'Giant Shrew': 1.0,
  'Hollow Choir': 1.2,
  'Asmodeus': 2.2,
  'Giant': 1.35,
  'Orc King': 1.25,
  'Manticore': 1.35,
  'Titanoboa': 1.4,
  'Wendigo': 1.35,
  'Ghoul': 1.25,
  'Djinn': 1.4,
  'Phoenix': 1.4,
  'Banshee': 1.3,
  'Unicorn': 1.3,
  'Frost Giant': 1.5,
  'Gold Dragon': 1.4,
  'Giant Spider': 1.15,
  'Stirge Swarm': 1.2,
  'Rust Monster': 1.1,
  'Bugbear': 1.15,
  'Troll': 1.35,
  'Minotaur': 1.35,
  'Werewolf': 1.25,
  'Gargoyle': 1.25,
  'Harpy': 1.2,
  'Hydra': 1.45,
  'Medusa': 1.25,
  'Doppelganger': 1.15,
  'Purple Worm': 1.45,
  'Iron Golem': 1.4,
  'Behir': 1.4,
  'Rakshasa': 1.2,
  'Death Tyrant': 1.35,
  'Demilich': 1.1,
  'Chimera': 1.35,
  'Pit Fiend': 1.45,
  'Balor': 1.5,
  'Marilith': 1.4,
  'Erinyes': 1.3,
};

// Which set of portraits to show: 'classic', or 'horror' (monster-sprites-
// horror.js), chosen in Settings and remembered per browser. A monster
// with no horror version keeps its classic portrait.
let monsterArtStyle = 'classic';
try { monsterArtStyle = localStorage.getItem('sevenLevelsMonsterArt') === 'horror' ? 'horror' : 'classic'; } catch { /* storage blocked */ }
function setMonsterArtStyle(style) {
  monsterArtStyle = style === 'horror' ? 'horror' : 'classic';
  try { localStorage.setItem('sevenLevelsMonsterArt', monsterArtStyle); } catch { /* storage blocked */ }
}

function getMonsterSprite(type) {
  if (monsterArtStyle === 'horror' && typeof HORROR_SPRITES !== 'undefined' && HORROR_SPRITES[type]) return HORROR_SPRITES[type];
  return MONSTER_SPRITES[type] || null;
}

function getMonsterSpriteScale(type) {
  return MONSTER_SPRITE_SCALE[type] || 1;
}
