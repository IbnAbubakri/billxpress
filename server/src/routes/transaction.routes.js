// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../middleware/auth.middleware.js';
import { handleGetTransactions } from '../controllers/transaction.controller.js';

const router = Router();

const transactionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 100,
  standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many transaction requests. Please wait.' },
});

router.get('/', transactionLimiter, authenticate, handleGetTransactions);

export default router;
