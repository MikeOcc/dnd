// Player accounts: sign up, log in and out, change or recover a password,
// delete an account, and the admin's tools. Usernames and passwords; no
// email. Forgotten passwords: the recovery code shown once at sign-up, or
// the admin issues a temporary password.

import type { Express, Request, Response } from 'express';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import type { Accounts } from '../database/accounts.js';
import { ACCESS, SESSION_COOKIE, hashToken, sessionUser, visitorOf, readCookie } from './access.js';

export const AUTH = {
  SESSION_DAYS: 30,
  USERNAME: /^[A-Za-z0-9_-]{3,20}$/,
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 200,
  LOGIN_FAILS: 5,               // wrong passwords before a lockout...
  LOCKOUT_MINUTES: 10,          // ...this long
  SIGNUPS_PER_ADDRESS_PER_DAY: 3,
} as const;

// ─── Hashing ─────────────────────────────────────────────────────────────────

/** "scrypt$<salt>$<hash>" */
export function hashSecret(secret: string): string {
  const salt = randomBytes(16);
  return `scrypt$${salt.toString('hex')}$${scryptSync(secret, salt, 64).toString('hex')}`;
}

export function checkSecret(secret: string, stored: string): boolean {
  const [kind, salt, hash] = stored.split('$');
  if (kind !== 'scrypt' || !salt || !hash) return false;
  const got = scryptSync(secret, Buffer.from(salt, 'hex'), 64);
  const want = Buffer.from(hash, 'hex');
  return got.length === want.length && timingSafeEqual(got, want);
}

const WORDS = ['RAVEN', 'TORCH', 'EMBER', 'STONE', 'CROWN', 'GLOOM', 'FROST', 'VIPER', 'RUNE', 'ASH', 'IRON', 'MOSS', 'BONE', 'GRAIL', 'WYRM', 'LANTERN'];
/** A recovery code like RAVEN-7Q4M-TORCH. */
export function newRecoveryCode(): string {
  const b = randomBytes(4);
  const mid = [...b].map(x => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[x % 32]).join('');
  return `${WORDS[randomBytes(1)[0] % WORDS.length]}-${mid}-${WORDS[randomBytes(1)[0] % WORDS.length]}`;
}
const normalizeCode = (c: string) => c.trim().toUpperCase().replace(/\s+/g, '');

/** A temporary password the admin hands to someone who's locked out. */
const tempPassword = () => randomBytes(6).toString('base64url');

// ─── Limits ──────────────────────────────────────────────────────────────────

const addressOf = (req: Request) => String(req.headers['cf-connecting-ip'] ?? (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0] ?? req.socket.remoteAddress ?? '?').trim();
const failures = new Map<string, { count: number; until: number }>();
const signups = new Map<string, number[]>();

function lockedOut(key: string): number {
  const f = failures.get(key);
  return f && f.until > Date.now() ? Math.ceil((f.until - Date.now()) / 60000) : 0;
}
function failed(key: string): void {
  const f = failures.get(key) ?? { count: 0, until: 0 };
  f.count++;
  if (f.count >= AUTH.LOGIN_FAILS) { f.until = Date.now() + AUTH.LOCKOUT_MINUTES * 60_000; f.count = 0; }
  failures.set(key, f);
  if (failures.size > 10_000) failures.clear();
}

// ─── Sessions ────────────────────────────────────────────────────────────────

function startSession(res: Response, accounts: Accounts, userId: string): void {
  const token = randomBytes(32).toString('base64url');
  accounts.addSession(hashToken(token), userId, AUTH.SESSION_DAYS);
  res.append('Set-Cookie', `${SESSION_COOKIE}=${token}; Path=/; Max-Age=${AUTH.SESSION_DAYS * 86400}; HttpOnly; SameSite=Lax; Secure`);
}
function endSession(req: Request, res: Response, accounts: Accounts): void {
  const token = readCookie(req, SESSION_COOKIE);
  if (token) accounts.dropSession(hashToken(token));
  res.append('Set-Cookie', `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure`);
}

