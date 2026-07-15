import { useEffect, type RefObject } from 'react';
import type { BaseMap } from '../../../../stores/MapStyleStore';

function buildFilter(brightness: number, baseMap: BaseMap): string {
  const b = brightness / 100;
  if (baseMap === 'satellite') {
    // Darker ops look: lower brightness/saturation, slight contrast boost.
    return `brightness(${b}) saturate(0.62) contrast(1.18)`;
  }
  return `brightness(${b})`;
}

/**
 * Dim the basemap canvas only (Leaflet / MapLibre / Cesium).
 * Does not touch Deck.gl overlays, markers, or floating windows.
 */
export function useBasemapBrightness(
  containerRef: RefObject<HTMLDivElement | null>,
  brightness: number,
  baseMap: BaseMap = 'satellite',
): void {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const basemap = container.querySelector<HTMLElement>(
      '.leaflet-tile-pane, .maplibregl-canvas, .cesium-widget canvas',
    );

    if (basemap) basemap.style.filter = buildFilter(brightness, baseMap);

    return () => {
      if (basemap) basemap.style.filter = '';
    };
  }, [containerRef, brightness, baseMap]);
}
