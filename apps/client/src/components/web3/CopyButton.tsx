import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyButtonProps {
  value: string;
  label?: string;
}

/** Small inline copy-to-clipboard control with success feedback. */
export function CopyButton({ value, label = 'Copiar' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard unavailable — silently ignore */
    }
  };

  return (
    <button
      type="button"
      className="copy-btn"
      onClick={copy}
      aria-label={copied ? 'Copiado' : label}
      title={copied ? 'Copiado' : label}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
}
