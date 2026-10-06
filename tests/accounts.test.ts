// Player accounts, driven through the real routes: guests (tunnelled, by
// cookie), signed-in players (session cookie), and the owner (this machine).
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import express from 'express';
import type { Server } from 'node:http';
import { createMemoryDb } from '../src/database/database.js';
import { Repository } from '../src/database/repositories.js';
import { setupRoutes } from '../src/server/routes.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any, server: Server, base = '', repo: Repository;
let addr = 0;

beforeEach(async () => {
  db = createMemoryDb(); repo = new Repository(db);
  const app = express(); app.use(express.json()); setupRoutes(app, db);
  await new Promise<void>(r => { server = app.listen(0, '127.0.0.1', () => r()); });
  const a = server.address(); base = `http://127.0.0.1:${typeof a === 'object' && a ? a.port : 0}`;
});
afterEach(() => { server.close(); db.close(); });

/** A browser: a guest from its own address (tunnelled), or the owner on this machine. Keeps its cookies. */
function browser(owner = false) {
  const jar = new Map<string, string>();
  const ip = `203.0.113.${++addr}`;
  const headers = (extra: Record<string, string> = {}) => ({
    'Content-Type': 'application/json',
    ...(owner ? {} : { 'X-Forwarded-For': ip }),
    ...(jar.size ? { Cookie: [...jar].map(([k, v]) => `${k}=${v}`).join('; ') } : {}),
    ...extra,
  });
  const keep = (r: Response) => {
    for (const c of r.headers.getSetCookie()) { const [kv] = c.split(';'); const [k, ...v] = kv.split('='); const val = v.join('='); if (val) jar.set(k, val); else jar.delete(k); }
    return r;
  };
  let characterId: string | null = null;
  return {
    jar,
    async post(path: string, body: unknown = {}, extra: Record<string, string> = {}) {
      const r = keep(await fetch(base + path, { method: 'POST', headers: headers(extra), body: JSON.stringify(body) }));
      return { status: r.status, body: await r.json() };
    },
    async get(path: string) { const r = keep(await fetch(base + path, { headers: headers() })); return { status: r.status, body: await r.json() }; },
    async act(action: string, payload?: Record<string, string>) {
      const r = await this.post('/api/action', { characterId, action, payload });
      if (r.body.characterId !== undefined) characterId = r.body.characterId;
      return r.body;
    },
    async create(name: string) {
      await this.act('new-character-start'); await this.act('submit-name', { name });
      return (await this.act('accept', { charClass: 'wizard' })).characterId as string;
    },
    async list(): Promise<string[]> { return (await this.get('/api/characters')).body.characters.map((c: { name: string }) => c.name); },
  };
}

