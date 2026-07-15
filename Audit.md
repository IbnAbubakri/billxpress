# 360° Audit Report: BillXpress (FintechApp)

**Audit Date:** July 15, 2026  
**Auditor:** opencode  
**Application:** BillXpress — Nigerian VTU & Digital Services Platform  
**Stack:** React 19 + Vite 5 / Express.js / PostgreSQL (Supabase) / Vercel  
**Overall Grade:** **B-** (Strong foundation with critical security and infrastructure gaps)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Critical Issues](#critical-issues)
3. [High Issues](#high-issues)
4. [Medium Issues](#medium-issues)
5. [Low Issues](#low-issues)
6. [Configuration Audit](#configuration-audit)
7. [Documentation Audit](#documentation-audit)
8. [Frontend Architecture Audit](#frontend-architecture-audit)
9. [Server Security Audit](#server-security-audit)
10. [Shared Types & E2E Audit](#shared-types--e2e-audit)
11. [Dependency Audit](#dependency-audit)
12. [What's Done Well](#whats-done-well)
13. [Priority Roadmap](#priority-roadmap)

---

## Executive Summary

BillXpress is a Nigerian fintech web application for utility bill payments, airtime/data top-ups, electricity tokens, TV subscriptions, and wallet management. The application has a well-structured React frontend, a robust Express.js backend with strong security fundamentals, and is deployed on Vercel with a PostgreSQL database via Supabase.

However, the audit uncovered **7 critical**, **10 high**, **15 medium**, and **12 low** severity issues spanning security, infrastructure, code quality, testing, and documentation. The most urgent are exposed credentials, missing HTTP security headers, a root-running Docker container, and zero frontend test coverage.

---

## Critical Issues

| # | Issue | Location | Detail |
|---|-------|----------|--------|
| 1 | **Live credentials on disk** | `server/.env` | Contains JWT_SECRET, DATABASE_URL (with password `faydaan1809`), PAYSTACK_SECRET_KEY, PAYSTACK_PUBLIC_KEY, and MASTER_SECRET in plaintext. If ever committed to git, all secrets are compromised. |
| 2 | **Docker container runs as root** | `Dockerfile` | No `USER` directive. If the Express server has a vulnerability, attackers get root access inside the container. |
| 3 | **No `.dockerignore` file** | `Dockerfile` | `COPY . .` includes everything: `.git/`, `server/.env` (JWT secret), test files, documentation, potentially `node_modules/`. The secret could be baked into image layers even if overridden at runtime (Docker layer caching). |
| 4 | **Database backups committed to git** | `.github/workflows/backup.yml` | Historical database dumps containing PII and financial data persist in `.git` history forever. Anyone with repo access gets the full database. Repo size grows unboundedly. |
| 5 | **No HTTP security headers** | `vercel.json` | Missing `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`, `X-XSS-Protection`, `Permissions-Policy`, and `Content-Security-Policy` header. Critical gap for a fintech application on the public internet. |
| 6 | **CSP via meta tag only — no clickjacking protection** | `index.html` | CSP delivered via `<meta http-equiv>` cannot use `frame-ancestors` or `report-uri`. Combined with missing `vercel.json` headers, the app is vulnerable to clickjacking attacks. |
| 7 | **`connect-src: https:` allows data exfiltration** | `index.html` CSP | The CSP allows connections to any HTTPS endpoint, effectively permitting data exfiltration to any server. Should be restricted to the actual API domain + Sentry. |

---

## High Issues

| # | Issue | Location | Detail |
|---|-------|----------|--------|
| 8 | **PWA caches sensitive API responses for 24h** | `vite.config.ts` | Runtime caching rule caches all `/api/` responses (wallet balances, transactions, account info) for 24 hours with up to 100 entries. If a user shares a device, cached financial data may be served from cache. |
| 9 | **OTP codes leaked in demo mode** | `server/src/services/auth.service.js:674` | If `NODE_ENV=production` is set without an `SMS_PROVIDER`, OTP codes are returned in the API response body, exposing them to anyone calling the endpoint. |
| 10 | **Zero frontend unit/component tests** | `src/__tests__/` | No test files exist for any React component, hook, or utility. All 63 tests are server-side only. |
| 11 | **E2E tests have no backend** | `e2e/playwright.config.ts` | Playwright tests hit a static Python file server (`serve.py` on port 4173) with no Express API running. Tests can only verify HTML structure — they cannot test authentication, wallet operations, or any dynamic behavior. Essentially glorified smoke tests. |
| 12 | **No security linting plugins** | `eslint.config.js` | No `eslint-plugin-security` or `eslint-plugin-no-secrets` for a fintech application handling payments, auth tokens, and PII. |
| 13 | **Build tools in `dependencies`** | `package.json` | `rollup`, `esbuild`, `csso`, `lightningcss`, `lightningcss-linux-x64-gnu` are in `dependencies` instead of `devDependencies`. Inflates production `node_modules`, increases Docker image size, and could leak build tooling. |
| 14 | **`better-sqlite3` undeclared** | `server/package.json` | Used in `server/src/__tests__/test-db.js` and present in `server/package-lock.json` but NOT in `server/package.json`. Will break on a clean `npm ci` install. |
| 15 | **CI silences security audit failures** | `.github/workflows/ci.yml` | `npm audit` uses `continue-on-error: true`, meaning security vulnerabilities never block the pipeline. Server dependencies are also never installed in CI, so server tests cannot run. |
| 16 | **`auth.service.js` is 697 lines** | `server/src/services/auth.service.js` | Monolithic service handling user CRUD, authentication, password management, MFA, email verification, phone OTP, and profile management. Needs decomposition into focused services. |
| 17 | **Server is entirely untyped JavaScript** | `server/src/` | Zero TypeScript, zero JSDoc `@typedef` annotations across 40+ server files handling payments, auth tokens, wallet operations, and PII. No compile-time type safety. |

---

## Medium Issues

| # | Issue | Location | Detail |
|---|-------|----------|--------|
| 18 | **Color palette overlaps** | `tailwind.config.js` | `primary.DEFAULT` duplicates `primary.700` (both `#7C3AED`). `secondary` and `dark` are identical slate palettes (`secondary.500` = `dark.500` = `#64748b`). |
| 19 | **Loose string types in shared types** | `shared/types.ts` | `Transaction.type` and `AdminUser.role` are typed as `string` instead of string-literal unions, providing zero type safety. |
| 20 | **Money typed as `number`** | `shared/types.ts` | `User.balance` uses `number` — floating-point precision issues are dangerous for financial data. Should use string representation or decimal library. |
| 21 | **`shared/types.ts` not in tsconfig** | `tsconfig.app.json` | `include` is `["src"]` only. TypeScript compilation does not type-check `shared/types.ts`. Errors in that file go undetected until Vite bundling. |
| 22 | **JSDoc mirror is stale** | `shared/types.js` | Missing 10 fields that exist in `shared/types.ts` (mfaEnabled, dateOfBirth, gender, nin, nextOfKin, employmentStatus, annualIncome, createdAt, lastLogin, passwordChangedAt). |
| 23 | **Vitest globals without type declarations** | `vitest.config.ts` | `globals: true` makes `describe`/`it`/`expect` available globally but TypeScript won't recognize them. Causes IDE errors and `tsc` failures. |
| 24 | **No test coverage thresholds** | `vitest.config.ts` | No `coverage` configuration. No way to enforce minimum coverage for a fintech application. |
| 25 | **Timestamps stored as TEXT** | `server/src/db.js` schema | All timestamps stored as `TEXT` instead of `TIMESTAMPTZ`, losing native date comparison, timezone handling, and index efficiency. |
| 26 | **JSON columns stored as TEXT** | `server/src/db.js` schema | JSON data (`nextOfKin`, `mfaBackupCodes`, `passwordHistory`, `ips`) stored as `TEXT` instead of native `jsonb`, losing query capabilities. |
| 27 | **Pinned to RC prerelease** | `package.json` | `eslint-plugin-react-hooks` pinned to `^5.1.0-rc.0` — a release candidate. Production code should use stable releases. |
| 28 | **No `NODE_ENV` in Dockerfile** | `Dockerfile` | Server defaults to `'development'`, enabling verbose error output and auto-generating a random JWT_SECRET per restart (invalidating all existing tokens). |
| 29 | **PWA `skipWaiting` + `clientsClaim`** | `vite.config.ts` | New service worker takes over immediately, potentially breaking in-flight payment requests. Risky for a fintech app handling payments. |
| 30 | **Hardcoded Playwright browser path** | `e2e/playwright.config.ts` | Absolute path `/home/faaruq/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome` will not work for any other developer or CI environment. |
| 31 | **`.gitignore` excludes all markdown** | `.gitignore` | `*.md` pattern ignores all project documentation except README. `AGENTS.md`, `DESIGN.md`, `PRODUCT.md`, `todo.md` are not tracked by git. |
| 32 | **Duplicate audit IDs** | `AGENTS.md` | Two items in different audit batches both labeled `C-1`, making referencing specific items ambiguous. |
| 33 | **Redundant JPEG/JPG config** | `vite.config.ts` | Image optimizer configures both `jpeg` and `jpg` with identical options — they are the same format. |
| 34 | **Missing `better-sqlite3` in test DB** | `server/src/__tests__/test-db.js` | `wallet_funding_transactions` table missing from SQLite test database schema, causing potential test gaps. |
| 35 | **Node version mismatch** | CI vs Dockerfile | CI uses Node 20 (`.github/workflows/ci.yml`) but Dockerfile uses Node 22. Should be aligned. |

---

## Low Issues

| # | Issue | Location | Detail |
|---|-------|----------|--------|
| 36 | **Copyright year mismatch** | `README.md` | README says `(c) 2025` but source files say `(c) 2026`. |
| 37 | **Brand color mismatch** | `PRODUCT.md` | Says "blue-anchored" but the entire app uses purple (`#7C3AED`). |
| 38 | **Outdated original prompt** | `prompt.md` | Specifies PHP/MySQL tech stack — completely diverged from the actual Node/PostgreSQL implementation. |
| 39 | **Abandoned todo tracker** | `todo.md` | Contains a single stale entry with no tracking of the many outstanding items. |
| 40 | **README project tree incomplete** | `README.md` | Missing ~40% of files including components, utilities, server files, shared types, e2e tests, and CI workflows. |
| 41 | **Service page code duplication** | `src/components/services/` | All 7 service pages (Airtime, Data, Electricity, Education, TV, Betting, AirtimeToCash) follow identical patterns with significant code duplication. |
| 42 | **`react-window` maintenance mode** | `package.json` | `react-window` is in maintenance mode. Consider `@tanstack/react-virtual` for better long-term support. |
| 43 | **Redundant `esbuild` and `rollup`** | `package.json` | Vite bundles both internally. Explicit installs create duplicates in `node_modules`. |
| 44 | **No accessibility linting** | `eslint.config.js` | No `eslint-plugin-jsx-a11y` despite PRODUCT.md targeting WCAG 2.1 AA. |
| 45 | **No Open Graph meta tags** | `index.html` | No `og:` or Twitter Card meta tags for social sharing. |
| 46 | **Single browser in E2E** | `e2e/playwright.config.ts` | Only Chromium is configured. No Firefox or WebKit projects. |
| 47 | **Analytics is a no-op stub** | `src/utils/analytics.ts` | `trackEvent` is an empty function called throughout the codebase but does nothing. |
| 48 | **`autoprefixer` may be redundant** | `postcss.config.js` | Vite handles vendor prefixing internally. Having it in PostCSS is harmless but unnecessary. |
| 49 | **Missing `.ico` fallback** | `public/` | Some enterprise environments still use `.ico` favicons. A `favicon.ico` fallback is recommended. |
| 50 | **`useDefineForClassFields` redundant** | `tsconfig.app.json` | ES2020 target already uses define semantics. Flag is harmless but unnecessary. |
| 51 | **No `forceConsistentCasingInFileNames`** | `tsconfig.app.json` | Not enabled. Could cause cross-platform import casing bugs. |

---

## Configuration Audit

### package.json

- **17 production dependencies, 26 dev dependencies**
- Build tools (`rollup`, `esbuild`, `csso`, `lightningcss`) misplaced in `dependencies` — should be in `devDependencies`
- `eslint-plugin-react-hooks` pinned to RC (`^5.1.0-rc.0`)
- `lightningcss-linux-x64-gnu` hard-codes Linux x64 binary — breaks ARM/Docker cross-platform builds
- `motion-utils` is an internal framer-motion package — explicit install risks version drift
- Missing scripts: `format`, `format:check`, `typecheck`, `clean`
- `better-sqlite3` used in tests but undeclared in `server/package.json`

### TypeScript Configuration

- **`tsconfig.json`**: Clean project-references setup — no issues
- **`tsconfig.app.json`**: Missing `forceConsistentCasingInFileNames`, `resolveJsonModule`, and strict options like `noUncheckedIndexedAccess`
- **`tsconfig.node.json`**: `lib: ["ES2023"]` slightly ahead of `target: "ES2022"` — inconsistent but harmless

### Vite Configuration

- Sentry plugin runs in all environments — should also check for `SENTRY_AUTH_TOKEN`
- PWA caches all `/api/` responses for 24 hours — dangerous for financial data
- `skipWaiting` + `clientsClaim` can break in-flight requests
- JPEG/JPG configured separately with same options (redundant)
- Dev proxy correctly targets `localhost:4000`

### Vitest Configuration

- `globals: true` without TypeScript type declarations
- No coverage configuration or thresholds
- Unit and server tests share the same project with the same environment
- No `reporters` configuration for CI

### ESLint Configuration

- Only lints TypeScript files (`.ts`, `.tsx`) — server `.js` files are unlinted
- No `eslint-plugin-react` (only hooks and refresh plugins)
- No security linting plugins
- No accessibility linting
- No import ordering enforcement
- `ecmaVersion: 2020` is outdated

### Tailwind Configuration

- Custom color palette well-defined but has overlaps (`primary.DEFAULT` = `primary.700`, `secondary` = `dark`)
- Custom fonts (Ginto, Inter) properly configured
- Custom animations (fadeIn, slideUp, scaleIn) properly defined
- `darkMode: 'class'` correctly implemented
- No accessibility plugins configured

### vercel.json

- Dual `npm install` (root + server) is correct but fragile
- Rewrite order is correct (API first, SPA fallback last)
- **Missing all HTTP security headers** — the most significant security gap in the deployment configuration
- No `maxDuration` or `functions` configuration for serverless timeout

### Dockerfile

- **Running as root** — no `USER` directive
- **No multi-stage build** — includes all devDependencies, test files, source maps, and source code in final image
- **`COPY . .` includes sensitive files** — no `.dockerignore` exists
- `2>/dev/null || true` on server package copy suppresses real failures
- No `HEALTHCHECK` instruction
- No `NODE_ENV` set

### PostCSS Configuration

- Minimal and clean with Tailwind CSS and Autoprefixer
- `autoprefixer` may be redundant (Vite handles vendor prefixing)
- Missing `postcss-import` if `@import` statements are used

---

## Documentation Audit

### README.md

| Aspect | Assessment |
|--------|------------|
| Quality | High |
| Completeness | Medium — project tree is ~60% complete |
| Currency | Medium — Getting Started instructions ambiguous |

**Key gaps:** No mention of Paystack integration, PWA support, Sentry, OpenAPI docs, E2E tests, Docker, or the `dev:server`/`dev:all` scripts. Getting Started section shows `npm run dev` twice without distinguishing frontend vs backend commands.

### AGENTS.md

| Aspect | Assessment |
|--------|------------|
| Quality | Excellent |
| Completeness | Medium-High |
| Currency | Current (updated Jul 15) |

**Key gaps:** `shared/` directory undocumented. Paystack webhook infrastructure not documented. API Endpoints table incomplete (missing auth CRUD, webhook, OpenAPI endpoints). Duplicate `C-1` audit IDs. Test count (63 across 4 files) may be stale.

### DESIGN.md

| Aspect | Assessment |
|--------|------------|
| Quality | Very High |
| Completeness | High |
| Currency | Current |

**Key gaps:** `border-l-4` on dashboard cards contradicts the "Don't" rule. No formalized dark mode values in the YAML frontmatter. No admin-specific design rules. No mention of the anti-AI redesign principle from Jul 15 session.

### PRODUCT.md

| Aspect | Assessment |
|--------|------------|
| Quality | Medium |
| Completeness | Low |
| Currency | Stale |

**Key gaps:** Says "blue-anchored" (should be purple). No mention of admin users as a secondary audience. No mention of wallet funding/payment flow. No mention of security features (MFA, PIN, BVN). WCAG 2.1 AA target stated without backing evidence.

### prompt.md

| Aspect | Assessment |
|--------|------------|
| Quality | Low (historical) |
| Completeness | Low |
| Currency | Very Stale |

Completely outdated — specifies PHP/MySQL tech stack. Lists features that were never implemented (admin user management, notifications page, CSV export, role-based permissions). Should be archived or labeled as historical.

### todo.md

| Aspect | Assessment |
|--------|------------|
| Quality | Very Low |
| Completeness | Very Low |
| Currency | Abandoned |

Single stale entry. No tracking of any outstanding items from the audit process.

### Cross-Document Inconsistencies

| Issue | Files Affected |
|-------|---------------|
| Copyright year: 2025 vs 2026 | README.md vs source files |
| Brand color: "blue-anchored" vs purple | PRODUCT.md vs DESIGN.md, README.md, AGENTS.md |
| `border-l-4` contradicts "Don't" rule | DESIGN.md vs AGENTS.md |
| Tech stack: PHP/MySQL vs Node/PostgreSQL | prompt.md vs everything else |
| Auth storage: localStorage vs sessionStorage | AGENTS.md vs actual implementation |
| Test count may be stale | AGENTS.md vs actual test files |
| Database backup retention: 7 vs 14 days | `server/backup.sh` vs `.github/workflows/backup.yml` |

---

## Frontend Architecture Audit

### Routing Structure

| Route | Component | Auth Required |
|-------|-----------|---------------|
| `/` | `LandingPage` | No |
| `/login` | `LoginPage` | No |
| `/register` | `RegisterPage` | No |
| `/reset-password` | `ResetPasswordPage` | No |
| `/verify-email` | `VerifyEmailPage` | No |
| `/fund-callback` | `FundCallback` | No |
| `/dashboard` | `Dashboard` | Yes |
| `/wallet` | `WalletPage` | Yes |
| `/transactions` | `TransactionsPage` | Yes |
| `/profile` | `ProfilePage` | Yes |
| `/services/airtime` | `AirtimePage` | Yes |
| `/services/data` | `DataPage` | Yes |
| `/services/electricity` | `ElectricityPage` | Yes |
| `/services/education` | `EducationPage` | Yes |
| `/services/tv` | `TVSubscriptionPage` | Yes |
| `/services/betting` | `BettingPage` | Yes |
| `/services/airtime-to-cash` | `AirtimeToCashPage` | Yes |
| `/admin/login` | `AdminLogin` | No |
| `/admin/analytics` | `Analytics` | Yes (admin) |

All dashboard/service routes lazy-loaded with `React.lazy()` + Suspense `LoadingScreen`.

### Component Architecture

- **Layout:** `DashboardLayout`, `AdminLayout`, `Sidebar`, `MobileNav`, `NotificationBell`, `LogoutButton`, `ThemeToggle`
- **Auth:** `LoginPage`, `RegisterPage`, `ResetPasswordPage`, `VerifyEmailPage`, `AdminLogin`, `ProtectedRoute`
- **Dashboard:** `Dashboard` with `RecentTransactions`, `ServiceGrid`, `WalletCard`, `TransactionChart`, `SpendingChart`, `LazyCharts`, `ProfileCompletion`
- **Services:** 7 service pages (Airtime, Data, Electricity, Education, TV, Betting, AirtimeToCash)
- **Wallet:** `WalletPage`, `FundCallback`, `FundWalletModal`, `WithdrawModal`, `SetPinModal`
- **Profile:** `ProfilePage`, `BVNModal`, `BankDetailsModal`, `BasicInfoModal`, `EmailVerificationModal`
- **Transactions:** `TransactionsPage` with `VirtualTransactionList`
- **Admin:** `Analytics`
- **UI:** `WalletCard`, `ServiceGrid`, `ConfirmModal`, `ToastContainer`, `Logo`, `LoadingScreen`, `PWAPrompt`, `OptimizedImage`
- **Error Handling:** `ErrorBoundary`, `PageErrorBoundary`

### State Management

- **Server state:** TanStack Query v5 (React Query) with staleTime and cacheTime
- **Client state:** React Context (toasts), local `useState`, `sessionStorage` (auth), `localStorage` (theme, banner dismissals)
- **No global client-side store** (no Redux, no Zustand)

### API Integration

- Two Axios base instances: `/api/auth` (unauthenticated) and `/api` (authenticated)
- CSRF token extracted from cookies and sent on every POST/PUT/DELETE/PATCH
- 401 interceptor automatically retries with session refresh before failing
- Auth token stored in `sessionStorage` with 1-hour TTL

### Styling

- Tailwind CSS with dark mode via `dark:` variant
- Custom CSS variables for dark mode
- Ginto font for headings, Inter for body text
- Purple (`#7C3AED`) as brand anchor (used sparingly, ≤15% per screen)
- Consistent rounded-2xl corners, flat surfaces, lifted on interaction
- Service categories color-coded: blue=airtime, green=data, purple=TV, yellow=electricity, red=betting

---

## Server Security Audit

### Endpoint Inventory (~30 endpoints)

**Auth (`/api/auth/`):** register, login, admin-login, logout, refresh, me, forgot-password, reset-password, send-verification, verify-email, profile, password, transaction-pin, sessions, sessions/:id, logout-all, mfa/generate, mfa/verify, mfa/disable, account, check-phone, check-email, send-otp, verify-otp

**Admin (`/api/admin/`):** create, stats, revenue-chart, service-distribution, transactions, users, analytics

**Wallet (`/api/wallet/`):** fund/verify, fund/initialize, fund, withdraw

**Other:** health, transactions, charts/weekly, charts/monthly, openapi.json, webhook/paystack

### Security Ratings

| Area | Rating | Detail |
|------|--------|--------|
| SQL Injection | **STRONG** | All queries use parameterized statements. Column names validated with regex allowlist. No string concatenation in SQL. |
| XSS Protection | **GOOD** | Helmet.js CSP, `sanitizeValue()` strips HTML tags, React auto-escaping, JSON responses. Could add nonce-based script execution. |
| CSRF Protection | **STRONG** | Double-submit cookie pattern on all state-changing endpoints. 15-min token lifetime. `__Host-` prefix in production. |
| Rate Limiting | **EXCELLENT** | 15+ granular rate limiters per endpoint. Login: 20/15min, Forgot password: 3/15min, Admin creation: 5/60min. |
| Brute Force Protection | **STRONG** | 5-attempt lockout with progressive backoff. 500ms timing mitigation on failed auth. Enumeration prevention on check-phone/email. |
| Token Security | **STRONG** | httpOnly, secure, sameSite=strict cookies. Refresh token rotation (single-use). Max 10 concurrent sessions. |
| Password Security | **STRONG** | 12-char minimum, complexity requirements, HIBP breach checking, 5-password history, 90-day expiry, bcrypt 12 rounds. |
| MFA | **STRONG** | TOTP-based with backup codes. |
| Webhook Security | **STRONG** | HMAC-SHA512 signature verification with timing-safe comparison. |
| Audit Logging | **STRONG** | Pino structured logging with automatic secret redaction. Comprehensive audit trail for all security events. |
| HTTPS Enforcement | **GOOD** | HTTP→HTTPS redirect, HSTS with 1-year maxAge, includeSubDomains, preload. |
| Error Handling | **GOOD** | Operational vs programming error distinction. Stack traces hidden in production. Generic messages for unknown errors. |

### Database Schema

8 tables with 19 indexes: `users` (40 columns), `refresh_tokens`, `sessions`, `login_attempts`, `audit_logs`, `transactions`, `wallet_funding_transactions`, `otps`, `schema_migrations`

**Issues:** JSON columns stored as TEXT (should be `jsonb`). Timestamps stored as TEXT (should be `TIMESTAMPTZ`). Proper `ON DELETE CASCADE` on foreign keys.

---

## Shared Types & E2E Audit

### Shared Types

- `shared/types.ts` defines `User` (30 fields), `Transaction` (6 fields), `AdminUser` (4 fields), `ProfileUpdateData` (Partial<Pick>)
- `shared/types.js` is a JSDoc-only mirror — missing 10 fields from the TS version
- `src/types/index.ts` re-exports shared types + adds `Service`, `ProfileStep`, `BankDetails`, `BasicInfo`
- **Issues:** `Transaction.type` and `AdminUser.role` typed as `string`. `User.balance` typed as `number`. `User.id` is `string` while `AdminUser.id` is `number`. `User.nextOfKin` is untyped `Record<string, string>`.

### E2E Tests

- 1 test file (`auth.spec.ts`), 23 tests, 8 describe blocks
- Covers: landing page, login page structure, login form validation, register page, responsive design, dark mode, reset password, page redirects
- **Critical gaps:** No authentication flow tests, no registration flow tests, no wallet/dashboard tests, no API-level tests, no admin tests, no accessibility tests, no error state tests
- **Infrastructure gap:** Static file server with no backend makes all tests structural smoke tests only

---

## Dependency Audit

### Security Vulnerabilities

| Severity | Package | Issue |
|----------|---------|-------|
| HIGH | `vite` <=6.4.2 | Path traversal in optimized deps `.map` handling |
| HIGH | `vite` <=6.4.2 | `server.fs.deny` bypass on Windows alternate paths |
| MODERATE | `vite` <=6.4.2 | NTLMv2 hash disclosure via UNC path handling |
| MODERATE | `esbuild` <=0.24.2 | Any website can send requests to dev server |

All Vite vulnerabilities are development-only (affect dev server, not production builds).

### Redundant/Unnecessary Packages

| Package | Reason |
|---------|--------|
| `esbuild@^0.28.1` | Vite bundles esbuild internally — creates dual-version issue |
| `rollup@^4.62.2` | Vite bundles Rollup internally — creates duplicate |
| `csso@^5.0.5` | Vite uses esbuild for CSS minification — likely unused |
| `lightningcss-linux-x64-gnu` | Platform-specific binary — breaks cross-platform builds |
| `motion-utils@^12.39.0` | Internal framer-motion package — risks version drift |

### Lock File Health

- Lock file version: 3 (current)
- All resolved versions satisfy declared semver ranges
- Package name/version match between package.json and lock file
- 134-entry difference between `package-lock.json` and `node_modules/.package-lock.json` is normal (platform-specific optional deps)

---

## What's Done Well

### Server Security (A+)

- Parameterized SQL queries throughout — zero SQL injection risk
- CSRF double-submit pattern on all state-changing endpoints
- 15+ granular rate limiters with per-endpoint tuning
- Account lockout with progressive backoff (5 attempts → lockout)
- HIBP breach checking on password operations
- Password history (5 previous) + 90-day expiry
- TOTP-based MFA with backup codes
- Session management (30 min idle, 24h absolute, max 10 concurrent)
- Single-use refresh token rotation
- Timing-safe webhook signature verification (HMAC-SHA512)
- Structured logging (Pino) with automatic redaction of secrets
- Comprehensive audit trail for all security events
- Database transactions with `FOR UPDATE` locking for balance operations
- Helmet.js with strict CSP, HSTS, content-type sniffing protection
- Production guard: server refuses to start without `JWT_SECRET`
- 500ms timing mitigation on failed auth responses

### Frontend Architecture (B+)

- Clean React 19 + TypeScript + Vite stack
- TanStack Query for server state management
- Proper lazy-loading with code splitting on all routes
- CSRF token management with auto-retry interceptor on 401
- Dual Axios instances (authenticated vs unauthenticated)
- Error boundaries at app and page level
- Consistent dark mode with flash-prevention script
- Well-structured component hierarchy

### Design System (A-)

- Comprehensive DESIGN.md with YAML frontmatter tokens
- "One-Accent Rule" enforced across all screens
- Anti-AI aesthetic principles documented and followed
- Service category color coding system
- Consistent rounded-2xl / flat-surface / lifted-on-interaction pattern

---

## Priority Roadmap

### Phase 1: Security Hardening (1-2 days)

1. Verify `server/.env` is not in git history — rotate all secrets if compromised
2. Create `.dockerignore` file
3. Add `USER appuser` to Dockerfile
4. Set `NODE_ENV=production` in Dockerfile
5. Add HTTP security headers to `vercel.json`
6. Move CSP from meta tag to HTTP header (via Helmet or Vercel config)
7. Restrict `connect-src` to actual API domain + Sentry only
8. Exclude sensitive endpoints from PWA caching
9. Fix OTP leak in demo mode (don't return code if `NODE_ENV=production` regardless of SMS_PROVIDER)

### Phase 2: Infrastructure (3-5 days)

10. Move build tools to `devDependencies`; remove redundant `esbuild`, `rollup`, `csso`
11. Remove `lightningcss-linux-x64-gnu` and `motion-utils` from explicit dependencies
12. Declare `better-sqlite3` in `server/package.json`
13. Add server dependency install to CI workflow
14. Remove `continue-on-error` from `npm audit` in CI
15. Add `shared/` to `tsconfig.app.json` include
16. Fix Playwright config (remove hardcoded paths, add backend server)
17. Set Vitest coverage thresholds
18. Update `eslint-plugin-react-hooks` to stable release range
19. Align Node version between CI and Dockerfile

### Phase 3: Code Quality (1-2 weeks)

20. Add `eslint-plugin-security` and `eslint-plugin-jsx-a11y`
21. Decompose `auth.service.js` into smaller services (user, auth, password, mfa, verification)
22. Replace loose `string` types with literal unions in shared types
23. Add frontend unit/component tests
24. Fix database schema: `TIMESTAMPTZ` for timestamps, `jsonb` for JSON columns
25. Deduplicate service page components with factory/shared pattern
26. Type `User.balance` as string for safe financial representation
27. Add JSDoc `@typedef` annotations to server code (or migrate to TypeScript)

### Phase 4: Documentation (2-3 days)

28. Update README.md project tree (add ~40 missing entries)
29. Fix Getting Started section with correct `dev`/`dev:server`/`dev:all` commands
30. Add Paystack, PWA, Sentry, OpenAPI, E2E, Docker to README
31. Fix PRODUCT.md "blue-anchored" → "purple-anchored"
32. Add admin persona to PRODUCT.md
33. Archive or label prompt.md as historical
34. Update or delete todo.md
35. Fix copyright year in README (2025 → 2026)
36. Update AGENTS.md API Endpoints table
37. Fix duplicate `C-1` audit IDs in AGENTS.md
38. Resolve DESIGN.md `border-l-4` contradiction
39. Add admin-specific design rules to DESIGN.md

### Phase 5: Testing (2-4 weeks)

40. Add backend to E2E test infrastructure (start Express + Vite dev server)
41. Write E2E tests for authentication flows (register → OTP → login → session → logout)
42. Write E2E tests for wallet operations (fund → verify balance → withdraw)
43. Write E2E tests for transaction flows
44. Write frontend component tests for critical paths
45. Add axe-core accessibility testing
46. Add Firefox and WebKit projects to Playwright config
47. Add error state and rate limiting tests
48. Add PWA behavior tests

### Phase 6: Modernization (ongoing)

49. Upgrade Vite to v6+ when plugin ecosystem supports it
50. Consider migrating `react-window` to `@tanstack/react-virtual`
51. Plan Tailwind CSS v4 migration
52. Consider Express 5 migration
53. Add shared Zod validation schemas for frontend/backend consistency
54. Implement real analytics tracking (replace stub)
