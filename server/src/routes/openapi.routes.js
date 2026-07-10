import { Router } from 'express';
import openapiSpec from '../openapi.js';

const router = Router();

router.get('/openapi.json', (_req, res) => {
  res.json(openapiSpec);
});

export default router;
