import { MapPin } from "lucide-react";
import { cn } from "@/lib/cn";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { MAP_PANEL_SHELL, MAP_PANEL_HEIGHT } from "./mapPanel.constants";

export function LocationsMapSkeleton({ label }: { label: string }) {
  const reduced = useReducedMotion();
  return (
    <div className={cn(MAP_PANEL_SHELL, !reduced && "animate-pulse")}>
      <div className={cn(MAP_PANEL_HEIGHT, "flex items-center justify-center bg-surface-cream")}>
        <div className="flex flex-col items-center gap-2 text-ink-muted">
          <MapPin className="h-6 w-6" aria-hidden="true" />
          <span className="text-sm font-medium">{label}</span>
        </div>
      </div>

      {/*
        Stands in for the legend bar LocationsMap renders under the map: same
        padding, same border, and 1rem-tall bars matching the legend's text line
        box, so the panel is the same height before and after the map chunk
        arrives. Without it the panel grew the moment the chunk landed, which
        pushed every branch card down the page — briefly wrong for everyone, and
        actually wrong for a visitor deep-linked to one branch, whose card had
        already been scrolled into place by then.
      */}
      <div
        aria-hidden="true"
        className="flex flex-wrap items-center gap-4 border-t border-line bg-surface-soft px-4 py-2.5"
      >
        <span className="h-4 w-20 rounded bg-line" />
        <span className="h-4 w-36 rounded bg-line" />
      </div>
    </div>
  );
}
