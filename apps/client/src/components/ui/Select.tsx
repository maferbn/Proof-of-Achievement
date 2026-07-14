import { useId } from 'react';
import type { SelectHTMLAttributes, ReactNode } from 'react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: ReactNode;
  hint?: string;
  error?: string;
  required?: boolean;
  options: SelectOption[];
  placeholder?: string;
}

export function Select({
  label,
  hint,
  error,
  required,
  options,
  placeholder,
  id,
  className = '',
  ...rest
}: SelectProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;

  return (
    <div className="field">
      {label && (
        <label className="field__label" htmlFor={fieldId}>
          {label}
          {required && (
            <span className="field__req" aria-hidden>
              *
            </span>
          )}
        </label>
      )}
      <select
        id={fieldId}
        className={['select', className].filter(Boolean).join(' ')}
        aria-invalid={error ? true : undefined}
        aria-required={required || undefined}
        {...rest}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>
      {error ? (
        <span className="field__error">{error}</span>
      ) : (
        hint && <span className="field__hint">{hint}</span>
      )}
    </div>
  );
}
