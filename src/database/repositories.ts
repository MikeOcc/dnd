import { DatabaseSync } from 'node:sqlite';
import type { Character, SerializedDungeon, DungeonState, CharacterSummary } from '../core/types.js';

// ─── Repository class ────────────────────────────────────────────────────────

export class Repository {
  private db: DatabaseSync;

  constructor(db: DatabaseSync) {
    this.db = db;
  }

  // ─── Characters ─────────────────────────────────────────────────────────

  saveCharacter(char: Character): void {
    char.lastSaved = Date.now();
    this.db.prepare(`
      INSERT OR REPLACE INTO characters (
        id, name, level, xp, dungeon_level, x, y, facing,
        hp, max_hp, gold,
        strength, constitution, intelligence, wisdom, dexterity, charisma, resistance,
        death_count, steps_taken, monsters_defeated, unique_monsters_defeated,
        asmodeus_defeated, status_effects, intros_seen, reroll_used,
        created_at, play_time, last_saved
      ) VALUES (
        @id, @name, @level, @xp, @dungeon_level, @x, @y, @facing,
        @hp, @max_hp, @gold,
        @strength, @constitution, @intelligence, @wisdom, @dexterity, @charisma, @resistance,
        @death_count, @steps_taken, @monsters_defeated, @unique_monsters_defeated,
        @asmodeus_defeated, @status_effects, @intros_seen, @reroll_used,
        @created_at, @play_time, @last_saved
      )
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
      asmodeus_defeated: char.asmodeusDefeated ? 1 : 0,
      status_effects: JSON.stringify(char.statusEffects),
      intros_seen: JSON.stringify(char.introsSeen),
      reroll_used: char.rerollUsed ? 1 : 0,
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

  listCharacters(): CharacterSummary[] {
    const rows = this.db.prepare(
      'SELECT id, name, level, dungeon_level, monsters_defeated, asmodeus_defeated, xp FROM characters ORDER BY last_saved DESC'
    ).all() as Record<string, unknown>[];

    return rows.map(row => ({
      id:                 row['id'] as string,
      name:               row['name'] as string,
      level:              row['level'] as number,
      dungeonLevel:       row['dungeon_level'] as number,
      monstersDefeated:   row['monsters_defeated'] as number,
      asmodeusDefeated:   Boolean(row['asmodeus_defeated']),
      xp:                 row['xp'] as number,
    }));
  }

  deleteCharacter(id: string): void {
    this.db.prepare('DELETE FROM characters WHERE id = ?').run(id);
  }

  private rowToCharacter(row: Record<string, unknown>): Character {
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
      statusEffects:          JSON.parse(row['status_effects'] as string || '[]'),
      introsSeen:             JSON.parse(row['intros_seen'] as string || '[]'),
      rerollUsed:             Boolean(row['reroll_used']),
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
        defeated_fixed, defeated_unique, visited_descriptions
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    };
  }
}
