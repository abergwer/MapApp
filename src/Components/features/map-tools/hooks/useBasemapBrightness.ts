import { useEffect, type RefObject } from 'react';

/** Dim the basemap canvas — same behaviour as the legacy MapStyleBar. */
export function useBasemapBrightness(
  containerRef: RefObject<HTMLDivElement | null>,
  brightness: number,
): void {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const basemap = container.querySelector<HTMLElement>(
      '.leaflet-tile-pane, .maplibregl-canvas, .cesium-widget canvas',
    );

    if (basemap) basemap.style.filter = `brightness(${brightness / 100})`;

    return () => {
      if (basemap) basemap.style.filter = '';
    };
  }, [containerRef, brightness]);
}
