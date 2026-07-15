import { useState } from 'react';
import type { ReactNode } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Send, FolderKanban, Link as LinkIcon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Button, Card, ErrorState, LoadingSpinner } from '../../components/ui';
import { BadgeImage } from '../../components/web3/BadgeImage';
import { SoulboundTag } from '../../components/web3/SoulboundTag';
import { AwardsTable } from '../../features/badges/AwardsTable';
import { AwardBadgeModal } from '../../features/badges/AwardBadgeModal';
import { useBadgeDefinition, useGroupBadges } from '../../hooks/useBadges';
import { useGroup } from '../../hooks/useGroups';
import { formatDate } from '../../utils/format';

export function BadgeDetailPage() {
  const { badgeId } = useParams<{ badgeId: string }>();
  const { data: badge, isLoading, isError, error, refetch } = useBadgeDefinition(badgeId);

  const groupId = badge?.groupId;
  const groupBadges = useGroupBadges(groupId);
  const { data: group } = useGroup(groupId);

  const [awardOpen, setAwardOpen] = useState(false);

  if (isLoading) return <LoadingSpinner center label="Cargando logro…" />;
  if (isError || !badge)
    return <ErrorState error={error} title="No se pudo cargar el logro" onRetry={() => refetch()} />;

  const detailed = groupBadges.data?.find((b) => b.id === badge.id);
  const awards = detailed?.badgeAwards ?? [];
  const members = group?.members ?? [];
  const awardedCount = badge._count?.badgeAwards ?? awards.length;

  return (
    <>
      <PageHeader
        eyebrow="Logro"
        title={badge.name}
        backTo={groupId ? `/dashboard/groups/${groupId}/badges` : '/dashboard/groups'}
        backLabel="Logros del grupo"
        actions={
          <Button
            onClick={() => setAwardOpen(true)}
            leftIcon={<Send size={16} />}
            disabled={members.length === 0}
          >
            Emitir logro
          </Button>
        }
      />

      <div
        className="grid gap-5"
        style={{ gridTemplateColumns: 'minmax(260px, 340px) 1fr', alignItems: 'start' }}
      >
        <Card padded className="flex-col gap-4" style={{ gridColumn: 'auto' }}>
          <div className="flex items-center gap-3">
            <BadgeImage uri={badge.imageURI} size={72} radius="var(--r-lg)" />
            <div style={{ minWidth: 0 }}>
              <SoulboundTag />
              <div className="text-sm text-muted mt-2">
                {awardedCount} {awardedCount === 1 ? 'emisión' : 'emisiones'}
              </div>
            </div>
          </div>

          <p className="text-sm text-muted">{badge.description || 'Sin descripción.'}</p>

          <div className="flex-col gap-3" style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 'var(--sp-3)' }}>
            {group && (
              <InfoRow icon={FolderKanban} label="Grupo">
                <Link to={`/dashboard/groups/${group.id}`} style={{ color: 'var(--cyan)' }}>
                  {group.name}
                </Link>
              </InfoRow>
            )}
            {badge.imageURI && (
              <InfoRow icon={LinkIcon} label="Metadata URI">
                <span className="mono text-xs break-all" style={{ textAlign: 'right' }}>
                  {badge.imageURI}
                </span>
              </InfoRow>
            )}
            <InfoRow icon={FolderKanban} label="Creado">
              <span className="text-sm">{formatDate(badge.createdAt)}</span>
            </InfoRow>
          </div>
        </Card>

        <div className="flex-col gap-3" style={{ minWidth: 0 }}>
          <h3 style={{ fontSize: '1.05rem' }}>Emisiones</h3>
          {groupBadges.isLoading ? (
            <LoadingSpinner center label="Cargando emisiones…" />
          ) : (
            <AwardsTable awards={awards} groupId={groupId} badgeName={badge.name} />
          )}
        </div>
      </div>

      {groupId && (
        <AwardBadgeModal
          open={awardOpen}
          onClose={() => setAwardOpen(false)}
          groupId={groupId}
          badges={detailed ? [detailed] : [badge]}
          members={members}
          preselectedBadgeId={badge.id}
        />
      )}
    </>
  );
}

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-sm text-muted" style={{ flexShrink: 0 }}>
        <Icon size={15} />
        {label}
      </span>
      <span style={{ minWidth: 0 }}>{children}</span>
    </div>
  );
}
