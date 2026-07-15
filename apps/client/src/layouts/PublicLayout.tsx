import { Outlet } from 'react-router-dom';
import { PublicNavbar } from '../components/layout/PublicNavbar';
import { PublicFooter } from '../components/layout/PublicFooter';

export function PublicLayout() {
  return (
    <div className="flex-col" style={{ minHeight: '100vh' }}>
      <PublicNavbar />
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}
