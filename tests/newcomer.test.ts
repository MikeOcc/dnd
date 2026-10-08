// A new character's first steps: gentler first fights, a starter kit, no
// level-1 ambush, a warrior's tip, and a chest near the level-1 entrance.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createMemoryDb } from '../src/database/database.js';
import { Repository } from '../src/database/repositories.js';
import { GameEngine } from '../src/core/game-engine.js';
import { createMonster, pickRandomMonsterType, getDefinition } from '../src/core/monsters.js';
import { generateLevel, deserializeLevel } from '../src/core/dungeon.js';
import { RNG } from '../src/core/random.js';
import { NEWCOMER } from '../src/core/config.js';
import type { CharacterClass } from '../src/core/types.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any;
beforeEach(() => { db = createMemoryDb(); });
afterEach(() => { db.close(); });

function newEngine(cls: CharacterClass = 'wizard') {
  const engine = new GameEngine(new Repository(db));
  engine.startNameEntry();
  engine.submitName('Newcomer');
  engine.acceptCharacter(cls);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return engine as any;
}

describe('a newcomer', () => {
  it('starts with potions and coin; a warrior with a blade', () => {
    const w = newEngine('wizard');
    expect(w.char.inventory.potions).toBe(NEWCOMER.STARTING_POTIONS);
    expect(w.char.gold).toBe(NEWCOMER.STARTING_GOLD);
    expect(w.char.inventory.weapons ?? []).toHaveLength(0);
    const f = newEngine('warrior');
    expect(f.char.inventory.weapons).toEqual([{ kind: 'sword', bonus: 0, name: 'Plain longsword' }]);
  });

  it('meets no Sanguinid on the first two levels', () => {
    const rng = new RNG(11);
    for (const depth of [1, 2]) for (let i = 0; i < 5000; i++) expect(pickRandomMonsterType(depth, rng)).not.toBe('Sanguinid');
    let seen = false;
    for (let i = 0; i < 5000 && !seen; i++) seen = pickRandomMonsterType(3, rng) === 'Sanguinid';
    expect(seen).toBe(true);
  });

  it('draws the first fights on level 1 from the gentler kinds, then any level-1 kind', () => {
    const e = newEngine();
    e.char.hp = e.char.maxHp = 1_000_000;
    const tiersSeen = (slain: number) => {
      const seen = new Set<number>();
      for (let i = 0; i < 300; i++) {
        e.char.monstersDefeated = slain;
        e.phase = 'playing'; e.combat = null;
        e.startRandomEncounter();
        seen.add(e.combat.monster.definition.naturalTier);
      }
      return Math.max(...seen);
    };
    NEWCOMER.FIRST_FIGHT_TIERS.forEach((tier, slain) => expect(tiersSeen(slain)).toBeLessThanOrEqual(tier));
    // After that, all of level 1 (whose toughest kinds are tier 3).
    expect(tiersSeen(NEWCOMER.FIRST_FIGHT_TIERS.length)).toBe(3);
  });

  it('is not held to the gentle kinds below level 1', () => {
    const e = newEngine();
    e.char.hp = e.char.maxHp = 1_000_000;
    e.char.dungeonLevel = 2;
    e.char.monstersDefeated = 0;
    const tiers = new Set<number>();
    for (let i = 0; i < 300; i++) { e.phase = 'playing'; e.combat = null; e.startRandomEncounter(); tiers.add(e.combat.monster.definition.naturalTier); }
    expect(Math.max(...tiers)).toBeGreaterThan(NEWCOMER.FIRST_FIGHT_TIERS[0]);
  });

  it('as a warrior, is pointed to Power Attack in the first fight only', () => {
    const e = newEngine('warrior');
    e.char.hp = e.char.maxHp = 1_000_000;
    const first = e.beginCombat(createMonster('Kobold', 1, 'k1'));
    expect(first.messages.join(' ')).toContain('Power Attack');
    e.phase = 'playing'; e.combat = null;
    const second = e.beginCombat(createMonster('Kobold', 1, 'k2'));
    expect(second.messages.join(' ')).not.toContain('TIP:');
    const w = newEngine('wizard');
    expect(w.beginCombat(createMonster('Kobold', 1, 'k3')).messages.join(' ')).not.toContain('TIP:');
  });

  it('finds a chest a short walk from the level-1 entrance', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const { grid, entrance, contents } = deserializeLevel(generateLevel(1, seed * 977));
      const dist = new Map<string, number>([[`${entrance.x},${entrance.y}`, 0]]);
      const queue = [entrance];
      const moves: ['N' | 'E' | 'S' | 'W', number, number][] = [['N', 0, -1], ['E', 1, 0], ['S', 0, 1], ['W', -1, 0]];
      while (queue.length) {
        const c = queue.shift()!;
        for (const [w, dx, dy] of moves) {
          const k = `${c.x + dx},${c.y + dy}`;
          if (grid[c.y][c.x].walls[w] || dist.has(k)) continue;
          dist.set(k, dist.get(`${c.x},${c.y}`)! + 1);
          queue.push({ x: c.x + dx, y: c.y + dy });
        }
      }
      const near = [...contents].some(([k, c]) => c.type === 'chest'
        && (dist.get(k) ?? 99) >= NEWCOMER.CHEST_NEAR_ENTRANCE_MIN && (dist.get(k) ?? 99) <= NEWCOMER.CHEST_NEAR_ENTRANCE_MAX);
      expect(near, `seed ${seed * 977}`).toBe(true);
    }
  });

  it('the gentle kinds really are gentle', () => {
    for (const t of ['Kobold', 'Goblin', 'Mold', 'Stirge Swarm'] as const) expect(getDefinition(t).naturalTier).toBe(1);
  });
});

