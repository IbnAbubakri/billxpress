# Frontend Audit: BillXpress Fintech App

## 1. Architecture & Project Structure

| Issue | Severity | Detail |
|---|---|---|
| Monolithic `DashboardLayout.tsx` | High | 271 lines containing sidebar, mobile nav, notification bell, theme toggle, logout. Should be split into `Sidebar`, `MobileNav`, `NotificationBell`, `ThemeToggle`. |
| AdminLayout has no dark mode | High | Uses hardcoded `bg-neutral-50`, `bg-white`, `border-neutral-200`, `text-black` — no `dark:` variants anywhere. |
| No route-level guards | Medium | Auth gating via ternary `<Route>` trees instead of a `ProtectedRoute` component. Adding/removing `<Route>` resets component state. |
| JSON file storage on backend | High | `users.json`, `refresh-tokens.json`, `sessions.json`, `login-attempts.json` — no atomic writes, no concurrency safety. |
| `api/index.js` dead code | Low | Root-level Vercel serverless function appears unused. |

## 2. Frontend Code Quality

| Issue | Severity | Detail |
|---|---|---|
| DashboardLayout renders sidebar twice | High | Desktop sidebar and mobile sidebar are entirely duplicated JSX. |
| Inline arrow functions in nav | Medium | Every nav `<button>` creates new function reference on every render. |
| Nav uses `<button>` instead of `<Link>` | Low | AdminLayout uses `<Link>` correctly; DashboardLayout uses `<button onClick={() => navigate()}>` — breaks right-click → open in new tab. |
| ProfileCompletion inline modals | Medium | Each step modal is defined inline, duplicating logic extracted to `components/profile/`. |
| `useToast` setTimeout never cleaned up | High | `addToast` calls `setTimeout(..., 4000)` without storing timer ID. If unmounts before 4s, setState fires on unmounted component. |
| No error boundaries per page | Medium | Only one global ErrorBoundary. |
| `catch (err: any)` in App.tsx | Low | Sidesteps TypeScript checking. |

## 3. Backend Code Quality

| Issue | Severity | Detail |
|---|---|---|
| Login revokes ALL sessions | High | `loginResponse()` revokes all existing sessions on every login — logs out other devices. |
| `forgotPassword` returns resetToken | High | Reset token leaked in JSON response. |
| No rate limiting on register | Medium | Unlimited account creation. |
| HTML sanitization insufficient | Medium | Only strips `<...>` tags, not attribute-based XSS. |
| audit.json grows unbounded | Medium | No rotation, pagination, or size cap. |
| No `Strict-Transport-Security` | Low | Missing HSTS header. |

## 4. Security

| Issue | Severity | Detail |
|---|---|---|
| CSRF cookie is `httpOnly` but double-submit pattern requires JS access | High | The cookie is set `httpOnly: true`, preventing JS from reading it. But the CSRF double-submit pattern requires JS to read the cookie value and send it as a header. The token is fetched via `/csrf-token` endpoint, but an XSS attacker could read the response. Should be non-httpOnly or use a different pattern. |
| JWT_SECRET auto-generated per restart | Medium | Invalidates all JWTs on server restart. |
| No email verification | Medium | New users get `emailVerified: true` automatically. |
| MFA backup codes stored as hashes | Medium | Actually handled correctly (SHA-256 hashes), but the implementation stores them inline in user objects. |

## 5. Performance

| Issue | Severity | Detail |
|---|---|---|
| Firebase SDK bundled but unused | Medium | `firebase: ^12.1.0` in package.json, zero imports in code. ~150KB dead code. |
| Images vary wildly in size | Medium | 9mobile.png is 405KB while SVGs are tiny. No optimization pipeline. |
| recharts imported eagerly | Medium | 313KB bundle (94KB gzip) loaded even if user never scrolls to charts. |
| No image CDN | Low | No responsive images, no preloading. |

## 6. Accessibility

| Issue | Severity | Detail |
|---|---|---|
| Color contrast in sidebar nav | High | Active item uses `bg-primary text-secondary` — low contrast. |
| Missing `type="button"` on buttons | Medium | Defaults to `type="submit"` inside forms. |
| No `aria-expanded` on hamburger | Medium | Doesn't indicate sidebar open/closed state. |
| No skip-to-content link | Low | Keyboard users can't skip navigation. |

## 7. TypeScript

| Issue | Severity | Detail |
|---|---|---|
| DashboardLayout/AdminLayout use `React.FC` | Low | Inconsistent with page components now using plain function signatures. |
| `Record<string, unknown>` for profile data | Medium | Loses type safety — should use mapped type from User interface. |

## 8. State Management

| Issue | Severity | Detail |
|---|---|---|
| No React Query / SWR | Medium | Raw useState+useEffect for all data fetching. No caching, deduplication, or retry. |
| Auth state not persisted | Medium | Relies on getMe() on mount — loading flash on every refresh. |

## 9. Testing

| Issue | Severity | Detail |
|---|---|---|
| Zero tests | Critical | No unit, integration, or E2E tests. Fintech app with no testing is a business risk. |
| No linting in CI | Medium | ESLint configured but not run in CI or pre-commit. |

## 10. DevOps

| Issue | Severity | Detail |
|---|---|---|
| `server/.env` committed | High | Potentially contains secrets, tracked in git. |
| No dependency scanning | Medium | No `npm audit` or vulnerability check. |
| No prettier/formatting config | Low | Inconsistent file formatting. |

## Priority Order for Fixes

1. **Zero tests** — Add testing framework, write tests for critical paths.
2. **CSRF httpOnly cookie** — Fix so JS can read it (required for double-submit pattern).
3. **Login revokes all sessions** — Don't destroy existing sessions on new login.
4. **forgotPassword leaks token** — Remove `resetToken` from API response.
5. **AdminLayout dark mode** — Add `dark:` variants.
6. **useToast setTimeout leak** — Clean up timer on unmount.
7. **Rate limit on register** — Add express-rate-limit.
8. **Sidebar duplication** — Refactor to single JSX with responsive CSS.
9. **Firebase bundle cleanup** — Remove unused dependency.
10. **Add `type="button"`** — To all nav buttons.
11. **`catch (err: any)` → `unknown`** — Type narrowing.
12. **Image optimization** — Convert to WebP/AVIF where possible.
13. **Split DashboardLayout** — Extract Sidebar, MobileNav, NotificationBell.
