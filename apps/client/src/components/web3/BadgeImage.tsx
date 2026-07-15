import { useState } from 'react';
import { BadgeCheck } from 'lucide-react';
import { useResolvedBadgeImage } from '../../hooks/useIpfsMetadata';

interface BadgeImageProps {
  uri?: string | null;
  size?: number | string;
  radius?: string;
}

/**
 * Renders a badge image. `uri` may be a direct image (ipfs:// or http) or an
 * ERC-721 metadata JSON whose `image` field points to the real image; both are
 * resolved via useResolvedBadgeImage. Falls back to a gradient mark.
 */
export function BadgeImage({ uri, size = 56, radius = 'var(--r-md)' }: BadgeImageProps) {
  const { data: src, isLoading } = useResolvedBadgeImage(uri);
  const [failed, setFailed] = useState(false);

  const box = {
    width: size,
    height: size,
    borderRadius: radius,
    flexShrink: 0,
  } as const;

  if (uri && isLoading) {
    return <span className="skeleton" style={box} aria-hidden />;
  }

  if (!src || failed) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ ...box, background: 'var(--brand-gradient)', color: '#fff' }}
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
