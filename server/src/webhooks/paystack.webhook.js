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
  const { reference, amount, status, paid_at, channel, metadata } = data;
  const db = getDb();

  const existing = await db.prepare(
    'SELECT id FROM wallet_funding_transactions WHERE paystack_reference = ?'
  ).get(reference);

  if (existing) {
    logger.info({ reference }, 'Payment already processed');
    return;
  }

  const userId = metadata?.user_id;
  if (!userId) {
    logger.error({ reference }, 'Missing user_id in metadata');
    return;
  }

  const amountInNaira = amount / 100;

  await db.transaction(async (tx) => {
    await tx.run(
      `INSERT INTO wallet_funding_transactions
       (user_id, paystack_reference, amount, currency, status, payment_method, gateway_response, paid_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      userId, reference, amountInNaira, 'NGN', 'completed', channel, 'Successful', paid_at
    );

    await tx.run(
      'UPDATE users SET balance = balance + ?, updatedAt = ? WHERE id = ?',
      amountInNaira, new Date().toISOString(), userId
    );

    await tx.run(
      `INSERT INTO transactions (userId, type, amount, status, description, recipient, date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      userId, 'wallet_funding', amountInNaira, 'completed',
      `Wallet Funding via ${channel}`, 'Self', paid_at
    );
  });

  logger.info({ reference, userId, amount: amountInNaira }, 'Payment processed successfully');
}
