// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import { getDb } from '../utils/db.js';
import logger from '../utils/logger.js';
import { logAction } from '../services/audit.service.js';
import { memoize } from '../utils/cache.js';

const fetchStats = memoize(async () => {
  const db = getDb();
  return db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM users) as totalUsers,
      (SELECT COUNT(*) FROM transactions) as totalTransactions,
      (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE amount > 0 AND status = 'completed') as totalRevenue,
      (SELECT
        CASE WHEN COUNT(*) > 0
          THEN ROUND(100.0 * SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) / COUNT(*), 1)
          ELSE 0
        END
      FROM transactions) as successRate
  `).get();
}, 30);

export async function handleGetStats(req, res, next) {
  try {
    const row = await fetchStats();
    await logAction({ userId: req.user.id, action: 'ADMIN_STATS_VIEWED', details: {}, ip: req.clientIp, userAgent: req.clientUA });
    res.json({
      stats: {
        totalUsers: Number(row.totalusers),
        totalTransactions: Number(row.totaltransactions),
        totalRevenue: Number(row.totalrevenue),
        successRate: parseFloat(row.successrate),
      },
    });
  } catch (err) {
    next(err);
  }
}

const fetchRevenueChart = memoize(async () => {
  const db = getDb();
  return db.prepare(`
    SELECT substr(date, 1, 7) as month,
      COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as revenue,
      COUNT(*) as transactions
    FROM transactions
    GROUP BY substr(date, 1, 7)
    ORDER BY month
  `).all();
}, 60);

const fetchServiceDistribution = memoize(async () => {
  const db = getDb();
  return db.prepare(`
    SELECT
      CASE
        WHEN type = 'airtime' THEN 'Airtime'
        WHEN type = 'data' THEN 'Data'
        WHEN type = 'electricity' THEN 'Electricity'
        WHEN type = 'tv' THEN 'Cable TV'
        ELSE 'Others'
      END as name,
      COUNT(*) as value
    FROM transactions
    GROUP BY name
    ORDER BY value DESC
  `).all();
}, 60);

export async function handleGetRevenueChart(req, res, next) {
  try {
    const data = await fetchRevenueChart();
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function handleGetServiceDistribution(req, res, next) {
  try {
    const data = await fetchServiceDistribution();
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function handleGetAdminTransactions(req, res, next) {
  try {
    const db = getDb();
    const cursor = parseInt(req.query.cursor, 10) || null;
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));

    const sql = cursor
      ? `SELECT t.id, u.name as user_name, u.email as user_email,
           t.description as service, t.type as service_type, t.amount,
           t.status, t.date as created_at
         FROM transactions t
         JOIN users u ON u.id = t.userId
         WHERE t.id < ?
         ORDER BY t.id DESC
         LIMIT ?`
      : `SELECT t.id, u.name as user_name, u.email as user_email,
           t.description as service, t.type as service_type, t.amount,
           t.status, t.date as created_at
         FROM transactions t
         JOIN users u ON u.id = t.userId
         ORDER BY t.id DESC
         LIMIT ?`;

    const rows = cursor
      ? await db.prepare(sql).all(cursor, limit + 1)
      : await db.prepare(sql).all(limit + 1);
    const hasMore = rows.length > limit;
    if (hasMore) rows.pop();
    const nextCursor = hasMore ? rows[rows.length - 1].id : null;

    res.json({
      transactions: rows,
      nextCursor,
      hasMore,
      pagination: { limit },
    });
  } catch (err) {
    next(err);
  }
}

export async function handleGetAdminUsers(req, res, next) {
  try {
    const db = getDb();
    const cursor = req.query.cursor || null;
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));

    let cursorCreatedAt, cursorId;
    if (cursor) {
      const parts = cursor.split('|');
      cursorCreatedAt = parts[0];
      cursorId = parts[1] || '';
    }

    const sql = cursorCreatedAt
      ? `SELECT id, name, email, phone, balance, role,
           createdAt as joined_date, lastLogin as last_login
         FROM users
         WHERE (createdAt < ?) OR (createdAt = ? AND id < ?)
         ORDER BY createdAt DESC, id DESC
         LIMIT ?`
      : `SELECT id, name, email, phone, balance, role,
           createdAt as joined_date, lastLogin as last_login
         FROM users
         ORDER BY createdAt DESC, id DESC
         LIMIT ?`;

    const users = cursorCreatedAt
      ? await db.prepare(sql).all(cursorCreatedAt, cursorCreatedAt, cursorId, limit + 1)
      : await db.prepare(sql).all(limit + 1);
    const hasMore = users.length > limit;
    if (hasMore) users.pop();
    const nextCursor = hasMore ? `${users[users.length - 1].joined_date}|${users[users.length - 1].id}` : null;

    res.json({
      users,
      nextCursor,
      hasMore,
      pagination: { limit },
    });
  } catch (err) {
    next(err);
  }
}

const fetchAnalytics = memoize(async () => {
  const db = getDb();
  const [daily, serviceStats, userGrowth] = await Promise.all([
    db.prepare(`
      SELECT substr(date, 1, 10) as day,
        COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as revenue,
        COUNT(*) as transactions
      FROM transactions
      GROUP BY substr(date, 1, 10)
      ORDER BY day
    `).all(),
    db.prepare(`
      SELECT type as service, COUNT(*) as transactions,
        COALESCE(SUM(amount), 0) as revenue
      FROM transactions
      GROUP BY type
      ORDER BY revenue DESC
    `).all(),
    db.prepare(`
      SELECT substr(createdAt, 1, 7) as month, COUNT(*) as new_users
      FROM users
      GROUP BY substr(createdAt, 1, 7)
      ORDER BY month
    `).all(),
  ]);
  return { daily, serviceStats, userGrowth };
}, 60);

export async function handleGetAnalytics(req, res, next) {
  try {
    const data = await fetchAnalytics();
    res.json(data);
  } catch (err) {
    next(err);
  }
}