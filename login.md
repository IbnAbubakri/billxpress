# Login Security Audit — BillXpress

## Executive Summary

The authentication system demonstrates **strong security fundamentals** with multiple layers of defense. The architecture follows modern best practices for a fintech application. However, there are several **critical, high, and medium severity issues** that should be addressed.

---

## CRITICAL Findings

### C-1: Weak JWT Secret in Production Environment
**File:** `server/.env:4`
```
JWT_SECRET=change-this-to-a-long-random-string-in-production
```
**Risk:** The default JWT secret is committed to the repository. While `env.js:26-28` prevents startup in production with this value, the secret is visible in version control history.
**Impact:** If an attacker gains access to the repo, they can forge JWT tokens and impersonate any user.
**Recommendation:** Rotate the JWT secret immediately in production. Remove the default value from `.env` and use only environment variables. Add `.env` to `.gitignore` if not already present.

---

### C-2: OTP Returned in Response Body (Demo Mode)
**File:** `server/src/services/auth.service.js:611-613`
```javascript
if (!process.env.SMS_PROVIDER) {
  response.code = code;
}
```
**Risk:** The OTP code is returned in the API response when SMS is not configured. This means anyone can intercept the code by inspecting network traffic.
**Impact:** Complete bypass of phone verification in demo mode.
**Recommendation:** Remove this debug code or gate it behind a strict development-only flag that cannot be enabled in staging/production.

---

## HIGH Findings

### H-1: No Rate Limiting on `/check-email` Endpoint
**File:** `server/src/routes/auth.routes.js:95`
```javascript
router.post('/check-email', validateCsrf, handleCheckEmail);
```
**Risk:** An attacker can enumerate valid email addresses by brute-forcing this endpoint without rate limiting.
**Impact:** User enumeration, enabling targeted attacks.
**Recommendation:** Add a rate limiter (e.g., 10 requests/15 minutes per IP).

---

### H-2: CSRF Token Not Bound to User Session
**File:** `server/src/middleware/csrf.middleware.js:7-20`
**Risk:** The CSRF token is set as a plain cookie without binding to a specific session or user. An attacker who can set cookies (via subdomain XSS or cookie injection) could potentially bypass CSRF protection.
**Impact:** CSRF attacks could perform state-changing operations.
**Recommendation:** Consider binding the CSRF token to the session ID or using a double-submit pattern with session binding.

---

### H-3: Admin Login Uses Same Endpoint as Regular Login
**File:** `src/components/auth/AdminLogin.tsx:25-26`
```javascript
const result = await handleLogin(formData.email, formData.password);
if (result.user && result.user.role === 'admin') {
```
**Risk:** The admin login uses the same `/api/auth/login` endpoint. An attacker can attempt admin credentials without any additional protection (e.g., separate rate limiting, IP restrictions).
**Impact:** Increased attack surface for admin accounts.
**Recommendation:** Consider adding IP-based restrictions or a separate admin login endpoint with stricter rate limiting.

---

### H-4: Session ID Cookie Missing `httpOnly` in Some Cases
**File:** `server/src/controllers/auth.controller.js:44-50`
The session ID cookie is correctly set with `httpOnly: true`, but the `sessionId` is also included in the JWT payload (`auth.controller.js:41`). If the JWT is ever exposed (e.g., via XSS), the session ID is compromised.
**Risk:** Session hijacking if JWT is exposed.
**Impact:** Account takeover.
**Recommendation:** Consider not including the session ID in the JWT payload, or validate session ownership more strictly.

---

## MEDIUM Findings

### M-1: No Account Lockout Notification to User
**File:** `server/src/services/auth.service.js:280`
```javascript
throw new AppError('Account temporarily locked. Try again later.', 423);
```
**Risk:** Users are not notified when their account is locked (e.g., via email). This could lead to confusion and support requests.
**Impact:** Poor user experience, potential for social engineering.
**Recommendation:** Send an email notification when an account is locked due to failed attempts.

---

### M-2: Password History Check Uses bcrypt.compare in Loop
**File:** `server/src/services/auth.service.js:366-369`
```javascript
for (const oldHash of passwordHistory) {
  if (await bcrypt.compare(newPassword, oldHash)) {
```
**Risk:** Iterating through password history with bcrypt comparisons is computationally expensive (each comparison takes ~100ms with 12 rounds).
**Impact:** Potential DoS if an attacker triggers many password resets.
**Recommendation:** Limit password history to 3-5 entries (currently 5, which is acceptable). Consider using a faster hash for history comparison if performance becomes an issue.

