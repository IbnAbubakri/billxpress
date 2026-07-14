// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  isAuthenticated: boolean;
  isAdmin: boolean;
  requireAdmin?: boolean;
  redirectTo?: string;
  children: ReactNode;
}

function ProtectedRoute({
  isAuthenticated,
  isAdmin,
  requireAdmin = false,
  redirectTo = '/login',
  children,
}: ProtectedRouteProps) {
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
