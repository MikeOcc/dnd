// Browser security headers for every answer, and the rules for usernames.

import type { Request, Response, NextFunction } from 'express';

// Where the page may load things from: only this site, plus Cloudflare's
// "are you human" check (Turnstile) on the sign-up form and its optional
// visitor analytics. Inline styles are allowed (the art and the layout use
// them); inline scripts are not.
const CSP = [
  "default-src 'self'",
  "script-src 'self' https://challenges.cloudflare.com https://static.cloudflareinsights.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://cloudflareinsights.com",
  'frame-src https://challenges.cloudflare.com',
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

export function securityHeaders(req: Request, res: Response, next: NextFunction): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');                 // files are only what they say they are
  res.setHeader('X-Frame-Options', 'DENY');                           // no one can frame the game (clickjacking)
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  // Browsers that reach the site over HTTPS always use HTTPS from then on.
  if (process.env.NODE_ENV === 'production') res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  // The owner's development pages use inline scripts; everything else gets the strict policy.
  if (!req.path.startsWith('/dev')) res.setHeader('Content-Security-Policy', CSP);
  next();
}

// ─── Usernames ───────────────────────────────────────────────────────────────

/** Names only the game itself may use. */
const RESERVED = ['admin', 'administrator', 'owner', 'moderator', 'mod', 'system', 'root', 'support', 'staff', 'official',
  'sevenlevels', 'theseven', 'dungeonmaster', 'gamemaster', 'anonymous', 'guest', 'null', 'undefined'];

/** Words a name may not contain anywhere (after undoing l33t-speak).
 * Only words that can't sit innocently inside an ordinary name. */
const BLOCKED = ['fuck', 'shit', 'cunt', 'bitch', 'whore', 'slut', 'nigger', 'nigga', 'faggot', 'fagot', 'retard', 'rapist', 'rape',
  'nazi', 'hitler', 'kike', 'spic', 'chink', 'tranny', 'dyke', 'pedo', 'paedo', 'molest', 'porn', 'penis', 'vagina', 'dildo',
  'cock', 'pussy', 'twat', 'wank', 'jizz', 'cum', 'anal', 'kkk', 'heil', 'killall', 'suicide'];
/** Words blocked only as the whole name, or a whole part of it (they hide inside ordinary names). */
const BLOCKED_WORDS = ['ass', 'fag', 'tit', 'tits', 'sex', 'gay', 'hoe', 'nig', 'coon', 'jew'];

const LEET: Record<string, string> = { '0': 'o', '1': 'i', '!': 'i', '3': 'e', '4': 'a', '@': 'a', '5': 's', '$': 's', '7': 't', '8': 'b', '9': 'g' };

/** Why a username isn't allowed, or null if it is. */
export function usernameProblem(name: string): string | null {
  const lower = name.toLowerCase();
  const plain = [...lower].map(c => LEET[c] ?? c).join('');
  const squashed = plain.replace(/[-_]/g, '').replace(/(.)\1+/g, '$1');   // "f_u_c_k", "fuuuck"
  if (RESERVED.includes(plain.replace(/[-_]/g, ''))) return 'That name is reserved. Please choose another.';
  if (BLOCKED.some(w => plain.replace(/[-_]/g, '').includes(w) || squashed.includes(w))) return 'Please choose a different name.';
  const parts = plain.split(/[-_]|(?<=[a-z])(?=\d)|(?<=\d)(?=[a-z])/).filter(Boolean);
  if (parts.some(p => BLOCKED_WORDS.includes(p)) || BLOCKED_WORDS.includes(plain)) return 'Please choose a different name.';
  return null;
}
