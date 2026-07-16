import { useEffect, useMemo, useRef, useState } from 'react';
import type { Evidence, FieldDefinition, ValidationRule } from '../../types/api';
import { Input } from '../../components/ui';

interface EvidenceFormProps {
  /** Validation rule that defines the dynamic evidence schema. */
  rule?: ValidationRule;
  /** Emits the current evidence, or null when incomplete. */
  onChange: (evidence: Evidence | null) => void;
}

/**
 * Parses a raw string value into the runtime type expected by the backend.
 */
function parseValue(raw: string, type: string): unknown {
  switch (type) {
    case 'number': {
      const num = raw === '' ? NaN : Number(raw);
      return Number.isNaN(num) ? undefined : num;
    }
    case 'boolean':
      return raw === 'true' ? true : raw === 'false' ? false : undefined;
    case 'date':
      return raw || undefined;
    case 'text':
    case 'file':
    default:
      return raw || undefined;
  }
}

/**
 * Returns true if the value satisfies the field's client-side constraints.
 */
function satisfiesConstraints(value: unknown, field: FieldDefinition): boolean {
  if (!field.constraints) return true;
  const c = field.constraints;

  if (field.type === 'number' && typeof value === 'number') {
    if (c.min !== undefined && value < c.min) return false;
    if (c.max !== undefined && value > c.max) return false;
  }

  if (field.type === 'date' && typeof value === 'string') {
    const date = new Date(value);
    const now = new Date();
    if (c.past && date.getTime() >= now.getTime()) return false;
    if (c.future && date.getTime() <= now.getTime()) return false;
  }

  if (field.type === 'text' && typeof value === 'string' && c.pattern) {
    try {
      return new RegExp(c.pattern).test(value);
    } catch {
      return true;
    }
  }

  return true;
}

/**
 * Builds an Evidence payload from raw form values, or null when incomplete.
 */
function buildEvidence(
  evidenceType: string,
  fields: FieldDefinition[],
  rawValues: Record<string, string>
): Evidence | null {
  const data: Record<string, unknown> = {};

  for (const field of fields) {
    const raw = rawValues[field.name] ?? '';
    const value = parseValue(raw, field.type);
    const isPresent = value !== undefined && value !== null && value !== '';

    if (field.required && !isPresent) {
      return null;
    }

    if (!isPresent) {
      continue;
    }

    if (!satisfiesConstraints(value, field)) {
      return null;
    }

    data[field.name] = value;
  }

  // At least one value must be present for the evidence to be meaningful
  if (Object.keys(data).length === 0) {
    return null;
  }

  return { type: evidenceType, data };
}

export function EvidenceForm({ rule, onChange }: EvidenceFormProps) {
  const [values, setValues] = useState<Record<string, string>>({});

  // Reset form when the rule changes.
  useEffect(() => {
    setValues({});
  }, [rule?.id]);

  const evidence = useMemo(
    () => (rule ? buildEvidence(rule.evidenceType, rule.rules?.fields ?? [], values) : null),
    [rule, values]
  );

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  useEffect(() => {
    onChangeRef.current(evidence);
  }, [evidence]);

  const setValue = (name: string, value: string) =>
    setValues((prev) => ({ ...prev, [name]: value }));

  if (!rule) {
    return (
      <p className="text-sm text-muted">
        Este logro no tiene una regla de validación configurada.
      </p>
    );
  }

  return (
    <div className="flex-col gap-4">
      <div className="text-sm text-muted">
        Tipo de evidencia: <span className="text-strong">{rule.evidenceType}</span>
      </div>

      {(rule.rules?.fields ?? []).map((field) => (
        <FieldInput
          key={field.name}
          field={field}
          value={values[field.name] ?? ''}
          onChange={(value) => setValue(field.name, value)}
        />
      ))}
    </div>
  );
}

interface FieldInputProps {
  field: FieldDefinition;
  value: string;
  onChange: (value: string) => void;
}

function FieldInput({ field, value, onChange }: FieldInputProps) {
  const label = `${field.label}${field.required ? ' *' : ''}`;

  switch (field.type) {
    case 'number':
      return (
        <Input
          label={label}
          required={field.required}
          type="number"
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={constraintHint(field)}
        />
      );

    case 'date':
      return (
        <Input
          label={label}
          required={field.required}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={constraintHint(field)}
        />
      );

    case 'boolean':
      return (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={value === 'true'}
            onChange={(e) => onChange(e.target.checked ? 'true' : 'false')}
          />
          {label}
        </label>
      );

    case 'file':
      return (
        <Input
          label={label}
          required={field.required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="ipfs://... o https://..."
        />
      );

    case 'text':
    default:
      return (
        <Input
          label={label}
          required={field.required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={constraintHint(field)}
        />
      );
  }
}

function constraintHint(field: FieldDefinition): string | undefined {
  const c = field.constraints;
  if (!c) return undefined;

  if (field.type === 'number') {
    if (c.min !== undefined && c.max !== undefined) return `Entre ${c.min} y ${c.max}`;
    if (c.min !== undefined) return `Mínimo ${c.min}`;
    if (c.max !== undefined) return `Máximo ${c.max}`;
  }

  if (field.type === 'date') {
    if (c.past) return 'Debe ser una fecha pasada';
    if (c.future) return 'Debe ser una fecha futura';
  }

  if (field.type === 'text' && c.pattern) {
    return `Debe coincidir con: ${c.pattern}`;
  }

  return undefined;
}