---

### M-3: Missing `X-Content-Type-Options` Header
**File:** `server/src/app.js:24-38`
Helmet is configured but `xContentTypeOptions` is not explicitly set (though Helmet defaults it to `nosniff`).
**Risk:** Browser MIME-type sniffing could lead to security issues.
**Impact:** Low, but should be explicitly configured.
**Recommendation:** Add `xContentTypeOptions: { noSniff: true }` to Helmet config.

---

### M-4: CORS Origin is Hardcoded
**File:** `server/src/app.js:54-57`
```javascript
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}));
```
**Risk:** The CORS origin is loaded from environment variables, but the default in `env.js` is `http://localhost:5173`. If not properly configured in production, this could allow unauthorized origins.
**Impact:** CSRF attacks from unauthorized origins.
**Recommendation:** Ensure `CORS_ORIGIN` is set to the exact production domain in all environments.

---

### M-5: No Password Complexity Client-Side Enforcement
**File:** `src/components/auth/LoginPage.tsx`
**Risk:** The login form does not enforce password complexity on the client side (which is correct for login, but the registration form should be checked).
**Impact:** None for login, but registration should be validated.
**Recommendation:** Verify that registration enforces complexity requirements client-side.

---

## LOW Findings

### L-1: Debug Mode Leaks Stack Traces
**File:** `server/src/middleware/error.middleware.js:14`
```javascript
...(env.isDev() && !err.isOperational && { stack: err.stack }),
```
**Risk:** Stack traces are exposed in development mode.
**Impact:** Information disclosure in development.
**Recommendation:** Ensure `NODE_ENV=production` in all non-development environments.

---

### L-2: No `SameSite` Attribute on CSRF Cookie
**File:** `server/src/middleware/csrf.middleware.js:12-18`
The CSRF cookie has `sameSite: 'strict'`, which is correct. However, the `httpOnly` is set to `false` (intentionally, for JavaScript access).
**Risk:** Low, but the cookie is accessible to JavaScript.
**Impact:** If XSS exists, the CSRF token can be stolen.
**Recommendation:** This is by design for the double-submit pattern, but ensure XSS protections are robust.

---

### L-3: No Login Attempt Logging for Successful Logins
**File:** `server/src/services/auth.service.js:329`
```javascript
logAction({ userId: user.id, action: 'LOGIN', details: { email: user.email }, ip, userAgent });
```
**Risk:** Successful logins are logged, but the IP and user agent could provide more detail.
**Impact:** Low, but better logging aids incident response.
**Recommendation:** Include more context in login logs (e.g., MFA status, session ID).

---

## Recommendations Summary

| Priority | Action | Files to Modify |
|----------|--------|-----------------|
| **Critical** | Rotate JWT secret in production, remove default from `.env` | `server/.env`, production env vars |
| **Critical** | Remove OTP debug code or gate behind strict flag | `server/src/services/auth.service.js` |
| **High** | Add rate limiting to `/check-email` | `server/src/routes/auth.routes.js` |
| **High** | Consider separate admin login endpoint or IP restrictions | `server/src/routes/auth.routes.js`, `AdminLogin.tsx` |
| **Medium** | Send account lockout notifications | `server/src/services/auth.service.js` |
| **Medium** | Explicitly configure `xContentTypeOptions` | `server/src/app.js` |
| **Medium** | Validate CORS origin in production | `server/src/config/env.js` |
| **Low** | Ensure `NODE_ENV=production` in all non-dev environments | Deployment config |

---

## Positive Observations

1. **Strong password policy**: 12+ characters with complexity requirements, HIBP integration, and password history
2. **Proper bcrypt usage**: 12 salt rounds for passwords, 10 for transaction PINs
3. **CSRF protection**: Double-submit cookie pattern implemented correctly
4. **Rate limiting**: Per-endpoint rate limiters with appropriate thresholds
5. **Session management**: Idle timeout (30 min) and absolute lifetime (24 hours)
6. **Token rotation**: Refresh tokens are rotated on use
7. **Input validation**: Server-side validation with sanitization
8. **Security headers**: Helmet configured with HSTS, CSP, and other protections
9. **Audit logging**: Comprehensive logging of security events
10. **MFA support**: TOTP and backup codes implemented

---

**Overall Assessment:** The login system is **well-architected** with strong security controls. The critical issues should be addressed immediately, while high/medium issues should be resolved in the next release cycle. The system follows defense-in-depth principles and implements most OWASP recommendations for authentication.
