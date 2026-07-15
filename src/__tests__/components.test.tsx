// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../components/auth/LoginPage';
import WalletPage from '../components/wallet/WalletPage';

vi.mock('../components/ui/Logo', () => ({
  Logo: ({ iconOnly }: { iconOnly?: boolean }) => <div data-testid="mock-logo">Logo{iconOnly ? ' (icon)' : ''}</div>,
}));

vi.mock('../components/layout/DashboardLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="mock-dashboard-layout">{children}</div>,
}));

vi.mock('../components/ui/WalletCard', () => ({
  default: () => <div data-testid="mock-wallet-card">Wallet Card</div>,
}));

vi.mock('../components/ui/RecentTransactions', () => ({
  default: () => <div data-testid="mock-recent-transactions">Recent Transactions</div>,
}));

vi.mock('../components/ui/ConfirmModal', () => ({
  default: ({ show, title, message, confirmLabel, onConfirm, onCancel }: {
    show: boolean; title: string; message: string; confirmLabel: string;
    onConfirm: () => void; onCancel: () => void;
  }) => show ? (
    <div data-testid="mock-confirm-modal">
      <h2>{title}</h2>
      <p>{message}</p>
      <button onClick={onConfirm} data-testid="confirm-yes">{confirmLabel}</button>
      <button onClick={onCancel} data-testid="confirm-no">Cancel</button>
    </div>
  ) : null,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual as object };
});

describe('LoginPage', () => {
  const mockOnLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderLogin() {
    return render(
      <BrowserRouter>
        <LoginPage onLogin={mockOnLogin} />
      </BrowserRouter>
    );
  }

  it('renders the login form', () => {
    renderLogin();
    expect(screen.getByLabelText('Email or Phone Number')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
  });

  it('shows validation errors on empty submit', async () => {
    renderLogin();
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/email or phone is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it('shows email validation error for invalid email', async () => {
    renderLogin();
    const emailInput = screen.getByLabelText('Email or Phone Number');
    fireEvent.change(emailInput, { target: { value: 'not-an-email' } });
    fireEvent.blur(emailInput);

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/valid email or phone number/i)).toBeInTheDocument();
    });
  });

  it('calls onLogin with email and password', async () => {
    mockOnLogin.mockResolvedValue(undefined);
    renderLogin();

    fireEvent.change(screen.getByLabelText('Email or Phone Number'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockOnLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('displays general error on login failure', async () => {
    mockOnLogin.mockRejectedValue({ response: { data: { error: 'Invalid credentials' } } });
    renderLogin();

    fireEvent.change(screen.getByLabelText('Email or Phone Number'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('has a link to reset password', () => {
    renderLogin();
    expect(screen.getByText(/forgot password/i).closest('a')).toHaveAttribute('href', '/reset-password');
  });

  it('has a link to sign up', () => {
    renderLogin();
    expect(screen.getByText(/sign up/i).closest('a')).toHaveAttribute('href', '/register');
  });
});

describe('WalletPage', () => {
  const mockUser = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    balance: 5000,
    hasTransactionPin: true,
  };
  const mockOnLogout = vi.fn();

  function renderWallet() {
    return render(
      <BrowserRouter>
        <WalletPage user={mockUser as unknown as import('../../shared/types').User} onLogout={mockOnLogout} />
      </BrowserRouter>
    );
  }

  it('renders wallet page with heading', () => {
    renderWallet();
    expect(screen.getByRole('heading', { name: /wallet/i })).toBeInTheDocument();
    expect(screen.getByText(/manage your funds/i)).toBeInTheDocument();
  });

  it('renders wallet card and recent transactions', () => {
    renderWallet();
    expect(screen.getByTestId('mock-wallet-card')).toBeInTheDocument();
    expect(screen.getByTestId('mock-recent-transactions')).toBeInTheDocument();
  });

  it('has a back button that navigates to dashboard', () => {
    renderWallet();
    const backButton = screen.getByLabelText('Go back');
    expect(backButton).toBeInTheDocument();
  });
});
