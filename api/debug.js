import { promises as dns } from 'dns';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

export default async function handler(req, res) {
  const url = process.env.DATABASE_URL || '';
  const hostname = url ? new URL(url).hostname : 'none';
  let addresses = [];
  let err = null;
  try {
    addresses = await dns.resolve4(hostname);
  } catch (e4) {
    try {
      addresses = await dns.resolve6(hostname);
    } catch (e6) {
      err = e4.code + ' / ' + e6.code;
    }
  }

  const pgOk = (() => {
    try { require.resolve('pg'); return true; } catch { return false; }
  })();

  res.json({
    urlPrefix: url.slice(0, 30) || 'not set',
    hostname,
    addresses,
    dnsError: err,
    pgOk,
    node: process.version,
    cwd: process.cwd(),
    hasServerDir: require('fs').existsSync('/var/task/server'),
    envKeys: Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('SUPABASE')),
  });
}
