import { getDb } from '../utils/db.js';

export async function handleGetStats(req, res) {
  const db = getDb();
  const totalUsers = await db.prepare('SELECT COUNT(*) as count FROM users').get();
  const totalTransactions = await db.prepare('SELECT COUNT(*) as count FROM transactions').get();
  const revenue = await db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE amount > 0 AND status = 'completed'").get();
  const successCount = await db.prepare("SELECT COUNT(*) as count FROM transactions WHERE status = 'completed'").get();
  const totalCount = await db.prepare('SELECT COUNT(*) as count FROM transactions').get();
  const successRate = totalCount.count > 0 ? ((successCount.count / totalCount.count) * 100).toFixed(1) : '0';
  res.json({
    stats: {
      totalUsers: Number(totalUsers.count),
      totalTransactions: Number(totalTransactions.count),
      totalRevenue: Number(revenue.total),
      successRate: parseFloat(successRate),
    },
  });
}

export async function handleGetRevenueChart(req, res) {
  const db = getDb();
  const rows = await db.prepare(`
    SELECT substr(date, 1, 7) as month,
      COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as revenue,
      COUNT(*) as transactions
    FROM transactions
    GROUP BY substr(date, 1, 7)
    ORDER BY month
  `).all();
  res.json({ data: rows });
}

export async function handleGetServiceDistribution(req, res) {
  const db = getDb();
  const rows = await db.prepare(`
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
  res.json({ data: rows });
}

export async function handleGetAdminTransactions(req, res) {
  const db = getDb();
  const rows = await db.prepare(`
    SELECT t.id, u.name as user_name, u.email as user_email,
      t.description as service, t.type as service_type, t.amount,
      t.status, t.date as created_at
    FROM transactions t
    JOIN users u ON u.id = t.userId
    ORDER BY t.date DESC
    LIMIT 50
  `).all();
  res.json({ transactions: rows });
}

export async function handleGetAdminUsers(req, res) {
  const db = getDb();
  const users = await db.prepare(`
    SELECT id, name, email, phone, balance, role,
      createdAt as joined_date, lastLogin as last_login
    FROM users ORDER BY createdAt DESC
  `).all();
  res.json({ users });
}

export async function handleGetAnalytics(req, res) {
  const db = getDb();
  const daily = await db.prepare(`
    SELECT substr(date, 1, 10) as day,
      COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as revenue,
      COUNT(*) as transactions
    FROM transactions
    GROUP BY substr(date, 1, 10)
    ORDER BY day
  `).all();
  const serviceStats = await db.prepare(`
    SELECT type as service, COUNT(*) as transactions,
      COALESCE(SUM(amount), 0) as revenue
    FROM transactions
    GROUP BY type
    ORDER BY revenue DESC
  `).all();
  const userGrowth = await db.prepare(`
    SELECT substr(createdAt, 1, 7) as month, COUNT(*) as new_users
    FROM users
    GROUP BY substr(createdAt, 1, 7)
    ORDER BY month
  `).all();
  res.json({ daily, serviceStats, userGrowth });
}