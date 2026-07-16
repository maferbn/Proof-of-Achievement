interface LogoProps {
  size?: number;
  withWordmark?: boolean;
}

/** Brand mark: a gradient hexagon "shield" enclosing a verified check. */
export function Logo({ size = 32, withWordmark = true }: LogoProps) {
  return (
    <span className="flex items-center gap-2" style={{ display: 'inline-flex' }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <defs>
          <linearGradient id="poa-logo" x1="4" y1="2" x2="36" y2="38" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6366f1" />
            <stop offset="0.5" stopColor="#8b5cf6" />
            <stop offset="1" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <path
          d="M20 2.5 34.5 10v13.2c0 8.2-5.9 12.4-14.5 15.3C11.4 35.6 5.5 31.4 5.5 23.2V10L20 2.5Z"
          fill="url(#poa-logo)"
          fillOpacity="0.18"
          stroke="url(#poa-logo)"
          strokeWidth="1.6"
        />
        <path
          d="m14.2 20.2 4.2 4.2 8-8.4"
          stroke="url(#poa-logo)"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {withWordmark && (
        <span style={{ fontWeight: 700, fontSize: '1.02rem', color: 'var(--text-strong)', letterSpacing: '-0.01em' }}>
          Proof<span className="gradient-text">of</span>Achievement
        </span>
      )}
    </span>
  );
}
