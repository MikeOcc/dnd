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
// (the word lists live in core/names.ts, shared with the echoes of other players)
export { usernameProblem } from '../core/names.js';
