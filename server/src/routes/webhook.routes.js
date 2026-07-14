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
    try {
      req.rawBody = req.body;
      req.body = JSON.parse(req.body.toString());
      next();
    } catch (err) {
      res.status(400).json({ error: 'Invalid JSON payload' });
    }
  },
  handlePaystackWebhook
);

export default router;
