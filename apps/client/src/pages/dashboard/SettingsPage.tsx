import type { ReactNode } from 'react';
import { LogOut, UserCog, FileText } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Button, Card } from '../../components/ui';
import { WalletAddress } from '../../components/web3/WalletAddress';
import { RelayerStatusCard } from '../../features/relayer/RelayerStatusCard';
import { ServicesStatusCard } from '../../features/settings/ServicesStatusCard';
import { useAuth } from '../../providers/auth-context';
import { env } from '../../config/env';

export function SettingsPage() {
  const { admin, logout } = useAuth();

  return (
    <>
      <PageHeader
        eyebrow="Administración"
        title="Ajustes"
        description="Gestiona tu capacidad de emisión y revisa la información de tu cuenta."
      />

      <div
        className="grid gap-5"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', alignItems: 'start' }}
      >
        <RelayerStatusCard />

        <ServicesStatusCard />

        <Card padded className="flex-col gap-4">
          <div className="flex items-center gap-2">
            <UserCog size={18} style={{ color: 'var(--cyan)' }} />
            <h3 style={{ fontSize: '1.05rem' }}>Cuenta</h3>
          </div>

          <Row label="Administrador">
            <span className="text-sm text-strong">{admin?.displayName || 'Sin nombre'}</span>
          </Row>
          <Row label="Wallet">
            <WalletAddress address={admin?.walletAddress} chars={5} explorer />
          </Row>
          <Row label="Red">
            <span className="text-sm">Chain ID {env.chainId}</span>
          </Row>
          {env.contractAddress && (
            <Row label="Contrato">
              <WalletAddress address={env.contractAddress} chars={5} explorer />
            </Row>
          )}

          <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 'var(--sp-4)' }}>
            <Button variant="danger" onClick={logout} leftIcon={<LogOut size={16} />}>
              Cerrar sesión
            </Button>
          </div>
        </Card>

        <Card padded className="flex-col gap-3">
          <div className="flex items-center gap-2">
            <FileText size={18} style={{ color: 'var(--cyan)' }} />
            <h3 style={{ fontSize: '1.05rem' }}>Sobre la revocación</h3>
          </div>
          <p className="text-sm text-muted">
            Revocar un logro no transfiere ni vende el SBT. El token permanece asociado a la wallet
            del receptor para preservar la trazabilidad, pero queda marcado como revocado en la
            blockchain (ERC-5192).
          </p>
        </Card>
      </div>
    </>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3" style={{ minHeight: 28 }}>
      <span className="text-sm text-muted">{label}</span>
      {children}
    </div>
  );
}
