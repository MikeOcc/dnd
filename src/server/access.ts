// Who is asking, and what they may do. The house owner plays on this Mac
// (localhost); everyone else arrives through the tunnel and is a guest,
// known by a cookie their browser keeps. Guests see the shared test
// characters and the ones they made themselves, never the owner's; one
// player drives a character at a time; and a few limits keep a public
// link from being abused.

import type { Request, Response } from 'express';
import { randomBytes, createHmac, createHash, timingSafeEqual } from 'node:crypto';
import type { Accounts, User } from '../database/accounts.js';

export const ACCESS = {
  COOKIE: 'sl_visitor',
  LOCK_MINUTES: 10,          // a character idle this long can be picked up by someone else
  SESSION_IDLE_HOURS: 3,     // games idle this long are dropped from memory (saves are manual)
  MAX_SESSIONS: 300,
  MAX_CHARACTERS_PER_GUEST: 10,
  RATE_PER_SECOND: 25,       // requests per visitor (a held arrow key is ~10)
  RATE_BURST: 60,
} as const;

export interface Visitor { id: string; owner: boolean; user?: User; guestId?: string }

// ─── Accounts ────────────────────────────────────────────────────────────────
// A signed-in player is known by their session cookie: their id is
// 'u:<user id>', and an admin account counts as the owner.

export const SESSION_COOKIE = 'sl_session';
let accounts: Accounts | null = null;
export function useAccounts(a: Accounts): void { accounts = a; }
export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

/** The signed-in user, if this request carries a live session. */
export function sessionUser(req: Request): User | null {
  const token = readCookie(req, SESSION_COOKIE);
  if (!token || !accounts) return null;
  return accounts.userForSession(hashToken(token));
}

// ─── The owner's key ─────────────────────────────────────────────────────────
// Hosted in the cloud, everyone arrives through the tunnel, so the owner signs
// in once by visiting /owner?key=<OWNER_KEY> (the key lives in the server's
// environment). That leaves a cookie holding a token derived from the key.

const OWNER_COOKIE = 'sl_owner';
const ownerKey = (): string => process.env.OWNER_KEY ?? '';
const ownerToken = (): string => createHmac('sha256', ownerKey()).update('seven-levels-owner').digest('hex');

function sameSecret(a: string, b: string): boolean {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** GET /owner?key=...: a correct key makes this browser the owner's. */
export function ownerSignIn(req: Request, res: Response): void {
  const key = String(req.query.key ?? '');
  if (ownerKey().length < 16 || !sameSecret(key, ownerKey())) { res.status(404).send('Not found'); return; }
  res.setHeader('Set-Cookie', `${OWNER_COOKIE}=${ownerToken()}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax; Secure`);
  res.redirect(302, '/');
}

/** GET /owner/sign-out: this browser goes back to being a guest. */
export function ownerSignOut(_req: Request, res: Response): void {
  res.setHeader('Set-Cookie', `${OWNER_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure`);
  res.redirect(302, '/');
}

/** The house owner: a browser signed in with the owner's key, or a request
 * made on this machine and not relayed by a tunnel. */
export function isOwner(req: Request): boolean {
  const cookie = readCookie(req, OWNER_COOKIE);
  if (cookie && ownerKey().length >= 16 && sameSecret(cookie, ownerToken())) return true;
  const addr = req.socket.remoteAddress ?? '';
  const local = addr === '127.0.0.1' || addr === '::1' || addr === '::ffff:127.0.0.1';
  // Tunnels (ngrok, Cloudflare) mark what they relay; any such mark means a guest.
  const h = req.headers;
  const relayed = !!(h['x-forwarded-for'] || h['ngrok-skip-browser-warning'] || h['x-forwarded-host'] || h['cf-connecting-ip'] || h['cf-ray']);
  return local && !relayed;
}

export function readCookie(req: Request, name: string): string | undefined {
  for (const part of (req.headers.cookie ?? '').split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return undefined;
}

/** Identifies the visitor, giving a new guest a cookie. */
export function visitorOf(req: Request, res: Response): Visitor {
  const user = sessionUser(req);
  if (user) return { id: `u:${user.id}`, owner: user.role === 'admin', user, guestId: readCookie(req, ACCESS.COOKIE) };
  if (isOwner(req)) return { id: 'owner', owner: true };
  let id = readCookie(req, ACCESS.COOKIE);
  if (!id || !/^g-[a-f0-9]{24}$/.test(id)) {
    id = `g-${randomBytes(12).toString('hex')}`;
    res.setHeader('Set-Cookie', `${ACCESS.COOKIE}=${id}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax; Secure`);
  }
  return { id, owner: false };
}

/** Whether a visitor may see and play a character with this owner. */
export function canUse(v: Visitor, owner: string | null | undefined): boolean {
  if (owner === undefined) return false;   // no such character
  if (v.owner) return true;
  return owner === null || owner === v.id;
}

/** Whether a visitor may delete a character: guests only their own. */
export function canDelete(v: Visitor, owner: string | null | undefined): boolean {
  if (owner === undefined) return false;
  return v.owner || owner === v.id;
}

// ─── Rate limiting: a token bucket per visitor ───────────────────────────────

const buckets = new Map<string, { tokens: number; at: number }>();

export function allowRequest(v: Visitor): boolean {
  if (v.owner) return true;
  const now = Date.now();
  const b = buckets.get(v.id) ?? { tokens: ACCESS.RATE_BURST, at: now };
  b.tokens = Math.min(ACCESS.RATE_BURST, b.tokens + ((now - b.at) / 1000) * ACCESS.RATE_PER_SECOND);
  b.at = now;
  if (b.tokens < 1) { buckets.set(v.id, b); return false; }
  b.tokens -= 1;
  buckets.set(v.id, b);
  if (buckets.size > 5000) buckets.clear();   // never grows without bound
  return true;
}
