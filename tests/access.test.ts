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
