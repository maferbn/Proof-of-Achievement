import { useEffect, useMemo, useState } from 'react';
import { Send, CheckCircle2, RotateCcw, Search } from 'lucide-react';
import { Modal, Select, Button } from '../../components/ui';
import type { SelectOption } from '../../components/ui';
import { BadgeImage } from '../../components/web3/BadgeImage';
import { WalletAddress } from '../../components/web3/WalletAddress';
import { TransactionHash } from '../../components/web3/TransactionHash';
import { TransactionStatus } from '../../components/web3/TransactionStatus';
import { SoulboundTag } from '../../components/web3/SoulboundTag';
import { useAwardBadge, useVerifyReceipt } from '../../hooks/useBadges';
import { useToast } from '../../providers/toast-context';
import { getFriendlyError } from '../../utils/errors';
import { truncateAddress } from '../../utils/address';
import type { BadgeAward, BadgeDefinition, Member } from '../../types/api';

interface AwardBadgeModalProps {
  open: boolean;
  onClose: () => void;
  groupId: string;
  badges: BadgeDefinition[];
  members: Member[];
  preselectedBadgeId?: string;
}

export function AwardBadgeModal({
  open,
  onClose,
  groupId,
  badges,
  members,
  preselectedBadgeId,
}: AwardBadgeModalProps) {
  const [badgeId, setBadgeId] = useState('');
  const [memberId, setMemberId] = useState('');
  const [result, setResult] = useState<BadgeAward | null>(null);

  const award = useAwardBadge(groupId);
  const verify = useVerifyReceipt(groupId);
  const toast = useToast();

  useEffect(() => {
    if (open) {
      setBadgeId(preselectedBadgeId ?? '');
      setMemberId('');
      setResult(null);
    }
  }, [open, preselectedBadgeId]);

  const badgeOptions: SelectOption[] = useMemo(
    () => badges.map((b) => ({ value: b.id, label: b.name })),
    [badges],
  );
  const memberOptions: SelectOption[] = useMemo(
    () =>
      members.map((m) => ({
        value: m.id,
        label: m.displayName ? `${m.displayName} · ${truncateAddress(m.walletAddress)}` : m.walletAddress,
      })),
    [members],
  );

  const selectedBadge = badges.find((b) => b.id === badgeId);
  const selectedMember = members.find((m) => m.id === memberId);
  const canSubmit = !!badgeId && !!memberId && !award.isPending;

  const submit = async () => {
    if (!canSubmit) return;
    try {
      const res = await award.mutateAsync({ badgeDefinitionId: badgeId, memberId });
      setResult(res.badgeAward);
      toast.success('Emisión enviada', 'Esperando confirmación en blockchain.');
    } catch (e) {
      toast.error(
        'No se pudo emitir el logro',
        getFriendlyError(e, {
          409: 'Este miembro ya recibió este logro.',
          400: 'La emisión no es posible. Verifica que la capacidad de emisión esté activa.',
          403: 'No tienes permiso para emitir este logro.',
        }),
      );
    }
  };

  const runVerify = async () => {
    if (!result) return;
    try {
      const res = await verify.mutateAsync(result.id);
      setResult(res.badgeAward);
      if (res.status === 'confirmed') toast.success('Logro verificado en blockchain.');
      else if (res.status === 'failed') toast.error('La transacción no pudo confirmarse.');
      else toast.info('Aún pendiente', 'La transacción todavía no se ha confirmado.');
    } catch (e) {
      toast.error('No se pudo verificar', getFriendlyError(e));
    }
  };

  const reset = () => {
    setResult(null);
    setMemberId('');
    if (!preselectedBadgeId) setBadgeId('');
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={award.isPending}
      title="Emitir logro"
      footer={
        result ? (
          <>
            <Button variant="ghost" onClick={reset} leftIcon={<RotateCcw size={15} />}>
              Emitir otro
            </Button>
            <Button onClick={onClose}>Cerrar</Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={onClose} disabled={award.isPending}>
              Cancelar
            </Button>
            <Button onClick={submit} loading={award.isPending} disabled={!canSubmit} leftIcon={<Send size={15} />}>
              Confirmar emisión
            </Button>
          </>
        )
      }
    >
      {result ? (
        <div className="flex-col gap-4">
          <div className="flex items-center gap-3">
            <BadgeImage uri={selectedBadge?.imageURI} size={52} />
            <div style={{ minWidth: 0 }}>
              <div className="text-strong font-semibold">{selectedBadge?.name}</div>
              <div className="text-sm text-muted flex items-center gap-1">
                Para{' '}
                {selectedMember?.displayName || (
                  <WalletAddress address={selectedMember?.walletAddress} chars={4} copyable={false} />
                )}
              </div>
            </div>
          </div>

          <TransactionStatus status={result.status} />

          {result.transactionHash && (
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="text-muted">Transacción</span>
              <TransactionHash hash={result.transactionHash} />
            </div>
          )}

          <SoulboundTag />

          {result.status === 'pending' && (
            <Button
              variant="secondary"
              onClick={runVerify}
              loading={verify.isPending}
              leftIcon={<Search size={15} />}
            >
              Verificar recepción
            </Button>
          )}
          {result.status === 'confirmed' && (
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--success)' }}>
              <CheckCircle2 size={16} /> Logro verificado en blockchain.
            </div>
          )}
        </div>
      ) : (
        <div className="flex-col gap-4">
          <Select
            label="Logro"
            required
            options={badgeOptions}
            placeholder="Selecciona un logro"
            value={badgeId}
            onChange={(e) => setBadgeId(e.target.value)}
            disabled={!!preselectedBadgeId}
          />
          <Select
            label="Miembro receptor"
            required
            options={memberOptions}
            placeholder={members.length ? 'Selecciona un miembro' : 'No hay miembros en el grupo'}
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            disabled={members.length === 0}
          />

          {selectedBadge && selectedMember && (
            <div
              className="flex-col gap-3"
              style={{
                padding: 'var(--sp-4)',
                borderRadius: 'var(--r-md)',
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
              }}
            >
              <span className="text-xs font-semibold text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Resumen
              </span>
              <div className="flex items-center gap-3">
                <BadgeImage uri={selectedBadge.imageURI} size={44} />
                <div style={{ minWidth: 0 }}>
                  <div className="text-strong font-semibold truncate">{selectedBadge.name}</div>
                  <div className="text-sm text-muted flex items-center gap-1">
                    →{' '}
                    {selectedMember.displayName ? (
                      <span>{selectedMember.displayName}</span>
                    ) : null}
                    <WalletAddress address={selectedMember.walletAddress} chars={4} copyable={false} />
                  </div>
                </div>
              </div>
              <SoulboundTag label="Se emitirá como token no transferible" />
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
