interface LogoProps {
  size?: number;
  showText?: boolean;
}

export default function Logo({ size = 32, showText = true }: LogoProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {/* Mark */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background square */}
        <rect width="32" height="32" rx="9" fill="#BBFF00" />
        {/* Stylized V mark — two upward lines meeting at bottom */}
        <path
          d="M8 9L14 23L16 18.5L18 23L24 9"
          stroke="#0A0A0A"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Dot above the V peak */}
        <circle cx="16" cy="9" r="1.5" fill="#0A0A0A" />
      </svg>

      {showText && (
        <span style={{
          fontWeight: 900,
          fontSize: size > 28 ? 18 : 15,
          letterSpacing: '-0.04em',
          color: 'var(--text)',
          lineHeight: 1,
        }}>
          Vialar
        </span>
      )}
    </div>
  );
}
