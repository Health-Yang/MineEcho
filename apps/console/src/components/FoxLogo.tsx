export function FoxLogo({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" className={className}>
      <circle cx="60" cy="60" r="56" fill="#fff" stroke="#0066ff" strokeWidth="3"/>
      <path d="M30 42 L24 16 Q30 12 40 18 L44 36" fill="#f5a623" stroke="#e09000" strokeWidth="2.5" strokeLinejoin="round"/>
      <path d="M90 42 L96 16 Q90 12 80 18 L76 36" fill="#f5a623" stroke="#e09000" strokeWidth="2.5" strokeLinejoin="round"/>
      <path d="M32 38 L28 20 Q32 18 36 22 L38 34" fill="#e6f0ff"/>
      <path d="M88 38 L92 20 Q88 18 84 22 L82 34" fill="#e6f0ff"/>
      <ellipse cx="60" cy="58" rx="34" ry="30" fill="#f5a623" stroke="#e09000" strokeWidth="2.5"/>
      <ellipse cx="42" cy="64" rx="16" ry="13" fill="#fff5e0"/>
      <ellipse cx="78" cy="64" rx="16" ry="13" fill="#fff5e0"/>
      <ellipse cx="48" cy="54" rx="6" ry="7" fill="#5a3a1a"/>
      <ellipse cx="72" cy="54" rx="6" ry="7" fill="#5a3a1a"/>
      <circle cx="50" cy="52" r="2.5" fill="#fff"/>
      <circle cx="74" cy="52" r="2.5" fill="#fff"/>
      <ellipse cx="60" cy="64" rx="5" ry="3.5" fill="#2d2d3d"/>
      <path d="M60 67 Q56 72 52 70" fill="none" stroke="#2d2d3d" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M60 67 Q64 72 68 70" fill="none" stroke="#2d2d3d" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}
