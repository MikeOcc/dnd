// The districts of the seventh level (core/hell-districts.ts): one Hell, but
// each part of it its own place. Room names by size, the passages, a line per
// room, and the words on first crossing into each.

export type DistrictId = 'ash' | 'forges' | 'frozen' | 'pacts' | 'cages' | 'court' | 'approach' | 'throne';

export interface DistrictWords {
  name: string;           // "the Ash Plain"
  arrival: string[];      // the first time you cross into it
  rooms: { small: string; medium: string; large: string; vast: string; long: string };
  passage: string;
  flavor: string[];
}

export const DISTRICTS: Record<DistrictId, DistrictWords> = {
  ash: {
    name: 'the Ash Plain',
    arrival: ['Ash lies everywhere here, ankle deep and still warm. Far off, rivers of fire light the underside of the dark.', 'This is the Ash Plain, where the seventh level begins.'],
    rooms: { small: 'an ash-choked hollow', medium: 'a chamber drifted with ash', large: 'a wide hall of ash dunes', vast: 'a grey waste of ash', long: 'a long trench of ash' },
    passage: 'ash-floored passage',
    flavor: [
      'Your feet sink into warm grey ash. Something brittle snaps beneath it.',
      'Charred bones poke out of the ash drifts like the ribs of wrecked boats.',
      'A hot wind stirs the ash into slow, dancing columns.',
      'Far off, through a crack in the wall, a river of fire glows.',
      'Footprints cross the ash: yours, and some that are not.',
      'A sword stands upright in the ash, its owner long since burned away.',
      'The ash here has been raked into patterns no one living could read.',
      'Embers drift down from somewhere above, and go out before they land.',
    ],
  },
  forges: {
    name: 'the Forges of Dis',
    arrival: ['Hammering, from everywhere at once. The air turns thick with smoke and the reek of hot iron.', 'You have come to the Forges of Dis, where the chains of Hell are made.'],
    rooms: { small: 'a slag pit', medium: 'a smithy of black iron', large: 'a great forge hall', vast: 'a cavern of furnaces', long: 'a long hall of anvils' },
    passage: 'smoke-blackened passage',
    flavor: [
      'Anvils stand in rows, still warm, as if the smiths only just stepped away.',
      'A furnace roars behind an iron door. Through the grate, something is screaming.',
      'Half-made chains hang from hooks, each link stamped with a name.',
      'Slag cools in channels across the floor, crusted black over a red glow.',
      'Hammers ring somewhere close by, but there is no one here.',
      'A rack of tongs and hooks, every one of them sized for a hand much larger than yours.',
      'Bellows the size of a cart breathe slowly in and out on their own.',
      'Iron cages lie stacked against the wall, waiting to be filled.',
    ],
  },
  frozen: {
    name: 'the Frozen Lake',
    arrival: ['The heat drains away. Your breath mists, then freezes on your lips. The floor ahead turns to black ice.', 'This is the Frozen Lake, the coldest place in all the Hells.'],
    rooms: { small: 'an ice-locked cell', medium: 'a chamber of black ice', large: 'a frozen hall', vast: 'a lake of black ice', long: 'a long frozen gallery' },
    passage: 'passage of rimed stone',
    flavor: [
      'Faces stare up at you from under the ice, their mouths open in a scream that never ends.',
      'The ice groans and cracks somewhere far off, and the sound goes on and on.',
      'A hand reaches up out of the ice, frozen solid, fingers spread.',
      'Frost feathers the walls. Your torch burns small and blue.',
      'A wind blows here, colder than anything you have known, from nowhere at all.',
      'Under your feet, something enormous moves slowly beneath the ice.',
      'Icicles hang from the ceiling like teeth, dripping nothing.',
      'Your breath freezes and falls, tinkling, to the floor.',
    ],
  },
  pacts: {
    name: 'the Hall of Pacts',
    arrival: ['The air smells of old paper, sealing wax and blood. Shelves rise into the dark on every side.', 'You have entered the Hall of Pacts. Every soul Asmodeus ever bought is filed here.'],
    rooms: { small: 'a scribe\'s cell', medium: 'a chamber of contracts', large: 'a great archive', vast: 'a vault of endless shelves', long: 'a long hall of ledgers' },
    passage: 'passage lined with pigeonholes',
    flavor: [
      'Scrolls fill the shelves from floor to ceiling, each one sealed in red wax.',
      'A contract lies open on a desk. The ink is still wet. The signature is yours.',
      'An inkwell of blood stands on a scribe\'s desk, a quill still in it.',
      'Ledgers lie open everywhere, columns of names with prices beside them.',
      'Somewhere among the shelves, a quill scratches on and on.',
      'A pile of broken seals lies swept into a corner: the contracts that were paid.',
      'A sign on the wall reads: ALL SALES FINAL.',
      'Small, neat footprints in the dust, and the scuff of a long tail.',
    ],
  },
  cages: {
    name: 'the Cages',
    arrival: ['Chains, everywhere. They hang from the dark above, swaying, and the cages on them creak.', 'You have come to the Cages, where Hell keeps what it is not finished with.'],
    rooms: { small: 'a smouldering cell', medium: 'a chamber of black stone', large: 'a great hall of black stone', vast: 'a burning expanse', long: 'a long hall of chains' },
    passage: 'passage of black glass',
    flavor: [
      'Chains hang from the ceiling, swaying though there is no wind.',
      'Rivulets of fire run in channels cut into the floor.',
      'The walls are carved with the faces of the damned. Their mouths move.',
      'The air shimmers with heat and stinks of brimstone.',
      'Iron cages, some still occupied by bones, hang from hooks.',
      'Distant screams echo, then fall silent.',
      'A cage swings gently overhead. Something inside it is watching you.',
      'A key hangs on a nail, just out of reach of the nearest cage.',
    ],
  },
  court: {
    name: 'the Court of the Throne',
    arrival: ['The floor turns to polished black marble, veined with gold. Red banners hang without stirring.', 'You have come into the Court of the Throne. Somewhere near here is the way to him.'],
    rooms: { small: 'a gilded antechamber', medium: 'an audience chamber', large: 'a great hall of the court', vast: 'a vast marble court', long: 'a long gallery of banners' },
    passage: 'marble passage',
    flavor: [
      'Skeletons in rotted finery kneel in rows, all facing the same way.',
      'Red banners hang from the ceiling, each worked with the same horned crown.',
      'A long table is laid for a feast. Every plate holds ashes.',
      'Gold leaf flakes from the walls like old skin.',
      'Statues of devils line the walls, each one bowing.',
      'A herald\'s trumpet lies on the floor, crushed flat.',
      'Petitioners\' bones lie in a queue that ends at a blank wall.',
      'Incense burns somewhere, sweet and rotten.',
    ],
  },
  approach: {
    name: 'the Long Way',
    arrival: ['A narrow crack in the wall opens on a passage of black glass. It winds down and on into the dark.', 'Somewhere at the end of it, something is waiting for you.'],
    rooms: { small: 'a narrow place', medium: 'a narrow place', large: 'a narrow place', vast: 'a narrow place', long: 'a narrow place' },
    passage: 'narrow passage of black glass',
    flavor: [],
  },
  throne: {
    name: 'the Infernal Throne',
    arrival: ['The passage ends. Beyond the door is a hall of black glass, and at its far end, a throne.'],
    rooms: { small: 'the throne room of Hell', medium: 'the throne room of Hell', large: 'the throne room of Hell', vast: 'the throne room of Hell', long: 'the throne room of Hell' },
    passage: 'passage of black glass',
    flavor: ['Fire runs in the walls. The air itself is heavy, like a hand on your chest.'],
  },
};

