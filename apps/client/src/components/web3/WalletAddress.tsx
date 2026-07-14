import { ExternalLink } from 'lucide-react';
import { truncateAddress } from '../../utils/address';
import { explorerAddressUrl } from '../../config/env';
import { CopyButton } from './CopyButton';

interface WalletAddressProps {
  address: string | null | undefined;
  /** Number of leading/trailing chars to show. */
  chars?: number;
  full?: boolean;
  copyable?: boolean;
  explorer?: boolean;
}

export function WalletAddress({
  address,
  chars = 4,
  full = false,
  copyable = true,
  explorer = false,
}: WalletAddressProps) {
  if (!address) return <span className="text-muted">—</span>;

  const display = full ? address : truncateAddress(address, chars);
  const url = explorer ? explorerAddressUrl(address) : '';

  return (
    <span className="flex items-center gap-1" style={{ display: 'inline-flex' }}>
      <span className="mono" title={address} style={full ? { wordBreak: 'break-all' } : undefined}>
        {display}
      </span>
      {copyable && <CopyButton value={address} label="Copiar dirección" />}
      {explorer && url && (
        <a
          href={url}
          target="_blank"
          rel="noreferrer noopener"
          className="copy-btn"
          aria-label="Ver en el explorador"
          title="Ver en el explorador"
        >
          <ExternalLink size={14} />
        </a>
      )}
    </span>
  );
}
