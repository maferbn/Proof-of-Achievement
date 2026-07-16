import { useEffect, useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Input, Select, Button } from '../../components/ui';
import type { SelectOption } from '../../components/ui';
import type {
  CreateValidationRuleInput,
  FieldDefinition,
  FieldType,
} from '../../types/api';

const FIELD_TYPE_OPTIONS: SelectOption[] = [
  { value: 'text', label: 'Texto' },
  { value: 'number', label: 'Número' },
  { value: 'date', label: 'Fecha' },
  { value: 'boolean', label: 'Sí / No' },
  { value: 'file', label: 'Archivo / IPFS' },
];

interface ValidationRuleFormProps {
  onChange: (value: CreateValidationRuleInput | null) => void;
  disabled?: boolean;
}

function makeField(index: number): FieldDefinition {
  return {
    name: `campo${index}`,
    label: `Campo ${index}`,
    type: 'text',
    required: true,
  };
}

function isValidIdentifier(name: string): boolean {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
}

export function ValidationRuleForm({ onChange, disabled }: ValidationRuleFormProps) {
  const [evidenceType, setEvidenceType] = useState('');
  const [fields, setFields] = useState<FieldDefinition[]>([makeField(1)]);

  const isValid = useMemo(() => {
    if (!evidenceType.trim()) return false;
    if (fields.length === 0) return false;

    const names = new Set<string>();
    for (const f of fields) {
      if (!f.name.trim() || !f.label.trim()) return false;
      if (!isValidIdentifier(f.name)) return false;
      if (names.has(f.name)) return false;
      names.add(f.name);
    }

    return true;
  }, [evidenceType, fields]);

  const rule = useMemo<CreateValidationRuleInput | null>(() => {
    if (!isValid) return null;
    return {
      evidenceType: evidenceType.trim(),
      rules: { fields: fields.map((f) => ({ ...f, name: f.name.trim(), label: f.label.trim() })) },
    };
  }, [evidenceType, fields, isValid]);

  useEffect(() => {
    onChange(rule);
  }, [rule, onChange]);

  const updateField = (index: number, patch: Partial<FieldDefinition>) => {
    setFields((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  };

  const updateConstraint = (index: number, patch: Record<string, unknown>) => {
    setFields((prev) =>
      prev.map((f, i) =>
        i === index
          ? {
              ...f,
              constraints: { ...(f.constraints || {}), ...patch },
            }
          : f
      )
    );
  };

  const addField = () => {
    setFields((prev) => [...prev, makeField(prev.length + 1)]);
  };

  const removeField = (index: number) => {
    setFields((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="flex-col gap-4">
      <Input
        label="Nombre del tipo de evidencia"
        required
        placeholder="p. ej. Certificado de curso, Partida ganada, Asistencia a evento"
        value={evidenceType}
        onChange={(e) => setEvidenceType(e.target.value)}
        disabled={disabled}
      />

      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-strong">Campos de la evidencia</span>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={addField}
          disabled={disabled}
          leftIcon={<Plus size={14} />}
        >
          Agregar campo
        </Button>
      </div>

      {fields.map((field, index) => (
        <div
          key={index}
          style={{
            padding: 'var(--sp-3)',
            borderRadius: 'var(--r-md)',
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
          }}
          className="flex-col gap-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted" style={{ textTransform: 'uppercase' }}>
              Campo {index + 1}
            </span>
            <button
              type="button"
              className="btn btn--ghost btn--icon"
              onClick={() => removeField(index)}
              disabled={disabled || fields.length === 1}
              aria-label="Eliminar campo"
            >
              <X size={14} />
            </button>
          </div>

          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)' }}>
            <Input
              label="Nombre interno"
              required
              value={field.name}
              onChange={(e) => updateField(index, { name: e.target.value })}
              placeholder="p. ej. courseId"
              disabled={disabled}
              hint="Sin espacios ni caracteres especiales"
            />
            <Input
              label="Etiqueta visible"
              required
              value={field.label}
              onChange={(e) => updateField(index, { label: e.target.value })}
              placeholder="p. ej. ID del curso"
              disabled={disabled}
            />
          </div>

          <div className="grid" style={{ gridTemplateColumns: '1fr auto', gap: 'var(--sp-3)', alignItems: 'end' }}>
            <Select
              label="Tipo de dato"
              required
              options={FIELD_TYPE_OPTIONS}
              value={field.type}
              onChange={(e) => updateField(index, { type: e.target.value as FieldType })}
              disabled={disabled}
            />
            <label className="flex items-center gap-2 text-sm" style={{ paddingBottom: '0.5rem' }}>
              <input
                type="checkbox"
                checked={field.required}
                onChange={(e) => updateField(index, { required: e.target.checked })}
                disabled={disabled}
              />
              Requerido
            </label>
          </div>

          <FieldConstraints
            field={field}
            index={index}
            onChange={updateConstraint}
            disabled={disabled}
          />
        </div>
      ))}

      {!isValid && (
        <p className="text-xs text-muted">
          Completa el nombre del tipo de evidencia y todos los campos (nombre interno, etiqueta y tipo).
        </p>
      )}
    </div>
  );
}

interface FieldConstraintsProps {
  field: FieldDefinition;
  index: number;
  onChange: (index: number, patch: Record<string, unknown>) => void;
  disabled?: boolean;
}

function FieldConstraints({ field, index, onChange, disabled }: FieldConstraintsProps) {
  const c = field.constraints || {};

  switch (field.type) {
    case 'number':
      return (
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)' }}>
          <Input
            label="Mínimo"
            type="number"
            inputMode="numeric"
            value={c.min ?? ''}
            onChange={(e) => onChange(index, { min: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="Opcional"
            disabled={disabled}
          />
          <Input
            label="Máximo"
            type="number"
            inputMode="numeric"
            value={c.max ?? ''}
            onChange={(e) => onChange(index, { max: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="Opcional"
            disabled={disabled}
          />
        </div>
      );

    case 'date':
      return (
        <div className="flex items-center gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!c.past}
              onChange={(e) => onChange(index, { past: e.target.checked, future: false })}
              disabled={disabled}
            />
            Debe ser pasada
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!c.future}
              onChange={(e) => onChange(index, { future: e.target.checked, past: false })}
              disabled={disabled}
            />
            Debe ser futura
          </label>
        </div>
      );

    case 'text':
      return (
        <Input
          label="Patrón regex (opcional)"
          value={c.pattern ?? ''}
          onChange={(e) => onChange(index, { pattern: e.target.value || undefined })}
          placeholder="p. ej. ^[A-Z0-9]+$"
          disabled={disabled}
          hint="Si lo completas, el valor debe coincidir con la expresión regular"
        />
      );

    default:
      return null;
  }
}
