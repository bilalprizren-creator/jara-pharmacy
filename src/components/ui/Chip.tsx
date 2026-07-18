import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Toggleable filter chip with a clear active state. */
export function Chip({
  children,
  active,
  onClick,
  icon,
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  icon?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-300",
        active
          ? "border-forest bg-forest text-white shadow-soft"
          : "border-line bg-white text-ink-muted hover:border-forest/40 hover:text-forest",
      )}
    >
      {icon}
      {children}
    </button>
  );
}
