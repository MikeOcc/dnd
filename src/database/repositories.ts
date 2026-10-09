import type { RingId } from '../core/types.js';
import { PROTECTION_RINGS, POWER_RINGS } from '../content/rings.js';
import { DatabaseSync } from 'node:sqlite';
import type { Character, SerializedDungeon, DungeonState, CharacterSummary, FirstSteps, Death } from '../core/types.js';
import { CHARACTER, GEMS, RINGS } from '../core/config.js';

// ─── Repository class ────────────────────────────────────────────────────────

export class Repository {
  private db: DatabaseSync;

  constructor(db: DatabaseSync) {
    this.db = db;
  }

  // ─── Characters ─────────────────────────────────────────────────────────

  saveCharacter(char: Character): void {
    char.lastSaved = Date.now();
    // Use INSERT ... ON CONFLICT DO UPDATE (upsert) instead of INSERT OR REPLACE.
    // INSERT OR REPLACE deletes + reinserts on conflict, which triggers ON DELETE CASCADE
    // and wipes all dungeon_levels rows for this character.
    this.db.prepare(`
      INSERT INTO characters (
        id, name, level, xp, dungeon_level, x, y, facing,
        hp, max_hp, gold,
        strength, constitution, intelligence, wisdom, dexterity, charisma, resistance,
        death_count, steps_taken, monsters_defeated, unique_monsters_defeated,
        asmodeus_defeated, status_effects, intros_seen, reroll_used, inventory, elemental_warnings,
        banish_cast_at, stilled_hour_at, borak_at, char_class, created_at, play_time, last_saved
      ) VALUES (
        @id, @name, @level, @xp, @dungeon_level, @x, @y, @facing,
        @hp, @max_hp, @gold,
        @strength, @constitution, @intelligence, @wisdom, @dexterity, @charisma, @resistance,
        @death_count, @steps_taken, @monsters_defeated, @unique_monsters_defeated,
        @asmodeus_defeated, @status_effects, @intros_seen, @reroll_used, @inventory, @elemental_warnings,
        @banish_cast_at, @stilled_hour_at, @borak_at, @char_class, @created_at, @play_time, @last_saved
      )
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name, level = excluded.level, xp = excluded.xp,
        dungeon_level = excluded.dungeon_level, x = excluded.x, y = excluded.y,
        facing = excluded.facing, hp = excluded.hp, max_hp = excluded.max_hp,
        gold = excluded.gold, strength = excluded.strength, constitution = excluded.constitution,
        intelligence = excluded.intelligence, wisdom = excluded.wisdom,
        dexterity = excluded.dexterity, charisma = excluded.charisma,
        resistance = excluded.resistance, death_count = excluded.death_count,
        steps_taken = excluded.steps_taken, monsters_defeated = excluded.monsters_defeated,
        unique_monsters_defeated = excluded.unique_monsters_defeated,
        asmodeus_defeated = excluded.asmodeus_defeated, status_effects = excluded.status_effects,
        intros_seen = excluded.intros_seen, reroll_used = excluded.reroll_used,
        inventory = excluded.inventory, elemental_warnings = excluded.elemental_warnings,
        banish_cast_at = excluded.banish_cast_at, stilled_hour_at = excluded.stilled_hour_at, borak_at = excluded.borak_at, char_class = excluded.char_class,
        play_time = excluded.play_time, last_saved = excluded.last_saved
    `).run({
      id: char.id,
      name: char.name,
      level: char.level,
      xp: char.xp,
      dungeon_level: char.dungeonLevel,
      x: char.x,
      y: char.y,
      facing: char.facing,
      hp: char.hp,
      max_hp: char.maxHp,
      gold: char.gold,
      strength: char.strength,
      constitution: char.constitution,
      intelligence: char.intelligence,
      wisdom: char.wisdom,
      dexterity: char.dexterity,
      charisma: char.charisma,
      resistance: char.resistance,
      death_count: char.deathCount,
      steps_taken: char.stepsTaken,
      monsters_defeated: char.monstersDefeated,
      unique_monsters_defeated: char.uniqueMonstersDefeated,
      // How many times this character has beaten him (once was all there used to be).
      asmodeus_defeated: char.asmodeusVictories ?? (char.asmodeusDefeated ? 1 : 0),
      status_effects: JSON.stringify(char.statusEffects),
      intros_seen: JSON.stringify(char.introsSeen),
      reroll_used: CHARACTER.MAX_REROLLS - char.rerollsRemaining,
      inventory: JSON.stringify(char.inventory),
      elemental_warnings: JSON.stringify(char.elementalWarnings),
      banish_cast_at: char.banishCastAt ?? null,
      stilled_hour_at: char.stilledHourAt ?? null,
      borak_at: char.borakAt ?? null,
      char_class: char.charClass,
      created_at: char.createdAt,
      play_time: char.playTime,
      last_saved: char.lastSaved,
    });
  }

