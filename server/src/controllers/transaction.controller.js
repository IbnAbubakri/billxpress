// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import { getDb } from '../utils/db.js';

export async function handleGetTransactions(req, res, next) {
  try {
    const userId = req.user.id;
    const cursor = parseInt(req.query.cursor, 10) || null;
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const sql = cursor
      ? `SELECT id, type, amount, status, description, recipient, date FROM transactions WHERE userId = ? AND id < ? ORDER BY id DESC LIMIT ?`
      : `SELECT id, type, amount, status, description, recipient, date FROM transactions WHERE userId = ? ORDER BY id DESC LIMIT ?`;
    const txns = cursor
      ? await getDb().prepare(sql).all(userId, cursor, limit + 1)
      : await getDb().prepare(sql).all(userId, limit + 1);
    const hasMore = txns.length > limit;
    if (hasMore) txns.pop();
    const nextCursor = hasMore ? txns[txns.length - 1].id : null;
    res.json({ transactions: txns, nextCursor, hasMore });
  } catch (error) {
    next(error);
  }
}