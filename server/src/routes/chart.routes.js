// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../middleware/auth.middleware.js';
import { handleGetWeeklySummary, handleGetMonthlySummary } from '../controllers/chart.controller.js';

const router = Router();

const chartLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 30,
  standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many chart requests. Please wait before trying again.' },
});

router.use(authenticate);
router.get('/weekly', chartLimiter, handleGetWeeklySummary);
router.get('/monthly', chartLimiter, handleGetMonthlySummary);

export default router;