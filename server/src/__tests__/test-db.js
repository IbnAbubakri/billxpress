// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import Database from 'better-sqlite3';

function createCompat(raw) {
  const stmtCache = {};
  function prepare(sql) {
    if (stmtCache[sql]) return stmtCache[sql];
    const stmt = {
      get: (...params) => {
        const row = raw.prepare(sql).get(...params);
        return row || undefined;
      },
      all: (...params) => raw.prepare(sql).all(...params),
      run: (...params) => {
        const info = raw.prepare(sql).run(...params);
        return { changes: info.changes };
      },
    };
    stmtCache[sql] = stmt;
    return stmt;
  }
  function makeTx(rawTx) {
    return {
      get(sql, ...params) {
        const cleaned = sql.replace(/\s+FOR\s+UPDATE\s*$/i, '');
        const row = rawTx.prepare(cleaned).get(...params);
        return row || undefined;
      },
      run(sql, ...params) {
        const info = rawTx.prepare(sql).run(...params);
        return { changes: info.changes };
      },
    };
  }
  return {
    prepare,
    async transaction(callback) {
      raw.exec('BEGIN');
      try {
        const tx = makeTx(raw);
        const result = await callback(tx);
        raw.exec('COMMIT');
        return result;
      } catch (err) {
        raw.exec('ROLLBACK');
        throw err;
      }
    },
    exec(sql) {
      raw.exec(sql);
      return { changes: 0 };
    },
  };
}

export function createTestDb() {
  const raw = new Database(':memory:');
  raw.pragma('journal_mode = WAL');
  raw.pragma('foreign_keys = ON');

  raw.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      name TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      balance NUMERIC(12,2) DEFAULT 0,
      hasTransactionPin INTEGER DEFAULT 0,
      transactionPin TEXT DEFAULT '',
      bvn TEXT DEFAULT '',
      accountNumber TEXT DEFAULT '',
      bankName TEXT DEFAULT '',
      accountName TEXT DEFAULT '',
      billingStreet TEXT DEFAULT '',
      billingCity TEXT DEFAULT '',
      billingState TEXT DEFAULT '',
      billingCountry TEXT DEFAULT '',
      homeStreet TEXT DEFAULT '',
      homeCity TEXT DEFAULT '',
      homeState TEXT DEFAULT '',
      homeZip TEXT DEFAULT '',
      avatar TEXT DEFAULT '',
      dateOfBirth TEXT DEFAULT '',
      gender TEXT DEFAULT '',
      nin TEXT DEFAULT '',
      nextOfKin TEXT DEFAULT '{}',
      employmentStatus TEXT DEFAULT '',
      annualIncome TEXT DEFAULT '',
      emailVerified INTEGER DEFAULT 0,
      emailVerificationToken TEXT,
      emailVerificationExpires TEXT,
      mfaSecret TEXT,
      mfaEnabled INTEGER DEFAULT 0,
      mfaBackupCodes TEXT DEFAULT '[]',
      createdAt TEXT NOT NULL,
      updatedAt TEXT,
      lastLogin TEXT,
      failedLoginAttempts INTEGER DEFAULT 0,
      lockedUntil TEXT,
      passwordHistory TEXT DEFAULT '[]',
      passwordChangedAt TEXT,
      resetToken TEXT,
      resetTokenExpires TEXT
    );

    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT UNIQUE NOT NULL,
      userId TEXT NOT NULL,
      expiresAt TEXT NOT NULL,
      createdAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      lastActivity TEXT NOT NULL,
      ip TEXT,
      userAgent TEXT,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS login_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      count INTEGER DEFAULT 0,
      lastAttempt TEXT,
      lockedUntil TEXT,
      ips TEXT DEFAULT '[]',
      createdAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      userId TEXT,
      action TEXT NOT NULL,
      details TEXT DEFAULT '{}',
      ip TEXT,
      userAgent TEXT,
      severity TEXT DEFAULT 'info'
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT NOT NULL,
      type TEXT NOT NULL,
      amount NUMERIC(12,2) NOT NULL,
      status TEXT NOT NULL DEFAULT 'completed',
      description TEXT DEFAULT '',
      recipient TEXT DEFAULT '',
      date TEXT NOT NULL,
      createdAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS otps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT NOT NULL,
      code TEXT NOT NULL,
      expiresAt TEXT NOT NULL,
      verified INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now')),
      usedAt TEXT
    );
  `);

  raw.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
    CREATE INDEX IF NOT EXISTS idx_refresh_tokens_userId ON refresh_tokens(userId);
    CREATE INDEX IF NOT EXISTS idx_sessions_userId ON sessions(userId);
    CREATE INDEX IF NOT EXISTS idx_login_attempts_key ON login_attempts(key);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
    CREATE INDEX IF NOT EXISTS idx_users_resetToken ON users(resetToken);
    CREATE INDEX IF NOT EXISTS idx_users_emailVerificationToken ON users(emailVerificationToken);
    CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
    CREATE INDEX IF NOT EXISTS idx_otps_phone ON otps(phone);
    CREATE INDEX IF NOT EXISTS idx_transactions_userId ON transactions(userId);
    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
  `);

  return createCompat(raw);
}