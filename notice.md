# Onboarding Audit: BillXpress

## Current Flow Summary

```
Landing Page (/) → Register (/register) → 4-step wizard:
  1. Phone → 2. OTP → 3. KYC (name/email) → 4. Password
→ Auto-login → Dashboard (/dashboard) → ProfileCompletion checklist (5 steps)
→ SetPinModal (if no PIN set)
```

---

## AUDIT FINDINGS

### 1. Security Issues

| # | Severity | Finding | Location |
|---|----------|---------|----------|
| **S-1** | **HIGH** | `emailVerified` defaults to `true` in `toUser()` when data is missing. New users might bypass email verification if the API returns incomplete data. | `useAuth.ts:50` |
| **S-2** | **HIGH** | OTP debug code is stored in state and rendered in the DOM (`otpDebugCode`). In demo mode, this is fine, but the variable is always present in state — a future config mistake would expose OTP in production. No guard ensures this is only active in demo mode on the client. | `RegisterPage.tsx:30,251-254` |
| **S-3** | **MEDIUM** | Password validation in `RegisterPage` (step 4) duplicates `validation.ts` logic inline instead of using `validatePassword()`. If rules diverge, client-side and in-component validation will disagree. | `RegisterPage.tsx:122-126` |
| **S-4** | **MEDIUM** | `ResetPasswordPage` only checks `length < 12` for the new password — missing uppercase/lowercase/digit/special checks. Server will reject, but UX shows a weaker error message. | `ResetPasswordPage.tsx:47` |
| **S-5** | **LOW** | OTP `verifyOtp` has no rate limiting on the client. Users can spam the "Verify" button. Server has no attempt limit on OTP verification (only on OTP *sending*). | `RegisterPage.tsx:89-103`, `auth.service.js:643-656` |

### 2. UX / Flow Issues

| # | Severity | Finding | Location |
|---|----------|---------|----------|
| **U-1** | **HIGH** | **No welcome/success screen after registration.** User goes from "Creating Account..." spinner directly to dashboard with no confirmation, no "check your email" nudge, and no explanation of what to do next. | `RegisterPage.tsx:132-133` → `App.tsx:90-91` |
| **U-2** | **HIGH** | **Email verification is disconnected from onboarding.** After registration, user lands on dashboard. The `ProfileCompletion` widget shows "Verify email" as step 2, but there's no prominent banner or modal prompting them to verify email immediately. The verification email is only a `stubEmail` log in demo mode. | `Dashboard.tsx:49`, `auth.service.js:279,607-609` |
| **U-3** | **MEDIUM** | **ProfileCompletion step descriptions are misleading.** Step 3 says "Start paying your bills" but it's about adding billing/home addresses — not about making payments. Users may be confused. | `ProfileCompletion.tsx:12` |
| **U-4** | **MEDIUM** | **SetPinModal uses `sessionStorage` to avoid re-prompting.** If the user closes the modal and navigates away, they won't be prompted again until a new session. But there's no way to manually trigger PIN setup from the dashboard or profile. | `SetPinModal.tsx:19` |
| **U-5** | **MEDIUM** | **No "skip for now" option on ProfileCompletion steps.** Users who don't have their BVN or bank details handy have no way to dismiss the checklist. The collapse button only hides the list, the widget stays on the dashboard. | `ProfileCompletion.tsx:71-73` |
| **U-6** | **LOW** | **KYC step (step 3) collects name+email but no loading/feedback.** The "Continue" button is enabled as soon as fields are filled, with no visual indication that data is being validated or stored. | `RegisterPage.tsx:287-316` |
| **U-7** | **LOW** | **No keyboard submit on phone/KYC steps.** Step 1 (phone) and Step 3 (KYC) use `onClick` buttons instead of `<form onSubmit>`, so pressing Enter doesn't advance. Steps 2 and 4 do support Enter. | `RegisterPage.tsx:228,313` |

### 3. Accessibility Issues

| # | Severity | Finding | Location |
|---|----------|---------|----------|
| **A-1** | **MEDIUM** | OTP inputs lack `autocomplete="one-time-code"` attribute, which would help password managers and mobile keyboards suggest the OTP from SMS. | `RegisterPage.tsx:260-273` |
| **A-2** | **MEDIUM** | `BasicInfoModal` input fields have no `dark:text-white` or `dark:bg-dark-800` classes — they'll be unreadable in dark mode. | `BasicInfoModal.tsx:84-86,105-107,etc.` |
| **A-3** | **MEDIUM** | `BVNModal` and `BankDetailsModal` also lack dark mode styling on inputs. | `BVNModal.tsx:45-47`, `BankDetailsModal.tsx:57-59` |
| **A-4** | **LOW** | `ProfileCompletion` step list items don't have `role="button"` or keyboard handlers for non-completed steps — screen readers won't know they're clickable. | `ProfileCompletion.tsx:77-80` |

