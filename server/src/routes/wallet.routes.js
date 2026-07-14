import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateCsrf } from '../middleware/csrf.middleware.js';
import { handleFundWallet, handleWithdraw, handleInitializeFunding, handleVerifyFunding } from '../controllers/wallet.controller.js';

const router = Router();

const walletLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10,
  standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many wallet operations. Please wait before trying again.' },
});

const initializationLimiter = rateLimit({
  windowMs: 60 * 1000, max: 5,
  standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many initialization attempts. Please wait.' },
});

router.get('/fund/verify', handleVerifyFunding);

router.use(authenticate);

router.post('/fund/initialize', initializationLimiter, validateCsrf, handleInitializeFunding);
router.post('/fund', walletLimiter, validateCsrf, handleFundWallet);
router.post('/withdraw', walletLimiter, validateCsrf, handleWithdraw);

export default router;