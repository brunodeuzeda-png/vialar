interface LogoProps {
  size?: number;
  showText?: boolean;
}

export default function Logo({ size = 32, showText = true }: LogoProps) {
  const fontSize = size >= 30 ? 18 : 14;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        {/* Rounded square base — lime accent */}
        <rect width="32" height="32" rx="8" fill="#BBFF00" />

        {/* V mark — clean geometric, two diagonals converging at bottom node */}
        <path
          d="M7 8.5 L16 22.5 L25 8.5"
          stroke="#0A0A0A"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Bottom convergence node — the "routing point" */}
        <circle cx="16" cy="22.5" r="2.2" fill="#0A0A0A" />

        {/* Top-left and top-right accent dots — signal / input points */}
        <circle cx="7" cy="8.5" r="1.4" fill="#0A0A0A" />
        <circle cx="25" cy="8.5" r="1.4" fill="#0A0A0A" />
      </svg>

      {showText && (
        <span style={{
          fontWeight: 900,
          fontSize,
          letterSpacing: '-0.05em',
          color: 'var(--text)',
          lineHeight: 1,
          fontFamily: 'inherit',
        }}>
          Vialar
        </span>
      )}
    </div>
  );
}
