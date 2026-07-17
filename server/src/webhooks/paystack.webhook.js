// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import { verifyWebhookSignature } from '../services/paystack.service.js';
import { creditWallet } from '../services/wallet.service.js';
import logger from '../utils/logger.js';

export async function handlePaystackWebhook(req, res, next) {
  try {
    const rawBody = req.rawBody;
    const signature = req.headers['x-paystack-signature'];

    if (!verifyWebhookSignature(rawBody, signature)) {
      logger.warn('Invalid Paystack webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = req.body;
    const { event: eventType, data } = event;

    logger.info({ eventType, reference: data?.reference }, 'Paystack webhook received');

    if (eventType === 'charge.success') {
      await processSuccessfulPayment(data);
    }

    res.sendStatus(200);
  } catch (error) {
    logger.error({ error }, 'Webhook processing error');
    if (!res.headersSent) {
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }
}

async function processSuccessfulPayment(data) {
  const { reference } = data;
  await creditWallet(reference, data);
}
