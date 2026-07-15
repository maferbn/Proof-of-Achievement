import { useParams, Link } from 'react-router-dom';
import { FolderKanban, Users, ShieldCheck, Link2Off } from 'lucide-react';
import { Card, ErrorState, LoadingSpinner, EmptyState, AwardStatusBadge } from '../../components/ui';
import { BadgeImage } from '../../components/web3/BadgeImage';
import { SoulboundTag } from '../../components/web3/SoulboundTag';
import { WalletAddress } from '../../components/web3/WalletAddress';
import { TransactionHash } from '../../components/web3/TransactionHash';
import { TokenId } from '../../components/web3/TokenId';
import { useBadgeDefinition, useGroupBadges } from '../../hooks/useBadges';
import { pluralize } from '../../utils/format';

export function PublicBadgePage() {
  const { badgeId } = useParams<{ badgeId: string }>();
  const { data: badge, isLoading, isError, error, refetch } = useBadgeDefinition(badgeId);
  const groupBadges = useGroupBadges(badge?.groupId);

  if (isLoading)
    return (
      <div className="container section">
        <LoadingSpinner center label="Cargando logro…" />
      </div>
    );
  if (isError || !badge)
    return (
      <div className="container section">
        <ErrorState error={error} title="Logro no encontrado" onRetry={() => refetch()} />
      </div>
    );

  const detailed = groupBadges.data?.find((b) => b.id === badge.id);
  const awards = detailed?.badgeAwards ?? [];
  const group = detailed?.group;
  const holders = badge._count?.badgeAwards ?? awards.length;

  return (
    <div className="container section">
      <span className="chip chip--soulbound mb-4">
        <ShieldCheck size={13} /> Verificación on-chain
      </span>

      <div className="flex items-start gap-4 flex-wrap">
        <BadgeImage uri={badge.imageURI} size={96} radius="var(--r-lg)" />
        <div style={{ flex: 1, minWidth: 240 }}>
          <h1 style={{ fontSize: 'clamp(1.7rem, 3.6vw, 2.4rem)' }}>{badge.name}</h1>
          <div className="flex items-center gap-2 flex-wrap mt-3">
            <SoulboundTag />
            <span className="chip">
              <Users size={13} /> {pluralize(holders, 'titular', 'titulares')}
            </span>
            {group && (
              <Link to={`/groups/${group.id}`} className="chip" style={{ color: 'var(--cyan)' }}>
                <FolderKanban size={13} /> {group.name}
              </Link>
            )}
          </div>
          {badge.description && (
            <p className="text-muted mt-4" style={{ maxWidth: 620 }}>
              {badge.description}
            </p>
          )}
        </div>
      </div>

      <Card padded className="mt-6 flex items-start gap-2" style={{ background: 'var(--info-bg)', borderColor: 'var(--info-border)' }}>
        <Link2Off size={16} style={{ color: 'var(--info)', flexShrink: 0, marginTop: 2 }} />
        <p className="text-sm" style={{ color: 'var(--text)' }}>
          Este es un <strong className="text-strong">Soulbound Token (ERC-5192)</strong>: es no
          transferible. No puede enviarse, venderse ni intercambiarse; permanece ligado a la wallet
          que lo recibió. El emisor puede revocarlo, y esa revocación queda registrada de forma
          pública.
        </p>
      </Card>

      <h2 className="mt-6 mb-4" style={{ fontSize: '1.3rem' }}>
        Titulares
      </h2>

      {groupBadges.isLoading ? (
        <LoadingSpinner center label="Cargando titulares…" />
      ) : awards.length === 0 ? (
        <EmptyState icon={Users} title="Este logro aún no tiene titulares" />
      ) : (
        <div className="table-wrap card" style={{ padding: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Titular</th>
                <th>Estado</th>
                <th>Token</th>
                <th>Transacción</th>
              </tr>
            </thead>
            <tbody>
              {awards.map((a) => (
                <tr key={a.id}>
                  <td>
                    {a.member?.displayName ? (
                      <span className="flex-col">
                        <span className="text-strong">{a.member.displayName}</span>
                        <WalletAddress address={a.member.walletAddress} chars={4} copyable={false} explorer />
                      </span>
                    ) : (
                      <WalletAddress address={a.member?.walletAddress} chars={5} explorer />
                    )}
                  </td>
                  <td>
                    <AwardStatusBadge status={a.status} />
                  </td>
                  <td>
                    <TokenId value={a.onChainTokenId} status={a.status} />
                  </td>
                  <td>
                    <TransactionHash hash={a.transactionHash} chars={4} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
