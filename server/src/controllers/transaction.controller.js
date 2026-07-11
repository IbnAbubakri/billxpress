import { getDb } from '../utils/db.js';

export async function handleGetTransactions(req, res) {
  const userId = req.user.id;
  const txns = await getDb().prepare(
    'SELECT id, type, amount, status, description, recipient, date FROM transactions WHERE userId = ? ORDER BY date DESC LIMIT 50'
  ).all(userId);
  res.json({ transactions: txns });
}