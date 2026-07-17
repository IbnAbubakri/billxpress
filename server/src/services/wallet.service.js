import { getDb } from '../utils/db.js';
import logger from '../utils/logger.js';

export async function creditWallet(reference, data) {
  const { amount, paid_at, channel, id: paystackTransactionId, metadata } = data;
  const db = getDb();
  const userId = metadata?.user_id;
  const amountInNaira = amount / 100;
  const paidAtDate = paid_at || new Date().toISOString();

  if (!userId) {
    logger.error({ reference }, 'Missing user_id in metadata');
    return { credited: false, existing: false };
  }

  let result;
  await db.transaction(async (tx) => {
    const existing = await tx.get(
      'SELECT id, status, amount, paystack_transaction_id FROM wallet_funding_transactions WHERE paystack_reference = ? FOR UPDATE',
      reference
    );

    if (existing && existing.status === 'completed') {
      result = { credited: false, existing: true };
      return;
    }

    if (existing && paystackTransactionId && existing.paystack_transaction_id) {
      if (Number(existing.paystack_transaction_id) === paystackTransactionId) {
        result = { credited: false, existing: true };
        return;
      }
    }

    if (existing && Number(existing.amount) !== amountInNaira) {
      logger.error({ reference, expected: existing.amount, received: amountInNaira }, 'Amount mismatch in wallet credit');
      result = { credited: false, existing: true };
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

    result = { credited: true, existing: false };
  });

  if (result.credited) {
    logger.info({ reference, userId, amount: amountInNaira }, 'Wallet credited successfully');
  }

  return result;
}
