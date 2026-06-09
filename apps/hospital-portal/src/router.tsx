import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth.store';

// Lazy-loaded pages — split by feature module (one feature = one module)
const SignInPage        = React.lazy(() => import('./features/auth/pages/SignInPage'));
const SignUpPage        = React.lazy(() => import('./features/auth/pages/SignUpPage'));
const VerifyEmailPage   = React.lazy(() => import('./features/auth/pages/VerifyEmailPage'));
const ForgotPasswordPage = React.lazy(() => import('./features/auth/pages/ForgotPasswordPage'));
const DashboardPage     = React.lazy(() => import('./features/dashboard/pages/DashboardPage'));
const PatientCasesPage  = React.lazy(() => import('./features/patient-cases/pages/PatientCasesPage'));
const NewPatientCasePage = React.lazy(() => import('./features/patient-cases/pages/NewPatientCasePage'));
const PatientCaseDetailPage = React.lazy(() => import('./features/patient-cases/pages/PatientCaseDetailPage'));
const DefaultRxPage     = React.lazy(() => import('./features/default-rx/pages/DefaultRxPage'));
const RequestStockPage  = React.lazy(() => import('./features/orders/pages/RequestStockPage'));
const OrdersPage        = React.lazy(() => import('./features/orders/pages/OrdersPage'));
const InventoryPage     = React.lazy(() => import('./features/inventory/pages/InventoryPage'));
const NearExpiryPage    = React.lazy(() => import('./features/near-expiry/pages/NearExpiryPage'));
const ExpiredPage       = React.lazy(() => import('./features/expired/pages/ExpiredPage'));
const ProfilePage       = React.lazy(() => import('./features/profile/pages/ProfilePage'));
const AppLayout         = React.lazy(() => import('./components/AppLayout'));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/sign-in" replace />;
  return <>{children}</>;
}

function RoleRoute({
  children,
  role,
}: {
  children: React.ReactNode;
  role: 'DOCTOR' | 'PHARMACIST';
}) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/sign-in" replace />;
  if (user.roleName !== role) return <Navigate to="/dashboard" replace />;
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
      { path: '/profile',   element: <ProfilePage /> },
      // Doctor-only routes
      { path: '/patients',        element: <RoleRoute role="DOCTOR"><PatientCasesPage /></RoleRoute> },
      { path: '/patients/new',    element: <RoleRoute role="DOCTOR"><NewPatientCasePage /></RoleRoute> },
      { path: '/patients/:id',    element: <RoleRoute role="DOCTOR"><PatientCaseDetailPage /></RoleRoute> },
      { path: '/default-rx',      element: <RoleRoute role="DOCTOR"><DefaultRxPage /></RoleRoute> },
      // Pharmacist-only routes
      { path: '/request-stock',   element: <RoleRoute role="PHARMACIST"><RequestStockPage /></RoleRoute> },
      { path: '/orders',          element: <RoleRoute role="PHARMACIST"><OrdersPage /></RoleRoute> },
      { path: '/inventory',       element: <RoleRoute role="PHARMACIST"><InventoryPage /></RoleRoute> },
      { path: '/near-expiry',     element: <RoleRoute role="PHARMACIST"><NearExpiryPage /></RoleRoute> },
      { path: '/expired',         element: <RoleRoute role="PHARMACIST"><ExpiredPage /></RoleRoute> },
    ],
  },
]);
