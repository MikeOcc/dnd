// How the great bestiary fights: each monster's turn as a small table of
// weighted moves. combat.ts builds the Kit (damage rolls, holds, saving
// rolls and so on) and runs the table; the special rules that reach outside
// a monster's own turn (weapon resistance, spell immunity, rising again,
// ambushes, death throes) live in combat.ts and game-engine.ts, marked with
// the monster's name.

import type { Character, Monster, MonsterType, StatusEffect, HeldCondition } from './types.js';
import type { RNG } from './random.js';
import { bestWeapon } from './character.js';

type Stat = 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma' | 'resistance';

/** What a move can do. Built per turn by combat.ts (runBestiaryTurn). */
export interface Kit {
  char: Character;
  monster: Monster;
  rng: RNG;
  say: (...lines: string[]) => void;
  /** The monster's damage roll against this character, times mult. */
  hit: (mult: number) => number;
  /** Rolls hit(mult), takes it off the character's HP, and reports it with text(dmg). */
  strike: (mult: number, text: (dmg: number) => string) => number;
  /** Several strikes in a row, stopping if the character falls. */
  strikes: (n: number, mult: number, text: (dmg: number, i: number) => string) => number;
  hold: (rounds: number, why: HeldCondition) => void;
  status: (effect: StatusEffect) => void;
  /** The monster heals (capped at its max). Returns how much. */
  heal: (amount: number) => number;
  /** A d20 saving roll plus the stats' bonuses ((stat - 10) / 2 each), against dc. */
  save: (dc: number, stats: Stat[]) => { ok: boolean; text: string };
  /** The character dies outright; cause is a killedBy key in combat.ts. */
  kill: (cause: string, ...lines: string[]) => void;
  /** The character's own melee damage, as if they'd struck themselves (Doppelganger). */
  mirror: (mult: number) => number;
  alive: () => boolean;
  held: () => boolean;
}

export interface Move {
  id: string;
  weight: number;
  when?: (k: Kit) => boolean;
  run: (k: Kit) => void;
}

export interface Script {
  /** Runs first each turn; return true to end the turn there. */
  before?: (k: Kit) => boolean;
  moves: Move[];
}

const has = (c: Character, type: StatusEffect['type']) => c.statusEffects.some(e => e.type === type);