describe('the safety net', () => {
  it('turns a killing blow from above half health into 1 HP, for a newcomer only', () => {
    const e = newEngine('wizard');
    e.char.hp = e.char.maxHp = 20;
    e.char.monstersDefeated = 0;
    // A monster far beyond them, so its first blow would kill outright.
    e.phase = 'playing'; e.combat = null;
    e.beginCombat(createMonster('Owlbear', 15, 'o1'));
    let spared = false;
    for (let i = 0; i < 40 && !spared; i++) {
      e.char.hp = e.char.maxHp;
      const before = e.char.firstSteps.spared;
      const state = e.combatAction('a');
      expect(state.phase).not.toBe('death');
      spared = e.char.firstSteps.spared > before;
      if (spared) expect(e.char.hp).toBe(1);
      if (!e.combat) { e.phase = 'playing'; e.beginCombat(createMonster('Owlbear', 15, 'o' + i)); }
    }
    expect(spared).toBe(true);
  });

  it('holds only in the first fights on level 1, from above half health', async () => {
    const { safetyNetHolds } = await import('../src/core/combat.js');
    const e = newEngine();
    const c = e.char;
    c.maxHp = 20; c.monstersDefeated = 0; c.dungeonLevel = 1;
    expect(safetyNetHolds(c, 15)).toBe(true);
    expect(safetyNetHolds(c, 10)).toBe(false);          // not from half or below
    c.monstersDefeated = NEWCOMER.SAFETY_NET_FIGHTS;
    expect(safetyNetHolds(c, 20)).toBe(false);          // the cushion has run out
    c.monstersDefeated = 0; c.dungeonLevel = 2;
    expect(safetyNetHolds(c, 20)).toBe(false);          // only on level 1
    c.dungeonLevel = 1; delete c.firstSteps;
    expect(safetyNetHolds(c, 20)).toBe(false);          // characters made before it began
  });
});

describe("a newcomer's first word from Asmodeus", () => {
  it('comes once on level 1, by the last step of its window', () => {
    const e = newEngine();
    e.char.stepsTaken = NEWCOMER.FIRST_VOICE_FROM_STEP - 1;
    expect(e.firstVoiceDue()).toBe(false);
    e.char.stepsTaken = NEWCOMER.FIRST_VOICE_BY_STEP;
    expect(e.firstVoiceDue()).toBe(true);
    e.messages = [];
    e.feelPresences();
    expect(e.messages.join(' ')).toContain('A voice rolls through the stone');
    expect(e.char.firstSteps.voiceHeard).toBe(true);
    expect(e.firstVoiceDue()).toBe(false);
  });
});

