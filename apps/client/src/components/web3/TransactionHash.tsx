import { ExternalLink } from 'lucide-react';
import { truncateHash } from '../../utils/address';
import { explorerTxUrl } from '../../config/env';
import { CopyButton } from './CopyButton';

interface TransactionHashProps {
  hash: string | null | undefined;
  chars?: number;
  copyable?: boolean;
}

export function TransactionHash({ hash, chars = 6, copyable = true }: TransactionHashProps) {
  if (!hash) return <span className="text-muted">—</span>;

  const url = explorerTxUrl(hash);

  return (
    <span className="flex items-center gap-1" style={{ display: 'inline-flex' }}>
      <span className="mono" title={hash}>
        {truncateHash(hash, chars)}
      </span>
      {copyable && <CopyButton value={hash} label="Copiar hash" />}
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noreferrer noopener"
          className="copy-btn"
          aria-label="Ver transacción en el explorador"
          title="Ver en el explorador"
        >
          <ExternalLink size={14} />
        </a>
      )}
    </span>
  );
}
