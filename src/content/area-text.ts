// What the character sees on stepping into a new room or corridor, in the
// manner of Adventure and Zork. Each level has its own nouns and flavor; the
// size, shape and number of exits come from the area itself (core/regions.ts).
// Picks are hashed from the area, so a room reads the same every visit.

import type { Area } from '../core/regions.js';

type Size = 'small' | 'medium' | 'large' | 'vast';

export interface LevelWords {
  rooms: Record<Size | 'long', string>;
  passage: string;
  flavor: string[];  // one line, picked per room
}

const LEVELS: Record<number, LevelWords> = {
  1: {
    rooms: { small: 'a cramped storeroom', medium: 'an old guardroom', large: 'a great hall', vast: 'a vast pillared undercroft', long: 'a long gallery' },
    passage: 'stone passage',
    flavor: [
      'Rotten barrel staves and mouldering sacks lie against the walls.',
      'Faded banners hang in tatters from iron hooks.',
      'Old soot stains the ceiling above a cold hearth.',
      'A broken table and three overturned stools lie where they fell.',
      'Rusted weapon racks line one wall, long since stripped.',
      'Water drips steadily somewhere in the dark.',
    ],
  },
  2: {
    rooms: { small: 'a mouldering den', medium: 'a dripping chamber', large: 'a sprawling warren', vast: 'a huge fungus-choked grotto', long: 'a long, low burrow' },
    passage: 'slimy tunnel',
    flavor: [
      'Pale mushrooms as tall as a man crowd the corners.',
      'Gnawed bones and filthy straw are heaped in a nest.',
      'The walls sweat a greenish slime.',
      'Crude goblin marks are daubed on the stone in something brown.',
      'The stench of rot is almost too much to bear.',
      'Something small skitters away from your light.',
    ],
  },
  3: {
    rooms: { small: 'a small tomb', medium: 'a crypt', large: 'a great ossuary', vast: 'a vast necropolis hall', long: 'a long catacomb' },
    passage: 'narrow catacomb',
    flavor: [
      'Skulls are stacked in neat rows from floor to ceiling.',
      'Stone coffins line the walls. Some lids lie broken on the floor.',
      'Faded names are carved above empty burial niches.',
      'Cobwebs hang like shrouds from the ceiling.',
      'A marble effigy of a knight lies on a cracked tomb, its face chiselled away.',
      'The air is cold, and utterly still.',
    ],
  },
  4: {
    rooms: { small: 'a narrow grotto', medium: 'a cave', large: 'a great cavern', vast: 'an immense cavern', long: 'a long rift' },
    passage: 'rough tunnel',
    flavor: [
      'Stalactites hang overhead like the teeth of some enormous jaw.',
      'Deep gouges score the rock, far wider apart than any hand.',
      'Boulders the size of carts lie tumbled across the floor.',
      'Glittering veins of quartz catch your torchlight.',
      'The floor is worn into a path by something heavy.',
      'A cold draft whistles through cracks in the rock.',
    ],
  },
  5: {
    rooms: { small: 'a scorched alcove', medium: 'a smoke-blackened chamber', large: 'a great scorched hall', vast: 'a colossal dragon\'s hall', long: 'a long, scorched gallery' },
    passage: 'scorched passage',
    flavor: [
      'The stone here has melted and run like candle wax.',
      'Shed scales, each as large as a shield, lie scattered about.',
      'Acid has eaten pits into the floor.',
      'The charred remains of an adventurer\'s pack lie in the ash.',
      'The walls are still warm to the touch.',
      'A few gold coins glint, fused into the rock by great heat.',
    ],
  },
  6: {
    rooms: { small: 'a flooded cell', medium: 'a dripping grotto', large: 'a drowned hall', vast: 'a vast sunken cavern', long: 'a long flooded channel' },
    passage: 'flooded passage',
    flavor: [
      'Black water laps around your ankles.',
      'Strange carvings of tentacled things cover the walls.',
      'Pale, eyeless fish flicker away through the shallows.',
      'Water drips from somewhere overhead like slow rain.',
      'Faint whispers seem to rise from the water itself.',
      'Slick green weed hangs from the walls.',
    ],
  },
  7: {
    rooms: { small: 'a smouldering cell', medium: 'a chamber of black stone', large: 'a great hall of black stone', vast: 'a burning expanse', long: 'a long hall of chains' },
    passage: 'passage of black glass',
    flavor: [
      'Chains hang from the ceiling, swaying though there is no wind.',
      'Rivulets of fire run in channels cut into the floor.',
      'The walls are carved with the faces of the damned. Their mouths move.',
      'The air shimmers with heat and stinks of brimstone.',
      'Iron cages, some still occupied by bones, hang from hooks.',
      'Distant screams echo, then fall silent.',
    ],
  },
};

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function sizeOf(area: Area): Size {
  if (area.cells < 30) return 'small';
  if (area.cells < 100) return 'medium';
  if (area.cells < 200) return 'large';
  return 'vast';
}

