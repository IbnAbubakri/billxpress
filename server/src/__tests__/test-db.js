import Database from 'better-sqlite3';

export function createTestDb() {
  const db = new Database(':memory:');
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      name TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      balance REAL DEFAULT 0,
      hasTransactionPin INTEGER DEFAULT 0,
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
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
    CREATE INDEX IF NOT EXISTS idx_refresh_tokens_userId ON refresh_tokens(userId);
    CREATE INDEX IF NOT EXISTS idx_sessions_userId ON sessions(userId);
    CREATE INDEX IF NOT EXISTS idx_login_attempts_key ON login_attempts(key);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
    CREATE INDEX IF NOT EXISTS idx_users_resetToken ON users(resetToken);
    CREATE INDEX IF NOT EXISTS idx_users_emailVerificationToken ON users(emailVerificationToken);
  `);

  return db;
}
