import { useCallback, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { ToastContext } from './toast-context';
import type { ToastApi } from './toast-context';

type ToastVariant = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  variant: ToastVariant;
  title: string;
  message?: string;
  closing?: boolean;
}

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
} as const;

const DURATION = 4800;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const remove = useCallback((id: number) => {
    // trigger closing animation, then unmount
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, closing: true } : t)));
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 180);
  }, []);

  const push = useCallback(
    (variant: ToastVariant, title: string, message?: string) => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, variant, title, message }]);
      window.setTimeout(() => remove(id), DURATION);
    },
    [remove],
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (title, message) => push('success', title, message),
      error: (title, message) => push('error', title, message),
      info: (title, message) => push('info', title, message),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-viewport" role="region" aria-live="polite" aria-label="Notificaciones">
        {toasts.map((t) => {
          const Icon = ICONS[t.variant];
          return (
            <div
              key={t.id}
              className={`toast toast--${t.variant}${t.closing ? ' toast--closing' : ''}`}
              role={t.variant === 'error' ? 'alert' : 'status'}
            >
              <Icon size={18} className="toast__icon" aria-hidden />
              <div style={{ flex: 1 }}>
                <div className="toast__title">{t.title}</div>
                {t.message && <div className="toast__msg">{t.message}</div>}
              </div>
              <button
                type="button"
                className="copy-btn"
                onClick={() => remove(t.id)}
                aria-label="Cerrar notificación"
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
