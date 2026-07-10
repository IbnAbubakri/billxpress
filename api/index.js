import { promises as dns } from 'dns';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

import app from '../server/src/app.js';
import { initDatabase } from '../server/src/utils/db.js';
import { migrateFromJSON } from '../server/src/utils/migrate.js';
import seed from '../server/src/seed.js';

let ready = false;
let readyPromise = null;

export default async function handler(req, res) {
  // --- DNS diagnostics (runs without init) ---
  if (req.url?.startsWith('/api/debug')) {
    const url = process.env.DATABASE_URL || '';
    const hostname = url ? new URL(url).hostname : 'none';
    let addresses = [];
    let dnsErr = null;
    try { addresses = await dns.resolve4(hostname); }
    catch (e4) {
      try { addresses = await dns.resolve6(hostname); }
      catch (e6) { dnsErr = e4.code + ' / ' + e6.code; }
    }
    const pgOk = (() => { try { require.resolve('pg'); return true; } catch { return false; } })();
    return res.json({
      urlPrefix: url.slice(0, 30) || 'not set',
      hostname,
      addresses,
      dnsError: dnsErr,
      pgOk,
      node: process.version,
      cwd: process.cwd(),
      hasServerDir: require('fs').existsSync('/var/task/server'),
    });
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
