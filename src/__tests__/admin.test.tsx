import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminDashboard from '../components/admin/AdminDashboard';
import AdminProfile from '../components/admin/AdminProfile';
import UserManagement from '../components/admin/UserManagement';

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

function Wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AreaChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Area: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Pie: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Cell: () => <div />,
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode }) => <div {...props}>{children}</div>,
    tr: ({ children, ...props }: { children: React.ReactNode }) => <tr {...props}>{children}</tr>,
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual as object };
});

describe('AdminDashboard', () => {
  it('renders without crashing', () => {
    const { container } = render(<AdminDashboard />, { wrapper: Wrapper });
    expect(container).toBeTruthy();
  });

  it('renders dashboard header with correct title', async () => {
    render(<AdminDashboard />, { wrapper: Wrapper });
    expect(await screen.findByRole('heading', { name: /dashboard overview/i })).toBeInTheDocument();
  });
});

describe('AdminProfile', () => {
  it('renders without crashing', () => {
    const { container } = render(<AdminProfile />, { wrapper: Wrapper });
    expect(container).toBeTruthy();
  });

  it('renders profile form with user fields', () => {
    render(<AdminProfile />, { wrapper: Wrapper });
    expect(screen.getByText('Admin Profile')).toBeInTheDocument();
    expect(screen.getByText('Full Name')).toBeInTheDocument();
    expect(screen.getByText('Email Address')).toBeInTheDocument();
    expect(screen.getByText('Phone Number')).toBeInTheDocument();
    expect(screen.getByText('Role')).toBeInTheDocument();
  });
});

describe('UserManagement', () => {
  it('renders without crashing', () => {
    const { container } = render(<UserManagement />, { wrapper: Wrapper });
    expect(container).toBeTruthy();
  });

  it('renders user list heading', async () => {
    render(<UserManagement />, { wrapper: Wrapper });
    expect(await screen.findByRole('heading', { name: /user management/i })).toBeInTheDocument();
  });

  it('renders stat cards', async () => {
    render(<UserManagement />, { wrapper: Wrapper });
    expect(await screen.findByText('Total Users')).toBeInTheDocument();
    expect(await screen.findByText('Active Users')).toBeInTheDocument();
  });
});
