import { Link } from 'react-router-dom';
import { Send, ArrowRight } from 'lucide-react';
import { Card, Button } from '../../components/ui';
import { BadgeImage } from '../../components/web3/BadgeImage';
import { pluralize } from '../../utils/format';
import type { BadgeDefinition } from '../../types/api';

interface BadgeDefinitionCardProps {
  badge: BadgeDefinition;
  onAward: (badge: BadgeDefinition) => void;
}

export function BadgeDefinitionCard({ badge, onAward }: BadgeDefinitionCardProps) {
  const awarded = badge._count?.badgeAwards ?? badge.badgeAwards?.length ?? 0;

  return (
    <Card padded interactive className="flex-col">
      <div className="flex items-start gap-3">
        <BadgeImage uri={badge.imageURI} size={52} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <Link to={`/dashboard/badges/${badge.id}`}>
            <h3 className="truncate" style={{ fontSize: '1.05rem' }}>
              {badge.name}
            </h3>
          </Link>
          <p className="text-xs text-muted mt-2">{pluralize(awarded, 'emisión', 'emisiones')}</p>
        </div>
      </div>

      <p
        className="text-sm text-muted mt-3"
        style={{ flex: 1, minHeight: 38, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
      >
        {badge.description || 'Sin descripción.'}
      </p>

      <div
        className="flex items-center justify-between gap-2 mt-4"
        style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 'var(--sp-3)' }}
      >
        <Link
          to={`/dashboard/badges/${badge.id}`}
          className="flex items-center gap-1 text-sm"
          style={{ color: 'var(--cyan)' }}
        >
          Detalle <ArrowRight size={14} />
        </Link>
        <Button size="sm" variant="secondary" onClick={() => onAward(badge)} leftIcon={<Send size={14} />}>
          Emitir
        </Button>
      </div>
    </Card>
  );
}
