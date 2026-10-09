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
  revealed_levels       TEXT NOT NULL DEFAULT '[]',
  hoards                TEXT NOT NULL DEFAULT '[]',
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_dungeon_levels_char ON dungeon_levels(character_id);

-- Player accounts (username + password). Passwords and recovery codes are
-- stored only as salted scrypt hashes; sessions only as SHA-256 hashes of
-- their tokens. A character belongs to an account when characters.owner is
-- 'u:<user id>'.
CREATE TABLE IF NOT EXISTS users (
  id              TEXT PRIMARY KEY,
  username        TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash   TEXT NOT NULL,
  recovery_hash   TEXT NOT NULL,
  role            TEXT NOT NULL DEFAULT 'player',   -- 'player' | 'admin'
  must_change     INTEGER NOT NULL DEFAULT 0,       -- signed in with a temporary password: choose a new one
  disabled        INTEGER NOT NULL DEFAULT 0,
  created_at      INTEGER NOT NULL,
  last_login      INTEGER
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  token_hash  TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  created_at  INTEGER NOT NULL,
  expires_at  INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Every death, kept for the echoes other players meet: a bloodstain where
-- someone fell, a shade of them on the same level. (Only the name, class,
-- level, depth and cause; nothing else about the player.)
CREATE TABLE IF NOT EXISTS deaths (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  character_id  TEXT NOT NULL,
  name          TEXT NOT NULL,
  char_class    TEXT NOT NULL,
  char_level    INTEGER NOT NULL,
  dungeon_level INTEGER NOT NULL,
  cause         TEXT NOT NULL,
  died_at       INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_deaths_level ON deaths(dungeon_level, died_at);

-- What the game has learned about fighting each kind of monster, shared by
-- every player: for each class and monster, how much harm each action did.
-- Auto-fight picks by it (core/autofight.ts).
CREATE TABLE IF NOT EXISTS fight_lore (
  char_class    TEXT NOT NULL,
  monster_type  TEXT NOT NULL,
  action        TEXT NOT NULL,
  uses          INTEGER NOT NULL DEFAULT 0,
  damage        INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (char_class, monster_type, action)
);
