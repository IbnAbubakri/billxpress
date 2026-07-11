import pg from 'pg';
import logger from './logger.js';

let pool = null;

function supabasePoolerUrl(dbUrl) {
  const u = new URL(dbUrl);
  // Only rewrite if it's a direct Supabase host (*.supabase.co)
  const match = u.hostname.match(/^db\.(.+)\.supabase\.co$/);
  if (!match) return dbUrl;
  const projectRef = match[1];
  const region = process.env.SUPABASE_REGION || 'eu-west-1';
  u.hostname = `aws-0-${region}.pooler.supabase.com`;
  u.port = '6543';
  u.username = `${u.username}.${projectRef}`;
  return u.toString();
}

function createPool() {
  const dbUrl = supabasePoolerUrl(process.env.DATABASE_URL);
  if (!dbUrl) throw new Error('DATABASE_URL not set');
  pool = new pg.Pool({
    connectionString: dbUrl,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    ssl: { rejectUnauthorized: false },
  });
}

function ensurePool() {
  if (!pool) throw new Error('Database not initialized. Call initDatabase() first.');
}

export async function initDatabase() {
  await createPool();
  await pool.query(`
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
      id SERIAL PRIMARY KEY,
      token TEXT UNIQUE NOT NULL,
      userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expiresAt TEXT NOT NULL,
      createdAt TEXT DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      createdAt TEXT NOT NULL,
      lastActivity TEXT NOT NULL,
      ip TEXT,
      userAgent TEXT
    );
    CREATE TABLE IF NOT EXISTS login_attempts (
      id SERIAL PRIMARY KEY,
      key TEXT UNIQUE NOT NULL,
      count INTEGER DEFAULT 0,
      lastAttempt TEXT,
      lockedUntil TEXT,
      ips TEXT DEFAULT '[]',
      createdAt TEXT DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY,
      timestamp TEXT NOT NULL,
      userId TEXT,
      action TEXT NOT NULL,
      details TEXT DEFAULT '{}',
      ip TEXT,
      userAgent TEXT,
      severity TEXT DEFAULT 'info'
    );
    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'completed',
      description TEXT DEFAULT '',
      recipient TEXT DEFAULT '',
      date TEXT NOT NULL,
      createdAt TEXT DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS otps (
      id SERIAL PRIMARY KEY,
      phone TEXT NOT NULL,
      code TEXT NOT NULL,
      expiresAt TEXT NOT NULL,
      verified INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT NOW(),
      usedAt TEXT
    );
  `);

  await pool.query(`
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

  logger.info('Database initialized (PostgreSQL)');
}

function convertSql(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

function mapRow(row) {
  if (!row || typeof row !== 'object') return row;
  const out = {};
  for (const key of Object.keys(row)) {
    out[key] = row[key];
  }
  return out;
}

const compat = {
  prepare(sql) {
    ensurePool();
    const pgSql = convertSql(sql);
    return {
      get: (...params) => pool.query(pgSql, params).then(r => r.rows[0] ? mapRow(r.rows[0]) : undefined),
      all: (...params) => pool.query(pgSql, params).then(r => r.rows.map(mapRow)),
      run: (...params) => pool.query(pgSql, params).then(r => ({ changes: r.rowCount })),
    };
  },
  exec(sql) {
    ensurePool();
    return pool.query(sql).then(r => ({ changes: r.rowCount }));
  },
};

export function getDb() {
  return compat;
}

export async function closeDb() {
  if (pool) await pool.end();
}

export default compat;
