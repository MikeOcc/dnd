// THE SEVEN LEVELS — inline SVG monster portraits, keyed by MonsterType.
// Each sprite is a self-contained 0..160 viewBox square (frame + creature).
// Sizing is controlled by CSS on the container, not on the <svg> itself.

'use strict';

const MONSTER_SPRITES = {

  'Green Dragon': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Green Dragon">
      <defs><filter id="glow-dragon" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2"/></filter></defs>
      <rect x="4" y="4" width="152" height="152" fill="#04170a" stroke="#33ff33" stroke-width="3"/>
      <rect x="9" y="9" width="142" height="142" fill="none" stroke="#661111" stroke-width="1" opacity="0.5"/>
      <ellipse cx="80" cy="146" rx="55" ry="6" fill="#000000" opacity="0.5"/>

      <path d="M 65 38 L 32 44 Q 52 78 78 65 Z" fill="#123018" stroke="#0a2410" stroke-width="1.5" opacity="0.92"/>
      <path d="M 78 65 L 65 38 L 74 18 Z" fill="#173a1c" opacity="0.9"/>
      <path d="M 65 38 L 74 18 L 58 12 Z" fill="#0f2814" opacity="0.88"/>
      <path d="M 65 38 L 58 12 L 42 18 Z" fill="#173a1c" opacity="0.9"/>
      <path d="M 65 38 L 42 18 L 32 44 Z" fill="#0f2814" opacity="0.88"/>
      <path d="M 78 65 L 65 38" stroke="#0a2410" stroke-width="1.6"/>
      <path d="M 65 38 L 74 18" stroke="#0a2410" stroke-width="1.3"/>
      <path d="M 65 38 L 58 12" stroke="#0a2410" stroke-width="1.3"/>
      <path d="M 65 38 L 42 18" stroke="#0a2410" stroke-width="1.3"/>
      <path d="M 65 38 L 32 44" stroke="#0a2410" stroke-width="1.3"/>
      <path d="M 74 18 L 79 9 L 76 20 Z" fill="#d9cfa8" stroke="#8a7d55" stroke-width="0.8"/>

      <g fill="#245c2e">
        <circle cx="52" cy="97" r="12"/>
        <circle cx="38" cy="90" r="10.5"/>
        <circle cx="24" cy="92" r="9"/>
        <circle cx="13" cy="104" r="7.5"/>
        <circle cx="10" cy="119" r="6.5"/>
        <circle cx="18" cy="133" r="5.5"/>
        <circle cx="14" cy="147" r="4"/>
        <circle cx="7" cy="156" r="3"/>
      </g>
      <path d="M 9 154 L 3 148 L 2 160 L 11 161 Z" fill="#245c2e" stroke="#0a2410" stroke-width="1"/>
      <path d="M 34 86 Q 38 89 42 86" stroke="#123018" stroke-width="1" fill="none" opacity="0.7"/>
      <path d="M 10 100 Q 14 103 18 100" stroke="#123018" stroke-width="1" fill="none" opacity="0.7"/>

      <ellipse cx="48" cy="110" rx="13" ry="17" fill="#245c2e" stroke="#0a2410" stroke-width="2"/>
      <path d="M 40 122 L 36 142 L 50 142 L 52 122 Z" fill="#1f4d28" stroke="#0a2410" stroke-width="1.5"/>
      <path d="M 34 142 L 31 153 L 38 143 Z" fill="#d9cfa8" stroke="#8a7d55" stroke-width="0.6"/>
      <path d="M 40 142 L 39 154 L 45 143 Z" fill="#d9cfa8" stroke="#8a7d55" stroke-width="0.6"/>
      <path d="M 46 142 L 47 154 L 51 143 Z" fill="#d9cfa8" stroke="#8a7d55" stroke-width="0.6"/>
      <path d="M 52 142 L 54 153 L 56 143 Z" fill="#d9cfa8" stroke="#8a7d55" stroke-width="0.6"/>

      <path d="M 50 95 Q 55 68 80 64 Q 106 67 108 96 Q 105 120 80 123 Q 55 120 50 95 Z" fill="#2f8f3f" stroke="#0a2410" stroke-width="2.5"/>
      <path d="M 58 100 Q 80 114 100 100 Q 90 118 78 118 Q 65 116 58 100 Z" fill="#cfe8a0" opacity="0.9"/>
      <path d="M 60 70 Q 80 66 100 70" stroke="#7ed957" stroke-width="1.5" fill="none" opacity="0.4" stroke-linecap="round"/>
      <g stroke="#123018" stroke-width="1" fill="none" opacity="0.75">
        <path d="M 62 78 Q 66 81 70 78"/>
        <path d="M 72 72 Q 76 75 80 72"/>
        <path d="M 84 76 Q 88 79 92 76"/>
        <path d="M 66 96 Q 70 99 74 96"/>
        <path d="M 86 98 Q 90 101 94 98"/>
      </g>

      <path d="M 58 92 L 55 82 L 63 90 Z" fill="#1f6b2b" stroke="#0a2410" stroke-width="0.8"/>
      <path d="M 68 80 L 65 68 L 74 78 Z" fill="#1f6b2b" stroke="#0a2410" stroke-width="0.8"/>
      <path d="M 80 70 L 78 58 L 86 68 Z" fill="#1f6b2b" stroke="#0a2410" stroke-width="0.8"/>
      <path d="M 92 68 L 90 56 L 98 66 Z" fill="#1f6b2b" stroke="#0a2410" stroke-width="0.8"/>

      <ellipse cx="98" cy="100" rx="11" ry="15" fill="#2f8f3f" stroke="#0a2410" stroke-width="2"/>
      <path d="M 92 113 L 89 136 L 103 136 L 104 113 Z" fill="#245c2e" stroke="#0a2410" stroke-width="1.5"/>
      <path d="M 87 136 L 84 147 L 91 137 Z" fill="#d9cfa8" stroke="#8a7d55" stroke-width="0.6"/>
      <path d="M 93 136 L 92 148 L 98 137 Z" fill="#d9cfa8" stroke="#8a7d55" stroke-width="0.6"/>
      <path d="M 99 136 L 100 148 L 104 137 Z" fill="#d9cfa8" stroke="#8a7d55" stroke-width="0.6"/>
      <path d="M 105 136 L 107 147 L 108 137 Z" fill="#d9cfa8" stroke="#8a7d55" stroke-width="0.6"/>

      <path d="M 82 68 Q 96 54 110 48 Q 120 54 114 64 Q 102 66 92 76 Q 82 78 82 68 Z" fill="#3fae4a" stroke="#0a2410" stroke-width="2.5"/>
      <g stroke="#123018" stroke-width="1" fill="none" opacity="0.75">
        <path d="M 92 60 Q 96 63 100 60"/>
        <path d="M 100 54 Q 104 57 108 54"/>
      </g>

      <path d="M 108 48 L 96 38 L 110 52 Z" fill="#1f6b2b" stroke="#0a2410" stroke-width="1"/>
      <path d="M 104 58 L 92 52 L 108 62 Z" fill="#1f6b2b" stroke="#0a2410" stroke-width="1"/>
      <path d="M 116 42 L 100 28 L 123 38 Z" fill="#d9cfa8" stroke="#8a7d55" stroke-width="1"/>

      <path d="M 106 46 L 126 39 L 148 45 L 153 53 L 138 56 L 120 58 L 106 58 Z" fill="#3fae4a" stroke="#0a2410" stroke-width="2.5"/>
      <ellipse cx="118" cy="48" rx="8" ry="5" fill="#7ed957" opacity="0.5"/>

      <path d="M 112 62 L 132 60 L 147 65 L 151 71 L 136 73 L 118 73 Z" fill="#2f8f3f" stroke="#0a2410" stroke-width="2"/>
      <path d="M 148 49 L 144 51 L 148 53 Z" fill="#0a2410"/>

      <path d="M 122 58 L 124 64 L 128 58 Z" fill="#f2eee2"/>
      <path d="M 131 58 L 133 65 L 137 58 Z" fill="#f2eee2"/>
      <path d="M 140 57 L 142 63 L 146 56 Z" fill="#f2eee2"/>
      <path d="M 122 66 L 124 60 L 128 66 Z" fill="#f2eee2"/>
      <path d="M 133 65 L 135 59 L 139 65 Z" fill="#f2eee2"/>

      <path d="M 126 66 Q 121 78 127 88 Q 131 93 125 95 Q 118 90 121 79 Q 119 69 123 64 Z" fill="#c62828" stroke="#5c0f0f" stroke-width="1"/>
      <path d="M 124 68 Q 122 80 126 90" stroke="#8f1c1c" stroke-width="1" fill="none" opacity="0.7"/>

      <path d="M 108 36 L 140 42 L 136 48 L 112 44 Z" fill="#0a2410" opacity="0.92"/>

      <circle cx="129" cy="50" r="4.5" fill="#ffb000" filter="url(#glow-dragon)" opacity="0.75"/>
      <ellipse cx="129" cy="50" rx="7" ry="2.6" fill="#ffb000" transform="rotate(-8 129 50)"/>
      <ellipse cx="129" cy="50" rx="0.9" ry="2" fill="#1a0a00" transform="rotate(-8 129 50)"/>
      <circle cx="127.5" cy="48.8" r="0.6" fill="#ffffff" opacity="0.85"/>
    </svg>
  `,

  'Kobold': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Kobold">
      <defs><filter id="glow-kobold" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="1.6"/></filter></defs>
      <rect x="4" y="4" width="152" height="152" fill="#04170a" stroke="#33ff33" stroke-width="3"/>
      <rect x="9" y="9" width="142" height="142" fill="none" stroke="#661111" stroke-width="1" opacity="0.5"/>
      <ellipse cx="80" cy="146" rx="45" ry="6" fill="#000000" opacity="0.5"/>

      <path d="M 68 116 Q 50 120 40 134 Q 38 138 42 136 Q 52 124 66 120 Z" fill="#7a4a2a" stroke="#3a2210" stroke-width="1.5"/>

      <path d="M 66 118 L 60 132 L 56 144 L 64 144 L 70 130 L 72 118 Z" fill="#7a4a2a" stroke="#3a2210" stroke-width="2"/>
      <path d="M 82 118 L 88 132 L 94 144 L 86 144 L 80 130 L 78 118 Z" fill="#8a5632" stroke="#3a2210" stroke-width="2"/>
      <path d="M 56 144 L 52 150 L 58 145 Z" fill="#d9cfa8"/>
      <path d="M 94 144 L 98 150 L 92 145 Z" fill="#d9cfa8"/>

      <path d="M 64 116 Q 62 90 74 76 Q 88 76 94 92 Q 96 108 88 118 Q 76 124 64 116 Z" fill="#8a5632" stroke="#3a2210" stroke-width="2.2"/>
      <ellipse cx="79" cy="100" rx="9" ry="14" fill="#d8c088" opacity="0.85"/>
      <path d="M 72 94 Q 75 97 78 94" stroke="#3a2210" stroke-width="1" fill="none" opacity="0.7"/>
      <path d="M 80 104 Q 83 107 86 104" stroke="#3a2210" stroke-width="1" fill="none" opacity="0.7"/>

      <path d="M 88 92 Q 100 88 106 78" stroke="#8a5632" stroke-width="7" fill="none" stroke-linecap="round"/>
      <path d="M 104 80 L 122 62" stroke="#c9c9c9" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M 100 84 L 108 76" stroke="#5a4a30" stroke-width="3"/>

      <path d="M 68 68 L 56 48 L 72 62 Z" fill="#8a5632" stroke="#3a2210" stroke-width="1.2"/>
      <path d="M 90 66 L 100 44 L 94 62 Z" fill="#8a5632" stroke="#3a2210" stroke-width="1.2"/>

      <path d="M 70 62 L 82 54 L 98 56 L 104 64 L 98 74 L 84 76 L 72 72 Z" fill="#8a5632" stroke="#3a2210" stroke-width="2.2"/>
      <path d="M 84 54 L 82 46 L 88 53 Z" fill="#d9cfa8" stroke="#8a7d55" stroke-width="0.6"/>

      <path d="M 88 68 Q 96 72 100 66 Q 94 76 86 74 Z" fill="#4a0f0f" stroke="#2a0808" stroke-width="0.8"/>
      <path d="M 90 68 L 92 74 L 94 68 Z" fill="#f2eee2"/>
      <path d="M 84 70 L 86 75 L 88 70 Z" fill="#f2eee2"/>

      <circle cx="88" cy="62" r="3.5" fill="#ff3333" filter="url(#glow-kobold)" opacity="0.7"/>
      <ellipse cx="88" cy="62" rx="4.5" ry="2.3" fill="#ff3333" transform="rotate(-10 88 62)"/>
      <ellipse cx="88" cy="62" rx="0.7" ry="1.6" fill="#1a0000" transform="rotate(-10 88 62)"/>
    </svg>
  `,

  'Goblin': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Goblin">
      <defs><filter id="glow-goblin" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="1.6"/></filter></defs>
      <rect x="4" y="4" width="152" height="152" fill="#04170a" stroke="#33ff33" stroke-width="3"/>
      <rect x="9" y="9" width="142" height="142" fill="none" stroke="#661111" stroke-width="1" opacity="0.5"/>
      <ellipse cx="80" cy="150" rx="45" ry="6" fill="#000000" opacity="0.5"/>

      <path d="M 64 118 L 58 136 L 54 148 L 64 148 L 70 134 L 72 118 Z" fill="#4a7a2a" stroke="#1e3a10" stroke-width="2"/>
      <path d="M 84 118 L 92 134 L 98 148 L 88 148 L 80 136 L 78 118 Z" fill="#5a8a34" stroke="#1e3a10" stroke-width="2"/>
      <path d="M 54 148 L 50 154 L 57 149 Z" fill="#c9b98a"/>
      <path d="M 98 148 L 102 154 L 95 149 Z" fill="#c9b98a"/>

      <path d="M 60 118 Q 56 86 76 74 Q 96 76 98 92 Q 100 110 90 120 Q 74 128 60 118 Z" fill="#5a8a34" stroke="#1e3a10" stroke-width="2.4"/>
      <path d="M 68 96 Q 80 108 90 96 Q 84 116 74 116 Q 66 112 68 96 Z" fill="#8a6a3a" opacity="0.85"/>

      <path d="M 62 96 Q 52 100 48 112" stroke="#5a8a34" stroke-width="7" fill="none" stroke-linecap="round"/>
      <circle cx="46" cy="114" r="5" fill="#4a7a2a" stroke="#1e3a10" stroke-width="1.5"/>

      <path d="M 92 90 Q 104 78 108 62" stroke="#5a8a34" stroke-width="8" fill="none" stroke-linecap="round"/>
      <ellipse cx="110" cy="56" rx="7" ry="9" fill="#5a4630" stroke="#2a2010" stroke-width="1.5" transform="rotate(20 110 56)"/>
      <path d="M 106 50 L 103 44 L 108 48 Z" fill="#8a7d55"/>
      <path d="M 112 48 L 112 41 L 116 47 Z" fill="#8a7d55"/>
      <path d="M 116 54 L 120 48 L 119 55 Z" fill="#8a7d55"/>

      <path d="M 72 66 L 60 56 L 74 62 Z" fill="#5a8a34" stroke="#1e3a10" stroke-width="1"/>
      <path d="M 92 64 L 104 54 L 92 60 Z" fill="#5a8a34" stroke="#1e3a10" stroke-width="1"/>

      <path d="M 74 60 L 86 52 L 100 56 L 102 68 L 94 76 L 80 76 L 72 68 Z" fill="#5a8a34" stroke="#1e3a10" stroke-width="2.2"/>
      <path d="M 98 62 L 106 66 L 98 70 Z" fill="#4a7a2a" stroke="#1e3a10" stroke-width="1"/>

      <path d="M 82 72 Q 94 78 100 70 Q 92 80 80 76 Z" fill="#2a1010" stroke="#150808" stroke-width="0.8"/>
      <path d="M 84 74 L 85 78 L 87 74 Z" fill="#f2eee2"/>
      <path d="M 88 75 L 89 80 L 91 75 Z" fill="#f2eee2"/>
      <path d="M 92 75 L 93 79 L 95 75 Z" fill="#f2eee2"/>
      <path d="M 96 73 L 97 77 L 99 72 Z" fill="#f2eee2"/>

      <path d="M 78 56 L 94 58 L 91 62 L 80 60 Z" fill="#1e3a10" opacity="0.9"/>
      <circle cx="86" cy="62" r="3" fill="#ffcc00" filter="url(#glow-goblin)" opacity="0.7"/>
      <ellipse cx="86" cy="62" rx="3.8" ry="2" fill="#ffcc00" transform="rotate(-8 86 62)"/>
      <ellipse cx="86" cy="62" rx="0.6" ry="1.3" fill="#1a1400" transform="rotate(-8 86 62)"/>
    </svg>
  `,

  'Mold': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Mold">
      <defs><filter id="glow-mold" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="1.8"/></filter></defs>
      <rect x="4" y="4" width="152" height="152" fill="#04170a" stroke="#33ff33" stroke-width="3"/>
      <rect x="9" y="9" width="142" height="142" fill="none" stroke="#661111" stroke-width="1" opacity="0.5"/>
      <ellipse cx="80" cy="146" rx="50" ry="6" fill="#000000" opacity="0.5"/>

      <ellipse cx="60" cy="125" rx="30" ry="20" fill="#5a4a20" stroke="#2a2210" stroke-width="2"/>
      <ellipse cx="95" cy="120" rx="26" ry="22" fill="#6a5a28" stroke="#2a2210" stroke-width="2"/>
      <ellipse cx="78" cy="100" rx="22" ry="18" fill="#7a6a32" stroke="#2a2210" stroke-width="2"/>
      <ellipse cx="110" cy="135" rx="18" ry="14" fill="#5a4a20" stroke="#2a2210" stroke-width="1.8"/>
      <ellipse cx="42" cy="132" rx="16" ry="13" fill="#5a4a20" stroke="#2a2210" stroke-width="1.8"/>

      <path d="M 50 118 Q 60 122 68 116" stroke="#2a2210" stroke-width="1" fill="none" opacity="0.6"/>
      <path d="M 80 128 Q 90 132 100 124" stroke="#2a2210" stroke-width="1" fill="none" opacity="0.6"/>

      <path d="M 65 85 Q 62 70 58 55" stroke="#8a9a4a" stroke-width="1.2" fill="none" opacity="0.7"/>
      <path d="M 85 82 Q 88 66 92 50" stroke="#8a9a4a" stroke-width="1.2" fill="none" opacity="0.7"/>
      <path d="M 100 90 Q 106 76 112 62" stroke="#8a9a4a" stroke-width="1" fill="none" opacity="0.6"/>
      <circle cx="58" cy="55" r="1.5" fill="#ccff33" opacity="0.8"/>
      <circle cx="92" cy="50" r="1.5" fill="#ccff33" opacity="0.8"/>
      <circle cx="112" cy="62" r="1.3" fill="#ccff33" opacity="0.7"/>

      <circle cx="70" cy="88" r="7" fill="#9acd32" stroke="#4a5a10" stroke-width="1.5"/>
      <circle cx="70" cy="88" r="4" fill="#ccff33" filter="url(#glow-mold)" opacity="0.7"/>
      <circle cx="71" cy="89" r="1.5" fill="#2a3a08"/>
      <circle cx="95" cy="92" r="5" fill="#9acd32" stroke="#4a5a10" stroke-width="1.2"/>
      <circle cx="96" cy="93" r="1.2" fill="#2a3a08"/>
      <circle cx="52" cy="108" r="4" fill="#9acd32" stroke="#4a5a10" stroke-width="1.2"/>
      <circle cx="53" cy="109" r="1" fill="#2a3a08"/>

      <ellipse cx="45" cy="144" rx="3" ry="5" fill="#3a3010" opacity="0.7"/>
      <ellipse cx="100" cy="146" rx="3" ry="5" fill="#3a3010" opacity="0.7"/>
    </svg>
  `,

  'Slime Mold': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Slime Mold">
      <rect x="4" y="4" width="152" height="152" fill="#04170a" stroke="#33ff33" stroke-width="3"/>
      <rect x="9" y="9" width="142" height="142" fill="none" stroke="#661111" stroke-width="1" opacity="0.5"/>
      <ellipse cx="80" cy="146" rx="50" ry="6" fill="#000000" opacity="0.5"/>

      <ellipse cx="80" cy="115" rx="42" ry="32" fill="#8ac93c" opacity="0.55" stroke="#4a6a10" stroke-width="2"/>
      <ellipse cx="65" cy="95" rx="22" ry="20" fill="#9ade4a" opacity="0.5"/>
      <ellipse cx="100" cy="100" rx="20" ry="18" fill="#9ade4a" opacity="0.5"/>

      <path d="M 40 118 Q 35 90 65 78 Q 90 68 112 85 Q 128 98 120 122 Q 118 140 95 145 Q 70 150 50 142 Q 36 138 40 118 Z" fill="none" stroke="#4a6a10" stroke-width="2.5" opacity="0.9"/>

      <circle cx="75" cy="118" r="6" fill="#2a3a10" opacity="0.35"/>
      <path d="M 90 125 L 100 128 L 98 132 L 88 129 Z" fill="#2a3a10" opacity="0.3"/>
      <circle cx="60" cy="125" r="3" fill="#3a3010" opacity="0.3"/>

      <ellipse cx="58" cy="88" rx="12" ry="8" fill="#e8ffb0" opacity="0.6"/>
      <ellipse cx="95" cy="85" rx="6" ry="4" fill="#e8ffb0" opacity="0.5"/>
      <circle cx="68" cy="92" r="2" fill="#ffffff" opacity="0.5"/>
      <circle cx="72" cy="93" r="1.2" fill="#ffffff" opacity="0.6"/>

      <path d="M 50 140 Q 48 150 52 156" stroke="#8ac93c" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.7"/>
      <path d="M 105 142 Q 108 152 104 158" stroke="#8ac93c" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.7"/>
      <path d="M 78 144 Q 80 154 76 160" stroke="#8ac93c" stroke-width="3.5" fill="none" stroke-linecap="round" opacity="0.7"/>
    </svg>
  `,

  'Gelatinous Cube': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Gelatinous Cube">
      <rect x="4" y="4" width="152" height="152" fill="#04170a" stroke="#33ff33" stroke-width="3"/>
      <rect x="9" y="9" width="142" height="142" fill="none" stroke="#661111" stroke-width="1" opacity="0.5"/>
      <ellipse cx="80" cy="146" rx="50" ry="6" fill="#000000" opacity="0.5"/>

      <path d="M 35 55 Q 80 45 125 55 Q 132 60 130 135 Q 128 142 80 145 Q 32 142 30 135 Q 28 60 35 55 Z" fill="#7ac9c9" opacity="0.45" stroke="#2a6a6a" stroke-width="2.5"/>
      <path d="M 35 55 Q 80 45 125 55 Q 100 62 80 62 Q 60 62 35 55 Z" fill="#a8e8e8" opacity="0.4"/>
      <path d="M 125 55 Q 132 60 130 135 Q 128 142 100 144 Q 105 100 105 62 Q 118 58 125 55 Z" fill="#3a8a8a" opacity="0.35"/>

      <circle cx="65" cy="100" r="8" fill="#3a3a3a" opacity="0.55"/>
      <path d="M 60 104 L 70 104" stroke="#2a2a2a" stroke-width="1.5" opacity="0.5"/>
      <path d="M 90 115 L 105 122 L 103 126 L 88 119 Z" fill="#c9c9b0" opacity="0.5"/>
      <path d="M 55 70 L 60 115" stroke="#8a8a9a" stroke-width="2.5" opacity="0.45"/>
      <path d="M 52 74 L 63 74" stroke="#8a8a9a" stroke-width="2" opacity="0.45"/>
      <circle cx="95" cy="80" r="3" fill="#d4af37" opacity="0.55"/>
      <circle cx="100" cy="85" r="2.5" fill="#d4af37" opacity="0.55"/>
      <circle cx="90" cy="88" r="2" fill="#d4af37" opacity="0.5"/>

      <path d="M 35 55 Q 80 45 125 55" stroke="#e8ffff" stroke-width="1.5" fill="none" opacity="0.6"/>
      <path d="M 30 135 L 35 55" stroke="#e8ffff" stroke-width="1" fill="none" opacity="0.4"/>

      <circle cx="75" cy="65" r="1.5" fill="#ffffff" opacity="0.5"/>
      <circle cx="110" cy="95" r="1.2" fill="#ffffff" opacity="0.5"/>
      <circle cx="50" cy="95" r="1.3" fill="#ffffff" opacity="0.45"/>

      <path d="M 60 142 Q 58 150 62 154" stroke="#7ac9c9" stroke-width="3" fill="none" opacity="0.5" stroke-linecap="round"/>
    </svg>
  `,

  'Skeleton': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Skeleton">
      <defs><filter id="glow-skeleton" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="1.6"/></filter></defs>
      <rect x="4" y="4" width="152" height="152" fill="#04170a" stroke="#33ff33" stroke-width="3"/>
      <rect x="9" y="9" width="142" height="142" fill="none" stroke="#661111" stroke-width="1" opacity="0.5"/>
      <ellipse cx="80" cy="148" rx="45" ry="6" fill="#000000" opacity="0.5"/>

      <ellipse cx="66" cy="112" rx="5" ry="15" fill="#d8d0b8" stroke="#4a4438" stroke-width="1.5"/>
      <circle cx="65" cy="126" r="4" fill="#d8d0b8" stroke="#4a4438" stroke-width="1.2"/>
      <ellipse cx="63" cy="140" rx="4" ry="14" fill="#d8d0b8" stroke="#4a4438" stroke-width="1.5"/>
      <path d="M 58 152 L 70 152 L 68 156 L 60 156 Z" fill="#c8c0a8" stroke="#4a4438" stroke-width="1"/>

      <ellipse cx="86" cy="110" rx="5" ry="15" fill="#e8e0c8" stroke="#4a4438" stroke-width="1.5"/>
      <circle cx="88" cy="124" r="4" fill="#e8e0c8" stroke="#4a4438" stroke-width="1.2"/>
      <ellipse cx="90" cy="138" rx="4" ry="14" fill="#e8e0c8" stroke="#4a4438" stroke-width="1.5"/>
      <path d="M 84 150 L 97 150 L 96 155 L 86 155 Z" fill="#d8d0b8" stroke="#4a4438" stroke-width="1"/>

      <path d="M 60 108 L 92 106 L 88 118 L 64 118 Z" fill="#d8d0b8" stroke="#4a4438" stroke-width="1.5"/>
      <path d="M 76 106 L 78 66" stroke="#c8c0a8" stroke-width="3" stroke-linecap="round"/>

      <g stroke="#c8c0a8" stroke-width="2" fill="none" stroke-linecap="round">
        <path d="M 76 76 Q 64 78 62 86"/>
        <path d="M 76 84 Q 64 86 62 94"/>
        <path d="M 76 92 Q 65 94 63 101"/>
      </g>
      <g stroke="#e8e0c8" stroke-width="2" fill="none" stroke-linecap="round">
        <path d="M 76 76 Q 90 78 93 86"/>
        <path d="M 76 84 Q 90 86 93 94"/>
        <path d="M 76 92 Q 89 94 92 101"/>
      </g>

      <path d="M 82 80 L 78 100 L 86 96 L 84 112 L 90 102 L 88 82 Z" fill="#3a3428" opacity="0.85"/>

      <path d="M 66 88 Q 58 96 56 108" stroke="#d8d0b8" stroke-width="4.5" fill="none" stroke-linecap="round"/>
      <circle cx="56" cy="108" r="2.5" fill="#d8d0b8" stroke="#4a4438" stroke-width="1"/>

      <path d="M 88 88 Q 100 84 108 72" stroke="#e8e0c8" stroke-width="5" fill="none" stroke-linecap="round"/>
      <circle cx="108" cy="70" r="3" fill="#e8e0c8" stroke="#4a4438" stroke-width="1"/>
      <path d="M 108 70 L 132 48 L 136 52 L 114 76 Z" fill="#8a7050" stroke="#4a3820" stroke-width="1.2"/>
      <path d="M 104 74 L 112 66" stroke="#4a3820" stroke-width="2.5"/>
      <path d="M 108 71 L 114 77" stroke="#3a2a10" stroke-width="2"/>

      <path d="M 68 56 L 74 46 L 86 44 L 94 50 L 96 60 L 90 68 L 76 70 L 68 64 Z" fill="#e8e0c8" stroke="#4a4438" stroke-width="2"/>
      <path d="M 78 46 L 82 52" stroke="#4a4438" stroke-width="0.8" opacity="0.6"/>
      <path d="M 74 66 L 88 65 L 92 74 L 80 76 L 72 72 Z" fill="#d8d0b8" stroke="#4a4438" stroke-width="1.5"/>
      <rect x="76" y="67" width="2" height="4" fill="#f5f0e0"/>
      <rect x="80" y="67" width="2" height="4" fill="#f5f0e0"/>
      <rect x="84" y="67" width="2" height="4" fill="#f5f0e0"/>
      <path d="M 88 54 L 91 58 L 87 59 Z" fill="#1a1610"/>

      <circle cx="84" cy="52" r="5" fill="#1a1610"/>
      <circle cx="84" cy="52" r="3" fill="#aaffee" filter="url(#glow-skeleton)" opacity="0.6"/>
      <circle cx="84" cy="52" r="1.3" fill="#e8ffff" opacity="0.9"/>
    </svg>
  `,

  'Zombie': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Zombie">
      <rect x="4" y="4" width="152" height="152" fill="#04170a" stroke="#33ff33" stroke-width="3"/>
      <rect x="9" y="9" width="142" height="142" fill="none" stroke="#661111" stroke-width="1" opacity="0.5"/>
      <ellipse cx="80" cy="148" rx="48" ry="6" fill="#000000" opacity="0.5"/>

      <path d="M 62 118 L 54 134 L 48 150 L 58 150 L 66 134 L 70 118 Z" fill="#5a6e4a" stroke="#2a3a1a" stroke-width="2"/>
      <path d="M 84 120 L 96 128 L 106 146 L 96 148 L 86 132 L 80 120 Z" fill="#4a5e3a" stroke="#2a3a1a" stroke-width="2"/>
      <path d="M 48 150 L 44 156 L 54 154 Z" fill="#3a4a2a"/>
      <path d="M 96 148 L 108 150 L 100 156 Z" fill="#3a4a2a"/>

      <path d="M 58 118 Q 52 90 68 76 Q 86 70 96 84 Q 100 100 92 116 Q 76 128 58 118 Z" fill="#5a6e4a" stroke="#2a3a1a" stroke-width="2.4"/>

      <path d="M 72 96 Q 80 92 86 98 Q 82 106 74 104 Z" fill="#3a2818" opacity="0.85" stroke="#1a1208" stroke-width="1"/>
      <path d="M 76 98 Q 79 100 82 98" stroke="#d8d0b8" stroke-width="1.3" fill="none"/>
      <path d="M 75 102 Q 79 104 83 101" stroke="#d8d0b8" stroke-width="1.3" fill="none"/>

      <ellipse cx="64" cy="88" rx="5" ry="7" fill="#2a3a1a" opacity="0.6" transform="rotate(20 64 88)"/>
      <ellipse cx="90" cy="108" rx="6" ry="4" fill="#2a3a1a" opacity="0.55"/>

      <path d="M 60 92 L 52 108 L 58 116 L 62 100 Z" fill="#2a2a20" opacity="0.9"/>
      <path d="M 90 88 L 98 100 L 92 110 L 86 96 Z" fill="#2a2a20" opacity="0.85"/>

      <path d="M 94 92 Q 108 98 112 116" stroke="#4a5e3a" stroke-width="8" fill="none" stroke-linecap="round"/>
      <ellipse cx="113" cy="119" rx="5" ry="4" fill="#4a5e3a" stroke="#2a3a1a" stroke-width="1.3"/>
      <path d="M 116 116 L 120 112 L 118 117 Z" fill="#4a5e3a"/>
      <path d="M 117 120 L 122 118 L 118 122 Z" fill="#4a5e3a"/>

      <path d="M 62 94 Q 54 102 52 114" stroke="#5a6e4a" stroke-width="7" fill="none" stroke-linecap="round"/>
      <ellipse cx="51" cy="116" rx="4" ry="3.5" fill="#5a6e4a" stroke="#2a3a1a" stroke-width="1.2"/>

      <path d="M 70 66 L 78 56 L 92 58 L 98 68 L 94 80 L 80 82 L 70 76 Z" fill="#5a6e4a" stroke="#2a3a1a" stroke-width="2.2" transform="rotate(8 84 69)"/>
      <ellipse cx="84" cy="72" rx="6" ry="4" fill="#3a4a2a" opacity="0.6"/>

      <path d="M 78 60 L 94 60 L 92 65 L 80 64 Z" fill="#2a3a1a" opacity="0.8"/>
      <ellipse cx="88" cy="64" rx="4.5" ry="3" fill="#c8c8b8" opacity="0.85"/>
      <circle cx="89.5" cy="64.5" r="1.3" fill="#5a5a4a"/>

      <path d="M 82 76 Q 90 82 96 76 Q 90 86 80 82 Z" fill="#1a1410" stroke="#0a0806" stroke-width="0.8"/>
      <path d="M 86 78 L 87 82 L 89 78 Z" fill="#d8d0b8"/>
      <path d="M 90 78 L 91 81 L 93 77 Z" fill="#d8d0b8"/>
      <path d="M 84 84 Q 83 90 85 94" stroke="#8a9a6a" stroke-width="1.5" fill="none" opacity="0.7" stroke-linecap="round"/>
    </svg>
  `,

  'Orc': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Orc">
      <defs><filter id="glow-orc" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="1.6"/></filter></defs>
      <rect x="4" y="4" width="152" height="152" fill="#04170a" stroke="#33ff33" stroke-width="3"/>
      <rect x="9" y="9" width="142" height="142" fill="none" stroke="#661111" stroke-width="1" opacity="0.5"/>
      <ellipse cx="80" cy="150" rx="50" ry="6" fill="#000000" opacity="0.5"/>

      <path d="M 62 118 L 54 138 L 48 152 L 60 152 L 68 136 L 72 118 Z" fill="#4a6a2a" stroke="#1e2e10" stroke-width="2.2"/>
      <path d="M 86 118 L 96 136 L 104 152 L 92 152 L 82 136 L 78 118 Z" fill="#5a7a34" stroke="#1e2e10" stroke-width="2.2"/>
      <path d="M 48 152 L 43 159 L 51 153 Z" fill="#c9b98a"/>
      <path d="M 104 152 L 109 159 L 99 153 Z" fill="#c9b98a"/>

      <path d="M 56 118 Q 50 82 78 68 Q 104 70 108 90 Q 110 110 98 122 Q 76 132 56 118 Z" fill="#5a7a34" stroke="#1e2e10" stroke-width="2.6"/>
      <path d="M 68 90 Q 78 96 88 90" stroke="#3e5a20" stroke-width="1.5" fill="none" opacity="0.7"/>
      <path d="M 66 104 Q 78 110 90 104" stroke="#3e5a20" stroke-width="1.5" fill="none" opacity="0.7"/>
      <path d="M 70 100 Q 82 112 94 100 Q 86 118 78 118 Q 70 116 70 100 Z" fill="#6a5a3a" opacity="0.75"/>

      <path d="M 96 82 L 110 78 L 112 88 L 98 92 Z" fill="#5a4a30" stroke="#2a2010" stroke-width="1.3"/>
      <path d="M 106 78 L 108 70 L 112 79 Z" fill="#8a7d55"/>

      <path d="M 98 86 Q 112 72 116 54" stroke="#5a7a34" stroke-width="9" fill="none" stroke-linecap="round"/>
      <path d="M 112 40 L 128 34 L 134 44 L 128 56 L 116 52 L 118 46 Z" fill="#8a8a90" stroke="#3a3a3e" stroke-width="1.5"/>
      <path d="M 114 52 L 122 36" stroke="#5a4630" stroke-width="3"/>

      <path d="M 62 94 Q 50 98 44 110" stroke="#5a7a34" stroke-width="8" fill="none" stroke-linecap="round"/>
      <circle cx="42" cy="112" r="6" fill="#4a6a2a" stroke="#1e2e10" stroke-width="1.6"/>

      <path d="M 74 68 L 64 58 L 76 64 Z" fill="#5a7a34" stroke="#1e2e10" stroke-width="1"/>
      <path d="M 92 66 L 102 56 L 92 62 Z" fill="#5a7a34" stroke="#1e2e10" stroke-width="1"/>

      <path d="M 74 58 L 88 50 L 102 54 L 106 66 L 98 76 L 82 78 L 72 70 Z" fill="#5a7a34" stroke="#1e2e10" stroke-width="2.4"/>
      <path d="M 78 54 L 98 56 L 95 61 L 80 59 Z" fill="#1e2e10" opacity="0.9"/>

      <path d="M 90 74 L 88 64 L 94 72 Z" fill="#f0ead8" stroke="#a89868" stroke-width="0.8"/>
      <path d="M 98 72 L 98 62 L 103 70 Z" fill="#f0ead8" stroke="#a89868" stroke-width="0.8"/>
      <path d="M 84 74 Q 94 78 100 72" stroke="#1e2e10" stroke-width="1.5" fill="none" opacity="0.8"/>

      <circle cx="90" cy="60" r="3" fill="#ffaa22" filter="url(#glow-orc)" opacity="0.65"/>
      <ellipse cx="90" cy="60" rx="3.5" ry="1.8" fill="#ffaa22" transform="rotate(-8 90 60)"/>
      <ellipse cx="90" cy="60" rx="0.6" ry="1.1" fill="#1a1400" transform="rotate(-8 90 60)"/>
    </svg>
  `,

  'Owlbear': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Owlbear">
      <defs><filter id="glow-owlbear" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="1.8"/></filter></defs>
      <rect x="4" y="4" width="152" height="152" fill="#04170a" stroke="#33ff33" stroke-width="3"/>
      <rect x="9" y="9" width="142" height="142" fill="none" stroke="#661111" stroke-width="1" opacity="0.5"/>
      <ellipse cx="80" cy="150" rx="48" ry="6" fill="#000000" opacity="0.5"/>

      <path d="M 60 116 L 52 136 L 46 152 L 60 152 L 68 134 L 70 116 Z" fill="#6a4a2a" stroke="#3a2810" stroke-width="2.2"/>
      <path d="M 84 116 L 94 134 L 102 152 L 88 152 L 78 134 L 76 116 Z" fill="#7a5a34" stroke="#3a2810" stroke-width="2.2"/>
      <path d="M 46 152 L 41 160 L 49 153 Z" fill="#2a1a0a"/>
      <path d="M 53 152 L 51 161 L 58 153 Z" fill="#2a1a0a"/>
      <path d="M 102 152 L 107 160 L 99 153 Z" fill="#2a1a0a"/>
      <path d="M 95 152 L 97 161 L 90 153 Z" fill="#2a1a0a"/>

      <path d="M 54 118 Q 48 80 76 66 Q 106 68 110 90 Q 112 112 98 124 Q 74 134 54 118 Z" fill="#7a5a34" stroke="#3a2810" stroke-width="2.6"/>
      <path d="M 64 84 L 66 80 L 68 84" stroke="#5a3e20" stroke-width="1.2" fill="none"/>
      <path d="M 74 78 L 76 74 L 78 78" stroke="#5a3e20" stroke-width="1.2" fill="none"/>
      <path d="M 84 76 L 86 72 L 88 76" stroke="#5a3e20" stroke-width="1.2" fill="none"/>
      <path d="M 70 100 L 72 96 L 74 100" stroke="#5a3e20" stroke-width="1.2" fill="none"/>
      <path d="M 88 102 L 90 98 L 92 102" stroke="#5a3e20" stroke-width="1.2" fill="none"/>
      <path d="M 64 98 Q 78 110 92 98 Q 84 118 74 118 Q 66 114 64 98 Z" fill="#c9b070" opacity="0.7"/>

      <path d="M 98 88 Q 110 82 116 68" stroke="#7a5a34" stroke-width="8" fill="none" stroke-linecap="round"/>
      <path d="M 114 66 L 120 58 L 116 68 Z" fill="#2a1a0a"/>
      <path d="M 117 68 L 124 62 L 119 70 Z" fill="#2a1a0a"/>
      <path d="M 111 64 L 116 55 L 113 66 Z" fill="#2a1a0a"/>

      <path d="M 76 58 L 70 42 L 80 54 Z" fill="#6a4a2a" stroke="#3a2810" stroke-width="1"/>
      <path d="M 92 56 L 100 40 L 94 52 Z" fill="#6a4a2a" stroke="#3a2810" stroke-width="1"/>

      <circle cx="86" cy="56" r="16" fill="#8a6a3a" stroke="#5a3e20" stroke-width="1.5" opacity="0.9"/>
      <path d="M 96 58 L 106 62 L 98 66 Z" fill="#c9b060" stroke="#8a7040" stroke-width="1"/>

      <circle cx="86" cy="54" r="6" fill="#ffaa22" filter="url(#glow-owlbear)" opacity="0.7"/>
      <circle cx="86" cy="54" r="8" fill="none" stroke="#2a1a0a" stroke-width="1.5"/>
      <circle cx="86" cy="54" r="6" fill="#ffaa22"/>
      <circle cx="87" cy="54" r="3" fill="#0a0604"/>
      <circle cx="85" cy="52" r="1.3" fill="#ffffff" opacity="0.85"/>
    </svg>
  `,

  'Displacer Beast': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Displacer Beast">
      <defs><filter id="glow-displacer" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="1.6"/></filter></defs>
      <rect x="4" y="4" width="152" height="152" fill="#04170a" stroke="#33ff33" stroke-width="3"/>
      <rect x="9" y="9" width="142" height="142" fill="none" stroke="#661111" stroke-width="1" opacity="0.5"/>
      <ellipse cx="80" cy="150" rx="48" ry="6" fill="#000000" opacity="0.5"/>

      <g id="db-body">
        <path d="M 56 120 Q 50 134 46 150" stroke="#1a1a2e" stroke-width="9" fill="none" stroke-linecap="round"/>
        <path d="M 96 118 Q 100 134 98 150" stroke="#1a1a2e" stroke-width="8" fill="none" stroke-linecap="round"/>
        <path d="M 52 112 Q 34 108 28 88 Q 26 78 32 82 Q 36 96 54 104 Z" fill="#242440" stroke="#0f0f20" stroke-width="1.8"/>
        <path d="M 50 118 Q 46 100 62 92 Q 82 86 100 96 Q 112 102 108 116 Q 100 128 78 126 Q 60 126 50 118 Z" fill="#242440" stroke="#0f0f20" stroke-width="2.2"/>
        <path d="M 60 98 Q 78 92 96 100" stroke="#4a4a7a" stroke-width="2" fill="none" opacity="0.5"/>
        <path d="M 82 92 Q 90 76 82 62 Q 78 54 84 50" stroke="#2e2e4e" stroke-width="4" fill="none" stroke-linecap="round"/>
        <circle cx="84" cy="48" r="4" fill="#3a3a5e" stroke="#1a1a30" stroke-width="1"/>
        <path d="M 80 46 L 76 40 L 82 44 Z" fill="#8a8aa0"/>
        <path d="M 88 46 L 92 40 L 86 44 Z" fill="#8a8aa0"/>
        <path d="M 84 44 L 84 36 L 88 42 Z" fill="#8a8aa0"/>
        <path d="M 92 94 Q 104 84 102 68 Q 100 60 106 58" stroke="#2e2e4e" stroke-width="4" fill="none" stroke-linecap="round"/>
        <circle cx="106" cy="56" r="3.5" fill="#3a3a5e" stroke="#1a1a30" stroke-width="1"/>
        <path d="M 102 54 L 98 48 L 104 52 Z" fill="#8a8aa0"/>
        <path d="M 110 54 L 114 48 L 108 52 Z" fill="#8a8aa0"/>
        <path d="M 68 92 L 62 76 L 74 88 Z" fill="#242440" stroke="#0f0f20" stroke-width="1"/>
        <path d="M 86 88 L 92 74 L 90 90 Z" fill="#242440" stroke="#0f0f20" stroke-width="1"/>
        <path d="M 66 88 L 78 80 L 94 84 L 98 94 L 90 102 L 76 102 L 66 96 Z" fill="#242440" stroke="#0f0f20" stroke-width="2.2"/>
        <path d="M 88 92 Q 96 94 96 98 Q 90 100 86 96 Z" fill="#3a3a5e" opacity="0.7"/>
        <circle cx="84" cy="90" r="4.5" fill="#aa66ff" filter="url(#glow-displacer)" opacity="0.75"/>
        <ellipse cx="84" cy="90" rx="5" ry="2.6" fill="#aa66ff" transform="rotate(-6 84 90)"/>
        <ellipse cx="84" cy="90" rx="0.8" ry="2" fill="#1a0a2e" transform="rotate(-6 84 90)"/>
      </g>

      <use href="#db-body" opacity="0.25" transform="translate(-9,6)"/>
      <use href="#db-body" opacity="0.18" transform="translate(7,-5)"/>
      <use href="#db-body"/>
    </svg>
  `,

  'Mimic': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Mimic">
      <defs><filter id="glow-mimic" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="1.4"/></filter></defs>
      <rect x="4" y="4" width="152" height="152" fill="#04170a" stroke="#33ff33" stroke-width="3"/>
      <rect x="9" y="9" width="142" height="142" fill="none" stroke="#661111" stroke-width="1" opacity="0.5"/>
      <ellipse cx="80" cy="150" rx="48" ry="6" fill="#000000" opacity="0.5"/>

      <path d="M 54 144 L 52 154 L 58 150 Z" fill="#2a1a0a"/>
      <path d="M 80 144 L 80 156 L 86 150 Z" fill="#2a1a0a"/>
      <path d="M 104 144 L 108 154 L 100 150 Z" fill="#2a1a0a"/>

      <path d="M 40 100 L 120 100 L 116 144 L 44 144 Z" fill="#6a4a2a" stroke="#3a2810" stroke-width="2.5"/>
      <rect x="40" y="112" width="80" height="5" fill="#5a5a5a" stroke="#2a2a2a" stroke-width="1"/>
      <rect x="41" y="128" width="78" height="5" fill="#5a5a5a" stroke="#2a2a2a" stroke-width="1"/>
      <path d="M 55 108 Q 80 112 105 108" stroke="#4a3218" stroke-width="1" fill="none" opacity="0.5"/>
      <path d="M 55 124 Q 80 128 105 124" stroke="#4a3218" stroke-width="1" fill="none" opacity="0.5"/>

      <path d="M 40 100 L 120 100 L 108 58 L 52 58 Z" fill="#7a5a34" stroke="#3a2810" stroke-width="2.5" transform="rotate(-18 80 100)"/>
      <path d="M 76 98 L 84 98 L 82 106 L 78 106 Z" fill="#8a8a8a" stroke="#4a4a4a" stroke-width="1" transform="rotate(25 80 102)"/>

      <path d="M 44 98 L 116 98 L 100 66 L 60 66 Z" fill="#2a0a0a" stroke="#1a0505" stroke-width="1.5"/>

      <path d="M 62 68 L 64 78 L 68 68 Z" fill="#f0ece0"/>
      <path d="M 70 66 L 72 76 L 76 66 Z" fill="#f0ece0"/>
      <path d="M 78 66 L 80 78 L 84 66 Z" fill="#f0ece0"/>
      <path d="M 86 66 L 88 76 L 92 66 Z" fill="#f0ece0"/>
      <path d="M 94 68 L 96 78 L 100 68 Z" fill="#f0ece0"/>
      <path d="M 58 96 L 60 86 L 64 96 Z" fill="#f0ece0"/>
      <path d="M 68 98 L 70 88 L 74 98 Z" fill="#f0ece0"/>
      <path d="M 84 98 L 86 88 L 90 98 Z" fill="#f0ece0"/>
      <path d="M 96 96 L 98 86 L 102 96 Z" fill="#f0ece0"/>

      <path d="M 80 92 Q 74 106 80 118 Q 84 124 78 128 Q 70 122 74 110 Q 72 98 78 90 Z" fill="#8a2a2a" stroke="#4a1010" stroke-width="1"/>

      <circle cx="64" cy="60" r="3" fill="#ffcc44" filter="url(#glow-mimic)" opacity="0.7"/>
      <ellipse cx="64" cy="60" rx="3.5" ry="2" fill="#ffcc44"/>
      <circle cx="64" cy="60" r="1" fill="#1a1000"/>
      <circle cx="96" cy="60" r="3" fill="#ffcc44" filter="url(#glow-mimic)" opacity="0.7"/>
      <ellipse cx="96" cy="60" rx="3.5" ry="2" fill="#ffcc44"/>
      <circle cx="96" cy="60" r="1" fill="#1a1000"/>
    </svg>
  `,

  'Giant': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Giant">
      <rect x="4" y="4" width="152" height="152" fill="#04170a" stroke="#33ff33" stroke-width="3"/>
      <rect x="9" y="9" width="142" height="142" fill="none" stroke="#661111" stroke-width="1" opacity="0.5"/>
      <ellipse cx="80" cy="154" rx="52" ry="6" fill="#000000" opacity="0.5"/>

      <path d="M 58 118 L 50 140 L 44 156 L 62 156 L 68 138 L 74 118 Z" fill="#8a7a5a" stroke="#3a3020" stroke-width="2.4"/>
      <path d="M 88 118 L 98 138 L 106 156 L 90 156 L 82 138 L 78 118 Z" fill="#7a6a4a" stroke="#3a3020" stroke-width="2.4"/>
      <path d="M 44 156 L 40 162 L 64 162 L 62 156 Z" fill="#6a5a3a" stroke="#3a3020" stroke-width="1.5"/>
      <path d="M 90 156 L 88 162 L 110 162 L 106 156 Z" fill="#6a5a3a" stroke="#3a3020" stroke-width="1.5"/>

      <path d="M 52 112 L 94 110 L 90 124 L 56 126 Z" fill="#5a4028" stroke="#2a1c10" stroke-width="1.5"/>

      <path d="M 48 118 Q 40 78 76 60 Q 110 62 118 88 Q 122 110 108 124 Q 78 136 48 118 Z" fill="#8a7a5a" stroke="#3a3020" stroke-width="3"/>
      <path d="M 60 86 Q 72 92 84 86" stroke="#6a5a3a" stroke-width="1.8" fill="none" opacity="0.7"/>
      <path d="M 92 84 Q 100 90 106 82" stroke="#6a5a3a" stroke-width="1.8" fill="none" opacity="0.6"/>
      <path d="M 58 104 Q 72 112 88 104" stroke="#6a5a3a" stroke-width="1.8" fill="none" opacity="0.6"/>
      <path d="M 54 78 L 100 92 L 96 98 L 52 84 Z" fill="#4a3620" opacity="0.85"/>

      <path d="M 104 84 Q 118 68 122 46" stroke="#8a7a5a" stroke-width="12" fill="none" stroke-linecap="round"/>
      <path d="M 108 30 Q 118 24 130 30 Q 136 42 128 54 Q 116 60 106 52 Q 100 40 108 30 Z" fill="#6a4a2a" stroke="#3a2810" stroke-width="2"/>
      <circle cx="116" cy="38" r="2" fill="#3a2810" opacity="0.7"/>
      <circle cx="124" cy="44" r="1.6" fill="#3a2810" opacity="0.7"/>

      <path d="M 54 90 Q 42 96 38 112" stroke="#7a6a4a" stroke-width="11" fill="none" stroke-linecap="round"/>
      <circle cx="36" cy="114" r="8" fill="#7a6a4a" stroke="#3a3020" stroke-width="2"/>

      <path d="M 72 62 L 96 64 L 92 74 L 76 74 Z" fill="#8a7a5a" stroke="#3a3020" stroke-width="1.8"/>
      <path d="M 74 48 L 86 42 L 98 46 L 100 58 L 92 66 L 78 66 L 72 58 Z" fill="#8a7a5a" stroke="#3a3020" stroke-width="2.2"/>
      <path d="M 78 46 L 96 48 L 93 53 L 80 51 Z" fill="#3a3020" opacity="0.85"/>
      <path d="M 82 60 L 94 60" stroke="#3a3020" stroke-width="1.8" stroke-linecap="round"/>
      <circle cx="88" cy="50" r="2.2" fill="#5a4a30" stroke="#2a2010" stroke-width="0.8"/>
    </svg>
  `,

  'Basilisk': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Basilisk">
      <defs><filter id="glow-basilisk" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="1.6"/></filter></defs>
      <rect x="4" y="4" width="152" height="152" fill="#04170a" stroke="#33ff33" stroke-width="3"/>
      <rect x="9" y="9" width="142" height="142" fill="none" stroke="#661111" stroke-width="1" opacity="0.5"/>
      <ellipse cx="80" cy="152" rx="50" ry="6" fill="#000000" opacity="0.5"/>

      <path d="M 52 122 L 44 138 L 40 150" stroke="#7a8a3a" stroke-width="10" fill="none" stroke-linecap="round"/>
      <path d="M 34 148 L 30 154 L 38 152 Z" fill="#2a3a10"/>
      <path d="M 40 150 L 38 157 L 44 152 Z" fill="#2a3a10"/>
      <path d="M 92 124 L 100 138 L 106 150" stroke="#8a9a44" stroke-width="9" fill="none" stroke-linecap="round"/>
      <path d="M 100 150 L 98 157 L 104 152 Z" fill="#2a3a10"/>
      <path d="M 106 150 L 108 157 L 112 151 Z" fill="#2a3a10"/>

      <path d="M 48 118 Q 30 116 22 128 Q 20 134 26 132 Q 34 122 50 122 Z" fill="#7a8a3a" stroke="#2a3a10" stroke-width="2"/>

      <path d="M 44 120 Q 40 100 62 94 Q 86 88 106 100 Q 116 108 110 122 Q 98 132 70 130 Q 50 130 44 120 Z" fill="#7a8a3a" stroke="#2a3a10" stroke-width="2.4"/>
      <path d="M 54 112 Q 76 122 98 112 Q 88 126 74 126 Q 60 124 54 112 Z" fill="#d8dca0" opacity="0.85"/>

      <path d="M 56 100 L 53 90 L 60 98 Z" fill="#5a6e20"/>
      <path d="M 66 92 L 64 82 L 71 90 Z" fill="#5a6e20"/>
      <path d="M 78 88 L 77 78 L 84 87 Z" fill="#5a6e20"/>
      <path d="M 90 90 L 89 80 L 96 89 Z" fill="#5a6e20"/>
      <path d="M 100 96 L 100 86 L 106 95 Z" fill="#5a6e20"/>

      <path d="M 96 106 Q 106 96 116 92 Q 124 96 120 104 Q 112 108 104 114 Q 96 114 96 106 Z" fill="#8a9a44" stroke="#2a3a10" stroke-width="2.2"/>
      <path d="M 106 88 L 96 78 L 110 92 Z" fill="#5a6e20" stroke="#2a3a10" stroke-width="1"/>

      <path d="M 108 90 L 122 86 L 134 92 L 136 100 L 128 106 L 114 106 L 108 98 Z" fill="#8a9a44" stroke="#2a3a10" stroke-width="2.2"/>
      <path d="M 112 100 Q 122 104 130 100" stroke="#2a3a10" stroke-width="1.5" fill="none"/>
      <path d="M 134 98 L 144 96" stroke="#8a2a2a" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M 142 94 L 148 90" stroke="#8a2a2a" stroke-width="1.2" stroke-linecap="round"/>
      <path d="M 142 98 L 148 100" stroke="#8a2a2a" stroke-width="1.2" stroke-linecap="round"/>

      <circle cx="122" cy="94" r="6" fill="#ccff33" filter="url(#glow-basilisk)" opacity="0.6"/>
      <circle cx="122" cy="94" r="5.5" fill="none" stroke="#1a2a08" stroke-width="1"/>
      <circle cx="122" cy="94" r="4" fill="#ccff33"/>
      <circle cx="122" cy="94" r="2.5" fill="none" stroke="#1a2a08" stroke-width="1"/>
      <circle cx="122" cy="94" r="1" fill="#1a2a08"/>

      <path d="M 130 140 L 138 138 L 140 146 L 132 148 Z" fill="#8a8a8a" stroke="#5a5a5a" stroke-width="1" opacity="0.8"/>
      <path d="M 132 140 L 136 145" stroke="#5a5a5a" stroke-width="0.8"/>
    </svg>
  `,

  'Wight': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Wight">
      <defs><filter id="glow-wight" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="1.8"/></filter></defs>
      <rect x="4" y="4" width="152" height="152" fill="#04170a" stroke="#33ff33" stroke-width="3"/>
      <rect x="9" y="9" width="142" height="142" fill="none" stroke="#661111" stroke-width="1" opacity="0.5"/>
      <ellipse cx="80" cy="152" rx="46" ry="6" fill="#000000" opacity="0.5"/>

      <path d="M 56 108 Q 50 130 46 152 Q 60 158 74 152 Q 78 130 76 108 Z" fill="#3a3a42" stroke="#1a1a20" stroke-width="2" opacity="0.9"/>
      <path d="M 76 108 Q 82 132 90 150 Q 100 146 96 152 Q 84 132 78 108 Z" fill="#32323a" stroke="#1a1a20" stroke-width="1.8" opacity="0.85"/>
      <path d="M 46 150 L 40 160 L 48 154 Z" fill="#3a3a42" opacity="0.4"/>
      <path d="M 60 154 L 58 164 L 64 156 Z" fill="#3a3a42" opacity="0.35"/>
      <path d="M 90 148 L 94 160 L 86 152 Z" fill="#32323a" opacity="0.4"/>

      <path d="M 58 108 Q 54 82 72 70 Q 92 66 98 84 Q 100 100 90 110 Q 74 118 58 108 Z" fill="#5a6a7a" stroke="#2a3238" stroke-width="2.2" opacity="0.95"/>
      <path d="M 60 78 Q 70 68 84 70 Q 92 74 88 84 Q 74 82 62 86 Z" fill="#3a3a42" opacity="0.9"/>

      <path d="M 62 90 Q 54 96 52 108" stroke="#5a6a7a" stroke-width="5.5" fill="none" stroke-linecap="round"/>

      <circle cx="118" cy="74" r="8" fill="#66eeff" filter="url(#glow-wight)" opacity="0.18"/>
      <path d="M 92 92 Q 108 88 118 74" stroke="#5a6a7a" stroke-width="6" fill="none" stroke-linecap="round"/>
      <path d="M 116 72 L 124 62 L 118 76 Z" fill="#4a5a68" stroke="#2a3238" stroke-width="0.8"/>
      <path d="M 118 76 L 128 70 L 120 80 Z" fill="#4a5a68" stroke="#2a3238" stroke-width="0.8"/>
      <path d="M 114 78 L 120 72 L 113 82 Z" fill="#4a5a68" stroke="#2a3238" stroke-width="0.8"/>

      <path d="M 68 62 L 76 52 L 88 52 L 94 60 L 92 72 L 78 76 L 68 70 Z" fill="#5a6a7a" stroke="#2a3238" stroke-width="2.2"/>
      <path d="M 66 56 Q 78 44 94 54 Q 90 50 78 50 Q 70 50 66 56 Z" fill="#2e2e36" opacity="0.9"/>
      <ellipse cx="84" cy="66" rx="5" ry="3.5" fill="#3a4650" opacity="0.6"/>
      <path d="M 78 70 Q 84 74 90 70" stroke="#2a3238" stroke-width="1.3" fill="none"/>

      <circle cx="83" cy="60" r="4.5" fill="#66eeff" filter="url(#glow-wight)" opacity="0.7"/>
      <circle cx="83" cy="60" r="3.5" fill="#0a1418"/>
      <circle cx="83" cy="60" r="2" fill="#aaffff" opacity="0.9"/>
    </svg>
  `,

  'Black Dragon': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Black Dragon">
      <defs><filter id="glow-blackdragon" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2"/></filter></defs>
      <rect x="4" y="4" width="152" height="152" fill="#04170a" stroke="#33ff33" stroke-width="3"/>
      <rect x="9" y="9" width="142" height="142" fill="none" stroke="#661111" stroke-width="1" opacity="0.5"/>
      <ellipse cx="80" cy="146" rx="55" ry="6" fill="#000000" opacity="0.5"/>

      <path d="M 65 38 L 32 44 Q 52 78 78 65 Z" fill="#0d1f0d" stroke="#050d05" stroke-width="1.5" opacity="0.92"/>
      <path d="M 78 65 L 65 38 L 74 18 Z" fill="#142a14" opacity="0.9"/>
      <path d="M 65 38 L 74 18 L 58 12 Z" fill="#0a170a" opacity="0.88"/>
      <path d="M 65 38 L 58 12 L 42 18 Z" fill="#142a14" opacity="0.9"/>
      <path d="M 65 38 L 42 18 L 32 44 Z" fill="#0a170a" opacity="0.88"/>
      <path d="M 78 65 L 65 38" stroke="#050d05" stroke-width="1.6"/>
      <path d="M 65 38 L 74 18" stroke="#050d05" stroke-width="1.3"/>
      <path d="M 65 38 L 58 12" stroke="#050d05" stroke-width="1.3"/>
      <path d="M 65 38 L 42 18" stroke="#050d05" stroke-width="1.3"/>
      <path d="M 65 38 L 32 44" stroke="#050d05" stroke-width="1.3"/>
      <path d="M 74 18 L 79 9 L 76 20 Z" fill="#8a9a6a" stroke="#5a6a3a" stroke-width="0.8"/>

      <g fill="#1e2e1e">
        <circle cx="52" cy="97" r="12"/>
        <circle cx="38" cy="90" r="10.5"/>
        <circle cx="24" cy="92" r="9"/>
        <circle cx="13" cy="104" r="7.5"/>
        <circle cx="10" cy="119" r="6.5"/>
        <circle cx="18" cy="133" r="5.5"/>
        <circle cx="14" cy="147" r="4"/>
        <circle cx="7" cy="156" r="3"/>
      </g>
      <path d="M 9 154 L 3 148 L 2 160 L 11 161 Z" fill="#1e2e1e" stroke="#0a170a" stroke-width="1"/>
      <path d="M 34 86 Q 38 89 42 86" stroke="#16241a" stroke-width="1" fill="none" opacity="0.7"/>
      <path d="M 10 100 Q 14 103 18 100" stroke="#16241a" stroke-width="1" fill="none" opacity="0.7"/>

      <ellipse cx="48" cy="110" rx="13" ry="17" fill="#1e2e1e" stroke="#0a170a" stroke-width="2"/>
      <path d="M 40 122 L 36 142 L 50 142 L 52 122 Z" fill="#16241a" stroke="#0a170a" stroke-width="1.5"/>
      <path d="M 34 142 L 31 153 L 38 143 Z" fill="#8a9a6a" stroke="#5a6a3a" stroke-width="0.6"/>
      <path d="M 40 142 L 39 154 L 45 143 Z" fill="#8a9a6a" stroke="#5a6a3a" stroke-width="0.6"/>
      <path d="M 46 142 L 47 154 L 51 143 Z" fill="#8a9a6a" stroke="#5a6a3a" stroke-width="0.6"/>
      <path d="M 52 142 L 54 153 L 56 143 Z" fill="#8a9a6a" stroke="#5a6a3a" stroke-width="0.6"/>

      <path d="M 50 95 Q 55 68 80 64 Q 106 67 108 96 Q 105 120 80 123 Q 55 120 50 95 Z" fill="#2a3e2a" stroke="#0a170a" stroke-width="2.5"/>
      <path d="M 58 100 Q 80 114 100 100 Q 90 118 78 118 Q 65 116 58 100 Z" fill="#7a8a5a" opacity="0.9"/>
      <path d="M 60 70 Q 80 66 100 70" stroke="#4a6a3a" stroke-width="1.5" fill="none" opacity="0.4" stroke-linecap="round"/>
      <g stroke="#16241a" stroke-width="1" fill="none" opacity="0.75">
        <path d="M 62 78 Q 66 81 70 78"/>
        <path d="M 72 72 Q 76 75 80 72"/>
        <path d="M 84 76 Q 88 79 92 76"/>
        <path d="M 66 96 Q 70 99 74 96"/>
        <path d="M 86 98 Q 90 101 94 98"/>
      </g>

      <path d="M 58 92 L 55 82 L 63 90 Z" fill="#16241a" stroke="#0a170a" stroke-width="0.8"/>
      <path d="M 68 80 L 65 68 L 74 78 Z" fill="#16241a" stroke="#0a170a" stroke-width="0.8"/>
      <path d="M 80 70 L 78 58 L 86 68 Z" fill="#16241a" stroke="#0a170a" stroke-width="0.8"/>
      <path d="M 92 68 L 90 56 L 98 66 Z" fill="#16241a" stroke="#0a170a" stroke-width="0.8"/>

      <ellipse cx="98" cy="100" rx="11" ry="15" fill="#2a3e2a" stroke="#0a170a" stroke-width="2"/>
      <path d="M 92 113 L 89 136 L 103 136 L 104 113 Z" fill="#1e2e1e" stroke="#0a170a" stroke-width="1.5"/>
      <path d="M 87 136 L 84 147 L 91 137 Z" fill="#8a9a6a" stroke="#5a6a3a" stroke-width="0.6"/>
      <path d="M 93 136 L 92 148 L 98 137 Z" fill="#8a9a6a" stroke="#5a6a3a" stroke-width="0.6"/>
      <path d="M 99 136 L 100 148 L 104 137 Z" fill="#8a9a6a" stroke="#5a6a3a" stroke-width="0.6"/>
      <path d="M 105 136 L 107 147 L 108 137 Z" fill="#8a9a6a" stroke="#5a6a3a" stroke-width="0.6"/>

      <path d="M 82 68 Q 96 54 110 48 Q 120 54 114 64 Q 102 66 92 76 Q 82 78 82 68 Z" fill="#334a33" stroke="#0a170a" stroke-width="2.5"/>
      <g stroke="#16241a" stroke-width="1" fill="none" opacity="0.75">
        <path d="M 92 60 Q 96 63 100 60"/>
        <path d="M 100 54 Q 104 57 108 54"/>
      </g>

      <path d="M 108 48 L 96 38 L 110 52 Z" fill="#16241a" stroke="#0a170a" stroke-width="1"/>
      <path d="M 104 58 L 92 52 L 108 62 Z" fill="#16241a" stroke="#0a170a" stroke-width="1"/>
      <path d="M 116 42 L 100 28 L 123 38 Z" fill="#8a9a6a" stroke="#5a6a3a" stroke-width="1"/>

      <path d="M 106 46 L 126 39 L 148 45 L 153 53 L 138 56 L 120 58 L 106 58 Z" fill="#334a33" stroke="#0a170a" stroke-width="2.5"/>
      <ellipse cx="118" cy="48" rx="8" ry="5" fill="#4a6a3a" opacity="0.5"/>

      <path d="M 112 62 L 132 60 L 147 65 L 151 71 L 136 73 L 118 73 Z" fill="#2a3e2a" stroke="#0a170a" stroke-width="2"/>
      <path d="M 148 49 L 144 51 L 148 53 Z" fill="#0a170a"/>

      <path d="M 122 58 L 124 64 L 128 58 Z" fill="#d8d8a0"/>
      <path d="M 131 58 L 133 65 L 137 58 Z" fill="#d8d8a0"/>
      <path d="M 140 57 L 142 63 L 146 56 Z" fill="#d8d8a0"/>
      <path d="M 122 66 L 124 60 L 128 66 Z" fill="#d8d8a0"/>
      <path d="M 133 65 L 135 59 L 139 65 Z" fill="#d8d8a0"/>

      <path d="M 128 68 Q 126 76 130 80" stroke="#ccff33" stroke-width="2" fill="none" opacity="0.7" stroke-linecap="round"/>
      <circle cx="130" cy="81" r="2" fill="#ccff33" opacity="0.75"/>
      <circle cx="126" cy="74" r="1.3" fill="#ccff33" opacity="0.6"/>
      <path d="M 122 70 Q 120 76 123 80" stroke="#ccff33" stroke-width="1.5" fill="none" opacity="0.6" stroke-linecap="round"/>
      <circle cx="123" cy="81" r="1.4" fill="#ccff33" opacity="0.65"/>

      <path d="M 108 36 L 140 42 L 136 48 L 112 44 Z" fill="#0a170a" opacity="0.92"/>

      <circle cx="129" cy="50" r="4.5" fill="#ccff33" filter="url(#glow-blackdragon)" opacity="0.75"/>
      <ellipse cx="129" cy="50" rx="7" ry="2.6" fill="#ccff33" transform="rotate(-8 129 50)"/>
      <ellipse cx="129" cy="50" rx="0.9" ry="2" fill="#1a2408" transform="rotate(-8 129 50)"/>
      <circle cx="127.5" cy="48.8" r="0.6" fill="#ffffff" opacity="0.85"/>
    </svg>
  `,

  'Blue Dragon': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Blue Dragon">
      <defs><filter id="glow-bluedragon" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2"/></filter></defs>
      <rect x="4" y="4" width="152" height="152" fill="#04170a" stroke="#33ff33" stroke-width="3"/>
      <rect x="9" y="9" width="142" height="142" fill="none" stroke="#661111" stroke-width="1" opacity="0.5"/>
      <ellipse cx="80" cy="146" rx="55" ry="6" fill="#000000" opacity="0.5"/>

      <path d="M 65 38 L 32 44 Q 52 78 78 65 Z" fill="#0d2038" stroke="#050f1c" stroke-width="1.5" opacity="0.92"/>
      <path d="M 78 65 L 65 38 L 74 18 Z" fill="#142e46" opacity="0.9"/>
      <path d="M 65 38 L 74 18 L 58 12 Z" fill="#0a1a30" opacity="0.88"/>
      <path d="M 65 38 L 58 12 L 42 18 Z" fill="#142e46" opacity="0.9"/>
      <path d="M 65 38 L 42 18 L 32 44 Z" fill="#0a1a30" opacity="0.88"/>
      <path d="M 78 65 L 65 38" stroke="#050f1c" stroke-width="1.6"/>
      <path d="M 65 38 L 74 18" stroke="#050f1c" stroke-width="1.3"/>
      <path d="M 65 38 L 58 12" stroke="#050f1c" stroke-width="1.3"/>
      <path d="M 65 38 L 42 18" stroke="#050f1c" stroke-width="1.3"/>
      <path d="M 65 38 L 32 44" stroke="#050f1c" stroke-width="1.3"/>
      <path d="M 74 18 L 79 9 L 76 20 Z" fill="#d0e0f0" stroke="#7a9ab0" stroke-width="0.8"/>

      <g fill="#1a3a5a">
        <circle cx="52" cy="97" r="12"/>
        <circle cx="38" cy="90" r="10.5"/>
        <circle cx="24" cy="92" r="9"/>
        <circle cx="13" cy="104" r="7.5"/>
        <circle cx="10" cy="119" r="6.5"/>
        <circle cx="18" cy="133" r="5.5"/>
        <circle cx="14" cy="147" r="4"/>
        <circle cx="7" cy="156" r="3"/>
      </g>
      <path d="M 9 154 L 3 148 L 2 160 L 11 161 Z" fill="#1a3a5a" stroke="#0a1a30" stroke-width="1"/>
      <path d="M 34 86 Q 38 89 42 86" stroke="#163050" stroke-width="1" fill="none" opacity="0.7"/>
      <path d="M 10 100 Q 14 103 18 100" stroke="#163050" stroke-width="1" fill="none" opacity="0.7"/>

      <ellipse cx="48" cy="110" rx="13" ry="17" fill="#1a3a5a" stroke="#0a1a30" stroke-width="2"/>
      <path d="M 40 122 L 36 142 L 50 142 L 52 122 Z" fill="#163050" stroke="#0a1a30" stroke-width="1.5"/>
      <path d="M 34 142 L 31 153 L 38 143 Z" fill="#d0e0f0" stroke="#7a9ab0" stroke-width="0.6"/>
      <path d="M 40 142 L 39 154 L 45 143 Z" fill="#d0e0f0" stroke="#7a9ab0" stroke-width="0.6"/>
      <path d="M 46 142 L 47 154 L 51 143 Z" fill="#d0e0f0" stroke="#7a9ab0" stroke-width="0.6"/>
      <path d="M 52 142 L 54 153 L 56 143 Z" fill="#d0e0f0" stroke="#7a9ab0" stroke-width="0.6"/>

      <path d="M 50 95 Q 55 68 80 64 Q 106 67 108 96 Q 105 120 80 123 Q 55 120 50 95 Z" fill="#2a5a82" stroke="#0a1a30" stroke-width="2.5"/>
      <path d="M 58 100 Q 80 114 100 100 Q 90 118 78 118 Q 65 116 58 100 Z" fill="#a8c8e0" opacity="0.9"/>
      <path d="M 60 70 Q 80 66 100 70" stroke="#5a9ad0" stroke-width="1.5" fill="none" opacity="0.4" stroke-linecap="round"/>
      <g stroke="#163050" stroke-width="1" fill="none" opacity="0.75">
        <path d="M 62 78 Q 66 81 70 78"/>
        <path d="M 72 72 Q 76 75 80 72"/>
        <path d="M 84 76 Q 88 79 92 76"/>
        <path d="M 66 96 Q 70 99 74 96"/>
        <path d="M 86 98 Q 90 101 94 98"/>
      </g>

      <path d="M 58 92 L 55 82 L 63 90 Z" fill="#163050" stroke="#0a1a30" stroke-width="0.8"/>
      <path d="M 68 80 L 65 68 L 74 78 Z" fill="#163050" stroke="#0a1a30" stroke-width="0.8"/>
      <path d="M 80 70 L 78 58 L 86 68 Z" fill="#163050" stroke="#0a1a30" stroke-width="0.8"/>
      <path d="M 92 68 L 90 56 L 98 66 Z" fill="#163050" stroke="#0a1a30" stroke-width="0.8"/>

      <ellipse cx="98" cy="100" rx="11" ry="15" fill="#2a5a82" stroke="#0a1a30" stroke-width="2"/>
      <path d="M 92 113 L 89 136 L 103 136 L 104 113 Z" fill="#1a3a5a" stroke="#0a1a30" stroke-width="1.5"/>
      <path d="M 87 136 L 84 147 L 91 137 Z" fill="#d0e0f0" stroke="#7a9ab0" stroke-width="0.6"/>
      <path d="M 93 136 L 92 148 L 98 137 Z" fill="#d0e0f0" stroke="#7a9ab0" stroke-width="0.6"/>
      <path d="M 99 136 L 100 148 L 104 137 Z" fill="#d0e0f0" stroke="#7a9ab0" stroke-width="0.6"/>
      <path d="M 105 136 L 107 147 L 108 137 Z" fill="#d0e0f0" stroke="#7a9ab0" stroke-width="0.6"/>

      <path d="M 82 68 Q 96 54 110 48 Q 120 54 114 64 Q 102 66 92 76 Q 82 78 82 68 Z" fill="#336a94" stroke="#0a1a30" stroke-width="2.5"/>
      <g stroke="#163050" stroke-width="1" fill="none" opacity="0.75">
        <path d="M 92 60 Q 96 63 100 60"/>
        <path d="M 100 54 Q 104 57 108 54"/>
      </g>

      <path d="M 108 48 L 96 38 L 110 52 Z" fill="#163050" stroke="#0a1a30" stroke-width="1"/>
      <path d="M 104 58 L 92 52 L 108 62 Z" fill="#163050" stroke="#0a1a30" stroke-width="1"/>
      <path d="M 116 42 L 100 28 L 123 38 Z" fill="#d0e0f0" stroke="#7a9ab0" stroke-width="1"/>

      <path d="M 106 46 L 126 39 L 148 45 L 153 53 L 138 56 L 120 58 L 106 58 Z" fill="#336a94" stroke="#0a1a30" stroke-width="2.5"/>
      <ellipse cx="118" cy="48" rx="8" ry="5" fill="#5a9ad0" opacity="0.5"/>

      <path d="M 112 62 L 132 60 L 147 65 L 151 71 L 136 73 L 118 73 Z" fill="#2a5a82" stroke="#0a1a30" stroke-width="2"/>
      <path d="M 148 49 L 144 51 L 148 53 Z" fill="#0a1a30"/>

      <path d="M 122 58 L 124 64 L 128 58 Z" fill="#f0f8ff"/>
      <path d="M 131 58 L 133 65 L 137 58 Z" fill="#f0f8ff"/>
      <path d="M 140 57 L 142 63 L 146 56 Z" fill="#f0f8ff"/>
      <path d="M 122 66 L 124 60 L 128 66 Z" fill="#f0f8ff"/>
      <path d="M 133 65 L 135 59 L 139 65 Z" fill="#f0f8ff"/>

      <path d="M 122 70 L 128 78 L 124 80 L 130 88 L 126 86 L 132 94" stroke="#aaeeff" stroke-width="2" fill="none" opacity="0.85" stroke-linecap="round"/>
      <circle cx="132" cy="95" r="2" fill="#aaeeff" filter="url(#glow-bluedragon)" opacity="0.8"/>

      <path d="M 108 36 L 140 42 L 136 48 L 112 44 Z" fill="#0a1a30" opacity="0.92"/>

      <circle cx="129" cy="50" r="4.5" fill="#aaeeff" filter="url(#glow-bluedragon)" opacity="0.75"/>
      <ellipse cx="129" cy="50" rx="7" ry="2.6" fill="#aaeeff" transform="rotate(-8 129 50)"/>
      <ellipse cx="129" cy="50" rx="0.9" ry="2" fill="#0a1830" transform="rotate(-8 129 50)"/>
      <circle cx="127.5" cy="48.8" r="0.6" fill="#ffffff" opacity="0.85"/>
    </svg>
  `,

  'White Dragon': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="White Dragon">
      <defs><filter id="glow-whitedragon" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2"/></filter></defs>
      <rect x="4" y="4" width="152" height="152" fill="#04170a" stroke="#33ff33" stroke-width="3"/>
      <rect x="9" y="9" width="142" height="142" fill="none" stroke="#661111" stroke-width="1" opacity="0.5"/>
      <ellipse cx="80" cy="146" rx="55" ry="6" fill="#000000" opacity="0.5"/>

      <path d="M 65 38 L 32 44 Q 52 78 78 65 Z" fill="#a8c0d0" stroke="#5a7688" stroke-width="1.5" opacity="0.85"/>
      <path d="M 78 65 L 65 38 L 74 18 Z" fill="#c0d8e6" opacity="0.82"/>
      <path d="M 65 38 L 74 18 L 58 12 Z" fill="#98b4c6" opacity="0.8"/>
      <path d="M 65 38 L 58 12 L 42 18 Z" fill="#c0d8e6" opacity="0.82"/>
      <path d="M 65 38 L 42 18 L 32 44 Z" fill="#98b4c6" opacity="0.8"/>
      <path d="M 78 65 L 65 38" stroke="#5a7688" stroke-width="1.6"/>
      <path d="M 65 38 L 74 18" stroke="#5a7688" stroke-width="1.3"/>
      <path d="M 65 38 L 58 12" stroke="#5a7688" stroke-width="1.3"/>
      <path d="M 65 38 L 42 18" stroke="#5a7688" stroke-width="1.3"/>
      <path d="M 65 38 L 32 44" stroke="#5a7688" stroke-width="1.3"/>
      <path d="M 74 18 L 79 9 L 76 20 Z" fill="#e8f4ff" stroke="#a0c0d8" stroke-width="0.8"/>

      <g fill="#d8e8f0">
        <circle cx="52" cy="97" r="12"/>
        <circle cx="38" cy="90" r="10.5"/>
        <circle cx="24" cy="92" r="9"/>
        <circle cx="13" cy="104" r="7.5"/>
        <circle cx="10" cy="119" r="6.5"/>
        <circle cx="18" cy="133" r="5.5"/>
        <circle cx="14" cy="147" r="4"/>
        <circle cx="7" cy="156" r="3"/>
      </g>
      <path d="M 9 154 L 3 148 L 2 160 L 11 161 Z" fill="#d8e8f0" stroke="#8aa8ba" stroke-width="1"/>
      <path d="M 34 86 Q 38 89 42 86" stroke="#b8d0e0" stroke-width="1" fill="none" opacity="0.7"/>
      <path d="M 10 100 Q 14 103 18 100" stroke="#b8d0e0" stroke-width="1" fill="none" opacity="0.7"/>

      <ellipse cx="48" cy="110" rx="13" ry="17" fill="#d8e8f0" stroke="#8aa8ba" stroke-width="2"/>
      <path d="M 40 122 L 36 142 L 50 142 L 52 122 Z" fill="#b8d0e0" stroke="#8aa8ba" stroke-width="1.5"/>
      <path d="M 34 142 L 31 153 L 38 143 Z" fill="#e8f4ff" stroke="#a0c0d8" stroke-width="0.6"/>
      <path d="M 40 142 L 39 154 L 45 143 Z" fill="#e8f4ff" stroke="#a0c0d8" stroke-width="0.6"/>
      <path d="M 46 142 L 47 154 L 51 143 Z" fill="#e8f4ff" stroke="#a0c0d8" stroke-width="0.6"/>
      <path d="M 52 142 L 54 153 L 56 143 Z" fill="#e8f4ff" stroke="#a0c0d8" stroke-width="0.6"/>

      <path d="M 50 95 Q 55 68 80 64 Q 106 67 108 96 Q 105 120 80 123 Q 55 120 50 95 Z" fill="#e8f4fa" stroke="#7a98aa" stroke-width="2.5"/>
      <path d="M 58 100 Q 80 114 100 100 Q 90 118 78 118 Q 65 116 58 100 Z" fill="#b0d0e0" opacity="0.9"/>
      <path d="M 60 70 Q 80 66 100 70" stroke="#ffffff" stroke-width="1.5" fill="none" opacity="0.6" stroke-linecap="round"/>
      <g stroke="#b8d0e0" stroke-width="1" fill="none" opacity="0.75">
        <path d="M 62 78 Q 66 81 70 78"/>
        <path d="M 72 72 Q 76 75 80 72"/>
        <path d="M 84 76 Q 88 79 92 76"/>
        <path d="M 66 96 Q 70 99 74 96"/>
        <path d="M 86 98 Q 90 101 94 98"/>
      </g>

      <path d="M 58 92 L 55 82 L 63 90 Z" fill="#b8d0e0" stroke="#8aa8ba" stroke-width="0.8"/>
      <path d="M 68 80 L 65 68 L 74 78 Z" fill="#b8d0e0" stroke="#8aa8ba" stroke-width="0.8"/>
      <path d="M 80 70 L 78 58 L 86 68 Z" fill="#b8d0e0" stroke="#8aa8ba" stroke-width="0.8"/>
      <path d="M 92 68 L 90 56 L 98 66 Z" fill="#b8d0e0" stroke="#8aa8ba" stroke-width="0.8"/>

      <ellipse cx="98" cy="100" rx="11" ry="15" fill="#e8f4fa" stroke="#7a98aa" stroke-width="2"/>
      <path d="M 92 113 L 89 136 L 103 136 L 104 113 Z" fill="#d8e8f0" stroke="#8aa8ba" stroke-width="1.5"/>
      <path d="M 87 136 L 84 147 L 91 137 Z" fill="#e8f4ff" stroke="#a0c0d8" stroke-width="0.6"/>
      <path d="M 93 136 L 92 148 L 98 137 Z" fill="#e8f4ff" stroke="#a0c0d8" stroke-width="0.6"/>
      <path d="M 99 136 L 100 148 L 104 137 Z" fill="#e8f4ff" stroke="#a0c0d8" stroke-width="0.6"/>
      <path d="M 105 136 L 107 147 L 108 137 Z" fill="#e8f4ff" stroke="#a0c0d8" stroke-width="0.6"/>

      <path d="M 82 68 Q 96 54 110 48 Q 120 54 114 64 Q 102 66 92 76 Q 82 78 82 68 Z" fill="#eef8fc" stroke="#7a98aa" stroke-width="2.5"/>
      <g stroke="#b8d0e0" stroke-width="1" fill="none" opacity="0.75">
        <path d="M 92 60 Q 96 63 100 60"/>
        <path d="M 100 54 Q 104 57 108 54"/>
      </g>

      <path d="M 108 48 L 96 38 L 110 52 Z" fill="#b8d0e0" stroke="#8aa8ba" stroke-width="1"/>
      <path d="M 104 58 L 92 52 L 108 62 Z" fill="#b8d0e0" stroke="#8aa8ba" stroke-width="1"/>
      <path d="M 116 42 L 100 28 L 123 38 Z" fill="#e8f4ff" stroke="#a0c0d8" stroke-width="1"/>

      <path d="M 106 46 L 126 39 L 148 45 L 153 53 L 138 56 L 120 58 L 106 58 Z" fill="#eef8fc" stroke="#7a98aa" stroke-width="2.5"/>
      <ellipse cx="118" cy="48" rx="8" ry="5" fill="#ffffff" opacity="0.6"/>

      <path d="M 112 62 L 132 60 L 147 65 L 151 71 L 136 73 L 118 73 Z" fill="#e8f4fa" stroke="#7a98aa" stroke-width="2"/>
      <path d="M 148 49 L 144 51 L 148 53 Z" fill="#8aa8ba"/>

      <path d="M 122 58 L 124 64 L 128 58 Z" fill="#ffffff"/>
      <path d="M 131 58 L 133 65 L 137 58 Z" fill="#ffffff"/>
      <path d="M 140 57 L 142 63 L 146 56 Z" fill="#ffffff"/>
      <path d="M 122 66 L 124 60 L 128 66 Z" fill="#ffffff"/>
      <path d="M 133 65 L 135 59 L 139 65 Z" fill="#ffffff"/>

      <path d="M 128 68 L 129 82 L 132 68 Z" fill="#d0ecff" stroke="#a0c8e0" stroke-width="0.6" opacity="0.85"/>
      <path d="M 134 68 L 135 78 L 137 68 Z" fill="#d0ecff" stroke="#a0c8e0" stroke-width="0.6" opacity="0.8"/>
      <path d="M 122 68 L 123 76 L 125 68 Z" fill="#d0ecff" stroke="#a0c8e0" stroke-width="0.6" opacity="0.75"/>

      <path d="M 108 36 L 140 42 L 136 48 L 112 44 Z" fill="#7a98aa" opacity="0.5"/>

      <circle cx="129" cy="50" r="4.5" fill="#aaddff" filter="url(#glow-whitedragon)" opacity="0.75"/>
      <ellipse cx="129" cy="50" rx="7" ry="2.6" fill="#aaddff" transform="rotate(-8 129 50)"/>
      <ellipse cx="129" cy="50" rx="0.9" ry="2" fill="#0a2840" transform="rotate(-8 129 50)"/>
      <circle cx="127.5" cy="48.8" r="0.6" fill="#ffffff" opacity="0.85"/>
    </svg>
  `,

  'Red Dragon': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Red Dragon">
      <defs><filter id="glow-reddragon" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2"/></filter></defs>
      <rect x="4" y="4" width="152" height="152" fill="#04170a" stroke="#33ff33" stroke-width="3"/>
      <rect x="9" y="9" width="142" height="142" fill="none" stroke="#661111" stroke-width="1" opacity="0.5"/>
      <ellipse cx="80" cy="146" rx="55" ry="6" fill="#000000" opacity="0.5"/>

      <path d="M 65 38 L 32 44 Q 52 78 78 65 Z" fill="#2e0a0a" stroke="#180404" stroke-width="1.5" opacity="0.92"/>
      <path d="M 78 65 L 65 38 L 74 18 Z" fill="#3e1210" opacity="0.9"/>
      <path d="M 65 38 L 74 18 L 58 12 Z" fill="#240606" opacity="0.88"/>
      <path d="M 65 38 L 58 12 L 42 18 Z" fill="#3e1210" opacity="0.9"/>
      <path d="M 65 38 L 42 18 L 32 44 Z" fill="#240606" opacity="0.88"/>
      <path d="M 78 65 L 65 38" stroke="#180404" stroke-width="1.6"/>
      <path d="M 65 38 L 74 18" stroke="#180404" stroke-width="1.3"/>
      <path d="M 65 38 L 58 12" stroke="#180404" stroke-width="1.3"/>
      <path d="M 65 38 L 42 18" stroke="#180404" stroke-width="1.3"/>
      <path d="M 65 38 L 32 44" stroke="#180404" stroke-width="1.3"/>
      <path d="M 74 18 L 79 9 L 76 20 Z" fill="#2a1a1a" stroke="#140d0d" stroke-width="0.8"/>
      <circle cx="90" cy="30" r="1.4" fill="#ff8a3d" opacity="0.7"/>
      <circle cx="50" cy="26" r="1.2" fill="#ff8a3d" opacity="0.6"/>

      <g fill="#7a1f1f">
        <circle cx="52" cy="97" r="12"/>
        <circle cx="38" cy="90" r="10.5"/>
        <circle cx="24" cy="92" r="9"/>
        <circle cx="13" cy="104" r="7.5"/>
        <circle cx="10" cy="119" r="6.5"/>
        <circle cx="18" cy="133" r="5.5"/>
        <circle cx="14" cy="147" r="4"/>
        <circle cx="7" cy="156" r="3"/>
      </g>
      <path d="M 9 154 L 3 148 L 2 160 L 11 161 Z" fill="#7a1f1f" stroke="#2a0808" stroke-width="1"/>
      <path d="M 34 86 Q 38 89 42 86" stroke="#4a1212" stroke-width="1" fill="none" opacity="0.7"/>
      <path d="M 10 100 Q 14 103 18 100" stroke="#4a1212" stroke-width="1" fill="none" opacity="0.7"/>

      <ellipse cx="48" cy="110" rx="13" ry="17" fill="#7a1f1f" stroke="#2a0808" stroke-width="2"/>
      <path d="M 40 122 L 36 142 L 50 142 L 52 122 Z" fill="#4a1212" stroke="#2a0808" stroke-width="1.5"/>
      <path d="M 34 142 L 31 153 L 38 143 Z" fill="#2a1a1a" stroke="#140d0d" stroke-width="0.6"/>
      <path d="M 40 142 L 39 154 L 45 143 Z" fill="#2a1a1a" stroke="#140d0d" stroke-width="0.6"/>
      <path d="M 46 142 L 47 154 L 51 143 Z" fill="#2a1a1a" stroke="#140d0d" stroke-width="0.6"/>
      <path d="M 52 142 L 54 153 L 56 143 Z" fill="#2a1a1a" stroke="#140d0d" stroke-width="0.6"/>

      <path d="M 50 95 Q 55 68 80 64 Q 106 67 108 96 Q 105 120 80 123 Q 55 120 50 95 Z" fill="#922a22" stroke="#2a0808" stroke-width="2.5"/>
      <path d="M 58 100 Q 80 114 100 100 Q 90 118 78 118 Q 65 116 58 100 Z" fill="#d8905a" opacity="0.9"/>
      <path d="M 60 70 Q 80 66 100 70" stroke="#c04a2a" stroke-width="1.5" fill="none" opacity="0.5" stroke-linecap="round"/>
      <g stroke="#4a1212" stroke-width="1" fill="none" opacity="0.75">
        <path d="M 62 78 Q 66 81 70 78"/>
        <path d="M 72 72 Q 76 75 80 72"/>
        <path d="M 84 76 Q 88 79 92 76"/>
        <path d="M 66 96 Q 70 99 74 96"/>
        <path d="M 86 98 Q 90 101 94 98"/>
      </g>

      <path d="M 58 92 L 55 82 L 63 90 Z" fill="#4a1212" stroke="#2a0808" stroke-width="0.8"/>
      <path d="M 68 80 L 65 68 L 74 78 Z" fill="#4a1212" stroke="#2a0808" stroke-width="0.8"/>
      <path d="M 80 70 L 78 58 L 86 68 Z" fill="#4a1212" stroke="#2a0808" stroke-width="0.8"/>
      <path d="M 92 68 L 90 56 L 98 66 Z" fill="#4a1212" stroke="#2a0808" stroke-width="0.8"/>

      <ellipse cx="98" cy="100" rx="11" ry="15" fill="#922a22" stroke="#2a0808" stroke-width="2"/>
      <path d="M 92 113 L 89 136 L 103 136 L 104 113 Z" fill="#7a1f1f" stroke="#2a0808" stroke-width="1.5"/>
      <path d="M 87 136 L 84 147 L 91 137 Z" fill="#2a1a1a" stroke="#140d0d" stroke-width="0.6"/>
      <path d="M 93 136 L 92 148 L 98 137 Z" fill="#2a1a1a" stroke="#140d0d" stroke-width="0.6"/>
      <path d="M 99 136 L 100 148 L 104 137 Z" fill="#2a1a1a" stroke="#140d0d" stroke-width="0.6"/>
      <path d="M 105 136 L 107 147 L 108 137 Z" fill="#2a1a1a" stroke="#140d0d" stroke-width="0.6"/>

      <path d="M 82 68 Q 96 54 110 48 Q 120 54 114 64 Q 102 66 92 76 Q 82 78 82 68 Z" fill="#a03a2a" stroke="#2a0808" stroke-width="2.5"/>
      <g stroke="#4a1212" stroke-width="1" fill="none" opacity="0.75">
        <path d="M 92 60 Q 96 63 100 60"/>
        <path d="M 100 54 Q 104 57 108 54"/>
      </g>

      <path d="M 108 48 L 96 38 L 110 52 Z" fill="#4a1212" stroke="#2a0808" stroke-width="1"/>
      <path d="M 104 58 L 92 52 L 108 62 Z" fill="#4a1212" stroke="#2a0808" stroke-width="1"/>
      <path d="M 116 42 L 100 28 L 123 38 Z" fill="#2a1a1a" stroke="#140d0d" stroke-width="1"/>

      <path d="M 106 46 L 126 39 L 148 45 L 153 53 L 138 56 L 120 58 L 106 58 Z" fill="#a03a2a" stroke="#2a0808" stroke-width="2.5"/>
      <ellipse cx="118" cy="48" rx="8" ry="5" fill="#c04a2a" opacity="0.5"/>

      <path d="M 112 62 L 132 60 L 147 65 L 151 71 L 136 73 L 118 73 Z" fill="#922a22" stroke="#2a0808" stroke-width="2"/>
      <path d="M 148 49 L 144 51 L 148 53 Z" fill="#2a0808"/>

      <path d="M 122 58 L 124 64 L 128 58 Z" fill="#f2eee2"/>
      <path d="M 131 58 L 133 65 L 137 58 Z" fill="#f2eee2"/>
      <path d="M 140 57 L 142 63 L 146 56 Z" fill="#f2eee2"/>
      <path d="M 122 66 L 124 60 L 128 66 Z" fill="#f2eee2"/>
      <path d="M 133 65 L 135 59 L 139 65 Z" fill="#f2eee2"/>

      <path d="M 126 68 Q 130 76 126 84 Q 132 80 134 88 Q 138 80 134 72 Q 130 74 126 68 Z" fill="#ff8a3d" opacity="0.85"/>
      <circle cx="130" cy="78" r="4" fill="#ffcc33" filter="url(#glow-reddragon)" opacity="0.7"/>

      <path d="M 108 36 L 140 42 L 136 48 L 112 44 Z" fill="#2a0808" opacity="0.92"/>

      <circle cx="129" cy="50" r="4.5" fill="#ff6a1a" filter="url(#glow-reddragon)" opacity="0.8"/>
      <ellipse cx="129" cy="50" rx="7" ry="2.6" fill="#ff6a1a" transform="rotate(-8 129 50)"/>
      <ellipse cx="129" cy="50" rx="0.9" ry="2" fill="#2a0a00" transform="rotate(-8 129 50)"/>
      <circle cx="127.5" cy="48.8" r="0.6" fill="#ffffff" opacity="0.85"/>
    </svg>
  `,

  'Spectre': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Spectre">
      <defs><filter id="glow-spectre" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="3"/></filter></defs>
      <rect x="4" y="4" width="152" height="152" fill="#04170a" stroke="#33ff33" stroke-width="3"/>
      <rect x="9" y="9" width="142" height="142" fill="none" stroke="#661111" stroke-width="1" opacity="0.5"/>

      <circle cx="84" cy="90" r="52" fill="#4a6a80" opacity="0.08" filter="url(#glow-spectre)"/>

      <path d="M 60 120 Q 55 140 50 158" stroke="#6a8aa0" stroke-width="8" fill="none" opacity="0.35" stroke-linecap="round"/>
      <path d="M 72 122 Q 70 144 66 160" stroke="#6a8aa0" stroke-width="10" fill="none" opacity="0.3" stroke-linecap="round"/>
      <path d="M 86 122 Q 90 144 94 160" stroke="#6a8aa0" stroke-width="9" fill="none" opacity="0.32" stroke-linecap="round"/>
      <path d="M 98 120 Q 104 140 108 156" stroke="#6a8aa0" stroke-width="7" fill="none" opacity="0.28" stroke-linecap="round"/>

      <path d="M 46 118 Q 38 80 66 60 Q 90 48 112 66 Q 128 82 120 112 Q 110 128 80 130 Q 54 130 46 118 Z" fill="#6a8aa0" stroke="#2a3a4a" stroke-width="1.5" opacity="0.55"/>
      <path d="M 56 112 Q 52 88 72 74 Q 92 66 104 78 Q 112 90 106 108 Q 96 118 78 118 Q 62 116 56 112 Z" fill="#3a5266" opacity="0.4"/>

      <path d="M 54 92 Q 42 98 38 112" stroke="#6a8aa0" stroke-width="5" fill="none" stroke-linecap="round" opacity="0.45"/>

      <path d="M 108 86 Q 124 78 132 60" stroke="#6a8aa0" stroke-width="6" fill="none" stroke-linecap="round" opacity="0.55"/>
      <path d="M 130 58 Q 136 50 140 42" stroke="#6a8aa0" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.5"/>
      <path d="M 132 62 Q 140 56 146 50" stroke="#6a8aa0" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.45"/>
      <path d="M 126 62 Q 130 52 132 44" stroke="#6a8aa0" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.45"/>

      <path d="M 66 62 Q 76 44 92 46 Q 104 50 102 66 Q 98 78 84 80 Q 70 78 66 62 Z" fill="#6a8aa0" stroke="#2a3a4a" stroke-width="1.5" opacity="0.6"/>

      <circle cx="80" cy="60" r="5" fill="#aaeeff" filter="url(#glow-spectre)" opacity="0.8"/>
      <circle cx="80" cy="60" r="2.5" fill="#e8ffff" opacity="0.95"/>
      <circle cx="92" cy="60" r="5" fill="#aaeeff" filter="url(#glow-spectre)" opacity="0.8"/>
      <circle cx="92" cy="60" r="2.5" fill="#e8ffff" opacity="0.95"/>
    </svg>
  `,

  'Vampire': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Vampire">
      <defs><filter id="glow-vampire" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="1.6"/></filter></defs>
      <rect x="4" y="4" width="152" height="152" fill="#04170a" stroke="#33ff33" stroke-width="3"/>
      <rect x="9" y="9" width="142" height="142" fill="none" stroke="#661111" stroke-width="1" opacity="0.5"/>
      <ellipse cx="80" cy="152" rx="46" ry="6" fill="#000000" opacity="0.5"/>

      <path d="M 66 140 L 62 156 L 74 156 L 76 140 Z" fill="#1a0a2a" stroke="#0a0510" stroke-width="1.5"/>
      <path d="M 86 140 L 88 156 L 100 156 L 96 140 Z" fill="#1a0a2a" stroke="#0a0510" stroke-width="1.5"/>

      <path d="M 60 100 Q 30 90 20 60 Q 18 50 26 56 Q 34 80 62 96 Z" fill="#1a0a2a" stroke="#0a0510" stroke-width="1.8"/>
      <path d="M 100 100 Q 130 90 140 60 Q 142 50 134 56 Q 126 80 98 96 Z" fill="#1a0a2a" stroke="#0a0510" stroke-width="1.8"/>
      <path d="M 64 98 Q 44 92 34 70" stroke="#3a1a4a" stroke-width="1.5" fill="none" opacity="0.6"/>
      <path d="M 96 98 Q 116 92 126 70" stroke="#3a1a4a" stroke-width="1.5" fill="none" opacity="0.6"/>

      <path d="M 58 102 Q 54 130 60 152 Q 80 158 100 152 Q 106 130 102 102 Q 80 112 58 102 Z" fill="#1a0a2a" stroke="#0a0510" stroke-width="2"/>
      <path d="M 62 106 Q 60 130 64 148" stroke="#5a1a2a" stroke-width="2" fill="none" opacity="0.7"/>
      <path d="M 98 106 Q 100 130 96 148" stroke="#5a1a2a" stroke-width="2" fill="none" opacity="0.7"/>

      <path d="M 62 90 L 70 62 L 78 74 L 80 90 Z" fill="#1a0a2a" stroke="#0a0510" stroke-width="1.5"/>
      <path d="M 98 90 L 90 62 L 82 74 L 80 90 Z" fill="#1a0a2a" stroke="#0a0510" stroke-width="1.5"/>

      <path d="M 56 96 Q 46 92 40 82" stroke="#d8d0c8" stroke-width="4" fill="none" stroke-linecap="round"/>
      <ellipse cx="38" cy="80" rx="3.5" ry="3" fill="#d8d0c8" stroke="#8a8078" stroke-width="1"/>
      <path d="M 36 78 L 32 72 L 36 76 Z" fill="#d8d0c8"/>
      <path d="M 40 78 L 38 71 L 42 76 Z" fill="#d8d0c8"/>

      <path d="M 68 60 L 76 50 L 84 50 L 92 60 L 90 74 L 78 78 L 68 72 Z" fill="#d8d0c8" stroke="#8a8078" stroke-width="1.8"/>

      <path d="M 68 56 Q 80 48 92 56 Q 84 66 80 58 Q 76 66 68 56 Z" fill="#0a0a0a"/>

      <path d="M 76 70 Q 80 73 84 70" stroke="#5a1015" stroke-width="1.3" fill="none"/>
      <path d="M 82 71 L 83 75 L 84 71 Z" fill="#f5f0e8"/>

      <circle cx="76" cy="60" r="3" fill="#ff2244" filter="url(#glow-vampire)" opacity="0.75"/>
      <ellipse cx="76" cy="60" rx="3" ry="1.8" fill="#ff2244"/>
      <circle cx="85" cy="60" r="3" fill="#ff2244" filter="url(#glow-vampire)" opacity="0.75"/>
      <ellipse cx="85" cy="60" rx="3" ry="1.8" fill="#ff2244"/>
    </svg>
  `,

  'Wizard': `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Wizard">
      <defs><filter id="glow-wizard" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="1.6"/></filter></defs>
      <rect x="4" y="4" width="152" height="152" fill="#04170a" stroke="#33ff33" stroke-width="3"/>
      <rect x="9" y="9" width="142" height="142" fill="none" stroke="#661111" stroke-width="1" opacity="0.5"/>
      <ellipse cx="80" cy="158" rx="46" ry="6" fill="#000000" opacity="0.5"/>

      <path d="M 58 96 Q 50 130 46 156 Q 80 162 114 156 Q 110 130 102 96 Q 80 108 58 96 Z" fill="#2a2a5a" stroke="#141430" stroke-width="2"/>
      <path d="M 64 110 Q 60 132 58 152" stroke="#1a1a42" stroke-width="1.3" fill="none" opacity="0.6"/>
      <path d="M 96 110 Q 100 132 102 152" stroke="#1a1a42" stroke-width="1.3" fill="none" opacity="0.6"/>
      <path d="M 66 128 L 68 124 L 70 128 L 68 132 Z" fill="#ffd700" opacity="0.8"/>
      <path d="M 92 140 L 94 136 L 96 140 L 94 144 Z" fill="#ffd700" opacity="0.8"/>
      <path d="M 78 148 L 80 145 L 82 148 L 80 151 Z" fill="#ffd700" opacity="0.7"/>

      <path d="M 60 92 Q 52 96 50 106" stroke="#2a2a5a" stroke-width="6" fill="none" stroke-linecap="round"/>

      <path d="M 100 92 Q 112 86 116 68" stroke="#2a2a5a" stroke-width="7" fill="none" stroke-linecap="round"/>
      <path d="M 116 68 L 122 30" stroke="#5a4020" stroke-width="3"/>
      <circle cx="123" cy="26" r="9" fill="#66aaff" opacity="0.25" filter="url(#glow-wizard)"/>
      <circle cx="123" cy="26" r="6" fill="#66aaff" stroke="#3a6a9a" stroke-width="1.5" opacity="0.9"/>

      <path d="M 70 78 Q 65 100 68 130 Q 72 150 80 156 Q 88 150 92 130 Q 95 100 90 78 Q 80 84 70 78 Z" fill="#f0f0f0" stroke="#b8b8b8" stroke-width="1.5" opacity="0.95"/>
      <path d="M 74 90 Q 72 120 76 148" stroke="#d0d0d0" stroke-width="1" fill="none" opacity="0.6"/>
      <path d="M 86 90 Q 88 120 84 148" stroke="#d0d0d0" stroke-width="1" fill="none" opacity="0.6"/>
      <path d="M 80 92 Q 80 124 80 152" stroke="#d0d0d0" stroke-width="1" fill="none" opacity="0.5"/>

      <path d="M 72 62 L 80 58 L 88 62 L 84 74 L 76 74 Z" fill="#b8a888" stroke="#8a7a5a" stroke-width="1.2"/>

      <path d="M 68 60 L 80 20 L 92 60 Q 80 66 68 60 Z" fill="#2a2a5a" stroke="#141430" stroke-width="1.8"/>
      <ellipse cx="80" cy="60" rx="16" ry="4" fill="#2a2a5a" stroke="#141430" stroke-width="1.5"/>
      <path d="M 80 34 L 82 38 L 80 42 L 78 38 Z" fill="#ffd700"/>

      <path d="M 73 63 Q 76 61 79 63" stroke="#e0e0e0" stroke-width="1.5" fill="none"/>
      <path d="M 81 63 Q 84 61 87 63" stroke="#e0e0e0" stroke-width="1.5" fill="none"/>

      <circle cx="76" cy="66" r="2.3" fill="#66aaff" filter="url(#glow-wizard)" opacity="0.7"/>
      <ellipse cx="76" cy="66" rx="2.3" ry="1.5" fill="#66aaff"/>
      <circle cx="84" cy="66" r="2.3" fill="#66aaff" filter="url(#glow-wizard)" opacity="0.7"/>
      <ellipse cx="84" cy="66" rx="2.3" ry="1.5" fill="#66aaff"/>
    </svg>
  `,

};

function getMonsterSprite(type) {
  return MONSTER_SPRITES[type] || null;
}
