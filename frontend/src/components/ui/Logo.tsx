interface LogoProps {
  size?: number;
  showText?: boolean;
  variant?: 'light' | 'dark';
}

export default function Logo({ size = 32, showText = true, variant = 'dark' }: LogoProps) {
  const textColor = variant === 'dark' ? '#F0F0F5' : '#0A0A0A';
  const scale = size / 32;
  const markW = 32;
  const gap = 10;
  const wordmarkX = markW + gap;
  const totalW = showText ? markW + gap + 72 : markW;
  const totalH = markW;

  return (
    <svg
      width={totalW * scale}
      height={totalH * scale}
      viewBox={`0 0 ${totalW} ${totalH}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
      aria-label="Vialar"
    >
      {/* ── Mark tile ── */}
      {/* Background */}
      <rect width="32" height="32" rx="7.5" fill="#BBFF00" />

      {/* V — two diagonal arms from top to bottom-center node */}
      <line x1="7"  y1="9"    x2="16" y2="23.5" stroke="#0D0D0D" strokeWidth="3.2" strokeLinecap="round" />
      <line x1="25" y1="9"    x2="16" y2="23.5" stroke="#0D0D0D" strokeWidth="3.2" strokeLinecap="round" />

      {/* Bottom convergence node — the "routing point" */}
      <circle cx="16" cy="23.5" r="2.4" fill="#0D0D0D" />

      {/* Top endpoint nodes */}
      <circle cx="7"  cy="9" r="1.6" fill="#0D0D0D" />
      <circle cx="25" cy="9" r="1.6" fill="#0D0D0D" />

      {/* ── Wordmark ── */}
      {showText && (
        <text
          x={wordmarkX}
          y="23"
          fontFamily="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
          fontWeight="800"
          fontSize="19"
          letterSpacing="-0.8"
          fill={textColor}
        >
          vialar
        </text>
      )}
    </svg>
  );
}
