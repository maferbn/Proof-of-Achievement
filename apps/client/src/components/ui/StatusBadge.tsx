import type { BadgeAwardStatus } from '../../types/api';

type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface StatusBadgeProps {
  tone: Tone;
  label: string;
  dot?: boolean;
}

/** Generic pill. For badge award states use `AwardStatusBadge`. */
export function StatusBadge({ tone, label, dot = true }: StatusBadgeProps) {
  return (
    <span className={`status status--${tone}`}>
      {dot && <span className="status__dot" aria-hidden />}
      {label}
    </span>
  );
}

const AWARD_TONE: Record<BadgeAwardStatus, Tone> = {
  pending: 'warning',
  confirmed: 'success',
  failed: 'danger',
  revoked: 'neutral',
};

const AWARD_LABEL: Record<BadgeAwardStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  failed: 'Fallido',
  revoked: 'Revocado',
};

export function AwardStatusBadge({ status }: { status: BadgeAwardStatus }) {
  return <StatusBadge tone={AWARD_TONE[status]} label={AWARD_LABEL[status]} />;
}
