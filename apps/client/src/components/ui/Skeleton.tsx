import type { CSSProperties } from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  radius?: string | number;
  style?: CSSProperties;
  className?: string;
}

export function Skeleton({ width = '100%', height = 16, radius, style, className = '' }: SkeletonProps) {
  return (
    <span
      className={`skeleton ${className}`}
      style={{
        width,
        height,
        borderRadius: radius,
        ...style,
      }}
      aria-hidden
    />
  );
}

/** A card-shaped skeleton used in grid loading states. */
export function SkeletonCard() {
  return (
    <div className="card card--pad flex-col gap-3">
      <Skeleton width={44} height={44} radius="var(--r-md)" />
      <Skeleton width="70%" height={20} />
      <Skeleton width="100%" height={14} />
      <Skeleton width="45%" height={14} />
    </div>
  );
}
