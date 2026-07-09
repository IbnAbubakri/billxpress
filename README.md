# BillXpress

VTU & Digital Services Platform — Buy airtime, data, pay bills, and manage transactions.

---

## Overview

BillXpress lets users purchase airtime and data bundles, subscribe to TV (DSTV/GOTV/Startimes), pay electricity bills, fund education exams (WAEC, NECO, JAMB, NABTEB), and place betting deposits. Built as a React SPA with mock/localStorage auth — no real backend.

---

## Features

### User
- Sign up / login (mock auth, any email works)
- Fund wallet & make purchases
- Services: Airtime, Data, TV, Electricity, Education (WAEC, NECO, JAMB, NABTEB), Betting (Bet9ja, SportyBet, 1xBet, NairaBet, Betway)
- Transaction history with search, filter by status/type/date
- Profile management (personal info, billing/home addresses, bank details, BVN)
- Transaction PIN setup & security settings
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
| Framework | React 18, TypeScript |
| Build | Vite 5 |
| Styling | Tailwind CSS 3, CSS variables |
| Animation | Framer Motion |
| Charts | Recharts |
| Icons | Lucide React |
| Routing | React Router 7 |
| Auth | localStorage (mock, no backend) |
| Fonts | Ginto (headings), Inter (body) |

---

## Project Structure

```
src/
├── App.tsx                    # Entry point, routing, ToastProvider
├── main.tsx                   # React root mount
├── index.css                  # Tailwind base, CSS variables, dark mode, utilities
├── types/
│   ├── index.ts               # User, AdminUser, Transaction, Service, etc.
│   └── page.ts                # PageProps interface
├── hooks/
│   ├── useAuth.ts             # Auth state + localStorage persistence
│   ├── useDarkMode.ts         # Dark mode toggle + system preference
│   ├── useFocusTrap.ts        # Modal focus trapping + ESC close
│   └── useToast.tsx           # Toast notification context + provider
├── utils/
│   └── validation.ts          # Email, password, phone, BVN validators
├── constants/
│   └── theme.ts               # Color, spacing, border-radius tokens
├── components/
│   ├── auth/                  # LoginPage, RegisterPage, ResetPasswordPage, AdminLogin
│   ├── dashboard/             # Dashboard (user home)
│   ├── admin/                 # AdminDashboard, Analytics, PricingControl, UserManagement, TransactionManagement, AdminProfile
│   ├── layout/                # DashboardLayout, AdminLayout (sidebars + dark toggle)
│   ├── modals/                # FundWalletModal, WithdrawModal, SetPinModal
│   ├── services/              # Airtime, Data, TV, Electricity, Education, AirtimeToCash, Betting
│   ├── transactions/          # TransactionsPage (history, filters)
│   ├── profile/               # ProfilePage (personal info, bank, security, addresses)
│   ├── ui/                    # WalletCard, ServiceGrid, TransactionChart, SpendingChart, RecentTransactions, ProfileCompletion, LogoutModal, LoadingScreen, ToastContainer
│   └── wallet/                # WalletPage
├── assets/
│   ├── fonts/                 # Ginto-Copilot.woff2
│   └── icons/                 # 26 provider logos (MTN, Glo, DSTV, WAEC, etc.)
└── backend/                   # PHP schemas + JWT helper (dead code, not deployed)
```

---

## Getting Started

```bash
npm install
npm run dev
```

Open **http://localhost:5173/** in your browser.

### Build for production

```bash
npm run build
npm run preview
```

---

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@billxpress.com | admin123 |
| User | Any email works | Any password (min 6 chars) |

> User login is fully mocked — any valid email/password logs you in as **Chioma Okafor** with ₦24,570.00 balance. All transactions, services, and admin data are mock/fake.

---

## Key Notes

- **No backend**: All auth is localStorage-based. No real API, database, or server.
- **PHP backend stubs**: `src/backend/` contains old PHP files (`jwt_helper.php`, `numora.sql`) but they are not connected or deployed.
- **Firebase**: Configured for static hosting only (`firebase.json` rewrites to `index.html`). Not active.
- **Google OAuth**: `@react-oauth/google` is in `package.json` but never initialized — dead dependency.
- **Dark mode**: Toggle in sidebar. Persists to localStorage. Respects `prefers-color-scheme`.
- **Accessibility**: `htmlFor`/`id` on all labels, `aria-hidden` on decorative icons, `aria-label` on icon buttons, `aria-invalid`/`aria-describedby` on form errors, focus trapping in modals.
- **Brand color**: Purple `#7C3AED` (secondary in Tailwind config).
- **Charts**: Converted from chart.js to Recharts only.

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

## Project Config

- `vite.config.ts` — Vite + React plugin
- `tailwind.config.js` — Custom palette (primary/secondary/accent/success/warning/error/info/dark/neutral), Ginto + Inter fonts, custom animations
- `tsconfig.json` — TypeScript strict mode
- `eslint.config.js` — ESLint flat config
