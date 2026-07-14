// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import { Router } from 'express';
import express from 'express';
import { handlePaystackWebhook } from '../webhooks/paystack.webhook.js';

const router = Router();

router.post(
  '/paystack',
  express.raw({ type: 'application/json' }),
  (req, res, next) => {
    req.rawBody = req.body;
    req.body = JSON.parse(req.body.toString());
    next();
  },
  handlePaystackWebhook
);

export default router;
