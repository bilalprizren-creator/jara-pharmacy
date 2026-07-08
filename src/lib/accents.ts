import type { CategoryAccent } from "@/types";

/** Icon-chip color classes for category / blog accents. */
export const accentChip: Record<CategoryAccent, string> = {
  green: "bg-forest/5 text-forest group-hover:bg-forest group-hover:text-white",
  rose: "bg-rose-blush/60 text-rose group-hover:bg-rose group-hover:text-white",
  lime: "bg-lime-soft/60 text-emerald2 group-hover:bg-lime group-hover:text-deep",
  cream: "bg-surface-cream text-forest group-hover:bg-forest group-hover:text-white",
  teal: "bg-emerald2/10 text-emerald2 group-hover:bg-emerald2 group-hover:text-white",
};

/** Soft top-border accent used on card headers. */
export const accentBar: Record<CategoryAccent, string> = {
  green: "bg-forest",
  rose: "bg-rose",
  lime: "bg-lime",
  cream: "bg-surface-cream",
  teal: "bg-emerald2",
};
