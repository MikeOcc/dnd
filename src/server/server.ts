import express from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { DatabaseSync } from 'node:sqlite';
import { getDb, initDb, setDbPath } from '../database/database.js';
import { setupRoutes } from './routes.js';
import { isOwner } from './access.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const PORT = parseInt(process.env.PORT ?? '3000', 10);

const app = express();
// The game moved from its temporary ngrok address to playsevenlevels.com:
// old links (already shared on social media) send people to the new home.
// Any other spelling of the address (a trailing dot from a copied link, or
// www.) goes to the one true address too.
app.use((req, res, next) => {
  const host = (req.headers.host ?? '').toLowerCase().replace(/:\d+$/, '');
  const offsite = host.endsWith('.ngrok-free.dev') || host.endsWith('.')
    || (host.endsWith('playsevenlevels.com') && host !== 'playsevenlevels.com');
  if (offsite) return res.redirect(301, `https://playsevenlevels.com${req.originalUrl}`);
  next();
});
app.use(express.json());

// Development pages (e.g. the 3D view test scene) are for the owner only.
app.use('/dev', (req, res, next) => (isOwner(req) ? next() : res.status(404).send('Not found')));

// Serve static web files — no caching so changes are always picked up
const webDir = join(__dirname, '../../src/web');
app.use(express.static(webDir, {
  setHeaders: (res) => res.setHeader('Cache-Control', 'no-store'),
}));

// Initialize DB (hosted, the database lives outside the code: DB_PATH)
if (process.env.DB_PATH) setDbPath(process.env.DB_PATH);
const db = getDb();
initDb(db);

// API routes
setupRoutes(app, db);

// Only this Mac can connect directly; friends come in through the tunnel,
// which connects from here too.
app.listen(PORT, '127.0.0.1', () => {
  console.log(`THE SEVEN LEVELS server running at http://localhost:${PORT}`);
  console.log('Open the URL above in your browser to play.');
});
