import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  handleGetStats, handleGetRevenueChart, handleGetServiceDistribution,
  handleGetAdminTransactions, handleGetAdminUsers, handleGetAnalytics,
} from '../controllers/admin.controller.js';

const router = Router();

import AppError from '../utils/AppError.js';

router.use(authenticate);
router.use((req, res, next) => {
  if (req.user?.role !== 'admin') return next(new AppError('Admin access required.', 403));
  next();
});

router.get('/stats', handleGetStats);
router.get('/revenue-chart', handleGetRevenueChart);
router.get('/service-distribution', handleGetServiceDistribution);
router.get('/transactions', handleGetAdminTransactions);
router.get('/users', handleGetAdminUsers);
router.get('/analytics', handleGetAnalytics);

export default router;