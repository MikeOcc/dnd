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
