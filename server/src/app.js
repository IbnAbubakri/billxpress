// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import env from './config/env.js';
import authRoutes from './routes/auth.routes.js';
import transactionRoutes from './routes/transaction.routes.js';
import adminRoutes from './routes/admin.routes.js';
import walletRoutes from './routes/wallet.routes.js';
import chartRoutes from './routes/chart.routes.js';
import openapiRoutes from './routes/openapi.routes.js';
import webhookRoutes from './routes/webhook.routes.js';
import errorHandler from './middleware/error.middleware.js';
import requestContext from './middleware/requestContext.middleware.js';
import { cache } from './middleware/cache.middleware.js';
import { getDb } from './utils/db.js';
import logger from './utils/logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(helmet({
  xContentTypeOptions: { nosniff: true },
  xFrameOptions: { action: 'deny' },
  xXssProtection: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'"],
      connectSrc: ["'self'", "https://billxpress1.vercel.app", "https://*.sentry.io"],
      frameSrc: ["'none'"],
      frameAncestors: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
}));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 100,
  standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many requests. Please wait before trying again.' },
});
app.use('/api', globalLimiter);

app.use((req, res, next) => {
  req.setTimeout(30000, () => {
    if (!res.headersSent) res.status(408).json({ error: 'Request timeout.' });
  });
  next();
});

const CORS_ORIGIN = (() => {
  if (!env.isProd()) return env.CORS_ORIGIN;
  const localhostPattern = /^https?:\/\/localhost(:\d+)?$/;
  if (localhostPattern.test(env.CORS_ORIGIN)) {
    logger.warn('CORS_ORIGIN is set to a localhost URL. Falling back to APP_URL in production.');
    return env.APP_URL;
  }
  return env.CORS_ORIGIN;
})();

app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
}));

app.use('/api/webhook', webhookRoutes);

app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use(requestContext);

app.use((req, res, next) => {
  if (env.isProd() && req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(`https://${req.hostname}${req.url}`);
  }
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/charts', chartRoutes);
app.use('/api', openapiRoutes);

app.get('/api/health', cache(30), async (req, res) => {
  const checks = { database: false, paystack: !!env.PAYSTACK_SECRET_KEY };
  try {
    const db = getDb();
    await db.prepare('SELECT 1').get();
    checks.database = true;
  } catch {}
  const status = checks.database && checks.paystack ? 'ok' : 'degraded';
  res.json({ status, checks, timestamp: new Date().toISOString() });
});

if (env.isProd()) {
  const distPath = resolve(__dirname, '../../dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found.' });
    res.sendFile(resolve(distPath, 'index.html'));
  });
} else {
  app.use((req, res) => {
    res.status(404).json({ error: 'Not found.' });
  });
}

app.use(errorHandler);

export default app;
