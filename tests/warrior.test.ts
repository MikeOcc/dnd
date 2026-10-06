import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RNG } from '../src/core/random.js';
import { rollCharacter, createCharacter, xpForLevel } from '../src/core/character.js';
import { createMonster } from '../src/core/monsters.js';
import { attacksPerRound, playerAttack, playerHeal, playerHeld, playerShieldBash, playerBattleCry } from '../src/core/combat.js';
import { spellMenu, knownSpells } from '../src/core/spells.js';
import { createMemoryDb } from '../src/database/database.js';
import { Repository } from '../src/database/repositories.js';
import { GameEngine } from '../src/core/game-engine.js';
import { WARRIOR } from '../src/core/config.js';

function makeChar(cls: 'wizard' | 'warrior', level: number) {
  const char = createCharacter('t', 'Hero', rollCharacter(new RNG(1)));
  char.charClass = cls;
  char.level = level;
  char.hp = char.maxHp = 100000;
  return char;
}

describe('Warrior combat', () => {
  it('gains a swing every 10 levels, up to 5; wizards always swing once', () => {
    expect(attacksPerRound(makeChar('wizard', 60))).toBe(1);
    expect(attacksPerRound(makeChar('warrior', 1))).toBe(1);
    expect(attacksPerRound(makeChar('warrior', 10))).toBe(2);
    expect(attacksPerRound(makeChar('warrior', 20))).toBe(3);
    expect(attacksPerRound(makeChar('warrior', 40))).toBe(5);
    expect(attacksPerRound(makeChar('warrior', 60))).toBe(WARRIOR.MAX_ATTACKS);
  });

  it('attacks several times a round', () => {
    const m = createMonster('Giant', 20, 'g');
    m.hp = m.maxHp = 100000;
    const text = playerAttack(makeChar('warrior', 20), m, new RNG(4)).messages.join('\n');
    expect(text).toContain('swing 1');
    expect(text).toContain('swing 3');
    expect(text).not.toContain('swing 4');
  });

  it('has combat skills instead of the wizard spell list', () => {
    expect(spellMenu(1, 'warrior')).toEqual([{ key: 'a', text: 'Power Attack' }, { key: 'b', text: 'Cancel' }]);
    const at35 = knownSpells(35, 'warrior').map(s => s.name);
    expect(at35).toEqual(['Power Attack', 'Shield Bash', 'Heal', 'Cleave', 'Fireball', 'Battle Cry', 'Whirlwind']);
    expect(at35).not.toContain('Lightning');
  });

  it("casts a weaker Heal than a wizard", () => {
    const heal = (cls: 'wizard' | 'warrior') => {
      const c = makeChar(cls, 30);
      c.hp = 1; c.maxHp = 100000;
      playerHeal(c, createMonster('Goblin', 1, 'g'), new RNG(9));
      return c.hp;
    };
    const ratio = (heal('warrior') - 1) / (heal('wizard') - 1);
    expect(ratio).toBeGreaterThan(WARRIOR.SPELL_POWER - 0.05);
    expect(ratio).toBeLessThan(WARRIOR.SPELL_POWER + 0.05);
  });

  it('takes less damage than a wizard with the same stats', () => {
    const lost = (cls: 'wizard' | 'warrior') => {
      const rng = new RNG(21);
      let total = 0;
      for (let i = 0; i < 300; i++) {
        const c = makeChar(cls, 10);
        c.heldRounds = 1; c.heldBy = 'dazed';
        playerHeld(c, createMonster('Orc', 10, 'o'), rng);
        total += 100000 - c.hp;
      }
      return total;
    };
    expect(lost('warrior')).toBeLessThan(lost('wizard'));
  });

  it("Shield Bash can stun, costing the monster its next turn", () => {
    const rng = new RNG(2);
    for (let i = 0; i < 200; i++) {
      const c = makeChar('warrior', 20);
      const m = createMonster('Orc', 5, 'o');
      m.hp = m.maxHp = 100000;
      const res = playerShieldBash(c, m, rng);
      if (res.messages.join(' ').includes('stunned!')) {
        expect(res.messages.join(' ')).toContain("still stunned and can't act");
        expect(m.stunnedTurns).toBe(0);
        return;
      }
    }
    throw new Error('never stunned');
  });

  it('Battle Cry boosts the next rounds and then wears off', () => {
    const c = makeChar('warrior', 30);
    const m = createMonster('Giant', 20, 'g');
    m.hp = m.maxHp = 100000;
    const rng = new RNG(8);
    playerBattleCry(c, m, rng);
    expect(c.battleCryRounds).toBe(WARRIOR.BATTLE_CRY_ROUNDS);
    for (let i = 0; i < WARRIOR.BATTLE_CRY_ROUNDS; i++) playerAttack(c, m, rng);
    expect(c.battleCryRounds).toBe(0);
  });
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
describe('Warrior in the engine', () => {
  let db: any;
  beforeEach(() => { db = createMemoryDb(); });
  afterEach(() => { db.close(); });

  function newCharacter(cls?: 'wizard' | 'warrior') {
    const engine = new GameEngine(new Repository(db));
    engine.startNameEntry();
    const roll = engine.submitName('Conan');
    return { engine, e: engine as any, roll };
  }

  it('offers the class choice when accepting a roll', () => {
    const { roll, engine, e } = newCharacter();
    const hp = e.char.maxHp;
    // Each choice shows the HP the character will really start with.
    expect(roll.choices!.map(c => c.text).slice(0, 2)).toEqual([`Accept as Wizard (${hp} HP)`, `Accept as Warrior (${hp + 8} HP)`]);
    engine.acceptCharacter('warrior');
    expect(e.char.maxHp).toBe(hp + 8);
  });

  it('a warrior starts tougher, and the class is saved', () => {
    const { engine, e } = newCharacter();
    const hpBefore = e.char.maxHp;
    engine.acceptCharacter('warrior');
    expect(e.char.charClass).toBe('warrior');
    expect(e.char.maxHp).toBe(hpBefore + WARRIOR.HP_BONUS_START);
    expect(new Repository(db).loadCharacter(e.char.id)!.charClass).toBe('warrior');
    expect(new Repository(db).listCharacters()[0].charClass).toBe('warrior');
  });

  it("shows Combat Skill in the combat menu", () => {
    const { engine, e } = newCharacter();
    engine.acceptCharacter('warrior');
    e.phase = 'combat';
    e.combat = { monster: createMonster('Goblin', 1, 'g'), round: 1, nakedActive: false, preCombatX: 0, preCombatY: 0 };
    expect(engine.getState().choices!.find(c => c.key === 'b')!.text).toBe('Combat Skill');
    expect(engine.getState().spellChoices![0].text).toBe('Power Attack');
  });

  it('can use gems only from level 35, with no Intelligence needed', () => {
    const { engine, e } = newCharacter();
    engine.acceptCharacter('warrior');
    e.phase = 'playing';
    e.char.intelligence = 3;
    e.char.inventory.gems.diamond = 2;
    e.char.level = 34;
    expect(engine.useDiamondExploring().messages.join(' ')).toContain(`Level ${WARRIOR.GEM_LEVEL}`);
    expect(e.char.inventory.gems.diamond).toBe(2);
    e.char.level = 35;
    engine.useDiamondExploring();
    expect(e.char.inventory.gems.diamond).toBe(1);
  });

  it('announces new skills, extra blows and gem magic on level-up', () => {
    const { engine, e } = newCharacter();
    engine.acceptCharacter('warrior');
    e.char.level = 34;
    e.char.xp = xpForLevel(35);
    const lines: string[] = e.levelUp();
    expect(lines).toContain('You have learned Whirlwind!');
    expect(lines).toContain('You have learned to wield the magic of gems!');

    e.char.level = 9;
    e.char.xp = xpForLevel(10);
    expect(e.levelUp()).toContain('You can now strike an extra blow each round!');
  });
});
