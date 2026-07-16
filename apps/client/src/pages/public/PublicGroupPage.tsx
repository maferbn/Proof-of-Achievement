import { useParams, Link } from 'react-router-dom';
import { Users, BadgeCheck, ArrowRight, ShieldCheck } from 'lucide-react';
import { Card, ErrorState, LoadingSpinner, EmptyState } from '../../components/ui';
import { StatCard } from '../../components/common/StatCard';
import { BadgeImage } from '../../components/web3/BadgeImage';
import { useGroup } from '../../hooks/useGroups';
import { useGroupBadges } from '../../hooks/useBadges';
import { pluralize } from '../../utils/format';

export function PublicGroupPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { data: group, isLoading, isError, error, refetch } = useGroup(groupId);
  const { data: badges } = useGroupBadges(groupId);

  if (isLoading)
    return (
      <div className="container section">
        <LoadingSpinner center label="Cargando grupo…" />
      </div>
    );
  if (isError || !group)
    return (
      <div className="container section">
        <ErrorState error={error} title="Grupo no encontrado" onRetry={() => refetch()} />
      </div>
    );

  const memberCount = group._count?.members ?? group.members?.length ?? 0;
  const badgeList = badges ?? group.badgeDefinitions ?? [];

  return (
    <div className="container section">
      <span className="chip chip--soulbound mb-4">
        <ShieldCheck size={13} /> Perfil público verificable
      </span>
      <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)' }}>{group.name}</h1>
      {group.description && (
        <p className="text-muted mt-3" style={{ maxWidth: 640 }}>
          {group.description}
        </p>
      )}

      <div className="grid-stats mt-6">
        <StatCard icon={Users} label="Miembros" value={memberCount} accent="var(--violet)" />
        <StatCard icon={BadgeCheck} label="Logros" value={badgeList.length} accent="var(--cyan)" />
      </div>

      <h2 className="mt-6 mb-4" style={{ fontSize: '1.3rem' }}>
        Logros del grupo
      </h2>

      {badgeList.length === 0 ? (
        <EmptyState icon={BadgeCheck} title="Este grupo aún no ha definido logros" />
      ) : (
        <div className="grid-cards">
          {badgeList.map((b) => {
            const awarded = b._count?.badgeAwards ?? b.badgeAwards?.length ?? 0;
            return (
              <Link key={b.id} to={`/badges/${b.id}`}>
                <Card padded interactive className="flex-col" style={{ height: '100%' }}>
                  <div className="flex items-start gap-3">
                    <BadgeImage uri={b.imageURI} size={52} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 className="truncate" style={{ fontSize: '1.05rem' }}>
                        {b.name}
                      </h3>
                      <p className="text-xs text-muted mt-2">{pluralize(awarded, 'emisión', 'emisiones')}</p>
                    </div>
                  </div>
                  <p
                    className="text-sm text-muted mt-3"
                    style={{ flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                  >
                    {b.description || 'Sin descripción.'}
                  </p>
                  <span className="flex items-center gap-1 text-sm mt-3" style={{ color: 'var(--cyan)' }}>
                    Verificar <ArrowRight size={14} />
                  </span>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
