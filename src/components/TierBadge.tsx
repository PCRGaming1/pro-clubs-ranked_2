import { tierInfoForXp } from "@/lib/xp";

export default function TierBadge({ xp }: { xp: number }) {
  const info = tierInfoForXp(xp);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-[family-name:var(--font-mono)] font-bold uppercase tracking-wide ${info.colorClass} ${info.bgClass}`}
    >
      {info.tier}
    </span>
  );
}
