// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import { config } from 'dotenv';
import randomToken from '../utils/randomToken.js';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

config({ path: resolve(__dirname, '../../.env') });

function parseMs(s) {
  if (!s) return 7 * 24 * 60 * 60 * 1000;
  const m = s.match(/^(\d+)\s*(s|m|h|d)$/);
  if (!m) return 7 * 24 * 60 * 60 * 1000;
  const n = parseInt(m[1], 10);
  switch (m[2]) {
    case 's': return n * 1000;
    case 'm': return n * 60 * 1000;
    case 'h': return n * 60 * 60 * 1000;
    case 'd': return n * 24 * 60 * 60 * 1000;
    default: return 7 * 24 * 60 * 60 * 1000;
  }
}

const env = {
  PORT: parseInt(process.env.PORT, 10) || 4000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  JWT_REFRESH_EXPIRES_MS: parseMs(process.env.JWT_REFRESH_EXPIRES_IN || '7d'),
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  DATABASE_URL: process.env.DATABASE_URL,
  SUPABASE_REGION: process.env.SUPABASE_REGION || 'eu-west-1',
  DEMO_MODE: process.env.DEMO_MODE === 'true' || !process.env.SMS_PROVIDER,
  PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY,
  PAYSTACK_PUBLIC_KEY: process.env.PAYSTACK_PUBLIC_KEY,
  PAYSTACK_WEBHOOK_SECRET: process.env.PAYSTACK_WEBHOOK_SECRET,
  APP_URL: process.env.APP_URL || 'http://localhost:5173',
  isDev: () => env.NODE_ENV === 'development',
  isProd: () => env.NODE_ENV === 'production',
};

const DEFAULT_SECRET = 'change-this-to-a-long-random-string-in-production';
if (!env.JWT_SECRET || env.JWT_SECRET === DEFAULT_SECRET) {
  if (env.isProd()) {
    console.error('FATAL: JWT_SECRET must be set in production. Server cannot start safely.');
    process.exit(1);
  }
  env.JWT_SECRET = randomToken(32);
  console.warn('WARNING: JWT_SECRET is weak or default. Auto-generated a random secret for this session.');
}

export default env;