function passwordProblem(pw: unknown): string | null {
  if (typeof pw !== 'string' || pw.length < AUTH.PASSWORD_MIN) return `Passwords need at least ${AUTH.PASSWORD_MIN} characters.`;
  if (pw.length > AUTH.PASSWORD_MAX) return 'That password is too long.';
  return null;
}

/** Requests that change things must come from this site (not another page). */
export function sameSiteOnly(req: Request, res: Response, next: () => void): void {
  const origin = req.headers.origin;
  if (req.method !== 'GET' && origin) {
    try {
      if (new URL(origin).host !== req.headers.host) { res.status(403).json({ error: 'Cross-site request refused.' }); return; }
    } catch { res.status(403).json({ error: 'Cross-site request refused.' }); return; }
  }
  next();
}

// ─── Routes ──────────────────────────────────────────────────────────────────

export function setupAuthRoutes(app: Express, accounts: Accounts, hooks: { moveHolder: (from: string, to: string) => void }): void {
  const me = (req: Request, res: Response) => {
    const v = visitorOf(req, res);
    return { user: v.user ? { username: v.user.username, role: v.user.role, mustChange: v.user.mustChange } : null, owner: v.owner, guest: !v.user && !v.owner };
  };

  app.get('/api/auth/me', (req, res) => { res.json(me(req, res)); });

  app.post('/api/auth/signup', (req, res) => {
    const { username, password } = (req.body ?? {}) as { username?: string; password?: string };
    if (typeof username !== 'string' || !AUTH.USERNAME.test(username)) return res.status(400).json({ error: 'Usernames are 3-20 letters, numbers, - or _.' });
    const pwBad = passwordProblem(password);
    if (pwBad) return res.status(400).json({ error: pwBad });
    if (accounts.byName(username)) return res.status(409).json({ error: 'That username is taken.' });
    const addr = addressOf(req);
    const recent = (signups.get(addr) ?? []).filter(t => Date.now() - t < 86_400_000);
    if (recent.length >= AUTH.SIGNUPS_PER_ADDRESS_PER_DAY) return res.status(429).json({ error: 'Too many new accounts from here today. Try again tomorrow.' });

    const v = visitorOf(req, res);
    const id = randomBytes(9).toString('hex');
    const code = newRecoveryCode();
    // Signing up from the owner's browser makes the admin account.
    accounts.create({ id, username, passwordHash: hashSecret(password!), recoveryHash: hashSecret(normalizeCode(code)), role: v.owner ? 'admin' : 'player' });
    signups.set(addr, [...recent, Date.now()]);
    const claimed = v.id.startsWith('g-') ? accounts.claimGuestCharacters(v.id, id) : 0;
    if (v.id.startsWith('g-')) hooks.moveHolder(v.id, `u:${id}`);
    startSession(res, accounts, id);
    accounts.touchLogin(id);
    res.json({ ok: true, username, role: v.owner ? 'admin' : 'player', recoveryCode: code, claimed });
  });

  app.post('/api/auth/login', (req, res) => {
    const { username, password } = (req.body ?? {}) as { username?: string; password?: string };
    const key = `${addressOf(req)}|${String(username ?? '').toLowerCase()}`;
    const wait = lockedOut(key);
    if (wait) return res.status(429).json({ error: `Too many wrong passwords. Try again in ${wait} minute${wait === 1 ? '' : 's'}.` });
    const u = typeof username === 'string' ? accounts.byName(username) : null;
    if (!u || typeof password !== 'string' || !checkSecret(password, u.passwordHash)) { failed(key); return res.status(401).json({ error: 'Wrong username or password.' }); }
    if (u.disabled) return res.status(403).json({ error: 'This account has been disabled.' });
    const guest = readCookie(req, ACCESS.COOKIE);
    const claimed = guest && /^g-/.test(guest) ? accounts.claimGuestCharacters(guest, u.id) : 0;
    if (guest) hooks.moveHolder(guest, `u:${u.id}`);
    startSession(res, accounts, u.id);
    accounts.touchLogin(u.id);
    res.json({ ok: true, username: u.username, role: u.role, mustChange: u.mustChange, claimed });
  });

  app.post('/api/auth/logout', (req, res) => { endSession(req, res, accounts); res.json({ ok: true }); });

  /** Forgotten password: username + recovery code + a new password. Issues a new recovery code. */
  app.post('/api/auth/recover', (req, res) => {
    const { username, recoveryCode, newPassword } = (req.body ?? {}) as Record<string, string | undefined>;
    const key = `${addressOf(req)}|recover|${String(username ?? '').toLowerCase()}`;
    const wait = lockedOut(key);
    if (wait) return res.status(429).json({ error: `Too many tries. Try again in ${wait} minute${wait === 1 ? '' : 's'}.` });
    const u = typeof username === 'string' ? accounts.byName(username) : null;
    if (!u || typeof recoveryCode !== 'string' || !checkSecret(normalizeCode(recoveryCode), u.recoveryHash)) { failed(key); return res.status(401).json({ error: 'That username and recovery code do not match.' }); }
    const pwBad = passwordProblem(newPassword);
    if (pwBad) return res.status(400).json({ error: pwBad });
    const code = newRecoveryCode();
    accounts.setPassword(u.id, hashSecret(newPassword!), false);
    accounts.setRecovery(u.id, hashSecret(normalizeCode(code)));
    accounts.dropSessionsOf(u.id);
    startSession(res, accounts, u.id);
    res.json({ ok: true, username: u.username, recoveryCode: code });
  });

  app.post('/api/auth/change-password', (req, res) => {
    const user = sessionUser(req);
    if (!user) return res.status(401).json({ error: 'Log in first.' });
    const { currentPassword, newPassword } = (req.body ?? {}) as Record<string, string | undefined>;
    const u = accounts.byId(user.id)!;
    if (typeof currentPassword !== 'string' || !checkSecret(currentPassword, u.passwordHash)) return res.status(401).json({ error: 'Your current password is wrong.' });
    const pwBad = passwordProblem(newPassword);
    if (pwBad) return res.status(400).json({ error: pwBad });
    accounts.setPassword(u.id, hashSecret(newPassword!), false);
    accounts.dropSessionsOf(u.id, hashToken(readCookie(req, SESSION_COOKIE) ?? ''));   // other devices log out
    res.json({ ok: true });
  });

  app.post('/api/auth/delete-account', (req, res) => {
    const user = sessionUser(req);
    if (!user) return res.status(401).json({ error: 'Log in first.' });
    const { password } = (req.body ?? {}) as Record<string, string | undefined>;
    if (typeof password !== 'string' || !checkSecret(password, accounts.byId(user.id)!.passwordHash)) return res.status(401).json({ error: 'Wrong password.' });
    if (user.role === 'admin' && accounts.list().filter(x => x.role === 'admin').length <= 1) return res.status(400).json({ error: 'You are the only admin: that account stays.' });
    accounts.remove(user.id);
    res.append('Set-Cookie', `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure`);
    res.json({ ok: true });
  });

  // ─── The admin's tools ─────────────────────────────────────────────────────
  const adminOnly = (req: Request, res: Response): boolean => {
    if (sessionUser(req)?.role === 'admin') return true;
    res.status(403).json({ error: 'Admins only.' });
    return false;
  };
  app.get('/api/admin/users', (req, res) => { if (adminOnly(req, res)) res.json({ users: accounts.list() }); });
  /** A temporary password for someone locked out; they must choose a new one on logging in. */
  app.post('/api/admin/reset-password', (req, res) => {
    if (!adminOnly(req, res)) return;
    const u = accounts.byId(String((req.body ?? {}).userId ?? ''));
    if (!u) return res.status(404).json({ error: 'No such player.' });
    const temp = tempPassword();
    accounts.setPassword(u.id, hashSecret(temp), true);
    accounts.dropSessionsOf(u.id);
    res.json({ ok: true, username: u.username, temporaryPassword: temp });
  });
  app.post('/api/admin/disable', (req, res) => {
    if (!adminOnly(req, res)) return;
    const { userId, disabled } = (req.body ?? {}) as { userId?: string; disabled?: boolean };
    const u = accounts.byId(String(userId ?? ''));
    if (!u) return res.status(404).json({ error: 'No such player.' });
    if (u.role === 'admin') return res.status(400).json({ error: "Admins can't be disabled here." });
    accounts.setDisabled(u.id, !!disabled);
    res.json({ ok: true });
  });
}
