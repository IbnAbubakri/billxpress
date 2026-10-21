# Summary

## Live URL
`https://billxpress1.vercel.app/` - Vercel auto-deploys from `main` branch.

## Build & Deploy
```bash
npm run build && git add -A && git commit -m "..." && git push
```
Run tests: `npx vitest run` (209 tests across 16 files)

## Production Environment Variables (Vercel)
Set these in Vercel Dashboard → Settings → Environment Variables (Production):

| Variable | Value / Source |
|---|---|
| `JWT_SECRET` | Generate: `openssl rand -hex 32` |
| `MASTER_SECRET` | Generate: `openssl rand -hex 32` |
| `DATABASE_URL` | Supabase connection string |
| `PAYSTACK_SECRET_KEY` | Paystack dashboard |
| `PAYSTACK_PUBLIC_KEY` | Paystack dashboard |
| `APP_URL` | `https://billxpress1.vercel.app` |
| `CORS_ORIGIN` | `https://billxpress1.vercel.app` |
| `NODE_ENV` | `production` |
| `SUPABASE_REGION` | `eu-west-1` |

The local `server/.env` is gitignored and only used for development. Never commit real secrets.

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

## Session Summary (Jul 21 — Withdraw flow redesign: account-first)

Withdraw now follows: **account number → bank → auto-resolved account name → amount → PIN**. The account name is fetched from Paystack `/bank/resolve` (no manual entry; blocked if it can't be verified).

| Area | Change | Files |
|---|---|---|
| Bank list | `GET /api/wallet/banks` proxies Paystack `/bank?country=nigeria` → `[{name, code}]` | `paystack.service.js` (`listBanks`), `wallet.controller.js` (`handleGetBanks`), `wallet.routes.js` |
| Name resolution | `GET /api/wallet/resolve-account?accountNumber=&bankCode=` proxies Paystack `/bank/resolve`; 422/404 → 404 "could not resolve" | `paystack.service.js` (`resolveAccountNumber`), `wallet.controller.js` (`handleResolveAccount`) |
| Frontend | Modal steps: account number + bank → name auto-resolves (read-only) → amount → PIN → success | `WithdrawModal.tsx`, `src/api/client.ts` (`getBanks`, `resolveAccountNumber`) |
| Tests | +6 (bank list mapping, empty list, name resolution, invalid account/bank, unresolved 404) | `server/src/__tests__/wallet.controller.test.js` |

Note: Paystack has no reverse lookup (account number → bank), so the bank is chosen from a dropdown; the name then resolves automatically.

## Session Summary (Jul 21 — Case-folding root cause + PIN + hardening)

**Root cause class**: DDL uses unquoted identifiers → Postgres folds them to lowercase (`lockeduntil`, `hastransactionpin`, `mfasecret`, `resetTokenExpires`, …), while SQLite preserved case so tests passed. Fixed centrally on the read side (Option B — no prod DB migration, no hand-quoting 99 SQL sites).

| Area | Fix | Files |
|---|---|---|
| Case-folding | Central `normalizeRow()` adds camelCase aliases for folded keys; used by `mapRow` in db.js and by the test SQLite layer | `server/src/utils/columnNames.js` (NEW), `server/src/utils/db.js`, `server/src/__tests__/test-db.js` |
| Regression guard | Folding regression test (lockedUntil) — verified to fail if the alias is removed | `server/src/__tests__/case-folding.regression.test.js` (NEW) |
| Cache | `memoize` keys namespaced by function id (no `"[]"` collisions); default TTL 60s | `server/src/utils/cache.js` |
| Seeding | Only when `SEED_DEMO_DATA==='true'` AND not Vercel/prod; no hardcoded creds | `server/src/seed.js` |
| OpenAPI | Fail closed: 404 unless `env.isDev()` or valid `MASTER_SECRET` | `server/src/routes/openapi.routes.js`, `server/src/__tests__/integration.test.js` |
| Proxy | `app.set('trust proxy', 1)` so rate-limit buckets use real client IP | `server/src/app.js` |
| CSRF cookie | `secure` now `env.isProd()` (dev over http works) | `server/src/middleware/csrf.middleware.js` |
| Idempotency | `user_id` captured at insert; completion finalized via `res.json`/`res.end` safety net (no stuck `pending` → 409) | `server/src/middleware/idempotency.middleware.js` |
| Token/OTP logging | Prod logs a warning instead of the token/OTP when no provider configured | `server/src/services/auth/authentication.js`, `registration.js` |
| PIN | Standardized on **6 digits** (backend authoritative); current-PIN required to change; withdraw now collects PIN | `SetPinModal.tsx`, `SecurityTab.tsx`, `ProfilePage.tsx`, `WithdrawModal.tsx`, `useAuth.ts` |
| Auth UX | Only 401/403 clears session (transient errors no longer log users out); logout `queryClient.clear()` | `src/hooks/useAuth.ts` |
| Withdraw | Server enforces ₦1,000 minimum | `server/src/controllers/wallet.controller.js` |
| Types/validation | `balance: number` (coerced); phone regex aligned front/back (prefix required) | `shared/types.ts`, `src/utils/validation.ts` |
| Route guard | `/wallet/fund/verify` wrapped in `ProtectedRoute` | `src/App.tsx` |

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

## Session Summary (Jul 13 — Authentication.md audit Batch 5)
| ID | Fix | Files |
|---|---|---|
| H-3 | Admin login pre-checks role before `authenticate()` to avoid clearing non-admin failed attempts | `auth.controller.js` |
| H-4 | Password change revokes all refresh tokens + sessions (like resetPassword does) | `auth.controller.js` |
| M-1 | `checkSessionActivity` returns session data, eliminating duplicate `getSessionById` query in middleware | `token.service.js`, `auth.middleware.js` |
| M-3 | Audit logged inside `deleteAccount` before deletion (preserves referential integrity) | `auth.service.js`, `auth.controller.js` |
| M-4 | Simplify `forgotLimiter` keyGenerator | `auth.routes.js` |
| M-5 | `sessionId` cookie maxAge reduced from 7d to 24h to match absolute session lifetime | `auth.controller.js` |
| L-1 | CSRF token lifetime reduced from 24h to 15min (matches access token expiry) | `csrf.middleware.js` |
| L-3 | `getPasswordPolicy` now returns `historySize` (5) and `expiryDays` (90) | `auth.service.js` |

Skipped: C-1 (deployment concern, not code), H-1 (intentional tradeoff for mobile users), H-2 (user requested OTP left on UI), M-2 (React auto-escapes), M-4 (already has IP fallback), L-2 (server-enforced), L-4 (negligible bcrypt timing).

## Session Summary (Jul 15 — Grid & Card anti-AI redesign)

| File | Change |
|---|---|
| `ServiceGrid.tsx` | Broke uniform card pattern: varied icon container shapes (rounded-xl/full/lg/2xl per card), distinct hover effects per card, animated chevron indicator on hover, colored top/bottom borders on alternating cards, dark mode color variants |
| `Dashboard.tsx` | Chart cards differentiated: Daily Transactions gets `border-l-4` accent, Bill Distribution gets `bg-slate-50` + border treatment instead of identical white cards |
| `LandingPage.tsx` | Feature cards: removed single `bg` field, added `featureVariants` with per-card icon shapes, hover behaviors, and accent borders; added "Get started →" reveal on hover. Stats grid: second card uses `bg-gradient-to-br from-slate-700 to-slate-900` dark gradient for visual contrast, alternating icon shapes |

Key principle from `frontend-design` skill: avoid uniform grid/card repetition, vary corner radii, hover effects, and decorative accents across otherwise similar components. ServiceGrid now has 7 visually distinct card styles instead of 7 clones with different colors.

## Session Summary (Jul 17 — Second Penetration Test — Batch 6)

| ID | Finding | Severity | Details |
|---|---|---|---|
| P-1 | **`env.isProd()` returns FALSE on Vercel — all production guards bypassed** | CRITICAL | `env.isProd()` checks `process.env.NODE_ENV === 'production'`, Vercel doesn't set `NODE_ENV`. All guards depending on it (C-3 DEMO_MODE, H-5 OpenAPI gate, JWT_SECRET fatal, MASTER_SECRET length check) are silent no-ops on production. Fix: use `process.env.VERCEL_ENV === 'production'` or `process.env.NODE_ENV !== 'development'` |
| P-2 | **Production runs in DEMO_MODE — OTP codes leak, no email verification** | CRITICAL | Confirmed via 3 tests: (1) `send-otp` returns `"code":"260839"` in response; (2) registration returns `emailVerified: true` without any verification; (3) leaked OTP verified successfully via `verify-otp`. Root cause: `env.DEMO_MODE = NODE_ENV !== 'production' && !SMS_PROVIDER`. Fix: add `NODE_ENV=production` to Vercel env vars, or remove `!env.isProd()` condition from `send-otp` code leak check |
| P-3 | **OpenAPI spec publicly accessible (H-5 fix broken)** | HIGH | `GET /api/openapi.json` returns full 11KB OpenAPI spec with all endpoints, schemas, and dev server URL — no auth required. The `if (env.isProd())` guard on `openapi.routes.js:11` is always FALSE on Vercel. Fix: remove the `env.isProd()` guard entirely, always require MASTER_SECRET |
| P-4 | **Account enumeration via `/check-email`** | HIGH | `POST /api/auth/check-email` returns `{"exists": true}` for known emails and `{"exists": false}` for unknowns. Publicly accessible (10/15min rate limit). Fix: return uniform response regardless of existence |
| P-5 | **Unauthenticated wallet fund verification** | MEDIUM | `GET /api/wallet/fund/verify` at `wallet.routes.js:30` has no `authenticate` middleware — only `verifyLimiter` (10/min). Exploitation limited by need for valid Paystack reference + `creditWallet` idempotency checks. Fix: add `authenticate` middleware |
| P-6 | **IP mismatch only logged, not rejected** | MEDIUM | `auth.middleware.js:23-25` — JWT contains `ip` claim but mismatch is only logged as warning. Stolen tokens usable from any IP. Fix: add configurable option to reject IP mismatches |
| P-7 | **Silent session eviction** | LOW | `token.service.js:62-64` — exceeding MAX_SESSIONS_PER_USER (10) silently deletes oldest session |
| P-8 | **CSRF token cookie `httpOnly: false`** | LOW | By design (JS must read it), but any XSS leads to immediate CSRF bypass + full account takeover |
| P-9 | **JWT_SECRET/MASTER_SECRET guards bypassed on Vercel** | INFO | `env.js:49-55` — fatal error for missing/weak JWT_SECRET only triggers when `env.isProd()` is TRUE (never on Vercel). App silently auto-generates per-instance secrets if not configured |

## Session Summary (Jul 15 — Color consistency across admin pages)
Replaced `primary-*` (purple) classes with `slate-*` on decorative/non-CTA elements across all admin pages, keeping purple only for interactive primary actions (CTAs). Landing page feature cards also unified to slate.

| File | Changes |
|---|---|
| `LandingPage.tsx` | Feature card icons: `text-primary-500`/`text-accent-500` → `text-slate-500`; gradient bg → solid slate |
| `AdminDashboard.tsx` | Stat icon container `bg-primary-500` → `bg-slate-500`; avatar gradient → solid; service icon `text-primary-500` → `text-slate-500` |
| `Analytics.tsx` | Metric icon `bg-primary-500` → `bg-slate-500` |
| `UserManagement.tsx` | Admin role badge, stat icon bg, avatar gradient, edit button, user modal avatar — all `primary` → `slate` |
| `PricingControl.tsx` | Edit button `text-primary-600` → `text-slate-600`; icon container `bg-primary-500` → `bg-slate-500` |
| `TransactionManagement.tsx` | Service type colors (airtime/data/etc.) → all `text-slate-500`; stat icon bg, edit button → slate |
| `AdminProfile.tsx` | Edit button, avatar gradient, Change Photo link, Change Password/Enable 2FA buttons, MFA key icons — all `primary` → `slate` |

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
| `POST /api/wallet/withdraw` | Withdraw (body: `amount`, `bank`, `accountNumber`, `accountName`, `transactionPin?`) |
| `GET /api/wallet/banks` | List Nigerian banks `[{name, code}]` (Paystack `/bank`) |
| `GET /api/wallet/resolve-account` | Resolve account name (`?accountNumber=&bankCode=`) via Paystack `/bank/resolve` |
| `GET /api/charts/weekly` | Weekly transaction amounts by day |
| `GET /api/charts/monthly` | Monthly spending by month |
| `GET /api/transactions` | Authenticated user's transactions |

## Idempotency

- Middleware at `server/src/middleware/idempotency.middleware.js` — optional `Idempotency-Key: <uuid>` header
- Applied to: `POST /wallet/fund/initialize`, `/wallet/fund`, `/wallet/withdraw`, `/auth/register`
- Flow: pre-inserts a `pending` row → on success updates to `completed`; on duplicate returns cached response
- Concurrent duplicate → 409; body mismatch → 422; invalid UUID → 400
- Keys stored in `idempotency_keys` table. No automatic cleanup yet — TBD: periodic DELETE of keys older than 24h

## Design Context

Refer to `PRODUCT.md` at the project root for strategic context (users, positioning, brand personality, design principles) and `DESIGN.md` for the visual system (colours, typography, components, elevation). Both are authoritative — visual decisions should stay on-brand per these files.

Key rules:
- Purple (`#7C3AED`) is the brand anchor; use ≤15% per screen
- Ginto (headings) + Inter (body) — never Ginto for body text
- Flat surfaces at rest, lifted on interaction
- 1rem (rounded-2xl) is the default corner radius
- Service categories use consistent colour coding (blue=airtime, green=data, purple=TV, yellow=electricity, red=betting)
