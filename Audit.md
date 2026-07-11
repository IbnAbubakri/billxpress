# 360 Audit Report — BillXpress

**App**: BillXpress (VTU & Digital Services Platform)
**Live**: https://billxpress1.vercel.app/
**Stack**: React 19 + Vite 5 + TanStack Query v5 + Tailwind 3 | Express 4 + PostgreSQL (Supabase)

---

## CRITICAL — Security

| # | Issue | Location | Severity |
|---|---|---|---|
| 1 | **Balance race condition** — Wallet fund/withdraw uses `balance + ?` / `balance - ?` without DB transactions or row locks. Two concurrent requests can overspend or double-fund. | `server/src/controllers/wallet.controller.js:32,77` | **Critical** |
| 2 | **No CSRF on admin routes** — Admin GET/POST routes (stats, transactions, users, analytics) lack `validateCsrf` middleware. Only auth and wallet routes have CSRF protection. | `server/src/routes/admin.routes.js` | **Critical** |
| 3 | **OTP returned in API response** — In demo mode (`!SMS_PROVIDER`), the OTP code is sent back in the JSON response body, visible in network logs and browser history. | `server/src/services/auth.service.js:637-638` | **High** |
| 4 | **`deleteAccount` references wrong variable** — Line 575 uses `user.id` (undefined) instead of `id`, causing a ReferenceError at runtime. | `server/src/services/auth.service.js:575` | **High** |
| 5 | **No admin authorization on wallet/transaction mutation** — Any authenticated user can fund/withdraw. The `wallet/fund` endpoint has no KYC or payment gateway integration — it just adds balance directly. | `server/src/controllers/wallet.controller.js:21-43` | **High** |
| 6 | **`ssl: { rejectUnauthorized: false }`** — Disables SSL certificate verification on the database connection. Acceptable for Supabase pooler but risky if `DATABASE_URL` changes. | `server/src/utils/db.js:28` | **Medium** |
| 7 | **No rate limiting on admin endpoints** — Admin routes have no per-route rate limiters. An attacker with admin access could scrape all data. | `server/src/routes/admin.routes.js` | **Medium** |

---

## HIGH — Bugs & Test Failures

| # | Issue | Location |
|---|---|---|
| 1 | **6 ESLint errors** — Unused imports in `AdminDashboard.tsx`, `AdminProfile.tsx`, `UserManagement.tsx`; regex escape issues in `LoginPage.tsx`. | `src/components/admin/*.tsx`, `src/components/auth/LoginPage.tsx:16-17` |
| 2 | **25 test failures, 3 unhandled errors** — Tests fail due to `SQLite3 can only bind numbers, strings...` (test DB is SQLite but app uses PG), `user.id` ReferenceError in `deleteAccount`, and stale test data. | `server/src/__tests__/auth.service.test.js` |
| 3 | **`seed.js` hardcodes demo passwords** — `DemoXy7!kqmn92` and `Admin@123Xpress` are committed in source. Demo mode auto-creates these accounts. | `server/src/seed.js:33,57` |
| 4 | **README outdated** — States "React 18", "SQLite", "mock auth, no backend" but app now uses React 19, PostgreSQL, and real JWT auth. | `README.md:9,38-46` |

---

## MEDIUM — Architecture & Best Practices

| # | Issue | Detail |
|---|---|---|
| 1 | **No input sanitization on profile updates** — `updateUserProfile` accepts arbitrary fields from `req.body` and interpolates them into SQL. Only `allowedFields` are written, but the field names themselves aren't validated against injection. | `server/src/services/auth.service.js:460-481` |
| 2 | **`fileStore.js` is dead code** — The file-based JSON store (`loadJSON`/`saveJSON`) is imported nowhere after the PG migration. Can be removed. | `server/src/utils/fileStore.js` |
| 3 | **`convertSql` only handles `?` → `$N`** — The SQLite-to-PG compatibility layer is minimal. If any query uses named parameters or complex SQL, it will break silently. | `server/src/utils/db.js:191-194` |
| 4 | **No `helmet` `contentSecurityPolicy`** — CSP is not configured, leaving the app open to XSS via injected scripts. | `server/src/app.js:24-26` |
| 5 | **`validateCsrf` uses `req.cookies`** — This requires `cookie-parser` to have already parsed cookies. It works but is fragile; if middleware order changes, CSRF breaks silently. | `server/src/middleware/csrf.middleware.js:24` |
| 6 | **Frontend validation mismatch** — `validatePassword` on frontend checks min 6 chars, but backend policy requires min 12 chars with complexity. Users can register on frontend and fail on backend. | `src/utils/validation.ts:8-10` vs `server/src/services/auth.service.js:17` |
| 7 | **No DB connection pooling cleanup on Vercel** — `api/index.js` reuses a module-level pool, but Vercel serverless functions may spawn multiple instances. No `pool.end()` on cold start. | `api/index.js` |
| 8 | **`@sentry/vite-plugin` may not have auth token** — `SENTRY_AUTH_TOKEN` env var may not be set in CI, causing build failures. The plugin has `disable` logic but Sentry React init still runs. | `vite.config.ts:107-112` |

---

## LOW — Code Quality

| # | Issue | Detail |
|---|---|---|
| 1 | **Duplicate error interceptors** — `api` and `walletApi` in `client.ts` have identical refresh-token retry logic. Should be a shared utility. | `src/api/client.ts:38-88` |
| 2 | **`toUser()` casts everything** — The `toUser` function in `useAuth.ts` manually casts every field. Could use Zod or shared types for validation. | `src/hooks/useAuth.ts:42-75` |
| 3 | **`shared/types.ts` not used in server** — Server uses plain JS. The TypeScript types exist but aren't enforced at the API boundary. | `shared/types.ts` |
| 4 | **`seed.js` runs in non-production only** — But the Vercel handler also calls `seed()`. If `NODE_ENV` isn't set on Vercel, seeds may run in production. | `api/index.js:16` vs `server/src/seed.js:23` |
| 5 | **No `.env.example` file** — New developers have no reference for required env vars. | — |
| 6 | **`react-window` imported but barely used** — Listed as dependency but transaction list has a `LIMIT 50` query. May be unused. | `package.json:28` |

---

## Recommendations (Priority Order)

1. **Wrap wallet operations in DB transactions** with `SELECT ... FOR UPDATE` to prevent race conditions
2. **Add CSRF to admin routes** or use SameSite=Strict cookies consistently
3. **Fix `deleteAccount` bug** (line 575: `user.id` → `id`)
4. **Remove OTP from API response** in demo mode or at minimum don't log it
5. **Sync frontend/backend password validation** — both should use the same policy (min 12, complexity)
6. **Add CSP headers** via Helmet
7. **Fix the 25 failing tests** — they reference SQLite patterns that don't work with PG
8. **Clean up dead code** (`fileStore.js`)
9. **Add `.env.example`** with all required variables
10. **Update README** to reflect current stack
