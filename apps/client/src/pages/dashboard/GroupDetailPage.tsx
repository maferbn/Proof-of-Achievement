import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Users, BadgeCheck, Pencil, Trash2, UserPlus, Plus, ArrowRight } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { Button, Card, ConfirmDialog, ErrorState, LoadingSpinner, EmptyState } from '../../components/ui';
import { WalletAddress } from '../../components/web3/WalletAddress';
import { GroupTabs } from '../../features/groups/GroupTabs';
import { GroupFormModal } from '../../features/groups/GroupFormModal';
import { useGroup, useDeleteGroup } from '../../hooks/useGroups';
import { useToast } from '../../providers/toast-context';
import { getFriendlyError } from '../../utils/errors';
import { formatDate } from '../../utils/format';

export function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { data: group, isLoading, isError, error, refetch } = useGroup(groupId);
  const del = useDeleteGroup();
  const toast = useToast();

  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const doDelete = async () => {
    if (!groupId) return;
    try {
      await del.mutateAsync(groupId);
      toast.success('Grupo eliminado');
      navigate('/dashboard/groups');
    } catch (e) {
      toast.error('No se pudo eliminar', getFriendlyError(e));
    }
  };

  if (isLoading) return <LoadingSpinner center label="Cargando grupo…" />;
  if (isError || !group)
    return (
      <ErrorState
        error={error}
        title="No se pudo cargar el grupo"
        onRetry={() => refetch()}
      />
    );

  const members = group.members ?? [];
  const badges = group.badgeDefinitions ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Grupo"
        title={group.name}
        description={group.description || 'Sin descripción.'}
        backTo="/dashboard/groups"
        backLabel="Grupos"
        actions={
          <>
            <Button variant="secondary" onClick={() => setEditOpen(true)} leftIcon={<Pencil size={15} />}>
              Editar
            </Button>
            <Button variant="danger" onClick={() => setConfirmDelete(true)} leftIcon={<Trash2 size={15} />}>
              Eliminar
            </Button>
          </>
        }
      />

      <GroupTabs groupId={group.id} />

      <div className="grid-stats">
        <StatCard icon={Users} label="Miembros" value={members.length} accent="var(--violet)" />
        <StatCard icon={BadgeCheck} label="Logros definidos" value={badges.length} accent="var(--cyan)" />
        <StatCard icon={BadgeCheck} label="Creado" value={<span style={{ fontSize: '1rem' }}>{formatDate(group.createdAt)}</span>} accent="var(--indigo)" />
      </div>

      <div
        className="grid gap-5 mt-6"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', alignItems: 'start' }}
      >
        <Card padded>
          <div className="flex items-center justify-between mb-3">
            <h3 style={{ fontSize: '1.05rem' }}>Miembros</h3>
            <Link to={`/dashboard/groups/${group.id}/members`} className="text-sm flex items-center gap-1" style={{ color: 'var(--cyan)' }}>
              Gestionar <ArrowRight size={14} />
            </Link>
          </div>
          {members.length === 0 ? (
            <EmptyState
              icon={UserPlus}
              title="Sin miembros"
              description="Añade wallets a este grupo para poder emitirles logros."
              action={
                <Link to={`/dashboard/groups/${group.id}/members`}>
                  <Button size="sm" leftIcon={<UserPlus size={15} />}>
                    Añadir miembro
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="flex-col gap-2">
              {members.slice(0, 5).map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-strong truncate">{m.displayName || 'Sin nombre'}</span>
                  <WalletAddress address={m.walletAddress} chars={4} />
                </div>
              ))}
              {members.length > 5 && (
                <Link to={`/dashboard/groups/${group.id}/members`} className="text-sm text-muted mt-2">
                  Ver los {members.length} miembros →
                </Link>
              )}
            </div>
          )}
        </Card>

        <Card padded>
          <div className="flex items-center justify-between mb-3">
            <h3 style={{ fontSize: '1.05rem' }}>Logros</h3>
            <Link to={`/dashboard/groups/${group.id}/badges`} className="text-sm flex items-center gap-1" style={{ color: 'var(--cyan)' }}>
              Gestionar <ArrowRight size={14} />
            </Link>
          </div>
          {badges.length === 0 ? (
            <EmptyState
              icon={Plus}
              title="Sin logros"
              description="Define logros para emitirlos como Soulbound Tokens."
              action={
                <Link to={`/dashboard/groups/${group.id}/badges`}>
                  <Button size="sm" leftIcon={<Plus size={15} />}>
                    Crear logro
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="flex-col gap-2">
              {badges.slice(0, 5).map((b) => (
                <Link
                  key={b.id}
                  to={`/dashboard/badges/${b.id}`}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="text-strong truncate">{b.name}</span>
                  <ArrowRight size={14} style={{ color: 'var(--text-faint)' }} />
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      <GroupFormModal open={editOpen} onClose={() => setEditOpen(false)} group={group} />
      <ConfirmDialog
        open={confirmDelete}
        title="Eliminar grupo"
        danger
        confirmLabel="Eliminar"
        loading={del.isPending}
        onConfirm={doDelete}
        onCancel={() => setConfirmDelete(false)}
      >
        ¿Seguro que quieres eliminar <strong className="text-strong">{group.name}</strong>? Se
        eliminarán sus miembros y definiciones de logros. Los SBT ya emitidos permanecen en la
        blockchain.
      </ConfirmDialog>
    </>
  );
}
