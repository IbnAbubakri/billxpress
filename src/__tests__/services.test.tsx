// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AirtimePage from '../components/services/AirtimePage';
import DataPage from '../components/services/DataPage';
import TVSubscriptionPage from '../components/services/TVSubscriptionPage';
import ElectricityPage from '../components/services/ElectricityPage';
import EducationPage from '../components/services/EducationPage';
import BettingPage from '../components/services/BettingPage';
import AirtimeToCashPage from '../components/services/AirtimeToCashPage';

vi.mock('../components/layout/DashboardLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="mock-dashboard-layout">{children}</div>,
}));

vi.mock('../components/ui/ConfirmModal', () => ({
  default: ({ show, title, message, confirmLabel, onConfirm, onCancel, children }: {
    show: boolean; title: string; message: string; confirmLabel: string;
    onConfirm: () => void; onCancel: () => void; children?: React.ReactNode;
  }) => show ? (
    <div data-testid="mock-confirm-modal">
      <h2>{title}</h2>
      <p>{message}</p>
      {children}
      <button onClick={onConfirm}>{confirmLabel}</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ) : null,
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode }) => (
      <div {...props}>{children}</div>
    ),
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual as object };
});

const mockUser = {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  balance: 5000,
  hasTransactionPin: true,
};
const mockOnLogout = vi.fn();

function renderService(Component: React.ComponentType<{ user: User | null; onLogout: () => void }>) {
  return render(
    <BrowserRouter>
      <Component user={mockUser as User} onLogout={mockOnLogout} />
    </BrowserRouter>
  );
}

describe('AirtimePage', () => {
  it('renders airtime purchase form', () => {
    renderService(AirtimePage);
    expect(screen.getByRole('heading', { name: /buy airtime/i })).toBeInTheDocument();
  });
});

describe('DataPage', () => {
  it('renders data bundle options', () => {
    renderService(DataPage);
    expect(screen.getByRole('heading', { name: /buy data/i })).toBeInTheDocument();
  });
});

describe('TVSubscriptionPage', () => {
  it('renders TV subscription options', () => {
    renderService(TVSubscriptionPage);
    expect(screen.getByRole('heading', { name: /tv subscription/i })).toBeInTheDocument();
  });
});

describe('ElectricityPage', () => {
  it('renders electricity payment options', () => {
    renderService(ElectricityPage);
    expect(screen.getByRole('heading', { name: /electricity bills/i })).toBeInTheDocument();
  });
});

describe('EducationPage', () => {
  it('renders exam payment options', () => {
    renderService(EducationPage);
    expect(screen.getByRole('heading', { name: /education payments/i })).toBeInTheDocument();
  });
});

describe('BettingPage', () => {
  it('renders betting deposit options', () => {
    renderService(BettingPage);
    expect(screen.getByRole('heading', { name: /betting payments/i })).toBeInTheDocument();
  });
});

describe('AirtimeToCashPage', () => {
  it('renders airtime swap form', () => {
    renderService(AirtimeToCashPage);
    expect(screen.getByRole('heading', { name: /airtime to cash/i })).toBeInTheDocument();
  });
});