export const BESTIARY: Partial<Record<MonsterType, Script>> = {

  // ── Shallow levels ─────────────────────────────────────────────────────────

  'Mongolian Death Worm': {
    // Burrowed last turn: it bursts up beneath you (a nimble leap halves it).
    before: k => {
      if (!k.monster.burrowed) return false;
      k.monster.burrowed = false;
      k.say('The floor bursts open beneath you!');
      const dodge = k.save(14 + Math.floor(k.monster.level / 6), ['dexterity']);
      k.strike(dodge.ok ? 0.8 : 1.6, d => dodge.ok
        ? `You throw yourself aside as the worm erupts. It still catches you. (${d} damage) ${dodge.text}`
        : `The worm erupts under you and flings you down! You suffer ${d} damage. ${dodge.text}`);
      return true;
    },
    moves: [
      { id: 'worm-spit', weight: 35, run: k => {
        k.strike(1.0, d => `The worm spits a gout of yellow acid! You suffer ${d} damage.`);
        if (k.alive() && k.rng.float() < 0.5) {
          const rust = k.char.statusEffects.find(e => e.type === 'corroded');
          const value = Math.min(50, (rust?.value ?? 0) + 15);
          k.char.statusEffects = k.char.statusEffects.filter(e => e.type !== 'corroded');
          k.status({ type: 'corroded', value, turns: 40 });
          k.say(`Your weapon yellows and pits where the spittle struck. (-${value}% weapon damage until you can clean it)`);
        }
      } },
      { id: 'worm-lightning', weight: 35, run: k => {
        // Metal armour carries the shock.
        const body = k.char.inventory.armor?.find(a => a.kind === 'chain' || a.kind === 'plate');
        const metal = body ? (body.kind === 'plate' ? 1.5 : 1.25) : 1;
        k.say('The air crackles. A blue-white arc leaps from the worm across the room!');
        k.strike(1.1 * metal, d => `It strikes you. You suffer ${d} damage.${metal > 1 ? ' Your metal armour carries the shock straight through you!' : ''}`);
      } },
      { id: 'worm-burrow', weight: 20, when: k => !k.monster.burrowed, run: k => {
        k.monster.burrowed = true;
        k.say('The worm dives into the floor. The stone heaves and ripples under your feet...');
      } },
      { id: 'worm-lash', weight: 10, run: k => { k.strike(1.2, d => `The worm's spined tail lashes you! You suffer ${d} damage.`); } },
    ],
  },

  'Giant Leech': { moves: [
    // Fastened on, it drinks: you bleed, it swells. Strength tears it free.
    { id: 'leech-drain', weight: 100, when: k => k.char.heldBy === 'latched' && k.held(), run: k => {
      const dealt = k.strike(0.7, d => `The leech drinks deep. You suffer ${d} damage.`);
      const healed = k.heal(Math.round(dealt * 0.6));
      if (healed > 0) k.say(`It swells, ridged body darkening with your blood. (+${healed} HP)`);
      if (k.alive() && k.rng.float() < 0.25 && !has(k.char, 'strength-reduced')) {
        k.status({ type: 'strength-reduced', value: 2, turns: 6 });
        k.say('You are growing faint from the loss of blood. (-2 Strength for a while)');
      }
    } },
    { id: 'leech-latch', weight: 55, when: k => !k.held(), run: k => {
      k.strike(0.6, d => `The leech surges and its mouth clamps onto you! (${d} damage)`);
      if (k.alive()) { k.hold(2, 'latched'); k.status({ type: 'bleeding', value: 2, turns: 4 }); k.say('It has fastened on. You are bleeding!'); }
    } },
    { id: 'leech-slam', weight: 45, when: k => !k.held(), run: k => {
      k.strike(1.0, d => `The leech rears and slams its slick weight down on you. You suffer ${d} damage.`);
    } },
  ] },

  'Giant Shrew': { moves: [
    { id: 'shrew-bite', weight: 50, run: k => {
      k.strike(1.0, d => `The shrew darts in and bites! You suffer ${d} damage.`);
      if (k.alive() && k.rng.float() < 0.25 && !has(k.char, 'poison')) {
        k.status({ type: 'poison', value: 2, turns: 5 });
        k.say('Its spit burns in the wound. You are poisoned!');
      }
    } },
    { id: 'shrew-frenzy', weight: 32, run: k => {
      const n = k.rng.int(2, 3);
      k.say('The shrew is a blur of teeth!');
      k.strikes(n, 0.45, d => `  It bites. (${d} damage)`);
    } },
    { id: 'shrew-shriek', weight: 18, run: k => {
      k.say('The shrew shrieks, and answering shrieks come out of the dark.');
      k.strike(0.6, d => `Another shrew darts in from the shadows, bites, and is gone. (${d} damage)`);
    } },
  ] },

  'Giant Spider': { moves: [
    { id: 'spider-bite', weight: 65, run: k => {
      k.strike(1.0, d => `The spider sinks its fangs into you! You suffer ${d} damage.`);
      if (k.alive() && k.rng.float() < 0.35) { k.status({ type: 'poison', value: 3, turns: 6 }); k.say('Venom burns in the wound. You are poisoned!'); }
    } },
    { id: 'web', weight: 35, when: k => !k.held(), run: k => {
      k.strike(0.3, d => `The spider spins and flings a sheet of sticky web over you! (${d} damage)`);
      if (k.alive()) { k.hold(2, 'webbed'); k.say('You are caught fast in the web!'); }
    } },
  ] },

  'Stirge Swarm': { moves: [
    { id: 'stirge-drain', weight: 1, run: k => {
      const n = k.rng.int(3, 5);
      k.say(`The swarm descends on you! (${n} stirges)`);
      const dealt = k.strikes(n, 0.35, d => `  A stirge's proboscis stabs in and drinks. (${d} damage)`);
      const healed = k.heal(Math.round(dealt / 2));
      if (healed > 0) k.say(`The swarm grows fat on your blood. (+${healed} HP)`);
    } },
  ] },

  'Rust Monster': { moves: [
    { id: 'rusting-touch', weight: 55, run: k => {
      k.strike(0.5, d => `The Rust Monster's antennae brush your weapon. (${d} damage)`);
      const rust = k.char.statusEffects.find(e => e.type === 'corroded');
      const value = Math.min(60, (rust?.value ?? 0) + 20);
      k.char.statusEffects = k.char.statusEffects.filter(e => e.type !== 'corroded');
      k.status({ type: 'corroded', value, turns: 60 });
      k.say(`Rust blooms across the iron! Your weapon is corroded. (-${value}% weapon damage until you can clean it)`);
    } },
    { id: 'mandibles', weight: 45, run: k => { k.strike(0.9, d => `Its mandibles clamp on your arm! You suffer ${d} damage.`); } },
  ] },

  'Bugbear': { moves: [
    { id: 'morningstar', weight: 65, run: k => { k.strike(1.2, d => `The Bugbear's morningstar crashes down on you! You suffer ${d} damage.`); } },
    { id: 'bugbear-grab', weight: 35, run: k => {
      k.strike(0.7, d => `The Bugbear grabs you and slams you into the wall! (${d} damage)`);
      if (k.alive() && k.rng.float() < 0.4) { k.hold(1, 'dazed'); k.say('Stars burst behind your eyes. You are dazed!'); }
    } },
  ] },

  // ── Middle levels ──────────────────────────────────────────────────────────

  // Regenerates unless fire or acid has touched it lately; rises again once
  // after "dying" unless it was burned (game-engine.ts).
  'Troll': {
    before: k => {
      if ((k.monster.burnedTurns ?? 0) > 0) { k.monster.burnedTurns!--; return false; }
      const healed = k.heal(Math.round(k.monster.maxHp * 0.08));
      if (healed > 0) k.say(`The Troll's wounds close up as you watch, flesh bubbling. (+${healed} HP)`);
      return false;
    },
    moves: [
      { id: 'troll-claws', weight: 60, run: k => { k.say('The Troll lashes out with both long arms!'); k.strikes(2, 0.7, d => `  Its claws rip you for ${d} damage.`); } },
      { id: 'troll-bite', weight: 40, run: k => { k.strike(1.1, d => `The Troll bites, tearing flesh! You suffer ${d} damage.`); } },
    ],
  },

  'Minotaur': { moves: [
    { id: 'gore-charge', weight: 45, run: k => {
      k.strike(1.6, d => `The Minotaur lowers its horns and CHARGES, goring you! You suffer ${d} damage.`);
      if (k.alive() && k.rng.float() < 0.4) { k.hold(1, 'dazed'); k.say('You are knocked flat!'); }
    } },
    { id: 'great-axe', weight: 55, run: k => { k.strike(1.2, d => `The great axe sweeps down! You suffer ${d} damage.`); } },
  ] },

  // Weapons only half bite on it (no silver); its bite can pass on lycanthropy.
  'Werewolf': { moves: [
    { id: 'were-claws', weight: 55, run: k => { k.say('The Werewolf slashes with both claws!'); k.strikes(2, 0.6, d => `  Claws tear you for ${d} damage.`); } },
    { id: 'were-bite', weight: 45, run: k => {
      k.strike(1.0, d => `The Werewolf's jaws close on your shoulder! You suffer ${d} damage.`);
      if (k.alive() && !has(k.char, 'lycanthropy') && k.rng.float() < 0.15) {
        k.status({ type: 'lycanthropy', value: 1, turns: 9999 });
        k.say('The bite burns, and something in your blood answers it. You have caught LYCANTHROPY.',
          'Now and then the beast in you will take over. An altar, a unicorn, or a cleansing tome can lift the curse.');
      }
    } },
  ] },

  // Stone: weapons only half bite on it (combat.ts).
  'Gargoyle': { moves: [
    { id: 'stone-claws', weight: 60, run: k => { k.say('The Gargoyle rakes with stone talons!'); k.strikes(2, 0.6, d => `  Granite claws gouge you for ${d} damage.`); } },
    { id: 'dive', weight: 40, run: k => { k.strike(1.3, d => `The Gargoyle leaps up and slams down on you like a falling statue! You suffer ${d} damage.`); } },
  ] },

  'Harpy': { moves: [
    { id: 'harpy-song', weight: 40, when: k => !k.held(), run: k => {
      k.say('The Harpy sings, and the song pulls at you like a hook.');
      const s = k.save(14, ['wisdom', 'charisma']);
      k.say(`(Saving roll: ${s.text})`);
      if (s.ok) k.say('You shake your head clear.');
      else { k.hold(2, 'charmed'); k.say('Your weapon droops. You only want to listen.'); }
    } },
    { id: 'talons', weight: 60, run: k => { k.say('The Harpy swoops, talons first!'); k.strikes(2, 0.6, d => `  Filthy talons rake you for ${d} damage.`); } },
  ] },

  // Every head bites. Wound it hard and a head comes off: two grow back,
  // unless fire has seared it lately, which leaves one fewer.
  'Hydra': {
    before: k => {
      const m = k.monster;
      if (m.heads === undefined) { m.heads = k.rng.int(4, 6); m.lastHp = m.hp; }
      if ((m.lastHp ?? m.hp) - m.hp >= m.maxHp * 0.12) {
        if ((m.burnedTurns ?? 0) > 0) {
          m.heads = (m.heads ?? 1) - 1;
          k.say(`You hack off a head, and the fire sears the stump shut! (${m.heads} heads left)`);
        } else {
          m.heads = Math.min(9, (m.heads ?? 1) + 1);
          k.say(`You hack off a head... and TWO grow back in its place! (${m.heads} heads)`);
        }
      }
      if ((m.burnedTurns ?? 0) > 0) m.burnedTurns!--;
      if ((m.heads ?? 1) <= 0) {
        m.hp = 0;
        k.say('Its last head falls, and the Hydra collapses.');
        return true;
      }
      return false;
    },
    moves: [
      { id: 'hydra-heads', weight: 1, run: k => {
        const n = k.monster.heads ?? 5;
        k.say(`All ${n} heads strike at once!`);
        k.strikes(n, 0.4, d => `  A head bites for ${d} damage.`);
        k.monster.lastHp = k.monster.hp;
      } },
    ],
  },

  'Medusa': { moves: [
    { id: 'stone-gaze', weight: 20, when: k => !k.held(), run: k => {
      k.say('Medusa lifts her face to yours. Your eyes meet hers before you can stop them.');
      const s = k.save(15, ['constitution', 'wisdom']);
      k.say(`(Saving roll: ${s.text})`);
      if (!s.ok) { k.kill('stone-gaze', 'Cold creeps up from your feet. You cannot look away. You cannot move. You are stone.'); return; }
      k.strike(0.5, d => `You tear your eyes away, but your legs have turned to stone to the knee. (${d} damage)`);
      if (k.alive()) k.hold(1, 'petrifying');
    } },
    { id: 'snake-hair', weight: 45, run: k => {
      k.say('The snakes of her hair lunge at you!');
      k.strikes(3, 0.4, d => `  A snake bites for ${d} damage.`);
      if (k.alive() && k.rng.float() < 0.4) { k.status({ type: 'poison', value: 4, turns: 6 }); k.say('You are poisoned!'); }
    } },
    { id: 'medusa-arrow', weight: 35, run: k => { k.strike(1.1, d => `Medusa looses an arrow from the shadows! You suffer ${d} damage.`); } },
  ] },

  // Fights with your own attacks.
  'Doppelganger': { moves: [
    { id: 'mirror-strike', weight: 60, run: k => {
      const dmg = Math.max(1, k.mirror(1.0));
      k.char.hp = Math.max(0, k.char.hp - dmg);
      k.say(`Your double strikes with YOUR technique, every feint you know! You suffer ${dmg} damage.`);
    } },
    { id: 'mirror-spell', weight: 40, run: k => {
      const dmg = Math.max(1, k.mirror(1.3));
      k.char.hp = Math.max(0, k.char.hp - dmg);
      k.say(k.char.charClass === 'warrior'
        ? `Your double winds up your own Power Attack! You suffer ${dmg} damage.`
        : `Your double casts YOUR Fireball back at you! You suffer ${dmg} damage.`);
    } },
  ] },

  // ── Deep levels ────────────────────────────────────────────────────────────

  // Swallows you whole: acid every turn until you wound it enough from inside.
  'Purple Worm': {
    before: k => {
      const m = k.monster;
      if (m.swallowHp === undefined) return false;
      if (m.swallowHp - m.hp >= m.maxHp * 0.12) {
        m.swallowHp = undefined;
        k.say('You hack your way out through the Worm\'s side in a flood of slime, and tumble free!');
        return true;
      }
      k.strike(0.8, d => `Digestive acid burns you in the darkness of its gut! You suffer ${d} damage. (Cut your way out!)`);
      return true;
    },
    moves: [
      { id: 'worm-bite', weight: 40, run: k => { k.strike(1.4, d => `The Purple Worm's ringed maw grinds into you! You suffer ${d} damage.`); } },
      { id: 'swallow', weight: 30, run: k => {
        k.strike(0.6, d => `The Purple Worm lunges, and SWALLOWS YOU WHOLE! (${d} damage)`);
        if (k.alive()) { k.monster.swallowHp = k.monster.hp; k.say('Acid and darkness. Wound it from inside to cut your way out!'); }
      } },
      { id: 'tail-stinger', weight: 30, run: k => {
        k.strike(1.0, d => `Its tail stinger drives down into you! You suffer ${d} damage.`);
        if (k.alive() && k.rng.float() < 0.5) { k.status({ type: 'poison', value: 5, turns: 8 }); k.say('You are badly poisoned!'); }
      } },
    ],
  },

  // Most magic barely scratches it (its resistances); lightning slows it (combat.ts).
  'Iron Golem': { moves: [
    { id: 'iron-fists', weight: 65, run: k => { k.say('The Iron Golem swings both fists like anvils!'); k.strikes(2, 0.8, d => `  An iron fist hits for ${d} damage.`); } },
    { id: 'poison-gas', weight: 35, run: k => {
      k.strike(1.2, d => `Green gas hisses from the Golem's visor and engulfs you! You suffer ${d} damage.`);
      if (k.alive() && k.rng.float() < 0.6) { k.status({ type: 'poison', value: 5, turns: 8 }); k.say('You are badly poisoned!'); }
    } },
  ] },

  'Behir': {
    before: k => {
      if (k.char.heldBy === 'constricted' && (k.char.heldRounds ?? 0) > 0) {
        k.strike(1.0, d => `The Behir's coils squeeze, and lightning crackles through them! You suffer ${d} damage.`);
        return true;
      }
      return false;
    },
    moves: [
      { id: 'behir-lightning', weight: 35, run: k => { k.strike(1.6, d => `The Behir opens its jaws and a bolt of lightning blasts you! You suffer ${d} damage.`); } },
      { id: 'behir-bite', weight: 35, run: k => { k.strike(1.1, d => `The Behir's horned head strikes, jaws snapping! You suffer ${d} damage.`); } },
      { id: 'behir-coils', weight: 30, when: k => !k.held(), run: k => {
        k.strike(0.7, d => `The Behir wraps its long body around you! (${d} damage)`);
        if (k.alive()) k.hold(2, 'constricted');
      } },
    ],
  },

  // Spells can't touch it (game-engine.ts): fight it hand to hand.
  'Rakshasa': { moves: [
    { id: 'rakshasa-claws', weight: 50, run: k => { k.say('The Rakshasa strikes with its backward hands!'); k.strikes(2, 0.7, d => `  Its claws slash you for ${d} damage.`); } },
    { id: 'rakshasa-curse', weight: 25, run: k => {
      k.strike(0.6, d => `The Rakshasa purrs a curse, and black light sears you. (${d} damage)`);
      const stat = k.rng.pick(['intelligence-reduced', 'strength-reduced'] as const);
      k.status({ type: stat, value: 4, turns: 25 });
      k.say(`Your ${stat.split('-')[0]} withers. (-4)`);
    } },
    { id: 'rakshasa-illusion', weight: 25, when: k => !k.held(), run: k => {
      k.strike(0.6, d => `Suddenly there are six Rakshasas, and you strike at the wrong one! (${d} damage)`);
      if (k.alive()) k.hold(1, 'dazed');
    } },
  ] },

  'Death Tyrant': { moves: [
    { id: 'tyrant-rays', weight: 70, run: k => {
      const ray = k.rng.pick(['fear', 'paralyze', 'enervation', 'disintegrate', 'death'] as const);
      if (ray === 'death') {
        k.say('A withered eyestalk turns to you and fires a black ray: the DEATH RAY.');
        const s = k.save(16, ['constitution', 'wisdom']);
        k.say(`(Saving roll: ${s.text})`);
        if (!s.ok) { k.kill('tyrant-death-ray', 'Your heart simply stops.'); return; }
        k.strike(0.9, d => `You fight off the worst of it, but cold spreads through you. (${d} damage)`);
      } else if (ray === 'disintegrate') {
        k.strike(2.0, d => `A green ray lances out and part of you turns to dust! You suffer ${d} damage.`);
      } else if (ray === 'enervation') {
        k.strike(1.4, d => `A ray of dead light drains the life from you! You suffer ${d} damage.`);
        k.heal(Math.round(k.monster.maxHp * 0.04));
      } else if (ray === 'paralyze') {
        k.strike(0.5, d => `A pale ray strikes you! (${d} damage)`);
        if (k.alive() && !k.held()) { k.hold(2, 'paralyzed'); k.say('You cannot move!'); }
      } else {
        k.strike(0.5, d => `A grey ray fills you with dread! (${d} damage)`);
        if (k.alive() && !k.held()) { k.hold(1, 'feared'); k.say('You cower in terror!'); }
      }
    } },
    { id: 'tyrant-bite', weight: 30, run: k => { k.strike(1.1, d => `Its great rotting maw bites down on you! You suffer ${d} damage.`); } },
  ] },

  // The Barrow-King (level 5): grave-chill, the barrow-dark (your blows land
  // less often), and a barrow-wight called up from the stones to fight beside
  // him until he falls.
  'Barrow-King': {
    before: k => {
      if ((k.monster.darkTurns ?? 0) > 0) {
        k.monster.darkTurns!--;
        if (k.monster.darkTurns === 0) k.say('The barrow-dark thins. You can see his outline again.');
      }
      if (k.monster.wight) {
        k.strike(0.35, d => `The barrow-wight claws at you with frozen fingers. (${d} damage)`);
        if (k.alive() && k.rng.float() < 0.3) { k.status({ type: 'strength-reduced', value: 1, turns: 20 }); k.say('Its touch leaves a chill in your arm. (-1 Strength)'); }
      }
      return !k.alive();
    },
    moves: [
      { id: 'barrow-blade', weight: 35, run: k => {
        k.strike(1.3, d => `The ancient sword comes down, notched by a thousand years of nothing. You suffer ${d} damage.`);
      } },
      { id: 'grave-chill', weight: 30, run: k => {
        k.strike(0.9, d => `His grave-cold hand closes on you. The chill sinks to the bone. (${d} damage)`);
        if (k.alive()) {
          const s = k.save(15, ['constitution']);
          if (!s.ok) { k.status({ type: 'strength-reduced', value: 3, turns: 40 }); k.say(`Your strength drains into the stone. (-3 Strength) ${s.text}`); }
          else k.say(`You shake off the worst of the cold. ${s.text}`);
        }
      } },
      { id: 'barrow-dark', weight: 20, when: k => !(k.monster.darkTurns ?? 0), run: k => {
        k.monster.darkTurns = 3;
        k.say('He lifts a hand, and the barrow-dark pours from the stones. Your light gutters to a blue spark.',
          '(For a few turns your blows land less often.)');
      } },
      { id: 'call-the-wight', weight: 15, when: k => !k.monster.wight, run: k => {
        k.monster.wight = true;
        k.say('"RISE, MY SWORN." The flagstones crack, and a barrow-wight claws its way up beside him.',
          '(It will fight beside him until he falls.)');
      } },
    ],
  },

  // ── From folklore ────────────────────────────────────────────────────────
  'Grindylow': { moves: [
    { id: 'grindy-drag', weight: 35, when: k => !k.held(), run: k => {
      k.strike(0.7, d => `Long wet arms wrap round your legs and drag you toward the water! (${d} damage)`);
      if (k.alive()) { k.hold(1, 'constricted'); k.say('You are pulled under the surface and must fight your way back up!'); }
    } },
    { id: 'grindy-drown', weight: 100, when: k => k.held(), run: k => {
      k.strike(0.9, d => `Cold water fills your nose and mouth. You are drowning! (${d} damage)`);
    } },
    { id: 'grindy-bite', weight: 65, run: k => { k.strike(1.0, d => `The Grindylow bites with its needle teeth. (${d} damage)`); } },
  ] },

  'Black Annis': { moves: [
    { id: 'annis-claws', weight: 50, run: k => {
      k.strikes(2, 0.7, (d, i) => `Her iron claws ${i === 0 ? 'rake' : 'rake again'}! (${d} damage)`);
      if (k.alive() && k.rng.float() < 0.4) { k.status({ type: 'bleeding', value: 3, turns: 6 }); k.say('The iron has cut deep. You are bleeding!'); }
    } },
    { id: 'annis-flay', weight: 20, run: k => {
      k.strike(1.4, d => `She catches you and tries to peel your skin like a fruit! You suffer ${d} damage.`);
    } },
    { id: 'annis-vanish', weight: 15, run: k => {
      k.monster.caughtOffGuard = false;
      k.say('She steps back into the dark and is gone. Then a claw comes out of nowhere:');
      k.strike(1.2, d => `She strikes from the shadows! (${d} damage)`);
    } },
    { id: 'annis-bite', weight: 15, run: k => { k.strike(1.0, d => `Black Annis bites with teeth like a horse's. (${d} damage)`); } },
  ] },

  'Barghest': { moves: [
    { id: 'barghest-howl', weight: 25, when: k => !has(k.char, 'death-mark'), run: k => {
      k.say('The Barghest lifts its head and HOWLS. The sound goes into you and stays there.');
      const s = k.save(15, ['wisdom', 'charisma']);
      if (s.ok) { k.say(`You hold on to yourself, and the omen slides off you. ${s.text}`); return; }
      k.status({ type: 'death-mark', value: 1, turns: 400 });
      k.say(`You are MARKED for death. Until an altar lifts it, a blow that leaves you near death will kill you. ${s.text}`);
    } },
    { id: 'barghest-bite', weight: 55, run: k => { k.strike(1.1, d => `The black dog's jaws close on you! (${d} damage)`); } },
    { id: 'barghest-shadow', weight: 20, run: k => {
      k.say('It is not where it was. It is behind you.');
      k.strike(1.3, d => `The Barghest bears you down from behind! (${d} damage)`);
    } },
  ] },

  'Nuckelavee': { moves: [
    { id: 'nuck-breath', weight: 30, run: k => {
      k.strike(0.8, d => `It breathes on you. Every sickness there is. (${d} damage)`);
      if (k.alive()) {
        const s = k.save(15, ['constitution']);
        if (!s.ok) { k.status({ type: 'poison', value: 3, turns: 10 }); k.status({ type: 'fiend-venom', value: 1, turns: 40 }); k.say(`The plague takes hold: you are poisoned, and healing works at half strength. ${s.text}`); }
        else k.say(`You retch, but the sickness doesn't take. ${s.text}`);
      }
    } },
    { id: 'nuck-arms', weight: 45, run: k => {
      k.strikes(2, 0.75, (d, i) => i === 0 ? `The rider's long skinless arms lash you! (${d} damage)` : `And again! (${d} damage)`);
    } },
    { id: 'nuck-trample', weight: 25, run: k => { k.strike(1.4, d => `The horse rears and comes down on you! (${d} damage)`); } },
  ] },

  // The longer it fights, the bigger it gets: +12% to its blows each turn.
  'Draugr': {
    before: k => {
      k.monster.swell = (k.monster.swell ?? 0) + 1;
      if (k.monster.swell % 2 === 0) k.say(`The Draugr swells larger. Its grave-clothes split. (Its blows grow heavier: +${k.monster.swell * 12}%)`);
      return false;
    },
    moves: [
      { id: 'draugr-blow', weight: 60, run: k => { k.strike(1.0 + 0.12 * (k.monster.swell ?? 0), d => `The Draugr's fist comes down like a stone. (${d} damage)`); } },
      { id: 'draugr-grip', weight: 25, when: k => !k.held(), run: k => {
        k.strike(0.8 + 0.12 * (k.monster.swell ?? 0), d => `It grips you in arms like tree trunks and squeezes! (${d} damage)`);
        if (k.alive()) k.hold(1, 'constricted');
      } },
      { id: 'draugr-chill', weight: 15, run: k => {
        k.strike(0.7, d => `The cold of the grave comes off it. (${d} damage)`);
        k.status({ type: 'strength-reduced', value: 2, turns: 20 }); k.say('Your strength drains into the cold. (-2 Strength)');
      } },
    ],
  },

  // Its hidden body keeps it whole: 8% back each turn, unless seared.
  'Penanggalan': {
    before: k => {
      if ((k.monster.searedTurns ?? 0) > 0) { k.monster.searedTurns!--; return false; }
      const h = k.heal(Math.round(k.monster.maxHp * 0.08));
      if (h > 0) k.say(`Somewhere in the dark, its body waits, and the Penanggalan draws strength from it. (+${h} HP; fire or holy light would stop it)`);
      return false;
    },
    moves: [
      { id: 'pen-drink', weight: 45, run: k => {
        const d = k.strike(1.0, x => `The head flies at your throat and drinks! (${x} damage)`);
        const h = k.heal(Math.round(d / 2)); if (h > 0) k.say(`Its cheeks flush red. (+${h} HP)`);
      } },
      { id: 'pen-coil', weight: 30, when: k => !k.held(), run: k => {
        k.strike(0.7, d => `Its trailing gut whips round your neck! (${d} damage)`);
        if (k.alive()) k.hold(1, 'choked');
      } },
      { id: 'pen-shriek', weight: 25, run: k => {
        k.strike(0.8, d => `It shrieks with a sound no throat could make. (${d} damage)`);
        if (k.alive() && k.rng.float() < 0.3) { k.hold(1, 'feared'); k.say('Terror roots you to the spot!'); }
      } },
    ],
  },

  // Cut pieces crawl back and rejoin: it gets back 60% of what blows took
  // since its last turn, unless it was seared by fire or you fight with a
  // spiked mace.
  'Lambton Worm': {
    before: k => {
      const lost = Math.max(0, (k.monster.lastHp ?? k.monster.maxHp) - k.monster.hp);
      const mace = bestWeapon(k.char)?.kind === 'mace';
      if (lost > 0) {
        if ((k.monster.searedTurns ?? 0) > 0) k.say('The seared ends will not knit. The pieces twitch and lie still.');
        else if (mace) k.say('Your mace\u2019s spikes have torn the pieces past mending. They twitch and lie still.');
        else { const h = k.heal(Math.round(lost * 0.6)); if (h > 0) k.say(`The cut pieces crawl back across the floor and JOIN the worm again! (+${h} HP)`); }
      }
      if ((k.monster.searedTurns ?? 0) > 0) k.monster.searedTurns!--;
      k.monster.lastHp = k.monster.hp;
      return false;
    },
    moves: [
      { id: 'lambton-coil', weight: 35, when: k => !k.held(), run: k => {
        k.strike(1.1, d => `The worm throws a coil around you and crushes! (${d} damage)`);
        if (k.alive()) k.hold(1, 'constricted');
      } },
      { id: 'lambton-bite', weight: 45, run: k => { k.strike(1.3, d => `The sideways mouth closes on you. (${d} damage)`); } },
      { id: 'lambton-poison', weight: 20, run: k => {
        k.strike(0.8, d => `It breathes a foul, poisonous reek. (${d} damage)`);
        if (k.alive()) { k.status({ type: 'poison', value: 4, turns: 8 }); k.say('You are poisoned!'); }
      } },
    ],
  },

  // Weapons only half bite on it (combat.ts).
  'Caput Mortuum': { moves: [
    { id: 'soul-howl', weight: 20, run: k => {
      k.say('The skull opens its jaws and HOWLS. The gems in its eyes flare, hungry for a soul.');
      const s = k.save(16, ['wisdom', 'charisma']);
      k.say(`(Saving roll: ${s.text})`);
      if (!s.ok) { k.kill('soul-trapped', 'Your soul is torn out of your body and sucked into the gem. Your body drops, empty.'); return; }
      k.strike(1.0, d => `You cling to yourself as the howl tears at your soul! You suffer ${d} damage.`);
    } },
    { id: 'dead-head-curse', weight: 35, run: k => {
      k.strike(0.6, d => `The Caput Mortuum curses you in a dead tongue. (${d} damage)`);
      k.status({ type: 'strength-reduced', value: 4, turns: 30 });
      k.status({ type: 'dexterity-reduced', value: 4, turns: 30 });
      k.say('Your body grows weak and clumsy. (-4 Strength and Dexterity)');
    } },
    { id: 'life-leech', weight: 45, run: k => {
      const d = k.strike(1.3, x => `Green fire pulls the life out of you! You suffer ${x} damage.`);
      const h = k.heal(Math.round(d / 2));
      if (h > 0) k.say(`The skull's gems glow brighter. (+${h} HP)`);
    } },
  ] },

  'Chimera': { moves: [
    { id: 'chimera-heads', weight: 1, run: k => {
      k.say('All three heads attack!');
      k.strike(0.6, d => `  The lion's head bites for ${d} damage.`);
      if (!k.alive()) return;
      k.strike(0.5, d => `  The goat's head butts you for ${d} damage.`);
      if (k.alive() && !k.held() && k.rng.float() < 0.25) { k.hold(1, 'dazed'); k.say('  You are knocked senseless!'); }
      if (!k.alive()) return;
      k.strike(0.9, d => `  The dragon's head breathes fire for ${d} damage.`);
    } },
  ] },

  // ── The Hells (level 7) ────────────────────────────────────────────────────

  // Its dread makes your blows miss more often (combat.ts); its venom halves healing.
  'Pit Fiend': { moves: [
    { id: 'fiend-bite', weight: 25, run: k => {
      k.strike(1.0, d => `The Pit Fiend's fangs sink in! You suffer ${d} damage.`);
      if (k.alive() && !has(k.char, 'fiend-venom')) {
        k.status({ type: 'fiend-venom', value: 1, turns: 40 });
        k.say('Infernal venom spreads through you. Healing will only half take for a while.');
      }
    } },
    { id: 'fiend-claws', weight: 30, run: k => { k.say('The Pit Fiend rakes with both claws!'); k.strikes(2, 0.7, d => `  Claws tear you for ${d} damage.`); } },
    { id: 'hellfire', weight: 25, run: k => { k.strike(1.6, d => `The Pit Fiend calls down a column of hellfire! You suffer ${d} damage.`); } },
    { id: 'fiend-mace', weight: 20, run: k => { k.strike(1.2, d => `Its great mace smashes into you! You suffer ${d} damage.`); } },
  ] },

  // Its flames burn you whenever you hit it (combat.ts); it explodes when it dies (game-engine.ts).
  'Balor': { moves: [
    { id: 'balor-whip', weight: 35, run: k => {
      k.strike(0.9, d => `The Balor's whip of flame lashes around you and DRAGS you into its fire! You suffer ${d} damage.`);
      if (k.alive() && !k.held() && k.rng.float() < 0.5) { k.hold(1, 'dazed'); k.say('You are pulled off your feet!'); }
    } },
    { id: 'balor-sword', weight: 40, run: k => { k.strike(1.5, d => `The lightning sword cleaves down on you! You suffer ${d} damage.`); } },
    { id: 'balor-flames', weight: 25, run: k => { k.strike(1.2, d => `The Balor's body erupts in flame! You suffer ${d} damage.`); } },
  ] },

  // Many swords a turn; she parries your blows (combat.ts).
  'Marilith': { moves: [
    { id: 'six-swords', weight: 1, run: k => {
      const n = k.rng.int(4, 6);
      k.say(`The Marilith's arms become a whirl of steel! (${n} swords)`);
      k.strikes(n, 0.4, d => `  A blade cuts you for ${d} damage.`);
    } },
  ] },

  // You can't run from her (combat.ts).
  'Erinyes': { moves: [
    { id: 'fury-arrows', weight: 40, run: k => { k.say('The Erinyes looses two burning arrows!'); k.strikes(2, 0.7, d => `  An arrow strikes for ${d} damage.`); } },
    { id: 'fury-rope', weight: 25, when: k => !k.held(), run: k => {
      k.strike(0.3, d => `Her rope of entanglement lashes around you! (${d} damage)`);
      if (k.alive()) k.hold(2, 'webbed');
    } },
    { id: 'fury-sword', weight: 35, run: k => { k.strike(1.2, d => `Her black sword bites deep! You suffer ${d} damage.`); } },
  ] },
};
