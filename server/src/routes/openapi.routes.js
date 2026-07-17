// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import { Router } from 'express';
import env from '../config/env.js';
import openapiSpec from '../openapi.js';

const router = Router();

router.get('/openapi.json', (req, res) => {
  if (env.MASTER_SECRET) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.slice(7) !== env.MASTER_SECRET) {
      return res.status(404).json({ error: 'Not found.' });
    }
  }
  res.json(openapiSpec);
});

export default router;
