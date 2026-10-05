// The server as the internet sees it: requests relayed by the tunnel (with
// X-Forwarded-For) are guests, known by a cookie; requests made on this
// machine are the owner.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import type { Server } from 'node:http';
import { createMemoryDb } from '../src/database/database.js';
import { Repository } from '../src/database/repositories.js';
import { setupRoutes } from '../src/server/routes.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any, server: Server, base = '', repo: Repository;

beforeAll(async () => {
  process.env.OWNER_KEY = 'test-owner-key-0123456789abcdef';
  db = createMemoryDb();
  repo = new Repository(db);
  const app = express();
  app.use(express.json());
  setupRoutes(app, db);
  await new Promise<void>(r => { server = app.listen(0, '127.0.0.1', () => r()); });
  const addr = server.address();
  base = `http://127.0.0.1:${typeof addr === 'object' && addr ? addr.port : 0}`;
});
afterAll(() => { server.close(); db.close(); });

/** A client: the owner (on this machine) or a guest (through the tunnel), keeping its cookie. */
function client(guest: boolean) {
  let cookie = '';
  const headers = () => ({
    'Content-Type': 'application/json',
    ...(guest ? { 'X-Forwarded-For': '203.0.113.7' } : {}),
    ...(cookie ? { Cookie: cookie } : {}),
  });
  const keep = (r: Response) => { const c = r.headers.get('set-cookie'); if (c) cookie = c.split(';')[0]; return r; };
  let characterId: string | null = null;
  return {
    get cookie() { return cookie; },
    get characterId() { return characterId; },
    async act(action: string, payload?: Record<string, string>, id = characterId) {
      const r = keep(await fetch(`${base}/api/action`, { method: 'POST', headers: headers(), body: JSON.stringify({ characterId: id, action, payload }) }));
      const data = await r.json();
      if (data.characterId !== undefined) characterId = data.characterId;
      return { status: r.status, ...data };
    },
    async list(): Promise<{ id: string; name: string }[]> {
      return (await keep(await fetch(`${base}/api/characters`, { headers: headers() })).json()).characters;
    },
    async del(id: string) { return keep(await fetch(`${base}/api/characters/${id}`, { method: 'DELETE', headers: headers() })).status; },
    async create(name: string) {
      await this.act('new-character-start');
      await this.act('submit-name', { name });
      const r = await this.act('accept', { charClass: 'wizard' });
      return r.characterId as string;
    },
  };
}

describe('Playing over the internet', () => {
  it("guests never see or touch the owner's characters, but share the test ones", async () => {
    const owner = client(false), guest = client(true);
    const mine = await owner.create('OwnerHero');
    expect(repo.getOwner(mine)).toBe('owner');
    const shared = await owner.create('SharedHero');
    repo.setOwner(shared, null);   // a shared test character

    const seen = (await guest.list()).map(c => c.id);
    expect(seen).toContain(shared);
    expect(seen).not.toContain(mine);
    expect(guest.cookie).toMatch(/^sl_visitor=g-/);

    const r = await guest.act('load', { characterId: mine });
    expect(r.state.phase).toBe('main-menu');
    expect(r.state.messages[0]).toContain('not available');
    expect(r.characterId).toBeNull();
    // Nor drive it by naming it in an action.
    const r2 = await guest.act('move-forward', undefined, mine);
    expect(r2.state.messages[0]).toContain('not available');
    expect(await guest.del(mine)).toBe(403);
    expect(await guest.del(shared)).toBe(403);
    expect(repo.getOwner(mine)).toBe('owner');
  });

  it("a guest's own characters are theirs alone: hidden from other guests, deletable only by them", async () => {
    const a = client(true), b = client(true);
    const hers = await a.create('Guesty');
    expect(repo.getOwner(hers)).toBe(a.cookie.split('=')[1]);
    expect((await a.list()).map(c => c.id)).toContain(hers);
    expect((await b.list()).map(c => c.id)).not.toContain(hers);
    expect((await b.act('load', { characterId: hers })).state.phase).toBe('main-menu');
    await a.act('main-menu');
    expect(await b.del(hers)).toBe(403);
    expect(await a.del(hers)).toBe(200);
  });

  it('two guests making characters at once each get their own', async () => {
    const a = client(true), b = client(true);
    await a.act('new-character-start'); await b.act('new-character-start');
    await a.act('submit-name', { name: 'Alpha' }); await b.act('submit-name', { name: 'Beta' });
    const ra = await a.act('accept', { charClass: 'wizard' });
    const rb = await b.act('accept', { charClass: 'warrior' });
    expect(ra.state.character.name).toBe('Alpha');
    expect(rb.state.character.name).toBe('Beta');
    expect(rb.state.character.charClass).toBe('warrior');
  });

  it('one player per character: a second guest is turned away until the first goes back to the menu', async () => {
    const owner = client(false), a = client(true), b = client(true);
    const shared = await owner.create('Conanish');
    repo.setOwner(shared, null);
    await owner.act('main-menu');

    expect((await a.act('load', { characterId: shared })).state.phase).not.toBe('main-menu');
    const turned = await b.act('load', { characterId: shared });
    expect(turned.state.phase).toBe('main-menu');
    expect(turned.state.messages[0]).toContain('Someone else is playing');
    expect(await b.del(shared)).toBe(403);

    await a.act('main-menu');
    expect((await b.act('load', { characterId: shared })).state.phase).not.toBe('main-menu');
  });

  it('a guest is limited in how many characters they make', async () => {
    const g = client(true);
    for (let i = 0; i < 10; i++) await g.create(`Many${i}`);
    const r = await g.act('new-character-start');
    expect(r.state.phase).toBe('main-menu');
    expect(r.state.messages[0]).toContain('already have 10');
  });

  it('names are cleaned of markup', async () => {
    const g = client(true);
    await g.act('new-character-start');
    const r = await g.act('submit-name', { name: '<script>x</script>Bob' });
    expect(r.state.character.name).not.toMatch(/[<>]/);
  });
});

