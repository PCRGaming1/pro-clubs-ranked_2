// XP / ranking logic for Pro Clubs Ranked.
//
// Simple, fixed-award system for the MVP: no scoreline weighting, no
// opponent-strength adjustment. Good enough to seed a ladder; revisit
// once there's real match data to tune against.

export const XP_WIN = 50;
export const XP_LOSS = 15;

export type Tier = "Bronze" | "Silver" | "Gold" | "Elite";

export interface TierInfo {
  tier: Tier;
  min: number;
  max: number | null; // null = no upper bound
  /** Tailwind text color classes for badges/labels. */
  colorClass: string;
  /** Tailwind background color classes for badges. */
  bgClass: string;
}

export const TIERS: TierInfo[] = [
  {
    tier: "Bronze",
    min: 0,
    max: 999,
    colorClass: "text-amber-700 dark:text-amber-500",
    bgClass: "bg-amber-700/10 dark:bg-amber-500/10",
  },
  {
    tier: "Silver",
    min: 1000,
    max: 2999,
    colorClass: "text-slate-500 dark:text-slate-300",
    bgClass: "bg-slate-500/10 dark:bg-slate-300/10",
  },
  {
    tier: "Gold",
    min: 3000,
    max: 6999,
    colorClass: "text-[#c9971f]",
    bgClass: "bg-[#c9971f]/10",
  },
  {
    tier: "Elite",
    min: 7000,
    max: null,
    colorClass: "text-[#ff5a1f]",
    bgClass: "bg-[#ff5a1f]/10",
  },
];

/** Returns the tier name for a given XP total. */
export function tierForXp(xp: number): Tier {
  return tierInfoForXp(xp).tier;
}

/** Returns the full tier info (name, range, color classes) for a given XP total. */
export function tierInfoForXp(xp: number): TierInfo {
  const found = TIERS.find((t) => xp >= t.min && (t.max === null || xp <= t.max));
  return found ?? TIERS[0];
}

/** XP awarded to the winning and losing squad after a confirmed match. */
export function xpForResult(): { winnerXp: number; loserXp: number } {
  return { winnerXp: XP_WIN, loserXp: XP_LOSS };
}
