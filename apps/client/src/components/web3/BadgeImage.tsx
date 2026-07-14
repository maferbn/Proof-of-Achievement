import { useState } from 'react';
import { BadgeCheck } from 'lucide-react';

function resolveUri(uri: string): string | null {
  const v = uri.trim();
  if (!v) return null;
  if (v.startsWith('ipfs://')) return `https://ipfs.io/ipfs/${v.slice('ipfs://'.length)}`;
  if (v.startsWith('http://') || v.startsWith('https://')) return v;
  return null; // unknown scheme (e.g. metadata JSON) → show placeholder
}

interface BadgeImageProps {
  uri?: string | null;
  size?: number | string;
  radius?: string;
}

/** Renders a badge image, resolving ipfs:// and falling back to a gradient mark. */
export function BadgeImage({ uri, size = 56, radius = 'var(--r-md)' }: BadgeImageProps) {
  const [failed, setFailed] = useState(false);
  const src = uri ? resolveUri(uri) : null;

  const box = {
    width: size,
    height: size,
    borderRadius: radius,
    flexShrink: 0,
  } as const;

  if (!src || failed) {
    return (
      <div
        className="flex items-center justify-center"
        style={{
          ...box,
          background: 'var(--brand-gradient)',
          color: '#fff',
        }}
        aria-hidden
      >
        <BadgeCheck size={typeof size === 'number' ? size * 0.5 : 28} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      style={{
        ...box,
        objectFit: 'cover',
        border: '1px solid var(--glass-border)',
        background: 'var(--bg-inset)',
      }}
    />
  );
}
