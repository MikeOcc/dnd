// The warning screen shown on stepping into a great lair (game-engine.ts,
// startLairWarning), and the lines for how each choice turns out. Adding a
// monster here, with art for it in the web client (web/lair-art.js), gives
// its lair the same screen.

import type { MonsterType } from '../core/types.js';

export interface LairText {
  warning: string[];
  backAway: string;     // turned back successfully
  afterBackAway: string;
  dragged: string;      // failed to turn back: pulled in, and struck first
  stepIn: string;       // stepped forward
  charge: string;       // charged in successfully
  chargeFail: string;
  sneak: string;        // sneaked in successfully
  sneakFail: string;
}

export const LAIRS: Partial<Record<MonsterType, LairText>> = {
  Asmodeus: {
    warning: [
      'A wave of heat rolls over you, thick with brimstone.',
      '',
      'Through curtains of red smoke, a throne of black iron',
      'smoulders on a dais of skulls. Its arms end in claws.',
      '',
      'The throne is empty. You are certain it is not.',
      'A voice like grinding stone: "COME, LITTLE MORTAL. KNEEL."',
    ],
    backAway: 'You tear your eyes away and back out of the smoke.',
    afterBackAway: 'Laughter follows you down the passage.',
    dragged: 'An unseen hand seizes you and drags you before the throne!',
    stepIn: 'You steel yourself and step into the smoke.',
    charge: 'You charge into the smoke!',
    chargeFail: 'You charge, but it is faster.',
    sneak: 'You slip through the smoke, unseen, and strike from the shadows!',
    sneakFail: 'You creep through the smoke... but it was watching all along.',
  },
  'Barrow-King': {
    warning: [
      'The passage slopes down between standing stones, and the air goes still and cold.',
      '',
      'Ahead, a low domed chamber of piled stone: a barrow. Grave-goods glint in the',
      'dark: cups, rings, a heap of old gold. On a stone bier lies a tall figure in',
      'rotted mail, a rusted crown on its brow, an ancient sword laid on its breast.',
      '',
      'Frost creeps across the floor toward your feet. Its fingers twitch.',
    ],
    backAway: 'You back away up the slope, never taking your eyes off the bier.',
    afterBackAway: 'Behind you, stone grinds on stone. The barrow settles. It can wait. It always has.',
    dragged: 'The cold seizes you like a hand and drags you down into the barrow!',
    stepIn: 'You duck under the lintel and step down into the barrow.',
    charge: 'You charge down into the barrow before it can rise!',
    chargeFail: 'You charge, but the bier is already empty. He is behind you.',
    sneak: 'You creep down among the grave-goods, and strike at the figure on the bier!',
    sneakFail: 'You creep down... and the cold stars of its eyes open, already looking at you.',
  },
  'Orc King': {
    warning: [
      'The war drums stop. The silence is worse.',
      '',
      'Beyond the doorway, a hall rises into darkness. Torches gutter in iron',
      'brackets, and banners daubed with a single red eye hang from the heights.',
      'At the far end, on a dais, stands a throne built of a hundred shields,',
      'each taken from a dead hero. A great axe leans against it.',
      '',
      'The throne is empty. Somewhere in the shadows, heavy armor creaks.',
    ],
    backAway: 'You ease back out of the doorway, step by careful step.',
    afterBackAway: 'Behind you, the drums begin again, slow and mocking.',
    dragged: 'Iron hands seize you from the shadows. Orc guards drag you before the throne!',
    stepIn: 'You steel yourself and walk into the hall of shields.',
    charge: 'You charge into the hall with a battle cry!',
    chargeFail: 'You charge, but the Orc King is ready for you.',
    sneak: 'You slip from shadow to shadow along the hall, and strike!',
    sneakFail: 'You creep along the hall... but a guard\'s horn sounds. He knew you were coming.',
  },
};
