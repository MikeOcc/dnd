// The unique monsters make themselves felt before they're met. Asmodeus's
// voice reaches every level, and from level 4 down he lashes out from afar,
// harder the deeper you are and the nearer his lair. The others are felt on
// their own level (Tiamat faintly on the level above), more strongly the
// closer you are. The Dracolich sends remote fear. Everything stops once
// that monster is defeated. Nothing here can kill.

import type { Character, Direction, FxElement, MonsterType } from './types.js';
import type { RNG } from './random.js';
import { PRESENCE } from './config.js';
import { addStatusEffect } from './character.js';

export interface Lair { type: MonsterType; x: number; y: number }

export interface PresenceContext {
  char: Character;
  level: number;                  // current dungeon level
  lairs: Lair[];                  // living uniques on this level (and Tiamat from level 7 when on 6)
  asmodeusAlive: boolean;
  asmodeusLair: { x: number; y: number } | null;   // on level 7, if known
}

export interface PresenceEvent {
  messages: string[];
  fx?: FxElement;
  flee?: boolean;                 // Dracolich fear: bolt to a random far spot
  turnTo?: Direction;             // Dracolich fear: spun around
}

type Range = 'far' | 'mid' | 'near';

function rangeOf(dist: number): Range {
  return dist <= PRESENCE.NEAR ? 'near' : dist <= PRESENCE.MID ? 'mid' : 'far';
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

// ─── Asmodeus ────────────────────────────────────────────────────────────────

const VOICE: Record<'shallow' | 'middle' | 'deep', string[]> = {
  shallow: [
    'Another little morsel wanders into my house.',
    '{name}. What a small name. I will remember it anyway.',
    'Go back up the stairs, {name}. Or don\'t. I enjoy both endings.',
    'The first level is my garden. Mind where you step.',
    'I can hear your heart from here, {name}. It is very loud.',
  ],
  middle: [
    'Deeper, {name}. Every step you take down here, you take toward me.',
    'Your gold is already mine. I am simply letting you carry it for now.',
    'I have broken kings on these stones. You are not a king.',
    'Do you feel it, {name}? The floor grows warmer the closer you come.',
    'Every soul that has walked this corridor still walks it. Say hello.',
  ],
  deep: [
    'So close now, {name}. I have set a place for you at my table.',
    'Turn back and I will kill you quickly. Come on, and I will not.',
    'The Nine Hells are patient. I am less so.',
    'I have read the ending of your story, {name}. It is short.',
    'Kneel now and I may make you a doorkeeper. Refuse, and you will be the door.',
  ],
};

/** 0..1: weak on level 4, ramping with depth, and on level 7 with nearness to his lair. */
export function asmodeusFury(level: number, pos: { x: number; y: number }, lair: { x: number; y: number } | null): number {
  if (level < PRESENCE.ASMODEUS_ATTACK_MIN_LEVEL) return 0;
  if (level === 4) return 0.1;
  if (level === 5) return 0.25;
  if (level === 6) return 0.45;
  const proximity = lair ? Math.max(0, Math.min(1, 1 - dist(pos, lair) / PRESENCE.ASMODEUS_PROXIMITY_RANGE)) : 0;
  return 0.6 + 0.4 * proximity;
}

function asmodeusVoice(ctx: PresenceContext, rng: RNG): PresenceEvent {
  const tier = ctx.level <= 3 ? 'shallow' : ctx.level <= 5 ? 'middle' : 'deep';
  const line = rng.pick(VOICE[tier]).replace(/\{name\}/g, ctx.char.name);
  return { messages: ['A voice rolls through the stone, from nowhere and everywhere:', `"${line}"`] };
}

function asmodeusStrike(ctx: PresenceContext, rng: RNG): PresenceEvent {
  const { char } = ctx;
  const fury = asmodeusFury(ctx.level, char, ctx.asmodeusLair);
  const messages: string[] = [];
  const hellfire = () => {
    const dmg = Math.max(1, Math.round(char.maxHp * (0.03 + 0.30 * fury)));
    const dealt = Math.min(dmg, char.hp - 1);   // never fatal
    char.hp -= dealt;
    messages.push(
      fury < 0.3 ? `A thin whip of hellfire lashes out of the dark and scorches you for ${dealt} damage.`
      : fury < 0.7 ? `A lance of hellfire bursts from the wall and sears you for ${dealt} damage!`
      : `The air itself ignites. Asmodeus's fury engulfs you for ${dealt} damage!`,
    );
  };
  const curse = () => {
    const stat = rng.pick(['strength-reduced', 'dexterity-reduced', 'intelligence-reduced'] as const);
    const value = Math.round(2 + 8 * fury);
    const turns = Math.round(10 + 30 * fury);
    addStatusEffect(char, { type: stat, value, turns });
    const name = stat.split('-')[0];
    messages.push(`A curse settles on you like ash. Your ${name} withers (-${value} for ${turns} turns).`);
  };

  messages.push(fury < 0.3 ? 'Far below, something laughs.' : 'A deep, amused laugh fills the corridor.');
  if (fury >= PRESENCE.ASMODEUS_DEBILITATE_FURY) { hellfire(); curse(); }
  else if (rng.float() < 0.6) hellfire();
  else curse();
  return { messages, fx: 'fire' };
}

// ─── The other uniques ───────────────────────────────────────────────────────

export const FLAVOR: Partial<Record<MonsterType, Record<Range, string[]>>> = {
  'Orc King': {
    far:  ['Far off, war drums beat, slow and steady, like a giant\'s heart.',
           'A distant chant of many rough voices rises and falls: "GRUUMSH! GRUUMSH!"',
           'The faint clang of hammers on iron drifts through the stone. Something is being forged.',
           'A smell of smoke, sweat and old blood drifts down the passage.'],
    mid:  ['War drums pound somewhere ahead. Dust shivers down from the ceiling with every beat.',
           'Crude banners hang here, a single red eye daubed on each.',
           'You pass a heap of broken shields and notched swords. Trophies.',
           'A great roar of orcish laughter echoes along the corridor, then a single voice silences it.'],
    near: ['The drums are deafening now. A deep voice bellows orders over them.',
           'Torchlight flickers ahead, and the shadows of armored shapes move across the walls.',
           'Heads on spikes line the passage here, some of them wearing crowns.'],
  },
  Tiamat: {
    far:  ['A roar rolls through the rock from somewhere far off, shaking dust from the ceiling.',
           'Far away, something vast bellows, and the echo takes a long time to die.',
           'A distant thunder that is not thunder grumbles through the walls.',
           'The faintest smell of brimstone drifts by, then is gone.',
           'Somewhere far below or beyond, many voices shriek at once, then fall silent.'],
    mid:  ['A roar of many throats thunders through the stone. The floor hums with it.',
           'You smell brimstone, frost and rot all at once, carried on a hot wind.',
           'Frost rimes one wall while the other sweats with heat. Something breathes nearby.',
           'A snarl, a hiss, a crackle of lightning: five sounds from one direction.',
           'Scales the size of shields lie scattered across the floor, red, blue, green, white and black.'],
    near: ['Five voices bellow together, so close the floor trembles beneath you.',
           'Somewhere just ahead, five great heads argue in hisses and roars.',
           'The heat, the cold, the acid stink: it is close now. Very close.',
           'A shadow crosses the far wall: five long necks, swaying.'],
  },
  Tarrasque: {
    far:  ['A slow, heavy rhythm shudders up through the floor, like distant footsteps.',
           'The walls tremble. Somewhere far off, something enormous has shifted its weight.',
           'A deep grinding sound, like a millstone the size of a hill, comes and goes.',
           'The floor gives a single, heavy thud, as if something far away lay down.'],
    mid:  ['The ground lurches under a colossal footfall. Pebbles skitter across the floor.',
           'A grinding rumble, like mountains chewing, echoes down the corridor.',
           'Cracks run across the floor here, as though the stone was stepped on and split.',
           'A hot, rank breath of air rolls down the passage, stinking of old meat.'],
    near: ['The ceiling cracks under a titanic footstep!',
           'The whole corridor bucks like a ship in a storm!'],
  },
  Nightwalker: {
    far:  ['The air grows suddenly cold. Your breath mists.',
           'Your torchlight shrinks, as though something is drinking it.',
           'For a moment you cannot remember what warmth felt like.',
           'A long way off, the dark feels heavier than it should.'],
    mid:  ['Every torch in the corridor gutters at once, then slowly recovers.',
           'The darkness at the edge of your light seems deeper than it should be.',
           'Frost creeps along the floor toward your boots, then retreats.',
           'You hear nothing at all. Not even your own footsteps.'],
    near: ['A whisper at your ear, though no one is there: "It does not slow..."',
           'The shadows lean toward you. Something very large is standing very still.',
           'Your torch sputters and nearly dies. Something tall blots out the corridor ahead.',
           'Cold fingers of dark brush the back of your neck, then withdraw.'],
  },
  Dracolich: {
    far:  ['A grave-cold wind moves through the corridor, carrying a fine grey dust. Bone dust.',
           'Somewhere far off, a great rattling, like a cartload of bones overturned.',
           'The torchlight turns faintly green, then back again.',
           'A smell of old tombs lingers in the air.'],
    mid:  ['Pale green witch-lights drift past you and vanish into the stone.',
           'Claw marks as long as your arm score the walls here, blackened at the edges.',
           'A dry, rasping breath echoes along the passage, though nothing living breathes like that.',
           'A cold that has nothing to do with the air settles in your bones.'],
    near: ['Enormous bones rattle somewhere close, like a giant drumming its fingers.',
           'Green fire flickers in the dark ahead, set in an empty skull the size of a cart.',
           'The ground is carpeted in bones here, some of them very large, some very small.'],
  },
  Aboleth: {
    far:  ['Water drips somewhere nearby, though there is no water here.',
           'You catch a smell of deep, cold water and something rotting in it.',
           'For a moment you remember a sea you have never seen.',
           'A faint, wet slithering sound comes from very far away.'],
    mid:  ['A voice speaks inside your head, wet and patient: "I remember everything you have forgotten."',
           'The walls glisten with a thin, clear slime that smells of the deep sea.',
           'A memory surfaces unbidden: a face you loved. You cannot remember whose.',
           '"Rest," says a voice behind your eyes. "Rest, and let me in."'],
    near: ['The voice in your mind is very close now: "Come, and I will give you back your memories. All of them."',
           'Slime glistens on the walls, and something vast turns over in dark water just ahead.',
           'Three red lights, one above another, glow for a moment in the dark, then close.'],
  },
};

function lairFlavor(ctx: PresenceContext, rng: RNG): PresenceEvent | null {
  if (ctx.lairs.length === 0) return null;
  // The nearest presence is the one you notice.
  const lair = [...ctx.lairs].sort((a, b) => dist(ctx.char, a) - dist(ctx.char, b))[0];
  const pool = FLAVOR[lair.type];
  if (!pool) return null;
  // Tiamat heard through the floor from the level above is always faint.
  const range = lair.type === 'Tiamat' && ctx.level !== 7 ? 'far' : rangeOf(dist(ctx.char, lair));
  const messages = [rng.pick(pool[range])];

  if (lair.type === 'Tarrasque' && range === 'near') {
    const dmg = Math.max(1, Math.round(ctx.char.maxHp * (0.02 + 0.03 * rng.float())));
    const dealt = Math.min(dmg, ctx.char.hp - 1);
    ctx.char.hp -= dealt;
    messages.push(`Loose stones rain down on you for ${dealt} damage.`);
    return { messages, fx: 'physical' };
  }
  return { messages };
}

function dracolichFear(ctx: PresenceContext, rng: RNG): PresenceEvent {
  const { char } = ctx;
  const messages = ['A wave of cold, bottomless terror rolls out of the dark. The Dracolich knows you are here.'];
  const resist = Math.min(PRESENCE.FEAR_RESIST_MAX, PRESENCE.FEAR_RESIST_BASE + char.wisdom * PRESENCE.FEAR_RESIST_PER_WIS);
  if (rng.float() < resist) {
    messages.push('You grit your teeth and hold your ground.');
    return { messages, fx: 'psychic' };
  }
  const roll = rng.int(1, 3);
  if (roll === 1) {
    messages.push('You panic and run blindly, on and on, until the terror finally lets go...');
    return { messages, fx: 'psychic', flee: true };
  }
  if (roll === 2) {
    const turnTo = rng.pick((['N', 'E', 'S', 'W'] as Direction[]).filter(d => d !== char.facing));
    messages.push('You spin around in panic, sure something is right behind you.');
    return { messages, fx: 'psychic', turnTo };
  }
  addStatusEffect(char, { type: 'dexterity-reduced', value: PRESENCE.FEAR_DEX_LOSS, turns: PRESENCE.FEAR_DEX_TURNS });
  messages.push(`Your hands shake uncontrollably. (-${PRESENCE.FEAR_DEX_LOSS} Dexterity for ${PRESENCE.FEAR_DEX_TURNS} turns)`);
  return { messages, fx: 'psychic' };
}

/** At most one presence event per step, or null. */
export function rollPresence(ctx: PresenceContext, rng: RNG): PresenceEvent | null {
  const { char, level } = ctx;

  if (ctx.asmodeusAlive && level >= PRESENCE.ASMODEUS_ATTACK_MIN_LEVEL) {
    const chance = level === 7 ? PRESENCE.ASMODEUS_ATTACK_CHANCE_DEEPEST : PRESENCE.ASMODEUS_ATTACK_CHANCE;
    if (rng.float() < chance) return asmodeusStrike(ctx, rng);
  }

  const dracolich = ctx.lairs.find(l => l.type === 'Dracolich');
  if (dracolich) {
    const r = rangeOf(dist(char, dracolich));
    const mult = r === 'near' ? 3 : r === 'mid' ? 2 : 1;
    if (rng.float() < PRESENCE.DRACOLICH_FEAR_CHANCE * mult) return dracolichFear(ctx, rng);
  }

  if (ctx.asmodeusAlive && rng.float() < PRESENCE.ASMODEUS_VOICE_CHANCE) return asmodeusVoice(ctx, rng);

  if (rng.float() < PRESENCE.LAIR_FLAVOR_CHANCE) return lairFlavor(ctx, rng);
  return null;
}
