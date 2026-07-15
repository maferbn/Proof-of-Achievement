import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';
import { getFriendlyError } from '../../utils/errors';

interface ErrorStateProps {
  error?: unknown;
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ error, title = 'Algo salió mal', message, onRetry }: ErrorStateProps) {
  const desc = message ?? getFriendlyError(error);
  return (
    <div className="state">
      <div className="state__icon" style={{ color: 'var(--danger)' }}>
        <AlertTriangle size={26} aria-hidden />
      </div>
      <div className="state__title">{title}</div>
      <p className="state__desc">{desc}</p>
      {onRetry && (
        <div className="mt-2">
          <Button variant="secondary" size="sm" onClick={onRetry} leftIcon={<RefreshCw size={15} />}>
            Reintentar
          </Button>
        </div>
      )}
    </div>
  );
}
