import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from './utils/db.js';
import logger from './utils/logger.js';

const SALT_ROUNDS = 12;
const DEMO_EMAIL = 'demo@billxpress.com';

export default async function seed() {
  const db = getDb();
  const existing = await db.prepare('SELECT id FROM users WHERE email = ?').get(DEMO_EMAIL);
  if (existing) return;

  const now = new Date().toISOString();
  const hashedPassword = await bcrypt.hash('DemoXy7!kqmn92', SALT_ROUNDS);

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
    uuidv4(),
    DEMO_EMAIL,
    hashedPassword,
    'Abubakri Faaruq',
    '09061345507',
    250000.50,
    '22334455667',
    '0123456789',
    'GTBank',
    'Abubakri Faaruq',
    '42 Marina Road',
    'Lagos Island',
    'Lagos',
    'Nigeria',
    '15 Bode Thomas Street',
    'Surulere',
    'Lagos',
    '101283',
    '',
    now,
    now,
    now,
  );

  const adminPassword = await bcrypt.hash('Admin@123Xpress', SALT_ROUNDS);
  await db.prepare(`
    INSERT INTO users (id, email, password, role, emailVerified, createdAt, passwordChangedAt, passwordHistory)
    VALUES (?, ?, ?, 'admin', 1, ?, ?, '[]')
  `).run(uuidv4(), 'admin@billxpress.com', adminPassword, now, now);

  logger.info({ email: DEMO_EMAIL }, 'Seeded demo user');
  logger.info({ email: 'admin@billxpress.com' }, 'Seeded admin user');
}
