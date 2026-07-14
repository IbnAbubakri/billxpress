// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import { getDb } from '../utils/db.js';
import { verifyWebhookSignature } from '../services/paystack.service.js';
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

    res.sendStatus(200);

    if (eventType === 'charge.success') {
      await processSuccessfulPayment(data);
    }
  } catch (error) {
    logger.error({ error }, 'Webhook processing error');
  }
}

async function processSuccessfulPayment(data) {
  const { reference, amount, paid_at, channel, metadata, id: paystackTransactionId } = data;
  const db = getDb();
  const amountInNaira = amount / 100;
  const paidAtDate = paid_at || new Date().toISOString();
  const userId = metadata?.user_id;

  if (!userId) {
    logger.error({ reference }, 'Missing user_id in metadata');
    return;
  }

  await db.transaction(async (tx) => {
    const existing = await tx.get(
      'SELECT id, status, amount, paystack_transaction_id FROM wallet_funding_transactions WHERE paystack_reference = ? FOR UPDATE',
      reference
    );

    if (existing && existing.status === 'completed') {
      logger.info({ reference }, 'Payment already processed');
      return;
    }

    if (existing && paystackTransactionId && existing.paystack_transaction_id) {
      if (Number(existing.paystack_transaction_id) === paystackTransactionId) {
        logger.info({ reference, paystackTransactionId }, 'Duplicate webhook event — already processed');
        return;
      }
    }

    if (existing && Number(existing.amount) !== amountInNaira) {
      logger.error({ reference, expected: existing.amount, received: amountInNaira }, 'Amount mismatch in webhook');
      return;
    }

    if (existing) {
      await tx.run(
        `UPDATE wallet_funding_transactions SET status = ?, payment_method = ?, gateway_response = ?, paid_at = ?, paystack_transaction_id = ? WHERE id = ?`,
        'completed', channel, 'Successful', paidAtDate, paystackTransactionId, existing.id
      );
    } else {
      await tx.run(
        `INSERT INTO wallet_funding_transactions
         (user_id, paystack_reference, amount, currency, status, payment_method, gateway_response, paid_at, paystack_transaction_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        userId, reference, amountInNaira, 'NGN', 'completed', channel, 'Successful', paidAtDate, paystackTransactionId
      );
    }

    await tx.run(
      'UPDATE users SET balance = balance + ?, updatedAt = ? WHERE id = ?',
      amountInNaira, new Date().toISOString(), userId
    );

    await tx.run(
      `INSERT INTO transactions (userId, type, amount, status, description, recipient, date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      userId, 'wallet_funding', amountInNaira, 'completed',
      `Wallet Funding via ${channel}`, 'Self', paidAtDate
    );
  });

  logger.info({ reference, userId, amount: amountInNaira }, 'Payment processed successfully');
}
