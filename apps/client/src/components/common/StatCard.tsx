import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  accent?: string;
  loading?: boolean;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  accent = 'var(--indigo)',
  loading = false,
}: StatCardProps) {
  return (
    <div className="card card--pad">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </span>
        <span
          className="flex items-center justify-center"
          style={{
            width: 34,
            height: 34,
            borderRadius: 'var(--r-sm)',
            background: 'var(--glass-bg-strong)',
            border: '1px solid var(--glass-border)',
            color: accent,
          }}
        >
          <Icon size={17} aria-hidden />
        </span>
      </div>
      <div style={{ fontSize: '1.9rem', fontWeight: 700, color: 'var(--text-strong)', marginTop: 10, lineHeight: 1.1 }}>
        {loading ? <span className="skeleton" style={{ display: 'inline-block', width: 56, height: 30, verticalAlign: 'middle' }} /> : value}
      </div>
      {hint && <div className="text-sm text-muted mt-2">{hint}</div>}
    </div>
  );
}
