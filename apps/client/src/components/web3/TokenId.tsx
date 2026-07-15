import type { BadgeAwardStatus } from '../../types/api';

interface TokenIdProps {
  value: string | number | null | undefined;
  status: BadgeAwardStatus;
}

/**
 * Renders the on-chain token id with context:
 * - value present        → "#<id>"
 * - pending              → "Pendiente"
 * - confirmed, no value  → "No disponible"
 * - otherwise            → "—"
 */
export function TokenId({ value, status }: TokenIdProps) {
  if (value !== null && value !== undefined && value !== '') {
    return <span className="mono">#{value}</span>;
  }
  if (status === 'pending') {
    return <span className="text-muted">Pendiente</span>;
  }
  if (status === 'confirmed') {
    return <span className="text-muted">No disponible</span>;
  }
  return <span className="text-muted">—</span>;
}
