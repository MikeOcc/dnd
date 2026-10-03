import type { Monster, MonsterDefinition, MonsterType } from './types.js';
import type { RNG } from './random.js';
import { MONSTER_SCALING } from './config.js';

const DEFINITIONS: Record<MonsterType, MonsterDefinition> = {
  'Kobold': {
    type: 'Kobold', isUndead: false, isUnique: false,
    minLevel: 1, maxLevel: 6, naturalTier: 1, minDungeonLevel: 1, speed: 1.2,
    baseHpPerLevel: 4, baseAttackPerLevel: 1.5, baseDefensePerLevel: 0.8,
    fireballResistance: 1.0,
    lightningResistance: 2.0,  // weak to lightning
    encounterIntro: ['A scaly little creature leaps from the shadows.', '', 'You have encountered a Level {LVL} Kobold!'],
    specialAbilities: [],
  },
  'Goblin': {
    type: 'Goblin', isUndead: false, isUnique: false,
    minLevel: 1, maxLevel: 8, naturalTier: 1, minDungeonLevel: 1, speed: 1.1,
    baseHpPerLevel: 5, baseAttackPerLevel: 1.8, baseDefensePerLevel: 1.0,
    fireballResistance: 1.0,
    encounterIntro: ['A goblin grins at you with yellow teeth.', '', 'You have encountered a Level {LVL} Goblin!'],
    specialAbilities: [],
  },
  'Orc': {
    type: 'Orc', isUndead: false, isUnique: false,
    minLevel: 2, maxLevel: 30, naturalTier: 2, minDungeonLevel: 1, speed: 1.0,
    baseHpPerLevel: 7, baseAttackPerLevel: 2.5, baseDefensePerLevel: 1.5,
    fireballResistance: 1.0,
    encounterIntro: ['A hulking orc bellows and raises its weapon.', '', 'You have encountered a Level {LVL} Orc!'],
    specialAbilities: [],
  },
  // A lion's body, a man's face full of shark's teeth, bat wings, and a tail
  // that flings iron spikes. The Orc King keeps one at his door; others roam
  // the deeper levels.
  'Manticore': {
    type: 'Manticore', isUndead: false, isUnique: false,
    minLevel: 52, maxLevel: 60, naturalTier: 6, minDungeonLevel: 6, speed: 1.1,
    baseHpPerLevel: 11, baseAttackPerLevel: 4.0, baseDefensePerLevel: 2.5,
    fireballResistance: 1.0,
    encounterIntro: [
      'A lion the size of a horse pads out of the dark, bat wings folded on its back.',
      'It has the face of a bearded man, and it smiles with three rows of teeth.',
      'Its tail rises over its shoulder, bristling with iron spikes.',
      '',
      'You have encountered a Level {LVL} Manticore!',
    ],
    specialAbilities: ['bite', 'twin-claws', 'tail-whip', 'poison-stinger'],  // see combat.ts, manticoreAction
  },
  // A snake as thick as a barrel and longer than the corridor it fills. It
  // coils and crushes (combat.ts, titanoboaAction).
  'Titanoboa': {
    type: 'Titanoboa', isUndead: false, isUnique: false,
    minLevel: 54, maxLevel: 60, naturalTier: 8, minDungeonLevel: 7, speed: 0.9,
    baseHpPerLevel: 20, baseAttackPerLevel: 4.4, baseDefensePerLevel: 3.0,
    fireballResistance: 1.0, coldResistance: 1.4,
    encounterIntro: [
      'The floor ahead moves. Then you see it is not the floor.',
      'Coils as thick as a barrel slide out of the dark, scale over scale, and keep coming.',
      'A head the size of a horse rises above you, tongue tasting the air.',
      '',
      'You have encountered a Level {LVL} Titanoboa!',
    ],
    specialAbilities: ['crushing-coils', 'titan-bite', 'tail-slam'],
  },
  // A gaunt, antlered spirit of starvation and winter, forever hungry. It
  // regenerates unless burned (combat.ts, wendigoAction).
  'Wendigo': {
    type: 'Wendigo', isUndead: false, isUnique: false,
    minLevel: 52, maxLevel: 60, naturalTier: 8, minDungeonLevel: 7, speed: 1.3,
    baseHpPerLevel: 13, baseAttackPerLevel: 4.2, baseDefensePerLevel: 2.5,
    fireballResistance: 1.8, coldResistance: 0.2,
    encounterIntro: [
      'From somewhere behind you, a friend\'s voice calls your name. You are alone down here.',
      'The air turns bitterly cold. Frost spreads across the walls.',
      'Something impossibly tall and thin unfolds from the dark: grey skin stretched over bone,',
      'a skull crowned with antlers, and a lipless mouth that will not stop chewing.',
      '',
      'You have encountered a Level {LVL} Wendigo!',
    ],
    specialAbilities: ['frostbite-claws', 'devouring-bite', 'hunger-howl'],
  },
  // A towering spirit of wind and fire, legless, borne on a wisp of smoke.
  // Fights in combat.ts, djinnAction.
  'Djinn': {
    type: 'Djinn', isUndead: false, isUnique: false,
    minLevel: 40, maxLevel: 60, naturalTier: 8, minDungeonLevel: 5, speed: 1.3,
    baseHpPerLevel: 14, baseAttackPerLevel: 4.0, baseDefensePerLevel: 3.0,
    fireballResistance: 0.5, lightningResistance: 1.2,
    encounterIntro: [
      'A hot wind howls down the passage, full of stinging sand.',
      'It gathers into a shape: a towering, blue-skinned figure, bare-chested and',
      'bound in gold, a blazing ruby set in its brow. Below the waist it has no legs,',
      'only a twisting tail of smoke that never quite touches the floor.',
      '',
      '"You have not summoned me, little one. That was your mistake."',
      '',
      'You have encountered a Level {LVL} Djinn!',
    ],
    specialAbilities: ['dust-storm', 'ruby-ray', 'djinn-punch', 'wisp-choke'],
  },
  // A bird of living flame. Fights in combat.ts, phoenixAction; rises once
  // from its ashes (game-engine.ts).
  'Phoenix': {
    type: 'Phoenix', isUndead: false, isUnique: false,
    minLevel: 50, maxLevel: 70, naturalTier: 9, minDungeonLevel: 6, speed: 1.4,
    baseHpPerLevel: 14, baseAttackPerLevel: 4.8, baseDefensePerLevel: 3.5,
    fireballResistance: 0.0, coldResistance: 1.5,
    encounterIntro: [
      'The darkness ahead turns gold, then white.',
      'A great bird of living flame unfolds its wings from wall to wall,',
      'every feather a tongue of fire, its eyes like two small suns.',
      '',
      'You have encountered a Level {LVL} Phoenix!',
    ],
    specialAbilities: ['talon-flurry', 'phoenix-flare', 'phoenix-screech'],
  },
  // A glowing, ghostly woman whose wail can stop a heart. Fights in
  // combat.ts, bansheeAction; can turn invisible (game-engine.ts).
  'Banshee': {
    type: 'Banshee', isUndead: true, isUnique: false,
    minLevel: 30, maxLevel: 55, naturalTier: 7, minDungeonLevel: 4, speed: 1.2,
    baseHpPerLevel: 9, baseAttackPerLevel: 4.2, baseDefensePerLevel: 2.5,
    fireballResistance: 0.8, coldResistance: 0.3,
    encounterIntro: [
      'A soft, sorrowful singing drifts down the corridor.',
      'A woman glides toward you, pale and glowing, her feet not touching the stone.',
      'Her hair drifts as if underwater. Her face is beautiful, until it is not.',
      '',
      'You have encountered a Level {LVL} Banshee!',
    ],
    specialAbilities: ['banshee-wail', 'chill-touch', 'dread-whisper', 'spectral-bolt'],
  },
  // A great white unicorn: dangerous to fight, and to those it deems worthy,
  // a blessing. Fights in combat.ts, unicornAction; see also petUnicorn.
  'Unicorn': {
    type: 'Unicorn', isUndead: false, isUnique: false,
    minLevel: 35, maxLevel: 55, naturalTier: 8, minDungeonLevel: 3, speed: 1.5,
    baseHpPerLevel: 13, baseAttackPerLevel: 4.0, baseDefensePerLevel: 3.5,
    fireballResistance: 0.8, lightningResistance: 0.8,
    encounterIntro: [
      'Silver light spills around the corner, and the air smells of spring.',
      'A unicorn steps into view: white as new snow, as tall as a warhorse,',
      'its spiral horn shining like a drawn blade. It lowers its head and regards you.',
      '',
      'It has not decided what you are yet.',
      '',
      'You have encountered a Level {LVL} Unicorn!',
    ],
    specialAbilities: ['horn-gore', 'hoof-strike', 'radiant-horn'],
  },
  // One of the deadliest things in the dungeon. Fights in combat.ts,
  // frostGiantAction.
  'Frost Giant': {
    type: 'Frost Giant', isUndead: false, isUnique: false,
    minLevel: 60, maxLevel: 85, naturalTier: 9, minDungeonLevel: 6, speed: 0.9,
    baseHpPerLevel: 24, baseAttackPerLevel: 5.2, baseDefensePerLevel: 4.5,
    fireballResistance: 1.5, coldResistance: 0.0,
    encounterIntro: [
      'The temperature plunges. Your breath freezes in your beard, and frost',
      'creeps across the walls with a sound like breaking glass.',
      'Then the giant ducks into view: blue-white skin, a beard of icicles,',
      'armor of black iron rimed with frost, and an axe of solid ice taller than you are.',
      '',
      '"WARM LITTLE THING. I WILL KEEP YOU FROZEN, FOREVER."',
      '',
      'You have encountered a Level {LVL} Frost Giant!',
    ],
    specialAbilities: ['ice-axe', 'ice-boulder', 'shard-storm', 'frost-stomp', 'winters-grasp'],
  },
  // ─── The great bestiary: these fight by move tables in bestiary.ts ─────────
  "Giant Spider": {
    type: "Giant Spider", isUndead: false, isUnique: false,
    minLevel: 2, maxLevel: 16, naturalTier: 2, minDungeonLevel: 1, speed: 1.2,
    baseHpPerLevel: 7, baseAttackPerLevel: 2.6, baseDefensePerLevel: 1.5,
    fireballResistance: 1.0,
    encounterIntro: [
      "Something drops from the ceiling on a thread of silk.",
      "A spider as big as a dog lands in front of you, all legs and glittering eyes.",
      '',
      'You have encountered a Level {LVL} Giant Spider!',
    ],
    specialAbilities: ["spider-bite", "web"],
  },
  "Stirge Swarm": {
    type: "Stirge Swarm", isUndead: false, isUnique: false,
    minLevel: 1, maxLevel: 12, naturalTier: 1, minDungeonLevel: 1, speed: 1.5,
    baseHpPerLevel: 5, baseAttackPerLevel: 2.0, baseDefensePerLevel: 1.0,
    fireballResistance: 1.0,
    encounterIntro: [
      "A high, whining hum fills the corridor.",
      "Out of the dark comes a cloud of stirges: bat-winged, mosquito-snouted, thirsty.",
      '',
      'You have encountered a Level {LVL} Stirge Swarm!',
    ],
    specialAbilities: ["stirge-drain"],
  },
  "Rust Monster": {
    type: "Rust Monster", isUndead: false, isUnique: false,
    minLevel: 3, maxLevel: 22, naturalTier: 3, minDungeonLevel: 2, speed: 1.1,
    baseHpPerLevel: 8, baseAttackPerLevel: 2.2, baseDefensePerLevel: 2.5,
    fireballResistance: 1.0,
    encounterIntro: [
      "A scuttling insectile thing with feathery antennae turns toward you.",
      "Its antennae quiver at the smell of your iron. It looks hungry.",
      '',
      'You have encountered a Level {LVL} Rust Monster!',
    ],
    specialAbilities: ["rusting-touch", "mandibles"],
  },
  "Bugbear": {
    type: "Bugbear", isUndead: false, isUnique: false,
    minLevel: 3, maxLevel: 20, naturalTier: 2, minDungeonLevel: 1, speed: 1.0,
    baseHpPerLevel: 9, baseAttackPerLevel: 3.0, baseDefensePerLevel: 2.0,
    fireballResistance: 1.0,
    encounterIntro: [
      "A huge, hairy goblin-kin unfolds from the shadows, morningstar in hand.",
      "It was waiting for you.",
      '',
      'You have encountered a Level {LVL} Bugbear!',
    ],
    specialAbilities: ["morningstar", "bugbear-grab"],
  },
  "Troll": {
    type: "Troll", isUndead: false, isUnique: false,
    minLevel: 15, maxLevel: 42, naturalTier: 5, minDungeonLevel: 3, speed: 1.0,
    baseHpPerLevel: 14, baseAttackPerLevel: 3.6, baseDefensePerLevel: 2.5,
    fireballResistance: 1.4, acidResistance: 1.3,
    encounterIntro: [
      "A long, green, rubbery shape stoops into view, warty and drooling.",
      "Its arms nearly drag on the floor. Old wounds have healed over in lumps.",
      '',
      'You have encountered a Level {LVL} Troll!',
    ],
    specialAbilities: ["troll-claws", "troll-bite"],
  },
  "Minotaur": {
    type: "Minotaur", isUndead: false, isUnique: false,
    minLevel: 18, maxLevel: 42, naturalTier: 5, minDungeonLevel: 3, speed: 1.1,
    baseHpPerLevel: 14, baseAttackPerLevel: 4.0, baseDefensePerLevel: 3.0,
    fireballResistance: 1.0,
    encounterIntro: [
      "Hooves strike stone. A bull's head lowers at the end of the passage,",
      "horns like scythes, a great axe in its fists. It snorts, and charges.",
      '',
      'You have encountered a Level {LVL} Minotaur!',
    ],
    specialAbilities: ["gore-charge", "great-axe"],
  },
  "Werewolf": {
    type: "Werewolf", isUndead: false, isUnique: false,
    minLevel: 12, maxLevel: 38, naturalTier: 4, minDungeonLevel: 3, speed: 1.3,
    baseHpPerLevel: 10, baseAttackPerLevel: 3.6, baseDefensePerLevel: 2.5,
    fireballResistance: 1.0,
    encounterIntro: [
      "A man staggers toward you, then doubles over. Bones crack. Fur bursts through skin.",
      "What straightens up is a wolf on two legs, taller than you, slavering.",
      '',
      'You have encountered a Level {LVL} Werewolf!',
    ],
    specialAbilities: ["were-claws", "were-bite"],
  },
  "Gargoyle": {
    type: "Gargoyle", isUndead: false, isUnique: false,
    minLevel: 15, maxLevel: 40, naturalTier: 4, minDungeonLevel: 3, speed: 1.1,
    baseHpPerLevel: 12, baseAttackPerLevel: 3.2, baseDefensePerLevel: 4.0,
    fireballResistance: 1.0, lightningResistance: 1.2,
    encounterIntro: [
      "One of the statues on the wall turns its head.",
      "Stone wings unfold with a grinding sound. It grins with granite teeth.",
      '',
      'You have encountered a Level {LVL} Gargoyle!',
    ],
    specialAbilities: ["stone-claws", "dive"],
  },
  "Harpy": {
    type: "Harpy", isUndead: false, isUnique: false,
    minLevel: 10, maxLevel: 32, naturalTier: 3, minDungeonLevel: 3, speed: 1.3,
    baseHpPerLevel: 7, baseAttackPerLevel: 3.0, baseDefensePerLevel: 2.0,
    fireballResistance: 1.0,
    encounterIntro: [
      "A song drifts down the passage, so sweet it hurts.",
      "Then you see the singer: a filthy bird-woman with a lovely face and hooked talons.",
      '',
      'You have encountered a Level {LVL} Harpy!',
    ],
    specialAbilities: ["harpy-song", "talons"],
  },
  "Hydra": {
    type: "Hydra", isUndead: false, isUnique: false,
    minLevel: 25, maxLevel: 55, naturalTier: 6, minDungeonLevel: 4, speed: 0.9,
    baseHpPerLevel: 16, baseAttackPerLevel: 2.4, baseDefensePerLevel: 3.0,
    fireballResistance: 1.2,
    encounterIntro: [
      "Water drips. Something heavy slides out of a pool, and then the necks come.",
      "One, two, three... five heads, all hissing, all hungry.",
      '',
      'You have encountered a Level {LVL} Hydra!',
    ],
    specialAbilities: ["hydra-heads"],
  },
  "Medusa": {
    type: "Medusa", isUndead: false, isUnique: false,
    minLevel: 25, maxLevel: 52, naturalTier: 6, minDungeonLevel: 4, speed: 1.0,
    baseHpPerLevel: 10, baseAttackPerLevel: 3.6, baseDefensePerLevel: 2.5,
    fireballResistance: 1.0,
    encounterIntro: [
      "Statues stand in the corridor ahead. Adventurers, frozen mid-scream.",
      "Something laughs softly. Hair hisses. Do not look at her face.",
      '',
      'You have encountered a Level {LVL} Medusa!',
    ],
    specialAbilities: ["stone-gaze", "snake-hair", "medusa-arrow"],
  },
  "Doppelganger": {
    type: "Doppelganger", isUndead: false, isUnique: false,
    minLevel: 20, maxLevel: 46, naturalTier: 5, minDungeonLevel: 4, speed: 1.1,
    baseHpPerLevel: 11, baseAttackPerLevel: 3.0, baseDefensePerLevel: 3.0,
    fireballResistance: 1.0,
    encounterIntro: [
      "Someone walks toward you out of the dark. They look exactly like you.",
      "They smile your smile, and draw your weapon.",
      '',
      'You have encountered a Level {LVL} Doppelganger!',
    ],
    specialAbilities: ["mirror-strike", "mirror-spell"],
  },
  "Purple Worm": {
    type: "Purple Worm", isUndead: false, isUnique: false,
    minLevel: 45, maxLevel: 60, naturalTier: 8, minDungeonLevel: 5, speed: 0.8,
    baseHpPerLevel: 26, baseAttackPerLevel: 4.6, baseDefensePerLevel: 3.0,
    fireballResistance: 1.0,
    encounterIntro: [
      "The floor heaves. Stone cracks. A purple wall of flesh bursts up through the rock,",
      "all mouth, ringed with teeth, wide enough to swallow a horse.",
      '',
      'You have encountered a Level {LVL} Purple Worm!',
    ],
    specialAbilities: ["worm-bite", "swallow", "tail-stinger"],
  },
  "Iron Golem": {
    type: "Iron Golem", isUndead: false, isUnique: false,
    minLevel: 45, maxLevel: 60, naturalTier: 8, minDungeonLevel: 5, speed: 0.7,
    baseHpPerLevel: 22, baseAttackPerLevel: 4.4, baseDefensePerLevel: 6.0,
    fireballResistance: 0.1, acidResistance: 0.1, coldResistance: 0.1, poisonResistance: 0.0, lightningResistance: 0.7,
    encounterIntro: [
      "Heavy footsteps ring like an anvil. A giant of black iron ducks through the arch,",
      "green fire behind its visor, steam hissing from its joints.",
      '',
      'You have encountered a Level {LVL} Iron Golem!',
    ],
    specialAbilities: ["iron-fists", "poison-gas"],
  },
  "Behir": {
    type: "Behir", isUndead: false, isUnique: false,
    minLevel: 40, maxLevel: 60, naturalTier: 7, minDungeonLevel: 5, speed: 1.2,
    baseHpPerLevel: 16, baseAttackPerLevel: 4.2, baseDefensePerLevel: 3.5,
    fireballResistance: 1.0, lightningResistance: 0.0,
    encounterIntro: [
      "Something long and blue skitters along the ceiling on a dozen legs.",
      "It drops to the floor, a horned serpent the length of a wagon train, crackling with lightning.",
      '',
      'You have encountered a Level {LVL} Behir!',
    ],
    specialAbilities: ["behir-lightning", "behir-bite", "behir-coils"],
  },
  "Rakshasa": {
    type: "Rakshasa", isUndead: false, isUnique: false,
    minLevel: 45, maxLevel: 60, naturalTier: 8, minDungeonLevel: 6, speed: 1.1,
    baseHpPerLevel: 13, baseAttackPerLevel: 4.2, baseDefensePerLevel: 3.5,
    fireballResistance: 1.0,
    encounterIntro: [
      "A gentleman in fine silks bows to you. His hands are on backward.",
      "When he raises his head it is a tiger's, and it is smiling. Magic slides off him like rain.",
      '',
      'You have encountered a Level {LVL} Rakshasa!',
    ],
    specialAbilities: ["rakshasa-claws", "rakshasa-curse", "rakshasa-illusion"],
  },
  "Death Tyrant": {
    type: "Death Tyrant", isUndead: true, isUnique: false,
    minLevel: 50, maxLevel: 60, naturalTier: 9, minDungeonLevel: 6, speed: 0.9,
    baseHpPerLevel: 15, baseAttackPerLevel: 4.4, baseDefensePerLevel: 3.5,
    fireballResistance: 1.0,
    encounterIntro: [
      "A great eye-tyrant drifts toward you. Its flesh is grey and peeling, its eyestalks withered.",
      "It has been dead a long time, and it is still hungry.",
      '',
      'You have encountered a Level {LVL} Death Tyrant!',
    ],
    specialAbilities: ["tyrant-rays", "tyrant-bite"],
  },
  "Demilich": {
    type: "Demilich", isUndead: true, isUnique: false,
    minLevel: 55, maxLevel: 60, naturalTier: 10, minDungeonLevel: 7, speed: 1.0,
    baseHpPerLevel: 9, baseAttackPerLevel: 4.6, baseDefensePerLevel: 5.0,
    fireballResistance: 1.0,
    encounterIntro: [
      "On a heap of dust lies a skull, gems set in its eye sockets and teeth.",
      "It rises, slowly, into the air. The gems begin to glow. It knows your name.",
      '',
      'You have encountered a Level {LVL} Demilich!',
    ],
    specialAbilities: ["soul-howl", "demilich-curse", "life-leech"],
  },
  "Chimera": {
    type: "Chimera", isUndead: false, isUnique: false,
    minLevel: 35, maxLevel: 55, naturalTier: 7, minDungeonLevel: 5, speed: 1.1,
    baseHpPerLevel: 15, baseAttackPerLevel: 3.8, baseDefensePerLevel: 3.0,
    fireballResistance: 1.0,
    encounterIntro: [
      "A lion's roar, a goat's bleat and a dragon's hiss, all from one beast.",
      "It stalks forward on lion's paws, three heads on three necks, bat wings spread.",
      '',
      'You have encountered a Level {LVL} Chimera!',
    ],
    specialAbilities: ["chimera-heads"],
  },
  "Pit Fiend": {
    type: "Pit Fiend", isUndead: false, isUnique: false,
    minLevel: 55, maxLevel: 80, naturalTier: 9, minDungeonLevel: 7, speed: 1.0,
    baseHpPerLevel: 20, baseAttackPerLevel: 5.0, baseDefensePerLevel: 4.5,
    fireballResistance: 0.2, poisonResistance: 0.2,
    encounterIntro: [
      "The heat of a furnace rolls over you. A towering, red-scaled devil folds its wings,",
      "a general of the Nine Hells. Dread pours off it like smoke.",
      '',
      'You have encountered a Level {LVL} Pit Fiend!',
    ],
    specialAbilities: ["fiend-bite", "fiend-claws", "hellfire", "fiend-mace"],
  },
  "Balor": {
    type: "Balor", isUndead: false, isUnique: false,
    minLevel: 55, maxLevel: 85, naturalTier: 10, minDungeonLevel: 7, speed: 1.1,
    baseHpPerLevel: 22, baseAttackPerLevel: 5.4, baseDefensePerLevel: 4.5,
    fireballResistance: 0.1, poisonResistance: 0.2,
    encounterIntro: [
      "Flame and shadow fill the corridor, and something vast stands inside them.",
      "A demon of fire, a whip of flame in one hand and a sword of lightning in the other.",
      '',
      'You have encountered a Level {LVL} Balor!',
    ],
    specialAbilities: ["balor-whip", "balor-sword", "balor-flames"],
  },
  "Marilith": {
    type: "Marilith", isUndead: false, isUnique: false,
    minLevel: 50, maxLevel: 75, naturalTier: 9, minDungeonLevel: 7, speed: 1.2,
    baseHpPerLevel: 16, baseAttackPerLevel: 3.0, baseDefensePerLevel: 4.0,
    fireballResistance: 1.0, poisonResistance: 0.3,
    encounterIntro: [
      "A serpent's tail coils in the dark, rising into the body of a woman.",
      "She has six arms, and a sword in every one.",
      '',
      'You have encountered a Level {LVL} Marilith!',
    ],
    specialAbilities: ["six-swords"],
  },
  "Erinyes": {
    type: "Erinyes", isUndead: false, isUnique: false,
    minLevel: 45, maxLevel: 60, naturalTier: 8, minDungeonLevel: 7, speed: 1.4,
    baseHpPerLevel: 13, baseAttackPerLevel: 4.0, baseDefensePerLevel: 3.5,
    fireballResistance: 1.0,
    encounterIntro: [
      "Black-feathered wings, a beautiful terrible face, a burning longbow.",
      "A Fury of the Hells has marked you. You will not outrun her.",
      '',
      'You have encountered a Level {LVL} Erinyes!',
    ],
    specialAbilities: ["fury-arrows", "fury-rope", "fury-sword"],
  },
  // The one Orc King, on level 4: a towering warlord in black plate, a
  // veteran of a hundred wars, who calls on Gruumsh for a few dark gifts.
  // His fighting is in combat.ts (orcKingAction).
  'Orc King': {
    type: 'Orc King', isUndead: false, isUnique: true,
    minLevel: 80, maxLevel: 90, naturalTier: 7, minDungeonLevel: 4, speed: 1.0,
    baseHpPerLevel: 15, baseAttackPerLevel: 2.9, baseDefensePerLevel: 5.0,
    fireballResistance: 0.8, lightningResistance: 0.9,
    encounterIntro: [
      'War drums thunder, and the passage fills with torchlight.',
      'A towering orc in blackened plate rises from a throne of shields,',
      'an iron crown on his brow and a rune-cut axe in his fist.',
      '',
      '"I HAVE KILLED A HUNDRED OF YOUR HEROES. YOU WILL BE A HUNDRED AND ONE."',
      '',
      'THE ORC KING, Level {LVL}, CHOSEN OF GRUUMSH!',
    ],
    specialAbilities: ['axe-flurry', 'shield-slam', 'war-chant', 'curse-of-gruumsh', 'eye-of-gruumsh'],
  },
  'Giant': {
    type: 'Giant', isUndead: false, isUnique: false,
    minLevel: 5, maxLevel: 20, naturalTier: 4, minDungeonLevel: 2, speed: 0.9,
    baseHpPerLevel: 12, baseAttackPerLevel: 4.0, baseDefensePerLevel: 2.0,
    fireballResistance: 1.0,
    encounterIntro: ['The ground shakes as an enormous shape lumbers forward.', '', 'You have encountered a Level {LVL} Giant!'],
    specialAbilities: [],
  },
  'Owlbear': {
    type: 'Owlbear', isUndead: false, isUnique: false,
    minLevel: 3, maxLevel: 15, naturalTier: 3, minDungeonLevel: 1, speed: 1.0,
    baseHpPerLevel: 9, baseAttackPerLevel: 3.0, baseDefensePerLevel: 1.8,
    fireballResistance: 1.0,
    encounterIntro: ['Something between a bear and an owl blocks the corridor.', '', 'You have encountered a Level {LVL} Owlbear!'],
    specialAbilities: [],
  },
  'Displacer Beast': {
    type: 'Displacer Beast', isUndead: false, isUnique: false,
    minLevel: 4, maxLevel: 16, naturalTier: 3, minDungeonLevel: 2, speed: 1.3,
    baseHpPerLevel: 8, baseAttackPerLevel: 3.5, baseDefensePerLevel: 2.5,
    fireballResistance: 1.0,
    encounterIntro: ['You reach for the beast but strike only air. It is not where you see it.', '', 'You have encountered a Level {LVL} Displacer Beast!'],
    specialAbilities: ['displacement'],
  },
  'Basilisk': {
    type: 'Basilisk', isUndead: false, isUnique: false,
    minLevel: 6, maxLevel: 20, naturalTier: 4, minDungeonLevel: 3, speed: 0.7,
    baseHpPerLevel: 10, baseAttackPerLevel: 3.0, baseDefensePerLevel: 2.0,
    fireballResistance: 1.0,
    encounterIntro: ['You avert your gaze. Something heavy moves in the darkness.', '', 'You have encountered a Level {LVL} Basilisk!'],
    specialAbilities: ['gaze-paralyze'],
  },
  'Mold': {
    type: 'Mold', isUndead: false, isUnique: false,
    minLevel: 1, maxLevel: 10, naturalTier: 1, minDungeonLevel: 1, speed: 0.3,
    baseHpPerLevel: 6, baseAttackPerLevel: 2.0, baseDefensePerLevel: 0.5,
    fireballResistance: 1.0,
    lightningResistance: 2.0,  // weak to lightning
    encounterIntro: ['A pulsating mass of mold oozes toward you.', '', 'You have encountered a Level {LVL} Mold!'],
    specialAbilities: ['spore-poison'],
  },
  'Slime Mold': {
    type: 'Slime Mold', isUndead: false, isUnique: false,
    minLevel: 2, maxLevel: 12, naturalTier: 2, minDungeonLevel: 1, speed: 0.4,
    baseHpPerLevel: 8, baseAttackPerLevel: 2.5, baseDefensePerLevel: 1.0,
    fireballResistance: 1.0,
    lightningResistance: 2.0,  // weak to lightning
    encounterIntro: ['A glistening slime mold absorbs the light around it.', '', 'You have encountered a Level {LVL} Slime Mold!'],
    specialAbilities: ['acid-touch'],
  },
  'Gelatinous Cube': {
    type: 'Gelatinous Cube', isUndead: false, isUnique: false,
    minLevel: 3, maxLevel: 14, naturalTier: 2, minDungeonLevel: 1, speed: 0.5,
    baseHpPerLevel: 10, baseAttackPerLevel: 3.0, baseDefensePerLevel: 1.5,
    fireballResistance: 1.0,
    encounterIntro: ['The corridor ahead shimmers. You realize too late it is not empty.', '', 'You have encountered a Level {LVL} Gelatinous Cube!'],
    specialAbilities: ['engulf-paralyze'],
  },
  'Mimic': {
    type: 'Mimic', isUndead: false, isUnique: false,
    minLevel: 5, maxLevel: 18, naturalTier: 3, minDungeonLevel: 2, speed: 0.8,
    baseHpPerLevel: 11, baseAttackPerLevel: 4.0, baseDefensePerLevel: 2.0,
    fireballResistance: 1.0,
    encounterIntro: ['The chest beside the wall unfolds with a horrible sound.', '', 'You have encountered a Level {LVL} Mimic!'],
    specialAbilities: ['adhesive'],
  },
  'Skeleton': {
    type: 'Skeleton', isUndead: true, isUnique: false,
    minLevel: 1, maxLevel: 10, naturalTier: 1, minDungeonLevel: 2, speed: 0.9,
    baseHpPerLevel: 5, baseAttackPerLevel: 2.0, baseDefensePerLevel: 1.0,
    fireballResistance: 1.0,
    encounterIntro: ['Bones clatter in the darkness.', '', 'You have encountered a Level {LVL} Skeleton!'],
    specialAbilities: [],
  },
  'Zombie': {
    type: 'Zombie', isUndead: true, isUnique: false,
    minLevel: 2, maxLevel: 12, naturalTier: 2, minDungeonLevel: 2, speed: 0.6,
    baseHpPerLevel: 8, baseAttackPerLevel: 2.5, baseDefensePerLevel: 1.2,
    fireballResistance: 1.0,
    encounterIntro: ['A shambling shape drags itself toward you.', '', 'You have encountered a Level {LVL} Zombie!'],
    specialAbilities: [],
  },
  'Wight': {
    type: 'Wight', isUndead: true, isUnique: false,
    minLevel: 5, maxLevel: 18, naturalTier: 4, minDungeonLevel: 3, speed: 1.0,
    baseHpPerLevel: 9, baseAttackPerLevel: 4.0, baseDefensePerLevel: 2.5,
    fireballResistance: 1.0,
    encounterIntro: ['A grey shape with hollow eyes drifts through the stone wall.', '', 'You have encountered a Level {LVL} Wight!'],
    specialAbilities: ['life-drain'],
  },
  // Eaters of the dead, in packs on the middle levels. A ghoul's claws carry
  // a numbing paralysis, and its bite festers.
  'Ghoul': {
    type: 'Ghoul', isUndead: true, isUnique: false,
    minLevel: 4, maxLevel: 55, naturalTier: 3, minDungeonLevel: 2, speed: 1.2,
    baseHpPerLevel: 8, baseAttackPerLevel: 3.2, baseDefensePerLevel: 2.0,
    fireballResistance: 1.0,
    encounterIntro: [
      'A wet crunching stops. Something hunched over a corpse lifts its head.',
      'Grey, hairless, all knuckles and teeth, it grins at you with a mouthful of someone else.',
      '',
      'You have encountered a Level {LVL} Ghoul!',
    ],
    specialAbilities: ['ghoul-claws', 'filthy-bite'],
  },
  'Spectre': {
    type: 'Spectre', isUndead: true, isUnique: false,
    minLevel: 6, maxLevel: 20, naturalTier: 5, minDungeonLevel: 3, speed: 1.2,
    baseHpPerLevel: 7, baseAttackPerLevel: 4.5, baseDefensePerLevel: 2.0,
    fireballResistance: 1.0,
    encounterIntro: ['A vast shape emerges from the darkness.', '', 'You have encountered a Level {LVL} Spectre!'],
    specialAbilities: ['life-drain', 'terror'],
  },
  'Vampire': {
    type: 'Vampire', isUndead: true, isUnique: false,
    minLevel: 8, maxLevel: 50, naturalTier: 6, minDungeonLevel: 4, speed: 1.1,
    baseHpPerLevel: 10, baseAttackPerLevel: 5.0, baseDefensePerLevel: 3.0,
    fireballResistance: 1.0,
    encounterIntro: ['A pale figure steps from the shadow, its eyes red as garnets.', '', 'You have encountered a Level {LVL} Vampire!'],
    specialAbilities: ['life-drain', 'charm'],
  },
  'Death Knight': {
    type: 'Death Knight', isUndead: true, isUnique: false,
    minLevel: 10, maxLevel: 30, naturalTier: 7, minDungeonLevel: 4, speed: 1.0,
    baseHpPerLevel: 13, baseAttackPerLevel: 6.0, baseDefensePerLevel: 4.0,
    fireballResistance: 0.75,
    encounterIntro: ['Blackened armor scrapes the stone as the figure turns to face you.', '', 'You have encountered a Level {LVL} Death Knight!'],
    specialAbilities: ['hellfire', 'terror'],
  },
  'Lich': {
    type: 'Lich', isUndead: true, isUnique: false,
    minLevel: 12, maxLevel: 35, naturalTier: 8, minDungeonLevel: 5, speed: 0.9,
    baseHpPerLevel: 11, baseAttackPerLevel: 6.5, baseDefensePerLevel: 3.5,
    fireballResistance: 0.8,
    encounterIntro: ['A skeletal figure in tattered robes raises one bony hand.', '', 'You have encountered a Level {LVL} Lich!', 'Its eyes glow with cold blue fire.'],
    specialAbilities: ['fireball', 'life-drain', 'paralysis-touch'],
  },
  'Wizard': {
    type: 'Wizard', isUndead: false, isUnique: false,
    minLevel: 8, maxLevel: 30, naturalTier: 6, minDungeonLevel: 3, speed: 1.0,
    baseHpPerLevel: 7, baseAttackPerLevel: 5.5, baseDefensePerLevel: 2.0,
    fireballResistance: 0.9,
    encounterIntro: [
      'A gaunt Wizard steps from the shadows.',
      '',
      'His silver beard reaches nearly to the floor.',
      'Other rumors about his dimensions remain unconfirmed.',
      '',
      'You have encountered a Level {LVL} Wizard!',
    ],
    specialAbilities: ['fireball', 'lightning-bolt', 'acid-bolt', 'light-bolt', 'teleport', 'make-naked'],
  },
  'Beholder': {
    type: 'Beholder', isUndead: false, isUnique: false,
    minLevel: 10, maxLevel: 30, naturalTier: 7, minDungeonLevel: 4, speed: 1.0,
    baseHpPerLevel: 12, baseAttackPerLevel: 6.0, baseDefensePerLevel: 3.5,
    fireballResistance: 0.9,
    lightningResistance: 2.0,  // weak to lightning
    encounterIntro: ['A great floating sphere covered in eyes rotates slowly toward you.', '', 'You have encountered a Level {LVL} Beholder!'],
    // Rays are chosen by level in combat.ts (see COMBAT.BEHOLDER_RAYS); the
    // central eye's antimagic is handled where spells and gems are used.
    specialAbilities: ['fear-ray', 'slow-ray', 'enervation-ray', 'telekinetic-ray', 'paralyze-ray',
      'sleep-ray', 'charm-ray', 'petrify-ray', 'disintegrate-ray', 'death-ray'],
  },
  'Mind Flayer': {
    type: 'Mind Flayer', isUndead: false, isUnique: false,
    minLevel: 10, maxLevel: 30, naturalTier: 7, minDungeonLevel: 4, speed: 1.0,
    baseHpPerLevel: 10, baseAttackPerLevel: 5.5, baseDefensePerLevel: 3.0,
    fireballResistance: 1.0,
    encounterIntro: ['Tentacles writhe from a pale, bloated face. Its thoughts press against yours.', '', 'You have encountered a Level {LVL} Mind Flayer!'],
    specialAbilities: ['psychic-blast', 'intelligence-drain', 'fear', 'spell-disrupt'],
  },
  'Elder Oblex': {
    type: 'Elder Oblex', isUndead: false, isUnique: false,
    minLevel: 15, maxLevel: 60, naturalTier: 8, minDungeonLevel: 5, speed: 0.8,
    baseHpPerLevel: 15, baseAttackPerLevel: 7.0, baseDefensePerLevel: 4.0,
    fireballResistance: 1.0,
    encounterIntro: ['A translucent, glistening mass pulses in the dark.', '', 'Dozens of half-formed faces surface within it and scream in borrowed voices.', '', 'You have encountered a Level {LVL} Elder Oblex!'],
    specialAbilities: ['psychic-blast', 'intelligence-drain', 'memory-theft', 'spell-disrupt'],
  },
  'Sanguinid': {
    type: 'Sanguinid', isUndead: false, isUnique: false,
    minLevel: 1, maxLevel: 85, naturalTier: 7, minDungeonLevel: 1, speed: 0.9,
    baseHpPerLevel: 13, baseAttackPerLevel: 7.5, baseDefensePerLevel: 3.5,
    fireballResistance: 1.0,
    acidResistance: 2.0,     // weak to acid
    lightVulnerable: true,   // weak to light — Prayer hits it like undead
    encounterIntro: ['A bloated, fanged shape drags itself up from the black water, tentacles writhing.', '', 'You have encountered a Level {LVL} Sanguinid!'],
    specialAbilities: ['great-strength', 'blood-drain', 'flash-burn'],
  },
  'Black Dragon': {
    type: 'Black Dragon', isUndead: false, isUnique: false,
    minLevel: 8, maxLevel: 120, naturalTier: 7, minDungeonLevel: 3, speed: 1.0,
    baseHpPerLevel: 14, baseAttackPerLevel: 7.0, baseDefensePerLevel: 4.0,
    fireballResistance: 1.0,
    lightningResistance: 2.0,  // weak to lightning
    acidResistance: 0.3,       // resistant to its own breath weapon
    encounterIntro: ['Acid hisses as it strikes the stone floor.', '', 'You have encountered a Level {LVL} Black Dragon!'],
    specialAbilities: ['acid-breath'],
  },
  'Green Dragon': {
    type: 'Green Dragon', isUndead: false, isUnique: false,
    minLevel: 8, maxLevel: 95, naturalTier: 7, minDungeonLevel: 3, speed: 1.0,
    baseHpPerLevel: 14, baseAttackPerLevel: 6.5, baseDefensePerLevel: 4.0,
    fireballResistance: 1.0,
    acidResistance: 2.0,       // weak to acid
    poisonResistance: 0.3,     // resistant to its own breath weapon
    encounterIntro: ['Venomous mist curls from enormous jaws.', '', 'You have encountered a Level {LVL} Green Dragon!'],
    specialAbilities: ['poison-breath'],
  },
  'Blue Dragon': {
    type: 'Blue Dragon', isUndead: false, isUnique: false,
    minLevel: 8, maxLevel: 120, naturalTier: 7, minDungeonLevel: 3, speed: 1.0,
    baseHpPerLevel: 14, baseAttackPerLevel: 7.5, baseDefensePerLevel: 4.0,
    fireballResistance: 3.0,  // highly susceptible — triple damage from Fireball
    lightningResistance: 0.3, // resistant to its own breath weapon
    encounterIntro: ['Thunder rolls through the stone corridor.', '', 'You have encountered a Level {LVL} Blue Dragon!'],
    specialAbilities: ['lightning-breath'],
  },
  'White Dragon': {
    type: 'White Dragon', isUndead: false, isUnique: false,
    minLevel: 8, maxLevel: 100, naturalTier: 7, minDungeonLevel: 3, speed: 0.9,
    baseHpPerLevel: 13, baseAttackPerLevel: 6.5, baseDefensePerLevel: 3.8,
    fireballResistance: 2.0,  // vulnerable to fireball
    coldResistance: 0.3,      // resistant to its own breath weapon
    encounterIntro: ['Frost rimes the walls as a pale shape descends.', '', 'You have encountered a Level {LVL} White Dragon!'],
    specialAbilities: ['frost-breath'],
  },
  // A dragon of living gold, hoarder of hoards. Fights in combat.ts,
  // goldDragonAction.
  'Gold Dragon': {
    type: 'Gold Dragon', isUndead: false, isUnique: false,
    minLevel: 40, maxLevel: 95, naturalTier: 9, minDungeonLevel: 5, speed: 1.0,
    baseHpPerLevel: 18, baseAttackPerLevel: 5.0, baseDefensePerLevel: 4.5,
    fireballResistance: 0.4, lightningResistance: 0.8,
    encounterIntro: [
      'Coins slide and chime underfoot. Then the whole floor of coins moves.',
      'A dragon rises out of the hoard, scales of burnished gold, eyes like molten coins,',
      'a great sack of treasure clutched in one claw as if it were a club.',
      '',
      '"A THIEF. HOW TIRESOME. YOU WILL MAKE A LOVELY ORNAMENT."',
      '',
      'You have encountered a Level {LVL} Gold Dragon!',
    ],
    specialAbilities: ['gold-wallop', 'gold-claws', 'gold-dust-breath', 'gilding'],
  },
  'Red Dragon': {
    type: 'Red Dragon', isUndead: false, isUnique: false,
    minLevel: 10, maxLevel: 95, naturalTier: 8, minDungeonLevel: 4, speed: 1.0,
    baseHpPerLevel: 16, baseAttackPerLevel: 8.0, baseDefensePerLevel: 4.5,
    fireballResistance: 0.25,  // strongly resistant to its own breath weapon
    lightningResistance: 2.0,  // weak to lightning
    coldResistance: 2.0,       // weak to cold
    encounterIntro: ['Heat floods the corridor. Flame flickers in the distance.', '', 'You have encountered a Level {LVL} Red Dragon!'],
    specialAbilities: ['fire-breath'],
  },
  'Aboleth': {
    type: 'Aboleth', isUndead: false, isUnique: true,
    minLevel: 60, maxLevel: 75, naturalTier: 9, minDungeonLevel: 6, speed: 0.8,
    baseHpPerLevel: 20, baseAttackPerLevel: 9.0, baseDefensePerLevel: 5.0,
    fireballResistance: 1.0,
    encounterIntro: [
      'Black water parts.',
      '',
      'An ancient shape the size of a house rises to the surface.',
      'Its thoughts enter your mind without invitation.',
      '',
      'THE ABOLETH REGARDS YOU WITH CONTEMPT.',
    ],
    specialAbilities: ['psychic-attack', 'slime-disease', 'mind-control', 'high-hp'],
  },
  'Dracolich': {
    type: 'Dracolich', isUndead: true, isUnique: true,
    minLevel: 60, maxLevel: 75, naturalTier: 9, minDungeonLevel: 6, speed: 0.9,
    baseHpPerLevel: 18, baseAttackPerLevel: 9.5, baseDefensePerLevel: 5.5,
    fireballResistance: 0.9,
    encounterIntro: [
      'A vast shape stirs among the bones.',
      '',
      'Dragon bones knit together and rise.',
      'Cold blue light fills empty eye sockets.',
      '',
      'THE DRACOLICH OPENS ITS JAWS.',
    ],
    specialAbilities: ['dragon-breath', 'necromantic-magic', 'life-drain', 'strong-defense'],
  },
  'Nightwalker': {
    type: 'Nightwalker', isUndead: true, isUnique: true,
    minLevel: 60, maxLevel: 75, naturalTier: 9, minDungeonLevel: 7, speed: 1.1,
    baseHpPerLevel: 16, baseAttackPerLevel: 10.0, baseDefensePerLevel: 5.0,
    fireballResistance: 1.0,
    encounterIntro: [
      'The torches gutter and die.',
      '',
      'Something tall and absolute walks out of the darkness.',
      '',
      'THE NIGHTWALKER DOES NOT SLOW.',
    ],
    specialAbilities: ['darkness', 'terror', 'life-drain', 'heavy-blow'],
  },
  'Tarrasque': {
    type: 'Tarrasque', isUndead: false, isUnique: true,
    minLevel: 72, maxLevel: 90, naturalTier: 10, minDungeonLevel: 7, speed: 1.0,
    baseHpPerLevel: 25, baseAttackPerLevel: 12.0, baseDefensePerLevel: 7.0,
    fireballResistance: 0.5,
    encounterIntro: [
      'THE DUNGEON SHAKES.',
      '',
      'Something that should not fit inside a dungeon',
      'does so anyway.',
      '',
      'THE TARRASQUE HAS FOUND YOU.',
    ],
    specialAbilities: ['enormous-hp', 'massive-attack', 'spell-resistance', 'hard-to-run'],
  },
  'Tiamat': {
    type: 'Tiamat', isUndead: false, isUnique: true,
    minLevel: 72, maxLevel: 90, naturalTier: 10, minDungeonLevel: 7, speed: 1.0,
    baseHpPerLevel: 22, baseAttackPerLevel: 11.0, baseDefensePerLevel: 6.5,
    fireballResistance: 0.5,  // has white dragon head so vulnerable in one sense, but multi-headed
    encounterIntro: [
      'Five shadows fall across you at once.',
      '',
      'Five pairs of eyes open in the darkness.',
      '',
      'TIAMAT, QUEEN OF EVIL DRAGONS, RISES.',
    ],
    specialAbilities: ['acid-breath', 'poison-breath', 'lightning-breath', 'frost-breath', 'fire-breath'],
  },
  'Asmodeus': {
    type: 'Asmodeus', isUndead: false, isUnique: true,
    minLevel: 80, maxLevel: 100, naturalTier: 10, minDungeonLevel: 7, speed: 1.0,
    baseHpPerLevel: 15, baseAttackPerLevel: 14.0, baseDefensePerLevel: 8.0,
    fireballResistance: 0.25,
    encounterIntro: [
      'You enter a vast circular chamber.',
      '',
      'A throne of iron stands at its center.',
      '',
      'The figure seated upon it rises.',
      '',
      'The dungeon shakes.',
      '',
      'ASMODEUS, LORD OF THE SEVENTH LEVEL,',
      'HAS BEEN WAITING FOR YOU.',
    ],
    specialAbilities: ['fireball', 'lightning-bolt', 'mummification', 'life-drain', 'terror', 'infernal-healing', 'ball-of-doo'],
  },
};

