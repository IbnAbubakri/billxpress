import app from './app.js';
import env from './config/env.js';
import logger from './utils/logger.js';
import { initDatabase } from './utils/db.js';
import { migrateFromJSON } from './utils/migrate.js';
import seed from './seed.js';

await initDatabase();
await migrateFromJSON();

app.listen(env.PORT, async () => {
  await seed();
  logger.info(`Server running on http://localhost:${env.PORT} [${env.NODE_ENV}]`);
});