describe("a newcomer's early-game record", () => {
  it('is written as things happen, without saving', () => {
    const e = newEngine();
    const repo = e.repo as Repository;
    const id = e.char.id;
    e.char.hp = e.char.maxHp = 1_000_000;
    e.phase = 'playing'; e.combat = null;
    e.beginCombat(createMonster('Kobold', 1, 'k1'));
    for (let i = 0; i < 50 && e.combat; i++) e.combatAction('a');
    e.char.hp = 10;
    e.usePot();
    const rec = repo.loadCharacter(id)!.firstSteps!;
    expect(rec.fights).toBe(1);
    expect(rec.wins).toBe(1);
    expect(rec.firstWinAt).toBeDefined();
    expect(rec.potions).toBe(1);
  });

  it('counts a death before level 2', () => {
    const e = newEngine();
    e.handleDeath('Test.');
    const rec = (e.repo as Repository).loadCharacter(e.char.id)!.firstSteps!;
    expect(rec.deaths).toBe(1);
    expect(rec.deathsBeforeLevel2).toBe(1);
  });

  it('sums up for the admin', async () => {
    const { summarizeFirstSteps, STOPPED_AFTER_MS } = await import('../src/core/first-steps.js');
    const now = Date.now();
    const base = { fights: 2, wins: 1, deaths: 0, deathsBeforeLevel2: 0, potions: 1, runs: 0, escapes: 0, spared: 0, levelReached: 2, playSecs: 300, lastAt: now };
    const s = summarizeFirstSteps([
      { charClass: 'wizard', createdAt: now, fs: { ...base, firstWinAt: 60, level2At: 120 } },
      { charClass: 'warrior', createdAt: now, fs: { ...base, wins: 0, deaths: 1, deathsBeforeLevel2: 1, levelReached: 1, lastAt: now - STOPPED_AFTER_MS } },
    ], now);
    expect(s.characters).toBe(2);
    expect(s.wonAFight).toBe(0.5);
    expect(s.diedBeforeLevel2).toBe(0.5);
    expect(s.stoppedEarly).toBe(0.5);
    expect(s.medianMinutesToFirstWin).toBe(1);
    expect(s.medianMinutesToLevel2).toBe(2);
    expect(s.perCharacter.fights).toBe(2);
  });
});

describe("a warrior's Attack and Power Attack", () => {
  it('plain Attack hits harder for a young warrior, fading to normal by the fade level', async () => {
    const { earlyAttackMult } = await import('../src/core/combat.js');
    const { WARRIOR } = await import('../src/core/config.js');
    const f = newEngine('warrior');
    f.char.level = 1;
    expect(earlyAttackMult(f.char)).toBeCloseTo(1 + WARRIOR.EARLY_ATTACK_BONUS);
    f.char.level = WARRIOR.EARLY_ATTACK_FADE_LEVEL;
    expect(earlyAttackMult(f.char)).toBe(1);
    f.char.level = 40;
    expect(earlyAttackMult(f.char)).toBe(1);
    const w = newEngine('wizard');
    expect(earlyAttackMult(w.char)).toBe(1);
  });

  it('Power Attack needs rounds to recover, and says so', async () => {
    const { WARRIOR } = await import('../src/core/config.js');
    const e = newEngine('warrior');
    e.char.hp = e.char.maxHp = 1_000_000;
    e.phase = 'playing'; e.combat = null;
    e.beginCombat(createMonster('Owlbear', 15, 'ob'));
    e.combat.monster.hp = e.combat.monster.maxHp = 1_000_000;
    const first = e.spellAction('a');                       // Power Attack is the first skill
    expect(first.messages.join(' ')).toContain('Power Attack');
    const round = e.combat.round;
    const again = e.spellAction('a');
    expect(again.messages.join(' ')).toContain('still recovering');
    expect(e.combat.round).toBe(round);                      // refused: no turn lost
    expect(e.spellChoices()[0].text).toMatch(/Power Attack \(ready in \d rounds?\)/);
    for (let i = 0; i < WARRIOR.POWER_ATTACK_COOLDOWN; i++) e.combatAction('a');
    const ready = e.spellAction('a');
    expect(ready.messages.join(' ')).not.toContain('still recovering');
  });
});
