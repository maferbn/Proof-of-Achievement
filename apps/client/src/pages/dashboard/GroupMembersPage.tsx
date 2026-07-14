import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Button, EmptyState, ErrorState, LoadingSpinner } from '../../components/ui';
import { GroupTabs } from '../../features/groups/GroupTabs';
import { AddMemberModal } from '../../features/members/AddMemberModal';
import { MembersTable } from '../../features/members/MembersTable';
import { useGroup } from '../../hooks/useGroups';

export function GroupMembersPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { data: group, isLoading, isError, error, refetch } = useGroup(groupId);
  const [addOpen, setAddOpen] = useState(false);

  const members = group?.members ?? [];

  return (
    <>
      <PageHeader
        eyebrow={group?.name ?? 'Grupo'}
        title="Miembros"
        description="Wallets registradas en este grupo. Solo los miembros pueden recibir sus logros."
        backTo={`/dashboard/groups/${groupId}`}
        backLabel="Grupo"
        actions={
          <Button onClick={() => setAddOpen(true)} leftIcon={<UserPlus size={16} />} disabled={!group}>
            Añadir miembro
          </Button>
        }
      />

      {groupId && <GroupTabs groupId={groupId} />}

      {isLoading ? (
        <LoadingSpinner center label="Cargando miembros…" />
      ) : isError || !group ? (
        <ErrorState error={error} title="No se pudo cargar el grupo" onRetry={() => refetch()} />
      ) : members.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title="Aún no hay miembros"
          description="Añade la primera wallet para empezar a emitir logros en este grupo."
          action={
            <Button onClick={() => setAddOpen(true)} leftIcon={<UserPlus size={16} />}>
              Añadir miembro
            </Button>
          }
        />
      ) : (
        <div className="fade-up">
          <MembersTable groupId={group.id} members={members} />
        </div>
      )}

      {groupId && <AddMemberModal open={addOpen} onClose={() => setAddOpen(false)} groupId={groupId} />}
    </>
  );
}
