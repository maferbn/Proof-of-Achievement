import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Input } from '../../components/ui';
import type { Evidence, EvidenceType, ValidationRule, ValidationRuleConfig } from '../../types/api';

interface FieldSpec {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date';
  required?: boolean;
  placeholder?: string;
}

const BASE_FIELDS: Record<Exclude<EvidenceType, 'generic'>, FieldSpec[]> = {
  course_completion: [
    { key: 'courseId', label: 'ID del curso', type: 'text', required: true },
    { key: 'completionDate', label: 'Fecha de finalización', type: 'date', required: true },
  ],
  exam_pass: [
    { key: 'examId', label: 'ID del examen', type: 'text', required: true },
    { key: 'score', label: 'Calificación', type: 'number', required: true },
  ],
  game_win: [
    { key: 'gameId', label: 'ID del juego', type: 'text', required: true },
    { key: 'matchId', label: 'ID de partida', type: 'text', required: true },
    { key: 'score', label: 'Puntuación', type: 'number' },
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

function getFields(type: EvidenceType, rules: ValidationRuleConfig | undefined): FieldSpec[] {
  const base = BASE_FIELDS[type as Exclude<EvidenceType, 'generic'>] ?? [];
  if (type !== 'exam_pass' && type !== 'game_win') return base;

  return base.map((f) => {
    if (type === 'exam_pass' && f.key === 'score' && rules?.minPassingScore !== undefined) {
      return {
        ...f,
        placeholder: `Mínimo ${rules.minPassingScore}`,
        label: `${f.label} (mínimo ${rules.minPassingScore})`,
      };
    }
    if (type === 'game_win' && f.key === 'score' && rules?.minScore !== undefined) {
      return {
        ...f,
        placeholder: `Mínimo ${rules.minScore}`,
        label: `${f.label} (mínimo ${rules.minScore})`,
      };
    }
    return f;
  });
}

/** Builds the Evidence payload, or null when required fields are missing. */
function buildEvidence(
  type: EvidenceType,
  data: Record<string, string>,
  pairs: GenericPair[],
  rules?: ValidationRuleConfig
): Evidence | null {
  if (type === 'generic') {
    const obj: Record<string, unknown> = {};
    for (const p of pairs) {
      const k = p.key.trim();
      if (k) obj[k] = p.value;
    }
    const requireData = rules?.requireData !== false;
    if (requireData && Object.keys(obj).length === 0) return null;
    return { type, data: obj };
  }

  const fields = BASE_FIELDS[type];
  const obj: Record<string, unknown> = {};
  for (const f of fields) {
    const raw = (data[f.key] ?? '').trim();
    if (!raw) {
      if (f.required) return null;
      continue;
    }
    obj[f.key] = NUMERIC_KEYS.has(f.key) ? Number(raw) : raw;
  }

  // Enforce dynamic thresholds in the payload so the backend can verify them
  // (the backend also validates against the stored rule).
  if (type === 'exam_pass' && rules?.minPassingScore !== undefined) {
    obj.minPassingScore = Number(rules.minPassingScore);
  }
  if (type === 'game_win' && rules?.minScore !== undefined) {
    obj.minScore = Number(rules.minScore);
  }

  return { type, data: obj };
}

interface EvidenceFormProps {
  /** Validation rule that fixes the evidence type and thresholds. */
  rule?: ValidationRule;
  /** Emits the current evidence, or null when incomplete. */
  onChange: (evidence: Evidence | null) => void;
}

export function EvidenceForm({ rule, onChange }: EvidenceFormProps) {
  const [type, setType] = useState<EvidenceType>(rule?.evidenceType ?? 'course_completion');
  const [data, setData] = useState<Record<string, string>>({});
  const [pairs, setPairs] = useState<GenericPair[]>([{ key: '', value: '' }]);

  // Keep the internal type in sync when the rule changes (e.g. badge selection).
  useEffect(() => {
    if (rule) {
      setType(rule.evidenceType);
      setData({});
      setPairs([{ key: '', value: '' }]);
    }
  }, [rule]);

  const evidence = useMemo(
    () => buildEvidence(type, data, pairs, rule?.rules),
    [type, data, pairs, rule?.rules]
  );

  // Keep the parent in sync without re-creating the callback dependency.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  useEffect(() => {
    onChangeRef.current(evidence);
  }, [evidence]);

  const setField = (key: string, value: string) => setData((d) => ({ ...d, [key]: value }));

  const fields = useMemo(() => getFields(type, rule?.rules), [type, rule?.rules]);

  return (
    <div className="flex-col gap-4">
      {rule ? (
        <div className="text-sm text-muted">
          Evidencia requerida: <span className="text-strong">{typeLabel(type)}</span>
        </div>
      ) : null}

      {type !== 'generic' ? (
        <div className="flex-col gap-3">
          {fields.map((f) => (
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

function typeLabel(type: EvidenceType): string {
  switch (type) {
    case 'course_completion':
      return 'Curso completado';
    case 'exam_pass':
      return 'Examen aprobado';
    case 'game_win':
      return 'Victoria en videojuego';
    case 'contribution':
      return 'Contribución';
    case 'generic':
      return 'Evidencia genérica';
  }
}
