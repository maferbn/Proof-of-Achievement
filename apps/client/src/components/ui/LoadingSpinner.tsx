interface LoadingSpinnerProps {
  size?: number;
  label?: string;
  center?: boolean;
}

export function LoadingSpinner({ size = 22, label, center }: LoadingSpinnerProps) {
  const spinner = (
    <span className="flex items-center gap-2" role="status" aria-live="polite">
      <span
        className="spinner"
        style={{ width: size, height: size }}
        aria-hidden
      />
      {label ? <span className="text-muted text-sm">{label}</span> : <span className="sr-only">Cargando</span>}
    </span>
  );

  if (!center) return spinner;
  return (
    <div className="flex justify-center" style={{ padding: 'var(--sp-7) 0' }}>
      {spinner}
    </div>
  );
}
