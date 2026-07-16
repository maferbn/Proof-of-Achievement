import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  Users,
  BadgeCheck,
  Zap,
  Plus,
  UserPlus,
  Send,
  Settings,
  ArrowRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { Card, Button, ErrorState } from '../../components/ui';
import { WalletAddress } from '../../components/web3/WalletAddress';
import { RelayerStatusCard } from '../../features/relayer/RelayerStatusCard';
import { GroupFormModal } from '../../features/groups/GroupFormModal';
import { useGroups } from '../../hooks/useGroups';
import { useRelayerStatus } from '../../hooks/useRelayer';
import { useAuth } from '../../providers/auth-context';

export function DashboardHome() {
  const { admin } = useAuth();
  const { data: groups, isLoading, isError, error, refetch } = useGroups();
  const { data: relayer } = useRelayerStatus();
  const [createOpen, setCreateOpen] = useState(false);

  const totals = useMemo(() => {
    const list = groups ?? [];
    return {
      groups: list.length,
      members: list.reduce((acc, g) => acc + (g._count?.members ?? 0), 0),
      badges: list.reduce((acc, g) => acc + (g._count?.badgeDefinitions ?? 0), 0),
    };
  }, [groups]);

  return (
    <>
      <PageHeader
        eyebrow="Panel"
        title={`Hola${admin?.displayName ? `, ${admin.displayName}` : ''}`}
        description={
          <span className="flex items-center gap-2 flex-wrap">
            Sesión activa como <WalletAddress address={admin?.walletAddress} chars={5} explorer />
          </span>
        }
        actions={
          <Button onClick={() => setCreateOpen(true)} leftIcon={<Plus size={16} />}>
            Nuevo grupo
          </Button>
        }
      />

      {isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <>
          <div className="grid-stats">
            <StatCard
              icon={FolderKanban}
              label="Grupos"
              value={totals.groups}
              loading={isLoading}
              accent="var(--indigo)"
            />
            <StatCard
              icon={Users}
              label="Miembros"
              value={totals.members}
              loading={isLoading}
              accent="var(--violet)"
            />
            <StatCard
              icon={BadgeCheck}
              label="Definiciones de logros"
              value={totals.badges}
              loading={isLoading}
              accent="var(--cyan)"
            />
            <StatCard
              icon={Zap}
              label="Emisión"
              value={relayer?.isActive ? 'Activa' : 'Inactiva'}
              accent={relayer?.isActive ? 'var(--success)' : 'var(--warning)'}
              hint={relayer?.isActive ? 'Relayer con MINTER_ROLE' : 'Actívala para emitir'}
            />
          </div>

          <div
            className="grid gap-5 mt-6"
            style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', alignItems: 'start' }}
          >
            <RelayerStatusCard />

            <Card padded>
              <h3 style={{ fontSize: '1.05rem' }}>Acciones rápidas</h3>
              <p className="text-xs text-muted mt-2 mb-4">
                Miembros y logros se gestionan dentro de cada grupo.
              </p>
              <div className="flex-col gap-2">
                <QuickAction
                  to="/dashboard/groups"
                  icon={FolderKanban}
                  title="Ver grupos"
                  desc="Explora y administra tus grupos"
                />
                <QuickAction
                  to="/dashboard/groups"
                  icon={UserPlus}
                  title="Añadir miembro"
                  desc="Registra una wallet en un grupo"
                />
                <QuickAction
                  to="/dashboard/groups"
                  icon={BadgeCheck}
                  title="Crear logro"
                  desc="Define una nueva credencial"
                />
                <QuickAction
                  to="/dashboard/groups"
                  icon={Send}
                  title="Emitir logro"
                  desc="Otorga un SBT a un miembro"
                />
                <QuickAction
                  to="/dashboard/settings"
                  icon={Settings}
                  title="Ajustes y emisión"
                  desc="Relayer, MINTER_ROLE y cuenta"
                />
              </div>
            </Card>
          </div>
        </>
      )}

      <GroupFormModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}

function QuickAction({
  to,
  icon: Icon,
  title,
  desc,
}: {
  to: string;
  icon: LucideIcon;
  title: string;
  desc: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3"
      style={{
        padding: '0.7rem 0.85rem',
        borderRadius: 'var(--r-sm)',
        border: '1px solid var(--glass-border)',
        background: 'var(--glass-bg)',
        transition: 'border-color 180ms ease, background 180ms ease',
      }}
    >
      <span
        className="flex items-center justify-center"
        style={{
          width: 32,
          height: 32,
          borderRadius: 'var(--r-sm)',
          background: 'var(--glass-bg-strong)',
          color: 'var(--cyan)',
          flexShrink: 0,
        }}
      >
        <Icon size={16} />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span className="text-strong font-semibold" style={{ display: 'block', fontSize: '0.92rem' }}>
          {title}
        </span>
        <span className="text-xs text-muted">{desc}</span>
      </span>
      <ArrowRight size={16} style={{ color: 'var(--text-faint)' }} />
    </Link>
  );
}
