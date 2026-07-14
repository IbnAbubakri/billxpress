// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate, optionalAuth } from '../middleware/auth.middleware.js';
import { validateCsrf } from '../middleware/csrf.middleware.js';
import {
  handleGetStats, handleGetRevenueChart, handleGetServiceDistribution,
  handleGetAdminTransactions, handleGetAdminUsers, handleGetAnalytics,
} from '../controllers/admin.controller.js';
import { handleCreateAdmin } from '../controllers/admin-create.controller.js';
import env from '../config/env.js';
import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';

const router = Router();

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 100,
  standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many admin requests. Please wait.' },
});

const createAdminLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, max: 5,
  standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many admin creation attempts. Please try again later.' },
});

router.use(adminLimiter);

router.post('/create', createAdminLimiter, optionalAuth, (req, res, next) => {
  const masterKey = req.headers['x-master-key'];

  if (masterKey && env.MASTER_SECRET && masterKey === env.MASTER_SECRET) {
    logger.info('Admin creation authorized via master key');
    return handleCreateAdmin(req, res, next);
  }

  if (req.user?.role === 'admin') {
    logger.info({ adminId: req.user.id }, 'Admin creation authorized via JWT');
    return handleCreateAdmin(req, res, next);
  }

  return next(new AppError('Unauthorized. Provide a valid X-Master-Key header or authenticate as an admin.', 403));
});

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