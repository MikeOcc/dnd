import type { MonsterType } from './types.js';

interface FixedMonsterDef { id: string; type: MonsterType; }
interface UniqueMonsterDef { id: string; type: MonsterType; }

export const LEVEL_FIXED_MONSTERS: Record<number, FixedMonsterDef[]> = {
  1: [
    { id: 'fm-1-1', type: 'Goblin' },
    { id: 'fm-1-2', type: 'Orc' },
  ],
  2: [
    { id: 'fm-2-1', type: 'Orc' },
    { id: 'fm-2-2', type: 'Skeleton' },
    { id: 'fm-2-3', type: 'Goblin' },
  ],
  3: [
    { id: 'fm-3-1', type: 'Zombie' },
    { id: 'fm-3-2', type: 'Wight' },
    { id: 'fm-3-3', type: 'Skeleton' },
  ],
  4: [
    { id: 'fm-4-1', type: 'Owlbear' },
    { id: 'fm-4-2', type: 'Giant' },
    { id: 'fm-4-3', type: 'Basilisk' },
  ],
  5: [
    { id: 'fm-5-1', type: 'Black Dragon' },
    { id: 'fm-5-2', type: 'Green Dragon' },
    { id: 'fm-5-3', type: 'Red Dragon' },
  ],
  6: [
    { id: 'fm-6-1', type: 'Lich' },
    { id: 'fm-6-2', type: 'Beholder' },
    { id: 'fm-6-3', type: 'Vampire' },
    { id: 'fm-6-4', type: 'Blue Dragon' },
  ],
  7: [
    { id: 'fm-7-1', type: 'Death Knight' },
    { id: 'fm-7-2', type: 'Red Dragon' },
    { id: 'fm-7-3', type: 'Mind Flayer' },
    { id: 'fm-7-4', type: 'Lich' },
  ],
};

export const LEVEL_UNIQUE_MONSTERS: Record<number, UniqueMonsterDef[]> = {
  6: [
    { id: 'unique-aboleth',    type: 'Aboleth'    },
    { id: 'unique-dracolich',  type: 'Dracolich'  },
  ],
  7: [
    { id: 'unique-nightwalker', type: 'Nightwalker' },
    { id: 'unique-tarrasque',   type: 'Tarrasque'   },
    { id: 'unique-tiamat',      type: 'Tiamat'      },
    { id: 'unique-asmodeus',    type: 'Asmodeus'    },
  ],
};

export const trapVariants: string[] = [
  'pit',
  'poison-needle',
  'falling-stone',
  'fire-blast',
  'acid-spray',
  'teleport',
  'alarm',
  'attribute-rune',
];

// Description IDs by level (used to select atmospheric descriptions)
export const descriptionIds: Record<number, string[]> = {
  1: ['slime-mold', 'deep-scratches', 'goblin-bones', 'cold-wind', 'stone-animals',
      'carved-eye', 'ozone', 'ancient-torch', 'worn-stone', 'distant-sound',
      'dried-blood', 'iron-smell', 'smoky-air', 'boot-prints', 'cobwebs'],
  2: ['slime-mold', 'goblin-bones', 'warm-stones', 'mold-patches', 'slime-trail',
      'gnawed-bones', 'rat-squeaks', 'fetid-air', 'green-stain', 'rotten-smell',
      'dirty-water', 'boot-prints', 'claw-marks', 'iron-smell', 'distant-chanting'],
  3: ['cold-wind', 'carved-eye', 'deep-scratches', 'frost-coating', 'bone-dust',
      'stone-sarcophagus', 'candle-stub', 'death-smell', 'eerie-silence',
      'unnatural-cold', 'hollow-echoes', 'dust-drift', 'weeping-stone', 'grave-smell', 'old-darkness'],
  4: ['warm-stones', 'acid-pitting', 'scorched-floor', 'giant-footprint', 'huge-bones',
      'deep-grooves', 'crystal-growths', 'underground-river', 'earthquake-crack',
      'mineral-smell', 'echoing-roar', 'rubble-pile', 'stalactites', 'hot-stone', 'far-thunder'],
  5: ['scorched-floor', 'acid-pitting', 'ozone', 'frost-coating', 'scale-large',
      'acid-splash', 'smoke-smell', 'sulfur-smell', 'claw-gouges-stone',
      'molten-rock', 'steam-vent', 'drake-skull', 'burnt-armor', 'acid-pools', 'heat-shimmer'],
  6: ['cold-wind', 'unnatural-cold', 'psychic-hum', 'black-water', 'strange-sigil',
      'whisper-wall', 'impossible-shadow', 'broken-mind-rune', 'crystalline-web',
      'void-stain', 'dead-magic', 'alien-script', 'eye-shapes', 'silence-zone', 'dark-altar'],
  7: ['heat-shimmer', 'rivers-of-fire', 'infernal-runes', 'iron-throne-distant',
      'screaming-wind', 'bone-architecture', 'brimstone', 'infernal-heat',
      'demon-marks', 'hellish-choir', 'gravity-wrong', 'time-distortion',
      'asmodeus-presence', 'scorched-angels', 'final-warning'],
};
