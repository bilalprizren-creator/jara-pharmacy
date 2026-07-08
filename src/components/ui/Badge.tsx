import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "lime" | "forest" | "rose" | "cream" | "glass";

const tones: Record<Tone, string> = {
  lime: "bg-lime text-deep",
  forest: "bg-forest/10 text-forest",
  rose: "bg-rose-blush text-rose",
  cream: "bg-surface-cream text-forest",
  glass: "bg-white/15 text-white backdrop-blur ring-1 ring-white/20",
};

/** Small pill label used for product badges + eyebrow chips. */
export function Badge({
  children,
  tone = "lime",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
