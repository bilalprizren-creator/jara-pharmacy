/** Shared shell/height classes so the skeleton and the real map render pixel-identical. */
// `isolate z-0` traps Leaflet's internal z-indexes (panes 400-700, controls 1000)
// inside this shell's own stacking context so the map can never paint over the
// fixed z-50 navbar while scrolling.
export const MAP_PANEL_SHELL =
  "isolate relative z-0 overflow-hidden rounded-3xl border border-line bg-white shadow-card";
export const MAP_PANEL_HEIGHT = "h-[320px] sm:h-[380px] lg:h-[460px] xl:h-[500px]";