export function getDefinition(type: MonsterType): MonsterDefinition {
  return DEFINITIONS[type];
}

export function allDefinitions(): MonsterDefinition[] {
  return Object.values(DEFINITIONS);
}

export function createMonster(type: MonsterType, level: number, id: string): Monster {
  const def = DEFINITIONS[type];
  const clampedLevel = Math.max(def.minLevel, Math.min(def.maxLevel, level));
  const hp = Math.round(def.baseHpPerLevel * clampedLevel);

  return {
    id,
    type,
    level: clampedLevel,
    hp,
    maxHp: hp,
    definition: def,
    prayerPenalty: 0,
  };
}

export function randomMonsterLevel(
  characterLevel: number,
  dungeonDepth: number,
  rng: RNG,
  type?: MonsterType,
): number {
  const ranges = MONSTER_SCALING.LEVEL_RANGE_BY_DUNGEON_LEVEL;
  const range = ranges[Math.max(0, Math.min(ranges.length - 1, dungeonDepth - 1))];
  const rangeTop = Math.max(range.max, (type && MONSTER_SCALING.EXTENDED_RANGE_TOP[type]?.[dungeonDepth]) || 0);
  const uncappedMax = rangeTop + Math.floor(characterLevel / MONSTER_SCALING.CHAR_LEVEL_CAP_DIVISOR);
  const extended = !!type && MONSTER_SCALING.EXTENDED_CAP_TYPES.includes(type)
    && dungeonDepth >= MONSTER_SCALING.EXTENDED_CAP_MIN_DEPTH;
  const cap = extended
    ? (MONSTER_SCALING.EXTENDED_CAP_BY_DEPTH[type!]?.[dungeonDepth] ?? getDefinition(type!).maxLevel)
    : MONSTER_SCALING.HARD_LEVEL_CAP;
  const cappedMax = Math.min(cap, uncappedMax);
  return rng.int(range.min, Math.max(range.min, cappedMax));
}

