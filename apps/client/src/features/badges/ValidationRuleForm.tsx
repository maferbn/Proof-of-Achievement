import { useEffect, useMemo, useState } from 'react';
import { Select, Input } from '../../components/ui';
import type { SelectOption } from '../../components/ui';
import type {
  CreateValidationRuleInput,
  EvidenceType,
  ValidationRuleConfig,
} from '../../types/api';

const EVIDENCE_TYPE_OPTIONS: SelectOption[] = [
  { value: 'course_completion', label: 'Curso completado' },
  { value: 'exam_pass', label: 'Examen aprobado' },
  { value: 'game_win', label: 'Victoria en videojuego' },
  { value: 'contribution', label: 'Contribución' },
  { value: 'generic', label: 'Evidencia genérica' },
];

interface ValidationRuleFormProps {
  onChange: (value: CreateValidationRuleInput | null) => void;
  disabled?: boolean;
}

function buildRule(
  type: EvidenceType,
  fields: Record<string, string>
): ValidationRuleConfig | null {
  switch (type) {
    case 'course_completion': {
      if (!fields.courseId) return null;
      return {
        requirePastDate: true,
      };
    }
    case 'exam_pass': {
      const min = Number(fields.minPassingScore);
      if (Number.isNaN(min) || !fields.examId) return null;
      return { minPassingScore: min };
    }
    case 'game_win': {
      const min = fields.minScore ? Number(fields.minScore) : undefined;
      if (Number.isNaN(min)) return null;
      if (!fields.gameId) return null;
      return {
        requireMatchId: true,
        ...(min !== undefined && { minScore: min }),
      };
    }
    case 'contribution': {
      if (!fields.contributionType) return null;
      return {
        requiredFields: ['contributionType', 'contributionId'],
      };
    }
    case 'generic': {
      return { requireData: true };
    }
    default:
      return null;
  }
}

export function ValidationRuleForm({ onChange, disabled }: ValidationRuleFormProps) {
  const [type, setType] = useState<EvidenceType>('exam_pass');
  const [fields, setFields] = useState<Record<string, string>>({
    examId: '',
    minPassingScore: '70',
  });

  const rule = useMemo(() => buildRule(type, fields), [type, fields]);

  useEffect(() => {
    if (rule) {
      onChange({ evidenceType: type, rules: rule });
    } else {
      onChange(null);
    }
  }, [rule, type, onChange]);

  const changeType = (next: EvidenceType) => {
    setType(next);
    switch (next) {
      case 'course_completion':
        setFields({ courseId: '' });
        break;
      case 'exam_pass':
        setFields({ examId: '', minPassingScore: '70' });
        break;
      case 'game_win':
        setFields({ gameId: '', minScore: '' });
        break;
      case 'contribution':
        setFields({ contributionType: '' });
        break;
      case 'generic':
        setFields({});
        break;
    }
  };

  const setField = (key: string, val: string) =>
    setFields((prev) => ({ ...prev, [key]: val }));

  return (
    <div className="flex-col gap-4">
      <Select
        label="Tipo de evidencia requerida"
        required
        options={EVIDENCE_TYPE_OPTIONS}
        value={type}
        onChange={(e) => changeType(e.target.value as EvidenceType)}
        disabled={disabled}
      />

      {type === 'course_completion' && (
        <Input
          label="ID del curso (campo requerido en la evidencia)"
          required
          value={fields.courseId ?? ''}
          onChange={(e) => setField('courseId', e.target.value)}
          placeholder="p. ej. web3-101"
          disabled={disabled}
        />
      )}

      {type === 'exam_pass' && (
        <div className="flex-col gap-3">
          <Input
            label="ID del examen (campo requerido en la evidencia)"
            required
            value={fields.examId ?? ''}
            onChange={(e) => setField('examId', e.target.value)}
            placeholder="p. ej. final-exam"
            disabled={disabled}
          />
          <Input
            label="Nota mínima para aprobar"
            required
            type="number"
            inputMode="numeric"
            value={fields.minPassingScore ?? ''}
            onChange={(e) => setField('minPassingScore', e.target.value)}
            disabled={disabled}
          />
        </div>
      )}

      {type === 'game_win' && (
        <div className="flex-col gap-3">
          <Input
            label="ID del juego (campo requerido en la evidencia)"
            required
            value={fields.gameId ?? ''}
            onChange={(e) => setField('gameId', e.target.value)}
            placeholder="p. ej. game-001"
            disabled={disabled}
          />
          <Input
            label="Puntuación mínima para ganar"
            type="number"
            inputMode="numeric"
            value={fields.minScore ?? ''}
            onChange={(e) => setField('minScore', e.target.value)}
            placeholder="Opcional"
            disabled={disabled}
          />
        </div>
      )}

      {type === 'contribution' && (
        <Input
          label="Tipo de contribución (campo requerido en la evidencia)"
          required
          value={fields.contributionType ?? ''}
          onChange={(e) => setField('contributionType', e.target.value)}
          placeholder="p. ej. pull_request"
          disabled={disabled}
        />
      )}

      {type === 'generic' && (
        <p className="text-sm text-muted">
          Se requerirá al menos un par clave/valor arbitrario como evidencia.
        </p>
      )}
    </div>
  );
}