  loadCharacter(id: string): Character | null {
    const row = this.db.prepare('SELECT * FROM characters WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!row) return null;
    return this.rowToCharacter(row);
  }

  /** Who a character belongs to (see the owner column in initDb): null for a
   * shared test character, 'owner' for the house owner's, or a guest's id. */
  getOwner(id: string): string | null | undefined {
    const row = this.db.prepare('SELECT owner FROM characters WHERE id = ?').get(id) as { owner: string | null } | undefined;
    return row ? row.owner : undefined;
  }

  /** What's been learned about fighting a kind of monster, for a class (auto-fight). */
  fightLore(charClass: string, monsterType: string): Record<string, { uses: number; damage: number }> {
    const rows = this.db.prepare('SELECT action, uses, damage FROM fight_lore WHERE char_class = ? AND monster_type = ?').all(charClass, monsterType) as { action: string; uses: number; damage: number }[];
    return Object.fromEntries(rows.map(r => [r.action, { uses: r.uses, damage: r.damage }]));
  }

  /** One more use of an action against a kind of monster, and the harm it did. */
  learnFight(charClass: string, monsterType: string, action: string, damage: number): void {
    this.db.prepare(`INSERT INTO fight_lore (char_class, monster_type, action, uses, damage) VALUES (?, ?, ?, 1, ?)
      ON CONFLICT(char_class, monster_type, action) DO UPDATE SET uses = uses + 1, damage = damage + excluded.damage`).run(charClass, monsterType, action, Math.max(0, Math.round(damage)));
  }

  /** A death, kept for the echoes other players meet. */
  recordDeath(d: Omit<Death, 'id'>): void {
    this.db.prepare('INSERT INTO deaths (character_id, name, char_class, char_level, dungeon_level, cause, died_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(d.characterId, d.name, d.charClass, d.charLevel, d.dungeonLevel, d.cause, d.diedAt);
  }

  /** Other characters' deaths on a level since a time, newest first (one per character). */
  recentDeaths(dungeonLevel: number, excludeCharacterId: string, since: number, limit: number): Death[] {
    const rows = this.db.prepare(
      `SELECT * FROM deaths WHERE dungeon_level = ? AND character_id != ? AND died_at >= ?
       AND id IN (SELECT MAX(id) FROM deaths WHERE dungeon_level = ? GROUP BY character_id)
       ORDER BY died_at DESC LIMIT ?`,
    ).all(dungeonLevel, excludeCharacterId, since, dungeonLevel, limit) as Record<string, unknown>[];
    return rows.map(r => ({
      id: r['id'] as number, characterId: r['character_id'] as string, name: r['name'] as string, charClass: r['char_class'] as string,
      charLevel: r['char_level'] as number, dungeonLevel: r['dungeon_level'] as number, cause: r['cause'] as string, diedAt: r['died_at'] as number,
    }));
  }

  /** A character's early-game record, written on its own (saves never touch it). */
  recordFirstSteps(id: string, fs: FirstSteps): void {
    this.db.prepare('UPDATE characters SET first_steps = ? WHERE id = ?').run(JSON.stringify(fs), id);
  }

  /** Every early-game record, with the character's class and when it was made. */
  allFirstSteps(): { charClass: string; createdAt: number; fs: FirstSteps }[] {
    const rows = this.db.prepare('SELECT char_class, created_at, first_steps FROM characters WHERE first_steps IS NOT NULL').all() as Record<string, unknown>[];
    return rows.map(r => ({ charClass: r['char_class'] as string, createdAt: r['created_at'] as number, fs: JSON.parse(r['first_steps'] as string) }));
  }

  setOwner(id: string, owner: string | null): void {
    this.db.prepare('UPDATE characters SET owner = ? WHERE id = ?').run(owner, id);
  }

  countOwnedBy(owner: string): number {
    return (this.db.prepare('SELECT COUNT(*) AS n FROM characters WHERE owner = ?').get(owner) as { n: number }).n;
  }

  /** Every character, or (given `canSee`) just those a viewer may see. */
  listCharacters(canSee?: (owner: string | null) => boolean): CharacterSummary[] {
    const all = this.db.prepare(
      'SELECT id, name, level, dungeon_level, monsters_defeated, asmodeus_defeated, xp, char_class, owner FROM characters ORDER BY last_saved DESC'
    ).all() as Record<string, unknown>[];
    const rows = canSee ? all.filter(r => canSee((r['owner'] as string | null) ?? null)) : all;

    return rows.map(row => ({
      id:                 row['id'] as string,
      name:               row['name'] as string,
      level:              row['level'] as number,
      dungeonLevel:       row['dungeon_level'] as number,
      monstersDefeated:   row['monsters_defeated'] as number,
      asmodeusDefeated:   Boolean(row['asmodeus_defeated']),
      xp:                 row['xp'] as number,
      charClass:          (row['char_class'] as CharacterSummary['charClass']) || 'wizard',
      shared:             row['owner'] == null,
    }));
  }

  deleteCharacter(id: string): void {
    this.db.prepare('DELETE FROM characters WHERE id = ?').run(id);
  }

  private rowToCharacter(row: Record<string, unknown>): Character {
    const inventory = JSON.parse(row['inventory'] as string || '{"potions":0}') as Character['inventory'];
    // Older saves predate gems/books — backfill so existing characters don't crash.
    if (!inventory.gems) inventory.gems = { ruby: 0, sapphire: 0, diamond: 0, opal: 0, emerald: 0, moonstone: 0, pearl: 0 };
    if (inventory.gems.emerald === undefined) inventory.gems.emerald = 0;
    if (inventory.gems.moonstone === undefined) inventory.gems.moonstone = 0;
    if (inventory.gems.pearl === undefined) inventory.gems.pearl = 0;
    // Rings: protective ones are worn (all at once), one power ring readied.
    if (inventory.wornRings === undefined) {
      const owned: RingId[] = inventory.rings ?? [];
      inventory.wornRings = owned.filter(r => PROTECTION_RINGS.includes(r)).slice(0, RINGS.MAX_WORN);
      const powers: RingId[] = [...owned.filter(r => POWER_RINGS.includes(r)), ...((inventory.starRings ?? 0) > 0 ? ['escape' as RingId] : [])];
      inventory.readiedRing = inventory.activeRing && powers.includes(inventory.activeRing) ? inventory.activeRing : powers[0];
      delete inventory.activeRing;
    }
    if (!inventory.books) inventory.books = 0;
    // Saves from before weapons and armour carried magic daggers: they're weapons now.
    const legacy = (inventory as unknown as { daggers?: { bonus: number; name: string }[] }).daggers;
    if (legacy) {
      inventory.weapons = [...(inventory.weapons ?? []), ...legacy.map(d => ({ kind: 'dagger' as const, bonus: d.bonus, name: d.name }))];
      delete (inventory as unknown as { daggers?: unknown }).daggers;
    }
    // Opals and emeralds are capped (GEMS.CARRY_CAP): older saves may hold more.
    for (const [t, cap] of Object.entries(GEMS.CARRY_CAP) as [keyof typeof inventory.gems, number][]) {
      inventory.gems[t] = Math.min(inventory.gems[t] ?? 0, cap);
    }

    return {
      id:                     row['id'] as string,
      name:                   row['name'] as string,
      level:                  row['level'] as number,
      xp:                     row['xp'] as number,
      dungeonLevel:           row['dungeon_level'] as number,
      x:                      row['x'] as number,
      y:                      row['y'] as number,
      facing:                 row['facing'] as 'N' | 'E' | 'S' | 'W',
      hp:                     row['hp'] as number,
      maxHp:                  row['max_hp'] as number,
      gold:                   row['gold'] as number,
      strength:               row['strength'] as number,
      constitution:           row['constitution'] as number,
      intelligence:           row['intelligence'] as number,
      wisdom:                 row['wisdom'] as number,
      dexterity:              row['dexterity'] as number,
      charisma:               row['charisma'] as number,
      resistance:             row['resistance'] as number,
      deathCount:             row['death_count'] as number,
      stepsTaken:             row['steps_taken'] as number,
      monstersDefeated:       row['monsters_defeated'] as number,
      uniqueMonstersDefeated: row['unique_monsters_defeated'] as number,
      asmodeusDefeated:       Boolean(row['asmodeus_defeated']),
      asmodeusVictories:      Number(row['asmodeus_defeated'] ?? 0),
      statusEffects:          JSON.parse(row['status_effects'] as string || '[]'),
      introsSeen:             JSON.parse(row['intros_seen'] as string || '[]'),
      rerollsRemaining:       Math.max(0, CHARACTER.MAX_REROLLS - (row['reroll_used'] as number ?? 0)),
      inventory,
      elementalWarnings:      JSON.parse(row['elemental_warnings'] as string || '[]'),
      banishCastAt:           (row['banish_cast_at'] as number | null) ?? undefined,
      stilledHourAt:          (row['stilled_hour_at'] as number | null) ?? undefined,
      borakAt:                (row['borak_at'] as number | null) ?? undefined,
      viewMode:               (row['view_mode'] as Character['viewMode'] | null) ?? undefined,
      firstSteps:             row['first_steps'] ? JSON.parse(row['first_steps'] as string) : undefined,
      charClass:              (row['char_class'] as Character['charClass']) || 'wizard',
      createdAt:              row['created_at'] as number,
      playTime:               row['play_time'] as number,
      lastSaved:              row['last_saved'] as number,
    };
  }

  // ─── Dungeon levels ──────────────────────────────────────────────────────

  saveLevel(characterId: string, levelNumber: number, data: SerializedDungeon): void {
    this.db.prepare(`
      INSERT OR REPLACE INTO dungeon_levels (character_id, level_number, data)
      VALUES (?, ?, ?)
    `).run(characterId, levelNumber, JSON.stringify(data));
  }

  loadLevel(characterId: string, levelNumber: number): SerializedDungeon | null {
    const row = this.db.prepare(
      'SELECT data FROM dungeon_levels WHERE character_id = ? AND level_number = ?'
    ).get(characterId, levelNumber) as { data: string } | undefined;

    if (!row) return null;
    return JSON.parse(row['data']) as SerializedDungeon;
  }

  // ─── Dungeon state ───────────────────────────────────────────────────────

  saveDungeonState(characterId: string, state: DungeonState): void {
    this.db.prepare(`
      INSERT OR REPLACE INTO dungeon_state (
        character_id, visited_cells, opened_chests, read_books,
        used_fountains, used_altars, triggered_traps, disarmed_traps,
        defeated_fixed, defeated_unique, visited_descriptions, revealed_levels, hoards
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      characterId,
      JSON.stringify([...state.visitedCells]),
      JSON.stringify([...state.openedChests]),
      JSON.stringify([...state.readBooks]),
      JSON.stringify([...state.usedFountains]),
      JSON.stringify([...state.usedAltars]),
      JSON.stringify([...state.triggeredTraps]),
      JSON.stringify([...state.disarmedTraps]),
      JSON.stringify([...state.defeatedFixedMonsters]),
      JSON.stringify([...state.defeatedUniqueMonsters]),
      JSON.stringify([...state.visitedDescriptions]),
      JSON.stringify([...(state.revealedLevels ?? [])]),
      JSON.stringify(state.hoards ?? []),
    );
  }

  loadDungeonState(characterId: string): DungeonState | null {
    const row = this.db.prepare(
      'SELECT * FROM dungeon_state WHERE character_id = ?'
    ).get(characterId) as Record<string, string> | undefined;

    if (!row) return null;

    return {
      visitedCells:           new Set(JSON.parse(row['visited_cells']       || '[]')),
      openedChests:           new Set(JSON.parse(row['opened_chests']       || '[]')),
      readBooks:              new Set(JSON.parse(row['read_books']          || '[]')),
      usedFountains:          new Set(JSON.parse(row['used_fountains']      || '[]')),
      usedAltars:             new Set(JSON.parse(row['used_altars']         || '[]')),
      triggeredTraps:         new Set(JSON.parse(row['triggered_traps']     || '[]')),
      disarmedTraps:          new Set(JSON.parse(row['disarmed_traps']      || '[]')),
      defeatedFixedMonsters:  new Set(JSON.parse(row['defeated_fixed']      || '[]')),
      defeatedUniqueMonsters: new Set(JSON.parse(row['defeated_unique']     || '[]')),
      visitedDescriptions:    new Set(JSON.parse(row['visited_descriptions'] || '[]')),
      revealedLevels:         new Set(JSON.parse(row['revealed_levels'] || '[]')),
      hoards:                 JSON.parse(row['hoards'] || '[]'),
    };
  }
}
