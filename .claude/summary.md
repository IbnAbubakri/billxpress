## Objective
- Make registration and login work end-to-end on Vercel: OTP → register → login. Already migrated from SQLite to Supabase PostgreSQL to fix per-instance data isolation.

## Important Details
- Live URL: `https://billxpress1.vercel.app/`. Vercel auto-deploys from `main`.
- React 19, TanStack React Query v5, Tailwind 3, Vite 5, Express + PostgreSQL (`pg` v8.22.0).
- Supabase project in `eu-west-1`. Direct connection (`db.*.supabase.co`) is IPv6-only; Vercel can't connect to IPv6. Switched to pooler (`aws-0-eu-west-1.pooler.supabase.com:6543`) which has IPv4. `DATABASE_URL` must remain the original direct-connect string; the pooler URL is constructed in code.
- `SUPABASE_REGION` env var defaults to `eu-west-1`.
- All server dependencies must be listed in root `package.json` (not just `server/package.json`) for Vercel serverless bundler. Root `package.json` now has all 14 server deps installed.
- `api/index.js` is the Vercel serverless entry point.

## Work State
### Completed
- Fixed Supabase IPv4 reachability: `db.js` rewrites `db.*.supabase.co` hostnames to `aws-0-{SUPABASE_REGION}.pooler.supabase.com:6543` with `postgres.{projectRef}` username and `ssl: { rejectUnauthorized: false }`.
- Full migration to PostgreSQL async: all 13 server files. DDL uses `CREATE TABLE IF NOT EXISTS`, `SERIAL`, `NOW()`, `ON CONFLICT DO NOTHING`.
- Build passes (75 precached entries).
- **Login works** — demo, admin, and faruqsuzay users can all log in successfully.
- Fixed: `validateLogin` middleware to accept `login` field (phone or email).
- Fixed: `authenticate()` referenced undefined `email` variable (was renamed to `login` but body still used `email`).
- Fixed: PostgreSQL folds unquoted column names to lowercase (e.g. `emailVerified` → `emailverified`). Applied `??` fallback pattern in `rowToUser`, `getUserById`, session/refresh token access, and auth middleware.
- Fixed: `App.tsx` `onLogin` only passed `login`, not `password` to `handleLogin`.
- Email auto-verified on registration (`emailVerified: 1`).

### Active
- All API endpoints tested and responding.

### Blocked
- (none)

## Credentials
- **demo@billxpress.com** / `DemoXy7!kqmn92` (user)
- **admin@billxpress.com** / `Admin@123Xpress` (admin)
- **faruqsuzay@gmail.com** / `#Rasheedah123` (user)

## Relevant Files
- `server/src/utils/db.js` — pool creation, host rewrite, schema init, PG compat layer.
- `server/src/services/auth.service.js` — `authenticate()`, `register()`, `rowToUser()`, `getUserById()`.
- `server/src/middleware/validate.middleware.js` — `validateLogin` accepts `login` field.
- `server/src/middleware/auth.middleware.js` — session validation.
- `server/src/services/token.service.js` — session and refresh token management.
- `server/src/controllers/auth.controller.js` — login/register handlers.
- `src/App.tsx` — `onLogin` callback passes both `login` and `password`.
- `src/components/auth/LoginPage.tsx` — combined email/phone input with dynamic icon.
- `src/api/client.ts` — CSRF handling, `login()` sends `{ login, password }`.
- `src/hooks/useAuth.ts` — `loginMutation` and `handleLogin`.
- `server/src/seed.js` — demo/admin user seed data.