export function pickRandomMonsterType(dungeonDepth: number, rng: RNG): MonsterType {
  const tiers = MONSTER_SCALING.MIN_NATURAL_TIER_BY_DUNGEON_LEVEL;
  const minTier = tiers[Math.max(0, Math.min(tiers.length - 1, dungeonDepth - 1))];
  const pool = (Object.values(DEFINITIONS) as MonsterDefinition[]).filter(
    d => !d.isUnique && d.minDungeonLevel <= dungeonDepth
      && (d.naturalTier >= minTier || MONSTER_SCALING.ANY_DEPTH_TYPES.includes(d.type)),
  );
  const picked = rng.pick(pool).type;
  const rare = MONSTER_SCALING.DEEP_RARE[picked];
  if (rare && dungeonDepth >= rare.fromDepth && rng.float() >= rare.keep) {
    return rng.pick(pool.filter(d => d.type !== picked)).type;
  }
  return picked;
}

export function monsterAttackText(type: MonsterType, damage: number, ability?: string): string {
  const actions: Record<string, string> = {
    'acid-breath':      `The ${type} breathes acid! You suffer ${damage} damage.`,
    'filthy-bite':      `The ${type} sinks its filthy teeth into you! You suffer ${damage} damage.`,
    'poison-breath':    `The ${type} exhales venom! You suffer ${damage} damage.`,
    'lightning-breath': `The ${type} unleashes lightning! You suffer ${damage} damage.`,
    'frost-breath':     `The ${type} breathes frost! You suffer ${damage} damage.`,
    'fire-breath':      `The ${type} breathes fire! You suffer ${damage} damage.`,
    'life-drain':       `The ${type} drains your life! You suffer ${damage} damage.`,
    'psychic-blast':    `The ${type} assaults your mind! You suffer ${damage} psychic damage.`,
    'psychic-attack':   `The ${type} invades your thoughts! You suffer ${damage} damage.`,
    'fireball':         `The ${type} hurls a fireball! You suffer ${damage} damage.`,
    'lightning-bolt':   `The ${type} casts Lightning Bolt! You suffer ${damage} damage.`,
    'acid-bolt':        `The ${type} hurls a bolt of searing acid! You suffer ${damage} damage.`,
    'light-bolt':       `The ${type} unleashes a blinding bolt of light! You suffer ${damage} damage.`,
    'slime-disease':    `The ${type} coats you in slime! You suffer ${damage} damage.`,
    'magic-blast':      `The ${type} fires a magic ray! You suffer ${damage} damage.`,
    'hellfire':         `The ${type} calls down hellfire! You suffer ${damage} damage.`,
    'darkness':         `The ${type} unleashes darkness! You suffer ${damage} damage.`,
    'heavy-blow':       `The ${type} strikes you with tremendous force! You suffer ${damage} damage.`,
    'dragon-breath':    `The ${type} breathes necrotic fire! You suffer ${damage} damage.`,
    'necromantic-magic':`The ${type} casts necromantic magic! You suffer ${damage} damage.`,
    'massive-attack':   `The ${type} crushes you! You suffer ${damage} damage.`,
    'mummification':    `Asmodeus wraps you in necrotic bindings! You suffer ${damage} damage.`,
    'infernal-healing': `Asmodeus draws on your vitality to heal himself!`,
    'ball-of-doo':      '',
    'terror':           `The ${type} fills you with supernatural terror! You suffer ${damage} damage.`,
    'great-strength':   `The ${type} seizes you with monstrous strength! You suffer ${damage} damage.`,
    'blood-drain':      `The ${type} sinks its fangs in and drains your blood! You suffer ${damage} damage.`,
    'flash-burn':       `The ${type} erupts in a blinding radioactive flash! You suffer ${damage} damage.`,
    'memory-theft':     `The ${type} pulls at your memories with grasping thoughts! You suffer ${damage} damage.`,
  };
  return actions[ability ?? ''] ?? `The ${type} strikes you for ${damage} damage.`;
}

