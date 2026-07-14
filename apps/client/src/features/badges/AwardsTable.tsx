import { useState } from 'react';
import { Search, Ban, BadgeCheck } from 'lucide-react';
import { AwardStatusBadge, Button, EmptyState } from '../../components/ui';
import { WalletAddress } from '../../components/web3/WalletAddress';
import { TransactionHash } from '../../components/web3/TransactionHash';
import { RevokeBadgeDialog } from './RevokeBadgeDialog';
import { useVerifyReceipt } from '../../hooks/useBadges';
import { useToast } from '../../providers/toast-context';
import { getFriendlyError } from '../../utils/errors';
import type { BadgeAward } from '../../types/api';

interface AwardsTableProps {
  awards: BadgeAward[];
  groupId?: string;
  badgeName?: string;
}

export function AwardsTable({ awards, groupId, badgeName }: AwardsTableProps) {
  const verify = useVerifyReceipt(groupId);
  const toast = useToast();
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<BadgeAward | null>(null);

  if (awards.length === 0) {
    return (
      <EmptyState
        icon={BadgeCheck}
        title="Sin emisiones todavía"
        description="Cuando emitas este logro a un miembro aparecerá aquí con su estado on-chain."
      />
    );
  }

  const runVerify = async (award: BadgeAward) => {
    setVerifyingId(award.id);
    try {
      const res = await verify.mutateAsync(award.id);
      if (res.status === 'confirmed') toast.success('Logro verificado en blockchain.');
      else if (res.status === 'failed') toast.error('La transacción no pudo confirmarse.');
      else toast.info('Aún pendiente', 'Esperando confirmación en blockchain.');
    } catch (e) {
      toast.error('No se pudo verificar', getFriendlyError(e));
    } finally {
      setVerifyingId(null);
    }
  };

  return (
    <>
      <div className="table-wrap card" style={{ padding: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Receptor</th>
              <th>Estado</th>
              <th>Token</th>
              <th>Transacción</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {awards.map((a) => {
              const canRevoke = a.onChainTokenId != null && a.status !== 'revoked';
              return (
                <tr key={a.id}>
                  <td>
                    {a.member?.displayName ? (
                      <span className="flex-col">
                        <span className="text-strong">{a.member.displayName}</span>
                        <WalletAddress address={a.member.walletAddress} chars={4} copyable={false} />
                      </span>
                    ) : (
                      <WalletAddress address={a.member?.walletAddress} chars={5} />
                    )}
                  </td>
                  <td>
                    <AwardStatusBadge status={a.status} />
                  </td>
                  <td className="mono text-muted">{a.onChainTokenId != null ? `#${a.onChainTokenId}` : '—'}</td>
                  <td>
                    <TransactionHash hash={a.transactionHash} chars={4} />
                  </td>
                  <td>
                    <div className="flex items-center gap-2" style={{ justifyContent: 'flex-end' }}>
                      {a.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => runVerify(a)}
                          loading={verifyingId === a.id}
                          leftIcon={<Search size={14} />}
                        >
                          Verificar
                        </Button>
                      )}
                      {canRevoke && (
                        <Button
                          size="sm"
                          variant="ghost"
                          style={{ color: 'var(--danger)' }}
                          onClick={() => setRevoking(a)}
                          leftIcon={<Ban size={14} />}
                        >
                          Revocar
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <RevokeBadgeDialog
        open={!!revoking}
        onClose={() => setRevoking(null)}
        groupId={groupId}
        award={revoking}
        badgeName={badgeName}
      />
    </>
  );
}
