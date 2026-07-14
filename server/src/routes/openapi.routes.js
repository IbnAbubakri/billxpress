// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import { Router } from 'express';
import openapiSpec from '../openapi.js';

const router = Router();

router.get('/openapi.json', (_req, res) => {
  res.json(openapiSpec);
});

export default router;
