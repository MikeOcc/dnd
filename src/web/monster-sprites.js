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

};

function getMonsterSprite(type) {
  return MONSTER_SPRITES[type] || null;
}
