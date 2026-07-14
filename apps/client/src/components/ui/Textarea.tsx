import { useId } from 'react';
import type { TextareaHTMLAttributes, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode;
  hint?: string;
  error?: string;
  required?: boolean;
}

export function Textarea({
  label,
  hint,
  error,
  required,
  id,
  className = '',
  ...rest
}: TextareaProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const describedBy = error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined;

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
      <textarea
        id={fieldId}
        className={['textarea', error ? 'textarea--error' : '', className]
          .filter(Boolean)
          .join(' ')}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        aria-required={required || undefined}
        {...rest}
      />
      {error ? (
        <span className="field__error" id={`${fieldId}-error`}>
          <AlertCircle size={13} aria-hidden />
          {error}
        </span>
      ) : (
        hint && (
          <span className="field__hint" id={`${fieldId}-hint`}>
            {hint}
          </span>
        )
      )}
    </div>
  );
}
