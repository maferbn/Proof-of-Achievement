import { useState } from 'react';
import type { ReactNode } from 'react';
import { Zap, ShieldCheck, ShieldAlert, KeyRound, UserCog, RefreshCw } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button, Card, LoadingSpinner, ErrorState, StatusBadge } from '../../components/ui';
import { WalletAddress } from '../../components/web3/WalletAddress';
import { TransactionHash } from '../../components/web3/TransactionHash';
import { useRelayerStatus, useInitializeMinter } from '../../hooks/useRelayer';
import { useAuth } from '../../providers/auth-context';
import { useToast } from '../../providers/toast-context';
import { getFriendlyError } from '../../utils/errors';

export function RelayerStatusCard() {
  const { admin } = useAuth();
  const { data: relayer, isLoading, isError, error, refetch, isFetching } = useRelayerStatus();
  const initialize = useInitializeMinter();
  const toast = useToast();
  const [txHash, setTxHash] = useState<string | null>(null);

  const activate = async () => {
    setTxHash(null);
    try {
      const res = await initialize.mutateAsync();
      setTxHash(res.transactionHash);
      toast.success('Capacidad de emisión activada', 'MINTER_ROLE concedido on-chain.');
    } catch (e) {
      toast.error('No se pudo activar', getFriendlyError(e));
    }
  };

  return (
    <Card padded>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span
            className="flex items-center justify-center"
            style={{
              width: 34,
              height: 34,
              borderRadius: 'var(--r-sm)',
              background: 'var(--brand-gradient-soft)',
              border: '1px solid var(--glass-border)',
              color: 'var(--cyan)',
            }}
          >
            <Zap size={17} />
          </span>
          <div>
            <h3 style={{ fontSize: '1.05rem' }}>Capacidad de emisión</h3>
            <p className="text-xs text-muted">Relayer wallet y MINTER_ROLE</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => refetch()}
          leftIcon={<RefreshCw size={14} />}
          loading={isFetching}
          aria-label="Refrescar estado"
        >
          Refrescar
        </Button>
      </div>

      {isLoading ? (
        <LoadingSpinner center label="Consultando estado del relayer…" />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <div className="flex-col gap-3">
          <Row icon={UserCog} label="Wallet administradora">
            <WalletAddress address={admin?.walletAddress} chars={5} explorer />
          </Row>

          <Row icon={KeyRound} label="Relayer wallet">
            {relayer ? (
              <WalletAddress address={relayer.relayerAddress} chars={5} explorer />
            ) : (
              <span className="text-muted">No creada</span>
            )}
          </Row>

          <Row icon={relayer?.isActive ? ShieldCheck : ShieldAlert} label="Estado del relayer">
            <StatusBadge
              tone={relayer?.isActive ? 'success' : 'warning'}
              label={relayer?.isActive ? 'Activo' : 'Inactivo'}
            />
          </Row>

          <Row icon={ShieldCheck} label="MINTER_ROLE (on-chain)">
            <StatusBadge
              tone={relayer?.hasRoleOnChain ? 'success' : 'neutral'}
              label={relayer?.hasRoleOnChain ? 'Concedido' : 'No concedido'}
            />
          </Row>

          {!relayer?.isActive && (
            <div
              className="flex-col gap-3"
              style={{
                marginTop: 'var(--sp-2)',
                padding: 'var(--sp-4)',
                borderRadius: 'var(--r-md)',
                background: 'var(--warning-bg)',
                border: '1px solid var(--warning-border)',
              }}
            >
              <p className="text-sm" style={{ color: 'var(--warning)' }}>
                El relayer todavía no puede emitir logros. Activa la capacidad de emisión para
                conceder MINTER_ROLE a tu wallet relayer (transacción on-chain).
              </p>
              <div>
                <Button onClick={activate} loading={initialize.isPending} leftIcon={<Zap size={16} />}>
                  Activar capacidad de emisión
                </Button>
              </div>
            </div>
          )}

          {txHash && (
            <div className="flex items-center justify-between gap-2 text-sm mt-2">
              <span className="text-muted">Transacción de activación</span>
              <TransactionHash hash={txHash} />
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function Row({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3" style={{ minHeight: 32 }}>
      <span className="flex items-center gap-2 text-sm text-muted">
        <Icon size={15} />
        {label}
      </span>
      {children}
    </div>
  );
}
