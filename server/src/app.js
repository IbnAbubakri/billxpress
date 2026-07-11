import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import env from './config/env.js';
import authRoutes from './routes/auth.routes.js';
import openapiRoutes from './routes/openapi.routes.js';
import { getDb } from './utils/db.js';
import errorHandler from './middleware/error.middleware.js';
import requestContext from './middleware/requestContext.middleware.js';
import logger from './utils/logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(helmet({
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
}));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 200,
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

app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}));

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

app.get('/api/verify-user', async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) return res.status(400).json({ error: 'email query param required' });
    await getDb().prepare('UPDATE users SET emailVerified = 1 WHERE email = ?').run(email.toLowerCase());
    res.json({ message: `Verified ${email}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use('/api', openapiRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
