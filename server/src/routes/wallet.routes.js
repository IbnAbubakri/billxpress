import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { handleFundWallet, handleWithdraw } from '../controllers/wallet.controller.js';

const router = Router();

router.use(authenticate);
router.post('/fund', handleFundWallet);
router.post('/withdraw', handleWithdraw);

export default router;