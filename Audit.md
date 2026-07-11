# 360° Audit Report — Login, Registration & User Database

## 1. Registration Flow (Real User)

**Steps:** Phone → OTP → Name/Email → Password

### What's collected and saved to DB

| Field | Collected at Registration | In DB | In `getUserById` |
|---|---|---|---|
| email | ✅ | ✅ | ✅ |
| password (hashed) | ✅ | ✅ | ❌ (correct) |
| name (first+last) | ✅ | ✅ | ✅ |
| phone | ✅ (OTP verified) | ✅ | ✅ |
| role | auto `'user'` | ✅ | ✅ |
| emailVerified | `0` (needs verification) | ✅ | ✅ |
| emailVerificationToken | auto-generated | ✅ | ❌ (correct) |
| createdAt | auto | ✅ | ✅ |
| passwordChangedAt | auto | ✅ | ❌ (not returned) |

### What's NOT collected at registration (all default to empty)

- `balance` → `0`
- `hasTransactionPin` → `0`
- `transactionPin` → `''`
- `bvn` → `''`
- `accountNumber` / `bankName` / `accountName` → `''`
- `billingStreet` / `billingCity` / `billingState` / `billingCountry` → `''`
- `homeStreet` / `homeCity` / `homeState` / `homeZip` → `''`
- `avatar` → `''`
- `dateOfBirth` → `''`
- `gender` → `''`
- `nin` → `''`
- `nextOfKin` → `'{}'`
- `employmentStatus` → `''`
- `annualIncome` → `''`
- All MFA fields → default

---

## 2. Demo User (Seed Data) vs Database

| Field | Demo Value | In DB | In `getUserById` |
|---|---|---|---|
| name | `'Abubakri Faaruq'` | ✅ | ✅ |
| phone | `'09061345507'` | ✅ | ✅ |
| balance | `250000.50` | ✅ | ✅ |
| hasTransactionPin | `1` | ✅ | ✅ |
| bvn | `'22334455667'` | ✅ | ✅ |
| accountNumber | `'0123456789'` | ✅ | ✅ |
| bankName | `'GTBank'` | ✅ | ✅ |
| accountName | `'Abubakri Faaruq'` | ✅ | ✅ |
| billingStreet | `'42 Marina Road'` | ✅ | ✅ |
| billingCity | `'Lagos Island'` | ✅ | ✅ |
| billingState | `'Lagos'` | ✅ | ✅ |
| billingCountry | `'Nigeria'` | ✅ | ✅ |
| homeStreet | `'15 Bode Thomas Street'` | ✅ | ✅ |
| homeCity | `'Surulere'` | ✅ | ✅ |
| homeState | `'Lagos'` | ✅ | ✅ |
| homeZip | `'101283'` | ✅ | ✅ |
| avatar | `''` | ✅ | ✅ |
| **dateOfBirth** | `''` | ✅ | **❌ MISSING** |
| **gender** | `''` | ✅ | **❌ MISSING** |
| **nin** | `''` | ✅ | **❌ MISSING** |
| **nextOfKin** | `'{}'` | ✅ | **❌ MISSING** |
| **employmentStatus** | `''` | ✅ | **❌ MISSING** |
| **annualIncome** | `''` | ✅ | **❌ MISSING** |

---

## 3. CRITICAL BUG: `getUserById` Strips 6 Fields

**File:** `server/src/services/auth.service.js:406-436`

The `getUserById` function (used by `/api/auth/me`, login response, profile update response, and password change) does **NOT** return these fields that exist in the DB and are returned by `rowToUser`:

1. **`dateOfBirth`**
2. **`gender`**
3. **`nin`**
4. **`nextOfKin`**
5. **`employmentStatus`**
6. **`annualIncome`**

### Impact

- Profile page KYC fields (DOB, gender, NIN, employment, income) always show **empty** even after being saved
- The `toUser()` mapper in `src/hooks/useAuth.ts:42-74` correctly maps these fields, but the API never sends them
- `updateUserProfile` saves to DB but returns via `getUserById`, so the frontend auth cache also loses them on save

---

## 4. Profile Page KYC Fields — Saved But Never Retrieved

**File:** `src/components/profile/ProfilePage.tsx:600-655`

The profile page has direct inputs for `dateOfBirth`, `gender`, `nin`, `employmentStatus`, `annualIncome` that call `onUpdateProfile` → `updateUserProfile` → saves to DB → returns via `getUserById` → **strips them**. These fields are silently lost on every save.

---

## 5. Registration vs Demo — What Real Users Are Missing

A real user after registration has **all** these empty that the demo user has filled:

| Category | Fields Missing from Real Users |
|---|---|
| Financial | `balance=0`, `bvn`, `accountNumber`, `bankName`, `accountName` |
| Billing Address | `billingStreet`, `billingCity`, `billingState`, `billingCountry` |
| Home Address | `homeStreet`, `homeCity`, `homeState`, `homeZip` |
| Identity | `dateOfBirth`, `gender`, `nin`, `nextOfKin` |
| Employment | `employmentStatus`, `annualIncome` |
| Security | `hasTransactionPin=0`, `transactionPin` |
| Profile | `avatar` |

---

## 6. Other Findings

### Password Policy Mismatch

Frontend `validatePassword()` in `src/utils/validation.ts:7-9` says min 6 chars, but backend requires min 12 with uppercase/lowercase/number/special. The register page correctly enforces 12+ but the generic validator is misleading.

### OTP Debug Code Leak

`src/components/auth/RegisterPage.tsx:64` sets `setOtpDebugCode(result.code)` — the OTP code is exposed in the UI as "Demo mode".

### Email/SMS Are Stub-Only

`stubEmail()` and `stubSms()` in `server/src/services/auth.service.js:589-637` just log to console. No real email/SMS delivery.

### Admin User Has Minimal Data

Only `name`, `phone`, `email`, `role`, `emailVerified` — no address/bank/KYC fields.

---

## Summary of Required Fixes

1. **Add the 6 missing fields to `getUserById`** (`dateOfBirth`, `gender`, `nin`, `nextOfKin`, `employmentStatus`, `annualIncome`) — this is the critical bug
2. Consider adding more fields to the registration flow if KYC is required at signup
3. The demo seed could also populate `dateOfBirth`, `gender`, `nin`, etc. for a more realistic demo experience
