// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from './utils/db.js';
import logger from './utils/logger.js';

const SALT_ROUNDS = 12;
const DEMO_EMAIL = 'demo@billxpress.com';

const DEMO_TRANSACTIONS = [
  { type: 'wallet_funding', amount: 50000, status: 'completed', description: 'Wallet Funding via Bank Transfer', recipient: 'Self', date: '2026-07-06T09:20:00Z' },
  { type: 'airtime', amount: -500, status: 'completed', description: 'MTN Airtime Purchase - ₦500', recipient: '08035792046', date: '2026-07-05T06:42:00Z' },
  { type: 'data', amount: -1500, status: 'completed', description: 'Glo 2GB Data Bundle', recipient: '08035792046', date: '2026-07-04T15:45:00Z' },
  { type: 'tv', amount: -12400, status: 'pending', description: 'DStv Premium Subscription - Jul', recipient: 'DSTV/123456789', date: '2026-07-03T14:15:00Z' },
  { type: 'electricity', amount: -5000, status: 'failed', description: 'IKEDC Prepaid Meter', recipient: 'MTR/IK/4782910345', date: '2026-07-02T11:30:00Z' },
  { type: 'education', amount: -4700, status: 'completed', description: 'JAMB Registration Fee', recipient: 'JAMB/REG/AB/67291', date: '2026-06-30T16:20:00Z' },
  { type: 'betting', amount: -5000, status: 'completed', description: 'Bet9ja Wallet Funding', recipient: 'BET9JA/ACCT/89012', date: '2026-06-28T13:45:00Z' },
  { type: 'airtime_to_cash', amount: 3400, status: 'completed', description: 'Airtime to Cash - MTN', recipient: 'Self', date: '2026-06-26T12:10:00Z' },
  { type: 'wallet_funding', amount: 20000, status: 'completed', description: 'Wallet Funding via Card', recipient: 'Self', date: '2026-06-25T10:05:00Z' },
  { type: 'airtime', amount: -200, status: 'completed', description: 'Airtel Airtime Purchase', recipient: '08035792046', date: '2026-06-24T07:15:00Z' },
];

export default async function seed() {
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production') {
    logger.info('Skipping seed in production');
    return;
  }

  const db = getDb();

  const existingUser = await db.prepare('SELECT id FROM users WHERE email = ?').get(DEMO_EMAIL);
  if (!existingUser) {
    const now = new Date().toISOString();
    const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD || 'DemoXy7!kqmn92';
    const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, SALT_ROUNDS);

    const id = uuidv4();
    await db.prepare(`
      INSERT INTO users (id, email, password, role, name, phone, balance,
        hasTransactionPin, bvn, accountNumber, bankName, accountName,
        billingStreet, billingCity, billingState, billingCountry,
        homeStreet, homeCity, homeState, homeZip, avatar,
        emailVerified, createdAt, lastLogin, passwordChangedAt,
        passwordHistory)
      VALUES (?, ?, ?, 'user', ?, ?, ?,
        1, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        1, ?, ?, ?,
        '[]')
    `).run(
      id, DEMO_EMAIL, hashedPassword, 'Abubakri Faaruq', '09061345507', 250000.50,
      '22334455667', '0123456789', 'GTBank', 'Abubakri Faaruq',
      '42 Marina Road', 'Lagos Island', 'Lagos', 'Nigeria',
      '15 Bode Thomas Street', 'Surulere', 'Lagos', '101283', '',
      now, now, now,
    );

    const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'Admin@123Xpress';
    const adminPassword = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);
    await db.prepare(`
      INSERT INTO users (id, email, password, role, name, phone, emailVerified, createdAt, passwordChangedAt, passwordHistory)
      VALUES (?, ?, ?, 'admin', ?, ?, 1, ?, ?, '[]')
    `).run(uuidv4(), 'admin@billxpress.com', adminPassword, 'Admin User', '+2348000000000', now, now);

    logger.info({ email: DEMO_EMAIL }, 'Seeded demo user');
    logger.info({ email: 'admin@billxpress.com' }, 'Seeded admin user');
  }

  const demoUser = await db.prepare('SELECT id FROM users WHERE email = ?').get(DEMO_EMAIL);
  if (demoUser) {
    const existingTxn = await db.prepare('SELECT id FROM transactions WHERE userId = ? LIMIT 1').get(demoUser.id);
    if (!existingTxn) {
      for (const txn of DEMO_TRANSACTIONS) {
        await db.prepare(
          'INSERT INTO transactions (userId, type, amount, status, description, recipient, date) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).run(demoUser.id, txn.type, txn.amount, txn.status, txn.description, txn.recipient, txn.date);
      }
      logger.info({ userId: demoUser.id, count: DEMO_TRANSACTIONS.length }, 'Seeded demo transactions');
    }
  }
}