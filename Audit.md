# 360 Audit: BillXpress (FintechApp)

## 🔴 CRITICAL — Security Issues

### 1. Seed credentials in source code
`server/src/seed.js` contains hardcoded passwords (`DemoXy7!kqmn92`, `Admin@123Xpress`). If the DB is compromised or seed runs in production, these are attack vectors. Consider generating random passwords on seed.

### 2. SQLite data files committed to repo
`server/data/` contains `users.json`, `sessions.json`, `refresh-tokens.json`, `login-attempts.json`, and `billxpress.db`. These likely contain real credentials/hashes. Should be gitignored.

### 3. No password hashing cost tuning
Using bcrypt with 12 rounds — good, but `transactionPin` (4-digit PIN) uses the same cost. A 4-digit PIN with bcrypt 12 is still brute-forceable (~10k combinations). Consider hashing PINs with a higher cost or using a different strategy.

### 4. JWT in httpOnly cookies — missing SameSite attribute
Verify that `Set-Cookie` for access/refresh tokens includes `SameSite=Strict` or `SameSite=Lax`. The CSRF double-submit pattern is good, but cookie attributes matter.

### 5. No rate limiting on `/api/auth/refresh`
Token refresh endpoint has no rate limit. An attacker with a stolen refresh token can rotate it indefinitely.

---

## 🟠 HIGH — Architecture & Code Quality

### 6. Database compatibility layer is technical debt
`db.js` wraps `pg.Pool` to mimic `better-sqlite3` API. This adds complexity, obscures query intent, and prevents using PostgreSQL-native features (transactions, returning clauses, CTEs). Should migrate to direct `pg` queries.

### 7. Text-based timestamps everywhere
All timestamp columns (`createdAt`, `updatedAt`, `lastLogin`, `lockedUntil`, `expiresAt`) are `TEXT` type. This prevents proper date queries, indexing, and timezone handling. Migrate to `TIMESTAMPTZ`.

### 8. No database migrations system
Using manual `schema_migrations` table with ad-hoc checks. Consider using a proper migration tool (node-pg-migrate, drizzle-kit, or prisma migrate).

### 9. Mixed JS/TS
Backend is pure JavaScript (`server/src/`), frontend is TypeScript. Shared types in `shared/types.ts` but backend doesn't consume them. This creates type safety gaps at the API boundary.

### 10. Monolithic auth service
`auth.service.js` is 659 lines handling registration, login, password reset, MFA, sessions, and audit logging. Should be split into focused services.

---

## 🟡 MEDIUM — Performance & Reliability

### 11. No connection pooling tuning
Using Supabase pooler but no explicit pool size configuration. Default `pg.Pool` is 10 connections. For Vercel serverless, cold starts each create a new pool — consider connection pooling externally (Supabase handles this, but worth verifying).

### 12. React Query config: no retries
`staleTime: 5 * 60 * 1000` with `retry: false` means any transient network error shows failure immediately. Consider `retry: 1` for non-mutating queries.

### 13. No optimistic updates for wallet balance
Funding/withdrawing requires a full page refetch. Optimistic updates would improve UX.

### 14. Lazy loading without Suspense boundaries
Routes use `React.lazy()` but the `Suspense` fallback is a full-page `LoadingScreen`. Consider skeleton loaders for better perceived performance.

### 15. Audit log rotation at 10K entries
`audit.service.js` archives after 10K entries. For a fintech app, audit logs should be immutable and retained for compliance (7+ years). Consider forwarding to an external logging service (Datadog, CloudWatch, etc.).

---

## 🟡 MEDIUM — Testing

### 16. No test runner in CI for E2E
`ci.yml` runs vitest but not Playwright. E2E tests exist but aren't automated.

### 17. No integration tests with real DB
Backend tests mock the database. Critical paths (wallet funding, transaction creation) should have integration tests against a test database.

### 18. No frontend E2E for critical flows
Playwright only tests auth. Missing: wallet funding, airtime purchase, admin actions.

---

## 🔵 LOW — Compliance & Best Practices

### 19. No BVN/NIN validation endpoint
Profile collects BVN and NIN but there's no verification against NIBSS/NIMC APIs. For a real fintech, this is a CBN requirement.

### 20. No transaction receipts/emails
Transactions complete silently. Users should receive email/SMS confirmations for audit trail.

### 21. No idempotency keys on wallet operations
Double-submitting fund/withdraw could create duplicate transactions. Add idempotency keys.

### 22. No webhook/signature verification for payment callbacks
If integrating with real payment providers (Paystack, Flutterwave), you'll need webhook signature verification.

### 23. Missing `.env.example` completeness
Frontend `.env.example` only has `SENTRY_DSN` and `API_BASE_URL`. Should document all required env vars.

### 24. PWA offline support is limited
Service worker uses NetworkFirst for API calls — if offline, API calls fail. Consider queueing mutations for later sync.

---

## Summary Scorecard

| Area | Score | Notes |
|---|---|---|
| **Security** | 7/10 | Strong fundamentals (CSRF, rate limiting, HIBP, MFA), but seed creds and text timestamps are risks |
| **Architecture** | 6/10 | Solid stack, but compat layer and monolithic services need refactoring |
| **Performance** | 7/10 | Good (virtual scroll, lazy loading, PWA), missing optimistic updates |
| **Testing** | 5/10 | Good coverage breadth, but no E2E in CI, no real DB integration tests |
| **Compliance** | 4/10 | Missing BVN verification, idempotency, receipts — not production-ready for real fintech |
| **Overall** | **6/10** | Solid MVP/demo, needs hardening for production fintech use |
