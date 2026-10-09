// THE SEVEN LEVELS — art for the monsters kept out of the hosted game.
//
// The Death Tyrant, the Displacer Beast and the Elder Oblex are Wizards of the
// Coast's own creations: they never appear on the public site (monsters.ts,
// HIDDEN_WHEN_HOSTED), and this file is never uploaded to it (deploy.sh
// leaves it out). Played on this Mac, monster-sprites.js loads it.

'use strict';

Object.assign(MONSTER_SPRITES, {
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
});
MONSTER_SPRITE_SCALE['Death Tyrant'] = 1.35;