/** An ancient ghoul's encounter text, used instead of the usual one from
 * GHOUL.ANCIENT_LEVEL up. */
export const ANCIENT_GHOUL_INTRO = [
  'The smell reaches you first: old graves, opened.',
  'Something crouches in the dark, grey skin gone hard as boot leather over a',
  'frame of knotted bone. It has been eating the dead down here for centuries.',
  'It turns its head, slowly, and smiles with far too many teeth.',
  '',
  'You have encountered an ancient Level {LVL} Ghoul!',
];

export const UNDEAD_TYPES: MonsterType[] = [
  'Skeleton', 'Zombie', 'Ghoul', 'Wight', 'Spectre', 'Banshee', 'Vampire', 'Death Knight', 'Lich', 'Dracolich', 'Nightwalker',
  'Death Tyrant', 'Demilich',
];

export function isUndead(type: MonsterType): boolean {
  return UNDEAD_TYPES.includes(type);
}

export const RANDOM_MONSTER_POOL: MonsterType[] = [
  'Kobold', 'Goblin', 'Orc', 'Giant', 'Owlbear', 'Manticore', 'Titanoboa', 'Wendigo',
  'Djinn', 'Phoenix', 'Banshee', 'Unicorn', 'Frost Giant', 'Displacer Beast', 'Basilisk',
  'Giant Spider', 'Stirge Swarm', 'Rust Monster', 'Bugbear', 'Troll', 'Minotaur', 'Werewolf', 'Gargoyle', 'Harpy', 'Hydra', 'Medusa', 'Doppelganger', 'Purple Worm', 'Iron Golem', 'Behir', 'Rakshasa', 'Death Tyrant', 'Demilich', 'Chimera', 'Pit Fiend', 'Balor', 'Marilith', 'Erinyes',
  'Mold', 'Slime Mold', 'Gelatinous Cube', 'Mimic',
  'Skeleton', 'Zombie', 'Ghoul', 'Wight', 'Spectre', 'Vampire', 'Death Knight', 'Lich',
  'Wizard', 'Beholder', 'Mind Flayer', 'Elder Oblex', 'Sanguinid',
  'Black Dragon', 'Green Dragon', 'Blue Dragon', 'White Dragon', 'Red Dragon', 'Gold Dragon',
];
