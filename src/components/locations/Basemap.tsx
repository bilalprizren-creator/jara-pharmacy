import { useEffect, useState } from "react";
import { TileLayer, useMap } from "react-leaflet";
import { maplibreGL } from "@maplibre/maplibre-gl-leaflet";
import "maplibre-gl/dist/maplibre-gl.css";

// CARTO started stamping "API KEY REQUIRED" across keyless basemap tiles in
// August 2026. OpenFreeMap serves the same Positron look with no key, no
// account and commercial use allowed — but only as vector tiles, which
// MapLibre draws on a WebGL canvas inside Leaflet. The layer credits
// OpenFreeMap / OpenMapTiles / OpenStreetMap itself, from the style's sources.
const POSITRON_STYLE = "https://tiles.openfreemap.org/styles/positron";

function canUseWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * The street map under the pins. Without WebGL it falls back to plain
 * OpenStreetMap raster tiles: nothing above this component catches errors, so
 * a MapLibre throw escaping the effect would blank the whole page, not just
 * the map. The vector layer gives Leaflet no zoom limit of its own, which is
 * why LocationsMap sets maxZoom on the MapContainer.
 */
export function Basemap() {
  const map = useMap();
  const [vector, setVector] = useState(canUseWebGL);

  useEffect(() => {
    if (!vector) return;
    const layer = maplibreGL({ style: POSITRON_STYLE });
    try {
      layer.addTo(map);
    } catch {
      // MapLibre threw part-way through onAdd, after Leaflet had registered the
      // layer and its handlers — and the layer's own onRemove would throw too.
      // Unhook it with a stand-in that only drops the empty container.
      layer.onRemove = () => {
        layer.getContainer()?.remove();
        return layer;
      };
      map.removeLayer(layer);
      setVector(false);
      return;
    }
    return () => {
      layer.remove();
    };
  }, [map, vector]);

  if (vector) return null;
  return (
    <TileLayer
      url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      maxZoom={19}
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
    />
  );
}