describe('Accounts', () => {
  it('signing up: a recovery code once, a session, and a guest’s characters come along', async () => {
    const b = browser();
    await b.create('GuestHero');
    const r = await b.post('/api/auth/signup', { username: 'Frodo', password: 'ringbearer9' });
    expect(r.status).toBe(200);
    expect(r.body.recoveryCode).toMatch(/^[A-Z]+-[A-Z2-9]{4}-[A-Z]+$/);
    expect(r.body.role).toBe('player');
    expect(r.body.claimed).toBe(1);
    expect((await b.get('/api/auth/me')).body.user.username).toBe('Frodo');
    expect(await b.list()).toContain('GuestHero');
    // Another browser (or this one logged out) can't see it.
    expect(await browser().list()).not.toContain('GuestHero');
  });

  it('usernames and passwords have rules, and names are unique (ignoring case)', async () => {
    const b = browser();
    expect((await b.post('/api/auth/signup', { username: 'x', password: 'longenough' })).status).toBe(400);
    expect((await b.post('/api/auth/signup', { username: 'Sam', password: 'short' })).status).toBe(400);
    expect((await b.post('/api/auth/signup', { username: 'Sam', password: 'longenough' })).status).toBe(200);
    expect((await browser().post('/api/auth/signup', { username: 'sam', password: 'longenough' })).status).toBe(409);
  });

  it('logging in on another device finds your characters; logging out leaves you a guest', async () => {
    const a = browser();
    await a.post('/api/auth/signup', { username: 'Merry', password: 'pipeweed12' });
    await a.create('MerrysHero');
    const b = browser();
    expect(await b.list()).not.toContain('MerrysHero');
    expect((await b.post('/api/auth/login', { username: 'merry', password: 'pipeweed12' })).status).toBe(200);
    expect(await b.list()).toContain('MerrysHero');
    await b.post('/api/auth/logout');
    expect((await b.get('/api/auth/me')).body.user).toBeNull();
    expect(await b.list()).not.toContain('MerrysHero');
  });

  it('wrong passwords are refused, and five in a row lock the name out for a while', async () => {
    await browser().post('/api/auth/signup', { username: 'Pippin', password: 'secondbreakfast' });
    const b = browser();
    for (let i = 0; i < 5; i++) expect((await b.post('/api/auth/login', { username: 'Pippin', password: 'nope' + i })).status).toBe(401);
    const locked = await b.post('/api/auth/login', { username: 'Pippin', password: 'secondbreakfast' });
    expect(locked.status).toBe(429);
    expect(locked.body.error).toContain('Try again in');
  });

  it('a forgotten password: the recovery code sets a new one and issues a fresh code', async () => {
    const r = await browser().post('/api/auth/signup', { username: 'Sam2', password: 'potatoes99' });
    const b = browser();
    expect((await b.post('/api/auth/recover', { username: 'Sam2', recoveryCode: 'WRONG-AAAA-CODE', newPassword: 'newpass123' })).status).toBe(401);
    const ok = await b.post('/api/auth/recover', { username: 'Sam2', recoveryCode: r.body.recoveryCode.toLowerCase(), newPassword: 'newpass123' });
    expect(ok.status).toBe(200);
    expect(ok.body.recoveryCode).not.toBe(r.body.recoveryCode);
    expect((await browser().post('/api/auth/login', { username: 'Sam2', password: 'potatoes99' })).status).toBe(401);
    expect((await browser().post('/api/auth/login', { username: 'Sam2', password: 'newpass123' })).status).toBe(200);
  });

  it('changing your password needs the current one', async () => {
    const b = browser();
    await b.post('/api/auth/signup', { username: 'Gandalf2', password: 'youshallnot' });
    expect((await b.post('/api/auth/change-password', { currentPassword: 'bad', newPassword: 'passnow123' })).status).toBe(401);
    expect((await b.post('/api/auth/change-password', { currentPassword: 'youshallnot', newPassword: 'passnow123' })).status).toBe(200);
    expect((await browser().post('/api/auth/login', { username: 'Gandalf2', password: 'passnow123' })).status).toBe(200);
  });

  it('the owner signs up as admin: sees everyone, resets passwords (temporary, must change), disables accounts', async () => {
    const owner = browser(true);
    expect((await owner.post('/api/auth/signup', { username: 'Mike', password: 'dungeonmaster' })).body.role).toBe('admin');
    const p = browser();
    await p.post('/api/auth/signup', { username: 'Bilbo', password: 'thereandback' });
    await p.create('BilbosHero');
    expect(await owner.list()).toContain('BilbosHero');
    const users = (await owner.get('/api/admin/users')).body.users;
    const bilbo = users.find((u: { username: string }) => u.username === 'Bilbo');
    expect(bilbo.characters).toBe(1);
    expect((await p.get('/api/admin/users')).status).toBe(403);
    const reset = await owner.post('/api/admin/reset-password', { userId: bilbo.id });
    const login = await browser().post('/api/auth/login', { username: 'Bilbo', password: reset.body.temporaryPassword });
    expect(login.body.mustChange).toBe(true);
    await owner.post('/api/admin/disable', { userId: bilbo.id, disabled: true });
    expect((await browser().post('/api/auth/login', { username: 'Bilbo', password: reset.body.temporaryPassword })).status).toBe(403);
  });

  it('deleting your account takes its characters with it', async () => {
    const b = browser();
    await b.post('/api/auth/signup', { username: 'Boromir', password: 'onedoesnot' });
    const id = await b.create('BoromirsHero');
    expect((await b.post('/api/auth/delete-account', { password: 'wrong' })).status).toBe(401);
    expect((await b.post('/api/auth/delete-account', { password: 'onedoesnot' })).status).toBe(200);
    expect(repo.loadCharacter(id)).toBeNull();
    expect((await browser().post('/api/auth/login', { username: 'Boromir', password: 'onedoesnot' })).status).toBe(401);
  });

  it('only three new accounts a day from one address', async () => {
    const b = browser();
    for (let i = 0; i < 3; i++) { await b.post('/api/auth/logout'); expect((await b.post('/api/auth/signup', { username: `Orc${i}`, password: 'grishnakh' })).status).toBe(200); }
    expect((await b.post('/api/auth/signup', { username: 'Orc9', password: 'grishnakh' })).status).toBe(429);
  });

  it('requests from another site are refused', async () => {
    const b = browser();
    const r = await b.post('/api/auth/signup', { username: 'Saruman', password: 'whitehand1' }, { Origin: 'https://evil.example' });
    expect(r.status).toBe(403);
  });
});
