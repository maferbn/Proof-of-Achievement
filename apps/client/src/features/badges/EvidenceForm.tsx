import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Input, Select } from '../../components/ui';
import type { SelectOption } from '../../components/ui';
import type { Evidence, EvidenceType } from '../../types/api';

interface FieldSpec {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date';
  required?: boolean;
  placeholder?: string;
}

const EVIDENCE_TYPES: SelectOption[] = [
  { value: 'course_completion', label: 'Curso completado' },
  { value: 'exam_pass', label: 'Examen aprobado' },
  { value: 'game_win', label: 'Victoria en videojuego' },
  { value: 'contribution', label: 'Contribución' },
  { value: 'generic', label: 'Evidencia genérica' },
];

const FIELDS: Record<Exclude<EvidenceType, 'generic'>, FieldSpec[]> = {
  course_completion: [
    { key: 'courseId', label: 'ID del curso', type: 'text', required: true },
    { key: 'completionDate', label: 'Fecha de finalización', type: 'date', required: true },
  ],
  exam_pass: [
    { key: 'examId', label: 'ID del examen', type: 'text', required: true },
    { key: 'score', label: 'Calificación', type: 'number', required: true },
    { key: 'minPassingScore', label: 'Nota mínima para aprobar', type: 'number', placeholder: '70' },
  ],
  game_win: [
    { key: 'gameId', label: 'ID del juego', type: 'text', required: true },
    { key: 'matchId', label: 'ID de partida', type: 'text', required: true },
    { key: 'score', label: 'Puntuación (opcional)', type: 'number' },
    { key: 'minScore', label: 'Puntuación mínima (opcional)', type: 'number' },
  ],
  contribution: [
    { key: 'contributionType', label: 'Tipo de contribución', type: 'text', required: true },
    { key: 'contributionId', label: 'ID de contribución', type: 'text', required: true },
  ],
};

const NUMERIC_KEYS = new Set(['score', 'minPassingScore', 'minScore']);

interface GenericPair {
  key: string;
  value: string;
}

/** Builds the Evidence payload, or null when required fields are missing. */
function buildEvidence(
  type: EvidenceType,
  data: Record<string, string>,
  pairs: GenericPair[],
): Evidence | null {
  if (type === 'generic') {
    const obj: Record<string, unknown> = {};
    for (const p of pairs) {
      const k = p.key.trim();
      if (k) obj[k] = p.value;
    }
    return Object.keys(obj).length > 0 ? { type, data: obj } : null;
  }

  const obj: Record<string, unknown> = {};
  for (const f of FIELDS[type]) {
    const raw = (data[f.key] ?? '').trim();
    if (!raw) {
      if (f.required) return null;
      continue;
    }
    obj[f.key] = NUMERIC_KEYS.has(f.key) ? Number(raw) : raw;
  }
  return { type, data: obj };
}

interface EvidenceFormProps {
  /** Emits the current evidence, or null when incomplete. */
  onChange: (evidence: Evidence | null) => void;
}

export function EvidenceForm({ onChange }: EvidenceFormProps) {
  const [type, setType] = useState<EvidenceType>('course_completion');
  const [data, setData] = useState<Record<string, string>>({});
  const [pairs, setPairs] = useState<GenericPair[]>([{ key: '', value: '' }]);

  const evidence = useMemo(() => buildEvidence(type, data, pairs), [type, data, pairs]);

  // Keep the parent in sync without re-creating the callback dependency.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  useEffect(() => {
    onChangeRef.current(evidence);
  }, [evidence]);

  const changeType = (next: EvidenceType) => {
    setType(next);
    setData({});
    setPairs([{ key: '', value: '' }]);
  };

  const setField = (key: string, value: string) => setData((d) => ({ ...d, [key]: value }));

  return (
    <div className="flex-col gap-4">
      <Select
        label="Tipo de evidencia"
        options={EVIDENCE_TYPES}
        value={type}
        onChange={(e) => changeType(e.target.value as EvidenceType)}
      />

      {type !== 'generic' ? (
        <div className="flex-col gap-3">
          {FIELDS[type].map((f) => (
            <Input
              key={f.key}
              label={f.label}
              required={f.required}
              type={f.type}
              inputMode={f.type === 'number' ? 'numeric' : undefined}
              placeholder={f.placeholder}
              value={data[f.key] ?? ''}
              onChange={(e) => setField(f.key, e.target.value)}
              autoComplete="off"
            />
          ))}
        </div>
      ) : (
        <div className="flex-col gap-2">
          <span className="field__label" style={{ fontSize: '0.85rem' }}>
            Pares clave / valor
          </span>
          {pairs.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                className="input input--mono"
                style={{ fontSize: '0.84rem' }}
                placeholder="clave"
                value={p.key}
                onChange={(e) =>
                  setPairs((prev) => prev.map((x, j) => (j === i ? { ...x, key: e.target.value } : x)))
                }
                aria-label={`Clave ${i + 1}`}
              />
              <input
                className="input"
                style={{ fontSize: '0.84rem' }}
                placeholder="valor"
                value={p.value}
                onChange={(e) =>
                  setPairs((prev) => prev.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))
                }
                aria-label={`Valor ${i + 1}`}
              />
              <button
                type="button"
                className="btn btn--ghost btn--icon"
                onClick={() => setPairs((prev) => (prev.length > 1 ? prev.filter((_, j) => j !== i) : prev))}
                aria-label="Quitar par"
                disabled={pairs.length === 1}
              >
                <X size={15} />
              </button>
            </div>
          ))}
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            style={{ width: 'fit-content' }}
            onClick={() => setPairs((prev) => [...prev, { key: '', value: '' }])}
          >
            <Plus size={14} /> Añadir campo
          </button>
        </div>
      )}
    </div>
  );
}
