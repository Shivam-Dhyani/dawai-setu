import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, User, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';

type NavItem = { label: string; to: string; Icon: React.ComponentType<{ className?: string }> };

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', Icon: LayoutDashboard },
  { label: 'My Orders',  to: '/my-orders', Icon: ClipboardList },
];

export default function AppLayout() {
  const { pharmacy, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  function handleLogout() {
    clearAuth();
    navigate('/sign-in', { replace: true });
  }

  return (
    <div className="flex h-screen bg-background">
      <aside className="w-60 flex flex-col border-r bg-card shrink-0">
        <div className="h-14 flex items-center px-5 border-b">
          <span className="font-bold text-lg text-primary">DawaiSetu</span>
        </div>

        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ label, to, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t p-2 space-y-0.5">
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`
            }
          >
            <User className="h-4 w-4 shrink-0" />
            <span className="truncate">{pharmacy?.name}</span>
          </NavLink>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
