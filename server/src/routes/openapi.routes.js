// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import { Router } from 'express';
import env from '../config/env.js';
import openapiSpec from '../openapi.js';

const router = Router();

router.get('/openapi.json', (req, res) => {
  // The API spec must never be served publicly. Require the master secret
  // everywhere except local development, and fail closed when it is missing
  // (previously an unset MASTER_SECRET exposed the full spec to anyone).
  if (!env.isDev()) {
    const masterSecret = env.MASTER_SECRET;
    const authHeader = req.headers.authorization;
    if (!masterSecret || !authHeader || !authHeader.startsWith('Bearer ') || authHeader.slice(7) !== masterSecret) {
      return res.status(404).json({ error: 'Not found.' });
    }
  }
  res.json(openapiSpec);
});

export default router;
