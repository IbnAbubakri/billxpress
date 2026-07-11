import app from '../server/src/app.js';
import { initDatabase } from '../server/src/utils/db.js';
import { migrateFromJSON } from '../server/src/utils/migrate.js';
import seed from '../server/src/seed.js';

let ready = false;
let readyPromise = null;

export default async function handler(req, res) {
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
