import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }: EmptyStateProps) {
  return (
    <div className="state">
      <div className="state__icon">
        <Icon size={26} aria-hidden />
      </div>
      <div className="state__title">{title}</div>
      {description && <p className="state__desc">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
