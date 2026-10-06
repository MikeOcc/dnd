// Player accounts and their sessions (see the users and auth_sessions
// tables in schema.sql). Hashing lives in server/auth.ts; this only stores.
import type { DatabaseSync } from 'node:sqlite';

export interface User {
  id: string;
  username: string;
  role: 'player' | 'admin';
  mustChange: boolean;
  disabled: boolean;
  createdAt: number;
  lastLogin: number | null;
}

interface UserRow extends User { passwordHash: string; recoveryHash: string }

function toUser(r: Record<string, unknown>): UserRow {
  return {
    id: r['id'] as string,
    username: r['username'] as string,
    role: (r['role'] as User['role']) || 'player',
    mustChange: !!r['must_change'],
    disabled: !!r['disabled'],
    createdAt: r['created_at'] as number,
    lastLogin: (r['last_login'] as number | null) ?? null,
    passwordHash: r['password_hash'] as string,
    recoveryHash: r['recovery_hash'] as string,
  };
}

export class Accounts {
  constructor(private db: DatabaseSync) {}

  create(u: { id: string; username: string; passwordHash: string; recoveryHash: string; role: User['role'] }): void {
    this.db.prepare('INSERT INTO users (id, username, password_hash, recovery_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(u.id, u.username, u.passwordHash, u.recoveryHash, u.role, Date.now());
  }

  byName(username: string): UserRow | null {
    const r = this.db.prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE').get(username) as Record<string, unknown> | undefined;
    return r ? toUser(r) : null;
  }

  byId(id: string): UserRow | null {
    const r = this.db.prepare('SELECT * FROM users WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    return r ? toUser(r) : null;
  }

  /** Accounts made in the last `ms` milliseconds. */
  countSince(ms: number): number {
    return (this.db.prepare('SELECT COUNT(*) AS n FROM users WHERE created_at > ?').get(Date.now() - ms) as { n: number }).n;
  }

  count(): number {
    return (this.db.prepare('SELECT COUNT(*) AS n FROM users').get() as { n: number }).n;
  }

  /** Everyone, with how many characters each has (for the admin page). */
  list(): (User & { characters: number })[] {
    const rows = this.db.prepare(
      "SELECT u.*, (SELECT COUNT(*) FROM characters c WHERE c.owner = 'u:' || u.id) AS characters FROM users u ORDER BY u.created_at"
    ).all() as Record<string, unknown>[];
    return rows.map(r => { const { passwordHash: _p, recoveryHash: _r, ...u } = toUser(r); return { ...u, characters: r['characters'] as number }; });
  }

  setPassword(id: string, passwordHash: string, mustChange: boolean): void {
    this.db.prepare('UPDATE users SET password_hash = ?, must_change = ? WHERE id = ?').run(passwordHash, mustChange ? 1 : 0, id);
  }

  setRecovery(id: string, recoveryHash: string): void {
    this.db.prepare('UPDATE users SET recovery_hash = ? WHERE id = ?').run(recoveryHash, id);
  }

  setDisabled(id: string, disabled: boolean): void {
    this.db.prepare('UPDATE users SET disabled = ? WHERE id = ?').run(disabled ? 1 : 0, id);
    if (disabled) this.db.prepare('DELETE FROM auth_sessions WHERE user_id = ?').run(id);
  }

  touchLogin(id: string): void {
    this.db.prepare('UPDATE users SET last_login = ? WHERE id = ?').run(Date.now(), id);
  }

  /** Removes the account, its sessions, and its characters. */
  remove(id: string): void {
    this.db.prepare("DELETE FROM characters WHERE owner = 'u:' || ?").run(id);
    this.db.prepare('DELETE FROM auth_sessions WHERE user_id = ?').run(id);
    this.db.prepare('DELETE FROM users WHERE id = ?').run(id);
  }

  addSession(tokenHash: string, userId: string, days: number): void {
    const now = Date.now();
    this.db.prepare('INSERT INTO auth_sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)').run(tokenHash, userId, now, now + days * 86_400_000);
  }

  /** The user a live session belongs to (not expired, not disabled). */
  userForSession(tokenHash: string): User | null {
    const r = this.db.prepare(
      'SELECT u.* FROM auth_sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ? AND u.disabled = 0'
    ).get(tokenHash, Date.now()) as Record<string, unknown> | undefined;
    if (!r) return null;
    const { passwordHash: _p, recoveryHash: _r, ...u } = toUser(r);
    return u;
  }

  /** Forgets sessions past their expiry. */
  dropExpiredSessions(): void {
    this.db.prepare('DELETE FROM auth_sessions WHERE expires_at <= ?').run(Date.now());
  }

  dropSession(tokenHash: string): void {
    this.db.prepare('DELETE FROM auth_sessions WHERE token_hash = ?').run(tokenHash);
  }

  dropSessionsOf(userId: string, except?: string): void {
    this.db.prepare('DELETE FROM auth_sessions WHERE user_id = ? AND token_hash != ?').run(userId, except ?? '');
  }

  /** Characters a guest made in this browser become the account's. */
  claimGuestCharacters(guestId: string, userId: string): number {
    return Number(this.db.prepare("UPDATE characters SET owner = 'u:' || ? WHERE owner = ?").run(userId, guestId).changes);
  }
}
