// The Zork treasures: one of each in the whole game, each alone in its own
// chest in an out-of-the-way room on its level (placed by core/treasures.ts).
// Opening one adds it to the pack, grants its small blessing, and raises the
// score, as Zork would say.

import type { Character } from '../core/types.js';

export interface Treasure {
  id: string;
  name: string;
  level: number;
  points: number;
  found: string[];                       // what the character sees opening the chest
  bless: (char: Character) => string;    // applies its gift, returns the line saying so
}

export const TREASURES: Treasure[] = [
  {
    id: 'zorkmid', name: 'A zorkmid', level: 1, points: 100,
    found: [
      'Inside, alone on the velvet lining, lies a single gold coin.',
      'It is a ZORKMID, stamped with the face of Lord Dimwit Flathead the Excessive.',
      'It feels lucky.',
    ],
    bless: c => { c.charisma += 1; return 'You pocket it for luck. (+1 Charisma)'; },
  },
  {
    id: 'nest', name: 'A bird\'s nest with a jewel-encrusted egg', level: 2, points: 100,
    found: [
      'Inside is a small bird\'s nest. In the nest is a large egg encrusted with precious jewels.',
      'You carefully open it. Within lies a golden clockwork canary.',
      'You wind it. It sings a song so beautiful that for a moment you forget where you are.',
    ],
    bless: c => { c.wisdom += 1; return 'You wrap the nest and its egg with great care. (+1 Wisdom)'; },
  },
  {
    id: 'zork-ring', name: 'The Zork ring', level: 4, points: 100,
    found: [
      'Inside, on a bed of moth-eaten silk, lies a gold ring set with a great sapphire.',
      'Runes of old Zork run around the band. They feel warm under your thumb.',
    ],
    bless: c => { c.resistance += 2; return 'You slip it on. A faint ward settles over you. (+2 Resistance)'; },
  },
  {
    id: 'flathead-crown', name: 'The crown of Lord Dimwit Flathead', level: 6, points: 100,
    found: [
      'Inside is a crown: gold, jeweled, and absurdly, magnificently large.',
      'It belonged to Lord Dimwit Flathead the Excessive, ruler of the Great Underground Empire.',
      'It is far too big for you. You put it on anyway.',
    ],
    bless: c => { c.charisma += 2; c.intelligence += 1; return 'You feel excessively regal. (+2 Charisma, +1 Intelligence)'; },
  },
];

export function treasureById(id: string): Treasure | undefined {
  return TREASURES.find(t => t.id === id);
}