describe('Through a Cloudflare tunnel', () => {
  it('a request carrying Cloudflare headers is a guest, even from this machine', async () => {
    const r = await fetch(`${base}/api/characters`, { headers: { 'CF-Connecting-IP': '198.51.100.9', 'CF-Ray': 'abc' } });
    expect(r.headers.get('set-cookie')).toMatch(/^sl_visitor=g-/);
  });
});

describe("The owner's key, for hosting where everyone is remote", () => {
  const remote = { 'X-Forwarded-For': '203.0.113.9' };
  it('the right key signs a browser in as the owner; a wrong one is a plain 404', async () => {
    const bad = await fetch(`${base}/owner?key=nope`, { headers: remote, redirect: 'manual' });
    expect(bad.status).toBe(404);
    const ok = await fetch(`${base}/owner?key=test-owner-key-0123456789abcdef`, { headers: remote, redirect: 'manual' });
    expect(ok.status).toBe(302);
    const cookie = ok.headers.get('set-cookie')!.split(';')[0];
    expect(cookie).toMatch(/^sl_owner=[a-f0-9]{64}$/);

    // Signed in through the tunnel, the owner sees the owner's characters.
    const owner = client(false);
    const mine = await owner.create('OwnerOnly');
    const asOwner = await (await fetch(`${base}/api/characters`, { headers: { ...remote, Cookie: cookie } })).json();
    expect(asOwner.characters.map((c: { id: string }) => c.id)).toContain(mine);
    const asGuest = await (await fetch(`${base}/api/characters`, { headers: { ...remote, Cookie: 'sl_owner=' + 'f'.repeat(64) } })).json();
    expect(asGuest.characters.map((c: { id: string }) => c.id)).not.toContain(mine);
  });

  it('signing out clears the cookie', async () => {
    const r = await fetch(`${base}/owner/sign-out`, { headers: remote, redirect: 'manual' });
    expect(r.headers.get('set-cookie')).toMatch(/^sl_owner=;.*Max-Age=0/);
  });
});

describe('Development pages', () => {
  it('are hidden from guests', async () => {
    const express2 = (await import('express')).default;
    const { isOwner } = await import('../src/server/access.js');
    const app = express2();
    app.use('/dev', (req, res, next) => (isOwner(req) ? next() : res.status(404).send('Not found')));
    app.get('/dev/x', (_req, res) => { res.send('secret'); });
    const srv = await new Promise<Server>(r => { const s = app.listen(0, '127.0.0.1', () => r(s)); });
    const a = srv.address(); const port = typeof a === 'object' && a ? a.port : 0;
    expect((await fetch(`http://127.0.0.1:${port}/dev/x`, { headers: { 'X-Forwarded-For': '1.2.3.4' } })).status).toBe(404);
    expect((await fetch(`http://127.0.0.1:${port}/dev/x`)).status).toBe(200);
    srv.close();
  });
});
