// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import app from '../server/src/app.js';
import { initDatabase, closeDb } from '../server/src/utils/db.js';
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
      const body = { error: 'Server initialization failed' };
      if (process.env.NODE_ENV !== 'production') {
        body.detail = err.message;
        body.stack = err.stack?.split('\n').slice(0, 6).join('\n');
      }
      return res.status(500).json(body);
    }
  }
  app(req, res);
}

export async function cleanup() {
  if (ready) {
    await closeDb();
    ready = false;
    readyPromise = null;
  }
}
