// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

// Canonical camelCase column names for the schema. PostgreSQL folds UNQUOTED
// identifiers to lowercase (lockeduntil, hastransactionpin, mfasecret, ...),
// while SQLite preserves the case used in the DDL. Because the schema is built
// with unquoted camelCase identifiers, production rows arrive with lowercase
// keys and any camelCase read (row.lockedUntil) silently returns undefined —
// which disabled account lockout, reset-token expiry, password-history checks,
// the transaction-PIN gate and MFA. normalizeRow() restores the intended
// camelCase keys so both engines return identical objects.
//
// This module is deliberately dependency-free so it can be imported by both the
// production PG layer (db.js) and the SQLite test layer (test-db.js) without
// pulling in `pg`, and it is never mocked by the test suite.
export const CAMEL_CASE_COLUMNS = [
  'hasTransactionPin', 'transactionPin', 'accountNumber', 'bankName',
  'accountName', 'billingStreet', 'billingCity', 'billingState',
  'billingCountry', 'homeStreet', 'homeCity', 'homeState', 'homeZip',
  'dateOfBirth', 'nextOfKin', 'employmentStatus', 'annualIncome',
  'emailVerified', 'emailVerificationToken', 'emailVerificationExpires',
  'mfaSecret', 'mfaEnabled', 'mfaBackupCodes', 'createdAt', 'updatedAt',
  'lastLogin', 'failedLoginAttempts', 'lockedUntil', 'passwordHistory',
  'passwordChangedAt', 'resetToken', 'resetTokenExpires', 'userId',
  'expiresAt', 'lastActivity', 'userAgent', 'lastAttempt', 'usedAt',
  'paystackReference', 'paystackAccessCode', 'paystackTransactionId',
  'paymentMethod', 'gatewayResponse', 'paidAt',
  'requestBodyHash', 'responseStatus', 'responseBody',
];

const COLUMN_LOOKUP = Object.fromEntries(
  CAMEL_CASE_COLUMNS.map((c) => [c.toLowerCase(), c]),
);

export function normalizeRow(row) {
  if (!row || typeof row !== 'object') return row;
  const out = {};
  for (const key of Object.keys(row)) {
    out[key] = row[key];
    // Add the camelCase alias only when the identifier was folded to lowercase.
    if (key !== key.toLowerCase()) continue;
    const canonical = COLUMN_LOOKUP[key];
    if (canonical && out[canonical] === undefined) {
      out[canonical] = row[key];
    }
  }
  return out;
}
