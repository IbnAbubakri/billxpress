import { vi, describe, it, expect, beforeEach } from 'vitest';
import { createTestDb } from './test-db.js';

let db;

vi.mock('../utils/db.js', () => ({
  getDb: () => db,
}));

vi.mock('../utils/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
  info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(),
}));

let uuidCounter = 0;
vi.mock('uuid', () => ({
  v4: () => 'mock-uuid-' + (uuidCounter++),
}));

import {
  generateRefreshToken, rotateRefreshToken, revokeRefreshToken,
  revokeAllUserRefreshTokens, getStoredRefreshToken,
  createSession, updateSessionActivity, checkSessionActivity,
  getSessionsByUserId, getSessionById, deleteSession, deleteAllUserSessions,
} from '../services/token.service.js';

beforeEach(async () => {
  uuidCounter = 0;
  db = createTestDb();
  const now = new Date().toISOString();
  db.prepare(`INSERT INTO users (id, email, password, role, name, createdAt)
    VALUES ('user-1', 'test@test.com', 'hash', 'user', 'Test', ?)`).run(now);
  db.prepare(`INSERT INTO users (id, email, password, role, name, createdAt)
    VALUES ('user-2', 'test2@test.com', 'hash', 'admin', 'Admin', ?)`).run(now);
});

describe('generateRefreshToken', () => {
  it('inserts a refresh token and returns it', async () => {
    const token = await generateRefreshToken('user-1');
    expect(token).toBeTruthy();
    expect(typeof token).toBe('string');

    const stored = db.prepare('SELECT * FROM refresh_tokens WHERE userId = ?').all('user-1');
    expect(stored.length).toBe(1);
    expect(stored[0].token).toBe(token);
  });

  it('sets an expiration in the future', async () => {
    const token = await generateRefreshToken('user-1');
    const stored = db.prepare('SELECT * FROM refresh_tokens WHERE token = ?').get(token);
    expect(new Date(stored.expiresAt).getTime()).toBeGreaterThan(Date.now());
  });
});

describe('getStoredRefreshToken', () => {
  it('returns valid token', async () => {
    const token = await generateRefreshToken('user-1');
    const found = await getStoredRefreshToken(token);
    expect(found).toBeTruthy();
    expect(found.token).toBe(token);
    expect(found.userId).toBe('user-1');
  });

  it('returns null for non-existent token', async () => {
    const found = await getStoredRefreshToken('non-existent');
    expect(found).toBeNull();
  });

  it('returns null for expired token and cleans it up', async () => {
    const token = 'expired-token';
    db.prepare(`INSERT INTO refresh_tokens (token, userId, expiresAt)
      VALUES (?, ?, ?)`).run(token, 'user-1', new Date(Date.now() - 3600000).toISOString());

    const found = await getStoredRefreshToken(token);
    expect(found).toBeNull();

    const remaining = db.prepare('SELECT * FROM refresh_tokens WHERE token = ?').get(token);
    expect(remaining).toBeUndefined();
  });
});

describe('rotateRefreshToken', () => {
  it('replaces old token with new one', async () => {
    const oldToken = await generateRefreshToken('user-1');
    const newToken = await rotateRefreshToken(oldToken, 'user-1');

    expect(newToken).toBeTruthy();
    expect(newToken).not.toBe(oldToken);

    const oldFound = db.prepare('SELECT * FROM refresh_tokens WHERE token = ?').get(oldToken);
    expect(oldFound).toBeUndefined();

    const newFound = db.prepare('SELECT * FROM refresh_tokens WHERE token = ?').get(newToken);
    expect(newFound).toBeTruthy();
  });

  it('returns null if old token does not exist', async () => {
    const result = await rotateRefreshToken('non-existent', 'user-1');
    expect(result).toBeNull();
  });
});

describe('revokeRefreshToken', () => {
  it('deletes the specified token', async () => {
    const token = await generateRefreshToken('user-1');
    await revokeRefreshToken(token);

    const found = db.prepare('SELECT * FROM refresh_tokens WHERE token = ?').get(token);
    expect(found).toBeUndefined();
  });
});

