import app from '../server/src/app.js';
import seed from '../server/src/seed.js';

let seeded = false;
let seeding = null;

export default async function handler(req, res) {
  if (!seeded) {
    if (!seeding) seeding = seed().catch((err) => { console.error('Seed failed:', err); seeded = true; });
    await seeding;
    seeded = true;
  }
  app(req, res);
}
