// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateCsrf } from '../middleware/csrf.middleware.js';
import {
  handleGetStats, handleGetRevenueChart, handleGetServiceDistribution,
  handleGetAdminTransactions, handleGetAdminUsers, handleGetAnalytics,
} from '../controllers/admin.controller.js';

const router = Router();

import AppError from '../utils/AppError.js';

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 100,
  standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many admin requests. Please wait.' },
});

router.use(adminLimiter);
router.use(authenticate);
router.use((req, res, next) => {
  if (req.user?.role !== 'admin') return next(new AppError('Admin access required.', 403));
  next();
});

router.get('/stats', validateCsrf, handleGetStats);
router.get('/revenue-chart', validateCsrf, handleGetRevenueChart);
router.get('/service-distribution', validateCsrf, handleGetServiceDistribution);
router.get('/transactions', validateCsrf, handleGetAdminTransactions);
router.get('/users', validateCsrf, handleGetAdminUsers);
router.get('/analytics', validateCsrf, handleGetAnalytics);

export default router;