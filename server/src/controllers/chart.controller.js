import { getDb } from '../utils/db.js';

export async function handleGetWeeklySummary(req, res) {
  const db = getDb();
  const userId = req.user.id;
  const rows = await db.prepare(`
    SELECT EXTRACT(DOW FROM date::timestamp) as day_idx,
      COALESCE(SUM(ABS(amount)), 0) as amount
    FROM transactions
    WHERE userId = ? AND date > NOW() - INTERVAL '7 days'
    GROUP BY EXTRACT(DOW FROM date::timestamp)
    ORDER BY day_idx
  `).all(userId);
  res.json({ data: rows });
}

export async function handleGetMonthlySummary(req, res) {
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
}