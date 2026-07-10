import { createRequire } from 'module';
const require = createRequire(import.meta.url);

export default function handler(req, res) {
  let pgOk = false;
  try {
    require.resolve('pg');
    pgOk = true;
  } catch {}
  res.json({
    ok: true,
    pgAvailable: pgOk,
    databaseUrl: process.env.DATABASE_URL ? 'set (' + process.env.DATABASE_URL.slice(0, 30) + '...)' : 'not set',
    node: process.version,
  });
}
