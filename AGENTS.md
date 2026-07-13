# Summary

## Live URL
`https://billxpress1.vercel.app/` - Vercel auto-deploys from `main` branch.

## Build & Deploy
```bash
npm run build && git add -A && git commit -m "..." && git push
```
Run tests: `npx vitest run server/src/__tests__/` (63 tests across 4 files)

## Database
- Supabase PG in `eu-west-1`. Connection: `aws-0-{SUPABASE_REGION}.pooler.supabase.com:6543`
- `db.js` rewrites Supabase hosts to pooler, `initDatabase()` creates all tables
- All queries use `$N` positional params (PG compat layer in `db.js`)
- `db.transaction(callback)` wraps work in BEGIN/COMMIT with `SELECT ... FOR UPDATE`
- Test DB: `test-db.js` wraps `better-sqlite3` in same API as PG compat; strips `FOR UPDATE`

## Architecture
- **Backend**: Express serverless on Vercel (`api/index.js`). Routes in `server/src/routes/`, controllers in `server/src/controllers/`
- **Frontend**: React 19 + Vite 5 + TanStack Query v5 + Tailwind 3
- **State**: auth data in localStorage with 1hr TTL; API calls for everything else
- **Charts**: Recharts

## Key Files
- `api/index.js` - Vercel entry point; exports `cleanup()` calling `closeDb()`
- `server/src/utils/db.js` - PG pool, host rewrite, schema init, `transaction()`, `closeDb()`
- `server/src/services/auth.service.js` - auth queries; `checkHIBP()` calls external API
- `server/src/middleware/auth.middleware.js` - session validation
- `server/src/controllers/auth.controller.js` - `handleLogout` clears cookies via `clearAuthCookies()`
- `server/src/controllers/wallet.controller.js` - `handleFundWallet`/`handleWithdraw` use `db.transaction()`
- `server/src/__tests__/test-db.js` - `better-sqlite3` compat layer with `transaction`, strips `FOR UPDATE`
- `src/hooks/useAuth.ts` - auth state + mutations
- `src/api/client.ts` - API client with CSRF handling, shared `createRetryInterceptor`
- `src/components/admin/` - AdminDashboard, Analytics, UserManagement, TransactionManagement, AdminProfile, PricingControl
- `src/components/ui/TransactionChart.tsx` - Weekly spending bar chart
- `src/components/ui/SpendingChart.tsx` - Monthly spending area chart
- `src/components/modals/FundWalletModal.tsx` - Wallet funding
- `src/components/modals/WithdrawModal.tsx` - Withdrawals

## Audit Items Addressed (Batch 1 — prior)
| ID | Fix | Files |
|---|---|---|
| C-1 | Wallet race condition — PG transactions + `FOR UPDATE` | wallet.controller.js, db.js, test-db.js |
| C-2 | CSRF + rate limiting on admin routes | admin.routes.js |
| C-4 | `deleteAccount` uses correct `id` param | auth.service.js |
| C-7 | Admin rate limiting | admin.routes.js |
| B-1 | Remove unused imports, fix regex escapes | AdminDashboard.tsx, UserManagement.tsx, AdminProfile.tsx, LoginPage.tsx |
| B-2 | Test infrastructure — SQLite compat layer | test-db.js, auth.service.test.js |
| B-4 | README outdated | README.md |
| M-1 | Profile field regex guard | auth.service.js |
| M-2 | Delete dead `fileStore.js` | fileStore.js |
| M-4 | CSP via Helmet | app.js |
| M-6 | Password validation sync (12 char + complexity) | validation.ts, auth.service.js |
| M-7 | Pool cleanup on Vercel | db.js, api/index.js |
| L-1 | Deduplicate axios interceptors | client.ts |
| — | Logout missing cookie clear | auth.controller.js |
| — | Stray `}` syntax error in db.js | db.js |
| — | Vercel rewrite removed broken static rule | vercel.json |

