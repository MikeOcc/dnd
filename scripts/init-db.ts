import { getDb, initDb } from '../src/database/database.js';

console.log('Initializing database...');
const db = getDb();
initDb(db);
console.log('Database initialized at: seven-levels.db');
db.close();
