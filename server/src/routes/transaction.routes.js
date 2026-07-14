// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { handleGetTransactions } from '../controllers/transaction.controller.js';

const router = Router();

router.get('/', authenticate, handleGetTransactions);

export default router;