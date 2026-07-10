import { promises as dns } from 'dns';
import app from '../server/src/app.js';
import { initDatabase } from '../server/src/utils/db.js';
import { migrateFromJSON } from '../server/src/utils/migrate.js';
import seed from '../server/src/seed.js';

let ready = false;
let readyPromise = null;

export default async function handler(req, res) {
  // --- DNS diagnostics (no DB needed) ---
  if (req.url?.startsWith('/api/debug')) {
    const regions = ['us-west-1', 'us-east-1', 'eu-west-1', 'eu-central-1', 'ap-southeast-1', 'ap-northeast-1', 'sa-east-1'];
    const poolerResults = {};
    for (const r of regions) {
      const h = `aws-0-${r}.pooler.supabase.com`;
      try { poolerResults[r] = (await dns.resolve4(h)).slice(0, 2); }
      catch { poolerResults[r] = null; }
    }
    return res.json({ poolerResults });
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
