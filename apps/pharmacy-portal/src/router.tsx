import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth.store';

const SignInPage        = React.lazy(() => import('./features/auth/pages/SignInPage'));
const SignUpPage        = React.lazy(() => import('./features/auth/pages/SignUpPage'));
const VerifyEmailPage   = React.lazy(() => import('./features/auth/pages/VerifyEmailPage'));
const ForgotPasswordPage = React.lazy(() => import('./features/auth/pages/ForgotPasswordPage'));
const DashboardPage     = React.lazy(() => import('./features/dashboard/pages/DashboardPage'));
const MyOrdersPage      = React.lazy(() => import('./features/my-orders/pages/MyOrdersPage'));
const ProfilePage       = React.lazy(() => import('./features/profile/pages/ProfilePage'));
const AppLayout         = React.lazy(() => import('./components/AppLayout'));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/sign-in" replace />;
  return <>{children}</>;
}

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/dashboard" replace /> },
  { path: '/sign-in', element: <SignInPage /> },
  { path: '/sign-up', element: <SignUpPage /> },
  { path: '/verify-email', element: <VerifyEmailPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  {
    element: (
      <ProtectedRoute>
        <React.Suspense fallback={<div className="flex h-screen items-center justify-center">Loading…</div>}>
          <AppLayout />
        </React.Suspense>
      </ProtectedRoute>
    ),
    children: [
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/my-orders', element: <MyOrdersPage /> },
      { path: '/profile',   element: <ProfilePage /> },
    ],
  },
]);
