import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { loadJSON, saveJSON } from './utils/fileStore.js';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import logger from './utils/logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const USERS_PATH = resolve(__dirname, '../data/users.json');
const SALT_ROUNDS = 12;

const DEMO_EMAIL = 'demo@billxpress.com';
const DEMO_PASSWORD = 'DemoXy7!kqmn92';

export default async function seed() {
  const users = loadJSON(USERS_PATH, []);
  if (users.some((u) => u.email === DEMO_EMAIL)) return;

  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, SALT_ROUNDS);
  const user = {
    id: uuidv4(),
    email: DEMO_EMAIL,
    password: hashedPassword,
    role: 'user',
    name: 'Abubakri Faaruq',
    phone: '+2348012345678',
    balance: 250000.50,
    hasTransactionPin: true,
    bvn: '22334455667',
    accountNumber: '0123456789',
    bankName: 'GTBank',
    accountName: 'Abubakri Faaruq',
    billingStreet: '42 Marina Road',
    billingCity: 'Lagos Island',
    billingState: 'Lagos',
    billingCountry: 'Nigeria',
    homeStreet: '15 Bode Thomas Street',
    homeCity: 'Surulere',
    homeState: 'Lagos',
    homeZip: '101283',
    avatar: '',
    createdAt: new Date().toISOString(),
    emailVerified: true,
    emailVerificationToken: null,
    emailVerificationExpires: null,
    mfaSecret: null,
    mfaEnabled: false,
    failedLoginAttempts: 0,
    lockedUntil: null,
    lastLogin: null,
    passwordHistory: [],
    passwordChangedAt: new Date().toISOString(),
  };
  users.push(user);

  const adminPassword = await bcrypt.hash('Admin@123Xpress', SALT_ROUNDS);
  const adminUser = {
    id: uuidv4(),
    email: 'admin@billxpress.com',
    password: adminPassword,
    role: 'admin',
    createdAt: new Date().toISOString(),
    emailVerified: true,
    emailVerificationToken: null,
    emailVerificationExpires: null,
    mfaSecret: null,
    mfaEnabled: false,
    failedLoginAttempts: 0,
    lockedUntil: null,
    lastLogin: null,
    passwordHistory: [],
    passwordChangedAt: new Date().toISOString(),
  };
  users.push(adminUser);

  saveJSON(USERS_PATH, users);
  logger.info({ email: DEMO_EMAIL }, 'Seeded demo user');
  logger.info({ email: 'admin@billxpress.com' }, 'Seeded admin user');
}
