import { MapPin } from "lucide-react";
import { cn } from "@/lib/cn";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { MAP_PANEL_SHELL, MAP_PANEL_HEIGHT } from "./mapPanel.constants";

export function LocationsMapSkeleton({ label }: { label: string }) {
  const reduced = useReducedMotion();
  return (
    <div
      className={cn(
        MAP_PANEL_SHELL,
        MAP_PANEL_HEIGHT,
        "flex items-center justify-center bg-surface-cream",
        !reduced && "animate-pulse",
      )}
    >
      <div className="flex flex-col items-center gap-2 text-ink-muted">
        <MapPin className="h-6 w-6" aria-hidden="true" />
        <span className="text-sm font-medium">{label}</span>
      </div>
    </div>
  );
}
