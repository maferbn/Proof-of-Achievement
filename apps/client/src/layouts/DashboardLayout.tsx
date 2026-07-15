import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { DashboardSidebar } from '../components/layout/DashboardSidebar';
import { DashboardHeader } from '../components/layout/DashboardHeader';
import { SignInScreen } from '../features/auth/SignInScreen';
import { useAuth } from '../providers/auth-context';

export function DashboardLayout() {
  const { status } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Protected: only an authenticated admin sees the dashboard shell.
  if (status !== 'authenticated') {
    return <SignInScreen />;
  }

  const close = () => setDrawerOpen(false);

  return (
    <div className="dash">
      <div
        className={`dash-backdrop${drawerOpen ? ' is-open' : ''}`}
        onClick={close}
        aria-hidden
      />
      <DashboardSidebar open={drawerOpen} onNavigate={close} />
      <div className="dash-main">
        <DashboardHeader onToggleSidebar={() => setDrawerOpen((o) => !o)} />
        <div className="dash-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
