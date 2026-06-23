import express from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { DatabaseSync } from 'node:sqlite';
import { getDb, initDb } from '../database/database.js';
import { setupRoutes } from './routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const PORT = parseInt(process.env.PORT ?? '3000', 10);

const app = express();
app.use(express.json());

// Serve static web files
const webDir = join(__dirname, '../../src/web');
app.use(express.static(webDir));

// Initialize DB
const db = getDb();
initDb(db);

// API routes
setupRoutes(app, db);

app.listen(PORT, () => {
  console.log(`THE SEVEN LEVELS server running at http://localhost:${PORT}`);
  console.log('Open the URL above in your browser to play.');
});
