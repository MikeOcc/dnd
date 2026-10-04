// The magic rings. Each lies alone in a chest in an out-of-the-way room on
// its level (placed by core/treasures.ts, like the Zork treasures). One of
// each, except the star sapphires: there are several, and a character can
// carry more than one, using them up one after another.

import type { RingId } from '../core/types.js';

export interface RingInfo {
  id: RingId;
  name: string;        // 'ruby ring'
  power: string;       // menu/inventory line
  found: string[];     // what the character sees opening the chest
}

export const RINGS_INFO: Record<RingId, RingInfo> = {
  fire: {
    id: 'fire', name: 'ruby ring', power: 'Protection from fire',
    found: ['Inside, on black velvet, lies a ring of red gold set with a ruby that smoulders like a coal.', 'It is warm to the touch, and the air above it shimmers.'],
  },
  cold: {
    id: 'cold', name: 'aquamarine ring', power: 'Protection from cold',
    found: ['Inside lies a silver ring set with a pale aquamarine, rimed with frost that never melts.', 'Your breath does not fog near it.'],
  },
  evil: {
    id: 'evil', name: 'onyx ring', power: 'Protection from evil',
    found: ['Inside lies a heavy ring of black onyx carved with a single open eye.', 'Holy runes run around the band. Something in the dark beyond the chest flinches.'],
  },
  undead: {
    id: 'undead', name: 'rose quartz ring', power: 'Protection from undead',
    found: ['Inside lies a slender ring of rose quartz, glowing faintly like a living heart.', 'It pulses warm and steady: a ward against things that should be dead.'],
  },
  backfire: {
    id: 'backfire', name: 'green diamond ring', power: "Backfire: the monster's next attack turns on it",
    found: ['Inside lies a ring set with a green diamond, cut with a thousand tiny mirrors.', 'When you turn it, the room seems to look back at itself.'],
  },
  escape: {
    id: 'escape', name: 'star sapphire ring', power: 'Teleport away from battle',
    found: ['Inside lies a ring set with a star sapphire. A six-rayed star drifts across the stone as you tilt it.', 'For a moment you are not quite sure where you are standing.'],
  },
};

/** The display order of rings in menus. */
export const RING_ORDER: RingId[] = ['fire', 'cold', 'evil', 'undead', 'backfire', 'escape'];

/** Where the ring chests lie. Star sapphires are found more than once. */
export const RING_CHESTS: { id: string; ring: RingId; level: number }[] = [
  { id: 'star-1', ring: 'escape', level: 2 },
  { id: 'fire', ring: 'fire', level: 3 },
  { id: 'undead', ring: 'undead', level: 3 },
  { id: 'cold', ring: 'cold', level: 4 },
  { id: 'star-2', ring: 'escape', level: 5 },
  { id: 'evil', ring: 'evil', level: 5 },
  { id: 'backfire', ring: 'backfire', level: 6 },
  { id: 'star-3', ring: 'escape', level: 7 },
];

export function ringChestById(id: string) {
  return RING_CHESTS.find(r => r.id === id);
}