## Audit Items Addressed (Batch 2 — notice.md)
| ID | Fix | Files |
|---|---|---|
| S-2 | `Math.random()` → `crypto.randomInt()` for OTP | auth.service.js |
| S-3 | Uniform 200ms delay on `/check-phone` to prevent timing enumeration | auth.service.js |
| S-4 | HIBP failure logs warning instead of throwing 503 | auth.service.js |
| S-5 | Early email duplicate check via `/check-email` endpoint before final step | auth.service.js, auth.controller.js, auth.routes.js, client.ts, useAuth.ts, RegisterPage.tsx |
| S-6 | Remove `emailVerified = 1` side effect from `resetPassword` | auth.service.js |
| U-1 | Paste handler on OTP inputs | RegisterPage.tsx |
| U-2 | Remove empty string at index 0 in password strength segment lookup | RegisterPage.tsx |
| U-3 | ProfileCompletion re-prompt after 24h (timestamp instead of boolean) | ProfileCompletion.tsx |
| U-4 | SetPinModal sets `sessionStorage` after success, catches errors | SetPinModal.tsx |
| U-5 | Empty catch blocks now surface errors to user | ProfileCompletion.tsx, BasicInfoModal.tsx, BankDetailsModal.tsx |
| U-6 | Renamed `email_verified` → `resend_verification` analytics event | ProfileCompletion.tsx |
| C-1 | LoginPage uses shared `validateEmail` from `validation.ts` | LoginPage.tsx |
| C-2 | LoginPage uses `getErrorMessage()` helper | LoginPage.tsx |
| C-3 | `validateName` rejects numbers/special characters | validation.ts |
| C-4 | Phone input shows "🇳🇬 +234" prefix | RegisterPage.tsx |
| C-5 | Renamed `_setOtpDebugCode` → `setOtpDebugCode` | RegisterPage.tsx |

## Session Summary (Jul 13 — Authentication.md audit Batch 4)
| ID | Fix | Files |
|---|---|---|
| H-2 | CSRF token rotation after sensitive operations (password change, MFA, PIN) | `csrf.middleware.js`, `auth.controller.js` |
| M-1 | `optionalAuth` logs at `warn` level instead of `debug` | `auth.middleware.js` |
| M-2 | Absolute session age (24h) enforcement in `checkSessionActivity` | `token.service.js` |
| M-3 | Parallelized bcrypt password history checks via `Promise.all` | `auth.service.js` |
| M-6 | Account lockout now logs via `logAction` with severity `critical` (instead of stub email) | `auth.service.js` |
| L-1 | `checkPhone` returns `hasEmail: false` to prevent enumeration | `auth.service.js` |
| L-4 | Rate limiter (30/15min) on `/me` endpoint | `auth.routes.js` |
| L-5 | Changed `localStorage` → `sessionStorage` for auth cache | `useAuth.ts` |

Skipped: H-1 (intentional tradeoff for mobile users), M-4 (OTP debug kept visible by design), M-5 (already improved), L-2 (SameSite already set), L-3 (timing difference minimal).

## API Endpoints (authenticated)
| Endpoint | Purpose |
|---|---|
| `GET /api/admin/stats` | Dashboard stats (users, revenue, success rate) |
| `GET /api/admin/revenue-chart` | Monthly revenue trend |
| `GET /api/admin/service-distribution` | Transaction type breakdown |
| `GET /api/admin/transactions` | All transactions with user info |
| `GET /api/admin/users` | All users |
| `GET /api/admin/analytics` | Daily performance, service stats, user growth |
| `POST /api/wallet/fund` | Fund wallet (body: `amount`, `method`) |
| `POST /api/wallet/withdraw` | Withdraw (body: `amount`, `bank`, `accountNumber`, `accountName`) |
| `GET /api/charts/weekly` | Weekly transaction amounts by day |
| `GET /api/charts/monthly` | Monthly spending by month |
| `GET /api/transactions` | Authenticated user's transactions |
