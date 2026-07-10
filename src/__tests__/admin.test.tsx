import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AdminDashboard from '../components/admin/AdminDashboard';
import AdminProfile from '../components/admin/AdminProfile';
import UserManagement from '../components/admin/UserManagement';

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
    const { container } = render(<AdminDashboard />);
    expect(container).toBeTruthy();
  });

  it('renders dashboard header with correct title', () => {
    render(<AdminDashboard />);
    expect(screen.getByRole('heading', { name: /dashboard overview/i })).toBeInTheDocument();
  });
});

describe('AdminProfile', () => {
  it('renders without crashing', () => {
    const { container } = render(<AdminProfile />);
    expect(container).toBeTruthy();
  });

  it('renders profile form with user fields', () => {
    render(<AdminProfile />);
    expect(screen.getByText('Admin Profile')).toBeInTheDocument();
    expect(screen.getByText('Full Name')).toBeInTheDocument();
    expect(screen.getByText('Email Address')).toBeInTheDocument();
    expect(screen.getByText('Phone Number')).toBeInTheDocument();
    expect(screen.getByText('Role')).toBeInTheDocument();
  });
});

describe('UserManagement', () => {
  it('renders without crashing', () => {
    const { container } = render(<UserManagement />);
    expect(container).toBeTruthy();
  });

  it('renders user list heading', () => {
    render(<UserManagement />);
    expect(screen.getByRole('heading', { name: /user management/i })).toBeInTheDocument();
  });

  it('renders stat cards', () => {
    render(<UserManagement />);
    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('Active Users')).toBeInTheDocument();
    expect(screen.getAllByText('Suspended').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Pending').length).toBeGreaterThanOrEqual(1);
  });
});
