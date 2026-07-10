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
        await initDatabase();
        await migrateFromJSON();
        await seed();
        ready = true;
      })();
    }
    await readyPromise;
  }
  app(req, res);
}
