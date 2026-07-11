# BillXpress

VTU & Digital Services Platform — Buy airtime, data, pay bills, and manage transactions.

---

## Overview

BillXpress lets users purchase airtime and data bundles, subscribe to TV (DSTV/GOTV/Startimes), pay electricity bills, fund education exams (WAEC, NECO, JAMB, NABTEB), and place betting deposits. React SPA with Express + PostgreSQL backend, deployed on Vercel.

---

## Features

### User
- Sign up / login with real JWT auth (email + password)
- Phone login with OTP verification
- Fund wallet & make purchases
- Services: Airtime, Data, TV, Electricity, Education (WAEC, NECO, JAMB, NABTEB), Betting (Bet9ja, SportyBet, 1xBet, NairaBet, Betway)
- Transaction history with search, filter by status/type/date
- Profile management (personal info, billing/home addresses, bank details, BVN)
- Transaction PIN setup & security settings
- MFA (TOTP + backup codes)
- Dark mode toggle

### Admin (`/admin`)
- Dashboard with revenue chart, service usage pie chart, recent transactions table
- Analytics with user growth, revenue trends, regional breakdowns
- Service pricing management
- User management (view, lock/unlock, reset PIN)
- Transaction management (view, approve, refund)
- Admin profile with security settings

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite 5 |
| State | TanStack Query v5 |
| Styling | Tailwind CSS 3, CSS variables |
| Animation | Framer Motion |
| Charts | Recharts |
| Icons | Lucide React |
| Routing | React Router 7 |
| Backend | Express 4 (Node.js) |
| Database | PostgreSQL 15 (Supabase) |
| Auth | JWT access + refresh token rotation (httpOnly cookies), CSRF double-submit cookie pattern, account lockout, MFA (TOTP + backup codes), HIBP breach checking |
| Fonts | Ginto (headings), Inter (body) |

---

## Project Structure

```
src/                        # React frontend
├── App.tsx                 # Entry point, routing, ToastProvider
├── main.tsx                # React root mount
├── index.css               # Tailwind base, CSS variables, dark mode
├── components/
│   ├── auth/               # LoginPage, RegisterPage, ResetPasswordPage, AdminLogin
│   ├── dashboard/          # Dashboard (user home)
│   ├── admin/              # AdminDashboard, Analytics, PricingControl, UserManagement, TransactionManagement, AdminProfile
│   ├── layout/             # DashboardLayout, AdminLayout
│   ├── modals/             # FundWalletModal, WithdrawModal, SetPinModal
│   ├── services/           # Airtime, Data, TV, Electricity, Education, AirtimeToCash, Betting
│   ├── transactions/       # TransactionsPage (history, filters)
│   ├── profile/            # ProfilePage (personal info, bank, security, addresses)
│   ├── ui/                 # WalletCard, ServiceGrid, TransactionChart, SpendingChart, RecentTransactions, ProfileCompletion, LogoutModal, LoadingScreen
│   └── wallet/             # WalletPage
├── hooks/                  # useAuth, useDarkMode, useFocusTrap, useToast, useTransactions
├── utils/                  # validation.ts (email, password, phone, BVN validators)
├── constants/              # theme.ts (color, spacing, border-radius tokens)
├── api/                    # client.ts (Axios instance, CSRF handling, API functions)
├── assets/                 # Fonts + provider logos
└── types/                  # TypeScript interfaces (User, Transaction, Service, etc.)

server/                     # Express backend
├── src/
│   ├── controllers/        # Route handlers (auth, admin, wallet, transaction)
│   ├── services/           # Business logic (auth, token, wallet, audit)
│   ├── middleware/          # Auth, CSRF, rate limiting, cache, error handler
│   ├── routes/             # Route definitions
│   ├── config/             # Environment config
│   ├── utils/              # Database pool, logger, utilities
│   └── __tests__/          # Jest tests (wallet controller, integration)
├── backup.sh               # pg_dump backup script
└── package.json

api/                        # Vercel serverless entry point
└── index.js
```

---

## Getting Started

```bash
# Install dependencies
npm install && cd server && npm install

# Set up environment
cp server/.env.example server/.env
# Edit server/.env with your Supabase database URL

# Run database migrations (auto-runs on first start)
npm run dev

# Start frontend dev server
npm run dev
```

Open **http://localhost:5173/** in your browser.

### Build for production

```bash
npm run build
npm run preview
```

---

## Demo Credentials (development only)

Seeds run only in `NODE_ENV=development`. In demo mode (no `SMS_PROVIDER` set), OTP codes are displayed in the UI and emails are auto-verified.

| Role | Email | Password |
|---|---|---|
| Admin | admin@billxpress.com | Admin@123Xpress |
| User | user@demo.com | DemoXy7!kqmn92 |

---

## Key Notes

- **Database**: PostgreSQL 15 on Supabase (`eu-west-1`). Uses Supabase pooler (`aws-0-eu-west-1.pooler.supabase.com:6543`) for IPv4 compatibility.
- **Auth**: JWT access (15min) + refresh (7 days) token rotation with httpOnly cookies. CSRF double-submit cookie pattern. Account lockout after 5 failed attempts. MFA (TOTP + backup codes). HIBP password breach checking.
- **Dark mode**: Toggle in sidebar. Persists to localStorage. Respects `prefers-color-scheme`.
- **Demo mode**: When `SMS_PROVIDER` env var is not set, OTP codes appear in the UI and emails auto-verify. Set `SMS_PROVIDER=twilio` for production.
- **Brand color**: Purple `#7C3AED` (secondary in Tailwind config).

---

## Available Services

| Service | Providers |
|---|---|
| Airtime | MTN, Glo, Airtel, 9mobile |
| Data | MTN, Glo, Airtel, 9mobile |
| TV | DSTV, GOTV, Startimes |
| Electricity | Ikeja Electric, Eko, AEDC, KEDCO, YEDC |
| Education | WAEC, NECO, JAMB, NABTEB |
| Betting | Bet9ja, SportyBet, 1xBet, NairaBet, Betway |
| Airtime-to-Cash | Swap airtime for wallet credit |

---

## Deployment

The app deploys automatically to Vercel from the `main` branch. The `api/index.js` file serves as the Vercel serverless function, routing `/api/*` requests to the Express app. Static files are served from `dist/`.

## Project Config

- `vite.config.ts` — Vite + React plugin + Sentry source maps
- `tailwind.config.js` — Custom palette, Ginto + Inter fonts, animations
- `tsconfig.json` — TypeScript strict mode
- `vercel.json` — Build & rewrite rules for Vercel deployment
- `.github/workflows/backup.yml` — Automated database backup via pg_dump
