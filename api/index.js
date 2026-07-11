import { promises as dns } from 'dns';
import pg from 'pg';
import app from '../server/src/app.js';
import { initDatabase } from '../server/src/utils/db.js';
import { migrateFromJSON } from '../server/src/utils/migrate.js';
import seed from '../server/src/seed.js';

let ready = false;
let readyPromise = null;

function getPoolerUrl(dbUrl) {
  const u = new URL(dbUrl);
  const match = u.hostname.match(/^db\.(.+)\.supabase\.co$/);
  if (!match) return dbUrl;
  u.hostname = `aws-0-${process.env.SUPABASE_REGION || 'eu-west-1'}.pooler.supabase.com`;
  u.port = '6543';
  u.username = `${u.username}.${match[1]}`;
  return u.toString();
}

export default async function handler(req, res) {
  if (req.url === '/api/users' && req.method === 'GET') {
    const pool = new pg.Pool({ connectionString: getPoolerUrl(process.env.DATABASE_URL), ssl: { rejectUnauthorized: false } });
    try {
      const { rows } = await pool.query('SELECT id, email, phone, name, role, emailVerified, createdat FROM users ORDER BY createdat');
      return res.json({ users: rows });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    } finally {
      await pool.end();
    }
  }

  if (!ready) {
    if (!readyPromise) {
      readyPromise = (async () => {
        try {
          await initDatabase();
          await migrateFromJSON();
          await seed();
          ready = true;
        } catch (err) {
          readyPromise = null;
          throw err;
        }
      })();
    }
    try {
      await readyPromise;
    } catch (err) {
      return res.status(500).json({
        error: 'Server initialization failed',
        detail: err.message,
        stack: err.stack?.split('\n').slice(0, 6).join('\n'),
      });
    }
  }
  app(req, res);
}
