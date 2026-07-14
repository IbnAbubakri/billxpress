// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import { getDb } from '../utils/db.js';

export async function handleGetWeeklySummary(req, res, next) {
  try {
    const db = getDb();
    const userId = req.user.id;
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const rows = await db.prepare(`
      SELECT EXTRACT(DOW FROM date::timestamptz) as day_idx,
        COALESCE(SUM(ABS(amount)), 0) as amount
      FROM transactions
      WHERE userId = ? AND date::timestamptz > ?::timestamptz
      GROUP BY EXTRACT(DOW FROM date::timestamptz)
      ORDER BY day_idx
    `).all(userId, weekAgo);
    res.json({ data: rows });
  } catch (error) {
    next(error);
  }
}

export async function handleGetMonthlySummary(req, res, next) {
  try {
    const db = getDb();
    const userId = req.user.id;
    const rows = await db.prepare(`
      SELECT substr(date, 1, 7) as month,
        COALESCE(SUM(ABS(amount)), 0) as spending
      FROM transactions
      WHERE userId = ? AND amount < 0
      GROUP BY substr(date, 1, 7)
      ORDER BY month
    `).all(userId);
    res.json({ data: rows });
  } catch (error) {
    next(error);
  }
}