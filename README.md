# THE SEVEN LEVELS

An old-school mainframe-style dungeon crawler.

Seven levels descend into darkness. At the center of the lowest level waits Asmodeus.

---

## Requirements

- **Node.js 20** or later (uses ESM / `--experimental-vm-modules`)
- macOS or Linux (terminal mode uses raw TTY)

---

## Installation

```bash
cd seven-levels
npm install
```

---

## Database Initialization

```bash
npm run db:init
```

This creates `seven-levels.db` in the project root.

To **reset** the database (delete all characters):

```bash
rm seven-levels.db
npm run db:init
```

---

## Starting the Terminal Game

```bash
npm run cli
```

Use a terminal at least 80 columns wide with a monospace font.

### Terminal Controls

| Key | Action |
|-----|--------|
| Up Arrow | Move forward |
| Down Arrow | Move backward |
| Left Arrow | Turn left |
| Right Arrow | Turn right |
| U | Climb up (when at a ladder) |
| D | Climb down (when at a ladder) |
| A/B/C/D | Select encounter option |
| Q | Quit |
| Ctrl+C | Exit immediately |

---

## Starting the Browser Game

```bash
npm run web
```

Then open: **http://localhost:3000**

The browser interface works with keyboard controls (same as terminal) and also provides on-screen buttons.

To use a different port:

```bash
PORT=8080 npm run web
```

---

## Running Tests

```bash
npm test
```

Tests cover:

- Dice rolling and RNG determinism
- Character creation and reroll limits
- Dungeon generation and wall symmetry
- Movement and wall collision
- 5×5 rotating FOV and wall occlusion
- Combat formulas (attack, fireball, heal, prayer, run)
- Fireball resistance/vulnerability (Red Dragon / White Dragon)
- Prayer effectiveness against undead
- Random encounter grace period
- Fountain healing probability (statistical test)
- Death mechanics (gold loss, respawn, XP retention)
- Unique monsters remaining dead
- Database save and reload
- Scoring formulas

---

## Where the SQLite File is Stored

`./seven-levels.db` (project root, created by `npm run db:init`).

---

## Adjusting Dungeon Size

Edit `src/core/config.ts`:

```typescript
export const DUNGEON = {
  WIDTH: 80,         // ← dungeon width in cells
  HEIGHT: 60,        // ← dungeon height in cells
  MIN_REACHABLE: 900,
  MAX_REACHABLE: 1400,
  BSP_MIN_ROOM: 5,
  BSP_MAX_DEPTH: 5,
  EXTRA_LOOPS: 8,
  ...
};
```

---

## Adjusting Encounter Frequency

Edit `src/core/config.ts`:

```typescript
export const ENCOUNTER = {
  GRACE_MOVES_MIN: 8,     // minimum quiet moves after combat
  GRACE_MOVES_MAX: 10,    // maximum quiet moves after combat
  BASE_CHANCE: 0.03,      // 3% base encounter chance after grace
  CHANCE_INCREMENT: 0.015, // rises 1.5% per additional step
  MAX_CHANCE: 0.35,       // caps at 35% per step
  ...
};
```

---

## Adjusting Monster Balance

Edit the per-monster stats in `src/core/monsters.ts` (the `DEFINITIONS` object), for example:

```typescript
'Red Dragon': {
  fireballResistance: 0.25,  // 25% damage from fireball (resistant)
  baseHpPerLevel: 16,
  baseAttackPerLevel: 8.0,
  ...
},
```

Combat formula tuning constants are in `src/core/config.ts` under `COMBAT`.

Monster level scaling is controlled by:

```typescript
export const MONSTER_SCALING = {
  DEPTH_BONUS: 1,   // +1 monster level per dungeon depth
  SPREAD: 3,        // ±3 random variation
};
```

---

## Editing Intro and Atmospheric Text

**Level introduction text** is in `src/content/level-text.ts`.

**Title screen text** is in `src/content/intro-text.ts`.

**Atmospheric descriptions** (the 60+ location descriptions) are in `src/content/descriptions.ts`.
Each entry has a `full` array (shown on first visit) and a `short` string (shown on repeat visits).

Which descriptions appear on which level is controlled by `descriptionIds` in `src/core/dungeon-data.ts`.

---

## Architecture

```
seven-levels/
  src/
    core/           ← shared game engine (no rendering dependencies)
      game-engine.ts   main GameEngine class
      combat.ts        attack, fireball, heal, pray, run
      character.ts     creation, leveling, stat effects
      monsters.ts      definitions and scaling
      dungeon.ts       BSP map generation
      field-of-view.ts 5×5 rotating FOV
      encounters.ts    pacing, death, chest/book/altar/fountain/trap
      scoring.ts       final score calculation
      types.ts         all shared TypeScript types
      config.ts        all tuning constants
      random.ts        seeded RNG (Xorshift32)
    content/        ← editable text content
    database/       ← SQLite layer
    cli/            ← terminal interface
    server/         ← Express server
    web/            ← browser client (vanilla JS)
  tests/            ← Vitest test suite
  scripts/          ← db:init and utilities
```

The `GameEngine` class is shared by both the CLI and the web server. Neither the CLI nor the server contains game logic — they only call `GameEngine` methods and render the returned `GameState`.

---

## Gameplay

- Roll 3d6 for seven attributes. One reroll is allowed.
- Starting HP: 10 + Constitution + 1d8
- No character classes. No equipment. No shops.
- Navigate with arrow keys. The 5×5 view rotates to match your facing.
- Face the direction you want to move, then press Up.
- Ladders appear as `<` (up) or `>` (down) in the view. Press U or D to use them.
- Chests, books, altars, fountains, and traps trigger automatically when you step on them.
- Combat offers: Attack / Spell (Fireball or Heal) / Pray / Run
- Prayer is especially effective against undead.
- Death returns you to the level entrance. You lose 15% of your gold.
- Defeat Asmodeus at the center of Level 7 to win.
