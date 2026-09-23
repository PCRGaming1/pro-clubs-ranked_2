/**
 * The PCR crest + wordmark, in one place so the navbar, footer, and hero all
 * stay in sync. "CR" crest (Clubs Ranked) — see the brand concept board for
 * the full rationale on colors/typography.
 */
export function Crest({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={(size * 150) / 140}
      viewBox="0 0 140 150"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M70 4 L130 22 V78 C130 114 104 138 70 146 C36 138 10 114 10 78 V22 Z"
        fill="#0a0f14"
        stroke="#2f8fe0"
        strokeWidth={6}
      />
      <text
        x="70"
        y="92"
        textAnchor="middle"
        fontFamily="var(--font-display), Impact, sans-serif"
        fontSize="62"
        fill="#eef7f0"
      >
        CR
      </text>
    </svg>
  );
}

export default function Logo({
  size = 28,
  showWordmark = true,
  wordmarkClassName = "",
}: {
  size?: number;
  showWordmark?: boolean;
  wordmarkClassName?: string;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <Crest size={size} />
      {showWordmark && (
        <span className={`font-display leading-none ${wordmarkClassName}`}>
          Clubs Ranked
        </span>
      )}
    </span>
  );
}
