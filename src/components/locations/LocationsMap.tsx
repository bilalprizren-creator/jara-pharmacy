import { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L, { type LatLngTuple } from "leaflet";
import "leaflet/dist/leaflet.css";
import "./leaflet-overrides.css";
import { Navigation } from "lucide-react";
import { useI18n } from "@/context/I18nContext";
import { locations } from "@/data/locations";
import type { Location } from "@/types";
import { mapsHref } from "@/lib/links";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { MAP_PANEL_SHELL, MAP_PANEL_HEIGHT } from "./mapPanel.constants";

type PinnedLocation = Location & { coords: { lat: number; lng: number } };

// A simple building/warehouse glyph (lucide-style: 2px stroke, round caps), inlined
// as a plain SVG string — divIcon markup must be plain HTML, not a JSX render, so it
// can't reuse the <Warehouse> component from lucide-react directly.
const WAREHOUSE_GLYPH =
  '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" ' +
  'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
  '<path d="M3 21V9l9-6 9 6v12"/><path d="M9 21V12h6v9"/></svg>';

/**
 * Tailwind's JIT class scanner reads this file as plain text, so both variants'
 * classes must appear as literal strings here (a dynamically-interpolated class
 * name would never be picked up) — hence two full template strings, not one
 * with conditionals inside.
 */
function buildPinIcon(kind: "pharmacy" | "depo") {
  const html =
    kind === "depo"
      ? `<div class="relative flex h-8 w-8 items-center justify-center rounded-full bg-ink-strong text-lime-soft ring-2 ring-white shadow-[0_4px_10px_rgba(15,23,42,0.35)]">${WAREHOUSE_GLYPH}<span class="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 rounded-[2px] bg-ink-strong"></span></div>`
      : `<div class="relative flex h-8 w-8 items-center justify-center rounded-full bg-forest ring-2 ring-white shadow-[0_4px_10px_rgba(7,59,45,0.35)]"><span class="h-2.5 w-2.5 rounded-full bg-lime"></span><span class="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 rounded-[2px] bg-forest"></span></div>`;
  return L.divIcon({ html, className: "", iconSize: [32, 40], iconAnchor: [16, 38], popupAnchor: [0, -36] });
}

// Built once at module scope — identical for every marker of that kind.
const pharmacyIcon = buildPinIcon("pharmacy");
const depoIcon = buildPinIcon("depo");

export interface LocationsMapProps {
  className?: string;
}

export function LocationsMap({ className }: LocationsMapProps) {
  const { c, tr } = useI18n();

  const pinned = useMemo(
    () => locations.filter((l): l is PinnedLocation => l.coords != null),
    [],
  );
  const bounds = useMemo<LatLngTuple[]>(
    () => pinned.map((l) => [l.coords.lat, l.coords.lng]),
    [pinned],
  );

  return (
    <div className={cn(MAP_PANEL_SHELL, className)} role="region" aria-label={c.locations_map_aria}>
      <MapContainer
        bounds={bounds}
        boundsOptions={{ padding: [32, 32], maxZoom: 15 }}
        scrollWheelZoom={false}
        className={MAP_PANEL_HEIGHT}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={20}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>'
        />
        {pinned.map((loc) => (
          <Marker
            key={loc.id}
            position={[loc.coords.lat, loc.coords.lng]}
            icon={loc.id === "depo" ? depoIcon : pharmacyIcon}
            alt={loc.name}
            keyboard
          >
            <Popup maxWidth={260} minWidth={200} autoPan>
              <div role="group" aria-label={loc.name} className="p-0.5">
                <p className="text-sm font-bold text-ink-strong">{loc.name}</p>
                {loc.note && <p className="mt-0.5 text-xs font-medium text-forest">{tr(loc.note)}</p>}
                <p className="mt-1 text-xs leading-snug text-ink-muted">{loc.address}</p>
                <Button
                  href={mapsHref(loc.mapsQuery)}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="lime"
                  size="sm"
                  className="mt-3"
                  leftIcon={<Navigation className="h-3.5 w-3.5" aria-hidden="true" />}
                >
                  {c.location_directions}
                </Button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Legend — never rely on pin color alone to convey the Depo distinction. */}
      <div className="flex flex-wrap items-center gap-4 border-t border-line bg-surface-soft px-4 py-2.5 text-xs text-ink-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-forest" aria-hidden="true" />
          {c.locations_map_legend_pharmacy}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-ink-strong" aria-hidden="true" />
          {c.locations_map_legend_depo}
        </span>
      </div>
    </div>
  );
}
