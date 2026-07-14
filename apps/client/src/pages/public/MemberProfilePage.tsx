import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import {
  BadgeCheck,
  ShieldCheck,
  Wallet,
  Clock,
  CheckCircle2,
  Ban,
  FolderKanban,
  ArrowRight,
  Award,
  UserCircle,
} from 'lucide-react';
import { Card, ErrorState, LoadingSpinner, EmptyState, AwardStatusBadge } from '../../components/ui';
import { StatCard } from '../../components/common/StatCard';
import { BadgeImage } from '../../components/web3/BadgeImage';
import { WalletAddress } from '../../components/web3/WalletAddress';
import { TransactionHash } from '../../components/web3/TransactionHash';
import { SoulboundTag } from '../../components/web3/SoulboundTag';
import { useMemberBadges } from '../../hooks/useBadges';
import { formatDate, pluralize } from '../../utils/format';
import type { BadgeAward, Group } from '../../types/api';

export function MemberProfilePage() {
  const { memberId } = useParams<{ memberId: string }>();
  const { data, isLoading, isError, error, refetch } = useMemberBadges(memberId);
  const { address, isConnected } = useAccount();

  const member = data?.member;
  const badges = useMemo(() => data?.badges ?? [], [data]);

  const isOwner =
    isConnected &&
    !!address &&
    !!member &&
    address.toLowerCase() === member.walletAddress.toLowerCase();

  const summary = useMemo(() => {
    const groups = new Set<string>();
    let confirmed = 0;
    let pending = 0;
    let revoked = 0;
    for (const b of badges) {
      if (b.status === 'confirmed') confirmed++;
      else if (b.status === 'pending') pending++;
      else if (b.status === 'revoked') revoked++;
      const gid = b.badgeDefinition?.group?.id;
      if (gid) groups.add(gid);
    }
    return { total: badges.length, confirmed, pending, revoked, groups: groups.size };
  }, [badges]);

  const groupedByGroup = useMemo(() => groupBadgesByGroup(badges), [badges]);

  if (isLoading) {
    return (
      <div className="container section">
        <LoadingSpinner center label="Cargando perfil…" />
      </div>
    );
  }
  if (isError || !member) {
    return (
      <div className="container section">
        <ErrorState
          error={error}
          title="Perfil no encontrado"
          message="No encontramos un miembro con este identificador. Verifica el enlace que te compartieron."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const heading = isOwner ? 'Mis logros' : 'Logros';

  return (
    <div className="container section">
      {/* ---------- Header ---------- */}
      <div className="flex items-start gap-4 flex-wrap">
        <div
          className="flex items-center justify-center"
          style={{
            width: 64,
            height: 64,
            borderRadius: 'var(--r-lg)',
            background: 'var(--brand-gradient-soft)',
            border: '1px solid var(--glass-border)',
            color: 'var(--cyan)',
            flexShrink: 0,
          }}
        >
          <UserCircle size={34} />
        </div>
        <div style={{ flex: 1, minWidth: 240 }}>
          <span className="chip chip--soulbound mb-2">
            <Award size={13} /> Perfil de logros
          </span>
          <h1 style={{ fontSize: 'clamp(1.6rem, 3.4vw, 2.3rem)' }}>
            {member.displayName || 'Miembro'}
          </h1>
          <div className="mt-2">
            <WalletAddress address={member.walletAddress} chars={6} explorer />
          </div>
        </div>
        <OwnershipBadge isConnected={isConnected} isOwner={isOwner} />
      </div>

      {/* ---------- Ownership banner ---------- */}
      <OwnershipBanner isConnected={isConnected} isOwner={isOwner} />

      {/* ---------- Summary ---------- */}
      <div className="grid-stats mt-6">
        <StatCard icon={BadgeCheck} label="Logros" value={summary.total} accent="var(--indigo)" />
        <StatCard icon={CheckCircle2} label="Confirmados" value={summary.confirmed} accent="var(--success)" />
        <StatCard icon={Clock} label="Pendientes" value={summary.pending} accent="var(--warning)" />
        <StatCard icon={Ban} label="Revocados" value={summary.revoked} accent="var(--neutral)" />
        <StatCard icon={FolderKanban} label="Grupos" value={summary.groups} accent="var(--cyan)" />
      </div>

      {/* ---------- Achievements ---------- */}
      <h2 className="mt-6 mb-4" style={{ fontSize: '1.3rem' }}>
        {heading}
      </h2>
      {badges.length === 0 ? (
        <EmptyState
          icon={Award}
          title="Todavía no hay logros"
          description="Cuando una organización emita un logro a esta wallet aparecerá aquí, verificable on-chain."
        />
      ) : (
        <div className="grid-cards fade-up">
          {badges.map((b) => (
            <AchievementCard key={b.id} award={b} />
          ))}
        </div>
      )}

      {/* ---------- Groups ---------- */}
      {groupedByGroup.length > 0 && (
        <>
          <h2 className="mt-6 mb-4" style={{ fontSize: '1.3rem' }}>
            {isOwner ? 'Mis grupos' : 'Grupos'}
          </h2>
          <div className="grid-cards">
            {groupedByGroup.map(({ group, count }) => (
              <Link key={group.id} to={`/groups/${group.id}`}>
                <Card padded interactive className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3" style={{ minWidth: 0 }}>
                    <span
                      className="flex items-center justify-center"
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 'var(--r-sm)',
                        background: 'var(--glass-bg-strong)',
                        color: 'var(--cyan)',
                        flexShrink: 0,
                      }}
                    >
                      <FolderKanban size={18} />
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div className="text-strong font-semibold truncate">{group.name}</div>
                      <div className="text-xs text-muted">{pluralize(count, 'logro')}</div>
                    </div>
                  </div>
                  <ArrowRight size={16} style={{ color: 'var(--text-faint)', flexShrink: 0 }} />
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------- Ownership UI ---------------- */
function OwnershipBadge({ isConnected, isOwner }: { isConnected: boolean; isOwner: boolean }) {
  if (isOwner) {
    return (
      <span className="status status--success" style={{ alignSelf: 'center' }}>
        <ShieldCheck size={13} /> Mi perfil · Wallet verificada
      </span>
    );
  }
  if (isConnected) {
    return (
      <span className="status status--neutral" style={{ alignSelf: 'center' }}>
        <span className="status__dot" aria-hidden /> Perfil público
      </span>
    );
  }
  return null;
}

function OwnershipBanner({ isConnected, isOwner }: { isConnected: boolean; isOwner: boolean }) {
  if (isOwner) {
    return (
      <Card
        padded
        className="mt-5 flex items-start gap-2"
        style={{ background: 'var(--success-bg)', borderColor: 'var(--success-border)' }}
      >
        <ShieldCheck size={18} style={{ color: 'var(--success)', flexShrink: 0, marginTop: 1 }} />
        <p className="text-sm" style={{ color: 'var(--text)' }}>
          <strong className="text-strong">Wallet verificada.</strong> La wallet conectada coincide
          con la de este perfil. Esta comprobación es solo del navegador y no te otorga permisos de
          administración.
        </p>
      </Card>
    );
  }

  if (!isConnected) {
    return (
      <Card padded className="mt-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-2" style={{ flex: 1, minWidth: 240 }}>
            <Wallet size={18} style={{ color: 'var(--cyan)', flexShrink: 0, marginTop: 1 }} />
            <p className="text-sm" style={{ color: 'var(--text)' }}>
              Conecta tu wallet para verificar si este perfil te pertenece. Es gratis y no firma
              ninguna transacción.
            </p>
          </div>
          <ConnectButton showBalance={false} chainStatus="none" label="Conectar wallet" />
        </div>
      </Card>
    );
  }

  // Connected but not the owner
  return (
    <Card
      padded
      className="mt-5 flex items-start gap-2"
      style={{ background: 'var(--glass-bg)' }}
    >
      <UserCircle size={18} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 1 }} />
      <p className="text-sm text-muted">
        Estás viendo un <strong className="text-strong">perfil público</strong>. La wallet conectada
        no corresponde al titular de este perfil, pero puedes consultar sus logros verificables.
      </p>
    </Card>
  );
}

/* ---------------- Achievement card ---------------- */
function AchievementCard({ award }: { award: BadgeAward }) {
  const def = award.badgeDefinition;
  const group = def?.group;

  return (
    <Card padded interactive className="flex-col">
      <div className="flex items-start gap-3">
        <BadgeImage uri={def?.imageURI} size={52} />
        <div style={{ flex: 1, minWidth: 0 }}>
          {def ? (
            <Link to={`/badges/${def.id}`}>
              <h3 className="truncate" style={{ fontSize: '1.05rem' }}>
                {def.name}
              </h3>
            </Link>
          ) : (
            <h3 className="truncate" style={{ fontSize: '1.05rem' }}>
              Logro
            </h3>
          )}
          {group && (
            <Link
              to={`/groups/${group.id}`}
              className="text-xs flex items-center gap-1 mt-1"
              style={{ color: 'var(--cyan)', width: 'fit-content' }}
            >
              <FolderKanban size={12} /> {group.name}
            </Link>
          )}
        </div>
        <AwardStatusBadge status={award.status} />
      </div>

      {def?.description && (
        <p
          className="text-sm text-muted mt-3"
          style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
        >
          {def.description}
        </p>
      )}

      <div
        className="flex-col gap-2 mt-3"
        style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 'var(--sp-3)' }}
      >
        <InfoLine label="Emitido">{formatDate(award.awardedAt ?? award.createdAt)}</InfoLine>
        <InfoLine label="Token ID">
          {award.onChainTokenId != null ? (
            <span className="mono">#{award.onChainTokenId}</span>
          ) : (
            <span className="text-muted">—</span>
          )}
        </InfoLine>
        <InfoLine label="Transacción">
          <TransactionHash hash={award.transactionHash} chars={4} />
        </InfoLine>
      </div>

      <div className="flex items-center justify-between gap-2 mt-3">
        <SoulboundTag label="No transferible" />
        {def && (
          <Link
            to={`/badges/${def.id}`}
            className="flex items-center gap-1 text-sm"
            style={{ color: 'var(--cyan)' }}
          >
            Verificar <ArrowRight size={14} />
          </Link>
        )}
      </div>
    </Card>
  );
}

function InfoLine({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <span className="text-muted">{label}</span>
      <span className="text-strong">{children}</span>
    </div>
  );
}

/* ---------------- helpers ---------------- */
function groupBadgesByGroup(badges: BadgeAward[]): { group: Group; count: number }[] {
  const map = new Map<string, { group: Group; count: number }>();
  for (const b of badges) {
    const group = b.badgeDefinition?.group;
    if (!group) continue;
    const entry = map.get(group.id);
    if (entry) entry.count++;
    else map.set(group.id, { group, count: 1 });
  }
  return Array.from(map.values());
}
