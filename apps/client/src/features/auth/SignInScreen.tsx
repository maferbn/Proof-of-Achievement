import type { ReactNode } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Link } from 'react-router-dom';
import { Wallet, PenLine, ShieldCheck, AlertCircle, ArrowLeft } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button, Card, LoadingSpinner } from '../../components/ui';
import { Logo } from '../../components/common/Logo';
import { WalletAddress } from '../../components/web3/WalletAddress';
import { useAuth } from '../../providers/auth-context';

export function SignInScreen() {
  const { status, address, error, signIn } = useAuth();

  const connected = status !== 'disconnected' && status !== 'loading';
  const authenticating = status === 'authenticating';

  return (
    <div
      className="flex-col items-center justify-center"
      style={{ minHeight: '100vh', padding: 'var(--sp-5)' }}
    >
      <div style={{ width: '100%', maxWidth: 460 }} className="fade-up">
        <div className="flex-col items-center gap-3 mb-4">
          <Logo size={40} withWordmark={false} />
          <h1 style={{ fontSize: '1.7rem', textAlign: 'center' }}>Panel de administración</h1>
          <p className="text-muted text-center" style={{ fontSize: '0.94rem' }}>
            Inicia sesión con Ethereum (SIWE) para emitir y gestionar logros verificables.
          </p>
        </div>

        <Card padded>
          {status === 'loading' ? (
            <LoadingSpinner center label="Restaurando sesión…" />
          ) : (
            <div className="flex-col gap-4">
              {status === 'expired' && (
                <div
                  className="flex items-start gap-2"
                  style={{
                    padding: '0.7rem 0.9rem',
                    borderRadius: 'var(--r-sm)',
                    background: 'var(--warning-bg)',
                    border: '1px solid var(--warning-border)',
                    color: 'var(--warning)',
                    fontSize: '0.86rem',
                  }}
                >
                  <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                  Tu sesión expiró. Vuelve a firmar para continuar.
                </div>
              )}

              {/* Step 1 — connect wallet */}
              <Step
                index={1}
                done={connected}
                icon={Wallet}
                title="Conecta tu wallet"
                description="Usa MetaMask u otra wallet compatible."
              >
                {connected ? (
                  <div className="flex items-center gap-2">
                    <span className="status status--success">
                      <span className="status__dot" aria-hidden />
                      Conectada
                    </span>
                    <WalletAddress address={address} chars={4} />
                  </div>
                ) : (
                  <ConnectButton showBalance={false} chainStatus="none" label="Conectar wallet" />
                )}
              </Step>

              {/* Step 2 — sign SIWE */}
              <Step
                index={2}
                done={false}
                disabled={!connected}
                icon={PenLine}
                title="Firma el mensaje"
                description="Una firma gratuita que prueba que controlas la wallet. No envía ninguna transacción."
              >
                <Button
                  onClick={signIn}
                  disabled={!connected || authenticating}
                  loading={authenticating}
                  leftIcon={<ShieldCheck size={16} />}
                >
                  {authenticating ? 'Firma en tu wallet…' : 'Iniciar sesión con Ethereum'}
                </Button>
              </Step>

              {error && (
                <div className="field__error" role="alert" style={{ fontSize: '0.85rem' }}>
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}
            </div>
          )}
        </Card>

        <div className="text-center mt-4">
          <Link to="/" className="flex items-center gap-1 text-sm text-muted justify-center">
            <ArrowLeft size={15} />
            Volver al sitio público
          </Link>
        </div>
      </div>
    </div>
  );
}

interface StepProps {
  index: number;
  icon: LucideIcon;
  title: string;
  description: string;
  done: boolean;
  disabled?: boolean;
  children: ReactNode;
}

function Step({ index, icon: Icon, title, description, done, disabled, children }: StepProps) {
  return (
    <div
      className="flex gap-3"
      style={{ opacity: disabled ? 0.55 : 1, transition: 'opacity 180ms ease' }}
    >
      <div
        className="flex items-center justify-center"
        style={{
          flexShrink: 0,
          width: 34,
          height: 34,
          borderRadius: 'var(--r-sm)',
          background: done ? 'var(--success-bg)' : 'var(--glass-bg-strong)',
          border: `1px solid ${done ? 'var(--success-border)' : 'var(--glass-border)'}`,
          color: done ? 'var(--success)' : 'var(--cyan)',
        }}
      >
        {done ? <ShieldCheck size={17} /> : <Icon size={17} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="flex items-center gap-2">
          <span className="text-strong font-semibold" style={{ fontSize: '0.96rem' }}>
            {title}
          </span>
          <span className="text-xs text-faint" style={{ color: 'var(--text-faint)' }}>
            Paso {index}
          </span>
        </div>
        <p className="text-sm text-muted mt-2" style={{ marginBottom: '0.7rem' }}>
          {description}
        </p>
        {children}
      </div>
    </div>
  );
}
