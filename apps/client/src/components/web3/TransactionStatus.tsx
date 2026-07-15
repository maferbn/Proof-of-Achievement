import { Loader2, CheckCircle2, XCircle, Ban } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { BadgeAwardStatus } from '../../types/api';

interface Meta {
  icon: LucideIcon;
  tone: string;
  bg: string;
  border: string;
  title: string;
  spin?: boolean;
}

const META: Record<BadgeAwardStatus, Meta> = {
  pending: {
    icon: Loader2,
    tone: 'var(--warning)',
    bg: 'var(--warning-bg)',
    border: 'var(--warning-border)',
    title: 'Esperando confirmación en blockchain.',
    spin: true,
  },
  confirmed: {
    icon: CheckCircle2,
    tone: 'var(--success)',
    bg: 'var(--success-bg)',
    border: 'var(--success-border)',
    title: 'Logro verificado en blockchain.',
  },
  failed: {
    icon: XCircle,
    tone: 'var(--danger)',
    bg: 'var(--danger-bg)',
    border: 'var(--danger-border)',
    title: 'La transacción no pudo confirmarse.',
  },
  revoked: {
    icon: Ban,
    tone: 'var(--neutral)',
    bg: 'var(--neutral-bg)',
    border: 'var(--neutral-border)',
    title: 'Logro revocado.',
  },
};

interface TransactionStatusProps {
  status: BadgeAwardStatus;
  detail?: string;
  compact?: boolean;
}

/**
 * Reusable, accessible banner representing the on-chain state of a badge
 * award. Used in the issue flow, verification, and revocation views.
 */
export function TransactionStatus({ status, detail, compact }: TransactionStatusProps) {
  const meta = META[status];
  const Icon = meta.icon;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.7rem',
        padding: compact ? '0.6rem 0.85rem' : '0.9rem 1.1rem',
        borderRadius: 'var(--r-md)',
        background: meta.bg,
        border: `1px solid ${meta.border}`,
        color: meta.tone,
      }}
    >
      <Icon
        size={compact ? 18 : 20}
        aria-hidden
        style={{ flexShrink: 0, marginTop: 1, animation: meta.spin ? 'spin 0.9s linear infinite' : undefined }}
      />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: compact ? '0.86rem' : '0.94rem' }}>{meta.title}</div>
        {detail && (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: 2 }}>{detail}</div>
        )}
      </div>
    </div>
  );
}
