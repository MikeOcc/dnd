-- THE SEVEN LEVELS — SQLite schema

CREATE TABLE IF NOT EXISTS characters (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  level           INTEGER NOT NULL DEFAULT 1,
  xp              INTEGER NOT NULL DEFAULT 0,
  dungeon_level   INTEGER NOT NULL DEFAULT 1,
  x               INTEGER NOT NULL DEFAULT 0,
  y               INTEGER NOT NULL DEFAULT 0,
  facing          TEXT NOT NULL DEFAULT 'N',
  hp              INTEGER NOT NULL,
  max_hp          INTEGER NOT NULL,
  gold            INTEGER NOT NULL DEFAULT 0,
  strength        INTEGER NOT NULL,
  constitution    INTEGER NOT NULL,
  intelligence    INTEGER NOT NULL,
  wisdom          INTEGER NOT NULL,
  dexterity       INTEGER NOT NULL,
  charisma        INTEGER NOT NULL,
  resistance      INTEGER NOT NULL,
  death_count     INTEGER NOT NULL DEFAULT 0,
  steps_taken     INTEGER NOT NULL DEFAULT 0,
  monsters_defeated       INTEGER NOT NULL DEFAULT 0,
  unique_monsters_defeated INTEGER NOT NULL DEFAULT 0,
  asmodeus_defeated       INTEGER NOT NULL DEFAULT 0,
  status_effects  TEXT NOT NULL DEFAULT '[]',
  intros_seen     TEXT NOT NULL DEFAULT '[]',
  reroll_used     INTEGER NOT NULL DEFAULT 0,
  created_at      INTEGER NOT NULL,
  play_time       INTEGER NOT NULL DEFAULT 0,
  last_saved      INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS dungeon_levels (
  character_id  TEXT NOT NULL,
  level_number  INTEGER NOT NULL,
  data          TEXT NOT NULL,
  PRIMARY KEY (character_id, level_number),
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS dungeon_state (
  character_id          TEXT PRIMARY KEY,
  visited_cells         TEXT NOT NULL DEFAULT '[]',
  opened_chests         TEXT NOT NULL DEFAULT '[]',
  read_books            TEXT NOT NULL DEFAULT '[]',
  used_fountains        TEXT NOT NULL DEFAULT '[]',
  used_altars           TEXT NOT NULL DEFAULT '[]',
  triggered_traps       TEXT NOT NULL DEFAULT '[]',
  disarmed_traps        TEXT NOT NULL DEFAULT '[]',
  defeated_fixed        TEXT NOT NULL DEFAULT '[]',
  defeated_unique       TEXT NOT NULL DEFAULT '[]',
  visited_descriptions  TEXT NOT NULL DEFAULT '[]',
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_dungeon_levels_char ON dungeon_levels(character_id);