describe('revokeAllUserRefreshTokens', () => {
  it('deletes all tokens for a user', async () => {
    await generateRefreshToken('user-1');
    await generateRefreshToken('user-2');

    await revokeAllUserRefreshTokens('user-1');

    const user1Tokens = db.prepare('SELECT * FROM refresh_tokens WHERE userId = ?').all('user-1');
    expect(user1Tokens.length).toBe(0);

    const user2Tokens = db.prepare('SELECT * FROM refresh_tokens WHERE userId = ?').all('user-2');
    expect(user2Tokens.length).toBe(1);
  });
});

describe('createSession', () => {
  it('creates a session and returns its id', async () => {
    const sessionId = await createSession('user-1', '127.0.0.1', 'test-agent');
    expect(sessionId).toBeTruthy();

    const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId);
    expect(session).toBeTruthy();
    expect(session.userId).toBe('user-1');
    expect(session.ip).toBe('127.0.0.1');
    expect(session.userAgent).toBe('test-agent');
  });

  it('evicts oldest session when exceeding max', async () => {
    for (let i = 0; i < 12; i++) {
      await createSession('user-1', '127.0.0.1', `agent-${i}`);
    }

    const sessions = db.prepare('SELECT * FROM sessions WHERE userId = ?').all('user-1');
    expect(sessions.length).toBeLessThanOrEqual(10);
  });
});

describe('updateSessionActivity', () => {
  it('updates lastActivity timestamp', async () => {
    const sessionId = await createSession('user-1', '127.0.0.1', 'test');
    const before = db.prepare('SELECT lastActivity FROM sessions WHERE id = ?').get(sessionId);

    await new Promise(r => setTimeout(r, 10));
    await updateSessionActivity(sessionId);

    const after = db.prepare('SELECT lastActivity FROM sessions WHERE id = ?').get(sessionId);
    expect(new Date(after.lastActivity).getTime()).toBeGreaterThan(new Date(before.lastActivity).getTime());
  });
});

describe('checkSessionActivity', () => {
  it('returns session if within idle and absolute limits', async () => {
    const sessionId = await createSession('user-1', '127.0.0.1', 'test');
    const result = await checkSessionActivity(sessionId, 60);
    expect(result).toBeTruthy();
    expect(result.id).toBe(sessionId);
  });

  it('returns null and deletes session if idle timeout exceeded', async () => {
    const sessionId = await createSession('user-1', '127.0.0.1', 'test');
    db.prepare('UPDATE sessions SET lastActivity = ? WHERE id = ?')
      .run(new Date(Date.now() - 120 * 60000).toISOString(), sessionId);

    const result = await checkSessionActivity(sessionId, 30);
    expect(result).toBeNull();

    const deleted = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId);
    expect(deleted).toBeUndefined();
  });

  it('returns null for non-existent session', async () => {
    const result = await checkSessionActivity('non-existent', 30);
    expect(result).toBeNull();
  });
});

describe('getSessionsByUserId', () => {
  it('returns all sessions for a user', async () => {
    await createSession('user-1', '127.0.0.1', 'agent-1');
    await createSession('user-1', '10.0.0.1', 'agent-2');

    const sessions = await getSessionsByUserId('user-1');
    expect(sessions.length).toBe(2);
  });
});

describe('getSessionById', () => {
  it('returns session for valid id', async () => {
    const sessionId = await createSession('user-1', '127.0.0.1', 'test');
    const session = await getSessionById(sessionId);
    expect(session).toBeTruthy();
    expect(session.id).toBe(sessionId);
  });

  it('returns null for non-existent id', async () => {
    const session = await getSessionById('non-existent');
    expect(session).toBeNull();
  });
});

describe('deleteSession', () => {
  it('deletes session by id', async () => {
    const sessionId = await createSession('user-1', '127.0.0.1', 'test');
    await deleteSession(sessionId);

    const found = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId);
    expect(found).toBeUndefined();
  });
});

describe('deleteAllUserSessions', () => {
  it('deletes all sessions for a user', async () => {
    await createSession('user-1', '127.0.0.1', 'agent-1');
    await createSession('user-2', '127.0.0.1', 'agent-2');

    await deleteAllUserSessions('user-1');

    const user1Sessions = db.prepare('SELECT * FROM sessions WHERE userId = ?').all('user-1');
    expect(user1Sessions.length).toBe(0);

    const user2Sessions = db.prepare('SELECT * FROM sessions WHERE userId = ?').all('user-2');
    expect(user2Sessions.length).toBe(1);
  });
});
