// Who is asking, and what they may do. The house owner plays on this Mac
// (localhost); everyone else arrives through the tunnel and is a guest,
// known by a cookie their browser keeps. Guests see the shared test
// characters and the ones they made themselves, never the owner's; one
// player drives a character at a time; and a few limits keep a public
// link from being abused.

import type { Request, Response } from 'express';
import { randomBytes } from 'node:crypto';

export const ACCESS = {
  COOKIE: 'sl_visitor',
  LOCK_MINUTES: 10,          // a character idle this long can be picked up by someone else
  SESSION_IDLE_HOURS: 3,     // games idle this long are dropped from memory (saves are manual)
  MAX_SESSIONS: 300,
  MAX_CHARACTERS_PER_GUEST: 10,
  RATE_PER_SECOND: 25,       // requests per visitor (a held arrow key is ~10)
  RATE_BURST: 60,
} as const;

export interface Visitor { id: string; owner: boolean }

/** The house owner: a request made on this machine, not relayed by the tunnel. */
function isOwner(req: Request): boolean {
  const addr = req.socket.remoteAddress ?? '';
  const local = addr === '127.0.0.1' || addr === '::1' || addr === '::ffff:127.0.0.1';
  // Tunnels (ngrok, Cloudflare) mark what they relay; any such mark means a guest.
  const h = req.headers;
  const relayed = !!(h['x-forwarded-for'] || h['ngrok-skip-browser-warning'] || h['x-forwarded-host'] || h['cf-connecting-ip'] || h['cf-ray']);
  return local && !relayed;
}

function readCookie(req: Request, name: string): string | undefined {
  for (const part of (req.headers.cookie ?? '').split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return undefined;
}

/** Identifies the visitor, giving a new guest a cookie. */
export function visitorOf(req: Request, res: Response): Visitor {
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
