import { useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  hint?: string;
  error?: string;
  required?: boolean;
  mono?: boolean;
}

export function Input({
  label,
  hint,
  error,
  required,
  mono,
  id,
  className = '',
  ...rest
}: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className="field">
      {label && (
        <label className="field__label" htmlFor={inputId}>
          {label}
          {required && (
            <span className="field__req" aria-hidden>
              *
            </span>
          )}
        </label>
      )}
      <input
        id={inputId}
        className={[
          'input',
          mono ? 'input--mono' : '',
          error ? 'input--error' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        aria-required={required || undefined}
        {...rest}
      />
      {error ? (
        <span className="field__error" id={`${inputId}-error`}>
          <AlertCircle size={13} aria-hidden />
          {error}
        </span>
      ) : (
        hint && (
          <span className="field__hint" id={`${inputId}-hint`}>
            {hint}
          </span>
        )
      )}
    </div>
  );
}
