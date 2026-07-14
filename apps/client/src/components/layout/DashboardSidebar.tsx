import { NavLink, Link } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, Settings, Globe, ShieldCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Logo } from '../common/Logo';
import { WalletAddress } from '../web3/WalletAddress';
import { useAuth } from '../../providers/auth-context';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Resumen', icon: LayoutDashboard, end: true },
  { to: '/dashboard/groups', label: 'Grupos', icon: FolderKanban },
  { to: '/dashboard/settings', label: 'Ajustes', icon: Settings },
];

interface DashboardSidebarProps {
  open: boolean;
  onNavigate: () => void;
}

export function DashboardSidebar({ open, onNavigate }: DashboardSidebarProps) {
  const { admin } = useAuth();

  return (
    <aside className={`dash-sidebar${open ? ' is-open' : ''}`} aria-label="Navegación del panel">
      <Link to="/" style={{ padding: '0.4rem 0.5rem' }} onClick={onNavigate}>
        <Logo />
      </Link>

      <nav className="flex-col gap-1 mt-3" style={{ flex: 1 }}>
        <div className="nav-section">Administración</div>
        {ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}
          >
            <item.icon size={18} aria-hidden />
            {item.label}
          </NavLink>
        ))}

        <div className="nav-section mt-3">Público</div>
        <Link to="/" className="nav-link" onClick={onNavigate}>
          <Globe size={18} aria-hidden />
          Ver sitio público
        </Link>
      </nav>

      <div className="card card--pad" style={{ padding: '0.85rem' }}>
        <div className="flex items-center gap-2 text-xs font-semibold text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <ShieldCheck size={14} />
          Admin
        </div>
        <div className="mt-2">
          {admin?.displayName && (
            <div className="text-sm text-strong truncate">{admin.displayName}</div>
          )}
          <WalletAddress address={admin?.walletAddress} chars={5} />
        </div>
      </div>
    </aside>
  );
}
