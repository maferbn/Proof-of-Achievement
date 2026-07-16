import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Menu, LogOut } from 'lucide-react';
import { Button } from '../ui';
import { useAuth } from '../../providers/auth-context';

interface DashboardHeaderProps {
  onToggleSidebar: () => void;
}

export function DashboardHeader({ onToggleSidebar }: DashboardHeaderProps) {
  const { logout } = useAuth();

  return (
    <header className="dash-header">
      <button
        type="button"
        className="btn btn--ghost btn--icon dash-hamburger"
        onClick={onToggleSidebar}
        aria-label="Abrir menú de navegación"
      >
        <Menu size={20} />
      </button>

      <div style={{ flex: 1 }} />

      <div className="flex items-center gap-3">
        <ConnectButton showBalance={false} accountStatus="avatar" chainStatus="icon" label="Conectar" />
        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          leftIcon={<LogOut size={15} />}
          aria-label="Cerrar sesión"
        >
          Salir
        </Button>
      </div>
    </header>
  );
}
