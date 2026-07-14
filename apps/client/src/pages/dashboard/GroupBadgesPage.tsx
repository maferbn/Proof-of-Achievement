import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Send, BadgeCheck } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Button, EmptyState, ErrorState, SkeletonCard } from '../../components/ui';
import { GroupTabs } from '../../features/groups/GroupTabs';
import { BadgeFormModal } from '../../features/badges/BadgeFormModal';
import { BadgeDefinitionCard } from '../../features/badges/BadgeDefinitionCard';
import { AwardBadgeModal } from '../../features/badges/AwardBadgeModal';
import { useGroupBadges } from '../../hooks/useBadges';
import { useGroup } from '../../hooks/useGroups';
import type { BadgeDefinition } from '../../types/api';

export function GroupBadgesPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const badgesQuery = useGroupBadges(groupId);
  const { data: group } = useGroup(groupId);

  const [createOpen, setCreateOpen] = useState(false);
  const [awardOpen, setAwardOpen] = useState(false);
  const [preselected, setPreselected] = useState<string | undefined>();

  const badges = badgesQuery.data ?? [];
  const members = group?.members ?? [];

  const openAward = (badge?: BadgeDefinition) => {
    setPreselected(badge?.id);
    setAwardOpen(true);
  };

  return (
    <>
      <PageHeader
        eyebrow={group?.name ?? 'Grupo'}
        title="Logros"
        description="Define credenciales y emítelas como Soulbound Tokens no transferibles."
        backTo={`/dashboard/groups/${groupId}`}
        backLabel="Grupo"
        actions={
          <>
            <Button variant="secondary" onClick={() => openAward()} leftIcon={<Send size={16} />} disabled={badges.length === 0 || members.length === 0}>
              Emitir logro
            </Button>
            <Button onClick={() => setCreateOpen(true)} leftIcon={<Plus size={16} />}>
              Nuevo logro
            </Button>
          </>
        }
      />

      {groupId && <GroupTabs groupId={groupId} />}

      {badgesQuery.isLoading ? (
        <div className="grid-cards">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : badgesQuery.isError ? (
        <ErrorState error={badgesQuery.error} onRetry={() => badgesQuery.refetch()} />
      ) : badges.length === 0 ? (
        <EmptyState
          icon={BadgeCheck}
          title="Aún no hay logros"
          description="Crea tu primer logro para este grupo. Luego podrás emitirlo a sus miembros."
          action={
            <Button onClick={() => setCreateOpen(true)} leftIcon={<Plus size={16} />}>
              Crear logro
            </Button>
          }
        />
      ) : (
        <div className="grid-cards fade-up">
          {badges.map((b) => (
            <BadgeDefinitionCard key={b.id} badge={b} onAward={openAward} />
          ))}
        </div>
      )}

      {groupId && (
        <>
          <BadgeFormModal open={createOpen} onClose={() => setCreateOpen(false)} groupId={groupId} />
          <AwardBadgeModal
            open={awardOpen}
            onClose={() => setAwardOpen(false)}
            groupId={groupId}
            badges={badges}
            members={members}
            preselectedBadgeId={preselected}
          />
        </>
      )}
    </>
  );
}
