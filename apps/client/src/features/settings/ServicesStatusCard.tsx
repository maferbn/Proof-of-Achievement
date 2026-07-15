import { Activity, Server, Boxes, Cloud, RefreshCw } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, Button, LoadingSpinner } from '../../components/ui';
import { useHealth } from '../../hooks/useHealth';
import { formatDateTime } from '../../utils/format';

type Tone = 'success' | 'warning' | 'danger' | 'neutral';

const TONE_COLOR: Record<Tone, string> = {
  success: 'var(--success)',
  warning: 'var(--warning)',
  danger: 'var(--danger)',
  neutral: 'var(--neutral)',
};

export function ServicesStatusCard() {
  const { data, isLoading, isError, refetch, isFetching, dataUpdatedAt, errorUpdatedAt } =
    useHealth();

  const backendOnline = !isError && !!data;
  const backend: { tone: Tone; text: string } = isError
    ? { tone: 'danger', text: 'Sin conexión' }
    : backendOnline
      ? { tone: 'success', text: 'En línea' }
      : { tone: 'neutral', text: 'Comprobando…' };

  const indexer = mapIndexer(backendOnline ? data?.eventIndexer : undefined);
  const ipfs = mapIpfs(backendOnline ? data?.ipfs : undefined);

  const lastCheck = Math.max(dataUpdatedAt || 0, errorUpdatedAt || 0);

  return (
    <Card padded className="flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Activity size={18} style={{ color: 'var(--cyan)' }} />
          <h3 style={{ fontSize: '1.05rem' }}>Estado de servicios</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => refetch()}
          leftIcon={<RefreshCw size={14} />}
          loading={isFetching}
          aria-label="Actualizar estado"
        >
          Actualizar
        </Button>
      </div>

      {isLoading ? (
        <LoadingSpinner center label="Consultando servicios…" />
      ) : (
        <div className="flex-col gap-3">
          <ServiceRow icon={Server} label="Backend" tone={backend.tone} text={backend.text} />
          <ServiceRow icon={Boxes} label="Indexador blockchain" tone={indexer.tone} text={indexer.text} />
          <ServiceRow icon={Cloud} label="IPFS / Pinata" tone={ipfs.tone} text={ipfs.text} />

          <div
            className="flex items-center justify-between gap-2 text-xs text-muted"
            style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 'var(--sp-3)' }}
          >
            <span>Última comprobación</span>
            <span>{lastCheck ? formatDateTime(new Date(lastCheck).toISOString()) : '—'}</span>
          </div>
        </div>
      )}
    </Card>
  );
}

function mapIndexer(value: string | undefined): { tone: Tone; text: string } {
  if (value === 'running') return { tone: 'success', text: 'Activo' };
  if (value === 'stopped') return { tone: 'warning', text: 'Detenido' };
  return { tone: 'neutral', text: 'Desconocido' };
}

function mapIpfs(value: string | undefined): { tone: Tone; text: string } {
  if (value === 'configured') return { tone: 'success', text: 'Configurado' };
  if (value === 'not configured') return { tone: 'warning', text: 'No configurado' };
  return { tone: 'neutral', text: 'Desconocido' };
}

interface ServiceRowProps {
  icon: LucideIcon;
  label: string;
  tone: Tone;
  text: string;
}

function ServiceRow({ icon: Icon, label, tone, text }: ServiceRowProps) {
  return (
    <div className="flex items-center justify-between gap-3" style={{ minHeight: 30 }}>
      <span className="flex items-center gap-2 text-sm text-muted">
        <Icon size={15} />
        {label}
      </span>
      <span className="flex items-center gap-2 text-sm" style={{ color: TONE_COLOR[tone] }}>
        <span
          aria-hidden
          style={{ width: 8, height: 8, borderRadius: '50%', background: 'currentColor', flexShrink: 0 }}
        />
        {text}
      </span>
    </div>
  );
}