/** What happens along the Long Way (the passage to the throne), each once,
 * at these shares of the way along it. The effects are in game-engine.ts. */
export const APPROACH_EVENTS: { at: number; id: string; lines: string[] }[] = [
  { at: 0.10, id: 'whisper', lines: [
    'A voice speaks, close beside your ear, warm and patient:',
    '"Turn back, little one, and I will forget your name."',
    'There is no one there.' ] },
  { at: 0.25, id: 'contract', lines: [
    'A sheet of parchment is nailed to the wall at eye level.',
    'It is a contract, for your soul. It is already signed, in your hand, in blood.',
    'The date is tomorrow.' ] },
  { at: 0.42, id: 'fire', lines: [
    'The black glass ahead glows red, then white. The wall splits, and fire roars out across the passage!' ] },
  { at: 0.58, id: 'mercy', lines: [
    'A stone knight kneels in a niche in the wall, head bowed, holding out a small glass vial.',
    'Whoever carved it did not belong down here.' ] },
  { at: 0.74, id: 'mirror', lines: [
    'The glass walls are smooth as mirrors here. Your reflection walks beside you.',
    'Then it stops, and watches you go on without it.' ] },
  { at: 0.90, id: 'silence', lines: [
    'The screams stop. All of them, all at once.',
    'In the silence you hear breathing, slow and vast, from somewhere just ahead.' ] },
];
