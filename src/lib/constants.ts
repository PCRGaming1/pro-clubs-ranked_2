import type { QueueSize } from "@/lib/database.types";

// Same ten club sizes used on the waitlist landing page.
export const QUEUE_SIZES: QueueSize[] = [
  "2v2",
  "3v3",
  "4v4",
  "5v5",
  "6v6",
  "7v7",
  "8v8",
  "9v9",
  "10v10",
  "11v11",
];

export const PLATFORMS: { value: string; label: string }[] = [
  { value: "ps", label: "PlayStation" },
  { value: "xbox", label: "Xbox" },
  { value: "pc", label: "PC" },
];

export const REGIONS: string[] = [
  "NA East",
  "NA West",
  "UK",
  "EU West",
  "EU East",
  "Oceania",
  "Other",
];
