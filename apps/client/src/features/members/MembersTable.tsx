import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, IdCard, Link2 } from 'lucide-react';
import { ConfirmDialog } from '../../components/ui';
import { WalletAddress } from '../../components/web3/WalletAddress';
import { useRemoveMember } from '../../hooks/useMembers';
import { useToast } from '../../providers/toast-context';
import { getFriendlyError } from '../../utils/errors';
import { formatDate } from '../../utils/format';
import { profilePath, profileUrl } from '../../utils/profile';
import type { Member } from '../../types/api';

interface MembersTableProps {
  groupId: string;
  members: Member[];
}

export function MembersTable({ groupId, members }: MembersTableProps) {
  const remove = useRemoveMember(groupId);
  const toast = useToast();
  const [removing, setRemoving] = useState<Member | undefined>();

  const confirmRemove = async () => {
    if (!removing) return;
    try {
      await remove.mutateAsync(removing.id);
      toast.success('Miembro eliminado');
      setRemoving(undefined);
    } catch (e) {
      toast.error('No se pudo eliminar', getFriendlyError(e));
    }
  };

  const copyProfileLink = async (member: Member) => {
    try {
      await navigator.clipboard.writeText(profileUrl(member.id));
      toast.success('Enlace copiado', 'Compártelo con la persona titular.');
    } catch {
      toast.error('No se pudo copiar', 'Tu navegador bloqueó el portapapeles.');
    }
  };

  return (
    <>
      <div className="table-wrap card" style={{ padding: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Miembro</th>
              <th>Wallet</th>
              <th>Desde</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id}>
                <td className="text-strong">{m.displayName || <span className="text-muted">Sin nombre</span>}</td>
                <td>
                  <WalletAddress address={m.walletAddress} chars={5} explorer />
                </td>
                <td className="text-muted">{formatDate(m.joinedAt ?? m.createdAt)}</td>
                <td style={{ textAlign: 'right' }}>
                  <div className="flex items-center gap-1" style={{ justifyContent: 'flex-end' }}>
                    <Link
                      to={profilePath(m.id)}
                      className="btn btn--ghost btn--icon"
                      aria-label={`Ver perfil de ${m.displayName || m.walletAddress}`}
                      title="Ver perfil"
                    >
                      <IdCard size={16} />
                    </Link>
                    <button
                      type="button"
                      className="btn btn--ghost btn--icon"
                      onClick={() => copyProfileLink(m)}
                      aria-label="Copiar enlace de perfil"
                      title="Copiar enlace de perfil"
                    >
                      <Link2 size={16} />
                    </button>
                    <button
                      type="button"
                      className="btn btn--ghost btn--icon"
                      style={{ color: 'var(--danger)' }}
                      onClick={() => setRemoving(m)}
                      aria-label={`Eliminar a ${m.displayName || m.walletAddress}`}
                      title="Eliminar miembro"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={!!removing}
        title="Eliminar miembro"
        danger
        confirmLabel="Eliminar"
        loading={remove.isPending}
        onConfirm={confirmRemove}
        onCancel={() => setRemoving(undefined)}
      >
        Se eliminará a{' '}
        <strong className="text-strong">{removing?.displayName || removing?.walletAddress}</strong>{' '}
        del grupo. Esta acción es solo off-chain: los SBT que ya haya recibido permanecen en su
        wallet.
      </ConfirmDialog>
    </>
  );
}
