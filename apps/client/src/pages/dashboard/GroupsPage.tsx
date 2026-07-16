import { useState } from 'react';
import { FolderKanban, Plus } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import {
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  SkeletonCard,
} from '../../components/ui';
import { GroupCard } from '../../features/groups/GroupCard';
import { GroupFormModal } from '../../features/groups/GroupFormModal';
import { useGroups, useDeleteGroup } from '../../hooks/useGroups';
import { useToast } from '../../providers/toast-context';
import { getFriendlyError } from '../../utils/errors';
import type { Group } from '../../types/api';

export function GroupsPage() {
  const { data: groups, isLoading, isError, error, refetch } = useGroups();
  const del = useDeleteGroup();
  const toast = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Group | undefined>();
  const [deleting, setDeleting] = useState<Group | undefined>();

  const openCreate = () => {
    setEditing(undefined);
    setFormOpen(true);
  };
  const openEdit = (group: Group) => {
    setEditing(group);
    setFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await del.mutateAsync(deleting.id);
      toast.success('Grupo eliminado');
      setDeleting(undefined);
    } catch (e) {
      toast.error('No se pudo eliminar', getFriendlyError(e));
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Administración"
        title="Grupos"
        description="Organiza a las personas en grupos para emitirles logros verificables."
        actions={
          <Button onClick={openCreate} leftIcon={<Plus size={16} />}>
            Nuevo grupo
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid-cards">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : !groups || groups.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="Aún no tienes grupos"
          description="Crea tu primer grupo para empezar a añadir miembros y definir logros."
          action={
            <Button onClick={openCreate} leftIcon={<Plus size={16} />}>
              Crear grupo
            </Button>
          }
        />
      ) : (
        <div className="grid-cards fade-up">
          {groups.map((g) => (
            <GroupCard key={g.id} group={g} onEdit={openEdit} onDelete={setDeleting} />
          ))}
        </div>
      )}

      <GroupFormModal open={formOpen} onClose={() => setFormOpen(false)} group={editing} />

      <ConfirmDialog
        open={!!deleting}
        title="Eliminar grupo"
        danger
        confirmLabel="Eliminar"
        loading={del.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(undefined)}
      >
        ¿Seguro que quieres eliminar <strong className="text-strong">{deleting?.name}</strong>? Se
        eliminarán también sus miembros y definiciones de logros. Los SBT ya emitidos permanecen
        en la blockchain.
      </ConfirmDialog>
    </>
  );
}
