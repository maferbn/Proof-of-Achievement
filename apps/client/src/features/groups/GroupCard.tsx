import { Link } from 'react-router-dom';
import { Users, BadgeCheck, MoreVertical, Pencil, Trash2, ArrowRight } from 'lucide-react';
import { useRef, useState } from 'react';
import { Card } from '../../components/ui';
import { pluralize } from '../../utils/format';
import type { Group } from '../../types/api';

interface GroupCardProps {
  group: Group;
  onEdit: (group: Group) => void;
  onDelete: (group: Group) => void;
}

export function GroupCard({ group, onEdit, onDelete }: GroupCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const members = group._count?.members ?? 0;
  const badges = group._count?.badgeDefinitions ?? 0;

  return (
    <Card padded interactive className="flex-col" style={{ position: 'relative' }}>
      <div className="flex items-start justify-between gap-2">
        <Link to={`/dashboard/groups/${group.id}`} className="flex-1" style={{ minWidth: 0 }}>
          <h3 className="truncate" style={{ fontSize: '1.1rem' }}>
            {group.name}
          </h3>
        </Link>
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            type="button"
            className="btn btn--ghost btn--icon"
            aria-label="Acciones del grupo"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
            onBlur={() => window.setTimeout(() => setMenuOpen(false), 120)}
          >
            <MoreVertical size={17} />
          </button>
          {menuOpen && (
            <div
              role="menu"
              className="card"
              style={{
                position: 'absolute',
                right: 0,
                top: '110%',
                zIndex: 5,
                padding: 6,
                minWidth: 160,
              }}
            >
              <button
                type="button"
                role="menuitem"
                className="nav-link w-full"
                onClick={() => {
                  setMenuOpen(false);
                  onEdit(group);
                }}
              >
                <Pencil size={15} /> Editar
              </button>
              <button
                type="button"
                role="menuitem"
                className="nav-link w-full"
                style={{ color: 'var(--danger)' }}
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(group);
                }}
              >
                <Trash2 size={15} /> Eliminar
              </button>
            </div>
          )}
        </div>
      </div>

      <p
        className="text-sm text-muted mt-2"
        style={{ flex: 1, minHeight: 40, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
      >
        {group.description || 'Sin descripción.'}
      </p>

      <div
        className="flex items-center justify-between mt-4"
        style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 'var(--sp-3)' }}
      >
        <div className="flex items-center gap-4 text-sm text-muted">
          <span className="flex items-center gap-1">
            <Users size={15} /> {pluralize(members, 'miembro')}
          </span>
          <span className="flex items-center gap-1">
            <BadgeCheck size={15} /> {pluralize(badges, 'logro')}
          </span>
        </div>
        <Link
          to={`/dashboard/groups/${group.id}`}
          className="flex items-center gap-1 text-sm"
          style={{ color: 'var(--cyan)' }}
        >
          Abrir <ArrowRight size={14} />
        </Link>
      </div>
    </Card>
  );
}