function isLong(area: Area): boolean {
  const w = area.maxX - area.minX + 1, h = area.maxY - area.minY + 1;
  return Math.max(w, h) >= 2.5 * Math.min(w, h);
}

function axis(area: Area): string {
  const w = area.maxX - area.minX + 1, h = area.maxY - area.minY + 1;
  return w >= h ? 'east to west' : 'north to south';
}

function exitsLine(n: number): string {
  if (n <= 0) return 'There is no way out but the way you came.';
  if (n === 1) return 'There is only one way out.';
  const words = ['', '', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];
  return `There are ${words[n] ?? 'many'} ways out.`;
}

function words(level: number): LevelWords {
  return LEVELS[level] ?? LEVELS[1];
}

/** How high an area's ceiling is: 0 ordinary, 1 high, 2 lost in darkness.
 * Large rooms are high and vast ones soar out of sight; in the Caverns of
 * Teeth and the Sunken Abyss, everything one size smaller does too. The
 * corridor view draws this, and the room description mentions it. */
export function ceilingHeight(level: number, area: Area): number {
  if (area.kind !== 'room') return 0;
  const rank = { small: 0, medium: 1, large: 2, vast: 3 }[sizeOf(area)] + (level === 4 || level === 6 ? 1 : 0);
  return rank >= 3 ? 2 : rank === 2 ? 1 : 0;
}

/** The room's name, e.g. "a great ossuary". `own`: a part of the level with its own words (a district of the seventh). */
export function roomName(level: number, area: Area, own?: LevelWords): string {
  const w = own ?? words(level);
  return isLong(area) && area.cells >= 20 ? w.rooms.long : w.rooms[sizeOf(area)];
}

/** Lines shown on stepping into an area. First visits get the full picture;
 * returning to a room gets a short reminder; corridors are only described
 * the first time, and only if they're long enough to be worth a word. */
export function describeArea(level: number, area: Area, firstVisit: boolean, own?: LevelWords): string[] {
  const w = own ?? words(level);
  if (area.kind === 'room') {
    const name = roomName(level, area, own);
    if (!firstVisit) return [`You are back in ${name.replace(/^an? /, 'the ')}.`];
    const size = sizeOf(area);
    const reach =
      size === 'small' ? 'The walls press close around you.'
      : size === 'medium' ? 'Your torchlight reaches every wall.'
      : size === 'large' ? 'Your torchlight barely reaches the far wall.'
      : 'Your torchlight is swallowed by the dark long before it finds a far wall.';
    const shape = isLong(area) && area.cells >= 20 ? `It runs a long way, ${axis(area)}.` : reach;
    const flavor = w.flavor.length ? w.flavor[hash(`${level}:${area.id}`) % w.flavor.length] : '';
    const ceiling = ceilingHeight(level, area);
    const overhead = ceiling === 2 ? ['Far overhead, the ceiling is lost in darkness.']
      : ceiling === 1 ? ['The ceiling rises high above you.'] : [];
    return [`You are in ${name}.`, shape, ...overhead, ...(flavor ? [flavor] : []), exitsLine(area.exits)];
  }

  if (!firstVisit || area.cells < 6) return [];
  const long = area.cells >= 15 ? 'very long' : 'long';
  const lines = area.straight
    ? [`A ${long} ${w.passage} runs ${axis(area)}${area.cells >= 15 ? ', farther than your light can follow' : ''}.`]
    : [`A ${area.cells >= 15 ? 'long, ' : ''}winding ${w.passage} twists away into the dark.`];
  if (area.junctions > 0) lines.push(area.junctions === 1 ? 'A side passage branches off it.' : 'Side passages branch off it.');
  return lines;
}
