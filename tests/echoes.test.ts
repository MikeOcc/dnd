// Echoes of other players: where their characters fell (a bloodstain) and
// what is left of them (a shade). Only decent names are ever shown.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createMemoryDb } from '../src/database/database.js';
import { Repository } from '../src/database/repositories.js';
import { GameEngine } from '../src/core/game-engine.js';
import { nameIsDecent } from '../src/core/names.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any;
beforeEach(() => { db = createMemoryDb(); });
afterEach(() => { db.close(); });

function hero(name: string) {
  const e = new GameEngine(new Repository(db));
  e.startNameEntry(); e.submitName(name); e.acceptCharacter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const x = e as any;
  x.dismissLevelIntro();
  return x;
}

describe('echoes of the fallen', () => {
  it('a death on a level leaves a bloodstain on that level for others, telling who fell, and how', () => {
    const fallen = hero('Bob the Mighty');
    fallen.handleDeath('Killed by a Level 3 Kobold.');
    const other = hero('Newcomer');
    other.levelCache.delete(1); other.loadLevelIntoCache(1);
    const stains = [...other.getLevel(1).contents].filter(([, c]: [string, { type: string }]) => c.type === 'bloodstain');
    expect(stains).toHaveLength(1);
    const [k, c] = stains[0];
    expect(c.echo.name).toBe('Bob the Mighty');
    const msg = other.handleCellContent(c, k) ?? other.getState();
    expect(other.messages.join(' ')).toContain('Here fell Bob the Mighty');
    expect(other.messages.join(' ')).toContain('Killed by a Level 3 Kobold');
    void msg;
    // It shows in the 3D scene too.
    const [x, y] = k.split(',').map(Number);
    other.char.x = x; other.char.y = y;
    expect(other.getState().scene.objects.some((o: { kind: string }) => o.kind === 'bloodstain')).toBe(true);
  });

  it('your own deaths leave no echo for you, and an indecent name is never shown', () => {
    const me = hero('Careful');
    me.handleDeath('Killed by a fall.');
    me.levelCache.delete(1); me.loadLevelIntoCache(1);
    expect([...me.getLevel(1).contents.values()].some((c: { type: string }) => c.type === 'bloodstain')).toBe(false);
    const rude = hero('Fuckface');
    rude.handleDeath('Killed by a Goblin.');
    const other = hero('Reader');
    other.levelCache.delete(1); other.loadLevelIntoCache(1);
    const names = [...other.getLevel(1).contents.values()].filter((c: { type: string }) => c.type === 'bloodstain').map((c: { echo: { name: string } }) => c.echo.name);
    expect(names).toContain('Careful');
    expect(names).not.toContain('Fuckface');
    expect(nameIsDecent('Bob the Mighty Battle-Mage')).toBe(true);
    expect(nameIsDecent('Sh1t Head')).toBe(false);
  });

  it('a shade of the fallen can be met where they fell, wearing their name, and leaves what it carried', () => {
    const fallen = hero('Vala the Bold');
    fallen.char.level = 6;
    fallen.char.dungeonLevel = 2;
    fallen.handleDeath('Killed by the bite of a Level 14 Giant Spider.');
    const other = hero('Seeker');
    other.char.dungeonLevel = 2; other.loadLevelIntoCache(2);
    other.char.hp = other.char.maxHp = 1e9;
    const s = other.shadeEncounter();
    expect(s.phase).toBe('combat');
    expect(other.combat.monster.type).toBe('Shade');
    expect(s.messages.join(' ')).toContain('the shade of Vala the Bold, a level 6 wizard who died here');
    const gold = other.char.gold;
    other.combat.monster.hp = 1;
    for (let i = 0; i < 20 && other.combat; i++) other.combatAction('a');
    expect(other.messages.join(' ')).toContain('The shade of Vala the Bold sighs');
    expect(other.char.gold).toBeGreaterThan(gold);
  });
});