### 4. Code Quality Issues

| # | Severity | Finding | Location |
|---|----------|---------|----------|
| **C-1** | **MEDIUM** | `RegisterPage` receives `onRegister` as a prop but also calls `useAuth()` directly for `handleCheckPhone`, `handleSendOtp`, `handleVerifyOtp`. This creates two paths to auth state — the prop-based and the hook-based approach. Inconsistent pattern. | `RegisterPage.tsx:8-9,14` |
| **C-2** | **MEDIUM** | `BasicInfoModal` has its own local `User` icon import from `lucide-react` which shadows the `User` type from the codebase. The component also redefines `BasicInfo` interface locally instead of importing from `types`. | `BasicInfoModal.tsx:1,3-14` |
| **C-3** | **LOW** | `emailVerified` defaults differ between `useAuth.ts` (`true` at line 50) and `auth.service.js` (actual DB value). If the API response doesn't include the field, the client assumes verified. | `useAuth.ts:50` |

### 5. Missing Features / Gaps

| # | Severity | Finding | Description |
|---|----------|---------|-------------|
| **M-1** | **HIGH** | **No terms of service / privacy policy acceptance during registration.** For a fintech app handling BVN, bank details, and NIN, this is a compliance risk. | `RegisterPage.tsx` |
| **M-2** | **HIGH** | **No "resend OTP" countdown timer.** The "Resend code" button appears immediately after OTP is sent with no cooldown, enabling OTP spam. | `RegisterPage.tsx:246-249` |
| **M-3** | **MEDIUM** | **No phone number change option after registration.** If a user enters the wrong phone number, there's no way to change it without contacting support. | `ProfilePage.tsx` |
| **M-4** | **MEDIUM** | **No onboarding analytics/tracking.** No events are fired at registration steps, OTP verification, profile completion milestones. Makes it impossible to measure drop-off rates. | N/A |
| **M-5** | **LOW** | **No "complete setup later" CTA on the dashboard empty state.** The welcome card has "Buy Airtime" and "Buy Data" but no nudge to complete profile first. | `Dashboard.tsx:60-85` |

---

## RECOMMENDED FIX PLAN

### Phase 1: Critical Security & Compliance (Do First)

1. **S-1 + C-3**: Change `toUser()` `emailVerified` default from `true` to `false`
2. **M-1**: Add Terms of Service checkbox to registration step 4 (password)
3. **S-2**: Add a build-time guard or `process.env.NODE_ENV` check to ensure OTP debug code never reaches production
4. **U-2**: Add a prominent email verification banner/modal immediately after registration
5. **M-2**: Add a 60-second countdown timer on the OTP resend button

### Phase 2: UX Improvements

6. **U-1**: Add a success/welcome screen after registration with "Verify your email" CTA
7. **U-3**: Fix ProfileCompletion step 3 description to "Add your address information"
8. **S-3 + S-4**: Use `validatePassword()` from `validation.ts` in both RegisterPage and ResetPasswordPage
9. **U-7**: Wrap phone and KYC steps in `<form onSubmit>` for Enter key support
10. **U-4**: Add a "Set Transaction PIN" option to the Profile page security tab

### Phase 3: Accessibility & Polish

11. **A-1**: Add `autocomplete="one-time-code"` to OTP inputs
12. **A-2 + A-3**: Fix dark mode styling on BasicInfoModal, BVNModal, BankDetailsModal inputs
13. **A-4**: Add `role="button"`, `tabIndex={0}`, and `onKeyDown` to clickable ProfileCompletion steps
14. **U-5**: Add "Skip for now" dismiss option to ProfileCompletion widget

### Phase 4: Code Quality

15. **C-1**: Refactor RegisterPage to use only `useAuth()` hook (remove `onRegister` prop, or remove direct hook usage)
16. **C-2**: Import `BasicInfo` from `types` instead of redefining, remove conflicting `User` import

### Phase 5: Analytics & Monitoring

17. **M-4**: Add tracking events for: registration_started, step_completed, registration_completed, email_verified, profile_step_completed
