import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  backTo?: string;
  backLabel?: string;
  eyebrow?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  backTo,
  backLabel = 'Volver',
  eyebrow,
}: PageHeaderProps) {
  return (
    <div className="mb-4">
      {backTo && (
        <Link
          to={backTo}
          className="flex items-center gap-1 text-sm text-muted mb-2"
          style={{ width: 'fit-content' }}
        >
          <ChevronLeft size={16} />
          {backLabel}
        </Link>
      )}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div style={{ minWidth: 0 }}>
          {eyebrow && (
            <div
              className="text-xs font-semibold gradient-text"
              style={{ textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}
            >
              {eyebrow}
            </div>
          )}
          <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}>{title}</h1>
          {description && (
            <p className="text-muted mt-2" style={{ maxWidth: 640 }}>
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
      </div>
    </div>
  );
}
