import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('redirects from / to /login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });

  test('login page has correct title', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle('BillXpress');
  });
});

test.describe('Login Page Structure', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('displays welcome heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
  });

  test('displays sign in subtext', async ({ page }) => {
    await expect(page.getByText('Sign in to your BillXpress account')).toBeVisible();
  });

  test('has email input field', async ({ page }) => {
    const emailInput = page.locator('#email');
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute('type', 'email');
  });

  test('has password input field', async ({ page }) => {
    const passwordInput = page.locator('#password');
    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('has Sign In button', async ({ page }) => {
    const signInButton = page.getByRole('button', { name: 'Sign In' });
    await expect(signInButton).toBeVisible();
  });

  test('has remember me checkbox', async ({ page }) => {
    const rememberMe = page.locator('#remember-me');
    await expect(rememberMe).toBeVisible();
  });

  test('has forgot password link', async ({ page }) => {
    const forgotPassword = page.getByRole('link', { name: 'Forgot password?' });
    await expect(forgotPassword).toBeVisible();
    await expect(forgotPassword).toHaveAttribute('href', '/reset-password');
  });

  test('has sign up link to register page', async ({ page }) => {
    const signUpLink = page.getByRole('link', { name: 'Sign up' });
    await expect(signUpLink).toBeVisible();
    await expect(signUpLink).toHaveAttribute('href', '/register');
  });
});

test.describe('Login Form Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('shows email error for invalid email', async ({ page }) => {
    const emailInput = page.locator('#email');
    await emailInput.fill('notanemail');
    await emailInput.blur();
    await expect(page.locator('#email-error')).toBeVisible();
  });

  test('shows password error when empty on submit', async ({ page }) => {
    const emailInput = page.locator('#email');
    await emailInput.fill('test@example.com');
    const signInButton = page.getByRole('button', { name: 'Sign In' });
    await signInButton.click();
    await expect(page.locator('#password-error')).toBeVisible();
  });

  test('shows email error when empty on submit', async ({ page }) => {
    const signInButton = page.getByRole('button', { name: 'Sign In' });
    await signInButton.click();
    await expect(page.locator('#email-error')).toBeVisible();
  });

  test('toggles password visibility', async ({ page }) => {
    const passwordInput = page.locator('#password');
    await expect(passwordInput).toHaveAttribute('type', 'password');
    const toggleButton = page.getByRole('button', { name: 'Show password' });
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
    const hideButton = page.getByRole('button', { name: 'Hide password' });
    await hideButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });
});

test.describe('Register Page', () => {
  test('navigates to register page from login', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: 'Sign up' }).click();
    await expect(page).toHaveURL(/\/register/);
  });

  test('register page has all form fields', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('#firstName')).toBeVisible();
    await expect(page.locator('#lastName')).toBeVisible();
    await expect(page.locator('#registerEmail')).toBeVisible();
    await expect(page.locator('#phone')).toBeVisible();
    await expect(page.locator('#registerPassword')).toBeVisible();
    await expect(page.locator('#confirmPassword')).toBeVisible();
  });

  test('register page has Create Account button', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();
  });

  test('register page has sign in link back to login', async ({ page }) => {
    await page.goto('/register');
    const signInLink = page.getByRole('link', { name: 'Sign in' });
    await expect(signInLink).toBeVisible();
    await signInLink.click();
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Responsive Design', () => {
  test('login page renders correctly on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });

  test('register page renders correctly on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/register');
    await expect(page.locator('#firstName')).toBeVisible();
    await expect(page.locator('#lastName')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();
  });
});

test.describe('Dark Mode', () => {
  test('toggles dark mode via localStorage', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('billxpress-theme', 'dark');
    });
    await page.reload();
    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/);
  });

  test('removes dark mode via localStorage', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.removeItem('billxpress-theme');
    });
    await page.reload();
    const html = page.locator('html');
    await expect(html).not.toHaveClass(/dark/);
  });
});

test.describe('Reset Password Page', () => {
  test('is accessible via link', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: 'Forgot password?' }).click();
    await expect(page).toHaveURL(/\/reset-password/);
  });
});

test.describe('Page Redirects', () => {
  test('unknown route redirects to login', async ({ page }) => {
    await page.goto('/nonexistent-page');
    await expect(page).toHaveURL(/\/login/);
  });
});
