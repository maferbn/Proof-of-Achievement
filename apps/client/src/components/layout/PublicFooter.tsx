import { Link } from 'react-router-dom';
import { Logo } from '../common/Logo';

export function PublicFooter() {
  return (
    <footer className="public-footer">
      <div className="container">
        <div className="public-footer__grid">
          <div>
            <Logo />
            <p className="text-sm mt-3" style={{ maxWidth: 320 }}>
              Logros digitales verificables como Soulbound Tokens no transferibles (ERC-5192).
              La reputación que se gana, no se compra.
            </p>
          </div>

          <div className="flex-col gap-2">
            <span className="text-xs font-semibold text-strong" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Producto
            </span>
            <a className="public-nav__link" href="/#como-funciona">
              Cómo funciona
            </a>
            <a className="public-nav__link" href="/#sbt-vs-nft">
              SBT vs NFT
            </a>
            <Link className="public-nav__link" to="/dashboard">
              Acceso organizaciones
            </Link>
          </div>

          <div className="flex-col gap-2">
            <span className="text-xs font-semibold text-strong" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Tecnología
            </span>
            <span className="public-nav__link">Ethereum · ERC-5192</span>
            <span className="public-nav__link">React · Wagmi · Viem</span>
            <span className="public-nav__link">Verificable on-chain</span>
          </div>
        </div>

        <div
          className="flex items-center justify-between flex-wrap gap-2 mt-6 text-sm"
          style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 'var(--sp-4)' }}
        >
          <span>© {new Date().getFullYear()} Proof of Achievement.</span>
          <span className="text-faint" style={{ color: 'var(--text-faint)' }}>
            Plataforma descentralizada de logros verificables.
          </span>
        </div>
      </div>
    </footer>
  );
}
