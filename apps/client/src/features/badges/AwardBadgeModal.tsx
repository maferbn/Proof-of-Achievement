import { useEffect, useMemo, useState } from 'react';
import {
  Send,
  RotateCcw,
  Search,
  ShieldCheck,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Modal, Select, Button } from '../../components/ui';
import type { SelectOption } from '../../components/ui';
import { BadgeImage } from '../../components/web3/BadgeImage';
import { WalletAddress } from '../../components/web3/WalletAddress';
import { TransactionHash } from '../../components/web3/TransactionHash';
import { TransactionStatus } from '../../components/web3/TransactionStatus';
import { SoulboundTag } from '../../components/web3/SoulboundTag';
import { TokenId } from '../../components/web3/TokenId';
import { EvidenceForm } from './EvidenceForm';
import { useAwardBadge, useVerifyReceipt, useValidateEvidence } from '../../hooks/useBadges';
import { useToast } from '../../providers/toast-context';
import { getFriendlyError } from '../../utils/errors';
import { truncateAddress } from '../../utils/address';
import type { BadgeAward, BadgeDefinition, Evidence, Member, ValidationResponse } from '../../types/api';

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
  badges,
  members,
  preselectedBadgeId,
}: AwardBadgeModalProps) {
  const [badgeId, setBadgeId] = useState('');
  const [memberId, setMemberId] = useState('');
  const [result, setResult] = useState<BadgeAward | null>(null);

  const [evidence, setEvidence] = useState<Evidence | null>(null);
  const [validation, setValidation] = useState<ValidationResponse | null>(null);

  const award = useAwardBadge();
  const verify = useVerifyReceipt();
  const validate = useValidateEvidence();
  const toast = useToast();

  useEffect(() => {
    if (open) {
      setBadgeId(preselectedBadgeId ?? '');
      setMemberId('');
      setResult(null);
      setEvidence(null);
      setValidation(null);
    }
  }, [open, preselectedBadgeId]);

  const badgeOptions: SelectOption[] = useMemo(
    () => badges.map((b) => ({ value: b.id, label: b.name })),
    [badges]
  );
  const memberOptions: SelectOption[] = useMemo(
    () =>
      members.map((m) => ({
        value: m.id,
        label: m.displayName ? `${m.displayName} · ${truncateAddress(m.walletAddress)}` : m.walletAddress,
      })),
    [members]
  );

  const selectedBadge = badges.find((b) => b.id === badgeId);
  const selectedMember = members.find((m) => m.id === memberId);

  // A badge definition must have a validation rule; if the list is stale, block submission.
  const missingRule = !!selectedBadge && !selectedBadge.validationRule;
  const canSubmit = !!badgeId && !!memberId && !award.isPending && evidence !== null && !missingRule;
  const canValidate = !!badgeId && !!memberId && evidence !== null && !validate.isPending && !missingRule;

  const handleEvidenceChange = (next: Evidence | null) => {
    setEvidence(next);
    setValidation(null); // stale once evidence changes
  };

  const runValidate = async () => {
    if (!canValidate || !evidence) return;
    try {
      const res = await validate.mutateAsync({ badgeDefinitionId: badgeId, memberId, evidence });
      setValidation(res);
    } catch (e) {
      toast.error('No se pudo validar', getFriendlyError(e));
    }
  };

  const submit = async () => {
    if (!canSubmit || !evidence) return;
    try {
      const res = await award.mutateAsync({
        badgeDefinitionId: badgeId,
        memberId,
        evidence,
      });
      setResult(res.badgeAward);
      toast.success('Emisión enviada', 'Pendiente de confirmación automática.');
    } catch (e) {
      toast.error(
        'No se pudo emitir el logro',
        getFriendlyError(e, {
          409: 'Este miembro ya recibió este logro.',
          400: 'La emisión no es posible. Revisa la evidencia o la capacidad de emisión.',
          403: 'No tienes permiso para emitir este logro.',
        })
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
      else toast.info('Aún pendiente', 'La red todavía no ha confirmado la transacción.');
    } catch (e) {
      toast.error('No se pudo verificar', getFriendlyError(e));
    }
  };

  const reset = () => {
    setResult(null);
    setMemberId('');
    setEvidence(null);
    setValidation(null);
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

          <TransactionStatus
            status={result.status}
            detail={
              result.status === 'pending'
                ? 'La red y el indexador confirmarán el estado automáticamente.'
                : undefined
            }
          />

          {result.transactionHash && (
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="text-muted">Transacción</span>
              <TransactionHash hash={result.transactionHash} />
            </div>
          )}
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="text-muted">Token ID</span>
            <TokenId value={result.onChainTokenId} status={result.status} />
          </div>

          <SoulboundTag />

          {result.status === 'pending' && (
            <Button
              variant="secondary"
              onClick={runVerify}
              loading={verify.isPending}
              leftIcon={<Search size={15} />}
            >
              Verificar ahora
            </Button>
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

          {selectedBadge && (
            <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 'var(--sp-3)' }}>
              <div className="flex items-center gap-2 text-sm font-semibold text-strong mb-3">
                <ShieldCheck size={16} /> Evidencia de validación
              </div>

              {missingRule ? (
                <div className="text-sm text-danger">
                  Este logro no tiene una regla de validación configurada. Actualiza la definición del logro antes de emitirlo.
                </div>
              ) : (
                <div className="flex-col gap-3">
                  <EvidenceForm rule={selectedBadge.validationRule} onChange={handleEvidenceChange} />

                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={runValidate}
                      loading={validate.isPending}
                      disabled={!canValidate}
                      leftIcon={<ShieldCheck size={15} />}
                    >
                      Validar evidencia
                    </Button>
                    {evidence === null && (
                      <span className="text-xs text-muted">Completa la evidencia para continuar.</span>
                    )}
                  </div>

                  {validation && (
                    <div
                      className="flex items-start gap-2"
                      style={{
                        padding: '0.6rem 0.8rem',
                        borderRadius: 'var(--r-sm)',
                        background: validation.valid ? 'var(--success-bg)' : 'var(--danger-bg)',
                        border: `1px solid ${validation.valid ? 'var(--success-border)' : 'var(--danger-border)'}`,
                        color: validation.valid ? 'var(--success)' : 'var(--danger)',
                      }}
                    >
                      {validation.valid ? (
                        <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                      ) : (
                        <XCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                      )}
                      <div style={{ fontSize: '0.85rem' }}>
                        <div style={{ fontWeight: 600 }}>
                          {validation.valid ? 'Miembro elegible' : 'Evidencia inválida'}
                        </div>
                        <div style={{ color: 'var(--text-muted)', marginTop: 2 }}>
                          {validation.valid
                            ? 'Evidencia validada correctamente.'
                            : `Motivo: ${validation.reason ?? validation.message}`}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

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
                    {selectedMember.displayName ? <span>{selectedMember.displayName}</span> : null}
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
