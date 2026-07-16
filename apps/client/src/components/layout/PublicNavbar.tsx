import { Link } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { Logo } from '../common/Logo';
import { Button } from '../ui';
import { RecipientWalletMenu } from '../../features/profile/RecipientWalletMenu';
import { useAuth } from '../../providers/auth-context';

export function PublicNavbar() {
  const { isAuthenticated } = useAuth();

  return (
    <header className="public-nav">
      <div className="container public-nav__inner">
        <Link to="/" aria-label="Proof of Achievement — inicio">
          <Logo />
        </Link>

        <nav className="public-nav__links" aria-label="Secciones">
          <Link className="public-nav__link" to="/">
            Inicio
          </Link>
          <a className="public-nav__link" href="/#como-funciona">
            Cómo funciona
          </a>
          <a className="public-nav__link" href="/#aplicaciones">
            Aplicaciones
          </a>
        </nav>

        <div className="flex items-center gap-3">
          {/* Recipients: connect wallet / open a shared profile link */}
          <RecipientWalletMenu />

          {/* Issuing organizations: SIWE admin access */}
          <Link to="/dashboard">
            <Button size="sm" leftIcon={<Building2 size={15} />}>
              {isAuthenticated ? 'Panel de organización' : 'Acceso organizaciones'}
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
