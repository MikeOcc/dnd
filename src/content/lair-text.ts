// The warning screen shown on stepping into a great lair (game-engine.ts,
// startLairWarning). Only Asmodeus has one for now; adding a monster here,
// with art for it in the web client (web/lair-art.js), gives it one too.

import type { MonsterType } from '../core/types.js';

export const LAIR_WARNINGS: Partial<Record<MonsterType, string[]>> = {
  Asmodeus: [
    'A wave of heat rolls over you, thick with brimstone.',
    '',
    'Through curtains of red smoke, a throne of black iron',
    'smoulders on a dais of skulls. Its arms end in claws.',
    '',
    'The throne is empty. You are certain it is not.',
    'A voice like grinding stone: "COME, LITTLE MORTAL. KNEEL."',
  ],
};
