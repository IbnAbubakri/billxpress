// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { handleGetWeeklySummary, handleGetMonthlySummary } from '../controllers/chart.controller.js';

const router = Router();

router.use(authenticate);
router.get('/weekly', handleGetWeeklySummary);
router.get('/monthly', handleGetMonthlySummary);

export default router;