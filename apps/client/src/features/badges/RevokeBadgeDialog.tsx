import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { AlertTriangle, Ban } from 'lucide-react';
import { Modal, Button } from '../../components/ui';
import { WalletAddress } from '../../components/web3/WalletAddress';
import { TransactionHash } from '../../components/web3/TransactionHash';
import { useRevokeBadge } from '../../hooks/useBadges';
import { useToast } from '../../providers/toast-context';
import { getFriendlyError } from '../../utils/errors';
import type { BadgeAward } from '../../types/api';

interface RevokeBadgeDialogProps {
  open: boolean;
  onClose: () => void;
  groupId?: string;
  award: BadgeAward | null;
  badgeName?: string;
}

export function RevokeBadgeDialog({ open, onClose, groupId, award, badgeName }: RevokeBadgeDialogProps) {
  const revoke = useRevokeBadge(groupId);
  const toast = useToast();
  const [revokeTx, setRevokeTx] = useState<string | null>(null);

  useEffect(() => {
    if (open) setRevokeTx(null);
  }, [open]);

  const member = award?.member;

  const confirm = async () => {
    if (!award) return;
    try {
      const res = await revoke.mutateAsync(award.id);
      setRevokeTx(res.transactionHash);
      toast.success('Logro revocado', 'El token quedó marcado como revocado on-chain.');
    } catch (e) {
      toast.error('No se pudo revocar', getFriendlyError(e));
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={revoke.isPending}
      title="Revocar logro"
      maxWidth={500}
      footer={
        revokeTx ? (
          <Button onClick={onClose}>Cerrar</Button>
        ) : (
          <>
            <Button variant="ghost" onClick={onClose} disabled={revoke.isPending}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={confirm} loading={revoke.isPending} leftIcon={<Ban size={15} />}>
              Revocar logro
            </Button>
          </>
        )
      }
    >
      <div className="flex-col gap-4">
        <DetailRow label="Logro" value={badgeName || award?.badgeDefinition?.name || '—'} />
        <DetailRow
          label="Receptor"
          value={
            member?.displayName ? (
              <span className="flex items-center gap-2">
                {member.displayName}
                <WalletAddress address={member?.walletAddress} chars={4} copyable={false} />
              </span>
            ) : (
              <WalletAddress address={member?.walletAddress} chars={5} />
            )
          }
        />
        <DetailRow label="Token ID" value={award?.onChainTokenId != null ? `#${award.onChainTokenId}` : '—'} />
        <DetailRow
          label="Transacción de emisión"
          value={award?.transactionHash ? <TransactionHash hash={award.transactionHash} /> : '—'}
        />

        {revokeTx ? (
          <DetailRow label="Transacción de revocación" value={<TransactionHash hash={revokeTx} />} />
        ) : (
          <div
            className="flex items-start gap-2"
            style={{
              padding: '0.75rem 0.9rem',
              borderRadius: 'var(--r-sm)',
              background: 'var(--warning-bg)',
              border: '1px solid var(--warning-border)',
              color: 'var(--warning)',
              fontSize: '0.86rem',
              lineHeight: 1.55,
            }}
          >
            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              La revocación no transfiere ni vende el SBT. El token permanece asociado a la wallet
              para preservar trazabilidad, pero queda marcado como revocado.
            </span>
          </div>
        )}
      </div>
    </Modal>
  );
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3" style={{ minHeight: 28 }}>
      <span className="text-sm text-muted">{label}</span>
      <span className="text-sm text-strong" style={{ textAlign: 'right' }}>
        {value}
      </span>
    </div>
  );
}
