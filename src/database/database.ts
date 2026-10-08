import type { DatabaseSync } from 'node:sqlite';
import { createRequire } from 'module';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Use createRequire so vite never tries to statically resolve 'node:sqlite'.
// The import is purely lazy/runtime and bypasses vite's module resolver.
const _req = createRequire(import.meta.url);
function DbClass(): new(p: string) => DatabaseSync {
  return _req('node:sqlite').DatabaseSync;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

let _db: DatabaseSync | null = null;
let _dbPath = './seven-levels.db';

export function setDbPath(path: string): void {
  _dbPath = path;
}

export function getDb(): DatabaseSync {
  if (!_db) {
    const Cls = DbClass();
    _db = new Cls(_dbPath);
    _db.exec('PRAGMA journal_mode = WAL');
    _db.exec('PRAGMA foreign_keys = ON');
  }
  return _db;
}

export function initDb(db?: DatabaseSync): void {
  const target = db ?? getDb();
  const schemaPath = join(__dirname, 'schema.sql');
  const schema = readFileSync(schemaPath, 'utf8');
  target.exec(schema);

  // Column migrations: ALTER TABLE IF NOT EXISTS is not supported in SQLite,
  // so we attempt the add and swallow "duplicate column" errors.
  try {
    target.exec(`ALTER TABLE dungeon_state ADD COLUMN hoards TEXT NOT NULL DEFAULT '[]'`);
  } catch { /* column already exists */ }
  try {
    target.exec(`ALTER TABLE characters ADD COLUMN inventory TEXT NOT NULL DEFAULT '{"potions":0}'`);
  } catch { /* column already exists */ }
  try {
    target.exec(`ALTER TABLE characters ADD COLUMN elemental_warnings TEXT NOT NULL DEFAULT '[]'`);
  } catch { /* column already exists */ }
  try {
    target.exec(`ALTER TABLE characters ADD COLUMN banish_cast_at INTEGER`);
  } catch { /* column already exists */ }
  try {
    target.exec(`ALTER TABLE characters ADD COLUMN stilled_hour_at INTEGER`);
  } catch { /* column already exists */ }
  // The dungeon view a character starts in ('classic' | 'ascii3d' | 'painted'),
  // set by the house for a character made ready for someone; NULL = the
  // browser's own choice. Saves never write it, so it stays as set.
  try {
    target.exec(`ALTER TABLE characters ADD COLUMN view_mode TEXT`);
  } catch { /* column already exists */ }
  // A new character's early-game record (JSON, see FirstSteps), written as it
  // happens rather than on save. NULL for characters made before it began.
  try {
    target.exec(`ALTER TABLE characters ADD COLUMN first_steps TEXT`);
  } catch { /* column already exists */ }
  try {
    target.exec(`ALTER TABLE characters ADD COLUMN char_class TEXT NOT NULL DEFAULT 'wizard'`);
  } catch { /* column already exists */ }
  try {
    target.exec(`ALTER TABLE dungeon_state ADD COLUMN revealed_levels TEXT NOT NULL DEFAULT '[]'`);
  } catch { /* column already exists */ }
  // Who a character belongs to, for guests playing over the internet:
  // NULL = a shared test character anyone may play; 'owner' = the house
  // owner's alone; anything else = the guest (browser) that made it.
  try {
    target.exec(`ALTER TABLE characters ADD COLUMN owner TEXT`);
  } catch { /* column already exists */ }
}

export function createMemoryDb(): DatabaseSync {
  const Cls = DbClass();
  const db = new Cls(':memory:');
  initDb(db);
  return db;
}

export function closeDb(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}
